// 아이디 로그인 — 아이디→이메일 매핑을 서버에 감추고, 비밀번호 검증도
// 서버의 익명 클라이언트로 대행한 뒤 세션 토큰만 돌려준다.
import {
  adminClient,
  anonServerClient,
  applicantAdminReady,
  findApplicant,
  jsonError,
} from "@/lib/server/applicant-admin";

export async function POST(req: Request) {
  if (!applicantAdminReady)
    return jsonError("데모 모드 — 서버 계정 기능이 비활성화되어 있습니다.", 501);
  const { username, password } = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  if (!username?.trim() || !password)
    return jsonError("아이디와 비밀번호를 입력해 주세요.");

  const user = await findApplicant(
    adminClient(),
    (m) => m.username.toLowerCase() === username.trim().toLowerCase(),
  );
  if (!user?.email) return jsonError("존재하지 않는 아이디입니다.");

  const { data, error } = await anonServerClient().auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (error || !data.session)
    return jsonError("비밀번호가 일치하지 않습니다.");

  return Response.json({
    ok: true,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  });
}
