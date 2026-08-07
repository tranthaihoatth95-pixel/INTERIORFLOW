# M-VO-H1-OUT — vá 4 loại lỗi ở nodes · present-editor · FlowCanvas

Phiên: **H1**. Vùng sở hữu: `components/nodes/` · `components/present-editor/` · `components/FlowCanvas.tsx`
(+ 4 file `lib/` trung lập cần đụng để sửa tận gốc — không thuộc `components/studio/`, `components/notebook/`,
`components/photo-editor/`, không vi phạm ranh giới đã giao). **V6 — KHÔNG COMMIT**, chỉ sửa file + báo cáo.

⚠️ **Trước khi đọc diff:** `git status` đầu phiên đã cho thấy RẤT NHIỀU file trong đúng vùng sở hữu này
(`app/globals.css`, `components/nodes/*`, `components/present-editor/*`, `lib/nodes/defs/*`, `lib/types.ts`…)
**đã dirty từ trước khi phiên này mở** (việc của phiên khác, đúng bệnh "hai phiên chung `.git`" đã ghi nhiều lần
trong `STATUS.md`). Giữa phiên còn thấy 2 file MỚI xuất hiện không do tôi tạo:
`lib/nodes/edge-validity.ts` + `lib/nodes/edge-validity.test.ts` (untracked, phiên khác đang ghi song song).
⇒ Bảng dưới đây chỉ liệt **ĐÚNG những đoạn tôi tự tay sửa**, KHÔNG phải toàn bộ diff của file (file đã có sẵn
thay đổi của người khác lẫn vào). Không đụng, không đọc kỹ 2 file `edge-validity.*` mới — ngoài phạm vi việc.

---

## ① NUỐT LỖI IM LẶNG

### G-M13-01 (dòng 101) — present-editor: đã sửa từ trước, không còn việc trong vùng của tôi
Đọc đúng dòng 101 `docs/GAP-IF.md` trước khi làm (đúng yêu cầu, không đoán từ mã): sổ tự ghi
*"🟡 RÀ 07/08 15:5x — p4 sửa phần `PresentEditor.tsx:263,268` + `ToolModeForm.tsx:570`"*.
Đọc trực tiếp `components/present-editor/PresentEditor.tsx:259-288` xác nhận: `fetch('/api/library')`
đã nằm trong `try{...}catch{/* thư viện trống hoặc chưa đăng nhập */}finally{setLibLoading(false)}`
đầy đủ — không phải nuốt lỗi rỗng, có lý do tại chỗ + có trạng thái chờ tắt đúng lúc. **Không sửa gì
thêm ở đây** — phần còn lại của G-M13-01 (`useNotebook.ts`, `LoginBackdrop.tsx`) thuộc mảng
`components/notebook/` và `components/entry/`, **ngoài vùng sở hữu**, không đụng.

### G-M20-02 (dòng 126) — `components/present-editor/boq/BoqScreen.tsx`
**TRƯỚC** (dòng ~127-134):
```ts
useEffect(() => {
  let alive = true;
  fetch('/api/specs')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => { if (alive && data?.specs) setSpecExtra(buildBoqSpecExtraMap(data.specs)); })
    .catch(() => {});
  return () => { alive = false; };
}, []);
```
**SAU:**
```ts
useEffect(() => {
  let alive = true;
  fetch('/api/specs')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => { if (alive && data?.specs) setSpecExtra(buildBoqSpecExtraMap(data.specs)); })
    .catch((err) => {
      // Cột Quy cách/Đơn vị/Ảnh chỉ là JOIN hiển thị phụ — không chặn bảng BOQ chính khi hỏng,
      // nhưng KHÔNG được nuốt lỗi im lặng (luật G-M20-02): ghi log kèm lý do.
      console.warn('[BoqScreen] Không tải được /api/specs — cột Quy cách/Đơn vị/Ảnh sẽ trống:', err);
    });
  return () => { alive = false; };
}, []);
```
Quyết định: **log kèm lý do**, không dựng banner lỗi mới cho dữ liệu JOIN phụ (bảng BOQ chính vẫn
chạy đủ nếu thiếu 3 cột này) — đúng nhánh "HOẶC ghi log kèm lý do" trong đề bài, không tự chế UI mới
khi chưa có mock cho trạng thái lỗi riêng của 3 cột phụ này (luật "mock là hợp đồng").

