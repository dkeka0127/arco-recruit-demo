import type { Metadata } from "next";
import { HrSettings } from "@/components/hr/settings";

export const metadata: Metadata = { title: "설정" };

export default function HrSettingsPage() {
  return <HrSettings />;
}
