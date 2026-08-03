# SPEC — MODE 3D THỐNG NHẤT *(chặng 3D Thiết kế · một giao diện, không mode con)*

> **COWORK-DỰNG · 04/08/2026** — việc #3 của `CHOT-TEN-CHANG-MODE-2026-08-03.md` §6.
> **Nguồn luật (không được lật):**
> - `CHOT-TEN-CHANG-MODE` §5 — Hoà nguyên văn: *"đã 3d model là tách tầng với render comfy ui…
>   đã đủ rối rồi, chọn những điểm sáng giao diện của cả sketchup 3dmax revit, đồng bộ với nhau
>   thành 1 giao diện 3dmode thống nhất. **cấu kiện ở chặng 1**."* ⇒ **CẤM thêm mode con trong 3D.**
> - `CHOT-TEN-CHANG-MODE` VÒNG CUỐI — ba chặng là **ba ống kính**, không phải ba kho dữ liệu.
> - `SPEC-TANG-DU-LIEU-CAU-KIEN.md` (spec NỀN, cùng vai, 03/08) — L1-L7 · §2.2 bảng `elementType` ·
>   §4 cơ chế derive · §8 định danh Đ1-Đ5.
> - `SPEC-HA-TANG-UI-IF.md` — Trụ 1 sáu ổ · Trụ 2 một sổ lệnh · Trụ 3 Inspector tự sinh ·
>   Trụ 4 mode = 4 khai báo.
> - `SO-KIEM-TONG` §0 trung thực · §0b nghiên cứu-trước-khi-quyết · §0c ba mảng · §0d giữ-cái-đang-tốt.
>
> **Phạm vi:** giao diện + hành vi của **mode `3d`** (chặng 3D Thiết kế). Không đụng mode `node`
> (pipeline ComfyUI) ngoài đúng một chỗ giao nhau: nút sang render AI (§7).
> **Cowork không code** — mọi mục dưới đây là phiếu cho CHINH · PHU · G4.
> Chỗ nào chưa kiểm được ghi thẳng **CHƯA VERIFY**.

---

## §0 · HIỆN TRẠNG ĐÃ KIỂM BẰNG LỆNH (04/08 — đọc code, không suy đoán)

### §0.1 · Cái gì đang SỐNG (⇒ **GIỮ**, build lên, §0d)

| Tài sản | File | Trạng thái kiểm được |
|---|---|---|
| `Scene3DViewer` 5 mode kỹ thuật (orbit·walk·campath·section·massing) | `components/three/Scene3DViewer.tsx` (359 dòng) | ✅ **GIỮ** — engine đã chạy, cấm viết lại |
| **Push/pull thật** — kéo mặt trên tường, preview bằng `scale.y`, nhả chuột gọi `onPushPull` MỘT lần | `Scene3DViewer.tsx:235-270` | ✅ **GIỮ** — hợp đồng ghi-ngược mẫu (spec nền §4.2) |
| Kẹp cao tường dùng chung `clampWallHeight` | `lib/three/cad-to-obj.ts:336` | ✅ **GIỮ** |
| Sân khấu `ground` (lưới 200×200 + sương chân trời) | `Scene3DViewer.tsx` (`ground` prop) | ✅ **GIỮ** — mở màn không thấy hư không |
| ViewCube 3 mặt + 2 nút TRƯỚC/DƯỚI + trục XYZ | `components/three/Viewport3D.tsx:100-133` | ✅ **GIỮ** |
| Empty state 2 nút làm-được-việc + trình tự 3 bước nhớ được | `Render3DModeSkeleton.tsx:150-320` | ✅ **GIỮ** |
| `MaterialSphere` quả cầu vật liệu (PMREM dùng chung, cache PNG) | `components/three/MaterialSphere.tsx` | ✅ **GIỮ** — nối vào 3D, không dựng cái thứ hai |
| VCB lõi thuần (`3x`, `/3`, số mm, dấu phẩy VN) | `lib/commands/vcb.ts` | ✅ **GIỮ** — §3 dùng thẳng, không viết parser mới |
| Sổ lệnh 97 alias + parser `when` không eval + `cmdsFor()` | `lib/commands/registry.ts` (389 dòng) | ✅ **GIỮ** — §2 chỉ THÊM lệnh, không sửa cơ chế |
| Cầu 3D→AI tất định: `three.cad2fbx` đọc thẳng Doc, `three.camera` | `lib/nodes/defs/render-v2.ts:202-290` | ✅ **GIỮ** — §7 dùng lại, không đẻ đường thứ hai |
| `captureFrame(scene, spec, out)` → dataURL | `lib/three/capture.ts:166` | ✅ **GIỮ** — nguồn ảnh clay cho AI |

### §0.2 · Cái gì **CHƯA CÓ / LỆCH** (đã grep, không đoán)

| # | Phát hiện | Bằng chứng |
|---|---|---|
| **H1** | **Sổ lệnh có ĐÚNG 0 lệnh 3D.** Toàn bộ 55 `CommandDef` đều `stage==cad`. 17 chuỗi `render.3d.*` đang được gọi từ UI **chỉ là string trong component**, không có nơi khai. | `grep "render.3d\." lib/commands/registry.ts` = 0 · `components/three/CommandPanel.tsx:70-101` |
| **H2** | **`findByAlias()` KHÔNG lọc theo `when`** — tra thẳng toàn bộ `COMMANDS`. Thêm alias 3D trùng chữ CAD (`M`·`W`·`S`·`C`·`T`) sẽ **che lệnh CAD** hoặc ngược lại, im lặng. | `registry.ts` `findByAlias()`: `COMMANDS.find(...)`, không nhận `WhenCtx` |
| **H3** | **`defineMode()` có 0 nơi gọi.** `lib/shell/mode-registry.ts` tồn tại nhưng không ai đăng ký; docstring tự nhận "đã đăng ký mode `cad` làm mẫu" — **grep `getMode(` = 0 kết quả thật**, `CadStageScreen.tsx:13` chỉ là comment. | `grep -rn "defineMode(\|getMode(" app components lib` |
| **H4** | **Hai bản khai mode lệch nhau.** `mode-registry.ts` `ModeConfig` có **3** trường (navigator·shelves·commands, `navigator` kiểu `ReactNode`); `lib/three/mode-render-3d.ts` `ModeDefinition` có **6** (stage·label·navigator·canvas·shelves·commands, `navigator` kiểu `string`). Trụ 4 đòi **4**. | 2 file trên |
| **H5** | **Hai CommandPanel song song, khoá tab khác nhau.** `components/three/CommandPanel.tsx` (415 dòng, 5 tab đủ, khoá `tao/sua/vatlieu/camera/hien`) **KHÔNG được mount ở đâu**; app thật mount `components/render-studio/Command3DPanel.tsx` (208 dòng, khoá `create/edit/material/camera/visibility`, **3/5 tab là placeholder**). `ObjectProperties.tsx` cũng chưa mount. | `grep` mount: chỉ `Render3DModeSkeleton.tsx:173` dùng `Viewport3D` |
| **H6** | **Gizmo hiện tại là hình vẽ, không phải công cụ.** SVG cố định giữa viewport (`left:50% top:50%`), không bám vật, `onPointerDown` bắn thẳng `onNudge(axis, 100)` — **nhích cứng 100mm/lần bấm**, không kéo, không nhập số. | `Viewport3D.tsx:136-155` |
| **H7** | **3D vẫn KHÔNG đọc `storey`/`elementType`/`specId`** (đúng như spec nền §0.2 ghi 03/08, chưa ai vá). `entityId` vẫn chỉ gán cho nhóm tường. Tên nhóm vẫn `Wall_${i+1}` (số thứ tự — bom hẹn giờ Đ2). | `grep storey lib/three/` = 1 comment · `cad-to-obj.ts:416` |
| **H8** | **Cây "Hiện" là danh sách phẳng + dropdown lọc tầng**, không phải cây TẦNG › PHÒNG › VẬT của mock. Mà `SceneObject.storey` **luôn `undefined`** vì §H7 ⇒ dropdown tầng không bao giờ hiện. | `CommandPanel.tsx:136-141, 355-372` |
| **H9** | **Va phím B/I:** AppShell ăn phím **trần** `B`/`I` ở mọi chặng trừ CAD (CAD phải `⇧B`/`⇧I` vì type-anywhere). Mode 3D chưa được kể vào ngoại lệ ⇒ phím `B` (thùng sơn kiểu SketchUp/D5) sẽ **thu Navigator** thay vì đổi công cụ. | `AppShell.tsx:120-131` (`needShift = active === 'cad'`) |
| **H10** | **⌘K chưa tới chặng 3D.** Nhãn trong bảng tra ghi thẳng: *"hiện chỉ hoạt động ở Trang chủ/màn hình Ý tưởng, chưa có ở CAD/Present"*. | `lib/shortcuts.ts:48-51` |
| **H11** | **0 phím tắt nào cho mode 3D** trong `SHORTCUTS`. Scope `render` chỉ có 8 phím, toàn của bảng node (`V` Chọn, `H` Pan…). | `lib/shortcuts.ts:80-90` |
| **H12** | Token trục `--ax-x/y/z` khai **cứng hex trong `ve3d-css.ts:16`**, không nằm design system, không có bản 2 theme; spec `SPEC-VE-INFERENCE` §2 lại gọi tên `--axis-*`. Hai tên cho một thứ. | `grep -rn "\-\-ax-" ` |

