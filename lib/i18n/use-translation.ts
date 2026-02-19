import { useLanguageStore } from "./store";
import { ko, en, type Dictionary } from "./dictionaries";

const dictionaries: Record<string, Dictionary> = { ko, en };

type NestedKeyOf<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<Dictionary>;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] != null ? String(params[key]) : `{${key}}`
  );
}

/**
 * 번역 훅
 *
 * @example
 * const { t, locale, toggleLocale } = useTranslation();
 * t("nav.home") // "홈" or "Home"
 * t("style.streak.building", { count: 7 }) // "7일째 가꾸고 있어요" or "Growing for 7 days"
 */
export function useTranslation() {
  const { locale, setLocale, toggleLocale } = useLanguageStore();
  const dict = dictionaries[locale] ?? ko;

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const value = getNestedValue(dict as unknown as Record<string, unknown>, key);
    return interpolate(value, params);
  }

  return { t, locale, setLocale, toggleLocale } as const;
}
