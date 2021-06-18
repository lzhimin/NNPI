from app import index
import torch
import numpy as np
from python.modelManager import ModelManager
from python.model import LeNet, LeNet_5
from sklearn.manifold import TSNE


device = torch.device('cpu')
modelManager = ModelManager(device=device)


def getdata(percentage):
    return load_Model_Data_Summary(percentage)


def getActivation(indexs):
    return modelManager.fetch_activation_pattern(indexs)


def load_Model_Data_Summary(percentage, model_path='data/model/LetNet/letnet300_trained.plk'):
    # pruned parameter model
    # model.prune_by_percentile_left(float(percentage))

    mnist = modelManager.loadValidationData()

    labels = set()
    for i in range(len(mnist)):
        labels.add(mnist[i][1])
    labels = list(labels)
    labels.sort()

    # left model
    #pruned_model = LeNet(mask=True).to(device)
    # pruned_model.load_state_dict(torch.load(
    #    'data/model/LetNet/letnet300_trained.pkl'))
    # pruned_model.eval()
    # pruned_model.prune_by_percentile(float(percentage))

    # prune the neural network
    modelManager.prune_neural_network(percentage)

    print('get validation')
    # validation summary
    validation_summary = validation(modelManager.train_model, mnist, labels)

    print('get tsne')
    # input_embedding = TSNE(
    #    n_components=2).fit_transform(validation_summary[3])
    input_embedding = np.loadtxt('tsne.out',  delimiter=',')

    print('get activation')
    activation_pattern = modelManager.train_model.activationPattern(
        validation_summary[1])

    print('return result')
    result = {}
    result['model_summary'] = getModelSummary(
        modelManager.train_model, modelManager.untrain_model)
    result['prediction_summary'] = validation_summary[0]
    result['embedding'] = input_embedding.tolist()
    result['embedding_label'] = validation_summary[2]
    result['activation_pattern'] = activation_pattern
    result['predict_result'] = validation_summary[4]

    return result


def validation(model, dataset, labels):

    # confusion matrix of the validation dataset
    confusionMatrix = np.zeros((len(labels), len(labels)))

    subset = []
    subset_label = []
    flatten_subset = []
    prediction_result = []

    test_loader = torch.utils.data.DataLoader(dataset)

    print(len(test_loader))
    with torch.no_grad():
        for data, target in test_loader:
            device_data, device_target = data.to('cpu'), target.to('cpu')
            output = model(device_data)
            # get the index of the max log-probability
            pred = output.data.max(1, keepdim=True)[1]
            confusionMatrix[device_target[0]][pred[0][0]] += 1

            if device_target[0] == pred[0][0]:
                prediction_result.append(1)
            else:
                prediction_result.append(0)

            subset.append(data.tolist())
            flatten_subset.append(
                np.array(data.tolist()).flatten().tolist())
            subset_label.append(device_target[0].item())

    return confusionMatrix.tolist(), subset, subset_label, flatten_subset, prediction_result


def saliencyMap():
    # saliency data
    #salient_data = {}
    # for i in rep_data.keys():
    #    salient_data[i] = []
    #    for j in range(len(rep_data[i])):
    #        img = torch.tensor(
    #            np.array(rep_data[i][j])/255, dtype=torch.float).to(device)
    #        img = Variable(img, requires_grad=True)
    #        gd = SaliencyMap.getMap(
    #            model, img, i)
    #        salient_data[i].append(gd[0].reshape(28, 28).tolist())
    pass


def visualization(model):
    pass


def getModelSummary(train_model, untrain_model):
    model_summary = {}

    for name, param in untrain_model.named_parameters():
        if 'fc3' in name:
            continue

        if "weight" in name:
            weight = param.detach().numpy().flatten()
            model_summary[name.split(
                '.')[0]] = {'untrain_weight': weight.tolist()}

    for name, param in train_model.named_parameters():
        if 'fc3' in name:
            continue

        if 'weight' in name:
            # collect the information of a neural network layer
            prune_ratio = torch.sum(param == 0).item() / \
                float(param.shape[0] * param.shape[1])
            weight = param.detach().numpy().flatten()
            weight = weight[weight != 0]

            untrain_weight = np.array(model_summary[name.split(
                '.')[0]]["untrain_weight"])
            untrain_weight = untrain_weight[untrain_weight != 0]

            # model summary
            model_summary[name.split(
                '.')[0]]["untrain_weight"] = list(untrain_weight)
            model_summary[name.split('.')[0]]["weight"] = weight.tolist()
            model_summary[name.split('.')[0]]["shape"] = str(
                param.shape[0])+"x"+str(param.shape[1])
            model_summary[name.split('.')[0]]["prune_ratio"] = prune_ratio

    return model_summary
