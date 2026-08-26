# Wave 10 — KÉO-THẢ THƯ VIỆN → BẢN VẼ: đóng lỗ "kệ đầy mà kéo không xuống"

## 1 · Tổng quan
Lane B nạp 73 món thật lên kệ rồi tự khai rủi ro lớn nhất: *"nhánh `via:'idfc'` chưa chạy thật lần
nào"*. Đo trên app thật thì **nhánh đó KHÔNG chạy** — cú thả tuột sang đường dự phòng. Gốc bệnh:
**kệ và cú thả đọc HAI NGUỒN KHÁC NHAU**. Đã sửa; nay thả một món mầm ra **41 nét hình thật**.

## 2 · Chi tiết
| | Trước sửa | Sau sửa |
|---|---|---|
| Nét thêm khi thả "Sofa 2 chỗ" | **+1** | **+41** (đúng 41 prims của mẫu) |
| Nét mang `srcBlock` = mã mẫu | **0** | **41** |
| Cụm `srcInsertId` | 0 | **1** (bấm 1 nét chọn cả cụm) |
| Lớp | — | `l-furniture` |
| Câu báo | *"…vào giữa màn hình"* (đường khớp-tên) | *"…từ hình vẽ của chính mẫu .idfc — 41 nét"* |
| Lỗi console | không | không |

**Gốc bệnh (file:dòng):** `LibrarySheet.tsx:298` dựng kệ bằng `tronKhoMam(loadIdfcStore())` — kho
studio **TRỘN** kho mầm. `LibraryDropBridge.tsx:80` chỉ đọc `loadIdfcStore()` — **chỉ IndexedDB**.
Món mầm không nằm trong IDB ⇒ tra không thấy ⇒ tuột nhánh, mất luôn `srcBlock` nên đứt đường truy
về mẫu gốc. Sửa: bridge đọc **cùng một nguồn** với kệ.

**Vì sao mọi cổng đều mù:** tsc xanh (hai hàm đều có thật) · test cũ xanh (không test nào ghép hai
đầu) · `soi:*` xanh (không phải lệch nhãn/hình học/sổ). Đây là **hai đầu dây không khớp nhau** —
chỉ lộ khi chạy thật. Cùng họ với bài học 16/08 *"có trong mã ≠ tới được người dùng"*.

## 3 · Máy canh mới
`lib/cad/keo-tha-idfc.test.ts` — chạy **dữ liệu mầm THẬT** qua đúng chuỗi bridge gọi:
bản ghi → `idfcGeom2dOf` → `resolveLibraryItem` → `clusterPrimsToEntities` → nét.
Kết quả: **60/73 món** mang hình 2D, **cả 60 đều xuống được bản vẽ**, 0 món ra 0 nét; 13 món không
có hình thì **im đúng cách** (không đẻ nét bịa).

## 4 · Đánh giá khách quan
- ✅ Đóng đúng rủi ro số 1 lane B tự khai, bằng đo chứ không bằng đọc mã.
- ⚠️ Test node **không phủ** `dropPoint()` (cần `window`), `hydrateIdfcStore()` (cần IDB), và cú
  kéo bằng **chuột thật**. Lượt này bắn thẳng sự kiện `if:library-instantiate` — đúng cửa bridge
  nghe, nhưng **chưa phải cú kéo chuột từ tấm Thư viện**. Còn một đoạn cuối chưa ai đo.
- ⚠️ Chỉ thử **1 món** trên trình duyệt (59 món kia suy từ test node, không phải đo).
- ⚠️ `specId` vẫn không gắn được lên nét rời (schema chỉ cho Block/Hatch) — nợ cũ, chưa đụng.

## 5 · Hướng xử lý
- **(a)** Kéo chuột thật từ tấm Thư viện → đóng nốt đoạn cuối. Rẻ, nhưng phải mở được tấm và tìm
  đúng thẻ trong 73 món.
- **(b)** Thêm máy canh chặn tái phát: test khẳng định bridge và kệ **gọi cùng một hàm nguồn** —
  bắt được cả những lần đổi nguồn về sau, không chỉ ca hôm nay.

## 6 · Đề xuất
Làm **(b) trước**, rồi (a). Lý do: (a) chứng minh *hôm nay chạy được*; (b) chặn *ngày mai hỏng lại*
— và kiểu hỏng này vừa chứng minh nó sống sót qua tsc + test + 5 máy soi.
