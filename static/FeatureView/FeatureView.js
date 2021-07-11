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
        let w = 5;
        let h = 5;

        this.draw_sample(x, y, w, h,this.dataManager.feature);

    }

    draw_sample(x, y, w, h, data) {
        for (let i = 0; i < data.length; i++){
            for (let j = 0; j < data[i].length; j++){
                if (data[j][i] == 0){
                    this.canvas.fillStyle = d3.interpolateOranges(data[j][i]/255);// this.color(data[j][i]);
                    this.canvas.fillRect(x + i *  w, y + j * h, w, h);
                }else{
                    this.canvas.fillStyle = d3.interpolateOranges(data[j][i]/255);//this.color(data[j][i]);
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