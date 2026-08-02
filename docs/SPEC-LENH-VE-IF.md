# SPEC · BỘ LỆNH VẼ IF — TẦM NHÌN LỚN (SketchUp tay · Revit não · AutoCAD xương)
**Ngày:** 03/08/2026 · **Trạng thái:** CHỐT · **Tầng:** T1
**Nối:** `SPEC-SEMANTIC-MODEL` · `SPEC-CAD-MODES` · `SPEC-HA-TANG-UI-IF` Trụ 2 (sổ lệnh)

> Hoà 03/08: *"nghiên cứu lệnh vẽ khối SketchUp + 3ds Max, lệnh vẽ Revit, CAD còn thiếu gì —
> rút ra tầm nhìn lớn cho IF."*

## 0 · TẦM NHÌN MỘT CÂU
**Tay của SketchUp · não của Revit · xương của AutoCAD — và cố tình không có phần còn lại.**
3ds Max chứng minh: nội thất KHÔNG cần trình sửa mesh cho tới khi làm đồ rời — mà đồ rời IF lấy từ thư viện.

## 1 · TAY SKETCHUP — 5 cơ chế thần, port nguyên
| Cơ chế | Chi tiết chốt |
|---|---|
| **Inference màu** | chấm xanh lá=endpoint · lam=midpoint · đỏ=trên cạnh · tím=trên mặt · vàng=gốc; đường gióng đỏ/lục/lam theo trục; **Shift = khoá inference đang bắt · phím mũi tên = khoá trục** |
| **Gõ số SAU thao tác** | kéo đại → gõ `2400` Enter → CHỈNH LẠI ĐƯỢC bằng gõ số mới cho tới thao tác kế. Nhận `3x` (nhân bản 3) và `/3` (chia đều 3) khi Move-copy |
| **Push/Pull** | **double-click mặt khác = lặp đúng khoảng cách vừa kéo** · đẩy xuyên tới mặt đối diện = **khoét thủng** (cách cả thế giới SketchUp mở cửa sổ) · Ctrl = giữ mặt gốc (chồng tầng) |
| **Vẽ lên mặt tự chia** | vẽ đường cắt ngang mặt → mặt tách làm 2, push/pull riêng từng nửa |
| **Thước dây** | kéo từ cạnh = đường gióng tại khoảng cách gõ vào; đo 2 điểm rồi gõ số mới = **scale cả model** (chuẩn hoá bản scan/underlay) |
**Cố tình KHÔNG port:** sticky geometry (mô hình ngữ nghĩa của IF miễn nhiễm sẵn — đây là điểm hơn SketchUp) · Follow Me (phào chỉ là chi tiết render → D5) · Scale tự do lên kiến trúc.

## 2 · NÃO REVIT — 5 hành vi hệ thống, bỏ hết máy móc
| Lấy | Cách IF làm | Bỏ của Revit |
|---|---|---|
| **Tường = đối tượng có location line** | centerline / mặt trong / mặt ngoài — đổi độ dày không xê mặt đang căn | family editor |
| **Nối tường tự sạch** | MỘT kiểu nối duy nhất, KHÔNG có trình sửa nối — trình sửa nối là thứ "gây chấn thương nhất" của Revit (nguyên văn cộng đồng) | 3 kiểu Butt/Miter/Square + ma trận priority |
| **Cửa/cửa sổ là con của tường** | tự khoét lỗ · di theo tường · chết theo tường · **Space đảo chiều mở** · không đặt được ngoài tường | — |
| **Room tự nhận biên** | bấm vào vùng kín → tự tính m² (BOQ ăn ngay) + **đường chia phòng** cho không gian mở | volume 3D, phase |
| **Type vs Instance** | đổi *loại tường/matId* một lần → cả dự án đổi (lời hứa SketchUp không giữ được); override từng cái vẫn cho | worksharing, grid, datum đa tầng |
Câu thần chú type/instance: *"đổi giá trị này thì MỌI bản sao có nên đổi theo không?"* — có = type, không = instance.

