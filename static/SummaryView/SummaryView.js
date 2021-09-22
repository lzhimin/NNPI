class SummaryView extends BasicView {

    constructor(container) {
        super(container);
        this.dataManager = new SummaryViewData();
        
        subscribe("evaluation_table", this.setData.bind(this));
    }

    init() {

        super.init();

        //add canvas 
        this.svg = d3.select('#summary_view_panel')
            .append('svg')
            .attr('width', this.width)
            .attr("height", 1000)
            .append('g'); 
        
        //update margin value
        this.margin.left = 50;
        this.margin.top = 100;  
    }

    draw() {
        this.init();
        this.x = this.margin.left;
        this.y = this.margin.top;
        this.cellwidth = 100;
        this.cellheight = 30;
        this.plot_padding = 20;

        let c_h = 0;
        Object.keys(this.dataManager.data).forEach((key)=>{
            let g = this.svg.append('g');
            c_h += this.draw_node(key, this.dataManager.data[key], this.x, this.y + c_h, this.cellwidth, this.cellheight, g);
        });   
        

        let label_x = this.x + this.cellwidth * 2;
        let label_y = this.y - 27;
        this.draw_label(label_x, label_y, this.cellwidth, this.cellheight, this.svg.append('g'));
    }

    draw_node(key, data, x, y, width, height, g){
        let c_h = 0;
        if('accuracy' in data){
            c_h += this.draw_leaf(x + this.plot_padding + width, y, width, height, data, g);
        }else{
            
            Object.keys(data).forEach((key)=>{
                let ng = g.append('g');
                c_h += this.draw_node(key, data[key], x + width, c_h + y, width, height, ng);
            });
        }

        g.append('rect')
            .attr('x', x )
            .attr('y', y)
            .attr('width', width)
            .attr('height', c_h)
            .attr('class', 'table_element_background');

        g.append('text')
            .text(key)
            .attr('x', (d, i)=>{
                return x + width * i + width/2;
            })
            .attr('y', y+c_h/2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central');

        return c_h;
    }

    draw_leaf(x, y, width, height, data, g){
        
        let padding = this.plot_padding;
        g.selectAll('.table_element')
            .data(Object.values(data))
            .enter()
            .append('rect')
            .attr('x', (d, i)=>{
                return x + (width + padding) * i;
            })
            .attr('y', y)
            .attr('width', (d, i)=>{
                return i==0 ? d/100 * width : d * width;
            })
            .attr('height', height - 5)
            .style('fill', 'steelblue');

        return height;
    }

    draw_label(x, y, width, height, g){
        let labels = ['ratio', 'accuracy', 'adversial', 'flip rate'];
        let padding = this.plot_padding
        g.selectAll('.table_label')
            .data(labels)
            .enter()
            .append('text')
            .text(d=>d)
            .attr('x', (d, i)=>{
                return i == 0 ? x + i * (width + padding) + width/2 : x + i * (width + padding) + width/2 + this.plot_padding;
            })
            .attr('y', y)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central');

        //add axis for each dimension
        for(let i = 1; i < labels.length; i++){
            let x_axis = d3.scaleLinear().domain([0 , 1]).range([x + i * width + this.plot_padding, x + (i + 1) * (width) + this.plot_padding]);

            g.append('g')
                .attr('class', 'table_axis')
                .attr("transform", "translate(" +(padding * (i-1))+ ',' + (y + 25) + ")")
                .call(d3.axisTop(x_axis).ticks(3));
        }
    }

    setData(msg, data) {
        this.dataManager.setData(data);
        this.draw();
    }
}