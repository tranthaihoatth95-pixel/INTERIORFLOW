# PACKET 07 · COVERAGE CỔNG GIẤY PHÉP PHÁT HÀNH — **vòng 2**

> **Bàn 07 · QUALITY ra packet — KHÔNG cầm bút production.** 06 BUILD thi công; 07 counterproof
> trước merge. Trạng thái: **CANDIDATE**. Toàn hệ: **NOT ASSESSED** — không tuyên PASS.
> Phiếu: `HO-20260830121616` (vòng 1) → `HO-20260830132801` (Codex: ACCEPT DIAGNOSIS, REVISE GATE).

## 0 · TÁI CHẠY ĐƯỢC — số ở đây không phải lời kể

```bash
node scripts/quality/do-coverage-giay-phep.mjs          # bảng người đọc
node scripts/quality/do-coverage-giay-phep.mjs --json    # biên nhận máy, có hash
```

Biên nhận `2026-08-30T13:31Z` · hash `586a13c2afe769f8`:

| đường đi | tệp | MB |
|---|---:|---:|
| bắt theo TÊN | 0 | — |
| **quét ruột** | 15.493 | 268,7 |
| **bỏ vì ĐUÔI** | 3.932 | 942,6 |
| bỏ vì CỠ >64MB | **0** | **0,0** |
| tổng | 19.425 | 1.211,4 |

**Coverage bytes 22,18% · theo tệp 79,76%.**
Hai con số này của cùng một cổng. Ai báo cáo bằng "79,76%" là đang nói thật mà che mất 78% khối
lượng — lý do §3 bỏ hẳn ngưỡng phần trăm.

## 1 · CƠ CHẾ — vì sao trần 64MB bắn 0 phát

`soi-giay-phep-phat-hanh.mjs` chạy theo thứ tự: `:137` tên → **`:141` ĐUÔI** → **`:144` CỠ**.
Lọc đuôi đứng TRƯỚC kiểm cỡ, nên **tệp nhị phân lớn không bao giờ tới được bước đo cỡ**. Trần chỉ
bắn được với tệp **vừa hợp đuôi vừa >64MB** — giao của hai tập, hôm nay rỗng.

Đo biên: tệp quét-được lớn nhất **3,9 MB** (`bien-nhan-artifact.json`) — **còn 60,1 MB mới chạm
trần**. ⇒ **T3 là RỦI RO NGỦ, không phải lỗ đang chảy.** Chẩn đoán vòng 1 ("trần 64MB là lỗ") đã
được RÚT; giữ T3 làm ca dormant vì nó *đạt được* (một bundle `.js` gộp có thể vượt 64MB), chỉ là
chưa xảy ra.

Bằng chứng cơ chế mạnh hơn bằng chứng đếm: đếm nói "hôm nay 0", cơ chế nói "vì sao 0, và khi nào
sẽ khác 0".

## 2 · THREAT MODEL

| # | Đường lọt | Cổng hiện tại | Trạng thái | Đo được |
|---|---|---|---|---|
| T1 | nhị phân (`.wasm/.node/.dylib/.so`) **tên trung tính** | đuôi loại ở `:141`, không tới nội dung | 🔴 **HỞ** | **43 tệp · 343,4 MB** |
| T2 | GPL trong bundle `.js` đã minify, dấu vết đổi tên | có quét, nhưng chỉ so 2 chuỗi cố định | 🟠 hở một phần | — |
| T3 | tệp **hợp đuôi** > 64 MB | `continue` im lặng | 🟡 **NGỦ** | 0 tệp; biên 60,1 MB |
| T4 | GPL qua `node_modules` production | `license:check --excludePackages '@mlightcad/libredwg-web@0.7.7'` | 🔴 **HỞ CỐ Ý** | — |
| T5 | payload trong kho nén | không mở | 🔴 **HỞ — ĐÃ XÁC NHẬN** | **`dist/InteriorFlow-0.1.0-arm64.dmg` · 320,6 MB** |
| T6 | symlink ra ngoài cây | `continue` | 🟢 chặn đúng | — |

