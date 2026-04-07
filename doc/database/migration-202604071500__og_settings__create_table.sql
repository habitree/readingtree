-- OG 이미지 설정 테이블
-- 관리자가 소셜 공유 미리보기 이미지의 브랜드, 색상, 아이콘을 설정

CREATE TABLE IF NOT EXISTS og_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 브랜드
  brand_name TEXT NOT NULL DEFAULT 'Habitree',
  tagline TEXT NOT NULL DEFAULT '읽는 습관이 자라는 곳',
  keywords TEXT NOT NULL DEFAULT '독서 기록 · AI 도우미 · 독서 모임',
  domain TEXT NOT NULL DEFAULT 'habitree.app',
  description TEXT NOT NULL DEFAULT '읽는 습관이 자라는 곳 - 독서 기록, AI 도우미, 독서 모임',

  -- 브랜드 아이콘 (Supabase Storage 공개 URL)
  brand_icon_url TEXT,

  -- 색상
  color_background TEXT NOT NULL DEFAULT '#F5F2ED',
  color_forest TEXT NOT NULL DEFAULT '#1d6b4d',
  color_forest_light TEXT NOT NULL DEFAULT '#36a678',
  color_forest_lighter TEXT NOT NULL DEFAULT '#5ec496',
  color_text_primary TEXT NOT NULL DEFAULT '#1F2933',
  color_text_secondary TEXT NOT NULL DEFAULT '#7B8794',
  color_text_muted TEXT NOT NULL DEFAULT '#9AA5B1',
  color_card_background TEXT NOT NULL DEFAULT '#FFFFFF',
  color_border TEXT NOT NULL DEFAULT '#c3eed4',
  color_earth TEXT NOT NULL DEFAULT '#b48c50',
  color_earth_light TEXT NOT NULL DEFAULT '#d4a574',

  -- 메타
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS 활성화
ALTER TABLE og_settings ENABLE ROW LEVEL SECURITY;

-- 관리자 전체 접근
CREATE POLICY "og_settings_admins_full_access" ON og_settings
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- OG 이미지 생성용 익명 읽기 (활성 설정만)
CREATE POLICY "og_settings_anon_read_active" ON og_settings
  FOR SELECT
  USING (is_active = TRUE);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_og_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_og_settings_updated_at
  BEFORE UPDATE ON og_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_og_settings_updated_at();
