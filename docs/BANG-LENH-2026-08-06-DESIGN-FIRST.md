# BẢNG LỆNH — mẻ design-first + luật L-EXT · 06/08/2026
**COWORK-TỔNG soạn theo §0k** (một mốc chốt · dán một mạch · mỗi lệnh ghi rõ *dán vào đâu · nội dung
nguyên khối · dấu hiệu xong*). Hoà dán ① ② ③ ; ④ là phần TỔNG tự chạy.
> **Sửa 06/08:** bỏ mốc "để dành 11/8" — limit Code còn ~50%, chạy song song, không tiết kiệm nữa.

> Nền tảng: `docs/AUDIT-WORKSPACE-SYNCWORK-2026-08-06.md` (chứng cứ file:dòng) · `GAP-IF.md` G-M8-01..05.
> **Đã chốt 06/08:** cộng tác nhiều người = **CÓ**, nền = **Yjs + y-websocket** · **L-EXT1** lõi trung
> tính · **L-EXT2** IF↔ArchiNote đi bằng `.idf`, không qua Lark.

---

## ① CLAUDE DESIGN — brief 11 màn *(dán nguyên khối vào Claude Design)*

```
BRIEF — IF · cụm WORKSPACE (SyncWork) + cụm KHÁCH · 11 màn
Sản phẩm: InteriorFlow — app desktop cho studio nội thất. Nền TỐI, accent tím #6a57f5.
TRUNG TÍNH TUYỆT ĐỐI: không logo/tên/màu của bất kỳ studio nào. Song ngữ VI/EN.

⚠️ ĐỌC KỸ TRƯỚC KHI VẼ — 6/11 màn ĐÃ CÓ CODE CHẠY THẬT.
Với những màn đó: KHÔNG vẽ lại từ đầu. Vẽ VỎ cho RUỘT đã có — giữ nguyên cấu trúc
dữ liệu và luồng hiện tại, chỉ nâng cấp hình thức + bổ sung phần còn trống.

BẢNG TRẠNG THÁI — vẽ theo đúng cột "việc cần làm":

A. CỤM WORKSPACE (SyncWork = lớp việc của hệ)
1. Bảng Kanban      — CÓ CODE (chỉ đọc, 3 cột theo trạng thái)
                      → vẽ vỏ + THÊM: kéo-thả ghi ngược, trạng thái "đang đồng bộ / lệch nguồn"
2. Gantt / tiến độ  — 0 CODE, vẽ mới hoàn toàn
                      → trục thời gian, phụ thuộc giữa việc, đường găng, mốc giao khách
3. Tổng quan dự án  — CÓ CODE (thẻ số liệu + danh sách dự án + 3 tab)
                      → vẽ vỏ, giữ cấu trúc tab
4. Chat nhóm/cộng tác — 0 CODE thật (mới có ghi chú rời)
                      → vẽ mới: luồng tin nhắn theo dự án, đính bản vẽ/ảnh, mention,
                        VÀ trạng thái nhiều người: con trỏ người khác, "ai đang mở màn này",
                        cảnh báo tranh chấp khi 2 người sửa cùng chỗ
5. Vitals (trợ lý AI) — CÓ CODE (bong bóng chat + huy hiệu trạng thái)
                      → vẽ vỏ; Vitals là tên trợ lý của IF, giữ nguyên
6. Notebook          — CÓ CODE + có trang riêng (nguồn tài liệu + chat trên nguồn)
                      → vẽ vỏ
7. Knowledge base    — CÓ MẢNH (mới có tầng tìm kiếm ngữ nghĩa, chưa có màn)
                      → vẽ mới màn, nối vào Notebook
8. Lịch / nhắc việc  — CÓ DỮ LIỆU (việc đã có hạn), CHƯA CÓ MÀN
                      → vẽ mới: lịch tháng/tuần, việc đến hạn, nhắc trước hạn

B. CỤM KHÁCH (đóng vòng thiết kế → khách)
9.  Khách duyệt hồ sơ — CÓ MẢNH (đã có trang chia sẻ bằng link + ô duyệt trong bảng món)
                      → vẽ màn duyệt cho KHÁCH: xem hồ sơ, duyệt/từ chối TỪNG PHẦN, ghi chú
10. Báo giá từ bảng khối lượng — CÓ CODE (bảng khối lượng có công thức, thêm cột)
                      → vẽ vỏ + THÊM: cột số lượng đếm (cái/bộ), cột ảnh món, xuất báo giá
11. Phiên bản hồ sơ  — 0 CODE, 0 mock, vẽ mới hoàn toàn
                      → so trước–sau bản vẽ, đánh dấu chỗ vừa sửa, đóng dấu bản phát hành,
                        lịch sử phát hành cho khách

LUẬT GIAO DIỆN BẮT BUỘC (đã trả giá để có, không được phá):
G1 · CẤM animate opacity trên phần tử có backdrop-filter (fade thì fade y/scale/nội dung)
G2 · Lớp nổi nền ĐẶC ≥92% (popover ≥96%). Chữ đạt 4.5:1 với nền CỦA CHÍNH NÓ
G4 · Mọi cỡ chữ phải khai line-height ≥1,5. CẤM text-[Npx] trần, CẤM font: rút gọn
      (cả hai xoá line-height ⇒ CẮT DẤU TIẾNG VIỆT)
G5 · z-index phải có thang khai báo, không rải số tuỳ hứng
G6 · CẤM icon hoá nút quyết định (Xoá · Gửi khách · Xuất hồ sơ) — nút quyết định phải có CHỮ
G7 · Bento chỉ cho màn TỔNG QUAN. Màn làm việc: vùng chính phải liền một khối
G8 · Kéo thả không bao giờ là đường DUY NHẤT — luôn có nút bấm tương đương
G9 · Kính lỏng chỉ cho thanh nổi nhỏ trên canvas. CẤM cho panel nhiều chữ

LUẬT QUYỀN KIỂM SOÁT (KS) — áp cho mọi chỗ có AI đề xuất:
KS1 dạng trung gian đọc/sửa được trước khi thành kết quả · KS2 cùng đầu vào ra cùng kết quả
(hiện seed) · KS3 duyệt TỪNG PHẦN không duyệt cả gói · KS4 lùi được và nói rõ lùi về đâu ·
KS5 máy phải nói được vì sao nó đề xuất vậy

CHỐNG QUÊN: phần chưa làm được thì vẽ ô/nút dạng disabled KÈM LÝ DO tại chỗ.
CẤM nút giả bấm không ra gì. Ô trống là bằng chứng còn việc.

Xuất: mỗi màn 1 file HTML tự chứa. Chia đợt, mỗi đợt ≤4 màn, xong đợt thì dừng cho xem.
```

