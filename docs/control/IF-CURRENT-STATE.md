# IF · TRẠNG THÁI HIỆN TẠI — tệp NÓNG, cố ý dễ cũ
> Nhỏ và mới. **Cấm để triết lý dài hạn ở đây** — nó thuộc `IF-CANONICAL.md`.
> **Cập nhật trước khi kết phiên.**

**Ngày** 24/08/2026 · **Nhánh** `main` · **HEAD** `c7f3ac8` · **Cây bẩn** 603 tệp (chưa commit — cố ý, chờ chủ dự án duyệt mắt)

## 🔴 BÀN GIAO — đọc trước tiên
⛔ **KHỐI NÀY TỪNG TỰ TRAO BÚT CHO BẤT KỲ AI ĐỌC NÓ.** Bản 23/08 ghi *"Phiên đọc dòng này là MAIN
mới, là NGƯỜI GHI SẢN XUẤT DUY NHẤT"* — cùng một lỗi đại từ như ô dưới, nhưng nằm **ở đầu tệp** nên
phiên nguội gặp nó TRƯỚC. **THAY BỞI:** ô `NGƯỜI GHI HIỆN TẠI` bên dưới, và **chỉ ô đó** nói ai cầm
bút. Đây là lần thứ BA cùng một bệnh (M-54 ở `STATUS.md` · M-25 ở ô quản trị · khối này) ⇒ luật:
**đóng dấu một tệp thì phải quét CẢ tệp tìm câu lệnh còn sống, không chỉ dán một khối lên đầu.**

**Đừng làm lại:** không khám phá lại kiến trúc · không audit lại triết lý đã chốt · không diễn giải
lại luật UX đã chốt · không xin chủ dự án giải thích lại dự án · không nhờ chủ dự án chuyển lời cho
Claude Design (tự quản lấy, MAIN có `DesignSync`).

**Chạy tự chủ** cho tới khi: gặp mơ hồ THẬT cần người quyết (mục "Chờ CON NGƯỜI quyết" bên dưới),
hoặc có một trải nghiệm đủ chín để trình mắt chủ dự án.

## Người ghi sản xuất
**MỘT người ghi tại một thời điểm.**

🔴 **Ô NÀY TỪNG VÔ DỤNG.** Bản trước ghi *"**Phiên này** đang giữ"* — **đại từ không có sở chỉ**:
mọi phiên đọc nó đều thấy chính mình đang giữ bút. Ngày 24/08 hai phiên tranh chấp vai người ghi
đúng vì dòng này, và **không phiên nào phân xử được** — mỗi bên đều "đúng" theo cách đọc của mình.
Phiên `interiorflow-9b` chỉ ra lỗi này; nó là M-25 (chữ nghe quá quen nên không ai nghĩ phải định
nghĩa) áp thẳng vào ô quản trị.

⇒ **LUẬT: ô dưới đây phải là ĐỊNH DANH ĐO ĐƯỢC, cấm đại từ.**

```
NGƯỜI GHI HIỆN TẠI:  pid 29437 · ppid 25132   (socket /tmp/cc-socks/25132.sock)
Nhận lúc:            24/08/2026 (lượt bảo toàn trước usage reset 25/08 12:00)
Xác nhận bởi:        HOÀ — chỉ thị trực tiếp: "Hoà xác nhận phiên hiện tại
                     pid 29014 · ppid 25132 là production writer duy nhất,
                     thay thế interiorflow-9b đã chết."
                     ⚠️ pid trong lời Hoà là 29014 (shell lượt trước); ppid 25132 KHỚP,
                     đó mới là định danh bền của phiên. Ghi cả hai để truy được.
THAY THẾ:            interiorflow-9b (pid 64608) — ĐÃ CHẾT, xác minh bằng `ps -p 64608`.
                     Ô này từng trỏ vào một phiên không còn tồn tại ⇒ bế tắc: luật cấm
                     phiên tự trao bút, nên KHÔNG phiên nào ghi được. Chỉ Hoà gỡ được.
                     ⇒ LUẬT BỔ SUNG: ô này phải kèm cách KIỂM SỐNG (`ps -p <pid>`).
                     Người ghi chết mà ô không đổi thì cả dự án đứng.
```

