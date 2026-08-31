import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "로그인 | 아르코채용",
  description: "아르코에듀 인재채용 로그인. 로그인 후 입사지원서를 작성하실 수 있습니다.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
