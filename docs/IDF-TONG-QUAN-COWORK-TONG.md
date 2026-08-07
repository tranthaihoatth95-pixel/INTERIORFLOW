# IDF — TỔNG QUAN TOÀN BỘ (bản xuất của COWORK-TỔNG)
### Tầm nhìn · Hệ sinh thái · Điều tra · Quy trình · Quyết định · 2026-08-06
> Tài liệu trung tính (0 tên khách / 0 số liệu dự án). Nguồn chống quém cho mọi phiên sau.

---

## 1 · TẦM NHÌN
**InteriorFlow (IF)** = công cụ cho studio thiết kế nội thất/kiến trúc: một canvas node + AI biến ý tưởng → bản vẽ CAD → 3D/render → hồ sơ trình bày/báo giá, khép vòng tới bàn giao khách. Không chỉ ship IF: còn cả **thư viện block CAD, vật liệu, asset 3D/video, và hệ workspace quản lý công việc**.

Nguyên tắc xuyên suốt: **thiết kế trước = tiền đề chống quên** (vẽ hết giao diện rồi mới build); **đường ngắn nhất – rẻ nhất – an toàn nhất**; **tách theo surface để không đốt token nhầm chỗ**.

---

## 2 · HỆ SINH THÁI IDF (4 phần)
| Vai | Tên | Việc |
|---|---|---|
| Máy phát thiết kế + **workspace** | **IF** | CAD · node · 3D · BOQ · trình bày · quản lý việc |
| Máy thu (phone capture) | **ArchiNote** | chụp/ghi công trường → nạp vào IF |
| Xương sống dữ liệu | **Larkbase** | nhân sự · dự án · task (ĐỌC-only vào IF) |
| Lớp việc + đồng bộ | **SyncWork** | Kanban·Gantt·chat·dashboard — đồng bộ xuyên cả hệ |

- Nối bằng **format `.idf` chung** (K1: một Doc, ba lens).
- **🔒 SyncWork**: app độc lập cũ ĐÃ BỎ; TÊN dùng cho **lớp workspace của IDF**. Cấm chuyển các tính năng này ra app ngoài.
- **Business-ops** (hoá đơn·công nợ·CRM·chấm công) → để Larkbase, KHÔNG kéo vào IF.

---

## 3 · NGUYÊN LÝ KIẾN TRÚC (K1–K4)
- **K1** — Một Doc, ba lens (2D/3D/trình bày). Không có `syncXtoY`; sửa một nguồn, các lens tự theo.
- **K2** — Component là **tầng dữ liệu** nằm dưới mọi chặng, không phải thứ vẽ riêng từng chặng.
- **K3** — **Khai báo thắng suy đoán.** Ngữ nghĩa phải tường minh; máy đoán phải mang cờ `inferred` và lộ mặt cho người kiểm, không giả làm khai báo của người.
- **K4** — Chỉ thêm field khi **có nơi tiêu thụ** (chống field chết).

---

## 4 · LUẬT TRUNG TÍNH (3 tầng)
1. **SẢN PHẨM** — mọi studio dùng chung (repo). 0 tên khách, 0 brand hex, 0 tên studio hardcode.
2. **STUDIO** — brand kit riêng (màu/logo/khổ) — nạp lúc chạy, không hardcode.
3. **DỰ ÁN** — dữ liệu khách (`.idf` / thư mục `2407-Test/` gitignore). KHÔNG bao giờ vào repo.
- Gu chảy XUỐNG (sản phẩm→studio→dự án), không chảy ngược lên.
- Enforce bằng **test** (`brand-neutrality.test`) + `grep -a` (không dựa trí nhớ).

---

## 5 · ĐIỀU TRA — 8 GỐC GAP + trạng thái (06/08)
Phương pháp: đi **3 task khách thật** như phép thử IF (§0q — task là phép thử, KHÔNG phải deliverable), lộ ra IF thiếu gì → sửa IF. 55 GAP → 8 gốc.

| Gốc | Vấn đề | Trạng thái |
|---|---|---|
| **A** danh tính | entity phẳng mất `elementType` + id bản chèn | 🟢 elementType + chọn cụm ĐÓNG |
| **B** nối dây | thuật toán "có code, 0 nơi gọi" (orphan ~½) | 🟡 nối một phần |
| **C** món rời | BOQ/FF&E/kho không nhận món rời | 🔄 đang fix |
| **D** khai≠vẽ | poché không neo cấu kiện | 🔴 hồ sơ nhập chưa neo (G-M1-08) |
| **E** kiểm soát sửa/undo | nở poché vô điều kiện, zoom 2 khung | 🟡 |
| **F** hợp đồng mock UI | mock đỏ, thiếu trang con | 🟡 LÀN C xong phần in/giấy |
| **G** thư viện mỏng + 2 cửa | 8 block văn phòng, 2 đường thả | 🔴 |
| **H** jargon lộ UI | tên hàm nội bộ hiện ra người dùng | 🟢 dọn dần |

