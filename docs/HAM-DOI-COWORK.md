# HẠM ĐỘI COWORK — HIẾN CHƯƠNG TỪNG VAI
**Ngày lập:** 03/08/2026 · Hoà duyệt cơ chế: *"mỗi phiên Cowork giữ 1 vai — hạ tầng, UI, tính năng theo nhóm, nghiên cứu."*
**Phiên mới nhận vai:** kết nối thư mục `~/Downloads/interiorflow` → đọc file này → đọc `SO-KIEM-TONG.md` → đọc `00-CHOT.md` → nhận vai theo dòng Hoà dán → tự tạo `docs/BAO-CAO-COWORK-<VAI>.md` và chỉ ghi vào đó.

## LUẬT CHUNG MỌI COWORK (khác với phiên CODE)
1. **Cowork KHÔNG code vào app.** Sản phẩm của Cowork = spec / mock HTML trong `docs/mocks/` / phiếu giao việc / báo cáo nghiên cứu. Code là việc của CHINH·PHU·G4 (xem `SO-KIEM-TONG.md` §2).
2. Mock bắt buộc: chép nguyên token `app/globals.css` (không hex tự chế, không màu TTT `#F06020 #002850 #1B1512 #F1ECE3`), đủ 2 theme (Tối mặc định), bo 10/14/20/28, hover theo `SPEC-HOVER-FOCUS-IDF`, mật độ theo `SPEC-MAT-DO-CON-TRO`.
3. Trước khi đề xuất gì: `ls docs/` + grep spec liên quan — **quyết định cũ là luật**, muốn lật phải trình COWORK-TỔNG kèm lý do, không tự lật.
4. Append-only: không sửa đè file người khác; file mới có ngày; mỗi quyết định mới = +1 dòng đề xuất cho `00-CHOT.md` (TỔNG duyệt mới ghi).
5. Chốt phiên ~85% context: cập nhật báo cáo của mình + mục "CHỐT PHIÊN" + việc dở. KHÔNG chờ ai nhắc.
6. Nghi vấn giữa các vai → ghi vào báo cáo mình + nêu 1 câu cho Hoà chuyển COWORK-TỔNG. Không cãi chéo file.

## VAI 1 · COWORK-TỔNG *(phiên đang chạy — điều phối)*
Trực ca chống rớt (`SO-KIEM-TONG` §1) · chốt quyết định · giao việc code · hợp nhất đề xuất các Cowork khác · giữ `00-CHOT` + `SO-KIEM-TONG`. **Không nghiên cứu dài, không dựng mock** — đẩy xuống các vai dưới.

## VAI 2 · COWORK-NC *(nghiên cứu)*
**Sở hữu:** `docs/nc/` (tạo mới) — mỗi đề tài 1 file `NC-<đề-tài>-<ngày>.md`, có nguồn URL, có mục "Điều IF nên làm".
**Chuẩn chất lượng:** như 5 bài đã có (xem cuối `SPEC-HA-TANG-UI-IF`, `SPEC-PANEL-ROLLOUT-IDF`, `SPEC-VAT-LIEU-PBR-IF`, `SPEC-LENH-VE-IF`): số liệu thật, doc chính hãng, than phiền cộng đồng, không marketing.
**Hàng đợi ban đầu (làm theo thứ tự):**
1. **Camera & đường quay** trong D5/Lumion/Twinmotion (đặt cam, campath, keyframe, xuất video) — nuôi bước ② DỰNG video chặng 3.
2. **Timeline editor** CapCut/Descript/Canva video: track, trim, nhịp cắt theo beat, chữ — nuôi editor Video.
3. **Spreadsheet nhúng** (Airtable/Notion table/Grist): cột kiểu, công thức, group — nuôi editor BOQ.
4. **Onboarding app pro** (Figma/Linear/Notion): first-run, empty state, sample project — nuôi Smart Tour v2.
5. **Xuất hồ sơ PDF/in** từ web app (Figma export, Canva print, CAD plot): dpi, bleed, font nhúng.

