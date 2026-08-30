# BÀN LÀM VIỆC — kiến thức nằm ở BÀN, không nằm ở người ngồi

> **Hoà chốt 30/08/2026:**
> *"Agent phiên chỉ là người ngồi bàn. Người này vào, hết lượt thì đi ra, người khác thay.
> **Kiến thức, quy định nằm tại bàn kèm chỉ dẫn** — ngồi vào đọc nhanh là nhận bàn giao làm tốt
> ngay, chứ không quên quên nhớ nhớ."*

## Đây chính là kiến trúc của IF, áp lên chính chúng ta

```
IF     Project  →  Workspace (NHỚ)  →  Canvas (bề mặt)  →  người dùng đến rồi đi
BÀN    Dự án    →  BÀN lane  (NHỚ)  →  phiên  (bề mặt)  →  agent   đến rồi đi
```

`IF-CANONICAL` §11 đã viết sẵn luật này cho Vitals — ***"người dùng không phải kể lại ngữ cảnh"*** —
và một trong bốn giá trị nền của IF là ***own your memory***: trí nhớ thuộc về **chỗ làm việc**,
không thuộc về **công cụ**. Nếu luật đó đúng cho người dùng IF thì nó đúng cho agent dựng IF.

## Trước khi có thư mục này, sai ở đâu

Kiến thức lane nằm trong **tin nhắn lane 00 gửi cho từng phiên**. Phiên chết ⇒ kiến thức chết ⇒
phiên sau phải được kể lại từ đầu, hoặc tệ hơn: **tự suy diễn**. Đo 30/08: lane 00 phải viết lại
toàn bộ bối cảnh cho lane 03 và 05 **hai lần** trong cùng một ngày.

## Một bàn có gì

| mục | nội dung |
|---|---|
| **VAI** | bàn này chịu trách nhiệm gì, và **không** chịu gì |
| **CẤM** | thứ ngồi vào là không được làm, kể cả khi thấy hợp lý |
| **ĐANG DỞ** | việc đang chạy, ai để lại, tới đâu |
| **BÀI HỌC** | thứ bàn này từng trả giá — để người sau không trả lại |
| **NGHIỆM THU** | xong nghĩa là gì ở bàn này |

## Ngồi vào bàn thì làm gì

```bash
node scripts/moc.mjs inbox <NN>        # phiếu đang chờ
cat docs/control/ban/<NN>.md           # bàn giao — đọc TRƯỚC khi gõ
```

Rời bàn thì **cập nhật mục ĐANG DỞ**. Không cập nhật = để lại một cái bàn nói dối.

## Khối `MÁY GIỮ` cuối mỗi tệp bàn — đọc trước, đừng sửa

Cuối mỗi tệp bàn có một khối nằm giữa `<!-- MÁY GIỮ -->` … `<!-- /MÁY GIỮ -->`.
**Máy sinh, người cấm sửa** — sửa tay sẽ bị đè ở lần ghi biên nhận kế tiếp, và cổng
`npm run soi:ban` sẽ đỏ.

Nó trả lời đúng bốn câu, không hơn: **phiếu nào · khi nào · trạng thái · noted**.

- **Chỉ việc ĐANG MỞ.** Việc đã đóng nén còn một dòng đếm — nhồi lịch sử cho người mới là
  cái bẫy Hoà nêu đích danh 30/08.
- **Không chép nội dung phiếu.** Nội dung là chữ người viết và **có thể sai**: ca thật cùng
  ngày, một phiếu mang kết luận đã bị bác vẫn đứng với dấu ✅. Bàn chỉ chở thứ **có biên nhận**.
- **`noted` là cột quan trọng nhất với người mới** — nó nói *vì sao* ở trạng thái đó và
  *tránh gì*. Thiếu noted thì khối tự nêu `⚠️ thiếu noted`, không im lặng.

Muốn đọc nội dung gốc: `node scripts/moc.mjs inbox <lane>` · lịch sử cả ngày:
`node scripts/phieu-ca.mjs`.
