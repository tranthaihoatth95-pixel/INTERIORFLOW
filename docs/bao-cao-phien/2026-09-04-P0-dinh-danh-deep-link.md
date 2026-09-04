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
- **`fetch` trong `danhTinhSanSang()` chưa có timeout.** Nếu máy chủ treo (không trả lời, không lỗi), promise
  treo theo. Hiện vô hại vì `AppChrome` chỉ `void`; sẽ **thành hại** nếu MAIN duyệt patch trên (3 đường ghi
  `await` nó ⇒ treo luôn phần khôi phục sheet). **Duyệt patch thì phải kèm timeout** — tôi cố ý chưa thêm để
  không đoán ngưỡng thay MAIN.
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
