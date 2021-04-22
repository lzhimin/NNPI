import torch
from sklearn_extra.cluster import KMedoids
import numpy as np
from torchvision import datasets
#from model.model import LeNet, LeNet_5


def getdata():
    return load_init_input_data()


def load_init_input_data(model_path='data/model/0.ptmodel'):
    # load data model
    #model = torch.load(model_path)

    # load dataset
    mnist = datasets.MNIST(root='data/', train=False)

    # number of presentitive
    num = 10

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

    return rep_data
