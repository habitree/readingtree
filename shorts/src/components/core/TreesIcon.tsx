import React from "react";

interface TreesIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Lucide Trees 아이콘 - ReadTree 서비스 헤더 로고와 동일
 * lucide-react v0.562.0의 trees 아이콘 SVG 경로 추출
 */
export const TreesIcon: React.FC<TreesIconProps> = ({
  size = 32,
  color = "#24855e",
  strokeWidth = 2,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" />
      <path d="M7 16v6" />
      <path d="M13 19v3" />
      <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5" />
    </svg>
  );
};
