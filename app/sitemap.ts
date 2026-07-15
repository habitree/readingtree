import type { MetadataRoute } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/url";

const BASE_URL = getAppUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // 동적 페이지: 공개 노트
  let notePages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createAdminSupabaseClient();
    const { data: publicNotes } = await supabase
      .from("notes")
      .select("id, updated_at")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(1000);

    if (publicNotes) {
      notePages = publicNotes.map((note) => ({
        url: `${BASE_URL}/share/notes/${note.id}`,
        lastModified: new Date(note.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    // 동적 페이지 로드 실패 시 정적 페이지만 반환
  }

  // 동적 페이지: 공개 책장
  let bookshelfPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createAdminSupabaseClient();
    const { data: publicBookshelves } = await supabase
      .from("bookshelves")
      .select("id, updated_at")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(500);

    if (publicBookshelves) {
      bookshelfPages = publicBookshelves.map((shelf) => ({
        url: `${BASE_URL}/share/bookshelves/${shelf.id}`,
        lastModified: new Date(shelf.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }));
    }
  } catch {
    // 동적 페이지 로드 실패 시 무시
  }

  return [...staticPages, ...notePages, ...bookshelfPages];
}
