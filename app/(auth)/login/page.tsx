import { LoginForm } from "@/components/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 | ReadTree",
  description: "카카오 또는 구글 계정으로 로그인",
};

/**
 * 로그인 페이지
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}

