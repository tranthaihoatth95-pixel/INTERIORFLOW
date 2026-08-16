# BÁO CÁO P-I · RÀ TỪ ĐA NGHĨA — 16/08

> Phiếu: `docs/phieu-giao/P-I-tu-dien-tu-da-nghia.md` · Vai: **phiên phụ NGHIÊN CỨU + ĐO**.
> Kết quả đầy đủ: `docs/nc/NC-TU-DA-NGHIA-2026-08-16.md`.
> **Không sửa một dòng nào ngoài 2 tệp mới được phép.** Không chạy git ghi, không dev server.

---

## 1 · TỔNG QUAN

Rà 8 từ (5 Hoà chỉ đích danh + 3 tự tìm) và kiểm lại bảng 6 loại "icon" của T.
Kết quả: **6 từ đạt mức 🔴** (hai nghĩa dẫn tới hai việc khác hẳn), **1 từ tôi BÁC khỏi danh
sách** (`module` — đo ra vô hại), và **bắt thêm một ca ngoài dự kiến: mã điều khoản `[Đ1]` tự nó
đang bị trích sai ở 12 chỗ (6 trong docs — 3 là phiếu chạy hôm nay — và 6 trong CODE).** Bảng trình Hoà duyệt: **13 dòng**.

---

## 2 · CHI TIẾT

### ⓪ Tiền đề — PASS cả 4
`git log -1` = `895fbaf` · `HEAD..main` = 0. Ba tiền đề nghiệp vụ đều đúng, không bác ý nào
(bằng chứng: `scripts/soi-tu-dien.mjs:18-28` · `docs/00-CHOT.md:1148-1156` ·
`scripts/frontier-registry.mjs:280`).

🔴 **Bổ sung một lỗ tiền đề chưa ai nêu:** `soi-tu-dien.mjs:30`
`EXT = new Set(['.ts','.tsx','.html','.css'])` — **máy KHÔNG quét `.md`**, tức không nhìn thấy
`docs/phieu-giao/`, đúng nơi agent đọc để thi hành. Vá lỗ này quan trọng hơn thêm luật mới.

### V1 — Bảng 6 loại icon: 3 có thật · 1 sai tầng · 1 chỉ trong mock · 1 không có

| Loại | Phán | Bằng chứng |
|---|---|---|
| Icon giao diện | ✅ có thật | `components/ui/command-icon.tsx:18-21` |
| Ký hiệu nghề | ⚠️ **T mô tả SAI TẦNG** | tồn tại như NÉT VẼ (`lib/cad/commands.ts:491`), thanh công cụ vẫn 11/11 lucide (`command-icon.tsx:13-16`) |
| Icon nén tin | 🟡 chỉ mock | `docs/mocks/mock-bo-nen-chung.html:178-186`, 0 ca trong code chạy |
| Hình minh hoạ | ❌ **không có** | `components/ui/Tooltip.tsx:41-50` có `label/desc/shortcut/side`, 0 prop nhận hình |
| Dấu trạng thái | ✅ có thật | `components/settings/AiDependencySettings.tsx:157-180` |
| Nhãn loại tệp | ✅ có thật | `app/library/ingest/page.tsx:16` `TYPE_BADGE` |

Thêm **loại thứ 7 T bỏ sót — Ảnh đại diện người** (`components/ui/PresenceRow.tsx:53,71,85`):
chiếm đúng ô icon nhưng luật khác cả 6 (không thay được bằng chữ, phải có đường lùi, xếp chồng
"+N"). Không có hai loại nào thực chất là một — đã thử gộp 5 vào 3 và bác.

### V2 — Năm từ được giao

