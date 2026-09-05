# Báo cáo R4 — Tool3DBar lắp ToolbarChip/ToolbarBar (mảnh cuối `toolbar-mot-khuon`)

Phiên phụ lane UX/UI · 19/08/2026 · HEAD `c7f3ac8` (main) · phiếu theo `docs/IF-INTEGRATED-EXECUTION-MAP.md` §3 Đợt 0.

## ① Tổng quan

Tiền đề ⓪ XÁC NHẬN (đo tại nguồn): `components/render-studio/Tool3DBar.tsx` tồn tại, trước sửa
**0 dòng** import `ToolbarChip`/`ToolbarBar` (grep). ⓪b PASS: HEAD `c7f3ac8`, nhánh `main`.
Việc đã làm: vỏ bar tự vẽ (r3 · color-mix 96% · shadow riêng) đổi sang `ToolbarBar` dùng chung;
nút Áp dụng đổi sang `ToolbarChip`; hành vi/phím/handlers giữ nguyên 100%. Không REFUSE —
nhưng có MỘT lệch giữa phiếu và hiện trạng file, ghi ở ② và ⑦b.

## ② Chi tiết + bằng chứng

- **Lệch phiếu ↔ file**: phiếu dặn "nút disabled đi đường `aria-disabled` + `disabledReason`" —
  Tool3DBar **không có nút disabled nào**. Cả file chỉ có ĐÚNG MỘT nút (`Áp dụng`, trước sửa ở
  `:262-273`); ca thiếu selection (`needsSel`, `:216`) hiện **warning text** chứ không phải nút mờ.
  Mô hình của phiếu về file này hơi cũ; phần aria-disabled do đó không có chỗ áp — nhưng
  `ToolbarChip` tự mang đường đó sẵn nếu sau này có nút mờ.
- **Sửa gì** (chỉ 1 file, `components/render-studio/Tool3DBar.tsx`):
  - import `{ ToolbarChip, ToolbarBar }` từ `@/components/ui/ToolbarChip` (:24); bỏ
    `concentricRadius` (không còn chỗ dùng), giữ `RADIUS`.
  - Vỏ: div ngoài nay CHỈ mang định vị (absolute/bottom/z-index) + font + `barRef` +
    className `if-3d-tool-bar`; hình dạng (nền `var(--panel)` đặc · viền · r-full · shadow-pop)
    do `ToolbarBar` mang — đúng hợp đồng "style chỉ nhận phần định vị, hình dạng không cho ghi đè"
    (`ToolbarChip.tsx:199-201`). Lý do cần div bọc: `ToolbarBar` **không forward ref**, mà
    `barRef` là chỗ listener phím CAPTURE kiểm `contains(e.target)` (`:183`) — bỏ ref là vỡ
    máy trạng thái phím.
  - Nút Áp dụng → `ToolbarChip` icon `<Check/>` + `label` song ngữ qua `tr()` + `desc` +
    `shortcutHint="Enter"`, onClick giữ nguyên `applyRef.current(); setActive('select')`.
  - Ô số: bo đổi `concentricRadius(RADIUS.r3, 7)` → `RADIUS.full` (kẹp về nửa cạnh ngắn ⇒ tự
    đồng tâm với vỏ capsule ở mọi cỡ — cùng lập luận ghi ở `ToolbarBar` docstring, luật §2d).
  - Thêm `ToolbarBar.Sep` giữa cụm ô số ↔ nút Áp và trước dòng hint (khuôn KB-1 "bỏ gạch | lửng").
  - G9 GIỮ: `ToolbarBar` nền `var(--panel)` đặc, không backdrop blur — còn đặc hơn bản cũ 96%.
- **Hành vi không đổi**: Enter/Esc/Space capture (`:178-212`) nguyên vẹn; Space khi focus trong
  bar vẫn bị chặn TRƯỚC khi kích nút (capture + preventDefault) — giống nút cũ.

## ③ Bức tranh

`toolbar-mot-khuon` (15/08 `96a3913`) nay phủ đủ: 2D `CadToolbar` ✅ · 3D `ToolDock3D` ✅ ·
Present `Toolbar` ✅ (trừ hàng `Btn` CTA đặc, tự khai ngoại lệ tại `Toolbar.tsx:910`) · **3D
`Tool3DBar` ✅ (R4 này)**. Bar tham số 3D và dock compact ngay dưới nó giờ cùng một vỏ capsule —
hết cảnh hai tấm cùng góc màn hình hai ngôn ngữ hình dạng.

## ④ Đánh giá khách quan

Đổi thuần vỏ, rủi ro thấp; điểm dễ cãi nhất là CTA accent-đặc → chip ghost (mất nhấn primary).
Tôi chọn chuyển vì: phiếu chỉ đích danh, khuôn compact-capsule của dock là icon-chip, và đường
chính của thao tác là phím Enter (hint text nói rõ ngay cạnh) — nút chỉ là affordance phụ.

## ⑤ ≥2 hướng đã cân

1. **Chuyển cả vỏ + nút sang khuôn chung** (đã làm) — trọn mảnh cuối, một khuôn thật.
2. Giữ nút Áp dụng là CTA đặc theo tiền lệ `present-editor/Toolbar.tsx:910` ("CTA đặc khác ngữ
   pháp với ToolbarChip"), chỉ đổi vỏ — an toàn hơn về nhấn thị giác nhưng để lại một nút tự vẽ
   trong bar đã mang khuôn chung. Nếu duyệt mắt thấy Áp dụng chìm quá, đường lùi là hướng 2
   (một edit nhỏ, không đụng gì khác).

## ⑥ Đề xuất

- Duyệt mắt ca: mở tool `rect` → nhìn bar (capsule, ô số pill, chip Check, 2 vạch Sep) — chụp
  vào `Drive/IF-duyet-mat/01-anh/` khi có server khoẻ.
- Nếu sau này bar cần nút mờ (vd Áp dụng mờ khi `needsSel` thay vì giấu), `ToolbarChip` đã có
  sẵn đường `aria-disabled + disabledReason` — đổi nhánh render là xong.

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **BROWSER-PENDING**: chưa mở app thật một dòng nào. Server 3001 trả HTTP 200 nhưng sổ 19/08
  (W0.3) ghi nó "bệnh .next của phiên khác + auth wall" — theo phiếu tôi không lái nó. Mọi nhận
  định thị giác (capsule 44 chứa đủ ô số 24px, Sep không dư, chip không lệch baseline) là ĐỌC MÃ,
  chưa nhìn pixel. Đặc biệt chưa kiểm: bar dài hơn ~10-16px (2 Sep + padding chip) có tràn khổ
  hẹp không — bản cũ không kẹp `maxWidth`, bản mới cũng không (giữ nguyên hiện trạng).
- Chưa chạy test DOM nào cho Tool3DBar (file không có test riêng; `tool3d.test.ts` chỉ test lõi
  thuần — 34 pass, không chạm phần vỏ vừa đổi).
- `className="if-3d-tool-bar"` giữ nguyên nhưng nay nằm ở div bọc ngoài, không còn ở phần tử
  mang nền — grep toàn repo 0 chỗ tiêu thụ class này ngoài chính file, nên coi là vô hại.

## ⑦c HẠN DÙNG

Kết luận đúng tại HEAD `c7f3ac8` + working tree 19/08 tối. Nếu R3 (`ToolDock3D` diff chưa commit)
đổi API `ToolbarChip`/`ToolbarBar` trước khi checkpoint, phải tsc lại. Sau khi Present `Btn`
CTA được giải ngoại lệ (nếu có), cân lại hướng 2 ở ⑤.
