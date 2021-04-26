class PredictionSummaryView extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new PredictionSummaryData();

        subscribe('confusionMatrix', this.setData.bind(this))
    }

    init() {

        super.init();

        d3.select("#prediction_summary_view_panel").html("");

        //add svg 
        this.chart = d3.select('#prediction_summary_view_panel')
            .append('svg')
            .attr('width', this.width)
            .attr("height", this.height);
    }

    draw() {
        this.init();

        let x = this.margin.left;
        let y = this.margin.top;
        let matrix_w = 30;
        let matrix_h = 30;
        let padding = 30;

        for (let i = 0; i < this.dataManager.confusionMatrix.length; i++){
            this.chart.selectAll('.confusionMatrix')
                .data(this.dataManager.confusionMatrix[i])
                .enter()
                .append('text')
                .attr('x', (d, j) => {
                    return x + j * matrix_w;
                })
                .attr('y', (d, j) => {
                    return y + i * matrix_h + padding * i;
                })
                .text((d) => { return d;})
        }

    }

    setData(msg, data) {
        this.dataManager.setData(data);
        
        this.draw();
    }
}