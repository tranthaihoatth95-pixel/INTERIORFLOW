# IF · TARGET — VITALS (ba nét hữu cơ · một lõi tự phát sáng)

`IF-UX-VISUAL-REALIGNMENT-001` · gói `IDF-IF-PACKET-003` · trạng thái **CANDIDATE · chờ Hoà duyệt mắt**
HEAD đo: `63de2d8` · lập 27/08/2026

---

## 0 · BẬC BẰNG CHỨNG

**`PARTIAL — contract/design proof trên mã tại HEAD `63de2d8``**. ⛔ Cấm đọc thành PASS.
Mọi giá trị thẩm mỹ **`PROPOSED`**. Tệp này **không** duyệt Vitals — cổng mắt là của Hoà
(`ux/01-RUNTIME-UI-GAP-MAP.md` §3B ⑥).

**Ràng buộc của Hoà mà tệp này thi hành:**
> **Vitals: ba nét hữu cơ hội tụ thành một lõi TỰ PHÁT SÁNG.**
> ⛔ CẤM: particle cloud · các vòng tròn đều nhau · chatbot chung chung.

**Vitals là gì (không đổi):** một **LỚP hiển thị tình trạng sống**, mọc lên ở nhiều bề mặt —
khẩu độ mép trên · chấm ambient · dòng ở Peek · thẻ số ở Home. **Không phải một màn riêng**
(`vitals/01-TARGET-REJECT-STORYBOARD.md`, mở đầu).

---

## 1 · TARGET

### 1.1 · ⭐ VÌ SAO ĐÚNG **BA** NÉT — con số này KHÔNG phải thẩm mỹ

**Ba là trần đã có trong mã, đo được:**

```
components/studio/vitals-tin-hieu.ts:31   export const TRAN_TIN_HIEU = 3;
components/studio/vitals-tin-hieu.ts:123  export const THU_TU: LoaiTinHieu[] =
                                            ['dang-chay','chay-loi','chuan-ve','dia-diem','demo-flow'];
components/studio/vitals-tin-hieu.ts:184-187  for (const loai of THU_TU) { … if (ra.length >= TRAN_TIN_HIEU) break; }
```

⇒ Hệ có **năm loại** tín hiệu, nhưng **chọn tối đa BA** theo một thứ tự ưu tiên cố định.
**Ba nét của Hoà chính là ba tín hiệu thật đã qua cửa chọn đó** — không phải ba hình trang trí,
không phải ba trục cố định.

**Hệ quả bắt buộc, và đây là chỗ hình thái phải trung thực với dữ liệu:**
| số tín hiệu thật | số nét vẽ ra |
|---|---|
| 3 | **3 nét** |
| 2 | **2 nét** |
| 1 | **1 nét** |
| 0 | **0 nét** — chỉ còn lõi |

⛔ **Cấm luôn vẽ đủ ba nét rồi làm mờ hai nét không có dữ liệu.** Đó là khung rỗng chờ nội dung
(M-12), và nó phá đúng thứ làm nên giá trị của hình này: **nhìn là biết có mấy điều đáng biết**.

**Mỗi nét mang gì:**
| thuộc tính của nét | đọc ra điều gì | nguồn |
|---|---|---|
| **có mặt** | *có một điều đáng biết thuộc loại này* | `chonTinHieu()` `:178-190` |
| **độ dài / trọng lượng** | **số thật** (`so`) — 2 lượt chạy vẽ khác 9 lượt chạy | `TinHieu.so` |
| **thứ tự từ trong ra** | ưu tiên `THU_TU` — `dang-chay` gần lõi nhất | `:123` |
| **sắc** | ấm = **cần xem**; trung tính = **đang diễn ra** | `trangThaiAmbient()` `:198-201` |
| **⭐ có CHẠM tới lõi không** | **đã đo được hay chưa** — xem §1.2 | `:21-26` (`undefined` ≠ `0`) |

---

### 1.2 · ⭐⭐ LÕI TỰ PHÁT SÁNG — VÀ VÌ SAO NÓ GIẾT F-02 BẰNG CẤU TẠO

