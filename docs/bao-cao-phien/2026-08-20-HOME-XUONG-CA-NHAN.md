# HOME = XƯỞNG CÁ NHÂN — bỏ lưới bento, dựng MỘT TIÊU ĐIỂM + MỘT CỤM PHỤ (20/08)

Vùng ghi: `components/home/**`. Không đụng `components/nav/**` · `AppChrome.tsx` ·
`lib/capabilities/**` · `StageToolbelt.tsx` · `present-editor/**` · `lib/library/**` ·
`docs/mocks/**`. Không git, không prisma, không restart server (dùng :3001 đang sống).

---

## ⓪ TIỀN ĐỀ — đã kiểm, KHÔNG có cái nào sai

| Tiền đề của phiếu | Kiểm | Kết quả |
|---|---|---|
| Mốc HEAD khớp main | `git rev-list --count HEAD..main` | **0** — không lệch |
| Server 3001 sống | `lsof -ti:3001` | 3 pid, không restart |
| `SystemWallpaper` đã mount, 5 bộ | `DongStudioHome.tsx` (nay :~520) + `lib/wallpaper/sets.ts` | đúng — **không đụng** |
| Vitals ở mép trên | `VitalsPill` đã dời lên `AppChrome` từ 17/08 | đúng — **không đụng** |
| Home đang là lưới thẻ đều | `DongStudioHome.tsx` — lưới `repeat(12,1fr) × repeat(3,1fr)`, ba nấc `mong`/`vua`/`bento` | đúng — **đây là thứ bị bỏ** |
| Ngày-Số-Không có sẵn | `BatDauNgaySoKhong.tsx`, mount **bên trong** `ProjectSelect` khi 0 dự án | đúng — **giữ nguyên ruột, chỉ đổi chỗ nó đứng** |
| 4 trạng thái (tải/trống/lỗi/ngoại tuyến) | `TrangThaiO.tsx` + `lib/home/trang-thai.ts` | đúng — **không đụng** |

---

## ① VIỆC ĐÃ LÀM

### 1. Máy bố cục mới, thuần và test được — `components/home/xuong-layout.ts`
Ba hàm, không JSX, không DOM:
- `bocCucXuong({coDuAn, coViecDo, duLieu})` → `{tieuDiem, banViecDo, cumPhu, soO}`
- `cotXuong(soMucPhu)` → bề rộng hai vùng bằng `fr`
- `hangPhu(m)` → cách một mục của cụm phụ chiếm chỗ

Test `xuong-layout.test.ts` canh **đúng những câu luật dựa vào**, không canh pixel:
tiêu điểm luôn là ô `01` ở cả A/B/C · việc-dở không mọc ở Ngày-Số-Không · 64 tổ hợp cờ đều cho
dãy số liền mạch · **hai vùng không bao giờ 1:1** (1:1 = lưới đều, thứ bị cấm) · mục ký hiệu
`flex-shrink: 0` (đường quay lại chỗ nghiến) · không mục nào khai `px`.

### 2. `DongStudioHome.tsx` — GỠ ba nhánh lưới, dựng hai vùng
| Bỏ | Thay bằng |
|---|---|
| `bentoGrid` (12 cột × 3 hàng, `repeat(3, minmax(0,1fr))`) | **một** bố cục: tiêu điểm + cụm phụ |
| `vuaGrid` (dải cột chia ĐỀU cho số ô sống) | — |
| `mongGrid` | — |
| `area()`, `bArea/eArea/fAreaLeft/gArea/rightRow`, `splitRow3/resumeSpan/notesCols/resumeCols` | — |
| `bentoFillPercent` / `duAnTileRows` / `tier` | — |
| lề `p-5` (20px cứng) | `clamp(20px, 2.6vw, 52px) clamp(20px, 3.2vw, 64px)` |

