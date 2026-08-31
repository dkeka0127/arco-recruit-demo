// ════════════════════════════════════════════════════════════════
//  HR 콘솔 시드 데이터 (목업)
//  공고는 지원자 사이트의 실제 공고(src/lib/data/jobs.ts)와 동일 id/제목.
//  candidate id "me"는 지원자 사이트 /my 페이지와 연동되는 데모 계정.
// ════════════════════════════════════════════════════════════════

import type {
  PipelineStage,
  HrJob,
  Candidate,
  HrApplication,
  Interview,
  InterviewProposal,
  InterviewerNotice,
  TalentEntry,
  HrMember,
  MessageTemplate,
  HrSettings,
  HrState,
  ExamTemplate,
  ExamSession,
} from "./types";

// ── 파이프라인 단계 ──────────────────────────────────────────────

export const SEED_STAGES: PipelineStage[] = [
  { id: "applied", name: "지원 접수", candidateLabel: "접수완료", visibleToCandidate: true, kind: "active", order: 0 },
  { id: "screening", name: "서류 검토", candidateLabel: "서류검토", visibleToCandidate: true, kind: "active", order: 1 },
  { id: "assessment", name: "필기·인적성", candidateLabel: "필기/인적성", visibleToCandidate: true, kind: "active", order: 2 },
  { id: "interview1", name: "1차 면접", candidateLabel: "면접진행", visibleToCandidate: true, kind: "active", order: 3 },
  { id: "interview2", name: "2차 면접", candidateLabel: "면접진행", visibleToCandidate: true, kind: "active", order: 4 },
  { id: "offer", name: "처우 협의", candidateLabel: "최종 검토", visibleToCandidate: false, kind: "active", order: 5 },
  { id: "hired", name: "최종 합격", candidateLabel: "최종합격", visibleToCandidate: true, kind: "hired", order: 6 },
  { id: "rejected", name: "불합격", candidateLabel: "불합격", visibleToCandidate: true, kind: "rejected", order: 7 },
];

// ── 멤버 ─────────────────────────────────────────────────────────

// portalToken: 면접관 포털 개인 고정 링크(/interviewer/[token]) — 유출 시 교체
// 운영진(관리자/실무진/열람)은 콘솔 접근, "면접관"은 포털 전용(800명 조직의 현업 풀)
export const SEED_MEMBERS: HrMember[] = [
  { id: "m-suhyun", name: "김수현", email: "suhyun.kim@arco.example", team: "인사팀", role: "관리자", portalToken: "ivp-suhyun-k4d92m" },
  { id: "m-jiyoung", name: "박지영", email: "jiyoung.park@arco.example", team: "인사팀", role: "실무진", portalToken: "ivp-jiyoung-t7q31x" },
  { id: "m-junho", name: "이준호", email: "junho.lee@arco.example", team: "인사팀", role: "실무진", portalToken: "ivp-junho-b2n85w" },
  { id: "m-taekyung", name: "정태경", email: "taekyung.jung@arco.example", team: "개발본부", role: "실무진", portalToken: "ivp-taekyung-r9c47f" },
  { id: "m-hana", name: "송하나", email: "hana.song@arco.example", team: "콘텐츠연구소", role: "실무진", portalToken: "ivp-hana-p3j68s" },
  { id: "m-minseok", name: "황민석", email: "minseok.hwang@arco.example", team: "마케팅본부", role: "실무진", portalToken: "ivp-minseok-e6v20h" },
  { id: "m-yura", name: "임유라", email: "yura.lim@arco.example", team: "경영지원본부", role: "열람", portalToken: "ivp-yura-z1m54q" },
  // 현업 면접관 풀 (포털 전용)
  { id: "m-dongwook", name: "최동욱", email: "dongwook.choi@arco.example", team: "개발본부", role: "면접관", portalToken: "ivp-dongwook-a8k31d" },
  { id: "m-seoyeon", name: "강서연", email: "seoyeon.kang@arco.example", team: "개발본부", role: "면접관", portalToken: "ivp-seoyeon-m2p97c" },
  { id: "m-jihoon", name: "박지훈", email: "jihoon.park@arco.example", team: "어학연구소", role: "면접관", portalToken: "ivp-jihoon-w5t48r" },
  { id: "m-eunji", name: "김은지", email: "eunji.kim@arco.example", team: "콘텐츠연구소", role: "면접관", portalToken: "ivp-eunji-q7f62n" },
  { id: "m-sangho", name: "윤상호", email: "sangho.yoon@arco.example", team: "마케팅본부", role: "면접관", portalToken: "ivp-sangho-x3b85j" },
  { id: "m-yejin", name: "한예진", email: "yejin.han@arco.example", team: "경영지원본부", role: "면접관", portalToken: "ivp-yejin-d9s14g" },
  { id: "m-woojin", name: "서우진", email: "woojin.seo@arco.example", team: "개발본부", role: "면접관", portalToken: "ivp-woojin-h6v73m", active: false }, // 퇴사 — 비활성 데모
];

// ── 공고 (지원자 사이트 공고와 동일 id/제목) ─────────────────────

export const SEED_JOBS: HrJob[] = [
  {
    id: "ai-fullstack", title: "[개발] AI 풀스택개발자 채용", department: "개발본부", track: "일반직", employment: "경력",
    status: "게시중", openedAt: "2026-06-10", closesAt: null, channels: ["아르코 채용사이트", "원티드", "사람인"], headcount: 2, managerId: "m-jiyoung",
    description: "아르코에듀 교육 콘텐츠에 AI를 접목하는 풀스택 개발자를 찾습니다. 학습자 경험을 바꾸는 제품을 함께 만듭니다.",
    responsibilities: [
      "React/Next.js 기반 학습 서비스 프론트엔드 개발",
      "LLM을 활용한 학습 보조 기능 설계·구현",
      "백엔드 API 및 데이터 파이프라인 개발",
    ],
    qualifications: [
      "웹 풀스택 개발 경력 3년 이상",
      "React·Node.js 실무 경험",
      "REST API 설계 경험",
    ],
    preferred: ["LLM/AI 서비스 개발 경험", "교육 도메인 이해", "클라우드(AWS) 경험"],
    process: ["서류 전형", "1차 실무 면접", "2차 임원 면접", "처우 협의·최종 합격"],
    workType: "정규직 (수습 3개월)", location: "서울 어딘가구 아르코에듀 본사", salary: "면접 후 협의",
  },
  { id: "cloud-engineer", title: "[개발] 클라우드 엔지니어 채용(SRE 엔지니어)", department: "개발본부", track: "일반직", employment: "경력", status: "게시중", openedAt: "2026-03-23", closesAt: null, channels: ["아르코 채용사이트", "원티드"], headcount: 1, managerId: "m-jiyoung" },
  {
    id: "youtube-viral", title: "[기획] 유튜브 바이럴 영상기획&채널관리", department: "마케팅본부", track: "일반직", employment: "신입/경력",
    status: "게시중", openedAt: "2026-04-20", closesAt: null, channels: ["아르코 채용사이트", "사람인", "잡코리아"], headcount: 1, managerId: "m-junho",
    description: "아르코에듀 교육 콘텐츠를 바이럴 영상으로 풀어낼 채널 기획자를 찾습니다.",
    responsibilities: ["유튜브·쇼츠 콘텐츠 기획", "채널 성장 전략 수립·운영", "영상 제작팀 협업"],
    qualifications: ["콘텐츠·영상 기획 경험", "데이터 기반 채널 운영 이해"],
    preferred: ["교육 콘텐츠 경험", "쇼츠 바이럴 성공 사례 보유"],
    process: ["서류 전형", "포트폴리오·기획안 검토", "실무 면접", "최종 합격"],
    workType: "정규직", location: "서울 어딘가구 아르코에듀 본사", salary: "",
  },
  { id: "english-researcher", title: "[연구] 영어 연구원 채용", department: "콘텐츠연구소", track: "영어연구원", employment: "신입/경력", status: "게시중", openedAt: "2026-02-02", closesAt: null, channels: ["아르코 채용사이트"], headcount: 3, managerId: "m-junho" },
  { id: "textbook-sales", title: "[기획] 교재 영업사원 채용", department: "출판사업본부", track: "일반직", employment: "신입/경력", status: "게시중", openedAt: "2025-11-01", closesAt: null, channels: ["아르코 채용사이트", "사람인"], headcount: 2, managerId: "m-jiyoung" },
  { id: "finance-researcher", title: "[연구] 금융 연구원(회계/세무 부문) 채용", department: "콘텐츠연구소", track: "일반직", employment: "신입/경력", status: "게시중", openedAt: "2026-06-08", closesAt: null, channels: ["아르코 채용사이트", "잡코리아"], headcount: 1, managerId: "m-junho" },
  { id: "content-video-design", title: "[디자인] 콘텐츠 영상 디자인 채용", department: "마케팅본부", track: "일반직", employment: "신입/경력", status: "게시중", openedAt: "2025-10-22", closesAt: "2026-12-31", channels: ["아르코 채용사이트", "원티드"], headcount: 1, managerId: "m-junho" },
  { id: "chinese-content", title: "[기획] 중국어 컨텐츠기획/마케팅", department: "마케팅본부", track: "일반직", employment: "신입", status: "마감", openedAt: "2026-02-26", closesAt: "2026-06-17", channels: ["아르코 채용사이트"], headcount: 1, managerId: "m-junho" },
  { id: "data-analyst-draft", title: "[개발] 데이터 분석가 채용 (초안)", department: "개발본부", track: "일반직", employment: "경력", status: "임시저장", openedAt: "2026-07-06", closesAt: null, channels: ["아르코 채용사이트"], headcount: 1, managerId: "m-suhyun" },
];

// ── 지원자 ───────────────────────────────────────────────────────

