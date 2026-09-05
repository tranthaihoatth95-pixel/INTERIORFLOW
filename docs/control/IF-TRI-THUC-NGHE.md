# TRI THỨC NGHỀ NỘI THẤT — nạp cho bàn audit trước khi nó mở app

> Hoà chốt 05/09: *"để là designer thật, bạn phải cho nó kiến thức tương đương senior interior
> design."* Một vai diễn không có tri thức nghề thì audit ra kết quả của một người làm UX chung
> chung khoác áo kiến trúc sư — nó bắt được nút xấu, **không bắt được hồ sơ sai**.

**Ai đọc:** bàn `if-nguoi-nghe` (bắt buộc, trước mọi lượt audit) · bàn `if-chuyen-mon` (khi suy
tính năng ra màn chính) · bất kỳ ai định phán một con số nghề.

---

## 0 · [Đ2] REPO ĐÃ CÓ — đọc trước, đừng suy lại

⛔ **65 luật ngành đã nằm trong mã**, có `id`, có nguồn, có ngày hiệu lực, máy chạy được. Suy lại
bằng trí nhớ là **tội N8** và tệ hơn: trí nhớ không có `effectiveFrom`.

| bộ | mục | ở đâu |
|---|---|---|
| `neufert` — công thái học nền | 9 | `lib/cad/standards/neufert.ts` |
| `vn-residential` — nhà ở VN | 8 | `vn-residential.ts` |
| `vn-fire` — PCCC | 9 | `vn-fire.ts` |
| `vn-lighting` — chiếu sáng | 4 | `vn-lighting.ts` |
| `vn-electrical` — điện | 3 | `vn-electrical.ts` |
| `vn-accessibility` — tiếp cận | 16 | `vn-accessibility.ts` |
| `intl-egress` — thoát hiểm quốc tế | 10 | `intl-egress.ts` |
| `iso-drafting` — thể hiện bản vẽ | 6 | `iso-drafting.ts` |

Kèm: `registry.ts` (ghi đè theo vùng · `verified` khi tra được nguồn kiểm chứng) · `checker.ts`
(**CHỈ ĐỌC doc và TRẢ VỀ đề xuất, KHÔNG BAO GIỜ tự sửa entity**) · `ngu-canh.ts` ·
`rule-effective-date.test.ts`.

Tài liệu: `docs/CHUAN-THIET-KE-v7.6-NGUON.md` · `docs/CHUAN-DAU-RA-NGHE.md` (**LUẬT chuẩn đầu ra,
checklist nhị phân**).

**Cách dùng đúng:** tra `registry.ts` trước. Không có luật cho điều mình định phán ⇒ nói thẳng
*"không luật nào phủ"*, đừng bịa số cho ra vẻ chuyên nghiệp.

---

## 1 · THANG BẬC BA TẦNG — Hoà chốt 15/08, đọc kỹ trước khi so số

Số nào thắng số nào, và **vì sao trộn sai là tự huỷ**:

```
A · NỀN CÔNG THÁI HỌC   số gốc từ cơ thể người (Neufert)     → lấp chỗ B im lặng
B · CHUẨN/LUẬT QUỐC GIA soi A theo thực tế nước mình         → THẮNG A khi B có nói
                        (giữ nguyên hoặc NÂNG, không hạ)
C · BIẾN SỐ NGỮ CẢNH    ven biển · vùng ngập · hướng Tây…    → chỉ SIẾT THÊM, cấm nới
```

- **Khác bậc = chồng tầng, hợp lệ.** Neufert chạy cạnh `vn-*` **không phải** trộn.
- **Trộn thật chỉ có hai ca:** hai luật quốc gia cho cùng một việc · hai nền công thái học cho
  cùng một kích thước. Tức **cùng bậc + cùng vấn đề + hai nguồn**.
- **Một dự án — một họ chuẩn.** Trộn họ là lỗi hệ thống: mặt bàn theo châu Âu + bếp theo châu Á +
  giường kiểu Nhật ⇒ mỗi số đúng ở quê nó, ghép lại thành công trình không ai ở được.
