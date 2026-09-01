import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './foldable.css';
import { PWARegister } from '@/components/PWARegister';
import { ResumeTracker } from '@/components/entry/ResumeTracker';
import { StoreHydrator } from '@/components/entry/StoreHydrator';
import StageTransitionProvider from '@/components/studio/StageTransitionProvider';
import { CanvasWallpaper } from '@/app/settings/_components/CanvasWallpaper';
import { AccentHydrator } from '@/components/wallpaper/AccentHydrator';

/* 🔴 ĐỔI 23/08 — GEIST KHÔNG ĐÁNH VẦN ĐƯỢC TIẾNG VIỆT. Đây là lỗi nền, không phải chuyện gu.
   Hoà gửi ảnh màn thật: "Thiêt kê 2D" · "gân nhât" · "Quyêt định" — mất sạch dấu chồng.
   ĐO TẠI NGUỒN (fontTools, đọc cmap):
     · app/fonts/GeistVF.woff              thiếu 10/10  ế ề ấ ầ ộ ự ữ ạ ị
     · public/fonts/BeVietnamPro-Regular   đủ   10/10
   Chú thích cũ ngay chỗ này khai "Hệ điều hành tự fallback glyph tiếng Việt" — CÂU ĐÓ LÀ GỐC BỆNH.
   Fallback theo GLYPH có chạy, nhưng nó thay từng ký tự một bằng font mặc định của hệ (SERIF),
   nên một từ tiếng Việt bị vá bằng hai font: "Thi" Geist + "ế" Times. Kết quả là chữ vừa mất dấu
   vừa đọc ra serif — đúng hai thứ Hoà chê suốt hai tuần, và cả hai chỉ là MỘT nguyên nhân.
   ⚠️ Bài học: khai `fallback` không cứu được font THIẾU BẢNG MÃ. Fallback lo lúc font TẢI HỎNG;
   nó không lo được lúc font tải xong mà không có chữ. Hai lỗi khác nhau, một dòng comment gộp làm một.
   BeVietnamPro đã nằm trong repo từ 26/07, có OFL, chưa ai cắm. Nay cắm.
   🟡 Đây là VÁ ĐÚNG NGHĨA, không phải chọn typeface. Bộ chữ chính thức vẫn là quyền Claude Design —
   ràng buộc bắt buộc từ nay: PHẢI phủ đủ tiếng Việt, kiểm bằng `npm run soi:foundation`. */
const geistSans = localFont({
  src: [
    { path: '../public/fonts/BeVietnamPro-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/BeVietnamPro-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  /* Fallback vẫn giữ, nhưng nay chỉ còn đúng vai của nó: đỡ lúc TẢI HỎNG.
     Đặt sans hệ thống lên đầu để kể cả lúc đó cũng không rơi về serif. */
  fallback: ['-apple-system', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  applicationName: 'InteriorFlow',
  title: 'InteriorFlow',
  description: 'Integrated workspace for interior design delivery.',
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
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {/* Migration 21/07: đổi tên `Vitas` → `Vitals`. Đọc mọi key `interiorflow.vitas.*` cũ
            trong localStorage, ghi sang `interiorflow.vitals.*` mới rồi xoá cũ. Chạy 1 lần đầu
            phiên; guard bằng key sentinel để tránh chạy lại nhiều lần. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(!localStorage.getItem('interiorflow.vitals.migrated_from_vitas')){var moved=0;for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(k&&k.indexOf('interiorflow.vitas.')===0){var v=localStorage.getItem(k);var nk='interiorflow.vitals.'+k.slice('interiorflow.vitas.'.length);if(v!==null&&localStorage.getItem(nk)===null){localStorage.setItem(nk,v);moved++;}localStorage.removeItem(k);}}localStorage.setItem('interiorflow.vitals.migrated_from_vitas','1');}}catch(e){/* localStorage bị chặn — migration một-lần bỏ qua, không chặn app */}
try{if(!localStorage.getItem('interiorflow.vitals.stage_drop_cleaned_v1')){localStorage.removeItem('interiorflow.vitals.hint_seen_v2');localStorage.removeItem('interiorflow.vitals.first_drag_done');localStorage.removeItem('interiorflow.vitals.hint_seen');localStorage.setItem('interiorflow.vitals.stage_drop_cleaned_v1','1');}}catch(e){/* localStorage bị chặn — migration một-lần bỏ qua, không chặn app */}`,
          }}
        />
        {/* Màn che chuyển chặng + MotionConfig reducedMotion="user" đặt TRÊN route: veil phải
            sống xuyên qua `router.push`, nếu nằm trong route thì bị unmount giữa chừng và sinh
            ra cú "chớp" nền phẳng. Xem StageTransitionProvider. */}
        {/* C7 (02/08): nạp aiTier/credits/theme/lang từ localStorage NGAY khi app mở, mọi route
            (kể cả deep-link) — phải đứng TRƯỚC children để store có giá trị đúng khi trang con
            đọc ngay lúc mount. Render null. */}
        <StoreHydrator />
        {/* G4 (03/08): áp lại hình nền canvas đã lưu ngay khi app mở, kể cả tải lại cứng thẳng
            vào trang canvas — xem app/settings/_components/CanvasWallpaper.tsx. Render null. */}
        <CanvasWallpaper />
        {/* NỐI DÂY 01/09 (chỉ đạo Hoà 11:20) — áp bốn token --accent* theo BỘ HÌNH NỀN đang
            chọn, ngay khi app mở, mọi route kể cả deep-link — cùng khuôn StoreHydrator ở trên.
            Xem components/wallpaper/AccentHydrator.tsx. Render null. */}
        <AccentHydrator />
        <StageTransitionProvider>{children}</StageTransitionProvider>
        <PWARegister />
        {/* B-3: ghi route đang đứng theo user (resume đúng chỗ khi login lại) — render null */}
        <ResumeTracker />
      </body>
    </html>
  );
}
