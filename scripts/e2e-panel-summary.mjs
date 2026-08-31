import puppeteer from "puppeteer-core";
const BASE = "http://localhost:3005";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
page.on("dialog", (d) => d.accept());
let fail = 0;
const check = (n, ok) => { console.log(`${ok ? "✅" : "❌"} ${n}`); if (!ok) fail++; };

// 1. 정태경(리드) 포털 — 패널 결론 제출
await page.goto(`${BASE}/interviewer/ivp-taekyung-r9c47f`, { waitUntil: "networkidle0" });
await sleep(800);
const t1 = await page.evaluate(() => document.body.innerText);
check("리드 카드 + 배석 현황 표시", t1.includes("패널 결론 작성") && /배석 평가 \d\/3/.test(t1));
// 리마인드 버튼
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent.includes("미제출자 리마인드"))?.click();
});
await sleep(400);
// 판정 선택 + 의견 작성 + 제출
await page.evaluate(() => {
  const ta = [...document.querySelectorAll("textarea")].find((t) => t.placeholder.includes("패널 종합 의견"));
  const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
  set.call(ta, "기술 깊이는 배석 전원 동의. 커뮤니케이션 우려는 2차에서 협업 사례 질문으로 확인 권장. 진행 추천.");
  ta.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent.includes("패널 결론 제출"))?.click();
});
await sleep(1000);
const t2 = await page.evaluate(() => document.body.innerText);
check("제출 후 리드 카드 사라짐", !t2.includes("패널 결론 작성"));

// 2. HR 상세(app-03)에 패널 결론 표시
await page.goto(`${BASE}/hr/applicants/app-03`, { waitUntil: "networkidle0" });
await sleep(1000);
const t3 = await page.evaluate(() => document.body.innerText);
check("HR 상세에 패널 결론 카드", t3.includes("패널 결론") && t3.includes("취합한 결론"));

// 3. 설정 — 멤버 추가 + 검색
await page.goto(`${BASE}/hr/settings`, { waitUntil: "networkidle0" });
await sleep(800);
const t4 = await page.evaluate(() => document.body.innerText);
check("멤버 카운트 표시", /운영진 \d+ · 면접관 \d+/.test(t4));
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent.includes("멤버 추가"))?.click();
});
await sleep(300);
await page.type('input[placeholder="이름"]', "신규면접");
await page.type('input[placeholder="이메일 (사내 계정)"]', "new.iv@arco.example");
await page.type('input[placeholder="팀/본부"]', "어학연구소");
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "등록")?.click();
});
await sleep(600);
await page.type('input[placeholder="이름·이메일 검색"]', "신규면접");
await sleep(400);
const t5 = await page.evaluate(() => document.body.innerText);
check("멤버 추가 + 검색 동작", t5.includes("신규면접") && t5.includes("new.iv@arco.example"));

// 4. 일정 제안 — 면접관 검색/대표 지정 UI
await page.goto(`${BASE}/hr/applicants/app-08`, { waitUntil: "networkidle0" });
await sleep(800);
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent.includes("일정 제안"))?.click();
});
await sleep(400);
const t6 = await page.evaluate(() => document.body.innerText);
const hasSearch = await page.evaluate(() =>
  Boolean(document.querySelector('input[placeholder="면접관 검색 (이름·팀)"]')));
check("면접관 선택기 — 검색+대표 안내", hasSearch && t6.includes("대표 면접관 — 면접 후 배석 평가를 취합"));

await browser.close();
console.log(fail === 0 ? "\n🎉 ALL PASS" : `\n💥 ${fail} FAILED`);
process.exit(fail ? 1 : 0);
