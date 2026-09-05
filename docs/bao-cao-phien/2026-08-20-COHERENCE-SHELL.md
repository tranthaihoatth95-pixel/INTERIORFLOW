# COHERENCE-SHELL — mép trên của vỏ app (20/08)

**Trả MAIN:** `WORKSPACE = PARTIAL` · `VITALS = LIVE` · `VISUAL COHERENCE = PASS` · `BROWSER = PASS`

---

## ⓪ TIỀN ĐỀ — kiểm trước khi làm

| Tiền đề phiếu | Kết quả |
|---|---|
| `git log --oneline -1` = `c7f3ac8` | ✅ đúng |
| header 42px vẽ ở `AppChrome.tsx` | ✅ đúng — đo DOM app thật: `header` = **42px** trước và sau thay đổi |
| Vitals có 4 mảnh rời + `VitalsPill` | ✅ đúng về số mảnh, **SAI về trạng thái sống**: xem ② |
| Không đụng vùng lane khác | ✅ — không sửa file nào trong danh sách cấm |

### ⓪b Một tiền đề của phiếu KHÔNG đứng vững — phải nói trước

Phiếu ghi *"Vitals ĐÃ CÓ 4 mảnh rời"* như thể cả bốn đang chạy. Đo tại nguồn:

- `grep -rn "StageSwitcher" components app` → **0 nơi mount** (bị gỡ khỏi header 17/08).
- `StageSwitcher.tsx:446` là nơi mount **DUY NHẤT** của `VitalsGesturePanel`.

⇒ `VitalsGesture.tsx` (675 dòng) **mồ côi từ 17/08**. Hệ quả kèm theo: chip "Vitals" ở
`StatusBar.tsx` gọi `useVitalsUi.open()` tới panel không còn mount ⇒ **gõ câu hỏi rồi Enter thì
câu hỏi đi vào hư không**. Phím `⌘J` đăng ký trong cùng file nên cũng đã chết từ hôm đó.

Đây là loại lỗi 5 máy soi hiện có không bắt được: mã vẫn còn, kiểu vẫn khớp, `tsc` vẫn xanh —
chỉ **đường dây đứt ở đoạn cuối**.

---

## ① DẢI NGỮ CẢNH — `WORKSPACE = PARTIAL`, và PARTIAL là câu trả lời đúng

### Đo trước khi vẽ (phiếu yêu cầu khai kết quả đo)

| Đo gì | Kết quả |
|---|---|
| `grep Workspace prisma/schema.prisma` | **KHÔNG có model `Workspace`.** Chỉ `Task.workspaceId String?` (:658) và một cột transitional (:752-760) mà comment trong chính schema tự khai: *"Model Workspace/… CHƯA tồn tại trong schema này"* — khoá chuỗi tự do, không FK, không bảng |
| `grep Workspace lib/**` | `lib/store.ts:33` `export type WorkspaceMode = Phase` — thứ app đang gọi là "workspace" **CHÍNH LÀ chặng** |
| `lib/cad/store.ts:50` | `CadWorkspace = 'model' \| 'paper'` — không gian giấy/mô hình của riêng chặng 2D, KHÔNG phải Workspace của Blueprint |

⇒ **Dải chỉ có HAI tầng: `Tên dự án · Chặng`.** Vẽ tầng thứ ba lúc này là vẽ một tầng không tồn
tại — người dùng bấm vào và không đổi được gì, đúng loại nút-giả §9 cấm. Khung đã chừa sẵn chỗ
(`SEGMENTS` trong `DaiNguCanh.tsx`): khi Workspace có model + nơi lưu thật, thêm **một** phần tử
vào mảng là xong.

### Làm gì

`components/studio/DaiNguCanh.tsx` (mới) — mount trong `AppChrome` ở đúng ô trước đây chỉ có tên dự án.

- Khiêm tốn: chữ `--t3` cho dự án, `--t2` cho chặng, nền trong suốt lúc rảnh.
- **Không lộ đường dẫn kiến trúc**: phân cách là **vạch dọc mảnh**, cố ý KHÔNG dùng `>` — mũi tên
  đọc ra là "cây thư mục có thứ bậc kỹ thuật", đúng thứ phiếu cấm.
- Bấm → bộ chuyển ngữ cảnh: **Đổi tên dự án · Mở dự án khác** + 3 chặng (dấu tick + `aria-current`
  ở chặng đang đứng).
- Ở Trang chủ `chang = null` ⇒ dải chỉ nói tên dự án, không bịa một chặng "mặc định".
- **Không mất gì**: bấm-để-đổi-tên cũ nay là một mục trong menu, mở đúng ô `<input>` cũ.
- [Đ2] không tự viết luồng điều hướng: đổi chặng gọi `pickStage` (cùng hàm ⌘1/⌘2/⌘3 và rail đang
  gọi), đổi dự án gọi `goHomeConfirmed` (có cửa hỏi-trước-khi-rời).

