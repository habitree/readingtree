"use client";

/**
 * 연간 독서 결산 링크 공유 버튼 (REQ-0014) — 월간 recap-share-dialog 의 채널 로직과 같은 방식.
 * 비공개 결산은 링크·카카오·X 를 누르는 시점에 공개로 전환한다.
 */

import { useState } from "react";
import { Check, Globe, LinkIcon, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  copyShareLink,
  isKakaoShareAvailable,
  shareViaKakao,
  shareViaX,
  type ShareContext,
} from "@/lib/share/share-channels";
import { getAppUrl } from "@/lib/utils/url";
import { setYearlyRecapPublic, type YearlyRecapShareInfo } from "@/app/actions/recap/yearly";
import { formatReadingTime } from "@/lib/recap/text";
import type { YearlyRecapComputed } from "@/lib/recap/yearly";

interface YearlyShareActionsProps {
  computed: YearlyRecapComputed;
  userName: string | null;
  share: YearlyRecapShareInfo;
}

export function YearlyShareActions({ computed, userName, share }: YearlyShareActionsProps) {
  const [isPublic, setIsPublic] = useState(share.isPublic);
  const [isToggling, setIsToggling] = useState(false);
  const [didCopy, setDidCopy] = useState(false);

  const path = `/share/yearly-recaps/${share.shareId}`;
  const context: ShareContext = {
    kind: "yearly_recap",
    id: share.shareId,
    title: `${userName ? userName + "님의 " : ""}${computed.year} 독서 결산`,
    description: `${computed.highlights.personaTitle} · ${formatReadingTime(computed.stats.totalReadingSeconds)} · 완독 ${computed.stats.completedBooks}권`,
    path,
    ctaLabel: "결산 보러가기",
  };

  const setPublic = async (next: boolean): Promise<boolean> => {
    setIsToggling(true);
    const res = await setYearlyRecapPublic(share.shareId, next);
    setIsToggling(false);
    if (!res.success) {
      toast.error(res.error ?? "공개 설정을 바꾸지 못했어요");
      return false;
    }
    setIsPublic(next);
    toast.success(next ? "결산을 공개로 전환했어요" : "결산을 비공개로 전환했어요");
    return true;
  };
  const ensurePublic = async () => isPublic || (await setPublic(true));

  const handleCopyLink = async () => {
    if (!(await ensurePublic())) return;
    if (await copyShareLink(`${getAppUrl()}${path}`)) {
      setDidCopy(true);
      toast.success("링크를 복사했어요");
      setTimeout(() => setDidCopy(false), 2000);
    } else {
      toast.error("링크를 복사하지 못했어요");
    }
  };

  const handleKakao = async () => {
    if (!(await ensurePublic())) return;
    const ok = await shareViaKakao({ baseUrl: getAppUrl(), context, version: share.shareVersion });
    if (!ok) toast.error("카카오톡 공유를 사용할 수 없어요");
  };

  const handleX = async () => {
    if (!(await ensurePublic())) return;
    shareViaX({ baseUrl: getAppUrl(), context, version: share.shareVersion });
  };

  return (
    <div className="space-y-2 rounded-xl border p-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleCopyLink} disabled={isToggling}>
          {didCopy ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
          링크 복사
        </Button>
        {isKakaoShareAvailable() && (
          <Button variant="outline" size="sm" onClick={handleKakao} disabled={isToggling}>
            <MessageCircle className="h-4 w-4" />
            카카오톡
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleX} disabled={isToggling}>
          X
        </Button>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Globe className="h-3.5 w-3.5" />
        {isPublic ? "링크가 있는 누구나 이 결산을 볼 수 있어요." : "링크로 공유하면 결산이 공개로 전환돼요."}
        {isPublic && (
          <button type="button" className="underline" onClick={() => setPublic(false)} disabled={isToggling}>
            비공개로 전환
          </button>
        )}
      </p>
    </div>
  );
}
