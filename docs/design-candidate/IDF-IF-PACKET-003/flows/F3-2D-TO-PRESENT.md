# F3 — 2D → Visual + 3D → Trình bày → Xuất → mở lại

> Gói thi công · `IF-MVP-FLOWS-001` · xác minh lại trên **HEAD `147f66a`**
> (lượt đo gốc ghi `ad26391` — các chỗ lệch liệt kê ở §8).

---

## 1. Nhãn

**`EXISTS-PARTIAL`** — nhưng là luồng **khoẻ nhất** trong ba luồng: mở lại (reopen) chạy thật,
ba lớp, có cả cơ chế chống ghi đè bằng deck rỗng. Còn đúng **một lỗ**, và nó nằm ở chỗ đắt nhất:
kết quả visual-generate chỉ sống trong RAM, trong khi `XuatXu` — cấu trúc xuất xứ đầy đủ nhất
repo — **không được ghi xuống đâu cả**.

---

## 2. Bản đồ chuỗi chạy

| chặng | file:dòng | trạng thái | loại |
|---|---|---|---|
| Bàn giao CAD → Home (stash) | `lib/cad/handoff.ts:52` (`stashCadHandoff`) | CHẠY | OBSERVED |
| Nhận bàn giao ở Home (consume-once) | `lib/cad/handoff.ts:101` (`applyCadHandoff`), gọi ở `components/home/HomeScreen.tsx:58` | CHẠY | OBSERVED |
| Tự lưu 3D theo dự án | `lib/cad/cad3d-autosave.ts:28` (`useCad3DAutosave`) → `cad3d-autosave-core.ts` | CHẠY | OBSERVED |
| Chip `visual-generate` mở cửa duyệt | `components/ui/StageToolbelt.tsx:117-118`, render `:92`, component `:144` | CHẠY | OBSERVED |
| Thi hành dựng ảnh | `lib/capabilities/visual-generate-run.ts:84` (`chayDungHinhAnh`) | CHẠY | OBSERVED |
| Chạy node thật (dùng lại registry, không đẻ đường mới) | `lib/execution.ts:295` (`runNode`), gọi ở `visual-generate-run.ts:136` | CHẠY | OBSERVED |
| Trừ / hoàn credit nguyên tử phía máy chủ | `app/api/jobs/route.ts:8` (POST), `:6` import `spendCredits`/`refundCredits`, chặn vô danh `:10-11` | CHẠY | OBSERVED |
| Đưa kết quả thành ĐỀ XUẤT (chưa được đi tiếp) | `lib/capabilities/nguon-anh.ts:62` (`themDeXuat`) | CHẠY | OBSERVED |
| Người bấm NHẬN → đổi xuất xứ + thành ảnh nguồn bước sau | `lib/capabilities/nguon-anh.ts:71` (`nhanDeXuat`) → `visual-generate.ts:304` (`nhanKetQua`) | CHẠY | OBSERVED |
| **Toàn bộ state nguồn-ảnh nằm trong biến module** | `lib/capabilities/nguon-anh.ts:35` (`BAN_DAU`), `:37` (`let state`) | **RAM THUẦN — 0 lượt persist** | OBSERVED (grep `localStorage`/`sessionStorage` trong tệp = 0) |
| **Cấu trúc xuất xứ đầy đủ nhất repo** | `lib/capabilities/visual-generate.ts:244-264` (`XuatXu`), dựng ở `:279` (`dungXuatXu`) | **KHÔNG GHI XUỐNG ĐÂU** | OBSERVED |
| Bàn giao CAD → Present (stash) | `lib/cad/present-handoff.ts:45` (`stashCadPresentHandoff`) | CHẠY | OBSERVED |
| Nhận ở Present (consume-once) | `lib/cad/present-handoff.ts:98` → `components/present-editor/PresentEditor.tsx:393` | CHẠY | OBSERVED |
| Bàn giao Spec → Present (cùng khuôn, không đẻ cơ chế thứ ba) | `lib/present-editor/spec-present-handoff.ts:36,52` → `PresentEditor.tsx:428` | CHẠY | OBSERVED |
| Xuất PDF | `components/present-editor/PresentEditor.tsx:1499-1507` | CHẠY | OBSERVED |
| Xuất PPTX | `components/present-editor/PresentEditor.tsx:1516-1536` | CHẠY | OBSERVED |
| Xuất PNG | `components/present-editor/PresentEditor.tsx:1545-1549` | CHẠY | OBSERVED |
| Xuất PDF 300dpi (+ cảnh báo mức "Không AI") | `components/present-editor/PresentEditor.tsx:1573,1590-1604` | CHẠY | OBSERVED |
| **REOPEN lớp 1** — khôi phục từ IndexedDB lúc mount | `components/present-editor/PresentSheets.tsx:312-313` | **CHẠY** | OBSERVED |
| **REOPEN lớp 2** — kéo về từ máy chủ | `components/present-editor/PresentSheets.tsx:367` → `lib/present-editor/luu-len-may-chu.ts:77` (`taiDeckTuMayChu`) | **CHẠY** | OBSERVED |
| **REOPEN lớp 3** — ghi đĩa nhịp riêng (throttle 10s) | `components/present-editor/PresentSheets.tsx:444` | CHẠY | OBSERVED |
| Sao lưu máy chủ nhịp chậm 30s | `components/present-editor/PresentSheets.tsx:426` → `luu-len-may-chu.ts:40` | CHẠY | OBSERVED |
| **Chống ghi đè bằng deck rỗng** (đã trả giá thật) | `lib/present-editor/luu-len-may-chu.ts:54` + docstring `:49`, `:91` | CHẠY | OBSERVED |

