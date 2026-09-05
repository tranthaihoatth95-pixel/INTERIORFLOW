# 04/09 · lane 01 · CORE — CUỘC ĐUA KHỞI ĐỘNG LÀM RƠI `flowId` CỦA RESUME (D6)

> Mốc: `f4d88062` sau `git merge --ff-only origin/integration/2026-09-04` (lệch 224 commit, cây
> sạch, `merge-base --is-ancestor` rc=0). Dev server cổng **3100**, CSDL bản sao trong worktree.

---

## ① TÁI HIỆN — làm được, và ra NẶNG HƠN sổ mô tả

Bộ dựng ca hỏng: `scripts/nghiem-thu-ban-lam-viec/tai-hien-d6.mjs`. Đọc từ **nơi lưu thật**
(`localStorage['interiorflow.resume.<uid>']`), chép nguyên văn, không đọc chữ trên màn.

**Cách dựng ca hỏng — không cần bơm gì cả.** Đăng nhập bằng `ctx.request.post` ⇒ cookie phiên vào
hồ sơ đĩa nhưng **không trang nào chạy JS** ⇒ `interiorflow.lastUserId` rỗng đúng lúc
`ResumeTracker` chạy. Đây chính là ca người dùng thật gặp: mở bookmark / tab mới / F5 khi đang
đăng nhập.

| Thế giới | TRƯỚC vá | SAU vá |
|---|---|---|
| `deep-link`, dự án **đã có bản vẽ** | ❌ `{"route":"/cad-editor","sheetId":"cadsheet-0","ts":1788559558283}` | ✅ `{"route":"/cad-editor","flowId":"cmtni3y8p…","sheetId":"cadsheet-0","ts":…}` |
| `deep-link`, dự án **còn rỗng** | ❌ **`raw: null`** | ✅ có `flowId` |
| `cham` (làm chậm `/api/auth/me` 4-5s) | ❌ thiếu `flowId` | ✅ có `flowId` |
| `qua-home` (gieo `lastUserId` trước) — **ĐỐI CHỨNG** | ✅ có `flowId` | ✅ có `flowId` |

**Bản ghi lỗi, nguyên văn** — khớp từng ký tự với thứ `PRODUCT-DEFECTS.md` D6 mô tả:
```
{"route":"/cad-editor","sheetId":"cadsheet-0","ts":1788559558283}
```

🔴 **NẶNG HƠN SỔ MỘT BẬC, và chỗ này sổ chưa biết**: lượt đầu tiên vào một dự án **CÒN RỖNG** cho
`raw: null` — tức **không có bản ghi resume nào cả**. Hậu quả khác hẳn: không phải "bấm thẻ thì
dội về Home" mà là **thẻ tiêu điểm không hiện ra để mà bấm**. Người dùng không thấy gì sai, chỉ
thấy Home trống.

🔬 **MỘT BIẾN NHIỄU ĐÃ LOẠI, ghi lại vì suýt đọc sai**: lượt `deep-link` đầu tiên chạy trên dự án
rỗng (phải bấm "Tạo bản vẽ mới"), còn `qua-home` chạy trên dự án đã có bản vẽ ⇒ hai thế giới khác
nhau **hai** biến. Đã chạy lại `deep-link` trên dự án đã có bản vẽ để chỉ còn **một** biến khác
nhau — vẫn hỏng. Không làm bước này thì "đối chứng lành" là bằng chứng giả.

---

## ② HƯỚNG SỬA — chọn ①, và **nửa thứ hai tự tan**

**Chọn hướng ① (đường ghi CHỜ định danh), loại hướng ② (gieo định danh đồng bộ).**

Lý do loại ② là **bất khả về cấu trúc, không phải chuyện gu**: nguồn sự thật của định danh là
**phiên máy chủ** (`/api/auth/me`) — một vòng mạng, không đồng bộ hoá được. Ép nó đồng bộ nghĩa là
quay về neo định danh vào `localStorage`, tức **lật chính bản vá D1** và mở lại lỗ rò chéo người
dùng (`nghiem-thu-g1.mjs` CA4/CA8).

**Bản vá là CONNECT, không phải NEW.** `ResumeTracker` nay dùng `danhTinhChoLuot()` — **đúng cỗ
máy** mà `CadSheets` · `PresentSheets` · `cad3d-autosave` đã dùng khi D1 được chữa. Nó là **đường
đọc-một-lần-lúc-mount THỨ TƯ**, và là đường duy nhất chưa được nối. Đúng lệnh cấm ở
`danh-tinh-phien.ts:20`: **0 chỗ gọi `getLastUserId()` mới**, **0 `setTimeout` đoán chừng**.

### Nửa thứ hai (`pathname` không đổi ⇒ không chạy lại) — xử thế nào

