# QA PHÁT HÀNH — ma trận proof + cổng giao bản

> HEAD `16ead1c`. Lane read-only `IF-RELEASE-QA-001`, MAIN ghi tệp.
> `shasum prisma/dev.db` **trước = sau** trong cả lượt đo — không lệnh nào ghi DB.
> **KẾT LUẬN MỘT CÂU: hôm nay KHÔNG giao được bản cho một studio thật.**

## A · MA TRẬN PROOF — 13 script

| # | script | bậc bề mặt | cổng harness | chạy hôm nay |
|---|---|---|---|---|
| 1 | `auth-failclosed.mjs` | module runtime | 🔴 **KHÔNG CÓ** | ✅ 3/3 |
| 2 | `idfc-roundtrip.mjs` | module runtime | ✅ | ✅ 39/39 |
| 3 | `idfc-manifest-integrity.mjs` | module runtime | ✅ | ✅ 48/48 |
| 4 | `idfc-identity-boq.mjs` | module runtime | ✅ | ✅ 28/28 |
| 5 | `identity-boundary.mjs` | **production server (Electron-equivalent)** — cao nhất đang có | ✅ | ✅ 13/13 · 3 NOT ASSESSED |
| 6 | `secure-artifact-delivery.mjs` | HTTP (server ngoài) | ✅ | ❌ cần server trỏ DB thật |
| 7–13 | `access-scope` · `project-scope-routes` · `library-file-scope` · `asset-representation-scope` · `spec-reread` · `persist-xuatxu` · `nguonid-xuyen-may` | HTTP + **DB thật** | ✅ cả bảy | ❌ **ghi `prisma/dev.db`** |

### 🔴 Script duy nhất KHÔNG có cổng harness: `auth-failclosed.mjs`
Nghịch lý đau: **docstring của chính nó** kể lại đúng sự cố F-15 — `sucrase` sinh **tệp rỗng**, exit 0, `require()` thành công, in `LOADED`. Rồi **ca thứ hai của nó mong đúng chữ `LOADED`**. Nếu esbuild im lặng sinh bundle rỗng: ca 1 đỏ ⇒ được cứu **tình cờ**, y hệt lần F-15; nhưng **ca 2 và 3 xanh trên module rỗng**.
`build.status !== 0` là kiểm **mã thoát của công cụ** — đúng cái gốc mà F-15 kết luận là sai. Không có dòng nào kiểm `size > 0` hay `typeof mod.middleware === 'function'`.

### 🔴 Bảy proof ghi vào DB thật ⇒ ma trận không chạy lại được
Cả bảy `new PrismaClient()` không truyền `datasources` ⇒ lấy `.env` = `prisma/dev.db` thật (38,5 MB · 1982 `ProjectFile` · 1635 `LibraryAsset`). Chúng có dọn, nhưng dọn **sau khi đã ghi**; đứt giữa chừng là để rác trong DB sản xuất. Và theo F-18, `export DATABASE_URL` **không** cách ly được.

## B · ELECTRON

| | |
|---|---|
| Target | Windows NSIS x64 · macOS dmg **arm64**. Không universal, không Intel, không Linux |
| `asar` | `false` — mã nằm trần trong `resources/app/` |
| `.env` trong gói | **KHÔNG** — `AUTH_SECRET` chỉ từ `<userData>/config.json` |
| **Ký số** | 🔴 **KHÔNG**. `mac.identity: null`, win không cert, không notarize. `BUILD-INFO.txt`: `Signed NO · Notarized NO` |
| Bộ cài duy nhất | `InteriorFlow-0.1.0-arm64.dmg` (354 MB, **22/08, HEAD `c7f3ac8`**) — lệch **39 commit**, `schema.prisma` **+185 dòng** |
| Windows | 🔴 **CHƯA TỪNG DỰNG** trên máy này, dù là target chính |
| Cổng mạng | ✅ chỉ loopback, thắt **hai lớp** (`HOSTNAME` env + `-H 127.0.0.1`). `contextIsolation` + `sandbox` bật, preload không có cầu IPC |
| `db push` lúc mở | 1–2 nấc: thường → nếu hỏng thì **sao lưu trước** rồi `--accept-data-loss` đúng một lần; không sao lưu được thì **không thử nấc 2**. Hỏng ⇒ `showErrorBox` + `quit`, không mở cửa sổ trên trạng thái không rõ. **Đây là chỗ làm đúng nhất trong tệp** |
| Auto-update | có mã, **mặc định TẮT** (`INTERIORFLOW_AUTO_UPDATE=1`) |

