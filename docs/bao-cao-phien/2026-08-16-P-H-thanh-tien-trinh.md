# P-H · THANH TIẾN TRÌNH — HAI LOẠI, CẤM BỊA PHẦN TRĂM

> Phiên phụ P-H · 16/08/2026 · vùng `components/ui` + `lib/ui` + `docs/mocks`
> Phiếu: `docs/phieu-giao/P-H-thanh-tien-trinh.md`

---

## ⓪b TIỀN ĐỀ HẠ TẦNG — ĐÚNG MỐC

```
$ git log --oneline -1
895fbaf docs(memory): nén ký ức phiên 16/08 — đợt giao diện, ~20 chốt hệ thống, 6 nợ bàn giao
$ git rev-list --count HEAD..main
0
```
Cây chính, đứng đúng `895fbaf`, lệch main = 0 ⇒ **đi tiếp**.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — XÁC NHẬN CẢ BA

| # | Tiền đề | Kết luận | Bằng chứng đo được |
|---|---|---|---|
| 1 | `LightArc` 110 dòng, nhận `value` undefined để chỉ trạng thái không-đo-được ⇒ **logic hai loại đã tồn tại**, thiếu hình thái THANH | ✅ **XÁC NHẬN** | `wc -l` = 110. `LightArc.tsx:40` `const indeterminate = value == null \|\| !Number.isFinite(value)`. `RenderQueuePanel.tsx:120` truyền `value={running ? running.progress*100 : activeCount>0 ? undefined : 100}` — đúng nguyên văn phiếu |
| 2 | `components/ui/` không có component tiến trình nào khác | ✅ **XÁC NHẬN** | `ls components/ui` = 11 file; `grep -rl -i progress components/ui` chỉ ra `LightArc.tsx` |
| 3 | Viền chạy (từ xa) ↔ thanh (nhìn gần) phân vai, không giẫm nhau | ✅ **XÁC NHẬN** | Khác **việc** (cái nào bận ↔ còn bao lâu), khác **chỗ đứng** (viền ↔ ruột), khác **khoảng cách nhìn**. Bản vẽ mục 3 dựng cả hai trong một card để chứng minh |

🔧 **MỘT ĐÍNH CHÍNH SỐ ĐẾM, không đổi kết luận**: phiếu nói *"2 nơi đang dùng `LightArc`"* — thật ra là **4**: `ExportPdfDialog.tsx:276,277` · `present-editor/Toolbar.tsx:582` · `CameraExportTab.tsx:189` · `RenderQueuePanel.tsx:117,387`. Ràng buộc "không đổi một dòng" vì vậy **nặng hơn** phiếu tưởng — và đã giữ được (chứng minh ở §6).

🔧 **ĐÍNH CHÍNH MÃ ĐIỀU KHOẢN** — T đã gửi giữa phiên, P-H xác minh độc lập tại nguồn trước khi nhận:
- `docs/TRIET-LY-IF.md:70` → **[Đ1]** = *"Tầng sau phải là hệ quả tầng trước — tính năng/luật mới khai được 'đứng tầng nào, hệ quả điều nào' mới qua cửa plan."*
- `docs/TRIET-LY-IF.md:71` → **[Đ2] NHÌN VÀO TRONG TRƯỚC** = *"mọi bảng plan có cột 'NỘI LỰC ĐÃ CÓ' — IF có gì rồi mới chốt build mới; build = ưu tiên chưng cất/nối dây, không sáng tác trùng."*
- Thêm một mã phiếu chưa nêu mà việc này rơi trúng hơn cả: `docs/TRIET-LY-IF.md:18` → **[T2] ĐỒNG BỘ — MỘT CỖ MÁY, NHIỀU MẶT TIỀN** *"Cơ chế giống nhau = MỘT engine; tự chế riêng khi đã có khuôn = vi phạm, T chặn ở plan."* Phiếu ghi **[T1]** *"MỘT NGUỒN, NHIỀU ĐÍCH"* (`:14`) — [T1] nói về **dữ liệu** (Doc/.idf là nguồn duy nhất), còn V1 là chuyện **cơ chế** ⇒ mã đúng là **[T2]**.
- Mã dùng trong code/bản vẽ: **[T2]** cho một-lõi-hai-mặt-tiền, **[Đ2]** cho không-sáng-tác-trùng, **[N1]** (`:53`) cho khai-thật. Không chỗ nào dùng [Đ1] hay [T1].

---

## 1 · TỔNG QUAN

Dựng **một lõi thuần + hai mặt tiền** cho chỉ báo tiến trình: `lib/ui/tien-trinh.ts` (lõi, 42 ca test), `LightArc` (vòng cung — giữ nguyên API, 4 nơi dùng không đổi một dòng), `LightBar` (thanh, mới). Hai loại tách nhau bằng **hình thái** (đếm được ↔ không đếm được) chứ không bằng "cùng thanh nhưng giấu số", nên **giảm chuyển động vẫn phân biệt được**. Việc bịa % bị chặn ở **tầng kiểu dữ liệu**, không phải ở lời nhắc.

Kết: `tsc` 0 lỗi · test liên quan 0 fail · 3 máy soi không thêm lệch mới · bản vẽ `docs/mocks/mock-thanh-tien-trinh.html` đủ 2 theme + nút gạt giảm chuyển động, tự chấm bằng `design:design-critique` + `design:accessibility-review` và **đã sửa 5 lỗi tự bắt được**.

---

## 2 · CHI TIẾT TỪNG MỤC

### V1 — MỘT lõi, HAI mặt tiền · **QUYẾT ĐỊNH: TÁCH**

Phiếu cho phép không tách nếu "lõi quá mỏng". **Số đo thật:**

| Đo | Số |
|---|---|
| Lõi thuần thật sự trích ra khỏi `LightArc` | **4 dòng** (`:40,41` + nhánh `aria-valuenow` `:53`) |
| `lib/ui/tien-trinh.ts` sau khi viết | 133 dòng (≈ 40 dòng mã, còn lại là chú thích luật) |
| `LightArc.tsx` trước → sau | 110 → 110 dòng (`git diff --stat`: **7 thêm, 7 bớt**) |

Nếu chỉ đếm dòng thì **lõi mỏng thật** và lý lẽ "đắt hơn lợi" nghe được. **Tách vẫn đúng, vì ba lý do không nằm ở số dòng:**

1. ⭐ **Đây là chỗ DUY NHẤT test chạm tới được.** Bộ test của repo là `.test.ts` chạy bằng `sucrase-node`, **không DOM, không React** (`package.json` script `test`). Logic nằm trong `.tsx` là **không có cách nào kiểm bằng máy**. Luật đắt nhất của phiếu — *cấm bịa %* — mà không kiểm được bằng máy thì nó là lời hứa. Tách ra `lib/ui/` biến nó thành **42 ca test chạy mỗi lần `npm test`**.
2. **Union phân biệt chỉ sống được khi có một kiểu chung.** Cơ chế chống-bịa-số mạnh nhất (§V3) là kiểu dữ liệu, không phải hàm. Kiểu đó phải ở một chỗ cho cả hai mặt tiền cùng đọc.
3. **Chỗ đặt đã có sẵn** — `lib/ui/` đang chứa `tooltip-position.ts` + test, cùng khuôn "logic thuần ra lib, vẽ ở component". Không đẻ thư mục mới. [Đ2]

