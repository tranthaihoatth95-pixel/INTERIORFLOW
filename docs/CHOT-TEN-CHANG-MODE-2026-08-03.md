# CHỐT · TÊN 3 CHẶNG · 2 CHẾ ĐỘ · GIAO DIỆN 3D THỐNG NHẤT · IFC
**Hoà chốt 03/08/2026 qua 3 câu hỏi trực tiếp.** File này là nguồn chuẩn — mọi spec/code trái với đây phải sửa theo.

## 1 · TÊN 3 CHẶNG (thuần Việt, theo ĐỘNG TỪ người dùng làm)
| Cũ (code) | ✅ MỚI | Route |
|---|---|---|
| `CAD · Phác thảo` | **Vẽ** | `/cad` |
| `Rendering` | **Dựng** | `/` |
| `Presenting` | **Trình bày** | `/present-editor` |
Lý do: đang lẫn Việt-Anh trong cùng 1 header. Toàn bộ docs/spec đã dùng Vẽ·Dựng ảnh·Trình bày (nay rút gọn 'Dựng ảnh'→'Dựng') → đổi code là khớp ngay, không phải sửa 30 file spec. Trái luật `SPEC-NGON-NGU-CHI-DAN` nếu giữ tiếng Anh lộ UI.
**File phải sửa:** `StageSwitcher.tsx:49-51` · `VitalsGesture.tsx:50` · `AppCommandPalette.tsx:128-129` (label đã Việt, giữ) · `ReferencePane.tsx:84` · mọi chỗ grep `Rendering|Presenting`.

## 2 · "2 IF" = HAI CHẾ ĐỘ DÙNG, KHÔNG PHẢI HAI APP
Hoà: *"sơ phác idea và chế độ kỹ thuật chuyên sâu"*.
| Chế độ | Ai dùng | Tính chất |
|---|---|---|
| **Sơ phác** | lúc nghĩ ý tưởng | nhanh, tay, không ràng buộc, sai được |
| **Kỹ thuật** | lúc ra hồ sơ | ràng buộc, đúng thước, xuất được |
⇒ Tên chặng phải TRUNG TÍNH cho cả hai (Vẽ·Dựng ảnh·Trình bày đạt). Không được đặt tên nghiêng về một phía (vd "Bản vẽ kỹ thuật" làm người sơ phác thấy bị ép).

## 3 · BIM CỦA IF = **BIM NỘI THẤT** (định vị lại — QUAN TRỌNG)
Hoà: *"bim chuyên nội thất là chính, kiến trúc là phụ, revit giờ vẽ hỗ trợ nội thất là chính rồi"*.
⇒ Mode **Cấu kiện** (chặng Vẽ) đổi trọng tâm: tường/cửa/sàn chỉ là VỎ CHỨA; hạng mục chính là **đồ nội thất · lớp hoàn thiện · tủ bếp · trần · sàn lát**. `SPEC-VE-REVIT-MODE.md` viết theo trọng tâm kiến trúc → phải bổ sung, KHÔNG đập (§0d).
⇒ Đây cũng là **moat**: Revit/ArchiCAD làm kiến trúc tốt, làm nội thất dở. IF đi đúng chỗ trống.

## 4 · CHUẨN IFC THEO NGHỊ ĐỊNH — VIỆC MỚI, ƯU TIÊN CAO
Hoà: *"chuẩn ifc theo nghị định nữa"*. Căn cứ tra sơ bộ 03/08 (COWORK-NC phải kiểm lại tận nguồn):
- **QĐ 258/QĐ-TTg (17/3/2023)** phê duyệt lộ trình áp dụng BIM: từ **2023** bắt buộc với công trình cấp I + cấp đặc biệt (dự án nhóm B trở lên vốn nhà nước/PPP); từ **2025** mở rộng xuống **công trình cấp II thuộc dự án nhóm B**. Hồ sơ BIM phải nộp cùng hồ sơ thiết kế/hoàn công cho cơ quan quản lý.
- **IFC 4.3** (buildingSMART) là schema trao đổi trung lập. Lớp cần cho nội thất: `IfcFurniture`/`IfcFurnitureType` (đồ rời), `IfcCovering`/`IfcCoveringType` (lớp hoàn thiện: trần·sàn·ốp tường — ĐÚNG TRỌNG TÂM IF), `IfcSpace` (phòng), `IfcMaterial`+`IfcMaterialLayerSet` (cấu tạo lớp), Psets cho thông số thương mại.
- Neo sẵn trong code: `matId PBR schema` (`892c927`) + `atlasRecordId` = chỗ gắn Pset vật liệu. `elementType/storey/wallKind` (`model.ts:151-181`) = chỗ gắn IfcClass.
**⇒ Giao COWORK-NC bài NC-11 (chi tiết trong SO-KIEM-TONG §3 đợt 4).** CHƯA code cho đến khi NC về.

