from torchvision import datasets, transforms
from tqdm import tqdm
from torch import nn
import torch
import torch.nn.functional as F
import torch.optim as optim
from utils import progress_bar
import argparse
import sys
import os
sys.path.insert(0, os.path.abspath('..'))

CHECKPOINT_DIR = '../../data/model/VGG'  # model checkpoints
# make checkpoint path directory
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

# Training settings
parser = argparse.ArgumentParser(
    description='PyTorch MNIST pruning from deep compression paper')
parser.add_argument('--batch-size', type=int, default=100, metavar='N',
                    help='input batch size for training (default: 50)')
parser.add_argument('--test-batch-size', type=int, default=1000, metavar='N',
                    help='input batch size for testing (default: 1000)')
parser.add_argument('--epochs', type=int, default=100, metavar='N',
                    help='number of epochs to train (default: 100)')
parser.add_argument('--lr', type=float, default=0.001, metavar='LR',
                    help='learning rate (default: 0.01)')
parser.add_argument('--no-cuda', action='store_true', default=False,
                    help='disables CUDA training')
parser.add_argument('--seed', type=int, default=42, metavar='S',
                    help='random seed (default: 42)')
parser.add_argument('--log-interval', type=int, default=10, metavar='N',
                    help='how many batches to wait before logging training status')
parser.add_argument('--log', type=str, default='log.txt',
                    help='log file name')
parser.add_argument('--sensitivity', type=float, default=2,
                    help="sensitivity value that is multiplied to layer's std in order to get threshold value")
args = parser.parse_args()

use_cuda = True  # not args.no_cuda and torch.cuda.is_available()
device = torch.device("cuda" if use_cuda else 'cpu')


if use_cuda:
    print("Using CUDA")
    torch.cuda.manual_seed(args.seed)
else:
    print("Not using Cuda")


# load the training data
transform = transforms.Compose(
    [transforms.ToTensor(),
     transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))])

batch_size = 50

trainset = datasets.CIFAR10(root='../../data', train=True, transform=transform)

train_loader = torch.utils.data.DataLoader(trainset, batch_size=batch_size,
                                           shuffle=True, num_workers=0, pin_memory=True)
testset = datasets.CIFAR10(root='../../data', train=False, transform=transform)
test_loader = torch.utils.data.DataLoader(testset, batch_size=batch_size,
                                          shuffle=True, num_workers=0, pin_memory=True)
classes = ('plane', 'car', 'bird', 'cat', 'deer',
           'dog', 'frog', 'horse', 'ship', 'truck')

criterion = nn.CrossEntropyLoss()


def train(epochs, model, device, optimizer):
    model.train()
    train_loss = 0
    correct = 0
    total = 0
    for epoch in range(epochs):
        pbar = tqdm(enumerate(train_loader), total=len(train_loader))
        for batch_idx, (data, target) in pbar:
            data, target = data.to(device), target.to(device)
            optimizer.zero_grad()
            outputs = model(data)
            loss = criterion(outputs, target)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()
            _, predicted = outputs.max(1)
            total += target.size(0)
            correct += predicted.eq(target).sum().item()
        print(epoch, train_loss, correct)

        # save(model, str(epoch))
        test(model, device)


def test(model, device):
    model.eval()
    test_loss = 0
    correct = 0
    flag = 0

    with torch.no_grad():
        for data, target in test_loader:
            data, target = data.to(device), target.to(device)
            outputs = model(data)
            # sum up batch loss
            loss = criterion(outputs, target)

            test_loss += loss.item()
            _, predicted = outputs.max(1)
            correct += predicted.eq(target).sum().item()

        test_loss /= len(test_loader.dataset)
        accuracy = 100. * correct / len(test_loader.dataset)
        print('Test set: Average loss:', test_loss,
              'Accuracy', correct/len(test_loader.dataset))
        return accuracy


def save(model, name):
    path = os.path.join(
        CHECKPOINT_DIR, 'model_{}.pkl'.format(name))
    torch.save(model.state_dict(), path)


def main():

    print("--- Initial Training ---")
    from model import VGG16

    # model
    model = VGG16(mask=True).to(device)

    # model.load_state_dict(torch.load(
    #    '../../data/model/LetNet/letnet_5_trained.pkl'))
    # test(model, device)

    # model.prune_by_percentile_left(70)
    # test(model, device)

    # model.conv1.weight.requires_grad = False
    # model.conv1.bias.requires_grad = False

    # model.conv2.weight.requires_grad = False
    # model.conv2.bias.requires_grad = False

    # model.fc1.weight.requires_grad = False
    # model.fc1.bias.requires_grad = False

    # model.fc2.weight.requires_grad = False
    # model.fc2.bias.requires_grad = False

    # model.fc3.weight.requires_grad = False
    # model.fc3.bias.requires_grad = False
    test(model, device)
    optimizer = optim.SGD(model.parameters(), lr=args.lr,
                          momentum=0.9, weight_decay=5e-4)

    train(10, model, device, optimizer)

    # test(model, device)
    # print(model.parameters)


if __name__ == "__main__":
    main()
