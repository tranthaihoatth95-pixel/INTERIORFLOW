# `IF-ADVICE-VERIFICATION-GATE-001` — từ LỜI KHUYÊN tới QUYẾT ĐỊNH BỀN

> **Plane: BUILDER.** Đây là luật vận hành của cỗ máy dựng ra IF, **không phải tri thức sản phẩm**.
> ADR Q14 §④ cấm trộn hai thứ; tệp này ở `docs/control/` đúng vì lý do đó.
> **Tệp CANONICAL DUY NHẤT của protocol này.** Cấm dựng bảng/sổ song song — sổ thứ hai là bắt đầu
> phân kỳ (luật 6). Mọi nơi khác chỉ được **trỏ tới đây**.
> Chat **không canonical**. Một câu trong chat chưa phải quyết định.

## 0 · BÀI HỌC GỐC — vì sao protocol này tồn tại

Ngày 27/08, ba tác nhân cùng nhìn một việc và **hai trong ba sai theo cùng một kiểu**:

| ai | nói gì | thực tế |
|---|---|---|
| **Codex** | đề xuất commit 23 ảnh runtime UX vào Git | **chưa đọc** vì sao `.gitignore:85-90` chặn `docs/**/*.png` |
| **Claude MAIN** | *"tôi nghiêng về ngoại lệ hẹp — ảnh là bằng chứng"* | cũng **chưa đọc** lý do; nghe hợp lý nên đồng ý |
| **Kiểm độc lập** | mở `.gitignore` đọc nhãn: *"luật trung tính + repo nhẹ (chốt 01/08)"* | ảnh chụp app với **dữ liệu dự án THẬT, tên khách hàng** ⇒ commit là đưa tên khách của một studio vào sản phẩm bán ra toàn cầu — **vi phạm thẳng LUẬT NỀN TẢNG** |

Kết quả đúng (phương án 2): giữ `.gitignore` · commit **văn bản + manifest/hash** · **mirror ảnh
vào Drive hạn chế** · cần review rộng hơn thì dựng **bản đã che tên khách**.

**Ba câu rút ra, và cả ba đều thành luật ở dưới:**
1. **Đồng thuận KHÔNG phải bằng chứng.** Hai bên cùng gật mà cùng chưa đọc thì hai cái gật ấy
   không cộng lại thành một bằng chứng — chúng cộng thành một sự tự tin.
2. **Phải có phản biện ĐỘC LẬP**, và người phản biện phải nhận **bài toán + bằng chứng**, không
   nhận kết luận đã dọn sẵn.
3. **Bằng chứng phải đúng PHẠM VI câu hỏi.** *"Ảnh là bằng chứng kỹ thuật"* đúng, nhưng câu hỏi
   thật là *"hiện vật này chứa gì và được phép nằm ở đâu"* — một câu hỏi **quyền riêng tư**, không
   phải câu hỏi kỹ thuật.

Ghi thêm ở `docs/design-campaign/02-FAILURE-LEDGER.md` §F-21.

---

## 1 · `IF-DEC-*` · DECISION CARD

Mọi quyết định **đáng kể** phải có một thẻ. "Đáng kể" = chạm sản xuất, chạm dữ liệu, chạm luật
nền, hoặc sẽ được phiên sau đọc như đã chốt.

```
IF-DEC-<số>
  Plane      : IF | AN | IDF | BUILDER | CLIENT-TTT
  Owner      : ai chịu trách nhiệm · Authority: ai được quyền chốt
  Status     : CANDIDATE | PROVISIONAL | CURRENT | SUPERSEDED | REJECTED
  Problem    : bài toán + giá trị nếu giải được
  OBSERVED   : [EV-*] — mỗi dòng một mã bằng chứng, KHÔNG viết chữ trần
  INFERENCE  : suy ra từ OBSERVED nào, và suy bằng bước nào
  PROPOSED   : đề xuất — chưa được coi là sự thật
  Scope      : ĐƯỢC chạm gì · CẤM chạm gì (liệt kê hệ thống, không nói chung chung)
  Risks      : rủi ro + dấu hiệu sớm của từng cái
  Safety     : van an toàn · đường lùi CHÍNH XÁC (lệnh, không phải ý định)
  Canonical  : tệp nào giữ quyết định này
```