**✔ xong khi:** có ≥11 file HTML, mỗi màn một file, mở bằng trình duyệt không lỗi.

---

## ② FIGMA — chốt design system *(dán vào phiên có Figma MCP)*

```
Chốt design system InteriorFlow từ nguồn code THẬT, không bịa token mới.
Nguồn: app/globals.css — 309 dòng khai biến CSS (--). Đọc hết trước khi vẽ.

Việc:
1. Bốc toàn bộ biến trong globals.css thành Figma Variables, giữ NGUYÊN TÊN biến
   (đổi tên = code và design lệch nhau, mất luôn giá trị làm việc này).
2. Dựng component cho: nút (thường/chính/nguy hiểm/disabled) · ô nhập · thẻ · panel nổi ·
   popover · chip trạng thái · thanh công cụ · bảng.
3. Ràng buộc PHẢI ép bằng style, không ép bằng ghi chú:
   - mọi cỡ chữ khai line-height ≥1,5 (thiếu là cắt dấu tiếng Việt)
   - panel/popover nền đặc ≥92%/96%, không dùng nền trong suốt cho panel nhiều chữ
   - z-index theo thang khai báo
4. Xuất bảng đối chiếu: biến Figma ↔ biến globals.css, chỉ rõ chỗ nào LỆCH.

TRUNG TÍNH: 0 logo, 0 tên studio, 0 màu thương hiệu của ai.
```

**✔ xong khi:** có file Figma + bảng đối chiếu, và bảng đó chỉ ra được số chỗ lệch (kể cả 0).

---

## ③ PHIÊN CODE — `ExternalRef` *(dán được NGAY — mảng `S6-chuan`)*

```
[S6-chuan] L-EXT1 — gỡ tên nhà cung cấp khỏi LÕI dữ liệu.

BƯỚC 0 (bắt buộc, N7): chạy và dán kết quả
  grep -rna "lark" prisma/schema.prisma
  grep -rlia "lark" lib/ components/ app/ | wc -l

Bối cảnh: 45 file dính "lark", và schema lõi đang mang tên nhà cung cấp trong TÊN CỘT
(larkRecordId @unique · larkProjectCode · larkAccount · larkProjectName). Mai mốt đổi
nhà cung cấp = phẫu thuật lõi.

Việc:
1. Thêm model ExternalRef { system, externalId, entityType, entityId } + @@unique([system, externalId]).
2. KHÔNG xoá cột lark* cũ, KHÔNG migrate dữ liệu trong đợt này (rủi ro cao, không cần gấp).
   Chỉ THÊM đường mới và cho code mới dùng nó.
3. Adapter Lark giữ nguyên (lib/integrations/providers/lark.ts đã đúng pattern).
4. Thêm test chặn hồi quy: schema.prisma không được có cột mới nào chứa "lark".

Nghiệm thu (N6 — file đổi KHÔNG phải xong):
  - npx tsc --noEmit sạch
  - test mới chạy PASS
  - ghi 1 bản ExternalRef thật và đọc lại được
V6: KHÔNG commit. Báo file đã sửa.
```

---

## ④ TỔNG tự chạy — ngay sau khi Hoà dán ① ②

| Việc | File |
|---|---|
| Ghi **L-EXT1 · L-EXT2** thành mục `§0v` | `docs/00-BAT-DAU-DOC-DAY.md` |
| Hạ vai Larkbase: "XƯƠNG SỐNG DỮ LIỆU" → **"nguồn ngoài, thay được"** | `docs/CAY-GIA-PHA-IDF.html` |
| Thêm `G-M9-01..03` (coupling schema · ArchiNote không có bản sao local · `.idf` chưa gánh khớp 2 app) | `docs/GAP-IF.md` |
| Gộp 4 M-OUT vừa xong (`M1` · `M-FIX-C` · `M-APPLY-A` · `M-APPLY-C`) → chấm lại đỏ/xanh | `GAP-IF.md` + cây gia phả |
| Cập nhật ledger | `docs/VIEC-DANG-CHO.md` |

**V6 — không phiên nào commit. Hoà commit.**
