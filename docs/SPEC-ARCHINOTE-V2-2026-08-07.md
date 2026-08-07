# SPEC ARCHINOTE v2 — bản thi công

> **Trạng thái:** CHỐT khung, 07/08/2026. Thay thế toàn bộ spec ArchiNote trước đó.
> **Người thực hiện dự kiến:** agent code ngoài hệ (Antigravity / tương đương).
> **Repo:** viết lại từ đầu trong repo `archinote`. Code cũ ở `ttt-tasks` (4.209 dòng) **không kéo về**
> — chỉ dùng làm tham chiếu đọc, xem §12.
> **Nguồn hiện trạng:** `docs/ARCHINOTE-MAP.md` (khảo sát 06/08, mọi số liệu trong đó kiểm chứng lại được).

---

## 0 · CÁCH DÙNG TÀI LIỆU NÀY

Spec này viết cho người/agent **chưa từng đọc lịch sử dự án**. Không cần hỏi lại ngữ cảnh.

Ba loại câu, phân biệt rõ:

| Ký hiệu | Nghĩa |
|---|---|
| **PHẢI** | ràng buộc cứng, làm khác là sai spec |
| **NÊN** | khuyến nghị, đổi được nếu có lý do ghi lại |
| **🔶 CHỜ CHỐT** | chủ dự án chưa quyết — **không tự quyết thay**, hỏi trước khi code phần đó |

Mọi khẳng định về hiện trạng trong spec này đều có nguồn kiểm chứng. Nếu đo lại thấy khác,
**tin số đo mới**, và ghi lại chỗ lệch — spec là ảnh chụp, không phải sự thật vĩnh viễn.

---

## 1 · SẢN PHẨM LÀ GÌ

### 1.1 Một câu

**ArchiNote là ứng dụng điện thoại để thu dữ liệu hiện trường cho ngành thiết kế & xây dựng —
đo đạc, chụp ảnh có toạ độ, ghi âm thành văn bản — và hoạt động được khi không có mạng.**

### 1.2 Vì sao tồn tại

Người thiết kế ra công trường mang theo: thước laser, điện thoại, sổ tay, máy ảnh. Về văn phòng
phải gõ lại số đo, đặt tên lại ảnh, nhớ lại ghi chú. Khoảng cách giữa "đo được" và "dùng được"
là chỗ mất thời gian và mất chính xác lớn nhất.

ArchiNote xoá khoảng cách đó: đo xong là **đã ở đúng chỗ trong hồ sơ dự án**, không phải gõ lại.

### 1.3 Người dùng

| Vai | Ngoài công trường | Trong văn phòng |
|---|---|---|
| Kiến trúc sư / thiết kế nội thất | đo hiện trạng, chụp ảnh, ghi chú | tra lại số đo, xuất sang phần mềm vẽ |
| Giám sát thi công | chụp tiến độ, đánh dấu sai lệch | báo cáo |
| Quản lý dự án | — | xem tiến độ, phân việc |

**Người dùng chính đứng ngoài trời, một tay cầm điện thoại, tay kia cầm thước, đội mũ bảo hộ,
có thể đeo găng.** Mọi quyết định giao diện phải phục vụ tình huống này.

### 1.4 Ba điểm chết phải tránh

1. **Mất sóng = mất việc.** Công trường thường không có sóng, hoặc sóng chập chờn. App phụ thuộc
   mạng là app vô dụng đúng lúc cần nhất.
2. **Gõ lại số.** Nếu người dùng phải chép số từ máy đo sang điện thoại thì app không tạo ra giá trị.
3. **Không biết dữ liệu này thuộc đâu.** Ảnh không gắn dự án/phòng/hướng thì về nhà thành ảnh rác.

---

## 2 · LUẬT NỀN TẢNG — sản phẩm độc lập, toàn cầu

**ArchiNote KHÔNG phải công cụ nội bộ của một studio nào. Đây là sản phẩm độc lập, dùng/bán
toàn cầu.** Bốn hệ quả bắt buộc:

