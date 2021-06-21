class LayerView {

    constructor(name, params, svg) {
        this.name = name;
        this.dataManager = new LayerViewData(params);
        this.svg = svg.append('g');

        // display option 
        // 1. weight
        // 2. activation 
        // 3. error
        this.display_option = 'activation';
    }

    init() {
        //reset the drawing elements
        this.svg.html('');

        
        //backgroud
        this.background_width = this.width * 5;
        this.background_height = this.height * 1.7;
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
        this.draw_activation_neuron_embedding(this.embedding);
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


    draw_activation_pattern() {
        //draw convolution activation map
        if (this.name.includes('conv')) {
            this.draw_activation_pattern_conv(this.x, this.y);
        }
        // draw full connect layer activation map 
        else {
            this.draw_activation_pattern_fc();
        }
    }

    draw_activation_pattern_conv(x, y) {
        let rect_w = 8;
        let rect_h = 8;
        let paddding = 5;

        this.canvas.lineWidth = 1;
        this.canvas.fillStyle = 'gray';
        this.canvas.strokeRect(x - this.width/2, y - 15, this.background_width, this.background_height)
        
        let data = this.dataManager.pattern[0];
        for (let i = 0; i < data.length; i++){
            if ((i + 1) % 25 == 0)
                y += (rect_h * data[0][0].length + paddding);
            this.draw_activation_pattern_conv_helpr(x + (data[0][0].length * rect_w + paddding) * (i%25) - 50, y, rect_w, rect_h, data[i]);
        }
    }

    draw_activation_pattern_conv_helpr(x, y, w, h, data) {

        let colors = ['#fee391', '#993404'];
        let max = d3.max(this.dataManager.pattern[0], (d => {
            let values = []
            for (let i = 0; i < d.length; i++)
                    values.push(d3.max(d[i]))
            return d3.max(values);
        }));

        let domains = [1];
        let n = 6;
        for (let i = 1; i < n; i++){
            domains.push(parseInt(max/n * i))
        }
        domains.push(max);
        let colorscale = d3.scaleLinear().domain([1, max]).range(colors);

        for (let i = 0; i < data.length; i++){
            for (let j = 0; j < data[i].length; j++){
                if (data[j][i] == 0){
                    this.canvas.fillStyle = 'white';
                    this.canvas.fillRect(x + i *  w, y + j * h, w, h);
                }else{
                    this.canvas.fillStyle = colorscale(data[j][i]);
                    this.canvas.fillRect(x + i *  w, y + j * h, w, h);
                }
            }
        }
    }

    draw_activation_pattern_fc() {

        let colors = ['#fee391', '#993404'];
        let max = d3.max(this.dataManager.pattern)
        let domains = [1];
        let n = 6;

        for (let i = 1; i < n; i++){
            domains.push(parseInt(max/n * i))
        }
        domains.push(max);
        let colorscale = d3.scaleLinear().domain([1, max]).range(colors);

        this.canvas.lineWidth = 1;
        this.canvas.fillStyle = 'gray';
        this.canvas.strokeRect(this.x - this.width/2, this.y - 15, this.background_width, this.background_height)


        
        for (let i = 0; i < this.dataManager.pattern.length; i++){
            if (this.dataManager.pattern[i] == 0){
                this.canvas.fillStyle = 'white';
                this.canvas.fillRect(this.x + (i % 60) * (8 + 2) - 50, this.y + Math.floor(i / 60) * 8, 8, 8);
            }else{
                this.canvas.fillStyle = colorscale(this.dataManager.pattern[i]);
                this.canvas.fillRect(this.x + (i % 60) * (8 + 2) - 50, this.y + Math.floor(i / 60) * 8, 8, 8);
            }
        }


    }

    redraw() {
        this.draw();
    }
}