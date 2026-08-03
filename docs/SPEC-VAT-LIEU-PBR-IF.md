# SPEC · VẬT LIỆU PBR + QUẢ CẦU XEM TRƯỚC — IF
**Ngày:** 03/08/2026 · **Trạng thái:** CHỐT · **Tầng:** T1 (matId là moat)
**Nối:** `SPEC-CHANG2-UI-2MODE` §4 (catalog V-Ray/D5/IF) · `SPEC-STAGE-LIBRARIES` · `SPEC-SEMANTIC-MODEL` §4

> Hoà 03/08: *"vật liệu trong Thư viện ở chặng Render lúc Vẽ 3D phải là KHỐI CẦU để thấy rõ bump,
> ánh sáng, độ phản xạ. Nghiên cứu sâu vật liệu V-Ray, tạo vật liệu, cơ chế render, soi về logic IF."*

## 1 · CHỐT LƯU TRỮ — matId = PBR metal/rough chuẩn glTF
Nghiên cứu 3 engine (V-Ray · D5 · Enscape) cho kết luận dứt khoát:
**D5 và Enscape đã là PBR metal/rough thuần** → matId lưu theo chuẩn đó là khớp 2/3 engine không cần dịch;
chỉ V-Ray cần một lớp dịch mỏng, và V-Ray có sẵn công tắc cho từng chỗ lệch.

**Trường của matId:**
`baseColor (sRGB) · roughness (linear) · metallic (0|1) · specular · normal · height · ao · emissive(+cường độ, Kelvin) · opacity(mode: cutout|blend) · [mở rộng] transmission+ior · clearcoat(+roughness) · sheen`

**Bảng dịch sang V-Ray (đúng từng công tắc, đã tra doc Chaos):**
| matId | VRayMtl |
|---|---|
| roughness | bật **"Use Roughness"** (đảo nghĩa glossiness — khỏi bake map đảo) + BRDF **GGX** |
| metallic | **Metalness** — chỉ 0 hoặc 1 (doc Chaos: giá trị giữa "không ứng với vật liệu vật lý nào") |
| specular | **Fresnel IOR** — F0=((n−1)/(n+1))² · mặc định IOR 1.5 ≈ 0.04 (trùng specular 50% Enscape, 0–8% D5) |
| normal | Bump slot mode Normal, **tangent space**, nạp linear (gamma 1.0) |
| emissive | Self-Illumination + GI toggle |
| glass | Refraction Color + IOR + Fog |
⚠️ Chỉ `baseColor`/`emissive` là sRGB; roughness/metallic/normal/height **phải nạp linear** — sai chỗ này là vật liệu "trông sai" không rõ vì sao.

## 2 · CHỐT XEM TRƯỚC — QUẢ CẦU render thật, không phải ô màu phẳng
Hoà đúng, và chính V-Ray xác nhận: ô xem trước của họ là **một render V-Ray thật**, mặc định hình cầu.
Vì sao cầu: một quả cầu cho thấy **mọi hướng pháp tuyến cùng lúc** — tâm = phản xạ trực diện (F0),
rìa = **Fresnel falloff**, độ cong liên tục làm đọc được **hình dáng highlight** (roughness) và **bump**.

**Cách IF render (three.js đã có trong stack):**
```
SphereGeometry + MeshStandardMaterial (MeshPhysicalMaterial khi có coat/sheen/transmission)
env = PMREMGenerator.fromScene(new RoomEnvironment())   ← studio light không cần tải HDRI
nền trung tính var(--field) · một env dùng CHUNG cho mọi quả cầu (rẻ)
render 1 lần / lần đổi tham số → cache PNG theo hash(matId params)
```

**Học thêm 2 ý từ V-Ray Asset Editor:**
1. **Cảnh xem trước theo loại** — V-Ray có Generic/Fabric/Floor/Wall Closeup/SSS. IF làm 3:
   `Cầu` (mặc định) · `Sàn` (mặt phẳng phối cảnh — cho gạch/gỗ lát) · `Vải` (khối phủ vải).
   Tự chọn theo danh mục ATLAS: vật liệu nhóm "Sàn" mở preview Sàn.
2. **Ghim + nấc phân giải** (100/50/25%) làm van chi phí khi danh sách dài — lưới cuộn dùng 25%,
   panel chi tiết dùng 100%.

**Nơi hiện:** Thư viện sheet ở mode Vẽ 3D + tab Vật liệu của Command Panel → **quả cầu**.
Chặng Vẽ 2D giữ swatch phẳng (đúng ngữ cảnh bản vẽ). Chặng Trình bày: ảnh chụp vật liệu (bảng A3).

