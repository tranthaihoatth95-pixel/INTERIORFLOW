# BÁO CÁO P-S2 — VÁ VÀ NỚI `soi-that.mjs`

> Phiên phụ P-S2 · 17/08 · mốc `e57e2f6` · vùng: `scripts/soi-that.mjs` + `package.json` + tệp này.
> Mã điều khoản dưới đây **mở `docs/TRIET-LY-IF.md` đọc số**, không chép theo phiếu:
> **[T2]** `:18` *ĐỒNG BỘ — MỘT CỖ MÁY, NHIỀU MẶT TIỀN* · **[Đ2]** `:72` *NHÌN VÀO TRONG TRƯỚC*
> · **[T0]** `:10` *SỰ THẬT LÀ CHÂN LÝ* · **[T6]** `:37` *ĐO ĐƯỢC MỚI TIN*.

---

## 1 · TỔNG QUAN

Máy đối chiếu văn-bản ↔ code của IF **đã có từ 08/08 nhưng hỏng câm suốt 9 ngày**: nó quét nhầm
cây (bản sao worktree) và không có lối chạy trong `package.json`. Đã vá cả hai, rồi nới từ **một
chiều / 68 tệp `SPEC-*`** lên **ba chiều / 503 tệp văn bản sống**.

Kết quả đo được: **27/27 dòng ✅ của bản cũ đều trỏ vào `.claude/worktrees/`, 0 dòng trỏ vào cây
chính** — máy vẫn in xanh, chỉ là xanh về một cây khác. Bài tự kiểm ⑥b đạt: máy bắt đúng
`.idfnotes` và `KB-5`, **0 nhiễu**. Phát hiện ngoài phạm vi: **`check-chot.mjs` mắc y hệt lỗi cây
sai và nó đang chạy bên trong `npm test`** — 60% số tệp nó đọc là bản sao.

---

## 2 · CHI TIẾT

### ⓪b tiền đề hạ tầng — PASS
```
$ git log --oneline -1
e57e2f6 docs(memory): lệnh mở phiên bản 17/08 — 6 luật đắt nhất + hàng đợi đã chốt
$ git rev-list --count HEAD..main
0
```

### ⓪ tiền đề nghiệp vụ — **XÁC NHẬN**, và nặng hơn phiếu mô tả

| Vế của tiền đề | Kiểm | Bằng chứng |
|---|---|---|
| Máy đối chiếu văn bản ↔ code ĐÃ CÓ | ✅ | `scripts/soi-that.mjs:3` tự khai; `:15` *"Sổ là ảnh chụp cũ. Spec là hợp đồng. Code là sự thật."* |
| `BO_QUA` loại nhầm đường worktree | ✅ | `:45` chỉ có chuỗi `.worktrees`; đường thật `.claude/worktrees/` không tên nào khớp |
| Không có mặt trong `package.json` | ✅ | `grep -c 'soi:that' package.json` = **0** |
| ⇒ việc đúng là VÁ + NỐI + NỚI, không dựng máy thứ hai | ✅ | [Đ2] · [T2] |

🔴 **Phiếu còn nói nhẹ hơn thực tế.** Phiếu viết *"phần lớn tệp nó quét là bản sao cũ"*. Đo thật:
vì `.claude` xếp trước `app/`·`components/`·`lib/` theo thứ tự đọc thư mục, **bản sao luôn được
tìm thấy TRƯỚC** ⇒ không phải "phần lớn" mà là **100%**: `grep -c worktrees` trên kết quả = **27**,
đúng bằng tổng số dòng ✅. Không một dòng nào trỏ vào cây chính.

### NHỊP 1 — VÁ

**TRƯỚC** (nguyên văn, `node scripts/soi-that.mjs`):
```
Đối chiếu 68 spec ↔ 3436 tệp mã nguồn
...
✅ spec nói có · code CÓ THẬT & đã dùng : 27
🟡 code CÓ nhưng 0 NƠI GỌI             : 0   ← đây là "kho chưa mở cửa"
❌ spec nói có · code KHÔNG THẤY       : 5   ← phải người kiểm
⚠️ 52 spec KHÔNG rút được định danh (viết bằng văn xuôi) — PHẢI ĐỌC TAY
```
Mẫu dòng ✅ của bản cũ — chú ý đường dẫn:
```
✅ fixedScaleViewport   .claude/worktrees/agent-a314eec0ea9c06a7e/lib/cad/model.ts:1141   8 nơi gọi
✅ BLOCK_MAP            .claude/worktrees/agent-a314eec0ea9c06a7e/lib/cad/furniture.ts:643 108 nơi gọi
```