**Đọc §0.2 đúng cách:** H1-H12 **không phải danh sách chê**. Chúng là *lý do vì sao spec này tồn tại*
— và là thứ tự việc thật ở §10.

---

## §1 · KHAI BÁO MODE THEO TRỤ 4

### §1.1 · Khai báo `render.3d` — đúng 4 thứ, không hơn

```ts
defineMode('render.3d', {
  navigator: 'CommandPanel',        // ổ ② — 5 tab Tạo·Sửa·Vật liệu·Camera·Hiện
  canvas:    'Viewport3D',          // ổ ③ — Scene3DViewer + 3 lớp phủ
  shelves:   ['material','camera','massing'],
  commands:  'render.3d.*',
})
```

**Cấm** khai thêm: không `state`, không `defaultTool`, không `cameraPose`, không `theme`.
Bài học Blender đã ghi ở Trụ 4: workspace từng cho side-effect tự do rồi **phải rút lại**.
Những thứ đó sống ở đâu:

| Thứ | Sống ở đâu | Vì sao |
|---|---|---|
| Công cụ đang chọn, trục đang khoá, giá trị VCB | state của canvas (`Viewport3D`) | thao tác dở dang, không phải cấu hình mode |
| Vật đang chọn | **`useCadStore.selection`** (đã có, `store.ts:198`) | Đ3 spec nền — chọn ở 3D thì 2D sáng theo |
| Cao tường mặc định, trần bật/tắt, `SceneTheme` | tuỳ chọn ống kính (`SceneOptions`) | §5 spec nền: **không leo vào `Base`** |
| Góc camera hiện tại, tab đang mở | state UI, nhớ theo người dùng | luật §3.7 Trụ "nhớ lựa chọn tay" |

### §1.2 · So `3d` với `node` — hai mode, một chặng, một Doc

| Ổ (Trụ 1) | mode **`node`** | mode **`3d`** |
|---|---|---|
| ② Navigator | Thư viện khối (Nguồn·Xử lý·Bảng·Xuất) + nhóm "Trên bảng" | **CommandPanel** 5 tab (Tạo·Sửa·Vật liệu·Camera·Hiện) |
| ③ Stage | `FlowCanvas` (React Flow) | **`Viewport3D`** (three.js + ViewCube + trục + gizmo) |
| ④ Inspector | tham số node đang chọn | **tự sinh theo `elementType`** (§6) |
| ⑤ Toolbelt | bút/pan/zoom của bảng node | **10 công cụ 3D** (§2) |
| ⑥ Status | tỉ lệ / trạng thái chạy | **ô gõ lệnh + VCB + trục đang khoá + đơn vị mm** |
| Kệ Thư viện | preset · moodboard | vật liệu · camera · khối |
| Lát sổ lệnh | `render.node.*` (CHƯA có — ngoài phạm vi spec này) | `render.3d.*` |
| Nguồn dữ liệu | **CÙNG một `useCadStore.doc`** | **CÙNG một `useCadStore.doc`** |

**Luật đổi mode:** đổi `node ↔ 3d` **không được** đụng Doc (Luật A, Trụ 1) và **không** reset
camera/công cụ — quay lại thấy đúng chỗ vừa rời (Trụ 3 luật 7 "nhớ lựa chọn tay").
Nút gạt đã có: `ModeSwitchBar` → `ModeSwitchCell`. ✅ **GIỮ**.

### §1.3 · Việc phải làm để §1.1 chạy được (từ H3·H4)

| # | Việc | Ai |
|---|---|---|
| M1 | Thống nhất **một** `ModeConfig` = 4 trường Trụ 4 + `stage`/`label` (siêu dữ liệu hiển thị, không phải khai báo hành vi). Xoá bản trùng ở `lib/three/mode-render-3d.ts`, giữ nội dung. | CHINH |
| M2 | Gọi `defineMode('render.3d', …)` thật + `getMode()` ở nơi mount (`Render3DModeSkeleton`). Hôm nay 0 nơi gọi ⇒ Trụ 4 mới chỉ có trên giấy. | CHINH |
| M3 | Hợp nhất 2 CommandPanel (H5): **giữ bản `components/three/CommandPanel.tsx`** (đủ 5 tab, có props `selected`/`objects`/`onCommand`), bản `render-studio/Command3DPanel.tsx` chỉ còn lớp mỏng nối `useMaterials` — hoặc xoá sau khi chuyển hết. Khoá tab chốt theo bản 3 tiếng Việt (`tao/sua/vatlieu/camera/hien`); **đổi khoá phải kèm migrate localStorage**, không đổi lặng. | G4 |

---

## §2 · BỘ CÔNG CỤ TỐI THIỂU — **10 công cụ, không hơn**

> Bài học SketchUp (§0b bước 2): thắng vì **ít mà đủ** — người nội thất dựng xong phòng trong
> 30 giây, không phải học. 3ds Max thua ở chỗ ngược lại. Mỗi công cụ dưới đây phải trả lời được
> *"thiếu nó thì không dựng nổi một phòng"* — thiếu tiêu chuẩn đó thì không vào bộ.
> **Cấu kiện (cửa/cấu tạo lớp/thống kê) ở chặng 2D** — đây là lý do bộ này ngắn được.

### §2.1 · Bảng công cụ · phím tắt · lệnh registry

