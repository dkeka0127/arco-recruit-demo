import type { Metadata } from "next";
import { HrShell } from "@/components/hr/shell";
import { HrAuthGate } from "@/components/hr/auth-gate";
import { DemoBanner } from "@/components/demo-banner";

export const metadata: Metadata = {
  title: {
    default: "HR 콘솔 | 아르코 채용",
    template: "%s · ARCO HR 콘솔",
  },
  description: "아르코에듀 인사팀 채용관리 시스템 (사내 ATS).",
  robots: { index: false, follow: false },
};

export default function HrLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <DemoBanner />
      <HrAuthGate>
        <HrShell>{children}</HrShell>
      </HrAuthGate>
    </>
  );
}
