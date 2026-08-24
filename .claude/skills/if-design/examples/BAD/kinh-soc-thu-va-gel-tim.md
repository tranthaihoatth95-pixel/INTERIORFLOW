# ⑤-XẤU · KÍNH — LƯỚI SỌC SAU MẶT ĐỤC, VÀ CẢ CỤC GEL TÍM

**XẤU** · 23/08/2026 · hai khuyết tật trong **cùng một bản vẽ vật liệu** ·
ảnh **tôi đã mở**: `artifacts/visual-review/G3-vao-xuong-truoc-sau.png` (cột **TRƯỚC**) ·
nguồn: `docs/design-campaign/02-FAILURE-LEDGER.md` **F-14** ·
luật: `docs/mocks/LUAT-VAT-LIEU-KINH-G0-G3.md`

Đây là ca đắt nhất trong kho — **không phải vì hình xấu, mà vì lập luận sai ở hai tầng**,
và tầng thứ hai suýt làm IF mất một chữ ký sản phẩm.

## Nhìn thấy gì

### Khuyết tật A — lưới sọc đặt sau một mặt đục

*(nguồn: `02-FAILURE-LEDGER.md` F-14. **Ảnh của bản vẽ có lưới thì tôi CHƯA mở** — nó đã bị
sửa trước khi tôi tới. Mô tả dưới đây lấy từ ledger, không từ mắt tôi.)*

Bản vẽ vật liệu đặt một **lưới nét thẳng** phía sau **mọi** ô mẫu, trên một quy tắc được ghi
tường minh:

> *nét thẳng bị bẻ cong là bằng chứng duy nhất không cãi được của khúc xạ.*

Quy tắc đúng. Nhưng ô tím chứa nút `Vào xưởng`, mà nút ấy là `background: var(--accent)` —
**đục hoàn toàn** — kèm `isolation: isolate` **cố ý cắt nó khỏi mọi thứ phía sau**.

Lưới nằm sau một bức tường đục. **Không một nét nào đi vào quang học của nút.**

Chú thích trong bản vẽ còn đi xa hơn: khẳng định rằng **không có** lưới thì *"luật ④ trượt
ngay lập tức"* — một lời tuyên bố về mức độ chặt chẽ, **ngược hoàn toàn với sự thật**.

### Khuyết tật B — nút là cả cục tím tô phẳng

*(nguồn: cột **TRƯỚC** của `G3-vao-xuong-truoc-sau.png`, **tôi đã mở**.)*

Một viên nang tím lớn, chữ `Vào xưởng →` trắng ở giữa. Có một vệt sáng trắng vắt ngang phần
trên. Bên dưới, bản vẽ đặt một **dải đo hai ô** ghi `TÂM` và `RÌA` — **hai ô cùng một màu**.

Chú thích của chính bản vẽ:

> *"Tâm = rìa. Không có gradient quang học nào — chỉ một vệt trắng đắp lên. Mắt đọc ra
> **NHỰA**."*

## VIỆC CON NGƯỜI

Việc ở đây có hai lớp, và cả hai đều thật:

| Ai | Việc | Bị đánh mất gì |
|---|---|---|
| **người duyệt thiết kế** | *nhìn một bản vẽ vật liệu và tin được nó* | bản vẽ **khai có bằng chứng** trong khi bằng chứng không thể tồn tại ở đó ⇒ mọi ô khác cũng mất độ tin |
| **người dùng cuối** | *nhận ra đâu là hành động chính, và cảm được đây là công cụ cao cấp* | nút đọc ra **nhựa** ⇒ chữ ký vật liệu của IF **không tồn tại ở đúng chỗ nó phải toả sáng nhất** |

## NGUYÊN TẮC bị vi phạm

| # | Luật | Nguồn |
|---|---|---|
| 1 | G3 = **BA TẦNG, KHÔNG ĐƯỢC GỘP**: phim màu mỏng ở đáy · khối kính trong · mép | `LUAT-VAT-LIEU-KINH-G0-G3.md` §G3 |
| 2 | ⛔ **màu KHÔNG được là thân nút** | cùng nguồn, bảng ba tầng |
| 3 | Phép nghiệm thu: **lấy màu ở TÂM và SÁT RÌA — rìa phải ĐẶC hơn tâm. Bằng nhau ⇒ TRƯỢT** | cùng nguồn |
| 4 | ⛔ cấm ở G3: quầng sáng ngoài · hào quang neon · **nhựa sữa** · **gel tím** · **sọc thử khúc xạ** · vật chứng kiểu lưới ca-rô | `SKILL.md §5` |
| 5 | *Một artefact chứng minh phải NÊU RÕ bề mặt nó tác động lên, và bề mặt ấy phải NHẬN ĐƯỢC nó* | `02-FAILURE-LEDGER.md` F-14 |
| 6 | G3 **không cần lưới nền để chứng minh** — bằng chứng nằm TRONG nút | `LUAT-VAT-LIEU-KINH-G0-G3.md` §Hệ quả |

