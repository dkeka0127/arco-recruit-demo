import { DemoBanner } from "@/components/demo-banner";

/**
 * (external) — 토큰 링크로 진입하는 외부 화면 셸 (면접관 포털/필기시험/평가).
 * 자체 헤더가 없는 전체화면 페이지들이라 데모 배너만 얹고 높이만큼 밀어준다.
 */
export default function ExternalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <DemoBanner />
      {/* 데모 배너(h-7)만큼 본문을 아래로 밀어준다 */}
      <div aria-hidden className="h-7" />
      {children}
    </>
  );
}
