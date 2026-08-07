# M-APPLY-C-OUT — Làn C · IN / GIẤY / XUẤT (4 màn, BUILD)

> Phiên 06/08. Nguồn: `docs/mocks/HopXuatPDF.dc.html` · `BangNetIn.dc.html` · `BangTron.dc.html` ·
> `ToGiay.dc.html`. **CHƯA COMMIT** (luật V6 — Hoà commit). Không sửa `GAP-IF.md` (§0u).

## 1. Bốn màn — làm gì, nằm đâu

| Màn | Mock nguồn | File dựng mới | App trước đó |
|---|---|---|---|
| 7 · Hộp xuất PDF | `HopXuatPDF.dc.html` | `components/print/ExportPdfDialog.tsx` | `grep -a` = **chưa có hộp thoại nào**; chỉ có hàm `exportCadToPdf`/`buildSheetSetPdf` (`lib/cad/pdf.ts`) và nút PPTX |
| 8 · Bảng nét in | `BangNetIn.dc.html` | `components/print/LineweightTable.tsx` | chưa có màn nào; chỉ có hằng `STANDARD_LINEWEIGHTS` (`lib/cad/model.ts:42`) |
| 9 · Bảng tròn (chọn bút) | `BangTron.dc.html` | `components/print/RadialToolMenu.tsx` | `grep -a "RadialMenu\|Bảng tròn"` = 0 kết quả |
| 10 · Tờ giấy | `ToGiay.dc.html` | `components/print/PaperSheetFrame.tsx` | chưa có; `components/present/*` chỉ có Deck/Overlay/Viewer — **không dựng trùng viewer** |

## 2. Token thêm vào `app/globals.css` (không hex rời trong component)

Lấy từ `:root` của chính 4 file `.dc`. Đặt trong khối `:root` chung, **cố ý không theo theme** —
cùng lý do khối `--illus-*` đã có: đây là mô phỏng **tờ giấy sắp in ra**, giấy không đổi màu theo
theme app, và đây là thứ người dùng đối chiếu với file PDF thật.

- `--paper` `--paper-edge` `--paper-ink` `--paper-thin` `--paper-shadow` `--paper-shadow-sm`
- `--tap-lg: 44px` (mock khai cùng `--tap:32`; **không** override ở media cảm ứng — 44 vốn đã là cỡ ngón tay)
- `--on-accent: #ffffff`

Bí danh (theo đúng lối `--p-img: var(--accent)` đã có sẵn, để nền Kem tự lấy bản đủ tương phản
thay vì kẹt lại giá trị nền Mực của mock):
`--ok → --success` · `--warn → --warning` · `--vp-lock → --success` · `--vp-open → --warning` · `--pen → --t1`

`grep -aE "#[0-9a-fA-F]{3,8}|rgba?\("` trên `components/print/*.tsx` nay chỉ còn **7 mã màu layer**
trong dữ liệu mẫu `DEMO_LINEWEIGHT_ROWS` (đó là **màu layer của người dùng** = dữ liệu, không phải
màu giao diện) và hex trong lời chú thích.

## 3. Nối vào luồng

`components/present-editor/Toolbar.tsx` — thêm **một** mục vào IOMenu `kind="export"` đã có:
`pdf-sheets` · "Xuất PDF theo tờ giấy…" → mở `ExportPdfDialog`. Chỉ THÊM, không đụng mục cũ
(`pdf`, `pptx`, `png`, `PDF in 300dpi`), không đổi hành vi cũ, không viết engine PDF thứ hai —
nút xuất gọi lại đúng `p.onExportPdf()` sẵn có.

Bảng nét in (Màn 8) vào luồng qua nút "Bảng nét khi in" **trong** hộp thoại Màn 7 — nó ngồi ở **cột
phải 258px**, giữ nguyên tờ giấy bên trái, vì trong mock nó vốn là panel dọc hẹp; kéo ngang ra 680px
thì cột tên phình, số mm và vạch minh hoạ văng xa nhau.

Tờ giấy (Màn 10) có `variant='preview'` làm luôn vùng xem trước của Màn 7 — **một component, hai cỡ**,
không dựng 2 bản song song.

## 4. Cố ý lệch mock — và vì sao

| Lệch | Lý do |
|---|---|
| **Bỏ chữ "Checklist TTT"** trong dòng mô tả Màn 8 | LUẬT TRUNG TÍNH (`CLAUDE.md` §1): sản phẩm bán ra không nhúng tên studio. Mock chép lại lỗi này; port nguyên văn là nhân bản lỗi. Giữ nguyên **ý** lời nhắc, chỉ bỏ cái tên |
| **Bỏ câu "Nội dung do titleBlockPro() sinh — lib/cad/commands.ts"** trên tờ giấy | `SPEC-NGON-NGU-CHI-DAN` cấm jargon nội bộ lộ UI. Thay bằng "Khung tên tự điền khi in — theo Brand Kit của dự án" |
| **5 khổ A0–A4** (mock vẽ 4) | App có đủ 5 khổ trong `PAPER_SIZES_MM`; bỏ A4 là mất tính năng. Giữ lưới 4 cột, A4 tràn hàng 2 |
| **Ô "chỗ trống" thành prop `emptySlot`**, không vẽ mặc định | Mock là ảnh tĩnh nên vẽ cứng ở 55.5%/36% được; ở đây khung nhìn do người dùng đặt → vẽ cứng sẽ đè nét đứt lên đúng khung nhìn họ vừa kéo vào |
| **Dữ liệu ra prop** (`rows` · `viewports` · `checks` · `tools`) | 7 hàng nét / 3 khung nhìn / 5 dòng kiểm của mock là **dữ liệu mẫu**, export riêng (`DEMO_*`), không nhốt trong thân component |
| **Icon lucide** thay glyph `✎ ▱ ⌫ ↺ ⤢` của Màn 9 | `LUAT-GIAO-DIEN-BAT-BUOC` ②: một bộ icon lucide thật. Chữ "T" (Chữ) giữ nguyên vì đó là chữ, không phải icon |
| **`--dur-fast/--dur-base` của app** (0.18s/0.32s) thay số mock (.12/.18) | Token app đã có, đổi globals vì 1 mock là kéo cả app theo |
| Khổ giấy **khoá** khi mở từ chặng Trình chiếu | Xem §6 dưới |

## 5. Lỗi bắt được và đã vá (1 agent dựng + 1 agent phản biện + tự kiểm)

1. **Bảng tròn nhảy vị trí khi mở** — `@keyframes bt-in` chỉ có `scale()`, mà animation **thắng inline
   style** trong cascade ⇒ suốt 0.32s mất `translate(-50%,-50%)`, đĩa 236px lệch nửa thân xuống-phải
   rồi giật về. Vá: đưa `translate(-50%,-50%)` vào **cả hai** mốc keyframe.
   Đo lại: giữa animation `transform = matrix(0.86,0,0,0.86,-118,-118)`, tâm đứng yên ở (300,300).
