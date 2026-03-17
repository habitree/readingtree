"use client";

import { Trees, Calendar, MapPin, Check, Quote, User as UserIcon, MessageSquarePlus, ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const customerFaqData = [
    { q: "ReadTree는 무엇인가요?", a: "ReadTree는 책을 읽으며 남긴 필사, 사진, 메모, 인상 깊은 문장을 자동으로 정리하고 다시 찾게 해주는 책 전용 기록·공유 플랫폼입니다." },
    { q: "왜 ReadTree가 필요한가요? 기존 앱으로도 기록 가능한데요?", a: "기록은 어디서나 가능하지만 기존 앱은 기록이 흩어지고 다시 찾기 어려우며 책 단위로 정리되지 않습니다. ReadTree는 책 하나를 위한 전용 저장소로 기록을 자동으로 한 곳에 정리해줍니다." },
    { q: "기록은 어떻게 자동 정리되나요?", a: "필사 입력, 사진 업로드, 텍스트 캡처, 메모 작성 등 모든 활동이 해당 책의 노트로 자동 연결되어 정리됩니다." },
    { q: "인상 깊었던 문장을 다시 찾을 수 있나요?", a: "네. ReadTree는 기록을 문장 단위로 저장하며 책 제목, 날짜, 주제, 필사 유형 등으로 빠르게 검색할 수 있습니다." },
    { q: "다른 사람의 필사나 생각도 볼 수 있나요?", a: "네, 원할 경우 공개된 필사·메모를 다른 사용자도 볼 수 있습니다. 기본값은 비공개이며 사용자 선택에 따라 공개 여부를 결정합니다." },
    { q: "독서모임 기능이 있나요?", a: "있습니다. 읽는 책 리스트 공유, 구성원 필사/메모 공유, 진행 현황 표시, 모임 활동 요약 등을 제공하여 모임 운영자에게 특히 유용합니다." },
    { q: "SNS나 블로그에 쉽게 공유할 수 있나요?", a: "네. 필사, 문장, 메모를 카드뉴스 형태로 자동 생성하여 인스타그램, 카카오톡, 블로그 등에 바로 공유할 수 있습니다." },
    { q: "내 기록은 어떻게 보호되나요?", a: "모든 기록은 암호화된 DB에 저장되며 기본 비공개 상태입니다. 공개 여부는 완전 비공개, 그룹 공개, 전체 공개 중에서 선택할 수 있습니다." },
    { q: "가격은 어떻게 되나요?", a: "기본 기능은 무료입니다. AI 채팅, OCR 필사, AI 리포트 등 고급 기능은 무료 한도 내에서 사용 가능하며, 추가 이용 시 포인트를 충전하여 사용할 수 있습니다." },
    { q: "책 대여/판매/선물 기능도 있나요?", a: "초기에는 제공되지 않습니다. 하지만 ReadTree 내에서 신뢰 네트워크가 형성되면 2차 단계 BM으로 확장될 예정입니다." }
];

const stakeholderFaqData = [
    { q: "이 문제는 해결할 가치가 있는 문제인가?", a: "그렇다. 독자들은 오랫동안 '기록을 다시 찾지 못하는 문제'를 반복 경험해왔습니다. 이는 실질적·감정적 Pain Point이며 현재 어떤 도구도 책 전용 정리·검색 경험을 제공하지 못하고 있습니다." },
    { q: "경쟁 서비스와의 차별점은 무엇인가?", a: "노션은 템플릿 제작이 어렵고, 기존 서점 앱은 기능이 단편적입니다. ReadTree는 '책 기반 DB + 자동 정리 + 검색 + 공유 + 커뮤니티'가 결합된 독보적인 솔루션입니다." },
    { q: "고객에게 WOW 경험을 주는 핵심 기능은?", a: "기록 자동 정리(Zero-Effort Logging), 문장 재발견(Search & Recall), 독서 타임라인 시각화, 그리고 즉시 공유(One-Tap Sharing) 기능입니다." },
    { q: "초기 성공 지표(Metrics)은 무엇인가?", a: "활성 사용자 수(WAU), 기록 재사용률(검색), 필사·메모 작성수, 타임라인 조회 빈도, 공유 횟수 등이 있습니다." },
    { q: "기술적으로 구현 가능하나요?", a: "네. React, Firebase(Auth, Firestore), 이미지 OCR 등을 활용하여 서버리스 기반으로 MVP를 충분히 구현할 수 있습니다." },
    { q: "프라이버시 위험은 없나요?", a: "기본 비공개이며, Firestore 보안 규칙으로 사용자별 접근을 철저히 분리하므로 안전합니다." },
    { q: "왜 책 거래 기능은 초기 론칭에서 제외되었나요?", a: "물류, 정산, 사기 방지 등 높은 복잡성과 신뢰 시스템이 필요하기 때문입니다. 사용자 기반이 쌓인 후 2차 확장 BM으로 도입될 예정입니다." },
    { q: "실패 가능성과 대응 전략은 무엇인가요?", a: "자동화 품질 저하나 재방문 동기 부족이 리스크일 수 있습니다. 이에 대해 검색 경험 강화, 공유 템플릿 개선, '나의 독서 리포트' 제공 등으로 대응할 계획입니다." }
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-paper-50 font-sans text-charcoal-900">
            {/* Header / Hero */}
            <header className="bg-charcoal-900 text-paper-50 py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/gplay.png')] opacity-10" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <span className="inline-block px-4 py-1.5 bg-forest-600 text-paper-50 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-forest-500 shadow-lg">
                        Official Press Kit
                    </span>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 tracking-tight">
                        ReadTree by Habitree
                    </h1>
                    <p className="text-xl text-paper-200 max-w-2xl mx-auto font-serif italic">
                        &quot;독서 기록이 사라지지 않는 시대, 2026년 1월 여러분을 찾아갑니다.&quot;
                    </p>
                </div>
            </header>

            <main className="container mx-auto px-4 py-16 space-y-24 max-w-5xl">

                {/* Press Release Section */}
                <article className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-paper-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-forest-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:opacity-80 transition-opacity" />

                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal-400 mb-8 border-b border-paper-100 pb-6">
                            <span className="bg-paper-100 px-3 py-1 rounded-full font-bold text-forest-700">보도자료</span>
                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> 2025년 12월</span>
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> 서울</span>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold text-charcoal-900 leading-tight font-serif mb-8 break-keep">
                            독서 기록이 사라지지 않는 시대:<br />
                            Readtree 독서플랫폼이 읽었던 문장을 다시 찾고<br />
                            공유할 수 있게 해줍니다
                        </h2>

                        <div className="text-xl text-charcoal-600 font-medium leading-relaxed mb-12 font-serif bg-forest-50/30 p-6 rounded-2xl border-l-4 border-forest-500">
                            2026년 1월, ReadTree가 출시됩니다. 독서를 좋아하는 사람들이 인상 깊었던 문장을 다시 찾고, 흩어진 기록을 한 곳에서 관리하며, 쉽게 공유할 수 있게 해주는 책 전용 플랫폼입니다.
                        </div>

                        <div className="space-y-12 text-lg text-charcoal-700 leading-relaxed">
                            <section>
                                <h3 className="text-2xl font-bold text-forest-800 mb-4 font-serif">문제와 기회: &quot;그 문장이 어디 있었지?&quot;</h3>
                                <p className="mb-6 break-keep">
                                    독서를 좋아하는 사람들에게는 늘 같은 고민이 있습니다. 인상 깊었던 문장을 사진으로 찍거나 메모에 저장했지만, 나중에 다시 찾으려 할 때 어디에 저장했는지 기억나지 않는 것입니다. 카카오톡, 사진 앨범, 노션, 메모 앱 등 여러 곳에 흩어진 기록들을 하나로 모으는 것은 더욱 어려운 일입니다.
                                </p>
                                <p className="break-keep">
                                    독서모임을 운영하는 사람들 역시 구성원들의 읽기 진행 상황과 메모가 분산되어 있어 운영 부담을 느낍니다. 현재 독서 기록은 평균 3~4개의 다른 앱에 분산 저장되며, 저장한 문장을 다시 찾는 데 평균 10분 이상이 소요됩니다.
                                </p>
                            </section>

                            <section className="bg-paper-50 p-8 rounded-3xl border border-paper-200 shadow-inner">
                                <h3 className="text-2xl font-bold text-charcoal-900 mb-6 font-serif">Readtree 독서플랫폼의 솔루션</h3>
                                <ul className="space-y-6">
                                    {[
                                        { title: "기록의 통합", desc: "필사, 사진, 메모가 해당 책의 노트로 자동 연결되어 정리됩니다." },
                                        { title: "강력한 검색", desc: "문장 단위 저장으로 책 제목, 주제, 내용으로 즉시 검색이 가능합니다." },
                                        { title: "쉬운 공유", desc: "클릭 한 번으로 인상 깊은 문장을 카드뉴스로 변환하여 SNS에 공유할 수 있습니다." }
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-forest-500 text-paper-50 flex items-center justify-center flex-shrink-0 animate-pulse">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <strong className="text-charcoal-900 block text-xl mb-1">{item.title}</strong>
                                                <span className="text-charcoal-600">{item.desc}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-2xl font-bold text-forest-800 mb-6 font-serif underline decoration-forest-200 decoration-8 underline-offset-[-2px]">리더십 메시지</h3>
                                <blockquote className="relative p-10 bg-charcoal-900 text-paper-50 rounded-3xl overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-forest-500" />
                                    <Quote className="absolute top-6 right-8 w-16 h-16 text-paper-50 opacity-10 group-hover:scale-110 transition-transform" />
                                    <p className="text-xl md:text-2xl font-serif italic leading-relaxed relative z-10 break-keep">
                                        &quot;우리는 독서를 좋아하는 사람으로서, 좋은 문장을 찾아도 나중에 다시 찾지 못하는 답답함을 직접 경험했습니다. ReadTree는 이런 경험을 바탕으로 만들어졌습니다. 독서를 통해 얻은 지식과 감동을 잃지 않고, 계속해서 성장할 수 있도록 돕는 것이 우리의 목표입니다.&quot;
                                    </p>
                                </blockquote>
                            </section>

                            <section>
                                <h3 className="text-2xl font-bold text-forest-800 mb-8 font-serif">사용자의 목소리 (기대 효과)</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="bg-paper-100 p-8 rounded-3xl border border-paper-200 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-forest-600 text-paper-50 rounded-2xl flex items-center justify-center font-bold text-xl font-serif">
                                                S
                                            </div>
                                            <div>
                                                <div className="font-bold text-charcoal-900 text-lg">마케터 독자</div>
                                                <div className="text-sm text-charcoal-400">지식 자산화</div>
                                            </div>
                                        </div>
                                        <p className="text-charcoal-700 font-serif leading-relaxed italic">
                                            &quot;ReadTree를 사용하니 모든 기록이 책별로 정리되고, 검색도 쉬워서 독서 습관이 더 좋아졌습니다. 특히 공유 기능이 편리해서 자주 활용하게 되네요.&quot;
                                        </p>
                                    </div>
                                    <div className="bg-paper-100 p-8 rounded-3xl border border-paper-200 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-charcoal-800 text-paper-50 rounded-2xl flex items-center justify-center font-bold text-xl font-serif">
                                                J
                                            </div>
                                            <div>
                                                <div className="font-bold text-charcoal-900 text-lg">독서모임 리더</div>
                                                <div className="text-sm text-charcoal-400">모임 운영 효율화</div>
                                            </div>
                                        </div>
                                        <p className="text-charcoal-700 font-serif leading-relaxed italic">
                                            &quot;모임 운영 부담이 확실히 줄었고, 구성원들도 더 적극적으로 참여하게 되었습니다. 모임의 질이 한층 높아진 느낌이에요.&quot;
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </article>

                {/* FAQ Section */}
                <section className="space-y-12">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold text-charcoal-900 mb-4 font-serif">자주 묻는 질문 (FAQ)</h2>
                        <p className="text-xl text-charcoal-500 font-serif italic">ReadTree 서비스에 대해 궁금한 점을 확인하세요.</p>
                    </div>

                    <div className="space-y-12">
                        {/* Customer FAQ */}
                        <div className="bg-white rounded-3xl shadow-lg border border-paper-200 overflow-hidden">
                            <div className="bg-forest-600 px-8 py-6 text-paper-50">
                                <h3 className="text-2xl font-bold flex items-center gap-3 font-serif">
                                    <UserIcon className="w-6 h-6" /> 고객(Customer) FAQ
                                </h3>
                            </div>
                            <div className="divide-y divide-paper-100">
                                {customerFaqData.map((faq, idx) => (
                                    <FaqItem key={idx} q={faq.q} a={faq.a} />
                                ))}
                            </div>
                        </div>

                        {/* Stakeholder FAQ */}
                        <div className="bg-white rounded-3xl shadow-lg border border-paper-200 overflow-hidden">
                            <div className="bg-charcoal-800 px-8 py-6 text-paper-50">
                                <h3 className="text-2xl font-bold flex items-center gap-3 font-serif">
                                    <MessageSquarePlus className="w-6 h-6" /> 이해관계자(Stakeholder) FAQ
                                </h3>
                            </div>
                            <div className="divide-y divide-paper-100">
                                {stakeholderFaqData.map((faq, idx) => (
                                    <FaqItem key={idx} q={faq.q} a={faq.a} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer / CTA in About Page */}
            <footer className="bg-paper-200 py-20 mt-20 border-t border-paper-300">
                <div className="container mx-auto px-4 text-center space-y-8">
                    <div className="flex justify-center items-center gap-3 text-forest-700 font-bold text-3xl font-serif">
                        <Trees className="w-10 h-10" /> Habitree
                    </div>
                    <p className="text-charcoal-500 text-lg">
                        문의: <a href="https://open.kakao.com/o/gGXr3Zji" target="_blank" rel="noopener noreferrer" className="text-forest-600 hover:underline font-bold">카카오톡 오픈채팅</a>
                    </p>
                    <div className="pt-8">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center px-10 py-4 rounded-2xl bg-charcoal-900 text-paper-50 font-bold text-xl hover:bg-forest-700 transition-colors shadow-xl hover:-translate-y-1"
                        >
                            메인 페이지로 돌아가기
                        </Link>
                    </div>
                    <p className="text-sm text-charcoal-400 font-mono">
                        © 2026 ReadTree by Habitree. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function FaqItem({ q, a }: { q: string, a: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="group">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left px-8 py-6 focus:outline-none hover:bg-paper-50 transition-colors duration-300"
            >
                <span className={cn(
                    "text-xl font-bold transition-colors duration-300 break-keep font-serif",
                    isOpen ? "text-forest-700" : "text-charcoal-700 group-hover:text-forest-600"
                )}>
                    Q. {q}
                </span>
                <ChevronDown className={cn(
                    "w-6 h-6 text-charcoal-300 transition-transform duration-500",
                    isOpen && "rotate-180 text-forest-500"
                )} />
            </button>
            <div className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out bg-paper-50/50",
                isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="px-10 py-8 text-lg text-charcoal-600 border-t border-paper-100 leading-relaxed font-sans break-keep">
                    {a}
                </div>
            </div>
        </div>
    );
}
