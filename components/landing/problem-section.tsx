import { Search, FileQuestion, Share } from "lucide-react";

export function ProblemSection() {
    return (
        <section className="py-24 bg-paper-50 text-charcoal-900 font-sans">
            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div>
                            <span className="text-forest-600 font-bold tracking-wider uppercase text-sm mb-4 block">이런 경험, 있으신가요?</span>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight font-serif break-keep">
                                좋아서 읽었지만<br />
                                남는 건 <span className="text-forest-600 italic font-serif">피로감</span>뿐이라면?
                            </h2>
                        </div>
                        <p className="text-lg text-charcoal-600 leading-relaxed break-keep font-serif">
                            읽고 싶은 책은 쌓여만 가는데, 정리는 엄두가 안 나시나요? <br />
                            과거의 기록을 찾지 못해 같은 책을 또 샀던 경험, 한 번쯤 있으시죠?
                        </p>

                        <div className="grid gap-4">
                            {[
                                { title: "흩어진 기록", desc: "노션, 메모장, 일기장에 제각각", icon: <FileQuestion className="w-5 h-5" /> },
                                { title: "검색 불가", desc: "이미지로 찍어둔 문장은 찾을 수 없음", icon: <Search className="w-5 h-5" /> },
                                { title: "공유의 어려움", desc: "인스타에 올리려면 또 편집해야 함", icon: <Share className="w-5 h-5" /> }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center p-4 rounded-xl bg-white border border-paper-200 shadow-sm hover:border-forest-200 transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-paper-100 flex items-center justify-center mr-4 text-forest-600 group-hover:bg-forest-50 transition-colors">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-charcoal-900 font-serif">{item.title}</h3>
                                        <p className="text-charcoal-500 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative h-[500px] w-full bg-paper-100 rounded-3xl overflow-hidden border border-paper-200 flex items-center justify-center shadow-inner group">
                        {/* More Sophisticated Chaos Visualization */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-50" />

                        <div className="relative z-10 w-full h-full p-8 overflow-hidden">
                            {/* Scattered Notes with various rotations and colors */}
                            <div className="absolute top-[10%] left-[15%] w-32 h-40 bg-white shadow-md p-3 rotate-[-12deg] border border-paper-200 transition-transform group-hover:rotate-[-5deg]">
                                <div className="h-1 w-full bg-charcoal-100 mb-2" />
                                <div className="h-1 w-4/5 bg-charcoal-50 mb-2" />
                                <div className="h-1 w-full bg-charcoal-50 mb-2" />
                            </div>

                            <div className="absolute top-[40%] right-[10%] w-36 h-44 bg-yellow-50/80 shadow-lg p-4 rotate-[15deg] border border-yellow-100 transition-transform group-hover:rotate-[8deg]">
                                <div className="h-2 w-1/2 bg-yellow-200 mb-3" />
                                <div className="h-1 w-full bg-yellow-100 mb-2" />
                                <div className="h-1 w-full bg-yellow-100 mb-2" />
                            </div>

                            <div className="absolute bottom-[15%] left-[20%] w-40 h-32 bg-white shadow-lg p-4 rotate-[5deg] border border-paper-200 transition-transform group-hover:rotate-0">
                                <div className="h-1 w-2/3 bg-forest-100 mb-2" />
                                <div className="h-1 w-full bg-paper-100 mb-2" />
                            </div>

                            <div className="absolute top-[20%] right-[30%] w-48 h-60 bg-paper-50 shadow-xl p-6 rotate-[-8deg] border border-paper-200 transition-transform group-hover:rotate-[-2deg]">
                                <div className="text-[8px] font-serif text-charcoal-300 leading-tight">
                                    "독서는 완성된 사람을 만들고, 담론은 재치 있는 사람을 만들며, 필기는 정확한 사람을 만든다."
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="h-1 w-full bg-charcoal-100" />
                                    <div className="h-1 w-full bg-charcoal-100" />
                                    <div className="h-1 w-2/3 bg-charcoal-100" />
                                </div>
                            </div>

                            {/* Blur Overlays for Depth */}
                            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-forest-100/30 rounded-full blur-3xl" />
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-paper-300/40 rounded-full blur-3xl" />
                        </div>

                        {/* Centered Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-paper-50/20 backdrop-blur-[2px]">
                            <div className="bg-white/90 p-6 rounded-full shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-500">
                                <FileQuestion className="w-12 h-12 text-forest-600 animate-bounce" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
