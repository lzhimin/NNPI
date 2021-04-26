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
            type: 'stack',
            content: [{
                type: 'component',
                componentName: 'PredictionSummary',
                title: 'Prediction Summary View'
            }]
        }]
    }]
};