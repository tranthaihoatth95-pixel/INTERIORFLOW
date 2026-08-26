# NAV-TI-LE-ICON — tỉ lệ cột trái · bảng Lớp gọn · hệ biểu tượng (20/08)

> Nối tiếp `2026-08-20-NAV-HAI-DAO.md`. Server :3001 dùng lại, không restart. Không git, không prisma.
> Vùng ghi: `components/nav/**` · `components/ui/command-icon.tsx` · `components/cad/CadEditor.tsx`
> (phần `LayerPanel`) · `components/studio/Navigator.tsx` (bề rộng thềm — xem ⑦b mục 1).
> Không đụng `BeMatNoi.tsx` · `CuaSoCongCu.tsx` · `/thu-be-mat` · `components/home/**` · `lib/capabilities/**`.

---

## ⓪ TIỀN ĐỀ

| Giả định phiếu | Kiểm | Kết luận |
|---|---|---|
| Bảng Lớp nằm ở `components/cad/**` | `LayerPanel` xuất từ `components/cad/CadEditor.tsx:1428`, mount qua `CadStageScreen` vào ổ ② Navigator | ĐÚNG |
| Vùng `components/cad/**` đã trống | không thấy lane khác ghi trong lượt này | ĐÚNG (đã sửa, tsc sạch) |
| Repo dùng lucide | `lucide-react` **1.23.0**, viền đơn sắc | ĐÚNG — chỉ **chọn lại + siết khung/nét**, KHÔNG vẽ glyph mới nào |
| Thềm Lớp đang trong dải 220-248 | **214** (`Navigator.tsx` `DEFAULT_WIDTH`) | 🔴 **SAI — hụt dải**, phải sửa |

---

## ① SỐ ĐO TRÊN APP THẬT — đo, không ước

Route `/projects/<id>/cad`, đăng nhập, đã xoá khoá `localStorage` để đo đúng **mặc định**.

### Mặc định khi đang sáng tác

| | 1440×900 | 1600×900 | dải chốt |
|---|---|---|---|
| rail việc | **52** | **52** | 52-56 ✓ |
| thềm Lớp | **224** | **224** | 220-248 ✓ |
| tổng trái thường trực | **276** | **276** | 272-304 ✓ |
| **% bề rộng dùng được** | **19,2%** | **17,3%** | ≤ ~20% ✓ |
| tỉ lệ rail : thềm | **1 : 4,31** | **1 : 4,31** | 1 : 4-4,5 ✓ |
| **canvas** | **1150px · 79,9%** | **81,9%** | phải áp đảo ✓ |
| khoảng thở hai đảo | 28px | 28px | còn tách ✓ |

### Bảng làm việc sâu — NỞ RA THAY THẾ, không thành cột thứ ba

Bấm "Sửa nét" trong bảng Lớp, đo lại ở 1440:

| | trước | sau |
|---|---|---|
| rail | 52 | **52** (không đổi — Lớp thu/mở độc lập với rail ✓) |
| thềm | 224 | **320** (∈ 300-340 ✓) |
| **số cột `<aside>`** | 1 | **1** ✓ — nở tại chỗ, KHÔNG đẻ cột thứ ba |
| tổng trái | 276 (19,2%) | 372 (**25,8%**) |
| canvas | 79,9% | 73,2% |

🔴 **Vì sao phải là "thay thế" chứ không "thêm cột" — số nói thẳng**: nếu 320 đứng CẠNH thềm thì
tổng trái là 52 + 224 + 320 = **596px = 41,4%** màn 1440, gấp đôi trần ~20%. Ràng buộc này đã ghi
thành comment ⛔ ngay tại chỗ nhận sự kiện trong `Navigator.tsx`.

---

## ② VIỆC ĐÃ LÀM

