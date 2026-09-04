# SHELL WRITER — lớp bề mặt nổi dùng chung (kính · chuyển động từ nguồn · hiện dần · nén dần)

**Ngày** 20/08 · **Vai** SHELL WRITER (người duy nhất được dựng lớp bề mặt nổi)
**Vùng ghi** `components/ui/**` · `app/globals.css` (chỉ token kính/nhịp) · `lib/ui/**` · route thử mới
**Không đụng** `components/nav/**` · `components/studio/AppChrome.tsx` · `components/home/**` · `lib/capabilities/**` · git · prisma · server :3001

---

## ⓪ TIỀN ĐỀ — xác nhận / bác bỏ

| Giả định của phiếu | Kết quả |
|---|---|
| IF đã có kính chạy thật, đây là EXTEND không phải NEW | ✅ **ĐÚNG** — `--nen-mo-header/panel/card/overlay` + 4 class + `--blur/--blur-strong` (globals.css), 14 tệp dùng `backdrop-filter` |
| Bài học K1-K4 phải giữ | ✅ **ĐÚNG và đã thi hành** — xem §2 |
| Vùng lane khác không được đụng | ✅ giữ — `grep kinh-noi` chỉ ra 2 tệp, cả hai do phiên này tạo |

🔴 **MỘT TIỀN ĐỀ NGẦM CỦA PHIẾU SAI, đã sửa giữa lượt:** phiếu bảo "test cho phần thuần".
Tôi viết bằng **vitest** → chạy xanh 24/24. Nhưng `vitest` **KHÔNG có trong `node_modules`**
(`npx` tải tạm về), còn `npm test` của repo chạy **mọi** `*.test.ts` qua `sucrase-node`.
⇒ Hai tệp test đó **sẽ làm đỏ toàn bộ `npm test`** cho mọi phiên khác. Đã viết lại theo khuôn nhà
(`lib/boq/compute.test.ts`). Bài học: *test xanh trên máy mình không có nghĩa nó xanh trong bộ máy của repo — phải kiểm bằng ĐÚNG lệnh repo dùng.*

---

## ① VIỆC ĐÃ LÀM

### Nguyên thể — 4 tệp mới + token

| Tệp | Vai |
|---|---|
| `lib/ui/nhip.ts` | thang nhịp theo VAI TRÒ + **phép mọc-từ-nguồn** (thuần, test được) |
| `lib/ui/hien-dan.ts` | thứ tự 6 bậc hiện dần + 3 trạng thái nén dần (thuần) |
| `components/ui/BeMatNoi.tsx` | **bề mặt kính nổi** — portal + mọc từ nguồn |
| `components/ui/HienDan.tsx` | bọc một mẩu nội dung, khai bậc là xong |
| `components/ui/MucNenDan.tsx` | một mục trong chuỗi cổng, 3 trạng thái |
| `app/globals.css` | họ `.kinh-noi` + token `--kinh-*` + `--nhip-*` |
| `app/thu-be-mat/page.tsx` | **mẫu sống** — 4 nền thật × 3 nấc × 3 tầng ánh sáng |

### Kính MANG NGHĨA, không phải trang trí
Ba nấc độ đặc chọn theo **LƯỢNG CHỮ đứng trên**, không theo cỡ hình:
`--kinh-mong .84/.88` (ít chữ) · `--kinh-vua .90/.93` · `--kinh-dac .95/.96` (dày chữ/số).
Docstring `BeMatNoi.tsx` ghi thẳng: **thẻ nội dung thường trực GIỮ ĐẶC**, đừng bọc vào cho đẹp.

### Ba tầng ánh sáng — tách bạch, và bày cạnh nhau để soi
| Tầng | Khi nào | Nghĩa | Hình thức |
|---|---|---|---|
| ① | luôn có | **chất liệu** | mép trên bắt sáng (`::before` gradient tắt dần, không phải `border-top`) |
| ② | trỏ vào | **khả năng** | quầng sáng viền **ĐỨNG YÊN**, mặt kính không đổi |
| ③ | đang chạy | **trạng thái** | ánh sáng **CHẠY** vòng viền |

⚠️ ② và ③ **cùng ở viền** ⇒ phân biệt bằng **CHUYỂN ĐỘNG, không bằng màu**. Mắt bắt chuyển động
nhanh hơn bắt màu, và cách này còn sống với người không phân biệt được màu.

---

## ② BA BÀI HỌC K1-K4 — giữ nguyên, không phát hiện lại bằng đường đau