export const SEED_CANDIDATES: Candidate[] = [
  {
    id: "me",
    name: "김지원",
    email: "jiwon.kim@example.com",
    phone: "010-0000-1187",
    birth: "1994-03-12",
    source: "아르코 채용사이트",
    tags: ["React", "Node.js", "AI"],
    educations: [{ school: "서강대학교", major: "컴퓨터공학", status: "졸업", period: "2013.03 ~ 2019.02" }],
    experiences: [
      { company: "핀테크 스타트업 A", role: "풀스택 개발자", period: "2021.04 ~ 재직중", desc: "React/Next.js 기반 대출 비교 서비스 개발, LLM 상담봇 도입" },
      { company: "SI 기업 B", role: "웹 개발자", period: "2019.03 ~ 2021.03", desc: "공공기관 웹 시스템 구축" },
    ],
    coverLetter:
      "교육 도메인에서 AI로 학습 경험을 바꾸는 일에 오래 관심을 가져왔습니다. 현 직장에서 LLM 기반 상담봇을 도입해 상담 처리량을 3배 높인 경험이 있으며, 아르코에듀의 콘텐츠 자산과 결합하면 학습자 개인화에 큰 임팩트를 낼 수 있다고 생각합니다.",
    portfolioUrl: "https://portfolio.example/jiwonkim-dev",
    files: [
      { name: "김지원_이력서.pdf", size: "1.2MB" },
      { name: "포트폴리오_김지원.pdf", size: "8.4MB" },
    ],
  },
  {
    id: "c-02",
    name: "박서준",
    email: "seojun.p@example.com",
    phone: "010-0000-3345",
    birth: "1991-07-25",
    source: "원티드",
    tags: ["Python", "LLM", "백엔드"],
    educations: [{ school: "한양대학교", major: "소프트웨어학", status: "졸업", period: "2010.03 ~ 2016.08" }],
    experiences: [
      { company: "이커머스 C사", role: "백엔드 엔지니어", period: "2018.01 ~ 재직중", desc: "추천 시스템 API, 검색 인프라 운영" },
    ],
    coverLetter:
      "대규모 트래픽 환경에서 추천·검색 시스템을 운영해 왔습니다. 교육 콘텐츠 추천이라는 문제에 제 경험을 적용해 보고 싶습니다.",
    files: [{ name: "박서준_이력서.pdf", size: "0.9MB" }],
  },
  {
    id: "c-03",
    name: "이하은",
    email: "haeun.lee@example.com",
    phone: "010-0000-9917",
    birth: "1996-11-02",
    source: "사람인",
    tags: ["TypeScript", "Next.js"],
    educations: [{ school: "이화여자대학교", major: "정보통신공학", status: "졸업", period: "2015.03 ~ 2021.02" }],
    experiences: [
      { company: "에듀테크 D사", role: "프론트엔드 개발자", period: "2021.03 ~ 재직중", desc: "학습 대시보드·LMS 프론트엔드 리드" },
    ],
    coverLetter:
      "에듀테크에서 5년간 학습자용 프로덕트를 만들었습니다. 학습 데이터 시각화와 접근성 개선에 강점이 있습니다.",
    portfolioUrl: "https://portfolio.example/haeun",
    files: [{ name: "이하은_이력서.pdf", size: "1.5MB" }],
  },
  {
    id: "c-04",
    name: "최민재",
    email: "minjae.choi@example.com",
    phone: "010-0000-2810",
    birth: "1993-01-19",
    source: "지인 추천",
    tags: ["AWS", "Kubernetes", "SRE"],
    educations: [{ school: "부산대학교", major: "전자공학", status: "졸업", period: "2012.03 ~ 2018.02" }],
    experiences: [
      { company: "게임사 E", role: "DevOps 엔지니어", period: "2019.06 ~ 재직중", desc: "EKS 기반 인프라 이관, 배포 자동화, 장애 대응 온콜 리드" },
    ],
    coverLetter:
      "게임 서비스의 피크 트래픽을 견디는 인프라를 설계·운영했습니다. 무중단 배포와 관측성(Observability) 구축이 주특기입니다.",
    files: [{ name: "최민재_이력서.pdf", size: "1.1MB" }],
  },
  {
    id: "c-05",
    name: "정유나",
    email: "yuna.jung@example.com",
    phone: "010-0000-6642",
    birth: "1998-05-30",
    source: "아르코 채용사이트",
    tags: ["영상기획", "유튜브", "쇼츠"],
    educations: [{ school: "중앙대학교", major: "미디어커뮤니케이션", status: "졸업", period: "2017.03 ~ 2023.02" }],
    experiences: [
      { company: "MCN F사", role: "콘텐츠 PD", period: "2023.03 ~ 재직중", desc: "구독자 80만 채널 쇼츠 기획, 월 조회수 1.2억 달성" },
    ],
    coverLetter:
      "교육 콘텐츠야말로 쇼츠 문법과 가장 잘 맞는 소재라고 믿습니다. 시험·학습 콘텐츠를 바이럴 포맷으로 풀어낸 기획안을 포트폴리오에 담았습니다.",
    portfolioUrl: "https://portfolio.example/yunacontents",
    files: [
      { name: "정유나_이력서.pdf", size: "1.0MB" },
      { name: "채널기획안_정유나.pdf", size: "12.7MB" },
    ],
  },
  {
    id: "c-06",
    name: "강도윤",
    email: "doyun.kang@example.com",
    phone: "010-0000-1105",
    birth: "1995-09-14",
    source: "잡코리아",
    tags: ["영어교육", "TESOL"],
    educations: [
      { school: "고려대학교", major: "영어영문학", status: "졸업", period: "2014.03 ~ 2020.02" },
      { school: "고려대학교 대학원", major: "영어교육학 석사", status: "졸업", period: "2020.03 ~ 2022.08" },
    ],
    experiences: [
      { company: "어학원 G", role: "토익 강의 조교·교재 검수", period: "2022.09 ~ 재직중", desc: "토익 RC 문항 검수, 해설 집필 보조" },
    ],
    coverLetter:
      "토익 문항 분석으로 석사 논문을 썼습니다. 아르코에듀 교재로 공부해 950점을 만든 수험 경험이 문항 개발의 자산이라고 생각합니다.",
    files: [{ name: "강도윤_이력서.pdf", size: "0.8MB" }],
  },
  {
    id: "c-07",
    name: "윤소희",
    email: "sohee.yoon@example.com",
    phone: "010-0000-8820",
    birth: "1997-02-08",
    source: "아르코 채용사이트",
    tags: ["영어교육", "콘텐츠 개발"],
    educations: [{ school: "연세대학교", major: "영어영문학", status: "졸업", period: "2016.03 ~ 2022.02" }],
    experiences: [
      { company: "출판사 H", role: "영어 교재 편집자", period: "2022.03 ~ 2025.12", desc: "중고등 영어 교재 기획·편집 6종 출간" },
    ],
    coverLetter:
      "교재 편집자로 일하며 '좋은 문항'과 '좋은 해설'의 차이를 배웠습니다. 성인 어학 시장에서 그 기준을 실현하고 싶습니다.",
    files: [{ name: "윤소희_이력서.pdf", size: "1.3MB" }],
  },
  {
    id: "c-08",
    name: "한지훈",
    email: "jihun.han@example.com",
    phone: "010-0000-4471",
    birth: "1990-12-01",
    source: "사람인",
    tags: ["영업", "B2B", "교육"],
    educations: [{ school: "경희대학교", major: "경영학", status: "졸업", period: "2009.03 ~ 2016.02" }],
    experiences: [
      { company: "교육출판 I사", role: "학원 영업 담당", period: "2016.03 ~ 재직중", desc: "수도권 학원 200여 곳 교재 납품 관리, 연 매출 40억 담당" },
    ],
    coverLetter:
      "10년간 교재 영업 한 길을 걸었습니다. 학원장·교강사 네트워크와 시장 감각이 강점입니다.",
    files: [{ name: "한지훈_이력서.pdf", size: "0.7MB" }],
  },
  {
    id: "c-09",
    name: "오세라",
    email: "sera.oh@example.com",
    phone: "010-0000-5529",
    birth: "1999-08-21",
    source: "원티드",
    tags: ["모션그래픽", "프리미어", "애프터이펙트"],
    educations: [{ school: "홍익대학교", major: "시각디자인", status: "졸업", period: "2018.03 ~ 2024.02" }],
    experiences: [
      { company: "광고대행사 J", role: "영상 디자이너", period: "2024.03 ~ 재직중", desc: "브랜드 캠페인 영상 20편 제작, 모션그래픽 담당" },
    ],
    coverLetter:
      "정보를 시각 리듬으로 바꾸는 일을 좋아합니다. 강의 영상의 몰입도를 높이는 모션 디자인을 하고 싶습니다.",
    portfolioUrl: "https://portfolio.example/seraoh",
    files: [
      { name: "오세라_이력서.pdf", size: "1.1MB" },
      { name: "쇼릴_오세라.mp4", size: "48.2MB" },
    ],
  },
  {
    id: "c-10",
    name: "임태윤",
    email: "taeyun.lim@example.com",
    phone: "010-0000-2201",
    birth: "1992-04-17",
    source: "링크드인",
    tags: ["회계", "세무", "CPA"],
    educations: [{ school: "성균관대학교", major: "경영학(회계 전공)", status: "졸업", period: "2011.03 ~ 2017.02" }],
    experiences: [
      { company: "회계법인 K", role: "감사본부 시니어", period: "2018.01 ~ 2025.06", desc: "상장사 외부감사, 내부회계 관리제도 검토" },
    ],
    coverLetter:
      "CPA 수험과 실무를 모두 거쳤기에, 수험생이 어디서 막히는지 압니다. 콘텐츠로 그 벽을 허물고 싶습니다.",
    files: [{ name: "임태윤_이력서.pdf", size: "0.9MB" }],
  },
  {
    id: "c-11",
    name: "서예린",
    email: "yerin.seo@example.com",
    phone: "010-0000-7748",
    birth: "1996-06-05",
    source: "아르코 채용사이트",
    tags: ["React", "디자인시스템"],
    educations: [{ school: "숙명여자대학교", major: "IT공학", status: "졸업", period: "2015.03 ~ 2021.02" }],
    experiences: [
      { company: "커머스 L사", role: "프론트엔드 개발자", period: "2021.05 ~ 재직중", desc: "디자인 시스템 구축·운영, 웹 성능 최적화(LCP 40% 개선)" },
    ],
    coverLetter:
      "디자인 시스템과 성능 최적화로 팀의 속도를 올리는 개발자입니다.",
    files: [{ name: "서예린_이력서.pdf", size: "1.4MB" }],
  },
  {
    id: "c-12",
    name: "문준영",
    email: "junyoung.moon@example.com",
    phone: "010-0000-8813",
    birth: "1994-10-28",
    source: "잡코리아",
    tags: ["영상편집", "유튜브 운영"],
    educations: [{ school: "국민대학교", major: "영상디자인", status: "졸업", period: "2013.03 ~ 2019.08" }],
    experiences: [
      { company: "1인 크리에이터 협업", role: "프리랜서 편집자", period: "2019.09 ~ 재직중", desc: "교육·시사 채널 5곳 편집, 주간 12편 납품" },
    ],
    coverLetter:
      "5년간 교육 채널 편집을 전담하며 시청 지속률을 끌어올리는 편집 패턴을 체득했습니다.",
    files: [{ name: "문준영_이력서.pdf", size: "0.8MB" }],
  },
  {
    id: "c-13",
    name: "배수진",
    email: "sujin.bae@example.com",
    phone: "010-0000-3364",
    birth: "1998-01-15",
    source: "아르코 채용사이트",
    tags: ["영어교육", "통번역"],
    educations: [{ school: "한국외국어대학교", major: "영어통번역학", status: "졸업", period: "2017.03 ~ 2023.02" }],
    experiences: [
      { company: "통번역 프리랜서", role: "번역가", period: "2023.03 ~ 재직중", desc: "교육 콘텐츠 영한 번역, 자막 QC" },
    ],
    coverLetter:
      "원문의 뉘앙스를 살리는 번역으로 학습 콘텐츠의 품질을 높여 왔습니다. 문항 개발에 도전하고 싶습니다.",
    files: [{ name: "배수진_이력서.pdf", size: "0.6MB" }],
  },
  {
    id: "c-14",
    name: "신동혁",
    email: "donghyuk.shin@example.com",
    phone: "010-0000-9921",
    birth: "1989-03-03",
    source: "사람인",
    tags: ["세무", "재경"],
    educations: [{ school: "중앙대학교", major: "회계학", status: "졸업", period: "2008.03 ~ 2015.02" }],
    experiences: [
      { company: "중견 제조사 M", role: "재경팀 과장", period: "2015.03 ~ 재직중", desc: "법인세 신고, 세무조사 대응, 연결결산" },
    ],
    coverLetter:
      "실무 10년의 세무 지식을 수험 콘텐츠로 환원하고 싶습니다. 세무사 시험 1차 합격 경험이 있습니다.",
    files: [{ name: "신동혁_이력서.pdf", size: "0.7MB" }],
  },
  {
    id: "c-15",
    name: "황리아",
    email: "ria.hwang@example.com",
    phone: "010-0000-4470",
    birth: "2000-07-07",
    source: "아르코 채용사이트",
    tags: ["교재영업", "신입"],
    educations: [{ school: "단국대학교", major: "국어국문학", status: "졸업", period: "2019.03 ~ 2025.02" }],
    experiences: [
      { company: "서점 체인 N", role: "MD 인턴", period: "2024.07 ~ 2024.12", desc: "학습서 카테고리 매대 기획, 판매 데이터 분석" },
    ],
    coverLetter:
      "서점 인턴을 하며 '팔리는 교재'의 조건을 현장에서 배웠습니다. 발로 뛰는 영업으로 시작하고 싶습니다.",
    files: [{ name: "황리아_이력서.pdf", size: "0.5MB" }],
  },
  {
    id: "c-16",
    name: "조현우",
    email: "hyunwoo.jo@example.com",
    phone: "010-0000-2296",
    birth: "1993-11-11",
    source: "원티드",
    tags: ["Go", "MSA", "백엔드"],
    educations: [{ school: "KAIST", major: "전산학", status: "졸업", period: "2012.03 ~ 2018.02" }],
    experiences: [
      { company: "모빌리티 O사", role: "서버 엔지니어", period: "2018.03 ~ 재직중", desc: "배차 시스템 MSA 전환, gRPC 기반 내부 플랫폼 개발" },
    ],
    coverLetter:
      "대규모 실시간 시스템을 다뤄 왔습니다. AI 서비스의 백엔드 안정성을 책임질 수 있습니다.",
    files: [{ name: "조현우_이력서.pdf", size: "1.0MB" }],
  },
  {
    id: "c-17",
    name: "권나래",
    email: "narae.kwon@example.com",
    phone: "010-0000-8837",
    birth: "1997-12-24",
    source: "잡코리아",
    tags: ["콘텐츠기획", "SNS"],
    educations: [{ school: "서울여자대학교", major: "언론영상학", status: "졸업", period: "2016.03 ~ 2022.02" }],
    experiences: [
      { company: "뷰티 브랜드 P", role: "SNS 마케터", period: "2022.03 ~ 재직중", desc: "인스타·틱톡 운영, 릴스 평균 조회 30만" },
    ],
    coverLetter:
      "짧은 호흡의 콘텐츠로 브랜드 팬덤을 만들어 왔습니다. 교육 브랜드의 톤을 젊게 바꾸고 싶습니다.",
    files: [{ name: "권나래_이력서.pdf", size: "0.9MB" }],
  },
  {
    // ⚠ 중복 데모: c-07 윤소희와 동일 인물(같은 이메일/전화)이 다른 공고에 재접수한 레코드
    id: "c-19",
    name: "윤소희",
    email: "sohee.yoon@example.com",
    phone: "010-0000-8820",
    birth: "1997-02-08",
    source: "잡코리아",
    tags: ["영어교육", "편집"],
    educations: [{ school: "연세대학교", major: "영어영문학", status: "졸업", period: "2016.03 ~ 2022.02" }],
    experiences: [
      { company: "출판사 H", role: "영어 교재 편집자", period: "2022.03 ~ 2025.12", desc: "중고등 영어 교재 기획·편집" },
    ],
    coverLetter:
      "영어 편집기획 직무에도 관심이 있어 함께 지원합니다. 교재 편집 경력을 살려 기여하고 싶습니다.",
    files: [{ name: "윤소희_이력서_v2.pdf", size: "1.4MB" }],
  },
  {
    id: "c-18",
    name: "노아름",
    email: "areum.noh@example.com",
    phone: "010-0000-5518",
    birth: "1995-05-19",
    source: "지인 추천",
    tags: ["영어교육", "커리큘럼"],
    educations: [{ school: "서울대학교", major: "영어교육학", status: "졸업", period: "2014.03 ~ 2020.02" }],
    experiences: [
      { company: "국제학교 Q", role: "영어 교사", period: "2020.03 ~ 재직중", desc: "ESL 커리큘럼 설계, 레벨 테스트 개발" },
    ],
    coverLetter:
      "교실에서 검증한 커리큘럼 설계 역량을 성인 어학 콘텐츠로 확장하고 싶습니다.",
    files: [{ name: "노아름_이력서.pdf", size: "0.8MB" }],
  },
];