## 3 · TẠO VẬT LIỆU — học D5, không học V-Ray
V-Ray phơi ~40 tham số; D5/Enscape chọn ~8 và designer nội thất đủ dùng. IF theo D5:
**Template khởi tạo** (Gỗ · Đá · Sơn · Vải · Kim loại · Kính · Phát sáng · Nước) → mỗi template
mở đúng bộ trường cần chỉnh, còn lại mặc định thông minh. Có "Tạo normal từ ảnh màu" (D5 có, rẻ).
Đường nhập nhanh: **Batch import bộ PBR theo hậu tố tên file** (`_BaseColor/_Roughness/_Normal…`) — chuẩn Poliigon/ambientCG.

## 3b · MATERIAL EDITOR — CHỈNH ĐƯỢC, chuẩn D5/V-Ray (Hoà chốt 04/08 đêm: "quả cầu phải edit được")
Quả cầu không chỉ để NGẮM — bấm vào là mở **editor chỉnh tham số, quả cầu render lại sống** theo từng kéo slider.

**Bố cục (học V-Ray Asset Editor + D5 material inspector):**
- Trái/trên: **quả cầu live** — re-render khi tham số đổi (debounce ~300ms) · nút ghim (pin) giữ preview khi
  chọn vật liệu khác (V-Ray) · nấc phân giải 100/50/25% (van chi phí, V-Ray) · chọn cảnh Cầu/Sàn/Vải.
- Phải/dưới: **bộ trường D5-style** (~8 trường, KHÔNG phải ~40 của V-Ray):
  | Trường | Widget |
  |---|---|
  | Template | dropdown Gỗ·Đá·Sơn·Vải·Kim loại·Kính·Phát sáng·Nước — đổi template = đổi bộ trường hiện |
  | Base Color | ô màu + slot map (map nhân màu như D5) |
  | Roughness | slider 0-1 + slot map |
  | Metallic | slider 0/1 (giá trị giữa cảnh báo — luật VRayMtl) |
  | Specular | slider (F0 0-8%, chuẩn D5/glTF) |
  | Normal | slot map + cường độ + nút **"Tạo normal từ ảnh màu"** (D5 có, rẻ) |
  | AO · Emissive | slot map + nhân · màu/Kelvin + cường độ + Cast Shadow (D5) |
  | Opacity | slider + mode Cutout/Blend |
  | UV | Stretch · Offset · Rotate 0-360 · **Triplanar** (+blend) — global, học D5 |
- **Per-map adjust** (D5): Inverted · Contrast · Hue ±180 · Saturation · Brightness — mỗi map một cụm gấp được.
- Chân: **Nhân bản · Đưa lên kệ (publish, chủ duyệt) · Đặt lại** + dòng "matId giữ nguyên khi xuất D5/V-Ray".
- **Batch import PBR** theo hậu tố tên file (_BaseColor/_Roughness/_Normal/_AO/_Height) — chuẩn Poliigon/ambientCG.
**Luật:** sửa vật liệu CHUNG/STUDIO → tự nhân bản thành bản DỰ ÁN (không phá gốc — luật template read-only master).
Editor mở từ: bấm quả cầu trong Thư viện · ô Vật liệu trong Inspector · tab Vật liệu CommandPanel.

## 4 · SOI LOGIC IF HIỆN TẠI — 3 việc phải sửa
1. `lib/cad/materials.ts` hiện chỉ có màu/hatch 2D — **thiếu trường PBR**. Mở rộng schema matId theo §1
   (không phá cột cũ, thêm cột mới).
2. ATLAS sync (PHU đang nối): 8 cột Lark chưa có trường PBR → pha 1 map `Ảnh` thành baseColor,
   roughness/metallic gán theo **template của Danh mục** (Gỗ→rough 0.6 · Đá bóng→0.15 · Vải→0.9…).
   Ghi rõ đây là **giá trị suy đoán**, người dùng chỉnh sau.
3. Xuất D5/V-Ray: viết `lib/materials/export-vray.ts` + `export-d5.ts` từ bảng dịch §1 — thuần hàm, test được.

---
**Nguồn chính:** [V-Ray Asset Editor — preview swatch](https://docs-chaos.atlassian.net/wiki/spaces/VSKETCHUP/pages/109777030) · [VRayMtl Reflection — Use Roughness/Metalness/Fresnel IOR](https://docs-chaos.atlassian.net/wiki/spaces/VMAYA/pages/111739261) · [VRayMtl Presets](https://documentation.chaos.com/space/VMAX/113580704) · [D5 Material manual](https://docs.d5render.com/user-guide/material) · [Enscape Material Types](https://documentation.chaos.com/space/ENSCAPE/841252963/Material+Types) · [Adobe PBR Guide](https://www.adobe.com/learn/substance-3d-designer/web/the-pbr-guide-part-2) · [three.js RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html) · [USD Standard Shader Ball](https://github.com/usd-wg/assets/tree/main/full_assets/StandardShaderBall) · [Chaos Cosmos](https://www.chaos.com/cosmos)