---

## 3. Chỗ đứt chính xác

**Lỗ duy nhất — kết quả visual-generate bay hơi cùng cả xuất xứ của nó.**

`lib/capabilities/nguon-anh.ts` là một store module-singleton: `let state` ở `:37`, một `Set`
người nghe ở `:38`, và **không một lượt `localStorage`/`sessionStorage`/`fetch` nào** trong cả
tệp. `themDeXuat` (`:62`) và `nhanDeXuat` (`:71`) chỉ gọi `dat()` — ghi vào biến trong bộ nhớ.

Điều làm lỗ này đắt hơn nó trông: mỗi `DeXuatHinhAnh` (`visual-generate.ts:314`) mang theo một
`XuatXu` (`:244-264`) — và đó là cấu trúc xuất xứ **đầy đủ nhất repo**: `nangLucId`, `nguon`
(id · revision · kiểu · ảnh đầu vào), `chuoiLenh` (chuỗi lệnh nội bộ **đúng thứ tự**), `thamSo`,
`provider`/`model` (chỉ điền khi đường chạy thật trả về — `:256` khai rõ), `taoLuc`,
`creditUocTinh`, `mucSuThat`, `trangThaiNhan`. Đây chính là thứ trả lời được câu hỏi đắt nhất
của nghề: *"tấm ảnh này ở đâu ra, chạy bằng gì, tốn bao nhiêu, ai đã nhận nó?"*

Nó được dựng công phu (`dungXuatXu` `:279`), được chuyển trạng thái đúng luật (`nhanKetQua` `:304`,
`boKetQua` `:309`), và rồi **không đi đâu cả**.

*Người dùng thấy gì:* chạy 6 lượt dựng ảnh cho một phối cảnh — **credit đã bị trừ thật** ở máy
chủ (`app/api/jobs/route.ts:8`) — chọn được 1 tấm ưng, bấm Nhận. Lỡ tay F5, hoặc máy sleep rồi
tab bị trình duyệt thu hồi. Quay lại: **cả 6 tấm biến mất**, kể cả tấm đã Nhận. Tiền đã tiêu,
kết quả không còn, và **không có cách nào biết mình đã chạy tham số gì** để chạy lại cho đúng.