### G-M20-06 (dòng 130) — `lib/lockscreen.ts` (`lockScreenNow`, tagged "(studio)" trong sổ nhưng
file nằm ở `lib/`, không phải `components/studio/` — không vi phạm vùng cấm)
**TRƯỚC:**
```ts
export function lockScreenNow(): void {
  window.dispatchEvent(new CustomEvent('cad:force-save-request'));
  window.dispatchEvent(new CustomEvent('present:force-save-request'));
  window.setTimeout(() => useLockScreen.getState().lock(), 200);
}
```
**SAU** (rút gọn, xem file thật để đọc đủ docstring giải thích):
```ts
const FORCE_SAVE_MAX_WAIT_MS = 2000;

export function lockScreenNow(): void {
  window.dispatchEvent(new CustomEvent('cad:force-save-request'));
  window.dispatchEvent(new CustomEvent('present:force-save-request'));

  if (useSaveStatus.getState().status !== 'saving') {
    useLockScreen.getState().lock();
    return;
  }
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(safety);
    unsubscribe();
    useLockScreen.getState().lock();
  };
  const unsubscribe = useSaveStatus.subscribe((s) => { if (s.status !== 'saving') finish(); });
  const safety = window.setTimeout(finish, FORCE_SAVE_MAX_WAIT_MS);
}
```
**Vì sao đúng, không phải đoán:** đọc `lib/save-status.ts` + `lib/sheets-persist.ts` trước khi sửa —
`useSaveStatus` là trạng thái CHUNG mà CẢ CAD (`CadSheets.tsx:480`) lẫn Present (`PresentSheets.tsx:371`)
đã ghi vào qua `onSavingChange` TỪ TRƯỚC (không dựng cơ chế theo dõi mới, không đụng
`components/cad/CadSheets.tsx` dù ngoài vùng sở hữu). 200ms cố định → đợi tín hiệu thật, có trần an
toàn 2000ms phòng autosave kẹt/không mount. Không có gì đang lưu (ca phổ biến) ⇒ khoá gần như ngay.

### G-M20-07 (dòng 131) — `lib/nodes/defs/metrology.ts`
**TRƯỚC** (dòng ~139-150):
```ts
const result = measureObjectTiered({ category, silhouette, image: rgba, cameraHeightMm, knownWidthMm, manualAnchor });
onProgress(1);
```
(giữa `onProgress(0.5)` dòng 124 và `onProgress(1)` dòng cuối — không có mốc tiến độ nào khi
`measureObjectTiered` chạy, và hàm này chạy đồng bộ, chặn luồng JS nên UI không kịp vẽ lại.)

**SAU:**
```ts
onProgress(0.7);
await new Promise((resolve) => setTimeout(resolve, 0)); // nhường 1 tick cho trình duyệt vẽ tiến độ
const result = measureObjectTiered({ category, silhouette, image: rgba, cameraHeightMm, knownWidthMm, manualAnchor });
onProgress(1);
```

---

## ② NÚT KHÔNG KHOÁ KHI ĐANG CHẠY

### G-M20-04 (dòng 128) — `components/nodes/MacroNodeFace.tsx`
**TRƯỚC:**
```tsx
const run = async () => {
  const terminals = terminalNodeIds(group.nodeIds, edges);
  for (const id of terminals) { await runNode(id); }
  bumpGroupUsage(group.id);
};
...
<button type="button" onClick={run} className="...">
  {tr('Chạy nút tổng', 'Run macro node')}
</button>
```
**SAU:**
```tsx
const run = async () => {
  if (busy) return; // lớp phòng thủ thứ hai cho khoảng hở giữa bấm và re-render `busy`
  try {
    const terminals = terminalNodeIds(group.nodeIds, edges);
    for (const id of terminals) { await runNode(id); }
    bumpGroupUsage(group.id);
  } catch (err) {
    useFlowStore.getState().setConnectError(err instanceof Error ? err.message : String(err));
  }
};
...
<button type="button" onClick={run} disabled={busy} title={busy ? tr('Đang chạy…', 'Running…') : undefined}
  className="... disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[var(--accent)]">
  {busy ? tr('Đang chạy…', 'Running…') : tr('Chạy nút tổng', 'Run macro node')}
</button>
```
`busy` đã có sẵn ở dòng 127-129 (đọc `run.status` của node con) — chỉ còn thiếu nối vào `disabled`
và bắt lỗi đồng bộ (vd `getDefinition` ném lỗi trước khi kịp enqueue → trước đây unhandled rejection,
im lặng, `bumpGroupUsage` không chạy, không ai biết).

