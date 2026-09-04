# P0 · Vào thẳng route studio ⇒ việc không được lưu (định danh neo vào nguồn yếu)

Worker LÀN A · 04/09 · nhánh `integration/2026-09-04` · **không commit, không push**.

---

## ① ⓪ TIỀN ĐỀ

| # | Tiền đề | Kết luận | Bằng chứng |
|---|---|---|---|
| 1 | `lib/resume.ts:22` khai `LAST_USER_KEY = 'interiorflow.lastUserId'` | ✅ ĐÚNG | đọc trực tiếp |
| 2 | `setLastUserId` chỉ gọi ở 2 chỗ | ✅ ĐÚNG | `HomeScreen.tsx:264` · `LoginForm.tsx:135` — grep toàn repo, không có chỗ thứ ba |
| 3 | Có cửa `app/api/auth/me` trả user từ phiên | ✅ ĐÚNG | `app/api/auth/me/route.ts` — 200 `{user: publicUser}` · 503 `server-unavailable` · 401 `stale`/`anonymous`. `publicUser` (`lib/server/auth.ts:156`) có `id: string` |
| 4 | `git status --short` sạch | 🔴 **BÁC BỎ MỘT PHẦN** | 3 tệp bẩn: `docs/delivery/PRODUCT-DEFECTS.md` (A) · `docs/delivery/SHIP-BLOCKERS.md` (A) · `docs/phieu-giao/P-HOME-PHONG-SACH.md` (M) |

**Vì sao vẫn làm tiếp thay vì dừng:** cả 3 tệp bẩn nằm trong `docs/delivery/` + `docs/phieu-giao/` — đúng vùng
packet đã khai là của worker song song, và **nằm ngoài toàn bộ FILES_ALLOWED của tôi**. Vùng mã tôi đụng
(`lib/`, `components/studio/`) sạch tuyệt đối. Chặn một P0 mất dữ liệu vì bụi của worker khác trong thư mục tôi
bị cấm đụng là hiểu sai tinh thần tiền đề. **Báo lên MAIN đúng theo luật, không tự coi là không có.**
HEAD = `5f0181f1`, đúng nhánh.

---

## ② ĐƯỜNG DỮ LIỆU TRƯỚC KHI SỬA

```
người dùng ĐÃ đăng nhập (cookie phiên hợp lệ)
   │   mở THẲNG /projects/<id>/cad   (tab mới · bookmark · F5)
   ▼
app/projects/[id]/cad/page.tsx:22      useProjectScopeSync(id,'cad')  ── KHÔNG gate render
   └─ render ngay CadStageScreen  →  AppShell:153 <AppChrome/> + :164 {children}
                                        └─ CadStageScreen.tsx:51 <CadSheets/>
   ▼   (effect flush lượt commit đầu)
components/cad/CadSheets.tsx:402      const userId = getLastUserId()
   └─ lib/resume.ts:131               localStorage.getItem('interiorflow.lastUserId')  →  null
                                       ▲ trình duyệt này CHƯA từng qua Home/Login
                                         (HomeScreen.tsx:264 · LoginForm.tsx:135 = 2 chỗ ghi DUY NHẤT)
   ▼
CadSheets.tsx:403                      userIdRef.current = null          ◀── ĐỘC HẠI NHẤT
CadSheets.tsx:414-418                  if (!userId) { setHydratedFor(bucketId);
                                                      markBucketHydrated(bucketId); return; }
   ├─ KHÔNG gọi loadSheets()  → không khôi phục bản vẽ đã lưu
   └─ hydrated = true, userIdRef = null (vĩnh viễn — không ai gán lại)
   ▼
CadSheets.tsx:490-492 (autosave)       const userId = userIdRef.current; if (!hydrated || !userId) return;
                                       ⇒ autosaver KHÔNG BAO GIỜ khởi động
```

Y hệt ở `components/present-editor/PresentSheets.tsx:322,336-339,401-403` và
`lib/cad/cad3d-autosave.ts:32` (autosave 3D).

Máy chủ BIẾT người này là ai suốt thời gian đó — `SessionWatch.tsx:36` (mount trong chính `AppChrome`) gọi
`/api/auth/me` và nhận 200. Thông tin có sẵn, chỉ là **lưu trữ neo vào `localStorage` (nguồn yếu) trong khi
phiên máy chủ (nguồn mạnh) nằm ngay cạnh.**

