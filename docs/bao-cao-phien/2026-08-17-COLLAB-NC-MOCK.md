# BÁO CÁO · phiên COLLAB-NC-MOCK — 17/08

**Vai:** phiên phụ COLLAB-NC · Tôi (agent) nhận từ T phiếu `docs/phieu-giao/COLLAB-NC-MOCK.md`.
**Vùng ghi:** đúng 3 tệp — NC + Mock + báo cáo này (kiểm bằng `git status --short`).

---

## ⓪b — Mốc git
`git log --oneline -1` → `afb1ba2 feat(soi): soi:cam-dien` · `git rev-list --count HEAD..main` = **0**. Đúng vị trí, đi tiếp.

## ⓪ — Tiền đề: **XÁC NHẬN, có đính chính**
Bảy mảnh mà tiền đề nêu **đều tồn tại** trong repo hôm nay (verify bằng `ls -la` + `sed`):
- `FlowCanvas.tsx` 43 634B · `NoteNode.tsx` `color-mix(warning + card)` · `CommentPin.tsx` `Popover` + `useFlowStore.comments`
- `ConceptForm.tsx` 18 843B · `MoodboardModal.tsx` bọc `<ConceptForm />`
- `distill/engine.ts:35` generic `distill()` · `dna/distiller.ts:71` `distillDnaFromAssets`
- `DesignDnaCardPanel.tsx` 18 350B

🔴 **Đính chính (không BÁC toàn bộ):** `MoodboardModal.tsx:4` tự khai *"Overlay 'Tạo Moodboard' **cho chặng CONCEPT**"* và mount ở `HomeScreen.tsx:692` (chặng 2D), **không phải chặng 3D**. Nói "đã có ConceptForm trong chặng 3D" là sai. Đúng phải là "có ConceptForm ở chặng 2D, sẵn khuôn để mở rộng sang 3D". Việc "nối" vì vậy cần thêm **quyết định định vị lại**: form là công cụ xuyên chặng, hay riêng 3D Collab? — đã nêu ở NC câu 2 và ⑦b.

---

## 1 · Tổng quan
Trả lời **5 câu** của phiếu, dựng **1 mock 3 ca** cho hướng đề xuất (b). Đề xuất Collab đứng **TẦNG trên mode Node của chặng 3D** dưới dạng **Cửa Sổ Thảo Luận** — tái dùng khuôn `CuaSoCongCu` đã có, không đẻ mode thứ ba, không dựng vỏ mới. Ba khuôn form ban đầu: Moodboard (đã có) · Bảng so cực · Câu chuyện 3 hồi. Việc thật cần thi công sau: mở `ProvenanceInput` union sang 4 `kind`.

## 2 · Chi tiết từng mục

### Năm câu — kết luận ngắn

| # | Câu | Kết luận |
|---|---|---|
| 1 | Collab đứng đâu? | **(b) TẦNG trên mode Node** — Cửa Sổ Thảo Luận. **KHÔNG** (a) vì phá chốt 13/08 "2 mode". **KHÔNG** (c) vì phá §6.2 HOP-DONG (sidebar không đổi theo chặng) + mất ngữ cảnh. |
| 2 | Bao nhiêu khuôn form? | **BA**: Moodboard (`ConceptForm.tsx` mở rộng) · Bảng so cực · Câu chuyện 3 hồi. Không thêm SWOT/persona/mind-map (nhiễu, không phải nghề nội thất). Mở rộng bằng registry sibling ở `components/form/`, không đụng `ConceptForm.tsx`. |
| 3 | Dây tới Thẻ DNA? | **① Điểm thiếu chính:** `ProvenanceInput` chỉ có `kind:'image'` (`distiller.ts:44` `if (s.kind !== 'image') return []`) — cần mở union `'image'|'note'|'form'|'pin'`. **② Không hook** từ `FlowCanvas` → `distill`. Cần **1 nút "Chưng cất"** ở góc cửa sổ Thảo Luận, gọi `distillDnaFromAssets` với đầu vào GỘP. **③ Đã có** `mergeDistilledIntoCard()` (`distiller.ts:97`) giữ nguyên field `verified` — an toàn cho merge lại. |
| 4 | Có phá luật "thảo luận không cần cổng ra"? | **Có RỦI RO** nếu ép mọi phiên sinh Thẻ DNA. **Giải**: một chế độ + **một nút** (không tự chạy). Chưa bấm → thảo luận thuần, đóng cửa sổ không sinh gì; bấm → chưng cất một lần. Nghiệm thu đo được ở NC câu 4. |
| 5 | 4 entry soi:cam-dien? | **KHÔNG liên quan**. Cả 4 (`chuan-net-3d`/`wireframe-dinh-bien-dien`/`part-lock-cau-kien`/`mirror-doi-xung-chuan-net`) thuộc đường **AI dựng cấu kiện 3D từ ảnh** (mesh → phân vùng → khoá). Collab là đường **KTS chưng cất Thẻ DNA từ nhiều nguồn**. Điểm gặp duy nhất là hạ nguồn ở `furniture-slot-set` (Thẻ DNA nuôi slot). |

