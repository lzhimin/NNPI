from re import T, sub
import torch
from torchvision import datasets, transforms
from python.model import LeNet, LeNet_5
from python.FeatureVisualization import getFeatureVisualization
import numpy as np


class ModelManager:

    def __init__(self, device, model_type='LetNet', path='data/model/LetNet/'):

        # device
        self.device = 'cpu'

        self.model = 'letnet300'
        #self.model = 'letnet_5'

        # load train model
        self.train_model = self.loadModel(
            'data/model/LetNet/'+self.model+'_trained.pkl')

        # self.train_model.prune_by_percentile(float(90))
        # self.train_model.prune_by_percentile_left(float(95))

        # load untrained model
        self.untrain_model = self.loadModel(
            'data/model/LetNet/'+self.model+'_untrained.pkl')

        self.datasets = self.loadValidationData()

    def loadModel(self, path):
        model = None
        if self.model == 'letnet_5':
            model = LeNet_5(mask=True).to(self.device)
        elif self.model == 'letnet300':
            model = LeNet(mask=True).to(self.device)

        model.load_state_dict(torch.load(path))
        model.eval()

        return model

    def loadValidationData(self):
        # load dataset
        mnist = datasets.MNIST(root='data/', train=False, transform=transforms.Compose([
            transforms.ToTensor()
        ]))

        # select your indices here as a list
        subset_indices = (np.arange(3000)).astype('int')
        mnist = torch.utils.data.Subset(mnist, subset_indices)

        return mnist

    def fetch_activation_pattern(self, indexs):

        dataset = torch.utils.data.Subset(self.datasets, indexs)
        test_loader = torch.utils.data.DataLoader(dataset)
        subset = []

        for data, target in test_loader:
            device_data = data.to('cpu')
            subset.append(device_data.tolist())

        result = self.train_model.activationPattern(subset)
        return {'activation_pattern': result, 'selectedData': subset}

    def mapping_neuron_activation_to_input(self, neuron_info):

        print(neuron_info)

        test_loader = torch.utils.data.DataLoader(self.datasets)
        subset = []

        for data, target in test_loader:
            device_data = data.to('cpu')
            subset.append(device_data.tolist())

        result = self.train_model.neuron_activation_to_data(
            neuron_info, subset)

        # get the feature visualization of the selected neuron
        feature = getFeatureVisualization(self.train_model, neuron_info['layername'], neuron_info['indexs'][0])

        return {"input_activation_pattern": result, 'feature_vis':[neuron_info['layername'], feature.tolist()]}

    def prune_neural_network(self, percentage):
        self.train_model = self.loadModel(
            'data/model/LetNet/'+self.model+'_trained.pkl')
        self.train_model.prune_by_percentile(float(percentage))

    def prune_unselected_neuron_return_prediction_result(self, selected_neuron):

        #reload a new model for the analysis
        self.train_model = self.loadModel('data/model/LetNet/'+self.model+'_trained.pkl')
        self.train_model.pruned_unselected_neuron(selected_neuron)
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