# InteriorFlow — Installer Build Index

> Scaffold checklist cho 4 bộ cài (Windows · Mac · Android · iOS/iPadOS). **CHỜ USER DUYỆT trước khi thực thi.**
> Nghiên cứu đầy đủ: [`docs/RESEARCH-INSTALLER-4-PLATFORMS.md`](../docs/RESEARCH-INSTALLER-4-PLATFORMS.md) (23/07) + [`docs/RESEARCH-MOBILE-DISTRIBUTION.md`](../docs/RESEARCH-MOBILE-DISTRIBUTION.md) (20/07).

## Trạng thái 23/07

| Platform | Scaffold | Có thể build NGAY? | Chờ credential | Sprint |
|---|---|---|---|---|
| Windows .exe unsigned | ✅ `build-windows-native.bat` | ✅ (trên máy Windows) | Không | **Sprint 1** |
| Windows .exe signed | ⚠️ config template | ❌ | Sectigo/DigiCert cert | Sprint 3 (optional) |
| Mac .dmg unsigned | ✅ `npm run electron:build:mac` | ✅ (trên máy Mac) | Không | Sprint 1 |
| Mac .dmg notarized | ❌ chưa có afterSign hook | ❌ | Apple Developer $99/năm | **Sprint 2** |
| Android PWA "Add to Home Screen" | ✅ manifest + sw.js đầy đủ | ✅ (qua LAN) | Không | **Sprint 1** |
| Android TWA APK/AAB Google Play | ❌ chưa init Bubblewrap | ❌ | Google Play $25 + Vercel HTTPS | **Sprint 2** |
| iOS/iPadOS PWA "Add to Home Screen" | ⚠️ meta chưa optimize (10 icons + 14 splash) | ⚠️ (chạy tạm được, chưa đẹp) | Không (nhưng cần Vercel HTTPS) | **Sprint 1** |
| iOS/iPadOS Capacitor .ipa | ❌ chưa có Capacitor | ❌ | Apple Developer + Xcode + Mac | Sprint 3 (optional) |

## Sprint kế hoạch

- **Sprint 1** (2-3 ngày, không cần credential): Windows unsigned + PWA iOS/Android meta optimize + LAN QR demo.
- **Sprint 2** (~1 tuần sau credential): Mac notarize + Android TWA + iOS PWA qua Vercel. Blocker: Vercel deploy + Apple Dev + Google Play Console.
- **Sprint 3** (optional): iOS Capacitor .ipa + Windows code-sign.

## File con

- [`mac-notarize.md`](mac-notarize.md) — checklist notarize .dmg
- [`windows-electron-builder.json`](windows-electron-builder.json) — template config
- [`android-bubblewrap.md`](android-bubblewrap.md) — checklist TWA + Play upload
- [`ios-pwa-vs-capacitor.md`](ios-pwa-vs-capacitor.md) — so sánh + gợi ý chọn

## Cấm

- KHÔNG cài dep mới (Bubblewrap, Capacitor, @electron/notarize…) — chờ user OK Sprint 2/3.
- KHÔNG sửa `electron/main.js`, `package.json`, `components/`, `lib/`, `app/`.
- KHÔNG xoá scaffold Windows/Mac/Android cũ đã có.
