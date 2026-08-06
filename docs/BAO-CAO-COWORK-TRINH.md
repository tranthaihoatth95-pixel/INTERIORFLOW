# BÁO CÁO COWORK-TRÌNH — tính năng chặng Trình bày
**Vai nhận:** 02/08/2026 tối (23:01 VN) · theo `HAM-DOI-COWORK.md` VAI 6.
**Sở hữu:** spec 5 loại hồ sơ (Deck · Bảng vật liệu A3 · BOQ · Văn bản · Video) — kế thừa `SPEC-MODE-PER-STAGE` §4 + `IF-PRESENT-*`.
**Luật tuân thủ:** không code · không mock (lệnh Hoà 03/08, `SO-KIEM-TONG` §2 — mock = đặc tả bằng chữ trong phiếu, phiên nhận mảng tự dựng) · append-only · chốt phiên ~85% context · nghi vấn vai khác → ghi đây + 1 câu cho Hoà chuyển TỔNG.

## HÀNG ĐỢI (theo hiến chương, làm theo thứ tự)
| # | Việc | Ăn vào đâu | Trạng thái |
|---|---|---|---|
| 1 | `SPEC-TRINH-BOQ-EDITOR.md` — bảng tính BOQ: cột, công thức hiển thị, live-link vùng tô, xuất xlsx | `lib/boq` (compute·xlsx·cache — `49ebadd` trên `nhanh-phu`, chờ merge main) | ⛔ chờ NC-3 (chưa có, `docs/nc/` chưa tồn tại — kiểm 02/08 23:01) |
| 2 | `SPEC-TRINH-VIDEO-EDITOR.md` — timeline CapCut-level: track/trim/nhạc/chữ. **KHÔNG viết engine video** (luật `CHOT-VIDEO-2-TANG`: ② Dựng = chỉ edit, không giữ scene 3D riêng) | footage từ `captureSequence` streaming (`lib/three/capture.ts`, `57ed9b8`) | ⛔ chờ NC-2 (chưa có) |
| 3 | Rà `TICKET-PRESENT-UI-GON-2026-08-01` + `AUDIT-PRESENT-UX-2026-07-29`: mục nào AppShell mới đã giải quyết, mục nào còn → danh sách sống/chết | đối chiếu `SPEC-APP-SHELL-CHUNG` + `TICKET-UI-HATANG` (H1-H4) + code hiện trạng | ✅ làm được ngay |

## VIỆC 3 — DANH SÁCH SỐNG/CHẾT (rà 02/08 23:10, đối chiếu git log --all + grep code thật)

**Bối cảnh quan trọng:** H4 (Present chọn 5 loại) **HOÃN theo chỉ đạo** (`802f808` "hết chuỗi H, H4 hoãn") → AppShell 6 ổ (`3a92170`) chỉ thay VỎ ngoài, KHÔNG đổi ruột present-editor → không mục nào bị AppShell "nuốt"; cái đã chết là do **E-sprint + P6 đã code** (merge `1e818c9`, `3c8dae6`).

### A · `TICKET-PRESENT-UI-GON-2026-08-01`
| Mục | Sống/Chết | Bằng chứng |
|---|---|---|
| P6a — màu chữ AA-safe thay vệt, scrim thành tuỳ chọn TẮT mặc định | ✅ CHẾT (xong) | `a53c4a9` · `lib/present-editor/text-contrast.ts` + test |
| P6a — color picker màu chữ ≤2 click | 🟡 VERIFY | commit không nói rõ; cần 1 lần verify browser |
| P6a — export PDF/PNG/PPTX bake đúng (không còn vệt) | 🟡 VERIFY | `model.ts:190` filter tái dựng khi export có; nhánh scrim-off chưa ai chụp đối chứng |
| P6a — rà `BUILTIN_TEMPLATES` gỡ vệt nhúng làm trang trí | 🔴 SỐNG | không thấy commit/diff nào đụng templates về scrim |
| P6b — cụm "Sắp xếp" lên toolbar (align·z-order·group·khoá) | ✅ CHẾT (xong) | `fa29820` — bước 1 |
| P6b — cụm "Hiệu ứng" lên toolbar (màu chữ·fill·mask·filter·opacity/shadow) | 🔴 SỐNG | năng lực ĐÃ CÓ trong Inspector (E2·E3·E4 xong) nhưng CHƯA lộ mặt tiền toolbar — bước 2 chưa làm |
| P6b — màn hẹp: cụm thu thành menu ▾ | 🔴 SỐNG | grep Toolbar.tsx không có ▾/menu thu |
| Điều kiện xong: so 2 vùng ảnh Hoà khoanh | 🟡 CHƯA NGHIỆM THU | chờ P6b bước 2 xong mới so được |

### B · `AUDIT-PRESENT-UX-2026-07-29`
| Mục | Sống/Chết | Bằng chứng |
|---|---|---|
| #1 gradient cho shape/ảnh (2.3.31) | ✅ CHẾT | `FillOverlay` kind='gradient' 2 màu + blend (`model.ts:48` ghi thẳng "Giải 2 ô ⬜ của audit") |
| #1 mask ảnh hình tự do (2.3.30 / E2) | ✅ CHẾT | `model.ts:217` mask cho ẢNH (P1/E2 theo `CHOT-NGUYEN-LIEU-EDITOR`) |
| #1 group (2.3.33 / E1) | ✅ CHẾT | `3111758` + `model-group.test.ts` |
| #1 blur filter (2.3.38.a / E4) | ✅ CHẾT | `16de227` blur/brightness/contrast/saturate |
| #1 khoá tỉ lệ resize (2.3.32) | ✅ CHẾT | `8f4ed9f` P2 — giữ tỉ lệ mặc định, Shift bẻ |
| #1 flip/mirror TỪNG PHẦN TỬ (2.3.42) | 🔴 SỐNG | chỉ có `mirrorSlide` (lật cả slide, `templates.ts:1345`) — không có flipX/flipY per-element |
| #2 lối vào photo-editor 4 tầng (tab mới + localStorage round-trip) | 🔴 SỐNG NGUYÊN | `PresentEditor.tsx:15` vẫn mở `/photo-editor`, vẫn import `lib/photo-editor/handoff` |
| #3 AI vs tự chỉnh chưa tách bạch | 🔴 SỐNG NGUYÊN | `GenerateFlow` vẫn lồng làm trạng thái đầu tab "Mẫu" (`LayoutShelf.tsx:148,332`) |
| Đề xuất B — sửa ảnh tại chỗ cùng app-shell | 🔴 SỐNG (chưa chốt hướng) | gắn với #2; chưa có quyết định trong `00-CHOT` |
| Đề xuất C — tách lối vào AI riêng | 🔴 SỐNG (chưa chốt hướng) | gắn với #3; **nên xử CÙNG H4** khi thiết kế Present 5 loại (`SPEC-MODE-PER-STAGE` §4) — tránh làm 2 lần |