| Từ | Số nghĩa | Mức | Ca đau nhất |
|---|---|---|---|
| `card` | 6 | 🔴 | "card 3 nấc" áp cho VỎ, nhưng `TaskCard`/`DesignDnaCard` là dữ liệu có schema |
| `panel` | 3 | 🟡 | `--mat-panel` là một MÀU, `PanelFlank` là TAY CẦM — cả hai đều không phải panel |
| `kính` | 2 | 🔴 | ①vật liệu thật vào BOQ (`lib/materials/material-edit.ts:29`) ↔ ②vibrancy (`globals.css:190`) |
| `nấc` | 3 | 🔴 | ③`measured/inferred/verified` (`lib/dna/types.ts:88`) **người dùng không bấm được** — khác hẳn ①② |
| `module` | 2 | ⚪ | **BÁC** — xem dưới |

🔴 **Ca `kính` kéo theo một lệch nặng hơn T chưa nêu:** tiền tố `--mat-*`
(`globals.css:191-195`, comment tự khai *"Materials trong suốt (vibrancy)"*) đứng cạnh `matId`
= mã vật liệu nối thẳng tới giá (`lib/cad/materials.ts:58` *"matId của IF = ProductSpec.sku"*).
`--mat-card` cách `matId` đúng một dấu gạch.

### V3 — Ba từ tự tìm, cả ba 🔴

- **`khối`** 🔴🔴 **nặng nhất cả phiếu.** `docs/SPEC-NGON-NGU-CHI-DAN.md:26` khai `Node → khối`,
  `:29` `Node Library → thư viện khối`; **cùng tệp** `:61,76` dùng "khối" nghĩa khối 3D đặc.
  Cuốn từ điển chống-lệch-nghĩa tự mâu thuẫn trong 35 dòng. Hệ quả sống: "Thư viện khối"
  (`00-CHOT:59`) theo từ điển là thư viện NODE, nhưng KTS đọc chắc chắn hiểu là khối 3D.
- **`lớp`** 🔴 — 4 nghĩa, cả 4 tên `layer` trong code: lớp bản vẽ CAD (`lib/cad/model.ts:53`) ·
  phần tử z slide (`present-editor/LayerPanel.tsx:4`) · 8 trục DNA (`lib/dna/types.ts:22`) ·
  lớp luật/góp ý (`lib/review/types.ts:100`). Hai cái đầu **cùng bộ thao tác ẩn/khoá/đổi thứ tự**
  ⇒ mở nhầm tệp là sửa nhầm chặng, tsc và test đều xanh.
- **`tầng`** 🔴 — 6 nghĩa. Nghĩa gốc là **tầng nhà kiểu Revit** (`lib/cad/model.ts:171`), từ nghề
  có nghĩa cứng; IF đang mượn cho tier AI, z UI, tầng sáng, cấp tool, cấp vai.

### V3-5 — Ca ngoài dự kiến: `[Đ1]` đang bị trích sai

`docs/TRIET-LY-IF.md:70` **[Đ1]** = *"Tầng sau phải là hệ quả tầng trước"*; `:72` **[Đ2]** =
*"NHÌN VÀO TRONG TRƯỚC"*. **12 chỗ ghi ngược:**

- **6 trong `docs/`:** `00-CHOT.md:944` · `:956` · `bao-cao-phien/2026-08-16-P-E-sidebar-home.md:89`
  · `phieu-giao/P-G-o-giai-nghia.md:105` · `P-H-thanh-tien-trinh.md:114` ·
  `P-I-tu-dien-tu-da-nghia.md:91` — **ba cái cuối là phiếu ĐANG CHẠY hôm nay.**
- **6 trong CODE:** `components/settings/UnitsScaleSettings.tsx:10-11` · `lib/units/scale.ts:6` ·
  `lib/units/index.ts:9` · `lib/commands/toolbar-source.ts:11` ·
  **`scripts/frontier-registry.mjs:304` và `:306`**.

🔴 **Đây là chỗ tôi tự sửa mình:** bản nháp báo cáo này khai *"chỉ grep `docs/`, chưa grep code"*.
Grep nốt thì ra **sáu chỗ nữa nằm trong code** — và `lib/units/scale.ts:6` · `index.ts:9`
**trích nguyên văn câu của [Đ2] rồi gán số [Đ1]**, dạng sai khó thấy nhất vì câu trích đúng.
Hai chỗ nằm trong chính `frontier-registry.mjs` — sổ máy-đọc-được.

