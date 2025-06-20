function fetch_data(json) {
    $.ajax({
        url: '/_fetch_data',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            publish("model_summary", [data.model_summary, data.prediction_summary, data.embedding, data.embedding_label, data.activation_pattern])
            publish("input_summary", [data.embedding, data.embedding_label, data.predict_result, data.prediction_summary])
            publish('evaluation_table', data.evaluation_table);
        }
    });
}

function fetch_fitler_visualization(json){
    $.ajax({
        url: '/_fetch_filter',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            publish('FeatureVisualization', data.featureVis);
            publish('Activation_Score', data.scores);
        }
    });
}

function fetch_activation(json) {
    $.ajax({
        url: '/_fetch_activation',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            publish("activation_pattern", data.activation_pattern);
            publish("SelectedSample", data.selectedData);
        }
    });
}

function fetch_activation_subnetwork(json) {
    $.ajax({
        url: '/_fetch_activation_subnetwork',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            publish("subnetwork_activation_patter", data.activation_pattern);
        }
    });
}

function fetch_sample_activation(json) {
    $.ajax({
        url: '/_fetch_sample_activation',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            publish("input_activation_pattern", data.input_activation_pattern);
            publish('feature_vis', data.feature_vis)
        }
    });
}

function fetch_selected_architecture_info(json){
    $.ajax({
        url: '/_fetch_selected_architecture_info',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            publish("predict_summary", data);
        }
    });
}

function update_selected_model(json){
    $.ajax({
        url: '/_update_selected_model',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            //publish("", data.predict_summary);
        }
    });
}