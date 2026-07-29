# Bố cục cross · Cơ chế cộng tác — KHÁM + TƯ VẤN

---

# A · 4 NHÓM XẾP DẠNG CROSS

Chốt theo Hoà. Bố cục: **4 ô vuông chia 4 góc, rãnh giữa tạo thành hình chữ thập, Thẻ Gu nằm đúng
giao điểm.**

```
┌───────────────┬───────────────┐
│  01 Ý TƯỞNG   │   02 DỰNG     │
│               │               │
│        ┌──────────────┐       │
├────────│   THẺ GU     │───────┤   ← giao điểm = trục xoay của cả 4 nhóm
│        └──────────────┘       │
│   03 SỬA      │   04 XUẤT     │
│               │               │
└───────────────┴───────────────┘
```

**Vì sao cross tốt hơn 4 cột ngang:**

| | 4 cột ngang | Cross 2×2 + tâm |
|---|---|---|
| Thứ tự đọc | trái→phải, ép thành **quy trình 1 chiều** | chữ Z, vẫn có thứ tự nhưng **không ép** |
| Thực tế nghề | sai — Hoà nhảy qua lại giữa Dựng và Sửa hàng chục lần | đúng — 4 vùng ngang hàng, đi lại tự do |
| Thẻ Gu | nằm trên đầu, **rời khỏi 4 nhóm** | nằm **giữa**, thấy rõ là **trục xoay** cả 4 nhóm đều ăn theo |
| Màn cao 900px | 4 cột hẹp, mỗi cột phải cuộn riêng | 4 ô vuông vừa khít, không cột nào phải cuộn |
| Cảm ứng | cột hẹp, ngón tay khó trúng | ô vuông to, chạm dễ |

Bố cục cross **nói đúng một điều mà 4 cột nói sai**: gu là trung tâm, 4 nhóm là 4 hướng — không
phải 4 bước bắt buộc đi tuần tự.

Màn hẹp (<820px): cross tự xếp thành 1 cột dọc, Thẻ Gu lên đầu (dính trên khi cuộn).

---

# B · CƠ CHẾ CỘNG TÁC

## B1. KHÁM — IF đã có bộ xương, nhưng đang thiếu đúng khúc giữa

| Mảnh | File | Trạng thái thật |
|---|---|---|
| Con trỏ đồng đội | `components/collab/LiveCursors.tsx` (69 dòng) | ✅ **viết tốt** — đổi flow-space→screen theo viewport React Flow nên bám đúng khi pan/zoom, spring mượt, `pointer-events:none` không chặn chuột |
| Thanh avatar online | `components/collab/PresenceBar.tsx` (85 dòng) | ✅ có, +N khi tràn |
| Chat nhóm | `components/ChatPanel.tsx` (162 dòng) | 🟡 chạy bằng **polling 3 giây** — comment ghi rõ *"LAN nội bộ là đủ mượt; realtime WebSocket để dành bản cloud"* |
| Presence phía server | `lib/server/auth.ts:108,130` | 🟡 `lastSeenAt` cập nhật kèm phiên đăng nhập, tiết lưu 20s. Ghi rõ *"presence chỉ là thông tin PHỤ: ghi hỏng thì bỏ qua"* |
| Ghi chú lên ảnh | `util.annotate` — *"Vẽ / ghi chú lên ảnh (feedback khách) — modal, 0 credit"* | ✅ có, nhưng **rời rạc**: là 1 node trong flow, không phải luồng góp ý |
| **Đồng bộ nội dung thật** (node · cạnh · tham số · slide) | — | ❌ **KHÔNG CÓ** |

## B2. Chẩn đoán — vì sao "giống Miro nhưng chưa tối ưu"

**Gốc vấn đề, nói thẳng:** IF đang đồng bộ **"ai đang ở đâu"** nhưng **không** đồng bộ **"ai đang sửa
gì"**.

Hệ quả cụ thể: hai người mở cùng dự án → **thấy con trỏ nhau bay qua bay lại**, nhưng người kia thêm
node, đổi tham số, chạy render thì **màn hình bên này không đổi gì cả**. Con trỏ hứa một thứ mà hệ
thống không giao được.

