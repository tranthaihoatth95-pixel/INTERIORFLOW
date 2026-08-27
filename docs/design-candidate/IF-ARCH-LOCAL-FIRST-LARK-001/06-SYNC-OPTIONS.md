# ⑥ SYNC OPTIONS — ba đường, **đã chọn Đường B**

> 🟢 **`DECIDED` 27/08/2026 — Hoà chốt Đường B.** Quyết định canonical ở
> **[`ADR Q14`](../../ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md#q14--mô-hình-dữ-liệu--đồng-bộ-của-if)**.
> Tệp này nay là **NGUỒN BẰNG CHỨNG** cho quyết định đó — nó giữ phần *so sánh ba đường* và
> *vì sao A/C bị loại*. Mâu thuẫn giữa tệp này và ADR Q14 ⇒ **ADR thắng**.
>
> Đo trên HEAD `a08378a`; quyết định chốt ở mốc `2a454b4`.
> **Luật cứng số 1:** *local-first không có nghĩa local-only* — phải có đường đi tiếp,
> nhưng **không được giả vờ đã có**.

## Đường A · LOCAL-ONLY *(đúng với hiện trạng — ĐÃ LOẠI)*

Mọi thứ ở trên máy. Không đồng bộ. Nhập HRM bằng tệp.

**Được:** đơn giản nhất · quyền riêng tư mạnh nhất · **không có bề mặt tấn công mạng** ·
không chi phí vận hành · bán được ngay.
**Mất:** không cộng tác nhiều máy · đổi máy là mất · không có nguồn chân lý chung khi hai người
cùng sửa · **không hợp với một tổ chức vài trăm người**.

**Kết luận:** đúng cho studio nhỏ. **Không đủ** cho bài toán People & Organization quy mô lớn.

## Đường B · LOCAL-FIRST + OPT-IN SELECTIVE SYNC ✅ **ĐÃ CHỌN**

Máy vẫn là nguồn chân lý cho công việc. Một số **vùng chọn lọc** được đồng bộ **khi khách bật**.

- Đồng bộ **theo vùng**, không đồng bộ tất cả: cấu hình tenant · cây tổ chức · assignment.
- **Không đồng bộ** mặc định: bản vẽ, ảnh, tệp dự án — chúng nặng và riêng tư.
- Xung đột: **last-writer-wins là SAI** cho dữ liệu tổ chức ⇒ dùng **preview + human confirm**,
  đúng luật đã chốt cho HRM import.
- Ngoại tuyến: làm việc bình thường, xếp hàng, hoà lại khi có mạng.

**Được:** giữ triết lý local-first · mở đường nhiều máy · khách **tự quyết** dữ liệu nào rời máy.
**Mất:** phải xây tầng đồng bộ · phải giải xung đột · **cần một dịch vụ** dù nhỏ.

**Vì sao khuyến nghị:** nó là đường **duy nhất** không phản bội lời hứa *"dữ liệu nằm trên máy anh"*
(in ngay dưới thẻ đăng nhập) mà vẫn đi được tới tổ chức nhiều người.

## Đường C · MANAGED CLOUD *(ĐÃ LOẠI — quá sớm)*

Nguồn chân lý ở máy chủ. Máy chỉ là bản chiếu.

**Được:** cộng tác thật · phân quyền tập trung · sao lưu sẵn · quy mô lớn.
**Mất:** **phá lời hứa local-first** · chi phí vận hành · trách nhiệm pháp lý về dữ liệu khách ·
mất lợi thế bán hàng lớn nhất của IF.

**Kết luận:** không khuyến nghị cho IF ở giai đoạn này. Nếu chọn thì đó là **đổi sản phẩm**,
không phải thêm tính năng.

---

## Bảng quyết định

| | A local-only | **B opt-in sync** | C managed cloud |
|---|---|---|---|
| Giữ lời hứa local-first | ✅ | ✅ | ❌ |
| Tổ chức vài trăm người | ❌ | ✅ | ✅ |
| Chi phí vận hành | không | thấp | cao |
| Rủi ro pháp lý dữ liệu khách | thấp nhất | thấp | **cao** |
| Đổi máy không mất | ❌ | ✅ | ✅ |
| Công sức xây | 0 | **trung bình** | cao |
| Rollback được | — | ✅ theo vùng | ❌ khó |

## Đề xuất đi tiếp — không chờ quyết định lớn

Đường B **không phải làm một lần**. Bậc thang:

1. **Xuất/nhập tệp có ký** — không cần dịch vụ nào, có ngay provenance và preview. *Rẻ nhất.*
2. **Đồng bộ một chiều, một vùng** (cây tổ chức, read-only import).
3. **Hai chiều, có preview + confirm**.
4. Vùng khác, nếu bậc 1–3 chứng minh được.

Bậc 1 **làm được ngay mà không phá gì**, và nó trả lời được câu *"đổi máy có mất không"* — nên tôi đề xuất bắt đầu ở đó.

---

## 🟢 KẾT LUẬN — Hoà chốt 27/08

**Đường B.** Bảy ràng buộc đầy đủ nằm ở [`ADR Q14`](../../ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md#q14--mô-hình-dữ-liệu--đồng-bộ-của-if);
đây chỉ ghi phần *vì sao hai đường kia rụng*, để phiên sau không mở lại cuộc tranh luận đã xong:

- **A rụng** vì chính dòng tệp này đã đo: *"đúng cho studio nhỏ, **không đủ** cho bài toán People
  & Organization quy mô lớn"*. Không có đường đi tiếp thì local-first biến thành local-only.
- **C rụng** vì mở bề mặt tấn công mạng + chi phí vận hành cho một nhu cầu **chưa ai có hôm nay**.
  Và điều quan trọng hơn: cái đang chặn IF **không phải loại database** — mà là chưa có `tenant`,
  bốn cờ phạm vi còn tắt, sáu bảng ngoài mô hình quyền. Lên cloud lúc này chỉ đổi chỗ chứa.

**Hệ quả trực tiếp, đã ghi thành luật ở ADR Q14:** ⛔ không cài Supabase, không đổi database.
SQLite ở lại. Cloud Sync là **adapter + feature flag** của tương lai, không phải việc của hôm nay.