**VERIFY BROWSER THẬT** (127.0.0.1:3008, "Dự án mẫu", tự dọn sạch sau khi xong — xem cuối file):
tạo macro thật bằng "Gom thành nút tổng" (2 node con: Sketch→Ảnh thật + Tách nội thất), bấm "Chạy nút
tổng" thật (`target.click()` qua DOM, không phải suy đoán) → macro chạy xuyên upstream tới node
"Vẽ tay tự do", trả lỗi nghiệp vụ thật ("Chưa vẽ gì — bấm 'Vẽ tay'…") hiện NGAY TRÊN node lỗi (không
nuốt) · quầy đếm "Đã dùng 0 lần" → "Đã dùng 1 lần" (`bumpGroupUsage` chạy đúng, catch KHÔNG bị kích
hoạt vì đây là lỗi nghiệp vụ hợp lệ do execution engine tự xử lý per-node, không phải lỗi đồng bộ) ·
0 lỗi console (ngoài 404 `/api/cursors` có sẵn từ trước, không liên quan — tính năng con trỏ nhiều
người chưa cấu hình trong sandbox). **CHƯA bắt được ảnh chụp đúng khoảnh khắc `disabled` (chạy quá
nhanh do lỗi validate tức thời, không có network thật để làm chậm)** — xác nhận gián tiếp qua: nút
không bị kẹt "Đang chạy…" mãi sau khi xong (đúng hành vi mong đợi, không phải bằng chứng hình ảnh
trực tiếp của khung hình giữa chừng).

### G-M20-05 (dòng 129) — `components/nodes/InteriorNode.tsx` (`ParamField`, ảnh input)
**TRƯỚC:** `onChange` gọi `smartImportImage(file)` có try/catch nhưng KHÔNG có state chờ — ảnh
(`<img onClick=...>`) và nút upload vẫn nhận click trong lúc đang decode.
**SAU:** thêm `const [importing, setImporting] = useState(false)` (thêm `useState` vào import dòng 3),
bọc handler bằng `setImporting(true)` trước try, `setImporting(false)` trong `finally`, chặn tái vào
bằng `if (!file || importing) return;`; UI: `<img>` khi đang nạp thì `opacity-50 cursor-not-allowed`
+ overlay `Loader2` spin, click bị chặn (`onClick={() => !importing && fileRef.current?.click()}`);
nút "Upload / drag ảnh" thêm `disabled={importing}` + đổi icon/label thành "Đang nạp…" khi bận.

**Chưa verify tay bằng ảnh chụp đúng khung hình "đang nạp"** (cần file TIFF/PSD/HEIC đủ lớn để decode
chậm hơn khung hình chụp, không có file mẫu sẵn trong sandbox để upload qua hộp thoại OS) — verify
bằng đọc lại code + `tsc` sạch + không phá test nào liên quan. Ghi rõ **CHƯA VERIFY bằng ảnh thật**
cho đúng luật, không giả vờ.

---

## ③ HÀM VIẾT XONG CHƯA NỐI UI

### G-M20-01 (dòng 125) — `lib/present-editor/custom-templates.ts`
Đọc kỹ trước khi quyết xoá-hay-nối (không đoán):

