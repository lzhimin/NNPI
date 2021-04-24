
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

         
        let labels = Object.keys(this.dataManager.data);
        let data;
        let pixel_w = 3;
        let pixel_h = 3;
        let padding = 2;
        for (let i = 0; i < labels.length; i++){
            data = this.dataManager.data[labels[i]];

            for (let j = 0; j < data.length; j++) {
                this.draw_heatmap(null, this.margin.left + j * data[j].length * pixel_w + padding * j,
                    this.margin.top + i * data[j][0].length * pixel_h + padding * i, pixel_w, pixel_h, data[j]);
            }
        }
    }

    draw_heatmap(colormap, x, y, pixel_w, pixel_h, d) {
        
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

    setData(msg, data) {
        this.dataManager.setData(data);
        this.draw();
    }

}