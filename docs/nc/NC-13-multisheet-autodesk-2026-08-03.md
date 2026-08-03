# NC-13 · Bộ bản vẽ nhiều trang — Autodesk làm sao, IF sai chỗ nào (2026-08-03)

## 1 · Autodesk: giấy KHÔNG chứa hình học

### AutoCAD — Model space ↔ Paper space
| Tầng | Chứa gì | Đơn vị |
|---|---|---|
| **Model space** | TOÀN BỘ hình học, vẽ **1:1 theo kích thước thật** | mm thật |
| **Layout (paper space)** | trang giấy A1/A3 + khung tên + ghi chú | mm giấy |
| **Viewport** (trên layout) | **CỬA SỔ soi vào model** — không sao chép hình, chỉ nhìn | có **tỉ lệ riêng** 1:50, 1:100… |

Một file có **không giới hạn layout**. Mỗi layout nhiều viewport, mỗi viewport tỉ lệ khác nhau (mặt bằng 1:100 + chi tiết 1:10 chung một tờ). Viewport khoá được (`VPLOCK`) để pan/zoom không phá tỉ lệ. Sửa tường trong model → **mọi layout đổi theo tức thì**, vì không có bản sao nào cả.

**Sheet Set Manager**: gom layout của nhiều FILE thành một bộ hồ sơ, đánh số tờ tự động, sinh mục lục bản vẽ, xuất/in cả bộ một lần.

### Revit — chặt hơn một bậc
- **View** (mặt bằng, mặt đứng, mặt cắt, 3D, chi tiết) sinh ra từ MỘT mô hình. View có tỉ lệ riêng, mức chi tiết riêng, bộ lọc riêng.
- **Sheet** = khung tên + các view đặt lên. **1 view chỉ đặt được lên 1 sheet** (muốn 2 chỗ → nhân bản view).
- Đổi tỉ lệ view → ký hiệu/chữ **tự co giãn**, giữ nguyên cỡ chữ trên giấy.
- **Sheet list** = bảng thống kê tự sinh từ danh sách sheet, không gõ tay.

**Nguyên lý chung: MỘT mô hình · NHIỀU cách nhìn · NHIỀU tờ giấy. Giấy không bao giờ giữ bản sao hình học.**

---

## 2 · IF hiện tại — sai mô hình, không phải sai con số 5

Vật chứng `components/cad/CadSheets.tsx`:
- Dòng 52: `const MAX_SHEETS = 5`
- Dòng 6-9 comment: *"giữ ĐÚNG 1 CadEditor mounted, mỗi lần đổi tab thì **HOÁN nội dung store**"*
- Dòng 58-66: mỗi sheet ôm nguyên `doc: Doc` + `past: Doc[]` + `future: Doc[]` **riêng**
- `components/present-editor/PresentSheets.tsx:76` — y hệt, `MAX_SHEETS = 5`

⇒ **1 sheet = 1 Doc độc lập**. Đây là mô hình "5 file mở trong 5 tab", KHÔNG phải bộ bản vẽ.

### Hậu quả kéo theo
| Triệu chứng | Gốc |
|---|---|
| Phải chặn 5 | mỗi sheet nuốt nguyên Doc + 2 mảng undo trong RAM/IndexedDB |
| Sửa tường ở sheet 1, sheet 2 không đổi | hai Doc rời nhau |
| Không có tỉ lệ in | `Viewport` chỉ có `{scale, panX, panY}` — là **zoom màn hình**, không phải tỉ lệ giấy |
| Không có khung tên, khổ giấy | chưa có khái niệm trang |
| **NGƯỢC LUẬT K1** | K1: "ba ống kính MỘT nguồn". Multi-sheet hiện tại đẻ ra N nguồn |

---

## 3 · Đề xuất mô hình đúng cho IF

```
Doc (MỘT, duy nhất — đúng luật K1)
 └── entities: hình học thật, mm 1:1

Sheet[] (không giới hạn — chỉ là metadata, nhẹ)
 ├── id · name · number ("A-01")
 ├── paper: 'A0'|'A1'|'A2'|'A3'|'A4' · orientation
 ├── titleBlock: { project, drawnBy, date, revision }
 └── viewports: Viewport2D[]
      ├── rectOnPaper: {x,y,w,h}   ← vị trí ô nhìn TRÊN GIẤY (mm giấy)
      ├── centerMm: {x,y}          ← nhìn vào chỗ nào của Doc
      ├── scale: 1/50 | 1/100 …    ← TỈ LỆ IN, không phải zoom
      ├── locked: boolean
      └── layerOverrides?          ← tắt/bật lớp riêng cho ô này (như Revit view filter)
```

**Sheet nhẹ đi ~1000 lần** (vài trăm byte metadata thay vì cả Doc + undo) ⇒ **bỏ hẳn trần 5**, 40 tờ hồ sơ vẫn nhẹ hơn 5 tờ hiện nay.

### Ăn theo được ngay
- **Mục lục bản vẽ** tự sinh từ `Sheet[]` (như Revit sheet list).
- **In cả bộ** — `lib/cad/pdf.ts` đã có `exportSheetSetPdf()`, nay nhận đúng khổ giấy + tỉ lệ thật thay vì ảnh chụp màn hình.
- **Chữ/ký hiệu co theo tỉ lệ**: cỡ chữ lưu theo **mm giấy**, nhân `1/scale` khi vẽ lên model → 1:50 và 1:100 chữ bằng nhau trên giấy.
- Chặng 3D chỉ cần thêm loại viewport `kind:'3d'` giữ camera đã lưu → **bộ hồ sơ trộn được 2D lẫn phối cảnh trên cùng một tờ.**

---

## 4 · Đường di dời (không phá bản cũ)
1. Khai `Sheet`/`Viewport2D` trong `lib/cad/model.ts` — **chỉ khai kiểu**, chưa dùng.
2. Bộ chuyển 1 chiều: mỗi sheet cũ (1 Doc) → gộp entity vào Doc chung, dịch offset để không chồng, sinh 1 Sheet + 1 viewport tỉ lệ 1:100.
3. Đổi `SheetTabBar` sang đọc `Sheet[]`, bỏ hoán store.
4. Gỡ `MAX_SHEETS` ở CẢ HAI chỗ (CadSheets.tsx:52 · PresentSheets.tsx:76).
5. `.idf` lên phiên bản mới, đọc được file cũ (bản cũ có `sheets[].doc` → chạy bộ chuyển).

⚠️ Đụng `lib/cad/model.ts` — **phải đợi phiên boolean commit `ops[]` xong** mới bắt đầu.

Từ khoá tra cứu: *paper space viewport scale · sheet set manager · Revit view on sheet · annotative scaling · titleblock parameters*
