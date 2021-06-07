import math
import numpy as np
import torch
from torch.nn import Parameter
from torch.nn.modules.module import Module
import torch.nn.functional as F
#import zfpy
import sys


class PruningModule(Module):

    # prune the weight < q
    def prune_by_percentile(self, q=80.0):
        # Calculate percentile value
        alive_parameters = []
        for name, p in self.named_parameters():
            # We do not prune bias term
            if 'bias' in name or 'mask' in name:
                continue

            tensor = p.data.cpu().numpy()
            alive = tensor[np.nonzero(tensor)]
            alive_parameters.append(alive)

        all_alive = np.concatenate(alive_parameters)
        # return the q-th percentile of the array elements
        percentile_value = np.percentile(abs(all_alive), q)

        print("pruning with threshold", percentile_value)

        # Prune the weights ad mask
        # Note that module here is the layer
        # ex) fc1, fc2, fc3
        for name, module in self.named_modules():
            if name in ['fc1', 'fc2', 'fc3']:
                module.prune(threshold=percentile_value)

    # prune the weight > q
    def prune_by_percentile_left(self, q=80.0):

        alive_parameters = []
        for name, p in self.named_parameters():
            # We do not pruen bias term
            if 'bias' in name or 'mask' in name:
                continue

            tensor = p.data.cpu().numpy()
            alive = tensor[np.nonzero(tensor)]
            alive_parameters.append(alive)

        all_alive = np.concatenate(alive_parameters)
        # return the q-th percentile of the array elements
        percentile_value = np.percentile(abs(all_alive), q)

        for name, params in self.named_parameters():
            if 'bias' in name or 'mask' in name:
                continue
            mask = torch.abs(params.data) > percentile_value
            params.data[mask] = 0

    def prune_by_std(self, s=0.25):
        """
        Note that 's' is a quality parameter
        """
        for name, module in self.named_modules():
            if name in ['fc1', 'fc2', 'fc3']:
                threshold = np.std(module.weight.data.cpu().numpy()) * s
                print("Pruning with threshold",
                      threshold, "for layer", name)
                module.prune(threshold)

    def zfp_compression(self, tolerance=0.1):
        for name, module in self.named_modules():
            if name in ['fc1', 'fc2', 'fc3']:
                data_array = module.weight.data.numpy()
                compressed_layer = zfpy.compress_numpy(data_array, tolerance)
                decompressed_lyaer = zfpy.decompress_numpy(compressed_layer)

                module.weight.data = torch.from_numpy(
                    decompressed_lyaer).to('cpu')


class MaskedLinear(Module):

    def __init__(self, in_features, out_features, bias=True):
        super(MaskedLinear, self).__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.weight = Parameter(torch.Tensor(out_features, in_features))

        # Initialize the mask with 1
        self.mask = Parameter(torch.ones(
            [out_features, in_features]), requires_grad=False)

        if bias:
            self.bias = Parameter(torch.Tensor(out_features))
        else:
            self.register_parameter('bias', None)

        self.reset_parameters()

    def reset_parameters(self):
        stdv = 1. / math.sqrt(self.weight.size(1))
        self.weight.data.uniform_(-stdv, stdv)
        if self.bias is not None:
            self.bias.data.uniform_(-stdv, stdv)

    def forward(self, input):
        return F.linear(input, self.weight * self.mask, self.bias)

    def __repr__(self):
        return self.__class__.__name__ + '(' \
            + 'in_features=' + str(self.in_features) \
            + ', out_features=' + str(self.out_features) \
            + ', bias=' + str(self.bias is not None) + ')'

    def prune(self, threshold):
        weight_dev = self.weight.device
        mask_dev = self.mask.device
        # Convert Tensors to numpy and calculate
        tensor = self.weight.data.cpu().numpy()
        mask = self.mask.data.cpu().numpy()
        new_mask = np.where(abs(tensor) < threshold, 0, mask)
        # Apply new weight and mask
        self.weight.data = torch.from_numpy(tensor * new_mask).to(weight_dev)
        self.mask.data = torch.from_numpy(new_mask).to(mask_dev)
