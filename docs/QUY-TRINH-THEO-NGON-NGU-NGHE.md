# QUY TRÌNH LÀM IF — gọi theo đúng ngôn ngữ một dự án nội thất

> Hoà đặt 15/08: *"quy ước này nên ví von theo quá trình thiết kế thi công một dự án, từ input tới
> hoàn công — mỗi bước là một quy trình ứng với công đoạn của IF; mình thì dễ hiểu, bạn thì dễ trình bày."*
>
> **Đây KHÔNG phải tầng quy trình mới.** Nó đặt lại TÊN cho đúng những bước đang chạy, bằng thứ
> tiếng Hoà dùng mỗi ngày — để một năm sau đọc lại vẫn hiểu ngay, không cần tra chú giải.
> *(Nghiên cứu 15/08 đã cảnh báo IF thừa quy trình chứ không thiếu: 537 file `.md`. Nên lần này chỉ
> ĐỔI TÊN và bịt một lỗ, tuyệt đối không đẻ thêm bước.)*

---

## 1 · TÁM BƯỚC — ánh xạ 1-1 với một dự án thật

| # | Dự án nội thất ngoài đời | Làm IF | Ai làm |
|---|---|---|---|
| 1 | **Nhận yêu cầu chủ đầu tư** | Hoà nói một câu chốt | Hoà |
| 2 | **Khảo sát hiện trạng** — đo đạc, chụp, xem cái gì đã có | T đo repo: grep, đọc code, chạy máy soi **trước khi bàn** | T |
| 3 | **Trình phương án — chủ đầu tư duyệt** | T nhắc lại ý bằng ngôn ngữ nhìn-thấy-được, Hoà gật hoặc chỉ chỗ sai | T trình · **Hoà quyết** |
| 4 | **Hồ sơ thi công** (shop drawing cho thợ) | Phiếu giao việc ⓪+8 ô | T |
| 5 | **Thi công** | Agent viết code | Agent |
| 6 | **Giám sát công trường** | T tự chạy lệnh, mở file thật, không tin báo cáo | T |
| 7 | **Nghiệm thu** | Hoà duyệt bằng mắt trên app thật | **Hoà** |
| 8 | **Hoàn công** | Commit mang dấu vết + ghi sổ + máy soi 0 lệch | T |

### ⭐ Phép ví von này vừa chỉ ra CHÍNH cái bug của quy trình cũ
Ngoài đời **không ai** nhảy thẳng từ *"nhận yêu cầu"* sang *"hồ sơ thi công"*. Luôn phải **trình
phương án cho chủ đầu tư duyệt** đã — vì bản vẽ thi công sai một ly là thợ làm sai cả loạt.

Quy trình IF cũ **thiếu đúng bước 3**. Hoà nói một câu → T soạn thẳng phiếu → thợ làm. Không có
chỗ nào cho Hoà nói *"khoan, ý tôi không phải vậy"*. Đó là lý do nó hỏng, và vì sao Hoà thấy
"chưa ổn" dù không chỉ được tên.

---

## 2 · VAI — cũng gọi theo nghề

| Vai nghề | Trong IF | Quyền |
|---|---|---|
| **Chủ đầu tư** kiêm **KTS chủ trì** | Hoà | Quyết ý đồ. Duyệt phương án. Nghiệm thu. |
| **Chỉ huy trưởng công trình** | T | Khảo sát · trình phương án · ra hồ sơ thi công · giám sát · làm hồ sơ hoàn công |
| **Đội thi công** | Agent | Làm đúng hồ sơ, đúng vùng được giao |
| **Tư vấn giám sát độc lập** | V | Bên thứ ba, kiểm chéo, không dính vào thi công |
| **Máy đo nghiệm thu** | 5 máy soi + tsc + test | Đo là ra số, không cãi được |
| **Nhật ký công trình** | Sổ frontier + báo cáo phiên | Ghi ai làm gì, ngày nào |

---

## 3 · DẤU VẾT TRONG COMMIT — gọi theo nghề luôn

