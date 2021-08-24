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

        //GUI Event
        subscribe('layer_selection_event',this.layerSelectionEvent.bind(this));
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

        //draw innere layer
        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            let key = layer_names[i];

            this.architecture[key].setlocation(x + (width + padding) * i, y);
            this.architecture[key].setScale(width, height);
            this.architecture[key].draw();
        }

        //draw path connection
        let path_init_x = this.margin.left - 100;
        let path_init_y = y + width/2;
        let path_width = 100;
        let path_height = 10;

        this.svg.selectAll('.component_paths')
            .data(layer_names)
            .enter()
            .append('rect')
            .attr('class', 'componet_connection_path')
            .attr('x', (d, i)=>{
                return path_init_x + i * (width + path_width);
            })
            .attr('y', (d, i)=>{
                return path_init_y;
            })
            .attr('width', path_width)
            .attr('height', path_height)
            .style('fill', 'gray')
            .on('click', function(event){
                d3.selectAll('.componet_connection_path').style('fill', 'gray');
                d3.select(this).style('fill', 'orange');
            });
    }

    draw_main_view(layer){
        let x = this.margin.left + this.width/6;
        let y = this.margin.top + this.height/4;
        let width = this.width/2;
        let height = this.height/2;

        let x_max, x_min;
        let y_max, y_min;

        let pattern = this.dataManager.activation_pattern[layer];
        let strength= this.dataManager.activation_pattern[layer+"_strength"];

        if(this.main_view_g != undefined)
            this.main_view_g.remove();

        this.main_view_g = this.svg.append('g');

        this.main_view_g.selectAll('.main_view_' + layer).data([layer]).enter().append('rect')
            .attr('class', 'main_view_background')
            .attr('x', x)
            .attr('y', y)
            .attr('width', width)
            .attr('height', height);

        //reset the scale
        [x_min, x_max] = d3.extent(pattern);
        [y_min, y_max] = d3.extent(strength);
            
        this.x_axis = d3.scaleLinear().domain([x_min, x_max * 1.1]).range([x + width * 0.1, x + width * 0.9]);
        this.y_axis = d3.scaleLinear().domain([y_max, y_min]).range([y + height/8, y + height/1.2]);
    
        this.x_axis_g = this.main_view_g.append('g')
            .attr('class', 'architecture_embedding_axis')
            .attr("transform", "translate(0" + ',' + (y + height/1.2) + ")")
            .call(d3.axisBottom(this.x_axis).ticks(2));
        
        this.y_axis_g = this.main_view_g.append('g')
            .attr('class', 'architecture_embedding_axis')
            .attr("transform", "translate(" + (x + width * 0.1)+ ",0)")
            .call(d3.axisLeft(this.y_axis).ticks(2));

        //ranking data
        let data_activation_pattern = [];
        for (let i = 0; i < pattern.length; i++){
            data_activation_pattern.push([pattern[i], i, strength[i]]);
        }   
    
        if(layer.includes('fc')){
            this.points = this.main_view_g.append('g')
                .selectAll('.architecture_embedding_points')
                .data(data_activation_pattern)
                .enter()
                .append('circle')
                .attr('class', 'architecture_embedding_points')
                .attr('cx', (d) => {
                    return this.x_axis(d[0]);
                })
                .attr('cy', (d, i) => {
                    return this.y_axis(d[2]);
                })
                .attr('r', 5)
                .style('fill', (d, i) => {
                    return 'steelblue';
                })
                .style('fill-opacity', 0.4)
                .style('pointer-events', 'none')
                .on('click', (event, d, nodes) =>{
                    //d3.selectAll('.architecture_embedding_points').attr('r', 5).style('fill','steelblue');
                    //d3.select(this.points["_groups"][0][d[1]]).attr('r', 10).style('fill','orange');
                    //fetch_sample_activation({ 'indexs': [d[1]], 'layername': this.name });
                    //fetch_fitler_visualization({'indexs':[d[1]], 'layername':this.name})
                });
            }
        else{
            this.points = this.main_view_g.append('g')
                .selectAll('.architecture_embedding_filter')
                .data(data_activation_pattern)
                .enter()
                .append('rect')
                .attr('class', 'architecture_embedding_filter')
                .attr('x', (d) => {
                    return this.x_axis(d[0]);
                })
                .attr('y', (d) => {
                    return this.y_axis(d[2]);
                })
                .attr('width', 10)
                .attr('height', 10)
                .style('fill', (d, i) => {
                        return 'steelblue';
                })
                .style('fill-opacity', 0.4)
                .style('pointer-events', 'none')
                .on('click', (event, d, nodes) =>{
                    //d3.selectAll('.architecture_embedding_filter').attr('width', 10).attr('height', 10);
                    //d3.select(this.points["_groups"][0][d[1]]).attr('width', 20).attr('height', 20);
                    //select a filter 
                    //fetch_fitler_visualization({'indexs':[d[1]], 'layername':this.name})
                    //fetch_sample_activation({'indexs': [d[1]], 'layername': this.name });
                });
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
         /*
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
            */
        
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

    layerSelectionEvent(msg, data){
       this.draw_main_view(data);
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