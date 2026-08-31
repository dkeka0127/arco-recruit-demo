// ════════════════════════════════════════════════════════════════
//  Proxy (구 middleware) — 실오픈 전 접근 제한.
//  개발 중 배포본(프로덕션·프리뷰)을 사내 공인 IP로만 접근 가능하게 잠근다.
//  · 로컬 개발(next dev)은 강제하지 않음 → 개발·E2E 정상
//  · 허용목록/비활성은 src/lib/site-allowlist.ts (env SITE_IP_ALLOWLIST로 조정)
//  실오픈 시: SITE_IP_ALLOWLIST=off 로 두거나 이 파일을 제거하면 전체 공개.
// ════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clientIpFrom, isIpAllowed } from "@/lib/site-allowlist";

export function proxy(request: NextRequest) {
  // 로컬 개발 서버는 통과 (x-forwarded-for 없음 → 오탐 방지)
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const ip = clientIpFrom(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );
  if (isIpAllowed(ip)) return NextResponse.next();

  return new NextResponse(BLOCK_HTML, {
    status: 403,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export const config = {
  // 정적 자산·이미지 최적화·헬스체크는 제외 (차단 페이지는 자체 완결 HTML)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};

const BLOCK_HTML = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>접근 제한 — 아르코 채용</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#0e1b24;color:#f5f9fc;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Pretendard,sans-serif;
    -webkit-font-smoothing:antialiased;text-align:center;padding:24px}
  .box{max-width:440px}
  .badge{font-size:.72rem;letter-spacing:.2em;color:#52b3d8;font-weight:600}
  h1{font-size:1.6rem;font-weight:800;margin:14px 0 0;letter-spacing:-.02em}
  p{color:rgba(245,249,252,.7);font-size:.95rem;line-height:1.6;margin-top:12px}
  code{font-family:ui-monospace,monospace;font-size:.8rem;color:#52b3d8}
</style></head>
<body><div class="box">
  <p class="badge">ARCO CAREERS</p>
  <h1>접근이 제한된 페이지입니다</h1>
  <p>이 사이트는 현재 준비 중이며, 지정된 사내 네트워크에서만 접속할 수 있습니다.
  사내망(사무실 Wi-Fi/유선)에서 다시 시도해 주세요.</p>
  <p style="font-size:.82rem;color:rgba(245,249,252,.45)">문의: 웹플랫폼개발팀</p>
</div></body></html>`;
