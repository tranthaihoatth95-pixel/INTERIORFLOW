# PHIẾU CODE VÒNG 2 — 4 cửa sổ đang mở · 06/08/2026 22:20
Soạn SAU khi đọc 4 báo cáo thật. Mỗi phiếu giao đúng việc **chính phiên đó đã đề xuất** —
họ còn nguyên ngữ cảnh mảng, không phải kể lại từ đầu.

## ⚠️ LÀM TRƯỚC KHI DÁN — Hoà commit
`git status` đang **40 file dirty** ở `lib/` `components/` `app/` `prisma/`. Thả vòng 2 lên
thay đổi chưa lưu = đúng cơ chế đã làm mất việc 4 lần (V6, các ca `f77ce9d` · `2de4abf` · `080e78c`).
Tin tốt: `app/globals.css` bị **cả LÀN A và LÀN C cùng sửa** (+149 dòng, 23 biến) nhưng
**0 dấu xung đột** — mỗi bên một khối có chú thích riêng.

## Trạng thái đo được lúc 22:15 (dấu vết trên đĩa, không phải lời khai)
| Cửa sổ | M-OUT | Code sửa cuối | Đang giữ | |
|---|---|---|---|---|
| `1·fix-gocc` | 21:24 | 21:18 | 15 file `lib/boq` `lib/ffe` `lib/materials` | ✅ ngưng |
| `2·m1-loi-cad` | 20:58 | ~20:5x | 6 file `lib/cad` `components/cad` | ✅ ngưng |
| `3·apply-node` | 20:53 | ~20:5x | 12 file `nodes` `library` `FlowCanvas` | ✅ ngưng |
| `4·apply-ingiay` | 19:57 | ~19:5x | 2 file `print` `present-editor` | ✅ ngưng |

**Luật chung:** BƯỚC 0 `grep -rna` (`-a` bắt buộc, §0t) · 1 agent làm + 1 agent phản biện ·
**V6 KHÔNG commit** · đóng đỏ phải **BẤM ĐƯỢC** (N6) · ghi `M-OUT` của mình, **không đụng `GAP-IF`** (§0u).

---

## → dán vào cửa sổ `1·fix-gocc`

