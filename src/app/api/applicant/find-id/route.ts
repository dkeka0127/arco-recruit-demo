// 아이디 찾기 — 본인인증(ci) 일치 계정의 마스킹된 아이디만 반환.
import {
  adminClient,
  applicantAdminReady,
  findApplicant,
  jsonError,
  type ApplicantMeta,
} from "@/lib/server/applicant-admin";

function mask(u: string): string {
  return u.slice(0, 3) + "*".repeat(Math.max(1, u.length - 3));
}

export async function POST(req: Request) {
  if (!applicantAdminReady)
    return jsonError("데모 모드 — 서버 계정 기능이 비활성화되어 있습니다.", 501);
  const { ci } = (await req.json().catch(() => ({}))) as { ci?: string };
  if (!ci) return jsonError("본인인증 정보가 없습니다.");
  const user = await findApplicant(adminClient(), (m) => m.ci === ci);
  const meta = user?.user_metadata as ApplicantMeta | undefined;
  return Response.json({
    ok: true,
    username: meta ? mask(meta.username) : null,
  });
}
