// 지원자 회원 인증 E2E — 가입(약관→본인인증→정보입력), 로그인/로그아웃,
// 아이디 저장, 아이디 찾기(마스킹), 비밀번호 재설정, /my 계정 연동.
import puppeteer from "puppeteer-core";
const BASE = "http://localhost:3005";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args:["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({width:1440,height:900});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let fail=0; const check=(n,ok)=>{console.log(`${ok?"✅":"❌"} ${n}`); if(!ok)fail++;};
const txt=()=>p.evaluate(()=>document.body.innerText);
const clickBtn=(t)=>p.evaluate((x)=>{
  const exact=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()===x);
  (exact ?? [...document.querySelectorAll("button")].find(b=>b.textContent.trim().includes(x)))?.click();
},t);
const type=async(sel,v)=>{
  const el=await p.$(sel);
  // React 제어 입력 초기화 — triple-click 선택이 headless에서 불안정해 native setter로 비운다
  await p.evaluate((s)=>{
    const inp=document.querySelector(s);
    const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;
    set.call(inp,""); inp.dispatchEvent(new Event("input",{bubbles:true}));
  },sel);
  await el.click(); await el.type(v);
};
/** 화면에 표시된 데모 인증번호 추출 → 입력 → 확인 */
async function passVerification(name, birth, phone){
  await type('input[placeholder="홍길동"]', name);
  await p.$eval('input[type="date"]',(el,v)=>{
    const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;
    set.call(el,v); el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true}));
  }, birth);
  await type('input[placeholder="01012345678"]', phone);
  await clickBtn("인증번호 발송"); await sleep(400);
  const code=await p.evaluate(()=>{
    const m=document.body.innerText.match(/인증번호:\s*(\d{6})/);
    return m?.[1] ?? "";
  });
  if(!code) return false;
  await type('input[placeholder="인증번호 6자리"]', code);
  await clickBtn("확인"); await sleep(500);
  return true;
}

const USERNAME="e2etester1"; const PW="test1234pw"; const NEWPW="newpw5678a";
const PHONE="01055557777"; const EMAIL="e2e-auth@test.com";

// ── 1. 회원가입 — 약관 ──────────────────────────────────────────
await p.goto(`${BASE}/signup`,{waitUntil:"networkidle0"}); await sleep(800);
let t=await txt();
check("1단계 — 약관(레거시 수집항목 표)", t.includes("약관 동의") && t.includes("아이디, 성명, 생년월일, 휴대폰 번호"));
const agreeAll=()=>p.evaluate(()=>{
  const label=[...document.querySelectorAll("label")].find(l=>l.textContent.includes("전체 약관에 모두 동의"));
  label?.querySelector("input")?.click();
});
await agreeAll(); await sleep(200);
await clickBtn("동의하고 다음 단계로"); await sleep(500);

// ── 2. 본인인증 (데모 인증번호) ─────────────────────────────────
t=await txt();
check("2단계 — 본인인증 진입", t.includes("본인 명의 휴대폰으로 인증합니다"));
const verified=await passVerification("김이이", "1997-05-14", PHONE);
check("데모 인증번호 → 인증 완료", verified && (await txt()).includes("본인인증 완료"));
await clickBtn("다음 단계로"); await sleep(400);

// ── 3. 정보 입력 → 가입 ─────────────────────────────────────────
t=await txt();
check("3단계 — 인증 정보 고정 표시", t.includes("김이이") && t.includes("수정할 수 없습니다"));
await type('input[placeholder="아이디"]', USERNAME);
await clickBtn("중복 확인"); await sleep(300);
check("아이디 중복 확인 통과", (await txt()).includes("사용 가능한 아이디"));
const pwInputs=await p.$$('input[type="password"]');
await pwInputs[0].type(PW); await pwInputs[1].type(PW);
await type('input[placeholder="name@example.com"]', EMAIL);
await clickBtn("가입 완료"); await sleep(1200);
check("가입 → 자동 로그인 → /my 이동", p.url().includes("/my"));
t=await txt();
check("/my — 계정 로그인 배너", t.includes("계정으로 로그인됨") && t.includes(EMAIL));
check("/my — 인증 이름 표시", t.includes("김이이"));

