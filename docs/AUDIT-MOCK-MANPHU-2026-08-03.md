# AUDIT A4 — 7 MOCK MÀN PHỤ (COWORK-UI · 03/08/2026)

**Phạm vi:** `docs/mocks/mock-if-{du-an,cai-dat,tep,thu-vien,anh-dai-dien,bang-nut,nut-tong}.html`
**Cách đo:** mọi con số dưới đây từ `grep -c` / `grep -o | wc -l` chạy thật trên file, không đo bằng mắt (§0 · §6c-N2).
**Chuẩn đối chiếu:** `app/globals.css` (đọc trực tiếp, không tin CSS trong mock) · `docs/CHOT-TEN-CHANG-MODE-2026-08-03.md` (bộ tên **2D Kỹ thuật · 3D Thiết kế · Trình bày**) · `SO-KIEM-TONG.md` §6 (17 luật thực chiến).
**KHÔNG sửa file mock** (đúng lệnh). KHÔNG chạy git.

---

## 0 · PHÁT HIỆN CHẶN TRƯỚC MỌI TIÊU CHÍ

### 0.1 · 4/7 file BỊ CẮT CỤT — không phải mock hoàn chỉnh
`ls -la` + `wc -l` + đọc đuôi file:

| File | Dòng | Đóng `</x-dc>` ở dòng | Cắt giữa chỗ nào |
|---|---|---|---|
| `mock-if-du-an.html` | **22** (572 byte) | 20 | giữa dòng token: `--t3:#9e` ← đứt ngay giữa mã màu |
| `mock-if-cai-dat.html` | **26** (904 byte) | 24 | giữa `--hatch:repeating-linear-gradient(45deg,#202024` |
| `mock-if-anh-dai-dien.html` | **60** (3 383 byte) | 58 | hết CSS + header, **rỗng ruột** — chỉ còn khung lưới chấm, không có một ô avatar nào |
| `mock-if-thu-vien.html` | **545** (56 624 byte) | 543 | giữa lưới khối: kết thúc sau card "Sofa ba chỗ", **thiếu cả khối `<script>` cuối** |

3 file còn lại (`tep` 783 dòng · `bang-nut` 562 · `nut-tong` 513) có đủ `</script>` đóng → hoàn chỉnh.

⇒ **`du-an` · `cai-dat` KHÔNG PHẢI MOCK** — chỉ có ~15 dòng CSS token, 0 dòng giao diện. Không audit A4 được nội dung. `anh-dai-dien` có header + khung nhưng 0 nội dung. `thu-vien` mất phần đuôi + script.

### 0.2 · `support.js` KHÔNG TỒN TẠI — cả 7 file phụ thuộc vào nó
```
$ ls docs/mocks/support.js  → No such file or directory
$ grep -l 'support.js' docs/mocks/*.html | wc -l  → 16
```
Cả 7 file mở bằng `<script src="./support.js">`. Không có file này thì:
- nút đổi theme (`{{ toggleTheme }}`) **không chạy** — mở bằng trình duyệt chỉ thấy chữ `{{ themeLabel }}`;
- thuộc tính `style-hover="..."` (52 chỗ ở `tep`, 34 `thu-vien`, 24 `nut-tong`, 21 `bang-nut`) **không có tác dụng** — mọi trạng thái hover chết;
- `{{ project }}` in ra nguyên văn dấu ngoặc.

⇒ Tiêu chí 3 "đủ 2 theme" ở 5 file có markup: **có ĐỦ khai báo CSS 2 theme, nhưng KHÔNG CHUYỂN ĐƯỢC** — chưa VERIFY được bằng mắt. Đây là lỗi hạ tầng chung của 16 mock export từ Claude Design, không riêng 7 file này.

---

## 1 · BẢNG TỔNG — mỗi ô là số đo thật

