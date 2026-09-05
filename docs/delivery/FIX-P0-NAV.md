# FIX P0-NAV — hai lỗi P0 điều hướng (05/09)

Làn **P0-NAV**, cây `.claude/worktrees/nen-moi`, nhánh `nen-checkpoint`, mốc `f5acbfa6`
(`git rev-list --count HEAD..nen-checkpoint` = **0** — đứng đúng mốc, không lệch).
Nguồn phiếu: `docs/delivery/AUDIT-THAO-TAC-A1.md` mục `A1-01` · `A1-02`.

---

## ⓪ TIỀN ĐỀ — xác nhận, không bác

Cả hai lỗi **TÁI HIỆN ĐƯỢC** trên app thật trước khi sửa một dòng nào.

---

## LỖI 1 · `A1-01` — nút "Quay lại" bật người dùng ra `about:blank`

### Tái hiện (trước khi sửa)

Playwright + Chromium 1194, tab mới, dán thẳng URL:

```
=== CA② VÀO NGANG /projects/default/notebook ===
url    : http://localhost:3213/projects/default/notebook
hist   : 2
state  : {"__NA":true,"__PRIVATE_NEXTJS_INTERNALS_TREE":[…]}
có nút Quay lại: true
>>> SAU KHI BẤM: about:blank
```

Không riêng notebook — **cả bốn** chỗ còn lại đều rơi ra ngoài app:

| Route | `history.length` lúc vào ngang | Sau khi bấm |
|---|---|---|
| `/projects/<id>/notebook` | 2 | `about:blank` |
| `/library/ingest` | 2 | `about:blank` |
| `/settings/about` | 2 | `about:blank` |
| `/settings/licenses` | 2 | `about:blank` |
| `/colors` | 2 | `about:blank` **ngay lúc tải, không cần bấm gì** |

### Gốc bệnh — ĐO ĐƯỢC

Hai cách viết, cùng một sai lầm:

| Cách | Ở đâu |
|---|---|
| `router.back()` **trần** | `app/projects/[id]/notebook/page.tsx:63` · `app/settings/about/page.tsx:34` · `app/settings/licenses/page.tsx:76` · `app/settings/_components/PixelSettingsShell.tsx:166` |
| lá chắn `window.history.length > 1` | `app/colors/page.tsx:32` · `app/library/ingest/page.tsx:63` · `components/photo-editor/PhotoToolbar.tsx:117` · `components/present-editor/Toolbar.tsx:542` |

**`history.length` không trả lời được câu ta cần hỏi.** Câu cần hỏi là *"phía sau tôi có trang NÀO
CỦA IF không"*; `history.length` chỉ đếm số ô trong ngăn lịch sử của TAB, **kể cả ô của trang
ngoài**. Đo được: tab mới + dán URL cho **`history.length === 2`** (ô `about:blank` + ô vừa mở)
⇒ lá chắn `> 1` **qua** ⇒ `back()` chạy ⇒ rơi ra ngoài app. Lá chắn không sai vì viết ẩu — nó sai
vì **đo nhầm đại lượng**.

`app/library/page.tsx` (khuôn gốc mà `/colors` chép lại) đã **hết bệnh từ 02/09** — nó nay là
trang thật, không còn `router.back()`. Chỉ bản sao ở `/colors` còn giữ lời giải cũ.

### Sửa gì

Một mô-đun thuần **`lib/nav/lui-an-toan.ts`** (luật K1 — một việc một chỗ), mọi nơi GỌI nó.
Cơ chế: **đóng dấu chỉ số của chính mình vào `history.state`** — mỗi ô lịch sử do IF tạo mang thêm
`ifIdx` (thứ tự trong chuỗi IF của tài liệu) + `ifLen` (`history.length` lúc đóng dấu). Ô đầu chuỗi
mang `ifIdx = 0` ⇒ **`ifIdx > 0` mới có đường lui**.

**Vì sao đọc được PUSH ↔ RESTORE — đo tại nguồn trong `node_modules/next` 14.2.35**, không suy đoán:

| file:dòng | Nói gì |
|---|---|
| `client/components/app-router.js:103` | state mới = `{ ...(pushRef.preserveCustomHistoryState ? window.history.state : {}), __NA, tree }` |
| `router-reducer/reducers/navigate-reducer.js:101,219` | điều hướng mới ⇒ `preserveCustomHistoryState = false` ⇒ **key lạ bị BỎ** |
| `router-reducer/reducers/restore-reducer.js:38` | back/forward ⇒ `true` ⇒ **key lạ được GIỮ** |

