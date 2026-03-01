"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";

const FAQ_ITEMS = [
  {
    q: "무료 플랜에서도 모든 기능을 사용할 수 있나요?",
    a: "네, 무료 플랜에서도 핵심 기능을 사용할 수 있습니다. 다만 AI 채팅, OCR 필사 등 일부 기능은 일일/월별 사용 횟수에 제한이 있으며, AI 독서 리포트와 고급 통계 등은 유료 플랜에서만 이용 가능합니다.",
  },
  {
    q: "결제는 어떻게 하나요?",
    a: "현재 유료 구독 결제 기능은 준비 중입니다. 서비스 준비가 완료되면 안내해 드리겠습니다.",
  },
  {
    q: "플랜을 변경하거나 취소할 수 있나요?",
    a: "유료 구독이 오픈되면 언제든 플랜을 변경하거나 취소할 수 있습니다. 취소 시 결제 기간이 끝날 때까지 유료 기능을 계속 이용할 수 있습니다.",
  },
  {
    q: "포인트로 추가 사용이 가능한가요?",
    a: "무료 플랜의 일일 한도를 초과한 경우, 일부 기능은 포인트를 사용하여 추가 이용할 수 있습니다. 포인트 비용은 기능별로 다르며, AI 채팅 100P, OCR 필사 80P, AI 리포트 150P입니다.",
  },
];

export function PricingFaq() {
  return (
    <Card>
      <CardContent className="p-0">
        {FAQ_ITEMS.map((item, idx) => (
          <div key={idx}>
            {idx > 0 && <Separator />}
            <FaqToggle q={item.q} a={item.a} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FaqToggle({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-left px-6 py-4 hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-sm pr-4">{q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
          {a}
        </div>
      </div>
    </div>
  );
}