| # | Mock | Dòng | Hex TTT cấm (4 mã) | `var(--` | Hex tự chế NGOÀI `:root` | 2 theme (khối CSS) | Nhãn chặng CŨ | Khung 6 ổ 42/214/236/26 | PLACEHOLDER | `6a57f5` | Accent thứ hai |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `mock-if-du-an` | 22 | **0** | **0** | 11 (đều trong khối token cụt) | ❌ chỉ có `dark`, cắt trước `light` | 0 | ❌ 0/4 | **0** | 1 | — |
| 2 | `mock-if-cai-dat` | 26 | **0** | **0** | 18 (đều trong khối token cụt) | ❌ chỉ có `dark`, cắt trước `light` | 0 | ❌ 0/4 | **0** | 1 | — |
| 3 | `mock-if-tep` | 783 | **0** | **649** | **9** (8 trùng token · 1 minh hoạ) | ✅ dark + light | 0 | ✅ 4/4 (×4 trạng thái, dòng 64·346·537·623) | **7** | 1 | `#c79a63` = `--accent-warm` ✔ |
| 4 | `mock-if-thu-vien` | 545 | **0** | **407** | **51** (22 trùng token · 29 minh hoạ vật liệu) | ✅ dark + light | 0 | ⚠️ 214/236 có (dòng 343), thiếu 42/26 | **3** | 1 | `#c79a63` ✔ + `#e0b884/#7d5f3c/#c9a274` (biến thể) |
| 5 | `mock-if-anh-dai-dien` | 60 | **0** | **19** | **0** | ✅ dark + light | 0 | ❌ 0/4 (không phải màn trong khung) | **1** | 1 | — |
| 6 | `mock-if-bang-nut` | 562 | **0** | **465** | **9** (7 trùng token · 2 minh hoạ) | ✅ dark + light | 0 (7 lần "Dựng ảnh" = **tên NODE**, xem §2.1) | ✅ 4/4 (dòng 68) | **6** | 2 | `#e0b884 #8a6a44` (biến thể warm) |
| 7 | `mock-if-nut-tong` | 513 | **0** | **447** | **17** (11 trùng token · 6 minh hoạ) | ✅ dark + light | 0 (5 lần "Dựng ảnh" = tên NODE) | ⚠️ chỉ 236px (dòng 67·285·391), **0 lần 42px**, không có ổ header/status | **6** | 2 | `#e0b884 #8a6a44` |

**Lệnh đã chạy cho cột "Hex TTT":** `grep -oic '#F06020|#002850|#1B1512|#F1ECE3'` — cả 4 mã, cả 7 file = **0**. Sạch tuyệt đối, không file nào dính màu TTT.

---

## 2 · KIỂM THEO §6 (luật thực chiến)

### 2.1 · Nhãn chặng — ĐẠT (0 nhãn cũ), nhưng 12 khớp là DƯƠNG TÍNH GIẢ
`grep 'Dựng ảnh' `: `bang-nut` = 7 (dòng 115·238·282·369·393·427·528) · `nut-tong` = 5 (dòng 114·185·248·255·454).
Đọc từng dòng: **tất cả đều là tên NODE trong bảng nút** (`<span>Dựng ảnh</span>` bên trong card node), hoặc nội dung câu lệnh người dùng gõ (`nut-tong:185` = "Dựng ảnh phòng khách theo lối Bắc Âu ấm"). Theo `SPEC-NGON-NGU-CHI-DAN §6.4` (tên khối/chức năng ≠ tên chặng) → **GIỮ NGUYÊN, không sửa**. Tiền lệ y hệt đã ghi ở `README-mocks.md` cho `mock-if-3chang:376·464·661`.

Bộ chuyển chặng thật (header hẹp) trong `tep:73-75` · `thu-vien:72-74` · `bang-nut:78-80` là **`2D` · `3D` · `Trình bày`** — ĐÚNG biến thể hẹp đã chốt. `Rendering` = `Presenting` = `CAD ·` = `>Vẽ<` = **0** ở cả 7 file.
⚠️ `nut-tong` **không có bộ chuyển chặng nào** (0 lần "Trình bày") — là mock chi tiết, không phải màn trong khung.

