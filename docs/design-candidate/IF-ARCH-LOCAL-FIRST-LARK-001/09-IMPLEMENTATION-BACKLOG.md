# ⑨ IMPLEMENTATION BACKLOG — theo PHỤ THUỘC, không theo độ dễ

> `PROPOSED`. HEAD `a08378a`. **Chưa mở writer task nào.**
> Thứ tự dưới đây là **thứ tự phụ thuộc**: không nhảy cóc được, vì mỗi bậc dùng đầu ra của bậc trước.

## Bậc 0 · KHOÁ RANH GIỚI *(chặn tất cả các bậc sau)*

| # | việc | vì sao chặn | xong khi |
|---|---|---|---|
| 0.1 | **Quyết định tenancy** — có `tenantId` hay không | Không có tenant thì mọi bảng People là bảng dùng chung. Thêm sau = migration đau | có ADR chốt |
| 0.2 | **Hạ tầng feature flag theo tenant** | Luật cứng: mọi feature People đứng sau cờ | flag bật/tắt được, có test |
| 0.3 | **`Capability` enum + cổng kiểm quyền dùng chung** | Permission-before-load cần MỘT chỗ kiểm, không phải 77 chỗ | mọi route People đi qua một hàm |
| 0.4 | **Bảng audit trail** | Export · đổi quyền · đổi thành viên đều bắt buộc ghi | ghi được, đọc được, không xoá được |

⛔ **Không bậc nào sau đây được bắt đầu khi 0.1–0.4 chưa xong.**

## Bậc 1 · DOMAIN *(P0 trong gói cũ)*

| # | việc | phụ thuộc |
|---|---|---|
| 1.1 | 12 model trung tính vào schema, **migration thuận nghịch** | 0.1 |
| 1.2 | `Person` ↔ `User` là **bảng liên kết riêng**, không gộp | 1.1 |
| 1.3 | `Provenance` nhúng mọi thực thể | 1.1 |
| 1.4 | Tám ca count-mismatch có test | 1.1 |

## Bậc 2 · PRIMITIVE DÙNG CHUNG *(P1)*

| # | việc | phụ thuộc |
|---|---|---|
| 2.1 | **`ProjectPresenceStack`** — hợp đồng đã chốt `IF-PO-14` | 0.3 · 1.1 |
| 2.2 | Thay **4 chỗ vẽ tay** bằng primitive | 2.1 |
| 2.3 | Thẻ người · thẻ team · thẻ đơn vị | 2.1 |

> 2.2 là **trả nợ đã khai**: bốn chỗ avatar hiện chưa có cổng quyền.

## Bậc 3 · NHẬP DỮ LIỆU

| # | việc | phụ thuộc |
|---|---|---|
| 3.1 | **Nhập bằng tệp** (CSV/JSON) + preview + human confirm | 1.1 · 0.4 |
| 3.2 | Adapter khung — nguồn cắm rời | 3.1 |
| 3.3 | Adapter Lark *(chỉ khi Phiên B kết luận đủ mạnh)* | 3.2 |

> **3.1 TRƯỚC 3.3 có chủ đích.** Nhập tệp không phụ thuộc nhà cung cấp nào, chứng minh được
> toàn bộ luồng preview–confirm–provenance–rollback, và **chạy được ngay hôm nay**.
> Làm Lark trước là buộc cả hệ vào một nhà cung cấp trước khi biết luồng có đúng không.

## Bậc 4 · BỀ MẶT *(P2–P6)*

`Overview` → `Directory` → `Person/Team Profile` → `Project Staffing` → `Workload/OT` → `Collaboration Flow`

Mỗi bề mặt: **vertical slice** — domain + quyền + UI + test + **runtime proof**, không làm ngang.

## Bậc 5 · CẮT NGANG *(P7)*

offline · bảo mật · a11y · hiệu năng · export có audit · 1100px · touch · reduced modes.

---

## Đường tới hạn

```
0.1 tenancy ─► 0.3 capability ─► 1.1 schema ─► 2.1 primitive ─► 4.x bề mặt
      └────► 0.2 flag ────────────────────────────┘
0.4 audit ────────────────────► 3.1 nhập tệp ─► 3.3 Lark (có điều kiện)
```

**Nút thắt duy nhất là `0.1`.** Mọi thứ khác chờ nó.