**Trạng thái này tệ hơn là không có con trỏ.** Không có gì thì người dùng biết phải gọi điện nói
chuyện. Có con trỏ bay thì họ tưởng đang cộng tác thật, rồi hai người ghi đè lên nhau và mất việc.

## B3. Nghiên cứu ngoài — và vì sao **không nên** copy Miro

### Hai trường phái đồng bộ

| | **OT** (Operational Transform) | **CRDT** |
|---|---|---|
| Ai dùng | Google Docs · **Figma** · Taskade | **Yjs** (phổ biến nhất) · Automerge · Linear · Notion · Obsidian Sync |
| Cần máy chủ trung tâm | **Bắt buộc** | Không — 2 máy sửa offline hàng giờ vẫn hội tụ |
| Chi phí bộ nhớ | ~2 MB / workspace 2 triệu ký tự | **34-66 MB** cho cùng nội dung (gấp 17-33 lần — do tombstone + ID + vector clock mỗi ký tự) |
| Hợp với | SaaS luôn online | **local-first · offline** |

### Điều này nghĩa gì với IF — 2 kết luận

**① IF phải chọn CRDT, không phải OT.** Vì IF là **local-first**: file nằm ở
`~/InteriorFlow/Projects`, backup `.ifpack` được `SPEC-FILE-MANAGER.md` gọi là *"điều kiện sống"*.
OT bắt buộc máy chủ trung tâm — mâu thuẫn trực tiếp với triết lý đó. (Figma dùng OT được vì Figma
**không** local-first.)

**② Chi phí CRDT với IF gần như bằng 0.** Con số 17-33× kia là cho **văn bản dài** (mỗi ký tự một ID).
Tài liệu của IF không phải văn bản — là **đồ thị node**: ~10-100 node, mỗi node vài tham số. Vài
nghìn phần tử, không phải vài triệu ký tự. **Nhược điểm lớn nhất của CRDT không áp vào IF.** Đây là
trường hợp hiếm mà lựa chọn "đúng triết lý" cũng là lựa chọn "rẻ".

### Vì sao Miro là hình mẫu SAI

Miro là công cụ **động não** — nhiều người cùng dán giấy nhớ một lúc, không ai chịu trách nhiệm về
một bản giao cuối. IF là dây chuyền **sản xuất hồ sơ giao khách** — có bản chính, có người ký, có
trách nhiệm.

**Nhu cầu thật của một studio nội thất, xếp theo giá trị:**

| Hạng | Nhu cầu | Miro giải quyết? | Giá trị / chi phí |
|---|---|---|---|
| **1** | **Sếp/khách ghim góp ý đúng chỗ** trên ảnh render hoặc trang trình bày, giao cho ai, đánh dấu đã xử lý | ✅ (comment) | **Cao nhất, rẻ nhất — không cần realtime** |
| **2** | **Không giẫm chân** — biết ai đang mở dự án, cảnh báo trước khi 2 người cùng sửa | ❌ Miro không có khái niệm này | Cao, rẻ |
| **3** | Sửa đồng thời thật, thấy nhau gõ | ✅ (cốt lõi Miro) | **Thấp nhất, đắt nhất** — hiếm khi 2 designer sửa cùng 1 render cùng lúc |

**Cái IF đang cố làm (hạng 3) là cái ít giá trị nhất. Hai cái giá trị nhất thì chưa có.**

## B4. ĐỀ XUẤT — 3 tầng, đúng thứ tự giá trị

### Tầng 1 · Ghim góp ý *(async — không cần realtime, làm được ngay)*

Một luồng góp ý duy nhất, dùng chung cả 3 chặng:

- Ghim vào **toạ độ cụ thể**: điểm trên ảnh render · điểm trên trang Present · 1 node trên canvas.
- Mỗi ghim là **một mạch trao đổi**: nội dung · người viết · thời gian · trả lời · **✓ Đã xử lý**.
- **Gán người** + đếm số ghim chưa xử lý trên thanh đầu.
- **Không cần WebSocket** — polling 3 giây như `ChatPanel` đang làm là quá đủ cho góp ý.
- Tái dùng `util.annotate` làm công cụ vẽ khoanh vùng khi cần chỉ vào một mảng cụ thể.

> Đây là thứ giải quyết **90% nhu cầu cộng tác thật** với **10% chi phí** của đồng bộ thời gian thực.

