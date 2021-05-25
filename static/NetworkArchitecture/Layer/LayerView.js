class LayerView {

    constructor(name, params, svg) {
        this.name = name;
        this.dataManager = new LayerViewData(params);
        this.chart = svg.append('g');

        // display option 
        // 1. weight
        // 2. activation 
        // 3. error
        this.display_option = 'weight';
    }

    init() {
        

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

    draw() {
       
        //backgroud
        this.background_width = this.width * 3;
        this.background_height = this.height * 1.4;
        this.chart.append('rect')
            .attr('class', 'layerview_background')
            .attr('x', this.x - this.width/2)
            .attr('y', this.y - 15)
            .attr('width', this.background_width)
            .attr('height', this.background_height);
        
        //menu
        this.draw_menu();

        this.display_vis = this.chart.append('g');

        //draw the current selected visualization
        if (this.display_option == 'weight')
            this.draw_weight_distribution();
        else if (this.display_option == 'active')
            this.draw_activation_pattern();
        
        //labels
        this.draw_layer_labels();
    }

    draw_menu() {

        let padding = 5;
        let width = 60;
        let height = 30;

        this.menu = this.chart.append('g').selectAll('.layerview_menu_rect')
            .data([this.name+'_weight', this.name+'_activation', this.name+"_error"])
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
            .classed("active_menu_active", (d, i) => {
                return i == 0 ? true : false;
            })
            .classed("active_menu", (d, i) => {
                return i == 0 ? false : true;
            })
            .on('click', (d, i, node) => {
                this.menu.classed("active_menu_active", false);
                this.menu.classed("active_menu", true);
                d3.selectAll('.' + i).classed("active_menu_active", true);

                if (i.includes('activation'))
                    this.display_option = 'activation';
                else if (i.includes('weight'))
                    this.display_option = 'weight';
                else if (i.includes('error'))
                    this.display_option = 'error';
                this.redraw();
            });
        
        this.chart.selectAll('.layerview_menu')
            .data(['Weight', 'Activation', 'Error'])
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

    draw_layer_labels() {

        let width = 80;
        let height = 50;

        //layer label rectangle
        /*this.display_vis.append('g')
            .selectAll('.layerview_labels')
            .data([this.name,
            this.dataManager.data.shape,
            this.dataManager.data.prune_ratio])
            .enter()
            .append('rect')
            .attr('x', (d, i) => {
                return this.x + i * width;
            })
            .attr('y', (d, i) => {
                return this.y - height;
            })
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'architecture_labels_rect');*/

        //text label
        this.display_vis.append('g')
            .selectAll('.layerview_labels')
            .data([this.name, this.dataManager.data.shape,
            this.dataManager.data.prune_ratio])
            .enter()
            .append('text')
            .text((d, i) => {
                if (i == 0)
                    return "Name: " + this.name;
                else if (i == 1)
                    return "Shape: " + this.dataManager.data.shape;
                else if (i == 2)
                    return "Pruned: " + (this.dataManager.data.prune_ratio * 100).toFixed(2)+"%";
            })
            .attr('x', (d, i) => {
                return this.x + width * 2;
            })
            .attr('y', (d, i) => {
                return this.y + i * 20 + height/2;
            })
            .attr('dominant-baseline', 'dominant-baseline');
    }

    draw_weight_distribution() {

        //clean the drawing panel
        this.display_vis.html('');
        
        //distribution of the weight 
        let x_scale = d3.scaleLinear()
            .domain(d3.extent(this.dataManager.data.weight))
            .range([0, this.width]);
        
        let y_scale = d3.scaleLinear()
            .domain(d3.extent(this.dataManager.data.untrain_weight))
            .range([this.height, 0]);
        
        let x_bin = 30;
        let y_bin = 30;
        let padding = 50;
        let x_w = this.width / x_bin;
        let y_h = this.height / y_bin;
        let bins = this.dataManager.bining_2d(this.dataManager.data.weight, this.dataManager.data.untrain_weight, x_bin, y_bin);
        
        let colors = ['#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'];
        let colorscale = d3.scaleQuantize().domain([0, d3.max(bins)]).range(colors);

        this.display_vis.append('g').selectAll(".binrect")
            .data(bins)
            .enter()
            .append('rect')
            .attr('x', (d, i) => {
                return this.x + (i + 1) % x_bin * x_w;
            })
            .attr('y', (d, i) => {
                return this.y + Math.floor(i  / y_bin) * y_h ;
            })
            .attr('width', x_w)
            .attr('height', y_h)
            .style('fill', (d, i) => {
                return d == 0?'white':colorscale(d);
            });

        //bin the data
        //let bins = d3.histogram()
        //    .value((d) => d)
        //    .domain(x_scale.domain())(this.dataManager.data.weight);

        //y_scale.domain([0, d3.max(bins, function (d) { return d.length; })]);
        
        /*
            this.display_vis.selectAll("rect")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 1)
            .attr("transform", (d)=> {
                return "translate(" + (x_scale(d.x0) + this.x) + "," + (y_scale(d.length)+this.y) + ")";
            })
            .attr("width",  (d)=> {
                return x_scale(d.x1) - x_scale(d.x0) - 1;
            })
            .attr("height",  (d)=> {
                return this.height - y_scale(d.length);
            })
            .style('fill', 'steelblue');
        */


        // add the x Axis
        this.display_vis.append("g")
            .attr("transform", "translate(" + (this.x ) + "," + (this.y + this.height) + ")")
            .call(d3.axisBottom(x_scale).ticks(4));

        // add the y Axis
        this.display_vis.append("g")
            .attr("transform", "translate(" + (this.x ) + "," + (this.y) + ")")
            .call(d3.axisLeft(y_scale).ticks(4));
    }

    draw_activation_pattern() {

        //clean the drawing panel
        this.display_vis.html('');

        //neuro node
        this.display_vis.selectAll('.layerview_neuros')
            .data(this.dataManager.pattern)
            .enter()
            .append('rect')
            .attr('class', 'layerview_neuro')
            .attr('x', (d, i) => {
                return this.x + (i % 30) * (8 + 2) - 50
            })
            .attr('y', (d, i) => {
                return this.y + Math.floor(i / 30) * 8 - 12;
            })
            .attr('width', 8)
            .attr('height', 8)
            .style('fill', (d) => {
                return d > 0.05 ? '#69a3b2':'white';
            });
    }

    draw_error_propagation() {
        
    }

    redraw() {
        if (this.display_option == 'weight') {
            this.draw_weight_distribution();
            this.draw_layer_labels();
        } 
        else if (this.display_option == 'activation')
            this.draw_activation_pattern();
        
        
    }
}