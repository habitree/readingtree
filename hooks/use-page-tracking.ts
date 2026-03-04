"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_track_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("_track_sid", sid);
  }
  return sid;
}

const EXCLUDED_PREFIXES = ["/api/", "/_next/"];

export function usePageTracking() {
  const pathname = usePathname();
  const lastPath = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;
    if (pathname === lastPath.current) return;
    if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return;

    lastPath.current = pathname;

    // fire-and-forget
    fetch("/api/tracking/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        sessionId: getSessionId(),
        referer: document.referrer || undefined,
      }),
    }).catch(() => {
      // 무시
    });
  }, [pathname]);
}
