# Apple như một THẤU KÍNH CHẤT LƯỢNG — không phải một lớp da

> ⛔ **Module này KHÔNG dạy "làm cho giống Apple".** Mỗi mục hỏi hai câu:
> ① *Apple đang giải bài toán con người nào?* ② *IF giải bài đó cho KTS nội thất thế nào?*
> Chép diện mạo mà không mang theo bài toán là cách chắc chắn nhất để ra một bản nhái.

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Học Apple thì học cái gì, bỏ cái gì?
- Kính lỏng có phải cứ dùng là sang không?
- Con số nhịp chuyển động lấy ở đâu ra, tự chế hay có nguồn?
- Vì sao "Apple đang làm thế" không phải một lý lẽ?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**A-1 · BÀI TOÁN TRƯỚC, HÌNH THỨC SAU.** Mỗi lần viện dẫn Apple, phải viết được một dòng:
*"Apple giải bài X → IF gặp bài X ở màn Y dưới dạng Z → nên IF làm W."* Không viết được thì đó là
chép da, không phải học.

**A-2 · ĐỌC ĐƯỢC THẮNG ĐẸP — và chính Apple đã tự sửa.** iOS 27 **tự sửa Liquid Glass vì khó đọc**:
toolbar frosted quay lại, thêm thanh trượt chỉnh độ kính, bo góc nhất quán hơn.
⇒ **Kính là gia vị. Đọc được TRƯỚC.** IF ghi thành NT-16 (kính chỉ ở lớp nổi tạm, **phải có nấc
giảm chói**) và thành thang G0–G3 (`materials-g0-g3.md`).

**A-3 · CON SỐ NHỊP — có nguồn, không tự chế** (`SPEC-APPLE-MOTION-MATERIAL`, khảo WWDC):
| Việc | Số |
|---|---|
| phản hồi bấm | **< 200ms** |
| chuyển trang | **300–500ms** |
| ba preset spring | smooth / snappy / bouncy — 0.5s, bounce **0 / .15 / .3** |
| stagger nhiều phần tử | **30–60ms** |
IF đã có thang riêng chồng lên (`IF-MOTION-VISUAL-LAW §0`) và **thang IF thắng khi vênh**:
hover 100–160 · reveal 140–200 · shelf 180–260 · stage 240–380 · morph 300–700.

**A-4 · BỐN NGUYÊN TẮC CHUYỂN ĐỘNG lấy được:** liên tục không gian · phân lớp chiều sâu · hướng
nhất quán · stagger. Xem `motion.md`.

**A-5 · HOVER: KHÔNG PHÓNG TO MỌI THỨ.** Scale chỉ cho vật **nhỏ và đơn lẻ**. Nút toolbar · hàng
danh sách · ảnh lớn thì **CẤM scale** (`SPEC-HOVER-FOCUS-IDF` §2, bảng 9 loại phần tử có số ms):
nút rail/toolbar chỉ **đổi nền 120ms** · hàng danh sách **đổi nền 100ms** · thẻ nội dung
`translateY(-2px)` + scale **1.02** 200ms · swatch/chip scale **1.04** 150ms.
Luật kèm: **vào chậm, ra nhanh** (ra ngắn hơn vào ~30%) · **chữ không được nhảy** ·
**bàn phím = chuột** · **tablet không giấu sau hover**.

**A-6 · CHẤT LIỆU PHẢI PHẢN ỨNG VỚI THỨ NẰM DƯỚI.** Kính Apple lấy diện mạo từ nền — đó là điều
làm nó thuộc về môi trường thay vì đặt lên trên. IF giữ luật này **ở mọi bậc**, chỉ hạ biên độ ở
G1 (`LUAT-VAT-LIEU §2`). Một lớp mờ **màu cố định** không phải kính.

**A-7 · KHOẢNG THỞ VÀ BỎ VIỀN.** Học: không viền quanh mọi thứ; tách vùng bằng khoảng trống và
chuyển sắc. IF chốt riêng 16/08: **bỏ đường kẻ ngang chia card**, thay bằng chuyển sắc — nhưng
**vẫn cho** vạch dọc mảnh phân tách số cùng hàng.

**A-8 · REDUCED MOTION LUÔN THẮNG** — nhưng **không có nghĩa tắt hết**. Xem `motion.md`.

**A-9 · THỨ KHÔNG ĐƯỢC CHÉP.** ⛔ Bảng màu/typeface của iOS làm nhận diện IF (IF có nhận diện
riêng, trung tính, không TTT không Apple) · ⛔ mật độ của app điện thoại cho một app nghề dày lệnh
· ⛔ kính ở lớp nội dung (Apple dùng kính cho **lớp điều hướng nổi trên** nội dung, và **cấm kính
chồng kính**) · ⛔ ẩn chức năng sau cử chỉ không dạy được.

