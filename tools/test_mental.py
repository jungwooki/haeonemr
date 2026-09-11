"""Guard the supplied questionnaire and analysis against unintended editing."""
import hashlib
import json
import unittest
from html.parser import HTMLParser
from pathlib import Path

import build

ROOT = Path(__file__).resolve().parents[1]


class MentalSurveyTests(unittest.TestCase):
    def test_original_questionnaire_and_scoring_are_unchanged(self):
        baseline = json.loads((ROOT / 'tools/mental-baseline.json').read_text())
        data = (ROOT / 'src/data/mental-sports.json').read_bytes()
        self.assertEqual(hashlib.sha256(data).hexdigest(), baseline['data_sha256'])
        js = (ROOT / 'src/scripts/mental-survey.js').read_text()
        calc = js[js.index('  function calcFactorScores()'):js.index('  let resultChart')]
        self.assertEqual(hashlib.sha256(calc.encode()).hexdigest(), baseline['analysis_sha256'])
        for sport in json.loads(data).values():
            items = [item for section in sport['sections'] for item in section['items']]
            self.assertEqual([item['no'] for item in items], list(range(1, 52)))
            self.assertEqual(len(sport['sections']), 5)

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
