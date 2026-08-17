# NC · COLLAB CHẶNG 3D — đặt Workspace Thảo Luận vào đâu, nối vào Thẻ DNA thế nào

> Phiên COLLAB-NC · 17/08. Trả lời 5 câu ở phiếu `docs/phieu-giao/COLLAB-NC-MOCK.md`,
> mỗi câu có bằng chứng file:dòng. **NC + MOCK, không code.**

---

## ⓪ TIỀN ĐỀ — XÁC NHẬN, có ĐÍNH CHÍNH quan trọng

**Xác nhận:** năm mảnh mà tiền đề nêu **đều tồn tại** trong repo hôm nay (đo bằng `ls`):

| Mảnh | Đường dẫn | Trạng thái |
|---|---|---|
| Canvas Miro-like | `components/FlowCanvas.tsx` (43 634 byte, 13/08) | sống |
| Sticky note | `components/nodes/NoteNode.tsx:11` (nền `color-mix(--warning 26%, --card)`) | sống |
| Comment neo vào node | `components/nodes/CommentPin.tsx:27` (`Popover` + `useFlowStore.comments`) | sống |
| Form Concept moodboard | `components/form/ConceptForm.tsx` (18 843 byte) | sống |
| Modal "Tạo Moodboard" | `components/MoodboardModal.tsx:41` (bọc `<ConceptForm />`) | sống |
| Engine chưng cất | `lib/distill/engine.ts:35` (generic `distill()`) + `lib/dna/distiller.ts:71` (`distillDnaFromAssets`) | sống |
| Panel Thẻ DNA | `components/dna/DesignDnaCardPanel.tsx` (18 350 byte) | sống |

🔴 **ĐÍNH CHÍNH — không BÁC hoàn toàn, nhưng ghi ra để phiên sau không đọc lệch:**
tiền đề T viết là *"ConceptForm là form khung tư duy đầu tiên (Concept moodboard)"* — **đúng**,
nhưng `components/MoodboardModal.tsx:4` tự khai *"Overlay 'Tạo Moodboard' **cho chặng CONCEPT**"*
và trong `HomeScreen.tsx:692` nó mount ở **home/2D** chứ không phải trong `Render3DModeSkeleton`.
⇒ Nói *"đã có ConceptForm trong chặng 3D"* là **sai**; đúng phải nói *"có ConceptForm ở chặng 2D
concept, sẵn khuôn để mở rộng sang 3D"*. Việc "nối" không phải chỉ vẽ dây UI — còn phải **quyết
định định vị lại**: form khung tư duy là công cụ **xuyên chặng** (đúng luật `matId` xuyên ba
chặng ở IF-KIEN-TRUC §5) hay là **của riêng chặng 3D Collab**.

Tiền đề *"việc chính là NỐI, không phải dựng mới"* — **giữ nguyên**. Không mảnh nào phải viết mới,
chỉ cần: ① mở rộng `ProvenanceInput` để nhận nguồn khác ảnh (xem câu 3) ② dựng vỏ cửa sổ Thảo Luận
(khuôn cửa sổ công cụ đã có ở `components/render-studio/CuaSoCongCu.tsx`) ③ thêm 2 khuôn form nữa.

---

## Câu 1 · Collab đứng đâu trong chặng 3D?

### Ba khả năng, phân tích từng cái

