---
name: if-handoff
description: Bàn giao phiên InteriorFlow an toàn trước khi cạn context. Ghi trạng thái bằng BẰNG CHỨNG ĐO ĐƯỢC (chủ sở hữu runtime tệp:dòng, danh tính máy chủ qua /api/dev-identity, lệnh test đã chạy, ảnh app thật) chứ không bằng trí nhớ, kèm một câu HÀNH ĐỘNG KẾ TIẾP làm được ngay. Dùng khi sắp hết context, khi đổi phiên, khi dừng giữa chừng một bề mặt, hoặc khi được yêu cầu "bàn giao".
---

# IF · BÀN GIAO PHIÊN

> **Bàn giao KHÔNG phải kể lại phiên.** Nó là một **bản đo** để người kế tiếp bước vào đúng chỗ
> mà không phải đo lại. Mọi dòng phải có **bằng chứng**: đường dẫn, `tệp:dòng`, lệnh đã chạy,
> đầu ra thật. Câu nào chỉ dựa vào trí nhớ ⇒ **xoá hoặc đánh dấu CHƯA KIỂM**.

---

## 1 · CHÍN MỤC BẮT BUỘC

Thiếu một mục là bàn giao chưa hợp lệ. Không đo được thì **ghi thẳng là chưa đo**, đừng bỏ trống.

| # | Mục | Bằng chứng phải kèm |
|---|---|---|
| 1 | **Bề mặt đang làm** + đang ở **bước nào trong chuỗi ⑰** của `if-ui-convergence` | tên bề mặt + số bước |
| 2 | **Chủ sở hữu runtime** | `tệp:dòng` chính xác, đã lần từ route xuống |
| 3 | **Danh tính máy chủ** | cổng · phục vụ **MÃ NÀO** · dev hay bản đóng băng — lấy từ `/api/dev-identity` |
| 4 | **Tệp đã chạm** | tách hai cột **ĐÃ KIỂM** ↔ **CHƯA KIỂM** |
| 5 | **Test / tsc** | kết quả **+ đúng lệnh đã chạy ra kết quả đó** |
| 6 | **Trình duyệt thật** | đã mở chưa · route · theme · **đường dẫn ảnh** |
| 7 | **Trạng thái thiết kế** | bản canonical nào (`docs/mocks/CLAUDE-DESIGN-CURRENT.md`) · phần nào **DESIGN MISSING** |
| 8 | **Quyết định đang chờ CON NGƯỜI** | **chỉ ghi cái chặn thật** — không dồn mọi lựa chọn có bằng chứng rõ vào đây |
| 9 | **HÀNH ĐỘNG KẾ TIẾP** | **một câu**, chính xác, làm được ngay |

---

## 2 · BA BẪY PHẢI TỰ KIỂM TRƯỚC KHI GHI — đều là ca thật đã trả giá

### B1 · CỔNG SAI = KẾT LUẬN SAI
Nhiều cổng cùng sống và **nhìn giống hệt nhau**:
`:3777` **ảnh chụp phát hành ĐÓNG BĂNG** · `:3778` **bản dựng cũ** · `:3799` **mã hiện tại**.
Soi nhầm cổng thì **sửa nguồn xong không thấy gì đổi**, và không ai biết số đó là rác.

⇒ Trước mọi kết luận từ trình duyệt, hỏi **"cổng này phục vụ MÃ NÀO?"** và trả lời bằng
`/api/dev-identity` (khai `cwd` + `HEAD` + `pid` của **chính tiến trình đang phục vụ**),
không bằng trí nhớ về cổng nào là cổng nào.

### B2 · "ĐÃ CÓ TRONG MÃ" ≠ "TỚI ĐƯỢC NGƯỜI DÙNG"
Ca thật: lý do nút mờ được đặt trong `title` — **câm trên cảm ứng**, **Tab bỏ qua nút disabled**
⇒ lý do **có trong mã mà không ai chạm được**. Máy soi không bắt được vì nó *có*.

⇒ Bàn giao chỉ được ghi *"đã xong"* khi đã kiểm **đường tới người dùng**: bàn phím · cảm ứng ·
cây trợ năng. Chưa kiểm ⇒ ghi **CÓ TRONG MÃ, CHƯA CHỨNG MINH TỚI ĐƯỢC NGƯỜI DÙNG**.

### B3 · GREP THÔ NÓI DỐI
Chú thích cũng khớp. Ca thật: `uppercase` ra **6 kết quả** mà **cả 6 nằm trong chú thích**.

⇒ Số đếm từ grep phải **mở ra đọc từng chỗ** trước khi ghi vào bàn giao, hoặc ghi rõ
*"số thô chưa lọc chú thích"*. Với câu hỏi *"còn ai dùng không"* thì dùng đồ thị import
(`soi:cam-dien`), không dùng grep chữ.

---

## 3 · KHUÔN ĐẦU RA

```markdown
# BÀN GIAO — <ngày> · <bề mặt>

## 1. Đang ở đâu
Bề mặt: … · Bước ⑦/⑰ (`if-ui-convergence`)

## 2. Chủ sở hữu runtime
route `…` → `components/…tsx:NN`  · bản sao còn sống: …

## 3. Máy chủ
:PORT — /api/dev-identity → HEAD `…` · branch `…` · dev|đóng băng

## 4. Tệp đã chạm
ĐÃ KIỂM: …
CHƯA KIỂM: …

## 5. Test / tsc
`<lệnh nguyên văn>` → <kết quả>

## 6. Trình duyệt thật
route · theme · ảnh: `…`   (chưa mở ⇒ ghi CHƯA CHỨNG MINH)

## 7. Thiết kế
canonical: `docs/mocks/…dc.html` · DESIGN MISSING: …

## 8. Chờ con người quyết
- …  (chỉ cái CHẶN thật)

## 9. HÀNH ĐỘNG KẾ TIẾP
> <đúng một câu, làm được ngay>

## ⑦b CHƯA CHẮC / CHƯA KIỂM
- …  (trống cũng phải ghi là trống)
```

---

## 4 · LIÊN QUAN

- Quy trình bề mặt: skill **`if-ui-convergence`**
- Tri thức thiết kế: skill **`if-design`** · Chấm điểm: skill **`if-design-review`**
- Sổ trạng thái: `docs/control/IF-CURRENT-STATE.md` · Sổ thất bại: `docs/design-campaign/02-FAILURE-LEDGER.md`
