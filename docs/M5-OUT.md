# M5-OUT — mảng GIAO DIỆN · 06/08

> ⚠️ **PHẦN A dưới đây là vòng CHẨN ĐOÁN (sáng 06/08). Số của nó ĐÃ CHẾT** — bộ mock từ 67 trang
> còn 57, từ 44 đỏ về 0 đỏ, và **5 kết luận trong Phần A là SAI** (đính chính ở Phần B §2).
> Đọc **PHẦN B — vòng tăng tốc** trước, rồi mới quay lại Phần A để lấy phần đi-3-task còn đúng.

Đi **3 task** như một KTS thật đang dùng app (§0q), nhưng chỉ hỏi **một câu ở tầng giao diện**:
*màn nào task CẦN mà bộ mock không có · màn nào có mock nhưng mock lệch nhu cầu task.*

**Không sửa một dòng code, không sửa một trang mock, không commit (V6).**

- Kết quả trung tính → `docs/GAP-IF.md` dòng **G-M5-01 … G-M5-15**.
- Việc phải làm → `docs/PHIEU-PORT-GIAO-DIEN-2026-08-06.md` (Bảng A port được · Bảng B sửa
  trước khi port · Bảng C phải vẽ mới).

---

## 1 · Cửa kiểm mock — số thật

`npm run check:mocks` (06/08):

```
67 trang quét · 44 ĐỎ · 23 sạch · 80 loại lỗi · 856 lần vi phạm
```

**Bộ 57 trang** trong phiếu = 67 trang trong thư mục **trừ 10 trang `.dc.html`** (bản xuất từ
công cụ thiết kế). Cả 10 trang `.dc` đều ĐỎ, không trang nào lọt.

| Luật | Số trang | Đọc thành lời |
|---|---|---|
| LINK-CUC-BO | 23 | trỏ tệp kịch bản/CSS cục bộ ⇒ mở ở máy khác không ra như tác giả thấy |
| HANDLEBARS | 23 | còn chữ mẫu `{{ }}` chưa thay |
| FONT-SHORTHAND | 15 | `font:` viết tắt nuốt font-family ⇒ chữ Việt rơi về font hệ thống |
| THIEU-DATA-THEME | **19** | chỉ dựng MỘT theme — đúng nguyên nhân lỗi màn tối đã ghi |
| HEX-TTT · MOCK-RONG | 0 | sạch |

## 2 · Cửa kiểm ĐANG ĐỂ LỌT một kiểu hỏng (đo bằng mắt, không suy)

Mở thật bằng trình duyệt 4 trang. Hai trang `.dc` cho kết quả nặng hơn bảng lỗi mô tả:

- **`HopXuatPDF.dc.html`** — hộp thoại dựng ra được, nhưng ô khổ giấy hiện đúng chữ `{{ k.ten }}`,
  danh sách tờ trống, vùng xem trước rỗng. Nút bấm không nói được nó sẽ xuất cái gì.
- **`Thư viện.dc.html`** — vỏ kệ dựng đủ, **ruột trống trơn**: `{{ k.ten }} {{ k.so }}`,
  `{{ TENNHOM }}`, vùng lưới trắng bóc. Trang này trỏ tới **4 trang con** (`KeVatLieu` ·
  `KeDoDac` · `KeDangGom` · `CotThongSo`) — **không trang nào tồn tại trong repo**.

⇒ Cửa kiểm có luật ⑥ "mock rỗng" (đo theo dung lượng + số thẻ) nên **hai trang này lọt lưới**:
chúng nặng vài chục KB và đầy thẻ, chỉ có **dữ liệu là chết**. Đây đúng cơ chế mà luật ⑥ sinh ra
để chặn — phiên sau thấy `ls docs/mocks/` có "Thư viện", tưởng đã có hợp đồng, mở ra trắng, rồi
tự chế. **Thiếu luật "trang con thiếu"** (G-M5-05).

Hai trang mở đối chứng thì lành: `mock-if-thu-vien.html` dựng đủ 6 kệ có số lượng, chỉ sót 4 chỗ
chữ mẫu (tên dự án ở thanh trên + nút đổi theme); `mock-cad-shell-v5.html` dựng đủ vỏ chặng vẽ.

