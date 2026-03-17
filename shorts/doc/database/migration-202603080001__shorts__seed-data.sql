-- ============================================================
-- Habitree Shorts — Seed Data
-- 202603080001 | 14개 시리즈 + 13개 샘플 콘텐츠 + 3개 팁 템플릿
-- ============================================================

-- ============================================================
-- 1. series — 14개 시리즈 메타데이터
-- ============================================================

INSERT INTO series (id, name, description, width, height, fps, duration_seconds, duration_in_frames, remotion_id, is_active, priority)
VALUES
  ('daily-quote', '오늘의 문장', '인상 깊은 문장 한 줄과 책 정보를 소개하는 감성 쇼츠', 1080, 1920, 30, 25, 750, 'DailyQuote', true, 1),
  ('book-review', '1분 북리뷰', '완독 많은 인기 책의 핵심을 1분 안에 전달', 1080, 1920, 30, 60, 1800, 'BookReview', true, 2),
  ('reading-tip', '독서 꿀팁', '독서 습관, 기록법, 독서모임 팁 등 실용 콘텐츠', 1080, 1920, 30, 30, 900, 'ReadingTip', true, 3),
  ('book-vs-book', '이 책 vs 저 책', '비슷한 주제의 두 책을 비교하며 선택을 돕는 콘텐츠', 1080, 1920, 30, 40, 1200, 'BookVsBook', true, 4),
  ('app-preview', '앱 미리보기', 'ReadTree 앱의 주요 기능을 소개하는 프로모션 쇼츠', 1080, 1920, 30, 30, 900, 'AppPreview', true, 5),
  ('service-intro', '서비스 소개', 'ReadTree 서비스의 핵심 가치와 기능을 소개하는 영상', 1080, 1920, 30, 45, 1350, 'ServiceIntro', true, 6),
  ('feature-demo', '기능 데모', '개별 기능을 상세히 보여주는 데모 영상', 1080, 1920, 30, 30, 900, 'FeatureDemo', true, 7),
  ('service-showcase', '서비스 쇼케이스', '전체 서비스를 슬라이드 형태로 보여주는 쇼케이스', 1080, 1920, 30, 51, 1530, 'ServiceShowcase', true, 8),
  ('user-story', '사용자 스토리', '실제 사용자의 변화 스토리를 감성적으로 전달', 1080, 1920, 30, 45, 1350, 'UserStory', true, 9),
  ('booktok-style', 'BookTok 감성', 'BookTok 트렌드에 맞춘 감성 리뷰 쇼츠', 1080, 1920, 30, 30, 900, 'BooktokStyle', true, 10),
  ('reading-challenge', '독서 챌린지', '독서 목표 달성 현황과 챌린지 참여 유도', 1080, 1920, 30, 25, 750, 'ReadingChallenge', true, 11),
  ('pain-point', '공감형 콘텐츠', '독서인의 공통 고충을 짚고 솔루션 제시', 1080, 1920, 30, 20, 600, 'PainPoint', true, 12),
  ('community-highlight', '독서모임 하이라이트', '활발한 독서모임 활동을 소개하는 콘텐츠', 1080, 1920, 30, 35, 1050, 'CommunityHighlight', true, 13),
  ('creator-collab', '크리에이터 콜라보', 'BookTok 크리에이터와 협업하는 추천 콘텐츠', 1080, 1920, 30, 40, 1200, 'CreatorCollab', true, 14)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. contents — Root.tsx 하드코딩 샘플 → DB 이관
-- ============================================================

-- daily-quote 샘플
INSERT INTO contents (series_id, title, props, status, source)
VALUES (
  'daily-quote',
  '데미안 — 새로운 길을 찾는 사람은',
  '{
    "seriesId": "daily-quote",
    "quoteText": "새로운 길을 찾는 사람은\n외로워야 하고,\n고독한 시간을 보내야 한다.",
    "bookTitle": "데미안",
    "author": "헤르만 헤세",
    "pageNumber": 45,
    "coverImageUrl": null
  }'::jsonb,
  'approved',
  'manual'
);