- **Cấm TRỘN ÂM THẦM, không phải cấm trộn.** Trộn có khai báo + có lý do = nghề. Trộn im lặng =
  tự huỷ.
- **Neo là KHOẢNG, không phải một số.** 750 chỉ là bản chung làm quy ước (min 720 / typical 750 /
  max 780).

---

## 2 · BỘ HỒ SƠ THẬT — cái senior giao cho khách

Audit mà không biết đầu ra nghề gồm những gì thì không biết app đang thiếu gì.

| tập | nội dung | tỷ lệ hay dùng |
|---|---|---|
| Mặt bằng bố trí | đồ đạc, lối đi, tên phòng, diện tích | 1:50 · 1:100 |
| Mặt bằng lát sàn | vật liệu, hướng lát, vạch phân chia | 1:50 |
| Mặt bằng trần (RCP) | cao độ trần, đèn, điều hoà, khe co giãn | 1:50 |
| Mặt bằng điện | ổ cắm, công tắc, mạch, cao độ lắp | 1:50 |
| Mặt đứng khai triển | từng mảng tường một, kích thước, vật liệu | 1:20 · 1:25 |
| Chi tiết cấu tạo | nút giao, cách bắt, lớp vật liệu | 1:5 · 1:10 |
| Bảng vật liệu | mã · tên · NCC · quy cách · vị trí dùng | — |
| Bảng đồ (FF&E) | mã · ảnh · kích thước · số lượng · giá | — |
| BOQ / dự toán | khối lượng theo đơn vị đo được + hao hụt | — |

**Tỷ lệ chuẩn (ISO 5455):** 1:1 · 1:2 · 1:5 · 1:10 · 1:20 · 1:50 · 1:100 · 1:200 · 1:500.
`1:47` **không tồn tại trong nghề** — thấy nó là thấy engine tự tính tỷ lệ cho vừa khung giấy,
lỗi đã bắt được ngày 11/08. (1:25 · 1:30 dùng thực tế ngoài ISO ⇒ được, nhưng phải cố ý.)

**Khổ giấy (ISO 216):** hồ sơ thi công A1 · A2 · A3; thuyết trình khách A3. In **≥300dpi**.

**Đơn vị BOQ — chỗ số sai làm mất tiền:** `m²` sàn/tường/trần/sơn · `md` (mét dài) phào·nẹp·bậc ·
`m³` khối · `cái`/`bộ` thiết bị. Hao hụt: gạch **5-10%**, gỗ **10-15%**.
⚠️ **BOQ chỉ nhận số ĐO ĐƯỢC** (Hoà chốt 15/08) — không cột "tạm tính", không cờ độ tin cậy. Số
ước tính từ ảnh phẳng **không được vào BOQ**.

---

## 3 · SỐ SENIOR THUỘC LÒNG — dùng để NGỬI ra chỗ sai, không dùng để phán

⚠️ **Đây là mốc nhớ nghề, KHÔNG phải luật.** Muốn phán thì tra `registry.ts` §0. Giá trị thật của
bảng này: nhìn một màn là biết *"chỗ này ngờ ngợ"* rồi mới đi tra.

| | mm |
|---|---|
| bàn ăn cao · ghế ngồi cao · hở đùi | 750 · 450 · ~280 |
| bàn bếp cao (VN) · tủ trên cách mặt bàn | 820-850 · 600-700 |
| sâu tủ bếp dưới · tủ trên · tủ áo | 600 · 350 · 600 |
| giường đôi | 1600/1800 × 2000 |
| lối đi một người · lối chính | ≥600 · 900-1200 |
| ghế ăn tới tường (kéo ghế · đi qua sau) | ≥800 · ≥1000 |
| lối quanh đảo bếp | ≥900, tốt 1000-1200 |
| bậc thang: cổ · mặt · công thức | 150-180 · 250-300 · 2h+b = 600-650 |
| tay vịn | 850-900 |
| ổ cắm · công tắc | 300-400 · 1200-1400 |
| trần thông thuỷ tối thiểu | 2400 (VN ở thường 2700-3200) |

