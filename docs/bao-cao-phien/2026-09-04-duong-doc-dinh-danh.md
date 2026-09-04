# 04/09 · lane 01 CORE — ĐƯỜNG ĐỌC ĐỊNH DANH (D7), và quét cho hết họ bệnh

> Lượt trước đóng đường **GHI** (D1 · D6). Lượt này đóng đường **ĐỌC** (D7) — cùng họ, ngược chiều —
> rồi đếm hết họ bệnh thay vì để nó tiếp tục là *"ba ca bắt được nhờ may"*.

---

## ⓪ TIỀN ĐỀ — nhận 2, đính chính 2

| Phiếu nói | Thực tế đo |
|---|---|
| `components/entry/LegacyStageRedirect.tsx:37` | 🔧 **`components/studio/LegacyStageRedirect.tsx:37`** — đúng dòng, sai thư mục. Ô "ĐƯỢC GHI" khai `components/entry/**`; tệp thật nằm ở `components/studio/**` mà ô "CẤM GHI" chỉ cấm **đích danh** `AppShell.tsx`, không cấm cả thư mục ⇒ vẫn trong vùng. Ghi lại để phiếu sau khỏi mở nhầm tệp. |
| `docs/PRODUCT-DEFECTS.md` | 🔧 **`docs/delivery/PRODUCT-DEFECTS.md`** |
| D7 đã được tái hiện ở lượt trước | ✅ đúng — `tai-hien-d6.mjs --the-gioi=bookmark-cu`. Nhưng thế giới đó **không có đối chứng cùng khuôn** (phải so với `qua-home`, vốn chạy kịch bản khác) ⇒ vẫn tự dựng lại. |
| Bản vá mẫu = `danhTinhChoLuot` | ✅ đúng, và **dùng lại được** — nhưng phải thêm một chỗ rẽ (xem §B), nếu chép nguyên thì đường điều hướng trong phiên phải chờ mạng vô cớ. |

**⓪b MỐC** — cây sạch · lệch **229** · `merge-base --is-ancestor` rc=0 ⇒ `merge --ff-only` →
`b8baece1`, lệch còn **0**. (Chín-trên-chín lane hôm nay bị cắt lệch; lane này không.)

---

## 1 · TÁI HIỆN — hai thế giới, khác nhau ĐÚNG một `boolean`

`scripts/nghiem-thu-ban-lam-viec/tai-hien-d7.mjs`. Cả hai thế giới chạy **cùng một hàm**
`motLuot()`; biến duy nhất là `xoaDinhDanh` — một dòng `removeItem('interiorflow.lastUserId')`.
Không bơm lỗi, không chặn mạng, không giả lập gì.

```
① lanh-dinh-danh   bộ đệm CÒN   → /projects/<id>/cad        loeHome:false  ✅
② nguoi-dinh-danh  bộ đệm XOÁ   → /?notice=choose-project → /              ❌
   resume trên đĩa của CẢ HAI: {"route":"/cad-editor","flowId":"…","sheetId":"cadsheet-0"}
```

⚠️ **Lượt chạy ĐẦU suýt cho một đối chứng GIẢ, và đó là phần đáng ghi nhất của mục này.** Thế giới
lành trả `resume: null` ⇒ **cả hai đều đỏ**. Không phải vì bệnh nặng hơn, mà vì dev server **biên
dịch route lần đầu mất ~3 giây**, ăn hết ngân sách chờ 9 s ⇒ hai thế giới lệch nhau **HAI** biến
(bộ đệm định danh **và** máy chủ nguội/ấm). Đúng cạm bẫy phiếu dặn. Đã thêm `hamNong()` biên dịch
trước cả ba route; nếu không, "cả hai đều đỏ" đã bị đọc thành *"không tái hiện được"* và lượt này
đã dừng sai chỗ.

