# PHIẾU · ĐẤU NỐI LARKBASE (M7) — MỞ RỘNG, không dựng lại
### Dán TRỌN vào MỘT phiên. Kết nối: Larkbase → IF (ĐỌC-only).

## TỚI ĐÂU RỒI (đọc code 06/08)
Đã có, ĐỪNG dựng lại:
- `lib/lark/task-utils.ts` · `lib/lark/atlas-material-map.ts` · `lib/integrations/providers/lark.ts` · `lib/colors/larkbase.ts`
- Routes: `app/api/lark-tasks/route.ts` · `/lark-tasks/sync` · `/lark-user-map` · `/colors/lark`
⇒ pull **task / user / màu** đã chạy. Việc còn thiếu: **pull nhân sự + dự án**.

## LUẬT CHUNG
- **V6**: KHÔNG commit. Hoà commit.
- Phóng **1 agent làm + 1 agent phản biện**.
- **N7 / §0t**: `grep -a` trước khi sửa.
- Ghi `docs/M-LARK-OUT.md`. **KHÔNG sửa `GAP-IF.md`** (§0u).
- 🔴 **TRUNG TÍNH (cứng)**: connector = **tính năng** → vào repo. **DATA khách** (tên nhân sự thật, tên dự án thật, số liệu) → `.idf` / `2407-Test/`, **TUYỆT ĐỐI KHÔNG vào repo**. Xong: `grep -a` tên khách trong `lib/` `app/` = **0**.

## VIỆC — pull nhân sự / dự án (ĐỌC-only)
BƯỚC 0 (`grep -a`): liệt kê endpoint + hàm lark ĐÃ có ở trên → xác nhận chưa có "nhân sự"/"dự án" trước khi thêm.

1. **Đường pull mới, READ-only**: nhân sự (danh sách người, phòng ban) + dự án (mã · tên · trạng thái). Bám khuôn `lib/integrations/providers/lark.ts` sẵn có, KHÔNG tạo provider thứ hai.
2. **Cửa ghép cột** — DÙNG LẠI khuôn warehouse (`lib/materials/warehouse/column-mapping.ts`: `guessMapping` / `loadSavedMapping` / `saveMapping` / `unmappedColumns`). Không viết mapping mới từ 0.
3. **Chỉ ĐỌC**: không viết ngược lên Lark. Không đồng bộ 2 chiều trong vòng này.
4. **Lọc rác dữ liệu**: mã dự án "Khác"/không phải mã số → gom riêng, đừng coi là 1 dự án thật (rủi ro đã ghi trong nghiên cứu Lark).

## NGHIỆM THU (N6) — không chỉ "có code"
- Pull thật 1 bảng nhân sự + 1 bảng dự án → hiện đúng số dòng, cột ghép đúng.
- `grep -a` tên khách trong `lib/` `app/` = **0** (data ở `.idf`/`2407-Test`).
- Ghi `docs/M-LARK-OUT.md`: pull được gì · cột nào ghép · cột nào rơi. KHÔNG commit.
