"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Check, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminCreateBookRelation, getUserBooksForAdmin } from "@/app/actions/admin";
import type {
  AdminUserBookOption,
  UserWithRelations,
} from "@/app/actions/admin/book-relations";
import { BookCover } from "./_relations-ui";

interface CreateRelationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  users: UserWithRelations[];
  initialUserId?: string;
  initialSourceUserBookId?: string;
}

const QUICK_TAGS = ["시리즈", "동일 작가", "유사 주제", "교차 분야", "동시기 독서"] as const;

export function CreateRelationModal({
  open,
  onClose,
  onCreated,
  users,
  initialUserId,
  initialSourceUserBookId,
}: CreateRelationModalProps) {
  const [userId, setUserId] = useState<string>(initialUserId ?? users[0]?.id ?? "");
  const [step, setStep] = useState(0);
  const [sourceId, setSourceId] = useState<string | null>(initialSourceUserBookId ?? null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [books, setBooks] = useState<AdminUserBookOption[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setReason("");
    setSourceId(initialSourceUserBookId ?? null);
    setTargetId(null);
    setUserId(initialUserId ?? users[0]?.id ?? "");
  }, [open, initialUserId, initialSourceUserBookId, users]);

  // 사용자 변경 시 책 목록 로드
  useEffect(() => {
    if (!open || !userId) {
      setBooks([]);
      return;
    }
    setLoadingBooks(true);
    getUserBooksForAdmin(userId)
      .then(setBooks)
      .catch(() => setBooks([]))
      .finally(() => setLoadingBooks(false));
  }, [open, userId]);

  const sourceBook = useMemo(() => books.find((b) => b.userBookId === sourceId), [books, sourceId]);
  const targetBook = useMemo(() => books.find((b) => b.userBookId === targetId), [books, targetId]);

  if (!open) return null;

  const canNext = (step === 0 && sourceId) || (step === 1 && targetId);
  const canSubmit = step === 2 && sourceId && targetId;

  const submit = async () => {
    if (!canSubmit || !sourceId || !targetId) return;
    setSubmitting(true);
    try {
      await adminCreateBookRelation({
        sourceUserBookId: sourceId,
        targetUserBookId: targetId,
        userId,
        reason: reason.trim() || null,
      });
      toast.success("새 연결을 만들었습니다.");
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "생성 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(20,18,12,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "rt-fade-in 180ms",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 540,
          maxWidth: "calc(100vw - 32px)",
          background: "var(--rt-bg-card)",
          border: "0.5px solid var(--rt-border)",
          borderRadius: 14,
          boxShadow: "var(--rt-shadow-lg)",
          overflow: "hidden",
          animation: "rt-scale-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "18px 20px 12px",
          }}
        >
          <div>
            <div
              className="rt-serif"
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--rt-text-primary)",
              }}
            >
              새 연결 만들기
            </div>
            <div style={{ fontSize: 12, color: "var(--rt-text-tertiary)", marginTop: 3 }}>
              두 권의 책을 선택하고 연결 사유를 입력하세요.
            </div>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: 0,
              background: "transparent",
              color: "var(--rt-text-tertiary)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* 사용자 선택 */}
        <div style={{ padding: "0 20px 4px" }}>
          <label style={{ fontSize: 11.5, color: "var(--rt-text-tertiary)", fontWeight: 600 }}>
            사용자
          </label>
          <select
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setSourceId(null);
              setTargetId(null);
              setStep(0);
            }}
            disabled={submitting}
            style={{
              marginTop: 4,
              width: "100%",
              height: 32,
              padding: "0 8px",
              borderRadius: 8,
              border: "0.5px solid var(--rt-border)",
              background: "var(--rt-bg-card)",
              color: "var(--rt-text-primary)",
              fontSize: 13,
              outline: "none",
            }}
          >
            {users.length === 0 && <option value="">(연결 가능한 사용자 없음)</option>}
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email ?? u.id} · {u.relationCount}건
              </option>
            ))}
          </select>
        </div>

        {/* 단계 표시 */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 20px" }}>
          {["출발 책", "도착 책", "사유"].map((s, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                fontWeight: 500,
                color: i <= step ? "var(--rt-text-primary)" : "var(--rt-text-tertiary)",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background:
                    i < step
                      ? "oklch(0.55 0.13 150)"
                      : i === step
                      ? "var(--rt-text-primary)"
                      : "var(--rt-bg-subtle)",
                  color:
                    i < step ? "white" : i === step ? "var(--rt-bg-card)" : "var(--rt-text-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10.5,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span>{s}</span>
              {i !== 2 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "var(--rt-border)",
                    marginLeft: 6,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* 본문 */}
        <div style={{ padding: "8px 20px 20px", maxHeight: "55vh", overflowY: "auto" }}>
          {step <= 1 && (
            <BookPicker
              loading={loadingBooks}
              books={books}
              selectedId={step === 0 ? sourceId : targetId}
              disabledId={step === 1 ? sourceId : null}
              onSelect={(id) => (step === 0 ? setSourceId(id) : setTargetId(id))}
              hint={
                step === 0
                  ? "연결의 출발이 될 책을 선택하세요."
                  : "연결할 도착 책을 선택하세요."
              }
            />
          )}
          {step === 2 && sourceBook && targetBook && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 16,
                  background: "var(--rt-bg-subtle)",
                  borderRadius: 10,
                  justifyContent: "center",
                }}
              >
                <BookCover src={sourceBook.coverImageUrl} title={sourceBook.title} width={64} />
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    maxWidth: 120,
                    background:
                      "linear-gradient(90deg, var(--rt-accent), var(--rt-accent-soft))",
                    borderRadius: 2,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--rt-accent)",
                      position: "absolute",
                      top: -3,
                      left: 0,
                      animation: "rt-dot-flow 2s linear infinite",
                    }}
                  />
                </div>
                <BookCover src={targetBook.coverImageUrl} title={targetBook.title} width={64} />
              </div>

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                  marginTop: 16,
                  color: "var(--rt-text-secondary)",
                }}
              >
                연결 사유 <span style={{ color: "var(--rt-text-tertiary)", fontWeight: 400 }}>(선택)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="예: 같은 작가의 후속작, 비슷한 주제, 동시기에 읽음…"
                style={{
                  width: "100%",
                  minHeight: 70,
                  padding: "10px 12px",
                  background: "var(--rt-bg-subtle)",
                  border: "0.5px solid var(--rt-border)",
                  borderRadius: 8,
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  color: "var(--rt-text-primary)",
                  resize: "vertical",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {QUICK_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setReason(t)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "var(--rt-bg-subtle)",
                      border: "0.5px solid var(--rt-border)",
                      fontSize: 11,
                      color: "var(--rt-text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 20px",
            borderTop: "0.5px solid var(--rt-border)",
            background: "var(--rt-bg-subtle)",
          }}
        >
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
              style={ghostBtnStyle}
            >
              <ArrowLeft size={13} /> 이전
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button type="button" onClick={onClose} disabled={submitting} style={ghostBtnStyle}>
            취소
          </button>
          {step < 2 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              style={primaryBtnStyle(!!canNext)}
            >
              다음 <ArrowRight size={13} />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={submit}
              style={primaryBtnStyle(!!canSubmit && !submitting)}
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Check size={13} />}
              연결 만들기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface BookPickerProps {
  loading: boolean;
  books: AdminUserBookOption[];
  selectedId: string | null;
  disabledId: string | null;
  onSelect: (id: string) => void;
  hint: string;
}

function BookPicker({ loading, books, selectedId, disabledId, onSelect, hint }: BookPickerProps) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--rt-text-secondary)", marginBottom: 10 }}>{hint}</div>
      {loading ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--rt-text-tertiary)",
            fontSize: 12.5,
          }}
        >
          <Loader2 className="size-4 animate-spin" style={{ display: "inline-block" }} /> 책 목록을 불러오는 중…
        </div>
      ) : books.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--rt-text-tertiary)",
            fontSize: 12.5,
          }}
        >
          이 사용자의 서재에 책이 없습니다.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
          }}
        >
          {books.map((b) => {
            const isSel = selectedId === b.userBookId;
            const isDisabled = disabledId === b.userBookId;
            return (
              <button
                key={b.userBookId}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelect(b.userBookId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 8,
                  borderRadius: 8,
                  background: isSel ? "var(--rt-accent-bg)" : "var(--rt-bg-subtle)",
                  border: `1px solid ${isSel ? "var(--rt-accent)" : "transparent"}`,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  textAlign: "left",
                  position: "relative",
                  opacity: isDisabled ? 0.35 : 1,
                  transition: "border 120ms, background 120ms",
                }}
              >
                <BookCover src={b.coverImageUrl} title={b.title} width={36} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "var(--rt-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {b.title}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "var(--rt-text-tertiary)",
                      marginTop: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {b.author ?? "저자 미상"}
                  </div>
                </div>
                {isSel && (
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "var(--rt-accent)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={11} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ghostBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 7,
  background: "transparent",
  border: "0.5px solid var(--rt-border)",
  color: "var(--rt-text-secondary)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const primaryBtnStyle = (enabled: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 12px",
  borderRadius: 8,
  border: 0,
  background: "var(--rt-text-primary)",
  color: "var(--rt-bg-card)",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: enabled ? "pointer" : "not-allowed",
  opacity: enabled ? 1 : 0.4,
  whiteSpace: "nowrap",
});
