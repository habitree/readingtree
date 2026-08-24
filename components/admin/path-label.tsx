"use client";

import { getPageLabel } from "@/lib/constants/page-labels";

// 접속 경로를 실제 메뉴명 + 원시 경로로 표시. 매핑 없으면 경로만 표시
export function PathLabel({ path }: { path: string }) {
  const label = getPageLabel(path);
  if (!label) {
    return <span className="text-sm font-mono">{path}</span>;
  }
  return (
    <div className="min-w-0">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground font-mono block truncate max-w-[240px]">
        {path}
      </span>
    </div>
  );
}
