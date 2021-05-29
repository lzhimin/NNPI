
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
        
        this.svg.selectAll('.embedding_points')
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
            .attr('r', 3)
            .style('fill', (d, i) => {
                return this.colormap(this.dataManager.embedding_labels[i])
            });
        
        //lasso event area
        let lasso_area = this.svg.append('g')
            .append('rect')
            .attr('x', x)
            .attr('y', y)
            .attr('width', width)
            .attr('height', height)
            .style("opacity", 0);
        
        // Define the lasso
        let lasso = d3.lasso()
            .closePathDistance(75) // max distance for the lasso loop to be closed
            .closePathSelect(true) // can items be selected by closing the path?
            .hoverSelect(true) // can items by selected by hovering over them?
            .area(lasso_area) // area where the lasso can be started
            .on("start", function(){
                
            }) // lasso start function
            .on("end", function(){
                
            }); // lasso end function
        
        this.svg.call(lasso);
        lasso.items(d3.selectAll(".embedding_points"));
    }
    
    draw_image(colormap, x, y, pixel_w, pixel_h, d) {
        for (let i = 0; i < d.length; i++) {
            for (let j = 0; j < d[i].length; j++) {
                if (d[i][j] == 0)
                    this.canvas.fillStyle = 'black';
                else
                    this.canvas.fillStyle = 'white';
                this.canvas.fillRect(x + j * pixel_w, y + i * pixel_h, pixel_w, pixel_h);
            }
        }        
    }

    draw_heatmap(scale_func, x, y, pixel_w, pixel_h, d) {
        for (let i = 0; i < d.length; i++) {
            for (let j = 0; j < d[i].length; j++) {
                this.canvas.fillStyle = d3.interpolateRdBu(scale_func(d[i][j]));
                this.canvas.fillRect(x + j * pixel_w, y + i * pixel_h, pixel_w, pixel_h);
            }
        }
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