1. **PHẢI không nhúng cứng thương hiệu của bất kỳ studio nào** — không logo, tên, màu, phông của
   một công ty cụ thể trong khung tên, màn mở đầu, mẫu báo cáo, dữ liệu mẫu.
2. **Brand Kit là của TỪNG DỰ ÁN.** Mọi chỗ cần thương hiệu (đầu trang báo cáo, watermark ảnh,
   trang bìa hồ sơ) PHẢI đọc từ Brand Kit của dự án đang mở, KHÔNG viết cứng.
3. **PHẢI không có tên người thật, số điện thoại thật, tên dự án khách hàng thật** trong code,
   dữ liệu mẫu, ảnh minh hoạ, hay test. Dữ liệu mẫu phải là tên hư cấu, ghi rõ là mẫu.
   *(Bản cũ có rủi ro này — `ARCHINOTE-MAP.md §3` ghi fixtures 259 dòng có thể chứa tên thật.)*
4. **PHẢI song ngữ Việt/Anh ngay từ đầu**, không dán thêm sau. Mọi chuỗi hiển thị đi qua lớp dịch.
   Không viết chuỗi tiếng Việt thẳng vào JSX.

**Giao diện của chính app** có nhận diện riêng của ArchiNote (trung tính, quốc tế), tách hẳn khỏi
nội dung dự án người dùng tạo ra.

---

## 3 · KIẾN TRÚC & CÔNG NGHỆ

### 3.1 Quyết định nền: ứng dụng điện thoại thật, không phải web đóng gói

Bản cũ là web Next.js — **mâu thuẫn với chính định vị của sản phẩm**. LiDAR, Bluetooth với thước
laser, chụp ảnh có toạ độ, ghi âm nền, lưu trữ ngoại tuyến: web không làm được hoặc làm rất tệ.

**Hai lựa chọn, spec khuyến nghị lựa chọn A:**

| | **A · Expo (React Native)** ⭐ khuyến nghị | **B · Capacitor (web + vỏ native)** |
|---|---|---|
| LiDAR / ARKit | qua native module, có sẵn thư viện cộng đồng | phải tự viết plugin native |
| Bluetooth thước laser | `react-native-ble-plx`, chín muồi | plugin Capacitor, ít dùng hơn |
| Lưu ngoại tuyến | SQLite native, nhanh, không giới hạn dung lượng | IndexedDB, giới hạn theo trình duyệt hệ thống |
| Ghi âm nền | có | hạn chế trên iOS |
| Chụp ảnh + EXIF/GPS | thư viện native đầy đủ | qua web API, mất nhiều dữ liệu ảnh |
| Chia sẻ code với web | thấp | cao |
| **Rủi ro lớn nhất** | phải học stack mới nếu chưa quen | **chạm trần kỹ thuật giữa chừng, phải viết lại** |

**Chọn A.** Rủi ro của B là rủi ro chết người: phát hiện không làm được LiDAR sau khi đã xây
xong 60% là mất toàn bộ. Rủi ro của A chỉ là thời gian học.

> 🔶 **CHỜ CHỐT:** nếu chủ dự án đã có kinh nghiệm Expo/React Native ở dự án khác thì A là hiển
> nhiên. Nếu không, cân nhắc lại — nhưng spec vẫn khuyến nghị A vì lý do trên.

### 3.2 Ngăn xếp đề xuất

```
Ứng dụng      Expo (React Native) · TypeScript
Điều hướng    expo-router
Lưu cục bộ    SQLite (expo-sqlite) — NGUỒN SỰ THẬT khi ngoại tuyến
Đồng bộ       hàng đợi tự viết (§5), chạy nền
Máy chủ       🔶 CHỜ CHỐT — xem §4.4
Xác thực      OAuth/OIDC, token lưu trong kho bảo mật của hệ điều hành
Đo đạc        ARKit/ARCore qua native module · BLE cho thước laser
Ảnh           expo-camera + expo-location + ghi EXIF
Âm thanh      expo-av → chuyển văn bản trên máy nếu được, không thì hàng đợi lên máy chủ
Bản đồ        react-native-maps
Mặt trời      thư viện tính vị trí mặt trời theo toạ độ + thời gian (thuần toán, không cần mạng)
```

