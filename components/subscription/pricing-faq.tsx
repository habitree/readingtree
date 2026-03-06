"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";

const FAQ_ITEMS = [
  {
    q: "포인트는 어떻게 얻나요?",
    a: "가입 시 200P가 즉시 지급되며, 프로필 완성(50P)과 첫 노트 작성(50P) 미션을 완료하면 총 300P를 받을 수 있습니다. 이후에도 독서 기록 작성, 일일 미션, 연속 출석 등 다양한 활동으로 포인트를 적립할 수 있습니다.",
  },
  {
    q: "첫 충전 보너스가 뭔가요?",
    a: "처음 포인트를 충전하시면, 구매한 패키지의 기본 포인트만큼 추가로 드려요! 예를 들어 스탠다드(1,200P)를 구매하면 2,600P를 받으실 수 있습니다.",
  },
  {
    q: "무료 한도를 초과하면 어떻게 되나요?",
    a: "AI 채팅, OCR 필사, AI 리포트 등 일부 기능은 무료 한도 초과 시 포인트를 사용하여 추가 이용할 수 있습니다. 그 외 기능은 다음 기간까지 기다려야 합니다.",
  },
  {
    q: "포인트를 충전할 수 있나요?",
    a: "위의 포인트 충전 패키지에서 원하는 패키지를 선택하고 '충전하기' 버튼을 누르면 카드, 간편결제, 계좌이체 등 다양한 결제 수단으로 충전할 수 있습니다.",
  },
  {
    q: "포인트 비용은 얼마인가요?",
    a: "기능별 포인트 비용: AI 채팅 100P/회, OCR 필사 80P/회, AI 리포트 150P/회입니다.",
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