**F-02 là lỗi mở, `FAIL, open`** (`docs/design-campaign/02-FAILURE-LEDGER.md:19-30`):
với `site` và `projects` cùng 401, khẩu độ hiện `calm`.
Luật đã sửa, nguyên văn: *"`calm` không phải sự im lặng, nó là **khẳng định** 'đã kiểm, không có gì
cần chú ý'"* — và ba trạng thái phải tách: `calm` (đã đọc, sạch) · **im** (không có ngữ cảnh) ·
**không biết / không đọc được** (đọc thất bại) ← *vế bị thiếu*.

Mọi lần vá trước đều là **vá ca**: thêm một nhánh `if` để 401 không rơi vào `calm`. M-27 nói thẳng
tại sao cách đó không đủ: *"sửa một ca không sửa được tư duy đẻ ra ca đó"*.

**TARGET vá bằng CẤU TẠO:**

> **Ánh sáng của lõi KHÔNG phải một thuộc tính của lõi. Nó là thứ CÁC NÉT MANG TỚI.**
> Lõi chỉ sáng được ở phần mà **một nét đã chạm tới nó**.

| tình huống | nét làm gì | lõi trông ra sao | đọc ra nghĩa gì |
|---|---|---|---|
| **đã đo, có tín hiệu** | nét **chạm lõi**, mang trọng lượng bằng số thật | sáng, **có cấu trúc** — thấy được nét nào nuôi nó | *"đã kiểm, và đây là điều đáng biết"* |
| **đã đo, sạch (S5 · BẰNG KHÔNG)** | nét **chạm lõi** nhưng **không mang trọng lượng** | sáng **đều, không cấu trúc** | *"đã kiểm, không có gì"* — đây mới là `calm` hợp lệ |
| **không có ngữ cảnh (S1)** | **không có nét nào** | **nghỉ, thở chậm**, sáng yếu và đều | *"chưa có gì để nói"* — IM, không phải "ổn" |
| ⭐ **không đo được (S3)** | nét **ĐỨT trước khi tới lõi** — có khởi đầu, không có đích | lõi **có một khoảng KHÔNG SÁNG** đúng hướng nét đứt | *"chỗ này tôi **không biết**"* |
| **không có quyền (S4)** | nét **không tồn tại**, và hướng đó cũng không tồn tại | lõi **tròn đều, nhỏ hơn** — không có lỗ khuyết | *"chỗ này không thuộc về tôi"* |

**Vì sao đây là một chữa trị hệ thống chứ không phải một vá ca:**
`calm` không còn là một **giá trị có thể gán**. Nó là **hệ quả hình học** của việc mọi nét đã tới nơi.
Muốn vẽ ra một lõi sáng đều trong khi một phép đo thất bại thì phải **nối một nét không có dữ liệu**
— tức phải bịa một cách rất lộ liễu, thay vì lặng lẽ `?? 0`.
Đây đúng thứ `IF-CANONICAL` §3 luật 7 đòi: *"lỗi hệ thống thì chữa bằng hệ thống"*.

⚠️ **Phân biệt S3 (đứt) ↔ S4 (vắng) là ranh giới đắt nhất của hình này.** Một cái là *"đã thử và
bị từ chối"*, một cái là *"biết trước không được phép"* (`vitals/02-STATE-CONTRACT.md` §4).
Vẽ giống nhau ⇒ mất luôn khả năng nói *"phiên của bạn hết hạn"*.

---

### 1.3 · HỮU CƠ NGHĨA LÀ GÌ Ở ĐÂY — và nó KHÔNG phải cái gì

**"Hữu cơ" ở đây = mỗi nét có một ĐƯỜNG ĐI RIÊNG do dữ liệu của nó quyết định**, nên ba nét
**không bao giờ đối xứng**. Nó **không** phải: mềm mại cho đẹp · sinh học · hạt · sương.

| tính chất hữu cơ | nó đến từ dữ liệu nào |
|---|---|
| ba nét **không cùng độ dài** | ba số thật khác nhau |
| ba nét **không cách đều nhau** | thứ tự `THU_TU`, không phải chia đều 120° |
| một nét **dày hơn hẳn** | một loại đang áp đảo |
| **hai** nét thay vì ba | chỉ có hai điều đáng biết |
| một nét **đứt quãng** | phép đo thất bại (§1.2) |

