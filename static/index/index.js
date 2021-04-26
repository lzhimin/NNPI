
let myLayout = new GoldenLayout(config);

let _main_view;

myLayout.registerComponent('MainView', function (container, state) {
    $(container.getElement()[0]).load('../static/MainView/MainView.html');
    //program Tree view, subscribe to data event
    _main_view = new MainView(container);
});

myLayout.registerComponent('SideView', function (container, state) {
    $(container.getElement()[0]).load('../static/SideView/SideView.html');
    //program Tree view, subscribe to data event
});

myLayout.on('itemCreated', (item) => {
    if (item.config.cssClass) {
        item.element.addClass(item.config.cssClass);
    }
});

myLayout.init();

// define global function
function loadData() {
    fetch_data({'percentage':0});
}