// ── 지원서 (파이프라인 위의 카드) ────────────────────────────────

export const SEED_APPLICATIONS: HrApplication[] = [
  {
    id: "app-me-1",
    candidateId: "me",
    jobId: "ai-fullstack",
    stageId: "interview1",
    appliedAt: "2026-06-10T09:24:00+09:00",
    updatedAt: "2026-06-24T14:00:00+09:00",
    starred: true,
    ai: {
      matchScore: 91,
      summary:
        "LLM 도입 실무 경험이 있는 풀스택 개발자. React/Next.js 스택이 공고 요구사항과 정확히 일치하며, 교육 도메인 지원 동기가 구체적임.",
      strengths: ["LLM 상담봇 도입·운영 경험", "Next.js 프로덕션 경험 5년", "지원 동기의 구체성"],
      concerns: ["대규모 트래픽 운영 경험은 상대적으로 적음"],
    },
    activities: [
      { id: "a1", at: "2026-06-10T09:24:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (아르코 채용사이트)" },
      { id: "a2", at: "2026-06-12T10:05:00+09:00", actor: "m-jiyoung", text: "서류 검토 단계로 이동" },
      { id: "a3", at: "2026-06-16T17:40:00+09:00", actor: "m-jiyoung", text: "서류 합격 — 1차 면접 안내 메일 발송" },
      { id: "a4", at: "2026-06-24T14:00:00+09:00", actor: "m-taekyung", text: "1차 면접 진행 완료, 평가 대기" },
      { id: "a5", at: "2026-07-01T17:30:00+09:00", actor: "m-jiyoung", text: "2차 면접 일정 제안 발송 (후보 3개)" },
    ],
    evaluations: [
      {
        id: "ev1",
        evaluatorId: "m-taekyung",
        round: "서류 평가",
        decision: "추천",
        scores: [
          { item: "직무 전문성", score: 4 },
          { item: "문제 해결", score: 4 },
          { item: "성장 가능성", score: 5 },
        ],
        comment: "LLM 도입 경험이 공고 방향과 정확히 맞음. 포트폴리오의 코드 품질 양호.",
        at: "2026-06-15T11:20:00+09:00",
      },
    ],
    comments: [
      { id: "cm1", authorId: "m-jiyoung", at: "2026-06-16T09:12:00+09:00", text: "@정태경 서류 평가 감사합니다. 1차 면접 일정 조율 시작할게요." },
      { id: "cm2", authorId: "m-taekyung", at: "2026-06-24T18:30:00+09:00", text: "면접 인상 좋았습니다. 기술 깊이 확인용 과제 없이 2차 진행해도 될 듯해요." },
    ],
    messages: [
      { id: "ms1", at: "2026-06-10T09:25:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
      { id: "ms2", at: "2026-06-16T17:40:00+09:00", subject: "[아르코에듀] 서류 합격 및 1차 면접 안내", kind: "면접안내", status: "발송됨" },
    ],
    emails: [
      { id: "em1", direction: "발신", from: "recruit@arco.example", to: "jiwon.kim@example.com", subject: "1차 면접 일정 관련 문의", body: "김지원님, 1차 면접 관련해 편하신 시간대가 있으실지 여쭙니다. 회신 주시면 조율해 드리겠습니다.", at: "2026-06-17T10:00:00+09:00", read: true },
      { id: "em2", direction: "수신", from: "jiwon.kim@example.com", to: "recruit@arco.example", subject: "RE: 1차 면접 일정 관련 문의", body: "안녕하세요, 회신 감사합니다. 평일 오후라면 언제든 가능합니다. 다만 6/23은 오전만 됩니다. 확인 부탁드립니다!", at: "2026-06-17T14:12:00+09:00", read: true },
    ],
  },
  {
    id: "app-me-2",
    candidateId: "me",
    jobId: "textbook-sales",
    stageId: "screening",
    appliedAt: "2026-06-05T13:10:00+09:00",
    updatedAt: "2026-06-08T09:00:00+09:00",
    starred: false,
    ai: {
      matchScore: 48,
      summary: "개발 경력 중심 이력으로 영업 직무 적합도는 낮으나, 교육 도메인 이해도는 높음.",
      strengths: ["교육 도메인 관심", "커뮤니케이션 명확"],
      concerns: ["영업 직무 경험 없음", "경력 방향과 직무 불일치"],
    },
    activities: [
      { id: "a1", at: "2026-06-05T13:10:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (아르코 채용사이트)" },
      { id: "a2", at: "2026-06-08T09:00:00+09:00", actor: "m-jiyoung", text: "서류 검토 단계로 이동" },
    ],
    evaluations: [],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-06-05T13:11:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
    ],
  },
  {
    id: "app-03",
    candidateId: "c-02",
    jobId: "ai-fullstack",
    stageId: "interview2",
    appliedAt: "2026-06-11T20:14:00+09:00",
    updatedAt: "2026-06-29T10:00:00+09:00",
    starred: true,
    ai: {
      matchScore: 87,
      summary: "추천 시스템 실무 경험이 강점인 백엔드 엔지니어. 프론트 경험은 제한적이나 AI 서빙 경험이 풍부.",
      strengths: ["추천·검색 시스템 운영", "대규모 트래픽 경험"],
      concerns: ["프론트엔드 실무 비중 낮음"],
    },
    activities: [
      { id: "a1", at: "2026-06-11T20:14:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (원티드)" },
      { id: "a2", at: "2026-06-13T10:00:00+09:00", actor: "m-jiyoung", text: "서류 검토 단계로 이동" },
      { id: "a3", at: "2026-06-18T15:00:00+09:00", actor: "m-jiyoung", text: "1차 면접 단계로 이동" },
      { id: "a4", at: "2026-06-29T10:00:00+09:00", actor: "m-taekyung", text: "1차 합격 — 2차 면접 단계로 이동" },
    ],
    evaluations: [
      {
        id: "ev1",
        evaluatorId: "m-taekyung",
        round: "1차 면접",
        decision: "강력추천",
        scores: [
          { item: "직무 전문성", score: 5 },
          { item: "문제 해결", score: 5 },
          { item: "커뮤니케이션", score: 4 },
          { item: "컬처핏", score: 4 },
        ],
        comment: "시스템 설계 질문에서 트레이드오프 설명이 탁월. 온보딩 리스크 낮음.",
        at: "2026-06-26T16:00:00+09:00",
      },
    ],
    comments: [
      { id: "cm1", authorId: "m-taekyung", at: "2026-06-26T16:10:00+09:00", text: "@김수현 2차는 본부장님 배석 부탁드립니다. 처우 눈높이 사전 확인 필요합니다." },
    ],
    messages: [
      { id: "ms1", at: "2026-06-11T20:15:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
      { id: "ms2", at: "2026-06-29T11:00:00+09:00", subject: "[아르코에듀] 2차 면접 일정 안내", kind: "면접안내", status: "발송됨" },
    ],
    emails: [
      { id: "em1", direction: "발신", from: "recruit@arco.example", to: "seojun.p@example.com", subject: "2차 면접 일정 안내", body: "박서준님, 2차 면접 일정을 안내드립니다. 확인 후 회신 부탁드립니다.", at: "2026-06-29T11:05:00+09:00", read: true },
      { id: "em2", direction: "수신", from: "seojun.p@example.com", to: "recruit@arco.example", subject: "RE: 2차 면접 일정 안내", body: "안녕하세요, 제안 주신 일정 중 7/9 오전이 가능합니다. 다만 처우 관련해 미리 상의드릴 수 있을지 문의드립니다.", at: "2026-06-29T18:30:00+09:00", read: false },
    ],
  },
  {
    id: "app-04",
    candidateId: "c-03",
    jobId: "ai-fullstack",
    stageId: "screening",
    appliedAt: "2026-06-27T11:32:00+09:00",
    updatedAt: "2026-06-29T09:30:00+09:00",
    starred: false,
    ai: {
      matchScore: 82,
      summary: "에듀테크 프론트엔드 리드 경험. 학습 도메인 이해도가 높고 스택 일치도 좋음.",
      strengths: ["에듀테크 도메인 5년", "프론트엔드 리드 경험"],
      concerns: ["백엔드·AI 실무 경험 미확인"],
    },
    activities: [
      { id: "a1", at: "2026-06-27T11:32:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (사람인)" },
      { id: "a2", at: "2026-06-29T09:30:00+09:00", actor: "m-jiyoung", text: "서류 검토 단계로 이동" },
    ],
    evaluations: [],
    comments: [
      { id: "cm1", authorId: "m-jiyoung", at: "2026-06-29T09:35:00+09:00", text: "@정태경 도메인 핏이 좋아 보여요. 서류 평가 부탁드립니다." },
    ],
    messages: [
      { id: "ms1", at: "2026-06-27T11:33:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
    ],
  },
  {
    id: "app-05",
    candidateId: "c-11",
    jobId: "ai-fullstack",
    stageId: "applied",
    appliedAt: "2026-07-01T22:05:00+09:00",
    updatedAt: "2026-07-01T22:05:00+09:00",
    starred: false,
    ai: {
      matchScore: 78,
      summary: "디자인 시스템·성능 최적화 강점의 프론트엔드 개발자. AI 경험은 없으나 기반 역량 우수.",
      strengths: ["디자인 시스템 구축", "성능 최적화 실적(LCP 40%)"],
      concerns: ["AI/LLM 경험 없음"],
    },
    activities: [
      { id: "a1", at: "2026-07-01T22:05:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (아르코 채용사이트)" },
    ],
    evaluations: [],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-07-01T22:06:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
    ],
  },
  {
    id: "app-06",
    candidateId: "c-16",
    jobId: "ai-fullstack",
    stageId: "applied",
    appliedAt: "2026-07-02T08:41:00+09:00",
    updatedAt: "2026-07-02T08:41:00+09:00",
    starred: false,
    ai: {
      matchScore: 84,
      summary: "MSA·실시간 시스템 경험의 강한 백엔드 엔지니어. 풀스택 전환 의지 확인 필요.",
      strengths: ["대규모 실시간 시스템", "KAIST 전산학 + 탄탄한 CS 기초"],
      concerns: ["프론트엔드 경험 부족", "풀스택 직무 동기 확인 필요"],
    },
    activities: [
      { id: "a1", at: "2026-07-02T08:41:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (원티드)" },
    ],
    evaluations: [],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-07-02T08:42:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
    ],
  },
  {
    id: "app-07",
    candidateId: "c-04",
    jobId: "cloud-engineer",
    stageId: "offer",
    appliedAt: "2026-05-28T14:20:00+09:00",
    updatedAt: "2026-06-30T17:00:00+09:00",
    starred: true,
    ai: {
      matchScore: 93,
      summary: "EKS 이관·배포 자동화·온콜 리드까지 SRE 요구 역량을 정확히 충족. 최우선 후보.",
      strengths: ["EKS 프로덕션 이관 주도", "장애 대응 온콜 리드", "IaC 능숙"],
      concerns: ["희망 연봉이 밴드 상단"],
    },
    activities: [
      { id: "a1", at: "2026-05-28T14:20:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (지인 추천)" },
      { id: "a2", at: "2026-06-02T10:00:00+09:00", actor: "m-jiyoung", text: "서류 검토 단계로 이동" },
      { id: "a3", at: "2026-06-09T15:00:00+09:00", actor: "m-jiyoung", text: "1차 면접 단계로 이동" },
      { id: "a4", at: "2026-06-19T11:00:00+09:00", actor: "m-taekyung", text: "2차 면접 단계로 이동" },
      { id: "a5", at: "2026-06-30T17:00:00+09:00", actor: "m-suhyun", text: "처우 협의 시작" },
    ],
    evaluations: [
      {
        id: "ev1",
        evaluatorId: "m-taekyung",
        round: "1차 면접",
        decision: "강력추천",
        scores: [
          { item: "직무 전문성", score: 5 },
          { item: "문제 해결", score: 4 },
          { item: "커뮤니케이션", score: 5 },
          { item: "컬처핏", score: 5 },
        ],
        comment: "장애 사례 회고가 인상적. 즉시 전력감.",
        at: "2026-06-16T18:00:00+09:00",
      },
      {
        id: "ev2",
        evaluatorId: "m-suhyun",
        round: "2차 면접",
        decision: "추천",
        scores: [
          { item: "직무 전문성", score: 5 },
          { item: "조직 적합성", score: 4 },
        ],
        comment: "처우 기대치가 높은 편이나 협의 가능 범위. 조직 리딩 잠재력 있음.",
        at: "2026-06-27T14:30:00+09:00",
      },
    ],
    comments: [
      { id: "cm1", authorId: "m-suhyun", at: "2026-06-30T17:05:00+09:00", text: "처우안 결재 올렸습니다. 금주 내 오퍼 레터 발송 목표." },
    ],
    messages: [
      { id: "ms1", at: "2026-05-28T14:21:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
      { id: "ms2", at: "2026-06-09T15:10:00+09:00", subject: "[아르코에듀] 1차 면접 안내", kind: "면접안내", status: "발송됨" },
    ],
  },
  {
    id: "app-08",
    candidateId: "c-05",
    jobId: "youtube-viral",
    stageId: "interview1",
    appliedAt: "2026-06-14T19:02:00+09:00",
    updatedAt: "2026-06-28T13:00:00+09:00",
    starred: true,
    ai: {
      matchScore: 89,
      summary: "쇼츠 중심 채널 성장 실적이 뚜렷한 콘텐츠 PD. 교육 콘텐츠 기획안 완성도 높음.",
      strengths: ["월 조회수 1.2억 실적", "교육 특화 기획안 제출"],
      concerns: ["채널 운영 외 조직 협업 경험 확인 필요"],
    },
    activities: [
      { id: "a1", at: "2026-06-14T19:02:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (아르코 채용사이트)" },
      { id: "a2", at: "2026-06-17T09:00:00+09:00", actor: "m-junho", text: "서류 검토 단계로 이동" },
      { id: "a3", at: "2026-06-28T13:00:00+09:00", actor: "m-junho", text: "1차 면접 단계로 이동 (7/3 14:00 확정)" },
    ],
    evaluations: [
      {
        id: "ev1",
        evaluatorId: "m-minseok",
        round: "서류 평가",
        decision: "강력추천",
        scores: [
          { item: "직무 전문성", score: 5 },
          { item: "포트폴리오", score: 5 },
          { item: "성장 가능성", score: 4 },
        ],
        comment: "기획안이 바로 실행 가능한 수준. 면접에서 협업 방식 확인 필요.",
        at: "2026-06-20T10:30:00+09:00",
      },
    ],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-06-14T19:03:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
      { id: "ms2", at: "2026-06-28T13:05:00+09:00", subject: "[아르코에듀] 1차 면접 안내 (7/3 금 14:00)", kind: "면접안내", status: "발송됨" },
    ],
  },
  {
    id: "app-09",
    candidateId: "c-17",
    jobId: "youtube-viral",
    stageId: "screening",
    appliedAt: "2026-06-25T15:44:00+09:00",
    updatedAt: "2026-06-27T10:00:00+09:00",
    starred: false,
    ai: {
      matchScore: 71,
      summary: "SNS 숏폼 운영 경험은 풍부하나 유튜브 롱폼·채널 전략 경험은 제한적.",
      strengths: ["릴스 평균 30만 조회", "브랜드 톤 설계 경험"],
      concerns: ["유튜브 채널 운영 실적 부족"],
    },
    activities: [
      { id: "a1", at: "2026-06-25T15:44:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (잡코리아)" },
      { id: "a2", at: "2026-06-27T10:00:00+09:00", actor: "m-junho", text: "서류 검토 단계로 이동" },
    ],
    evaluations: [],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-06-25T15:45:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
    ],
  },
  {
    id: "app-10",
    candidateId: "c-06",
    jobId: "english-researcher",
    stageId: "assessment",
    appliedAt: "2026-06-18T10:11:00+09:00",
    updatedAt: "2026-06-30T09:00:00+09:00",
    starred: false,
    ai: {
      matchScore: 88,
      summary: "영어교육학 석사 + 토익 문항 분석 논문. 연구원 직무 정합성 매우 높음.",
      strengths: ["문항 분석 석사 논문", "교재 검수 실무", "토익 950"],
      concerns: ["집필 단독 리드 경험은 부족"],
    },
    activities: [
      { id: "a1", at: "2026-06-18T10:11:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (잡코리아)" },
      { id: "a2", at: "2026-06-20T09:00:00+09:00", actor: "m-junho", text: "서류 검토 단계로 이동" },
      { id: "a3", at: "2026-06-30T09:00:00+09:00", actor: "m-junho", text: "필기·인적성 단계로 이동 (7/4 필기 예정)" },
    ],
    evaluations: [
      {
        id: "ev1",
        evaluatorId: "m-hana",
        round: "서류 평가",
        decision: "추천",
        scores: [
          { item: "전공 적합성", score: 5 },
          { item: "직무 전문성", score: 4 },
          { item: "성장 가능성", score: 4 },
        ],
        comment: "논문 주제가 실무와 직결. 필기에서 해설 작성력 확인 요망.",
        at: "2026-06-24T14:00:00+09:00",
      },
    ],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-06-18T10:12:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
    ],
  },
  {
    id: "app-11",
    candidateId: "c-07",
    jobId: "english-researcher",
    stageId: "interview1",
    appliedAt: "2026-06-08T09:30:00+09:00",
    updatedAt: "2026-06-29T16:00:00+09:00",
    starred: false,
    ai: {
      matchScore: 85,
      summary: "교재 편집 6종 출간 경력. 편집·기획 역량이 강하고 연구원 전환 동기가 명확.",
      strengths: ["교재 편집 실무 4년", "출간 이력 6종"],
      concerns: ["문항 개발 직접 경험은 제한적"],
    },
    activities: [
      { id: "a1", at: "2026-06-08T09:30:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (아르코 채용사이트)" },
      { id: "a2", at: "2026-06-11T10:00:00+09:00", actor: "m-junho", text: "서류 검토 단계로 이동" },
      { id: "a3", at: "2026-06-22T09:00:00+09:00", actor: "m-junho", text: "필기 통과 — 1차 면접 단계로 이동" },
      { id: "a4", at: "2026-06-29T16:00:00+09:00", actor: "m-hana", text: "면접 일정 확정 (7/2 15:00)" },
    ],
    evaluations: [
      {
        id: "ev1",
        evaluatorId: "m-hana",
        round: "필기 평가",
        decision: "추천",
        scores: [
          { item: "문항 작성", score: 4 },
          { item: "해설 작성", score: 5 },
        ],
        comment: "해설이 간결하고 정확함. 편집 감각이 확실히 살아 있음.",
        at: "2026-06-21T17:00:00+09:00",
      },
    ],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-06-08T09:31:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
      { id: "ms2", at: "2026-06-29T16:05:00+09:00", subject: "[아르코에듀] 1차 면접 안내 (7/2 목 15:00)", kind: "면접안내", status: "발송됨" },
    ],
  },
  {
    id: "app-12",
    candidateId: "c-13",
    jobId: "english-researcher",
    stageId: "applied",
    appliedAt: "2026-07-01T13:27:00+09:00",
    updatedAt: "2026-07-01T13:27:00+09:00",
    starred: false,
    ai: {
      matchScore: 74,
      summary: "통번역 전공의 번역 실무자. 언어 감각은 우수하나 문항·교재 개발 경험 없음.",
      strengths: ["영한 번역 실무", "언어 정확성"],
      concerns: ["교육 콘텐츠 개발 경험 부재"],
    },
    activities: [
      { id: "a1", at: "2026-07-01T13:27:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (아르코 채용사이트)" },
    ],
    evaluations: [],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-07-01T13:28:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
    ],
  },
  {
    id: "app-13",
    candidateId: "c-18",
    jobId: "english-researcher",
    stageId: "hired",
    appliedAt: "2026-05-11T10:00:00+09:00",
    updatedAt: "2026-06-26T10:00:00+09:00",
    starred: false,
    ai: {
      matchScore: 90,
      summary: "영어교육 전공 + 커리큘럼 설계 실무. 레벨 테스트 개발 경험이 연구소 니즈와 일치.",
      strengths: ["커리큘럼 설계", "레벨 테스트 개발", "교육 현장 경험"],
      concerns: [],
    },
    activities: [
      { id: "a1", at: "2026-05-11T10:00:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (지인 추천)" },
      { id: "a2", at: "2026-06-26T10:00:00+09:00", actor: "m-suhyun", text: "최종 합격 처리 — 입사일 8/3 확정" },
    ],
    evaluations: [
      {
        id: "ev1",
        evaluatorId: "m-hana",
        round: "2차 면접",
        decision: "강력추천",
        scores: [
          { item: "직무 전문성", score: 5 },
          { item: "커뮤니케이션", score: 5 },
          { item: "컬처핏", score: 5 },
        ],
        comment: "만장일치 합격 의견.",
        at: "2026-06-24T15:00:00+09:00",
      },
    ],
    comments: [
      { id: "cm1", authorId: "m-junho", at: "2026-06-26T10:10:00+09:00", text: "온보딩 킷 준비 완료. 입사일 8/3." },
    ],
    messages: [
      { id: "ms1", at: "2026-06-26T10:05:00+09:00", subject: "[아르코에듀] 최종 합격을 축하드립니다", kind: "최종합격", status: "발송됨" },
    ],
  },
  {
    id: "app-14",
    candidateId: "c-08",
    jobId: "textbook-sales",
    stageId: "interview2",
    appliedAt: "2026-06-02T11:00:00+09:00",
    updatedAt: "2026-06-30T14:00:00+09:00",
    starred: true,
    ai: {
      matchScore: 92,
      summary: "교재 영업 10년, 학원 네트워크 보유. 즉시 성과 가능한 최적 후보.",
      strengths: ["수도권 학원 200곳 네트워크", "연 매출 40억 관리 실적"],
      concerns: ["현 직장 인수인계로 입사 가능일 협의 필요"],
    },
    activities: [
      { id: "a1", at: "2026-06-02T11:00:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (사람인)" },
      { id: "a2", at: "2026-06-05T09:00:00+09:00", actor: "m-jiyoung", text: "서류 검토 단계로 이동" },
      { id: "a3", at: "2026-06-15T10:00:00+09:00", actor: "m-jiyoung", text: "1차 면접 단계로 이동" },
      { id: "a4", at: "2026-06-30T14:00:00+09:00", actor: "m-jiyoung", text: "2차 면접 단계로 이동 (7/7 11:00)" },
    ],
    evaluations: [
      {
        id: "ev1",
        evaluatorId: "m-minseok",
        round: "1차 면접",
        decision: "강력추천",
        scores: [
          { item: "직무 전문성", score: 5 },
          { item: "영업 네트워크", score: 5 },
          { item: "컬처핏", score: 4 },
        ],
        comment: "시장 이해도가 탁월. 경쟁사 대비 우리 교재 포지셔닝 분석까지 준비해 옴.",
        at: "2026-06-25T16:30:00+09:00",
      },
    ],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-06-02T11:01:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
      { id: "ms2", at: "2026-06-30T14:05:00+09:00", subject: "[아르코에듀] 2차 면접 안내 (7/7 화 11:00)", kind: "면접안내", status: "발송됨" },
    ],
  },
  {
    id: "app-15",
    candidateId: "c-15",
    jobId: "textbook-sales",
    stageId: "assessment",
    appliedAt: "2026-06-20T17:55:00+09:00",
    updatedAt: "2026-06-30T11:00:00+09:00",
    starred: false,
    ai: {
      matchScore: 69,
      summary: "신입이지만 서점 MD 인턴으로 학습서 시장을 경험. 인적성 결과 확인 후 판단 권장.",
      strengths: ["학습서 매대 기획 인턴", "판매 데이터 분석 경험"],
      concerns: ["영업 실무 경험 없음 (신입)"],
    },
    activities: [
      { id: "a1", at: "2026-06-20T17:55:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (아르코 채용사이트)" },
      { id: "a2", at: "2026-06-24T09:00:00+09:00", actor: "m-jiyoung", text: "서류 검토 단계로 이동" },
      { id: "a3", at: "2026-06-30T11:00:00+09:00", actor: "m-jiyoung", text: "인적성 검사 안내 발송" },
    ],
    evaluations: [],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-06-20T17:56:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
      { id: "ms2", at: "2026-06-30T11:05:00+09:00", subject: "[아르코에듀] 인적성 검사 응시 안내", kind: "기타", status: "발송됨" },
    ],
  },
  {
    id: "app-16",
    candidateId: "c-10",
    jobId: "finance-researcher",
    stageId: "screening",
    appliedAt: "2026-06-24T08:50:00+09:00",
    updatedAt: "2026-06-26T09:00:00+09:00",
    starred: true,
    ai: {
      matchScore: 94,
      summary: "회계법인 감사 7년 경력의 시니어. CPA 수험 경험 + 실무 깊이 모두 보유한 드문 프로필.",
      strengths: ["회계법인 감사본부 7년", "상장사 감사 실무", "CPA 수험 경험"],
      concerns: ["콘텐츠 집필 경험은 없음"],
    },
    activities: [
      { id: "a1", at: "2026-06-24T08:50:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (링크드인)" },
      { id: "a2", at: "2026-06-26T09:00:00+09:00", actor: "m-junho", text: "서류 검토 단계로 이동" },
    ],
    evaluations: [],
    comments: [
      { id: "cm1", authorId: "m-junho", at: "2026-06-26T09:10:00+09:00", text: "@송하나 프로필이 좋습니다. 서류 평가 우선 처리 부탁드려요." },
    ],
    messages: [
      { id: "ms1", at: "2026-06-24T08:51:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
    ],
  },
  {
    id: "app-17",
    candidateId: "c-14",
    jobId: "finance-researcher",
    stageId: "applied",
    appliedAt: "2026-07-01T19:18:00+09:00",
    updatedAt: "2026-07-01T19:18:00+09:00",
    starred: false,
    ai: {
      matchScore: 76,
      summary: "기업 재경 10년 실무자. 세무 실무 깊이는 있으나 시험 콘텐츠 관점 경험 확인 필요.",
      strengths: ["법인세·세무조사 실무", "세무사 1차 합격"],
      concerns: ["수험 콘텐츠 제작 경험 없음"],
    },
    activities: [
      { id: "a1", at: "2026-07-01T19:18:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (사람인)" },
    ],
    evaluations: [],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-07-01T19:19:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
    ],
  },
  {
    id: "app-18",
    candidateId: "c-09",
    jobId: "content-video-design",
    stageId: "interview1",
    appliedAt: "2026-06-16T21:40:00+09:00",
    updatedAt: "2026-06-30T15:00:00+09:00",
    starred: false,
    ai: {
      matchScore: 86,
      summary: "모션그래픽 전문 영상 디자이너. 쇼릴 완성도 높고 브랜드 캠페인 경험 풍부.",
      strengths: ["모션그래픽 전문성", "캠페인 영상 20편 제작"],
      concerns: ["교육 콘텐츠 제작 경험은 없음"],
    },
    activities: [
      { id: "a1", at: "2026-06-16T21:40:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (원티드)" },
      { id: "a2", at: "2026-06-19T09:00:00+09:00", actor: "m-junho", text: "서류 검토 단계로 이동" },
      { id: "a3", at: "2026-06-30T15:00:00+09:00", actor: "m-junho", text: "1차 면접 단계로 이동 (7/6 10:30)" },
    ],
    evaluations: [
      {
        id: "ev1",
        evaluatorId: "m-minseok",
        round: "서류 평가",
        decision: "추천",
        scores: [
          { item: "포트폴리오", score: 5 },
          { item: "직무 전문성", score: 4 },
        ],
        comment: "쇼릴 퀄리티 상위권. 강의 영상 워크플로 적응력 면접에서 확인.",
        at: "2026-06-23T11:00:00+09:00",
      },
    ],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-06-16T21:41:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
      { id: "ms2", at: "2026-06-30T15:05:00+09:00", subject: "[아르코에듀] 1차 면접 안내 (7/6 월 10:30)", kind: "면접안내", status: "발송됨" },
    ],
  },
  {
    id: "app-19",
    candidateId: "c-12",
    jobId: "content-video-design",
    stageId: "rejected",
    appliedAt: "2026-06-10T12:00:00+09:00",
    updatedAt: "2026-06-23T10:00:00+09:00",
    starred: false,
    rejectReason: "편집 역량은 우수하나 모션그래픽·디자인 포트폴리오가 직무 요건과 상이",
    ai: {
      matchScore: 58,
      summary: "편집 속도·경험은 풍부하나 공고가 요구하는 디자인·모션 역량 근거 부족.",
      strengths: ["교육 채널 편집 5년", "주 12편 처리 속도"],
      concerns: ["모션그래픽 포트폴리오 부재"],
    },
    activities: [
      { id: "a1", at: "2026-06-10T12:00:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (잡코리아)" },
      { id: "a2", at: "2026-06-13T09:00:00+09:00", actor: "m-junho", text: "서류 검토 단계로 이동" },
      { id: "a3", at: "2026-06-23T10:00:00+09:00", actor: "m-junho", text: "불합격 처리 — 인재풀 등록 제안" },
    ],
    evaluations: [
      {
        id: "ev1",
        evaluatorId: "m-minseok",
        round: "서류 평가",
        decision: "비추천",
        scores: [
          { item: "포트폴리오", score: 2 },
          { item: "직무 전문성", score: 3 },
        ],
        comment: "편집자 채용이면 좋았을 프로필. 이번 공고와는 결이 다름.",
        at: "2026-06-20T15:00:00+09:00",
      },
    ],
    comments: [
      { id: "cm1", authorId: "m-junho", at: "2026-06-23T10:05:00+09:00", text: "편집 직무 오픈 시 재접촉 가치 있음 → 인재풀 이동 완료." },
    ],
    messages: [
      { id: "ms1", at: "2026-06-23T10:10:00+09:00", subject: "[아르코에듀] 전형 결과 안내", kind: "불합격", status: "발송됨" },
    ],
  },
  {
    // ⚠ 중복 데모: c-19(윤소희 중복 레코드)의 영어 편집기획 접수
    id: "app-21",
    candidateId: "c-19",
    jobId: "english-researcher",
    stageId: "applied",
    appliedAt: "2026-07-01T21:44:00+09:00",
    updatedAt: "2026-07-01T21:44:00+09:00",
    starred: false,
    ai: {
      matchScore: 83,
      summary: "교재 편집 경력의 연구원 후보. 동일 인물의 기존 지원(1차 면접 진행 중)과 중복 접수로 판단됨.",
      strengths: ["교재 편집 실무", "출간 이력"],
      concerns: ["동일 공고군 중복 접수 — 기존 지원 건과 통합 필요"],
    },
    activities: [
      { id: "a1", at: "2026-07-01T21:44:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (잡코리아)" },
    ],
    evaluations: [],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-07-01T21:45:00+09:00", subject: "[아르코에듀] 지원서 접수가 완료되었습니다", kind: "접수확인", status: "발송됨" },
    ],
  },
  {
    id: "app-20",
    candidateId: "c-03",
    jobId: "chinese-content",
    stageId: "rejected",
    appliedAt: "2026-05-02T10:00:00+09:00",
    updatedAt: "2026-05-20T09:00:00+09:00",
    starred: false,
    rejectReason: "중국어 능통 요건 미충족",
    ai: {
      matchScore: 41,
      summary: "직무 필수 요건(중국어)이 확인되지 않음.",
      strengths: ["콘텐츠 기획 감각"],
      concerns: ["중국어 능력 증빙 없음"],
    },
    activities: [
      { id: "a1", at: "2026-05-02T10:00:00+09:00", actor: "system", text: "지원서가 접수되었습니다 (사람인)" },
      { id: "a2", at: "2026-05-20T09:00:00+09:00", actor: "m-junho", text: "불합격 처리" },
    ],
    evaluations: [
      {
        id: "ev1",
        evaluatorId: "m-minseok",
        round: "서류 평가",
        decision: "보류",
        scores: [
          { item: "기획 감각", score: 4 },
          { item: "콘텐츠 이해", score: 4 },
        ],
        comment: "직무 필수 요건(중국어)만 미충족. 기획 역량은 우수 — 타 직무 재발굴 가치 있음.",
        at: "2026-05-18T14:00:00+09:00",
      },
    ],
    comments: [],
    messages: [
      { id: "ms1", at: "2026-05-20T09:05:00+09:00", subject: "[아르코에듀] 전형 결과 안내", kind: "불합격", status: "발송됨" },
    ],
  },
];