### V2 — Hình thái thanh: DÃY VẠCH, không phải khối đặc

Đo trên app thật (bản vẽ, khung 1440×900, thanh 523px):

| | Số đo |
|---|---|
| Số vạch mặc định | **48** |
| Bề rộng / chiều cao vạch | **4,76 × 10 px** — cao hơn rộng, đọc ra *vạch* |
| Khe | **6,27 px** |
| Ba bậc chiều cao (tắt / sáng / mút) | **6,2 / 10 / 12,8 px** |

🔴 **Một lần tự sửa, ghi lại vì nó là bài học đo-thay-vì-đoán**: bản đầu để `soVach = 32` — đo ra vạch **13,45 × 10 px**, tức **rộng hơn cả chiều cao**. Đó là *khối*, không phải *vạch*, và sai hẳn cảm giác "nhẹ · nhanh" Hoà mô tả. Nếu chỉ nhìn ảnh thu nhỏ thì trôi qua; con số bắt được ngay.

**Điểm sáng đầu mút** là vạch sáng cuối cùng: `scaleY(1.28)` + hai lớp `drop-shadow`. Nó **mang tin** — nói *đang ở đâu* — chứ không phải hoa văn: 0% và 100% **không có mút** (chưa bắt đầu / đã xong thì không còn chuyện "đang ở đâu"), và điều đó có test canh (`chiaVach` ca 5).

### V3 — HAI LOẠI, nhìn-là-phân-biệt-được 🔴

| | ĐO ĐƯỢC | KHÔNG ĐO ĐƯỢC |
|---|---|---|
| Hình thái | **vạch RỜI, đếm được** — 48 phần tử thật | **rai LIỀN, không đếm được** — gradient lặp, không phần tử nào để đếm |
| Chiều cao | 10 px | **6 px** (thấp hơn hẳn) |
| Neo | sáng dần **từ trái**, có đầu mút | **không mốc đầu-cuối**; cụm sáng trôi ra khỏi mép rồi vào lại |
| Con số | có % (+ `conLai` nếu nơi gọi có sẵn) | **không con số nào** |

⭐ **Chọn tách bằng "đếm được ↔ không đếm được" chứ không bằng chuyển động là quyết định có hệ quả**: bật giảm chuyển động thì cụm trôi dừng — nếu hai loại chỉ khác nhau ở chỗ *một cái động một cái tĩnh* thì lúc đó thanh indeterminate trông y hệt thanh đứng ở 0%. Đây đúng chỗ nhiều app hỏng. Hình thái khác nhau thì tắt chuyển động vẫn đọc được.

**Điểm nghiệm thu "không cần đọc chữ" — đo bằng máy, không bằng cảm giác:**
```
[role=progressbar] · loại KHÔNG ĐO ĐƯỢC → aria-valuenow = null · chữ chứa ký tự số = false
[role=progressbar] · loại ĐO ĐƯỢC      → aria-valuenow = 62   · chữ chứa ký tự số = true
```

**API khiến việc bịa số KHÓ XẢY RA** — năm chốt, không phải năm lời nhắc:

| Chốt | Cơ chế | Chặn được kiểu bịa nào |
|---|---|---|
| ① Union phân biệt | `{doDuoc:true; pct}` ↔ `{doDuoc:false}` — nhánh không-đo-được **không có** trường `pct` | Đọc `t.pct` mà chưa hẹp kiểu ⇒ **không biên dịch được** |
| ② `tuPhanSo(done,total)` | `total ≤ 0` trả **không đo được** | Mẹo `done / Math.max(1,total)` — đang dùng thật ở `CameraExportTab.tsx:189` — cho **0% giả** khi chưa biết tổng |
| ③ `phanTramHienThi()` | trả `null` (không phải `''`) khi không đo được | Không có chuỗi nào để in vào khe số |
| ④ `ariaTienTrinh()` | tự bỏ `aria-valuenow` khi không đo được | Không lỡ đọc "0 phần trăm" cho trình đọc màn hình |
| ⑤ **Không có ETA** | lõi cố ý **không có** hàm ước lượng, và **có test canh điều đó** (ca 7 quét tên hàm xuất khẩu) | Không ai "tiện tay" thêm hàm đoán thời gian còn lại rồi cả app dùng theo |

Cửa **duy nhất** để khai "chưa biết" là **không truyền `value`**. Cố ý không có cờ `indeterminate` riêng — thêm cờ là mở đường cho hai nguồn sự thật cãi nhau.

### V4 — Phân vai với viền chạy

Bản vẽ mục 3 dựng ba tầng **cạnh nhau** ở cả hai theme, tái dùng nguyên cơ chế `.k1/.k2/.k3` của `mock-bo-nen-chung.html` (không chế lại):

| Tầng | Khi nào | Nghĩa | Hình thức |
|---|---|---|---|
| ① kính nhận sáng | luôn có | **chất liệu** | `backdrop-filter` trên nền ảnh thật + vệt bắt sáng mép trên |
| ② viền sáng **đứng yên** | trỏ vào | **bấm được** | quầng lan quanh viền, **mặt card không đổi** |
| ③ viền **chạy** vòng | đang render | **đang chạy** | `conic-gradient` + `@property --goc` quay liên tục |

Card ③ mang **cả viền chạy lẫn thanh** để chứng minh không đánh nhau. ⚠️ Bản vẽ nói thẳng một chỗ yếu: **lúc giảm chuyển động, viền tĩnh của ③ gần giống quầng tĩnh của ②** — kênh phân biệt còn lại là **chữ trạng thái**, nên chữ "Đang render" **không phải trang trí, nó là kênh dự phòng bắt buộc**.

### V5 — Trợ năng + giảm chuyển động

| Hạng mục | Trạng thái |
|---|---|
| `role="progressbar"` + `aria-valuemin/max` | ✅ cả hai loại |
| `aria-valuenow` | ✅ **chỉ** khi đo được — đúng chuẩn WAI-ARIA cho indeterminate |
| `aria-label` nói rõ việc gì | ✅ mặc định song ngữ qua `useT()`, nơi gọi ghi đè được |
| Phần vẽ | ✅ `aria-hidden` — nó là bản vẽ lại của con số đã có trong ARIA, đọc hai lần là nhiễu |
| `prefers-reduced-motion` | ✅ cụm trôi tắt **đầu tiên**, rai sáng **đều một mức** = "đang chạy, chưa biết tới đâu" (khác "đứng lại ở chỗ X"); loại đo được bỏ transition |
| Màu không là kênh duy nhất | ✅ Xong/Lỗi có **chữ + hình khác nhau** (dấu tích ↔ chữ thập), không chỉ khác màu |

⭐ **Một lỗi a11y THẬT tự bắt được và đã sửa** — đo tương phản trên bản vẽ:
```
theme tối · vạch SÁNG (--accent #7c3aed) vs vạch TẮT (--border #2a2a31) = 2,64:1
```
**Dưới ngưỡng 3:1 của WCAG 1.4.11** cho hình đồ hoạ mang thông tin — mà ranh giới sáng/tắt **chính là** thông tin của thanh. Theme sáng thì đạt (5,22:1); chỉ theme tối hỏng.

