# SPEC · HIỂU BỐI CẢNH TỪ HÌNH CHIẾU — Hoà chốt 15/08

> **Luận điểm gốc, nguyên văn Hoà:** *"tư duy về 2D hay 3D gì thì thực chất nó cũng là hình chiếu 3D
> mô phỏng một phần không gian thực trên một mặt phẳng màn hình."*
>
> **ĐÂY KHÔNG PHẢI KIẾN TRÚC MỚI** — Hoà đính chính khi T gọi nhầm là "kiến trúc lớn nhất phiên":
> *"nó không lớn, nó là miêu tả chi tiết cách làm, tổng quan lại thuật toán tôi đã nói chứ không
> phải điều mới."* ⇒ Văn bản này là **CÁCH LÀM** cho những thứ ĐÃ CHỐT: Grounded Render (13/08),
> khuôn tim cốt, RegionId. Không mở chốt mới, không cần duyệt lại hướng.
>
> Nó là bản đầy đủ của **khuôn TIM CỐT** áp cho ảnh và video: máy vạch hiểu-biết ra, người chỉnh,
> rồi máy mới chạy tiếp. Mục đích cuối, nguyên văn: *"chữa được tật quên và đoán mò của AI."*

---

## 1 · NỀN — bắt đầu từ cái hiển nhiên đang có

Không suy diễn từ hư không. Bắt đầu từ thứ luôn biết chắc: **màn hình · tỉ lệ màn hình · khung bao
tổng**. Rồi mới định nghĩa cái hiển thị bên trong (bối cảnh · ảnh · video).

**Hai thước đo, không phải một:**
| Thước | Đo gì |
|---|---|
| **Lưới phẳng** | hình chiếu 2D — bố cục, chính/phụ, tỉ lệ trên mặt phẳng |
| **Điểm tụ** | chiều sâu không gian 3D |

Đường chân trời · bố cục · chính-phụ · điểm tụ đều là **thuật toán rất dễ cho máy** — đây là chỗ
máy làm tốt, để máy làm.

---

## 2 · HỆ QUY CHIẾU KHÔNG GIAN — quy ước gốc

```
        ▲  BẦU TRỜI            (từ đường chân trời trở lên)
   ─────┼─────  đường chân trời
        │  PHẦN DƯƠNG (+)      (mặt đất → chân trời — nơi người đứng)
   ═════╪═════  mặt đất
        ▼  PHẦN ÂM (−)         (dưới mặt đất)
```

### Ba mặt — bộ khung TỔNG QUÁT, nội thất chỉ là một trường hợp riêng
Quy ước gốc trên không nói riêng nội thất. Rút gọn lại, mọi bối cảnh có không gian thật đều chỉ có
**ba mặt**: **MẶT NỀN · MẶT ĐỨNG · MẶT TRÊN**. Từng ngành chỉ là cách gọi tên khác nhau của ba mặt đó:

| Bối cảnh | Mặt nền | Mặt đứng | Mặt trên |
|---|---|---|---|
| **Nội thất** | sàn | tường · vách | trần |
| **Ngoại thất · mặt tiền** | sân · mặt đất | mặt đứng công trình | mái *(rồi tới trời)* |
| **Cảnh quan** | địa hình · mặt nước | cây · tường rào · khối công trình | tán cây *(rồi tới trời)* |
| **Đồ vật chụp studio** | mặt bàn · nền chụp | phông sau | **không có** |
| **Đồ hoạ · moodboard · sơ đồ** | **không có không gian thật** | — | — |

Nội thất mang dấu tầng: trên mặt đất **(+)**, tầng hầm **(−)**.

⇒ Mọi vùng khoanh xếp vào **nhóm thuộc mặt nền · thuộc mặt đứng · thuộc mặt trên**. Đây là cấp
định nghĩa sơ bộ gắn với **chiều không gian**, không gắn với tên đồ vật.

