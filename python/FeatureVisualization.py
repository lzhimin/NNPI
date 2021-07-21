import os
import numpy as np
from numpy.core.numeric import require

import torch
from torch import optim
import torch.nn.functional as F
from torch.optim import Adam
from torchvision import models
from python.misc_functions import preprocess_image, recreate_image, save_image
from torch.autograd import Variable


class CNNLayerVisualization():
    """
        Produces an image that minimizes the loss of a convolution
        operation for a specific layer and filter
    """

    def __init__(self, model, selected_layer, selected_neuron):
        self.model = model
        self.model.eval()
        self.selected_layer = selected_layer
        self.selected_neuron = selected_neuron


    def visualize_layer_neuron_without_hooks(self):
        # Process image and return variable
        # Generate a random image
        random_image = np.uint8(np.random.uniform(150, 180, (28, 28)))

        # Process image and return variable
        processed_image = preprocess_image(random_image, False)

        # Define optimizer for the image
        optimizer = Adam([processed_image], lr=0.01, weight_decay=1e-6)
        for _ in range(30):
            optimizer.zero_grad()
            # Assign create image to a varaible to move forward in the model
            x = processed_image
            x = x.view(-1, 1, 28, 28)
                            
            for index, layer in self.model.named_children():
                print(index)
                #if the current layer is a full connection layer
                if index == 'fc1':
                    x = x.view(x.shape[0], -1)

                x = layer(x)
                if index == self.selected_layer:
                    break
            
            self.conv_output = x[0][self.selected_neuron]
            
            loss = -torch.mean(self.conv_output)
            # backward
            loss.backward()

            # update image
            optimizer.step()
        #print(self.conv_output)
        #print(recreate_image(processed_image))
        return recreate_image(processed_image)

    
    def get_layer_neuron_gradient_without_hooks(self, image):
        
        image_backup = image.copy()
        process_image = Variable(torch.tensor(image), requires_grad=True)

        # Define optimizer for the image
        optimizer = Adam([process_image], lr=0.1, weight_decay=1e-6)
        for _ in range(1):
            optimizer.zero_grad()
            # Assign create image to a varaible to move forward in the model
            x = process_image.view(-1, 1, 28, 28)

            for index, layer in self.model.named_children():
                #if the current layer is a full connection layer
                if index == 'fc1':
                    x = x.view(x.shape[0], -1)

                x = layer(x)
                x = F.relu(x)
                if index == self.selected_layer:
                    break
            self.conv_output = x[0][self.selected_neuron]
            
            loss = -torch.mean(self.conv_output)
            # backward
            loss.backward()

            # update image
            optimizer.step()

        #print(process_image.grad)
        #return (np.array(process_image.tolist()) - np.array(image_backup)) * np.array(image_backup)

        return np.array(process_image.grad.tolist()) * np.array(image_backup)




def getFeatureVisualization(model, layer, neuron_index):
    #feature_vis = CNNLayerVisualization(
    #    model, layer, neuron_index).visualize_layer_neuron_without_hooks()
    return []

def getSaliencyGradientWithNode(model, layer, neuron_index, image):
    return  CNNLayerVisualization(
        model, layer, neuron_index).get_layer_neuron_gradient_without_hooks(image)


if __name__ == '__main__':
    cnn_layer = 17
    filter_pos = 5
    # Fully connected layer is not needed
    #pretrained_model = models.vgg16(pretrained=True).features
    #layer_vis = CNNLayerVisualization(pretrained_model, cnn_layer, filter_pos)

    # Layer visualization with pytorch hooks
    # layer_vis.visualise_layer_with_hooks()

    # Layer visualization without pytorch hooks
    # layer_vis.visualise_layer_without_hooks()
