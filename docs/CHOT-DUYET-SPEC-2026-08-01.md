# CHỐT — VÒNG DUYỆT SPEC 01/08/2026

> Đóng lại **bảy tài liệu treo `[CẦN HOÀ DUYỆT]`** — có cái treo từ 24/07.
> Hoà quyết phần cơ chế · giao diện · chuẩn nghề · tính năng.
> Cowork duyệt thay phần thuần kỹ thuật (Hoà uỷ quyền 01/08), **nhưng vẫn báo mọi rủi ro**.

---

## 0 · Ranh giới uỷ quyền (Hoà chốt 01/08)

| Ai duyệt | Loại việc |
|---|---|
| **Hoà** | cơ chế · giao diện · chuẩn ngành · tính năng — thứ kiến trúc sư phán được |
| **Cowork** | thuần kỹ thuật — thứ hỏi kiến trúc sư là hỏi sai người |
| **Vẫn phải trình Hoà** | thứ *trông* kỹ thuật nhưng là quyết định kinh doanh: giấy phép GPL, ngưỡng 300dpi, chi phí vận hành |

> ⚠️ **Rủi ro thì báo hết, kể cả khi được quyền tự duyệt.** Quyền quyết không đi kèm quyền giấu.
> Và trước khi hỏi Hoà: **nghiên cứu đối thủ trước, gom một lần, không hỏi rải rác.**

---

## 1 · HOÀ QUYẾT

### 1a · CAD hai chế độ — **song song, kế thừa nhau**

Không phải "Pro trước" hay "Sketch trước". Hai chế độ **dùng chung một tệp `.idf`** ⇒ xây **lõi chung
một lần**, hai chế độ chỉ là **hai lối nhập**:

| Lõi chung (làm 1 lần) | Sketch | Pro |
|---|---|---|
| Bộ lệnh | menu vòng quanh ngón | gõ chữ `L · REC · PL` |
| Snap | dung sai lớn | tới mm |
| Undo/redo | cử chỉ 2–3 ngón | ⌘Z |
| **Layout / Paper Space** | **cả hai cùng hưởng** | |

Đây là luật `2.1.10` áp cho CAD: *một năng lực, hai lối vào, cùng một hàm*.

🧮 **Nghiên cứu xác nhận Paper Space là lỗ thủng thật**: vẽ full size ở model, tỉ lệ điều khiển bằng
viewport; thiếu nó phải **vẽ lại hình học cho từng tỉ lệ**, và nhiều khung nhìn của cùng một model
trên một tờ là bất khả. Hình mẫu tablet: **Morpholio Trace · Concepts**.

### 1b · Present — **3 phương án + KHOÁ GIỮ**

Máy đưa **3 phương án** dàn trang → Hoà chọn 1 → sửa tự do → xuất.
Chỗ đã sửa tay được **khoá giữ** *(pin)*: bấm "đề xuất lại" chỉ đổi phần **chưa động tới**.

> Thiếu luật khoá giữ chính là lý do dân thiết kế bỏ công cụ AI làm slide: sửa xong bấm lại là mất
> hết công. Mỗi lần chọn giữa 3 phương án = **một tín hiệu dạy máy học gu**.

### 1c · Dàn bài hồ sơ — **3 mẫu, và PHẢI linh hoạt**

Duyệt 3 dàn bài mẫu (Concept proposal · Design development · Material board) — nhưng chúng là
**điểm khởi hành, không phải khuôn cứng**:

- thêm / bớt / đổi tên chương tự do (spec đã có)
- ⭐ **BỔ SUNG MỚI**: nút **"Lưu dàn bài này thành mẫu của tôi"** — làm hồ sơ kiểu riêng vài lần là
  thành mẫu thứ 4, thứ 5. Spec gốc chưa có mục này.

### 1d · Video — **sáu bậc, thứ tự đã chốt**

⚠️ Spec gốc xếp video AI 🔴 *"méo hình học"* — **đánh giá đó viết 24/07, nay đã lỗi thời**.
🧮 Kling 3.0 giữ quan hệ không gian nhờ mô phỏng vật lý; Veo 3.1 cho **ghim ảnh tham chiếu** để vật
liệu/ánh sáng không trôi. Giới hạn cứng còn lại: **mỗi đoạn 5–12 giây**, ghép dài là mỗi mối nối một
chỗ hình học có thể lệch.

| Bậc | Làm gì | Chi phí |
|---|---|---|
| **1** | **Mặt bằng tự vẽ ra** — tường → cửa → nội thất → vật liệu → kích thước | 0 credit ⭐ rẻ nhất |
| **2** | **Đường cam vẽ TRÊN MẶT BẰNG** (chặng 1) → video (chặng 3) | 0 credit ⭐ ý Hoà |
| **3** | Deck + giọng đọc → video thuyết trình | 0 credit |
| **4** | **Luồng giao thông** — người/mũi tên đi theo lối | 0 credit ⭐⭐ **moat** |
| **5** | Đường cam 3D → đẩy sang **D5** render → nhập phim về | giờ GPU |
| **6** | Cảnh chêm AI 5–12s | **tốn credit, hiện giá trước khi bấm** |