⇒ Nếu ba nét đều nhau về mọi mặt thì **dữ liệu đằng sau nó đang bị làm phẳng** — đó không phải một
lựa chọn hình thái, đó là một lỗi đọc được bằng mắt (đúng M-11: luật phải có cách đối chiếu bằng mắt).

---

### 1.4 · BỐN MỨC, KHÔNG BAO GIỜ TỰ BUNG

| mức | vật | cử chỉ mở | nội dung |
|---|---|---|---|
| **L0 · ambient** | chấm/lõi ở thanh trên | — (luôn có mặt) | trạng thái tổng: `idle`/`answering`/`alert` |
| **L1 · nét** | ba nét quanh lõi | — (hiện cùng lõi) | *có mấy điều đáng biết, loại nào, nặng bao nhiêu* |
| **L2 · Peek** | khẩu độ nở ra **từ lõi** | người dùng bấm/hover có chủ đích | tối đa 3 dòng: `nhan` (mang **số thật**) + `viSao` (**hằng số theo loại**) |
| **L3 · đích** | màn xử lý thật | bấm một dòng | đi tới **đúng miền** bị ảnh hưởng, không phải một trang chung |

⛔ **CẤM TỰ BUNG.** `components/studio/VitalsAperture.tsx:33-35`: *"Khẩu độ này KHÔNG BAO GIỜ tự bung
— mọi mức đều do người dùng ra cử chỉ. **Tự bung là biến nó thành toast**."*
⛔ **Cấm bấm không ra gì.** `#4` đo được: bấm nút Vitals ⇒ **chờ 3 giây, không gì xảy ra**.

**`viSao` là HẰNG SỐ THEO LOẠI, không phải chữ tự do và tuyệt đối không phải chữ AI sinh.**
Năm câu đã khai sẵn tại `vitals-tin-hieu.ts:79-83`, ví dụ:
*"Lượt chạy dừng giữa chừng."* · *"Sự thật địa điểm đã đổi, phân tích suy ra từ nó không còn khớp."*
Docstring `:61-66` khai rõ đây là **cửa duy nhất** — *"không có cửa nào cho một câu AI sinh lọt vào"*.

---

### 1.5 · NHÃN TRỢ NĂNG PHẢI **LÀ** TRẠNG THÁI

Runtime hiện: `VitalsAperture.tsx:384-389` — mọi trạng thái không phải `answering`/`alert` đều rơi
về `'không có tín hiệu'`. **Đã mở tệp đọc dòng tại HEAD `63de2d8`, câu đó còn nguyên.**
Và cùng phần tử, `:500` ghi `data-vitals-state="calm"` cho `idle`.
⇒ **DOM nói "calm", trình đọc màn hình nói "không có tín hiệu"** — hai sự thật trong một nút (`L2-03`).

**TARGET:** một máy trạng thái, một nhãn, năm câu khác nhau cho năm nghĩa khác nhau:

| trạng thái | nhãn trợ năng (`PROPOSED`) |
|---|---|
| đã kiểm, sạch | *"Vitals — đã kiểm, không có gì cần chú ý."* |
| chưa có ngữ cảnh | *"Vitals — chưa có gì để theo dõi."* |
| đang chạy | *"Vitals — đang chạy: N việc."* |
| cần xem | *"Vitals — N điều cần xem."* |
| **không đo được** | *"Vitals — **không đọc được tình trạng**. Thử lại."* |

⛔ Cấm một nhãn dùng chung cho *"sạch"* và *"không đọc được"*. Đó là F-02 ở tầng trợ năng.

---

## 2 · REJECT — điều bị cấm, kèm CƠ CHẾ SAI

