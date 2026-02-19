"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, FileText, Settings } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const DOCS_BASE_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_DOCS_BASE_URL
    ? process.env.NEXT_PUBLIC_DOCS_BASE_URL.replace(/\/$/, "")
    : "https://github.com/habitree/readingtree";

const BRANCH = "main";
const CONNECT_PATH = "doc/connect";

const DOC_CONNECT_LINKS: { labelKey: string; path: string }[] = [
  { labelKey: "admin.apiInfo.docConnection", path: "README.md" },
  { labelKey: "admin.apiInfo.docAuth", path: "01-auth.md" },
  { labelKey: "admin.apiInfo.docData", path: "02-data-supabase.md" },
  { labelKey: "admin.apiInfo.docExternalApi", path: "03-apis.md" },
  { labelKey: "admin.apiInfo.docDeployment", path: "04-deployment-vercel.md" },
  { labelKey: "admin.apiInfo.docEnvVars", path: "05-env-variables.md" },
  { labelKey: "admin.apiInfo.docChecklist", path: "06-check-and-change.md" },
  { labelKey: "admin.apiInfo.docCautions", path: "%EC%A3%BC%EC%9D%98%EC%82%AC%ED%95%AD.md" },
];

const EXTERNAL_LINKS: { labelKey: string; href: string }[] = [
  { labelKey: "Supabase", href: "https://supabase.com/dashboard" },
  { labelKey: "admin.apiInfo.kakaoDeveloper", href: "https://developers.kakao.com/console/app" },
  { labelKey: "admin.apiInfo.naverDeveloper", href: "https://developers.naver.com/" },
  { labelKey: "Vercel", href: "https://vercel.com/dashboard" },
];

function docConnectHref(path: string): string {
  return `${DOCS_BASE_URL}/blob/${BRANCH}/${CONNECT_PATH}/${path}`;
}

export function DocsLinksBar() {
  const { t } = useTranslation();

  const getLabel = (key: string) => {
    // If the key doesn't contain a dot, it's a plain label (like "Supabase", "Vercel")
    if (!key.includes(".")) return key;
    return t(key as any);
  };

  return (
    <Card variant="ghost" className="border border-border/30">
      <CardContent className="py-3 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* doc/connect 문서 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t("admin.apiInfo.projectDocs")}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {DOC_CONNECT_LINKS.map(({ labelKey, path }) => (
                <a
                  key={path}
                  href={docConnectHref(path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {getLabel(labelKey)}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ))}
            </div>
          </div>

          {/* 외부 대시보드 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t("admin.apiInfo.externalDashboards")}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {EXTERNAL_LINKS.map(({ labelKey, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/5 hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {getLabel(labelKey)}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