### 2.2 · G4 (chữ Việt bị cắt dấu) — 162 chỗ vi phạm tinh thần luật
`grep 'text-\['` = **0/7 file** — các mock này dùng inline style, không dùng Tailwind, nên luật G4 **theo chữ** không áp được.
**Nhưng cùng một cơ chế lỗi có mặt dưới dạng khác:** cú pháp rút gọn `font: <weight> <size> <family>` **đặt lại `line-height` về `normal` (~1.2)** — đúng cái gây cắt dấu tiếng Việt mà G4 sinh ra để chặn. `line-height:1.5` khai ở container gốc bị shorthand này ghi đè.

| File | Số `font:` rút gọn KHÔNG có `/line-height` | Mẫu nhiều nhất |
|---|---|---|
| `mock-if-tep` | **76** | `font:400 10px ui-monospace,Menlo,monospace` ×20 · `font:400 12px inherit` ×12 |
| `mock-if-thu-vien` | **44** | `font:400 10px ui-monospace…` ×12 · `font:600 12px inherit` ×8 |
| `mock-if-bang-nut` | **24** | `font:600 11px ui-monospace…` ×5 |
| `mock-if-nut-tong` | **17** | `font:600 12px inherit` ×5 |
| `mock-if-anh-dai-dien` | **1** | `font:600 12px inherit` (nút đổi theme) |
| `du-an` · `cai-dat` | 0 | (không có ruột) |

**Phải sửa thành:** `font:400 12px/1.5 inherit` · `font:600 11px/1.5 ui-monospace,Menlo,monospace` — thêm `/1.5` vào **mọi** shorthand. Chỗ nguy nhất là mono 9-10px ở `tep` (nhãn dung lượng/ngày) và badge `PLACEHOLDER` 9px.
Ghi nhận: `font-size:Npx` đứng riêng (163 chỗ ở `tep`) **KHÔNG lỗi** — `line-height:1.5` không đơn vị ở container được kế thừa và tính lại theo cỡ chữ con. Chỉ shorthand mới nguy.

### 2.3 · G2 (lớp nổi phải có nền đặc ≥92%) — 🔴 VI PHẠM Ở CẢ 4 FILE CÓ KÍNH
Token thật `app/globals.css:93-94,129-130`: `--mat-panel: rgba(20,20,23,0.68)` / `--mat-card: rgba(26,26,30,0.82)`.
Token trong mock (đo tại chỗ):

| File | dòng | `--mat-panel` | `--mat-card` | Khớp globals? |
|---|---|---|---|---|
| `tep` | 20 · 29 | `.68` / `.7` | `.82` / `.82` | ✅ khớp |
| `thu-vien` | 21 · 30 | **`.78` / `.82`** | `.82` / `.82` | ❌ tự nâng panel |
| `bang-nut` | 21 · 30 | `.68` / `.7` | **`.62` / `.66`** | ❌ tự **hạ** card |
| `nut-tong` | 21 · 31 | **`.72` / `.78`** | **`.62` / `.66`** | ❌ lệch cả hai |
| `anh-dai-dien` · `cai-dat` | 16·… | `.82` / `.86` | (không khai) | ❌ lệch |

