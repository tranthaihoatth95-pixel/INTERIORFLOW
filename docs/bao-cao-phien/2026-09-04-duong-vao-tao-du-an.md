# 04/09 — ĐƯỜNG VÀO SẢN PHẨM: đóng hai lỗi chặn D-J04a + D-J04b

**Lane 04 · DESIGN + 02 · WORKFLOW.** Mốc vào: `323a01e4`.
Việc: người dùng mới **không tạo được dự án** — hành động đầu tiên bất kỳ ai chạm tới IF.

---

## ⓪ TIỀN ĐỀ — cả hai xác minh ĐÚNG, một chỗ mốc lệch

| Tiền đề của phiếu | Kết quả kiểm |
|---|---|
| D-J04a — ba nhãn khác nhau, một `onClick={onMo}`, `onMo` = `moVat` không tạo gì | ✅ **ĐÚNG từng chữ.** `XuongHome.tsx:184,187,190` cùng `onClick={onMo}`; `moVat` (`:456-460`) đọc `bo.hienVat.href` — mà nhánh `bat-dau` **không đặt `href`** ⇒ luôn rơi `onEnter()` → `HomeScreen` `toProjectRender()` → `stableProjectRouteId('')` rỗng ⇒ `return` sớm. Chạy lại bộ đo trước khi sửa: `Project` **5 → 5**, URL không đổi |
| D-J04b — `setBusy(false)` chỉ trong `catch` ⇒ kẹt "Đang tạo…" | ✅ **ĐÚNG.** Và gốc sâu hơn một tầng phiếu chưa nêu: `useProjectScopeSync` chỉ tính lại `status` khi `[routeId, stage, router]` đổi ⇒ **dù có gỡ cờ bận thì màn rỗng vẫn đứng nguyên**, vì `status` vẫn là `'missing'`. Cờ bận chỉ là triệu chứng thứ hai |
| ⓪b mốc `323a01e4` | 🔧 **LỆCH — worktree đứng ở `f43de304`**, sau `323a01e4` **211 commit**. `merge-base --is-ancestor` rc=0 + cây sạch ⇒ đã `merge --ff-only origin/integration/2026-09-04`, HEAD nay đúng `323a01e4`. Không rebase, không force |

---

## ① BA NÚT NAY LÀM BA VIỆC

| Nút | Làm gì | Bằng chứng đọc từ SQL |
|---|---|---|
| **Tạo dự án mới** | mở **bảng khởi tạo dự án** (`ProjectInitBoard`) → `createProject` → `createFlow(…, projectId)` → `openFlow` → `/projects/<id>/render` | `Project` **5 → 6** · `Flow` **6** · URL `/` → `/projects/cmtnf450d00017de8z14j21bd/render` |
| **Mở dự án có sẵn** | đưa tiêu điểm sang **cột kề bên** — ưu tiên mục `data-loai="du-an"` (cột còn chứa việc và vật khác, mà nhãn nút nói *dự án*), cuộn tới rồi `focus`. Cột rỗng ⇒ **mờ kèm lý do** *"Cột bên chưa có gì để mở — tạo dự án mới trước."* | không đụng CSDL — đúng bản chất: đây là thao tác **điều hướng trong màn**, không phải thao tác dữ liệu |
| **Nhập từ tệp · dwg · pdf · ảnh** | **MỜ kèm lý do**: *"Chưa có đường tạo dự án thẳng từ tệp. Tạo dự án trước, rồi nhập tệp vào bản vẽ của dự án đó."* | 0 — cố ý. Đường tệp→dự-án **chưa sống**; làm nút bấm-được rồi im lặng là đúng thứ vừa phải sửa |

**Vì sao mở bảng khởi tạo chứ không tạo thẳng** — đây là **CONNECT, không phải NEW** (NO-REBUILD §B25):
`ProjectInitBoard` đã là cửa tạo dự án chuẩn từ 12/08 (project + flow gắn thẳng `projectId` + hồ sơ +
gieo việc), trước nay **chỉ mở được từ `ProjectSelect`** — mà `ProjectSelect` thôi mount ở `/` từ khi
Home đổi sang `XuongHome`. Cửa vẫn còn, chỉ là **không còn tay nắm nào ở Home**. Mọi ô của bảng đều
tuỳ chọn, và nút *"Bỏ qua, tạo trống"* giữ nguyên đường 1-click cũ (luật X2 — không chặn ai).