**Tiêu điểm** (trái, ~1,62 phần): dải *Việc đang dở* (cao đúng nội dung, chỉ khi có) **+** ô Dự án
— và ô Dự án khi trống **chính là Ngày-Số-Không ba cửa**, không phải màn chào riêng.
**Cụm phụ** (phải, 1 phần): MỘT cột `flex`, xếp theo ưu tiên cố định
`chào → hôm nay → mốc tới → ghi chú → vật liệu → ảnh tuần → biểu đồ → dòng tin`;
mỗi mục `flex: 0 0 auto` (cao đúng nội dung, **cấm co cấm dãn**); dài quá thì **cột đó cuộn**.

### 3. Bản XẾP DỌC (màn < 1100px) giữ nguyên
`stackedList` không đổi; nó vẫn lấy số ô từ `bento-layout.ts` (`cellIndexMap('stacked', …)`),
nên **256 ca test của file đó không hồi quy** — đã chạy lại, PASS.

---

## ② BA TRẠNG THÁI — một không gian đang lớn lên

| | Tiêu điểm | Cụm phụ | Nghiệm thu |
|---|---|---|---|
| **A · Ngày-Số-Không** | ba cửa Tạo · Mở · Nhập nguồn | chỉ 2 mục luôn sống (Chào · Ghi chú) → cột **mỏng đi** (`1.9fr : 1fr`), nền chiếm chỗ nhiều hơn | logic: test PASS · trên app: **chưa chạm được** (xem ⑦b) |
| **B · Có dự án** | **cùng vùng đó**, mọc thêm dải *Việc đang dở* lên trên | như A | **LIVE, đo được** |
| **C · Sau demo** | như B | dày lên theo ưu tiên, tràn thì cuộn | **LIVE, đo được** (6 mục) |

Vị trí tiêu điểm **không đổi** giữa ba trạng thái — đó là thứ làm nó đọc ra *một không gian lớn
lên* chứ không phải ba dashboard.

---

## ③ ĐO TRÊN APP THẬT — :3001, 1440×900, theme sáng + tối

Hộp (px, đo bằng `getBoundingClientRect`):

```
màn 1440×900 · vùng Home (sau rail 240) 1200×858
lề trái/phải của nội dung   46px      lề trên 37px        ← NỀN thở ở đây
lưới                        1108×783
tiêu điểm                   675×783   ┐ 675 : 417 = 1,62 : 1  (KHÔNG 1:1)
cụm phụ                     417×783   ┘ cuộn: nội dung 1097 trong khung 783
  ├ tiêu điểm: Việc đang dở 136  +  01 Dự án 639
  └ cụm phụ:  02 Chào 173 · 03 Ghi chú 144 · 04 Vật liệu 102 · 05 Ảnh tuần 180
              06 Biểu đồ 274 · 07 Lưới tích luỹ 185      ← mỗi mục CAO KHÁC NHAU
page overflow: false
```

**Dòng cuối là bằng chứng "đã bỏ lưới đều"**: sáu mục cao 102→274, không mục nào bằng mục nào,
và không mục nào bị kéo cho bằng nhau.

Theme tối (`data-theme=dark`, đã khôi phục về `light` sau khi đo): cột **675 : 417 y hệt**,
bố cục không đổi.

Màn hẹp 900×800: rơi đúng nhánh xếp dọc (`wide:false`), không dựng lưới rộng.

### Tương phản (đo, không đoán)
| | tiêu điểm nhãn 01 | cụm phụ nhãn 02 | cụm phụ nhãn cuối |
|---|---|---|---|
| sáng | **5,08** | 5,08 | 5,08 |
| tối | **6,70** | 6,70 | 6,70 |

Và câu *"≥4,5 ở MỌI ảnh nền"* đã có **máy canh sẵn**, không phải đo tay:
`lib/wallpaper/contrast.test.ts` đo **tại chân chữ** cho 5 bộ × 4 thời điểm × 2 theme —
chạy lại: **23 pass, 0 fail**, ca xấu nhất `--t3` theme sáng = **4,56** (sàn 4,5).
Tôi **không đụng** vật liệu thẻ (`--nen-mo-card` 0.82) nên bảng đó còn nguyên hiệu lực.

---

## ④ HAI LỖI THẬT BẮT ĐƯỢC BẰNG CÁCH ĐO (không phải bằng nhìn)

