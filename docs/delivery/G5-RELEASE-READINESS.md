# G5 · SẴN SÀNG PHÁT HÀNH — khảo sát + Electron

> Lập 04/09 tại mốc `a64c0248` (`origin/integration/2026-09-04`). Chủ sở hữu: **lane 07 · RELEASE**.
> **Pha KHẢO SÁT** — lượt này không sửa mã sản phẩm, không chạy `electron:build`.
>
> **Bằng chứng phát hành cuối cùng cho đích desktop là APP ELECTRON ĐÃ ĐÓNG GÓI**, không phải một
> bản dựng web. Mọi thứ dưới đây quy về câu đó.
>
> Tài liệu này **không thay** `docs/RELEASE-CHECKLIST-INTERNAL.md` (44 dòng, đã có, vẫn hiệu lực)
> và **không thay** `README-electron.md` (141 dòng, hướng dẫn build). Nó trả lời một câu khác:
> **cổng nào đã có máy canh, cổng nào đang trống, và cái gì BẮT BUỘC phải sửa trước khi đóng gói.**

---

## B1 · HIỆN TRẠNG ELECTRON — đo tại nguồn

### B1-① · Cấu hình hiện tại là gì

| | Đo được | Nguồn |
|---|---|---|
| Kiến trúc | **KHÔNG phải web tĩnh.** Main process dựng một **tiến trình con `next start`** trên cổng loopback tự dò, đợi server trả lời rồi mới mở `BrowserWindow` trỏ vào nó | `electron/main.js:301-356` |
| Vì sao phải vậy | app có `app/api/**` + Prisma/SQLite ⇒ bắt buộc có server Node chạy nền | `electron/main.js:5-6` |
| Mẹo đường ghi | `cwd` của server = `userData` (ghi được), còn `next start <appRoot>` để Next đọc `.next` đúng chỗ đóng gói ⇒ **không phải sửa một API route nào** | `electron/main.js:13-21`, `:336-347` |
| Đóng gói | `asar: false`, gói nguyên `node_modules/**/*`, `extraMetadata.main` trỏ `electron/main.js` | `package.json` build |
| Đích | Windows `nsis` x64 · macOS `dmg` arm64 | `package.json` build.win / build.mac |
| Bản khoá | `electron 33.4.11` · `electron-builder 25.1.8` · `electron-updater 6.8.9` · `next 14.2.35` · `prisma 6.19.3` | `package-lock.json` |
| Tự cập nhật | có `electron-updater`, nhưng **chỉ chạy khi bật rõ ràng** `INTERIORFLOW_AUTO_UPDATE=1` | `electron/main.js:486-493` |
| Khoá API | **không nhúng vào bộ cài**; đọc từ `<userData>/config.json`, mở bằng menu *Tệp* | `electron/main.js:186-232`, `:407-421` |
| Không dùng standalone | cố ý, có ghi lý do | `next.config.mjs:8-13` |

**Tư thế bảo mật — đã đúng, không cần đụng:**

| Điểm | Giá trị | Dòng |
|---|---|---|
| `contextIsolation` | `true` | `electron/main.js:370` |
| `nodeIntegration` | `false` | `:371` |
| `sandbox` | `true` | `:372` |
| preload | 22 dòng, **chỉ phơi dữ liệu tĩnh**, không hàm nào chạm hệ tệp/tiến trình | `electron/preload.js:14-21` |
| link ngoài | mở bằng trình duyệt hệ thống, không mở trong app | `:382-388` |
| bind mạng | `HOSTNAME: '127.0.0.1'` + `-H 127.0.0.1` — **không bind LAN ngầm** | `:319`, `:339` |
| DevTools | ẩn khi đã đóng gói | `:448` |
| một tiến trình | single-instance lock | `:457-466` |
| nâng cấp dữ liệu | snapshot DB + uploads **trước** khi đụng schema; **snapshot lỗi thì CHẶN khởi động**, không liều ghi | `:156-181`, `:324-331` |

