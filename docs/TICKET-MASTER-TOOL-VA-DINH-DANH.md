# TICKET · MASTER TOOL · NHÓM CONTROLNET · CỬA ĐỊNH NGHĨA FILE · ĐỊNH DANH BẰNG MÀU

> Hoà đặt bài 15/08 và yêu cầu **điều tra kỹ trước khi nói, chỗ nào không làm được phải nói thẳng**.
> T phóng 4 mũi điều tra chỉ-đọc (master tool · ControlNet/đường gióng/khối lượng · file nhập vào ·
> kính-neon-định danh). Mọi khẳng định dưới đây có file:dòng. Đây là **đề xuất chờ Hoà gật** —
> chưa mở entry registry, chưa code.

---

## 0 · TRẢ LỜI THẲNG TRƯỚC — 3 điều KHÔNG làm được như mô tả

| Điều anh mô tả | Sự thật đo được | Làm được cách nào |
|---|---|---|
| **"gắn id vật liệu lên phối cảnh để thống nhất khối lượng tổng"** | 🔴 **Không tính được khối lượng từ ảnh ở mức dám báo giá.** BOQ hiện chỉ tính từ **bản vẽ 2D** (hatch + block có `specId`, `lib/boq/compute.ts:1-30`); từ model 3D **chưa có engine** (chính file tự khai `:16-20`); từ ảnh **chỉ đếm được MÓN RỜI**, không ra m² (`lib/vision/to-cad.ts:20-24`). Đo m² từ một tấm ảnh phẳng là ước lượng có sai số lớn — đưa vào bảng giá là nguy hiểm | **Đảo chiều**: ảnh render **từ scene IF** thì mask = chiếu entity xuống, **khối lượng lấy từ MÔ HÌNH (chính xác)**, ảnh chỉ là mặt để bấm chọn. Đúng ghi chú sẵn trong `lib/grounded-render/types.ts:56-70`. Ảnh ngoài (khách gửi) thì chỉ được gán id **định tính**, dán nhãn "ước tính", KHÔNG vào BOQ |
| **"đường gióng + id vật liệu"** hiểu như một cơ chế | 🔴 **Hai đường khác nhau, không gộp được.** ControlNet đang dùng canny/depth (`lib/ai/models.ts:28,42-43`) — nó khoá **NÉT**, không neo **màu/vật liệu**. Bằng chứng thực nghiệm chính ta có: lượt render Westlake 14/08 chạy canny đã **đổi travertine thành gỗ, thêm nguyên bộ sofa không có trong thiết kế** (`docs/bao-cao-phien/2026-08-14-RW-render-loat.md` §4) | **Tách hai kênh**: đường gióng → nhập vào **control image** (khoá hình học) · id vật liệu → nhập vào **mask + inpaint từng mảng** (khoá chất liệu, đường Grounded Render `ai.regionrender` đã chạy v0) |
| **"3 kích thước cửa sổ"** | 🟡 **Chưa tồn tại ở đâu — cả code lẫn spec.** `ToolWindow.tsx` có **đúng 1 cỡ cứng**, **1 cửa sổ/lượt**, không kéo, không resize, nút `−` thực chất **đóng hẳn** (docstring `:15-17` tự thú). Chốt 01/08 hứa "tối đa 3 window, cái thứ 4 tự thu" — **chưa bao giờ code** | Làm được, nhưng là **xây mới thật**, không phải chỉnh. Xem §1 |

---

## 1 · MASTER TOOL — máy có sẵn hai nửa, thiếu đúng sợi dây giữa

**Định nghĩa Hoà đưa** (T ghi lại thành chuẩn): *master tool = tính năng được đóng gói để tạo
thẳng ra MỘT giá trị nội dung, bằng tổ hợp các lệnh cấu thành, sắp xếp chung trên một cửa sổ nổi.*

