"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Home,
  BookOpen,
  Library,
  PenLine,
  Users,
  User,
  Bot,
  BarChart3,
  Search,
  Music2,
  Coins,
  CreditCard,
  Lock,
  Share2,
  Palette,
  Lightbulb,
  MoreHorizontal,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FEATURE_AREA_TREE,
  getFeatureAreaBreadcrumb,
  getFeatureAreaIcon,
  type FeatureAreaNode,
} from "@/lib/constants/feature-area-tree";
import { useTranslation } from "@/lib/i18n";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  BookOpen,
  Library,
  PenLine,
  Users,
  User,
  Bot,
  BarChart3,
  Search,
  Music2,
  Coins,
  CreditCard,
  Lock,
  Share2,
  Palette,
  Lightbulb,
  MoreHorizontal,
};

interface FeatureAreaPickerProps {
  value: string | null;
  onChange: (areaId: string | null) => void;
  className?: string;
}

export function FeatureAreaPicker({
  value,
  onChange,
  className,
}: FeatureAreaPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
  };

  const iconName = value ? getFeatureAreaIcon(value) : undefined;
  const IconComponent = iconName ? ICON_MAP[iconName] : MapPin;
  const displayText = value
    ? getFeatureAreaBreadcrumb(value, "ko")
    : t("featureRequests.featureAreaPlaceholder");

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* 트리거 버튼 */}
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal h-auto min-h-[40px] py-2",
          !value && "text-muted-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <IconComponent className="h-4 w-4 mr-2 shrink-0" />
        <span className="truncate flex-1">{displayText}</span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => { if (e.key === "Enter") handleClear(e as unknown as React.MouseEvent); }}
            className="ml-1 shrink-0 rounded-full p-0.5 hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </Button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-[300px] overflow-y-auto">
          <div className="p-1">
            {FEATURE_AREA_TREE.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                selectedId={value}
                expandedIds={expandedIds}
                onSelect={handleSelect}
                onToggleExpand={toggleExpand}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TreeNodeProps {
  node: FeatureAreaNode;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string, e: React.MouseEvent) => void;
}

function TreeNode({
  node,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const IconComponent = node.icon ? ICON_MAP[node.icon] : undefined;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-sm cursor-pointer text-sm hover:bg-accent transition-colors",
          isSelected && "bg-accent font-medium"
        )}
        onClick={() => onSelect(node.id)}
      >
        {/* 펼침/접기 화살표 */}
        {hasChildren ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => onToggleExpand(node.id, e)}
            onKeyDown={(e) => { if (e.key === "Enter") onToggleExpand(node.id, e as unknown as React.MouseEvent); }}
            className="shrink-0 p-0.5 rounded hover:bg-muted-foreground/20"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </span>
        ) : (
          <span className="w-[22px] shrink-0" />
        )}

        {/* 아이콘 */}
        {IconComponent && (
          <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* 라벨 */}
        <span className="truncate flex-1">{node.labelKo}</span>

        {/* 선택 체크 */}
        {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
      </div>

      {/* 하위 항목 */}
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {node.children!.map((child) => (
            <div
              key={child.id}
              className={cn(
                "flex items-center gap-1 px-2 py-1.5 pl-6 rounded-sm cursor-pointer text-sm hover:bg-accent transition-colors",
                selectedId === child.id && "bg-accent font-medium"
              )}
              onClick={() => onSelect(child.id)}
            >
              <span className="truncate flex-1 text-muted-foreground">
                {child.labelKo}
              </span>
              {selectedId === child.id && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
