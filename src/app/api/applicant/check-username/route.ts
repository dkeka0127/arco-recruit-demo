// 아이디 사용 가능 여부 — 회원가입 "중복 확인" 버튼.
import {
  adminClient,
  applicantAdminReady,
  findApplicant,
  jsonError,
  USERNAME_RE,
} from "@/lib/server/applicant-admin";

export async function POST(req: Request) {
  if (!applicantAdminReady)
    return jsonError("데모 모드 — 서버 계정 기능이 비활성화되어 있습니다.", 501);
  const { username } = (await req.json().catch(() => ({}))) as {
    username?: string;
  };
  if (!username || !USERNAME_RE.test(username))
    return jsonError("아이디는 영문으로 시작하는 영문/숫자 6~20자입니다.");
  const dup = await findApplicant(
    adminClient(),
    (m) => m.username.toLowerCase() === username.toLowerCase(),
  );
  return Response.json({ ok: true, available: !dup });
}
