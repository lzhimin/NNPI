let config = {
    content: [{
        type: 'row',
        content: [{
            type: 'stack',
            content: [{
                type: 'component',
                componentName: 'NetworkArchitecture',
                title: 'Network Architecture'
            }]
        },{
            type: 'column',
            width: 75,
            content: [{
                type: 'stack',
                height: 65,
                content: [{
                    type: 'component',
                    componentName: 'MainView',
                    title: 'Projection View'
                },{
                type: 'component',
                componentName: 'PredictionSummary',
                title: 'Prediction Summary View'
            }]
                
            },{
                type: 'component',
                componentName: 'ProjectionView',
                title: 'Projection View'
            }]
        }]
    }]
};