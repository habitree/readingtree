import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "환불정책 | ReadTree",
  description: "ReadTree 포인트 충전 환불 정책 안내",
};

/**
 * 환불정책 페이지
 * 토스페이먼츠 계약 심사 필수 요건
 */
export default function RefundPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </Button>
          <h1 className="text-4xl font-bold mb-2">환불정책</h1>
          <p className="text-muted-foreground">최종 수정일: 2026년 3월 10일</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>제1조 (적용 범위)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              본 환불정책은 ReadTree(이하 &quot;서비스&quot;)에서 제공하는 포인트
              충전 상품에 적용됩니다.
            </p>
            <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
              <p className="font-semibold">결제 상품 안내</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>라이트 패키지: ₩1,900 (500P 지급)</li>
                <li>스탠다드 패키지: ₩3,900 (1,200P + 보너스 200P 지급)</li>
                <li>프리미엄 패키지: ₩6,900 (3,000P + 보너스 800P 지급)</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                * 유료 충전 포인트 유효기간: 충전일로부터 1년
              </p>
              <p className="text-muted-foreground">
                * 보너스 포인트 유효기간: 지급일로부터 6개월
              </p>
              <p className="text-muted-foreground">
                * 무료 적립 포인트(활동 보상 등) 유효기간: 적립일로부터 3개월
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제2조 (환불 가능 조건)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>다음 조건을 모두 충족하는 경우 전액 환불이 가능합니다:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>결제일로부터 7일 이내 환불 신청</li>
              <li>
                충전된 포인트를 전혀 사용하지 않은 경우 (보너스 포인트 포함)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제3조 (부분 환불)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              결제일로부터 7일 이내이며, 충전된 포인트를 일부 사용한 경우에는
              아래와 같이 부분 환불이 가능합니다:
            </p>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-semibold mb-2">부분 환불 계산</p>
              <p className="text-muted-foreground">
                환불 금액 = 결제 금액 × (잔여 기본 포인트 ÷ 지급된 기본 포인트)
              </p>
              <p className="text-muted-foreground mt-1">
                * 보너스 포인트는 환불 금액 산정에서 제외되며, 환불 시 함께
                회수됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제4조 (환불 불가 사유)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>다음의 경우 환불이 불가합니다:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>결제일로부터 7일이 경과한 경우</li>
              <li>
                충전된 포인트를 전부 사용한 경우
              </li>
              <li>
                유효기간이 만료되어 소멸된 포인트
              </li>
              <li>
                이벤트, 프로모션 등으로 무상 지급된 포인트 (가입 보상, 미션 보상
                등)
              </li>
              <li>서비스 이용약관 위반으로 이용이 제한된 경우</li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제5조 (포인트 유효기간 및 소멸)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              포인트는 종류에 따라 아래의 유효기간이 적용되며, 유효기간 경과
              시 자동 소멸됩니다.
            </p>
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <p className="font-semibold">포인트 종류</p>
                <p className="font-semibold">유효기간</p>
                <p className="text-muted-foreground">유료 충전 포인트</p>
                <p className="text-muted-foreground">충전일로부터 1년</p>
                <p className="text-muted-foreground">보너스 포인트</p>
                <p className="text-muted-foreground">지급일로부터 6개월</p>
                <p className="text-muted-foreground">
                  무료 적립 포인트 (활동 보상, 가입 보상 등)
                </p>
                <p className="text-muted-foreground">적립일로부터 3개월</p>
              </div>
            </div>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 text-sm">
              <li>
                포인트 사용 시 무료 적립 → 보너스 → 유료 충전 순으로 차감됩니다.
              </li>
              <li>
                만료 예정 포인트는 만료 30일 전, 7일 전에 알림을 통해
                안내됩니다.
              </li>
              <li>
                소멸된 포인트는 복구 및 환불이 불가합니다.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제6조 (환불 신청 방법)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              환불을 원하시는 경우, 아래 연락처로 환불 신청을 해주시기 바랍니다.
            </p>
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p>
                앱 내 <span className="font-semibold">고객문의</span> 또는{" "}
                <a
                  href="https://open.kakao.com/o/gGXr3Zji"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  카카오톡 오픈채팅
                </a>
                으로 문의해주세요.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              환불 신청 시 결제자 이름, 결제일시, 결제 금액을 함께 알려주시면
              신속하게 처리해 드립니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제7조 (환불 처리 기간)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              환불 신청 접수 후 영업일 기준 3일 이내에 처리되며, 결제 수단에 따라
              환불 금액이 반영되기까지 추가 소요 시간이 발생할 수 있습니다.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>신용카드: 카드사에 따라 3~7 영업일</li>
              <li>계좌이체: 1~3 영업일</li>
              <li>간편결제: 결제 서비스 제공사에 따라 상이</li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제8조 (기타)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              본 환불정책은 전자상거래 등에서의 소비자보호에 관한 법률 및 관련
              법령에 따릅니다. 본 정책에서 정하지 않은 사항은 관련 법령 및
              서비스 이용약관에 따릅니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <div className="mt-8 text-center">
          <Button asChild>
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
