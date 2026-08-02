# TICKET CHỐT — BUILD UI CHẶNG 2 (gom mọi quyết định 02/08)

> Ticket tổng cho chặng Rendering. Nguồn: `SPEC-CHANG2-UI-2MODE` · `SPEC-MODE-PER-STAGE` ·
> `SPEC-STAGE-LIBRARIES` · `NGHIEN-CUU-NODE-CANVAS-DOITHU-2026-08-02` · `SPEC-3D-CORE`.
> **Luật:** hạ tầng UI giữ (top·rail·bottom), gạt mode chỉ đổi **canvas + sidebar**. Additive, không
> đập engine, verify browser thật, **tránh vùng code phụ (present-editor)**, mỗi bước 1 commit + test.

## Thứ tự thi công (ưu tiên trên xuống)

| Bước | Việc | Trạng thái |
|---|---|---|
| **H1** | `useStageMode` + `<ModeShell>` (bật/tắt mode = đổi cả shell) | 🔨 code chính đang làm |
| **H2** | sidebar 3 vùng node (Mood+Collab · Node Master · Node thường), phân loại kỹ ~30 node | 🔨 đang |
| **H3** | tool = node side trái → **window kéo-thả** (play·X·cổng nối); **GỠ thanh tab ngang**; giữ bug 2.2.92 đóng | 🔨 đang |
| **G1** | **Bottom bar**: giữ thanh zoom/pan (chọn·pan·frame·undo/redo·zoom·fit·grid·⌘) + **1 nút rời gạt "Vẽ 3D"** | ⬜ |
| **G2** | **Mood+Collab canvas**: toolbar bút tablet (bút·marker·highlight·tẩy) · presence **online/offline + mời(+)** · sticky/comment/reaction · **frame theo phòng** · **swatch `matId`** · share Viewer/Commenter/Editor · **mindmap = template tuỳ chọn** (kéo từ kệ) | ⬜ |
| **G3** | **Vẽ 3D mode**: viewport (**trục toạ X/Y/Z + ViewCube + gizmo di chuyển**) · **Command Panel** (Tạo·Sửa·Vật liệu·Camera·Hiện) · catalog **V-Ray/D5/IF** chung `matId` · **+ Scene Objects (outliner) + Object Properties** | ⬜ |
| **H4** | Present chọn 5 loại hồ sơ | ⬜ (sau code phụ P6) |
| **G4** | **Kệ Thư viện chặng 2** (form lập luận · moodboard · preset · pipeline templates) | ⏸ chờ chốt 3 câu (`SPEC-STAGE-LIBRARIES`) |
| **G5** | **Pattern nâng** (nghiên cứu đối thủ): cổng nối có kiểu · node inspector nhẹ · **"Turn into"** · **command bar LLM ra lệnh** | ⬜ sau cùng |

## Ràng buộc chốt
- **matId xuyên 2 mode** — swatch Mood = material Vẽ 3D = catalog V-Ray/D5/IF cùng khoá.
- Vẽ 3D **xám trơn** (massing, chưa PBR — `SPEC-3D-CORE` §6); photoreal để D5/Chaos (cửa bậc 5).
- Share roles = **collab-share, KHÁC** phân quyền IF1/IF2 (đã bỏ).
- Không thành ComfyUI/Miro/engine — giữ node nội thất gọn.

---
*Cowork chốt 02/08/2026 theo loạt mock Hoà đã duyệt (Mood+Collab · Vẽ 3D · bottom bar).*
