from torchvision import datasets, transforms
from tqdm import tqdm
from torch import nn
import torch
import torch.nn.functional as F
import torch.optim as optim

import argparse
import sys
import os

sys.path.insert(0, os.path.abspath('..'))
CHECKPOINT_DIR = '../data/model/letnet_bias'  # model checkpoints
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
parser.add_argument('--lr', type=float, default=0.1, metavar='LR',
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


#### golden prediction summary ####
summary = {'prediction':[]}


# load the training data
train_loader = torch.utils.data.DataLoader(
    datasets.MNIST('../../data', train=True, download=True,
                   transform=transforms.Compose([
                       transforms.ToTensor()
                   ])),
    batch_size=args.batch_size, shuffle=True, num_workers=0, pin_memory=True)

# load the testing data
test_loader = torch.utils.data.DataLoader(
    datasets.MNIST('../../data', train=False,
                   transform=transforms.Compose([
                       transforms.ToTensor()
                   ])),
    batch_size=1, shuffle=False)
    #batch_size=args.test_batch_size, shuffle=False)

def train(epochs, model, device, optimizer):

    model.train()
    for epoch in range(epochs):
        pbar = tqdm(enumerate(train_loader), total=len(train_loader))

        for batch_idx, (data, target) in pbar:
            data, target = data.to(device), target.to(device)
            optimizer.zero_grad()
            output = model(data)
            loss = F.nll_loss(output, target)
            loss.backward()
            optimizer.step()
        test(model, device)
        save(model, str(epoch))
        
def accuracy(model, device, golden=False):
    model.eval()
    test_loss = 0
    correct = 0

    with torch.no_grad():
        for data, target in test_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            # sum up batch loss
            test_loss += F.nll_loss(output, target, reduction='sum').item()
            # get the index of the max log-probability
            pred = output.data.max(1, keepdim=True)[1]
            rs = pred.eq(target.data.view_as(pred)).sum().item()
            correct += rs

            if golden == True:
                summary['prediction'].append(rs)

        test_loss /= len(test_loader.dataset)
        accuracy = 100. * correct / len(test_loader.dataset)
        print('Test set: Average loss:', test_loss,
              'Accuracy', correct/len(test_loader.dataset))

        return accuracy

##############
# FGSM attack code
def fgsm_attack(image, epsilon, data_grad):
    # Collect the element-wise sign of the data gradient
    sign_data_grad = data_grad.sign()
    # Create the perturbed image by adjusting each pixel of the input image
    perturbed_image = image + epsilon*sign_data_grad
    # Adding clipping to maintain [0,1] range
    perturbed_image = torch.clamp(perturbed_image, 0, 1)
    # Return the perturbed image
    return perturbed_image

def adversiral_test(model, device, epsilon=0.05):
    model.eval()
    correct = 0
    

    for data, target in test_loader:

        #send the data and lable to the device    
        data, target = data.to(device), target.to(device)

        # Set requires_grad attribute of tensor. Important for attack
        data.requires_grad = True

        #Forward pass the data through the model
        output = model(data)
        init_pred = output.max(1, keepdim=True)[1]

        # if the initial prediction is wrong, don't bother attacking
        # just move on
        if init_pred.item() !=  target.item():
            continue

        # Calculate the loss
        loss = F.nll_loss(output, target)

        # Zero all existing gradients
        model.zero_grad()

        # Calculate gradients of model in backward pass
        loss.backward()

        # Collect datagrad
        data_grad = data.grad.data

        # Call FGSM Attack
        perturbed_data = fgsm_attack(data, epsilon, data_grad)

        # Re-classify the perturbed image
        output = model(perturbed_data)

        #check for success
        final_pred = output.max(1, keepdim=True)[1]

        if final_pred.item() == target.item():
            correct += 1

    # Calculate final accuracy for this epsilon
    final_acc = correct/float(len(test_loader))
    print("Epsilon: {}\tTest Accuracy = {} / {} = {}".format(epsilon, correct, len(test_loader), final_acc))
    return final_acc
    
def label_flip_rate(model, device):
    model.eval()
    test_loss = 0
    correct = 0
    index = 0
    flips = []

    with torch.no_grad():
        for data, target in test_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            # sum up batch loss
            test_loss += F.nll_loss(output, target, reduction='sum').item()
            # get the index of the max log-probability
            pred = output.data.max(1, keepdim=True)[1]
            rs = pred.eq(target.data.view_as(pred)).sum().item()
            correct += rs

            if rs != summary['prediction'][index]:
                flips.append(1)
            else:
                flips.append(0)

        test_loss /= len(test_loader.dataset)
        accuracy = 100. * correct / len(test_loader.dataset)
        print('Test set: Average loss:', test_loss,
              'Accuracy', correct/len(test_loader.dataset))

        return accuracy, flips
    
def activation_pattern():
    pass

def intepretability():
    pass

def innerstate():
    pass

def save(model, name):
    path = os.path.join(
        CHECKPOINT_DIR, 'model_{}.pkl'.format(name))
    torch.save(model.state_dict(), path)


def main():
    print("--- Initial ---")
    from model import LeNet, LeNet_5
    # model
    model = LeNet(mask=True).to(device)
    model.load_state_dict(torch.load(
        '../../data/model/LetNet/letnet300_trained.pkl'))
    
    accuracy(model, device, golden=True)
    model.model.prune_by_percentile_left(70)
    acc, flip = label_flip_rate(model, device)
    #adversiral_test(model, device)

    #test(model, device)
    #optimizer = optim.SGD(model.parameters(), lr=args.lr, weight_decay=0.0001)

    #train(30, model, device, optimizer)
    #test(model, device)
    #print(model.parameters)

if __name__ == "__main__":
    main()
