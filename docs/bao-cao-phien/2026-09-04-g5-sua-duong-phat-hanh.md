# 04/09 · G5 — SỬA ĐƯỜNG PHÁT HÀNH (lane 07 · RELEASE)

> Pha **THI CÔNG**, tiếp sau khảo sát `docs/delivery/G5-RELEASE-READINESS.md`.
> Mốc bắt đầu: `a3f5986f` (`origin/integration/2026-09-04`, đã ff từ `f43de304`, lệch 135 → 0).
> Commit của lượt: `3b5289ac` (M1) · `098b048c` (M2·M3·M5 + tài liệu).

---

## 1 · M1 🔴→✅ — thôi `db push` trên dữ liệu người dùng

**Cách sửa, một câu**: `electron/main.js` thay `prisma db push` bằng `prisma migrate deploy`, và vì
CSDL người dùng hiện có **không có bảng `_prisma_migrations`** nên thêm đường **bắc cầu → đóng mốc**
cho riêng ca đó.

### Vì sao đây là P0 chứ không phải chuyện sạch sẽ

`db push` **được phép đổi/bỏ cột** để ép CSDL khớp schema, **không có lịch sử, không có đường lùi** —
và nó đang chạy **trên máy người dùng, trên dữ liệu thiết kế thật, mỗi lần mở app**. Chính repo này
đã viết luật ngược lại cho CI (`scripts/dung-moi-truong-kiem.sh:10-15`: *"db push CHE MẤT lệch
migrations"*) ⇒ **CI được bảo vệ, máy người dùng thì không.**

Biện minh tại chỗ (*"migrations ĐÃ CŨ hơn schema"*) **đã chết từ `fd83f343`**. Lượt này xác nhận
độc lập **hai lần**: `migrate diff` trả *"No difference detected"*, và
`scripts/dung-moi-truong-kiem.sh` báo **24/24 bảng khớp schema**.

### Cạm bẫy thật, và nó KHÔNG phải lo xa

Chạy thẳng `migrate deploy` lên CSDL dựng bằng `db push` thì **gãy** — migration đầu tạo lại bảng đã
có. **Đã tái hiện, không suy luận**: tắt nhánh bắc cầu rồi chạy test ⇒
*"Không thể kiểm tra/nâng cấp dữ liệu cục bộ (mã 1)"*.

Ba trạng thái, ba đường:

| Trạng thái | Nhận ra bằng | Xử lý |
|---|---|---|
| `moi` | chưa có `dev.db` / tệp rỗng | `migrate deploy` |
| `daCoLichSu` | có `_prisma_migrations` | `migrate deploy` |
| `cuDbPush` | **có bảng, KHÔNG có lịch sử** | bắc cầu → đóng mốc → `migrate deploy` |

Dò trạng thái bằng **một câu `SELECT` chỉ-đọc** (`db execute` trên `_prisma_migrations`), đã hiệu
chuẩn hai chiều: CSDL `db push` → rc=1 · CSDL `migrate deploy` → rc=0.

**Bắc cầu**: `migrate diff --from-url <db thật> --to-schema-datamodel` → **rà soát câu lệnh phá huỷ**
→ ghi SQL ra `<userData>/nang-cap-bac-cau.sql` (đọc được, không phải hộp đen) → áp →
`migrate resolve --applied` cho cả 6 migration. Từ lần mở kế tiếp, CSDL đó thuộc `daCoLichSu` vĩnh viễn.

### Bất biến: nghi ngờ thì DỪNG

`raSoatSqlBacCau()` chặn **mọi `DROP COLUMN`** và **mọi `DROP TABLE` nằm ngoài khuôn dựng-lại-bảng
của Prisma**. Khuôn đó (`CREATE TABLE new_X` → `INSERT INTO new_X … FROM X` → `DROP TABLE X` →
`RENAME`) **có chép dữ liệu sang** nên an toàn — và đây đúng là ca dễ báo quá tay nhất, nên nó được
**hiệu chuẩn trên SQL THẬT do Prisma sinh** chứ không phải SQL tự nghĩ ra:

| SQL thật | Kỳ vọng | Kết quả |
|---|---|---|
| bắc cầu thuần thêm (2 `ADD COLUMN` + 3 `CREATE TABLE`) | sạch | `[]` ✓ |
| khuôn dựng-lại-bảng (có `DROP TABLE "User"`) | **không báo quá tay** | `[]` ✓ |
| CSDL có bảng lạ ⇒ `DROP TABLE "BangLa"` | **báo đỏ** | `[xoá bảng BangLa]` ✓ |
| `-- This is an empty migration.` | sạch | `[]` ✓ |

### 4 ca nghiệm thu — CSDL SQLite THẬT, không mock

`electron/nang-cap-csdl.test.ts` — **24/24 đạt**.

| Ca | Trước | Sau |
|---|---|---|
| ① CSDL trống | — | **24 bảng** · lịch sử **6** |
| ②a kiểu cũ (`db push`), có dữ liệu | 24 bảng · **2 bản ghi** · lịch sử −1 | 24 bảng · **2 bản ghi** · lịch sử **6** |
| ②b kiểu cũ **tụt sau schema** | **21 bảng** · **2 bản ghi** · lịch sử −1 | **24 bảng** · **2 bản ghi** · lịch sử **6** |
| ③ chạy lại trên CSDL đã đúng | 24 · 2 · 6 | 24 · 2 · 6 — **không đổi** |
| ④ nâng cấp có nguy cơ mất dữ liệu | 25 bảng · 2 bản ghi | **ném lỗi** · gốc **không bị đụng** (25 · 2) · **bản sao lưu mở được, đủ 2 bản ghi** |

> **Số bản ghi ca ②: 2 → 2** ở cả hai biến thể. Fixture ②b dựng bằng cách gỡ đúng phần mà migration
> `20260904000000_catchup_schema_drift` thêm vào (3 bảng + 2 cột) — tức **tái hiện đúng máy người
> dùng đang chạy bản app cũ hơn**, không phải một CSDL bịa.

### Máy canh chống tái phát

`release:preflight` thêm 2 phép so (phải có `migrate deploy`, cấm `db push`). **Đã hiệu chuẩn**: giả
lập quay lại `db push` → **rc=1** kèm đúng 2 dòng lý do; khôi phục → rc=0.

---

## 2 · M2 ✅ · M3 🔶 · M5 ✅

**M2** — `electron:build` bỏ `--win --x64` gõ cứng ⇒ dựng cho **nền tảng đang chạy**. Hết cảnh trên
máy Mac dựng ra thứ không mở được trên chính máy vừa dựng. `:win` · `:mac` giữ; `electron:publish`
không đụng.

**M5** — `loadUserConfig()` **giữ nguyên đường lùi** (ổ đĩa chỉ-đọc vẫn chạy tiếp với cấu hình trong
RAM — chủ ý cũ, không bịt) nhưng **thôi im lặng**, và **phân biệt hai mức nặng nhẹ**:

| Ca | Hậu quả thật | App nói |
|---|---|---|
| `AUTH_SECRET` **vừa sinh**, không persist được | secret mới mỗi lần mở ⇒ **đăng xuất mỗi lần mở app** | *"Bạn sẽ bị đăng xuất mỗi lần mở lại app…"* |
| secret **đọc được từ config.json sẵn có** | đăng nhập vẫn sống, chỉ mất khoá vừa nhập | *"…Đăng nhập vẫn giữ."* |

Đo trên hệ tệp thật (ép `writeFileSync` hỏng bằng `EISDIR`): **không ném lỗi** · **vẫn trả
`AUTH_SECRET`** · **có `cau-hinh.log`** ghi *"AUTH_SECRET vừa sinh, KHÔNG persist được"*. Ca ghi được
thì **không** đẻ log rác.

### M3 — cái gì Hoà phải bấm

**Đã đổi**: bỏ `build.mac.identity: null`, thêm `notarize: false`.

Lý do đọc thẳng mã electron-builder 25, **không đoán** — `app-builder-lib/out/macPackager.js:183-188`:
`identity === null` làm nó **thoát ngay và bỏ hẳn khâu ký, KỂ CẢ khi máy có chứng chỉ hợp lệ**. Đó là
**bẫy hẹn giờ**: ngày mua chứng chỉ về, bản dựng vẫn không ký mà không báo gì. Bỏ dòng đó **không làm
gãy bản dựng hiện tại** (`:202-212` + `codeSign/macCodeSign.js:77-82`: không có chứng chỉ thì cảnh
báo rồi chạy tiếp, chỉ ném khi bật `forceCodeSigning` — mặc định tắt).

🔴 **Cổng 7 trên macOS VẪN CHƯA QUA ĐƯỢC, và không lách được bằng cấu hình.** Việc phải bấm:
1. **Apple Developer Program** (có phí năm) → xin **Developer ID Application**.
2. Cài chứng chỉ vào Keychain máy dựng ⇒ từ đó `electron:build:mac` **tự ký**, không phải sửa mã.
3. Muốn qua trọn cổng máy sạch thì bật **notarize** + 3 biến môi trường `APPLE_ID` ·
   `APPLE_APP_SPECIFIC_PASSWORD` · `APPLE_TEAM_ID`. Để `false` là **cố ý** — bật mà thiếu khoá thì
   bản dựng gãy giữa chừng, còn bật im lặng lại là một cái bẫy khác.

⚖️ **Hoặc chốt Windows là đích duy nhất của G5** — khi đó `identity` không chặn gì. **Quyết định sản
phẩm, lane 07 không tự quyết.** Đường tạm nội bộ `xattr -dr com.apple.quarantine …` có ghi ở G5 §B6,
kèm khai rõ nó **không phải đường phát hành**.

---

## 3 · CỔNG 6 — dựng gói lần đầu, biến số thành con số

| Bước | rc | Thời gian | Kết quả |
|---|---|---|---|
| `npx next build` | **0** | **116 s** | `.next` = **823 MB** |
| `npx electron-builder --linux appimage` | **0** | **58 s** | AppImage **338 MB** · unpacked **1,2 GB** |

**Cấu hình `electron-builder` CHẠY ĐƯỢC** — câu hỏi lớn nhất của cổng 6 đóng. `asar:false` + gói
nguyên `node_modules` không gãy; `@electron/rebuild` xong; tổng ~**3 phút**, xa dưới trần 12 phút.
Nhị phân Electron **đã có sẵn trong cache từ `npm ci`** (102 MB) và hai lượt tải còn lại **qua được
proxy** ⇒ rủi ro mạng mà khảo sát lo **không xảy ra**.

**Ba số đáng nhớ:**
- `.next` **823 MB trên đĩa → 46 MB vào gói** ⇒ luật `!.next/cache/**` **chạy đúng**; cache chiếm ~94%.
- Sản phẩm dựng **không lọt vào git** — `dist-installer/` đã chặn (`.gitignore:18`), `git status` sạch.
- 🔴 **Engine Prisma nhân bản: 7 tệp / 109 MB**, cùng một engine nằm 2-3 chỗ. Hai luật loại trừ
  `!node_modules/.prisma/client/libquery_engine-linux-*` và `!node_modules/@prisma/engines/*linux*`
  **không có tác dụng** vì `extraResources` chép nguyên `node_modules/.prisma` **độc lập với bộ lọc
  `files`** — loại ở cửa trước, vào bằng cửa sau. **Chưa sửa, cố ý**: đường đó nhiều khả năng đang giữ
  cho bản Windows chạy được, và đây là **chuyện dung lượng, không phải đúng-sai**.

⚠️ AppImage này **không phải sản phẩm giao được** (Linux không nằm trong `build`). Cảnh báo *"asar
usage is disabled"* ×2 là **chủ ý** của IF, không phải lỗi mới. **Cổng 7 vẫn trống** — dựng được gói
không phải là mở được gói.

---

## 4 · Máy kiểm

| | rc |
|---|---|
| `npx tsc --noEmit` | **0** |
| `npm test` | **0** |
| `npm run release:preflight` | **0** |
| `electron/nang-cap-csdl.test.ts` | **0** — 24 ok, 0 fail |

> ⚠️ **`npm test` lần đầu ra rc=123** — `xargs` trả 123 khi có lệnh con lỗi. Nguyên nhân **không phải
> thay đổi của lượt này**: worktree **chưa có `.env`** nên các test chạm Prisma ném
> *"Environment variable not found: DATABASE_URL"*. Dựng môi trường bằng đúng đường repo đã có
> (`bash scripts/dung-moi-truong-kiem.sh`) rồi chạy lại ⇒ **rc=0**. Ghi lại vì con số 123 rất dễ bị
> đọc nhầm thành "lượt này làm hỏng test".
>
> **Kỷ luật đã áp**: không chỗ nào dùng `lệnh | tail; echo $?` (nó bắt mã thoát của `tail` — đã gây
> một lần báo xanh giả). Mọi lệnh ghi ra tệp rồi mới đọc; script cổng 6 đặt `set -o pipefail` và lấy
> mã thoát trực tiếp.

---

## 5 · CHƯA CHẮC · CHƯA KIỂM

- **Chưa MỞ một bộ cài nào.** Cổng 6 mở, **cổng 7 vẫn trống**. Mọi kết luận về **M3** là **đọc mã
  electron-builder + đọc cấu hình**, chưa quan sát trên máy Mac thật. Không có máy Mac/Windows trong
  môi trường này.
- **M1 đo trên SQLite/Linux.** Đường dẫn Windows kiểu `file:C:\…` cho `migrate diff --from-url`
  **chưa chạy thử trên Windows thật**. Và `migrate resolve` chạy **tuần tự 6 lượt** nên lần khởi động
  đầu của CSDL cũ **sẽ chậm hơn** — **chưa ai đo** con số đó.
- **M5 mới kiểm được MỘT nhánh.** Ca *"secret vừa sinh, ghi hỏng"* đã đo thật; nhánh *"secret cũ đọc
  được, chỉ ghi hỏng"* **chưa dựng được ca thử** (cần đọc thành công + ghi thất bại trên cùng đường
  dẫn) — mới đọc mã.
