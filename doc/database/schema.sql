-- ============================================
-- Habitree Reading Hub - 데이터베이스 스키마
-- ============================================
-- 
-- 적용 순서:
-- 1. 이 파일 전체를 Supabase SQL Editor에서 실행 (권장)
-- 2. 또는 섹션별로 순차 실행
--
-- 중요 사항:
-- - 테이블 생성 순서가 중요합니다 (외래 키 의존성)
-- - groups 테이블의 RLS 정책은 group_members 테이블 생성 후 업데이트됩니다
-- - 이 스키마는 idempotent합니다 (여러 번 실행해도 안전)
--   - ENUM 타입: 존재 여부 확인 후 생성
--   - 테이블: CREATE TABLE IF NOT EXISTS 사용
--   - 인덱스: CREATE INDEX IF NOT EXISTS 사용
--   - 정책: DROP IF EXISTS 후 재생성
--   - 함수: CREATE OR REPLACE 사용
--   - 트리거: DROP IF EXISTS 후 재생성
--
-- 참고: software_design.md의 4.2, 4.3 섹션 참고
-- ============================================

-- ============================================
-- 1. 확장 활성화
-- ============================================

-- UUID 생성 함수를 위한 확장 (Supabase에서 기본 제공되지만 명시적으로 활성화)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. ENUM 타입 정의
-- ============================================
-- ENUM 타입은 IF NOT EXISTS를 지원하지 않으므로 DO 블록 사용

DO $$ 
BEGIN
    -- 독서 상태
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reading_status') THEN
        CREATE TYPE reading_status AS ENUM ('reading', 'completed', 'paused', 'not_started', 'rereading');
    END IF;

    -- 기록 유형
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'note_type') THEN
        CREATE TYPE note_type AS ENUM ('quote', 'photo', 'memo', 'transcription');
    END IF;

    -- 모임 멤버 역할
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
        CREATE TYPE member_role AS ENUM ('leader', 'member');
    END IF;

    -- 모임 멤버 상태
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status') THEN
        CREATE TYPE member_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

-- ============================================
-- 2.5 데이터베이스 함수 생성 (RLS 정책에서 사용되므로 먼저 생성)
-- ============================================

-- 2.5.1 관리자 확인 함수
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND is_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. 테이블 생성
-- ============================================
-- 테이블은 IF NOT EXISTS를 사용하여 idempotent하게 생성

-- 3.1 Users (사용자 프로필)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255), -- auth.users에서 자동 동기화
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    reading_goal INTEGER DEFAULT 12,
    terms_agreed BOOLEAN DEFAULT FALSE, -- 이용약관 동의 여부
    privacy_agreed BOOLEAN DEFAULT FALSE, -- 개인정보처리방침 동의 여부
    consent_date TIMESTAMP WITH TIME ZONE, -- 동의 일시
    is_admin BOOLEAN DEFAULT FALSE, -- 관리자 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- is_admin 컬럼 추가 (기존 테이블이 있는 경우를 대비)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON users;
CREATE POLICY "Users can delete own profile"
    ON users FOR DELETE
    USING (auth.uid() = id);

-- 3.2 Books (책)
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isbn VARCHAR(20), -- UNIQUE 제약조건 제거: 여러 사용자가 같은 책을 추가할 수 있도록 함
    title VARCHAR(500) NOT NULL,
    author VARCHAR(200),
    publisher VARCHAR(200),
    published_date DATE,
    cover_image_url TEXT,
    is_sample BOOLEAN DEFAULT FALSE, -- 샘플 데이터 플래그
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- books 테이블에 메타데이터 컬럼 추가 (기존 테이블이 있는 경우를 대비)
DO $$ 
BEGIN
    -- category 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE books 
        ADD COLUMN category VARCHAR(100);
    END IF;

    -- total_pages 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'total_pages'
    ) THEN
        ALTER TABLE books 
        ADD COLUMN total_pages INTEGER;
    END IF;

    -- summary 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'summary'
    ) THEN
        ALTER TABLE books 
        ADD COLUMN summary TEXT;
    END IF;

    -- description_summary 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'description_summary'
    ) THEN
        ALTER TABLE books 
        ADD COLUMN description_summary VARCHAR(50);
    END IF;

    -- external_link 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'external_link'
    ) THEN
        ALTER TABLE books 
        ADD COLUMN external_link TEXT;
    END IF;
