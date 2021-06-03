class LayerViewData {

    constructor(data) {
        this.data = data;
    }

    getStatisticSummary() {
        
    }

    setActivation_Pattern(pattern) {
        this.pattern = pattern;

        //this.countActivationBin();
    }

    bining_2d(datax, datay, x_bin, y_bin) {
        
        //bin 2d
        let bins = [];

        //init 2d density 
        for (let i = 0; i < y_bin; i++){
            for (let j = 0; j < x_bin; j++)
                bins.push(0);
        }

        let xmax, xmin, ymax, ymin, xi, yi;
        [xmin, xmax] = d3.extent(datax);
        [ymin, ymax] = d3.extent(datay);

        for (let i = 0; i < datax.length; i++){
            xi = Math.floor(((datax[i] - xmin) / (xmax - xmin)) * x_bin);
            if (xi == x_bin)
                xi = xi - 1;

            yi = Math.floor(((datay[i] - ymin) / (ymax - ymin)) * y_bin);
            if (yi == y_bin)
                yi = yi - 1;

            bins[yi * y_bin + xi] += 1;
        }

        return bins;
    }
}