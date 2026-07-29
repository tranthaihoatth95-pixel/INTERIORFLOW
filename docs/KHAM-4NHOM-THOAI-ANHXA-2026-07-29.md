# 4 nhóm · bìa vẽ nét · ánh xạ Google Flow/Weave/ComfyUI · audit thoại trong app

> Trả lời 5 việc Hoà giao trong 1 lượt. Đọc code thật trước (Luật #4/#5), có đính chính 2 chỗ tôi
> nói sai ở doc trước.

---

## 0. ĐÍNH CHÍNH — tôi đã nói thiếu ở doc trước

Quét lại toàn bộ `lib/nodes/` bằng lệnh đếm chính xác:

| Tôi đã nói | Sự thật |
|---|---|
| "IF có 20 node AI" | Đúng phần `ai.*` (20) — nhưng **tổng cộng là 45 node** (20 `ai.` · 5 `input.` · 11 `util.` · 3 `out.` · 3 `slide.` · 2 `three.` · 1 `render.`). Tool Mode lộ 6 → **13%**, không phải 30% |
| "Đa góc nhìn nhất quán — THIẾU THẬT" | **SAI.** `three.camera` (*"Góc máy ảnh — preset tất định: tầm mắt / góc rộng / cận vật liệu / trên cao → JSON camera + mẩu prompt, 0 credit"*, `render-v2.ts:203-209`) đã có. Thiếu là **cách đóng gói** (bộ 4 góc), không phải năng lực |
| "Sửa phối cảnh / khoá điểm tụ — thiếu" | **SAI.** `util.warp` = *"Perspective Warp (4 góc)"* đã có |

**Và món lớn nhất tôi bỏ sót**: `three.cad2fbx` — *"Bản vẽ chặng 1 (tường WALL + block nội thất) →
dựng khối 3D **đúng kích thước thật**, xuất OBJ/MTL ngay trên node; nút Xuất FBX qua Blender local.
**0 credit, 100% tất định**"* (`render-v2.ts:231-237`). Đây chính là **cây cầu CAD → Render** mà
IF đã xây xong và **không ai thấy**. Nó giải luôn khoảng trống "render đúng tỉ lệ thật" tôi nêu ở
doc trước.

→ Còn lại **đúng 1 khoảng trống thật**: **bộ map PBR** (normal/roughness/AO/height). Ngoài ra
IF không thiếu tính năng — IF thiếu **mặt tiền**.

---

## 1. Bốn nhóm — ánh xạ trọn vẹn 45 node

Chia theo **thứ tự nghề**, không theo loại kỹ thuật. Nhóm 3 cũ ("Sửa & xuất") tách đôi → đủ 4 phần,
vừa đẹp trang vừa đúng thực tế (sửa và xuất là hai giai đoạn tâm lý khác nhau: một bên còn đang thử,
một bên đã chốt).

| | Nhóm | Câu hỏi người dùng đang hỏi | Node |
|---|---|---|---|
| **01** | **Ý TƯỞNG** · *Ideate* | "Làm theo gu gì?" | Gu Reference · Moodboard Gen · Bảng màu · Pattern Studio · Style Preset · Room Info · Moodboard Collage · Text Prompt **(8)** |
| **02** | **DỰNG** · *Build* | "Ra ảnh đầu tiên bằng cách nào?" | **Bản vẽ → 3D** · **Góc máy ảnh** · Sketch → Render · Clay → Photoreal · Phòng trống → Bày đồ · Ngoại thất · Text → Ảnh · Vẽ nhanh · Nhập ảnh **(9)** |
| **03** | **SỬA** · *Refine* | "Chưa ưng chỗ nào?" | Đổi phong cách · Đổi ánh sáng · Đổi vật liệu · Thêm/xoá đồ · Chỉnh cục bộ · Chọn vùng thông minh · ID Mask · Vẽ mask · Chỉnh ảnh tay · Sửa phối cảnh · Cắt/đổi cỡ **(11)** |
| **04** | **XUẤT** · *Deliver* | "Giao khách thế nào?" | Ra nhiều phương án · So sánh A/B · So sánh model · Phóng to in · Cắt nền · Tách nội thất · Ghi chú vật liệu · Chú thích · Ghép ảnh · Watermark · **Export Board** · Lưu Gallery · Dựng slide · Concept Content · **Export Deck** **(15)** |

*(2 node video `image2video`/`text2video` để riêng — đã hoãn sang [v2] theo Q5, không nhét vào 4
nhóm cho khỏi loãng.)*

**Vì sao 4 nhóm này đúng chứ không phải chia cho đủ số**: mỗi nhóm trả lời **một câu hỏi khác nhau
của người dùng tại một thời điểm khác nhau**. Đó là tiêu chí chia nhóm duy nhất đứng vững — chia
theo "loại kỹ thuật" (AI_GENERATE / AI_EDIT / UTILITY như category hiện tại trong code) là chia
theo cách **máy** nghĩ, không phải cách **người làm nghề** nghĩ.

> Giữ nguyên `category` cũ trong code (máy dùng), thêm trường `group` mới (người dùng thấy). Hai
> trục song song, không phá gì.

---

## 2. Bìa thẻ — hệ minh hoạ vẽ nét

Hiện 5/6 thẻ ghi "Chờ ảnh thật" — **đúng nguyên tắc** (không cho AI vẽ minh hoạ giả, `task-cards.ts`
ghi rõ yêu cầu B3), nhưng nhìn như app chưa xong. Vẽ nét là lối thoát đúng: **không giả vờ là ảnh
kết quả**, mà **mô tả cơ chế** — nên không vi phạm B3.

### Quy chuẩn đề xuất

| Hạng mục | Quy định |
|---|---|
| Kỹ thuật | SVG inline, `stroke` 1.5px, `fill: none`, `currentColor` → tự đổi theo sáng/tối, không cần 2 bộ ảnh |
| Bảng màu | Nét chính `--t2` · nét phụ `--t4` · **đúng 1 điểm nhấn** `--accent` `#6a57f5` cho phần "AI làm gì" |
| Nội dung | Vẽ **phép biến đổi**, không vẽ căn phòng đẹp. Vd *Sketch → Ảnh thật*: nửa trái nét phác thô, nửa phải cùng hình khối nhưng nét liền + mảng tô nhẹ |
| Tỉ lệ | 4:3, khung 160×120, lề trong 12px |
| Cấm | Không gradient · không đổ bóng · không icon mua sẵn · không hình khối bo tròn đều nhau |
| Nhóm | Mỗi nhóm 1 dấu hiệu hình học riêng: **01** vòng tròn chồng · **02** khối hộp phối cảnh · **03** con trỏ + vùng chọn · **04** khung giấy xếp lớp |

### Vì sao vẽ nét chứ không phải ảnh thật

1. **45 node × ảnh trước/sau thật = 90 tấm ảnh phải chụp/render.** Không khả thi, và mỗi lần đổi
   model là lỗi thời.
2. Ảnh thật **dạy sai**: người dùng tưởng đó là kết quả họ sẽ nhận được.
3. Nét vẽ **đọc được ở 90px** trên dải thẻ ngang — ảnh render thì thành đốm màu.
4. Đây là **bản sắc nhìn thấy được** — mọi app AI 2026 đều dùng ảnh mẫu bóng bẩy giống nhau; một hệ
   nét vẽ nhất quán làm IF **không lẫn với ai**.

---

## 3. Ánh xạ với các app ngoài (Luật #7 — nên lấy / nên tránh)

| App | Cấu trúc lõi | NÊN LẤY | NÊN TRÁNH |
|---|---|---|---|
| **Google Flow** | **"Ingredients"** = ảnh tham chiếu nhân vật/vật thể/phong cách, gom lại rồi mới dựng cảnh · **Scenebuilder** ghép các đoạn · **Extend** nối dài · **Flow TV** xem prompt của người khác | ① Từ **"Ingredients"** = đúng khái niệm **Thẻ Gu** của IF — chốt nguyên liệu trước, dựng sau. Chứng minh hướng Hoà nghĩ là hướng ngành đang đi. ② **Flow TV** → IF nên có **"Gallery công thức"**: xem lại gói node người khác đã dùng, kèm tham số. Rẻ, dạy người dùng mà không cần viết hướng dẫn | Chia tính năng thành 4 chế độ rời (Text-to · Frames-to · Ingredients-to · Scenebuilder) — IF chỉ cần **1 dòng chảy 4 nhóm**, đừng bắt chọn "chế độ" trước |
| **Figma Weave** (Weavy cũ) | Node graph, mạnh ở **tool tất định**: curves, levels, alpha mask, **array node** (sinh biến thể hàng loạt) | ① **Array node** — IF có `ai.batchvariants` rồi, nên mở rộng thành "chạy 1 flow với N bộ tham số" ② Triết lý "**node AI đứng cạnh tool tất định**" — IF đã theo đúng (`three.*` 0 credit cạnh `ai.*`), nên **nói ra** cho người dùng biết | Bắt hiểu graph mới làm được việc |
| **Flora** | **"Flows"** = template node dựng sẵn theo ngành | **Đây chính là "gói combo" Hoà đề xuất** — đã được xác nhận là mô hình chạy được trên thị trường | Canvas vô tận kiểu Miro — IF không cần |
| **ComfyUI** | Node thuần + **hệ custom node cộng đồng** + Browse Workflow Templates | **Kho template dựng sẵn mở từ menu** — mô hình đúng cho gói combo | Category kiểu máy (loaders/conditioning/sampling) — đó là lý do ComfyUI khó với người không kỹ thuật |
| **Adobe Firefly** | Tab theo **hành động**: Generate · Edit · Enhance, model bên thứ ba cắm vào | Đặt tên tab **theo hành động** — trùng đúng 4 nhóm IF đang chia | Ôm đa phương thức (ảnh/video/audio/vector) — lệch nghề nội thất |

### Extension — họ có gì, IF nên đứng ở đâu

| | ComfyUI | Figma Weave | Google Flow | **IF** |
|---|---|---|---|---|
| Ai viết node mới | Cộng đồng, tự do | Chỉ hãng | Chỉ hãng | Chỉ IF |
| Cách phân phối | Registry, cài từng cái | Có sẵn | Có sẵn | — |
| Rủi ro | Node hỏng, model nặng, xung đột | Không | Không | — |

**Khuyến nghị thẳng**: IF **không nên** mở hệ extension cho bên thứ ba lúc này. Lý do: đây là bậc
**L** (nâng cao/moat), mà bậc **N** (cơ bản) còn chưa xong — 45 node đã có mà 39 cái người dùng còn
chưa nhìn thấy. Mở extension bây giờ = thêm node vào một kho **vốn đã không ai tìm ra**.

**Thứ IF nên lấy từ mô hình extension, mà không phải mở API**: chính là **kho gói combo chia sẻ
được** (`.ifpack` đã có sẵn hàm `buildIfpack()`!). Người dùng lưu flow của mình thành 1 gói, gửi cho
đồng nghiệp, mở ra chạy. **Đó là extension đúng tầm IF** — mở rộng bằng *công thức*, không phải bằng
*mã*. Rẻ, không rủi ro bảo mật, và dùng lại hạ tầng đã xây.

---

## 4. Audit thoại trong app — vấn đề thật, đo được

Trích **toàn bộ 45 `title`** người dùng nhìn thấy. Kết quả: **4 quy ước đặt tên chạy song song
trong cùng 1 kho.**

| Quy ước | Ví dụ | Số lượng |
|---|---|---|
| Thuần Anh | `Batch Variants` · `Empty Room Staging` · `Relight` · `Remove BG` · `Save to Gallery` · `Watermark` · `Upscale 4K` · `Style Transfer` · `Mask Painter` · `Room Info` | ~25 |
| Thuần Việt | `Chỉnh cục bộ` · `Góc máy ảnh` · `Tách nội thất` | 3 |
| Việt-Anh trộn trong ngoặc | `Pattern Studio (hoa văn)` · `ID Mask (phân vùng)` · `Smart Select (chọn vùng)` · `Ghép ảnh (Composite)` · `Chỉnh ảnh (manual)` · `Perspective Warp (4 góc)` | ~8 |
| Mũi tên | `Sketch → Render` · `Clay → Photoreal` · `Bản vẽ → 3D (OBJ/FBX)` · `Text → Video` | ~5 |

**Ca tệ nhất**: `So sánh model (xịn)` — "xịn" là tiếng lóng, không dịch được, không ai ngoài người
viết hiểu nó khác gì `Compare A/B`. Đây đúng nghĩa "không global".

### Quy chuẩn thoại đề xuất — 5 luật, áp cho toàn bộ 45 node

| # | Luật | Trước | Sau |
|---|---|---|---|
| 1 | **Việt dẫn · Anh theo**, ngăn bằng `·` | `Empty Room Staging` | `Phòng trống → Bày đồ · Empty Room Staging` |
| 2 | Node biến đổi dùng `→`, **hai vế cùng ngôn ngữ** | `Clay → Photoreal` | `Khối trắng → Ảnh thật · Clay to Render` |
| 3 | **Bỏ ngoặc giải thích** khỏi tên → đẩy xuống mô tả | `ID Mask (phân vùng)` | `Phân vùng ID · ID Mask` |
| 4 | **Cấm tiếng lóng / từ đánh giá** | `So sánh model (xịn)` | `So sánh model · Model Compare` |
| 5 | Tên là **việc người dùng làm**, không phải tên kỹ thuật | `BiRefNet v2` (trong mô tả) | `Cắt nền · Remove BG` — tên model để trong phần chi tiết |

**Vì sao giữ tiếng Anh chứ không dịch sạch**: người làm nghề tra cứu, xem YouTube, đọc ComfyUI đều
bằng thuật ngữ Anh. Bỏ hẳn tiếng Anh = cắt người dùng khỏi cả thế giới tài liệu. Bỏ hẳn tiếng Việt =
người mới không hiểu. **Song ngữ có thứ tự cố định** là cách duy nhất vừa dễ hiểu vừa global.

Áp luật này cho cả **4 tên nhóm**: `Ý TƯỞNG · Ideate` — `DỰNG · Build` — `SỬA · Refine` —
`XUẤT · Deliver`.

---

## 5. Xếp hàng (Luật #8b) — bổ sung

| Mã đề xuất | Việc | Chi phí | Xếp vào |
|---|---|---|---|
| `2.2.69` | **Quy chuẩn thoại 5 luật** + đổi tên toàn bộ 45 node + 4 tên nhóm | Rẻ (thuần chuỗi, 1 lượt sửa) | **Sprint 3, LÀM ĐẦU TIÊN** — mọi màn hình sau đều hiển thị tên này, đổi sau thì phải sửa lại ảnh chụp/tài liệu |
| `2.2.70` | **Hệ minh hoạ nét** — quy chuẩn SVG + vẽ 45 bìa (ưu tiên 24 thẻ hay dùng trước) | Trung bình, việc thiết kế nhiều hơn việc code | Sprint 3, song song 2.2.69 |
| `2.2.71` | **Trường `group` 4 nhóm** trong registry + màn chọn 4 phần | Rẻ | Sprint 3, sau 2.2.69 |
| `2.2.72` | **Lộ `three.cad2fbx` + `three.camera` ra mặt tiền** — cầu CAD→Render, 0 credit, tất định | Rẻ (node đã chạy) | **Sprint 3, ưu tiên cao** — đây là thứ khác biệt nhất IF có so với mọi app AI ngoài kia |
| `2.2.73` | **"Gallery công thức"** — xem lại gói node đã dùng kèm tham số (học từ Flow TV) | Trung bình | Sprint 4 |
| `2.2.74` | **Chia sẻ gói `.ifpack`** — extension bằng công thức, không bằng mã | Trung bình (`buildIfpack()` đã có) | Sprint 4 |

**Thứ tự bắt buộc**: `2.2.69` (tên) → `2.2.70`+`2.2.71` (bìa + nhóm) → phần còn lại. Đổi tên phải
đi trước vẽ bìa, vì bìa vẽ theo tên.

---

*Cowork, 29/07/2026. Đã đọc thật: toàn bộ `lib/nodes/` (45 node), `render-v2.ts`, `task-cards.ts`,
`registry.ts`. Nghiên cứu ngoài: Google Flow (Grokipedia · Ingredients/Scenebuilder/Extend/Flow TV),
Figma Weave vs Flora (Wireflow), ComfyUI docs (workflow templates · custom node registry), Adobe
Firefly, Chase Jarvis khảo sát AI canvas. Mã 2.2.69-2.2.74 là ĐỀ XUẤT — Claude Code kiểm tra trùng
số trước khi dán.*
