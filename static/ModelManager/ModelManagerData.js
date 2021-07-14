class ModelManagerData {

    constructor(){

        this.model_summary = {};

        this.model_summary['full'] = {'weight':1, 'neuron':1, 'filter':1, 'accuracy':1};

        this.model_summary['50%'] = {'weight':0.05, 'neuron':1, 'filter':1, 'accuracy':0.99};

        this.model_summary['10%'] = {'weight':0.05, 'neuron':1, 'filter':1, 'accuracy':0.95};

        this.model_summary['5%'] = {'weight':0.05, 'neuron':1, 'filter':1, 'accuracy':0.9};


        this.model_dependency = {'full':['5%']};
    }

    setData(msg, data){

    }
}