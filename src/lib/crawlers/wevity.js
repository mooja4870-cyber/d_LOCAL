const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const BASE_URL = 'https://www.wevity.com';

function generateHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

async function scrapeWevity() {
  console.log('[Crawler] Starting wevity.com scraper...');
  const items = [];
  try {
    // cidx=21: 영상/UCC/사진/AI
    // cidx=14: 기획/아이디어/마케팅 (옵션)
    const targets = [
      `${BASE_URL}/?c=find&s=1&gub=1&cidx=21`,
      `${BASE_URL}/?c=find&s=1&gub=1&cidx=14`
    ];

    for (const targetUrl of targets) {
      const res = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(res.data);
      $('.list .tit a').slice(0, 10).each((i, el) => {
        const titleRaw = $(el).text().trim();
        const href = $(el).attr('href');
        if (titleRaw && href) {
          // Remove internal flags like "SPECIAL", "IDEA" which wevity appends in DOM
          const cleanTitle = titleRaw.replace(/SPECIAL/g, '').replace(/IDEA/g, '').trim();
          const fullLink = href.startsWith('http') ? href : `${BASE_URL}/${href.replace(/^\//, '')}`;
          const id = 'wevity_' + generateHash(fullLink);
          
          items.push({
            id: id,
            title_original: cleanTitle,
            title: `[위비티] ${cleanTitle}`,
            url_original: fullLink,
            url: fullLink,
            summary: `위비티(Wevity) 공모전 - ${cleanTitle} (자세한 내용은 링크 참조)`,
            published_at: new Date().toISOString(),
            source_name: '위비티(wevity.com)',
            region: 'domestic',
            score_time: 0,
            score_benefit: 0,
            score_total: 0
          });
        }
      });
    }
    console.log(`[Crawler] Found ${items.length} program links on wevity.com`);
  } catch (err) {
    console.error('[Crawler] Failed to fetch wevity:', err.message);
  }

  return items;
}

module.exports = { scrapeWevity };
