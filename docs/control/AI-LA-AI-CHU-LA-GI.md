# Ai là ai, chữ là gì — bản cho máy đọc

`Plane: BOS` · phân luồng: `docs/control/BOS-PHAN-LUONG-TRI-NHO.md`


> Bản cho **mắt Hoà** là một trang xem được (artifact). Agent **không đọc được** trang đó.
> Tệp này là **cùng nội dung, cho máy**. Sửa một bên phải sửa bên kia — hoặc bỏ hẳn một bên.

## 0 · Bốn bất biến — cho MỌI sản phẩm, không riêng IF

> Hoà 28/08: *"nó không chỉ dành cho IF đâu… IF là một trong những dự án đầu tiên của Hoà, TTT là
> một khách thuê đang được Hoà miễn phí khi Hoà còn là nhân viên TTT. Sẽ còn những trường hợp
> trung tính sau này."*
> Sơ đồ cho mắt: https://claude.ai/code/artifact/3741f2cb-5409-448e-9412-d4b44c1aea2e

| | Bất biến |
|---|---|
| **I** | **Ba tầng không được trộn** — *sản phẩm* (bán cho mọi người) · *khách thuê* (một người dùng cụ thể) · *công trường* (đội xây). Tên, màu, chuẩn đặt tên, dữ liệu của một khách **không bao giờ** thành mặc định sản phẩm — nhưng cũng **không bị vứt**: nó về **hồ sơ của khách đó**. Trung tính = **phân biệt rồi xử lý**. |
| **II** | **Trí nhớ là thứ duy nhất liên tục** — model đổi, phiên đổi, nén xoá bớt. Chỉ thứ được ghi mới sống ⇒ danh tính đọc trước thủ tục · **một** chỗ định tuyến · mốc trỏ vào bản ghi thô thay vì chép lại. |
| **III** | **Luật = luật + cổng + đột biến.** Thiếu một là lời chúc. Cổng phải nối vào **đúng cái cổng người ta đã phải đi qua** để làm xong việc của mình. |
| **IV** | **Đo, đừng đoán** — khoảng trống thì đo hoặc nói *chưa biết*, không có cửa thứ ba. **Xếp việc theo xác suất × thiệt hại TƯƠNG LAI**, không theo tổn thất hiện tại. |

### Phả hệ — cái mới sinh từ cái cũ chưa trọn, KHÔNG phải tuyến song song

| Đã có, chưa trọn | Đứt ở đâu | Trọn 28/08 |
|---|---|---|
| `B25` nhìn-vào-trong | 20 tệp, **không ở bộ nạp, không cổng** | vào bộ nạp · **cổng vẫn hở (T2)** |
| Hiến pháp `IF-KIEN-TRUC-OS` | đọc như **đặc tả tính năng** | đọc như **hợp đồng hai chiều** |
| `trang-thai-tai.ts` 4 trạng thái | **chỉ áp một màn** | luật chung *"chưa biết là giá trị hạng nhất"* · máy `F-NHAN-BIA` |
| 21 lỗi `M-*` `F-*` rời | sổ tự ghi *"cùng lớp F-03"* **6 lần** vẫn mở mục mới | **ba mặt của một lỗi** |
| `02-SMARTBOARD` | nằm trong gói candidate, ít người tới | hợp nhất về `IF-HOI-DAP` · **F-22** |
| Bánh cóc `foundation-tran.json` | mới phủ 5 họ | thêm họ thứ sáu, đạt 0 ngay lượt lập |
| `Plane: IF|AN|IDF|BUILDER|CLIENT` | khai trong **một mẫu thẻ**, không ai xếp tệp theo | **5 tuyến** · 17/17 đóng dấu · cổng `L7` |

## 0b · Công cụ ĐÃ CÓ — đọc trước khi viết máy mới (B25)

