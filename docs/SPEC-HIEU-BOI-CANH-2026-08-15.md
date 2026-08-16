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

## 2 · HỆ QUY CHIẾU — BA MẶT LÀ CÁI CHỨA, CON NGƯỜI LÀ CÁI ĐO

> **Hoà chốt 15/08:** *"một công cụ thiết kế theo nguyên lý lấy con người làm trung tâm thì hệ quy
> chiếu nên xoay quanh con người."*

Ba mặt (mục dưới) chỉ trả lời *"không gian hình dạng thế nào"*. Câu hỏi thật của nghề là *"người ở
trong đó ra sao"*. Nên **gốc toạ độ không phải góc phòng — mà là NGƯỜI ĐỨNG**:

| Trục | Gốc | Nghĩa |
|---|---|---|
| Cao độ | **sàn nơi người đứng = 0** | trên là với tới, dưới là cúi xuống |
| Tầm nhìn | **tầm mắt** | chính là **đường chân trời** trong phối cảnh |
| Chiều sâu | **tầm với · tầm đi** | với tới được · đi qua được · nhìn thấy được |

⭐ **Hệ quả trực tiếp lên thuật toán ở spec này:** đường chân trời **KHÔNG chỉ là một đường hình
học** — nó là **cao độ mắt người xem**. Kéo nó tức là khai *"người đứng ở đây, cao chừng này"*.
Một câu hình học biến thành một câu về con người, và mọi kích thước suy ra sau đó có nghĩa nghề.

⚠️ **Hai con số tầm mắt, đừng lẫn** (đã ghi `00-CHOT`): metrology dùng **tầm mắt máy ảnh 1500–1600**
(mặc định 1550) — nơi ống kính đứng; đường cam video dùng **tầm mắt người ~1650** — nơi mắt người
nhìn. Máy đo thì lấy số máy ảnh; đánh giá thiết kế thì lấy số người.

### Con người đang là thước đo ở BA TẦNG — mà chưa ai gọi tên
| Tầng | Thước người |
|---|---|
| **Luật ngành** | Neufert vốn là sách nhân trắc; lối đi 1200 = hai người tránh nhau · bàn 750 · ghế 450 · tay nắm 900-1100 |
| **Thị giác** | 9 loại neo vật chuẩn (`AnchorKind`) đều là **vật do cơ thể người quy định kích thước** — đó chính là lý do chúng làm neo được |
| **Giao diện** | `--tap` 32→44 khi chạm (cỡ đầu ngón tay) · `--row` · `--fs-ui` |

⇒ Ba tầng đang dùng **cùng một nguyên lý** mà đứng rời nhau. Đặt tên nó là **hệ quy chiếu con
người** thì ba tầng thành một.

### Lấy TRUNG BÌNH làm neo — rồi suy ra cả tầng liên đới quanh nó
> **Hoà chốt:** *"lấy giá trị trung bình, sau đó soi chiếu ra tầng liên đới thuộc bối cảnh xung quanh."*

Một con số trung bình của cơ thể đủ để **kéo theo cả dây** — vì mọi kích thước nội thất vốn sinh ra
từ cơ thể, không phải từ hư không:

```
   tầm mắt TB ~1650  ─┬─→ sàn = 0  ─→ mặt bàn 750 ─→ ghế ngồi 450
                      ├─→ tay nắm · công tắc 900–1100
                      ├─→ kệ với tới ~1800
                      ├─→ lối đi 1200 (hai người tránh nhau)
                      └─→ trần 2700 · cửa 2100
```

**Trong ảnh:** ghim được tầm mắt (chính là đường chân trời) thì **mọi mặt phẳng ngang trong khung
hình có cao độ**, và mọi vật có kích thước suy ra được. Một neo → cả bối cảnh đo được. Đó là lý do
neo phải là **vật do cơ thể quy định** — và 9 loại neo trong code đều đúng loại đó.

### Neo là KHOẢNG, và khoảng đó theo DÂN SỐ
> **Hoà:** *"bàn ước tính cao 750 dựa vào chiều cao của người nam/nữ, châu Á/Âu/Phi, trẻ con hay
> người lớn."* · *"giá trị lấy từ người sẽ không tuyệt đối, nhưng mọi thiết kế áp theo sẽ phù hợp
> cho tất cả người dùng trung bình đó."*

