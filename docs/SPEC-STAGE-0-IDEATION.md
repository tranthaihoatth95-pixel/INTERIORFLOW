# SPEC — CHẶNG 0 · Ý TƯỞNG & MOODBOARD

> Duyệt 01/08/2026 — xem `CHOT-DUYET-SPEC-DOT2-2026-08-01.md`.
> **Phát hiện 26/07: IF thiếu HẲN một chặng.**
> IF hiện có CAD → Render → Present. Nhưng nghề thiết kế **bắt đầu trước CAD**:
> mò mẫm · thu thập · bàn bạc · chốt hướng.
> Bằng chứng: deck concept thật luôn có "Hiểu về dự án · Nghiên cứu liên quan · Local DNA ·
> Câu chuyện thiết kế" — **toàn bộ là sản phẩm chặng 0**, mà IF không có chỗ nào làm nó.

> ⭐ **App chỉ chứa kết quả cuối, không chứa quá trình mò mẫm → designer không sống trong đó
> được.** Đó chính là cảm giác "vô hồn".

---

## 1. Ba thứ đừng lẫn

| | Là gì | Quyết định |
|---|---|---|
| Chat | Tán gẫu | ❌ **không làm** — Lark/Zalo đã có |
| **Bình luận ngữ cảnh** | Ghim **lên sản phẩm đã có** | ✅ `SPEC-COLLABORATION.md` |
| **Canvas moodboard** ⭐ | Không gian **trước khi có sản phẩm** | ✅ **file này** |

## 2. Lấy gì của ai

| | **Milanote** | **Miro** |
|---|---|---|
| Mạnh ở | **Thu thập & sắp xếp** — board lồng nhau · note · link · to-do · cột | **Workshop real-time** — nhiều con trỏ · sticky · timer · vote |
| Hợp giai đoạn | Nghiên cứu (1 người hoặc vài người) | Họp brainstorm cả nhóm |
| IF lấy | ✅ **Board lồng + thả mọi thứ vào** | 🟡 chỉ **bình luận**, KHÔNG lấy workshop |

## 3. Không xây từ đầu — dùng lại cái đã có

| Đã có | Dùng lại cho moodboard |
|---|---|
| Canvas React Flow (chặng Render) | Hạ tầng canvas vô hạn |
| Library + Reference panel | Kho ảnh thả vào |
| **Gu Engine 10 trục** | ⭐ Chấm gu **tự động từ moodboard** |
| ATLAS vật liệu | Ảnh vật liệu có **mã · giá · NCC** |

## 4. ⭐ Chỗ IF thắng Miro/Milanote — moodboard KHÔNG chết ở đó

```
Moodboard ──→ chấm 10 trục gu tự động       (Miro: không)
          ──→ sinh prompt cho Render         (Miro: không)
          ──→ xuất thành TRANG DECK          (Miro: không)
          ──→ vật liệu kèm mã + giá → BOQ    (Miro: không)
```
Miro dừng ở "bức tường ảnh đẹp". **IF biến nó thành dữ liệu chảy tiếp xuống 3 chặng sau.**

## 5. Phân bậc

| Bậc | Nội dung |
|---|---|
| **N** | Canvas vô hạn · thả ảnh/link/note/file · nhóm & board lồng · vẽ mũi tên · dải màu · **KHÔNG real-time** |
| **P** | Chia sẻ link xem + **bình luận** (async) · chấm gu tự động từ board · xuất board → trang deck |
| **L** | Board → prompt Render · vật liệu kèm mã/giá → BOQ · gợi ý reference hợp gu từ Library · **nạp KnowledgePack** |

⚠️ **Đừng làm real-time nhiều con trỏ ở bậc N** — bài toán khó (CRDT, presence), xung khắc
local-first. Bậc N chỉ cần **moodboard cá nhân + link xem/bình luận**; đủ 90% nhu cầu studio.

## 6. Vị trí trong kiến trúc

Chặng 0 đứng **trước CAD** trong ray điều hướng: `Ý tưởng → CAD → Render → Present`.
Route: `/projects/[id]/ideation` — thuộc scope project (luật §1B).