### Máy phải KHAI LOẠI KHÔNG GIAN trước, rồi mới chọn hệ quy chiếu
Ba câu hỏi, theo thứ tự — sai thứ tự là suy sai hết:

1. **Có không gian thật không?** Không (đồ hoạ, sơ đồ, poster phẳng) ⇒ **chỉ dùng lưới 2D, KHÔNG
   có điểm tụ, KHÔNG có chiều sâu.** Ép điểm tụ lên một tấm graphic phẳng chính là **đoán mò** —
   đúng thứ spec này sinh ra để chữa.
2. **Kín hay hở?** Kín ⇒ mặt trên là một **bề mặt thật** (trần, mái). Hở ⇒ mặt trên là **vô cực**
   (bầu trời), không đo được, không gán vật liệu được.
3. **Mấy điểm tụ?** 1 · 2 · 3 — cho biết tư thế máy ảnh, và quyết định đo được tới đâu.

⚠️ Không trả lời chắc được câu nào thì **nói "chưa xác định"**, hỏi người dùng — **cấm chọn bừa
một hệ quy chiếu rồi chạy tiếp**, vì mọi bước sau đứng trên nó.

---

## 3 · DỰNG KHUNG BAO — từ pixel lên hình học

1. Gom **các điểm pixel gần nhau về màu** thành cụm.
2. ⚠️ **Pixel mang giá trị tương phản thì CẤM NỐI** — đây là luật cắt, giữ cho hai vật khác nhau
   không dính làm một.
3. Tập hợp cụm → **khung bao thô** (còn răng cưa).
4. Xác định các **điểm xa** → gọi hàm vẽ **cung / hình học đấu nối** → thay đường nháp răng cưa
   bằng **nét hình học sạch**.
5. Ra **khung bao hoàn chỉnh** — và **KTS sửa được dáng khung** nếu máy làm chưa đúng.

> Định vị các điểm gắn cho phép tạo hàm từ 2 đến 3 cung đơn giản, để khi gọi hàm hình học thì nét
> vẽ ra **khớp nhất với shape khung bao** của thứ cần gắn ID.

---

## 4 · KTS VẠCH LINE CHÍNH — người giới hạn, máy mới hiểu đúng

Hệ lưới + trục toạ độ điểm tụ đã vạch sẵn. Việc của KTS: **nhìn lưới, chọn ra các line chính vô
tình trùng vào ảnh/video cần định nghĩa** — để giới hạn phân cấp cho máy hiểu môi trường và bối
cảnh tổng thể.

Đây chính là chỗ human-in-loop **sinh ra để trị nỗi đau**: máy hiểu xong ai bảo đảm nó hiểu đúng
hoàn toàn? Người kéo thả, định hình khung thêm → máy hiểu tường tận → **rồi mới soi chiếu các bước
tiếp**.

---

## 5 · CHIỀU THỜI GIAN — đo bằng tone màu

Lấy tone màu từ pixel → soi chiếu cảm quan chung của **sáng · trưa · chiều · tối** với nhóm màu
tương ứng → biết bối cảnh nằm ở khoảng thời gian nào.

Rồi **áp logic vật lý để suy các hệ quả PHẢI CÓ**, đối chiếu với thực tế: bóng đổ · gió bay · trong
nhà hay ngoài trời.

⚠️ **T khai thật về độ tin cậy:** tín hiệu này **dễ bị phá** — đèn nhân tạo, hậu kỳ ảnh, cân bằng
trắng của máy ảnh đều làm lệch tone. ⇒ Kết quả suy giờ **phải nằm ở LỚP GÓP Ý**, hiện ra như một
phỏng đoán có thể bác, **KHÔNG được làm luật và không được chặn gì**. Đúng ranh giới hai-lớp đã chốt.

---

## 6 · GẮN VLM ĐÚNG CHỖ

