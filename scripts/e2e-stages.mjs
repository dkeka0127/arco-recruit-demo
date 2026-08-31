// 파이프라인 단계 관리 E2E — 추가·순서변경·삭제(지원자 있으면 거부).
// 데모 모드 서버 필요.
import puppeteer from "puppeteer-core";
const BASE = "http://localhost:3005";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args:["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({width:1440,height:900});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let fail=0; const check=(n,ok)=>{console.log(`${ok?"✅":"❌"} ${n}`); if(!ok)fail++;};
// DOM 기준 — 활성 단계는 "지원자 표기" 행 중 "(고정)"이 없는 행
const activeNames = () => p.evaluate(() => {
  const rows=[...document.querySelectorAll("div.rounded-xl")].filter(d=>d.textContent.includes("지원자 표기") && !d.textContent.includes("(고정)"));
  return rows.map(d=>d.querySelector('input[title="내부 단계명"]')?.value ?? "").filter(Boolean);
});
const stageCount = async () => (await activeNames()).length;

await p.goto(`${BASE}/hr/settings`,{waitUntil:"networkidle0"}); await sleep(900);
const before = await stageCount();
check("단계 관리 패널 — 단계 추가 버튼", (await p.evaluate(()=>[...document.querySelectorAll("button")].some(b=>b.textContent.includes("단계 추가")))));

// 추가 (prompt 자동 응답)
p.once("dialog", (d)=>d.accept("3차 면접"));
await p.evaluate(()=>[...document.querySelectorAll("button")].find(b=>b.textContent.includes("단계 추가"))?.click());
await sleep(700);
const after = await stageCount();
check("단계 추가 → 활성 단계 +1", after === before+1);
check("추가한 단계가 목록에 표시", (await activeNames()).includes("3차 면접"));

// 순서 이동 — 마지막 활성 단계(3차 면접)를 위로 한 칸
const namesBefore = await activeNames();
await p.evaluate((target)=>{
  // 대상 행의 "위로" 버튼 클릭
  const rows=[...document.querySelectorAll("div.rounded-xl")].filter(d=>d.textContent.includes("지원자 표기"));
  const row=rows.find(d=>d.textContent.includes(target));
  row?.querySelector('button[aria-label="위로"]')?.click();
},"3차 면접");
await sleep(500);
const namesAfter = await activeNames();
check("순서 이동 — 3차 면접이 앞으로 이동", namesAfter.indexOf("3차 면접") < namesBefore.indexOf("3차 면접"));

// 삭제 — 방금 추가한 빈 단계(지원자 없음) 삭제 성공
await p.evaluate((target)=>{
  const rows=[...document.querySelectorAll("div.rounded-xl")].filter(d=>d.textContent.includes("지원자 표기"));
  const row=rows.find(d=>d.textContent.includes(target));
  row?.querySelector('button[aria-label="단계 삭제"]')?.click();
},"3차 면접");
await sleep(600);
check("빈 단계 삭제 성공", (await stageCount()) === before);

// 삭제 거부 — 지원자가 있는 "지원 접수" 단계 삭제 시도 → toast 거부
await p.evaluate(()=>{
  const rows=[...document.querySelectorAll("div.rounded-xl")].filter(d=>d.textContent.includes("지원자 표기"));
  const row=rows.find(d=>d.textContent.includes("지원 접수"));
  row?.querySelector('button[aria-label="단계 삭제"]')?.click();
});
await sleep(600);
const t = await p.evaluate(()=>document.body.innerText);
check("지원자 있는 단계 삭제 거부 (안내 노출)", t.includes("먼저 다른 단계로 옮겨") || (await stageCount())===before);

await b.close();
console.log(fail===0?"\n🎉 ALL PASS":`\n💥 ${fail} FAILED`);
process.exit(fail?1:0);
