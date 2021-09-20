import torch
import torch.nn as nn
import torch.nn.functional as F
from pruning_layer import PruningLayer

class LeNet(nn.Module):
    def __init__(self, dataset='CIFAR10'):
        super(LeNet, self).__init__()

        if dataset == 'CIFAR10':
            nunits_input = 3
            nuintis_fc = 32 * 5 * 5
        elif dataset == 'MNIST':
            nunits_input = 1
            nuintis_fc = 32 * 4 * 4

        self.conv1 = nn.Conv2d(nunits_input, 16, 5)
        self.c1_prune = PruningLayer(16, 16, [1, -1, 1, 1])
        
        self.conv2 = nn.Conv2d(16, 32, 5)
        self.c2_prune = PruningLayer(32, 32, [1, -1, 1, 1])
        
        self.fc1 = nn.Linear(nuintis_fc, 120)
        self.f1_prune = PruningLayer(120, 120, [1, -1])
        
        self.fc2 = nn.Linear(120, 84)
        self.f2_prune = PruningLayer(120, 84)

        self.fc3 = nn.Linear(84, 10)

    def forward(self, x):
        out = F.relu(self.conv1(x))
        out = F.max_pool2d(out, 2)
        out = self.c1_prune(out)

        out = F.relu(self.conv2(out))
        out = F.max_pool2d(out, 2)
        out = self.c2_prune(out)

        out = out.view(out.size(0), -1)

        out = F.relu(self.fc1(out))
        out = self.f1_prune(out)

        out = F.relu(self.fc2(out))
        out = self.f2_prune(out)

        out = self.fc3(out)

        return out

        
