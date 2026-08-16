# P-K · ĐƯA 9 TÊN ĐÃ DUYỆT VÀO MÁY + VÁ LỖ MÁY SOI MÙ `.md` + HAI SỬA CODE

> Phiếu `docs/phieu-giao/P-K-tu-dien-may-va-hai-sua-nho.md`. Khuôn 6 phần `docs/CLAUDE.md`.
> **Mã điều khoản** — đã MỞ `docs/TRIET-LY-IF.md` đọc số, không nhớ hộ:
> · **[T1] MỘT NGUỒN, NHIỀU ĐÍCH** *(vì sự thật phải ở một chỗ)* (`:14`)
> · **[Đ2] NHÌN VÀO TRONG TRƯỚC:** *"mọi bảng plan có cột 'NỘI LỰC ĐÃ CÓ' — IF có gì rồi mới chốt
>   build mới; build = ưu tiên chưng cất/nối dây, không sáng tác trùng"* (`:72`)
> Phiếu ghi đúng hai mã này. ⚠️ Nhưng **số dòng thì lệch một nấc ở một nguồn khác** — xem §2 ⓪.

---

## 1 · TỔNG QUAN

Máy soi từ điển nay **nhìn thấy `docs/phieu-giao/`** (trước mù hẳn `.md`) và **soi hai bệnh ngược
chiều nhau ở hai mức nghiêm khác nhau**: nhãn-lệch 🔴 chặn được, chữ-trần-đa-nghĩa 🟡 chỉ cảnh
báo. Phát đầu: **0 lệch nhãn · 205 chỗ chữ trần**, exit 0 — không chặn build.

Hai sửa code xong trọn: **`--mat-*` → `--nen-mo-*`** (114 dòng / 43 tệp code → **grep còn 0**), và
**độ mờ nút mờ thành token theo theme** — nút mờ từ **2,55:1 lên 3,36:1 ở nền sáng**, qua ngưỡng
3:1 của WCAG 1.4.11; nền tối giữ nguyên 4,01:1 vì vốn đã đạt.

`tsc` 0 · `npm test` **0 fail** · `soi:frontier` 0 lệch · hình-học và thao-tác **không thêm lệch mới**.

---

## 2 · CHI TIẾT TỪNG MỤC

### ⓪b · TIỀN ĐỀ HẠ TẦNG — đạt

| | |
|---|---|
| `git log --oneline -1` | `895fbaf docs(memory): nén ký ức phiên 16/08…` |
| `git rev-list --count HEAD..main` | **0** |
| nhánh | `main` (cây chính, đúng phiếu) |

### ⓪ · TIỀN ĐỀ NGHIỆP VỤ — **không bác ý nào**

| Ý | Phán | Bằng chứng |
|---|---|---|
| 1 · máy soi mù `.md` ⇒ mù `docs/phieu-giao/` | ✅ ĐÚNG | `soi-tu-dien.mjs:30` (bản cũ) `EXT = new Set(['.ts','.tsx','.html','.css'])`; `docs/phieu-giao/` đo được **59 tệp `.md`**, không tệp nào lọt vào `walk()` |
| 2 · Hoà duyệt 9 dòng 🔴 | ✅ ĐÚNG | `docs/00-CHOT.md:1177` — *"TỪ ĐA NGHĨA: DUYỆT CẢ 9 DÒNG ĐỎ … `khối` · `kính` · `mat-` · `nấc` · `lớp` · `tầng` · `card` · mã điều khoản · bốn-tên-một-thứ"* |
| 3 · dòng #8 (`[Đ1]`↔`[Đ2]`) đã sửa xong, chỉ cần canh không tái phát | ✅ ĐÚNG | 4 tệp code P-I nêu đều đã đúng; guard mới chạy ra **0 hit**. 14 dòng còn khớp `[Đ1]`+`nhìn` là **nhật ký** (`docs/nc/NC-TU-DA-NGHIA` mô tả chính lỗi đó · `bao-cao-phien/…P-E:89` · `…P-G:58` đang trích đúng) — sửa là viết lại lịch sử |

### 🔴 PHÁT HIỆN NGOÀI PHẠM VI — số dòng trích lệch một nấc, trong chính mục chữa bệnh trích sai

Mở `docs/TRIET-LY-IF.md` đọc thật: **`:14`** = `[T1]` · **`:70`** = `[Đ1]` · **`:72`** = `[Đ2]`.

| Nguồn | Ghi | Đúng? |
|---|---|---|
| `docs/nc/NC-TU-DA-NGHIA-2026-08-16.md:11-12` | `:70` / `:72` | ✅ |
| `docs/00-CHOT.md:1163` | *"`TRIET-LY-IF.md:69` **[Đ1]** … `:71` **[Đ2]**"* | ❌ **lệch −1** |

