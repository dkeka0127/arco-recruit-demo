// 감사 로그 필터/검색/내보내기 E2E.
// 시드 auditLog는 비어 있으므로 UI 액션(직접 등록·시험 취소)으로 이벤트를 만든 뒤 검증한다.
import puppeteer from "puppeteer-core";
const BASE = "http://localhost:3005";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args:["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({width:1440,height:900});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
p.on("dialog",(d)=>d.accept());
let fail=0; const check=(n,ok)=>{console.log(`${ok?"✅":"❌"} ${n}`); if(!ok)fail++;};
const txt=()=>p.evaluate(()=>document.body.innerText);
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
/** 감사 로그 패널 스코프 텍스트 — 페이지의 다른 패널과 분리해 검증 */
const auditText=()=>p.evaluate(()=>{
  const h=[...document.querySelectorAll("*")].find(el=>el.childElementCount===0 && el.textContent.trim()==="감사 로그");
  return h?.closest("section, div.surface-card, div[class*='rounded']")?.parentElement?.innerText
    ?? [...document.querySelectorAll("ul")].map(u=>u.innerText).join("\n");
});

// ── 0. 감사 이벤트 생성 ─────────────────────────────────────────
// (a) 지원자 직접 등록 → candidate_registered (sensitive)
await p.goto(`${BASE}/hr/applicants`,{waitUntil:"networkidle0"}); await sleep(900);
await clickBtn("지원자 등록"); await sleep(500);
await p.type('input[placeholder="후보자 이름"]',"감사로그");
await p.type('input[placeholder="candidate@example.com"]',"audit-e2e@test.com");
await clickBtn("등록하기"); await sleep(1400);
// (b) 시험 취소 → exam_canceled
await p.goto(`${BASE}/hr/exams`,{waitUntil:"networkidle0"}); await sleep(900);
await p.evaluate(()=>{
  [...document.querySelectorAll("button")].find(b=>b.title==="링크 취소(무효화)")?.click();
});
await sleep(500);
await modalBtn("취소(무효화)"); await sleep(600);

// ── 1. 패널 표시 + 액션 라벨 뱃지 ───────────────────────────────
await p.goto(`${BASE}/hr/settings`,{waitUntil:"networkidle0"}); await sleep(1000);
let t=await txt();
check("감사 로그 패널 + 건수 표시", t.includes("감사 로그") && /전체 \d+건/.test(t));
check("액션 라벨 뱃지 (직접 등록·시험 취소)", t.includes("지원자 직접 등록") && t.includes("시험 취소"));
check("내보내기 버튼", t.includes("내보내기"));

// ── 2. 검색 ─────────────────────────────────────────────────────
await p.type('input[placeholder="내용·담당자 검색"]',"감사로그");
await sleep(400);
t=await auditText();
check("검색 — 직접 등록 건만 매칭", t.includes("감사로그") && !t.includes("필기시험 취소"));
// 검색어 삭제
await p.evaluate(()=>{
  const inp=document.querySelector('input[placeholder="내용·담당자 검색"]');
  const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;
  set.call(inp,""); inp.dispatchEvent(new Event("input",{bubbles:true}));
});
await sleep(300);

// ── 3. 분류 칩 필터 ─────────────────────────────────────────────
await clickBtn("필기시험"); await sleep(400);
t=await auditText();
check("칩 '필기시험' — 시험 취소만", t.includes("필기시험 취소") && !t.includes("직접 등록"));
await clickBtn("개인정보"); await sleep(400);
t=await auditText();
check("칩 '개인정보' — 직접 등록만", t.includes("직접 등록") && !t.includes("필기시험 취소"));
await p.evaluate(()=>{
  // 칩 "전체"는 페이지 내 다른 "전체" 버튼과 구분 — 감사 로그 검색창 옆 칩 그룹에서 선택
  const inp=document.querySelector('input[placeholder="내용·담당자 검색"]');
  const bar=inp?.closest("div.flex.flex-wrap");
  [...(bar?.querySelectorAll("button")??[])].find(b=>b.textContent.trim()==="전체")?.click();
});
await sleep(400);

// ── 4. 민감(개인정보만) 토글 ────────────────────────────────────
await clickBtn("개인정보만"); await sleep(400);
t=await auditText();
check("'개인정보만' — sensitive 건만", t.includes("직접 등록") && !t.includes("필기시험 취소"));
await clickBtn("개인정보만"); await sleep(300);

// ── 5. 내보내기 → 확인 토스트 ───────────────────────────────────
await clickBtn("내보내기"); await sleep(600);
t=await txt();
check("CSV 내보내기 토스트 (건수 포함)", /감사 로그 \d+건을 내보냈습니다/.test(t));

await b.close();
console.log(fail===0?"\n🎉 audit-log E2E 전부 통과":`\n💥 ${fail}건 실패`);
process.exit(fail===0?0:1);
