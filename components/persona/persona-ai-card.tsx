"use client";

import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PersonaAICard() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <h3 className="font-medium">{t("persona.aiHelperTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("persona.aiHelperDesc")}
          </p>
        </div>
        <Button asChild>
          <Link href="/chat">{t("persona.startChat")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
