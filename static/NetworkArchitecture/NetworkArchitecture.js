class NetworkArchitecture extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new NetworkArchitectureData();

        this.architecture = {};

        subscribe('model_summary', this.setData.bind(this))
        subscribe('activation_pattern', this.setActivationPattern.bind(this))

    }

    init() {

        super.init();

        //clean the panel
        //d3.select("#network_architecture_panel").html("");

        //add svg 
        this.canvas = d3.select('#network_architecture_canvas')
            //    .append('svg')
            .attr('width', this.width)
            .attr("height", 1800)
            .node()
            .getContext('2d');
        
        //margin
        this.margin.left = 100;
        this.margin.top = 20;
        
        // construct data for each neural network layer
        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            this.architecture[layer_names[i]] = new LayerView(layer_names[i], this.dataManager.data[layer_names[i]], this.canvas)
            this.architecture[layer_names[i]].setActivation_pattern(this.dataManager.activation_pattern[layer_names[i]]);
        }


        //dataset 
        let colordomain = Array.from(new Set(this.dataManager.embedding_labels))
        this.colormap = d3.scaleOrdinal().domain(colordomain).range(d3.schemeSet3);
   }

    draw() {
        this.init();

        //draw the network architecture
        let x = this.margin.left;
        let y = this.margin.top;
        let width = 120;
        let height = 120;
        let padding = 130;

        //draw input data distribution
        //this.draw_menu(x - 20, y);

        //draw innere layer
        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            let key = layer_names[i];

            this.architecture[key].setlocation(x, y + (height + padding) * i + padding);
            this.architecture[key].setScale(width, height);
            this.architecture[key].draw();
        }

        //draw output prediction
        //this.draw_prediction_summary(x-width/4, y + (height + padding) * (layer_names.length) + padding, width, height);
    }

    redraw() {
        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            this.architecture[layer_names[i]].redraw();
        }
    }

    draw_menu(x, y) {
         
        let width = 60;
        let height = 40;
        let labels = ['Full',  'Remain', 'Pruned'];
        this.svg.append('g')
            .selectAll('.architectureMenu')
            .data(labels)
            .enter()
            .append('rect')
            .attr('class', 'architectureMenu')
            .attr('x', (d, i) => {
                return x + i * 80;
            })
            .attr('y', (d, i) => {
                return y;
            })
            .attr('width', width)
            .attr('height', height)
            .style('rx', 10)
            .style('fill', (d, i) =>{
                return d == 'Full' ? "orange" : 'white';
            })
            .on('click', function (d) {
                d3.selectAll('.architectureMenu').style('fill', 'white');
                d3.select(this).style('fill', 'orange');
            })
            .attr('stroke', '#2378ae')
            .attr('stroke-width', '1')
        
            
        this.svg.append('g').selectAll('.architectureMenuLabels')
            .data(labels)
            .enter()
            .append('text')
            .attr('class', 'architectureMenuLabels')
            .attr('x', (d, i) => {
                return x + i * 80 + width / 2;
            })
            .attr('y', (d, i) => {
                return y + height / 2;
            })
            .text((d) => { return d; })
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('pointer-events', 'none');
            
        
    }

    draw_prediction_summary(x, y, width, height) {

        let bar_height = 100;
        let bar_width = 15;
        let padding = 10;

        height = bar_height + padding;

        //y-axis for the label bar chart
        let stackbar_chart_axis = d3.scaleLinear()
            .domain([0, d3.max(this.dataManager.confusionMatrix, (d) => { return d3.sum(d);})])
            .range([0,bar_height]);

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
        let annotation_rect_w = 10, annotation_rect_h = 10;
        this.svg.selectAll('.predictionSummaryLabel')
            .data(['correct', 'error'])
            .enter()
            .append('rect')
            .attr('width', annotation_rect_w)
            .attr('height', annotation_rect_h)
            .attr('x', (d, i) => {
                return x + (bar_width + padding) * (3 + i * 3);
            })
            .attr('y', (d, i) => {
                return y - padding * 2;
            })
            .style('fill', (d, index) => {
                return index == 0 ? '#4575b4' : '#d73027';
            });
            //.style('fill-opacity', 0.3);
        
        this.svg.selectAll('.predictionSummaryLabel')
            .data(['correct', 'error'])
            .enter()
            .append('text')
            .attr('x', (d, i) => {
                return x + (bar_width + padding) * (3 + i * 3) + annotation_rect_w * 4;
            })
            .attr('y', (d, i) => {
                return y - padding * 2 + annotation_rect_h/2;
            })
            .text(d => d)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central');
        
        this.svg.append('rect')
            .attr('x', x-40)
            .attr('y', y-30)
            .attr('width', width * 3.3)
            .attr('height', height * 1.4)
            .attr('class', 'layerview_background');
    }
  
    setData(msg, data) {
        this.dataManager.setData(data);
        this.draw();
    }

    setActivationPattern(msg, data) {
        this.dataManager.setActivationPattern(data);
        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            this.architecture[layer_names[i]].setActivation_pattern(this.dataManager.activation_pattern[layer_names[i]]);
        }

        this.redraw();
    }
}