**Bug hệ thống lớn tìm được:**
- **Bẫy NUL byte (G-M1-15)** — `grep` mặc định phiên Claude Code (ugrep -I) IM LẶNG bỏ qua tệp có byte điều khiển → kết luận "0 nơi gọi" có thể DƯƠNG TÍNH GIẢ. Suýt đưa tên khách lên GitHub. Chữa: **`grep -a` bắt buộc (§0t)** + CI scan. Đã gỡ NUL khỏi `dxf.ts`.
- **G-M1-18 (blocker, ĐÃ SỬA)** — file IF xuất ra trước đây **0/6 mở được bằng CAD ngoài** (thiếu `100/AcDbPolyline` + `100/AcDbHatch`). Sau sửa: **6/6 mở sạch, 0 lỗi audit**. Từ đây "giao bản vẽ cho người khác" có bằng chứng thật.
- **G-M1-19 (hồi quy, ĐÃ SỬA)** — bộ suy tự bật cho đường nạp block thư viện → 30/54 block gán sai thành `space`. Chữa 1 dòng `inferRules:null`.
- **G-M1-20 (ĐÃ SỬA)** — nhãn UI nói ngược sự thật + 4 field chết (K4). Đã sửa + nối.

**Còn treo:** G-M1-08 (poché hồ sơ nhập) · G-M1-04 (zoom 2 khung) · G-M1-07 (cây block lồng 5 cấp ép còn 1) · G-M1-01 (DXF nạp chưa worker/huỷ) · Gốc C/G.

---

## 6 · QUY TRÌNH VẬN HÀNH
**Vai:** COWORK-TỔNG (điều phối, giữ sổ, soạn phiếu, KHÔNG code) · phiên Code (mỗi phiên 1 mảng) · mỗi phiên phóng **1 agent làm + 1 agent phản biện**.

**Luật cứng:**
- **V6** — phiên KHÔNG commit. Hoà commit.
- **N7** — `grep -a` BƯỚC 0 trước khi sửa (đã có thì nối, đừng dựng lại).
- **N6** — đóng đỏ = **tính năng chạy THẬT** (render/chạy trên dev server), không phải "file đã đổi".
- **Một thư mục = một phiên chủ** (chống trùng — đã mất việc nhiều lần vì 2 phiên cùng 1 file).
- **§0u** — chỉ TỔNG ghi `GAP-IF.md`; phiên ghi delta vào M-OUT.
- **§0k** — viết cho kiến trúc sư, không cho IT; một mốc chốt, không lắt nhắt; TỔNG tự quyết kỹ thuật, chỉ hỏi Hoà về ý đồ sản phẩm.
- **§0t** — cấm byte điều khiển thô; `grep -a` mọi lúc.

**Chống trôi:** mọi việc rải rác đẩy lên **ngọn nguồn sự thật** (sổ + 3 bản đồ), append-only, versioning không ghi đè.

---

## 7 · PHỦ THIẾT KẾ + PHÂN CÔNG CỤ (tối ưu né limit)
| Surface | Ăn limit Code? | Việc |
|---|---|---|
| Claude Design | ❌ | vẽ HẾT giao diện (nền chống quên) — 15 màn đang có/vẽ, ~24 còn thiếu |
| Figma | ❌ | design system token/component |
| SketchUp MCP | ❌ | **asset 3D** (KHÔNG dùng cho block CAD — sai định dạng `.skp`↔`.dxf`) |
| Code (local + phiên) | ✅ gần limit | build/apply + đóng đỏ, tuần tự |

**Block CAD → làm NATIVE trong IF** (block tham số như `CLUSTER_SPECS`), ra thẳng `.dxf`, không qua SketchUp.
**Nhịp:** tới 11/8 (limit reset) vắt Claude Design/Figma/SketchUp; Code chỉ nhấp việc dở.

**3 bản đồ luôn hiện:** `CAY-GIA-PHA-IDF.html` (thiết kế app) · `BANG-PHAN-VIEC-IDF.html` (quy trình) · `BANDO-PHU-THIET-KE-IF.html` (phủ thiết kế).

