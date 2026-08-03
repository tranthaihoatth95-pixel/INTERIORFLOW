# PHIẾU CODE IF · ĐỢT 6 — sau khi có trọn bộ mock Claude Design
**TỔNG lập 03/08/2026 06:5x.** Đọc `SO-KIEM-TONG.md` §0→§0d trước. Thứ tự đã xếp theo CHẶN TRƯỚC — ĐẸP SAU.

## 🔴 NHÓM A — HẠ TẦNG ĐANG HỎNG (làm trước, không thì mọi thứ sau đều vá chồng lên chỗ mục)

### A1 · `findByAlias()` không lọc `when` — BOM HẸN GIỜ
**Vật chứng:** `lib/commands/registry.ts` — `findByAlias()` tra thẳng toàn bộ `COMMANDS`, không xét `when`.
**Hậu quả:** `SPEC-DUNG-3D-THONG-NHAT` cần thêm 37 lệnh 3D, trong đó alias `M`/`W`/`S`/`C`/`T` **trùng chữ với lệnh CAD**. Thêm vào là **che lệnh CAD im lặng** — người dùng gõ M ở chặng 2D nhưng chạy lệnh 3D.
**Việc:** cho `findByAlias()` nhận ngữ cảnh (stage + mode) và lọc `when` trước khi trả về. Khi vẫn còn nhiều kết quả sau lọc → trả về theo thứ tự ưu tiên ngữ cảnh hiện tại, KHÔNG trả bừa cái đầu tiên.
**Nghiệm thu:** test — cùng alias `M`, ở `stage==cad` trả lệnh CAD, ở `stage==render && mode==3d` trả lệnh 3D. 0 lệnh CAD nào bị che.
**⛔ CHẶN:** mọi việc thêm lệnh 3D phải đợi A1 xong.

### A2 · 592 dòng code mồ côi — quyết định rồi làm
**Vật chứng:** `components/three/CommandPanel.tsx` (5 tab đủ) + `ObjectProperties.tsx` **không mount ở đâu**; app thật chạy `components/render-studio/Command3DPanel.tsx` với 3/5 tab placeholder, khoá tab còn lệch (`tao` vs `create`).
**Việc:** khảo sát 2 file, so với `Command3DPanel` đang chạy → chọn MỘT trong hai đường, ghi lý do vào báo cáo:
 (a) mount `CommandPanel` thay `Command3DPanel`, gỡ bản placeholder — nếu nó đủ tốt;
 (b) rút phần dùng được sang `Command3DPanel` rồi **xoá hẳn** 2 file mồ côi — nếu bản đang chạy tốt hơn.
**CẤM để nguyên trạng** — 592 dòng không ai gọi là bệnh §1 chống rớt.

### A3 · `defineMode()` chưa ai gọi — Trụ 4 mới nằm trên giấy
**Vật chứng:** `defineMode()` **0 nơi gọi** · `getMode(` grep = 0 · đang có **hai bản khai mode lệch nhau** (3 trường ReactNode vs 6 trường string).
**Việc:** thống nhất MỘT khuôn khai mode, rồi khai thật 4 mode đang có: `2d/sketch` · `2d/pro` · `3d/node` · `3d/3d`. Mỗi mode khai đúng 4 thứ theo `SPEC-HA-TANG-UI-IF` Trụ 4: navigator · canvas · shelves · commands. **Cấm state ẩn.**
**Nghiệm thu:** đổi mode chỉ đọc khai báo, không có `if (mode === ...)` rải rác trong component.

### A4 · `entityId` chỉ gán cho nhóm tường
**Vật chứng:** `lib/three/cad-to-obj.ts:416` — chỉ `Wall_${i}` truyền `entityId`; sàn·phòng·nội thất·cửa sổ để trống.
**Việc:** gán `entityId` cho MỌI nhóm. Đây là điều kiện tiên quyết để chọn cái ghế trong 3D rồi mở Inspector sửa — và cho luật "chọn hết cùng loại".
**Neo:** `SPEC-TANG-DU-LIEU-CAU-KIEN.md` §0.4 và §8.

