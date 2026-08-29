# IF · MỤC LỤC THEO CÂU HỎI

`Plane: BOS` · phân luồng: `docs/control/BOS-PHAN-LUONG-TRI-NHO.md`


> Tra ở đây **trước khi** tìm ngoài. Đây là mục lục của câu hỏi, không phải của tệp.
>
> 🔴 **HỢP NHẤT 28/08 — tệp này THAY VAI ĐỊNH TUYẾN của `02-SMARTBOARD.md`.**
> Smartboard (26/08, `design-candidate/IDF-IF-PACKET-003/`) tự khai *"chỉ mục **ĐỊNH TUYẾN** —
> không thay thế nguồn nào, chỉ trỏ đường"* — **đúng thứ tệp này làm**. Tôi dựng tệp này 28/08
> mà **không LOOK INSIDE**, nên đẻ ra chỉ mục định tuyến thứ hai. Hoà bắt được: *"smartboard,
> look inside, sổ luật quá trời luôn — có giống nhau không?"* Có.
>
> **Một chỉ mục định tuyến, ở đây.** Smartboard **giữ nguyên, không sửa** — nó nằm trong gói đã
> đóng dấu băm (`IDF-IF-PACKET-003/MANIFEST.json`), sửa nó là hỏng biên nhận. Nó còn giá trị làm
> **dấu vết** và giữ hai bảng tệp này không có: **gói candidate** `SB-101…103` và **canvas thiết kế**.
> Cần hai bảng đó thì mở Smartboard; **định tuyến nguồn chân lý thì đọc ở đây.**

## Vì sao có tệp này

Kho tài liệu IF có **887 tệp**, đặt tên theo *lúc nào làm* (`AUDIT-…-2026-08-03`) hoặc *máy nào
đẻ ra nó* (`SOI-10-PHIEN-…`, `PROMPT-…`). **Không tên nào hứa trả lời một câu hỏi**, nên không ai
mở — và mỗi phiên lại đi đo lại thứ đã đo rồi. Hoà chỉ ra 28/08: *"đặt tên sao cho các bạn dễ tìm
**và muốn đọc**"*. Chữ *muốn* mới là chữ khó.

Một tệp được mở khi **tên nó là câu hỏi mà người đọc đang có trong đầu**. Không phải khi nó đúng
thư mục.

## Ba luật đặt tên — áp cho tài liệu MỚI

1. **Tên là câu hỏi nó trả lời**, không phải ngày tháng, không phải tên máy sinh ra nó.
   `dwg-co-ship-duoc-khong.md` ✅ · `AUDIT-DWG-2026-08-28.md` ❌
2. **Một tệp một câu hỏi.** Trả lời được hai câu thì tách hai tệp. Tệp trả lời mười câu là tệp
   không ai đọc hết, tức không ai đọc.
3. **Ngày nằm TRONG tệp, không nằm trên tên.** Ngày trên tên làm mọi tệp trông như đã cũ; ngày
   trong tệp cho biết nó còn dùng được không.

⚠️ **Không đổi tên 887 tệp cũ.** Đổi tên hàng loạt là làm gãy mọi tham chiếu đang trỏ tới chúng —
đúng lớp lỗi B (*đúng thao tác, sai đối tượng*). Tệp cũ cứ để yên; câu hỏi nào có người hỏi thì
thêm một dòng vào bảng dưới, trỏ tới nó. **Kho tự dọn theo nhu cầu thật, không dọn theo lịch.**

## Lệnh nghiên cứu — thứ tự bắt buộc

```
① tra bảng dưới          → đã có ai trả lời câu này chưa?          (npm run tra)
② tra kho ngoài repo     → ~/PROJECT · Drive · interiorflow-reference
③ TRA 109 PHIÊN CHAT     → mcp__ccd_session_mgmt__search_session_transcripts
④ mới ra ngoài tìm       → và chỉ tìm ĐIỀU MỚI, không tìm lại điều đã biết
⑤ tư vấn                 → kèm phần ①②③ đã có, để Hoà thấy cái gì cũ cái gì mới
⑥ ghi câu hỏi mới vào bảng này
```

### 🔴 Bước ③ là bước đắt nhất khi bỏ qua — đo được 28/08

`~/.claude/projects/…/` giữ **109 phiên · 1,3 GB nguyên văn**. Không ai từng mở lại.

Chẩn đoán **gốc bệnh của IF** (bản vẽ thật vào, 3D ra rỗng) đã nằm trong tầm tay **từ 07/08 và
15/08**: hai phiên đã mở **đúng** `03_TANG5B-TTT.dxf` và `05_TANG9-TTT.dxf`, và một phiên đã ghi
*"poché tường **126–161 mảng/file** KHÔNG neo vào cấu kiện"* — con số khớp chính xác phép đo
28/08 (126 và 147 hatch).