**Tiền lệ vá điểm đã tồn tại:** `PresentStageScreen.tsx:61-75` đã hỏi `/api/auth/me` để chữa **nút BOQ giả**
(06/08) — nhưng chỉ nạp vào flow-store, **không** gieo `lastUserId`, nên `PresentSheets` ngay bên dưới vẫn
mất dữ liệu. Đúng cảnh báo của packet: vá điểm không diệt được họ bệnh.

---

## ③ CA HỎNG: **MẤT HẲN, không ghi nhầm khoá**

Chứng minh bằng mã, hai tầng chặn độc lập:

1. `CadSheets.tsx:490` / `PresentSheets.tsx:401` — `if (!hydrated || !userId) return;` ⇒ autosaver
   **không đăng ký**, `saveSheets()` không được gọi lần nào.
2. Ngay cả khi lọt tới đó: `lib/sheets-persist.ts:157` `if (!userId || !route) return 0;` ⇒ trả 0, không mở
   transaction. Khoá `sheetsKey()` (`:55`) **không bao giờ** được ghép với chuỗi rỗng.

⇒ Không có bản ghi lạc vào bucket rỗng, không cần dọn rác, **không cần bảng nâng cấp**. Nhưng cũng không có
gì để cứu: mọi thứ vẽ trong phiên đó chỉ sống trong RAM, đóng tab là mất, **và không một dòng báo**.
Tệ hơn nữa: `markBucketHydrated()` khiến app tự tin là "đã nạp xong" — im lặng hoàn toàn.

---

## ④ ĐÃ SỬA GÌ, VÌ SAO SỬA Ở TẦNG ĐÓ

**Tầng sửa = tầng NGUỒN của định danh**, không phải tầng tiêu thụ:

> phiên máy chủ = **nguồn sự thật** · `interiorflow.lastUserId` = **bộ đệm**

| Tệp | Thay đổi |
|---|---|
| `lib/danh-tinh-phien.ts` **(mới)** | `giaiDanhTinh(deps)` — lõi THUẦN (test không cần DOM/mạng): đệm có → dùng luôn (0 request); đệm rỗng → hỏi `/api/auth/me` đúng một lần → gieo. `danhTinhSanSang()` — bọc trình duyệt, **single-flight** cho cả vòng đời tab, trả promise để nơi nào cần chắc chắn thì `await`. |
| `lib/resume.ts:123` | `setLastUserId` chặn chuỗi rỗng (trước đây `localStorage` nhận mọi chuỗi ⇒ id rỗng ghi đè được lên id thật). Docstring nói rõ đây là **bộ đệm**, không phải nguồn. |
| `components/studio/AppChrome.tsx` | gọi `danhTinhSanSang()` khi vỏ app khởi động — `AppChrome` là thanh đầu **duy nhất** của cả 4 route studio nên chỉ cần một chỗ. |

**Vì sao KHÔNG thêm chỗ gọi `getLastUserId()` nào nữa** (đúng ràng buộc packet): gieo ở tầng nguồn thì mọi
đường tiêu thụ **hiện có** tự đúng — kể cả đường đi qua store, vì `effectiveUserId()` (`lib/resume.ts:149`)
vốn đã rơi về `getLastUserId()`. Không sửa từng nơi.

**Không đổi hình dạng khoá:** vẫn `interiorflow.lastUserId`, vẫn một chuỗi id trần. Dữ liệu cũ đọc lại nguyên vẹn.

**Chịu lỗi mạng (đã khoá bằng test):** 401 → không ghi · 503 → **không kết luận là chưa đăng nhập**
(hạ tầng lỗi, người dùng vẫn hợp lệ — đúng ngữ nghĩa `route.ts` đã thiết kế) · mạng đứt / JSON hỏng /
thiếu `user.id` / id toàn khoảng trắng → **không ghi gì, không ném lỗi**. Nguyên tắc:
**thà không lưu còn hơn lưu nhầm chỗ người khác.**

---

## ⑤ NGHIỆM THU

| | Trước | Sau |
|---|---|---|
| `npx tsc --noEmit` | 0 lỗi | **0 lỗi** |
| `npm test` | exit 0 | **exit 0**, 0 fail — thêm **16 khẳng định mới** (`lib/danh-tinh-phien.test.ts`) |
| `npm run soi:frontier` | 0 lệch | **0 lệch** (👁1 · ✅77 · ⬜56 · 🔴0) |
| `npm run soi:contract` | 0 lệch | **0 lệch** (🔗21 có dây · 🟡1 chờ dây) |

