# STATUS — InteriorFlow (13/08 đêm)

## MỞ PHIÊN MỚI: dán câu lệnh §5 HOP-DONG-PHOI-HOP-T + `npm run soi:frontier`. Đọc thêm: TRIET-LY-IF.md (hiến pháp, TRÍCH MÃ ĐIỀU KHOẢN vào mọi phiếu) · 00-CHOT 2 dòng cuối. **CHUỖI NỀN P1→P6 ĐÓNG TRỌN 14/08.** Kế tiếp theo lộ trình BAN-THIET-KE §5: vá 3 lỗ ❌ (telemetry local-first đếm-bấm ghi file cục bộ [T3] · a11y audit 1 lượt · error-log + nút gửi-log tự nguyện). Món nhìn-thấy sẵn hàng: GR v1 bảng ánh xạ + núm per-mảng · lux-l6 (kho chờ dây cuối) · focus-visible (mắt design) · sửa pickHatchFace O(N²).

## Chờ tay HOÀ (xếp hàng)
0. **DUYỆT BỘ NGUYÊN TẮC NT-1..18** (docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP — từ 70 ảnh + 3 board Pinterest + top-tier) **+ gật khuôn KB-1..5** — duyệt xong NT thành CHUẨN nghiệm thu mọi UI, T mock KB theo thứ tự (đề xuất: KB-1 toolbar một khuôn trước). 1. **ĐI LÔ DUYỆT MẮT #1** — `docs/duyet-mat/LO-1-2026-08-13.md`: 48 mục gộp 7 trạm ~20 phút, trả lời "Trạm N ok/lệch" là T flip loạt 2. Duyệt phác Home v5 (SPEC-HOME-BENTO-V5) 3. Chọn ảnh render ST5 → T upscale 300dpi. (Preview Gói Hồ Sơ Sống + .zip mẫu — nay có cả kênh PDF — đã gửi trong chat.)

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

- **14/08 (đợt T #5 — ngày dogfood liên chặng):** ⭐VÒNG TRÒN DF2 ĐÓNG: PDF Westlake→deck phả hệ→✨ Grounded→thay đúng khung→PDF mới (3 job; findings F3-F9 vào sổ) · ⭐GHẾ 3D TỪ ẢNH proof sống (Trellis 25s, .idfc cờ 3 nấc per-trường, viewer public/__lincoln-viewer.html) · SHIP MAP sống (ship:map, 90+ task 1 khung nhìn) · DS đợt A xong (gốc bệnh font Times + radius −97%) · NT-1..18 + khuôn KB CHỜ HOÀ DUYỆT · DWG/DXF lỗi vào sổ chờ tái hiện · DesignSync đã nối claude.ai/design. Chi tiết CHANGELOG.
- **14/08 (đợt DS #1 — Hoà chê giao diện):** ⭐GỐC BỆNH FONT bắt được: var font khai mà không định nghĩa → cả app render TIMES thường trực từ trước tới nay — đã sửa + fallback sans đo thật. Radius 334→10 ngoài thang (−97%, 107 file). Statusbar/Files hết vỡ khổ hẹp. Bảng chẩn docs/CHAN-DOAN-DS-MAT (6 bug A đã sửa · 6 lệch cấu trúc B CHỜ ẢNH THAM KHẢO HOÀ để chốt khuôn + mock Figma/Claude Design).
- **14/08 (đợt T #4):** ⭐**CHUỖI NỀN P1→P6 ĐÓNG TRỌN** — P6 IF-RNA v0: panel MaterialPbr TỰ SINH từ định nghĩa (editor 332→299 dòng, lan-1-chỗ chứng minh trên app, drift-guard) · nút Xuất chuỗi PNG (kho captureSequence có dây, kho chờ chỉ còn lux-l6) · 2 finding duyệt mắt Hoà xử tại trận (nhãn Home + lag −4,4MB, Hoà xác nhận = mục xong-mắt đầu tiên 👁1). Chi tiết CHANGELOG.
- **13/08 tối→khuya (đợt #2-#3):** P4 Gói Hồ Sơ Sống + P5 FeatureContract máy (12/14 kho sổ cũ hoá ra đã mở) + kênh PDF gói + thao-tac 3 luật về 0. Chi tiết CHANGELOG.):** P4 Gói Hồ Sơ Sống v0 (.zip 3 tầng thoái lui, viewer tự chứa, preview gửi chat) · sửa lệch thao-tac đợt 1 (41 chỗ) · Lô duyệt mắt #1 soạn 48 mục/7 trạm. Chi tiết CHANGELOG.