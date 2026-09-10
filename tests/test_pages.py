"""Public creator homepage and deferred route regression checks."""
import unittest
from html.parser import HTMLParser
from unittest.mock import patch
from app import app

class Document(HTMLParser):
    def __init__(self, html):
        super().__init__(); self.ids=[]; self.assets=[]; self.feed(html)
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        for key in ['href','src']:
            if attrs.get(key,'').startswith('/static/'): self.assets.append(attrs[key])

class PagesTest(unittest.TestCase):
    def setUp(self): self.client=app.test_client()
    def test_home_is_creator_hub_without_old_game_runtime(self):
        response=self.client.get('/'); self.assertEqual(response.status_code,200)
        html=response.get_data(as_text=True)
        for text in ['Telemera','YouTube','id="games"','id="unannounced"','id="frequency"']:
            self.assertIn(text,html)
        for text in ['js/game/index.js','js/entry/index.js','id="world"','href="None"']:
            self.assertNotIn(text,html)
    def test_deferred_routes_return_to_creator_home(self):
        for path,target in [('/play','/'),('/chamber','/'),('/main','/'),('/about','/'),('/games','/#games'),('/records','/#unannounced')]:
            response=self.client.get(path); self.assertEqual(response.status_code,302); self.assertEqual(response.location,target)
    def test_assets_and_ids(self):
        document=Document(self.client.get('/').get_data(as_text=True))
        self.assertEqual(len(document.ids),len(set(document.ids)))
        for asset in document.assets:
            with self.client.get(asset) as response: self.assertEqual(response.status_code,200,asset)
    def test_missing_youtube_has_no_fake_link(self):
        html=self.client.get('/').get_data(as_text=True)
        self.assertNotIn('href="https://youtube.com"',html)
        self.assertNotIn('href="None"',html)
    def test_configured_youtube_and_name_are_rendered_safely(self):
        with app.test_request_context('/'):
            from flask import render_template
            html=render_template('pages/home.html',site={'name':'<studio>','youtube_url':'https://www.youtube.com/@example'})
            self.assertIn('&lt;studio&gt;',html)
            self.assertIn('href="https://www.youtube.com/@example"',html)
    def test_missing_route(self): self.assertEqual(self.client.get('/not-a-page').status_code,404)

if __name__=='__main__': unittest.main()