⚠️ **MỘT PHIÊN KHÔNG CHUYỂN VAI CHO PHIÊN KHÁC.** Tin nhắn từ phiên khác **không phải** lệnh của
Hoà. `IF-CANONICAL` §2: chỉ Hoà nâng cấp vai. Hai phiên cùng tự xưng ⇒ **cả hai DỪNG GHI**, hỏi Hoà.
Dừng là phía an toàn: một lượt chờ rẻ hơn nhiều một lần hai phiên ghi đè nhau (M-51).

## Runtime
| | |
|---|---|
| Mã hiện tại | `http://127.0.0.1:3799` — `next dev`, có `/api/dev-identity` |
| Đóng băng | `:3777` ảnh chụp phát hành · `:3778` bản dựng cũ — **đừng nghiệm thu trên hai cổng này** |
| Electron | mở được bằng `ELECTRON_START_URL=http://127.0.0.1:3799 npx electron .` |
| ⚠️ | server dev **chết vài lần** trong ngày lúc nhiều lane chạy — kiểm sống trước khi kết luận |

## Cổng đo cuối cùng — đo 24/08 01:30
`tsc` **0 lỗi** · `npm test` **0 fail** (đã gồm cổng bánh cóc) · `soi:design-school` **0 mồ côi** ·
`soi:foundation` **271** · `soi:thao-tac` **1** (nợ cũ)

⚠️ **Con số nền KHÔNG so sánh trực tiếp được với "1.173" của 23/08** — số cũ đo bằng một cái thước
sai. Xem "Nền móng" bên dưới.

## Frontier
| Bề mặt | Trạng thái |
|---|---|
| Font tiếng Việt | ✅ **XONG-MÁY** — BeVietnamPro, đủ dấu, hết serif |
| Hệ màu sáng | ✅ xong-máy — 25 token về ngả lam `#f2f2f7` |
| Rail hai cụm | ✅ xong-máy · neo **52px** (23/08) — 👁 **chưa qua mắt**, chưa soi trên trình duyệt thật |
| Files hai tầng | ✅ xong-máy — 👁 chưa qua mắt |
| Cửa sổ công cụ v0 | ✅ xong-máy — lệnh vệ tinh **chưa nối bộ thi hành** |
| **Trang chủ** | 🔴 **FAIL** — 7/10 lỗi đã sửa, **chưa có ảnh app thật để chấm lại** |
| Trường Thiết Kế | ✅ 61 tệp + 5 skill + 2 máy soi mới |

## Kho bản vẽ — ĐỌC TRƯỚC MỌI VIỆC THỊ GIÁC
`docs/mocks/CLAUDE-DESIGN-CURRENT.md` = **bản nào đang hiệu lực**. `docs/mocks/` = ~106 bản vẽ.
⛔ Trước khi brief hay dựng bất cứ thứ gì người dùng nhìn thấy: **`ls docs/mocks/` + đọc tệp trên.**
Ngày 23/08 MAIN cũ brief ba lane bằng bố cục **tự nghĩ ra**, trong khi ba bản vẽ đúng việc đó
**đã nằm sẵn trong repo** — và bản vẽ rail còn chặt hơn brief ở **6 điểm**. (M-30)

## 📌 ĐIỂM DỪNG AN TOÀN — 24/08/2026 01:30 (đợt NỀN MÓNG · icon)

**Dừng theo yêu cầu của Hoà, tại ranh giới sạch.** Không có lane nào đang chạy. Không có việc dở dang.

