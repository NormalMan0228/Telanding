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
def landing():
    site = json.loads((Path(app.root_path) / 'content' / 'site.json').read_text(encoding='utf-8'))
    return render_template('pages/home.html', site=site)


@app.get('/chamber')
def chamber():
    return redirect(url_for('landing'))


@app.get('/play')
def explore():
    return redirect(url_for('landing'))

@app.get('/main')
def main():
    return redirect(url_for('landing'))

@app.get('/records')
def records():
    return redirect(url_for('landing', _anchor='unannounced'))

@app.get('/about')
def about():
    return redirect(url_for('landing'))

@app.get('/games')
def games():
    return redirect(url_for('landing', _anchor='games'))


@app.errorhandler(404)
def missing_room(error):
    return render_template('pages/missing.html'), 404

if __name__ == '__main__':
    app.run(debug=True)