| Hàm | Trạng thái thật (grep -rna toàn repo) | Quyết định |
|---|---|---|
| `renameCustomTemplate` | 0 nơi gọi ngoài định nghĩa; `deleteCustomTemplate` ANH EM đã có UI (nút xoá `ShelfCard onDelete`, `LayoutShelf.tsx:534`) nhưng rename thì chưa | **XOÁ** — nối UI đòi hỏi dựng giao diện đổi tên mới (input/inline-edit), mà **không có mock** cho việc này trong `docs/mocks/` (chốt 02/08: "mock là hợp đồng, phiên code CHỈ PORT, không sáng tác") — dựng bừa là vi phạm luật đó. `window.prompt()` không dùng ở đâu khác trong repo → không phải quy ước sẵn có, thêm vào là lệch phong cách |
| `customTemplatesAsEditorTemplates` | 0 nơi gọi; `LayoutShelf.tsx:531,533` tự gọi `toEditorTemplate(ct)` từng phần tử thay vì dùng hàm gộp này | **XOÁ** — thật sự thừa, có đường tương đương đang sống song song |
| `makeShortDemoDeck` (`lib/present-editor/sample.ts:38`) | 0 nơi gọi ngoài 2 dòng comment | **GIỮ NGUYÊN — KHÔNG PHẢI BUG.** Comment tại chỗ (`sample.ts:7,31`) tự khai đây là tiện ích dev cố ý chưa mở, dẫn `docs/CONTENT-RULES.md §3`. Xoá một tiện ích có tài liệu tham chiếu là làm liều — ghi lại quyết định "giữ" ở đây thay vì im lặng bỏ qua |

`custom-templates.test.ts` (31 test) chạy lại sau khi xoá 2 hàm — **31/31 pass**, không có test nào
tham chiếu 2 hàm đã xoá (đã `grep` xác nhận trước khi xoá).

---

## Không thuộc 4 loại nhưng cùng cụm design-token — G-NB-03 (dòng 119)
`lib/types.ts` `DATA_TYPE_COLORS.text`/`.video` còn hex trần (`#38bdf8`/`#fb7185`), không đổi theo
theme. Thêm token `--p-text`/`--p-video` vào `app/globals.css` (cả khối `:root` tối lẫn
`:root[data-theme='light']`, theo đúng khuôn `--p-img`/`--p-mask` đã có — dark giữ nguyên hex cũ,
light hạ độ sáng giữ hue, đo tay đạt ~5,6:1 và ~5,9:1 trên `--panel`). Đổi 2 dòng trong
`DATA_TYPE_COLORS` sang `var(--p-text)`/`var(--p-video)`.

**VERIFY BROWSER THẬT — đo bằng `getComputedStyle`, không suy đoán từ mắt:**
- Theme sáng: `.react-flow__edge-path` (cạnh kiểu `text`, nối "Nhập prompt"→"Sketch→Ảnh thật") →
  `stroke: rgb(3, 105, 161)` = `#0369a1` ✓ đúng giá trị mới.
- Theme tối (`window.__flowStore.getState().setThemePref('dark')`): cùng cạnh →
  `stroke: rgb(56, 189, 248)` = `#38bdf8` ✓ đúng giữ nguyên hex cũ như tài liệu cam kết.
- Ảnh chụp cả 2 theme đã xem trực tiếp trong phiên (không đính kèm file — theo quy ước không lưu
  ảnh minh hoạ trừ khi được yêu cầu, `CLAUDE.md` "Thói quen làm việc").

---

## ④ KÉO-THẢ LÀ ĐƯỜNG DUY NHẤT (G8)
Không có mã nào trong danh sách 7 việc được giao (G-M13-01, G-M20-01/02/04/05/06/07, G-NB-03) mô tả
lỗi loại này. Đã đọc lại toàn bộ 7 dòng sổ — không dòng nào nhắc kéo-thả. **Không có việc để làm ở
mục ④ trong đợt này** — không tự bịa thêm việc ngoài phiếu (đúng §0q).

---

## N6 — chứng minh có nơi mount / có nơi gọi (sau khi sửa)

