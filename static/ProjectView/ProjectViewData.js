class ProjectViewData {

    constructor() {
        this.embedding = undefined;
    }

    setData(data) {
        this.embedding = data[0];
        this.embedding_labels = data[1];
    }
}