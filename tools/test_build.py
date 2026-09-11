"""Offline build checks; never call the live EMR or Google services."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import build


class BuildTests(unittest.TestCase):
    def test_committed_outputs_match_sources(self):
        for name, text in build.render_outputs().items():
            self.assertEqual((build.ROOT / name).read_bytes(), text.encode('utf-8'), name)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        (self.root / 'src').mkdir()
        self.write('modules.json', json.dumps({'scripts': ['app.js'], 'server': ['server.gs']}))
        self.write('src/index.template.html', '{{ include view.html }}<script>{{ scripts }}</script>')
        self.write('view.html', '<main>Before</main>')
        self.write('app.js', 'const version = 1;')
        self.write('server.gs', 'function doGet() {}')

    def write(self, name, content):
        (self.root / name).write_text(content, encoding='utf-8')

    def test_source_changes_reach_outputs(self):
        with patch.object(build, 'ROOT', self.root):
            first = build.render_outputs()
            self.write('view.html', '<main>After</main>')
            self.write('app.js', 'const version = 2;')
            self.write('server.gs', 'function doPost() {}')
            second = build.render_outputs()
        self.assertNotEqual(first, second)
        self.assertEqual(second['index.html'], '<main>After</main><script>const version = 2;</script>')
        self.assertEqual(second['Code.gs'], 'function doPost() {}')

    def test_missing_source_fails(self):
        (self.root / 'app.js').unlink()
        with patch.object(build, 'ROOT', self.root), self.assertRaisesRegex(ValueError, 'missing source'):
            build.render_outputs()

    def test_circular_include_fails(self):
        self.write('view.html', '{{ include view.html }}')
        with patch.object(build, 'ROOT', self.root), self.assertRaisesRegex(ValueError, 'Circular include'):
            build.render_outputs()

    def test_duplicate_module_fails(self):
        self.write('modules.json', json.dumps({'scripts': ['app.js', 'app.js'], 'server': ['server.gs']}))
        with patch.object(build, 'ROOT', self.root), self.assertRaisesRegex(ValueError, 'duplicate modules'):
            build.render_outputs()


if __name__ == '__main__':
    unittest.main()