### A · Tỉ lệ cột trái
- `Navigator` `DEFAULT_WIDTH` **214 → 224**. 214 nằm ngoài dải 220-248 Hoà chốt.
- 🆕 **Mặc định nấc rail theo NGỮ CẢNH** (`nacMoDau`): trong CHẶNG → `dinhVi` (52) · ngoài chặng →
  `dieuHuong` (240). Lý do là **số, không phải gu**: đo thật trước khi sửa, rail 240 + thềm 224 =
  **464px = 32,2%** ở 1440 — vượt xa trần. Với 52 thì 276 = 19,2%.
  ⚠️ Không mâu thuẫn luật ① "rail không auto-thu": đây là **giá trị mở đầu khi chưa có lựa chọn**,
  còn `localStorage` đọc TRƯỚC và luôn thắng. Người dùng chọn một lần rồi thì app thôi đoán hộ.
- Bảng sâu nở tại chỗ qua sự kiện `if:navigator-width`; `null` = trả về mặc định. **Không persist** —
  đây là trạng thái của MỘT lượt sửa sâu, nhớ qua phiên sẽ làm app mở ra rộng ngoác không rõ vì sao.

### B · Thu gọn
Rail thu về 52 **mất chữ, icon Y HỆT** — cùng component, cùng khung 20, cùng nét; chỉ nhánh
`hienChu` tắt phần chữ. Hai đảo **giữ tách 28px** ở cả ba nấc (đo lại lượt này). Không đổi bộ icon
theo nấc — đổi là hai bộ, tức hai lần học.

### C · Bảng Lớp
Hàng mặc định nay **đúng sáu thứ** và không hơn — đo trên app: `select` trong hàng = **0**.

| trước | nay |
|---|---|
| ô màu · tên · ẩn/hiện · khoá · **Xoá** · mẫu nét · **2 `<select>`** trên MỌI hàng | ô màu · **mẫu nét (kiểu + độ dày)** · tên · ẩn/hiện · khoá · **trạng thái hiện hành** |

Với 8 lớp, bảng cũ bày sẵn **16 hộp xổ**. Bảng Lớp là thứ người ta LƯỚT để tìm lớp; chỉnh thông số
là việc của **một lớp tại một thời điểm** ⇒ hai `<select>` + Xoá dời xuống khối **MỞ RỘNG**, chỉ cho
**lớp đang chọn**. Đó cũng là thứ làm nấc rộng thành một CÔNG NĂNG khác chứ không phải nấc gọn kéo
giãn (che khối đó đi thì nấc rộng không đáng tồn tại).

**"Trạng thái lớp hiện hành rõ ràng" = ba kênh, không chỉ màu**: nền `--accent-soft` · **chấm đặc**
mép trái · **chữ "hiện hành"**. In trắng đen hoặc mù màu vẫn đọc ra.

Ba nấc của bảng Lớp, **độc lập với rail**: ĐÓNG (dải mỏng — dùng cơ chế `Navigator` sẵn có, không
dựng cái thứ hai) · gọn **224** · rộng **320**.

### D/E/F · Hệ biểu tượng — sửa như MỘT HỆ
🆕 `HE_BIEU_TUONG` trong `components/ui/command-icon.tsx` là **một bộ số cho cả app**:
`khung 20 · hinh 18 · net 1,5 → netNhan 1,75`. Rail đọc từ đây; `CommandIcon` cũng khai
`strokeWidth` tường minh (mặc định lucide là **2** — ngoài dải).

🔴 **Một lỗi hệ bắt được khi siết**: rail đang dùng `strokeWidth={2}` cho mục đang mở. Nét 2 ở hình
16px làm icon đó **đặc hơn hẳn hàng xóm** — tức lấy độ dày nét làm kênh **danh tính** thay vì kênh
**trạng thái**, đúng thứ luật "màu/nét = trạng thái" cấm. Nay 1,5 → 1,75, cả hai đầu trong dải.

Icon đặt trong **ô 20×20 cố định** thay vì thả trần: hình lucide cái vuông cái dẹt, thả trần thì mép
trái chữ nhấp nhô theo từng hàng.

