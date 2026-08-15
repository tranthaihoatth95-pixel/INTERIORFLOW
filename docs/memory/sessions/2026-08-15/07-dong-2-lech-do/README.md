# 07 · T đóng 2 lệch đỏ + nghiệm thu hàng đợi render

> Phiên T thuần dọn tồn của các nhánh 03/04 cùng ngày. Không phóng sub-agent.
> Báo cáo đầy đủ (khuôn 6 phần): `docs/bao-cao-phien/2026-08-15-T-dong-2-lech.md`.

## Vào phiên thấy gì
`soi:frontier` → **2 lệch đỏ** kiểu "code có rồi mà sổ ghi chưa": `mirror-doi-xung-chuan-net`
(nhánh 03, đã commit `f423652`) và `render-queue-live` (code còn untracked trong working tree).
Ngoài ra working tree còn 3 mảnh dở của nhánh 04 chưa commit.

## Việc đã làm
1. **Sửa lỗi chặn**: `ToolbarChip.tsx:22` import `{ Tooltip }` nhưng `Tooltip.tsx` là **default
   export** → TS2614 làm **tsc đỏ toàn repo**. Sửa xong: tsc exit 0 · `npm test` exit 0 (7.711 ok).
2. **Nghiệm thu hàng đợi render trên app thật** (không tin báo cáo suông): server 3000,
   `/projects/…/render`, viewport **1440×900** (hẹp hơn thì app rơi vào "Tổng quan — chỉ đọc",
   panel không mount — mất 3 lượt mới nhận ra, ghi lại để phiên sau khỏi vấp).
   `window.__ifRenderQueue.demo(3)` + `.demoFail()` → 0 credit. Kết quả: 4 trạng thái đều đúng,
   thumbnail đổi sang ảnh kết quả khi xong, ETA chỉ hiện sau job đầu xong, `cancelAll` trả đủ
   `cancelled`, rỗng thì panel tự ẩn, "Huỷ tất cả" mờ khi hết việc.
3. **Flip registry** cả 2 entry sang `xong`, ghi kèm phần CHƯA chứng minh (đường job thật
   `kind:'node'` chưa chạy sống vì tốn credit; mirror chưa chạy lại proof Lincoln 327 thật).
4. **Commit 4 cụm**: `13e4c23` hàng đợi render · `1e5b408` màn khoá · `bdd6a96` ToolbarChip +
   fix tsc · cụm sổ sách (registry + ship-map + báo cáo + STATUS).

## Số kết phiên
`soi:frontier` **0 lệch** · `soi:tu-dien` 0 · `soi:contract` 21 dây / 0 lệch · `soi:hinh-hoc`
10/1010 ngoài thang (nợ cũ) · `soi:thao-tac` 2 lệch **nợ cũ nguyên si** (31 focus-visible ·
193 hex inline — trùng khít số 13/08, `grep` 3 file mới trong log lệch = 0 hit).
Ship map: 101 task · 👁1 ✓64 ○36 · 64%.

## Điều đáng lo nhất, không phải 2 lệch
**64 mục xong-MÁY đối lại đúng 1 mục qua mắt Hoà.** Hai lệch vừa đóng cũng chỉ làm 64 thành 64.
Băng thông duyệt mắt của Hoà là tài nguyên khan hiếm nhất (đã ghi ở `DOI-CHIEU-3-TRUONG-PHAI`) —
T đề xuất chạy SONG SONG: Hoà đi Lô duyệt mắt #1, T lắp ToolbarChip vào 3 thanh công cụ.

## Còn treo
- `ToolbarChip` **mồ côi** — đã commit nhưng chưa ai import (bước 1/4 của L1). Phiên sau lắp vào
  `CadToolbar.tsx` · `ToolDock3D.tsx` · `present-editor/Toolbar.tsx`.
- Đường job THẬT của hàng đợi render — chờ một lượt render thật để xác nhận.
- Icon thông báo/mail màn khoá — chưa có hệ Notification/Mail thật, chờ Hoà chỉ chỗ nối.
- `AGENTS.md` untracked: bản sao CLAUDE.md do công cụ ngoài sinh, có chỗ sai
  (`.Codex/launch.json`). **Cố ý không commit** — bản sao lệch của luật nền là mầm loạn thông tin.