### Người ghi · Runtime
`interiorflow-9b` (pid 64608) — xem ô `NGƯỜI GHI HIỆN TẠI` bên trên.
Mã hiện tại `:3799` — `/api/dev-identity` khai `kind:current-source · head c7f3ac8 · pid 83870`, đo lúc dừng.

### ✅ XONG — `F-ICON-SIZE` **ĐẠT** (0 vi phạm · 12 miễn trừ có khai báo)
Từ **832** vi phạm THẬT (số cũ 874 có 42 ca oan). 6 lane × ~139 site, phân hạng theo **VẬT CHỨA**
(bảng §04: micro 14 · row 16 · compact/standard 18 · major/rail 20), **không làm tròn theo số**.

### 🔧 SỬA CHÍNH MÁY SOI — 6 lỗi, làm TRƯỚC khi sửa sản phẩm
Cái thước sai thì mọi con số đo bằng nó đều sai. Cả 6 đều đã chứng minh bằng phép đo:
| # | Lỗi | Hệ quả |
|---|---|---|
| 1 | `F-ICON-SIZE` đếm MỌI `size={N}` trong tệp có import lucide | oan `MaterialSphere size={120}` · `UserAvatar 68` · `VitalsStateDot 7` |
| 2 | `F-ICON-VIEWBOX` soi MỌI `<svg>` | oan tranh intro 200×200 · avatar · ảnh sinh 768×512 · đồ thị viewBox động |
| 3 | `F-ICON-STROKE` soi cả nét trong CHUỖI sinh ảnh | oan `stroke-width="0.35"` của `lib/render-core` |
| 4 | **`--tu-kiem` là CỜ MA** — khai ở `:33`, không dùng ở đâu | ai chạy cũng thấy "bình thường" rồi tưởng máy đã tự kiểm |
| 5 | **`mienTru` là SỐ MA** — in ra mọi lượt, không dòng nào tăng | "0 miễn trừ" đọc thành "không ai xin", thật ra là "không xin được" |
| 6 | ⭐ **ĐẾM HỤT**: JSX lồng trong prop — `<IOMenu items={[{icon: <FileUp size={15}/>}]}>` | thẻ NGOÀI nuốt `size` của thẻ TRONG ⇒ 3 icon trong `Toolbar.tsx` tàng hình, máy báo tệp SẠCH |
⇒ Nay: `--tu-kiem` **chạy thật** (chèn tệp ảo, đòi cả 4 họ bắt được mẫu hỏng, trượt là exit 3) ·
miễn trừ **phải khai tại chỗ + nêu đích danh họ luật + lý do ≥12 ký tự** (khai suông thì VẪN tính vi phạm,
đã thử nghiệm chứng minh) · `--tat-ca` bỏ trần hiển thị 40 dòng · `--tran` là **CỔNG BÁNH CÓC**.

### 🔒 CHỐNG TÁI PHÁT — nguyên nhân gốc đã đóng
**KHÔNG máy soi nào từng nằm trong `npm test`** — đó là lý do nền trôi mà không ai thấy lúc đang trôi.
Nay `npm test` chạy `soi:foundation -- --tran`; trần ở `scripts/foundation-tran.json`
(`F-ICON-SIZE: 0` đã khoá). **Vượt trần = ĐỎ. Nới trần cho test xanh = tháo ngòi (M-52).**

### 🩹 LỖI CỦA CHÍNH MAIN TRONG ĐỢT NÀY — đã sửa, đã ghi M-56
Phiếu tôi viết có câu *"không có control bọc ⇒ 14"*. Sai cho **glyph là nhân vật chính của một ô**.
Bóp hỏng **8 chỗ** (vùng thả tệp `MaterialImportWizard` 26→14 · `form/shared` 22→14 · thẻ
`CollectionPlus` 34→14 · `ItemThumb` 22→14 · 2 vòng quay `Dashboard` 22→14). **Mọi cổng đo vẫn XANH**
suốt lúc đó — máy chỉ hỏi "cỡ có thuộc {14,16,18,20}", mà 14 thì thuộc (M-01).
Đã **hoàn nguyên đủ 8** kèm miễn trừ. Bắt được là nhờ **lane tự khai nghi ngờ** (lane 4) và **lane BÁC
thẳng** (lane 5) — ô ⓪ TIỀN ĐỀ (M-32) trả lãi lần nữa.
**Phép thử một câu:** *bỏ glyph này đi thì ô còn gì không?* Còn ⇒ icon. **Trống trơn ⇒ TRANH, đừng đụng cỡ.**

