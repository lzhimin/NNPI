class ModelManagerData {

    constructor(){

        this.model_summary = {};

        this.model_summary['full'] = {'weight':1, 'neuron':1, 'filter':1, 'accuracy':1};

        this.model_summary['5%'] = {'weight':0.05, 'neuron':1, 'filter':1, 'accuracy':0.9};

    }

    setData(msg, data){

    }
}