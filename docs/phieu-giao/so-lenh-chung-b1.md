# PHIẾU GIAO · B1 — SỔ LỆNH CHUNG (nền của kiến trúc lệnh 3 tầng)

Khuôn ⓪+8 ô. Đây là **B1** của `docs/TICKET-KIEN-TRUC-LENH-3-TANG.md`.

## THẺ VAI [Đ4]
- **VAI:** B1 — agent nền dữ liệu, biến `lib/commands/registry.ts` thành SỔ LỆNH DUY NHẤT.
- **PHẠM VI:** `lib/commands/registry.ts` + `lib/commands/registry.test.ts` **và chỉ hai file này**.
  ⛔ TUYỆT ĐỐI KHÔNG đụng 3 thanh công cụ (`CadToolbar` · `ToolDock3D` · `present-editor/Toolbar`)
  — đó là B2, phiếu khác, agent khác có thể đang cầm. ⛔ Không đụng `lib/vision/*` (agent HZ đang ở đó).
- **ĐIỀU KHOẢN RUỘT:** [Đ2] tái dùng, cấm registry thứ hai · [N2] đơn giản ngoài sâu trong ·
  §9 cấm nút giả (lệnh chưa chạy được phải khai lý do, không khai phím giả).

## ⓪ TIỀN ĐỀ
> **TIỀN ĐỀ:** *"`lib/commands/registry.ts` (55 CommandDef · 97 alias) đúng hình dạng để làm sổ
> lệnh duy nhất — chỉ thiếu 2 trường (`stages`, `icon`), không cần viết lại."*
Đọc `registry.ts` (đặc biệt `CommandDef` `:88-106` và parser `when` `:135`) rồi ghi **một dòng**
XÁC NHẬN / BÁC BỎ kèm file:dòng. **Thấy hình dạng không hợp thì DỪNG, báo T** — đừng cố nhét.

## ① BỐI CẢNH NGÀNH
Đo 15/08: **5 sổ lệnh song song**, `grep "lib/commands"` trong cả 3 toolbar = **0**. Hậu quả thật:
cùng một lệnh mà **Xoay** = RO ở 2D nhưng **Q** ở 3D · **Chép** = CO nhưng **D** · **Đo** = DI
nhưng **T** · **Chọn** = Esc nhưng **V**. KTS học phím ở 2D, sang 3D bấm sai — **chi phí học lại**,
đúng cái Hoà gọi "3 chặng như 3 app".

## ② ĐỌC TRƯỚC
1. `lib/commands/registry.ts` — toàn bộ (nhất là `CommandDef:88-106`, `parseWhen:135`, `cmdsFor:348`)
2. `docs/TICKET-KIEN-TRUC-LENH-3-TANG.md` §1-§2 (bảng phân kỳ + phương án)
3. `components/cad/CadToolbar.tsx:56-135` — 10 mảng lệnh 2D (ĐỌC để đối chiếu, **KHÔNG SỬA**)
4. `components/render-studio/ToolDock3D.tsx:85-135` — 6 nhóm + phím 3D (ĐỌC, **KHÔNG SỬA**)
5. `lib/shortcuts.ts` — phím tắt toàn cục THẬT đang đăng ký

## ③ VÙNG FILE — đúng 2 file. Đọc thì rộng, ghi thì hẹp.

## ④ VIỆC
1. **Thêm 2 trường vào `CommandDef`** (additive, 55 lệnh cũ không được vỡ):
   · `stages: ('concept'|'render'|'present')[]` — lệnh sống ở chặng nào
   · `icon?: string` — tên icon lucide, để 3 chặng không thể vẽ khác nhau
   ⚠️ Parser `when` hiện chỉ hiểu `KEY==VALUE`/`KEY!=VALUE` (`:135`) — **KHÔNG nâng parser** thành
   ngôn ngữ biểu thức; `stages` là mảng dữ liệu, không nhét vào `when`.
2. **Khai 9 LỆNH CHUNG** với `stages` đủ 3 chặng, tên/icon/phím **thống nhất một bản**:
   `Chọn · Dời · Xoay · Chép · Lật · Xoá · Hoàn tác/Làm lại · Đo · Chữ`
   Tiêu chí vào nhóm chung: **hành vi giống nhau ở cả 3 chặng** (không phải "hay dùng").
3. **Chốt phím thắng** cho các cặp phân kỳ, ghi lý do ngay trong code:
   Xoay **RO** · Chép **CO** · Đo **DI** · Chọn **Esc**.
   Lý do T chọn phe 2D: đó là **phím nghề AutoCAD** hàng chục năm, dân vẽ đã thuộc; phím 3D
   (Q/D/T/V) là bản tự đặt gần đây, ít người quen hơn. Phím 3D giữ làm **alias**, không xoá.
4. **Lệnh chung mà chặng nào chưa có engine** → khai `when` cho nó **mờ** + **lý do đọc được**
   (§9). Cấm khai phím cho lệnh không chạy.
5. **Test**: 55 lệnh cũ còn nguyên · 9 lệnh chung có đủ 3 `stages` · **không lệnh nào trùng phím
   trong cùng một chặng** (test này quan trọng nhất — nó là cái chặn phân kỳ tái phát) ·
   alias cũ vẫn tra được.

## ⑤ RÀNG BUỘC
Không git · không sửa UI (đợt này **không có gì đổi trên màn** — đúng chủ ý, đây là việc nền) ·
`soi:tu-dien` 0 lệch mới · nhãn lệnh song ngữ đủ `[VI, EN]`.

## ⑥ NGHIỆM THU TỰ LÀM
`npx tsc --noEmit` 0 · `npm test` 0 fail · `npm run soi:tu-dien` 0 lệch ·
`npm run soi:contract` không tăng lệch.
**Bằng chứng bắt buộc dán vào báo cáo**: một bảng 9 dòng — mỗi lệnh chung kèm id · nhãn VI/EN ·
phím chốt · alias giữ lại · 3 chặng có/mờ-kèm-lý-do.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-15-B1-so-lenh-chung.md`, **khuôn 6 phần**.
## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc
## ⑦c HẠN DÙNG KẾT LUẬN
## ⑧ DÂY MÁY
Entry `hotkey-registry` (đã có). **Agent KHÔNG tự sửa registry frontier** — T flip sau audit.