## 3 · Đi 3 task — màn nào có hợp đồng, màn nào không

Ký hiệu: ✅ có mock dùng được · 🟡 có mock nhưng ĐỎ/lệch · ❌ không có mock.

### T1 — sửa lại một thành phần của hồ sơ đã thiết kế

| Bước người dùng | Mock | Ghi chú đo được |
|---|---|---|
| Chọn dự án đã có | ✅ | `mock-if-du-an-v2` sạch |
| Mở hồ sơ CAD | 🟡 | **6 trang cùng tả một màn**, 3 trang trùng tiêu đề, không trang nào ghi "bản chốt" (G-M5-03) |
| **Nhập bản vẽ có sẵn + tiến độ + huỷ + báo cáo nạp** | ❌ | grep 67 trang = 0 (G-M5-01) |
| **Chọn 1 cấu kiện → Inspector** | 🟡 | trang Inspector duy nhất chỉ tả **phòng** (diện tích · vật liệu sàn · thành tiền); code đã đi trước mock (dải 4 trang Khối/Phòng/Tường/Chung) ⇒ port ngược = thụt lùi (G-M5-02) |
| Đổi vật liệu của vật đang chọn | ✅ | `mock-if-thu-vien` có ô "Dùng cho vật đang chọn" (trang ĐỎ, sửa được) |
| Xem lại ở 3D | 🟡 | `mock-3d-thong-nhat` ĐỎ; `mock-if-bang-cong-cu-3d` sạch |
| **Xuất lại hồ sơ (PDF · tờ giấy · nét in)** | 🟡 | 4 trang, **cả 4 chết dữ liệu** (G-M5-04) |
| **Ghi phiên bản · so trước–sau · phát hành lại** | ❌ | không mock, không màn (G-M5-06) |

> Inspector trong mock ẩn sau phím `s` không ghi chú ở đâu — phải đọc mã nguồn trang mock mới
> tìm ra trạng thái quan trọng nhất của T1. Ghi lại để phiên port khỏi kết luận "mock không có
> Inspector".

### T2 — từ phối cảnh bốc tách đồ, ra bản vẽ + spec + bảng khối lượng

| Bước | Mock | Ghi chú |
|---|---|---|
| Đưa ảnh vào chặng dựng ảnh | 🟡 | `mock-mood-collab-g2` sạch; `mock-if-ai-3d`, `mock-render-layout-H3` ĐỎ (một theme) |
| **Cửa sổ công cụ bốc tách + đo món** | ❌ | trang tool-window duy nhất tả việc khác (G-M5-07) |
| **Bảng N món** | ❌ | 0/67 (G-M5-08) |
| **Kho vật liệu · cửa nhập bảng tính** | ❌ | **màn đã CODE mà chưa từng có mock** (G-M5-10) |
| Bảng khối lượng | 🟡 | mock 7 cột vs code 10 cột, lượng là m², **không cột số lượng**; trong khi **trang hồ sơ trình khách ĐÃ vẽ bảng món có cột SL + đơn vị "cái/tấm"** — hai trang đá nhau, và cái đúng nhu cầu T2 thì không cửa nào sinh ra được (G-M5-09). Cột **ảnh**: 0/67 trang |
| Hồ sơ trình khách | 🟡 | `mock-trinh-bay`, `mock-if-trang-chia-se` — cả hai ĐỎ |

### T3 — từ đề bài của chủ đầu tư, tự chia khu và bố trí

| Bước | Mock | Ghi chú |
|---|---|---|
| **Nhận đề bài** | ❌ | app đang có panel 3 bước nằm lọt trong màn vẽ, không có hợp đồng (G-M5-11) |
| Nạp mặt bằng + báo cáo nạp | ❌ | như T1 (G-M5-01) |
| **Chia khu · bảng diện tích · đối chiếu số người · xếp tầng** | ❌ | grep "zoning/chia khu/xếp tầng" = 0 (G-M5-12) |
| Thả đồ từ Thư viện | 🟡 | `mock-if-thu-vien` ĐỎ nhưng dựng đủ; `Thư viện.dc` ruột trống (§2) |
| **Bảng kiểm sau bố trí** | ❌ | không có chỗ đổ kết quả kiểm (G-M5-13) |

