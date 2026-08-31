import type { Metadata } from "next";
import { HrAnalytics } from "@/components/hr/analytics";

export const metadata: Metadata = { title: "리포트" };

export default function HrAnalyticsPage() {
  return <HrAnalytics />;
}