⇒ **Kiến trúc này đúng và đang chạy. Không viết lại.** Mọi mục dưới đây là **cập nhật tại chỗ**.

### B1-② · Chạy được không

- **Chế độ dev**: có đường sẵn — `electron:dev` chạy `next dev` + `wait-on` + `electron .`
  (`package.json:30`). Không có gì chặn.
- **Bản đóng gói**: **CHƯA AI XÁC MINH TRONG PHẠM VI ĐO ĐƯỢC CỦA REPO.** Không có bằng chứng nào
  trong `docs/bao-cao-phien/` hay CI về một lần *mở bộ cài đã dựng*. `dist-installer/` đã gitignore
  (`.gitignore:18`) nên cũng không có dấu vết bản dựng.

### B1-③ · 🔴 BẮT BUỘC PHẢI CẬP NHẬT

Chỉ liệt kê thứ **chặn** hoặc **giảm rủi ro đáng kể**. Không có mục nào ở đây là "nên-làm-cho-đẹp".

#### M1 · Bản đóng gói nâng cấp dữ liệu bằng `db push`, dựa trên một lý do ĐÃ ĐO ĐƯỢC LÀ SAI

`electron/main.js:241-243` ghi nguyên văn:

> *"Dùng `db push --skip-generate` thay vì `migrate deploy` vì repo quản lý schema bằng db push
> (prisma/migrations **ĐÃ CŨ hơn** schema.prisma — deploy sẽ tạo schema **thiếu bảng**)."*

**Câu đó không còn đúng.** Đo lại trong lượt này (xem §B5): `migrate diff` trả **"No difference
detected"**, và migrations dựng đủ **24/24** bảng.

Đây không phải chuyện chữ nghĩa, vì hai đường trong cùng repo đang đi **ngược nhau**:

| Đường | Dùng gì | Lý do tự khai |
|---|---|---|
| môi trường kiểm | **`migrate deploy`** | `scripts/dung-moi-truong-kiem.sh:10-15` — *"`db push` tiện hơn nhưng **CHE MẤT lệch migrations** — đúng cái bẫy đã cắn một lần"* |
| **máy người dùng thật** | **`db push`** | `electron/main.js:241-243` — lý do nay đã sai |

⇒ Máy CI được bảo vệ khỏi đúng cái bẫy mà **máy người dùng thật đang phơi ra**. Và `db push` trên
dữ liệu thật là đường **không có lịch sử, không có đường lùi** — chính `electron/main.js:133` đã tự
ghi nhận điều đó khi biện minh cho cơ chế snapshot.

**Cập nhật**: chuyển đường đóng gói sang `migrate deploy`, giữ nguyên cổng chặn-khởi-động-khi-lỗi và
cơ chế snapshot. ⚠️ Không phải đổi một dòng: DB của người dùng hiện có được dựng bằng `db push` nên
**không có bảng `_prisma_migrations`** — cần `migrate resolve --applied` cho baseline, hoặc một
nhánh nhận diện DB cũ. **Đây là việc phải làm CẨN THẬN, và là lý do nó đứng đầu danh sách.**

#### M2 · `npm run electron:build` dựng bản **Windows** — kể cả khi chạy trên máy Mac

`package.json:31` — `electron:build` = `next build && electron-builder --win --x64`.
`electron:build:mac` tồn tại (`:34`) nhưng **không phải lệnh mặc định**, và `README-electron.md`
đặt tên đúng theo hướng Windows (*"Bản Desktop (Electron → .exe Windows)"*).

Máy phát triển ghi trong sổ dự án là **Apple Silicon**. Chạy lệnh mặc định ở đó là yêu cầu
electron-builder dựng NSIS trên macOS — cần wine, và kể cả thành công thì **thứ dựng ra không mở
được trên chính máy vừa dựng**, nên không nghiệm thu được cổng *"mở app đã đóng gói"*.

**Cập nhật**: chốt đích phát hành trước, rồi làm cho lệnh mặc định khớp đích đó (hoặc đổi
`electron:build` thành lệnh dựng theo nền tảng đang chạy). Đây là **rào chắn rẻ nhất** trong danh
sách — một dòng script đổi lấy việc không đốt một lượt đóng gói.

