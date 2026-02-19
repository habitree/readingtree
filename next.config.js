/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16에서는 Turbopack이 기본적으로 활성화되어 있음
  // experimental.turbo는 더 이상 지원되지 않음
  images: {
    // WebP 사용 (AVIF는 인코딩 시간이 길어 Vercel 502 타임아웃 유발)
    formats: ['image/webp'],
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
        hostname: 'bookthumb-phinf.pstatic.net',
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
        hostname: '**.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
      },
      {
        protocol: 'https',
        hostname: 'cover.nl.go.kr',
      },
      {
        protocol: 'http',
        hostname: 'cover.nl.go.kr',
      },
    ],
  },
  // 보안 헤더 설정
  async headers() {
    // 공통 보안 헤더
    const securityHeaders = [
      // XSS 필터 활성화 (레거시 브라우저 지원)
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      // MIME 타입 스니핑 방지
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      // 클릭재킹 방지
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      // HTTPS 강제 (1년)
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      },
      // Referrer 정보 제한
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      // DNS 프리페치 제어
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      // 권한 정책 (민감 API 제한)
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
    ];

    // 애니메이션 및 이미지 에셋 캐싱 헤더
    const assetCacheHeaders = [
      {
        source: '/animations/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/trees/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // OG 이미지 캐싱 (카카오톡/SNS 스크래퍼 최적화)
      {
        source: '/opengraph-image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/twitter-image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/share/:path*/opengraph-image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
    ];

    // 개발 환경 CSP (Turbopack HMR을 위해 완화된 정책)
    if (process.env.NODE_ENV === 'development') {
      return [
        ...assetCacheHeaders,
        {
          source: '/:path*',
          headers: [
            ...securityHeaders,
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://*.kakao.com https://*.googleapis.com",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https: blob:",
                "font-src 'self' data: https://fonts.gstatic.com",
                "connect-src 'self' https://*.supabase.co https://*.kakao.com https://*.googleapis.com wss://*.supabase.co ws://localhost:*",
                "frame-src 'self' https://*.supabase.co https://*.kakao.com https://accounts.google.com",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
              ].join('; '),
            },
          ],
        },
      ];
    }

    // 프로덕션 환경 CSP (강화된 정책)
    return [
      ...assetCacheHeaders,
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 프로덕션에서는 unsafe-eval 제거, strict-dynamic 사용 고려
              // Next.js 15+에서는 대부분 필요 없음, 문제 발생 시 unsafe-eval 추가
              "script-src 'self' 'unsafe-inline' https://*.supabase.co https://*.kakao.com https://*.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://*.kakao.com https://*.googleapis.com https://*.google-analytics.com wss://*.supabase.co",
              "frame-src 'self' https://*.supabase.co https://*.kakao.com https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://*.supabase.co https://*.kakao.com",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
              "block-all-mixed-content",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

