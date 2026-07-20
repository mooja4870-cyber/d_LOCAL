const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const BASE_URL = 'https://www.monthler.kr';

function generateHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

async function scrapeMonthler() {
  console.log('[Crawler] Starting monthler.kr scraper...');
  const items = [];
  try {
    // 1. Fetch main page or achievement page to get latest program links
    const res = await axios.get(`${BASE_URL}/achievement`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    });

    const $ = cheerio.load(res.data);
    const links = new Set();
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/programs/')) {
        links.add(href.startsWith('http') ? href : `${BASE_URL}${href}`);
      }
    });

    const targetLinks = Array.from(links).slice(0, 15); // limit to recent 15
    console.log(`[Crawler] Found ${targetLinks.length} program links on monthler.kr`);

    // 2. Fetch details for each link
    for (const link of targetLinks) {
      try {
        const detailRes = await axios.get(link, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 8000
        });
        const $d = cheerio.load(detailRes.data);
        
        let title = $d('meta[property="og:title"]').attr('content') || $d('title').text();
        let description = $d('meta[property="og:description"]').attr('content') || $d('meta[name="description"]').attr('content') || '';
        const publishedAt = new Date().toISOString(); // They don't expose date easily, default to now

        // Clean up title
        title = title.replace('한달살러 -', '').trim();

        if (title && title.includes('여행지원금') || title.includes('공모전') || title.includes('한달살기')) {
           const id = 'monthler_' + generateHash(link);
           items.push({
             id: id,
             title_original: title,
             title: `[한달살러] ${title}`,
             url_original: link,
             url: link,
             summary: description.substring(0, 200),
             published_at: publishedAt,
             source_name: '먼슬러(monthler.kr)',
             region: 'domestic',
             score_time: 0,
             score_benefit: 0,
             score_total: 0
           });
        }
      } catch (err) {
        console.error(`[Crawler] Failed to fetch monthler detail ${link}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Crawler] Failed to fetch monthler main page:', err.message);
  }

  return items;
}

module.exports = { scrapeMonthler };