// ── 면접 일정 (오늘 = 2026-07-02 기준 주간) ─────────────────────

export const SEED_INTERVIEWS: Interview[] = [
  { id: "iv-01", applicationId: "app-11", round: "1차 면접", date: "2026-07-02", start: "15:00", end: "16:00", location: "본관 7층 면접실 A", interviewerIds: ["m-hana", "m-junho"], leadId: "m-hana", status: "예정" },
  { id: "iv-02", applicationId: "app-03", round: "2차 면접", date: "2026-07-02", start: "10:30", end: "11:30", location: "본관 7층 면접실 B", interviewerIds: ["m-taekyung", "m-suhyun", "m-dongwook"], leadId: "m-taekyung", status: "평가대기", note: "본부장 배석" },
  { id: "iv-03", applicationId: "app-08", round: "1차 면접", date: "2026-07-03", start: "14:00", end: "15:00", location: "화상 면접 (Google Meet)", meetingUrl: "https://meet.google.com/arc-demo-ivc", interviewerIds: ["m-minseok", "m-junho"], leadId: "m-minseok", status: "예정" },
  { id: "iv-04", applicationId: "app-18", round: "1차 면접", date: "2026-07-06", start: "10:30", end: "11:30", location: "본관 7층 면접실 A", interviewerIds: ["m-minseok", "m-sangho"], leadId: "m-minseok", status: "예정" },
  { id: "iv-05", applicationId: "app-14", round: "2차 면접", date: "2026-07-07", start: "11:00", end: "12:00", location: "본관 7층 면접실 B", interviewerIds: ["m-suhyun", "m-minseok"], leadId: "m-suhyun", status: "예정" },
  { id: "iv-07", applicationId: "app-07", round: "처우 미팅", date: "2026-07-03", start: "16:00", end: "16:30", location: "화상 면접 (Google Meet)", meetingUrl: "https://meet.google.com/arc-demo-off", interviewerIds: ["m-suhyun"], status: "예정" },
  { id: "iv-08", applicationId: "app-13", round: "2차 면접", date: "2026-06-24", start: "15:00", end: "16:00", location: "본관 7층 면접실 A", interviewerIds: ["m-hana", "m-suhyun"], leadId: "m-hana", status: "완료", panelSummary: { decision: "추천", text: "실무 감각과 커뮤니케이션 모두 안정적. 2차에서 처우 눈높이만 확인하면 진행 무리 없음.", byId: "m-hana", at: "2026-06-24T17:10:00+09:00" } },
];

