# Báo cáo phiên CW — Ghế 3D vào app thật: lưu Thư viện + cửa sổ xem 3D bật/tắt được

> Phiếu: `docs/phieu-giao/ghe-3d-window-app.md` · entry `ghe-3d-window-app` · 14/08/2026.
> KHUÔN 2 GIÁ TRỊ [Đ2]: ① kiến trúc app — `Object3DWindow`/`Object3DToggle` (components/library/)
> là MẶT TIỀN thứ hai của khuôn ToolWindow (portal/kính-vỏ-ruột-sắc-nét) + khuôn ánh sáng
> MaterialSphere (RoomEnvironment/NeutralToneMapping) — không viết viewer 3D mới từ đầu; ② vận
> hành/giá trị IF — KTS lướt kệ Thư viện, thấy cấu kiện AI-sinh có model 3D thì tự bấm mở xem xoay
> được, không phải mở app ngoài/tệp rời.

## 1 · Asset lưu vào DB thật

Script `scripts/proof-ghe-3d-library.ts` (chạy `sucrase-node`, KHÔNG phải route API mới — gọi
thẳng cùng logic route `POST /api/library` làm: sniff MIME bằng magic bytes thật qua
`lib/server/mime-sniff.ts`, ghi `./uploads`, `prisma.libraryAsset.create`). Idempotent (khớp theo
`name`, có `--undo`).

| | |
|---|---|
| **Asset id** | `cmsshuywg0001w90hkws755g5` |
| name | "Ghế bar Lincoln 327 · AI-sinh" |
| category | `furniture` |
| usage | `ref-render` (đúng chữ phiếu chỉ định) |
| tags | `ghe-bar,lincoln-327,ai-sinh,shelf:common-asset,thumb:furniture,code:LIN-327` |
| file ảnh | `uploads/ghe3d_lincoln327.jpeg` (40.528 bytes, `image/jpeg`, ảnh studio thật nguồn mezzocollection.com) |
| content | `.idfc` v3 thật (2.452 ký tự) — nguyên bản `lincoln-327.idfc` của phiên GI, round-trip `importIdfc` đã kiểm ở phiên đó |
| URL asset | `/api/library/cmsshuywg0001w90hkws755g5/file` |

