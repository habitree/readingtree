"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import { IS_BETA_MODE } from "@/lib/subscription/beta";

const BETA_FAQ_ITEMS = [
  {
    q: "베타 기간에는 정말 무료인가요?",
    a: "네, 베타 테스트 기간 동안 AI 채팅, OCR 필사, AI 독서 리포트 등 모든 AI 기능을 무료로 무제한 이용하실 수 있습니다.",
  },
  {
    q: "베타 기간은 언제까지인가요?",
    a: "정식 출시 전까지 베타 테스트가 진행됩니다. 베타 종료 시 사전에 충분한 안내를 드릴 예정입니다.",
  },
  {
    q: "베타 이후에는 어떻게 되나요?",
    a: "정식 출시 후에는 기본 무료 한도가 제공되며, 추가 사용 시 포인트로 이용할 수 있습니다. 베타 기간 동안의 독서 기록과 데이터는 모두 유지됩니다.",
  },
  {
    q: "포인트는 어떻게 얻나요?",
    a: "가입 시 200P가 즉시 지급되며, 프로필 완성(50P)과 첫 노트 작성(50P) 미션을 완료하면 총 300P를 받을 수 있습니다. 이후에도 독서 기록 작성, 일일 미션, 연속 출석 등 다양한 활동으로 포인트를 적립할 수 있습니다.",
  },
];

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
    a: "위의 포인트 충전 패키지에서 원하는 패키지를 선택하고 '충전하기' 버튼을 누르면 Polar 결제 페이지에서 카드 등 다양한 결제 수단으로 충전할 수 있습니다.",
  },
  {
    q: "왜 가격이 달러(USD)로 표시되나요?",
    a: "결제는 Polar를 통해 USD(달러) 기준으로 진행됩니다. 함께 표시되는 원화 금액은 참고용 예시이며, 결제 시점의 환율과 카드사 수수료에 따라 실제 청구되는 원화 금액은 다소 차이가 날 수 있습니다.",
  },
  {
    q: "포인트 비용은 얼마인가요?",
    a: "기능별 포인트 비용: AI 채팅 40P/회, OCR 필사 25P/회, AI 리포트 100P/회입니다.",
  },
  {
    q: "포인트 유효기간이 있나요?",
    a: "유료 충전 포인트는 충전일로부터 1년, 보너스 포인트는 6개월, 무료 적립 포인트(활동 보상 등)는 3개월입니다. 포인트 사용 시 무료 → 보너스 → 유료 순으로 차감되어 유료 포인트가 가장 오래 보존됩니다. 만료 30일/7일 전 알림을 보내드립니다.",
  },
  {
    q: "충전한 포인트 환불이 가능한가요?",
    a: "환불은 결제 서비스 제공자(Polar)의 정책에 따라 처리됩니다. 문의사항이 있으시면 카카오 오픈채팅으로 연락해 주세요.",
  },
];

const activeFaqItems = IS_BETA_MODE ? BETA_FAQ_ITEMS : FAQ_ITEMS;

export function PricingFaq() {
  return (
    <Card>
      <CardContent className="p-0">
        {activeFaqItems.map((item, idx) => (
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
