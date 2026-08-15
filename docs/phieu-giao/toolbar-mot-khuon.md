# PHIẾU GIAO · TB — L1 MỘT KHUÔN THANH CÔNG CỤ 3 CHẶNG

Khuôn ⓪+8 ô (`docs/HOP-DONG-PHOI-HOP-T.md` §3, bản 15/08).

## THẺ VAI [Đ4]
- **VAI:** TB — agent UI, hợp nhất ngôn ngữ nút của 3 thanh công cụ chặng về MỘT component.
- **PHẠM VI:** `components/ui/ToolbarChip.tsx` · `components/cad/CadToolbar.tsx` ·
  `components/render-studio/ToolDock3D.tsx` · `components/present-editor/Toolbar.tsx`.
  ⛔ KHÔNG đụng: `lib/`, engine vẽ (`CadCanvas`, `tools/`), `present-editor/PresentEditor.tsx`,
  `components/render-studio/RenderQueuePanel.tsx` (vừa ship 15/08).
- **ĐIỀU KHOẢN RUỘT:** [N2] đơn-giản-ngoài-sâu-trong · [Đ2] tái dùng cái đã có, cấm engine mới ·
  [T5] đích đến sửa được · luật §9 **cấm nút giả** (disabled phải có lý do đọc được) ·
  luật 2.1.8.l **ghost khi bật, KHÔNG tô đặc**.

---

## ⓪ TIỀN ĐỀ — T đã tự kiểm TRƯỚC khi giao, agent xác nhận lại rồi mới làm

> **TIỀN ĐỀ CỦA PHIẾU:** *"`ToolbarChip.tsx` (phiên 15/08 dựng sẵn) là nền ĐÚNG, việc còn lại
> chỉ là lắp vào 3 nơi."*
> → **T tự BÁC BỎ MỘT PHẦN** (`docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md:83` KB-1):
> KB-1 chốt **"lấy dock capsule 3D làm gốc … capsule 44/r22 → nút 34/r17"**, trong khi
> `ToolbarChip` hiện trích kiểu từ **2D** (`CadToolbar.tsx:620-645`, nút **44/36 · r999**).
> ⇒ Component **PHẢI SỬA TRƯỚC**, không lắp nguyên trạng. Nếu lắp thẳng là đóng đinh sai chốt
> vào cả 3 chặng — đắt gấp ba lần sửa bây giờ.

**Agent xác nhận lại đúng một dòng trước khi gõ code đầu tiên** (đọc `ToolbarChip.tsx` +
`CadToolbar.tsx:620-645` + KB-1). Thấy T sai chỗ nào thì **DỪNG, báo T** — làm đúng một phiếu
sai vẫn là hỏng việc.

---

## ① BỐI CẢNH NGÀNH
KTS mở IF, đi 2D → 3D → Trình chiếu và thấy **ba app khác nhau**: cùng một hành động "bật một
công cụ" mà ba chặng vẽ ba kiểu (tròn ghost · vuông tô đặc · vuông viền). Tay quen ở chặng này
sang chặng kia phải học lại — đúng phàn nàn "khó dùng" của Hoà, và là lệch **L1, nặng nhất**
trong 8 lệch của bộ nguyên tắc giao diện. Đây không phải chuyện đẹp/xấu: nó là **chi phí học
lại** đánh vào người dùng mỗi lần đổi chặng.

## ② ĐỌC TRƯỚC
1. `components/ui/ToolbarChip.tsx` — toàn bộ (component nền, sẽ SỬA)
2. `components/cad/CadToolbar.tsx:620-645` — `btn()`/`btnSize()`, nguồn kiểu hiện tại
3. `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md:83-86` — **KB-1**, khuôn chốt
4. `docs/00-CHOT.md` — tìm chuỗi `bar capsule 44/r22` (§2d bo đồng tâm) + `[12/08 Hoà gật 3]`
   (thang bo 6/10/14/20 + `--r-full`)
5. `app/globals.css:100-125` (token mật độ) và `:160-180` (override cảm ứng `--tap: 44px`)
6. `components/render-studio/ToolDock3D.tsx:130-190` — chỗ `itemBtnStyle`

## ③ VÙNG FILE
Đúng 4 file ở THẺ VAI. Ngoài vùng là vi phạm **dù sửa đúng**.

## ④ VIỆC

