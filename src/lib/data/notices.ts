// ════════════════════════════════════════════════════════════════
//  데모용 가상 데이터 — 아르코에듀 (가상의 에듀테크 기업)
//  공지사항 목록 + 상세 본문
// ════════════════════════════════════════════════════════════════

import type { Notice } from "@/lib/types";

export const NOTICE_HEADER = {
  title: "공지사항",
  desc: "아르코에듀 채용과 관련된 주요 사항을 알려드립니다.",
} as const;

// ── 상세 본문 ─────────────────────────────────────────────────────

const BODY_PRIVACY: Notice["body"] = {
  title: "[아르코 채용] 개인정보처리방침 개정 안내 (2026.02.01.부터 적용)",
  date: "2026-01-15",
  blocks: [
    { type: "heading", text: "<아르코 채용 웹사이트 개인정보처리방침 개정 안내>" },
    {
      type: "paragraph",
      text: "아르코에듀에 관심을 가지고 지원해주셔서 항상 감사드립니다.",
    },
    {
      type: "paragraph",
      text: "아르코 채용 웹사이트의 개인정보처리방침이 아래와 같이 개정됨을 알려드리오니 이용에 참고하여 주시기 바랍니다.",
    },
    { type: "paragraph", text: "적용 일자 : 2026.02.01. (일)" },
    {
      type: "heading",
      text: "주요 개정 사항",
    },
    {
      type: "list",
      items: [
        "1. 개인정보 보유·이용 기간을 항목별로 명확화 (회원 탈퇴 시까지 / 입사지원일로부터 3년)",
        "2. 개인정보 자동 수집 장치(쿠키)의 설치·운영 및 거부에 관한 사항 신설",
        "3. 개인정보 보호책임자 및 연락처 정보 갱신",
        "4. 위탁·제3자 제공 항목 정비",
      ],
    },
    {
      type: "note",
      text: "자세한 개정 전문은 채용 사이트 하단 '개인정보처리방침'에서 확인하실 수 있습니다.",
    },
    {
      type: "paragraph",
      text: "문의 사항은 채용 사이트 Q&A 또는 인사팀 메일(recruit@arco.example)로 문의해 주세요.",
    },
    { type: "note", text: "© ARCO Edu. All rights reserved." },
  ],
};

const BODY_SIGNUP: Notice["body"] = {
  title: "[FAQ] 회원가입 시 본인인증 후 다음 페이지로 넘어가지 않습니다.",
  date: "2026-06-20",
  blocks: [
    { type: "paragraph", text: "안녕하세요, 아르코에듀 인사팀입니다." },
    {
      type: "paragraph",
      text: "입사지원을 위한 회원가입 절차 진행 시, 휴대폰 본인인증 후 회원정보입력 단계로 넘어가지 않는 문제에 대한 해결방법을 안내드립니다.",
    },
    { type: "heading", text: "[Chrome 브라우저를 사용하는 경우]" },
    {
      type: "list",
      items: [
        "1. 브라우저 창 우측 상단 점 세개 클릭",
        "2. 하단에서 두 번째 [설정] 클릭",
        "3. 좌측 메뉴 중 [개인 정보 보호 및 보안] 클릭",
        "4. [사이트 설정] 클릭",
        "5. recruit.arco.example 클릭",
        "6. [팝업 및 리디렉션] 허용 체크",
        "완료 후, 본인인증 재시도 후 다음 페이지로 넘어가는지 확인합니다.",
      ],
    },
    { type: "heading", text: "[Edge 브라우저를 사용하는 경우]" },
    {
      type: "list",
      items: [
        "1. 브라우저 창 우측 상단 점 세개 클릭",
        "2. 하단에서 세 번째 [설정] 클릭",
        "3. 좌측 메뉴 중 [쿠키 및 사이트 권한] 클릭",
        "4. [팝업 및 리디렉션] 클릭",
        "5. 허용 목록에 recruit.arco.example 추가",
        "완료 후, 본인인증 재시도 후 다음 페이지로 넘어가는지 확인합니다.",
      ],
    },
    {
      type: "paragraph",
      text: "이외의 브라우저를 사용하거나, 위의 조치를 취하였음에도 정상적으로 페이지 전환이 되지 않는 경우 페이지 오류캡쳐를 첨부하여 인사팀 메일(recruit@arco.example)로 문의 부탁드립니다.",
    },
    {
      type: "paragraph",
      text: "아르코에듀의 채용에 관심을 가져주셔서 감사합니다. 🙂",
    },
  ],
};