| Khả năng | Vì sao khả dĩ | Vì sao **KHÔNG** chọn |
|---|---|---|
| **(a) Mode thứ ba `Collab`** cạnh Node/3D | `ModeSwitchBar.tsx` mở được — chỉ thêm 1 nút | 🔴 **Phá chốt 13/08**: *"chặng 2 CHỈ 2 môi trường Canvas + Vẽ 3D"* (`00-CHOT.md` mục 13/08 kien-truc-tool-3-lop). Phá luôn *"một bộ lệnh, hai lối thao tác"* — thêm mode thứ ba là thêm **bộ lệnh** thứ ba. `ModeSwitchCell.tsx:32` title tự khai đích của Node là *"Render + Mood + Collab"* — Collab đã được **đặt sẵn TRONG mode Node**, không phải cạnh nó. |
| **(b) TẦNG trên mode Node** — cụ thể là **Cửa Sổ Thảo Luận** trên `FlowCanvas` | Khớp chốt 16/08 (*"cửa sổ THẢO LUẬN"*) · dùng lại khuôn `CuaSoCongCu` đã có · khớp title `Render + Mood + Collab` sẵn có · không đẻ mode | — |
| **(c) Cửa sổ toàn màn mở từ nút riêng trên rail** | Đơn giản hoá — Collab đứng ngoài chặng | 🔴 **Phá `HOP-DONG-CAU-TRUC-DIEU-HUONG.md §6.2`**: *"Sidebar KHÔNG BAO GIỜ đổi nội dung theo chặng"*. Collab CẦN ngữ cảnh dự án + màn 3D đang mở (đề bài, phòng đang dựng, moodboard ăn theo `matId` của scene) — nếu đứng ngoài chặng, mọi liên kết ngữ cảnh phải tự dựng lại **hai lần** (một cho toàn màn, một cho về lại chặng). Đúng ca *"đẻ hai đường vào một thứ"* mà T đã sai một lần với phiếu P-N (16/08). |

### Đề xuất: **(b) — Cửa Sổ Thảo Luận trong mode Node**

Cụ thể là **một loại `CuaSoCongCu` mới** với `moiTruong: 'ban-bac'` (thảo luận), sống trên
`FlowCanvas` cùng với các cửa sổ sản xuất. Khớp đúng khuôn 15/08 `master-tool-cong-dan-canvas`:
cửa sổ = công dân canvas, không phải modal.

Ba lý do đứng vững sau khi phản biện (soi lại theo Đ2 *[TRIET-LY-IF.md:72]* — nhìn vào trong trước):

1. **KHUÔN đã có, chưa dùng.** `CuaSoCongCu.tsx` có sẵn 3 biến thể `noi/neo/toanMan`, kéo bằng
   pointer capture, `NodeResizer` đổi cỡ, bảng khoá không singleton (nhiều cụm cùng lúc). Cửa sổ
   Thảo Luận là **một `moiTruong` mới**, không phải khuôn cửa sổ mới. Cùng đúng đẳng cấu §9 mà `runtime-ai-trong-if` đang chạy.
2. **Định danh đã sẵn.** `ModeSwitchCell.tsx:32` `title="Về Render + Mood + Collab"` — Hoà đã
   đặt tên mode Node là "Render + Mood + Collab" từ 02/08. Ba chữ đó **không phải ba mode**, mà là
   **ba loại cửa sổ trong cùng mode**: Render (sản xuất) · Mood (thảo luận) · Collab (thảo luận
   nhóm). Chọn (b) là **thi hành**, không phải **đặt mới**.
3. **Đầu ra khớp §2** — cửa sổ có ống kính, đầu ra Thẻ DNA cũng "xuyên ba chặng" (như `matId` ở
   `IF-KIEN-TRUC.md:97`). Đặt Collab trong chặng 3D **không có nghĩa** Thẻ DNA chỉ hiển thị ở 3D
   — nó lưu ở dự án, hiện ở cả 2D/3D/Trình chiếu qua panel chung.

---

## Câu 2 · Thư viện form khung tư duy — mấy khuôn ban đầu?

Chọn **BA khuôn**, không mở list dài (đúng luật Đ1 *[TRIET-LY-IF.md:70]* — tầng sau là hệ quả
tầng trước; mở nhiều là **dồn quyết định** thay vì trả lời):