**SAU nhịp 1** (`npm run soi:that`):
```
Đối chiếu 68 spec ↔ 881 tệp mã nguồn
✅ 27 · 🟡 0 · ❌ 5      ← số y hệt, nhưng nay MỌI file:dòng trỏ vào cây chính
$ grep -c worktrees <kết quả>   → 0
```
⇒ **3.436 → 881 tệp**. Con số tổng không đổi là điểm đáng sợ nhất của ca này: nếu chỉ nhìn bảng
tổng thì không ai phát hiện được gì. Chỉ `file:dòng` mới lộ ra.

Vá **theo hình dạng, không theo chuỗi** (`laDuongWorktree = (ten) => ten.includes('worktrees')`)
để đổi chỗ đặt worktree về sau vẫn không thủng — đúng bài học `package.json` 16/08.

### ④.4 — 5 dòng ❌ cũ: **ẢO 5/5**, nhưng chia hai loại rất khác nhau

| # | Tên | Thật/Ảo | Vì sao |
|---|---|---|---|
| 1 | `NEXT_PUBLIC_` | **ẢO — máy đọc NGƯỢC Ý** | Là TIỀN TỐ env, không phải định danh. Và câu spec là câu **phủ định**: *"token chỉ ở server (`LARK_*` không `NEXT_PUBLIC_`)"* — spec khẳng định thứ này **KHÔNG ĐƯỢC** có, máy đọc thành "spec nói có". Code vẫn dùng `NEXT_PUBLIC_*` có hậu tố ở **11 chỗ**. |
| 2 | `MATERIAL_ID` | **ẢO — tên KIỂU Ô** | `SPEC-DUNG-3D-THONG-NHAT.md:353` tự khai đây là *"định dạng số/đơn vị/widget"* của ô bảng thông số, cùng họ `AREA_M2`·`FACTOR`. Định danh THẬT nằm ngay cạnh: `matId`, `MaterialSphere`. |
| 3 | `MONEY_VND` | **ẢO — tên KIỂU Ô** | y hệt #2; định danh thật cạnh nó là `lib/boq/compute.ts`. |
| 4 | `ENUM` | **ẢO — từ chung** | từ của ngôn ngữ, spec dùng để tả kiểu ô. |
| 5 | `inferElementType` | **ẢO, nhưng ĐÁNG GIÁ NHẤT** | Code **CÓ THẬT**, tên là **`inferElementTypes`** (số nhiều) — `lib/cad/element-infer.ts:138`, 10 chỗ dùng. **SPEC viết thiếu chữ `s`.** Máy làm đúng việc của nó; docstring đã dự đoán đúng ca này: *"hoặc đã xoá, hoặc ĐỔI TÊN → phải người kiểm"*. |

⇒ 4 ca đầu chung MỘT gốc: bộ rút định danh coi mọi chữ HOA trong nháy ngược là định danh, trong
khi văn bản IF dùng chữ HOA cho **tên kiểu ô**. Đã đưa vào `THA` kèm lý do đọc được, không nới
điều kiện. Ca #5 là **việc thật cho người**: sửa 3 tệp spec đang viết sai tên hàm
(`SPEC-DUNG-3D-THONG-NHAT` · `SPEC-TANG-DU-LIEU-CAU-KIEN` · `SPEC-VE-REVIT-MODE`).

### NHỊP 2 — NỚI

**① Nguồn văn bản: 68 → 503 tệp.** Quét `docs/` **đệ quy** (không chốt cứng ba thư mục — cùng lý
do với cách vá worktree: danh sách cứng thì mốc). Loại trừ tường minh + lý do ngay trong mã, theo
khuôn `soi-tu-dien.mjs MD_LOAI_TRU`:

| Loại trừ | Lý do |
|---|---|
| `docs/memory/` | ký ức đã nén — BẢN GHI của quá khứ, không điều khiển việc nào |
| `docs/bao-cao-phien/` | báo cáo đã nộp — sửa là sửa lời khai của phiên đã đóng |
| `docs/00-CHOT.md` | sổ append-only — sửa dòng cũ là viết lại quyết định của Hoà |
| `docs/archive/` | tự khai là kho lưu — văn bản nghỉ hưu |
| `CHANGELOG.md` | nhật ký append-only |

**② Chiều CÂM** (mới) — *code có, bản đồ không biết*. **Đơn vị là THƯ MỤC, không phải tệp**, cố ý:
xét từng tệp thì hàng trăm tệp phụ chưa bao giờ đáng lên bản đồ cũng kêu, mà máy soi kêu nhiều là
máy soi chết. Kết quả **2 mảng**, nhiễu bằng 0:
```
🔇 app/tasks         1 tệp ·  0 tên xuất · 0 lần được nhắc
🔇 lib/smartselect   1 tệp ·  1 tên xuất · 0 lần được nhắc   (useSmartSelectStore)
```

**③ Chiều MA** (mới) — *sổ nhắc nhiều, code 0*. Cửa vào phải KHÁC chiều ①: con ma nguy hiểm ở chỗ
được nhắc **như thể có thật**, nó gần như không bao giờ đứng cạnh dấu ✅. Phép thử: *tên lan ≥2 tệp
văn bản sống, code 0 chỗ*.
```
👻 .idfnotes    5 tệp sổ · 0 code   (IF-KIEN-TRUC · PHU-OUT · PHUONG-AN-CAU-IDF …)
👻 KB-5         4 tệp sổ · 0 code   (IF-KIEN-TRUC · nc/NC-SOI-3-CHANG …)
```
**Đúng 2, không thừa một dòng nào** ⇒ bài tự kiểm ⑥b ĐẠT.

**④ `THA` — 7 tên + 1 họ, mỗi dòng một lý do đọc được**, gồm `master tool` (khai tử 16/08, 4 chỗ
còn lại trong code là docstring chống-ma cố ý giữ) và họ mã văn bản `NC-\d`/`NT-\d`… (kho `docs/nc/`
là VĂN BẢN, "0 code" không nói lên điều gì) — **có ngoại lệ cứng: `KB-5` KHÔNG được tha**, vì nó là
ca ma thật và là bài tự kiểm của chính máy này.

### 🔴 Hai lỗi của tôi, bắt trong lúc làm

1. **Bẫy tự tham chiếu.** Vòng 3 chạy xong vẫn không bắt được `.idfnotes`/`KB-5`. Nguyên nhân: máy
   quét `scripts/`, tức **quét chính nó**; docstring tôi vừa viết nêu đích danh hai cái tên đó làm
   ví dụ ⇒ `coTrongMa()` tìm thấy chúng trong chính tệp máy soi ⇒ kết luận *"code có"* ⇒ hai con ma
   thật lọt lưới **mà bảng tổng vẫn xanh**. Đúng dạng hỏng phiếu này sinh ra để diệt. Đã loại tệp
   máy soi khỏi cây bằng chứng, kèm lý do: *máy NÓI VỀ căn bệnh không phải là căn bệnh*.
2. **Tôi viết quá lời.** Docstring bản đầu ghi *"7/7 script `soi-*` đều mắc y hệt"* — **SAI**. 7 tệp
   có cùng chuỗi thiếu sót, nhưng chỉ tệp **đi từ gốc repo** mới thật sự dính. Đã đo lại và sửa
   docstring (bảng ở mục 4 dưới). [T0].

---

## 3 · TỔNG KẾT

Không có bệnh mới nào ở đây. Chỉ có **một cái máy đúng, bị hỏng bằng hai lỗi tầm thường**, và cả
hai lỗi đều thuộc loại *không làm chương trình chết, chỉ làm nó trả lời sai câu mình đang hỏi*.

Ba con số nói hết:
* **9 ngày** máy nằm im vì thiếu một dòng trong `package.json`.
* **27/27** dòng xanh trỏ vào cây sai — bảng tổng không hề thay đổi khi vá, nên **không cách nào
  phát hiện bằng cách nhìn bảng tổng**.
* **6.043/10.097** — cùng lỗi đó, còn sống, trong `check-chot.mjs`, bên trong `npm test`.

