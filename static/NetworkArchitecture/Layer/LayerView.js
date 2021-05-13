class LayerView {
    constructor(name, params, svg) {
        this.name = name;
        this.dataManager = new LayerViewData(params);
        this.chart = svg.append('g');
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

    draw() {

        this.chart.selectAll('.layerview_label')
            .data([this.name, this.dataManager.data.shape,
            this.dataManager.data.prune_ratio])
            .enter()
            .append('text')
            .text((d, i) => {
                if (i == 0)
                    return "Name:  " + this.name;
                else if (i == 1)
                    return "Shape: " + this.dataManager.data.shape;
                else if (i == 2)
                    return "Prune: " + (this.dataManager.data.prune_ratio *100).toFixed(2)+"%";
            })
            .attr('x', this.x + this.width + 10)
            .attr('y', (d, i) => {
                return this.y + i * this.width / 5 + 10;
            })
            .attr('dominant-baseline', 'dominant-baseline');


        //backgroud
        this.chart.append('rect')
            .attr('class', 'layerview_background')
            .attr('x', this.x - this.width/2)
            .attr('y', this.y - 15)
            .attr('width', this.width * 3)
            .attr('height', this.height * 1.4);
        
        
        //distribution of the weight 
        let x_scale = d3.scaleLinear()
            .domain(d3.extent(this.dataManager.data.weight))
            .range([0, this.width]);
        
        let y_scale = d3.scaleLinear()
            .range([this.height, 0]);
        
        //bin the data
        let bins = d3.histogram()
            .value((d) => d)
            .domain(x_scale.domain())(this.dataManager.data.weight);

        y_scale.domain([0, d3.max(bins, function (d) { return d.length; })]);
        
        this.chart.selectAll("rect")
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


        // add the x Axis
        this.chart.append("g")
            .attr("transform", "translate("+this.x+"," + (this.y + this.height) + ")")
            .call(d3.axisBottom(x_scale).ticks(4));

        // add the y Axis
        this.chart.append("g")
            .attr("transform", "translate("+this.x+"," + (this.y) + ")")
            .call(d3.axisLeft(y_scale).ticks(4));
        
    }

    redraw() {
        this.draw();
    }


}