**Máy chặn tái phát**: `nut` trong `ThanVat` thôi là `[string, string, string]`, thành
`[NutBatDau × 3]` mang **mã việc** (`tao-du-an` · `mo-du-an` · `nhap-tep`). Thêm một lối vào mà quên
nối dây là **`tsc` đỏ**, không phải một nút im lặng. Ba mã phải rời nhau — có test.

🔧 **Một hợp đồng chết đã gỡ**: prop `onEnter` của `XuongHome` là đường DUY NHẤT Home gọi ra ngoài,
và nó chỉ nối vào đúng ba nút đó. Ba nút hết dùng chung ⇒ `onEnter` không còn ai gọi. Giữ nó lại là
để phiên sau tưởng Home đã có đường vào — đã bỏ, `HomeScreen` nay truyền `onTaoDuAn`.

---

## ② D-J04b — SỬA Ở GỐC, KHÔNG VÁ CỜ BẬN

Phiếu hỏi đúng câu: *"vì sao `goToStage` đẩy về đúng URL đang đứng?"* Trả lời: **vì nó phải thế** —
màn rỗng đang đứng ở chính URL của chặng đó, đích đến không có chỗ nào khác để đi. Nên vấn đề không
nằm ở điều hướng mà ở chỗ **màn không tự cập nhật trạng thái**.

**Ba lớp sửa, xếp từ gốc ra ngoài:**

1. **`lib/project-scope.ts` — `useProjectScopeSync` nhận `currentFlowId` làm ĐẦU VÀO.**
   Ai mở/đổi flow (màn rỗng · `FlowsPanel` · lệnh khác) thì scope **tự tính lại** — không nơi nào
   phải nhớ gọi hàm làm mới. Không có vòng lặp: nhánh `'missing'` đặt `currentFlowId = null` (vốn đã
   null ở ca đó) nên giá trị chọn không đổi.
2. **Đường tắt của `ensureProjectScope` nay đòi CÓ FLOW THẬT.**
   🔴 Đây là bẫy phải bước qua trước khi lớp ① chạy đúng: nhánh dọn canvas **tự đặt
   `currentProjectId = routeId`**, nên chỉ hỏi `storeMatchesRouteId` thôi thì **trạng thái RỖNG cũng
   "khớp"** — lượt đồng bộ kế tiếp sẽ trả `'ready'` cho một dự án không có bản vẽ nào, tức canvas
   trắng, đúng thứ màn rỗng sinh ra để chặn. Nếu chỉ làm ① mà bỏ ②, bản sửa sẽ đẻ ra một lỗi mới.
3. **`ProjectScopeEmptyState.tsx`** — gỡ cờ bận trong `finally` (kèm chốt "còn gắn trên màn" để
   không `setState` sau khi component đã nhường chỗ) · khoá bấm-hai-lần bằng **`ref`** thay vì state
   (state bị đóng băng trong closure của `useCallback`, hai cú bấm sát nhau có thể cùng thấy `false`)
   · `goToStage` **không `push` khi đích trùng đường đang đứng** (push tới chính chỗ mình đứng chỉ
   đẻ thêm một mục lịch sử: nút Lùi bấm xong đứng yên) · `createFlow(…, routeId)` **một lần** thay
   cho `createFlow` rồi `assignProject` vá sau — hỏng giữa hai bước là để lại một bản vẽ nằm trong
   dự án "Nháp" mà không ai biết.

**Ca bấm hai lần — đo thật, không suy luận** (`scripts/nghiem-thu-ban-lam-viec/kiem-cua-du-an-rong.mjs`):

| Chặng | cửa rỗng hiện | màn tự nhường chỗ (không reload) | hết kẹt "Đang tạo…" | bấm HAI lần → số bản vẽ |
|---|---|---|---|---|
| `/cad` | ✅ | ✅ | ✅ | ✅ **1** (đọc bằng SQL) |
| `/present` | ✅ | ✅ | ✅ | ✅ **1** |

⇒ **không đẻ dự án/bản vẽ mồ côi.**

---