**Chiếu sáng:** khách 100-300 lux · bàn thao tác bếp 300-500 · đọc sách 500 · tắm 150-300.
Nhiệt độ màu 2700-3000K ấm cho ở · 4000K trung tính · CRI ≥90 khi cần đọc đúng vật liệu.
Ba lớp: chiếu chung · chiếu điểm · rọi tường.

**Vật liệu — cặp đúng/sai hay gặp:** ven biển dùng **inox 316** không phải 304 (ăn mòn clorua) ·
khu ẩm dùng **MDF lõi xanh chống ẩm**, không MDF thường · mặt bếp: đá nhân tạo/sintered chịu
nhiệt-ố tốt hơn marble tự nhiên.

---

## 4 · TAY ĐÃ QUEN — phím tắt, và vì sao nó là chuyện tiền bạc

Senior gõ phím không nhìn. Lệch một phím **không phải chuyện thẩm mỹ, là chi phí học lại** nhân
với số lần dùng mỗi ngày.

| lệnh | AutoCAD | SketchUp | 3ds Max | Photoshop |
|---|---|---|---|---|
| chọn | `Esc` thoát lệnh | `Space` | `Q` | `V` |
| di chuyển | `M` | `M` | `W` | `V` |
| xoay | `RO` | `Q` | `E` | — |
| tỉ lệ | `SC` | `S` | `R` | `Ctrl+T` |
| chép | `CO`/`CP` | `Ctrl`+kéo | `Shift`+kéo | `Alt`+kéo |
| đo | `DI` | `T` | `Tape` | — |
| offset | `O` | `F` | — | — |
| đối xứng | `MI` | — | `Mirror` | — |
| lặp mảng | `AR` | — | `Array` | — |
| cắt/kéo dài | `TR` / `EX` | — | — | — |
| hatch | `H` | — | — | — |
| lớp | `LA` | Tags | Layer | Layers |
| đùn khối | — | `P` push/pull | Extrude | — |

