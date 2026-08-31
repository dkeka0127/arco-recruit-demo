// ════════════════════════════════════════════════════════════════
//  면접관 포털 스크린샷 캡처 — 사용 안내서(manual-interviewer.html)용
//
//  데모 모드(dev 서버, Supabase env 비활성)에 시스템 Chrome을 붙여
//  실제 화면을 찍는다. 실행:
//    NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npx next dev -p 3005
//    node scripts/capture-interviewer-shots.mjs
// ════════════════════════════════════════════════════════════════

import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOT_BASE ?? "http://localhost:3005";
const OUT = "docs/screenshots";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(600); // 모션/폰트 안정화
  // dev 오버레이 배지가 캡처에 찍히지 않게 제거
  await page.evaluate(() => document.querySelector("nextjs-portal")?.remove());
}

/** 텍스트를 포함한 버튼 클릭 */
async function clickButton(text) {
  const ok = await page.evaluate((t) => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      (b.textContent ?? "").includes(t),
    );
    if (!btn) return false;
    btn.click();
    return true;
  }, text);
  if (!ok) console.warn(`⚠ 버튼 못 찾음: ${text}`);
  await sleep(500);
  return ok;
}

/** 헤더 텍스트로 Panel(section.surface-card)을 찾아 페이지 좌표 반환 */
async function panelRect(headerText) {
  return page.evaluate((t) => {
    const el = [...document.querySelectorAll("section.surface-card")].find((s) =>
      (s.querySelector("header")?.textContent ?? "").includes(t),
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
  }, headerText);
}

async function shotClip(rect, file, pad = 14) {
  if (!rect) {
    console.warn(`⚠ 대상 없음: ${file}`);
    return;
  }
  await page.screenshot({
    path: `${OUT}/${file}`,
    clip: {
      x: Math.max(0, rect.x - pad),
      y: Math.max(0, rect.y - pad),
      width: rect.w + pad * 2,
      height: rect.h + pad * 2,
    },
  });
  console.log(`✓ ${file}`);
}

// ── 1. 포털 전체 (황민석 — 평가 대기 2건) ────────────────────────
await open("/interviewer/ivp-minseok-e6v20h");
await page.screenshot({ path: `${OUT}/iv-portal.png`, fullPage: true });
console.log("✓ iv-portal.png");

// ── 2. 스코어카드 (평가 카드 펼침 + 별점 기준) ───────────────────
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes("1차 면접") || (b.textContent ?? "").includes("2차 면접"),
  );
  btn?.click();
});
await sleep(500);
await clickButton("별점 기준 보기");
await shotClip(
  await page.evaluate(() => {
    // 펼쳐진 평가 카드(스코어카드 폼 포함)를 찾는다
    const form = [...document.querySelectorAll("textarea")].find((t) =>
      (t.placeholder ?? "").includes("면접 코멘트"),
    );
    const card = form?.closest("div.rounded-xl.border");
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
  }),
  "iv-scorecard.png",
);

// ── 3. 면접 준비 킷 (예정 면접 카드 펼침) ────────────────────────
await open("/interviewer/ivp-minseok-e6v20h");
await clickButton("면접 준비 킷 열기");
await sleep(400);
await shotClip(
  await page.evaluate(() => {
    const mark = [...document.querySelectorAll("p")].find((p) =>
      (p.textContent ?? "").includes("추천 질문"),
    );
    const card = mark?.closest("div.rounded-xl.border");
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
  }),
  "iv-prepkit.png",
);

// ── 4. 진행 공유 — 독립 평가 잠금 (김수현: app-03에 타인 평가만 존재) ──
await open("/interviewer/ivp-suhyun-k4d92m");
await shotClip(await panelRect("진행 공유"), "iv-share-lock.png");

// ── 5. 알림함 (정태경 — 평가요청/일정조율 알림) ──────────────────
await open("/interviewer/ivp-taekyung-r9c47f");
await shotClip(await panelRect("알림"), "iv-notices.png");

// ── 6. HR 설정 — 멤버 링크 발급/재발급 (데모 모드라 게이트 없음) ──
await open("/hr/settings");
await shotClip(await panelRect("멤버 및 권한"), "iv-settings-links.png");

await browser.close();
console.log("done");
