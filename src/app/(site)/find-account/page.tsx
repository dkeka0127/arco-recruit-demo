import type { Metadata } from "next";
import { FindAccountForm } from "./find-account-form";

export const metadata: Metadata = {
  title: "아이디·비밀번호 찾기 | 아르코채용",
  description: "본인인증을 통해 아이디 또는 비밀번호를 찾으실 수 있습니다.",
};

export default function FindAccountPage() {
  return <FindAccountForm />;
}