2. **Bảng tròn tràn khỏi màn hình** khi mở sát mép → kẹp tâm cách mép ≥ nửa đường kính.
3. **Hộp thoại tràn màn hình thấp** khi chọn A0/A1 **dọc** (tờ xem trước cao gấp đôi, 2 nút xuất rơi
   ra ngoài, không cuộn tới) → `maxHeight: calc(100vh - 48px)` + cột nội dung cuộn được.
4. **Mở lại rơi vào tab cũ** — hộp thoại `return null` chứ không unmount nên state lần trước còn
   nguyên → `useEffect` đặt lại tab/khổ/hướng theo prop mỗi lần mở.
5. **Mục "TRƯỚC KHI XUẤT" rỗng mà vẫn hiện tiêu đề** (gợi ý sai là "không có gì phải kiểm") → ẩn cả mục.
6. **Hai nút xuất giống hệt nhau khi bộ chỉ có 1 tờ** → giấu nút phụ khi `sheetCount <= 1`.
7. **3 chỗ `rgba()` tự chế** trong `PaperSheetFrame` → `color-mix(in srgb, var(--paper-ink) …)` +
   token `--paper-shadow-sm` (`color-mix` đã dùng sẵn trong `globals.css`, không phải kỹ thuật mới).
8. Thêm `role="dialog"` / `aria-modal`.

## 6. Điều Hoà cần biết — nút khổ giấy ở chặng Trình chiếu bị **khoá có lý do**

Ở chặng Trình chiếu, khổ giấy **không** do hộp thoại này quyết định — nó lấy theo "Khổ trình bày"
của hồ sơ (`deck.stagePreset` → `PAPER_SIZE_MM`, `PresentEditor.tsx:400`). Nếu để bấm tự do thì
người dùng chọn "A0 · Dọc" mà file xuất ra vẫn y nguyên = **nút giả**, đúng thứ luật §9 cấm.
Nên: nút mờ + câu lý do ngay dưới. Hộp thoại vẫn nhận khổ giấy sống — nơi gọi nào **cầm thật**
khổ giấy (chặng 2D Kỹ thuật, `Sheet[]`) chỉ cần **không** truyền `paperLockedReason` là mở khoá.

## 7. Nghiệm thu đã chạy

- `npx tsc --noEmit -p .` (chạy nền) — **sạch**. Còn đúng 1 lỗi **CŨ, của làn khác**:
  `lib/cad/render-layer-index.test.ts(36,21)` `Viewport` thiếu `panX/panY` — không đụng.
- Browser thật `127.0.0.1:3005` (dùng lại server sẵn có, không dựng thêm), 1440×900:
  - **Số đo khớp mock từng px**: hộp thoại 680 · lưới `420px 258px` · header 44 · tờ xem trước
    maxWidth 330 & `aspect-ratio 420/297` · nút khổ giấy cao 32 bo 9 · nút xuất chính cao 44 bo 11 ·
    nút phụ cao 30 bo 10.
  - **Trạng thái thật, không phải ảnh chết**: bấm A1 + Dọc → tờ giấy đổi sang `aspect-ratio 594/841`
    (đúng A1 dọc trong `PAPER_SIZES_MM`), nhãn đáy đổi thành "A1 · dọc · tờ 1 / 3".
  - Màn 8: "Đen trắng" → 7 chấm màu layer chuyển xám, `aria-pressed` đổi đúng.
  - Màn 9: 6 nút đúng 6 vị trí mock, tâm hiện tên công cụ đang chọn.
  - Màn 10 chụp **cả 2 theme**: nền Kem lấy đúng bản `--success/--warning` đậm (huy hiệu ĐÃ KHOÁ /
    CHƯA KHOÁ đọc được), nền Mực giữ đúng màu mock.
  - Token resolve thật trong trình duyệt: `--ok=#46b876` `--warn=#d9a34a` `--pen=#f5f5f7`
    `--tap-lg=44px` — khớp `:root` của mock từng byte.
- **Đường vào THẬT** (`/projects/<id>/present`, deck "LUMEN VILLA" 8 slide): menu **Xuất** hiện đủ
  5 mục cũ **không đổi** (PDF · PowerPoint · Ảnh PNG · Toàn bộ project · PDF in 300dpi vẫn mờ đúng
  lý do cũ) + mục mới **"Xuất PDF theo tờ giấy…"** ở cuối → bấm ra đúng hộp thoại Màn 7, tiêu đề
  "Xuất PDF — 1 tờ", cột Khổ giấy **mờ kèm câu lý do**, mục "Trước khi xuất" **ẩn** (không bịa dòng
  kiểm giả), chỉ **một** nút xuất (bộ 1 tờ nên nút phụ tự ẩn). **Esc đóng sạch** (`[role="dialog"]`
  còn 0).
  > Ghi để Hoà biết: giữa lúc verify, **làn library** sửa dở `components/library/library-sheet-css.ts`
  > làm vỡ build **toàn app** vài phút (mọi route ra "Build Error"). Không phải việc của làn C —
  > chờ họ lưu xong thì build sạch lại và verify chạy tiếp bình thường.

## 8. CHƯA làm được / còn nợ — không tô hồng

1. `ExportPdfDialog` ở chặng Trình chiếu mới nhận **1 "tờ"** (trang đang mở) và **checklist rỗng** —
   Toolbar chưa cầm `Sheet[]`/dữ liệu kiểm thật. Không bịa dữ liệu giả cho đủ mock.
   → **VÒNG 2 đã xử lý ở chặng 2D** (xem §9), chặng Trình chiếu giữ nguyên vì khổ giấy ở đó thật sự
   do hồ sơ quyết định, không phải thiếu sót.
3. Màn 9 (bảng tròn) **chưa gắn vào thao tác nào** — nó là công cụ bút trên giấy/markup, mà vùng đó
   thuộc làn khác đang giữ. Component đã sẵn sàng (`onPick`/`onClose`/`x`/`y`), chờ chỗ gọi.
   → **VÒNG 2: vẫn CHƯA gắn, có bằng chứng cụ thể — xem §9.2.**
4. Chưa có test đơn vị cho `lineweightBarHeightPx` / `radialPositions` / `clampToViewport` (3 hàm
   thuần, dễ khoá hành vi) — phiếu không yêu cầu, nhưng nên làm.
   → **VÒNG 2 đã làm: 30 test, xem §9.3.**
5. Trang kiểm tạm `app/dev-print-check/page.tsx` **đã xoá** sau khi chụp xong.

---

# §9 — VÒNG 2 (06/08, cùng phiên): nối chặng 2D · test · nhãn mock

## 9.0 BƯỚC 0 — grep trước khi động (dán nguyên kết quả)

