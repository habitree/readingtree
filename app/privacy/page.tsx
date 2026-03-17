import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * 개인정보처리방침 페이지
 * ReadTree 개인정보처리방침
 */
export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold mb-2">개인정보처리방침</h1>
          <p className="text-muted-foreground">
            최종 수정일: 2025년 12월 28일
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>제1조 (개인정보의 처리 목적)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              회사는 서비스 제공, 서비스 개선, 고객 지원을 위하여 개인정보를 처리합니다. 처리 목적이 변경되는 경우 사전에 동의를 받습니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제2조 (개인정보의 보유기간)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              회사는 법령에 따른 보유기간 또는 이용자로부터 동의받은 기간 내에서 개인정보를 보유합니다. 회원 정보는 탈퇴 시까지, 서비스 이용 기록은 관련 법령에 따라 보유합니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제3조 (처리하는 개인정보의 항목)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              회사는 소셜 로그인을 통해 수집한 이메일, 이름, 프로필 이미지, 서비스 이용 과정에서 생성되는 독서 기록 및 통계 정보, 자동 수집되는 IP 주소, 쿠키, 기기 정보 등을 처리합니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제4조 (개인정보의 제3자 제공)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              회사는 이용자의 동의나 법령에 의한 경우를 제외하고는 개인정보를 제3자에게 제공하지 않습니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제5조 (개인정보처리의 위탁)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              회사는 서비스 제공을 위해 Supabase(인증 및 데이터베이스), Vercel(호스팅) 등에 개인정보 처리업무를 위탁하고 있으며, 위탁업무 수행 목적 외 개인정보 처리금지 등 필요한 조치를 취하고 있습니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제6조 (정보주체의 권리)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리정지를 요구할 수 있으며, 회사는 이에 대해 지체 없이 조치합니다. 권리 행사는 이메일 등을 통해 가능합니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제7조 (개인정보의 파기)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              회사는 개인정보 보유기간 경과 또는 처리목적 달성 등으로 불필요하게 된 개인정보를 지체 없이 파기합니다. 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법으로 파기합니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제8조 (개인정보 보호책임자)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              개인정보 보호 관련 문의사항은 아래로 연락주시기 바랍니다.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-2">개인정보 보호책임자</p>
              <p className="text-sm text-muted-foreground">
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
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제9조 (개인정보의 안전성 확보조치)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              회사는 개인정보의 안전성 확보를 위해 관리적, 기술적, 물리적 보호조치를 취하고 있습니다.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>제10조 (개인정보처리방침 변경)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              이 개인정보처리방침은 2025년 12월 28일부터 적용됩니다. 변경 시 서비스 화면에 공지합니다.
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

