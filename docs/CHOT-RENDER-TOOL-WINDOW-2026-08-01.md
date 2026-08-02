# CHỐT — RENDER: BỎ TOOL MODE RIÊNG · TOOL WINDOW = SUBGRAPH NODE

> Hoà quyết **01/08/2026**, nhìn giao diện Rendering thật (ảnh chụp trong phiên).
> ⚠️ **LẬT một chốt cũ**: `SPEC-RENDER-STUDIO` §1B (27/07) từng chốt *"Tool mode — giao diện
> MẶC ĐỊNH"* là màn riêng 2 cột. Quyết định này **thay thế** §1B — ghi đè có ngày, không xoá gốc.

## 1 · Mô hình mới — một nền duy nhất

```
┌─[Sketch→Ảnh thật][Đổi vật liệu][Sửa một mảng][+ghim]─┐  ← THANH TAB TOOL phía trên
│                                                       │
│   ┌─ kính mờ ────────┐   ┌─ kính mờ ────────┐        │
│   │ TOOL WINDOW      │──▶│ TOOL WINDOW 2    │        │  ← kéo tab xuống = xổ window
│   │ (ảnh sắc nét)    │   │                  │        │     nối window với nhau NHƯ NỐI NODE
│   └──────────────────┘   └──────────────────┘        │
│         ▼ thu lại                                     │
│       [node nhỏ]        ← canvas node như cũ          │
└───────────────────────────────────────────────────────┘
```

| # | Chốt | Chi tiết |
|---|---|---|
| 1 | **Tool window LÀ subgraph node phóng to** | Một trạng thái duy nhất — window chỉ là cách HIỂN THỊ của node. Đóng window → thu thành node nhỏ trên canvas; mở lại → đúng giá trị đang chỉnh. KHÔNG có màn tool mode riêng, KHÔNG có bản sao trạng thái |
| 2 | **Thanh tab**: 8 tool nền (thẻ N §6) + **ghim của tôi** | Vị trí cố định, không tự xếp lại theo tần suất (giữ trí nhớ cơ bắp). Khớp sẵn 3 tab Của IF/Cộng đồng/Của tôi (§6B pha 5) sau này |
| 3 | **Tối đa 3 window mở cùng lúc** | Mở cái thứ 4 → cái cũ nhất tự thu về node nhỏ (không mất gì). Nối 2–3 window với nhau = nối node bình thường — vì window LÀ node |
| 4 | **Màn ≤7 inch: 1 window, tự phóng toàn màn** | Chính nó TRỞ THÀNH tool mode cũ — cùng một code, không nuôi hai giao diện. Giữ nguyên lý §1B: dây trên màn nhỏ là bất khả thi |

## 2 · Vật liệu khung — kính là VỎ, không bao giờ là RUỘT

Hoà chốt: khung bao nội dung dùng **kính mờ theo design system IF** (họ hàng card kính gallery
`ProjectSelect`/`TitleSequence`, cầu kính Vitals, *"giấy vuông vỏ bo"* 27/07):

- **Vỏ window**: kính mờ (backdrop blur), bo góc, viền sáng mảnh — nổi khỏi canvas.
- **Ruột (ảnh/kết quả render)**: sắc nét 100% · góc vuông · KHÔNG blur, KHÔNG phủ màu, KHÔNG
  giảm tương phản. Nội dung là thứ khách trả tiền để nhìn.
- **Hiệu năng**: backdrop-filter CHỈ trên ≤3 window + thanh tab. Node nhỏ trên canvas dùng nền
  đặc — không rải kính lên hàng chục node (bài học FPS phần C).

## 2B · BẬC THANG ĐIỀU KHIỂN TAY *(Hoà nêu yêu cầu 01/08: "KTS ghét tự động không ra đúng ý" — khung dưới đây là **Cowork đề xuất, CHƯA chốt**, chờ Hoà gật)*

> Gốc: *"quyền điều khiển đặt ở nơi tay nghề nằm"* (SPEC-RENDER-STUDIO, nguyên tắc gốc).

| Nấc | Điều khiển | Nền đã có |
|---|---|---|
| 1 | Núm nghề (2–3 thanh trượt tiếng nghề) | mock hôm nay |
| 2 | **"Mở nâng cao ▾"** trong window — TOÀN BỘ thông số thật, tên theo bảng chuyển ngữ §3; chỉnh nấc 1 thấy số nấc 2 nhảy theo, không giấu gì | §3 đã chốt "bảng chuyển ngữ là tài sản" |
| 3 | **Tay trên ảnh**: vẽ mask "chỗ này sửa / chỗ kia cấm đụng" | `MaskPainterModal.tsx` đã tồn tại — nối vào window |
| 4 | ⌗ tụt xuống subgraph — quyền tuyệt đối | chốt mục 1 |

**Hai luật chống "toang":**

1. **KHOÁ GIỮ VÙNG (pin)** — áp nguyên luật Present (3 phương án + khoá giữ) sang ảnh render:
   vùng đã ưng 🔒 → mọi lần render lại CHỈ đổi phần ngoài khoá. Không bao giờ mất chỗ vừa ưng.