**Cách sửa đã chọn — bậc CHIỀU CAO làm kênh thứ hai** (tắt `.62` → sáng `1` → mút `1.28`, đo ra 6,2/10/12,8 px). Vì sao chọn cách này thay vì đổi màu: màu nhấn thứ hai **đang chờ Hoà chốt hex** — sửa bằng màu là sửa vào thứ sắp đổi. Bậc chiều cao đọc được khi **in đen trắng**, đọc được với **người mù màu**, và **đúng bất kể hex cuối cùng là gì**.

**Bảng tương phản sau khi sửa** (đo bằng máy trên bản vẽ, cả 2 theme, ngưỡng 4,5:1):

| Phần tử | Tối | Sáng |
|---|---|---|
| tiêu đề ô | 15,93 | 17,01 |
| số % | 11,98 | 10,94 |
| "còn 40 giây" | 6,53 | 5,23 |
| ghi chú · mô tả | 6,53 | 5,23 |
| nhãn `.tag` | 7,36 | 4,69 |
| nhãn thang % | 6,53 | 5,23 |
| chữ "Đang render" | 11,98 | 10,94 |
| chữ Xong / Lỗi | 6,92 / 5,27 | 6,14 / 5,26 |
| **Số mục dưới 4,5:1** | **0** | **0** |

### V6 — Bản vẽ

`docs/mocks/mock-thanh-tien-trinh.html`, dòng đầu `<!-- @dsCard group="Thanh tiến trình" -->`.

- **Đủ 2 theme + nút gạt** — và 6 tấm **ghim cứng theme** (`data-fix`) để so sáng ↔ tối cạnh nhau; đo: gạt theme đổi 9 tấm, **0 tấm ghim bị đổi**.
- **Nút gạt giả lập giảm chuyển động** — đo: bật thì `animation-name` của cụm trôi và của viền chạy đều về `none`, rai nở full width opacity .5.
- **Token thật, tên thật của `app/globals.css`** (`--accent · --border · --t1..t4 · --r-* · --fs-* · --ease-apple · --success · --danger`) — mã màu chỉ viết trong đúng một khối đầu file. Theme sáng ăn theo bản "canh theo Apple" của `mock-bo-nen-chung.html`.
- **Bày cạnh nhau đủ 4 ca phiếu yêu cầu**: ① thanh đo được có % ② thanh không đo được ③ cả hai trong card đang render (viền chạy) ④ card chỉ hover (viền đứng yên).
- Thêm: thang % (0 · 1 · 37 · 99,9 · 100 · lỗi) và **ca khổ hẹp** — xem §4.
- Khung 1440×900: `scrollWidth == clientWidth` ⇒ **0 tràn ngang**; khung 720 (tương đương phóng 200%): cũng 0 tràn.
- **Không đụng `app/globals.css`** dù phiếu cho phép thêm class. Lý do: hai phiên phụ khác đang ghi vào cùng cây làm việc, và `LightArc` đã có sẵn khuôn keyframes-cục-bộ-theo-instance (`useId`) chạy tốt. Ít rủi ro hơn, không mất gì.

### V7 — KHÔNG thay thế nơi gọi hiện có ✅

Không đụng `RenderQueuePanel` / `CameraExportTab` / `Toolbar` / `ExportPdfDialog`.

**Đề xuất danh sách nơi nên nối (việc của phiên sau, sau khi Hoà duyệt mắt):**

| Nơi | Nay | Nên |
|---|---|---|
| `RenderQueuePanel.tsx:387` thẻ job | `LightArc` 26px + `pct` riêng | `LightBar` — thẻ job là **hàng ngang**, thanh hợp khổ hơn vòng cung |
| `CameraExportTab.tsx:189` xuất chuỗi ảnh | `LightArc` + `done/Math.max(1,total)` | `LightBar` + **`tuPhanSo(done,total)`** — sửa luôn ca 0% giả khi `total = 0` |
| `present-editor/Toolbar.tsx:582` nhập PDF | `LightArc` | giữ vòng cung (nằm trong nút, khổ vuông) — **không phải chỗ nào cũng đổi** |
| `ExportPdfDialog.tsx:277` dựng xem trước | `LightArc` indeterminate | giữ nguyên |

---

## 3 · TỔNG KẾT LẠI VẤN ĐỀ

Bài toán bề mặt là "vẽ cái thanh". Bài toán thật là **giữ cho app không nói dối bằng con số** — và điều đó không giải được bằng một component đẹp, vì nửa năm sau sẽ có người tiện tay truyền `progress ?? 0` vào cho đỡ trống.

Nên phần đáng giá của đợt này **không nằm ở phần nhìn thấy**: nó nằm ở chỗ nhánh "chưa biết" **không có trường `pct` để mà đọc**, ở chỗ `total = 0` trả về "chưa biết" thay vì 0%, ở chỗ lõi **không có** hàm đoán ETA và có test canh cho nó tiếp tục không có. Phần nhìn thấy — 48 vạch, điểm sáng đầu mút, rai không đếm được — là **mặt tiền của đúng cái luật đó**: nhìn hai thanh là biết một cái đang đếm và một cái không có gì để đếm.

Ba lần tự sửa trong phiên đều đến từ **đo, không từ nhìn**: vạch 13px rộng hơn cao (sai cảm giác), 2,64:1 dưới ngưỡng a11y (sai luật), khe 3px cứng tràn thanh hẹp (sai khổ). Không con số nào trong ba cái đó lộ ra trên ảnh chụp thu nhỏ.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:**
- Luật "cấm bịa %" thành **thứ máy chặn**, không phải thứ nhắc nhau: 42 ca test, sai kiểu thì `tsc` đỏ.
- 4 nơi dùng `LightArc` **không đổi một dòng** — chứng minh bằng `git diff --stat`, chỉ `LightArc.tsx` đổi (7+/7−).
- Không thêm lệch nào cho 3 máy soi, dù thêm 1 component và 2 file lib.
- Tự bắt và sửa 5 lỗi ở bước tự chấm: tương phản 2,64:1 · chữ 9px accent 3,04:1 · nhãn `--t4` 3,26–3,44:1 · `<code>` rơi xuống 10,3px · thứ tự heading nhảy H2→H4.

