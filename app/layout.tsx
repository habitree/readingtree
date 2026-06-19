import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif_KR, Noto_Sans_KR, Cormorant_Garamond } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { LanguageInitializer } from "@/components/language-initializer";
import { getCachedCurrentUser, getCachedCurrentUserProfile } from "@/lib/cached";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-noto-serif-kr",
  display: "swap",
});
// AI 독서 리포트(매거진형) 전용 서체
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://readingtree-tan.vercel.app"),
  title: {
    default: "Habitree - 읽는 습관이 자라는 곳",
    template: "%s | Habitree",
  },
  description: "읽는 습관이 자라는 곳 - 독서 기록, AI 도우미, 독서 모임",
  keywords: ["독서", "책", "독서노트", "책 관리", "독서 기록", "AI 독서", "Habitree"],
  authors: [{ name: "Habitree" }],
  creator: "Habitree",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/icon.png", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://readingtree-tan.vercel.app",
    siteName: "Habitree",
    title: "Habitree - 읽는 습관이 자라는 곳",
    description: "독서 기록, AI 도우미, 독서 모임과 함께하는 나만의 독서 여정",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Habitree - 읽는 습관이 자라는 곳",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Habitree - 읽는 습관이 자라는 곳",
    description: "독서 기록, AI 도우미, 독서 모임과 함께하는 나만의 독서 여정",
    creator: "@habitree",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Habitree",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)", color: "#16a34a" },
  ],
};

/**
 * 루트 레이아웃
 * 모든 페이지에 공통으로 적용되는 레이아웃
 *
 * 성능 최적화: 중복 세션 조회 제거
 * - 미들웨어에서 이미 세션을 갱신하므로, 레이아웃에서는 조회하지 않음
 * - 각 페이지에서 필요할 때만 getCurrentUser() 호출
 * - AuthProvider는 클라이언트에서 onAuthStateChange로 세션 동기화
 *
 * 테마: next-themes를 통한 동적 테마 지원
 * - light, dark, forest, forest-dark 4가지 테마
 * - 기본값: dark (밤 테마)
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버에서 현재 사용자 정보를 가져와 AuthProvider에 전달
  // → 클라이언트 hydration 시 즉시 인증 상태 반영 (로그인 버튼 깜빡임 방지)
  const initialUser = await getCachedCurrentUser();
  // user가 있을 때만 프로필 조회 (게스트는 skip)
  const initialProfile = initialUser ? await getCachedCurrentUserProfile() : null;

  return (
    <html lang="ko" suppressHydrationWarning>
      {GA_MEASUREMENT_ID && (
        <head>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </head>
      )}
      <body className={`${inter.variable} ${notoSerifKr.variable} ${notoSansKr.variable} ${cormorant.variable} font-sans`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          themes={["light", "dark", "forest", "forest-dark"]}
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider initialUser={initialUser} initialProfile={initialProfile}>
            <LanguageInitializer />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

