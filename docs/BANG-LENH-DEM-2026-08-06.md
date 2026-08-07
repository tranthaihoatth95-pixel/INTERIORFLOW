# 🌙 BẢNG LỆNH ĐÊM — dán một mạch rồi đi ngủ · 06/08/2026 22:45

> 🔴 **SỬA 22:55 — LIMIT CODE SẮP CẠN.** Giao diện Claude Code báo *"Approaching weekly usage
> limit · Resets Tue, Aug 11, 12:00 PM"*. Thả cả 5 phiên Code đêm nay = đốt sạch, rồi **4–5
> ngày không có Code**. Kế hoạch đổi: chỉ thả **2 phiên Code** (đóng đỏ THẬT), hoãn 2 phiên
> còn lại. Hai khối KHÔNG tốn limit Code thì chạy thoải mái.

## ĐỔI THỨ TỰ — dán theo bảng này

| Dán? | # | Cửa sổ | Vì sao |
|---|---|---|---|
| ✅ **DÁN** | ① | **Claude Design** | **0 limit Code**, chạy tẹt ga |
| ✅ **DÁN** | ② | **COWORK-PHU** | **0 limit Code**, chạy tẹt ga |
| ✅ **DÁN** | ③ | `2·m1-loi-cad` | 4 đỏ lõi CAD — giá trị đóng đỏ cao nhất |
| ✅ **DÁN cuối** | ⑥ | `1·fix-gocc` | lưu thật + nối nút — người dùng bấm được ngay |
| ⏸ **HOÃN** | ④ | `3·apply-node` | sửa mock/docs — **PHU làm được phần kiểm kê**, không cần Code |
| ⏸ **HOÃN** | ⑤ | `4·apply-ingiay` | nối dây + test — quan trọng nhưng không chặn ai |

**Lý do chọn ③ và ⑥:** hai phiên này đóng được **đỏ thành tính năng bấm được** (N6).
④ ⑤ là dọn dẹp và nối dây — để dành tới 11/8 vẫn kịp, không ai bị chặn.

Sáng dậy nếu limit còn thì dán ④ ⑤ sau.

---

**Cách dùng:** dán các khối được đánh ✅ ở trên, theo thứ tự. Mỗi khối tự chạy hết đêm,
không hỏi lại. Sáng dậy đọc `M-OUT` của từng đứa.

| # | Dán vào | Việc | Xong khi |
|---|---|---|---|
| ① | **Claude Design** | sửa 3 màn đã vẽ + vẽ 5 màn còn lại | 8 file `.dc.html` |
| ② | **COWORK-PHU** | 6 việc nghiên cứu/soạn spec | 5 file docs mới + `PHU-OUT.md` |
| ③ | `2·m1-loi-cad` | 4 đỏ lõi CAD còn treo | `M1-OUT.md` PHẦN 4 |
| ④ | `3·apply-node` | gỡ 2 mâu thuẫn mock + kho vật liệu | `M-APPLY-A-OUT.md` PHỤ LỤC A3 |
| ⑤ | `4·apply-ingiay` | nối hộp xuất vào 2D + bảng tròn + test + `ExternalRef` | `M-APPLY-C-OUT.md` bổ sung |
| ⑥ | `1·fix-gocc` | **dán CUỐI** — nó còn đang ghi lúc 22:22 | `M-FIX-C-OUT.md` bổ sung |

⚠️ **Trước khi dán:** Hoà `git commit` một phát (74 file dirty). Không commit thì đêm nay
5 phiên ghi chồng lên thay đổi chưa lưu — đúng cơ chế đã mất việc 4 lần.

---

# ① CLAUDE DESIGN