Trong xây dựng có phân biệt rất rõ hai tình huống, và đó **chính xác** là hai thứ cần phân biệt ở
đây:

| Nghề | Nghĩa | Trong commit |
|---|---|---|
| **Theo phương án đã duyệt** | Thợ làm đúng bản vẽ chủ đầu tư đã gật | `Thi-cong: theo-phuong-an-duyet` |
| **Xử lý tại chỗ** | Gặp việc bản vẽ chưa phủ, thợ tự quyết ngoài công trường | `Thi-cong: xu-ly-tai-cho` |

**Vì sao cách gọi này đúng hơn chữ tiếng Anh:** một KTS nhìn *"xử lý tại chỗ"* là biết ngay **phải
đi kiểm** — đó là phản xạ nghề, không cần học. Còn `autonomous` thì phải nhớ nghĩa.

**Dùng thế nào:** khi Hoà muốn soát lại xem T đã tự quyết những gì mà không hỏi —
```bash
git log --grep="xu-ly-tai-cho" --oneline
```
Ra đúng danh sách đó. Không cần đọc một dòng code nào.

⚠️ Luật kèm theo: **việc chạm Ý ĐỊNH thì CẤM `xu-ly-tai-cho`** — phải quay lại bước 3 trình phương
án. `xu-ly-tai-cho` chỉ dành cho quyết định kỹ thuật thuần (chọn thư viện, đặt tên hàm, cách sửa lỗi).

---

## 4 · TRÌNH PHƯƠNG ÁN — ba kiểu bản vẽ, chọn theo độ khó sửa

Ngoài đời, phương án trình chủ đầu tư có nhiều mức: phác tay · phối cảnh · bản vẽ kỹ thuật có kích
thước. Chọn mức nào tuỳ **sửa lại có đắt không**. Ở đây y hệt:

| Kiểu trình | Ngoài đời tương đương | Dùng khi | Tốn của Hoà |
|---|---|---|---|
| **So sánh + phản ví dụ**<br>*"giống A, KHÔNG phải B đang có ở màn C"* | chỉ vào một mẫu có sẵn: "làm như cái này, đừng như cái kia" | mặc định, việc hằng ngày | 30–60 giây |
| **Phác thảo hình**<br>dán nhãn *"PHÁC THẢO — chưa code"* | phác tay trên giấy can | **bắt buộc** khi chạm giao diện | 15–40 giây |
| **Given-When-Then có số thật** | bản vẽ kỹ thuật ghi kích thước | khó lùi: đụng dữ liệu · tiền · giấy phép | 2–3 phút |

Hoà chỉ cần trả lời **"ok"** hoặc **"sai chỗ X"**.

---

## 5 · NGHIỆM THU — hai lớp, đúng như ngoài công trường

| Ngoài đời | Trong IF |
|---|---|
| **Máy đo nghiệm thu** — thước, máy laser, máy đo độ rọi. Đo là ra số, không cãi | 5 máy soi + tsc + test + bộ luật ngành. **Tất định, 0 đồng, chạy 10 lần như 1** |
| **Chủ đầu tư nghiệm thu bằng mắt** — máy đo đạt hết rồi vẫn có thể chê xấu | Hoà duyệt mắt trên app thật |

Máy đo đạt **không có nghĩa** là nghiệm thu xong — y như ngoài đời. Đó là lý do sổ tách riêng
**xong-máy** và **qua-mắt**, và vì sao 66 đối 1 là con số đáng lo.

---

## 6 · MỘT DÒNG TÓM

> **Hoà giao việc → T đi khảo sát → T trình phương án → Hoà gật → T ra hồ sơ thi công → thợ làm →
> T giám sát → máy đo → Hoà nghiệm thu → hoàn công có ghi rõ chỗ nào thợ tự xử lý tại chỗ.**

Tám bước, không bước nào mới. Chỉ bước 3 là bịt lỗ, và tất cả đều gọi bằng tiếng nghề.
