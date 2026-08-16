# PHIẾU P-T — VẬT LIỆU: CẮM ĐIỆN CHO SỢI DÂY ĐÃ CÓ

> Giao: T · 17/08 · vùng khoá: `lib/materials/` + `components/materials/` + mock + báo cáo.
> ⛔ **KHÔNG đụng** `scripts/` (phiên P-S đang giữ) · không đụng `components/home/` · không đụng `prisma/schema.prisma` · không đụng màu nhấn (`--accent*`) — **Hoà chưa chốt mòng két ↔ mận**.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG — trả lời TRƯỚC
```
git log --oneline -1
git rev-list --count HEAD..main
```
Lệch main > 0 → **DỪNG NGAY**, báo T. Mốc đúng khi phóng: `e57e2f6`.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận hoặc BÁC, kèm file:dòng
> **TIỀN ĐỀ CỦA PHIẾU:** *"Hàm nối ba mảnh vật liệu **đã tồn tại** — `getMaterial()` ở [lib/materials/resolve.ts:52](../../lib/materials/resolve.ts) trả đủ ba mặt (PBR · thương mại · hatch 2D), có test. **Nhưng 0 nơi gọi** ngoài chính test của nó. Tức dây có, chưa cắm điện — không phải chưa có dây."*

→ `[XÁC NHẬN | BÁC BỎ | KHÔNG CÓ BẰNG CHỨNG]` + nguồn. **Bác thì DỪNG**, báo T.
⚠️ Sổ dự án (`IF-KIEN-TRUC.md` §6, `LATEST.md`) đang ghi *"= 0 code"* — **đó là chỗ T đã đo sai, T tự sửa sổ**. Nếu đo của bạn ra kết quả khác cả hai, nói thẳng.

## ① BỐI CẢNH NGÀNH
Hoà gọi đây là **phần đẹp nhất của IF** và định nghĩa nó bằng một câu:
> *"Đồng bộ KHÔNG PHẢI nối hai thứ lại. Đồng bộ là KHÔNG TÁCH chúng ra ngay từ đầu."*

Painpoint thật của KTS: đổi vật liệu ghế từ sồi sang óc chó thì hôm nay phải sửa **bốn nơi** — bản vẽ · file 3D · bảng giá · tiến độ — và **luôn sót một chỗ**. IF hứa sửa một lần. Hào của sản phẩm nằm đúng đây: *Canva đẹp mà không thật · Revit thật mà không đẹp*.

Hiện vật liệu vẫn **chẻ ba, mỗi mảnh không biết mảnh nào**: `MaterialPbr` (14 thông số render, **0** trường giá/NCC) · `ProductSpec` (NCC · giá · hao hụt, **0** thông số render) · `MaterialDef` (hatch/màu 2D). Người dùng mở màn Vật liệu **không thấy được** một vật liệu đủ mặt hay thiếu mặt nào.

## ② ĐỌC TRƯỚC
| File | Vì sao |
|---|---|
| `docs/IF-KIEN-TRUC.md` **§5 · §6** | dòng chảy của vật + định nghĩa Đồng bộ — **ràng buộc gắt nhất nằm ở §6** |
| `lib/materials/resolve.ts` toàn bộ | hàm đã có; đọc docstring trước khi định viết gì mới |
| `lib/materials/resolve.test.ts` | biết nó đã bảo vệ gì rồi |
| `lib/materials/pbr-store.ts` | `loadPbrMap()` · `normalizeMatId()` · vì sao khoá là `matId = ProductSpec.sku` |
| `components/materials/MaterialsScreen.tsx` | **đã fetch `/api/specs`** — mặt thương mại đã có sẵn ở đây |
| `lib/cad/materials.ts:60` | mảnh ③ hatch 2D + field `matId` |
| `components/materials/RnaPanel.tsx` | panel **tự sinh từ định nghĩa** (IF-RNA v0) — mở rộng cái này, đừng đẻ panel thứ hai |

## ③ VÙNG FILE
- **SỬA**: `lib/materials/*` · `components/materials/*`
- **TẠO**: `docs/mocks/mock-vat-lieu-ba-mat.html` (kèm dòng đầu `<!-- @dsCard group="Vật liệu" -->`) · `docs/bao-cao-phien/2026-08-17-P-T-vat-lieu-mot-vat.md`
- ⛔ **KHÔNG** sửa `prisma/schema.prisma` — việc này **không cần cột DB mới**.

## ④ VIỆC
1. **CẮM ĐIỆN** — `MaterialsScreen` gọi `getMaterial()` cho từng vật liệu: nó **đã có** `specs` (mặt ②), thêm `loadPbrMap()` (mặt ①) và `MATERIALS` (mặt ③). Marker code: `[marker: vatLieuBaMat]`.
2. **MẶT NHÌN THẤY — CHỈ BÁO BA MẶT.** Mỗi vật liệu hiện **đủ/thiếu mặt nào**:
   - ⚠️ **Không phải ba chấm màu.** Màu **không được là kênh duy nhất** (luật đã chốt) — phải đọc được khi bỏ hết màu. Dùng **ký hiệu + nhãn chữ**; loại icon đúng là **"icon nén tin"** (bảng 7 loại 16/08) ⇒ **luôn kèm chữ**, icon chỉ nói *chữ này nói về cái gì*.
   - Thiếu mặt nào thì **nói thẳng thiếu gì và làm sao có** (*"chưa có thông số render — mở bằng tool làm vật liệu"*), **cấm** hiện ô trống câm, **cấm** bịa giá trị mặc định.
