"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowDown, Database, Cloud, Globe, Users, Box, Workflow } from "lucide-react";

/**
 * doc/connect README Mermaid와 동일한 연결 구조를 HTML/CSS로 표현.
 * 사용자 → 인증 → 앱 → 데이터/외부 API, 배포 흐름을 한눈에 볼 수 있음.
 */
export function ConnectionStructureDiagram() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          연결 구조
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          인증 → 데이터 → 외부 API → 배포 흐름 (doc/connect README 기준). 모바일에서는 좌우로 스크롤할 수 있습니다.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto overflow-y-hidden pb-2 -mx-1 min-h-[320px] sm:min-h-[280px]">
          <div className="connection-diagram inline-block p-4 min-w-[600px]">
            {/* Row 1: 사용자 */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                <Users className="h-4 w-4" />
                사용자
              </div>
              <div className="connection-node connection-node-user px-4 py-2 rounded-lg border-2 bg-muted/50">
                브라우저
              </div>
            </div>

            <div className="flex justify-center mb-1">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Row 2: 인증 + 앱 (가로 배치) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <ShieldIcon />
                  인증
                </div>
                <div className="connection-node connection-node-auth w-full space-y-1.5 p-3 rounded-lg border-2 bg-muted/50 text-xs">
                  <div>로그인 버튼 (카카오/구글)</div>
                  <ArrowRight className="h-3 w-3 mx-auto" />
                  <div>Supabase Auth</div>
                  <ArrowRight className="h-3 w-3 mx-auto" />
                  <div>/callback</div>
                  <ArrowRight className="h-3 w-3 mx-auto" />
                  <div>세션 쿠키</div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Box className="h-4 w-4" />
                  Next.js 앱
                </div>
                <div className="connection-node connection-node-app w-full space-y-1.5 p-3 rounded-lg border-2 bg-muted/50 text-xs">
                  <div>클라이언트</div>
                  <ArrowDown className="h-3 w-3 mx-auto" />
                  <div>Server Actions / API</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-1">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Row 3: 데이터 + 외부 API */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Database className="h-4 w-4" />
                  데이터
                </div>
                <div className="connection-node connection-node-data w-full space-y-1.5 p-3 rounded-lg border-2 bg-muted/50 text-xs">
                  <div>Supabase DB</div>
                  <div>Supabase Storage</div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Globe className="h-4 w-4" />
                  외부 API
                </div>
                <div className="connection-node connection-node-external w-full space-y-1.5 p-3 rounded-lg border-2 bg-muted/50 text-xs">
                  <div>Naver 도서 검색</div>
                  <div>Gemini AI</div>
                  <div>Cloud Run OCR</div>
                </div>
              </div>
            </div>

            {/* Row 4: 배포 */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                <Cloud className="h-4 w-4" />
                배포
              </div>
              <div className="connection-node connection-node-deploy flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 bg-muted/50 text-xs">
                <span>GitHub push</span>
                <ArrowRight className="h-3 w-3" />
                <span>GitHub Actions</span>
                <ArrowRight className="h-3 w-3" />
                <span>Vercel</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
