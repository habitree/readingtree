import { redirect } from "next/navigation";

import { getCachedCurrentUser } from "@/lib/cached";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getNotificationPrefs } from "@/app/actions/notifications";
import { NotificationPrefsForm } from "@/components/settings/notification-prefs-form";

export default async function SettingsNotificationsPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  const prefs = await getNotificationPrefs();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">알림 설정</CardTitle>
        <CardDescription>
          받고 싶은 알림만 선택할 수 있어요. 설정은 즉시 적용돼요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NotificationPrefsForm initial={prefs} />
      </CardContent>
    </Card>
  );
}