### 3.3 Nguyên tắc kiến trúc bất di bất dịch

**Máy cục bộ là nguồn sự thật, máy chủ là nơi đồng bộ tới — không phải ngược lại.**

Mọi thao tác ghi PHẢI: ghi xuống SQLite trước → giao diện cập nhật ngay → đẩy lên máy chủ sau,
ở nền, có thể thất bại và thử lại. **Không thao tác nào được chờ mạng mới hiện kết quả.**

Đây là quyết định đắt nhất trong spec. Làm ngược là phải viết lại toàn bộ.

---

## 4 · HỢP ĐỒNG DỮ LIỆU

### 4.1 Định danh — nền của mọi thứ

```ts
// PHẢI: mọi thực thể đều có id sinh trên máy, không chờ máy chủ cấp
type Id = string;              // UUID v7 (có thứ tự theo thời gian, tiện sắp xếp)

interface Project {
  id: Id;
  code: string;                // mã dự án người dùng tự đặt, hiển thị
  name: string;
  brandKitId?: Id;             // §2 luật 2
  createdAt: string;           // ISO 8601, có múi giờ
  updatedAt: string;
}

interface Space {                // phòng / khu vực trong dự án
  id: Id;
  projectId: Id;
  name: string;
  level?: string;              // tầng
  parentId?: Id;               // cho phép lồng: toà → tầng → phòng → góc
}
```

**PHẢI: id sinh trên máy (UUID), không dùng số tự tăng của máy chủ.** Lý do: ngoại tuyến vẫn
phải tạo được dữ liệu mới, và hai máy tạo cùng lúc không được đụng id.

### 4.2 Bản ghi hiện trường — thực thể trung tâm

```ts
type CaptureKind = 'measure' | 'photo' | 'audio' | 'note' | 'panorama' | 'scan';

interface Capture {
  id: Id;
  projectId: Id;
  spaceId?: Id;                // gắn phòng — có thể gắn sau
  kind: CaptureKind;

  // NGỮ CẢNH TỰ GẮN — PHẢI có, không hỏi người dùng
  capturedAt: string;          // ISO 8601 + múi giờ THIẾT BỊ
  location?: { lat: number; lon: number; accuracyM: number };
  heading?: number;            // hướng la bàn, độ, 0 = Bắc thật
  deviceId: string;            // máy nào thu — cần khi nhiều người cùng đo

  payload: MeasurePayload | PhotoPayload | AudioPayload | NotePayload | ScanPayload;

  // TRẠNG THÁI ĐỒNG BỘ — xem §5
  syncState: 'local' | 'queued' | 'syncing' | 'synced' | 'conflict' | 'failed';
  syncedAt?: string;
  serverRev?: string;          // phiên bản máy chủ, để phát hiện xung đột
}

interface MeasurePayload {
  valueMm: number;             // PHẢI lưu bằng MILIMÉT, số nguyên
  kind: 'length' | 'width' | 'height' | 'diagonal' | 'area' | 'volume' | 'angle';
  source: 'laser' | 'lidar' | 'manual' | 'tape';   // PHẢI ghi ĐO BẰNG GÌ
  accuracyMm?: number;
  label?: string;              // "chiều cao trần", "cửa sổ 1"
}

interface PhotoPayload {
  fileUri: string;             // đường dẫn cục bộ
  width: number; height: number;
  annotations?: Annotation[];  // mũi tên, số đo vẽ đè lên ảnh
  linkedMeasureIds?: Id[];     // ảnh này minh hoạ số đo nào
}

interface AudioPayload {
  fileUri: string;
  durationMs: number;
  transcript?: string;         // văn bản
  transcriptState: 'none' | 'pending' | 'done' | 'failed';
  transcriptEngine?: 'on-device' | 'server';
}
```

**Ba luật về đơn vị và độ tin cậy:**

1. **PHẢI lưu mọi kích thước bằng milimét, kiểu số nguyên.** Không lưu mét thập phân —
   sai số dấu phẩy động cộng dồn qua vài phép tính là lệch thật.
