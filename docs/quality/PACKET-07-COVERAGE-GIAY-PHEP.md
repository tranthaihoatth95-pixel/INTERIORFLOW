# PACKET 07 · COVERAGE CỔNG GIẤY PHÉP PHÁT HÀNH

> **Bàn 07 · QUALITY ra packet — KHÔNG cầm bút production.** 06 BUILD thi công theo tệp này;
> 07 phản biện trước khi merge.
> Phiếu gốc: `HO-20260830121616-4190ceaaa47b` · Trạng thái packet: **CANDIDATE** (chưa ai duyệt).

## 0 · TIỀN ĐỀ PHIẾU SAI Ở CHỖ THEN CHỐT — ĐO TRƯỚC KHI THI CÔNG

Phiếu nói lỗ là **"bỏ qua mọi tệp >64MB"**. Đo trên artifact thật (`dist-installer` + `dist`,
2026-08-30, `scripts/soi-giay-phep-phat-hanh.mjs` nguyên trạng):

| đường đi của tệp | tệp | MB |
|---|---:|---:|
| bắt theo TÊN (`/libredwg\|mlightcad/i`) | 0 | — |
| **QUÉT RUỘT thật sự** | 15.493 | 268,7 |
| **bỏ vì ĐUÔI không nằm trong danh sách** | **3.932** | **942,6** |
| bỏ vì lớn hơn trần 64MB | **0** | **0,0** |
| tổng | 19.425 | 1.211,4 |

**COVERAGE BYTES HIỆN TẠI: 22,18%.**

⇒ **Trần 64MB không bắn phát nào.** Lỗ thật là `DUOI_MA` (dòng 121): allow-list
`.js .mjs .cjs .html .json .css .txt`. **`.wasm` · `.node` · `.dylib` · `.so` đều KHÔNG có trong
đó**, nên mọi nhị phân bị bỏ **bất kể kích thước** — một `.wasm` 2 MB cũng không ai nhìn vào ruột.
Sửa trần 64MB mà giữ allow-list là vá đúng chỗ không chảy máu.

🔴 **LỖ THỨ BA, phiếu không nêu, nghiêm trọng không kém:** `package.json` → `license:check` chạy
với `--excludePackages '…;@mlightcad/libredwg-web@0.7.7;…'`. Cổng giấy phép cấp npm **được cấu
hình để bỏ qua đúng gói GPL đang gây rủi ro**. Đây là miễn trừ CỐ Ý và VÔ HÌNH — không ai đọc
`npm test` xanh mà biết.

## 1 · THREAT MODEL — cái gì lọt được, qua đường nào

| # | Đường lọt | Cổng hiện tại | Trạng thái |
|---|---|---|---|
| T1 | `.wasm`/`.node`/`.dylib` mang mã GPL, **đặt tên trung tính** (không chứa `libredwg`) | bắt theo tên: trượt · quét ruột: không tới (đuôi bị loại) | 🔴 **HỞ** |
| T2 | GPL nhúng trong bundle `.js` đã minify/gộp, dấu vết bị đổi tên biến | quét ruột có chạy, nhưng chỉ so 2 chuỗi cố định | 🟠 hở một phần |
| T3 | Tệp mã > 64 MB (bundle gộp, sourcemap lớn) | `continue` im lặng | 🟡 hở, **hiện chưa xảy ra** (0 tệp) |
| T4 | GPL vào qua `node_modules` production | `license:check` — nhưng đã **excludePackages** đúng gói đó | 🔴 **HỞ CỐ Ý** |
| T5 | Payload đặt trong archive (`.asar`/`.zip`) | không giải nén | 🔴 hở, **NOT ASSESSED** |
| T6 | Symlink trỏ ra ngoài cây | `isSymbolicLink() → continue` | 🟢 chặn (đúng, tránh treo) |

Cái mà cổng **thật sự** đang bắt hôm nay: chỉ những tệp **mang chữ `libredwg`/`mlightcad` trong
TÊN**. Đổi tên tệp là qua cổng.

## 2 · HỢP ĐỒNG NHÃN — không silent skip

Mọi tệp trong artifact phải mang **đúng một** nhãn, ghi ra receipt:

| nhãn | nghĩa | điều kiện |
|---|---|---|
| `SCANNED` | đã đọc **toàn bộ byte** và so dấu vết | mọi tệp ≤ trần streaming |
| `HASH_ONLY` | không so được nội dung, nhưng đã ghi `sha256` + kích thước | tệp vượt trần streaming, archive chưa mở được |
| `UNSUPPORTED_WITH_REASON` | cố ý không xử, **kèm lý do đọc được** | symlink · thiết bị · quyền đọc bị từ chối |

**Không nhãn = lỗi cổng**, không phải "bỏ qua". Tổng ba nhãn phải bằng tổng tệp duyệt được —
đây là bất biến kiểm được, và là thứ ca đột biến sẽ tấn công.

## 3 · TIÊU CHÍ COVERAGE — bao nhiêu là đủ, và VÌ SAO

| ngưỡng | giá trị | lý do |
|---|---:|---|
| `SCANNED` theo **bytes** | **≥ 99,0%** | phần còn lại chỉ được phép là `HASH_ONLY`/`UNSUPPORTED`. Không đặt 100% vì streaming vẫn cần trần cho tệp bệnh lý |
| `SCANNED` theo **tệp** | **≥ 99,5%** | tệp nhỏ không có cớ gì không đọc |
| `UNSUPPORTED_WITH_REASON` | **≤ 0,5%** tệp | vượt mức này là cổng đang tự miễn trừ |
| tệp **không nhãn** | **= 0** | bất biến cứng |
| nhóm đuôi nhị phân (`.wasm .node .dylib .so .a .bin`) | **0 tệp** rơi ngoài ba nhãn | đây chính là chỗ T1 sống |

Vì sao đo theo **bytes** chứ không chỉ theo số tệp: 3.932 tệp bị bỏ chiếm **78%** khối lượng.
Đếm theo tệp sẽ ra "chỉ 20% tệp bị bỏ", nghe qua được — đó là cách một con số thật che một lỗ thật.

## 4 · FIXTURE — dựng được, chạy lại được

`scripts/quality/dung-fixture-giay-phep.mjs` (bàn 07 sở hữu). Sinh cây tạm, **không commit nhị
phân**, tự xoá:

| tệp | vì sao có |
|---|---|
| `fx-lon.js` — **65 MB**, dấu vết GPL đặt ở **byte ~64,5 MB** | chứng minh cổng đọc **quá mốc 64MB**. Payload nằm SAU mốc, không phải đầu tệp |
| `fx-blob.wasm` — 3 MB, tên **trung tính**, ruột mang dấu vết | T1: đuôi nhị phân + tên không tố cáo |
| `fx-sach.js` — 1 MB, không dấu vết | **counterproof**: ca hợp lệ phải VẪN XANH |
| `fx-sach.wasm` — 2 MB nhị phân sạch | counterproof cho nhánh nhị phân |

Cổng chỉ được coi là bắt được khi: **hai tệp bẩn → đỏ, hai tệp sạch → không bị nêu tên.**
Chỉ chứng minh "ca vi phạm đỏ" là chưa đủ — cổng `exit 1` vô điều kiện cũng thoả điều đó.

## 5 · CA ĐỘT BIẾN BẮT BUỘC (06 phải chạy, 07 sẽ đòi xem)

1. Gỡ dấu vết khỏi `fx-lon.js` → **xanh**; trả lại → **đỏ**.
2. Đổi tên `fx-blob.wasm` thành `libredwg-x.wasm` → phải đỏ **theo đường nội dung**, không phải
   nhờ tên (chứng minh nhánh nội dung thật sự chạy).
3. Trồng một tệp không nhãn → cổng phải **đỏ vì bất biến "không nhãn = 0"**.
4. Hạ ngưỡng coverage xuống dưới thực tế → cổng đỏ; trả về → xanh.

## 6 · ĐIỀU 07 CHƯA KIỂM — nói thẳng

- **T5 archive (`.asar`)**: `NOT ASSESSED`. Chưa đo trong artifact có `.asar` nào không.
- **Hiệu năng**: streaming 1,2 GB mỗi lần `npm test` là chi phí thật, chưa đo. Nếu quá đắt, đề
  xuất tách cổng nặng sang lệnh phát hành riêng — **quyết định của 00/Codex, không phải của 07**.
- **Danh sách dấu vết GPL** hiện chỉ 2 chuỗi. Đủ hay không: `UNKNOWN`, cần lane pháp lý chốt.
- Packet này **chưa được ai duyệt**: `CANDIDATE`.
