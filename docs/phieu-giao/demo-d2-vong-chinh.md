# PHIẾU GIAO · D2 — VÒNG CHỈNH PHỐI CẢNH LIÊN CHẶNG: ảnh deck → node Grounded → thay đúng chỗ (mảnh 2)

## THẺ VAI [Đ4]
- **VAI:** D2 — agent wiring liên chặng theo interface T đã chốt (dưới), KHÔNG tự chế interface khác.
- **PHẠM VI/TRẦN:** cấp F. Vùng: `components/present-editor/**` (nút + hook) · `lib/nodes/**` (gieo node + hook kết quả) · `lib/store.ts`/flow API CHỈ GỌI hàm sẵn có (thêm hàm mới vào store nếu bắt buộc — additive, khai rõ). KHÔNG đụng `lib/present-editor/pdf-import.ts` (agent D1 đang làm song song) · KHÔNG đụng lib/grounded-render ruột.
- **BIÊN → DỪNG:** không làm được đường tự-động-quay-về (deck nghe kết quả node) trong một phiên → làm nút "Nhận ảnh đã chỉnh" bán tự động ở phía deck (poll/refresh linked asset) và KHAI THẬT — cấm giả tự động [T0][T5].
- **ĐIỀU KHOẢN RUỘT:** [T1] một nguồn: sửa asset — KHÔNG copy ảnh rời · [T5] người bấm từng bước, có undo · [T2] tái dùng node ai.regionrender, cấm engine mới.

## ① INTERFACE T CHỐT (cấp L — thi hành đúng)
1. Trên `ImageElement` có `assetId` trong Trình chiếu: nút **"Chỉnh phối cảnh ✨"** (Inspector + context menu — marker `magic-phoi-canh`).
2. Bấm → gieo vào flow chặng 2 MỘT node `ai.regionrender` (kèm node ảnh nguồn nếu cần input) mang metadata `{assetId, deckId}` — rồi điều hướng sang chặng 2 focus node đó (tái dùng cơ chế deep-link/goStage sẵn có; xem focus-entity-doc 12/08).
3. Người dùng chỉnh (mask + phiếu duyệt + inpaint — luồng Grounded v0 sẵn) → node ra ảnh kết quả.
4. Đường về: khi node hoàn tất, ghi `setLinkedAssetSrc(deck, assetId, ảnh_mới)` → mọi element giữ NGUYÊN frame/vị trí, chỉ đổi ruột ảnh [đúng lời Hoà: "thay đúng vị trí và kích khu vực ảnh cũ"]. Ưu tiên tự động qua callback/completion hook của node engine nếu có chỗ cắm sẵn; không có → nút "Nhận ảnh đã chỉnh" trên element (kiểm asset mới theo assetId) — bán tự động trung thực.
5. Provenance: asset sau chỉnh ghi thêm bước {loai:'grounded-render', nodeId, luc} — gia phả không đứt.

## ② ĐỌC TRƯỚC
`lib/present-editor/linked-assets.ts` (setLinkedAssetSrc/attachElementToAsset — API gọi) · `lib/nodes/defs/grounded-render.ts` (node input/output thật) · cách flow store thêm node bằng code (grep addNode/createNode trong lib/store, components/FlowCanvas) · cơ chế chuyển chặng + focus (lib/resume, focusEntity, StageSwitcher) · `components/present-editor/Inspector.tsx` (chỗ đặt nút — cạnh cụm ảnh, Inspector.tsx:1383 có tiền lệ renderRecipeImage).

## ④ NGHIỆM THU TỰ LÀM
tsc 0 · test liên quan 0 vỡ · soi:tu-dien 0 mới · mô tả từng bước luồng THẬT chạy được đến đâu (bước nào máy, bước nào người bấm) — T sẽ dogfood end-to-end bằng PDF thật sau khi cả D1+D2 về.

## ⑦⑧
Báo cáo `docs/bao-cao-phien/2026-08-14-D2-vong-chinh.md` — khuôn chuẩn + sơ đồ luồng 5 bước thật. KHÔNG git/server. Entry cha `demo-pdf-render-roundtrip` — T flip sau dogfood.
