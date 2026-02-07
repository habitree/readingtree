import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/theme/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-serif-kr"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://readtree.vercel.app"),
  title: {
    default: "ReadTree",
    template: "%s | ReadTree",
  },
  description: "독서 기록 및 공유 플랫폼 - 책 관리, 독서 노트, AI 독서 도우미",
  keywords: ["독서", "책", "독서노트", "책 관리", "독서 기록", "AI 독서", "ReadTree"],
  authors: [{ name: "ReadTree" }],
  creator: "ReadTree",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  // Open Graph 설정 (Facebook, LinkedIn, 카카오톡 등)
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://readtree.vercel.app",
    siteName: "ReadTree",
    title: "ReadTree - 독서 기록 및 공유 플랫폼",
    description: "책 관리, 독서 노트, AI 독서 도우미와 함께하는 나만의 독서 여정",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ReadTree - 독서 기록 및 공유 플랫폼",
      },
    ],
  },
  // Twitter 카드 설정
  twitter: {
    card: "summary_large_image",
    title: "ReadTree - 독서 기록 및 공유 플랫폼",
    description: "책 관리, 독서 노트, AI 독서 도우미와 함께하는 나만의 독서 여정",
    images: ["/twitter-image"],
    creator: "@readtree",
  },
  // 로봇 설정
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
    title: "ReadTree",
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
 * - 기본값: forest (숲 테마)
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 성능 최적화: 미들웨어에서 이미 세션을 갱신하므로 중복 조회 제거
  // 각 페이지에서 필요할 때만 getCurrentUser() 호출
  const initialUser = null;

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSerifKr.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="forest"
          themes={["light", "dark", "forest", "forest-dark"]}
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider initialUser={initialUser}>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

