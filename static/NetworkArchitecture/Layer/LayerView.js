class LayerView {

    constructor(name, params, svg) {
        this.name = name;
        this.dataManager = new LayerViewData(params);
        this.svg = svg.append('g');

        // display option 
        // 1. TSNE
        // 2. Ranking 
        this.display_option = 'Selection';

        //selected neuron
        this.selected_neuron = [];

        //subscribe("feature_vis", this.set_featureVis.bind(this));
    }

    init() {
        //reset the drawing elements
        this.svg.html('');

        
        //backgroud
        this.background_width = this.width * 5;
        this.background_height = this.height * 1.8;
    }

    draw() {
       
        this.init();
      
        // this.draw_activation_pattern();
        //draw the background 
        this.svg.append('rect')
            .attr('class', 'layerview_background')
            .attr('x', this.x - this.width/2)
            .attr('y', this.y - 15)
            .attr('width', this.background_width)
            .attr('height', this.background_height);
        
        //draw activation

        if (this.display_option == 'Selection')
            this.draw_neuron_feature_selection();
        else if(this.display_option == 'Ranking')
            this.draw_neuron_feature_ranking();
        else 
            this.draw_activation_neuron_embedding(this.embedding);
        //draw menu
        this.draw_menu();
    }

    draw_activation_neuron_embedding(data) {

        let x = this.x;
        let y = this.y;
        let width = this.width * 4;
        let height = this.background_height * 0.8;

        let x_max, x_min, y_max, y_min;
        
        //understand the activation pattern and color scale
        let colors = ['#fdd0a2', '#a63603'];
        let max = d3.max(this.dataManager.pattern)
        let colorscale = d3.scaleLinear().domain([1, max]).range(colors);

        //reset the scale
        [x_min, x_max] = d3.extent(data, (d) => { return d[0] });
        [y_min, y_max] = d3.extent(data, (d) => { return d[1] });
        
        this.x_axis = d3.scaleLinear().domain([x_min , x_max * 1.1]).range([x, x + width]);
        this.y_axis = d3.scaleLinear().domain([y_max * 1.1, y_min]).range([y, y + height]);

        this.svg.append('g')
            .attr('class', 'architecture_embedding_axis')
            .attr("transform", "translate(0" + ',' + (y + height) + ")")
            .call(d3.axisBottom(this.x_axis).ticks(10));
        
        this.svg.append('g')
            .attr('class', 'architecture_embedding_axis')
            .attr("transform", "translate(" + x + " ,0)")
            .call(d3.axisLeft(this.y_axis).ticks(10));
                
        this.points = this.svg.append('g')
            .selectAll('.architecture_embedding_points')
            .data(data, (d, i) => {
                return d.push(i);
            })
            .enter()
            .append('circle')
            .attr('class', 'architecture_embedding_points')
            .attr('cx', (d) => {
                return this.x_axis(d[0]);
            })
            .attr('cy', (d) => {
                return this.y_axis(d[1]);
            })
            .attr('r', 5)
            .style('fill', (d, i) => {
                if (this.dataManager.pattern[i] == 0)
                    return 'white';
                else
                    //return 'steelblue';
                    return colorscale(this.dataManager.pattern[i]);
            })
            .style('fill-opacity', 0.5)
            .on('click', (event, d, nodes) =>{
                d3.selectAll('.architecture_embedding_points').attr('r', 5);
                d3.select(this.points["_groups"][0][d[2]]).attr('r', 10);
                fetch_sample_activation({ 'indexs': [d[2]], 'layername': this.name });
            });
    }

    draw_menu() {

        let padding = 5;
        let width = 60;
        let height = 30;
        let menu = undefined;
        let menu_name = undefined;

        if(this.name.includes('fc')){
            menu = [this.name+'_Selection', this.name+'_Ranking', this.name+'_TSNE', ];
            menu_name = ['Selection', 'Ranking', 'TSNE'];
        }
        else{
            menu = [this.name+'_Selection', this.name+'_Ranking'];
            menu_name = ['Selection', 'Ranking',];
        }
        this.menu = this.svg.append('g').selectAll('.layerview_menu_rect')
            .data(menu)
            .enter()
            .append('rect')
            .text((d) => d)
            .attr('x', this.x + this.background_width - this.width / 2)
            .attr('y', (d, i) => {
                return this.y + i * (height + padding) - 15;
            })
            .attr('width', width)
            .attr('height', height)
            .attr('class', (d)=>d)
            .classed("active_menu_active", (d) => {
                if (d.includes(this.display_option))
                    return true;
                else
                    return false;
            })
            .classed("active_menu", (d) => {
                if (d.includes(this.display_option))
                    return false;
                else
                    return true;
            })
            .on('click', (d, i, node) => {
                this.menu.classed("active_menu_active", false);
                this.menu.classed("active_menu", true);
                d3.selectAll('.' + i).classed("active_menu_active", true);

                if (i.includes('TSNE'))
                    this.display_option = 'TSNE';
                else if (i.includes('Ranking'))
                    this.display_option = 'Ranking';
                else if(i.includes('Selection'))
                this.display_option = 'Selection';

                this.redraw();
            });
        
        this.svg.selectAll('.layerview_menu')
            .data(menu_name)
            .enter()
            .append('text')
            .text((d)=>d)
            .attr('x', this.x + this.background_width - this.width / 2 + width / 2)
            .attr('y', (d, i) => {
                return this.y + i * (height + padding) - 10 + height / 2;
            })
            .attr('dominant-baseline', 'dominant-baseline')
            .attr("text-anchor", "middle")
            .attr('class', 'active_menu_text')
    }

    draw_neuron_feature_ranking() {
        let x = this.x + 20;
        let y = this.y - 20;
        let width = this.width * 2;
        let height = this.background_height * 0.9;

        let x_max, x_min;
        
        //understand the activation pattern and color scale
        //let colors = ['#fdd0a2', '#a63603'];
        //let max = d3.max(this.dataManager.pattern)
        //let colorscale = d3.scaleLinear().domain([1, max]).range(colors);

        //reset the scale
        [x_min, x_max] = d3.extent(this.dataManager.pattern);
        
        this.x_axis = d3.scaleLinear().domain([x_min, x_max * 1.1]).range([x, x + width]);

        this.svg.append('g')
            .attr('class', 'architecture_embedding_axis')
            .attr("transform", "translate(0" + ',' + (y + height/2) + ")")
            .call(d3.axisTop(this.x_axis).ticks(3));
            
        //ranking data
        let data_activation_pattern = [];
        for (let i = 0; i < this.dataManager.pattern.length; i++){
            data_activation_pattern.push([this.dataManager.pattern[i], i]);
        }   
        
        //add histogram
        let histogram = d3.histogram()
            .value((d)=>{return d;})
            .domain(this.x_axis.domain())
            .thresholds(this.x_axis.ticks(20));
        
        //histogram bin
        let bins = histogram(this.dataManager.pattern);
        this.y_axis = d3.scaleLinear()
            .range([0, height/5])
            .domain([0, d3.max(bins, (d)=>{
            return d.length;
        })]);

        this.svg.append('g')
            .attr('class', 'architecture_embedding_axis')
            .attr("transform", "translate(" + x + "," + (y + height/2) + ")")
            .call(d3.axisLeft(this.y_axis).ticks(3));

        this.svg.append('g')
            .append('text')
            .text((d)=>{
                if(this.name.includes('fc'))
                    return 'activation frequency';
                else
                    return 'mean activation value';
            })
            .attr('x', this.x + width/2)
            .attr('y', this.y + 10)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')

        this.svg.append('g')
            .append('text')
            .text((d)=>{
                if(this.name.includes('fc'))
                    return 'density';
                else
                    return 'density';
            })
            .attr('x', this.x - 20)
            .attr('y', this.y + height/2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('writing-mode', 'vertical-rl');

        this.hist = this.svg.selectAll(".neuron_activation_rect_"+this.name)
            .data(bins)
            .enter()
            .append("rect")
            .attr('class', 'neuron_activation_rect')
            .attr("x", 1)
            .attr("transform", (d)=> { 
                return "translate(" + this.x_axis(d.x0) + "," + (y + height/2 + 2) + ")"; 
            })
            .attr("width", (d)=> { 
                return this.x_axis(d.x1) - this.x_axis(d.x0) - 1; 
            })
            .attr("height", (d)=> { 
                return this.y_axis(d.length); 
            });

        if(this.name.includes('fc')){
            this.points = this.svg.append('g')
                .selectAll('.architecture_embedding_points')
                .data(data_activation_pattern)
                .enter()
                .append('circle')
                .attr('class', 'architecture_embedding_points')
                .attr('cx', (d) => {
                    return this.x_axis(d[0]);
                })
                .attr('cy', (d) => {
                    return y + height/2 - 30;
                })
                .attr('r', 5)
                .style('fill', (d, i) => {
                    if (this.dataManager.pattern[i] == 0)
                        return 'white';
                    else
                        return 'steelblue';
                    //    return colorscale(this.dataManager.pattern[i]);
                })
                .style('fill-opacity', 0.5)
                .on('click', (event, d, nodes) =>{
                    d3.selectAll('.architecture_embedding_points').attr('r', 5);
                    d3.select(this.points["_groups"][0][d[1]]).attr('r', 10);
                    fetch_sample_activation({ 'indexs': [d[1]], 'layername': this.name });
                    fetch_fitler_visualization({'indexs':[d[1]], 'layername':this.name})
                });
        }
        else{
            this.points = this.svg.append('g')
                .selectAll('.architecture_embedding_filter')
                .data(data_activation_pattern)
                .enter()
                .append('rect')
                .attr('class', 'architecture_embedding_filter')
                .attr('x', (d) => {
                    return this.x_axis(d[0]);
                })
                .attr('y', (d) => {
                    return y + height/2 - 30;
                })
                .attr('width', 10)
                .attr('height', 10)
                .style('fill', (d, i) => {
                    if (this.dataManager.pattern[i] == 0)
                        return 'white';
                    else
                        return 'steelblue';
                    //    return colorscale(this.dataManager.pattern[i]);
                })
                .style('fill-opacity', 0.5)
                .on('click', (event, d, nodes) =>{
                    d3.selectAll('.architecture_embedding_filter').attr('width', 10).attr('height', 10);
                    d3.select(this.points["_groups"][0][d[1]]).attr('width', 20).attr('height', 20);
                    //select a filter 
                    fetch_fitler_visualization({'indexs':[d[1]], 'layername':this.name})
                    //fetch_sample_activation({'indexs': [d[1]], 'layername': this.name });
                })
        }
    }

    draw_neuron_feature_selection() {
        this.draw_neuron_feature_ranking();
        
        let x = this.x + 20;
        let y = this.y - 20;
        let width = this.width * 3;
        let height = this.background_height * 0.9;


        let brush = d3.brushX()
            .extent([[x - 20, y + height/2 - 60], [x + width + 10, y + height/2]])
            .on("end", (event)=>{
                let extent = event.selection;
                let select_neurons = [];
                if(!extent){
                    //fetch all the neurons
                    this.points.attr('fill', (d, i)=>{
                        if (this.dataManager.pattern[i] == 0)
                            return 'white';
                        else
                            return 'steelblue';
                            //return colorscale(this.dataManager.pattern[i]);
                    });
                }else{
                    this.points.attr('fill', (d, i)=>{
                        if( extent[0] < this.x_axis(d[0]) && extent[1] > this.x_axis(d[0])){
                            if (this.dataManager.pattern[i] == 0)
                                return 'white';
                            else
                                return 'steelblue';
                                //return colorscale(this.dataManager.pattern[i]);
                        } else {
                            select_neurons.push(i);
                            return 'gray';   
                        }
                    });
                }
                
                publish('ComponentPruning', {'name':this.name, 'pruned_neuron':select_neurons}); 
            });

        // add brush event
         // Add the brushing
        this.svg.append("g")
            .attr("class", "brush")
            .call(brush);
    }    

    redraw() {
        this.draw();
    }
    
    setlocation(x, y) {
        this.x = x;
        this.y = y;
    }

    setScale(width, height) {
        this.width = width;
        this.height = height;
    }

    setActivation_pattern(pattern) {
        this.dataManager.setActivation_Pattern(pattern);
    }

    set_embedding(embedding) {
        this.embedding = embedding
    }

    set_featureVis(msg, data){

        if(data[0] != this.name){
            return;
        }
        else{
            //remove feature vis
            if (this.feature != undefined){
                this.feature.remove();
            }

            let colorscale = d3.scaleLinear().domain([0, 255]).range(['white', 'black']);
            this.feature = this.svg.append('g')
                .selectAll('.featurevis')
                .data(data[1].flat())
                .enter()
                .append('rect')
                .attr('width', 2)
                .attr('height',2)
                .attr('x', (d, i)=>{
                    return this.x + this.background_width/2 + i% 28 * 2;
                })
                .attr('y', (d, i)=>{
                    return this.y + this.background_height/2+ Math.floor(i/28) * 2;
                })
                .style('fill', (d)=>{return colorscale(d);});

        } 
    }
}