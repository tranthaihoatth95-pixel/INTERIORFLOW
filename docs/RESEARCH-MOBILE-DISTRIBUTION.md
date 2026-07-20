# NGHIÊN CỨU — Phân phối InteriorFlow lên iOS/iPadOS/macOS (App Store) + Android (CH Play), chỉ admin tải, không public

> Ngày truy cập toàn bộ nguồn: **2026-07-20**. Chính sách store đổi liên tục — trước khi hành động thật, verify lại link.
> Nhiệm vụ này CHỈ nghiên cứu. Không code, không cài dependency.

> ## ⚠️ ĐÍNH CHÍNH 20/07 (chủ dự án): BỎ giả định quy mô ~30 người → thiết kế cho SỐ NGƯỜI DÙNG KHÔNG GIỚI HẠN
> Hai kết luận bên dưới thay đổi theo:
> 1. **Android — Internal Testing track (trần 100 tester) KHÔNG còn là kênh chính.** Kênh đúng cho "admin phát hành nội bộ, không public, không giới hạn người": **Managed Google Play → Private app** — publish từ Play Console dạng private, chỉ tổ chức được chỉ định thấy (tối đa 1000 tổ chức), trong tổ chức chọn "Entire organization" là **toàn bộ user cài được, không trần số lượng**, phát qua managed Play/EMM. App private không bao giờ chuyển thành public được (tách bản build nếu sau này muốn public). Nguồn: [Distribute private apps — Managed Google Play Help](https://support.google.com/googleplay/work/answer/9495634) · [Publish private apps — Play Console Help](https://support.google.com/googleplay/android-developer/answer/9874937) (truy cập 2026-07-20). Internal Testing giáng xuống vai trò làn thử nghiệm trước khi đẩy bản private.
> 2. **iOS — lý do loại Enterprise Program "vì công ty ~30 người" hết hiệu lực**, nhưng khuyến nghị KHÔNG đổi: **Custom App qua Apple Business Manager vẫn là đường đúng** — bản thân nó đã phân phối **không giới hạn số người** trong tổ chức (mã quy đổi/MDM), không hết hạn, và không chịu các điều kiện audit ngặt nghèo + rủi ro thu hồi chứng chỉ của Enterprise Program. Enterprise chỉ đáng cân nhắc nếu sau này cần né App Review hoàn toàn.
> 3. macOS (.dmg notarize) và chặn cứng server HTTPS: **không đổi** theo quy mô.

## Tóm tắt 1 phút (nếu chỉ đọc 1 đoạn)

Yêu cầu gốc — *"iOS/iPadOS/macOS tải từ App Store, Android tải từ CH Play, ban đầu chỉ admin tải, không public"* — **khả thi kỹ thuật cho cả 4 nền tảng, nhưng "App Store/CH Play" theo đúng nghĩa đen (tức app phải qua App Review công khai) là SAI CÔNG CỤ cho yêu cầu "không public, chỉ admin"**. Cơ chế đúng của từng kho cho nhu cầu nội bộ không phải "đăng app lên store rồi giới hạn ai tải" — nó là một kênh phân phối **riêng biệt, không niêm yết**:

- **iOS/iPadOS: dùng Apple Business Manager → Custom App (Private)**, KHÔNG dùng App Store công khai, KHÔNG dùng TestFlight làm kênh vĩnh viễn (TestFlight là beta, build chết sau 90 ngày).
- **macOS: bỏ hẳn ý định "Mac App Store"** — kiến trúc app (spawn Blender qua child_process, đọc/ghi file CAD path tuỳ ý) **về cơ bản không tương thích với App Sandbox bắt buộc của MAS**. Đi tiếp đường hiện tại: **.dmg ký Developer ID + notarize**, KHÔNG qua store.
- **Android: dùng Google Play Console → Internal Testing track**, KHÔNG phải "CH Play public rồi giới hạn". Internal testing đúng nghĩa "chỉ admin tải" — tối đa 100 người, không review, không cần Data safety form/privacy policy.
- **Chặn cứng chung cho cả 4 nền tảng: app hiện tại chạy server Next.js CỤC BỘ + SQLite trên máy** — điện thoại/tablet không tự chạy được kiểu này. **Bắt buộc phải có server app kết nối tới được** trước khi làm bất kỳ bản mobile nào — không nhất thiết phải là Vercel+Supabase (Sprint 4), nhưng phải là MỘT server luôn bật, có địa chỉ ổn định. Xem mục 1.

---

## 1. Chặn cứng hiện tại: server cục bộ, và có bắt buộc cloud trước không

### Hiện trạng đã xác minh trong code (worktree này)

- **36 API routes** trong `app/api/`, phần lớn đọc `request`/`cookies()` (26 route grep thấy) — đây là server logic thật (auth, credits, upload, Blender convert…), **không thể** biến thành static export.
- Đã tự kiểm bằng tài liệu Next.js chính thức (`nextjs.org/docs/app/guides/static-exports`, truy cập 2026-07-20): `output: 'export'` **không hỗ trợ** Route Handlers dựa trên Request, Cookies, Server Actions, Middleware/Proxy — đúng những thứ app này dùng. → **Không có đường "đóng gói tĩnh offline" cho toàn bộ app.**
- Prisma hiện dùng `provider = "sqlite"` (file cục bộ). `docs/DEPLOY-VERCEL.md` đã có sẵn hướng dẫn đổi sang Postgres/Supabase — nhưng **STATUS.md xác nhận đây là Sprint 4, CHƯA làm.**
- Electron (`electron/main.js`) hiện **đã** tự spawn `next start` bind vào `0.0.0.0` với comment tường minh: *"server phục vụ cả LAN → điện thoại/máy khác trong mạng trỏ vào máy này được (dùng làm 'hub' cho Oppo)"*. Nghĩa là **đã có tiền lệ dùng máy desktop làm server LAN** — đây chính là "phương án tạm" ở mục 7, không phải hàng mới.
- **PWA đã được dựng sẵn, không phải từ số 0**: `public/manifest.webmanifest` (icons 192/512/maskable, `display: standalone`), `public/sw.js` (service worker network-first cho API/HTML, cache-first cho asset tĩnh, 108 dòng), `components/PWARegister.tsx` (đăng ký SW, xử lý update, chỉ chạy ở production), `app/layout.tsx` có `appleWebApp` meta. `next.config.mjs` đã có headers cho `/sw.js` và `/manifest.webmanifest`. → **Một phần lớn nền tảng "PWA" theo Sprint 4 coi là chưa làm thực ra đã có trong code.** Cần verify: app đã cài được qua "Add to Home Screen" thật chưa (chưa thấy bằng chứng test thực tế trong STATUS/CHANGELOG).

### Kết luận

**Có, về bản chất bắt buộc phải có một server luôn-bật, địa chỉ ổn định, TRƯỚC khi bất kỳ thiết bị di động nào dùng được app** — vì kiến trúc là server-rendered + DB, không phải app tĩnh. Nhưng "server luôn bật" **không nhất thiết là Vercel+Supabase** — đó chỉ là MỘT lựa chọn (được khuyến nghị vì managed, không cần giữ máy mở). Các lựa chọn khác và đánh đổi:

| Phương án server | Đánh đổi |
|---|---|
| **Vercel + Supabase** (đã có hướng dẫn ở `docs/DEPLOY-VERCEL.md`) | Chuẩn nhất cho PWA/TWA/Custom App di động — HTTPS có sẵn, uptime cao, không phụ thuộc máy nào bật. Cần đổi Prisma provider (đã có nhánh hướng dẫn, KHÔNG được sửa schema trên `main` khi chưa duyệt). Chi phí Vercel/Supabase free tier có giới hạn — cần verify hạn mức cho studio dùng thật (chưa xác minh — ngoài phạm vi câu hỏi kỹ thuật lần này). |
| **Máy desktop công ty làm "hub" LAN/tunnel** (đã có sẵn — `electron/main.js` bind `0.0.0.0`, memory ghi nhận tunnel `interiorflow-ttt.loca.lt`) | Dùng được NGAY hôm nay (mục 7), nhưng SQLite trên máy 1 người, máy phải luôn bật/không ngủ, tunnel phải khởi động lại thủ công khi máy ngủ — không phải hạ tầng bền vững cho "bản cài chính thức" trên store. |
| **VPS tự quản (không phải Vercel)** | Vẫn phải đổi SQLite → Postgres (SQLite không hợp với nhiều connection đồng thời qua mạng ổn định + Prisma serverless), vẫn phải tự lo TLS/domain/uptime. Không có lợi thế rõ so với Vercel cho quy mô này. |

**Với TWA (Android) và Custom App việc nhúng WebView (iOS)**: bắt buộc app trỏ vào **HTTPS domain ổn định** — tunnel tạm thời (`loca.lt`) đổi URL/gián đoạn mỗi lần restart **không dùng được** làm backend cho bản cài trên store, kể cả bản "chỉ admin". → **Với riêng 2 lối "bọc app" (TWA/wrapper), cloud/domain ổn định gần như bắt buộc, không có đường vòng thật sự.** Với PWA "Add to Home Screen" thuần (không qua store), tunnel tạm vẫn dùng tạm được (mục 7).

---

## 2. iOS/iPadOS: đường đóng gói khả dĩ + rủi ro Guideline 4.2

### Đường đóng gói cho app Next.js

- **PWA "Add to Home Screen"** (đã có sẵn, xem mục 1) — không qua App Store, không cần build native. Không đáp ứng đúng nghĩa "tải từ App Store" như brief yêu cầu, nhưng kỹ thuật hoạt động ngay.
- **WKWebView wrapper (Capacitor hoặc tự viết)** — cần native đủ để qua 4.2.
- **React Native WebView** — tương tự Capacitor về bản chất (wrapper), không mang lại lợi thế rõ so với Capacitor cho use-case này; không đào sâu thêm vì không đổi kết luận.

### Guideline 4.2 "Minimum Functionality" — nguyên văn hiện hành (developer.apple.com/app-store/review/guidelines, truy cập 2026-07-20)

> **4.2** *"Your app should include features, content, and UI that elevate it beyond a repackaged website. If your app is not particularly useful, unique, or 'app-like,' it doesn't belong on the App Store."*
> **4.2.2** *"Other than catalogs, apps shouldn't primarily be marketing materials, advertisements, web clippings, content aggregators, or a collection of links."*
> **4.2.3(i)** *"Your app should work on its own without requiring installation of another app to function."*

**Ngưỡng thực tế:** một `WKWebView` trỏ thẳng vào `/cad-editor` sẽ bị từ chối. Cần tối thiểu: icon/splash native, offline handling thật (không chỉ SW cache), có thể thêm push notification hoặc file picker native, UI điều hướng cảm giác "app" chứ không phải "trang web trong khung". Đây là rào cản THẬT nếu đi qua App Review công khai.

**Tin tốt cho ca cụ thể này:** nếu dùng **Custom App qua Apple Business Manager** (mục 3) thay vì App Store công khai, 4.2 **vẫn áp dụng đầy đủ** (không được nới lỏng) — nhưng vì đây là kênh riêng tư một lần duyệt, rủi ro/chi phí thấp hơn nhiều so với việc lo giữ app "sống" qua các đợt review công khai định kỳ.

### Chi phí

**Apple Developer Program: 99 USD/năm.** Tổ chức cần **D-U-N-S Number** (miễn phí nhưng có thể mất vài tuần) + là pháp nhân hợp pháp ("we do not accept DBAs, fictitious business names, trade names, or branches") + website công khai gắn domain tổ chức. Nguồn: [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/), [developer.apple.com/programs/whats-included](https://developer.apple.com/programs/whats-included/).

---

## 3. "Admin tải, không public" — cơ chế đúng của từng kho

### Apple — bảng so sánh đầy đủ

| Kênh | Giới hạn user | Cần App Review? | Hết hạn | Điều kiện tiên quyết | Chi phí | Phù hợp studio ~30 người, cần TRUY CẬP VĨNH VIỄN? |
|---|---|---|---|---|---|---|
| **TestFlight — internal** | **100** (phải là App Store Connect user có role trong org) | Build đầu mỗi version: có, nhưng thực tế nhanh | **Build chết sau 90 ngày**, không gia hạn | Developer Program | 99 USD/năm | ❌ Đây là kênh **beta**, không phải phân phối sản xuất. Phải re-upload build đều đặn <90 ngày để "sống" — không phải mục đích thiết kế của Apple. |
| **TestFlight — external** | **10.000** | **Bắt buộc** Beta App Review cho build đầu mỗi version (thời lượng review Apple không công bố SLA chính thức — chưa xác minh được con số chính xác) | 90 ngày, như trên | Developer Program | 99 USD/năm | ❌ Cùng lý do — beta only |
| **Custom App qua Apple Business Manager (Private)** | Không giới hạn cứng trong tổ chức (qua MDM/redemption code) | **Có** — full App Review + 4.2, như app công khai | Không hết hạn (bản phát hành ổn định, chỉ update khi bạn muốn) | Developer Program (99 USD/năm) + **Apple Business Manager** (miễn phí, cần D-U-N-S) + MDM **hoặc** redemption codes (không bắt buộc MDM nếu dùng redemption codes) | 99 USD/năm | ✅ **Đúng cơ chế "admin tải, không public"** — không niêm yết, chỉ tổ chức được chỉ định thấy trong mục Custom Apps. Developer org == recipient org là use case chuẩn theo Apple: *"a custom app is an app you've created for a specific organization, including a proprietary app for your organization's internal use."* |
| **Apple Developer Enterprise Program** | Không giới hạn (nội bộ) | Không (in-house, ngoài App Store) | Không hết hạn theo thiết kế, nhưng cert/profile phải gia hạn định kỳ — hết hạn thì **toàn bộ app cài trên máy nhân viên ngừng chạy đồng loạt** | **≥100 nhân viên** (điều kiện cứng, nguyên văn), pháp nhân, D-U-N-S, website, phải qua "verification interview and continuous evaluation", phải chứng minh Custom App/ABM/TestFlight KHÔNG đáp ứng được nhu cầu | 299 USD/năm | ❌ **LOẠI BỎ — studio ~30 người dưới ngưỡng 100 nhân viên bắt buộc.** Không đáng theo đuổi. |
| **Ad Hoc** | 100 thiết bị/loại/năm | Không | Provisioning profile ~12 tháng | UDID từng máy đăng ký thủ công trong Certificates/Identifiers/Profiles | 99 USD/năm (nằm trong Developer Program) | ⚠️ Kỹ thuật đủ dùng (100 máy > 30 người) nhưng vận hành thủ công nặng: thu UDID, tái ký khi hết hạn, slot thiết bị KHÔNG giải phóng giữa năm khi gỡ máy. Chỉ hợp giai đoạn test kỹ thuật, không hợp lâu dài. |

**Khuyến nghị Apple: Custom App qua Apple Business Manager.** Đây là kênh DUY NHẤT vừa đúng ngữ nghĩa "admin tải, không public", vừa không hết hạn, vừa không cần ≥100 nhân viên.

Nguồn: [developer.apple.com/testflight](https://developer.apple.com/testflight/), [TestFlight overview – App Store Connect Help](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/), [developer.apple.com/custom-apps](https://developer.apple.com/custom-apps/), [developer.apple.com/programs/enterprise](https://developer.apple.com/programs/enterprise/), [Register devices – Apple Developer Help](https://developer.apple.com/help/account/register-devices/register-a-single-device/).

### Google Play — bảng so sánh đầy đủ

| Track | Giới hạn tester | Cần review? | Turnaround | Điều kiện tiên quyết | Chi phí | Phù hợp? |
|---|---|---|---|---|---|---|
| **Internal testing** | **100 testers/app** (email list hoặc CSV) | Gần như không — *"may not be subject to usual Play policy/security reviews"* | **Vài phút** sau khi upload AAB | Play Console account; tester cần tài khoản Google | **25 USD một lần** (không phải/năm) | ✅ **Đúng cơ chế "admin tải, không public"** — link chỉ hoạt động với email đã thêm vào list, người ngoài không cài được dù không phải cơ chế enterprise thật sự |
| **Closed testing** | 2.000 users/list, tối đa 50 list/track | Có, nhẹ hơn production | Vài giờ | Như trên, hỗ trợ Google Groups | 25 USD một lần | Thừa cho 30 người — chỉ cần nếu >100 người hoặc muốn quản lý qua Google Group |
| **Managed Google Play — Private app** (cho tổ chức có Workspace/EMM) | Không giới hạn trong enterprise đã enroll | Không cần review, ~10 phút duyệt tự động | ~10 phút | **Bắt buộc có EMM/MDM hỗ trợ Android Enterprise** + Managed Google Play | Miễn phí (Managed Google Play tự tạo dev account, không tốn 25 USD) | Chỉ đáng nếu studio đã có Workspace + MDM sẵn — setup EMM là rào cản mới nếu chưa có |
| **Production (kể cả "unlisted"/hạn chế quốc gia)** | Không giới hạn | **Có, đầy đủ** | Vài ngày | Data safety form + privacy policy URL bắt buộc; D-U-N-S nếu tài khoản tổ chức | 25 USD | ❌ Vẫn là listing công khai, ai search cũng thấy (trừ khi ẩn hẳn — Google Play **không có** cơ chế "unlisted" như App Store Connect; hạn chế quốc gia chỉ giới hạn địa lý, không giới hạn theo người) |

**Đăng ký tài khoản:** phí **25 USD một lần** (không phải hàng năm như Apple). Tài khoản **cá nhân** không cần D-U-N-S; tài khoản **tổ chức** bắt buộc D-U-N-S (miễn phí nhưng có thể mất tới ~30 ngày). **Quy tắc 12-tester/14-ngày liên tục chỉ chặn "production access"**, KHÔNG áp dụng cho internal/closed testing — xác nhận từ trang chính thức Google (internal testing "Access requirements: None"). → Studio có thể mở tài khoản **cá nhân** để né D-U-N-S, dùng **internal testing** để né luôn quy tắc 12-tester/14-ngày, Data safety form, và privacy policy URL (3 thứ này chỉ bắt buộc từ closed/production trở lên).

**Khuyến nghị Google Play: Internal testing track**, tài khoản cá nhân (không cần D-U-N-S).

Nguồn: [support.google.com/googleplay/android-developer/answer/6112435](https://support.google.com/googleplay/android-developer/answer/6112435) (đăng ký), [/answer/14151465](https://support.google.com/googleplay/android-developer/answer/14151465) (quy tắc 12 tester/14 ngày), [/answer/9845334](https://support.google.com/googleplay/android-developer/answer/9845334) (testing tracks), [/answer/13628312](https://support.google.com/googleplay/android-developer/answer/13628312) (D-U-N-S), [/answer/10787469](https://support.google.com/googleplay/android-developer/answer/10787469) (Data safety), [support.google.com/googleplay/work/answer/9146439](https://support.google.com/googleplay/work/answer/9146439) (Managed Google Play).

---

## 4. macOS: App Store (sandbox) vs .dmg notarized ngoài store

### App Sandbox có bắt buộc cho Mac App Store không

**Có, bắt buộc.** Định nghĩa chính thức của Apple: *"An app distributed through the Mac App Store must enable App Sandbox."* ([developer.apple.com/help/glossary/app-sandbox](https://developer.apple.com/help/glossary/app-sandbox/))

### Cái gì vỡ trong app này dưới sandbox

1. **Spawn Blender qua `child_process`** (`lib/server/blender.ts`, tìm binary tại `/Applications/Blender.app/Contents/MacOS/Blender`) — **đây là rào cản cứng nhất**. Trong sandbox, tiến trình con kế thừa sandbox của cha qua entitlement `com.apple.security.inherit`, nhưng entitlement này **chỉ áp dụng cho executable nằm TRONG chính bundle của bạn và đã được bạn ký** — không cho phép exec một app bên thứ ba đã cài sẵn trên máy như Blender. Theo Electron docs (MAS submission guide) và kinh nghiệm cộng đồng dev, temporary-exception entitlements về lý thuyết tồn tại nhưng *"App Review takes a very dim view of folks using temporary exception entitlements"* — thực tế coi như không khả thi để lọt review.
2. **Đọc/ghi file CAD ở path tuỳ ý** — sandbox chỉ cho phép truy cập file do **user tự chọn qua NSOpenPanel/NSSavePanel** (`com.apple.security.files.user-selected.read-only` / `read-write`), muốn giữ quyền qua các lần chạy phải dùng security-scoped bookmarks. Nếu app hiện tự quét thư mục hoặc ghi cạnh file gốc mà không qua dialog, sẽ vỡ.
3. **Local HTTP server (Next.js bind port nội bộ)** — **không vỡ**, chỉ cần thêm entitlement `com.apple.security.network.server`.
4. **`autoUpdater`, `crashReporter` bị Electron tắt hẳn trong MAS build** — theo Electron MAS guide: *"Disabled Modules: crashReporter, autoUpdater"*, *"Apps will not be aware of DNS changes"*.

Nguồn: [electronjs.org/docs/latest/tutorial/mac-app-store-submission-guide](https://www.electronjs.org/docs/latest/tutorial/mac-app-store-submission-guide), [developer.apple.com/documentation/security/app-sandbox](https://developer.apple.com/documentation/security/app-sandbox), [developer.apple.com/help/app-store-connect/reference/app-sandbox-information](https://developer.apple.com/help/app-store-connect/reference/app-sandbox-information/).

### .dmg notarized ngoài store — yêu cầu hiện hành

1. **Developer ID Application certificate** (từ Apple Developer Program, 99 USD/năm — không tốn thêm).
2. **Hardened Runtime bật** (`mac.hardenedRuntime: true` trong electron-builder).
3. **Ký toàn bộ** (`codesign`, deep-sign mọi helper binary/framework Electron lồng bên trong).
4. **Nộp `notarytool`** (công cụ `altool` cũ đã bị khai tử) → **Staple** ticket bằng `xcrun stapler staple`.
5. **Notarization miễn phí, nằm trong phí 99 USD/năm** — không phải khoản riêng.

**Gatekeeper trên macOS hiện tại có bắt buộc notarize không?** Về thực tế, **có**. Apple Platform Security: *"Gatekeeper verifies that the software is from an identified developer, is notarized by Apple... and hasn't been altered."* **Quan trọng — từ macOS Sequoia (15) trở đi, Apple đã bỏ thao tác "Control-click → Open" để vượt Gatekeeper cho app unsigned** — giờ user phải vào System Settings → Privacy & Security → cuộn xuống → bấm "Open Anyway" → xác nhận lần nữa. Với 30 máy nhân viên, đây là bước thủ công gây phiền và dễ bị IT/người dùng bỏ cuộc giữa chừng nếu ship app unsigned.

Nguồn: [support.apple.com/guide/security/gatekeeper-and-runtime-protection](https://support.apple.com/guide/security/gatekeeper-and-runtime-protection-sec5599b66df/web), thay đổi Sequoia: [macrumors.com](https://www.macrumors.com/2024/08/06/macos-sequoia-gatekeeper-security-change/), [appleinsider.com](https://appleinsider.com/articles/24/08/06/apple-removes-control-click-option-for-skipping-gatekeeper-in-macos-sequoia).

### Electron + Hardened Runtime — Blender có chạy được không

Ngoài sandbox (Developer ID build), spawn Blender bằng `child_process` **hoạt động bình thường** — không có rào cản nào tương đương sandbox. Entitlements cần: `com.apple.security.cs.allow-jit` (bắt buộc, V8 JIT), `com.apple.security.cs.disable-library-validation` (chỉ cần nếu app LOAD dylib chưa ký của bên thứ ba vào chính process — spawn Blender như tiến trình độc lập qua `child_process` thì **không cần** vì Blender chạy bằng chữ ký riêng của Blender Foundation, không lây hardened runtime từ app bạn).

### Khuyến nghị macOS

**Bỏ hẳn Mac App Store. Đi tiếp .dmg ký Developer ID + notarize.** Lý do: MAS đòi viết lại kiến trúc cốt lõi (spawn Blender ngoài sandbox là bất khả thi, filesystem tuỳ ý phải chuyển hết sang NSOpenPanel + bookmarks) chỉ để đổi lấy một kênh phân phối mà app nội bộ không cần "khám phá" qua tìm kiếm store. `.dmg` hiện tại (đã build, unsigned) chỉ cần thêm: đăng ký Developer Program dạng tổ chức (D-U-N-S) → cert Developer ID → bật hardened runtime trong electron-builder → `notarytool` + `stapler` (electron-builder có sẵn hook `afterSign` dùng `@electron/notarize`).

---

## 5. Android: TWA có phải cần PWA hoàn chỉnh trước không

### Xác nhận

**Có — TWA (Trusted Web Activity) bọc một PWA, không phải bọc một trang web bất kỳ.** Yêu cầu chính thức (developer.chrome.com/docs/android/trusted-web-activity):

- **Bubblewrap CLI** (`npm i -g @bubblewrap/cli`, `bubblewrap init` → `bubblewrap build`) sinh APK/AAB từ manifest PWA.
- **Digital Asset Links**: file `assetlinks.json` phải nằm ở `https://<domain>/.well-known/assetlinks.json`, liên kết app ↔ domain xác thực cùng chủ sở hữu. **Nếu xác thực thất bại, trình duyệt fallback về Custom Tab — lộ thanh URL, mất trải nghiệm "như app native".** Đây là lỗi triển khai phổ biến nhất.
- **HTTPS bắt buộc.**
- **Tiêu chí chất lượng PWA**: phải đạt tiêu chí installability (manifest hợp lệ, service worker, icon). Ngưỡng Lighthouse ≥80 điểm từng được Google công bố năm 2020 cho TWA — **chưa xác minh được** ngưỡng này còn hiệu lực nguyên văn năm 2026 trên một trang còn sống của Google, nên coi là tham khảo lịch sử, không phải cam kết hiện hành.

### Hiện trạng PWA của dự án — đã có sẵn phần lớn

Như nêu ở mục 1: `public/manifest.webmanifest`, `public/sw.js`, `PWARegister.tsx`, headers trong `next.config.mjs` **đã tồn tại trong code**, không phải làm từ đầu. Còn thiếu để làm TWA thật: **domain HTTPS ổn định** (không phải tunnel tạm) để đặt `assetlinks.json` và trỏ TWA vào, và cần verify Lighthouse/installability thực tế (chưa có bằng chứng đã test).

### Rủi ro chính sách "webview wrapper"

Google Play có chính sách Spam & Minimum Functionality — tài liệu Google/Play Academy: *"A large volume of app submissions are just webviews of existing websites... considered webview spam, and are removed from Play."* **Nhưng: internal testing track gần như không bị Play policy review** (theo trang chính thức Google) — nên rủi ro này **thực tế rất thấp nếu chỉ dùng internal testing**, đúng như khuyến nghị ở mục 3. Rủi ro chỉ thật sự đáng ngại nếu sau này muốn đưa lên closed/production.

### Chi phí

25 USD một lần cho Play Console (mục 3) — TWA không tốn thêm phí ngoài đó.

### Alternatives: TWA vs Capacitor vs PWA thuần

| Phương án | Ưu | Nhược | Phù hợp app cần server remote? |
|---|---|---|---|
| **PWA "Add to Home Screen"** | Không cần Play Console/25 USD/review/TWA gì cả. Update tức thì (chỉ deploy web) | Không có icon trên Play Store; user tự thao tác "Thêm vào màn hình chính"; một số API native hạn chế | Rất phù hợp — mặc định đã là remote server |
| **TWA (Bubblewrap)** | Có mặt trên Play (qua internal testing), full-screen như native, dùng chung codebase web | Cần assetlinks + HTTPS ổn định; rủi ro webview-spam nếu lên production (không phải internal testing) | Phù hợp — TWA vốn tải nội dung remote |
| **Capacitor** | Truy cập API native mạnh hơn (camera, push, file, biometric) | Nặng hơn TWA, vẫn phải build/ký/upload, vẫn chịu policy webview nếu chỉ bọc web thuần không thêm gì native | Phù hợp nếu cần API native thật sự; thừa nếu chỉ cần hiển thị web |

---

## 6. Chuỗi phụ thuộc + lộ trình + việc chỉ chủ dự án làm được

```
[0] Server luôn-bật, HTTPS domain ổn định
     │  (Vercel+Supabase HOẶC VPS riêng — bắt buộc cho TWA/Custom App;
     │   tunnel tạm chỉ đủ cho PWA thuần, xem mục 7)
     ├──────────────┬──────────────────┬─────────────────────┐
     ▼              ▼                  ▼                     ▼
[1] iOS/iPadOS  [2] Android TWA   [3] macOS .dmg        [4] PWA thuần
 Custom App      (cần domain để    (KHÔNG phụ thuộc      (đã gần xong,
 qua ABM          đặt assetlinks)   domain — máy chạy     chỉ cần verify
 (cần domain                        cục bộ vẫn OK)         cài đặt thật)
 để app "app-like"
 đủ qua 4.2, và
 để tất cả nhân
 viên trỏ cùng
 1 server)
```

### Việc làm ĐƯỢC ngay, không phụ thuộc server cloud

- macOS: đăng ký Developer Program tổ chức → lấy Developer ID cert → bật hardened runtime + `notarytool`/`stapler` trong `electron-builder`. Không phụ thuộc mục [0] vì app macOS chạy server cục bộ như hiện tại.

### Việc PHẢI xong mục [0] trước

- Android TWA: cần domain HTTPS thật để `assetlinks.json` xác thực được — không dùng tunnel đổi URL liên tục.
- iOS Custom App: WKWebView/Capacitor phải trỏ vào một backend ổn định để mọi nhân viên dùng chung dữ liệu (không hợp lý nếu mỗi bản build trỏ vào máy cá nhân của 1 người).

### Ước lượng thời gian từng khâu (thô, KHÔNG tính thời gian chờ duyệt ngoài tầm kiểm soát)

| Khâu | Ước lượng | Ghi chú |
|---|---|---|
| Đổi Prisma sang Postgres + deploy Vercel/Supabase | Đã có hướng dẫn chi tiết (`docs/DEPLOY-VERCEL.md`) — cỡ nửa ngày đến 1 ngày làm nếu suôn sẻ | Rủi ro: migration drift đã ghi trong CLAUDE.md/STATUS.md, phải `db push` không `migrate reset` |
| D-U-N-S Number (cả Apple lẫn Google org account) | **Có thể mất tới vài tuần** (nguồn Google ghi ~30 ngày) | Chỉ chủ dự án làm được — cần thông tin pháp nhân thật |
| Apple Developer Program đăng ký | Vài ngày sau khi có D-U-N-S | Chủ dự án làm — cần thẻ thanh toán + xác minh |
| Apple Business Manager setup + Custom App submit | 1 lần App Review (không có SLA công bố, cộng đồng ước ~24–48h — chưa xác minh chính thức) | |
| Google Play Console đăng ký (cá nhân, né D-U-N-S) | Vài ngày, có thể cần xác minh danh tính (ID + thẻ) | Chủ dự án làm |
| Build TWA (Bubblewrap) + assetlinks | Kỹ thuật thuần, sau khi có domain — vài giờ đến 1 ngày | |
| macOS Developer ID cert + notarize pipeline | Sau khi có Developer Program — vài giờ setup, tự động hoá xong thì mỗi lần build chỉ vài phút | |
| Native wrapper iOS đủ qua 4.2 (nếu cần) | Biến số lớn nhất — tuỳ mức "app-like" cần thêm | Không ước lượng chắc — phụ thuộc scope thật |

### Việc CHỈ chủ dự án làm được (không agent nào tự làm thay)

- Mua/kích hoạt tài khoản Apple Developer Program (99 USD/năm) và quyết định cá nhân hay tổ chức.
- Lấy D-U-N-S Number cho pháp nhân TTT (nếu chọn đường tổ chức) — cả Apple lẫn Google org account đều cần.
- Tạo Apple Business Manager account, mời/enroll thiết bị hoặc thiết lập redemption codes.
- Đăng ký Google Play Console (25 USD một lần), xác minh danh tính bằng giấy tờ thật.
- Khai báo pháp nhân, chấp nhận điều khoản hợp đồng nhà phát triển của cả hai bên.
- **Privacy policy công khai** — bắt buộc nếu đi lên closed/production Google Play (không bắt buộc cho internal testing); Apple Custom App qua App Review đầy đủ cũng thường đòi hỏi privacy policy URL trong App Store Connect metadata (chưa xác minh mức độ bắt buộc riêng cho kênh Custom App — khuyến nghị chuẩn bị sẵn để an toàn).
- Quyết định ai giữ vai trò Account Holder/Admin trong App Store Connect và Play Console (ảnh hưởng ai được thêm vào 100 slot TestFlight/internal testing).

---

## 7. Phương án tạm dùng NGAY hôm nay

**Hiện trạng:** team có thể vào bằng trình duyệt điện thoại qua LAN/tunnel, dùng "Thêm vào màn hình chính" — cơ chế này **đã có sẵn hạ tầng**: Electron bind `0.0.0.0` (dùng máy làm hub LAN), tunnel `interiorflow-ttt.loca.lt` đã từng dùng (theo memory dự án), và PWA manifest/service worker đã tồn tại trong code để "Add to Home Screen" chạy được như app standalone.

### Đánh giá đủ dùng tới đâu

- **Đủ dùng cho:** demo nội bộ, vài người dùng thử trong cùng buổi làm việc, khi máy chủ (desktop công ty) đang mở và tunnel đang chạy.
- **Không đủ dùng cho:** truy cập ổn định nhiều ngày (tunnel free `loca.lt` đổi URL/ngắt khi máy ngủ — đã ghi nhận trong memory dự án là hạn chế đã biết), nhiều người dùng đồng thời ghi dữ liệu vào SQLite của 1 máy, hoặc bất kỳ ai không có mặt tại thời điểm máy đang bật.
- **Hạn chế PWA trên iOS qua Safari cụ thể:** một số API (push notification nền, background sync) bị Safari giới hạn hơn Android Chrome — không ảnh hưởng chức năng cốt lõi CAD/render/present nhưng cần lưu ý nếu sau này cần notification.

### Khuyến nghị

Dùng tạm được **đúng như hiện tại đang làm** — không cần thay đổi gì để có bản demo ngay. Nhưng đây không phải nền tảng để nói "app đã có trên App Store/CH Play" — nó là một URL LAN/tunnel, không phải bản cài phân phối chính thức.

---

## Nguồn tổng hợp (tất cả truy cập 2026-07-20)

**Apple:**
- App Store Review Guidelines (4.2, 4.7): https://developer.apple.com/app-store/review/guidelines/
- Developer Program (phí, D-U-N-S): https://developer.apple.com/programs/enroll/ · https://developer.apple.com/programs/whats-included/ · https://developer.apple.com/support/compare-memberships/
- Enterprise Program (299 USD, ≥100 NV): https://developer.apple.com/programs/enterprise/
- Custom Apps: https://developer.apple.com/custom-apps/
- TestFlight: https://developer.apple.com/testflight/ · https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
- Ad Hoc / device registration: https://developer.apple.com/help/account/register-devices/register-a-single-device/
- App Sandbox: https://developer.apple.com/help/glossary/app-sandbox/ · https://developer.apple.com/documentation/security/app-sandbox · https://developer.apple.com/help/app-store-connect/reference/app-sandbox-information/
- Gatekeeper/notarization: https://support.apple.com/guide/security/gatekeeper-and-runtime-protection-sec5599b66df/web
- macOS Sequoia Gatekeeper bypass thay đổi: https://www.macrumors.com/2024/08/06/macos-sequoia-gatekeeper-security-change/ · https://appleinsider.com/articles/24/08/06/apple-removes-control-click-option-for-skipping-gatekeeper-in-macos-sequoia
- Electron MAS submission guide: https://www.electronjs.org/docs/latest/tutorial/mac-app-store-submission-guide
- Electron notarization: https://www.electron.build/docs/features/code-signing/notarization/ · https://github.com/electron/notarize

**Google:**
- Đăng ký Play Console (25 USD, xác minh danh tính): https://support.google.com/googleplay/android-developer/answer/6112435
- Quy tắc 12 tester/14 ngày: https://support.google.com/googleplay/android-developer/answer/14151465
- Testing tracks (internal/closed): https://support.google.com/googleplay/android-developer/answer/9845334
- D-U-N-S cho tổ chức: https://support.google.com/googleplay/android-developer/answer/13628312
- Data safety form: https://support.google.com/googleplay/android-developer/answer/10787469
- Managed Google Play / private apps: https://support.google.com/googleplay/work/answer/9146439
- TWA quick start (Bubblewrap): https://developer.chrome.com/docs/android/trusted-web-activity/quick-start
- TWA quality criteria (Lighthouse — lịch sử 2020, chưa xác minh còn hiệu lực nguyên văn): blog Chromium 2020

**Next.js:**
- Static export — tính năng không hỗ trợ: https://nextjs.org/docs/app/guides/static-exports

## Chưa xác minh được (nêu rõ, không đoán)

- Thời lượng chính xác Apple Beta App Review / App Review cho Custom App (Apple không công bố SLA chính thức).
- Ngưỡng Lighthouse cụ thể Google hiện áp cho TWA năm 2026 (chỉ có nguồn 2020, đề cập ≥80 điểm).
- macOS có giai đoạn chặn hẳn app hoàn toàn unsigned (không chỉ ẩn nút bypass) ở một số bản 15.x hay không — nguồn báo chí, chưa xác nhận bởi Apple.
- Privacy policy URL có bắt buộc cho riêng kênh Apple Custom App (khác App Store công khai) hay không.
- Giới hạn free tier Vercel/Supabase có đủ cho quy mô studio ~30 người hay cần gói trả phí — ngoài phạm vi câu hỏi phân phối mobile, cần nghiên cứu riêng nếu chủ dự án cần.
