class ErrorAnalysisView extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new ErrorAnalysisViewData();

        subscribe('errorPrediction', this.setData.bind(this))

    }

    init() {

        super.init();

        //add canvas 
        d3.select('#error_analysis_view_canvas')
            .attr('width', this.width)
            .attr("height", this.height);
        
        


        // rescale the size of canvas
        let max_length = 0;
        let padding = 2;
        let labels = Object.keys(this.dataManager.data);
        for (let i = 0; i < labels.length; i++) {
            if (max_length < this.dataManager.data[labels[i]].length)
                max_length = this.dataManager.data[labels[i]].length;
        }

        max_length = Math.min(max_length, 100);
        d3.select('#error_analysis_view_canvas')
            .attr("height", max_length * this.dataManager.data[labels[0]].length + padding * max_length + 50);

        
        this.canvas = $('#error_analysis_view_canvas')[0].getContext('2d');
    }

    draw() {
        this.init();

        let x = this.margin.left;
        let y = this.margin.top;
        let pixel_w = 1;
        let pixel_h = 1;
        let padding = 2;
        let data = undefined;
        let labels = Object.keys(this.dataManager.data);
        let max_length = 0;

        for (let i = 0; i < labels.length; i++){
            data = this.dataManager.data[labels[i]];
            for (let j = 0; j < data.length && j < 100; j++) {

                this.draw_image(this.margin.left + i * data[j].length * pixel_w + padding * i,
                    this.margin.top + j * data[j][0].length * pixel_h + padding * j, pixel_w, pixel_h, data[j]);
            }
        }
    }

    draw_image(x, y, pixel_w, pixel_h, d) {
        for (let i = 0; i < d.length; i++) {
            for (let j = 0; j < d[i].length; j++) {
                if (d[i][j] == 0)
                    this.canvas.fillStyle = 'black';
                else
                    this.canvas.fillStyle = 'white';
                this.canvas.fillRect(x + j * pixel_w, y + i * pixel_h, pixel_w, pixel_h);
            }
        }        
    }

    setData(msg, data) {
        this.dataManager.setData(data);
        



        this.draw();
    }
}