| mã | bị cấm | cơ chế sai — đã trả giá ở đâu |
|---|---|---|
| **V-01** | **Particle cloud** | Mỗi hạt là một vật trên màn **không chỉ được nguồn đo**. Bẫy 1 của storyboard: *"có con số nào trên màn mà bạn không chỉ được nguồn đo? ⇒ nó là fixture"* (M-34). Nặng hơn: một đám hạt **luôn trông như đang có gì đó xảy ra**, kể cả khi không đo được gì — tức nó **phát ra tín hiệu sống trên một tiền đề đã chết**, đúng cơ chế F-02 |
| **V-02** | **Các vòng tròn đều nhau** | ① Đều nhau = **phủ nhận `THU_TU`**: hệ có thứ tự ưu tiên cố định (`:123`), vẽ đều là nói "ba điều này ngang nhau", trái với chính dữ liệu. ② M-10 nguyên văn: *"vật tồn tại vì có chỗ trống"* — vòng thứ ba tồn tại vì hình cần đối xứng, không vì có tín hiệu. ③ Storyboard C-01 cấm thẳng *"bày một vòng tròn/nhịp thở để chứng minh Vitals tồn tại"*. ④ M-21: ba thứ đều nhau là **ba cỡ**, không phải **ba công năng** |
| **V-03** | **Chatbot chung chung** | `vitals-tin-hieu.ts:17-19` khai chặn tại gốc: *"KHÔNG có 'insight AI' ở đây, và **cố ý không có chỗ để cắm vào**: mọi trường đầu vào đều là SỐ ĐẾM"*. Một ô chat mở cửa cho **chữ tự do** vào đúng nơi đã khoá bằng hằng số ⇒ mất luôn khả năng kiểm câu *VÌ SAO*. ⚠️ Nguy cơ đo được tại HEAD: `components/studio/VitalsChatBubble.tsx` và `VitalsChatSurface.tsx` **tồn tại trong cây** — xem X-11 |
| **V-04** | **`calm` khi tiền đề đã chết** | **F-02**, `FAIL, open`. Ledger ghi thêm một chi tiết phải nhớ: *"MAIN and the QA lane **both praised this as correct**"* — cả hai đều khen đúng cái bệnh. ⇒ Một trạng thái "khoẻ" **vẫn là một lời khai**, phải kiểm tiền đề của nó |
| **V-05** | **Một nhãn dùng chung cho nhiều nghĩa** | `L2-03`: nhãn là **hằng số**, không phải trạng thái. Lượt 1 chứng minh nó sai ở chiều 401; lượt 2 chứng minh nó sai **cả ở chiều LÀNH MẠNH** |
| **V-06** | **Tự bung khi có tin** | `VitalsAperture.tsx:33-35`. Tự bung ⇒ nó thành toast, mà toast là kênh **cưỡng bức chú ý** — trái với §11 (*"thường trực, im, người dùng chủ động ghé"*) |
| **V-07** | **Nhấp nháy** để biểu đạt bất kỳ trạng thái nào | `02-STATE-CONTRACT.md` §6.2 mục 3. Cùng lý do V-06 |
| **V-08** | **Bấm không ra gì** | `#4` đo trên runtime. §10 *"No silent click"*. Với Vitals nó tệ gấp đôi: người dùng vừa **ra cử chỉ chủ động**, tức đã trả một chi phí chú ý |
| **V-09** | **Lấp khẩu độ rỗng bằng gợi ý / mẹo** | Storyboard C-14: mở ra và **thành thật rỗng**. *"Sự vắng mặt có chủ ý, không phải chỗ trống chờ lấp"* |
| **V-10** | **Hiện `0` như bằng chứng "sạch"** | `vitals-tin-hieu.ts:24-26`: gộp `0` với `undefined` *"là mở đường cho câu 'bản vẽ không có lỗi'"* — đã bị cấm bằng chữ vì **"0 vi phạm" ≠ "đạt chuẩn"**. Bộ kiểm chỉ phủ những gì nó kiểm |
| **V-11** | **`?? 0`** ở bất kỳ đâu trên đường dữ liệu Vitals | `:127-129` cố ý giữ phân biệt **ở KIỂU** *"để không ai gộp thành `?? 0`"*. Đây là hàng rào duy nhất còn đứng giữa S3 và S5 |
| **V-12** | **Kính chồng kính / màng tím** trên khẩu độ | `app/globals.css:277`. **F-14**: một cơ chế chứng minh đặt sau một mặt đục — *"the thing is there; it does nothing"*. Với lõi tự phát sáng, một màng phủ **giết đúng thứ duy nhất mà hình này dùng để nói thật**: ánh sáng do nét mang tới |
| **V-13** | **Trạng thái chỉ phân biệt được bằng chuyển động** | `VitalsStateBadge.tsx:23-26` khai *"4 trạng thái vẫn phân biệt được ở KHUNG TĨNH"* — **nhưng khai không phải là chứng minh** (M-11). Đây là **điều kiện nghiệm thu**, xem §4 |
| **V-14** | **Trạng thái chỉ phân biệt được bằng MÀU** | Ràng buộc a11y (`02-STATE-CONTRACT.md` §6.2 mục 6) — và có một lý do riêng của IF: `--mau-ai` **chưa chốt**, `app/globals.css:36-46` ghi rõ đang chờ Hoà chọn mòng két ↔ mận. Một hình phụ thuộc màu sẽ **đổi nghĩa** khi màu đổi |
| **V-15** | **Trộn Vitals với Activity** | `lib/site/vitals-site.ts:9-11`: Activity là **biên niên**; Vitals chỉ giữ dòng **còn cần xử lý** và **biến mất khi xử xong**. *"Trộn hai thứ là biến khẩu độ thành sổ nhật ký"* |

