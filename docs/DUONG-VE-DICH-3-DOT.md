# ĐƯỜNG VỀ ĐÍCH — **ĐÃ MỞ KHOÁ** (Hoà quyết 04/08 chiều)

⚠️ **THAY THẾ bản "3 đợt khoá" sáng 04/08.** Hoà chốt: **mở khoá toàn bộ IF (cả chặng 2D
lẫn 3D), làm HẾT rồi ship MỘT LẦN.** Không ship bản tối thiểu trước.

Bản cũ giữ trong lịch sử git (`a40adf2`) — không xoá, để về sau đối chiếu quyết định.

## Đích mới
Một studio nội thất làm trọn dự án thật **bằng bộ công cụ đầy đủ**:
```
mở .dwg cũ → vẽ 2D đủ lệnh → dựng 3D đủ cấu kiện → gán vật liệu thật →
render AI có số đo → in hồ sơ đúng tỉ lệ → ra BOQ có giá → trình chiếu
```

---
## ĐÃ XONG (11 việc, 03-04/08)
Nhập DWG (timeout·tiến độ·huỷ) · xuất PDF đúng khổ+tỉ lệ · multi-sheet D1+D2 (bỏ trần 5) ·
kho vật liệu (schema 4 cột · màn quản lý · nhập Excel qua gateway) · BOQ editor ·
boolean 3D `ops[]` · cửa/cửa sổ hosted khoét lỗ thật · ViewCube 3D 26 vùng ·
autosave chặng 3D · phím tắt tập trung + lockscreen · kính lỏng + EmptyState toàn app ·
nhãn nhóm thanh tool 2D · đổi tên 3 chặng

---
## CÒN LÀM — 18 VIỆC (A-F), xếp theo GIÁ TRỊ/CÔNG

### Nhóm A · Chặng 2D cho đủ nghề
| # | Việc | Ghi chú |
|---|---|---|
| A1 | **Mode Revit đầy đủ** | 6/6 cơ chế đều thiếu (`SO-KIEM-TONG §7`): location line · hosted · type/instance · tham số cụm · Level object · constraint cao độ |
| A2 | **10 khuyết AutoCAD** ①-⑩ | `docs/SPEC-LENH-VE §4` — eyedropper, guide… |
| A3 | **Inference + VCB gõ-số-sau** (`3x` `/3`) | `VE-INFERENCE` |
| A4 | **Mode Phác thảo tablet** (bút·cử chỉ·radial) | `VE-SKETCH-TOUCH` 112d |

### Nhóm B · Chặng 3D cho đủ dựng
> 🔁 **B1-B5 dưới đây ĐÃ ĐƯỢC THAY bằng bản phân loại theo thuật ngữ chuẩn ngành archviz
> (viết lại 04/08) — xem "Nhóm B (viết lại 04/08)" ngay sau mục B5. Giữ B1-B5 làm lịch sử,
> không xoá. → xem phân loại mới.**

| # | Việc (→ xem phân loại mới) | Ghi chú |
|---|---|---|
| B1 | **114 lệnh dựng hình 3D** | 6 tầng `SPEC-DUNG-BO-LENH-3D`. `ops[]` mới nối `boolean`; `extrude`/`arrayLinear` khai type chưa derive |
| B2 | **Camera mức V-Ray** | tiêu cự mm · 2 điểm tụ · DOF · safe frame · lưu điểm nhìn · đường quay |
| B3 | **Material Editor** | D5-style + sphere live + per-map + publish (`VAT-LIEU §3b`) |
| B4 | **8 tính năng AI chặng 3D** | ①trước/sau ②chọn model ③Concept↔Precision ④thư viện mẫu ⑤viết đậm prompt ⑥mặt bằng→phối cảnh ⑦**callout số đo từ Doc** ⑧**ảnh→bản vẽ có keynote**. ⑦⑧ = MOAT |
| B5 | **MẶT BẰNG RENDER** (rendered floor plan) | 🔴 QUẢ NGỌT THẤP NHẤT — thiếu đúng 1 mắt xích |

