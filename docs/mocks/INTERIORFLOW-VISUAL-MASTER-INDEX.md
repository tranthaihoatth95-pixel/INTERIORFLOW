# INTERIORFLOW — SỔ CÁI THỊ GIÁC (VISUAL MASTER INDEX)

> **Đây là TÀI LIỆU BẮT BUỘC ĐỌC cho mọi phiên làm giao diện về sau.**
>
> Lý do nó tồn tại, nói thẳng: dự án này đã lặp đúng một vòng hỏng nhiều lần —
> **bản vẽ tốt có sẵn · production vẫn cũ · rồi một agent khác thiết kế lại chính thứ đó.**
> Sổ này để chặn vòng đó. Bản máy-đọc-được đi kèm: `config/visual-source-of-truth.json`,
> canh bằng `node scripts/soi-visual-source.mjs`.
>
> **LUẬT TRÍ NHỚ:** surface đã ghi `CANONICAL` thì phiên sau **KHÔNG được thiết kế lại**, trừ khi
> ① Hoà yêu cầu · ② ngữ nghĩa sản phẩm đổi · ③ có bằng chứng nó không chạy được. Ngoài ba ca đó:
> **CANONICAL → PRODUCTION**, không reset.

Lập 22/08/2026. Nguồn: đọc tay **146 tệp HTML** + đối chiếu route thật + DB thật.
Chi tiết từng khối: `_index-part-A-dc.md` (36 tệp `.dc.html`, 643 dòng) ·
`_index-part-B-legacy.md` (110 tệp lịch sử, 857 dòng).

---

## 1 · CON SỐ

| | |
|---|---|
| Tệp HTML thiết kế | **146** (36 `.dc.html` + 110 lịch sử) |
| Ảnh chụp | **74** PNG `artifacts/visual-review/` |
| Route production thật | **30** |
| Surface gom được | **~50** |

**Phân loại (phần A, 36 tệp `.dc.html`):** 9 CANONICAL · 22 GOOD/TARGET · 3 EXPLORATION · 1 NEEDS
CORRECTION · 1 OBSOLETE.
**Phần B (110 tệp lịch sử):** 34 khối surface · **24 dòng SUPERSEDED — CẤM DỰNG** · 12 surface chỉ
tồn tại ở đây.

---

## 2 · 🔴 BỐN CÁI BẪY — ĐỌC TRƯỚC KHI CHỌN BẤT KỲ BẢN VẼ NÀO

### ① `mtime` VÔ GIÁ TRỊ ở kho này
**21/36** tệp `.dc.html` mang mtime 16/08 — nhưng đó là lượt **đổi tên token hàng loạt**
`--mat-*` → `--nen-mo-*` (906 chỗ / 55 tệp), **không phải thiết kế lại**. Hai tệp "mới nhất" thật
ra là khảo sát cũ, bản thay thế chính tắc của chúng đề **07/08**.
⇒ **Chọn theo tệp mới nhất là SAI.**

### ② Dấu chính tắc đáng tin: `[BẢN CHỐT]` trong `<title>`
Có đúng **3** tệp mang dấu này, cả 3 khớp con trỏ. Nó xử luôn hai cặp trùng:
`Lịch · Nhắc việc` **thắng** `Lịch việc` · `Tiến độ · Gantt` **thắng** `Tiến độ dự án`.

### ③ TÊN TỆP NÓI DỐI — đã bắt được 5 ca
| Tệp | Tên hứa gì | Ruột thật là gì |
|---|---|---|
| `Kéo thả.dc.html` | library→canvas | **9 bản khổ ĐIỆN THOẠI** (`width:393px`) kéo-thả VIỆC — **bản vẽ chạm/di động DUY NHẤT của cả kho** |
| `Tổng quan dự án.dc.html` | tổng quan MỘT dự án | dashboard **toàn studio** — route chưa ngã ngũ |
| `BangTron.dc.html` | bảng tròn | menu **radial cảm ứng**, production để ở `components/print/` |
| `mock-cad-shell-v3/v4/v5_cu` | ba phiên bản | dùng **CHUNG một `<title>`** "CAD shell v3" |
| `mock-if-ve3d.html` | vẽ 3D | mang `<title>` của `mock-if-3chang` |

