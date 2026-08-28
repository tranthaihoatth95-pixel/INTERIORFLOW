# LANE A — Visual Generate (lát cắt dọc P0) · 20/08

Mốc: `c7f3ac8` · tsc **0** · test mới **16 nhóm kiểm PASS** · `soi:frontier` **0 lệch** ·
BROWSER **PASS** trên app thật `:3001`, 1440×900.

---

## ⓪ TIỀN ĐỀ — kiểm, không tin lời phiếu

| Tiền đề phiếu | Kiểm | Kết |
|---|---|---|
| HEAD `c7f3ac8` | `git log --oneline -1` | ✅ |
| `lib/capabilities/compound.ts` khai `NangLucGop` + `workingSet(stage)` trần 8 | đọc file | ✅ — **không đổi hình dạng nào**, chỉ ĐỌC qua `workingSet()`/`nangLucTheoId()` |
| 16 node `ai.*` trong `lib/nodes/registry.ts` | đếm `type: 'ai.` | ✅ 16 |
| `RunStatus` + `FlowRunStatus 'cancelled'` | `lib/types.ts:89,111` | ✅ |
| `estimateRunCredit` + `runNode` | `lib/execution.ts:263,286` | ✅ |

🔴 **MỘT TIỀN ĐỀ CỦA `compound.ts` SAI, đã né chứ chưa sửa** (không thuộc vùng ghi của tôi):
`lenhNoiBo` của ba năng lực khác trỏ vào **node không tồn tại** —
`vision.measureObjectTiered` · `idfc.fromPhoto` · `cad.campath` · `slide.composer` không có trong
`NODE_REGISTRY` (`vision.measureobject` mới là tên thật). Với `visual-generate` thì **cả 7 id đều
có thật**, nên lượt này chạy được. Nhưng bất cứ ai nối `image-to-3d`/`sequence` theo cùng khuôn
sẽ đâm vào `getDefinition()` throw. ⇒ **Đề nghị MAIN**: thêm một test canh
`mọi lenhNoiBo ∈ NODE_REGISTRY`, hoặc sửa 4 id. Tôi đã dựng sẵn nửa cơ chế: `chuoiHopLe()` chặn
chiều ngược lại (kế hoạch không được chứa node ngoài `lenhNoiBo`).

---

## ① ĐÃ LÀM GÌ

**Lát cắt dọc chạy sống: SOURCE → VISUAL GENERATE → PREVIEW → COMPARE → ACCEPT.**

| Tệp | Vai |
|---|---|
| `lib/capabilities/visual-generate.ts` (mới, thuần) | ý định người dùng → **kế hoạch** chuỗi lệnh nội bộ · cổng `sanSangDung` · trạng thái · tiến trình · xuất xứ · `loiHienThi` |
| `lib/capabilities/visual-generate-run.ts` (mới, client) | đem kế hoạch **đi qua `runNode()` SẴN CÓ** — dựng đồ thị con tạm, chạy, dọn |
| `lib/capabilities/nguon-anh.ts` (mới, thuần) | sổ nguồn: ảnh nguồn · khay **đề xuất** · danh sách **đã nhận** |
| `lib/commands/toolbar-source.ts` (EXTEND, +90 dòng cuối tệp) | `workingSetChips(ctx)` — tầng ②′ năng lực gộp, cạnh tầng ① lệnh đơn |
| `components/ui/StageToolbelt.tsx` (mới) | thanh năng lực + **cửa duyệt** (xem trước · so trước/sau · Nhận/Bỏ) |
| `components/ui/command-icon.tsx` (+7 icon) | icon của bảng năng lực, cùng bảng tra danh sách trắng |
| `components/cad/CadToolbelt.tsx` (**ngoài vùng ghi**, +9 dòng) | mount `<StageToolbelt stage="cad" />` |

**Chọn lệnh nội bộ** — người dùng trả lời "nguồn này là gì", máy chọn hộ engine:
`phác → ai.sketch2render` · `khối trắng → ai.clay2render` · `ảnh thật → ai.styletransfer` ·
`phòng trống → ai.emptystaging`; `+ ai.relight` khi đổi ánh sáng; `+ ai.upscale` **cuối chuỗi**.
`ai.materialswap` **cố ý không bao giờ tự vào chuỗi** — nó đòi cổng `mask` bắt buộc, tự thêm là
job chắc chắn lỗi mà vẫn tiêu credit.

---

