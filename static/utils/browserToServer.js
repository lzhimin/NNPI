function fetch_data(json) {
    $.ajax({
        url: '/_fetch_data',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        dataType: 'json',
        success: function (data) {
            publish("DATASET", data);
            publish("confusionMatrix", data.summary);
            publish("errorPrediction", data.error_prediction)
        }
    });
}