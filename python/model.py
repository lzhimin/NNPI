import torch
import torch.nn as nn
import torch.nn.functional as F
from python.prune import PruningModule, MaskedLinear
import numpy as np
from sklearn.manifold import TSNE


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
        x = F.relu(self.fc1(x))  # this is very interesting.
        x = F.relu(self.fc2(x))
        x = F.log_softmax(self.fc3(x), dim=1)

        return x

    def activationPattern(self, dataset):
        layer1_activation = []
        layer2_activation = []

        for i in range(len(dataset)):
            x = F.relu(self.fc1(torch.tensor(
                np.array(dataset[i]).flatten().tolist())))
            layer1_activation.append(x.tolist())
            x = F.relu(self.fc2(x))
            layer2_activation.append(x.tolist())

        activation_summary = {}
        # T-sne embedding

        activation_summary['fc1_embedding'] = np.loadtxt(
            'fc1_embedding.out', delimiter=',').tolist()
        #TSNE(n_components=2).fit_transform(np.array(layer1_activation).transpose(1, 0)).tolist()

        activation_summary['fc2_embedding'] = np.loadtxt(
            'fc2_embedding.out', delimiter=',').tolist()
        #TSNE(n_components=2).fit_transform(np.array(layer2_activation).transpose(1, 0)).tolist()

        # np.savetxt('fc1_embedding.out',
        #           activation_summary['fc1_embedding'], delimiter=',')
        # np.savetxt('fc2_embedding.out',
        #           activation_summary['fc2_embedding'], delimiter=',')

        activation_summary['fc1'] = np.sum(
            np.array(layer1_activation) != 0, axis=0).tolist()

        activation_summary['fc2'] = np.sum(
            np.array(layer2_activation) != 0, axis=0).tolist()

        return activation_summary

    def neuron_activation_to_data(self, neuron_info, dataset):
        neuron_indexs = neuron_info['indexs']
        layername = neuron_info['layername']

        input_indexs = []
        for i in range(len(dataset)):
            x = F.relu(self.fc1(torch.tensor(
                np.array(dataset[i]).flatten().tolist())))

            if layername == 'fc1':
                for index in neuron_indexs:
                    if x[index] != 0:
                        input_indexs.append(i)

            x = F.relu(self.fc2(x))

            if layername == 'fc2':
                for index in neuron_indexs:
                    if x[index] != 0:
                        input_indexs.append(i)

        return input_indexs

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

    def pruned_unselected_neuron(self, info):
        if info['name'] == 'fc1':
            self.fc1.mask[info['pruned_neuron']] = 0
        if info['name'] == 'fc2':
            self.fc2.mask[info['pruned_neuron']] = 0

    def sparsity(self):
        print(np.sum((self.fc1.mask == 0).tolist()) /
              len(np.array(self.fc1.mask.tolist()).flatten()))
        print(np.sum((self.fc2.mask == 0).tolist()) /
              len(np.array(self.fc2.mask.tolist()).flatten()))


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
            x = F.max_pool2d(x, kernel_size=(2, 2), stride=2)
            conv1_activation.append(x.tolist())

            # Conv2
            x = self.conv2(x)
            x = F.relu(x)
            x = F.max_pool2d(x, kernel_size=(2, 2), stride=2)
            conv2_activation.append(x.tolist())

            # Fully-connected
            x = x.view(x.shape[0], -1)
            x = self.fc1(x)
            x = F.relu(x)
            fc1_activation.append(x.tolist())

            x = self.fc2(x)
            x = F.relu(x)
            fc2_activation.append(x.tolist())

        activation_summary = {}
        activation_summary['conv1'] = []
        for filter in self.conv1.weight.data.numpy():
            activation_summary['conv1'].append(np.linalg.norm(filter).tolist())

        activation_summary['conv2'] = []
        for filter in self.conv2.weight.data.numpy():
            activation_summary['conv2'].append(np.linalg.norm(filter).tolist())

        #activation_summary['conv1'] = np.sum(
        #    np.array(conv1_activation) != 0, axis=0).tolist()

        #activation_summary['conv2'] = np.sum(
        #    np.array(conv2_activation) != 0, axis=0).tolist()

        activation_summary['fc1'] = np.sum(
            np.array(fc1_activation) != 0, axis=0).tolist()[0]

        activation_summary['fc2'] = np.sum(
            np.array(fc2_activation) != 0, axis=0).tolist()[0]

        return activation_summary