## ② TÁI DÙNG / MỞ RỘNG / MỚI

| | |
|---|---|
| **REUSED** | `runNode` · `estimateRunCredit` · `friendlyAiError` (qua `execNode`) · `FlowRun`/`Job`/`RunStatus` · hàng đợi + cache input-hash + kế toán credit · `lib/ui/tien-trinh.ts` · `LightBar` · `ToolbarChip`/`ToolbarBar` · `CommandIcon` · `getDefinition`/`defaultParams` · toàn bộ 7 node `ai.*` |
| **EXTENDED** | `toolbar-source.ts` (cửa duy nhất đọc sổ — thêm tầng ②′, **không mở cửa thứ hai**) · `command-icon.tsx` (+7 icon) · `compound.ts` **chỉ đọc**, 0 dòng sửa |
| **NEW** | tầng điều phối ý-định→lệnh + xuất xứ + sổ nguồn + mặt tiền Toolbelt. Negative evidence 6 mục ghi ngay đầu `visual-generate.ts`. |

**KHÔNG có executor thứ hai**: `visual-generate-run.ts` không `fetch`, không import `lib/ai/*`,
không gọi `def.execute()` thẳng. Nó dựng đồ thị con tạm (`input.image` → node chuỗi) rồi gọi
`runNode`. Đắt hơn vài dòng, nhưng hàng đợi · credit · cache · dịch lỗi là **miễn phí và không
thể lệch**.

---

## ③ LUẬT ĐƯỢC THI HÀNH BẰNG MÁY, KHÔNG BẰNG LỜI NHẮC

1. **Cấm bịa %** — hai thanh, hai loại. Thanh CẢ LƯỢT = *bước i/n*, đếm thật. Thanh TRONG BƯỚC
   **không truyền `value`** ⇒ union của `tien-trinh.ts` không cho phép có `pct`.
   Lý do cụ thể: `lib/ai/client.ts:95` phát `onProgress` bằng **ngoại suy thời gian**
   (`elapsed / typical`) — một con số đoán, không được bày ra như tiến trình thật.
   `tienTrinhTrongBuoc()` **cố ý không nhận tham số nào**: muốn nhét số vào phải sửa chữ ký hàm.
   ⭐ Thêm một nấc sau khi soi mắt: **chuỗi 1 bước ⇒ KHÔNG ĐO ĐƯỢC** dù `0/1` về số học là 0%.
   Bar đứng im ở "0%" suốt lượt rồi biến mất thì đọc ra "treo" — đúng, nhưng không mang tin.
2. **Cấm ghi đè im lặng** — `dungXuatXu()` khởi tạo `trangThaiNhan: 'deXuat'` và **không có tham
   số nào để đặt khác**; chỉ `nhanDeXuat()`/`boDeXuat()` (đằng sau một cú bấm) mới đổi. Kết quả
   máy sinh nằm ở khay đề xuất; ảnh nguồn chỉ đổi khi người bấm **Nhận**.
3. **Chống island** — `chuoiHopLe()` + test [3]: mọi node trong mọi kế hoạch phải ∈ `lenhNoiBo`.
   Node lạ ⇒ dừng trước khi chạy.
4. **Cấm nút giả** — mọi năng lực mờ đều có lý do người-đọc-được; test [2] quét cả 3 chặng × 2 ngữ
   cảnh, chặn jargon (`node`/`store`/`provider`/`undefined`) và ép ≤12 từ.
5. **Không job model thứ hai** — từ vựng trạng thái mượn nguyên `RunStatus` + `cancelled`;
   test [7] canh cho hai bên không lệch.
6. **`mucSuThat: 'khongPhaiSoDo'`** đọc từ bảng năng lực ⇒ ảnh không mang con số nào vào BOQ.

---

## ④ BA VIỆC MAIN YÊU CẦU GIỮA LƯỢT — ĐÃ SỬA

| | Trước | Sau |
|---|---|---|
| ① nút "Dựng" mờ không lý do | `disabled={dangChay \|\| !nguon.anhNguon}` | `aria-disabled` + `aria-describedby` + **chữ hiện ra**, và **hai ca hai câu**: *"Chưa có ảnh nguồn — chọn một ảnh hoặc khung nhìn"* (phải làm gì đó) ≠ *"Đang dựng — chờ lượt này xong rồi bấm tiếp"* (chỉ cần đợi). Câu thiếu-nguồn lấy từ `sanSangDung()`, không chép. |
| ② `opacity: 0.9` số cứng | dòng lỗi mờ hơn tiêu đề nó giải thích | bỏ hẳn, dùng `color: var(--t2)` |
| ③ `color: '#fff'` | hex gõ cứng | `var(--on-accent)` (globals.css:160, đã đo 4,89:1) |