**Các lớp NỔI vi phạm ≥92% (liệt kê chính xác):**
- 🔴 `mock-if-nut-tong.html:165` — **modal "Gom thành nút tổng"** rộng 760px, `background:var(--mat-panel)` = **72%** tối / 78% sáng. Đây đúng ca bệnh popover Vitals: modal dày chữ nổi trên bảng nút dày chữ. Trong modal còn 4 dòng `opacity:.5` (dòng 226·240·254·261) với chữ `--t3`/`--t4` → tương phản thực tế = 0.5 × (chữ t4 trên nền 72%). **Phải sửa:** dùng nền `--panel` đặc 96% (kiểu `.vitals-pop` `globals.css:617`) + `--border-strong` + `--shadow-pop`; giữ blur làm gia vị. Dòng mờ đổi từ `opacity:.5` sang `color:var(--t4)` + icon khoá, KHÔNG hạ opacity cả hàng.
- 🔴 `mock-if-thu-vien.html:92` — **tấm Thư viện** cao 722px, `--mat-panel` **78%**, blur 40px. Tấm này che nửa màn làm việc → nền sau là canvas/bảng nút. **Phải sửa:** ≥92%.
- 🟡 `mock-if-tep.html:701` — popover 320px góc phải dưới, `--mat-panel` 68%. **Phải sửa:** ≥92%.
- 🟡 `mock-if-nut-tong.html:120` — dock nổi đáy canvas, `--mat-panel` 72%.
- 🟡 **20 card node** dùng `--mat-card` **62%**: `bang-nut:151·165·183·204·219·235·260·350·366·387·411·424·445·469` (14 chỗ) · `nut-tong:79·87·95·103·111·293·302·349·414·422·430·442·451` (13 chỗ). Card node có chữ (tên node, tham số) nổi trên lưới chấm → 62% là mỏng nhất toàn bộ 7 file. **Phải sửa:** trả về `--mat-card` .82 của globals, hoặc đặc hơn nếu là lớp mang chữ.
- 🟡 `mock-if-bang-nut.html:479` — bảng lệnh nổi 296px, `--mat-panel` 68%.

### 2.4 · G1 (`animate opacity` trên phần tử có `backdrop-filter`) — ✅ ĐẠT 7/7
`grep 'keyframes'`: `bang-nut` có 3 (`bn-spin` = transform · `bn-dash` = stroke-dashoffset · `bn-halo` = box-shadow) · `nut-tong` có 1 (`nt-halo` = box-shadow) · 5 file còn lại = 0.
**Không keyframe nào chạm `opacity`.** Mọi `opacity` trong file đều tĩnh. Không có `animation:` nào gắn trên phần tử có `backdrop-filter` (đối chiếu từng dòng backdrop-filter §2.3 với danh sách `animation:` — không giao nhau). **Không vi phạm G1.**
Ghi chú: `opacity` tĩnh ở `nut-tong:226·240·254·261` nằm **bên trong** khối kính (con), không phải tổ tiên → không tạo backdrop root cô lập. Vấn đề của nó là tương phản (§2.3), không phải G1.

### 2.5 · K4 (cấm icon hoá nút quyết định) — ✅ ĐẠT 7/7
`grep` mọi nút quyết định:
- `tep:320` và `tep:511` — **`Xoá`** là nút CÓ CHỮ (`color:var(--danger)`, `font:600 11px inherit`), cạnh `Tải về` · `Đổi tên` cũng có chữ. ✔
- `bang-nut:317` `Chạy dây chuyền` · `318` `Lưu thành mẫu` — có chữ. ✔
- Nút chỉ-icon tìm được đúng 2 cái, đều là **Đóng** (không phải nút quyết định theo K4): `thu-vien:108` `title="Đóng tấm — Esc"` · `nut-tong:170` `title="Đóng — Esc"` — cả hai có `title` + phím Esc. ✔
- Không có `Gửi` · `Xuất` · `Đăng xuất` nào trong 7 file.

### 2.6 · Token tự chế ngoài `globals.css` (52 biến gốc)
| File | Biến KHÔNG có trong globals.css |
|---|---|
| `tep` | `--hatch` `--ink` |
| `thu-vien` | `--ink` `--scrim` `--swatch-bg` (`--swatch-bg:#3a3a40`) |
| `bang-nut` | `--hatch` `--p-img` `--p-mask` `--p-mat` `--p-num` |
| `nut-tong` | `--hatch` `--p-img` `--p-mask` `--p-mat` `--p-num` `--scrim` |
| `anh-dai-dien` · `cai-dat` | `--scrim` (+`--hatch` ở cai-dat) |
| `du-an` | (cắt cụt trước khi khai) |