### Mock — 3 ca (a/b/c) × 2 theme

| Ca | Kịch bản | Highlight |
|---|---|---|
| **A** — canvas trống | Hoà mở dự án lần đầu → Cửa sổ Thảo luận trống, hiện 3 khuôn thẻ gợi ý ở empty state | Nút "Chưng cất" `aria-disabled` qua token `--mo-vo-hieu` — không phải nút giả |
| **B** — đang làm việc | 3 ảnh + 2 sticky + 1 form Bảng so cực đang điền → Thẻ DNA dở 4 lớp `inferred`, lớp "Ý đồ" trống | Có ví dụ cửa sổ SẢN XUẤT (Render nháp) đứng cạnh cửa sổ THẢO LUẬN → phân biệt bằng nhãn "Thảo luận" vs "Sản xuất" ở thanh trên |
| **C** — chốt xong | Đã bấm "Chưng cất" v1, lớp "Ý đồ" đã `verified` từ Câu chuyện 3 hồi → sang mode Vẽ 3D | Nhãn *"Thẻ DNA v1 đã lưu · 1 lớp đã xác nhận, 4 lớp máy suy"* hiện góc canvas |

### Kiểm kỹ thuật của mock

| Ràng buộc §6 | Trạng thái |
|---|---|
| Thu/mở nhớ giữa phiên | mock tĩnh — không áp; comment trong NC câu 4 |
| Sidebar không đổi theo chặng | ✅ vẽ 2 cụm cố định (Xưởng/Dự án), chỉ mục "3D" `dang` |
| Thanh công cụ không chứa lối đi | ✅ ModeSwitchBar chỉ có Node/3D switch |
| Nấc/cỡ lưu theo máy | mock tĩnh — không áp |
| CẤM đụng `--accent*` + thêm token màu | ✅ khai lại nguyên văn giá trị `globals.css:19-25` — mocking pattern chuẩn (kiểm 3 mock khác cũng làm vậy: `2D Kỹ thuật.dc.html` v.v.) |
| Kéo-thả bằng bàn phím | mock tĩnh — không có drag; empty state khuôn thẻ có `tabindex="0"` |
| Chữ theo từ điển máy | ✅ dùng "cửa sổ" · "khuôn form" · "chưng cất" · "Thẻ DNA" — không lệch mới |

### Tự chấm 2 skill design (nhanh, trước khi nộp)

| Trục | Kết quả |
|---|---|
| **Ấn tượng đầu** | Mỗi ca có H2 + kịch bản người thật + label rõ; không phải mock rỗng ✅ |
| **Usability** | Nút mờ có `aria-disabled`+`title`; nút chưng cất label rõ. 🟡 Chưa có "ô giải nghĩa có hình" (Tooltip mở rộng) — mock không dựng vì ngoài phạm vi phiếu |
| **Hierarchy** | Grid 3-cột (sidebar/canvas/panel) rõ; cửa sổ thảo luận có nhãn phân loại ở thanh trên ✅ |
| **Consistency** | Cùng token cho 3 ca; cùng bo `--r-2/--r-3`. 🟡 **Dấu định danh 2px đáy card** (chốt 15/08) mock **không có** — dùng nhãn chữ ở thanh trên thay; nếu triển khai code phải bổ sung dải 2px |
| **Accessibility** | `aria-label` cho sidebar/canvas/panel; `aria-pressed` cho mode buttons; `role="tablist"` cho theme toggle; opacity nút mờ qua token đúng WCAG (`0.5` tối / `0.62` sáng) ✅ |

