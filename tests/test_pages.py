"""Route and template integration checks; run with python -m unittest discover -s tests."""
import unittest
from html.parser import HTMLParser
from unittest.mock import patch
from app import app

class Document(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.ids=[]
        self.assets=[]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ['href','src']:
            if attrs.get(key,'').startswith('/static/'):
                self.assets.append(attrs[key])

class PagesTest(unittest.TestCase):
    def setUp(self):
        self.client=app.test_client()

    def test_pages_and_navigation(self):
        for path in ['/', '/chamber', '/play', '/games', '/records', '/about']:
            response=self.client.get(path)
            self.assertEqual(response.status_code,200)
            html=response.get_data(as_text=True)
            self.assertIn('Telemera',html)
            self.assertNotIn('HATE COMPANY',html)
            self.assertIn('href="/"',html)
            self.assertNotIn('class="site-nav"',html)
        self.assertEqual(self.client.get('/main').location,'/')

    def test_removed_content_and_logo(self):
        html=self.client.get('/').get_data(as_text=True)
        for text in ['class="heading"', 'class="below"', 'class="note"', 'id="reset"', '/ README', '로그아웃하지 않았다']:
            self.assertNotIn(text,html)
        self.assertIn('class="logo-text"',html)
        self.assertIn('data-text="Telemera"',html)

    def test_missing_room_keeps_the_site_and_return_paths(self):
        response=self.client.get('/unassigned-room')
        self.assertEqual(response.status_code,404)
        html=response.get_data(as_text=True)
        self.assertIn('<h1>404</h1>',html)
        self.assertIn('href="/games"',html)
        self.assertIn('css/base.css',html)

    def test_page_specific_assets(self):
        self.assertNotIn('js/game/index.js',self.client.get('/').get_data(as_text=True))
        self.assertIn('href="/chamber"',self.client.get('/').get_data(as_text=True))
        self.assertIn('href="/play"',self.client.get('/chamber').get_data(as_text=True))
        self.assertNotIn('curtain-canvas',self.client.get('/chamber').get_data(as_text=True))
        self.assertIn('curtain-surface',self.client.get('/').get_data(as_text=True))
        self.assertIn('js/game/index.js',self.client.get('/play').get_data(as_text=True))
        self.assertNotIn('js/game/index.js',self.client.get('/about').get_data(as_text=True))
        for name in ['index','renderer','audio','session','config']:
            with self.client.get(f'/static/js/game/{name}.js') as response:
                self.assertEqual(response.status_code,200)
        for name in ['base','layout','explorer','pages']:
            with self.client.get(f'/static/css/{name}.css') as response:
                self.assertEqual(response.status_code,200)

    def test_all_linked_assets_exist_and_widget_ids_are_unique(self):
        for page in ['/', '/chamber', '/play', '/games', '/records']:
            document=Document(self.client.get(page).get_data(as_text=True))
            self.assertEqual(len(document.ids),len(set(document.ids)),page)
            for path in document.assets:
                with self.client.get(path) as response:
                    self.assertEqual(response.status_code,200,path)

    def test_promotion_supports_real_links_and_hides_unannounced_links(self):
        html=self.client.get('/games').get_data(as_text=True)
        self.assertNotIn('공개 준비 중',html)
        self.assertNotIn('다음 게임',html)
        self.assertNotIn('href="None"',html)
        self.assertNotIn('스토어 방문',html)
        catalog={'studio':'Telemera','games':[{
            'id':'test-game','title':'<signal>','description':'테스트용 소개',
            'status':'개발 중','eyebrow':'TELEMERA','release':'추후 공개',
            'store_url':'https://example.com/store','trailer_url':'https://example.com/trailer',
        }]}
        with patch('app.load_catalog',return_value=catalog):
            html=self.client.get('/games').get_data(as_text=True)
            self.assertIn('&lt;signal&gt;',html)
            self.assertIn('href="https://example.com/store"',html)
            self.assertIn('href="https://example.com/trailer"',html)
            self.assertIn('id="test-game"',html)

if __name__=='__main__':
    unittest.main()
