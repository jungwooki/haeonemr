"""Question modules, generated review docs and deployment must agree."""
import json
from pathlib import Path
import shutil
import tempfile
import unittest

import build
from mental_catalog import load_catalog, review_documents

ROOT = Path(__file__).resolve().parents[1]


class MentalCatalogTests(unittest.TestCase):
    def test_documents_match_every_question_and_server_keys(self):
        entries, data = load_catalog(ROOT)
        self.assertEqual(len(entries), 13)
        docs = review_documents(entries, data)
        self.assertEqual(len(docs), 15)  # 13 sport docs, index and youth comparison.
        output = build.render_outputs()
        self.assertIn('var MENTAL_SPORT_KEYS = ' + json.dumps([e['key'] for e in entries]), output['Code.gs'])
        for entry in entries:
            key = entry['key']
            text = docs[f'guides/mental/{key}.md']
            for section in data[key]['sections']:
                for item in section['items']:
                    self.assertIn(f"| {item['no']} | {item['text']} |", text)
        self.assertIn('공식 PCDEQ2', docs['guides/mental/adult_soccer.md'])
        self.assertEqual(data['soccer']['label'], '유소년축구')

    def test_invalid_modules_fail_before_build(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            folder = root / 'src/data/mental'
            shutil.copytree(ROOT / 'src/data/mental', folder)
            path = folder / 'squash.json'
            data = json.loads(path.read_text())
            data['sections'][0]['items'][0]['no'] = 2
            path.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, '51 ordered'):
                load_catalog(root)
            path.unlink()
            with self.assertRaises(FileNotFoundError):
                load_catalog(root)

    def test_adult_retains_factor_mapping_and_changes_every_item(self):
        _, data = load_catalog(ROOT)
        for youth, adult in zip(data['soccer']['sections'], data['adult_soccer']['sections']):
            self.assertEqual({k: v for k, v in youth.items() if k != 'items'},
                             {k: v for k, v in adult.items() if k != 'items'})
            for a, b in zip(youth['items'], adult['items']):
                self.assertEqual(a['no'], b['no'])
                self.assertNotEqual(a['text'], b['text'])
