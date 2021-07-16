class ModelManager {

    constructor(svg){
        this.svg =svg.append('g');

        this.margin = {'top':40, 'left':40, 'right':20};

        this.dataManager = new ModelManagerData();
    }

    init(){

    }

    draw(){
        
        this.init();

        let w = 100;
        let h = 10;
        let padding = 100;
        let x = this.margin.left;
        let y = this.margin.top;

        let keys = Object.keys(this.dataManager.model_summary);
        for(let i = 0; i < keys.length; i++){
            this.draw_model_block(x + i * (w + padding), y, w, h, keys[i], this.dataManager.model_summary[keys[i]]);
        }
    }

    draw_model_block(x, y, w, h, key, model){
        
        let entries = Object.keys(model);
        let g = this.svg.append('g');

        g.selectAll('.modelSummary')
            .data(entries)
            .enter()
            .append('rect')
            .attr('x', x)
            .attr('y', (d, i)=>{
                return y + (i+1) * h;
            })
            .attr('width', w)
            .attr('height', (d, i)=>{
                if (i == 3)
                    return 20;
                else
                    return h;
            })
            .attr('class', 'model_summary_block')
            .style('fill', (d,i)=>{
                if(i == 0)
                    return 'tomato';
                else if (i == 1)
                    return '#339933';
                else if (i == 2)
                    return 'steelblue';
                else
                    return 'white';
            })
            .style('fill-opacity', 0.65);
        
        g.selectAll('.modelSummaryText')
            .data([key, model['accuracy']])
            .enter()
            .append('text')
            .text((d, i)=>{
                return  i == 0 ? (d)+'%' : (d)+'%';
            })
            .attr('class', 'model_Summary_Text')
            .attr('x', (d, i)=>{
                return x + w/2.5;
            })
            .attr('y', (d, i)=>{
                return i == 0 ? (y+h) : y + (entries.length + 1) * h + h/2
            });
        
        //background
        g.append('rect')
            .attr('x', x-2)
            .attr('y', y - 2)
            .attr('width', w + 4)
            .attr('height', (entries.length+2) * h + 4)
            .attr('class', 'modelBlock')
            .style('fill-opacity', 0)
            .style('stroke', '#b36200')
            .style('stroke-opacity', 0)
            .on('click', function(d){
                d3.selectAll('.modelBlock').style('stroke-opacity', 0);
                d3.select(this).style('stroke-opacity', 1);
                //update_selected_model({'model':'5%'});
                
                //fetch selected model information.
                //update current analysis model
                let name = $('#data_file_selector').val();
                fetch_data({'percentage':+key, 'dataset':name});
            });
    }

    redraw(){

    }
}