⛔ **Ba mục `OBSERVED` / `INFERENCE` / `PROPOSED` không được trộn vào một đoạn văn.** F-20 xảy ra
đúng vì ba dữ kiện đo được đứng cạnh một suy diễn chưa kiểm, và suy diễn ấy **thừa hưởng độ tin**
của ba dữ kiện kia.

---

## 2 · `EV-*` · EVIDENCE LEDGER

```
EV-<số>
  Type        : user decision | code | test | runtime | external primary source
  Source      : đường dẫn/URL · Location: file:dòng hoặc lệnh đã chạy
  Hash        : sha256 của hiện vật (nếu là tệp)
  Captured    : ngày giờ đo
  Scope       : câu hỏi mà bằng chứng này TRẢ LỜI ĐƯỢC
  Sensitivity : public | internal | client-data | PII | license-bound
  Strength    : strong (đo trực tiếp) | medium (đo gián tiếp) | weak (lời khai trong mã/doc)
  Freshness   : hạn dùng · điều kiện làm nó cũ đi
  Contradicts : bằng chứng nào mâu thuẫn với nó
```

**Tự hạ cấp — không chờ ai xét:**
| điều kiện | hạ xuống |
|---|---|
| hash nguồn đổi | `STALE` |
| quá hạn `Freshness` | `STALE` |
| runtime đo ở **state/route khác** với câu hỏi | `UNVERIFIED` |
| là **dữ liệu khách** mà chưa có phép | `UNVERIFIED` + khoá lại, không trích dẫn |

⛔ **Không có `EV-*` thì chỉ được ghi `UNKNOWN`.** Cấm nói thành fact. Đây là luật bị vi phạm
nhiều nhất, và nó rẻ nhất để tuân thủ.

**Bẫy phạm vi — chính bẫy của case 23 ảnh:** một `EV` mạnh vẫn **vô dụng** nếu `Scope` của nó
không phải câu hỏi đang hỏi. Ảnh runtime là `strong` cho câu *"UI hiện ra thế nào"*, và là
**`UNVERIFIED`** cho câu *"hiện vật này được phép nằm ở đâu"* — vì `Sensitivity` của nó là
`client-data`, mà không ai điền ô đó.

---

## 3 · `DISS-*` · INDEPENDENT CHALLENGE

**Bắt buộc** cho: W2/W3 · security/privacy · AI · kiến trúc · migration.

**Luật người phản biện:**
- **KHÔNG phải người đề xuất.** Tự phản biện là tự gật lần thứ hai.
- Nhận **bài toán + bằng chứng TRƯỚC**; **không** nhận kết luận dọn sẵn khi còn tránh được.
  (Đưa kết luận trước là mời người ta đi tìm lý do đồng ý.)

**Phải trả lời đủ năm câu:**
1. **Lập luận phản đối MẠNH NHẤT** là gì — không phải lập luận dễ bác nhất.
2. **Điều gì sẽ BÁC BỎ** đề xuất này? Không nêu được ⇒ đề xuất **không kiểm được** ⇒ `UNKNOWN`.
3. **Lệch phạm vi**: bằng chứng có trả lời đúng câu đang hỏi không?
4. **Rủi ro quyền riêng tư / giấy phép** — hỏi tường minh, kể cả khi đề xuất trông thuần kỹ thuật.
5. **Phương án AN TOÀN HƠN** nào cho cùng giá trị?

**Verdict**: `ALIGNED` · `MATERIAL_CONFLICT` · `UNKNOWN`.
⛔ Người phản biện **chỉ chặn hoặc đính chính**. Không tự thay quyết định của Hoà bằng quyết định
của mình — `MATERIAL_CONFLICT` là **định tuyến lên trên**, không phải phủ quyết.

---

## 4 · `GATE-*` · EXECUTION GATE — chạy TRƯỚC khi writer gõ dòng đầu

