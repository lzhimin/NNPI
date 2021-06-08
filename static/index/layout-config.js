let config = {
    content: [{
        type: 'row',
        content: [{
            type: 'column',
            width: 50,
            content: [{
                type: 'stack',
                height: 65,
                content: [{
                    type: 'component',
                    componentName: 'MainView',
                    title: 'Main View'
                }]
                
            },{
                type: 'component',
                componentName: 'ProjectionView',
                title: 'Selected Samples'
            }]
        },{
            type: 'stack',
            content: [{
                type: 'component',
                componentName: 'NetworkArchitecture',
                title: 'Network Architecture'
            }]
        }]
    }]
};