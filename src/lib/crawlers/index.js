const { scrapeMonthler } = require('./monthler');
const { scrapeWevity } = require('./wevity');

async function fetchAllCrawlers() {
  console.log('[Crawler Manager] Starting all custom web scrapers...');
  
  const results = await Promise.allSettled([
    scrapeMonthler(),
    scrapeWevity()
  ]);

  let allItems = [];
  
  for (const res of results) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      allItems = allItems.concat(res.value);
    } else if (res.status === 'rejected') {
      console.error('[Crawler Manager] A scraper failed:', res.reason);
    }
  }

  console.log(`[Crawler Manager] Completed. Total items collected: ${allItems.length}`);
  return allItems;
}

module.exports = { fetchAllCrawlers };