---

## ② KHẨU ĐỘ VITALS — `LIVE`

`components/studio/VitalsAperture.tsx` (mới) — **một** Vitals cho **mọi** màn, ở mép trên.

| Mức | Trả lời câu gì | Cử chỉ |
|---|---|---|
| Ambient | *"Vitals đang sống, có/không có gì đó"* | luôn thấy; glyph + nhãn + chấm trạng thái + số tín hiệu (chỉ khi > 0) |
| Peek | *"tôi nên biết gì"* | rê vào **có trễ** · focus (mở ngay, không trễ) · bấm (ghim) · nhấn giữ trên cảm ứng |
| Engage | *"nói chuyện với nó"* | nút "Mở Vitals…" trong Peek |

### [Đ2] LOOK INSIDE — xử lý từng mảnh sẵn có

| Mảnh | Xử lý |
|---|---|
| `VitalsIcon.tsx` | **DÙNG LẠI** — glyph ở cả 3 mức |
| `VitalsStateBadge.tsx` | **DÙNG LẠI** `VitalsStateDot` + bộ `VitalsState` (`idle`/`answering`/`alert`). Test khoá: mọi giá trị `trangThaiAmbient()` trả về phải có mặt trong `VitalsStateBadge.tsx` ⇒ không thể đẻ bảng trạng thái thứ hai mà test vẫn xanh |
| `VitalsPill.tsx` | **TÁCH `VitalsChatSurface`** (thuần thêm, `VitalsPill` giữ nguyên 100% hành vi) để Engage dùng LẠI đúng tấm chat đó. Chép tấm này ra chỗ khác mới là đẻ ngôn ngữ thị giác thứ hai |
| `VitalsGesture.tsx` | **ĐÓNG DẤU LỖI THỜI tại chỗ** (18 dòng đầu file): nói rõ 0 nơi mount, cấm hồi sinh bằng cách mount lại, và chỉ ra hai thứ CÒN đáng cứu trong đó (ThinkDial 4 nấc · `buildVitalsDocPayload`) — cứu bằng cách dời sang bề mặt đang sống |
| `StatusBar.tsx` chip Vitals | **GỠ** — nút bấm-không-ra-gì + là Vitals thứ hai trên cùng một màn (trái chốt 16/08). Gỡ kèm toàn bộ state chết của nó |

### 🔴 Luật "chỉ dữ liệu thật" — đặt ở chỗ khoá được, không đặt trong JSX

`components/studio/vitals-tin-hieu.ts` là **lõi thuần**, `vitals-tin-hieu.test.ts` khoá 20 khẳng
định. Ba nguồn, tất cả đã tồn tại từ trước — không đẻ nguồn nào mới:

| # | Tín hiệu | Nguồn |
|---|---|---|
| ① | *N lượt đang chạy* (+ nhãn lượt) | `useFlowStore.flowRuns` — hàng đợi DUY NHẤT của app |
| ② | *N lượt chạy lỗi* | cùng mảng, nhánh `status==='error'` |
| ③ | *N mục quy chuẩn cần xem* | `topViolations(doc)` — mặt tiền của bộ kiểm **tất định** `lib/cad/standards/checker.ts`. Kiểm chuẩn là việc của MÁY không của AI (chốt 15/08) ⇒ 0 đồng, chạy 10 lần ra 10 kết quả giống nhau |

Chống bịa, bằng máy chứ không bằng lời dặn:

- `chonTinHieu({dangChay:0, chayLoi:0}) === []` — test.
- **`undefined` (chưa/không đo được) ≠ `0` (đã đo, sạch)**, cả hai đều KHÔNG ra dòng. Nhập hai thứ
  này làm một là mở đường cho câu *"bản vẽ không có lỗi"* — thứ `violationsPromptBlock` đã cấm
  bằng chữ vì *"0 vi phạm" ≠ "đạt chuẩn"*.
- Test [7] đọc chính nguồn của `NguonTinHieu`: mọi trường phải là **số đếm** (đúng 1 trường chuỗi
  là nhãn `FlowRun.label`), **không nhận hàm/callback** ⇒ không có cửa sau cho "insight AI".
- Trần 3 + thứ tự ưu tiên cố định.

③ đo **LƯỜI** (chỉ lúc mở Peek) và tái dùng nguyên guard sẵn có của `buildVitalsDocPayload`:
`summarizeDoc` bật `areasSkipped` khi bản vẽ vượt `MAX_ROOMS_FOR_AREA` thì bỏ kiểm luôn — **không
đẻ ngưỡng thứ hai**.

### Ranh giới Vitals ↔ toast

Khẩu độ **không bao giờ tự bung** — cả ba mức đều do người dùng ra cử chỉ. Tự bung là biến nó
thành toast, tức nhập *"tôi nên biết gì"* với *"vừa xảy ra gì"*.

