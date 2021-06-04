from re import T
import torch
from torchvision import datasets, transforms
from python.model import LeNet, LeNet_5
import numpy as np


class ModelManager:

    def __init__(self, device, model_type='LetNet', path='data/model/LetNet/'):

        # device
        self.device = device

        # load train model
        self.train_model = self.loadModel(
            'data/model/LetNet/letnet300_trained.pkl')
        # load untrained model
        self.untrain_model = self.loadModel(
            'data/model/LetNet/letnet300_untrained.pkl')

        self.datasets = self.loadValidationData()

    def loadModel(self, path):
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
        subset_indices = (np.arange(1500)).astype('int')
        mnist = torch.utils.data.Subset(mnist, subset_indices)

        return mnist

    def fetch_activation_pattern(self, indexs):

        dataset = torch.utils.data.Subset(self.datasets, indexs)
        test_loader = torch.utils.data.DataLoader(dataset)
        subset = []

        for data, target in test_loader:
            device_data = data.to('cpu')
            subset.append(device_data)

        result = self.train_model.activationPattern(subset)
        return result