Đây là bất đối xứng nguy hiểm nhất trong repo: **phía trừ tiền thì bền (DB), phía giữ kết quả
thì bay hơi (RAM)**.

Đối chiếu để thấy độ chênh: cùng file này, Present đã có **ba lớp** giữ deck và một cơ chế chống
ghi đè đã trả giá thật (`luu-len-may-chu.ts:49,54,91`). Cùng một repo, cùng một loại rủi ro —
một bên bọc ba lớp, một bên không lớp nào.

---

## 4. Lát mỏng nhỏ nhất kế tiếp

**Cho `nguon-anh` sống qua F5 — và ưu tiên giữ `XuatXu` hơn giữ ảnh.**

Không bảng mới. Không migrate. Không route mới. Không đụng `execution.ts`, không đụng
`/api/jobs`, không đụng Present.

**Sửa đúng 1 tệp: `lib/capabilities/nguon-anh.ts`.**

1. Thêm `persist()`/`hydrate()` thủ công vào `localStorage` — **dùng lại đúng khuôn đã chạy** ở
   `lib/studio/demo-spine.ts` (docstring `:20-22` ghi rõ khuôn này cố tình không kéo
   zustand/middleware). Không đẻ cơ chế lưu thứ hai.
2. Gọi `persist()` bên trong `dat()` (`:41`) — **một chỗ duy nhất**, vì mọi lượt đổi state đều
   đi qua đó. Đây là lý do lát này rẻ: store đã có một cửa ghi duy nhất.
3. `hydrate()` gọi lazy ở `getNguonAnh()` (`:52`) hoặc `subscribeNguonAnh()` (`:47`) — không ở
   top-level module (tệp bị import trong đường SSR, `localStorage` sẽ ném).
4. **🔴 Quy tắc cắt bắt buộc — ảnh là dataURL, sẽ vỡ quota `localStorage` (~5MB) sau 2-3 tấm.**
   Nên:
   - **Luôn** giữ `XuatXu` của **mọi** đề xuất (nhẹ, vài trăm byte/tấm) — đây là phần đắt.
   - Chỉ giữ `anh` (dataURL) của các đề xuất **đã Nhận** + tấm đang là `anhNguon`.
   - Đề xuất **chưa Nhận** khôi phục ở dạng **có xuất xứ, không có ảnh**, và **phải hiện đúng
     như thế** trên màn: *"đã chạy lúc HH:MM · tham số X · ảnh không còn giữ"*. ⛔ Không hiện ô
     ảnh vỡ, không placeholder giả — luật 5.
   - Bọc mọi lượt `setItem` trong `try/catch`; quota vỡ ⇒ bỏ ảnh trước, giữ xuất xứ, **không**
     nuốt im lặng — đặt một cờ trong state để UI nói được là đã phải cắt.

**Cố tình KHÔNG làm ở lát này:** không ghi `XuatXu` xuống DB. Đường DB duy nhất sẵn có là
`AssetRepresentation` (`schema.prisma:347`) với cột `provenance` (`:366`) — về hình hài thì vừa,
nhưng `POST /api/asset-representation` bắt buộc `assetId` phải trỏ một `LibraryAsset` **có thật**
(`route.ts:60`), mà ảnh visual-generate hôm nay **không** là `LibraryAsset`. Nối vào đó đòi thêm
một bước "đưa ảnh vào Thư viện" — đó là lát riêng, lớn hơn, và **phải đi sau** lát này.

---

## 5. Cờ + đường lùi

- **Cờ:** `NEXT_PUBLIC_IF_NGUON_ANH_PERSIST=1`. Mặc định **tắt**. Tắt ⇒ `dat()` không gọi
  `persist()`, `hydrate()` trả về `BAN_DAU` — hành vi trùng khít hôm nay.