**Không vá riêng, vì nó thôi tồn tại.** Bản cũ hỏng theo hai nhịp: *bỏ lượt ghi* rồi *không hẹn
làm lại*. Bản mới **không bỏ lượt nào** — effect `await` định danh rồi mới ghi. Không có lượt lỡ
thì không cần cơ chế ghi bù, và "chạy đúng một lần" thành **đủ**, vì lượt đó không bỏ cuộc.

Đây là điểm phiếu cảnh báo đúng: vá nửa đầu mà bỏ nửa sau thì lỗi thành *thỉnh thoảng mới xảy ra*
— qua được mọi lượt kiểm. Cách chữa ở tầng nguồn tránh được vì nó **xoá điều kiện sinh ra cả hai
nhịp**, không phải xử từng nhịp.

`conSong` (cờ huỷ của chính lượt effect) lo ca điều hướng đi chỗ khác giữa lúc đang đợi — lượt cũ
dừng, không ghi route cũ đè lên route mới.

---

## ③ D1 — CÙNG NGUỒN, và bằng chứng nằm ngay trong lần chạy đầu

**Cùng nguồn.** Bằng chứng: lượt chạy J16 **trước khi vá** đã đỏ ở khẳng định `flowId`, nhưng
khẳng định IndexedDB phía trên nó thì **đã xanh** — tức D1 (mất bản vẽ) đã lành sẵn nhờ lane A,
còn D6 sống sót vì `ResumeTracker` là đường thứ tư chưa nối.

⇒ Đúng như D6 dự đoán: *"sửa D1 ở tầng nguồn nhiều khả năng đóng luôn D6; nếu D1 sửa theo kiểu vá
điểm thì D6 vẫn sống"*. Thực tế nằm giữa: D1 **đã** sửa ở tầng nguồn (dựng `danhTinhChoLuot`),
nhưng **chỉ cắm vào 3/4 đường tiêu thụ**. Cỗ máy đúng, một đầu dây chưa nối.

---

## ④ LƯỢT VÀO ĐẦU TIÊN SAU ĐĂNG NHẬP — và một PASS GIẢ đã bị bắt

🔴 **Lần đặt khẳng định đầu tiên của tôi SAI, và bộ đo báo PASS giả.** Tôi đặt khẳng định `flowId`
trên `sau` (lượt vào lại). J16 báo **PASS** ngay trước khi vá — vì `sau` chạy trên **cùng hồ sơ
đĩa**, `lastUserId` đã ấm sẵn từ phiên 1, **ca hỏng không tái diễn ở đó**.

Chuyển khẳng định sang `truoc` (lượt vào **đầu tiên** sau đăng nhập) ⇒ đỏ ngay, đúng câu:
```
❌ FAIL  J16
   LƯỢT VÀO ĐẦU TIÊN sau đăng nhập: resume ghi ra THIẾU flowId:
   {"route":"/cad-editor","sheetId":"cadsheet-0","ts":1788559813568}
   ⇒ buildResumeCard() tính routeId=null ⇒ bấm thẻ tiêu điểm dội về '/'
```

**Số đọc được, đọc từ đâu**: `localStorage['interiorflow.resume.cmtni3y5y00007dmzemcuqp31']`, đọc
bằng `page.evaluate` trong chính bối cảnh trình duyệt, ngay sau thao tác ở phiên 1.

⭐ Bài học đắt hơn bản vá: **bộ đo cũng có "thế giới đã ấm"**. Đo bản vá ở lượt thứ hai là đo một
thế giới đã hết bệnh — nó phát chứng chỉ cho thứ nó chưa từng thử.

---

## ⑤ HIỆU CHUẨN

| Phép | Kết quả |
|---|---|
| **Gỡ vá** (bản `ResumeTracker` cũ) | J16 **ĐỎ** đúng câu `flowId` ở lượt vào đầu tiên |
| **Cắm lại** | J16 **XANH** — `1 thực thể còn nguyên … ; đường quay lại còn đủ NGAY TỪ LƯỢT ĐẦU` |
| J16 `--hieu-chuan` (chặn IndexedDB) | ĐỎ vì khẳng định, **không** vì hạ tầng — *"HIỆU CHUẨN ĐẠT"* |
| J16b `--hieu-chuan` (chặn ghi `interiorflow.resume.*`) | ĐỎ vì khẳng định — *"HIỆU CHUẨN ĐẠT"* |
| Dòng **"HIỆU CHUẨN THOÁI HOÁ"** | **đã hết** cho J16 (trước vá thì có, vì J16 đỏ ở cả thế giới lành) |