Cột **Registry** đọc như sau: `⬜ THÊM (id đã có)` = chuỗi id đã tồn tại trong `CommandPanel.tsx`,
phải khai vào `registry.ts` **giữ nguyên chữ** (§0d). `⬜ THÊM (id mới)` = chưa có ở đâu.
**Không có dòng nào ✅ — sổ lệnh hiện có 0 lệnh 3D (H1).**

| # | Công cụ | Phím | Alias gõ | `id` trong `registry.ts` | Trạng thái |
|---|---|---|---|---|---|
| 1 | **Chọn** | `V` | `SEL3` | `render.3d.tool.select` | ⬜ THÊM (id mới) |
| 2 | **Kéo mặt** (push/pull) | `P` | `PP` | `render.3d.edit.pushpull` | ⬜ THÊM (id đã có) |
| 3 | **Di chuyển** | `M` | `MV3` | `render.3d.edit.move` | ⬜ THÊM (id đã có) |
| 4 | **Xoay** | `Q` | `RO3` | `render.3d.edit.rotate` | ⬜ THÊM (id đã có) |
| 5 | **Co giãn** | `S` | `SC3` | `render.3d.edit.scale` | ⬜ THÊM (id mới) |
| 6 | **Tường** | `W` | `W3` | `render.3d.create.wall` | ⬜ THÊM (id đã có) |
| 7 | **Mặt phẳng / sàn** (vẽ chữ nhật trên mặt) | `R` | `RECT3` | `render.3d.create.floor` | ⬜ THÊM (id đã có) |
| 8 | **Thùng sơn** (gán vật liệu lên mặt) | `B` ⚠️ H9 | `PAINT` | `render.3d.material.paint` | ⬜ THÊM (id mới) |
| 9 | **Thước dây + đường gióng** | `T` | `TAPE` | `render.3d.tool.tape` | ⬜ THÊM (id mới) |
| 10 | **Đặt máy** (camera) | `C` | `CAM` | `render.3d.camera.add` | ⬜ THÊM (id đã có) |

**Va phím phải xử (không được lờ):**
- `B` (thùng sơn) đụng `B` = thu Navigator toàn app (H9). **Chốt:** mode 3D dùng **cùng luật đã có
  cho CAD** — trong mode 3D, panel dùng `⇧B`/`⇧I`; phím trần thuộc về công cụ. Sửa đúng 1 dòng:
  `AppShell.tsx:126` `needShift = active === 'cad'` → thêm điều kiện mode 3D; `Navigator` đã có sẵn
  prop `shiftHotkeys`. **Không đẻ luật mới**, chỉ mở rộng luật §4e đã chốt.
- `V`/`H` đụng bảng node (`lib/shortcuts.ts:88-89`): **không va thật** — node và 3D là hai mode
  không chạy đồng thời. Nhưng `V` = Chọn ở CẢ HAI ⇒ giữ nguyên nghĩa, đó là điểm cộng.
- `S`/`M`/`W`/`T`/`C` trùng chữ alias CAD (`S`=Stretch, `M`=Move, `W`=Wall, `T`=Text, `C`=Circle).
  Phím tắt **không va** (khác `stage`), nhưng **alias gõ tay VA THẬT** vì H2. ⇒ hai việc bắt buộc:
  (a) `findByAlias(raw, ctx)` phải nhận `WhenCtx` và lọc `when` trước khi tra;
  (b) alias 3D đặt hậu tố `3` (`MV3`,`RO3`,`SC3`,`W3`,`RECT3`) làm **đai an toàn thứ hai** —
  nếu (a) chưa xong thì cũng không ai bị che lệnh.
  `W` giữ nghĩa "tường" ở cả hai chặng — cùng chữ, cùng nghĩa, đó là muscle memory chứ không phải va.

### §2.2 · Lệnh 3D **không phải công cụ** (cũng phải vào sổ lệnh)

| Nhóm | `id` | Phím | Alias | Trạng thái |
|---|---|---|---|---|
| Tạo | `render.3d.create.box` · `.door` · `.window` · `.roof` | — | `BOX3`·`DOOR3`·`WIN3`·`ROOF3` | ⬜ THÊM (id đã có) |
| Nhập | `render.3d.import.plan2d` · `.gltf` · `.library` | — | `EXTRUDE`·`IMP3`·`LIB3` | ⬜ THÊM (id đã có) |
| Sửa | `render.3d.edit.bevel` · `.duplicate` · `.mirror` | `⌘D` (nhân bản) | `BEV`·`DUP3`·`MIR3` | ⬜ THÊM (id đã có) |
| Camera | `render.3d.camera.path` | — | `PATH` | ⬜ THÊM (id đã có) |
| Nhìn | `render.3d.view.cube.<tren\|duoi\|trai\|phai\|truoc>` | `1`-`5` | `TOP`·`BOT`·`LEFT`·`RIGHT`·`FRONT` | ⬜ THÊM (id mới) |
| Nhìn | `render.3d.view.zoomextents` | `F` | `EXT3` | ⬜ THÊM (id mới) — cùng phím `F` như CAD, **cùng nghĩa** |
| Nhìn | `render.3d.view.walk` (đi bộ 1650mm) · `.orbit` | `⇧W` · `O` | `WALK`·`ORBIT` | ⬜ THÊM (id mới) — mode kỹ thuật của viewer đã có |
| Nhìn | `render.3d.view.section` (cắt lớp) | `⇧X` | `SEC` | ⬜ THÊM (id mới) — `sectionPlane()` đã có |
| Chọn | `render.3d.select.samekind` **("Chọn tất cả cùng loại")** | `⇧A` | `SAME` | ⬜ THÊM (id mới) — §4 |
| Chọn | `render.3d.select.storey` (chọn cả tầng) | — | `FLOOR` | ⬜ THÊM (id mới) |
| Hiện | `render.3d.visibility.hide` · `.isolate` · `.showall` | `H` · `⇧H` · `⌥H` | `HIDE`·`ISO`·`SHOWALL` | ⬜ THÊM (id mới) |
| Vật liệu | `render.3d.material.pick` (hút vật liệu, eyedropper) | `⌥`+bấm | `MATPICK` | ⬜ THÊM (id mới) — `lib/cad/eyedropper.ts` đã có bản 2D, dùng lại |
| Sang AI | `render.3d.render.ai` **("Dựng ảnh")** | `⌘⏎` | `RENDER` | ⬜ THÊM (id mới) — §7 |

**Tổng: 10 công cụ + 27 lệnh = 37 `CommandDef` mới trong `lib/commands/registry.ts`.**
`when` dùng đúng parser đã có, không phải sửa: `when('stage==render && mode==3d')`.
`WhenCtx` đã có sẵn `stage`/`mode` (`registry.ts` `WhenCtx`) ⇒ **0 thay đổi cơ chế**, chỉ thêm dữ liệu.

### §2.3 · Cái gì **KHÔNG** vào bộ công cụ (và vì sao)

