import os
import numpy as np

import torch
import torch.nn.functional as F
from torch.optim import Adam
from torchvision import models
from python.misc_functions import preprocess_image, recreate_image, save_image


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
        self.conv_output = 0
        # Create the folder to export images if not exists
        if not os.path.exists('../generated'):
            os.makedirs('../generated')

    def visualize_layer_neuron_without_hooks(self):

        # Process image and return variable
        # Generate a random image
        random_image = np.uint8(np.random.uniform(150, 180, (28, 28)))

        # Process image and return variable
        processed_image = preprocess_image(random_image, False)

        # Define optimizer for the image
        optimizer = Adam([processed_image], lr=0.1, weight_decay=1e-6)
        for i in range(1, 51):
            optimizer.zero_grad()
            # Assign create image to a varaible to move forward in the model
            x = processed_image
            x = x.view(-1, 784)
            x = F.relu(self.model.fc1(x))
            loss = -x[0][self.selected_neuron]

            # backward
            loss.backward()

            # update image
            optimizer.step()

        print(recreate_image(processed_image))
        return recreate_image(processed_image)


def getFeatureVisualization(model, layer, neuron_index):
    feature_vis = CNNLayerVisualization(
        model, layer, neuron_index).visualize_layer_neuron_without_hooks()

    np.savetxt('image', feature_vis, delimiter=',')
    return feature_vis


if __name__ == '__main__':
    cnn_layer = 17
    filter_pos = 5
    # Fully connected layer is not needed
    pretrained_model = models.vgg16(pretrained=True).features
    layer_vis = CNNLayerVisualization(pretrained_model, cnn_layer, filter_pos)

    # Layer visualization with pytorch hooks
    # layer_vis.visualise_layer_with_hooks()

    # Layer visualization without pytorch hooks
    # layer_vis.visualise_layer_without_hooks()
