
class MainViewData {
    
    
    constructor() {

      
    }

    setData(data) {
        this.embedding = data[0].map(function (d, i){
            return [d, data[1][i]];
        });
    }
}