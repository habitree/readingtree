"use client";

import { Quote, MessageSquarePlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export function SocialProofSection() {
    const { t } = useTranslation();

    const useCases = [
        {
            id: 1,
            title: t("landing.socialProof.case1Title"),
            content: t("landing.socialProof.case1Desc"),
            category: t("landing.socialProof.case1Category"),
            color: "bg-paper-50",
        },
        {
            id: 2,
            title: t("landing.socialProof.case2Title"),
            content: t("landing.socialProof.case2Desc"),
            category: t("landing.socialProof.case2Category"),
            color: "bg-charcoal-50",
        },
        {
            id: 3,
            title: t("landing.socialProof.case3Title"),
            content: t("landing.socialProof.case3Desc"),
            category: t("landing.socialProof.case3Category"),
            color: "bg-forest-50",
        },
        {
            id: 4,
            title: t("landing.socialProof.case4Title"),
            content: t("landing.socialProof.case4Desc"),
            category: t("landing.socialProof.case4Category"),
            color: "bg-paper-100",
        },
        {
            id: 5,
            title: t("landing.socialProof.case5Title"),
            content: t("landing.socialProof.case5Desc"),
            category: t("landing.socialProof.case5Category"),
            color: "bg-white",
        },
    ];

    return (
        <section className="py-32 bg-paper-50 relative overflow-hidden font-sans">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-charcoal-200 to-transparent" />
            <div className="absolute -left-20 top-40 w-72 h-72 bg-forest-100 rounded-full blur-3xl opacity-30" />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <span className="text-forest-600 font-bold tracking-wider uppercase text-sm mb-4 block">{t("landing.socialProof.eyebrow")}</span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 font-serif text-charcoal-900 break-keep">
                        {t("landing.socialProof.headline")}
                    </h2>
                    <p className="text-xl text-charcoal-600 font-serif leading-relaxed">
                        {t("landing.socialProof.subtitle")}
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
                                {t("landing.socialProof.featureRequestTitle")}
                            </h3>
                            <p className="text-charcoal-300 mb-8 break-keep text-sm leading-relaxed font-sans">
                                {t("landing.socialProof.featureRequestDesc")}
                            </p>

                            <div className="mt-auto">
                                <Link
                                    href="mailto:contact@readtree.com?subject=ReadTree%20기능%20제안"
                                    className="inline-flex items-center justify-center w-full bg-paper-50 text-charcoal-900 h-14 rounded-2xl font-bold hover:bg-forest-100 transition-colors gap-2"
                                >
                                    {t("landing.socialProof.featureRequestCta")}
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
