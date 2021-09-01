class FeatureView extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new FeatureViewData();
        subscribe('FeatureVisualization', this.setData.bind(this));
    }

    init() {
        super.init();

        this.margin.left = 10;
        this.margin.top = 10;  

        //add canvas 
        this.canvas = d3.select('#feature_view_canvas')
            .attr('width', 750)
            .attr("height", 1000)
            .node()
            .getContext('2d');
        
        this.color = d3.scaleLinear()
            .range(['white', 'black']).domain([0, 255]);
    }

    draw() {
        this.init();

        let x = this.margin.left;
        let y = this.margin.top;
        let w = 2;
        let h = 2;

        let width = w * this.dataManager.feature[0][0].length;
        let height = h * this.dataManager.feature[0].length;
        let padding = 5;

        for(let i = 0; i < this.dataManager.feature.length; i++){

            let data = this.dataManager.feature[i]
            let max_v = d3.max(data[0]), min_v = d3.min(data[0]);

            for(let j = 1; j < data.length; j++){
                if (max_v < d3.max(data[j]))
                    max_v = d3.max(data[j]);
                
                if (min_v > d3.min(data[j]))
                    min_v = d3.min(data[j]);
            }

            this.color_scale = d3.scaleLinear().domain([min_v, max_v]).range([1, 0]);
        }

        for(let i = 0; i < this.dataManager.feature.length; i++){
            this.draw_sample(x + i%5 * (width + padding) , y + parseInt(i/5) * (height + padding), w, h, this.dataManager.feature[i]);
        }

    }

    draw_sample(x, y, w, h, data) {
        for (let i = 0; i < data.length; i++){
            for (let j = 0; j < data[i].length; j++){
                
                if (data[j][i] > 0){
                    this.canvas.fillStyle = 'green';
                    
                }else if (data[j][i] < 0){
                    this.canvas.fillStyle = 'red';
                }else {
                    this.canvas.fillStyle = 'white';
                }

                this.canvas.fillRect(x + i *  w, y + j * h, w, h);
                
                
                /*if (data[j][i] == 0){
                    this.canvas.fillStyle = d3.interpolateRdYlBu(this.color_scale(data[i][j]));
                    this.canvas.fillRect(x + i *  w, y + j * h, w, h);
                }else{
                    this.canvas.fillStyle = d3.interpolateRdYlBu(this.color_scale(data[i][j]));
                    this.canvas.fillRect(x + i *  w, y + j * h, w, h);
                }*/
            }
        }
    }

    redraw() {
        this.draw();
    }

    setData(msg, data) {
        this.dataManager.setData(data);
        this.redraw();    
    }
}