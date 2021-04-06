let myLayout = new GoldenLayout(config);



myLayout.registerComponent('MainView', function (container, state) {
    $(container.getElement()[0]).load('../static/MainView/MainView.html');
    //program Tree view, subscribe to data event
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
//function changeFile() {
//    let filename = $('#program_TreeView_file_selector').val();
//    fetchDataset(filename);

    //public source code file
//    publish('SOURCECODE', filename);
//}