END $$;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn) WHERE isbn IS NOT NULL; -- NULL이 아닌 ISBN만 인덱싱
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category) WHERE category IS NOT NULL; -- 분류별 필터링용
CREATE INDEX IF NOT EXISTS idx_books_total_pages ON books(total_pages) WHERE total_pages IS NOT NULL; -- 페이지 수 범위 검색용
CREATE INDEX IF NOT EXISTS idx_books_is_sample ON books(is_sample) WHERE is_sample = TRUE; -- 샘플 데이터 조회용 인덱스

-- 전체 텍스트 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_books_title_fts ON books USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_books_author_fts ON books USING gin(to_tsvector('simple', author));

-- 3.3 Bookshelves (서재)
CREATE TABLE IF NOT EXISTS bookshelves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_main BOOLEAN DEFAULT FALSE,
    "order" INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT bookshelves_order_check CHECK ("order" >= 0)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bookshelves_user_id ON bookshelves(user_id);
CREATE INDEX IF NOT EXISTS idx_bookshelves_is_main ON bookshelves(is_main) WHERE is_main = TRUE;
CREATE INDEX IF NOT EXISTS idx_bookshelves_order ON bookshelves(user_id, "order");

-- UNIQUE 제약: 사용자당 메인 서재는 1개만 (부분 인덱스로 구현)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookshelves_user_main_unique 
ON bookshelves(user_id) 
WHERE is_main = TRUE;

-- RLS
ALTER TABLE bookshelves ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (idempotent)
DROP POLICY IF EXISTS "Users can view own bookshelves or public bookshelves" ON bookshelves;
CREATE POLICY "Users can view own bookshelves or public bookshelves"
    ON bookshelves FOR SELECT
    USING (
        auth.uid() = user_id 
        OR is_public = TRUE
    );

DROP POLICY IF EXISTS "Users can insert own bookshelves" ON bookshelves;
CREATE POLICY "Users can insert own bookshelves"
    ON bookshelves FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookshelves" ON bookshelves;
CREATE POLICY "Users can update own bookshelves"
    ON bookshelves FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookshelves" ON bookshelves;
CREATE POLICY "Users can delete own bookshelves"
    ON bookshelves FOR DELETE
    USING (
        auth.uid() = user_id 
        AND is_main = FALSE
    );

-- 3.4 UserBooks (사용자-책 관계)
CREATE TABLE IF NOT EXISTS user_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    status reading_status DEFAULT 'reading',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

-- user_books 테이블에 추가 컬럼 추가 (기존 테이블이 있는 경우를 대비)
DO $$ 
BEGIN
    -- bookshelf_id 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_books' 
        AND column_name = 'bookshelf_id'
    ) THEN
        ALTER TABLE user_books 
        ADD COLUMN bookshelf_id UUID REFERENCES bookshelves(id) ON DELETE SET NULL;
    END IF;

    -- book_format 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_books' 
        AND column_name = 'book_format'
    ) THEN
        ALTER TABLE user_books 
        ADD COLUMN book_format VARCHAR(50);
    END IF;

    -- completed_dates 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'user_books' 
        AND column_name = 'completed_dates'
    ) THEN
        ALTER TABLE user_books 
        ADD COLUMN completed_dates JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- reading_reason 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'user_books' 
        AND column_name = 'reading_reason'
    ) THEN
        ALTER TABLE user_books 
        ADD COLUMN reading_reason VARCHAR(500);
    END IF;
END $$;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_book_id ON user_books(book_id);
CREATE INDEX IF NOT EXISTS idx_user_books_status ON user_books(status);
CREATE INDEX IF NOT EXISTS idx_user_books_book_format ON user_books(book_format) WHERE book_format IS NOT NULL; -- 독서 매체별 필터링용
CREATE INDEX IF NOT EXISTS idx_user_books_bookshelf_id ON user_books(bookshelf_id);
CREATE INDEX IF NOT EXISTS idx_user_books_completed_dates ON user_books USING gin (completed_dates); -- JSONB 배열 검색 최적화