- **Đường lùi:** revert **1 tệp** (`lib/capabilities/nguon-anh.ts`). Dữ liệu tồn đọng là **một
  khoá `localStorage` duy nhất** — người dùng xoá site data là sạch; không có hàng DB nào, không
  có tệp `uploads/` nào cần dọn.
- **Không đụng schema** ⇒ không migration. **Không đụng đường tiền** — `/api/jobs` giữ nguyên,
  nên lát này không thể gây trừ/hoàn credit sai.

---

## 6. Ba ca chứng minh trên runtime

Server đang chạy: **CHINH=3001**. Cần tài khoản đã đăng nhập (`app/api/jobs/route.ts:10-11` chặn
vô danh).

**Ca 1 — CA HÔM NAY TRƯỢT (bắt buộc).**
Đăng nhập, mở Studio, chọn ảnh nguồn. Chip `visual-generate` → cửa duyệt → chạy **2** lượt dựng.
Bấm **Nhận** tấm thứ nhất. Ghi lại số credit còn lại. Reload cứng (**Cmd+Shift+R**), mở lại chip.
- **Hôm nay:** danh sách đề xuất **trống**, ảnh đã Nhận **mất**, `anhNguon` về mặc định. Credit
  **vẫn đã bị trừ**. ⇒ **TRƯỢT**, và trượt ở dạng tệ nhất: mất kết quả nhưng không mất tiền.
- **Sau lát mỏng (cờ bật):** tấm đã Nhận còn nguyên và vẫn là `anhNguon`; tấm chưa Nhận hiện
  **có xuất xứ, không có ảnh**, kèm dòng chữ nói đúng là ảnh không còn giữ.

**Ca 2 — quota vỡ phải nói thật, không được nuốt.**
Chạy **8** lượt dựng liên tiếp (chắc chắn vượt ~5MB dataURL). Không reload.
- **Mong đợi:** app **không** ném lỗi đỏ, **không** đứng hình. Xuất xứ của cả 8 lượt còn đủ.
  UI hiện được rằng đã phải cắt ảnh. Console **không** có `QuotaExceededError` chưa bắt.
- **Trượt nếu:** `localStorage` ném và làm chết `dat()` → cả store đứng, mất luôn tấm đang dùng.
  Đây là rủi ro số một của lát này, phải kiểm bằng ca riêng chứ không suy.

**Ca 3 — reopen của Present không bị lát này làm hỏng.**
*(Ca hồi quy — F3 hiện là luồng khoẻ nhất, không được làm nó yếu đi.)*
Với cờ **bật**: tạo deck 3 slide trong Present, chờ >30s cho sao lưu máy chủ chạy
(`PresentSheets.tsx:426`), xoá IndexedDB bằng tay trong DevTools, reload.
- **Mong đợi:** deck khôi phục **đủ 3 slide** từ máy chủ (`PresentSheets.tsx:367` →
  `luu-len-may-chu.ts:77`), **không** bị deck rỗng đè lên (`:54`). Kết quả phải **y hệt** khi
  chạy lại với cờ tắt.

**`NOT ASSESSED`:** hành vi trên Safari private mode (`localStorage` ném ngay ở `setItem` đầu
tiên, khác Chrome). Phiên này không có máy Safari để chạy; phải kiểm trước khi bật cờ mặc định.

---

## 7. Rủi ro nếu làm sai thứ tự

- **Ghi `XuatXu` xuống `AssetRepresentation` trước khi có persist client** — kéo theo bước "đưa
  ảnh vào Thư viện" (vì `route.ts:60` chặn `assetId` lạ), tức là đổi một luồng đang chạy để lấy
  một tính năng chưa ai chứng minh cần. Persist client là bậc thang, không phải đường vòng.
- **Persist ảnh trước, xuất xứ sau** — sai ưu tiên. Ảnh nặng, vỡ quota, và **dựng lại được** nếu
  còn tham số. Xuất xứ nhẹ, và mất là mất vĩnh viễn — không cách nào tái tạo `chuoiLenh` +
  `thamSo` + `creditUocTinh` của một lượt chạy đã qua. Giữ nhầm thứ = vẫn mất thứ đắt.
