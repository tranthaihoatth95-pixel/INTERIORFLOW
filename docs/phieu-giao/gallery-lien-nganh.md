# PHIẾU GIAO VIỆC — K · `gallery-lien-nganh` (Gallery liên ngành) — Đợt 4, 12/08/2026

## ① BỐI CẢNH NGÀNH
KTS tìm cảm hứng bằng Pinterest/Google — ảnh rác, không nguồn, không giấy phép, không tái dùng được cho hồ sơ. Hoà chốt 12/08: GALLERY = kho ảnh tuyển LIÊN NGÀNH (kiến trúc · nội thất · cảnh quan · graphic · art), phân nhóm + bộ sưu tập xu hướng CÓ NGUỒN; là MẶT TIỀN TUYỂN CHỌN của kệ Ảnh & tài sản — **KHÔNG đẻ kho mới**; NUÔI Thẻ DNA + moodboard + Story Set chương 3.

## ② ĐỌC TRƯỚC
1. `docs/00-CHOT.md` mục [12/08 Hoà gật ④ GALLERY] — nguyên văn chốt.
2. `prisma/schema.prisma:278` model LibraryAsset + comment :279 (vì sao KHÔNG thêm cột → mọi thứ mới encode vào `tags`/`category`/`caption`).
3. `lib/library/shelves.ts` + `lib/library/types.ts` — kệ hiện có, số đếm thật (đợt 2 đã bỏ mock).
4. `components/library/` — LibrarySheet + css (chốt 07/08: tấm 960px · 3 nấc cỡ thẻ · cột thông số trượt khi chọn).
5. `app/library/` — route hiện có (trang tổng + ingest).
6. Script seed 17 ảnh Unsplash offline (tìm trong `scripts/`) — khuôn seed + đường tải offline.

## ③ VÙNG FILE
ĐƯỢC: `app/library/**` · `components/library/**` · `lib/library/**` · `scripts/**seed**` (bổ tag cho seed).
CẤM: `prisma/schema.prisma` · `components/present-editor` · `lib/present-editor` · `lib/three` · `components/render-studio` · `lib/dna` · `lib/distill`.

## ④ VIỆC
1. **Trang Gallery** trong `app/library`: lưới ảnh tuyển, PHÂN NHÓM liên ngành (kiến trúc · nội thất · cảnh quan · graphic · art) đọc từ `category`/`tags` LibraryAsset qua API sẵn có — số đếm THẬT. MARKER: component `GalleryLienNganh` (chuỗi `gallery-curated` trong file).
2. **Quy ước tag chuẩn** (ghi thành hằng trong `lib/library`): nhóm ngành `nganh:<kien-truc|noi-that|canh-quan|graphic|art>` · giấy phép `license:<cc0|unsplash|studio|ai|user>` · nguồn `nguon:<chuỗi tự do>` · bộ sưu tập `bosuutap:<slug>`.
3. **Bộ sưu tập xu hướng CÓ NGUỒN**: thẻ bộ sưu tập gom ảnh theo `bosuutap:*`; ảnh THIẾU tag nguồn/giấy phép → không vào được bộ sưu tập (chặn ở hàm + thông điệp UI đúng SPEC-NGON-NGU). Badge giấy phép trên thẻ ảnh; filter theo nhóm ngành + giấy phép.
4. **Chặn Pinterest**: mọi ô nhập URL trong vùng library từ chối domain pinterest (thông điệp: lý do + hướng thay thế — kho CC0/Unsplash).
5. **Đường NUÔI**: trên thẻ ảnh, hành động "Dùng cho moodboard / Thẻ DNA" = copy `assetId` chuẩn (`imgIdFromKey`, xem lib/img-id.ts) hoặc emit sự kiện sẵn có — KHÔNG xây moodboard/DNA ở phiếu này.
6. **Empty state làm được việc** + nút Nhập từ Kho chung (luật X2). Seed 17 ảnh: bổ tag `nganh:*` + `license:unsplash` + `nguon:*` vào seed script, giữ offline.

## ⑤ RÀNG BUỘC
Không git · không dev server · không prisma · KHÔNG thêm cột DB · ảnh nguồn sạch (cấm Pinterest/ảnh khách) · token màu + thang bo `--r-*` · 2 theme · tấm thư viện giữ chốt 07/08 (960px, nổi giữa, không dính đáy) · LUẬT TRUNG TÍNH.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
node_modules/.bin/sucrase-node lib/library/*.test.ts   # (test mới của quy ước tag/bộ sưu tập)
grep -rn "GalleryLienNganh\|gallery-curated" components app | head -5
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-12-K-gallery.md` — khuôn 2 giá trị; lệnh dán nguyên văn; quyết định tự chọn + lý do; CHƯA LÀM nói thẳng; chạm biên (cần model mới, cần đụng present-editor) → DỪNG + đề xuất lên T.

## ⑧ DÂY MÁY
Entry `gallery-lien-nganh` (bangChung: dir `components`, mẫu `GalleryLienNganh|gallery-curated`). Không tự sửa registry.
