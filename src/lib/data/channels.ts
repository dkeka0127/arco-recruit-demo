// ════════════════════════════════════════════════════════════════
//  데모용 가상 데이터 — 아르코에듀 (가상의 에듀테크 기업)
//  영어연구원모집 / 전문강사모집(22분야) / Foreign Recruiting(영문)
// ════════════════════════════════════════════════════════════════

import type {
  EngResearch,
  TeacherRecruit,
  TeacherField,
  ForeignRecruit,
} from "@/lib/types";

// ── 1. 영어연구원모집 ─────────────────────────────────────────────

export const ENG_RESEARCH: EngResearch = {
  bannerTitle: "영어연구원모집",
  bannerLead: [
    "교재 콘텐츠의 전문가,",
    "아르코에듀 영어연구원",
    "교육을 통한 나눔의 철학을 실천하고,",
    "대한민국 인재교육을 선도하는 전문 연구원을 모집합니다.",
  ],
  jobGuide: ["영어 교재 및 콘텐츠 개발", "영어 교재 개발 및 편집"],
  qualifications: [
    "4년제 대학 졸업(예정) 이상",
    "영어 능력 우수자 우대",
    "영어 교과서 제작 경력자 우대",
  ],
  process: [
    { no: "01", name: "서류전형" },
    { no: "02", name: "필기/인적성 검사" },
    { no: "03", name: "면접전형" },
    { no: "04", name: "신체검사" },
    { no: "05", name: "최종합격" },
  ],
  documentsNote: "최종전형 합격자에 한하여 아래와 같은 서류를 제출해야 합니다.",
  documents: [
    "유효기간 이내의 공인어학 성적표 (TOEFL, TOEIC, TEPS 등)",
    "전 학년 성적 증명서",
    "졸업(예정)증명서",
  ],
  etc: [
    "지원서 및 제출하신 서류는 전형 자료로만 사용되며, 일체 반환하지 않습니다.",
    "공인자격점수 및 외국어시험 성적은 원서접수 마감일 기준으로 2년 이내의 점수만 인정합니다.",
    "지원서 및 제출하신 서류에 허위사실이 있음이 확인 될 경우, 합격이 취소될 수 있으며, 입사 후에도 입사가 취소될 수 있습니다.",
    "지원분야에 따라 면접 시 지원서 외 포트폴리오 등의 제출을 요청할 수 있습니다.",
    "졸업증명서, 성적증명서, 어학성적표 등의 증명서류는 최종합격자에 한하여 추후 제출합니다.",
    "공통 자격요건은 병역필 또는 면제자, 해외여행에 결격 사유가 없는 자 입니다.",
    "문의사항은FAQ와 Q&A를 이용하여 주시기 바랍니다.",
  ],
  applyButton: "영어연구원 지원하기 ▶",
  applyNote: "아르코 채용사이트 온라인 지원 (이메일, 방문접수 불가)",
};

// ── 2. 전문강사모집 ───────────────────────────────────────────────

