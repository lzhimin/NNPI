class SummaryView extends BasicView {

    constructor(container) {
        super(container);
        this.dataManager = new SummaryViewData();
    }

    init() {

        super.init();

        //add canvas 
        this.canvas = d3.select('#selected_sample_view_canvas')
            .attr('width', this.width)
            .attr("height", 1000)
            .node()
            .getContext('2d');
        
        //update margin value
        this.margin.left = 15;
    }

    draw() {
        this.init();

        this.x = this.margin.left;
        this.y = this.margin.top;

        let w = 1;
        let h = 1;
        let padding = 5;

        for (let i = 0; i < this.dataManager.data.length; i++){
            let sample = this.dataManager.data[i][0][0];
            let x = this.x + (i % 10) * (sample.length * w + padding);
            let y = this.y + parseInt(i / 10) * (sample[0].length * h + padding);
            this.draw_sample(x, y, w, h, sample);
        }
    }

    draw_sample(x, y, w, h, data) {
        for (let i = 0; i < data.length; i++){
            for (let j = 0; j < data[i].length; j++){
                if (data[j][i] == 0){
                    this.canvas.fillStyle = 'white';
                    this.canvas.fillRect(x + i *  w, y + j * h, w, h);
                }else{
                    this.canvas.fillStyle = 'black';
                    this.canvas.fillRect(x + i *  w, y + j * h, w, h);
                }
            }
        }
    }

    setData(msg, data) {
        this.dataManager.setData(data);
        this.draw();
    }
}