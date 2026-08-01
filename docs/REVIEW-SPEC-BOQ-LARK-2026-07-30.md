# Soát spec BOQ + PROJECT_STATUS + Lark API của Claude web — đối chiếu code thật

> Đã đọc code thật để soát. **Kết luận: spec này DÙNG ĐƯỢC, chất lượng cao.** Nhưng có
> **bốn khoảng trống code** nó không thể biết, **một lỗ logic** trong phần Lark, và **bản tin bị cắt
> giữa Pattern B**.
>
> Phần dưới xếp theo mức quan trọng, không theo thứ tự của bản gốc.

---

## 1 · 🟢 Tin tốt: BOQ khả thi NGAY — ba mảnh đã xây và đã test

Đây là điều Claude web không biết, và nó đổi hẳn ước lượng chi phí.

| Mảnh BOQ cần | Code thật | Trạng thái |
|---|---|---|
| **Bước 1 `qty_geom`** — diện tích từ hatch | `lib/cad/hatch.ts:55` `polygonArea()` + `:255` `findHatchBoundary()` | ✅ **có, đã test** (`hatch.test.ts:32` assert hình vuông 100×100 = 10000) |
| **Bước 2 đổi đơn vị** — `mm² / 1.000.000` | `polygonArea(poly) / 1e6` đang dùng ở **3 chỗ**: `gu-features.ts:158`, `room-autolabel.ts:161`, `templates.test.ts:48,91` | ✅ **đúng chính xác** công thức Claude web viết |
| **Nhánh `cái / bộ`** — đếm block | `lib/cad/schedule.ts` — `ScheduleRow{key · label · count · w · h · block · specId · ids}`, group theo block key + variant, có sẵn `ELEMENT_TYPE_LABELS` (wall/slab/column/beam/door/window/furniture/space) | ✅ **đã xây xong** — đây là BẢNG THỐNG KÊ Legend C1 |

→ **BOQ không phải xây từ đầu.** Nó là **`schedule.ts` mở rộng thêm nhánh diện tích/chiều dài + nối
giá**. Ước lượng của tôi hạ từ *"cụm lớn"* xuống **"trung bình"**.

Và `ScheduleRow.specId` đã ghi chú *"để nối ProductSpec qua drawingBlock"* → **chỗ neo `matId` đã có
sẵn ý định**, không phải phát minh mới.

---

## 2 · 🔴 Bốn khoảng trống code — phải xử trước khi code BOQ

### ① Không có hàm chu vi

`hatch.ts` export `polygonArea` nhưng **không có `polygonPerimeter`**. Toàn bộ nhánh **m dài** của
Claude web (len chân tường, nẹp, tay nắm thanh) cần `Σ cạnh (mm) / 1.000`.

→ Thêm vào `hatch.ts`, ~10 dòng, cùng cách viết `polygonArea`. **Rẻ, nhưng là chặn cứng** — không có
nó thì 2 trong 7 dòng bảng §1.2 không chạy.

⚠️ Kèm luật Claude web đã nêu và phải làm đúng: *"nẹp cạnh chỉ lấy cạnh biên, không lấy toàn chu vi"*
→ hàm phải nhận **tập cạnh được chọn**, không phải cả polygon. Ký hiệu đề xuất:
`polygonPerimeter(poly, edgeMask?: boolean[])`.

### ② Không có trừ lỗ mở

`findHatchBoundary()` trả về **MỘT biên ngoài**. Luật *"trừ cửa/cửa sổ nếu > 0,5 m²"* cần **phát hiện
lỗ bên trong**.

Chỗ gần nhất đang có: `lib/three/cad-to-obj.ts:296-299` khớp ring theo diện tích lệch < 1% +
`pointInPolygon`. Nhưng đó là **ghép ring**, không phải **trừ lỗ**.

→ Đây là việc thật, không rẻ. Ba đường:

| Đường | Cách | Đánh giá |
|---|---|---|
| **a** | Trừ theo **entity cửa/cửa sổ** đã phân loại (`ElementType.door` / `.window`) nằm trong polygon | ✅ **khuyến nghị** — dùng phân loại đã có, không cần thuật toán hình học mới |
| b | Tìm ring con bằng hình học | Đắt, dễ sai với bản vẽ thật |
| c | Người dùng chọn tay vùng trừ | Rẻ nhất nhưng đúng loại việc mà app phải làm thay |

Đường **a** dùng lại `ELEMENT_TYPE_LABELS` + kích thước danh nghĩa `w`/`h` trong `ScheduleRow` → biết
ngay cửa 900×2200 = 1,98 m² > 0,5 → trừ. **Khớp đúng ví dụ VD1 của Claude web.**