/** 모집분야 22개 (분야명 + 과목/내용 원문) */
export const TEACHER_FIELDS: TeacherField[] = [
  {
    field: "영어",
    content: [
      "TOEIC, TOEFL, TOEIC Speaking, GRE, GMAT, SAT, TEPS, IELTS, LSAT, OPIc, 회화/청취/문법, AP, 컨설팅",
      "[우대] 해외 유학 경험자, 영어 관련 학과 전공자",
    ],
  },
  {
    field: "중국어",
    content: [
      "HSK, TSC, HSKK, BCT, 기초/회화/문법/어휘/비즈니스 중국어 등",
      "[우대] 중국어 관련 학과 전공자",
    ],
  },
  {
    field: "일본어",
    content: ["JLPT, 일본어 회화/문법/독해/청해 등"],
  },
  {
    field: "중·고등영어",
    content: ["중등·고등 영어(문법/독해/어휘 등)"],
  },
  {
    field: "공무원",
    content: [
      "공무원 : 국어, 영어, 한국사, 행정학, 행정법, 세법, 회계학, 사회복지학, 관세법, 형법, 형소법, 민법, 민소법, 경제학, 교정학, 기타 기술직렬 과목 등 공무원 시험에 해당하는 전 과목 및 가산점 과목",
      "[우대] 각 과목 전공자, 현직 공무원 및 공무원 시험 합격자",
      "경찰 : 형사법, 경찰학, 헌법, 범죄학, 민법, 해사법규, 해양경찰학 등 경찰 시험에 해당하는 전과목 및 가산점 과목",
      "[우대] 각 과목 전공자, 현직 경찰 및 경찰 시험 합격자",
      "소방 : 소방학, 소방관계법규, 국어, 영어, 한국사 등 소방 시험에 해당하는 전 과목 및 가산점 과목",
      "[우대] 각 과목 전공자, 현직 소방관 및 소방 시험 합격자",
    ],
  },
  {
    field: "로스쿨",
    content: [
      "언어이해, 추리논증, 논술, 자기소개서, 면접",
      "[우대] 현직 로스쿨 관련 과목 강사 or 로스쿨 졸업자",
    ],
  },
  {
    field: "공인중개사",
    content: [
      "공인중개사 : 부동산학개론, 민법, 공인중개사법, 부동산공시법령, 부동산세법, 부동산공법",
      "주택관리사 : 민법, 회계원리, 시설개론, 관계법규, 관리실무",
      "부동산실무 : 경매, 토지중개, 개발, 부동산 마케팅, 중개·창업실무, 부동산투자, 분양상담사",
    ],
  },
  {
    field: "금융",
    content: ["AFPK/CFP, 금융투자, 은행/외환, 회계/세무 등"],
  },
  {
    field: "교원임용",
    content: [
      "유아, 특수, 국어, 일반사회, 역사, 생물, 화학, 음악, 미술",
      "[필수] 사범계열 학과 전공자(학사 학위 이상), 또는 임용 강의 경력 보유자(학사 학위 이상), 또는 전공과목 석사이상 학위 보유자",
      "[우대] 교원 임용 1차 시험 합격자, 임용 강의 경력 보유자, 석사 이상 학위자",
    ],
  },
  {
    field: "편입",
    content: [
      "편입영어 : 문법, 독해, 논리, 어휘, 전 영역",
      "편입수학 : 미적분학, 선형대수학, 공업수학, 통계학, 해석학, 전 영역",
    ],
  },
  {
    field: "취업",
    content: [
      "자소서/면접/필기(인적성, NCS, 공기업 전공)",
      "[필수] 관련 분야 전공 학사 이상 OR 강의 경력 보유자",
      "[우대] 인사직무/채용업무 경력 보유자",
    ],
  },
  {
    field: "한국사능력검정",
    content: ["한국사능력검정시험 심화/기본"],
  },
  {
    field: "기업/대학 출강",
    content: [
      "TOEIC, TOEIC S/W, OPIc, 생활회화, 비즈니스 회화 등",
      "[우대] 기업체/대학 출강 경력 보유자",
    ],
  },
  {
    field: "학점은행",
    content: [
      "사회복지학, 아동학, 경영학, 심리학, 청소년학, 외국어로서의 한국어학 등",
      "[필수] 관련 전공 석사 이상 학위 보유자",
      "[우대] 관련 전공 박사과정 수료 이상",
    ],
  },
  {
    field: "회계사/세무사",
    content: [
      "회계사 : 재무회계, 원가회계, 세무회계, 정부회계, 상법, 세법, 재무관리, 경제학, 경영학",
      "세무사 : 재무회계, 원가회계, 세법, 재정학, 행정소송법, 상법, 민법",
    ],
  },
  {
    field: "기사자격증",
    content: [
      "전기기사, 정보처리기사, 소방설비기사, 기계기사 등 기술 자격증 분야",
      "컴퓨터활용능력, 파이썬 등 IT 관련 분야",
    ],
  },
  {
    field: "변호사",
    content: [
      "민사법(민법, 민사소송법, 상법), 공법(헌법, 행정법), 형사법(형법, 형사소송법), 선택법(경제법, 국제법, 국제거래법, 노동법, 환경법, 조세법) 등 변호사 시험에 해당하는 전과목",
      "[우대] 각 과목 전공자, 현직 변호사 및 변호사 시험 합격자",
    ],
  },
  {
    field: "공인노무사",
    content: [
      "노동법, 행정쟁송법(행정법), 인사노무관리론, 경영조직론, 민사소송법, 노동경제학, 민법, 사회보험법, 경영학, 경제학 등 공인노무사 시험에 해당하는 전과목",
      "[우대] 각 과목 전공자, 현직 공인노무사 및 공인노무사 시험 합격자",
    ],
  },
  {
    field: "감정평가사",
    content: [
      "감정평가실무, 감정평가이론, 감정평가 및 보상 법규, 민법, 경제학, 부동산학, 감정평가 관계 법규, 회계학 등 감정평가사 시험에 해당하는 전과목",
      "[우대] 각 과목 전공자, 현직 감정평가사 및 감정평가사 시험 합격자",
    ],
  },
  {
    field: "법무사",
    content: [
      "헌법, 상법, 민법, 가족관계법, 민사집행법, 상업등기법 및 비송사건 절차법, 부동산등기법, 공탁법, 형법, 형사소송법, 민사소송법, 민사사건 관련서류의 작성, 부동산등기법, 등기신청서류의 작성 등 법무사 시험에 해당하는 전과목",
      "[우대] 각 과목 전공자, 현직 법무사 및 법무사 시험 합격자",
    ],
  },
  {
    field: "변리사",
    content: [
      "민법, 특허법, 상표법, 디자인보호법, 물리, 화학, 지구과학, 생물, 민사소송법, 저작원법, 유기화학, 회로이론, 열역학, 분자생물학 등 변리사 시험에 해당하는 전과목",
      "[우대] 각 과목 전공자, 현직 변리사 및 변리사 시험 합격자",
    ],
  },
  {
    field: "행정사",
    content: [
      "민법(총칙), 민법(계약법), 행정법, 행정학개론, 행정절차론, 행정사실무법, 사무관리론, 해사실무법 등 행정사 시험에 해당하는 전과목",
      "[우대] 각 과목별 전공자, 현직 행정사 및 행정사시험 합격자",
    ],
  },
];