### Đang có gì
| Mảnh | Trạng thái | Bằng chứng |
|---|---|---|
| **Gói lệnh (ruột)** — `NodeGroup` cờ `isMacro`: gom nhiều node thật, **tự gom tham số con ra mặt ngoài** (`collectExposableParams`), **tự tính cổng vào/ra xuyên biên** (`computeBoundaryPorts`), **tự cộng tổng credit** | ✅ chạy | `lib/nodes/macro.ts:4-7,58-74,80-118,133-143` |
| **Cửa sổ nổi (vỏ)** | ✅ chạy, tối giản | `components/render-studio/ToolWindow.tsx:28-109` |
| **Node MASTER** — 12 cái | ✅ chạy | `lib/render-studio/task-cards.ts:34-120`, `sidebar-zones.ts:53-56` |
| **Ngăn xếp lệnh không phá huỷ** (bật/tắt từng bước, đổi thứ tự) | ✅ chạy, nhưng ở **CAD 3D** | `lib/three/build-recipe.ts:93`, `lib/cad/model.ts:490-513` |
| **Dây macro ↔ tool window** | 🔴 **KHÔNG CÓ** | macro không mở được thành cửa sổ có mặt điều khiển riêng |

⇒ Master tool **không phải xây từ đầu**: nó là `macro` (ruột) + `ToolWindow` (vỏ) + `BuildRecipe`
(cách xếp bước) — ba thứ đã sống, chưa ai nối.

### 3 nấc kích thước — T đề xuất, kèm lý do bác "icon"
| Nấc | Hình dạng | Vì sao |
|---|---|---|
| **① Thu — PILL TRẠNG THÁI** (44px, capsule, icon + 1 chữ + cung tiến độ) — **KHÔNG phải icon trần** | Master tool là thứ **chạy nền lâu** (render · upscale · tạo sinh). Icon câm không nói được "3/5 xong · còn ~2 phút". App đã có đúng một ví dụ chạy thật: pill hàng đợi render (`RenderQueuePanel.tsx:96-121`, `var(--tap-lg)`=44). Icon trần còn phạm NT-8/K14 "icon nào cũng có nhãn" |
| **② Làm việc — cửa sổ nổi** (cỡ hiện tại `min(1040px,94vw) × min(720px,100vh-110px)`) | Đã có, giữ nguyên. Nhớ vị trí + cỡ theo từng master tool (nay chỉ nhớ `view`+`cardId`, `lib/render-studio/tool-mode-ui.ts:22-23`) |
| **③ Toàn màn** | Đường này **đã có sẵn** cho màn ≤7 inch (`ToolWindow.tsx:34,43`) — chỉ cần cho người dùng gọi tay trên desktop, không viết mới |

> Nấc ① là chỗ T **không theo** gợi ý "nhỏ nhất là icon". Nói rõ để anh bác nếu muốn.

### Quy hoạch theo khối chức năng (ý anh, T xếp lại)
`nhóm TẠO SINH` (sketch2render · clay2render · exterior · furniture · emptystaging) ·
`nhóm CHỈNH SỬA` (localedit · materialswap · relight · removebg · upscale) ·
`nhóm KHỐNG CHẾ` (ControlNet §2 — MỚI) · `nhóm ĐO` (measureobject).
12 node master hiện có phủ 3 nhóm đầu; **nhóm khống chế là cái phải xây**.

### Cái phải xây mới, nói thẳng
Nhiều cửa sổ cùng lúc · xếp chồng z-index · kéo di chuyển · resize góc · nhớ chỗ.
**Không có gì trong số này tồn tại.** Đây là phần tốn nhất của master tool, không phải phần lệnh.

---

## 2 · NHÓM CONTROLNET — cái làm được ngay, cái phải chờ

### 2.1 Đường gióng · điểm tụ
- ✅ **Điểm tụ đã tính được**: `calibrateFromVanishingPoints()` cho **3 điểm tụ**
  (`vertical/horizA/horizB`) + tiêu cự + ma trận xoay + `confidence` — `single-view-metrology.ts:71,210,251`.
- 🟡 **"Đường chân trời" chưa có tên trong code** (grep `horizon` = 0) — **nhưng suy ra được gần
  như miễn phí**: đường nối `horizA`–`horizB` **chính là** đường chân trời. Đây là món rẻ nhất
  trong cả ticket.
- 🔴 **UI kéo/sửa đường gióng: KHÔNG CÓ.** Hiện chỉ có click 2 điểm để khai vật chuẩn tỉ lệ
  (`ToolModeForm.tsx:151-164`) — khác hẳn việc sửa đường tụ.