| Không có | Vì sao | Làm ở đâu |
|---|---|---|
| Cung tròn · đường tròn · spline · polygon trong 3D | hình phẳng phức tạp vẽ ở 2D chính xác hơn, rồi đùn lên | chặng 2D (đã có 19 lệnh vẽ) |
| Offset mặt / Follow-me (SketchUp) | phào chỉ · gờ trần là **thuộc tính phòng** (`skirtingSpecId`), không phải hình học vẽ tay | `RoomEntity` §6 spec nền |
| Boolean (union/subtract) | ô cửa là `door`/`window` có ngữ nghĩa, không phải phép trừ khối | chặng 2D |
| Bo tròn/subdivide/mesh sửa đỉnh | dân nội thất không mô hình hoá đa giác; ghế đẹp thì **nhập glTF** | `render.3d.import.gltf` |
| Vẽ tay tự do trong 3D | không có ràng buộc mm ⇒ trái định vị "đúng thước" | chặng 2D chế độ Sơ phác |

---

## §3 · PUSH/PULL + GIZMO + Ô NHẬP SỐ — ba nguồn, **một hệ**

> Ba thứ này đến từ ba phần mềm khác nhau (SketchUp · 3ds Max · cả hai). Nếu cứ bê nguyên thì
> người dùng phải nhớ **ba luật khác nhau cho cùng một câu hỏi "tôi đang sửa cái gì, bằng số nào"**.
> Chốt dưới đây quy về **một luật ba dòng**.

### §3.1 · Luật cái nào hiện lúc nào

```
① CHỌN VẬT (công cụ Chọn/Di chuyển/Xoay/Co giãn) → hiện GIZMO 3 trục, bám tâm bao của vật
② TRỎ VÀO MẶT (công cụ Kéo mặt)                  → KHÔNG gizmo; sáng viền mặt + mũi tên pháp tuyến
③ BẮT ĐẦU KÉO (bất kỳ ①/②)                       → hiện Ô NHẬP SỐ nổi cạnh con trỏ
```

| Trạng thái | Gizmo | Ô nhập số | Ghi chú |
|---|---|---|---|
| Không chọn gì | ✕ | ✕ | mock ① — chỉ lưới sàn, trục XYZ, ViewCube |
| Chọn 1+ vật, chưa kéo | ✓ (3 trục) | ✕ | mock ② |
| Đang kéo gizmo / đang kéo mặt | ✓ (trục đang kéo **sáng**, 2 trục kia mờ) | ✓ **giá trị sống** | mock ③ — "2 700" |
| Vừa nhả chuột, chưa làm việc khác | ✓ | ✓ (mờ, **vẫn gõ đè được**) | luật VCB SketchUp |
| Bắt đầu thao tác kế | ✓ | ✕ (đóng) | |
| Công cụ vẽ (Tường/Mặt phẳng) đang vẽ dở | ✕ | ✓ (dài · dày) | |

**Một ô, không hai.** Ô nhập số nổi cạnh con trỏ (mock ③ đã duyệt — cần cho tablet vì mắt không
rời điểm chạm), **đồng thời** phản chiếu ở ổ ⑥ Status bar (Trụ 2: một sổ → nhiều mặt hiện).
Người dùng gõ ở đâu cũng được, hai chỗ là **một giá trị**.

### §3.2 · Gõ số lúc đang kéo — áp ra sao

| Gõ | Nghĩa | Nguồn |
|---|---|---|
| `2700` ⏎ | áp giá trị tuyệt đối cho **chiều đang kéo** | `parseVcbToken` → `kind:'value'` ✅ đã có |
| `3x` ⏎ (khi Di chuyển + `⌥` = copy) | nhân bản 3 bản, khoảng cách = khoảng vừa kéo | ✅ `kind:'multiply'` |
| `/3` ⏎ | chia đều 3 phần **giữ nguyên tổng khoảng** | ✅ `kind:'divide'` |
| `2700` ⏎ **sau khi đã nhả chuột** | sửa lại thao tác vừa xong, **không tạo undo mới** (thay thế bước cuối) | luật VCB |
| gõ tiếp lần nữa | lại sửa đè, cho tới khi bắt đầu thao tác kế | luật VCB |
| `Esc` | huỷ, trả về giá trị trước thao tác | |

**Trục quyết định số áp vào đâu:**
- kéo mặt → luôn theo **pháp tuyến mặt**, số = độ dày/cao mới (mm);
- kéo gizmo → theo **trục đang cầm**;
- chưa cầm trục nào mà gõ số → **từ chối + mách một dòng ở Status bar**: *"Chọn trục trước
  (X/Y/Z hoặc kéo tay nắm)."* — không đoán ý (Trụ 3 luật 6: chỉ 3 trigger tất định).
- phím `X`/`Y`/`Z` **khoá trục** trong lúc kéo (chuẩn Blender/Max, rẻ, dân 3D quen tay).

### §3.3 · Đường ghi vào Doc — **đúng hợp đồng 5 bước đã chạy đúng**

Không phát minh lại. Lặp `SPEC-TANG-DU-LIEU-CAU-KIEN` §4.2:

| Bước | Bắt buộc | Đã có ở đâu |
|---|---|---|
| 1 | Trong lúc kéo: **chỉ đổi hiển thị** (`scale.y`/`position`), không đụng Doc | `Scene3DViewer.tsx:255-261` ✅ |
| 2 | Kết thúc: gọi **một** callback `(entityId, giá trị mới)` | `onPushPull` ✅ |
| 3 | Callback ghi Doc qua lệnh **có undo** (`updateEntities`) | `store.ts:501` ✅ |
| 4 | Kẹp biên bằng **hàm dùng chung** | `clampWallHeight` ✅ |
| 5 | Doc đổi ⇒ **derive lại** toàn bộ, không vá view tại chỗ | `docToObjScene` ✅ |

**Việc phải làm:** hôm nay chỉ push/pull đi đúng đường này. Ba thao tác còn lại phải theo **cùng
khuôn**, và gizmo phải thành công cụ thật (H6):

| Thao tác | Ghi vào | Hôm nay |
|---|---|---|
| Kéo mặt tường | `entity.heightMm` | ✅ chạy |
| Di chuyển vật | `BlockEntity.at` | ⬜ chưa (gizmo giả, nhích cứng 100mm) |
| Xoay vật | `BlockEntity.rot` | ⬜ chưa |
| Co giãn | hình học entity | ⬜ chưa |
| Gán vật liệu lên mặt (thùng sơn) | `entity.specId` | ⬜ chưa — **ưu tiên 1**, đây là nút nối 3D vào BOQ |

⚠️ **CHƯA VERIFY:** push/pull hiện chỉ nhận **mặt trên tường** (`worldNormal.y < 0.5 → return`,
`Scene3DViewer.tsx:242`) và kẹp cứng 2-6m. Kéo mặt **sàn/trần/đồ** chưa có đường nào — chưa thử tay.

---

## §4 · CHỌN THEO NGỮ NGHĨA — "Chọn tất cả cùng loại"

### §4.1 · Dữ liệu lấy từ đâu (neo vào §2.2 spec nền)

Đây **không phải thuật toán 3D**. Là một `filter` trên Doc:

| Người dùng chọn | "Cùng loại" nghĩa là | Biểu thức lọc |
|---|---|---|
| một khối **tường** | mọi tường cùng `wallKind` | `e.elementType==='wall' && e.wallKind===x.wallKind` |
| một **ghế** (block nội thất) | mọi block cùng mã sản phẩm | `e.specId===x.specId` (ưu tiên) ‖ `e.block===x.block` |
| một mảng **lớp hoàn thiện** | mọi mảng cùng vật liệu | `e.specId===x.specId` |
| một **sàn** | mọi `slab` cùng `specId` | |
| chọn **cả tầng** | mọi entity cùng `storey` | `e.storey===x.storey` |

