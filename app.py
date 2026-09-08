"""Telemera application entry point and page routes."""
import json
from pathlib import Path

from flask import Flask, redirect, render_template, url_for

app = Flask(__name__)

@app.context_processor
def game_catalog():
    return {'catalog': load_catalog()}


def load_catalog():
    path = Path(app.root_path) / 'content' / 'games.json'
    return json.loads(path.read_text(encoding='utf-8-sig'))


@app.get('/')
def explore():
    return render_template('pages/explore.html')

@app.get('/main')
def main():
    return redirect(url_for('explore'))

@app.get('/records')
def records():
    return render_template('pages/records.html')

@app.get('/about')
def about():
    return render_template('pages/about.html')

@app.get('/games')
def games():
    return render_template('pages/games.html')


@app.errorhandler(404)
def missing_room(error):
    return render_template('pages/missing.html'), 404

if __name__ == '__main__':
    app.run(debug=True)
