/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16에서는 Turbopack이 기본적으로 활성화되어 있음
  // experimental.turbo는 더 이상 지원되지 않음
  images: {
    // AVIF 우선, WebP 폴백 (이미지 용량 50% 감소)
    formats: ['image/avif', 'image/webp'],
    // 이미지 캐싱 최적화 (31일)
    minimumCacheTTL: 2678400,
    // 디바이스 사이즈 최적화
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'bookthumb.phinf.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'shopping-phinf.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'image.aladin.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
      },
    ],
  },
  // 개발 환경에서 CSP 설정 (Turbopack HMR을 위해 필요)
  async headers() {
    // 개발 환경에서만 unsafe-eval 허용
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://*.kakao.com https://*.googleapis.com",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https: blob:",
                "font-src 'self' data:",
                "connect-src 'self' https://*.supabase.co https://*.kakao.com https://*.googleapis.com wss://*.supabase.co",
                "frame-src 'self' https://*.supabase.co https://*.kakao.com https://accounts.google.com",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
                "upgrade-insecure-requests",
              ].join('; '),
            },
          ],
        },
      ];
    }
    // 프로덕션 환경 CSP
    // Next.js Turbopack과 일부 라이브러리가 eval()을 사용할 수 있으므로 unsafe-eval 허용
    // 보안상 위험이 있지만 Next.js 생태계에서 필요할 수 있음
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://*.kakao.com https://*.googleapis.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://*.kakao.com https://*.googleapis.com wss://*.supabase.co",
              "frame-src 'self' https://*.supabase.co https://*.kakao.com https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