### Tầng 2 · Khoá mềm — "ai đang mở"

- Mở dự án đang có người khác mở → dải báo: *"Hoà đang mở dự án này (2 phút trước)"* + 2 lựa chọn:
  **Mở chỉ xem** hoặc **Mở để sửa (có thể ghi đè)**.
- Dữ liệu đã có sẵn: `lastSeenAt` ở `lib/server/auth.ts`. Chỉ cần **đọc ra và hiện lên**.
- **Khoá mềm, không khoá cứng** — đúng tinh thần local-first: không bao giờ chặn người dùng khỏi
  file của chính họ; chỉ cảnh báo.

### Tầng 3 · Đồng bộ thật bằng CRDT *(chỉ khi có nhu cầu thật)*

- **Yjs** cho `nodes`/`edges`/`params` và cho `EditorSlide` của Present.
- Presence (con trỏ, avatar) **giữ nguyên đường riêng** — nghiên cứu xác nhận: presence là bài toán
  **tách rời** khỏi đồng bộ tài liệu. Presence được phép mất gói, không cần lưu; tài liệu thì không.
- `LiveCursors.tsx` hiện tại **giữ nguyên, không phải viết lại** — nó đã đúng.

### Quyết định cần chốt ngay — về con trỏ đang có

Hai đường, phải chọn một, **không được để nguyên như hiện tại**:

| Đường | Làm gì | Khi nào chọn |
|---|---|---|
| **A · Tạm ẩn** | Ẩn `LiveCursors` cho tới khi Tầng 3 xong. Giữ `PresenceBar` (avatar "ai đang online" là thông tin **thật**, không hứa gì thêm) | **Khuyến nghị** — trung thực, rẻ, không mất code (chỉ 1 cờ) |
| **B · Gắn nhãn** | Giữ con trỏ nhưng ghi rõ *"Đang xem cùng — nội dung chưa đồng bộ, cần tải lại để thấy thay đổi"* | Nếu Hoà thấy con trỏ vẫn có ích cho việc gọi điện chỉ nhau |

## B5. Xếp hàng (Luật #8b)

| Mã đề xuất | Việc | Chi phí | Xếp vào |
|---|---|---|---|
| `2.2.84` | **Bố cục cross 4 nhóm** + Thẻ Gu ở tâm | Rẻ (CSS) | Sprint 3, thay bố cục 4 cột trong `2.2.71` |
| `7.24` | **Chốt A hay B cho con trỏ** — bịt lời hứa suông | Rất rẻ (1 cờ) | **Sprint 1 — làm ngay**, vì đây là lỗi tin cậy, không phải thiếu tính năng |
| `7.25` | **Tầng 1 — Ghim góp ý** dùng chung 3 chặng, polling 3s, có ✓ đã xử lý + gán người | Trung bình | **Sprint 4 — ưu tiên cao nhất trong nhóm cộng tác** |
| `7.26` | **Tầng 2 — Khoá mềm "ai đang mở"** (đọc `lastSeenAt` đã có) | Rẻ | Sprint 4, cùng 7.25 |
| `7.27` | **Tầng 3 — CRDT Yjs** cho graph + slide; presence giữ đường riêng | **Đắt** | Sprint 6+, **chỉ làm khi Tầng 1-2 đã dùng thật và vẫn thiếu** |

**Thứ tự bắt buộc**: `7.24` (trung thực) → `7.25`+`7.26` (giá trị cao, rẻ) → `7.27` (đắt, có thể
không bao giờ cần). Làm ngược — nhảy thẳng vào CRDT — là đổ tiền vào nhu cầu hạng 3 trong khi hạng
1 và 2 còn trống.

---

*Cowork, 29/07/2026. Đã đọc: `components/collab/LiveCursors.tsx`, `PresenceBar.tsx`,
`components/ChatPanel.tsx:26-28`, `lib/server/auth.ts:108,130`,
`lib/server/edgecase-concurrency.test.ts:126-133`, `lib/nodes/registry.ts:893`. Nghiên cứu ngoài:
Taskade OT vs CRDT 2026 (số liệu bộ nhớ 17-33×), HLD Handbook collaborative editing, Yjs/Automerge.
Mã đề xuất — Claude Code kiểm tra trùng số trước khi dán.*
