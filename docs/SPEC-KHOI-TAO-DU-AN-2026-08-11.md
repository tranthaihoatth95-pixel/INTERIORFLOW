# SPEC · BẢNG KHỞI TẠO DỰ ÁN (11/08/2026 — Hoà đặt bài đêm, COWORK-TRÌNH cấu trúc)

> Khuôn theo `docs/PHIEU-CHONG-RUI-RO-5-CHU-DE.md` (PHIẾU 5 Ô). CHỈ mô tả hành vi, KHÔNG thuật toán.
> Nền tư vấn: `docs/NC-KTS-SANPHAM-IF-2026-08-11.md` §6 (tầng Trí Tuệ Dự Án — ProjectProfile ·
> Scaffolder · TeamFit) + chốt 11/08 trong `docs/00-CHOT.md` (hệ tên cấp lõi · TaskContext Link).
> Luật nền phải tuân: X2 (không chặn vì thiếu bước trước) · luật 6 (người quyết cuối, nhiều
> phương án) · Undo Trước Hỏi Sau · mọi máy IM LẶNG khi Profile trống, không đoán bừa.

---

## ① ĐỊNH NGHĨA KHOÁ (đổi phải ghi 00-CHOT)

**Bảng khởi tạo dự án** = MỘT màn duy nhất lúc lập dự án, quản lý điền ≤90 giây, gồm **3 mảnh
nhìn thấy cạnh nhau**; điền xong thì dự án mở ra ĐÃ CÓ khung việc, người đúng vai, mốc đúng lịch —
không ai phải hỏi "file nào, việc gì, của ai".