3. **CHỖ SỜ ĐƯỢC VÀO CÂU CHUYỆN ĐỒNG BỘ** — chọn một vật liệu thì thấy được: mã `matId` này ở 2D ra ký hiệu gì · ở 3D ra PBR gì · ở Trình chiếu ra giá nào. **Một vật, ba mặt** — đúng §5 bản đồ.
4. **BẢN VẼ** `docs/mocks/mock-vat-lieu-ba-mat.html` — **đủ 2 theme**, token thật từ `app/globals.css`, **0 hex gõ tay**, bày đủ ca: đủ ba mặt · thiếu PBR · thiếu giá · **hàng bỏ-hết-màu** để chứng minh vẫn đọc được. Tự chấm bằng `design:design-critique` + `design:accessibility-review` trước khi nộp.
5. **TEST** cho phần cắm điện — ít nhất: mảnh thiếu ⇒ UI nói *thiếu*, **không** rơi về giá trị bịa.

## ⑤ RÀNG BUỘC — đọc kỹ, đây là chỗ dễ làm hỏng nhất
- 🔴 **VẬT LIỆU TRỎ TỚI bản ghi thương mại, TUYỆT ĐỐI KHÔNG CHÉP GIÁ VÀO MÌNH.** Giá đổi hằng ngày, texture thì không. Luật `2.1.9.i` (30/07) **cố ý tách hai bên và vẫn đúng**. *"Hiểu được thông tin"* = **trỏ tới được**, KHÔNG phải chứa. Chép giá vào `MaterialPbr` = **hỏng việc**, dù chạy được.
- **Range giá** thuộc kho chung · **giá chốt** thuộc từng dự án — đừng trộn.
- **KHÔNG cột DB mới, KHÔNG format thứ hai.** Khoá nối là `matId = ProductSpec.sku` **đã có**.
- **KHÔNG** `git` · **KHÔNG** chạy dev server · không đụng `--accent*`.
- **Mã điều khoản** — mở `docs/TRIET-LY-IF.md` **đọc số**, đừng nhớ hộ: `[T1]` một nguồn · `[T2]` một cỗ máy nhiều mặt tiền · `[T5]` con người quyết cuối · `[Đ2]` nhìn vào trong trước.
- ⭐ **BÀI HỌC 16/08 áp thẳng vào phiếu này**: *"có trong mã" KHÔNG bằng "tới được người dùng"*. `resolve.ts` là ca mẫu — viết 07/08, tsc xanh, test xanh, **10 ngày không ai gọi**. Phiếu này chỉ đạt khi thứ đó **hiện ra trên màn**, không phải khi test xanh.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
node_modules/.bin/sucrase-node lib/materials/resolve.test.ts
npm test
npm run soi:tu-dien
npm run soi:hinh-hoc
```

## ⑥b ĐÍCH — VÒNG TỰ ĐÓNG, TRẦN 5 VÒNG
**ĐÍCH**: `tsc` 0 lỗi · `npm test` 0 fail · `soi:tu-dien` không thêm lệch mới · `soi:hinh-hoc` không thêm lệch mới · bản vẽ tự chấm 2 skill design **không còn lỗi mức chặn** · `getMaterial` có **≥1 nơi gọi thật ngoài test** (grep chứng minh, dán vào báo cáo).
Chưa đạt → **tự sửa rồi chạy lại**, tối đa **5 vòng**. Quá trần → **DỪNG**, nộp bản chưa đạt kèm bảng *vòng nào hỏng vì gì*. **Cấm** sửa test cho qua cửa.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-17-P-T-vat-lieu-mot-vat.md` — khuôn 6 phần (`docs/CLAUDE.md`). Dán **nguyên văn** kết quả lệnh + grep chứng minh nơi gọi.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc, trống cũng phải ghi "không có"
Đặc biệt: **chưa chạy app thật thì phải nói thẳng** (phiếu cấm dev server ⇒ mọi kết luận về hiển thị là **đọc mã**, không phải nhìn) · số đo tương phản là **tính** hay **đo** · mặt nào của vật liệu chưa có dữ liệu thật trong kho để thử.

## ⑦c HẠN DÙNG KẾT LUẬN
Ghi rõ: *"kết luận này hết đúng khi …"* (gợi ý: khi `matId` thôi bằng `ProductSpec.sku`, hoặc khi PBR rời localStorage sang DB).

## ⑧ DÂY MÁY
Entry registry: **T tự mở** `vat-lieu-mot-vat` sau khi audit. **Agent KHÔNG sửa `frontier-registry.mjs`.**
