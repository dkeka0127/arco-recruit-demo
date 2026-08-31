// 필기시험 "문항 작성" E2E — 시험 라이브러리(검색·직군 필터·복제),
// 빌더(생성·유효성·AI 초안·미리보기), 보드 일괄 배정, 배정 추천 그룹.
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
    // 정확 일치 우선 → 부분 일치 ("초안 생성" vs "AI 문항 초안 생성" 오매칭 방지)
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

/** 시험 라이브러리 패널만의 텍스트 (아래 응시 현황과 분리해 검증) */
async function libraryText() {
  return page.evaluate(() => {
    const sec = [...document.querySelectorAll("section")].find((x) =>
      (x.querySelector("header")?.textContent ?? "").includes("시험 라이브러리"),
    );
    return sec?.innerText ?? "";
  });
}
async function typeInto(selector, value) {
  await page.evaluate(
    (sel, v) => {
      const el = document.querySelector(sel);
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
  );
  await sleep(150);
}

// ── 1. 라이브러리: 직군 필터 칩 + 검색 ──────────────────────────
await page.goto(`${BASE}/hr/exams`, { waitUntil: "networkidle0" });
await sleep(900);
let t = await bodyText();
check(
  "라이브러리 — 직군 칩·카테고리 뱃지·사용횟수",
  t.includes("시험 라이브러리") && t.includes("공통 인적성") && t.includes("회 사용"),
);
await clickBtn("공통 인적성");
await sleep(400);
let lib = await libraryText();
check(
  "직군 필터 동작 (개발 시험 숨김)",
  lib.includes("공통 인적성 검사") && !lib.includes("개발 직무 필기시험"),
);
await clickBtn("전체");
await typeInto('input[placeholder="시험 제목·설명·분류 검색"]', "개발");
await sleep(400);
lib = await libraryText();
check(
  "검색 동작",
  lib.includes("개발 직무 필기시험") && !lib.includes("공통 인적성 검사"),
);
await typeInto('input[placeholder="시험 제목·설명·분류 검색"]', "");

// ── 2. 새 시험 만들기 + 유효성 검사 ─────────────────────────────
await clickBtn("새 시험 만들기");
await sleep(500);
// 주의: 검색창 placeholder도 "시험 제목"으로 시작 → "(예:" 포함으로 빌더 입력만 선택
await typeInto('input[placeholder^="시험 제목 (예:"]', "영어 연구원 필기시험");
await typeInto('input[placeholder^="직군/분류 태그"]', "영어연구");
await typeInto('textarea[placeholder="문항 내용"]', "다음 중 관계대명사 용법이 옳은 문장은?");
// 보기만 넣고 정답을 비워 유효성 에러 유도
await typeInto('textarea[placeholder^="보기 (한 줄에 하나)"]', "He is the man who I met.\nHe is the man whom met me.");
await clickBtn("시험 등록");
await sleep(500);
t = await bodyText();
check("유효성 검사 — 정답 누락 인라인 에러", t.includes("정답 보기 번호를 입력하세요"));
// 정답 입력 후 저장
await typeInto('input[placeholder^="정답 보기 번호"]', "1");
await clickBtn("시험 등록");
await sleep(700);
lib = await libraryText();
check(
  "시험 저장 → 라이브러리에 영어연구 태그로 표시",
  lib.includes("영어 연구원 필기시험") && lib.includes("영어연구"),
);

// ── 3. 복제 (가져와서 수정) ──────────────────────────────────────
await page.evaluate(() => {
  // "개발 직무 필기시험" 카드의 복제 버튼 클릭
  const card = [...document.querySelectorAll("div.rounded-xl")].find((c) =>
    c.textContent.includes("개발 직무 필기시험"),
  );
  [...(card?.querySelectorAll("button") ?? [])]
    .find((b) => b.textContent.includes("복제"))
    ?.click();
});
await sleep(700);
t = await bodyText();
check(
  "복제 → (복사본) 생성 + 편집 화면 자동 오픈",
  t.includes("개발 직무 필기시험 (복사본)"),
);
await clickBtn("닫기");

// ── 4. AI 문항 초안 ──────────────────────────────────────────────
await clickBtn("새 시험 만들기");
await sleep(400);
await clickBtn("AI 문항 초안 생성");
await sleep(300);
await typeInto('input[placeholder^="예: 자료구조"]', "마케팅 지표");
await clickBtn("초안 생성");
await sleep(800);
// 생성 문항은 textarea value에 담기므로 innerText가 아닌 value로 확인
const aiDrafts = await page.evaluate(() =>
  [...document.querySelectorAll('textarea[placeholder="문항 내용"]')]
    .map((x) => x.value)
    .filter((v) => v.includes("마케팅 지표") && v.includes("AI 초안")).length,
);
check("AI 초안 → 문항 추가 + 검토 안내", aiDrafts >= 3);

// ── 5. 미리보기 (정답 표시 토글) ────────────────────────────────
await clickBtn("지원자 화면 미리보기");
await sleep(500);
t = await bodyText();
check("미리보기 모달 — 지원자 화면 재현", t.includes("지원자에게 이렇게 보입니다"));
await page.evaluate(() => {
  const label = [...document.querySelectorAll("label")].find((l) =>
    l.textContent.includes("정답 표시"),
  );
  label?.querySelector("input")?.click();
});
await sleep(400);
t = await bodyText();
check("정답 표시 토글 → 정답 강조", t.includes("정답"));
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "미리보기 닫기")?.click();
});
await sleep(300);
await clickBtn("닫기");