Gốc lệch: `00-CHOT` mục 13/08 liệt kê tên 6 điều hành mà **không gán số**, người sau suy theo
thứ tự xuất hiện.

### V4 — Đề xuất luật máy soi (mô tả, không code)

Thêm mảng **thứ hai** `TU_DA_NGHIA` cạnh `TU_DIEN` (không đụng `TU_DIEN` — đang 0 lệch), mỗi
entry khai `{tu, nghia:[{ten, dinh_ngu}], pham_vi, ngoai_le}`. Máy không cần hiểu nghĩa: nó kiểm
*"từ đa nghĩa xuất hiện mà cùng câu không có định ngữ nào đã khai"* → báo.

Ba tín hiệu tất định: **TH1** từ trần không định ngữ trong `docs/phieu-giao/` (regex thuần) ·
**TH2** cùng gốc tên khác vùng lib (AST) · **TH3** nhãn UI trần một từ (regex).
⚠️ **TH2 nên nằm ở `may-soi-dong-dang`, không nhét vào `soi:tu-dien`** — nếu không hai máy chồng
việc, đúng bệnh chúng sinh ra để chữa.

**Chi phí** (đếm thô `grep -oiI`, chưa lọc định ngữ ⇒ trần trên): `card` 94 lần trong
`docs/phieu-giao/` + 1.314 trong code · `panel` 79/1.596 · `lớp` 46/756 · `nấc` 40/216 ·
`khối` 36/972 · `tầng` 34/779 · `kính` 25/472. Bật TH1 cho 4 từ 🔴 ước **50–120 chỗ báo**
(ước lượng, chưa chạy thử — không được sửa script nên không đo được số thật).

**Bật CẢNH BÁO, không chặn.** Mốc hiện tại là 0 lệch; chặn sẽ chặn cả 3 phiếu đang chạy, mà
**chưa có tên thay thế nào được Hoà duyệt** ⇒ chặn không có đường ra. Lộ trình: Hoà bấm bảng →
có tên → nạp `--strict` **từng từ một**, đúng kỷ luật `soi-tu-dien.mjs:9`.

### ⑥b — Vòng tự đóng: ĐẠT ở vòng 1

| Điều kiện đích | Kết quả |
|---|---|
| Mỗi dòng V5 có ≥1 `file:dòng` mở ra đúng | ✅ 13/13 |
| `soi:tu-dien` không tăng lệch | ✅ mốc 0 → sau 0 |
| `soi:frontier` 0 lệch | ⚠️ **2 lệch, đúng 2 id T báo trước** — `o-giai-nghia-co-hinh` · `thanh-tien-trinh-hai-loai`. Của T, không sửa, không tính là chưa đạt |
| Bảng ≤ 20 dòng | ✅ 13 |
| Mỗi loại V1 có ca thật hoặc bị khai thẳng là không có | ✅ 6/6 + loại 7 mới |

Không chạy `tsc`/test: phiên không đụng một dòng code nào, hai tệp ghi ra đều là `.md`.

---

## 3 · TỔNG KẾT LẠI VẤN ĐỀ

Rốt cuộc **không phải "IF có vài từ dùng hơi lẫn"**. Ba việc riêng biệt lộ ra:

1. **Bệnh có hình dạng ổn định:** mỗi từ 🔴 đều theo cùng một khuôn — **một từ NGHỀ (kính, tầng,
   lớp, khối) bị mượn làm từ GIAO DIỆN.** Không có ca ngược lại. Đây là hướng nguy hiểm hơn hẳn
   loại lỗi `SPEC-NGON-NGU-CHI-DAN` §5 đang phòng (*cấm jargon nội bộ lộ UI*), vì người dùng đã
   mang sẵn một nghĩa trong đầu **trước khi mở app**.

