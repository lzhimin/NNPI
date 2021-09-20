import argparse
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms

# ++++++ for pruning
import os, sys
from utils.utils import save_checkpoint, AverageMeter, accuracy





def str2bool(v):
    # from https://stackoverflow.com/questions/15008758/parsing-boolean-values-with-argparse/43357954#43357954
    if v.lower() in ('yes', 'true', 't', 'y', '1'):
        return True
    elif v.lower() in ('no', 'false', 'f', 'n', '0'):
        return False
    else:
        raise argparse.ArgumentTypeError('Boolean value expected.')

def args_list():
    # Training settings
    parser = argparse.ArgumentParser(description='PyTorch MNIST Example')
    parser.add_argument('--batch-size', type=int, default=64, metavar='N',
                        help='input batch size for training (default: 64)')
    parser.add_argument('--test-batch-size', type=int, default=1000, metavar='N',
                        help='input batch size for testing (default: 1000)')
    parser.add_argument('--world_size', type=int, default=1,
                        help='number of GPUs to use')

    parser.add_argument('--epochs', type=int, default=10, metavar='N',
                        help='number of epochs to train (default: 10)')
    parser.add_argument('--lr', type=float, default=0.01, metavar='LR',
                        help='learning rate (default: 0.01)')
    parser.add_argument('--wd', type=float, default=1e-4,
                        help='weight decay (default: 5e-4)')
    parser.add_argument('--lr-decay-every', type=int, default=100,
                        help='learning rate decay by 10 every X epochs')
    parser.add_argument('--lr-decay-scalar', type=float, default=0.1,
                        help='--')
    parser.add_argument('--momentum', type=float, default=0.5, metavar='M',
                        help='SGD momentum (default: 0.5)')
    parser.add_argument('--no-cuda', action='store_true', default=False,
                        help='disables CUDA training')
    parser.add_argument('--seed', type=int, default=1, metavar='S',
                        help='random seed (default: 1)')
    parser.add_argument('--log-interval', type=int, default=10, metavar='N',
                        help='how many batches to wait before logging training status')

    parser.add_argument('--run_test', default=False,  type=str2bool, nargs='?',
                        help='run test only')

    parser.add_argument('--limit_training_batches', type=int, default=-1,
                        help='how many batches to do per training, -1 means as many as possible')

    parser.add_argument('--no_grad_clip', default=False,  type=str2bool, nargs='?',
                        help='turn off gradient clipping')

    parser.add_argument('--get_flops', default=False,  type=str2bool, nargs='?',
                        help='add hooks to compute flops')

    parser.add_argument('--get_inference_time', default=False,  type=str2bool, nargs='?',
                        help='runs valid multiple times and reports the result')

    parser.add_argument('--mgpu', default=False,  type=str2bool, nargs='?',
                        help='use data paralization via multiple GPUs')

    parser.add_argument('--dataset', default="MNIST", type=str,
                        help='dataset for experiment, choice: MNIST, CIFAR10', choices= ["MNIST", "CIFAR10", "Imagenet"])

    parser.add_argument('--data', metavar='DIR', default='/imagenet', help='path to imagenet dataset')

    parser.add_argument('--model', default="lenet3", type=str,
                        help='model selection, choices: lenet3, vgg, mobilenetv2, resnet18',
                        choices=["lenet3", "vgg", "mobilenetv2", "resnet18", "resnet152", "resnet50", "resnet50_noskip",
                                 "resnet20", "resnet34", "resnet101", "resnet101_noskip", "densenet201_imagenet",
                                 'densenet121_imagenet'])

    parser.add_argument('--tensorboard', type=str2bool, nargs='?',
                        help='Log progress to TensorBoard')

    parser.add_argument('--save_models', default=True, type=str2bool, nargs='?',
                        help='if True, models will be saved to the local folder')


    # ============================PRUNING added
    parser.add_argument('--pruning_config', default=None, type=str,
                        help='path to pruning configuration file, will overwrite all pruning parameters in arguments')

    parser.add_argument('--group_wd_coeff', type=float, default=0.0,
                        help='group weight decay')
    parser.add_argument('--name', default='test', type=str,
                        help='experiment name(folder) to store logs')

    parser.add_argument('--augment', default=False, type=str2bool, nargs='?',
                            help='enable or not augmentation of training dataset, only for CIFAR, def False')

    parser.add_argument('--load_model', default='', type=str,
                        help='path to model weights')

    parser.add_argument('--pruning', default=False, type=str2bool, nargs='?',
                        help='enable or not pruning, def False')

    parser.add_argument('--pruning-threshold', '--pt', default=100.0, type=float,
                        help='Max error perc on validation set while pruning (default: 100.0 means always prune)')

    parser.add_argument('--pruning-momentum', default=0.0, type=float,
                        help='Use momentum on criteria between pruning iterations, def 0.0 means no momentum')

    parser.add_argument('--pruning-step', default=15, type=int,
                        help='How often to check loss and do pruning step')

    parser.add_argument('--prune_per_iteration', default=10, type=int,
                        help='How many neurons to remove at each iteration')

    parser.add_argument('--fixed_layer', default=-1, type=int,
                        help='Prune only a given layer with index, use -1 to prune all')

    parser.add_argument('--start_pruning_after_n_iterations', default=0, type=int,
                        help='from which iteration to start pruning')

    parser.add_argument('--maximum_pruning_iterations', default=1e8, type=int,
                        help='maximum pruning iterations')

    parser.add_argument('--starting_neuron', default=0, type=int,
                        help='starting position for oracle pruning')

    parser.add_argument('--prune_neurons_max', default=-1, type=int,
                        help='prune_neurons_max')

    parser.add_argument('--pruning-method', default=0, type=int,
                        help='pruning method to be used, see readme.md')

    parser.add_argument('--pruning_fixed_criteria', default=False, type=str2bool, nargs='?',
                        help='enable or not criteria reevaluation, def False')

    parser.add_argument('--fixed_network', default=False,  type=str2bool, nargs='?',
                        help='fix network for oracle or criteria computation')

    parser.add_argument('--zero_lr_for_epochs', default=-1, type=int,
                        help='Learning rate will be set to 0 for given number of updates')

    parser.add_argument('--dynamic_network', default=False,  type=str2bool, nargs='?',
                        help='Creates a new network graph from pruned model, works with ResNet-101 only')

    parser.add_argument('--use_test_as_train', default=False,  type=str2bool, nargs='?',
                        help='use testing dataset instead of training')

    parser.add_argument('--pruning_mask_from', default='', type=str,
                        help='path to mask file precomputed')

    parser.add_argument('--compute_flops', default=True,  type=str2bool, nargs='?',
                        help='if True, will run dummy inference of batch 1 before training to get conv sizes')


    return parser.parse_args() 


