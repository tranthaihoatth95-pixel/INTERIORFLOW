# P-G · Ô GIẢI NGHĨA CÓ HÌNH + TRỤC PHẢI VÀO BỘ NỀN

> Phiếu theo khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md` (ô ⓪/⓪b + 8 ô). Tự chứa — không cần hỏi T.
> **THẺ VAI [Đ4]:** bạn là **phiên phụ cấp CHẶNG/LUỒNG**, vùng `components/ui` + `docs/mocks`.
> Chạm biên liên chặng (đổi hợp đồng lệnh, đổi registry, đổi token globals.css) thì **DỪNG + đề xuất lên T**, không tự quyết.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG — trả lời TRƯỚC mọi thứ khác

Bạn làm việc **trong cây chính** `/Users/tranben/Downloads/interiorflow` (KHÔNG worktree riêng).

```bash
git log --oneline -1          # phải ra: 895fbaf
git rev-list --count HEAD..main   # phải ra: 0
```
Lệch > 0 → **DỪNG NGAY**, báo T, không kiểm tiếp ⓪.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận/bác bỏ, một dòng mỗi ý

1. *"`components/ui/Tooltip.tsx` đã có sẵn khung `label` + `desc` + `shortcut` + `side`, nên việc thật chỉ là **thêm ô HÌNH** + quy tắc đặt bên cạnh — KHÔNG dựng cơ chế chú thích thứ hai."*
2. *"`components/ui/ToolbarChip.tsx:137` có `if (disabled) return button;` và `:124` nhét lý do vào `title={disabled ? disabledReason : undefined}` — tức **đúng ca cần ô giải nghĩa nhất (nút mờ + lý do) lại là ca duy nhất đi vòng qua Tooltip**. Không sửa nhánh rẽ này thì ô giải nghĩa dựng xong vẫn không bao giờ hiện cho nút mờ."*
3. *"`title` của trình duyệt không hiện trên cảm ứng và trình đọc màn hình đọc không nhất quán ⇒ lý do phải đi đường `aria-describedby` + phần tử ẩn, KHÔNG đi `title`."*

Bác bỏ bất kỳ ý nào → **DỪNG**, báo T kèm `file:dòng`. Làm đúng một phiếu sai vẫn là hỏng việc.

---

## ① BỐI CẢNH NGÀNH

IF có hàng chục lệnh dựng hình. KTS **không đọc tài liệu**, họ nhìn là làm. Chốt Hoà 16/08 (ảnh menu kiểu After Effects): trỏ vào một lệnh thì ô giải nghĩa hiện **bên cạnh**, gồm **tiêu đề → HÌNH MINH HOẠ THAO TÁC → câu mô tả**. Hình đứng trước chữ. Với app nhiều lệnh, đây là khác biệt giữa *phải học* và *nhìn là biết*.

Nó còn **giải một chỗ IF đang vướng**: luật đã chốt *"lệnh chưa đủ điều kiện thì hiện MỜ KÈM LÝ DO"*, nhưng lý do nhét vào đâu? Nhãn không đủ chỗ, và luật ngôn ngữ chỉ dẫn cấm nhãn quá 12 từ. **Ô giải nghĩa chính là chỗ lý do sống.**

## ② ĐỌC TRƯỚC (bắt buộc)

| File | Vì sao |
|---|---|
| `components/ui/Tooltip.tsx` (293 dòng, đọc HẾT) | nền phải mở rộng; chú ý portal `document.body`, `side:'right'` tự lật sang `left` khi hết chỗ (`lib/ui/tooltip-position.ts`) |
| `components/ui/ToolbarChip.tsx:100-144` | cạm bẫy nút mờ |
| `app/globals.css` khối `.if-tooltip-*` (~dòng 1519-1670) | CSS hiện có: `.if-tooltip-rich` max 260px, `.if-tooltip-head/title/kbd/desc`, `.if-tooltip-static` cho cảm ứng |
| `docs/00-CHOT.md` — 3 chốt ngày 16/08: **"TRỤC PHẢI VÀO BỘ NỀN, CÓ Ô GIẢI NGHĨA"** · **"ƯU TIÊN HÌNH/KÝ HIỆU/ICON HƠN CHỮ"** · **"T ĐỀ XUẤT TÁCH ICON THÀNH SÁU LOẠI"** (cuối file) | ranh giới ngữ nghĩa |
| `docs/mocks/mock-bo-nen-chung.html` | bộ nền đang chờ Hoà duyệt — bản vẽ của bạn phải NỐI vào nó, cùng token, cùng ngôn ngữ |
| `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` mục NT-8, NT-16 | hiến pháp giao diện = cửa nghiệm thu |

## ③ VÙNG FILE — KHOÁ PHẠM VI (ngoài vùng là vi phạm dù sửa đúng)

**ĐƯỢC ghi:**
- `components/ui/Tooltip.tsx`
- `components/ui/ToolbarChip.tsx`
- `app/globals.css` — **CHỈ** trong khối `.if-tooltip-*`, và **CHỈ THÊM** class mới. Cấm sửa/đổi/xoá biến token, cấm đụng khối khác.
- `lib/ui/tooltip-position.ts` (nếu cần chỗ đặt ô rộng hơn)
- file MỚI: `lib/ui/thao-tac-glyph.tsx` (kho hình minh hoạ) + test đi kèm
- `docs/mocks/mock-o-giai-nghia.html` (mới)
- `docs/bao-cao-phien/2026-08-16-P-G-o-giai-nghia.md` (mới)

**CẤM đụng:** `scripts/frontier-registry.mjs` · `lib/commands/*` · `components/cad/*` · `components/render-studio/*` · `components/present-editor/*` · mọi mock khác · `STATUS.md` · `docs/00-CHOT.md`.
(Hai phiên phụ khác đang chạy song song trên `components/ui/` — **P-H giữ file thanh tiến trình**, đừng chạm.)

## ④ VIỆC

### V1 — Ô giải nghĩa mọc ô HÌNH (marker: `giaiNghia`)
Thêm vào `Tooltip.tsx` prop `hinh?: React.ReactNode` (hình minh hoạ thao tác).
Thứ tự dựng trong thẻ, đúng ảnh Hoà gửi: **tiêu đề (+ phím tắt bên phải) → HÌNH → câu mô tả**.
- Có `hinh` ⇒ thẻ tự chuyển khuôn giàu (`rich`) như `desc`/`shortcut` đang làm.
- Hình là khối cố định (gợi ý 220×110, bo theo thang token), nền `var(--bg-soft)` hoặc tương đương ĐÃ CÓ — **cấm bịa hex** (luật ③ giao diện).
- `aria-hidden` cho hình: nó minh hoạ, không mang tin độc lập — tin nằm ở `desc`.

### V2 — Kho hình minh hoạ thao tác (marker: `ThaoTacGlyph`)
`lib/ui/thao-tac-glyph.tsx`: SVG inline nét mảnh, dùng `currentColor`, **KHÔNG file ảnh ngoài**.
Dựng **6 hình** đủ để chứng minh khuôn (không cần đủ mọi lệnh): `dời` · `xoay` · `chép` · `lật` · `đo` · `chọn`.
Mỗi hình vẽ **THAO TÁC** (khung + tay nắm + mũi tên chỉ hướng), không vẽ biểu tượng trang trí.
⛔ **CẤM dùng các SVG này làm nút.** Đây là **loại "Hình minh hoạ"** trong đề xuất 6 loại icon — nó **chỉ sống trong ô giải nghĩa**. Ghi ràng buộc đó vào docstring của file.

### V3 — Nút mờ đi ĐÚNG đường (marker: `disabledReason`) 🔴 quan trọng nhất
Trong `ToolbarChip.tsx`:
- **Xoá** `if (disabled) return button;` (dòng 137) — nút mờ **cũng phải** qua `Tooltip`.
- **Xoá** `title={disabled ? disabledReason : undefined}` (dòng 124).
- Thay bằng: nút mờ vẫn bọc `Tooltip`, `desc` = `disabledReason`, và lý do được nối vào nút qua **`aria-describedby`** trỏ tới một phần tử ẩn (kỹ thuật đã dùng ở phiếu toolbar trước — tra lại trong repo trước khi tự chế).
- ⚠️ **Cạm bẫy kỹ thuật**: `<button disabled>` **không bắn** `mouseenter`/`pointer` ở một số trình duyệt và **không nhận focus bàn phím**. Đo thật trước khi kết luận. Nếu đúng vậy, cách sửa đúng là **không dùng thuộc tính `disabled`** mà dùng `aria-disabled="true"` + chặn `onClick` (nút vẫn focus được, vẫn đọc được lý do). Đây là cách mọi hệ thiết kế lớn xử lý nút-mờ-có-lý-do. Bạn tự quyết, **ghi rõ lý do vào báo cáo**.
- Giữ nguyên `opacity: 0.5` (đã sửa 16/08 vì WCAG 1.4.11) và `cursor: not-allowed`.

### V4 — Trục phải vào bộ nền (marker: `trucPhaiGiaiNghia`)
**Chỉ dựng trong BẢN VẼ**, chưa động vào panel thật của các chặng (đó là biên liên chặng).
Bản vẽ phải cho thấy: danh sách lệnh ở trục phải, có **hai tầng `Cơ bản` / `Nâng cao`** (nhịp hai tầng đã chốt — cùng MỘT sổ lệnh, không phải hai bộ lệnh), trỏ vào mục nào thì ô giải nghĩa hiện **BÊN CẠNH**, không che mục đang trỏ.

### V5 — Bản vẽ (marker: `@dsCard`)
`docs/mocks/mock-o-giai-nghia.html`, **dòng đầu tiên**:
```html
<!-- @dsCard group="Ô giải nghĩa" -->
```
Bắt buộc: **đủ 2 theme** (sáng + tối, có nút gạt) · **token thật lấy từ `app/globals.css`**, cấm hardcode hex · icon lucide hoặc SVG inline · chụp được ở 1440×900.
Phải bày **cạnh nhau** để so: ① ô giải nghĩa của lệnh **dùng được** ② của lệnh **mờ có lý do** ③ trục phải hai tầng ④ ô ở cả `side=right` lẫn `side=left` (chứng minh tự lật).
T sẽ đẩy file này lên Claude Design; bạn **không có** tool `DesignSync`, đừng đi tìm.

## ⑤ RÀNG BUỘC

- **KHÔNG chạy git** (không add/commit/stash/checkout/reset). **KHÔNG khởi động dev server.**
- **KHÔNG sửa `scripts/frontier-registry.mjs`** — T flip sau audit.
- Màu qua **biến CSS**, cấm hex. Bo góc theo thang token **6/10/14/20 + `--r-full`**, `rInner = max(4, rOuter − pad)`.
- Chữ Việt: cấm hoa toàn phần, `line-height ≥ 1.5`, không tracking âm.
- Ngôn ngữ chỉ dẫn: hành động trước · **cấm jargon nội bộ lộ ra UI** · nhãn **≤ 12 từ** (câu mô tả trong ô giải nghĩa thì được dài hơn — đây là chỗ người ta **dừng lại đọc**).
- `prefers-reduced-motion` thắng mọi hiệu ứng.
- **Song ngữ VI/EN** cho mọi chuỗi mới lộ ra UI.
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`** áp cho việc này: **[T5] đích-đến-sửa-được** (lý do phải đọc được ở mọi thiết bị, không chết trong `title`) · **[N2] đơn-giản-ngoài-sâu-trong** (mặt ngoài là một ô, bên trong là kho hình) · **[Đ2] nhìn-vào-trong-trước** (mở rộng Tooltip có sẵn, cấm cơ chế thứ hai). Mở file, trích **nguyên văn** câu tương ứng vào báo cáo — nếu mã khác với T ghi thì báo lại đúng mã.

## ⑥ NGHIỆM THU TỰ LÀM

```bash
npx tsc --noEmit
npm test -- Tooltip
npm run soi:tu-dien
npm run soi:hinh-hoc
npm run soi:thao-tac
```

## ⑥b ĐIỀU KIỆN ĐÍCH — VÒNG TỰ ĐÓNG

**ĐÍCH:** `tsc` 0 lỗi · test liên quan 0 fail · `soi:tu-dien` 0 lệch · `soi:hinh-hoc` **không thêm lệch mới** · `soi:thao-tac` **không thêm lệch mới** (nợ cũ: 31 focus-visible · 193 hex — file MỚI của bạn **không được** góp thêm vào hai con số đó) · mock mở được và **tự chấm** bằng `design:design-critique` + `design:accessibility-review`.

**VÒNG:** chưa đạt → tự sửa rồi chạy lại, **trần 5 vòng**.
**QUÁ TRẦN → DỪNG**, nộp bản chưa đạt kèm bảng *"vòng nào hỏng vì gì"*. **CẤM** nộp bản sai mà khai là đạt; **CẤM** sửa test hoặc nới điều kiện cho qua cửa (luật 8 IF: sai thì báo lỗi, không ship bản sai).

## ⑦ BÁO CÁO

`docs/bao-cao-phien/2026-08-16-P-G-o-giai-nghia.md`, **khuôn 6 phần** của `docs/CLAUDE.md`:
tổng quan → chi tiết có bằng chứng `file:dòng` → tổng kết → **đánh giá khách quan (cả cái chưa được)** → ≥2 hướng khả dĩ → chọn 1 + vì sao.
Dán **nguyên văn** kết quả lệnh. Quyết định tự chọn phải kèm lý do. **Chưa làm thì nói thẳng.**

## ⑦b CHƯA CHẮC / CHƯA KIỂM — mục bắt buộc, trống cũng phải ghi "không có"

Nêu rõ: chỗ nào bạn **suy luận** chứ không **đo** · file nào chưa đọc mà có thể lật kết luận · hai nguồn mâu thuẫn thì nêu **cả hai**, **không chọn hộ T**.
Riêng V3: hành vi sự kiện của `<button disabled>` **phải là ĐO, không phải nhớ**.

## ⑦c HẠN DÙNG KẾT LUẬN

Ghi: *"kết luận này hết đúng khi …"*. Ít nhất phải phủ: khi màu nhấn thứ hai được chốt (mòng két, Hoà chưa chọn hex) · khi `hotkey-registry` B2 nối toolbar vào sổ lệnh chung · khi bộ nền `mock-bo-nen-chung.html` được Hoà duyệt hoặc bác.

## ⑧ DÂY MÁY

Entry registry: **`o-giai-nghia-co-hinh`** (T mở, bạn **không** sửa) · liên đới `hotkey-registry` (lệnh mờ kèm lý do) · `toolbar-mot-khuon` (nợ còn lại) · `kien-truc-tool-3-lop` (trục phải giữ vai Inspector edit sâu + BuildRecipe).
