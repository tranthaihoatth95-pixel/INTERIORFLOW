# KHÁM chặng 2 (Rendering) — tràn khung · nút AI · 6 thẻ đã đủ chưa · gộp Ý tưởng vào chặng 2

> Đọc code thật trên máy Hoà trước khi nhận định (Luật #4/#5). Mọi kết luận đều có `file:dòng`.
> Nghiên cứu ngoài: PatternFly toolbar guidelines · khảo sát app AI canvas 2026 (Weavy/Flora/
> Freepik/Krea/Leonardo). Đây là bước KHÁM + TƯ VẤN — chưa SPEC, chưa code.

---

## 0. Ảnh Hoà gửi — mô tả lại (Luật #7)

Màn `/projects/[id]/render`, theme sáng. Thanh đầu trái→phải: logo IF · "InteriorFlow" · tên flow
**chỉ còn đúng 1 chữ "D"** · 3 chặng (CAD·Phác thảo / **Rendering** đang bật / Presenting) · nhãn
micro "— 02 · RENDERING" · "Thêm vào canvas" · "Mở tệp ▾" · "Xuất ▾" · chip "AI · oneAI · FLUX-R…"
**bị cắt cụt ở mép phải**. Giữa màn: tiêu đề "Chọn việc muốn làm" + 6 thẻ việc (5/6 thẻ ghi "Chờ
ảnh thật") + link "Mở canvas (nâng cao) →". Đáy: "Dự án mẫu" (trái) + viên "Vitals" (giữa).

Luật #7 áp cho ảnh này — nhưng đây là ảnh **màn hình của chính IF**, không phải ảnh tham khảo bên
ngoài, nên 2 lớp giá trị đọc ngược lại: lớp (a) tính năng = 6 thẻ có đúng nhu cầu không (mục 3),
lớp (b) giao diện = bố cục thanh đầu + lưới thẻ (mục 1-2). Phần "nên lấy / nên tránh" áp cho các
sản phẩm tham khảo đã nghiên cứu, ở mục 4.

---

## 1. "Màn hình cứ bị tràn khung hoài" — XÁC NHẬN, đã tìm ra gốc

**Không phải cảm giác — đây là lỗi layout thật, tái hiện được.** Ảnh Hoà gửi là màn retina 2x →
viewport thật ≈ **1183 CSS px** (kiểm chứng: lưới thẻ trong ảnh rộng ~1712px/2 = 856px, khớp đúng
`maxWidth: 860` ở `ToolModeHome.tsx:30`).

### Gốc lỗi — 3 tầng cộng dồn

| # | Vị trí | Vấn đề |
|---|---|---|
| 1 | `Header.tsx:49` | Thanh đầu là `flex ... gap-2` **không có `overflow-hidden`, không `flex-wrap`** → nội dung thừa tràn thẳng ra ngoài viewport thay vì bị cắt/gói lại |
| 2 | `Header.tsx:90` | Tên flow là phần tử **DUY NHẤT** co được (`max-w-28 shrink truncate`). Nó co hết cỡ trước → còn 1 chữ "D". Hết nó thì không còn gì co nữa |
| 3 | `Header.tsx:101·106·111·118·130` | PhaseSwitcher · UploadButton · RenderIOMenus · AiTierMenu · nút "Chạy flow" đều `shrink-0`. Spacer `min-w-2 flex-1` (dòng 122) sập còn 8px là hết đường |

### Điểm nghịch lý quan trọng nhất

Breakpoint đang chạy **ngược chiều**: càng rộng ra, IF **hiện thêm** chứ không giấu bớt.

- `Header.tsx:111` — `RenderIOMenus` (2 menu Mở tệp + Xuất) chỉ hiện **từ `lg` (1024px)**.
- `Header.tsx:530` — tên engine ("· FLUX-R…") cũng chỉ hiện **từ `lg`**.

Nghĩa là ở đúng dải 1024–1300px, IF *bồi thêm* 3 cụm vào một thanh vốn đã chật. **1183px của Hoà
rơi thẳng vào giữa dải đó** — nên chip AI bị cắt, và **nút "Chạy flow", Việc, Home, ⋯, avatar user
đều đã văng khỏi màn hình**. Không chỉ xấu — Hoà đang **không bấm được nút chạy chính và không vào
được tài khoản** ở độ rộng này.

> Dòng ghi chú ở `Header.tsx:529` cho thấy đã từng vá đúng loại lỗi này ở 768px ("badge bọc 2 dòng
> làm header cao lệch") — vá bằng cách đẩy sang `lg`. Tức là lỗi bị **đẩy lên** chứ không bị sửa.

### Đếm thật: 10 cụm trong 1 thanh cao 48px

logo · tên flow · 3-chặng · nhãn "02·RENDERING" · Thêm vào canvas · Mở tệp · Xuất · chip AI ·
Chạy flow · Việc · Home · ⋯ · avatar = **13 phần tử**. PatternFly khuyến nghị: 3 hành động trở lên
thì để 1 nút chính ngoài thanh, phần còn lại gom vào menu tràn.

---

## 2. "Nút chọn AI nên cho vào Cài đặt" — ĐỒNG Ý, và có lý do kỹ thuật

`AiTierMenu` (`Header.tsx:117-120`, thân 496-640) không phải nút thao tác — nó là **cấu hình toàn
cục**: chọn 1 trong 4 mức phụ thuộc AI, + chọn engine oneAI, + chọn runtime. Bằng chứng nó là cấu
hình chứ không phải hành động:

- Giá trị nằm ở store toàn app (`aiTier`/`oneAiEngine`/`oneAiRuntime`), **áp cho cả 3 chặng**, không
  phải cho từng lượt render.
- Popover của nó rộng `w-72` với 3 tầng lồng nhau (4 mức → engine → runtime) — đúng dạng bảng cài đặt.
- Nó tự chiếm ~180px thanh đầu ở `lg` chỉ để **hiển thị trạng thái**.

**Đề xuất**: chuyển toàn bộ vào Cài đặt. Giữ lại ở thanh đầu **duy nhất 1 chấm trạng thái nhỏ**, và
**chỉ hiện khi bất thường** (đang chạy mock / provider chưa cấu hình — logic `avail === false` đã có
sẵn ở `Header.tsx:509,531`). Bình thường thì không chiếm chỗ nào cả. Ai cần đổi engine cho 1 việc cụ
thể thì đổi trong hàng "Nâng cao" của chính thẻ việc đó (`ToolModeForm`), đúng ngữ cảnh hơn.

---

## 3. "6 thẻ đã tối ưu chưa?" — PHÁT HIỆN LỚN NHẤT PHIÊN NÀY

### IF đang có 20 node AI thật. Tool Mode chỉ lộ ra 6.

Đếm từ `lib/nodes/defs/*.ts` + `lib/nodes/registry.ts`: **20 node `ai.*` + 5 node `input.*` + 10
node `util.*`**. `lib/render-studio/task-cards.ts` chỉ ánh xạ **6**. Tức **14 node AI đã code xong,
chạy được, tốn credit thật — nhưng người dùng không thấy** trừ khi bấm "Mở canvas (nâng cao)".

| Đã lộ ở Tool Mode (6) | ĐANG ẨN — có thật trong registry (14) |
|---|---|
| sketch2render · clay2render · styletransfer · relight · materialswap · upscale | **moodboard** (text→4 ảnh concept) · **guref** (rút hồ sơ gu) · **pattern** (Pattern Studio — hoa văn + tile lặp) · **emptystaging** (phòng trống→bày đồ) · **exterior** (mặt tiền) · **furniture** (thêm/xoá đồ) · **furnitureextract** · **removebg** (cắt nền — làm spec sheet) · **localedit** · **smartselect** · **idmask** · **batchvariants** (ra nhiều phương án 1 lượt) · text2image · image2video/text2video |

**Kết luận thẳng**: 6 thẻ **không sai**, nhưng chỉ là **30%** kho công cụ đã xây. Vấn đề của chặng
2 không phải "thiếu tính năng" — mà là **tính năng đã có nhưng bị chôn**. Đây đúng kiểu việc đã làm
mà không ai biết, chính là thứ Luật #8b sinh ra để chặn.

### Nhu cầu thật của nghề nội thất — đối chiếu IF có gì / thiếu gì

| Nhu cầu nghề | IF đã có | Trạng thái |
|---|---|---|
| Mood/ý tưởng đầu bài | `ai.moodboard`, `util.palette`, `input.guref` | ✅ code xong · ⛔ bị ẩn |
| Hoa văn · giấy dán tường · thảm · gạch (tile lặp liền mạch) | `ai.pattern` (có output `tile` lặp + neo văn hoá Chăm/Khmer/Đông Sơn) | ✅ code xong · ⛔ bị ẩn — **đây là món mạnh nhất mà không ai thấy** |
| Sketch/clay → ảnh thật | sketch2render, clay2render | ✅ đã lộ |
| Phòng trống → bày đồ (virtual staging) | `ai.emptystaging` | ✅ code xong · ⛔ bị ẩn |
| Đổi phong cách giữ bố cục · đổi giờ/sáng | styletransfer, relight | ✅ đã lộ |
| Đổi vật liệu 1 mảng | materialswap | ✅ đã lộ (nhưng phải sang canvas vẽ mask) |
| Thêm/xoá đồ nội thất | `ai.furniture` | ✅ code xong · ⛔ bị ẩn |
| Ra 3-4 phương án cho khách chọn | `ai.batchvariants`, `util.compare` | ✅ code xong · ⛔ bị ẩn |
| Cắt nền món đồ → làm spec sheet / catalogue | `ai.removebg`, `ai.furnitureextract`, `util.materialnote` | ✅ code xong · ⛔ bị ẩn — **nối thẳng được vào BOQ (2.1.9.p) và catalogue-export (2.3.60)** |
| Phóng to in A3 300dpi | upscale | ✅ đã lộ |
| **Bộ map PBR (normal · roughness · AO · height) từ 1 ảnh vật liệu** | — | ❌ **THIẾU THẬT** |
| **Nhiều góc nhìn cùng 1 phòng, giữ nguyên thiết kế** | — | ❌ **THIẾU THẬT — nhu cầu số 1 của archviz** |
| **Giữ đúng vật liệu xuyên suốt bộ 5-6 ảnh** | gu có nhưng chưa khoá theo bộ | 🟡 nửa vời |
| Render đúng tỉ lệ/diện tích thật từ CAD | `input.roominfo` (loại phòng · m² · hướng sáng · cao trần) | ✅ code xong · ⛔ **chưa nối vào Tool Mode** |
| Sửa phối cảnh / khoá 1-2 điểm tụ | — | ❌ thiếu |

**3 khoảng trống thật sự đáng làm mới** (không phải "bị ẩn" mà là "chưa có"): **bộ map PBR**,
**đa góc nhìn nhất quán**, **khoá vật liệu theo bộ ảnh**. Ba món này mới là thứ đưa IF từ "app đổi
ảnh" thành công cụ nghề — vì chúng là thứ đem được **ngược về SketchUp/3ds Max/D5**, chứ không chỉ
đẹp trên màn hình.

---

## 4. Nghiên cứu ngoài — giao diện nào hợp IF nhất (Luật #7: nên lấy / nên tránh)

Khảo sát 5 app AI canvas 2026:

| App | Cách tổ chức | NÊN LẤY cho IF | NÊN TRÁNH cho IF |
|---|---|---|---|
| **Weavy / Figma Weave** | Node graph + tool compositing cổ điển (curves, levels) | Ý tưởng "node AI đứng cạnh tool tất định" — đúng hướng IF | Bắt user hiểu graph mới làm được việc |
| **Flora** | "Flows" = template node dựng sẵn theo ngành, canvas vô tận kiểu Miro | **Rất đúng IF**: preset theo ngành = chính 6 thẻ việc, chỉ cần mở rộng | Canvas vô tận — IF đã có canvas rồi, đừng nhân đôi |
| **Freepik Spaces** | Node + kho stock + multiplayer | Kho asset gắn liền (IF có Library) | Multiplayer — chưa tới lượt (bậc L) |
| **Krea** | Canvas thời gian thực, đa phương thức, phản hồi tức thì | Cảm giác phản hồi nhanh | Đa phương thức (3D/audio) — lệch nghề |
| **Leonardo** | "Unified Canvas" kiểu Photoshop có layer + "Blueprints" preset tĩnh | Preset tĩnh dễ hiểu | Trộn lẫn thành Photoshop-có-AI — **đúng lỗi Hoà vừa phàn nàn ở Present** |

**Nhận định chung của ngành** (bài Chase Jarvis): node graph cho *kiểm soát chi tiết + không phá
huỷ*, nhưng **dốc học rất cao**; preset/layer thì *dễ dùng ngay* nhưng **giấu mất tham số sâu**.

**IF đang đứng đúng chỗ nên đứng**: Tool Mode (preset) mặc định + "Mở canvas (nâng cao)" cho người
cần graph — kiến trúc này **đã đúng**, chỉ là preset mới lộ 6/20. Không cần đổi triết lý, cần mở
đúng cửa.

---

## 5. "Gộp moodboard / bàn gu / ý tưởng vào chặng 2" — ĐỒNG Ý MẠNH, và IF đã xây sẵn 80%

### Vì sao đúng về kiến trúc

Chặng 1 đã đổi bản chất thành **Drafting CAD** (`lib/phases.ts:33-45`: `featured: []`, chạy ở route
riêng `/cad-editor`, **không có canvas node**). Nghĩa là **chặng Ý tưởng hiện không có nhà** — khối
"2.0 Ý tưởng" trong cây không thuộc chặng nào cả. Đưa nó lên đầu chặng 2 là **rẻ nhất** (không route
mới, không chặng mới) và **đúng luồng nghề** (bàn gu → dựng ảnh → sửa → xuất).

### Cơ chế "1 node cô đọng rồi truyền gu ra" — Hoà mô tả đúng thứ đã có tên trong code

Ý Hoà: *mỗi ý tưởng chốt xong → 1 node cô đọng lại → truyền gu ra.* Đây **chính xác** là
`input.guref`, đọc nguyên văn `lib/nodes/defs/gu-reference.ts:2-6`:

> *"kéo hồ sơ **gu** (Gu Engine) từ thư viện Reference ra làm 1 node ĐỘC LẬP, thay vì chỉ ẩn ngầm
> bên trong các node ai.\*. Lợi ích: user **THẤY rõ gu đang áp là gì**, và có thể cắm mẩu prompt
> này vào **BẤT KỲ node nào** nhận input text."* — 0 credit.

Và cái "cô đọng" là `GuProfile` (`lib/gu.ts:26-40`): palette · materials · styles · keywords ·
sampleUrls (dùng làm style-ref/IP-Adapter) · moods (tâm lý màu) · subject (loại phòng).

**Kết luận**: Hoà không đề xuất tính năng mới — Hoà đang mô tả **đúng cơ chế đã code xong nhưng
chưa có mặt tiền**. Việc cần làm là **cho nó một cái thẻ**, không phải xây lại.

### Hướng giao diện đề xuất — chặng 2 thành 3 bước, thay lưới 6 thẻ phẳng

```
┌─ THẺ GU (đang áp) ──────────────────────────────────────────┐
│ ● ● ● ●  travertine · sồi · đồng   │  Tối giản ấm · Á Đông  │  [Đổi] [Bỏ khoá]
└──────────────────────────────────────────────────────────────┘
     ↓ mọi việc bên dưới TỰ ĐỘNG thừa hưởng thẻ gu này

BƯỚC 1 · Ý TƯỞNG        BƯỚC 2 · DỰNG ẢNH         BƯỚC 3 · SỬA & XUẤT
Moodboard 4 ảnh         Sketch → Ảnh thật         Đổi phong cách
Rút gu từ Reference     Grey-box → Nội thất       Đổi ánh sáng/giờ
Bảng màu                Phòng trống → Bày đồ      Sửa một mảng
Pattern Studio          Mặt tiền / Ngoại thất     Thêm/xoá đồ
(hoa văn · tile lặp)    Ý tưởng → Ảnh             Ra 3 phương án · So sánh
                                                   Cắt nền · Phóng to in
```

**4 điểm cốt lõi của bố cục này:**

1. **Thẻ Gu là xương sống, nằm trên cùng, luôn thấy** — chốt 1 lần, mọi thẻ việc bên dưới tự nối
   `input.guref` vào. Đây là thứ giải quyết khoảng trống "giữ vật liệu nhất quán xuyên bộ ảnh" ở
   mục 3, và là hiện thân đúng ý "1 node cô đọng truyền gu ra".
2. **3 bước = đúng thứ tự nghề**, không phải 20 thẻ dàn hàng. Mỗi bước 4-6 thẻ → lộ hết 20 node mà
   không thành bức tường.
3. **Không thêm chặng, không thêm route** — vẫn là overlay `RenderToolModeOverlay` hiện có, chỉ đổi
   nội dung `ToolModeHome`. Rẻ.
4. **"Mở canvas (nâng cao)" giữ nguyên** — triết lý 2 tầng đã đúng (mục 4), không đụng.

### Việc kèm theo bắt buộc (Luật #6 — Đồng Bộ)

Gộp Ý tưởng vào chặng 2 thì khối **"2.0 Ý tưởng"** trong `IF-FEATURE-TREE.md` phải **nhập vào 2.2
Render**, không để tồn tại song song 2 chỗ. Nếu không, đúng 1 tháng nữa lại có người xây moodboard
lần thứ hai ở chỗ khác.

---

## 6b. Chặng 3 (Present) cũng cần màn chọn đầu chặng — Hoà đúng, và nó lộ ra 1 quy luật chung

### KHÁM

Present **đã có sẵn 5 khổ** (`StagePresetPanel.tsx:6-7`): 16:9 · A4 ngang/dọc · A3 ngang/dọc —
"bấm 1 khổ → ÁP NGAY (đổi + dàn lại)". Nhưng **lối vào sai chỗ**: nó là 1 nút trên thanh công cụ
(`Toolbar.tsx:198`), tức **phải vào trong trình sửa rồi mới chọn được khổ**. Màn trống hiện tại chỉ
là 1 dòng chữ (`PresentEditor.tsx:1644`): *"Bắt đầu bằng 1 trang trắng, hoặc chọn Mẫu ở cột trái"*.

Hệ quả thực tế: người dùng dàn xong 7 trang ở 16:9 rồi mới nhận ra hồ sơ khách cần in **A3 dọc** →
đổi khổ → dàn lại toàn bộ. **Chọn sai thứ tự ngay từ bước đầu.**

### Quy luật chung vừa lộ ra (Luật #6 — Đồng Bộ)

Chặng 2 và chặng 3 đang cần **cùng một thứ**: một **màn chọn đầu chặng** trước khi vào không gian
làm việc. Khác nhau chỉ ở **trục chọn**:

| Chặng | Màn chọn đầu chặng | Trục chọn | Hiện trạng |
|---|---|---|---|
| 2 · Rendering | "Chọn việc muốn làm" | **việc** (tool) | ✅ có — nhưng chỉ lộ 6/20 (mục 3) |
| 3 · Presenting | *(chưa có)* | **khổ giấy / loại file** | ⛔ thiếu — khổ đã code xong nhưng nằm sâu trong toolbar |
| 1 · Drafting CAD | *(chưa khảo sát)* | khổ bản vẽ / tỉ lệ? | ⬜ cần khám riêng |

→ Đề xuất: làm **1 component dùng chung** (`StageEntryScreen`) cho cả 3 chặng, không viết 3 lần.
Đúng tinh thần Luật #6, và tránh đúng cái bẫy "làm rồi làm lại".

### Cơ chế tự nhận định dạng khi chạy flow

Hoà nêu: *"trong trường hợp chạy flow thì nó tự nhận định dạng để ra đến cửa sổ edit"* — tức **vào
Present từ nút Chạy flow thì KHÔNG hỏi lại**, tự chọn khổ rồi mở thẳng trình sửa. Đúng, và IF đã có
đủ dữ liệu để suy:

| Tín hiệu đã có trong code | Suy ra khổ |
|---|---|
| Tỉ lệ ảnh render đầu vào (16:9 / 3:2 / 4:3) | 16:9 → khổ 16:9 trình chiếu; 3:2·4:3 → A4/A3 ngang |
| Đích xuất người dùng đã chọn ở Render (`Toolbar.tsx:139` đã có mục "PDF in 300dpi (A3/A4)") | chọn PDF in → A3/A4 thay vì 16:9 |
| Số ảnh trong lượt chạy | 1 ảnh → 1 trang bìa; nhiều ảnh → board nhiều trang |

**Nguyên tắc**: tự đoán **có thể sai** → luôn hiện 1 dòng đổi được ngay trên đầu trình sửa
("Đang dùng **A3 dọc** — đổi khổ"), **không** bắt quay lại màn chọn. Tự động nhưng không khoá tay.

---

## 6. Xếp hàng (Luật #8b) — 3 việc, 3 mức chi phí khác nhau

| Mã đề xuất | Việc | Chi phí | Xếp vào |
|---|---|---|---|
| `2.2.60` | **Sửa tràn khung thanh đầu** — bỏ reveal ngược ở `lg`, gom Mở tệp/Xuất thành 1 menu "Tệp", áp priority+ overflow, đảm bảo nút Chạy flow + user KHÔNG BAO GIỜ văng | Rẻ, 1 file | **Sprint 1 (chen ngay)** — đây là lỗi chặn thao tác, không phải việc đẹp-xấu |
| `2.2.61` | **Dời AiTierMenu vào Cài đặt** + chấm trạng thái chỉ hiện khi mock | Rẻ | **Sprint 1**, cùng đợt 2.2.60 (cùng file `Header.tsx`, đúng Luật Đồng Bộ) |
| `2.2.62` | **Tái cấu trúc Tool Mode thành 3 bước + Thẻ Gu** — lộ đủ 20 node, gộp khối 2.0 Ý tưởng vào 2.2 | Trung bình, không cần backend mới (node đã có hết) | **Sprint 3** — sau khi audit toàn bộ tool Render (Sprint 3 cũ) xong, vì audit đó chính là thứ quyết định thẻ nào vào bước nào |
| `2.3.61` | **Màn chọn đầu chặng Present** (khổ giấy / loại file) + tự nhận khổ khi vào từ Chạy flow — dùng chung component `StageEntryScreen` với 2.2.62 | Rẻ-trung bình (khổ đã có, chỉ đổi lối vào) | **Sprint 3, cùng đợt 2.2.62** — bắt buộc cùng đợt vì dùng chung 1 component (Luật #6) |
| `2.2.63` | **Bộ map PBR** (normal/roughness/AO/height) — node mới thật | Đắt, cần provider mới | Backlog, sau Sprint 4 |
| `2.2.64` | **Đa góc nhìn nhất quán 1 phòng** — node mới thật | Đắt | Backlog, sau Sprint 4 |

**Lưu ý xếp hàng quan trọng**: `2.2.62` (tái cấu trúc Tool Mode) **phải nằm SAU** bước audit toàn bộ
tool Render — nếu làm trước, audit xong lại phải xếp lại thẻ lần nữa. Đúng tinh thần "làm 1 lần".

---

*Cowork, 29/07/2026. Đã đọc trực tiếp: `Header.tsx`, `ToolModeHome.tsx`, `ToolModeForm.tsx`,
`RenderToolModeOverlay.tsx`, `StudioBar.tsx`, `task-cards.ts`, `registry.ts`, `defs/*.ts`,
`gu.ts`, `gu-reference.ts`, `phases.ts`, `globals.css` trên máy Hoà. Mã 2.2.60-2.2.64 là ĐỀ XUẤT —
Claude Code kiểm tra không trùng số thật trước khi dán vào cây.*