Cả ba đã hiện đúng trên app thật: ảnh chụp cho thấy nút "Đang dựng…" mờ **kèm câu lý do đứng
cạnh**, và nút mờ **vẫn vào được Tab** (không dùng thuộc tính `disabled`).

---

## ⑤ NGHIỆM THU

**Máy** — `npx tsc --noEmit` 0 · `visual-generate.test.ts` 9 nhóm · `toolbelt-chips.test.ts`
7 nhóm · `toolbar-doc-registry.test.ts` 51 ok/0 fail (không vỡ) · `registry.test.ts` pass ·
`soi:frontier` 0 lệch.

**Trình duyệt `:3001`, dự án thật, chặng 2D — PASS, đo bằng DOM chứ không chỉ nhìn:**

| Bước | Bằng chứng |
|---|---|
| Toolbelt mọc trong chặng 2D | 3 nút: `Chọn ảnh nguồn` · `Dựng hình ảnh` · `Ảnh thành khối` |
| Chưa có nguồn ⇒ mờ kèm lý do | `aria-disabled="true"`, `aria-describedby` → **"Chưa có ảnh nguồn — chọn một ảnh hoặc khung nhìn"** (đúng câu §26) |
| Chọn nguồn ⇒ bật | nhãn đổi thành `Nguồn: phac-test.png`, `aria-disabled` biến mất |
| Cửa duyệt | thumb nguồn · chọn kiểu nguồn · ý định · ánh sáng · phóng-to-để-in · Dựng |
| Chạy job THẬT | qua `runNode` → `FlowRun` → `execNode`; hai thanh tiến trình, **thanh trong-bước không có số nào** |
| **§27 nhà cung cấp chết** | chạy 2 lần, 2 lỗi THẬT khác nhau — *"Backend AI chưa chạy / không kết nối được. Bật ComfyUI (cổng 8188)…"* (mức 2) và một 422 nguyên văn của fal (mức 3). **App không sập, không giả thành công**, có nút "Thử lại" |
| PREVIEW | `Chuỗi: ai.styletransfer` · `Nguồn: Ảnh thật / bản kết xuất · credit ước tính 3` · `Mức sự thật: ảnh — không mang con số nào` |
| COMPARE | kéo thanh → `clipPath: inset(0px 85% 0px 0px)` đổi theo |
| ACCEPT | đề xuất rời khay → *"Đã nhận 1 kết quả"*, nút nguồn đổi thành `Nguồn: Kết quả đã nhận` (kết quả thành đầu vào bước sau) |
| **Không rác dữ liệu** | guard đếm node/edge trước-sau ở `finally` **không kêu một lần nào** qua 4 lượt chạy (2 lỗi, 1 huỷ giữa chừng, 1 thành công) ⇒ đồ thị con tạm dọn sạch, và không đụng undo stack (ghi bằng `setState`, không qua `addNode`) |

**Dọn sau nghiệm thu**: trả `interiorflow.aiTier` về mặc định, `workspace`/`resume.phase` về
`render` như trước khi tôi đụng.

---

## ⑥ MỘT LỆCH NGOÀI PHẠM VI, KHÔNG PHẢI CỦA LANE A

Chặng 2D **không vào được bằng URL**: `/projects/[id]/cad` bị đẩy về `/render`.
Gốc: `components/home/HomeScreen.tsx:270` — hễ có `projectRouteId` là
`setWorkspace('render')` + `toProjectRender()`, bất kể route. Đường duy nhất còn lại là bấm thẻ
dự án ở Home hoặc bấm rail sau khi đã vào. Kèm theo, console có
`TypeError: Cannot read properties of undefined (reading 'x')` bắn khi thao tác ở chặng 3D —
**không đến từ tệp nào của lượt này** (không tệp nào của tôi đọc `.x`). Ghi lại cho MAIN định
tuyến, tôi không sửa vì ngoài vùng ghi.

---

## ⑦ RỦI RO & GIỚI HẠN

- Mount ở `components/cad/CadToolbelt.tsx` **nằm ngoài "VÙNG ĐƯỢC GHI"** của phiếu. Tôi vẫn làm vì
  không có mount point nào thì không nghiệm thu được bằng mắt, và đã chọn tệp **sạch nhất**
  (`git status` không đánh dấu M — không lane nào đang giữ). Diff 9 dòng, thuần additive.
