# AUDIT — mảng WORKSPACE / SyncWork (8 màn)
**COWORK-TỔNG · 06/08/2026 · TRUNG TÍNH (0 tên khách, 0 số liệu dự án)**

Lý do làm: `docs/BANDO-PHU-THIET-KE-IF.html` tự ghi mảng này là *"lỗ hổng lớn nhất · cần một mẻ
design RIÊNG"* và **không phiên nào đang cầm** (`BANG-PHAN-VIEC-IDF.html`: M1 · fix-GốcC · LÀN A/C
đều ở mảng khác). Nhưng theo N8/§0o **cấm đề xuất khi chưa grep** — nên việc đầu tiên là mở code ra
đếm, không tin nhãn trên bản đồ.

Mọi dòng dưới đây có `file:dòng`. Lệnh dùng `grep -rina` (§0t).

---

## 1 · Kết quả đếm — bản đồ ghi SAI 3 chỗ

| Màn | Bản đồ ghi | THẬT (đã grep) | Chứng cứ |
|---|---|---|---|
| **Bảng Kanban** | 🔴 "CHƯA có gì" | 🟠 **CÓ code, CHỈ ĐỌC** | `components/dashboard/LarkPanels.tsx:176` `LarkKanbanTab` · mount `components/Dashboard.tsx:367` · `LarkPanels.tsx:8` ghi rõ *"kéo-thả kanban KHÔNG đổi trạng thái"* |
| **Gantt / tiến độ** | 🔴 "CHƯA có gì" | 🔴 **đúng — 0 tuyệt đối** | `grep -rina "gantt" components/ lib/ app/ docs/mocks/` = **0 dòng** |
| **Tổng quan dự án** | 🔴 thiếu | 🟠 **CÓ code, chưa .dc** | `components/Dashboard.tsx` 25.9 KB · mount 3 ổ: `home/HomeScreen.tsx:611`, `:627`, `studio/AppShell.tsx:160` |
| **Chat nhóm / Cộng tác** | 🔴 thiếu | 🔴 **gần đúng** — chỉ có ghi chú rời | `components/nodes/CommentPin.tsx:26` · `components/CommentLayer.tsx:17` · `filemanager/FileManagerShell.tsx:526`. **0 hạ tầng nhiều người**: `grep -na "yjs\|liveblocks\|socket.io\|partykit\|pusher\|ably" package.json` = **0** |
| **Vitals (AI)** | 🔴 thiếu | 🟠 **CÓ code** | `components/studio/VitalsChatBubble.tsx` · `VitalsGesture.tsx` · `VitalsStateBadge.tsx` · `VitalsIcon.tsx` |
| **Notebook** | 🔴 thiếu | 🟠 **CÓ code + CÓ trang, có 3 đường vào** | `components/notebook/*` (7 file) · `lib/notebook/rag.ts` · trang `app/projects/[id]/notebook/page.tsx:180`. Đường vào: `studio/StageSwitcher.tsx:166`, `studio/VitalsGesture.tsx:195`, `app/projects/[id]/overview/page.tsx:204` |
| **Knowledge base** | 🔴 thiếu | 🟠 **CÓ mảnh** | `lib/notebook/rag.ts` · `docs/SPEC-KNOWLEDGE-BASE.md` (4.0 KB) |
| **Lịch / nhắc việc** | 🔴 thiếu | 🟠 **CÓ dữ liệu, chưa có màn** | `lib/lark/task-utils.ts` (có deadline) · `app/api/lark-tasks/route.ts` · `app/api/lark-tasks/sync/route.ts` |

> ⚠️ **`NotebookButton.tsx` là ca N6 nhẹ** — file còn trên đĩa nhưng 0 nơi mount; dấu vết ở
> `components/studio/StageSwitcher.tsx:37` ghi *"NotebookButton cũ (đã bỏ khỏi Header)"*.
> **KHÔNG mất đường vào** (còn 3 đường ở trên) ⇒ chỉ là file thừa, không phải lỗ hổng. Ghi để
> phiên sau khỏi báo động nhầm.

### Hai mock `collab` KHÔNG phải chat nhóm
`docs/mocks/mock-mood-collab-g2-2026-08-03.html` `<title>` = *"IF · **Dựng ảnh** · Mood+Collab"*;
`mock-mood-collab.html` = *"Mood + Collab (Miro · tablet/pen · mindmap)"*. Cả hai tả **cộng tác
trong chặng Dựng ảnh**, không tả chat nhóm dự án. ⇒ Bản đồ ghi *"collab + spec"* dễ làm phiên sau
tưởng đã có hợp đồng giao diện cho chat nhóm — **không có**.

