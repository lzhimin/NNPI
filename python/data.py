import torch
from sklearn_extra.cluster import KMedoids
import numpy as np
from torchvision import datasets
from torch.autograd import Variable


from python import SaliencyMap
from python.model import LeNet, LeNet_5


def getdata(percentage):
    return load_init_input_data(percentage)


def load_init_input_data(percentage, model_path='data/model/LetNet/letnet300.pt'):
    # load data model
    # model = torch.load(model_path)

    # load dataset
    mnist = datasets.MNIST(root='data/', train=False)

    # number of presentitive
    num = 5

    # load model
    use_cuda = torch.cuda.is_available()
    device = torch.device("cuda" if use_cuda else 'cpu')
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
    rep_data = {}
    for i in dict_data.keys():
        kmedoids = KMedoids(n_clusters=num, random_state=0).fit(dict_data[i])
        rep_data[i] = kmedoids.cluster_centers_.reshape(num, 28, 28).tolist()

    print('####################################################################')
    print(type(percentage))
    print('####################################################################')
    # salient map data
    model.prune_by_percentile(int(percentage))
    salient_data = {}
    for i in rep_data.keys():
        salient_data[i] = []
        for j in range(len(rep_data[i])):
            img = torch.tensor(
                np.array(rep_data[i][j])/255, dtype=torch.float).to(device)
            img = Variable(img, requires_grad=True)
            gd = SaliencyMap.getMap(
                model, img, i)
            salient_data[i].append(gd[0].reshape(28, 28).tolist())

    return {'representative': rep_data, 'salient': salient_data}


def load_wrong_predict_samples():
    pass
