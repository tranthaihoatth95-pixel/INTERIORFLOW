# PHIẾU P-C · BA THANH CÔNG CỤ ĐỌC CHUNG MỘT SỔ LỆNH (bước B2)

> T soạn 16/08 theo khuôn `docs/HOP-DONG-PHOI-HOP-T.md` §3. Phiếu TỰ CHỨA.

## ⓪ TIỀN ĐỀ — trả lời TRƯỚC khi làm

1. TIỀN ĐỀ: *"Có 5 SỔ LỆNH SONG SONG — `lib/commands/registry.ts` (55 lệnh/97 alias, chỉ `AppCommandPalette` đọc) · `CadToolbar` 10 mảng tự khai · `ToolDock3D` 6 nhóm + 16 phím gõ cứng · `present-editor/Toolbar` tự khai · một `CommandPalette` THỨ HAI đọc `NODE_DEFINITIONS`. `grep 'lib/commands'` trong cả 3 toolbar = 0."*
2. TIỀN ĐỀ: *"B1 ĐÃ XONG 15/08 — `CommandDef` đã có `stages` + `icon` additive, đã khai 10 dòng lệnh chung (Chọn·Dời·Xoay·Chép·Lật·Xoá·Hoàn tác·Làm lại·Đo·Chữ) với `when()` khai THẬT theo engine sẵn có."*
3. TIỀN ĐỀ: *"`components/ui/ToolbarChip.tsx` đã tồn tại và đã dùng ở cả 3 chặng (commit `96a3913`), nhưng `ToolbarBar` chưa wire container."*
4. TIỀN ĐỀ ⚠️ **quan trọng nhất, đừng làm sai**: *"2D và 3D KHÔNG cùng cơ chế nhập — 2D GÕ LỆNH kiểu AutoCAD (`RO`+Enter, `shortcuts.ts` không có phím đơn cho rotate), 3D PHÍM ĐƠN (`tool3d.ts` Q→rotate). Không hợp nhất bằng cách chọn phe thắng."*

→ Mỗi tiền đề `[XÁC NHẬN | BÁC BỎ | KHÔNG CÓ BẰNG CHỨNG]` + file:dòng. **Bác bỏ thì DỪNG, báo T.**