```
[1·fix-gocc] VÒNG 2 — đóng nốt cái bạn tự khai là "đỏ thật còn lại".

TRƯỚC KHI GÕ — CỬA KIỂM CHỐNG HAI PHIÊN MỘT VIỆC (§0w, bắt buộc):
  ls -la docs/M*OUT*.md
Thấy M-OUT nào sửa trong 30 PHÚT gần đây mà chạm mảng/mock của bạn ⇒ DỪNG, báo, ĐỪNG LÀM.
Tối 06/08 đã có HAI phiên cùng port mock "Bảng nút" (M-NODE-BOARD-OUT 22:28 và
M-APPLY-A-OUT 22:37) — không mất việc, nhưng đốt limit gấp đôi. Limit nay SẮP CẠN,
reset 11/8. Làm trùng một lần nữa là mất mấy ngày không có Code.
Sổ tra: docs/SO-PHIEU-DA-PHAT.md — bảng "MOCK ↔ ai đã port".

TIN MỚI, ĐỌC TRƯỚC KHI GÕ — bom hẹn giờ bạn cảnh báo ĐÃ ĐƯỢC GỠ:
- Chủ dự án đã chạy `prisma db push` + `prisma generate` lúc ~22:00.
- Kiểm bằng dữ liệu: PRAGMA table_info(ProductSpec) → 34 cột, CÓ `room` và `confidence`.
- TỔNG đã mở khoá `lib/server/specs.ts`: cờ SPEC_ROOM_COLUMN_READY = true, và 3 đường
  specNormalize · specPatch · specToDto đã nối 2 trường. tsc 0 lỗi ở file đó.
⇒ Đường xuống DB nay THÔNG. Việc còn lại là nối FfeTable vào đó.

BƯỚC 0 (dán kết quả):
  grep -rna "SPEC_ROOM_COLUMN_READY" lib/ app/ components/
  grep -rna "FfeTable" lib/ components/ | head
  grep -rna "computeBoq\|buildFfeSheet" components/ app/

VIỆC — theo thứ tự nặng dần:

1. 🔴 LƯU THẬT phòng/số lượng/độ tin cậy (cái bạn gọi là "đỏ thật còn lại của G-M3-08").
   Nay FfeTable chỉ sống trong state màn hình ⇒ nhập 100 món rồi đóng tab là mất sạch.
   Nối FfeTable → ProductSpec qua đường đã mở. Nghiệm thu: nhập → đóng tab → mở lại,
   phòng và độ tin cậy CÒN NGUYÊN.

2. Nối NÚT cho 3 việc engine đã xong mà người dùng chưa bấm được (G-M3-09/11/04):
   - bảng khối lượng: nút gọi computeBoq thật, hiện dòng món rời + cột SỐ LƯỢNG (cái/bộ)
   - cột ẢNH + nút "Xuất .xlsx" chạy thật
   - nút xuất hồ sơ FF&E nhiều món → buildFfeSheet
   Luật G6: ba nút này là NÚT QUYẾT ĐỊNH ⇒ phải có CHỮ, cấm icon trần.

3. Nếu còn sức: G-M3-01 bạn khai "phải đổi mô hình, ngoài vùng phiếu" — KHÔNG làm vòng này.
   Chỉ ghi rõ cần đổi cái gì để TỔNG mở phiếu riêng.

NGHIỆM THU (N6 — "file đã đổi" KHÔNG tính):
  - Bấm từng nút trên app thật, chụp màn → docs/screenshots/
  - Mở .xlsx xuất ra bằng Excel/Numbers THẬT (không chỉ openpyxl)
  - Vòng đóng-mở tab chứng minh dữ liệu còn
  - tsc: chỉ được có 3 lỗi CÓ SẴN (2 file 2407-Test + render-layer-index.test.ts)
  - Báo cáo → BỔ SUNG vào docs/M-FIX-C-OUT.md, không ghi đè
V6: KHÔNG commit.
```

---

## → dán vào cửa sổ `2·m1-loi-cad`