```
GATE-<số>
  Task · Owner · Writer lease (tên phiên, kiểm sống bằng `ListAgents`)
  Decision IDs : IF-DEC-*   ·   Evidence IDs : EV-*   ·   Challenge : DISS-*
  Allowed systems  : liệt kê tường minh
  Forbidden systems: liệt kê tường minh
  Proof bắt buộc   : bậc nào (test thuần · module runtime · HTTP · production · Electron đóng gói)
  Rollback         : lệnh chính xác
  Approval         : ai đã gật, ở đâu
```

**Cổng TỰ `BLOCK` khi — không cần ai bấm:**
- `Plane` / `Owner` / `Evidence` / `Sensitivity` / **writer lease** mơ hồ;
- một quyết định vừa `CURRENT` vừa `SUPERSEDED`/`REJECTED` (hai sự thật cùng sống);
- có `DISS-*` `MATERIAL_CONFLICT` **chưa được định tuyến**;
- **chat là nguồn DUY NHẤT** — không có `EV-*` nào ngoài một câu ai đó nói.

---

## 5 · `REC-*` · DURABLE RECEIPT — sau mỗi checkpoint

```
REC-<số>
  Đã đổi gì · Evidence/hash · Pointer nào đã cập nhật
  Supersede transaction : artifact cũ → đóng dấu SUPERSEDED → cập nhật MỌI pointer
  Unknowns còn lại · Owner tiếp theo · Restore path
```

⛔ **Thiếu một bước của supersede ⇒ `FAIL-DURABILITY`**, kể cả khi mã đã chạy đúng.
Lý do có thật, đã trả giá: `IF-CURRENT-STATE.md` từng mang **ba ô người-ghi cùng sống** vì artifact
mới được dán lên mà artifact cũ không ai đóng dấu (F-19 · biên nhận `147f66a`).

---

## 6 · NGƯỠNG — protocol phải rẻ, nếu không nó bị bỏ qua

| bậc | bắt buộc có |
|---|---|
| **W1** — lát nhỏ, lùi được bằng một revert | `IF-DEC-*` + `REC-*` |
| **W2** — chạm nhiều hệ / đổi hành vi người dùng | thêm `DISS-*` |
| **W3** · PII · license · **destructive migration** | `DISS-*` + `GATE-*` + **Quality proof** |

**Hoà chỉ cần vào ba chỗ:** mắt/brand cuối · quyền riêng tư & pháp lý · thay đổi **không lùi được**.
Mọi thứ khác chạy tự chủ — protocol này tồn tại để **không phải hỏi**, không phải để hỏi nhiều hơn.

⛔ **`PASS` chỉ do Quality tuyên, SAU một runtime proof độc lập.** MAIN và Codex **không tự gọi
`PASS`**. Nhãn hợp lệ: `NOT ASSESSED` · `PARTIAL` · `PASS` · `FAIL` — mỗi nhãn **kèm bề mặt đã chạm**.

---

## 7 · VÍ DỤ ĐẦY ĐỦ — case "23 ảnh UX runtime"

Chạy ngược case thật để chứng minh protocol **bắt được** lỗi, chứ không chỉ mô tả nó.

### `EV-001` — 23 ảnh runtime
`Type` runtime · `Source` `docs/design-candidate/IDF-IF-PACKET-003/ux/anh/` · `Captured` 27/08 ·
`Hash` 23 dòng trong `ux/MANIFEST.md` · `Strength` **strong** cho *"UI hiện ra thế nào"* ·
`Sensitivity` 🔴 **`client-data`** — chụp app với 25 dự án thật, có tên khách ·
`Scope` **KHÔNG** trả lời được câu *"hiện vật này được phép nằm ở đâu"*.

### `EV-002` — luật `.gitignore`
`Type` code · `Location` `.gitignore:85-90` · nhãn nguyên văn *"luật trung tính + repo nhẹ (chốt
01/08)"* · `Strength` **strong** · `Scope` **đúng** câu đang hỏi.
⚠️ **Codex và MAIN đều chưa đọc `EV-002` khi đưa ra khuyến nghị.**