Mã điều khoản thì đúng, chỉ số dòng sai — nhưng đây đúng là dòng **ban hành luật "trích mã điều
khoản thì phải MỞ file đọc số, cấm nhớ hộ"**. Ai làm theo nó mở `:69`/`:71` sẽ thấy dòng trống và
nửa câu, rồi lại đi đoán. **Tôi KHÔNG sửa** — `docs/00-CHOT.md` nằm trong danh sách CẤM ghi của
phiếu. Chuyển T quyết.

---

### V1 · VÁ LỖ MÙ `.md` — ranh giới là **CHỌN có căn cứ**, không phải đo ra

`docs/` đo lại hôm nay: **561 tệp `.md` · 33 MB** (bản P-I ghi 554 — đã tăng 7 trong ngày).
Bật quét cả `docs/` là biến máy soi thành máy sinh báo đỏ trên nhật ký.

**Câu hỏi phân định, trả lời được bằng có/không:** *chữ trong tệp này còn ĐANG ĐIỀU KHIỂN việc không?*

| Quét | Tệp | Vì sao |
|---|---|---|
| `docs/phieu-giao/` | **59** | agent đọc để THI HÀNH — nhãn lệch ở đây lan thẳng vào code phiên sau |
| `docs/mocks/` | **3** `.md` | mock là hợp đồng giao diện (luật QUY TRÌNH DESIGN 02/08) |
| **cộng** | **62 / 561 ≈ 11%** | |

Loại trừ **tường minh, có ghi lý do ngay trong code** (`MD_LOAI_TRU`, `soi-tu-dien.mjs`):

| Loại trừ | Quy mô | Lý do |
|---|---|---|
| `CHANGELOG.md` | 220 K | nhật ký append-only, luật cấm xoá lịch sử cũ |
| `docs/memory/` | 11 tệp | ký ức đã nén — BẢN GHI của quá khứ |
| `docs/bao-cao-phien/` | 59 tệp | báo cáo đã nộp — sửa là sửa lời khai của phiên đã đóng |
| `docs/00-CHOT.md` | 1.179 dòng | sổ chốt append-only; sửa dòng cũ là viết lại quyết định của Hoà |
| `docs/nc/NC-TU-DA-NGHIA-2026-08-16.md` | — | nơi **định nghĩa** các từ này; dùng từ trần ở đó là đúng việc |

Danh sách loại trừ **thừa so với** danh sách cho phép — cố ý: nếu phiên sau nới `MD_QUET`, lớp
chặn thứ hai vẫn giữ nhật ký ngoài tầm.

> ⚠️ Trong 59 phiếu, chỉ **11 tệp là của 16/08** (đợt P-A…P-K); 48 tệp còn lại là phiếu đã đóng —
> tức **cũng mang tính nhật ký**. Tôi vẫn quét cả 59 vì máy đang ở mức cảnh báo và câu in ra đã nói
> rõ *"sửa khi soạn phiếu MỚI; phiếu đã đóng thì để nguyên"*. Nếu T muốn số sạch hơn, cách hẹp
> hơn là lọc theo tệp sửa trong N ngày — **tôi không tự làm vì nó cần một chốt về "phiếu còn sống
> là phiếu nào"**, mà đó là việc của T.

### V2 · NẠP 9 DÒNG ĐÃ DUYỆT — **hai luật riêng, không nhồi chung một danh sách**

Đúng cảnh báo trong phiếu: hai loại lỗi này **chữa khác nhau** nên tách hẳn.

| | ① `TU_DIEN` | ② `TU_DA_NGHIA` (MỚI) |
|---|---|---|
| Bệnh | một khái niệm ↔ nhiều nhãn | một chữ ↔ nhiều khái niệm |
| Máy biết gì | "sai → đúng", sửa là xong | chỉ biết *"chữ này trần"* — tên thay thế phải người đặt |
| Mức | 🔴 **chặn** (`--strict`) | 🟡 **cảnh báo** |

Chín dòng rơi vào hai nhóm theo **trạng thái thi hành**, không theo chủ đề:

| §V5 | Từ | Vào đâu | Vì sao |
|---|---|---|---|
| #3 | `--mat-` | ① guard | **đã thi hành xong hôm nay** ⇒ việc còn lại là chặn tái phát |
| #8 | `[Đ1]` ↔ `[Đ2]` | ① guard | **đã sửa đợt trước** ⇒ như trên |
| #1 | `khối` | ② | tên chưa thi hành |
| #2 | `kính` | ② | |
| #4 | `nấc` | ② | |
| #5 | `lớp` | ② | |
| #6 | `tầng` | ② | |
| #7 | `card`/`thẻ` | ② | |
| #13 | `module` | ② | ⚠️ **chưa có tên để gợi** — xem dưới |

