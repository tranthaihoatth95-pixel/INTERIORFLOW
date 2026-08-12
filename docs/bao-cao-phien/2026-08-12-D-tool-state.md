# Báo cáo phiên D — tool-state-3d (12/08/2026)

Phiếu: `docs/phieu-giao/tool-state-3d.md` · Vùng file: `components/render-studio/**` · `lib/three/**` · `lib/render-studio/**` (không đụng ngoài vùng, không git, không dev server).

## File

| File | Loại | Nội dung |
|---|---|---|
| `lib/render-studio/tool3d.ts` | MỚI | Máy trạng thái công cụ 3D `[marker: Tool3DStateMachine]`: store zustand `useTool3D` (activeTool3d) + logic THUẦN — `tool3dKeyTransition` (Enter/Esc/Space kết thúc · chữ tắt đổi tool) · builders vẽ-đáy-đùn (`lineBlockEntities`/`rectBlockEntities`/`circleBlockEntities` — tái dùng `wallSegmentOutline`/`ellipsePoints`) · biến đổi cụm chọn (`moveSelectionUpdates`/`rotateSelectionUpdates`/`duplicateSelectionEntities` — tái dùng `translateEntity`/`rotateEntity`, cùng luật hostId của gizmo) · `measureSelection` (thước) |
| `lib/render-studio/tool3d.test.ts` | MỚI | 34 test sucrase-node: chuyển trạng thái phím · hình học builders · hostId đi cùng nhau · dz kẹp ≥0 · xoay 90° hoán w↔d · nhân bản remap hostId · thước nói null khi chưa đùn |
| `components/render-studio/Tool3DBar.tsx` | MỚI | Mặt UI của máy trạng thái: bar ô NHẬP SỐ đáy khung nhìn theo tool đang cầm, ô đầu tự focus; Enter áp + về Chọn · Esc huỷ · Space về Chọn; ghi Doc duy nhất qua `addEntities`/`updateEntities` (Ctrl+Z lùi được); listener CAPTURE nên thắng QuickCommandBox; nền đặc, không backdrop (G9) |
| `components/render-studio/ToolDock3D.tsx` | SỬA | Nối dock vào store tool: mở 8 nút thành lệnh THẬT (Chọn V · Đường L · Chữ nhật R · Vòng tròn C · Di chuyển M · Xoay Q · Nhân bản D · Thước T); 5 nút CHƯA engine giữ disabled + lý do RIÊNG từng nút (Cùng loại · Kéo mặt-ghi chú · Bo cạnh · Cắt khối · Đo góc); hằng `CHUA_DUNG_DUOC` gỡ hẳn (0 lần xuất hiện — đúng bằng chứng `can:false` của registry) |
| `components/render-studio/Render3DModeSkeleton.tsx` | SỬA | Mount `Tool3DBar` (nâng đáy khi dock mở rộng, không đè tấm) · `[marker: focusEntity]` đọc `?focusEntity=` → chọn đúng group có entityId trong `useTree3DUi` (áp 1 lần/giá trị, chưa thấy entity thì chờ scene sau, không bịa) · `[marker: taoViecTuDay]` nút "＋ Tạo việc từ đây" khi khối chọn có entityId thật → POST `/api/tasks` {title gợi từ tên group, stage:'render', entityId} → toast + link `/tasks` |

## Lệnh thật (dán nguyên văn)

```
$ node_modules/.bin/tsc --noEmit
exit=0

$ node_modules/.bin/sucrase-node lib/render-studio/tool3d.test.ts
34 pass · 0 fail

$ for f in lib/three/*.test.ts …   (toàn bộ test lib/three + lib/render-studio + lib/tasks/context)
lib/three/build-ops.test.ts → exit 0 · 74 pass, 0 fail
lib/three/cad-to-obj-levels.test.ts → exit 0 · 25 ok, 0 fail
lib/three/cad-to-obj.test.ts → exit 0 · 79 pass, 0 fail
lib/three/capture.test.ts → exit 0 · 27 pass, 0 fail
lib/three/csg.test.ts → exit 0 · 6 pass, 0 fail
lib/three/glb-import.test.ts → exit 0 · 13 ok, 0 fail
lib/three/lighting.test.ts → exit 0 · 84 pass, 0 fail
lib/three/obj-import.test.ts → exit 0 · 5 ok, 0 fail
lib/three/obj-scene-to-geometry.test.ts → exit 0 · 10 pass, 0 fail
lib/three/section-entities.test.ts → exit 0 · 54 pass, 0 fail
lib/three/section.test.ts → exit 0 · 10 pass, 0 fail
lib/three/snap3d.test.ts → exit 0 · 28 pass, 0 fail
lib/render-studio/graph-pattern.test.ts → exit 0 · 7 pass / 0 fail
lib/render-studio/tool-mode-graph.test.ts → exit 0 · 4 pass / 0 fail
lib/render-studio/tool3d.test.ts → exit 0 · 34 pass · 0 fail
lib/tasks/context.test.ts → exit 0 · 12 pass · 0 fail

$ grep -c "disabled: true" components/render-studio/ToolDock3D.tsx
5        (trước phiên: 12 — đếm cùng lệnh)
$ grep -n "CHUA_DUNG_DUOC" components/render-studio/ToolDock3D.tsx | wc -l
0
```

Đếm nút dock bấm được: **trước 3** (Tường · Thư viện · Vật liệu; "Chọn" là trạng thái tĩnh) → **sau 11** (thêm Chọn · Đường · Chữ nhật · Vòng tròn · Di chuyển · Xoay · Nhân bản · Thước). Disabled 12 → 5, nút nào còn mờ đều có lý do riêng ≤12 từ.

## Quyết định (kèm lý do — không hỏi giữa chừng)

