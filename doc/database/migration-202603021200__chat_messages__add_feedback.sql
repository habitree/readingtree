-- 채팅 메시지에 피드백 컬럼 추가
-- 사용자가 AI 응답에 좋아요/싫어요 피드백을 남길 수 있도록 함

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS feedback VARCHAR(10) DEFAULT NULL;

COMMENT ON COLUMN public.chat_messages.feedback IS '사용자 피드백: positive (좋아요), negative (싫어요), NULL (없음)';

-- 피드백 통계 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_feedback
ON public.chat_messages(feedback)
WHERE feedback IS NOT NULL;
