function fetch_data(json) {
    $.ajax({
        url: '/_fetch_data',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            publish("MainVis", [data.input_summary, data.embedding_label]);
            publish("modelsummary", [data.modelSummary, data.prediction_summary, data.input_summary, data.embedding_label, data.activation_pattern])
            publish("input_summary", )
            publish("embedding", [data.embedding, data.embedding_label])
        }
    });
}