**B5 chi tiết** — tham chiếu 5 ảnh Hoà gửi 04/08 (mặt bằng bảo tàng có chú giải · biệt thự trên
địa hình · nhà + sân + xe · 2 mặt bằng nền tối có đèn hắt kiểu Sthaayi).
Đây là thứ studio Việt Nam DÙNG ĐỂ BÁN HÀNG — khách không đọc được mặt bằng kỹ thuật nhưng nhìn
tấm này là hiểu ngay. Hiện họ làm bằng Photoshop: xuất CAD → tô tay → dán cây/xe → đổ bóng.
Nửa ngày một tấm, và SỬA BẢN VẼ LÀ LÀM LẠI TỪ ĐẦU.
IF đã có đủ nguyên liệu (`Doc` · `docToObjScene` · `matId` · fal.ai adapter). THIẾU ĐÚNG 5 MẮT XÍCH:
1. **Camera TRỰC GIAO nhìn thẳng xuống 90°** — thêm kind `'plan'` vào `lib/three/camera.ts`, dùng
   `OrthographicCamera`. (Kiểm 05/08: preset `'top'` hiện có là góc CHÉO 30° — `placeCamera()`
   đặt máy lùi `cy − span*0.55`, comment ghi rõ "trên cao chéo 30°" — KHÔNG phải plan view.
   `OrthographicCamera` trong repo mới chỉ dùng ở `components/three/ViewCube3D.tsx`.)
2. **BỎ TRẦN / cắt mặt phẳng ngang** ở cao độ chỉnh được (mặc định 1200mm như mặt cắt bản vẽ).
   (Kiểm 05/08: `grep -rE "cutPlane|hideRoof|clipPlane|planView" lib components app` = **0 kết quả**
   — chưa có gì.)
3. **Cây · xe · người thả vào cảnh** — nối vào thư viện block (C2).
4. **Chú giải phòng đánh số tự sinh** từ nhãn phòng trong `Doc` (ảnh bảo tàng Hoà gửi).
5. **Preset phong cách**: "sáng tự nhiên" · "tối sang trọng có đèn hắt" (kiểu Sthaayi, 2 ảnh cuối).

⚠️ GIÁ TRỊ: sinh từ `Doc` ⇒ sửa tường xong render lại là xong, KHÔNG làm lại Photoshop.
   Đây là thứ Photoshop không bao giờ làm được.

### Nhóm B (viết lại 04/08) · CHẶNG 3D theo quy trình chuẩn archviz
> **THAY cho B1-B5 cũ ở trên** (B1-B5 giữ nguyên làm lịch sử, đã đánh dấu "→ xem phân loại mới").
> Quy trình ngành: Massing → Lookdev → Lighting → Camera → Rendering → Output

| Nhóm | Tên EN chuẩn | Tên VI | Trạng thái |
|---|---|---|---|
| B-① | Massing | Dựng khối | ✅ boolean · ❌ 114 lệnh · 🟡 extrude/array |
| B-② | Lookdev | Gán vật liệu | ✅ kho+matId+sphere · ❌ Material Editor |
| B-③ | **Lighting** | **Đặt đèn** | ❌ **THIẾU HẲN NHÓM** — nắng theo giờ/hướng · đèn trong nhà · HDRI · độ ấm |
| B-④ | Camera | Đặt máy quay | 🟡 4 preset · ❌ tiêu cự mm/2 điểm tụ/DOF/safe frame/đường quay |
| B-⑤ | Rendering | Dựng ảnh | ✅ đường ống AI · ❌ 8 tính năng (trước-sau · chọn model · Concept↔Precision · thư viện mẫu · viết đậm prompt) |
| B-⑥ | Output | Xuất | ❌ mặt bằng render · mặt đứng render · phối cảnh mặt cắt · phim đi bộ/bay/xoay · callout số đo từ Doc |

**PHONG CÁCH DỰNG ẢNH** — tên chuẩn để đặt nhãn preset trong app:
Photorealistic (Ảnh thật) · Clay/White model (Khối trắng) · Grayscale (Ảnh xám) ·
Ambient Occlusion (Ảnh bóng đổ) · Sketch (Phác) · Watercolor (Màu nước) · Ink (Nét mực)

⚠️ B-③ Đặt đèn là lỗ TO NHẤT: không có đèn thì "ảnh thật" phụ thuộc AI đoán,
mỗi lần một kiểu, không kiểm soát được. Đúng điều Hoà nêu 03/08.

⚠️ TRÌNH TỰ trên màn 3D hiện chỉ 3 bước (Dựng khối → Gán vật liệu → Đặt máy quay) —
sửa thành 5: thêm "Đặt đèn" trước Đặt máy quay, thêm "Dựng ảnh" cuối.