def train(args, model, device, train_loader, optimizer, epoch, criterion, train_writer=None, pruning_engine=None):
    
    #model training
    model.train()

    for batch_idx, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)
        output = model(data)
        loss= criterion(output, target)
        optimizer.step()


def test(args, test_loader, model, device, criterion, epoch, train_writer=train_writer)
    
    #evaluation model
    model.eval()

    with torch.no_grad():
        for data, target in test_loader:
            data, target = data.to(device), target.to(device)

            output = model(data)
            loss = criterion(output, target)

            prec1, prec5 = accuracy(output.data, target, topk=(1, 5))
            losses.update(loss.item(), data.size(0))
            top1.update(prec1.item(), data.size(0))
            top5.update(prec5.item(), data.size(0))

        return top1.avg, losses.avg


def main():

    # argument list
    args = args_list()
    use_cuda = not args.no_cuda and torch.cuda.is_available()
    torch.manual_seed(args.seed)
    device = torch.device('cuda' if use_cuda else 'cpu')

    if args.model == 'lenet3':
        model = LeNet(dataset = args.datasets)


    if args.datasets == "MNIST":
        kwargs = {'num_works': 0, 'pin_memory':True if use_cuda else {}}
        
        train_loader = torch.utils.data.DataLoader(
            datasets.MNIST('../python/data', train=True, download=True,
                           transform=transforms.Compose([
                               transforms.ToTensor(),
                               transforms.Normalize((0.1307,), (0.3081,))
                           ])),
            batch_size=args.batch_size, shuffle=True, **kwargs)

        test_loader = torch.utils.data.DataLoader(
            datasets.MNIST('../python/data', train=False, transform=transforms.Compose([
                               transforms.ToTensor(),
                               transforms.Normalize((0.1307,), (0.3081,))
                           ])),
            batch_size=args.test_batch_size, shuffle=True, **kwargs)


    if True:
        parameters_for_update = []
        parameters_for_update_name = []
        for name, m in model.named_parameters():
            if 'prune' not in name:
                parameters_for_update.append(m)
                parameters_for_update_name.append((name, m))
            else:
                print("skipping parameter", name, "shape:", m.shape)   

    # optimization 
    optimizer = optim.SGD(parameters_for_update, lr=args.lr, momentum=args.momentum, weight_decay=weight_decay)

    #define objective
    criterion = nn.CrossEntropyLoss()

    # initializing parameters for pruning
    pruning_engine = None
    if args.pruning:
        pruning_settings = dict()


    best_prec1 = 0
    #training process
    for epoch in range(1, args.epochs + 1):   
        train(args, model, device, train_loader, optimizer, epoch, criterion, train_writer=train_writer, pruning_engine=pruning_engine)
        
        # test the current trained model
        prec1, _ = test(args, test_loader, model, device, criterion, epoch, train_writer=train_writer)

        #remember best precision and save the epoch
        is_best = prec1 > best_prec1
        best_prec1 = max(prec1, best_prec1)
        model_save_path = ""
        model_state_dict = model.state_dict()

        if args.save_models:
            save_checkpoint({
                'epoch': epoch + 1,
                'state_dict': model_state_dict,
                'best_prec1': best_prec1,
            }, is_best, filename=model_save_path)



if __name__ == '__main__':
    main()