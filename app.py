import random
from flask import Flask, render_template, request, json, jsonify
from python import data


app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route("/_fetch_data", methods=["GET", "POST"])
def _fetch_data():
    json_request = request.get_json()
    return json.dumps(data.getdata(json_request))


@app.route("/_fetch_activation", methods=["GET", "POST"])
def _fetch_activation():
    json_request = request.get_json()
    return json.dumps(data.getActivation(json_request['indexs']))

@app.route("/_fetch_activation_subnetwork", methods=["GET", "POST"])
def _fetch_activation_subnetwork():
    json_request = request.get_json()
    return json.dumps(data.getActivation(json_request['indexs']))



@app.route("/_fetch_sample_activation", methods=["GET", "POST"])
def _fetch_sample_activation():
    json_request = request.get_json()
    return json.dumps(data.mapping_neuron_activation_to_input(json_request))

@app.route("/_fetch_selected_architecture_info", methods=["GET", "POST"])
def _fetch_selected_architecture_info():
    json_request = request.get_json()
    return json.dumps(data.selected_architecture_info(json_request))

@app.route("/_fetch_filter", methods=["GET", "POST"])
def _fetch_filter():
    json_request = request.get_json()
    return json.dumps(data.fetch_activation_feature_samples(json_request))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
