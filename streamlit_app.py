import datetime
import json
import os
import re
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

REQUIRED_BENEFIT_CONTEST_KEYWORDS = [
    '공모전', '공모', '경진대회', '해커톤', 'hackathon', '출품작', '출품', '시상금', '상금',
    '한달살기', '촌캉스', '살아보기', '지역체류', '체류지원', '체류 지원', '숙박지원', '숙박 지원', '귀농귀촌', '농촌여행',
    'contest', 'challenge', 'competition', 'grant', 'film festival', 'film contest', 'video contest', 'short-form contest', 'short-form challenge'
]

EXCLUDED_RESULT_CLOSED_KEYWORDS = [
    '최우수상', '우수상', '대상 수상', '장려상', '수상작 발표', '수상자 발표', '결과발표', 
    '결과 발표', '선정 결과', '선정결과', '최종 선정', '최종선정', '시상식 개최', '성료', 
    '폐막', '모집종료', '모집 종료', '접수마감', '접수 마감', '당선작', '아티스트 선정', '수상…', '수상:'
]

EXCLUDED_IRRELEVANT_KEYWORDS = [
    '아파트', '시공사', '건설사', '분양', '수의계약', '재개발', '재건축', '컨소시엄',
    '노조', '쟁의', '파업', '주가', '주식', '코스피', '코스닥', '영업이익', '매출액', 'M&A', '인수합병', '지분', 'CEO', 'CTO', '임원 인사', '예산안', '당정',
    '스크립팅', '프리커서', '봇 차단', '봇차단', '탠덤 OLED', '저궤도망', '소버린', '데이터센터', 
    '차량 보험', '자동차보험', '자생한방', '저작권 합의', '폐기능 예측', '폐기능', 'CT 영상', '의료 영상', 
    '병원신문', '조직 신설', '해킹방어대회', '코드게이트', '하버드 스타트업'
]

def is_strictly_active_contest_or_benefit_py(item):
    if not item or not isinstance(item, dict):
        return False
    title = str(item.get("title") or item.get("title_original") or "").strip()
    summary_lines = item.get("summary_3lines")
    if isinstance(summary_lines, list):
        summary = " ".join([str(l) for l in summary_lines])
    else:
        summary = str(item.get("summary") or "")
    if not title:
        return False
    
    full_text = f"{title}\n{summary}"
    lower_text = full_text.lower()
    
    for irr_kw in EXCLUDED_IRRELEVANT_KEYWORDS:
        if irr_kw in full_text:
            return False

    for closed_kw in EXCLUDED_RESULT_CLOSED_KEYWORDS:
        if closed_kw in full_text:
            return False
            
    if (re.search(r'\b202[0-5]년\b', full_text) or re.search(r'\b202[0-5]\.\s*\d{1,2}\b', full_text)) and not (re.search(r'\b202[6-9]년\b', full_text) or re.search(r'\b202[6-9]\.', full_text)):
        return False
        
    has_benefit = any(kw.lower() in lower_text for kw in REQUIRED_BENEFIT_CONTEST_KEYWORDS)
    is_video_ai_combo = (
        ('숏폼' in lower_text or '쇼츠' in lower_text or '릴스' in lower_text or '영상' in lower_text or 'short-form' in lower_text) and
        ('공모' in lower_text or '모집' in lower_text or '접수' in lower_text or '시상' in lower_text or '경진' in lower_text or '장학금' in lower_text or '개최' in lower_text)
    )

    if not has_benefit and not is_video_ai_combo:
        return False
        
    return True

def apply_py_filter(brief_data):
    if not brief_data or not isinstance(brief_data, dict):
        return brief_data
    items = brief_data.get("items")
    if isinstance(items, list):
        brief_data["items"] = [item for item in items if is_strictly_active_contest_or_benefit_py(item)]
    return brief_data

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
            return apply_py_filter(json.loads(data_str))
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
                return apply_py_filter(json.loads(row[0]))
        except Exception:
            pass

    # 3. Fallback: Directly read from committed JSON snapshot (data/brief_snapshot.json)
    snapshot_path = project_root / "data" / "brief_snapshot.json"
    if snapshot_path.exists():
        try:
            return apply_py_filter(json.loads(snapshot_path.read_text(encoding="utf-8")))
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
