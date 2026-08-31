// HR 지원자 직접 등록(폼 외 유입) E2E.
import puppeteer from "puppeteer-core";
const BASE = "http://localhost:3005";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args:["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({width:1440,height:900});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let fail=0; const check=(n,ok)=>{console.log(`${ok?"✅":"❌"} ${n}`); if(!ok)fail++;};
const txt=()=>p.evaluate(()=>document.body.innerText);
const store=()=>p.evaluate(()=>JSON.parse(localStorage.getItem("talent-os-hr-state")||"{}"));
const clickBtn=(t)=>p.evaluate((x)=>{
  const exact=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()===x);
  (exact ?? [...document.querySelectorAll("button")].find(b=>b.textContent.trim().includes(x)))?.click();
},t);

const EMAIL = "direct-e2e@test.com";

// ── 1. 툴바 버튼 → 드로어 오픈 ──────────────────────────────────
await p.goto(`${BASE}/hr/applicants`,{waitUntil:"networkidle0"}); await sleep(900);
let t=await txt();
check("툴바에 '지원자 등록' 버튼", t.includes("지원자 등록"));
await clickBtn("지원자 등록"); await sleep(600);
t=await txt();
check("드로어 오픈 (직접 등록 폼)", t.includes("지원자 직접 등록") && t.includes("접수 공고"));

// ── 2. 폼 입력 → 등록 ───────────────────────────────────────────
await p.type('input[placeholder="후보자 이름"]',"정직접");
await p.type('input[placeholder="candidate@example.com"]',EMAIL);
await p.type('input[placeholder="010-0000-0000"]',"010-1234-5678");
await p.type('input[placeholder="백엔드, 5년차"]',"백엔드, 추천");
await p.type('textarea[placeholder="추천인·경위 등 팀이 알아야 할 배경"]',"E2E 등록 메모입니다");
await clickBtn("등록하기"); await sleep(1500);
check("등록 후 지원자 상세로 이동", p.url().includes("/hr/applicants/") && !p.url().endsWith("/hr/applicants"));
t=await txt();
check("상세에 후보 이름 표시", t.includes("정직접"));

// ── 3. 스토어 검증 ──────────────────────────────────────────────
let s=await store();
const cand=(s.candidates||[]).find(c=>c.email===EMAIL);
const app=(s.applications||[]).find(a=>a.candidateId===cand?.id);
check("후보 생성 — 유입 경로·태그 저장", !!cand && cand.source==="헤드헌터 추천" && cand.tags.includes("백엔드"));
check("활동 로그 '지원자 직접 등록'", (app?.activities||[]).some(a=>a.text.includes("지원자 직접 등록")));
check("접수확인 메일 미발송 (기본 off)", (app?.messages||[]).length===0);
check("등록 메모 → 팀 코멘트", (app?.comments||[]).some(c=>c.text.includes("E2E 등록 메모")));
check("감사 로그 candidate_registered", (s.auditLog||[]).some(l=>l.action==="candidate_registered" && l.targetId===cand?.id));

// ── 4. 같은 이메일+같은 공고 재등록 → 중복 안내, 새 지원서 없음 ──
const firstAppId = app?.id;
const appCountBefore = (s.applications||[]).length;
await p.goto(`${BASE}/hr/applicants`,{waitUntil:"networkidle0"}); await sleep(900);
await clickBtn("지원자 등록"); await sleep(600);
await p.type('input[placeholder="후보자 이름"]',"정직접");
await p.type('input[placeholder="candidate@example.com"]',EMAIL);
await clickBtn("등록하기"); await sleep(1500);
t=await txt();
s=await store();
check("중복 안내 토스트", t.includes("이미 같은 공고에 접수된 지원자"));
check("새 지원서 미생성 + 기존 상세로 이동", (s.applications||[]).length===appCountBefore && p.url().includes(firstAppId||"__none__"));

await b.close();
console.log(fail===0?"\n🎉 direct-register E2E 전부 통과":`\n💥 ${fail}건 실패`);
process.exit(fail===0?0:1);