#### M3 · Bản macOS **không ký** ⇒ máy sạch khác sẽ không mở được

`package.json` build.mac: `"identity": null` — tắt hẳn ký số.

Trên bất kỳ máy Mac nào **không phải máy vừa dựng**, Gatekeeper chặn với thông báo kiểu *"ứng dụng
bị hỏng"*. Nghĩa là cổng **"mở app đã đóng gói trên máy sạch"** — cổng quyết định của G5 — **không
thể qua trên macOS** ở cấu hình hiện tại.

`RELEASE-CHECKLIST-INTERNAL.md` dòng 44 đã xếp ký/notarize vào *"chưa đạt cho bản rộng hơn nội bộ"*.
Điều đó **đúng cho phân phối rộng**, nhưng chưa trả lời được câu hẹp hơn: *bản nội bộ có chạy được
trên máy Mac thứ hai không.* **Phải chốt**: hoặc Windows là đích duy nhất của G5 này (thì `identity`
không chặn gì), hoặc macOS cũng là đích (thì ký số thành mục bắt buộc, không hoãn được).

#### M4 · Electron 33 — cần chốt lại vòng đời hỗ trợ trước khi mang bán

Khoá ở **33.4.11**. Electron chỉ vá bảo mật cho **3 dòng lớn mới nhất**; một app Chromium tải nội
dung mà đứng ngoài vòng đó là **không nhận vá bảo mật**. Với định vị *sản phẩm bán ra*, đây là câu
phải trả lời chứ không được để trôi.

⚠️ **Chưa kiểm**: môi trường này không ra được mạng, nên tôi **không xác minh được** dòng Electron
đang được hỗ trợ tại 09/2026. Việc cần làm là một lần tra rồi ghi kết luận — không phải nâng cấp mù.

#### M5 · `AUTH_SECRET` hỏng âm thầm ⇒ có thể đăng xuất mỗi lần mở app

`electron/main.js:215-222` sinh `AUTH_SECRET` ngẫu nhiên khi thiếu, rồi ghi xuống `config.json` để
giữ đăng nhập. Nhưng `:223-226` bọc lượt ghi bằng `catch {}` **rỗng**, kèm chú thích
*"ổ đĩa read-only? — vẫn chạy tiếp với cfg trong RAM"*.

Chạy tiếp là đúng. **Im lặng thì không.** Nếu ghi hỏng thật, mỗi lần khởi động là một secret mới ⇒
mọi cookie phiên cũ chết ⇒ người dùng **bị đăng xuất mỗi lần mở app mà không hiểu vì sao**, và
không có gì trên màn hình nói cho họ biết.

**Cập nhật**: giữ nguyên hành vi chạy-tiếp, nhưng **phải nói ra** (cảnh báo, hoặc ghi vào log cạnh
`db-push.log` vốn đã có sẵn cơ chế). Đây là hành trình **J02** trong `JOURNEY-MATRIX.md`.

#### M6 · Cổng GPL/DWG vẫn đang mở, và nó là cổng pháp lý chứ không phải kỹ thuật

`package.json` khoá `licenseNotes` tự khai **UNRESOLVED**: định vị sản phẩm độc lập/toàn cầu làm
mất hiệu lực lập luận *"công cụ nội bộ, không phân phối"* từng dùng để biện minh cho
`@mlightcad/libredwg-web` (GPL-3.0). Nguyên văn: đường nhập DWG **phải** được đổi giấy phép, thay
thế, hoặc cô lập hẳn **TRƯỚC** khi phân phối ra ngoài.

Không phải việc của lượt này, nhưng **phải nằm trong danh sách cổng G5** — vì đây là loại cổng
không có cách nào sửa sau khi bộ cài đã ra khỏi tay.

---

## B2 · `npm run release:preflight` kiểm gì

`scripts/release-preflight.mjs` — **44 dòng, và nó là 8 phép so khớp chuỗi trên đúng một tệp**
(`electron/main.js`). Nó **không** dựng, **không** đóng gói, **không** mở app, **không** chạm DB.

