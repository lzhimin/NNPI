class ModelOverview{

    constructor() {
        this.dataManager = new ModelOverviewData();
    
        this.margin = {'left':20, 'right':20, 'top':20, 'bottom': 20};

        this.component_w = 100;
        this.component_h = 100; 

    }


    draw(){

    }

    draw_component(type, data){

    }

    setSVG(svg){
        this.svg = svg;
    }

    setX(x){
        this.x = y;
    }

    setY(y){
        this.y = y;
    }

}