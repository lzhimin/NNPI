let config = {
    content: [{
        type: 'row',
        content: [{
            type: 'column',
            width: 40,
            content: [{
                type: 'stack',
                height: 70,
                content: [{
                    type: 'component',
                    componentName: 'MainView',
                    title: 'Main View'
                }]
            },{
                type: 'row',
                width: 50,
                content:[{
                    type: 'component',
                    componentName: 'SelectedSampleView',
                    title: 'Selected Samples'
                },{
                    type: 'component',
                    componentName: 'FeatureView',
                    title: 'Feature Visualization'
                }]
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