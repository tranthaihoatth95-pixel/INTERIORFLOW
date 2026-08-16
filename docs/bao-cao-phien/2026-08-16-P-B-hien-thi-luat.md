# P-B · HAI CHẾ ĐỘ HIỂN THỊ LUẬT (NGẮN ↔ ĐẦY ĐỦ) + TRỤC NGUỒN — báo cáo phiên 16/08

> Phiếu: `docs/phieu-giao/P-B-hien-thi-luat.md` · khuôn 6 phần (`docs/CLAUDE.md` LUẬT CỨNG BÁO CÁO).

---

## ⚠️ SỰ CỐ VẬN HÀNH — WORKTREE LỆCH MỐC (ghi đầu bài theo yêu cầu T)

Lượt chạy đầu, worktree được cắt từ `b9d8ad1` (12/08), **lệch main 167 commit**. Tôi đã chạy hết
ô ⓪ và báo "all premises verified" **trên cây CŨ** — kết luận đó không dùng được. T dừng giữa
chừng, đưa worktree về `4206851` = HEAD main, và giao lại phiếu nguyên văn.

Hai ghi nhận để lần sau không mất công:
- **Ô ⓪ không phát hiện được lỗi này** — ba tiền đề của phiếu đều nói về `lib/review/` và
  `lib/cad/standards/registry.ts`, mà **hai vùng đó KHÔNG đổi giữa 12/08 và 16/08** (kiểm lại
  sau khi có cây mới: cùng số dòng, cùng số byte). Nên cây cũ vẫn cho ra "xác nhận" đúng. Thứ
  lệch là `docs/` (00-CHOT thiếu toàn bộ mục 15-16/08) và các file ô ② — tức **phần LUẬT, không
  phải phần CODE**. ⇒ đề xuất T: thêm một dòng vào ô ⓪ của khuôn phiếu — *"xác nhận worktree ở
  đúng HEAD"* — vì tiền đề về code có thể đúng trong khi tiền đề về luật đã mục.
- **Công dựng mock không mất**, nhưng bản đầu **có lỗi thật do thiếu tài liệu**: tôi đoán 9 giá
  trị token theme Sáng. Đã sửa hết (mục 2.4).

---

## 1 · TỔNG QUAN

Lớp luật của bảng kiểm nay có **hai chế độ hiển thị** (Ngắn cho lúc chạy deadline ↔ Đầy đủ cho
lúc bảo vệ hồ sơ, nhớ per-user) và **trục NGUỒN** độc lập với trục ràng buộc sẵn có. Ba rào an
toàn pháp lý (B6) được **khoá bằng test**, không chỉ bằng comment: rule chưa có nguyên văn thì
hiện thẳng *"chưa có nguyên văn"*, tuyệt đối không sinh chữ thay thế.

Nghiệm thu: **tsc 0 · test toàn repo 0 fail (file mới 61 ok) · soi:tu-dien 0 lệch · soi:hinh-hoc
giữ nguyên mốc · check:mocks 0 lỗi cho mock mới.** Mock 2 chế độ × 2 theme dựng xong tại
`docs/mocks/mock-the-vi-pham-2-che-do.html`; **DesignSync KHÔNG dùng được trong phiên này** —
lỗi nguyên văn ở mục 2.6.

---

## 2 · CHI TIẾT TỪNG MỤC

### 2.1 · Ô ⓪ TIỀN ĐỀ — chạy lại trên cây `4206851`

