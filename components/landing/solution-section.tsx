import { Camera, Search, Share2, ScanText, ArrowRight } from "lucide-react";

export function SolutionSection() {
    return (
        <section className="py-32 bg-paper-100 text-charcoal-900 overflow-hidden">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-20 max-w-2xl mx-auto">
                    <span className="text-forest-600 font-bold tracking-wider uppercase text-sm mb-4 block">이렇게 해결합니다</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 break-keep">
                        독서 기록 시스템
                    </h2>
                    <p className="text-xl text-charcoal-600 leading-relaxed break-keep font-serif">
                        흩어진 문장들을 모으는 일이 더 이상 번거롭지 않습니다.
                    </p>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)] max-w-6xl mx-auto">

                    {/* Card 1: OCR (Large, spans 2 cols) */}
                    <div className="md:col-span-2 relative group bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-paper-200 hover:shadow-xl transition-all duration-500 overflow-hidden">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="w-12 h-12 bg-charcoal-100 rounded-2xl flex items-center justify-center mb-6 text-charcoal-900">
                                    <Camera className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">AI 텍스트 추출</h3>
                                <p className="text-charcoal-500 text-lg max-w-md break-keep">
                                    찍으면 텍스트로
                                </p>
                            </div>

                            {/* Interactive Demo UI */}
                            <div className="mt-8 bg-charcoal-50 rounded-xl p-4 border border-charcoal-100 md:w-2/3 backdrop-blur-sm self-end transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                <div className="flex gap-4 items-center">
                                    <div className="w-16 h-16 bg-charcoal-200 rounded-lg flex-shrink-0" /> {/* Thumbnail */}
                                    <div className="space-y-2 flex-1">
                                        <div className="h-2 bg-charcoal-200 rounded w-full animate-pulse" />
                                        <div className="h-2 bg-charcoal-200 rounded w-3/4 animate-pulse delay-75" />
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">인식 완료</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Blob Background */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-paper-200/50 rounded-full blur-3xl -mr-20 -mt-20 z-0" />
                    </div>

                    {/* Card 2: Automatic Sorting (Vertical) */}
                    <div className="md:row-span-2 bg-charcoal-900 text-paper-50 rounded-3xl p-8 md:p-12 shadow-xl hover:scale-[1.02] transition-transform duration-500 relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />

                        <div className="relative z-10 mb-auto">
                            <div className="w-12 h-12 bg-charcoal-800 rounded-2xl flex items-center justify-center mb-6 text-paper-50 border border-charcoal-700">
                                <ScanText className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">자동 페이지 정렬</h3>
                            <p className="text-charcoal-400 text-lg leading-relaxed break-keep">
                                순서대로 정렬
                            </p>
                        </div>

                        {/* Stacking Cards Animation */}
                        <div className="mt-8 relative h-64 w-full flex justify-center items-center">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="absolute w-40 h-52 bg-white rounded-lg shadow-lg border border-charcoal-200 transition-all duration-700 ease-out"
                                    style={{
                                        top: `${i * 15}px`,
                                        zIndex: 3 - i,
                                        transform: `scale(${1 - i * 0.05}) translateY(${i * 10}px)`,
                                        opacity: 1 - i * 0.2
                                    }}
                                >
                                    <div className="p-3 border-b border-gray-100 flex justify-between">
                                        <div className="w-4 h-4 bg-gray-200 rounded-full" />
                                        <div className="w-8 h-2 bg-gray-200 rounded" />
                                    </div>
                                    <div className="p-3 space-y-2">
                                        <div className="w-full h-2 bg-gray-100 rounded" />
                                        <div className="w-full h-2 bg-gray-100 rounded" />
                                        <div className="w-2/3 h-2 bg-gray-100 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Card 3: Instant Search */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-paper-200 hover:shadow-lg transition-all duration-300 group">
                        <div className="w-12 h-12 bg-forest-50 rounded-2xl flex items-center justify-center mb-6 text-forest-600">
                            <Search className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">문장 검색</h3>
                        <p className="text-charcoal-500">
                            "그 문장 뭐였지?"<br />키워드 하나로 1초 만에 찾으세요.
                        </p>
                    </div>

                    {/* Card 4: Sharing */}
                    <div className="bg-forest-50 rounded-3xl p-8 shadow-sm border border-forest-100 hover:shadow-lg transition-all duration-300 group">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 text-forest-600">
                            <Share2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">카드뉴스 공유</h3>
                        <div className="flex items-center text-forest-700 font-medium mt-auto group-hover:translate-x-1 transition-transform cursor-pointer">
                            예시 보기 <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