export const TEACHER_RECRUIT: TeacherRecruit = {
  bannerTitle: ["존경받는 이름,", "아르코에듀 전문강사"],
  bannerLead: [
    "교육을 통한 나눔의 철학을 실천하고,",
    "대한민국 인재교육을 선도하는 전문 교육인을 모집합니다.",
  ],
  fields: TEACHER_FIELDS,
  fieldsNote:
    "※ 강사 모집 관련 문의: [ 채용 문의>Q&A]로 문의하시면 빠르게 답변드리도록 하겠습니다.    공무원 강사 지원 문의: 02-000-0000",
  qualifications: [
    "교육에 대한 열정을 가진 자",
    "[국내] 4년제 대학 졸업(예정) 이상인 자",
    "[해외] 학사(BACHELOR'S DEGREE) 졸업(예정) 이상인 자",
  ],
  process: [
    { no: "01", name: "서류전형" },
    { no: "02", name: "시강/필기 전형" },
    { no: "03", name: "면접전형" },
    { no: "04", name: "최종합격" },
  ],
  processNotes: [
    "서류전형 : 아르코에듀의 전문강사로서 갖추어야 할 기본 자질/역량 및 열정/자세 등을 평가합니다.",
    "시강/필기전형 : 서류전형 합격자에 한하여 시강과 필기시험을 통해 역량을 평가합니다.",
    "※필기전형 : 영어/중국어/일본어 과목 지원자에 한함",
    "면접전형 : 시강/필기전형 합격자에 한하여 인성 및 태도, 능력 및 자질을 종합적으로 평가합니다.",
  ],
  documentsNote: "최종전형 합격자에 한하여 아래와 같은 서류를 제출해야 합니다.",
  documents: [
    "유효기간 이내의 공인 성적표/자격증(이력서내 기재한 경우에 한함)",
    "전 학년 성적 증명서",
    "졸업(예정)증명서",
  ],
  etc: [
    "지원서 및 제출하신 서류는 전형 자료로만 사용됩니다.",
    "공인자격점수 및 외국어시험 성적은 원서접수 마감일 기준으로 2년 이내의 점수만 인정합니다.",
    "지원서 및 제출하신 서류에 허위사실이 있음이 확인 될 경우, 합격이 취소될 수 있습니다. (합격 후 강의 진행 중이라도 동일)",
    "지원분야에 따라 면접 시 지원서 외 포트폴리오 등의 제출을 요청할 수 있습니다.",
    "졸업증명서, 성적증명서, 어학성적표 등의 증명서류는 최종합격자에 한하여 추후 제출합니다.",
    "공통 자격요건은 병역필 또는 면제자, 해외여행에 결격 사유가 없는 자 입니다.",
    "문의사항은 FAQ와 Q&A를 이용하여 주시기 바랍니다.",
  ],
  applyButton: "전문강사 지원하기 ›",
  applyNote: "아르코 채용사이트 온라인 지원 (이메일, 방문접수 불가)",
};

