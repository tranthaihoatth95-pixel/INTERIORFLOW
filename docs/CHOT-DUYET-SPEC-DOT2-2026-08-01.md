# CHỐT — VÒNG DUYỆT SPEC ĐỢT 2 · 01/08/2026

> Đóng nốt **14 file còn đeo nhãn `[CẦN HOÀ DUYỆT]`** sau đợt 1 (7 file, cùng ngày).
> Hoà trả lời 4 câu, một lần, ngay trong phiên. Ghi ĐÚNG điều Hoà chốt (Luật 14r).

---

## 1 · HOÀ CHỐT

### 1a · Chặng 0 — Ý tưởng & Moodboard: **DUYỆT HƯỚNG, XẾP HÀNG ĐỢI**

- IF chính thức là **4 chặng: 0 → 1 → 2 → 3**. `SPEC-STAGE-0-IDEATION.md` thành luật;
  `IF-ARCHITECTURE-BLUEPRINT-v1` gỡ nhãn theo.
- **Chưa code.** V1 video + ĐỢT 3 `useDismissable` xong trước. Không rút người khỏi việc đang chạy.

### 1b · Bốn spec tính năng: **DUYỆT HƯỚNG CẢ BỐN**

| Spec | Điều thành luật khi thi công |
|---|---|
| `SPEC-EDITOR-TOOLKIT` | **Một engine · bốn bộ công cụ** — không phải bốn editor. Video mức **CapCut-like**, KHÔNG After Effects. **Đừng tự viết engine** |
| `SPEC-BRIEF-INTAKE` | Được phép **thay** tính năng "AI mô tả – Đề bài chi tiết" đang sống ở CAD. Luật bản quyền + luật trích dẫn là phần cứng của spec |
| `SPEC-COLLABORATION` | Bình luận **gắn ngữ cảnh** (node · slide · vùng bản vẽ). **KHÔNG** chat chung kiểu Slack |
| `SPEC-FILE-MANAGER` | Nguyên tắc gốc: **mở Finder ra vẫn hiểu**. Bịt rủi ro local-first (user dời file tay) |

Duyệt hướng = spec thành luật + vào hàng đợi. **Thứ tự thi công chưa chốt** — xếp khi tới lượt.

### 1c · ArchiNote — **DUYỆT 5 ĐỀ XUẤT E2, NHƯNG SỬA ĐIỀU 2**

⚠️ **Hoà LẬT đề xuất của spec ở điều 2**: spec đề nghị ArchiNote *không cần* trung tính (tool nội
bộ); Hoà quyết **ArchiNote CŨNG PHẢI THEO LUẬT TRUNG TÍNH** — phòng mai mốt bán ra thì khỏi dọn
lại như vừa phải dọn IF hôm nay (gỡ `knowledge/ttt-design-system`, ảnh, `files.zip` — commit
`96b5f1e`). Giá chấp nhận: trừu tượng hoá `domain.ts` ngay từ đầu.

Bốn điều còn lại giữ nguyên đề xuất: huỷ share-JWT (giữ auth riêng) · mở rộng repo `ttt-tasks`
(không tách repo mới) · bảng Lark `PROJECT_STATUS` thuộc phạm vi việc ATLAS · tên agent **KIẾN**
chốt sau. ArchiNote **không code trong 3 ngày tới** — chỉ chốt spec.

`SPEC-ARCHINOTE-IF-BOUNDARY` đã bị `SPEC-ARCHINOTE-DETAIL-v1` thay thế → gỡ nhãn, trỏ về DETAIL.

### 1d · Nhóm 8 file kỹ thuật — **GỠ 7, GIỮ `SPEC-SEMANTIC-MODEL`**

Hoà muốn **tự đọc `SPEC-SEMANTIC-MODEL.md` trước khi gỡ** — vì nó là quyết định đắt nhất của IF
(chốt đúng thì Render + Present + Bảng tính rẻ đi; chốt sai thì đắt gấp bội). Nhãn của nó **treo
tiếp, có chủ đích**.

---

## 2 · COWORK DUYỆT THAY (7 file, căn cứ đo 01/08)

| File | Căn cứ |
|---|---|
| `SPEC-RENDER-STUDIO` | 🧮 18 file `components/studio` — đã thành code chạy thật |
| `SPEC-IF-LIBRARY` | 🧮 `LibraryAsset` trong schema + route `/library` sống |
| `SPEC-MATERIAL-PIPELINE` | 🧮 `MaterialRef`/`LarkTaskRef` trong schema + `lib/lark` 4 file |
| `PLAN-LIBRARY-GATEWAY` | NT1–NT5 do Hoà chốt sẵn trong `PROMPT-2807-RUN.txt` |
| `SPEC-KNOWLEDGE-BASE` | cơ chế chống bịa số — kỹ thuật thuần. 🧮 `lib/knowledge` = 0 file: **chưa xây**, duyệt hướng |
| `SPEC-ARCHINOTE-IF-BOUNDARY` | thay thế bởi DETAIL-v1 (mục 1c) |
| `IF-ARCHITECTURE-BLUEPRINT-v1` | nhãn trỏ về STAGE-0 — đã duyệt ở 1a; blueprint sửa thành **4 chặng** |

---

## 3 · VIỆC SINH RA TỪ VÒNG NÀY — giao Claude Code lượt tới

1. **Gỡ nhãn `[CẦN HOÀ DUYỆT]` khỏi 13 file** (tất cả TRỪ `SPEC-SEMANTIC-MODEL`):
   RENDER-STUDIO · EDITOR-TOOLKIT · IF-LIBRARY · MATERIAL-PIPELINE · COLLABORATION · FILE-MANAGER ·
   KNOWLEDGE-BASE · BRIEF-INTAKE · STAGE-0-IDEATION · ARCHINOTE-DETAIL-v1 · ARCHINOTE-IF-BOUNDARY ·
   PLAN-LIBRARY-GATEWAY · IF-ARCHITECTURE-BLUEPRINT-v1. Thay bằng 1 dòng
   `> Duyệt 01/08/2026 — xem CHOT-DUYET-SPEC-DOT2-2026-08-01.md`.
   README.md + INDEX-AI-SPECS.md nhắc nhãn theo kiểu mục lục — cập nhật cho khớp.
2. Blueprint: sửa mô tả 3 chặng → **4 chặng (0→3)** ở những chỗ liệt kê chặng.
3. `SPEC-ARCHINOTE-DETAIL-v1` phần E2 điều 2: ghi bổ sung *"Hoà quyết 01/08: ArchiNote CŨNG theo
   Luật Trung Tính"* — không xoá đề xuất cũ, ghi quyết định đè lên có ngày tháng.

---

*Cowork ghi 01/08/2026, ngay sau khi Hoà trả lời. Sau vòng này chỉ còn **1 nhãn sống có chủ đích**:
`SPEC-SEMANTIC-MODEL` — chờ Hoà tự đọc.*
