# Android TWA (Bubblewrap) — Checklist

> **CHỜ USER** cấp Google Play Console + Vercel HTTPS URL trước khi thực thi.

## Prerequisites

- [ ] Google Play Console account ($25 one-time) — user đăng ký tại https://play.google.com/console
- [ ] Vercel deploy đã xong (Prisma SQLite → Postgres) → có HTTPS domain ổn định (VD `interiorflow.vercel.app` hoặc `app.tttarchitects.vn`)
- [ ] JDK 17 installed (Bubblewrap dùng): `brew install openjdk@17` (Mac) hoặc từ https://adoptium.net
- [ ] Node 18+ (đã có nếu dev IF)
- [ ] Android SDK: Bubblewrap tự tải nếu thiếu, hoặc `brew install --cask android-commandlinetools`

## Bước agent thực hiện

### 1. Cài Bubblewrap CLI global
```bash
npm i -g @bubblewrap/cli
bubblewrap doctor  # Verify JDK + Android SDK OK
```

### 2. Init TWA từ manifest
```bash
cd /tmp/interiorflow-twa  # Thư mục riêng, KHÔNG trong repo IF
bubblewrap init --manifest https://<vercel-url>/manifest.webmanifest
```
Trả lời prompts:
- **Application ID**: `com.tttarchitects.interiorflow` (reverse domain, KHÔNG ĐỔI SAU KHI PUBLISH)
- **App name**: `InteriorFlow`
- **Launcher name**: `InteriorFlow`
- **Display mode**: `standalone` (từ manifest)
- **Orientation**: `any`
- **Status bar color**: `#0c0c0e` (từ theme_color)
- **Splash screen color**: `#0c0c0e`
- **Icon URL**: dùng `/icon-512.png`
- **Maskable icon URL**: `/icons/icon-maskable-512.png`
- **Include Play Billing**: No
- **Signing key path**: `./android.keystore` (Bubblewrap tự tạo lần đầu)
- **Signing key password**: [USER CUNG CẤP — LƯU AN TOÀN, mất là mất khả năng update app]
- **Signing key alias**: `android`
- **Alias password**: [same as above]

### 3. Backup keystore NGAY
```bash
# Backup 3 nơi:
cp android.keystore ~/backups/interiorflow-android-$(date +%Y%m%d).keystore
# Upload lên 1Password + Google Drive encrypted
```
**MẤT KEYSTORE = MẤT APP TRÊN PLAY STORE VĨNH VIỄN.** Không rollback được.

### 4. Build APK + AAB
```bash
bubblewrap build
# → app-release-signed.apk (test cài trực tiếp)
# → app-release-bundle.aab (upload Play Store)
```

### 5. Lấy SHA-256 fingerprint keystore
```bash
keytool -list -v -keystore android.keystore -alias android
# Copy dòng "SHA256:" (VD: 3E:C4:97:...:AB:CD)
```

### 6. Tạo `assetlinks.json` + deploy Vercel
Trong repo IF, tạo `public/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.tttarchitects.interiorflow",
    "sha256_cert_fingerprints": ["3E:C4:97:...:AB:CD"]
  }
}]
```
Deploy lại Vercel → verify `curl https://<vercel-url>/.well-known/assetlinks.json` trả JSON.

### 7. Test TWA local
```bash
adb install app-release-signed.apk
# Mở app trên máy Android → verify KHÔNG có thanh URL browser trên đỉnh
# Nếu có thanh URL → assetlinks không match → check SHA-256
```

### 8. Upload Google Play Console
1. Play Console → All apps → Create app → InteriorFlow → App/Game → Free.
2. **Release → Internal testing → Create new release**.
3. Upload `app-release-bundle.aab`.
4. Release notes: "Bản đầu InteriorFlow — canvas AI cho pipeline nội thất."
5. **Testers**: tạo email list nội bộ TTT (tối đa 100 email).
6. **Review release → Rollout**.
7. Sau ~vài phút → tester nhận email link opt-in → cài từ Play Store.

### 9. (Optional) Setup gradle-play-publisher hoặc Fastlane cho CI/CD auto-upload

## Rủi ro & lưu ý

- **Package name KHÔNG ĐỔI được** sau publish. Chọn `com.tttarchitects.interiorflow` NGAY từ đầu.
- **Play App Signing**: Play Console mặc định BẬT — Google giữ signing key, bạn giữ upload key. Nếu upload key mất, có thể request reset qua support (khoảng 1 tuần).
- **Data safety form**: Internal testing KHÔNG bắt buộc; closed/production BẮT BUỘC. Chuẩn bị sẵn declaration nếu chuyển production.
- **Quy tắc 12 tester/14 ngày**: chỉ áp dụng khi chuyển sang production access (Play Console 2023+ requirement cho tài khoản cá nhân). Internal testing né được.
- **Managed Google Play Private App**: nếu >100 user, phải chuyển sang. Cần EMM hoặc Managed Google Accounts. Xem `docs/RESEARCH-MOBILE-DISTRIBUTION.md` mục 3.
- **TWA network dependency**: nếu Vercel down, app trắng màn. Cân nhắc offline fallback trong SW (đã có network-first — cache stale vẫn hiện).
