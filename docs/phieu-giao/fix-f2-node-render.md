# PHIẾU GIAO VIỆC — R · `fix-f2-node-render` — 13/08/2026

## ① BỐI CẢNH NGÀNH
Finding F2 dogfood #1 (bug thật, tái hiện + fix bằng tay 13/08): node Sketch/Clay→Render của IF
truyền `guidance_scale` mặc định **15** (FLUX chuẩn 3.5–4 — mức 15 phá control) và **không truyền
`image_size`** khớp ảnh control (fal ép landscape_4_3 → depth/canny map méo, mất bám khối).
Hậu quả người dùng: "tính năng xài hoài không ra chất lượng" — cấm kỵ ②. Công thức đúng đã kiểm
chứng bằng 15 job thật (v4–v6 bám chuẩn): guidance 3.5–4 + image_size khớp tỉ lệ ảnh control.

## ② ĐỌC TRƯỚC
1. `docs/bao-cao-phien/2026-08-13-DOGFOOD-1-findings.md` mục F2 (bằng chứng + số).
2. `lib/nodes/registry.ts` — node `ai.sketch2render` (~:293) + `ai.clay2render` (+ `exterior`,
   `styleTransfer` nếu cùng bệnh): params slider guidance default 15; hàm `aiImage`.
3. `lib/ai/models.ts` AI_TASKS (model từng task — guidance đúng THEO model, không một số cứng).
4. `lib/ai/client.ts` `runImageJob` (input đi qua đâu) — image_size chèn ở tầng node input.

## ③ VÙNG FILE
ĐƯỢC: `lib/nodes/registry.ts` · `lib/nodes/*.test.ts` (nếu có khuôn test) · `lib/ai/models.ts`
(CHỈ thêm metadata guidance mặc định per-task nếu chọn cách đó).
CẤM: `lib/ai/providers/**` · `app/api/**` · mọi thư mục khác.

## ④ VIỆC
1. Guidance mặc định của các node control (sketch2render/clay2render/exterior): 15 → **3.5–4**
   (đặt per-task cạnh AI_TASKS cho khỏi lạc; slider giữ range nhưng default đúng). Node img2img
   (styleTransfer/staging) kiểm lại default hợp model (không đổi bừa — ghi lý do).
2. **`image_size` khớp ảnh control**: trước khi submit, đọc kích thước ảnh control (dataURL/URL →
   Image load, client-side) → truyền `image_size {width,height}` scale về ≤1024 cạnh dài, GIỮ TỈ LỆ;
   ảnh đọc kích thước thất bại → bỏ qua field (hành vi cũ), không chặn job.
3. Marker: chuỗi `image_size` + comment trỏ F2. Test thuần cho hàm scale-tỉ-lệ nếu tách được.

## ⑤ RÀNG BUỘC
Không git · không dev server · không prisma · không đổi hình dạng input khác của job.
Điều khoản triết lý: **[T6]** đo được mới tin (số từ 15 job thật) · **[N1-②]** chặn cấm kỵ
"xài hoài không ra chất lượng" · **[Đ2]** chỉ nối dây công thức đã kiểm chứng, không sáng tác.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
grep -n "image_size" lib/nodes/registry.ts | head
node_modules/.bin/sucrase-node <test nếu tạo>
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-R-fix-f2.md` — khuôn 2 giá trị; default mới từng node + lý do.

## ⑧ DÂY MÁY
Entry `fix-f2-node-render` (file lib/nodes/registry.ts, mẫu `image_size`). Không tự sửa registry.