| # | Khuôn | Giải quyết painpoint | Cột dữ liệu | Vì sao XỨNG có |
|---|---|---|---|---|
| **1** | **Moodboard vật liệu / không gian / câu chuyện** (khuôn hiện có) | Tổ chức ảnh tham chiếu → collage + palette | ảnh, tag, palette | Đã có: `ConceptForm.tsx` — mở rộng, không viết mới |
| **2** | **Bảng so cực (Poles Table)** | Bắt gu bằng cách bấm giữa hai cực (tối giản ↔ ấm áp · kín ↔ mở · đơn sắc ↔ phong phú…) | 5–7 hàng, mỗi hàng 1 thanh trượt −3..+3 | KTS **không tự viết** ra gu dạng chữ; bấm cực rẻ hơn viết luận. Nuôi Thẻ DNA lớp `ngonNguKhongGian` |
| **3** | **Câu chuyện 3 hồi (3-Act Storyline)** | Ép ý tưởng thành **mở · xung đột · giải quyết** | 3 khối văn bản + ảnh minh hoạ cho mỗi hồi | Đây là khuôn Hoà đã dùng thật (16/08 *"storyline dự án"*). Nuôi Thẻ DNA lớp `yDo` (ý đồ) — lớp `distiller.ts:78` cố ý trống ở rule-based (chờ người điền) |

**Không đề xuất thêm** (khai để phiên sau không tự thêm):
- SWOT / persona / user journey — bốn cái này thuộc **quản trị dự án**, không phải **thiết kế nội thất**. Dùng bừa gây nhiễu.
- Mind map — Hoà đã chốt 02/08 *"mindmap là MỘT tuỳ chọn"* — tức không mặc định, không cần khuôn riêng.

### Mở rộng `ConceptForm` KHÔNG PHÁ

`ConceptForm.tsx:52` xuất `export function ConceptForm()` — dùng trực tiếp, không có props về "loại
khuôn". Cách mở rộng đúng luật Đ2 (dùng cỗ máy sẵn):

```
components/form/
  ConceptForm.tsx           ← giữ nguyên (khuôn 1)
  BangSoCucForm.tsx         ← MỚI (khuôn 2)
  BaHoiStorylineForm.tsx    ← MỚI (khuôn 3)
  index.ts                  ← xuất registry { moodboard, so-cuc, ba-hoi }
```

Đặt `registry` để `CuaSoCongCu` môi trường `ban-bac` chọn khuôn qua id, không phải import chéo.
Ba khuôn cùng contract: nhận `nguoiDung`/`duAn`, ghi vào `useFlowStore` (nếu dạng node) hoặc trả
`DiscussionArtifact` (nếu dạng modal — không đẻ node).

---

## Câu 3 · Cổng ra thành Thẻ DNA — dây thật đi thế nào?

### Đọc mã, không đoán

**Đường ĐÃ CÓ** (đo `lib/dna/distiller.ts:71`):

```
DnaSourceAsset[]                       ← chỉ nhận ảnh có palette/tags
  ↓
distillDnaFromAssets(assets)           ← rule-based, 6 spec + 2 trống
  ↓
distill(sources, SPECS)                ← lib/distill/engine.ts:35, GENERIC
  ↓
Record<DnaLayerKey, DistilledField>    ← 8 lớp, mọi field 'inferred'
  ↓
DesignDnaCardPanel                     ← hiện Thẻ DNA
```

**Chỗ THIẾU DÂY (khai đỏ):**

🔴 **① `ProvenanceInput` HIỆN CHỈ CÓ `kind: 'image'`.** Bằng chứng: `distiller.ts:44` `if (s.kind !== 'image') return []`
— extractor **loại bỏ** mọi nguồn không phải ảnh. Nghĩa là sticky note (NoteNode) · comment (CommentPin)
· form đã điền (Poles / 3-act) **KHÔNG được distiller đọc** dù chúng cũng là "nguồn provenance".
`lib/distill/types.ts` cần mở union: `kind: 'image' | 'note' | 'form' | 'pin'`. Đây là VIỆC THẬT
duy nhất của mảng lõi — 1 union type + 1 test.

