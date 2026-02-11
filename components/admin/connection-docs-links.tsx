"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Settings } from "lucide-react";

const DOCS_BASE_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_DOCS_BASE_URL
    ? process.env.NEXT_PUBLIC_DOCS_BASE_URL.replace(/\/$/, "")
    : "https://github.com/habitree/readingtree";

const BRANCH = "main";
const CONNECT_PATH = "doc/connect";

const DOC_CONNECT_LINKS: { label: string; path: string }[] = [
  { label: "연결 문서 (README)", path: "README.md" },
  { label: "인증 (01-auth)", path: "01-auth.md" },
  { label: "데이터 (02-data-supabase)", path: "02-data-supabase.md" },
  { label: "외부 API (03-apis)", path: "03-apis.md" },
  { label: "배포 (04-deployment-vercel)", path: "04-deployment-vercel.md" },
  { label: "환경 변수 (05-env-variables)", path: "05-env-variables.md" },
  { label: "체크리스트 (06-check-and-change)", path: "06-check-and-change.md" },
  { label: "주의사항", path: "%EC%A3%BC%EC%9D%98%EC%82%AC%ED%95%AD.md" },
];

const EXTERNAL_LINKS: { label: string; href: string }[] = [
  { label: "Supabase 대시보드", href: "https://supabase.com/dashboard" },
  { label: "카카오 개발자 콘솔", href: "https://developers.kakao.com/console/app" },
  { label: "네이버 개발자 센터", href: "https://developers.naver.com/" },
  { label: "Vercel 대시보드", href: "https://vercel.com/dashboard" },
];

function docConnectHref(path: string): string {
  return `${DOCS_BASE_URL}/blob/${BRANCH}/${CONNECT_PATH}/${path}`;
}

/**
 * doc/connect 문서 및 외부 설정 페이지 링크 버튼.
 * GitHub blob 링크로 연결 문서를 열고, Supabase/Vercel 등 외부 대시보드 링크 제공.
 */
export function ConnectionDocsLinks() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          연결 설정 문서
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          프로젝트 연결 정보(doc/connect) 및 외부 서비스 설정 페이지 링크
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Settings className="h-4 w-4" />
            doc/connect 문서
          </div>
          <div className="flex flex-wrap gap-2">
            {DOC_CONNECT_LINKS.map(({ label, path }) => (
              <Button
                key={path}
                variant="outline"
                size="sm"
                className="text-xs"
                asChild
              >
                <a
                  href={docConnectHref(path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  {label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">외부 설정 링크</div>
          <div className="flex flex-wrap gap-2">
            {EXTERNAL_LINKS.map(({ label, href }) => (
              <Button
                key={href}
                variant="secondary"
                size="sm"
                className="text-xs"
                asChild
              >
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  {label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
