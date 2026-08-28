# PREFETCH-ATTACH — nút "Dùng cho dự án này" biết trạng thái ĐÃ GẮN ngay khi mở panel

Phiên: WORKER lane UX/UI · 20/08 · mốc `c7f3ac8` (main, lệch main = 0 lúc bắt đầu)

---

## ⓪ TIỀN ĐỀ — XÁC NHẬN, không bác bỏ

Đọc code, cả ba tiền đề của phiếu ĐÚNG:

1. `LibrarySheet.tsx:381` `attachedUsage` chỉ được set trong `attachToProject()` — sau 200
   (`:410`) hoặc 409 (`:402`). Không có đường nào nạp trước lúc mở panel. Nút đọc thẳng
   `attachedUsage[assetId]` (`:1054` bản cũ) ⇒ reload là mất sạch, UI nói sai cho tới khi
   người dùng bấm thử.
2. `AssetWhereUsed.tsx` ĐÃ gọi `GET /api/project-asset-usage?assetId=X` khi mở panel, và mỗi
   hàng trả về có `projectId` — **dữ liệu cần thiết đã nằm sẵn trong response đó**, không
   thiếu gì.
3. `⓪b`: `git log --oneline -1` = `c7f3ac8`, nhánh `main`, `git rev-list --count HEAD..main` = 0.

Không chỗ nào phải dừng.

---

## ① VIỆC ĐÃ LÀM

**Nguyên tắc: một request, hai nơi dùng — không thêm API, không thêm kho state, không fetch lần hai.**

| Tệp | Đổi gì |
|---|---|
| `components/library/da-gan-du-an.ts` *(mới)* | Hàm thuần `daGanVaoDuAn(rows, projectId)` + kiểu `WhereUsedRow`. Tách ra để KHOÁ BẰNG TEST, không phải để đẹp. |
| `components/library/da-gan-du-an.test.ts` *(mới)* | 7 khẳng định, mỗi cái là một cách hỏng đã lường trước. |
| `components/library/AssetWhereUsed.tsx` | Nâng chỗ fetch thành hook `useAssetWhereUsed(assetId, refreshKey)`; component còn lại thuần trình bày (`state` + `rows` là prop, KHÔNG tự gọi mạng). |
| `components/library/LibrarySheet.tsx` | Gọi hook MỘT lần ở cha; danh sách where-used và nút cùng ăn kết quả đó. Nút có ba trạng thái không cái nào nói dối. |

### Vì sao chọn LIFT-STATE thay vì callback báo-ngược (phiếu để ngỏ, đây là lý do)

- **Callback** đồng bộ state hai chiều ⇒ có nhịp cha và con lệch nhau (con đã `ready`, cha còn
  `loading`) — đúng loại bug khó thấy mà chính phiếu này sinh ra để diệt.
- **Gọi hook ở cả hai nơi** thì thành HAI request cho cùng một dữ liệu ⇒ phạm ràng buộc REUSE.
- **Lift lên cha** giữ đúng một nguồn sự thật; component con thành thuần trình bày, dễ đọc hơn
  bản cũ chứ không phức tạp hơn.

Hàm thuần đặt trong `.ts` co-located, đúng khuôn repo đã có (`components/nav/muc-dieu-huong.ts`
+ `.test.ts`, `components/collab/tao-nguon-chung-cat.ts` + `.test.ts`) — test chạy bằng
`sucrase-node`, không import `.tsx`.

### Ba trạng thái của nút

| Trạng thái | Nhãn | `disabled` | Vì sao |
|---|---|---|---|
| đang tra (`state==='loading'`) | "Đang tra…" + spinner, `aria-busy` | có | KHÔNG hứa "Dùng cho dự án này" rồi đổi ý — đó là nói dối một nhịp |
| tra xong, đã gắn | "Đã dùng ✓" | có | `daGanVaoDuAn(rows, projectId)` — lọc theo ĐÚNG dự án đang mở |
| tra xong, chưa gắn / **tra hỏng** | "Dùng cho dự án này" | không | lỗi phụ không được chặn việc chính; 409 vẫn xử đúng như cũ |

`attachedUsage` (vừa bấm xong) vẫn THẮNG ảnh chụp where-used — nó mới hơn.
Nút có `minWidth: 12.5em` để ba nhãn không làm hàng nút nhảy (đo được: 203px ở cả ba trạng thái).

---

## ② NGHIỆM THU

### Máy
- `npm run tsc` — **pass** (0 lỗi).
- `node_modules/.bin/sucrase-node components/library/da-gan-du-an.test.ts` — **OK** (7 ca).

### Browser thật (:3001, viewport 1440×900) — dữ liệu THẬT, không mock

Baseline DB: `ProjectAssetUsage` = **0 hàng**.