### ④ TỆP LỌT KHỎI GLOB `mock-*` — suýt mất hẳn
`ls docs/mocks/mock-*.html` **KHÔNG thấy 15 tệp**, trong đó có:
`InteriorFlow 05 Máy quay.html` · **`avatar-picker.html`** · `vitals-avatar.html` ·
`vitals-prototype.html` · `vitals-v3.html` · `tool-window-sketch2photo.html`.
⚠️ **Ba tệp "InteriorFlow 0x" là BẢN SAO TRÙNG BYTE** (md5 xác minh) của `mock-if-*-v2`:
`01 Dự án`=`du-an-v2` · `02 Cài đặt`=`cai-dat-v2` · `03 Ảnh đại diện`=`anh-dai-dien-v2`.
**Nhưng `05 Máy quay` KHÔNG trùng gì cả** — màn riêng, không có bản sao.
⇒ **Luôn `ls *.html`, đừng `ls mock-*.html`.**

---

## 3 · SURFACE CHỈ CÓ Ở KHO CŨ — RỦI RO BỊ THIẾT KẾ LẠI CAO NHẤT

Các mặt này **có bản vẽ, KHÔNG có production**, và không có `.dc.html` mới nào thay:

| Surface | Bản vẽ | Production | Ghi chú |
|---|---|---|---|
| **Avatar / Ảnh đại diện** | `avatar-picker.html` · `mock-if-anh-dai-dien-v2.html` · `vitals-avatar.html` | route `/settings/avatar` **CÓ** | §4/§14 Hoà hỏi. Bản vẽ tồn tại — **cấm dựng lại thành form hồ sơ chung chung** |
| **Mời cộng tác · phân quyền** | `mock-if-cong-tac.html` | **0 component**, có API `members` | thiết kế xong, chưa có mặt |
| **Chat nhóm** | `Chat nhóm.dc.html` | có API `/api/chat`, **KHÔNG có trang** | |
| **Video editor** | có mock | không route | |
| **Máy quay** | `InteriorFlow 05 Máy quay.html` | không route | tệp lọt glob |
| **Trình chọn hồ sơ · TABLET** | `mock-trinh-chon-ho-so-tablet.html` | không | 🔴 con trỏ §2 vẫn ghi "HÀNG ĐỢI, 0 `.dc.html`" ⇒ **rủi ro dựng lại cao nhất** |
| Lịch · Gantt · phiên bản hồ sơ · thư viện tri thức | có `.dc.html` | **0 route** (`grep Gantt` = 0) | |

---

## 4 · 🔴 THAY-THẾ-MỘT-PHẦN LÀM RƠI TÍNH NĂNG

`mock-mood-collab.html` bị README đánh dấu *"đã thay bởi G2"* — nhưng bản **G2 KHÔNG có phần
tablet + bút + viết tay**. Phần cảm ứng **rơi mất, không ai ghi lại**.

> **Luật rút ra: "đã bị thay" ≠ "đã được phủ hết".** Khi đóng dấu SUPERSEDED phải đối chiếu
> TÍNH NĂNG, không chỉ đối chiếu MÀN.

---

## 5 · KHÔNG AUTO-ƯU TIÊN BẢN MỚI — bốn ca đã bắt

| Bản mới hơn | Nhưng bản ĐỨNG là | Vì sao |
|---|---|---|
| `claude-login-home-ambient-final.html` (22/08) | `claude-login-redesign-abc.html` | bản kia **BỊ BÁC** — đọc như SaaS auth card |
| `mock-files-hai-ngan` | `mock-files-hai-tang` | bị đè trong **cùng ngày** 17/08 |
| `mock-rail-hai-cum` (HAI CỤM) | Experience System (**BA CỤM**) | chốt 20/08 |
| Vitals bản cũ | **`VitalsAperture`** mép trên | bị đè **hai lần** |