```
ĐÊM 06/08 — làm liên tục, mỗi lượt 2 màn rồi tự đi tiếp. Không hỏi lại, sáng tôi xem.
Nếu thấy nặng/chậm thì DỪNG, báo đã xong mấy màn — đừng cố vẽ tiếp rồi hỏng.

═══ PHẦN A · SỬA 3 MÀN ĐÃ VẼ ═══
Vấn đề chung, sửa cả 3 màn (Tiến độ · Gantt · Bảng việc · Lịch · Nhắc việc):

A1. MÀU ĐANG RỐI — luật mới: MỘT KHUNG HÌNH TỐI ĐA 2 MÀU BÃO HOÀ.
    Nay đang có 5 màu đặc cùng lúc (tím · xanh lá · đỏ · vàng · đỏ vạch hôm nay) ⇒ mắt
    không biết nhìn đâu. Phân lại:
    - Việc XONG      → KHÔNG màu. Xám nhạt, chữ mờ. Việc đã qua không cần đòi sự chú ý.
    - Việc ĐANG LÀM  → tím đặc (--accent). Đây là màu số 1.
    - Việc TRỄ HẠN   → đỏ đặc (--danger). Đây là màu số 2. Chỉ chỗ này được đỏ.
    - MỐC giao khách → hình thoi VIỀN vàng, RUỘT RỖNG. Không tô đặc.
    - Việc CHƯA TỚI  → nét đứt xám (đang đúng, giữ).
    - Vạch HÔM NAY   → xám sáng, nét đứt mảnh. ⛔ BỎ ĐỎ — hôm nay không phải cảnh báo,
      dùng đỏ là cướp sự chú ý của cái trễ hạn thật.

A2. CHỮ VẪN HƠI NHIỀU — cắt 3 chỗ lặp:
    - Thanh việc đang lặp lại tên đã có ở cột trái ("Khảo sát hiện trạng" / thanh ghi
      "Khảo sát"). ⇒ Thanh chỉ hiện AVATAR + %. Bỏ tên. Thanh ngắn 2–3 ngày sẽ không
      nhét nổi chữ, bỏ luôn là hợp lý.
    - "TRỄ 8 NGÀY" đang hiện HAI lần (chip cột trái + trong thanh) ⇒ giữ MỘT, ở cột trái.
    - Header cột trái: rút còn "VIỆC" (bỏ "VÀ MỐC" — hình thoi đã tự nói đó là mốc).

A3. ĐÁNH DẤU THỨ CHỈ DÀNH CHO MOCK — nay đang lẫn vào UI thật:
    - chip "PLACEHOLDER" cạnh tiêu đề
    - đoạn mô tả dài đầu màn ("Việc là thanh ngang trên trục thời gian…")
    ⇒ Bọc cả hai trong <div data-mock-only> và thêm chú thích HTML
      <!-- KHÔNG PORT: chỉ dành cho người xem mock -->

A4. Mỗi file THÊM <title> đúng tên màn. Nay 10/11 file không có title, mở nhiều tab
    không biết tab nào là gì.

A5. Hai cặp file TRÙNG, xử gọn:
    "Lịch việc" (cũ, 44KB) vs "Lịch · Nhắc việc" (mới, 55KB)
    "Tiến độ dự án" (cũ, 25KB) vs "Tiến độ · Gantt" (mới, 59KB)
    ⇒ Bản MỚI là bản chốt. Thêm vào <title> bản mới chữ " [BẢN CHỐT]", và thêm vào ĐẦU
      bản CŨ một dòng đỏ "⚠️ BẢN CŨ — đã thay bằng <tên bản mới>. Đừng port bản này."

═══ PHẦN B · VẼ 5 MÀN CÒN LẠI ═══
Mỗi lượt 2 màn, xong lượt thì tự đi tiếp lượt sau. Áp ĐỦ luật A1 (2 màu bão hoà) cho
mọi màn mới.

B1. CHAT NHÓM / CỘNG TÁC — 0 code, vẽ mới
    Luồng tin nhắn theo dự án · đính bản vẽ/ảnh xem trước ngay trong luồng · nhắc tên
    người · ghim tin · tìm trong luồng.
    NHIỀU NGƯỜI (đã chốt CÓ): con trỏ người khác kèm tên · dãy avatar "ai đang mở màn
    này" · cảnh báo 2 người sửa cùng chỗ kèm cách xử · trạng thái kết nối
    (đang đồng bộ / ngoại tuyến / đã xong).

B2. KNOWLEDGE BASE — tri thức dùng chung của studio
    Danh mục theo chủ đề · tìm bằng câu hỏi tự nhiên (không phải từ khoá) · mỗi mẩu ghi
    nguồn · ngày · ai thêm · dự án liên quan. Nối sang Notebook (Notebook = nguồn của
    MỘT dự án; Knowledge = dùng chung).

B3. KHÁCH DUYỆT HỒ SƠ — màn cho KHÁCH, không phải cho studio
    Xem hồ sơ theo tờ · duyệt/từ chối TỪNG PHẦN (cấm duyệt cả gói) · ghi chú đính đúng
    chỗ trên bản vẽ · trạng thái tổng "còn N mục chờ".
    Giao diện gọn, ít thuật ngữ — khách không cần biết CAD.

B4. BÁO GIÁ TỪ BẢNG KHỐI LƯỢNG — đã có code bảng khối lượng, VẼ VỎ, giữ cấu trúc
    THÊM: cột số lượng đếm (cái/bộ — nay chỉ có m²) · cột ảnh món · truy vết số nào do
    máy tính, số nào sửa tay · nút xuất báo giá gửi khách.

B5. PHIÊN BẢN HỒ SƠ — 0 code, 0 mock, vẽ mới
    So trước–sau bản vẽ, chỉ rõ chỗ vừa đổi · đóng dấu bản phát hành · lịch sử phát hành
    cho khách · ghi chú mỗi bản · nút phát hành lại.

═══ LUẬT ÁP CHO MỌI MÀN ═══
Nền TỐI, accent tím #6a57f5. TRUNG TÍNH: 0 logo/tên/màu studio nào. Dữ liệu mẫu HƯ CẤU.
G1 cấm animate opacity trên backdrop-filter · G2 panel nền đặc ≥92%, popover ≥96% ·
G4 mọi cỡ chữ khai line-height ≥1,5, CẤM text-[Npx] trần và font: rút gọn (cắt dấu tiếng
Việt) · G5 z-index theo thang · G6 nút quyết định phải có CHỮ, cấm icon trần ·
G7 bento chỉ cho màn tổng quan · G8 kéo-thả không được là đường duy nhất.
AVATAR luôn TRÒN: 1 người = 1 vòng; nhóm = nhiều vòng đè mép, tối đa 3 + "+N".
Phần chưa làm được: ô/nút disabled KÈM LÝ DO tại chỗ. Cấm nút giả bấm không ra gì.
Mỗi màn 1 file HTML tự chứa, có <title>.
```

