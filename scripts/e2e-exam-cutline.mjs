// 2순위 패키지 E2E — 커트라인·채점 원클릭, 예약 발송 실동작, 리포트 필기 섹션.
// 데모 모드 서버 필요:
//   NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npx next dev -p 3005
import puppeteer from "puppeteer-core";

const BASE = "http://localhost:3005";
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
page.on("dialog", (d) => d.accept());
let fail = 0;
const check = (n, ok) => {
  console.log(`${ok ? "✅" : "❌"} ${n}`);
  if (!ok) fail++;
};
const bodyText = () => page.evaluate(() => document.body.innerText);
async function modalBtn(text) {
  await page.evaluate((t) => {
    const modal = document.querySelector('[role="alertdialog"]');
    [...(modal?.querySelectorAll("button") ?? [])]
      .find((b) => b.textContent.trim() === t)
      ?.click();
  }, text);
  await sleep(500);
}

// ── 1. 빌더 — 합격선 입력 필드 ───────────────────────────────────
await page.goto(`${BASE}/hr/exams`, { waitUntil: "networkidle0" });
await sleep(900);
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => b.textContent.includes("새 시험 만들기"))
    ?.click();
});
await sleep(500);
let t = await bodyText();
check("빌더 — 합격선 입력 필드", t.includes("합격선"));
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "닫기")?.click();
});
await sleep(300);

// ── 2. 채점 확정 → 합격선 원클릭 제안 ────────────────────────────
// 시드 exs-01: 제출 상태, ext-dev 합격선 30점. 수동 채점 후 확정.
await page.goto(`${BASE}/hr/exams/exs-01`, { waitUntil: "networkidle0" });
await sleep(1000);
t = await bodyText();
check("채점 헤더 — 합격선 뱃지", /합격선 30점 (통과|미달)/.test(t));
// 수동 채점 입력 (서술 15 + 코딩 10 → 자동 15 + 25 = 40 ≥ 30 통과)
const nums = await page.$$('input[type="number"]');
const vals = ["15", "10"];
for (let i = 0; i < nums.length && i < 2; i++) {
  await nums[i].click({ clickCount: 3 });
  await nums[i].type(vals[i]);
}
await sleep(300);
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => b.textContent.includes("채점 확정"))
    ?.click();
});
await sleep(600);
t = await bodyText();
check("확정 직후 — 합격선 통과 원클릭 제안 모달", t.includes("합격선 통과") && t.includes("다음 단계로 이동할까요"));
await modalBtn("합격 · 다음 단계로");
await sleep(800);
t = await bodyText();
check("원클릭 합격 → 채점 확정 + 단계 이동", t.includes("확정 점수") && t.includes("40"));
// 지원자 단계가 이동했는지
await page.goto(`${BASE}/hr/applicants/app-03`, { waitUntil: "networkidle0" });
await sleep(900);
t = await bodyText();
check("지원자 단계 이동 확인 (활동 로그)", t.includes("단계로 이동"));

// ── 3. 응시 현황 — 점수순 정렬 + 커트라인 색 ────────────────────
await page.goto(`${BASE}/hr/exams`, { waitUntil: "networkidle0" });
await sleep(900);
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "점수순")?.click();
});
await sleep(400);
const scoreColored = await page.evaluate(() =>
  Boolean(document.querySelector("span.text-signal[title^='합격선'], span[title^='합격선']")),
);
check("점수순 정렬 + 커트라인 색 표시", scoreColored);

// ── 4. 예약 발송 실동작 — 과거 시각 예약 → 셸 flush가 발송 처리 ──
await page.goto(`${BASE}/hr/applicants/app-05`, { waitUntil: "networkidle0" });
await sleep(900);
// 예약 시각을 1분 전으로 설정
await page.evaluate(() => {
  const inp = document.querySelector('input[type="datetime-local"]');
  const d = new Date(Date.now() - 60_000);
  const pad = (n) => String(n).padStart(2, "0");
  const v = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  set.call(inp, v);
  inp.dispatchEvent(new Event("input", { bubbles: true }));
});
await sleep(300);
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent.includes("예약"))?.click();
});
await sleep(500);
await modalBtn("예약");
await sleep(600);
// 페이지 이동(셸 재마운트) → flush 즉시 실행되어 발송 처리
await page.goto(`${BASE}/hr`, { waitUntil: "networkidle0" });
await sleep(1200);
t = await bodyText();
check("예약 발송 flush — 발송 완료 토스트", t.includes("예정 시각에 맞춰 발송"));
await page.goto(`${BASE}/hr/applicants/app-05`, { waitUntil: "networkidle0" });
await sleep(900);
t = await bodyText();
check("이력 — 예약 메시지가 발송됨으로 전환", t.includes("예약 메시지 발송") || !t.includes("예정)"));

// ── 5. 리포트 — 필기시험 전형 섹션 ───────────────────────────────
await page.goto(`${BASE}/hr/analytics`, { waitUntil: "networkidle0" });
await sleep(1000);
t = await bodyText();
check(
  "리포트 — 필기시험 전형 테이블 (응시율·합격선·무결성)",
  t.includes("필기시험 전형") && t.includes("응시율") && t.includes("합격선 통과"),
);

await browser.close();
console.log(fail === 0 ? "\n🎉 ALL PASS" : `\n💥 ${fail} FAILED`);
process.exit(fail ? 1 : 0);