## 5 · MODE 3D CHẶNG DỰNG ẢNH: **KHÔNG CHIA MODE — MỘT GIAO DIỆN THỐNG NHẤT**
Hoà: *"đã 3d model là tách tầng với render comfy ui... đã đủ rối rồi, chọn những điểm sáng giao diện của cả sketchup 3dmax revit, đồng bộ với nhau thành 1 giao diện 3dmode thống nhất. cấu kiện ở chặng 1."*
### Luật rút ra
1. **CẤM thêm mode con trong 3D.** Chặng 2 đã gánh: tách tầng · pipeline ComfyUI · node master. Thêm mode = rối chồng rối.
2. **Cấu kiện (BIM) ở chặng 1**, không lặp ở chặng 2 — dữ liệu một nguồn.
3. Cách làm: **chắt điểm sáng, không bê nguyên phần mềm nào.**

### Bảng chắt điểm sáng (đề xuất TỔNG — COWORK-DỰNG viết thành spec)
| Lấy từ | Điểm sáng | Vì sao hợp IF |
|---|---|---|
| **SketchUp** | Push/Pull một động tác từ mặt → khối · inference bám điểm/cạnh/mặt tự nhiên · công cụ ít mà đủ | Người nội thất dựng khối phòng trong 30 giây, không học |
| **SketchUp** | Nhóm/Component: sửa 1 cái đổi tất cả bản sao | Trùng khớp "sửa đồ chung tự nhân bản" đã chốt ở `SPEC-VAT-LIEU-PBR-IF §3b` |
| **3ds Max** | Gizmo di/xoay/co 3 trục rõ ràng · nhập số chính xác cho mọi thao tác | Đặt đồ đúng mm, không "kéo áng chừng" |
| **3ds Max** | Material Editor quả cầu xem trước sống | ĐÃ CÓ (`9fa870b`) — giữ, nối vào 3D |
| **Revit** | Chọn theo NGỮ NGHĨA (chọn 1 ghế → chọn hết ghế cùng loại) · Properties panel theo loại đối tượng | Inspector tự sinh theo schema — đã là Trụ 3 `SPEC-HA-TANG-UI-IF` |
| **Revit** | Tầng/Level là công dân hạng nhất | Đã có tách tầng — giữ nguyên, đừng làm lại |
| **CẢ 3** | Không cái nào có: **1 nút sang render AI ngay tại viewport** | Đây là chỗ IF thắng — giữ hiển thị nổi bật |
### KHÔNG lấy
Modifier stack của Max (quá sâu, dân nội thất không cần) · Family Editor của Revit (quá nặng) · Layout/Scene của SketchUp (đã có ở chặng 1 + chặng 3).

## 6 · VIỆC PHÁT SINH TỪ FILE NÀY
| # | Việc | Ai | Ưu tiên |
|---|---|---|---|
| 1 | Đổi nhãn 3 chặng trong code (grep `Rendering|Presenting`) | CHINH | 🔴 rẻ, làm ngay |
| 2 | NC-11: IFC 4.3 cho nội thất + QĐ 258 lộ trình BIM (kiểm tận nguồn, ra bảng ánh xạ entity IF ↔ lớp IFC) | COWORK-NC | 🔴 |
| 3 | `SPEC-DUNG-3D-THONG-NHAT.md` theo bảng §5 (một giao diện, không mode) | COWORK-DỰNG | 🔴 |
| 4 | Bổ sung `SPEC-VE-REVIT-MODE` phần trọng tâm NỘI THẤT (§3) — không đập bản cũ | COWORK-VẼ | 🟡 |
| 5 | Rà lại `SPEC-CHANG2-UI-2MODE` — tên file còn chữ "2MODE" nay sai, ghi đính chính đầu file | COWORK-DỰNG | 🟡 |