| Lệnh | Kết quả |
|---|---|
| `grep -rna "ExportPdfDialog" components/ app/` | chỉ `components/print/*` + `components/present-editor/Toolbar.tsx` (3 dòng: import + mount) ⇒ **chặng 2D chưa có** |
| `grep -rna "RadialToolMenu" components/ app/` | **CHỈ chính nó** (`components/print/RadialToolMenu.tsx`) ⇒ **0 nơi gọi** |
| `grep -rna "Sheet\[\]" components/cad/ lib/cad/` | `components/cad/CadSheets.tsx:256,305` (state `sheets`) + `lib/cad/cad3d-autosave-core.ts:46` ⇒ **`Sheet[]` sống ở CadSheets, không ở CadEditor** |

## 9.1 ✅ VIỆC 1 — Màn 7 vào chặng 2D Kỹ thuật (G-C-01)

**Mount ở `CadSheets.tsx`, không phải `CadEditor.tsx`** — vì đó mới là nơi giữ `sheets[]` thật.
CadEditor chỉ phát `CustomEvent('cad:paper-export-dialog-request')`, đúng cơ chế bắc cầu mà file này
đã dùng sẵn cho `.idf`/`.ifpack`/`sheetset-pdf` (không mở cơ chế thứ hai — luật một-cỗ-máy).

Ba thứ nay là **THẬT**, khác hẳn chặng Trình chiếu:
- **`Sheet[]`** — đúng số tab bản vẽ đang mở, đúng tên người dùng đặt.
- **Khổ giấy** — đọc `Doc.paperKey/paperOrientation`; **KHÔNG truyền `paperLockedReason`** ⇒ mở khoá.
  Đổi khổ trong hộp thoại là **ghi thẳng vào Doc** qua `setPrintSettings` — CÙNG đường mà ô chọn khổ
  giấy trong Inspector CadEditor đang dùng ⇒ PDF xuất ra đúng khổ vừa chọn, khung tên/tỉ lệ theo đó.
- **Danh sách kiểm** — `lib/print/export-checks.ts` (MỚI) đo từ chính `Doc`: có nét không · tỉ lệ 1:N
  có lọt khổ không (dùng đúng `fitsAtScale`/`suggestStandardScale` mà `pdf.ts` dùng lúc plot, nên số
  ở đây và trong file PDF luôn khớp) · layer thừa nên PURGE · nét mảnh hơn sàn in `MIN_PRINTABLE_LINE_MM`
  · bản vẽ có xa gốc 0,0 không. Bản vẽ trống thì **bỏ hẳn** dòng gốc toạ độ thay vì khẳng định bừa.

Mục menu **"Xuất bộ hồ sơ (PDF nhiều tờ)…"** nay mở hộp thoại trước thay vì xuất "mù" — **cùng một
đích**: nút xuất trong hộp thoại phát lại đúng `cad:sheetset-pdf-export-request` cũ. Cố ý **không
thêm mục thứ hai** để tránh 2 nút gần như trùng nhau.

## 9.2 🔴 VIỆC 2 — DỪNG, không lấn (G-C-02 CHƯA đóng)

Bảng tròn cần một mặt bút thật để gắn vào. Grep ra **2 ứng viên, cả hai đều là mảng làn khác**:

| Mặt bút thật | File | Ai giữ |
|---|---|---|
| Markup ghim ghi chú trên bản vẽ | `components/cad/CadToolbar.tsx:116` (tool `'markup'`) + `CadCanvas.tsx:1266` | `00-CHOT.md`: CadToolbar = **CHINH**, CadCanvas = **PHU** |
| Bút/marker/tô sáng/tẩy trên canvas Node | `components/BottomToolbar.tsx:129-132` + `FlowCanvas.tsx:291` | làn node-canvas — `FlowCanvas.tsx` **đang dirty ngay lúc này** |

Theo đúng câu trong phiếu ("đụng mảng người khác thì DỪNG và báo, đừng lấn") ⇒ **không gắn**.
Lý do thứ hai, độc lập với chuyện lấn mảng: gắn bảng tròn lên tờ giấy của làn C thì **chọn bút xong
không có gì để vẽ** — đúng loại "nút giả bấm không ra gì" mà §9 cấm, và chính là lỗi tôi đã bắt ở
vòng 1. **Cần Hoà chỉ định 1 trong 2 mặt bút trên rồi giao cho đúng làn giữ nó** (hoặc cho phép làn C
chạm 1 file).

## 9.3 ✅ VIỆC 3 — 30 test, có ca tái hiện bug thật

3 hàm thuần tách khỏi `.tsx` sang `lib/print/` để `npm test` (sucrase-node) chạy được — cùng lối
`lib/cad/dwg-map.ts` đã tách khỏi `dwg.ts`. Component nay **import** từ đó, không giữ bản thứ hai.

| File test | Số ca | Khoá điều gì |
|---|---|---|
| `lib/print/radial.test.ts` | **15** | 6 toạ độ khớp mock từng số · nút đầu luôn ở đỉnh · kẹp khung nhìn (cả ca khung hẹp hơn đĩa) · **[C] chặn hồi quy keyframes** |
| `lib/print/lineweight.test.ts` | **5** | 7 hàng mock ra đúng 7 chiều cao vạch · đúng ngay tại ngưỡng 0.5/0.25 · đơn điệu |
| `lib/print/export-checks.test.ts` | **10** | Doc sạch ✓ hết · Doc trống KHÔNG bịa dòng gốc toạ độ · bắt layer thừa/nét mảnh/xa gốc · **đổi khổ giấy và đổi hướng giấy làm kết quả ĐỔI THEO** (thứ chứng minh checklist là thật) |

⚠️ **Đính chính một câu trong phiếu vòng 2**: "clampToViewport phải có ca tái hiện bug keyframes" —
hai thứ đó **không cùng một hàm**. Bug keyframes nằm ở chuỗi CSS, không ở phép kẹp toạ độ; nhét ca
đó vào test `clampToViewport` thì test xanh mà bug vẫn về được. Nên ca tái hiện đặt **đúng chỗ bug
sống**: `RADIAL_MENU_KEYFRAMES` tách ra `lib/print/radial.ts`, test mục [C] soi từng mốc `from`/`to`.

**Đã chứng minh test KHÔNG phải trang trí** (mutation test): sửa keyframes về bản lỗi
(`from { transform: scale(0.86) }`) → test **ĐỎ** với đúng câu *"MỐC NÀY NUỐT MẤT translate(-50%,-50%)"*;
khôi phục → **15/15 xanh**.

## 9.3b 🐛 BUG THẬT bắt được LÚC NGHIỆM THU (không phải lúc code)

Bấm **A1** rồi **Dọc** đủ nhanh để React gộp chung một nhịp ⇒ kết quả ra **"A3 dọc"**, mất khổ A1
người dùng vừa chọn, **không báo gì**. Nguyên nhân: `onPaperChange(paper, 'portrait')` gọi trong
`onClick` đọc `paper` từ closure của lần render TRƯỚC.