### ③ ⚠️ `MaterialDef` hiện là vật liệu **THỊ GIÁC**, không phải vật liệu **THƯƠNG MẠI**

`SPEC-TONG §3` (và spec này) nói *"mở khoá BOQ bằng cách thêm field `matId` lên `MaterialDef`"*.
Nhưng đọc code thật: `MaterialDef` sống trong `lib/cad/materials.ts` và được dùng bởi
`lib/cad/material-texture.ts` — `toneRgb()`, `generateTexturePixels()`, `paintWood()`.

**Nó là định nghĩa để VẼ TEXTURE.** Nhồi `Giá tham khảo` · `Đơn vị` · `Hao hụt %` · `Quy cách` ·
`Mã thay thế` vào đó là trộn **hai quan tâm khác nhịp sống**: texture đổi khi thiết kế đổi, giá đổi
khi nhà cung cấp đổi.

→ **Khuyến nghị: đừng thêm 6 field thương mại vào `MaterialDef`.** Thêm **một** field neo:

```ts
MaterialDef.atlasRecordId?: string   // record_id trong ATLAS Material Library
```

Còn giá/đơn vị/hao hụt/quy cách để **nguyên trong ATLAS** và cache vào một bảng Prisma riêng
(`AtlasMaterial`). Lợi ích: sửa giá không phải sửa file thiết kế, và **đúng luật vàng** *"dữ liệu điều
phối bay lên Lark"*.

### ④ BOQ phải theo luật "KHÔNG object sống" đã chốt

`schedule.ts` ghi rõ ở đầu file:

> *"Đóng dấu lên bản vẽ: `scheduleToEntities()` trả text/line entity **THƯỜNG** (Q-L3 đã chốt: entity
> thường + nút **"Cập nhật lại"**, KHÔNG object sống) ⇒ PDF/DXF/PNG export ăn theo pipeline có sẵn,
> user xoá/di chuyển được như mọi entity khác."*

→ **BOQ phải làm y hệt**: `boqToEntities()` trả entity thường + nút "Cập nhật lại". Không được làm
bảng BOQ tự cập nhật sống trên canvas — sẽ thành **hai luật trái nhau trong cùng một app**.

---

## 3 · Lark: phát hiện Wiki của Claude web ĐÚNG — và nó **sửa ticket tôi gửi sáng nay**

Đối chiếu code:

| Claude web nói | Code thật | Kết luận |
|---|---|---|
| Host phải là `open.larksuite.com`, không phải `open.feishu.cn` | `lark.ts:21` `DEFAULT_API_BASE = 'https://open.larksuite.com'` | ✅ **đã đúng sẵn** |
| Chỉ có một `app_token` | `lark.ts:28,69` chỉ `LARK_BASE_APP_TOKEN` | ✅ **xác nhận** |
| Base trong Wiki → cần `wiki/v2/spaces/get_node` để lấy `app_token` | **grep `wiki` trong `lark.ts` = 0 kết quả** | 🔴 **code hoàn toàn chưa có** |

### 🔴 Ticket tôi gửi sáng nay THIẾU — phải sửa

Tôi đã bảo Claude Code tách thành `LARK_ATLAS_APP_TOKEN` / `LARK_WORK_APP_TOKEN`. **Sai với ATLAS**,
vì ATLAS nằm trong Wiki nên cần **hai token khác vai**:

| Biến | Giá trị | Dùng cho |
|---|---|---|
| `LARK_ATLAS_NODE_TOKEN` | `Ejk6wjlXoiWN80khYcRjthy3prd` | **Deep link** (`/wiki/{node_token}?table=…&view=…`) |
| `LARK_ATLAS_APP_TOKEN` | ⟵ **giải ra** từ `get_node`, cache | **Mọi call bitable API** |
| `LARK_WORK_APP_TOKEN` | base "Quản lý Công việc" | task + nhân sự (base thường, không Wiki) |

Và luật Claude web nêu rất đúng, phải viết vào code làm comment:
**`node_token` ≠ `app_token`. Lưu cả hai, KHÔNG suy ra từ nhau.** Đây là loại lỗi mất nửa ngày để tìm.

---

## 4 · ⚠️ Một lỗ logic trong phần Lark — và nó riêng của IF

Claude web khuyên:

> *"Serialize: một worker ghi duy nhất mỗi Base (mutex/single-flight)"* để tránh `1254291 write conflict`.

**Lời khuyên đúng — nhưng nó giả định có SERVER.** IF là **local-first Electron, không có server trung
tâm** (đúng kiến trúc đã chốt). Nghĩa là:

