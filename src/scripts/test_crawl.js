const axios = require('axios');
const cheerio = require('cheerio');

async function testMonthler() {
  console.log('--- Monthler ---');
  try {
    const res = await axios.get('https://www.monthler.kr/achievement', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    
    // try to find Next.js data
    const nextData = $('#__NEXT_DATA__').html();
    if (nextData) {
      console.log('Found __NEXT_DATA__');
    } else {
      console.log('No __NEXT_DATA__. Let us search for links.');
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/programs/')) {
          console.log('Found program link:', href, $(el).text());
        }
      });
    }
  } catch (e) {
    console.error('Monthler Error:', e.message);
  }
}

async function testWevity() {
  console.log('\n--- Wevity ---');
  try {
    // 21 = 영상/UCC/사진
    const res = await axios.get('https://www.wevity.com/?c=find&s=1&gub=1&cidx=21', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    $('.list .tit a').slice(0, 5).each((i, el) => {
      console.log($(el).text().trim(), $(el).attr('href'));
    });
  } catch (e) {
    console.error('Wevity Error:', e.message);
  }
}

async function testWelchon() {
  console.log('\n--- Welchon ---');
  try {
    const res = await axios.get('https://www.welchon.com/web/lay1/program/S1T31C447/eventNewList.do?cIdx=evpr', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    $('.board_list .title a').slice(0, 5).each((i, el) => {
      console.log($(el).text().trim(), $(el).attr('href'));
    });
  } catch (e) {
    console.error('Welchon Error:', e.message);
  }
}

async function run() {
  await testMonthler();
  await testWevity();
  await testWelchon();
}

run();
