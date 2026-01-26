-- ============================================================
-- UX 개선: 업적/온보딩/그룹활동 시스템
-- 생성일: 2026-01-26
-- 설명: 사용자 참여도 향상을 위한 업적, 온보딩, 그룹 활동 통계 테이블
-- ============================================================

-- 1. 온보딩 체크리스트 추적을 위한 users 테이블 업데이트
-- (Endowed Progress Effect - 시작된 진행이 완료율 82% 향상)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_checklist JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.users.onboarding_checklist IS '온보딩 체크리스트 완료 상태 추적 (예: {"first_book": true, "first_note": true})';

-- 2. 사용자 업적 테이블
-- (Collection Mechanics - 수집 욕구가 목표 지향 행동 강화)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

COMMENT ON TABLE public.user_achievements IS '사용자가 획득한 업적 배지';
COMMENT ON COLUMN public.user_achievements.achievement_type IS '업적 유형 (first_week, book_worm, social_butterfly, note_master 등)';
COMMENT ON COLUMN public.user_achievements.tier IS '업적 등급 (bronze, silver, gold, platinum)';
COMMENT ON COLUMN public.user_achievements.metadata IS '추가 메타데이터 (진행률, 관련 데이터 등)';

-- user_achievements RLS 정책
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_achievements_select_own" ON public.user_achievements;
CREATE POLICY "user_achievements_select_own" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_achievements_insert_own" ON public.user_achievements;
CREATE POLICY "user_achievements_insert_own" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_achievements_update_own" ON public.user_achievements;
CREATE POLICY "user_achievements_update_own" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_achievements_delete_own" ON public.user_achievements;
CREATE POLICY "user_achievements_delete_own" ON public.user_achievements
  FOR DELETE USING (auth.uid() = user_id);

-- 3. 그룹 활동 통계 캐시 테이블
-- (Social Comparison Theory - 동료 비교가 동기부여)
CREATE TABLE IF NOT EXISTS public.group_activity_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  notes_count INTEGER DEFAULT 0,
  books_completed INTEGER DEFAULT 0,
  reading_minutes INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  trend VARCHAR(10) DEFAULT 'same' CHECK (trend IN ('up', 'down', 'same')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id, week_start)
);

COMMENT ON TABLE public.group_activity_stats IS '그룹 내 주간 활동 통계 (리더보드용)';
COMMENT ON COLUMN public.group_activity_stats.week_start IS '주간 시작일 (월요일)';
COMMENT ON COLUMN public.group_activity_stats.notes_count IS '해당 주 기록 수';
COMMENT ON COLUMN public.group_activity_stats.books_completed IS '해당 주 완독 수';
COMMENT ON COLUMN public.group_activity_stats.rank IS '그룹 내 순위';
COMMENT ON COLUMN public.group_activity_stats.trend IS '이전 주 대비 순위 변동';

-- group_activity_stats RLS 정책
ALTER TABLE public.group_activity_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_activity_stats_select_member" ON public.group_activity_stats;
CREATE POLICY "group_activity_stats_select_member" ON public.group_activity_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_activity_stats.group_id
        AND gm.user_id = auth.uid()
        AND gm.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "group_activity_stats_insert_member" ON public.group_activity_stats;
CREATE POLICY "group_activity_stats_insert_member" ON public.group_activity_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "group_activity_stats_update_own" ON public.group_activity_stats;
CREATE POLICY "group_activity_stats_update_own" ON public.group_activity_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. 완독 성찰 테이블
-- (Elaborative Interrogation - 깊은 처리가 기억과 의미 증가)
CREATE TABLE IF NOT EXISTS public.book_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_book_id UUID NOT NULL REFERENCES public.user_books(id) ON DELETE CASCADE,
  favorite_quote TEXT,
  reflection TEXT,
  recommendation TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, user_book_id)
);

COMMENT ON TABLE public.book_reflections IS '책 완독 후 성찰 기록';
COMMENT ON COLUMN public.book_reflections.favorite_quote IS '가장 기억에 남는 문장';
COMMENT ON COLUMN public.book_reflections.reflection IS '달라진 생각/깨달음';
COMMENT ON COLUMN public.book_reflections.recommendation IS '추천 여부 및 이유';
COMMENT ON COLUMN public.book_reflections.rating IS '별점 (1-5)';

-- book_reflections RLS 정책
ALTER TABLE public.book_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "book_reflections_select_own" ON public.book_reflections;
CREATE POLICY "book_reflections_select_own" ON public.book_reflections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "book_reflections_insert_own" ON public.book_reflections;
CREATE POLICY "book_reflections_insert_own" ON public.book_reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "book_reflections_update_own" ON public.book_reflections;
CREATE POLICY "book_reflections_update_own" ON public.book_reflections
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "book_reflections_delete_own" ON public.book_reflections;
CREATE POLICY "book_reflections_delete_own" ON public.book_reflections
  FOR DELETE USING (auth.uid() = user_id);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON public.user_achievements(achievement_type);

CREATE INDEX IF NOT EXISTS idx_group_activity_stats_group_week ON public.group_activity_stats(group_id, week_start);
CREATE INDEX IF NOT EXISTS idx_group_activity_stats_user_id ON public.group_activity_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_book_reflections_user_id ON public.book_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_book_reflections_user_book_id ON public.book_reflections(user_book_id);

-- 6. updated_at 트리거 (기존 함수 활용)
DROP TRIGGER IF EXISTS set_updated_at_group_activity_stats ON public.group_activity_stats;
CREATE TRIGGER set_updated_at_group_activity_stats
  BEFORE UPDATE ON public.group_activity_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_book_reflections ON public.book_reflections;
CREATE TRIGGER set_updated_at_book_reflections
  BEFORE UPDATE ON public.book_reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'UX 개선 마이그레이션 완료: user_achievements, group_activity_stats, book_reflections 테이블 생성됨';
END $$;