- **Hộp thoại `dialog.showErrorBox` của M5 chưa thấy bằng mắt** — ngoài Electron thì `dialog` là
  `undefined` nên nhánh đó bị guard bỏ qua. Chỉ chứng minh được phần **log** và phần **không ném lỗi**.
- **`raSoatSqlBacCau` là bộ lọc theo mẫu chữ.** Nó bắt được 4 ca thật đã hiệu chuẩn, nhưng **không
  phải bộ phân tích SQL** — một dạng SQL phá huỷ mà Prisma chưa từng sinh ra trong 4 ca đó thì có thể
  lọt. Chặn cuối vẫn là **snapshot trước nâng cấp**, không phải bộ lọc này.
- **Không đọc hết `electron/main.js`.** Đã đọc trọn: khởi động · đường ghi · snapshot · config ·
  nâng cấp CSDL · spawn server · vòng đời · dọn dẹp. Vùng menu đọc lướt.
- **AppImage dựng ra chưa ai chạy thử** — nó không phải nền tảng đích, dựng chỉ để kiểm cấu hình.
- **Con số 109 MB engine là đo trên bản Linux.** Bản Windows/macOS **có thể khác** (binaryTargets khác);
  chưa đo.
- `dist-installer/` (1,2 GB) và `.next` (823 MB) **còn nằm trên đĩa worktree** — đều gitignore, đều
  dựng lại được, cố ý không xoá để khỏi giẫm chân lane khác. Đĩa còn 21 GB.

---

## 6 · Còn mở, xếp theo mức chặn

| # | Việc | Ai |
|---|---|---|
| 1 | **Cổng 7** — mở bộ cài trên máy sạch, đúng nền tảng đích | cần **máy thật** |
| 2 | **M3** — mua Developer ID, **hoặc** chốt Windows là đích duy nhất của G5 | **Hoà** (quyết định sản phẩm) |
| 3 | **M4** — vòng đời hỗ trợ Electron 33 | một lượt tra + ghi kết luận |
| 4 | **M6** — cổng GPL/DWG (`licenseNotes` UNRESOLVED) | **Hoà**, trước phát hành |
| 5 | Engine Prisma nhân bản 109 MB (`extraResources` phá bộ lọc `files`) | việc riêng, phải đo trên bản Win/macOS trước |
| 6 | Nối cổng 6 vào CI (nay mới là chạy tay một lần) | lane 07 |
| 7 | Đổi tên `db-push.log` → tên đúng nghĩa, **cùng lượt** với 4 tài liệu đang trỏ vào nó | lane sở hữu 4 tài liệu đó |
