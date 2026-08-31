// ════════════════════════════════════════════════════════════════
//  데모용 가상 데이터 — 아르코에듀 (가상의 에듀테크 기업)
//  사이트 공통 (메인/네비/푸터)
// ════════════════════════════════════════════════════════════════

import type { SiteData } from "@/lib/types";

export const SITE: SiteData = {
  hero: {
    lines: [
      "배움의 기준을 새롭게, 성장의 길을 함께",
      "아르코에듀는 내일의 배움을 만들어갑니다.",
    ],
  },
  floatingButtons: ["로그인", "전문강사 모집"],
  ongoingTabs: ["NEW / 진행중인 채용", "신입", "경력", "인턴", "전문 강사"],
  ongoingJobs: [
    "[경력] [개발] AI 풀스택개발자 채용 >",
    "[신입] [기획] 교재 영업사원 채용 >",
    "[경력] [기획] 교재 영업사원 채용 >",
  ],
  rightColumnBlocks: ["입사지원서 작성", "지원결과 조회", "FAQ", "Q&A"],
  centerBanner: {
    title: "아르코에듀 채용이 궁금하다면?",
    cta: "아르코 채용 한 눈에 보기 >",
  },
  homeNoticeAccordion: [
    {
      title: "[FAQ] 회원가입 시 본인인증 후 다음 페이지로 넘어가지 않습니다.",
      highlight: true,
    },
    { title: "[FAQ] 지원분야 변경" },
  ],
  familyMenu: [
    "아르코 어학",
    "아르코 자격증",
    "아르코 공무원",
    "아르코 인강",
    "아르코 중국어",
    "아르코 일본어",
    "아르코 유학",
    "아르코 취업",
    "아르코 편입",
    "아르코 학점은행",
    "아르코 출판",
    "아르코 기업교육",
    "아르코 AI러닝",
    "아르코 평생교육원",
  ],
  logo: "ARCO CAREERS",
  gnb: ["채용공고", "입사지원", "아르코 피플", "회사소개", "아르코에듀 소개"],
  footer: {
    brandBand: [
      "아르코에듀 — 배움의 기준을 새롭게",
      "온라인 강의·어학·자격증 콘텐츠를 만드는 에듀테크 기업",
    ],
    links: ["회사소개", "오시는길"],
    socials: ["ISMS", "Twitter", "Instagram", "YouTube", "Play", "KakaoTalk", "Blog"],
    bottomLinks: ["개인정보 처리방침", "이메일주소무단수집거부", "회원탈퇴"],
    copyright: "COPYRIGHT(C) ARCO EDU. ALL RIGHTS RESERVED",
  },
};

/** 채용공고 좌측 사이드 메뉴 */
export const JOBS_LNB = [
  "공지사항",
  "일반직채용",
  "영어연구원모집",
  "전문강사모집",
  "Foreign Recruiting",
] as const;

/** 회사소개 좌측 네비게이션 (index-매핑 라우트: 7개 유지) */
export const COMPANY_LNB = [
  "아르코에듀 소개",
  "아르코 철학",
  "아르코 나눔 활동",
  "아르코 사업분야",
  "아르코 역사",
  "아르코 장학제도",
  "오시는 길",
] as const;

/** 아르코 피플 좌측 네비게이션 */
export const PEOPLE_LNB = ["인재상", "직무소개", "아르코 문화"] as const;

/** 채용문의 좌측 사이드바 */
export const SUPPORT_LNB = ["FAQ", "Q&A"] as const;
