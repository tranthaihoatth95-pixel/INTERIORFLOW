# SPEC · HẠ TẦNG UI IF — CƠ CHẾ MỘT KHUNG, NHIỀU EDITOR
**Ngày:** 03/08/2026 · **Trạng thái:** CHỐT · **Tầng:** T1 lõi (sửa phải qua Hoà)
**Thay thế phần UI-shell của:** `SPEC-NAVIGATION-MODEL` §2 · `SPEC-MODE-PER-STAGE` §1 · `SPEC-CAD-SHELL-V3`

> Hoà 03/08: *"app xuyên chặng (nhiều app trong một app) — hãy nghĩ một cơ chế thông minh, tool editor thông minh."*

## 0 · Bài toán
IF có **10 editor con**: Vẽ(Phác thảo · Chuyên · Revit) · Dựng ảnh(Bảng dựng · Vẽ 3D) · Trình bày(Deck · Bảng vật liệu · BOQ · Văn bản · Video).
Nếu mỗi cái tự viết UI → 10 lần code, 10 lần học, không bảo trì nổi. Cần **một cơ chế**.

## 1 · Nghiên cứu — ai đã giải bài này

| Hệ | Cách giải | Điều học được | Điều tránh |
|---|---|---|---|
| **Blender** Workspaces + Editor Types | Area = ô không gian, Editor = chức năng; **"mọi Area chứa được mọi Editor"**. Một Scene/View Layer duy nhất mỗi cửa sổ — editor chỉ là *bản chiếu*. | **Ổ cố định, ruột thay đổi**: tab "Object Data" giữ nguyên tên + vị trí, chỉ đổi icon + nội dung theo loại vật. | Kéo góc chia/gộp ô = lỗi bị kêu nhiều nhất; keymap theo vị trí chuột = bẫy được ghi ngay trong manual. |
| **Affinity** Personas + StudioLink | Đổi Persona = đổi toàn bộ tool + panel + menu, **tài liệu giữ nguyên**. | **Assistant Manager**: có *chính sách rõ ràng* khi dùng công cụ của persona A lên dữ liệu của persona B (tự tạo lớp mới / tự rasterize / không làm gì) — báo cho người dùng biết, cho tắt. | Người dùng kêu *"như đang dùng app khác"* — đổi hết thì mất trí nhớ không gian. 4 điều kiện ẩn quyết định persona có bật được không. |
| **VS Code** Contribution Points | Lệnh khai **một lần** (`contributes.commands`), rồi mỗi mặt hiện chỉ là **một dòng JSON** trỏ vào `command id` + `when`. | `enablement` = **làm mờ**; `when` = **ẩn**. Hai thứ khác nhau, dùng đúng chỗ. | — |
| **Microsoft Ribbon** | Contextual tabs *lộ thêm* khi chọn vật. | *"KHÔNG ẩn lệnh không dùng được — làm layout nhảy, mất ổn định."* Auto-chuyển tab chỉ với **đúng 3 trigger** tất định. | — |
| **Office Personalized Menus** | Tự sắp xếp lại menu theo tần suất | — | **Đã bị giết 2006.** Findlater CHI 2004 đo được: adaptive **331s** vs static **306s** (chậm hơn), **56%** người thấy khó chịu nhất. Adaptable (người dùng tự chỉnh) mới thắng: 55% thích nhất. |
| **Unity · Unreal · Blender** property panel | Panel **tự sinh từ schema** + metadata (`[Range]`, `meta=(ClampMin)`, `subtype=DISTANCE`) | **Cửa thoát phân bậc, không nhị phân**: override 1 trường → 1 nhóm → cả panel. | Ép schema thuần cho mọi thứ thì gãy ở widget lạ & trường có điều kiện. |

---

# 2 · CƠ CHẾ IF — bốn trụ

## Trụ 1 · KHUNG BẤT BIẾN, SÁU Ổ CẮM
Không editor nào được vẽ ngoài ổ của nó. Vị trí và kích thước ổ **không bao giờ nhúc nhích** khi đổi chặng/mode.