---

# ② COWORK-PHU

> Khối dán đầy đủ nằm ở `docs/PHIEU-COWORK-PHU-2026-08-06.md` — chép nguyên khối trong file đó.
> 6 việc: dọn nhiễu `tsc` · chọn nền realtime · mô hình dữ liệu Gantt · rủi ro giấy phép DWG ·
> kiểm kê mock · cầu `.idf` cho ArchiNote. Không đụng vùng của 4 phiên code.

---

# ③ `2·m1-loi-cad`

```
[2·m1-loi-cad] ĐÊM 06/08 — 4 đỏ bạn tự liệt kê còn treo. Làm hết, đừng dừng hỏi.

TRƯỚC KHI GÕ — CỬA KIỂM CHỐNG HAI PHIÊN MỘT VIỆC (§0w, bắt buộc):
  ls -la docs/M*OUT*.md
Thấy M-OUT nào sửa trong 30 PHÚT gần đây mà chạm mảng/mock của bạn ⇒ DỪNG, báo, ĐỪNG LÀM.
Tối 06/08 đã có HAI phiên cùng port mock "Bảng nút" (M-NODE-BOARD-OUT 22:28 và
M-APPLY-A-OUT 22:37) — không mất việc, nhưng đốt limit gấp đôi. Limit nay SẮP CẠN,
reset 11/8. Làm trùng một lần nữa là mất mấy ngày không có Code.
Sổ tra: docs/SO-PHIEU-DA-PHAT.md — bảng "MOCK ↔ ai đã port".

BƯỚC 0 (dán kết quả vào báo cáo):
  grep -rna "zoomExtents\|mainClusterBox" lib/cad/ components/cad/
  grep -rna "Worker\|AbortController" lib/cad/dxf.ts lib/cad/dwg*.ts

1. G-M1-08 · NEO VÙNG TÔ (poché) với hồ sơ NHẬP VÀO — nặng nhất.
   Bạn đo: 0/126–161 mảng tô có đường bao trùng vòng để neo, KỂ CẢ bỏ điều kiện layer
   ⇒ hồ sơ thật KHÔNG có sẵn nửa "đường bao". Không neo bằng so trùng vòng được.
   Hướng khác (gợi ý, không ép): suy đường tim TỪ chính mảng tô · gom mảng tô cùng trục
   thành một bức · gắn cờ inferred rồi cho người dùng xác nhận (KS1 + KS5).
   ⛔ CẤM báo "đạt" bằng ca tường IF tự vẽ — ca đó ĐÃ đạt rồi.

2. G-M1-04 · ZOOM CỤM CHÍNH — bật 6/6 file, giấu 9–76% số hình.
   Bạn đã chỉ gốc: HAI CHỖ TÍNH HAI KHUNG. Gộp về MỘT nguồn tính, nới bộ lọc để file
   bình thường không bị giấu.

3. G-M1-07 phần còn lại · CÂY LỒNG 5 CẤP bị ép còn 1, tên block 127→29.

4. G-M1-01 · worker + tiến độ + huỷ cho đường DXF (đường DWG đã có đủ ba thứ).
   Máy bận: file 5–27 MB đo được 12–68 s, cả quãng đó giao diện đứng hình không thoát được.

NGHIỆM THU (N6):
  - 6/6 file thật, dán BẢNG SỐ trước/sau từng việc
  - G-M1-07: mở file xuất bằng ezdxf — giữ đúng chuẩn bạn đã lập vòng 1
  - G-M1-04: dán % hình bị giấu từng file (nay 9–76%, phải về ~0)
  - G-M1-01: chụp cảnh bấm HUỶ giữa chừng, giao diện không đứng
  - tsc: không thêm lỗi mới ngoài lỗi có sẵn
  - Báo cáo → BỔ SUNG docs/M1-OUT.md PHẦN 4, không ghi đè
⛔ Không đụng: lib/boq lib/ffe lib/materials components/materials components/nodes
   components/library components/print docs/GAP-IF.md. V6 KHÔNG commit.
```

