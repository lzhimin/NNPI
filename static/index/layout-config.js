let config = {
    content: [{
        type: 'row',
        content: [{
            type: 'column',
            width: 60,
            content: [{
                type: 'component',
                height: 50,
                componentName: 'MainView',
                title: 'Projection View'
            },{
                type: 'component',
                componentName: 'ProjectionView',
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