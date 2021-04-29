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
            .attr("height", this.height)
            .append('g');
        
        //update margin value
        this.margin.left = 60;
    }

    draw() {
        this.init();

        let x = this.margin.left;
        let y = this.margin.top;
        let bar_height = 200;
        let bar_width = 20;
        let padding = 15;

        for (let i = 0; i < this.dataManager.confusionMatrix.length; i++){
            let prediction_result = [0, 0];//[0] is correct prediction and [1] is wrong prediction
            for (let j = 0; j < this.dataManager.confusionMatrix[i].length; j++) {
                if (i == j)
                    prediction_result[0] = this.dataManager.confusionMatrix[i][j];
                else
                    prediction_result[1] += this.dataManager.confusionMatrix[i][j];
            }

            //summary prediction bar for each label
            let sum_of_prediction = d3.sum(prediction_result);
            this.chart.selectAll('.confusionMatrix')
                .data(prediction_result)
                .enter()
                .append('rect')
                .attr('width', bar_width)
                .attr('height', (d) => {
                    return d / sum_of_prediction * bar_height;
                })
                .attr('x', () => {
                    return x + i * bar_width + i * padding;
                })
                .attr('y', (d, index) => {
                    return index == 0 ? y : (y + prediction_result[0] / sum_of_prediction * bar_height);
                })
                .style('fill', (d, index) => {
                    return index == 0 ? '#4575b4' : '#d73027';
                });
            
            this.chart.append('text')
                .attr('x', () => {
                    return x + i * bar_width + i * padding + bar_width / 2;
                })
                .attr('y', () => {
                    return y + bar_height + padding;
                })
                .text(i)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'central')
                .style('font-size', '20px');
        }


        //y-axis for the label bar chart
        let stackbar_chart_axis = d3.scaleLinear().domain([0, 1]).range([0, bar_height]);
        this.chart.append('g')
            .attr('class', 'axis axis--x')
            .attr("transform", "translate(" + (this.margin.left- 2) + "," + y + ")")
            .call(d3.axisLeft(stackbar_chart_axis).ticks(5));
        
        //label annoatation
        let annotation_rect_w = 30, annotation_rect_h = 30;
        this.chart.selectAll('.predictionSummaryLabel')
            .data(['correct', 'Error'])
            .enter()
            .append('rect')
            .attr('width', annotation_rect_w)
            .attr('height', annotation_rect_h)
            .attr('x', x + (bar_width + padding) * 11)
            .attr('y', (d, i) => {
                return this.margin.top + (annotation_rect_h + 10) * i;
            })
            .style('fill', (d, index) => {
                    return index == 0 ? '#4575b4' : '#d73027';
            });


    }

    setData(msg, data) {
        this.dataManager.setData(data);
        
        this.draw();
    }
}