> **5 designer mở IF trên 5 máy = 5 writer độc lập. Không máy nào biết máy khác đang ghi.**
> `mutex` trong process không cứu được. `1254291` sẽ xảy ra thật.

Ba đường xử, chọn một và viết vào `IF-ARCHITECTURE-COMPASS.md`:

| Đường | Cách | Đánh giá |
|---|---|---|
| **A · Một máy ghi** *(khuyến nghị)* | Chỉ máy của `Project.owner` được ghi ATLAS/PROJECT_STATUS. Máy khác **chỉ đọc**, có badge *"tiến độ do máy chủ dự án đồng bộ"* | ✅ Rẻ, khớp RBAC 5 vai **đã có** (`1.1.6`), không cần hạ tầng mới |
| B · Mutex qua chính Lark | Một bảng `SYNC_LOCK`, ai ghi được dòng lock thì được ghi | Tự làm distributed lock — loại việc dễ sai và tốn |
| C · Chấp nhận xung đột | Backoff + jitter + retry, ai ghi sau thắng | ⚠️ Chỉ ổn vì `payload_hash` của Claude web làm write **idempotent** — nhưng lịch sử sửa sẽ bẩn |

**Đường A** còn có lợi phụ: giải luôn bài toán *"ai là nguồn ghi"* mà `PROJECT_STATUS` cần, không phải
bàn lại.

---

## 5 · Chỗ tôi KHÔNG xác minh được — Hoà tự kiểm

Nói rõ ranh giới, không nhận vơ:

| Điều | Trạng thái |
|---|---|
| `polygonArea` / `schedule.ts` / `lark.ts` / `.env.example` | ✅ **tôi đọc code thật, chắc chắn** |
| Hệ số hao hụt, ngưỡng 0,5 m², quy cách đóng gói | 🟡 **thông lệ nghề, không kiểm được bằng code.** Nhưng bảng của Claude web khớp với hiểu biết chung — và **luật "hao hụt là CỘT trong ATLAS, không nằm trong code" là lời khuyên đúng nhất trong cả bản spec** |
| Rate limit 50/20/10 req/s · mã lỗi `1254290`/`1254112`/`1254291`/`1254104` | 🟡 nó nói đã tra tài liệu chính thức. **Hợp lý, nhưng nên thử 1 call thật để chốt** |
| URL `vjpqsu0t76ek.jp.larksuite.com` · shard `.jp.` | 🟡 **chưa kiểm được.** Đáng chú ý: tenant ở shard **JP** nhưng API host là `open.larksuite.com` — hai chỗ này khác nhau là **bình thường**, nhưng phải **thử 1 call thật** trước khi tin |
| *"Lark Base KHÔNG có tham số URL để filter"* | 🟡 **Đây là kết luận có giá trị cao.** Nó nói đã tra Base API + FAQs + AppLink và mở menu view thật. Nếu đúng thì Pattern A (tạo view riêng mỗi dự án) là đường duy nhất — và câu *"đừng để ai tự nghĩ ra cú pháp filter, Lark sẽ bỏ qua im lặng"* là cảnh báo rất đáng giữ |

---

## 6 · ⚠️ Bản tin bị CẮT

Bản Hoà dán **dừng giữa Pattern B**:

> *"**B — Một view Gantt chung, group theo** —"* ← cắt ở đây

**Thiếu**: hết Pattern B, toàn bộ Pattern C, và bất cứ phần nào sau §3.4. Cần lấy nốt trước khi
Claude Code làm phần Gantt.

Nhưng **không chặn việc**: Pattern A đã đủ chi tiết để code, và Claude web đã khuyến nghị chính
Pattern A cho quy mô < 200 dự án — đúng quy mô của Hoà.

---

## 7 · Đánh giá chung về bản spec này

Nói thật: **đây là bản spec tốt.** Ba chỗ tôi thấy rõ tay nghề:

| Chỗ hay | Vì sao |
|---|---|
| *"Hao hụt phải là CỘT trong ATLAS, không nằm trong code — vì NCC đổi quy cách nhanh hơn tốc độ bạn deploy"* | Đây là suy nghĩ kiến trúc, không phải liệt kê số |
| *"Mọi thứ phụ thuộc `TODAY()` phải là formula của Lark"* | Chặn đúng một lỗi sẽ đốt rate limit mỗi đêm |
| *"Giấy dán tường: KHÔNG được tính m²/5,3, phải đi qua số dải"* | Chi tiết nghề thật, đúng chỗ dev hay sai |

Và `payload_hash` để **bỏ qua write khi không đổi** là ý rẻ-mà-cứu-nhiều nhất trong phần 2.

