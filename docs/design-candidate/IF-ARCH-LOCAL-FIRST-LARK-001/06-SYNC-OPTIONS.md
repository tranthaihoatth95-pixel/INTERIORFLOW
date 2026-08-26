# ⑥ SYNC OPTIONS — ba đường, chọn một

> `PROPOSED`. HEAD `a08378a`.
> **Luật cứng số 1:** *local-first không có nghĩa local-only* — phải có đường đi tiếp,
> nhưng **không được giả vờ đã có**.

## Đường A · LOCAL-ONLY *(đúng với hiện trạng)*

Mọi thứ ở trên máy. Không đồng bộ. Nhập HRM bằng tệp.

**Được:** đơn giản nhất · quyền riêng tư mạnh nhất · **không có bề mặt tấn công mạng** ·
không chi phí vận hành · bán được ngay.
**Mất:** không cộng tác nhiều máy · đổi máy là mất · không có nguồn chân lý chung khi hai người
cùng sửa · **không hợp với một tổ chức vài trăm người**.

**Kết luận:** đúng cho studio nhỏ. **Không đủ** cho bài toán People & Organization quy mô lớn.

## Đường B · LOCAL-FIRST + OPT-IN SYNC ⭐ *khuyến nghị*

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

## Đường C · MANAGED CLOUD

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