**Thứ tự ưu tiên chốt:** `specId` → `elementType`+`wallKind` → `block`.
Lý do: `specId` là **neo thương mại** (spec nền §7) — "hết ghế Ash-01" mới là điều người thiết kế
muốn, không phải "hết vật hình giống nhau". Khi vật chưa gán `specId` thì mới rơi xuống bậc dưới,
và UI phải nói rõ: *"Chọn theo loại khối (chưa gán mã sản phẩm)"* — đúng luật L4 "suy đoán phải lộ mặt".

### §4.2 · Điều kiện tiên quyết — **`entityId` cho MỌI nhóm**

Nay `entityId` **chỉ gán cho nhóm tường** (H7 · spec nền §0.4). Không có nó thì bấm vào ghế trong
3D **không biết đó là entity nào** ⇒ tính năng này không thể tồn tại. Chuỗi phụ thuộc:

```
Đ1 mọi SceneGroup có entityId   ──┐
Đ2 tên nhóm <Loại>_<entityId>     ├─→ chọn được ở 3D ──→ selection ở store ──→ 2D sáng theo
   (bỏ Wall_1, Wall_2… đổi số)    │                                      └──→ "chọn hết cùng loại"
Đ3 selection sống ở useCadStore ──┘
```

`useCadStore.selection` **đã tồn tại** (`store.ts:198`) ⇒ Đ3 gần như miễn phí. Việc thật là Đ1+Đ2
trong `cad-to-obj.ts` (= P2 lộ trình spec nền).

### §4.3 · Hành vi UI

- Nút **"Chọn tất cả cùng loại"** ở panel phải (mock ②) + lệnh `render.3d.select.samekind` (`⇧A`)
  + chuột phải trên vật + ⌘K. Bốn mặt hiện, **một** lệnh (Trụ 2).
- Chọn nhiều → Inspector hiện trường khác nhau bằng `—`, sửa thì áp cho tất cả (Trụ 3 đã chốt).
- Bấm nút → Status bar báo *"Đã chọn 12 vật cùng loại · Sofa ba chỗ (SPEC-…)"*. Có số, không mơ hồ.
- Nút phải **làm mờ, không ẩn** khi không dùng được (luật Ribbon, Trụ 2 — dock/panel giữ chỗ).

---

## §5 · CÂY ĐỐI TƯỢNG THEO TẦNG

### §5.1 · Hình dạng chốt (theo mock đã duyệt)

```
Tầng trệt
 └ Phòng khách        ← RoomEntity.name (§6 spec nền) ‖ suy đoán, gắn cờ nếu chưa có phòng
    ├ Tường Bắc
    ├ Tường Tây
    ├ Sàn gỗ sồi
    ├ Sofa ba chỗ
    └ Bàn trà tròn
 └ Bếp ăn
    ├ Đảo bếp đá
    └ Tủ bếp trên
Tầng lửng
 └ Phòng ngủ chính
```

**Ba bậc: TẦNG › PHÒNG › VẬT.** Nguồn từng bậc:

| Bậc | Nguồn dữ liệu | Có chưa |
|---|---|---|
| Tầng | `entity.storey` (`Base`, `model.ts:151-181`) | ✅ có trong Doc · ❌ **3D chưa đọc** (H7) |
| Phòng | `RoomEntity.name` / `roomId` | ⬜ chưa có — §6 spec nền, chờ duyệt |
| Vật | `SceneGroup.entityId` + tên theo `elementType` | ⬜ chỉ tường có (H7) |

### §5.2 · Việc cần làm — nói thẳng

1. **`docToObjScene()` phải đọc `storey`** và gắn vào từng `SceneGroup`. Hôm nay `grep storey
   lib/three/` = **đúng 1 comment**, 0 dòng code. Không có bước này thì cây tầng không thể có,
   và dropdown lọc tầng đang có ở `CommandPanel.tsx:355-372` **không bao giờ hiện** vì
   `SceneObject.storey` luôn `undefined` (H8).
2. **Entity không có `storey`** → gom vào nhóm `"Chưa xếp tầng"` ở **cuối** cây, kèm nút
   *"Gán tầng cho 23 vật"*. Không im lặng bỏ, không đoán tầng theo cao độ (đoán = L4 vi phạm).
3. **Bậc PHÒNG chờ `RoomEntity`** (§6 spec nền, câu treo §11.2 chưa chốt). Trong lúc chờ: cây
   **hai bậc** TẦNG › VẬT, chạy được ngay, thêm bậc giữa sau **không phá** cấu trúc.
4. **Cấm** đẻ cây riêng cho 3D. Cùng cây đó, 2D dùng lại — đúng "một sổ, nhiều mặt hiện".
5. Mỗi hàng có: tên · ẩn/hiện · khoá/mở (✅ đã có ở `CommandPanel` tab Hiện — **GIỮ**), thêm:
   bấm = chọn (nối `store.selection`), bấm đúp = zoom tới vật.

---

## §6 · PANEL PHẢI TỰ SINH THEO LOẠI ĐỐI TƯỢNG (Trụ 3)

### §6.1 · Nguyên tắc

Panel phải **không được viết tay theo mode**. Mỗi `elementType` khai schema **một lần**
(`defineObject`), panel tự dựng. Trường dùng bộ `subtype` đã chốt ở Trụ 3 (`LENGTH_MM` ·
`AREA_M2` · `MATERIAL_ID` · `MONEY_VND` · `ENUM` · `FACTOR`…) — định dạng số/đơn vị/widget
**quyết định một chỗ**.

### §6.2 · Bảng schema theo loại

| `elementType` | Nhóm Inspector | Trường | Nguồn |
|---|---|---|---|
| **`wall`** | Kích thước | Dài (`LENGTH_MM`, chỉ đọc — hình học) · Dày (`wallThicknessMm`) · **Cao (`heightMm`)** · Cao độ đáy (`elevationMm`) | `Base` |
| | **Cấu tạo** ⭐ | Lớp hoàn thiện (`MATERIAL_ID`, danh sách nhiều lớp) · Ô cửa trên tường (đếm, chỉ đọc, bấm = chọn) · **Chịu lực** (`wallStructural`, công tắc) | mock ② mục "CẤU TẠO" |
| | Tầng | `storey` (`ENUM`) | `Base` |
| | Nguồn | sinh từ bản vẽ nào · còn đồng bộ / đã tách | ✅ `ObjectProperties.tsx` đã có |
| | Hành động | **Chọn tất cả cùng loại** | §4 |
| **`furniture`** | Vị trí | X · Y (`LENGTH_MM`) · Xoay (`ANGLE_DEG`) · Cao độ đáy | `BlockEntity.at`/`.rot` |
| | Sản phẩm | Mã (`specId`) · Hãng · Quy cách · **Đơn giá (`MONEY_VND`, chỉ đọc)** | `ProductSpec` |
| | Vật liệu | quả cầu + `matId` (`MATERIAL_ID`) | `MaterialSphere` ✅ |
| | Hành động | Chọn tất cả cùng loại · Thay bằng vật khác trong Thư viện | |
| **`covering`** (lớp hoàn thiện) ⚠️ chờ NC-11 | Diện tích | `AREA_M2` (chỉ đọc, tính từ biên) | derive |
| | Vật liệu | `specId` + quả cầu + **tiling size (mm)** ⚠️ bắt buộc | `MaterialDef.pbr` |
| | Khối lượng | m² × đơn giá × hao hụt = **Thành tiền** (`MONEY_VND`, nhấn mạnh) | `lib/boq/compute.ts` ✅ |
| | Dán lên | mặt nào (trần · sàn · ốp tường) | `elevationMm` + pháp tuyến |
| **`slab`** | Kích thước | Dày (`thicknessMm`) · Cao độ | §2.4 spec nền (field mới) |
| | Vật liệu · Khối lượng | như `covering` | |
| **`space`** (phòng) | Thông tin | Tên · Công năng (`roomKind`) · Diện tích (`AREA_M2`) · Cao trần (`ceilingHeightMm`) | `RoomEntity` §6 spec nền |
| | Hoàn thiện | Sàn · Trần · Phào (3 ô `MATERIAL_ID`) | |
| **camera** | Ống kính (mm) · Tầm mắt (mặc định **1650**) · Khung (`ENUM` 16:9…) | ✅ tab Camera đã có | `lib/three/camera.ts` |
| **không chọn gì** | — | mock ① — panel trống, **có mách nước một dòng** | `SPEC-NGON-NGU-CHI-DAN` |

