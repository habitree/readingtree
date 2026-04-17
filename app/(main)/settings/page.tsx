import { getCachedCurrentUser } from "@/lib/cached";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountSection } from "@/components/settings/account-section";

export default async function SettingsAccountPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">계정</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountSection
            email={user.email ?? null}
            provider={
              (user.app_metadata?.provider as string | undefined) ?? "email"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