**Ca hỏng — đường đi trước/sau:**

| Đường tiêu thụ | Kiểu đọc | Trước | Sau |
|---|---|---|---|
| `project-scope.ts:62` `activeProjectRouteId` | gọi trong handler/điều hướng | null | ✅ đúng |
| `LibrarySheet.tsx:407` | trong handler | '' | ✅ đúng |
| `CongThietLapTrang.tsx:166` | trong handler `veLai2D` | null | ✅ đúng |
| `AppChrome.tsx:186` khoá màn | mỗi lần chuột/phím | '' | ✅ đúng |
| `LockScreenSettings.tsx:21` · `VitalsGesture.tsx:485` | lúc render | '' / null | ✅ đúng |
| `ResumeTracker.tsx:42` | effect `[pathname]` | null | ⚠️ đúng từ lần điều hướng đầu tiên |
| **`CadSheets.tsx:402`** | **effect `[bucketId]`, một lần** | null | 🔴 **VẪN null — xem ⑥** |
| **`PresentSheets.tsx:322`** | **effect `[bucketId]`, một lần** | null | 🔴 **VẪN null** |
| **`cad3d-autosave.ts:32`** | **effect `[bucketId]`, một lần** | null | 🔴 **VẪN null** |

---

## ⑥ CHƯA CHẮC / CHƯA KIỂM

### 🔴 GIEO THÔI **KHÔNG ĐỦ** CHO 3 ĐƯỜNG GHI — cần MAIN duyệt 3 tệp ngoài FILES_ALLOWED

Packet giả định *"gieo vào đệm ⇒ mọi đường tiêu thụ tự đúng"*. Tôi đo lại và **giả định đó đúng với 6/9
đường, sai với đúng 3 đường — và 3 đường đó chính là 3 đường GHI**:

- `CadSheets.tsx:402` đọc `getLastUserId()` **đồng bộ** trong effect mount, deps `[bucketId]`.
- `bucketId = useSheetsBucketId()` (`lib/scope.ts:76`) lấy `projectId` **từ URL**, có sẵn ngay lượt render
  đầu và **không bao giờ đổi** trên một deep-link ⇒ effect **chạy đúng một lần, không bao giờ chạy lại**.
- `AppChrome` (`AppShell.tsx:153`) render **trước** `{children}` (`:164`) nên effect của nó chạy trước —
  nhưng nó chỉ **khởi động** một request mạng. `setLastUserId` chỉ xảy ra sau khi request về, tức **sau**
  khi lượt flush effect đó (gồm effect của `CadSheets`) đã chạy xong.

⇒ Trên lần vào thẳng URL đầu tiên, 3 đường ghi **thua cuộc chạy đua một cách tất định** — không phải "hên xui".
Tôi **không tự mở rộng phạm vi** theo đúng luật packet. Patch tối thiểu đề nghị MAIN duyệt (giống hệt nhau ở
`CadSheets.tsx:401` và `PresentSheets.tsx:321`; `cad3d-autosave.ts:31` cùng khuôn):

```ts
    let cancelled = false;
    void (async () => {
      await danhTinhSanSang();          // ⬅ THÊM: đợi định danh giải từ phiên máy chủ
      if (cancelled) return;
      const userId = getLastUserId();   // ⬅ CHUYỂN XUỐNG (trước ở đầu effect)
      userIdRef.current = userId;
      if (!userId) { setHydratedFor(bucketId); markBucketHydrated(bucketId); return; }
      const rec = await loadSheets<PersistedCadSheet>(userId, ROUTE, bucketId);
      /* … phần thân hiện có, giữ nguyên … */
    })();
```

Không phải one-liner: phải bọc thân effect thành async và giữ nguyên khối dọn-khi-đổi-dự-án ở nhánh đồng bộ.
Rủi ro chính là làm hỏng thứ tự dọn canvas khi đổi dự án giữa phiên — **cần một lượt verify trên app thật**.

### Chưa kiểm khác

- **Chưa chạy app thật một dòng nào.** Mọi kết luận về thứ tự effect, thời điểm `bucketId` ổn định và cuộc
  chạy đua là **đọc mã + đọc hợp đồng React**, không phải đo trên trình duyệt.