// ── 면접 일정 제안 (조율 중) ─────────────────────────────────────
// app-me-1(김지원)의 2차 면접 — 지원자가 /my에서 시간을 고르면 자동 확정

export const SEED_PROPOSALS: InterviewProposal[] = [
  {
    id: "pr-01",
    applicationId: "app-me-1",
    round: "2차 면접",
    location: "본관 7층 면접실 A",
    interviewerIds: ["m-taekyung", "m-suhyun"],
    leadId: "m-taekyung",
    slots: [
      { date: "2026-07-08", start: "14:00", end: "15:00" },
      { date: "2026-07-09", start: "10:30", end: "11:30" },
      { date: "2026-07-10", start: "16:00", end: "17:00" },
    ],
    status: "대기",
    sentAt: "2026-07-01T17:30:00+09:00",
  },
];

// ── 면접관 알림 (포털 알림함 데모) ───────────────────────────────

export const SEED_NOTICES: InterviewerNotice[] = [
  {
    id: "nt-01",
    memberId: "m-taekyung",
    at: "2026-07-02T11:35:00+09:00",
    kind: "평가요청",
    title: "[2차 면접] 평가를 남겨주세요 — 박서준",
    body: "7/2 10:30 진행한 2차 면접의 평가가 아직 제출되지 않았습니다. 포털에서 바로 제출할 수 있습니다.",
    applicationId: "app-03",
    interviewId: "iv-02",
    read: false,
    mailedLive: false,
  },
  {
    id: "nt-02",
    memberId: "m-minseok",
    at: "2026-07-01T09:10:00+09:00",
    kind: "면접확정",
    title: "[2차 면접] 일정 확정 — 7/7(화) 11:00",
    body: "지원자가 면접 시간을 선택해 일정이 확정되었습니다. 본관 7층 면접실 B, 공동 면접관: 김수현.",
    applicationId: "app-14",
    interviewId: "iv-05",
    read: false,
    mailedLive: false,
  },
  {
    id: "nt-03",
    memberId: "m-taekyung",
    at: "2026-07-01T17:30:00+09:00",
    kind: "일정조율",
    title: "[2차 면접] 일정 조율 시작 — 김지원",
    body: "면접관으로 배정되었습니다. 지원자에게 시간 후보 3개를 제안했으며, 선택 즉시 확정 알림을 드립니다.",
    applicationId: "app-me-1",
    read: true,
    mailedLive: false,
  },
  // 현재 데모 작업자(김수현) 앞 통지 — 헤더 알림함 데모
  {
    id: "nt-04",
    memberId: "m-suhyun",
    at: "2026-07-02T09:20:00+09:00",
    kind: "평가요청",
    title: "[2차 면접] 평가를 남겨주세요 — 박서준",
    body: "7/2 10:30 진행한 2차 면접의 평가가 필요합니다. 지원자 상세에서 바로 제출할 수 있습니다.",
    applicationId: "app-03",
    interviewId: "iv-02",
    read: false,
    mailedLive: false,
  },
  {
    id: "nt-05",
    memberId: "m-suhyun",
    at: "2026-07-01T09:10:00+09:00",
    kind: "면접확정",
    title: "[2차 면접] 일정 확정 — 7/7(화) 11:00",
    body: "지원자가 면접 시간을 선택해 일정이 확정되었습니다. 본관 7층 면접실 B, 공동 면접관: 황민석.",
    applicationId: "app-14",
    interviewId: "iv-05",
    read: false,
    mailedLive: false,
  },
];

