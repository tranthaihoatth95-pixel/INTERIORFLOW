# STATUS — InteriorFlow (13/08 đêm)

## MỞ PHIÊN MỚI: dán câu lệnh §5 HOP-DONG-PHOI-HOP-T + `npm run soi:frontier`. Đọc thêm: TRIET-LY-IF.md (hiến pháp, TRÍCH MÃ ĐIỀU KHOẢN vào mọi phiếu) · 00-CHOT 2 dòng cuối. Nhịp chuỗi nền: ~~P3 P4 P5~~ ✅✅✅ (Hoà gật P5-P6 qua chat 13/08 đêm) → **P6 IF-RNA v0 MaterialPbr** (entry `if-rna-v0` mở) → vá 3 lỗ ❌ (telemetry local-first · a11y · error-log). Món nhìn-thấy sẵn hàng: GR v1 bảng ánh xạ + núm per-mảng · 2 kho chờ dây thật (capture-sequence · lux-l6) · focus-visible (mắt design).

## Chờ tay HOÀ (xếp hàng)
1. **ĐI LÔ DUYỆT MẮT #1** — `docs/duyet-mat/LO-1-2026-08-13.md`: 48 mục gộp 7 trạm ~20 phút, trả lời "Trạm N ok/lệch" là T flip loạt 2. Duyệt phác Home v5 (SPEC-HOME-BENTO-V5) 3. Chọn ảnh render ST5 → T upscale 300dpi. (Preview Gói Hồ Sơ Sống + .zip mẫu — nay có cả kênh PDF — đã gửi trong chat.)

> Lịch sử ở `CHANGELOG.md`. Code, schema và test là nguồn kiểm chứng. IF là sản phẩm global: **2D Kỹ thuật · 3D Thiết kế · Trình bày**; Brand Kit thuộc từng dự án.

## Mục tiêu hiện tại

Đóng gói **bản desktop dùng nội bộ ổn định**, không gọi là thử nghiệm. Trung tính tuyệt đối: không brand/asset/dữ liệu khách trong UI, mẫu, output hay release; UI song ngữ VI/EN.

## Đang chạy

- **R1 nội bộ:** desktop local-first; nghiệm thu máy sạch cài/mở/lưu/nâng cấp/khôi phục; quyết định GPL/DWG theo phạm vi pháp nhân.
- **Lõi 2D↔3D:** entity có identity/type-instance/provenance và category/level thống nhất cho Wall, Floor, Ceiling, Room.
- **M1 3D:** tường hai điểm → push/pull → transform/snap/hotkey → floor/ceiling + lọc category; Library contract chung cho 2D–3D–BOQ–Present. Specs: `docs/SPEC-3D-MVP-MODELING-2026-08-11.md`, `docs/SPEC-MASTER-LIBRARY-3D-CONTRACT-2026-08-11.md`.
- **Mock 3D Library:** type/instance → editor → FlowRender → ảnh/BOQ/board; Reference Canvas có provenance. Specs: `docs/SPEC-FLOWRENDER-ELEMENT-TOOLS-2026-08-11.md`, `docs/SPEC-REFERENCE-CANVAS-3D-2026-08-11.md`.
- **Vitals V1:** toàn app: 2D kiểm/vẽ; 3D recipe/preview; Present kiểm/xuất; Library tra/import; mọi ghi có undo. Spec: `docs/SPEC-VITALS-UNIFIED-2026-08-11.md`.
- **Present/output:** chỉ mở khả năng thật; Deck/BOQ/Material A3 hoạt động, Văn bản/Video/HTML không giả.

## Vừa xong