### Nhóm C · Kho & dữ liệu
| # | Việc | Ghi chú |
|---|---|---|
| C1 | **Đổ 1449 món ATLAS** | qua cửa Excel đã có — Hoà tự làm 10 phút |
| C2a | **Mở rộng thư viện block** (`lib/cad/furniture.ts` + file mới) | Thiết bị vệ sinh · thiết bị bếp + module tủ · cây · người (entourage) · ký hiệu bản vẽ — chi tiết dưới bảng |
| C2b | **Type/Instance + module ghép** | `ProductSpec` thêm `views`/`modules`/`rules` Json — chi tiết dưới bảng |
| C2c | **Doc mẫu** (RẺ NHẤT, GIÁ TRỊ CAO NHẤT) | File `.idf` mẫu = mặt bằng hoàn chỉnh, KHÔNG phải block — chi tiết dưới bảng |
| C2d | **Chi tiết cấu tạo** (2D thuần, KHÔNG 3D) | Chân tường · trần giật cấp · khe co giãn… — loại riêng ngoài kiến trúc parametric |
| C3 | **Web Clipper** | dán link web NCC → bóc tên/ảnh/giá. NCC Việt Nam có web, không có API |
| C4 | **Tầng ① nhà cung cấp** | `scope='global'` — 4 cột schema đã khai sẵn |

**C2 KHÔNG phải làm lại từ đầu — CHỈ MỞ RỘNG cái đã có** (đính chính 05/08, TỔNG từng đề xuất nhầm
"Kiểm khoảng" như tính năng mới): `lib/cad/standards/` đã có **16 file** (Neufert · chuẩn VN điện/
nước/PCCC/tiếp cận · checker · fix-suggest…) và `lib/cad/furniture.ts:40` đã có
`clearance?: ClearanceZone[]` (`shared-types.ts`) — vùng trống bắt buộc quanh shape ĐÃ code, có
`clearanceWorldPolygon()` ở `shape-interactions.ts`. C2a chỉ **thêm block mới** vào cơ chế sẵn có.

**C2a chi tiết — thêm vào `furniture.ts` + file mới:**
- Thiết bị vệ sinh: bồn cầu · lavabo · sen · bồn tắm · tiểu nam · vách kính
- Thiết bị bếp: bếp · hút mùi · chậu · tủ lạnh · lò · máy rửa chén + module tủ bếp 300/400/450/600/800/900
- Cây: chậu bàn · chậu sàn · cây lớn · dây leo (2 mức chi tiết)
- Người: đứng/đi/ngồi/ngồi bệt — vai 450-500, đầu Ø180-200, cờ `isEntourage:true` → KHÔNG vào BOQ
- Ký hiệu: mũi tên bắc · cao độ · mặt cắt · triển khai · trục · khung tên · thước tỉ lệ · mẫu gạch ISO128
- ⚠️ **LUẬT BẢN QUYỀN nguồn block — xem `docs/LICENSE-NOTES.md §10`**: TUYỆT ĐỐI KHÔNG nạp block từ
  BIMobject · CADforum · Bibliocad · DWGmodels · ARCAT · cad-blocks.net · Show It Better ·
  Skalgubbar — cả 7 nguồn đều cấm redistribute trong sản phẩm bán ra (BIMobject cấm thẳng
  "incorporate into a product you provide to a third party" + cấm train AI). Dùng được: Openclipart
  (CC0) · Tabler/Lucide/Iconoir (MIT). SỐ ĐO (Neufert/Panero/dimensions.com) là sự thật, không có
  bản quyền — chỉ cấm đồ lại HÌNH VẼ có sẵn.

**C2b chi tiết** — `ProductSpec` (`prisma/schema.prisma`, model `ProductSpec` hiện ~dòng 359) thêm:
```
views   Json?  // {top, front, side}
modules Json?  // [{code,w,d,h}]
rules   Json?  // luật ráp
```
Ví dụ phải chạy được: sofa modular 190+150=413cm, cấu hình SX/DX (trái/phải).

**C2c chi tiết** — Doc mẫu, KHÔNG phải block: phòng ngủ khách sạn 3 hạng · sảnh khách sạn · office
hybrid · phòng họp · văn phòng mở · bếp bar. Mở file `.idf` mẫu ra là mặt bằng HOÀN CHỈNH, người
dùng xoá bớt/sửa lại — không phải kéo từng block rời.

**C2d chi tiết** — 2D thuần, KHÔNG dựng 3D: chân tường · trần giật cấp · khe co giãn · hộp gen ·
vách kính khung mảnh · sàn nâng. Loại riêng, nằm NGOÀI kiến trúc parametric (khác C2a/C2b).

### Nhóm D · Trình chiếu & xuất
| # | Việc | Ghi chú |
|---|---|---|
| D1 | **Video editor** timeline | `SPEC-TRINH-VIDEO-EDITOR` 67d. KHÔNG viết engine |
| D2 | **Văn bản song ngữ** (hồ sơ thứ 5) | |
| D3 | **Multi-sheet D3** | bump `IDF_VERSION` + đổi shape persist + offset bbox. HOÃN tới trước ngày ship |