### §6.3 · Ba luật của panel phải

1. **`—` cho giá trị khác nhau** khi chọn nhiều; sửa thì áp hết (Trụ 3).
2. **Sửa ở đây = tách khỏi bản vẽ** — cảnh báo icon xích đứt **TRƯỚC** khi sửa, không phải sau khi
   lỡ tay. ✅ **ĐÃ CÓ** (`ObjectProperties.tsx:75-85`) — **GIỮ NGUYÊN**, nhân ra cho mọi loại.
3. **Suy đoán phải lộ mặt** (L4): entity chưa có `elementType` → badge *"suy đoán"* + nút
   *"Xác nhận là tường"* ghi thẳng vào Doc. Đây là đường backfill tự nhiên cho `.idf` cũ (P4).

---

## §7 · NÚT SANG RENDER AI — đặt đâu, mang gì

### §7.1 · Đặt đâu

**Nút "Dựng ảnh" tím nổi, trong viewport, góc phải-dưới**, ngay trên `ModeSwitchBar`.
Không giấu vào menu. Lý do (ghi để phiên sau khỏi hỏi lại): `CHOT-TEN-CHANG-MODE` §5 —
*"CẢ 3 (SketchUp/Max/Revit) không cái nào có: 1 nút sang render AI ngay tại viewport"* — **đây là
chỗ IF thắng**. Giấu nó đi = tự bỏ moat.

- Phím tắt `⌘⏎` · lệnh `render.3d.render.ai` · ⌘K tìm được · chuột phải trong viewport.
- **Làm mờ, không ẩn** khi cảnh rỗng, tooltip: *"Chưa có khối nào để dựng ảnh."* (luật Ribbon).

### §7.2 · Mang theo dữ liệu gì

Đọc `SPEC-DUNG-PIPELINE-RENDER-AI.md` (cùng vai, 04/08) — **hai cầu nối tất định đã tồn tại**,
dùng lại, **cấm đẻ đường thứ ba**:

| Thứ mang theo | Lấy từ | Đã có |
|---|---|---|
| Khối 3D (OBJ/MTL + `_scene3d` + thống kê) | `three.cad2fbx` node — `execute()` đọc **thẳng `useCadStore.doc`** | ✅ `render-v2.ts:243-290` |
| Góc máy hiện tại → JSON camera + mẩu prompt | `three.camera` node (`presetCamera`/`parseCameraSpec`/`placeCamera`) | ✅ `render-v2.ts:202-228` |
| **Ảnh clay** của đúng khung đang nhìn | `captureFrame(scene, spec, out)` → dataURL | ✅ `lib/three/capture.ts:166` |
| Tuỳ chọn cảnh (cao tường · trần · theme · palette) | `_sceneOpts` | ✅ `render-v2.ts:288` |
| **Gu** người dùng | `fetchGuProfile(['ref-render'])` | ✅ `lib/gu` |

**Hành vi chốt khi bấm:** gạt sang mode `node` **trong cùng chặng** (không chuyển chặng, không mất
ngữ cảnh) và **dựng sẵn một chuỗi 3 node**, đặt cạnh nhau, đã nối dây, **chưa chạy**:

```
three.camera (góc đang nhìn)  →  three.cad2fbx (khối từ Doc)  →  ai.clay2render (4 credit)
```

Người dùng thấy **chuỗi mình hiểu được**, sửa được, bấm ▶ mới trừ credit.
**Cấm** kiểu "bấm là ra ảnh" giấu pipeline — trái toàn bộ triết lý bảng node đã dựng, và trái
luật trừ-credit-trước (`SPEC-DUNG-PIPELINE-RENDER-AI` §4.1: trừ **trước** khi gọi AI).

**Không mang theo:** ảnh snapshot chết dán vào Trình bày (đó là bệnh §0.6 spec nền), bản sao Doc,
"model 3D riêng" — vi phạm L1/L6.

⚠️ **CHƯA VERIFY:** chưa có hàm dựng-sẵn-node-graph từ ngoài (`addNodes` với dây nối sẵn) —
chưa grep `useFlowStore` đủ sâu. PHU/G4 kiểm trước khi ước lượng.

---

## §8 · §0c BA MẢNG — ĐỦ CẢ BA, KHÔNG SÓT

### §8.1 · Bảng phím tắt mode 3D (khai vào `lib/shortcuts.ts` scope `render`, nhóm "3D")

Hôm nay scope `render` có **8 phím, toàn của bảng node** — **0 phím cho 3D** (H11).