- **13/08 khuya (đợt T #3):** ⭐**P5 FeatureContract máy XONG** — 22 hợp đồng 4 câu + `soi:contract` 3 chiều; phát hiện 12/14 kho sổ 08/08 ĐÃ MỞ (sổ giấy mốc 5 ngày, nay máy canh dây); còn 2 kho chờ thật: capture-sequence · lux-l6. **Kênh PDF Gói Hồ Sơ ĐÃ NỐI** (exportDeckToPdfBlob additive, fail-open) + trả 7 chỗ thao-tac present-editor → 3 luật cơ khí VỀ 0 toàn app. Chuỗi nền chỉ còn P6 IF-RNA v0.
- **13/08 đêm (đợt T #2 · 2 agent song song):** ⭐**P4 Gói Hồ Sơ Sống v0 XONG** — `.zip` 3 tầng thoái lui (viewer HTML tự chứa 0-mạng-ngoài · file chuẩn ngành `out/` · ruột JSON + manifest sha256); điểm cắm Toolbar Trình chiếu; 22 test; gói mẫu T mở mắt đạt, preview gửi Hoà. **Sửa lệch soi:thao-tac đợt 1** — 41 chỗ 3 luật cơ khí (Webkit prefix · keydown né ô nhập + chuẩn hoá esc-only · 16 nhãn "tự động" đổi đúng nghĩa); còn 7 chỗ present-editor nhường + 2 hàng đợi mắt-design. **LÔ DUYỆT MẮT #1 đã soạn** (`docs/duyet-mat/LO-1`): 48 mục → 7 trạm ~20'. Nợ khai thật: kênh PDF gói chờ export.ts trả Blob.
- **13/08 tối (đợt T · 2 agent song song):** ⭐**P3 Hệ Luật Thao Tác XONG** — kho 36 luật máy-đọc (17 grep + 19 mắt) từ ~10 spec UI, 7 cấm kỵ [N1] thành tội danh, `npm run soi:thao-tac` exit 1 khi lệch; phát đầu bắt 5 lệch thật code app (Webkit prefix·focus-visible·keydown né ô nhập·chữ "tự động"·hex inline) = hàng đợi sửa đợt sau. ⭐**Grounded Render v0 XONG** — `lib/grounded-render` + 2 node Phiếu đọc tham khảo (Gu) / Render bám ý theo mảng (Dựng ảnh): cửa duyệt phiếu TRƯỚC inpaint, mask thiếu = lỗi cứng, guidance import hằng F2; phiếu cấp ①③ nối VLM thật, ②④ khung chờ; 41 test. Kèm: ghi bù entry P3/P4 vào registry (sổ-quên) · vá trung tính greeting.ts (check:chot 0 chặn) · 2 phiếu giao tự chứa + 2 báo cáo agent. Chi tiết CHANGELOG.
- **13/08 (phiên T dài — ngày dày nhất từ đầu dự án):** ⭐**ĐỢT 5** giao diện thống nhất + Home (chi tiết CHANGELOG): Home bento v4 co-giãn-theo-dữ-liệu · radius 442→335 · từ điển mocks 77→0 · PanelFlank phát hiện có sẵn · bench hiệu năng (điểm gãy pickHatchFace O(N²), recipe ×660 tam giác) · ⭐**DOGFOOD #1 task ST5 thật**: Smart Convert bậc 1 (nhập PDF→deck lớp chữ thật) + sửa nóng F1 Trình chiếu (TaskFirstStart 3 lối, toolbar gộp) + fix F2 node render (guidance 15→3.5 + image_size — công thức từ 15 job làn máy) + bộ render sảnh thang/hành lang/cab giao Hoà + sổ findings F1-F5 · ⭐**NỀN MÓNG**: TRIET-LY-IF.md ban hành (P1) + P2 nhịp HOP-DONG (bước-0, thẻ vai, phân loại) + SPEC-GROUNDED-RENDER (chốt) + REVIEW-DONG-BO (5 engine chung thành luật) + SPEC-HOME-BENTO-V5 (chờ duyệt phác) + BAN-THIET-KE-HE-THONG + DOI-CHIEU-3-TRUONG-PHAI + NC-GU-BENTRAN (gu Pinterest) + 2 NC Home. Sổ: 45 xong-MÁY · 27 chờ · 0 lệch.

