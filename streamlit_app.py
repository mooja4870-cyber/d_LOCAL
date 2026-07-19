import json
import os
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

# ================================================================
# Page Config - Premium Dark Theme
# ================================================================
st.set_page_config(
    page_title="AI & 숏폼 공모전 브리핑 (d_airelatednews)",
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
# Data Loading & Injection
# ================================================================
def get_inlined_html():
    project_root = Path(__file__).parent
    # We prefer the inlined version produced by vite-plugin-singlefile
    dist_html = project_root / "frontend" / "dist" / "index.html"
    
    if not dist_html.exists():
        return None
        
    html = dist_html.read_text(encoding="utf-8")
    
    # Optional logic: Inject environment variables or local data if needed
    # Example: Injection of backend URL or Supabase config
    # injection_script = f"<script>window.STREAMLIT_HOSTED = true;</script>"
    # html = html.replace("<head>", f"<head>{injection_script}", 1)
    
    return html

# ================================================================
# Main Execution
# ================================================================
html_content = get_inlined_html()

if html_content:
    # Use components.html to render the entire SPA
    # height=2200 is a safe placeholder, but inside CSS we fixed it to viewport
    components.html(html_content, height=2200, scrolling=True)
else:
    st.error("Missing frontend bundle. Please run 'build:web' script first.")
    st.info("Run: npm run build:web")
    st.stop()
