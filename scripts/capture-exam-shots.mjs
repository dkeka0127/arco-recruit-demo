// ════════════════════════════════════════════════════════════════
//  필기시험 스크린샷 캡처 — 기능 명세서(public/manual-exam.html)용.
//  가짜 미디어 장치로 실제 응시 흐름을 태워 화면을 찍는다. 실행:
//    NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npx next dev -p 3005
//    node scripts/capture-exam-shots.mjs
// ════════════════════════════════════════════════════════════════
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOT_BASE ?? "http://localhost:3005";
const OUT = "public/exam-shots";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--auto-select-desktop-capture-source=Entire screen",
    "--no-sandbox",
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
page.on("dialog", (d) => d.accept());

async function open(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(700);
  await page.evaluate(() => document.querySelector("nextjs-portal")?.remove());
}
async function shot(file, full = false) {
  await page.evaluate(() => document.querySelector("nextjs-portal")?.remove());
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: full });
  console.log(`✓ ${file}`);
}
async function click(text) {
  const rect = await page.evaluate((t) => {
    const el = [...document.querySelectorAll("button")].find((b) => b.textContent.includes(t));
    if (!el) return null;
    el.scrollIntoView({ block: "center", behavior: "instant" });
    return true;
  }, text);
  if (!rect) { console.warn(`⚠ 버튼 못 찾음: ${text}`); return false; }
  await sleep(250);
  const r = await page.evaluate((t) => {
    const el = [...document.querySelectorAll("button")].find((b) => b.textContent.includes(t));
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, inView: b.y >= 0 && b.y <= innerHeight };
  }, text);
  if (r.inView) await page.mouse.click(r.x, r.y);
  else await page.evaluate((t) => [...document.querySelectorAll("button")].find((b) => b.textContent.includes(t))?.click(), text);
  await sleep(600);
  return true;
}

// ── HR: 필기시험 목록(세트 + 응시 현황) ──────────────────────────
await open("/hr/exams");
await shot("hr-exams.png", true);

// ── HR: 시험 세트 빌더 ───────────────────────────────────────────
await open("/hr/exams");
await click("새 시험 세트");
await sleep(500);
await shot("hr-builder.png", true);

// ── HR: 채점 화면 (제출된 exs-01) ────────────────────────────────
await open("/hr/exams/exs-01");
await sleep(800);
await shot("hr-review.png", true);

// ── 지원자 응시: 인트로(동의) ────────────────────────────────────
await open("/exam/exm-me-4k2p9d");
await shot("take-intro.png", true);

// ── 지원자 응시: 장비 점검 (캠·신분·화면공유) ────────────────────
for (const box of await page.$$('input[type="checkbox"]')) await box.click();
await click("장비 점검 시작");
await sleep(500);
await click("켜기");
await sleep(1500);
await click("촬영");
await sleep(500);
await click("공유");
await sleep(1500);
await shot("take-check.png", true);

// ── 지원자 응시: 응시 화면 (문항 + 감독 헤더 + 캠 PiP) ────────────
await click("시험 시작");
await sleep(1500);
await page.evaluate(() => document.querySelector("nextjs-portal")?.remove());
await page.screenshot({ path: `${OUT}/take-exam.png` }); // 뷰포트(전체화면 헤더 보이게)
console.log("✓ take-exam.png");

// ── 지원자 응시: 위반 오버레이 (탭 이탈 유발 후 전체화면 이탈 흉내) ─
await page.evaluate(() => {
  Object.defineProperty(document, "hidden", { value: true, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
  Object.defineProperty(document, "hidden", { value: false, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
});
await sleep(500);
await page.screenshot({ path: `${OUT}/take-warning.png` });
console.log("✓ take-warning.png (경고 카운트 노출)");

await browser.close();
console.log("\n📸 완료 →", OUT);
