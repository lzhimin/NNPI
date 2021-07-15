
class MainViewData {
    
    
    constructor() {

      
    }

    setData(data) {
        this.embedding = data[0].map(function (d, i){
            return [d, data[1][i]];
        });

        this.prediction_result = data[2];
    }

    setActivationScore(data){
        this.activationScore = data;
    }
}