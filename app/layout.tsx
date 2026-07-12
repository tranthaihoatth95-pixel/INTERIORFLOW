import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import './foldable.css';
import { PWARegister } from '@/components/PWARegister';
import { ResumeTracker } from '@/components/entry/ResumeTracker';

// Font hệ thống TTT Design System — Be Vietnam Pro (hỗ trợ dấu tiếng Việt đầy đủ).
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

// Giữ Geist làm fallback biến-trục (không đặt làm mặc định nữa).
const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

export const metadata: Metadata = {
  applicationName: 'InteriorFlow',
  title: 'InteriorFlow',
  description: 'Node-based AI workflow canvas cho studio thiết kế nội thất',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  // iOS: chạy full-screen như app native khi "Add to Home Screen"
  appleWebApp: {
    capable: true,
    title: 'InteriorFlow',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
};

// Next 14 App Router: viewport tách riêng khỏi metadata.
// viewport-fit=cover → tràn viền iPhone tai thỏ; khoá zoom cả trang (canvas tự pinch-zoom qua React Flow).
export const viewport: Viewport = {
  themeColor: '#0c0c0e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  // Android/foldable: keep layout resized above the on-screen keyboard.
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${beVietnamPro.variable} ${geistSans.variable} font-sans antialiased`}>
        {children}
        <PWARegister />
        {/* B-3: ghi route đang đứng theo user (resume đúng chỗ khi login lại) — render null */}
        <ResumeTracker />
      </body>
    </html>
  );
}
