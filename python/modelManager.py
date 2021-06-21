from re import T, sub
import torch
from torchvision import datasets, transforms
from python.model import LeNet, LeNet_5
import numpy as np


class ModelManager:

    def __init__(self, device, model_type='LetNet', path='data/model/LetNet/'):

        # device
        self.device = device

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

    def fetch_neuron_activation_to_input(self, neuron_info):

        test_loader = torch.utils.data.DataLoader(self.datasets)
        subset = []

        for data, target in test_loader:
            device_data = data.to('cpu')
            subset.append(device_data.tolist())

        result = self.train_model.neuron_activation_to_data(
            neuron_info, subset)

        return {"input_activation_pattern": result}

    def prune_neural_network(self, percentage):
        self.train_model = self.loadModel(
            'data/model/LetNet/'+self.model+'_trained.pkl')
        self.train_model.prune_by_percentile(float(percentage))
