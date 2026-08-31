import type { Metadata } from "next";
import { MyWork } from "@/components/hr/my-work";

export const metadata: Metadata = { title: "내 업무" };

export default function MyWorkPage() {
  return <MyWork />;
}
