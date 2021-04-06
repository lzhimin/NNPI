let config = {
    content: [{
        type: 'row',
        content: [{
            type: 'stack',
            width: 55,
            content: [{
                type: 'component',
                componentName: 'MainView',
                title: 'Projection View'
            }]
        }, {
            type: 'stack',
            content: [{
                type: 'component',
                componentName: 'SideView',
                title: 'Side View'
            }]
        }]
    }]
};