**Quyết định tự chọn (ghi lại)**: route `POST /api/library` CHỈ nhận `dataUrl` là ảnh raster thật
(`sniffKind` whitelist PNG/JPEG/WEBP/GIF/AVIF, `lib/server/mime-sniff.ts`) — không có đường nào
nhận GLB/OBJ nhị phân qua trường này, và mesh 1,65MB cũng vượt xa trần 20.000 ký tự của cột
`content`. Vì vậy bản ghi DB mang **ẢNH xem trước + THÔNG SỐ `.idfc`** (đúng vai trò "thẻ trong
Thư viện"); **file hình học 3D nằm ở `public/library-assets/lincoln-327/`** (URL tĩnh Next.js),
`Object3DWindow` đọc qua props — không qua bản ghi DB này. Việc này NẰM NGOÀI câu chữ "script proof
lưu vào DB" nếu hiểu hẹp là "mọi thứ vào DB", nhưng là cách DUY NHẤT khả thi với route hiện có mà
không sửa `app/api/library/route.ts` (ngoài phạm vi phiếu).

Về "kệ Nội thất" (phiếu việc 3): kho không có shelf tên "Nội thất" — gần nhất là `common-asset`
("Ảnh & tài sản"), nơi `usage:'furniture'` refs vẫn đổ về theo đúng tiền lệ
`scripts/seed-library-minh-hoa.ts`. Đã tag rõ `shelf:common-asset,thumb:furniture` để món hiện
đúng icon/kệ furniture trong khi vẫn giữ `usage:'ref-render'` như phiếu ghi chữ.

## 2 · GLB nào dùng — CHUẨN-NÉT, đúng biên phiếu

Biên phiếu: "nếu CN đã tạo `.obj/.glb` MỚI thì ưu tiên dùng bản đó thay vì GLB Trellis thô". CN đã
xong (`docs/bao-cao-phien/2026-08-14-CN-chuan-net.md`, entry `chuan-net-3d`) và ra **`.obj`+`.mtl`**
(không có `.glb` — CN không sinh FBX/GLB, chỉ OBJ). ⇒ Dùng bản chuẩn-nét, copy 3 file từ scratchpad
phiên vào **`public/library-assets/lincoln-327/`** (KHÔNG đụng `lib/idfc-import/**`, chỉ đọc kết
quả đã có sẵn dạng file):
- `lincoln-327-chuannet.obj` (812KB, mm, Y-up, 4 group trụ tham số + 1 group mesh-giữ)
- `lincoln-327-chuannet.mtl` (`mat_primitive` xám + `mat_mesh` map_Kd texture)
- `lincoln-327-basecolor.png` (1,2MB, texture UV-atlas rút từ GLB gốc)

`Object3DWindow` tự nhận đuôi `.obj` → `OBJLoader`+`MTLLoader` (thay vì `GLTFLoader`), quy đổi
mm→m (`scale.setScalar(0.001)`) để nhất quán khung camera/bóng tiếp đất tính bằng mét. Bản GLB thô
Trellis (`public/__lincoln.glb`, đã có sẵn từ phiên DF trước — KHÔNG đụng tới) vẫn còn đó làm dự
phòng nếu sau này cần so sánh, nhưng KHÔNG được app thật dùng ở đợt này.

## 3 · Component — tái dùng khuôn, không viết viewer từ đầu

| File | Vai trò |
|---|---|
| `components/library/Object3DWindow.tsx` | Cửa sổ nổi THUẦN (`{open,onOpenChange,glbUrl,mtlUrl?,title,subtitle?}`) — portal `document.body` (khuôn `ToolWindow.tsx`), vỏ kính blur+webkit-prefix / ruột canvas sắc nét (luật N1 tội ①). Scene: `RoomEnvironment` PMREM 0.04 + `NeutralToneMapping` — ĐÚNG công thức `components/three/material-preview.ts`, khác ở chỗ đây là viewer TƯƠNG TÁC (OrbitControls + vòng lặp render) chứ không chụp 1 khung tĩnh. Nền đọc `var(--bg)` runtime (kem sáng/tối theo theme, không hardcode). Bóng tiếp đất = đĩa gradient bake canvas 2D, cùng tinh thần `contactShadowTexture`. Loader `GLTFLoader`/`OBJLoader`/`MTLLoader` nạp ĐỘNG lúc mở (không kéo vào bundle chính). Dispose đầy đủ khi đóng: renderer, controls, env texture, geometry, material + toàn bộ map con (map/roughnessMap/…). |
| `components/library/Object3DToggle.tsx` | Nút bật/tắt gắn trên MỘT thẻ asset — `<span role="button">` (KHÔNG `<button>` lồng trong `<button>` .it — HTML cấm interactive-trong-interactive, thẻ cha đã là button), `draggable={false}` + `stopPropagation` mọi sự kiện chuột/phím để không kích hoạt chọn/kéo-thả của thẻ cha. State `open` cục bộ, **mặc định `false`**. |
| `components/library/LibrarySheet.tsx` | +import, +bảng `OBJECT_3D_MODELS` (khớp theo TÊN món — kho DB chưa có cờ "có model 3D", ghi rõ trong comment để phiên sau biết đường đúng khi có cấu kiện 3D thứ hai là thêm tag `has3d:`), +render `<Object3DToggle>` trong children của `<ItemThumb>`. |
| `components/library/library-sheet-css.ts` | +`.obj3d-toggle` — đặt GÓC TRÊN-TRÁI (duy nhất còn rảnh, badge phạm vi chiếm trên-phải, badge.param chiếm dưới-trái), cùng công thức blur nửa token `--blur` như `.badge`. |

## 4 · Verify browser THẬT (server 3000 sẵn có, session sẵn — không nhập mật khẩu)

1. Mở Thư viện (nút "Vật liệu" → "Xem cả kho") → kệ "Ảnh & tài sản" → thấy thẻ **"Ghế bar Lincoln
   327 · AI-sinh"** (STUDIO, ảnh thật) VỚI badge **"👁 Xem 3D"** góc trên-trái — mặc định TẮT, cửa sổ
   KHÔNG tự mở khi vào trang. ✅
2. Bấm badge → `Object3DWindow` nổi lên, tiêu đề + dòng phụ "Hình học chuẩn-nét · mesh AI-sinh".
   **Lần đầu bị tấm Thư viện (z-index 91) đè mất RUỘT** — chỉ thấy header, thân trống — đã SỬA
   (z-index 40→95, ghi rõ lý do trong code). Sau sửa: ghế hiện đủ, đúng khung, camera căn giữa. ✅
3. **Bug thứ hai bắt được lúc verify**: canvas phóng to gấp đôi rồi bị cắt cụt (chỉ thấy góc ghế).
   Nguyên nhân đo bằng JS trực tiếp trên DOM thật: `renderer.setSize(w,h,false)` (copy tinh thần
   Scene3DViewer) không set `canvas.style.width/height` ⇒ trình duyệt vẽ theo THUỘC TÍNH width/
   height (đã nhân devicePixelRatio=2 → 1446×826 thay vì 723×413 CSS thật). Sửa: `setSize(w,h,
   true)`. Sau sửa: ghế vừa khung, không cắt. ✅
4. Kéo chuột trong khung → OrbitControls xoay góc nhìn mượt (ảnh chụp trước/sau khác góc). ✅
5. Bấm nút đóng (X) → cửa sổ biến mất, thẻ Lincoln vẫn còn nguyên trên kệ, badge trở lại trạng thái
   chưa mở. ✅
6. Console: không có lỗi/`console.warn` từ `Object3DWindow`; 2 warning `PCFSoftShadowMap deprecated`
   là của canvas KHÁC (Scene3DViewer nền workspace, không phải component mới — component này không
   bật `shadowMap`).

Texture ghế hiện ra như "camo vàng-nâu ánh kim" — **KHÔNG PHẢI lỗi viewer**: đã soi trực tiếp file
`lincoln-327-basecolor.png` (Read tool) — đúng là một UV-atlas gộp nhiều mảnh chưa rectify sạch,
kế thừa từ mesh AI-sinh TRELLIS gốc (CN report §3 đã khai hai chỗ fit không nổi). Component chỉ
HIỂN THỊ ĐÚNG dữ liệu đang có; chất lượng texture là giới hạn của khâu trước (GI/CN), không phải
việc phiếu này.

## 5 · Kiểm máy

- `npx tsc --noEmit` — **0 lỗi** (bắt + sửa 1 lỗi thật lúc code: narrowing `const` không xuyên qua
  `async function` lồng bên trong, TS2345/TS18047 — chốt kiểu tường minh `container: HTMLDivElement`).
- `node scripts/soi-tu-dien.mjs` — **0 lệch** (chuỗi "Xem 3D"/"AI-sinh" không nằm trong danh sách
  cấm; đã tránh chữ "tự động" hoàn toàn trong mọi UI string mới).
- 1 lỗi cú pháp tự bắt + tự sửa: backtick trong comment `library-sheet-css.ts` (file này là template
  literal — backtick trong `/* */` đóng sớm chuỗi, luật đã ghi sẵn ở đầu file, tôi phạm rồi tự sửa).

## 6 · Giới hạn / nói thẳng

- Nhận diện "món có model 3D" đang so theo TÊN (`/lincoln 327/i`) trong `LibrarySheet.tsx` — kho
  `LibraryAsset` chưa có cờ máy-đọc-được "có model 3D xem trước". Khi có cấu kiện 3D thứ hai, đường
  đúng là thêm tag `has3d:<url>` đọc qua `lib/library/db-items.ts` (đã ghi comment tại chỗ).
- Model 3D KHÔNG nằm trong DB (chỉ ảnh+.idfc) — nằm ở `public/library-assets/lincoln-327/`, ngoài
  vùng "components/library/**" ghi trong phiếu nhưng là lối duy nhất khả thi không sửa route API.
- Texture UV-atlas của bản chuẩn-nét còn xấu (kế thừa từ mesh gốc) — CN report đã ghi rõ 2 điểm
  chưa fit nổi (gác chân không phải torus, tay vịn dính liền nệm); phiếu sau (CN §7) mới xử lý.
- `Object3DWindow` chưa test với `.glb` thật trong app này (chỉ verify nhánh `.obj`+`.mtl` — nhánh
  GLTFLoader dùng chung code path `loadAsync` đã có ở `lib/three/glb-import.ts` làm tham chiếu, tin
  cậy được nhưng CHƯA click-verify trực tiếp qua UI vì Lincoln 327 dùng bản chuẩn-nét).
- Không đụng `lib/idfc-import/**`, không đụng `lib/cad/idfc.ts` ruột — đúng biên phiếu (chỉ ĐỌC file
  kết quả CN đã tạo sẵn trong scratchpad qua Read/Bash, không sửa code sinh ra chúng).
- Không chạy git (theo luật cứng của phiếu) — mọi file mới/sửa đang ở working tree, chờ phiên điều
  phối commit.

## 7 · File thay đổi

**Mới:**
`components/library/Object3DWindow.tsx` · `components/library/Object3DToggle.tsx` ·
`scripts/proof-ghe-3d-library.ts` ·
`public/library-assets/lincoln-327/{lincoln-327-chuannet.obj,lincoln-327-chuannet.mtl,lincoln-327-basecolor.png}`

**Sửa:** `components/library/LibrarySheet.tsx` (+import, +bảng khớp model 3D, +render toggle) ·
`components/library/library-sheet-css.ts` (+`.obj3d-toggle`)

*Ghi chú: `public/lincoln-327-*` + `public/__objview.html` ở gốc `public/` (KHÔNG phải
`public/library-assets/`) là proof HTML độc lập của phiên CN, không phải của phiếu này — để
nguyên, không đụng.*
