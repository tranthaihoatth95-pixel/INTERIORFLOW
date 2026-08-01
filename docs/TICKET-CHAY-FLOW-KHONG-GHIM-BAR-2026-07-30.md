# "Chạy flow" ghim cứng trên bar — Hoà đúng, và code chứng minh nó còn tệ hơn Hoà nghĩ

> Hoà: *"nút chạy flow ở chặng 2 ghim cứng trên thanh bar thực ra cũng ko đúng lắm với đặc tính làm
> việc của designer."*
>
> **Đúng.** Và khi đọc code thì phát hiện: nút này **hiện đang nói dối người dùng** — bấm khi không có
> gì thay đổi thì nó nhấp nháy như đã làm việc, nhưng thực ra không chạy gì và **không nói một câu nào**.
>
> Tin tốt: **mọi thứ cần để sửa đã có sẵn trong `lib/execution.ts`.** Đây là việc nối dây, không phải
> xây mới.

---

## 1 · Đọc ảnh — hai lớp

### Lớp 1 · Ảnh có gì

Một mảnh headbar phóng rất lớn. Trái: menu **`Tệp`** — pill, nền sáng, viền hairline, có chevron ⌄.
Giữa: **`Chạy flow`** — pill **tô đặc màu tím-lam đậm**, chữ trắng, trong ảnh không thấy icon.
Phải: một pill bị cắt, chỉ còn `Việ…` (menu ngôn ngữ). Dưới bar: một **hairline ấm** (vạch tint chặng)
rồi tới nền canvas xám nhạt.

### Lớp 2 · Điều ảnh nói ra

Ở mức phóng này thấy rõ một điều: **`Chạy flow` là phần tử DUY NHẤT được tô đặc trong cả thanh bar.**
Mọi thứ khác là pill viền mảnh. Trong ngôn ngữ thị giác, **tô đặc = quan trọng nhất**.

→ Thanh bar đang tuyên bố: *"việc quan trọng nhất trong app này là BẤM CHẠY."*

Nhưng ở chặng 2, việc quan trọng nhất là **cái ảnh**. Nút Chạy đang thắng chính sản phẩm.

⚠️ **Và tôi phải nói rõ để không lặp lại lỗi cũ của mình: màu tím này KHÔNG sai.**
`app/globals.css:19` — `--accent: #6a57f5` là **accent chính thức, chốt 27/07**, kèm cả phần sửa
tương phản có ghi chép tử tế:

> *"Trước là `#8b7cf7` nhưng chữ trắng trên nền accent chỉ đạt **3.32:1** (dưới WCAG AA 4.5:1) — hạ
> độ sáng HSL 72.7%→65% (giữ nguyên hue/saturation 247°/88.5%) → **4.89:1**."*

Đó là làm việc đúng nghề. **Vấn đề không phải hue, mà là TRỌNG LƯỢNG và VỊ TRÍ.**

---

## 2 · 🔴 Lỗi thật trong code: nút đang nói dối

`lib/execution.ts:92-94`:

```ts
// Cache theo input-hash: không đổi thì không chạy lại, không trừ credit
if (node.data.run.status === 'done' && node.data.run.inputHash === hash) return true;
```

`components/studio/AppChrome.tsx:161`:

```tsx
disabled={isRunningFlow}
```

Ghép hai dòng lại:

| | Thực tế |
|---|---|
| Trạng thái disabled duy nhất | `isRunningFlow` — *đang chạy* |
| Khi **không có gì thay đổi** | nút **vẫn sáng, vẫn bấm được, vẫn tô đặc** |
| Bấm vào thì | mọi node `return true` ngay → spinner nhấp một cái → xong |
| App nói gì | **không nói gì cả** |

→ Designer bấm, thấy nhấp nháy, ảnh không đổi, và **không biết là "không có gì để chạy" hay "chạy rồi
mà ra y hệt" hay "hỏng"**. Ba nghĩa hoàn toàn khác nhau, cùng một biểu hiện.