---
# PHỤ LỤC — VÒNG 2 TÊN (Hoà chốt 03/08, cùng ngày)

## A · BỘ TÊN CHÍNH THỨC — DÙNG NGUYÊN VĂN, KHÔNG BIẾN THỂ
| Lớp | Tên chốt |
|---|---|
| Ứng dụng | **InteriorFlow** (giữ tiếng Anh — tên riêng/thương hiệu, luật cấm-jargon KHÔNG áp cho tên riêng) |
| 3 chặng | **Vẽ · Dựng · Trình bày** |
| 3 chế độ chặng Vẽ | **Sơ phác · Kỹ thuật · Nội thất** |
| 2 chế độ dùng (xuyên app) | **Sơ phác** ↔ **Kỹ thuật chuyên sâu** |

**Vì sao "Dựng" (bỏ chữ "ảnh"):** chặng 2 nay gánh dựng khối 3D · node AI · ảnh · **video** — "Dựng ảnh" bỏ rơi video và khối 3D. "Dựng" phủ hết và bắt nhịp 1-chữ với "Vẽ".
**Vì sao "Nội thất" (bỏ "Cấu kiện"/"BIM"):** đúng định vị BIM-nội-thất vừa chốt (§3). "Cấu kiện" nghe nặng xây dựng, "BIM" là jargon Anh lộ UI. Bộ ba **Sơ phác · Kỹ thuật · Nội thất** cùng hệ tiếng Việt, khách hàng đọc cũng hiểu.
**Vì sao giữ InteriorFlow:** Figma/Notion cũng không dịch tên riêng; đổi tên = đổi logo + repo + đuôi `.idfp` + toàn bộ docs, và mất lợi thế nếu bán quốc tế.

## B · ĐÍNH CHÍNH quyết định cũ (§0d — ghi rõ, không xoá dấu vết)
| Chốt cũ | Ngày | Nay |
|---|---|---|
| 3 mode = "Phác · Kỹ thuật · **Cấu kiện**" | 03/08 02:0x (TỔNG duyệt đề xuất COWORK-UI) | ❌ thay bằng **Sơ phác · Kỹ thuật · Nội thất** — Hoà chốt trực tiếp, mới hơn |
| Chặng 2 = "**Dựng ảnh**" | dùng suốt trong docs | ❌ rút gọn thành **Dựng** |

## C · VIỆC PHÁT SINH THÊM (nối vào §6)
| # | Việc | Ai |
|---|---|---|
| 6 | Đổi nhãn mode: `StageSwitcher.tsx` 'CAD · Phác thảo'→'Vẽ · Sơ phác', 'CAD · Kỹ thuật'→'Vẽ · Kỹ thuật', 'CAD · BIM'→'Vẽ · Nội thất'; `CadMode` giữ nguyên khoá kỹ thuật `sketch/pro/revit` (đổi khoá = vỡ persist, KHÔNG đổi) | CHINH |
| 7 | Grep toàn repo `Dựng ảnh` → `Dựng` ở NHÃN UI. **Trong docs/spec giữ nguyên chữ cũ**, chỉ thêm 1 dòng đính chính đầu file khi sửa — tránh 30 file đổi loạn cùng lúc | CHINH (code) · các vai (docs của mình) |
| 8 | Từ điển tên chuẩn: thêm mục "Bộ tên chính thức" vào `SPEC-NGON-NGU-CHI-DAN` để phiên sau không đặt lại | COWORK-UI |

