# 11 · REPO ARCHAEOLOGY — orphan capability / lost primitive audit (19/08)

## Việc gì, kết quả gì
Audit khảo cổ toàn repo tìm capability mồ côi (engine 0 caller · component 0 mount · route chết ·
contract đứt · stale docs 2 chiều · duplicate khác tên · nợ lịch sử git). **Read-only** — 0 dòng
code sản xuất bị sửa, 0 commit. Sản phẩm chính: `docs/AUDIT-ORPHAN-CAPABILITIES-2026-08-19.md`
(38 orphan · 11 reconnect giá trị cao · 14 stale docs · 6 unknown owner · 5 ca sổ-ghi-sai được
đính chính). Cùng lượt: lập hệ memory 3 tầng theo contract Hoà ban 19/08 —
`docs/memory/RETRIEVAL-MAP.md` (lần đầu) + `docs/memory/IF-MEMORY-RETRIEVAL-SYSTEM-2026-08-19.md`.

## Phương pháp
- Mốc: HEAD `c7f3ac8` + working tree 85 mục dirty (audit working tree, không chỉ HEAD).
- 5 lượt quét song song: `lib/**` · `components/**` · `app/**+prisma+config` · git archaeology ·
  docs↔code (chạy cả 4 máy soi có sẵn).
- Chuẩn "có thật": ENGINE → CONTRACT → CALLER → SURFACE → USER ACTION → OUTPUT đủ dây.
- T đo lại tay 3 ca hai lượt quét mâu thuẫn (mục dưới) — không lượt quét nào được tin mù.

## 3 mâu thuẫn giữa các lượt quét — T phân xử bằng grep tại nguồn
| Ca | Lượt A nói | Lượt B nói | T đo | Phán |
|---|---|---|---|---|
| `LightBar` | components: 0 import | lib: "4 màn dùng thật" | grep import = **0** (lib gộp nhầm với LightArc) | 0 mount — RECONNECT |
| `lib/distill/engine` | git: chỉ test import | lib: 2 importer thật | `distiller.ts:27` + `reference-sheet.ts:17` import thật | SỐNG qua distiller |
| `CuaSoThaoLuan` | components: 0 mount | lib: "mount ở overview:308" | overview:308 chỉ mount `DesignDnaCardPanel`; CuaSoThaoLuan **0 mount** | DistillEngine sống qua MỘT mặt tiền, mặt tiền collab chết |

⇒ Bài học lặp lại của hệ: **báo cáo agent phải cross-check nhau + spot-check tại nguồn** —
3/5 lượt quét có ít nhất 1 khẳng định sai, cả 3 đều bị bắt bằng một lệnh grep.

## Phát hiện đắt nhất (chi tiết đầy đủ ở file audit)
1. **P0 `VitalsGesturePanel` 675 dòng mất hẳn lối vào** — hệ quả chưa ai kiểm của việc gỡ
   StageSwitcher 17/08 (đang uncommitted); StatusBar đã gỡ bản thứ hai từ 05/08.
2. **P0 `WorkHubShell` = ca nút giả DUY NHẤT toàn repo** (trợ lý trả lời hard-code, 0 fetch,
   route 0 link) — phần còn lại repo kỷ luật §9 rất cao.
3. **P0 `specId` đứt ở mắt cuối khi drop từ Thư viện** — resolveLibraryItem biết tra, 2 call site
   không truyền; BOQ ăn lỗi `missing-specId-item`. Sửa = 1 tham số.
4. **`lib/idfc-import` 3.341 dòng + 986 test = orphan lớn nhất repo** — 0 caller ngoài nội bộ.
5. **Hai công thức lux** — engine `lib/lighting/lux.ts` 0 caller trong khi `rules-3d.ts:149`
   tự tính bản thiếu MF.
6. 5 ca **sổ nhớ hộ code sai** được đính chính (LibraryItem không phải model · api/chat có 4
   caller · cad-library manifest sống mạnh · demo-amanoi không còn · getMaterial đã 2 caller).

## Giới hạn & CHƯA CHẮC
- Con số caller đo bằng grep import-by-path + basename; **không chạy app** — hành vi runtime
  (2 ⌘K cùng nghe, iframe workhub trống) là suy từ mã, cần bấm thử.
- Grep có 4 lớp false-positive đã biết (runtime-cast Prisma delegate · dynamic import ·
  Worker URL · caller ngoài scope như `extension/`) — các lượt quét đã trừ, nhưng dạng "qua biến
  trung gian" thì grep mù.
- Đếm 38 orphan là **sàn, không phải trần** — helper <30 dòng bỏ qua có chủ ý.
- HẠN DÙNG: mọi số gắn với working tree 19/08 chưa commit. Hoà commit/dọn xong là phải đo lại.

## File sinh ra trong nhánh này
- `docs/AUDIT-ORPHAN-CAPABILITIES-2026-08-19.md` — bản audit chính
- `docs/memory/RETRIEVAL-MAP.md` — chỉ mục 11 topic (lần đầu lập; trước đó KHÔNG tồn tại)
- `docs/memory/IF-MEMORY-RETRIEVAL-SYSTEM-2026-08-19.md` — hợp đồng memory 3 tầng
- `docs/memory/LATEST.md` — thêm mục 19/08 đợt archaeology
- `PROMPT-GOC.md` (cùng thư mục) — 2 prompt gốc của Hoà đã cứu
