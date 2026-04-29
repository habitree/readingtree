"use client";

import { useMemo, useState } from "react";
import { X, Trash2, Plus, Network, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { GraphNode, GraphEdge } from "@/app/actions/admin/book-relations";
import { adminDeleteBookRelation } from "@/app/actions/admin";
import { Avatar, BookCover } from "./_relations-ui";

interface InspectorProps {
  node: GraphNode | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onAddRelation: (sourceId: string) => void;
  onDeleted: () => void;
}

export function BookRelationsInspector({
  node,
  nodes,
  edges,
  onClose,
  onSelect,
  onAddRelation,
  onDeleted,
}: InspectorProps) {
  const [pendingDelete, setPendingDelete] = useState<{ targetId: string; targetTitle: string } | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const connected = useMemo(() => {
    if (!node) return [];
    const list: { node: GraphNode; edge: GraphEdge }[] = [];
    const nodeIndex = new Map(nodes.map((n) => [n.id, n]));
    for (const e of edges) {
      if (e.source === node.id) {
        const b = nodeIndex.get(e.target);
        if (b) list.push({ node: b, edge: e });
      } else if (e.target === node.id) {
        const b = nodeIndex.get(e.source);
        if (b) list.push({ node: b, edge: e });
      }
    }
    return list;
  }, [node, nodes, edges]);

  const crossUsers = useMemo(() => new Set(connected.map((c) => c.node.userId)).size, [connected]);

  // 빈 상태
  if (!node) {
    return (
      <div
        style={{
          padding: "60px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--rt-bg-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            color: "var(--rt-text-tertiary)",
          }}
        >
          <Network size={24} strokeWidth={1.4} />
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--rt-text-primary)",
            marginBottom: 4,
          }}
        >
          책을 선택하세요
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--rt-text-tertiary)",
            lineHeight: 1.5,
            maxWidth: 220,
          }}
        >
          그래프나 목록에서 책을 클릭하면
          <br />
          연결 정보를 확인할 수 있어요.
        </div>
      </div>
    );
  }

  const handleDeleteClick = (targetId: string, targetTitle: string) => {
    setPendingDelete({ targetId, targetTitle });
  };

  const confirmDelete = async () => {
    if (!pendingDelete || !node) return;
    setIsDeleting(true);
    try {
      await adminDeleteBookRelation(node.id, pendingDelete.targetId, node.userId);
      toast.success("연결을 삭제했습니다.");
      onDeleted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <div
        style={{
          padding: "18px 18px 16px",
          borderBottom: "0.5px solid var(--rt-border)",
          background: "linear-gradient(180deg, var(--rt-bg-subtle) 0%, var(--rt-bg-card) 100%)",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 24,
            height: 24,
            borderRadius: 6,
            border: 0,
            background: "var(--rt-bg-card)",
            color: "var(--rt-text-tertiary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "var(--rt-shadow-sm)",
          }}
        >
          <X size={14} />
        </button>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <BookCover src={node.coverImageUrl} title={node.title} width={84} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2
              className="rt-serif"
              style={{
                fontSize: 17,
                fontWeight: 700,
                lineHeight: 1.25,
                margin: "4px 0 4px",
                letterSpacing: "-0.02em",
                color: "var(--rt-text-primary)",
              }}
            >
              {node.title}
            </h2>
            {node.author && (
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--rt-text-secondary)",
                  marginBottom: 10,
                }}
              >
                {node.author}
              </div>
            )}
            {node.userName && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "var(--rt-text-tertiary)",
                }}
              >
                <Avatar name={node.userName} size={18} />
                <span>{node.userName}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3-stat row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            marginTop: 14,
            background: "var(--rt-border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <StatMini value={node.connectionCount} label="총 연결" />
          <StatMini value={connected.length} label="현재 표시" />
          <StatMini value={crossUsers} label="교차 유저" />
        </div>
      </div>

      {/* 연결 목록 */}
      <div style={{ padding: "14px 14px 18px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--rt-text-tertiary)",
            padding: "0 4px 10px",
          }}
        >
          <span>
            연결된 책{" "}
            <span style={{ color: "var(--rt-text-tertiary)", fontWeight: 500, marginLeft: 4 }}>
              {connected.length}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onAddRelation(node.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 6,
              background: "transparent",
              border: "0.5px solid var(--rt-border)",
              color: "var(--rt-text-secondary)",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            <Plus size={12} /> 추가
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {connected.map(({ node: b, edge }) => (
            <RelItem
              key={b.id}
              book={b}
              reason={edge.reason}
              onSelect={() => onSelect(b.id)}
              onDelete={() => handleDeleteClick(b.id, b.title)}
            />
          ))}
          {connected.length === 0 && (
            <div
              style={{
                padding: "20px 12px",
                fontSize: 12.5,
                color: "var(--rt-text-tertiary)",
                textAlign: "center",
              }}
            >
              연결된 책이 없습니다.
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>연결을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              『{node.title}』 ↔ 『{pendingDelete?.targetTitle}』 연결을 삭제합니다. 양방향 연결이 모두 삭제되며 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatMini({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ background: "var(--rt-bg-card)", padding: "10px 8px", textAlign: "center" }}>
      <div
        className="rt-serif"
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          color: "var(--rt-text-primary)",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: "var(--rt-text-tertiary)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

interface RelItemProps {
  book: GraphNode;
  reason: string | null;
  onSelect: () => void;
  onDelete: () => void;
}

function RelItem({ book, reason, onSelect, onDelete }: RelItemProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 8,
        borderRadius: 8,
        cursor: "pointer",
        transition: "background 120ms",
      }}
      onClick={onSelect}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--rt-bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <BookCover src={book.coverImageUrl} title={book.title} width={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--rt-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {book.title}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--rt-text-tertiary)",
            marginTop: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {book.author ?? "저자 미상"}
          {reason ? ` · ${reason}` : ""}
        </div>
      </div>
      <button
        type="button"
        aria-label="연결 끊기"
        title="연결 끊기"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          border: 0,
          background: "transparent",
          color: "var(--rt-text-tertiary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "hsl(var(--destructive) / 0.12)";
          e.currentTarget.style.color = "hsl(var(--destructive))";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--rt-text-tertiary)";
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