// ── 필기시험 세트 (웹 프록터링) ──────────────────────────────────

export const SEED_EXAM_TEMPLATES: ExamTemplate[] = [
  {
    id: "ext-dev",
    title: "개발 직무 필기시험",
    category: "개발",
    description:
      "개발 직군 공통 필기 — CS 기초·SQL·설계 서술·코딩 문항. 60분, 프록터링 전체 적용. (참고용 샘플)",
    durationMin: 60,
    shuffle: false,
    passingScore: 30,
    proctor: { camera: true, screen: true, fullscreen: true, blockCopyPaste: true, maxViolations: 5 },
    createdAt: "2026-07-01T10:00:00+09:00",
    questions: [
      {
        id: "q-http", type: "단일선택", points: 5,
        prompt: "클라이언트가 요청한 리소스가 서버에 존재하지 않을 때 반환하는 HTTP 상태 코드는?",
        options: ["200 OK", "301 Moved Permanently", "404 Not Found", "500 Internal Server Error"],
        answerKey: [2],
      },
      {
        id: "q-bigo", type: "단일선택", points: 5,
        prompt: "정렬된 배열에서 이진 탐색(binary search)의 시간복잡도는?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        answerKey: [1],
      },
      {
        id: "q-rest", type: "다중선택", points: 10,
        prompt: "REST 아키텍처 스타일의 특성으로 옳은 것을 모두 고르세요.",
        options: ["무상태성(Stateless)", "캐시 가능(Cacheable)", "서버가 클라이언트 세션을 항상 유지", "균일한 인터페이스(Uniform Interface)"],
        answerKey: [0, 1, 3],
      },
      {
        id: "q-sql", type: "단답", points: 5,
        prompt: "SQL에서 SELECT 결과의 중복 행을 제거하는 키워드는? (한 단어)",
        answerKey: ["distinct", "DISTINCT", "select distinct"],
      },
      {
        id: "q-cache", type: "서술", points: 15,
        prompt: "수강신청처럼 순간 트래픽이 몰리는 서비스에서 캐싱 전략을 어떻게 설계할지 서술하세요. (캐시 계층, 무효화, 스탬피드 대응을 포함해 500자 내외)",
      },
      {
        id: "q-code", type: "코딩", points: 10,
        prompt: "문자열 s를 단어 단위로 뒤집는 함수를 작성하세요. 예: \"아르코 채용 시험\" → \"시험 채용 아르코에듀\". 언어는 자유이며, 엣지 케이스 처리를 주석으로 남기세요.",
        starterCode: "function reverseWords(s) {\n  // TODO\n}",
      },
    ],
  },
  {
    id: "ext-apt",
    title: "공통 인적성 검사",
    category: "공통 인적성",
    description: "전 직군 공통 인적성 — 언어·수리·상황판단 4문항 샘플. 30분. (참고용 샘플)",
    durationMin: 30,
    shuffle: true,
    proctor: { camera: true, screen: false, fullscreen: true, blockCopyPaste: true, maxViolations: 5 },
    createdAt: "2026-06-20T10:00:00+09:00",
    questions: [
      {
        id: "qa-1", type: "단일선택", points: 5,
        prompt: "다음 중 '견고하다'와 의미가 가장 가까운 단어는?",
        options: ["느슨하다", "튼튼하다", "성기다", "무르다"],
        answerKey: [1],
      },
      {
        id: "qa-2", type: "단일선택", points: 5,
        prompt: "어떤 상품의 가격이 20% 인상된 뒤 다시 20% 인하되었다. 최초 가격 대비 현재 가격은?",
        options: ["100%", "96%", "104%", "98%"],
        answerKey: [1],
      },
      {
        id: "qa-3", type: "단일선택", points: 5,
        prompt: "수열 3, 6, 11, 18, 27, ( ) 에서 괄호에 들어갈 수는?",
        options: ["36", "38", "40", "42"],
        answerKey: [1],
      },
      {
        id: "qa-4", type: "단일선택", points: 5,
        prompt: "협업 중 동료가 반복적으로 마감을 어길 때 가장 바람직한 첫 대응은?",
        options: ["팀장에게 즉시 보고한다", "동료와 1:1로 상황과 원인을 먼저 확인한다", "내가 대신 업무를 끝낸다", "다음 프로젝트에서 제외되도록 건의한다"],
        answerKey: [1],
      },
    ],
  },
];