-- RLS
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (idempotent)
DROP POLICY IF EXISTS "Users can view own books" ON user_books;
DROP POLICY IF EXISTS "Users can view own books or sample books" ON user_books;
CREATE POLICY "Users can view own books or sample books"
    ON user_books FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM books WHERE books.id = user_books.book_id AND books.is_sample = TRUE));

DROP POLICY IF EXISTS "Users can insert own books" ON user_books;
CREATE POLICY "Users can insert own books"
    ON user_books FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own books" ON user_books;
CREATE POLICY "Users can update own books"
    ON user_books FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own books" ON user_books;
CREATE POLICY "Users can delete own books"
    ON user_books FOR DELETE
    USING (auth.uid() = user_id);

-- 3.5 Notes (기록)
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    title TEXT,
    type note_type NOT NULL,
    content TEXT,
    image_url TEXT,
    page_number INTEGER,
    is_public BOOLEAN DEFAULT FALSE,
    is_sample BOOLEAN DEFAULT FALSE, -- 샘플 데이터 플래그
    tags TEXT[],
    related_user_book_ids UUID[], -- 연결된 다른 책들의 user_books.id 배열
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_page_number ON notes(page_number);
CREATE INDEX IF NOT EXISTS idx_notes_is_sample ON notes(is_sample) WHERE is_sample = TRUE; -- 샘플 데이터 조회용 인덱스

-- 전체 텍스트 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_notes_content_fts ON notes USING gin(to_tsvector('simple', content));

-- 태그 인덱스
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING gin(tags);

-- 관련 책 인덱스
CREATE INDEX IF NOT EXISTS idx_notes_related_user_book_ids ON notes USING gin(related_user_book_ids);

-- RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (idempotent)
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can view own notes or public/sample notes" ON notes;
CREATE POLICY "Users can view own notes or public/sample notes"
    ON notes FOR SELECT
    USING (auth.uid() = user_id OR is_public = TRUE OR is_sample = TRUE);

DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
CREATE POLICY "Users can insert own notes"
    ON notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON notes;
CREATE POLICY "Users can update own notes"
    ON notes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
CREATE POLICY "Users can delete own notes"
    ON notes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 3.6 transcriptions (필사 OCR 데이터)
-- ============================================

-- OCR 처리 상태 ENUM 타입 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ocr_status') THEN
        CREATE TYPE ocr_status AS ENUM ('processing', 'completed', 'failed');
    END IF;
END $$;

-- Transcriptions 테이블 생성
CREATE TABLE IF NOT EXISTS transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    extracted_text TEXT NOT NULL, -- OCR로 추출된 원본 텍스트
    quote_content TEXT, -- 책 구절 (사용자가 편집 가능)
    memo_content TEXT, -- 사용자의 생각 (사용자가 추가 가능)
    status ocr_status DEFAULT 'processing' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- note_id는 하나의 transcription만 가질 수 있음
    CONSTRAINT unique_note_transcription UNIQUE (note_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_transcriptions_note_id ON transcriptions(note_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at DESC);

-- RLS 활성화
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- SELECT: 자신의 기록에 대한 transcription만 조회 가능
DROP POLICY IF EXISTS "Users can view own transcriptions" ON transcriptions;
CREATE POLICY "Users can view own transcriptions"
    ON transcriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM notes
            WHERE notes.id = transcriptions.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- INSERT: 자신의 기록에 대한 transcription만 생성 가능
DROP POLICY IF EXISTS "Users can insert own transcriptions" ON transcriptions;
CREATE POLICY "Users can insert own transcriptions"
    ON transcriptions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM notes
            WHERE notes.id = transcriptions.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- UPDATE: 자신의 기록에 대한 transcription만 수정 가능
DROP POLICY IF EXISTS "Users can update own transcriptions" ON transcriptions;
CREATE POLICY "Users can update own transcriptions"
    ON transcriptions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM notes
            WHERE notes.id = transcriptions.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- DELETE: 자신의 기록에 대한 transcription만 삭제 가능
DROP POLICY IF EXISTS "Users can delete own transcriptions" ON transcriptions;
CREATE POLICY "Users can delete own transcriptions"
    ON transcriptions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM notes
            WHERE notes.id = transcriptions.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_transcriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_transcriptions_updated_at_trigger ON transcriptions;
CREATE TRIGGER update_transcriptions_updated_at_trigger
    BEFORE UPDATE ON transcriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_transcriptions_updated_at();

-- ============================================
-- 3.7 groups (독서모임)
-- ============================================
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_groups_leader_id ON groups(leader_id);
CREATE INDEX IF NOT EXISTS idx_groups_is_public ON groups(is_public);

-- RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (idempotent)
-- 주의: group_members 테이블이 아직 생성되지 않았으므로, 
-- SELECT 정책은 group_members 테이블 생성 후에 업데이트됩니다.
-- 먼저 공개 그룹만 볼 수 있도록 기본 정책 생성
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
CREATE POLICY "Anyone can view public groups"
    ON groups FOR SELECT
    USING (is_public = TRUE);

DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
CREATE POLICY "Authenticated users can create groups"
    ON groups FOR INSERT
    WITH CHECK (auth.uid() = leader_id);

DROP POLICY IF EXISTS "Leaders can update groups" ON groups;
CREATE POLICY "Leaders can update groups"
    ON groups FOR UPDATE
    USING (auth.uid() = leader_id);

DROP POLICY IF EXISTS "Leaders can delete groups" ON groups;
CREATE POLICY "Leaders can delete groups"
    ON groups FOR DELETE
    USING (auth.uid() = leader_id);

-- 3.8 GroupMembers (모임 멤버)
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role member_role DEFAULT 'member',
    status member_status DEFAULT 'pending',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);