1. **Thao tác tool = NHẬP SỐ, chưa phải click-điểm trên khung nhìn.** Unproject con trỏ → mặt sàn cần camera sống; camera nằm kín trong `components/three/Scene3DViewer` — **NGOÀI vùng file phiếu** (vùng chỉ có render-studio + lib/three + lib/render-studio; `components/three` không thuộc). Nhập số đúng tinh thần SPEC-LENH-VE-IF ("gõ số sau thao tác") và cùng khuôn lệnh Tường hai điểm sẵn có. Đường click-điểm ghi thành đề xuất (dưới).
2. **Khối vẽ ra mang `elementType:'wall'`.** Đường đùn duy nhất hôm nay của `docToObjScene` (`cad-to-obj.ts:571-575`) chỉ đùn hatch phân loại tường; muốn "khối massing chung" phải thêm elementType ở `lib/cad/model.ts` (ngoài vùng). Nhãn UI chỉ nói "khối dựng", không hứa hơn.
3. **Phím tắt qua listener CAPTURE + stopPropagation.** `QuickCommandBox` (Viewport3D, ngoài vùng) nuốt MỌI chữ/số vào dòng lệnh; capture chạy trước nên Enter/Esc/Space của tool và chữ tắt V/L/R/C/M/Q/D/T (đúng chữ in trên dock từ trước) thắng. Hệ quả chấp nhận: ở mode 3D, gõ rời 8 chữ đó không rơi vào dòng lệnh nữa (gõ `array…` vẫn chạy vì bắt đầu bằng `a`); gõ trong ô nhập NGOÀI bar không bị cướp phím nào.
4. **Nhân bản KHÔNG dùng `pasteEntities`** — hàm đó giữ hostId cũ nên bản sao neo vào khối gốc (dời là rách); viết `duplicateSelectionEntities` remap hostId theo cặp id mới (test [8] khoá).
5. **Đọc `?focusEntity=` bằng `window.location.search`** thay `useSearchParams` — khỏi ép Suspense boundary lên trang; áp 1 lần/giá trị, chỉ khi tìm thấy entity trong scene.
6. **Gizmo-first giữ nguyên đúng phiếu**: tool 'select' là trạng thái mặc định, không nút nào thay thế push-pull/gizmo; nút "Kéo mặt" vẫn disabled dạng ghi chú chỉ đường (kéo trực tiếp trên khung nhìn).

## CHƯA LÀM — nói thẳng

- **Click-điểm/kéo chuột trên khung nhìn cho tool vẽ** (kiểu SketchUp thật): cần `Scene3DViewer` mở API pick-mặt-sàn (raycast ground plane) — ngoài vùng. Đề xuất: PHU xuất `onGroundPick?(ptCadMm)` + expose qua `Viewport3D`, Tool3DBar khi đó điền ô số từ điểm click (số vẫn sửa được — cùng triết lý).
- **Cùng loại (⇧V) · Bo cạnh · Cắt khối · Đo góc**: giữ disabled — bevel/boolean hôm nay là THAM SỐ ở panel Sửa, chưa có thao tác rời; đo góc chưa có engine.
- **Hotkey tool chưa vào `lib/shortcuts.ts`/`lib/commands/registry.ts`** (bảng ⌘? / ⌘K) — hai file ngoài vùng, cùng tình trạng các phím mode 3D đã ghi ở comment skeleton. Danh sách cần thêm: V/L/R/C/M/Q/D/T + Enter/Esc/Space của máy trạng thái.
- **Nhánh 2D của focusEntity/tạo-việc** (registry `focus-entity-doc`/`tao-viec-tu-day` phần 2D): ngoài trần chuyên trách phiên này (chặng 3D), chưa đụng.
- **Registry không sửa** (đúng ô⑧) — `tool-state-3d` còn `trangThai:'chua'` trong khi bằng chứng (`CHUA_DUNG_DUOC` đã sạch) nay thoả: `soi:frontier` sẽ báo "sổ quên" cho tới khi T lật trạng thái sau audit.
- **Chưa soi bằng browser** — phiếu cấm dev server; nghiệm thu mắt là việc phiên V.
- Working tree lúc chạy có sẵn file dirty của phiên khác (`components/cad/*`, `components/present-editor/*`) — KHÔNG đụng, không liên quan thay đổi phiên này.

## 2 GIÁ TRỊ (phạm vi chặng 3D)

**Kiến trúc.** Chặng 3D lần đầu có MỘT máy trạng thái công cụ đúng nghĩa (store + transition thuần có test), tách 3 tầng sạch: trạng thái (`lib/render-studio/tool3d`) — hình học tái dùng engine chặng CAD, không đẻ engine thứ hai — UI chỉ là mặt tiền (`Tool3DBar`/dock). Mọi thao tác ghi qua `addEntities/updateEntities` nên tự có undo (KS4) và tự chảy về MỘT Doc (K1): khối dựng ở 3D mở sang 2D là thấy mặt bằng. Vòng TaskContext khép kín ở phía 3D: việc → deep-link → chọn đúng khối, và ngược lại khối → việc mang {stage, entityId}.

**Vận hành-sử dụng.** Dock 3D từ "hầu như chẳng sử dụng được" (3 nút thật/15) thành 11 nút thật: designer quen SketchUp/AutoCAD bấm-tool-rồi-thao-tác đã có đường làm việc — cầm tool, gõ số, Enter dựng/dời/xoay/nhân bản/đo, Space về Chọn, sai thì Ctrl+Z; nút còn mờ nói rõ vì sao mờ. Đứng ở khối nào tạo được việc gắn đúng khối đó, người nhận việc bấm là rơi về đúng khối — mở kịch bản 90-phút của Phiếu 3 thay vì dừng ở dock trang trí.
