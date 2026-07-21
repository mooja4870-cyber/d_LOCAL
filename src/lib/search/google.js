const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

function generateHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

const GOOGLE_API_URL = 'https://www.googleapis.com/customsearch/v1';

async function fetchGoogleSearch() {
  console.log('[Google API] Starting Google Search collection...');
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX; // Search Engine ID

  if (!apiKey || !cx) {
    console.warn('[Google API] GOOGLE_API_KEY or GOOGLE_CX is missing in .env. Skipping Google search.');
    console.warn('[Google API] (Note: Provided key seems non-standard. If it is SerpApi or another provider, please specify.)');
    return [];
  }

  const keywords = [
    '숏폼 공모전',
    'AI 공모전',
    '여행지원금 한달살기'
  ];

  const items = [];

  for (const keyword of keywords) {
    try {
      const res = await axios.get(GOOGLE_API_URL, {
        params: {
          key: apiKey,
          cx: cx,
          q: keyword,
          num: 10,
          sort: 'date' // Fetch recent
        },
        timeout: 10000
      });

      if (res.data && Array.isArray(res.data.items)) {
        for (const item of res.data.items) {
          const rawTitle = item.title || '';
          const rawDesc = item.snippet || '';
          const fullLink = item.link;
          const id = `google_${generateHash(fullLink)}`;
          
          items.push({
            id: id,
            title_original: rawTitle,
            title: `[구글 검색] ${rawTitle}`,
            url_original: fullLink,
            url: fullLink,
            summary: rawDesc.substring(0, 250),
            published_at: new Date().toISOString(), // Google JSON API doesn't reliably return exact post date without advanced mapping
            source_name: '구글 일반검색',
            region: 'domestic',
            score_time: 0,
            score_benefit: 0,
            score_total: 0
          });
        }
      }
    } catch (err) {
      console.error(`[Google API] Failed to fetch for '${keyword}':`, err.response?.data?.error?.message || err.message);
    }
  }

  console.log(`[Google API] Completed. Total items collected: ${items.length}`);
  return items;
}

module.exports = { fetchGoogleSearch };
