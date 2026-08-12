# Báo cáo phiên W — focus-entity + tạo-việc-từ-đây (nhánh 2D + Trình chiếu)

Phiếu: `docs/phieu-giao/focus-entity-2d-present.md` · dây máy: `focus-entity-doc` ·
`tao-viec-tu-day` (nhánh 2D+Present — nhánh 3D thuộc agent D, KHÔNG đụng render-studio).
Không git · không dev server (đúng ràng buộc ô⑤ — hook nhắc mở preview đã từ chối có chủ đích).

## File sửa / tạo

| File | Việc |
|---|---|
| `lib/tasks/focus-entity.ts` (MỚI) | helper thuần `parseFocusEntity` + `suggestedTaskTitle` + hằng `FOCUS_ENTITY_PARAM`/`TASK_BOARD_ROUTE` + fetch mỏng `postTaskFromHere` (POST `/api/tasks` CÓ SẴN, không đẻ API mới; chỉ `import type` từ lib/server/tasks — cùng luật context.ts) |
| `lib/tasks/focus-entity.test.ts` (MỚI) | 17 case: parse các dạng query · **round-trip với `buildTaskDeepLink`** (link sinh ra đọc lại đúng id kể cả ký tự encode) · title cắt 72 ký tự · route Bảng việc |
| `components/cad/CadEditor.tsx` | [marker: focusEntity] effect mount: đọc `?focusEntity=`, thử ngay + subscribe store (doc hydrate BẤT ĐỒNG BỘ qua CadSheets/IDB) → `select([id])` + `cad:goto-box` (đệm 1500mm, listener sẵn có của CadCanvas) + status; quá 6s không thấy → `pushLibraryToast('Đối tượng không còn trong bản vẽ')` — không chặn gì |
| `components/cad/CadCanvas.tsx` | [marker: taoViecTuDay] mục "Tạo việc từ đây" trong menu chuột phải nhánh có selection; `cadTaskLabel` đặt title theo TÊN (phòng/chữ/block/zone); POST xong hiện pill "Đã tạo việc · Mở Bảng việc" (tự tắt 5s, token `--panel/--border/--accent`); thiếu projectId → status giải thích, không nút giả |
| `components/present-editor/PresentEditor.tsx` | [marker: focusEntity] đọc `?focusEntity=` lúc mount (PresentEditor chỉ mount SAU hydrate — docstring PresentSheets): khớp slide.id → `selectSlide`; id là element → nhảy trang chứa nó + select element; không thấy → toast `exportMsg` "Trang không còn trong hồ sơ này." (kênh toast sẵn có, Luật Đồng Bộ #6). Truyền thêm `slideIndex` cho Inspector |
| `components/present-editor/Inspector.tsx` | [marker: taoViecTuDay] nút "Tạo việc từ đây" trong panel "Nền slide" (Inspector trang, đúng ô④): POST {stage:'present', entityId: slide.id}, title theo dòng chữ đầu của trang hoặc "Trang N"; xong hiện "Đã tạo việc · Mở Bảng việc"; chưa xác định dự án → nút mờ kèm lý do trong title (luật §9 cấm nút giả) |

## Kết quả lệnh THẬT

```
$ npx tsc --noEmit
(0 lỗi — không output)

$ sucrase-node lib/tasks/focus-entity.test.ts   → focus-entity.test: 17 pass · 0 fail
$ sucrase-node lib/tasks/context.test.ts        → 12 pass · 0 fail
$ sucrase-node lib/tasks/board.test.ts          → 34 pass · 0 fail
$ sucrase-node lib/tasks/scaffolder.test.ts     → scaffolder.test: 23 pass, 0 fail
$ sucrase-node lib/cad/commands.test.ts         → 70 pass, 0 fail   (sanity vùng cad)
$ sucrase-node lib/cad/dxf-plan.test.ts         → 28 pass, 0 fail   (sanity vùng cad)
```

## Quyết định tự chọn + lý do

1. **2D chờ hydrate bằng subscribe + timeout 6s** thay vì đọc 1 phát: Doc nạp bất đồng bộ từ
   IDB (`CadSheets.loadSheets`), đọc ngay lúc mount sẽ báo "không còn" oan. Không thấy sau 6s
   mới toast — đánh đổi: entity thật sự đã xoá thì người dùng chờ 6s mới biết (nhẹ, không chặn).
2. **Toast tái dùng, không viết mới**: 2D dùng `pushLibraryToast` (LibraryToastHost đã mount
   thường trực qua AppShell→LibrarySheet) + status line; Present dùng kênh `exportMsg` sẵn có.
   Riêng "Đã tạo việc" cần THÊM hành động "Mở Bảng việc" (chữ trong phiếu) nên render pill/dòng
   xác nhận tại chỗ — text-only toast không mang được nút.
3. **Title gợi ý giọng trung tính "Xem lại …"** — không đoán ý định (Sửa/Xoá); theo tên đối
   tượng thật (room.name / text / BLOCK_MAP name / zone.label), fallback "đối tượng 2D"/"Trang N".
4. **Present nhận cả element id** dù v1 chỉ cần mức trang: tìm slide.id trước, trượt xuống tìm
   trang chứa element — rẻ (1 findIndex), giúp deep-link từ nguồn khác sau này không vỡ.
5. **Không tự điều hướng sang /tasks sau khi tạo việc** — người dùng đang vẽ/dàn trang; "kèm mở
   Bảng việc" hiểu là KÈM LỐI MỞ (nút/link), không phải giật họ đi. Link dùng `TASK_BOARD_ROUTE`.

## CHƯA LÀM — nói thẳng

- **Chưa nghiệm thu bằng browser thật** (phiếu cấm mở server) — chiều bấm-chip-rơi-đúng-tường cần
  phiên V mở app kiểm: `/projects/{id}/cad?focusEntity={id}` và `/present?focusEntity={slideId}`.
- 3D (render-studio) thuộc agent D — không đụng, đúng phân vùng.
- Radial menu cảm ứng (chạm-giữ) CHƯA có mục "Tạo việc từ đây" — phiếu cho phép chọn context
  menu; radial 8 ô đang đầy, thêm là đổi bố cục chạm (việc riêng nếu Hoà muốn).
- i18n: nhãn mới đang VI thuần (menu/toast vùng cad hiện hành cũng VI thuần — cùng hiện trạng,
  chưa qua useT); nếu quét song ngữ vùng này thì gom một thể.
- Registry: agent KHÔNG sửa (ô⑧) — T flip `focus-entity-doc` · `tao-viec-tu-day` sau audit.

## 2 GIÁ TRỊ

- **Kiến trúc (dây liên chặng khép được gì):** TaskContext Link nay khép VÒNG HAI CHIỀU ở 2 trên
  3 chặng — `buildTaskDeepLink` sinh link (đã ship 12/08) và từ nay chặng ĐỌC lại đúng param đó
  (round-trip có test khoá 2 đầu cùng một hằng `FOCUS_ENTITY_PARAM`), đồng thời chiều ngược
  đối-tượng→việc dùng đúng POST /api/tasks + `TaskStage` hiện có, không đẻ API/format mới. Task
  trở thành ĐƯỜNG DÂY thật giữa Bảng việc và Doc, không còn là bảng ghi chú đứng rời.
- **Vận hành (kịch bản Phiếu 1 tiến bước nào):** "junior 9h bấm việc → rơi đúng bức tường,
  không phải hỏi ai" — bấm chip nay select + bay camera tới đúng đối tượng ở 2D, mở đúng trang ở
  Trình chiếu; đối tượng đã xoá thì được NÓI THẲNG thay vì màn hình câm. Chiều ngược: senior
  đứng ngay trên bức tường/trang lỗi bấm "Tạo việc từ đây" là việc mang sẵn ngữ cảnh — vòng
  giao-nhận việc 3 chạm khép tại chỗ làm việc, không qua chat mô tả vị trí.
