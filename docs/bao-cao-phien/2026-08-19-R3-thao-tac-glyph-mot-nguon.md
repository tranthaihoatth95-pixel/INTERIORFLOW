# R3 — thao-tac-glyph → Tooltip hình minh hoạ · MỘT NGUỒN (xong-máy + browser)

> 19/08/2026 · HEAD `c7f3ac8` (⚠️ đã đổi so với `3da4b8c` lúc sáng — phiên khác commit docs spec) ·
> working tree vẫn mang Wave 0 chưa commit của phiên khác · KHÔNG commit/push theo phiếu.

## 1 · Tổng quan
Capability `thao-tac-glyph` (kho 6 hình minh hoạ, dựng 16/08, **orphan — 0 caller**) đã nối vào hệ
command/Tooltip hiện hữu: hình + câu giải nghĩa khai **MỘT CHỖ** ở `lib/commands/registry.ts`,
chảy qua `toolbar-source` → `ToolbarChip`/`Tooltip` ra **cả 2D lẫn 3D**, verify bằng browser thật.
`thao-tac-glyph`: **ORPHAN → LIVE**. 100% CONNECT — 0 component mới, 0 token mới, 0 registry thứ hai.

## 2 · Chi tiết

### ⓪ Tiền đề (đo tại nguồn trước khi code)
| # | Câu hỏi | Đo được |
|---|---|---|
| 1 | orphan? | ĐÚNG — grep `ThaoTacGlyph` ngoài `lib/ui/thao-tac-glyph*` = 0 hit; prop `hinh={` toàn app = 0 usage thật |
| 2 | registry contract | `CommandDef` có `icon?: string` (khuôn "sổ giữ chuỗi, component ở command-icon.tsx") — chưa có `hinh`/`desc` |
| 3 | Tooltip | đã có `hinh?: ReactNode` (Tooltip.tsx:63) + hợp đồng "có hinh BẮT BUỘC có desc" (:241-245) + CSS `.if-tooltip-hinh` (globals.css:1696) |
| 4 | consumers | ToolbarChip pass-through `hinh` (:70,:176; nút mờ đi CÙNG đường Tooltip — fix 16/08); CadToolbar CommonGroup KHÔNG truyền desc/hinh; ToolDock3D tự chế câu "— dùng chung ở cả ba chặng"; present Toolbar dùng `IconOnly`+`title` (ngoài Tooltip) |
| 5 | nguồn thứ hai | 0 (hit duy nhất `hinh={` là false-positive `tuyChinh={`) |
| 6 | 6 hình | có thật (`doi·xoay·chep·lat·do·chon`) + test guard 6 nhóm, gồm mục [6] cấm-làm-nút |
| 7 | DS | không cần gì mới — REUSE trọn |

### Thay đổi (7 file)
| File | Gì |
|---|---|
| `lib/commands/registry.ts` | +`import type ThaoTacKey` (erased, lib vẫn thuần) · CommandDef +`hinh?: ThaoTacKey` +`desc?: [vi,en]` · điền 6 lệnh: select→chon · move→doi · copy→chep · rotate→xoay · mirror→lat · measure→do, mỗi lệnh 1 câu desc VI/EN ≤12 từ |
| `lib/commands/toolbar-source.ts` | `CommonCommand` +`desc`/`hinh`, `commonCommandsFor` pass-through — mặt tiền không tự chế |
| `components/ui/command-icon.tsx` | +`commandHinh(khoá) → <ThaoTacGlyph/>` — MỘT chỗ đổi khoá→glyph, đúng vai file |
| `components/cad/CadToolbar.tsx` | CommonGroup +`desc={tr(c.desc)}` +`hinh={commandHinh(c.hinh)}` |
| `components/render-studio/ToolDock3D.tsx` | DockGroupItem +`hinh`; title ưu tiên `c.desc` từ sổ (fallback câu cũ); 2 chỗ render chip +`hinh` |
| `lib/commands/registry.test.ts` | +nhóm [7]: khoá hình hợp lệ · **bất biến `hinh ⇒ desc`** · đúng 6 lệnh · không trùng hình |
| `lib/commands/toolbar-doc-registry.test.ts` | +nhóm [7]: desc/hinh Y HỆT sổ ở cả 3 stage · `bindStage` không làm rơi |

### Máy kiểm
tsc **0** · `registry.test` **105 ok/0 fail** · `toolbar-doc-registry.test` **51 ok/0 fail** ·
`thao-tac-glyph.test` đạt (guard cấm-làm-nút **REUSE**, không viết framework mới) · `npm test` toàn bộ **exit 0**.