**Đây chính là "không đúng với đặc tính làm việc của designer" mà Hoà cảm nhận được.** Nghề này sống
bằng vòng **nhìn → sửa → nhìn**; một nút không cho biết *"đã có gì thay đổi chưa"* là cắt đúng chữ
**nhìn** đầu tiên.

---

## 3 · 🟢 Mọi thứ để sửa đã có sẵn — bốn mảnh

| Cần | Đã có ở đâu | Ghi chú |
|---|---|---|
| Biết **có gì thay đổi hay không** | `execution.ts:92-94` `inputHash` | ✅ đã tính rồi, chỉ **chưa hiện ra** |
| **Chạy một node** | `execution.ts:185` `export async function runNode(nodeId)` | ✅ đã export |
| **Giá trước khi chạy** | `execution.ts:102` `creditCost: def.creditCost` | ✅ mỗi node đã khai giá |
| **Node 0 credit, tất định** | `render-v2.ts:231-237` `three.cad2fbx` (*"0 credit, 100% tất định"*), các node `slide.*` client-side | ✅ đã phân loại sẵn |

→ Không phải viết engine mới. **Bốn quyết định UI, dùng lại bốn thứ đã có.**

---

## 4 · Tiền lệ nghề — vì sao "Run ghim trên bar" là mô hình của LẬP TRÌNH VIÊN

| Sản phẩm | Cơ chế | Bài học |
|---|---|---|
| **Xcode · VS Code** | ▶ Run **ghim cứng trên chrome** | ⬅️ **đây là mô hình IF đang copy.** Đúng với dev: viết → build → chạy, ba pha rời nhau |
| **Figma** | **không có Run** | Mọi thứ sống. Designer không "chạy" thiết kế |
| **Blender · Houdini · Substance** | node rẻ **tự cook**; node đắt có nút **bake riêng từng node**; render là **hành động tách biệt** (F12, mở cửa sổ riêng) | ⬅️ **đúng mô hình cho IF**: rẻ thì sống, đắt thì phải xin phép |
| **ComfyUI** (gần IF nhất — node + ảnh AI) | **`Queue Prompt`** nổi cạnh canvas, **có số đếm hàng đợi**. Không phải "Run", mà "xếp hàng" | Người dùng ComfyUI làm y hệt Hoà mô tả: sửa 1 node → xếp lại. **Không bao giờ chạy cả graph** |
| **After Effects · DaVinci Fusion** | **Render Queue** — thêm vào hàng rồi mới render | Tách **"tôi muốn cái này"** khỏi **"làm ngay bây giờ"** |

**Kết luận nghề: node-based tools KHÔNG ghim Run trên chrome.** Chúng để hành động **cạnh canvas**,
**theo phạm vi đang chọn**, và **có số đếm**.

---

## 5 · Đề xuất — sáu quyết định

### ① Rời khỏi headbar → **pill nổi trên canvas**

IF **đã có đúng pattern này ở chặng 1**: `components/cad/CadToolbar.tsx` — *"Thanh công cụ NỔI dạng
pill… liquid-glass"*.

→ Chặng 1 để công cụ nổi cạnh canvas, chặng 2 ghim vào chrome. **Đó là hai luật trái nhau trong cùng
một app.** Dời `Chạy flow` xuống pill nổi (đáy-giữa canvas) là **thống nhất lại**, không phải phát minh.

### 🎁 Và nó sửa luôn một phần `7.3.31`

`AppChrome.tsx:157` — `{active === 'render' && (…)}`. Nút này **chỉ tồn tại ở chặng 2**, nhưng lại nằm
trong thanh bar **xuyên suốt 3 chặng**. Nên mỗi lần đổi chặng, bar **buộc phải reflow**.

`AppChrome.tsx:124` còn ghi rõ hậu quả: *"Cụm giữa — co lại/cắt TRƯỚC tiên khi hẹp (2.2.60), để cụm
phải (Chạy flow/Home/…)"* → **nút này đang bóp méo cả logic layout của bar.**

→ Dời nó ra khỏi bar thì **bar bớt một phần tử có/không theo chặng** — đúng hướng "thống nhất headbar"
Hoà yêu cầu. Hai việc, một mũi.