## 3 · XƯƠNG AUTOCAD — 12 lệnh dân trong nghề dùng mỗi ngày, xếp hạng
| # | Lệnh | IF làm thành |
|---|---|---|
| 1 | **BLOCK/INSERT** | thư viện khối 46 + ATLAS — đồ đạc là instance có đếm được (nối schedule/BOQ) |
| 2 | **MATCHPROP** | **ống hút thuộc tính** (eyedropper): copy lớp/nét/matId từ vật này sang vật kia — rẻ mà được yêu nhất |
| 3 | **STRETCH** | kéo tường = phòng co giãn, kích thước tự cập nhật (hành vi ngữ nghĩa sẵn có — GIỮ) |
| 4 | **LAYER STATES** | = **Layer State ở đỉnh sidebar** (đã chốt SPEC-CAD-SHELL-V3): Bố trí nội thất / Sơ đồ điện / Bản cho khách |
| 5 | **XREF** | underlay khoá (PDF/DWG/ảnh) + chỉnh opacity; live-ref để pha sau |
| 6 | **SCALE/ROTATE by Reference** | căn underlay bằng 2 điểm đã biết (kết hợp thước dây §1) |
| 7 | **ALIGN** | đặt đồ vào hốc xéo bằng ghép 2 cặp điểm |
| 8 | **PEDIT/JOIN** | chỉ cần "hàn kín vòng" cho linework nhập — phòng ngữ nghĩa đã giết nhu cầu này |
| 9 | **WIPEOUT** | nhãn/tag tự che nền — minimal CAD nào cũng quên, thiếu là bản vẽ rối |
| 10 | **REVCLOUD** | **mây góp ý + comment** — với app có khách xem, cái này còn quan trọng hơn trong AutoCAD; nối collab G2 |
| 11 | **DIVIDE/MEASURE** | "chia đều N đèn dọc trần" — nhỏ mà đọc như phép thuật |
| 12 | FILLET R=0 | đã có trong nối tường tự sạch |

## 4 · KIỂM KHUYẾT — IF đang thiếu gì (đối chiếu code thật, PHU kiểm lại bằng grep)
Đã có: L·PL·REC·C·ROOM · offset · trim · dim · hatch · block 46 · DXF/DWG · zone.
**Thiếu, xếp ưu tiên:** ① ống hút thuộc tính ② gõ-số-sau-thao-tác kiểu VCB (nhận `3x`, `/3`)
③ đường gióng thước dây ④ underlay + căn 2 điểm ⑤ mây góp ý ⑥ chia đều dọc path
⑦ nhãn tự che nền ⑧ Space đảo chiều cửa ⑨ đường chia phòng (không gian mở) ⑩ ALIGN 2 cặp điểm.

## 5 · SUY RA CHO 3 MODE CHẶNG VẼ
- **Phác thảo** (tablet): tay SketchUp nguyên bộ — inference to, push/pull, gõ số sau.
- **Chuyên** (chuột): + xương AutoCAD đủ 12 · gõ lệnh · layer states · in ấn.
- **Revit** (BIM-lite): + não Revit §2 — tường/cửa/room parametric, type/instance, cây cấu kiện ở Navigator.
Ba mode = **một sổ lệnh, ba lát cắt `when`** (`SPEC-HA-TANG-UI-IF` Trụ 2) — không phải ba bộ code.

---
**Nguồn chính:** [SketchUp inference](https://mastersketchup.com/sketchup-inference/) · [Measurements Box](https://help.sketchup.com/en/using-measurements-box) · [Push/Pull](https://help.sketchup.com/en/sketchup/pushing-and-pulling-shapes-3d) · [Revit wall joins — BIM Pure](https://www.bimpure.com/blog/8-tips-to-understand-revit-wall-joins) · [Revit rooms](https://help.autodesk.com/cloudhelp/2025/ENU/Revit-ArchDesign/files/GUID-65668F88-4429-4992-AA0D-1C4FBDCFA650.htm) · [Type vs Instance](https://www.revitbook.com/blogs/revit/type-vs-instance-parameters-revit) · [3ds Max Sweep (vì sao bỏ)](https://help.autodesk.com/cloudhelp/2021/ENU/3DSMax-Modifiers/files/GUID-947CC299-20EC-4182-BEF7-FE88A46B0C25.htm) · [MATCHPROP](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-LT-MAC/files/GUID-BD476C7C-2CA4-4FB2-8A9E-EAAD5A072445.htm) · [REVCLOUD](https://novedge.com/blogs/design-news/autocad-tip-revcloud-standards-and-workflow) · [Divide/Measure](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-DidYouKnow/files/GUID-1823FF63-6952-47DD-89F8-29E4AA5B2582.htm)
