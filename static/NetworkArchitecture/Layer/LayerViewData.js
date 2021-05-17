class LayerViewData {
    constructor(data) {
        this.data = data;
    }

    getStatisticSummary() {
        
    }

    setActivation_Pattern(pattern) {
        this.pattern = pattern;

        this.countActivationBin();
    }

    countActivationBin() {
        this.bins = [];
        let sum = 0;
        for (let i = 0; i < this.pattern.length; i++){
            if ((i + 1) % 10 == 0) {
                this.bins.push(sum);
                sum = 0;
            }

            if (this.pattern[i] > 0)
                sum += 1;
        }
        this.bins.push(sum);

    }
}