## ③ LUẬT PASS ĐẦU-CUỐI

Bộ chạy G2 (`--ca=J04`), hồ sơ Chromium **trên đĩa** (`launchPersistentContext`) = máy người dùng;
đóng bối cảnh = đóng app; mở lại cùng thư mục hồ sơ = mở lại app. Đọc sự thật bằng **SQL** và bằng
chính **nguồn dữ liệu của Home** (`GET /api/flows`), không đọc chữ trên màn.

```
máy sạch → Home rỗng → "Tạo dự án mới" → bảng khởi tạo → "Tạo dự án"
  → Project 5 → 6 · Flow 6 · URL /  →  /projects/<id>/render
→ ĐÓNG HẲN trình duyệt → mở lại Home
  → Project 6 (không rơi) · GET /api/flows trả về dự án của người dùng này
```

**J04 = PASS.**

---

## ④ HIỆU CHUẨN

| Bộ | Gỡ dây ở đâu | Kết quả |
|---|---|---|
| **G2 · J04** | chặn `POST /api/flows` (cắt đường tạo ở phía máy chủ) | ❌ ĐỎ vì **khẳng định** (không phải vì hạ tầng) → cắm lại ✅ XANH. Dòng **"HIỆU CHUẨN THOÁI HOÁ"** trước đây in ra cho J04 (nó đỏ ở cả hai thế giới nên chẳng chứng minh gì) **nay đã hết** |
| **Test khoá bất biến** | bỏ `currentFlowId` khỏi danh sách phụ thuộc của effect | 20 ok → **19 ok · 1 fail**; cắm lại → 20 ok · 0 fail |

**Cột ĐÃ LƯU của ma trận: 7 → 8** (J04 vào nhóm PASS-có-cột-đã-lưu, cùng J06 · J07 · J12 · J16 ·
J17 · J19 · J20).

---

## ⑤ CÒN NÚT NÀO KHÁC LÀM MỘT NỬA? — CÓ, MỘT CA, **KHAI KHÔNG VÁ**

🔴 **J05 · thẻ Resume KHÔNG bắt cú bấm nào.**
`grep onClick` trong `components/home/XuongHome.tsx` cho đúng ba chỗ: ba nút lối vào · cột dự án ·
widget. **Thân thẻ tiêu điểm không có handler** — trong khi chân thẻ ghi *"bấm để về đúng chỗ bạn
rời đi"* và `hienVat.href` (= `resumeHref(the)`) **không có ai tiêu thụ**. Cùng họ D-J04a: chữ hứa
một thao tác chưa tồn tại.

**Không vá ở lượt này** vì làm cả thẻ bấm được là **quyết định thị giác** (vùng chạm · vòng focus ·
con trỏ · thẻ hay nút), phải qua cửa mắt chứ không nối dây lặng lẽ. Đã ghi chú **tại chỗ** trong mã
cạnh `href` + cập nhật hàng J05 của ma trận.

---

## ⑥ BỘ ĐO: GỠ LIỀU THUỐC GIẤU BỆNH

`quaCuaDuAnRong()` trước đây `reload()` để đi vòng D-J04b, và tự khai trong docstring rằng đó
**không phải bằng chứng cửa đó chạy được**. Nay: bấm rồi **đợi màn rỗng biến mất**. J07 · J12 vẫn
PASS mà **không cần reload** — đó mới là bằng chứng.

⚠️ **Một lượt trượt thật trên đường đi, đáng ghi**: bản đầu tôi đặt điều kiện dừng là
`waitForSelector('canvas')`. Chặng **Trình bày không dựng canvas nào** ⇒ J12 **ngã vì hạ tầng**
("HIỆU CHUẨN KHÔNG KẾT LUẬN"), và probe riêng báo `/present` TRƯỢT trong khi chặng đó đang chạy
đúng. Bất biến đúng là **"màn rỗng biến mất"** — nó không phụ thuộc chặng. Cùng bài học đã ghi
04/09 ba lần: **đo sai vật thì máy soi báo quá tay**; chữa bằng cách **thu hẹp/đúng-hoá phép đo ở
máy**, không nới luật.

