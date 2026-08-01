# SPEC — KỆ SÁCH & TRI THỨC *(knowledge base, T5)*

> Duyệt 01/08/2026 — xem `CHOT-DUYET-SPEC-DOT2-2026-08-01.md`.
> Nền dùng chung cho **cả hai trợ lý** (Vitals của IF · trợ lý của ArchiNote).
> Mục đích gốc: **chống bịa số**. Model nhỏ chạy local không "biết" quy chuẩn — nó chỉ được phép
> **diễn đạt lại đoạn đã tra ra**.
> Đọc cùng `IF-ARCHITECTURE-BLUEPRINT-v1.md` (mục 5C trend clock), `IF-CORE-SCHEMA.md`.

---

## 1. Luật vàng

> **Không có trích dẫn thì không có con số.**
> Không tra được nguồn → **nói không biết**, không đoán. Model nhỏ dùng để *diễn đạt*, không để *biết*.

## 2. Phân hạng nguồn — câu trả lời phải mang theo hạng

| Hạng | Nguồn | Được nói gì |
|---|---|---|
| **A · Pháp lý** | QCVN · TCVN bản chính thức | ✅ Nêu số + **bắt buộc trích điều khoản**, click ra trang gốc |
| **B · Chuẩn ngành** | Neufert · Time-Saver · sổ tay hãng | ✅ Nêu số, **phải ghi rõ** "theo Neufert — không phải quy chuẩn VN" |
| **C · Kinh nghiệm** | Ghi chú công trường · case đã xử lý · chi tiết điển hình của studio | 🟡 Nói rõ là **kinh nghiệm**, không phải chuẩn |
| **D · Tham khảo** | Web · blog · ảnh | 🟡 Chỉ gợi ý, **không nêu số** |

⇒ Đây là chỗ thắng ChatGPT: ChatGPT trôi chảy nhưng không cho biết **lấy từ đâu, hạng nào**.

## 3. Ba khoảng cách phải xử — riêng với tài liệu kỹ thuật

| Khoảng cách | Vấn đề | Cách xử |
|---|---|---|
| **Tra đúng đoạn** | Quy chuẩn nhiều **bảng biểu**; bóc text thô làm vỡ bảng → số lệch cột (đọc "1,2 m" thành "2,1 m"). Hình vẽ text không đọc được | **Bảng xử lý riêng** — bóc không chắc thì **giữ ảnh, bắt người đọc bằng mắt**. Thà vậy còn hơn đọc sai |
| **Trích đúng số** | Điều khoản luôn có điều kiện: *"trừ trường hợp…"*, *"áp dụng cho nhà ≤ 5 tầng"* | **Cắt theo điều khoản** *(article-level chunking)*, không cắt theo số ký tự. Trả về nguyên điều kèm điều kiện |
| **Không trộn nguồn** | QCVN 06:2022 thay bản 2021 · Neufert là sách Đức | **Đánh dấu phiên bản thay thế**: bản cũ vẫn tra được nhưng gắn 🔴 lỗi thời, **không dùng trả lời** *(trend clock)* |

## 4. Metadata bắt buộc mỗi mảnh tri thức

`tên tiêu chuẩn` · `số hiệu` · `năm` · `điều/mục` · `trang` · `hạng A-D` · `trendStatus` 🟢🟡🔴 ·
`nguồn + giấy phép` · `tenantId` (sách riêng của studio nào)

→ Mọi con số trong câu trả lời phải **click ra được trang gốc** — đúng cơ chế *click-to-locate*
mà standards checker của IF đã làm được.

## 5. ⚠️ Bản quyền — luật ship

| Loại | Ship kèm app? |
|---|---|
| **QCVN · TCVN** (văn bản nhà nước, tra cứu công khai) | ✅ **Được** — và đây là **moat cho thị trường Việt Nam** |
| Neufert · Time-Saver · sách chuyên ngành | ❌ **KHÔNG** — vi phạm bản quyền khi bán toàn cầu |
| Ghi chú, case, chi tiết điển hình của studio | ❌ dữ liệu tenant, không ship |

> **Kệ sách là TỦ RỖNG.** App cung cấp *cơ chế*; mỗi studio tự nạp sách của mình.
> Trùng đúng **Luật trung tính** trong `IF-CORE-SCHEMA.md`.

## 6. Nguồn nạp từ ArchiNote — bánh đà tri thức

ArchiNote là **cổng thu dữ liệu hiện trường**: ảnh hiện trạng · số đo thật · lời khách · cách xử
lý ngoài công trường · chi tiết điển hình. Đây là dữ liệu **độc quyền, không mua được, càng dùng
càng dày** — hạng C, nuôi cả hai trợ lý qua Lark Base.

---

*v1.0 · 2026-07-24 · Ben soạn theo ý Hoà.*