-- RLS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (idempotent)
-- 무한 재귀 방지: group_members 테이블 자체를 참조하지 않고 groups 테이블만 사용
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
CREATE POLICY "Members can view group members"
    ON group_members FOR SELECT
    USING (
        -- 사용자가 리더인 그룹의 멤버를 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_members.group_id 
            AND leader_id = auth.uid()
        )
        OR
        -- 공개 그룹의 멤버는 누구나 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_members.group_id 
            AND is_public = TRUE
        )
        OR
        -- 사용자 자신의 멤버십 정보는 볼 수 있음
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can request to join" ON group_members;
CREATE POLICY "Users can request to join"
    ON group_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Leaders can manage members" ON group_members;
CREATE POLICY "Leaders can manage members"
    ON group_members FOR UPDATE
    USING (auth.uid() IN (
        SELECT leader_id FROM groups WHERE id = group_members.group_id
    ));

DROP POLICY IF EXISTS "Leaders can remove members" ON group_members;
CREATE POLICY "Leaders can remove members"
    ON group_members FOR DELETE
    USING (auth.uid() IN (
        SELECT leader_id FROM groups WHERE id = group_members.group_id
    ));

-- ============================================
-- 3.6.1 Groups 테이블 RLS 정책 업데이트
-- ============================================
-- group_members 테이블이 생성되었으므로, groups 테이블의 SELECT 정책을 업데이트
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;

CREATE POLICY "Anyone can view public groups"
    ON groups FOR SELECT
    USING (
        -- 공개 그룹은 누구나 볼 수 있음
        is_public = TRUE 
        OR 
        -- 사용자가 리더인 그룹을 볼 수 있음
        leader_id = auth.uid()
        -- 주의: group_members 참조 제거 (무한 재귀 방지)
        -- 멤버 확인은 group_members 조회 시 별도로 처리
        -- getGroups 함수에서 group_members를 먼저 조회한 후 group_id로 groups 조회
    );

-- 3.9 GroupBooks (모임 책)
CREATE TABLE IF NOT EXISTS group_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, book_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_group_books_group_id ON group_books(group_id);
CREATE INDEX IF NOT EXISTS idx_group_books_book_id ON group_books(book_id);

-- RLS
ALTER TABLE group_books ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (idempotent)
DROP POLICY IF EXISTS "Members can view group books" ON group_books;
CREATE POLICY "Members can view group books"
    ON group_books FOR SELECT
    USING (
        -- 사용자가 리더인 그룹의 책을 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_books.group_id 
            AND leader_id = auth.uid()
        )
        OR
        -- 공개 그룹의 책은 누구나 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_books.group_id 
            AND is_public = TRUE
        )
        OR
        -- 모임 멤버는 지정도서를 볼 수 있음
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = group_books.group_id
            AND user_id = auth.uid()
            AND status = 'approved'
        )
    );