## ① BỐI CẢNH NGÀNH
Hoà phàn nàn đúng một câu: ***"3 chặng như 3 app · khó dùng"***. Gốc bệnh KHÔNG phải bo góc —
là **5 sổ lệnh song song**. Phân kỳ đo được: Xoay `RO`/`RO`/**Q** · Chép `CO`/`CO`/**D** ·
Đo `DI`/`DI`/**T** · Chọn `Esc`/**V**. Học phím ở 2D sang 3D bấm sai — đó là **chi phí học lại**,
không phải chuyện thẩm mỹ. Mọi app nghề (AutoCAD · Blender · Photoshop) đều có MỘT sổ lệnh.

## ② ĐỌC TRƯỚC
- `docs/TICKET-KIEN-TRUC-LENH-3-TANG.md` — **toàn bộ lộ trình B1→B5, việc này là B2.**
- `docs/00-CHOT.md` mục **15/08 "KIẾN TRÚC LỆNH 3 TẦNG"** — có 🔴 ĐÍNH CHÍNH BẢN CHẤT về 2 cơ chế nhập.
- `lib/commands/registry.ts` (kết quả B1) · `components/cad/CadToolbar.tsx` ·
  `components/render-studio/ToolDock3D.tsx` · `components/present-editor/Toolbar.tsx` ·
  `components/ui/ToolbarChip.tsx`.
- Hiến pháp giao diện NT-1..18 + KB-1..4 (2 file trong `docs/nc/`), đặc biệt **KB-1: dock capsule
  3D làm GỐC**.

## ③ VÙNG FILE
✅ `lib/commands/**` · `components/ui/Toolbar*.tsx` · `components/cad/CadToolbar.tsx` ·
   `components/render-studio/ToolDock3D.tsx` · `components/present-editor/Toolbar.tsx`
⛔ KHÔNG đụng `components/settings/` (P-A) · KHÔNG đụng `lib/review/` (P-B) · KHÔNG đụng
   engine vẽ (`components/cad/CadCanvas.tsx`, `lib/cad/tools/`) · KHÔNG đổi khoá kỹ thuật
   (`sketch`/`pro`/`revit`, `concept`/`render`/`present`) — đổi khoá là **vỡ persist**

## ④ VIỆC
1. **Ba toolbar THÔI SỞ HỮU danh sách lệnh, chỉ ĐỌC `lib/commands/registry.ts`** —
   MARKER: `grep 'lib/commands'` trong cả 3 file toolbar phải **> 0** (nay là 0).
2. **Xoá danh sách lệnh tự khai** trong 3 toolbar sau khi đã đọc được từ registry. Lệnh nào
   registry chưa có thì **THÊM VÀO registry**, không giữ lại danh sách riêng.
3. **Bỏ bảng lệnh ⌘K THỨ HAI** (cái đọc `NODE_DEFINITIONS`) — gộp về một bảng. Node vẫn tra
   được, nhưng qua cùng một cửa.
4. **HAI ĐƯỜNG NHẬP CHO MỖI LỆNH, KHÔNG CHỌN PHE**: mỗi `CommandDef` mang **cả alias gõ**
   (`RO`, `CO`, `DI` — kiểu AutoCAD) **lẫn phím đơn** (`Q`, `D`, `T` — kiểu 3D). Chặng nào bật
   đường nào là việc của chặng đó; sổ lệnh giữ cả hai.
5. **Xử trước cạm bẫy phím-đơn-cướp-ký-tự-đang-gõ**: bấm `R` để xoay thì không gõ được `REC` —
   mở rộng luật keydown-né-ô-nhập sang cả dòng lệnh. MARKER: test riêng cho ca này.
6. **`ToolbarBar` wire container** (việc còn nợ từ 15/08) + `IOMenu` (Mở tệp/Xuất, dùng chung
   2D + Trình chiếu) đang `r10` → đưa về đúng thang bo.
7. Test: `lib/commands/toolbar-doc-registry.test.ts` — tối thiểu 15 ca, gồm ca "cả 3 chặng cùng
   trả về đúng 10 lệnh chung" và ca "lệnh chưa đủ điều kiện thì hiện MỜ KÈM LÝ DO, không mất tích".

## ⑤ GIAO DIỆN — BẮT BUỘC
1. **Mock trong Claude Design TRƯỚC khi code.** Tool `DesignSync` (deferred — nạp bằng `ToolSearch`
   query `select:DesignSync`). Project **InteriorFlow · Design System**
   `b7dc14ba-1752-4821-8fc7-d519f737ac09`; nền `docs/IF-design-system-seed.html`.
2. Vẽ **cả BA thanh công cụ xếp chồng lên nhau trong một khung** để nhìn phát là thấy chúng
   cùng một khuôn — đây chính là bằng chứng Hoà cần cho câu *"3 chặng như 3 app"*.
3. Đủ **2 theme sáng + tối**. Vẽ đủ trạng thái: thường · hover · đang bật · **mờ kèm lý do**.
4. Token: bar 44/r22 · đệm 6 · nút `var(--tap)` 32/r16 desktop → 44/r22 khi chạm; concentric
   `rInner = rOuter − pad`; **cấm đẻ số ngoài token** (đã có tiền lệ: KB-1 ghi "nút 34" mà 34
   không tồn tại trong hệ token — T đã xử 15/08, đừng lặp lại).
5. Nút bật dùng **ghost, KHÔNG tô đặc** (luật 2.1.8.l). NT-8 icon luôn có nhãn ở sidebar.
6. Lưu `docs/mocks/mock-3-thanh-cong-cu-mot-khuon.html` + đẩy lên Claude Design.

## ⑥ RÀNG BUỘC
- **KHÔNG git · KHÔNG tự mở dev server.**
- **Additive trước, xoá sau**: cho toolbar đọc registry và chạy đúng ĐÃ, rồi mới xoá danh sách cũ
  — không xoá trước rồi vá.
- Chữ hiển thị theo từ điển (`npm run soi:tu-dien` phải 0 lệch); cấm chữ "tự động".
- TRIẾT LÝ `docs/TRIET-LY-IF.md` — trích mã: **[N2]** đơn giản ngoài · sâu trong ·
  **[Đ2]** nhìn vào trong trước (B1 đã làm nền, cấm dựng registry thứ sáu).

## ⑦ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
npm test
npm run soi:tu-dien
npm run soi:hinh-hoc
npm run soi:thao-tac
```
`npm test` chạy **toàn repo** (việc này đụng 3 chặng, không được chỉ chạy test của mình).
Dán **nguyên văn** kết quả vào báo cáo.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc, trống cũng ghi "không có"
## ⑦c HẠN DÙNG KẾT LUẬN — *"kết luận này hết đúng khi ... xảy ra"*

## ⑧ DÂY MÁY
Entry: **`hotkey-registry`** (B2 của ticket lệnh 3 tầng). Agent **KHÔNG tự sửa** registry —
T flip sau audit.

## Báo cáo
`docs/bao-cao-phien/2026-08-16-P-C-toolbar-so-lenh.md`, khuôn **6 phần**.

---

## ⑨ ĐỒ NGHỀ ĐƯỢC TRANG BỊ (T tra kho 16/08 — skill chính chủ Anthropic, plugin `design`)
Gọi bằng tool **Skill**, ví dụ `Skill(skill: "design:design-critique")`. Bắt buộc dùng, không phải tuỳ chọn:

· `design:design-system` — đúng bài của phiếu này: hợp nhất ba khuôn rời thành một hệ
· `design:design-critique` — tự chấm, trục **consistency** là then chốt (bằng chứng cho câu "3 chặng như 3 app")
· `design:accessibility-review` — nút "mờ kèm lý do" phải đọc được bằng bàn phím và trình đọc màn hình, không phải chỉ mờ đi cho có
· `design:ux-copy` — nhãn lệnh + câu lý do khi lệnh chưa đủ điều kiện

⛔ **CẤM dùng `anthropic-skills:brand-guidelines`** — nó áp bộ nhận diện của **Anthropic**, trái
LUẬT TRUNG TÍNH của IF (sản phẩm bán ra, không đeo thương hiệu bên thứ ba). IF có token riêng ở
`app/globals.css`, đó là nguồn duy nhất.
⛔ **CẤM `theme-factory`/`canvas-design`** cho việc này — chúng sinh gu riêng, sẽ chọi hệ token IF.

**Thứ tự dùng:** đọc skill design-system/ux-copy TRƯỚC khi vẽ mock → vẽ mock → **tự chấm bằng
`design:design-critique` + `design:accessibility-review` TRƯỚC khi nộp** → sửa → mới code.
Báo cáo phải ghi rõ 2 skill chấm đó bắt được lỗi gì và đã sửa gì.
