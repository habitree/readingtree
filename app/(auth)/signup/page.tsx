import { SignupForm } from "@/components/auth/signup-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입 | ReadTree",
  description: "카카오, 구글 또는 이메일로 회원가입하세요",
};

/**
 * 회원가입 페이지
 */
export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  );
}