Và một lần thứ tư của đúng họ đó, ngay trong test này: phép đếm `setBusy(false)` ra **2 thay vì 1**
vì nó **bắt trúng chính câu chú thích giải thích luật**. Đã thêm `boChuThich()` — máy soi văn bản
phải tự loại chú thích ra khỏi vùng quét.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chỉ đo trên Chromium 1194 + bản `next dev`.** Bản đóng gói Electron chưa chạm.
- **Chưa soi bằng mắt** một khung nào: bảng khởi tạo dự án nay mở từ Home là **màn mới xuất hiện ở
  đường vào** — hình thức của nó chưa qua cửa mắt Hoà. Đây là **delta thị giác thật**, không phải
  chỉ nối dây.
- **Nút "Mở dự án có sẵn" đưa tiêu điểm, không mở gì.** Tôi đọc §26 *(chính: tạo dự án · phụ: mở/nhập)*
  và bố cục hiện có (cột dự án nằm ngay bên phải, copy đã ghi *"chọn một dự án ở cột bên"*) ra hành
  vi này. Nếu Hoà muốn nó **mở thẳng dự án gần nhất** thì đó là một hành vi khác — chưa hỏi.
- **Chưa thử trình đọc màn hình thật** cho lý do nút mờ; đường `aria-disabled` + `aria-describedby`
  là theo khuôn đã dùng ở `ToolbarChip`/`EmptyState`, chưa đo lại tại chỗ này.
- **`en={lang === 'en'}`** cho bảng khởi tạo: chưa chạy lượt nào ở giao diện tiếng Anh.
- Ca **bấm hai lần** đo bằng hai `click` liên tiếp của Playwright; **chưa mô phỏng double-click thật
  của chuột** (`dblclick`) hay mạng chậm kéo dài.
- Probe `kiem-cua-du-an-rong.mjs` **chưa có phép hiệu chuẩn riêng** — nó chưa từng được nhìn thấy
  báo đỏ ở thế giới hỏng (nó *đã* báo đỏ một lần, nhưng vì phép đo sai chứ không vì thế giới hỏng).

## ⑦c HẠN DÙNG KẾT LUẬN

- Kết luận **D-J04b đã đóng** gắn với cách `useProjectScopeSync` lấy trạng thái từ `useFlowStore`.
  Đổi kho trạng thái, đổi cách `openFlow` ghi `currentFlowId`, hoặc chuyển sang React 19
  `useSyncExternalStore` khác đi ⇒ **phải đo lại**, không suy từ báo cáo này.
- Kết luận **D-J04a đã đóng** gắn với việc `ProjectInitBoard` còn mount ở Home. Ai gỡ nó (vd khi
  thi công lại Home theo `HYBRID B×A`) thì nút chính **quay lại thành nút không dẫn đi đâu** —
  test `lib/home/loi-vao-bat-dau.test.ts` **không bắt được ca đó** (nó soi mã của `XuongHome`, không
  soi `HomeScreen`). Bắt được ca đó là việc của **J04** trong bộ G2, nên **đừng bỏ J04 khỏi lô chạy**.
- Số đếm CSDL trong báo cáo là của **CSDL kiểm trong worktree**, không phải CSDL thật của Hoà.

---

## ⑧ GHI CHÚ VẬN HÀNH — hai thứ đáng nêu, không giấu

**① Tôi sửa mã GIỮA LÚC lô G2 đang chạy.** `next dev` biên dịch lại, và **J20 (xuất PDF) ngã ở
`waitForEvent('download')` sau 120s** — khung đánh dấu đúng là **LỖI (hạ tầng)**, không phải FAIL,
nên nó không bịa ra một kết luận sai. Nhưng lượt chạy đó không dùng làm bằng chứng cho J20 được.
⇒ **Luật rút ra cho lượt sau: đang chạy lô nghiệm thu thì KHÔNG đụng mã.** Rẻ để tránh, đắt để phát
hiện — và lần này nó chỉ không hại vì khung phân biệt được *ngã vì hạ tầng* với *đỏ vì khẳng định*.