**Ba tuần, hai lần nhìn thấy, rồi phải đo lại từ đầu** — chỉ vì không ai tra kho đó.
Đây là cơ chế Hoà mô tả: *"rất nhiều cái rất tinh rất hay đã từng được xây dựng"* rồi mất.

Bỏ bước ① là cơ chế đẻ ra *"đề xuất lại thứ đã có"* (luật N8) — và đó là thứ đã tiêu tiền của Hoà.

---

## Bảng câu hỏi

Cột **Còn đúng không** là cột quan trọng nhất: một câu trả lời cũ mà không ai đóng dấu thì phiên
sau tin nhầm.

### IF là gì · làm việc thế nào

| Câu hỏi | Trả lời ở | Còn đúng không |
|---|---|---|
| InteriorFlow **là gì**? | `docs/IF-KIEN-TRUC-OS.md` | ✅ chốt 18/08, trên mọi chốt khác |
| Luật bền nào ràng buộc tôi? | `docs/control/IF-CANONICAL.md` | ✅ |
| Làm việc với Hoà thế nào? | `~/PROJECT/CLAUDE.md` §3 + §5 | ✅ Hoà tự viết 26/08 |
| Hoà vừa nhắn gì? | `~/PROJECT/INBOX.md` | ✅ đọc mỗi phiên |
| Đang ở đâu, việc kế tiếp là gì? | `docs/control/IF-CURRENT-STATE.md` | ✅ tệp nóng, dễ cũ |
| Tôi cầm được công cụ gì, đã xác minh? | `docs/control/IF-TOOLING-RECEIPT.md` | ✅ |
| Kiến trúc đã chốt gì? (`SB-005`) | `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md` | ✅ ADR Q1–Q9 + **Q14** — **dãy ADR duy nhất, cấm mở dãy hai** |
| Các mảnh lắp với nhau ra sao? (`SB-006`) | `docs/IF-ARCHITECTURE-BLUEPRINT.md` | ✅ |
| Mọi lỗi rút gọn thành một công thức nào? | `docs/control/IF-MOT-LOI.md` | ✅ đo 28/08 — **lấp khoảng trống bằng phỏng đoán rồi trình bày như sự thật** |
| Trí nhớ chia mấy tuyến, cất ở đâu? | `docs/control/BOS-PHAN-LUONG-TRI-NHO.md` | ✅ 5 tuyến · cổng L7 |
| Trật tự mới sau 28/08 là gì? | `docs/control/IF-TRAT-TU-MOI.md` | ✅ lời chứng + 7 luật kèm **trạng thái cổng thật** |
| Ai là ai trong đống Claude/GPT? | `docs/control/AI-LA-AI-CHU-LA-GI.md` | ✅ |

### Đã ngã ở đâu

| Câu hỏi | Trả lời ở | Còn đúng không |
|---|---|---|
| Sai lầm giao diện nào đã trả giá? | `docs/control/IF-UXUI-OPERATING-MEMORY.md` | ✅ M-01…M-56 |
| Viết hoa chữ Việt có sao không? | cùng tệp trên, **M-41** | ✅ **hoa toàn phần giết dấu chồng** |
| Bộ chữ có phủ đủ tiếng Việt không? | cùng tệp trên, **M-40** | ✅ kiểm bằng bảng mã, không bằng mắt |
| 21 lỗi đã ghi rút gọn thành mấy công thức? | `docs/design-campaign/02-FAILURE-LEDGER.md` | ⚠️ sổ có 21 mục; **ba công thức** rút 28/08 chưa ghi vào sổ |
| Một khuyến nghị thành quyết định bền qua cổng nào? | `docs/control/IF-ADVICE-VERIFICATION-GATE.md` | ✅ |

### Đã đo, có biên nhận

