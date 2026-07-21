const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

function generateHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

// YYYYMMDD string to ISO Date string
function parseNaverDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return new Date().toISOString();
  const y = dateStr.substring(0, 4);
  const m = dateStr.substring(4, 6);
  const d = dateStr.substring(6, 8);
  return new Date(`${y}-${m}-${d}T12:00:00Z`).toISOString();
}

const NAVER_API_URLS = {
  blog: 'https://openapi.naver.com/v1/search/blog.json',
  cafe: 'https://openapi.naver.com/v1/search/cafearticle.json',
};

async function fetchNaverSearch() {
  console.log('[Naver API] Starting Naver Search collection...');
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('[Naver API] NAVER_CLIENT_ID or NAVER_CLIENT_SECRET is missing in .env. Skipping Naver search.');
    return [];
  }

  const keywords = [
    '숏폼 공모전',
    'AI 공모전',
    '여행지원금 한달살기'
  ];

  const items = [];
  const headers = {
    'X-Naver-Client-Id': clientId,
    'X-Naver-Client-Secret': clientSecret
  };

  for (const keyword of keywords) {
    for (const [type, url] of Object.entries(NAVER_API_URLS)) {
      try {
        const res = await axios.get(url, {
          headers,
          params: {
            query: keyword,
            display: 10,
            sort: 'date' // 최신순
          },
          timeout: 8000
        });

        if (res.data && Array.isArray(res.data.items)) {
          for (const item of res.data.items) {
            // Remove HTML tags (<b>, </b>) often returned by Naver API
            let rawTitle = (item.title || '').replace(/<[^>]*>?/gm, '');
            rawTitle = rawTitle.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            let rawDesc = (item.description || '').replace(/<[^>]*>?/gm, '');
            rawDesc = rawDesc.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

            const fullLink = item.link;
            const id = `naver_${type}_${generateHash(fullLink)}`;
            
            // map to common item schema
            items.push({
              id: id,
              title_original: rawTitle,
              title: `[네이버 ${type}] ${rawTitle}`,
              url_original: fullLink,
              url: fullLink,
              summary: rawDesc.substring(0, 250),
              published_at: parseNaverDate(item.postdate || item.datetime),
              source_name: `네이버 검색(${type})`,
              region: 'domestic',
              score_time: 0,
              score_benefit: 0,
              score_total: 0
            });
          }
        }
      } catch (err) {
        console.error(`[Naver API] Failed to fetch ${type} for '${keyword}':`, err.message);
      }
    }
  }

  console.log(`[Naver API] Completed. Total items collected: ${items.length}`);
  return items;
}

module.exports = { fetchNaverSearch };