---

## 3 · CẢNH — route · state · viewport

| # | cảnh | route | state | 1440×900 | 393×852 |
|---|---|---|---|---|---|
| **V-S1** | Mọi thứ lành, có việc chạy | `/` | CÓ DỮ LIỆU | Lõi sáng **có cấu trúc**; 1–3 nét chạm lõi, độ dài theo số thật; ambient `answering` | Lõi ở thanh trên, nét rút gọn; L2 mở **toàn màn** thay vì khẩu độ |
| **V-S2** | Đã kiểm, sạch | `/projects/<id>/cad` | BẰNG KHÔNG | **0 nét**; lõi sáng **đều, không cấu trúc**. Nhãn: *"đã kiểm, không có gì cần chú ý"* | như trên |
| **V-S3** | Chưa có ngữ cảnh | `/` (tài khoản mới) | KHÔNG CÓ DỮ LIỆU | **0 nét**; lõi **nghỉ, thở chậm, sáng yếu**. Nhãn: *"chưa có gì để theo dõi"*. ⛔ không `0`, không vòng chứng minh tồn tại | như trên |
| **V-S4** | Đang đo | mọi route | ĐANG TẢI | Nét **đang vươn về lõi**, chưa chạm. **Có trần thời gian** ⇒ quá hạn thì đứt (V-S5), không vươn mãi | như trên |
| **V-S5** | **Không đo được** (401 · 5xx · timeout · bộ kiểm ném lỗi) | mọi route | TẢI HỎNG | Nét **ĐỨT**; lõi **khuyết một khoảng không sáng** đúng hướng đó; L2 có **mốc thời gian** + đường thử lại | như trên |
| **V-S6** | Không có quyền | mọi route | KHÔNG CÓ QUYỀN | Hướng đó **không tồn tại**; lõi **tròn đều, nhỏ hơn**, **không** khuyết. ⛔ không tải rồi ẩn bằng CSS | như trên |
| **V-S7** | Số liệu CŨ | dự án có `daCu` | (nhánh `cu`) | Nét có trọng lượng nhưng **sắc nhạt đi**; L2 **bắt buộc** có: số mục cần tính lại · miền nào · **đo lúc nào** | như trên |

⚠️ **`NOT ASSESSED` cho toàn bộ cột 393×852.** Xem §7 N-2.

---

## 4 · MOTION INTENT — và điều kiện nghiệm thu KHUNG TĨNH