---

# ④ `3·apply-node`

```
[3·apply-node] ĐÊM 06/08 — gỡ 2 mâu thuẫn bạn đã phát hiện, rồi kho vật liệu.

TRƯỚC KHI GÕ — CỬA KIỂM CHỐNG HAI PHIÊN MỘT VIỆC (§0w, bắt buộc):
  ls -la docs/M*OUT*.md
Thấy M-OUT nào sửa trong 30 PHÚT gần đây mà chạm mảng/mock của bạn ⇒ DỪNG, báo, ĐỪNG LÀM.
Tối 06/08 đã có HAI phiên cùng port mock "Bảng nút" (M-NODE-BOARD-OUT 22:28 và
M-APPLY-A-OUT 22:37) — không mất việc, nhưng đốt limit gấp đôi. Limit nay SẮP CẠN,
reset 11/8. Làm trùng một lần nữa là mất mấy ngày không có Code.
Sổ tra: docs/SO-PHIEU-DA-PHAT.md — bảng "MOCK ↔ ai đã port".

Bạn và một phiên khác ĐỘC LẬP cùng chỉ ra một chỗ ⇒ chắc chắn phải xử.

BƯỚC 0: grep -rna "dc-import" docs/mocks/*.html | head -20

1. 🔴 G-A-04 · HỢP ĐỒNG THIẾT KẾ RỖNG
   4 khối dc-import của Thư viện.dc.html (KeVatLieu · KeDoDac · KeDangGom · CotThongSo)
   trỏ vào file KHÔNG TỒN TẠI ⇒ mọi phiên port phải tự chế. M5-OUT.md:44-45 cảnh báo từ
   hôm qua, chưa đổi.
   Việc: liệt kê ĐẦY ĐỦ file con thiếu + chọn MỘT đường —
   (a) dựng 4 file con, hoặc (b) gỡ dc-import và nội hoá vào file mẹ. Nói rõ lý do chọn.
   ⛔ KHÔNG tự chế nội dung không có nguồn.

2. 🔴 G-A-05 · MOCK CÃI CHỐT
   Thư viện.dc.html mâu thuẫn chốt 05/08 của Hoà: kính vs đặc · dính đáy vs card rời ·
   214 vs 186px. Mở CHỐT GỐC ra đọc (đừng trích trí nhớ), lập bảng "mock ghi gì / chốt
   ghi gì / bên nào thắng / vì sao", rồi SỬA MOCK theo chốt.
   LUẬT: CHỐT thắng MOCK. Mock là bản vẽ, chốt là quyết định.

3. G-A-01 · Kho vật liệu thiếu cột thông số (mã · hãng · nguồn · đơn vị · GIÁ · nhám/bóng)
   ⇒ chọn vật liệu xong không dự toán được. Mock gọi CotThongSo — chính là file thiếu ở
   mục 1. Làm sau khi mục 1 xong.

4. Gỡ gap G-NB-01 khỏi docs/M-NODE-BOARD-OUT.md §4f — bạn đã chứng minh FlowCanvas.tsx:401
   làm rồi. Ghi 1 dòng đính chính tại chỗ.

NGHIỆM THU: dán grep chứng minh còn/hết file thiếu · bảng đối chiếu mock↔chốt có trích
nguyên văn chốt gốc kèm đường dẫn · mở mock bằng trình duyệt chụp màn → docs/screenshots/
Báo cáo → BỔ SUNG docs/M-APPLY-A-OUT.md PHỤ LỤC A3.
⛔ Không đụng: lib/cad components/cad lib/boq lib/ffe lib/materials components/print
   docs/GAP-IF.md. V6 KHÔNG commit.
```

