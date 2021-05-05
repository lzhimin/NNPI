class ProjectView extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new ProjectViewData();
        subscribe('embedding', this.setData.bind(this));
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
    }

    draw() {
        this.init();

        let x = this.margin.left;
        let y = this.margin.top;

        let width = 200;
        let height = 200;
        let padding = 80;

        this.draw_embedding(x, y, width, height, this.dataManager.data.input_embedding);
        this.draw_embedding(x + width + padding, y, width, height, this.dataManager.data.fc1_embedding);
        this.draw_embedding(x + width * 2 + padding * 2, y, width, height, this.dataManager.data.fc2_embedding);
        this.draw_embedding(x + width * 3 + padding * 3, y, width, height, this.dataManager.data.fc3_embedding);
    }

    draw_embedding(x, y, width, height, data) {
        let x_max, x_min, y_max, y_min;

        [x_min, x_max] = d3.extent(data, (d) => { return d[0] });
        [y_min, y_max] = d3.extent(data, (d) => { return d[1] });
        
        let x_axis = d3.scaleLinear().domain([x_min , x_max * 1.1]).range([x, x + width]);
        let y_axis = d3.scaleLinear().domain([y_max * 1.1, y_min ]).range([y, y + height]);

        this.svg.append('g')
            .attr('class', 'embedding_axis')
            .attr("transform", "translate(0" + ',' + (y+height) + ")")
            .call(d3.axisBottom(x_axis).ticks(10));
        
        this.svg.append('g')
            .attr('class', 'embedding_axis')
            .attr("transform", "translate(" + x + " ,0)")
            .call(d3.axisLeft(y_axis).ticks(10));
        
        this.svg.selectAll('.embedding_points')
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
            .style('fill', 'steelblue');
    }

    setData(msg, data) {
        this.dataManager.setData(data);
        this.draw();
    }
}