import { Layers, Search, Share2 } from "lucide-react";

export function BenefitsSection() {
    const benefits = [
        {
            icon: <Layers className="w-10 h-10 text-primary" />,
            title: "완벽한 기록 통합",
            description: "인용구, 메모, 사진 필사가 책 한 권에 자동으로 모입니다. 파편화된 기록의 스트레스에서 해방되세요.",
            highlight: "정리의 자동화"
        },
        {
            icon: <Search className="w-10 h-10 text-primary" />,
            title: "1초 만에 문장 소환",
            description: "3년 전에 읽은 책의 구절도 키워드 하나면 즉시 찾습니다. 당신의 독서 이력이 거대한 지식 데이터베이스가 됩니다.",
            highlight: "지식의 자산화"
        },
        {
            icon: <Share2 className="w-10 h-10 text-primary" />,
            title: "감각적인 공유",
            description: "혼자 보기 아까운 문장을 디자이너급 카드뉴스로 변환하세요. 인스타그램, 독서모임에 즉시 공유할 수 있습니다.",
            highlight: "영향력의 확장"
        }
    ];

    return (
        <section className="py-24 bg-paper-100/50">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 break-keep font-serif text-charcoal-900">
                        독서의 모든 과정이<br className="md:hidden" /> 하나의 흐름으로 완성됩니다
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-8 shadow-sm border border-paper-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-paper-100 flex items-center justify-center mb-6 group-hover:bg-paper-200 transition-colors text-forest-600">
                                {benefit.icon}
                            </div>
                            <div className="text-sm font-bold text-forest-600 mb-2 tracking-wide uppercase font-sans">
                                {benefit.highlight}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-charcoal-900 break-keep font-serif">
                                {benefit.title}
                            </h3>
                            <p className="text-charcoal-500 leading-relaxed break-keep font-sans">
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