4 biến `--p-*` chỉ là **bí danh của token thật**: `--p-img:#6a57f5` = `--accent` · `--p-mask:#d9a34a` = `--warning` · `--p-mat:#46b876` = `--success` · `--p-num:#9e9ea8` = `--t3`. **Phải sửa:** bỏ bí danh, dùng thẳng `var(--accent)` v.v. — nếu không, đổi accent trong globals thì màu cổng node không đổi theo.
`--scrim` `--hatch` `--ink` `--swatch-bg` là biến MỚI hợp lý (chưa có trong globals) → **phải bổ sung vào `globals.css` trước khi port**, đừng để mỗi mock tự định nghĩa một giá trị khác.

### 2.7 · Accent — ✅ không có accent lạ
`6a57f5` xuất hiện 1-2 lần/file, luôn ở `--accent` (và `--p-img`). Các mã ấm `#c79a63` (`tep` ×2 · `thu-vien` ×4) **chính là `--accent-warm` khai ở `globals.css:26`** — hợp lệ về giá trị, nhưng viết cứng thay vì `var(--accent-warm)` → tính vào cột "hex tự chế". `#e0b884 #8a6a44 #7d5f3c #c9a274` là biến thể sáng/tối của accent-warm dùng cho gradient quả cầu vật liệu (minh hoạ, không phải chrome).

### 2.8 · Token cảm ứng (§0c mảng 3) — lệch
`var(--row)`: `tep` 18 · `thu-vien` 12 · `bang-nut` 7 · **`nut-tong` 0** · `anh-dai-dien` 0.
`var(--tap)`: **0/7 file** — không file nào dùng, dù 5 file khai `--tap:32px` trong `:root`.
`nut-tong` viết cứng **19 lần `44px`** (chiều cao dòng) thay vì `var(--row)` → cố định giá trị CẢM ỨNG cho cả desktop; `globals.css:60-69` cho `--row` tự nhảy 28→44 qua `(hover:none) and (pointer:coarse)`. **Phải sửa:** `height:var(--row)`.
`mock-if-cai-dat.html:14` khai `--row:44px` ngay ở `:root` (mặc định) — sai giá trị mặc định (globals = 28px).

### 2.9 · §0c mảng 1 (phím tắt) — thiếu
`<kbd>` = **0/7 file**. `⌘` = 1 lần duy nhất (`bang-nut`). `Esc` = 1 lần ở `thu-vien` + 1 ở `nut-tong` (trong `title` nút đóng). Không mock nào có gợi ý phím trên nút/tooltip, không có lối vào ⌘K. Đây đúng lỗ hổng đã vá cho 2 mock Trình bày đợt 3 — 7 mock này **chưa vá**.

### 2.10 · PLACEHOLDER — đạt ở 5 file có ruột
`tep` 7 · `bang-nut` 6 · `nut-tong` 6 · `thu-vien` 3 · `anh-dai-dien` 1 · `du-an` 0 · `cai-dat` 0 (2 file sau không có ruột nên không tính là trượt).
Badge dán đúng chỗ: tiêu đề trang + từng khối dữ liệu giả (ảnh preview, danh sách tệp, node). ⚠️ Badge dùng `color:var(--t4)` `font-size:9px` trên `var(--field)` → chữ rất mờ; và ở `tep:187·231·684·693` badge nằm trên `var(--mat-card)` (kính) → cộng dồn với lỗi §2.3.

---

## 3 · TỪNG MOCK TRƯỢT — sai ở đâu, sửa thành gì

### 🔴 `mock-if-du-an.html` — KHÔNG AUDIT ĐƯỢC
- **Chỗ:** toàn file, 22 dòng. Dòng 19 đứt giữa `--t3:#9e`, dòng 20 đóng `</x-dc>` ngay.
- **Sửa:** export lại từ Claude Design. Sau khi có file thật, chạy lại toàn bộ bảng §1.
- Chưa có gì để nói về khung 6 ổ · nhãn chặng · G2 · G4 → ghi **CHƯA VERIFY** cho mọi tiêu chí nội dung.

