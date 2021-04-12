class BasicView {

  constructor(container) {
    this.container = container;
    d3.select(this.container.getElement()[0]).style("overflow", "auto");
  }

  init() {
    this.width = this.container.getElement().width();
    this.height = this.container.getElement().height() - 20;
    this.margin = {
      "left": 20,
      "right": 20,
      "top": 20,
      "bottom": 20
    };
  }

}