# BÁO CÁO P-C · BA THANH CÔNG CỤ ĐỌC CHUNG MỘT SỔ LỆNH (B2)

> Phiên P-C, 16/08. Phiếu: `docs/phieu-giao/P-C-toolbar-doc-so-lenh.md`.
> Khuôn 6 phần theo `docs/CLAUDE.md` "LUẬT CỨNG BÁO CÁO" + ô ⑦b + ⑦c.

## 0 · SỰ CỐ WORKTREE LỆCH MỐC (lượt 1 của phiên này)

Lượt đầu phiếu chạy trên worktree cắt từ `b9d8ad1` (12/08), **lệch main 167 commit**. Ở đó tiền đề
2 và 3 SAI: `registry.ts` chưa có `stages`/`icon` (bản trước B1), `components/ui/ToolbarChip.tsx`
không tồn tại, và **cả 4 file ô ② bắt đọc trước** đều vắng. Phiên **DỪNG ở ô ⓪** theo luật, báo T.
T xác nhận lỗi điều phối, dựng lại worktree về `4206851` = HEAD main rồi giao lại phiếu nguyên văn.
Báo cáo lượt 1 T đã copy về main giữ lại. **Toàn bộ phần dưới là lượt 2, trên cây mới.**

Giá trị giữ lại: ô ⓪ đã làm đúng việc nó sinh ra để làm — chặn trước khi viết dòng code nào. Nếu
bỏ qua, phiên đã dựng một bản `stages`/`icon` thứ hai phân kỳ với main, đúng thứ **[Đ1]** cấm.

---

## 1 · TỔNG QUAN

Ba thanh công cụ của 2D · 3D · Trình chiếu nay **đọc chung `lib/commands/registry.ts`** thay vì mỗi
thanh tự khai danh sách. Marker phiếu đòi (`grep 'lib/commands'` > 0 ở cả ba file) đạt: **4 / 2 / 2**,
trước là **0 / 0 / 0**. Hai đường nhập được giữ nguyên vẹn cả hai — 2D gõ `RO`+⏎, 3D bấm `Q` — qua
trường `directKey` mới, **không chọn phe**. Kèm mock hai theme, 47 ca test, và **ba phát hiện ngoài
dự kiến** (một bug thiết kế do chính test bắt, một bẫy phím chéo chặng, một lỗi a11y ở nền chung).

**Chưa làm: ô ④ mục 3** (bỏ bảng ⌘K thứ hai) — có rào kỹ thuật thật, giải thích ở §2.4.

---

## 2 · CHI TIẾT TỪNG MỤC

### 2.1 · Ô ⓪ — bốn tiền đề, đo lại trên cây mới

| # | Tiền đề | Kết luận | Bằng chứng |
|---|---|---|---|
| 1 | 5 sổ lệnh song song · `grep 'lib/commands'` 3 toolbar = 0 | ✅ **XÁC NHẬN** | 0/0/0 trước khi sửa; `components/CommandPalette.tsx` đọc `NODE_DEFINITIONS`, tách hẳn `AppCommandPalette` |
| 2 | B1 xong — `stages` + `icon`, 10 dòng lệnh chung | ✅ **XÁC NHẬN** | `registry.ts` 42.610 byte · 10 dòng có `stages: [` **và** `icon: '` |
| 3 | `ToolbarChip` có, dùng 3 chặng, `ToolbarBar` chưa wire | ✅ **XÁC NHẬN** | import ở đủ 3 toolbar; `ToolbarBar` khai `:145` nhưng `grep` chỉ trả về chính file đó |
| 4 | 2D gõ lệnh ≠ 3D phím đơn — **hai cơ chế khác bản chất** | ✅ **XÁC NHẬN** | `tool3d.ts:42` `TOOL3D_HOTKEYS` một-chữ-một-tool qua `tool3dKeyTransition()`; `registry.ts:359` rotate `aliases:['RO','ROTATE']` là chuỗi gõ + Enter |

### 2.2 · Ô ④ — bảy việc

