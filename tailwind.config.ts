import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // accent tím quiet-luxury — trỏ về CSS var để đồng bộ sáng/tối
        accent: {
          DEFAULT: "var(--accent)",
          strong: "var(--accent-strong)",
        },
      },
      // Font hệ thống TTT — Be Vietnam Pro trước tiên, fallback hệ + Geist
      fontFamily: {
        sans: [
          "var(--font-sans)",
          '"Be Vietnam Pro"',
          "-apple-system",
          '"SF Pro Text"',
          "system-ui",
          "var(--font-geist-sans)",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      // Bo góc Apple (nhịp 10/14/20/28), map sang token
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-xl)",
      },
      // Easing Apple dùng chung cho transition tailwind
      transitionTimingFunction: {
        apple: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      transitionDuration: {
        250: "250ms",
      },
      // Materials + bóng đổ mềm
      backdropBlur: {
        xs: "8px",
      },
      boxShadow: {
        sheet: "var(--shadow-sheet)",
        pop: "var(--shadow-pop)",
        node: "var(--shadow-node)",
      },
      // Keyframes tinh tế (fade/scale) cho phần không dùng framer-motion
      keyframes: {
        "apple-in": {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "apple-rise": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "apple-in": "apple-in 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
        "apple-rise": "apple-rise 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