| Bài học | Thi hành ở đâu |
|---|---|
| fade kính phải fade ở **CHÍNH phần tử**, không ở cha | `BeMatNoi.tsx` — `transition` + `opacity` đặt trên chính `.kinh-noi`, wrapper không có opacity |
| panel kính nổi **PHẢI portal** ra ngoài | `createPortal(…, document.body)` — **không phải tuỳ chọn**, ghi rõ trong docstring |
| luôn kèm `-webkit-` | mọi `backdrop-filter` trong họ `.kinh-noi` đều có cặp |
| G1: không animate `opacity` trên phần tử có `backdrop-filter` | tầng ③ dùng `box-shadow`-pulse, cùng công thức `.node-running-halo` sẵn có |

---

## ③ 🔴 PHÁT HIỆN LỚN — `--t3` KHÔNG DÙNG ĐƯỢC LÀM CHỮ TRÊN KÍNH

**Đo trên app thật** (:3001, 4 nền × 2 theme, lấy nền **xấu nhất** của mỗi môi trường):

| | kính mỏng | kính vừa | kính đặc |
|---|---|---|---|
| `--t3` nền **Tối** | **4.08** ❌ | 5.02 | 5.86 |
| `--t3` nền **Sáng** | **3.83** ❌ | **4.30** ❌ | 4.65 |

**Gốc bệnh KHÔNG phải kính**: `--t3` trên nền **ĐẶC** ở theme Sáng chỉ được **4.90** — chính token
đã sát ngưỡng 4.5, **không còn biên**; kính ăn thêm ~0.5-1.0 điểm là rơi xuống dưới.
⇒ **Tăng độ đặc không cứu được** (đặc nhất cũng chỉ lên 4.65).
Phải đổi **chính màu chữ** — đúng thứ tự ưu tiên đã đặt: **đọc được thắng trong suốt**.

**Cách chữa — chặn ở GỐC, không chặn bằng lời dặn:**
```css
.kinh-noi { --t3: var(--kinh-chu-phu); }   /* Tối #b4b4bd · Sáng #5c564d */
```
Nơi dùng cứ viết `color: var(--t3)` theo phản xạ và **tự động đọc được**, không phải nhớ luật.
Đo lại: **5.26 (Tối) · 5.34 (Sáng)** ở nền xấu nhất trên kính **mỏng nhất**.
✅ **Xác minh sống trên app**: ngoài kính `--t3` = `#726c62`, trong kính = `#5c564d`.
Bán kính ảnh hưởng = **0** (chỉ 2 tệp dùng `.kinh-noi`, cả hai của phiên này).

*Vì sao chọn cách này: `--t3` là màu chữ phụ mặc định của cả app — mọi lane sẽ gõ nó theo phản xạ.
Một lời dặn trong tài liệu thua một dòng CSS ở đúng chỗ.*

---

## ④ SỐ ĐO TƯƠNG PHẢN — 4 NỀN × 2 THEME (nền xấu nhất mỗi môi trường)

Ngưỡng: chữ ≥ **4.5**. `--t3` dưới đây là **giá trị SAU khi remap** (`--kinh-chu-phu`).

### Theme TỐI (`--bg #0c0c0e`)
| Nền | kính | `--t1` | `--t2` | `--t3`→phụ |
|---|---|---|---|---|
| ambient Home | mỏng/vừa/đặc | 9.94 / 12.23 / 14.29 | 7.48 / 9.20 / 10.74 | **5.26** ✅ |
| lưới 2D | ” | ” | ” | **5.26** ✅ |
| viewport 3D | ” | ” | ” | **5.26** ✅ |
| trang Trình chiếu | ” | ” | ” | **5.26** ✅ |

### Theme SÁNG (`--bg #f2efe9`)
| Nền | kính mỏng | kính vừa | kính đặc |
|---|---|---|---|
| ambient Home | t1 13.46 · t2 8.07 | 14.50 · 8.70 | 15.29 · 9.17 |
| lưới 2D | 12.22 · 7.33 | 13.74 · 8.24 | 14.83 · 8.90 |
| viewport 3D | 13.93 · 8.35 | 14.79 · 8.87 | 15.46 · 9.27 |
| trang Trình chiếu | 12.22 · 7.33 | 13.74 · 8.24 | 14.83 · 8.90 |
| `--t3`→phụ (mọi nền) | **5.34** ✅ | ≥5.34 ✅ | ≥5.34 ✅ |

**Sàn thấp nhất toàn bảng: 5.26** — trên ngưỡng 4.5 ở mọi ô.

*Cách đo: hoà `rgba` của kính lên màu nền xấu nhất theo alpha rồi tính tương phản WCAG 2.x, chạy
trong trang thật bằng `getComputedStyle` (đọc token sống, không chép hex). Nền xấu nhất mỗi môi
trường: ambient = tím `#7c3aed` + mòng két `#208089` + `--bg` · lưới 2D = trắng + đen + `--bg` ·
3D = 3 chặng gradient · Trình chiếu = trắng + đen.*

---

## ⑤ NGHIỆM THU