## VAI 3 · COWORK-UI *(thiết kế & mock)*
**Sở hữu:** `docs/mocks/` + `SPEC-DESIGN-SYSTEM-IF` (đề xuất sửa, TỔNG duyệt).
**Việc:** dựng/sửa mock theo phiếu; QA ảnh chụp app của Hoà so với mock (pixel-match, chỉ ra lệch bằng số); giữ ngôn ngữ ít chữ (`SPEC-PANEL-ROLLOUT-IDF` §3).
**Hàng đợi ban đầu:**
1. Mock **Mood+Collab G2** (presence dải avatar, mời +, sticky/comment/reaction, share Viewer/Commenter/Editor, frame theo phòng) — G4 sắp cần, đây là tính năng Hoà sợ mất.
2. Mock **mode Revit** chặng Vẽ (Navigator = cây cấu kiện, tường location-line, cửa con của tường — theo `SPEC-LENH-VE-IF` §2).
3. Mock **5 editor Trình bày** (Deck · Bảng vật liệu A3 · BOQ · Văn bản · Video timeline) — mỗi cái 1 file, dùng chung khung AppShell 6 ổ.
4. Mock **quả cầu vật liệu** trong Thư viện + panel tạo vật liệu template kiểu D5 (`SPEC-VAT-LIEU-PBR-IF` §2-3).
5. Rà 15 mock cũ trong `docs/mocks/` — cái nào lệch spec mới (AppShell/panel/mật độ) thì đánh dấu lỗi thời vào `docs/mocks/README-mocks.md` (tạo mới), khỏi ai port nhầm.

## VAI 4 · COWORK-VẼ *(tính năng chặng Vẽ)*
**Sở hữu:** spec nghiệp vụ chặng Vẽ — `SPEC-LENH-VE-IF` là kinh, viết tiếp phần chi tiết.
**Hàng đợi ban đầu:**
1. Viết `SPEC-VE-INFERENCE.md`: bảng trạng thái inference (màu/glyph/khoá Shift/mũi tên) + VCB gõ-số-sau (`3x` `/3`) áp vào từng lệnh L·PL·REC·C·ROOM hiện có — chi tiết đến mức PHU code không phải hỏi.
2. Viết `SPEC-VE-REVIT-MODE.md`: tường location-line · nối tự sạch MỘT kiểu · cửa/cửa sổ hosted (Space đảo chiều) · room + đường chia phòng · type/instance cho tường+matId — đối chiếu `lib/cad/*` hiện có, ghi rõ cái gì tái dùng.
3. Rà 10 khuyết ①-⑩ (`SPEC-LENH-VE-IF` §4) sau khi PHU grep xong — viết phiếu từng cái cho code.

## VAI 5 · COWORK-DỰNG *(tính năng chặng Dựng ảnh: node, 3D, vật liệu)*
**Sở hữu:** spec nghiệp vụ chặng 2 — kế thừa `SPEC-CHANG2-UI-2MODE` + `SPEC-VAT-LIEU-PBR-IF`.
**Hàng đợi ban đầu:**
1. Viết `SPEC-DUNG-NODE-PORT.md`: cổng nối CÓ KIỂU (ảnh/mask/vật liệu/params — nối sai chặn), "Turn into", node inspector nhẹ — từ `NGHIEN-CUU-NODE-CANVAS-DOITHU` thành spec code được.
2. Viết `SPEC-DUNG-CAMERA.md`: đặt cam + campath UI trên viewport (ăn `CamPathResult` có sẵn `lib/cad/campath.ts`), tầm mắt 1650, chờ NC-1 của COWORK-NC về là chốt.
3. Soi pipeline render AI hiện có (`lib/` + node types): viết bản đồ "prompt đi đâu, ảnh về đâu, credit trừ chỗ nào" — làm nền cho mọi phiếu sau.

## VAI 6 · COWORK-TRÌNH *(tính năng chặng Trình bày)*
**Sở hữu:** spec 5 loại hồ sơ — kế thừa `SPEC-MODE-PER-STAGE` §4 + `IF-PRESENT-*`.
**Hàng đợi ban đầu:**
1. Viết `SPEC-TRINH-BOQ-EDITOR.md`: bảng tính BOQ ăn `lib/boq` (đã có compute/xlsx/cache) — cột, công thức hiển thị, live-link vùng tô, xuất xlsx; chờ NC-3.
2. Viết `SPEC-TRINH-VIDEO-EDITOR.md`: timeline CapCut-level ăn footage từ `captureSequence` (đã có streaming API) — track/trim/nhạc/chữ; chờ NC-2. **KHÔNG viết engine video** (luật `CHOT-VIDEO-2-TANG`).
3. Rà `TICKET-PRESENT-UI-GON` + `AUDIT-PRESENT-UX` cũ: mục nào AppShell mới đã giải quyết, mục nào còn — ra danh sách sống/chết.

## THỨ TỰ MỞ (nếu không mở hết một lúc)
COWORK-UI trước (G4 đang đói mock G2) → COWORK-NC → COWORK-DỰNG → COWORK-TRÌNH → COWORK-VẼ.

## DÒNG DÁN CHO PHIÊN MỚI (mỗi phiên đúng 1 dòng)
```
Kết nối thư mục ~/Downloads/interiorflow, đọc docs/HAM-DOI-COWORK.md và nhận vai COWORK-<NC|UI|VẼ|DỰNG|TRÌNH>.
```

---
*COWORK-TỔNG lập 03/08/2026. Sửa hiến chương phải qua Hoà + TỔNG.*
