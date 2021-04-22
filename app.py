import random
from flask import Flask, render_template, request, json, jsonify
import sys
from python import data


app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route("/_fetch_data", methods=["GET", "POST"])
def _fetch_data():
    json_request = request.get_json()

    return json.dumps(data.getdata())


if __name__ == '__main__':
    app.run(debug=True, port=5000)
