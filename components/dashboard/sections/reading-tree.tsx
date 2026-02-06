"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { getLevelStyle, LEVEL_DEFAULTS } from "@/types/points";
import { cn } from "@/lib/utils";

interface ReadingTreeProps {
    level: number;
    className?: string;
    showTitle?: boolean;
}

/**
 * 독서 나무 컴포넌트
 * 사용자의 레벨에 따라 성장하는 나무 이미지를 표시합니다.
 */
export function ReadingTree({ level, className, showTitle = true }: ReadingTreeProps) {
    const safeLevel = Math.max(1, Math.min(10, level));
    const levelInfo = LEVEL_DEFAULTS.find((l) => l.level === safeLevel);
    const levelStyle = getLevelStyle(safeLevel);

    return (
        <div className={cn("relative flex flex-col items-center", className)}>
            {/* 나무 본체 */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
            >
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 tree-sway">
                    <Image
                        src={`/images/trees/level-${safeLevel}.webp`}
                        alt={`독서나무 레벨 ${safeLevel}: ${levelInfo?.title}`}
                        fill
                        className="object-contain drop-shadow-md transition-all duration-700"
                        priority
                    />
                </div>
            </motion.div>

            {/* 레벨 정보 배지 */}
            {showTitle && levelInfo && (
                <div className="mt-2 flex flex-col items-center">
                    <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-medium shadow-sm border",
                        levelStyle.bgColor,
                        levelStyle.borderColor,
                        levelStyle.textColor,
                    )}>
                        Lv.{safeLevel} {levelInfo.title}
                    </div>
                </div>
            )}
        </div>
    );
}
