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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <p>{t("footer.copyright").replace("{year}", String(currentYear))}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <a href="/terms" className="hover:text-foreground transition-colors">
                {t("footer.termsOfService")}
              </a>
              <a href="/privacy" className="hover:text-foreground transition-colors">
                {t("footer.privacyPolicy")}
              </a>
              <a
                href="https://open.kakao.com/o/gGXr3Zji"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                readtree 커뮤니티
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
