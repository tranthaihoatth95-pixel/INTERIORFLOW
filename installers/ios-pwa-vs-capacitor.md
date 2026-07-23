# iOS/iPadOS — PWA vs Capacitor: So sánh + Gợi ý chọn

> Sprint 1 khuyến nghị **PWA optimize** (không cần credential). Sprint 3 quyết Capacitor.

## 3 đường iOS khả dĩ

### A. PWA "Add to Home Screen" (Sprint 1) — KHUYẾN NGHỊ ĐẦU TIÊN

**Cách hoạt động**: user mở Safari → vào `https://<vercel-url>` → tap Share → "Add to Home Screen" → app xuất hiện trên home screen, mở full-screen như native.

**Cần agent làm** (không cần Apple Dev):

1. Thêm meta tags vào `app/layout.tsx`:
   ```tsx
   <meta name="apple-mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
   <meta name="apple-mobile-web-app-title" content="InteriorFlow" />
   <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
   ```

2. Sinh 10 `apple-touch-icon` sizes (57, 60, 72, 76, 114, 120, 144, 152, 167, 180) trong `public/icons/apple/`:
   ```bash
   npx pwa-asset-generator public/icon-512.png public/icons/apple \
     --icon-only --favicon --type png
   ```

3. Sinh 14+ splash screens per-device (iPhone SE/8/X/11/12/13/14/15/16 + iPad mini/Air/Pro 11"/Pro 12.9" × portrait/landscape):
   ```bash
   npx pwa-asset-generator public/icon-512.png public/icons/apple \
     --splash-only --portrait-only --background "#0c0c0e"
   # Chạy lại với --landscape-only
   ```

4. Thêm CSS `safe-area-inset` cho notch handling:
   ```css
   body {
     padding-top: env(safe-area-inset-top);
     padding-bottom: env(safe-area-inset-bottom);
   }
   ```

**Ưu**:
- $0 chi phí, không cần Apple Developer.
- Deploy tức thì mỗi lần push code (không qua App Review).
- Cùng codebase với web + Android PWA.

**Nhược iOS-specific**:
- Không có mặt App Store → user phải biết URL + tự "Add to Home Screen".
- Push notification chỉ iOS ≥16.4 (Safari cần user cho phép qua PWA — không thân thiện).
- IndexedDB giới hạn ~50MB (Safari policy) — có thể vấn đề nếu cache PDF/PPTX lớn.
- Safari đá cache "unused" sau vài tuần không mở → user phải cài lại (rare nhưng có).
- Không camera access sâu (chỉ file picker cơ bản).
- Không background sync/fetch (Safari giới hạn service worker).

### B. Capacitor wrap .ipa (Sprint 3) — KHUYẾN NGHỊ NẾU CẦN APP STORE

**Cách hoạt động**: Capacitor bọc PWA thành native iOS app (WKWebView bên trong), build ra `.ipa` phát hành qua TestFlight/App Store/Custom App qua ABM.

**Cần agent làm** (SAU KHI có Apple Developer):

1. `npm i -D @capacitor/core @capacitor/cli @capacitor/ios`.
2. `npx cap init "InteriorFlow" "com.tttarchitects.interiorflow" --web-dir=public`.
3. Chỉnh `capacitor.config.ts` trỏ `server.url` sang Vercel URL (giữ codebase web, chỉ wrap).
4. `npx cap add ios` → sinh thư mục `ios/App/` với Xcode project.
5. Mở Xcode → chọn team + bundle ID → archive → upload App Store Connect.
6. Submit Custom App qua Apple Business Manager (không public trên App Store).

**Ưu**:
- Có mặt App Store / TestFlight / Custom App (qua ABM cho phân phối nội bộ).
- Truy cập native API (camera, biometric, file, push notification native, thanh trạng thái đẹp).
- Vẫn cùng codebase web (không viết lại).

**Nhược**:
- Cần Apple Developer $99/năm.
- Cần Mac với Xcode để build (không cross-build từ Windows/Linux).
- Rủi ro reject Guideline 4.2 "Minimum Functionality" — App Review có thể coi "chỉ là webview wrapper" và reject. Mitigation: thêm ≥3 native features (VD Capacitor Camera, Biometric, LocalNotifications) + splash native + UI navigation cảm giác app.
- Update: mỗi lần đổi native (không phải web content) phải submit App Review lại (24-48h Custom App, 1-7 ngày App Store công khai).
- Không auto-update từ server như Electron — bắt buộc qua Play Store / App Store update flow.

### C. React Native rebuild — LOẠI BỎ

Viết lại toàn bộ frontend, không share codebase web. 3-6 tháng effort. Không phù hợp scope IF hiện tại.

## Ma trận quyết định

| Tình huống | Chọn |
|---|---|
| Cần TEST NGAY trên iPhone/iPad công ty, không mua gì | **A. PWA LAN** (Sprint 1) |
| Cần phân phối cho ~10-30 nhân viên qua HTTPS domain | **A. PWA Vercel** (Sprint 1+2) |
| BẮT BUỘC có mặt App Store (VD BGĐ yêu cầu) | **B. Capacitor Custom App qua ABM** (Sprint 3) |
| Cần push notification native reliable | **B. Capacitor** (Sprint 3) |
| Cần offline hoàn toàn (Safari SW không đủ) | **B. Capacitor** (Sprint 3) — nhưng vẫn cần server cho DB |
| Team đông (>100 user) | **B. Capacitor + Apple Business Manager Custom App** |

## Đề xuất concrete

**Sprint 1** (không chờ user): **A. PWA optimize** — agent thêm meta + sinh icons/splash → deploy Vercel → user thử "Add to Home Screen" trên iPhone/iPad → verify UX đủ dùng.

**Đánh giá sau Sprint 1**: nếu user nói "PWA iOS đủ dùng cho nhu cầu hiện tại" → **DỪNG**, không cần Sprint 3. Nếu user nói "cần có mặt App Store" hoặc "push notification thiếu" → **Sprint 3 làm Capacitor**.

## Chi phí ước lượng

| Item | Sprint 1 (PWA) | Sprint 3 (Capacitor) |
|---|---|---|
| Apple Developer | $0 | $99/năm |
| Cert Developer ID | Không cần | Miễn phí (nằm trong Apple Dev) |
| Build machine | Bất kỳ (không build native) | Mac + Xcode (miễn phí) |
| Agent time | 1 ngày | 1-2 tuần (setup + App Review iteration) |

## Rủi ro chung iOS

- Apple review timing không SLA — có thể 24h hoặc 1 tuần.
- Guideline 4.2 mơ hồ — hai app tương tự có thể một pass một fail.
- Custom App qua ABM cần D-U-N-S tổ chức — cá nhân Apple Dev không mở được ABM.