| # | Việc | Trạng thái |
|---|---|---|
| 1 | 3 toolbar đọc registry | ✅ marker 4/2/2 (trước 0/0/0) |
| 2 | Xoá danh sách tự khai | ✅ xoá `EDIT`(4) · `MEASURE`(2) · `select` khỏi `DRAW` ở 2D; xoá nhóm "Biến đổi"(3) + "Thước" ở 3D; xoá cặp undo/redo tự khai ở Trình chiếu |
| 3 | Bỏ bảng ⌘K thứ hai | ⛔ **KHÔNG LÀM** — rào kỹ thuật, §2.4 |
| 4 | Hai đường nhập, không chọn phe | ✅ `CommandDef.directKey` + `inputPathsFor(stage)` |
| 5 | Xử cạm bẫy phím-đơn-cướp-ký-tự | ✅ `shouldDirectKeyFire()` + 7 ca test riêng |
| 6 | `ToolbarBar` wire + `IOMenu` về thang bo | ✅ dock 3D thu gọn dùng `<ToolbarBar>`; IOMenu 4 literal → `RADIUS.r2`/`r1` |
| 7 | Test ≥15 ca | ✅ **47 ca**, 0 fail |

**Kiến trúc chọn — tách đôi rất rõ, đây là phần đáng đọc nhất:**

| | Nguồn | Vì sao |
|---|---|---|
| **DANH SÁCH** (lệnh nào · nhãn · icon · phím · thứ tự) | **sổ lệnh**, B2 dứt điểm | ba chặng không thể vẽ khác nhau nữa |
| **TAY THI HÀNH** (`run`) | vẫn của chặng, tới **B5** | `CommandDef.run()` gọi `useCadStore` — đúng ở 2D, **sai ở 3D** (khối đang chọn nằm ở `useTool3D`) và ở Trình chiếu (`useEditor()` cục bộ) |

Trộn hai thứ đó làm một chính là lý do trước nay mỗi thanh phải tự khai cả danh sách. Cầu nối là
`bindStage()` (thuần, test được): có binding ⇒ chặng tự chạy; không binding ⇒ **giữ nguyên nút, mờ,
kèm lý do** — không lọc bỏ, vì lọc bỏ là giấu, mà giấu thì ba chặng lại hiện ba bộ nút khác nhau.

**File mới:** `lib/commands/toolbar-source.ts` (thuần, không React) · `components/ui/command-icon.tsx`
(chuỗi icon → lucide; tách ra để `lib/` giữ được test thuần bằng `sucrase-node`).

### 2.3 · Hai đường nhập — cách giữ cả hai

`directKey` điền cho **5/10** lệnh chung, lấy đúng phím đang chạy thật ở `ToolDock3D`:
Chọn `V` · Dời `M` · Xoay `Q` · Chép `D` · Đo `T`. Năm lệnh còn lại **để trống** — 3D chưa có tool,
bịa phím còn tệ hơn nút giả vì nó câm, không chỗ nào hiện lý do.

Đường nào bật là **thuộc tính của MẶT TIỀN, không phải của lệnh** — nên `inputPathsFor()` nhận
`stage` chứ không nhận `CommandDef`: `cad → ['typed']` · `render → ['directKey']` · `present → []`.

### 2.4 · Ô ④ mục 3 — vì sao KHÔNG gộp bảng ⌘K

`components/CommandPalette.tsx:4` gọi `useReactFlow()` ⇒ **bắt buộc sống trong `ReactFlowProvider`**.
Đo: chỉ `HomeScreen.tsx` và `app/share/[token]/page.tsx` có provider đó, trong khi `AppCommandPalette`
nằm trong `AppShell` — dùng ở **5 màn** (Home · Files · Thư viện · 2D · Trình chiếu). Bê logic node
sang `AppCommandPalette` sẽ làm `useReactFlow()` **ném lỗi ở 4 màn không có provider**.

Đường đúng có tồn tại nhưng là việc khác: `AppCommandPalette` liệt kê node rồi đặt "loại node đang
chờ" vào `useFlowStore` (zustand thuần, không cần provider), `FlowCanvas` nhặt lên và chèn tại
viewport. Đó là **máy mới**, thuộc B3/B5, không phải "đọc registry" của B2. Làm mò trong phiên này
là đổi một dọn-dẹp lấy nguy cơ chết 4 màn.

