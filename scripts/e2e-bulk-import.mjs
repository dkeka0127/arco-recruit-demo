// 엑셀(CSV) 대량 지원자 등록 E2E — 양식·업로드·검증 미리보기·일괄 등록·요약 감사.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = "http://localhost:3005";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args:["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({width:1440,height:900});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let fail=0; const check=(n,ok)=>{console.log(`${ok?"✅":"❌"} ${n}`); if(!ok)fail++;};
const txt=()=>p.evaluate(()=>document.body.innerText);
const store=()=>p.evaluate(()=>JSON.parse(localStorage.getItem("talent-os-hr-state")||"{}"));
const clickBtn=(t)=>p.evaluate((x)=>{
  const exact=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()===x);
  (exact ?? [...document.querySelectorAll("button")].find(b=>b.textContent.trim().includes(x)))?.click();
},t);

// 임시 CSV — 정상 2(공고 제목 매칭 1 + 기본 공고 폴백 1), 오류 2(이메일 형식·파일 내 중복)
const csvPath = path.join(os.tmpdir(), "bulk-import-e2e.csv");
fs.writeFileSync(csvPath, [
  '"이름","이메일","전화","유입경로","태그(;구분)","공고(제목 또는 ID)"',
  '"대량하나","bulk1@test.com","010-1111-2222","채용행사","백엔드;3년차","금융 연구원"',
  '"대량둘","bulk2@test.com","","헤드헌터 추천","",""',
  '"대량셋","not-an-email","","","",""',
  '"대량하나","bulk1@test.com","","","","금융 연구원"',
].join("\r\n"), "utf-8");

// ── 1. 드로어 열기 + 양식 버튼 ──────────────────────────────────
await p.goto(`${BASE}/hr/applicants`,{waitUntil:"networkidle0"}); await sleep(900);
let t=await txt();
check("툴바에 '엑셀 업로드' 버튼", t.includes("엑셀 업로드"));
await clickBtn("엑셀 업로드"); await sleep(600);
t=await txt();
check("드로어 — 양식 다운로드·CSV 선택", t.includes("양식 다운로드") && t.includes("CSV 선택"));

// ── 2. 기본 공고 선택 + 파일 업로드 → 검증 미리보기 ─────────────
await p.evaluate(()=>{
  const sel=document.querySelector("aside select");
  const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set;
  set.call(sel,"cloud-engineer");
  sel.dispatchEvent(new Event("change",{bubbles:true}));
});
await sleep(300);
const fileInput=await p.$('aside input[type="file"]');
await fileInput.uploadFile(csvPath);
await sleep(800);
t=await txt();
check("검증 결과 — 등록 가능 2건", t.includes("등록 가능 2"));
check("검증 결과 — 제외 2건 (이메일 오류·파일 내 중복)", t.includes("제외 2") && t.includes("이메일 형식 오류") && t.includes("파일 내 중복"));
check("공고 매칭 — 제목 부분 일치", t.includes("금융 연구원(회계/세무 부문)"));

// ── 3. 일괄 등록 실행 ───────────────────────────────────────────
await clickBtn("2명 등록하기"); await sleep(1500);
t=await txt();
check("등록 완료 토스트", t.includes("2명이 등록되었습니다"));
const s=await store();
const c1=(s.candidates||[]).find(c=>c.email==="bulk1@test.com");
const c2=(s.candidates||[]).find(c=>c.email==="bulk2@test.com");
check("후보 2명 생성 (공고 매칭·폴백)", !!c1 && !!c2 &&
  (s.applications||[]).some(a=>a.candidateId===c1.id && a.jobId==="finance-researcher") &&
  (s.applications||[]).some(a=>a.candidateId===c2.id && a.jobId==="cloud-engineer"));
check("접수확인 메일 미발송", (s.applications||[]).filter(a=>[c1?.id,c2?.id].includes(a.candidateId)).every(a=>a.messages.length===0));
const bulkAudits=(s.auditLog||[]).filter(l=>l.summary.includes("엑셀 대량 등록"));
check("감사 로그 — 요약 1건 (건별 아님)", bulkAudits.length===1 && bulkAudits[0].summary.includes("2명") && bulkAudits[0].sensitive===true);

// ── 4. 같은 파일 재업로드 → 기존 접수 안내 ──────────────────────
await clickBtn("엑셀 업로드"); await sleep(500);
await p.evaluate(()=>{
  const sel=document.querySelector("aside select");
  const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set;
  set.call(sel,"cloud-engineer");
  sel.dispatchEvent(new Event("change",{bubbles:true}));
});
const fileInput2=await p.$('aside input[type="file"]');
await fileInput2.uploadFile(csvPath);
await sleep(800);
t=await txt();
check("재업로드 — '기존 접수 있음' 표시", t.includes("기존 접수 있음"));

fs.unlinkSync(csvPath);
await b.close();
console.log(fail===0?"\n🎉 bulk-import E2E 전부 통과":`\n💥 ${fail}건 실패`);
process.exit(fail===0?0:1);