---

## 8 · Lệnh dán cho Claude Code

```
Đọc docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md TOÀN VĂN trước khi làm gì.
Nó soát bản spec BOQ/PROJECT_STATUS/Lark và nêu 4 khoảng trống code + 1 lỗ logic.

ƯU TIÊN 1 — SỬA ticket Lark tôi gửi sáng nay (nó THIẾU)
- ATLAS nằm trong WIKI, không phải Drive. Cần 3 biến, không phải 2:
    LARK_ATLAS_NODE_TOKEN = Ejk6wjlXoiWN80khYcRjthy3prd   (deep link)
    LARK_ATLAS_APP_TOKEN  = giải ra từ node_token, CACHE lại (mọi call bitable)
    LARK_WORK_APP_TOKEN   = base "Quản lý Công việc" (base thường)
- Viết hàm resolveWikiAppToken():
    GET /open-apis/wiki/v2/spaces/get_node?token={node_token}&obj_type=wiki → đọc obj_token
  lib/integrations/providers/lark.ts hiện KHÔNG có một dòng nào về wiki (grep = 0).
- Comment bắt buộc trong code: "node_token ≠ app_token. Lưu cả hai, KHÔNG suy ra từ nhau."
- Giữ tương thích ngược LARK_BASE_APP_TOKEN.
- Thử 1 call thật để xác minh host open.larksuite.com dùng được với tenant shard .jp.
  BÁO KẾT QUẢ, đừng đoán.

ƯU TIÊN 2 — nền BOQ (3 việc nhỏ, làm được ngay)
a) lib/cad/hatch.ts: thêm polygonPerimeter(poly, edgeMask?: boolean[])
   Viết cùng phong cách polygonArea. Có edgeMask vì "nẹp cạnh chỉ lấy cạnh biên".
   Thêm test vào hatch.test.ts (hình vuông 100x100 → chu vi 400).
b) Trừ lỗ mở theo ĐƯỜNG A: trừ bằng entity đã phân loại ElementType.door/.window
   nằm trong polygon, ngưỡng 0.5 m² đưa vào CONFIG (không hard-code).
   KHÔNG viết thuật toán tìm ring con.
c) MaterialDef: CHỈ thêm 1 field atlasRecordId?: string.
   TUYỆT ĐỐI KHÔNG thêm Giá/Đơn vị/Hao hụt/Quy cách vào MaterialDef —
   MaterialDef là vật liệu THỊ GIÁC (material-texture.ts dùng nó để vẽ texture).
   Dữ liệu thương mại vào bảng Prisma riêng AtlasMaterial (cache từ ATLAS).

ƯU TIÊN 3 — BOQ là schedule.ts MỞ RỘNG, không phải module mới
- lib/cad/schedule.ts đã có ScheduleRow{key,label,count,w,h,block,specId,ids} + ELEMENT_TYPE_LABELS.
- BOQ thêm nhánh diện tích (m²) / chiều dài (m) / thể tích (m³) vào đúng engine đó.
- Chuỗi 5 bước BẮT BUỘC: qty_geom → qty_design → qty_exec → qty_order → amount
  Decimal(12,4) nội bộ, KHÔNG làm tròn ở bước trung gian, chỉ round 2 số khi in.
  qty_order luôn CEILING. Bảng giao chủ đầu tư phải hiện đủ 3 cột khối lượng.
- boqToEntities() phải theo Q-L3 y hệt scheduleToEntities(): entity THƯỜNG + nút
  "Cập nhật lại", KHÔNG object sống. Đọc comment đầu file schedule.ts.

CHƯA LÀM (chờ tôi chốt với Hoà):
- PROJECT_STATUS ghi lên Lark — còn treo câu "máy nào được ghi" (§4, local-first
  không có single writer). Đề xuất đường A: chỉ máy Project.owner ghi.
- Gantt view — bản spec bị cắt giữa Pattern B, chưa có đủ.

Xếp gia phả + cấp mã theo Luật #8b. Báo mã đề xuất, đợi xác nhận không trùng, rồi mới code.
```

---

*Cowork, 30/07/2026. Đọc code thật: `lib/cad/hatch.ts:41-55,255`, `hatch.test.ts:32`,
`lib/cad/schedule.ts:1-45`, `lib/cad/gu-features.ts:158`, `lib/cad/room-autolabel.ts:161`,
`lib/three/cad-to-obj.ts:21-25,296-299`, `lib/cad/material-texture.ts:23,73,142-163`,
`lib/integrations/providers/lark.ts:21,28,69` (grep `wiki` = 0), `.env.example:89-98`.*
