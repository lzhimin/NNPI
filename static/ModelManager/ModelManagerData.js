class ModelManagerData {

    constructor(){

        this.model_summary = {};

        this.model_summary['99'] = {'weight':1, 'neuron':1, 'filter':1, 'accuracy':0.96};

        this.model_summary['95'] = {'weight':0.05, 'neuron':1, 'filter':1, 'accuracy':0.969};

        this.model_summary['50'] = {'weight':0.05, 'neuron':1, 'filter':1, 'accuracy':0.96};

        this.model_summary['10'] = {'weight':0.05, 'neuron':1, 'filter':1, 'accuracy':0.96};

        this.model_summary['1'] = {'weight':0.05, 'neuron':1, 'filter':1, 'accuracy':0.96};


        this.model_dependency = {'full':['5%']};
    }

    setData(msg, data){

    }
}