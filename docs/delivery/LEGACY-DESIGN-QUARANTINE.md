# LEGACY DESIGN QUARANTINE — sổ cách ly hướng thị giác cũ

> **Lập 04/09/2026 theo lệnh CONTEXT DETOX của Hoà.**
> **KHÔNG XOÁ GÌ.** Không xoá tệp, không xoá lịch sử git, không xoá năng lực.
> Sổ này chỉ **dán nhãn**: thứ nào còn là thẩm quyền, thứ nào chỉ còn là bằng chứng.
>
> Thẩm quyền thiết kế duy nhất: **`docs/ACTIVE-DESIGN-CONTEXT.md`**.

## BA NHÃN

| Nhãn | Nghĩa | Được dùng làm gì |
|---|---|---|
| 🟢 **ĐANG HIỆU LỰC** | thẩm quyền hiện hành | định hướng thiết kế mới |
| 🟡 **LỊCH SỬ** | đúng ở thời điểm của nó, chưa bị đè | truy nguyên · giữ hành vi · học bài học |
| 🔴 **ĐÃ BỊ ĐÈ** | có thẩm quyền mới nói khác | **CẤM dùng làm hướng thị giác hiện tại** |

⚠️ Nhãn dán cho **BỐ CỤC**, không dán cho **NĂNG LỰC**. Một bản vẽ 🔴 vẫn có thể chứa hành vi
đúng cần giữ — đọc nó để **giữ hành vi** thì được, để **chép bố cục** thì không.

---

## ① BẢN VẼ — `docs/mocks/` · 148 tệp

| Họ | Số | Nhãn | Lý do |
|---|---|---|---|
| `mock-exs-*` | 21 | 🟢 → **có ngoại lệ** | Bộ EXS Hoà duyệt mắt 20/08. **Ngoại lệ 🔴: `mock-exs-c-home-work-os.html`** — đã qua mắt, nhưng bố cục của nó là **bento + WidgetCard**, đúng mô hình bị bác 04/09. Chỉ tham chiếu **cách xếp ở khổ hẹp**; **cấm** lấy bảng màu hex gõ cứng trong đó |
| `mock-home-nc-{A,B,C}-*` | 3 | 🔴 | Ba nghiên cứu bố cục Home 04/09 — Hoà **không chọn bản nào**, đã đóng dấu *ứng viên đã xét* |
| `mock-home-hybrid*` | 4 | 🔴 | Bản ghép B×A — đã đóng dấu *ứng viên lịch sử*; bị lệnh **LIVING PERSONAL STUDIO** đè |
| `mock-home-h{1,2,3}-*` | 9 | 🟡 **chờ mắt** | Ba study hệ thống. **Chưa được phán.** Theo §8 lệnh detox: giữ làm bằng chứng, **không** dùng làm điểm xuất phát thị giác cho vòng sau |
| `mock-cad-*` · `mock-sidebar-*` · còn lại | 111 | 🟡 | Bản vẽ chuyên đề của các đợt trước. Đọc khi việc đòi truy nguyên, không tự crawl |

## ② ẢNH BẰNG CHỨNG — `docs/delivery/anh-duyet-mat/` · 77 ảnh

| Lô | Số | Nhãn | Ghi chú |
|---|---|---|---|
| `lo-01` | 43 | 🟡 | Ảnh **app thật**. Khẩu độ Vitals (20 ảnh) **đang chờ mắt**. Ảnh Home trong lô này là trạng thái **ĐÃ TRƯỢT** 04/09 — 🔴 với tư cách hướng, 🟡 với tư cách bằng chứng |
| `lo-02-home-nc` | 6 | 🔴 | ảnh của ba nghiên cứu bị loại |
| `lo-03-home-hybrid` | 10 | 🔴 | ảnh bản ghép bị đè |
| `lo-04-home-system` | 18 | 🟡 chờ mắt | ba study H1/H2/H3 |

## ③ HƯỚNG ĐI CỤ THỂ ĐÃ BỊ ĐÈ — cấm hồi sinh

