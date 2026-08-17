# W — `soi:cam-dien`: máy canh "engine đã tới tay người dùng chưa"

> Phiên phụ W · 17/08 · phiếu `docs/phieu-giao/W-soi-cam-dien.md` · cây chính, mốc `804f17a`.
> Vùng ghi đã dùng đúng: `scripts/soi-cam-dien.mjs` (tạo) · `package.json` (+1 dòng) · báo cáo này.
> **Không** đụng `lib/` `components/` `app/`, không đụng máy soi khác, không sửa `frontier-registry`.

---

## 1 · TỔNG QUAN

Dựng `scripts/soi-cam-dien.mjs` — máy soi thứ 7, **do CODE dẫn đường**: quét `lib/`, dựng đồ thị
import có giải đường dẫn thật, rồi hỏi ngược lên `app/`+`components/`. Kết quả: **85 sống · 7 chỉ
nội bộ · 3 kho chưa mở (3.709 dòng)** ở cấp module, **20 tệp mồ côi (2.553 dòng)** ở cấp tệp, và
**4 entry frontier khai ✅ mà mọi bằng chứng nằm trong kho chưa mở**.

**4/4 ca nghiệm thu ngược đúng.** Tiền đề ⓪ **XÁC NHẬN phần lõi, BÁC một chi tiết**: anh em gần
nhất không phải `soi-that.mjs` như phiếu viết, mà là `soi-contract.mjs`.

---

## 2 · CHI TIẾT TỪNG MỤC

### ⓪b Tiền đề hạ tầng — PASS
```
$ git log --oneline -1
804f17a docs(nc): bàn giao nghiên cứu phiên 16/08 — nguồn tra, phép đo, cơ chế, lỗi, bài học
$ git rev-list --count HEAD..main
0
```
Nhánh `main`, lệch **0**. Các tệp đang sửa trong `git status` thuộc V1/V2, không giao với vùng W.

### ⓪ Tiền đề nghiệp vụ — **XÁC NHẬN LÕI · BÁC MỘT CHI TIẾT**

Đã đọc mã cả 6 máy trước khi kết luận, và **kiểm bằng thực nghiệm chứ không bằng lập luận**.

**🔴 Chi tiết BÁC — phiếu chỉ sai hàng xóm.** Phiếu viết *"`soi:that` gần nhất"*. Sai:
`soi-contract.mjs` mới là máy gần nhất — nó **đã đếm caller thật** (`demDay()` :50, loại trừ module
lõi + test + `loaiTru`), **đã tách `dirs`**, và **đã có sẵn nhãn `🟡 KHO CHỜ DÂY`** (:96) đúng
nghĩa "kho chưa mở". Nếu chỉ đọc `soi-that` mà bỏ qua `soi-contract` thì rất dễ dựng trùng.

**Nhưng cả hai đều KHÔNG trả lời được câu hỏi**, vì cùng một lý do gốc: **chúng do SỔ dẫn đường,
còn câu hỏi này do CODE dẫn đường.**

| Máy | Cách hoạt động | Vì sao không trả lời được |
|---|---|---|
| `soi-contract` | lặp **22 entry** người ta nhớ mà khai | Đo: trong 8 kho chết đã biết, registry phủ **đúng 1** (`lighting/lux`). Kho nguy hiểm nhất là kho **không ai nhớ để khai** |
| `soi-that` | lặp **văn bản**, rút định danh cạnh dấu ✅ | Chạy thật: 🟡 ra **10 dòng**, **không dòng nào là `lib/idfc-import`** — kho lớn nhất repo lọt lưới. Tự khai mù **407/512** tệp văn bản |
| `soi-frontier` · `soi-thao-tac` · `soi-hinh-hoc` · `soi-tu-dien` | registry / thang bo góc / từ điển | không có khái niệm "nơi gọi" |

Bằng chứng độ phủ `contract-registry` (8 ca đã biết):
```
idfc-import 0 · thao-tac-glyph 0 · slide-templates 0 · web-lookup 0
lighting/lux 2 · wallpaper/contrast 0 · pdf-font 0 · dwg-worker 0
```