// ── 3. Foreign Recruiting (영문) ─────────────────────────────────

export const FOREIGN_RECRUIT: ForeignRecruit = {
  pageTitle: "Foreign Recruiting",
  position: "Writer/Editor Position",
  jobDescription: [
    "Develop and edit English content for test preparatory materials",
    "Provide English support to Korean researchers",
    "Assist with research related to standardized English proficiency tests",
    "Other related duties",
  ],
  basicQualifications: [
    "BA or MA in related field (MA preferred)",
    "Relevant professional experience (must be verifiable)",
    "Knowledge of standardized English proficiency tests",
    "Native English speaker",
    "Experience working in a Korean company",
  ],
  benefits: [
    {
      label: "Health/Retirement",
      detail:
        "Korean National Health Insurance, Korean National Pension Scheme, Annual severance payment",
    },
    {
      label: "Visa/Housing",
      detail:
        "E-7 visa sponsorship, Loan of up to KRW 20 million for housing deposit",
    },
    { label: "Other", detail: "Reimbursement for Korean classes, Paid leave" },
  ],
  applicationStages: [
    {
      stage: "Stage 1",
      description:
        "The applicant submits the required documents to recruit@arco.example",
    },
    {
      stage: "Stage 2",
      description:
        "If the applicant is qualified, a writing test is scheduled. The test takes approximately four hours and is done at our office.",
    },
    {
      stage: "Stage 3",
      description:
        "If the test results are satisfactory, an interview is scheduled.",
    },
    {
      stage: "Stage 4",
      description:
        "If the interview results are satisfactory, a medical check is scheduled. This is arranged and paid for by the company.",
    },
    {
      stage: "Stage 5",
      description:
        "The successful applicant is provided with an employment offer and a contract. Once the contract has been signed by both parties, the visa application process begins (if necessary).",
    },
  ],
  applicationNote:
    "Applicants seeking a teaching position should refer to the following website: https://careers.arco.example/teachers",
  requiredDocuments: [
    "Résumé/CV",
    "Cover Letter",
    "Scanned Copy of Passport*",
    "Scanned Copy of Diploma",
    "Scanned Copy of Transcripts",
    "Scanned Copy of Alien Registration Card (if applicable)*",
    "Writing Samples",
    "Reference Letters (Optional)",
    "Personal Information Collection and Use Form\n  → Download Form",
  ],
  documentNotes: [
    "* You may conceal any personal identification numbers in scans of documents such as your passport or alien registration card.",
    "※ When submitting an application to ARCO Edu, you must include a completed Personal Information Collection and Use form. In this form, please check Yes or No after reading the instructions to indicate whether you give ARCO Edu permission to use the personal information included in your documents for the purpose of evaluating your application.",
    "※ Please note that our Terms & Conditions and Privacy Policy will be applied to all recruiting procedures.",
  ],
  contact: {
    person: "Coordinator, ARCO Edu Recruiting",
    email: "recruit@arco.example",
    address:
      "ARCO Edu HQ, 123 Gasang-ro, Eodinga-gu, Seoul, Korea",
    addressKo: "서울특별시 어딘가구 가상로 123 아르코에듀 본사",
  },
  mapLabels: [
    "ARCO Edu Main Building",
    "ARCO Edu Annex Building 1",
    "ARCO Edu Annex Building 2",
    "ARCO Edu Annex Building 3",
    "ARCO Edu Annex Building 4",
    "Gasang Middle School",
    "Eodinga Elementary School",
    "Convenience Store",
    "Coffee Stand",
    "Community Bank (2nd Floor)",
    "Gasang Tower",
    "Eodinga Univ. Station",
    "Exit 3 of Gasang Station",
  ],
};
