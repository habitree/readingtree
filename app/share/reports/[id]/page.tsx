import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppUrl } from "@/lib/utils/url";
import { isValidUUID } from "@/lib/utils/validation";
import { getPublicReport, getPublicReportNotes } from "@/app/actions/ai/report";
import { ShareCtaSection } from "@/components/share/share-cta-section";
import { SharedReportView } from "./shared-report-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const shareId = resolvedParams.id;

  if (!shareId || typeof shareId !== "string" || !isValidUUID(shareId)) {
    return { title: "리포트를 찾을 수 없습니다" };
  }

  const report = await getPublicReport(shareId);
  if (!report) {
    return { title: "리포트를 찾을 수 없습니다" };
  }

  const baseUrl = getAppUrl();
  const shareUrl = `${baseUrl}/share/reports/${shareId}`;
  const ogImageUrl = `${baseUrl}/share/reports/${shareId}/opengraph-image`;

  const description = `${report.bookAuthor || ""} | AI 분석 기반 독서 리포트 (기록 ${report.noteCount}개)`.trim();

  return {
    title: `AI 독서 리포트 - ${report.bookTitle}`,
    description,
    openGraph: {
      title: `AI 독서 리포트 - ${report.bookTitle}`,
      description,
      type: "article",
      url: shareUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${report.bookTitle} AI 독서 리포트`,
        },
      ],
      siteName: "ReadTree",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title: `AI 독서 리포트 - ${report.bookTitle}`,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ShareReportPage({
  params,
}: {
  params: { id: string };
}) {
  const resolvedParams = await params;
  const shareId = resolvedParams.id;

  if (!shareId || typeof shareId !== "string" || !isValidUUID(shareId)) {
    notFound();
  }

  const report = await getPublicReport(shareId);
  if (!report) {
    notFound();
  }

  // 기록도 함께 공유된 경우 공개 노트 조회
  const publicNotes =
    report.includeNotes && report.noteIds.length > 0
      ? await getPublicReportNotes(report.noteIds)
      : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary/20">
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        {/* 상단 액션 바 */}
        <div className="flex items-center justify-between mb-10">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-primary"
          >
            <Link href="/">
              <ChevronLeft className="w-4 h-4 mr-1" />
              메인으로
            </Link>
          </Button>
          <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            AI Reading Report
          </div>
        </div>

        {/* 리포트 렌더링 */}
        <SharedReportView report={report} publicNotes={publicNotes} />

        {/* CTA */}
        <ShareCtaSection variant="note" />
      </div>
    </div>
  );
}
