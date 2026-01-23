import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-noto-serif-kr"
});

export const metadata: Metadata = {
  title: "ReadTree",
  description: "독서 기록 및 공유 플랫폼",
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
 * 테마: 숲 테마(forest)로 고정
 * - html 태그에 직접 "forest" 클래스 적용
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
    <html lang="ko" className="forest">
      <body className={`${inter.variable} ${notoSerifKr.variable} font-sans`}>
        <AuthProvider initialUser={initialUser}>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