### `IF-DEC-001` — ảnh runtime nằm ở đâu
`Plane` BUILDER · `Authority` Hoà · `Status` **CURRENT**
`OBSERVED` [EV-001][EV-002] · `INFERENCE` ảnh mang `client-data` ⇒ vào repo là phát tán ·
`PROPOSED` (2) git giữ văn bản + manifest/hash; Drive hạn chế giữ ảnh gốc
`Scope` cho phép: `.gitignore` giữ nguyên · publisher thêm `folderMappings` · manifest vào git.
**Cấm**: sửa `.gitignore`, đưa ảnh gốc ra ngoài vòng người có quyền, dùng ảnh thật làm asset mặc định.
`Safety` gỡ dòng `folderMappings`; ảnh chưa từng vào git nên **không có gì phải rút lại**.

### `DISS-001` — phản biện độc lập
Lập luận phản đối mạnh nhất: *"bằng chứng không tái lập được thì không phải bằng chứng"* —
**thật**, và đã suýt thắng.
Điều bác bỏ nó: **hash trong manifest ĐÃ COMMIT** khiến ảnh trên Drive vẫn đối chiếu được ⇒ bằng
chứng **vẫn** tái lập được mà không cần ảnh nằm trong git.
Lệch phạm vi: `EV-001` bị dùng cho một câu hỏi **quyền riêng tư** bằng lý lẽ **kỹ thuật**.
Rủi ro: tên khách vào repo sản phẩm toàn cầu — **không lùi được** sau khi push.
An toàn hơn: mirror + hash + bản đã che tên.
**Verdict `MATERIAL_CONFLICT`** ⇒ định tuyến lên Hoà ⇒ Hoà chốt phương án (2).

### `GATE-001`
Đã `BLOCK` đề xuất ban đầu, đúng **hai** điều kiện: `Sensitivity` của `EV-001` **để trống**, và
`Forbidden systems` không liệt kê `.gitignore` trong khi đề xuất định sửa nó.

### `REC-001`
Commit `63de2d8` (Gap Map + manifest) · `56b84a7` (bốn luật ảnh) · Drive **71/71** khớp sha256 ·
đối chiếu chéo manifest↔Drive **23/23** · `Unknowns`: chưa có bản đã che tên khách ·
`Restore path`: ảnh chưa từng vào git.

> **Protocol này bắt được lỗi ở ĐÚNG ba chỗ**: `EV-001.Sensitivity` để trống (ô bắt buộc) ·
> `EV-001.Scope` không khớp câu hỏi · `GATE` chặn vì đề xuất định sửa một tệp không có trong danh
> sách được phép. **Không cần ai thông minh hơn — chỉ cần ô bắt buộc không được để trống.**

---

## 8 · ĐIỀU PROTOCOL NÀY **KHÔNG** LÀM