### 🔴 LỖ #1 — đường nâng cấp ĐI VÒNG QUA chính lưới an toàn của nó
`snapshotBeforeUpgrade()` chép `dev.db` + cả cây `uploads/` vào `<userData>/backups/<stamp>-before-<version-cũ>/`, gọi **trước** `db push`, không tạo được thì **throw**. Mã đúng và cẩn thận.
**Nhưng cổng kích hoạt là số version đổi** — `electron/main.js:161`: `if (state.lastStartedVersion === currentVersion) return;`
`package.json` vẫn `0.1.0`, bản DMG cũng `0.1.0`, trong khi schema đã +185 dòng. ⇒ **Giao bản mới hôm nay mà không bump version = `db push` chạy trên dữ liệu thật của studio, KHÔNG có snapshot nào.** Lưới còn lại chỉ là nấc 2 — thứ chỉ chạy **khi nấc 1 đã hỏng**. Một `db push` "thành công" mà mất cột thì không ai chặn.
Phụ: `fs.cpSync(..., { errorOnExist: true })` — `errorOnExist` chỉ có tác dụng khi `force:false`, mà `force` mặc định `true` ⇒ **cờ này không làm gì**. `backups/` **không có cơ chế dọn**.

### 🔴 LỖ #2 — người dùng cuối KHÔNG có đường sao lưu, và TUYỆT ĐỐI không có đường khôi phục
Menu chỉ có "Mở file cấu hình" và "Mở thư mục dữ liệu". Không có "Sao lưu ngay", không có "Khôi phục".
`scripts/backup-offsite.mjs` dùng `sqlite3 .backup` (kỹ thuật đúng) nhưng trỏ vào **repo** — studio không có repo, không có Node, không có terminal.
`BackupRecoveryModal.tsx` **không phải** đường này — nó là backup bản vẽ CAD trong **IndexedDB**, khác tầng hoàn toàn.

### `AUTH_SECRET` trong bản đóng gói
Sinh ngẫu nhiên rồi ghi `<userData>/config.json` — **plaintext, không mã hoá**, cùng file với `FAL_KEY`/`NVIDIA_API_KEY`/`GOOGLE_CLIENT_SECRET`. Mất file ⇒ sinh secret **mới** ⇒ mọi phiên cũ mất hiệu lực, người dùng bị đăng xuất **không có lời giải thích**.
🔴 Ghi lỗi bị **nuốt** (`catch {}`) và chạy tiếp với secret **chỉ trong RAM** ⇒ ổ read-only = đăng xuất mỗi lần mở app, im lặng.

## C · BỀ MẶT CHƯA AI ĐO

| | đã có | thiếu | đo rẻ nhất |
|---|---|---|---|
| Permission | 0 `getUserMedia`/`Notification.requestPermission` trong toàn repo | `KNOWN-LIMITATIONS` khai mic **UNVERIFIED**; Electron chưa ký + thiếu `NSMicrophoneUsageDescription` ⇒ prompt sẽ **hỏng im lặng** | bấm nút voice 1 lần, chụp ảnh — 2 phút, cần Hoà |
| Offline | 4 tệp tham chiếu trạng thái mạng; kiến trúc local-first thuận lợi | **0 proof** cho ca rút mạng. Rủi ro ở đường AI cloud + OAuth | máy đo được: key rỗng + chặn fetch ⇒ khẳng định lỗi có thông điệp, không 500 trần, không spinner vĩnh viễn |
| a11y | `prefers-reduced-motion` ở ≥10 tệp — có ý thức | `soi:thao-tac` **exit 1**: `outline-can-focus-visible` **33 tệp**, `cam-hex-inline` **194 chỗ**. Chỉ 24 tệp có `focus-visible`. **`playwright@1.62.1` ĐÃ nằm sẵn trong devDependencies** mà chưa dùng | thêm `@axe-core/playwright`, chạy 11 route đã biết 200 — ~1 giờ, chạy lại vô hạn |
| Hiệu năng | đúng **một** con số, một lần chạy tay: `server up in ~10s` | không ngưỡng, không lần đo thứ hai, không phân rã. 10s với DMG 354 MB + `db push` mỗi lần mở là **sát ngưỡng bỏ cuộc** | đo `next start` × 5 lấy p95; `db push` đọc từ `db-push.log` đã có timestamp |
| Dữ liệu lớn | 1982 `ProjectFile` · 1635 `LibraryAsset` · **`AssetRepresentation` = 2** | 0 proof ở quy mô này (các proof tạo 2–3 hàng rồi xoá). DB lớn duy nhất đang có **cũng không sạch** (lẫn `__nb:` rác test) | trên **bản sao**: `GET /api/library` p95 + kích thước payload — ~45 phút |

