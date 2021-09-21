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
        this.margin.left = 15;

        
        
    }

    draw() {
        this.init();
        this.x = this.margin.left;
        this.y = this.margin.top;
        this.cellwidth = 150;
        this.cellheight = 30;

        let c_h = 0;
        Object.keys(this.dataManager.data).forEach((key)=>{
            let g = this.svg.append('g');
            c_h += this.draw_node(key, this.dataManager.data[key], this.x, this.y + c_h, this.cellwidth, this.cellheight, g);
        });         
    }

    draw_node(key, data, x, y, width, height, g){
        let c_h = 0;
        if('accuracy' in data){
            let padding = 20;
            c_h += this.draw_leaf(x + padding, y, width, height, data, g);
        }else{
            
            Object.keys(data).forEach((key)=>{
                let ng = g.append('g');
                c_h += this.draw_node(key, data[key], x + width, c_h + y, width, height, ng);
            });

            g.append('rect')
                .attr('x', x)
                .attr('y', y)
                .attr('width', width)
                .attr('height', c_h)
                .attr('class', 'table_element_background')

            g.append('text')
                .text(key)
                .attr('x', (d, i)=>{
                    return x + width * i;
                })
                .attr('y', y+c_h/2); 
        }

        return c_h;
    }

    draw_leaf(x, y, width, height, data, g){
        let padding = 5;

        g.selectAll('.table_element')
            .data(Object.values(data))
            .enter()
            .append('rect')
            .attr('x', (d, i)=>{
                return x + width * i;
            })
            .attr('y', y)
            .attr('width', (d, i)=>{
                return i==0 ? d/100 * width : d * width;
            })
            .attr('height', height - padding)
            .style('fill', 'steelblue');

        return height;
    }



    setData(msg, data) {
        this.dataManager.setData(data);
        this.draw();
    }
}