**Đọc từ nơi lưu thật** (`localStorage`) + **URL đích**, không đọc chữ trên màn. Và đo **cả đường
đi** bằng `framenavigated`, không chỉ đích — *"về đúng chỗ"* và *"về đúng chỗ SAU KHI nháy qua
Home"* là hai trải nghiệm khác nhau, chỉ đọc URL cuối thì không phân biệt được.

---

## 2 · SỬA — ở tầng nguồn, CONNECT chứ không dựng cơ chế mới

**`lib/project-scope.ts`** — tách `activeProjectRouteId` thành hai nhánh có **điều kiện khác nhau**,
mỗi nhánh **đúng một định nghĩa**:

| nhánh | nguồn | cần định danh? |
|---|---|---|
| `tuStore()` | điều hướng trong phiên | **không** |
| `tuResume()` | bookmark / deep-link | **có** (khoá là `interiorflow.resume.<userId>`) |

- `activeProjectRouteId()` — bản đồng bộ, **chữ ký giữ nguyên** cho mọi nơi gọi lúc render, kèm
  cảnh báo trong docstring về chỗ **không** được dùng nó.
- `activeProjectRouteIdCho(conSong)` — bản chờ, dùng `danhTinhChoLuot` (`:113`).

**`components/studio/LegacyStageRedirect.tsx:54`** đổi sang bản chờ, có cờ huỷ `conSong`.

⭐ **Hỏi store TRƯỚC, chờ SAU** — không phải tối ưu vặt. Bắt điều hướng trong phiên chờ
`/api/auth/me` là **đổi một lỗi sai-đích lấy một lỗi chậm-đích**; chỉ ca thật sự thiếu dữ kiện
(store rỗng) mới trả giá chờ.

**CONNECT, không NEW** (§B25): dùng đúng cỗ máy `ResumeTracker` · `CadSheets` · `PresentSheets` ·
autosave-3D đã dùng. Lệnh cấm ở `danh-tinh-phien.ts:19` (*không thêm chỗ gọi `getLastUserId()`
nào nữa, không tự chế cách chờ riêng*) được giữ: lượt này **giảm** một chỗ gọi trực tiếp.

**Chống loé Home** — đúng MỘT lần `router.replace`, xảy ra SAU khi đã biết đích. Trong lúc chờ,
trang vẫn là spinner vốn có ⇒ người dùng không bao giờ thấy Home hiện rồi biến mất. Canh bằng
`framenavigated` (`loeHome`), không bằng ảnh chụp.
🔧 Sửa luôn chú thích cũ *"nhịp chờ rất ngắn (không gọi API)"* — nay **sai**; để nguyên là bỏ hoang
một câu đang điều khiển cách đọc.

---

## 3 · CA BIÊN `CongThietLapTrang.tsx:166` — **KHÁC BỆNH**, không gộp

`getLastUserId()` ở đó nằm trong **`veLai2D()` — một hàm xử lý cú bấm**, không phải effect mount.

| | D7 | ca biên |
|---|---|---|
| chạy lúc nào | mount, deps `[router, stage]` ⇒ **đúng một lần, không bao giờ lại** | khi người dùng bấm, sau khi app đã sống nhiều giây |
| bộ đệm lúc đó | **chưa gieo** (đo: gieo lúc 2.654 ms) | **đã gieo** |
| hỏng thế nào | dội trang, thấy ngay | ghi `resume.sheetId` bị nuốt ⇒ về 2D sai tờ |

Và chặng Trình chiếu — nơi tệp này sống — **có `store.user` được đặt** (đo được, §4) ⇒ ngay cả
đường lùi cũng lành. ⇒ **Cùng ANTI-PATTERN** (đọc bộ đệm đồng bộ thay vì chờ nguồn), **khác BỆNH**
(không có cuộc đua mount). Không sửa trong lượt này: đổi nó thành `await` sẽ **hoãn một cú bấm điều
hướng tới 8 s ở ca máy chủ không với tới** — đổi một rủi ro hiếm lấy một phiền phức thường xuyên.

---