---

## 6 · CẢNH BÁO THEME — đọc bố cục được, lấy màu thì KHÔNG
Mọi mock **02–13/08** dùng nền sáng **kem `#f0ece4`**. Nền kem **đã bị khai tử 16/08** (trên nền
xám ra xỉn). ⇒ Dùng những bản đó để học **bố cục**, tuyệt đối **không chép hex**.

---

## 7 · HAI LỖI ĐO ĐƯỢC, PHẢI SỬA
- **`BangNetIn.dc.html` in "Checklist TTT" lên mặt bản vẽ** — vi phạm LUẬT NỀN TẢNG (IF là sản
  phẩm độc lập, cấm nhúng thương hiệu studio). Xác minh bằng grep.
- **`Review-Gate.dc.html` là tệp DUY NHẤT / 36 thiếu khối `[data-theme="light"]`** — chỉ sống ở
  theme tối.

## 8 · BA CHỖ TRANH CHẤP CHƯA NGÃ NGŨ
1. **Home có BA tệp cùng nhận vai**, cả ba "chờ Hoà duyệt mắt" ⇒ **chưa có Home chính tắc qua mắt**.
2. **Vitals ghi COMPLETE** trong khi `Vitals glyph.dc.html` kết bằng một câu hỏi chưa ai trả lời.
3. ⚠️ **`Auth.dc.html` KHÔNG phải tệp bị trượt 22/08** (tệp trượt là `claude-login-home-ambient-final`).
   Nhầm hai cái này là **vứt mất luật KHOÁ ≠ ĐĂNG XUẤT** — luật đó không có ở bản vẽ nào khác.

---

## 9 · HÀNG ĐỢI PRODUCTION

**P0 — đang thấy được + lệch nặng**
1. **Sidebar · overlap = 0px** — `RailDieuHuong.tsx:99` mặc định mở khi không ở trong chặng ⇒ ở Home đè ~144px lên nội dung. Lệch ĐO ĐƯỢC duy nhất còn treo.
2. **Home** — đã thay bố cục 22/08 (`LivingCanvas`), còn chờ mắt.
3. **Login** — 3 phương án A/B/C, chờ Hoà chọn; phải sửa rò tên dự án + mốc giờ bịa trước khi dựng.

**P1 — luồng lõi:** Gallery/Explore · Import/Check Drawing (chuẩn chất lượng, **cấm hạ xuống cho bằng UI yếu**) · 2D · 3D.

**P2 — hỗ trợ:** Avatar/Profile · Review Gate · Settings (mục *Màn hình chính* đang là tính năng sống-trong-mã-chết-với-người-dùng) · Workspace/ToolWindow.

**P3 — thứ cấp:** Chat · Lịch/Gantt · Video · Máy quay · mời cộng tác/phân quyền.

---

## 10 · LUẬT DÙNG SỔ NÀY
1. Trước khi sửa **bất kỳ** màn người-dùng-thấy: tra `surfaceId` trong `config/visual-source-of-truth.json`.
2. Không có entry ⇒ **DỪNG thiết kế lại**, đăng ký surface trước.
3. `source.type` nói **nơi bản vẽ ĐƯỢC TẠO RA**, không phải nơi nó được sao lưu. Đẩy lên Claude
   Design **KHÔNG** biến `repo-html` thành `claude-design`.
4. Production **KHÔNG** render/iframe tệp mock lúc chạy. Mock là **đích ngắm**, không phải dữ liệu.
5. Mỗi surface **MỘT** canonical. Alternatives đọc để học, không tự ý chọn thay.
6. Xong một màn = **canonical + dựng + kiểm app thật + so OLD|TARGET|NEW + hành vi còn nguyên**.
   Chỉ có mock = **CHƯA XONG**. Có code mà không có ảnh so sánh = **CHƯA XONG**.