- **Không bắt được suy luận sai** khi mọi ô đều điền đúng (F-20: ba số đo thật + một suy diễn
  chưa kiểm). Chống nó là mục `INFERENCE` phải tách riêng **và** `DISS` câu 2 (*"điều gì bác bỏ
  đề xuất này"*) — nhưng không có gì bảo đảm.
- **Không thay được runtime proof.** Thẻ đầy đủ mà chưa chạy thì vẫn là `NOT ASSESSED`.
- **Không tự chạy.** Chưa có máy soi nào canh; hôm nay nó là **kỷ luật đọc-và-điền**, và đó là
  điểm yếu lớn nhất của chính nó. Xem §9.

## 9b · MÁY CANH — `npm run soi:quan-tri` (27/08)

Protocol nay **có răng máy**, chạy trong `npm test`. Nguyên tắc chọn luật: **chỉ canh thứ đã cắn** —
mỗi luật ứng với một lỗi có số hiệu trong sổ, không luật nào canh một lỗi tưởng tượng.

| luật | canh gì | gốc |
|---|---|---|
| **L1** | `EV-*` thiếu `Sensitivity` hoặc `Scope` ⇒ **ĐỎ** | F-21 — ô để trống là chỗ 23 ảnh lọt qua |
| **L2** | một `IF-DEC-*` vừa `CURRENT` vừa `SUPERSEDED`/`REJECTED` ⇒ **ĐỎ** | F-19 — ba ô người-ghi cùng sống |
| ~~L3~~ | ~~`PASS` không kèm bề mặt~~ — **ĐÃ BỎ**, xem dưới | F-16 |
| **L4** | đang sửa **luật nền** mà không entry nào khai `luatNen` ⇒ cảnh báo | F-21 — cả hai cùng gật, cùng chưa đọc |
| **L5** | entry frontier nhạy cảm/chạm luật nền mà thiếu `dec`/`ev` ⇒ **ĐỎ**; W2+ thiếu `diss` ⇒ cảnh báo | ngưỡng §6 |

🔴 **L3 đã bị bỏ, và lý do đáng ghi hơn cả luật.** Ý đúng (`PASS` một mình là chữ rỗng), **máy
soi thì sai**: lượt đầu kêu **10 chỗ, cả 10 đều oan** — chúng chỉ đang *bàn về* chữ `PASS`. Siết
lại còn 6, vẫn **5 oan**, và chỗ thứ sáu (`**PASS ở tầng máy chủ**`) **có** nêu bề mặt, chỉ khác
dấu câu. Phân biệt **tuyên bố** với **bàn luận** cần hiểu ngữ cảnh — regex thua. Mà một cổng kêu
oan là một cổng **sẽ bị tắt** (F-02, chính bài học được trích trong chú thích của luật đó).
⇒ F-16 ở lại là **luật ĐỌC**, không thành luật MÁY. Thà biết mình đang dựa vào kỷ luật người,
còn hơn tưởng có máy canh trong khi cái máy ấy kêu bừa.

### Kiểm đột biến — `scripts/proof/soi-quan-tri.mjs` · **12/12**
Cố ý viết `EV-901` thiếu ô, đòi máy **đỏ đúng chỗ**, rồi xoá và đòi **xanh lại**.
Nó bắt được ngay một lỗi thật của chính máy soi: lookahead dùng `\Z` — **cú pháp Python/PCRE,
trong JS khớp chữ `Z`** — nên khối `EV`/`IF-DEC` không bao giờ đóng đúng và **máy soi CÂM**.
Ship thẳng thì đã có một cổng "xanh" vì nó **không soi gì cả** — đúng F-15, lần này ở tầng máy canh.

### Chỗ Hoà kiểm soát: **lớp frontier**
`scripts/frontier-registry.mjs` — sổ máy-đọc-được, đã soi hai chiều. Entry mang ô `quanTri` tuỳ
chọn: `bac` · `nhay` · `dec` · `ev` · `diss` · `gate` · `luatNen`.
**Cố ý tuỳ chọn**: 90% entry là W1, không đáng một ô nào; máy chỉ **đòi** khi entry chạm luật nền
hoặc dữ liệu nhạy cảm. Bắt mọi entry điền là cách nhanh nhất giết một protocol.
Một lệnh để nhìn toàn cảnh: `npm run soi:quan-tri`.

## 9 · TRẠNG THÁI — `PARTIAL`

`PARTIAL — protocol/documentation proof; chưa có máy canh, chưa runtime-proven.`

**Đã có** (27/08): máy canh `soi:quan-tri` chạy trong `npm test`, 4 luật, kiểm đột biến 12/12 —
xem §9b. Ô `Sensitivity` để trống nay **bị chặn bằng máy**, không còn là kỷ luật đọc.

**Vẫn CHƯA được chứng minh, và đây là điều quan trọng nhất của mục này:** ví dụ §7 là **dựng
ngược** từ một case đã xảy ra. **Chưa có case nào bị protocol chặn TRƯỚC khi nó xảy ra.** Đó là
bậc bằng chứng duy nhất thật sự đáng tin, và nó chưa tồn tại. Máy canh xanh chỉ nói *"không ai
để trống ô"*, không nói *"cổng đã cứu một quyết định"*.

⏳ **Điều khoản khai tử — protocol tự chịu luật của mình.** Sau **10 quyết định W2+**: nếu không
`DISS-*` nào ra `MATERIAL_CONFLICT` và không lượt `soi:quan-tri` nào đỏ ⇒ **cắt xuống còn L1/L4 +
câu hỏi trích-luật**, bỏ phần còn lại. Một protocol không bao giờ nổ thì hoặc hoàn hảo, hoặc chết
— và không phân biệt được nếu không đặt luật trước.