- **Chưa tái hiện được ca hỏng bằng bước bấm thật.** Tôi chứng minh bằng trích mã (mục ②/③), không bằng một
  phiên trình duyệt. Chưa xác định được **con đường thực tế nào** khiến một trình duyệt có cookie hợp lệ mà
  `localStorage` rỗng (nghi: callback OAuth không đi qua `LoginForm`, hoặc xoá dữ liệu site theo kiểu giữ
  cookie, hoặc chuyện dùng chung cổng `localhost` mà `lib/server/auth.ts:14` đã ghi) — cần MAIN xác nhận.
- **Không đo được tần suất.** Không biết P0 này chạm bao nhiêu % lượt vào; chỉ chắc chắn về cơ chế.
- ~~**`fetch` trong `danhTinhSanSang()` chưa có timeout.**~~ **ĐÃ ĐÓNG trong chính lượt này** — xem
  `lib/danh-tinh-phien.ts:45` `HAN_HOI_MS = 8000` + `chuongHetGio`/`cat` (`:90-101`, `:144-150`): hết giờ thì
  buông, cắt request, **không ghi gì**. Điều kiện mà mục này đặt ra cho patch 3 đường ghi nay đã thoả.
- Chưa thử: Safari/Firefox, chế độ riêng tư (localStorage ném), nhiều tab cùng lúc.

---

## ⑦ PHÁT HIỆN NGOÀI PHẠM VI

1. **`PresentStageScreen.tsx:61-75` là vá điểm chưa gỡ.** Nay trùng chức năng với `danh-tinh-phien.ts`
   (khác chỗ nó nạp flow-store thay vì gieo đệm). Nên gộp về một đường — nhưng tệp ngoài FILES_ALLOWED,
   **tôi không đụng**.
2. **`markBucketHydrated()` biến "không có user" thành "đã nạp xong".** Đây là thứ làm mất mát **im lặng**:
   không có user thì trạng thái đúng phải là *"chưa xác định được người dùng"*, không phải *"nạp xong,
   không có gì"*. Kể cả sau khi vá cuộc chạy đua, ca **thật sự chưa đăng nhập** vẫn nên nói một câu
   ("việc đang giữ tạm trong bộ nhớ, đăng nhập để lưu") thay vì im. Đề nghị MAIN mở một mục riêng.
3. **`lib/resume.ts` và `lib/cad/cad3d-autosave-core.ts:157` re-export cùng một `getLastUserId`** — hai cửa
   vào một hàm, đúng họ bệnh `may-soi-dong-dang` sinh ra để bắt.
4. **Chưa có máy soi nào canh được lỗi loại này.** `soi:frontier`/`soi:contract`/`soi:tu-dien` đều xanh suốt
   trong khi bản vẽ người dùng bay. Chúng canh sổ↔code, nhãn, hợp đồng — không canh
   *"đường ghi dữ liệu có thật sự chạy tới nơi không"*.

---
---

# PHỤ LỤC — LƯỢT NGHIỆM THU (làn A, tiếp sau khi container chết 15:3x)

Lượt trước dựng xong **lõi** (`lib/danh-tinh-phien.ts` + test) và cắm vào `AppChrome`. Lượt này làm phần
**nghiệm thu** còn thiếu. Không sửa lõi, không commit. Thay đổi duy nhất trên đĩa: **thêm 1 tệp test**
`lib/danh-tinh-phien-nghiem-thu.test.ts` (+ 2 chỗ sửa văn bản trong chính báo cáo này).

## A · KẾT LUẬN NGẮN GỌN

> 🔴 **CA HỎNG VẪN CÒN SỐNG TRONG APP.** Lõi đúng và đã được test, nhưng `danhTinhChoLuot()` —
> hàm sinh ra riêng cho 3 đường ghi — **được gọi ở ĐÚNG 0 nơi ngoài test**. Ba đường ghi vẫn đọc
> `getLastUserId()` đồng bộ y như trước. Bệnh chưa được chữa, mới chỉ có **thuốc**.

Bằng chứng một dòng:

```
$ grep -rn "danhTinhChoLuot" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v '\.test\.'
./lib/danh-tinh-phien.ts:22   (câu dặn trong docstring)
./lib/danh-tinh-phien.ts:170  (chỗ định nghĩa)
```

