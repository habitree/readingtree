"use client";

import { Layers, Search, Share2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function BenefitsSection() {
    const { t } = useTranslation();

    const benefits = [
        {
            icon: <Layers className="w-10 h-10 text-primary" />,
            title: t("landing.benefits.benefit1Title"),
            description: t("landing.benefits.benefit1Desc"),
            highlight: t("landing.benefits.benefit1Highlight"),
        },
        {
            icon: <Search className="w-10 h-10 text-primary" />,
            title: t("landing.benefits.benefit2Title"),
            description: t("landing.benefits.benefit2Desc"),
            highlight: t("landing.benefits.benefit2Highlight"),
        },
        {
            icon: <Share2 className="w-10 h-10 text-primary" />,
            title: t("landing.benefits.benefit3Title"),
            description: t("landing.benefits.benefit3Desc"),
            highlight: t("landing.benefits.benefit3Highlight"),
        },
    ];

    return (
        <section className="py-24 bg-paper-100/50">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 break-keep font-serif text-charcoal-900">
                        {t("landing.benefits.headline")}
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