```
[2·m1-loi-cad] VÒNG 2 — 4 đỏ bạn tự liệt kê còn treo, làm theo đúng thứ tự bạn xếp.

TRƯỚC KHI GÕ — CỬA KIỂM CHỐNG HAI PHIÊN MỘT VIỆC (§0w, bắt buộc):
  ls -la docs/M*OUT*.md
Thấy M-OUT nào sửa trong 30 PHÚT gần đây mà chạm mảng/mock của bạn ⇒ DỪNG, báo, ĐỪNG LÀM.
Tối 06/08 đã có HAI phiên cùng port mock "Bảng nút" (M-NODE-BOARD-OUT 22:28 và
M-APPLY-A-OUT 22:37) — không mất việc, nhưng đốt limit gấp đôi. Limit nay SẮP CẠN,
reset 11/8. Làm trùng một lần nữa là mất mấy ngày không có Code.
Sổ tra: docs/SO-PHIEU-DA-PHAT.md — bảng "MOCK ↔ ai đã port".

Bạn đã đóng G-M1-18/19/20 với số đo thật (6/6 file mở được bằng ezdxf, 0 lỗi audit).
Vòng này là phần bạn ghi "còn treo, theo mức nặng".

BƯỚC 0 (dán kết quả):
  grep -rna "zoomExtents\|mainClusterBox" lib/cad/ components/cad/
  grep -rna "hatch" lib/cad/hatch.ts | head -5
  grep -rna "Worker\|AbortController" lib/cad/dxf.ts lib/cad/dwg*.ts

1. G-M1-08 · NEO VÙNG TÔ (poché) — với hồ sơ NHẬP VÀO.
   Bạn đo: 0/126–161 mảng tô có đường bao trùng vòng để neo, KỂ CẢ bỏ điều kiện layer
   ⇒ hồ sơ thật KHÔNG có sẵn nửa "đường bao", không neo bằng so trùng vòng được.
   Hướng khác (gợi ý, không ép): suy đường tim TỪ chính mảng tô · gom mảng tô cùng trục
   thành một bức · hoặc gắn cờ `inferred` rồi cho người dùng xác nhận (KS1 + KS5).
   ⛔ CẤM báo "đạt" bằng ca tường IF tự vẽ — ca đó ĐÃ đạt, không phải cái đang hỏi.

2. G-M1-04 · ZOOM CỤM CHÍNH — bật trên 6/6 file, giấu 9–76% số hình.
   Bạn đã chỉ ra gốc: HAI CHỖ TÍNH HAI KHUNG (nút "về cụm chính" ở panel cho khung khác
   khung lúc nạp). Gộp về MỘT nguồn tính, và nới bộ lọc để file bình thường không bị giấu.

3. G-M1-07 phần còn lại · CÂY LỒNG 5 CẤP bị ép còn 1, tên block 127→29.
   Hình học + số INSERT đã đúng. Còn giữ cây lồng.

4. G-M1-01 · worker + tiến độ + huỷ cho đường DXF (đường DWG đã có đủ ba thứ đó).
   Máy bận thì file 5–27 MB đo được 12–68 s, cả quãng đó giao diện đứng hình không thoát được.

NGHIỆM THU (N6):
  - Chạy trên 6/6 file thật, dán BẢNG SỐ trước/sau từng việc
  - G-M1-07: mở file xuất bằng CAD NGOÀI / ezdxf — giữ đúng chuẩn bạn đã lập ở vòng 1
  - G-M1-04: dán % hình bị giấu từng file (nay 9–76%, phải về ~0 với file bình thường)
  - G-M1-01: quay/chụp cảnh bấm HUỶ giữa chừng, giao diện không đứng
  - tsc: không thêm lỗi mới ngoài 3 lỗi có sẵn
  - Báo cáo → BỔ SUNG vào docs/M1-OUT.md (PHẦN 4), không ghi đè
V6: KHÔNG commit.
```

---

## → dán vào cửa sổ `3·apply-node`