Chính docstring của lõi (`lib/danh-tinh-phien.ts:158-163`) đã tự khai điều này: *"ba đường đó KHÔNG tự lành
khi chỉ gieo ở `AppChrome`"*. Lượt trước ghi đúng nhận định, chỉ chưa thi hành.

## B · CHỨNG MINH BẰNG TEST, KHÔNG BẰNG LẬP LUẬN

`lib/danh-tinh-phien-nghiem-thu.test.ts` dựng lại **đúng hình dạng effect mount hiện tại** rồi **đếm số lần
ghi xuống đĩa**. Đây là đỏ-trước-xanh-sau ở cấp cơ chế:

| Ca | Dựng lại cái gì | Kết quả |
|---|---|---|
| ① | `void danhTinhSanSang()` rồi `getLastUserId()` **đồng bộ** (= 3 đường ghi hôm nay) | `userId === null` ⇒ **0 lần ghi** — chính là P0 |
| ② | `await danhTinhChoLuot()` rồi mới đọc (= đường đã chữa) | ⇒ **1 lần ghi**, đúng khoá `usr::route::bucket` |
| ③ | Hình dạng khoá | vẫn `userId::route::projectId` — **không đổi** |
| ④ | `saveSheets('', …)` | trả `0`, không mở DB ⇒ **không ghi nhầm khoá** |
| ⑤ | Đệm đã có (đường thường) | **0 request** — không làm chậm lượt vào bình thường |
| ⑥ | Đổi dự án giữa chừng | lượt cũ `tiepTuc=false` ⇒ **0 lần ghi**, không đè bucket mới |

15 khẳng định, 0 fail.

**Vì sao ca ① là tất định, không phải "hên xui"** — lập luận này KHÔNG phụ thuộc thứ tự effect cha/con:
`danhTinhSanSang()` chỉ **khởi động** một request; `setLastUserId` sớm nhất cũng phải đợi một microtask +
một vòng mạng. Nên **mọi** lời gọi `getLastUserId()` đồng bộ trong cùng lượt flush effect đó đều trả `null`,
bất kể ai chạy trước.

**Vì sao không bao giờ tự lành sau đó** (đo tại nguồn, không nhớ hộ):
`userIdRef.current` chỉ được gán bên trong effect hydrate (`CadSheets.tsx:403` · `PresentSheets.tsx:323`),
mà effect đó có deps `[bucketId]` (`CadSheets.tsx:487` · `PresentSheets.tsx:404`) và `bucketId` lấy từ URL
nên **không đổi trên một deep-link**. Effect autosave đọc `userIdRef.current` (`CadSheets.tsx:491` ·
`PresentSheets.tsx:402`) rồi `if (!hydrated || !userId) return;` ⇒ **`saverRef.current` mãi mãi là `null`**
⇒ mọi `saverRef.current?.touch()` (11 chỗ ở CadSheets, 6 chỗ ở PresentSheets) là **no-op im lặng**.

## C · CA HỎNG LÀ **MẤT HẲN**, KHÔNG PHẢI GHI NHẦM KHOÁ — ba cổng chặn độc lập

Xác nhận lại kết luận mục ③ bằng cách đọc mã từng cổng:

1. **Không có saver nào được tạo** — `CadSheets.tsx:491-492`, `PresentSheets.tsx:402-403`.
   Không hàm ghi nào được gọi, nên **không có khoá nào để mà sai**.
2. **`saveSheets` tự chặn** — `lib/sheets-persist.ts:157` `if (!userId || !route) return 0;`.
   Kể cả bị gọi với `''` (autosave 3D truyền `userId ?? ''`, `cad3d-autosave.ts:33`) thì trả `0`, chưa kịp
   mở DB. Nếu **không** có cổng này, khoá hỏng sẽ là `::/present-editor::prj_x` — ca ④ trong test in ra
   đúng chuỗi đó để làm chứng cứ hình dạng.
3. **`startCad3DAutosave` tự chặn** — `cad3d-autosave-core.ts:75-77` trả handle rỗng.
4. **`setLastUserId('')` không đè được id thật** — `lib/resume.ts:145`.

⇒ Dữ liệu **chỉ sống trong `useCadStore`/React state** rồi bay theo tab. **Không có bản ghi nào của người
này rơi vào bucket người khác.** Đây là tin tốt duy nhất của ca hỏng: mất là mất của chính mình, không lây.