## 4 · E — QUÉT HẾT HỌ BỆNH (con số của lượt này)

`scripts/nghiem-thu-ban-lam-viec/quet-doc-dinh-danh.mjs` — quét ba cửa đọc **đồng bộ**
(`getLastUserId` · `effectiveUserId` · `activeProjectRouteId`) trong `components/` `lib/` `app/`.

**34 chỗ gọi · 17 là mã sản phẩm** (còn lại: 11 trong test, 6 là chính định nghĩa hàm).

| nhóm | số | vá | khai |
|---|---|---|---|
| **effect mount quyết định điều hướng / ghi bền** | **0** | — | — |
| thân render (`effectiveUserId(storeUserId)`) | **11** | 0 | **11 → D8** |
| hàm xử lý sự kiện | 4 | 0 | 4 (rủi ro thấp, §3) |
| định nghĩa / bắc cầu trong `lib/` | 2 | **2** | — |

⇒ **Nhánh của D1/D6/D7 đã đóng trọn: 0 chỗ còn lại thuộc loại đó.** Ba ca ấy không phải "ba trong
nhiều", chúng là **cả nhánh**.

🔴 **NHƯNG lộ ra một TẦNG THỨ BA chưa ai nêu — và nó ĐO ĐƯỢC, không suy từ mã.**
`effectiveUserId(storeUserId)` gọi ở thân render phản ứng theo `storeUserId`, **không** phản ứng
theo bộ đệm — `getLastUserId()` đọc `localStorage`, mà `localStorage` không phải state ⇒ **gieo bộ
đệm KHÔNG kích một lượt render nào.** Câu hỏi quyết định: *store có bao giờ được đặt user không?*

`do-dinh-danh-sau-mount.mjs`, hồ sơ sạch, đăng nhập bằng API, 24 mẫu × 700 ms:

| deep-link | bộ đệm gieo lúc | `useFlowStore.user` đặt lúc | thân render tự lành? |
|---|---|---|---|
| `/projects/<id>/**cad**` | 2.654 ms | ❌ **KHÔNG BAO GIỜ** (hết 17 s vẫn null) | ❌ |
| `/projects/<id>/**present**` | 11.890 ms | ✅ 12.593 ms | ✅ |

Chặng Trình chiếu lành vì `PresentStageScreen.tsx:61` **tự hỏi `/api/auth/me` rồi `setUser`** — một
**cơ chế định danh THỨ HAI**, sinh 06/08 để vá một nút giả, không biết gì về `lib/danh-tinh-phien.ts`
sinh 04/09. Chặng 2D không có.

**Nói cho đúng mức, không thổi**: ở 2D đây là lỗi **CHẬM**, không phải lỗi **MẤT** — phần lớn tự
chữa khi có re-render vì lý do khác (`CadCanvas` theo selection · `AiBriefPanel`/`LayoutShelf` có
`useEffect` deps `[modelKey]`). Trừ chỗ chốt giá trị bằng **bộ khởi tạo chạy-một-lần**:
`LockScreenSettings.tsx:22` `useState(() => getLockIdleMinutes(userId))` — chốt một lần, rồi
`commit()` gọi `setLockIdleMinutes('')` mà hàm ấy `if (!userId) return` ⇒ **ghi bị nuốt im lặng**.

**Không vá trong lượt này, có lý do**: vá đúng là **hợp nhất hai cơ chế định danh** (cho
`danh-tinh-phien` đặt luôn `store.user`, xoá đường riêng của `PresentStageScreen`) — chạm
`lib/store.ts` + chặng Trình chiếu, **ngoài vùng ghi**, và là thay đổi kiến trúc chứ không phải sửa
một dòng. Vá điểm từng chỗ đọc là đúng thứ `danh-tinh-phien.ts:19` cấm. ⇒ khai thành **D8**.

---

## 5 · HIỆU CHUẨN — hai lớp, cả hai đều đỏ đúng chỗ

