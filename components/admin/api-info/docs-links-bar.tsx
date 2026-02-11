"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, FileText, Settings } from "lucide-react";

const DOCS_BASE_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_DOCS_BASE_URL
    ? process.env.NEXT_PUBLIC_DOCS_BASE_URL.replace(/\/$/, "")
    : "https://github.com/habitree/readingtree";

const BRANCH = "main";
const CONNECT_PATH = "doc/connect";

const DOC_CONNECT_LINKS: { label: string; path: string }[] = [
  { label: "연결 문서", path: "README.md" },
  { label: "인증", path: "01-auth.md" },
  { label: "데이터", path: "02-data-supabase.md" },
  { label: "외부 API", path: "03-apis.md" },
  { label: "배포", path: "04-deployment-vercel.md" },
  { label: "환경 변수", path: "05-env-variables.md" },
  { label: "체크리스트", path: "06-check-and-change.md" },
  { label: "주의사항", path: "%EC%A3%BC%EC%9D%98%EC%82%AC%ED%95%AD.md" },
];

const EXTERNAL_LINKS: { label: string; href: string }[] = [
  { label: "Supabase", href: "https://supabase.com/dashboard" },
  { label: "카카오 개발자", href: "https://developers.kakao.com/console/app" },
  { label: "네이버 개발자", href: "https://developers.naver.com/" },
  { label: "Vercel", href: "https://vercel.com/dashboard" },
];

function docConnectHref(path: string): string {
  return `${DOCS_BASE_URL}/blob/${BRANCH}/${CONNECT_PATH}/${path}`;
}

export function DocsLinksBar() {
  return (
    <Card variant="ghost" className="border border-border/30">
      <CardContent className="py-3 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* doc/connect 문서 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                프로젝트 문서
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {DOC_CONNECT_LINKS.map(({ label, path }) => (
                <a
                  key={path}
                  href={docConnectHref(path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
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
                외부 대시보드
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {EXTERNAL_LINKS.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/5 hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
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