- **Làm được**: cho KTS kéo 2 đầu đường chân trời + thêm/sửa đường gióng, rồi **vẽ các đường đó
  vào control image** trước khi gọi canny. Đây là kỹ thuật chuẩn, không cần model mới.
  ⚠️ Nhưng nhớ giới hạn: nó khoá **hình**, không giữ **vật liệu** (bằng chứng Westlake §0).

### 2.2 ID vật liệu gắn trên phối cảnh
| Mảnh | Trạng thái |
|---|---|
| Vùng ảnh có id (`RegionId`) | 🟡 có, nhưng là **danh sách tĩnh 9 vùng cố định** (sàn/tường/trần…), **chưa** chiếu từ entity — `lib/grounded-render/types.ts:56-70` |
| Tách vùng tự động | ✅ **SAM2 chạy thật** (`lib/ai/models.ts:102-105`, `SmartSelectModal.tsx:288`) · BiRefNet tách nền ✅ · `ai.idmask` chạy thật **nhưng là median-cut phân cụm MÀU, không hiểu ngữ nghĩa** (`lib/render-core/idmask-core.ts:4-9`) — đừng nhầm nó là segmentation |
| Vẽ tay vùng | ✅ `MaskPainterModal` |
| `matId` | ✅ = `ProductSpec.sku` (`lib/cad/materials.ts:58-65`) |
| **Nhóm/họ vật liệu** | 🔴 **KHÔNG CÓ cột dữ liệu.** Chỉ có `kind` (5 loại lớn) + `matGroup` là **filter UI tạm** trong Thư viện (`LibrarySheet.tsx:150`) |
| **Kích thước viên** (gạch 300×600) | 🟡 gần nhất là `uvScaleMm` — nhưng đó là **chu kỳ lặp vân texture** thuộc `MaterialPbr` (lớp thị giác), **không phải** kích thước hàng hoá. Luật 2.1.9.i cố ý tách thị giác ↔ thương mại ⇒ **thêm trường vào `ProductSpec`, KHÔNG nhồi vào PBR** |
| Hao hụt · đơn giá · đơn vị | ✅ `wastagePercent`, `priceVnd`, `unit`, `packagingSpec` (`schema.prisma:401-426`) |

⇒ Ý *"cùng id = xài chung vật liệu, id cùng họ thì đứng một nhóm"* **đúng hướng và rẻ**: thêm
`familyId` vào `ProductSpec` + gán `matId` cho từng vùng. Phần đắt không nằm ở id — nằm ở **khối
lượng** (§0).

### 2.3 Nhãn không được đè lên hình
- ✅ **Thuật toán né nhãn ĐÃ CÓ và đã nghiệm thu mắt**: `lib/cad/label-placer.ts` — 8 hướng dịch +
  leader kéo ra ngoài; entry `label-ne-hinh` v1+v2 đều `xong`.
- 🔴 Nhưng **chỉ chạy cho bản vẽ 2D/PDF**, chưa có trên ảnh render.
- **Làm được**: thuật toán này thuần hình học, **tái dùng được nguyên** cho nhãn trên ảnh — đây là
  ví dụ sạch của luật "một cỗ máy, nhiều mặt tiền". Kèm quy tắc: nhãn đứng **ngoài mép vùng**, có
  leader mảnh trỏ vào, không bao giờ nằm đè lên giữa mảng vật liệu.

---

## 3 · CỬA ĐỊNH NGHĨA FILE — tách riêng là ĐÚNG, và nó lấp một lỗ thật

Anh đề xuất tách thành cửa sổ riêng, không chung với master tool. **T đồng ý**, vì đo ra hiện trạng
tệ hơn dự đoán: **4 lối vào file chạy song song, không lối nào biết lối nào.**

| Lối | Thực chất |
|---|---|
| `/library/ingest` | chỉ ghi **localStorage**, không đụng DB (`lib/refingest.ts:153-159`) |
| "Nạp hàng loạt" trong Thư viện | chỉ `.idfc` đọc thật; **loại khác là MOCK** — bấm "Đưa vào kho" hiện toast nhưng **không lưu đi đâu** (`BulkIngestMode.tsx:46-51,152-177`) |
| Nút Tải lên | ảnh thành node ngay, không hỏi gì (`UploadButton.tsx:23-38`) |
| Menu Tệp chặng Render | nơi **duy nhất** định danh bằng **nội dung byte** thật (`RenderIOMenus.tsx:210`) |