Điều làm nó **im lặng**: `onSavingChange` nằm trong tuỳ chọn của saver — không có saver thì `useSaveStatus`
**không bao giờ đổi trạng thái**, nên StatusBar không hiện "Đang lưu…"/"Đã lưu", cũng không hiện lỗi.
Người dùng không có một tín hiệu nào để nghi ngờ.

## D · BẢNG MỌI NƠI TIÊU THỤ × ĐÃ CHE CHƯA

Phân loại theo **thời điểm đọc** — đó mới là thứ quyết định có tự lành hay không, không phải tên hàm.

| # | Nơi tiêu thụ | Thời điểm đọc | Hậu quả nếu null | Đã che? |
|---|---|---|---|---|
| 1 | **`components/cad/CadSheets.tsx:402`** | effect mount `[bucketId]` | 🔴 **MẤT BẢN VẼ** | 🔴 **CHƯA** |
| 2 | **`components/present-editor/PresentSheets.tsx:322`** | effect mount `[bucketId]` | 🔴 **MẤT DECK** | 🔴 **CHƯA** |
| 3 | **`lib/cad/cad3d-autosave.ts:32`** | effect mount `[bucketId]` | 🔴 **MẤT KHỐI 3D** | 🔴 **CHƯA** |
| 4 | `components/entry/ResumeTracker.tsx:42` | effect `[pathname]` | quên chỗ đang đứng | 🟡 đúng **từ lần điều hướng thứ 2** |
| 5 | `lib/project-scope.ts:62` `activeProjectRouteId` | lúc điều hướng | redirect route cũ dội về `/?notice=choose-project` | 🟡 đúng nếu bấm sau khi định danh về |
| 6 | `components/library/LibrarySheet.tsx:407` | trong handler | `addedBy` rỗng | ✅ |
| 7 | `components/studio/AppChrome.tsx:203` | mỗi lần chuột/phím | phút khoá màn về mặc định | ✅ |
| 8 | `components/present-editor/CongThietLapTrang.tsx:166` | handler `veLai2D` | về 2D không đúng tờ | ✅ |
| 9 | `components/settings/LockScreenSettings.tsx:21` | render | cài đặt về mặc định | 🟡 cần một lượt re-render |
| 10 | `components/studio/VitalsGesture.tsx:485` | render | — (thành phần này hiện **không mount ở đâu**, xem ⑦.5) | — |
| 11-18 | 8 chỗ `effectiveUserId(storeUserId)`: `CadStageScreen:82` · `CadCanvas:354` · `AiBriefPanel:181` · `PresentStageScreen:47` · `PresentEditor:1270` · `Toolbar:194,1169` · `Inspector:1416` · `LayoutShelf:171` · `BoqAppendixStatus:26` · `GuModelSettings:30` | render | onboarding/coachmark im lặng; **nút BOQ bấm không ra gì** | 🟡 cần một lượt re-render sau khi gieo |

**Điểm phải nói rõ về nhóm 11-18**: `setLastUserId` **không phải state phản ứng** — gieo xong **không** kích
hoạt re-render. Chúng chỉ đúng ở lượt render kế tiếp do nguyên nhân khác. Riêng `/projects/[id]/present` có
đường tự lành riêng (`PresentStageScreen.tsx:61-75` hỏi `/api/auth/me` rồi `setUser` ⇒ store đổi ⇒ re-render);
**`/projects/[id]/cad` KHÔNG có** (`grep "auth/me\|setUser" components/studio/CadStageScreen.tsx` = 0 dòng).

## E · BẢNG CA BIÊN × HÀNH VI

Đọc từ `lib/danh-tinh-phien.ts:98-122` đối chiếu hợp đồng `app/api/auth/me/route.ts:9-30`.

