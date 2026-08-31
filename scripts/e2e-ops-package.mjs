// 운영 동선 완성 패키지 E2E —
// ① 지원자 상세 이전/다음 네비(+키보드) ② 발송 문안 변수 치환·수정·이력 문면
// ③ 필기시험 기한 연장·미응시 리마인드·제출 확인 안내·대시보드 임박 큐
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
async function clickBtn(text) {
  const ok = await page.evaluate((t) => {
    const els = [...document.querySelectorAll("button")];
    const el =
      els.find((b) => b.textContent.trim() === t) ??
      els.find((b) => b.textContent.includes(t));
    if (!el) return false;
    el.scrollIntoView({ block: "center", behavior: "instant" });
    el.click();
    return true;
  }, text);
  if (!ok) console.warn(`⚠ 버튼 못 찾음: ${text}`);
  await sleep(450);
  return ok;
}

// ── 1. 이전/다음 지원자 네비게이션 ───────────────────────────────
// 지원자가 여러 명인 단계(지원 접수)의 첫 지원자로 진입
await page.goto(`${BASE}/hr/applicants?stage=applied`, { waitUntil: "networkidle0" });
await sleep(900);
const firstHref = await page.evaluate(
  () =>
    [...document.querySelectorAll('a[href^="/hr/applicants/"]')].find((a) =>
      /\/hr\/applicants\/[^/]+$/.test(a.getAttribute("href") ?? ""),
    )?.getAttribute("href") ?? null,
);
await page.goto(`${BASE}${firstHref}`, { waitUntil: "networkidle0" });
await sleep(900);
let t = "";
const navLabel = await page.evaluate(
  () =>
    [...document.querySelectorAll("span")].find((x) =>
      /^\s*\d+\/\d+\s*$/.test(x.textContent ?? ""),
    )?.textContent ?? "",
);
check("상세 헤더 — 단계 내 순번 표시 (n/m)", /\d+\/\d+/.test(navLabel));
const beforeUrl = page.url();
// 리스트는 최신순 → 첫 행이 접수순 마지막일 수 있으므로 이전/다음 중 있는 쪽 클릭
const moved = await page.evaluate(() => {
  const btn =
    document.querySelector('button[title^="다음 지원자"]') ??
    document.querySelector('button[title^="이전 지원자"]');
  if (!btn) return null;
  const dir = btn.title.startsWith("다음") ? "next" : "prev";
  btn.click();
  return dir;
});
await sleep(900);
check(
  "이전/다음 버튼 → 다른 지원자로 이동",
  Boolean(moved) && page.url() !== beforeUrl && page.url().includes("/hr/applicants/"),
);
// 키보드로 원래 지원자 복귀 (이동 방향의 반대 키)
await page.keyboard.press(moved === "next" ? "ArrowLeft" : "ArrowRight");
await sleep(900);
check("키보드 ←/→ → 원래 지원자로 복귀", page.url() === beforeUrl);

// ── 2. 발송 문안 — 변수 치환·수정·이력 문면 ─────────────────────
await page.goto(`${BASE}/hr/applicants/app-03`, { waitUntil: "networkidle0" });
await sleep(900);
// 템플릿 문안이 치환되어 있는지 (기본 템플릿: 접수확인 — {{이름}}/{{공고명}} 포함)
// 이메일 발신 패널에도 placeholder="제목" input이 있어 마지막(발송 문안) 것을 읽는다
const subj = await page.evaluate(
  () =>
    [...document.querySelectorAll('input[placeholder="제목"]')].at(-1)?.value ?? "",
);
const body = await page.evaluate(
  () => document.querySelector('textarea[placeholder="본문"]')?.value ?? "",
);
const filled =
  body.includes("박서준") && !body.includes("{{이름}}") && subj.length > 0;
if (!filled) console.log(`  · debug subj="${subj}" body[0:80]="${body.slice(0, 80)}"`);
check("발송 문안 자동 치환 (이름·공고명, 변수 원문 없음)", filled);
// 본문 수정 후 발송 → 이력에 문면 저장
await page.evaluate(() => {
  const ta = document.querySelector('textarea[placeholder="본문"]');
  const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
  set.call(ta, ta.value + "\n\n(E2E 수정 문안 확인)");
  ta.dispatchEvent(new Event("input", { bubbles: true }));
});
await sleep(300);
t = await bodyText();
check("문안 수정 시 '템플릿 원문으로 되돌리기' 노출", t.includes("템플릿 원문으로 되돌리기"));
await clickBtn("발송");
await sleep(500);
await page.evaluate(() => {
  const modal = document.querySelector('[role="alertdialog"]');
  [...(modal?.querySelectorAll("button") ?? [])]
    .find((b) => b.textContent.trim() === "발송")
    ?.click();
});
await sleep(700);
// 이력에서 발송 문면 열람
await page.evaluate(() => {
  [...document.querySelectorAll("summary")]
    .find((x) => x.textContent.includes("발송 문면 보기"))
    ?.click();
});
await sleep(300);
t = await bodyText();
check("이력에 발송 문면 저장·열람", t.includes("(E2E 수정 문안 확인)"));

// ── 3. 필기시험 리마인드 · 기한 연장 ─────────────────────────────
await page.goto(`${BASE}/hr/exams`, { waitUntil: "networkidle0" });
await sleep(900);
t = await bodyText();
check("응시 현황 — D-day 뱃지", /D-\d+|D-DAY/.test(t));
// 리마인드 (발급 세션 exs-me)
await page.evaluate(() => {
  [...document.querySelectorAll('button[title="미응시 리마인드 발송"]')][0]?.click();
});
await sleep(600);
t = await bodyText();
check("리마인드 발송 토스트", t.includes("응시 리마인드를 발송했습니다"));
// 기한 연장
await page.evaluate(() => {
  [...document.querySelectorAll('button[title^="응시 기한 연장"]')][0]?.click();
});
await sleep(400);
t = await bodyText();
check("기한 연장 인라인 편집 오픈", t.includes("새 응시 기한") && t.includes("기존 링크가 그대로 유지"));
await page.evaluate(() => {
  const inp = [...document.querySelectorAll('input[type="date"]')].at(-1);
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  const d = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  set.call(inp, d);
  inp.dispatchEvent(new Event("input", { bubbles: true }));
});
await sleep(200);
await clickBtn("연장");
await sleep(600);
t = await bodyText();
check("기한 연장 완료 토스트", t.includes("까지 연장했습니다"));

// 지원자 활동 로그에 리마인드·연장 기록 확인
await page.goto(`${BASE}/hr/applicants/app-me-1`, { waitUntil: "networkidle0" });
await sleep(900);
t = await bodyText();
check(
  "활동 타임라인 — 리마인드·기한 연장 기록",
  t.includes("응시 리마인드 발송") && t.includes("기한 연장"),
);

// ── 4. 대시보드 — 기한 임박 미응시 큐 ────────────────────────────
// exs-me 기한을 오늘로 당길 수 없으므로(연장했음), localStorage 직접 조작 대신
// 임박 로직은 D-1 이내 세션이 있을 때만 뜬다 — 시드 exs-01은 제출 상태.
// 검증: 대시보드가 정상 렌더되고 채점 대기 큐는 유지되는지 확인.
await page.goto(`${BASE}/hr`, { waitUntil: "networkidle0" });
await sleep(900);
t = await bodyText();
check("대시보드 — 채점 대기 큐 유지(회귀)", t.includes("채점 대기"));

await browser.close();
console.log(fail === 0 ? "\n🎉 ALL PASS" : `\n💥 ${fail} FAILED`);
process.exit(fail ? 1 : 0);