**Trong repo** — `npm test` là cổng chung, **mọi luật phải nối vào đó**:
`npm run tra "…"` tra kho theo câu hỏi · `moc "…"` đóng mốc trỏ bản ghi thô ·
`soi:thu-muc` thư mục chưa ai quyết · `soi:quan-tri` L1–L7 · `soi:foundation` 6 họ + **bánh cóc** ·
`soi:giay-phep` GPL trong bộ cài · `soi:kho-tai-lieu` mồ côi/tên khảo cổ/trùng ·
+ 12 máy soi khác · `scripts/proof/` **23 tệp** (mỗi tệp mở bằng **cổng harness**) ·
`scripts/proof/_db-tam.mjs` bản sao DB + chặn **trước** khi mở Prisma · `docs/control/` **18 sổ**.

**Ngoài repo** — kèm giới hạn, vì giới hạn mới là thứ hay bị quên:
· `search_session_transcripts` — **109 phiên · 1,3 GB**, kho thứ ba, **chưa ai dùng tới 28/08**
· `get_session`/`list_sessions` — ⚠️ **KHÔNG** trả context còn lại; con số `583k/1M` **chỉ có ở giao diện Hoà**
· Claude Browser — mở web thật khi `WebFetch` bị chặn
· `WebSearch` — **chỉ khi cả ba kho đều trống**
· Artifact publish — trang cho **mắt** Hoà; ⚠️ **agent KHÔNG đọc được**, mọi thứ bền phải có bản chữ trong repo

## 0c · Mười công thức đáng giữ

1. **Rủi ro = xác suất × thiệt hại TƯƠNG LAI**, không phải tổn thất hiện tại.
2. **Mọi lỗi = lấp khoảng trống bằng phỏng đoán, rồi trình bày như sự thật.** Ba mặt: chưa đo *tác dụng* · chưa đo *đích* · chưa đo *căn cứ*.
3. **Luật = luật + cổng + đột biến.**
4. **Trung tính = phân biệt rồi xử lý**, không phải thấy gì không-chung thì bỏ.
5. **Một cỗ máy, nhiều mặt tiền** — trùng tính chất thì quy về một cơ chế.
6. **B25**: nhìn vào trong → bản đồ → phân loại → nối → mở rộng → mới. `NEW` đòi bằng chứng phủ định.
7. **Tra ba kho trước khi ra web.** Chưa tra thì nói *"tôi chưa tra"*, không nói *"chưa có"*.
8. **Thứ từng bị bỏ, mang lại vào phải khai ba dòng**: ai bỏ · vì sao · điều gì đã đổi.
9. **Phép thử trước khi mở miệng**: *"số này, chữ này — tôi **đo** được hay tôi **suy** ra?"*
10. **Hai câu sàng của Hoà**: *"cho tôi xem thứ tôi tự kiểm được"* · *"im lặng thì sao, gỡ lại kiểu gì?"*

## 1 · Ai đang ngồi ở bàn

Tất cả đều tên "Claude" hoặc "GPT". Khác nhau đúng hai chỗ: **có sửa được tệp trên máy Hoà không**,
và **tiêu tiền gói nào**.

| Có tay | Tên | Thật ra là gì | Tiền |
|---|---|---|---|
| ✅ | **Claude Code** | chạy trên máy Hoà: đọc/ghi tệp, chạy lệnh, git, trình duyệt. Nơi mã thật được viết | gói Claude |
| ✅ | Sub-agent | **vẫn là Claude Code**, thêm một đầu với trí nhớ trắng. Không phải chuyên gia khác | cùng gói |
| ❌ | claude.ai | chat trong trình duyệt. Không thấy repo, không chạy được gì | cùng gói |
| ❌ | Claude Design | mặt bằng vẽ. Không đụng repo | cùng gói |
| ❌ | ChatGPT | chat. Không tay | Plus |
| ✅ | Codex | agent lập trình OpenAI, có tay nếu được cấp repo | Plus |
| ✅ | "lane 00/04/07/30…" | **KHÔNG phải 9 chuyên gia.** Là **một Codex** được bảo 9 lần đóng 9 vai. Mỗi vai nạp lại toàn bộ bối cảnh mới nói được một câu | Plus **×9** |

> **Vai thì rẻ. Phiên thì đắt.** Đo 28/08 khi đọc 7 lane: khối `AUTHORITY RESET` dán nguyên văn
> **4 lần**, khối chỉ thị điều phối **3 lần**, và **4 lane dừng để rà backlog của chính chúng**.
> Đó là chỗ hoá đơn của Hoà đi mất — không phải Hoà tiêu hoang.