// ── 필기시험 응시 세션 ───────────────────────────────────────────
// exs-me: 데모 계정(me)의 발급 세션 — /my에서 응시 버튼이 보인다.
// exs-01: 제출 완료(채점 대기) — HR 채점·무결성 리포트 데모.

export const SEED_EXAM_SESSIONS: ExamSession[] = [
  {
    id: "exs-me",
    applicationId: "app-me-1",
    templateId: "ext-dev",
    token: "exm-me-4k2p9d",
    status: "발급",
    assignedAt: "2026-07-05T10:00:00+09:00",
    expiresAt: "2026-07-14T23:59:00+09:00",
    answers: [],
    events: [],
  },
  {
    id: "exs-01",
    applicationId: "app-03",
    templateId: "ext-dev",
    token: "exm-sj-8b3n1q",
    status: "제출",
    assignedAt: "2026-06-28T09:30:00+09:00",
    expiresAt: "2026-07-03T23:59:00+09:00",
    startedAt: "2026-07-01T14:00:00+09:00",
    submittedAt: "2026-07-01T14:52:00+09:00",
    answers: [
      { questionId: "q-http", selected: [2], autoScore: 5 },
      { questionId: "q-bigo", selected: [1], autoScore: 5 },
      { questionId: "q-rest", selected: [0, 1], autoScore: 0 },
      { questionId: "q-sql", text: "DISTINCT", autoScore: 5 },
      {
        questionId: "q-cache",
        text: "CDN·애플리케이션 캐시(Redis)·로컬 캐시 3계층으로 나누고, 수강신청 오픈 직전 핫 키를 워밍업합니다. 무효화는 TTL+이벤트 기반 병행, 스탬피드는 뮤텍스 락과 확률적 조기 만료(PER)로 대응합니다. 정합성이 중요한 잔여 좌석은 캐시를 짧게 가져가고 DB 원자 연산으로 최종 확정합니다.",
      },
      {
        questionId: "q-code",
        text: "function reverseWords(s) {\n  // 연속 공백은 하나로 정규화, 앞뒤 공백 제거\n  return s.trim().split(/\\s+/).reverse().join(' ');\n}",
      },
    ],
    events: [
      { id: "exe-01", at: "2026-07-01T13:58:10+09:00", type: "입장" },
      { id: "exe-02", at: "2026-07-01T13:58:40+09:00", type: "신분확인" },
      { id: "exe-03", at: "2026-07-01T13:59:55+09:00", type: "장비점검완료" },
      { id: "exe-04", at: "2026-07-01T14:00:02+09:00", type: "녹화시작", detail: "캠+화면" },
      { id: "exe-05", at: "2026-07-01T14:17:21+09:00", type: "탭이탈" },
      { id: "exe-06", at: "2026-07-01T14:17:29+09:00", type: "탭복귀", detail: "8초" },
      { id: "exe-07", at: "2026-07-01T14:31:02+09:00", type: "전체화면이탈" },
      { id: "exe-08", at: "2026-07-01T14:31:11+09:00", type: "전체화면복귀" },
      { id: "exe-09", at: "2026-07-01T14:40:44+09:00", type: "탭이탈" },
      { id: "exe-10", at: "2026-07-01T14:40:49+09:00", type: "탭복귀", detail: "5초" },
      { id: "exe-11", at: "2026-07-01T14:52:00+09:00", type: "제출" },
    ],
    integrityScore: 74,
    recording: { camChunks: 624, screenChunks: 624, snapshots: 156, idPhoto: true, uploaded: false },
    maxScore: 50,
  },
];

