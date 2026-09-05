# 2026-08-20 — Ảnh → Spec: nối năng lực lên mặt người dùng

**Trả MAIN:** Image→Spec = **LIVE** · cửa duyệt **G1-G4 đủ bốn, chạy thật** · ngữ pháp sự thật **có hiệu lực và có test canh** · **BROWSER PASS** (:3001, ảnh thật, ghi thật, đã dọn).

---

## ① Việc được giao
Nối `image-to-3d` lên `StageToolbelt`; chạy lõi trên ảnh nguồn thật; trình kết quả cho người xem;
áp đúng ngữ pháp sự thật (suy-ra ≠ đo được ≠ đã kiểm · vật liệu là ứng viên · cấm bịa SKU);
bốn cửa duyệt ít ma sát; kết quả đã duyệt ghi vào `AssetRepresentation`, **không nhân bản asset**.

## ② Tiền đề đã đo lại (⓪)
| Khai trong phiếu | Đo tại nguồn | Kết |
|---|---|---|
| lõi `lib/capabilities/image-to-3d.ts` đã có cửa duyệt/cổng BOQ/cờ 3 nấc | 427 dòng, 65 test pass | ✅ đúng |
| `measureObjectTiered` đã sống | `lib/vision/single-view-metrology.ts:942`, node `vision.measureobject` đang gọi | ✅ đúng |
| `StageToolbelt` đã chạy, `visual-generate` đã mount | `components/ui/StageToolbelt.tsx`, mount qua `CadToolbelt` → `CadStageScreen` | ✅ đúng |
| `AssetRepresentation` đã có trong DB | `schema.prisma:347`, **và client Prisma đã generate sẵn** (`node_modules/.prisma/client/index.d.ts:82`) ⇒ không cần `prisma generate` | ✅ đúng |
| nút `image-to-3d` chỉ thiếu tay thi hành | `toolbar-source.ts:328` khai cứng *"chưa nối ở lượt này"* ⇒ chip **luôn mờ** | ✅ đúng, đó là cái chốt phải mở |

Không tiền đề nào bị bác ⇒ chạy tiếp.

## ③ Đã làm
**1 · Mount + mở chốt.** `StageToolbelt` mọc cửa thứ hai (`CuaAnhThanhSpec`); `toolbar-source.ts`
gỡ dòng khai cứng "chưa nối". Chip dùng lại `ToolbarChip`/`CommandIcon`/`workingSetChips` — **không
khai tên/icon/thứ tự nào ở mặt tiền**.

**2 · Chạy lõi trên ảnh thật.** `CuaAnhThanhSpec` nối đúng chuỗi đã có, 0 thuật toán mới:
`loadImage` → canvas RGBA → `extractForeground` (đúng hàm `vision.measureobject` dùng) → bbox →
`deXuatKhoi3D` → `measureObjectTiered`. Ảnh nguồn lấy từ **Thư viện** (`/api/library`) chứ không
phải tệp dán tạm — vì cần danh tính `LibraryAsset` mới gắn được cách thể hiện.

**3 · Ngữ pháp sự thật.** Module thuần mới `lib/capabilities/anh-thanh-spec.ts`:
`nhanKichThuoc()` là **chỗ duy nhất** quyết định `≈ … SUY RA` / `… ĐO ĐƯỢC` / `… ĐÃ KIỂM`;
`ungVienVatLieu()` chỉ trả **ứng viên** `inferred` kèm câu bằng chứng tự khai giới hạn;
`thuocTinhKhongSuyDuoc()` giữ 6 ô **Chưa rõ** (loài gỗ · cấp · chống cháy · chống trượt · tiêu âm ·
độ bền) — máy **không có đường nào** điền; `sanPhamChuaRo()` là thứ duy nhất máy được trả, và
`sanPhamNguoiNhap()` **từ chối mã không nguồn**. Dùng lại nguyên bộ `measured|inferred|verified`.

**4 · Bốn cửa.** G1 đối tượng · G2 kích thước (mỗi chiều một ô "gõ lại") · G3 vật liệu & sản phẩm
(6 ô Chưa rõ nằm trong `<details>` — chỗ máy không chắc thì gọi chú ý, chỗ chắc thì im lặng) ·
G4 xuất spec. Nút chưa đủ điều kiện dùng `aria-disabled` + `aria-describedby` + `--mo-vo-hieu`,
lý do là câu thật. Đọc ảnh là việc **không đo được** ⇒ `LightBar` **không** nhận `value`.

**5 · Lưu.** `POST /api/asset-representation` → một hàng gắn vào **chính** `assetId` ảnh gốc.
Route từ chối `truthLevel` lạ và từ chối `verified` không người ký.

