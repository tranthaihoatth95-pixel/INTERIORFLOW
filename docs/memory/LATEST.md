# LATEST — bản nén trí nhớ bối cảnh IF (ghi đè mỗi phiên lớn)

> **Đọc file này ĐẦU TIÊN**, rồi **`docs/IF-KIEN-TRUC.md`** (bản đồ).
> Luật giữ bản nén: **CHỈ tên + đường dẫn + một câu. Cấm chép nội dung.**

**Cập nhật lần cuối: 2026-08-17 (đợt T #3 — cắm điện vật liệu · vá 2 máy soi · 2 lệch sổ)**

---

# 2026-08-17 · đợt T #3 — commit `b34f2a9`

## ⭐ Việc lớn nhất: HAI LỆCH CỦA CHÍNH SỔ, T đo lại tại nguồn mới lộ
1. *"`lib/materials` ↔ `ProductSpec` = 0 code"* — **SAI**. `getMaterial()` (`lib/materials/resolve.ts:52`)
   có từ 07/08, chỉ là **0 nơi gọi**. Câu *"đo lại 16/08"* là **số chép lại, không phải phép đo**.
2. *"5 bộ hình nền chưa cắm vào Home"* — **SAI**. `SystemWallpaper` mount từ 16/08
   (`DongStudioHome.tsx:543`), mặc định bật. ⇒ **dải đen phải chẩn lại** (đã chẩn, xem dưới).

**Bằng chứng đầy đủ**: `docs/memory/sessions/2026-08-17/01-mo-phien-do-lai-hai-lech/`.
⚠️ **Bản đồ lập tối 16/08 sai một dòng sau ĐÚNG MỘT NGÀY**, do chính T viết — luật *viết lại,
không cộng dồn* giữ được **hình dạng** bản đồ, **không** giữ được tính đúng. Chỉ máy canh giữ được.

## ⭐⭐ Phiếu P-S bị agent BÁC BỎ — và bác đúng
T định dựng *máy đối chiếu sổ↔code*. **Nó đã có**: `scripts/soi-that.mjs` (08/08) — *"ĐỐI CHIẾU
57 SPEC ↔ CODE THẬT"*. **Phiếu đi bắt "code có mà sổ không biết" tự nó là một ca của đúng vế ấy.**
T verify 5/5 điểm agent nêu → nhận sai → ra phiếu sửa **P-S2**.

## Code đã ship
- **Vật liệu (P-T)**: `MaterialsScreen.tsx:90` gọi `getMaterial()` thật · `lib/materials/ba-mat.ts`
  + `ChiBaoBaMat` + `BaMatPanel` + cột *Ba mặt*. Giá **không** bị chép vào vật liệu (verify: `savePbr`
  0 chỗ, `schema.prisma` diff rỗng). Mock `mock-vat-lieu-ba-mat.html` **đã lên Claude Design**.
- **`soi-that.mjs` (P-S2)**: vá đường worktree (**27/27 dòng ✅ từng trỏ vào bản sao cũ**, bảng tổng
  vẫn xanh) · `npm run soi:that` · nới 68 spec → **503 văn bản sống** · thêm 2 chiều **mảng CÂM** +
  **khái niệm MA**. 3.436 → 881 tệp. Bắt đúng `.idfnotes` + `KB-5`.
- **`check-chot.mjs` (T)**: mắc **y hệt** bug và **chạy trong `npm test`** — 4.042/8.098 tệp (50%)
  là bản sao worktree. Đã vá. **Lần thứ BA cùng một bug** (`package.json` 16/08 → `soi-that` → đây).
- **`npm run tsc`**: cửa được trích dẫn nhiều nhất toàn sổ **không có lối npm và không nằm trong
  `npm test`**. Nay có cả hai; `npm test` vẫn exit 0.

## Dải đen Home — chẩn lại bằng SỐ ĐO PIXEL (`sessions/2026-08-17/02-chan-lai-dai-den-home/`)
Phần dư quanh lưới là **cố ý** (`bentoFillPercent(1) = 76%`). Nền **chạy đúng thiết kế**.
🔴 **Gốc bệnh thật: dải sáng của nền ÔM TRỌN độ sáng card** (card đo thật 0,110; `night` = [0,05…0,17])
⇒ nửa trên nền tối hơn card = lỗ đen · nửa dưới sáng hơn = card chìm.
Tính cả ma trận 4 nấc × 5 bộ × 2 theme: **`night` cả 5 bộ cắt ngang**, `dusk` 4/5, `dawn` 3/5, `day` 2/5.
**Luật T đề xuất (chờ Hoà)**: *nền phải nằm TRỌN một phía so với card* — đo được ⇒ thành test được.
Ba hướng sửa trong file; T đề xuất **hạ trần dải đêm xuống dưới `--panel`**.

## Số đo mới đáng nhớ
- `lib/cad/materials.ts` — **0/14** preset khai `matId` ⇒ mặt **2D gạch `–` cho TOÀN kho**.
  Việc kế tiếp nhỏ và rõ: **gán `matId` cho preset 2D** (cần dữ liệu kho thật, T không đoán).
- `/api/specs` — **0/10** bản ghi có `priceVnd` là **số**; thứ bảng đang hiện là `priceNote`
  (*"≈ 3.200.000đ (tham khảo)"* — **chữ**). Chỉ báo `Giá !` **nói đúng**, và nó lộ ra rằng
  bảng lâu nay hiện một con số trông như giá thật. Đúng chốt 15/08 *BOQ chỉ nhận số đo được*.

## 🔴 Lỗi của T trong phiên
- Tiền đề phiếu P-S sai (agent bắt) · **ghi đè mất ảnh `02-04-vat-lieu.png` trên Drive**: T tưởng
  `/materials` không cần đăng nhập vì **pane trình duyệt đang có phiên** — đo ở **bản chiếu**,
  không đo ở **nguồn**; playwright sạch phiên ra **HTTP 401**. Đã gỡ ảnh sai, lô còn **24**.
  ⇒ **Chỉ Hoà chụp lại được** (script cần mật khẩu, T không nhập).

## ⛔ CHỜ HOÀ
① **duyệt mắt — 71 xong-máy đối 1 qua mắt**, nút thắt lớn nhất ② chọn màu **mòng két ↔ mận**
(*"để tôi xem bản vẽ đã"* ⇒ **cấm thi công gì dính `--accent*`**) ③ *Tổng quan dự án* và *Sổ tay*
đứng đâu trên rail ④ duyệt **luật nền-trọn-một-phía-so-với-card** ⑤ chạy tay: xoá **3 worktree rác**
(chính chúng làm 2 máy soi quét nhầm cây) + chụp lại `02-04-vat-lieu.png`.
✅ **ĐÃ ĐÓNG 17/08**: Files **CÓ hai ngăn khác bản chất** → `IF-KIEN-TRUC.md` §5.

## Hàng đợi kế
1. **Vá `check-chot`-họ**: nếu thêm máy duyệt cây từ gốc repo thì **soi lại cả họ**, đừng vá lẻ.
2. **Gán `matId` cho preset 2D** — mở nốt mặt thứ ba.
3. **16 dòng ❌ mới của `soi:that`** chưa ai soi từng dòng; 1 ca thật đã lộ: spec viết thiếu chữ
   `s` — `inferElementType` ↔ `inferElementTypes` (`lib/cad/element-infer.ts:138`), 3 tệp spec.
4. Ba việc từ soi 3 chặng · dựng lại **4 kịch bản sidebar** theo **hai cụm + Files hai ngăn**.

---

# 2026-08-16 — đợt giao diện #2 + lập bản đồ kiến trúc

**Bản đồ mồ côi**: `IF-ARCHITECTURE-COMPASS.md` sửa cuối 29/07, **19 ngày không phiên nào đọc**
(`CLAUDE.md` trỏ vào mẩu cụt 774 byte) ⇒ lập **`docs/IF-KIEN-TRUC.md`**.
**Bài học:** nén ngữ cảnh + lưu chi tiết đều là cơ chế cho **nhật ký**; thứ thiếu là **QUAN HỆ**.

**Chốt lớn của Hoà** (nguyên văn `00-CHOT` 16/08): kiến trúc **canvas + cửa sổ công cụ** ·
**sidebar là router toàn app**, **hai cụm** · **Files là phần thô** (bỏ *chợ đầu mối*) · **màu là
bước chọn vật liệu** · **ba nấc = ba công năng** · **đồng bộ = không tách ra ngay từ đầu** ·
**dock neo theo ngữ cảnh** · 5 bộ hình nền sinh bằng mã.

**Code**: `Tooltip` prop `hinh` · `ToolbarChip` → `aria-disabled` · `lib/ui/tien-trinh.ts` + `LightBar`
(**bịa % là tsc đỏ**) · `HopCongCuBamVat` + `CuaSoCongCu` · `soi:tu-dien` hết mù `.md` ·
`--mat-*`→`--nen-mo-*` · `--nen-mo-hairline`→`--vien-mo` · token `--mo-vo-hieu`.

**Bản vẽ chờ mắt Hoà** — project `b7dc14ba-1752-4821-8fc7-d519f737ac09`: `mock-o-giai-nghia` ·
`mock-thanh-tien-trinh` · `mock-ban-thu-2-huong-mau` · `mock-chu-ky-va-bieu-tuong-tep` ·
`mock-kich-ban-sidebar` (🔴 **dựng lại** — theo hai cụm + Files hai ngăn) · `mock-5-bo-hinh-nen` ·
`mock-widget-viec-dang-do` · `mock-vat-lieu-ba-mat` (17/08).

**Nghiên cứu**: `NC-TU-DA-NGHIA-2026-08-16` · `NC-DIEU-HUONG-APP-TUONG-TU` · `NC-CAD-REVIT-MOT-APP` ·
`NC-SOI-3-CHANG`.

**Lỗi của T**: 9 lỗi, **agent bắt cả 9, máy soi bắt 0**.
⇒ **Ô ⓪ TIỀN ĐỀ + quyền agent bác T là cơ chế sinh lời đậm nhất — giữ bằng mọi giá.**
(17/08 xác nhận lại: lần thứ 10, và lần này nó chặn được cả một phiếu sai.)

# 2026-08-17 (sáng, đợt trước) — commit `4e967f2`
4 lỗi Home Hoà soi từ **ảnh chụp thật** (lần đầu lô duyệt-mắt sinh finding): lời chào `hoa`→`Hoa` ·
số ô **01→07 liền mạch** · thừa trống trong ô · thẻ dự án phân biệt được · `--t4/--t5`→`--t3` ở
`WidgetCard` (1,98→7,24). Máy chụp màn hết bỏ khung: **24 ảnh, 0 bỏ**.
🔴 Còn: **design system CHƯA CÓ THANG CHIỀU CAO KHỐI** (`279/220/112/97px` gõ tay) ·
tên hiển thị lưu localStorage, đổi máy là mất.

---

## 📦 BÀN GIAO NGHIÊN CỨU PHIÊN 16/08 — `docs/nc/NC-BAN-GIAO-NGHIEN-CUU-2026-08-16.md`
Gom **nguồn ngoài đã tra** (Apple Liquid Glass + màu · Material 3 · Context Engineering · shadcn ·
3 kho GitHub chính chủ · Chrome DevTools MCP) · **phép đo dùng lại được** (bảng góc màu · phổ chỉ
còn 2 cửa · ngưỡng kính · lệch 14 điểm kênh lam giải thích chữ "sến") · **2 vị trí code phiên sau
cần** (`Tooltip.tsx:33,37` · `ToolbarChip.tsx:137` nút mờ đi vòng Tooltip) · **cơ chế đã dựng**
(⓪b/⓪c/⑥b · §10 · cửa Drive · máy chụp màn) · **6 lỗi của T** · **3 điều rút ra về phương pháp**.