| Mảnh | Là gì | Neo vào cái ĐÃ CÓ |
|---|---|---|
| **PLAN** | Hồ Sơ Dự Án 60s (ProjectProfile): loại hình · m² · ngân sách · mốc chính · hiện trạng · Brand Kit. KHÔNG bắt buộc điền đủ (X2) — trống ô nào máy im ô đó | brief-intake operator-detect sẵn có; Brand Kit thuộc dự án (CHOT-BRAND-KIT) |
| **TASK** | Chọn/**trộn** template việc (tick nhiều bộ, bỏ dòng thừa trước khi gieo) + phân vùng: mỗi cụm việc gán người/vai | 5 BOARD_TEMPLATES đã ship 11/08 (`components/tasks/TaskBoardScreen.tsx:47` — concept·technical·render·present·fitout, mỗi bộ 5 việc) + `model Task`/`WorkflowState` (`prisma/schema.prisma:539,523`) |
| **TIMELINE** | Mốc chính dự án (duyệt concept · chốt kỹ thuật · bàn giao…) + deadline theo giai đoạn; việc trong TASK nhận `dueAt` theo giai đoạn nó thuộc | `Task.startAt/dueAt` đã có (`schema.prisma:545-546`); mốc cấp dự án CHƯA có model (xem mục CHƯA LÀM ĐƯỢC) |

**Hai cấp quyền — NEO vào RBAC 5 vai đã có, KHÔNG đẻ vai mới:**

| Cấp | Ai (map vào code THẬT) | Làm gì trên bảng khởi tạo |
|---|---|---|
| **CẤP QUẢN LÝ** (owner/admin studio) | `User.isAdmin` (cấp app — `assertProjectAccess` đã coi admin là owner, `app/api/projects/[id]/members/route.ts:18`) hoặc `ProjectMember.role='owner'` | Tạo bảng khởi tạo · phân quyền HÀNH ĐỘNG (gán vai crea/drafter/bim/viewer cho thành viên) · cấp quyền TRUY CẬP THƯ MỤC ở cấp app (nối File Manager: dự án nào thấy thư mục nào, rw/ro) |
| **CHỦ TRÌ dự án** (project lead) | **Đề xuất: = `ProjectMember.role='owner'` CỦA DỰ ÁN ĐÓ** — RBAC đã cho một dự án nhiều owner (`@@unique([projectId,userId])` chỉ khoá 1 vai/người); "admin studio" và "chủ trì" phân biệt bằng TẦM (isAdmin = mọi dự án · owner = dự án này). Không cần cột mới, không migrate | Chủ động điều chỉnh bảng sau khi nhận · **GẮN TAG/THẺ** phân chi tiết đầu mục việc cho nhóm viên ("2D", "render", "BOQ"…) · đổi assignee/deadline trong phạm vi dự án |

Vai crea/drafter/bim giữ nguyên nghĩa chặng (STAGE_OWNER `lib/server/access-policy.ts:33` —
concept:crea · render:drafter · present:bim); Scaffolder dùng map này làm GỢI Ý gán người mặc
định theo cụm việc, người quyết cuối (luật 6).

**Dây sang ngữ cảnh (TaskContext Link, chốt 11/08):** việc gieo từ bảng khởi tạo mang
`{stage, workspaceId?, entityId?}` — nhóm viên bấm việc là rơi đúng workspace/đối tượng.
Bảng khởi tạo là NƠI GIEO của dây này; hành vi bấm-việc-nhảy-đúng-chỗ thuộc PHIẾU 1 Workspace.

---

## ② TIÊU CHÍ — 4 trục, từng dòng tick được

**Công năng**
- [ ] Quản lý tạo dự án + điền đủ 3 mảnh trong ≤90 giây (đo đồng hồ trên app thật).
- [ ] Trộn được ≥2 template việc trong một bảng; bỏ được từng dòng việc trước khi gieo.
- [ ] Bỏ trống PLAN vẫn tạo được dự án (X2) — máy không đoán bừa, không hiện gợi ý ma.
- [ ] Gieo xong: Bảng việc có đúng số việc đã tick, đúng thứ tự, đúng người được gán.
- [ ] Chủ trì (không phải admin) sửa được bảng của dự án mình; KHÔNG sửa được dự án khác.
- [ ] Nhóm viên (crea/drafter/bim/viewer) mở bảng chỉ XEM, không sửa cấu trúc.
- [ ] Mọi thao tác gieo/gán/gắn thẻ đều undo được (Undo Trước Hỏi Sau) — huỷ gieo là bảng sạch lại.

**Thẩm mỹ**
- [ ] 3 mảnh cùng một màn, nhận ra vai trò từng mảnh trong 1 giây — không phải wizard 3 trang bắt bấm Tiếp.
- [ ] Token globals.css, đủ 2 theme; ô trống là empty state làm-được-việc, không màn trắng.

**Sáng tạo**
- [ ] Scaffolder đề xuất khung theo loại hình (khách sạn ≠ căn hộ) nhưng luôn ≥2 phương án hoặc sửa-tự-do — không ép một khuôn.
- [ ] Bảng nhớ lựa chọn template hay dùng của studio (lần sau mở đã tick sẵn bộ quen).

**Ấn tượng**
- [ ] Demo 90 giây: từ "chưa có gì" → dự án có 15 việc, 3 người, 4 mốc — khách xem demo tự thốt "bên tôi làm việc này mất buổi sáng".

---

## ③ KỊCH BẢN NGHIỆM THU — người nghiệm thu LÀM THEO trên app thật

1. **Quản lý** (tài khoản isAdmin) bấm ＋ Dự án mới → bảng khởi tạo mở. Điền PLAN: "Khách sạn ·
   500m² · ngân sách X · bàn giao 15/11". Tick template "Concept dự án" + "Sản xuất render",
   bỏ 2 dòng không cần. Kéo mốc TIMELINE: duyệt concept 01/09 · chốt kỹ thuật 01/10. Gán
   **A vai crea, B vai drafter, C làm CHỦ TRÌ** (owner dự án). Bấm Tạo. **Tổng ≤90 giây.**
2. **C (chủ trì)** mở dự án → Bảng việc đã có 8 việc đúng 2 template đã trộn, `dueAt` rơi theo
   giai đoạn. C gắn thẻ **"2D"** cho cụm việc giao A, thẻ **"render"** cho cụm giao B, sửa 1
   deadline. Không cần gọi quản lý.
3. **A** mở app sáng hôm sau → Tổng quan hiện đúng việc có thẻ "2D" của mình; bấm việc
   "Layout 2 phương án" → rơi đúng workspace Thiết kế 2D của dự án đó (TaskContext Link),
   KHÔNG phải hỏi "file nào phòng nào".
4. **B** thử sửa cấu trúc bảng khởi tạo → app từ chối lịch sự (B là drafter, không phải chủ trì);
   B vẫn tự tạo việc lẻ cho mình bình thường (không chặn quá tay).
5. **Quản lý** vào File Manager cấp app → thấy quyền thư mục dự án: A/B rw thư mục dự án này,
   viewer chỉ ro — khớp phân quyền lúc khởi tạo.
6. Quản lý bấm **Hoàn tác gieo** ngay sau bước 1 → mọi việc vừa gieo biến mất, không rác.

---

## ④ TUẦN TỰ BƯỚC

＋ Dự án mới → **PLAN** (60s, được bỏ trống) → **TASK** (tick/trộn template · bỏ dòng thừa ·
gán người theo gợi ý STAGE_OWNER, sửa tự do) → **TIMELINE** (kéo mốc · deadline đổ xuống việc)
→ Tạo (một phát, có undo) → giao **CHỦ TRÌ** → chủ trì gắn thẻ/tinh chỉnh → nhóm viên nhận việc
kèm ngữ cảnh → tiến độ tự chạy trên Bảng việc/Gantt.

---

## ⑤ DÂY MÁY (id frontier-registry — ĐÚNG id đã có, không tạo id mới)

`project-profile` (đợt 1) · `scaffolder` (đợt 1) · `task-context` (đợt 1) · `team-fit` (đợt 2 —
bảng khởi tạo chỉ ĂN gợi ý của nó khi có, vắng thì gán tay, không chặn).

---

## CHƯA LÀM ĐƯỢC — nói thẳng (đối chiếu grep 11/08 đêm)

Kịch bản ③ hôm nay chạy được **bước 1 một nửa và bước 6 chưa có gì**. Cụ thể:

1. **Chưa có màn bảng khởi tạo, chưa có ProjectProfile.** Registry `project-profile`/`scaffolder`
   đều `trangThai:'chua'` (`scripts/frontier-registry.mjs:30,32`); grep `ProjectProfile` trong
   `components/` = 0. Tạo dự án hiện tại không có form nào.
2. **Task chưa có thẻ/tag, chưa có ngữ cảnh.** `model Task` (`prisma/schema.prisma:539-556`) chỉ
   có title·statusId·assigneeIds·startAt·dueAt·order — KHÔNG có `tags`, KHÔNG có
   `stage/workspaceId/entityId` (registry `task-context` đang đợi đúng field này,
   `frontier-registry.mjs:36-37`). Bước 2 (gắn thẻ) và bước 3 (bấm việc nhảy đúng chỗ) chưa chạy.
3. **Template chưa trộn được, chưa gán người, chưa đổ deadline.** `applyTemplate`
   (`components/tasks/TaskBoardScreen.tsx:206`) gieo MỘT bộ nguyên con, tuần tự vào cột đầu —
   không tick nhiều bộ, không bỏ dòng, không assignee, không dueAt theo giai đoạn, không undo
   một phát (bước 6).
4. **Mốc cấp dự án chưa có model.** Grep `milestone|deadline` trong `model Project` = 0; chỉ có
   `Task.startAt/dueAt` cấp việc. Mảnh TIMELINE cần chỗ đựng mốc (additive — đề xuất khi mở
   phiếu code, không quyết ở đây).
5. **Quyền thư mục File Manager là MOCK.** `permission: 'rw'/'ro'/'locked'` chỉ tồn tại trong
   `lib/filemanager/mock-data.ts:24-42`; registry `fm-data-that` còn 'chua'. Bước 5 chưa có nền
   thật — bảng khởi tạo chỉ nối được KHI fm-data-that xong.
6. **Nền ĐÃ CÓ, spec neo vào (không bịa):** RBAC 5 vai + `@@unique([projectId,userId])`
   (`schema.prisma:117-141`) · quản lý thành viên chỉ-owner + admin-là-owner + không-để-0-owner
   (`app/api/projects/[id]/members/route.ts:18-29`) · STAGE_OWNER/canEditStage
   (`lib/server/access-policy.ts:33-48`, có test) · 5 BOARD_TEMPLATES + API `/api/tasks` sống.
   ⇒ Hai cấp quyền Hoà muốn KHÔNG cần hệ phân quyền mới — chỉ cần đọc đúng cái đang có.

> Phiếu này là phiếu KHÂU DÂY + XÂY VỪA (form khởi tạo · thêm field additive cho Task · nâng
> applyTemplate) — không đập engine nào. Đổi định nghĩa khoá ① thì ghi 00-CHOT trước khi code.