⭐ **Đây là chỗ hay nhất của nguyên lý, và cần nói rõ vì sao nó ĐÚNG dù không chính xác tuyệt đối:**
sai số của neo **không lan thành sai số của thiết kế** — vì thiết kế cũng phục vụ đúng nhóm người
mà neo lấy ra từ đó. Neo lệch 3% thì cả hệ lệch 3% **cùng chiều**, và vẫn vừa vặn với nhóm người
đó. Hệ **tự nhất quán**. Đó là lý do nghề này chạy được bằng số trung bình suốt trăm năm.

🔴 **Nguy hiểm nằm ở chỗ TRỘN, không nằm ở sai số.** Neo lấy theo người châu Á mà luật lại lấy chuẩn
châu Âu ⇒ hệ mất nhất quán, và lúc đó sai số **cộng dồn thay vì triệt tiêu**.
⚠️ **Rủi ro này đang SỐNG trong IF**: bộ luật có cả `neufert.ts` (gốc châu Âu) lẫn `vn-*.ts` (Việt
Nam) chạy song song. Phải chọn dân số MỘT LẦN ở cấp dự án, rồi **cả neo lẫn luật cùng đọc một chỗ**.

**Hiện trạng đo 15/08:**
| Tầng | Biết "vùng nào" chưa |
|---|---|
| Luật ngành | ✅ `StandardRegion = VN · US · EU · INTL` + `getRulesByRegion()` |
| Neo vật chuẩn | 🔴 **chưa** — `tableTop` cứng 720/750/780, `cameraHeight` cứng 1500/1550/1600 cho cả thế giới |
| Giao diện | 🟡 có token thân người nhưng theo con trỏ, không theo dân số |

⇒ Việc: **một chỗ khai dân số cấp dự án** (giới · vùng · nhóm tuổi), neo và luật cùng đọc từ đó.
Cùng họ với việc đơn-vị-đo/tỉ-lệ cấp app — nên gộp làm một cửa cài đặt, không đẻ hai chỗ.

### ⭐ LUẬT ĐỒNG BỘ HỌ CHUẨN (Hoà chốt 15/08) — luật cứng, không phải khuyến nghị
> *"Cái sai không đến từ tuyệt đối hay tương đối — cái sai đến từ sự KHÔNG ĐỒNG BỘ TRONG CÁCH HIỂU.
> Đã chốt châu Âu cho mặt bàn mà lấy châu Á cho mặt bếp, rồi giường thấp kiểu Nhật áp lên cái chung…
> **một công trình mà đủ các chuẩn không cùng họ là TỰ HUỶ.**"*

Ba hệ quả bắt buộc:

**① KHÔNG NEO CỨNG MỘT CON SỐ — neo là KHOẢNG.** `750` chỉ là **bản chung làm quy ước**, không phải
sự thật. Code hiện đã đúng hình dạng (`min 720 · typical 750 · max 780`); cái thiếu là **cho chọn
khoảng theo chủng loại người**.

**② ĐÃ CHUNG THÌ CHUNG, ĐÃ RIÊNG THÌ RIÊNG — không nửa nọ nửa kia.**
· *Chung* = global trung tính, **chấp nhận không tuyệt đối**.
· *Riêng* = riêng **trọn bộ**, và phân loại sao cho **phủ được phần đông nhất trong nhóm đồng dạng**.

**③ MỘT DỰ ÁN — MỘT HỌ CHUẨN.** Mọi neo và mọi luật đang hiệu lực phải **cùng một họ**. Trộn họ là
lỗi hệ thống, không phải chuyện thẩm mỹ.

⚠️ **T bổ sung phần thực tế, xin ghi kèm: cấm TRỘN ÂM THẦM, không phải cấm trộn.**
Ngoài đời có ca **buộc phải trộn**: phòng cháy Việt Nam là luật bắt buộc, trong khi công thái học đồ
rời thì Việt Nam chưa có chuẩn nên phải mượn Neufert. Ca đó hợp lệ. Ranh giới đúng là:
> **Trộn có khai báo và có lý do = nghề. Trộn im lặng = tự huỷ.**
⇒ Mỗi lần lấy số khác họ phải **ghi rõ lấy từ đâu và vì sao** — đúng cơ chế `source` + `region` +
`note` mà `StandardRule` đã có sẵn.