```
┌─ ① HEADER 42px ── logo · tên dự án · 3 chặng · chia sẻ ─────────┐
├─② NAVIGATOR─┬─── ③ STAGE (canvas) ──────────┬─④ INSPECTOR 236 ─┤
│  214px      │                               │  chỉ khi CÓ CHỌN │
│  danh sách  │      ⑤ TOOLBELT (dock kính)   │                  │
│  có section │                               │                  │
├─────────────┴───────────────────────────────┴──────────────────┤
│ ⑥ STATUS 26px ── gõ lệnh · tỉ lệ · Vitals · đã lưu            │
└────────────────────────────────────────────────────────────────┘
```

| Ổ | Hình thái BẮT BUỘC | Được đổi |
|---|---|---|
| ① Header | logo · tên · segmented · 2 nút | không đổi gì cả |
| ② Navigator | **danh sách phân cấp, có section tiêu đề + số đếm** | nội dung + đỉnh (Layer State / phương án / bộ hồ sơ) |
| ③ Stage | vùng vẽ chiếm hết chỗ còn lại | kiểu canvas (lưới · node · viewport 3D · trang giấy · bảng tính · timeline) |
| ④ Inspector | **nhóm trường có tiêu đề in hoa** | trường (tự sinh, §Trụ 3) |
| ⑤ Toolbelt | dock kính nổi: ≤8 công cụ + `⋯` + công tắc | tập lệnh (tự sinh, §Trụ 2) |
| ⑥ Status | gõ lệnh trái · số liệu phải | chữ |

**Luật A (Blender + Affinity):** *một tài liệu `.idf` là bất biến; mọi editor chỉ là bản chiếu.* Đổi mode **không được** đụng dữ liệu.
**Luật B (chống bệnh Affinity "như app khác"):** đáy Navigator — avatar · Cài đặt · Thư viện — **y hệt ở mọi chặng mọi mode**. Đó là điểm neo trí nhớ.

## Trụ 2 · MỘT SỔ LỆNH → SÁU MẶT HIỆN
Mỗi lệnh khai **một lần** trong `lib/commands/registry.ts`:

```ts
{ id:'cad.draw.line', label:['Đường','Line'], icon:LineIcon,
  key:'L', aliases:['L','LINE'],
  when:'stage==cad && mode!=revit',        // bối cảnh
  group:'draw@2',                          // nhóm + thứ tự
  surfaces:['dock','palette','contextmenu'],
  run:(ctx)=>ctx.tool.activate('line') }
```

Sáu mặt hiện ra **tự động**, không code lại lần nào:
`dock` · `popover ⋯` · `menu chuột phải` · `phím tắt` · `gõ lệnh ở status bar` · `câu lệnh tiếng Việt qua LLM` (LLM chỉ cần ánh xạ câu nói → `id`, đúng `SEMANTIC-MODEL §8`).

**Luật ẩn/mờ — khác nhau theo mặt** *(Microsoft vs VS Code, cả hai đều đúng ở chỗ của mình)*:

| Mặt | Lệnh không dùng được thì | Vì sao |
|---|---|---|
| **Dock** (hình học cố định) | **LÀM MỜ**, giữ nguyên chỗ | Ẩn → layout nhảy → mất ổn định. Luật Ribbon. |
| Chuột phải · palette · gõ lệnh (không có trí nhớ không gian) | **ẨN** bằng `when` | Tránh menu đầy mục chết. Luật VS Code. |

**Luật `⋯`:** lệnh vào dock hay vào popover quyết định bằng **tên nhóm**, không phải code — `group:'draw@2'` vào dock, `group:'more@*'` vào `⋯`. Giống hệt cách VS Code dùng `navigation` để tách toolbar khỏi overflow.

## Trụ 3 · INSPECTOR TỰ SINH TỪ SCHEMA
Mỗi loại đối tượng khai schema **một lần**, panel tự dựng:

```ts
defineObject('cad.room', {
  groups:[
    { label:'Kích thước', fields:[
      {k:'w', label:'R', subtype:'LENGTH_MM'},
      {k:'h', label:'C', subtype:'LENGTH_MM'} ]},
    { label:'Vật liệu sàn', fields:[{k:'matId', subtype:'MATERIAL_ID'}] },
    { label:'Khối lượng', fields:[
      {k:'area', subtype:'AREA_M2', readonly:true},
      {k:'total', subtype:'MONEY_VND', readonly:true, emphasis:true} ]}
  ]})
```