### 2.5 · Ô ⑤ — giao diện

**Mock:** `docs/mocks/mock-3-thanh-cong-cu-mot-khuon.html`, đã render và soi ở 1440×1000.
Có: khối **TRƯỚC** (ba khuôn rời + bảng phím lệch — đúng bằng chứng cho *"3 chặng như 3 app"*) ·
khối **SAU** (ba thanh xếp chồng, **đủ 2 theme cạnh nhau trong một ảnh**) · bốn trạng thái
(thường · hover · đang bật · mờ kèm lý do) · chú giải hai đường nhập từng chặng.

Token: bar `var(--tap-lg)` 44 · `--r-full` · đệm 6 · gap 2; nút `var(--tap)` 32 → 44 khi chạm qua
đúng điều kiện `(hover:none) and (pointer:coarse)` app đang dùng. **Không đẻ số nào ngoài token** —
bo đồng tâm tự đúng vì `--r-full` kẹp về nửa cạnh ngắn: ngoài 22, trong 16, đúng `22 − 6`. Bật =
**ghost**, không tô đặc.

**🔴 DesignSync KHÔNG DÙNG ĐƯỢC — khai thật.** `ToolSearch` với `select:DesignSync` trả *"No matching
deferred tools found"*; tìm rộng bằng từ khoá cũng không ra tool nào ghi vào project claude.ai/design.
Roster phiên này có Figma MCP và một tool Netlify tên *"import-claude-design-from-url"* (đích khác
hẳn — deploy ra Netlify, không phải pane Design System của Hoà). ⇒ Mock **chỉ nằm trong repo**.
Theo luật QUY TRÌNH DESIGN 02/08 thì repo mới là nguồn sự thật còn Claude Design là xưởng + nơi
duyệt, nên mock vẫn hợp lệ; **nhưng cửa duyệt mắt của Hoà thì chưa mở** — T cần đẩy hộ hoặc cấp
đường khác.

### 2.6 · Ô ⑨ — hai skill chấm bắt được gì

**`design:accessibility-review`** — 5 lỗi thật, đã sửa hết:

