// K8s liveness/readiness 프로브용 헬스체크.
// 항상 동적으로 200을 반환한다 (빌드 타임 정적화 금지).

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", service: "arco-hr" });
}
