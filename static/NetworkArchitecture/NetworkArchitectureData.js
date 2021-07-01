class NetworkArchitectureData {

    constructor() {

        this.pruned_components ={};

        subscribe('ComponentPruning', this.set_Pruned_Component.bind(this));
    }

    setData(data) {
        this.data = data[0];
        this.confusionMatrix = data[1];
        this.input_summary = data[2];
        this.embedding_labels = data[3]
        this.activation_pattern = data[4];
    }

    set_Pruned_Component(msg, data){
        this.pruned_components[data['name']] = data['pruned_neuron'];
        //ask for model evaluation.
        fetch_selected_architecture_info(this.pruned_components);
    }


    setActivationPattern(data) {
        this.activation_pattern = data;
    }
}