// ── 6. 보드 일괄 배정 ────────────────────────────────────────────
await page.goto(`${BASE}/hr/applicants?stage=screening`, { waitUntil: "networkidle0" });
await sleep(900);
// 리스트에서 2명 선택
await page.evaluate(() => {
  const boxes = [...document.querySelectorAll('tbody input[type="checkbox"], table input[type="checkbox"]')];
  boxes.slice(1, 3).forEach((b) => b.click()); // 0번은 전체선택일 수 있어 스킵
});
await sleep(400);
t = await bodyText();
const selMatch = t.match(/(\d+)명\s*선택됨/);
check("리스트에서 지원자 선택", Boolean(selMatch && Number(selMatch[1]) >= 1));
await clickBtn("필기시험 배정");
await sleep(400);
t = await bodyText();
check("일괄 배정 패널 — 시험·기한 선택", t.includes("응시 기한") && t.includes("명에게 발급"));
await clickBtn("명에게 발급");
await sleep(500);
// confirmAction 모달에서 확정
await page.evaluate(() => {
  const modal = document.querySelector('[role="alertdialog"]');
  [...(modal?.querySelectorAll("button") ?? [])]
    .find((b) => b.textContent.trim() === "일괄 배정")
    ?.click();
});
await sleep(800);
t = await bodyText();
check("일괄 발급 완료 토스트", /명에게 응시 링크를 발급|발급 완료/.test(t));

// 응시 현황에 새 세션 존재 확인
await page.goto(`${BASE}/hr/exams`, { waitUntil: "networkidle0" });
await sleep(800);
t = await bodyText();
const waitMatch = t.match(/응시 대기[\s\n]*(\d+)/);
check("응시 현황 — 일괄 발급 세션 반영", Boolean(waitMatch && Number(waitMatch[1]) >= 2));

// ── 7. 지원자 상세 — 직군 추천 그룹 ─────────────────────────────
await page.goto(`${BASE}/hr/applicants/app-03`, { waitUntil: "networkidle0" });
await sleep(800);
await clickBtn("시험 배정");
await sleep(400);
const hasRecommend = await page.evaluate(() =>
  [...document.querySelectorAll("optgroup")].some((g) =>
    (g.label ?? "").includes("추천"),
  ),
);
check("배정 선택기 — 공고 직군 추천 그룹", hasRecommend);

await browser.close();
console.log(fail === 0 ? "\n🎉 ALL PASS" : `\n💥 ${fail} FAILED`);
process.exit(fail ? 1 : 0);
