class LayerView {

    constructor(name, params, svg) {
        this.name = name;
        this.dataManager = new LayerViewData(params);
        this.svg = svg.append('g');

        // display option 
        // 1. TSNE
        // 2. Ranking 
        this.display_option = 'Ranking';
    }

    init() {
        //reset the drawing elements
        this.svg.html('');

        
        //backgroud
        this.background_width = this.width * 5;
        this.background_height = this.height * 1.7;
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

        if (this.display_option == 'TSNE')
            this.draw_activation_neuron_embedding(this.embedding);
        else
            this.draw_neuron_feature_ranking();

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

        this.menu = this.svg.append('g').selectAll('.layerview_menu_rect')
            .data([this.name+'_TSNE', this.name+'_Ranking'])
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
                
                this.redraw();
            });
        
        this.svg.selectAll('.layerview_menu')
            .data(['TSNE', 'Ranking'])
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
        let x = this.x;
        let y = this.y;
        let width = this.width * 4;
        let height = this.background_height * 0.8;

        let x_max, x_min;
        
        //understand the activation pattern and color scale
        let colors = ['#fdd0a2', '#a63603'];
        let max = d3.max(this.dataManager.pattern)
        let colorscale = d3.scaleLinear().domain([1, max]).range(colors);

        //reset the scale
        [x_min, x_max] = d3.extent(this.dataManager.pattern);
        
        this.x_axis = d3.scaleLinear().domain([x_max * 1.1, x_min]).range([x, x + width]);

        this.svg.append('g')
            .attr('class', 'architecture_embedding_axis')
            .attr("transform", "translate(0" + ',' + (y + height/2) + ")")
            .call(d3.axisBottom(this.x_axis).ticks(10));
            
        //ranking data
        let data_activation_pattern = [];
        for (let i = 0; i < this.dataManager.pattern.length; i++){
            data_activation_pattern.push([this.dataManager.pattern[i], i]);
        }
        
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
                return y + height/2 - 15;
            })
            .attr('r', 5)
            .style('fill', (d, i) => {
                if (this.dataManager.pattern[i] == 0)
                    return 'white';
                else
                    return colorscale(this.dataManager.pattern[i]);
            })
            .style('fill-opacity', 0.5)
            .on('click', (event, d, nodes) =>{
                d3.selectAll('.architecture_embedding_points').attr('r', 5);
                d3.select(this.points["_groups"][0][d[1]]).attr('r', 10);
                fetch_sample_activation({ 'indexs': [d[1]], 'layername': this.name });
            });
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

}