2. **PHẢI ghi `source`** — đo bằng laser khác đo bằng LiDAR khác gõ tay. Người đọc hồ sơ sau
   này cần biết con số đáng tin đến đâu.
3. **PHẢI không bao giờ tự sửa số người dùng nhập.** Nghi ngờ thì cảnh báo, không sửa ngầm.

### 4.3 Cầu nối sang phần mềm thiết kế — bảng `PROJECT_STATUS`

Đây là **giao diện duy nhất** giữa ArchiNote và phần mềm thiết kế đầu kia. Hai app **không gọi
thẳng nhau**; chúng cùng đọc/ghi một bảng chung.

```ts
interface ProjectStatus {
  projectId: Id;               // PHẢI khớp id dự án ở CẢ HAI đầu
  projectCode: string;
  stage: 'survey' | 'concept' | 'design' | 'construction' | 'done';
  percent: number;             // 0–100
  updatedAt: string;
  updatedBy: string;
  openUrl?: string;            // đường dẫn mở dự án ở app kia
}
```

**Luật cầu nối:**

- **PHẢI: một chiều ghi cho mỗi trường.** Mỗi trường có đúng một app được quyền ghi, app kia chỉ
  đọc. Hai đầu cùng ghi một trường là công thức đẻ ra **vòng lặp đồng bộ** — lỗi số một của mọi
  cầu nối hai chiều.
- **PHẢI chốt bằng văn bản: trường nào app nào ghi.** Chưa chốt thì chưa code phần này.
- **PHẢI dùng `updatedAt` + `serverRev` để phát hiện xung đột**, không ghi đè mù.

> 🔶 **CHỜ CHỐT trước khi code:** ① `projectId` sinh ở đâu — ArchiNote hay app thiết kế?
> ② `stage`/`percent` do ai ghi? ③ tên bảng và tên trường chính xác trên dịch vụ dữ liệu chung.
> **Hiện cả hai đầu đều 0% phần này** (`ARCHINOTE-MAP.md §4.4`).

### 4.4 Máy chủ — 🔶 CHỜ CHỐT

Bản cũ dùng một dịch vụ bảng tính đám mây của bên thứ ba làm kho dữ liệu chính. Với sản phẩm
bán ra toàn cầu, đó là rủi ro: phụ thuộc một nhà cung cấp, giới hạn tốc độ gọi, không kiểm soát
được nơi đặt dữ liệu (nhiều nước có luật bắt buộc).

Ba hướng, cần chốt trước khi xây §5:

| | Ưu | Nhược |
|---|---|---|
| **Máy chủ riêng** (Postgres + API) | kiểm soát hoàn toàn, không phụ thuộc ai | phải tự vận hành, tốn nhất |
| **Nền tảng dịch vụ sẵn** (loại BaaS) | nhanh, có sẵn xác thực + lưu tệp + đồng bộ | phụ thuộc nhà cung cấp, chi phí tăng theo quy mô |
| **Giữ dịch vụ bảng tính hiện tại** | ít việc nhất, dùng lại được tích hợp cũ | không hợp sản phẩm bán ra, sẽ phải đổi sau |

**Khuyến nghị:** hướng 2 cho giai đoạn đầu, nhưng **PHẢI bọc sau một lớp trung gian** (`lib/sync/backend.ts`)
để đổi nhà cung cấp không phải sửa toàn app. **PHẢI không để tên nhà cung cấp lọt vào tên bảng,
tên trường, tên biến trong lõi.**

---

## 5 · NGOẠI TUYẾN — chương quan trọng nhất

Nếu chỉ đọc được một chương, đọc chương này.

### 5.1 Mô hình

```
Người dùng thao tác
      ↓ (ngay lập tức, không chờ gì)
  SQLite cục bộ  ←──────── NGUỒN SỰ THẬT
      ↓ (nền, có thể thất bại)
  Hàng đợi đồng bộ
      ↓ (khi có mạng)
   Máy chủ
```

### 5.2 Hàng đợi đồng bộ — PHẢI có đủ 6 tính chất