**Bộ `subtype` — nguồn của mọi cách hiển thị** *(học từ Blender RNA subtype)*:
`LENGTH_MM` (ô số đơn cách nghìn `5 200`) · `AREA_M2` · `ANGLE_DEG` · `FACTOR` (thanh trượt 0–1) · `MONEY_VND` (`32 287 500 ₫`) · `MATERIAL_ID` (ô swatch + mã, bấm mở Thư viện) · `LAYER_REF` · `COLOR` · `ENUM` · `TEXT` · `IMAGE_REF`.
→ Định dạng số, đơn vị, kiểu widget, căn phải — **quyết định một chỗ**, không rải rác.

**Cửa thoát phân bậc** *(bài học chung của Unity/Unreal/Blender — quan trọng nhất)*:
1. đổi 1 **trường** → truyền `render` riêng cho trường đó
2. đổi 1 **nhóm** → thay component của nhóm
3. đổi **cả panel** → khai `customPanel`
Không bao giờ phải bỏ hết để sửa một chỗ.

**Chọn nhiều:** trường có giá trị khác nhau hiển thị `—`, sửa thì áp cho tất cả. Luật chung của cả Unity lẫn Unreal.

## Trụ 4 · MODE = BỐN KHAI BÁO, KHÔNG PHẢI APP RIÊNG
```ts
defineMode('render.3d', {
  stage:'render', label:['Vẽ 3D','3D'],
  navigator:'CommandPanel',      // ổ ②
  canvas:'Viewport3D',           // ổ ③
  shelves:['material','camera','massing'],  // kệ Thư viện
  commands:'render.3d.*'         // lát cắt sổ lệnh
})
```
Mode **chỉ được** khai 4 thứ đó. Cấm mang state ẩn — đây đúng bài học Blender: workspace của họ chỉ mang 3 side-effect có chủ đích (Pin Scene · Mode · Filter Add-ons), và cái tham vọng "workspace giữ mode" đã bị **rút lại** vì gây lệch.

**Chính sách thao tác chéo mode** *(học Assistant Manager của Affinity — ý hay nhất trong cả hai hệ)*:
Khi dùng công cụ của mode A lên dữ liệu của mode B, **không cấm, không im lặng** — tự làm bước chuyển đổi + báo một dòng + cho tắt lời nhắc:

| Tình huống | IF làm |
|---|---|
| Vẽ 2D lên khối 3D | tạo mặt cắt mới tại cao độ đang xem, vẽ vào đó, báo *"Đã tạo mặt cắt +900"* |
| Gán vật liệu D5 cho vật vẽ ở chế độ Phác thảo | gán qua `matId`, báo *"Vật liệu lưu theo mã chung, đổi engine vẫn giữ"* |
| Kéo khối Revit sang chế độ Chuyên | giữ tham số, hiện thêm *"Cấu kiện — sửa tham số ở Inspector"* |
| Kéo ảnh render vào trang Trình bày | tạo liên kết sống, báo *"Đổi ở Dựng ảnh sẽ tự cập nhật"* |

---

# 3 · LUẬT CHỐNG RỐI — có bằng chứng, không cãi

1. **Đổi bằng LỘ RA, không SẮP XẾP LẠI.** Contextual tab thêm mặt mới; adaptive menu xáo mặt cũ. Cái sau đã chết.
2. **CẤM tự sắp xếp lại theo tần suất dùng.** Findlater CHI 2004: adaptive 331s vs static 306s, 56% thấy khó chịu nhất. Office giết Personalized Menus 01/2006.
3. **Người dùng tự chỉnh thì được** *(adaptable ≠ adaptive)*: 55% thích nhất, và layout họ tự sắp đạt chất lượng ngang bản tối ưu do chuyên gia đặt. → IF cho ghim lệnh vào dock, ẩn nhóm trong Inspector. **Máy không tự đổi.**
4. **Ổ cố định, ruột thay đổi.** Không có ngoại lệ.
5. **Mọi lệnh phải có ít nhất một mặt NHÌN THẤY.** Gõ lệnh và palette là *lối tắt*, không phải đường duy nhất — nếu không thì thành "knowledge in the head".
6. **Tự chuyển bối cảnh chỉ với ít trigger tất định.** IF có đúng 3: chọn vật → Inspector hiện · đổi chặng → về mode ghi nhớ lần cuối · mở tệp `.idf` từ Revit → vào mode Revit. Không có trigger đoán ý thứ tư.
7. **Nhớ lựa chọn tay, không tự đảo ngược.** Người dùng thu sidebar rồi thì phóng cửa sổ **không** tự mở lại.