⇒ "không thấy dấu" ⇔ ô mới tinh · "thấy dấu" ⇔ ô được khôi phục. Đó là cả cơ chế.
PUSH ↔ REPLACE thì Next bỏ dấu như nhau, nên phân biệt bằng `history.length`: đẩy thêm ô thì length
TĂNG, đè lên ô cũ thì GIỮ NGUYÊN.

⚠️ Dấu phải **MERGE** vào state cũ, không được thay cả state — thay là mất
`__PRIVATE_NEXTJS_INTERNALS_TREE` và gãy điều hướng của Next. Vì giữ `__NA`, cú `replaceState` của
ta rơi đúng nhánh nhanh của bản vá Next (`app-router.js:447`) nên **không đụng tới router**.

**Chỗ đóng dấu:** `components/studio/AppChrome.tsx` (vỏ chung, phủ gần như mọi màn) + từng màn
KHÔNG bọc vỏ (`notebook` · `ingest` · `colors` · photo · present) tự gọi — hàm đóng dấu idempotent
nên chồng nhau vô hại.

**Đích dự phòng** giữ đúng thứ đã có sẵn tại chỗ, không bịa đích mới:

| Màn | Đích dự phòng | Vì sao không phải đích mới |
|---|---|---|
| notebook | `/` | dòng "InteriorFlow" ngay dưới nút đã là `<Link href="/">` |
| `/settings` · photo · present · ingest | `/` | đúng đích `else` cũ của chính chúng |
| `/settings/about` · `/settings/licenses` | `/settings` | trang cha; nhãn ngay dưới nút đã ghi "Cài đặt" |
| `/library/ingest` | `?from=` **vẫn ưu tiên**, `/` là lưới đỡ | giữ nguyên thứ tự cũ |

🔧 **`/settings/about` + `/settings/licenses` → `/settings` là chỗ duy nhất tôi chọn đích không
phải `/`.** Nêu ra để duyệt lại nếu thấy quá tay.

---

## LỖI 2 · `A1-02` — Vitals đẻ chỗ đứng thứ hai + dựng một dự án không tồn tại

### Tái hiện (trước khi sửa) — tài khoản **0 dự án**, đăng nhập thật

```
sau bấm khẩu độ url: http://localhost:3213/
nút ⤢ có mặt: true
  aria-label: Mở NotebookLM đầy đủ · Full
>>> SAU ⤢ url: http://localhost:3213/projects/default/notebook
    đầu trang: Quay lại | INTERIORFLOW / DỰ ÁN · PROJECT #DEFAULT / | Notebook · Sổ tay dự án …
    có khẩu độ Vitals trên màn này?: false
```

Bốn điều nó phá, **đều là luật đã chốt**, không phải chuyện gu:

1. `ACTIVE-DESIGN-CONTEXT` §4 **D-DR1** — *"sau di trú phải còn ĐÚNG MỘT chỗ đứng vật lý"*.
   Đo được: trên `/projects/<id>/notebook`, `[data-vitals-state]` = **0 phần tử** ⇒ chỗ đứng thứ
   hai, và là **ngõ cụt** (không có khẩu độ để quay về).
2. §2 **Morph giữ định danh** — aperture→peek→engage phải là *cùng một vật nở ra*; đây là teleport.
3. `00-CHOT` 04/09 — *"trong IF AI tương tác là Vitals, không có mặt AI thứ hai"*; nhãn còn lộ tên
   sản phẩm ngoài (**"NotebookLM"**).
4. `const id = currentProjectId || currentFlowId || 'default'` (`VitalsGesture.tsx:470`) **bịa ra
   một dự án không có trên tài khoản** — đầu trang in `DỰ ÁN · PROJECT #DEFAULT`.

### Kiểm TRƯỚC KHI GỠ — route có mồ côi không? **KHÔNG.**

`grep -rn "/notebook" app components lib` cho **3 lối vào thật** ngoài nút ⤢:

| file:dòng | Lối vào |
|---|---|
| `app/projects/[id]/overview/page.tsx:224` | `<Link>` trên trang Tổng quan dự án |
| `app/library/knowledge/page.tsx:27` | nút "Thêm tài liệu (Sổ tay)" |
| `lib/library/knowledge.ts:147` | `href` của mỗi mục tri thức |