**Chưa được / rủi ro:**
- 🔴 **Chưa chạy trên app thật, một dòng cũng chưa.** Phiếu cấm khởi động dev server và cấm sửa nơi gọi, nên `LightBar` mới chỉ tồn tại dưới dạng **bản vẽ HTML + component biên dịch sạch**. Số đo hình học lấy từ bản vẽ — bản vẽ chép **cùng công thức**, không phải **cùng mã**. Rủi ro còn lại: bản vẽ và component **phân kỳ** về sau (đã ghi cảnh báo ngay trong `<script>` của bản vẽ).
- 🟡 **`soVach` là số cứng do nơi gọi khai, component không tự đo bề rộng mình.** Khai 48 vạch cho thanh 92px thì vạch còn 0,84px — gần mất nét. Đã chặn phần **nguy hiểm** (không tràn vỡ khổ hàng bên: khe theo tỉ lệ + `overflow:hidden`, đo `tranPhai = 0`), nhưng phần **xấu** thì vẫn xấu. Đường sạch là `ResizeObserver` tự chọn số vạch — cố ý chưa làm, vì thêm máy móc cho một component chưa ai dùng là ngược [Đ2].
- 🟡 **Màu nhấn tím `#7c3aed` là màu tạm.** Mòng két chưa chốt hex. Đã dựng sao cho đổi hex là xong (một dòng biến), và kênh a11y đã cố ý không phụ thuộc hex.
- 🟢 `npm test` **thoát 1** — nhưng **không phải lỗi của đợt này**: 3 test hỏng đều nằm trong `.claude/worktrees/agent-a54fc5a8884c021bd/lib/server/*.test.ts` (worktree của phiên khác nằm lồng trong repo), hỏng vì `Environment variable not found: DATABASE_URL`. Script `test` loại trừ `*/.worktrees/*` nhưng đường thật là `.claude/worktrees/*` — **mẫu loại trừ hụt một nhánh**. Chạy lại với đúng mẫu loại trừ: **0 fail**. Đây là việc của T, P-H không sửa `package.json` (ngoài vùng).

---

## 5 · HƯỚNG XỬ LÝ NHIỀU GÓC ĐỘ

**Hướng A — Hoà duyệt mắt bản vẽ trước, rồi mới nối vào nơi gọi.**
· *Được:* đúng thứ tự phiếu; nối sai thì chỉ sửa bản vẽ, chưa đụng đường render đang chạy thật. `soVach` chốt sau khi thấy khổ thật của từng chỗ.
· *Mất:* `LightBar` nằm không cho tới lượt duyệt; nợ "xong-máy chưa xong-mắt" tăng thêm một mục.

**Hướng B — nối ngay `CameraExportTab` vì ở đó có bug thật.**
· *Được:* `done / Math.max(1, total)` là **0% giả khi `total = 0`** — đúng loại bịa số mà đợt này sinh ra để diệt, và `tuPhanSo` sửa nó bằng một dòng. Vá bug thật luôn đáng hơn để đó.
· *Mất:* đụng `components/render-studio/*` — phiếu ghi rõ **CẤM**, và đó là biên liên chặng. Làm là vượt thẩm quyền phiên phụ.

**Hướng C — bọc `ResizeObserver` cho tự chọn số vạch trước khi giao.**
· *Được:* xoá hẳn rủi ro dùng sai `soVach`.
· *Mất:* thêm máy móc cho component **chưa nơi nào dùng**; và số vạch bao nhiêu là đẹp thì **Hoà nhìn mới biết**, đoán trước rồi tự động hoá cái đoán sai là tệ hơn.

---

## 6 · ĐỀ XUẤT HƯỚNG TỐT NHẤT

**Chọn A, kèm một việc nhỏ của B tách riêng.**

A đúng vì nút thắt hiện tại của IF **không phải thiếu code, mà là 66 mục xong-máy đối 1 mục qua mắt**. Thêm một mặt tiền chưa ai nhìn vào đường render đang chạy thật là làm nút thắt chặt thêm, và nếu Hoà chê hình thái thì phải gỡ ra ở nơi tốn kém nhất.

C loại vì nó tự động hoá một con số mà **chưa ai duyệt bằng mắt**. Đúng bài "máy hoá cái đoán sai".

Nhưng B có một phần **không nên chờ**: `CameraExportTab.tsx:189` đang bịa 0% khi `total = 0`. Đó là **bug, không phải thẩm mỹ**, và nó không cần `LightBar` để sửa — chỉ cần đổi biểu thức sang `tuPhanSo(done, total)` rồi truyền `value` hoặc bỏ trống. ⇒ **Đề nghị T mở một phiếu riêng, rất nhỏ, vùng `components/render-studio`**, tách khỏi đợt duyệt mắt. Gộp vào đây là trộn *vá bug* với *chờ duyệt gu* — hai việc khác hạn, khác người quyết.

---

## ⑥b VÒNG TỰ ĐÓNG

**Đóng ở vòng 3/5.**

| Vòng | Trọng tài bắt gì | Xử |
|---|---|---|
| 1 | `tsc` sạch, 42 test pass, 3 soi không thêm lệch. Nhưng **đo hình học**: vạch 13,45 × 10 px — rộng hơn cao ⇒ ra *khối*, sai cảm giác "nhẹ · nhanh" | `soVach` 32→48, chặn trần bề rộng 5px, `justify-content: space-between` |
| 2 | `design-critique` + `accessibility-review`: vạch sáng/tắt **2,64:1** dưới ngưỡng 3:1 · chữ "Đang render" 9px **3,04:1** · nhãn `--t4` **3,26–3,44:1** · `<code>` 10,3px · heading nhảy H2→H4 · bản vẽ **0 `role=progressbar`** | thêm bậc chiều cao `.62/1/1.28` (kênh thứ hai, không phụ thuộc hex) · chữ về `--t2`, chấm giữ accent · `--t4`→`--t3` · `code` về `1em`, `th` về `--fs-2xs` · `h4`→`p.oh` · gắn ARIA thật cho 4 ví dụ chủ đạo |
| 3 | Đo khổ hẹp: khe 3px cứng × 47 = 141px ⇒ **tràn 7,43px** khỏi thanh 92px | khe đổi sang **tỉ lệ `1.2%`**, `minWidth` 1→0, thêm `overflow:hidden` chốt chặn. Đo lại: `tranPhai = 0` ở cả 3 ca |

**Kết quả cuối:**
```
$ npx tsc --noEmit                  → 0 lỗi
$ sucrase-node lib/ui/tien-trinh.test.ts → ✅ 42 pass · 0 fail
$ (toàn bộ .test.ts, trừ .claude/worktrees) → 0 fail
$ npm run soi:tu-dien               → ✅ 0 lệch định nghĩa
$ npm run soi:hinh-hoc              → 283 file · 998 radius · 10 ngoài thang   (nền: 282 · 997 · 10 → +1 file, +1 radius, +0 lệch)
$ npm run soi:thao-tac              → 🔴 2 lệch: 31 file focus-visible · 193× hex   (nền: 31 · 193 → +0)
$ git diff --stat components/ui/LightArc.tsx components/render-studio components/present-editor components/print
   components/ui/LightArc.tsx | 14 +++++++-------
   1 file changed, 7 insertions(+), 7 deletions(-)
   ⇒ 4 nơi dùng LightArc: 0 dòng đổi ✅
```

**File đã ghi** (đúng ô ③, không ra ngoài):
`lib/ui/tien-trinh.ts` · `lib/ui/tien-trinh.test.ts` · `components/ui/LightBar.tsx` · `components/ui/LightArc.tsx` (chỉ rút lõi) · `docs/mocks/mock-thanh-tien-trinh.html` · báo cáo này.
**Không đụng:** `Tooltip.tsx` · `ToolbarChip.tsx` (P-G giữ) · `frontier-registry.mjs` · `render-studio/*` · mock khác · `STATUS.md` · `00-CHOT.md` · `app/globals.css` · `package.json`. Không chạy lệnh git ghi, không khởi động dev server.

