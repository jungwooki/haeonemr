"""Guard the supplied questionnaire and analysis against unintended editing."""
import hashlib
import json
import unittest
from html.parser import HTMLParser
from pathlib import Path

import build
from mental_catalog import load_catalog

ROOT = Path(__file__).resolve().parents[1]


class MentalSurveyTests(unittest.TestCase):
    def test_original_questionnaire_and_scoring_are_unchanged(self):
        baseline = json.loads((ROOT / 'tools/mental-baseline.json').read_text())
        data = json.dumps(load_catalog(ROOT)[1], ensure_ascii=False).encode()
        original_keys = ['soccer', 'baseball', 'basketball', 'volleyball', 'golf', 'student']
        original_data = {key: json.loads(data)[key] for key in original_keys}
        self.assertEqual(original_data['soccer']['label'], '유소년축구')
        original_data['soccer']['label'] = '축구'  # Authorized title-only rename.
        original_bytes = json.dumps(original_data, ensure_ascii=False).encode()
        self.assertEqual(hashlib.sha256(original_bytes).hexdigest(), baseline['data_sha256'])
        js = (ROOT / 'src/scripts/mental-survey.js').read_text()
        calc = js[js.index('  function calcFactorScores()'):js.index('  let resultChart')]
        self.assertEqual(hashlib.sha256(calc.encode()).hexdigest(), baseline['analysis_sha256'])
        for sport in json.loads(data).values():
            items = [item for section in sport['sections'] for item in section['items']]
            self.assertEqual([item['no'] for item in items], list(range(1, 52)))
            self.assertEqual(len(sport['sections']), 5)

    def test_added_sports_preserve_soccer_item_mapping(self):
        data = load_catalog(ROOT)[1]
        original = data['soccer']['sections']
        # These items intentionally retain their daily-life/interpersonal scope.
        unchanged = {2, 3, 4, 6, 7, 12, 13, 14, 16, 17, 18, 21, 23, 25,
                     29, 31, 32, 39, 44, 46, 49, 50, 51}
        for key in ['ballet', 'gymnastics', 'ice_skating', 'ice_hockey', 'taekwondo', 'squash']:
            sections = data[key]['sections']
            self.assertEqual(len(sections), len(original))
            for source, adapted in zip(original, sections):
                self.assertEqual({k: v for k, v in source.items() if k != 'items'},
                                 {k: v for k, v in adapted.items() if k != 'items'})
                self.assertEqual([i['no'] for i in source['items']], [i['no'] for i in adapted['items']])
                for before, after in zip(source['items'], adapted['items']):
                    self.assertTrue(after['text'].strip())
                    self.assertNotIn('축구', after['text'])
                    if before['no'] in unchanged:
                        self.assertEqual(before['text'], after['text'])

    def test_new_screen_ids_do_not_collide(self):
        class IdParser(HTMLParser):
            def __init__(self):
                super().__init__()
                self.ids = []
            def handle_starttag(self, tag, attrs):
                self.ids.extend(value for key, value in attrs if key == 'id')
        page = IdParser()
        page.feed(build.render_outputs()['index.html'])
        fragment = IdParser()
        fragment.feed((ROOT / 'src/views/mental-survey.html').read_text())
        for identifier in fragment.ids:
            self.assertEqual(page.ids.count(identifier), 1, identifier)


if __name__ == '__main__':
    unittest.main()