| # | Tiền đề | Kết luận | Bằng chứng file:dòng |
|---|---|---|---|
| 1 | `lib/review/` đã dựng đúng chốt 07/08 hai-lớp | **XÁC NHẬN** | `lib/review/types.ts:35` `FindingLuat` · `:63` `FindingGopy` · `:73` union · `:76` `ReviewChang` · `luat/cad.ts` `luat/rules-3d.ts` `luat/deck.ts` `gopy/index.ts` đều tồn tại |
| 2 | `registry.ts` có `effectiveFrom`/`supersededBy` (~87-95) + lọc theo ngày (~222-245) + `verified`/`note`/`region` + đè rule trùng id | **XÁC NHẬN** (số dòng lệch nhẹ, ghi số đo được) | `effectiveFrom` **:87** · `supersededBy` **:95** — khớp phiếu. Hàm lọc: doc-comment **:220-229**, thân hàm `resolveRulesAsOf` **:230-277** (phiếu ghi ~222-245 — đúng vùng, hàm dài hơn phiếu ước). `verified` **:69** · `note` **:71** · `region` **:73** · `binding` **:75**. Đè trùng id: **:54-55** (doc) + **:158-159** (`map.set`) |
| 3 | Trường giữ NGUYÊN VĂN điều khoản CHƯA có | **XÁC NHẬN** | `grep -rn "nguyenVan\|loaiNguon\|cheDoHienThi" lib components` = **0 dòng** trước khi làm. `StandardRule.source` (`:57`) tự khai chỉ giữ *"TÊN VĂN BẢN + điều khoản nếu biết"* |

Ô ② — **4 file đọc-trước có đủ**: `CHOT-PHIEN-15-08-CAN-SOAT.md` (13.878 B, B1-B7 ở dòng 64-104) ·
`nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (17.589 B, NT-1..18 ở mục 5) ·
`nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (15.670 B, KB-1..4 ở dòng 83-96) · `TRIET-LY-IF.md`.

### 2.2 · Ô ④ VIỆC — đã làm gì

| Việc | Nơi | Ghi chú |
|---|---|---|
| ④.1 Hai chế độ, marker `cheDoHienThi` | `lib/review/hien-thi-luat.ts` (mới, 232 dòng) | `CheDoHienThi = 'ngan'\|'dayDu'`; nhớ qua `interiorflow.review.cheDoHienThi.v1`, SSR-safe (`typeof window`), localStorage bị chặn ⇒ về mặc định, không throw |
| ④.2 Trục NGUỒN, marker `loaiNguon` | `lib/cad/standards/types.ts` (mới) | `LoaiNguon = 'luat'\|'tieuChuan'\|'xuHuong'`. **ĐỘC LẬP** `RuleBinding`: không hàm nào suy trục này ra trục kia — khoá bằng test ca [8]/[9] |
| ④.3 Trường `nguyenVan` optional/additive | `types.ts` `RuleSourceMeta` + `registry.ts:53` `StandardRule extends RuleSourceMeta` | Thiếu ⇒ hằng `THIEU_NGUYEN_VAN`, không bịa |
| ④.4 Ba rào an toàn B6 | comment luật đầu `lib/cad/standards/types.ts` + test ca [11]-[15] | Xem 2.3 |
| ④.5 Khác dấu không khác chỗ | `components/review/ReviewPanel.tsx` | 4 kênh phân biệt cùng lúc (khối · hình dạng · nhãn chữ · kiểu viền); `dungTheGopy` **không có đường nào** trả mức hay cờ chặn |
| ④.6 Test ≥15 ca | `lib/review/hien-thi-luat.test.ts` | **17 nhóm ca · 61 khẳng định · 0 fail** |

**Dây từ bộ luật → thẻ**: `Violation` cố ý **KHÔNG** nhận thêm 3 trường (nó là kết quả PHÉP ĐO,
không phải xuất xứ; nhồi vào là hàng chục nhánh sinh vi phạm trong 41k dòng `checker.ts` phải nhớ
điền — cơ chế đẻ ra "quên một chỗ, im lặng mất dữ liệu"). Thay vào đó `luatCad()` tra rule bằng
`ruleId` ngay tại chỗ đã có sẵn danh sách (`lib/review/luat/cad.ts:33-35`). Tra không thấy ⇒ để
trống, không đoán.

### 2.3 · Ba rào an toàn — khoá bằng test, không bằng lời dặn