⚠️ **Một chỗ đi hơi ngoài chữ của ô ③, khai thẳng:** phiếu viết *"file MỚI `components/ui/LightBar.tsx` (+ test)"*. Test thật đặt ở **`lib/ui/tien-trinh.test.ts`** vì bộ test repo không dựng được React (không DOM). Test đặt cạnh `components/` sẽ không chạy được dòng nào. Cùng vùng `lib/ui` với lõi, cùng khuôn `tooltip-position.test.ts` sẵn có.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

1. **Quyết định tách lõi — dựa trên số đo, và số đo KHÔNG ủng hộ theo nghĩa đen.** Lõi thuần chỉ **4 dòng**; `LightArc` sau khi tách vẫn **110 dòng**, đổi 7+/7−. Ai cân bằng dòng thì kết luận "tách vô ích" là hợp lý. Tách vì **testability**, không vì tiết kiệm dòng — và đó là lập luận về *khả năng kiểm chứng*, không phải về số đo, nên **có thể cãi lại được**.
2. **`prefers-reduced-motion` là ĐO, không phải SUY — nhưng đo trên BẢN VẼ, không trên component.** Bản vẽ đo bằng nút gạt giả lập (`body[data-rm="1"]`, cùng bộ quy tắc với `@media`): `animation-name` về `none`, rai nở full width opacity .5, viền chạy về viền tĩnh. **Nhánh `@media (prefers-reduced-motion: reduce)` thật của `LightBar.tsx` CHƯA được kích hoạt lần nào** — nó nằm trong `<style>` cục bộ theo `useId`, chỉ chạy khi React render. Muốn chắc phải bật giảm chuyển động ở macOS rồi mở app thật. **Chưa làm, và không làm được trong phiếu này** (cấm dev server).
3. **Nơi nào trong app đang chạy việc mà CHƯA có chỉ báo.** Quét `components/` + `app/`: **36 file** có state kiểu `loading/busy/pending/isRunning`; **21** có ít nhất một chỉ báo (`LightArc` · `animate-spin` · `Loader2` · `progress`); **15 file không có chỉ báo hình nào**:
   `app/library/ingest/page.tsx` · `app/settings/_components/StorageCard.tsx` · `components/AccountMenu.tsx` · `components/ExportPptxButton.tsx` · `components/library/Object3DWindow.tsx` · `components/nodes/NodeExtras.tsx` · `components/photo-editor/LibraryPickerModal.tsx` · `components/photo-editor/PhotoEditor.tsx` · `components/present-editor/Inspector.tsx` · `components/present-editor/PresentEditor.tsx` · `components/present-editor/table/ScheduleScreen.tsx` · `components/settings/GuModelSettings.tsx` · `components/settings/StorageSettings.tsx` · `components/studio/ProjectScopeEmptyState.tsx` · `components/studio/RenderIOMenus.tsx`.
   Trong 15 file đó, **13 có ít nhất chữ kiểu "Đang…"** (kênh chữ, yếu nhưng không phải trống); **2 gần như không có gì**: `ProjectScopeEmptyState.tsx` và `ExportPptxButton.tsx` (mỗi file đúng 1 lần khớp).
   🔴 **CHẮC CHẮN CHƯA QUÉT HẾT — ba lỗ đã biết**: ① lọc bằng **tên biến** (`loading|busy|pending|isRunning|dangChay|dangTai|dangXuat`), việc chạy đặt tên khác (`step`, `phase`, `queue`, `status === 'running'`) thì **lọt hoàn toàn** ② chỉ quét `.tsx` — việc chạy ở `lib/**` (worker · hàng đợi · `disk-sync` · gọi node) **không nằm trong lượt quét** ③ đếm "có chỉ báo" bằng grep tên component trong **cùng file**, chỉ báo do component cha vẽ hộ thì bị đếm nhầm là thiếu. ⇒ Con số **15** là **sàn dưới**, không phải danh sách đủ.
4. **Chưa mở file đầu ra nào** — đợt này không sinh file xuất (PDF/PPTX/ảnh), nên luật nghiệm thu "mở file đầu ra soi theo `CHUAN-DAU-RA-NGHE`" không áp được. Nghiệm thu ở đây là **bản vẽ mở bằng mắt + số đo DOM**.
5. **Chưa kiểm bằng trình đọc màn hình thật** (VoiceOver). Bảng "đọc thành gì" trong bản vẽ là **suy từ chuẩn ARIA**, không phải chép lại lời VoiceOver.
6. **Chưa đối chiếu từng điều NT-1..18** một cách hệ thống — chỉ đối chiếu các điều chạm trực tiếp (NT-8 nhãn · NT-11 cấm glow tĩnh · NT-16 nấc giảm chói · luật kênh-dự-phòng · thang bo · từ điển).

---

## ⑦c HẠN DÙNG KẾT LUẬN

*Kết luận này hết đúng khi…*

1. **Màu nhấn thứ hai (mòng két) được chốt hex.** Bản vẽ và component đang lấy `--accent` tím. Đổi hex thì **phải đo lại tương phản vạch-sáng ↔ vạch-tắt** (nay 2,64:1 ở theme tối, đang được bậc chiều cao gánh). Nếu màu mới tự nó vượt 3:1 thì bậc chiều cao thành *tuỳ chọn thẩm mỹ* chứ không còn là *bắt buộc a11y* — và đó là một quyết định khác, phải hỏi lại.
2. **`mock-bo-nen-chung.html` được duyệt hoặc bị bác.** Theme sáng ở đây ăn theo bản "canh theo Apple" của bộ nền. Bộ nền bị bác thì toàn bộ nửa sáng của bản vẽ này phải vẽ lại; bộ nền đổi giá trị thì trang này lệch theo mà **không báo** — hai file đang chép giá trị cho nhau, chưa có dây máy nào canh.
3. **Entry `card-kinh-gradient` (viền chạy) được thi công thật.** Tầng ③ hiện **chỉ sống trong bản vẽ**, code app 0 dòng. Khi làm thật mà chọn hình thức khác (vd. viền chạy dùng màu khác, hoặc bỏ hẳn), thì **lập luận phân vai ②/③ bằng chuyển động phải xét lại** — và kèm theo đó là chỗ đứng của thanh trong card.
4. **Có phiên nối `LightBar` vào nơi gọi thật.** Mọi số đo hình học ở đây lấy từ **bản vẽ HTML**, không từ app. Bản vẽ chép *công thức* của `chiaVach`, không chạy *mã* của nó. Nối vào app thật là lần đầu hai bên được đối chiếu — và là lúc `soVach` của từng chỗ mới chốt được.
5. **Hoà duyệt mắt.** Toàn bộ phần "nhìn là phân biệt được" mới chỉ **P-H tự chấm**. Đó là **xong-máy**, chưa phải **xong-mắt**.
6. **Cộng tác nhiều người vào IF.** Bản vẽ đã ghi sẵn: khi có presence, **quầng sáng viền đã bị tầng ② chiếm**, presence phải tìm kênh thứ ba — lúc đó bảng ba tầng thành bảng bốn kênh và phải vẽ lại.