---

## 7. MOODBOARD CÓ CẤU TRÚC — template input → output

> **Không phải moodboard tự do kiểu Miro** — mà là **sinh ý tưởng có khung**
> *(structured ideation)*: bay bổng ở phần cảm hứng, nhưng **mỗi bước truy được về nguồn**.
> Đó là thứ làm CĐT gật đầu.

### Quy trình gốc của nghề (chuẩn ngành, template hoá được)
```
TRÍCH XUẤT  →  TỔ HỢP  →  DIỄN GIẢI
ảnh cảm hứng   đường nét gốc   biến thể   không gian thật
(元素提取 → 组合 → 演绎 — quy trình thấy trong deck concept cao cấp)
```

### Bộ template — mỗi cái là một phiếu: **CẦN GÌ · MÁY LÀM GÌ · RA GÌ**

| Template | Input | Ra cái gì |
|---|---|---|
| **Site & Context** | Toạ độ dự án | Nắng · gió · view · khí hậu · bối cảnh *(tự sinh — xem SPEC-ARCHINOTE §9.1)* |
| **Local DNA** | Vị trí + từ khoá vùng | Nghề truyền thống · vật liệu bản địa · màu · motif |
| **Element Extraction** ⭐ | 3–5 ảnh cảm hứng | **Đường nét gốc → biến thể → gợi ý ứng dụng vào không gian** |
| **Style DNA** | Ảnh thả tim + brief | Radar 10 trục · palette · **từ khoá EN để tra cứu tiếp** |
| **Material & Light** | Style DNA + ATLAS | Bảng vật liệu có mã/giá · hướng ánh sáng |
| **Spatial Concept** | Tất cả trên + mặt bằng | Zoning · luồng · điểm nhấn |

**Tự điền**: search tên dự án → toạ độ, brief, gu CĐT đã có sẵn tự chảy vào đúng ô.
Điền xong ô này thì ô sau tự có dữ liệu.

### Trích nét từ ảnh — KHÔNG cần AI, 0 credit, chạy tức thì

| Thao tác | Kỹ thuật | Ra cái gì |
|---|---|---|
| Trích đường bao | **Canny / Sobel** edge detection | Nét viền công trình |
| Giảm về mảng | **Posterize / threshold** | Khối hình chính |
| Nét thành vector | **Potrace** (contour → SVG path) | Đường vẽ lại được, phóng to không vỡ |
| Trích màu | K-means | Palette 6 màu + mã HEX |
| Trích chất liệu | Cắt vùng + tag | Ảnh texture cho ATLAS |

⚠️ **Không chính xác như vẽ tay** — nhưng cho **cơ sở để designer chỉnh tiếp**.
Máy làm phần cơ học, người làm phần thẩm mỹ. Muốn chính xác hơn thì SAM (tách vùng) — **bậc P**.

### ⭐ "Thả tim" — một thao tác, BA tác dụng
```
Bấm ♥ lên ảnh
   ├─→ Perceptron học gu (đã có sẵn)
   ├─→ Trích ngay: palette · đường nét · vật liệu
   └─→ Cộng vào radar 10 trục của dự án
```
Người dùng chỉ làm **một cử chỉ tự nhiên**, máy thu **ba loại dữ liệu**. Không bắt ai điền form.

### Vai Vitals trong chặng 0
Đúng vai ①+③ (tra cứu có nguồn + dẫn đường):
- **Hỏi ngược để chốt hướng** — *"Dự án ven biển, khách Hàn: nghiêng bản địa hay quốc tế?"*
- **Từ khoá tiếng Anh để tra tiếp** (từ điển KTS)
- Lọc nguồn tham khảo theo **hạng A–D** (`SPEC-KNOWLEDGE-BASE.md`)

⚠️ **Kho ảnh KHÔNG lấy từ Pinterest** — luật bản quyền §6 `SPEC-IF-LIBRARY.md`:
ảnh studio · CC0 · AI sinh · user tự nạp.

---

*v1.1 (thêm §7 moodboard có cấu trúc — template input→output) · 2026-07-26 · Ben soạn theo ý Hoà.*