**Máy gợi tên đúng**: mỗi entry ② in ra trọn danh sách tên riêng đã duyệt (`bước` · `mảng` ·
`nền mờ` · `nấc chi tiết` · `cờ tin cậy` · `lớp bản vẽ` · `lớp slide` · `trục DNA` · `tuyến kiểm` ·
`bậc AI` · `độ sâu` · `kiểu sáng` · `cấp tool` · `cấp vai` · `khung thẻ` · `thẻ dự án` · `thẻ DNA` ·
`thẻ tác vụ` · `nền mờ thẻ` · `thẻ việc`), người chọn — **máy không đặt tên hộ**.

> 🔴 **#13 là ngoại lệ và tôi khai thẳng:** §V5 #13 duyệt *"chọn MỘT tên"* nhưng **tên nào thì chưa
> chốt**. Máy không được tự chọn, nên entry này in đúng một câu: *"widget · element · node ·
> module đang là BỐN tên cho MỘT thứ — chưa chốt tên"*. Nó **đếm và nhắc**, không sửa được gì cho
> tới khi Hoà bấm một tên.

**Luật máy (tất định, grep thuần — không AI):** từ đa nghĩa xuất hiện mà **trong cùng dòng không
có định ngữ nào đã khai** → báo. Trường `ngoai_le` bắt buộc, có tiền lệ trong hệ
(`SPEC-NGON-NGU-CHI-DAN.md:104` — *"'Node' làm TÊN MODE chặng 3D là hợp lệ — ngoại lệ duy nhất"*).

### V3 · MỨC NGHIÊM — con số thật của phát đầu

```
✅ 0 lệch nhãn                       ← lớp ①
🟡 205 chỗ dùng chữ trần             ← lớp ②, KHÔNG chặn
```

| Từ | §V5 | Chỗ báo |
|---|---|---|
| `card`/`thẻ` | #7 | **72** |
| `khối` | #1 | 33 |
| `nấc` | #4 | 29 |
| `lớp` | #5 | 27 |
| `tầng` | #6 | 24 |
| `kính` | #2 | 17 |
| `module` | #13 | 3 |
| | | **205** |

Toàn bộ 205 nằm trong `docs/phieu-giao/`. Exit code kiểm thật:

| Lệnh | Exit |
|---|---|
| `npm run soi:tu-dien` | **0** |
| `node scripts/soi-tu-dien.mjs --strict` | **0** (lớp ① sạch) |
| `node scripts/soi-tu-dien.mjs --strict-da-nghia` | 1 — cờ **để dành**, chưa ai dùng |

Đường bật chặt về sau đã có sẵn (`--strict-da-nghia`), và in ra ngay dưới bảng để phiên sau khỏi
đi tìm.

### V4a · `--mat-*` → `--nen-mo-*`

Đếm **trước** khi sửa: **114 dòng / 43 tệp** trong `app` `components` `lib` `scripts`.

| Biến | Trước | Sau |
|---|---|---|
| `--mat-hairline` | 80 | `--nen-mo-hairline` 80 |
| `--mat-overlay` | 12 | `--nen-mo-overlay` 12 |
| `--mat-card` | 11 | `--nen-mo-card` 11 |
| `--mat-panel` | 10 | `--nen-mo-panel` 10 |
| `--mat-header` | 5 | `--nen-mo-header` 5 |

`grep -- '--mat-'` trong code: **114 → 0**. `matId` **không bị đụng** (`lib/cad/materials.ts` giữ
nguyên 4 chỗ). Giá trị màu giữ nguyên từng byte, chỉ đổi tên.

> Hai chi tiết nhỏ khai cho đủ: ① comment tài liệu hoá lần đổi tên trong `globals.css` viết
> *"tiền tố cũ `mat-`"* thay vì chuỗi nguyên văn — để `grep` sạch **đúng nghĩa đen**, mà vẫn ghi
> lại được lịch sử đổi tên. ② Guard trong máy soi cố ý bắt **cách dùng thật** (`var(--mat-…)` hoặc
> khai `--mat-x:`), không bắt chữ trần trong văn xuôi: custom property chỉ có đúng hai dạng dùng
> đó, nên đây là **siết vào tín hiệu thật**, không phải nới cho qua cửa. Đã tự kiểm: cắm
> `var(--mat-panel)` vào `globals.css` → máy bắt ngay (`:1825`); gỡ ra → về 0.

🔴 **Ba chỗ CÒN `--mat-`, cố ý không đổi — T cần biết:**

