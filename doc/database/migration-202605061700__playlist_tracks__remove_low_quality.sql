-- =============================================================================
-- migration-202605061700__playlist_tracks__remove_low_quality.sql
-- (Supabase Music DB)
--
-- 목적:
--   저품질 트랙(109~127kbps) 5곡을 모든 플레이리스트에서 제거.
--   tracks 테이블 행 자체는 보존 — 향후 고품질 mp3 로 교체 시 다시 매핑 가능.
--
-- 식별 (ffprobe 측정 — 2026-05-06):
--   track-066 / beethoven-symphony7-4.mp3            → 109 kbps (energetic)
--   track-120 / mendelssohn-venetian-gondola.mp3     → 111 kbps (night)
--   track-143 / mozart-divertimento-k136-andante.mp3 → 111 kbps (calm)
--   track-119 / brahms-intermezzo-op118-2.mp3        → 117 kbps (night)
--   track-021 / satie-gymnopedie-1.mp3               → 127 kbps (night)
--
-- 정책:
--   품질 기준 128 kbps 이상. 저품질 트랙은 큐레이션 풀에서 제외하여
--   "전체" 셀 / 플레이리스트 양쪽 모두 노출되지 않게 함.
--
-- Idempotent: WHERE 절로 안전.
-- =============================================================================

DELETE FROM public.playlist_tracks
WHERE track_id IN (
  'track-021',  -- 127 kbps
  'track-066',  -- 109 kbps
  'track-119',  -- 117 kbps
  'track-120',  -- 111 kbps
  'track-143'   -- 111 kbps
);