| chuyển động | báo hiệu điều gì | tương đương `prefers-reduced-motion` |
|---|---|---|
| **Nhịp thở chậm của lõi** (nghỉ) | *"đang sống, không có gì"* — ⛔ **không** dùng để thu hút chú ý | Bỏ nhịp. *"Đang sống"* truyền bằng **độ sáng nghỉ**, phân biệt với lõi khuyết (S3) bằng **hình**, không bằng chuyển động |
| **Nhịp nhanh hơn** | *"có việc ĐANG diễn ra"* (`answering`) — ⛔ **không** dùng để báo lỗi | Số thật ở L1/L2 nói việc đang chạy. `aria-live="polite"` khi số đổi |
| **Nét vươn tới lõi rồi lõi sáng lên** (`bang` 220ms, `lib/ui/nhip.ts:30`) | *"một phép đo vừa **hoàn tất**"*. Đây là chuyển động **mang thông tin nặng nhất**: nó cho thấy ánh sáng **đến từ đâu** | Hiện thẳng ở trạng thái cuối. Thông tin *"đến từ đâu"* vẫn đọc được vì **nét vẫn chạm lõi trong khung tĩnh** — đó là lý do tính chất "chạm/không chạm" phải là **HÌNH**, không phải một hoạt cảnh |
| **Nét đứt lại giữa chừng** | *"phép đo này **thất bại**"* | Nét đứt là một **hình tĩnh**; khoảng khuyết trên lõi cũng vậy. ⛔ Không được để "đứt" chỉ tồn tại như một khoảnh khắc |
| **Khẩu độ nở ra TỪ lõi** (`bang` 220ms, đóng ~0,8×) | *"tấm này thuộc về vật vừa bấm"* — giữ trí nhớ không gian (`lib/ui/nhip.ts:4-11` cấm *"panel trượt từ mép chẳng liên quan"*) | 0ms, hiện tại chỗ. Quan hệ đã có sẵn: nó luôn xuất phát từ lõi |
| **Đổi sắc sang ấm** | *"có việc CẦN XEM"* — và **chỉ** loại thật sự cần xem | Kèm **hình** khác biệt (V-14), không chỉ sắc |

**⭐ ĐIỀU KIỆN NGHIỆM THU, không phải lời khai:**
> Chụp **khung tĩnh** của cả **tám** trạng thái cell (`vitals/02-STATE-CONTRACT.md` §2.1:
> `khong-quyen · chua-hoi · dang-tai · khong-co-du-lieu · bang-khong · co-so · cu · khong-do-duoc`)
> đặt cạnh nhau, ở **cả sáng lẫn tối**, và phân biệt đủ tám **mà không xem chuyển động, không đọc nhãn**.

Đây là câu nghiệm thu của gap map §3B ⑥, và nó là **cổng mắt của Hoà**. `NOT ASSESSED` cho tới khi
có ảnh (M-01: không ảnh app thật ⇒ **trần cứng là PARTIAL**).

---

## 5 · NĂM TRẠNG THÁI TÁCH BẠCH — bảng đối chiếu hình

| trạng thái | **NÉT** | **LÕI** | **L2 có gì** | phân biệt ở khung tĩnh bằng |
|---|---|---|---|---|
| **KHÔNG CÓ DỮ LIỆU** (S1) | không có | nghỉ, sáng yếu **đều** | *"chưa có gì để theo dõi"* | **không nét + lõi nguyên vẹn, mờ** |
| **ĐANG TẢI** (S2) | đang vươn, **chưa chạm** | chưa sáng phần đó | ô đang chờ, có thể huỷ hay không | **khe hở giữa nét và lõi** |
| **TẢI HỎNG** (S3) | **ĐỨT** | **khuyết** đúng hướng đó | mốc thời gian + thử lại | **lõi có lỗ + nét đứt** |
| **KHÔNG CÓ QUYỀN** (S4) | **không tồn tại** | **tròn đều, nhỏ hơn** | ô không tồn tại | **lõi nguyên vẹn nhưng nhỏ, không lỗ** |
| **BẰNG KHÔNG** (S5) | chạm lõi, **không trọng lượng** | sáng **đều, không cấu trúc** | phạm vi phép đo ("0 cái gì") | **nét chạm nhưng mảnh nhất** |

