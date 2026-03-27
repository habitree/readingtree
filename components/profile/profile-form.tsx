"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateProfile, updateProfileImage } from "@/app/actions/profile";
import { getUserBooks } from "@/app/actions/books";
import { getNotes } from "@/app/actions/notes";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  User,
  BookHeart,
  Quote,
  Eye,
  EyeOff,
  Library,
  PenLine,
  Search,
  BookOpen,
  Check,
} from "lucide-react";
import { getImageUrl, smartCompressImage, formatFileSize } from "@/lib/utils/image";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@/types/user";
import type { NoteWithBook } from "@/types/note";

interface ProfileFormProps {
  user: UserType;
}

/**
 * 프로필 수정 폼 컴포넌트
 * 프로필 정보 수정 및 이미지 업로드
 */
export function ProfileForm({ user }: ProfileFormProps) {
  const { t } = useTranslation();
  const { refreshProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    reading_goal: user.reading_goal,
    bio: user.bio || "",
    favorite_book: user.favorite_book || "",
    favorite_quote: user.favorite_quote || "",
    is_profile_public: user.is_profile_public ?? true,
  });
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);

  // 피커 상태
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [quotePickerOpen, setQuotePickerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || isUploading) return;

    setIsSubmitting(true);

    try {
      await updateProfile({
        name: formData.name,
        reading_goal: formData.reading_goal,
        bio: formData.bio,
        favorite_book: formData.favorite_book,
        favorite_quote: formData.favorite_quote,
        is_profile_public: formData.is_profile_public,
      });

      toast.success(t("profile.saved"));
      await refreshProfile();
      router.refresh();
    } catch (error) {
      console.error("프로필 수정 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("profile.profileUpdateFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("profile.unsupportedFileFormat"));
      return;
    }

    setIsUploading(true);
    try {
      let fileToUpload = file;
      try {
        fileToUpload = await smartCompressImage(file, {
          compressionThreshold: 500 * 1024,
          maxWidth: 512,
          maxHeight: 512,
          targetSizeBytes: 500 * 1024,
          minQuality: 0.6,
          maxQuality: 0.9,
          verbose: true,
        });
      } catch (compressError) {
        console.error("이미지 압축 오류:", compressError);
      }

      const result = await updateProfileImage(fileToUpload);
      setAvatarUrl(result.avatarUrl);
      toast.success(t("profile.saved"));
      await refreshProfile();
      router.refresh();
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("profile.imageUploadFailed")
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 프로필 이미지 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.profileImage")}</CardTitle>
          <CardDescription>
            {t("profile.profileImageDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={avatarUrl || undefined}
                alt={user.name}
              />
              <AvatarFallback>
                {user.name[0]?.toUpperCase() || <User className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
                id="avatar-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("profile.uploading")}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {t("profile.changeImage")}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("profile.recommendedSize")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 프로필 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.profileInfoTitle")}</CardTitle>
          <CardDescription>
            {t("profile.profileInfoDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("profile.nameLabel")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t("profile.namePlaceholder")}
                required
                maxLength={100}
                disabled={isSubmitting || isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t("profile.bioLabel")}</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder={t("profile.bioPlaceholder")}
                rows={3}
                maxLength={200}
                disabled={isSubmitting || isUploading}
              />
              <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/200</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reading_goal">{t("profile.readingGoalLabel")}</Label>
              <Input
                id="reading_goal"
                type="number"
                min="1"
                max="100"
                value={formData.reading_goal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reading_goal: parseInt(e.target.value, 10) || 0,
                  })
                }
                placeholder={t("profile.readingGoalPlaceholder")}
                required
                disabled={isSubmitting || isUploading}
              />
              <p className="text-xs text-muted-foreground">
                {t("profile.readingGoalHint")}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                fullWidth
                size="lg"
              >
                {isSubmitting || isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSubmitting ? t("profile.saving") : t("profile.uploading")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 독서 프로필 (인생책 + 좋아하는 문구) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookHeart className="h-5 w-5" />
            {t("profile.readingProfileTitle")}
          </CardTitle>
          <CardDescription>
            {t("profile.readingProfileDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 인생책 */}
            <div className="space-y-2">
              <Label htmlFor="favorite_book" className="flex items-center gap-1.5">
                <BookHeart className="h-3.5 w-3.5 text-primary" />
                {t("profile.favoriteBookLabel")}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="favorite_book"
                  value={formData.favorite_book}
                  onChange={(e) =>
                    setFormData({ ...formData, favorite_book: e.target.value })
                  }
                  placeholder={t("profile.favoriteBookPlaceholder")}
                  maxLength={100}
                  disabled={isSubmitting}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 text-xs"
                  onClick={() => setBookPickerOpen(true)}
                >
                  <Library className="h-3.5 w-3.5" />
                  내 서재
                </Button>
              </div>
            </div>

            {/* 좋아하는 문구 */}
            <div className="space-y-2">
              <Label htmlFor="favorite_quote" className="flex items-center gap-1.5">
                <Quote className="h-3.5 w-3.5 text-primary" />
                {t("profile.favoriteQuoteLabel")}
              </Label>
              <Textarea
                id="favorite_quote"
                value={formData.favorite_quote}
                onChange={(e) =>
                  setFormData({ ...formData, favorite_quote: e.target.value })
                }
                placeholder={t("profile.favoriteQuotePlaceholder")}
                rows={3}
                maxLength={300}
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setQuotePickerOpen(true)}
                >
                  <PenLine className="h-3.5 w-3.5" />
                  내 기록에서 선택
                </Button>
                <p className="text-xs text-muted-foreground">{formData.favorite_quote.length}/300</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                fullWidth
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("profile.saving")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 프로필 공개 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {formData.is_profile_public ? (
              <Eye className="h-5 w-5 text-green-600" />
            ) : (
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            )}
            {t("profile.privacySettingsTitle")}
          </CardTitle>
          <CardDescription>
            {t("profile.privacySettingsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_profile_public">{t("profile.profilePublicLabel")}</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.is_profile_public
                    ? t("profile.profilePublicOnDesc")
                    : t("profile.profilePublicOffDesc")}
                </p>
              </div>
              <Switch
                id="is_profile_public"
                checked={formData.is_profile_public}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_profile_public: checked })
                }
              />
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                fullWidth
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("profile.saving")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 내 서재에서 책 선택 다이얼로그 */}
      <BookPickerDialog
        open={bookPickerOpen}
        onOpenChange={setBookPickerOpen}
        onSelect={(bookTitle) => {
          setFormData({ ...formData, favorite_book: bookTitle });
          setBookPickerOpen(false);
        }}
      />

      {/* 내 기록에서 문구 선택 다이얼로그 */}
      <QuotePickerDialog
        open={quotePickerOpen}
        onOpenChange={setQuotePickerOpen}
        onSelect={(quote) => {
          setFormData({ ...formData, favorite_quote: quote.slice(0, 300) });
          setQuotePickerOpen(false);
        }}
      />
    </div>
  );
}

