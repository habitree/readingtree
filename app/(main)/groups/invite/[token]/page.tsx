import { notFound, redirect } from "next/navigation";
import { getGroupByInviteToken, joinByToken } from "@/app/actions/groups";
import { getCurrentUser } from "@/app/actions/auth";
import { InviteLandingClient } from "./invite-landing-client";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const resolvedParams = await params;
  const token = resolvedParams.token;

  if (!token || typeof token !== "string") {
    notFound();
  }

  const result = await getGroupByInviteToken(token);
  if (!result) {
    notFound();
  }

  // 로그인 여부 확인
  const user = await getCurrentUser();

  return (
    <InviteLandingClient
      group={result.group}
      memberCount={result.memberCount}
      token={token}
      isLoggedIn={!!user}
    />
  );
}
