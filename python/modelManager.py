import torch
from torchvision import datasets, transforms
from python.model import LeNet, LeNet_5, ConvNet
from python.FeatureVisualization import getFeatureVisualization,getSaliencyGradientWithNode
import numpy as np
import torch.utils.data as data
import os
import torch.nn.functional as F

class ModelManager:

    def __init__(self, device='cpu', model_type='LetNet', path='data/model/LetNet/'):
        # device
        self.device = device

        self.model = 'letnet300'
        #self.model = 'letnet_5'
        #self.model = 'googledraw'

        # load train model
        #self.train_model = self.loadModel(
        #    'data/model/LetNet/'+self.model+'_trained.pkl')

        #self.train_model = self.loadModel(
        #    'data/model/DrawNet/googledraw_trained.pkl'
        #)

        self.train_model = self.loadModel(
            'data/model/letnet_bias/model_10.pkl'
        )

        # self.train_model.prune_by_percentile(float(90))
        # self.train_model.prune_by_percentile_left(float(95))

        # load untrained model
        # self.untrain_model = self.loadModel(
        #   'data/model/DrawNet/googledraw_trained.pkl')
        
        self.untrain_model = self.loadModel(
            'data/model/letnet_bias/model_10.pkl'
        )

        self.datasets = self.loadValidationData()

    def config(self, percentage, model, epoch=10):

        self.percentage = percentage

        if model == 'mnist1':
            self.path = 'data/model/letnet_bias/model_'+str(epoch)+'.pkl'
            self.model = 'letnet300'
        elif model == 'mnist2':
            self.path = 'data/model/LetNet/letnet_5_trained.pkl'
            self.model = 'letnet_5'
        elif model == 'google':
            self.path = 'data/model/DrawNet/googledraw_trained.pkl'
            self.model = 'googledraw'

        self.train_model = self.loadModel(self.path)
        self.train_model.prune_by_percentile(self.percentage)

        
        self.untrain_model = self.loadModel(self.path)
        self.datasets = self.loadValidationData() 

    def loadModel(self, path):
        model = None
        if self.model == 'letnet_5':
            model = LeNet_5(mask=True).to(self.device)
        elif self.model == 'letnet300':
            model = LeNet(mask=True).to(self.device)
        elif self.model == 'googledraw':
            model = ConvNet(mask=True).to(self.device)

        model.load_state_dict(torch.load(path))
        model.eval()

        for name, param in model._modules.items():
            if 'bias' not in name and 'mask' not in name and 'fc3' not in name:
                self.hooks = [param.register_forward_hook(self.forward_hook), param.register_backward_hook(self.backward_hook)]

        return model
    
    def forward_hook(self, m, i, o):
        with torch.no_grad(): 
            m._tp_activation = o.detach().clone()
        
    def backward_hook(self, m, i, o):
        taylor = -1. * (o[0] * m._tp_activation)
        taylor = taylor.abs()
        sensitivity = o[0].abs()

        if not hasattr(m, '_tp_sensitivity'):
            m._tp_sensitivity = sensitivity
        else:
            m._tp_sensitivity = np.concatenate((m._tp_sensitivity, sensitivity.detach().cpu().numpy()), 0)


        if not hasattr(m, '_tp_taylor'):
            m._tp_taylor = taylor.detach().cpu().numpy()
        else:
            m._tp_taylor = np.concatenate((m._tp_taylor, taylor.detach().cpu().numpy()), 0)
              
    def loadValidationData(self):
        # load dataset
        data = None
        if self.model == 'letnet300' or self.model == 'letnet_5':
            data = datasets.MNIST(root='data/', train=False, transform=transforms.Compose([
                transforms.ToTensor()
            ]))
            
        elif self.model == 'googledraw':
            data = QD_Dataset(mtype="test", root='data/googleDraw')

        # select your indices here as a list
        subset_indices = (np.arange(3000)).astype('int')
        data = torch.utils.data.Subset(data, subset_indices)

        return data

    def fetch_activation_pattern(self, indexs):
        dataset = torch.utils.data.Subset(self.datasets, indexs)
        test_loader = torch.utils.data.DataLoader(dataset)
        subset = []
        subset_label = []

        for data, target in test_loader:
            data = data.view(-1, 1, 28, 28)
            device_data = data.to('cpu')
            output = self.train_model(data)
            loss = F.nll_loss(output, target)
            loss.backward()
            subset.append(device_data.tolist())
            subset_label.append(target.to('cpu').item())
        
        rs = {}
        # get taylor expansion criteria for each neuron
        #for name, param in self.train_model._modules.items():
        #    if 'bias' not in name and 'mask' not in name and 'fc3' not in name:
        #        rs[name+"_taylor"] = np.sum(param._tp_taylor, axis=0).tolist()
        #        rs[name+"_sensitivity"] = np.sum(param._tp_sensitivity, axis=0).tolist()

        #for h in self.hooks:
        #    h.remove()

        result = self.train_model.activationPattern(subset)
        result.update(rs)

        return {'activation_pattern': result, 'selectedData': subset}

    def mapping_neuron_activation_to_input(self, neuron_info):

        test_loader = torch.utils.data.DataLoader(self.datasets)
        subset = []

        for data, target in test_loader:
            device_data = data.to('cpu')
            subset.append(device_data.tolist())

        result = self.train_model.neuron_activation_to_data(
            neuron_info, subset)

        # get the feature visualization of the selected neuron
        feature = np.zeros(28 *28) #getFeatureVisualization(self.train_model, neuron_info['layername'], neuron_info['indexs'][0])

        return {"input_activation_pattern": result, 'feature_vis':[neuron_info['layername'], feature.tolist()]}

    def prune_neural_network(self, percentage):
        self.train_model = self.loadModel(self.path)
        self.train_model.prune_by_percentile(float(percentage))

    def prune_unselected_neuron_return_prediction_result(self, selected_neuron):

        #reload a new model for the analysis
        self.train_model = self.loadModel(self.path)

        for key in selected_neuron:
            self.train_model.pruned_unselected_neuron(key, selected_neuron[key])


        

        prediction_result = []
        confusionMatrix = np.zeros((10, 10))

        data_loader = torch.utils.data.DataLoader(self.datasets)
        with torch.no_grad():
            for data, target in data_loader:
                device_data, device_target = data.to('cpu'), target.to('cpu')
                output = self.train_model(device_data)
                
                # get the index of the max log-probability
                pred = output.data.max(1, keepdim=True)[1]
                confusionMatrix[device_target[0]][pred[0][0]] += 1

                if device_target[0] == pred[0][0]:
                    prediction_result.append(torch.exp(output)[0][pred[0][0]].item())
                else:
                    prediction_result.append(-torch.exp(output)[0][pred[0][0]].item())
        return prediction_result, confusionMatrix.tolist()

    def getTop10ActiveSample(self, model, layer, index):
        rs = []
        test_loader = torch.utils.data.DataLoader(self.datasets)
        scores = []
        with torch.no_grad():
            for data, target in test_loader:
                device_data, device_target = data.to('cpu'), target.to('cpu')
                score = model.getActivationValue(device_data, layer, index)
                scores.append(score.item())
        indexs = (-np.array(scores, dtype=np.float)).argsort()[:20]
         
        for i in indexs:
            img = self.datasets[i][0][0].tolist()
            rs.append((getSaliencyGradientWithNode(model, layer, index, img).transpose()).tolist())

        return {'featureVis':rs, 'scores':scores}

    def generateAdversialExample(self, model, data):
        pass

class QD_Dataset(data.Dataset):

    def __init__(self, mtype, root='Dataset'):
        self.data, self.target, self.num_classes = self.load_dataset(root, mtype)
        self.data = torch.from_numpy(self.data)
        self.target = torch.from_numpy(self.target)
        print("Dataset "+mtype+" loading done.")
        print("*"*50+"\n")

    def load_dataset(self, root, mtype):
        num_classes = 10

        # load data from cache
        if os.path.exists(os.path.join(root, mtype+'.npz')):
            data_cache = np.load(os.path.join(root, mtype+'.npz'))
            return data_cache["data"].astype('float32'), \
                data_cache["target"].astype('int64'), num_classes

        else:
            raise FileNotFoundError("%s doesn't exist!" %
                                    os.path.join(root, mtype+'.npz'))

    def __getitem__(self, index):
        return self.data[index], self.target[index]

    def __len__(self):
        return len(self.data)

    def get_number_classes(self):
        return self.num_classes