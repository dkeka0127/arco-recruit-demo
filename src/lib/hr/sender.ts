// ════════════════════════════════════════════════════════════════
//  발송 추상화 레이어 (MessageSender)
//
//  이메일·문자(SMS/LMS)·알림톡을 한 인터페이스 뒤에 모은다.
//  지금은 MockSender(기록만)이고, 추후 각 채널을 실제 업체로 교체:
//   - 이메일: AWS SES (EKS에서 IAM 역할로)
//   - 문자/알림톡: NHN Cloud Notification / 카카오 비즈메시지
//  provider 패턴이라 UI·스토어는 이 모듈만 알면 된다.
// ════════════════════════════════════════════════════════════════

import type { MessageChannel } from "./types";

export interface SendRequest {
  channel: MessageChannel;
  /** 수신자 (이메일 주소 또는 전화번호) */
  to: string;
  subject: string;
  body: string;
  /** 예약 발송 시각 (ISO). 없으면 즉시 */
  scheduledAt?: string;
}

export interface SendResult {
  ok: boolean;
  /** 업체 발송 id (추후 상태 추적용) */
  providerMessageId?: string;
  /** 실패 사유 */
  error?: string;
  /** 실제 발송인지 목업인지 */
  live: boolean;
}

export interface MessageSender {
  readonly live: boolean;
  /** 채널별 발송 가능 여부 (자격 미설정 채널 비활성화용) */
  supports(channel: MessageChannel): boolean;
  send(req: SendRequest): Promise<SendResult>;
}

// ── 채널별 실연동 슬롯 (env 자격 여부로 활성화) ─────────────────
// 값이 있으면 해당 채널을 "연동 준비됨"으로 표시. 실제 호출은 서버
// 라우트에서 SDK로 수행할 예정(키는 서버 전용, NEXT_PUBLIC 금지).

export const channelStatus: Record<
  MessageChannel,
  { ready: boolean; provider: string }
> = {
  이메일: { ready: false, provider: "AWS SES" },
  문자: { ready: false, provider: "NHN Cloud SMS" },
  알림톡: { ready: false, provider: "카카오 알림톡(비즈메시지)" },
};

// ── 목업 구현 ────────────────────────────────────────────────────

class MockSender implements MessageSender {
  readonly live = false;
  supports(): boolean {
    return true; // 목업은 전 채널 허용(기록만)
  }
  async send(req: SendRequest): Promise<SendResult> {
    return {
      ok: true,
      providerMessageId: `mock-${Math.random().toString(36).slice(2, 10)}`,
      live: false,
      ...(req.scheduledAt ? {} : {}),
    };
  }
}

export const sender: MessageSender = new MockSender();

/** 변수 치환 — 템플릿 본문에 지원자명/공고명 등 주입 */
export function fillTemplate(
  body: string,
  vars: Record<string, string>,
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