## 3 · Tổng kết lại vấn đề
Collab chặng 3D **không** là mode mới, **không** là màn mới — là **một loại cửa sổ mới** (`moiTruong: 'ban-bac'`) sống trong cửa sổ công cụ đã có. Đây là hệ quả logic của: chốt 13/08 (chặng 2 chỉ 2 môi trường) + title `ModeSwitchCell.tsx:32` (mode Node = "Render + Mood + Collab") + chốt 16/08 (cửa sổ THẢO LUẬN có thể không cổng ra) + luật §2 IF-KIEN-TRUC (cửa sổ khác nhau đứng cùng canvas). Ba khuôn form ban đầu ít nhưng cụ thể; đầu ra Thẻ DNA là "quyết định đã chốt" — nối cả 3 chặng qua `matId` và `DesignDnaLayers`.

## 4 · Đánh giá khách quan

**Điểm mạnh của đề xuất:**
- ① Đúng luật Đ2 (nhìn vào trong trước) — không đẻ khuôn, tái dùng `CuaSoCongCu`.
- ② Đúng luật T5 (người quyết cuối) — nút chưng cất do người bấm, không tự chạy.
- ③ Đẳng cấu §9 rõ ràng — DistillEngine đã là "một cỗ máy, nhiều mặt tiền": Thẻ DNA · auto-define cấu kiện · Company DNA Pack — Collab là **mặt tiền thứ 4**, không phải engine thứ hai.