---

## ⑧ DÂY MÁY

- Entry registry **`thanh-tien-trinh-hai-loai`** — T mở, P-H **không** sửa `frontier-registry.mjs`.
- Liên đới: `card-kinh-gradient` (viền chạy — bản vẽ đã dựng, code chưa có) · `hover-gradient-kem` (viền sáng khi trỏ — **đã đính chính: gradient theo màu nhấn mới, không còn là kem**; bản vẽ dùng `--accent`) · `nut-cong-tren-day` (đèn tiến trình từng bước của chuỗi node **ăn theo khuôn này** — mỗi bước một `LightBar` nhỏ, bước chưa đo được thì để trống `value`).
- Marker đã cắm: `tienTrinh` (`lib/ui/tien-trinh.ts:1`) · `LightBar` (`components/ui/LightBar.tsx:3`) · `LightArc` (giữ nguyên) · `@dsCard group="Thanh tiến trình"` (dòng đầu bản vẽ).

---
---

# PHỤ LỤC — LƯỢT 2: "THÊM SÁNG" (cùng ngày 16/08)

> Ghi tiếp vào báo cáo cũ theo yêu cầu, không mở báo cáo thứ hai.
> Việc thêm từ Hoà, nguyên văn: *"phần hiệu ứng tiến trình nên thêm sáng"*.

## 1 · TỔNG QUAN

Bản lượt 1 đúng luật nhưng **khô**: phần đã chạy sáng đều một mức, nhìn một khung hình đứng yên chỉ đọc được **một** tin. Lượt này thêm **VỆT SÁNG NGUỘI DẦN** — chói nhất ở đầu mút, tắt dần về sau — để ánh sáng **nói thêm được hai tin nữa**, đúng luật NT-11/LightState (*ánh sáng chỉ mang nghĩa, cấm glow tĩnh trang trí*).

⭐ **Phần thưởng ngoài dự kiến, và là kết quả đáng giá nhất của lượt này**: việc "làm sáng lên" **sửa luôn lỗ a11y lượt 1 phải vá tạm bằng kênh chiều cao**. Tương phản vạch-đã-chạy ↔ vạch-tắt ở nền tối **2,64 → 3,69:1** — nay **đạt ngưỡng 3:1 bằng chính MÀU**, không còn phải sống nhờ kênh dự phòng. Nền sáng cũng tăng (5,22 → 6,13:1), tức **không đánh đổi đầu nào** — đúng chỗ ràng buộc 3 cảnh báo dễ hụt.

Kết: `tsc` 0 lỗi · lõi **64 ca test** (thêm 22) · `npm test` **thoát 0** · 3 máy soi **không thêm lệch mới** · **0/1672** phần tử chữ dưới 4,5:1 hoặc dưới 11px.

## 2 · CHI TIẾT TỪNG MỤC

### 2.1 · Ba tin đọc được từ MỘT khung hình đứng yên

| Tin | Mã hoá bằng | Đo được |
|---|---|---|
| ① **đang ở đâu** | chỗ chói nhất = đầu mút | mút L\*=0,739 · vạch nguội L\*=0,610 |
| ② **đi hướng nào** | vệt chỉ nằm **phía sau** mút | `cuongDoVach(i > mút) = 0`, có test |
| ③ **nhanh hay chậm** | **độ dài vệt** (quy ước nhoè-chuyển-động) | vệt 2 vạch ↔ vệt 9 vạch, cùng ở 62% |

Tin ③ là tin **mới hoàn toàn** — trước nay không kênh nào trong IF nói được tốc độ mà không cần con số.

**Suy từ đo thật, không từ hằng số cho đẹp**: `doDaiVet(deltaPct, dtMs, soVach)` lấy hai lần đọc `%` cách nhau `dtMs` (`useRef` giữ lần trước). Thiếu dữ kiện — lần đầu · `dt ≤ 0` · lùi lại · `NaN` — thì trả **vệt ngắn nhất**, **không đoán** một độ dài. Cùng đúng tinh thần "không có số thì đừng bịa" của cả file.

Đo trên bản vẽ, độ suy giảm đơn điệu ở cả màu lẫn quầng:

| vạch | độ sáng L\* | quầng |
|---|---|---|
| mút | 0,739 | 7,0 px |
| mút −1 | 0,713 | 5,6 px |
| mút −2 | 0,687 | 4,2 px |
| mút −3 | 0,662 | 2,8 px |
| mút −6 trở đi | 0,610 | không |

### 2.2 · ⭐ Vì sao nó KHÔNG tụt thành trang trí: xong thì tắt hẳn

| Trạng thái | Số vạch có quầng |
|---|---|
| 0% | **0** |
| đang chạy 62% | 9 (theo tốc độ) |
| **100%** | **0** |
| không đo được (thanh vạch không dùng) | **0** |

Vệt là dấu hiệu **đang có việc xảy ra** — chưa bắt đầu thì chưa có gì, xong rồi thì không còn gì. **Trang trí thì lúc nào cũng sáng; cái này tự tắt** ⇒ nó là **trạng thái**, không phải hoa văn. Có test canh (`[11]`: tổng cường độ vệt phải = 0 ở cả 0%, 100% và không-đo-được).

### 2.3 · Cách "làm sáng" chọn được cho CẢ HAI theme — không phải pha về trắng

`color-mix(in oklab, var(--accent), var(--t1) X%)` — pha về **`--t1`, màu MỰC của theme**:
- nền **tối**: `--t1` gần trắng ⇒ mút **sáng** lên
- nền **sáng**: `--t1` gần đen ⇒ mút **đậm** lên

**Cả hai chiều đều là TĂNG TƯƠNG PHẢN với nền.** Pha về trắng thì nền sáng sẽ mất chữ — đúng cái bẫy ràng buộc 3 cảnh báo. Cảm giác "phát sáng" ở nền sáng do **quầng màu nhấn** gánh.

⇒ Giữ nguyên lối tư duy lượt 2 đã dùng khi chọn bậc chiều cao thay vì sửa bằng màu: **chỉ gọi token, không hex cứng** ⇒ hiệu ứng **đúng bất kể mòng két chốt hex nào**. Kèm `@supports not (color-mix…)` rơi về màu nhấn trần.

### 2.4 · Sáu ràng buộc — đo từng cái

