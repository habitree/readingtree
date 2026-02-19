"use client";

import { useTranslation } from "@/lib/i18n";

/**
 * 푸터 컴포넌트
 */
export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <p>{t("footer.copyright").replace("{year}", String(currentYear))}</p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              {t("footer.termsOfService")}
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              {t("footer.privacyPolicy")}
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              {t("footer.contact")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
