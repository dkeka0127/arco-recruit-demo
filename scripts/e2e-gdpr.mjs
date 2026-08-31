// 지원 철회 / 개인정보 파기(GDPR) E2E.
import puppeteer from "puppeteer-core";
const BASE = "http://localhost:3005";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args:["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({width:1440,height:900});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
p.on("dialog",(d)=>d.accept("지원자 요청")); // prompt(철회 사유) 자동 응답
let fail=0; const check=(n,ok)=>{console.log(`${ok?"✅":"❌"} ${n}`); if(!ok)fail++;};
const txt=()=>p.evaluate(()=>document.body.innerText);
async function modalBtn(t){
  await p.evaluate((x)=>{
    const m=document.querySelector('[role="alertdialog"]');
    [...(m?.querySelectorAll("button")??[])].find(b=>b.textContent.trim()===x)?.click();
  },t);
  await sleep(500);
}

// ── 1. 지원 철회 (app-18: 진행중 지원자) ────────────────────────
await p.goto(`${BASE}/hr/applicants/app-18`,{waitUntil:"networkidle0"}); await sleep(900);
let t=await txt();
check("위험 구역 — 철회·파기 버튼", t.includes("위험 구역") && t.includes("지원 철회") && t.includes("개인정보 파기"));
await p.evaluate(()=>[...document.querySelectorAll("button")].find(b=>b.textContent.trim().includes("지원 철회"))?.click());
await sleep(500);
await modalBtn("철회 처리");
await sleep(700);
t=await txt();
check("철회 처리 → 철회됨 표시 + 취소 버튼", t.includes("철회됨") && t.includes("철회 취소"));
check("활동 로그에 철회 기록", t.includes("지원 철회 처리"));

// 철회 취소
await p.evaluate(()=>[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="철회 취소")?.click());
await sleep(600);
t=await txt();
check("철회 취소 → 다시 철회 버튼", t.includes("지원 철회") && !t.includes("철회됨"));

// ── 2. 개인정보 파기 (익명화) ────────────────────────────────────
const nameBefore = await p.evaluate(()=>document.querySelector("h2")?.textContent ?? "");
await p.evaluate(()=>[...document.querySelectorAll("button")].find(b=>b.textContent.includes("개인정보 파기"))?.click());
await sleep(500);
t=await txt();
check("파기 확인 모달 (되돌릴 수 없음 안내)", t.includes("되돌릴 수 없") || t.includes("영구 파기"));
await modalBtn("영구 파기");
await sleep(800);
t=await txt();
check("파기 후 — 익명화 안내 표시", t.includes("개인정보가 파기된 지원자") || t.includes("파기된 지원자"));
const nameAfter = await p.evaluate(()=>document.querySelector("h2")?.textContent ?? "");
check("이름이 '파기된 지원자'로 익명화", nameAfter.includes("파기된 지원자") && nameBefore !== nameAfter);

// 스토어에서 식별정보 제거 확인
const cleared = await p.evaluate(()=>{
  const raw=JSON.parse(localStorage.getItem("talent-os-hr-state")||"{}");
  const app=(raw.applications||[]).find(a=>a.id==="app-18");
  const c=(raw.candidates||[]).find(x=>x.id===app?.candidateId);
  return c && c.email==="" && c.phone==="" && c.coverLetter==="" && (c.files||[]).length===0 && !!c.anonymizedAt;
});
check("식별 정보 실제 제거(이메일·전화·자소서·파일)", cleared);

// ── 3. 보드에서 파기/철회 힌트 노출 ─────────────────────────────
await p.goto(`${BASE}/hr/applicants`,{waitUntil:"networkidle0"}); await sleep(900);
t=await txt();
check("보드 힌트 — 개인정보 파기 표시", t.includes("개인정보 파기") || t.includes("파기된 지원자"));

await b.close();
console.log(fail===0?"\n🎉 ALL PASS":`\n💥 ${fail} FAILED`);
process.exit(fail?1:0);