---

# ⑤ `4·apply-ingiay`

```
[4·apply-ingiay] ĐÊM 06/08 — 3 việc bạn tự đề xuất, cộng 1 việc hạ tầng.

TRƯỚC KHI GÕ — CỬA KIỂM CHỐNG HAI PHIÊN MỘT VIỆC (§0w, bắt buộc):
  ls -la docs/M*OUT*.md
Thấy M-OUT nào sửa trong 30 PHÚT gần đây mà chạm mảng/mock của bạn ⇒ DỪNG, báo, ĐỪNG LÀM.
Tối 06/08 đã có HAI phiên cùng port mock "Bảng nút" (M-NODE-BOARD-OUT 22:28 và
M-APPLY-A-OUT 22:37) — không mất việc, nhưng đốt limit gấp đôi. Limit nay SẮP CẠN,
reset 11/8. Làm trùng một lần nữa là mất mấy ngày không có Code.
Sổ tra: docs/SO-PHIEU-DA-PHAT.md — bảng "MOCK ↔ ai đã port".

BƯỚC 0:
  grep -rna "ExportPdfDialog\|RadialToolMenu" components/ app/
  grep -rna "lark" prisma/schema.prisma

1. Nối Màn 7 (Hộp xuất PDF) vào chặng 2D KỸ THUẬT — nơi khổ giấy + Sheet[] + checklist
   là THẬT. Ở chặng 2D KHÔNG truyền paperLockedReason ⇒ mở khoá cột Khổ giấy. Đóng G-C-01.

2. Gắn Màn 9 (Bảng tròn chọn bút) vào công cụ bút/markup trên tờ giấy. Đóng G-C-02.
   ⚠️ Vùng bút/markup có thể thuộc làn khác — chạy BƯỚC 0 kiểm; đụng mảng người khác thì
   DỪNG mục này, báo, làm tiếp mục 3.

3. Test 3 hàm thuần: lineweightBarHeightPx · radialPositions · clampToViewport.
   clampToViewport PHẢI có ca tái hiện bug bạn đã vá (@keyframes chỉ có scale() nuốt mất
   translate(-50%,-50%)) — test không tái hiện được bug cũ thì thành trang trí.

4. THÊM · L-EXT1 — bảng cầu ExternalRef (đọc §0v trong docs/00-BAT-DAU-DOC-DAY.md trước).
   45 file dính chuỗi "lark", nặng nhất là schema LÕI mang tên nhà cung cấp trong TÊN CỘT
   (larkRecordId @unique · larkProjectCode · larkAccount · larkProjectName). Đổi nhà cung
   cấp về sau = phẫu thuật lõi.
   - Thêm model ExternalRef { system, externalId, entityType, entityId }
     + @@unique([system, externalId]) + index (entityType, entityId)
   - ⛔ KHÔNG xoá cột lark* cũ. ⛔ KHÔNG migrate dữ liệu. Chỉ THÊM đường mới.
   - Adapter lib/integrations/providers/lark.ts ĐÃ ĐÚNG — đừng đụng.
   - Test chặn hồi quy: schema.prisma không được có cột MỚI nào chứa "lark"
     (khoá con số hiện tại: 06/08 đo 10 dòng).
   - Hàm cầu nhỏ: entityType+entityId → externalId và ngược lại.
   ⚠️ MIGRATE: KHÔNG tự chạy prisma db push (phiên khác đang dùng chung dev.db).
     Soạn sẵn lệnh cho chủ dự án, ghi vào báo cáo.

NGHIỆM THU: mở app thật, đi từ chặng 2D → bấm ra hộp xuất → đổi khổ giấy → tờ giấy đổi
theo, chụp màn · test 3 hàm PASS có ca tái hiện bug cũ · test ExternalRef PASS ·
tsc không thêm lỗi mới.
Báo cáo → BỔ SUNG docs/M-APPLY-C-OUT.md.
⛔ Không đụng: lib/cad components/cad lib/boq lib/ffe lib/materials components/nodes
   components/library docs/GAP-IF.md. V6 KHÔNG commit.
```

---