| Rào | Ca test | Vế "đường thoái lui" | Vế "đường chính chạy được" |
|---|---|---|---|
| Không bịa nguyên văn | [11] [12] [13] | thiếu ⇒ `nguyenVan=null` + cờ báo thiếu | [4] có ⇒ trích **đúng từng chữ** (`=== NGUYEN_VAN_THAT`) |
| Không đắp chữ khác vào chỗ nguyên văn | [12] `nguyenVan !== moTa` · [13] `nguyenVan !== nguon` | — | — |
| Góp ý không bao giờ chặn | [14] `chan === false`, không có `muc`/`nhanMuc`/`nguon` | — | [14] `nguonCongKhai` đi qua nguyên vẹn khi có |

> Áp đúng bài học 15/08 (bug Hough): *"test khẳng định 'trả về đường thoái lui' mà KHÔNG có test
> nào khẳng định đường CHÍNH chạy được thì đó là test che bug"* — nên mỗi rào có đủ hai vế.

**Ca [15] — máy soi mâu thuẫn hai trục**: rule khai `xuHuong` mà mức đỏ ⇒ trái B2 (*"xu hướng
không bao giờ chặn"*). Máy **BÁO** một dòng cảnh báo, **KHÔNG tự hạ mức** — hạ giúp là máy quyết
thay người ở chỗ pháp lý, trái [N1]. Test khẳng định cả hai: có cảnh báo, và `muc` vẫn là `'do'`.

### 2.4 · Ô ⑤ GIAO DIỆN — mock + audit lại theo KB/NT

`docs/mocks/mock-the-vi-pham-2-che-do.html` — hai panel **cạnh nhau, cùng một dữ liệu**, khác đúng
một thứ: chế độ. Đủ 2 theme (nút + phím `D`). Cột 3 là hợp đồng chữ cho phiên code.

**Đã sửa sau khi có tài liệu gốc (đây là phần T yêu cầu soi lại):**

| # | Lỗi bản đầu | Sửa |
|---|---|---|
| 1 | **Đoán 9 giá trị token theme Sáng** (`--hover` `--t1..--t5` `--danger` `--warning` `--success`) — đúng lỗi LUẬT-GIAO-DIEN ④ cấm | Chép nguyên văn `app/globals.css:229-259`. Ví dụ `--danger` tôi đoán `#c0432c`, thật là `#c9341d`; `--t4` đoán `#8d877b`, thật `#9a938a` |
| 2 | `--success` theme Tối đoán `#5fbf8f` | thật `#46b876` (`globals.css:207`) |
| 3 | 3 chỗ dùng `--t4` **trượt WCAG 1.4.3** | → `--t3`, xem 2.5 |
| 4 | Bộ đếm "2 1" đọc lướt thành "21" | mỗi số kèm hình dạng của mức nó đếm |
| 5 | Nút nhãn "Sửa" | → **"Cách sửa"**, xem 2.5 |

**Khớp hệ thống**: thang bo chỉ dùng `--r-1` 6 / `--r-2` 10 / `--r-full` 999 + vi mô 2 — trong
thang duyệt 12/08; segmented là capsule ngoài r-full, đệm 3, nút trong r-full (đồng tâm §2d);
NT-8 icon **luôn** có nhãn chữ (3 icon mức + 4 icon nguồn đều đi kèm chữ); `line-height` ≥1.5 mọi
nơi (LUAT-CHU-VIET); màu **100% qua CSS var**, 0 hex hardcode trong thân mock.

Code `ReviewPanel.tsx` dùng `RADIUS`/`concentricRadius` của `lib/geometry.ts` thay vì số chết —
tiện thể dọn 2 số ngoài thang có sẵn trong file (`borderRadius: 7` và `: 5`).

### 2.5 · Hai skill chấm bắt được gì (ô ⑨ yêu cầu ghi rõ)

**`design:accessibility-review`** — tôi đo contrast bằng công thức WCAG trên chính các cặp token
đang dùng (chạy trong trình duyệt, không ước lượng). **Bắt 3 chỗ trượt thật:**

| Chỗ | Trước | Sau | Vì sao quan trọng |
|---|---|---|---|
| Số hiệu điều khoản | `--t4` 3,44 (tối) / **3,04** (sáng) ❌ | `--t3` 6,53 / 5,20 ✅ | Chính số hiệu làm thẻ này là "luật"; đọc không ra là mất thứ phân biệt nó với góp ý |
| Câu *"Chưa có nguyên văn…"* | `--t4` 3,22 / **2,69** ❌ | `--t3` 6,53 / 5,20 ✅ | Đây là câu chống-bịa quan trọng nhất của tính năng — làm mờ nó là tự bịt cảnh báo của chính mình |
| Nhãn nhỏ + chip "Chưa phân loại nguồn" | `--t4` ❌ | `--t3` ✅ | Phân biệt bằng **kiểu viền** (liền ↔ đứt), không bằng độ mờ |

Còn bắt: chữ `--accent` trên `--card` chỉ **3,55:1** ở theme tối (trượt 4,5 cho chữ 11-12px) ⇒
chuyển dấu Magic tím sang **glyph + viền đứt**, chữ dùng `--t2`/`--t3`. **Đây là nợ cấp TOKEN của
cả app, không riêng panel này** — báo T, ngoài phạm vi phiếu.

**`design:design-critique`** — trục *hierarchy* + *usability*. **Bắt 2 lỗi thật:**
1. **Bộ đếm "2 1"** ở đầu panel: hai số trần cạnh nhau, đọc lướt ra "21". Sửa: mỗi số kèm đúng
   hình dạng của mức nó đếm (⬢2 △1) — vừa tách hai số, vừa là kênh a11y thứ hai.
2. 🔴 **Nút nhãn "Sửa" hứa việc mà hệ CỐ Ý KHÔNG CÓ.** `checker.ts:5-7` là hiến pháp: *"CHỈ ĐỌC
   doc và TRẢ VỀ đề xuất, KHÔNG BAO GIỜ tự sửa entity; không có nút tự-sửa nào"*. Nút này chỉ
   nhảy tới chỗ lỗi rồi hiện chỉ dẫn. Bấm xong thấy bản vẽ y nguyên thì người dùng nghĩ nút hỏng,
   chứ không nghĩ mình hiểu sai nhãn. ⇒ đổi thành **"Cách sửa" / "How to fix"**.

`design:ux-copy` (đọc trước khi viết chuỗi): câu luật phải nói **sửa gì**, không doạ suông; cấm
jargon nội bộ lộ UI. Nên nhãn mức là **"Bắt buộc"/"Khuyến nghị"** (nói độ ràng buộc) chứ không
phải "Đỏ"/"Vàng" (nói màu — vô nghĩa với người mù màu và với bản in).

### 2.6 · DesignSync — KHÔNG dùng được, lỗi nguyên văn

Gọi đúng theo phiếu ⑤.1:

```
ToolSearch  query: "select:DesignSync"
→ No matching deferred tools found
```

Tìm rộng thêm 2 lượt (`"design sync write_files claude design project"`,
`"+design write_files project claude design system"`) — kết quả trả về **chỉ có** Figma MCP
(`mcp__ff7c9094…__use_figma`, `get_design_context`, `search_design_system`), Netlify
(`import-claude-design-from-url` — deploy, không phải ghi file vào project), html.to.design, Miro.
**Không có tool nào ghi được vào project `b7dc14ba-1752-4821-8fc7-d519f737ac09`.**

Phiên này cũng nhận system-notice liệt kê ~76 MCP server **chưa xác thực**, và phiên không tương
tác nên không chạy được OAuth. ⇒ Tôi **không thể** tự nối. Mock giữ nguyên trong repo theo luật
QUY TRÌNH DESIGN 02/08 (`docs/mocks/` vẫn là nguồn sự thật); đẩy lên Claude Design là **việc còn
nợ**, cần T xử đường MCP.

---

## 3 · TỔNG KẾT LẠI VẤN ĐỀ

Trước phiên này bảng kiểm chỉ nói được *"sai ở đâu"*; nó **không dẫn được điều khoản** — `nguon`
chỉ có mã số kiểu `QCVN 06:2022/BXD §3.2.1`. Đủ để KTS tự đi tra, **không đủ để trích khi bảo vệ
hồ sơ**. Đó chính là khoảng trống B7 chỉ ra.

Nay có ba thứ, và cả ba đều **additive**: chỗ CHỨA nguyên văn (`nguyenVan`), chỗ nói **ai ban
hành** (`loaiNguon`, độc lập trục ràng buộc), và **hai chế độ** để một bảng phục vụ được hai tình
huống nghề trái ngược nhau. Quan trọng hơn: chỗ chứa nguyên văn đi kèm **cơ chế từ chối bịa** —
thiếu thì nói thiếu, và điều đó bị test khoá.

Phần chưa có: **chưa rule nào trong 12 bộ luật ngành khai `loaiNguon` hay `nguyenVan`** — ô ③
cấm sửa nội dung bộ luật, nên trục nguồn hiện **đúng nhưng rỗng**, mọi thẻ hiện "Chưa phân loại
nguồn". Đó là hiện trạng thật và UI nói thẳng ra, không giả vờ đã phân loại.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:**
- Ba rào pháp lý là **kiểu dữ liệu + test**, không phải lời dặn. Muốn bịa nguyên văn phải sửa
  `dungTheLuat` và làm đỏ ca [11]-[13] — diff đó sẽ bị soi.
- `dungTheGopy` **không có đường nào** trả mức/cờ chặn ⇒ trộn hai lớp là lỗi biên dịch, không
  phải lỗi review sót.
- Quyết định hiển thị gom về **một hàm**, ba mặt tiền (2D · 3D · deck) không diễn dịch riêng.
- Hai lỗi do skill bắt (nhãn "Sửa", bộ đếm "21") là **lỗi thật đã tồn tại trong code cũ**, không
  phải lỗi tôi vừa tạo.

**Chưa được — nói thẳng:**
- 🔴 **Chưa soi `ReviewPanel` trên app thật.** Luật phiên cấm mở dev server, và một dev server
  của phiên khác đang chạy trong thư mục này. Bằng chứng thị giác hiện chỉ có **mock**; code là
  port từ mock, xác nhận bằng tsc + đọc. Đây là **nợ nghiệm thu mắt**.
- 🟡 **Trục nguồn rỗng 100%** — có cơ chế, chưa có dữ liệu (ô ③ cấm). Giá trị thật chỉ đến khi
  có phiếu khai `loaiNguon`/`nguyenVan` cho ít nhất bộ `vn-fire`.
- 🟡 **Nợ cấp token ngoài phạm vi**: `--accent` làm màu chữ trên `--card` = 3,55:1 ở theme tối.
  Tôi né trong panel này, nhưng cả app đang dùng.
- 🟡 **`focus-visible` chưa có** ở segmented + các nút — nợ chung 31 chỗ đã ghi trong STATUS,
  tôi không mở rộng phạm vi để sửa.
- 🟡 **Touch target 24-26px** < 44px của WCAG 2.5.5. Đúng khuôn desktop-dense sẵn có của panel;
  app có `--tap` override cho `(pointer:coarse)` nhưng panel này chưa dùng.
- 🟢 `npm test -- lib/review` (lệnh phiếu ghi) **không lọc được** — script `test` là pipeline
  `find | xargs`, tham số bị nuốt vào `license:check`. Tôi chạy full suite + 2 file trực tiếp.

---

## 5 · HƯỚNG XỬ LÝ NHIỀU GÓC ĐỘ

**Về nợ nghiệm thu mắt của panel:**
- *(A) T tự chụp khi audit* — rẻ nhất, T đã có server chạy; nhược: T phải tự dựng doc có vi phạm.
- *(B) Gộp vào `duyet-mat-qua-drive`* (entry Hoà chốt 16/08) — panel này vào đúng lô ảnh chung;
  nhược: chậm hơn, và bảng kiểm cần doc có lỗi thật mới chụp được cả 2 chế độ.
- *(C) Phiếu phụ ngắn chỉ để chụp* — sạch nhưng tốn một phiên cho việc nhỏ.

**Về trục nguồn rỗng:**
- *(D) Phiếu khai `loaiNguon` cho cả 12 bộ* — nhanh, nhưng `loaiNguon` là metadata rẻ còn
  `nguyenVan` là việc **tra văn bản gốc**, không phải việc agent làm một mình được.
- *(E) Làm mẫu 3-5 rule `vn-fire` có nguyên văn thật, tra từ nguồn công khai, người duyệt trước
  khi vào repo* — chậm hơn nhưng đúng rào ①②, và chứng minh được đường chính chạy trên dữ liệu
  thật chứ không chỉ trên test.
- *(F) Để rỗng, chờ Vitals canh lỗi thời (B5) tự đề xuất qua ProposalSheet* — đúng kiến trúc
  nhất, nhưng phụ thuộc một thứ chưa build.

---

## 6 · ĐỀ XUẤT HƯỚNG TỐT NHẤT

**Nợ mắt: chọn (A) + (B).** T chụp ngay trong lượt audit (chỉ cần một doc có 1 lỗi đỏ + 1 vàng là
thấy đủ cả hai chế độ), rồi thả cùng ảnh vào lô Drive. Không mở phiếu riêng: việc quá nhỏ so với
chi phí một phiên, mà (C) lại làm chậm đúng thứ Hoà đang thiếu nhất là **ảnh để duyệt**.

**Trục nguồn: chọn (E), KHÔNG chọn (D).** Lý do là chỗ đắt nhất của phiếu này: (D) khai
`loaiNguon` hàng loạt thì trục có dữ liệu **mà `nguyenVan` vẫn rỗng** — người dùng thấy chip
"Luật nhà nước" rồi mở ra đọc *"chưa có nguyên văn"*, tức là ta vừa **tăng kỳ vọng mà không tăng
năng lực**, đúng kiểu lệch #2 trong 5 kiểu cấm (*"lý thuyết nhiều, dùng không được"*). (E) làm ít
mà đi trọn một đường: 3-5 rule `vn-fire` có nguyên văn THẬT chứng minh chuỗi
`văn bản gốc → StandardRule → Violation → FindingLuat → thẻ Đầy đủ` sống được đầu-cuối. (F) đúng
đích nhưng treo vào thứ chưa tồn tại — để sau, và khi làm thì nó chỉ là **thêm mặt tiền** cho
đúng cơ chế (E) đã dựng.

⚠️ Kèm ràng buộc cho phiếu (E): **agent không được tự chép nguyên văn từ trí nhớ.** Phải tra
nguồn công khai, dẫn link, và **người duyệt trước khi vào repo** — đúng rào ①②. Đây là chỗ duy
nhất trong hệ mà "gần đúng" nguy hiểm hơn "không có".

---

## ⑦ NGHIỆM THU — dán nguyên văn

**`npx tsc --noEmit`**
```
(không có dòng nào — exit 0)
--- TSC EXIT 0 ---
```

**`npm test`** (chạy toàn repo; `-- lib/review` không lọc được, xem mục 4)
```
EXIT=0
grep -E "FAIL -|[1-9][0-9]* fail"  →  (không có dòng nào)
grep -cE "^\s+ok\s+-"              →  7683
```
File mới, trong cùng lượt chạy full suite:
```
──────── hien-thi-luat: 61 ok · 0 fail ────────
```
File review sẵn có (kiểm không hồi quy sau khi đổi `violationToFinding`):
```
  ok  - chỉ entityId (không at) → viTri vẫn có, select được
  ok  - không at không entityId → viTri = undefined (không bịa)
  ok  - luật cấp bản vẽ: KHÔNG bịa entityId

KẾT QUẢ: 27 pass · 0 fail
```

**`npm run soi:tu-dien`**
```
SOI TỪ ĐIỂN — chống lệch định nghĩa 2026-08-16
────────────────────────────────────────────────────────────────────────────────
────────────────────────────────────────────────────────────────────────────────
✅ 0 lệch định nghĩa
```

**`npm run soi:hinh-hoc`**
```
SOI HÌNH HỌC BO GÓC — 2026-08-16 (báo cáo)
Thang cho phép (DUYỆT 12/08 — --r-1..4 + vi mô ≤4): 0 / 1 / 2 / 3 / 4 / 6 / 10 / 14 / 20 + capsule 999
──────────────────────────────────────────────────────────────────────────────
🔴 GIÁ TRỊ NGOÀI THANG (giá trị → số lần):
       8px  × 3
       5px  × 3
      22px  × 1
      17px  × 1
      28px  × 1
       7px  × 1

🔎 TOP FILE VI PHẠM:
      4  components/filemanager/files-mock-css.ts
      3  components/filemanager/FilesNavigator.tsx
      2  components/BottomToolbar.tsx
      1  components/avatar/AvatarBuilder.tsx
──────────────────────────────────────────────────────────────────────────────
Đã quét 280 file · 1002 khai báo radius · 10 ngoài thang (6 giá trị lẻ)
```
> Y hệt mốc đầu phiên (10 ngoài thang, cùng 4 file) — **không file nào của phiếu này dính**, và
> tổng khai báo giảm 1007 → 1002 vì `ReviewPanel` bỏ số chết chuyển sang `lib/geometry`.

**`npm run check:mocks`** (ngoài phiếu, tự chạy vì có thêm mock)
```
grep -c "vi-pham-2-che-do"  →  0
```
> 0 dòng = mock mới **không có vi phạm nào** trong 6 luật đỏ của cửa kiểm.

**`npm run soi:frontier`** (ngoài phiếu, chạy để T biết trạng thái)
```
🔴 hien-thi-luat-2-che-do   [TriTueDuAn] HAI CHẾ ĐỘ HIỂN THỊ LUẬT — NGẮN ↔ ĐẦY ĐỦ …
👁 1 qua mắt Hoà · ✅ 66 xong-MÁY (NỢ NGHIỆM THU MẮT) · ⬜ 54 chờ · 🔴 1 LỆCH
```
> **Lệch đỏ này là ĐÚNG DỰ KIẾN, không phải sự cố**: registry còn ghi `trangThai: 'chua'`
> (`scripts/frontier-registry.mjs:298`) trong khi code đã tồn tại — máy bắt đúng chiều "code có mà
> sổ chưa ghi". Theo ô ⑧ **tôi KHÔNG tự flip**; đây chính là tín hiệu để T flip sau audit.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

1. **Chưa mở `ReviewPanel` trên app thật** — luật phiên cấm mở dev server; thư mục lại đang có
   server của phiên khác. Bằng chứng thị giác duy nhất là mock. Đây là điều tôi **chưa kiểm**,
   không phải điều tôi tin là đúng.
2. **Chưa chạy với rule có `nguyenVan` thật.** Đường chính được chứng minh bằng test (chuỗi mẫu
   trong `hien-thi-luat.test.ts`), **chưa chạy trên một điều khoản QCVN thật** — vì ô ③ cấm sửa
   12 bộ luật. Chuỗi `văn bản gốc → registry → UI` mới chỉ chứng minh nửa sau.
3. ~~Chưa kiểm `aliasByOldId`~~ → **ĐÃ KIỂM, KHÔNG PHẢI LỖ.** Tôi nghi `luatCad` tra rule bằng
   `v.ruleId` thẳng sẽ trượt khi rule đã bị thay phiên bản (id nghiệp vụ ≠ id phiên bản). Đọc
   `checker.ts:250` — `mkViolation` gán `ruleId: r.id` với `r` **lấy từ `resolved.rules`**, tức
   id của bản ĐANG HIỆU LỰC, không phải id nghiệp vụ; bảng alias chỉ dùng bên trong `byId()`
   (`:270-275`) để TRA, không lọt ra `Violation`. Mà `resolved.rules ⊆ rules` — cùng danh sách
   tôi dựng Map — nên **lookup luôn trúng**. Ghi lại vì đây là chỗ dễ nghi sai.
   ⚠️ Phần **thật sự** không có metadata: `luat3d` (hình học thuần) và `luatDeck` — hai bộ đó
   không sinh từ `StandardRule` nên không có `loaiNguon`/`nguyenVan`, và **đúng là không nên có**.
   Thẻ của chúng sẽ luôn hiện "Chưa phân loại nguồn" + "chưa có nguyên văn" — trung thực, nhưng
   T nên biết trước để không tưởng là bug.
4. **Không đo pixel-diff 1440×900 mock ↔ code.** Đã xem mock ở 1440×900 cả 2 theme và đọc code,
   nhưng không chụp panel thật nên **không có số lệch** để đối chiếu luật ④.
5. **Số contrast là tính từ token, không đo từ pixel render.** Công thức WCAG trên cặp hex; đúng
   với nền phẳng đặc (`--card`/`--field` đều đặc), sẽ không đúng nếu sau này panel đặt trên kính.
6. **Không kiểm bằng trình đọc màn hình thật.** `aria-label`/`aria-pressed` viết theo chuẩn,
   chưa nghe VoiceOver đọc.

---

## ⑦c HẠN DÙNG KẾT LUẬN

- Kết luận **"ba rào an toàn được khoá"** hết đúng khi: có đường thứ hai dựng thẻ luật không đi
  qua `dungTheLuat` (vd panel Kiểm chuẩn cũ tự vẽ), hoặc khi có tính năng cho AI **ghi** vào
  `StandardRule` (nay chưa có đường nào).
- Kết luận **"hai trục độc lập"** hết đúng nếu ai đó thêm hàm suy `loaiNguon` từ `severity`/
  `binding`/chuỗi `source` — tiện tay mà phá đúng B3.
- Kết luận **"soi:hinh-hoc giữ nguyên mốc"** hết đúng khi thang bo được siết lại (script tự khai
  đang ở chế độ BÁO CÁO, `--strict` chưa bật).
- Số **contrast** hết đúng khi `app/globals.css` đổi giá trị token — đo lại, đừng chép số này.
- Kết luận **"DesignSync không dùng được"** chỉ đúng cho **phiên này**; T nối lại MCP là hết hạn.
- Toàn bộ số dòng file:dòng trong báo cáo tính theo `4206851`.

---

## ⑧ DÂY MÁY

Entry `hien-thi-luat-2-che-do` (`scripts/frontier-registry.mjs:298`) — **giữ nguyên `chua`**,
không tự flip theo ô ⑧. Bằng chứng cho T đối chiếu khi flip: `lib/review/hien-thi-luat.ts` ·
`lib/review/hien-thi-luat.test.ts` · `lib/cad/standards/types.ts` · marker `cheDoHienThi`
`loaiNguon` `nguyenVan` (grep = 0 trước phiên, nay có).

## Vùng file đã đụng (ô ③)

| File | Trạng thái |
|---|---|
| `lib/cad/standards/types.ts` | **mới** |
| `lib/cad/standards/registry.ts` | +6 dòng (import + `extends RuleSourceMeta` + re-export) — **không đổi trường cũ** |
| `lib/review/types.ts` | +3 trường optional vào `FindingLuat` |
| `lib/review/hien-thi-luat.ts` | **mới** |
| `lib/review/hien-thi-luat.test.ts` | **mới** |
| `lib/review/luat/cad.ts` | `violationToFinding` nhận thêm tham số **optional** |
| `lib/review/index.ts` | re-export |
| `components/review/ReviewPanel.tsx` | viết lại phần hiển thị |
| `docs/mocks/mock-the-vi-pham-2-che-do.html` | **mới** |

⛔ **Không đụng**: `components/settings/` (P-A) · `lib/commands/` + toolbar (P-C) · `prisma/` ·
nội dung 12 bộ luật ngành · `checker.ts` · `scripts/frontier-registry.mjs`.
⛔ **Không chạy lệnh git nào. Không mở dev server nào.**

> ⚙️ Ghi nhận kỹ thuật: worktree không có `node_modules` (0 gói) nên mọi lệnh nghiệm thu đều
> không chạy được. Đã tạo **symlink** `node_modules` → repo chính (đã gitignore, `.gitignore:1`)
> thay vì `npm install` lại 1 bản. Không sửa gì trong repo chính.
