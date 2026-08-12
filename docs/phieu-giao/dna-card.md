# PHIẾU GIAO VIỆC — V2 · `dna-card` (Thẻ DNA Thiết kế) — Đợt 4, 12/08/2026

## ① BỐI CẢNH NGÀNH
Gu của một dự án nằm rải trong đầu KTS chủ trì + vài moodboard rời — không truyền được cho đội, không kiểm được ("đúng concept chưa?" không ai trả lời được vì concept chưa từng được GHI), không nuôi được máy. Thẻ DNA Thiết kế = bản chưng cất CÓ NGUỒN của gu một phương án: N thẻ/dự án. Nuôi: Story Set chương 2 (DNA board) · moodboard · góp ý concept (12.4: kiểm concept = so với ĐỀ BÀI ĐÃ GHI). ⭐MVP — "linh hồn" TriTueDuAn.

## ② ĐỌC TRƯỚC (bắt buộc)
1. `docs/NC-KTS-SANPHAM-IF-2026-08-11.md` — định nghĩa Thẻ DNA + 8 LỚP (lấy đúng 8 lớp từ đây, không tự chế).
2. `docs/CHOT-DESIGN-DNA-CAMERA-2026-08-10.md` — Design DNA trích hình thái/motif CÓ NGUỒN, tách khỏi Material Intelligence; cờ measured/inferred/verified.
3. `docs/00-CHOT.md` mục [12/08 group-by]: dna-card + auto-define + company-dna-pack = MỘT ENGINE CHƯNG CẤT chung (trích dữ liệu có nguồn → cấu trúc → cờ 3 nấc → người duyệt) với 3 mặt tiền. **V1 chỉ làm mặt tiền DỰ ÁN, nhưng engine phải generic** — viết một lần.
4. `prisma/schema.prisma:278` — model LibraryAsset (palette/caption/tags/usage) + comment vì sao KHÔNG thêm cột (P2022 khi client chung).
5. `lib/library/` — đường đọc LibraryAsset qua API.
6. Cách repo lưu file dữ liệu per-project (tìm pattern ghi file trong `lib/` — vd disk-sync/uploads) để chọn chỗ lưu JSON.

## ③ VÙNG FILE
ĐƯỢC: `lib/distill/**` (MỚI) · `lib/dna/**` (MỚI) · `app/api/**/dna/**` (route MỚI) · `components/dna/**` (MỚI) · nối đúng MỘT điểm vào trang Tổng quan dự án `app/projects/[id]/overview/**` (thêm import + section, không đảo layout).
CẤM: `prisma/schema.prisma` (TUYỆT ĐỐI — không model/cột mới, đọc comment :279) · `lib/three` · `lib/present-editor` · `components/library` (đọc thì được, sửa thì không) · `components/render-studio`.

## ④ VIỆC (interface T thiết kế — hợp đồng)
1. **Engine chưng cất generic** `lib/distill/`: input = nguồn có provenance (`{ kind:'image', assetId, palette, caption, tags }` | `{ kind:'text', ... }`) → output cấu trúc từng trường kèm `trangThai: 'measured'|'inferred'|'verified'` + `nguon: string[]` (assetId/đường dẫn). Không phụ thuộc khái niệm DNA — công ty/cấu kiện dùng lại được sau. MARKER: `DistillEngine`.
2. **Type Thẻ** `lib/dna/`: `DesignDnaCard` đúng 8 LỚP theo NC-KTS-SANPHAM; mỗi lớp: giá trị + trạng thái 3 nấc + nguồn[]. N thẻ/dự án (mỗi phương án một thẻ, có `name`). MARKER: `DesignDnaCard`.
3. **Lưu trữ KHÔNG bảng mới**: JSON per project theo pattern ghi file sẵn có của repo (ghi rõ trong báo cáo đã chọn chỗ nào + vì sao). API `GET/PUT` theo projectId (+ danh sách thẻ).
4. **Distiller v1 RULE-BASED 0-key**: gom palette/caption/tags từ LibraryAsset của dự án (usage ref) → đề xuất các lớp màu/vật liệu/phong cách gắn cờ `inferred`; KHÔNG gọi AI cần key (chừa hook một hàm). Người sửa/confirm → `verified`. Thiếu nguồn → lớp để TRỐNG, không đoán bừa (khuôn scaffolder).
5. **UI Thẻ DNA** trong Tổng quan dự án: 8 lớp + badge trạng thái 3 nấc + nút "Chưng cất từ ảnh dự án" + sửa tay từng lớp + tạo thẻ mới. CẤM chấm điểm ("bố cục 7/10") · CẤM nói xu hướng không dẫn nguồn (luật 12.3) · trung tính (không mặc định gu studio nào).
6. **Test**: distill rule-based (có nguồn/thiếu nguồn/nhiều nguồn mâu thuẫn → giữ cả hai + inferred) · round-trip JSON · API handler.

## ⑤ RÀNG BUỘC
Không git · không dev server · không prisma · token/thang bo `--r-*` · 2 theme · ngôn ngữ theo SPEC-NGON-NGU (hành động trước, ≤12 từ, kèm nút) · LUẬT TRUNG TÍNH.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
node_modules/.bin/sucrase-node lib/distill/*.test.ts
node_modules/.bin/sucrase-node lib/dna/*.test.ts
grep -rn "DesignDnaCard\|DistillEngine" lib | head -5
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-12-V2-dna-card.md` — khuôn 2 giá trị; kết quả lệnh dán nguyên văn; quyết định tự chọn + lý do; CHƯA LÀM nói thẳng; chạm biên liên chặng (vd cần field Prisma, cần đụng Story Set) → DỪNG + đề xuất lên T.

## ⑧ DÂY MÁY
Entry `dna-card` (bangChung: dir `lib`, mẫu `DnaCard|DesignDnaCard`). Không tự sửa registry.
