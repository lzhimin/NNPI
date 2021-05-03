
let myLayout = new GoldenLayout(config);

let _main_view;
let _prediction_summary_view;
let _error_analysis_view;

myLayout.registerComponent('MainView', function (container, state) {
    $(container.getElement()[0]).load('../static/MainView/MainView.html');
    //program Tree view, subscribe to data event
    _main_view = new MainView(container);
});

myLayout.registerComponent('PredictionSummary', function (container, state) {
    $(container.getElement()[0]).load('../static/PredictionSummary/PredictionSummary.html');
    //program Tree view, subscribe to data event
    _prediction_summary_view = new PredictionSummaryView(container);
});

myLayout.registerComponent('ErrorAnalysis', function (container, state) {
    $(container.getElement()[0]).load('../static/ErrorAnalysis/ErrorAnalysisView.html');
    //program Tree view, subscribe to data event
    _error_analysis_view = new ErrorAnalysisView(container);
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