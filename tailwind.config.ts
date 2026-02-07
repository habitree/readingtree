import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        forest: {
          50: "#f2fcf5",
          100: "#e1f8e8",
          200: "#c3eed4",
          300: "#94deb8",
          400: "#5ec496",
          500: "#36a678",
          600: "#24855e",
          700: "#1d6b4d",
          800: "#1a553f",
          900: "#164635",
          950: "#0b271e",
        },
        paper: {
          50: "#FDFBF7", // Creamy White
          100: "#F8F4EE",
          200: "#F0E9DD",
          300: "#E2D7C5",
          400: "#D1C0A8",
          500: "#BFA586", // Kraft Paper Like
          600: "#A88B6B",
          700: "#8C7152",
          800: "#735C45",
          900: "#5E4B39",
          950: "#34291F",
        },
        charcoal: {
          50: "#F5F7FA",
          100: "#E4E7EB",
          200: "#CBD2D9",
          300: "#9AA5B1",
          400: "#7B8794",
          500: "#616E7C",
          600: "#52606D",
          700: "#3E4C59",
          800: "#323F4B",
          900: "#1F2933", // Deep Blueish Gray
          950: "#12171d",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // 8dp 그리드 시스템: 간격 스케일
      spacing: {
        // 8의 배수로 간격 정의
        '0.5': '2px',   // 4dp의 절반
        '1': '4px',     // 4dp
        '2': '8px',     // 8dp (기본 단위)
        '3': '12px',    // 1.5 * 8dp
        '4': '16px',    // 2 * 8dp
        '5': '20px',    // 2.5 * 8dp
        '6': '24px',    // 3 * 8dp
        '8': '32px',    // 4 * 8dp
        '10': '40px',   // 5 * 8dp
        '12': '48px',   // 6 * 8dp
        '16': '64px',   // 8 * 8dp
      },
      // 타이포그래피: 행간 (Line Height)
      lineHeight: {
        'tight': '1.2',      // 제목용 (120%)
        'snug': '1.375',    // 부제목용 (137.5%)
        'normal': '1.5',    // 본문용 (150%)
        'relaxed': '1.625', // 여유로운 본문 (162.5%)
        'loose': '1.75',    // 넓은 간격 (175%)
      },
      // 타이포그래피: 자간 (Letter Spacing)
      letterSpacing: {
        'tighter': '-0.02em',
        'tight': '-0.01em',
        'normal': '0',
        'wide': '0.01em',
        'wider': '0.02em',
        'widest': '0.05em', // 대문자용
      },
      animation: {
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
        "spin-slow": "spin 8s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
    fontFamily: {
      sans: ["var(--font-inter)", "sans-serif"],
      serif: ["var(--font-noto-serif-kr)", "serif"],
    },
  },
  plugins: [],
};

export default config;