class drawingNet(PruningModule):

    def __init__(self, mask=False, numclasses=10):
        super(drawingNet, self).__init__()
        linear = MaskedLinear if mask else nn.Linear

        self.conv1 = nn.Conv2d(1, 64, 3, 1, 1)
        self.conv2 = nn.Conv2d(64, 256, 3, 1, 1)
        self.conv3 = nn.Conv2d(256, 512, 3, 1, 1)
        self.fc1 = linear(512 * 3 * 3, 512)
        self.fc2 = linear(512, numclasses)

    def forward(self, x):

        x = self.conv1(x)
        x = F.relu(x)
        x = F.max_pool2d(x, kernel_size=2)

        x = self.conv2(x)
        x = F.relu(x)
        x = F.max_pool2d(x, kernel_size=2)

        x = self.conv3(x)
        x = F.relu(x)
        x = F.max_pool2d(x, kernel_size=2)

        # Fully-connected
        x = x.view(x.shape[0], -1)
        x = self.fc1(x)
        x = F.relu(x)

        x = F.log_softmax(self.fc2(x), dim=1)

        return x

class Alexnet(PruningModule):

    def __init__(self, mask=False):
        super(Alexnet, self).__init__()
        linear = MaskedLinear if mask else nn.Linear

        # GROUP 1
        self.conv1 = nn.Conv2d(in_channels=3, out_channels=64,
                               kernel_size=11, stride=4, padding=2)

        self.maxpool1 = nn.MaxPool2d(kernel_size=3, stride=2)

        self.conv2 = nn.Conv2d(in_channels=64, out_channels=192,
                               kernel_size=5, padding=2)

        self.maxpool2 = nn.MaxPool2d(kernel_size=3, stride=2)

        self.conv3 = nn.Conv2d(in_channels=192, out_channels=384,
                               kernel_size=3, padding=1)

        self.conv4 = nn.Conv2d(in_channels=384, out_channels=256,
                               kernel_size=3, padding=1)

        self.conv5 = nn.Conv2d(in_channels=256, out_channels=256,
                               kernel_size=3, padding=1)

        self.maxpool5 = nn.MaxPool2d(kernel_size=3, stride=2)

        self.fc1 = linear(in_features=256 * 6 * 6, out_features=4096)
        self.fc2 = linear(in_features=4096, out_features=4096)
        self.fc3 = linear(in_features=4096, out_features=10)

    def forward(self, x):
         # GROUP 1
        x = self.conv1(x)
        x = F.relu(x)
        x = self.maxpool1(x)

        x = self.conv2(x)
        x = F.relu(x)
        x = self.maxpool2(x)

        x = self.conv3(x)
        x = F.relu(x)

        x = self.conv4(x)
        x = F.relu(x)

        x = self.conv5(x)
        x = F.relu(x)
        x = self.maxpool5(x)

        x = x.view(x.size(0), -1)
        # print(output.shape)

        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = F.log_softmax(self.fc3(x), dim=1)

        return x

