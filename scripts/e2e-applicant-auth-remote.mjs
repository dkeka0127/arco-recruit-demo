// 지원자 인증 — 운영(Supabase) 모드 E2E.
// 회사 Supabase Auth에 실제 계정을 만들었다가 끝나면 admin API로 삭제한다.
// 실행: .env.local이 있는 상태로 `npx next dev -p 3006` 후 이 스크립트.
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const BASE = "http://localhost:3006";

// .env.local에서 정리(cleanup)용 키 로드
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf-8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_SERVICE) {
  console.log("⏭ .env.local에 Supabase 키가 없어 원격 E2E를 건너뜁니다.");
  process.exit(0);
}
const adminHeaders = { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` };

const ts = Date.now().toString(36);
const USERNAME = `e2erm${ts}`;
const EMAIL = `e2e-remote-${ts}@test.arco.dev`;
const PW = "remote1234pw";
const NEWPW = "remote5678pw";
const PHONE = "01099998888";

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
  await p.evaluate((s)=>{
    const inp=document.querySelector(s);
    const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;
    set.call(inp,""); inp.dispatchEvent(new Event("input",{bubbles:true}));
  },sel);
  await el.click(); await el.type(v);
};
async function passVerification(name, birth, phone){
  await type('input[placeholder="홍길동"]', name);
  await p.$eval('input[type="date"]',(el,v)=>{
    const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;
    set.call(el,v); el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true}));
  }, birth);
  await type('input[placeholder="01012345678"]', phone);
  await clickBtn("인증번호 발송"); await sleep(400);
  const code=await p.evaluate(()=>document.body.innerText.match(/인증번호:\s*(\d{6})/)?.[1] ?? "");
  if(!code) return false;
  await type('input[placeholder="인증번호 6자리"]', code);
  await clickBtn("확인"); await sleep(600);
  return true;
}
const agreeAll=()=>p.evaluate(()=>{
  const label=[...document.querySelectorAll("label")].find(l=>l.textContent.includes("전체 약관에 모두 동의"));
  label?.querySelector("input")?.click();
});

async function cleanup(){
  try{
    const res=await fetch(`${SB_URL}/auth/v1/admin/users?per_page=1000`,{headers:adminHeaders});
    const data=await res.json();
    const user=(data.users??[]).find((u)=>u.email===EMAIL);
    if(user){
      await fetch(`${SB_URL}/auth/v1/admin/users/${user.id}`,{method:"DELETE",headers:adminHeaders});
      console.log(`🧹 테스트 계정 삭제됨: ${EMAIL}`);
    } else console.log("🧹 삭제할 테스트 계정 없음");
  }catch(e){ console.log("⚠ cleanup 실패:", e.message); }
}

try {
  // ── 1. 가입 (원격) ────────────────────────────────────────────
  await p.goto(`${BASE}/signup`,{waitUntil:"networkidle0"}); await sleep(900);
  await agreeAll(); await sleep(200);
  await clickBtn("동의하고 다음 단계로"); await sleep(500);
  const v=await passVerification("김원격", "1995-11-02", PHONE);
  check("본인인증", v);
  await clickBtn("다음 단계로"); await sleep(400);
  await type('input[placeholder="아이디"]', USERNAME);
  await clickBtn("중복 확인"); await sleep(1500); // 원격 조회
  check("중복 확인 (서버 조회)", (await txt()).includes("사용 가능한 아이디"));
  const pws=await p.$$('input[type="password"]');
  await pws[0].type(PW); await pws[1].type(PW);
  await type('input[placeholder="name@example.com"]', EMAIL);
  await clickBtn("가입 완료"); await sleep(3500); // createUser + signIn + redirect
  check("가입 → 자동 로그인 → /my", p.url().includes("/my"));
  let t=await txt();
  check("/my — 원격 세션 배너", t.includes("계정으로 로그인됨") && t.includes(EMAIL));

  // Supabase Auth에 실제 생성됐는지 admin으로 확인
  const res=await fetch(`${SB_URL}/auth/v1/admin/users?per_page=1000`,{headers:adminHeaders});
  const data=await res.json();
  const created=(data.users??[]).find((u)=>u.email===EMAIL);
  check("Supabase Auth 사용자 생성 (role=applicant)", created?.user_metadata?.role==="applicant" && created?.user_metadata?.username===USERNAME);

  // ── 2. 로그아웃 → 아이디 로그인 (서버 대행) ──────────────────
  await clickBtn("로그아웃"); await sleep(1200);
  t=await txt();
  check("로그아웃 반영", t.includes("이 브라우저에서 제출한 지원만"));
  await p.goto(`${BASE}/login`,{waitUntil:"networkidle0"}); await sleep(700);
  await type('input[placeholder="아이디"]', USERNAME);
  await type('input[placeholder="비밀번호"]', "wrongpw123");
  await clickBtn("로그인 ▶"); await sleep(1500);
  check("틀린 비밀번호 거부", (await txt()).includes("비밀번호가 일치하지 않습니다"));
  await type('input[placeholder="비밀번호"]', PW);
  await clickBtn("로그인 ▶"); await sleep(2500);
  check("아이디 로그인 성공 → /my", p.url().includes("/my"));

  // ── 3. 아이디 찾기 (서버) ─────────────────────────────────────
  await p.goto(`${BASE}/find-account`,{waitUntil:"networkidle0"}); await sleep(700);
  const v3=await passVerification("김원격", "1995-11-02", PHONE);
  await sleep(1200);
  t=await txt();
  check("아이디 찾기 — 마스킹 표시", v3 && t.includes("회원님의 아이디는") && t.includes(USERNAME.slice(0,3)) && t.includes("*"));

  // ── 4. 비밀번호 재설정 (admin updateUser) ─────────────────────
  await clickBtn("비밀번호 찾기"); await sleep(400);
  await type('input[placeholder="가입 아이디"]', USERNAME);
  const v4=await passVerification("김원격", "1995-11-02", PHONE);
  check("비번 찾기 — 본인인증", v4);
  const npws=await p.$$('input[type="password"]');
  await npws[0].type(NEWPW); await npws[1].type(NEWPW);
  await clickBtn("비밀번호 변경"); await sleep(2000);
  check("비밀번호 변경 완료", (await txt()).includes("비밀번호가 변경되었습니다"));
  // 여전히 로그인 상태(2단계) — 로그아웃 후 새 비번으로 재로그인 검증
  await p.goto(`${BASE}/login`,{waitUntil:"networkidle0"}); await sleep(900);
  await clickBtn("로그아웃"); await sleep(1500);
  await type('input[placeholder="아이디"]', USERNAME);
  await type('input[placeholder="비밀번호"]', NEWPW);
  await clickBtn("로그인 ▶"); await sleep(2500);
  check("새 비밀번호 로그인", p.url().includes("/my"));
} finally {
  await cleanup();
  await b.close();
}
console.log(fail===0?"\n🎉 applicant-auth REMOTE E2E 전부 통과":`\n💥 ${fail}건 실패`);
process.exit(fail===0?0:1);