Lối ① đã **đi thật** trong nghiệm thu (CA① notebook) ⇒ không phải suy từ mã.
⇒ Gỡ nút ⤢ không làm route mồ côi, **không phải dừng hỏi**.

### Sửa gì — việc TRỪ ĐI

* `components/studio/VitalsGesture.tsx` — gỡ `openFullNotebook` + nút ⤢ + import `Maximize2`,
  thay bằng bia mộ ghi đủ 4 lý do + 3 lối vào còn lại. Mức **Engage đã là mặt đầy đủ** (EXS §7)
  nên không mất năng lực nào.
* `components/studio/StageSwitcher.tsx` — nhánh `notebook-full` (`:172`) mang **cùng một lỗi**:
  cũng `router.push('/projects/<id>/notebook')`, cũng `|| 'default'`. Nay **không điều hướng đi
  đâu**, chỉ giữ panel đang mở.
  🔴 **Xác minh lời phiếu**: `StageSwitcher` đúng là **không còn được mount ở đâu** —
  `grep -rn "StageSwitcher" app components lib` cho 0 nơi dựng thẻ, và `AppChrome.tsx:404` ghi rõ
  đã gỡ 17/08. Nhánh đó **không chạy trên app thật**; sửa để nếu có ngày mount lại thì nó KHÔNG
  hồi sinh chỗ đứng thứ hai.
  Kèm theo: `currentProjectId` · `currentFlowId` · `router` sau đó **chỉ còn nằm trong mảng deps**
  (đếm sau khi bỏ chú thích: 1 chỗ khai + 1 chỗ deps, 0 chỗ dùng) ⇒ gỡ luôn cả ba + import
  `useRouter`, để không còn mã chết.

`lib/input/stage-drop.ts` **KHÔNG đụng** — ngoài vùng ghi; verdict `notebook-full` vẫn sinh ra như
cũ, chỉ đổi nghĩa thành "đã kéo qua ngưỡng hai".

---

## BẰNG CHỨNG CHẠY THẬT (sau khi sửa)

Máy chủ **`next dev` riêng ở `/tmp/p0nav-app`, cổng 3213, CSDL riêng**, đăng nhập thật bằng tài
khoản mới đăng ký. Chromium 1194 qua Playwright. Ảnh: `docs/delivery/anh-duyet-mat/p0-nav/`.

### A1-01 · bốn ca × hai lối nhập

| Màn | CA① đi trong app (mềm) | CA② vào ngang | CA② bàn phím |
|---|---|---|---|
| `/projects/<id>/notebook` | ✅ overview →(mềm) notebook `ifIdx=1` →(lui) **overview** | ✅ `ifIdx=0 len=2` → **`/`** | ✅ Tab **1** nhịp → **`/`** |
| `/settings` | ✅ `/` →(mềm) `/settings` `ifIdx=1` →(lui) **`/`** | 🟡 *không đo được* (xem ⑦b) | ✅ Tab **15** nhịp → **`/`** |
| `/settings/about` | ✅ `/` →(mềm) about `ifIdx=1` →(lui) **`/`** | ✅ → **`/settings`** | ✅ Tab **1** nhịp → **`/settings`** |
| `/settings/licenses` | (không có lối vào mềm) | ✅ → **`/settings`** | ✅ Tab **1** nhịp → **`/settings`** |
| `/library/ingest` | ✅ `/library` →(mềm) ingest `ifIdx=1` →(lui) **`/library`** | ✅ → **`/`** | ✅ Tab **1** nhịp → **`/`** |
| `/colors` (chuyển hướng lúc tải) | — | ✅ vào ngang → **`/`**, `ifIdx=0` | — |

**Không ca nào ra `about:blank`.** Trước khi sửa, sáu chỗ trên đều ra `about:blank`.

### CA③ · vào ngang → đi tiếp 2 trang → lui 3 lần

```
ifIdx: 0 → 1 → 2
ba bước lui: /settings  →  /settings/licenses  →  /settings
ĐIỂM CHẶN — sau 3 lần lui còn trong app? ✅ http://localhost:3213/settings
```
Lần lui thứ ba đứng ở `ifIdx = 0` ⇒ **không gọi `back()`**, đi đường dự phòng ⇒ không lọt ra ngoài.
Đúng thiết kế.

### CA④ + A1-02 · tài khoản 0 dự án, khẩu độ Vitals ở Home