## VÌ SAO NÓ HỎNG — CƠ CHẾ

### A① Cơ chế chứng minh không CHẠM được tới thứ nó định chứng minh

Đây là một **lỗi đấu dây**, không phải lỗi thiếu sót. Kiểm kê thì **đủ hết**: lưới có mặt ·
luật viết ra · token đúng · chú thích đầy đủ. Không thiếu gì cả.

Cái sai là một cơ chế đúng **chĩa vào một bề mặt vật lý không thể nhận nó**.

Ledger F-14 xếp nó cùng họ với F-03 · F-12 · F-13 — **CÓ MẶT bị nhầm thành CÓ TÁC DỤNG**:

| Ca | Thứ có mặt | Thứ nó không làm |
|---|---|---|
| F-03 · F-12 | một `import` | chỉ là type-only, không có caller lúc chạy |
| F-13 | một chuỗi khớp regex | nó khớp **văn xuôi trong comment**, không khớp mã |
| **F-14** | một lưới nét thẳng | nó nằm **sau một bức tường đục** |

> **Máy soi hỏi *"có X không"*. Không máy nào hỏi *"X có tác động được không"*.**
> Bốn lần cùng một họ. Kiểm kê không thay được kiểm đấu dây.

Ai bắt được: **Hoà, bằng mắt, trong một câu** — *tím là nền, nên không thấy nét, nên bỏ nét đi*.
Mười từ vô hiệu hoá cả một đoạn tự khai chặt chẽ.

### A② Bản vẽ khai độ chặt chẽ mà nó không có — đó là hỏng nặng hơn hình xấu

Câu *"không có lưới thì luật ④ trượt ngay"* biến một **thiếu sót** thành một **lời khẳng định
sai**. Người duyệt đọc câu ấy sẽ **giảm mức soi** của mình, vì bản vẽ vừa tự nhận đã tự soi rồi.

⇒ **Cơ chế: một lời tự khai về độ nghiêm ngặt là một khoản vay lòng tin.** Sai thì mất cả
những ô **đúng** trong cùng bản vẽ, vì người duyệt không còn cách nào phân biệt.

### B① Màu làm THÂN nút thì không có cách nào ra kính

Đây là phần vật lý, và nó tất định — không có chỗ cho gu.

Khối kính trong đặt trên một lớp màu **luôn** có một tính chất: nhìn thẳng xuống tâm là xuyên
qua **ít** kính; nhìn qua rìa cong thì đường quang **dài hơn**, màu cộng dồn nên **đặc lại**.

Không có ngoại lệ. Mọi khối kính trong trên nền màu đều thế.

⇒ **Một khối màu tô phẳng thì tâm = rìa.** Và đó **chính xác** là thứ khiến mắt đọc ra
**nhựa** — bất kể đắp thêm bao nhiêu vệt sáng lên trên.

> Vệt sáng là **hệ quả** của cấu tạo, không phải **thay thế** cho nó.
> Đắp vệt sáng lên một khối phẳng là vẽ cái bóng của một vật không tồn tại.

Phép nghiệm thu vì thế chỉ cần **một câu, và nó cắt sạch tranh cãi**:

> **Lấy màu ở TÂM và ở SÁT RÌA. Rìa phải ĐẶC hơn tâm. Bằng nhau ⇒ TRƯỢT.**

### B② 🔴 KẾT LUẬN ĐẦU TIÊN CỦA CHÍNH LEDGER LÀ SAI — và đây mới là bài học đắt nhất

Sau khi tìm ra khuyết tật A, ledger tự kết luận:

> *nếu nó không khúc xạ được môi trường thì gọi nó là thấu kính là nói quá — nó là một khối
> tím đục có đèn bên trong.*

**Hoà lật kết luận ấy:**

> *"nếu màu tím là cả cục kính lỏng thì chắc chắn ko ra. hình dung kính lỏng trong đè lên
> 1 lớp mỏng màu tím."*

Lỗi **chưa bao giờ nằm ở tham vọng. Nó nằm ở CÁCH DỰNG.** `background: var(--accent)` biến
màu tím thành **thân của khối kính** — một khối màu đặc. Khối màu đặc không có gradient quang
học, nên đọc ra nhựa. Vật đúng là **kính trong có bề dày, đặt trên một PHIM tím mỏng**. Khi
đó phim là chủ thể, kính là thấu kính, và khúc xạ **có chỗ để xảy ra**.

