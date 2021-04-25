import torch

# VanillaBackprop


class VanillaBackprop():
    """
        Produces gradients generated with vanilla back propagation from the image
    """

    def __init__(self, model):
        self.model = model
        self.gradients = None
        # Put model in evaluation mode
        self.model.eval()
        # Hook the first layer to get the gradient
        self.hook_layers()

    def hook_layers(self):
        def hook_function(module, grad_in, grad_out):
            self.gradients = grad_in[1]

        first_layer = list(self.model._modules.items())[0][1]
        first_layer.register_backward_hook(hook_function)

    def generate_gradients(self, input_image, target_class):
        # Forward
        model_output = self.model(input_image)

        # Zero grads
        self.model.zero_grad()
        # Target for backprop
        one_hot_output = torch.FloatTensor(
            1, model_output.size()[-1]).zero_().to('cuda')
        one_hot_output[0][target_class] = 1

        # Backward pass
        model_output.backward(gradient=one_hot_output)
        # Convert Pytorch variable to numpy array
        # [0] to get rid of the first channel (1,3,224,224)
        gradients_as_arr = self.gradients.data.cpu().numpy()

        return gradients_as_arr


def getMap(model, image, target_class, map_type='vanilla'):
    vanilla_grads = VanillaBackprop(
        model).generate_gradients(image, target_class)

    return vanilla_grads