🔴 **VÌ SAO PHẢI ĐẺ J16b — một lỗ hiệu chuẩn tôi suýt để lại.** Thế giới hỏng của J16 là *chặn
IndexedDB*; ở đó khẳng định IDB đỏ **TRƯỚC**, nên khẳng định `flowId` **không bao giờ chạy tới**
⇒ phép hiệu chuẩn của J16 chứng minh được khẳng định IDB mà **không** chứng minh được khẳng định
đường-quay-lại. Một khẳng định chưa từng thấy mình đỏ là một khẳng định chưa đáng tin. J16b có thế
giới hỏng RIÊNG (`chanResume` — cơ chế đã có sẵn cho J05), và là **thêm một mục vào `HANH_TRINH`,
không sửa khung** — đúng cách bộ này khai bản thân nó.

**💥 Một lỗi hạ tầng của chính tôi, ghi lại vì nó đúng thứ khung cấm coi là bằng chứng**: lượt chạy
J16 đầu tiên báo `LỖI · mt is not defined` — `soSanh` chỉ nhận `(truoc, sau, st)`, không có `mt`,
mà tôi với tay ra biến ngoài phạm vi. Đó là **đỏ vì hạ tầng**, không tính là phép đo. Sửa bằng
cách mang `duAn` theo bản đọc (`ghiXuong`) thay vì với ra ngoài.

### Cột ĐÃ LƯU: **9/22 → vẫn 9/22**

Nói thẳng: **đợt này KHÔNG làm con số đó tăng.** `J16b` là hành trình **mới thêm**, không phải một
trong 22 hành trình gốc; cộng nó vào tử số mà giữ mẫu số 22 là tự chấm điểm bằng cách đổi luật
đếm. Thứ đợt này đổi là **CHẤT của J16**: nó thôi chỉ hỏi *"việc còn không"* mà hỏi thêm *"quay
lại được không"* — hai câu khác nhau, và ca deep-link hỏng đúng câu thứ hai trong khi câu thứ nhất
vẫn xanh.

---

## ⑥ MÁY ĐO

| | |
|---|---|
| `npx tsc --noEmit` | **rc=0** |
| `npm test` | **7886 pass · 0 fail** |
| `npm run soi:frontier` | rc=0 · **0 LỆCH** (77 xong-máy · 1 qua mắt · 56 chờ) |
| `npm run soi:cong-cu-chet` | **40 ca** — đúng mốc |
| `npm run soi:hinh-hoc` | **32 ngoài thang** — đúng mốc |
| `npm run soi:tu-dien` | **322 chỗ chữ trần** — đúng mốc |

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

- **Chỉ đo Chromium 1194 trên Linux.** Safari/Firefox/WebKit là **suy**, không đo. Cuộc đua này phụ
  thuộc thứ tự flush effect của React + thời điểm `fetch` resolve — hai thứ có thể khác giữa trình
  duyệt, nhưng bản vá không dựa vào thời điểm nào cả (nó `await`), nên rủi ro thấp.
- **Không đo trên bản Electron đóng gói.** `/api/auth/me` ở đó đi qua server Next nhúng; chưa thử.
- **`raw: null` ở dự án rỗng — tôi đo được hiện tượng, KHÔNG truy tới cùng cơ chế.** Giả thuyết là
  `CadSheets` chưa `hydrated` nên đường ghi resume thứ hai của nó cũng chưa chạy; **chưa xác minh**.
  Sau vá thì ca này lành, nên tôi dừng ở đó thay vì đào tiếp — nhưng đây là **một câu chưa trả lời**,
  không phải một câu đã trả lời.
- **Không đo ca "đổi dự án giữa phiên"** (`pathname` đổi trong lúc lượt cũ đang đợi định danh).
  `conSong` được thiết kế cho đúng ca đó và `danhTinhChoLuot` đã có test cho cơ chế huỷ, nhưng
  **ca cụ thể này chưa dựng trên app thật**.
- **Không đo ca "localStorage bị chặn hẳn"** (chế độ riêng tư). `saveResume` đã bọc try/catch từ
  trước; không đụng tới.
- **`npm test` chạy trên worktree có CSDL bản sao** — số 7886 là tổng cộng dồn từ nhiều tệp, đọc
  bằng cách cộng các dòng `N pass`; không phải một con số do bộ chạy tự in ra.
- **J16b không vẽ gì.** Nó chứng minh *đường quay lại đủ*, **không** chứng minh *việc được lưu* —
  đó là việc của J16. Đọc J16b một mình là đọc thiếu.

---

## ⑦c · HẠN DÙNG KẾT LUẬN

- 🔴 **Chết ngay khi thứ tự khởi động đổi**: kết luận *"`sau` không tái hiện được ca hỏng"* dựa
  vào việc phiên 2 dùng **cùng hồ sơ đĩa** nên `lastUserId` đã ấm. Nếu sau này bộ đo đổi sang hồ sơ
  sạch mỗi lượt, hoặc app xoá `lastUserId` lúc thoát, thì `sau` cũng thành ca hỏng — lúc đó
  **khẳng định trên `truoc` vẫn đúng**, nhưng lời giải thích trong mã J16 sẽ sai và phải sửa.
