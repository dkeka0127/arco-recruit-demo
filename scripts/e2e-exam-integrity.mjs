// 시험 무결성 패키지 E2E — 세션 스냅샷(세트 수정 소급 방지) + 좀비 세션.
// 데모 모드 서버 필요:
//   NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npx next dev -p 3005
import puppeteer from "puppeteer-core";
const BASE = "http://localhost:3005";
const b = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--auto-select-desktop-capture-source=Entire screen", "--no-sandbox"],
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
p.on("dialog", (d) => d.accept());
let fail = 0;
const check = (n, ok) => { console.log(`${ok ? "✅" : "❌"} ${n}`); if (!ok) fail++; };
const txt = () => p.evaluate(() => document.body.innerText);
async function clickBtn(t, exact = false) {
  const ok = await p.evaluate((x, ex) => {
    const els = [...document.querySelectorAll("button")];
    const el = ex ? els.find((b) => b.textContent.trim() === x) : (els.find((b) => b.textContent.trim() === x) ?? els.find((b) => b.textContent.includes(x)));
    if (!el) return false;
    el.scrollIntoView({ block: "center", behavior: "instant" }); el.click(); return true;
  }, t, exact);
  await sleep(400); return ok;
}

// exs-01(제출 상태, 스냅샷 없는 구 세션 — 하위호환 확인)은 그대로 두고,
// 새 배정으로 스냅샷 세션을 만든 뒤 세트를 수정해 소급 영향이 없는지 본다.

// ── 1. app-08에 개발 시험 배정 (스냅샷 생성) ────────────────────
await p.goto(`${BASE}/hr/applicants/app-08`, { waitUntil: "networkidle0" });
await sleep(900);
await clickBtn("시험 배정");
await sleep(400);
// 기본 선택 시험으로 발급
await clickBtn("링크 발급");
await sleep(700);
let t = await txt();
check("시험 배정 → 발급 세션 생성", t.includes("발급") || t.includes("응시 기한"));

// 배정된 세션의 토큰 확보 (링크 복사 대신 상태에서 직접)
const token = await p.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem("talent-os-hr-state") || "{}");
  const sess = (raw.examSessions || []).filter((x) => x.applicationId === "app-08" && x.status === "발급");
  return sess[0]?.token ?? null;
});
check("발급 세션 토큰·스냅샷 확보", Boolean(token));
const snapQCount = await p.evaluate((tok) => {
  const raw = JSON.parse(localStorage.getItem("talent-os-hr-state") || "{}");
  const sess = (raw.examSessions || []).find((x) => x.token === tok);
  return sess?.snapshot?.questions?.length ?? 0;
}, token);
check("세션에 문항 스냅샷 저장됨", snapQCount > 0);

// ── 2. 원본 세트에서 문항 삭제 → 스냅샷은 불변 확인 ─────────────
await p.goto(`${BASE}/hr/exams`, { waitUntil: "networkidle0" });
await sleep(800);
// 개발 직무 필기시험 편집 → 첫 문항 삭제 → 저장
await p.evaluate(() => {
  const card = [...document.querySelectorAll("div.rounded-xl")].find((c) => c.textContent.includes("개발 직무 필기시험"));
  [...(card?.querySelectorAll("button") ?? [])].find((b) => b.textContent.includes("편집"))?.click();
});
await sleep(500);
// 첫 문항 삭제 버튼(title="문항 삭제")
await p.evaluate(() => {
  document.querySelector('button[title="문항 삭제"]')?.click();
});
await sleep(300);
await clickBtn("수정 저장", true);
await sleep(700);
// 스냅샷 문항 수 불변?
const snapAfter = await p.evaluate((tok) => {
  const raw = JSON.parse(localStorage.getItem("talent-os-hr-state") || "{}");
  const sess = (raw.examSessions || []).find((x) => x.token === tok);
  return sess?.snapshot?.questions?.length ?? 0;
}, token);
check("세트 문항 삭제 후에도 세션 스냅샷 문항 수 불변", snapAfter === snapQCount);

// ── 3. 응시 화면이 스냅샷 기준으로 렌더 (삭제된 문항 개수 유지) ──
await p.goto(`${BASE}/exam/${token}`, { waitUntil: "networkidle0" });
await sleep(700);
t = await txt();
check("응시 인트로 — 스냅샷 문항 수 표시", t.includes(`${snapQCount}문항`));

// ── 4. 좀비 세션 정리 — 진행중 + 시간 경과 세션 자동 제출 ───────
// localStorage에 진행중이고 startedAt이 과거(제한시간+유예 초과)인 세션을 주입
await p.evaluate((tok) => {
  const raw = JSON.parse(localStorage.getItem("talent-os-hr-state") || "{}");
  const sess = (raw.examSessions || []).find((x) => x.token === tok);
  if (sess) {
    sess.status = "진행중";
    sess.startedAt = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(); // 5시간 전
    sess.answers = [{ questionId: sess.snapshot.questions[0].id, selected: [0] }];
  }
  localStorage.setItem("talent-os-hr-state", JSON.stringify(raw));
}, token);
// HR 콘솔 진입 → 셸 sweep이 30초 주기지만 마운트 시 즉시 1회 실행
await p.goto(`${BASE}/hr`, { waitUntil: "networkidle0" });
await sleep(2500);
const zombieStatus = await p.evaluate((tok) => {
  const raw = JSON.parse(localStorage.getItem("talent-os-hr-state") || "{}");
  return (raw.examSessions || []).find((x) => x.token === tok)?.status ?? "?";
}, token);
check("좀비 세션(진행중+시간초과) → 자동 제출", zombieStatus === "제출");

await b.close();
console.log(fail === 0 ? "\n🎉 ALL PASS" : `\n💥 ${fail} FAILED`);
process.exit(fail ? 1 : 0);