- **Đụng `/api/jobs` hay `execution.ts` cùng lượt** — đó là đường tiền (`spendCredits`/
  `refundCredits`). Gộp vào lát persist là biến một thay đổi không rủi ro thành một thay đổi có
  thể trừ tiền sai của người dùng thật.
- **Bật cờ mặc định trước khi kiểm Safari private** (`NOT ASSESSED` ở §6) — một `setItem` ném
  chưa bắt trong `dat()` sẽ làm chết toàn bộ store nguồn-ảnh, tức là **hỏng nặng hơn** cái lỗ
  đang muốn vá.
- **Sửa `PresentSheets.tsx` "cho gọn" nhân tiện** — ba lớp reopen + chống ghi đè deck rỗng
  (`luu-len-may-chu.ts:49,91`) là cơ chế **đã trả giá bằng sự cố thật** (mất bài trình bày).
  Không đụng vào khi đang làm việc khác.

---

## 8. Sai lệch so với lượt đo (đã xác minh lại trên `147f66a`)

| lượt đo ghi | mã thật `147f66a` | ghi chú |
|---|---|---|
| HEAD `ad26391` | HEAD **`147f66a`** | — |
| `present-handoff.ts:44` | `stashCadPresentHandoff` ở **`:45`** | lệch 1 |
| `nguon-anh.ts:36-38` state RAM | `BAN_DAU` **`:35`** · `let state` **`:37`** · `nguoiNghe` **`:38`** | lệch 1 — **kết luận RAM-thuần xác nhận đúng** |
| `nguon-anh.ts:74` `nhanDeXuat` | **`:71`** (`themDeXuat` **`:62`**) | lệch 3 |
| `visual-generate.ts:244-266` `XuatXu` | `interface XuatXu` **`:244-264`**; `:266` đã là `ThamSoXuatXu` | biên khối lệch 2 |
| `app/api/jobs/route.ts:9` trừ/hoàn credit | `POST` ở **`:8`**; import `spendCredits`/`refundCredits` ở **`:6`**; chặn vô danh `:10-11` | lệch nhỏ |
| `luu-len-may-chu.ts:53` chống ghi đè deck rỗng | **`:54`** (`if (tongSlide === 0) return …`), docstring `:49` | lệch 1 |
| `luu-len-may-chu.ts:78-108` `taiDeckTuMayChu` | khai báo ở **`:77`** | lệch 1 |
| `PresentSheets.tsx:313` IndexedDB | `useEffect` khôi phục **`:312-313`** (docstring `:312`) | ✅ |
| `PresentEditor.tsx:1503,1516,1545,1590` xuất | PDF **`:1499-1507`** · PPTX **`:1516-1536`** · PNG **`:1545-1549`** · PDF300 **`:1590-1604`** | mốc đúng, biên khối rộng hơn |
| `handoff.ts:52` · `HomeScreen.tsx:58` · `cad3d-autosave.ts:28` · `StageToolbelt.tsx:92,144` · `execution.ts` `runNode` (**`:295`**) · `PresentEditor.tsx:393` · `PresentSheets.tsx:367` | ✅ **đúng nguyên** | — |
| "`XuatXu` không được ghi xuống đâu cả" | ✅ **xác nhận lại** — grep `localStorage`/`sessionStorage`/`persist` trong `nguon-anh.ts` = **0 dòng** | — |

**Bổ sung không có trong lượt đo:** `PresentSheets.tsx` có **thêm** một lớp ghi đĩa nhịp riêng
(throttle 10s, `:444`) và sao lưu máy chủ nhịp chậm 30s (`:426`) — tức reopen thực ra là **ba
lớp + hai nhịp ghi**, khoẻ hơn lượt đo mô tả.
