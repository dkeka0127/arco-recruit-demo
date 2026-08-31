// CRUD 완결 패키지 E2E — 감사에서 찾은 "문항 작성급 누락" 수정 검증:
// ① 면접 직접 확정 + 화상 링크 입력 + 면접 인라인 수정
// ② 메시지 템플릿 CRUD ③ 후보 정보 수정 ④ 평가·코멘트 수정/삭제
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
async function clickBtn(text, exact = false) {
  const ok = await page.evaluate(
    (t, ex) => {
      const els = [...document.querySelectorAll("button")];
      const el = ex
        ? els.find((b) => b.textContent.trim() === t)
        : (els.find((b) => b.textContent.trim() === t) ??
          els.find((b) => b.textContent.includes(t)));
      if (!el) return false;
      el.scrollIntoView({ block: "center", behavior: "instant" });
      el.click();
      return true;
    },
    text,
    exact,
  );
  if (!ok) console.warn(`⚠ 버튼 못 찾음: ${text}`);
  await sleep(450);
  return ok;
}
async function setVal(selector, value, last = false) {
  await page.evaluate(
    (sel, v, useLast) => {
      const els = [...document.querySelectorAll(sel)];
      const el = useLast ? els.at(-1) : els[0];
      if (!el) return;
      const proto =
        el.tagName === "TEXTAREA"
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    selector,
    value,
    last,
  );
  await sleep(150);
}
async function modalBtn(text) {
  await page.evaluate((t) => {
    const modal = document.querySelector('[role="alertdialog"]');
    [...(modal?.querySelectorAll("button") ?? [])]
      .find((b) => b.textContent.trim() === t)
      ?.click();
  }, text);
  await sleep(500);
}

// ── 1. 면접 직접 확정 (+화상 링크) ───────────────────────────────
await page.goto(`${BASE}/hr/applicants/app-05`, { waitUntil: "networkidle0" });
await sleep(900);
await clickBtn("일정 제안");
await sleep(400);
let t = await bodyText();
check("일정 패널 — 제안/직접 확정 모드 토글", t.includes("직접 확정 (조율 완료)"));
await clickBtn("직접 확정 (조율 완료)");
await sleep(300);
// 화상 면접 선택 → 링크 입력칸 노출
await page.evaluate(() => {
  const sel = [...document.querySelectorAll("select")].find((x) =>
    [...x.options].some((o) => o.value.includes("화상")),
  );
  if (sel) {
    sel.value = "화상 면접 (Google Meet)";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }
});
await sleep(300);
const hasUrlInput = await page.evaluate(() =>
  Boolean(document.querySelector('input[placeholder^="화상 회의 링크"]')),
);
check("화상 선택 시 meetingUrl 입력칸 노출", hasUrlInput);
await setVal('input[placeholder^="화상 회의 링크"]', "https://meet.google.com/e2e-test");
// 일시 입력 후 바로 확정
const future = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
await page.evaluate((d) => {
  const panel = [...document.querySelectorAll("section")].find((x) =>
    (x.querySelector("header")?.textContent ?? "").includes("면접 일정 조율"),
  );
  const dateInp = panel?.querySelector('input[type="date"]');
  if (dateInp) {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(dateInp, d);
    dateInp.dispatchEvent(new Event("input", { bubbles: true }));
  }
}, future);
await sleep(200);
await clickBtn("바로 확정");
await sleep(800);
t = await bodyText();
check("직접 확정 → 면접 생성 + 활동 로그", t.includes("직접 확정"));

// ── 2. 면접 인라인 수정 ──────────────────────────────────────────
await page.evaluate(() => {
  document.querySelector('button[title^="일정 변경"]')?.click();
});
await sleep(400);
t = await bodyText();
check("면접 수정 폼 오픈 (변경 통지 안내)", t.includes("변경 통지가 나갑니다"));
// 시간 변경 후 저장
await page.evaluate(() => {
  const form = [...document.querySelectorAll('input[type="time"]')];
  const inp = form[0];
  if (inp) {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(inp, "15:30");
    inp.dispatchEvent(new Event("input", { bubbles: true }));
  }
});
await sleep(200);
await clickBtn("변경 저장");
await sleep(700);
t = await bodyText();
check("면접 수정 저장 → 활동 로그(일정 변경)", t.includes("일정 변경") && t.includes("15:30"));

// ── 3. 후보 정보 수정 ────────────────────────────────────────────
await clickBtn("정보 수정");
await sleep(400);
t = await bodyText();
check("후보 수정 모달 (감사 로그 안내)", t.includes("지원자 정보 수정") && t.includes("감사 로그에 남습니다"));
// 전화번호 수정
await page.evaluate(() => {
  const inp = [...document.querySelectorAll('input[type="tel"]')].at(-1);
  if (inp) {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(inp, "010-9999-0000");
    inp.dispatchEvent(new Event("input", { bubbles: true }));
  }
});
await sleep(200);
await clickBtn("저장", true);
await sleep(700);
t = await bodyText();
check("후보 수정 반영 + 활동 로그", t.includes("010-9999-0000") && t.includes("지원자 정보 수정"));

// ── 4. 평가 수정·삭제 ────────────────────────────────────────────
await page.goto(`${BASE}/hr/applicants/app-03`, { waitUntil: "networkidle0" });
await sleep(900);
// 평가 카드의 수정 버튼
await page.evaluate(() => {
  [...document.querySelectorAll('button[title="평가 수정"]')][0]?.click();
});
await sleep(400);
t = await bodyText();
check("평가 인라인 수정 폼", t.includes("수정 사실과 시각이 카드에 표시됩니다"));
await clickBtn("수정 저장");
await sleep(600);
t = await bodyText();
check("평가 수정 → (수정됨) 표시", t.includes("(수정됨)"));

// ── 5. 코멘트 수정 ───────────────────────────────────────────────
const hasCommentEdit = await page.evaluate(() => {
  const group = [...document.querySelectorAll(".group")].find((g) =>
    g.querySelector("button") &&
    [...g.querySelectorAll("button")].some((b) => b.textContent.trim() === "수정") &&
    g.textContent.includes("일 전"),
  );
  return Boolean(group);
});
check("코멘트 수정·삭제 버튼 존재", hasCommentEdit);

// ── 6. 템플릿 CRUD ───────────────────────────────────────────────
await page.goto(`${BASE}/hr/settings`, { waitUntil: "networkidle0" });
await sleep(900);
await clickBtn("+ 새 템플릿");
await sleep(400);
t = await bodyText();
check("템플릿 추가 폼 (변수 안내)", t.includes("사용 가능 변수"));
await setVal('input[placeholder^="템플릿 이름"]', "필기 합격 안내 (E2E)");
await setVal('input[placeholder^="제목 (예:"]', "[아르코에듀] 필기 전형 합격 안내");
await setVal("textarea[placeholder^='본문']", "{{이름}}님, 필기 전형에 합격하셨습니다.");
await clickBtn("템플릿 추가", true);
await sleep(700);
t = await bodyText();
check("템플릿 추가 → 목록 반영", t.includes("필기 합격 안내 (E2E)"));
// 삭제 (details를 열고 hover-전용 버튼 클릭)
await page.evaluate(() => {
  const det = [...document.querySelectorAll("details")].find((d) =>
    d.textContent.includes("필기 합격 안내 (E2E)"),
  );
  if (det) det.open = true;
  [...(det?.querySelectorAll("button") ?? [])]
    .find((b) => b.textContent.trim() === "삭제")
    ?.click();
});
await sleep(700);
await modalBtn("삭제");
await sleep(800);
// 토스트 문구에 이름이 들어가므로 목록(details)에서 사라졌는지로 확인
const stillListed = await page.evaluate(() =>
  [...document.querySelectorAll("details")].some((d) =>
    d.textContent.includes("필기 합격 안내 (E2E)"),
  ),
);
check("템플릿 삭제 동작", !stillListed);

// ── 7. 발송 문안에 새 변수({{일시}}/{{장소}}) 치환 ────────────────
await page.goto(`${BASE}/hr/applicants/app-05`, { waitUntil: "networkidle0" });
await sleep(900);
// 면접안내 템플릿 선택 (tpl-03: {{일시}}/{{장소}} 포함)
await page.evaluate(() => {
  const sel = [...document.querySelectorAll("select")].find((x) =>
    [...x.options].some((o) => o.textContent.includes("면접 일정 안내")),
  );
  if (sel) {
    const opt = [...sel.options].find((o) => o.textContent.includes("면접 일정 안내"));
    sel.value = opt.value;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }
});
await sleep(400);
const bodyVal = await page.evaluate(
  () => [...document.querySelectorAll('textarea[placeholder="본문"]')].at(-1)?.value ?? "",
);
check(
  "발송 문안 — 면접 일시·장소 자동 치환",
  !bodyVal.includes("{{일시}}") && /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(bodyVal),
);

await browser.close();
console.log(fail === 0 ? "\n🎉 ALL PASS" : `\n💥 ${fail} FAILED`);
process.exit(fail ? 1 : 0);
