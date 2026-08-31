// ════════════════════════════════════════════════════════════════
//  E2E: 지원서 제출 → HR 스토어 접수 → /my·HR 콘솔 반영 검증
//  데모 모드 dev 서버(3005) 대상. 실행: node scripts/e2e-apply-flow.mjs
// ════════════════════════════════════════════════════════════════

import puppeteer from "puppeteer-core";

const BASE = "http://localhost:3005";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
page.on("dialog", (d) => d.accept());

let failures = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "✅" : "❌"} ${name}${extra ? ` — ${extra}` : ""}`);
  if (!ok) failures++;
}

// ── 1. 지원서 작성 (5단계) ───────────────────────────────────────
async function openForm() {
  await page.goto(`${BASE}/apply/general?job=ai-fullstack`, { waitUntil: "networkidle0" });
  await sleep(800);
  // 로그인 게이트 → "데모 지원서 작성" 버튼으로 폼 진입
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      (b.textContent ?? "").includes("데모 지원서"),
    );
    btn?.click();
  });
  await sleep(800);
  await page.waitForSelector('input[name="name"]', { timeout: 10000 });
}
await openForm();

async function fill(sel, text) {
  await page.evaluate((q) => {
    const el = document.querySelector(q);
    if (el) {
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, "");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, sel);
  await page.type(sel, text);
}

async function next() {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      (b.textContent ?? "").trim().startsWith("다음"),
    );
    btn?.click();
  });
  await sleep(600);
}

// step1: 기본정보 (공고는 쿼리로 프리셋)
await fill('input[name="name"]', "테스트지원");
await fill('input[name="email"]', "e2e-test@example.com");
await fill('input[name="phone"]', "010-1234-5678");
await next();

// step2: 학력 1건
await fill('input[name="educations.0.school"]', "한국대학교");
await fill('input[name="educations.0.major"]', "컴퓨터공학");
await page.select('select[name="educations.0.status"]', "졸업").catch(async () => {
  // Select가 옵션 라벨 기반일 수 있음 — evaluate로 폴백
  await page.evaluate(() => {
    const sel = document.querySelector('select[name="educations.0.status"]');
    if (sel) { sel.value = sel.options[1]?.value ?? ""; sel.dispatchEvent(new Event("change", { bubbles: true })); }
  });
});
await fill('input[name="educations.0.period"]', "2016.03 ~ 2020.02");
await next();

// step3: 자기소개 (30자+)
await fill(
  'textarea[name="coverLetter"]',
  "React와 Node.js 기반 서비스를 4년간 개발했습니다. LLM 활용 학습 기능을 만들고 싶어 지원합니다.",
);
await next();

// step4: 파일 (선택) — 건너뜀
await next();

// step5: 동의 + 제출
await page.evaluate(() => {
  const cb = document.querySelector('input[type="checkbox"][name="agreePrivacy"]')
    ?? [...document.querySelectorAll('input[type="checkbox"]')].at(-1);
  if (cb && !cb.checked) cb.click();
});
await sleep(300);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes("최종제출"),
  );
  btn?.click();
});
await sleep(2500);

const submitted = await page.evaluate(() => document.body.innerText);
check("제출 완료 화면", submitted.includes("정상적으로 제출"),
  submitted.match(/HKR-[\d-]+/)?.[0] ?? "접수번호 못 찾음");
const receiptNo = submitted.match(/HKR-[\d-]+/)?.[0] ?? "";

// ── 2. /my 반영 확인 (같은 브라우저) ─────────────────────────────
await page.goto(`${BASE}/my`, { waitUntil: "networkidle0" });
await sleep(800);
const myText = await page.evaluate(() => document.body.innerText);
check("/my에 이름 표시", myText.includes("테스트지원"));
check("/my에 지원 공고 표시", myText.includes("AI 풀스택"));

// ── 3. HR 콘솔 반영 확인 ─────────────────────────────────────────
await page.goto(`${BASE}/hr/applicants`, { waitUntil: "networkidle0" });
await sleep(1000);
const hrText = await page.evaluate(() => document.body.innerText);
check("HR 칸반에 신규 지원자", hrText.includes("테스트지원"));

// ── 4. 중복 제출 → 기존 접수번호 안내 ────────────────────────────
await openForm();
await fill('input[name="name"]', "테스트지원");
await fill('input[name="email"]', "e2e-test@example.com");
await fill('input[name="phone"]', "010-1234-5678");
await next();
await fill('input[name="educations.0.school"]', "한국대학교");
await fill('input[name="educations.0.major"]', "컴퓨터공학");
await page.evaluate(() => {
  const sel = document.querySelector('select[name="educations.0.status"]');
  if (sel) { sel.value = sel.options[1]?.value ?? ""; sel.dispatchEvent(new Event("change", { bubbles: true })); }
});
await fill('input[name="educations.0.period"]', "2016.03 ~ 2020.02");
await next();
await fill('textarea[name="coverLetter"]',
  "중복 제출 테스트를 위한 자기소개서입니다. 삼십자 이상이 되도록 충분히 길게 작성합니다.");
await next();
await next();
await page.evaluate(() => {
  const cb = [...document.querySelectorAll('input[type="checkbox"]')].at(-1);
  if (cb && !cb.checked) cb.click();
});
await sleep(300);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes("최종제출"),
  );
  btn?.click();
});
await sleep(2500);
const dupText = await page.evaluate(() => document.body.innerText);
check("중복 제출 안내", dupText.includes("이미 접수된 지원서"),
  dupText.match(/HKR-[\d-]+/)?.[0] === receiptNo ? "동일 접수번호 반환" : "접수번호 상이(확인 필요)");

await browser.close();
console.log(failures === 0 ? "\n🎉 ALL PASS" : `\n💥 ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
