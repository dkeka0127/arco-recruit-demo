import type { Metadata } from "next";
import { HrDashboard } from "@/components/hr/dashboard";

export const metadata: Metadata = { title: "대시보드" };

export default function HrDashboardPage() {
  return <HrDashboard />;
}