Vá: dồn về **một** `useEffect` theo `[open, paper, orientation]` — effect luôn thấy cặp giá trị sau
cùng nên không lệch; thêm chốt `lastNotified` để lần chạy đầu sau khi mở **không ghi ngược** giá trị
nơi gọi vừa truyền vào (ghi ngược = làm bẩn Doc, kích autosave mà không ai đổi gì).

Đo lại bằng ĐÚNG thao tác đã lộ bug (2 nút trong một nhịp): `Doc.paperKey='A1'` ·
`paperOrientation='portrait'` · tờ xem trước `aspect-ratio 594/841` · nhãn "A1 · dọc · tờ 1 / 1" ·
dòng kiểm tính lại thành "Tỉ lệ tự động vừa khổ **A1 dọc**". ✅

## 9.4 ✅ VIỆC 4 — nhãn "bản đã port" trong `docs/mocks/README-mocks.md`
Thêm mục **"✅ ĐÃ PORT VÀO APP — cụm IN / GIẤY / XUẤT"** (append-only, không sửa dòng cũ): bảng
4 mock → 4 component, kèm chỗ nào cố ý lệch mock và vì sao, + danh sách token đã vào `globals.css`
để mock sau không khai lại cục bộ. Đây là câu trả lời cho G-M5-03.

## 9.5 Nghiệm thu vòng 2 (N6)

- **Browser thật** `127.0.0.1:3005` → `/projects/<id>/cad` (chặng 2D Kỹ thuật), 1440×900:
  menu **Xuất** → **"Xuất bộ hồ sơ (PDF nhiều tờ)…"** → hộp thoại mở đúng. Cột **Khổ giấy MỞ KHOÁ**
  (khác chặng Trình chiếu). Danh sách kiểm là **số liệu thật của bản vẽ đang mở**, không phải mock:
  `! Bản vẽ trống — chưa có gì để xuất` · `✓ Tỉ lệ tự động vừa khổ A3 ngang` ·
  `! 5 layer không có nét nào — nên dọn (PURGE)` · `✓ Mọi nét dày ≥ 0.1mm — in ra thấy được`.
  Dòng "gốc toạ độ" **không xuất hiện** vì bản vẽ trống thì không đo được — đúng thiết kế, đúng test.
- **Đổi khổ giấy → tờ giấy đổi theo + ghi vào Doc thật**: xem §9.3b.
- **Test**: `radial` 15/15 · `lineweight` 5/5 · `export-checks` 10/10 = **30/30**, cả 3 chạy trong
  `npm test` thật (không chỉ chạy tay); mutation test chứng minh ca [C] bắt được bug cũ.
  `npm test` toàn repo còn **đúng 1 fail CŨ đã biết** — `cad-to-obj.test.ts` *"group nội thất mang
  đúng entityId của BlockEntity nguồn"*, đã ghi trong STATUS.md từ trước, **không liên quan việc này**.
- **tsc**: 0 lỗi thuộc làn C (`components/print/*`, `lib/print/*`, `CadSheets.tsx`, `CadEditor.tsx`).
- **Dọn sạch sau verify**: đóng hộp thoại · `setPrintSettings({paperKey:null, paperOrientation:null})`
  đưa Doc về đúng trạng thái trước khi đo · 0 entity nào bị thêm vào dự án.

## 9.6 Va chạm với làn khác — ghi để Hoà biết, KHÔNG đổ lỗi

- `components/library/LibrarySheet.tsx` + `library-sheet-css.ts` (làn library) **vỡ cú pháp nhiều
  lần** trong lúc verify ⇒ build toàn app đỏ, mọi route ra "Build Error". Phải chờ cửa sổ họ lưu
  xong mới verify được. Không đụng file của họ.
- `components/cad/CadEditor.tsx` đang **dirty** (làn DXF sửa vùng `DxfExportCheckpoint`/
  `DxfImportReportPanel`, dòng ~849-1077). Sửa của làn C ở file này **chỉ 2 chỗ, cách xa vùng họ**:
  thêm hàm `doOpenPaperExport` (~dòng 312) + đổi `onSelect` của đúng 1 mục menu (~dòng 600).
- `lib/cad/render-layer-index.test.ts` — lỗi tsc CŨ, không phải việc này.

---

# §10 — ĐÊM 06/08 (vòng 3): L-EXT1 bảng cầu ExternalRef

## 10.0 BƯỚC 0 — grep, dán nguyên

| Lệnh | Kết quả |
|---|---|
| `grep -rna "ExportPdfDialog\|RadialToolMenu" components/ app/` | `ExportPdfDialog` có mặt ở **`components/cad/CadSheets.tsx:69,909`** (chặng 2D) + `present-editor/Toolbar.tsx:56,259` ⇒ **việc 1 ĐÃ XONG từ vòng 2**. `RadialToolMenu` **vẫn chỉ có chính nó** ⇒ việc 2 vẫn hở |
| `grep -rna "lark" prisma/schema.prisma` | **11 dòng**: 40 · 74 · 98 · 319 · 321 · 322 · 331 · 343 · 344 · 378 · 452 |

## 10.1 🔴 ĐÍNH CHÍNH §0v — mốc "10 dòng" SAI, thật là 11

`grep -c "lark" prisma/schema.prisma` = **11**, và `git show HEAD:prisma/schema.prisma | grep -c` cũng
**11** ⇒ **không ai thêm dòng mới**, con số 10 trong §0v đo sai/miscount ngay từ đầu. Không sửa
`00-BAT-DAU-DOC-DAY.md` (§0u: một người ghi) — báo để Hoà sửa mốc.

Bóc chi tiết 11 dòng đó: **8 cột thật** (74 · 319 · 321 · 322 · 343 · 344 · 378 · 452) + **2 dòng
`@@index`** (98 · 331) + **1 trường quan hệ** (40 `larkUserMaps`). Tức **9 khai báo trường**.

⚠️ Thêm một cái bẫy của chính phép kiểm §0v: nó đếm **theo dòng, kể cả comment**. Khối chú thích
đầu tiên tôi viết cho `ExternalRef` có nhắc tên 4 cột cũ ⇒ số vọt **11 → 16** dù **không thêm cột
nào**. Đã viết lại chú thích để không chứa literal tên nhà cung cấp; đo lại: **worktree 11 = HEAD 11**.
⇒ Phép kiểm đúng phải đếm **khai báo trường**, và nó nằm ở `lib/integrations/external-ref.test.ts`.

## 10.2 ✅ Bảng cầu `ExternalRef` (chỉ THÊM)

`prisma/schema.prisma` — model mới ở cuối file, cạnh `LarkUserMap`:
`{ id · system · externalId · entityType · entityId · createdAt · updatedAt }`
+ `@@unique([system, externalId])` + `@@index([entityType, entityId])` + `@@index([system])`.
`npx prisma validate` → **valid**. **KHÔNG xoá cột cũ · KHÔNG migrate dữ liệu · KHÔNG đụng
`lib/integrations/providers/lark.ts`** (§0v tầng ③ đã đúng).

