function fetch_data(json) {
    $.ajax({
        url: '/_fetch_data',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            publish("model_summary", [data.model_summary, data.prediction_summary, data.embedding, data.embedding_label, data.activation_pattern])
            publish("input_summary", [data.embedding, data.embedding_label])
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
        }
    });
}