// ── 4. 로그아웃 → 비로그인 안내 ─────────────────────────────────
await clickBtn("로그아웃"); await sleep(600);
t=await txt();
check("로그아웃 — 비로그인 안내(이 브라우저 제출만)", t.includes("이 브라우저에서 제출한 지원만"));

// ── 5. 로그인 (아이디 저장) — 오답/정답 ─────────────────────────
await p.goto(`${BASE}/login`,{waitUntil:"networkidle0"}); await sleep(700);
await type('input[placeholder="아이디"]', USERNAME);
await type('input[placeholder="비밀번호"]', "wrongpass1");
await clickBtn("로그인 ▶"); await sleep(500);
check("틀린 비밀번호 — 에러 표시", (await txt()).includes("비밀번호가 일치하지 않습니다"));
await type('input[placeholder="비밀번호"]', PW);
await p.evaluate(()=>{
  const cb=[...document.querySelectorAll('input[type="checkbox"]')][0];
  if(cb && !cb.checked) cb.click();
});
await clickBtn("로그인 ▶"); await sleep(1200);
check("로그인 성공 → /my", p.url().includes("/my"));
// 아이디 저장 확인 — 로그아웃 후 로그인 페이지 재방문
await clickBtn("로그아웃"); await sleep(500);
await p.goto(`${BASE}/login`,{waitUntil:"networkidle0"}); await sleep(900);
const savedId=await p.$eval('input[placeholder="아이디"]',(el)=>el.value);
check("아이디 저장 복원", savedId===USERNAME);

// ── 6. 아이디 찾기 — 마스킹 표시 ────────────────────────────────
await p.goto(`${BASE}/find-account`,{waitUntil:"networkidle0"}); await sleep(700);
const ok6=await passVerification("김이이", "1997-05-14", PHONE);
t=await txt();
check("아이디 찾기 — 마스킹 아이디 표시", ok6 && t.includes("회원님의 아이디는") && t.includes("e2e") && t.includes("*"));

// ── 7. 비밀번호 재설정 → 새 비번 로그인 ─────────────────────────
await clickBtn("비밀번호 찾기"); await sleep(400);
await type('input[placeholder="가입 아이디"]', USERNAME);
const ok7=await passVerification("김이이", "1997-05-14", PHONE);
check("비번 찾기 — 본인인증", ok7);
const newPwInputs=await p.$$('input[type="password"]');
await newPwInputs[0].type(NEWPW); await newPwInputs[1].type(NEWPW);
await clickBtn("비밀번호 변경"); await sleep(600);
check("비밀번호 변경 완료", (await txt()).includes("비밀번호가 변경되었습니다"));
await p.goto(`${BASE}/login`,{waitUntil:"networkidle0"}); await sleep(700);
await type('input[placeholder="아이디"]', USERNAME);
await type('input[placeholder="비밀번호"]', NEWPW);
await clickBtn("로그인 ▶"); await sleep(1000);
check("새 비밀번호로 로그인", p.url().includes("/my"));

// ── 8. 로그인 게이트(/apply/general) — 로그인 상태 패널 ─────────
await p.goto(`${BASE}/apply/general`,{waitUntil:"networkidle0"}); await sleep(900);
t=await txt();
check("지원 게이트 — 로그인 상태 + 작성 시작", t.includes("로그인되어 있습니다") && t.includes("지원서 작성 시작"));

// ── 9. 중복 가입 방지 — 같은 본인인증(CI) 재가입 차단 ───────────
await p.goto(`${BASE}/signup`,{waitUntil:"networkidle0"}); await sleep(700);
await agreeAll(); await sleep(200);
await clickBtn("동의하고 다음 단계로"); await sleep(400);
await passVerification("김이이", "1997-05-14", PHONE);
await clickBtn("다음 단계로"); await sleep(400);
await type('input[placeholder="아이디"]', "otherid99");
await clickBtn("중복 확인"); await sleep(200);
const pw9=await p.$$('input[type="password"]');
await pw9[0].type(PW); await pw9[1].type(PW);
await type('input[placeholder="name@example.com"]', "other@test.com");
await clickBtn("가입 완료"); await sleep(600);
check("같은 본인인증 재가입 차단", (await txt()).includes("이미 본인인증으로 가입된 계정"));

await b.close();
console.log(fail===0?"\n🎉 applicant-auth E2E 전부 통과":`\n💥 ${fail}건 실패`);
process.exit(fail===0?0:1);