**Điểm yếu, ghi thẳng:**
- ① **Chưa chạy với KTS thật.** Ba khuôn form đề xuất là suy từ chốt Hoà, không đo từ dùng thật. Bảng so cực có thể không đáng chi phí học nếu KTS bấm bừa.
- ② **Việc thi công có ràng buộc chéo lib/**. Mở `ProvenanceInput` union đụng `lib/distill/types.ts` — cần agent thi công đo cẩn thận, có test bảo vệ để `image` cũ không vỡ.
- ③ **Câu chuyện 3 hồi** là khuôn khó dựng đẹp — dễ trở thành 3 textarea đơn điệu. Cần chi tiết hơn ở phiếu thi công (vd có ảnh minh hoạ cho mỗi hồi).
- ④ **Panel phải "Thẻ DNA"** hiện đè trong ba ca ở mock — trong app thật, panel này thuộc `DesignDnaCardPanel` đã có; chưa kiểm được nó mount ở đâu trong chặng 3D. Có thể nó chưa mount trong render-studio.

## 5 · Hướng xử lý — hai góc độ

### Hướng A · Thi công **Cửa sổ Thảo Luận + mở ProvenanceInput** một phiên
- **Ưu:** một phiên đủ để thấy chuỗi thật (sticky→chưng cất→Thẻ DNA); cửa duyệt mắt Hoà nghe rõ.
- **Nhược:** phạm vi rộng — chạm `lib/distill/types.ts` (lõi) + tạo `CuaSoCongCu` biến thể mới + panel Thẻ DNA. Rủi ro va chạm với phiên khác đang mở `lib/dna/*` phải kiểm `claim-keys`.

### Hướng B · Chia hai phiếu độc lập
- **Phiếu 1 — lõi:** mở `ProvenanceInput` union sang 4 `kind`, thêm test, không đụng UI. Nhỏ, kiểm được bằng `tsc`+`test`. Đây là **món dogfood** cho câu 3.
- **Phiếu 2 — vỏ:** dựng `CuaSoCongCu` biến thể `ban-bac` + 2 khuôn form mới + nút Chưng cất. Đợi phiếu 1 xong.
- **Ưu:** rẻ, ít rủi ro, mỗi phiếu tự đứng được; agent thi công không cần biết cả hai đồng thời.
- **Nhược:** hai lượt duyệt mắt; nếu phiếu 2 chờ phiếu 1 thì Hoà nhìn được kết quả cuối chậm hơn khoảng 1 phiên.

## 6 · Đề xuất hướng tốt nhất

**Chọn HƯỚNG B (chia hai phiếu độc lập).** Ba lý do:

1. **Chống rủi ro va chạm.** `lib/distill/types.ts` là lõi — bất kỳ phiên nào đang sờ `dna/`/`distill/` cùng lúc là va. `claim-keys` bắt được khi khai; nhưng thi công lõi trong cùng phiếu với UI làm phần lõi có nguy cơ bị người viết UI "tiện tay" sửa để hợp UI của mình, phá tính chung của engine.
2. **Đúng luật gộp tính năng của Hoà** (`docs/CLAUDE.md` mục "một cỗ máy, nhiều mặt tiền"). Phiếu 1 mở rộng CỖ MÁY (DistillEngine nhận 4 kind), phiếu 2 dựng MẶT TIỀN (cửa sổ Thảo Luận). Không lẫn hai vai.
3. **Rẻ hơn về duyệt mắt.** Phiếu 1 kiểm bằng `tsc`+`test` (không cần Hoà nhìn); phiếu 2 mới cần Hoà duyệt mắt. Tách được thì băng thông Hoà chỉ dùng cho phần thật cần mắt.

---

## ⑦b · CHƯA CHẮC

- **Kịch bản mock chưa chạy với KTS thật.** Ba khuôn form là **suy từ chốt Hoà**, không đo từ dùng thật.
- **`DesignDnaCardPanel` chưa được đo xem có mount trong chặng 3D chưa.** Mock giả sử nó mount; nếu chưa mount, phiếu thi công phải làm thêm mount này.
- **Không grep hết `distillDnaFromAssets` toàn repo** — có thể còn nơi gọi khác tôi chưa thấy.
- **Nút "Sản xuất" vs "Thảo luận"** phân biệt bằng nhãn ở thanh trên; **chốt 15/08** yêu cầu **dải màu đặc 2px đáy card** — mock chưa dựng phần này (ngoài phạm vi phiếu, chỉ Note lại).
- **Câu chuyện 3 hồi** — dựng dạng nào cho không nhàm? Chỉ giả 3 khối text ở NC, chưa mock dạng đầy đủ.
- **File://** đã chọn không kiểm bằng preview server (phiếu cấm dev server). Mock chưa xem trực quan; đọc bằng token là tin cậy được, nhưng hình ảnh vector/layout thật có thể lệch với đọc code.

## ⑦c · HẠN DÙNG KẾT LUẬN

Kết luận này **hết đúng khi**:
- Hoà chọn (a) hoặc (c) ở câu 1 → cả mock lẫn NC phải viết lại.
- Hoà lật "form Moodboard là xuyên chặng" → khuôn 1 phải viết mới thay vì tái dùng `ConceptForm`.
- Mở rộng `ProvenanceInput` union không đạt (vd engine có nhiều nơi ép `kind==='image'` T chưa grep hết) → luồng câu 3 phải đổi.
- Có phiếu khác đụng `lib/dna/distiller.ts` cùng phạm vi khi thi công — `claim-keys` báo thì dừng.
- Panel `DesignDnaCardPanel` không mount được ở chặng 3D vì lý do lõi (vd nó gắn vào store Concept) → phiếu vỏ phải làm mount tổng thể trước.

---

**Đúng phạm vi ghi:**

```
$ git status --short
?? docs/bao-cao-phien/2026-08-17-COLLAB-NC-MOCK.md
?? docs/nc/NC-COLLAB-CHANG-3D.md
?? docs/mocks/mock-collab-chang-3d.html
?? docs/phieu-giao/COLLAB-NC-MOCK.md
```

(Phiếu do T tạo trước, không phải phiên phụ.)
