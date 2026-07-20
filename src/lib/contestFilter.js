/**
 * contestFilter.js
 * AI & 숏폼 공모전 브리핑(d_LOCAL) 핵심 2대 필터 모듈:
 * 1. 단순 AI 관련 기술정보 및 혜택 없는 기사 금지
 * 2. 이미 마감되었거나 시상/수상 결과 발표 등 완료된 사안 일체 금지
 */

const REQUIRED_BENEFIT_CONTEST_KEYWORDS = [
  '공모', '공모전', '경진대회', '챌린지', '도전', '출품', '시상', '상금', '시상금', 
  '지원금', '살아보기', '한달살기', '촌캉스', '체류', '숙박지원', '거주지원', '귀농', 
  '청년지원', '창업지원', 'contest', 'challenge', 'competition', 'grant', 'hackathon', '해커톤'
];

const EXCLUDED_RESULT_CLOSED_KEYWORDS = [
  '최우수상', '우수상', '대상 수상', '장려상', '수상작 발표', '수상자 발표', '결과발표', 
  '결과 발표', '선정 결과', '선정결과', '최종 선정', '최종선정', '시상식 개최', '성료', 
  '폐막', '모집종료', '모집 종료', '접수마감', '접수 마감', '당선작', '아티스트 선정', '수상…', '수상:'
];

const PAST_YEAR_PATTERNS = [
  /\b202[0-5]년\b/,
  /\b202[0-5]\.\s*\d{1,2}\b/
];

/**
 * 아이템(또는 raw 객체)이 진행 중이거나 기한이 남은 실질 혜택/공모전인지 판별
 * @param {Object} item - { title, summary, summary_3lines, published_at, etc }
 * @param {Date|string} refDate - 기준 날짜 (기본: 현재)
 * @returns {boolean}
 */
function isStrictlyActiveContestOrBenefit(item, refDate = new Date()) {
  if (!item) return false;
  
  const title = String(item.title || item.title_original || '').trim();
  const summary = Array.isArray(item.summary_3lines) 
    ? item.summary_3lines.join(' ') 
    : String(item.summary || '');
  
  if (!title) return false;
  
  const fullText = `${title}\n${summary}`;
  const lowerText = fullText.toLowerCase();

  // 1. 이미 마감되었거나 수상 결과 발표, 시상식 성료 등 과거 완료 사안 차단
  for (const closedKw of EXCLUDED_RESULT_CLOSED_KEYWORDS) {
    if (fullText.includes(closedKw)) {
      return false;
    }
  }

  // 2. 과거 연도(2025년 이전 등)가 본문/제목에 메인으로 표기되고 2026년 이후 표기가 없는 경우 차단
  const hasPastYear = PAST_YEAR_PATTERNS.some(pattern => pattern.test(fullText));
  const hasCurrentYear = /\b202[6-9]년\b|\b202[6-9]\./.test(fullText);
  if (hasPastYear && !hasCurrentYear) {
    return false;
  }

  // 3. 필수 혜택/공모 키워드가 하나라도 존재하는지 확인 (단순 기술 뉴스 배제)
  const hasBenefitOrContest = REQUIRED_BENEFIT_CONTEST_KEYWORDS.some(kw => 
    lowerText.includes(kw.toLowerCase())
  );
  if (!hasBenefitOrContest) {
    return false;
  }

  return true;
}

module.exports = {
  REQUIRED_BENEFIT_CONTEST_KEYWORDS,
  EXCLUDED_RESULT_CLOSED_KEYWORDS,
  isStrictlyActiveContestOrBenefit,
};