**Tám icon — chọn lại theo nghĩa Hoà chỉ hướng** (cột "phần tử" = số hình vẽ trong `iconNode`, ĐO
bằng test, không đếm mắt):

| mục | trước | nay | phần tử | vì sao |
|---|---|---|---|---|
| Trang chủ | `LayoutGrid` | **`House`** | 2 | 4-ô là ngôn ngữ dashboard, không nói "về xưởng" |
| Dự án | `Building2` | **`Briefcase`** | 2 | toà nhà nhiều tầng/cửa sổ — chi tiết nhỏ, 16px không kịp 1 giây |
| Files | `Folder` | `Folder` | 1 | đã đúng, đơn giản nhất bộ |
| Thư viện | `Library` | **`LibraryBig`** | 3 | 🔴 `Library` là **bốn vạch dọc cao thấp = đọc ra thanh equalizer** — đúng cái Hoà nêu |
| Soát duyệt | `ShieldCheck` | **`FileCheck2`** | 3 | khiên nói BẢO MẬT; đây là duyệt hồ sơ |
| Thiết kế 2D | `PencilRuler` | **`Grid2x2`** | 3 | `PencilRuler` là HAI vật chồng nhau, rối ở 16px dù cùng số phần tử |
| Thiết kế 3D | `Box` | `Box` | 3 | khối lập phương dây — vốn đã đúng |
| Trình chiếu | `Presentation` | `Presentation` | 3 | khung hình trên chân = đầu ra |

**Dải 1-3, cái rối nhất đúng 3× cái đơn giản nhất** — chạm mép trần, không vượt.
⛔ `Boxes` (**9 phần tử**) từng cân nhắc cho Thư viện: LOẠI — gấp 9 lần cái đơn giản nhất, tự nó là
ca TRƯỢT của chính luật này.
✅ **Không vẽ glyph riêng nào** — toàn bộ nằm trong lucide, đúng ranh giới phiếu.

Nút bước nấc (chevron) cũng kéo vào hệ: nét 2 → 1,5, hình 16 (nhỏ hơn một bậc = kênh phân biệt
"điều khiển ≠ nội dung"), ô nút giữ 32 để không tụt dưới ngưỡng chạm WCAG 2.2 AA.

**Soi 8 icon cạnh nhau trên app thật** — cả 9 `<svg>` trong rail: khung `20×20`, hình `{18, 16}`,
nét `{1,5 · 1,75}`. **Không còn nét 2 nào.** Không cái nào lệch hẳn độ phức tạp.

### G · Canvas thở
Mặc định sáng tác: canvas **79,9%** (1440) / **81,9%** (1600) bề rộng. Không màn nào bày mặc định
cùng lúc sidebar mở rộng + Lớp đầy — nấc rộng 320 và khối "Sửa nét" đều phải **bấm mới ra**, và
mặc định của bảng Lớp là gọn.

---

## ③ MÁY KIỂM

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi thuộc vùng này** (còn 2 lỗi `vitest` của lane khác ở `lib/ui/hien-dan.test.ts` · `lib/ui/nhip.test.ts` — untracked, không phải vùng ghi này) |
| `muc-dieu-huong.test.ts` | **✅ ĐẠT toàn bộ**, thêm nhóm **[8] HỆ BIỂU TƯỢNG** |
| khuôn test | `sucrase-node` như cả nhà — **không vitest** |

**Nhóm [8] mới** biến luật icon thành thứ máy chặn được, thay vì lời khuyên:
- đếm phần tử `iconNode` của lucide đã cài → khoá `1 ≤ n ≤ 3` và `max ≤ 3 × min`;
- chặn đích danh bốn hình Hoà loại — `layout-grid` · `building-2` · `library` · `shield-check` —
  khoá bằng **tên tệp**, nên đổi icon là phải cãi lại chỗ này;
- khoá `khung=20` · `hinh ∈ [16,18]` · `net ≥ 1,5` · `netNhan ≤ 1,75` (chặn tái phát ca `strokeWidth=2`).