DROP POLICY IF EXISTS "Leaders can add group books" ON group_books;
CREATE POLICY "Leaders can add group books"
    ON group_books FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT leader_id FROM groups WHERE id = group_books.group_id
    ));

DROP POLICY IF EXISTS "Leaders can update group books" ON group_books;
CREATE POLICY "Leaders can update group books"
    ON group_books FOR UPDATE
    USING (auth.uid() IN (
        SELECT leader_id FROM groups WHERE id = group_books.group_id
    ));

DROP POLICY IF EXISTS "Leaders can remove group books" ON group_books;
CREATE POLICY "Leaders can remove group books"
    ON group_books FOR DELETE
    USING (auth.uid() IN (
        SELECT leader_id FROM groups WHERE id = group_books.group_id
    ));

-- 3.10 GroupNotes (모임 내 공유 기록)
CREATE TABLE IF NOT EXISTS group_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, note_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_group_notes_group_id ON group_notes(group_id);
CREATE INDEX IF NOT EXISTS idx_group_notes_note_id ON group_notes(note_id);

-- RLS
ALTER TABLE group_notes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (idempotent)
DROP POLICY IF EXISTS "Members can view shared notes" ON group_notes;
CREATE POLICY "Members can view shared notes"
    ON group_notes FOR SELECT
    USING (
        -- 사용자가 리더인 그룹의 공유 기록을 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_notes.group_id 
            AND leader_id = auth.uid()
        )
        OR
        -- 공개 그룹의 공유 기록은 누구나 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_notes.group_id 
            AND is_public = TRUE
        )
        OR
        -- 사용자가 멤버인 그룹의 공유 기록을 볼 수 있음 (무한 재귀 방지를 위해 groups 테이블만 사용)
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_notes.group_id
            AND (
                g.is_public = TRUE
                OR g.leader_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Note owners can share to groups" ON group_notes;
CREATE POLICY "Note owners can share to groups"
    ON group_notes FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM notes WHERE id = group_notes.note_id
    ));

DROP POLICY IF EXISTS "Note owners can unshare from groups" ON group_notes;
CREATE POLICY "Note owners can unshare from groups"
    ON group_notes FOR DELETE
    USING (auth.uid() IN (
        SELECT user_id FROM notes WHERE id = group_notes.note_id
    ));

-- 3.11 GroupSharedBooks (모임에 공유된 개인 서재)
CREATE TABLE IF NOT EXISTS group_shared_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_book_id UUID NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_book_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_group_shared_books_group_id ON group_shared_books(group_id);
CREATE INDEX IF NOT EXISTS idx_group_shared_books_user_book_id ON group_shared_books(user_book_id);

-- RLS
ALTER TABLE group_shared_books ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (idempotent)
DROP POLICY IF EXISTS "Members can view shared books" ON group_shared_books;
CREATE POLICY "Members can view shared books"
    ON group_shared_books FOR SELECT
    USING (
        -- 사용자가 리더인 그룹의 공유 서재를 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_shared_books.group_id 
            AND leader_id = auth.uid()
        )
        OR
        -- 공개 그룹의 공유 서재는 누구나 볼 수 있음
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_shared_books.group_id 
            AND is_public = TRUE
        )
        OR
        -- 모임 멤버는 공유 서재를 볼 수 있음
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = group_shared_books.group_id
            AND user_id = auth.uid()
            AND status = 'approved'
        )
    );

DROP POLICY IF EXISTS "Users can share own books" ON group_shared_books;
CREATE POLICY "Users can share own books"
    ON group_shared_books FOR INSERT
    WITH CHECK (
        -- 자신의 서재만 공유 가능
        EXISTS (
            SELECT 1 FROM user_books
            WHERE id = group_shared_books.user_book_id
            AND user_id = auth.uid()
        )
        AND
        -- 모임 멤버만 공유 가능
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = group_shared_books.group_id
            AND user_id = auth.uid()
            AND status = 'approved'
        )
    );

DROP POLICY IF EXISTS "Users can unshare own books" ON group_shared_books;
CREATE POLICY "Users can unshare own books"
    ON group_shared_books FOR DELETE
    USING (
        -- 자신이 공유한 서재만 해제 가능
        EXISTS (
            SELECT 1 FROM user_books
            WHERE id = group_shared_books.user_book_id
            AND user_id = auth.uid()
        )
    );