### Nhóm E · Trải nghiệm
| # | Việc | Ghi chú |
|---|---|---|
| E1 | **Intro** | Claude Design đang dựng (5 cú máy, cái ghế) |
| E2 | **Collab G2** | mock `mock-if-cong-tac.html` đã có, chưa code |
| E3 | **Trang chia sẻ** `/share/[token]` | mock chưa có — bộ mặt studio đưa ra ngoài |
| E4 | **Bug camera 1-khối lệch tâm** 🔴 chưa ai động | Nghi `cy → −cy` trong `controls.target`, comment đã ghi sẵn trong `Scene3DViewer.tsx`. Đụng engine campath/capture nên cần cẩn thận |
| E5 | **Port mock màn TỆP** | `docs/mocks/mock-if-tep.html` (80KB, sổ ghi "sạch nhất, đủ 4 trạng thái") lên `app/files/page.tsx`. NÂNG CẤP, không đập lại (§0d) |
| E6 | **Màn NÚT TỔNG** | mock 60KB có, CHƯA CÓ CODE. Màn duy nhất phải dựng mới |
| E7 | **Dọn 18 nợ kỹ thuật** | trong `docs/TECH-DEBT.md` |

---
### Nhóm F · TÀI LIỆU ĐẦU RA giao khách (rút từ tham chiếu Hoà gửi 04/08 — TỔNG bỏ sót lần đầu)
| # | Việc | Ghi chú |
|---|---|---|
| F1 | **FF&E spec sheet** — một trang một món | Tham chiếu CH-01 HEM LOUNGE CHAIR: mã · số lượng · model number · finish · giá · kích thước · OFCI/OFOI · swatch vải/gỗ/vật liệu · vendor + contact · checkbox duyệt trước sản xuất (CFA/Finish/Flame cert/Prototype/Shop dwgs). Đây là CHUẨN NGÀNH nội thất quốc tế, studio Việt chưa có công cụ nào làm |
| F2 | **Board trình bày sản phẩm** | Tham chiếu SAIL LOUNGE: concept evolution 6 bước · hình chiếu 4 mặt có kích thước · material & texture palette · details · lifestyle renderings. Một tờ kể trọn một món |
| F3a | **Màn Moodboard** (Claude Design dựng mock trước) | Canvas tự do, kéo thả từ kho sang · auto-layout (lưới masonry/cột chủ đề) · dải màu tự trích, đổi được thứ tự · nhãn dẫn kiểu ảnh Hoà gửi (elementos escultóricos…) · cột Pantone bên phải. Tham chiếu JAPANDI + pure+simple: ảnh xếp lưới + palette + nhãn dẫn có đường chỉ |
| F3b | **Trích màu + thư viện sơn VN** (phiên code) | `nearestPantone(hex)`-kiểu nhưng đổi nguồn: Dulux · Jotun · Nippon · Kova · RAL, nối vào `LibraryAsset.palette` đã có. Toán: sRGB → Lab (D65, 2°), xếp hạng ΔE CIEDE2000. ⚠️ **KHÔNG ship dữ liệu Pantone** — lý do pháp lý ở `NC-14-CAM-UNG.md §4.6` (xem thêm `docs/LICENSE-NOTES.md §9`, phiên trước đã cắm cờ chặn thương mại đúng lỗ này) |
| F4 | **Trang catalogue** | Tham chiếu POSTMODERN + catalogue Ý: ảnh lifestyle + hình chiếu kỹ thuật có kích thước + danh mục món kèm mã/kích thước |
| F5 | **Khung tên bản vẽ** A0-A4 ngang/dọc | mẻ Thư viện Hoà giao 03/08, Claude Design chưa làm |

⚠️ F1-F4 đều nối vào ProductSpec đã có (w/d/hUp · materials · finishes · colorHex ·
   priceNote · vendor · imageAssetId) ⇒ SỐ LIỆU TỰ ĐIỀN, không gõ tay. Đây là điểm mạnh:
   Photoshop làm được đẹp nhưng phải gõ tay và không tự cập nhật khi đổi vật liệu.