```
[3·apply-node] VÒNG 2 — gỡ hai mâu thuẫn bạn phát hiện, rồi mới port tiếp.

TRƯỚC KHI GÕ — CỬA KIỂM CHỐNG HAI PHIÊN MỘT VIỆC (§0w, bắt buộc):
  ls -la docs/M*OUT*.md
Thấy M-OUT nào sửa trong 30 PHÚT gần đây mà chạm mảng/mock của bạn ⇒ DỪNG, báo, ĐỪNG LÀM.
Tối 06/08 đã có HAI phiên cùng port mock "Bảng nút" (M-NODE-BOARD-OUT 22:28 và
M-APPLY-A-OUT 22:37) — không mất việc, nhưng đốt limit gấp đôi. Limit nay SẮP CẠN,
reset 11/8. Làm trùng một lần nữa là mất mấy ngày không có Code.
Sổ tra: docs/SO-PHIEU-DA-PHAT.md — bảng "MOCK ↔ ai đã port".

Bạn và một phiên khác ĐỘC LẬP cùng chỉ ra một chỗ ⇒ chắc chắn phải xử, không phải nghi ngờ.

BƯỚC 0 (dán kết quả):
  grep -rna "dc-import" docs/mocks/*.html | head -20
  ls docs/mocks/ | grep -ai "KeVatLieu\|KeDoDac\|KeDangGom\|CotThongSo"

1. 🔴 G-A-04 · HỢP ĐỒNG THIẾT KẾ RỖNG.
   4 khối dc-import của `Thư viện.dc.html` (KeVatLieu · KeDoDac · KeDangGom · CotThongSo)
   trỏ vào file KHÔNG TỒN TẠI ⇒ mọi phiên port buộc phải tự chế. docs/M5-OUT.md:44-45 đã
   cảnh báo, tình trạng chưa đổi. Cùng lớp bệnh G-M5-05.
   Việc: liệt kê ĐẦY ĐỦ file con còn thiếu + đề xuất một trong hai đường —
   (a) dựng 4 file con, hoặc (b) gỡ dc-import và nội hoá vào file mẹ.
   Chọn đường nào cũng phải nói RÕ LÝ DO. KHÔNG tự chế nội dung không có nguồn.

2. 🔴 G-A-05 · MOCK CÃI CHỐT.
   `Thư viện.dc.html` mâu thuẫn chốt 05/08 của Hoà: kính vs đặc · dính đáy vs card rời ·
   214 vs 186px. Việc: mở CHỐT GỐC ra đọc (đừng trích trí nhớ — §0o), lập bảng
   "mock ghi gì / chốt ghi gì / bên nào thắng / vì sao", rồi SỬA MOCK theo chốt.
   Luật: CHỐT thắng MOCK. Mock chỉ là bản vẽ, chốt là quyết định.

3. 🆕 CHỐT 07/08 — CÁCH VÀO CỦA TẤM (đọc docs/00-CHOT.md mục "Bổ sung 07/08").
   Hoà chốt PHƯƠNG ÁN A: tấm giữ 720px · cột thông số CHỈ hiện khi đang chọn · cột kệ 214px.
   Và làm rõ "card rời" = NỔI LÊN TẠI CHỖ, KHÔNG trượt từ đáy.
   library-sheet-css.ts hiện mới đúng một nửa: bo 4 góc + hở đáy 14px ✅, nhưng
   transform-origin:50% 100% (:61) và translate(-50%, calc(100%+14px)) (:62) vẫn là
   chuyển động NGĂN KÉO. Sửa thành:
     transform-origin:50% 50%
     đóng: translate(-50%,10px) scale(.97)   mở: translate(-50%,0) scale(1)
     200ms cubic-bezier(.32,.72,0,1)  ·  prefers-reduced-motion ⇒ hiện thẳng
   ⚠️ CHỈ transform, KHÔNG animate opacity (G1).
   Nghiệm thu: quay/chụp 3 khung lúc mở — tấm phải xuất hiện đúng chỗ nó đứng, không bò từ đáy.

4. G-A-01 · Kho vật liệu thiếu cột thông số (mã · hãng · nguồn · đơn vị · GIÁ · nhám/bóng)
   ⇒ chọn vật liệu xong không dùng để dự toán được. Mock gọi `CotThongSo` — chính là
   file con không tồn tại ở mục 1. Làm sau khi mục 1 xong.

4. Gỡ gap G-NB-01 khỏi docs/M-NODE-BOARD-OUT.md §4f — bạn đã chứng minh
   FlowCanvas.tsx:401 làm rồi. Ghi 1 dòng đính chính tại chỗ.

NGHIỆM THU:
  - Mục 1: dán kết quả grep chứng minh còn/hết file thiếu
  - Mục 2: bảng đối chiếu mock ↔ chốt, có trích nguyên văn chốt gốc kèm đường dẫn
  - Mở mock bằng trình duyệt, chụp màn sau khi sửa → docs/screenshots/
  - Báo cáo → BỔ SUNG docs/M-APPLY-A-OUT.md (PHỤ LỤC A3), không ghi đè
V6: KHÔNG commit.
```

---

## → dán vào cửa sổ `4·apply-ingiay`

