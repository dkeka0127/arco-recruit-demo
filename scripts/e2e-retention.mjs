// 개인정보 보관기한 자동 파기 E2E — 만료 인재풀 자동 삭제 + 감사 로그 + 토스트.
import puppeteer from "puppeteer-core";
const BASE = "http://localhost:3005";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args:["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({width:1440,height:900});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let fail=0; const check=(n,ok)=>{console.log(`${ok?"✅":"❌"} ${n}`); if(!ok)fail++;};
const txt=()=>p.evaluate(()=>document.body.innerText);
const store=()=>p.evaluate(()=>JSON.parse(localStorage.getItem("talent-os-hr-state")||"{}"));

// ── 0. 준비 — 스토어 영속화 후 t-07 보관기한을 어제로 조작 ───────
await p.goto(`${BASE}/hr/applicants/app-14`,{waitUntil:"networkidle0"}); await sleep(900);
await p.evaluate(()=>{
  const star=[...document.querySelectorAll("button")].find(b=>b.title?.includes("주요") || b.querySelector("svg.lucide-star"));
  star?.click(); star?.click();
});
await sleep(500);
const prepared = await p.evaluate(()=>{
  const raw=JSON.parse(localStorage.getItem("talent-os-hr-state")||"{}");
  const t=(raw.talent||[]).find(x=>x.id==="t-07");
  if(!t) return false;
  const d=new Date(Date.now()-86400000);
  const pad=(n)=>String(n).padStart(2,"0");
  t.expiresAt=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  localStorage.setItem("talent-os-hr-state",JSON.stringify(raw));
  return true;
});
check("준비 — t-07(오지호) 보관기한을 어제로", prepared);

// ── 1. 콘솔 재진입 → 셸 스케줄러가 자동 파기 ────────────────────
await p.goto(`${BASE}/hr`,{waitUntil:"networkidle0"}); await sleep(2500);
let t=await txt();
check("자동 파기 토스트", t.includes("보관기한이 만료된 인재") && t.includes("자동 파기"));
const s=await store();
check("인재풀에서 삭제됨", !(s.talent||[]).some(x=>x.id==="t-07"));
check("감사 로그 — 만료 자동 파기 (sensitive)", (s.auditLog||[]).some(l=>l.action==="talent_deleted" && l.summary.includes("보관기한 만료 자동 파기") && l.summary.includes("오지호") && l.sensitive===true));

// ── 2. 인재풀 화면 — 파기된 항목 미노출 ─────────────────────────
await p.goto(`${BASE}/hr/talent`,{waitUntil:"networkidle0"}); await sleep(1000);
t=await txt();
check("인재풀 목록에서 오지호 제외", !t.includes("오지호"));

// ── 3. 설정 — 자동 파기 안내 문구 ───────────────────────────────
await p.goto(`${BASE}/hr/settings`,{waitUntil:"networkidle0"}); await sleep(900);
t=await txt();
check("설정 — 자동 파기 정책 안내", t.includes("자동 파기") && t.includes("감사"));

await b.close();
console.log(fail===0?"\n🎉 retention E2E 전부 통과":`\n💥 ${fail}건 실패`);
process.exit(fail===0?0:1);
