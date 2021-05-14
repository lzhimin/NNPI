class NetworkArchitecture extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new NetworkArchitectureData();

        this.architecture = {};

        subscribe('modelsummary', this.setData.bind(this))

    }

    init() {

        super.init();

        //clean the panel
        d3.select("#network_architecture_panel").html("");

        //add svg 
        this.svg = d3.select('#network_architecture_panel')
            .append('svg')
            .attr('width', this.width)
            .attr("height", this.height);
        
        //margin

        this.margin.left = 100;
        this.margin.top = 100;
        
        // construct data for each neural network layer
        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            this.architecture[layer_names[i]] = new LayerView(layer_names[i], this.dataManager.data[layer_names[i]], this.svg)
        }
   }

    draw() {
        this.init();

        //draw the network architecture
        let x = this.margin.left;
        let y = this.margin.top;
        let width = 100;
        let height = 80;
        let padding = 100;
        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            let key = layer_names[i];

            this.architecture[key].setlocation(x, y + (height + padding) * i);
            this.architecture[key].setScale(width, height);
            this.architecture[key].draw();
        }

        this.draw_prediction_summary(x-width/2, y + (height + padding) * layer_names.length);
       
    }

    redraw() {
        //draw the network architecture
        let x = this.margin.left;
        let y = this.margin.top;

        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            this.architecture[layer_names[i]].redraw();
        }
    }


    draw_prediction_summary(x, y) {

        let bar_height = 100;
        let bar_width = 15;
        let padding = 10;

        //y-axis for the label bar chart
        let stackbar_chart_axis = d3.scaleLinear()
            .domain([0, d3.max(this.dataManager.confusionMatrix, (d) => { return d3.sum(d);})])
            .range([0, bar_height]);

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
            this.svg.append('g').selectAll('.confusionMatrix')
                .data(prediction_result)
                .enter()
                .append('rect')
                .attr('width', bar_width)
                .attr('height', (d) => {
                    return stackbar_chart_axis(d);
                })
                .attr('x', () => {
                    return x + i * bar_width + i * padding;
                })
                .attr('y', (d, index) => {
                    return index == 0 ? (y + bar_height - stackbar_chart_axis(d)) : (y + bar_height - stackbar_chart_axis(sum_of_prediction));
                })
                .style('fill', (d, index) => {
                    return index == 0 ?'#4575b4':'#d73027';
                });
            
            this.svg.append('text')
                .attr('x', () => {
                    return x + i * bar_width + i * padding + bar_width / 2;
                })
                .attr('y', () => {
                    return y + bar_height + padding;
                })
                .text(i)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'central')
                .style('font-size', '15px');
        }
        
        this.svg.append('g')
            .attr('class', 'axis axis--x')
            .attr("transform", "translate(" + x + "," + y + ")")
            .call(d3.axisLeft(stackbar_chart_axis).ticks(5));
        
        //label annoatation
        let annotation_rect_w = 20, annotation_rect_h = 20;
        this.svg.selectAll('.predictionSummaryLabel')
            .data(['correct', 'error'])
            .enter()
            .append('rect')
            .attr('width', annotation_rect_w)
            .attr('height', annotation_rect_h)
            .attr('x', x + (bar_width + padding) * 11)
            .attr('y', (d, i) => {
                return y + (annotation_rect_h + 10) * i;
            })
            .style('fill', (d, index) => {
                    return index == 0 ? '#4575b4' : '#d73027';
            });
        
        this.svg.selectAll('.predictionSummaryLabel')
            .data(['correct', 'error'])
            .enter()
            .append('text')
            .attr('x', x + (bar_width + padding) * 12 + annotation_rect_w * 2)
            .attr('y', (d, i) => {
                return y + (annotation_rect_h + 10) * i + annotation_rect_h / 2;
            })
            .text(d => d)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central');
    }
  

    setData(msg, data) {
        this.dataManager.setData(data);
        this.draw();
    }
}