⇒ **Cơ chế của cái bẫy:** tìm ra một khuyết tật thật (bằng chứng không chạm được chủ thể) rồi
rút **kết luận rẻ** — *hạ lời khẳng định xuống cho khớp artefact*. Kết luận **đắt và đúng** là
*sửa artefact cho khớp lời khẳng định*.

> **Hạ tham vọng xuống cho vừa một bản dựng hỏng là cách trông đàng hoàng nhất để đánh mất
> chữ ký của một sản phẩm — vì từng bước lập luận đều hợp lý.**

Ghi lại vì nó sẽ tái diễn: mỗi lần một thứ đẹp khó dựng, sẽ luôn có một lập luận sạch sẽ
chứng minh rằng ta *"không thật sự cần nó"*.

## HỌC GÌ

1. **Kiểm ĐẤU DÂY, không chỉ kiểm KIỂM KÊ.** Trước khi ship một mẫu vật chứng minh một tính
   chất, hỏi: *tính chất ấy có xảy ra được về mặt vật lý trong mẫu này không?*
2. **Bằng chứng phải nằm TRONG chủ thể khi có thể.** G3 không cần lưới nền: mép phim màu bị
   khối kính **nén lại** ở hai đầu viên nang — đó là nét thẳng bị bẻ, và nó không phụ thuộc
   nền phía sau.
3. **Cấu tạo trước, ánh sáng sau.** Không đắp vệt sáng lên một khối phẳng rồi gọi là kính.
4. **Nghiệm thu vật liệu bằng phép đo một câu.** *Rìa phải đặc hơn tâm.* Đo được, không cãi được.
5. **Đừng hạ lời khẳng định cho vừa một bản dựng hỏng.** Sửa bản dựng.
6. **Đừng viết vào bản vẽ những lời tự khen về độ chặt chẽ.** Nêu phép thử; để người duyệt tự
   kết luận.

## KHÔNG ĐƯỢC CHÉP GÌ

- ⛔ **Đừng đọc "bỏ lưới" thành luật chung.** Lưới **GIỮ** ở ô **G1/G2** — kính ở đó trong
  thật, nét sau lưng bị bẻ thật. Bỏ ở ô **G3** vì tím là **nền** của ô đó. Cùng một artefact,
  một chỗ hợp lệ một chỗ vô nghĩa — vì **bề mặt** khác nhau.
- ⛔ **Đừng chép "vệt sáng ngang phần trên" như một công thức kính.** Vệt sáng của cột TRƯỚC
  chính là thứ làm nó ra nhựa: một điểm sáng **không có khối** đỡ bên dưới.
- ⛔ **Đừng chữa bằng cách thêm quầng sáng ngoài.** `SKILL.md §5` cấm tường minh, và
  **G3 với ZERO quầng sáng ngoài vẫn là G3.** Quầng sáng là đường tắt của gel, không phải của kính.
- ⛔ **Đừng lấy G3 dùng rộng ra để "app trông cao cấp hơn".** *"G3 xuất hiện khắp nơi ⇒ TOÀN
  BỘ THANG BẬC SỤP. Hiếm chính là thứ tạo ra giá trị của nó."*
- ⛔ **Đừng đi sửa lại bố cục đã có CHỈ để nhét thêm kính** — dòng cảnh báo ở ngay đầu tệp luật.

## NGUYÊN TẮC THAY THẾ ĐÚNG

> **Kính là CẤU TẠO, không phải HIỆU ỨNG. Màu không bao giờ là thân kính — màu là PHIM nằm
> dưới nó.**

Ba tầng, không được gộp:

| | Tầng | Là gì | Cấm |
|---|---|---|---|
| ① | **PHIM MÀU MỎNG** | lớp màu ở **đáy** khối | ⛔ màu không được là thân nút |
| ② | **KHỐI KÍNH TRONG** | có bề dày, gần như vô hình | ⛔ không sữa, không mảng trắng phủ rộng |
| ③ | **MÉP** | sáng trên · tối dưới · vát trong sát rìa | ⛔ không thành viền vẽ |

Và một phép nghiệm thu duy nhất, dán vào mọi hợp đồng có G3:

> **Lấy màu ở TÂM và ở SÁT RÌA. Rìa phải ĐẶC hơn tâm. Bằng nhau ⇒ TRƯỢT.**

Xem tiếp: `GOOD/kinh-g1-g3-dung-cau-tao.md` · số đo hai bên:
`BEFORE-AFTER/g3-vao-xuong-nhua-thanh-kinh.md`.