### 🔴 Hai lỗi thật sửa trong lượt này
**(a) SUY-RA LỌT THÀNH ĐÃ-KIỂM — lỗi nặng nhất, ở ngay lõi.** `nhanUngVien()` nâng **cả ba chiều**
lên `verified` chỉ vì một cú bấm "Nhận". Nghĩa là chiều **Sâu** — thứ ảnh 2D không thể thấy, và
`basis` của chính nó ghi *"ảnh 2D không thấy mặt sau"* — thành số đo được và **đi thẳng vào BOQ**.
Trái luật ⑤ của chính file, trái docstring `AssetRepresentation.truthLevel`, trái chốt Hoà 15/08.
Và **test cũ khoá đúng hành vi hỏng** (`:110` *"người ký → cả ba chiều verified"*) — đúng họ bệnh
đã rút thành luật ở vụ Hough 15/08. Nay: **chỉ chiều người gõ lại số mới lên `verified`**; chiều để
nguyên giữ cờ máy, chỉ ghi thêm vào `basis` rằng có người đã xem mà không sửa.

**(b) BẬC 4 TRẢ SỐ RỖNG MÀ KHÔNG TỤT BẬC** — bắt được **trên app thật**, không test nào thấy:
ảnh "Ghế bar Lincoln 327" ⇒ `rộng=0 · sâu=0 · cao=0` ⇒ cả dây chuyền chết ở cổng số-đo-hỏng, dù bậc
2 thừa sức đo ảnh đó. `measureObjectTiered` hứa *"tự tụt phương pháp"* nhưng chỉ tụt khi hiệu chỉnh
camera **báo thất bại**; ca này nó báo **thành công** rồi trả số rỗng. Chữa ở **tầng dây chuyền**
(`deXuatKhoi3D` thử lại không kèm ảnh), **không** đụng `lib/vision` — sửa ở đó đụng cả node
`vision.measureobject`, ngoài vùng ghi. Không bịa số: bậc dưới cũng hỏng thì vẫn từ chối như cũ.

**(c) nhỏ:** xuất spec lần hai làm `basis` bị nối chồng "người duyệt đã xem…". Giữ **ứng viên gốc**
làm nguồn ⇒ xuất bao nhiêu lần cũng ra cùng một vết.

## ④ Chưa làm — khai rõ
Đúng như phiếu cấm: **không** sinh bản vẽ nhiều hình chiếu, **không** khớp sản phẩm hãng,
**không** cổng Spec trong 3D. Ngoài ra chưa làm (nợ thật, không phải quên):
`entities` nháp **chưa đổ vào `Doc`** (`duocDoVaoDoc()` đã có, chưa có nút) · chưa có kho blob cho
tờ spec nên `payloadRef` là **con trỏ logic**, nội dung nằm ở `provenance` · chưa đọc lại danh sách
cách thể hiện đã lưu lên UI (`GET` đã có, mặt tiền chưa dùng).

## ⑤ Nghiệm thu
- `npx tsc --noEmit` → **0 lỗi thuộc lượt này**. (Có lỗi ở `components/studio/CumPhaiTren.tsx` —
  tệp **untracked**, lane khác đang viết dở, nằm trong vùng cấm của phiếu này. Lọc nó ra: sạch.)
- Test: `image-to-3d` **70 pass** · `anh-thanh-spec` **42 pass** (mới) · và quét rộng
  `single-view-metrology 46` · `hough-line 7` · `compound 11` · `toolbelt-chips` · `visual-generate` ·
  `registry 105` · `toolbar-doc-registry 51` · `render-core 30` · `vcb 19` — **0 fail**.
- **BROWSER THẬT :3001** — `/projects/cmsqu517r…/cad`, đăng nhập `hoa`, ảnh **"Ghế bar Lincoln 327"** trong Thư viện:
  | Kiểm | Kết quả trên màn |
  |---|---|
  | chip mount | "Ảnh thành khối" đứng cạnh "Dựng hình ảnh", **bấm được** |
  | nút mờ có lý do | *"Chưa có ảnh nguồn — chọn một ảnh đã nhận"* (đúng câu phiếu nêu) |
  | máy hiểu ảnh | *Ghế bành · Giống mẫu "Sofa góc" 81% · Bậc 2 — tỉ lệ khung bao mặt nạ · độ tin 65%* |
  | ngữ pháp sự thật | `Rộng 561 mm · ĐO ĐƯỢC` · `Sâu ≈ 825 mm · SUY RA` · `Cao 825 mm · ĐO ĐƯỢC` |
  | chỉ bấm Nhận | **không ô nào** thành ĐÃ KIỂM · *"Chưa vào BOQ: Số sâu còn là suy từ ảnh"* · ghi xuống `truthLevel=inferred` |
  | gõ lại Sâu=620 | ô đó thành `620 mm · ĐÃ KIỂM`, hai ô kia **đứng yên** · BOQ mở · `truthLevel=measured` |
  | vật liệu | 6 ứng viên xếp theo gần màu, kèm *"Màu không nói được loại vật liệu"* |
  | cấm bịa SKU | mã `LC-327` không nguồn ⇒ **chặn tại chỗ**, *"Có mã sản phẩm thì phải kèm nguồn tra được"*, **không ghi hàng nào** |
  | có nguồn | nhận, `sanPham.mucSuThat=verified`, `nguoiNhap=hoa` |
  | không nhân bản asset | `LibraryAsset` **1621 trước = 1621 sau**; hàng mới trỏ đúng `assetId` ảnh gốc |
  | dọn dữ liệu thử | `AssetRepresentation` **0 trước → 4 khi thử → 0 sau** |