## 4 · Hai phát hiện xuyên suốt, không thuộc task nào

- **Bộ mock trộn hai sản phẩm**: 10/67 trang là màn của app song song — trong đó **3 trang mang
  tiền tố của app này nhưng tiêu đề lại là app kia**. Chưa có quy ước tách (G-M5-15).
- **Chiều lệch đang ĐỔI DẤU.** Luật cũ giả định *mock đi trước, code chạy theo*. Đo 06/08 thì có
  ít nhất 5 màn ngược lại: Inspector chặng vẽ, bảng khối lượng, kho vật liệu, cửa nhập bảng tính,
  bảng màu sơn — **code đã ship, mock hoặc lạc hậu hoặc chưa từng tồn tại**. Cứ port máy móc
  "theo mock" là kéo sản phẩm lùi lại. Đây là lý do phiếu port có luật §0.2.

## 5 · Chưa làm — nói rõ, không giấu

- **Mới mở 4/67 trang bằng trình duyệt thật.** 63 trang còn lại đọc ở mức mã nguồn + cửa kiểm.
- **Chưa đối chiếu pixel mock ↔ app một màn nào.** Mọi câu "mock lệch code" ở trên đều dựa trên
  **cấu trúc đọc được** (số cột bảng, số trang Inspector, tên trường), không phải so ảnh.
- **Chưa mở app thật** trong vòng này (3 dev server của phiên khác đang chạy, không đụng).
- Không sửa mock, không sửa `scripts/check-mocks.mjs` dù §2 chỉ ra nó đang để lọt — vòng này
  chỉ chẩn đoán, và sửa cửa kiểm là việc đã ghi thành mục 1 của phiếu port.

## 6 · Ba việc tiếp theo (đề xuất, chờ chốt)

1. **Vá cửa kiểm trước khi vá mock** — thêm luật "trang con thiếu / dữ liệu chết" vào
   `check-mocks.mjs`, vì hiện nay bảng "44 ĐỎ / 23 sạch" vẫn chưa nói đúng sự thật (2 trang lọt).
2. **Chốt bản hiệu lực cho màn 2D** (6 trang → 1 trang) rồi mới đụng bất kỳ việc CAD nào.
3. **Vẽ C1 + C2** (nhập bản vẽ có báo cáo · Inspector cấu kiện) — hai màn mở khoá cả T1 lẫn T3,
   và năng lực ở tầng dưới đều đã có sẵn, chỉ thiếu chỗ hiện.

---
---

# PHẦN B — VÒNG TĂNG TỐC (chiều 06/08): dọn cửa · phiếu port · kiểm phản biện

Ba agent chạy song song: **dọn cửa** (sửa mock) · **soạn phiếu port** · **kiểm phản biện**
(đối thủ, chỉ đọc). Mọi số dưới đây do phiên chính **chạy lại bằng tay**, không chép báo cáo agent.
Không commit (V6).

## 1 · Bộ mock: 67 → 57 trang, 44 ĐỎ → **0 ĐỎ**

```
npm run check:mocks  →  57 file · 0 file đỏ · 0 lỗi
```

- **10 trang app song song** đã tách sang `docs/mocks/_archinote/` (dùng `mv`, có `README.md` giải
  thích, **không xoá** — tài sản của app anh em). Kiểm bằng NỘI DUNG chứ không bằng tên file; 3
  trang mang tiền tố của app này nhưng ruột là app kia đều có **bản kế nhiệm thật hậu tố `-v2`**
  ở lại. Cửa kiểm không quét đệ quy nên thư mục này ra khỏi vùng quét — đúng ý.
- **Nhóm 10 trang bản xuất công cụ thiết kế đã sống lại**: thay vì đoán, agent **chạy đúng lớp
  logic JS trong file bằng sandbox** rồi giải chữ mẫu thành HTML tĩnh. Kiểm lại: **0 file còn
  `{{`**, **0 file còn trỏ tệp kịch bản thiếu**. Ca nặng nhất ở Phần A (hộp xuất PDF: khổ giấy
  hiện `{{ k.ten }}`, danh sách tờ trống) nay đọc ra đúng: *"A3 · ngang · tờ 1/3"*, khổ A0–A3,
  6 mục kiểm trước khi xuất, 2 nút xuất.