⭐ **Ba cặp dễ gộp nhất, và thứ giữ chúng tách:**
- **S1 ↔ S5** (*"không có gì để đếm"* ↔ *"đếm rồi, ra 0"*): giữ ở **KIỂU** trước khi vẽ —
  `undefined` ≠ `0`, cấm `?? 0` (`vitals-tin-hieu.ts:21-26,127-129`).
- **S3 ↔ S1** (F-02 nguyên văn): giữ bằng **HÌNH** — lõi khuyết ≠ lõi nguyên vẹn.
  Đây là chỗ hình thái **làm được việc mà một nhánh `if` không làm được**: một lỗ trên lõi
  **không thể lặng lẽ biến thành** một lõi tròn.
- **S3 ↔ S4** (*đã thử và bị từ chối* ↔ *biết trước không được phép*): giữ bằng **mốc thời gian**
  và **đường thử lại** — S4 không bao giờ có cả hai.

---

## 6 · NEO VÀO P0/P1

| dòng gap map | hạng | dòng target đóng nó |
|---|---|---|
| `#3` nhãn *"không có tín hiệu"* cho mọi trạng thái, kể cả khi mọi nguồn 401 | **P0** | §1.5 (năm nhãn) · §1.2 (lõi khuyết) · V-04 · V-05 |
| `#4` bấm nút Vitals **không ra gì** | **P0** | §1.4 (bốn mức, L2 nở từ lõi) · V-08 |
| `L2-03` nhãn là **hằng số**; DOM `calm` ≠ nhãn trợ năng | **P0** | §1.5 · V-05 — **một máy trạng thái, một nhãn** |
| `#31` mã đã tách 503 ↔ mạng ↔ 401 nhưng chết ở tầng dưới | ALIGNED(mã)/PARTIAL(mắt) | §1.2: sự phân biệt thành **HÌNH** ⇒ không chết được ở tầng vẽ nữa |
| `#20` hai nghĩa một cách hiện (kệ 73 ↔ kệ 0) | P1 | §5 (S1 ↔ S5 ↔ S4 ba hình khác nhau) |
| `L2-01` app không bao giờ đạt trạng thái lỗi | P0 | §3 V-S4 (trần thời gian ⇒ đứt) · §5 hàng S3 |

---

## 7 · MÂU THUẪN VÀ PHÁT HIỆN — GHI CẢ HAI VẾ

**X-11 · Bề mặt chat của Vitals đang tồn tại trong cây.**
· **Vế Hoà (27/08):** ⛔ **CẤM chatbot chung chung**.
· **Vế runtime:** `components/studio/VitalsChatBubble.tsx` và `components/studio/VitalsChatSurface.tsx`
**có trong cây tại HEAD `63de2d8`** (đo bằng `ls components/studio/`).
⇒ Tôi **không** đọc nội dung hai tệp này trong lượt này, nên **không** khẳng định chúng là chatbot
chung chung — có thể chúng là một bề mặt hội thoại **có ràng buộc**. `NOT ASSESSED` cho câu
*"chúng có vi phạm không"*. Nhưng sự tồn tại của chúng phải nằm trên bàn trước khi Hoà chốt hình thái:
nếu Vitals có một cửa chat, thì **cửa cho chữ tự do** đã mở ở đúng nơi `vitals-tin-hieu.ts:17-19`
tuyên là *"cố ý không có chỗ để cắm vào"*. **Quyết định của người.**

**X-12 · Chú thích cãi mã, ngay trong lõi Vitals — phát hiện của lượt này.**
Đo tại nguồn, dán nguyên văn (M-55):

```
components/studio/vitals-tin-hieu.ts:195-197
 * ⚠️ 'demo-flow' CỐ Ý không kéo chấm sang 'alert' … Chỉ hai loại thật sự CẦN XEM
 * ('chay-loi'/'chuan-ve') mới kéo ambient sang alert.

components/studio/vitals-tin-hieu.ts:200
  if (tinHieu.some((t) => t.loai === 'chay-loi' || t.loai === 'chuan-ve' || t.loai === 'dia-diem')) return 'alert';
```

