import torch
import torch.nn as nn

class PruningLayer(nn.Module):
    
    def __init__(self, input_features, output_features, size_mask):
        super(PruningLayer, self).__init__()
        self.input_features = input_features
        self.output_features = output_features
        self.size_mask = size_mask
        self.weight = nn.Parameter(torch.ones(output_features))

        #find layers
        self.do_not_update = True
    
    def forward(self, input):
        return input * self.weight.view(*self.size_mask)

    def extra_repr(self):
        return 'in_features={}, output_feature={}'.format(
            self.input_features, self.output_features is not None
        )