Nó khoá 4 tính chất, và cả 4 đều đáng khoá:

| Khoá gì | Dòng |
|---|---|
| server **không** bind `0.0.0.0`, và **có** bind loopback ở cả hai chỗ | `:13-24` |
| auto-update phải **opt-in** rõ ràng | `:25-27` |
| lỗi đồng bộ schema phải **chặn khởi động** kèm thông báo rõ | `:28-30` |
| có snapshot trước nâng cấp + có thư mục `backups` | `:31-36` |

**Đánh giá thẳng**: đây là một **máy canh chống tái phát tốt** cho bốn quyết định đã trả giá để có
— rẻ, tất định, chạy tức thì. Nó **không phải** và không tự nhận là bằng chứng phát hành: dòng
`:2-3` tự khai *"Không thay thế smoke test trên máy sạch"*.

🔴 **Nhưng cái tên thì nói quá.** *"Preflight"* nghe như *"đã kiểm xong, cất cánh được"*, trong khi
nó phủ **0/21** cổng môi trường sạch ở §B3 dưới đây. Đọc lướt kết quả `Release preflight đạt` rất
dễ hiểu thành *sẵn sàng phát hành*. Rủi ro này giống hệt ba ca máy-soi-báo-quá-tay đã ghi trong sổ
ngày 04/09.

⚠️ **Giới hạn thứ hai, ít ai để ý**: vì nó so khớp **chuỗi ký tự**, một lần đổi tên biến hay xuống
dòng khác đi cũng làm nó **báo đỏ dù hành vi không đổi** — và ngược lại, một chú thích có chứa đúng
chuỗi đó cũng làm nó **báo xanh dù mã đã hỏng**. Đây đúng họ bệnh với ca `soi-thao-tac` đọc chữ
trong chú thích. Không đề xuất sửa trong lượt này; ghi lại để không ai coi kết quả của nó là chứng
minh hành vi.

---

## B3 · 21 CỔNG MÔI TRƯỜNG SẠCH

`✅` có máy kiểm tự động · `🟡` có một phần · `⬜` trống hẳn.
Chi phí: **S** một lượt sửa nhỏ · **M** một phiếu · **L** cần quyết định sản phẩm hoặc hạ tầng mới.