| Ca biên | Máy chủ trả | Hành vi | Có ghi đệm? | Đánh giá |
|---|---|---|---|---|
| Mất mạng khi hỏi | `fetch` reject | `khong-ket-luan/mang-dut` (`:103`) | **KHÔNG** | ✅ đúng — không kết luận nhầm "chưa đăng nhập" |
| Phiên hết hạn | `401` (+ máy chủ tự xoá cookie, `route.ts:25`) | `chua-dang-nhap` (`:108`) | **KHÔNG** | ✅ |
| Hạ tầng lỗi | `503` | `khong-ket-luan/may-chu-loi` (`:107`) | **KHÔNG** | ✅ đúng — người dùng **vẫn** đang đăng nhập, không đá ra oan |
| Thân JSON hỏng / thiếu `user.id` | `200` nhưng lạ | `than-hong` / `thieu-id` (`:114`, `:119`) | **KHÔNG** | ✅ |
| Gọi chậm / treo | không trả lời | hết giờ **8s** ⇒ `cat()` huỷ request (`:98-101`) | **KHÔNG** | ✅ **không chặn hiển thị** — `AppChrome` chỉ `void`, không `await` |
| `localStorage` bị chặn | — | đường lùi trong bộ nhớ (`resume.ts:140,146`) | trong RAM | ✅ sống hết vòng đời tab; **chết khi F5** (đã khai) |
| Hai tab, **hai tài khoản khác nhau** | — | `demTrongBoNho` là biến module ⇒ **riêng từng tab**, và nó **thắng** `localStorage` (`resume.ts:158`) | riêng tab | ✅ tab đã định danh không bị tab kia kéo sang |
| Tab **chưa** định danh, tab kia vừa đăng nhập tài khoản khác | — | `docDem()` đọc `localStorage` **dùng chung** ⇒ có thể lấy id của tài khoản kia, và **trả `da-co` luôn, không hỏi máy chủ** | có sẵn | 🔴 **xem ⑦.4** |
| Đăng xuất → đăng nhập tài khoản khác **cùng tab** | — | `LoginForm.tsx:135` `setLastUserId(id mới)` đè cả RAM lẫn localStorage | đúng id mới | ✅ |
| Đăng xuất rồi **không** đăng nhập, F5 vào deep-link | `401` | đệm **vẫn còn id cũ** ⇒ `docDem()` trả `da-co`, không hỏi máy chủ | id **cũ** | 🔴 **xem ⑦.4** |

## F · NGHIỆM THU — MÃ THOÁT BẮT TRỰC TIẾP

Bắt bằng `cmd > /tmp/x 2>&1; echo "name=$?"` (không qua ống dẫn — `cmd | tail; echo $?` bắt mã thoát của
`tail`, luôn ra 0; lỗi này đã làm báo sai một con số trong ngày).

| Cổng | Mã thoát | Ghi chú |
|---|---|---|
| `npx tsc --noEmit` | **0** | trước và sau đều 0 |
| `npm test` | **0** | 311 tệp test, **tất cả `0 fail`** (kiểm bằng `grep -oE "[0-9]+ fail" \| grep -v "^0 fail"` = rỗng); +15 khẳng định mới |
| `npm run soi:frontier` | **0** | 🔴 0 lệch · 👁1 · ✅77 · ⬜56 — **y hệt trước**, không tệ đi |
| `npm run soi:contract` | **0** | 🔴 0 lệch · 🔗21 có dây · 🟡1 chờ dây — **y hệt trước** |

`git status --short` = đúng một dòng `?? lib/danh-tinh-phien-nghiem-thu.test.ts`; `git diff --stat` rỗng.
Không commit, không push.

## G · VIỆC CÒN LẠI — CẦN MAIN MỞ 3 TỆP NGOÀI FILES_ALLOWED

Không tự mở rộng phạm vi. Patch đề nghị, **sửa lại so với đề xuất lượt trước**: dùng thẳng
`danhTinhChoLuot(conSong)` thay vì `danhTinhSanSang()` + `getLastUserId()` — đó là API lõi viết riêng cho
đúng ca này, nó **gộp sẵn cờ huỷ** (`tiepTuc`) nên không phải tự chế cách chờ, và nay đã có test canh:

```ts
    let cancelled = false;
    void (async () => {
      const { tiepTuc, userId } = await danhTinhChoLuot(() => !cancelled);
      if (!tiepTuc) return;
      userIdRef.current = userId;
      if (!userId) { setHydratedFor(bucketId); markBucketHydrated(bucketId); return; }
      /* … phần thân hiện có, giữ nguyên … */
    })();
    return () => { cancelled = true; };
```

