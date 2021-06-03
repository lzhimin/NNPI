
class MainView extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new MainViewData();

        
        // the percentage of weight is pruned in the neural network
        this.pruning_precentage = 0;

        //enable lasso
        this.lasso_selection = 'no';

        //subscribe('MainVis', this.setData.bind(this))
        subscribe("input_summary", this.setData.bind(this))
    }

    init() {
        super.init();

        this.margin = { 'left': 50, 'right': 20, 'top': 20 };

        d3.select("#main_view_panel").html("");

        //add canvas 
        this.svg = d3.select('#main_view_panel')
            .append('svg')
            .attr('width', this.width)
            .attr("height", this.height);    
        
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

        [x_min, x_max] = d3.extent(data, (d) => { return d[0][0] });
        [y_min, y_max] = d3.extent(data, (d) => { return d[0][1] });
        
        this.x_axis = d3.scaleLinear().domain([x_min , x_max * 1.1]).range([x, x + width]);
        this.y_axis = d3.scaleLinear().domain([y_max * 1.1, y_min]).range([y, y + height]);

        this.svg.append('g')
            .attr('class', 'embedding_axis')
            .attr("transform", "translate(0" + ',' + (y + height) + ")")
            .call(d3.axisBottom(this.x_axis).ticks(10));
        
        this.svg.append('g')
            .attr('class', 'embedding_axis')
            .attr("transform", "translate(" + x + " ,0)")
            .call(d3.axisLeft(this.y_axis).ticks(10));
        
        
        
        this.points = this.svg.append('g')
            .selectAll('.embedding_points')
            .data(data, (d, i) => {
                return d.push(i);
            })
            .enter()
            .append('circle')
            .attr('class', 'embedding_points')
            .attr('cx', (d) => {
                return this.x_axis(d[0][0]);
            })
            .attr('cy', (d) => {
                return this.y_axis(d[0][1]);
            })
            .attr('r', 5)
            .style('fill', (d, i) => {
                return this.colormap(d[1]);
            })
            .style('fill-opacity', 0.9)
            .on('click', function(event, d) {
                d3.selectAll('.embedding_points').attr('r', 5);
                d3.select(this).attr('r', 10);
                fetch_activation({ 'indexs': [d[2]] });
            })
        
        if (this.lasso_selection == 'yes') {
            const lassoInstance = lasso(x, y, width, height)
                .on('end', this.handleLassoEnd.bind(this))
                .on('start', this.handleLassoStart.bind(this));
            this.svg.call(lassoInstance);  
        }
        
              
    }

    handleLassoEnd(lassoPolygon) {

        let selectedindexs = [];
        const selectedPoints = this.points.filter((d, index) => {
            // note we have to undo any transforms done to the x and y to match with the
            // coordinate system in the svg.
            const x = this.x_axis(d[0][0]);
            const y = this.y_axis(d[0][1]);

            if (d3.polygonContains(lassoPolygon, [x, y])) {
                selectedindexs.push(index);
                return true;
            } else
                return false;
        });

        this.updateSelectedPoints(selectedPoints);

        //fetch the new activation pattern.
        if (selectedindexs.length == 0) {
            for (let i = 0; i < this.points["_groups"][0].length; i++){
                selectedindexs.push(i);
            }
        }
        fetch_activation({ 'indexs': selectedindexs });
    }

    // reset selected points when starting a new polygon
    handleLassoStart(lassoPolygon) {
        let points = {"_groups":[[]]}
        this.updateSelectedPoints(points);
    }

    // when we have selected points, update the colors and redraw
    updateSelectedPoints(selectedPoints) {
        // if no selected points, reset to all tomato
        if (!selectedPoints["_groups"][0].length) {
            // reset all
            this.points.style('fill-opacity', 0.9);
        } else {
            this.points.style('fill-opacity', 0.2);
            selectedPoints.style('fill-opacity',0.9);
        }
    }

    //binding the interactive event
    bindingEvent() {
        //setup event
        $("input[name='lasso_selection_option']").off('change');
        $("input[name='lasso_selection_option']").on('change', () => {
            this.lasso_selection = $("input[type=radio][name='lasso_selection_option']:checked").val();
            this.draw();
        });
    }

    setData(msg, data) {
        this.dataManager.setData(data);
        this.draw();
    }
}