**Lớp 1 · gỡ bản vá ra** (đổi `LegacyStageRedirect` về bản đọc đồng bộ):
```
❌ FAIL J23 — "đóng hẳn rồi mở lại, bộ đệm định danh NGUỘI (đúng ca D7):
   bookmark /cad-editor dội về "/" thay vì /projects/<id>/cad
   — dấu vết trên đĩa lúc đó: {"route":"/cad-editor","flowId":"…","ts":…}"
```
Đỏ **vì khẳng định**, và thông điệp tự chứng minh dấu vết **có đủ** ⇒ không thể đổ cho thiếu dữ
liệu. Cắm lại ⇒ **✅ PASS**.

**Lớp 2 · thế giới khai báo `chanResume`** (`--hieu-chuan`): **❌ FAIL** rồi `✅ HIỆU CHUẨN ĐẠT`.
Chọn thế giới này vì nó làm đỏ ĐÚNG khẳng định mà **không chặn mất đường khẳng định phải đi qua** —
cầu chuyển hướng vẫn chạy, vẫn quyết định, chỉ là không còn dấu vết để quyết đúng. (Bài học J16:
hiệu chuẩn chặn mất đường thì khẳng định không bao giờ chạy tới, và phép hiệu chuẩn ấy vô nghĩa.)

🔴 **BẪY THỨ HAI ĐÃ DÍNH RỒI GỠ**: bản J23 đầu tiên **PASS cả khi chưa vá** — hồ sơ đĩa mang
`lastUserId` từ lượt 1 nên bộ đệm ĐÃ ẤM ở lượt 2. Phải cho `vaoLai` **dựng lại trạng thái D7**
(xoá bộ đệm, giữ cookie + resume) thì hành trình mới có nghĩa. Trạng thái đó **hợp lệ, không phải
lỗi bơm vào**: `quenDangXuat()` xoá `lastUserId` mà **cố ý giữ** `resume.<uid>`; cộng với xoá
site-data theo mục. Đã ghi lý do ngay trong `vaoLai`.

### Cột ĐÃ LƯU: **9/22 → vẫn 9/22**
`J23` là hành trình **MỚI THÊM** như `J16b`, **không** nằm trong 22 hành trình gốc ⇒ **không cộng
tử số, không đổi mẫu số**. Cộng một vế là tự chấm điểm bằng cách đổi luật đếm.
Thứ đợt này thật sự đổi: **J16b xanh mà người dùng vẫn kẹt.** J16b chứng minh *dấu vết được GHI
đủ*; nó không hỏi *có ai ĐỌC được và đưa người ta tới nơi không*. ⇒ **một cột xanh chỉ bảo chứng
cho câu hỏi mà nó thật sự hỏi.**

---

## 6 · MÁY KIỂM

| | |
|---|---|
| `npx tsc --noEmit` | **0** |
| `npm test` | **34 pass · 0 fail** |
| `soi:frontier` | **0 LỆCH** (👁1 · ✅77 · ⬜56) |
| `soi:cong-cu-chet` | **40** ✅ giữ mốc |
| `soi:hinh-hoc` | **32** ✅ giữ mốc |
| `soi:tu-dien` | **322** ✅ giữ mốc |
| cổng 3101 | đã tắt, `curl` rc=**7** |
| CSDL repo chính | User 1 · Project 4 · Flow 5 · Member 3 · File 2 · Credit 1 — **khớp mốc sạch** |

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