**1. Sửa `ToolbarChip.tsx` cho khớp KB-1** (marker giữ nguyên `ToolbarChip`):
   - Kích thước nút: bỏ nấc `44 | 36` cứng, dùng **`var(--tap)`** → 32 desktop, 44 cảm ứng
     (override đã có sẵn, KHÔNG viết media query mới).
   - Bo: `RADIUS.full` — ở 32px là r16, ở 44px là r22, **tự đúng concentric** với bar 44/đệm 6.
   - Giữ nguyên: ghost-khi-bật (`accent-soft` + `accent-ring` + chữ `accent`), `touchAction`,
     `aria-pressed`, cảnh báo `disabledReason` thiếu.
   - **THÊM** `ToolbarBar` (cùng file): vỏ capsule **h44 · r-full · đệm 6 · gap 2**, có
     `<ToolbarBar.Sep/>` cho separator — KB-1 ghi rõ **bỏ gạch "|" lửng**, dùng khoảng trắng
     hoặc vạch cao ≤20 canh giữa.

   > 🔧 **T đã quyết, agent KHÔNG bàn lại:** KB-1 ghi nút "34" — ta dùng **32 = `var(--tap)`**.
   > Lý do: 34 không có trong hệ token; lệch 2px không ai thấy, còn một con số ngoài thang thì
   > sống mãi trong code. Bù lại đệm 6 (thay 5) để bar vẫn đúng 44 và concentric vẫn khít.

**2. Áp vào 3D `ToolDock3D.tsx`** — làm TRƯỚC vì KB-1 lấy nó làm gốc:
   thay `itemBtnStyle` bằng `ToolbarChip`. **Sửa luôn 2 vi phạm đang có**: nút bật đang
   `background: var(--accent)` tô đặc (trái 2.1.8.l → đổi sang ghost) và màu chữ `t3/t5`
   (→ `t2`, thang chuẩn). Giữ nguyên hành vi thu/mở + luật "thu gọn chỉ hiện nút có hành vi thật".

**3. Áp vào 2D `CadToolbar.tsx`** — `btn()`/`btnSize()` chuyển thành lời gọi `ToolbarChip`.
   ⚠️ Đây là chặng ĐANG ĐÚNG nhất: **thị giác desktop gần như không được đổi** ngoài 36→32.
   Sketch (chạm) vẫn phải ra 44 qua token. Đổi nhiều hơn thế = làm hỏng chỗ đang tốt.

**4. Áp vào Trình chiếu `present-editor/Toolbar.tsx`** — hàm dựng nút quanh `:917`/`:961-964`
   (h36 r10) chuyển sang `ToolbarChip`. File 1477 dòng: **CHỈ đụng phần dựng nút của thanh công
   cụ**, không đụng modal/panel phía dưới (`:1230+`).

**5. Nút nào đang `disabled` mà không có lý do → cấp `disabledReason` thật.** Không bịa lý do:
   không tra được vì sao mờ thì **giữ nguyên + ghi vào báo cáo**, đừng chế chữ cho qua §9.

## ⑤ RÀNG BUỘC
Không `git` (T commit) · không tự mở server mới (**dùng cổng 3000**, T đã dừng server cũ) ·
màu chỉ qua CSS var, **cấm hex inline** (luật đang có 193 vi phạm, đừng thêm) ·
mọi icon phải có nhãn/aria (NT-8/K14) · **không dùng chữ "tự động"** trong chuỗi UI ·
reduce-motion thắng mọi transition.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit                 # phải 0 lỗi
npm test                         # 0 fail
npm run soi:hinh-hoc             # KHÔNG được tăng số "ngoài thang" (nay 10/1010)
npm run soi:thao-tac             # KHÔNG được tăng 31 focus-visible / 193 hex
npm run soi:tu-dien              # 0 lệch
```
**Browser thật, cổng 3000, viewport 1440×900** (hẹp hơn app rơi vào "Tổng quan — chỉ đọc"):
đi đủ **3 chặng**, chụp mỗi chặng 1 ảnh thanh công cụ, lưu
`docs/bao-cao-phien/anh/2026-08-15-TB-{2d,3d,present}.png`. Kiểm bằng mắt: **ba chặng nhìn ra
cùng một họ nút**; nút đang bật là ghost (KHÔNG mảng đặc) ở cả ba.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-15-TB-toolbar-mot-khuon.md`, **khuôn 6 phần** (`docs/CLAUDE.md`).

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc, trống cũng phải ghi "không có"
Nút nào chưa dám đổi vì không rõ hành vi · chỗ nào thị giác lệch mà chưa biết đúng/sai ·
file nào chưa đọc mà có thể lật kết luận.

## ⑦c HẠN DÙNG KẾT LUẬN
"Kết luận này hết đúng khi ___" (vd: khi `khung-mot-khuon` đổi lại vị trí thanh công cụ, hoặc
khi Hoà duyệt mắt và bác khuôn nút).

## ⑧ DÂY MÁY
Entry `toolbar-mot-khuon` (đã mở, đợt 9). **Agent KHÔNG tự sửa registry** — T flip sau audit.