🔴 **② KHÔNG HOOK NÀO từ `FlowCanvas` → `distill`.** Grep `distillDnaFromAssets` ngoài `lib/dna/`:
tôi chưa grep — cần agent code sau đo lại, nhưng cửa sổ Thảo Luận cần **một nút "Chưng cất → Thẻ DNA"**
gọi thẳng `distillDnaFromAssets()` với đầu vào GỘP (ảnh + sticky + form). Nút này là **cửa
duy nhất**, không tự chạy trên mỗi thao tác (đúng luật T5 *[TRIET-LY-IF.md:32]* — con người quyết cuối).

🟢 **③ ĐÃ CÓ merge cẩn thận.** `distiller.ts:97` `mergeDistilledIntoCard()` — field nào đang `verified`
thì GIỮ, trống/`inferred` bị THAY. Nghĩa là chưng cất lại **không xoá thao tác tay** của người —
đúng luật 6 (`docs/CLAUDE.md`) *"sửa tay của người dùng không bao giờ bị AI ghi đè"*.

### Luồng đề xuất (sau khi vá điểm ① ②)

```
[FlowCanvas]
   ├─ NoteNode (sticky)                         ┐
   ├─ CommentPin                                 ├── gộp thành DiscussionSources[]
   ├─ AnhThamChieu (ảnh + palette + tags)       │
   └─ FormArtifact (Poles / 3-act)              ┘
                                                 ↓
                            [Cửa Sổ Thảo Luận · nút "Chưng cất"]
                                                 ↓
                                    distill(sources, SPECS)   ← v2 nhận 4 kind
                                                 ↓
                                    mergeDistilledIntoCard(current, distilled)
                                                 ↓
                                    DesignDnaCardPanel        ← hiện phiên bản mới
                                                 ↓
                              (Người xác nhận → 'verified' — không tự động)
```

---

## Câu 4 · Có phá luật *"cửa sổ thảo luận không cần cổng ra"* không?

**Có RỦI RO** nếu bắt ép: nếu mọi phiên Collab **PHẢI** sinh Thẻ DNA khi đóng cửa sổ ⇒ nó thành
**cửa sổ sản xuất** (đầu ra bắt buộc = tệp). Trái chốt 16/08 (`00-CHOT.md` bảng "Cửa sổ SẢN XUẤT ↔ THẢO LUẬN":
*"cửa sổ THẢO LUẬN — cổng ra: có thể KHÔNG · đầu ra thật: một quyết định đã chốt"*).

### Cách để hai chế độ sống chung — không đổi mode

Cửa sổ Thảo Luận luôn có **NÚT ĐƠN LẺ ở góc** "Chưng cất → Thẻ DNA", **không tự chạy**:

- Chưa bấm → cửa sổ hoạt động như thảo luận thuần: sticky, comment, form, ảnh — không ai bị ép
- Bấm → chạy `distill` **một lần**, hiện Thẻ DNA phiên bản mới ở panel phải để người duyệt

**Đây KHÔNG PHẢI hai chế độ.** Là **một chế độ + một nút**. Nút bấm hay không do KTS quyết dựa
trên cảm giác "đủ chín" — như bấm "Lưu" trong Photoshop: không phải cứ mở PSD là bị ép Lưu.

Nghiệm thu **đo được** cho luật này:
- Đóng cửa sổ Thảo Luận **không** sinh Thẻ DNA nếu chưa bấm nút → **phải ĐÚNG** (test giả tưởng)
- Bấm nút **N lần** → phải sinh **N lần** với `mergeDistilledIntoCard` (không mất `verified` cũ) → **phải ĐÚNG**
- Không có nút "Tự chưng cất mỗi X phút" → **cấm** thêm; nếu có, phá luật T5.

---

## Câu 5 · 4 entry của `soi:cam-dien` có liên quan không?

**KHÔNG liên quan tới màn Collab.** Bằng chứng đọc từ `scripts/frontier-registry.mjs`:

| Entry | Trụ | Làm gì | Liên quan Collab? |
|---|---|---|---|
| `chuan-net-3d` | TriTueDuAn | Mesh máy sinh (Trellis) → chuẩn hoá net + revolveProfile cho 4 chân ghế Lincoln 327 | Không — đường **AI dựng cấu kiện từ ảnh**, không liên quan chưng cất Thẻ DNA từ moodboard |
| `wireframe-dinh-bien-dien` | TriTueDuAn | Mesh → phân vùng theo DIỆN → nét biên → matId cụm | Không — cùng đường trên, khâu phân vùng |
| `part-lock-cau-kien` | TriTueDuAn | Cấu kiện lắp ghép, cờ khoá — tinh chỉnh không đụng phần khoá | Không — khâu cuối của đường AI dựng cấu kiện |
| `mirror-doi-xung-chuan-net` | TriTueDuAn | Mirror completion — copy tham số qua trục đối xứng | Không — tầng thuật toán cho 4 chân/2 vòng |

Bốn entry này thuộc **đường AI dựng cấu kiện 3D từ ảnh** (mesh → phân vùng → cấu kiện → khoá →
mirror). Collab moodboard/thảo luận là **đường KTS chưng cất Thẻ DNA từ nhiều nguồn** (ảnh + note +
form). Hai đường **có thể gặp nhau HẠ NGUỒN** ở entry `furniture-slot-set` (Thẻ DNA nuôi slot
furniture — chốt 14/08), nhưng đó là **sau** khi cả hai đường đã ra sản phẩm; không phải nhánh
chung của Collab.

**Nói thẳng:** phiếu này không đụng 4 entry đó, và ngược lại 4 entry đó không phải nợ chặn Collab.

---

## Tổng kết — Collab chặng 3D là gì

Collab là **một môi trường THẢO LUẬN mới trong mode Node**, sống trên cùng `FlowCanvas` với các
cửa sổ sản xuất, dùng lại khuôn `CuaSoCongCu`. Đầu ra **có thể là** Thẻ DNA (khi người bấm nút),
không bị ép. Ba khuôn ban đầu: Moodboard (đã có) · Bảng so cực · Câu chuyện 3 hồi. Việc thật cần
làm để chạy được: mở rộng `ProvenanceInput` cho 4 `kind` + thêm 2 form + thêm nút "Chưng cất".

---

## ⑦b · CHƯA CHẮC

- **Kịch bản mock chưa chạy với KTS thật.** Ba khuôn form đề xuất là **suy từ chốt Hoà**, không đo
  từ dùng thật. Có thể Bảng so cực không đủ giá trị so với chi phí học.
- **Không grep hết** — chỉ đo `MoodboardModal` và `ConceptForm`; có thể còn mảnh distiller khác
  (vd bên `home/`) T chưa thấy. Agent code khi thi công phải grep lại `distillDnaFromAssets`.
- **Đề xuất "định vị lại form là công cụ xuyên chặng"** ở đính chính tiền đề — chỉ nêu vấn đề, không
  chọn. Cần Hoà quyết: form Moodboard sống ở 2D (như hiện) hay chuyển sang 3D Collab hay cả hai?
- **Không đo `HomeScreen.tsx:692`** đầy đủ — chỉ biết `MoodboardModal` mount ở đó. Chuyển hay tái
  dùng ở Collab 3D có phá luồng 2D không, chưa biết.

## ⑦c · HẠN DÙNG KẾT LUẬN

Kết luận này **hết đúng khi**:
- Hoà chọn **(a)** hoặc **(c)** ở câu 1 — cả NC và mock phải viết lại.
- Hoà lật quyết định "form là xuyên chặng" thành "form của 2D không dùng ở 3D" — khuôn 1 phải
  viết mới thay vì tái dùng `ConceptForm`.
- Mở rộng `ProvenanceInput` v2 không đạt (vd `distill/engine.ts` bên trong có nhiều nơi ép ảnh,
  không dễ nới) — luồng câu 3 phải đổi.
- Có phiếu khác đang chạy đụng `lib/dna/distiller.ts` cùng phạm vi (T kiểm bằng `claim-keys` khi
  mở phiếu thi công).