### Kết luận + việc nảy sinh
1. **Chết 8 mục** (E-sprint P1-P5 + P6a/P6b-bước-1 đã quét sạch phần nặng của audit #1) · **sống 7** · **verify 3**.
2. Việc sống gọn thành 3 phiếu tương lai: **(a)** P6b bước 2 + ▾ + rà templates scrim + flip per-element (1 phiếu UI toolbar, vùng **G4** theo phân mảng mới §2 — ticket cũ ghi "code phụ" đã LỖI THỜI) · **(b)** #2 sửa-tại-chỗ (cần Hoà chốt hướng B trước) · **(c)** #3 tách AI — gộp vào thiết kế H4/5-loại-hồ-sơ khi H4 hết hoãn.
3. **Đề xuất 1 dòng cho `00-CHOT`** (chờ TỔNG duyệt): `TICKET-PRESENT-UI-GON` xong P6a+P6b-b1 (`a53c4a9 fa29820`), phần còn lại + audit-UX #2#3 gom vào phiếu Present mới, vùng G4.

## NHẬT KÝ (append-only)
- [02/08 23:01] Nhận vai. Đọc đủ thứ tự: `HAM-DOI-COWORK` → `SO-KIEM-TONG` → `00-CHOT` → `STATUS`. Kiểm phụ thuộc: `docs/nc/` chưa tồn tại (NC mới nhận vai 22:58, chưa ra bài) → việc 1·2 SKIP theo luật §3, việc 3 khả thi. Tạo sổ này. Chờ Hoà chọn chế độ chạy.
- [02/08 23:04] Hoà chọn "tự chạy việc 3". Bắt đầu rà.
- [02/08 23:12] Xong việc 3 — bảng sống/chết ghi trên. Phát hiện chính: E-sprint đã giết 5/6 mục toolkit của audit mà chưa ai đánh dấu; H4 hoãn nên #3 (tách AI) nên chờ gộp vào H4. Việc 1·2 vẫn chặn (NC chưa ra bài).
- [04/08 đêm — giờ máy 02/08 23:16] TỔNG duyệt 2 đề xuất (BAO-CAO-DEM 23:5x) + bơm 3 việc mới (§3 sổ tổng, "không chờ NC nữa"). Xác nhận hàng đợi bằng đọc sổ thật trước khi chạy.
- [—] **Xong việc bơm 2 (verify 3 🟡 bằng code):** picker ≤2 click ✅ ĐẠT (`TextToolbar.tsx:78-290` toolbar nổi, 1 click mở bảng màu 1 click chọn) · export bake ✅ ĐẠT MỨC CODE (`render.ts:34,410` nối autoShadow P6a; E4 bake :220,:286) · ảnh Hoà khoanh ⏳ không kết luận được bằng code → thành N1-N3 trong phiếu. Kết quả nhúng vào phiếu, đóng 3 mục 🟡.
- [—] **Xong việc bơm 1:** `docs/PHIEU-PRESENT-G4.md` — 6 việc code V1-V6 (thứ tự V2→V3→V1→V4→V6→V5) + khối nghiệm thu N1-N4. V6 đánh dấu GỘP-H4 khớp việc 4 hàng đợi G4; V5 (sửa-tại-chỗ giết 4 tầng) có CỔNG Hoà duyệt ảnh trước merge; V2 buộc luật portal K4.
- [—] **Xong việc bơm 3:** `docs/SPEC-TRINH-MATERIAL-A3.md` — giữ ranh giới 2.1.9.i (MaterialDef thị giác ≠ ProductSpec thương mại, đọc qua neo `atlasRecordId`) · 8 cột ATLAS đúng tên trong `atlas-material-map` · tái dùng present-editor engine (`docType:'material-board'` additive, khổ A3 đã có từ `2a252c9`) · live-link một-nguồn + card mồ côi --warning · xuất qua print-upscale P3. 1 câu treo §9 (ẩn NCC bản khách?) — không chặn code.

## ĐỢT 2 (bơm mục 4 — MỞ KHOÁ khi NC-2/NC-3 về)
- [—] Đọc `§0/§0b/§0c` (luật trung thực · 3 bước trước khi quyết · 3 mảng không bỏ sót) + trọn `NC-spreadsheet-nhung` + `NC-timeline-editor` + mục "Điều IF nên làm" của `NC-xuat-pdf-in`. SEARCH code: `lib/boq` 12 file/1322 dòng (`49ebadd` — BoqRow ĐÃ đúng 8 cột Việt + entityIds + BoqError message Việt) · `campath.ts` có `LookAtMode 'zone'` · `capture.ts` streaming.
- [—] **Xong `SPEC-TRINH-BOQ-EDITOR.md`:** tuyên bố records-có-schema KHÔNG-Excel (NC#1) · 6 kiểu cột Grist-min trần 30 công bố sớm · mini-DSL ƒx theo cột · **live-link = trigger-formula** (sửa tay + badge + revert, đúng CHOT-TACH-AI) · subtotal = summary-bar né bẫy Airtable · xuất xlsx SUM() sống · phủ §0c. 2 việc chờ PHU thẩm định (parse mini-DSL · kiểm SUM() output hiện tại).
- [—] **Xong `SPEC-TRINH-VIDEO-EDITOR.md`:** SHOT CÓ TÊN dạng tile (moat ngữ nghĩa campath) · 3 tầng cố định không quản track · timeline collapsed mặc định · beat snap kiểu Canva-free · xuất MP4 sạch 0-credit (đòn vào vụ paywall CapCut) · luật thiêng thấy-=-xuất thành test bắt buộc · phủ §0c. 2 việc chờ PHU thẩm định (lib dò beat · đường xuất WebCodecs/mp4-muxer + map sample→zone).
- **Ghi nhận cho TỔNG (1 câu):** 5 loại hồ sơ giờ 4/5 có spec hoặc đang xây (Deck xây · A3 · BOQ · Video có spec) — riêng **"Văn bản/Word biểu mẫu" chưa ai giao việc spec**, không tự bịa ngoài hàng đợi, chờ TỔNG bơm nếu cần.

## ĐỢT 3 (TỔNG bơm ~02:1x — phiên này vẫn là vai TRÌNH)
- Hoà dán 5 dòng nhận vai (NC·UI·VẼ·DỰNG·TRÌNH) vào phiên này — theo hiến chương 1-phiên-1-vai, CHỈ nhận dòng TRÌNH; **4 dòng kia đã trả Hoà dán vào 4 phiên mới**, không ôm chéo vai (phá §2 + tràn context).
- Kiểm điều kiện bằng lệnh (§0): commit đợt 2 kẹt lock **ĐÃ được TỔNG gom vào `b2f4400`** — nợ git sạch, 3 file sạch so với HEAD · BAO-CAO-PHU grep mini-DSL/SUM/beat/MP4 = 0 → **PHU CHƯA thẩm định → việc ② SKIP đúng luật chờ-X**.
- [—] **Xong việc ①: `SPEC-TRINH-VANBAN-EDITOR.md`** — loại hồ sơ #5, **ĐỦ 5/5**. Xương sống: phạm vi BIỂU MẪU tuyên bố thẳng (không word-processor — chưa có NC riêng thì không lách, muốn auto-flow đặt NC trước) · 3 template trung tính (Báo giá·Hợp đồng·Thuyết minh) song ngữ `t(lang,vi,en)` · **biến `{{...}}` tự điền** từ nguồn thật (BrandKit `brand-kit.ts:35` + `BoqResult.totalAmount` + bảng nhúng sống chỉ-đọc) · biến thiếu = placeholder --warning + status bar đếm, không im lặng · sửa đè = badge+revert cùng cơ chế trigger-formula BOQ · xuất PDF theo luật font Việt NC-pdf, DOCX = v2. 2 việc lib nhỏ cho PHU (số-thành-chữ VN · thẩm định lib docx v2).

## CHỐT PHIÊN [04/08 đêm — giờ máy 02/08 23:2x]
- **Đã xong phiên này:** nhận vai · việc 3 gốc (rà sống/chết 18 mục) · 3 việc bơm đêm (phiếu G4 + verify 3🟡 + spec Material A3). Sản phẩm: `BAO-CAO-COWORK-TRINH.md` · `PHIEU-PRESENT-G4.md` · `SPEC-TRINH-MATERIAL-A3.md`.
- ~~HẾT VIỆC 23:2x đợt 1~~ → đợt 2 bơm mục 4, đã chạy xong (xem mục ĐỢT 2 trên).
- ~~HẾT VIỆC đợt 2~~ → đợt 3 bơm, đã chạy xong (mục ĐỢT 3 trên).
- **HẾT VIỆC ĐỢT 3** — việc ① xong (spec Văn bản, **5/5 loại hồ sơ đã có spec hoặc đang xây**); việc ② skip chờ PHU.
- **Việc dở:** không. Context phiên ~75-80% — phiên TRÌNH KẾ TIẾP nên là phiên mới, đọc 3 file theo §4 rồi nhận việc ② khi PHU xong.
- **Chờ người khác:** PHU thẩm định 4 điểm + 2 việc lib mới (số-thành-chữ VN · docx v2) · G4 nhận `PHIEU-PRESENT-G4` · Hoà: §9 spec A3 (ẩn NCC?) + dán 4 dòng vai kia vào 4 phiên mới.
- **Nghi vấn chuyển TỔNG:** không mới — nghi vấn cũ (Văn bản thiếu spec) đã được đợt 3 giải quyết chính bằng việc ①.
- ⚠️ **SỰ CỐ COMMIT ĐỢT 2 (trung thực §0):** 3 file ĐÃ STAGED + nội dung an toàn trên đĩa, nhưng `git commit` fail — `.git/next-index-6.lock` (rác FUSE đợt 1, sandbox không unlink được) + `index.lock` mới sinh. HEAD lúc đó là `6ce940f` của phiên CHINH (2 phiên đụng nhau). KHÔNG retry theo luật. **Lệnh soạn sẵn cho Hoà chạy máy thật:**
  ```
  cd ~/Downloads/interiorflow
  rm -f .git/index.lock .git/next-index-6.lock
  git commit -m "docs(trinh): dot 2 - spec BOQ + Video tu NC-2/NC-3, chot phien" -- docs/BAO-CAO-COWORK-TRINH.md docs/SPEC-TRINH-BOQ-EDITOR.md docs/SPEC-TRINH-VIDEO-EDITOR.md
  ```
  (Chạy khi chắc không phiên nào đang thao tác git. File này sửa sau khi staged nên commit xong sẽ còn 1 phần modified — commit lần nữa cùng pathspec hoặc kệ, phiên sau gom.)

## ĐỢT 4 (dispatch mới nhận nguyên văn "VIỆC ĐỢT 3" — PHÁT HIỆN GIAO TRÙNG)
- [03/08] Nhận vai với nguyên văn việc ①+② của ĐỢT 3 (spec Văn bản/biểu mẫu `SPEC-TRINH-VANBAN-BIEUAMAU.md` +
  kiểm PHU thẩm định 4 điểm). Theo §4 LUẬT THAY PHIÊN ("`git log --all --oneline -- <path>` — việc có thể đã
  xong, bài học 3D-2 giao trùng 03/08"): chạy lệnh git THẬT trước khi viết bất kỳ file nào, không tin chữ báo
  cáo cũ suông.
- **Việc ① — ĐÃ XONG TỪ TRƯỚC, KHÔNG LÀM LẠI:** `git log --oneline --all -- docs/SPEC-TRINH-VANBAN-EDITOR.md`
  (chạy qua sandbox bash, repo mount tại `/sessions/beautiful-ecstatic-volta/mnt/interiorflow`, branch hiện tại
  `main`) → commit `091734e` "docs(trinh): dot 3 - SPEC-TRINH-VANBAN-EDITOR (bieu mau A4, bien tu dien, du 5/5
  loai ho so), viec 2 skip cho PHU" **ĐÃ NẰM TRÊN MAIN**. Đọc lại toàn văn file (62 dòng) — khớp 100% yêu cầu
  vừa nhận: `docType:'document'` additive · khổ A4 dọc · 3 template Báo giá/Hợp đồng/Thuyết minh song ngữ ·
  biến `{{...}}` tự điền từ `BrandKit` (`lib/present-editor/brand-kit.ts:35`) + `BoqResult.totalAmount` · badge
  sửa-đè cùng cơ chế trigger-formula BOQ · cùng khuôn 3 spec anh em (Material A3/BOQ/Video). **KHÔNG tạo
  `SPEC-TRINH-VANBAN-BIEUAMAU.md` trùng nội dung** — làm vậy vi phạm thẳng bài học "giao trùng việc 3D-2 đã
  xong" (§0 `SO-KIEM-TONG`) và tạo rủi ro 2 file cùng đặc tả 1 docType trôi dạt (drift) theo thời gian. Tên file
  cũ giữ hậu tố `-EDITOR` — đã nhất quán với `SPEC-TRINH-BOQ-EDITOR.md`/`SPEC-TRINH-VIDEO-EDITOR.md`, không cần
  đổi tên.
- **Việc ② — kiểm TƯƠI lại (không tin kết luận cũ suông), VẪN CHƯA ĐỦ ĐIỀU KIỆN:** 2 lượt grep trên toàn bộ
  `docs/`: lượt 1 đúng 4 từ khoá đề bài + biến thể lib (`mini-DSL|SUM\(|beat|MP4|mp4-muxer|WebCodecs|
  web-audio-beat-detector|essentia`) → 20 file khớp, **`BAO-CAO-PHU.md` KHÔNG có trong danh sách**; lượt 2
  case-insensitive nới rộng (`DSL|SUM|beat|MP4|dò beat|xuất video`) chạy riêng trên `BAO-CAO-PHU.md` → **0
  match**. Đọc thêm toàn văn `BAO-CAO-PHU.md` (1108 dòng, mtime 02/08 13:21 — không đổi so với lần đọc trước)
  xác nhận nội dung chỉ có P1-P4 + P6c (mask ảnh · nhóm phần tử · resize nhóm theo tỉ lệ · z-order nhóm · lớp
  phủ fill · filter phần tử · fix kính lỏng) — KHÔNG đụng BOQ mini-DSL/SUM() lẫn video beat-detect/MP4 export.
  **PHU CHƯA thẩm định bất kỳ điểm nào trong 4 điểm** → bỏ qua việc ②, giữ nguyên §8 của
  `SPEC-TRINH-BOQ-EDITOR.md` và §8 của `SPEC-TRINH-VIDEO-EDITOR.md` y nguyên (mỗi phiếu vẫn đúng 2 việc "chờ
  PHU thẩm định trước khi lên phiếu code"). KHÔNG tạo `PHIEU-TRINH-BOQ-VIDEO-CODE-2026-08-03.md`.
- **Kiểm phụ (freshness — không đổi kết luận nhưng đáng ghi):** grep `docType` trong `lib/present-editor/*` = 0
  kết quả — field additive mà 3 spec (Material A3 §4.1, Văn bản §2) đề xuất dùng chung CHƯA được G4 code, đúng
  như spec mô tả (là đề xuất cho tương lai, không phải hiện trạng đã có) — không có trôi dạt cần sửa spec.
- **Ghi nhận cho TỔNG/Hoà (nghi vấn vai khác — đúng quy ước đầu file: "ghi đây + 1 câu cho Hoà chuyển
  TỔNG"):** dòng "ĐỢT 3 — COWORK-TRÌNH" trong `SO-KIEM-TONG.md` §3 (bảng cuối file, mục "ĐỢT 3 (TỔNG bơm ~02:1x
  ...)") mô tả đúng việc ①+② vừa bị giao lại — đã HOÀN TẤT từ 03/08 (commit `091734e`) nhưng chưa được đánh dấu
  xong/gỡ khỏi hàng đợi, nên phiên này nhận trùng. Đề nghị TỔNG cập nhật hoặc gỡ dòng đó trước khi bơm đợt kế,
  tránh giao trùng lần 3 (tiền lệ: 3D-2 03/08 + Văn bản lần này 03/08).

## CHỐT PHIÊN [03/08 — dispatch trùng ĐỢT 3]
- **Đã xong phiên này:** KHÔNG bằng cách viết spec mới, mà bằng cách xác minh việc đã xong + đóng vòng lặp
  trùng lặp TRƯỚC khi tốn công viết trùng. Việc ① xác nhận ĐÃ CÓ, ĐÃ COMMIT MAIN (không cần làm) · việc ② xác
  nhận VẪN CHƯA ĐỦ ĐIỀU KIỆN (bỏ qua đúng luật chờ-X, đã kiểm tươi bằng 2 lượt grep + đọc toàn văn báo cáo PHU).
- **File tạo mới:** 0 (cố ý — tạo thêm sẽ trùng nội dung `SPEC-TRINH-VANBAN-EDITOR.md`, vi phạm luật chống
  trùng việc). Chỉ cập nhật `BAO-CAO-COWORK-TRINH.md` (file này, mục ĐỢT 4 trên).
- **Việc dở:** không — cả ① và ② đều đã có kết luận rõ ràng (① xong từ trước / ② chưa đủ điều kiện, đã kiểm
  tươi bằng lệnh thật, không phải suy đoán).
- **Chờ người khác:** PHU thẩm định 4 điểm (mini-DSL parse · SUM() xlsx output hiện tại · lib dò beat
  `web-audio-beat-detector`/`essentia.js` · đường xuất MP4 WebCodecs+mp4-muxer/ffmpeg.wasm) rồi COWORK-TRÌNH
  đợt sau mới nâng BOQ/Video thành phiếu code · TỔNG rà lại dòng ĐỢT 3 trong `SO-KIEM-TONG.md` §3 cho khớp
  thực tế đã xong.
- **Nghi vấn chuyển TỔNG:** có — hàng đợi §3 `SO-KIEM-TONG.md` bị lỗi thời cho vai COWORK-TRÌNH (xem mục ĐỢT 4
  trên), nên rà lại trước khi bơm đợt kế để tránh lặp lần 3.

## ĐỢT 5 (03/08 — nâng spec thành phiếu code + trả lời §0.6)
**Nhận 2 việc:** ① nâng `SPEC-TRINH-BOQ-EDITOR` (+ Video nếu đủ điều kiện) thành phiếu code · ② trả lời phát
hiện §0.6 `SPEC-TANG-DU-LIEU-CAU-KIEN` (Trình bày cầm bản sao chết). Đọc trước khi làm: `SO-KIEM-TONG` §0/§0b/
§0c/§0d · báo cáo này · 2 spec của mình · `CHOT-TEN-CHANG-MODE` VÒNG CUỐI (luật ba-ống-kính-một-nguồn) ·
`SPEC-TANG-DU-LIEU-CAU-KIEN` §0.6. **KHÔNG chạy git** (lệnh phiên) — mọi khẳng định dưới là **đọc code thật
trên cây làm việc**, hash commit chỉ chép theo dispatch, ghi rõ CHƯA tự verify.

### ① BOQ → `docs/PHIEU-TRINH-BOQ-EDITOR.md` (MỚI) — **11 việc code B0–B11**
Thứ tự chốt: **B0→B1→B2→B3→B4→B5→B6→B8→B10→B7→B9→(B11 gated)**. Mỗi việc có file đích + nghiệm thu đo được +
chủ (G4 = UI trong `components/present-editor/boq/*`, PHU = `lib/boq/*`). §A liệt kê **13 hàm/đường đã có sẵn**
kèm số dòng để tái dùng (`computeBoq:89` · `computeBoqCached:68` · `computeBoqForProject:66` ·
`boqResultToXlsxBuffer:162` · `POST /api/boq/[projectId]:25` · `useCadStore.select` · `loadSheets` · …).
**3 điểm spec phải sửa vì code nói khác (§0 trung thực):**
| # | Spec viết | Code thật | Xử |
|---|---|---|---|
| 1 | xlsx "đã có SUM() — PHU kiểm" | `xlsx.ts:93` ghi TỔNG bằng **số chết**; grep `SUM\|<f>\|formula` = **0** | **tôi tự verify xong** → hết chờ PHU, thành việc code **B8** |
| 2 | truy vết `entityIds` "cần hỏi CHINH" | `useCadStore.select(ids)` đã có, `SchedulePanel.tsx:153` đã dùng | hết chờ CHINH → **B4** |
| 3 | group theo **phòng** | `HatchEntity` không có `roomId`; `Base.storey:162` có; phòng chỉ suy từ nhãn text | v1 nhóm theo **tầng + hạng mục**; nhóm-theo-phòng = v2 có cờ `inferred` (L4) |
**Còn chờ:** chỉ **B11 (mini-DSL ƒx)** — `BAO-CAO-PHU.md` grep `DSL` = 0, PHU chưa trả lời. 10/11 việc code được ngay.
**2 câu hỏi chặn cho TỔNG/Hoà (§E phiếu):** dự án nhiều bản vẽ thì BOQ tính theo sheet đang mở hay gộp cả dự án ·
bảng BOQ có phải 1 "hồ sơ" lưu như deck không (ảnh hưởng chỗ lưu override sửa-tay).

### ① Video — **KHÔNG nâng phiếu, đúng luật chờ-X**
Kiểm tươi 03/08: `grep -ci "beat|mp4|webcodecs|muxer" docs/BAO-CAO-PHU.md` = **0** · `package.json` không có
`web-audio-beat-detector`/`essentia.js`/`mp4-muxer`/`ffmpeg.wasm`. **PHU chưa thẩm định cả 2 điểm §8**
(lib dò beat · đường xuất MP4) → §5 và §7 của spec Video **không có nền để viết nghiệm thu đo được**; đẩy phiếu
lúc này = phiếu không code được. Giữ nguyên `SPEC-TRINH-VIDEO-EDITOR.md`, không sửa 1 chữ.

### ② §0.6 → `docs/SPEC-TRINH-ONG-KINH-DU-LIEU.md` (MỚI) — đề xuất chờ TỔNG duyệt
**3 sự thật bổ sung cho §0.6 (kiểm code):** (a) payload **CÓ** mang `snapshot: JSON.stringify(doc)`
(`CadEditor.tsx:393`) nhưng bên nhận `PresentEditor.tsx:321` gọi `consumeCadPresentHandoff()` → **chỉ lấy
`dataUrl`, vứt snapshot** — cửa mở sẵn, chưa ai bước qua; (b) **đọc snapshot vẫn SAI** — bản sao đông lạnh trong
sessionStorage vẫn là bản sao (L6), chép "dữ liệu" không đỡ hơn chép "ảnh"; (c) `grep computeBoq|api/boq` trong
`components/` = **0** → lời hứa `SPEC-SEMANTIC-MODEL` §6 "sửa bản vẽ → deck tự cập nhật" hiện **chưa có đường code nào**.
**Ranh giới đề xuất (1 dòng):** *Ảnh là SẢN PHẨM, không bao giờ là NGUỒN — cái người ta ngắm thì ảnh hợp lệ,
cái người ta đọc để ra tiền thì phải sống.* Phép thử: **"số này in ra khách chỉ tay vào cãi được không?"**
| 🟩 Ảnh hợp lệ (KHÔNG phải lỗi) | 🟨 Ảnh có công thức | 🟥 Bắt buộc dữ liệu sống |
|---|---|---|
| render 3D · moodboard · ảnh chụp · ảnh mẫu vật liệu · chữ/hình của deck | mặt bằng/mặt cắt dán vào deck · bản đồ zone | m² · mã SKU/NCC · đơn giá · hao hụt · thành tiền/tổng · số lượng thống kê · biến `{{...}}` văn bản |
Ranh giới thật nằm ở **"nội dung này có phải HÀM của Doc không"** + **"người ta ngắm hay đọc nó"**.
**3 việc sửa, không đập cái đang chạy (§0d):** T1 ống kính dữ liệu = đúng việc **B0** phiếu BOQ (không cần sửa
`present-handoff`) · T2 ảnh dẫn xuất mang **recipe** gắn vào `deck.linkedAssets` đã có (`linked-assets.ts:122`)
+ nút "Làm mới từ bản vẽ" + chỉ dấu cũ bằng `boqFingerprint` — **không tự render lại sau lưng** (L5) · T3 danh sách
không-làm. Kèm đề xuất **bỏ `snapshot` khỏi `present-handoff`** (giảm bản sao) — nhưng đây là lật ý phiên 23/07
nên **treo chờ Hoà/TỔNG**, không tự quyết (§4a).
**Điểm đáng lưu ý cho TỔNG:** `SPEC-TANG-DU-LIEU-CAU-KIEN` §9 xếp **P7 sau P5 (RoomEntity)** — nhưng T1/B0
**không cần** RoomEntity (BOQ chỉ cần `HatchEntity.specId` đã có) ⇒ đề xuất cho P7/T1 **chạy ngay, không chờ P5**.

### Chốt đợt 5
- **File mới:** `docs/PHIEU-TRINH-BOQ-EDITOR.md` (173 dòng) · `docs/SPEC-TRINH-ONG-KINH-DU-LIEU.md` (106 dòng).
  Sửa: file này. **Không đụng `lib/` `components/`** (Cowork không code).
- **CHƯA VERIFY (ghi thẳng):** commit `892c927` chưa tự kiểm bằng git (lệnh phiên cấm) — chỉ xác nhận **file có
  mặt trên cây làm việc** · chưa chạy app/test lần nào · ô nghiệm thu trong phiếu là để **người code đo**, không
  phải kết quả đã đo.
- **Chờ người khác:** PHU (mini-DSL B11 · 2 điểm Video §8) · TỔNG/Hoà (2 câu §E phiếu BOQ + 3 câu §5 spec ống
  kính) · G4 nhận phiếu BOQ · CHINH commit gộp docs (§3-5b sổ tổng — phiên Cowork không chạy git).

---

# 05/08/2026 — PHIÊN S4 · BUILD #3: CHẾ ĐỘ TRÌNH BÀY CHO MẶT BẰNG

> Mặt bằng kỹ thuật và mặt bằng cho khách xem là **cùng một `Doc`, hai cách hiển thị**.
> Phiên này làm cái ống kính thứ hai. **V6 — KHÔNG COMMIT.**

## 1 · Đã làm

| Việc | File | Trạng thái |
|---|---|---|
| **1** Công thức mặt bằng trình bày (`B1`/`B2`) | `lib/cad/plan-present.ts` (MỚI, 470 dòng) | ✅ chạy thật trên app |
| **2** Leader line ISO 128-22 | `lib/cad/plan-leader.ts` (MỚI, 300 dòng) | ✅ chạy thật, cắm Checkpoint S5 |
| **3** Phân lớp độ đậm theo chiều sâu | `lib/cad/plan-depth.ts` (MỚI, 190 dòng) | 🟡 dữ liệu xong, nút `disabled` kèm lý do (chờ S2) |
| **4** §9 vẽ cả phần chưa có | `components/cad/PlanPresentPanel.tsx` (MỚI) | ✅ 4 ô mờ, mỗi ô 1 lý do RIÊNG |

Nối dây: `components/cad/plan-present-store.ts` (MỚI) · `LeaderPreview.tsx` (MỚI) ·
`CadCanvas.tsx` (+2 chỗ) · `CadEditor.tsx` (+4 chỗ: import · state · nút toolbar · mount panel).

**Không đụng** `lib/cad/dxf*` · `dwg*` · `hatch.ts` · `render.ts` · `store.ts` · `model.ts` ·
`lib/three/*` · `workstation-clusters.ts` · `block-library.ts` · `public/cad-library/**` ·
`components/studio/*` · `lib/present-editor/*` · `components/present*`.

## 2 · Ảnh chụp — cùng một mặt bằng, hai ống kính

Cùng bản vẽ demo (căn hộ mẫu HƯ CẤU của app, 128 đối tượng), cùng khung nhìn, chỉ khác công tắc:

**Chế độ kỹ thuật** — nét trên nền tối, đồ đạc màu layer, không nền sàn, không cây/người/thảm.
**Chế độ trình bày** — nền sàn xám rất nhạt · tường/lõi đen đặc · cây xanh là điểm màu duy nhất ·
người nhìn từ trên · thảm định vùng nét đứt ôm cụm bàn ăn · đường bao hữu cơ.

Tái lập đúng 4 bước: `127.0.0.1:3000/cad-editor` → **Bắt đầu ▸ Mở bản demo** → **Trình bày** →
bấm công tắc **Chế độ trình bày**.

⚠️ **KHÔNG kèm file PNG vào `docs/`** — đợt dọn 01/08 đã gỡ 21 ảnh (8,9 MB) khỏi `docs/` và chốt
"gỡ ảnh, giữ report.md". Ảnh nằm trong transcript phiên. Nếu Hoà muốn có ảnh trong repo thì cần
chốt lại chỗ chứa (đề xuất: ngoài repo, cùng chỗ `~/Downloads/interiorflow-reference/`).

## 3 · Bằng chứng KHÔNG nhân đôi `Doc` (K1)

```
grep -rnE "sync[A-Z][a-zA-Z]*To[A-Z]" --include=*.ts --include=*.tsx lib components app
→ 1 dòng DUY NHẤT: lib/present-editor/project-doc.ts:5 — là COMMENT liệt kê thứ BỊ CẤM,
  không phải hàm. grep "syncDocToBoq" = đúng 1 dòng đó ⇒ hàm KHÔNG tồn tại.
```

Bằng chứng mạnh hơn, **đo trên app đang chạy** sau khi bật ống kính và vẽ đủ cây/người/thảm:

```js
window.__cadStore.getState().doc.entities.filter(e => e.id.startsWith('pv:')).length
→ 0
```

`presentProjection()` trả một `Doc` **phù du**, dựng lại mỗi khung hình, **không bao giờ** vào
store/`.idf`/IndexedDB — đúng khuôn `docToDraw` đã có sẵn ở `CadCanvas.tsx` (preview lúc kéo grip).
Mọi entity phái sinh mang tiền tố `pv:`, có `stripPresentDecor()` làm chốt chặn.

## 4 · Nghiệm thu

- `npx tsc --noEmit -p .` → **0 lỗi toàn repo**.
- `npm run check:mocks` → **0 vi phạm luật ĐỎ ⑤ (hex thương hiệu)**. 39 file ĐỎ / 745 vi phạm còn
  lại là **mock CŨ trong `docs/mocks/`, không phải của phiên này** — phiên này không tạo/sửa mock nào.
  `grep -niE "#F1ECE3|#002850|#F06020"` trên 6 file phiên này = **0**.
- Test mới, hàm thuần, chạy bằng `sucrase-node`: **99/99 pass**
  · `plan-present.test.ts` 39/39 · `plan-leader.test.ts` 35/35 · `plan-depth.test.ts` 25/25.
- Verify browser thật (`127.0.0.1:3000`, bản vẽ demo): công tắc đảo được hai chiều, **0 lỗi console**.
- Leader: **0 cặp cắt nhau** ở 4/8/12/16/24 nhãn (test) và **0 nhãn không đặt được** trên bản vẽ thật.

## 5 · Danh sách ô `disabled` + lý do (§9 — đã ghi vào `CHECKLIST-TONG.md`, nay 222→226 dòng)

| Ô | Lý do tại chỗ | Chờ ai |
|---|---|---|
| Phân lớp độ đậm | Chờ đường trích mặt đứng (S2). Phần tính đã xong (`plan-depth.ts`, 25/25 test); `grep elevationToEntities components/ app/` = **0** ⇒ chưa màn nào sinh ra mặt đứng | S2 |
| Cây · người từ thư viện | Hiện sinh bằng hàm. Bộ block cây/người thuộc thư viện khối — mảng S3 | S3 |
| Xuất PNG bản trình bày | `lib/cad/render.ts:620` `renderDocToDataURL` ép `forceColor:'#111111'` ⇒ xuất ra mất sạch màu. Sửa `render.ts` ngoài vùng phiên | chưa phân |
| Bảng màu theo studio | Chưa nối Brand Kit. Bảng màu ĐÃ là tham số truyền đè (`PresentOptions.palette`) — chỉ thiếu màn chọn | chưa phân |

Nút **"Đặt nhãn leader"** cũng `disabled` khi chưa chọn gì, kèm lý do *"Chọn vật thể cần ghi nhãn trước."*

## 6 · Checkpoint S5 — cắm đúng hợp đồng

Việc 1 (chế độ trình bày) **không cắm** checkpoint: nó chỉ đổi cách vẽ, không sinh entity, không ghi
vào `Doc` — đúng như phiếu S5 nói. Việc 2 (leader) **có** cắm vì nó ghi thật vào `Doc`.

Đo trên app thật, 6 đồ nội thất đang chọn:

```
XEM TRƯỚC (SVG hình học THẬT, không phải câu mô tả):
  S O F A   3   C H Ỗ · G H Ế   B À N H · B À N   Ă N   6 · T Ủ   Á O · B Ế P   C H Ữ   I · G I Ư Ờ N G   Đ Ô I
Tham số: Tỉ lệ in 1:100 · Tập góc 30°·45°·60° · Landing 20 × bề dày nét · Không đặt được: không có
Seed: 3772151827                                    ← KS2, bắt buộc, hiện ra
Không nhận thì quay về: bản vẽ trước khi đặt nhãn (128 đối tượng)   ← KS4, bắt buộc
6 checkbox + "Bỏ chọn tất cả"                        ← KS3
```

**KS3 kiểm tận cùng:** bỏ tick 2 nhãn → nút tự đổi thành **"Nhận 4 phần"** → bấm Nhận →
`doc.entities` tăng **đúng 12** (4 leader × 3 entity), và 4 nhãn ghi vào **đúng 4 cái còn tick**
(Bàn ăn 6 · Tủ áo · Bếp chữ I · Giường đôi); 2 cái bỏ tick KHÔNG được ghi. `only` trong
`leadersToEntities()` chặn hẳn đường "ghi cả mẻ".

## 7 · LỖI ĐÃ MẮC TRONG PHIÊN (bắt buộc — §0h HG6)

**Ba lỗi, cả ba chỉ lộ ra khi mở app thật. Test xanh trước đó không bắt được cái nào.**

**① Thảm phủ kín cả căn.** Để `clusterGapMm = 2200` — trong căn hộ ~60 m² thì MỌI món đồ đều cách
nhau dưới 2,2 m ⇒ phòng khách + bàn ăn + bếp + giường gộp thành MỘT cụm ⇒ một tấm thảm trùm hết,
sai hẳn `B1` (thảm nằm dưới TỪNG cụm ghế). Sửa: hạ về **900** = bề rộng lối đi một người
(`neufert-circulation-one-person` `minWidthMm:750`, làm tròn lên nấc lối đi chính) — *hai món mà
lọt được một người đi giữa thì thuộc hai cụm khác nhau*. Số có căn cứ nghề, không phải chỉnh cho vừa mắt.

**② Cây mọc ngoài nhà.** Cây đặt ở góc cụm + đệm thảm; cụm sát tường thì góc rơi RA NGOÀI công
trình. Sửa: kẹp mọi trang trí vào khung kết cấu (`clampIn`). 🟡 **Khai thật giới hạn:** kẹp theo
**khung bao** chứ không theo **đường bao sàn thật** — nhà không phải hình chữ nhật thì cây vẫn có
thể nằm ngoài mép tường thật. Muốn đúng tuyệt đối phải dò mặt phẳng (planar face finding) — cùng
đúng cái lỗ hổng `dxf-plan.ts:298` đã ghi. Chưa làm, không giấu.

**③ Layer tiếng Việt CÓ DẤU trượt hết regex.** Đây là lỗi nặng nhất và là gốc của ① nhìn thấy trên
màn. Bản vẽ demo đặt layer **"Tường" · "Trục" · "Ghi chú"**; regex gợi ý của tôi viết KHÔNG DẤU
(`tuong`/`truc`/`ghi chu`) nên **không khớp cái nào** ⇒ 22 đường TRỤC rơi xuống nhánh mặc định và
bị xếp thành **ĐỒ ĐẠC** ⇒ lưới trục dài 15 m bị kéo vào cụm. Sửa hai tầng, cả hai đều cần:
1. `foldVietnamese()` — bỏ dấu trước khi so tên layer. **Bản vẽ tiếng Việt là ca THƯỜNG của sản
   phẩm này, không phải ngoại lệ** — viết regex không dấu rồi quên fold là lỗi hệ thống, không phải sơ suất.
2. `furnitureClusters()` nay CHỈ gom `type==='block'` hoặc `elementType==='furniture'` **khai báo**.
   Nhánh mặc định của `classifyPresentRole` trả `'furniture'` cho mọi hình không căn cứ — dùng cái
   đoán đó để gom cụm là vi phạm K3.

**④ (không phải lỗi của tôi, nhưng do việc của tôi lộ ra):** `entityBox()` xấp xỉ **MỌI block thành
±1200 mm cố định** (`lib/cad/model.ts`, *"đủ cho zoom-extents"*) — cái ghế 440 mm cũng đọc ra
2400×2400. Đúng cho zoom-extents, **sai cho gom cụm**. Không sửa `entityBox` (đổi là hồi quy
zoom-extents toàn app); viết `itemBox()` cục bộ đọc kích thước thật từ `BLOCK_MAP`, có áp `sx/sy`
và góc xoay.

**⑤ Lỗi trong chính TEST của tôi.** Bản test đầu cho ① dùng `sofa3` rộng 2,1 m đặt cách nhau 1,8 m
⇒ hai bao CHỒNG nhau ⇒ test đỏ. Test đỏ là ĐÚNG, sai nằm ở dữ liệu test chứ không ở hàm. Suýt sửa
nhầm hàm gom cụm. Đã ghi cảnh báo ngay trong test để người sau khỏi đi lại vết đó.

Cả 5 nay đều có test canh (`plan-present.test.ts` mục [12] và [13]).

## 8 · Phát hiện NGOÀI phạm vi — cần người khác xử

🔴 **Nhãn leader làm hỏng số GFA.** Ghi 4 leader vào bản vẽ demo → thanh trạng thái nhảy từ
**"GFA 58.5 m² · 5 phòng"** lên **"GFA 119.4 m² · 9 phòng (4 khác)"**. Nguyên nhân:
`lib/cad/standards/checker.ts:109` `findRoomLabels()` coi **mọi TEXT lọt `ROOM_NAME_RE`** là một
phòng — nhãn leader là text nên bị đếm thành phòng. Không phải bug do phiên này đẻ ra; phiên này
chỉ làm nó lộ ra. **Không sửa** (`checker.ts` ngoài vùng, và sửa đúng cần lọc theo layer/vai — là
quyết định kiến trúc, không phải vá). Xoá 4 leader thì số trả về 58.5 m² đúng như cũ.

## 9 · Chưa verify — khai thật (N5)

- **Phân lớp độ đậm chưa thấy bằng mắt**: đúng 25/25 test hàm thuần, nhưng chưa có mặt đứng thật
  trong app để tô (chờ S2 mount `elevationToEntities`).
- **Chưa thử biến thể `B2` "đảo trên nền be" trên bản vẽ thật** — có nút, có test, nhưng ảnh chụp
  ở mục 2 là chế độ `flat` (`B1`). Nhãn tên khu trên đảo **cố ý để trống** khi chưa có nhãn thật
  (K3: không tự bịa tên khu).
- **Letter-spacing của nhãn leader làm bằng chèn THIN SPACE**, vì `TextEntity` không có trường
  letter-spacing và thêm field mới cho một hiệu ứng trình bày là vi phạm K4. Đánh đổi: chuỗi vẽ ra
  không tìm kiếm/sửa được như chuỗi gốc ⇒ `LeaderPlacement` luôn giữ `label` GỐC cạnh `labelDisplay`.
  Ghi rõ trong docstring, không giấu.
- **Hai `next dev` chung một `.next` thì cả hai hỏng**: server 3000 báo *"missing required error
  components"* suốt lúc tôi chạy thêm server 3002; dừng 3002 thì 3000 tự lành ngay. Không phải bug
  app — nhưng là bẫy vận hành thật cho các phiên song song, nên ghi lại.

## 10 · File đã sửa/tạo (V6 — CHƯA COMMIT)

```
MỚI   lib/cad/plan-present.ts · plan-present.test.ts
MỚI   lib/cad/plan-leader.ts  · plan-leader.test.ts
MỚI   lib/cad/plan-depth.ts   · plan-depth.test.ts
MỚI   components/cad/PlanPresentPanel.tsx · LeaderPreview.tsx · plan-present-store.ts
SỬA   components/cad/CadCanvas.tsx   (import · subscribe store trình bày · 1 dòng chọn ống kính)
SỬA   components/cad/CadEditor.tsx   (import · state · nút toolbar "Trình bày" · mount panel)
SỬA   docs/CHECKLIST-TONG.md         (4 ô trống mới + 1 dòng changelog)
SỬA   docs/BAO-CAO-COWORK-TRINH.md   (file này)
```

---

# 06/08/2026 — PHIÊN S4 · VIỆC 4 (VẼ LẠI BỘ BLOCK) + VIỆC 5 (SỬA viewBox)

> **V6 — KHÔNG COMMIT.**
> ⚠️ **Vùng mảng:** phiếu S4 gốc ghi `public/cad-library/**` + `block-library.ts` là mảng **S3, cấm
> đụng**. Hoà giao trực tiếp việc này nên tôi làm, sau khi kiểm va chạm: S3 đang sửa
> `lib/cad/block-library.ts` (mtime 05/08 21:42, +44 dòng "cụm sinh bằng hàm") — **tôi KHÔNG đụng
> file đó**; `scripts/cad-library/*` chưa ai chạm từ 11/07 nên tôi chỉ vào đúng đó.

## 1 · VIỆC 5 — viewBox (sửa 1 chỗ, 46 cái cùng đúng)

**Gốc lỗi:** `svgFromPrims()` dựng viewBox **đối xứng quanh gốc toạ độ** theo `w`/`h` KHAI BÁO
(`viewBox = -W/2, -H/2, W, H`). Chỉ đúng khi hình được vẽ cân quanh gốc.

Đo thật trước khi sửa: **9/46 block không cân** — `stairs-l-shape` lệch **860 mm** ·
`kitchen-cabinet-l` 750 · `living-sofa-lshape` 625 · `arch-door-single` 450 · `arch-door-double` 375.

**Sửa:** dựng viewBox từ **khung bao THẬT của chính `prims`** (`primsBBox()`, arc lấy đúng các điểm
`sampleArc()` sẽ vẽ). Bẫy đã tránh: nhóm vẽ nằm trong `transform="scale(1,-1)"` nên dải Y nhìn thấy
là `[-maxY, -minY]` — lấy nhầm `[minY, maxY]` là ảnh văng khỏi khung.

⇒ Block thêm về sau **tự đúng**, không phải nhớ luật "vẽ cho cân quanh gốc".

**🔴 Lỗi thứ hai tìm ra khi đo, TỔNG chưa nêu:** `w`/`h` khai tay **không khớp hình thật** ở 4 block
— `living-sofa-lshape` khai cao 1700 nhưng thật **2150** · `stairs-l-shape` khai 2400 thật **3400** ·
`bath-bidet` 480/510 · `arch-window-bay` 300/360. Hai số đó đi thẳng vào `manifest.json` và là kích
thước panel Thư viện hiển thị ⇒ **thư viện đang nói sai số đo** (§0f TB1). Sửa: `LIB_BLOCKS` nay
**đo lại từ `prims`** (`measurePrims()`), số khai tay chỉ còn là ý định thiết kế.
Sửa trong `blocks-data.ts` chứ KHÔNG trong generator — phiếu cho phép sửa generator đúng 1 chỗ.

## 2 · VIỆC 4 — 16 block vẽ lại / nâng cấp

**SAI VẬT — vẽ lại từ đầu (9 block):**

| Block | Trước | Sau |
|---|---|---|
| `plant-pot-small/large` | 2 vòng tròn đồng tâm (donut) | miệng chậu tròn + **2 lớp tán bất đối xứng sinh bằng hàm có hạt giống** + 2–3 nhánh cong |
| `plant-tree-top` | 3 vòng tròn + 2 đường thập = **vòng ngắm súng** | 3 lớp tán bất đối xứng lồng nhau + gốc cây. Không đường thập |
| `bath-toilet` | hộp + đa giác 6 đỉnh nhọn + tròn = con dấu | **két nước bo góc + bầu dục thân + vành ngồi + cổ nối** (380×700) |
| `bath-bidet` | cùng bệnh, gần giống hệt bồn cầu | **bầu dục + vành + gờ vòi**, KHÔNG két nước — đó chính là điểm phân biệt với bồn cầu (360×560) |
| `bedroom-wardrobe-2door/3door` | răng cưa tam giác đều | **cánh + cung quét 90°** mỗi cánh |
| `vehicle-car-sedan/suv` | **CÙNG MỘT HÌNH** (cùng `octagon` + 4 đường) | sedan mũi/đuôi **vát dài**, ca-bin lùi sau, kính cong · SUV **cắt cụt**, ca-bin dài, **gờ nóc dọc** |

**THÔ — nâng cấp (7 block):**

| Block | Sửa gì |
|---|---|
| `dining-table-4/6/round-4` | ghế từ **ô vuông rỗng** → `chairAt()`: mâm bo góc + **lưng cong** + 2 mẩu tay, **có hướng ngồi**. Bàn tròn: ghế quay mặt vào bàn. Gộp `diningChair`+`chairSquareAt` thành một hàm quay được |
| `living-sofa-2seat/3seat` | thân bo góc · **lưng cong** · tay bo đầu · đệm bo góc |
| `living-sofa-lshape` | cùng ngôn ngữ trên, giữ nguyên bố cục để không đổi thói quen đặt block |
| `living-armchair` | trước là `sofa(800,800,1)` (ghế bành = sofa, đều hộp). Nay hàm riêng theo **mẫu `G1`**: đường bao + 4 đường cong gợi nệm, cỡ **630×580** lấy từ bảng đo ảnh `G2` |

**Lỗi chung cả bộ — đo trước/sau:**

| | Trước | Sau |
|---|---|---|
| Block KHÔNG dùng arc nào | **41/46** | **28/46** |
| Trung vị số hình/block | 4 | 5 |
| Block lệch trong thumbnail | 9 | **0** (viewBox theo bao thật) |
| `w`/`h` manifest sai so hình | 4 | **0** |

Thêm bộ helper cong dùng chung: `roundedRect()` (4 thẳng + 4 cung) · `ellipse()` · `canopy()`
(tán bất đối xứng, làm mượt trung bình trượt 3 điểm — không mượt thì ra đúng "răng cưa" mà nguồn cấm).

## 3 · Nghiệm thu

- `npx tsx scripts/cad-library/verify-library.ts` → **46/46 DXF parse lại đúng 100%** bằng
  `lib/cad/dxf.ts`. Đây là thứ app thật đọc, quan trọng hơn thumbnail.
- **TẤT ĐỊNH (KS2):** chạy generator 2 lần, `md5` file .dxf **giống hệt**. Tán cây bất đối xứng
  nhưng sinh lại luôn ra đúng hình cũ — ⛔ không `Math.random()` dòng nào trong `blocks-data.ts`.
- `npx tsc --noEmit -p .` → **0 lỗi toàn repo**.
- 99/99 test của S4 hôm qua vẫn xanh (39+35+25) — không hồi quy.
- **Nhìn tận mắt (NT2):** render cả 46 SVG ra lưới trong trình duyệt, 3 vòng (trước sửa · sau vòng 1
  · sau vòng 2). Vòng cuối render **đúng cách `BlockLibraryDemo.tsx:257` render** — `<img src>` trỏ
  vào dev server thật + `object-contain` trong ô cố định — cả 46 vào giữa ô, đọc được ở cỡ thumbnail.
- Panel Thư viện trong app: mục "Ký hiệu · khối" đếm đúng **46**.

## 4 · LỖI ĐÃ MẮC TRONG PHIÊN (§0h HG6)

**Cả ba đều do tôi vẽ hỏng ở vòng 1, chỉ lộ ra khi RENDER RA NHÌN. Không lần nào test/tsc bắt được.**

**① Ghế bành ra MẶT CƯỜI.** Vòng 1 tôi đặt 4 cung "gợi nệm" theo mẫu G1 nhưng chọn tâm/bán kính
bậy: cung lưng + cung đệm thành hai nét cong ôm nhau như cái miệng, 2 cung tay thành hai con mắt.
Sửa: bỏ cung tay, dùng **đường thẳng làm mép trong hai tay** (tay là khối chữ nhật, không phải cung),
cung chỉ giữ cho lưng và mép đệm.

**② Tủ áo ra CÁI RÈM.** Vòng 1 tôi đặt bản lề **so le** (cánh chẵn mở trái, cánh lẻ mở phải) vì nghĩ
tủ thật làm vậy. Hậu quả: hai cung gặp nhau ở giữa thành một đường liền, **và hai cánh nằm ĐÚNG TRÊN
mép hông tủ nên vô hình** ⇒ nhìn ra tủ cao gấp đôi, không ra cánh cửa. Sửa: bản lề **cùng một bên**,
mọi cánh mở cùng chiều — cánh rơi vào vạch chia trong lòng tủ nên thấy được, cung lặp cùng hướng
đọc ngay ra "dãy cánh mở".

**③ Lưng ghế ăn thành VÀNH TRĂNG RỜI.** Vòng 1 để `r = 0.56·seat`, tâm đẩy ra sau `-0.30·seat` ⇒
cung phình ra ngoài mâm, trông như một vành trăng nằm tách phía sau ghế. Sửa: tâm về sát mâm
(`-0.02·seat`), bán kính `0.47·seat` ⇒ lưng dính vào mâm.

**Bài học chung:** đây là việc THUẦN THỊ GIÁC — `tsc` xanh, test xanh, DXF parse 100% mà hình vẫn
là mặt cười. Với block/ký hiệu thì **render ra nhìn là bước nghiệm thu duy nhất có giá trị**; ba
vòng render mới ra bộ dùng được. Đúng tinh thần §0g NT2/NT3.

## 5 · Chưa làm / khai thật (N5)

- **Cung quét làm kích thước bao lớn hơn thân vật**: tủ 1200×600 ⇒ manifest ghi **1200×1200**. Đây
  là **đúng quy ước sẵn có của thư viện** (`arch-door-single` cũng khai 900×900 cho cánh cửa 900):
  số khai là bề rộng BẢN VẼ kể cả cung, không phải bề rộng vật. Nếu Hoà muốn tách hai số (footprint
  vật vs extent bản vẽ) thì cần thêm trường `footprint` vào `LibBlockDef` — **chưa làm**, vì đó là
  đổi hình dạng dữ liệu của thư viện, nên để Hoà/TỔNG quyết.
- **Route `/cad-library-demo` không vào được** để nghiệm thu: nó khoá sau `NEXT_PUBLIC_DEMO=true`
  (`app/cad-library-demo/page.tsx:14`). Không bật vì phải khởi động lại dev server đang dùng chung
  với phiên khác (hôm qua đã đo: hai `next dev` chung một `.next` là cả hai hỏng). Thay bằng cách
  render **y hệt cách component đó render** — nêu ở mục 3.
- **`kitchen-island` nhìn còn yếu** (một ô vuông nhỏ + 1 chấm trong khung 2000×900) và
  `bath-shower`/`stairs-straight` còn thô. **Không nằm trong danh sách TỔNG giao** nên tôi không tự
  mở rộng phạm vi — ghi ra để đợt sau xử.
- 28/46 block vẫn chưa dùng arc — phần lớn là thứ **đúng ra phải thẳng** (kệ, tủ, cột vuông, bàn chữ
  nhật, ký hiệu). Không ép thêm cong cho đủ chỉ tiêu (§0f TB3: thẩm mỹ là HỆ QUẢ, không phải lớp phủ).

## 6 · File đã sửa (V6 — CHƯA COMMIT)

```
SỬA  scripts/cad-library/generate-library.ts   (VIỆC 5 — primsBBox + viewBox theo bao thật; ĐÚNG 1 chỗ như phiếu cho phép)
SỬA  scripts/cad-library/blocks-data.ts        (VIỆC 4 — helper cong + 10 hàm vẽ lại + measurePrims)
SINH public/cad-library/**                     (46 .dxf + 46 .svg + manifest.json — chạy lại generator)
SỬA  docs/BAO-CAO-COWORK-TRINH.md              (file này)
KHÔNG ĐỤNG lib/cad/block-library.ts            (S3 đang sửa — xác nhận diff vẫn đúng 44 dòng của họ)
```