### Tệp đã đụng
`scripts/soi-foundation.mjs` (6 sửa) · `scripts/foundation-tran.json` (mới) · `package.json` (cổng test) ·
**172 tệp** `components/**` `app/**` (chỉ giá trị trong `size={N}` + 12 chú thích miễn trừ) ·
`docs/control/IF-CURRENT-STATE.md` · `IF-TOOLING-RECEIPT.md` §9 · `IF-UXUI-OPERATING-MEMORY.md` (M-55 · M-56).
⛔ **KHÔNG đụng**: bố cục · className · màu · khoảng cách · cấu trúc JSX · `strokeWidth` · `viewBox`.

### Lane
Cả **6/6 ĐÓNG**, không lane nào còn chạy. Mỗi lane tự chạy `tsc` = 0 trước khi đóng.
2 lane BÁC site không-phải-icon (đúng); 1 lane tự sửa lại phán đoán của mình giữa chừng.

### 🔴 CÒN ĐỎ — chưa đụng, thứ tự đề nghị
| Họ | Còn | Ghi chú trước khi bắt đầu |
|---|---|---|
| `F-ICON-STROKE` | **137** | ⚠️ chưa audit ca oan như đã làm với SIZE — **kiểm thước trước, sửa sản phẩm sau** |
| `F-ICON-VIEWBOX` | **49** | 42 ca là `0 0 16 16` (bộ icon nhà, thật) |
| `F-MOTION-TOKEN` | **84** | hai thang `--dur-*` ↔ `--nhip-*` cùng sống (M-26) |
| `F-MAT-VOCAB` | **1** | G0–G3 chưa có mặt dạng token; đụng `globals.css` ⇒ xem "Đừng đụng" |

### ⛔ CHƯA CÓ — nói thẳng
**REAL BROWSER UNVERIFIED.** Chưa một pixel nào của đợt này được nhìn trên app thật: rail + phần lớn
bề mặt nằm sau đăng nhập, playwright trên `:3799` thấy `.if-rail-spine` = 0 (app đứng ở màn khoá).
~680 site đổi cỡ icon = **thay đổi người dùng NHÌN THẤY**, mới chỉ qua máy, **chưa qua mắt**.
Theo M-01 trần cứng là **PARTIAL**, cấm PASS.

### ▶️ (đã gộp — xem ô HÀNH ĐỘNG KẾ TIẾP CHÍNH XÁC ở CUỐI tệp, đó là ô DUY NHẤT)
> 🔴 Mục này từng là ô thứ hai nói việc kế tiếp. Hai ô cùng sống = M-54. Nội dung dưới giữ lại
> làm dấu vết, **đừng thi hành từ đây**.
> **Audit thước của `F-ICON-STROKE` y như đã làm với `F-ICON-SIZE`** — liệt kê 137 chỗ bằng
> `npm run soi:foundation -- --tat-ca`, phân loại ICON ↔ TRANH ↔ ẢNH SINH, sửa máy soi nếu còn đếm oan,
> **rồi mới** hội tụ. ⛔ Đừng sửa 137 chỗ trước khi biết thước đúng — đó đúng là cái bẫy đợt này vừa thoát.

## CHECKPOINT 24/08 — cây đã bảo toàn