| # | Ràng buộc | Bằng chứng đo được |
|---|---|---|
| 1 🔴 | **Ba tầng không lẫn** | quầng thanh **7px** quanh vạch 5px ↔ tầng ② **22px + 44px** quanh chu vi card — chênh 3–6× bán kính, khác chỗ đứng (**ruột, theo đường ngang** ↔ **viền, quanh chu vi**), khác chuyển động (tầng ③ `animation: vong`, tầng ② tĩnh). Ba kênh cùng tách. |
| 2 🔴 | **Hai loại vẫn tách bằng hình thái** | vạch rời đếm được (48 phần tử) ↔ rai liền gradient. Loại không-đo-được: `aria-valuenow = null`, **0 ký tự số** trong text. Không đụng. |
| 3 | **≥3:1 vạch sáng ↔ vạch tắt, cả 2 theme** | xem bảng 2.5 — đạt ở **mọi** trạng thái, kể cả nấc giảm chói |
| 4 | **Nấc giảm chói, độ đọc thắng độ đẹp** | prop `doSang='diu'` — mút↔tắt 6,31 → 4,87 (tối), vẫn ≫3:1; **giữ nguyên** bậc chiều cao · vị trí mút · hướng vệt |
| 5 | **Bản tĩnh sáng đúng mức, cấm nhấp nháy** | `animation: none`, **gỡ mặt nạ**, `opacity .78` (không phải .5), rai nở full 191px, vạch **vẫn giữ quầng**. Đúng một trạng thái tĩnh. |
| 6 | **Đúng bất kể hex mòng két** | 0 hex trong `LightBar.tsx`; mọi màu qua `var(--accent)` / `var(--t1)` |

### 2.5 · Bảng tương phản — trước ↔ sau, cả hai theme, cả hai nấc chói

| | Nền TỐI | Nền SÁNG |
|---|---|---|
| **nguội ↔ tắt** (lượt 1) | 2,64 ❌ *dưới 3:1* | 5,22 ✅ |
| **nguội ↔ tắt** (lượt 2) | **3,69 ✅** | **6,13 ✅** |
| mút ↔ tắt | 6,31 ✅ | 8,12 ✅ |
| mút ↔ nền | 7,19 | 11,01 |
| *nấc giảm chói* · nguội ↔ tắt | **3,69 ✅ (không đổi)** | **6,13 ✅ (không đổi)** |
| *nấc giảm chói* · mút ↔ tắt | 4,87 ✅ | 7,07 ✅ |

🔧 **Một lần tự sửa nguyên tắc, giữa lượt**: bản đầu cho nấc giảm chói nhân **cả** `PHA_NEN` lẫn `PHA_THEM` với 0,5 — làm thế thì hạ chói **kéo tụt luôn** tương phản vừa mới sửa được. Đổi thành: **nấc giảm chói chỉ hạ `PHA_THEM` và quầng, KHÔNG hạ `PHA_NEN`**. Bảng trên cho thấy dòng "nguội ↔ tắt" **đứng yên** khi bật nấc dịu. ⇒ Luật rút ra, đã ghi vào cả code lẫn bản vẽ: **giảm chói cắt ÁNH KIM, không bao giờ cắt ĐỘ ĐỌC.**

### 2.6 · Bản vẽ — mục 6 mới "trước ↔ sau"

`docs/mocks/mock-thanh-tien-trinh.html` thêm hẳn một mục, bày cạnh nhau:
- **TRƯỚC** (`data-cu="1"`): màu phẳng, **1** vạch có quầng
- **SAU**: hai dòng **cùng 62%** khác nhau độ dài vệt (**2** ↔ **9** vạch có quầng) — thấy ngay tin tốc độ
- **XONG thì tắt hẳn**: 0% · 62% · 100% xếp dọc, chỉ dòng giữa sáng
- **Ba tầng vẫn không lẫn** sau khi thêm sáng, đủ 2 theme
- **Nút gạt thứ ba "Nấc giảm chói"** để Hoà tự bật xem

## 3 · TỔNG KẾT LẠI VẤN ĐỀ

Yêu cầu nghe như chuyện thẩm mỹ ("thêm sáng"), nhưng trong hệ IF nó **không được phép** chỉ là thẩm mỹ — NT-11 cấm glow trang trí. Nên câu hỏi phải đổi thành: *ánh sáng này nói thêm được điều gì mà trước đó chưa nói?*

Trả lời được thì thiết kế tự ra: chỗ sáng nhất = **chỗ việc đang diễn ra**, vệt phía sau = **hướng**, độ dài vệt = **tốc độ**. Và phép thử để biết mình không tự lừa mình là: **xong việc thì nó phải tắt**. Trang trí thì lúc nào cũng sáng.

Điều đáng ghi nhất: khi đi theo đúng ràng buộc đó, hiệu ứng **hoá ra sửa luôn một lỗ a11y** mà lượt trước phải vá bằng kênh chiều cao. Không phải may — nó là hệ quả của việc chọn *pha về màu mực của theme* thay vì *pha về trắng*, tức chọn theo **tương phản** chứ không theo **độ chói**. Đẹp và đọc được ở đây không đánh nhau vì đã định nghĩa "sáng" theo hướng đúng ngay từ đầu.

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:**
- Tương phản tăng ở **cả hai** theme, không đánh đổi đầu nào (3,69 và 6,13).
- Hiệu ứng **tự tắt khi xong** — có test canh, nên không trôi thành trang trí ở các phiên sau.
- Nấc giảm chói giữ **nguyên vẹn** mọi kênh thông tin.
- 0 hex cứng ⇒ chốt mòng két xong không phải vẽ lại.
- Lõi thêm 22 ca test (42 → **64**), gồm 2 bộ bất biến quét 210 và 4×30 tổ hợp.

**Chưa được / rủi ro:**
- 🟡 **`color-mix` + `oklab` là tính năng mới của trình duyệt.** Máy đích là Electron 33 (Chromium 130) nên chạy tốt; đã có `@supports` rơi về màu nhấn trần. Nhưng **chưa kiểm trên Electron thật**, chỉ trên trình duyệt của khung xem trước.
- 🟡 **Tin ③ (tốc độ) là quy ước phải học.** Vệt dài = nhanh mượn từ nhoè-chuyển-động, trực giác nhưng **không hiển nhiên**. Chưa có ai ngoài P-H nhìn thử. Nếu Hoà đọc không ra thì tin ③ thành trang trí — và lúc đó **phải bỏ**, không được giữ lại vì đẹp.
- 🟡 **Đo tốc độ bám nhịp render của React**, không phải nhịp thật của công việc. Nơi gọi cập nhật `%` thưa (vd. 1 lần/giây) thì vệt nhảy bậc thay vì mượt. Chưa gặp vì chưa nối vào nơi gọi thật.
- 🔴 **Vẫn chưa chạy trên app thật** — nguyên si rủi ro lượt 1, nay còn thêm phần vệt.
- 🟢 **Không đụng `app/globals.css`** dù T cho phép. Lý do: không cần (keyframes cục bộ theo `useId` đã đủ, và mọi màu tính bằng token), mà file đó **đang bị phiên phụ khác sửa cùng lúc** (`git status` cho thấy `M app/globals.css` không phải của P-H). Ghi rõ để T biết đây là **lựa chọn có ý thức**, không phải bỏ sót.

## 5 · HƯỚNG XỬ LÝ NHIỀU GÓC ĐỘ

**Hướng A — giữ đủ ba tin, để Hoà duyệt mắt rồi cắt bớt nếu thừa.**
· *Được:* trình đúng thứ Hoà yêu cầu ở mức đầy đủ nhất; tin ③ chỉ tốn một hàm thuần có test, cắt sau rất rẻ.
· *Mất:* nếu tin ③ không đọc ra thì đó là chi tiết không mang tin — đúng thứ nguyên tắc `simpleCoChiTiet` cấm.