- 🔴 **Chết nếu `danhTinhSanSang()` thôi single-flight**: bản vá dựa vào việc gọi nó ở đường thứ tư
  **không** tốn thêm request. Bỏ single-flight ⇒ mỗi lần đổi route là một lượt `/api/auth/me`.
- 🔴 **Chết nếu `computeResumePatch` thôi trả `null` cho route không-resumable**: hiện `ResumeTracker`
  thoát TRƯỚC khi chạm định danh, nên màn đăng nhập không kéo theo lượt hỏi máy chủ nào. Đổi thứ tự
  hai dòng đó là thêm một request vào mọi route.
- 🟡 **Số mốc máy soi (40 · 32 · 322) hết hạn ngay khi lane khác merge.** Chúng đúng tại `f4d88062`
  + thay đổi của lane này.

---

## ⑦.8 · CÒN ĐƯỜNG NÀO KHÁC ĐANG ĐUA VỚI GIEO ĐỊNH DANH?

Quét toàn bộ nơi gọi `getLastUserId()`. **CÓ — một đường, và đã TÁI HIỆN được, không phải suy đoán.**

### 🔴 D7 · `LegacyStageRedirect` — bookmark route cũ dội về Home

`components/studio/LegacyStageRedirect.tsx:37` đọc `activeProjectRouteId()` **ĐỒNG BỘ** trong effect
mount (deps `[router, stage]` ⇒ chạy đúng một lần), hàm đó rơi về `getLastUserId()`
(`lib/project-scope.ts:62`). Mở **bookmark cũ** `/cad-editor` bằng tab mới ⇒ store rỗng + bộ đệm
chưa gieo ⇒ `router.replace('/?notice=choose-project')`.

Đo được (`tai-hien-d6.mjs --the-gioi=bookmark-cu`), **resume trên đĩa ĐÃ ĐỦ `flowId`**:
```
resumeTruocKhiVao : {"route":"/cad-editor","flowId":"cmtni3y8p…","sheetId":"cadsheet-0","ts":…}
dichSauRedirect   : http://localhost:3100/          ← dội về Home
```
Cùng họ bệnh, chỉ khác đây là đường **ĐỌC** chứ không phải đường **GHI**.
⛔ **Khai, KHÔNG tự vá** — `components/studio/**` và `lib/project-scope.ts` ngoài vùng ghi của lane
này. Đã ghi thành **D7** trong `docs/delivery/PRODUCT-DEFECTS.md`.

### 🟡 `CongThietLapTrang.tsx:166` — đua ở ca biên, không phải ca thường

`veLai2D()` gọi `getLastUserId()` đồng bộ, nhưng nó nằm trong **handler bấm nút**, không phải effect
mount ⇒ lúc đó định danh thường đã ấm. Ca biên còn lại: vào thẳng `/projects/<id>/present` bằng
deep-link rồi bấm "Về 2D" **trong vòng chưa tới một vòng mạng**. Hiếm, nhưng có thật. Ngoài vùng ghi
(`components/present-editor/**`) ⇒ khai, không vá.

### ✅ Các nơi còn lại — KHÔNG đua

`LibrarySheet.tsx:422` · `LockScreenSettings.tsx:21` · `AppChrome.tsx:204` · `VitalsGesture.tsx:485`
đều là đường đọc **có store làm nguồn chính**, `getLastUserId()` chỉ là đường lùi, và đều nằm sau
tương tác người dùng chứ không phải mount-một-lần trên deep-link.

---

## Tệp đã đụng

| Tệp | Việc |
|---|---|
| `components/entry/ResumeTracker.tsx` | **bản vá** — `danhTinhChoLuot` thay `getLastUserId` đồng bộ |
| `scripts/nghiem-thu-g2-hanh-trinh.mjs` | `docResumeKho()` + khẳng định `flowId` ở J16 (trên `truoc`) + hành trình **J16b** có thế giới hỏng riêng |
| `scripts/nghiem-thu-ban-lam-viec/tai-hien-d6.mjs` | **mới** — bộ tái hiện 4 thế giới |
| `docs/delivery/PRODUCT-DEFECTS.md` | D6 đóng + bảng tái hiện + **D7 mới** |
| `docs/delivery/JOURNEY-MATRIX.md` | hàng J16b + ghi rõ cột ĐÃ LƯU **vẫn 9/22** |
| `docs/delivery/anh-duyet-mat/d6/**` | 4 cặp JSON+PNG bằng chứng |