**Máy kiểm được, và nên kiểm:** một máy soi đối chiếu **toàn bộ neo + luật đang hiệu lực của dự
án** — khác họ mà **không khai lý do** thì báo đỏ. Đây là loại lỗi người không tự thấy: từng con số
đều đúng ở quê nó, chỉ khi đứng cạnh nhau mới lộ.

⚠️ **T bổ sung một ranh giới nghề nữa: TRUNG BÌNH ĐỂ SUY — BIÊN ĐỂ KIỂM.**
Trung bình che mất phương sai: người cao người thấp, trẻ em, người ngồi xe lăn. Dùng trung bình để
**suy ra bối cảnh** thì đúng và là chuẩn nghề (Neufert vốn là sách trung bình). Nhưng **nghiệm thu
thì phải soi ở BIÊN** — đó chính là việc của bộ luật tiếp cận (`vn-accessibility.ts` đã có trong
12 bộ luật). Suy bằng trung bình mà cũng kiểm bằng trung bình là bỏ lọt đúng nhóm người mà luật
sinh ra để bảo vệ.

### Khi trong cảnh KHÔNG có người
Không bỏ hệ quy chiếu — **đổi vai người**: từ *người trong không gian* sang *người đang nhìn*. Với
một mẫu vật liệu chụp cận hay một tấm đồ hoạ, thước đo là **khoảng cách đọc · cỡ chữ đọc được · tầm
mắt trước màn hình**. Vẫn là con người, chỉ khác chỗ đứng.

---

## 2b · BA MẶT — cái chứa

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

### Đường ra khi cần TUYỆT ĐỐI — sửa tại chỗ, hoặc hỏi Vitals
> **Hoà chốt:** *"còn nếu muốn tuyệt đối — ngay **khoảnh khắc** đó, tag dim 750, hay list liệt kê
> đối tượng được định nghĩa, chỗ chi tiết phần kích thước — KTS có quyền chỉnh sửa lại, hoặc chuột
> phải hỏi nhanh Vitals tra cứu + tư vấn."*

⏱ **"Ngay khoảnh khắc đó"** là ràng buộc về THỜI ĐIỂM, không chỉ về chỗ đứng: tay cầm để sửa phải
hiện ra **đúng lúc máy vừa suy ra**, không dồn lại bắt soát sau. Hai lý do: lúc đó ngữ cảnh còn
nguyên trong đầu KTS, và **các bước sau chưa kịp xây lên trên con số sai**. Dồn lại soát cuối là
sửa khi nhà đã xây xong móng lệch.

Hai chỗ sửa, **cùng một cơ chế**:
| Sửa ở đâu | Khi nào dùng |
|---|---|
| **Ngay tag dim trên hình** (`750`) | đang nhìn hình, thấy sai là sửa liền |
| **Cột kích thước trong bản kê** (§7) | soát cả loạt một lượt |

Hai đường ra, **chuột phải là có cả hai**:
| Đường | Nghĩa | Thuộc lớp nào |
|---|---|---|
| **Gõ số đúng** | *"tôi biết rồi"* | người xác nhận — thắng máy tuyệt đối |
| **Hỏi Vitals: TRA CỨU** | *"số chuẩn của cái này là bao nhiêu"* → dẫn nguồn, **trích nguyên văn** | **lớp LUẬT** |
| **Hỏi Vitals: TƯ VẤN** | *"ca này nên bao nhiêu"* → khuyên theo bối cảnh | **lớp GÓP Ý** |

⚠️ Hai đường Vitals phải **hiện khác dấu** — tra cứu dẫn được điều khoản, tư vấn thì không. Gộp
chung một giọng là vi phạm ranh giới hai-lớp đã chốt 07/08.

**Sau khi sửa:** con số chuyển cờ từ *máy suy* → **người đã xác nhận**, và **các bước sau CẤM suy
lại chỗ đó** — đúng luật tim cốt. Đây là chỗ *"AI nhớ cho lần sau"* thành thật: không phải huấn
luyện gì cả, chỉ là **không được đoán lại thứ người đã chốt**.

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
