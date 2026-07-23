/**
 * contestFilter.js
 * AI & 숏폼 공모전 브리핑(d_LOCAL) 핵심 필터 모듈:
 * 1. 무관한 뉴스(부동산/노조/대기업 경영/일반 IT/의료영상 등) 엄격 차단
 * 2. 이미 마감되었거나 시상/수상 결과 발표 등 완료된 사안 일체 금지
 * 3. 지자체/공공기관/AI/숏폼 공모전 및 지역 체류(살아보기) 실질 혜택만 허용
 */

const REQUIRED_BENEFIT_CONTEST_KEYWORDS = [
  '공모전', '공모', '경진대회', '해커톤', 'hackathon', '출품작', '출품', '시상금', '상금',
  '한달살기', '촌캉스', '살아보기', '지역체류', '체류지원', '체류 지원', '숙박지원', '숙박 지원', '귀농귀촌', '농촌여행',
  'contest', 'challenge', 'competition', 'grant', 'film festival', 'film contest', 'video contest', 'short-form contest', 'short-form challenge'
];

const EXCLUDED_RESULT_CLOSED_KEYWORDS = [
  '최우수상', '우수상', '대상 수상', '장려상', '수상작 발표', '수상자 발표', '결과발표', 
  '결과 발표', '선정 결과', '선정결과', '최종 선정', '최종선정', '시상식 개최', '성료', 
  '폐막', '모집종료', '모집 종료', '접수마감', '접수 마감', '당선작', '아티스트 선정', '수상…', '수상:'
];

const EXCLUDED_IRRELEVANT_KEYWORDS = [
  // 부동산 / 건설
  '아파트', '시공사', '건설사', '분양', '수의계약', '재개발', '재건축', '컨소시엄',
  // 기업 경영 / 노조 / 정치 / 주식
  '노조', '쟁의', '파업', '주가', '주식', '코스피', '코스닥', '영업이익', '매출액', 'M&A', '인수합병', '지분', 'CEO', 'CTO', '임원 인사', '예산안', '당정',
  // 테크 일반 기사 / 일반 툴 / 보안 / 의료 영상
  '스크립팅', '프리커서', '봇 차단', '봇차단', '탠덤 OLED', '저궤도망', '소버린', '데이터센터', 
  '차량 보험', '자동차보험', '자생한방', '저작권 합의', '폐기능 예측', '폐기능', 'CT 영상', '의료 영상', 
  '병원신문', '조직 신설', '해킹방어대회', '코드게이트', '하버드 스타트업'
];

const PAST_YEAR_PATTERNS = [
  /\b202[0-5]년\b/,
  /\b202[0-5]\.\s*\d{1,2}\b/
];

/**
 * 아이템이 진행 중이거나 기한이 남은 실질 혜택/공모전인지 판별
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

  // 1. 공모전/체류 사업과 무관한 일반 기사/부동산/노조/테크제품 차단
  for (const irrKw of EXCLUDED_IRRELEVANT_KEYWORDS) {
    if (fullText.includes(irrKw)) {
      return false;
    }
  }

  // 2. 이미 마감되었거나 수상 결과 발표, 시상식 성료 등 과거 완료 사안 차단
  for (const closedKw of EXCLUDED_RESULT_CLOSED_KEYWORDS) {
    if (fullText.includes(closedKw)) {
      return false;
    }
  }

  // 3. 과거 연도(2025년 이전 등) 차단
  const hasPastYear = PAST_YEAR_PATTERNS.some(pattern => pattern.test(fullText));
  const hasCurrentYear = /\b202[6-9]년\b|\b202[6-9]\./.test(fullText);
  if (hasPastYear && !hasCurrentYear) {
    return false;
  }

  // 4. 필수 혜택/공모 키워드 존재 검증
  const hasDirectBenefit = REQUIRED_BENEFIT_CONTEST_KEYWORDS.some(kw => 
    lowerText.includes(kw.toLowerCase())
  );

  // 숏폼/영상/AI + 공모/모집/접수/시상/경진/장학금 명시 조합 검증
  const isVideoOrAiContestCombo = 
    (lowerText.includes('숏폼') || lowerText.includes('쇼츠') || lowerText.includes('릴스') || lowerText.includes('영상') || lowerText.includes('short-form')) &&
    (lowerText.includes('공모') || lowerText.includes('모집') || lowerText.includes('접수') || lowerText.includes('시상') || lowerText.includes('경진') || lowerText.includes('장학금') || lowerText.includes('개최'));

  if (!hasDirectBenefit && !isVideoOrAiContestCombo) {
    return false;
  }

  return true;
}

module.exports = {
  REQUIRED_BENEFIT_CONTEST_KEYWORDS,
  EXCLUDED_RESULT_CLOSED_KEYWORDS,
  EXCLUDED_IRRELEVANT_KEYWORDS,
  isStrictlyActiveContestOrBenefit,
};