**Lệch đã đo trong IF (05/09):** Xoay `RO`/`RO`/**`Q`** · Chép `CO`/`CO`/**`D`** ·
Đo `DI`/`DI`/**`T`** · Chọn `Esc`/**`V`** ⇒ học ở 2D sang 3D bấm sai.
Hai quy ước bất di: **`Esc` luôn huỷ** · **`Space`/`Enter` lặp lệnh vừa chạy** (AutoCAD) — phá
hai cái này là phá phản xạ cơ bắp.

---

## 5 · QUY TRÌNH & NỖI ĐAU THẬT — nguồn của mọi câu hỏi audit sắc

**Mạch nghề:** đề bài → concept → phương án sơ bộ → triển khai → hồ sơ thi công → dự toán/thầu →
shop drawing → giám sát tác giả → nghiệm thu.

**Bảy nỗi đau senior sống chung — mỗi cái là một câu hỏi audit:**

| nỗi đau | câu hỏi audit |
|---|---|
| đổi một vật liệu phải sửa **4 nơi** (bản vẽ · 3D · bảng vật liệu · dự toán), **luôn sót một chỗ** | đổi ở IF một chỗ thì mấy nơi tự đổi? |
| render đẹp nhưng **thi công không ra được** | app có chặn chi tiết bất khả thi không, hay chỉ vẽ cho đẹp? |
| `final_final_v3_sua-lan-cuoi.dwg` | mở lại bản cũ được không, biết bản nào là bản giao? |
| xuất PDF **sai tỷ lệ · chữ đè hình** | mở tệp xuất ra soi, đừng soi màn hình |
| thợ đọc bản vẽ sai vì **thiếu chi tiết** | bản vẽ IF ra có đủ nút giao không? |
| file nặng, crash, mất việc | lưu rồi mở lại còn nguyên không — **mất một lần là mất niềm tin vĩnh viễn** |
| khách đổi ý phút cuối | quay lui được mấy bước, có mất phần đã duyệt không? |

---

## 6 · BA CÂU HỎI CHO **MỖI MẢNG** — Hoà chốt 05/09, cửa bắt buộc

> Nguyên văn: *"mỗi một mảng 1 visual trong IF, khi xây, người thiết kế và người xây phải tự hỏi:
> **một kiến trúc sư và designer sẽ muốn thấy gì? sẽ thao tác như thế nào? sẽ có tiêu chuẩn ra
> sao** với frontier app và output kết quả đầu ra sản phẩm IF làm."*

Áp cho **từng mảng**, không phải cho cả app một lần. Chưa trả lời đủ ba câu ⇒ **chưa được dựng**.

| # | câu hỏi | trả lời SAI kiểu gì | trả lời ĐÚNG phải có |
|---|---|---|---|
| ① | **MUỐN THẤY GÌ** | liệt kê thành phần giao diện (*"có thanh trên, có panel phải"*) | thứ KTS cần **nhìn ra ngay**, xếp hạng: cái gì to nhất · cái gì đọc được từ xa · cái gì chỉ cần khi soi kỹ. **Đúng một nhân vật chính** |
| ② | **THAO TÁC THẾ NÀO** | tả nút bấm | **chuỗi tay** của một việc nghề thật, từ đầu tới cuối: mấy cú bấm · phím nào · tay có phải rời chuột không · làm 40 lần/ngày thì mỏi ở đâu |
| ③ | **TIÊU CHUẨN RA SAO** | nói chung chung *"theo Material Design"* | **hai vế, tách bạch** — xem dưới |

### ③ tách làm HAI vế — chỗ hay bị gộp nhầm nhất

| vế | đo cái gì | thước |
|---|---|---|
| **A · FRONTIER APP** — bề mặt của chính app | tương phản · vùng bấm · thang bo · nhịp lưới · chuyển động · phím tắt · trạng thái rỗng | `IF-CHUAN-NEN.md` · NT-1..18 · KB-1..4 · EXS 12 điều · cổng `soi:*` |
| **B · OUTPUT SẢN PHẨM** — thứ IF **làm ra và đem giao** | tỷ lệ chuẩn · khổ giấy · khung tên · nhãn không đè hình · dim ngoài hình · ≥300dpi · BOQ có nguồn giá · PPTX chữ sửa được · 0 placeholder | `docs/CHUAN-DAU-RA-NGHE.md` (**LUẬT, checklist nhị phân**) · ISO 128 · ISO 216 · ISO 5455 |

🔴 **Gộp hai vế là lỗi đắt.** Một màn đạt hết chuẩn giao diện vẫn có thể **đẻ ra hồ sơ vứt đi** —
ca thật 11/08: engine đủ giải phẫu bản vẽ nghề nhưng file xuất ra **chữ đè hình · tỷ lệ lẻ
`1:47` · khung tên lộ jargon**, và **kiểm mã không bắt được loại lỗi đó**.
⇒ Luật nghiệm thu: **mảng nào sinh ra file thì nghiệm thu = MỞ FILE ĐẦU RA soi theo vế B.**
`tsc` xanh · test xanh · ảnh chụp đẹp — **cả ba đều không đủ**.

### Khuôn ghi — mỗi mảng một khối, dán vào plan và vào báo cáo

```
MẢNG: <tên>
① THẤY      nhân vật chính: … · đọc từ xa: … · chỉ khi soi kỹ: …
② THAO TÁC  việc nghề: … → <n> cú bấm · phím <…> · rời chuột <có/không>
③A FRONTIER chuẩn nào · ngưỡng bao nhiêu · cổng máy nào canh
③B OUTPUT   mảng này có sinh file không? <có / không>
            có ⇒ file gì · soi mục nào của CHUAN-DAU-RA-NGHE · AI ĐÃ MỞ FILE ĐÓ
```

---

## 7 · CÂU KẾT CỦA BÀN AUDIT

Không phải *"có đúng chuẩn không"* — đó là câu của bàn nghiên cứu.
Câu của bàn này: **"tôi có dám giao hồ sơ này cho khách không — CÓ / KHÔNG, vì sao."**