class VGG16(PruningModule):

    def __init__(self, mask=False):
        super(VGG16, self).__init__()
        linear = MaskedLinear if mask else nn.Linear

        # GROUP 1
        self.conv1_1 = nn.Conv2d(in_channels=3, out_channels=64,
                                 kernel_size=3, stride=1, padding=(1, 1))
        self.conv1_2 = nn.Conv2d(in_channels=64, out_channels=64,
                                 kernel_size=3, stride=1, padding=(1, 1))

        # After pooling, the length and width are halved output:16*16*64
        self.maxpool1 = nn.MaxPool2d(2)

        # GROUP 2
        self.conv2_1 = nn.Conv2d(in_channels=64, out_channels=128,
                                 kernel_size=3, stride=1, padding=(1, 1))
        self.conv2_2 = nn.Conv2d(in_channels=128, out_channels=128,
                                 kernel_size=3, stride=1, padding=(1, 1))  # output:16*16*128

        # After pooling, the length and width are halved output:8*8*128
        self.maxpool2 = nn.MaxPool2d(2)

        # GROUP 3
        self.conv3_1 = nn.Conv2d(in_channels=128, out_channels=256,
                                 kernel_size=3, stride=1, padding=(1, 1))
        self.conv3_2 = nn.Conv2d(in_channels=256, out_channels=256,
                                 kernel_size=3, stride=1, padding=(1, 1))  # output:8*8*256
        self.conv3_3 = nn.Conv2d(
            in_channels=256, out_channels=256, kernel_size=1, stride=1)  # output:8*8*256

        self.maxpool3 = nn.MaxPool2d(2)

        # GROUP 4
        self.conv4_1 = nn.Conv2d(in_channels=256, out_channels=512,
                                 kernel_size=3, stride=1, padding=1)  # output:4*4*512
        self.conv4_2 = nn.Conv2d(in_channels=512, out_channels=512,
                                 kernel_size=3, stride=1, padding=1)  # output:4*4*512
        self.conv4_3 = nn.Conv2d(
            in_channels=512, out_channels=512, kernel_size=1, stride=1)  # output:4*4*512
        self.maxpool4 = nn.MaxPool2d(2)

        # GROUP 5
        self.conv5_1 = nn.Conv2d(in_channels=512, out_channels=512,
                                 kernel_size=3, stride=1, padding=1)  # output:14*14*512
        self.conv5_2 = nn.Conv2d(in_channels=512, out_channels=512,
                                 kernel_size=3, stride=1, padding=1)  # output:14*14*512
        self.conv5_3 = nn.Conv2d(
            in_channels=512, out_channels=512, kernel_size=1, stride=1)  # output:14*14*512
        self.maxpool5 = nn.MaxPool2d(2)

        self.fc1 = linear(in_features=512, out_features=256)
        self.fc2 = linear(in_features=256, out_features=256)
        self.fc3 = linear(in_features=256, out_features=10)

    def forward(self, x):

        # GROUP 1
        output = self.conv1_1(x)
        output = F.relu(output)
        output = self.conv1_2(output)
        output = F.relu(output)
        output = self.maxpool1(output)

        # GROUP 2
        output = self.conv2_1(output)
        output = F.relu(output)
        output = self.conv2_2(output)
        output = F.relu(output)
        output = self.maxpool2(output)

        # GROUP 3
        output = self.conv3_1(output)
        output = F.relu(output)
        output = self.conv3_2(output)
        output = F.relu(output)
        output = self.conv3_3(output)
        output = F.relu(output)
        output = self.maxpool3(output)

        # GROUP 4
        output = self.conv4_1(output)
        output = F.relu(output)
        output = self.conv4_2(output)
        output = F.relu(output)
        output = self.conv4_3(output)
        output = F.relu(output)
        output = self.maxpool4(output)

        # GROUP 5
        output = self.conv5_1(output)
        output = F.relu(output)
        output = self.conv5_2(output)
        output = F.relu(output)
        output = self.conv5_3(output)
        output = F.relu(output)
        output = self.maxpool5(output)

        output = output.view(x.size(0), -1)

        output = self.fc1(output)
        output = self.fc2(output)
        output = self.fc3(output)

        return output

    def activationPattern(self, dataset):
        pass
