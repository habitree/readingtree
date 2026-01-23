"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Check, Image as ImageIcon, Download, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/utils/image";
import { isClipboardSupported, isMobile, isIOS, downloadImage } from "@/lib/utils/device";
import { copyImageToClipboard, isMobileClipboardSupported } from "@/lib/utils/clipboard";
import { ShareNoteCard } from "./share-note-card";
import type { NoteWithBook } from "@/types/note";
import { getUserById } from "@/app/actions/profile";
import { addStampToBlob } from "@/lib/utils/stamp";

interface SimpleShareDialogProps {
  note: NoteWithBook;
}

/**
 * 사용자 요청 기반 3버튼 공유 다이얼로그
 * 1. 링크 공유: 해당 기록 페이지 링크 복사
 * 2. 카드 복사: 고도화된 카드 디자인 자체를 이미지로 복사
 * 3. 이미지 복사: 업로드된 원본 이미지(필사/사진)만 복사 (이미지 있을 경우에만)
 */
export function SimpleShareDialog({ note }: SimpleShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [cardCopied, setCardCopied] = useState(false);
  const [photoCopied, setPhotoCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; avatar_url: string | null } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null); // 캡처 전용 Hidden 요소 Ref

  // 사용자 정보 가져오기
  useEffect(() => {
    if (open && note.user_id) {
      getUserById(note.user_id).then((userData) => {
        if (userData) {
          setUser(userData);
        }
      });
    }
  }, [open, note.user_id]);

  // 이미지가 있는지 확인 (필사/사진 타입)
  const hasImage =
    (note.type === "transcription" || note.type === "photo") &&
    !!note.image_url;

  // 공유 링크 생성
  const getShareUrl = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    if (note.is_public) {
      return `${baseUrl}/share/notes/${note.id}`;
    }
    return null;
  };

  const shareUrl = getShareUrl();

  // 1. 링크 공유 (링크 복사)
  const handleCopyLink = async () => {
    if (!shareUrl) {
      toast.error("공개 기록만 공유할 수 있습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast.success("링크가 클립보드에 복사되었습니다.");

      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (error) {
      console.error("링크 복사 실패:", error);
      toast.error("링크 복사에 실패했습니다.");
    }
  };

  // 2. 카드 복사 (디자인 캡처) - 완전 재구현
  const handleCopyCardImage = async (e?: React.MouseEvent) => {
    // 중복 클릭 방지
    if (isCapturing) {
      return;
    }

    // PC 버전 레이아웃 (captureRef) 사용
    const targetElement = captureRef.current;

    if (!targetElement) {
      toast.error("카드를 찾을 수 없습니다.");
      return;
    }

    try {
      // 캡처 모드 활성화
      setIsCapturing(true);
      toast.info("카드를 생성하는 중...");

      // Step 0: 폰트 로딩 대기 (텍스트 레이아웃 안정화)
      await document.fonts.ready;

      // Step 1: 모든 이미지가 로드될 때까지 대기
      const images = Array.from(targetElement.querySelectorAll("img")) as HTMLImageElement[];

      console.log(`[카드 복사] ${images.length}개의 이미지 로드 대기 중...`);

      // 이미지 로드 확인 (타임아웃 5초) + img.decode() 추가로 디코딩 완료 보장
      await Promise.all(
        images.map((img, index) => {
          return new Promise<void>(async (resolve) => {
            // 이미 로드된 이미지 - decode()로 디코딩 완료 보장
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
              console.log(`[카드 복사] 이미지 ${index + 1}/${images.length} 이미 로드됨:`, img.src);
              try {
                await img.decode();
                console.log(`[카드 복사] 이미지 ${index + 1}/${images.length} 디코딩 완료`);
              } catch (e) {
                console.warn(`[카드 복사] 이미지 ${index + 1}/${images.length} 디코딩 실패:`, e);
              }
              resolve();
              return;
            }

            console.log(`[카드 복사] 이미지 ${index + 1}/${images.length} 로드 대기 중:`, img.src);

            const timeout = setTimeout(() => {
              console.warn(`[카드 복사] 이미지 ${index + 1}/${images.length} 타임아웃:`, img.src);
              resolve();
            }, 5000);

            img.onload = async () => {
              console.log(`[카드 복사] 이미지 ${index + 1}/${images.length} 로드 완료:`, img.src);
              clearTimeout(timeout);
              // 디코딩 완료 보장
              try {
                await img.decode();
                console.log(`[카드 복사] 이미지 ${index + 1}/${images.length} 디코딩 완료`);
              } catch (e) {
                console.warn(`[카드 복사] 이미지 ${index + 1}/${images.length} 디코딩 실패:`, e);
              }
              resolve();
            };

            img.onerror = (e) => {
              console.error(`[카드 복사] 이미지 ${index + 1}/${images.length} 로드 실패:`, img.src, e);
              clearTimeout(timeout);
              resolve();
            };
          });
        })
      );

      console.log(`[카드 복사] 모든 이미지 로드 완료`);

      // Step 2: 렌더링 안정화 대기 (1000ms로 증가 - 레이아웃 및 폰트 안착)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 3: html2canvas로 캡처
      // [최적화] PC: 2048px 출력 (scale 2.133), 모바일: 1440px 출력 (scale 1.5)
      const CARD_WIDTH = 960;
      const TARGET_WIDTH_PC = 2048;
      const TARGET_WIDTH_MOBILE = 1440;
      const isMobileDevice = isMobile();
      const targetWidth = isMobileDevice ? TARGET_WIDTH_MOBILE : TARGET_WIDTH_PC;
      const calculatedScale = targetWidth / CARD_WIDTH; // PC: 2.133, 모바일: 1.5

      console.log(`[카드 복사] html2canvas 시작 (${isMobileDevice ? '모바일' : 'PC'} 모드 - Scale: ${calculatedScale.toFixed(3)}, 출력 너비: ${targetWidth}px)...`);
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default as any;

      const canvas = await html2canvas(targetElement, {
        scale: calculatedScale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: true,
        imageTimeout: 15000, // 무한 대기 방지 (15초 타임아웃)
        windowWidth: CARD_WIDTH, // 실제 카드 너비와 일치
        scrollX: 0,
        scrollY: 0,
        foreignObjectRendering: false, // 호환성 위해 false 유지
        onclone: (clonedDoc: Document) => {
          // 클론된 문서에서 추가적인 캡처 최적화가 필요하다면 여기서 수행
          console.log("[카드 복사] 클론 생성 완료");
        }
      });

      console.log("[카드 복사] 캔버스 생성 완료:", canvas.width, "x", canvas.height);

      // Step 4: Canvas를 Blob으로 변환
      console.log("[카드 복사] Blob 변환 시작...");
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob: Blob | null) => {
            if (blob) {
              console.log("[카드 복사] Blob 변환 성공:", blob.size, "bytes");
              resolve(blob);
            } else {
              console.error("[카드 복사] Blob 변환 실패");
              reject(new Error("이미지 변환 실패"));
            }
          },
          "image/png",
          0.95
        );
      });

      // Step 5: 클립보드에 복사
      console.log("[카드 복사] 클립보드 복사 시도...");
      if (navigator.clipboard && ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        console.log("[카드 복사] 클립보드 복사 성공!");
        toast.success("카드가 클립보드에 복사되었습니다!");
      } else {
        // Fallback: Blob URL로 다운로드
        console.log("[카드 복사] 클립보드 미지원, 다운로드로 전환");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `readtree-card-${note.id}.png`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("카드 이미지가 다운로드되었습니다!");
      }
    } catch (error) {
      console.error("카드 복사 오류:", error);
      toast.error("카드 복사에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsCapturing(false);
    }
  };

  // 3. 이미지 복사 (원본 이미지)
  const handleCopyPhotoOnly = async () => {
    if (!note.image_url) {
      toast.error("이미지가 없습니다.");
      return;
    }

    try {
      const imageUrl = getImageUrl(note.image_url);

      // 이미지를 이미지 객체로 로드
      const img = new (window as any).Image();
      img.crossOrigin = "anonymous";

      const loadImage = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("이미지 로드에 실패했습니다."));
        img.src = imageUrl;
      });

      await toast.promise(loadImage, {
        loading: '원본 이미지를 준비 중입니다...',
        success: '이미지 준비 완료',
        error: '이미지를 불러오는데 실패했습니다.'
      });

      const loadedImg = await loadImage as HTMLImageElement;

      // Canvas를 사용하여 PNG로 변환 (클립보드 호환성)
      const canvas = document.createElement("canvas");
      canvas.width = loadedImg.width;
      canvas.height = loadedImg.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context를 생성할 수 없습니다.");

      ctx.drawImage(loadedImg, 0, 0);

      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
          toast.error("이미지 변환에 실패했습니다.");
          return;
        }

        // 스템프 적용
        let finalBlob = blob;
        try {
          finalBlob = await addStampToBlob(blob, new Date(note.created_at));
        } catch (stampError) {
          console.error("스탬프 적용 실패, 원본 이미지 사용:", stampError);
          // 스탬프 적용 실패 시 원본 사용
        }

        // 모바일에서 클립보드 복사 시도
        const clipboardSuccess = await copyImageToClipboard(finalBlob, {
          onSuccess: () => {
            setPhotoCopied(true);
            toast.success("원본 이미지가 클립보드에 복사되었습니다.");
            setTimeout(() => {
              setPhotoCopied(false);
            }, 2000);
          },
          onError: (error) => {
            console.log("클립보드 복사 실패, 다운로드로 fallback:", error);
          }
        });

        // 클립보드 복사 실패 시 다운로드로 fallback
        if (!clipboardSuccess) {
          try {
            const filename = `readtree-image-${note.id}-${Date.now()}.png`;
            downloadImage(finalBlob, filename);
            setPhotoCopied(true);
            const isMobileDevice = isMobile();
            toast.success(
              isMobileDevice
                ? "원본 이미지가 다운로드되었습니다. 갤러리에서 확인하세요."
                : "원본 이미지가 다운로드되었습니다."
            );

            setTimeout(() => {
              setPhotoCopied(false);
            }, 2000);
          } catch (downloadError) {
            console.error("다운로드도 실패:", downloadError);
            toast.error("이미지 복사에 실패했습니다. 브라우저를 확인해주세요.");
          }
        }
      }, "image/png");
    } catch (error) {
      console.error("이미지 처리 실패:", error);
      toast.error("이미지 처리에 실패했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          공유
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[98vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
        <div className="bg-white dark:bg-slate-950 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col h-full shadow-2xl border border-slate-200 dark:border-slate-800">
          <DialogHeader className="p-6 sm:p-8 pb-4">
            <DialogTitle className="text-xl sm:text-2xl font-black italic tracking-tighter text-forest-600">Share Your Insight</DialogTitle>
            <DialogDescription className="text-sm font-bold text-slate-400">
              세련된 ReadTree 리딩 카드로 당신의 독서 순간을 공유해보세요.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-2">
            {/* 개편된 3버튼 체계 (상단으로 이동, 슬림하게 변경) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
              {/* 1. 링크 공유 */}
              <Button
                onClick={handleCopyLink}
                variant={linkCopied ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-10 rounded-xl gap-2 text-xs font-bold transition-all duration-300 shadow-sm",
                  linkCopied ? "bg-green-500 hover:bg-green-600 border-none text-white" : "border hover:bg-slate-50 border-slate-200 text-slate-600"
                )}
                disabled={!note.is_public}
              >
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    링크 복사됨
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 text-forest-600" />
                    링크 공유
                  </>
                )}
              </Button>

              {/* 2. 카드 복사 */}
              <Button
                onClick={handleCopyCardImage}
                variant={cardCopied ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-10 rounded-xl gap-2 text-xs font-bold transition-all duration-300 shadow-sm",
                  cardCopied ? "bg-forest-600 hover:bg-forest-700 border-none text-white" : "border hover:bg-slate-50 border-slate-200 text-slate-600"
                )}
              >
                {cardCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    카드 복사됨
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 text-forest-600" />
                    카드 복사
                  </>
                )}
              </Button>

              {/* 3. 이미지 복사 (필사/사진 이미지가 있는 경우에만) */}
              {hasImage && (
                <Button
                  onClick={handleCopyPhotoOnly}
                  variant={photoCopied ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-10 rounded-xl gap-2 text-xs font-bold transition-all duration-300 shadow-sm",
                    photoCopied ? "bg-slate-900 border-none text-white" : "border hover:bg-slate-50 border-slate-200 text-slate-600"
                  )}
                >
                  {photoCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      원본 복사됨
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 text-forest-600" />
                      이미지 복사
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="mb-6 group bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              {/* 중복 UI 제거하고 ShareNoteCard 재사용 (표준 규격 적용) - 화면 표시용 (반응형) */}
              <div ref={cardRef} className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white">
                <ShareNoteCard note={note} hideActions={isCapturing} showTimestamp={false} user={user} />
              </div>
            </div>

            {/* [NEW] 캡처용 Hidden Card (항상 가로 모드 Force, 화면 밖 배치) - 화면 왜곡 방지를 위해 fixed 및 style 조정 */}
            {/* [최적화] 높이 유연 조정 - 최소 높이 620px (960 / 1.55 비율), 콘텐츠에 따라 자동 증가 */}
            <div style={{ position: "fixed", left: "200vw", top: "0", pointerEvents: "none", zIndex: "-50" }}>
              <div
                ref={captureRef}
                className="rounded-3xl overflow-hidden shadow-2xl bg-white w-[960px] transform-gpu"
                style={{ minHeight: "620px" }} // 비율 1.55:1 유지, 콘텐츠 넘침 시 자동 확장
              >
                {/* fixedHorizontal=true로 가로 강제, hideActions=true로 버튼 숨김 */}
                <ShareNoteCard note={note} hideActions={true} showTimestamp={false} user={user} fixedHorizontal={true} />
              </div>
            </div>

            {/* 비공개 상태 안내 */}
            {!note.is_public && (
              <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-3xl">
                <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200 font-medium flex gap-3">
                  <span className="shrink-0 text-xl">⚠️</span>
                  현재 비공개 설정된 기록입니다. 링크로 공유하시려면 기록 설정에서 '공개'로 변경해 주세요. (카드/이미지 복사는 가능합니다)
                </p>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">
              ReadTree System v4.0
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
