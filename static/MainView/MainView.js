
class MainView extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new MainViewData();

        this.margin = { 'left': 20, 'right': 20, 'top': 20 };

        subscribe('DATASET', this.setData.bind(this))
    }

    init() {
        super.init();

        $('#main_view_canvas').html('');

        d3.select('#main_view_canvas')
            .attr('width', this.width)
            .attr("height", this.height);
        
        this.canvas = $('#main_view_canvas')[0].getContext('2d');;
    }

    draw() {
        this.init();

        
        let data;
        let pixel_w = 3;
        let pixel_h = 3;
        let padding = 2;
        let block_padding = 50;

        //draw presentative image
        let labels = Object.keys(this.dataManager.data.representative);
        for (let i = 0; i < labels.length; i++){
            data = this.dataManager.data.representative[labels[i]];
            for (let j = 0; j < data.length; j++) {
                this.draw_image(null, this.margin.left + j * data[j].length * pixel_w + padding * j,
                    this.margin.top + i * data[j][0].length * pixel_h + padding * i, pixel_w, pixel_h, data[j]);
            }
        }

        //draw saliency heatmap
        let x = this.margin.left + data[0].length * pixel_w * data.length + block_padding;
        for (let i = 0; i < labels.length; i++){
            data = this.dataManager.data.salient[labels[i]];
            for (let j = 0; j < data.length; j++) {
                //color map
                let max_pixel = d3.max(data[j], (d) => { return d3.max(d); });
                let min_pixel = d3.min(data[j], (d) => { return d3.min(d); });
                let rescale_func = d3.scaleLinear().domain([max_pixel, min_pixel]).range([0, 1]);
                this.draw_heatmap(rescale_func, x+j * data[j].length * pixel_w + padding * j, this.margin.top + i * data[j][0].length * pixel_h + padding * i, pixel_w, pixel_h, data[j]);
            } 
        }
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

    setData(msg, data) {
        this.dataManager.setData(data);
        this.draw();
    }

}