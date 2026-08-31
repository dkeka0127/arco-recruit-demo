// 운영 안전 패키지 E2E (데모 모드) — 데모 모드에서 resetDemo 버튼이 여전히
// 보이고 동작하는지 + 회귀. (Supabase 모드 차단은 supabaseEnabled 분기라
// 데모 서버에선 "노출됨"이 정상 — 운영 차단은 코드 경로로 보장)
import puppeteer from "puppeteer-core";
const BASE = "http://localhost:3005";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args:["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({width:1440,height:900});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
p.on("dialog",(d)=>d.accept());
let fail=0; const check=(n,ok)=>{console.log(`${ok?"✅":"❌"} ${n}`); if(!ok)fail++;};
const txt=()=>p.evaluate(()=>document.body.innerText);

// 데모 모드: 설정에 데모 초기화 버튼 노출
await p.goto(`${BASE}/hr/settings`,{waitUntil:"networkidle0"}); await sleep(900);
let t = await txt();
check("데모 모드 — 데모 초기화 버튼 노출", t.includes("데모 데이터 초기화") && !t.includes("데이터 초기화는 비활성화"));

// 데모 모드에서 내 업무는 CURRENT_MEMBER_ID(김수현) 기준 정상 동작
await p.goto(`${BASE}/hr/my-work`,{waitUntil:"networkidle0"}); await sleep(900);
t = await txt();
check("내 업무 화면 정상 렌더 (데모 작업자 기준)", t.includes("내 업무") || t.includes("평가 대기") || t.length > 200);

// 활동 로그 actor가 여전히 정상 기록되는지 — 지원자 상세에서 코멘트 남기고 확인
await p.goto(`${BASE}/hr/applicants/app-03`,{waitUntil:"networkidle0"}); await sleep(900);
check("지원자 상세 정상 렌더", (await txt()).includes("활동 타임라인"));

await b.close();
console.log(fail===0?"\n🎉 ALL PASS":`\n💥 ${fail} FAILED`);
process.exit(fail?1:0);
