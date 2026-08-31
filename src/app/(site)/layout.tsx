import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DemoBanner } from "@/components/demo-banner";

/**
 * (site) — 지원자용 채용 사이트 셸.
 * 헤더/푸터는 이 그룹에만 적용된다. (hr)은 자체 앱 셸을 가진다.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <DemoBanner />
      {/* 데모 배너(h-7)만큼 본문을 아래로 밀어준다 */}
      <div aria-hidden className="h-7" />
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </>
  );
}
