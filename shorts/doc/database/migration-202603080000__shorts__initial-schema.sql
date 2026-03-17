-- ============================================================
-- Habitree Shorts — Initial Schema Migration
-- 202603080000 | 11개 테이블 (5 레이어)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- LAYER A: 시리즈 / 콘텐츠 관리
-- ============================================================

-- A1: series — 14개 시리즈 메타데이터
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,                        -- e.g. 'daily-quote'
  name TEXT NOT NULL,                         -- 한글 이름
  description TEXT,
  width INT NOT NULL DEFAULT 1080,
  height INT NOT NULL DEFAULT 1920,
  fps INT NOT NULL DEFAULT 30,
  duration_seconds INT NOT NULL DEFAULT 30,
  duration_in_frames INT NOT NULL DEFAULT 900,
  props_schema JSONB,                         -- JSON Schema for content validation
  remotion_id TEXT,                           -- Remotion composition ID
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A2: contents — 모든 시리즈의 콘텐츠 통합 저장
CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id TEXT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  title TEXT,                                 -- 관리용 제목
  props JSONB NOT NULL DEFAULT '{}',          -- 시리즈별 렌더링 props
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'review', 'approved', 'rendering',
      'rendered', 'scheduled', 'published', 'archived'
    )),
  source TEXT DEFAULT 'manual'                -- manual | sync | ai_generated | pipeline
    CHECK (source IN ('manual', 'sync', 'ai_generated', 'pipeline')),
  source_ref TEXT,                            -- 원본 참조 (e.g. main DB note ID)
  quality_score REAL,                         -- 0.0 ~ 1.0
  version INT NOT NULL DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contents_series ON contents(series_id);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_series_status ON contents(series_id, status);

-- A3: text_fragments — 재사용 가능한 문구 조각
CREATE TABLE IF NOT EXISTS text_fragments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL                      -- hook | cta | quote | emotion_tag | transition | tip
    CHECK (category IN ('hook', 'cta', 'quote', 'emotion_tag', 'transition', 'tip')),
  text TEXT NOT NULL,
  series_ids TEXT[] DEFAULT '{}',             -- 적용 가능한 시리즈 목록
  usage_count INT NOT NULL DEFAULT 0,
  performance_score REAL,                     -- 성과 기반 점수
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_text_fragments_category ON text_fragments(category);

-- ============================================================
-- LAYER B: 에셋 관리
-- ============================================================

-- B1: assets — 미디어 에셋 통합
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL                          -- screenshot | audio | cover_image | bgm | tts | video
    CHECK (type IN ('screenshot', 'audio', 'cover_image', 'bgm', 'tts', 'video')),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,                 -- Supabase Storage path
  mime_type TEXT,
  file_size_bytes BIGINT,
  duration_ms INT,                            -- 오디오/비디오용
  width INT,                                  -- 이미지/비디오용
  height INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- B2: content_assets — 콘텐츠-에셋 M:N 연결
CREATE TABLE IF NOT EXISTS content_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'primary'         -- primary | thumbnail | tts | bgm | screenshot_pc | screenshot_mobile
    CHECK (role IN ('primary', 'thumbnail', 'tts', 'bgm', 'screenshot_pc', 'screenshot_mobile')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, asset_id, role)
);

CREATE INDEX IF NOT EXISTS idx_content_assets_content ON content_assets(content_id);

-- ============================================================
-- LAYER C: 제작 파이프라인
-- ============================================================

-- C1: pipeline_runs — 파이프라인 실행 기록
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES contents(id) ON DELETE SET NULL,
  series_id TEXT NOT NULL REFERENCES series(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'fetching', 'scripting', 'tts',
      'rendering', 'post_processing', 'uploading',
      'completed', 'failed'
    )),
  step_current TEXT,                          -- 현재 실행 중인 단계
  step_progress JSONB DEFAULT '{}',           -- 각 단계별 진행 상태
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',             -- 결과물 URL 등
  cost_usd REAL DEFAULT 0,                   -- OpenAI/TTS 비용 추적
  error_message TEXT,
  error_stack TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INT
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_content ON pipeline_runs(content_id);

-- ============================================================
-- LAYER D: 배포 / 분석
-- ============================================================

-- D1: publications — 플랫폼별 배포 기록
CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  pipeline_run_id UUID REFERENCES pipeline_runs(id) ON DELETE SET NULL,
  platform TEXT NOT NULL                      -- youtube | tiktok | reels | all
    CHECK (platform IN ('youtube', 'tiktok', 'reels', 'all')),
  platform_video_id TEXT,                     -- 플랫폼 영상 ID
  platform_url TEXT,                          -- 플랫폼 영상 URL
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploading', 'processing', 'published', 'failed', 'removed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',                -- 제목, 설명, 태그 등
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publications_content ON publications(content_id);
CREATE INDEX IF NOT EXISTS idx_publications_platform ON publications(platform, status);

-- D2: analytics_snapshots — 일별 성과 스냅샷
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publication_id UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  views INT NOT NULL DEFAULT 0,
  likes INT NOT NULL DEFAULT 0,
  comments INT NOT NULL DEFAULT 0,
  shares INT NOT NULL DEFAULT 0,
  watch_time_seconds INT DEFAULT 0,
  completion_rate REAL,                       -- 완주율 (0.0 ~ 1.0)
  ctr REAL,                                   -- Click-through rate
  reach INT DEFAULT 0,
  impressions INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(publication_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_pub_date ON analytics_snapshots(publication_id, snapshot_date);

-- ============================================================
-- LAYER E: 템플릿 / 스케줄
-- ============================================================

-- E1: content_templates — 시리즈별 콘텐츠 생성 템플릿
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id TEXT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_props JSONB NOT NULL DEFAULT '{}', -- 기본 props 템플릿
  ai_prompt TEXT,                             -- AI 생성용 프롬프트
  ai_model TEXT DEFAULT 'gpt-4o',
  variables JSONB DEFAULT '[]',               -- 템플릿 변수 정의
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_series ON content_templates(series_id);

-- E2: schedules — 자동 발행 스케줄
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id TEXT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,              -- e.g. '0 9 * * *' (매일 09:00)
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
  content_strategy TEXT NOT NULL DEFAULT 'random'
    CHECK (content_strategy IN ('random', 'sequential', 'performance_based', 'ai_selected')),
  template_id UUID REFERENCES content_templates(id) ON DELETE SET NULL,
  platforms TEXT[] DEFAULT '{youtube}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_next_run ON schedules(next_run_at) WHERE is_active = true;

-- E3: sync_log — 메인 DB → 쇼츠 DB 동기화 추적
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_table TEXT NOT NULL,                 -- e.g. 'notes', 'books'
  source_id TEXT NOT NULL,                    -- 원본 레코드 ID
  target_table TEXT NOT NULL DEFAULT 'contents',
  target_id UUID REFERENCES contents(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL DEFAULT 'full'
    CHECK (sync_type IN ('full', 'incremental', 'manual')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'syncing', 'completed', 'failed', 'skipped')),
  changes JSONB DEFAULT '{}',                 -- 동기화된 필드 변경 내역
  error_message TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_source ON sync_log(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);

-- ============================================================
-- Updated_at 자동 갱신 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'series', 'contents', 'text_fragments',
    'content_templates', 'schedules'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I; '
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- RLS Policies (기본: service_role 전용 — 공개 클라이언트 접근 없음)
-- ============================================================

ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- service_role은 RLS를 bypass하므로 별도 정책 불필요
-- 추후 대시보드 등 클라이언트 접근이 필요하면 정책 추가

-- ============================================================
-- 완료
-- ============================================================