---

## 2 · Lỗ hổng THẬT sau khi trừ phần đã có

Không phải "8 màn trắng". Thật ra là **1 màn trắng hẳn + 1 lỗ kiến trúc + 6 màn có ruột chưa có vỏ**:

| # | Lỗ | Mức |
|---|---|---|
| **A** | **Gantt = 0 tuyệt đối.** Màn duy nhất chưa có một dòng code nào. | 🔴 |
| **B** | **SyncWork là "lớp VIỆC" nhưng không SỬA được việc.** Kanban chỉ đọc từ Larkbase, kéo-thả không ghi ngược (`LarkPanels.tsx:8`). Người dùng thấy việc nhưng không đổi được trạng thái ⇒ vẫn phải mở Larkbase. Đây là **lỗi định vị**, không phải lỗi màn. | 🔴 nặng nhất |
| **C** | **0 hạ tầng nhiều người.** Không yjs/liveblocks/socket. "Cộng tác" hiện = ghi chú lưu cục bộ. Chat nhóm không thể vẽ trước khi chốt có/không realtime. | 🔴 chặn |
| **D** | 6 màn (Kanban · Tổng quan · Vitals · Notebook · Knowledge · Lịch) **có ruột, chưa có .dc** ⇒ mỗi phiên port tự bịa một chuẩn. | 🟠 |

**Thứ tự đúng:** chốt **C** (kiến trúc) → **B** (đường ghi ngược) → mới vẽ **A + D**.
Vẽ Gantt trước khi biết dữ liệu việc chảy một chiều hay hai chiều là vẽ mù.

---

## 3 · Việc đề xuất — KHÔNG đụng mảng phiên khác

| Việc | Mảng | Va chạm? |
|---|---|---|
| ① Sửa 3 chấm sai trên `BANDO-PHU-THIET-KE-IF.html` | `docs/` — TỔNG | không |
| ② Thêm 5 dòng GAP mảng SyncWork vào `GAP-IF.md` (§0u — chỉ TỔNG ghi) | `docs/` — TỔNG | không |
| ③ Soạn brief Claude Design cho mảng Workspace, **chia đợt** (§0m) | `docs/` — TỔNG | không |
| ④ Code đường ghi ngược Kanban → Larkbase | `lib/lark/*` · `components/dashboard/*` | **chờ Hoà giao phiên** — TỔNG không code (§7) |

① ② đã làm trong phiên này. ③ chờ chốt **C** trước (§0q: không hỏi Hoà quyết định thiết kế —
nhưng có/không realtime là **quyết định kiến trúc sản phẩm**, thuộc §0k, được hỏi).

---

## 4 · Lỗi đã mắc trong chính phiên này (HG6 — bắt buộc ghi)

1. **Suýt phạm §0o lần thứ 9.** Đọc bản đồ thấy *"Kanban — CHƯA có gì"* và định soạn brief vẽ
   Kanban từ đầu. Grep ra `LarkKanbanTab` đang chạy thật. Nếu không grep: một mẻ design đè lên
   thứ đang dùng được (§0d GIỮ-CÁI-ĐANG-TỐT).
2. **Suýt báo `NotebookButton` mồ côi = mất đường vào Notebook.** Grep thêm một vòng
   `router.push` mới thấy còn 3 đường vào. Kết luận đầu là **dương tính giả**.
3. Grep vòng đầu dùng từ khoá quá rộng (`presence|websocket`) → trúng nhầm hàng loạt file
   `studio/*`. Phải quay lại đếm ở `package.json` mới ra sự thật (0 dep realtime). Đúng ca **N7**:
   grep phải đúng chỉ báo, không phải chỉ báo gần đúng.

---

## 5 · Sổ ledger — 🔴 NGAY đã ĐÓNG, đã kiểm

`VIEC-DANG-CHO.md` ghi *"Dọn trung tính: gỡ tên khách khỏi `lib/` (10 chỗ, gồm dxf.ts)"*.
Đếm lại 06/08:

```
grep -rina "nam long\|namlong\|nam-long" lib/            → 0
grep -rina "nam long\|namlong\|nam-long" components/ app/ → 0
git ls-files | grep -ia "namlong\|nam-long"              → 0
ls docs/CHOT-DIEN-TICH-NAMLONG-2026-08-05.md             → No such file
```

⇒ **Đã dọn xong**, kể cả `git rm` file dữ liệu. Còn hit chỉ ở `docs/` và `.worktrees/*/docs/`
— **§0h phép kiểm miễn trừ `docs/`**. Ledger đang lạc hậu, đã cập nhật.