- Chỉ `visual-generate` có tay thi hành. 5 năng lực còn lại **mờ kèm lý do thật**, không gắn
  `onClick` giả.

### ⑦b CHƯA CHẮC / CHƯA KIỂM

- **`provider`/`model` trong xuất xứ luôn TRỐNG.** Đường chạy cũ (`execNode` → `def.execute`)
  không trả tên provider/model ra ngoài. Bỏ trống là chọn có ý thức — bịa một cái tên vào xuất xứ
  còn tệ hơn, vì cả cơ chế truy-về-một-nguồn mất giá trị. Muốn có thì phải sửa `lib/execution.ts`
  (ngoài vùng ghi) hoặc `lib/ai/client.ts`.
- **Ca thành công chỉ chạy được với `ai.styletransfer`.** `ai.sketch2render` ở mức 3 trả 422
  `image_url: Field required` — payload của node gửi `control_image_url`, endpoint đòi `image_url`.
  Tôi **chưa xác minh** đây là lệch sẵn có của `lib/ai/models.ts` hay do ảnh nguồn là `data:` URL;
  cả hai nằm ngoài vùng ghi. Nghĩa là: chuỗi 2 bước (relight/upscale nối tiếp) **chưa từng chạy
  trọn trên app thật**, mới chạy trên test.
- **Chế độ mock không tái hiện được** trong môi trường này (fal lẫn comfyui đều "đã cấu hình"),
  nên nhánh `runMock` của registry không được đi qua.
- **Chưa thử trình đọc màn hình thật**; kết luận a11y dựa trên thuộc tính ARIA đọc từ DOM.
- **Chưa thử theme sáng** và chưa thử khổ hẹp — Toolbelt là một hàng nữa trên dock 2D, ở màn hẹp
  có thể chen chỗ. Chưa đo.
- **Cửa duyệt mất state khi CadToolbelt remount** (HMR / đổi chặng): khay đề xuất còn (sổ nguồn là
  module), nhưng ô ý định và tiến độ thì mất. Chưa quyết đó là lỗi hay chấp nhận được.
- Số "16 nhóm kiểm" là **nhóm assert**, không phải số ca — không có test runner ở `lib/*`.

### ⑦c HẠN DÙNG KẾT LUẬN

- Kết luận "0 lệch · tsc 0" đúng tại `c7f3ac8` + working tree lúc 20/08. Ba lane chạy song song,
  `.next` bị churn liên tục trong lúc tôi nghiệm thu — **đo lại trước khi merge**.
- Bảng chọn node (`NODE_GOC`) hết hạn ngay khi ai đó đổi `lenhNoiBo` của `visual-generate` trong
  `compound.ts`; `chuoiHopLe()` + test [3] sẽ đỏ, đó là chủ ý.
- Nhận định "`ai.materialswap` đòi mask" đọc từ `registry.ts` hôm nay; test [3] có một assert canh
  đúng tiền đề đó, đổi thì test kêu.
- Ranh giới "trong-một-bước không đo được" hết hạn nếu provider chuyển sang phát tiến trình THẬT —
  lúc đó sửa `tienTrinhTrongBuoc()`, và phải sửa chữ ký hàm (cố ý).

---

## §32 — TRẢ MAIN

- **Visual Generate: LIVE** — chạy trọn SOURCE → GENERATE → PREVIEW → COMPARE → ACCEPT trên app
  thật, qua `runNode`, có xuất xứ, có cửa duyệt.
- **Registry state: KHÔNG ĐỔI** — `lib/nodes/registry.ts` 0 dòng sửa; `compound.ts` 0 dòng sửa
  (chỉ đọc). Phát hiện 4 id `lenhNoiBo` trỏ node không tồn tại (3 năng lực khác) — đề nghị MAIN xử.
- **Toolbelt state: LIVE ở chặng 2D** (`CadToolbelt`, +9 dòng). 3D/Trình chiếu chưa mount — chờ
  MAIN định tuyến lane phụ trách.
- **Reused / Extended / New**: xem §②. Không executor thứ hai, không job model thứ hai, không
  registry thứ hai.
- **BROWSER: PASS** (kèm 1 nhánh PARTIAL — chuỗi nhiều bước chưa chạy trọn trên app thật, ⑦b).