### ② Động từ đi theo VÙNG ĐANG CHỌN

| Đang chọn | Nút thành |
|---|---|
| không chọn gì | `Kết xuất phần chưa xong · 4 node` |
| 1 node | `Kết xuất node này` |
| nhiều node | `Kết xuất 4 node đã chọn` |
| node đã xong, tham số **chưa đổi** | **ghost + mờ** — xem ④ |

`runNode()` đã export → đây là việc nối dây.

### ③ Hiện GIÁ trước khi làm

```
Kết xuất · 4 node · ~8 credit
```

`def.creditCost` đã khai sẵn cho từng node. **Nói giá trước khi tiêu tiền là điều tôn trọng nhất có
thể làm với người làm nghề** — và nó chặn luôn cú "chạy cả graph" vô tình đốt credit.

### ④ ⭐ Vỏ nút CHÍNH LÀ tín hiệu trạng thái

Đây là quyết định giá trị nhất trong cả ticket, và **rẻ nhất**:

| Có node cần chạy? | Nút hiện thế nào | Nghĩa |
|---|---|---|
| **Có** | **tô đặc `--accent`** + số đếm | *"có việc chưa làm"* |
| **Không** (mọi `inputHash` khớp) | **ghost**: viền `--accent-ring`, nền `--accent-soft`, chữ accent + nhãn `Đã cập nhật` | *"mọi thứ đang đúng"* |
| Đang chạy | spinner + `3/4` | *"đang tới đâu"* |

→ Nút thôi làm **cái để bấm**, thành **cái để ĐỌC**. Designer nhìn một lượt là biết bản của mình còn
lệch hay đã đúng — **đúng pha "nhìn"** trong vòng nhìn → sửa → nhìn.

Và nó dùng `--accent-soft` / `--accent-ring` **đã có sẵn trong token**, không thêm màu nào.

⚠️ Kèm điều kiện bắt buộc: **cấm bấm-mà-im lặng.** Nếu vì lý do gì vẫn bấm khi không có gì đổi thì
phải hiện một dòng: *"Không có gì thay đổi — 4 node đã ở bản mới nhất."*

### ⑤ Node rẻ thì **TỰ CHẠY**, đừng chờ bấm

| Loại node | Cơ chế |
|---|---|
| `creditCost === 0` + tất định (`three.cad2fbx`, `slide.*` client-side) | **tự chạy khi input đổi**, có debounce ~300 ms |
| `creditCost > 0` (gọi provider AI) | **bắt buộc chờ hành động tường minh** |

Đây đúng mô hình Blender/Houdini, và nó làm chặng 2 **cảm giác sống** mà không tốn thêm một đồng.

### ⑥ Trọng lượng thị giác: canvas là chủ, nút là tớ

Giữ `--accent` (token chính thức, tương phản đã kiểm). Nhưng:

- **Không phải phần tử tô đặc duy nhất trên màn hình** — vì đã rời xuống canvas nên nó cạnh tranh với
  ảnh, không cạnh tranh với `Tệp`
- Ở trạng thái **`Đã cập nhật`** thì là ghost → **phần lớn thời gian làm việc, màn hình không có khối
  màu đặc nào** ⟶ mắt được yên để nhìn ảnh
- Giữ icon `Play` 13px đã có; thêm số đếm bên phải

---

## 6 · Cái tôi KHÔNG đề xuất

| ⛔ | Vì sao |
|---|---|
| Bỏ hẳn hành động chạy, làm live hết | Node AI tốn tiền và tốn 10–60 s. Live hết = đốt credit khi kéo slider |
| Thêm một Render Queue riêng (kiểu AE) | IF **đã có** panel `Tasks` + `AiStatusDot` trên bar. Làm queue nữa là mặt thứ hai — Luật #6 |
| Đổi màu accent | Token chính thức, đã có ghi chép WCAG. **Đừng chạm.** Lần trước tôi đã nói sai một lần về màu, không lặp lại |