⚠️ `AssetRepresentation = 2` nghĩa là tính năng mà **3/13 proof** chứng minh **gần như chưa ai dùng thật**.

## D · CỔNG PHÁT HÀNH — sắp theo *rẻ nhất × chặn nặng nhất*

| # | cổng | ai đo |
|---|---|---|
| 1 | **Bump `version` + chứng minh snapshot THẬT SỰ nổ** — cài đè, khẳng định `backups/<stamp>-before-0.1.0/` có `dev.db` **và** `uploads/`, `integrity_check = ok`. Ca âm: cài đè **cùng version** ⇒ xác nhận **không** snapshot ⇒ chốt luật *"cấm giao bản mới mà không bump version"* | máy dựng kịch bản; xác nhận cuối cần Hoà |
| 2 | **Cổng harness cho `auth-failclosed.mjs`** — `size > 1024` **và** `typeof mod.middleware === 'function'`; kiểm đột biến bằng bundle rỗng | máy · **~15 phút, rẻ nhất bảng** |
| 3 | **Sao lưu/khôi phục cho người dùng cuối** | cần Hoà quyết phạm vi |
| 4 | **Dựng lại bộ cài từ HEAD hiện tại**, mac **và** Windows | Windows cần máy Windows ⇒ Hoà |
| 5 | Smoke test máy sạch + đo cổng thật từ **máy thứ hai** trong LAN | Hoà, ~45 phút |
| 6 | **Chốt giấy phép DWG** — `libredwg-web` GPL-3.0; lý do "nội bộ, không phân phối" **hết hiệu lực**. Giao cho studio thật = **phân phối** | Hoà (pháp lý) |
| 7 | Ký số / notarize | cần credential ⇒ Hoà |
| 8 | a11y tự động + đóng 33 tệp `focus-visible` | máy |
| 9 | Hiệu năng mở app — ngân sách ≤ 15s p95 | máy + Hoà |
| 10 | Dữ liệu lớn trên bản sao | máy |
| 11 | Offline/nối lại | máy phần lớn |
| 12 | **Cách ly 7 proof khỏi `prisma/dev.db`** (`datasources` tường minh). Cổng: chạy cả 7, `shasum` trước = sau. **Không có cổng này thì ma trận proof không chạy lại được trong một phiên bình thường** | máy |

## E · VERDICT

| hạng mục | nhãn | bề mặt |
|---|---|---|
| fail-closed `AUTH_SECRET` | 🟢 `PASS — production server runtime (Electron-equivalent)` | 13/13 |
| …bậc harness của nó | 🟠 `PARTIAL — process/contract proof` | **không có cổng harness** ⇒ chỉ đáng tin gián tiếp |
| vòng đời `.idfc` | 🟢 `PASS — module runtime (mã sản xuất thật)` | 39/39 + 48/48 + 28/28 |
| 7 proof phạm vi | ⚪ `NOT ASSESSED trong phiên này` | ghi DB thật ⇒ không chạy lại được |
| Electron cổng mạng | 🟠 `PARTIAL — process/contract proof` | guard đọc **văn bản** `main.js`, không đo socket thật |
| Electron đóng gói/cài/ký | 🔴 **`FAIL`** | bản duy nhất lệch 39 commit · Windows chưa dựng · chưa ký |
| snapshot trước nâng cấp | 🔴 **`FAIL — logic phát hành`** | mã đúng, nhưng cổng kích hoạt là version **chưa từng bump** |
| sao lưu/khôi phục người dùng | 🔴 **`FAIL — bề mặt sản phẩm`** | không menu, không UI |
| permission · offline · a11y · hiệu năng · dữ liệu lớn | ⚪ `NOT ASSESSED` | 0 proof ở mọi bậc |
| giấy phép DWG | 🔴 **`FAIL — pháp lý, tự khai trong repo`** | `package.json` |

### Ba lỗ nặng nhất
1. **Nâng cấp đi vòng qua lưới an toàn của chính nó** — snapshot chỉ nổ khi version đổi; version đứng yên 39 commit trong khi schema +185 dòng.
2. **Người dùng cuối không có đường sao lưu, và không có đường khôi phục nào cả.** Ghép với #1: hỏng thì không có gì để quay về, cũng không có nút để quay về.
3. **Bộ cài không tồn tại ở trạng thái giao được** — lệch 39 commit, chưa ký, Windows chưa từng dựng, cộng khối GPL-3.0 chưa giải quyết.
