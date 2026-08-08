> **CÁCH DÙNG:** `Cmd+A` → `Cmd+C` → dán vào phiên **`p3. 3D shell UI and test in…`**
> ⚠️ Phải chạy trong **worktree riêng** — xem cuối tệp.

---

# LUẬT BẮT BUỘC — đọc trước khi gõ dòng code đầu tiên

Đọc theo thứ tự: `STATUS.md` → `docs/00-CHOT.md` → `docs/00-BAT-DAU-DOC-DAY.md`.
**KHÔNG đọc `CHANGELOG.md`.**

```
V6  · KHÔNG commit. Hoà commit. Làm xong để nguyên, báo cáo.
§0u · Chỉ COWORK-TỔNG được ghi docs/GAP-IF.md. Phiên khác ghi vào tệp OUT của mình.
§0ab· Sổ là ảnh chụp cũ. ĐO LẠI bằng máy trước khi tin bất kỳ con số nào.
§0ac· Báo cáo phải tự khai: tệp OUT tên gì, dán vào phiên nào.
N1  · Báo cáo KHÔNG phải bằng chứng. Mỗi việc "xong" phải kèm số đo hoặc ẢNH.
N5  · Khai thật cái chưa xong. Thà ghi "CHƯA VERIFY" còn hơn ghi "xong" mà không đo.
N8  · Mọi dòng báo cáo có file:dòng.
```

**Luật giao diện — phiếu này soi đúng mấy điều này**

```
G2 · panel nền đặc ≥92%
G4 · line-height ≥1,5  (thấp hơn là CẮT DẤU tiếng Việt — lỗi hay gặp nhất)
G6 · nút quyết định phải có CHỮ, không chỉ biểu tượng
G8 · kéo thả KHÔNG được là đường duy nhất — luôn có nút thay thế
```

**Cửa kiểm trước khi báo xong**

```bash
npx tsc --noEmit -p .
node scripts/check-chot.mjs
npm test
```

---

# PHIẾU `p3` · ĐỐI CHIẾU LẠI MOCK BẰNG MẮT

**Tệp OUT:** `docs/M-MOCK-2-OUT.md`
**Sở hữu:** `docs/mocks/` · 4 tệp màn rỗng:
`components/ProjectSelect.tsx` · `components/cad/CadEditor.tsx` ·
`components/present-editor/PresentEditor.tsx` · `components/render-studio/Render3DModeSkeleton.tsx`
**Cấm đụng:** `components/studio/AppShell.tsx` (`p3c` giữ) ·
`components/render-studio/Command3DPanel.tsx` (`p14` giữ) ·
`prisma/` · `lib/server/` (`p12` giữ) · `lib/review/` (`p3c` giữ)

> ⚠️ Phiếu này **ít viết code, nhiều NHÌN**. Đầu ra chính là **ảnh chụp**, không phải diff.

> ⛔ **ĐỪNG LÀM LẠI VIỆC ĐÃ XONG** (kiểm bằng máy 08/08):
> - **Chữ trên 4 màn rỗng ĐÃ bám mock** — cả 4 tệp mang dấu mốc `M-EMPTY-2` (tiêu đề · mô tả ·
>   nhãn nút · song ngữ · lý do khoá lộ mặt · kéo-thả đã nối thật). **Không sửa lại chữ.**
> - **`PanelFlank` ĐÃ lắp 3 vùng**: `AppShell.tsx` · `LibrarySheet.tsx` · `Render3DModeSkeleton.tsx`.
>   **Không lắp lại, không chế dải thứ hai.**
>
> Việc của phiếu này là thứ **chưa ai làm**: nhìn bằng mắt để soi **bố cục · khoảng cách ·
> thứ bậc thị giác** (ba thứ đọc mã không thấy được), và **xác minh** tay cầm panel chạy thật.

---

## VIỆC 1 — Vì sao phải làm lại

`docs/mocks/support.js` vừa được vá **07/08 đêm**. **20/30 tệp mock cần nó.**

Trước khi vá, mở mock bằng `file://` thì `<sc-if>` không chạy ⇒
**mọi trạng thái chồng lên nhau**, `{{ }}` hiện chữ thô.

⚠️ **Nhánh `M-EMPTY-2` của phiên này đã đối chiếu 4 màn rỗng TRONG LÚC MOCK ĐANG HỎNG.**
Nó tự khai trong `docs/M-EMPTY-2-OUT.md`:

> *"bản tĩnh chồng 4 màn nên cấu trúc nút đọc từ HTML"*

Đọc mã thì **đúng chữ**. Nhưng **không thấy được bố cục, khoảng cách, thứ bậc thị giác** —
đúng ba thứ quyết định một màn nhìn có tử tế hay không.

---

## VIỆC 2 — Đối chiếu lại

**① Mở mock**