2. **Cuốn từ điển chống lệch tự nó đã lệch** — hai ca độc lập: `SPEC-NGON-NGU-CHI-DAN.md` khai
   `Node → khối` rồi 35 dòng sau dùng "khối" nghĩa khác; và mã `[Đ1]` bị trích sai ở 12 chỗ, 6 trong đó nằm trong code.
   Cơ chế phòng bệnh không tự miễn nhiễm với chính bệnh đó.

3. **Một ca T xếp nhầm loại:** `module` không đa nghĩa, nhưng nó là **tên thứ tư** cho thứ IF đã
   gọi là `widget` · `element` · `node`. Bằng chứng lệch đã lan vào code:
   `components/home/widgets/WidgetCard.tsx:20` dùng token `--shadow-node` (`globals.css:200`) —
   token đặt theo NODE đang tô bóng cho WIDGET. Đây là tín hiệu ④ `may-soi-dong-dang`, không phải
   bệnh đa nghĩa — **chữa nhầm bệnh thì không khỏi.**

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:**
- Mọi dòng trong bảng V5 có `file:dòng` đã mở ra kiểm, không dòng nào tô vẽ. Bảng 13 dòng, dưới
  trần 20 — giữ đúng nguyên tắc băng thông duyệt của Hoà là tài nguyên khan hiếm.
- Bác được một mục T giao (`module`) và sửa hướng một mục khác (ký hiệu nghề), kèm bằng chứng.
- Tìm được `[Đ1]` — ca đắt nhất phiên — dù nó **không nằm trong phạm vi phiếu**; nó lộ ra vì
  phiếu bắt trích nguyên văn mã điều khoản. Nghĩa là **ô ⑤ của khuôn phiếu đang có tác dụng thật**.