⚠️ **Khối dọn-khi-đổi-dự-án phải Ở LẠI nhánh đồng bộ** (`CadSheets.tsx:405-413`,
`PresentSheets.tsx:325-333`) — đẩy nó vào trong `async` thì bản vẽ dự án cũ sẽ nằm lại dưới URL dự án mới
thêm một vòng mạng. Đây là rủi ro chính của patch và là thứ **bắt buộc phải verify trên app thật**.

Ba tệp: `components/cad/CadSheets.tsx` · `components/present-editor/PresentSheets.tsx` ·
`lib/cad/cad3d-autosave.ts` (tệp thứ ba khác khuôn: nó gọi từ hook, cần `await` trước `startCad3DAutosave`).

## H · CHƯA CHẮC / CHƯA KIỂM (lượt này)

- **Chưa mở app thật một lần nào.** Test dựng lại *hình dạng* effect bằng lời gọi hàm trần — nó chứng minh
  **cơ chế**, không chứng minh **React thật chạy đúng như vậy**. Vẫn cần một lượt verify trình duyệt.
- **Chưa tái hiện ca hỏng bằng bước bấm thật**, và vẫn **chưa biết con đường thực tế nào** tạo ra một trình
  duyệt có cookie hợp lệ mà `localStorage` rỗng (nghi vấn của lượt trước còn nguyên).
- **Bảng D nhóm 11-18 chưa đo bằng cách đếm số lượt render thật** — kết luận "cần một lượt re-render" là suy
  từ ngữ nghĩa zustand, không phải đo.
- Chưa thử Safari/Firefox, chế độ riêng tư, nhiều tab thật, trình đọc màn hình.
- **Con số "3 đường ghi" là SÀN, không phải trần.** Tôi phân loại theo `grep getLastUserId|effectiveUserId`;
  đường nào lấy userId qua biến trung gian hoặc qua props thì grep không thấy.

## I · PHÁT HIỆN NGOÀI PHẠM VI (thêm vào danh sách ⑦)

4. 🔴 **Đệm định danh KHÔNG được rửa khi đăng xuất, và `docDem()` tin đệm mà không hỏi lại.**
   Cả 4 chỗ đăng xuất (`AccountSettings.tsx:54` · `AccountMenu.tsx:137` · `MobileMenu.tsx:160` ·
   `PixelSettingsShell.tsx:191`) chỉ xoá cookie máy chủ + `setUser(null)` — **không chỗ nào** xoá
   `lastUserId`; `quenDemTrongBoNho()` thì tự khai *"chỉ dùng trong test"*. Cộng với `giaiDanhTinh` đọc đệm
   trước và **trả `da-co` mà không hề xác thực** (`lib/danh-tinh-phien.ts:82-83`), hệ quả là: trên **máy dùng
   chung**, sau khi A đăng xuất, việc làm tiếp trong tab cũ có thể ghi vào **bucket của A**. Đây đúng thứ mà
   docstring của chính mô-đun cấm (*"thà không lưu còn hơn lưu nhầm chỗ người khác"*). Là bệnh **có sẵn**,
   không do lượt này gây ra — nhưng nay định danh đã được nâng thành *nguồn sự thật* thì nó phải vào sổ.
   Hướng rẻ nhất: đăng xuất gọi một hàm rửa đệm dùng chung (một cửa, không vá 4 chỗ).
5. **`components/studio/VitalsGesture.tsx` không được mount ở đâu** — khớp mục D-DR1 trong `00-CHOT`
   (04/09): `VitalsRightEdgeHost` chưa từng mount, `StageSwitcher` đã thôi được mount từ 17/08. Dòng 485 của
   nó vì thế là mã chết; ghi ở đây để đợt di trú Vitals sang khẩu độ mép trên không bỏ sót.
6. **Đã có 5 nơi độc lập cùng gọi `/api/auth/me`** — `HomeScreen:366` · `SessionWatch:36` ·
   `PresentStageScreen:66` · `danh-tinh-phien:143` (+ 4 chỗ `DELETE` để đăng xuất). Chúng **không dùng chung
   single-flight**, mỗi cái tự diễn giải 401/503 theo kiểu riêng, và **chỉ `LoginForm`/`HomeScreen` là ghi
   đệm** — `SessionWatch` biết người dùng là ai nhưng không nói cho ai biết. Đúng cụm *"một cỗ máy nhiều mặt
   tiền"*: nên gộp về `danhTinhSanSang()` làm cửa duy nhất. Không làm trong lượt này.
