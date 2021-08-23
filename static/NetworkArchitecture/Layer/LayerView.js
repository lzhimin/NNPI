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
        this.background_width = this.width;
        this.background_height = this.height;
    }

    draw() {
       
        this.init();
      
        // this.draw_activation_pattern();
        //draw the background 
        this.svg.append('rect')
            .attr('class', 'layerview_background')
            .attr('x', this.x)
            .attr('y', this.y - 15)
            .attr('width', this.background_width)
            .attr('height', this.background_height)
            .on('click', ()=>{
                
            });
        
        //draw activation
        if (this.display_option == 'Selection')
            this.draw_neuron_feature_selection();
        else if(this.display_option == 'Ranking')
            this.draw_neuron_feature_ranking();
        else if(this.display_option == 'Parallel'){
            this.draw_parallel_pruning_criteria();
        } else if(this.display_option == 'Sub'){
            this.draw_activation_subnetwork();
        } 


        //draw menu
        //this.draw_menu();
    }

    draw_activation_subnetwork(){
        let g = this.svg.append('g');

        let x = this.x - 50;
        let y = this.y;
        let width = this.width * 3.5;
        let height = this.background_height * 0.7;


        let rect_w = width/this.dataManager.pattern.length;
        let rect_h = height/5;

        g.selectAll('.activationrect')
            .data(this.dataManager.pattern)
            .enter()
            .append('rect')
            .attr('x',(d, i)=>{
                return rect_w * i  + x;
            })
            .attr('y', y)
            .attr('width', (d)=>{
                return rect_w;
            })
            .attr('height', (d)=>{
                return rect_h
            })
            .style('fill', (d)=>{
                if(d > 200)
                    return 'steelblue';
                else 
                    return 'white';
            });

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
            menu = [this.name+'_Selection', this.name+'_Ranking', this.name+'_Parallel', this.name+'_Sub'];
            menu_name = ['Selection', 'Ranking', 'Parallel', 'Sub'];
        }
        else{
            menu = [this.name+'_Selection', this.name+'_Ranking'];
            menu_name = ['Selection', 'Ranking'];
        }
        
        this.menu = this.svg.append('g')
            .selectAll('.layerview_menu_rect')
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

                if (i.includes('Parallel'))
                    this.display_option = 'Parallel';
                else if (i.includes('Ranking'))
                    this.display_option = 'Ranking';
                else if(i.includes('Selection'))
                    this.display_option = 'Selection';
                else if(i.includes('Sub'))
                    this.display_option = 'Sub';

                this.draw();
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
        let width = this.width * 0.8;
        let height = this.background_height;

        let x_max, x_min;
        let y_max, y_min;
        
        //understand the activation pattern and color scale
        //let colors = ['#fdd0a2', '#a63603'];
        //let max = d3.max(this.dataManager.pattern)
        //let colorscale = d3.scaleLinear().domain([1, max]).range(colors);

        //reset the scale
        [x_min, x_max] = d3.extent(this.dataManager.pattern);
        [y_min, y_max] = d3.extent(this.dataManager.strength);
        
        this.x_axis = d3.scaleLinear().domain([x_min, x_max * 1.1]).range([x, x + width]);
        this.y_axis = d3.scaleLinear().domain([y_max, y_min]).range([y + height/8, y + height/1.2]);

        this.x_axis_g = this.svg.append('g')
            .attr('class', 'architecture_embedding_axis')
            .attr("transform", "translate(0" + ',' + (y + height/1.2) + ")")
            .call(d3.axisBottom(this.x_axis).ticks(2));
        
        this.y_axis_g = this.svg.append('g')
            .attr('class', 'architecture_embedding_axis')
            .attr("transform", "translate(" + x + ",0)")
            .call(d3.axisLeft(this.y_axis).ticks(2));

        //ranking data
        let data_activation_pattern = [];
        for (let i = 0; i < this.dataManager.pattern.length; i++){
             data_activation_pattern.push([this.dataManager.pattern[i], i, this.dataManager.strength[i]]);
        }   
        
        /*
        this.svg.append('g')
            .append('text')
            .text((d)=>{
                if(this.name.includes('fc'))
                    return 'activation frequency';
                else
                    return 'mean activation value';
            })
            .attr('x', this.x + width/2)
            .attr('y', this.y + height/1.1)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')

        this.svg.append('g')
            .append('text')
            .text((d)=>{
                if(this.name.includes('fc'))
                    return 'max activation value';
                else
                    return 'max activation value';
            })
            .attr('x', this.x - 20)
            .attr('y', this.y + height/2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('writing-mode', 'vertical-rl');
        */

        /*this.hist = this.svg.selectAll(".neuron_activation_rect_"+this.name)
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
            });*/

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
                .attr('cy', (d, i) => {
                    return this.y_axis(d[2]);
                })
                .attr('r', 2)
                .style('fill', (d, i) => {
                    //if (this.dataManager.pattern[i] == 0)
                    //    return 'white';
                    //else
                        return 'steelblue';
                })
                .style('fill-opacity', 0.4)
                .on('click', (event, d, nodes) =>{
                    d3.selectAll('.architecture_embedding_points').attr('r', 5).style('fill','steelblue');
                    d3.select(this.points["_groups"][0][d[1]]).attr('r', 10).style('fill','orange');
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
                    return this.y_axis(d[2]);
                })
                .attr('width', 5)
                .attr('height', 5)
                .style('fill', (d, i) => {
                        return 'steelblue';
                })
                .style('fill-opacity', 0.4)
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
        
        /*let x = this.x + 20;
        let y = this.y - 20;
        let width = this.width * 0.9;
        let height = this.background_height * 0.9;

        let brush = d3.brush()
            .extent([[x - 20, y], [x + width/1.3, y + height/1.1]])
            .on("end", (event)=>{
                let extent = event.selection;
                let select_neurons = [];
                if(!extent){
                    //fetch all the neurons
                    this.points.style('fill', (d, i)=>{
                        if (this.dataManager.pattern[i] == 0)
                            return 'white';
                        else
                            return 'steelblue';
                    });
                }else{
                    this.points.style('fill', (d, i)=>{
                        let x_in = extent[0][0] < this.x_axis(d[0]) && extent[1][0] > this.x_axis(d[0])
                        let y_in = extent[0][1] < this.y_axis(d[2]) && extent[1][1] > this.y_axis(d[2]);
                        
                        if(x_in && y_in){
                            if (this.dataManager.pattern[i] == 0)
                                return 'white';
                            else
                                return 'steelblue';
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
            .call(brush);*/
    } 
    
    draw_parallel_pruning_criteria(){
        let x = this.x - 50;
        let y = this.y;
        let width = this.width * 5;
        let height = this.background_height * 0.7;
        let brush_width = 16;
        let y_axis = {};
        let temp = this.dataManager.getPruningCriteria();
        let columns_names = temp[0], criterias = temp[1];

        for(let i = 0; i < columns_names.length; i++){
            y_axis[columns_names[i]] = d3.scaleLinear()
                .domain(d3.extent(criterias, (d)=>{
                    return d[i];
                })).range([y + height, y]);
        }

        let x_axis = d3.scalePoint()
            .range([0, width])
            .padding(1)
            .domain(columns_names);

        //The path function
        function path(d) {
            return d3.line()(columns_names.map(function(p, i) { 
                return [x_axis(p), y_axis[p](d[i])]; 
            }));
        }

        // Draw background lines
        this.svg.append('g')
            .selectAll("myPath")
            .data(criterias)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", 'gray')
            .style("stroke-opacity", 0.8)

        let foreground_paths = this.svg.append('g')
            .selectAll("myPath")
            .data(criterias)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", 'steelblue')
            .style("stroke-opacity", 0.8);

        // Draw the axis:
        let gs = this.svg.selectAll("myAxis")
            .data(columns_names)
            .enter()
            .append("g")
            .attr("transform", function (d) {
                 return "translate(" + x_axis(d) + ", 0)";
            })
            .each(function (d) {
                d3.select(this).call(d3.axisLeft(y_axis[d]).ticks(5));
            });

        const filters = {};
        const brushEventHandler = function(event, feature){
            if(event.selection != null){
                filters[feature] = event.selection.map(d=>y_axis[feature].invert(d));
            }else{
                if(feature in filters)
                    delete(filters[feature]);
            }
            applyFilters();
        }

        const applyFilters = function(){
           foreground_paths.style('display', (d, i)=>{
               return selected(d) ? null:'none';
           });
        }

        const selected = function(d){
            const _filters = Object.entries(filters);
            
            return _filters.every((f, i)=>{
                let index = columns_names.indexOf(f[0])
                return f[1][1] <= d[index] && d[index] <= f[1][0];
            });
        }
            
        const yBrushes = {};
        Object.entries(y_axis).map(d=>{
            let extent = [
                [-(brush_width/2), y],
                [(brush_width/2), y + height]
            ];

            yBrushes[d[0]]= d3.brushY()
                .extent(extent)
                .on('brush', (event)=>brushEventHandler(event,d[0]))
                .on('end', (event)=>brushEventHandler(event, d[0]));
        });

        gs.each(function(d){
            d3.select(this)
              .append('g')
              .attr('class','brush')
              .call(yBrushes[d]);
        });

        // Add axis title
        gs.append("text")
            .style("text-anchor", "middle")
            .attr("y", y + height + 20)
            .text(function (d) {
                return d;
            })
            .style('font-size', '14px')
            .style("fill", "black");
        
        return foreground_paths;
    }

    redraw() {
        if (this.display_option == 'Parallel')
            this.draw();

        else if (this.display_option == 'Sub')
            this.draw();
        else {

            let x = this.x + 20;
            let y = this.y - 20;
            let width = this.width * 0.8;
            let height = this.background_height;

            let x_max, x_min;
            let y_max, y_min;

            [x_min, x_max] = d3.extent(this.dataManager.pattern);
            [y_min, y_max] = d3.extent(this.dataManager.strength);
            
            this.x_axis = d3.scaleLinear().domain([x_min, x_max * 1.1]).range([x, x + width]);
            this.y_axis = d3.scaleLinear().domain([y_max, y_min]).range([y + height/8, y + height/1.2]);
    
            this.x_axis_g
                .transition()
                .duration(2000)
                .call(d3.axisBottom(this.x_axis).ticks(3));
            
            this.y_axis_g
                .transition()
                .duration(2000)
                .call(d3.axisLeft(this.y_axis).ticks(3));

            //ranking data
            let data_activation_pattern = [];
            for (let i = 0; i < this.dataManager.pattern.length; i++){
                data_activation_pattern.push([this.dataManager.pattern[i], i, this.dataManager.strength[i]]);
            }  

            this.points.data(data_activation_pattern).enter();

            if(this.name.includes('fc')){
                this.points.transition()
                    .duration(2000)
                    .attr('cx', (d, i) => {
                        return this.x_axis(d[0]);
                    })
                    .attr('cy', (d, i) => {
                        return this.y_axis(d[2]);
                    });
            }else{
                this.points.transition()
                    .duration(2000)
                    .attr('x', (d, i) => {
                        return this.x_axis(d[0]);
                    })
                    .attr('y', (d, i) => {
                        return this.y_axis(d[2]);
                    });
            }
            this.points.exit().remove();
        }
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

    setActivation_Strength(strength) {
        this.dataManager.setActivation_Strength(strength);
    }

    setTaylor(taylor){
        this.dataManager.setTaylor(taylor);
    }

    setSensitivity(sensitivity){
        this.dataManager.setSensitivity(sensitivity);
    }

    setActivation_label_activation(data){
        this.dataManager.setActivation_label_activation(data);
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