### 🔴 `mock-if-cai-dat.html` — KHÔNG AUDIT ĐƯỢC
- **Chỗ:** 26 dòng, đứt giữa `--hatch:repeating-linear-gradient(45deg,#202024` (dòng 23).
- **Thêm 1 lỗi thấy được ngay ở phần còn sót:** dòng 14 `--row:44px` — sai mặc định (globals `--row:28px`, 44px chỉ bật ở chế độ cảm ứng).
- **Sửa:** export lại + đổi `--row` về 28px.

### 🔴 `mock-if-anh-dai-dien.html` — RỖNG RUỘT
- **Chỗ:** dòng 12-36 CSS đủ 2 theme (đúng token, 0 hex tự chế — sạch nhất bộ), dòng 39-57 header + khung 1180×820 lưới chấm, rồi **hết**. Không một ô ghép mặt, không lựa chọn tóc/kính/nền, không nút Lưu.
- **Sửa:** export lại phần ruột. Khi export: dòng 55 `font:600 12px inherit` → `font:600 12px/1.5 inherit`; khai `--scrim` vào globals hoặc dùng token có sẵn.

### 🔴 `mock-if-thu-vien.html` — CẮT CỤT + kính mỏng + 51 hex
- **Cắt cụt:** dòng 543 đóng `</x-dc>` ngay sau card "Sofa ba chỗ", **thiếu khối `<script>`** (4 file kia đều có) → kể cả có `support.js` thì theme/hover cũng chết ở riêng file này.
- **G2, dòng 92:** tấm thư viện `background:var(--mat-panel)` = **78%** (khai dòng 21) → **sửa thành nền đặc ≥92%**, kiểu `.vitals-pop`.
- **Token lệch, dòng 21·30:** `--mat-panel` `.78/.82` ≠ globals `.68/.7` → hoặc trả về đúng globals rồi bọc lớp đặc riêng cho tấm, **không** tự sửa giá trị token dùng chung.
- **51 hex ngoài `:root`** (nhiều nhất bộ). Trong đó **22 trùng giá trị token** → phải đổi thành `var()`: `#f5f5f7`×8 → `var(--t1)` (ví dụ dòng 165) · `#fff`×7 + `#ffffff` → `var(--card)`/`#fff` trên nền accent · `#f2efe9` → `var(--bg)` theme sáng · `#c79a63`×4 → `var(--accent-warm)` (dòng 135·164…) · `#1c1c22` → `var(--card)`. **29 hex còn lại là màu MINH HOẠ quả cầu vật liệu** (`radial-gradient(...#e0b884,#c79a63 46%,#7d5f3c)` dòng 164·175…) — chấp nhận được vì là NỘI DUNG, nhưng phải dán nhãn PLACEHOLDER cho vùng đó (hiện chỉ có 3 badge).
- **G4:** 44 shorthand `font:` thiếu `/1.5`.
- **Token tự chế:** `--swatch-bg:#3a3a40` `--ink` `--scrim` → bổ sung globals hoặc thay bằng token có.
- **Khung 6 ổ:** chỉ 214/236 (dòng 343), thiếu 42/26 — chấp nhận được vì đây là mock TẤM TRƯỢT, không phải màn đầy đủ; nhưng phần nền phía sau nên vẽ đúng khung để thấy tấm che tới đâu.

### 🔴 `mock-if-nut-tong.html` — G2 nặng nhất + hardcode 44px
- **G2, dòng 165:** modal "Gom thành nút tổng" 760px trên `--mat-panel` **72%/78%** → 🔴 **sửa thành ≥92%**.
- **Tương phản trong modal, dòng 226·240·254·261:** hàng `opacity:.5` chứa chữ `var(--t3)`/`var(--t4)` → chữ mờ trên kính mỏng. **Sửa:** bỏ `opacity` cả hàng, đổi màu chữ + thêm dấu hiệu trạng thái (công tắc tắt đã có).
- **G2, 13 card node** (dòng 79·87·95·103·111·293·302·349·414·422·430·442·451) trên `--mat-card` **62%** → sửa về ≥82% (bằng globals) hoặc đặc hơn.
- **Cảm ứng:** viết cứng `44px` **19 lần**, `var(--row)` **0 lần** → đổi hết sang `var(--row)`.
- **Khung 6 ổ:** chỉ có ổ phải 236px (dòng 67·285·391); **0 lần 42px**, không ổ header/status, **không có bộ chuyển chặng**. Là mock chi tiết → khi port phải đặt vào khung 6 ổ thật, đừng bê nguyên.
- **Token:** `--p-img/-mask/-mat/-num` là bí danh của accent/warning/success/t3 → bỏ, dùng thẳng.
- **G4:** 17 shorthand thiếu `/1.5`. **Hex:** 17 ngoài `:root`, 11 trùng token (`#fff`×7, `#f5f5f7`×2, `#0a0a0c`×2).