Và: **không có màn nào bắt khai file là gì trước khi dùng** — chỉ có dropdown `usage` sửa được
*sau*, không chặn luồng. **Không có** phân loại vai trò *sửa / tham chiếu / bị comment* (grep 0).
Ba hệ comment đang sống đều neo vào toạ độ màn hình / node / toạ độ CAD — **không hệ nào neo vào file**.

⇒ **Cửa Định Nghĩa** = nơi mọi file đi qua **một lần duy nhất** khi vào app: khai *vai trò*
(sửa · tham chiếu · bị comment), *chủng loại*, *nguồn* (`DataOrigin` — chưa có, entry
`nhan-nguon-reset` đang `chua`), rồi mới rơi vào kho. Bốn lối kia thành **bốn lối gọi cùng một
cửa**, không phải bốn cửa.
⚠️ **Nợ phải trả trước**: cái kho "mock chờ duyệt" kia phải có backend thật, nếu không Cửa Định
Nghĩa chỉ là một màn đẹp phía trước một cái hố.

---

## 4 · ĐỊNH DANH BẰNG MÀU — giữ ý, đổi vật liệu thể hiện

**T khuyên KHÔNG dùng neon ửng đáy**, ba lý do (không phải khẩu vị):
1. **Kênh ánh sáng đã bị chiếm**: node card dùng đúng viền-sáng cho *đang chạy*
   (`node-running-halo`/`glass-gradient-run`, `globals.css:404-463`). Thêm glow cho *định danh* là
   hai nghĩa đè nhau.
2. **Luật đã chốt**: NT-11 *"cấm glow tĩnh trang trí"* · cảnh báo #1 của bộ nguyên tắc 14/08:
   *"Chỉ giữ khi glow = dữ liệu sống (đang render/cảnh báo), không nền tĩnh."*
3. **Hover mới biết thì không quét được màn**: canvas 40 node mà phải rê từng cái. Định danh phải
   thấy được **lúc đứng yên**; hover chỉ *nhấn mạnh*, không *tiết lộ*.

**Đề xuất thay**: định danh = **dải màu ĐẶC 2px ở đáy card** (hoặc sống lưng trái) — thấy ngay,
đọc được cả trên ảnh chụp màn; hover thì dải **đậm lên**, không phát sáng. Glow để nguyên cho
trạng thái sống.
· Card node **chưa có** phần tử nào ở đáy — phải chèn 1 `div` (`InteriorNode.tsx`, trước `</motion.div>`), việc nhỏ.
· 🔴 **Chưa có hệ màu phân loại vật liệu/file.** `CATEGORY_META` 6 màu hiện **chỉ dành cho loại
  node** (`lib/types.ts:194-201`) — **cấm mượn** sang vật liệu, sẽ đụng nghĩa. Cần bảng màu định
  danh riêng; T đề xuất **≤8 bậc** (quá 8 thì mắt không phân biệt nổi, phải thêm hình dạng/ký hiệu).

---

## 5 · THỨ TỰ ĐỀ XUẤT — rẻ và chắc trước
| | Việc | Vì sao trước |
|---|---|---|
| 1 | **Đường chân trời** từ 2 điểm tụ đã có + UI kéo sửa | Rẻ nhất, dùng lại engine 958 dòng sẵn có, thấy được ngay |
| 2 | `familyId` cho `ProductSpec` + kích thước viên (vào lớp thương mại, không vào PBR) | Cột dữ liệu nhỏ, mở đường cho mọi thứ sau |
| 3 | **Nối `label-placer` sang ảnh render** | Thuật toán đã nghiệm thu mắt, chỉ thêm mặt tiền |
| 4 | **Dây macro ↔ tool window** + 3 nấc kích thước | Master tool thành thật; chưa làm đa cửa sổ |
| 5 | **Cửa Định Nghĩa file** (sau khi kho có backend thật) | Lấp lỗ 4-lối-vào |
| 6 | RegionId chiếu từ entity → khối lượng **từ mô hình** | Món đắt nhất, nhưng là chỗ IF ăn đứt đối thủ |
| — | ⛔ Đa cửa sổ + kéo/resize | Để cuối. Tốn, và chưa ai kêu thiếu |

**Chưa mở entry registry** — chờ Hoà gật từng mục, gật cái nào mở entry cái đó (luật: chốt không
vào registry coi như chưa chốt).
