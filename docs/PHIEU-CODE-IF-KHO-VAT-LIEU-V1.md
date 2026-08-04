# PHIẾU — KHO VẬT LIỆU IF v1 (2026-08-04)

Nền: nghiên cứu 4 hệ đang chạy thật (BIMobject · Fohlio · Chaos Cosmos · 3D Warehouse).
Hoà chốt: **đi đường Fohlio (công cụ, studio trả tiền), KHÔNG đi đường BIMobject (sàn)**.

## Quyết định gốc — đọc trước khi code
`ProductSpec` (`prisma/schema.prisma:359`) đã có `larkRecordId` + `raw` ⇒ người thiết kế bảng
này ĐÃ coi Lark là **nguồn nhập**, không phải nơi vật liệu sống. Phiếu này đi tiếp đúng hướng đó.

**Kho 3 tầng** (thiết kế cả 3, CHỈ CODE tầng 2+3 — luật §9):
```
① KHO CHUNG (nhà cung cấp)  scope='global'  ← CHƯA CODE. IF có <20 studio thật thì chưa mở.
② KHO STUDIO                scope='studio'  ← CODE ĐỢT NÀY
③ DỰ ÁN (.idf)              chỉ THAM CHIẾU  ← CODE ĐỢT NÀY
```
Vì sao chưa làm ①: BIMobject cần 2.500 hãng + 6 TRIỆU KTS mới phá được vòng con-gà-quả-trứng.
IF có 0 studio ngoài TTT. Xây kệ giữa sa mạc.

---

## VIỆC 1 · Bốn cột schema (làm trước, rẻ nhất, quan trọng nhất)
Thêm vào `model ProductSpec`:
```prisma
scope      String   @default("studio")  // 'global' | 'studio'
ownerId    String?                      // null = kho chung; ngược lại = studio sở hữu
supplierId String?                      // hãng cung cấp (chưa có bảng Supplier — để string trước)
verified   Boolean  @default(false)     // IF đã duyệt chưa (chỉ có nghĩa với scope='global')
```
Vài chục byte/dòng. KHÔNG code chức năng nào cho `global` đợt này — chỉ khai chỗ.
Lý do: ngày có nhà cung cấp đầu tiên mà thiếu 4 cột này ⇒ phải migrate dữ liệu của MỌI khách hàng.

⚠️ Đọc comment `LibraryAsset:245-250` trước khi migrate — `node_modules` dùng CHUNG với worktree
khác qua symlink, regenerate Prisma client sai cách sẽ làm phiên `main` đang chạy lỗi P2022.

## VIỆC 2 · Luật ĐÓNG BĂNG theo TRẠNG THÁI hồ sơ
Bài học Fohlio: giá sync tự động NHƯNG *"approve or reject updates"* — người quyết định, không phải máy.
Bài học Chaos Cosmos: asset gỡ khỏi thư viện vẫn dùng được nếu đã tải ⇒ *"prevents broken references
in active projects"*. `.idf` là HỒ SƠ PHÁP LÝ giao khách, không phải file nháp — càng phải giữ.

`.idf` lưu CẢ HAI:
```ts
{ specId: 'ps_abc123',          // để tra ngược, xem ảnh, cập nhật khi CHỦ ĐỘNG muốn
  snapshot: {                   // đóng băng lúc kéo vào bản vẽ
    name, sku, price, currency, unit, capturedAt } }
```
Quy tắc theo trạng thái hồ sơ:
| Trạng thái | Giá |
|---|---|
| nháp | sống — tự theo kho |
| đã duyệt / đã ký | **KHOÁ** — dùng `snapshot`, kho đổi cũng không đổi |

Kho đổi giá ⇒ hiện **chấm cảnh báo** *"1.250.000 → 1.400.000, bấm để cập nhật"*. **Người bấm.**
⛔ CẤM tự áp giá mới vào hồ sơ đã duyệt. Đây là lỗi chết người trong nghề: hợp đồng ký một đằng,
hồ sơ in một nẻo.

## VIỆC 3 · Màn quản lý vật liệu TRONG IF
Thêm · sửa · xoá · tìm · lọc · gắn ảnh. Đây mới là tính năng BÁN ĐƯỢC — studio nào cũng tự xây
kho của họ, không phụ thuộc TTT hay Lark.
Cột hiển thị tối thiểu: ảnh · mã · tên · hãng · kích thước (w×d×hUp) · giá · đơn vị · nguồn.

## VIỆC 4 · Cửa nhập Excel/CSV
Fohlio nhận XLS·CSV·TSV·XML·JSON·PDF. IF làm **XLSX + CSV trước** (95% ca thật ở VN — nhà cung cấp
đã có sẵn bảng giá Excel).
Luồng: kéo file vào → **ghép cột tay** (cột nào là tên, cột nào là giá…) → xem trước 20 dòng
→ báo lỗi dòng hỏng → nhập. Ghép cột phải NHỚ ĐƯỢC để lần sau nhập cùng nhà cung cấp khỏi làm lại.

Ảnh: cho phép kéo cả thư mục ảnh, ghép theo **mã/SKU trùng tên file**.

## VIỆC 5 · ATLAS = MỘT CA RIÊNG của VIỆC 4
Sau khi có cửa Excel: xuất 1449 món từ Lark ra Excel → nhập vào. XONG.
Không cần gỡ quyền Lark, không cần Hoà hiểu Lark Base.
`docs/ATLAS-4-BUOC-BAM-LARK.md` (đường A) **hạ từ VIỆC CHẶN xuống VIỆC TIỆN** — làm khi rảnh,
để sync tự động về sau. Không làm cũng không sao.

---

## KHÔNG LÀM ĐỢT NÀY (ghi để khỏi quên — luật §9)
- Tầng ① kho chung + cổng nhà cung cấp → chờ ≥20 studio dùng thật
- **Web Clipper** (dán link web nhà cung cấp → bóc tên/ảnh/giá) → phiếu RIÊNG, cần nghiên cứu
  bóc dữ liệu web. ⚠️ Đánh giá lại: cái này có thể là tính năng studio VN thích NHẤT, vì nhà cung
  cấp VN có website mà không có API. Ưu tiên cao hơn tưởng ban đầu.
- Đẩy tài sản nặng lên R2 (grep `R2_` = 0, chưa nối thật). Trước mắt vẫn `./uploads`, nhưng
  texture PBR + model 3D của MỘT hãng đá có thể vài chục GB — đĩa local sẽ vỡ khi có tầng ①.

## NGHIỆM THU
- Nhập thử 1 file Excel 50 dòng + thư mục 50 ảnh → khớp đúng theo SKU, báo rõ dòng nào hỏng.
- Kéo 1 vật liệu vào bản vẽ → mở `.idf` xem CÓ `snapshot` (không chỉ có `specId`).
- Đổi giá trong kho → hồ sơ **đã duyệt** KHÔNG đổi, có chấm cảnh báo; hồ sơ **nháp** đổi theo.
- `npx tsc --noEmit -p .` sạch · ghi hash vào `docs/SO-KIEM-TONG.md` (append-only).
- Luật **N6**: mọi component mới phải dán kết quả grep chứng minh có nơi mount.
⛔ Không đụng `components/cad/CadSheets.tsx` (CHINH đang làm multi-sheet đợt 8 ở đó).
