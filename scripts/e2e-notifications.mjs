// 헤더 알림함 E2E — 벨 배지·드롭다운·모두읽음·클릭 이동.
import puppeteer from "puppeteer-core";
const BASE = "http://localhost:3005";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args:["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({width:1440,height:900});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let fail=0; const check=(n,ok)=>{console.log(`${ok?"✅":"❌"} ${n}`); if(!ok)fail++;};

await p.goto(`${BASE}/hr`,{waitUntil:"networkidle0"}); await sleep(1000);
// 벨 배지 — 김수현 미읽음 2건
const badge = await p.evaluate(()=>{
  const bell=[...document.querySelectorAll("button")].find(b=>b.getAttribute("aria-label")?.includes("알림"));
  return bell?.textContent?.trim() ?? "";
});
check("벨 배지 — 미읽음 수 표시", badge.includes("2"));

// 드롭다운 열기
await p.evaluate(()=>{
  [...document.querySelectorAll("button")].find(b=>b.getAttribute("aria-label")?.includes("알림"))?.click();
});
await sleep(500);
let t = await p.evaluate(()=>document.body.innerText);
check("드롭다운 — 내 통지 표시", t.includes("평가를 남겨주세요 — 박서준") && t.includes("일정 확정"));

// 모두 읽음
await p.evaluate(()=>{
  [...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="모두 읽음")?.click();
});
await sleep(500);
const badgeAfter = await p.evaluate(()=>{
  const bell=[...document.querySelectorAll("button")].find(b=>b.getAttribute("aria-label")?.includes("알림"));
  return bell?.getAttribute("aria-label") ?? "";
});
check("모두 읽음 → 배지 사라짐", !badgeAfter.includes("안읽음"));

// 통지 클릭 → 지원자 상세로 이동 (드롭다운은 '모두 읽음' 후에도 열린 상태)
const dropdownOpen = await p.evaluate(()=>Boolean([...document.querySelectorAll("button")].find(b=>b.textContent.includes("평가를 남겨주세요 — 박서준"))));
if (!dropdownOpen) {
  await p.evaluate(()=>[...document.querySelectorAll("button")].find(b=>b.getAttribute("aria-label")?.includes("알림"))?.click());
  await sleep(400);
}
await p.evaluate(()=>{
  [...document.querySelectorAll("button")].find(b=>b.textContent.includes("평가를 남겨주세요 — 박서준"))?.click();
});
await p.waitForFunction(()=>location.pathname.includes("/hr/applicants/app-03"), { timeout: 5000 }).catch(()=>{});
await sleep(300);
check("통지 클릭 → 해당 지원자 상세로 이동", p.url().includes("/hr/applicants/app-03"));

await b.close();
console.log(fail===0?"\n🎉 ALL PASS":`\n💥 ${fail} FAILED`);
process.exit(fail?1:0);