**Thứ tự: 1 và 3 trước → 2 và 4 → 5 và 6 sau cùng.**

> **Vì sao 1 · 2 · 4 là moat:** mặt bằng IF là **vector, layer chia sẵn, có ngữ nghĩa** (biết cửa,
> phòng, luồng). Canva/Illustrator animate được nhưng **phải tách lớp thủ công**. Với IF **layer là
> dữ liệu**. Và Canva không biết **đâu là cửa** — vẽ mũi tên đi xuyên tường thành trò cười; IF không
> thể sai vì tường là dữ liệu.
>
> **Luật giữ mối nối, không làm lại công cụ:** D5 dựng phim tốt hơn IF sẽ làm được trong 2 năm;
> CapCut cắt ghép tốt hơn. Trong IF chỉ làm **xếp thứ tự + cắt đầu đuôi + chèn tiếng**, KHÔNG làm NLE.
>
> 🔴 **RỦI RO NẶNG NHẤT**: trình dựng phim tự nó là **một sản phẩm riêng**. Làm bậc 5–6 sớm là rút
> người khỏi CAD và Present khi cả hai chưa xong.

---

## 2 · COWORK DUYỆT THAY (có nêu lý do)

| File | Kết luận |
|---|---|
| `SPEC-PRODUCT-INFRA` | **ĐÓNG** — nhãn treo là cũ. Thân bài v1.1 (28/07) đã ghi *"Hoà quyết GIỮ auth tự viết"* vì local-first. Không còn gì để duyệt |
| `SPEC-VITALS-ROLE` | **DUYỆT** — 3 hình dạng nở dần trong status bar · gợi ý là **nút bấm sẵn** không phải chữ mời chào · 3 luật chống phiền. Đúng và rẻ |
| `SPEC-UI-SHELL` | **DUYỆT** — 4 trạng thái canvas · quy ước click · `⌘K` · *giấy vuông vỏ bo* (Hoà đã chốt 27/07) |
| `SPEC-NAVIGATION-MODEL` | **DUYỆT** — 4 lớp có đường về · 4 luồng một khung · 3 tầng ưu tiên danh sách · **chuột phải chỉ là đường tắt, không độc quyền** (trùng khít `2.1.10`) |

**Chỗ mạnh nhất của NAVIGATION-MODEL**: Luồng B *"phải đi được mà không cần đụng CAD"* — câu bảo vệ
sản phẩm. Người mới chỉ cần render một tấm; bắt vẽ trước là mất khách.

---

## 3 · RỦI RO ĐANG SỐNG — báo, chưa sửa

| # | Rủi ro | Bằng chứng |
|---|---|---|
| 1 | 🔴 `knowledge/ttt-design-system/` (16 KB, 3 file) **đang trong git** | `git check-ignore` không khớp. `CLAUDE.md` ghi *"KHÔNG áp vào sản phẩm"*, `AUDIT-BRAND-PII.md` xếp phải ra ngoài repo. **Vi phạm luật trung tính, đang sống** |
| 2 | 🟡 `/library/ingest` tràn full màn, không rõ thuộc lớp nào | `SPEC-NAVIGATION-MODEL` §1. **Cùng file** cũng nằm trong `AUDIT-BRAND-PII` (placeholder có tên khách) — sửa 1 lần được cả 2 |
| 3 | 🟡 Spec ghi "25 template", `templates.ts` có **47** mục | số đã cũ, đếm lại khi thi công |
| 4 | 🟡 `SPEC-PRESENT-FLOW` cảnh báo `IF-PRESENT-SPRINT-PLAN.md` không có trong repo | **có thật, 31,8 KB, sửa 26/07** — cảnh báo cũ, gỡ đi |

---

## 4 · `designStandards.ts` — KHÔNG MẤT

Tìm 01/08 sau khi Hoà lo:

| | |
|---|---|
| Bản gốc | ✅ `docs/CHUAN-THIET-KE-v7.6-NGUON.md` (6 KB) — 8 mục: nhân trắc học P5/P50/P95 · kích thước chuẩn · khoảng lưu thông · tạo dáng · Gestalt · trường phái · vật liệu · **ISO 128** |
| Phần đo bằng vật thấy được | ✅ đã vào code — `lib/vision/single-view-metrology.ts`, **958 dòng** |

⚠️ **Đừng lẫn hai con số**: metrology dùng **tầm mắt máy ảnh 1500–1600** (mặc định 1550);
đường cam bậc 2/5 nên dùng **tầm mắt người ~1650**. Hai việc khác nhau.

---

*Cowork ghi 01/08/2026. Bảy file `[CẦN HOÀ DUYỆT]` đóng hết. Thêm quyết định mới thì thêm 1 dòng
vào `docs/00-CHOT.md`.*