| Nơi | Dòng | Vì sao không đổi |
|---|---|---|
| `docs/mocks/` | **622** | phiếu ③ **CẤM** — một phiên phụ khác đang giữ thư mục |
| `docs/` khác (`BAO-CAO-G4`, `SPEC-DESIGN-SYSTEM-IF`, `CHECKLIST-TONG`…) | **690** | nhật ký + spec cũ; sửa là viết lại lịch sử |
| `docs/IF-design-system-seed.html` | (trong 690) | nền DesignSync, ngoài vùng ĐƯỢC ghi |

⇒ Mock và code **nay lệch tên token**. Không gãy lúc chạy (mock là HTML tự chứa, tự khai token
riêng), nhưng **luật mock-là-nguồn-sự-thật đang bị hở một khe**. Đề nghị T mở một lượt đổi
`docs/mocks/` khi phiên kia trả thư mục.

⚠️ **Tên CLASS `.mat-header/.mat-panel/.mat-card/.mat-overlay` (59 nơi dùng) CHƯA đổi** — §V5 #3
chỉ nói tiền tố **biến** `--mat-*`, và class là mặt phẳng đổi tên khác hẳn về bán kính ảnh hưởng.
Đã ghi cảnh báo ngay tại chỗ khai trong `globals.css`.

### V4b · Độ mờ nút mờ: hằng số → token theo theme

Công thức: WCAG 2.x chính thức của W3C — `L = .2126R + .7152G + .0722B` với kênh tuyến tính hoá
`c ≤ .03928 ? c/12.92 : ((c+.055)/1.055)^2.4`, `CR = (L_sáng+.05)/(L_tối+.05)`.
`opacity` trên phần tử = **hoà màu chữ lên nền**: `c' = α·c_chữ + (1−α)·c_nền`; rồi so `c'` với
chính nền đó. Màu chữ chip = `--t2`, nền = `--panel`/`--card`/`--bg`.

**Bộ tính tự viết, tự kiểm chứng:** nó tái hiện **đúng** hai con số P-I đã báo (2,54 sáng · 4,01
tối) trước khi tôi dùng nó cho số mới — nếu lệch thì là công thức tôi sai, không phải P-I sai.

| | `--panel` | `--card` | `--bg` | Đạt 3:1? |
|---|---|---|---|---|
| **TỐI** α .5 *(trước = sau)* | **4,01** | 3,95 | 4,02 | ✅ |
| **SÁNG** α .5 *(trước)* | **2,55** | 2,59 | 2,49 | ❌ |
| **SÁNG** α .62 *(sau)* | **3,36** | 3,45 | 3,25 | ✅ |

α tối thiểu để chạm 3,00:1 (bước 0,001): tối **0,400** · sáng **0,585** ⇒ chọn **0,62** cho biên
an toàn. α 0,60 chỉ còn **3,11** trên `--bg` — sát quá, một lần chỉnh nền là rơi lại dưới ngưỡng.

Thi công:

| | |
|---|---|
| Khai | `app/globals.css:214` `--mo-vo-hieu: 0.5` (tối) · `:272` `--mo-vo-hieu: 0.62` (sáng) |
| Dùng | `components/ui/ToolbarChip.tsx:119,141` — `opacity: disabled ? 'var(--mo-vo-hieu)' : 1` |
| Lập luận ghi tại chỗ khai | ✅ đủ bảng số + câu *"theme sáng sắp đổi sang bản canh-Apple ⇒ chỉ đổi token, component không đụng lần hai"* |

**Không phá thứ đợt trước vừa dựng** (kiểm từng dòng): `cursor: 'not-allowed'` (`:112`,`:134`) ·
`aria-disabled` (`:156`) · `aria-describedby` (`:157`) · phần tử ẩn `.if-tooltip-a11y` (`:179`) ·
đường nút-mờ-vẫn-đi-qua-`Tooltip` — **giữ nguyên toàn bộ**. Chỉ một biểu thức `opacity` đổi.

Nút mờ nay vẫn **rõ ràng mờ hơn** nút thường: nền sáng 3,36 so với 9,39 khi bật.

### V5 · ⛔ CỐ Ý KHÔNG LÀM — bàn giao T mở phiếu riêng

Không đổi tên KIỂU/UNION nào. Đo bán kính ảnh hưởng trong `app` `components` `lib` `scripts`:

| Thứ tự đề xuất | §V5 | Cụm | Nơi dùng đo được | Vì sao xếp chỗ này |
|---|---|---|---|---|
| **1** | #13 | `--shadow-node` đang tô bóng cho **widget** | **14 dòng / 9 tệp** | Rẻ nhất, khép kín, **bằng chứng lệch đã lan vào code**. Đổi token này KHÔNG cần chốt "tên nào thắng" — chỉ cần một tên trung tính. Làm được ngay |
| **2** | #5 | `Layer` ③ `lib/dna` → **trục DNA** | **20 dòng / 4 tệp** | Vùng nhỏ nhất trong 4 nghĩa, **không** dính CAD lẫn slide ⇒ đổi xong không ai nhầm chặng |
| **3** | #5 | `Layer` ② `present-editor` → **lớp slide** | **17 dòng / 9 tệp** | Cùng ca đau nhất (①② cùng bộ thao tác ẩn/khoá/đổi thứ tự). Đổi ② thì ① tự nhiên độc chiếm chữ "lớp bản vẽ" mà **không phải đụng `lib/cad`** — 52 dòng/9 tệp đứng yên |
| **4** | #2 | class `.mat-*` → nền mờ | **60 dòng / 37 tệp** | Cơ học như V4a, nhưng trải 37 tệp ⇒ cần lượt riêng. **Phải đi cùng `docs/mocks/`** (622 dòng) kẻo mock lệch tiếp |
| **5** | #7 | `Card` — 4 nghĩa | `Card` 400 dòng/69 tệp · `--card` **99/50** · `WidgetCard` 33/12 · `DesignDnaCard` 43/6 · `TaskCard` 15/4 | Token `--card` chạm 50 tệp; nên tách **token trước, kiểu sau** |
| **6** | #6 | `tầng` — 6 nghĩa | `storey` 251/33 · `tier` 215/45 · `--shadow-*` 62/33 | Ba vùng độc lập, đổi được riêng lẻ. `storey` **GIỮ** (từ nghề), chỉ đổi `tier`→bậc AI |
| **7** | #4 | `nấc` ③ → **cờ tin cậy** | `measured\|inferred\|verified` **509 dòng / 98 tệp** | Bán kính lớn nhất. ⚠️ Chạm `.idf`/`.idfc` đã ghi ra đĩa ⇒ **cần bảng nâng cấp phiên bản**, không phải đổi tên thuần |
| **8** | #1 | `khối` ① node → **bước** | từ điển `SPEC-NGON-NGU-CHI-DAN.md:26,29` + nhãn UI | ⚠️ **Đụng một chốt Hoà đã ký (từ điển 02/08)** — Hoà tự bấm, T không tự quyết. Xếp cuối vì rủi ro cao nhất, không vì rẻ |

**Nguyên tắc xếp:** rẻ-và-khép-kín trước, **chạm dữ liệu đã ghi ra đĩa** và **chạm chốt đã ký** sau
cùng. Mỗi cụm cần vòng an toàn riêng (đo nơi dùng · đổi từng cụm · chạy test giữa các cụm) —
gộp vào một phiếu là hỏng cả gói.

---

## 3 · TỔNG KẾT

Phiên này làm **ba việc khác bản chất nhau nhưng cùng một gốc**: chữ dùng lệch không làm app sập,
nó làm người sau **sửa nhầm chỗ**.

- **Máy** nay nhìn được đúng chỗ chữ gây hại nhất (`docs/phieu-giao/`), và biết **im lặng đúng
  chỗ** (nhật ký) — quan trọng ngang nhau, vì máy soi báo đỏ trên thứ không sửa được sẽ bị người
  ta học cách bỏ qua, rồi chết.
- **`--mat-*`** là ca duy nhất trong 9 dòng sửa được bằng thao tác cơ học, và đã sửa trọn trong
  code. Một dấu gạch từng ngăn cách *màu nền* với *khoá nối tới tiền*.
- **Nút mờ** là ca duy nhất **nhìn thấy được**: `0.5` không sai — nó **đúng cho một nửa số người
  dùng**. Một con số không phục vụ nổi hai nền; khai theo vai trò thì hết bài toán.

Điểm chung của cả ba: **[T1] một nguồn** — tên token khai một chỗ, độ mờ khai một chỗ, từ điển
khai một chỗ. Và **[Đ2]** — không dựng máy soi thứ hai, mở rộng đúng cỗ máy đang có.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:**
- Đích ⑥b đạt đủ, đo được từng mục, không mục nào khai vống.
- Guard `--mat-` **tự kiểm bằng ca thật**: cắm `var(--mat-panel)` vào `globals.css` → máy bắt
  (`:1825`), gỡ ra → về 0. Không phải tin vào việc "code trông có vẻ đúng".
- Bộ tính tương phản **tái hiện đúng số của P-I trước khi dùng cho số mới**.
- Tách hai mức nghiêm khiến máy dùng được ngay mà không chặn 11 phiếu đang chạy.

