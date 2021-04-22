
class MainView extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new MainViewData();

        subscribe('DATASET', this.setData.bind(this))
    }

    init() {
        super.init();


        this.chart = d3.select('#main_view_canvas')
            .append('svg')
            .attr('id', 'main_view_svg')
            .attr('width', this.width)
            .attr("height", this.height);
    }

    draw() {
        this.init();

        this.chart.append('circle')
            .attr('cx', 100)
            .attr('cy', 100)
            .attr('r', 20)
            .style("fill", "steelblue");
    }

    setData(msg, data) {
        this.dataManager.setData(data);

        this.draw();
    }

}