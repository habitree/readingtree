-- ============================================================
-- 재즈 카테고리 추가 마이그레이션
-- 대상: supabase-music 프로젝트 (amqywfemuxghcosexqct)
-- 날짜: 2026-04-02
-- ============================================================

-- 1. Storage 버킷 (이미 생성된 경우 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('jazz-music', 'jazz-music', true, 10485760, ARRAY['audio/mpeg', 'audio/mp3'])
ON CONFLICT (id) DO NOTHING;

-- Storage 읽기 정책
CREATE POLICY IF NOT EXISTS "Public read jazz-music" ON storage.objects
FOR SELECT USING (bucket_id = 'jazz-music');

-- 2. 재즈 트랙 20곡 (Supabase Storage에 업로드된 Mixkit CC0 음원)
INSERT INTO tracks (id, title, composer, performer, source_url, is_external, duration_seconds, moods, era, instruments, intensity, sort_order)
VALUES
  ('track-147', 'Beautiful Dream', 'Diego Nava', 'Diego Nava', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/beautiful-dream.mp3', true, 97, '{"peaceful","relaxing"}', 'jazz', '{"piano","upright_bass"}', 1, 147),
  ('track-148', 'Latin Lovers', 'Ahjay Stelino', 'Ahjay Stelino', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/latin-lovers.mp3', true, 95, '{"relaxing","bright"}', 'jazz', '{"guitar","piano"}', 1, 148),
  ('track-149', 'Romantic 01', 'Lily J', 'Lily J', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/romantic-01.mp3', true, 99, '{"emotional","peaceful"}', 'jazz', '{"piano"}', 1, 149),
  ('track-150', 'Romantic Vacation', 'Ahjay Stelino', 'Ahjay Stelino', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/romantic-vacation.mp3', true, 112, '{"relaxing","peaceful"}', 'jazz', '{"piano","guitar"}', 1, 150),
  ('track-151', 'Smooth Like Jazz', 'Ahjay Stelino', 'Ahjay Stelino', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/smooth-like-jazz.mp3', true, 158, '{"relaxing","focus"}', 'jazz', '{"piano","saxophone"}', 1, 151),
  ('track-152', 'Chill Bro', 'Diego Nava', 'Diego Nava', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/chill-bro.mp3', true, 100, '{"relaxing","peaceful"}', 'jazz', '{"piano","upright_bass"}', 1, 152),
  ('track-153', 'Lounging By Moonlight', 'Ahjay Stelino', 'Ahjay Stelino', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/lounging-by-moonlight.mp3', true, 94, '{"contemplative","peaceful"}', 'jazz', '{"piano","saxophone"}', 1, 153),
  ('track-154', 'Soul Jazz', 'Francisco Alvear', 'Francisco Alvear', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/soul-jazz.mp3', true, 135, '{"emotional","relaxing"}', 'jazz', '{"saxophone","piano","drums"}', 2, 154),
  ('track-155', 'Lonely in the Bar', 'Diego Nava', 'Diego Nava', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/lonely-in-the-bar.mp3', true, 92, '{"contemplative","emotional"}', 'jazz', '{"piano","upright_bass"}', 1, 155),
  ('track-156', 'Winter Wind', 'Diego Nava', 'Diego Nava', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/winter-wind.mp3', true, 92, '{"contemplative","peaceful"}', 'jazz', '{"piano"}', 1, 156),
  ('track-157', 'Jazz 1', 'Francisco Alvear', 'Francisco Alvear', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/jazz-1.mp3', true, 134, '{"focus","relaxing"}', 'jazz', '{"saxophone","piano","drums"}', 2, 157),
  ('track-158', 'Nostalgic Night', 'Michael Ramir C.', 'Michael Ramir C.', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/nostalgic-night.mp3', true, 125, '{"contemplative","emotional"}', 'jazz', '{"piano","trumpet"}', 1, 158),
  ('track-159', 'Lo-Fi 03', 'Lily J', 'Lily J', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/lo-fi-03.mp3', true, 113, '{"relaxing","focus"}', 'jazz', '{"piano","drums"}', 1, 159),
  ('track-160', 'Swing is the Answer', 'Diego Nava', 'Diego Nava', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/swing-is-the-answer.mp3', true, 109, '{"bright","energetic"}', 'jazz', '{"piano","upright_bass","drums"}', 2, 160),
  ('track-161', 'Where Are My Boots', 'Michael Ramir C.', 'Michael Ramir C.', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/where-are-my-boots.mp3', true, 162, '{"relaxing","contemplative"}', 'jazz', '{"piano","saxophone"}', 1, 161),
  ('track-162', 'Lost in a Dream', 'Michael Ramir C.', 'Michael Ramir C.', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/lost-in-a-dream.mp3', true, 112, '{"contemplative","peaceful"}', 'jazz', '{"piano","trumpet"}', 1, 162),
  ('track-163', 'Papa', 'Michael Ramir C.', 'Michael Ramir C.', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/papa.mp3', true, 97, '{"relaxing","peaceful"}', 'jazz', '{"piano","drums"}', 1, 163),
  ('track-164', 'You Got Jazz', 'Diego Nava', 'Diego Nava', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/you-got-jazz.mp3', true, 100, '{"bright","relaxing"}', 'jazz', '{"piano","upright_bass","drums"}', 2, 164),
  ('track-165', 'Pop 03', 'Grigoriy Nuzhny', 'Grigoriy Nuzhny', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/pop-03.mp3', true, 171, '{"relaxing","focus"}', 'jazz', '{"piano","guitar"}', 1, 165),
  ('track-166', 'Upbeat Jazz', 'Francisco Alvear', 'Francisco Alvear', 'https://amqywfemuxghcosexqct.supabase.co/storage/v1/object/public/jazz-music/upbeat-jazz.mp3', true, 110, '{"energetic","bright"}', 'jazz', '{"saxophone","piano","drums"}', 2, 166)
ON CONFLICT (id) DO NOTHING;

-- 3. 재즈 플레이리스트
INSERT INTO playlists (id, name, description, emoji, sort_order)
VALUES ('jazz-reading', '재즈 독서', '부드러운 재즈와 보사노바로 여유로운 독서', '🎷', 4)
ON CONFLICT (id) DO NOTHING;

-- 4. 플레이리스트-트랙 매핑
INSERT INTO playlist_tracks (playlist_id, track_id, position)
VALUES
  ('jazz-reading', 'track-147', 0),
  ('jazz-reading', 'track-148', 1),
  ('jazz-reading', 'track-149', 2),
  ('jazz-reading', 'track-150', 3),
  ('jazz-reading', 'track-151', 4),
  ('jazz-reading', 'track-152', 5),
  ('jazz-reading', 'track-153', 6),
  ('jazz-reading', 'track-154', 7),
  ('jazz-reading', 'track-155', 8),
  ('jazz-reading', 'track-156', 9),
  ('jazz-reading', 'track-157', 10),
  ('jazz-reading', 'track-158', 11),
  ('jazz-reading', 'track-159', 12),
  ('jazz-reading', 'track-160', 13),
  ('jazz-reading', 'track-161', 14),
  ('jazz-reading', 'track-162', 15),
  ('jazz-reading', 'track-163', 16),
  ('jazz-reading', 'track-164', 17),
  ('jazz-reading', 'track-165', 18),
  ('jazz-reading', 'track-166', 19)
ON CONFLICT DO NOTHING;

-- 5. 장르별 테마 그룹
INSERT INTO theme_groups (id, name, emoji, sort_order)
VALUES ('genre', '장르별', '🎵', 1)
ON CONFLICT (id) DO NOTHING;

-- 6. 테마 그룹-플레이리스트 매핑
INSERT INTO theme_group_playlists (theme_group_id, playlist_id, position)
VALUES ('genre', 'jazz-reading', 0)
ON CONFLICT DO NOTHING;
