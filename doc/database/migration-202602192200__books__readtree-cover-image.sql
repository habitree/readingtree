-- Readtree 시스템 책에 기본 표지 이미지 설정
-- 모든 컴포넌트에서 cover_image_url fallback이 자동으로 작동하도록 함
UPDATE books
SET cover_image_url = 'https://pkdhhtfomhhuiirzurhs.supabase.co/storage/v1/object/public/images/covers/default/cover-09-library.png'
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND (cover_image_url IS NULL OR cover_image_url = '');