2. **SEED KHOÁ — "làm lại y hệt"** — 📌 giữ seed cạnh kết quả; chỉnh 1 núm thì chỉ 1 thứ đổi.
   Kết quả không lặp lại được = không trình chủ đầu tư được.

## 3 · Hệ quả kỹ thuật

1. ✅ **Bug `2.2.92` tự có đáp án**: gốc bệnh là overlay "Chọn việc muốn làm" (`z:35`) phủ kín
   canvas đè popover — mô hình mới **xoá overlay đó**. Câu "CẦN Hoà quyết hướng" đang treo: ĐÓNG.
2. Tool window phải render qua **lớp portal chung** (khuôn `Popover.tsx` đã đúng) — không
   `position:absolute` cục bộ, khỏi tái phát đúng bệnh stacking-context vừa chẩn.
3. **6 thẻ N đang làm (pha 1 §6B) phải xây trên mô hình này** — ai đang dựng UI thẻ theo màn
   2 cột cũ thì DỪNG, đọc file này trước.
4. Hình mẫu ngành: **ComfyUI Subgraph** (2025-26) — gói cụm node thành một khối chỉ lộ núm cần
   thiết. IF đi xa hơn một bước: khối đó nở thành window thao tác được và nối được với nhau.

---

*Cowork ghi 01/08/2026, ngay sau khi Hoà chốt 3 câu + vật liệu khung. Việc thi công: xếp vào
Render Studio pha 1 — chưa giao phiên nào, chờ code chính xong V2 + P1–P3.*

## Tinh chỉnh 02/08 — MODE-DRIVEN SHELL (Hoà nhấn kèm ảnh)

> Hoà: *"bật tắt mode thì CẢ giao diện chuyển theo, chứ không phải nhẹ (chỉ thay ruột)."*
> Hiện trạng sai: mọi tool (Sketch→Ảnh thật · Grey-box · Đo món đồ…) DÙNG CHUNG một layout
> "thả ảnh trái · kết quả phải · slider dưới", chỉ đổi form bên trong. Đó là "đổi ruột", KHÔNG đạt.

**Luật:** mỗi tool/mode = **một giao diện RIÊNG hợp với việc đó**, chuyển tool là chuyển cả shell:
- `Đo món đồ` → giao diện đo (ảnh + kẻ kích thước), KHÔNG phải khung thả-ảnh→kết-quả.
- `Đổi ánh sáng/giờ` → bảng THẺ giờ trong ngày, không phải slider chung.
- `Sketch→Ảnh thật` → 2 ô + núm nghề (như đang có, đúng cho tool này).
- Khớp mô hình đã chốt: **tool window = subgraph node** — mỗi node có UI riêng, không phải 1 khung
  cố định đổi nội dung. Chuyển tool = mở window/node khác, không phải swap panel con.
- Áp cả CAD **Sketch↔Pro mode**: lên Pro không phải "hiện thêm nút" mà **đổi cả shell** cho hợp
  tầng năng lực (khớp CHOT-HUONG-3D: "lên tầng = đổi cả giao diện, không thêm hệ phân quyền").

⇒ Thi công D3 (tool window Render) phải theo luật này: KHÔNG dựng 1 layout chung đổi ruột.

## ĐÍNH CHÍNH 02/08 — VỊ TRÍ TOOL: SIDE TRÁI, KHÔNG PHẢI TAB NGANG

> Hoà chỉ ra Cowork ghi SAI: chốt cũ ghi "thanh tab 8 tool phía trên canvas" — SAI.
> Đã thống nhất: **tool nằm ở THANH SIDE BÊN TRÁI** (dải icon dọc), KHÔNG phải tab ngang trên đầu.
> Ảnh 1 (tab ngang "Sketch→Ảnh thật · Grey-box…") là bản SAI. Ảnh 2 (node "Nhập ảnh" nổi có
> play+X+cổng) là bản ĐÚNG.

**Mô hình chốt lại (thay §1 mục 2):**
1. **Tool = NODE, liệt ở thanh side trái.** Bản chất mỗi tool là một node.
2. **Nhấn / kéo-thả một tool từ side trái → xổ ra WINDOW trên canvas** (chính là node phóng to,
   có play · X · cổng nối). Không phải chọn tab rồi đổi ruột 1 khung cố định.
3. Window nối nhau như nối node (đã đúng ở ảnh 2). Tối đa 3 window mở cùng lúc (giữ nguyên).
4. Vỏ kính, ruột sắc nét (giữ nguyên). Bậc thang điều khiển 2B + khoá vùng + seed (giữ nguyên).
5. Mode-driven shell (mục trên) VẪN đúng: mỗi tool-node có UI riêng hợp việc, không layout chung.

⚠️ **BỎ hoàn toàn ý "thanh tab tool phía trên"** — đó là hiểu sai từ câu hỏi Cowork đặt lệch
> ngày 01/08. Điều Hoà luôn muốn: side trái + kéo xổ window=node.

