# SMARTBOARD · IF — chỉ mục ĐỊNH TUYẾN

> ⚠️ **Tệp này KHÔNG thay thế nguồn nào.** Nó chỉ trỏ đường.
> Mâu thuẫn giữa tệp này và nguồn canonical ⇒ **nguồn canonical thắng**.
> HEAD `6c9712a` · cập nhật 26/08

## Nguồn chân lý — đọc theo thứ tự

| ID | nguồn | trả lời câu gì | đọc khi |
|---|---|---|---|
| `SB-001` | `docs/control/IF-CURRENT-STATE.md` | đang ở đâu · việc kế tiếp | **luôn, đầu tiên** |
| `SB-002` | `docs/control/IF-CANONICAL.md` | IF **LÀ GÌ** · luật bền | **luôn** |
| `SB-003` | `docs/control/IF-UXUI-OPERATING-MEMORY.md` | sai lầm đã trả giá | trước mọi việc giao diện |
| `SB-004` | `docs/control/IF-TOOLING-RECEIPT.md` | năng lực **THẬT** đã xác minh | trước khi dùng công cụ |
| `SB-005` | `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md` | **9 ADR ACCEPTED** Q1–Q9 | trước khi quyết kiến trúc |
| `SB-006` | `docs/IF-ARCHITECTURE-BLUEPRINT.md` | các mảnh **lắp với nhau** ra sao | khi cần bức tranh hệ |

## Gói candidate — chưa phải nguồn chân lý

| ID | gói | trạng thái | commit |
|---|---|---|---|
| `SB-101` | `docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/` | `CANDIDATE` · 10 mục · **ADR Q10–Q13** | `477cbb7` |
| `SB-102` | `docs/design-candidate/TTT-PROFILE-UX-001/` | `CANDIDATE` · IF-PO-01 · IF-PO-14 · **2/13** | `818cd2a` |
| `SB-103` | `docs/design-candidate/IDF-IF-PACKET-003/` | `CANDIDATE` · packet 003 + GAP-MAP | *(lượt này)* |

## Canvas thiết kế

| ID | canvas | nội dung |
|---|---|---|
| `SB-201` | `interiorflow-trang-chu-va-rail.html` | **43 artboard**, 10 nhóm — bộ màn IF |
| `SB-202` | `people-and-organization.html` | IF-PO-01 · IF-PO-14 |

> Cả hai là **tệp độc lập**, mở bằng trình duyệt, không cần mạng.

## Định tuyến nhanh

| cần gì | đi đâu |
|---|---|
| năng lực nào đã có / thiếu | `SB-103` → `01-IF-CORE-GAP-MAP.md` |
| rủi ro an ninh + file:dòng | `SB-101` → `07-RISKS-AND-UNKNOWN.md` |
| Lark là gì trong kiến trúc | `SB-101` → `03-LARK-CONNECTOR-EVIDENCE.md` |
| hợp đồng People & Organization | `SB-101` → `04-NEUTRAL-CONTRACT.md` |
| ADR đã chốt | `SB-005` (Q1–Q9) · đang chờ: `SB-101` (Q10–Q13) |
| luật UX đã trả giá | `SB-003` |
| ai đang giữ bút | `SB-001` → ô **NGƯỜI GHI HIỆN TẠI** |

## 🔴 Ba việc chặn — trạng thái thật

| # | việc | trạng thái |
|---|---|---|
| 1 | **Người ghi sản xuất** — `IF-CURRENT-STATE` ghi `interiorflow-65`; `ListAgents` **không có tên đó** | 🔴 **CHỜ HOÀ** |
| 2 | **Q10 tenancy** | ✅ **packet 003 trả lời: đa tenant theo core contract** |
| 3 | **Q12 fail-closed secret** | 🟠 sẵn sàng làm — 1 dòng, cần bút |
