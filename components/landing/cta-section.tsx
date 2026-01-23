import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
    return (
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>

            <div className="container px-4 md:px-6 relative z-10 text-center space-y-8">
                <div className="flex flex-col items-center gap-4">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 font-serif break-keep text-charcoal-900">
                        지속적인 성장을 위한<br />
                        당신의 매일 독서 파트너
                    </h2>
                    <p className="text-xl text-charcoal-600 mb-10 break-keep max-w-2xl font-serif">
                        사용자 피드백을 바탕으로 매일 조금씩 성장하며<br />
                        더 깊고 풍요로운 지식 생활을 위해 노력하고 있습니다.
                    </p>

                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-charcoal-900 text-paper-50 text-xl font-bold shadow-xl hover:bg-forest-600 hover:scale-105 transition-all duration-300"
                    >
                        지금 바로 나만의 서재 만들기
                    </Link>
                </div>

                <p className="text-sm text-charcoal-400 mt-8 font-serif">
                    * 가입 즉시 ReadTree의 모든 기능을 활용하실 수 있습니다.
                </p>
            </div>
        </section>
    );
}