Bài học rút được, đắt hơn cả bản vá: **"chạy được" và "trả lời đúng câu mình hỏi" là hai chuyện.**
Cả `npm test` lẫn `soi-that` đều "chạy được" suốt 9 ngày qua trong khi đọc nhầm 60–100% dữ liệu.
Máy soi cũng cần được soi — và thứ soi nó không phải là exit code, mà là **`file:dòng` nó in ra có
trỏ vào đúng chỗ không**.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:**
* Vá theo **hình dạng** chứ không theo chuỗi ⇒ đổi chỗ đặt worktree về sau không thủng lại.
* Ba chiều mà **tổng nhiễu = 0** (2 ma đúng, 2 mảng câm đúng) — máy soi kêu bậy là máy soi chết.
* Không đẻ script mới ⇒ [T2] *một cỗ máy nhiều mặt tiền*, [Đ2] *nhìn vào trong trước*.
* Nhanh: **2,2 giây** cho 503 văn bản × 881 tệp mã (nhờ tách dòng một lần lúc nạp).

**Chưa được / rủi ro:**
* **Máy MÙ 399/503 tệp** (79%) — văn bản viết bằng văn xuôi không nêu định danh. Con số này in ra
  ở cuối bảng, cố ý: nó là phần **phải đọc tay**, không được che.
* Chiều ② và ③ dựa trên **so chuỗi**, không phải phân tích cú pháp ⇒ tên ghép động
  (`` `lib/${x}.ts` ``) thì mù.
* **16 dòng ❌** của bản mới chưa soi hết từng dòng (phiếu chỉ yêu cầu soi 5 dòng cũ). Đọc lướt thì
  phần lớn là **từ vựng chuẩn IFC** (`FLOORING`·`CLADDING`·`MOLDING`·`SKIRTINGBOARD`·`NOTDEFINED`
  ánh xạ `IfcCoveringTypeEnum`) và **thứ chưa dựng** (`PROJECT_STATUS` — mục 1.4.2 của ArchiNote,
  đúng là chưa có). Cần một lượt người đọc.
* **Ngưỡng `MA_TOI_THIEU = 2`** là con số tôi tự chọn cho đủ tách nhiễu, **không có căn cứ ngoài
  quan sát trên bộ dữ liệu hôm nay**. Khai thẳng để phiên sau bác được.

### 🔴 Phát hiện NGOÀI PHẠM VI — cần phiếu riêng

`scripts/check-chot.mjs` mắc **đúng cùng một lỗi**: `walk(ROOT)` từ gốc repo, `SKIP_DIR` cũng chỉ
có `.worktrees`. Đo bằng cách chạy lại chính vòng lặp của nó:
```
check-chot walk(ROOT) — tổng tệp: 10097 · trong đó nằm trong worktrees: 6043   (60%)
```
Nó **chạy trong `npm test`** ⇒ mọi khẳng định *"check-chot pass"* trong 9 ngày qua đều được đưa ra
trên một cây 60% là bản sao. Sửa một dòng là xong, nhưng **ngoài vùng ghi của phiếu này** — tôi
không đụng. Năm máy còn lại (`soi-frontier`·`soi-thao-tac`·`soi-contract`·`soi-hinh-hoc`·
`soi-tu-dien`) **KHÔNG dính** vì chúng chỉ đi vào thư mục khai sẵn, không đi từ gốc.

---

## 5 · HƯỚNG XỬ LÝ — nhiều góc

**Hướng A — dừng ở đây, `soi:that` để chế độ báo không chặn.**
*Được:* rẻ, không cản ai; ba chiều mới đều cần người phán nên chặn là sai.
*Mất:* không ai bắt buộc chạy ⇒ có thể ngủ tiếp lần hai, đúng cách nó vừa ngủ 9 ngày.

**Hướng B — nhét `soi:that` vào `npm test` cho chạy tự động.**
*Được:* không quên được nữa.
*Mất:* **hỏng đúng cái vừa sửa.** 16 ❌ + 2 👻 + 2 🔇 hiện chưa sửa được ngay; chặn build bằng thứ
người ta không sửa nổi là cách nhanh nhất dạy người ta bỏ qua màu đỏ — cùng lý do `soi-tu-dien` để
🟡 không chặn.

