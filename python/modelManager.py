import torch
from torchvision import datasets, transforms
from python.model import LeNet, LeNet_5, ConvNet
from python.FeatureVisualization import getFeatureVisualization
import numpy as np
import torch.utils.data as data
import os

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
            'data/model/LetNet/letnet300_trained.pkl'
        )

        # self.train_model.prune_by_percentile(float(90))
        # self.train_model.prune_by_percentile_left(float(95))

        # load untrained model
        # self.untrain_model = self.loadModel(
        #   'data/model/DrawNet/googledraw_trained.pkl')
        
        self.untrain_model = self.loadModel(
            'data/model/LetNet/letnet300_trained.pkl'
        )

        self.datasets = self.loadValidationData()

    def config(self, percentage, model):

        self.percentage = percentage

        if model == 'mnist1':
            self.path = 'data/model/LetNet/letnet300_trained.pkl'
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

        return model

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

        for data, target in test_loader:
            data = data.view(-1, 1, 28, 28)
            device_data = data.to('cpu')
            subset.append(device_data.tolist())

        result = self.train_model.activationPattern(subset)
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
        data_loader = torch.utils.data.DataLoader(self.datasets)
        with torch.no_grad():
            for data, target in data_loader:
                device_data, device_target = data.to('cpu'), target.to('cpu')
                output = self.train_model(device_data)
                # get the index of the max log-probability
                pred = output.data.max(1, keepdim=True)[1]

                if device_target[0] == pred[0][0]:
                    prediction_result.append(1)
                else:
                    prediction_result.append(0)
        return prediction_result

    def getTop10ActiveSample(self, model, layer, index):
        rs = []
        test_loader = torch.utils.data.DataLoader(self.datasets)
        scores = []
        with torch.no_grad():
            for data, target in test_loader:
                device_data, device_target = data.to('cpu'), target.to('cpu')
                score = model.getActivationValue(device_data, layer, index)
                scores.append(score.item())
        indexs = (-np.array(scores, dtype=np.float)).argsort()[:200]
         
        for i in indexs:
            rs.append(self.datasets[i][0][0].tolist())
        return {'featureVis':rs, 'scores':scores}

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