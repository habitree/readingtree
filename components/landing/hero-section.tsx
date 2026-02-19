"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Highlighter, Library } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function HeroSection() {
    const { t } = useTranslation();

    return (
        <section className="relative w-full min-h-[90vh] flex items-center bg-paper-50 overflow-hidden font-sans">
            {/* Background Texture/Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-paper-100/50 via-transparent to-transparent opacity-60" />

            <div className="container px-4 md:px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Column: Typography & CTA */}
                <div className="flex flex-col items-start text-left space-y-8 max-w-2xl">
                    <div className="inline-flex items-center rounded-full border border-charcoal-200 bg-paper-100 px-4 py-1.5 text-sm font-medium text-charcoal-600 shadow-sm transition-colors hover:bg-paper-200 cursor-default">
                        <span className="flex h-2 w-2 rounded-full bg-forest-500 mr-2 animate-pulse" />
                        {t("landing.hero.badge")}
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-7xl font-serif font-bold text-charcoal-900 leading-[1.2] tracking-tight break-keep">
                        {t("landing.hero.headline1")} <span className="text-forest-700">{t("landing.hero.headline2")}</span>{t("landing.hero.headline3")}<br />
                        {t("landing.hero.headline4")}{" "}
                        <span className="relative inline-block text-forest-800">
                            {t("landing.hero.headline5")}
                            <svg className="absolute w-full h-4 -bottom-1 left-0 text-forest-300/60 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="12" fill="none" />
                            </svg>
                        </span>
                        {t("landing.hero.headline6")}
                    </h1>

                    <p className="text-xl md:text-2xl text-charcoal-600 leading-relaxed max-w-lg break-keep font-serif">
                        {t("landing.hero.subtitle")}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
                        <Link
                            href="/books"
                            className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-charcoal-900 text-paper-50 text-lg font-medium shadow-xl hover:bg-charcoal-800 hover:translate-y-[-2px] transition-all duration-300"
                        >
                            {t("landing.hero.ctaPrimary")}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                        <Link
                            href="/about"
                            className="inline-flex items-center justify-center h-14 px-8 rounded-xl border-2 border-charcoal-200 bg-transparent text-charcoal-900 text-lg font-medium hover:bg-charcoal-50 hover:border-charcoal-300 transition-all duration-300"
                        >
                            {t("landing.hero.ctaSecondary")}
                        </Link>
                    </div>

                    <div className="pt-8 flex items-center gap-4 text-sm text-charcoal-500 font-serif italic">
                        <p>{t("landing.hero.tagline")}</p>
                    </div>
                </div>

                {/* Right Column: Visual Elements (3D Book Representation) */}
                <div className="hidden lg:flex relative justify-center items-center h-full min-h-[600px] perspective-1000">
                    {/* Abstract Decorative Elements */}
                    <div className="absolute top-1/4 right-10 w-64 h-64 bg-forest-100 rounded-full blur-3xl opacity-30 animate-pulse-slow" />
                    <div className="absolute bottom-1/4 left-10 w-72 h-72 bg-paper-300 rounded-full blur-3xl opacity-40 animate-pulse-slow delay-1000" />

                    {/* Simulated 3D Book Layout */}
                    <div className="relative w-[400px] h-[560px] bg-white rounded-r-2xl rounded-l-md shadow-2xl border-l-[12px] border-charcoal-800 flex flex-col overflow-hidden rotate-y-[-15deg] rotate-x-[5deg] hover:rotate-y-[0deg] hover:rotate-x-[0deg] transition-transform duration-700 ease-out cursor-pointer group">
                        <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/10 to-transparent z-10" />

                        {/* Header Area */}
                        <div className="h-1/3 bg-paper-100 p-8 flex flex-col justify-between border-b border-paper-200">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-charcoal-900 text-paper-50 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div className="text-xs font-mono text-charcoal-400">P. 124</div>
                            </div>
                            <div className="font-serif text-2xl font-bold text-charcoal-900">
                                {t("landing.hero.bookTitle")}
                            </div>
                        </div>

                        {/* Content Area (Simulated Highlights) */}
                        <div className="flex-1 bg-white p-8 space-y-6 relative">
                            <div className="space-y-2">
                                <div className="h-2 w-full bg-charcoal-100 rounded" />
                                <div className="h-2 w-5/6 bg-charcoal-100 rounded" />
                                <div className="h-2 w-full bg-charcoal-100 rounded" />
                            </div>

                            {/* Highlighted Text */}
                            <div className="relative p-1">
                                <div className="absolute inset-0 bg-yellow-100/50 -rotate-1 rounded-sm transform origin-left group-hover:bg-yellow-200/50 transition-colors" />
                                <p className="relative font-serif text-charcoal-800 text-lg leading-relaxed italic">
                                    {t("landing.hero.bookQuote")}
                                </p>
                            </div>

                            <div className="space-y-2 pt-4">
                                <div className="h-2 w-11/12 bg-charcoal-100 rounded" />
                                <div className="h-2 w-full bg-charcoal-100 rounded" />
                                <div className="h-2 w-4/6 bg-charcoal-100 rounded" />
                            </div>

                            {/* Scanner Overlay UI */}
                            <div className="absolute bottom-8 right-8 bg-charcoal-900/90 backdrop-blur text-white px-4 py-2 rounded-full text-sm flex items-center shadow-lg transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                <Highlighter className="w-4 h-4 mr-2" />
                                {t("landing.hero.extracting")}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
