"use client";

// ════════════════════════════════════════════════════════════════
//  휴대폰 본인인증 추상화 — 데모(문자 인증번호 시뮬레이션) + 운영 슬롯.
//
//  레거시는 서울신용평가정보 siren24 V3 팝업(pcc.siren24.com)으로
//  이름·생년월일·휴대폰을 검증하고 CI/DI를 받는다. 운영 전환 시
//  Siren24Verifier(사이트코드·암호화 모듈 계약 필요) 또는 NICE/KCB로
//  아래 인터페이스만 구현해 교체하면 화면은 그대로 동작한다.
//
//  데모: 인증번호 6자리를 "발송"하고 화면에 함께 보여준다(문자 발송
//  인프라가 없으므로 — 정직한 데모 표기). 검증 성공 시 이름+생년월일+
//  휴대폰 해시를 CI 대용으로 반환한다.
// ════════════════════════════════════════════════════════════════

import { sha256 } from "@/lib/applicant-auth";

export interface VerifyRequest {
  name: string;
  /** YYYY-MM-DD */
  birth: string;
  phone: string;
}

export interface VerifySession {
  requestId: string;
  /** 데모 전용 — 실서비스에서는 절대 클라이언트로 내려가지 않는다 */
  demoCode: string;
}

export interface VerifyResult {
  ok: boolean;
  /** 본인인증 연계정보 (계정 중복 확인·계정 찾기 키) */
  ci?: string;
  error?: string;
}

/** 이 provider가 실제 본인인증기관과 연동돼 있는지 */
export const identityVerifyLive = false;

const pending = new Map<string, { req: VerifyRequest; code: string }>();

function normalizePhone(phone: string): string {
  return phone.replaceAll(/[^0-9]/g, "");
}

export const identityVerifier = {
  /** 인증번호 발송 (데모: 코드 생성 후 화면 표시용으로 반환) */
  request(req: VerifyRequest): { ok: boolean; session?: VerifySession; error?: string } {
    if (!req.name.trim()) return { ok: false, error: "이름을 입력해 주세요." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.birth))
      return { ok: false, error: "생년월일을 선택해 주세요." };
    const digits = normalizePhone(req.phone);
    if (!/^01[016789]\d{7,8}$/.test(digits))
      return { ok: false, error: "올바른 휴대폰 번호를 입력해 주세요." };
    const requestId = Math.random().toString(36).slice(2, 10);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    pending.set(requestId, { req: { ...req, phone: digits }, code });
    return { ok: true, session: { requestId, demoCode: code } };
  },

  /** 인증번호 확인 → CI 발급 */
  async confirm(requestId: string, code: string): Promise<VerifyResult> {
    const entry = pending.get(requestId);
    if (!entry) return { ok: false, error: "인증 요청이 만료되었습니다. 다시 시도해 주세요." };
    if (entry.code !== code.trim())
      return { ok: false, error: "인증번호가 일치하지 않습니다." };
    pending.delete(requestId);
    const { name, birth, phone } = entry.req;
    const ci = await sha256(`ci:${name}:${birth}:${phone}`);
    return { ok: true, ci };
  },
};
