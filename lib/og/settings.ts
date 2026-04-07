import { createOgAnonSupabaseClient } from "./utils";
import { OG_BRAND, OG_COLORS } from "./constants";
import type { OgConfig } from "@/types/og-settings";

/** 기본 OgConfig (DB 설정 없을 때 fallback) */
const DEFAULT_OG_CONFIG: OgConfig = {
  brand: {
    name: OG_BRAND.name,
    tagline: OG_BRAND.tagline,
    keywords: OG_BRAND.keywords,
    domain: OG_BRAND.domain,
    description: OG_BRAND.description,
  },
  colors: { ...OG_COLORS },
  brandIconUrl: null,
};

/** 인메모리 캐시 (1시간 TTL) */
let cachedConfig: OgConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

/**
 * OG 설정 조회 (인메모리 1시간 캐시)
 * - OG 이미지 라우트에서 호출
 * - DB 설정 없으면 하드코딩 기본값 반환
 * - 소셜 크롤러만 요청하므로 부하 미미
 */
export async function getOgConfig(): Promise<OgConfig> {
  const now = Date.now();
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const supabase = createOgAnonSupabaseClient();
    const { data } = await supabase
      .from("og_settings")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!data) {
      cachedConfig = DEFAULT_OG_CONFIG;
      cacheTimestamp = now;
      return DEFAULT_OG_CONFIG;
    }

    const config: OgConfig = {
      brand: {
        name: data.brand_name,
        tagline: data.tagline,
        keywords: data.keywords,
        domain: data.domain,
        description: data.description,
      },
      colors: {
        background: data.color_background,
        forest: data.color_forest,
        forestLight: data.color_forest_light,
        forestLighter: data.color_forest_lighter,
        textPrimary: data.color_text_primary,
        textSecondary: data.color_text_secondary,
        textMuted: data.color_text_muted,
        cardBackground: data.color_card_background,
        border: data.color_border,
        earth: data.color_earth,
        earthLight: data.color_earth_light,
      },
      brandIconUrl: data.brand_icon_url,
    };

    cachedConfig = config;
    cacheTimestamp = now;
    return config;
  } catch {
    return DEFAULT_OG_CONFIG;
  }
}

/** 캐시 무효화 (설정 저장 후 호출) */
export function invalidateOgConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
}
