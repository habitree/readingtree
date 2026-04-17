import { redirect } from "next/navigation";

import { getCachedCurrentUser } from "@/lib/cached";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExportNotesForm } from "@/components/settings/export-notes-form";

export default async function SettingsExportPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">기록 내보내기</CardTitle>
        <CardDescription>
          전체 또는 특정 달의 기록을 Markdown(.md) 파일로 내려받아요. 다른 앱·노션 등에 그대로 붙여넣을 수 있어요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ExportNotesForm />
      </CardContent>
    </Card>
  );
}