```
=== A1-02 SAU SỬA (Home, khẩu độ Vitals mức Engage)
   URL vẫn ở Trang chủ?      ✅ http://localhost:3213/
   nút ⤢ [data-vitals-expand] ✅ 0 (đã gỡ)
   lộ chữ "NotebookLM"        ✅ không còn
```

### Máy kiểm

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` (toàn dự án) | **0 lỗi trong vùng P0-NAV.** Lượt chạy đầu (11:0x) sạch tuyệt đối; lượt cuối có **1 lỗi ở `lib/sheets-persist.ts:503`** — tệp của **làn khác**, ngoài vùng ghi của tôi, `grep "lui-an-toan"` trong đó = 0. **Báo lại, KHÔNG sửa** theo đúng chỉ dẫn phiếu. |
| `lib/nav/lui-an-toan.test.ts` | **21 pass · 0 fail** |
| `components/studio/mot-cho-dung.test.ts` (máy canh MỘT chỗ đứng) | **14 pass · 0 fail** |

Không chạy `npm test` đầy đủ theo đúng chỉ dẫn phiếu.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

1. **Chỉ đo Chromium 1194.** Chưa thử Firefox, Safari/WebKit, và **chưa thử trong Electron** —
   mà Electron mới là bản chuẩn của IF. `history.state` trong `BrowserWindow` hành xử như Chromium,
   nhưng đó là **suy luận, không phải phép đo**.
2. **Chưa thử trình đọc màn hình.** Có đo Tab-tới-được + Enter kích hoạt đúng 1 lần, không đo
   NVDA/VoiceOver đọc ra gì.
3. **Đo trên `next dev`, không phải bản dựng phát hành.** Next có thể khác ở chỗ `preserveCustom
   HistoryState`? Đã đọc mã `node_modules/next` (chung cho cả hai chế độ) nên rủi ro thấp, nhưng
   chưa chạy trên `next build`.
4. **Hai giới hạn CỐ Ý của lời giải**, ghi rõ trong `lib/nav/lui-an-toan.ts` đầu tệp:
   · **tải trang cứng làm mất chuỗi** ⇒ có trang IF phía sau mà vẫn báo "không có đường lui" và đi
   đường dự phòng. Đường chữa hiển nhiên (`sessionStorage`) làm chuyện **TỆ HƠN** — nó sống suốt
   tab nên ai rời sang trang ngoài rồi dán URL IF mới trong cùng tab sẽ mang chỉ số cũ ⇒ báo thừa
   ⇒ lại bật ra ngoài. Chỉ chấp nhận sai một chiều: **báo thiếu thì về một trang IF có thật.**
   · **`history.length` đụng trần 50 của Chromium** ⇒ đọc nhầm push thành replace ⇒ cùng chiều an
   toàn. Chưa dựng ca thật 50 ô để đo, mới khoá bằng test lõi.
5. **Đổi query trên cùng một `pathname` không đóng dấu lại** (`useDongDauLichSu` chỉ theo
   `pathname`). Chưa gặp ca hỏng vì chuyện đó; không đổi lấy ràng buộc Suspense của
   `useSearchParams`.
6. 🔴 **`/library/ingest`: DẤU BỊ XOÁ MẤT, đo được `ifIdx = undefined` khi vào ngang** (kể cả ở
   lượt đo thong thả nhất, `hydration=0`, chờ 20s). Nhiều khả năng `HistoryUpdater` của Next chạy
   `replaceState` **sau** effect của ta (`preserveCustomHistoryState=false` ⇒ quét sạch key lạ).
   **Hành vi vẫn ĐÚNG** vì trí nhớ `truoc` trong mô-đun không bị xoá và `coDuongLui()` đọc nó khi
   `history.state` không có dấu — nên nút vẫn về `/` chứ không ra `about:blank`. Nhưng nghĩa là
   **lớp bền là biến mô-đun, không phải cái dấu**, và điều đó chưa được kiểm bằng test riêng.
   Việc nên làm: một máy canh khẳng định `ifIdx` còn sống sau khi Next ổn định.
7. 🟡 **`/settings` ca "vào ngang · chuột" KHÔNG LẤY ĐƯỢC SỐ ĐO** — hai lượt đều hỏng ở khâu tìm
   nút (`.backlink` đếm ra **0** phần tử, `locator.click` hết 60s). Lối **bàn phím trên đúng nút
   đó, đúng handler đó, ĐẠT** (Tab 15 nhịp → `/`), và cả hai ca CA① của màn này cũng ĐẠT.
   ⇒ Tôi **không tuyên bố ca này đạt**; tôi tuyên bố **chưa đo được**. Bối cảnh: máy đang tải
   `load average 67 → 110` vì bốn làn khác chạy song song, `/settings` là màn nặng nhất.
8. **`photo-editor` và `present-editor` CHƯA đi được trên app thật** — chúng cần một dự án có nội
   dung/ảnh, dựng đúng trạng thái đó tốn hơn phần còn lại của phiếu. Đã sửa theo cùng mô-đun và
   `tsc` sạch, nhưng **chỉ hai màn này là suy từ mã**, không phải đo.
9. **Cả lô đo dưới tải rất nặng** (`load average` 67→110 vì bốn làn chạy song song). Bốn dòng FAIL
   ở lượt chạy giữa chừng đều là **nút không kịp bấm / trang chưa kịp dựng**, không phải "bật ra
   ngoài app" — nhưng đó là lý do tôi phải đo lại thong thả từng ca thay vì tin lượt chạy gộp.

---

## Chỗ tôi BÁC hướng phiếu đề xuất

**Không bác — nhận hướng, nhưng phải thêm một nửa mà phiếu chưa nêu.**

Phiếu đề xuất *"trang vào đầu tiên mang `ifIdx = 0`; mỗi lần đẩy trang mới thì `ifIdx` tăng"*.
Đúng, nhưng **thiếu ca `replace`**, và thiếu nó thì lỗi cũ mọc lại ở đúng chỗ vừa vá:
`/colors` khi vào ngang chạy `router.replace('/')`. Nếu đếm replace như push thì trang `/` mang
`ifIdx = 1` ⇒ báo "có đường lui" ⇒ ô phía sau lại là trang NGOÀI ⇒ **bật ra `about:blank` lần nữa**.
Đây là chiều sai NGUY HIỂM (báo thừa), khác hẳn chiều báo thiếu.

⇒ Thêm `ifLen` và phân biệt bằng `history.length` (push tăng, replace không). Ca này có test riêng
(`[4] REPLACE` trong `lib/nav/lui-an-toan.test.ts`).

---

## Phát hiện NGOÀI PHẠM VI — ghi lại, KHÔNG tự sửa

1. 🔴 **`.env` dùng chung bị một làn khác đổi `DATABASE_URL` sang `file:/tmp/a5-app/prisma/dev.db`.**
   Giữa phiên, tài khoản kiểm thử của tôi "biến mất" (bảng `user` rỗng) vì CSDL đã bị trỏ đi nơi
   khác. Không phải lỗi của ai — nhưng `.env` là **tài nguyên dùng chung không có khoá phạm vi**,
   đúng họ `claim-keys-va-cham` (khoá phải khai được cả **định danh**, không chỉ đường dẫn tệp).
2. 🔴 **`next dev` chạy trong cây worktree ghi đè `.next` mà cổng 3210 (`next start` của làn khác)
   đang phục vụ** — `/proc/<pid>/cwd` của tiến trình 3210 trỏ đúng cây này. Tôi đã dừng và chuyển
   sang thư mục tách rời `/tmp/p0nav-app` (cùng cách các làn khác đang làm: `/tmp/a5-app` 3217,
   `/tmp/p0-luu-app` 3215). Đã kiểm lại: **3210 vẫn trả HTTP 200**. Đáng thành một dòng luật trong
   `LUAT-WORKTREE-LANE.md`: *cấm chạy `next dev` trong cây worktree dùng chung* — `next dev` GHI
   vào `.next`, đúng thư mục `next start` của làn khác đang đọc.
3. 🔴 **`npx tsc --noEmit` đang ĐỎ vì làn khác**: `lib/sheets-persist.ts(503,19) TS2339: Property
   'khongGuiGi' does not exist on type '{ ok: boolean; loi: string; }'` — một nhánh của union
   không khai trường đó. Không đụng vì ngoài vùng.
4. 🟡 **`/settings/about` và `/settings/licenses` không có đường vào bằng `<a href>`** — chỉ tới
   được qua nút trong menu tài khoản (nút thứ 4 ở header) hoặc gõ URL. Không phải lỗi, nhưng nó là
   lý do hai màn này gặp ca "vào ngang" thường xuyên hơn ta tưởng.