| # | Ca | Kết quả |
|---|---|---|
| 1 | Dự án "Dự án mới" → Thư viện (⇧L) → kệ "Ảnh & tài sản" → card **asset guard** | nút "Dùng cho dự án này", bấm được — đúng (DB chưa có gì) |
| 2 | Bấm attach | toast *Đã dùng "asset guard" cho dự án này* · nút → "Đã dùng ✓" · where-used → "Dự án mới" |
| 3 | **RELOAD trang**, mở lại đúng card đó | nút **"Đã dùng ✓", `disabled=true` NGAY**, không cần bấm thử — **đây là bệnh gốc, đã khỏi** |
| 4 | Sang dự án KHÁC (`cmsl4b5ux…`), cùng card | nút **"Dùng cho dự án này", bấm được**; where-used vẫn liệt kê "Dự án mới" ⇒ lọc theo projectId đúng, không đọc `rows.length` |
| 5 | Ép mạng chậm (patch `fetch` trễ 10s cho GET) | trong lúc chờ: **"Đang tra…"**, `disabled=true`, `aria-busy="true"`, bề rộng **203px = y hệt** lúc xong ⇒ không nhảy layout |
| 6 | Ép GET lỗi (`Promise.reject`) | nút **vẫn bấm được**, nhãn "Dùng cho dự án này"; where-used hiện dòng nhạt "Chưa tra được nơi dùng." ⇒ lỗi phụ không chặn việc chính |

### Dọn dữ liệu thử
`ProjectAssetUsage`: trước 1 → xoá 1 → **sau = 0 hàng**. Đã đếm lại sau khi xoá.

---

## ③ RỦI RO / ĐÁNH ĐỔI

- `AssetWhereUsed` đổi CONTRACT (`assetId`/`refreshKey` → `state`/`rows`). Chỉ có MỘT nơi gọi
  (`LibrarySheet.tsx`, đã sửa), `tsc` canh phần còn lại. Ai thêm nơi gọi mới phải dùng hook.
- Hook đặt `setRows([])` khi đổi `assetId` — cố ý: giữ rows cũ một nhịp thì nút sẽ nói về
  ASSET TRƯỚC. Đánh đổi: nhấp nháy "Đang tra…" khi lướt nhanh giữa các card. Chọn nhấp nháy
  còn hơn nói sai.

## ④ KHÔNG LÀM (và vì sao)

- Không đụng `app/api/project-asset-usage/**` (API đã PASS), schema, `lib/server/*` — ngoài scope.
- Không thêm route "kiểm nhanh đã gắn chưa": dữ liệu đã có trong response sẵn có, thêm là đẻ
  nguồn thứ hai (B25 NO-REBUILD).
- Không đụng git (add/commit/push/stash/checkout/reset) theo luật phiếu.

## ⑤ SỐ ĐO

`tsc` 0 lỗi · test mới 7 ca pass · 2 tệp mới + 2 tệp sửa · 0 API mới · 0 request thêm
(where-used vẫn đúng **một** GET mỗi lần mở panel, nay nuôi hai nơi thay vì một).

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chỉ thử trên Chromium** (Browser pane). Safari/Firefox là suy, không đo.
- **Chưa thử trình đọc màn hình thật.** `aria-busy` + `disabled` là đúng theo chuẩn, nhưng
  chưa nghe VoiceOver đọc ra sao lúc nút đổi từ "Đang tra…" sang "Đã dùng ✓".
- **Ca 5 và 6 dùng `fetch` bị vá trong trang**, không phải mạng chậm/hỏng thật. Hành vi
  React giống nhau, nhưng đây là mô phỏng, khai rõ.
- **Chưa thử ca đua**: bấm attach ĐÚNG lúc where-used chưa tải xong. Đọc code thì
  `attachedUsage` thắng nên không sai, nhưng chưa dựng được ca đó bằng tay.
- **Chưa thử nhiều tab cùng lúc**: tab A attach thì tab B đang mở panel không tự biết (không
  có poll — đúng thiết kế cũ, không phải hồi quy của phiên này).
- `minWidth: 12.5em` đo đúng ở tiếng Việt; **chưa đo bản tiếng Anh** ("Use for this project"
  / "Already used ✓" / "Checking…") — nhãn Anh ngắn hơn nên nhiều khả năng không tràn,
  nhưng đó là suy đoán.

## ⑦c HẠN DÙNG KẾT LUẬN

- Kết luận "một request, hai nơi dùng" **hết hiệu lực** nếu ai đó thêm nơi thứ ba gọi
  `useAssetWhereUsed` song song trong cùng cây — lúc đó phải nâng lên context/cache.
- Kết luận về hành vi 409 dựa trên đo của MAIN, **không** đo lại trong phiên này; nếu
  `app/api/project-asset-usage` đổi cách xử trùng thì đường lùi khi tra hỏng phải xem lại.
- Con số "0 hàng ProjectAssetUsage" đúng tại thời điểm kết phiên; phiên sau phải tự đếm.
- Contract của `AssetWhereUsed` hết hạn ngay khi có màn thứ hai cần where-used — lúc đó cân
  nhắc gói hook + component thành một cặp xuất khẩu rõ ràng hơn.
