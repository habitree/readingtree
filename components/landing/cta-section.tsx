"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function CtaSection() {
    const { t } = useTranslation();

    return (
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>

            <div className="container px-4 md:px-6 relative z-10 text-center space-y-8">
                <div className="flex flex-col items-center gap-4">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 font-serif break-keep text-charcoal-900">
                        {t("landing.cta.headline")}
                    </h2>

                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-charcoal-900 text-paper-50 text-xl font-bold shadow-xl hover:bg-forest-600 hover:scale-105 transition-all duration-300"
                    >
                        {t("landing.cta.button")}
                    </Link>
                </div>

                <p className="text-sm text-charcoal-400 mt-8 font-serif">
                    {t("landing.cta.disclaimer")}
                </p>
            </div>
        </section>
    );
}