**Chưa được / rủi ro:**
- 🔴 **Đọc thiếu hai tệp phiếu bảo đọc:** `NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md`
  (NT-1..18) và `NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (KB-1..5). Lý do: đã đủ ca thật từ code +
  00-CHOT, và hai tệp đó là nơi **định nghĩa** từ chứ không phải nơi từ **bị dùng lệch**.
  **Rủi ro thật:** nếu NT/KB đã đặt sẵn tên riêng cho `card` hay `nấc` thì tên đề xuất ở V5 có
  thể trùng hoặc chọi. **Phải đối chiếu trước khi thi hành.**
- Con số "50–120 chỗ báo đỏ" là **ước lượng, chưa chạy thử** — ràng buộc "không sửa script" chặn
  việc đo thật. Đây là chỗ yếu nhất của V4.
- Tên riêng đề xuất là **ý của một phiên phụ**, chưa qua mắt ai. Riêng dòng #1 (`khối`) đụng vào
  một chốt Hoà đã ký 02/08 — không được coi là đề xuất kỹ thuật thuần.
- Quét được **~14/554 tệp `.md`** trong `docs/` (2,5%). Con số 8 từ là **sàn, không phải trần** —
  gần như chắc còn từ đa nghĩa chưa lộ.

---

## 5 · HƯỚNG XỬ LÝ — nhiều góc độ

**Hướng A — Hoà duyệt cả bảng 13 dòng, rồi mở phiếu đổi tên theo lô.**
*Được:* dứt điểm, một lần đau. *Mất:* 13 quyết định một lượt, mà dòng #1 và #6 đụng chốt cũ —
duyệt vội thành duyệt hình thức. Và đổi tên `lớp`/`tầng` là đụng `lib/cad/` — vùng có test dày,
rủi ro cao nhất đúng lúc chưa ai kiểm chứng tên mới.

**Hướng B — Chỉ sửa cái RẺ và ĐANG CHẢY MÁU, hoãn phần đổi tên.**
Sửa `[Đ1]` 12 chỗ (10 phút, chặn được 3 phiếu đang lan cái sai) + khai lại "ký hiệu nghề" là việc
chưa làm + thêm loại 7. Ba việc này **không đổi một định danh nào trong code**.
*Được:* rủi ro gần bằng 0, chặn được thiệt hại đang xảy ra. *Mất:* 6 từ 🔴 vẫn nguyên; phiếu mai
vẫn viết "card 3 nấc" và agent vẫn đoán.

**Hướng C — Không đổi tên gì cả, chỉ bắt PHIẾU phải nói rõ.**
Bật TH1 cảnh báo cho `docs/phieu-giao/` với 4 từ 🔴; phiếu buộc viết "nấc chi tiết" thay vì "nấc".
*Được:* chữa đúng chỗ đau (phiếu là thứ agent thi hành), 0 dòng code đổi, hoàn tác được.
*Mất:* code vẫn lẫn — `Card` vẫn 3 vùng, `layer` vẫn 4 nghĩa; người đọc code vẫn phải đoán.

---

## 6 · ĐỀ XUẤT: **B trước, rồi C, A để sau và cắt nhỏ**

**Bước 1 — làm ngay, hôm nay (hướng B).** Sửa 12 chỗ `[Đ1]` → `[Đ2]`. Đây là thứ duy nhất trong
cả báo cáo đang **gây thiệt hại theo thời gian thật**: mỗi phiên phụ trả báo cáo là cái sai nhân
thêm một bản. Rẻ, không rủi ro, không cần Hoà duyệt (sửa về đúng nguồn chuẩn, không phải đổi
chốt). Kèm hai đính chính bảng icon (ký hiệu nghề = việc chưa làm · thêm loại 7) — cũng chỉ là
sửa mô tả, không đụng định danh.

**Bước 2 — trình Hoà đúng BA dòng, không phải 13 (hướng C làm nền).** Ba dòng: **#1 `khối`** ·
**#5 `lớp`** · **#13 `widget/element/node/module`**. Lý do chọn đúng ba: `khối` nằm trong chính
cuốn từ điển nên không sửa thì mọi luật ngôn ngữ khác mất hiệu lực · `lớp` là ca duy nhất máy
**không thể** bắt được (tsc xanh, test xanh, vẫn sửa nhầm chặng) · #13 là thứ sắp sinh ra tên
thứ năm nếu không chốt. Bảy dòng còn lại **giữ nguyên trong sổ, không trôi** — đúng cơ chế
`bang-tong-phien` Hoà vừa chốt 16/08.

**Bước 3 — bật TH1 CẢNH BÁO cho `docs/phieu-giao/`, sau khi có tên.** Không bật `--strict`. Lý do
chọn C trước A: **phiếu là nơi bệnh gây hại, code chỉ là nơi bệnh trú.** Một phiếu mơ hồ làm hỏng
cả một phiên phụ (~6 phút × N agent, hàng trăm nghìn token — giá này đã đo được ở ca worktree
16/08); một định danh lẫn trong code chỉ làm người đọc chậm vài phút. Sửa chỗ đắt trước.

**Vì sao KHÔNG chọn A ngay:** đổi tên trong `lib/cad/` và `lib/dna/` là đụng vùng có test dày và
có `.idf`/`.idfc` đọc-ghi. Với `nấc`③ (`measured/inferred/verified`) thì tên đó **đã nằm trong dữ
liệu người dùng đã lưu** — đổi là chuyện migration, không phải chuyện đặt tên. Gộp nó vào một lô
13 dòng là giấu một việc nặng sau một bảng trông như việc nhẹ.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

- **Quét được bao nhiêu `docs/`:** `docs/` đo **554 tệp `.md` · 33 MB**. Đọc kỹ **~14 tệp**
  (≈2,5%): `00-CHOT.md` mục 16/08 (`:922-1159`) · `soi-tu-dien.mjs` (hết, 65 dòng) ·
  `frontier-registry.mjs` 2 entry · `SPEC-NGON-NGU-CHI-DAN.md` phần từ điển · `TRIET-LY-IF.md`
  (`:14`, `:68-78`) · `mock-bo-nen-chung.html` phần ba nấc · 7 tệp code. Phần còn lại chỉ chạm
  bằng grep.
- **BỎ QUA HẲN, phiếu có bảo đọc:** `NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1..18)
  và `NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (KB-1..5). Đã nêu rủi ro ở mục 4.
- **BỎ QUA:** `CHANGELOG.md` (220K) · `docs/memory/` toàn bộ · `docs/bao-cao-phien/` trừ 1 tệp ·
  ~540 tệp `.md` còn lại · toàn bộ `docs/00-CHOT.md` trước dòng 922 (chỉ grep).
- **SUY, KHÔNG ĐO:**
  · con số "50–120 chỗ báo đỏ" ở V4-e — ước lượng, không chạy thử được vì cấm sửa script;
  · câu *"KTS đọc 'Thư viện khối' sẽ hiểu là khối 3D"* — suy từ việc chính từ điển dùng "khối"
    theo nghĩa 3D ở `:61`, **không phải từ phỏng vấn người dùng**;
  · mức 🟡 của `panel` — dựa trên "nghĩa (a) áp đảo về số lượng", tôi không đo tỉ lệ thật.
- **NGHI ĐA NGHĨA, CHƯA ĐỦ BẰNG CHỨNG** (nêu để không rơi, không đưa vào bảng):
  · **`khung`** — khung tên bản vẽ (nghề, có chuẩn 9 ô) ↔ khung hình ảnh ↔ khung giao diện;
  · **`bảng`** — bảng việc ↔ bảng vật liệu A3 ↔ bảng thông số (panel) ↔ bảng làm việc (từ điển
    khai `Flow → bảng làm việc`, `SPEC-NGON-NGU-CHI-DAN.md:25`). Nghi mức 🔴, chưa đo đủ;
  · **`chặng`** — 00-CHOT đã tự cảnh báo ca này 07/08 (IF ①②③ vs "mảng IF2") nhưng **chưa ai kiểm
    xem cảnh báo đó có được tuân không** — tôi không kiểm trong phiên này;
  · **`gói`** — gói tác vụ ↔ Gói Hồ Sơ Sống ↔ gói npm ↔ gói tri thức (Neufert/color-system-packs).
- **KHÔNG KIỂM:** hai tệp mock của phiên P-G/P-H đang chạy song song — có thể chúng đang tạo thêm
  ca đa nghĩa mới ngay lúc tôi đo.

## ⑦c · HẠN DÙNG KẾT LUẬN

Kết luận này hết đúng khi:
1. **Hoà duyệt hoặc bác bảng 6→7 loại icon** — toàn bộ V1 và các dòng #9-#11 của bảng V5 phải
   viết lại theo phán quyết đó.
2. **`soi:tu-dien` được mở rộng** — mục V4 thành tài liệu lịch sử; đặc biệt nếu `EXT` được mở
   sang `.md` thì mọi con số chi phí ở V4-e phải đo lại từ đầu.
3. **Bộ nền chung được duyệt** (`docs/mocks/mock-bo-nen-chung.html`) — nhiều tên mục sẽ chốt theo
   đó, và tên riêng đề xuất ở V5 phải nhường tên đã duyệt.
4. **Bất kỳ ai đọc NT-1..18 / KB-1..5 và thấy tên riêng đã được định nghĩa sẵn ở đó** — phần đề
   xuất tên của V2/V3 hết hiệu lực ngay tại chỗ đó.
5. **`[Đ1]` được sửa đủ 12 chỗ** — mục V3-5 và dòng #8 đóng. ⚠️ Còn **1 chỗ chưa phán được**:
   `scripts/frontier-registry.mjs:125` *"[Đ1] + THẺ VAI tự chứa 4 dòng [Đ4]"* — ngữ cảnh không đủ
   để biết gọi nghĩa nào, người sửa phải tự đọc. Và tôi **chưa grep `docs/` cho các mã khác**
   ([T*], [N*], [Đ3]-[Đ6]) — cùng gốc bệnh "liệt kê không gán số" thì khả năng cao còn ca nữa.
6. **Chốt 02/08 `Node → khối` bị lật hoặc giữ** — dòng #1 phụ thuộc hoàn toàn vào đó.
