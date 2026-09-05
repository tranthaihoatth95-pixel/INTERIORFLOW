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

---

## BỐN BÀN CHUYÊN TRÁCH — đợt dựng lại giao diện (Hoà chốt 05/09, sửa dây chuyền cùng ngày)

Khác với bàn `00..08` (chia theo **công đoạn**), bốn bàn dưới đây chia theo **vai** trong đúng một
việc: dựng lại UX/UI từ đầu. Định nghĩa đầy đủ ở `.claude/agents/`, tra ở đây để không mồ côi —
hai lần trước một tài liệu nền chết chỉ vì **không ai trỏ tới nó** (`IF-ARCHITECTURE-COMPASS` mồ
côi 19 ngày · `GU-PROFILE` 0 con trỏ tới 30/08).

### Dây chuyền — thứ tự không đảo được

```
① CHUYÊN MÔN  suy từ TÍNH NĂNG → màn chính → key visual → chỗ đứng theo luồng tay
              → xác lập ĐẦU MỤC + chỉ đích danh CA GLOBAL cần học
                        ↓ giao đề
② NGHIÊN CỨU  đào đúng đầu mục được giao → báo cáo có nguồn + ngưỡng đo được
                        ↓ báo cáo về
③ TRÌNH HOÀ   ◀── CỬA NGƯỜI. Trình kết quả nghiên cứu, CHƯA viết spec
                        ↓
④ SPEC        chuyên môn viết — mỗi mảng một khối BA CÂU HỎI + tiêu chí nghiệm thu
                        ↓
⑤ HOÀ CHỐT SPEC ◀── CỬA NGƯỜI, CỨNG. Chưa chốt thì không ai gõ một dòng
                        ↓
⑥ THỰC THI    build MỘT MẠCH cho xong — không dừng giữa chừng hỏi lại
                        ↓
⑦ AUDIT       chấm — CÓ/KHÔNG dám giao hồ sơ cho khách
```

### Hai cửa NGƯỜI — Hoà chốt 05/09

> *"nghiên cứu xong thì về trình bày tôi rồi spec, chốt spec rồi dựa vào đó build 1 mạch cho xong."*

- **Cửa ③** — nghiên cứu xong **trình Hoà trước**, chưa viết spec. Trình sớm để hướng sai thì chết
  ở đây, chỗ rẻ nhất.
- **Cửa ⑤** — Hoà **chốt spec** rồi mới build, và chốt xong là **build một mạch, không dừng hỏi lại**.
  ⇒ Hệ quả đè lên đầu spec: **spec phải đủ để xây mà không cần hỏi thêm câu nào.** Chỗ nào còn mơ
  hồ sẽ nổ ra giữa lúc build — đúng lúc không được phép dừng. Chưa đủ ⇒ **chưa được trình**.

| bàn | tệp | vai một câu | cầm bút mã? |
|---|---|---|---|
| **B · CHUYÊN MÔN** | `.claude/agents/if-chuyen-mon.md` | cầm hướng — suy ưu tiên từ tính năng, chỉ ca global, giao đề, ra plan | **không** |
| **A · NGHIÊN CỨU** | `.claude/agents/if-nghien-cuu.md` | đào đúng đề được giao → nguồn + ngưỡng đo được | chỉ mã **cổng** |
| **D · THỰC THI** | `.claude/agents/if-thuc-thi.md` | dựng theo plan, tới app thật | **có** — nơi duy nhất |
| **C · AUDIT** | `.claude/agents/if-nguoi-nghe.md` | designer đang hành nghề, khó tính, đi trọn hành trình rồi kể chỗ vấp | **không** — chỉ đọc |

**Vì sao tách bốn:** luật đã có trong repo — *"người vẽ ra nó không được là người duy nhất chấm
nó"*. Và Hoà tách tiếp **quyết hướng ≠ cầm bút**: gộp hai thứ đó vào một bàn là để người dựng tự
đổi hướng giữa chừng, đúng cơ chế đẻ ra phân kỳ.

⛔ **Hai tệp đã bị thay, giữ làm dấu vết, KHÔNG nạp để làm việc:**
`.claude/agents/if-chuan.md` (→ `if-nghien-cuu`) · `.claude/agents/if-thi-giac.md`
(→ tách thành `if-chuyen-mon` + `if-thuc-thi`).

**Cửa chặn trước khi đập bất kỳ màn nào:** `docs/delivery/KIEM-KE-NANG-LUC.md` phải có mục cho màn
đó. `§B25` bảo vệ **năng lực · hợp đồng · dữ liệu**, KHÔNG bảo vệ bố cục lỗi thời — nên được đập
bố cục, nhưng đánh rơi một hành vi đang chạy được thì là mất mát, không phải dọn dẹp.