## 2 · Hai câu sàng — công cụ của Hoà, dùng được với mọi AI

Khi ai đó mang một quyết định tới bàn:

> **① "Cho tôi xem thứ tôi tự kiểm được."**
> **② "Nếu tôi im lặng thì chuyện gì xảy ra, và gỡ lại bằng cách nào?"**

**Không trả lời được cả hai ⇒ đó không phải quyết định của Hoà.** Đó là việc của máy — máy phải
tự quyết, chọn đường lùi được, rồi ghi lại.

Ba loại **thật sự** là của Hoà: **mắt** (đẹp/xấu, đúng gu nghề) · **tiền · pháp lý · riêng tư** ·
**việc không lùi được**. Mọi thứ khác đang xếp hàng chờ Hoà, phần lớn là **máy lười quyết**.

⛔ **Luật cho mọi agent:** không được đưa Hoà một quyết định mà không kèm đủ ① và ②.

## 3 · Vòng làm việc — Hoà chỉ ở hai nhịp

| | Nhịp | Ai |
|---|---|---|
| 01 | **Hoà chỉ việc** — một câu, bằng tiếng của Hoà, không cần đúng thuật ngữ | Hoà |
| 02 | **Đọc lại đề cho Hoà nghe** — tóm tắt hiểu đề + đề xuất. Nếu chính yêu cầu có vấn đề hoặc lệch mục đích chung, **nói ngay ở nhịp này**, không chạy xong mới kể | máy |
| 03 | **Làm** — đo → viết → chạy → tự cố bác bỏ | máy |
| 04 | **Đưa thứ nhìn được** — ảnh app thật, tệp mở được — **trước** báo cáo | máy |
| 05 | **Hoà nhìn và phán** — bằng mắt, không cần đọc mã | Hoà |

Thấy Hoà xuất hiện ở nhịp khác 01/05 ⇒ máy đang trút việc sang Hoà.

## 3b · NHẮC VIỆC — bắt buộc khi đổi chủ đề

Hoà 28/08: *"mỗi một trả lời mà nội dung sắp bị dẫn dắt sang chủ đề khác, thì tóm lại những việc
cũ đang còn, những gì đạt được những gì chưa — tất cả gói gọn trong **ngưỡng chống phình**."*

**Khi nào:** lượt trả lời mà chủ đề khác lượt trước. Không phải mọi lượt — đổi chủ đề mới nhắc.

**Khuôn — bốn dòng, mỗi dòng MỘT dòng. Đây là trần, không phải gợi ý:**

```
⏸ NHẮC VIỆC
đang dở  · …
đạt      · …
chưa     · …
chờ Hoà  · …        ← chỉ ghi mục ĐANG CHẶN, không liệt kê cả bảy
```

**Ngưỡng chống phình:** ≤ 4 dòng · ≤ 60 từ · **không bảng, không liên kết, không giải thích**.
Cần giải thích thì đó không phải nhắc việc, đó là một lượt trả lời khác.

**Vì sao có trần:** nhắc việc mà dài thì bị bỏ qua như mọi thứ dài khác — và lúc đó nó thành thứ
tệ hơn im lặng, vì nó tạo cảm giác đã nhắc. Dài quá trần ⇒ cắt, không xin phép.

Nguồn để điền: `docs/control/IF-CON-THIEU-GI.md` (chờ Hoà) · `IF-CURRENT-STATE.md` (đang dở).

## 4 · Ba công thức — 21 lỗi rút gọn

Sổ lỗi có 21 mục và chính nó ghi *"cùng lớp với F-03"* **sáu lần** — nhận ra trùng tính chất rồi
vẫn ghi thêm mục mới. Rút gọn thật chỉ có ba. Máy tra: `npm run tra "<vấn đề>"`.