-- service-intro 샘플
INSERT INTO contents (series_id, title, props, status, source)
VALUES (
  'service-intro',
  '독서 기록이 사라지지 않는 시대',
  '{
    "seriesId": "service-intro",
    "tagline": "독서 기록이\n사라지지 않는 시대",
    "painPoints": [
      "메모장에 흩어진 독서 기록",
      "다시 찾을 수 없는 인상 깊은 문장",
      "책 단위로 정리되지 않는 기록들",
      "공유하기 어려운 독서 경험"
    ],
    "features": [
      {"title": "사진 한 장으로 기록", "description": "책 속 문장을 촬영하면\nAI가 자동으로 텍스트를 추출합니다", "icon": "scan"},
      {"title": "책별 자동 정리", "description": "필사, 메모, 사진이\n해당 책의 기록에 자동 연결됩니다", "icon": "sort"},
      {"title": "문장 단위 검색", "description": "저장한 문장을 제목, 주제, 내용으로\n언제든 다시 찾을 수 있습니다", "icon": "search"},
      {"title": "카드뉴스로 공유", "description": "클릭 한 번으로\n감성 카드뉴스를 만들어 공유합니다", "icon": "share"}
    ],
    "stats": [
      {"label": "지원 기능", "value": "5+"},
      {"label": "비용", "value": "무료"},
      {"label": "기록 방식", "value": "4가지"}
    ],
    "ctaText": "지금 시작하기"
  }'::jsonb,
  'approved',
  'manual'
);

-- feature-demo: 내 서재
INSERT INTO contents (series_id, title, props, status, source)
VALUES (
  'feature-demo',
  '나만의 독서나무',
  '{
    "seriesId": "feature-demo",
    "featureTitle": "나만의 독서나무",
    "featureSubtitle": "읽은 만큼 자라나는 나의 독서 기록",
    "featureDescription": "독서 기록과 통계, 독서나무 성장, 독서 그룹까지\n한눈에 확인할 수 있는 대시보드",
    "screenshotPC": "screenshots/pc/sample.png",
    "screenshotMobile": "screenshots/mobile/sample.png",
    "highlights": ["독서나무가 레벨에 따라 성장", "이번 주 독서 현황 한눈에", "읽고 있는 책 진행률 표시", "독서 달력으로 기록 확인"],
    "ctaText": "무료로 시작하기",
    "audioUrl": "audio/tts/feature-demo-library.mp3"
  }'::jsonb,
  'approved',
  'manual'
);

-- feature-demo: 간편 로그인
INSERT INTO contents (series_id, title, props, status, source)
VALUES (
  'feature-demo',
  '간편한 시작 — 카카오톡',
  '{
    "seriesId": "feature-demo",
    "featureTitle": "간편한 시작",
    "featureSubtitle": "카카오톡 한 번이면 바로 시작",
    "featureDescription": "카카오톡 또는 구글 계정으로\n3초 만에 가입하고 바로 기록을 시작하세요",
    "screenshotPC": "screenshots/pc/login.png",
    "screenshotMobile": "screenshots/mobile/login.png",
    "highlights": ["카카오톡으로 3초 가입", "구글 계정도 지원", "별도 회원가입 절차 없음", "로그인 없이 둘러보기 가능"],
    "ctaText": "지금 시작하기",
    "audioUrl": "audio/tts/feature-demo-login.mp3"
  }'::jsonb,
  'approved',
  'manual'
);

-- feature-demo: 포인트/프라이싱
INSERT INTO contents (series_id, title, props, status, source)
VALUES (
  'feature-demo',
  '합리적인 포인트',
  '{
    "seriesId": "feature-demo",
    "featureTitle": "합리적인 포인트",
    "featureSubtitle": "AI 기능도 부담 없이",
    "featureDescription": "기본 기능은 무료, AI 채팅과 OCR 필사 등\n프리미엄 기능은 포인트로 이용하세요",
    "screenshotPC": "screenshots/pc/pricing.png",
    "screenshotMobile": "screenshots/mobile/pricing.png",
    "highlights": ["기본 독서 기록은 완전 무료", "첫 충전 시 포인트 2배", "라이트/스탠다드/프리미엄 선택", "AI 채팅, OCR 필사 무제한"],
    "ctaText": "무료로 시작하기",
    "audioUrl": "audio/tts/feature-demo-pricing.mp3"
  }'::jsonb,
  'approved',
  'manual'
);