Cả hai đều do **bản đầu của chính lượt này** đẻ ra, và cả hai chỉ lộ khi đo hộp:

1. **"05 · Ảnh đẹp tuần này" cao 2px.** Widget ảnh là một *bề mặt* (`h-full` bên trong); hàng
   `auto` hỏi nó "cần bao nhiêu" thì nó trả lời "không cần gì" ⇒ sập. Sửa: nó là mục **BỀ MẶT**,
   lấy `20vh`.
2. **"03 · Ghi chú nhanh" còn 105px** — khai `1fr` nhưng mấy hàng `auto` ăn chỗ trước. Sửa: sàn
   `16vh`.
3. Vòng sửa đầu (vẫn dùng CSS Grid) đẻ ra lỗi **thứ ba**: khi cột chật, hàng `auto` bị **nén về
   min-content** — *Biểu đồ chặng* 289 → **106px**. ⇒ đổi cụm phụ sang **flex column** với
   `flex: 0 0 auto` (chữ `0` giữa = cấm co). Test khoá lại đúng ba ca này.

⭐ Rút ra: `auto` không có nghĩa "vừa đúng" — nó có nghĩa "hỏi nội dung", và **bề mặt thì không
biết trả lời**. Đây là lý do nghiệm thu phải đo hộp, `tsc` + test không bao giờ bắt được.

---

## ⑤ RÀNG BUỘC — đối chiếu từng dòng

| Ràng buộc | Trạng thái |
|---|---|
| Token màu, cấm hex cứng | ĐẠT — 0 hex mới; chỉ dùng `--gap`, `--t1/t3`, `--vien-mo`, `--nen-mo-card`, `--r-3` |
| Thang bo 6/10/14/20 | ĐẠT — không đặt `border-radius` mới nào |
| `--mo-vo-hieu` · nút mờ `aria-disabled` + `aria-describedby` | ĐẠT — `BatDauNgaySoKhong` giữ nguyên, không đụng |
| `prefers-reduced-motion` thắng | ĐẠT theo nghĩa **không phát sinh** — lượt này thêm **0 chuyển động**; nhánh sẵn có ở `TrangThaiO`/wallpaper không đụng |
| Widget khai theo Ô LƯỚI, cấm px | ĐẠT — bề rộng bằng `fr`, chiều cao mục bằng `vh`/`auto`; test khoá `cấm khai px`. ⚠️ Lề ngoài + `maxWidth 1360px` là **khung trang**, không phải widget — khai rõ ở ⑦b |
| Chữ ≥4,5 ở mọi ảnh nền | ĐẠT — 5,08 / 6,70 đo sống + 23 ca máy canh, ca xấu nhất 4,56 |
| Cấm bịa số liệu hoạt động | ĐẠT — không thêm một con số nào; mục rỗng **không hiện** (`cumPhu` đã lọc) |
| Giữ 4 trạng thái · nền ambient · Vitals mép trên | ĐẠT — 0 dòng đụng vào |

---

## ⑥ VERIFY

- `npx tsc --noEmit` → **0 lỗi trong vùng của lượt này**. (Còn lỗi ở `components/nav/muc-dieu-huong.ts`
  — `ListTodo`/`MessagesSquare` chưa import, `CumRail` thiếu `'chung'`. Đó là **vùng CẤM ĐỤNG**,
  lane điều hướng đang ghi dở; không phải của lượt này và tôi không sửa.)
- Test targeted, không hồi quy:
  `xuong-layout` PASS (mới) · `bento-layout` PASS (256 ca) · `resume-card` PASS · `trang-thai` PASS ·
  `wallpaper/contrast` PASS (23) · `wallpaper/sets` PASS · `wallpaper/settle` PASS.
- Browser thật :3001 — đo hộp + tương phản, hai theme, hai bề ngang. Không tạo/xoá dữ liệu thật.
  (Có đọc `localStorage` để xác nhận việc-dở đang tồn tại; **không ghi**. Có đổi `data-theme` để đo
  rồi **khôi phục** về `light`.)

---

## ⑦ KẾT