🔴 **T5 nay là phát hiện nặng nhất, không còn `NOT ASSESSED`.** Kho nén 320,6 MB **chính là bộ cài
giao cho người dùng**. Cổng đang soi cây build mà không soi **thứ thật sự được giao**. Một gói GPL
nằm trong `.dmg` là vô hình tuyệt đối với cổng hôm nay.

## 3 · CỔNG ĐÚNG: **100% ACCOUNTED**, không phải ngưỡng phần trăm

Vòng 1 đặt `≥99,0%` bytes / `≥99,5%` tệp. **Rút.** Đó là policy tự đặt, không có EV, và tệ hơn:
một ngưỡng 99% cho phép đúng 1% nguy hiểm nhất trượt mà cổng vẫn xanh — 43 tệp nhị phân chỉ là
**0,22% số tệp**.

Thay bằng bất biến đếm được:

| bất biến | giá trị | vì sao |
|---|---|---|
| tệp **không nhãn** | **= 0** | mọi tệp phải được kể tên. Đây là cổng, không phải thống kê |
| `SCANNED` + `HASH_ONLY` + `UNSUPPORTED_WITH_REASON` | **= tổng tệp duyệt được** | tổng ba nhãn khớp tổng tệp; lệch = cổng nuốt tệp |
| nhóm nhị phân (`.wasm .node .dylib .so .a .bin .dll .exe`) | **100% `SCANNED`** | đây là chỗ T1 sống. Không nhãn nào khác được chấp nhận |
| nhóm kho nén (`.asar .zip .dmg .7z .gz`) | **100% `SCANNED` hoặc `ENUMERATED`** | T5. `HASH_ONLY` cho kho nén là né việc |
| `UNSUPPORTED_WITH_REASON` | mỗi cái **một lý do đọc được** | không lý do = silent skip đội lốt |

Nhãn theo **loại tệp + threat model**, không theo tỷ lệ. Phần trăm vẫn ghi vào receipt để theo dõi
xu hướng — **nhưng không phải điều kiện đỗ**.

## 4 · NGHĨA CỦA NHÃN — `SCANNED` ≠ "đã xác minh giấy phép"

| nhãn | nghĩa CHÍNH XÁC |
|---|---|
| `SCANNED` | **đã chạy detector X trên toàn bộ byte**, X khai tên trong receipt. Nói về việc ĐÃ LÀM GÌ, **không** khẳng định tệp sạch giấy phép |
| `ENUMERATED` | kho nén đã mở/liệt kê, mỗi mục con lại mang một nhãn của riêng nó |
| `HASH_ONLY` | không đọc được nội dung; ghi `sha256` + cỡ để đối chiếu về sau |
| `UNSUPPORTED_WITH_REASON` | cố ý không xử, kèm lý do đọc được |

Vì sao tách bạch: "đã quét" mà hiểu thành "đã xác minh" là cách một cổng chạy đúng vẫn cho ra kết
luận sai. Detector hiện tại chỉ so **2 chuỗi cố định** — nó phát hiện *dấu vết đã biết*, không
chứng minh *không có GPL nào khác*.

## 5 · TÁCH HAI CỔNG (mục nặng nhất Codex nêu)

Cổng hôm nay gộp hai câu hỏi khác nhau, và đó là lý do nó **vừa không bắt được cái cần bắt, vừa
sẽ đỏ oan khi gỡ exemption**.

| | **SOURCE dependency audit** | **DISTRIBUTED artifact gate** |
|---|---|---|
| hỏi | cây phụ thuộc nguồn có GPL không | **thứ giao cho người dùng** có GPL không |
| phạm vi | `node_modules`, `package.json` | `dist/*.dmg` (mở ra), `dist-installer/**` |
| công cụ | `license:check` | scanner artifact + mở kho nén |
| exemption | được phép, **phải khai lý do + hạn** | **không exemption** |
| receipt | riêng | riêng |