**Hướng C — vá `check-chot.mjs` luôn cho trọn bệnh.**
*Được:* đóng nốt ca đang sống trong `npm test`, một dòng.
*Mất:* **ngoài vùng phiếu**, và `check-chot` chạy trong `npm test` nên sửa sai là cả repo đỏ. Phải
có phiếu riêng, có người chạy lại `npm test` trước/sau.

**Hướng D — siết dần theo họ**, như `soi-tu-dien` đang làm với từ `kính`: mỗi lần một họ được dọn
sạch thì bật chặn cho riêng họ đó.

## 6 · ĐỀ XUẤT

**Chọn A ngay bây giờ + C mở phiếu riêng ngay lượt sau + D làm đường dài.**

Lý do chọn A thay vì B: máy này vừa được sửa xong, **các con số của nó chưa ai soi hết** (16 ❌ mới
chưa qua mắt người). Biến một máy chưa được kiểm định thành cửa chặn build là đặt cược vào chính
thứ mình vừa chứng minh là có thể sai âm thầm. Đường vào đúng của nó là **`soi:that` chạy đầu phiên
cùng `soi:frontier`** — đó là chỗ nó đã được thiết kế để đứng (`:3` *"Chạy TRƯỚC khi soạn bất kỳ
phiếu nào"*), và là chỗ nó có ích nhất: **trước khi soạn phiếu**, không phải sau khi viết code.

Lý do C phải là **lượt sau chứ không phải lượt này**: nó nằm ngoài vùng khoá, và `check-chot` chạy
trong `npm test` — đụng vào mà sai thì cả ba phiên đang chạy song song cùng đỏ. Đúng một dòng sửa,
nhưng phải có phiếu và có người đo lại.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

**Đóng câu P-S để ngỏ — LIỆT KÊ ĐỦ các máy kiểm đang có** (đọc docstring từng tệp trong `scripts/`,
không suy đoán):

| Máy | Canh **cái gì ↔ cái gì** | Lối chạy |
|---|---|---|
| `check-chot.mjs` | quyết định **ĐÃ CHỐT** ↔ code thi công | `npm run check:chot` **+ trong `npm test`** |
| `check-mocks.mjs` | mock HTML `docs/mocks/` ↔ luật mock (2 theme · token · lucide) | `npm run check:mocks` |
| `soi-frontier.mjs` | sổ `frontier-registry.mjs` ↔ code (**2 chiều**) + nợ nghiệm thu mắt | `npm run soi:frontier` |
| `soi-hinh-hoc.mjs` | `border-radius` trong `components/` ↔ thang bo token | `npm run soi:hinh-hoc` |
| `soi-tu-dien.mjs` | nhãn/tên đang dùng ↔ từ điển chuẩn (**2 lớp**: 🔴 chặn · 🟡 cảnh báo) | `npm run soi:tu-dien` |
| `soi-thao-tac.mjs` | sổ `thao-tac-registry.mjs` ↔ code (**2 chiều**) | `npm run soi:thao-tac` |
| `soi-contract.mjs` | sổ `contract-registry.mjs` (FeatureContract) ↔ code | `npm run soi:contract` |
| **`soi-that.mjs`** | **VĂN BẢN ↔ code, 3 chiều** (nói-có-mà-không · câm · ma) | `npm run soi:that` ← **MỚI NỐI 17/08** |
| `release-preflight.mjs` | kiểm tĩnh tối thiểu trước khi tạo bộ cài | `npm run release:preflight` |
| `license:check` | giấy phép gói npm ↔ danh sách cho phép | trong `npm test` |
| `npm test` | mọi `*.test.ts` | `npm test` |
| `soi-app.py` | sinh `docs/SOI-APP.html` từ repo/DB thật (màn soi, không chặn) | 🔴 **KHÔNG có lối npm** |
| `don-trung-unicode.mjs` | tệp bị git theo dõi 2 lần dưới 2 cách viết tên | công cụ một lần, không lối |
| `sinh-ship-map.mjs` | *sinh* `ship-map.html` từ registry — **không phải máy kiểm** | `npm run ship:map` |
| `backup-offsite.mjs` | sao lưu — **không phải máy kiểm** | `npm run backup:offsite` |
| `frontier-registry` · `contract-registry` · `thao-tac-registry` | **DỮ LIỆU**, không phải máy | máy tương ứng đọc |

🔴 **CÒN HAI THỨ BỊ BỎ QUÊN Y NHƯ `soi-that`:**
1. **`scripts/soi-app.py`** — không có lối `npm`, phải nhớ gõ `python3 scripts/soi-app.py`. Chưa
   kiểm xem nó còn chạy được không (tôi **không chạy** — nó đọc DB, ngoài phạm vi phiếu).
2. **`tsc` KHÔNG có lối npm và KHÔNG nằm trong `npm test`.** `grep -n 'tsc\|typecheck' package.json`
   = **rỗng**. Đây là cửa được trích dẫn nhiều nhất trong toàn bộ sổ (*"tsc 0"* xuất hiện ở gần như
   mọi báo cáo) mà lại là cửa **duy nhất không có đường đi**. Tôi chạy tay `npx tsc --noEmit -p
   tsconfig.json` → **exit 0**.

**Chưa chắc / chưa kiểm khác:**
* **Không chạy app thật một dòng nào** (phiếu cấm dev server). Mọi kết luận là đọc mã + chạy script.
* **16 ❌ mới chưa soi từng dòng** — chỉ đọc lướt và phân loại thô ở mục 4. Phiếu chỉ yêu cầu soi 5
  dòng cũ; tôi làm đúng phần được giao và khai phần chưa làm.
* **`MA_TOI_THIEU = 2`** và ba mẫu rút khái niệm (`đuôi tệp` · `mã khuôn` · `cụm 2 chữ`) là **tôi tự
  cân** cho vừa bắt được ca thật vừa không kêu bậy. Chưa ai kiểm chúng có bỏ sót ma nào khác không —
  **con số 2 con ma là SÀN, không phải TRẦN**.
* Chiều CÂM chỉ xét `lib/` · `components/` · `app/` ở **độ sâu 2**; `scripts/`·`prisma/`·`electron/`
  không xét. Thư mục sâu hơn (`lib/materials/warehouse/`) gộp vào cha.
* **Đóng góp của tôi vào `soi:tu-dien` = 0, đo được**: lớp đa nghĩa chỉ quét `docs/phieu-giao`
  (`TU_DA_NGHIA[].pham_vi`), **không quét `scripts/`** ⇒ mọi chữ tôi viết trong `soi-that.mjs` không
  vào con số 260. Phần tăng 212 → 260 đến từ các tệp `.md` mới trong `docs/phieu-giao/` — gồm **chính
  phiếu P-S2**. 4 lệch 🔴 còn lại nằm ở `components/` + `docs/mocks/`, hai chỗ tôi không đụng.
* Chưa thử trên Windows/Linux — `laDuongWorktree` so chuỗi nên độc lập hệ điều hành, nhưng chưa chạy.

---

## ⑦c · HẠN DÙNG KẾT LUẬN

Kết luận trong báo cáo này **hết đúng khi** một trong các điều sau xảy ra:

1. **`check-chot.mjs` được vá** ⇒ con số `6.043/10.097` và mục "phát hiện ngoài phạm vi" hết hiệu lực.
2. **Có ai đổi chỗ đặt worktree sang đường không chứa chữ `worktrees`** ⇒ bản vá thủng lại, và
   `laDuongWorktree` phải viết lại (khả năng thấp, nhưng đó đúng là cách bug này sinh ra lần đầu).
3. **`docs/` được tổ chức lại** (thêm thư mục nhật ký mới, đổi tên `docs/archive/`) ⇒ `VB_LOAI_TRU`
   mốc, máy sẽ báo đỏ vào nhật ký — đúng cách nhanh nhất giết một máy soi.
4. **`.idfnotes` hoặc `KB-5` được DỰNG hoặc KHAI TỬ** ⇒ bài tự kiểm ⑥b mất đối tượng, phải chọn ca
   ma khác làm bài kiểm, **nếu không thì máy này mất luôn cơ chế tự chứng minh là còn sống**.
5. **Số `👻 2` hoặc `🔇 2` đứng yên qua nhiều phiên** ⇒ giống hệt cảnh báo của `soi-tu-dien`: *số
   đứng yên là máy soi đã chết mà chưa ai tuyên bố.*
6. **Bộ rút định danh được nới thêm mẫu** ⇒ mọi con số ✅/🟡/❌ trong báo cáo này phải đo lại từ đầu;
   chúng là hàm của bộ mẫu, không phải hằng số của repo.
