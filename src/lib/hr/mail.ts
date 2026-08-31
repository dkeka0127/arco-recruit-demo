// ════════════════════════════════════════════════════════════════
//  워크스페이스 이메일 provider — 지원자와의 양방향 메일.
//
//  구조는 완성되어 있고, 운영 전환 시 "설정 한 가지"만 하면 켜진다:
//   · 발신: AWS SES (EKS는 IRSA로 키 없이) — MockMailProvider → SesMailProvider
//   · 수신: 도메인 MX → 메일 제공자(SES 수신 규칙/Postmark 등)가
//           /api/mail/inbound 웹훅으로 POST → 스레드에 자동 추가
//  그 전까지는 목업이 동일 인터페이스로 동작(로컬 기록).
// ════════════════════════════════════════════════════════════════

export interface OutboundEmail {
  from: string;
  to: string;
  subject: string;
  body: string;
}

export interface MailSendResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
  live: boolean;
}

export interface MailProvider {
  /** 실제 발신 백엔드 연결 여부 (UI 뱃지·문구용) */
  readonly live: boolean;
  sendEmail(email: OutboundEmail): Promise<MailSendResult>;
}

class MockMailProvider implements MailProvider {
  readonly live = false;
  async sendEmail(): Promise<MailSendResult> {
    return {
      ok: true,
      providerMessageId: `mock-mail-${Math.random().toString(36).slice(2, 10)}`,
      live: false,
    };
  }
}

export const mail: MailProvider = new MockMailProvider();

/** 발신/수신 연동 현황 (설정 화면 표시) */
export const mailStatus = {
  outbound: { ready: false, provider: "AWS SES" },
  inbound: { ready: false, provider: "SES 수신 규칙 / 메일 제공자 웹훅" },
};