1. **Bền qua tắt app.** Hàng đợi nằm trong SQLite, không nằm trong bộ nhớ tạm.
2. **Thử lại có giãn cách tăng dần** — 1s, 2s, 4s, 8s… tối đa 5 phút. Không thử lại dồn dập.
3. **Gọi lại không nhân đôi.** Mỗi việc mang một khoá riêng; máy chủ nhận trùng khoá thì bỏ qua,
   không tạo bản ghi thứ hai. *(Không có tính chất này, mất sóng giữa chừng sẽ đẻ ra ảnh trùng.)*
4. **Đúng thứ tự trong phạm vi một dự án.** Tạo phòng phải lên trước ảnh thuộc phòng đó.
5. **Tệp lớn tải theo từng phần, tiếp tục được.** Ảnh 12 MP và bản quét LiDAR rất nặng; mất sóng
   giữa chừng không được bắt tải lại từ đầu.
6. **Nhìn thấy được.** Người dùng PHẢI biết: còn bao nhiêu việc chờ, cái nào lỗi, vì sao lỗi,
   và bấm được nút thử lại. **Không có thanh trạng thái đồng bộ = người dùng không tin app.**

### 5.3 Xung đột

Ngoại tuyến nhiều máy thì xung đột là chắc chắn, không phải nếu.

- **Bản ghi hiện trường (`Capture`): không bao giờ sửa, chỉ thêm.** Sai thì tạo bản mới đánh dấu
  thay thế bản cũ. Cách này xoá gần hết xung đột — hai người đo cùng bức tường thì có hai số đo,
  cả hai đều thật, để người dùng chọn.
- **Dữ liệu có thể sửa (tên dự án, tên phòng): dùng `serverRev`.** Lệch phiên bản thì **PHẢI hỏi
  người dùng**, không tự chọn bên nào. "Máy chủ luôn thắng" là cách âm thầm xoá công sức của người
  vừa đi công trường về.
- **PHẢI ghi nhật ký mọi lần giải quyết xung đột**, xem lại được.

### 5.4 Nghiệm thu ngoại tuyến — PHẢI vượt cả 5 ca

| # | Ca thử | Kết quả bắt buộc |
|---|---|---|
| 1 | Bật chế độ máy bay → đo 20 số, chụp 10 ảnh, ghi âm 3 lần → tắt app → mở lại | còn đủ 33 bản ghi, thấy rõ "chờ đồng bộ" |
| 2 | Bật mạng lại | tự đồng bộ, không cần bấm gì, thanh trạng thái chạy về 0 |
| 3 | Ngắt mạng giữa lúc đang tải ảnh 50 MB | tiếp tục từ chỗ dừng, không tải lại từ đầu, không tạo ảnh trùng |
| 4 | Hai máy cùng sửa tên một phòng, cùng ngoại tuyến, rồi cùng lên mạng | hiện xung đột, hỏi người dùng, không âm thầm mất một bên |
| 5 | Máy chủ trả lỗi 500 liên tục 10 phút | app vẫn dùng bình thường, hàng đợi giữ nguyên, báo lỗi rõ ràng, không mất dữ liệu |

---

## 6 · CÁC MODULE — chia theo giai đoạn

Thứ tự này là **thứ tự phụ thuộc**, không phải thứ tự ưu tiên kinh doanh. Làm nhảy cóc sẽ phải quay lại.

### GIAI ĐOẠN 0 · Nền (không có gì chạy được nếu thiếu)

| Mã | Việc | Xong khi |
|---|---|---|
| N-1 | Dựng app Expo, điều hướng, song ngữ VI/EN, hệ màu sáng/tối | mở được app trên máy thật cả iOS lẫn Android |
| N-2 | SQLite + lược đồ dữ liệu §4 + di trú phiên bản | tạo/đọc/sửa/xoá được offline |
| N-3 | Hàng đợi đồng bộ §5 + thanh trạng thái | vượt cả 5 ca §5.4 |
| N-4 | Xác thực + kho khoá bảo mật hệ điều hành | đăng nhập, thoát, token không lọt ra log |
| N-5 | Dự án & Phòng — tạo, sửa, cây lồng nhau | dựng được cây toà→tầng→phòng offline |