// =============================================================================
// 내 서재에서 책 선택 다이얼로그
// =============================================================================

function BookPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (bookTitle: string) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      loadBooks();
    }
  }, [open]);

  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const data = await getUserBooks();
      setBooks(data as any);
    } catch {
      toast.error("서재를 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = search
    ? books.filter((b) => {
        const title = String(b.title ?? "").toLowerCase();
        const author = String(b.author ?? "").toLowerCase();
        const q = search.toLowerCase();
        return title.includes(q) || author.includes(q);
      })
    : books;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            내 서재에서 선택
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="책 제목이나 저자 검색"
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {search ? "검색 결과가 없습니다" : "등록된 책이 없습니다"}
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {filtered.map((book) => (
                <button
                  key={String(book.id)}
                  type="button"
                  onClick={() => {
                    const title = String(book.title ?? "");
                    const author = String(book.author ?? "");
                    onSelect(author ? `${title} — ${author}` : title);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent text-left transition-colors"
                >
                  {book.cover_image_url ? (
                    <img
                      src={String(book.cover_image_url)}
                      alt=""
                      className="w-10 h-14 rounded object-cover shrink-0 border"
                    />
                  ) : (
                    <div className="w-10 h-14 rounded bg-muted flex items-center justify-center shrink-0 border">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{String(book.title)}</p>
                    {book.author && (
                      <p className="text-xs text-muted-foreground truncate">{String(book.author)}</p>
                    )}
                  </div>
                  <Check className="h-4 w-4 text-transparent group-hover:text-primary shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// 내 기록에서 문구 선택 다이얼로그
// =============================================================================

function QuotePickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (quote: string) => void;
}) {
  const [notes, setNotes] = useState<NoteWithBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      loadNotes();
    }
  }, [open]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      // 인용(quote)과 메모(memo) 타입의 노트를 가져옴
      const data = await getNotes(undefined, undefined, undefined, true);
      setNotes(data);
    } catch {
      toast.error("기록을 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // 내용이 있는 노트만 필터 + 검색
  const filtered = notes
    .filter((n) => n.content && n.content.trim().length > 0)
    .filter((n) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (n.content?.toLowerCase().includes(q)) ||
        (n.book?.title?.toLowerCase().includes(q))
      );
    });

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quote: "인용",
      memo: "메모",
      photo: "사진",
      transcription: "필사",
      progress: "진행",
    };
    return labels[type] || type;
  };

  const typeColor = (type: string) => {
    const colors: Record<string, string> = {
      quote: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30",
      memo: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30",
      photo: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/30",
      transcription: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30",
      progress: "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950/30",
    };
    return colors[type] || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            내 기록에서 선택
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="기록 내용이나 책 제목 검색"
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {search ? "검색 결과가 없습니다" : "내용이 있는 기록이 없습니다"}
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {filtered.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onSelect(note.content ?? "")}
                  className="w-full p-3 rounded-lg hover:bg-accent text-left transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", typeColor(note.type))}>
                      {typeLabel(note.type)}
                    </span>
                    {note.book?.title && (
                      <span className="text-xs text-muted-foreground truncate">
                        {note.book.title}
                      </span>
                    )}
                  </div>
                  <p className="text-sm line-clamp-3 text-foreground/80">
                    {note.type === "quote" ? `"${note.content}"` : note.content}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