Vì sao bắt buộc tách: `@mlightcad/libredwg-web` **tồn tại trong source** kể cả khi cờ nhập DWG tắt
và nó **không vào gói**. Bỏ exemption mà giữ cổng gộp ⇒ `npm test` **đỏ oan** dù bản phát hành
sạch. Ngược lại, giữ exemption ở cổng gộp ⇒ cổng artifact cũng mù luôn — đúng tình trạng hôm nay.

Hai cổng, hai receipt, hai tiêu chí đỗ. `PROPOSAL`, cần 00/Codex chốt trước khi 06 thi công.

## 6 · FIXTURE — phủ **bốn** đường lách

`node scripts/quality/dung-fixture-giay-phep.mjs` (`--don` để xoá). Sinh lúc chạy, `.gitignore`
chặn — không commit nhị phân (bài học `.dmg` 337 MB buộc viết lại lịch sử git 30/08).

| ca | tệp | phủ | kỳ vọng |
|---|---|---|---|
| A · allow-list bypass | `fx-blob.wasm` 3 MB, tên trung tính, dấu vết ở giữa | **T1** | ĐỎ |
| B · renamed binary | `fx-doi-ten.bin` — cùng payload, đuôi khác | **T1** | ĐỎ theo **nội dung**, không nhờ tên |
| C · archive | `fx-kho.zip` chứa tệp bẩn | **T5** | ĐỎ sau khi mở |
| D · excluded dependency | `fx-node_modules/@mlightcad/libredwg-web/package.json` | **T4** | ĐỎ ở cổng SOURCE |
| E · dormant | `fx-lon.js` 65 MB, payload ở ~64,0 MB | **T3** | ĐỎ — nhưng đánh dấu **DORMANT** |
| — counterproof | `fx-sach.js`, `fx-sach.wasm` | mọi nhánh | **XANH**, không bị nêu tên |

⚠️ **Ca E xanh giả nếu đứng một mình.** Cổng chỉ sửa trần 64MB sẽ đỏ ở E và ta tưởng đã xong,
trong khi A/B/C/D vẫn lọt. E chỉ có giá trị khi chạy **cùng** bốn ca kia.
⚠️ **Counterproof bắt buộc**: cổng `exit 1` vô điều kiện cũng thoả mọi ca ĐỎ. Không có ca XANH thì
không phân biệt được cổng thật với cổng luôn kêu.

## 7 · CA ĐỘT BIẾN 06 PHẢI CHẠY, 07 SẼ ĐÒI XEM

1. Gỡ dấu vết khỏi `fx-blob.wasm` → xanh; trả lại → đỏ.
2. Đổi `fx-blob.wasm` → `libredwg-x.wasm`: phải đỏ **theo đường nội dung**; tạm tắt nhánh tên để
   chứng minh nhánh nội dung thật sự chạy, không ăn may nhờ tên.
3. Trồng một tệp không nhãn → đỏ vì bất biến *không nhãn = 0*.
4. Đổi `fx-sach.wasm` thành bẩn → đỏ; trả lại → xanh (**counterproof hai chiều**).

## 8 · ĐIỀU 07 CHƯA KIỂM — nói thẳng

- **Chi phí**: mở `.dmg` 320,6 MB + streaming 1,2 GB mỗi lượt `npm test` chưa đo. Nếu quá đắt,
  tách cổng nặng sang lệnh phát hành — **quyết định của 00/Codex, không phải 07**.
- **Đủ dấu vết chưa**: detector hiện có 2 chuỗi. `UNKNOWN` — cần lane pháp lý chốt danh sách.
- **Mở `.dmg` trên CI không phải macOS**: `NOT ASSESSED`.
- Packet **chưa ai duyệt**: `CANDIDATE`. Mã sản xuất **chưa sửa**.