---

## 8 · LỘ TRÌNH XONG IF (tuần tự — chi tiết ở `LO-TRINH-XONG-IF.md`)
PHA 1 đóng nốt đỏ CAD → PHA 2 xong Gốc C data → PHA 3 apply giao diện có thiết kế → PHA 4 nối vàng (orphan) → PHA 5 SyncWork (design+build) → PHA 6 đấu nối ArchiNote/Larkbase.
**Vạch đích "xong IF" = hết PHA 4.**

---

## 9 · QUYẾT ĐỊNH ĐÃ GHIM (không mở lại)
1. **SyncWork** = lớp workspace của IDF (app cũ bỏ). `idf-quyet-dinh-kien-truc.md`.
2. **Agent chạy LOCAL** (không cloud) — cloud phải push/PR = phạm V6, không verify localhost.
3. **Block CAD native IF**, không SketchUp; **SketchUp chỉ cho asset 3D** (cần chốt đường xuất glb/obj trước).
4. **Repo private** → commit backup an toàn; dọn demo/detech + docs chỉ bắt buộc TRƯỚC khi public.
5. **Luật byte điều khiển + CI scan** vào `CLAUDE.md` (chốt, chờ ghi).
6. **Business-ops** không vào IF.

---

## 10 · HỆ DỮ LIỆU LÕI — `.idf` · vật liệu · component
### 10a · Format `.idf` (hợp đồng dữ liệu chung)
- Là **một Doc duy nhất** (K1) — mọi lens (2D/3D/trình bày) và mọi app (IF·ArchiNote·Larkbase·SyncWork) đọc/ghi cùng nó.
- Phía IF đã đọc/ghi ở: `lib/root-folder.ts` · `lib/disk-sync.ts` · `lib/present-editor/model.ts` · `lib/ffe/item.ts`. XDATA giữ `storey`/`elementType`/id-bản-chèn qua vòng xuất–nạp.
- **Cấm đẻ format thứ hai**: ArchiNote chỉ là ống nạp vào cùng `.idf`, không schema riêng.
- Dữ liệu khách nằm trong `.idf`/dự án (gitignore), KHÔNG vào repo.

### 10b · Thư viện vật liệu (kho / warehouse)
- Cửa nhập: `lib/materials/warehouse/` — `parseSpreadsheetFile` → `guessMapping`/`saveMapping` (ghép cột) → `buildImportRows` → `apply-import`.
- Suy PBR theo loại: `lib/materials/pbr-from-category.ts`. Màu: `lib/colors/larkbase.ts` · atlas: `lib/lark/atlas-material-map.ts`.
- Kho THẬT đã có trường `materials`/`colorHex`/`hUp` — **cửa nhập Excel chỉ 9 trường, chưa nối tới** (G-M3-05). Bug ghép cột chuỗi-con (G-M3-06) + ép loại 'material' (G-M3-07) — đang fix ở Gốc C.
- Còn thiếu: trường phòng/vị trí trong `ProductSpec` (G-M3-08, cần migrate).

### 10c · Hệ component / block (K2)
- **Component = tầng dữ liệu** dưới mọi chặng. `ProductSpec` (mã · kind material/furniture · materials · colorHex · room).
- Block CAD: **54 block `.dxf`** (`public/cad-library/manifest.json`, 12 nhóm; `van-phong` mỏng 8) + **cụm tham số** `CLUSTER_SPECS` (6 loại, `workstation-clusters.ts`).
- Danh tính bản chèn: `srcInsertId`/`expandIdsByInsertGroup` (`model.ts`) — chọn/đếm được MỘT cấu kiện, giữ qua xuất DXF (đã đóng G-M1-06/07/18).
- Món rời FF&E: `lib/ffe/*` (item·sheet·from-measurement·port) — hồ sơ nhiều món (mã·ảnh·finish·vendor·giá·SL·duyệt) đang bổ (G-M3-04).
- **Bổ block văn phòng thiếu (lễ tân·booth·rack·locker·bàn cao·màn họp) → làm NATIVE tham số như `CLUSTER_SPECS`, ra thẳng `.dxf`** (G-M3-12/13, PHA 1.5). KHÔNG qua SketchUp.

---
_Bản này là ảnh chụp hiểu biết tại 06/08/2026. Cập nhật khi có thay đổi lớn (versioning, không ghi đè)._