**⇒ Máy mới là đúng, KHÔNG phải mở rộng máy cũ.** Muốn `soi-contract` phủ 94 module thì phải viết
tay 94 entry — đúng phần việc mà máy sinh ra để thay. Nhưng **giữ chung từ vựng** (*caller* ·
*kho chưa mở*) để không thành hai bản của cùng một thứ [T2]; đã ghi lý do ngay trong docstring.

### ④.4 · BỐN CA NGHIỆM THU NGƯỢC — **4/4 ĐÚNG** (nguyên văn)

```
════════ CA 1 — lib/idfc-import PHẢI ra KHO CHƯA MỞ ════════
🔴 KHO CHƯA MỞ — 3 module · xây xong mà chưa ai chạm được — đây là loại công cốc đắt nhất
  🔴 lib/idfc-import         3344 dòng · ui= 0 lib= 0 phụ= 0 test= 0 tự-kiểm= 4

════════ CA 2 — lib/pdf-font.ts PHẢI ra CHỈ NỘI BỘ (không báo oan là chết) ════════
  🔵 lib/pdf-font.ts            244 dòng · ui= 0 lib= 2 phụ= 0 test= 1 tự-kiểm= 1
trong bảng mồ côi cấp tệp? → 0 (phải = 0)

════════ CA 3 — cad/dwg-worker.ts KHÔNG được báo là chết ════════
mồ côi cấp tệp  → 0 (phải = 0)
mồ côi dxf-worker → 0 (phải = 0)
  🟢 lib/cad                            26717 dòng · ui=67 lib=42 phụ= 7 test=26 tự-kiểm=88

════════ CA 4 — lib/store.ts PHẢI ra SỐNG ════════
  🟢 lib/store.ts                        1258 dòng · ui=88 lib=14 phụ= 0 test= 2 tự-kiểm= 0
```