| Câu hỏi | Trả lời ở | Còn đúng không |
|---|---|---|
| DWG có ship được không, vướng gì? | `docs/design-candidate/IDF-IF-PACKET-003/dwg/01-DWG-LICENSE-FIDELITY.md` | ✅ đo 28/08 · cờ đã tắt |
| Người vẽ CAD thao tác thế nào · AI vẽ CAD thế nào? | `docs/nc/NC-DOC-NGUOC-THAO-TAC-VE-2026-08-28.md` | ✅ khảo 28/08 — **ý định người vẽ là TRỤC + BỀ DÀY; hai đường song song là sản phẩm phụ của `OFFSET`**. Đầu vào vector ⇒ dùng hình học, **không** dùng học sâu |
| Máy không có AutoCAD thì nhập DWG kiểu gì? | `lib/cad/dwg-flag.ts` (đầu tệp) | ✅ ba đường, không nêu tên hãng |
| Vì sao server kẹt sau 6 phút? | `docs/design-candidate/IDF-IF-PACKET-003/sqlite/01-L2-01-CHAN-DOAN.md` | ⚠️ **chưa tái hiện được** — 6,2 triệu lượt, 0 arm kẹt |
| `.idfc` có ra được 3D không? | `docs/design-candidate/IDF-IF-PACKET-003/f3/01-IDFC-TO-3D-GAP.md` | ✅ đo 28/08 — **đứt**, `geom3d.heightMm` 3 nơi ghi 0 nơi đọc |
| Dock có được đổi hết theo chặng không? | `docs/control/IF-ADVICE-VERIFICATION-GATE.md` §10 | 🟡 PROVISIONAL — **giữ vùng neo bất biến** |
| `.idfc → 3D` được phép thi công chưa? | `docs/design-candidate/IF-DEC/IF-DEC-IDFC-3D-001-v0.2.md` | ⛔ **CHƯA** — ACCEPTED CANDIDATE, cổng G1–G7 chặn |

### Đã từng BỎ — biết trước khi mang lại vào

> Hoà 28/08: *"có những cái từng được chốt bỏ → chốt mang ra ngoài repo có lý do → giờ mang vào
> ok, **nhưng phải biết điều gì đã từng bị bỏ mà không gộp cái bẩn vào người**."*
> Mang lại vào thì phải **đọc hàng tương ứng dưới đây trước**, không mang mù.

| Câu hỏi | Trả lời ở | Còn đúng không |
|---|---|---|
| Thương hiệu/dữ liệu riêng nào từng sót trong repo? | `docs/AUDIT-BRAND-PII.md` | ✅ quét 25/07 · 853 tệp · 13 chuỗi khách |
| Cái gì đã **tách ra ngoài repo** và vì sao? | `CLAUDE.md` §"Dữ liệu tham khảo đã TÁCH RA NGOÀI" | ✅ 24/07 — hồ sơ khách · brand TTT · ảnh sản phẩm · bản sao DB → `~/Downloads/interiorflow-reference/` |
| Vì sao `knowledge/ttt-design-system` biến mất? | `CLAUDE.md` §"Project Knowledge" + `docs/00-CHOT.md` "Dọn trung tính 01/08" | ✅ tài sản thương hiệu **một** studio, không được nằm trong sản phẩm bán ra |
| Ảnh khách trong Thư viện có phạm luật không? | **KHÔNG**, nếu có xuất xứ và **không** mang thẻ `seed`/`minh-hoa` | ✅ đo 28/08 — 5 asset `ST5` là *người dùng thêm*, có nguồn `pdf 260812_st5_concept`, **0** thẻ seed |
| Luật tách APP / DEMO / DỰ ÁN | `docs/CONTENT-RULES.md` | ✅ |

**Luật mang-lại-vào:** thứ gì từng bị bỏ, mang lại vào thì phải khai **ba dòng** — *ai bỏ · vì sao
bỏ · điều gì đã đổi khiến nay mang lại được*. Thiếu một dòng ⇒ **không mang**. Ba dòng đó là thứ
ngăn "gộp cái bẩn vào người".

### Đang mở — chưa ai trả lời

| Câu hỏi | Ai trả lời được | Vì sao chưa |
|---|---|---|
| IF đã làm được **việc nghề nào** cho Hoà? | phép thử DXF thật | chờ Hoà đưa một tệp |
| Cú kẹt L2-01 do đâu? | đo trên `next start` có phiên đăng nhập | chưa chạy |
| Gỡ mã GPL khỏi bộ cài thế nào? | cấu hình `build.files` | chưa làm; cổng đã chặn đóng gói |
| Ký số hay chấp nhận bản chưa ký? | **chỉ Hoà** | — |

---

## Cách thêm một dòng

Trả lời xong một câu hỏi mà bảng này chưa có → thêm **một dòng**, không viết thêm tài liệu tổng
kết. Bảng dài ra là kho đang khoẻ; kho đẻ thêm tệp tổng kết mới là kho đang ốm.

| chia việc cho nhiều phiên thế nào, ai được ghi | `IF-VUNG-BOI-CANH.md` |

| cài đặt người dùng nên sống ở đâu | `docs/design-candidate/IF-DEC/IF-DEC-CAI-DAT-BA-TRUC-001.md` |