| Hạng mục | Kết quả |
|---|---|
| `npx tsc --noEmit` (lọc `components/home/**`) | **0 lỗi** |
| `sucrase-node lib/ui/nhip.test.ts` | **21 pass · 0 fail** |
| `sucrase-node lib/ui/hien-dan.test.ts` | **12 pass · 0 fail** |
| Browser thật :3001 `/thu-be-mat` | ✅ render, kính đúng, bảng nở từ đúng nút nguồn, `backdrop-filter: saturate(1.5) blur(16px)` áp thật |
| Remap `--t3` trong kính | ✅ xác minh sống (`#726c62` → `#5c564d`) |
| Ảnh chụp | theme Sáng nền ambient · theme **Tối** nền **viewport 3D** với bảng sâu 6 bậc |
| Dữ liệu thật | **không tạo/xoá gì** · server :3001 **không restart** |

**Test canh được thứ đáng canh** (không phải "hàm chạy không lỗi"):
- CSS ↔ TS khớp nhau — **đọc ngược `globals.css`** chứ không chép số ⇒ sửa một bên là đỏ
- nhịp nằm trong khung ms đã chốt · đóng luôn nhanh hơn mở
- giảm-chuyển-động ⇒ **mọi** nhịp về 0 và **mọi** bậc trễ 0
- gốc mọc: nguồn ở trên ⇒ nở xuống · nguồn ngoài màn bị kẹp · bề mặt cỡ 0 không chia-cho-0
- ba bậc đầu có mặt ở **mọi** nấc (nấc gọn tự đứng được) · nấc sâu không hiện ít hơn nấc nông
- đã-xong vẫn còn chỗ, **không** về 0

---

## ⑥ API — PHẦN CÁC LANE KHÁC PHẢI GỌI

> ⛔ `components/ui/BeMatNoi.tsx` là **NƠI DUY NHẤT** được dựng lớp kính nổi. Cấm tự chế.

### Bề mặt kính nổi
```tsx
import BeMatNoi from '@/components/ui/BeMatNoi';

const nguonRef = useRef<HTMLButtonElement>(null);
<button ref={nguonRef} onClick={() => setMo(!mo)}>Vitals</button>

<BeMatNoi
  mo={mo}                 // bắt buộc
  nguonRef={nguonRef}     // BẮT BUỘC — không có nguồn = mọc từ hư không = trái luật
  bac="vien"              // 'vien' | 'bang' | 'bangSau'  → quyết định NHỊP + độ sâu thu về
  rong={360}              // tuỳ chọn, luôn min(rộng, 100vw - 24px)
  doDac="mong"            // tuỳ chọn — mặc định suy từ bậc (vien→mỏng, bang→vừa, bangSau→đặc)
  dangChay={false}        // tuỳ chọn → tầng ③ ánh sáng chạy viền
  nhan="Vitals"           // BẮT BUỘC — nhãn cho trình đọc màn hình
>…</BeMatNoi>
```
Tự lo sẵn: portal ra body · đo & kẹp trong viewport (lật lên khi thiếu chỗ dưới) · mọc-từ-nguồn ·
thu-ngược-về-nguồn khi đóng · `prefers-reduced-motion`.

**Chỉ cần lớp kính tĩnh (không nổi/không portal)** — dùng class trực tiếp:
`.kinh-noi` · `.kinh-noi--mong` · `.kinh-noi--dac` · `.kinh-noi--bam-duoc` (tầng ②) ·
`.kinh-noi--dang-chay` (tầng ③).

### Hiện dần
```tsx
import HienDan from '@/components/ui/HienDan';
<HienDan bac="ketQua" nac="bang" mo={mo}>…</HienDan>
```
Bậc: `danhTinh → ketQua → doChac → quyetDinh → chiTiet → thongTinSau`.
Nơi dùng **chỉ khai bậc**; thứ tự · độ trễ · ẩn-hiện-theo-nấc do `lib/ui/hien-dan.ts` quyết.
⛔ Cấm tự `setTimeout` — đó là cách năm màn hình có năm nhịp.

### Nén dần
```tsx
import MucNenDan from '@/components/ui/MucNenDan';
<MucNenDan
  trangThai="daXong"        // 'dangToi' | 'dangLam' | 'daXong'
  ten="Định danh mảng"
  tomTat="Đã duyệt · 5 mảng"  // BẮT BUỘC khi daXong — là toàn bộ nội dung còn lại
  onMoLai={fn}                 // không truyền ⇒ nút mở lại MỜ + aria-describedby lý do thật
  lyDoKhoa="…"
>…</MucNenDan>
```
Dùng CHUNG cho **mọi** chuỗi cổng duyệt (Ảnh→Spec, Grounded Render, gói hồ sơ…).