- **Đường tự nhiên tới trạng thái D7 thì HẸP, và tôi không chứng minh được nó rộng.** Bệnh đòi
  `lastUserId` **vắng** trong khi `resume.<uid>` **còn** và cookie **còn hiệu lực**. Hai đường tôi
  lập luận ra: `quenDangXuat()` xoá bộ đệm mà giữ resume (khe "đăng xuất rồi mất mạng / đóng tab
  giữa chừng") · xoá site-data theo mục. **Cả hai đều là suy luận, chưa dựng lại được ca nào xảy
  ra tự nhiên.** Ca tôi tái hiện là trạng thái **dựng có chủ ý**. ⇒ Cơ chế thì chắc chắn (đo
  được), **tần suất thì không**. Bản vá vẫn đáng vì nó rẻ, ở tầng nguồn, và không tốn gì trên
  đường thường — nhưng đừng đọc nó thành *"vừa cứu một lỗi P1 đang hành người dùng mỗi ngày"*.
- **Chưa đo trên máy chủ chậm/không với tới.** Nhánh chờ có trần `HAN_HOI_MS` 8 s; tôi **chưa
  chạy** ca ấy ⇒ chưa biết thực tế 8 s spinner đọc ra thế nào, và chưa biết có nên hiện chữ sau
  một ngưỡng không. Đó là một delta **thị giác**, cần mắt.
- **Số 17 chỗ gọi sản phẩm phụ thuộc bộ quét do tôi tự cân.** Nó bỏ qua dòng `import`/chú thích và
  không theo được lời gọi qua biến trung gian. Cột phân nhóm là **phỏng đoán văn bản** — chính vì
  vậy tôi đã **đọc tay từng chỗ**, và heuristic quả thật xếp sai vài chỗ (nhiều lời gọi ở thân
  render bị nhét vào "hàm gọi tay"). ⇒ **17 là SÀN, không phải trần.**
- **Phép đo `store.user` chỉ chạy trên hai chặng** (`cad`, `present`), mỗi chặng **một lượt**,
  trần 17 s. Chặng `render`/`photo` và các route cấp app **chưa đo** — suy từ hai ca kia.
- **D8 chưa được tái hiện thành một triệu chứng người dùng thấy.** Tôi chứng minh **điều kiện**
  (store không có user, bộ đệm không kích render) chứ chưa dựng ca *"bấm vào rồi không có gì xảy
  ra"*. Ca `LockScreenSettings` là **đọc mã**, chưa bấm thật.
- **Chỉ Chromium 1194**, chỉ dev server (`next dev`), không đo bản build. Chưa thử trình đọc màn
  hình.
- **Chưa chụp ảnh vào `Drive/IF-duyet-mat/01-anh/`** — bộ tái hiện có sinh `.png` vào
  `docs/delivery/anh-duyet-mat/d7/` nhưng đó là ảnh máy đo, chưa qua ngưỡng "ảnh chuẩn cho mắt".

## ⑦c · HẠN DÙNG KẾT LUẬN

- **"0 chỗ đọc đồng bộ trong effect mount"** — hết hạn **ngay khi có ai thêm một `useEffect` gọi
  `getLastUserId()`/`effectiveUserId`**. Chạy lại `quet-doc-dinh-danh.mjs` trước khi trích lại con
  số này. Đây chưa phải máy canh trong CI, chỉ là máy đếm chạy tay.
- **Bảng đo `store.user`** — hết hạn khi ai đó ① cho `danh-tinh-phien` đặt `store.user` (lúc đó
  D8 tự đóng) hoặc ② gỡ đường `/api/auth/me` riêng của `PresentStageScreen` (lúc đó chặng Trình
  chiếu **rơi vào cùng bệnh với 2D**). Cả hai đều đảo kết luận.
- **Thế giới hiệu chuẩn `chanResume` của J23** — hết hạn nếu cầu chuyển hướng về sau đọc thêm một
  nguồn khác ngoài resume (vd hỏi thẳng máy chủ *"dự án mở gần nhất"*). Lúc đó chặn resume không
  còn làm nó đỏ, và J23 thành hành trình **không hiệu chuẩn được** — phải đổi thế giới hỏng cùng
  lượt với thay đổi ấy.
- **`hamNong()` trong bộ tái hiện** — gắn với `next dev`. Chạy trên bản build (không biên dịch lần
  đầu) thì nó thừa nhưng vô hại; **đừng gỡ** vì nghĩ thừa, nó là thứ giữ cho hai thế giới chỉ lệch
  một biến.