---

# 4 · SUY RA — 10 editor chỉ còn 10 khai báo

| Editor | navigator | canvas | kệ Thư viện |
|---|---|---|---|
| Vẽ · Phác thảo | Lớp | Lưới 2D (bút, cử chỉ) | ký hiệu · template phòng |
| Vẽ · Chuyên | Lớp | Lưới 2D (chuột, gõ lệnh) | + template bản vẽ · hatch |
| Vẽ · Revit | **Cây cấu kiện** | Lưới 2D + cấu tạo lớp | + thư viện cấu kiện |
| Dựng · Bảng dựng | Khối (Nguồn·Xử lý·Bảng·Xuất) | Node graph | vật liệu · preset · moodboard |
| Dựng · Vẽ 3D | **Command Panel** (Tạo·Sửa·Vật liệu·Camera·Hiện) | **Viewport 3D** (ViewCube · gizmo · massing xám) | vật liệu V-Ray/D5/IF · camera |
| Trình bày · Deck | Trang | Trang giấy | mẫu trang |
| Trình bày · Bảng vật liệu | Nhóm vật liệu | Lưới A3 | bảng A3 |
| Trình bày · BOQ | Hạng mục | **Bảng tính** | biểu mẫu dự toán |
| Trình bày · Văn bản | Mục lục | **Trang văn bản** | mẫu song ngữ |
| Trình bày · Video | Lớp timeline | **Timeline** + khung xem | mẫu video · nhạc |

Mỗi dòng = **một `defineMode`**, không phải một app.

---

# 5 · THỨ TỰ THI CÔNG
| # | Việc | Ghi chú |
|---|---|---|
| 1 | `<AppShell>` 6 ổ + `defineMode` registry | thay `StageShell` hiện tại, giữ nguyên API slot |
| 2 | Sổ lệnh — gom `lib/cad/commands.ts` + `command-aliases.ts` thành `lib/commands/registry.ts` | tài sản đã có, chỉ gom |
| 3 | Inspector tự sinh + bộ `subtype` | thay 3 inspector viết tay |
| 4 | Chuyển 3 mode đã có (Phác thảo · Chuyên · Bảng dựng) sang khai báo | không thêm tính năng, chỉ đổi cách khai |
| 5 | Mode mới: Revit · Vẽ 3D · 5 loại hồ sơ | lúc này mỗi cái ≈ 1 file khai báo + 1 canvas |

---
**Nguồn:** [Blender Workspaces](https://docs.blender.org/manual/en/latest/interface/window_system/workspaces.html) · [Blender HIG Paradigms](https://developer.blender.org/docs/features/interface/human_interface_guidelines/paradigms/) · [Blender Properties Editor](https://docs.blender.org/manual/en/latest/editors/properties_editor.html) · [Affinity Personas](https://affinity.help/designer2/English.lproj/pages/Introduction/about_Personas.html) · [Affinity Assistant Manager](https://s3-eu-west-1.amazonaws.com/affinity-docs/help/designer/en-US.lproj/pages/DesignAids/AssistantManager.html) · [VS Code Contribution Points](https://code.visualstudio.com/api/references/contribution-points) · [VS Code when-clause contexts](https://code.visualstudio.com/api/references/when-clause-contexts) · [Microsoft Ribbon UX Guide](https://learn.microsoft.com/en-us/windows/win32/uxguide/cmd-ribbons) · [Jensen Harris — The End of Personalized Menus](https://learn.microsoft.com/en-us/archive/blogs/jensenh/the-end-of-personalized-menus) · [Findlater & McGrenere CHI 2004](https://dl.acm.org/doi/10.1145/985692.985704) · [Superhuman — command palette](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/)