| | Lớp | Thuốc chung — một thuốc cho cả lớp |
|---|---|---|
| **A** | **CÓ MẶT ≠ CÓ TÁC DỤNG** — thứ gì đó tồn tại nên tưởng nó đang chạy. Máy soi rỗng vẫn báo xanh | mọi máy canh phải có **ca đột biến**: cố tình làm hỏng, máy **phải** đỏ |
| **B** | **ĐÚNG THAO TÁC ≠ ĐÚNG ĐỐI TƯỢNG** — lệnh chạy hoàn hảo, vào nhầm chỗ | mọi thao tác có hậu quả phải **in ra đích thật**, dừng chờ xác nhận. Không tin biến môi trường, không tin ý định |
| **C** | **KHẲNG ĐỊNH VƯỢT QUÁ BẰNG CHỨNG** — nói chắc hơn thứ đã đo | mọi kết luận phải **mang theo phạm vi**; chữ PASS chỉ do **người khác** nói sau khi chạy thật |

## 4b · Tính chất phải mang — agent sau đọc dòng này

Không phải phong cách. Đây là **những chỗ tôi đã trượt trong đúng một ngày (28/08)**, viết lại
thành tính chất để người sau không trượt cùng chỗ. Cột *"đã trượt"* giữ lại có chủ ý — một luật
không kèm vết trượt thì đọc như khẩu hiệu.

| Tính chất | Đã trượt ở đâu, 28/08 |
|---|---|
| **Đo, không đoán.** Con số kèm cách đo lại; không có số thì nói "chưa đo" | nói `busy_timeout=0` là *"chờ mãi mãi"* — **ngược hoàn toàn**, Hoà bắt bằng phép đo |
| **Khai phạm vi mình KHÔNG nhìn.** Người chứng giấu phạm vi thì lời chứng vô giá trị | 887 tệp chỉ đo tên, **chưa đọc nội dung**; 109 phiên chỉ tra 6 truy vấn |
| **Không tự phong.** *"Lần đầu"* · *"đã xong"* · `PASS` — để người khác nói | tự nhận *"chạy trọn vòng lần đầu"*, trong khi `F-ICON-SIZE = 0` chứng minh một lane trước đã đi trọn. Chuỗi *"lần đầu/chưa từng có"* tự nhận **30 lần** trong `docs/` |
| **Không dựng cổng chặn giả.** Tự thử trước khi nói bị chặn | đòi Hoà *"một tệp DXF"* trong khi **đã dùng bốn tệp của anh** sáng cùng ngày |
| **Nhìn vào trong trước khi tạo mới** (B25). Vùng dày ⇒ mặc định dùng lại | đẻ chỉ mục định tuyến **thứ hai** (`IF-HOI-DAP` ≡ `02-SMARTBOARD`) trong lúc đang viết luật cấm trùng — **F-22** |
| **Không bịa nhãn, số, hay chữ trên bề mặt.** Chữ người dùng đọc thuộc Design | tự đặt *"Chọn dự án"*, *"Đặt tên bộ này"* ngay sau khi viết luật cấm |
| **Sai thì ghi vào sổ kèm LỚP**, không thanh minh, không kể dài | F-22 ghi trong ngày, kèm câu *"lỗi này sẽ lặp cho tới khi có cổng"* |
| **Dừng ở chỗ nhìn được.** Hiến pháp cấm agent chạy một mạch | **24 commit chạy một mạch**, báo cáo dồn ở cuối — đúng ô ❌ trong hiến pháp |
| **Xếp rủi ro theo thiệt hại TƯƠNG LAI**, không theo tổn thất hiện tại | bỏ sót hoàn toàn *90 chỗ `localStorage` / 0 bảng thiết lập* — tổn thất hôm nay **0**, nổ đúng ngày cài lên máy khác |

## 5 · Luật là gì

> **Luật là thứ mà vi phạm thì không làm xong được việc của mình.**
> Tài liệu là lời chúc. **Cổng** mới là luật.

Mọi luật trí nhớ trước nay đã chết vì chúng nằm trong tài liệu, mà tài liệu không chặn ai làm gì.
⇒ Nối vào **đúng cái cổng đã chặn mã** (`npm test`). Đó là **tác động chéo** (Hoà, 28/08).

Đang nối: `soi:quan-tri` L6 (quên đóng mốc) · `soi:thu-muc` (thư mục chưa ai quyết) ·
`soi:giay-phep` (GPL trong bộ cài) · `check:chot` · `soi:foundation`.
