import numpy as np
from sklearn.decomposition import PCA


def getdata():
    input_data = np.loadtxt('data/full/input_embedding')
    first_data = np.loadtxt('data/full/first_embedding')
    secon_data = np.loadtxt('data/full/secon_embedding')
    last_data = np.loadtxt('data/full/last_embedding')

    return {'input': input_data.tolist(), 'first': first_data.tolist(), 'second': secon_data.tolist(), 'last': last_data.tolist()}
