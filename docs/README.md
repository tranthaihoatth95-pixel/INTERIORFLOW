# docs/ — Mục lục

> File này là điểm bắt đầu khi cần tra tài liệu trong `docs/`. **Chưa phải mục lục đầy đủ**
> (79 file `.md` trong `docs/`, phần lớn chưa được phân loại — xem "Còn thiếu" cuối file).

## Chú giải nhóm
- 🟢 **ĐANG HIỆU LỰC** — nguồn tham chiếu đúng hiện tại, dùng được ngay.
- 🔵 **THAM CHIẾU** — nền tảng/audit lịch sử, vẫn đúng nhưng không phải nơi sửa đổi.
- 🟡 **ĐỀ XUẤT CHƯA DUYỆT** — bản nháp/proposal, cần Hoà duyệt trước khi build theo.
- 🔴 **LỖI THỜI** — không còn đúng, giữ làm lịch sử (nên chuyển vào `docs/archive/`).

## 🟢 ĐANG HIỆU LỰC

| File | Ghi chú |
|---|---|
| [`IF-FEATURE-SPEC-P1-v2.md`](IF-FEATURE-SPEC-P1-v2.md) | **Spec canonical** — 101 item, đối soát mã nguồn 17/07. Dùng file này khi được giao build tính năng mới. |
| [`IF-FEATURE-UPGRADES.md`](IF-FEATURE-UPGRADES.md) | Nâng cấp tính năng đã có (Basic→Pro→Elite). Đọc khi được giao nâng cấp tính năng cũ. |
| [`IF-PRESENT-SPRINT-PLAN.md`](IF-PRESENT-SPRINT-PLAN.md) | Lộ trình PS-0…PS-11 cho chặng Present — sprint nào đã xong, sprint nào còn mở. |
| [`IF-ARCHITECTURE-BLUEPRINT-v1.md`](IF-ARCHITECTURE-BLUEPRINT-v1.md) | Hiến pháp kiến trúc — lưới phân loại N/P/L, đứng trên mọi spec/sprint plan. |
| [`IF-CORE-SCHEMA.md`](IF-CORE-SCHEMA.md) | Chi tiết kỹ thuật T1 — schema Prisma, quy ước ID, mô hình local-first. |
| [`IF1_IF2_BIGPICTURE.md`](IF1_IF2_BIGPICTURE.md) | Roadmap tổng IF1/IF2. |
| [`APP-MAP.md`](APP-MAP.md) | Bản đồ ứng dụng — route tree, API map, 3-stage handoff (đọc code, không phải kế hoạch). |

## 🔵 THAM CHIẾU

| File | Ghi chú |
|---|---|
| [`IF-FEATURE-SPEC-P1.md`](IF-FEATURE-SPEC-P1.md) | Bản cũ của spec Phase 1 — **superseded bởi `IF-FEATURE-SPEC-P1-v2.md`**, giữ làm lịch sử, không dùng để tra trạng thái. |

## Còn thiếu

72 file `.md` còn lại trong `docs/` (RESEARCH-*, SPEC-*, PROPOSAL-*, AUDIT-*, v.v.) **chưa được
phân loại vào bảng trên** — việc dựng mục lục đầy đủ + tách `docs/archive/` cho nhóm 🔴 LỖI THỜI
là việc lớn hơn, chưa làm trong lượt này. Mục lục này mới chỉ ghi 4 file spec vừa nạp lại
(26/07) + vài file lõi hay tra cứu.
