import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "회원가입 | 아르코채용",
  description:
    "아르코에듀 인재채용 회원가입. 본인인증 후 입사지원서를 작성하실 수 있습니다.",
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
