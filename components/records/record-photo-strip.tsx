"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { smartCompressImage } from "@/lib/utils/image";

interface Props {
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  disabled?: boolean;
}

const DEFAULT_MAX = 5;

export function RecordPhotoStrip({ urls, onChange, max = DEFAULT_MAX, disabled }: Props) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots = Math.max(0, max - urls.length);
    if (slots === 0) {
      toast.error(`사진은 ${max}장까지 첨부할 수 있어요.`);
      return;
    }
    const selected = Array.from(files).slice(0, slots);
    setUploadingCount(selected.length);

    const uploaded: string[] = [];
    try {
      for (const file of selected) {
        if (!file.type.startsWith("image/")) {
          toast.error("이미지 파일만 업로드할 수 있어요.");
          continue;
        }
        try {
          const compressed = await smartCompressImage(file, { verbose: false });
          const formData = new FormData();
          formData.append("file", compressed);
          formData.append("type", "photo");
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "업로드 실패");
          const { url } = (await res.json()) as { url: string };
          uploaded.push(url);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "사진 업로드에 실패했어요.");
        }
      }
      if (uploaded.length > 0) {
        onChange([...urls, ...uploaded].slice(0, max));
      }
    } finally {
      setUploadingCount(0);
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  };

  const handleRemove = (idx: number) => {
    onChange(urls.filter((_, i) => i !== idx));
  };

  const canAddMore = urls.length < max;

  return (
    <div className="space-y-2">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {urls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {urls.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
            >
              <Image src={url} alt={`사진 ${i + 1}`} fill sizes="80px" className="object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                  aria-label={`사진 ${i + 1} 제거`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              {i === 0 && urls.length > 1 && (
                <span className="absolute bottom-0.5 left-0.5 rounded bg-emerald-600/90 px-1 text-[10px] font-medium text-white">
                  대표
                </span>
              )}
            </div>
          ))}
          {uploadingCount > 0 &&
            Array.from({ length: uploadingCount }).map((_, i) => (
              <div
                key={`up-${i}`}
                className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
              >
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              </div>
            ))}
        </div>
      )}

      {canAddMore && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cameraRef.current?.click()}
            disabled={disabled || uploadingCount > 0}
          >
            <Camera className="mr-1 h-3 w-3" />
            카메라
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => galleryRef.current?.click()}
            disabled={disabled || uploadingCount > 0}
          >
            <ImagePlus className="mr-1 h-3 w-3" />
            앨범 ({urls.length}/{max})
          </Button>
        </div>
      )}
    </div>
  );
}
