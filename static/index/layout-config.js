let config = {
    content: [{
        type: 'row',
        content: [{
            type: 'stack',
            width: 60,
            content: [{
                type: 'component',
                componentName: 'MainView',
                title: 'Projection View'
            }]
        }, {
            type: 'column',
            content: [{
                type: 'component',
                height: 30,
                componentName: 'PredictionSummary',
                title: 'Prediction Summary View'
            },{
                type: 'component',
                componentName: 'ErrorAnalysis',
                title: 'Error Analysis View'
            }]
        }]
    }]
};