⚠️ Bẫy gặp khi viết chính test này, ghi lại vì nó suýt cho kết quả sai: regex `\["path"` đếm **0**
cho `folder` — lucide xuống dòng sau dấu mở ngoặc ở icon một-phần-tử, làm **cái đơn giản nhất trông
như cái rỗng**. Bảng số trong bản nháp đầu của comment sai **4/8 dòng** vì thế; đã sửa regex, đã
chép lại số từ test. Ghi thành cảnh báo tại chỗ: **sửa icon thì chạy test rồi chép số ra, đừng ước.**

---

## ④ ⑦b — CHƯA CHẮC / CHƯA KIỂM

1. **Đã ghi ngoài vùng khai: `components/studio/Navigator.tsx`.** Bề rộng thềm (`DEFAULT_WIDTH`) và
   ổ nhận `if:navigator-width` sống ở đó; không đụng thì không đạt được tỉ lệ A. Sửa tối thiểu: một
   hằng số + một effect + một dòng `const width = rongTheo ?? widthProp`. **Khai để MAIN quyết** có
   giữ hay tách phiếu.
2. **`nacMoDau` là suy luận của tôi từ hai câu chốt** ("mặc định khi đang sáng tác" + CHOT-EXPERIENCE
   điều 4 "vào chặng mặc định rail gọn"), không phải chữ Hoà viết thẳng. Nếu Hoà muốn rail **luôn**
   mở 240 kể cả trong chặng thì phải chấp nhận 32,2% ở 1440 — hai thứ không cùng đúng được.
3. **Chỉ đo ở `/cad`.** `/render` và `/present` cũng dùng ổ ② nhưng ruột khác (Node/Trang) — chưa
   soi, tỉ lệ có thể khác nếu panel của chúng tự đặt `width`.
4. **"Hiểu dưới 1 giây" chưa hỏi người thật.** Số phần tử là **thước gián tiếp** cho độ phức tạp,
   không phải phép đo nhận thức. Một icon 2 phần tử vẫn có thể mơ hồ về NGHĨA — phần nghĩa vẫn cần
   mắt Hoà duyệt.
5. **Ảnh chụp không dùng được**: pane trình duyệt render nội dung vào góc ~184×120 của khung
   800×500, không đọc nổi. Toàn bộ §① là số đo DOM, không phải ảnh.
6. **Chưa soi khổ hẹp (<1280)**, chưa thử hai theme, chưa trình đọc màn hình. Ràng buộc "màn hẹp:
   rail giữ nguyên, thềm đè lên/lùi đi chứ không nghiến canvas" — `Navigator` có sẵn auto-thu dưới
   1280, nhưng **tôi chưa đo** hành vi đó lượt này.
7. **Dev server nhiều lane cùng biên dịch**: gặp `ReferenceError: NAC_MAC_DINH is not defined` từ
   **chunk cũ** sau khi hằng số đó đã bị xoá khỏi nguồn (grep = 0) — mất ~3 lượt đo mới qua. Mọi số
   ở §① là số đo **sau khi `visibility: visible`**, tức đã hydrate xong; số đo lúc `hidden` là rác.

## ⑦c — HẠN DÙNG

Số ở §① hết hạn ngay khi lane khác đụng `AppShell`/`Navigator`/`CadStageScreen` hoặc panel chặng
khác tự đặt `width` — **đo lại, đừng chép**. Bảng icon hết hạn khi nâng `lucide-react` (số phần tử
đổi theo bản); test [8] sẽ báo đỏ, đó là chỗ biết.

## ⑤ ⛳ NỢ

- Đo `/render` · `/present` theo cùng khuôn tỉ lệ.
- Resize kéo tay thềm trong [320, 440] (nợ cũ từ chốt EXS điều 4).
- Đo hành vi màn hẹp <1280 (thềm phải đè/lùi, không nghiến canvas).
- `HE_BIEU_TUONG` mới phủ rail + `CommandIcon`; các toolbar khác vẫn gõ `size`/`strokeWidth` tại chỗ.
