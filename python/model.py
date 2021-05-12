import torch
import torch.nn as nn
import torch.nn.functional as F
from python.prune import PruningModule, MaskedLinear
from sklearn.decomposition import PCA
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

    def getLayerActivatioData(self, dataset):
        pass

    def layerActivationEmbedding(self, dataset):

        input_projection = None
        first_layer_projection = None
        second_layer_projection = None
        third_layer_projection = None

        layer1_activation = []
        layer2_activation = []
        layer3_activation = []

        for i in range(len(dataset)):
            x = F.relu(self.fc1(torch.tensor(dataset[i])))
            layer1_activation.append(x.tolist())
            x = F.relu(self.fc2(x))
            layer2_activation.append(x.tolist())
            x = self.fc3(x)
            layer3_activation.append(x.tolist())

        # embedding method
        pca = PCA(n_components=2)

        # input embedding
        if len(self.input_embedding) == 0:
            input_projection = pca.fit_transform(dataset)
            self.input_embedding = pca.components_
        else:
            input_projection = self.input_embedding * dataset

        # first layer embedding
        if len(self.fc1_embedding) == 0:
            first_layer_projection = pca.fit_transform(layer1_activation)
            self.fc1_embedding = pca.components_
        else:
            first_layer_projection = self.fc1_embedding * layer1_activation

        # second layer embedding
        if len(self.fc2_embedding) == 0:
            second_layer_projection = pca.fit_transform(layer2_activation)
            self.fc2_embedding = pca.components_
        else:
            second_layer_projection = self.fc2_embedding * layer2_activation

        # second layer embedding
        if len(self.fc3_embedding) == 0:
            third_layer_projection = pca.fit_transform(layer3_activation)
            self.fc3_embedding = pca.components_
        else:
            third_layer_projection = self.fc3_embedding * layer3_activation

        result = {}
        result['1_input_embedding'] = input_projection.tolist()
        result['2_fc1_embedding'] = first_layer_projection.tolist()
        result['3_fc2_embedding'] = second_layer_projection.tolist()
        result['4_fc3_embedding'] = third_layer_projection.tolist()
        return result


class LeNet_5(PruningModule):
    def __init__(self, mask=False):
        super(LeNet_5, self).__init__()
        linear = MaskedLinear if mask else nn.Linear

        self.conv1 = nn.Conv2d(1, 6, kernel_size=(5, 5))
        self.conv2 = nn.Conv2d(6, 16, kernel_size=(5, 5))
        self.conv3 = nn.Conv2d(16, 120, kernel_size=(5, 5))
        self.fc1 = linear(120, 84)
        self.fc2 = linear(84, 10)

    def forward(self, x):
        # Conv1
        x = self.conv1(x)
        x = F.relu(x)
        x = F.max_pool2d(x, kernel_size=(2, 2), stride=2)

        # Conv2
        x = self.conv2(x)
        x = F.relu(x)
        x = F.max_pool2d(x, kernel_size=(2, 2), stride=2)

        # Conv3
        x = self.conv3(x)
        x = F.relu(x)

        # Fully-connected
        x = x.view(-1, 120)
        x = self.fc1(x)
        x = F.relu(x)
        x = self.fc2(x)
        x = F.log_softmax(x, dim=1)

        return x
