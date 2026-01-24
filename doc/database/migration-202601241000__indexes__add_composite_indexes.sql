-- ============================================
-- 복합 인덱스 추가 마이그레이션
-- ============================================
-- 작성일: 2026-01-24
-- 목적: 쿼리 성능 최적화를 위한 복합 인덱스 추가
-- 예상 효과: 주요 쿼리 50% 이상 성능 향상
-- ============================================

-- ============================================
-- 1. user_books 테이블 복합 인덱스
-- ============================================

-- 1.1 사용자별 상태 필터링 (가장 빈번한 쿼리)
-- 쿼리 예: SELECT * FROM user_books WHERE user_id = ? AND status = 'reading'
CREATE INDEX IF NOT EXISTS idx_user_books_user_status
ON user_books(user_id, status);

-- 1.2 사용자별 최신순 정렬
-- 쿼리 예: SELECT * FROM user_books WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_user_books_user_created
ON user_books(user_id, created_at DESC);

-- 1.3 사용자별 상태 + 최신순 (복합 쿼리)
-- 쿼리 예: SELECT * FROM user_books WHERE user_id = ? AND status = 'reading' ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS idx_user_books_user_status_updated
ON user_books(user_id, status, updated_at DESC);

-- ============================================
-- 2. notes 테이블 복합 인덱스
-- ============================================

-- 2.1 사용자의 특정 책 기록 조회
-- 쿼리 예: SELECT * FROM notes WHERE user_id = ? AND book_id = ?
CREATE INDEX IF NOT EXISTS idx_notes_user_book
ON notes(user_id, book_id);

-- 2.2 사용자별 최신 기록 조회 (타임라인)
-- 쿼리 예: SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_notes_user_created
ON notes(user_id, created_at DESC);

-- 2.3 책별 최신 기록 조회
-- 쿼리 예: SELECT * FROM notes WHERE book_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_notes_book_created
ON notes(book_id, created_at DESC);

-- 2.4 사용자별 타입 + 최신순
-- 쿼리 예: SELECT * FROM notes WHERE user_id = ? AND type = 'quote' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_notes_user_type_created
ON notes(user_id, type, created_at DESC);

-- 2.5 사용자 + 책 + 최신순 (상세 페이지)
-- 쿼리 예: SELECT * FROM notes WHERE user_id = ? AND book_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_notes_user_book_created
ON notes(user_id, book_id, created_at DESC);

-- ============================================
-- 3. group_members 테이블 복합 인덱스
-- ============================================

-- 3.1 그룹의 승인된 멤버 조회
-- 쿼리 예: SELECT * FROM group_members WHERE group_id = ? AND status = 'approved'
CREATE INDEX IF NOT EXISTS idx_group_members_group_status
ON group_members(group_id, status);

-- 3.2 사용자의 승인된 그룹 조회
-- 쿼리 예: SELECT * FROM group_members WHERE user_id = ? AND status = 'approved'
CREATE INDEX IF NOT EXISTS idx_group_members_user_status
ON group_members(user_id, status);

-- ============================================
-- 4. books 테이블 복합 인덱스
-- ============================================

-- 4.1 ISBN + 제목 (중복 체크)
-- 쿼리 예: SELECT * FROM books WHERE isbn = ? OR title = ?
CREATE INDEX IF NOT EXISTS idx_books_isbn_title
ON books(isbn, title);

-- ============================================
-- 5. bookshelves 테이블 복합 인덱스
-- ============================================

-- 5.1 사용자의 서재 정렬 순서
-- 쿼리 예: SELECT * FROM bookshelves WHERE user_id = ? ORDER BY "order"
-- 이미 idx_bookshelves_order가 있으므로 스킵

-- ============================================
-- 6. chat_sessions 테이블 복합 인덱스 (AI 챗봇)
-- ============================================

-- 6.1 사용자별 최신 세션
-- 쿼리 예: SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY last_message_at DESC
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_last_message
ON chat_sessions(user_id, last_message_at DESC);

-- ============================================
-- 7. chat_messages 테이블 복합 인덱스
-- ============================================

-- 7.1 세션별 메시지 순서
-- 쿼리 예: SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
ON chat_messages(session_id, created_at);

-- ============================================
-- 8. ocr_logs 테이블 복합 인덱스
-- ============================================

-- 8.1 사용자별 최신 로그
-- 쿼리 예: SELECT * FROM ocr_logs WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_ocr_logs_user_created
ON ocr_logs(user_id, created_at DESC);

-- 8.2 상태별 최신 로그 (관리자용)
-- 쿼리 예: SELECT * FROM ocr_logs WHERE status = 'failed' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_ocr_logs_status_created
ON ocr_logs(status, created_at DESC);

-- ============================================
-- 9. transcriptions 테이블 복합 인덱스
-- ============================================

-- 9.1 상태별 최신순
-- 쿼리 예: SELECT * FROM transcriptions WHERE status = 'processing' ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_transcriptions_status_created
ON transcriptions(status, created_at);

-- ============================================
-- 인덱스 통계 갱신 (선택사항)
-- ============================================
-- ANALYZE 명령으로 통계 갱신하여 쿼리 플래너 최적화
ANALYZE user_books;
ANALYZE notes;
ANALYZE group_members;
ANALYZE books;
ANALYZE chat_sessions;
ANALYZE chat_messages;
ANALYZE ocr_logs;
ANALYZE transcriptions;

-- ============================================
-- 마이그레이션 완료
-- ============================================
-- 생성된 복합 인덱스 목록:
-- 1. idx_user_books_user_status
-- 2. idx_user_books_user_created
-- 3. idx_user_books_user_status_updated
-- 4. idx_notes_user_book
-- 5. idx_notes_user_created
-- 6. idx_notes_book_created
-- 7. idx_notes_user_type_created
-- 8. idx_notes_user_book_created
-- 9. idx_group_members_group_status
-- 10. idx_group_members_user_status
-- 11. idx_books_isbn_title
-- 12. idx_chat_sessions_user_last_message
-- 13. idx_chat_messages_session_created
-- 14. idx_ocr_logs_user_created
-- 15. idx_ocr_logs_status_created
-- 16. idx_transcriptions_status_created
-- ============================================