**② Thư mục ảnh của bộ G2 (`docs/delivery/anh-duyet-mat/g2-hanh-trinh/`) là kho DÙNG CHUNG.**
`ket-qua.json` ở đó bị **ghi đè trọn** mỗi lượt chạy — chạy `--ca=J04` một mình là **xoá sổ kết quả
của 8 hành trình kia**. Tôi đã đụng phải đúng ca này giữa chừng, `git checkout` khôi phục, rồi chạy
**trọn lô** để bản ghi đầy đủ và thật.
⇒ Ai chạy `--ca=<một ca>` để đo nhanh thì **đừng commit `ket-qua.json`** của lượt đó, hoặc trỏ
`--anh=` sang thư mục riêng.

**③ Tệp đã ghi, đối chiếu ranh giới sở hữu.** Trong danh sách ĐƯỢC GHI của phiếu:
`components/home/**` · `components/studio/**` · `scripts/nghiem-thu-g2-hanh-trinh.mjs` ·
`docs/delivery/JOURNEY-MATRIX.md` · `docs/bao-cao-phien/…`.
Ngoài danh sách **được nêu tên** nhưng **không thuộc vùng CẤM GHI** và cần cho chính việc này:

| Tệp | Vì sao phải đụng |
|---|---|
| `lib/project-scope.ts` | **gốc của D-J04b**. Phiếu nói thẳng *"đừng chỉ vá bằng `setBusy(false)` — hãy hỏi vì sao `goToStage` đẩy về đúng URL đang đứng"*; câu trả lời nằm ở hook này, không ở component |
| `lib/home/xuong-demo.ts` | nơi khai **dữ liệu ba nút**; đổi `nut` từ ba chuỗi thành ba mã việc chính là chỗ máy chặn tái phát |
| `lib/home/loi-vao-bat-dau.test.ts` (mới) | khoá hai bất biến bằng khẳng định |
| `scripts/nghiem-thu-ban-lam-viec/kiem-cua-du-an-rong.mjs` · `dem-db.mjs` (mới) | phiếu ô ⑤ chỉ đúng thư mục này làm chỗ đặt bộ đo |

**KHÔNG đụng** một dòng nào của lane 05: `lib/cad/store.ts` · `lib/materials/**` · `lib/library/**` ·
`lib/boq/**` · `components/materials/**` · `components/cad/**`, và **không đụng**
`docs/delivery/SHIP-BLOCKERS.md` (MAIN giữ) — mục "G2 CHẶN · J04" ở đó **nay đã lỗi thời**, MAIN
cập nhật.
Cũng **không đụng** `STATUS.md` / `CHANGELOG.md` (không nằm trong danh sách được giao).

---

## ⑨ J20 NGÃ Ở ĐÂY — ĐÃ A/B, KHÔNG PHẢI HỒI QUY CỦA ĐỢT NÀY

Lô cuối (sạch, không đụng mã trong lúc chạy) ra **9/10 PASS · hiệu chuẩn ĐẠT**; riêng **J20 = LỖI**:
`waitForEvent('download')` hết 120 s khi bấm xuất PDF. Khung ghi đúng là **LỖI (hạ tầng)**, không
phải FAIL — nên nó không bịa ra một kết luận về sản phẩm.

**Không đoán, đo bằng A/B trên đúng nghi phạm.** Thứ duy nhất của đợt này chạy trên đường
`/projects/[id]/present` là `lib/project-scope.ts` (Home và màn rỗng không mount ở đó, vì cả hai
trang chặng chỉ rẽ nhánh khi `status === 'missing'`). ⇒ hoàn nguyên **đúng một tệp đó** về HEAD,
chạy lại `--ca=J20`: **ngã y hệt, cùng một dòng, cùng 120 s**. Rồi cắm lại bản sửa.

⇒ **J20 không kết luận được trong worktree này** (nghi môi trường tải tệp của bối cảnh Chromium ở
container), và **không phải do đợt 3 gây ra**. Bằng chứng PASS của đợt 2 còn nguyên trên đĩa —
`J20-deck-xuat.pdf` và `J20-trang-1.png` **không bị lượt sau ghi đè** (kiểm bằng `git status`:
hai tệp đó không nằm trong danh sách sửa đổi).

📌 Ghi lại vì đây là **cách đáng nhân rộng**: gặp một ca đỏ không thuộc phạm vi, đừng khai
*"chắc không phải tôi"* — hoàn nguyên đúng nghi phạm, chạy lại, rồi mới nói.