## LÀM RÕ 02/08 — TÁCH 3 KHÁI NIỆM (Hoà chốt, hết rối)

> Ba thứ KHÁC NHAU, đừng gộp:

| # | Cái gì | Cách hoạt động | Đổi giao diện? |
|---|---|---|---|
| **A · TOOL** (Sketch→Ảnh thật, Grey-box, Đo món đồ…) | mỗi tool = **NODE** ở thanh side TRÁI · nhấn/kéo xổ ra **window** trên canvas (play·X·cổng) | mỗi tool-node có UI riêng hợp việc | window riêng, KHÔNG đổi cả app |
| **B · BẬT/TẮT MODE = CHUYỂN TẦNG IF1↔IF2** | bật IF2 (tầng kỹ thuật) | **ĐỔI CẢ GIAO DIỆN → chế độ VẼ 3D** (cấu kiện, khối, IFC) | ✅ đổi CẢ shell |
| **C · chuyển CHẶNG** (CAD·Render·Present) | nút trên đỉnh | đổi không gian làm việc | ✅ (đã có) |

**Chốt B — cốt lõi Hoà nhấn:** "bật tắt là để IF2 chuyển giao diện → vẽ 3D."
- IF1 (mặc định): giao diện 2D/sơ phác như hiện tại.
- Bật IF2: shell chuyển sang **vẽ 3D** — push-pull khối, cấu kiện có nghĩa, viewer 3D làm chính.
- Đây KHÔNG phải thêm nút trong màn cũ; là **đổi cả bố cục** cho hợp việc dựng 3D.
- Khớp `CHOT-HUONG-3D`: IF1/IF2 = tầng năng lực vận hành bằng Sketch/Pro mode, lên tầng = đổi shell.

⇒ Thi công: A (tool-node side trái) và B (toggle IF2→3D) là HAI việc riêng, đừng trộn vào D3.

## KIẾN TRÚC SIDEBAR RENDER — 3 VÙNG NODE (Hoà chốt 02/08)

> Sidebar trái = **chung khu node** (cùng canvas node), nhưng **phân 3 VÙNG theo bản chất node**.
> Hoà nhấn: **phân loại kỹ**.

### Vùng 1 · MOOD + COLLAB *(giống Miro đã bàn)*
Node phục vụ giai đoạn ý tưởng + cộng tác — moodboard, reference gom nhóm, thả-tim/gu, bình luận.
- `ai.moodboard` · reference · gu-picker · collab note.

### Vùng 2 · NODE MASTER *(BẮT BUỘC mở TOOL WINDOW để thao tác → ra sản phẩm → mới node tiếp)*
Node "nặng": có núm điều khiển, chạy AI, ra ẢNH SẢN PHẨM. KHÔNG chạy inline — phải xổ window
(bậc thang 2B: núm nghề → nâng cao → mask tay → subgraph). Ra kết quả xong nối sang node kế.
- `Sketch→Ảnh thật` (text2image/img2img) · `Grey-box→Nội thất` (`ai.exterior`/`ai.emptystaging`) ·
  `Đổi phong cách` (`ai.styletransfer`) · `Đổi ánh sáng/giờ` (`ai.relight`) · `Sửa một mảng`
  (`ai.localedit`) · `Đổi vật liệu` (`ai.materialswap`) · `Phóng to in` (`ai.upscale`) ·
  `Thêm đồ` (`ai.furniture`) · `Nhiều biến thể` (`ai.batchvariants`).

### Vùng 3 · NODE THƯỜNG *(như trước giờ — inline, đơn giản, tất định)*
Nhập/tiện ích/xuất — không cần window, thao tác nhẹ tại chỗ.
- `Nhập ảnh` (Import Image) · `util.crop` · `util.annotate` · `util.compare` · `util.composite` ·
  `util.maskpainter` · `util.removebg` · `util.materialnote` · node OUTPUT sang chặng 3.

> ⚠️ Đây là phân loại SƠ BỘ theo tên node (`CATALOG-STAGE2-RENDERING.md`). Khi thi công phải
> rà lại TỪNG node trong catalog gán đúng vùng — Hoà nhấn "phân loại kỹ".

---

## HẠ TẦNG XUYÊN APP — dùng chung CẢ 3 CHẶNG (CAD · Render · Present)

> KHÔNG thuộc chặng nào — sống ở tầng app, mọi chặng gọi tới.

| | Thuật ngữ | Là gì |
|---|---|---|
| **File Manager** | *chợ đầu mối* | quản lý file toàn app (`SPEC-FILE-MANAGER`) — mở Finder ra vẫn hiểu |
| **Master Library** | *cửa hàng* | siêu thư viện tài sản/DAM (`SPEC-IF-LIBRARY`) — đường 1 chiều chợ→cửa hàng |

Mọi chặng: CAD (block/mẫu bản vẽ) · Render (thẻ tool, ảnh) · Present (template, ảnh) đều đọc/ghi
qua 2 hạ tầng này. Đừng mỗi chặng tự dựng kho riêng.
