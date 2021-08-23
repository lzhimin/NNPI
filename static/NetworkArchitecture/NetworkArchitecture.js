class NetworkArchitecture extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new NetworkArchitectureData();

        this.architecture = {};

        this.pruned_architecture = {};

        this.model_summary = undefined;

        //1. activation
        //2. subnetwork
        this.architecture_view = 'activation';

        subscribe('model_summary', this.setData.bind(this));
        subscribe('activation_pattern', this.setActivationPattern.bind(this));
    }

    init() {

        super.init();

        //clean the panel
        if (this.svg != undefined)
            this.svg.remove();

        //add svg 
        this.svg = d3.select('#network_architecture_panel')
            .append('svg')
            .attr('width', this.width)
            .attr("height", 1800)

        //this.model_summary = new ModelManager(this.svg);


        this.modeloverview = new ModelOverview(this.svg);
        
        //margin
        this.margin.left = 120;
        this.margin.top = 50;
        
        // construct data for each neural network layer
        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            this.architecture[layer_names[i]] = new LayerView(layer_names[i], this.dataManager.data[layer_names[i]], this.svg)
            this.architecture[layer_names[i]].setActivation_pattern(
                this.dataManager.activation_pattern[layer_names[i]]);
            
            this.architecture[layer_names[i]].setActivation_Strength(
                this.dataManager.activation_pattern[layer_names[i]+"_strength"]);

            this.architecture[layer_names[i]].setTaylor(
                this.dataManager.activation_pattern[layer_names[i]+'_taylor']);
            
            this.architecture[layer_names[i]].setSensitivity(
                this.dataManager.activation_pattern[layer_names[i]+'_sensitivity']);

            this.architecture[layer_names[i]].set_embedding(
                this.dataManager.activation_pattern[layer_names[i]+"_embedding"]);
        }

        //dataset 
        let colordomain = Array.from(new Set(this.dataManager.embedding_labels))
        this.colormap = d3.scaleOrdinal().domain(colordomain).range(d3.schemeSet3);

        //binding the menu event
        this.bindingEvent();
    }

    draw() {
        this.init();

        //draw the network architecture
        let x = this.margin.left;
        let y = this.margin.top;
        let width = 120;
        let height = 120;
        let padding = 100;



        if (this.architecture_view == 'activation'){

            //draw innere layer
            let layer_names = Object.keys(this.dataManager.data);
            for (let i = 0; i < layer_names.length; i++){
                let key = layer_names[i];

                this.architecture[key].setlocation(x+ (width + padding) * i + padding * 0.3, y );
                this.architecture[key].setScale(width, height);
                this.architecture[key].draw();
            }
        } else if ( this.architecture_view == 'subnetwork'){


        }

    }

    redraw() {

        if(this.architecture_view == 'activation'){
            let layer_names = Object.keys(this.dataManager.data);
            for (let i = 0; i < layer_names.length; i++){
                this.architecture[layer_names[i]].redraw();
            }
        } else if(this.architecture_view == 'subnetwork'){
            
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

        //update the model overview dataset.
        this.modeloverview.dataManager.setData(data);

        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            this.architecture[layer_names[i]].setActivation_pattern(this.dataManager.activation_pattern[layer_names[i]]);
            this.architecture[layer_names[i]].setActivation_Strength(
                this.dataManager.activation_pattern[layer_names[i]+"_strength"]);

            this.architecture[layer_names[i]].setTaylor(
                this.dataManager.activation_pattern[layer_names[i]+'_taylor']);
            
            this.architecture[layer_names[i]].setSensitivity(
                this.dataManager.activation_pattern[layer_names[i]+'_sensitivity']);
        }

        this.redraw();
    }

    //binding the interactive event
    bindingEvent() {
        //setup event
        //d3.select("#pruning_precentage").on('change', () => {
        //    this.pruning_precentage = $("#pruning_precentage").val();
        //    $('#pruning_precentage_label').html('Pruning Percentage (' + this.pruning_precentage + '%)');
        //    fetch_data({'percentage':this.pruning_precentage});
        //});

        d3.select('#epoch_num').on('change', ()=>{
            this.epoch_num = $("#epoch_num").val();
            let name = $('#data_file_selector').val();
            fetch_data({'percentage':0, 'dataset':name, 'epoch':this.epoch_num});
        });

        d3.select('#architecture_view').on('change', ()=>{
            this.architecture_view = $("#architecture_view").val();
            this.draw();
        });
    }
}