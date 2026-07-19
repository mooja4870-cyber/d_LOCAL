import unittest
from pathlib import Path
import os

class TestStreamlitApp(unittest.TestCase):
    def test_files_exist(self):
        root = Path(__file__).parent.parent
        self.assertTrue((root / "streamlit_app.py").exists())
        self.assertTrue((root / "requirements.txt").exists())
        self.assertTrue((root / "frontend" / "dist" / "index.html").exists())

    def test_streamlit_app_content(self):
        root = Path(__file__).parent.parent
        content = (root / "streamlit_app.py").read_text()
        self.assertIn("st.set_page_config", content)
        self.assertIn("components.html", content)

if __name__ == "__main__":
    unittest.main()