---
### Nhóm G · Cảm ứng & bút — 14 việc, chi tiết ở `NC-14-CAM-UNG.md §5`
| # | Việc | Ghi chú |
|---|---|---|
| G1 | `touch-action:none` + `overscroll-behavior:none` + `user-select:none` trên canvas **cả 3 chặng** | [NỀN] **PHẢI đặt sẵn trong CSS** — đổi lúc `pointerdown` là MUỘN (spec W3C: trình duyệt chốt hành vi cử chỉ ngay lúc chạm đầu tiên) |
| G2 | Chuyển sang Pointer Events + `setPointerCapture` + `pointercancel` | [NỀN] chuột/bút **phải gọi `setPointerCapture` bằng tay** (touch tự có ngầm định) · `pointercancel` phải **ROLLBACK nét đang vẽ dở**, không để nét cụt nằm lại trong Doc |
| G3 | `lib/input/` — bảng phân vai `pointerType`: `'pen'`=vẽ · `'touch'`=camera | [NỀN] **palm rejection web**: hễ có sự kiện pen thì BỎ mọi touch trong **800ms** kế tiếp (tì cổ tay lên màn khi vẽ bút) |
| G4 | `lib/input/const.ts` — long-press 500ms, slop 8px MÀN HÌNH, hit-radius 22px | [NỀN] slop/hit-radius đo bằng **px màn hình ⇒ phải CHIA cho zoom** khi quy về toạ độ mm, nếu không thì zoom càng sâu ngưỡng càng phình |
| G5 | 2 ngón = undo · 3 ngón = redo, giữ để lặp | |
| G6 | Chữ báo snap đặt lệch khỏi điểm chạm | |
| G7 | Chạm nhãn kích thước → numpad, nhận phép tính (`3500/2`) | |
| G8 | Giữ tay → nét thành hình chuẩn (0.5s) + ngón 2 ép dạng đều | |
| G9 | Menu trái đổi theo cái đang chọn (Shapr3D adaptive UI) | |
| G10 | Reset pivot vào tâm màn hình mỗi `touchend` (chặng 3D) | |
| G11 | Giữ trên vật bị che → danh sách xếp lớp | [CHỖ TRỐNG] |
| G12 | Ngón 2 giữa cú kéo = đổi trục · trượt = xoay | [CHỖ TRỐNG] |
| G13 | Auto-arrange moodboard theo nội dung | [CHỖ TRỐNG] |
| G14 | 3 ngón kéo ngang = xoay mặt trời/HDRI live | [CHỖ TRỐNG + lấp nhóm B-③ Lighting] |

⛔ **RÀNG BUỘC NỀN (áp cho G1-G4): KHÔNG dùng HTML5 Drag & Drop** — nó bắn `pointercancel`,
cướp gesture đang chạy. Kéo thả phải tự dựng trên Pointer Events. *(Ràng buộc này thuộc khối
[NỀN] trong brief Hoà 05/08, rớt lúc append lần đầu — bổ sung 05/08.)*
⚠️ G1 phải đặt SẴN trong CSS, không đổi lúc `pointerdown` — theo spec W3C thì lúc đó đã muộn.

## LUẬT VẬN HÀNH GIỮ NGUYÊN
- **Tối đa 4 phiên code cùng lúc.** Vùng file độc quyền, không chồng lấn.
- Mỗi phiên tự xưng tên `[P#]` ở đầu báo cáo.
- Luật N1-N7 (`§5`) và §9 (thiết kế trước, fill sau) không đổi.
- **D3 làm SAU CÙNG**, ngay trước ngày ship — nó đổi định dạng file người dùng lưu ra đĩa.

## RỦI RO ĐÃ BÁO, HOÀ CHẤP NHẬN
Ship một lần sau 13 việc ⇒ không có phản hồi studio thật cho tới cuối. COWORK-TỔNG đã
khuyến nghị ship sớm cho 1 studio song song; Hoà chọn làm hết rồi ship. Ghi lại để về sau
đối chiếu, không phải để cản.

---
## HOÃN (append-only — ghi để không quên, KHÔNG nằm trong 18 việc A-F)

### AI chặng 3D — 8 tính năng rút từ tham chiếu Hoà gửi 04/08 (làm SAU đợt 12)
① thanh trượt trước/sau (khối trắng ↔ render) · ② chọn model AI kèm mô tả khi nào dùng ·
③ chế độ Concept ↔ Precision (giữ đúng hình học) · ④ thư viện mẫu phong cách ·
⑤ viết đậm prompt · ⑥ mặt bằng → phối cảnh một cú ·
⑦ CALLOUT KÍCH THƯỚC + SWATCH VẬT LIỆU đè lên ảnh render — đọc từ Doc thật ·
⑧ ảnh 3D → bản vẽ có keynote + tỉ lệ + chú giải vật liệu

⑦⑧ là MOAT: tool AI khác chỉ có ảnh, IF có Doc — biết kích thước thật, mã vật liệu thật,
giá thật; callout tự cập nhật khi bản vẽ đổi. Làm sau đợt 12.
