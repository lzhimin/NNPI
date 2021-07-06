class FeatureView extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new FeatureViewData();

        //the scatter plot points over the interface
        this.embedding_views = {};

        //the x-axis and y-axis
        this.emebdding_axis = {};


        subscribe('FeatureVisualization', this.setData.bind(this));
    }

    init() {
        super.init();

        this.margin.left = 50;
        this.margin.top = 50;

        d3.select("#project_view_panel").html("");

        //add canvas
        this.svg = d3.select('#project_view_panel')
            .append('svg')
            .attr('width', this.width)
            .attr("height", this.height);
        
        //dataset 
        let colordomain = Array.from(new Set(this.dataManager.embedding_labels))
        this.colormap = d3.scaleOrdinal().domain(colordomain).range(d3.schemeSet3);
    }

    draw() {
        this.init();

        let x = this.margin.left;
        let y = this.margin.top;

        let width = 200;
        let height = 200;
        let padding = 80;

        let keys = Object.keys(this.dataManager.embedding);
        for (let i = 0; i < keys.length; i++) {
            this.draw_embedding(keys[i], x + width * i + padding * i, y, width, height, this.dataManager.embedding[keys[i]]);
        }
    }

    redraw() {

        let keys = Object.keys(this.embedding_views);
        for (let i = 0; i < keys.length; i++) {
            this.embedding_views[keys[i]]
                .data(this.dataManager.embedding[keys[i]])
                .transition()
                .duration(10000)
                .attr('cx', (d) => {
                    return this.emebdding_axis[keys[i]]['x'](d[0]);
                })
                .attr('cy', (d) => {
                    return this.emebdding_axis[keys[i]]['y'](d[1]);
                });
        }
    }

    draw_embedding(name, x, y, width, height, data) {
        let x_max, x_min, y_max, y_min;

        [x_min, x_max] = d3.extent(data, (d) => { return d[0] });
        [y_min, y_max] = d3.extent(data, (d) => { return d[1] });
        
        let x_axis = d3.scaleLinear().domain([x_min , x_max * 1.1]).range([x, x + width]);
        let y_axis = d3.scaleLinear().domain([y_max * 1.1, y_min]).range([y, y + height]);
        
        this.emebdding_axis[name] = { 'x': x_axis, 'y': y_axis };

        this.svg.append('g')
            .attr('class', 'embedding_axis')
            .attr("transform", "translate(0" + ',' + (y+height) + ")")
            .call(d3.axisBottom(x_axis).ticks(10));
        
        this.svg.append('g')
            .attr('class', 'embedding_axis')
            .attr("transform", "translate(" + x + " ,0)")
            .call(d3.axisLeft(y_axis).ticks(10));
        
        this.embedding_views[name] = this.svg.selectAll('.embedding_points')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', (d) => {
                return x_axis(d[0]);
            })
            .attr('cy', (d) => {
                return y_axis(d[1]);
            })
            .attr('r', 3)
            .style('fill', (d, i) => {
                return this.colormap(this.dataManager.embedding_labels[i])
            });
    }

    setData(msg, data) {
        if (this.dataManager.embedding == undefined) {
            this.dataManager.setData(data);
            //this.draw();
        }
        else {
            this.dataManager.setData(data);
            //this.redraw();
        }
        
    }
}