# ⑥ `1·fix-gocc` — **DÁN CUỐI CÙNG**

> Lúc 22:22 nó **vẫn đang ghi** `components/materials/*`. Dán sau cùng để nó xong việc
> hiện tại đã.

```
[1·fix-gocc] ĐÊM 06/08 — đóng nốt cái bạn tự khai là "đỏ thật còn lại".

TRƯỚC KHI GÕ — CỬA KIỂM CHỐNG HAI PHIÊN MỘT VIỆC (§0w, bắt buộc):
  ls -la docs/M*OUT*.md
Thấy M-OUT nào sửa trong 30 PHÚT gần đây mà chạm mảng/mock của bạn ⇒ DỪNG, báo, ĐỪNG LÀM.
Tối 06/08 đã có HAI phiên cùng port mock "Bảng nút" (M-NODE-BOARD-OUT 22:28 và
M-APPLY-A-OUT 22:37) — không mất việc, nhưng đốt limit gấp đôi. Limit nay SẮP CẠN,
reset 11/8. Làm trùng một lần nữa là mất mấy ngày không có Code.
Sổ tra: docs/SO-PHIEU-DA-PHAT.md — bảng "MOCK ↔ ai đã port".

TIN MỚI — bom hẹn giờ bạn cảnh báo ĐÃ ĐƯỢC GỠ:
- Chủ dự án chạy prisma db push + generate lúc ~22:00.
- Kiểm bằng dữ liệu: PRAGMA table_info(ProductSpec) → 34 cột, CÓ room và confidence.
- Cờ SPEC_ROOM_COLUMN_READY = true; 3 đường specNormalize · specPatch · specToDto đã nối.
- Verify chạy thật: ghi room="Phòng ngủ Master" → đọc lại đúng → count = 1 → xoá sạch.
⇒ Đường xuống DB THÔNG. G-M3-08 đã đóng. Việc còn lại là nối FfeTable vào đó.

BƯỚC 0:
  grep -rna "SPEC_ROOM_COLUMN_READY" lib/ app/ components/
  grep -rna "FfeTable" lib/ components/ | head

1. 🔴 LƯU THẬT phòng/số lượng/độ tin cậy (mã mới G-M3-17).
   Nay FfeTable chỉ sống trong state màn hình ⇒ nhập 100 món rồi đóng tab là mất sạch.
   Nối FfeTable → ProductSpec qua đường đã mở.
   Nghiệm thu: nhập → ĐÓNG TAB → mở lại, phòng và độ tin cậy CÒN NGUYÊN.

2. Nối NÚT cho 3 việc engine đã xong mà người dùng chưa bấm được (G-M3-09/11/04):
   - bảng khối lượng: nút gọi computeBoq thật, hiện dòng món rời + cột SỐ LƯỢNG (cái/bộ)
   - cột ẢNH + nút "Xuất .xlsx" chạy thật
   - nút xuất hồ sơ FF&E nhiều món → buildFfeSheet
   G6: ba nút này là NÚT QUYẾT ĐỊNH ⇒ phải có CHỮ, cấm icon trần.

3. G-M3-01 bạn khai "phải đổi mô hình, ngoài vùng phiếu" — KHÔNG làm đêm nay.
   Chỉ ghi rõ cần đổi cái gì để TỔNG mở phiếu riêng.

NGHIỆM THU (N6):
  - Bấm từng nút trên app thật, chụp màn → docs/screenshots/
  - Mở .xlsx bằng Excel/Numbers THẬT (không chỉ openpyxl)
  - Vòng đóng-mở tab chứng minh dữ liệu còn
  - tsc: chỉ được có lỗi CÓ SẴN
  - Báo cáo → BỔ SUNG docs/M-FIX-C-OUT.md
⛔ Không đụng: lib/cad components/cad components/nodes components/library components/print
   docs/GAP-IF.md. V6 KHÔNG commit.
```

---

## Sáng dậy đọc theo thứ tự này
1. `docs/PHU-OUT.md` — PHU thường ra nhiều phát hiện nhất
2. `docs/M1-OUT.md` PHẦN 4 · `M-APPLY-A-OUT.md` A3 · `M-APPLY-C-OUT.md` · `M-FIX-C-OUT.md`
3. `docs/mocks/*.dc.html` mới của Claude Design
4. Nói TỔNG gộp hết về `GAP-IF.md` (§0u — một ngòi bút)

## Nhắc cuối
**V6 — không phiên nào commit.** Sáng Hoà commit một phát.
