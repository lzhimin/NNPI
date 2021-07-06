
let myLayout = new GoldenLayout(config);

let _main_view;
let _network_architecture_view;
let _selected_sample_view;

myLayout.registerComponent('MainView', function (container, state) {
    $(container.getElement()[0]).load('../static/MainView/MainView.html');
    //program Tree view, subscribe to data event
    _main_view = new MainView(container);
});

myLayout.registerComponent('NetworkArchitecture', function (container, state) {
    $(container.getElement()[0]).load('../static/NetworkArchitecture/NetworkArchitecture.html');
    //program Tree view, subscribe to data event
    _network_architecture_view = new NetworkArchitecture(container);
});

myLayout.registerComponent('SelectedSampleView', function (container, state) {
    $(container.getElement()[0]).load('../static/SelectedSample/SelectedSample.html');
    //program Tree view, subscribe to data event
    _selected_sample_view = new SelectedSampleView(container);
});

myLayout.on('itemCreated', (item) => {
    if (item.config.cssClass) {
        item.element.addClass(item.config.cssClass);
    }
});

myLayout.init();

// define global function
function loadData() {
    let name = $('#data_file_selector').val();
    fetch_data({'percentage':0, 'dataset':name});
}