### ⑤ Browser (server riêng port 65386 — server 3000/3001 của phiên khác, không đụng; đã `preview_stop` sau verify)
| Ca | Kết quả nhìn thấy |
|---|---|
| 2D · "Chọn" (hover) | thẻ: tiêu đề + phím `Esc` + **hình chon** + "Bấm để chọn, kéo khung để chọn nhiều" ✅ |
| 2D · "Di chuyển" cụm SỬA (hover) | hình `doi` + "Chọn đối tượng rồi kéo tới vị trí mới" ✅ |
| 3D · dock thu gọn "Di chuyển" (hover) | **y hệt 2D** + phím `M` — một nguồn hai mặt tiền ✅ |
| 3D · panel mở rộng "Đối xứng" (disabled) | hình `lat` + lý do thật "Chưa có lệnh đối xứng cho khối 3D" — nói thật ✅ |
| focus (bàn phím, đo JS thật) | `btn.focus()` → `focused:true`, tooltip visible, `hinh aria-hidden="true"` ✅ |
| hình ≠ nút (đo DOM thật) | `svg[viewBox 220×110]` trong `<button>` = **0** ✅ |
| light/dark | theme SÁNG kiểm mắt ✅ · theme TỐI **chưa nhìn mắt** (app theme theo store, không theo prefers-color-scheme; R3 không đổi 1 dòng CSS; glyph `currentColor` có test khoá không-hex) |

## 3 · Bức tranh
Đây đúng ca "dây có, chưa cắm điện" thứ N: Tooltip/ToolbarChip đã chờ prop `hinh` từ 16/08, kho
hình đã có test guard, registry đã có khuôn chuỗi→component — thiếu đúng đoạn giữa. R3 chỉ kéo
đoạn giữa, và bất biến "một nguồn" giờ do MÁY canh (2 nhóm test [7] mới) chứ không do kỷ luật.

## 4 · Đánh giá khách quan
Tốt: 0 NEW, mọi ràng buộc thành test, disabled nói thật, a11y giữ (hinh⇒desc khoá máy).
Chưa tốt/nợ lộ ra: ① **present Toolbar** cụm lệnh chung dùng `IconOnly`+`title` ngoài Tooltip —
undo/redo không có hình nên R3 không đụng, nhưng đây là mặt tiền lệch khuôn ToolbarChip (nợ riêng,
đúng loại việc R-sau) ② 2D CommonGroup cụm SỬA nằm khuất bên phải toolbar ở màn hẹp (không do R3).

## 5 · Hai hướng đã cân
A (chọn) — `hinh` là KHOÁ CHUỖI trong registry, đổi khoá→component ở `command-icon.tsx`: giữ lib thuần
test sucrase, đúng khuôn `icon` sẵn có. B — registry giữ thẳng ReactNode: ít một tầng nhưng kéo React
vào `lib/commands`, vỡ test thuần + trái khuôn đã chốt ⇒ loại.

## 6 · Đề xuất
STOP tại R3 (đạt ⑥b, 1 vòng sửa/5). Không mở R4. Việc kế đáng ghi hàng đợi: present Toolbar về khuôn
ToolbarChip để undo/redo cũng đi đường Tooltip (khi đó desc từ sổ tự chảy sang, 0 công thêm).

## ⑦b CHƯA CHẮC
- Theme TỐI chưa nhìn mắt (lý do + lưới đỡ ở bảng ⑤). Cảm ứng/long-press chưa thử thiết bị thật.
- Focus-tooltip: JS xác nhận focus bắn + tooltip visible, nhưng thẻ đang mở lúc đo là thẻ hover kế bên — chưa chụp riêng ca "Tab tới nút thấy thẻ".
- `desc` 6 câu do R3 soạn theo SPEC-NGON-NGU-CHI-DAN — chữ nghĩa chưa qua mắt Hoà (xong-máy ≠ xong-mắt).
- Không kiểm `AppCommandPalette` (⌘K) có nên hiện hình — ngoài phạm vi, chưa đo.

## ⑦c HẠN DÙNG
Đúng tại HEAD `c7f3ac8` + working tree 19/08 chiều; hết hạn khi B5 (`runFor`) đụng CommonCommand,
khi present Toolbar đổi khuôn, hoặc khi Hoà duyệt mắt đổi câu desc. KHÔNG commit — Hoà tự bấm.
