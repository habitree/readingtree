import { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "새 비밀번호 설정 | ReadTree",
  description: "계정의 새 비밀번호를 설정해요.",
};

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