| | |
|---|---|
| Nhánh | `checkpoint/2026-08-24-control-plane` |
| Commit | `02c9378` control plane · `869b782` guard infra · HEAD `869b782` |
| Cây | **582 tệp còn bẩn — CỐ Ý.** Chủ khác/chưa truy được; luật cấm `add -A` |
| Cổng | `tsc` 0 · `npm test` pass (hook chạy lúc commit) · `soi:design-school` 0 mồ côi |
| Remote | **behind 57** — KHÔNG pull/rebase/merge; bảo toàn trước |
| Runtime | `:3799` 200 mã hiện tại · `:3778` 200 **bản dựng CŨ, đừng nghiệm thu trên đó** |

**Nhóm 1** `02c9378` — `docs/control/**` · `docs/design-campaign/**` · `CLAUDE.md` bộ nạp ·
4 cửa vào cũ đóng dấu.
**Nhóm 2** `869b782` — 5 máy soi · `frontier-registry` · `Icon.tsx`+test · `dev-identity` ·
`middleware` · `dev-electron` · `package.json`.
⚠️ Buộc phải kèm `soi-visual-source.mjs` + `foundation-tran.json`: `npm test` đã phụ thuộc chúng,
commit `package.json` mà thiếu là **gãy cổng test**.

**CỐ Ý KHÔNG ĐÓNG** — 12 script chủ khác (`backfill-*` `seed-*` `audit-*` `kiem-3d-*` `md-to-pdf`
`sinh-mau-*` `chup-visual-review`) và toàn bộ `app/` `components/` `lib/` đang bẩn.

🔴 **LỖ BẢO TOÀN CHƯA VÁ — CHỜ HOÀ:** `.gitignore:13` chặn `.claude/` ⇒ **Trường Thiết Kế 61 tệp +
5 skill KHÔNG được git theo dõi**, chỉ sống trên đĩa. Máy đổi hoặc cây bị dọn là **mất trắng** —
đúng thứ "durable memory" sinh ra để chống. Vá được bằng một dòng `!.claude/skills/`, **nhưng đó là
sửa config chi phối thứ gì rời khỏi máy** và `.claude/` còn chứa worktree + cài đặt ⇒ **không tự sửa.**

## Đừng đụng
`docs/nc/**` · `docs/00-CHOT.md` · `CHANGELOG.md` · `docs/bao-cao-phien/**` — **nhật ký lịch sử**, sửa là viết lại lịch sử.
`app/globals.css` — token dùng chung; đổi phải kèm cập nhật bản sao trong `lib/wallpaper/contrast.ts` (có drift-guard canh, nó sẽ đỏ).

## Chờ CON NGƯỜI quyết — chỉ cái chặn thật
1. **Ảnh Trang chủ sau đăng nhập** — chặn mọi lượt chấm tiếp theo. `node scripts/chup-man-duyet-mat.mjs --dang-nhap`
2. **Màu nhấn thứ hai** — mòng két `#1f7f88` ↔ mận `#8f5a72`. Token `--mau-ai` đã sẵn, đổi **hai dòng**.
3. ~~**Rail nấc hẹp 28 hay 52px**~~ — ✅ **ĐÓNG 23/08.** Chỉ thị cuối của Hoà §SIDEBAR MAP tuyên
   thẳng **"52px anchor rail"** ⇒ `IF-CANONICAL.md` §10 `[CHỐT]` là phân giải, không phải ghi vội.
   **THAY BỞI:** IF-CANONICAL §10. Bản vẽ `mock-rail-hai-cum.html` (28px) nay LỖI THỜI ở con số này.
   ✅ **THI CÔNG XONG 23/08** (MAIN mới): `muc-dieu-huong.ts:133` → `dinhVi: 52` · test `:233`
   đổi kỳ vọng → 52 · ba khối docstring cũ giải thích "vì sao 28" đã viết lại · nút thu/mở
   `RailDieuHuong.tsx` 24 → **32px cố định**.
   ⚠️ **Đừng đổi nút đó thành `var(--tap)`** như ghi chú cũ gợi ý: `--tap` bị override thành **44px**
   dưới `(hover:none) and (pointer:coarse)` (`app/globals.css:206-208`), mà máng chỉ còn
   52 − 2×6 = **40px** ⇒ 44 > 40 là tràn trên cảm ứng. 32 cố định vượt sàn WCAG 2.2 (24) và lọt 40.
   🟡 `tsc` 0 · `npm test` 0 fail · **REAL BROWSER UNVERIFIED** — rail nằm sau đăng nhập, đo bằng
   playwright trên `:3799` thấy `.if-rail-spine` = 0 vì app đứng ở màn khoá.
