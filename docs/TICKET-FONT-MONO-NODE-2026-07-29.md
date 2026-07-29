# `2.2.85` — Bỏ font mono ở nhãn node (chỗ "cảm giác bị AI")

**Ảnh Hoà gửi**: header node *"Import Image"* — icon ảnh + chữ **mono giãn rộng**, trắng trên
gần-đen, kèm nút ▶ tím và nút ✕; dưới là ảnh sketch nội thất.

---

## 1. Gốc — có chủ ý, ghi thẳng trong code

`components/nodes/InteriorNode.tsx:264` — chú thích nguyên văn:

> `{/* header — icon flat + font mono low-tech */}`

và dòng 269:

```tsx
style={{ fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", "Fira Code", monospace' }}
```

Đây **không phải lỗi** — là lựa chọn thẩm mỹ "low-tech" có chủ đích. Nhưng nó phản tác dụng, vì
**3 lý do**, trong đó lý do thứ 2 là **kỹ thuật cứng**, không cãi được.

---

## 2. Ba lý do phải bỏ

### ① Mono trong nhãn UI = ngôn ngữ terminal, và là cliché của đúng nhóm app IF muốn khác

Mono ở nhãn không đọc ra "low-tech chic" — nó đọc ra **"công cụ lập trình"**. Và đó chính xác là
ngôn ngữ **ComfyUI và mọi node-app AI generic** đang dùng. IF định vị là **công cụ nghề cho kiến
trúc sư**, không phải dev tool. Dùng mono là tự xếp mình vào đúng nhóm muốn tách ra.

### ② XUNG KHẮC với Luật thoại `2.2.69` — đây là lý do cứng nhất

Luật thoại đã chốt: mọi node đổi sang **song ngữ Việt dẫn · Anh theo** —
`Import Image` → **`Nhập ảnh · Import Image`**.

Nhưng `SF Mono` · `Cascadia Code` · `Fira Code` đều **hỗ trợ dấu tiếng Việt rất kém** (thiếu glyph
tổ hợp như `ề`, `ữ`, `ậ`). Kết quả: chữ Việt **rơi về font fallback ngay giữa dòng** → cùng một nhãn
mà hai nửa hai font, cao thấp lệch nhau.

→ **Không bỏ mono thì không đổi tên node được.** Hai việc này phải đi cùng nhau.

### ③ Vi phạm chuẩn thiết kế vừa commit

`docs/IF-DESIGN-STANDARD-2026-07-29.md` §2, dẫn Apple HIG:

> *"Đừng thêm typeface thứ hai — SF Pro tự gánh toàn bộ phân cấp."*
> IF: **chỉ Be Vietnam Pro**, phân cấp bằng cỡ + sắc độ + tracking.

---

## 3. Nhưng mono có ĐÚNG MỘT chỗ dùng chính đáng — giữ lại

Mono tồn tại để **số thẳng cột**. Nên:

| Giữ mono | Bỏ mono |
|---|---|
| `12cr` credit · kích thước px · toạ độ · mã asset · đường dẫn file · seed | **tên node · nhãn nhóm · tên cổng vào/ra · mọi chữ đọc để hiểu** |

Thực ra chỗ giữ cũng **không cần mono** — chỉ cần `font-variant-numeric: tabular-nums` trên
Be Vietnam Pro là số đã thẳng cột, mà vẫn một font. **Ưu tiên cách này.**

---

## 4. Sửa gì

**Đổi ở `InteriorNode.tsx:267-270`:**

```tsx
// TRƯỚC
<span className="flex-1 truncate text-[11px] font-medium text-[var(--t1)]"
      style={{ fontFamily: 'ui-monospace, "SF Mono", …, monospace' }}>

// SAU — bỏ style, dùng font hệ thống app, hạ 1 bậc sắc độ
<span className="flex-1 truncate text-[11.5px] font-medium tracking-[-.005em] text-[var(--t1)]">
```

Ba chỉnh kèm theo:
- **Bỏ tracking giãn** nếu có — mono vốn đã rộng, giãn thêm là đúng dấu hiệu "tech aesthetic" giả.
- **Số credit** `{def.creditCost}cr` → thêm `tabular-nums`, giữ `text-[10px] text-[var(--t3)]`.
- **Không đổi cỡ chữ nhiều** — 11px hiện tại đúng bậc Micro/Caption của chuẩn; vấn đề là font, không
  phải cỡ.

**Quét nhất quán — 9 file đang dùng mono**, phải xử cùng đợt, không bỏ nửa vời:

```
components/nodes/InteriorNode.tsx      ← nhãn node        → BỎ
components/nodes/GroupOverlay.tsx      ← nhãn nhóm (×2)   → BỎ
components/NodeLibraryPanel.tsx        ← kiểm tra         → BỎ nếu là tên node
components/StageSelect.tsx             ← kiểm tra
components/LoginScreen.tsx             ← kiểm tra
components/IntroSequence.tsx           ← có thể GIỮ (hiệu ứng gõ chữ, cố ý)
components/cad/CadCanvas.tsx           ← GIỮ nếu là số đo toạ độ
components/cad/CadEditor.tsx           ← GIỮ nếu là số đo
lib/slide-templates.ts                 ← kiểm tra
```

---

## 5. Xếp hàng

| Mã | Việc | Xếp vào |
|---|---|---|
| **`2.2.85`** | Bỏ font mono ở mọi **nhãn chữ**, giữ `tabular-nums` cho số | **Sprint 3, GỘP CHUNG COMMIT với `2.2.69`** (quy chuẩn thoại) — Luật #6 Đồng Bộ: hai việc là **tiền đề của nhau**, tách ra thì đổi tên xong dấu vỡ, phải sửa lại lần hai |

---

*Cowork, 29/07/2026. Đọc trực tiếp `components/nodes/InteriorNode.tsx:258-282`, `GroupOverlay.tsx:42,87`.
Mã `2.2.85` là ĐỀ XUẤT — Claude Code kiểm trùng trước khi dán.*
