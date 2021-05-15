import torch
from sklearn_extra.cluster import KMedoids
import numpy as np
from torchvision import datasets, transforms
from torch.autograd import Variable
from python import SaliencyMap
from python.model import LeNet, LeNet_5


def getdata(percentage):
    return load_init_input_data(percentage)


def load_init_input_data(percentage, model_path='data/model/LetNet/letnet300.pt'):
    # load data model
    # model = torch.load(model_path)

    # load dataset
    mnist = datasets.MNIST(root='data/', train=False, transform=transforms.Compose([
        transforms.ToTensor()
    ]))

    # number of presentitive
    num = 15

    # load model
    use_cuda = torch.cuda.is_available()
    device = torch.device('cpu')
    model = LeNet(mask=True).to(device)
    model.load_state_dict(torch.load('data/model/LetNet/letnet300.pt'))
    model.eval()

    # k-medoids algorithm
    dict_data = {}
    numpy_data = mnist.data.numpy()
    for i in range(len(mnist)):
        item = mnist[i]
        label = item[1]

        if label in dict_data:
            dict_data[label].append(numpy_data[i].astype(np.int).flatten())
        else:
            dict_data[label] = [numpy_data[i].astype(np.int).flatten()]

    # fetch the representive data samples
    # rep_data = {}
    # for i in dict_data.keys():
    #    kmedoids = KMedoids(n_clusters=num, random_state=0).fit(dict_data[i])
    #    rep_data[i] = kmedoids.cluster_centers_.reshape(num, 28, 28).tolist()

    # salient map data
    model.prune_by_percentile(float(percentage))
    # model.prune_by_percentile_left(float(percentage))
    # salient_data = {}
    # for i in rep_data.keys():
    #    salient_data[i] = []
    #    for j in range(len(rep_data[i])):
    #        img = torch.tensor(
    #            np.array(rep_data[i][j])/255, dtype=torch.float).to(device)
    #        img = Variable(img, requires_grad=True)
    #        gd = SaliencyMap.getMap(
    #            model, img, i)
    #        salient_data[i].append(gd[0].reshape(28, 28).tolist())

    # current prediction summary over the test dataset
    prediction_summary = test(model, mnist, dict_data.keys())
    embedding = model.layerActivationEmbedding(prediction_summary[2])
    input_summary_embedding = model.inputEmbedding(prediction_summary[2])

    result = {}
    result['modelSummary'] = getModelSummary(model)
    result['input_summary'] = input_summary_embedding.tolist()
    result['prediction_summary'] = prediction_summary[0]
    result['embedding'] = embedding
    result['embedding_label'] = prediction_summary[3]

    return result


def test(model, dataset, labels):
    confusionMatrix = np.zeros((len(labels), len(labels)))
    error_prediction = {}
    test_subset = {}
    subset = []
    subset_label = []
    # return confusionMatrix.tolist()
    # sample 10% of the testing dataset
    # subset_indices = [0]  # select your indices here as a list
    #subset_indices = np.random.rand(1500) * len(dataset)
    #subset_indices = subset_indices.astype(int)
    #subdataset = torch.utils.data.Subset(dataset, subset_indices)

    test_loader = torch.utils.data.DataLoader(dataset)
    with torch.no_grad():
        for data, target in test_loader:
            device_data, device_target = data.to('cpu'), target.to('cpu')
            output = model(device_data)
            # get the index of the max log-probability
            pred = output.data.max(1, keepdim=True)[1]
            confusionMatrix[device_target[0]][pred[0][0]] += 1
            key = str(target.item())
            if device_target[0] != pred[0][0]:
                if key in error_prediction and len(error_prediction[key]) < 30:
                    error_prediction[key].append(
                        data.tolist()[0][0])
                else:
                    error_prediction[key] = [
                        data.tolist()[0][0]]

            if key not in test_subset:
                test_subset[key] = 1
                subset.append(
                    np.array(data.tolist()[0][0]).flatten().tolist())
                subset_label.append(device_target[0].item())
            else:
                if test_subset[key] < 100:
                    test_subset[key] += 1
                    subset.append(
                        np.array(data.tolist()[0][0]).flatten().tolist())
                    subset_label.append(device_target[0].item())

    return confusionMatrix.tolist(), error_prediction, subset, subset_label


def getModelSummary(model):
    model_summary = {}
    for name, param in model.named_parameters():
        if 'weight' in name:
            # collect the information of a neural network layer
            prune_ratio = torch.sum(param == 0).item() / \
                float(param.shape[0] * param.shape[1])

            weight = param.detach().numpy().flatten()
            weight = weight[weight != 0]

            # model summary
            model_summary[name.split('.')[0]] = {"weight": weight.tolist(
            ), "shape": str(param.shape[0])+"x"+str(param.shape[1]), 'prune_ratio': prune_ratio}

    return model_summary