-- service-showcase
INSERT INTO contents (series_id, title, props, status, source)
VALUES (
  'service-showcase',
  '독서의 모든 순간을 ReadTree와 함께',
  '{
    "seriesId": "service-showcase",
    "tagline": "독서의 모든 순간을\nReadTree와 함께",
    "audioUrl": "audio/tts/service-showcase.mp3",
    "slides": [
      {"title": "나만의 서재", "description": "독서나무와 함께 성장하는 나의 독서 기록 대시보드", "pcImage": "screenshots/pc/sample.png", "mobileImage": "screenshots/mobile/sample.png"},
      {"title": "서비스 소개", "description": "ReadTree의 핵심 가치와 비전을 확인하세요", "pcImage": "screenshots/pc/about.png", "mobileImage": "screenshots/mobile/about.png"},
      {"title": "간편한 시작", "description": "카카오톡 또는 구글로 3초 만에 시작", "pcImage": "screenshots/pc/login.png", "mobileImage": "screenshots/mobile/login.png"},
      {"title": "합리적인 가격", "description": "기본 무료, AI 기능은 포인트로 부담 없이", "pcImage": "screenshots/pc/pricing.png", "mobileImage": "screenshots/mobile/pricing.png"}
    ],
    "ctaText": "지금 시작하기"
  }'::jsonb,
  'approved',
  'manual'
);

-- user-story
INSERT INTO contents (series_id, title, props, status, source)
VALUES (
  'user-story',
  '서연의 독서 변화 스토리',
  '{
    "seriesId": "user-story",
    "userName": "서연",
    "beforeText": "메모장에 흩어진 독서 기록\n다시 찾을 수 없는 문장들\n읽었는데 기억나지 않는 책",
    "afterText": "책별로 정리된 나만의 서재\n언제든 다시 찾는 인상 깊은 문장\n독서나무와 함께 성장하는 기록",
    "transitionText": "그런데\nReadTree를 만나고\n모든 게 달라졌어요",
    "duration": "3개월",
    "beforeStat": "0권",
    "afterStat": "23권",
    "ctaText": "무료로 시작하기"
  }'::jsonb,
  'approved',
  'manual'
);

-- booktok-style
INSERT INTO contents (series_id, title, props, status, source)
VALUES (
  'booktok-style',
  '우리가 빛의 속도로 갈 수 없다면 — BookTok',
  '{
    "seriesId": "booktok-style",
    "hookText": "이 책 읽고\n한참을 멍하니\n앉아 있었습니다",
    "quoteText": "우리가 빛의 속도로\n갈 수 없다면,\n그 이유를 알고 싶었다.",
    "reviewText": "SF를 넘어 인간 존엄에 대한 묵직한 질문",
    "rating": 5,
    "emotionTags": ["감동", "SF", "휴머니즘", "여운"],
    "bookTitle": "우리가 빛의 속도로 갈 수 없다면",
    "author": "김초엽",
    "coverImageUrl": null
  }'::jsonb,
  'approved',
  'manual'
);

-- reading-challenge
INSERT INTO contents (series_id, title, props, status, source)
VALUES (
  'reading-challenge',
  '이번 달 독서 챌린지',
  '{
    "seriesId": "reading-challenge",
    "challengeTitle": "이번 달\n당신의 독서량은?",
    "booksRead": 7,
    "booksGoal": 10,
    "totalPages": 2340,
    "genres": [
      {"name": "소설", "count": 3},
      {"name": "자기계발", "count": 2},
      {"name": "에세이", "count": 1},
      {"name": "과학", "count": 1}
    ],
    "percentile": 12,
    "ctaText": "나도 챌린지 참여하기"
  }'::jsonb,
  'approved',
  'manual'
);

-- pain-point
INSERT INTO contents (series_id, title, props, status, source)
VALUES (
  'pain-point',
  '독서 기록 메모장에 하는 사람?',
  '{
    "seriesId": "pain-point",
    "hookQuestion": "독서 기록\n메모장에 하는 사람?",
    "painPoints": [
      "메모장에 흩어진 기록",
      "어떤 책이었는지 기억 안 남",
      "인상 깊은 문장 다시 못 찾음",
      "읽은 책 수도 모름"
    ],
    "solutionText": "이 앱 하나면\n독서 기록 끝",
    "ctaText": "무료로 시작하기"
  }'::jsonb,
  'approved',
  'manual'
);

-- community-highlight
INSERT INTO contents (series_id, title, props, status, source)
VALUES (
  'community-highlight',
  '철학하는 독서인 모임',
  '{
    "seriesId": "community-highlight",
    "groupName": "철학하는 독서인",
    "topic": "인문/철학",
    "memberCount": 28,
    "currentBook": "차라투스트라는 이렇게 말했다",
    "highlights": [
      "\"초인의 개념이 현대에도 유효한가?\"에 대한 열띤 토론",
      "\"위버멘쉬를 자기계발로 해석하는 건 오독\" — 멤버 최진우",
      "이번 주 가장 많은 공감을 받은 메모 공유"
    ],
    "ctaText": "독서모임 둘러보기"
  }'::jsonb,
  'approved',
  'manual'
);