**Chưa được / rủi ro:**
- 🔴 **Mock và code nay lệch tên token** (`docs/mocks/` giữ 622 dòng `--mat-`). Do phiếu cấm, không
  do quên — nhưng khe hở này có thật và không máy nào canh.
- 🟡 **`dinh_ngu` là thứ tôi tự cân**, không phải thứ đo ra. Chỉnh lỏng một chữ là 205 tụt xuống
  vài chục; chỉnh chặt là vọt lên hàng trăm. Con số 205 **không phải sự thật khách quan** — nó là
  hệ quả của một bộ regex do tôi chọn. Đã ghi rõ ở ⑦b.
- 🟡 **Chưa chạy app thật một dòng nào** (phiếu cấm dev server). Số tương phản là **tính từ token
  trong `globals.css`**, không phải đo từ pixel trên màn. Nếu có lớp nền khác chen giữa nút và
  `--panel` thì số thật sẽ khác.
- 🟡 `--mo-vo-hieu` mới chỉ nối vào **`ToolbarChip`**. Chỗ khác còn gõ `opacity` cứng cho trạng
  thái vô hiệu thì vẫn giữ bệnh cũ — ngoài vùng ĐƯỢC ghi của phiếu, chưa đo hết.
- ⚪ `--nen-mo-hairline` là **đường kẻ**, không phải nền — tên hơi cấn. Giữ vì phiếu yêu cầu đổi
  **cơ học**; đặt tên lại theo nghĩa là việc khác.

---

## 5 · HƯỚNG XỬ LÝ — ba góc

**A · Giữ nguyên mức cảnh báo, đợi §V5 thi hành xong mới siết.**
*Được:* không chặn ai; đúng lộ trình "nạp từng từ đã duyệt vào `--strict`".
*Mất:* 205 con số đứng yên nhiều tuần thì thành tiếng ồn nền — người ta ngừng đọc.

**B · Siết `--strict-da-nghia` theo TỪNG TỪ, ngay khi từ đó thi hành xong.**
*Được:* con số **đi xuống thấy được**, máy soi giữ được uy tín.
*Mất:* mỗi lần siết là một lượt sửa phiếu cũ; và phiếu đã đóng thì sửa vô nghĩa.

**C · Thu phạm vi `.md` về phiếu CÒN SỐNG (sửa trong N ngày), bỏ 48 phiếu đã đóng.**
*Được:* 205 tụt mạnh, mỗi con số còn lại đều **sửa được thật**.
*Mất:* cần một chốt "phiếu còn sống là phiếu nào" — chốt đó chưa có, và đoán hộ là sai vai.

---

## 6 · ĐỀ XUẤT — **B, kèm C làm bước dọn một lần**

Chọn **B** vì nó là hướng duy nhất khiến con số **giảm được**, mà giảm được mới là thứ giữ cho máy
soi sống. A để con số đứng yên — và một máy soi báo mãi cùng một số là máy soi đã chết, chỉ chưa
ai tuyên bố. Đây đúng lập luận P-I dùng để chọn mức cảnh báo, nay áp tiếp cho bước sau nó.

Kèm **C một lần** ngay trước khi siết từ đầu tiên: tách 48 phiếu đã đóng ra khỏi phạm vi, để mỗi
báo đỏ còn lại đều là thứ sửa được. Không làm C thì B sẽ chặn vì những dòng **không ai được phép
sửa** — đúng cái bẫy phiếu này dặn tránh.

Không chọn C đơn độc vì nó chỉ làm số đẹp hơn mà không đổi hành vi ai cả.

**Từ đầu tiên nên siết: `kính` (17 chỗ)** — ít nhất, và là ca nguy hiểm nhất trong nhóm (một bên
là vật liệu có giá vào BOQ, một bên là màu giao diện). Rẻ nhất mà chặn đúng chỗ đắt nhất.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

1. **Ranh giới quét `.md` là CHỌN, không phải ĐO.** Số liệu (561 tệp · 62 tệp được quét · 59 phiếu
   trong đó chỉ 11 là của hôm nay) **có đo**; nhưng câu *"nơi chữ còn đang điều khiển việc"* là
   một **phán đoán**, không có phép đo nào phân định. Chỗ mong manh nhất: **48 phiếu đã đóng** —
   tôi xếp chúng vào "còn quét" chỉ vì máy đang ở mức cảnh báo. Lập luận ngược lại cũng đứng được.
