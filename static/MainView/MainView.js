class MainView extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new MainViewData();

        
        // the percentage of weight is pruned in the neural network
        this.pruning_precentage = 0;

        //enable lasso
        this.lasso_selection = 'no';

        //color encoding
        this.color_encoding_option = 'label';

        //visualization view
        this.view_options = 'tsne';

        //subscribe('MainVis', this.setData.bind(this))
        subscribe("input_summary", this.setData.bind(this));
        subscribe("input_activation_pattern", this.set_Neuron_Activation_Mapping.bind(this));
        subscribe("predict_summary", this.set_prediction_result.bind(this));
        subscribe('Activation_Score', this.set_activation_score.bind(this));
    }

    init() {
        super.init();

        this.margin = { 'left': 100, 'right': 20, 'top': 20 };

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
        this.embedding_width = 550;
        this.embedding_height = 350;

        if(this.view_options == 'tsne')
            this.draw_embedding(this.margin.left, this.margin.top, this.embedding_width, this.embedding_height, this.dataManager.embedding)
        else
            this.draw_confusion_matrix(this.margin.left, this.margin.top, this.embedding_width, this.embedding_height,this.dataManager.preduction_summary);
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
                //define different color encoding
                if (this.color_encoding_option == 'error') {
                    return this.dataManager.prediction_result[i] > 0 ? 'white' : 'red';
                } else if(this.color_encoding_option == 'confident'){
                    if (this.dataManager.prediction_result[i] > 0)
                        return d3.interpolateYlGnBu(this.dataManager.prediction_result[i]);
                    else 
                        return d3.interpolateYlOrBr(-this.dataManager.prediction_result[i]);
                } else {
                    return this.colormap(d[1]);
                }
            })
            .style('fill-opacity', 0.3)
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

        this.svg.append('g')
            .append('text')
            .text('TSNE1')
            .attr('x', x + width/2)
            .attr('y', y + height + 30)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central');
        
        this.svg.append('g')
            .append('text')
            .text('TSNE2')
            .attr('x', x  - 40)
            .attr('y', y + height/2)
            .attr('text-anchor', 'middle')
            .attr('writing-mode', 'vertical-rl');
        
    }

    draw_confusion_matrix(x, y, width, height, data){
       let padding = 40;
       x = x+padding;
       y = y+padding;

       let w = (width-padding)/data[0].length;
       let h = (height-padding)/data.length;

       let max = d3.max(data,(d)=>{
           return d3.max(d);
        });


       let rg = this.svg.append('g')
        .selectAll('.confusionmatrix_row')
        .data(this.dataManager.preduction_summary)
        .enter()
        .append('g')
        .attr('transform',(d, i)=>{
            return 'translate('+x+','+ (y+(i * h)) +')';
        });
       
       rg.selectAll('.confusionmatrix_rect')
        .data((d)=>d)
        .enter()
        .append('rect')
        .attr('x', (d, i)=>{
            return i * w;
        })
        .attr('y', 0)
        .attr('width', w)
        .attr('height', h)
        .attr('class', 'matrix_rect')
        .style('fill', (d)=>{
            if (d == 0)return 'white';
            return d3.interpolateBlues(d/max);
        }).on('mouseover', function(event){
            d3.select(this).style('stroke', 'orange').style('stroke-width', '4px');
        }).on('mouseout', function(event){
            d3.select(this).style('stroke', 'black').style('stroke-width', '1px');;
        })
       
        rg.selectAll('.confusionmatrix_rect')
        .data((d)=>d)
        .enter()
        .append('text')
        .attr('x', (d, i)=>{
            return i * w + w/2;
        })
        .attr('y', h/2)
        .text(d=>d)
        .style("pointer-events","none");
    }

    draw_activation_score_hist(x, y, width, height, data){

        let x_min = 0, x_max = 0;

        [x_min, x_max] = d3.extent(data);
        
        this.x_axis = d3.scaleLinear().domain([x_min, x_max * 1.1]).range([x, x + width]);

        if (this.hist_g == undefined){
            this.hist_g = this.svg.append('g');
        }
        else{
            this.hist_g.remove();
            this.hist_g = this.svg.append('g');
        }

        this.hist_g.append('g')
            .attr('class', 'main_score_ranking_axis')
            .attr("transform", "translate(0" + ',' + (y + height) + ")")
            .call(d3.axisBottom(this.x_axis).ticks(10));
        
        //add histogram
        let histogram = d3.histogram()
            .value((d)=>{return d;})
            .domain(this.x_axis.domain())
            .thresholds(this.x_axis.ticks(30));
        
        //histogram bin
        let bins = histogram(data);
        this.y_axis = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(bins, (d)=>{
                return d.length;
            })]);

        this.hist_g.append('g')
            .attr('class', 'main_score_ranking_axis')
            .attr("transform", "translate(" + x + "," + (y) + ")")
            .call(d3.axisLeft(this.y_axis).ticks(5));

        this.hist = this.hist_g.selectAll(".main_score_ranking_hist")
            .data(bins)
            .enter()
            .append("rect")
            .attr('class', 'neuron_activation_rect')
            .attr("x", 1)
            .attr("transform", (d)=> { 
                return "translate(" + this.x_axis(d.x0) + "," + (y+ this.y_axis(d.length)) + ")"; 
            })
            .attr("width", (d)=> { 
                return this.x_axis(d.x1) - this.x_axis(d.x0) - 1; 
            })
            .attr("height", (d)=> { 
                return height - this.y_axis(d.length); 
            });

        this.hist_g.append('g').append('text')
            .text('Count')
            .attr('x', x - 50)
            .attr('y', y + height/2)
            .attr('text-anchor', 'middle')
            .attr('writing-mode', 'vertical-rl');
        
        this.hist_g.append('g').append('text')
            .text('Activation Value')
            .attr('x', x + width/2)
            .attr('y', y + height + 30)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central');

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
            this.points.style('fill-opacity', 0.5);
        } else {
            this.points.style('fill-opacity', 0.2);
            selectedPoints.style('fill-opacity',0.5);
        }
    }

    //binding the interactive event
    bindingEvent() {

        //label color event
        $("input[name='view_option']").off('change');
        $("input[name='view_option']").on('change', () => {
            this.view_options = $("input[type=radio][name='view_option']:checked").val();
            this.draw();
        });


        //lasso operation event
        $("input[name='lasso_selection_option']").off('change');
        $("input[name='lasso_selection_option']").on('change', () => {
            this.lasso_selection = $("input[type=radio][name='lasso_selection_option']:checked").val();
            this.draw();
        });

        //label color event
        $("input[name='color_encoding_option']").off('change');
        $("input[name='color_encoding_option']").on('change', () => {
            this.color_encoding_option = $("input[type=radio][name='color_encoding_option']:checked").val();
            this.draw();
        });

    }

    setData(msg, data) {
        this.dataManager.setData(data);
        this.draw();
    }

    set_Neuron_Activation_Mapping(msg, data) {
        this.points.style('fill', (d, i) => {
            return data.includes(i) ? this.colormap(d[1]) : 'white';
        });
    }

    set_prediction_result(msg, data){

        this.dataManager.prediction_result = data.predict_result;
        this.dataManager.preduction_summary = data.confusionMatrix;
        if(this.view_options == 'tsne')
            this.points.style('fill', (d, i) => {
                if (this.color_encoding_option == 'error') {
                    return this.dataManager.prediction_result[i] > 0 ? 'white' : 'red';
                } else if(this.color_encoding_option == 'confident'){
                    if (this.dataManager.prediction_result[i] > 0)
                        return d3.interpolateBlues(this.dataManager.prediction_result[i]);
                    else 
                        return d3.interpolateReds(-this.dataManager.prediction_result[i]);
                } else {
                    return this.colormap(d[1]);
                }
            });
        else{
            this.draw();
        }
    }

    //current selected neuron or filter's activation score and indexs
    set_activation_score(msg, data){
        this.dataManager.setActivationScore(data);

        let x = this.margin.left;
        let y = this.margin.top + this.embedding_height + 50;

        this.draw_activation_score_hist(x, y, this.embedding_width, 80, data);
    }
}