Hàm cầu: `lib/integrations/external-ref.ts` — `findExternalId(core, system)` (xuôi) ·
`findCoreEntity({system, externalId})` (ngược) · `linkExternalRef()` (upsert idempotent theo
`@@unique`). Phần thuần tách sang `external-ref-core.ts` để test chạy bằng sucrase-node.

**Quyết định tự chọn — `system` hạ chữ thường, `externalId` GIỮ NGUYÊN hoa/thường**: tên hệ là do
mình đặt nên gõ kiểu gì cũng phải ra một hệ; còn `externalId` là chuỗi của người ta, nhiều hệ sinh
id phân biệt hoa/thường (`recABC` ≠ `recabc`) — hạ chữ thường là làm hỏng khoá.

## 10.3 🔴 HAI CỬA CHẶN — và một cái bẫy tsc suýt dính

1. `EXTERNAL_REF_TABLE_READY = false` — bảng mới có trong schema, **chưa có trong `dev.db`**. Chặn
   bằng cách **ném lỗi ghi rõ lệnh phải chạy**, không trả `null` im lặng (trả null = nói dối "không
   tìm thấy" trong khi thật ra chưa có bảng). Cùng lối `SPEC_ROOM_COLUMN_READY`.
2. Truy cập qua `externalRefTable()` chứ không `prisma.externalRef` — vì **client chưa generate**:
   đo `grep -c externalRef node_modules/.prisma/client/index.d.ts` = **0** ⇒ viết thẳng là **vỡ tsc
   ngay hôm nay**. Cố ý **KHÔNG chạy `prisma generate`** để chữa: lệnh đó ghi vào
   `node_modules/.prisma` **dùng chung** với các phiên khác đang chạy dev server.

Khác ca `ProductSpec.room/confidence` ở điểm cốt lõi: đó là **thêm CỘT** vào bảng đang dùng nên
Prisma tự SELECT và giết mọi truy vấn của bảng ấy; còn đây là **thêm BẢNG MỚI** — không truy vấn
hiện có nào bị ảnh hưởng, chỉ lời gọi `externalRef.*` mới hỏng, mà hôm nay chưa nơi nào gọi.

## 10.4 ✅ Test chặn hồi quy — 12 ca, có mutation test

`lib/integrations/external-ref.test.ts` (**12/12**):
[A] chặn cột mới mang tên nhà cung cấp (đóng băng **9 khai báo trường**) · bảng cầu không được mang
tên nhà cung cấp · **8 cột cũ phải CÒN** (chặn cả chiều ngược: ai hăng hái dọn sạch mà chưa migrate
là mất mối nối đang chạy) · [B] `ExternalRef` đủ 4 trường + `@@unique` + `@@index` + `system` là
`String` không enum + cờ chặn chưa bị bật ẩu · [C] hàm cầu thuần.

**Chứng minh không phải trang trí** (mutation test): thêm `larkTestColumn String?` vào schema →
test **ĐỎ** với đúng câu *"Đếm được 10 (mốc đóng băng 9)… §0v CẤM"* + chỉ đích danh
`larkTestColumn@452`; khôi phục → **12/12 xanh**.

## 10.5 ⚠️ LỆNH MIGRATE — chủ dự án chạy TRÊN MÁY THẬT

KHÔNG tự chạy (phiên khác đang dùng chung `dev.db`). Chạy khi **không còn dev server nào mở**:

```bash
sqlite3 dev.db ".backup 'dev.db.bak-truoc-externalref'" && npx prisma db push && npx prisma generate
```

Xong thì: đổi `EXTERNAL_REF_TABLE_READY` → `true` (`lib/integrations/external-ref.ts`) **và** sửa ca
test "cửa chặn migrate còn nguyên" cùng lúc. Kiểm bằng **dữ liệu, không bằng lời khai**:
`sqlite3 dev.db ".tables"` phải thấy `ExternalRef`.

> Ghi kèm: `ProductSpec.room/confidence` đã được đẩy từ trước (`SPEC_ROOM_COLUMN_READY = true`,
> client có 30 chỗ nhắc `confidence`) nên lần `db push` này không kéo theo quả mìn cũ.

## 10.6 Việc 1 · 2 · 3 — trạng thái sau vòng 3

| Việc | Trạng thái |
|---|---|
| 1 · Màn 7 vào chặng 2D | ✅ **đã xong ở vòng 2**, vòng này **không đụng lại** — phiếu đêm nay cấm `components/cad`. Verify lại trên **server riêng port 3001** của phiên này (không dùng ké server phiên khác): bấm A1 + Dọc → `Doc.paperKey='A1'`, `paperOrientation='portrait'`, tờ giấy `aspect-ratio 594/841`, dòng kiểm đổi thành "vừa khổ **A1 dọc**". Dọn sạch sau đo (`paperKey` về `null`, 0 entity thêm) |
| 2 · Bảng tròn | 🔴 **VẪN DỪNG** — `RadialToolMenu` vẫn 0 nơi gọi. Hai mặt bút thật đều nằm trong vùng **phiếu đêm nay CẤM ĐỤNG** (`components/cad/CadToolbar.tsx`+`CadCanvas.tsx`) hoặc thuộc làn node (`components/FlowCanvas.tsx`). Cần Hoà chỉ định mặt bút + giao đúng làn giữ nó |
| 3 · Test 3 hàm thuần | ✅ **đã xong ở vòng 2** — 30/30, có mutation test cho ca keyframes. Chạy lại trong `npm test` đêm nay: `radial` 15/15 · `lineweight` 5/5 · `export-checks` 10/10 |

## 10.7 Nghiệm thu vòng 3

- `npx prisma validate` — **valid**.
- `npx tsc --noEmit -p .` — **0 lỗi** thuộc làn C (`lib/integrations/*`, `lib/print/*`,
  `components/print/*`, `prisma/*`). Còn đúng lỗi CŨ `lib/cad/render-layer-index.test.ts`.
- `npm test` toàn repo — 4 file test của làn C: **15 + 5 + 10 + 12 = 42 ca PASS**. Fail duy nhất là
  ca CŨ đã biết `cad-to-obj.test.ts` *"group nội thất mang đúng entityId"*, không liên quan.
- Browser thật `127.0.0.1:3001` (server riêng phiên này, đã tắt sau khi đo).

---

# ĐỢT 07/08 — Thư viện (`components/library/`), phiên CODE riêng, sở hữu DUY NHẤT `components/library/`

Nguồn lệnh: `docs/00-SU-THAT-VA-BO-PHIEU-2026-08-07.md` + `docs/00-CHOT.md` mục "CHỐT 07/08 — Thư
viện: bố cục tấm (phương án A)" + "Bổ sung 07/08 — card rời nghĩa là NỔI LÊN TẠI CHỖ". Không đụng
thư mục nào khác ngoài `components/library/`.

## VIỆC 1 — sửa cách VÀO (ngăn kéo → nổi tại chỗ)

`library-sheet-css.ts:56-65` (khối `.lib`): `transform-origin:50% 50%` (trước `50% 100%`) ·
đóng `translate(-50%,10px) scale(.97)` (trước `translate(-50%, calc(100%+14px+safe-area)) scale(.98)`
— trước đây dịch cả 574px chiều cao tấm, đúng ngôn ngữ ngăn kéo bò từ đáy màn) · mở
`translate(-50%,0) scale(1)` · `200ms cubic-bezier(.32,.72,0,1)` cho cả hai chiều (bỏ
`transition-duration:260ms` riêng lúc mở — chốt chỉ ghi một con số). Chỉ animate `transform`,
không đụng `opacity` (G1 — `.badge` con có `backdrop-filter`).

**Verify browser thật** (`127.0.0.1:3006`, server riêng phiên này `interiorflow-m3`, đăng nhập sẵn
từ phiên trước — không tự nhập mật khẩu, không logout/xoá cookie): đọc `getComputedStyle` trực tiếp
qua `javascript_tool` (chụp ảnh không đủ phân biệt 10px/14%):
- Đóng: `transform: matrix(0.97,0,0,0.97,-360,10)` — đúng `translate(-50%,10px) scale(.97)` ở tấm
  rộng 720px (-50%×720=-360).
- Mở (sau khi transition chạy xong): `transform: matrix(1,0,0,1,-360,0)` — đúng
  `translate(-50%,0) scale(1)`, `getBoundingClientRect()` xác nhận tấm đứng giữa màn
  (`x:360,y:326,720×560`), không còn dấu vết "bò từ đáy".
- `prefers-reduced-motion` block ở cuối file (`library-sheet-css.ts:273-282`) không cần sửa: đã
  dùng `visibility` thay `transform`, đúng nguyên tắc G1 từ trước.

## VIỆC 2 — Phương án A (chốt 07/08)

**Cột kệ 214px** (không phải 186px): `library-sheet-css.ts` — `.shelf{width:214px}` (trước 186px,
chỉ là số port nguyên văn mock CŨ `mock-if-3chang.html`, KHÔNG phải chốt của Hoà — đúng bảng đối
chiếu `M-APPLY-A-OUT.md` §A3.2 dòng 5 "🟢 MOCK — việc của CODE, không phải của mock"). Cập nhật
2 comment còn nhắc "186px" (docblock đầu file + ghi chú media `<640px`) cho khỏi lạc hậu.

**Cột thông số ④ trượt vào từ phải, 180–220ms, không giật/bật cụp** — đây là phần MỚI thật sự,
`.speccol` trước đó (từ A3.3, 06/08) chỉ RENDER/GỠ tức thì theo điều kiện React (`{pickedItem &&
(...)}`), không hề có animation — đúng thứ chốt 07/08 gọi là "bật cụp". Sửa bằng cách tách 2 lớp
(`library-sheet-css.ts:167-186`, `LibrarySheet.tsx:161-176,451-517`):
- `.specwrap` — LUÔN nằm trong DOM khi còn `displayItem` (kể cả đang đóng), animate **width**
  0→236px (không phải `transform`): animate `width` khiến `.libmain` bên cạnh (flex:1) tự co giãn
  ĐÚNG TỪNG KHUNG HÌNH cùng nhịp — transform không đẩy layout anh em, nên lưới thẻ sẽ không "co
  giãn theo" nếu chỉ trượt `.speccol` bằng transform một mình.
- `.speccol` — width CỐ ĐỊNH 236px bên trong wrapper, không co theo wrapper trong lúc animate, nên
  chữ/hàng không bị bóp méo giữa chừng; wrapper hẹp hơn thì `overflow:hidden` chỉ CẮT bớt — đúng
  cảm giác "trượt vào từ phải".
- TSX: state `displayItem` giữ nội dung món cuối cùng sống qua lúc đóng (không gỡ DOM ngay khi
  `pickedItem` về `null` như trước — gỡ ngay thì transition không kịp chạy nửa nào). Gỡ hẳn qua
  `onTransitionEnd` (`e.propertyName==='width' && !specOpen`), không hẹn giờ tay bằng `setTimeout`
  (dễ lệch khi `prefers-reduced-motion` rút `transition-duration` xuống `.1s` toàn cục).

**Verify browser thật** (cùng phiên 3006, "Dự án mẫu", chặng 2D → nút Thư viện ⇧L → kệ "Ký hiệu ·
khối"): bấm 1 khối "Cửa 1 cánh 800" → cột thông số nổi lên bên phải, lưới co từ 3 cột còn 1 cột
(298px, đúng tính toán 720−214−236≈270, khớp bậc thang mô tả trong chốt) · đọc trực tiếp qua JS:
`getComputedStyle(.specwrap).width` = `236px` khi `data-open="true"`. Bấm lại (bỏ chọn) → `data-
open` về `"false"` ngay (React), nhưng `.specwrap` **vẫn còn trong DOM** cho tới khi width chạy
hết — đo được: còn tồn tại ở mốc ~170ms sau click, **đã gỡ hẳn** ở mốc ~570ms (transition 200ms +
dư khoảng cách polling, không phải bug) · sau khi gỡ, lưới trả về đúng 3 cột như ban đầu. Không có
khung hình "biến mất tức thì" nào quan sát được.

`npx tsc --noEmit -p .` — **0 lỗi** trong `components/library/*` (lỗi còn lại của repo là 1 ca CŨ
đã biết `lib/cad/render-layer-index.test.ts`, không liên quan). Không chạy `npm test` riêng vì
`components/library/` không có file `.test.ts` nào sở hữu.

## VIỆC 3 — G-A-04 (Thư viện.dc.html · 4 `dc-import` trỏ file thiếu)

**Đã đóng từ 06/08**, phiên này chỉ xác nhận lại, KHÔNG sửa `docs/mocks/` (ngoài phạm vi sở hữu
`components/library/`). `grep -n "dc-import" "docs/mocks/Thư viện.dc.html"` → 0 kết quả còn sống;
2 dòng comment `[06/08 · gỡ G-A-04]` tại dòng 172 và 289 xác nhận nội dung 2 khối (`KeVatLieu` ·
`CotThongSo`) đã nội hoá thẳng vào file, không còn trỏ ra ngoài. Hai tên `KeDoDac`/`KeDangGom` từng
nhắc ở dòng mô tả đầu file chưa từng có `dc-import`/file thật đi kèm (đã ghi rõ trong chính file,
dòng 54) — không phải hồ sơ rỗng còn sót, là lời hứa suông đã đính chính tại chỗ.

## VIỆC 4 — G-A-05 (mock cãi chốt 05/08)

**Đã đóng phần lớn từ 06/08** (bo góc/kính/dính đáy/lớp phủ — xem `M-APPLY-A-OUT.md` §A3.2 bảng đối
chiếu). Phần còn treo là đúng cột kệ 214 vs 186 — **VIỆC 2 phiên này đã đóng nốt** (code đổi
186→214, khớp mock `Thư viện.dc.html:54` vốn đã ghi 214 từ 06/08). Không còn điểm nào mock và code
lệch nhau về bố cục tấm Thư viện.

## VIỆC 5 — G-A-01 (kho vật liệu thiếu cột thông số)

**Đã đóng từ 06/08** (`lib/library/spec-panel.ts` + `.speccol` trong `LibrarySheet.tsx`, xem
`M-APPLY-A-OUT.md` §A3.3) — phiên này KHÔNG đụng lại nội dung/logic thông số (không chạm
`lib/library/spec-panel.ts`), chỉ nối thêm animation vào-ra ở VIỆC 2. Xác nhận qua browser thật:
món "Cửa 1 cánh 800" hiện đủ khối THÔNG SỐ (hãng/mã/đơn vị/giá/độ nhám/độ bóng), 4/6 dòng hiện "—"
kèm câu lý do ở `.spwhy` (chưa khớp mã với Kho vật liệu) — đúng luật "KHÔNG BỊA SỐ" đã ghi từ trước.

## Quyết định tự chọn trong phiên này

1. Chốt 07/08 chỉ nói "trượt vào từ phải" cho cột thông số, không nói cơ chế kỹ thuật — chọn animate
   `width` của một wrapper thay vì `transform` trên chính `.speccol`, vì chốt còn đòi "lưới co giãn
   theo" — chỉ `width` mới kéo layout flexbox anh em đúng từng khung hình, `transform` thì không.
2. Không dùng `setTimeout` để gỡ DOM sau khi đóng — dùng `onTransitionEnd` để tự đồng bộ với mọi
   tốc độ transition (kể cả khi `prefers-reduced-motion` rút ngắn xuống `.1s`), tránh một class bug
   kinh điển (hẹn giờ tay lệch với CSS thật).
3. Không sửa `docs/mocks/Thư viện.dc.html` dù VIỆC 3/4 nhắc tới nó — ngoài phạm vi sở hữu
   `components/library/` của phiếu này; chỉ xác nhận bằng `grep`/đọc file, không ghi đè.

## File đụng tới

| File | Việc |
|---|---|
| `components/library/library-sheet-css.ts` | VIỆC1 khối `.lib` transform · VIỆC2 `.shelf` 214px + khối `.specwrap`/`.speccol` mới |
| `components/library/LibrarySheet.tsx` | VIỆC2 state `displayItem`/`specOpen` + JSX `.specwrap` bọc `.speccol` |
| `docs/M-APPLY-C-OUT.md` | báo cáo này (append, không sửa đè nội dung cũ) |

**KHÔNG đụng**: `docs/mocks/*` · `lib/library/*` · mọi thư mục ngoài `components/library/`.

---

# ĐỢT 07/08 CHIỀU — Tấm Thư viện nới 960px + Ba nấc cỡ thẻ, phiên CODE riêng

SỞ HỮU đúng 2 file: `components/library/library-sheet-css.ts` · `components/library/LibrarySheet.tsx`.
CẤM chạm: `lib/materials` (p13 đang chạy) · `lib/three` · `lib/cad`. Nguồn lệnh: `00-CHOT.md` mục
"[07/08 chiều — TỔNG quyết] TẤM THƯ VIỆN: NỚI 960px + BA NẤC CỠ THẺ".

## Đo hiện trạng TRƯỚC khi sửa (LUẬT SỐ 0 — không suy từ trí nhớ)
```
library-sheet-css.ts:61   .lib   width:min(720px, calc(100vw - 24px))
library-sheet-css.ts:97   .shelf width:214px
library-sheet-css.ts:134  .grid  padding:12px 14px 16px
library-sheet-css.ts:135  .grid  grid-template-columns:repeat(auto-fill,minmax(122px,1fr))
```
Khớp đúng bảng đo trong ticket — không có gì lệch cần báo trước khi sửa.

## VIỆC 1 — Nới tấm 720 → 960px
`library-sheet-css.ts:66` (số dòng SAU khi sửa — trước sửa là :61 như đo ở trên):
`width:min(960px, calc(100vw - 24px))`. Giữ nguyên `min(…, 100vw-24px)` và `height:min(560px,74vh)`
— đúng yêu cầu "KHÔNG đụng". Verify browser thật (xem mục Verify): `getBoundingClientRect().width`
của `.lib` = **960** đúng số.

## VIỆC 2 — Ba nấc cỡ thẻ, bấm chọn, NHỚ lựa chọn
**CSS** (`library-sheet-css.ts:146-186`): biến `--lib-card-min`/`--lib-th-h` trên `.if-lib-root`,
đổi qua `data-card-size="sm|md|lg"`:
| Nấc | `--lib-card-min` | `--lib-th-h` (ảnh xem trước, tỉ lệ ~16:9) |
|---|---|---|
| Nhỏ | 122px | 69px |
| Vừa (mặc định) | 168px | 95px |
| Lớn | 232px | 131px |

`.grid` đổi `grid-template-columns:repeat(auto-fill,minmax(var(--lib-card-min),1fr))` (trước hardcode
122px) · `.it .th` đổi `height:var(--lib-th-h)` (trước hardcode 76px) — CÙNG một biến nên đổi nấc
không lệch pha giữa cột lưới và ảnh, đúng lo ngại trong ticket.

**UI chọn nấc**: hàng `.densitybar` MỚI (dồn phải, cùng ngôn ngữ segmented với `.modeseg` có sẵn),
đứng trên `.grid`, dưới `.chips` — KHÔNG nhét chung `.chips` vì `.chips` tự cuộn ngang khi nhiều
phạm vi, nhét chung sẽ đẩy nút cỡ ra ngoài tầm nhìn ở màn hẹp (quyết định tự chọn, ghi ở mục cuối).

**NHỚ lựa chọn**: `localStorage` khoá `if-library-card-size`, **GLOBAL cho cả app** (không tách theo
kệ/chặng — ticket chỉ nói "nhớ lựa chọn", không nói phạm vi nào hẹp hơn).

🔴 **Bug bắt được lúc TỰ VERIFY, đã sửa trong phiên (không phải lỗi cũ)**: bản đầu dùng 2 effect
(effect đọc localStorage lúc mount + effect ghi theo `[cardSize]`) — có RACE THẬT: đổi route
(CAD↔3D, mount lại toàn bộ component) thì effect-ghi chạy CÙNG lượt với effect-đọc, dùng closure
`cardSize` còn là giá trị khởi tạo `'md'` (vì `setCardSize` từ effect-đọc mới chỉ LỊCH, chưa áp),
ghi ĐÈ 'md' lên đúng lúc vừa đọc được 'lg' — chọn "Lớn" rồi đổi chặng là mất lựa chọn.
Đo được bằng cách chọn "Lớn" → đổi qua Thiết kế 2D → mở lại Thư viện → cỡ tụt về "Vừa"
(`localStorage.getItem('if-library-card-size')` trả `"md"` dù vừa chọn `'lg'`).
**Sửa**: bỏ hẳn effect-đọc, thay bằng LAZY INITIALIZER trong `useState` (đọc localStorage đúng 1
lần lúc khởi tạo state, trước mọi effect) — `LibrarySheet.tsx:126-142`. Verify lại: chọn "Lớn" →
đổi qua Thiết kế 2D (remount thật, có màn "Đang mở…") → mở lại Thư viện → `data-card-size="lg"`,
`localStorage` = `"lg"`. Đúng.

## VIỆC 3 (bổ sung, không có trong bảng chốt gốc nhưng chốt có câu "③ Nấc LỚN hiện thêm w×d×h")
Thêm hàm thuần `formatDims()` (`LibrarySheet.tsx:74-78`) + tra `matchSpec(it.code, specs)` CHỈ khi
`cardSize==='lg'` (tránh dò vô ích ở nấc khác) — render dòng `.dim` dưới mã món, **im lặng bỏ dòng**
nếu cả 3 kích thước đều thiếu (không hiện "—×—×—" — khác `.speccol` là bảng CÓ NHÃN cho 1 món đang
xem kỹ, đây là dòng phụ trên hàng chục thẻ, thiếu vẫn còn số khác đáng hiện hơn gạch ngang). Mở
rộng type state `specs` thêm `w`/`d`/`hUp` (`LibrarySheet.tsx:204`) — 3 trường này **API `GET
/api/specs` đã trả sẵn** (`lib/server/specs.ts` `specToDto`, đọc-only, KHÔNG sửa `lib/`), chỉ chưa
được bắt ở phía component.

## Verify browser thật (LUẬT SỐ 0 — đo, không suy luận)
Server riêng phiên này: `interiorflow-verify` (config `.claude/launch.json`, autoPort → cổng thật
`53106`, KHÔNG đụng cổng 3000-3002/3005/3006 của các phiên khác). Đăng nhập sẵn từ cookie có trước,
không tự nhập mật khẩu. "Dự án mẫu", chặng Thiết kế 3D → nút "Thư viện — L" / CTA "Mở Thư viện khối".

- `getBoundingClientRect()` qua `javascript_tool`: `.lib` width = **960** · `.shelf` width = **214**
  · `data-card-size` mặc định = **"md"**.
- Bấm "Lớn": `.it .th` computed height = **131px** (đúng `--lib-th-h` nấc lg) · lưới đổi từ 4 cột
  (md) xuống còn 2 cột thực đo (`grid-template-columns` trả `"352.5px 352.5px"`) — ÍT hơn con số 3
  cột lý thuyết trong bảng chốt vì bảng chốt tính `960−214−28=718` chưa trừ 2px viền NGOÀI của
  chính `.lib` (`border:1px` × 2 cạnh, box-sizing:border-box) → không gian lưới thật ≈716px, thiếu
  2px để đủ 3×232+2×11=718. Không phải bug — `minmax(232px,1fr)` co giãn đúng luật CSS grid
  `auto-fill`, chỉ là số cột cuối lệch 1 so với tính tay gần đúng của ticket; card "Lớn" vẫn to rõ
  rệt hơn "Vừa" (131px vs 95px thumbnail), đúng tinh thần yêu cầu.
- Kệ "Vật liệu ATLAS" ở nấc Lớn: `.dim` render **0 dòng** (đúng — 0 mã món demo trên kệ khớp `sku`
  thật trong `/api/specs`, cùng tình trạng đã ghi ở VIỆC 3 apply-A "0 demo shelf item matches a code
  in the warehouse yet"). Gọi trực tiếp `GET /api/specs` xác nhận API CÓ trả `w`/`d`/`hUp` thật (vd
  `sku:"HP-LUX-1400", w:1400, d:700, hUp:750`) — logic tra cứu đúng, chỉ đơn giản chưa có dữ liệu
  demo nào khớp mã để hiển thị, không phải lỗi.
- Ba nấc bấm được, đổi lưới+ảnh ngay lập tức, không lỗi console mới.

`npx tsc --noEmit -p .` — **0 lỗi** trong `components/library/*` (lỗi còn lại của repo là đúng 1 ca
CŨ đã biết `lib/cad/render-layer-index.test.ts`, không liên quan, không do phiên này gây ra — đối
chiếu bằng `grep` nội dung lỗi khớp y hệt báo cáo đợt trước).

## Quyết định tự chọn trong phiên này
1. `.densitybar` là hàng RIÊNG, không nhét vào `.chips` — lý do kỹ thuật (chips tự cuộn ngang) đã
   nêu ở VIỆC 2, ghi rõ để phiên sau đừng "gộp cho gọn" rồi phá mất khả năng thấy nút ở màn hẹp.
2. `if-library-card-size` lưu **global**, không tách theo kệ/chặng — chưa có chốt nói ngược lại.
3. Tự thêm VIỆC 3 (w×d×h nấc Lớn) dù bảng chốt chính (VIỆC 1+2) không liệt số thứ tự riêng — câu
   "③ Nấc LỚN hiện thêm w×d×h" nằm ngay trong đoạn `00-CHOT.md` được giao đọc trước, xử lý luôn
   trong một phiên thay vì để trống rồi phải mở lại file.
4. Phát hiện + tự sửa race localStorage — không phải yêu cầu gốc, nhưng nếu để nguyên thì tính năng
   "NHỚ lựa chọn" (yêu cầu tường minh của chốt) SAI ngay từ lần dùng thật đầu tiên (đổi chặng là
   điều người dùng làm liên tục). Không hỏi lại vì đây là sửa lỗi bên trong tính năng đang làm,
   không phải mở rộng phạm vi.

## File đụng tới
| File | Việc |
|---|---|
| `components/library/library-sheet-css.ts` | VIỆC1 `.lib` width 960 · VIỆC2 biến `--lib-card-min`/`--lib-th-h` + `.densitybar`/`.sizeseg` + `.grid`/`.it .th` đổi sang biến + `.it .mt .dim` |
| `components/library/LibrarySheet.tsx` | VIỆC2 state `cardSize` (lazy init + effect ghi) + UI 3 nút nấc · VIỆC3 `formatDims()` + mở rộng type `specs` + render `.dim` |
| `docs/M-APPLY-C-OUT.md` | báo cáo này (append) |

**KHÔNG đụng**: `lib/materials/*` · `lib/three/*` · `lib/cad/*` · `docs/mocks/*` · `lib/library/*`.
