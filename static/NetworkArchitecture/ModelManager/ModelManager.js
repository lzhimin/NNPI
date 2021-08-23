class ModelManager {

    constructor(svg){
        this.svg =svg.append('g');

        this.margin = {'top':40, 'left':40, 'right':20};

        this.dataManager = new ModelManagerData();

        this.model_selection = false;
    }

    init(){

    }

    draw(){
        
        if(this.model_selection)
            return;

        this.init();

        let w = 100;
        let h = 10;
        let padding = 100;
        let x = this.margin.left;
        let y = this.margin.top;

    }

    draw_model_block(x, y, w, h, key, model){
        
    }

    redraw(){

    }
}