const BODY_INFO_SESSION: Notice["body"] = {
  title: "2026 아르코에듀 신입 공채 온라인 채용설명회 안내",
  date: "2026-06-30",
  blocks: [
    { type: "paragraph", text: "안녕하세요, 아르코에듀 인사팀입니다." },
    {
      type: "paragraph",
      text: "2026년 신입 공개채용을 앞두고, 지원자 여러분께 직무와 채용 절차를 소개하는 온라인 채용설명회를 아래와 같이 개최합니다.",
    },
    { type: "heading", text: "일정 및 참여 방법" },
    {
      type: "list",
      items: [
        "일시 : 2026년 7월 18일(토) 14:00 ~ 16:00",
        "방식 : 온라인 실시간 웨비나 (사전 신청자에 한해 링크 발송)",
        "내용 : 회사·직무 소개, 채용 프로세스, 현직자 Q&A",
        "신청 : 채용 사이트 상단 [채용설명회 신청] 배너를 통해 접수",
        "신청 마감 : 2026년 7월 15일(화) 18:00",
      ],
    },
    { type: "button", label: "채용설명회 신청하기 →" },
    {
      type: "paragraph",
      text: "많은 관심과 참여 부탁드립니다. 문의는 recruit@arco.example로 주시기 바랍니다.",
    },
  ],
};

const BODY_MAINTENANCE: Notice["body"] = {
  title: "채용 시스템 정기 점검 안내 (2026.07.05)",
  date: "2026-07-01",
  blocks: [
    { type: "paragraph", text: "안녕하세요, 아르코에듀 인사팀입니다." },
    {
      type: "paragraph",
      text: "보다 안정적인 서비스 제공을 위해 아르코 채용 시스템 정기 점검을 진행합니다. 점검 시간 동안 회원가입 및 입사지원서 작성·제출이 일시적으로 제한되오니 이용에 참고 부탁드립니다.",
    },
    {
      type: "list",
      items: [
        "점검 일시 : 2026년 7월 5일(일) 02:00 ~ 06:00 (약 4시간)",
        "점검 내용 : 서버 안정화 및 보안 업데이트",
        "영향 범위 : 회원가입, 로그인, 입사지원서 작성·제출, Q&A 접수",
      ],
    },
    {
      type: "note",
      text: "점검 시간은 작업 상황에 따라 단축 또는 연장될 수 있습니다.",
    },
    {
      type: "paragraph",
      text: "이용에 불편을 드려 죄송합니다. 원활한 지원을 위해 마감이 임박한 공고는 미리 작성해 주시기를 권장드립니다.",
    },
  ],
};

const BODY_SCHEDULE: Notice["body"] = {
  title: "2026 하반기 채용 일정 사전 안내",
  date: "2026-06-10",
  blocks: [
    { type: "paragraph", text: "안녕하세요, 아르코에듀 인사팀입니다." },
    {
      type: "paragraph",
      text: "2026년 하반기 채용 일정을 아래와 같이 사전 안내드립니다. 세부 모집 부문과 자격 요건은 각 공고 게시 시점에 채용 사이트를 통해 공지됩니다.",
    },
    {
      type: "list",
      items: [
        "신입 공채 서류 접수 : 2026년 8월 중순 ~ 9월 초 (예정)",
        "서류 발표 : 2026년 9월 중순 (예정)",
        "직무·인성 전형 : 2026년 9월 말 ~ 10월 초 (예정)",
        "면접 전형 : 2026년 10월 중 (예정)",
        "최종 발표 : 2026년 10월 말 (예정)",
      ],
    },
    {
      type: "note",
      text: "상기 일정은 회사 사정에 따라 변경될 수 있으며, 경력·수시 채용은 상시 진행됩니다.",
    },
  ],
};

// ── 목록 (알림 3 + 일반 3) ───────────────────────────────────────

export const NOTICES: Notice[] = [
  {
    id: "privacy-2026",
    no: "알림",
    title: "[아르코 채용] 개인정보처리방침 개정 안내 (2026.02.01.부터 적용)",
    date: "2026.01.15",
    hasAttachment: true,
    body: BODY_PRIVACY,
  },
  {
    id: "faq-signup",
    no: "알림",
    title: "[FAQ] 회원가입 시 본인인증 후 다음 페이지로 넘어가지 않습니다.",
    date: "2026.06.20",
    category: "FAQ",
    highlight: true,
    body: BODY_SIGNUP,
  },
  {
    id: "info-session-2026",
    no: "알림",
    title: "2026 아르코에듀 신입 공채 온라인 채용설명회 안내",
    date: "2026.06.30",
    category: "채용설명회",
    body: BODY_INFO_SESSION,
  },
  {
    id: "maintenance-2026-07",
    no: "3",
    title: "채용 시스템 정기 점검 안내 (2026.07.05)",
    date: "2026.07.01",
    category: "시스템 점검",
    body: BODY_MAINTENANCE,
  },
  {
    id: "schedule-2026h2",
    no: "2",
    title: "2026 하반기 채용 일정 사전 안내",
    date: "2026.06.10",
    body: BODY_SCHEDULE,
  },
  {
    id: "info-session-2026-list",
    no: "1",
    title: "2026 아르코에듀 신입 공채 온라인 채용설명회 안내",
    date: "2026.06.30",
    category: "채용설명회",
    body: BODY_INFO_SESSION,
  },
];

/** 메인 홈 공지 아코디언 노출 */
export const HOME_NOTICE_ACCORDION: { title: string; highlight?: boolean }[] = [
  {
    title: "[FAQ] 회원가입 시 본인인증 후 다음 페이지로 넘어가지 않습니다.",
    highlight: true,
  },
  { title: "2026 아르코에듀 신입 공채 온라인 채용설명회 안내" },
];
