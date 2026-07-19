import datetime
import json
import os
import sqlite3
import subprocess
import time
import urllib.request
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

# ================================================================
# Page Config - Premium Dark Theme
# ================================================================
st.set_page_config(
    page_title="AI & 숏폼 공모전 브리핑 (d_LOCAL)",
    page_icon="🏆",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
    /* Premium Streamlit CSS Reset */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header[data-testid="stHeader"] {visibility: hidden; display: none;}
    .block-container {padding: 0 !important; max-width: 100vw !important;}
    .stApp {background-color: #030712;}
    iframe {border: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;}
    </style>
    """,
    unsafe_allow_html=True,
)

# ================================================================
# Background Backend Process Setup (Express API on port 3001)
# ================================================================
@st.cache_resource
def start_backend_server():
    project_root = Path(__file__).parent
    try:
        proc = subprocess.Popen(
            ["node", "src/server.js"],
            cwd=project_root,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        time.sleep(2)  # Give Node Express time to bind port 3001 and initialize SQLite
        return proc
    except Exception as e:
        return None

start_backend_server()

# ================================================================
# Data Loading & Injection for Streamlit Cloud (No External API required)
# ================================================================
def fetch_brief_data_locally():
    project_root = Path(__file__).parent
    today = datetime.date.today().isoformat()
    
    # 1. Try fetching from the local Node Express server running on loopback port 3001 inside container
    try:
        url = f"http://127.0.0.1:3001/api/brief?date={today}&mode=execution&level=3_5&itemCount=100"
        req = urllib.request.urlopen(url, timeout=3)
        if req.status == 200:
            data_str = req.read().decode('utf-8')
            return json.loads(data_str)
    except Exception:
        pass

    # 2. Fallback: Directly read from local SQLite database (data/brief.db) via Python sqlite3
    db_path = project_root / "data" / "brief.db"
    if db_path.exists():
        try:
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            cursor.execute(
                "SELECT json FROM daily_briefs WHERE date = ? AND mode = ? AND level = ? LIMIT 1",
                (today, "execution", "3_5")
            )
            row = cursor.fetchone()
            if not row:
                cursor.execute(
                    "SELECT json FROM daily_briefs WHERE mode = ? AND level = ? ORDER BY date DESC LIMIT 1",
                    ("execution", "3_5")
                )
                row = cursor.fetchone()
            conn.close()
            if row and row[0]:
                return json.loads(row[0])
        except Exception:
            pass
            
    return None

def get_inlined_html():
    project_root = Path(__file__).parent
    dist_html = project_root / "frontend" / "dist" / "index.html"
    
    if not dist_html.exists():
        return None
        
    html = dist_html.read_text(encoding="utf-8")
    
    # Inject live initial briefing data directly into SPA so browser doesn't need external fetch
    brief_data = fetch_brief_data_locally()
    if brief_data:
        json_payload = json.dumps(brief_data, ensure_ascii=False)
        injection_script = f"""<script>
window.STREAMLIT_HOSTED = true;
window.__INJECTED_BRIEF_DATA__ = {json_payload};
</script>"""
        html = html.replace("<head>", f"<head>{injection_script}", 1)
    else:
        injection_script = "<script>window.STREAMLIT_HOSTED = true;</script>"
        html = html.replace("<head>", f"<head>{injection_script}", 1)
        
    return html

# ================================================================
# Main Execution
# ================================================================
html_content = get_inlined_html()

if html_content:
    components.html(html_content, height=2200, scrolling=True)
else:
    st.error("Missing frontend bundle. Please run 'build:web' script first.")
    st.info("Run: npm run build:web")
    st.stop()