**Đã bỏ lưới thẻ đều: RỒI** — ba nhánh lưới đã gỡ khỏi mã, và trên app sáu mục cao 102→274px
không mục nào bằng mục nào.

### ⑦b CHƯA CHẮC / CHƯA KIỂM — khai đủ, kể cả ô trống

1. **Trạng thái A chưa nhìn thấy trên app.** Máy này có dự án thật; xoá dự án là hành vi bị cấm.
   A mới chỉ được chứng minh bằng test thuần + bằng việc `BatDauNgaySoKhong` không bị đụng.
   **Cách kiểm rẻ nhất cho lượt sau**: mở Home bằng một tài khoản chưa có dự án.
2. **Trạng thái C chỉ đạt 6/8 mục.** Hai mục *Hôm nay* và *Mốc sắp tới* chưa có dữ liệu trên máy
   này ⇒ ca 8 mục (cụm phụ cuộn dài nhất) chưa ai nhìn.
3. **Ảnh chụp màn không dùng được.** Pane trình duyệt trả ảnh ở ~1/7 cỡ thật, chữ không đọc nổi —
   mọi kết luận hình học trong báo cáo này đến từ **đo hộp**, không từ mắt. Nghĩa là tôi khẳng
   định được *bố cục*, **không** khẳng định được *nó có đẹp không*. Đó là việc của mắt Hoà.
4. **`maxWidth: 1360px` và lề `clamp(...)` là số tôi tự chọn**, luật không nói. Chọn theo hướng
   kiềm chế: màn rộng hơn thì khoảng âm lớn hơn chứ thẻ không dãn. Hoà thấy chật/rộng thì đây là
   hai con số duy nhất cần chỉnh.
5. **Thứ tự ưu tiên cụm phụ là suy luận của tôi**, không phải chốt của Hoà: đọc từ *việc phải
   quyết hôm nay* xuống *thứ để ngắm*. Nó nằm một chỗ (`THU_TU_PHU`), đổi là đổi một mảng.
6. **Chưa thử trình đọc màn hình, chưa thử Safari/Firefox** (chỉ Chromium). Chưa kích hoạt nhánh
   `prefers-reduced-motion` lần nào — lượt này không thêm chuyển động nên rủi ro thấp, nhưng
   *chưa kiểm* thì vẫn là chưa kiểm.
7. **Cụm phụ CUỘN khi dày.** Đó là lựa chọn có ý thức (thà cuộn còn hơn nghiến mục nào về 2px),
   nhưng nó là một thứ Hoà chưa duyệt: cuộn ở cột phụ có chấp nhận được không, hay nên có nấc
   "xổ ra" như card 3 nấc?

### ⑦c HẠN DÙNG KẾT LUẬN
- Số đo hộp: **đúng cho :3001 hôm nay, 1440×900, dữ liệu máy Hoà** (1 dự án, 1 việc dở, 6/8 mục
  phụ sống). Dữ liệu đổi thì số đổi — nhưng *hình dạng* (một tiêu điểm, một cụm phụ, tỉ lệ ≠ 1:1)
  có test canh nên không trôi.
- Bảng tương phản 5 bộ × 4 giờ × 2 theme: **hết hiệu lực ngay khi ai đó đổi `--nen-mo-card`,
  `--t1/t2/t3` hoặc bảng màu nền** — `contrast.test.ts` có drift-guard đọc thẳng `globals.css`
  nên nó sẽ đỏ, không im lặng trôi.
- Lỗi `components/nav/` ghi ở ⑥ là **ảnh chụp lúc 20/08**; lane kia làm xong là hết.

---

## ⑧ TỆP ĐỘNG VÀO
```
components/home/xuong-layout.ts        (mới)
components/home/xuong-layout.test.ts   (mới)
components/home/DongStudioHome.tsx     (bố cục rộng + lề ngoài + docstring)
docs/bao-cao-phien/2026-08-20-HOME-XUONG-CA-NHAN.md  (báo cáo này)
```
`ProjectSelect.tsx` **không** phải sửa — Ngày-Số-Không đã sống đúng chỗ cần.
