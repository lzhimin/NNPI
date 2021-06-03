import torch
import torch.nn as nn
import torch.nn.functional as F
from python.prune import PruningModule, MaskedLinear
import numpy as np


class LeNet(PruningModule):

    def __init__(self, mask=False):
        super(LeNet, self).__init__()
        linear = MaskedLinear if mask else nn.Linear

        self.fc1 = linear(784, 300)
        self.fc2 = linear(300, 100)
        self.fc3 = linear(100, 10)

        self.input_embedding = []
        self.fc1_embedding = []
        self.fc2_embedding = []
        self.fc3_embedding = []

    def forward(self, x):
        x = x.view(-1, 784)
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = F.log_softmax(self.fc3(x), dim=1)

        return x

    def activationPattern(self, dataset):

        layer1_activation = []
        layer2_activation = []

        for i in range(len(dataset)):
            x = F.relu(self.fc1(torch.tensor(dataset[i])))
            layer1_activation.append(x.tolist())
            x = F.relu(self.fc2(x))
            layer2_activation.append(x.tolist())

        activation_summary = {}
        activation_summary['fc1'] = np.sum(
            np.array(layer1_activation) != 0, axis=0).tolist()

        activation_summary['fc2'] = np.sum(
            np.array(layer2_activation) != 0, axis=0).tolist()

        return activation_summary

    def activationPruning(self, dataset):
        layer1_activation = []
        layer2_activation = []

        for i in range(len(dataset)):
            x = F.relu(self.fc1(torch.tensor(dataset[i])))
            layer1_activation.append(x.tolist())
            x = F.relu(self.fc2(x))
            layer2_activation.append(x.tolist())

        layer1 = np.sum(layer1_activation, axis=0)
        layer2 = np.sum(layer2_activation, axis=0)
        self.fc1.mask[[layer1 == 0]] = 0
        self.fc2.mask[[layer2 == 0]] = 0

    def sparsity(self):
        print(np.sum((self.fc1.mask == 0).tolist()) /
              len(np.array(self.fc1.mask.tolist()).flatten()))
        print(np.sum((self.fc2.mask == 0).tolist()) /
              len(np.array(self.fc2.mask.tolist()).flatten()))

    def getModelSummary(self):
        pass


class LeNet_5(PruningModule):
    def __init__(self, mask=False):
        super(LeNet_5, self).__init__()
        linear = MaskedLinear if mask else nn.Linear

        self.conv1 = nn.Conv2d(1, 6, kernel_size=(5, 5))
        self.conv2 = nn.Conv2d(6, 16, kernel_size=(5, 5))
        self.fc1 = linear(256, 120)
        self.fc2 = linear(120, 84)
        self.fc3 = linear(84, 10)

    def forward(self, x):
        # Conv1
        x = self.conv1(x)
        x = F.relu(x)
        x = F.max_pool2d(x, kernel_size=(2, 2), stride=2)

        # Conv2
        x = self.conv2(x)
        x = F.relu(x)
        x = F.max_pool2d(x, kernel_size=(2, 2), stride=2)

        # Fully-connected
        x = x.view(x.shape[0], -1)
        x = self.fc1(x)
        x = F.relu(x)

        x = self.fc2(x)
        x = F.relu(x)

        x = F.log_softmax(self.fc3(x), dim=1)

        return x

    def activationPattern(self, dataset):
        conv1_activation = []
        conv2_activation = []
        fc1_activation = []
        fc2_activation = []

        for i in range(len(dataset)):
            # conv1
            x = self.conv1(torch.tensor(dataset[i]))
            x = F.relu(x)

            conv1_activation.append(x.tolist())
            x = F.max_pool2d(x, kernel_size=(2, 2), stride=2)

            # Conv2
            x = self.conv2(x)
            x = F.relu(x)
            conv2_activation.append(x.tolist())
            x = F.max_pool2d(x, kernel_size=(2, 2), stride=2)

            # Fully-connected
            x = x.view(x.shape[0], -1)
            x = self.fc1(x)
            x = F.relu(x)
            fc1_activation.append(x.tolist())

            x = self.fc2(x)
            x = F.relu(x)
            fc2_activation.append(x.tolist())
