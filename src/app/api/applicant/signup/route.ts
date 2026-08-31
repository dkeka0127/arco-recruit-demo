// 지원자 회원가입 — 본인인증(ci)을 마친 클라이언트가 호출.
// Supabase Auth에 user_metadata.role="applicant"로 생성한다.
// ⚠ 데모 본인인증의 ci는 클라이언트 계산이라 위조 가능 — siren24/NICE
//    실연동 시 인증기관 응답을 서버에서 검증해 ci를 발급해야 한다.
import {
  adminClient,
  applicantAdminReady,
  findApplicant,
  jsonError,
  PASSWORD_RE,
  USERNAME_RE,
} from "@/lib/server/applicant-admin";

interface Body {
  username?: string;
  password?: string;
  name?: string;
  birth?: string;
  phone?: string;
  email?: string;
  ci?: string;
}

export async function POST(req: Request) {
  if (!applicantAdminReady)
    return jsonError("데모 모드 — 서버 계정 기능이 비활성화되어 있습니다.", 501);
  const b = (await req.json().catch(() => ({}))) as Body;
  const { username, password, name, birth, phone, email, ci } = b;

  if (!username || !USERNAME_RE.test(username))
    return jsonError("아이디는 영문으로 시작하는 영문/숫자 6~20자입니다.");
  if (!password || !PASSWORD_RE.test(password))
    return jsonError("비밀번호는 영문·숫자를 포함한 8~20자입니다.");
  if (!name?.trim() || !birth || !phone || !ci)
    return jsonError("본인인증 정보가 없습니다. 인증을 다시 진행해 주세요.");
  if (!email || !/^\S+@\S+\.\S+$/.test(email))
    return jsonError("올바른 이메일을 입력해 주세요.");

  const admin = adminClient();
  const dupUsername = await findApplicant(
    admin,
    (m) => m.username.toLowerCase() === username.toLowerCase(),
  );
  if (dupUsername) return jsonError("이미 사용 중인 아이디입니다.");
  const dupCi = await findApplicant(admin, (m) => m.ci === ci);
  if (dupCi)
    return jsonError(
      "이미 본인인증으로 가입된 계정이 있습니다. 아이디 찾기를 이용해 주세요.",
    );

  const { error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: {
      role: "applicant",
      username,
      name: name.trim(),
      birth,
      phone: phone.trim(),
      ci,
    },
  });
  if (error) {
    if (/already|registered|exists/i.test(error.message))
      return jsonError("이미 가입된 이메일입니다. 아이디 찾기를 이용해 주세요.");
    return jsonError(`가입에 실패했습니다: ${error.message}`, 500);
  }
  return Response.json({ ok: true });
}