### 🟡 `mock-if-bang-nut.html` — khung đúng, kính mỏng
- **✅ Điểm mạnh:** khung 6 ổ **đủ 4/4 số** (dòng 68: `grid-template-rows:42px 1fr 26px; grid-template-columns:214px 1fr 236px`) — đúng `SPEC-APP-SHELL-CHUNG`. 465 `var(--`, chỉ 9 hex ngoài `:root`. Bộ chuyển chặng `2D·3D·Trình bày` đúng bộ tên mới (dòng 78-80). K4 đạt. G1 đạt (3 keyframes đều transform/dash/box-shadow).
- **G2, 14 card node** (dòng 151·165·183·204·219·235·260·350·366·387·411·424·445·469): `--mat-card` **62%/66%** (khai dòng 21·30) ≠ globals `.82` → **sửa về .82 tối thiểu**.
- **G2, dòng 479:** bảng lệnh nổi 296px trên `--mat-panel` 68% → ≥92%.
- **G4:** 24 shorthand thiếu `/1.5`.
- **Hex:** 7/9 trùng token — `#fff`×2, `#f5f5f7`×2, `#0a0a0c`×2, `#ffffff` → đổi `var()`.
- **Token:** 4 bí danh `--p-*` + `--hatch`.
- **Phím tắt:** chỉ 1 lần `⌘`, 0 `<kbd>`.

### 🟡 `mock-if-tep.html` — sạch nhất trong nhóm có ruột
- **✅ Điểm mạnh:** 783 dòng hoàn chỉnh (có `</script>`), **649** `var(--` — nhiều nhất bộ; chỉ **9** hex ngoài `:root`; khung 6 ổ đủ 4/4 số ở **cả 4 trạng thái** (dòng 64·346·537·623) — file duy nhất làm được điều này; 7 badge PLACEHOLDER; K4 đạt (nút `Xoá` có chữ, dòng 320·511); G1 đạt (0 keyframes); token `--mat-*` **khớp chính xác globals**.
- **G2, dòng 701:** popover 320px `--mat-panel` 68% → ≥92%. (Duy nhất 1 chỗ.)
- **G4:** **76** shorthand thiếu `/1.5` — nhiều nhất bộ, tập trung ở mono 10px (20 chỗ) là cỡ chữ nguy nhất cho dấu tiếng Việt.
- **Hex:** 8/9 trùng token (`#fff`×6 → dùng trên nền accent, chấp nhận; `#c79a63`×2 → `var(--accent-warm)`; `#8a6a44` minh hoạ).
- **Token tự chế:** `--hatch` `--ink`.
- **Phím tắt:** 0 `⌘`, 0 `<kbd>`, 0 `Esc` — thiếu hoàn toàn mảng 1 §0c.

---

## 4 · XẾP HẠNG