### Nhấn giữ

`components/studio/cu-chi-nhan-giu.ts` **nhập lại** `TOOLTIP_LONG_PRESS_MS` (500) và
`TOOLTIP_DEFAULT_DELAY_MS` (150) từ `Tooltip.tsx` thay vì chép số, và đổi tên theo CỬ CHỈ (bài học
00-CHOT 16/08: `TOOLTIP_*` mang nghĩa "thuộc Tooltip", Vitals không phải tooltip). Nợ đã khai:
`LONG_PRESS_SLOP_PX` không export nên `SLOP_PX = 8` là bản sao thứ hai — cách trả nợ ghi sẵn
trong docstring, nằm ngoài vùng ghi của phiếu này.

---

## ③ MỘT LỖI NGOÀI PHẠM VI, CHỈ LỘ KHI THAO TÁC THẬT — đã sửa

Trên Trang chủ, `DongStudioHome.tsx` có cụm nổi `fixed right-5 top-5 z-50` (nút "Chi tiết" +
VI/EN). Đo trên app thật 1440×900: cụm chiếm **y 20→56, x 1309→1420** — **đè lên thanh đầu 42px**,
phủ đúng chỗ ô tìm dự án và Vitals đứng. `document.elementFromPoint(1386, 20)` trả về **cụm này**,
không phải nút Vitals ⇒ **bấm Vitals ở Trang chủ không ăn**.

Lỗi có **trước** phiếu này (VitalsPill dời lên header từ 17/08 đã nằm dưới cụm) và không máy soi
nào bắt được — chỉ lộ khi bấm thật. Sửa: hạ cụm xuống `top-[50px]`, tức **ngay dưới mép header**.
Cố ý KHÔNG nới `z-index`: nới chỉ đổi ai thắng, hai thứ vẫn chồng nhau về mặt thị giác.

---

## ④ NGHIỆM THU

### Máy

- `npx tsc --noEmit` → **0**
- `npx eslint` 5 file đụng tới → **0 error** (1 warning `exhaustive-deps` có sẵn ở AppChrome)
- Toàn bộ `*.test.ts` của repo (bộ lọc y hệt `npm test`) → **0 FAIL**
- `vitals-tin-hieu.test.ts` → 20/20 đạt
- `soi:frontier` → **0 lệch** · `soi:thao-tac` → giữ mốc 4 lệch cũ (file mới **không** thêm lệch nào; `keydown-ne-o-nhap` đã đóng bằng marker `esc-only` đúng khuôn `VitalsPill`) · `soi:tu-dien` → không mọc lệch nhãn mới

### Browser thật `:3001`, 1440×900 — `PASS`

| Ca | Kết quả đo |
|---|---|
| Header giữ 42px | ✅ `42` ở cả Trang chủ và chặng |
| Dải ở **Trang chủ** | `Untitled flow` · aria *"Ngữ cảnh: Untitled flow. Mở bộ chuyển ngữ cảnh."* · menu KHÔNG có mục nào `aria-current` (đúng — Home không đứng trong chặng nào) |
| Dải **trong chặng 2D** | `Dự án mới · Thiết kế 2D` · aria *"…Untitled flow — Thiết kế 2D…"* · menu tick đúng `Thiết kế 2D` |
| Đổi chặng từ dải | ✅ điều hướng thật sang `/projects/{id}/cad` |
| **Ambient** | nút 26px, `aria-label` = *"Vitals — không có tín hiệu"*, chấm `vitals-state-dot--idle` |
| **Peek — CA RỖNG (ca phiếu yêu cầu chứng minh)** | ✅ mở ra chỉ có **"Không có tín hiệu nào."** — **0 dòng tín hiệu**, không badge số trên Ambient |
| **Engage** | ✅ tấm chat `VitalsChatSurface` mở, 300px, neo dưới khẩu độ |
| Đúng MỘT Vitals/màn | ✅ quét `aria-label` chứa "Vitals" trên chặng 2D → trả về **đúng 1** |
| Khẩu độ bấm được ở Home | ✅ sau khi sửa ③ (`elementFromPoint` trúng khẩu độ) |
| Theme tối | ✅ dải + menu + Peek cùng vật liệu panel, cùng bo, cùng độ trầm |

### Hình học / màu / tương phản

- Bo: `--r-2` nút & mục menu · `--r-3` tấm nổi · `--r-full` khẩu độ. **0 hex gõ cứng** trong file mới.
- Tương phản chữ (tính từ token thật): dự án `--t3` **7,36:1** tối / **4,53:1** sáng · chặng `--t2`
  **13,49:1** / **8,68:1** · nhãn khẩu độ đo trên app sáng **9,07:1**. Tất cả ≥ 4,5.