⇒ Chú thích nói **hai** loại kéo `alert`; mã kéo **ba** (thêm `dia-diem`).
Đây **không** phải một quyết định thiết kế của tôi và tôi **không** sửa gì (lượt CHỈ-ĐỌC).
Nó là một **lệch chú thích ↔ mã** trong đúng hàm quyết định sắc của lõi, cùng họ M-25/M-52
(*văn bản và hành vi trôi khỏi nhau*). Ai thi công phải chốt **`dia-diem` có phải "cần xem" không**
trước khi vẽ sắc ấm — vì câu trả lời đổi **hình** ở §1.1.

**X-13 · Màu AI chưa chốt.**
`app/globals.css:36-46`: `--mau-ai` đang là mòng két `#1f7f88`, **kèm dòng ghi rõ đang chờ Hoà chọn
mòng két ↔ mận**, và cách đổi là sửa đúng hai dòng. ⇒ Mọi mô tả sắc trong tệp này là **PROPOSED**,
và §2 V-14 tồn tại chính vì lý do này.

---

## 8 · `NOT ASSESSED`

| chỗ | vì sao |
|---|---|
| **N-1** · Tám khung tĩnh cạnh nhau (điều kiện nghiệm thu §4) | Cần runtime + ảnh. Lượt này **chỉ đọc**, không chạy server, không chụp. Đây là **cổng mắt của Hoà**, không phải việc của agent |
| **N-2** · Vitals ở **393×852** | Không có ảnh nào. Toàn bộ cột 393 ở §3 là **PROPOSED** |
| **N-3** · Vitals có **mount ở mọi màn** không | `VitalsAperture.tsx:20-28` khai `VitalsGesture` đã mồ côi và chip ở `StatusBar` *"bấm vào không ra gì"* — `#4` đã đo được **một** ca trên runtime; chưa quét đủ mọi màn |
| **N-4** · Trạng thái `cu` có tới được người dùng không | `lib/site/dan-xuat.ts:9` khai *"`daCu` luôn rỗng ⇒ Vitals không bao giờ có tín hiệu để báo. Máy đủ, dây thiếu."* Tôi **không** xác minh lại lời khai này trong lượt này (M-11: khai ≠ chứng minh) |
| **N-5** · `VitalsChatBubble` / `VitalsChatSurface` là gì | Xem X-11. Chưa đọc nội dung |
| **N-6** · F-02 đã vá chưa | Ledger ghi `FAIL, open`. Lượt 2 của gap map chứng minh nhãn vẫn sai **cả ở chiều lành mạnh** ⇒ **chưa vá**, nhưng cần một ca 401 thật (T-07) để đóng chính thức |
| **N-7** · Hình thái "nét đứt / lõi khuyết" có đọc được ở cỡ thật không | M-43 cảnh báo đúng họ này: kính quang học *"ở 44px các cue chồng lên nhau thành một vệt, **dưới ngưỡng đọc được**"*. Lõi Vitals ở thanh trên là một vật **nhỏ**. ⇒ **Phải đo ngưỡng cỡ tối thiểu** trước khi chốt hình. Chưa đo |

---

## 9 · THẨM QUYỀN

Tệp này chốt **TRẠNG THÁI và NGỮ NGHĨA** của Vitals: ba nét = ba tín hiệu thật đã qua trần `TRAN_TIN_HIEU = 3`;
ánh sáng của lõi là **hệ quả** của việc nét chạm tới nó; năm/tám trạng thái tách bạch bằng **hình**,
không bằng màu, không bằng chuyển động.

⛔ **Không chốt** hình dạng nét, đường cong, sắc độ, cỡ, nhịp thở. Mọi giá trị thẩm mỹ **`PROPOSED`**.
⛔ **Tôi không duyệt Vitals, không duyệt brand, không nâng bất kỳ CANDIDATE nào.**

**Mắt và chuyển động cuối cùng là quyền của Hoà. Không agent nào thay.**
`IF-CANONICAL` §2: Claude Design giữ thẩm quyền bố cục người dùng nhìn thấy · MAIN thi công ·
**chỉ Hoà** nâng được `CANDIDATE → APPROVED`. Gói đang ở **CANDIDATE**.
