"use client";

/**
 * 공유 카드 템플릿의 축소 렌더 공용 컴포넌트
 *
 * 템플릿은 800px 고정폭이므로, 컨테이너 폭에 맞춰 zoom으로 축소해 보여준다.
 * - TemplateScaledView: 리포트 본문 표시용 (전체 높이)
 * - TemplateThumb: 스타일 선택 카드의 미니 미리보기 (상단부 크롭, 클릭 통과)
 */

import { useEffect, useState } from "react";
import type { ShareCardData, ShareCardTemplateDef } from "./templates/types";

const CARD_WIDTH = 800;

function useFitScale(node: HTMLDivElement | null): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!node) return;
    const update = () => setScale(Math.min(1, node.clientWidth / CARD_WIDTH));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return scale;
}

interface TemplateScaledViewProps {
  template: ShareCardTemplateDef;
  data: ShareCardData;
  className?: string;
}

export function TemplateScaledView({ template, data, className }: TemplateScaledViewProps) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const scale = useFitScale(node);
  return (
    <div ref={setNode} className={className}>
      <div style={{ zoom: scale, width: CARD_WIDTH, maxWidth: "none" }}>
        <template.Component data={data} />
      </div>
    </div>
  );
}

interface TemplateThumbProps {
  template: ShareCardTemplateDef;
  data: ShareCardData;
  /** 크롭 높이(px). 기본 150 */
  height?: number;
}

export function TemplateThumb({ template, data, height = 150 }: TemplateThumbProps) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const scale = useFitScale(node);
  return (
    <div
      ref={setNode}
      aria-hidden
      className="pointer-events-none select-none overflow-hidden rounded-md border"
      style={{ height, backgroundColor: template.captureBg }}
    >
      <div style={{ zoom: scale, width: CARD_WIDTH, maxWidth: "none" }}>
        <template.Component data={data} />
      </div>
    </div>
  );
}