## VÒNG CUỐI 03/08 — ĐÍNH CHÍNH TOÀN BỘ VÒNG TRƯỚC
Bộ tên chốt: 2D Kỹ thuật · 3D Thiết kế · Trình bày. Lý do: đặt theo CHIỀU KHÔNG GIAN + MỤC ĐÍCH, không theo động tác tay. "Kỹ thuật" = đúng-sai (đúng thước, đúng lớp, xuất hồ sơ); "Thiết kế" = đẹp-xấu (khối, ánh sáng, vật liệu). 2D/3D là ký hiệu quốc tế, không phải jargon chữ → không phạm luật ngôn ngữ.
ĐÃ BỎ (giữ dấu vết, không đặt lại vòng 4): ❌ Phác·Kỹ thuật·Cấu kiện ❌ Vẽ·Dựng ảnh·Trình bày ❌ Vẽ·Dựng·Trình bày (Hoà: "vẽ với dựng trong ngôn ngữ design là một").
REVIT BỊ CẮT ĐÔI THEO CHIỀU, không tìm "điểm chung" nữa: mặt bằng/mặt cắt/ký hiệu/thống kê/in hồ sơ → chặng 2D; khối tường-sàn-trần/đặt đồ/vật liệu → chặng 3D; dữ liệu cấu kiện → tầng dưới cả ba.
LUẬT MỚI (dùng để bác mọi đề xuất sau): **ba chặng là ba ỐNG KÍNH soi vào một nguồn dữ liệu, không phải ba kho dữ liệu.** Phiên nào định copy/đồng bộ/xuất-nhập dữ liệu giữa các chặng là sai từ gốc.

---
# VÒNG CUỐI 03/08 — ĐÈ LÊN TOÀN BỘ VÒNG TRƯỚC (Hoà gật)

## Bộ tên chốt
**2D Kỹ thuật · 3D Thiết kế · Trình bày** · app giữ **InteriorFlow**.
Đặt theo **CHIỀU KHÔNG GIAN + MỤC ĐÍCH**, không theo động tác tay. "Kỹ thuật" = đúng-sai (đúng thước, đúng lớp, xuất hồ sơ). "Thiết kế" = đẹp-xấu (khối, ánh sáng, vật liệu, phối cảnh). Hai loại tư duy khác nhau thật, không phải hai động tác tay khác nhau. `2D`/`3D` là ký hiệu quốc tế, KHÔNG phải jargon chữ → không phạm luật ngôn ngữ.

## Đã BỎ — giữ dấu vết để không đặt lại vòng 5
| Vòng | Tên | Vì sao bỏ |
|---|---|---|
| 1 | Phác · Kỹ thuật · Cấu kiện | "Cấu kiện" nặng xây dựng, lệch định vị BIM nội thất |
| 2 | Vẽ · Dựng ảnh · Trình bày | "Dựng ảnh" bỏ rơi khối 3D + video |
| 3 | Vẽ · Dựng · Trình bày | Hoà: *"vẽ với dựng trong ngôn ngữ design là 1"* — tự tạo mập mờ |

## Revit: CẮT ĐÔI THEO CHIỀU — thôi tìm "điểm chung"
| Phần | Về chặng |
|---|---|
| Mặt bằng · mặt cắt · ký hiệu cửa · thống kê · in hồ sơ | **2D Kỹ thuật** |
| Khối tường/sàn/trần · đặt đồ · vật liệu · nhìn xuyên phòng | **3D Thiết kế** |
| Dữ liệu cấu kiện (tường *là* tường) | **tầng dưới cả ba** |

## Mode
2D Kỹ thuật: **Sơ phác ↔ Kỹ thuật** (Kỹ thuật bổ sung 3D-CAD) · 3D Thiết kế: **Node ↔ 3D** · Trình bày: không mode. Mỗi chặng đúng 2 chế độ đối nhau, không có mode thứ ba lửng lơ.

## ⚖️ LUẬT MỚI — dùng để bác mọi đề xuất sau
**BA CHẶNG LÀ BA ỐNG KÍNH SOI VÀO MỘT NGUỒN DỮ LIỆU, KHÔNG PHẢI BA KHO DỮ LIỆU.**
Phiên nào đề xuất "đồng bộ / copy / xuất-nhập dữ liệu giữa các chặng" là sai từ gốc — vốn dĩ chỉ có một bản. Vẽ tường ở 2D thì 3D có khối; kéo cao tường ở 3D thì bản vẽ 2D đổi theo. Đây là thế mạnh DUY NHẤT không đối thủ nào có (Revit·SketchUp·D5 đều phải xuất-nhập giữa công cụ).