### 🔴 PHẢI SỬA TRƯỚC KHI PORT
| Mock | Vì sao |
|---|---|
| `mock-if-du-an.html` | **File cụt 22 dòng, 0 giao diện.** Không có gì để port. Export lại. |
| `mock-if-cai-dat.html` | **File cụt 26 dòng, 0 giao diện.** Export lại + sửa `--row:44px`→28px. |
| `mock-if-anh-dai-dien.html` | **Rỗng ruột** — có khung, không có nội dung ghép avatar. Export lại. |
| `mock-if-thu-vien.html` | Cụt đuôi + thiếu `<script>` · tấm nổi 78% (G2) · 22 hex trùng token · token `--mat-panel` tự sửa lệch globals. |
| `mock-if-nut-tong.html` | Modal 72% + 13 card 62% (G2 nặng nhất) · 19 lần hardcode `44px` · thiếu khung 6 ổ + thiếu bộ chuyển chặng. |

### 🟡 SỬA LÚC PORT (cấu trúc đúng, lỗi bề mặt sửa tại chỗ)
| Mock | Việc phải làm khi port |
|---|---|
| `mock-if-tep.html` | ① thêm `/1.5` vào 76 shorthand `font:` ② popover dòng 701 → nền đặc ≥92% ③ 8 hex → `var()` ④ khai `--hatch`/`--ink` vào globals ⑤ thêm gợi ý phím + ⌘K. |
| `mock-if-bang-nut.html` | ① `--mat-card` .62→.82 (14 card) ② bảng lệnh dòng 479 → ≥92% ③ `/1.5` cho 24 shorthand ④ bỏ 4 bí danh `--p-*` ⑤ 7 hex → `var()` ⑥ thêm phím tắt. |

### 🟢 CHẤP NHẬN ĐƯỢC (không có mock nào đạt hạng này)
Không file nào sạch đủ để port nguyên. Gần nhất là `mock-if-tep.html`.

---

## 5 · KẾT LUẬN

**PORT ĐƯỢC NGAY: 0/7.**

**PORT ĐƯỢC SAU KHI SỬA BỀ MẶT (2 file):** `mock-if-tep.html` · `mock-if-bang-nut.html` — bố cục, khung 6 ổ, bộ tên chặng, K4, G1 đều ĐẠT; lỗi còn lại là `font:` thiếu line-height, độ đục lớp kính, và vài hex nên đổi `var()`. Sửa hết ước chừng 1 ca.

**PHẢI SỬA/DỰNG LẠI TRƯỚC (5 file):** `du-an` · `cai-dat` · `anh-dai-dien` (3 file **không có nội dung** — phải export lại từ nguồn) · `thu-vien` (cụt đuôi + G2) · `nut-tong` (G2 nặng + hardcode cảm ứng + thiếu khung).

**Lỗi hạ tầng chặn cả 7 (và 9 mock khác):** thiếu `docs/mocks/support.js` → nút đổi theme và toàn bộ `style-hover` không chạy. **Tiêu chí "đủ 2 theme" mới chỉ verify được ở mức KHAI BÁO CSS, chưa verify được bằng mắt** cho bất kỳ file nào.

### 3 lỗi phổ biến nhất (đếm trên 5 file có ruột)
1. **`font:` rút gọn thiếu `/line-height`** — 162 chỗ / 5 file (5/5 file dính). Cùng cơ chế với G4, cắt dấu tiếng Việt.
2. **Lớp nổi dưới 92% nền đặc (G2)** — 4/5 file, tổng 33 phần tử (27 card node 62% + 6 panel/modal/popover 68-78%).
3. **Hex viết cứng trùng đúng giá trị token** — 48 chỗ / 5 file, đáng lẽ là `var(--t1)` `var(--accent-warm)` `var(--card)`.

### Chưa verify được (ghi rõ theo §0)
- Hiển thị thật 2 theme, hover, `{{ }}` binding — chặn bởi `support.js` mất.
- Tỉ số tương phản chữ trên kính (cần đo trình duyệt); các con số 62%/68%/72%/78% ở trên là **độ đục nền đo từ CSS**, không phải tỉ số tương phản đo được.
- Nội dung/bố cục của `du-an` · `cai-dat` · `anh-dai-dien` — file không có ruột.

---
*COWORK-UI · audit A4 · 03/08/2026. Không sửa file mock, không chạy git. Mọi số từ lệnh grep/wc chạy trên file thật.*
