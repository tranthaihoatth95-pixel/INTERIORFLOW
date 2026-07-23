# NGHIÊN CỨU — Kế hoạch triển khai 4 bộ cài InteriorFlow (Windows · Mac · Android · iOS/iPadOS)

> Ngày lập: **2026-07-23** · Người lập: Agent nghiên cứu · Trạng thái: **CHỜ USER DUYỆT trước khi phóng Sprint build**.
> Cập nhật báo cáo trước: [docs/RESEARCH-MOBILE-DISTRIBUTION.md](RESEARCH-MOBILE-DISTRIBUTION.md) (2026-07-20 — vẫn còn hiệu lực cho phần chính sách store).
> Nhiệm vụ này CHỈ nghiên cứu + scaffold checklist. **Không cài dep mới, không sửa app code.**

## Mục lục
1. [Tóm tắt 1 phút](#tóm-tắt-1-phút)
2. [Hiện trạng scaffold 4 platform (verify trong code)](#1-hiện-trạng-scaffold-4-platform)
3. [Ma trận chi phí + tài khoản cần cấp](#2-ma-trận-chi-phí--tài-khoản-cần-cấp)
4. [Việc BẠN làm × Việc agent làm × Việc agent làm NGAY](#3-phân-vai-user--agent)
5. [Thứ tự triển khai đề xuất (Sprint 1/2/3)](#4-thứ-tự-triển-khai-đề-xuất)
6. [Rủi ro & giới hạn từng platform](#5-rủi-ro--giới-hạn)
7. [Câu hỏi cần user quyết trước Sprint 2](#6-câu-hỏi-cần-user-quyết-trước-sprint-2)
8. [Scaffold checklist tạo cùng báo cáo này](#7-scaffold-checklist-đã-tạo)

---

## Tóm tắt 1 phút

User chốt 23/07: **làm cả 4 bộ cài** — Windows · Mac · Android · iOS/iPadOS. Verify code hiện trạng:

- **Mac Electron**: `electron/main.js` (359 dòng, spawn `next start` bind `0.0.0.0`, single-instance lock, OTA electron-updater), `package.json` có `electron:build:mac` (target `dmg` arm64, `identity: null` → chưa notarize). ✅ scaffold từ 04/07 vẫn dùng được, thiếu Developer ID + notarize hook.
- **Windows**: `INSTALL-windows-native.md` + `build-windows-native.bat` (build .exe qua electron-builder NSIS x64) + `setup-windows.bat` (chạy nhanh mode `npm run dev` cho ai không muốn build). Config `build.win` đã sẵn trong `package.json`. ✅ có thể build unsigned .exe NGAY, không blocker.
- **Android**: `public/manifest.webmanifest` đầy đủ (icons 192/512/maskable, `display: standalone`, `orientation: any`), `public/sw.js` có, `INSTALL-android.md` mô tả 2 cách (PWA "Add to Home Screen" LAN + TWA Bubblewrap). ❌ **CHƯA có** thư mục `.bubblewrap/`, chưa có APK sinh, chưa có `assetlinks.json` host thật.
- **iOS/iPadOS**: **MỚI HOÀN TOÀN** — chưa có scaffold nào. PWA "Add to Home Screen" hoạt động qua Safari nhờ manifest + `appleWebApp` meta đã có trong `app/layout.tsx`, nhưng CHƯA có: viewport tối ưu iOS, splash screen full-res per-device, `apple-touch-icon` đa kích thước, notch handling. Native wrap (Capacitor) chưa có.

**Chặn cứng chung** (đã nêu ở báo cáo 20/07 mục 1): TWA + iOS wrapper bắt buộc **HTTPS domain ổn định** — hiện chưa deploy Vercel/Supabase. **Nhưng Windows .exe unsigned + PWA "Add to Home Screen" trên LAN đã dùng được HÔM NAY, không cần deploy cloud.**

**Đề xuất chốt**: **Sprint 1 (agent làm ngay, 2-3 ngày, không cần credential)** = Windows .exe unsigned + PWA iOS/Android tối ưu (viewport, splash, touch-icon). **Sprint 2 (chờ user cấp Apple Developer + Google Play Console + Vercel deploy, ~1 tuần)** = Mac .dmg notarize + Android TWA + iOS PWA/Custom App qua Vercel URL. **Sprint 3 (chỉ nếu cần)** = iOS Capacitor wrap thành .ipa native.

---

## 1. Hiện trạng scaffold 4 platform

### 1.1 Mac (Electron .dmg)

**Files verify:**
- `electron/main.js` (359 dòng): spawn `next start` port dò trống từ 3777, cwd = userData (writable), DB path tuyệt đối `<userData>/dev.db`, single-instance lock, tự tạo thư mục `uploads/`, load `autoUpdater` electron-updater phòng thủ (try/catch để dev Mac không crash khi chưa cài).
- `electron/preload.js` (22 dòng — ngắn, chỉ contextBridge).
- `package.json` scripts: `electron:build:mac` = `next build && electron-builder --mac`; `electron:build` (win); `electron:publish` (win, auto-push GitHub Release cho OTA).
- `package.json` `build.mac`: target `dmg` arch `arm64`, category `graphics-design`, `identity: null` (electron-builder skip ký khi null → build ra .dmg unsigned).

**Còn thiếu để phát hành .dmg notarize:**
1. Apple Developer ID Application certificate (cần Apple Developer Program $99/năm + D-U-N-S).
2. `mac.hardenedRuntime: true` + `mac.gatekeeperAssess: false` + entitlements file (electron-builder default OK nhưng cần bật hardenedRuntime).
3. `afterSign` hook chạy `@electron/notarize` (npm package, cần add sau khi có Apple ID).
4. Env vars `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` cho notarytool.
5. Script `electron:build:mac:notarize` mới trong `package.json`.

**Ước lượng agent build sau khi có credential**: nửa ngày (cài `@electron/notarize`, viết `scripts/notarize.js`, chỉnh `package.json` build config, chạy build test → verify `spctl -a -v` PASS + `stapler validate` PASS).

### 1.2 Windows (Electron .exe NSIS)

**Files verify:**
- `build-windows-native.bat` (45 dòng): kiểm Node, `npm install`, `npm run build`, `npx electron-builder --win`, in path `dist\InteriorFlow Setup 1.0.0.exe`.
- `setup-windows.bat` (52 dòng): mode chạy nhanh — `npm install` + `npx prisma db push` + `npm run dev`, mở `localhost:3000`.
- `package.json` `build.win`: target `nsis` x64, icon `electron/icons/icon.png`.
- `package.json` `build.nsis`: `oneClick: false` (user chọn thư mục), `perMachine: false` (user-level, không cần admin), `createDesktopShortcut: true`, `createStartMenuShortcut: true`.
- `README-electron.md` (144 dòng): docs kiến trúc Electron + luồng cài.

**Còn thiếu để .exe SIGNED:**
1. Code-signing certificate Windows (Sectigo/DigiCert EV cert ~$400-500/năm hoặc OV cert ~$150-250/năm; DigiCert KeyLocker cloud cert ~$580/năm không cần USB token). EV cert bỏ qua SmartScreen ngay, OV cần "build reputation" vài tuần.
2. `build.win.signAndEditExecutable: true`, `build.win.certificateFile` + `certificatePassword` env vars.

**Unsigned build**: **làm được NGAY hôm nay**, agent chỉ cần chạy `build-windows-native.bat` trên máy Windows (phải máy Windows thật, không cross-build từ Mac). SmartScreen sẽ warn "Publisher unknown" — user bấm "More info → Run anyway".

**Ước lượng agent build unsigned**: 1 giờ trên máy Windows (kiểm build success + test cài trên máy Windows sạch).

### 1.3 Android (PWA + TWA)

**Files verify:**
- `public/manifest.webmanifest`: `name`, `short_name`, `id: /`, `start_url: /`, `scope: /`, `display: standalone`, `display_override: [window-controls-overlay, standalone, fullscreen]`, `orientation: any`, `background_color: #0c0c0e`, `theme_color: #0c0c0e`, 5 icons (192/512/maskable-512).
- `public/sw.js` (108 dòng): service worker network-first API/HTML, cache-first static.
- `public/icons/`: có `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`.
- `components/PWARegister.tsx`: đăng ký SW (production-only).
- `INSTALL-android.md` (89 dòng): 2 cách — LAN + Bubblewrap.

**Chưa có:**
1. Thư mục `.bubblewrap/` (chưa init lần nào).
2. `public/.well-known/assetlinks.json` host thật (cần HTTPS domain + SHA-256 keystore fingerprint).
3. APK sinh nào.
4. Managed Google Play private app config.

**Managed Google Play Private App vs Internal Testing** (khác biệt quan trọng):
- **Internal Testing**: trần 100 tester (email list), $25 one-time, không cần Data safety form, không cần privacy policy, gần như không review. Phù hợp giai đoạn thử nghiệm nhưng SẼ CHẶN nếu TTT có >100 nhân viên tương lai.
- **Managed Google Play — Private App**: **không giới hạn user trong tổ chức**, cần EMM/MDM (VD Google Workspace + Android Enterprise). Nếu TTT chưa có Workspace, phải mua Workspace Business Starter $7/user/tháng — có thể là blocker.
- **Managed Google Play → Publish as Private without EMM**: cách trung gian — publish private app không cần EMM đầy đủ nhưng cần Managed Google Play Accounts, org whitelist tối đa 1000 tổ chức. Xem [Distribute private apps](https://support.google.com/googleplay/work/answer/9495634).

**Ước lượng agent build sau khi có Google Play Console + Vercel URL**: 1 ngày (Bubblewrap init, sinh keystore, host `assetlinks.json` qua Vercel, build APK+AAB, upload Play Console, config Internal Testing track).

### 1.4 iOS/iPadOS (mới hoàn toàn)

**Đã có:**
- `public/apple-touch-icon.png` (1 file, size không rõ — cần verify 180×180).
- `app/layout.tsx`: có `appleWebApp` meta (theo báo cáo 20/07 mục 1).

**Chưa có:**
1. Multiple `apple-touch-icon` sizes (57, 60, 72, 76, 114, 120, 144, 152, 167, 180).
2. Splash screen images per-device (iPhone SE, 8, X, 11, 12, 13, 14, 15, 16, iPad mini, iPad, iPad Pro 11", iPad Pro 12.9" — mỗi cái 2 orientation).
3. Viewport `viewport-fit=cover` + safe-area-inset CSS cho notch.
4. Capacitor scaffold (nếu chọn wrap native).

**3 đường iOS có thể chọn:**

| Đường | Ưu | Nhược | Chi phí | Thời gian |
|---|---|---|---|---|
| **A. PWA "Add to Home Screen" thuần** | 0đ · không cần Apple Dev · deploy Vercel là xong | Không có mặt App Store · user tự "Add to Home Screen" · không push notification native (<iOS 16.4) · không file picker native đầy đủ · Safari giới hạn IndexedDB 50MB (có thể vấn đề nếu cache PDF lớn) | $0 | 1 ngày (optimize meta + splash) |
| **B. Capacitor wrap PWA thành .ipa** | Có mặt App Store/TestFlight/Custom App · truy cập native API (camera, biometric, file, push) · cùng codebase web | Cần Apple Developer $99/năm · cần Xcode trên Mac · phải qua App Review 4.2 (nếu App Store công khai) hoặc Custom App qua ABM · rủi ro webview-wrapper reject nếu chỉ bọc web thuần | $99/năm | 1 tuần (setup Capacitor + Xcode build + submit Custom App) |
| **C. React Native rebuild** | Native performance thật · UX iOS chuẩn | Viết lại toàn bộ frontend · không share codebase web | $99/năm + rebuild cost | 3-6 tháng |

**Khuyến nghị**: **Sprint 1 làm đường A** (PWA optimize) — dùng được ngay khi Vercel deploy. **Sprint 3 đường B** (Capacitor) chỉ khi user CHẮC CHẮN cần app trên App Store/Custom App qua ABM. Đường C loại bỏ.

---

## 2. Ma trận chi phí + tài khoản cần cấp

| Platform | Tài khoản/cert | Chi phí | Thời gian setup | Ai làm được | Blocker |
|---|---|---|---|---|---|
| **Windows .exe UNSIGNED** | Không cần | $0 | Ngay | Agent (trên máy Windows) | Cần máy Windows thật |
| **Windows .exe OV code-sign** | Sectigo/DigiCert OV | ~$150-250/năm | 1-3 ngày duyệt | User mua cert, agent tích hợp | Cần USB token hoặc HSM cloud |
| **Windows .exe EV code-sign** (SmartScreen instant OK) | Sectigo/DigiCert EV | ~$300-500/năm | 5-10 ngày duyệt + KYC | User | HSM/USB token bắt buộc |
| **Mac .dmg UNSIGNED** | Không cần | $0 | Ngay | Agent (trên máy Mac) | User phải "Open Anyway" trong Privacy & Security (macOS Sequoia đã bỏ Control+Click bypass) |
| **Mac .dmg Developer ID + Notarize** | Apple Developer Program (cá nhân/tổ chức) | $99/năm | 1-2 ngày duyệt (cá nhân) · vài tuần (tổ chức, cần D-U-N-S) | User đăng ký, agent tích hợp | Cần Mac để ký + notarize |
| **iOS/iPadOS PWA "Add to Home Screen"** | Không cần | $0 | Ngay (sau khi Vercel deploy) | Agent | HTTPS domain ổn định (Vercel free đủ) |
| **iOS/iPadOS Capacitor .ipa (Custom App qua ABM)** | Apple Developer + Apple Business Manager | $99/năm (dùng chung với Mac) | Apple Dev vài ngày · ABM ~1 tuần · App Review Custom App 24-48h (không SLA chính thức) | User đăng ký, agent build | Cần Mac với Xcode + iOS Simulator + iPhone thật để test |
| **Android APK UNSIGNED cài trực tiếp** | Không cần (nhưng user phải bật "Cài từ nguồn không xác định") | $0 | Ngay (sau khi có HTTPS URL) | Agent | Không lên Play, phát APK qua email/link |
| **Android TWA Google Play Internal Testing** | Google Play Console cá nhân | $25 one-time | Vài giờ đến 1 ngày (verify identity) | User đăng ký, agent build | Trần 100 tester |
| **Android Managed Google Play Private App** | Play Console + Managed Google Play + (optional) Workspace | $25 one-time (Play) + $7/user/tháng (Workspace nếu chưa có) | 1-2 tuần setup MDM/Enterprise | User đăng ký, agent build | Cần EMM hoặc Managed Google Accounts |

**Tổng năm 1 tối thiểu (khuyến nghị)**: **$124** = $99 (Apple Dev cá nhân) + $25 (Google Play cá nhân). **Không** cần Windows code-sign năm 1 (SmartScreen warn chấp nhận được nội bộ), **không** cần Workspace (dùng Internal Testing 100 slot).

**Tổng năm 1 nếu muốn full production**: **$324-$524** = $124 (trên) + $200-400 (Windows OV/EV cert) + $84 (Workspace 1 user để có Managed Google Play).

---

## 3. Phân vai user × agent

### A. Việc BẠN (user) phải làm — KHÔNG delegate được

1. **Apple Developer Program đăng ký** ($99/năm) — quyết cá nhân hay tổ chức (tổ chức cần D-U-N-S ~vài tuần chờ).
2. **Google Play Console đăng ký** ($25 one-time) — cá nhân đủ để né D-U-N-S.
3. **Apple Business Manager setup** (nếu chọn Custom App iOS) — miễn phí nhưng cần D-U-N-S.
4. **Export Apple credentials cho agent**:
   - `APPLE_ID` (email Apple Developer account).
   - `APPLE_APP_SPECIFIC_PASSWORD` (tạo tại appleid.apple.com → Sign-In and Security → App-Specific Passwords).
   - `APPLE_TEAM_ID` (10-char, xem tại developer.apple.com → Membership).
   - Developer ID Application certificate (.p12 export từ Keychain hoặc Xcode).
5. **Export Google Play credentials**:
   - Service Account JSON (Play Console → API access → link Google Cloud Project → tạo service account role "Release manager").
   - Upload key `.jks` keystore (tạo lần đầu, giữ AN TOÀN — mất là mất khả năng update app).
6. **Mua Windows code-sign cert** (nếu quyết ký) — tự KYC, tự cắm USB token nếu OV, hoặc setup DigiCert KeyLocker cloud nếu HSM cloud.
7. **Chấp nhận review Apple** (Custom App qua App Review, 24-48h).
8. **Chuẩn bị Privacy Policy URL công khai** (bắt buộc Play Store closed/production, khuyến nghị cho Apple Custom App).
9. **Quyết Bundle ID** cho iOS/Android (khuyến nghị `com.tttarchitects.interiorflow` — reverse domain).

### B. Việc AGENT làm sau khi có credential

1. Cài `@electron/notarize` npm package + viết `scripts/notarize.js` hook `afterSign`.
2. Thêm `mac.hardenedRuntime: true` + entitlements file `electron/entitlements.mac.plist`.
3. Thêm script `electron:build:mac:notarize` = `APPLE_ID=... APPLE_APP_SPECIFIC_PASSWORD=... next build && electron-builder --mac`.
4. Chạy build → verify `codesign --verify --deep --strict` PASS + `xcrun stapler validate` PASS + `spctl -a -v` PASS.
5. Cài `@bubblewrap/cli` global → `bubblewrap init --manifest https://<vercel-url>/manifest.webmanifest` → sinh keystore → build APK+AAB.
6. Deploy `public/.well-known/assetlinks.json` với SHA-256 fingerprint keystore.
7. Upload AAB lên Google Play Console via API (Fastlane hoặc gradle-play-publisher).
8. PWA iOS optimize: thêm meta tags viewport/apple-web-app trong `app/layout.tsx`, sinh 10 kích thước `apple-touch-icon`, sinh 14+ splash screen bằng script (VD `pwa-asset-generator`), thêm `viewport-fit=cover` + safe-area-inset CSS.
9. (Optional Sprint 3) Cài Capacitor → `npx cap init` → `npx cap add ios` → mở Xcode → archive → upload App Store Connect → submit Custom App.
10. Windows .exe UNSIGNED build (không cần credential): chạy `build-windows-native.bat` trên máy Windows, test cài trên máy Windows sạch.

### C. Việc agent làm được NGAY (không cần credential mới, KHÔNG blocker)

1. **Windows .exe UNSIGNED**: build ngay trên máy Windows công ty RTX. User cài thử. Chỉ vướng SmartScreen warn.
2. **PWA "Add to Home Screen" iOS/Android** qua LAN: user quét QR ngay tại studio, cài lên máy trong 30 giây (như `INSTALL-android.md` cách A). Không cần deploy cloud.
3. **PWA iOS meta optimize**: thêm splash + touch-icon + safe-area vào `app/layout.tsx` — không phá gì, dùng ngay khi có Vercel URL sau này.
4. **Nghiên cứu Vercel deploy** (không cần thực thi): xem `docs/DEPLOY-VERCEL.md` đã có sẵn, chuẩn bị migration Prisma SQLite → Postgres. Đây là **blocker chung** cho Sprint 2 (TWA + iOS Custom App đều cần HTTPS domain).

---

## 4. Thứ tự triển khai đề xuất

### Sprint 1 — làm NGAY, không chờ credential (2-3 ngày agent-time)

**Deliverables:**
- ✅ Windows .exe UNSIGNED (build trên máy Windows RTX, test cài 2-3 máy TTT).
- ✅ PWA iOS/Android meta optimize (10 touch-icons + 14 splash screens + viewport-fit=cover + safe-area CSS).
- ✅ QR code + hướng dẫn "Add to Home Screen" cho user thử trên iPhone/iPad/Oppo qua LAN.
- ✅ Tài liệu `installers/README.md` (index) + 4 checklist markdown chi tiết cho Sprint 2.

**Không phụ thuộc**: credential nào.

**Sau Sprint 1**: user có thể **cài thử trên tất cả 4 platform** ở dạng "nội bộ tạm thời" (Windows unsigned, Mac unsigned, PWA LAN iOS/Android).

### Sprint 2 — sau khi user cấp credential + Vercel deploy (~1 tuần agent-time)

**Blocker phải xong TRƯỚC:**
1. Vercel deploy (Prisma SQLite → Postgres migration + env vars) — đã có `docs/DEPLOY-VERCEL.md` sẵn hướng dẫn.
2. Apple Developer Program active + Developer ID cert export.
3. Google Play Console active + service account JSON + upload keystore.

**Deliverables:**
- ✅ Mac .dmg Developer ID + Notarize (afterSign hook automation).
- ✅ Android TWA APK+AAB upload Google Play Internal Testing track.
- ✅ Android `assetlinks.json` deploy qua Vercel `public/.well-known/`.
- ✅ PWA iOS mode "Add to Home Screen" qua Vercel URL (không native, không Capacitor).
- ✅ OTA update Mac (electron-updater qua GitHub Releases — đã có sẵn cho Windows từ 05/07).

### Sprint 3 — chỉ nếu Sprint 2 chưa đủ (~1-2 tuần agent-time)

**Trigger**: user thấy PWA iOS thiếu tính năng thiết yếu (push notification native, camera access sâu, thanh trạng thái chuẩn app native).

**Deliverables:**
- ✅ Capacitor wrap iOS → .ipa signed.
- ✅ Apple Business Manager Custom App submission.
- ✅ Windows code-sign (nếu user mua cert).

---

## 5. Rủi ro & giới hạn

| Platform | Rủi ro | Mitigation |
|---|---|---|
| **PWA iOS** | Push notification chỉ iOS ≥16.4 · IndexedDB giới hạn 50MB · Safari đá cache "unused" sau vài tuần không mở · không camera access sâu | Không dùng cho tính năng đòi push · limit cache · docs hướng dẫn user mở app định kỳ |
| **PWA Android** | Cần HTTPS ổn định · một số OEM (Xiaomi, OPPO) kill service worker aggressively | Vercel free tier đủ HTTPS · TWA giải quyết background nếu cần |
| **Windows .exe UNSIGNED** | SmartScreen "Publisher unknown" · một số AV (Bitdefender/Kaspersky) block auto-run | User quen bấm "Run anyway" · docs hướng dẫn tắt AV cho .exe · nâng cấp OV cert sau vài tháng |
| **Mac .dmg UNSIGNED** | macOS Sequoia bỏ Control+Click bypass · user phải vào Privacy & Security bấm "Open Anyway" | Notarize sớm (Sprint 2) — chỉ $99/năm |
| **Apple review** | Custom App có thể yêu cầu privacy policy URL, guideline compliance, screenshot đúng chuẩn · reject 4.2 nếu wrap "chỉ web" | Chuẩn bị privacy policy URL trước · thêm ≥3 native features nếu Capacitor (push, camera, biometric) |
| **Auto-update** | Electron OTA cần server host update file (dùng GitHub Releases free) · TWA/APK auto-update qua Play · iOS PWA update qua service worker (cache-first có thể stale) | GitHub Releases đủ · SW đã dùng network-first API/HTML — update tức thì OK |
| **Managed Google Play** | Cần Workspace + Android Enterprise nếu muốn "no trần user" · setup EMM là rào cản mới | Sprint 2 dùng Internal Testing (100 slot đủ 6-12 tháng) · Sprint 3 nếu >100 user thì mới cân nhắc Managed |
| **D-U-N-S Number tổ chức** | Google org account + Apple org enrollment cần D-U-N-S, có thể mất ~30 ngày | Đăng ký cá nhân trước cho Sprint 2 (Apple + Google đều cho phép cá nhân); D-U-N-S song song để sau chuyển đổi |
| **Bubblewrap keystore** | Mất `.jks` upload key = mất khả năng update app trên Play Store vĩnh viễn | Backup keystore vào 3 nơi (1Password + USB + Google Drive encrypted) · dùng Play App Signing (Google giữ key, upload key riêng để rotate) |

---

## 6. Câu hỏi cần user quyết trước Sprint 2

1. **Apple Developer Account** — cá nhân (nhanh, không cần D-U-N-S, in-app appears as "Individual Name") hay tổ chức (cần D-U-N-S ~30 ngày, hiện appears as "TTT Architects")?
2. **Google Play publish** — Private (chỉ team TTT, cần Managed Google Play + tối đa 1000 tổ chức) hay Unlisted (chia sẻ link, không search được, dùng Internal Testing 100 slot)? Hay chấp nhận Public listed (ai search cũng thấy)?
3. **Windows code-sign** — mua NGAY (~$200/năm) để bỏ SmartScreen warn, hay để sau vài tháng khi có nhiều user hơn?
4. **Bundle ID iOS/Android** — đặt gì? Đề xuất `com.tttarchitects.interiorflow` (reverse domain). Đổi sau = phải submit app mới, không rollback được.
5. **Auto-update** — tự host GitHub Releases (đã có, free) hay setup Vercel/S3 riêng?
6. **Crash reporting** — có cài Sentry (free 5k events/tháng) đóng vào installer không? Ảnh hưởng size + privacy.
7. **Privacy Policy URL** — TTT Architects đã có website + privacy policy công khai chưa? Nếu chưa, cần dựng 1 trang tĩnh trên Vercel trước Sprint 2.
8. **Vercel + Supabase deploy** — chốt làm SPRINT ĐẦU (blocker cho Sprint 2 mobile) hay đợi thêm nghiên cứu về chi phí gói trả phí cho >30 user?
9. **iOS Sprint 3 có làm không?** — nếu PWA iOS đủ dùng (Sprint 1+2), skip Capacitor. Nếu bắt buộc có mặt App Store hoặc cần push notification native, phải làm.
10. **Ai giữ Account Holder** — App Store Connect + Play Console đều chỉ có 1 Account Holder (không transfer nhanh được). Đề xuất user chính (chủ dự án) giữ, agent chỉ dùng service account.

---

## 7. Scaffold checklist đã tạo

Thư mục MỚI `installers/` (không breaking, không đụng code app):

| File | Mục đích |
|---|---|
| `installers/README.md` | Index quy trình build 4 platform + link tài liệu con |
| `installers/mac-notarize.md` | Checklist chi tiết notarize .dmg (cần khi có Apple Dev credential) |
| `installers/windows-electron-builder.json` | Template config electron-builder Windows (unsigned + signed variants) |
| `installers/android-bubblewrap.md` | Checklist Bubblewrap TWA + assetlinks.json + Google Play upload |
| `installers/ios-pwa-vs-capacitor.md` | So sánh chi tiết PWA vs Capacitor cho iOS + gợi ý chọn |

**Không cài package nào**, **không sửa `package.json`**, **không đụng `electron/main.js`**, **không tạo file trong `components/`, `lib/`, `app/`**. Chờ user OK Sprint 2 mới thực thi.

---

## Ghi chú kết thúc

- Báo cáo này KHÔNG thay thế báo cáo 20/07 (`RESEARCH-MOBILE-DISTRIBUTION.md`) mà **bổ sung** — báo cáo cũ tập trung chính sách store (TestFlight vs Custom App vs Enterprise, Managed Google Play vs Internal Testing, sandbox macOS), báo cáo này tập trung **plan hành động cụ thể**: agent làm gì, user cấp gì, khi nào bắt đầu.
- Chưa xác minh: chi phí exact Windows code-sign cert (thay đổi theo CA và promotion), thời gian D-U-N-S 2026 (nguồn Google ghi ~30 ngày nhưng thực tế biến thiên).
- Không sửa STATUS.md — chờ user duyệt báo cáo này rồi mới cập nhật status "Sprint 1 installer khởi động".