**Không bắt đầu Giai đoạn 1 khi N-3 chưa vượt cả 5 ca.** Đây là luật cứng.

### GIAI ĐOẠN 1 · Thu hiện trường — lý do sản phẩm tồn tại

| Mã | Việc | Ghi chú kỹ thuật |
|---|---|---|
| H-1 | **Nhập số đo tay** | bàn phím số cỡ lớn, bấm được khi đeo găng, đơn vị mm |
| H-2 | **Thước laser qua Bluetooth** | dò thiết bị, ghép đôi, đọc số tự động. 🔶 CHỜ CHỐT: hỗ trợ hãng nào trước |
| H-3 | **Chụp ảnh có ngữ cảnh** | tự gắn thời gian, toạ độ, hướng la bàn, dự án, phòng |
| H-4 | **Vẽ chú thích trên ảnh** | mũi tên, số đo, chữ — vẽ tay bằng ngón |
| H-5 | **Ghi âm → văn bản** | ưu tiên chuyển trên máy (chạy được offline); không thì xếp hàng đợi lên máy chủ |
| H-6 | **Quét LiDAR** (chỉ máy có phần cứng) | ARKit/ARCore. PHẢI xuống cấp êm: máy không có LiDAR thì ẩn tính năng, **không hiện nút chết** |
| H-7 | **Ảnh toàn cảnh** | ghép trên máy |
| H-8 | **Vị trí mặt trời** | tính từ toạ độ + thời gian, thuần toán, chạy offline. Dùng để xét hướng nắng |

**Luật giao diện riêng cho module này** (người dùng đứng ngoài nắng, đeo găng):
- Nút chạm **PHẢI ≥ 56 px** mỗi chiều
- **PHẢI dùng được một tay**, thao tác chính nằm nửa dưới màn hình
- **PHẢI đọc được dưới nắng gắt** — tương phản chữ/nền ≥ 7:1 ở chế độ ngoài trời
- **PHẢI không có thao tác nào chỉ làm được bằng kéo-thả** — luôn có nút thay thế

### GIAI ĐOẠN 2 · Điều phối (phần duy nhất bản cũ đã có)

| Mã | Việc | Trạng thái bản cũ |
|---|---|---|
| Đ-1 | Bảng công việc kiểu Kanban | có, nhưng **chỉ đọc** — kéo thả không ghi ngược |
| Đ-2 | Lịch + nhắc việc | có |
| Đ-3 | Biểu đồ tiến độ (Gantt) | có |
| Đ-4 | **Ghi ngược trạng thái việc** | **chưa có — đây là việc chính của giai đoạn này** |
| Đ-5 | Ai đang gánh gì, ai sắp rảnh | code có nhưng **không hiển thị ở đâu** — phải nối vào giao diện |

**Bản cũ chỉ đọc.** Người dùng nhìn thấy việc nhưng muốn đổi trạng thái vẫn phải mở app khác —
đúng nghĩa chưa phải "lớp việc". Đ-4 là thứ biến nó thành thật.

### GIAI ĐOẠN 3 · Cầu nối sang phần mềm thiết kế

| Mã | Việc |
|---|---|
| C-1 | Bảng `PROJECT_STATUS` §4.3 — sau khi chốt ai ghi trường nào |
| C-2 | Xuất gói dữ liệu hiện trường (số đo + ảnh + chú thích) sang app thiết kế |
| C-3 | Mở dự án ở app kia bằng đường dẫn sâu |

### GIAI ĐOẠN 4 · Mở rộng

| Mã | Việc |
|---|---|
| M-1 | Bản đồ dự án, chỉ đường tới công trường |
| M-2 | Nút gọi khẩn cấp / báo an toàn |
| M-3 | Trợ lý tra cứu tiêu chuẩn, từ điển thuật ngữ |
| M-4 | Thư viện vật liệu dùng chung với app thiết kế |

---

## 7 · GIAO DIỆN

### 7.1 Nguyên tắc