## ⑥ File đã sửa
| Tệp | |
|---|---|
| `lib/capabilities/image-to-3d.ts` | sửa `nhanUngVien` (verified theo từng chiều) + tụt bậc khi bậc 4 rỗng |
| `lib/capabilities/image-to-3d.test.ts` | thay khẳng định che-bug, thêm ca ký lẻ + ca tụt bậc |
| `lib/capabilities/anh-thanh-spec.ts` · `.test.ts` | **mới** — ngữ pháp sự thật vật liệu/sản phẩm + gói spec + hình dạng bản ghi |
| `components/ui/CuaAnhThanhSpec.tsx` | **mới** — cửa duyệt G1-G4 |
| `components/ui/StageToolbelt.tsx` | mount cửa thứ hai |
| `app/api/asset-representation/route.ts` | **mới** — GET/POST/DELETE |
| `lib/commands/toolbar-source.ts` | **ngoài vùng ghi phiếu, khai rõ**: gỡ đúng 4 dòng khai cứng *"chưa nối"* — không gỡ thì chip mờ vĩnh viễn, cả lượt vô nghĩa |

## ⑦b Chưa chắc / chưa kiểm
- 🔴 **Phát hiện ngoài phạm vi, CHƯA SỬA, đáng một phiếu riêng:** bậc 2 của `measureObjectTiered`
  gắn cờ **`measured`** cho chiều Cao trong khi `basis` của chính nó nói *"Cao chuẩn nghề — chưa có
  neo thật để hiệu chỉnh riêng"*. Đó là **một con số trong sách dán nhãn đo được**, và nó **đủ điều
  kiện vào BOQ** — nhìn thấy tận mắt trên màn hôm nay (`825 mm · ĐO ĐƯỢC`). Cùng họ với lỗi (a) vừa
  sửa, nhưng nằm ở `lib/vision` (ngoài vùng ghi) và đụng node `vision.measureobject` đang chạy.
- **Không chụp được ảnh màn hình**: bộ chụp của trình duyệt timeout liên tục trên trang CAD (canvas
  nặng). Mọi kết quả trên là **đọc DOM thật + đọc DB thật**, không phải ảnh. Và các cú bấm cuối đi
  qua `element.click()` (đúng handler React) thay vì con trỏ toạ độ — cú bấm chip đầu tiên có thử
  bằng toạ độ nhưng hệ toạ độ lệch do không có ảnh chụp để căn.
- Chỉ thử **một** ảnh, **một** loại đồ, **một** trình duyệt. Chưa thử: ảnh nền phức tạp, ảnh không
  tách được món (đường từ chối bậc-1 mới chỉ chạy trong test), theme sáng, trình đọc màn hình,
  `prefers-reduced-motion`.
- `ungVienVatLieu` xếp hạng bằng **khoảng cách RGB thô** — chọn thế cho thật thà và rẻ, không phải
  vì nó đúng về cảm nhận màu; OKLCH sẽ hợp hơn nhưng đó là việc khác.
- `/` (Home) đang **500** trên máy chủ dev — không phải lượt này (không đụng `components/home/**`);
  cùng lúc lane khác đang viết dở tệp trong `components/studio/`.

## ⑦c Hạn dùng kết luận
- Kết luận **LIVE** gắn với `HEAD` hôm nay + `dev.db` hiện tại. `lib/vision/single-view-metrology.ts`
  đổi bậc/đổi cờ ⇒ **phải đo lại**, vì cả tờ spec ăn theo cờ nó phát ra.
- Số nghiệm thu (561/825/620 mm) chỉ đúng cho **đúng tấm ảnh đó**; đừng trích như thông số sản phẩm.
- Câu *"không nhân bản asset"* đúng chừng nào `payloadRef` còn là con trỏ logic. Ngày có kho blob
  cho tờ spec thì phải kiểm lại xem nó có lén đẻ ra một danh tính thứ hai không.