- `prefers-reduced-motion`: khẩu độ **không thêm chuyển động nào** — chỉ transition màu 120ms;
  chuyển động duy nhất là chấm trạng thái, mà `globals.css:1197-1202` đã `animation: none !important`
  cho đúng bộ class đó. Tức reduced-motion được bảo đảm **bằng cách dùng lại** cỗ máy cũ.

---

## ⑤ VÌ SAO CHỌN THẾ NÀY (chỗ có thể cãi)

- **Bấm = Peek chứ không nhảy thẳng vào chat.** Xem trước rồi mới quyết mở — và đó là điều phiếu mô tả.
- **Ghim vs. rê.** Bản đầu không phân biệt: rê vào → tấm bung → bấm một cái là ĐÓNG NGAY (toggle),
  nhìn ra hệt như "bấm không ra gì". Bắt được **khi thao tác thật**, không phải khi đọc mã. Nay
  rê-vào thì tự thu, bấm/focus/nhấn-giữ thì ghim.
- **Gỡ chip Vitals ở StatusBar thay vì nối lại.** Nối lại thì có hai lối vào trên một màn (trái
  chốt 16/08), và cái ô gõ nhanh vẫn phải đi qua một bề mặt không nhận câu mở đầu. Gỡ + ghi rõ
  đường cứu là trung thực hơn.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM — khai đủ

1. **Peek CÓ tín hiệu chưa dựng được trên app thật.** Ca rỗng đã chứng minh bằng mắt; ca có
   `flowRuns` đang chạy chỉ có **test thuần** đứng sau, vì tạo lượt chạy thật là tốn credit và
   `useFlowStore` không lộ ra ngoài `window` để bơm trạng thái giả. ⇒ **cách vẽ** của dòng tín
   hiệu (chấm + nhãn + dòng phụ) chưa ai nhìn thấy.
2. **Tín hiệu ③ (quy chuẩn) chưa chạy trên bản vẽ có thật.** Bản vẽ trong phiên verify trống
   (`entities.length === 0`) ⇒ nhánh trả `undefined` là nhánh đã chạy; nhánh gọi `topViolations`
   thật thì chưa. Chi phí của nó trên bản vẽ nặng cũng chưa đo — chỉ dựa vào guard `areasSkipped`
   mượn từ `VitalsGesture`.
3. **`prefers-reduced-motion` chưa kích hoạt thật.** Kết luận đến từ đọc luật CSS
   (`globals.css:1197`) + xác nhận khẩu độ không thêm animation nào, KHÔNG phải từ chạy với media
   query bật.
4. **Cảm ứng/bút chưa thử.** Đường nhấn-giữ 500ms/8px chỉ chạy qua mã; verify làm bằng chuột.
5. **Chỉ Chromium.** Safari/Firefox/Electron là suy.
6. **Chưa thử trình đọc màn hình thật.** `aria-label`/`aria-current`/`role=menu` đọc từ DOM, không
   phải nghe từ VoiceOver.
7. **Chỉ đo 1440×900.** Dải có `maxWidth` 190/140px + truncate, nhưng khổ hẹp (1024) chưa đo — đây
   đúng chỗ `AppChrome` từng vỡ 30/07 (thang ưu tiên nhường chỗ), nên là rủi ro có tiền lệ.
8. **Dev server rất chậm trong phiên này** (root request có lần **95s**, hai lần `ChunkLoadError`
   do timeout biên dịch). Không phải lỗi mã — nhưng nghĩa là verify chạy trên một server đang
   chia sẻ với lane khác, và mọi phép đo trên là **một lượt**, không lặp lại nhiều lần.
9. **Không mở phiếu registry** cho hai món này (`frontier-registry.mjs` là tệp chung nhiều lane
   đang ghi). Cần thì T thêm entry `dai-ngu-canh` + `vitals-aperture`.

## ⑦c HẠN DÙNG KẾT LUẬN

- Kết luận **"Workspace chưa có model"** hết hạn ngay khi Q2 thi công Workspace/Canvas thật
  (Blueprint §B). Lúc đó: thêm **một** segment vào `SEGMENTS`, đừng dựng dải mới.
- Kết luận **"`VitalsGesture` mồ côi"** hết hạn nếu ai mount lại `StageSwitcher`. Dấu lỗi thời đã
  ghi cấm điều đó, nhưng dấu không phải máy canh.
- Con số tương phản gắn với bộ token hiện tại; đợt đổi **màu nhấn thứ hai** (mòng két ↔ mận, chưa
  chốt) không đụng `--t2/--t3` nên các số trên vẫn đứng — nhưng phải đo lại nếu `--bg` theme sáng
  đổi sang bản canh-Apple.
- Con số **"0 lệch soi:frontier / 4 lệch soi:thao-tac"** là mốc **20/08**, hết hạn ở lượt merge kế.
