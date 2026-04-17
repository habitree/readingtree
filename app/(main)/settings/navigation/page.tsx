import { redirect } from "next/navigation";

import { getCachedCurrentUser } from "@/lib/cached";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsNavigationPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">네비게이션</CardTitle>
        <CardDescription>
          모바일 하단 탭과 시트 메뉴를 개인화해요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          곧 제공돼요. 지금은 기본 메뉴 구성을 사용해요.
        </p>
      </CardContent>
    </Card>
  );
}
