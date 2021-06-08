class LayerView {

    constructor(name, params, canvas) {
        this.name = name;
        this.dataManager = new LayerViewData(params);
        this.canvas = canvas;

        // display option 
        // 1. weight
        // 2. activation 
        // 3. error
        this.display_option = 'activation';
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
        this.background_width = this.width * 5.5;
        this.background_height = this.height * 1.4;

      
        this.draw_activation_pattern();

        /*
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
        */
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
        if (this.display_option == 'weight') {
            this.draw_weight_distribution();
            this.draw_layer_labels();
        } 
        else if (this.display_option == 'activation')
            this.draw_activation_pattern();        
    }
}