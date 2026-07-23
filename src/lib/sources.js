const axios = require('axios');

function googleNewsRss(query, options = {}) {
  const lang = options.lang || 'ko';
  const country = options.country || 'KR';
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=${lang}&gl=${country}&ceid=${country}:${lang}`;
}

const RSS_SOURCES = [
  { name: '마실 (Masil) 지자체 체류·지원금 모음', url: googleNewsRss('site:masil.io OR "마실" ("살아보기" OR "지원금" OR "체류")'), region: 'domestic' },
  { name: '그린대로 (Greendaero) 농촌에서 살아보기', url: googleNewsRss('site:greendaero.go.kr OR "농촌에서 살아보기" OR "그린대로"'), region: 'domestic' },
  { name: '온통청년 (YouthCenter) 지역살이 지원사업', url: googleNewsRss('site:youthcenter.go.kr ("한달살기" OR "지역살이" OR "청년지원")'), region: 'domestic' },
  { name: '위비티 (Wevity) 영상/AI/공공 공모전', url: googleNewsRss('site:wevity.com ("AI" OR "영상" OR "숏폼" OR "공모전")'), region: 'domestic' },
  { name: '웰촌 (Welchon) 촌캉스·농촌체험', url: googleNewsRss('site:welchon.com OR "웰촌" ("촌캉스" OR "농촌체험" OR "공모")'), region: 'domestic' },
  { name: '시골투어 (Sigoltour) 로컬 체류 패키지', url: googleNewsRss('site:sigoltour.com OR "시골투어" ("시골" OR "체류" OR "체험")'), region: 'domestic' },
  { name: '지자체·공공기관 AI/숏폼 공모전', url: googleNewsRss('"AI 영상 공모전" OR "숏폼 공모전" OR "영상 콘텐츠 공모전"'), region: 'domestic' },
  { name: '지자체 홍보·체류(살아보기) 지원사업', url: googleNewsRss('"한달살기" OR "촌캉스" OR "살아보기" OR "지역체류" 공모'), region: 'domestic' },
  { name: 'Global AI & Video Contests', url: googleNewsRss('"AI video contest" OR "short-form contest" OR "AI film festival"', { lang: 'en', country: 'US' }), region: 'global' },
];

function decodeHtml(str) {
  if (!str) return '';
  let s = str;
  s = s.replace(/<!\[CDATA\[/g, '')
       .replace(/\]\]>/g, '')
       .replace(/&amp;/g, '&')
       .replace(/&quot;/g, '"')
       .replace(/&apos;/g, "'")
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&nbsp;/g, ' ');
  s = s.replace(/&#(\d+);/g, (m, code) => {
    const n = parseInt(code, 10);
    return Number.isFinite(n) ? String.fromCharCode(n) : m;
  });
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (m, code) => {
    const n = parseInt(code, 16);
    return Number.isFinite(n) ? String.fromCharCode(n) : m;
  });
  return s;
}

function stripTags(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ');
}

function collapseWhitespace(str) {
  return str.replace(/\s+/g, ' ').trim();
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  return m ? decodeHtml(m[1].trim()) : '';
}

function extractLink(block) {
  let link = extractTag(block, 'link');
  if (link) return link;

  const linkHref = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (linkHref) return decodeHtml(linkHref[1].trim());

  const guid = extractTag(block, 'guid');
  return guid || '';
}

function extractAtomLink(block) {
  const alt = block.match(/<link[^>]+rel=["']alternate["'][^>]*>/i);
  if (alt) {
    const href = alt[0].match(/href=["']([^"']+)["']/i);
    if (href) return decodeHtml(href[1].trim());
  }
  const linkHref = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  if (linkHref) return decodeHtml(linkHref[1].trim());
  const linkText = extractTag(block, 'link');
  return linkText || '';
}

async function fetchRss(url, source, region = 'domestic') {
  try {
    const res = await axios.get(url, {
      timeout: 8000,
      validateStatus: () => true,
      headers: { 'User-Agent': 'VCBriefBot/1.0' },
    });
    if (res.status >= 400 || !res.data) return [];

    const xml = res.data.toString();
    const itemBlocks = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];
    const entryBlocks = xml.match(/<entry\b[^>]*>[\s\S]*?<\/entry>/gi) || [];

    const blocks = [
      ...itemBlocks.map((block) => ({ block, isAtom: false })),
      ...entryBlocks.map((block) => ({ block, isAtom: true })),
    ];

    const items = blocks.map(({ block, isAtom }) => {
      const title = extractTag(block, 'title');
      const url_original = isAtom ? extractAtomLink(block) : extractLink(block);
      const pubDate = extractTag(block, 'pubDate')
        || extractTag(block, 'dc:date')
        || extractTag(block, 'updated')
        || extractTag(block, 'published');
      const description = extractTag(block, 'description') || extractTag(block, 'summary');
      const content = extractTag(block, 'content:encoded') || extractTag(block, 'content');
      const summary = collapseWhitespace(stripTags(description || content || ''));
      const published_at = (() => {
        const d = new Date(pubDate);
        return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      })();

      return { title, url_original, published_at, source, summary, region };
    });

    return items.filter((i) => i.title && i.url_original);
  } catch {
    return [];
  }
}

module.exports = { RSS_SOURCES, fetchRss };
