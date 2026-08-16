# P-H · THANH TIẾN TRÌNH — HAI LOẠI, CẤM BỊA PHẦN TRĂM

> Phiếu theo khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md` (ô ⓪/⓪b + 8 ô). Tự chứa — không cần hỏi T.
> **THẺ VAI [Đ4]:** bạn là **phiên phụ cấp CHẶNG/LUỒNG**, vùng `components/ui` + `docs/mocks`.
> Chạm biên liên chặng (đổi luồng hàng đợi render, đổi token globals.css, đổi registry) → **DỪNG + đề xuất lên T**.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG — trả lời TRƯỚC mọi thứ khác

Bạn làm việc **trong cây chính** `/Users/tranben/Downloads/interiorflow` (KHÔNG worktree riêng).

```bash
git log --oneline -1              # phải ra: 895fbaf
git rev-list --count HEAD..main   # phải ra: 0
```
Lệch > 0 → **DỪNG NGAY**, báo T.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận/bác bỏ, một dòng mỗi ý

1. *"IF **đã có** `components/ui/LightArc.tsx` (110 dòng) làm chỉ báo tiến độ dạng **vòng cung**, và nó đã nhận `value` có thể **undefined** để chỉ trạng thái không-đo-được — bằng chứng: `RenderQueuePanel.tsx:120` truyền `value={running ? running.progress*100 : activeCount>0 ? undefined : 100}`. Vậy **logic hai loại đã tồn tại**, cái thiếu là **hình thái THANH** và một luật chung."*
2. *"Ngoài `LightArc`, `components/ui/` **không có** component tiến trình nào khác (`ls components/ui` = 11 file, `grep -rl progress components/ui` chỉ ra `LightArc.tsx`) ⇒ đây là chỗ đúng để đặt, và **cấm đẻ bộ logic thứ hai**."*
3. *"Hai chỉ báo phải **phân vai, không giẫm nhau**: **viền card chạy sáng** = 'card này đang chạy', nhìn TỪ XA · **thanh tiến trình** = 'còn bao lâu nữa', nhìn GẦN. Một card đang render có CẢ HAI và không đánh nhau."*

Bác bỏ ý nào → **DỪNG**, báo T kèm `file:dòng`.

## ① BỐI CẢNH NGÀNH

Hoà chốt 16/08, nguyên văn: *"cái gì đang chạy cũng phải có thanh thể hiện tiến trình, thanh đó là cái mà người dùng hay nhìn chăm chăm vào nên phải có hiệu ứng, cảm giác light nhẹ, fast."*

KTS chạy render / xuất PDF / gọi AI rồi **ngồi nhìn**. Không có thanh thì họ đoán, và đoán sai thì họ bấm lại — sinh job trùng, tốn credit thật.

🔴 **Ranh giới đắt nhất của phiếu này**: **CẤM BỊA PHẦN TRĂM.** Việc **đo được** (tải tệp · xuất PDF · hàng đợi render) chạy theo **số thật**, có % và thời gian còn lại. Việc **không đo được** (gọi AI · dò tệp · chờ máy chủ) phải có **dạng KHÁC HẲN**, chạy vô hạn, **KHÔNG có số**. Bịa % là vi phạm luật khai-thật; người dùng phát hiện một lần thì **mất niềm tin vào mọi con số khác trong app** — mà IF bán chính cái "con số truy được về một nguồn".

## ② ĐỌC TRƯỚC (bắt buộc)

| File | Vì sao |
|---|---|
| `components/ui/LightArc.tsx` (đọc HẾT) | nền phải dùng lại; xem nó xử `value === undefined` ra sao, có `label` a11y không |
| `components/render-studio/RenderQueuePanel.tsx:110-130` và `:290-300` | ca dùng thật: `job.progress` là 0..1, `pct = Math.round(job.progress*100)` |
| `components/render-studio/CameraExportTab.tsx:189` | ca thứ hai: `done/total` |
| `docs/00-CHOT.md` — 3 chốt 16/08: **"MỌI VIỆC ĐANG CHẠY PHẢI CÓ THANH TIẾN TRÌNH"** · **"BA TẦNG ÁNH SÁNG CỦA KÍNH"** · **"SIMPLE NHƯNG CÓ CHI TIẾT THÚ VỊ"** | luật + phân vai |
| `docs/mocks/mock-bo-nen-chung.html` | bộ nền chờ Hoà duyệt — bản vẽ của bạn phải nối vào, cùng token |
| `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` | hiến pháp giao diện = cửa nghiệm thu |

## ③ VÙNG FILE — KHOÁ PHẠM VI

**ĐƯỢC ghi:**
- file MỚI `components/ui/LightBar.tsx` (+ test)
- file MỚI `lib/ui/tien-trinh.ts` (lõi chung, nếu bạn tách — xem V1)
- `components/ui/LightArc.tsx` — **CHỈ** khi cần rút lõi chung ra; **cấm đổi API công khai** đang được 2 nơi dùng
- `app/globals.css` — **CHỈ THÊM** class mới cho thanh. Cấm sửa/xoá biến token, cấm đụng khối khác.
- `docs/mocks/mock-thanh-tien-trinh.html` (mới)
- `docs/bao-cao-phien/2026-08-16-P-H-thanh-tien-trinh.md` (mới)

**CẤM đụng:** `components/ui/Tooltip.tsx` · `components/ui/ToolbarChip.tsx` (**P-G đang giữ**) · `scripts/frontier-registry.mjs` · `components/render-studio/*` · mọi mock khác · `STATUS.md` · `docs/00-CHOT.md`.

## ④ VIỆC

### V1 — MỘT lõi, HAI mặt tiền (marker: `tienTrinh`) [Đ2]
Đừng viết bộ logic thứ hai. Rút phần chung — *"có số thật hay không"*, kẹp 0..100, làm tròn, chuỗi a11y — thành **một nguồn**, rồi:
- `LightArc` = mặt tiền **vòng cung** (giữ nguyên API, 2 nơi đang dùng phải không đổi một dòng)
- `LightBar` = mặt tiền **thanh** (mới)

Nếu sau khi đọc `LightArc.tsx` bạn thấy tách lõi ra **đắt hơn lợi** (lõi quá mỏng), thì **được phép không tách** — nhưng phải **nói thẳng trong báo cáo vì sao**, kèm số dòng thật. Đây là quyết định của bạn, không phải chỗ im lặng.

### V2 — Hình thái thanh: DÃY VẠCH, không phải khối đặc (marker: `LightBar`)
Đúng cảm giác Hoà mô tả (*nhẹ · nhanh*), theo ảnh tham chiếu:
- thanh = **dãy vạch nhỏ liên tiếp** (không phải một mảng đặc trơn)
- vạch **đã chạy**: sáng · vạch **chưa chạy**: xám mờ
- **điểm sáng ở đầu mút** ranh giới giữa hai phần
- Nhẹ vì không có mảng đặc; nhanh vì mắt đọc được từng vạch tiến lên.
- Chi tiết phải **MANG TIN**, không phải hoa văn (nguyên tắc `simpleCoChiTiet`): mỗi vạch là một đơn vị đọc được, điểm sáng nói *đang ở đâu*.

### V3 — HAI LOẠI, nhìn-là-phân-biệt-được (marker: `khongDoDuoc`) 🔴
- **Đo được**: vạch chạy theo số thật + hiện **%**; nếu nơi gọi truyền được thời gian còn lại thì hiện, **không tự bịa ETA**.
- **Không đo được**: **hình thái khác hẳn** — không phải "cùng thanh đó nhưng giấu số". Gợi ý: một cụm vạch ngắn trôi dọc thanh, không có mốc đầu-cuối. **Tuyệt đối không có con số nào.**
- API phải khiến việc bịa % **khó xảy ra**: nơi gọi không có số thật thì **không truyền `value`** (undefined) — chứ không phải truyền một số đoán.
- **Điểm nghiệm thu**: trong bản vẽ đặt **hai loại cạnh nhau**, người xem phải phân biệt được **mà không cần đọc chữ**.

### V4 — Phân vai với viền chạy (marker: `vienChay`)
Bản vẽ phải chứng minh **ba tầng ánh sáng không lẫn nhau** (chốt 16/08):
| Tầng | Khi nào | Nghĩa | Hình thức |
|---|---|---|---|
| ① kính nhận sáng | luôn luôn | **chất liệu** | mép trên bắt sáng, bề mặt đổi theo thứ nằm dưới |
| ② viền sáng **đứng yên** | trỏ vào | **bấm được** | quầng sáng lan quanh viền, **mặt card không đổi** |
| ③ viền **CHẠY** vòng | đang render | **đang chạy** | ánh sáng chạy liên tục quanh viền |
Mắt phân biệt ②/③ bằng **CHUYỂN ĐỘNG**, không bằng chỗ đứng (cả hai đều ở viền).
Thanh tiến trình nằm **trong** card, cùng lúc với ③, và **không đánh nhau**.

### V5 — Trợ năng + giảm chuyển động
- `role="progressbar"` + `aria-valuenow/min/max` khi **đo được**; khi **không đo được** thì **bỏ `aria-valuenow`** (đúng chuẩn ARIA cho indeterminate) + `aria-label` nói rõ việc gì đang chạy.
- `prefers-reduced-motion`: loại **chạy vô hạn** là thứ **đầu tiên phải tắt**, thay bằng **dấu hiệu tĩnh** vẫn nói được "đang chạy". Tầng ③ viền chạy cũng vậy.
- Màu **không được là kênh duy nhất**: trạng thái lỗi/xong phải có **chữ hoặc hình dạng** kèm.

### V6 — Bản vẽ (marker: `@dsCard`)
`docs/mocks/mock-thanh-tien-trinh.html`, **dòng đầu tiên**:
```html
<!-- @dsCard group="Thanh tiến trình" -->
```
Bắt buộc: **đủ 2 theme** (có nút gạt) · **token thật từ `app/globals.css`**, cấm hardcode hex · chụp ở 1440×900 · có **nút gạt giả lập `prefers-reduced-motion`** để Hoà thấy bản tĩnh.
Bày cạnh nhau: ① thanh đo được có % ② thanh không đo được ③ cả hai đặt trong card đang render (có viền chạy) ④ card chỉ hover (viền đứng yên) — chứng minh không lẫn.
T sẽ đẩy file lên Claude Design; bạn **không có** tool `DesignSync`, đừng đi tìm.

### V7 — KHÔNG thay thế nơi gọi hiện có
Đây là phiếu **dựng khuôn + trình duyệt mắt**. **KHÔNG** đi sửa `RenderQueuePanel` / `CameraExportTab` sang dùng `LightBar` — đó là biên liên chặng, làm sau khi Hoà duyệt mắt. Được phép **đề xuất** danh sách nơi nên nối, trong báo cáo.

## ⑤ RÀNG BUỘC

- **KHÔNG chạy git.** **KHÔNG khởi động dev server.** **KHÔNG sửa `frontier-registry.mjs`.**
- Màu qua **biến CSS**, cấm hex. Thang bo **6/10/14/20 + `--r-full`**, `rInner = max(4, rOuter − pad)`.
- Chữ Việt: cấm hoa toàn phần, `line-height ≥ 1.5`, không tracking âm. Số dùng `tabular-nums`.
- **Song ngữ VI/EN** cho chuỗi mới lộ ra UI.
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`**: **[T1] một-nguồn** (một lõi hai mặt tiền) · **[N1] human-centric** (khai thật, không bịa số) · **[Đ2] nhìn-vào-trong-trước** (LightArc đã có). Mở file, trích **nguyên văn** vào báo cáo — mã khác với T ghi thì báo lại đúng mã.

## ⑥ NGHIỆM THU TỰ LÀM

```bash
npx tsc --noEmit
npm test -- LightArc
npm test -- LightBar
npm run soi:tu-dien
npm run soi:hinh-hoc
npm run soi:thao-tac
```

## ⑥b ĐIỀU KIỆN ĐÍCH — VÒNG TỰ ĐÓNG

**ĐÍCH:** `tsc` 0 lỗi · test liên quan 0 fail · **2 nơi đang dùng `LightArc` không đổi một dòng** (chứng minh bằng `git diff --stat` — chỉ ĐỌC, không commit) · `soi:tu-dien` 0 lệch · `soi:hinh-hoc` và `soi:thao-tac` **không thêm lệch mới** (nợ cũ 31 focus-visible · 193 hex — file mới **không góp thêm**) · mock tự chấm bằng `design:design-critique` + `design:accessibility-review`.

**VÒNG:** chưa đạt → tự sửa, chạy lại, **trần 5 vòng**.
**QUÁ TRẦN → DỪNG**, nộp kèm bảng *"vòng nào hỏng vì gì"*. **CẤM** khai đạt khi chưa đạt; **CẤM** sửa test hoặc nới điều kiện cho qua cửa.

## ⑦ BÁO CÁO

`docs/bao-cao-phien/2026-08-16-P-H-thanh-tien-trinh.md`, **khuôn 6 phần** `docs/CLAUDE.md`. Dán nguyên văn kết quả lệnh.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc, trống cũng ghi "không có"

Bắt buộc phủ: quyết định **tách hay không tách lõi** dựa trên **số dòng đo được**, không phải cảm giác · hành vi `prefers-reduced-motion` là **đo** hay **suy** · nơi nào trong app đang chạy việc **mà chưa có** chỉ báo nào (bạn tìm được bao nhiêu, và **chắc chắn chưa quét hết chỗ nào**).

## ⑦c HẠN DÙNG KẾT LUẬN

*"Kết luận này hết đúng khi …"* — ít nhất phủ: khi màu nhấn thứ hai (mòng két) được chốt hex · khi bộ nền `mock-bo-nen-chung.html` được duyệt/bác · khi entry `card-kinh-gradient` (viền chạy) được thi công thật.

## ⑧ DÂY MÁY

Entry registry: **`thanh-tien-trinh-hai-loai`** (T mở, bạn **không** sửa) · liên đới `card-kinh-gradient` (viền chạy màu chặng render) · `hover-gradient-kem` (viền sáng khi trỏ — **đã đính chính**: gradient đổi sang màu nhấn mới, **không còn là kem**) · `nut-cong-tren-day` (đèn tiến trình từng bước của chuỗi node ăn theo khuôn này).
