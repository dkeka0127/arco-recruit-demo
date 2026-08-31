// 비밀번호 재설정 — 아이디 + 본인인증(ci) 일치 시 새 비밀번호로 교체.
// (레거시 절차 보존: 본인인증 기반 즉시 변경 — 메일 링크 방식 아님)
import {
  adminClient,
  applicantAdminReady,
  findApplicant,
  jsonError,
  PASSWORD_RE,
} from "@/lib/server/applicant-admin";

export async function POST(req: Request) {
  if (!applicantAdminReady)
    return jsonError("데모 모드 — 서버 계정 기능이 비활성화되어 있습니다.", 501);
  const { username, ci, newPassword } = (await req.json().catch(() => ({}))) as {
    username?: string;
    ci?: string;
    newPassword?: string;
  };
  if (!username?.trim() || !ci)
    return jsonError("아이디와 본인인증 정보가 필요합니다.");
  if (!newPassword || !PASSWORD_RE.test(newPassword))
    return jsonError("비밀번호는 영문·숫자를 포함한 8~20자입니다.");

  const admin = adminClient();
  const user = await findApplicant(
    admin,
    (m) =>
      m.username.toLowerCase() === username.trim().toLowerCase() && m.ci === ci,
  );
  if (!user)
    return jsonError("아이디와 본인인증 정보가 일치하는 계정이 없습니다.");

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });
  if (error) return jsonError(`재설정에 실패했습니다: ${error.message}`, 500);
  return Response.json({ ok: true });
}