| # | Cổng | Máy kiểm hiện có | Đang trống gì | Chi phí bịt |
|---|---|---|---|---|
| 1 | checkout mới | ✅ CI `.github/workflows/kiem.yml` | — | — |
| 2 | cài đặt | ✅ `npm ci` (CI) | — | — |
| 3 | dựng môi trường | ✅ `scripts/dung-moi-truong-kiem.sh` (CI) | — | — |
| 4 | `migrate deploy` | ✅ trong script trên — **cố ý** dùng deploy để phát hiện lệch migrations | ⚠️ **đường đóng gói lại KHÔNG dùng deploy** — xem **M1** | **M** (M1) |
| 5 | build sản phẩm | ✅ `npm run build` (CI) | — | — |
| 6 | **build/đóng gói Electron** | ⬜ **không có** | CI chạy `ubuntu-latest`, **không dựng installer nào**; chưa ai chạy `electron:build` trong phạm vi ghi nhận được | **M** — cộng **M2** (lệnh mặc định sai đích) |
| 7 | **mở app đã đóng gói** | ⬜ **không có** | 🔴 **đây là bằng chứng phát hành**, và nó đang trống hẳn. Trên macOS còn bị **M3** chặn cứng | **L** — cần máy thật + quyết định ký số |
| 8 | đăng nhập | 🟡 `scripts/tai-khoan-kiem.mjs` (đồ nghề, dựng tài khoản; **không** kiểm hành trình) | J01 · J02 — chưa chạy trên bản đóng gói; **M5** chưa xử | **M** |
| 9 | Home | 🟡 ảnh chụp qua `scripts/audit-routes.mjs` | ảnh ≠ hành trình; Home còn đang trong vòng thiết kế (`SHIP-BLOCKERS` B2) | **M** (theo lane 04) |
| 10 | vào dự án | ⬜ | J04 UNVERIFIED | **S** |
| 11 | hành trình quan trọng | 🟡 4 PASS trên app thật (3D · Trình bày) | 14 UNVERIFIED — xem `JOURNEY-MATRIX.md` | **M** |
| 12 | **lưu / tải lại** | 🟡 `app/api/flows/[id]/route.test.ts` (Prisma thật, cơ chế `rev`) | 🔴 **0 hành trình xác minh ở cột KẾT QUẢ ĐÃ LƯU**; **J16 là P0 đang mở** | **M** — ưu tiên số 1 |
| 13 | tài sản | 🟡 `lib/server/library-save.test.ts` · `mime-sniff.test.ts` | J13 đầu-cuối; tệp có sống trong `userData` của bản đóng gói không thì chưa ai đo | **M** |
| 14 | 3D | ✅ chạy thật 04/09 — 3/3 PASS | chỉ phủ chiều **TIẾN** và một phần **LÙI**; chiều **MỞ LẠI** trống | **S** |
| 15 | Trình bày | 🟡 PASS 3/3 lượt cho *đưa bản vẽ sang* | J12 (lưu + mở lại) chưa ai chạy | **S** |
| 16 | IDF / IDFC | 🟡 nhiều test đơn vị (`idfp` · `idfc-store` · `part-lock` · `chuan-net`) | `SHIP-BLOCKERS` **B4**: sinh từ máy sạch **chưa chạy lại** sau khi thu 11 slice | **M** |
| 17 | trạng thái lỗi / ngoại tuyến | ⬜ | J22; `RELEASE-CHECKLIST-INTERNAL.md` §1 đã đặt yêu cầu, chưa ai chạy | **M** |
| 18 | lỗi console / runtime | ⬜ | không có cổng nào chặn lỗi console lúc chạy | **S** — bắt console trong lượt chụp đã có |
| 19 | thích ứng | 🟡 một ca desktop hẹp đã PASS 04/09 | không có dải khổ nào được quét hệ thống | **M** |
| 20 | bàn phím / tiêu điểm | 🟡 `soi:thao-tac` + đợt vá vòng focus 04/09 | 21 lỗ còn lại (P4, không chặn); **chiều bàn phím đã gãy 2 lần ở 3D** (⌘Z, Delete) | **S** |
| 21 | hiệu năng cơ bản | ⬜ | không có số nền nào; và bản đóng gói có **thêm** một tiến trình `next start` + `db push` lúc khởi động — chưa ai đo thời gian mở app | **M** |

**Đọc bảng này trong một câu**: cổng 1-5 (đường build từ nguồn) **đã kín và có CI canh**; cổng 6-7
(đóng gói và mở bộ cài) **trống hoàn toàn**; cổng 8-21 phần lớn dựa vào test đơn vị và ảnh chụp —
tức là **kiểm được mã, chưa kiểm được sản phẩm**.

🔴 **Lỗ lớn nhất** không phải một cổng nào trong bảng, mà là **chỗ đứt giữa cổng 5 và cổng 6**:
mọi thứ đang được kiểm trên `ubuntu-latest` bằng `next build`, trong khi **thứ giao cho người dùng
là một bộ cài Windows/macOS chưa ai dựng thử**. Cầu nối duy nhất giữa hai bờ hiện nay là niềm tin.

---

## B4 · KỊCH BẢN NGHIỆM THU

Đã soạn: **`scripts/nghiem-thu-g5-moi-truong-sach.sh`** — **BẢN NHÁP, CHƯA TỪNG ĐƯỢC CHẠY.**

Kịch bản tự khai điều đó ở đầu tệp. Phần đóng gói Electron rất tốn nên **lượt này cố ý không chạy**;
nó phải được chạy lần đầu **có người ngồi cạnh**, trên máy thật, đúng nền tảng đích.