---

## 7 · Lệnh dán cho Claude Code

```
Đọc docs/TICKET-CHAY-FLOW-KHONG-GHIM-BAR-2026-07-30.md toàn văn.
Việc: dời "Chạy flow" khỏi headbar + biến nó thành nút BIẾT TRẠNG THÁI.
Liên quan trực tiếp 7.3.31 (thống nhất headbar) — làm cùng lúc thì đỡ sửa 2 lần.

BỐI CẢNH CODE (đã xác minh, đừng khám lại):
- components/studio/AppChrome.tsx:156-168 = nút hiện tại, {active === 'render' && ...}
- AppChrome.tsx:124 comment 2.2.60 xác nhận nút này đang bóp méo logic co bar
- lib/execution.ts:92-94 = cache inputHash (ĐÃ biết có gì đổi hay không)
- lib/execution.ts:102 = def.creditCost (ĐÃ có giá mỗi node)
- lib/execution.ts:185 = export runNode(nodeId) (ĐÃ có chạy 1 node)
- components/cad/CadToolbar.tsx = pattern pill NỔI liquid-glass của chặng 1 → DÙNG LẠI

LÀM:
1) Bỏ nút khỏi AppChrome. Dựng lại thành pill NỔI đáy-giữa canvas chặng 2,
   theo đúng pattern CadToolbar (liquid-glass). KHÔNG tạo component overlay mới
   nếu CadToolbar tách được phần vỏ dùng chung.
2) Nhãn theo vùng chọn:
   không chọn → "Kết xuất phần chưa xong · N node"
   1 node     → "Kết xuất node này"
   n node     → "Kết xuất N node đã chọn"
   Dùng runNode() cho trường hợp chọn; runFlow() cho trường hợp không chọn.
3) Hiện giá: "· ~N credit" tính từ tổng def.creditCost các node SẼ chạy
   (bỏ qua node có inputHash khớp — không tính tiền node sẽ bị skip).
4) ⭐ VỎ NÚT = TÍN HIỆU (việc giá trị nhất):
   có node cần chạy  → tô đặc var(--accent-strong) + số đếm
   không có          → GHOST: nền var(--accent-soft), viền var(--accent-ring),
                       chữ accent, nhãn "Đã cập nhật"
   đang chạy         → spinner + "3/4"
   KHÔNG thêm màu mới. Chỉ dùng --accent / --accent-soft / --accent-ring đã có.
5) CẤM bấm-mà-im-lặng: nếu vẫn bấm khi mọi inputHash khớp, hiện toast
   "Không có gì thay đổi — N node đã ở bản mới nhất."
   Hiện tại execution.ts:94 return true âm thầm → đây là lỗi UX thật.
6) Node creditCost === 0 và tất định (three.cad2fbx, slide.* client-side):
   TỰ CHẠY khi input đổi, debounce 300ms. Node creditCost > 0: giữ nguyên,
   phải có hành động tường minh.

KHÔNG LÀM:
- KHÔNG đổi --accent (token chính thức 27/07, có ghi chép WCAG 4.89:1)
- KHÔNG thêm Render Queue mới (đã có panel Tasks + AiStatusDot)
- KHÔNG làm node AI chạy live

Xếp gia phả + cấp mã theo Luật #8b (khối 2.2.x — chặng Rendering).
Báo mã đề xuất, đợi xác nhận không trùng, rồi mới code.
```

---

*Cowork, 30/07/2026. Đọc code thật: `components/studio/AppChrome.tsx:18-24,124,150-168`,
`lib/execution.ts:26,75,92-94,102,108-135,151,158-170,185`, `app/globals.css:14-26`,
`lib/nodes/render-v2.ts:231-237`, `lib/demos/_shared.ts:5,100`, `lib/store.ts:831,857`,
`components/cad/CadToolbar.tsx`. Tiền lệ: ComfyUI Queue Prompt · Blender/Houdini cook-vs-bake ·
AE/Fusion Render Queue · Figma (không có Run) · Xcode/VS Code (Run ghim chrome).*