-- ============================================
-- 3.12 ocr_usage_stats (OCR 사용 통계)
-- ============================================

-- ocr_log_status ENUM 타입 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ocr_log_status') THEN
        CREATE TYPE ocr_log_status AS ENUM ('success', 'failed');
    END IF;
END $$;

-- ocr_usage_stats 테이블 생성
CREATE TABLE IF NOT EXISTS ocr_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ocr_usage_stats_user_id ON ocr_usage_stats(user_id);

-- RLS
ALTER TABLE ocr_usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (관리자만 조회 가능)
DROP POLICY IF EXISTS "Admins can view OCR usage stats" ON ocr_usage_stats;
CREATE POLICY "Admins can view OCR usage stats"
    ON ocr_usage_stats FOR SELECT
    USING (is_admin_user());

-- ============================================
-- 3.13 ocr_logs (OCR 처리 상세 로그)
-- ============================================

-- ocr_logs 테이블 생성
CREATE TABLE IF NOT EXISTS ocr_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
    status ocr_log_status NOT NULL,
    error_message TEXT,
    processing_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ocr_logs_user_id ON ocr_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_note_id ON ocr_logs(note_id);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_status ON ocr_logs(status);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_created_at ON ocr_logs(created_at DESC);

-- RLS
ALTER TABLE ocr_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (관리자만 조회 가능)
DROP POLICY IF EXISTS "Admins can view OCR logs" ON ocr_logs;
CREATE POLICY "Admins can view OCR logs"
    ON ocr_logs FOR SELECT
    USING (is_admin_user());

-- ============================================
-- 4. 데이터베이스 함수 생성
-- ============================================

-- 4.1 Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 사용자 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '사용자'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 독서 통계 함수
-- 사용자의 올해 완독 책 수 조회
CREATE OR REPLACE FUNCTION get_user_completed_books_count(
    p_user_id UUID,
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM user_books
        WHERE user_id = p_user_id
            AND status = 'completed'
            AND EXTRACT(YEAR FROM completed_at) = p_year
    );
END;
$$ LANGUAGE plpgsql;

-- 사용자의 이번 주 작성한 기록 수
CREATE OR REPLACE FUNCTION get_user_notes_count_this_week(
    p_user_id UUID
)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notes
        WHERE user_id = p_user_id
            AND created_at >= DATE_TRUNC('week', CURRENT_DATE)
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. 트리거 생성
-- ============================================

-- 5.1 Updated_at 자동 업데이트 트리거
-- 기존 트리거 삭제 후 재생성 (idempotent)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_books_updated_at ON user_books;
CREATE TRIGGER update_user_books_updated_at
    BEFORE UPDATE ON user_books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookshelves_updated_at ON bookshelves;
CREATE TRIGGER update_bookshelves_updated_at
    BEFORE UPDATE ON bookshelves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ocr_usage_stats_updated_at ON ocr_usage_stats;
CREATE TRIGGER update_ocr_usage_stats_updated_at
    BEFORE UPDATE ON ocr_usage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5.2 사용자 프로필 자동 생성 트리거
-- auth.users 테이블의 트리거는 한 번만 생성되어야 하므로 조건부 생성
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created' 
        AND tgrelid = 'auth.users'::regclass
    ) THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- ============================================
-- 6. 샘플 데이터 지원 (게스트 사용자용)
-- ============================================

-- Books 테이블: 샘플 데이터는 누구나 조회 가능
-- (RLS가 없으므로 자동으로 모든 사용자가 조회 가능)

-- Notes 테이블: 샘플 데이터 조회 정책은 이미 위에서 추가됨
-- (is_sample = TRUE인 경우 누구나 조회 가능)

-- ============================================
-- 스키마 적용 완료
-- ============================================
-- 
-- 다음 단계:
-- 1. Storage 버킷 생성 (doc/database/README.md 참고)
-- 2. Storage RLS 정책 설정 (doc/database/README.md 참고)
-- 3. 검증 체크리스트 확인 (00-bkend-database-schema-plan.md 참고)
-- 4. 샘플 데이터 초기화 (doc/database/sample-data.sql 실행)
-- ============================================