- **Ưu tiên điện thoại tuyệt đối.** Máy tính bảng là phần thưởng thêm, không phải mục tiêu.
- **Một màn hình một việc.** Ngoài công trường không ai đọc màn hình dày đặc.
- **Trạng thái luôn nhìn thấy được**: đang ngoại tuyến? còn bao nhiêu việc chờ đồng bộ? PHẢI
  hiện thường trực, không giấu trong menu.

### 7.2 Luật hiển thị bắt buộc

| Luật | Nội dung |
|---|---|
| G-1 | Nút quyết định (Lưu · Xoá · Gửi) **PHẢI có CHỮ**, không chỉ biểu tượng |
| G-2 | Chiều cao dòng ≥ 1,5 — **thấp hơn là cắt mất dấu tiếng Việt** |
| G-3 | Tương phản chữ/nền ≥ 4,5:1 trong nhà, ≥ 7:1 chế độ ngoài trời |
| G-4 | Vùng chạm ≥ 56 px ở màn hiện trường, ≥ 44 px ở màn văn phòng |
| G-5 | Kéo-thả **PHẢI không bao giờ là đường duy nhất** |
| G-6 | Mọi thao tác xoá **PHẢI hoàn tác được** hoặc hỏi xác nhận có nêu hậu quả |
| G-7 | Thao tác chạy lâu **PHẢI có tiến độ và nút huỷ** |
| G-8 | Chữ mẫu chưa có dữ liệu **PHẢI không lọt ra màn** |

### 7.3 Nhận diện

🔶 **CHỜ CHỐT: bảng màu và phông chữ của ArchiNote.** Bản cũ dùng nâu đất trên nền giấy; một spec
khác lại đòi kem/vàng/tím. Chưa bản nào được áp. **Cần một bộ token duy nhất, chốt trước khi vẽ
màn thứ hai** — nếu không mỗi màn một kiểu, và sửa sau đắt gấp nhiều lần.

---

## 8 · BẢO MẬT & QUYỀN RIÊNG TƯ

- **PHẢI: token xác thực nằm trong kho bảo mật của hệ điều hành**, không nằm trong bộ nhớ thường
  hay tệp cấu hình.
- **PHẢI: khoá của máy chủ không bao giờ có mặt trong app.** App gọi API của mình; API mới gọi
  dịch vụ bên thứ ba.
- **PHẢI: xin quyền đúng lúc cần, kèm giải thích.** Xin quyền vị trí ngay khi mở app lần đầu mà
  không nói lý do là cách nhanh nhất để bị từ chối vĩnh viễn.
- **PHẢI: vị trí là tuỳ chọn.** Người dùng từ chối thì app vẫn chạy, chỉ mất phần gắn toạ độ.
- **PHẢI: mã hoá dữ liệu trên máy** nếu chứa thông tin công trình nhạy cảm.
- **PHẢI: xoá được toàn bộ dữ liệu một dự án khỏi máy** — có nước bắt buộc điều này bằng luật.
- **PHẢI: không ghi dữ liệu cá nhân ra nhật ký lỗi.**

---

## 9 · CHẤT LƯỢNG — điều kiện nghiệm thu

### 9.1 Luật kiểm chứng

| Luật | Nội dung |
|---|---|
| K-1 | **Báo cáo không phải bằng chứng.** "Đã làm xong" phải kèm số đo hoặc ảnh chụp màn hình |
| K-2 | **Có tệp không có nghĩa là chạy được.** Component phải chứng minh được có nơi hiển thị thật |
| K-3 | **Khai thật cái chưa xong.** Làm được 70% thì ghi 70%, không ghi ✅ |
| K-4 | **Thêm trường dữ liệu phải có nơi tiêu thụ.** Không đẻ trường rồi bỏ đó |
| K-5 | **Không nuốt lỗi im lặng.** Bắt lỗi rỗng bị cấm — hoặc hiện cho người dùng, hoặc ghi log kèm lý do |
| K-6 | **Test phải có răng.** Mỗi bộ test kèm một ca đối chứng chứng minh nó fail được khi code sai |

### 9.2 Cổng chất lượng — không qua thì không tính là xong