### Nhịp
```ts
import { NHIP, thoiLuong, giamChuyenDong, DUONG_CONG } from '@/lib/ui/nhip';
```
CSS: `var(--nhip-bam|vien|bang|ngu-canh|bien-hinh)`.
⛔ **Cấm gõ số ms tại chỗ dùng** — sửa ở `lib/ui/nhip.ts` **và** `globals.css` (test canh cặp này).

### Màu chữ trên kính
`--t1` `--t2` dùng thoải mái. `--t3` **tự động** thành `--kinh-chu-phu` trong lòng `.kinh-noi` —
không phải làm gì. Muốn màu khác thì khai đè tại chỗ dùng, **và tự đo lại tương phản**.

---

## ⑦ TRẠNG THÁI

| | |
|---|---|
| Nguyên thể kính | **LIVE** |
| Chuyển động từ nguồn | **LIVE** |
| Hiện dần | **LIVE** |
| Nén dần | **LIVE** |
| Mẫu sống | **LIVE** — `/thu-be-mat` |

### ⑦b CHƯA CHẮC / CHƯA KIỂM

- 🔴 **`prefers-reduced-motion` CHƯA kích hoạt thật trên trình duyệt.** Lớp thuần đã có test
  (mọi nhịp về 0, mọi bậc trễ 0) và CSS có nhánh `@media`, nhưng **chưa ai bật cờ hệ điều hành
  rồi mở trang xem**. Đây đúng loại lỗi "có trong mã mà không tới được người dùng" mà 5 máy soi
  không bắt nổi — phải kiểm bằng thao tác thật.
- 🔴 **Chỉ đo Chromium.** Safari/Firefox là **suy**, chưa mở. `backdrop-filter` là chỗ Safari hay
  khác — có tiền tố `-webkit-` nhưng chưa xác minh trên máy Apple thật.
- 🟡 **Chưa thử trình đọc màn hình thật.** `role="dialog"` + `aria-label` + `aria-describedby`
  đúng theo hợp đồng, nhưng chưa nghe VoiceOver đọc.
- 🟡 **Số tương phản là TÍNH, không phải hút pixel từ màn.** Hoà `rgba` theo alpha rồi tính WCAG —
  chuẩn về công thức, nhưng chưa chứng minh trình duyệt tổng hợp **đúng như mô hình** (`saturate(150%)`
  của `backdrop-filter` **có** làm lệch màu nền lọt lên; ảnh hưởng nhỏ vì alpha ≥.84, chưa đo).
- 🟡 **Nền xấu nhất là tôi CHỌN, không phải quét ra.** 4 nền dùng màu đại diện; một ảnh render
  bão hoà cực đoan có thể nằm ngoài tập này. Sàn 5.26 có biên ~0.76 nên rủi ro thấp, chưa chứng minh.
- 🟡 **Chưa đặt bề mặt cạnh 2D/3D/Present THẬT** — mẫu sống dựng lại 4 nền, không mở màn thật.
- 🟡 Chưa thử **hai bề mặt mở cùng lúc** chồng nhau, và bề mặt ở **zoom canvas nhỏ**.

### ⑦c HẠN DÙNG KẾT LUẬN

| Kết luận | Hết hiệu lực khi |
|---|---|
| Bảng số tương phản §④ | **theme Sáng đổi sang bản canh-Apple** (đã chốt 16/08, chưa làm) ⇒ **đo lại toàn bảng** |
| `--kinh-chu-phu` #5c564d / #b4b4bd | như trên · hoặc khi `--t1..t5` đổi |
| 3 nấc alpha `.84/.90/.95` | khi có nền ảnh **thật** của người dùng (nay mới là gradient dựng) |
| "bán kính ảnh hưởng remap `--t3` = 0" | ngay khi lane khác bắt đầu dùng `.kinh-noi` — **phải rà lại** |
| Thang nhịp | Hoà duyệt mắt và thấy chậm/nhanh — số trong khung nhưng **chưa qua mắt Hoà** |

---

## ⑧ VIỆC ĐỀ XUẤT TIẾP (không tự làm — ngoài phạm vi)

1. **Bật `prefers-reduced-motion` thật + chụp lại** — lỗ duy nhất đáng lo trong phiếu này.
2. **Đặt `/thu-be-mat` cạnh 2D/3D/Present thật**, chụp vào `Drive/IF-duyet-mat/01-anh/`.
3. **Máy soi kính**: bắt `backdrop-filter` mới nằm ngoài họ `.kinh-noi` — chặn đúng cái Hoà lo
   ("ba agent tự chế ba hiện thực"). Nay chỉ có docstring, chưa có máy canh.
4. **Rà `--t3` trên nền bán trong suốt ở chỗ khác** — phát hiện §③ gợi ý token này thiếu biên
   ở mọi nền không-đặc, không riêng kính.