## 🟡 NHÓM B — PORT BỘ MOCK (sau khi A xong)
Mock đã audit A4 ĐẠT (0 hex TTT · dùng `var(--)` · đủ 2 theme · khung 6 ổ khớp số đo):
| Mock | Port vào | Ghi chú |
|---|---|---|
| `mocks/mock-2d-ky-thuat.html` | chặng 2D | panel phải **LỚP HOÀN THIỆN mặt A/mặt B** = đúng BIM nội thất · nút "Chọn hết cùng loại" (cần A4 xong) · thanh dưới "Bắt điểm: Đầu mút, Giữa cạnh" |
| `mocks/mock-3d-thong-nhat.html` | chặng 3D | ⚠️ còn 4 chỗ nhãn chặng CŨ — sửa khi port, đừng port nguyên văn |
| `mocks/mock-trinh-bay.html` | chặng Trình bày | **cơ chế live-link BOQ**: ô sửa tay viền + chấm cảnh báo → panel "Mô hình cho 44.20" + nút "Lấy lại số từ mô hình" + "LẤY TỪ: 9 tường ngăn" · sidebar đếm "Lấy từ mô hình 22 / Đã sửa tay 3". **Số học trong mock đã kiểm tay: tổng 175 605 950 khớp** |
| `mocks/mock-if-du-an.html` · `mock-if-cai-dat.html` · `mock-if-tep.html` · `mock-if-thu-vien.html` · `mock-if-anh-dai-dien.html` · `mock-if-bang-nut.html` · `mock-if-nut-tong.html` | màn phụ | CHƯA audit — phiên port tự chạy audit A4 trước (grep hex TTT · `var(--)` · `data-theme` · nhãn chặng) |
**Luật port (L2):** port nguyên văn token, NHƯNG vùng nào mock ghi PLACEHOLDER thì **không port thành dữ liệu thật** — tiền lệ "12 gradient" đã ghi sổ.

## 🟢 NHÓM C — HÀNG ĐỢI CŨ CÒN NỢ
- **G4:** 5 lỗi UI Trình bày `PHIEU-TRINH-LOI-UI-2026-08-03.md` (L2→L1→L5→L3→L4) — kiểm `git log --all -- components/present-editor/` xem đã commit chưa
- **PHU:** BOQ 11 việc B0-B11 `PHIEU-TRINH-BOQ-EDITOR.md` · trong đó **B8 `xlsx.ts:93` ghi dòng TỔNG bằng SỐ CHẾT** (grep `SUM|<f>|formula` = 0) — xuất ra Excel không sống
- **CHINH:** palette ⌘K nối `registry.ts` (đợi A1) · tooltip ghi phím tắt vào title nút Navigator
- **Sửa nhãn `model.ts:101`**: đang ghi `IfcFurnishingElement` — buildingSMART đã đánh dấu deprecated, lớp đúng là `IfcFurniture` (NC-11)

## LUẬT CHUNG MỌI PHIÊN CODE ĐỢT NÀY
1. Trước mỗi việc: `git log --all -- <path>` kiểm ai vừa đụng (tiền lệ giao trùng việc 3D-2).
2. `git commit -- <pathspec>` ĐÍCH DANH, không `git commit -a`.
3. Lock rác FUSE: `rm -f .git/*.lock` nếu báo "index.lock: File exists" (kiểm mtime >2 phút mới là lock chết).
4. `npx tsc --noEmit` sạch trước khi commit. Toàn repo hiện **0 lỗi** (`f012ca8`) — đừng để mình là người làm đỏ.
5. Khai thật phần chưa verify được (§0). Xong việc: cập nhật báo cáo của mình + ô `CHECKLIST-TONG.md`.
6. Chốt phiên ~85% context, tự soạn khối kế nhiệm.
