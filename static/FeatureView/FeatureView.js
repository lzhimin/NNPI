class FeatureView extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new FeatureViewData();
        subscribe('FeatureVisualization', this.setData.bind(this));
    }

    init() {
        super.init();

        this.margin.left = 50;
        this.margin.top = 50;

        //add canvas 
        this.canvas = d3.select('#feature_view_canvas')
            .attr('width', this.width)
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
        let w = 1;
        let h = 1;

        let width = w * this.dataManager.feature[0][0].length;
        let height = h * this.dataManager.feature[0].length;
        let padding = 5;
        for(let i = 0; i < this.dataManager.feature.length; i++){
            this.draw_sample(x + i%10 * (width + padding) , y + parseInt(i/10) * (height + padding), w, h,this.dataManager.feature[i]);
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

    redraw() {
        this.draw();
    }

    setData(msg, data) {
        this.dataManager.setData(data);
        this.redraw();    
    }
}