**Hướng B — bỏ tin ③ ngay, chỉ giữ ① và ②.**
· *Được:* an toàn tuyệt đối với NT-11; bỏ luôn `useRef` đo tốc độ, component thành thuần.
· *Mất:* vứt đi kênh thông tin duy nhất trong IF nói được tốc độ mà không cần số — và vứt **trước khi** ai kịp nhìn thử.

**Hướng C — cho tin ③ ra sau một cờ, mặc định tắt.**
· *Được:* không rủi ro.
· *Mất:* thêm một prop mà không ai bật thì bằng không có; và là đúng kiểu "làm cho có" mà phiếu này vốn chống.

## 6 · ĐỀ XUẤT HƯỚNG TỐT NHẤT

**Chọn A**, kèm một câu hỏi **rất cụ thể** cho lượt duyệt mắt.

Vì bản vẽ đã bày sẵn phép thử: mục 6 có **hai thanh cùng ở 62%, khác nhau độ dài vệt**. Chỉ cần hỏi Hoà đúng một câu — *"hai thanh này khác nhau ở chỗ nào, và nó nói lên điều gì?"* Đọc ra tốc độ thì tin ③ **được chứng minh**, giữ. Không đọc ra thì **cắt**, và cắt gọn: xoá `doDaiVet` + `useRef`, để `vet` cố định — dưới 10 dòng, không đụng gì khác.

B loại vì nó vứt đi **trước khi** thử, mà chi phí thử ở đây gần bằng không (bản vẽ đã dựng xong, chỉ tốn một câu hỏi). C loại vì một cờ mặc định tắt thì không ai bật — bằng không có, mà lại thêm một nhánh phải nuôi.

## ⑥b VÒNG TỰ ĐÓNG — LƯỢT 2

**Đóng ở vòng 3/5.**

| Vòng | Trọng tài bắt gì | Xử |
|---|---|---|
| 1 | Bản đầu của quy tắc CSS pha màu **sai cú pháp** (`calc` thừa một dấu ngoặc, và nhồi phép tính phần trăm vào `color-mix` qua biến) | bỏ `calc` trong CSS; cho JS của bản vẽ tính sẵn phần trăm rồi gán thẳng — **cùng công thức với `LightBar.tsx`** |
| 2 | Đo lại tương phản ở nấc **giảm chói**: hạ cả `PHA_NEN` sẽ kéo tụt tương phản vừa sửa được ở lượt 1 | nấc giảm chói **chỉ** hạ `PHA_THEM` + quầng. Đo lại: dòng "nguội ↔ tắt" **đứng yên** 3,69 / 6,13 |
| 3 | Quét rộng toàn trang (1672 phần tử) thay vì chỉ các mục đã chọn: **13 mục 3,88:1** — chrome của trang (`h2` · `th` · `.note` · caption nút), chép từ bộ nền | `#6e6e78` → `#9e9ea8` cho 4 selector chrome. **KHÔNG** đụng dòng khai token `--t4` |

**Kết quả cuối:**
```
$ npx tsc --noEmit                            → 0 lỗi
$ sucrase-node lib/ui/tien-trinh.test.ts      → ✅ 64 pass · 0 fail   (lượt 1: 42)
$ npm test                                    → exit 0               (T đã vá lọc .claude/worktrees)
$ npm run soi:tu-dien                         → ✅ 0 lệch định nghĩa
$ npm run soi:hinh-hoc                        → 283 file · 998 radius · 10 ngoài thang   (nền: 10 → +0)
$ npm run soi:thao-tac                        → 🔴 2 lệch: 31 file focus-visible · 193× hex   (nền → +0)
quét bản vẽ: 0/1672 phần tử chữ dưới 4,5:1 hoặc dưới 11px · 0 tràn ngang ở 1440 và 720
```

**File đã ghi ở lượt 2:** `lib/ui/tien-trinh.ts` · `lib/ui/tien-trinh.test.ts` · `components/ui/LightBar.tsx` · `docs/mocks/mock-thanh-tien-trinh.html` · báo cáo này.
**Không đụng:** `app/globals.css` (có ý thức, xem §4) · `LightArc.tsx` (lượt 2 không sửa thêm dòng nào) · `Tooltip.tsx` · `ToolbarChip.tsx` · `frontier-registry.mjs` · `render-studio/*` · mock khác · `STATUS.md` · `00-CHOT.md`. Không chạy lệnh git ghi, không khởi động dev server.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — LƯỢT 2

1. 🔴 **Tin ③ (vệt dài = nhanh) CHƯA ai xác nhận đọc ra được.** Đây là giả định về nhận thức, không phải số đo. Phép thử đã dựng sẵn trong bản vẽ; kết quả quyết định giữ hay cắt. **Không tự cho là đúng.**
2. 🟡 **`color-mix(in oklab, …)` chưa kiểm trên Electron thật**, chỉ trên trình duyệt của khung xem trước. Có `@supports` rơi về màu nhấn trần, nhưng **đường rơi đó cũng chưa chạy thử lần nào**.
3. 🟡 **Nhịp đo tốc độ = nhịp render React**, chưa phải nhịp thật của công việc. Chưa quan sát được vì chưa nối nơi gọi thật.
4. 🟡 **Bản vẽ mô phỏng vệt ở độ dài CỐ ĐỊNH** (`data-vet`), trong khi app suy từ tốc độ thật. Bản vẽ và component nay chép **hai** công thức của nhau (`chiaVach` và `cuongDoVach` + hằng `PHA_NEN`/`PHA_THEM`) — **rủi ro phân kỳ tăng so với lượt 1**, đã ghi cảnh báo ngay trong `<script>` nhưng **không có máy nào canh**.
5. 🟢 Ba máy soi **không kiểm được** thứ vừa làm: không máy nào soi "ánh sáng có mang tin không". Đó vẫn là việc của mắt Hoà.
6. Giữ nguyên hiệu lực mọi mục ⑦b của lượt 1 (chưa chạy app thật · `prefers-reduced-motion` thật chưa kích hoạt · danh sách 15 file thiếu chỉ báo là **sàn dưới** · chưa kiểm VoiceOver).

## ⑦c HẠN DÙNG KẾT LUẬN — LƯỢT 2

Giữ nguyên 6 điều của lượt 1, thêm ba:

7. **Khi Hoà duyệt mắt mục 6 bản vẽ.** Nếu tin ③ không đọc ra thì phần đo tốc độ **phải cắt** — và kết luận "ánh sáng mang ba tin" trong báo cáo này **hết đúng**, còn hai tin.
8. **Khi có nơi gọi cập nhật `%` thưa hơn ~2 lần/giây.** Lúc đó nhịp đo tốc độ bám nhịp render sẽ lộ giật; công thức `doDaiVet` phải xét lại (làm mượt, hoặc lấy trung bình vài lần đo).
9. **Khi một tính năng khác trong IF cũng muốn dùng quầng sáng ở vùng nội dung.** Hiện thanh độc quyền "quầng nhỏ ≤7px trong ruột card"; thêm cái thứ hai vào cùng vùng thì bảng phân vai ba tầng phải mở lại — đúng như đã ghi ở lượt 1 về presence.
