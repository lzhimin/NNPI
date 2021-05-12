class NetworkArchitecture extends BasicView {

    constructor(container) {
        super(container);

        this.dataManager = new NetworkArchitectureData();

        this.architecture = {};

        subscribe('ModelSummary', this.setData.bind(this))

    }

    init() {

        super.init();

        //add svg 
        d3.select('#network_view_panel')
            .append('svg')
            .attr('width', this.width)
            .attr("height", this.height);
        
        // construct data for each neural network layer
        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            this.architecture[layer_names[i]] = new LayerView(layer_names[i], this.dataManager.data[layer_names[i]])
        }
   }

    draw() {
        this.init();

        //draw the network architecture
        let x = this.margin.left;
        let y = this.margin.top;
        let width = 200;
        let height = 50;
        let padding = 10;
        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            let key = layer_names[i];

            this.architecture[key].setlocation(x, y + (height + padding) * i);
            this.architecture[key].setScale(width, height);
            this.architecture[key].draw();
        }
       
    }

    redraw() {
        //draw the network architecture
        let x = this.margin.left;
        let y = this.margin.top;

        let layer_names = Object.keys(this.dataManager.data);
        for (let i = 0; i < layer_names.length; i++){
            this.architecture[layer_names[i]].redraw();
        }
    }

  

    setData(msg, data) {
        this.dataManager.setData(data);
        this.draw();
    }
}