-- creator-collab
INSERT INTO contents (series_id, title, props, status, source)
VALUES (
  'creator-collab',
  '책읽는민지 x 아몬드',
  '{
    "seriesId": "creator-collab",
    "creatorName": "책읽는민지",
    "creatorBio": "BookTok 크리에이터 | 팔로워 12K",
    "bookTitle": "아몬드",
    "bookAuthor": "손원평",
    "recommendQuote": "감정을 느끼지 못하는 소년의 이야기인데\n읽고 나면 오히려\n감정이 무엇인지 다시 생각하게 돼요",
    "libraryCount": 156,
    "ctaText": "함께 읽으러 가기"
  }'::jsonb,
  'approved',
  'manual'
);

-- ============================================================
-- 3. content_templates — tip-selector.ts 3개 팁 템플릿 이관
-- ============================================================

INSERT INTO content_templates (series_id, name, description, template_props, ai_prompt)
VALUES
  (
    'reading-tip',
    '독서 습관 만들기 3단계',
    '독서 습관 형성을 위한 기본 팁',
    '{
      "tipTitle": "독서 습관 만들기 3단계",
      "category": "독서 습관",
      "tipSteps": [
        {"title": "시간 고정", "description": "매일 같은 시간에 10분만 읽기", "icon": "clock"},
        {"title": "장소 지정", "description": "독서 전용 공간을 정하세요", "icon": "location"},
        {"title": "기록하기", "description": "인상 깊은 문장을 바로 저장", "icon": "pen"}
      ]
    }'::jsonb,
    '독서 습관 형성에 관한 3단계 실용 팁을 생성하세요. 각 단계는 title, description, icon(clock/location/pen/book/star 중 택1)으로 구성됩니다.'
  ),
  (
    'reading-tip',
    '효과적인 독서 기록법',
    '독서 기록의 질을 높이는 방법',
    '{
      "tipTitle": "효과적인 독서 기록법",
      "category": "독서 기록",
      "tipSteps": [
        {"title": "밑줄 긋기", "description": "마음에 드는 문장에 표시하기", "icon": "highlight"},
        {"title": "내 생각 쓰기", "description": "왜 이 문장이 좋았는지 메모", "icon": "thought"},
        {"title": "연결하기", "description": "다른 책의 문장과 연결해보기", "icon": "link"}
      ]
    }'::jsonb,
    '독서 기록을 효과적으로 하는 3단계 방법을 생성하세요. 밑줄, 메모, 연결의 흐름으로 구성합니다.'
  ),
  (
    'reading-tip',
    '읽고 싶은 책 고르는 법',
    '다음에 읽을 책을 선택하는 팁',
    '{
      "tipTitle": "읽고 싶은 책 고르는 법",
      "category": "책 선택",
      "tipSteps": [
        {"title": "관심사 따라가기", "description": "지금 궁금한 주제부터 시작", "icon": "star"},
        {"title": "첫 10페이지", "description": "서점에서 첫 10페이지 읽어보기", "icon": "book"},
        {"title": "추천 활용", "description": "비슷한 취향의 독서가 추천 확인", "icon": "people"}
      ]
    }'::jsonb,
    '다음에 읽을 책을 고르는 3단계 방법을 생성하세요. 관심사, 미리보기, 추천의 흐름으로 구성합니다.'
  );

-- ============================================================
-- 4. text_fragments — 공통 문구 시드
-- ============================================================

INSERT INTO text_fragments (category, text, series_ids) VALUES
  ('cta', '무료로 시작하기', '{daily-quote,service-intro,feature-demo,pain-point,user-story}'),
  ('cta', '지금 시작하기', '{service-intro,service-showcase,feature-demo}'),
  ('cta', '나도 챌린지 참여하기', '{reading-challenge}'),
  ('cta', '독서모임 둘러보기', '{community-highlight}'),
  ('cta', '함께 읽으러 가기', '{creator-collab}'),
  ('hook', '독서 기록\n메모장에 하는 사람?', '{pain-point}'),
  ('hook', '이 책 읽고\n한참을 멍하니\n앉아 있었습니다', '{booktok-style}'),
  ('hook', '이번 달\n당신의 독서량은?', '{reading-challenge}'),
  ('emotion_tag', '감동', '{booktok-style,daily-quote}'),
  ('emotion_tag', '여운', '{booktok-style,daily-quote}'),
  ('emotion_tag', '성장', '{user-story,reading-challenge}'),
  ('emotion_tag', '공감', '{pain-point,community-highlight}');

-- ============================================================
-- 완료
-- ============================================================