2. **Tương phản tính chứ không đo trên màn.** Công thức WCAG 2.x của W3C, tự cài; đã tự kiểm bằng
   cách tái hiện đúng 2,54 / 4,01 của P-I. Nhưng đầu vào là **token trong `globals.css`**, không
   phải pixel thật — **chưa mở app lần nào** (phiếu cấm dev server). Ba giả định chưa kiểm:
   ① nền sau nút thật sự là `--panel`/`--card`/`--bg` (nếu có lớp `--nen-mo-*` bán trong suốt chen
   giữa thì số đổi) ② `opacity` áp cho cả nút nên nét icon hoà đúng như mô hình ③ chưa thử trình
   đọc màn hình, chưa thử Safari/Firefox.
3. **Tên đề xuất tôi thấy chưa ổn — nói thẳng, KHÔNG tự đổi** (Hoà đã duyệt):
   - **`bước`** (§V5 #1, thay "khối" nghĩa node) — chữ `bước` đã bận sẵn trong hệ: *"bước 1/4"*
     của ToolbarChip, *"bước thi công"*, `BuildOp` cũng là các bước trong ngăn xếp. Đổi một từ
     hai nghĩa lấy một từ đã ba nghĩa thì có thể **không lãi**. Nêu để Hoà biết, không tự đổi.
   - **`mảng`** (§V5 #1 nghĩa ③) — `mảng` đang là từ khoá nặng của Grounded Render (*"sinh từng
     mảng qua mask cứng"*, *"bảng ánh xạ mảng↔mảng"*) và của phân vùng mảng (`§2 SO-KIEM-TONG`).
     Rủi ro cùng loại.
   - **`--nen-mo-hairline`** — đã thi hành, nhưng `hairline` là **đường kẻ**, không phải nền.
   - Bảy tên còn lại (`nền mờ` · `nấc chi tiết` · `cờ tin cậy` · `lớp bản vẽ` · `lớp slide` ·
     `trục DNA` · `tuyến kiểm` · `bậc AI` · `cấp tool` · `cấp vai`) — **không thấy vướng gì.**
4. **`--mat-*` đã phủ hết chưa:** tôi **khá chắc** — đã tìm ghép chuỗi động
   (`` `--mat-${…}` ``, `'--mat' +`, `"--mat" +`) trong `app` `components` `lib`: **0 kết quả**;
   một hit duy nhất là câu comment ở `MacroCreateDialog.tsx:117`, không phải mã. Custom property
   chỉ có hai dạng dùng — khai `--x:` và tham chiếu `var(--x)` — cả hai đều là chuỗi liền, grep
   phủ được. **Chưa phủ:** biến CSS dựng từ dữ liệu lúc chạy (không thấy ca nào, nhưng grep không
   chứng minh được điều không tồn tại) và `.json`/`.svg` nếu có.
5. **`dinh_ngu` chưa qua vòng chỉnh nào ngoài của tôi.** 205 là số của **một** bộ regex. Chưa ai
   soi thử xem trong 205 đó bao nhiêu là **báo đúng** — tôi có đọc mẫu vài chục dòng, không đọc hết.
6. **Chưa đo** còn bao nhiêu chỗ khác trong repo gõ cứng `opacity` cho trạng thái vô hiệu ngoài
   `ToolbarChip` — ngoài vùng ĐƯỢC ghi nên không rà.

## ⑦c · HẠN DÙNG KẾT LUẬN

*"Hết đúng khi…"*

- **Theme sáng đổi sang bản canh-Apple** ⇒ **mọi số cột "sáng" phải đo lại**: `--t2` sáng
  (`#47423a`) và ba nền (`#faf8f4`/`#ffffff`/`#f2efe9`) đều đổi ⇒ α 0,62 có thể thừa hoặc thiếu.
  Đây chính là **lý do khai bằng token** — lúc đó sửa **một dòng `globals.css:272`**, không đụng
  component. Bảng số trong comment cũng phải thay theo, kẻo thành lời khai cũ.
- **Màu nhấn thứ hai được chốt** (mòng két ↔ mận, còn đang so bằng mắt) ⇒ nút mờ ở trạng thái
  `active` dùng `--accent`/`--accent-soft`, chưa đo trong phiếu này; đo bổ sung khi có hex.
- **Các cụm đổi tên §V5 được thi hành** ⇒ entry tương ứng trong `TU_DA_NGHIA` phải **chuyển từ
  lớp ② sang lớp ① làm guard chặn tái phát** (đúng đường `--mat-` và `[Đ1]` đã đi hôm nay), rồi
  bật `--strict-da-nghia` cho từ đó.
- **§V5 #13 chốt được MỘT tên** ⇒ entry `module` hiện chỉ biết đếm, lúc đó mới gợi được tên đúng.
- **`docs/mocks/` được đổi `--mat-*`** ⇒ gỡ mục cảnh báo lệch mock↔code ở §2 V4a.
- **Chốt được "phiếu còn sống là phiếu nào"** ⇒ `MD_QUET` thu hẹp, con số 205 mất hiệu lực.

---

## ⑧ · DÂY MÁY

`chong-lech-dinh-nghia` (mở rộng: quét `.md` + lớp ② đa nghĩa) · `may-soi-dong-dang` (cùng họ, tín
hiệu ②/⑤ — **TH2 "cùng gốc tên khác vùng" cố ý KHÔNG nhét vào máy này**, nó cần AST và thuộc về
máy kia; nhét vào là hai máy chồng việc, đúng bệnh chúng sinh ra để chữa) ·
`he-mau-2-lop` (token `--mo-vo-hieu` khai theo vai trò).
**Tôi không sửa `scripts/frontier-registry.mjs`** — T flip sau audit.

---

## ⑨ · KẾT QUẢ LỆNH — nguyên văn

```
$ npx tsc --noEmit
(exit 0)  — không in gì = 0 lỗi

$ npm test   (đuôi)
  ok  - touch() giữa lúc đang ghi KHÔNG bị rơi mất — có lượt ghi thứ 2
  ok  - ghi thất bại → onStatus báo ok:false + lý do, KHÔNG nuốt im lặng

14 ok, 0 fail
(exit 0)

$ npm run soi:tu-dien
        → tầng (TẦNG NHÀ kiểu Revit — GIỮ chữ)
        → bậc AI (tier)
        → độ sâu (z giao diện)
        → kiểu sáng
        → cấp tool
        → cấp vai
        docs/phieu-giao/P-C-toolbar-doc-so-lenh.md:22
        docs/phieu-giao/P-C-toolbar-doc-so-lenh.md:89
        docs/phieu-giao/P-F-bo-nen-chung-duyet-truoc.md:113
        … +21 chỗ nữa
🟡  72× «card|thẻ» trần  (§V5 #7 🔴)
        → khung thẻ (vỏ giao diện)
        → thẻ dự án
        → thẻ DNA
        → thẻ tác vụ
        → nền mờ thẻ
        → thẻ việc
        docs/phieu-giao/P-B-hien-thi-luat.md:32
        docs/phieu-giao/P-B-hien-thi-luat.md:61
        docs/phieu-giao/P-F-bo-nen-chung-duyet-truoc.md:22
        … +69 chỗ nữa
🟡   3× «module» trần  (§V5 #13 🔴 (bốn tên một thứ))
        → CHƯA CHỐT TÊN — widget · element · node · module đang là BỐN tên cho MỘT thứ (§V5 #13). Bằng chứng lệch đã lan: WidgetCard.tsx dùng token `--shadow-node`.
        docs/phieu-giao/P-I-tu-dien-tu-da-nghia.md:63
        docs/phieu-giao/feature-contract-may.md:24
        docs/phieu-giao/home-nav-lag.md:6
────────────────────────────────────────────────────────────────────────────────────────────────
   Phạm vi .md đang quét: docs/phieu-giao · docs/mocks
   Loại trừ (nhật ký, không điều khiển việc): CHANGELOG.md · docs/memory/ · docs/bao-cao-phien/ · docs/00-CHOT.md · docs/nc/NC-TU-DA-NGHIA-2026-08-16.md
🟡 205 chỗ dùng chữ trần — KHÔNG chặn. Sửa khi soạn phiếu MỚI; phiếu đã đóng thì để nguyên.
   Bật chặt: `--strict` chặn lớp ①. `--strict-da-nghia` chặn thêm lớp ② — CHƯA dùng, để dành khi §V5 thi hành xong.


$ npm run soi:hinh-hoc   (đuôi)
──────────────────────────────────────────────────────────────────────────────
Đã quét 283 file · 998 khai báo radius · 10 ngoài thang (6 giá trị lẻ)


$ npm run soi:thao-tac   (dòng tổng)
🔴 2 LỆCH (trên 17 luật grep) · 👁 19 luật chờ mắt  ← lệch trong code app GHI BÁO CÁO cho T quyết, không nới pattern
   ↳ NỀN CŨ NGUYÊN SI, không thêm lệch mới: 31 file thiếu :focus-visible · 193× hex inline

$ npm run soi:frontier   (dòng tổng)
👁 1 qua mắt Hoà · ✅ 70 xong-MÁY (NỢ NGHIỆM THU MẮT) · ⬜ 55 chờ · 🔴 0 LỆCH

$ grep -rn --include="*.ts" --include="*.tsx" --include="*.css" -- '--mat-' app components lib scripts | wc -l
0

$ grep -c "matId" lib/cad/materials.ts
4
```
