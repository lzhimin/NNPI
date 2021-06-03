class NetworkArchitectureData {

    constructor() {

    }

    setData(data) {
        this.data = data[0];
        this.confusionMatrix = data[1];
        this.input_summary = data[2];
        this.embedding_labels = data[3]
        this.activation_pattern = data[4];
    }

    setActivationPattern(data) {
        this.activation_pattern = data;
    }
}