```
docs/mocks/Bốn trạng thái rỗng.dc.html
```

Bấm 4 nút dưới cùng: `1a · Dự án` → `1b · Thiết kế 2D` → `1c · Thiết kế 3D` → `1d · Trình chiếu`.
Mỗi lần phải hiện **đúng MỘT** trạng thái.

Nếu vẫn chồng lên nhau → `Cmd+Shift+R` (Chrome đang giữ bản cũ trong bộ nhớ đệm).

**② Mở app thật** ở cùng 4 màn rỗng, **chụp cạnh nhau**.

**③ So ba thứ mà đọc mã không thấy được:**

| | Soi gì |
|---|---|
| **Bố cục** | thứ tự khối · canh lề · nút chính bên trái hay phải |
| **Khoảng cách** | padding · gap giữa các khối · chiều cao nút |
| **Thứ bậc** | cỡ chữ · độ đậm · tương phản giữa tiêu đề / mô tả / nút |

**④ Lệch thì sửa CODE, không sửa mock.** Mock là **hợp đồng**.

**⑤ Kiểm luôn G2 và G4** — đặc biệt `line-height ≥ 1,5`.
Thấp hơn là **cắt mất dấu tiếng Việt**, lỗi này chỉ thấy được bằng mắt.

---

## VIỆC 3 — Xác minh tay cầm panel (nhánh `p3b` nợ lại)

Nhánh `p3b` **không xác minh được bằng mắt** — dev server bệnh §0aa, lệnh `pkill` bị chặn quyền.
Nó chỉ dám tính *"code xong + tsc sạch"*, không dám tính *"xong"* (xem `docs/M-PANEL-OUT.md`).

Server giờ đã sạch. Làm 4 bước, **chụp ảnh từng bước**:

| # | Làm | Phải thấy |
|---|---|---|
| 1 | Phím `L` mở Thư viện | Dải mảnh `‹` sát mép phải cột kệ → bấm → kệ thu, **vẫn còn dải** `›` → bấm lại nở ra |
| 2 | Sang **Thiết kế 3D** mode Vẽ 3D | Dải `‹` sát mép phải bảng lệnh, thu/mở tương tự |
| 3 | Chọn một khối → phím `I` (ẩn Inspector) | Mép phải màn **còn dải 14px** → bấm mở lại được |
| 4 | Thu kệ Thư viện → **RELOAD trang** → mở lại Thư viện | Kệ **VẪN THU** (nhớ qua `localStorage`) |

Bước nào sai thì sửa, ghi `file:dòng`.

---

## VIỆC 4 — rà 60 mock HTML thuần

> **Sửa 08/08:** bản phiếu đầu ghi *"10 mock còn lại"* — **số đó sai**. Đo lại:
> `docs/mocks/` có **80 tệp HTML**, trong đó **20 cần `support.js`** · **60 là HTML thuần**.

60 tệp HTML thuần mở bằng `file://` là chạy bình thường, không dính lỗi chồng trạng thái.

**Chỉ LIỆT KÊ, không tự sửa** — việc này là để TỔNG biết còn nợ gì:

1. Màn nào **đã dựng code rồi mà chưa từng đối chiếu** với mock?
2. Mock nào **không còn màn nào tương ứng** trong app (mock chết)?

Ghi hai danh sách vào OUT. Nếu quá 60 tệp mà không đủ thời gian, làm **20 tệp mới nhất trước**
(`ls -t docs/mocks/*.html | head -20`) và khai rõ đã rà tới đâu (N5).

---

## NGHIỆM THU

**Ảnh cho cả VIỆC 2 và VIỆC 3.**

Không có ảnh = **CHƯA VERIFY**, ghi thẳng vào OUT (N5).
Đây là phiếu mà ảnh chính là sản phẩm — báo cáo không ảnh thì bằng không.

---

## BÁO CÁO — `docs/M-MOCK-2-OUT.md`

1. Bảng 4 màn × 3 trục (bố cục / khoảng cách / thứ bậc) — lệch ở đâu, đã sửa gì, `file:dòng`.
2. Ảnh 4 bước tay cầm panel.
3. Danh sách mock chưa từng đối chiếu (VIỆC 4).
4. Mục **CHƯA VERIFY**.
5. Dòng cuối: *"Tệp OUT: `docs/M-MOCK-2-OUT.md` · dán vào phiên `p3`"* (§0ac).

**KHÔNG commit.**

---

## ⚠️ TRƯỚC KHI BẮT ĐẦU — mở worktree riêng

```bash
cd ~/Downloads/interiorflow
git worktree add ../interiorflow-wt-p3 -b feat/p3-mock-doi-chieu
cd ../interiorflow-wt-p3 && npm install && npm run dev -- -p 3015
```

Rồi mở phiên `p3` **trong thư mục `interiorflow-wt-p3`**.
