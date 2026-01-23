"use client";

import { Quote, MessageSquarePlus, ArrowRight } from "lucide-react";
import Link from "next/link";

const useCases = [
    {
        id: 1,
        title: "독서가 자산이 되는 경험",
        content: "단순히 읽는 것을 넘어, 수집된 문장이 나만의 지식 데이터베이스로 구축됩니다.",
        category: "마케터의 사용 예시",
        color: "bg-paper-50",
    },
    {
        id: 2,
        title: "5분 만에 끝내는 독서 노트",
        content: "이미지 텍스트 추출 기술로 기록 시간을 90% 이상 단축하고 독서에 더 집중하세요.",
        category: "학습/성장 활용 예시",
        color: "bg-charcoal-50",
    },
    {
        id: 3,
        title: "전문가 수준의 지식 공유",
        content: "수집한 문장을 디자인 카드뉴스로 즉시 변환하여 커뮤니티나 블로그에 공유할 수 있습니다.",
        category: "콘텐츠 개발 활용 예시",
        color: "bg-forest-50",
    },
    {
        id: 4,
        title: "강력한 문장 검색",
        content: "기록한 수천 개의 문장 중 필요한 내용을 키워드 하나로 1초 만에 찾아낼 수 있습니다.",
        category: "리서치 활용 예시",
        color: "bg-paper-100",
    },
    {
        id: 5,
        title: "채워지는 서재의 즐거움",
        content: "디지털 서재가 시각적으로 채워지는 과정을 보며 독서 습관을 지속할 동기를 얻습니다.",
        category: "습관 형성 활용 예시",
        color: "bg-white",
    }
];

export function SocialProofSection() {
    return (
        <section className="py-32 bg-paper-50 relative overflow-hidden font-sans">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-charcoal-200 to-transparent" />
            <div className="absolute -left-20 top-40 w-72 h-72 bg-forest-100 rounded-full blur-3xl opacity-30" />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <span className="text-forest-600 font-bold tracking-wider uppercase text-sm mb-4 block">Use Cases</span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 font-serif text-charcoal-900 break-keep">
                        ReadTree와 함께<br />
                        당신의 독서가 변화합니다
                    </h2>
                    <p className="text-xl text-charcoal-600 font-serif leading-relaxed">
                        기록의 번거로움은 줄이고, 독서의 가치는 높이는<br className="hidden md:block" /> ReadTree만의 사용 시나리오를 만나보세요.
                    </p>
                </div>

                {/* Grid Layout (Fixed from Masonry) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                    {useCases.map((item) => (
                        <div
                            key={item.id}
                            className={`flex flex-col rounded-3xl p-8 shadow-sm border border-charcoal-100 ${item.color} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group`}
                        >
                            <Quote className="w-8 h-8 text-forest-600/30 mb-6" />
                            <h3 className="text-xl font-bold text-charcoal-900 mb-3 font-serif">
                                {item.title}
                            </h3>
                            <p className="text-charcoal-600 leading-relaxed mb-auto break-keep font-sans">
                                {item.content}
                            </p>
                            <div className="mt-8 pt-4 border-t border-charcoal-900/5">
                                <span className="text-sm font-medium text-forest-600 bg-forest-50 px-3 py-1 rounded-full">
                                    {item.category}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Feature Request Card */}
                    <div className="flex flex-col rounded-3xl p-8 bg-charcoal-900 text-paper-50 shadow-xl overflow-hidden group">
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="w-12 h-12 bg-charcoal-800 rounded-2xl flex items-center justify-center mb-6 text-paper-50 group-hover:scale-110 transition-transform border border-charcoal-700">
                                <MessageSquarePlus className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold font-serif mb-4">
                                발전하는 ReadTree,<br />의견을 들려주세요
                            </h3>
                            <p className="text-charcoal-300 mb-8 break-keep text-sm leading-relaxed font-sans">
                                ReadTree는 사용자 여러분의 제안을 바탕으로<br />
                                매일 더 나은 독서 파트너가 되어가고 있습니다.<br />
                                필요한 기능이 있다면 언제든 알려주세요.
                            </p>

                            <div className="mt-auto">
                                <Link
                                    href="mailto:contact@readtree.com?subject=ReadTree%20기능%20제안"
                                    className="inline-flex items-center justify-center w-full bg-paper-50 text-charcoal-900 h-14 rounded-2xl font-bold hover:bg-forest-100 transition-colors gap-2"
                                >
                                    기능 요청하기
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