// ── 인재풀 ───────────────────────────────────────────────────────

export const SEED_TALENT: TalentEntry[] = [
  { id: "t-01", name: "문준영", role: "영상 편집자", tags: ["영상편집", "교육채널", "재접촉 추천"], addedAt: "2026-06-23", expiresAt: "2029-06-23", source: "지원 이력 (콘텐츠 영상 디자인)", note: "편집 전문. 편집자 직무 오픈 시 1순위 재접촉.", lastApplied: "[디자인] 콘텐츠 영상 디자인 채용" },
  { id: "t-02", name: "김태리", role: "중국어 연구원", tags: ["중국어", "HSK 강의"], addedAt: "2026-03-14", expiresAt: "2029-03-14", source: "인재풀 직접 등록", note: "HSK 학원 강의 3년. 중국어 콘텐츠 직무 적합." },
  { id: "t-03", name: "박강민", role: "데이터 분석가", tags: ["SQL", "Python", "마케팅 분석"], addedAt: "2026-05-02", expiresAt: "2029-05-02", source: "채용 행사 (잡페어)", note: "데이터 분석가 공고 게시 시 우선 연락 요망." },
  { id: "t-04", name: "이슬비", role: "일본어 연구원", tags: ["JLPT N1", "교재 개발"], addedAt: "2026-04-20", expiresAt: "2029-04-20", source: "지원 이력 (일본어 연구원)", note: "최종 면접까지 진행 후 개인 사정으로 사퇴. 재지원 의사 있음.", lastApplied: "[연구] 일본어 연구원 채용" },
  { id: "t-05", name: "정우성", role: "프론트엔드 개발자", tags: ["Vue", "TypeScript"], addedAt: "2026-02-11", expiresAt: "2029-02-11", source: "지인 추천", note: "Vue 주력. React 전환 의사 확인 필요." },
  { id: "t-06", name: "한예슬", role: "학원 상담", tags: ["교육상담", "CS"], addedAt: "2026-06-01", expiresAt: "2029-06-01", source: "인재풀 직접 등록", note: "대형 어학원 상담 5년. 가온/북부 캠퍼스 선호." },
  { id: "t-07", name: "오지호", role: "회계 연구원", tags: ["CPA", "회계"], addedAt: "2026-01-15", expiresAt: "2027-01-15", source: "지원 이력 (금융 연구원)", note: "보관 만료 임박 — 동의 갱신 또는 파기 필요.", lastApplied: "[연구] 금융 연구원(회계/세무 부문) 채용" },
  { id: "t-08", name: "유민지", role: "콘텐츠 마케터", tags: ["퍼포먼스", "콘텐츠"], addedAt: "2026-05-28", expiresAt: "2029-05-28", source: "채용 행사 (대학 리크루팅)", note: "마케팅본부 인턴 전환 후보." },
];

// ── 메시지 템플릿 ────────────────────────────────────────────────

export const SEED_TEMPLATES: MessageTemplate[] = [
  {
    id: "tpl-01",
    kind: "접수확인",
    name: "지원 접수 확인",
    subject: "[아르코에듀] 지원서 접수가 완료되었습니다",
    body: "{{이름}}님, 아르코에듀에 지원해 주셔서 감사합니다.\n지원하신 [{{공고명}}] 전형의 접수가 정상 완료되었습니다.\n서류 검토 후 다음 전형 안내를 드리겠습니다.",
  },
  {
    id: "tpl-02",
    kind: "서류합격",
    name: "서류 합격 안내",
    subject: "[아르코에듀] 서류 전형 합격 안내",
    body: "{{이름}}님, 축하드립니다!\n[{{공고명}}] 서류 전형에 합격하셨습니다.\n다음 전형 일정은 별도 안내 예정입니다.",
  },
  {
    id: "tpl-03",
    kind: "면접안내",
    name: "면접 일정 안내",
    subject: "[아르코에듀] 면접 일정 안내",
    body: "{{이름}}님, [{{공고명}}] 면접 일정을 안내드립니다.\n\n일시: {{일시}}\n장소: {{장소}}\n\n일정 변경이 필요하시면 회신 부탁드립니다.",
  },
  {
    id: "tpl-04",
    kind: "최종합격",
    name: "최종 합격 축하",
    subject: "[아르코에듀] 최종 합격을 축하드립니다",
    body: "{{이름}}님, 아르코에듀 [{{공고명}}] 전형에 최종 합격하셨습니다. 진심으로 축하드립니다!\n입사 안내는 인사팀에서 개별 연락드립니다.",
  },
  {
    id: "tpl-05",
    kind: "불합격",
    name: "전형 결과 안내 (불합격)",
    subject: "[아르코에듀] 전형 결과 안내",
    body: "{{이름}}님, 아르코에듀 [{{공고명}}] 전형에 지원해 주셔서 감사합니다.\n안타깝게도 이번 전형에서는 함께하지 못하게 되었습니다.\n소중한 시간을 내어 지원해 주신 점 다시 한번 감사드리며, 앞날의 건승을 기원합니다.",
  },
  {
    id: "tpl-06",
    kind: "기타",
    name: "인적성 검사 안내",
    subject: "[아르코에듀] 인적성 검사 응시 안내",
    body: "{{이름}}님, [{{공고명}}] 전형의 인적성 검사를 안내드립니다.\n응시 기간: {{일시}}\n응시 링크는 별도 문자로 발송됩니다.",
  },
  {
    id: "tpl-exam",
    kind: "기타",
    name: "필기시험 응시 안내 (웹 프록터링)",
    subject: "[아르코에듀] 필기시험 응시 안내",
    body: "{{이름}}님, [{{공고명}}] 전형의 온라인 필기시험을 안내드립니다.\n\n응시 기한: {{기한}}\n응시 링크: {{링크}}\n\n· 시험은 카메라·마이크·화면 공유가 켜진 상태로 진행됩니다(부정행위 방지).\n· 조용한 공간에서 크롬(Chrome) 브라우저로 응시해 주세요.\n· 시작 후에는 중단할 수 없으니 시간을 확보한 뒤 입장해 주세요.",
  },
  // ── 문자 ──
  {
    id: "tpl-sms-1",
    kind: "면접안내",
    templateType: "문자",
    name: "면접 리마인드(문자)",
    subject: "[아르코에듀] 면접 안내",
    body: "[아르코에듀] {{이름}}님, {{일시}} {{장소}} 면접 예정입니다. 변경 시 회신 바랍니다.",
  },
  // ── 평가표 ──
  {
    id: "tpl-eval-1",
    kind: "기타",
    templateType: "평가표",
    name: "1차 면접 평가표",
    subject: "1차 면접 스코어카드",
    body: "평가 항목: 직무 전문성 / 문제 해결 / 커뮤니케이션 / 컬처핏 (각 5점)\n종합 의견:",
  },
  // ── 면접 ──
  {
    id: "tpl-itv-1",
    kind: "기타",
    templateType: "면접",
    name: "구조화 면접 질문 세트",
    subject: "1차 면접 질문 가이드",
    body: "1) 최근 가장 어려웠던 문제와 해결 과정\n2) 지원 직무에서 이루고 싶은 것\n3) 협업 중 갈등 경험과 대처",
  },
  // ── 지원서 ──
  {
    id: "tpl-app-1",
    kind: "기타",
    templateType: "지원서",
    name: "일반직 표준 지원서",
    subject: "일반직 지원서 양식",
    body: "기본정보 / 학력 / 경력 / 자기소개서 / 포트폴리오 URL / 개인정보 수집·이용 동의",
  },
];

// ── 설정 ─────────────────────────────────────────────────────────

export const SEED_SETTINGS: HrSettings = {
  showStageToCandidate: true,
  showTimelineToCandidate: true,
  notifyOnStageChange: true,
  retentionYears: 3,
  workspaceEmail: "recruit@arco.example",
  mailInboundConnected: false,
};

// ── 스냅샷 ───────────────────────────────────────────────────────

/** localStorage 스키마 버전 — 시드 구조가 바뀌면 올려서 캐시 무효화 */
export const HR_STATE_VERSION = 13;

export function createSeedState(): HrState {
  return {
    version: HR_STATE_VERSION,
    stages: SEED_STAGES,
    jobs: SEED_JOBS,
    candidates: SEED_CANDIDATES,
    applications: SEED_APPLICATIONS,
    interviews: SEED_INTERVIEWS,
    proposals: SEED_PROPOSALS,
    examTemplates: SEED_EXAM_TEMPLATES,
    examSessions: SEED_EXAM_SESSIONS,
    notices: SEED_NOTICES,
    talent: SEED_TALENT,
    members: SEED_MEMBERS,
    templates: SEED_TEMPLATES,
    settings: SEED_SETTINGS,
    dismissedDupes: [],
    auditLog: [],
  };
}