**Luật kiểm chứng đã áp trong kịch bản**: mọi lệnh giữ **mã thoát THẬT**. Không có chỗ nào dùng
`lệnh | tail; echo $?` — dạng đó trả mã thoát của `tail` chứ không phải của lệnh, và đã gây một lần
báo xanh giả. Kịch bản đặt `set -o pipefail` và lấy mã thoát trực tiếp.

---

## B5 · MIGRATIONS — đo lại trong lượt này

Không chép số của ai. Ba phép đo, chạy tại `a64c0248`:

```
① prisma migrate diff --from-migrations ./prisma/migrations
                      --to-schema-datamodel ./prisma/schema.prisma
                      --shadow-database-url file:/tmp/shadow-g5.db
   rc=0  →  "No difference detected."

② CREATE TABLE trong prisma/migrations/**.sql, đếm tên riêng biệt : 28
   trừ 4 bảng tạm của Prisma (new_Flow · new_LibraryAsset · new_Project · new_User)
   →  24 bảng thật

③ grep -cE '^model ' prisma/schema.prisma                        : 24
```

⇒ **24 = 24.** Máy chủ mới chạy `migrate deploy` dựng **đủ 24/24 bảng**. Rủi ro *"migrations tụt sau
schema"* **đã đóng** (`fd83f343`) và lượt đo này xác nhận độc lập.

Sáu thư mục migration hiện có, hai cái cuối chính là dấu vết của lần vá đó:
`20260703141955_init` · `20260808000001_catchup_db_push_baseline` ·
`20260808000002_them_workflowstate_task_externalref` · `20260811170725_them_task_context` ·
`20260811182705_them_project_profile` · `20260904000000_catchup_schema_drift`.

**Việc còn lại chỉ là backfill `matId`** — `scripts/backfill-material-matid.ts`, **mặc định dry-run**
(`:54` `const APPLY = process.argv.includes('--apply')`), phải truyền `--apply` mới ghi. `SHIP-BLOCKERS`
xếp **P3**: cần khi phát hành, không chặn việc hôm nay.

⚠️ **Ranh giới của kết luận này**: nó nói **migrations dựng đúng schema**. Nó **không** nói gì về
DB đang nằm trên máy người dùng — thứ được dựng bằng `db push` và **không có bảng `_prisma_migrations`**.
Đó chính là **M1**, và là lý do M1 không phải một dòng sửa.

---

## CHƯA CHẮC · CHƯA KIỂM

- **Chưa chạy `electron:build`, chưa mở bộ cài nào.** Toàn bộ §B1 là **đọc mã + đọc cấu hình**.
  Mọi kết luận về hành vi lúc đóng gói (M2, M3, M5) là **suy từ cấu hình**, chưa quan sát.
- **M4 (vòng đời Electron) không xác minh được** từ môi trường này — không ra được mạng. Đã ghi là
  *câu phải tra*, không ghi là *kết luận*.
- **Chi phí S/M/L là ước lượng theo hình dạng công việc**, không phải đo. M1 rất dễ bị đánh giá
  thấp: phần khó không phải đổi lệnh mà là baseline cho DB người dùng đã dựng bằng `db push`.
- **Bảng 21 cổng chấm theo máy kiểm TỰ ĐỘNG.** Một cổng `⬜` không có nghĩa là chưa ai từng thử tay
  — chỉ có nghĩa là không có gì **lặp lại được** đang canh nó.
- **Không đọc hết 522 dòng `electron/main.js`.** Đã đọc trọn các vùng: khởi động, đường ghi,
  snapshot, config, `db push`, spawn server, cửa sổ, vòng đời, dọn dẹp. Vùng menu đọc lướt.
- **`release:preflight` chưa chạy trong lượt này** — kết luận về nó đến từ đọc cả 44 dòng nguồn,
  không từ quan sát kết quả chạy.
- **Cột "CHẶN CỔNG" trong `JOURNEY-MATRIX.md`** chỉ dùng chắc chắn hai tên cổng mà phiếu giao đã
  đặt: **G2** (workflow) và **G5** (release). Các cổng khác ghi theo lane sở hữu, **không bịa số hiệu**.