VLM không thay các bước hình học ở trên — nó **xác nhận và làm giàu** ở những chỗ hình học không
nói được: đây là phòng gì, vật này tên gì, phong cách nào. Gắn đúng chỗ thì tăng độ chính xác của
bối cảnh; gắn sai chỗ thì thay một phép đo chắc chắn bằng một phỏng đoán.

---

## 7 · KẾT QUẢ RA DANH SÁCH — để người soát được

Mọi giá trị đã định nghĩa **liệt kê thành danh sách**, phân rõ:

| Thuộc diện | Tên | ID | Màu |
|---|---|---|---|
| sàn / vách / trần | tên vật | mã định danh | màu lấy từ pixel |

Danh sách này là **bản kê để KTS soát**, không phải log kỹ thuật.

---

## 8 · THANG ĐO THẬT — neo bằng vật bất biến

Soi chọn **element bất biến** có kích thước cố định hoặc trung bình không đổi — *chiều cao mặt bàn
750*, hoặc vật tương đương ngoài trời. Từ kích thước neo đó **cộng hệ lưới** ⇒ ra **kích thước tổng
sơ bộ**.

✅ **ĐÃ CÓ TRONG CODE**: `AnchorKind` (`lib/vision/single-view-metrology.ts:91`) đã khai **9 loại
neo**: `cameraHeight · door · bed · stairRiser · tileModule · tableTop · seatHeight · outlet ·
depthMetric`. Ý này không phải xây mới.

⚠️ **Ước tính, KHÔNG tuyệt đối.** Khớp đúng chốt 15/08: con số từ ảnh **không được vào BOQ**; BOQ
chỉ nhận số đo được từ CAD hoặc khối dựng.

### Vòng xác nhận với KTS
> AI: *"lối đi khoảng 1200"* → highlight dòng đó
> KTS: bấm **OK** — hoặc **gõ số đúng** vào
> ⇒ thuật toán **đồng bộ theo cách hiểu đã xác nhận**. Định nghĩa xong.

---

## 9 · VÌ SAO LÀM — cái được ở cuối

Định nghĩa xong bối cảnh thì:
- Chỉnh sửa · tạo sinh · thay thế **không ảnh hưởng kết cấu chung**
- Cần đổi phần nào của đối tượng: chỉ cần **mô tả + ảnh tham chiếu đã được định nghĩa tương ứng** —
  *"cái này lấy cái gì, học theo cái gì"* → áp **đúng vùng cần**
- **Không thay đổi lan man, không thiếu nhất quán**
- ⭐ **Chữa được tật quên và đoán mò của AI**

---

## 10 · HIỆN TRẠNG — cái gì đã có, cái gì phải làm

| Mảnh | Trạng thái |
|---|---|
| Đường chân trời + điểm tụ, kéo sửa được | ✅ xong 15/08 (`lib/vision/horizon.ts`) |
| 9 loại neo vật chuẩn (gồm `tableTop`) | ✅ có sẵn |
| Luật "lối đi ≥1200" và họ hàng | ✅ 3.094 dòng luật ngành |
| Gom pixel cùng màu | 🟡 `idmask-core` có phần cụm màu — **chưa có luật cấm-nối-qua-tương-phản** |
| Nét từ biên → hình học sạch | 🟡 `wireframe-dinh-bien-dien` đã làm **cho mesh 3D**, cần bản **2D cho ảnh** |
| Sửa dáng khung bằng tay | 🔴 chưa |
| Phân nhóm sàn / vách / trần từ ảnh | 🔴 chưa — *(ảnh render từ scene IF thì miễn phí do chiếu entity)* |
| Danh sách thuộc-diện · tên · ID · màu | 🔴 chưa |
| Tone màu → giờ trong ngày | 🔴 chưa — và phải nằm **lớp góp ý** |

⇒ Xương sống hình học đã có phần lớn. Thiếu chủ yếu là **tầng phân nhóm theo mặt** và **mặt bàn
làm việc cho KTS chỉnh khung**.