- Kiểm kiểu dữ liệu: **0 lỗi**. Không có ngoại lệ "lỗi có sẵn của người khác".
- Toàn bộ test xanh trên máy sạch.
- Vượt cả 5 ca ngoại tuyến §5.4 **trên máy thật**, không phải máy ảo.
- Chạy được trên **iOS và Android máy thật**, không chỉ trình giả lập.
- Không chuỗi tiếng Việt viết thẳng trong mã giao diện (song ngữ §2 luật 4).
- Không tên riêng của studio/khách hàng nào trong mã, dữ liệu mẫu, ảnh (§2).

---

## 10 · CẤM

1. **Cấm để thao tác nào phải chờ mạng mới hiện kết quả.**
2. **Cấm "máy chủ luôn thắng"** khi xung đột dữ liệu có thể sửa.
3. **Cấm nhúng cứng thương hiệu studio nào vào sản phẩm.**
4. **Cấm tên người thật / dự án khách thật** trong mã, dữ liệu mẫu, test, ảnh.
5. **Cấm bắt lỗi rỗng.**
6. **Cấm hiện nút cho tính năng phần cứng không hỗ trợ** (LiDAR trên máy không có) — ẩn hẳn.
7. **Cấm để tên nhà cung cấp hạ tầng lọt vào tên bảng/trường/biến trong lõi.**
8. **Cấm hai đầu cùng ghi một trường** trong bảng cầu nối §4.3.
9. **Cấm sửa ngầm số người dùng nhập.**
10. **Cấm lưu kích thước bằng mét thập phân** — milimét, số nguyên.

---

## 11 · CÒN CHỜ CHỐT

Không code phần liên quan khi mục tương ứng chưa có câu trả lời.

| # | Câu hỏi | Chặn phần nào |
|---|---|---|
| 1 | Máy chủ: tự dựng · nền tảng dịch vụ · giữ dịch vụ hiện tại? (§4.4) | toàn bộ Giai đoạn 0 |
| 2 | `projectId` sinh ở đâu — ArchiNote hay app thiết kế? (§4.3) | Giai đoạn 3 |
| 3 | Trường nào app nào được ghi trong bảng cầu nối? (§4.3) | Giai đoạn 3 |
| 4 | Bảng màu + phông chữ ArchiNote? (§7.3) | màn thứ hai trở đi |
| 5 | Thước laser hỗ trợ hãng nào trước? (H-2) | H-2 |
| 6 | Chuyển giọng nói thành văn bản: trên máy hay máy chủ? (H-5) | H-5 |
| 7 | Có tính tiền theo người dùng không — ảnh hưởng mô hình tài khoản/nhóm? | N-4 |

---

## 12 · CODE CŨ — dùng thế nào

Bản cũ (web, ~4.200 dòng) **không kéo về**, nhưng **đáng đọc** ở ba chỗ:

| Đọc để lấy gì | Ở đâu trong bản cũ |
|---|---|
| Cách gọi dịch vụ dữ liệu, hình dạng bảng thật | tầng `lib/lark/` |
| Giao diện Kanban / Lịch / Gantt đã chạy được | các component tương ứng |
| Cách mã hoá token | `token-crypto.ts` |

**Cấm chép nguyên**: mọi thứ dính tên nhà cung cấp, dữ liệu mẫu (có thể chứa tên thật §2), và
kiến trúc phụ thuộc mạng.

Ba việc dọn trước khi bắt đầu:
1. Chốt một repo duy nhất, xoá/lưu trữ repo còn lại — hiện có hai nơi cùng tên, một rỗng.
2. Ghi vào git các spec đang chưa được theo dõi — mất máy là mất hẳn.
3. Rà dữ liệu mẫu xem có tên người thật không, xoá trước khi công khai repo.

---

## 13 · LỊCH SỬ SỬA

| Ngày | Bản | Thay đổi |
|---|---|---|
| 07/08/2026 | v2 | Bản đầu. Chốt: viết lại từ đầu · sản phẩm global trung tính · ứng dụng điện thoại thật · cục bộ là nguồn sự thật. Thay thế toàn bộ spec trước. |
