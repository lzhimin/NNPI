import random
from flask import Flask, render_template, request, json, jsonify
import sys
from python import dataloader
app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route("/_fetch_data", methods=["GET", "POST"])
def _fetch_data():
    json_request = request.get_json()

    print(json_request)

    return json.dumps({'data': [1, 2, 3, 4, 5]})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
