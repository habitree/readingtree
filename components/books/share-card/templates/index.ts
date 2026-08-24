/**
 * 공유 카드 템플릿 레지스트리 — 노출 순서대로
 */
import { newspaperTemplate } from "./t03-newspaper";
import { letterTemplate } from "./t06-letter";
import { linerNotesTemplate } from "./t07-liner-notes";
import { watercolorTemplate } from "./t08-watercolor";
import { editorialTemplate } from "./t10-editorial";
import type { ShareCardTemplateDef } from "./types";

export const SHARE_CARD_TEMPLATES: ShareCardTemplateDef[] = [
  newspaperTemplate,
  letterTemplate,
  linerNotesTemplate,
  watercolorTemplate,
  editorialTemplate,
];
