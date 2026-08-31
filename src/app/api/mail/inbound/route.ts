// ════════════════════════════════════════════════════════════════
//  워크스페이스 이메일 수신 웹훅 (운영 전환용 스텁)
//
//  운영 시 메일 제공자(AWS SES 수신 규칙 / Postmark inbound 등)가
//  지원자 회신을 이 엔드포인트로 POST한다. 여기서:
//   1) 공유 시크릿 검증
//   2) to(워크스페이스 주소)·from(지원자)·subject·body 파싱
//   3) from 이메일 → 후보/지원서 매핑
//   4) Supabase hr_applications.emails 에 수신 메일 append
//   → Realtime 구독으로 HR 콘솔 스레드에 즉시 반영
//
//  현재는 계약된 메일 제공자가 없어 스텁(200)만 반환한다.
//  "설정 한 가지" = 도메인 MX + 제공자 수신 규칙을 이 URL로 연결.
// ════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.MAIL_INBOUND_SECRET;
  if (secret) {
    const auth = request.headers.get("x-inbound-secret");
    if (auth !== secret) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  // TODO(운영): payload(from/to/subject/body) → 지원서 매핑 후
  // Supabase hr_applications.emails 에 { direction:"수신", read:false } append.
  // 미연동 상태에서는 수신 페이로드를 수락만 하고 no-op.
  return Response.json({
    ok: true,
    note: "inbound webhook stub — 메일 제공자 연동 시 활성화됩니다.",
    received: Boolean(payload),
  });
}