```
$ grep -rn "renameCustomTemplate\|customTemplatesAsEditorTemplates" lib components app
(không có kết quả — đã xoá sạch, xác nhận không còn tham chiếu treo)
```
Các hàm/nút còn lại (`lockScreenNow`, `MacroNodeFace` run button, `ParamField` upload, `measureObjectTiered`
progress, `BoqScreen` fetch) đều là SỬA TẠI CHỖ bên trong hàm/component đã có mount từ trước — không
tạo component mới, N6 áp dụng bằng cách xác nhận component cha vẫn đúng nơi mount cũ (không đổi):
- `MacroNodeFace` → mount tại `components/nodes/GroupOverlay.tsx` (khi `group.isMacro && collapsed`) — không đổi.
- `ParamField` → mount trong `InteriorNode.tsx` (chính file) + tái dùng ở `MacroNodeFace.tsx` — không đổi.
- `BoqScreen` → mount tại `app/projects/[id]/present/page.tsx` qua `PresentStageScreen` — không đổi.
- `lockScreenNow` → gọi từ `components/studio/AppChrome.tsx:123,186` (ngoài vùng sở hữu, không đụng, chỉ đọc để xác nhận còn đúng chữ ký hàm `(): void`).

---

## Verify tổng — tsc + test

```
npx tsc --noEmit -p .     → EXIT 0, 0 dòng lỗi
npm test                  → 6300+ dòng "ok", 0 dòng "N fail" (N>0) trong toàn bộ log,
                             riêng lib/present-editor/custom-templates.test.ts: 31 ok, 0 fail
```

## File đã sửa (đúng, đủ — không hơn không kém)
```
lib/present-editor/custom-templates.ts      (xoá 2 hàm chết)
components/present-editor/boq/BoqScreen.tsx (log lỗi thay vì nuốt)
components/nodes/MacroNodeFace.tsx          (try/catch + disabled khi busy)
components/nodes/InteriorNode.tsx           (khoá nút upload lúc decode)
lib/nodes/defs/metrology.ts                 (yield 1 tick trước phép tính nặng)
lib/lockscreen.ts                           (đợi tín hiệu lưu thật thay vì 200ms mù)
lib/types.ts                                (2 dòng màu cổng nối → var())
app/globals.css                             (thêm --p-text/--p-video, 2 theme)
.claude/launch.json                         (thêm cấu hình dev server riêng "interiorflow-h1",
                                              port 3008 — không đụng cấu hình port của phiên khác)
```
**KHÔNG chạy `git add`/`git commit`/`git push`** — đúng V6.

## Dữ liệu test đã dọn
Đã tạo 4 node thật trong canvas "Dự án mẫu" (Vẽ tay tự do · Nhập prompt · Sketch→Ảnh thật · Tách nội
thất, sau đó gộp 2 node thành macro "Nút tổng 1") để verify sống — **đã xoá sạch cả 4 node khỏi canvas
qua `useFlowStore.getState().deleteNode()`** ngay sau khi verify xong, xác nhận lại `nodes.length === 0`.
Riêng **mục "Nút tổng 1" trong sidebar "Nút tổng của tôi" (thư viện macro cá nhân của user demo) chưa
xoá được** — không tìm ra khoá localStorage/API tương ứng trong thời gian phiên, không phải dữ liệu
dự án (không chứa PII/số liệu thật), để lại **CHƯA DỌN, ghi rõ ở đây** thay vì im lặng bỏ qua.

## Hàng đợi cuối lượt (§V7)
- **Đã xong**: 1 → 4 loại lỗi đã sửa đủ 7/7 việc được giao trong phiếu, cộng 1 việc phụ G-NB-03 (cùng cụm màu port, phát hiện lúc đọc `MacroNodeFace.tsx` import `DATA_TYPE_COLORS`).
- **Còn treo**: dọn nốt "Nút tổng 1" trong thư viện macro cá nhân demo user (không tìm ra chỗ lưu trong phiên này) — chờ Hoà hoặc phiên sau có thời gian tra `app/api/` tìm route macro-library.
- **CHƯA VERIFY bằng ảnh chụp trực tiếp**: khung hình "đang nạp ảnh" của `InteriorNode.tsx` (cần file lớn để decode đủ chậm, không có sẵn trong sandbox) và khung hình "đang chạy" của nút macro (lỗi nghiệp vụ trả về quá nhanh, không có network thật làm chậm). Cả hai đã verify bằng code-review + tsc + test, KHÔNG bằng ảnh — khai đúng theo N5, không giả vờ đã chụp được.
- Không có việc nào chờ Hoà quyết định (khác với "còn treo" ở trên — đây là việc phiên sau tự làm được, không cần quyết định của Hoà).