| # | Hướng | Bị đè bởi | Ngày |
|---|---|---|---|
| 1 | **Home = lưới bento 9 thẻ** (chốt 13/08 *"HOME = BENTO GRID MỘT MÀN"*) | N-10 cờ đỏ `bento làm mặc định` + D-DR2 *một tiêu điểm* | 04/09 |
| 2 | **Thẻ-cho-mọi-thứ / `WidgetCard` làm ngôn ngữ Home** | N-10 · lệnh Home 04/09 | 04/09 |
| 3 | **Vitals neo theo ngữ cảnh** — chấm cạnh ô tìm · nút rời cạnh trục phải (chốt 16/08) | EXS §7 khẩu độ mép trên · **D-DR1** | 20/08 → 04/09 |
| 4 | **Pill Vitals riêng lơ lửng** | chính chốt 16/08, rồi EXS §7 | — |
| 5 | **Sidebar HAI CỤM** (16-17/08) | EXS §3 **BA CỤM** | 20/08 |
| 6 | **Home = trang Resume** | lệnh **LIVING PERSONAL STUDIO** | 04/09 |
| 7 | **Mảnh việc sống = mặt bằng 2D** | đính chính ngữ nghĩa `LIVE WORK FRAGMENT` | 04/09 |
| 8 | **Auto Grid = pattern 5 màn toàn app** | đính chính phạm vi: master capability **trong stage Trình bày** | 20/08 |
| 9 | **`bento thêm hero 2×2 Resume`** — dòng drift trong chính tệp EXS | N-10 + D-DR2 | 04/09 |
| 10 | **Board `EXS-K`** (5 ca Auto Grid toàn app) | Hoà **đã xoá**, khai sai phạm vi — cấm trích lại | 20/08 |
| 11 | **Nền Home dùng ánh sáng thay ảnh** (T đề xuất) | Hoà lật: *"nền vẫn nên có hình, filter sao cho hợp lý"* | 16/08 |
| 12 | **Làm mờ mạnh nền cho dễ đọc** (T dặn) | nền để **sắc nét**; đọc được nhờ **kính đủ đặc** / **phủ chuyển sắc cục bộ ở chân chữ** | 16/08 |

## ④ TÀI LIỆU ĐÃ ĐÓNG DẤU LỖI THỜI TẠI CHỖ — giữ làm dấu vết

`IF-ARCHITECTURE-COMPASS.md` (bản đồ 29/07, mồ côi 19 ngày) · `IF-KIEN-TRUC.md` (bị
`INTERIORFLOW-ARCHITECTURE-MAP.md` thay) · `QUY_TRINH_SPIRAL_v1.md` (quy trình chết) ·
`HOME-NGHIEN-CUU-BO-CUC.md` · `HOME-HYBRID-BA.md` · `VISUAL-REVIEW-BATCH-01.md`.
Đo 04/09: **39 tệp** trong `docs/` tự khai `SUPERSEDED / LỖI THỜI / HẾT HIỆU LỰC`.

⚠️ `IF-ARCHITECTURE-BLUEPRINT-v1.md` **KHÔNG** phải bản cũ của `IF-ARCHITECTURE-BLUEPRINT.md` —
hai tệp khác hẳn nội dung, dễ nhầm.

## ⑤ THỨ **KHÔNG** BỊ CÁCH LY — vẫn là thẩm quyền

`IF-KIEN-TRUC-OS.md` (north star) · `CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` (12 điều — **trừ**
dòng drift bento) · `NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1…18) ·
`NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (KB-1…5) · `SPEC-DESIGN-SYSTEM-IF.md` §7 ·
`DESIGN-TOKENS.md` · `app/globals.css` · `TRIET-LY-IF.md` · ADR ·
`INTERIORFLOW-ARCHITECTURE-MAP.md` · `IF-ARCHITECTURE-BLUEPRINT.md` ·
`REF-VISUAL-EXS-2026-08-20.md`.

**Và toàn bộ CODE.** Cách ly là chuyện **hướng thị giác**, không phải chuyện năng lực. Không dòng
mã nào bị cách ly bởi sổ này.

## HẠN DÙNG
Hoà lật một mục thì sửa **dòng đó tại chỗ** và ghi ngày. Sổ này chỉ dài thêm khi có hướng mới bị đè.