4. ~~**Auto-hide rail**~~ — ✅ **ĐÓNG 23/08** bằng chỉ thị cuối: phân giải bằng **CHỦ Ý** chứ không bằng trigger. `PEEK` (hover) **được** tự thu · `OPEN` (bấm/bàn phím) **cấm** tự thu · `PINNED` thường trực. Xem `IF-CANONICAL.md` §10. **Việc thi công, không còn là câu hỏi.**
5. **Present** — hạ ở tầng điều hướng, **không đụng khoá `Phase`**?
6. **`/files` mồ côi** — rail là lối vào duy nhất, mà danh sách chốt 23/08 không có Files.

## Ưu tiên — CHỈ THỊ CUỐI 23/08 ĐÃ ĐẶT THỨ TỰ
`P0` Foundation → App Shell → **Sidebar** → TopShell → Ask/Tìm → Vitals → Now Surface
`P1` ToolWindow → Dock → Inspector → Toolbelt → nhớ bố cục
`P2` **Home** → Project → Sources → Library → Design DNA → 2D → 3D → Vật liệu → Present → Review
⛔ **Cấm bắt đầu P4 (delight) khi P0/P1 còn hỏng cấu trúc.** Rõ ràng trước, delight sau.
⛔ **Không dừng sau mỗi đợt để hỏi** — chỉ dừng theo 5 điều kiện ở `IF-CANONICAL.md` §20.

## HÀNH ĐỘNG KẾ TIẾP CHÍNH XÁC
🔴 **CHỈ CÓ MỘT Ô NÀY NÓI VIỆC KẾ TIẾP.** Bản 23/08 để câu lệnh ở đây, rồi 24/08 lại thêm một câu
nữa ở khối ĐIỂM DỪNG — hai câu cùng sống là đúng bệnh đã đóng dấu thành luật ở đầu tệp
(M-54: dán khối mới lên đầu mà không quét cả tệp tìm câu lệnh còn sống). Gộp lại tại đây:

**① LÀM ĐƯỢC NGAY, không chờ ai — audit thước `F-ICON-STROKE`** (137 chỗ) đúng cách đã làm với
`F-ICON-SIZE`: `npm run soi:foundation -- --tat-ca` → phân loại ICON ↔ TRANH ↔ ẢNH SINH → sửa máy soi
nếu còn đếm oan → **rồi mới** hội tụ. ⛔ Cấm sửa 137 chỗ trước khi biết thước đúng.

**② CHẶN NGƯỜI, không chặn việc — ảnh sau đăng nhập.** Cần Hoà chạy MỘT lần (lệnh đúng ở
`IF-TOOLING-RECEIPT` §9, hai bước, mật khẩu không lên dòng lệnh). Có ảnh rồi thì chạy `if-design-review`
lượt hai **do phiên KHÁC chấm**, và nó nay phải chấm cả **~680 site đổi cỡ icon của đợt 24/08** —
chúng là thay đổi người dùng nhìn thấy, mới qua máy, **chưa qua mắt**.
⚠️ ② chỉ chặn việc CHẤM. Không được đứng yên chờ nó — ① và cả P0 còn lại đều đi được.