**CA 3 được chứng minh là pass THẬT, không pass rỗng.** Ở cấp module `lib/cad` hiển nhiên SỐNG nên
bài kiểm sẽ rỗng — vì vậy máy có thêm **bảng mồ côi cấp TỆP**, và ca này chấm ở đó. Đầu dò độc lập
truy ra ai với tới worker và bằng cú pháp gì:
```
══ AI VỚI TỚI lib/cad/dwg-worker.ts ══
  mẫu 5  lib/cad/dwg-map.ts:200  🔴 TRONG COMMENT  /** Đẻ worker đọc DWG (thật: `new Worker(new URL(…
  mẫu 5  lib/cad/dwg.ts:111      ✅ MÃ THẬT        spawn: () => new Worker(new URL('./dwg-worker.ts', …
══ AI VỚI TỚI lib/cad/dxf-worker.ts ══
  mẫu 5  lib/cad/dxf-open.ts:40  ✅ MÃ THẬT        spawn: () => new Worker(new URL('./dxf-worker.ts', …
```
Cả hai worker được cứu bởi **mã thật**, đúng mẫu ⑤ dựng ra để cứu chúng.

### Số module theo 3 trạng thái

| Trạng thái | Module | Dòng | Đối chiếu bản đo tay Đ1 |
|---|---|---|---|
| 🟢 SỐNG | **85** | — | Đ1: 84 |
| 🔵 CHỈ NỘI BỘ | **7** | 2.313 | Đ1: 7 · 2.301 |
| 🔴 KHO CHƯA MỞ | **3** | **3.709** | Đ1: 3 · 3.702 |
| tổng module | **95** | | Đ1: 94 |

Khớp bản đo tay trong sai số đếm dòng — **hai phép đo độc lập cùng ra một kết quả**, nên con số
đáng tin hơn hẳn một phép đo đơn.

Ba kho chưa mở: `lib/idfc-import` (3.344 · có 4 tệp tự kiểm) · `lib/slide-templates.ts` (229 ·
**0 test**) · `lib/lighting` (136).

### Entry frontier "✅ nhưng CHƯA CẮM ĐIỆN" — **4**

| id | Bằng chứng nằm ở |
|---|---|
| `chuan-net-3d` | `idfc-import/chuan-net.ts` · `part-lock.ts` · `surface-graph.ts` |
| `wireframe-dinh-bien-dien` | `idfc-import/part-lock.ts` · `surface-graph.ts` |
| `part-lock-cau-kien` | `idfc-import/part-lock.ts` |
| `mirror-doi-xung-chuan-net` | `idfc-import/chuan-net.ts` |

Cả 4 nằm trọn trong `lib/idfc-import`. **Chỉ in, không sửa registry** — flip là việc của người audit.

⚠️ **Con số 4 là SÀN, không phải trần.** `import-ghe-tu-hinh` **không** kêu, dù nó cũng thuộc cụm
đó: `bangChung` của nó là `{dir:'lib', mau:'importFromPhoto|ghe-tu-hinh|imageTo3d'}`, khớp **4 tệp**
trong đó `lib/ai/tiers.ts` và `lib/ai/models.ts` thuộc `lib/ai` (SỐNG) ⇒ trượt điều kiện *"MỌI tệp
khớp"*. Luật của ④.5 là **bảo thủ có chủ ý**: báo thiếu chứ không báo oan.

### Bốn lỗi tự bắt trong lúc dựng (vòng 1→4)

| # | Lỗi | Hại nếu bỏ qua | Cách phát hiện |
|---|---|---|---|
| ① | `lib/*.test.ts` bị tính thành **module ma** | bảng KHO CHƯA MỞ phình **3 → 18 dòng toàn rác** — cách nhanh nhất để người ta bỏ qua máy soi | nhìn kết quả vòng 1 |
| ② | Bảng mồ côi đếm **test là người gọi** | **nuốt mất 3 ca đã biết** (`thao-tac-glyph` · `web-lookup` · `wallpaper/contrast`); 12 tệp/588 dòng thay vì 20/2.553 | đối chiếu với Đ1 §4③ rồi grep truy nguyên |
| ③ | Mẫu import khớp **từ trong chú thích** | một dòng docstring đủ làm tệp chết trông như sống — chiều sai NGUY HIỂM | đầu dò độc lập, không phải suy luận |
| ④ | `new URL('..', import.meta.url)` báo "không giải nổi" ×6 | nhiễu giả — đó là 6 máy soi tự tính `ROOT`, phép tính đường dẫn chứ không phải nạp module | đọc kết quả rồi grep định vị |

Lỗi ② là lỗi đắt nhất: máy **vẫn chạy, vẫn xanh, vẫn ra bảng đẹp** — chỉ là im lặng bỏ sót đúng
thứ nó sinh ra để bắt. Bắt được nhờ **có sẵn 3 ca đã biết đáp án để đối chiếu**.

Lỗi ③ đáng ghi riêng: sau khi vá, **con số tổng KHÔNG đổi** (3/7/20 trước và sau). Tức hôm nay
chưa module nào sống nhờ chú thích — nhưng lỗ đã bịt, và repo này docstring rất dày nên rủi ro là
thật, không phải lo xa.

### ⑥b Cửa nghiệm thu — qua đủ trong **4 vòng** (trần 5)

| Cửa | Kết quả |
|---|---|
| `tsc --noEmit` | **exit 0** |
| `npm test` | **exit 0** |
| `soi:tu-dien` không thêm lệch | **279 ↔ 279** (đo thật: bỏ tệp W ra rồi đo lại). `scripts/` không nằm trong phạm vi quét của máy đó |
| `soi:frontier` | **🔴 0 LỆCH** (👁 1 qua mắt · ✅ 71 xong-máy · ⬜ 55 chờ) |
| 4/4 ca nghiệm thu ngược | **đúng cả 4** |
| `grep -c worktrees` trong kết quả | **0** |

4 dòng 🔴 của `soi:tu-dien` nằm ở `docs/mocks/mock-home-sua-4-loi.html:328,356,388,416` — nợ cũ,
`grep "Trình bày" scripts/soi-cam-dien.mjs` = **0**, không phải của W.

> Ghi chú cách làm: chữ chỉ cây phụ **cố ý không in ra stdout**. Cửa nghiệm thu là `grep -c` chữ đó
> trong kết quả phải = 0; in ra một dòng giải thích là tự tạo báo động giả. Lý do nằm trong mã.

---

## 3 · TỔNG KẾT LẠI VẤN ĐỀ

IF có 6 máy soi và **cả 6 đều do SỔ dẫn đường** — registry, từ điển, thang bo góc, văn bản. Chúng
bắt được thứ ai đó đã nhớ để khai. Thứ **không ai nhớ để khai** thì không máy nào thấy: 3.709 dòng
xây xong, test xanh, 4 entry đánh ✅, và không một KTS nào chạm được — sống im lặng nhiều tuần.

`soi:cam-dien` là máy đầu tiên **do CODE dẫn đường**. Nó không hỏi *"sổ khai gì"* mà hỏi
*"tệp này có ai với tới không"*, nên nó thấy được cả những kho chưa từng vào sổ. Kèm theo, bảng
🟢 SỐNG 85 dòng **kiêm luôn SỔ TRA MÁY SẴN CÓ** (tên + dòng docstring đầu) — gần như miễn phí vì
máy đã phải đọc hết tệp rồi, và đó là thứ diệt loại công cốc *"xây lại cái đã có"* [Đ2].

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:** khớp bản đo tay độc lập ở cả ba trạng thái · vá trọn hai cạm bẫy Đ1 đã trả giá (giải
đường dẫn thật + nạp động) và **chứng minh bằng đầu dò** chứ không tuyên bố suông · tự bắt 4 lỗi
của chính mình · 0 phụ thuộc AI, tất định · `exit 0` nên không chặn ai · bảng mồ côi cấp tệp
**chặt hơn Đ1** (Đ1 xếp 2 worker vào diện mồ côi vì không dò được `new URL`; máy này không).

**Chưa được:**
- **Không chứng minh CÓ NÚT BẤM.** Đây là giới hạn bản chất, đã in mỗi lần chạy. Một engine import
  vào component sống vẫn có thể nằm sau nhánh `if` chết. Muốn biết phải mở app bấm thật — W không
  chạy dev server (phiếu cấm).
- **Chưa xử chuỗi 2 tầng.** Engine → component sống → nhưng component đó chỉ được component mồ côi
  gọi ⇒ vẫn báo SỐNG. Đ1 §5.4 đã nêu; máy này thừa kế nguyên. Ca thật đang tồn tại:
  `components/ui/LightBar.tsx` là component mồ côi.
- **`lib/cad` là một khối 26.717 dòng.** Ranh giới module cấp 1 làm module lớn nuốt mọi thứ bên
  trong; vấn đề trong đó chỉ lộ ở bảng cấp tệp.
- Chưa đối chiếu bảng cấp tệp với `components/` (12 component mồ côi Đ1 nêu) — ngoài phạm vi phiếu.

---

## 5 · HƯỚNG XỬ LÝ NHIỀU GÓC ĐỘ

**Hướng A — nối dây `lib/idfc-import` trước.** Ưu: 3.344 dòng, 90% khối lượng kho chưa mở, kéo
theo 4 entry frontier về đúng sự thật cùng lúc; registry đã tự khai *"CÒN CHỜ PHIẾU SAU: mặt tiền
UI"* nên biết rõ phải làm gì. Nhược: là phiếu UI thật (ProposalSheet + nút trong Thư viện + viewer
GLB), tốn ít nhất một đợt.

**Hướng B — quét sạch phần rẻ trước** (`slide-templates` 229 · `lighting/lux` 136 ·
`wallpaper/contrast` 172 · `thao-tac-glyph` 241). Ưu: bốn món nhỏ, mỗi món một chỗ nối rõ ràng,
đưa số kho chưa mở về gần 0 nhanh. Nhược: không chạm khối lượng thật; `slide-templates` **0 test**
nên nối dây kèm rủi ro cao hơn ba món kia.

**Hướng C — nâng máy lên chuỗi 2 tầng + phủ `components/`.** Ưu: đóng lỗ đo lường lớn nhất còn lại,
bắt được "sống giả". Nhược: đang không có bằng chứng lỗ này đẻ ra kết luận sai nào hôm nay — làm
bây giờ là tối ưu công cụ trong khi 3.709 dòng vẫn nằm im.

---

## 6 · ĐỀ XUẤT HƯỚNG TỐT NHẤT

**Hướng B trước, rồi A.** Không phải vì B quan trọng hơn — mà vì **máy vừa dựng chưa được kiểm
bằng việc thật**. Bốn món của B mỗi món có đúng một chỗ nối, làm xong chạy lại máy phải thấy con số
tụt đúng bằng phần đã nối; đó là bài kiểm rẻ nhất cho chính máy soi trước khi đem nó ra làm căn cứ
cho một đợt lớn. Nối xong B mà số không nhúc nhích thì máy sai, và biết được điều đó bằng giá của
một món 136 dòng rẻ hơn nhiều so với biết sau khi đã đổ cả đợt vào A.

Sau đó A, vì nó là phần khối lượng thật và kéo theo 4 entry frontier.

**C thì hoãn** — đúng luật đã ghi 16/08 (*vấn đề của IF là THỪA quy trình chứ không thiếu*): chưa có
ca thật nào cho thấy chuỗi 2 tầng đẻ ra kết luận sai, nên tối ưu công cụ lúc này là đi sai hướng.

---

## ⑦b CHƯA CHẮC — khai thẳng cái gì đang SUY chứ không ĐO

1. **Con số 3 kho chưa mở là SÀN, không phải trần.** Ba nguồn bỏ sót đã biết: ①ranh giới module cấp
   1 giấu tệp chết bên trong module sống (bảng cấp tệp bù một phần, nhưng chỉ cho `lib/`)
   ②chuỗi 2 tầng chưa quét ③"có đường dây" ≠ "có nút bấm".
2. **Máy còn mù ba dạng nạp**: import **ghép chuỗi** (`import('./' + ten)`) · qua **biến trung
   gian** (`const p='./x'; import(p)`) · **re-export nhiều tầng** thì máy thấy dây nhưng không biết
   tên xuất nào thật sự được dùng. Đã kiểm: sau khi tha đường-thư-mục, mục ❓ **rỗng** — nhưng đó
   chỉ chứng minh *không có spec nào giải không nổi*, **không** chứng minh *không có dạng nào máy
   không nhận ra là spec*. Grep mù thì im lặng, không kêu.
3. **Bộ lọc chú thích là heuristic**: chỉ nhận dòng mở đầu bằng `*` hoặc `//`. Khối `/* … */` giữa
   dòng, hoặc chuỗi có chứa đường dẫn, vẫn lọt. Đo được: hôm nay lọc không đổi con số nào.
4. **Số dòng gộp cả docstring**, mà repo này docstring rất dày ⇒ "dòng" là *khối lượng tệp*, không
   phải *khối lượng logic*. Đừng quy đổi sang công sức.
5. **Ranh giới "module" là CHỌN**, không phải hằng số của dự án (Đ1 §5.5 cũng khai vậy). Chọn khác
   ra con số khác; 95 không phải hằng số.
6. **Cột `tự-kiểm` chỉ đếm tệp test trong cùng module + tệp test cấp 1 import vào** — không đếm test
   đặt ở nơi khác.
7. **Chưa mở app chạy thật một dòng nào.** Mọi kết luận là đọc mã + giải đường dẫn.
8. **`import-ghe-tu-hinh` không kêu** là do luật ④.5 bảo thủ, đã giải thích ở §2. Ai đọc bảng frontier
   mà tưởng "chỉ 4 entry dính" là đọc thiếu.

## ⑦c HẠN DÙNG KẾT LUẬN

Kết luận này **hết đúng khi**:
- có ai nối dây bất kỳ kho nào trong 3 kho / 20 tệp mồ côi ⇒ **chạy lại máy**, đừng trích số của
  báo cáo này (đúng bài học 16/08: *đếm tại NGUỒN, không đếm ở bản chiếu*);
- repo thêm dạng nạp động mới (ghép chuỗi · biến trung gian · plugin đăng ký theo tên) ⇒ máy mù
  thêm mà **không báo**, con số sẽ tụt một cách giả tạo;
- ranh giới module đổi (tách `lib/cad`, gộp thư mục) ⇒ mọi con số cấp module đổi theo;
- `frontier-registry` sửa `bangChung` của 4 entry đang kêu ⇒ khối ⚡ đổi ngay, kể cả khi code y nguyên.

**Không hết đúng vì** thời gian trôi — máy chạy lại là ra số mới, đó là điểm của việc dựng máy thay
cho đo tay.

---

## ⑧ DÂY MÁY

Chưa mở entry registry — theo phiếu, **T tự mở sau audit**. W **không sửa `trangThai`** của entry nào.
