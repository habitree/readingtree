import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * 이용약관 페이지
 * ReadTree 서비스 이용약관
 */
export default function TermsPage() {
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
          <h1 className="text-4xl font-bold mb-2">이용약관</h1>
          <p className="text-muted-foreground">
            최종 수정일: 2026년 3월 10일
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>제1조 (목적)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              본 약관은 ReadTree(이하 "서비스" 또는 "회사")가 제공하는 독서 기록 관리 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제2조 (정의)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">1. "서비스"란</p>
              <p className="text-muted-foreground">
                회사가 제공하는 독서 기록 관리, 독서 목표 설정, 독서 통계 제공, 독서모임 기능 등을 포함한 모든 서비스를 의미합니다.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">2. "이용자"란</p>
              <p className="text-muted-foreground">
                본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자를 의미합니다.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">3. "콘텐츠"란</p>
              <p className="text-muted-foreground">
                이용자가 서비스를 이용하면서 생성한 모든 데이터(책 정보, 기록, 이미지, 텍스트 등)를 의미합니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제3조 (약관의 개정)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              회사는 필요한 경우 본 약관을 개정할 수 있으며, 개정된 약관은 서비스 화면에 공지합니다. 이용자는 개정된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수 있습니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제4조 (서비스의 제공)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              회사는 독서 기록 관리, 독서 목표 설정, 독서 통계 제공, 독서모임 기능 등의 서비스를 제공합니다. 회사는 서비스의 내용을 사전 공지 후 변경할 수 있습니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제5조 (서비스의 중단)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              회사는 시스템 점검, 장애, 통신 두절 등의 사유로 서비스를 일시적으로 중단할 수 있습니다. 회사는 서비스 중단으로 인한 손해에 대해 책임을 지지 않습니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제6조 (이용자의 의무)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              이용자는 다음 행위를 하여서는 안 됩니다: 허위정보 등록, 타인 정보 도용, 저작권 침해, 서비스 방해 행위, 공서양속에 반하는 정보 게시 등 불법적이거나 부적절한 행위.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제7조 (콘텐츠의 저작권)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              이용자가 게시한 콘텐츠의 저작권은 이용자에게 있으며, 이용자는 서비스 정보를 영리목적으로 이용하거나 제3자에게 제공할 수 없습니다. 이용자가 게시한 콘텐츠로 인한 저작권 침해 등 모든 책임은 이용자가 부담합니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제8조 (면책조항)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              회사는 불가항력, 이용자의 귀책사유, 시스템 장애 등으로 인한 서비스 이용 장애 및 손해에 대해 책임을 지지 않습니다. 회사는 이용자가 서비스를 이용하여 얻은 정보나 자료로 인한 손해에 대해 책임을 지지 않으며, 이용자가 기대하는 수익의 상실에 대해서도 책임을 지지 않습니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제9조 (유료 서비스 및 환불)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              회사는 포인트 충전 등 유료 서비스를 제공하며, 결제 및 환불에 관한 상세 사항은 별도의{" "}
              <a href="/refund" className="text-primary hover:underline font-medium">
                환불정책
              </a>
              에 따릅니다.
            </p>
            <p>
              포인트는 결제 즉시 지급되는 디지털 콘텐츠이며, 환불 조건은 환불정책에서 정한 바에 따릅니다. 이벤트, 미션 등으로 무상 지급된 포인트는 환불 대상이 아닙니다.
            </p>
            <p>
              포인트는 종류에 따라 유효기간이 적용됩니다. 유료 충전 포인트는
              충전일로부터 1년, 보너스 포인트는 지급일로부터 6개월, 무료 적립
              포인트는 적립일로부터 3개월이며, 유효기간 경과 시 자동
              소멸됩니다. 포인트 사용 시 무료 적립 → 보너스 → 유료 충전
              순으로 차감됩니다. 상세 사항은{" "}
              <a href="/refund" className="text-primary hover:underline font-medium">
                환불정책
              </a>
              을 참고하시기 바랍니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제10조 (준거법 및 관할법원)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              본 약관과 관련된 분쟁은 대한민국 법을 준거법으로 하며, 관할법원은 회사의 본사 소재지를 관할하는 법원으로 합니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <div className="mt-8 text-center">
          <Button asChild>
            <Link href="/">
              홈으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