- **Màn 2D: đổi kết luận so với Phần A.** Không phải 6 bản y hệt mà là **3 thế hệ** (02/08 →
  03/08 → 06/08). Bản chốt = **cặp 2 trang chế độ Chuyên/Phác thảo (06/08)** vì khớp đúng 2 mode
  đã chốt trong sổ tên chặng; 6 trang cũ đổi tên `_cu.html`, có dải chú thích **chéo hai chiều**
  (bản chốt trỏ tới bản cũ và ngược lại). Kiểm tận file: dấu chú thích có thật ở cả hai phía.

## 2 · 🔴 "0 ĐỎ" KHÔNG có nghĩa là bộ mock LÀNH — đo lại sau khi dọn

Cửa kiểm xanh 100%, nhưng **4/5 lỗ hổng của G-M5-16 còn nguyên** (phiên chính grep lại sau khi
agent dọn xong):

| Lỗ hổng | Sau khi dọn | Cửa kiểm nói gì |
|---|---|---|
| Nhánh theme sáng gắn vào **tên theme app không bao giờ phát ra** | **còn 6 trang** | xanh (luật ④ chỉ tìm chuỗi `data-theme`) |
| Chữ mẫu viết bằng chữ "PLACEHOLDER" thay vì `{{}}` | **còn 62 · 28 · 21 chỗ** ở 3 trang | xanh (luật ② chỉ tìm `{{`) |
| Nạp thư viện icon/phông **từ Internet** | **còn 8 trang** | xanh (luật ① cố ý bỏ qua đường từ xa) |
| Hai trang khác nhau mang **cùng một tiêu đề** | còn (3 trang `_cu` + 1 cặp khác) | không có luật |

⇒ Đây chính là bằng chứng cho **G-M5-16/17**: bảng "N trang sạch" **không đo được sức khoẻ của
bộ hợp đồng**. Việc số 1 của vòng sau vẫn là **vá cửa kiểm trước, đừng vá mock trước**.

## 3 · Kiểm phản biện bắt được 5 kết luận SAI của chính vòng chẩn đoán

Cả 5 phiên chính đã **tự grep lại và xác nhận là mình sai**; đã đính chính TẠI CHỖ trong
`docs/GAP-IF.md` + `docs/PHIEU-PORT-GIAO-DIEN-2026-08-06.md`, ghi rõ "bản đầu SAI" thay vì sửa lặng.

| # | Phần A nói | Sự thật |
|---|---|---|
| 1 | Đường quay phim: "2 component có sẵn, **0 nơi gọi**, món rẻ nhất còn lại" | **Đã nối từ lâu** — có panel ghép hai component đó và được gắn vào màn vẽ, có cả nút công cụ. Nguồn sai: chép một dòng cũ trong sổ chốt, cộng thêm **lệnh grep của chính tôi tự loại mất file đang gọi**. Việc này KHÔNG tồn tại |
| 2 | Bảng khối lượng: "mock 7 cột, lạc hậu hơn code ⇒ **sửa mock theo code**" | Đếm sai (biểu thức cũ chỉ bắt ô toàn chữ — thật ra **10 ô**), và **ngược hướng**: mock đi TRƯỚC code 3 điểm (người dùng thêm cột · công thức ƒx · truy vết sửa-tay ↔ số-máy; grep code = 0). Sửa mock theo code là **xoá đặc tả** |
| 3 | "Mock chỉ có Inspector phòng ⇒ **phải vẽ mới** Inspector cấu kiện" | Trang chế độ cấu kiện **đã vẽ trọn Inspector tường** (đặt theo tim/trong/ngoài · loại dùng chung · dày · cao · dài · hướng · nối tường · cửa trong tường). Việc thật là **PORT**, chỉ vẽ thêm trang Cửa + trang Khối |
| 4 | Zoning: "**phải vẽ mới**, 0/67 trang" | **Đã từng có mock**, bị xoá ở một commit dọn thương hiệu; bản còn sống nằm trong một worktree cũ. Chưa ai chạy `git log --diff-filter=D` |
| 5 | "Không có chỗ hiện kết quả kiểm sau bố trí" | Panel kiểm chuẩn **đã có và đang chạy** trong màn vẽ, tựa trên bộ luật khá dày (thoát hiểm · mật độ người · phòng cháy · chiếu sáng · tiếp cận · Neufert · ISO). Thiếu thật: **mock cho panel đó** + luồng bố trí không tự đẩy kết quả sang |