| Lỗi | Hậu quả | Sửa |
|---|---|---|
| Nút mờ có `title` mà **thiếu `aria-label`** | trình đọc màn hình đọc cả câu lý do làm TÊN nút, người mù không bao giờ nghe được nút đó tên "Lật" | thêm `aria-label` cho đủ 12 nút mờ |
| `aria-describedby` **trỏ vào id không tồn tại** | mô tả rơi vào hư không | thêm `<span class="sr-only" id="…">` thật |
| `opacity .35` cho nút mờ | nét icon tụt ~**2,2:1**, dưới cả ngưỡng **3:1** của WCAG 1.4.11 → mờ thành *đọc không ra*, trái đúng ý §9 | **.35 → .5**, sửa cả trong mock **lẫn `ToolbarChip.tsx:89,105`** để hai bên không trôi khỏi nhau |
| `.paths` dùng `--t4` (#6e6e78) | ~**4,3:1**, hụt 4.5:1 của WCAG 1.4.3 ở chữ 11px | đổi `--t3` (~7,4:1) |
| `.pack` không có `:focus-visible`, `.sep`/`<svg>` không `aria-hidden` | mất vòng focus; rác cho trình đọc | thêm đủ |

Ghi chú thiết kế đáng giữ: nút mờ dùng **`aria-disabled` chứ không `disabled`** — `disabled` rơi
khỏi vòng Tab nên trình đọc màn hình **không bao giờ đọc được lý do vì sao nó mờ**, tức "mờ kèm lý
do" chỉ đúng với người sáng mắt.

**`design:design-critique`** (trục *consistency* — trục then chốt của phiếu này): mock ban đầu chỉ
có khối "SAU", chấm ra là **không chứng minh được điều cần chứng minh** — người xem không có gì để
so. Đã thêm khối "TRƯỚC" với ba hình khối khác nhau + bảng phím lệch. Đó mới là câu trả lời cho
Hoà. Trục *hierarchy*: nhãn nhóm ban đầu dùng `--t4` chìm ngang nền, nâng lên `--t3`.

`design:design-system` dùng ở bước khung (audit → extend), `design:ux-copy` áp vào 20 câu lý do mờ
theo `SPEC-NGON-NGU-CHI-DAN`: hành động/hiện trạng trước · ≤12 từ · **cấm jargon nội bộ**. Có một ca
test canh riêng chuyện đó (`không câu lý do nào lộ jargon nội bộ ra giao diện`).

### 2.7 · Ba phát hiện ngoài dự kiến

**① 🔴 `findByDirectKey` sai thiết kế — chính test bắt.** Bản đầu lọc qua `when(ctx)` cho giống
`findByAlias`. Nhưng `when` trả lời câu *"`run()` đi qua `useCadStore` có làm đúng việc ở chặng này
không"* — ở 3D là KHÔNG. Hệ quả: hàm **luôn trả rỗng ở đúng cái chặng duy nhất có phím đơn**, tức vô
dụng hoàn toàn. Sửa: lọc theo `stages` (lệnh có sống ở chặng này không), trả về **danh tính** lệnh,
nơi gọi tự dispatch bằng tay thi hành của mình. Nếu không viết test này thì bug ship thẳng.

**② 🔴 BẪY PHÍM CHÉO CHẶNG — chưa vỡ, nhưng đã cài sẵn.** Ba chữ vừa là alias gõ 2D vừa là phím đơn
3D, **hai trong ba lệch nghĩa**:

| Chữ | Nghĩa ở 2D (alias gõ) | Nghĩa ở 3D (phím đơn) | |
|---|---|---|---|
| `M` | Dời | Dời | ✅ khớp |
| `D` | **Cửa đi** (`cad.draw.door`) | **Chép** (`cad.edit.copy`) | 🔴 lệch |
| `T` | **Chữ** (`cad.draw.text`) | **Đo** (`cad.dim.measure`) | 🔴 lệch |

Hôm nay chưa nổ vì 2D không bật đường phím đơn. Ngày nào 2D/Trình chiếu có phím đơn thì đây là chỗ
nổ đầu tiên — và nó tái sinh đúng "chi phí học lại" mà cả ticket sinh ra để dẹp, chỉ ở tầng khác.
Đã cắm **3 ca test làm chuông báo**, đổi ánh xạ mà quên chỗ này là đỏ ngay. **Cần T quyết**, ngoài
thẩm quyền phiên phụ.

**③ Nút "Xoá" xuất hiện ở thanh 2D.** Trước nay thanh 2D **không có** nút Xoá (chỉ phím Delete + gõ
`E`) trong khi 3D có. Đọc chung sổ nên nó tự có mặt, kèm lý do mờ đúng lúc ("Chưa chọn đối tượng nào
để xoá"). Đây là kiểu lợi ích mà một-nguồn tự sinh ra, không phải tính năng ai đi thêm.

---

## 3 · TỔNG KẾT LẠI VẤN ĐỀ

Gốc bệnh *"3 chặng như 3 app"* không nằm ở bo góc mà ở chỗ **cùng một lệnh được khai ở ba nơi**, nên
nó trôi ra ba cái tên, ba cái phím, ba cái icon. B2 cắt đúng chỗ đó: **danh sách về một nguồn ngay
lập tức**, còn tay thi hành thì thừa nhận thẳng là chưa gộp được và hẹn B5 — thay vì giả vờ gộp rồi
để nút bấm không ra gì.

Cái khó thật của phiếu không phải refactor mà là **không được hợp nhất hai cơ chế nhập bằng cách
chọn phe**. Lời giải: đường nhập là năng lực của mặt tiền (2D có dòng lệnh, 3D có bộ bắt phím đơn,
Trình chiếu chưa có gì), sổ lệnh giữ cả hai và không quyết thay ai.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Tốt**
- Marker đạt thật, không phải đạt trên giấy: 0/0/0 → 4/2/2, và **danh sách cũ đã xoá** chứ không để
  song song "cho an toàn".
- Test bắt được bug thiết kế trước khi ship (`findByDirectKey`) — đúng loại test bảo vệ chứ không
  phải test che bug, đúng bài học Hough 15/08.
- Vòng a11y ra 5 lỗi thật, trong đó `opacity .35` là lỗi ở **nền dùng chung 3 chặng** nên sửa một
  chỗ được cả ba.
- Hai lệch `soi:thao-tac` không nhích: file mới **không dính** cái nào.

**Chưa tốt / rủi ro — nói thẳng**
- ⚠️ **Chưa mở app thật xem bằng mắt.** Phiếu cấm tự mở dev server, và một phiên khác đang chiếm
  server trong thư mục này. Toàn bộ nghiệm thu là tsc + test + mock. **Đây là rủi ro lớn nhất của
  đợt** vì việc này đụng layout của cả ba chặng. T phải soi mắt trước khi coi là xong.
- ⚠️ **Trình chiếu nay hiện 8 nút mờ** (trước chỉ 2 nút undo/redo). Đúng luật §9 và đúng câu ticket
  *"chặng nào chưa có engine thì hiện MỜ KÈM LÝ DO, KHÔNG giấu đi"*, nhưng thanh Trình chiếu vốn đã
  bị chê wrap 4 hàng (lệch L1). **Đây là chỗ Hoà dễ chê nhất** — nêu trước để T không bị bất ngờ.
  Nếu Hoà chê, cách sửa đúng là B3 (gói nhóm) chứ không phải giấu nút.
- ⚠️ Dock 3D mở rộng hàng 1 dài thêm (11 nút có nhãn). Đã kẹp `maxWidth: calc(100vw − 32px)` +
  cuộn ngang để không tràn màn hẹp, nhưng **chưa đo bằng mắt** ở 1280.
- ⛔ Ô ④ mục 3 còn nợ; DesignSync không có nên **cửa duyệt mắt của Hoà chưa mở**.
- Một chỗ tôi tự nới so với phiếu: mục ④.4 nói *"mỗi `CommandDef` mang cả alias gõ lẫn phím đơn"*,
  tôi chỉ điền phím đơn cho 5/10 lệnh có phím thật. Điền đủ 10 là bịa — nhưng đó **là lệch so với
  câu chữ phiếu**, ghi ra để T phán chứ không im lặng.

---

## 5 · HƯỚNG XỬ LÝ — NHIỀU GÓC ĐỘ

**Hướng A — T soi mắt 3 chặng ngay, rồi mở B3.**
· Ưu: đóng đúng rủi ro #1 (chưa xem app thật) khi thay đổi còn nóng và người làm còn nhớ; B3 (gói
nhóm lệnh) là thứ giải luôn chuyện "Trình chiếu 8 nút mờ" theo cách đúng.
· Nhược: tốn một lượt duyệt mắt của Hoà — tài nguyên khan hiếm nhất theo `DOI-CHIEU-3-TRUONG-PHAI`.

**Hướng B — làm nốt ④.3 (gộp ⌘K) trước khi soi mắt.**
· Ưu: đóng trọn phiếu, không để lại mục dở.
· Nhược: nó **không phải việc của B2** mà là máy mới (pending-node qua `useFlowStore`), và đụng
`FlowCanvas` + `AppShell` — hai file ngoài vùng ô ③. Gộp vào đây là kéo dài một phiếu đã xong phần
lõi, để phần rủi ro cao chưa soi mắt nằm chờ lâu hơn.

**Hướng C — chốt bẫy phím `D`/`T` trước mọi thứ khác.**
· Ưu: đây là quyết định kiến trúc, càng để lâu càng đắt — y hệt lý do B1 đổi phím sớm.
· Nhược: hôm nay **chưa vỡ** (2D không bật phím đơn), và quyết đúng thì cần biết 2D có định bật
phím đơn hay không — câu đó thuộc B3/B4, chưa tới.

---

## 6 · ĐỀ XUẤT — CHỌN HƯỚNG A

**T soi mắt ba chặng trước, rồi mở B3.**

Vì sao A chứ không B: phần lõi B2 đã xong và đã đo được; thứ chưa chắc chắn là **hình dạng trên màn**,
mà cái đó chỉ đóng được bằng mắt, không bằng thêm code. Để một thay đổi đụng cả ba chặng nằm chờ
trong lúc đi làm việc khác là đúng kiểu nợ mà `soi:frontier` sinh ra để chống.

Vì sao A chứ không C: bẫy `D`/`T` đã có **3 ca test canh**, nó không lặng lẽ trôi đi được nữa. Quyết
nó lúc chưa biết 2D có bật phím đơn hay không là quyết trong bóng tối — xếp vào B3/B4 khi câu hỏi đó
có câu trả lời.

Ba việc kèm theo, xếp theo độ đắt:
1. **Đẩy mock lên Claude Design hộ** (hoặc cấp cho phiên phụ đường dùng được) — không có bước này
   thì luật 16/08 *"phiên phụ phải có mặt, mặt phải qua MCP Claude Design"* mới đúng một nửa.
2. **Phán bẫy `D`/`T`** khi mở B3.
3. `④.3` gộp ⌘K: mở phiếu riêng kèm `FlowCanvas` + `AppShell` vào vùng file, đừng nhét vào phiếu
   toolbar.

---

## ⑦ NGHIỆM THU — nguyên văn

```
$ npx tsc --noEmit
(không có dòng nào — sạch)

$ npm run license:check
> license-checker-rseidelsohn --production --onlyAllow 'MIT;ISC;Apache-2.0;...' --summary
(không lỗi)

$ npm run check:chot
TỔNG: 9 luật · 🔴 0 vi phạm chặn · 🟡 0 cảnh báo

$ npm test   # ⚠️ script gốc dùng đường DẪN TƯƠNG ĐỐI `node_modules/.bin/sucrase-node`,
             # worktree KHÔNG có node_modules riêng (Node resolve ngược lên repo chính) nên
             # mọi test báo "No such file or directory". KHÔNG PHẢI test đỏ — là hạn chế
             # môi trường worktree. Chạy lại y hệt lệnh đó với đường dẫn tuyệt đối:
$ find . -name '*.test.ts' -not -path '*/node_modules/*' -not -path '*/.worktrees/*' \
    -not -name 'edgecase-concurrency.test.ts' -print0 \
  | xargs -0 -n1 -P8 sh -c '/Users/tranben/Downloads/interiorflow/node_modules/.bin/sucrase-node "$0" \
    >/dev/null 2>&1 || echo "FAIL: $0"'
=== HET ===
# 276 file test, 0 dòng FAIL

$ /Users/tranben/Downloads/interiorflow/node_modules/.bin/sucrase-node lib/commands/toolbar-doc-registry.test.ts
PASS — 47 ok, 0 fail

$ npm run soi:tu-dien
✅ 0 lệch định nghĩa

$ npm run soi:hinh-hoc
🔴 GIÁ TRỊ NGOÀI THANG: 8px×3 · 5px×3 · 22px×1 · 17px×1 · 28px×1 · 7px×1
🔎 TOP FILE VI PHẠM: 4 components/filemanager/files-mock-css.ts · 3 components/filemanager/FilesNavigator.tsx
                     2 components/BottomToolbar.tsx · 1 components/avatar/AvatarBuilder.tsx
Đã quét 281 file · 1002 khai báo radius · 10 ngoài thang (6 giá trị lẻ)
# ĐỐI CHIẾU baseline đầu phiên: 280 file · 1007 khai báo · **10 ngoài thang** — Y NGUYÊN.
# Không file nào của phiếu này nằm trong danh sách vi phạm.

$ npm run soi:thao-tac
🔴 2 LỆCH (trên 17 luật grep) · 👁 19 luật chờ mắt
  🔴 outline-can-focus-visible — 31 file có outline:none mà thiếu focus-visible
  🔴 cam-hex-inline — hex trong inline style
# Đúng 2 nợ cũ STATUS.md 15/08 ghi, số không nhích.
# grep 7 file phiếu này đụng trong output soi:thao-tac = 0 dòng → không góp thêm lệch nào.

$ npm run soi:frontier
👁 1 qua mắt Hoà · ✅ 66 xong-MÁY · ⬜ 55 chờ · 🔴 0 LỆCH

$ grep -c "lib/commands" <3 toolbar>
components/cad/CadToolbar.tsx            -> 4     (trước: 0)
components/render-studio/ToolDock3D.tsx  -> 2     (trước: 0)
components/present-editor/Toolbar.tsx    -> 2     (trước: 0)
```

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

1. **CHƯA KIỂM BẰNG MẮT TRÊN APP THẬT.** Phiếu cấm tự mở dev server; một phiên khác đang chạy server
   trong thư mục này nên Browser pane không với tới được. Ba thanh công cụ **chưa ai nhìn thấy chạy**.
   Mọi khẳng định về hình dạng chỉ dựa trên mock + đọc code. Đây là chỗ yếu nhất của báo cáo này.
2. **Chưa đo bề rộng thật** của dock 3D mở rộng ở 1280 và 1440. Đã kẹp `maxWidth` + cuộn ngang phòng
   xa, nhưng cuộn ngang trong dock là trải nghiệm chưa ai duyệt.
3. **Chưa kiểm hồi quy thao tác 3D**: `bindStage` gọi `setActiveTool` đúng như code cũ (đọc từng
   dòng để đối chiếu), nhưng **chưa bấm thử** nút Chọn/Dời/Xoay/Chép/Thước trên khung nhìn 3D thật.
4. **Chưa kiểm** thanh Trình chiếu ở khổ hẹp sau khi thêm 8 nút mờ — khả năng wrap thêm hàng là có
   thật, chỉ chưa đo.
5. **Không có ý kiến** về việc 2D/Trình chiếu *có nên* bật đường phím đơn hay không — ngoài phạm vi
   phiếu, và câu trả lời quyết định cách xử bẫy `D`/`T`.
6. `LY_DO_MO` là **câu chữ tôi soạn** theo `SPEC-NGON-NGU-CHI-DAN` từ chú thích kỹ thuật B1; nội
   dung đúng code, nhưng **giọng chữ chưa ai duyệt**.
7. Không kiểm hộ vùng của P-A (`components/settings/`) và P-B (`lib/review/`) — đúng luật ô ③.

## ⑦c · HẠN DÙNG KẾT LUẬN

- Kết luận **"3 toolbar đã đọc chung một sổ"** hết đúng nếu ai đó thêm lệnh mới bằng cách khai thẳng
  trong file toolbar. Chuông báo: marker `grep 'lib/commands' > 0` **không bắt được** ca này — nó chỉ
  chứng minh *có đọc*, không chứng minh *không tự khai thêm*. Muốn chặn thật thì cần một luật
  `soi:*` đếm mảng lệnh tự khai trong `components/**/Toolbar*`; **chưa có, đề xuất mở**.
- Kết luận **"hai đường nhập giữ nguyên vẹn cả hai"** hết đúng khi B5 làm `runFor` theo ngữ cảnh —
  lúc đó `bindStage` nên biến mất, và nếu nó còn sống song song với `runFor` thì lại thành hai nguồn.
- Bảng bẫy `D`/`T` ở §2.7② hết đúng ngay khi đổi ánh xạ phím; 3 ca test sẽ đỏ, **đọc lại test chứ
  đừng đọc lại bảng này**.
- Số đo `soi:hinh-hoc` 10-ngoài-thang và `soi:thao-tac` 2-lệch đo lúc 16/08; P-A và P-B đang chạy
  song song nên T chạy lại có thể ra số khác — **khác không có nghĩa là do phiếu này**.
- Kết luận **"DesignSync không dùng được"** chỉ đúng cho roster tool của PHIÊN NÀY. Phiên khác nạp
  được thì mock đẩy lên bình thường, không phải sửa gì trong mock.