| Phím | Việc | Nhóm |
|---|---|---|
| `V` | Chọn | Công cụ |
| `P` | Kéo mặt (push/pull) | Công cụ |
| `M` · `Q` · `S` | Di chuyển · Xoay · Co giãn | Công cụ |
| `W` · `R` | Tường · Mặt phẳng/sàn | Công cụ |
| `B` | Thùng sơn (gán vật liệu) — **⇒ Navigator đổi sang `⇧B` trong mode 3D** | Công cụ |
| `T` | Thước dây / đường gióng | Công cụ |
| `C` | Đặt máy | Công cụ |
| `X` · `Y` · `Z` | Khoá trục **trong lúc kéo** | Nhập số |
| `0-9` `.` `,` ⏎ | Mở ô nhập số + áp giá trị | Nhập số |
| `3x` `/3` ⏎ | Nhân bản N · chia đều N | Nhập số |
| `Esc` | Huỷ thao tác, về Chọn | Nhập số |
| `1`-`5` | ViewCube: Trên · Dưới · Trái · Phải · Trước | Nhìn |
| `F` | Vừa khung (**cùng phím, cùng nghĩa với CAD**) | Nhìn |
| `O` · `⇧W` · `⇧X` | Orbit · Đi bộ (1650mm) · Cắt lớp | Nhìn |
| `H` · `⇧H` · `⌥H` | Ẩn · Cô lập · Hiện lại tất cả | Hiện |
| `⇧A` | Chọn tất cả cùng loại | Chọn |
| `⌘D` | Nhân bản | Sửa |
| `Delete` | Xoá | Sửa |
| `⌘Z` · `⌘⇧Z` | Hoàn tác · Làm lại (dùng chung store CAD) | Sửa |
| `⌘⏎` | **Dựng ảnh** (sang render AI) | AI |
| `⇧B` · `⇧I` · `⌘\` | Thu Navigator · Thu Inspector · Zen | Panel |

**Nghiệm thu §0c mục 1:** mỗi phím có tooltip hiện phím · Tab đi được bằng `:focus-visible` ·
⌘K tìm ra **mọi** lệnh ở §2.

### §8.2 · Lệnh gọi được từ ⌘K

**Điều kiện tiên quyết:** ⌘K hiện **chưa tới chặng 3D** (H10 — nhãn tự khai *"chỉ hoạt động ở
Trang chủ/màn hình Ý tưởng"*). Việc: `AppCommandPalette` đọc `cmdsFor({stage:'render', mode:'3d'})`.

Vì Trụ 2 khai **một lần → sáu mặt hiện**, danh sách ⌘K **không viết tay**: chính là 37 `CommandDef`
ở §2.1+§2.2 có `surfaces` chứa `'palette'`. Thêm:

| Loại | Ví dụ hiện trong ⌘K |
|---|---|
| Công cụ | "Kéo mặt", "Thùng sơn", "Thước dây" |
| Nhìn | "Nhìn từ trên", "Đi bộ trong nhà", "Cắt lớp" |
| Chọn | "Chọn tất cả cùng loại", "Chọn cả tầng trệt" |
| Hiện | "Ẩn vật đang chọn", "Hiện lại tất cả" |
| Vật liệu | "Gán vật liệu…", "Hút vật liệu từ mặt" |
| AI | **"Dựng ảnh"** |
| Đi lại | "Sang bảng dựng (Node)", "Về bản vẽ 2D" |

**Luật ẩn/mờ (Trụ 2, khác nhau theo mặt):** ⌘K/chuột phải/gõ lệnh → **ẩn** bằng `when`;
dock/panel → **làm mờ giữ chỗ**. Không được làm ngược.

### §8.3 · UI cảm ứng — **mọi thao tác có đường chạm**

Token `--tap:44px`/`--row:44px` tự bật qua `(hover:none) and (pointer:coarse)` ✅ **đã có**
(`globals.css:60-68`). Cấm chức năng chỉ-hover / chỉ-chuột-phải (`SPEC-HOVER-FOCUS-IDF` §3.7 dòng 41).

| Thao tác | Chuột | **Đường chạm tương đương** |
|---|---|---|
| Chọn vật | bấm | chạm (vùng chạm ≥44px, raycast nới dung sai — SPEC-CAD-MODES §3 "snap dung sai lớn") |
| Chọn nhiều | `⇧`+bấm | chạm nút **"+ Chọn thêm"** hiện sẵn ở toolbelt (không giấu sau phím) |
| Xoay quanh (orbit) | chuột giữa kéo | **1 ngón kéo** trên vùng trống |
| Kéo màn (pan) | `Space`+kéo / chuột giữa | **2 ngón kéo** |
| Zoom | lăn | **2 ngón chụm** |
| **Kéo mặt** | trỏ mặt + kéo | chạm mặt (mặt sáng viền + **tay nắm mũi tên ≥44px** hiện sẵn) → kéo tay nắm |
| **Kéo gizmo** | kéo trục | tay nắm trục ≥44px, khoảng cách giữa 3 trục ≥12px, **không chồng nhau** |
| **Nhập số** | gõ | nút **`123`** cạnh tay nắm → mở bàn phím số (không chờ bàn phím cứng) |
| Khoá trục | phím `X/Y/Z` | 3 chip `X`·`Y`·`Z` cạnh ô số, chạm để khoá |
| Chuột phải trên vật | menu ngữ cảnh | **bấm giữ 400ms** → radial menu quanh ngón (SPEC-CAD-MODES §3) |
| Ẩn / khoá vật | icon hover trong cây | icon **hiện sẵn** trong hàng ✅ đã đúng (`CommandPanel` tab Hiện) |
| Hoàn tác / Làm lại | `⌘Z` | **2 ngón chạm** = undo · **3 ngón chạm** = redo (SPEC-CAD-MODES §3) |
| Đổi hướng nhìn | ViewCube bấm | ✅ đã bấm được; 2 nút TRƯỚC/DƯỚI **đã để nút chữ, không giấu hover** — **GIỮ** |
| Dựng ảnh | `⌘⏎` | nút tím nổi luôn thấy ✅ |

**Bút (tablet):** chống tì tay (palm rejection) — trong 3D chỉ cần mức tối thiểu: **ngón ≠ bút**
(bút = vẽ/kéo, ngón = xoay/pan). Đây là hạng mục SỐNG, không phải "để sau" (§0c).
⚠️ **CHƯA VERIFY:** chưa đọc `AUDIT-GESTURES-INPUT.md` trong phiên này — G4 đối chiếu trước khi dựng
để không làm lệch cử chỉ đã có ở chặng 2D.

---

## §9 · CÁI GÌ **KHÔNG LÀM** — ghi lý do để phiên sau không đề xuất lại

| Không làm | Đến từ | **Lý do (đọc rồi đừng hỏi lại)** |
|---|---|---|
| **Modifier stack** (Max) | 3ds Max | Ngăn xếp biến đổi có thứ tự, sửa được từng bậc — mạnh cho VFX, **vô nghĩa với nội thất**: người ta cần "tường cao 2700", không cần "Bend rồi Taper rồi Noise". Thêm vào = mỗi vật có một cây lịch sử phải học + phải hiển thị + phải undo riêng. `CHOT-TEN-CHANG-MODE` §5 đã ghi "KHÔNG lấy". |
| **Family Editor** (Revit) | Revit | Trình soạn cấu kiện tham số riêng, là **một app trong app** — đúng thứ Hoà cấm ("đã đủ rối rồi"). Nhu cầu thật (ghế này rộng 600 hay 650) giải bằng **`ProductSpec` + Thư viện**, rẻ hơn 100 lần. |
| **Layout / Scene** (SketchUp) | SketchUp | Layout = xuất hồ sơ giấy → **đã là chặng 2D + chặng Trình bày**. Scene (lưu góc nhìn) → **đã có `campath` + preset camera**. Làm ở đây = lặp chức năng ở ba chỗ, trái luật ba-ống-kính. |
| **Mode con trong 3D** | — | Hoà chốt trực tiếp 03/08. Ai đề xuất "mode dựng khối" / "mode vật liệu" / "mode camera" là chưa đọc `CHOT-TEN-CHANG-MODE` §5. Năm tab của CommandPanel **không phải mode** — chúng không đổi canvas, không đổi sổ lệnh, không đổi kệ. |
| **Cấu kiện / BIM ở 3D** | — | *"cấu kiện ở chặng 1"*. 3D **đọc** `elementType`, không cho **khai** `elementType` (trừ nút "Xác nhận là tường" của đường suy đoán §6.3 — đó là backfill, không phải soạn cấu kiện). |
| **PBR bật mặc định** | — | `SPEC-3D-CORE` §2 chốt "xám trơn". Vật liệu ở 3D = gán `specId` + xem quả cầu; ảnh đẹp là việc của render AI/D5. PBR là **chế độ bật**, không phải mặc định. |
| **Engine 3D thứ hai / viết lại viewer** | — | `Scene3DViewer` 5 mode đang chạy (§0.1). Đập = 🔴 tự động theo §0d. |
| **Cây đối tượng riêng cho 3D** | — | Cùng cây với 2D (§5.4). Hai cây = hai định nghĩa "vật" = đúng bệnh L3 đang phải chữa. |
| **Đồng bộ / xuất-nhập giữa 2D và 3D** | — | L6. Ai viết hàm tên `syncDocToScene` là sai từ gốc. |
| **Bấm-là-ra-ảnh** (giấu pipeline) | — | §7.2 — trái luật trừ credit trước, và giết giá trị của bảng node đã dựng. |

---

## §10 · LỘ TRÌNH — phiếu cho code (theo thứ tự, **không nhảy cóc**)

| # | Việc | Ai | Chặn bởi | Ghi chú |
|---|---|---|---|---|
| **D0** | Nối §9 lộ trình spec nền: **P0-P2** (verify khuyết SOLID · `inferElementType` · `entityId` mọi nhóm + đọc `elementType`) | PHU | — | **Không có D0 thì §4 và §5 không thể tồn tại.** Bắt đầu từ đây. |
| **D1** | `docToObjScene` đọc **`storey`** → `SceneGroup.storey` | PHU | D0 | Mở khoá cây tầng (§5) + dropdown đang chết (H8) |
| **D2** | Thêm **37 `CommandDef`** `render.3d.*` vào `registry.ts` (§2.1+§2.2). **Giữ nguyên 17 id đã có trong `CommandPanel.tsx`** | PHU | — | Chạy song song D0/D1. `when('stage==render && mode==3d')` — 0 sửa parser |
| **D3** | `findByAlias(raw, ctx)` nhận `WhenCtx`, lọc `when` trước khi tra (H2) + test va alias CAD↔3D | PHU | D2 | **Bug thật, phải vá trước khi 3D có alias trùng chữ** |
| **D4** | `defineMode()` thật + hợp nhất `ModeConfig` (H3·H4) + gọi ở nơi mount | CHINH | — | Trụ 4 mới chỉ có trên giấy |
| **D5** | Va phím: `needShift` mở rộng cho mode 3D (`AppShell.tsx:126`) | CHINH | D4 | 1 dòng, mở khoá cả bộ phím công cụ |
| **D6** | ⌘K đọc `cmdsFor()` ở chặng render (H10) + `SHORTCUTS` thêm nhóm "3D" (H11) | CHINH | D2 | §8.1+§8.2 |
| **D7** | **Gizmo thật**: bám vật · kéo được · khoá trục X/Y/Z · nhả chuột ghi Doc 1 lần (thay SVG nhích-100mm, H6) | G4 | D0 | Theo hợp đồng 5 bước §3.3 |
| **D8** | **Ô nhập số VCB** trong viewport (§3.1-§3.2), dùng `parseVcbToken` đã có, phản chiếu ở Status bar | G4 | D7 | Không viết parser mới |
| **D9** | Hợp nhất 2 CommandPanel (H5, M3) + mount `ObjectProperties` vào ổ ④ | G4 | D4 | Đang có 415 dòng code tốt **không ai dùng** |
| **D10** | Cây TẦNG › VẬT ở tab Hiện + nhóm "Chưa xếp tầng" + nút gán tầng hàng loạt | G4 | D1 | Bậc PHÒNG thêm sau, không phá cấu trúc |
| **D11** | **Thùng sơn** — gán `specId` lên mặt, ghi ngược có undo | PHU+G4 | D0 | Vòng khép kín đầu tiên 3D→BOQ (= P6 spec nền) |
| **D12** | "Chọn tất cả cùng loại" (§4) — lọc trên Doc, 4 mặt hiện | G4 | D0·D2 | Gần như miễn phí sau D0 |
| **D13** | Inspector tự sinh theo schema §6.2 | G4 | D9 | Trụ 3 |
| **D14** | Nút **"Dựng ảnh"** + dựng sẵn chuỗi 3 node (§7.2) | G4 | D2 | ⚠️ verify `addNodes` trước |
| **D15** | Đường chạm §8.3 (tay nắm 44px · nút `123` · radial bấm-giữ · 2/3 ngón undo-redo) | G4 | D7·D8 | §0c mục 3 — **thiếu = 🔴 chưa xong** |

---

## §11 · TREO — cần TỔNG/Hoà chốt

| # | Câu hỏi | Chặn |
|---|---|---|
| 1 | Phím `B` = thùng sơn (SketchUp/D5 muscle memory) **đổi Navigator sang `⇧B` trong mode 3D** — chấp nhận không? Phương án B: bỏ `B`, thùng sơn chỉ có nút + `PAINT` gõ tay (mất muscle memory). | §2.1 · D5 |
| 2 | Cây đối tượng: chạy **2 bậc (Tầng › Vật)** ngay, hay **chờ `RoomEntity`** để ra đủ 3 bậc như mock? Tôi nghiêng: chạy 2 bậc trước. | §5.2 · D10 |
| 3 | `'covering'` vào `ElementType` — vẫn chờ NC-11 (câu treo §11.1 spec nền, chưa về). Panel `covering` ở §6.2 **chưa code được** cho tới lúc đó. | §6.2 |
| 4 | Tên token trục: code dùng `--ax-*` (hex cứng trong `ve3d-css.ts`), spec `SPEC-VE-INFERENCE` gọi `--axis-*`. Chốt **một** tên + đưa vào design system 2 theme (việc COWORK-UI mục 0). | H12 |
| 5 | Kéo mặt hiện chỉ nhận **mặt trên tường**, kẹp 2-6m. Mở cho sàn/trần/đồ ở bước nào? | §3.3 |

---

## §12 · ĐÍNH CHÍNH / GHI DẤU (§0d — không đập, chỉ ghi)

| Chỗ | Đính chính |
|---|---|
| `lib/shell/mode-registry.ts` docstring | Ghi *"mới đăng ký mode `cad` làm mẫu (CadStageScreen gọi `getMode('cad')`)"* — **sai**: grep 04/08 cho 0 lời gọi `defineMode(`/`getMode(` ngoài chính file định nghĩa. Đề nghị sửa docstring khi làm D4. |
| `lib/three/mode-render-3d.ts` | TODO ghi *"`defineMode()` CHƯA tồn tại"* — **nay đã tồn tại** (`lib/shell/mode-registry.ts`), chỉ chưa ai gọi. Cập nhật khi làm D4. |
| `components/three/CommandPanel.tsx` · `ObjectProperties.tsx` | 592 dòng code **đúng spec, chất lượng tốt, chưa mount ở đâu**. Ghi vào `SO-KIEM-TONG` §1 để không ai tưởng là mất/thừa mà xoá. |
| `SPEC-CHANG2-UI-2MODE.md` | Tên "2MODE" vẫn sai theo VÒNG CUỐI (đã nêu ở §12 spec nền, **chưa ai chèn dòng đính chính**). Nhắc lại. |

---
*COWORK-DỰNG soạn 04/08/2026. Nền: `SPEC-TANG-DU-LIEU-CAU-KIEN.md` (§2.2 · §4.2 · §8) ·
`SPEC-HA-TANG-UI-IF.md` (4 trụ) · `SPEC-DUNG-PIPELINE-RENDER-AI.md` (§7).
Mọi con số/dòng code trong §0 đọc trực tiếp từ repo 04/08; chỗ chưa chạy tay ghi "CHƯA VERIFY".*
