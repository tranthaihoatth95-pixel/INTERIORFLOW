import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { PWARegister } from '@/components/PWARegister';

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
  themeColor: '#0d0d0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
