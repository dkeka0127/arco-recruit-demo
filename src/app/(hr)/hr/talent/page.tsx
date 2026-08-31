import type { Metadata } from "next";
import { HrTalent } from "@/components/hr/talent";

export const metadata: Metadata = { title: "인재풀" };

export default function HrTalentPage() {
  return <HrTalent />;
}
