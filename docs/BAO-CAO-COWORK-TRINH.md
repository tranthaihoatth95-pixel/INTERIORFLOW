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

## CHỐT PHIÊN [04/08 đêm — giờ máy 02/08 23:2x]
- **Đã xong phiên này:** nhận vai · việc 3 gốc (rà sống/chết 18 mục) · 3 việc bơm đêm (phiếu G4 + verify 3🟡 + spec Material A3). Sản phẩm: `BAO-CAO-COWORK-TRINH.md` · `PHIEU-PRESENT-G4.md` · `SPEC-TRINH-MATERIAL-A3.md`.
- ~~HẾT VIỆC 23:2x đợt 1~~ → đợt 2 bơm mục 4, đã chạy xong (xem mục ĐỢT 2 trên).
- **HẾT VIỆC đợt 2 (giờ máy 02/08 23:3x)** — hàng đợi §3 của TRÌNH cạn: cả 5 việc đã giao đều xong (phiếu G4 · verify 3🟡 · spec A3 · spec BOQ · spec Video).
- **Việc dở:** không.
- **Chờ người khác:** PHU thẩm định 4 điểm (mini-DSL + SUM() của BOQ · lib beat + đường MP4 của Video) trước khi 2 spec thành phiếu code · G4 nhận `PHIEU-PRESENT-G4` · Hoà trả lời §9 spec A3 lúc rảnh.
- **Nghi vấn chuyển TỔNG:** "Văn bản/Word biểu mẫu" là loại hồ sơ duy nhất chưa có việc spec — bơm cho TRÌNH phiên sau nếu muốn đủ 5/5.
- ⚠️ **SỰ CỐ COMMIT ĐỢT 2 (trung thực §0):** 3 file ĐÃ STAGED + nội dung an toàn trên đĩa, nhưng `git commit` fail — `.git/next-index-6.lock` (rác FUSE đợt 1, sandbox không unlink được) + `index.lock` mới sinh. HEAD lúc đó là `6ce940f` của phiên CHINH (2 phiên đụng nhau). KHÔNG retry theo luật. **Lệnh soạn sẵn cho Hoà chạy máy thật:**
  ```
  cd ~/Downloads/interiorflow
  rm -f .git/index.lock .git/next-index-6.lock
  git commit -m "docs(trinh): dot 2 - spec BOQ + Video tu NC-2/NC-3, chot phien" -- docs/BAO-CAO-COWORK-TRINH.md docs/SPEC-TRINH-BOQ-EDITOR.md docs/SPEC-TRINH-VIDEO-EDITOR.md
  ```
  (Chạy khi chắc không phiên nào đang thao tác git. File này sửa sau khi staged nên commit xong sẽ còn 1 phần modified — commit lần nữa cùng pathspec hoặc kệ, phiên sau gom.)
