
class MainView extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new MainViewData();

        
        // the percentage of weight is pruned in the neural network
        this.pruning_precentage = 0;

        //subscribe('MainVis', this.setData.bind(this))
        subscribe("MainVis", this.setData.bind(this))
    }

    init() {
        super.init();

        this.margin = { 'left': 150, 'right': 20, 'top': 20 };

        d3.select("#main_view_panel").html("");

        //add canvas 
        this.svg = d3.select('#main_view_panel')
            .append('svg')
            .attr('width', this.width)
            .attr("height", this.height * 2);    
        
        //binding the user event
        this.bindingEvent();

        //color map
        let colordomain = Array.from(new Set(this.dataManager.embedding_labels))
        this.colormap = d3.scaleOrdinal().domain(colordomain).range(d3.schemeSet3);
    }
    
    draw() {
        this.init();

        // the size of embedding
        let width = 750;
        let height = 450;
        this.draw_embedding(this.margin.left, this.margin.top, width, height, this.dataManager.embedding)
    }

    draw_embedding(x, y, width, height, data) {
         let x_max, x_min, y_max, y_min;

        [x_min, x_max] = d3.extent(data, (d) => { return d[0] });
        [y_min, y_max] = d3.extent(data, (d) => { return d[1] });
        
        let x_axis = d3.scaleLinear().domain([x_min , x_max * 1.1]).range([x, x + width]);
        let y_axis = d3.scaleLinear().domain([y_max * 1.1, y_min]).range([y, y + height]);

        this.svg.append('g')
            .attr('class', 'embedding_axis')
            .attr("transform", "translate(0" + ',' + (y + height) + ")")
            .call(d3.axisBottom(x_axis).ticks(10));
        
        this.svg.append('g')
            .attr('class', 'embedding_axis')
            .attr("transform", "translate(" + x + " ,0)")
            .call(d3.axisLeft(y_axis).ticks(10));
        
        this.points = this.svg.append('g')
            .selectAll('.embedding_points')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'embedding_points')
            .attr('cx', (d) => {
                return x_axis(d[0]);
            })
            .attr('cy', (d) => {
                return y_axis(d[1]);
            })
            .attr('r', 5)
            .style('fill', (d, i) => {
                return this.colormap(this.dataManager.embedding_labels[i])
            })
            .style('fill-opacity', 0.8);
        
        const lassoInstance = lasso(x, y, width, height)
            .on('end', this.handleLassoEnd.bind(this))
            .on('start', this.handleLassoStart.bind(this));
        
        this.svg.call(lassoInstance);        
    }

    handleLassoEnd(lassoPolygon) {
        /*const selectedPoints = points.filter(d => {
            // note we have to undo any transforms done to the x and y to match with the
            // coordinate system in the svg.
            const x = d.x + padding.left;
            const y = d.y + padding.top;

            return d3.polygonContains(lassoPolygon, [x, y]);
        });

        updateSelectedPoints(selectedPoints);*/
    }

    // reset selected points when starting a new polygon
    handleLassoStart(lassoPolygon) {
        this.updateSelectedPoints([]);
    }

    // when we have selected points, update the colors and redraw
    updateSelectedPoints(selectedPoints) {
        // if no selected points, reset to all tomato
        /*if (!selectedPoints.length) {
            // reset all
            points.forEach(d => {
            d.color = 'tomato';
            });

            // otherwise gray out selected and color selected black
        } else {
            points.forEach(d => {
            d.color = '#eee';
            });
            selectedPoints.forEach(d => {
            d.color = '#000';
            });
        }*/

    }

    //binding the interactive event
    bindingEvent() {
         //setup event
        d3.select("#pruning_precentage").on('change', () => {
            this.pruning_precentage = $("#pruning_precentage").val();
            $('#pruning_precentage_label').html('Pruning Percentage (' + this.pruning_precentage + '%)');
            fetch_data({'percentage':this.pruning_precentage});
        });
    }

    setData(msg, data) {
        this.dataManager.setData(data);
        this.draw();
    }
}