**Bài học chung của cả 5**: bốn trong năm cái sai đến từ **chép tài liệu / dùng phép đếm gần đúng
thay vì grep đúng chỉ báo** — đúng luật N7 đã ghi. Cái thứ năm (grep tự loại file gọi) là lỗi
kỹ thuật của chính lệnh kiểm, nên **lệnh kiểm cũng phải bị kiểm**.

## 4 · Hai GAP mới, ghi tại `docs/GAP-IF.md`

- **G-M5-16** — cửa kiểm mock cho qua 5 kiểu hỏng (bảng §2 ở trên).
- **G-M5-17** — hợp đồng giao diện **nằm ngoài vùng quét**: bản gieo hệ thiết kế mà sổ chốt gọi
  thẳng là "nguồn sự thật cho công cụ dựng mock", 2 trang đề xuất ở **gốc repo**, hệ thiết kế bản
  **PDF 812 KB** — cả 4 đều đang được git theo dõi, chưa bao giờ bị soi.

## 5 · Phiếu port

- `docs/PHIEU-PORT-GIAO-DIEN-2026-08-06.md` — đã **đính chính 5 dòng** (A1 gạch bỏ · A9 đổi hướng
  port · C2 chuyển từ "vẽ mới" sang "port" · C8/C9 trỏ tới bản mẫu đã có).
- `docs/PORT-TICKETS.md` (MỚI, 882 dòng) — **8 phiếu port** cho thuật toán mồ côi + **5 spec hợp
  đồng** cho màn trống. Phiên chính spot-check **7 đường dẫn đích ngẫu nhiên: 7/7 tồn tại**.
  Phiếu tự ghi cảnh báo **repo là mục tiêu di động** và đổi 3 phiếu đầu từ "nối dây" sang
  "nghiệm thu + phần còn thiếu" vì các phiên song song vừa nối xong trong lúc soạn.

Còn **mồ côi thật** (đã grep lại lúc soạn): sự kiện thả món **0 chỗ nghe** · khớp mẫu block + ba
hình chiếu + đường ảnh→CAD **0 dòng** trong `components`+`app` · ống hút thuộc tính · gõ-số-sau-thao-tác
· 3 module xuất vật liệu.

## 6 · Chưa làm / chưa chắc — nói rõ

- **Không đối chiếu pixel mock ↔ app** một màn nào (cả 3 agent lẫn phiên chính). Mọi câu "mock lệch
  code" đều dựa trên **cấu trúc đọc được**, không phải so ảnh.
- **Trình duyệt từ chối mở file mới** ở cuối phiên (một trang CAD shell cũ và trang hộp xuất PDF sau
  khi sửa) ⇒ trang vừa dựng lại mới **kiểm bằng nguồn, chưa kiểm bằng mắt**. Agent dọn cửa mở mắt
  7 trang; các trang bản-xuất-công-cụ còn lại chỉ verify bằng đọc kết quả.
- **6 trang app song song không mở bằng mắt** (ngoài phạm vi), chỉ xác nhận bằng tiêu đề/nội dung.
- Agent dọn cửa có **sửa vượt phạm vi được giao một chút** (vá màu hardcode làm panel trắng ở nền
  tối, dựng lại một trang khuyết hẳn phần định kiểu). Phiên chính chưa soi hết từng diff — 60 dòng
  thay đổi trong `docs/mocks/`, **cần Hoà liếc qua trước khi commit**.
- **KHÔNG commit** (V6). Vùng staged hiện có 1 file của phiên khác, không phải của vòng này.
