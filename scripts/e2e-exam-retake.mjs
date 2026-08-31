// 필기시험 재응시 흐름 E2E — 불합격→재응시(리뷰 원클릭), 중단→재응시(현황 인라인), 이중 발급 방지.
import puppeteer from "puppeteer-core";
const BASE = "http://localhost:3005";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args:["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({width:1440,height:900});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
p.on("dialog",(d)=>d.accept());
let fail=0; const check=(n,ok)=>{console.log(`${ok?"✅":"❌"} ${n}`); if(!ok)fail++;};
const txt=()=>p.evaluate(()=>document.body.innerText);
const store=()=>p.evaluate(()=>JSON.parse(localStorage.getItem("talent-os-hr-state")||"{}"));
const clickBtn=(t)=>p.evaluate((x)=>{
  const exact=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()===x);
  (exact ?? [...document.querySelectorAll("button")].find(b=>b.textContent.trim().includes(x)))?.click();
},t);
async function modalBtn(t){
  await p.evaluate((x)=>{
    const m=document.querySelector('[role="alertdialog"]');
    [...(m?.querySelectorAll("button")??[])].find(b=>b.textContent.trim()===x)?.click();
  },t);
  await sleep(500);
}

// ── 1. 불합격 채점 (exs-01, 합격선 30 미달) ─────────────────────
await p.goto(`${BASE}/hr/exams/exs-01`,{waitUntil:"networkidle0"}); await sleep(1000);
const nums = await p.$$('input[type="number"]');
for (const [i,v] of ["5","0"].entries()) {
  if (!nums[i]) break;
  await nums[i].click({clickCount:3}); await nums[i].type(v);
}
await sleep(300);
await clickBtn("채점 확정"); await sleep(600);
let t=await txt();
check("합격선 미달 모달", t.includes("합격선 미달"));
await modalBtn("불합격 처리"); await sleep(800);
t=await txt();
check("채점완료 + 재응시 배정 버튼 노출", t.includes("확정 점수") && t.includes("재응시 배정"));

// ── 2. 리뷰 화면 원클릭 재응시 ──────────────────────────────────
await clickBtn("재응시 배정"); await sleep(500);
t=await txt();
check("재응시 확인 모달 (2차·기한 안내)", t.includes("재응시를 배정할까요") && t.includes("2차"));
await modalBtn("재응시 배정"); await sleep(800);
let s=await store();
let retake=(s.examSessions||[]).find(x=>x.retakeOfId==="exs-01");
check("새 세션 발급 — attempt 2·발급 상태·새 토큰", !!retake && retake.attempt===2 && retake.status==="발급" && retake.token!==(s.examSessions||[]).find(x=>x.id==="exs-01")?.token);
const app03=(s.applications||[]).find(a=>a.id==="app-03");
check("재응시 안내 메일 기록", (app03?.messages||[]).some(m=>m.subject.includes("재응시 안내") && m.subject.includes("2차")));
check("활동 로그 — 재응시 배정(2차)", (app03?.activities||[]).some(a=>a.text.includes("재응시 배정") && a.text.includes("2차")));
check("감사 로그 — 재응시(2차)", (s.auditLog||[]).some(l=>l.action==="exam_assigned" && l.summary.includes("재응시(2차)")));

// ── 3. 응시 현황 — 회차 뱃지 + 이중 발급 방지 ───────────────────
await p.goto(`${BASE}/hr/exams`,{waitUntil:"networkidle0"}); await sleep(900);
t=await txt();
check("응시 현황에 2차 뱃지", t.includes("2차"));
// 채점완료(exs-01) 행에서 다시 재응시 → 살아있는 2차 세션 반환, 새 세션 없음
const countBefore=(await store()).examSessions.length;
await clickBtn("재응시"); await sleep(400);
await clickBtn("재응시 발급"); await sleep(700);
s=await store();
t=await txt();
check("살아있는 회차 있으면 재발급 안 함 + 안내 토스트", s.examSessions.length===countBefore && t.includes("이미 진행 중인 회차"));

// ── 4. 중단 세션 → 재응시 (exs-me 취소 후 인라인 발급) ──────────
// 취소 대상을 exs-me 행으로 한정 — 2차(방금 발급한 재응시) 행을 건드리지 않도록
await p.evaluate(()=>{
  const row=[...document.querySelectorAll("div")].find(r=>
    r.className.includes("px-5") && !r.innerText.includes("2차") &&
    [...r.querySelectorAll("button")].some(b=>b.title==="링크 취소(무효화)"));
  [...(row?.querySelectorAll("button")??[])].find(b=>b.title==="링크 취소(무효화)")?.click();
});
await sleep(500);
await modalBtn("취소(무효화)"); await sleep(600);
s=await store();
check("exs-me 중단 처리", (s.examSessions||[]).find(x=>x.id==="exs-me")?.status==="중단");
// 중단 행의 재응시 버튼 → 인라인 → 발급 (재응시 버튼이 여러 행에 있어 행 기준 선택)
await p.evaluate(()=>{
  const row=[...document.querySelectorAll("div")].find(r=>
    r.className.includes("px-5") && r.innerText.includes("중단") && [...r.querySelectorAll("button")].some(b=>b.title.startsWith("재응시 배정")));
  [...(row?.querySelectorAll("button")??[])].find(b=>b.title.startsWith("재응시 배정"))?.click();
});
await sleep(400);
await clickBtn("재응시 발급"); await sleep(700);
s=await store();
const retakeMe=(s.examSessions||[]).find(x=>x.retakeOfId==="exs-me");
check("중단→재응시 — app-me-1 2차 발급", !!retakeMe && retakeMe.attempt===2 && retakeMe.status==="발급" && retakeMe.applicationId==="app-me-1");

// ── 5. 지원자 상세 — 회차 뱃지·재응시 버튼 ──────────────────────
await p.goto(`${BASE}/hr/applicants/app-03`,{waitUntil:"networkidle0"}); await sleep(900);
t=await txt();
check("지원자 상세 — 2차 뱃지 + 이전 회차 병존", t.includes("2차") && t.includes("채점완료"));

await b.close();
console.log(fail===0?"\n🎉 exam-retake E2E 전부 통과":`\n💥 ${fail}건 실패`);
process.exit(fail===0?0:1);