```
[4·apply-ingiay] VÒNG 2 — đúng 3 việc bạn tự đề xuất cuối báo cáo, cộng 1.

TRƯỚC KHI GÕ — CỬA KIỂM CHỐNG HAI PHIÊN MỘT VIỆC (§0w, bắt buộc):
  ls -la docs/M*OUT*.md
Thấy M-OUT nào sửa trong 30 PHÚT gần đây mà chạm mảng/mock của bạn ⇒ DỪNG, báo, ĐỪNG LÀM.
Tối 06/08 đã có HAI phiên cùng port mock "Bảng nút" (M-NODE-BOARD-OUT 22:28 và
M-APPLY-A-OUT 22:37) — không mất việc, nhưng đốt limit gấp đôi. Limit nay SẮP CẠN,
reset 11/8. Làm trùng một lần nữa là mất mấy ngày không có Code.
Sổ tra: docs/SO-PHIEU-DA-PHAT.md — bảng "MOCK ↔ ai đã port".

BƯỚC 0 (dán kết quả):
  grep -rna "ExportPdfDialog" components/ app/
  grep -rna "RadialToolMenu" components/ app/
  grep -rna "Sheet\[\]" components/cad/ lib/cad/ | head

1. Nối Màn 7 (Hộp xuất PDF) vào chặng 2D KỸ THUẬT — nơi khổ giấy + Sheet[] + checklist
   là THẬT. Nay ở chặng Trình chiếu nó mới nhận 1 "tờ" và checklist rỗng, và bạn đã cố ý
   khoá nút khổ giấy kèm lý do (đúng §9, không làm nút giả).
   Ở chặng 2D: KHÔNG truyền paperLockedReason ⇒ mở khoá cột Khổ giấy.
   Đóng G-C-01.

2. Gắn Màn 9 (Bảng tròn chọn bút) vào công cụ bút/markup trên tờ giấy.
   Component đã sẵn (onPick/onClose/x/y), chỉ thiếu chỗ gọi. Đóng G-C-02.
   ⚠️ Vùng bút/markup có thể thuộc làn khác — chạy BƯỚC 0 kiểm trước, đụng mảng người
   khác thì DỪNG và báo, đừng lấn.

3. Test cho 3 hàm thuần: lineweightBarHeightPx · radialPositions · clampToViewport.
   Riêng clampToViewport phải có ca tái hiện bug bạn đã vá (keyframes chỉ có scale() nuốt
   mất translate(-50%,-50%)) — test không tái hiện được bug cũ thì sớm muộn thành trang trí.

4. THÊM: 4 mock cụm in/giấy nay đã port xong ⇒ ghi 1 dòng vào docs/mocks/README-mocks.md
   đánh dấu "bản đã port" để phiên sau không port lại (đúng cái G-M5-03 kêu: 6 mock cùng
   tả một màn, không bản nào ghi "bản chốt").

NGHIỆM THU (N6):
  - Mở app thật, đi từ chặng 2D → bấm ra hộp xuất → đổi khổ giấy → thấy tờ giấy đổi theo
  - Bấm ra bảng tròn từ công cụ bút thật, chụp màn
  - Test 3 hàm PASS, có ca tái hiện bug cũ
  - tsc: không thêm lỗi mới ngoài 3 lỗi có sẵn
  - Báo cáo → BỔ SUNG docs/M-APPLY-C-OUT.md, không ghi đè
V6: KHÔNG commit.
```

---

## Hai việc tay Hoà (từ báo cáo `3·apply-node`)
1. **Dọn dữ liệu test** — flow "Untitled flow" nay có 3 node + nhóm "Nút tổng 1".
   Mở *Untitled flow* → Thiết kế 3D → chọn *Nút tổng 1* → Bỏ gom → xoá 3 node. Về "0 nút" là xong.
2. **Xoá DB rác** — `dev.db` 0 byte ở gốc repo (DB thật là `prisma/dev.db`), dễ khiến phiên sau
   truy vấn nhầm DB rỗng:
   ```bash
   rm ~/Downloads/interiorflow/dev.db
   ```

## TỔNG (Cowork local) làm song song — không tốn limit Code
① Dọn nhiễu `tsc` (3 file đỏ không thuộc ai) · ② theo dõi 4 M-OUT vòng 2 → gộp `GAP-IF` (§0u).

## Luật chia việc (chốt 06/08)
> Nghiệm thu bằng `tsc` / test / grep → **TỔNG**. Nghiệm thu phải **bấm được trên màn** → **Code**.
Lý do: TỔNG không mở được trình duyệt, không chạy được Prisma engine (sandbox `linux-arm64`,
client build `darwin-arm64`) — gặp thật khi mở khoá `G-M3-08` lúc 22:02.
