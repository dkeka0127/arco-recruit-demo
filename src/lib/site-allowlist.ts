// ════════════════════════════════════════════════════════════════
//  사이트 IP 허용목록 — 오픈 전 도메인 전체를 특정 공인 IP로
//  제한하기 위한 순수 로직. proxy.ts(구 middleware)가 이걸 써서 강제한다.
//
//  데모 브랜치: 기본 허용목록을 비워 전체 공개로 동작한다.
//  접근을 제한하려면 env SITE_IP_ALLOWLIST에 CIDR 목록(쉼표 구분)을 넣는다.
// ════════════════════════════════════════════════════════════════

/** 기본 허용 공인 IP (env 미설정 시 사용) — 데모는 제한 없음 */
export const DEFAULT_ALLOWLIST: string[] = [];

/** IPv4 문자열 → 32bit 정수 (형식 오류 시 null) */
function ipv4ToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const o = Number(p);
    if (!Number.isInteger(o) || o < 0 || o > 255) return null;
    n = (n << 8) | o;
  }
  return n >>> 0;
}

/** ip가 CIDR(또는 단일 IP)에 속하는가 — IPv4 전용 */
export function ipInCidr(ip: string, cidr: string): boolean {
  const slash = cidr.indexOf("/");
  const base = slash === -1 ? cidr : cidr.slice(0, slash);
  const bits = slash === -1 ? 32 : Number(cidr.slice(slash + 1));
  const ipN = ipv4ToInt(ip);
  const baseN = ipv4ToInt(base);
  if (ipN === null || baseN === null || !Number.isInteger(bits) || bits < 0 || bits > 32)
    return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (ipN & mask) === (baseN & mask);
}

export interface AllowlistMode {
  enabled: boolean;
  cidrs: string[];
}

/**
 * 현재 허용목록 설정.
 * - env `SITE_IP_ALLOWLIST` = "off" | "*" → 비활성(전체 허용, kill-switch)
 * - env에 CIDR 목록(쉼표 구분) → 그 목록 사용
 * - env 미설정 → DEFAULT_ALLOWLIST
 */
export function allowlistMode(): AllowlistMode {
  const env = process.env.SITE_IP_ALLOWLIST?.trim();
  if (env === "off" || env === "*") return { enabled: false, cidrs: [] };
  const cidrs = env
    ? env.split(",").map((s) => s.trim()).filter(Boolean)
    : DEFAULT_ALLOWLIST;
  return { enabled: cidrs.length > 0, cidrs };
}

/** x-forwarded-for(맨 앞) → x-real-ip 순으로 클라이언트 IP 추출 */
export function clientIpFrom(
  xForwardedFor: string | null,
  xRealIp: string | null,
): string | null {
  const first = xForwardedFor?.split(",")[0]?.trim();
  return first || xRealIp?.trim() || null;
}

/**
 * 접근 허용 여부. 비활성이면 항상 허용. 활성이면 허용목록에 속한 IPv4만 허용.
 * IP 불명·IPv6 등 매칭 불가 → 차단(실오픈 전 "이 IP만 허용" 의도).
 */
export function isIpAllowed(ip: string | null): boolean {
  const { enabled, cidrs } = allowlistMode();
  if (!enabled) return true;
  if (!ip) return false;
  return cidrs.some((c) => ipInCidr(ip, c));
}