**A-10 · MƯỢN CÁCH LÀM, KHÔNG MƯỢN HEX.** Ca thật, đo được: nền sáng Apple `#F2F2F7`
(R242 G242 **B247**, ngả **lam**) ↔ nền sáng IF cũ `#f2efe9` (R242 G239 **B233**, ngả **vàng**).
**Cùng độ sáng, ngược hướng sắc — chênh 14 điểm ở kênh lam**, và 14 điểm đó là toàn bộ khoảng cách
giữa "sạch" và "rẻ tiền". Cách làm đáng mượn: **nền chính trắng thuần, xám nhạt chỉ cho nền NHÓM**.
⚠️ Apple **cố ý không công bố hex** (màu của họ thích ứng theo chế độ + độ tương phản) — số trên là
**đo được từ hệ thống**, phải khai đúng như vậy, đừng ghi như thể Apple công bố.

## 3 · VÌ SAO — cơ chế con người
Cái Apple làm tốt nhất không phải hình thức, mà là **giữ cho người dùng không mất mạch**: chuyển
động nói rõ vật đi đâu, chiều sâu nói rõ vật nào tạm, chất liệu nói rõ vật nào thuộc nền. Đó đều là
**tín hiệu nhận thức**, và chúng đúng bất kể bảng màu.

Chép da thì lấy được thứ **không mang tín hiệu** (bo góc, độ mờ), bỏ lại thứ mang tín hiệu (nhân
quả, thứ bậc). Kết quả là một app trông na ná mà vẫn khó dùng — và mất luôn nhận diện riêng, thứ
duy nhất không đối thủ nào chép lại được của IF.

Với KTS nội thất, bài toán còn khác Apple một chỗ quan trọng: họ ngồi **hàng giờ** với **màn dày
lệnh**, không phải chạm vài giây trên điện thoại. Nên mật độ, phím tắt và tính ổn định của bố cục
đều phải nặng hơn Apple — trong khi vẫn giữ nhịp và chất liệu.

## 4 · CA HỎNG THẬT CỦA IF
- **F-14** — ca đắt nhất của module này. `background: var(--accent)` biến màu tím thành **thân**
  khối kính ⇒ khối màu đặc, không có gradient quang học ⇒ đọc ra **nhựa**, dù vẽ highlight thế nào.
  Hoà sửa: *"kính lỏng trong đè lên một lớp mỏng màu tím"*. **Không phải hạ tham vọng cho vừa bản
  dựng hỏng — mà sửa bản dựng cho khớp tham vọng.** (Luật thêm vào ledger cùng ngày.)
- **F-14 phần đầu** — lưới kẻ đặt sau một bề mặt **đục hoàn toàn** để "chứng minh khúc xạ":
  có mặt ≠ có tác dụng.
- **NT-16 đo được**: **0/43** ảnh tham chiếu gu Hoà dùng kính cho chrome ⇒ kính chrome không phải
  gu của sản phẩm này, dù nó đang là mốt.
- **14/08 · gốc bệnh font Times**: biến font khai mà không định nghĩa ⇒ cả app render serif suốt
  một thời gian dài. Bài học Apple-hoá: nhịp và chất liệu không cứu được một nền chữ hỏng.

## 5 · KIỂM THẾ NÀO
1. Với mỗi chỗ viện dẫn Apple, có viết được dòng A-1 không?
2. Kính đang nằm ở lớp nào? Có kính chồng kính không? Có **nấc giảm chói** không?
3. Kính có **đổi theo nền** không, hay là lớp mờ màu cố định? (A-6)
4. Đo tương phản chữ **tại chân chữ**, không đo trung bình cả thẻ.
5. Số ms đang dùng có nằm trong thang IF (`IF-MOTION-VISUAL-LAW §0`) không?
6. Hover có scale thứ **to hoặc lặp nhiều** không? (A-5)
7. Có hex nào chép từ Apple vào nhận diện IF không? (A-10 — mượn cách làm, không mượn số)

## 6 · ĐÀO SÂU
- `docs/SPEC-APPLE-MOTION-MATERIAL.md` — nguồn WWDC, §4b khuôn Siri cho Vitals
- `docs/SPEC-HOVER-FOCUS-IDF.md` — bảng 9 loại phần tử × hover/press/selected, 8 luật chung
- `docs/IF-MOTION-VISUAL-LAW.md` §0 — thang nhịp IF (đè dải Apple khi vênh)
- `docs/mocks/LUAT-VAT-LIEU-KINH-G0-G3.md` · `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-*.md` NT-16
