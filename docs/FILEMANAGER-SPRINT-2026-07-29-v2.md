# File Manager ↔ Library + Sprint kế tiếp — v2 (chốt NT1/NT5/BOQ)

> v2 thay v1 (giữ v1 làm lịch sử, không xoá). Thay đổi: Hoà uỷ quyền "Cowork nhận định và chốt
> NT1/NT5/BOQ theo phương án tối ưu, đúng tinh thần IF nhất" + gộp NT1/NT5 thành 1 đợt. Đây là
> **đề xuất đã lập luận xong, sẵn sàng dán vào `IF-FEATURE-TREE.md` mục CẦN HOÀ QUYẾT (Q8/Q9)** —
> Cowork không tự sửa trực tiếp file trong repo (đang có sửa dở dang chưa commit từ Claude Code,
> sửa đè lúc này rủi ro đụng độ) — Hoà hoặc Claude Code dán vào khi mở phiên tiếp theo.

---

## Q8 — NT1 + NT5 gộp 1 đợt, tách phần "sống còn" ra làm ngay

**Lý do gộp**: cả hai đụng cùng 1 lớp — *dữ liệu Library nằm ở đâu, ai đọc nó*. Tách làm 2 lần
nghĩa là sửa lớp lưu trữ 2 lần: lần 1 khi gộp 4 UI Library thành 1 model `LibraryAsset` (NT1),
lần 2 khi dời model đó sang cây thư mục thật trên đĩa (NT5 Pha 1). Gộp lại = động vào lớp lưu
trữ **đúng 1 lần** — đúng tinh thần chống "làm rồi làm lại" Hoà đặt ra từ đầu.

**Nhưng tách riêng 1 phần ra làm NGAY, không đợi gộp**: NT5 Pha 2 (backup tự động `.ifpack`).
`SPEC-FILE-MANAGER.md` tự gọi đây là *"điều kiện sống của local-first"* — không phải tính năng
tuỳ chọn, mà là rủi ro mất trắng dự án nếu ổ cứng hỏng. Hàm `buildIfpack()` đã có sẵn, chỉ thiếu
lịch tự động (`setInterval`). Không có lý do đúng đắn để trì hoãn việc rẻ và sống còn này chỉ vì
nó nằm cùng nhóm mã với việc lớn — tách ra, làm trong Sprint 1.

**Thứ tự còn lại (rẻ trước, đúng phụ thuộc)**:
1. Sprint 1 (ngay): NT5 Pha 2 — backup tự động.
2. Sau khi Render (Sprint 2-3) xong: NT1 — gộp `LibraryPanel.tsx`+`LibraryBrowser.tsx` (ảnh,
   RẺ nhất, đã có plan chi tiết trong `PLAN-LIBRARY-GATEWAY.md`) → sau đó gộp block/furniture CAD
   vào cùng model (LỚN hơn, cần schema mới).
3. **Ngay sau NT1 xong, cùng đợt**: NT5 Pha 1 — dời dữ liệu Library (giờ đã là 1 model) sang cây
   thư mục thật `~/InteriorFlow/Projects/...`. Làm liền sau NT1 để chỉ động vào tầng lưu trữ 1 lần.
4. Nối tiếp tự nhiên: NT5 Pha 3 (watch folder tự phân loại — đúng lúc này mới đủ điều kiện, vì cần
   CẢ 2: NT1 xong + cây thư mục xong) → Pha 4 (vòng đời file, bảng dung lượng).
5. Mở khoá theo: 4.18 nối Gateway "Mở tệp" vào `IOMenu.tsx` (đang bị NT1 chặn cứng).

---

## Q9 — BOQ: CHỐT LÀM

**Lý do**: BOQ (dự toán khối lượng) là sản phẩm THẬT, bán được, đúng nghiệp vụ kiến trúc/nội thất
— không phải "tính năng hay để có". Chi phí mở khoá THẤP: chỉ cần thêm field `matId` lên
`MaterialDef`/vùng tô vật liệu (hạ tầng vùng tô đã có sẵn, `2.1.9.i`). Định vị đúng: đây là tính
năng bậc **N** (cơ bản, nghiệp vụ) chứ không phải **L** (nâng cao/moat) — không vi phạm luật
"không xây L khi N chưa xong" của chính IF.

**Thứ tự**: thêm field `matId` (việc nhỏ, làm được ngay, không đụng UI) → tự mở khoá 1 lượt cả 4
nhánh đã gộp ở mã `2.1.9.p` (CAD tự tính BOQ từ vùng tô, callout/legend Present tự đọc, sau này
vật liệu mã+giá từ moodboard chặng Ý tưởng). Chạy **song song được** với NT1/NT5 (khác vùng code
— `MaterialDef` schema vs Library UI/storage — không tranh chấp).

---

## Sprint sequence CHỐT — 7 sprint (thay bản v1 §4)

| Sprint | Nội dung | Cần Hoà quyết thêm? |
|---|---|---|
| **1** | License page + CI gate copyleft + **NT5 Pha 2 (backup `.ifpack` tự động)** + rổ rẻ Bảng Tổng 3 (đổi tên panel, rail trái nhãn, Pexels, 3 nút gợi ý Vitals) | Không — chạy ngay |
| **2** | KHÁM: audit toàn bộ tool Render đối chiếu code thật (điều kiện Q7) | Không |
| **3** | SPEC + CODE: 2.2.16-2.2.21 (3 tool đắt nhất + 3 tool còn lại), dựa trên audit Sprint 2 | Không |
| **4** | BOQ — field `matId` → bảng BOQ tự tính → callout Present tự đọc (chạy song song Sprint 5) | Không (Q9 đã chốt) |
| **5** | NT1 (gộp Library UI: ảnh trước, block CAD sau) → **liền sau đó** NT5 Pha 1 (cây thư mục thật) → nối 4.18 Gateway vào `IOMenu.tsx` | Không (Q8 đã chốt) |
| **6** | NT5 Pha 3 (watch folder tự phân loại) + Pha 4 (vòng đời file, bảng dung lượng) | Không |
| **7** | DWG server-side migration (kế hoạch có sẵn, không gấp) | Không |
| Backlog | Video/Film Present [v2] (chờ Present N đủ ngưỡng) · "catalogue→template batch export" (chờ Hoà xác nhận đưa vào `IDEAS-BACKLOG.md` — xem giải thích bên dưới) | Còn 1 câu hỏi |

**Toàn bộ 7 sprint giờ chạy được tuần tự, không còn cổng thắt nào cần Hoà quyết thêm** — trừ 1 ý
mới (catalogue→template) đang chờ Hoà xác nhận có ghi vào backlog không.

---

## "Catalogue → template → batch export" là gì? (giải thích lại)

Đây là ý từ chính Google Flow prototype Hoà đang tập ("Furniture Studio Workspace"), áp dụng vào
chặng **Present**. Giống hệt tính năng **"Data Merge"** trong Adobe InDesign / "Mail Merge" trong
Word — Hoà chắc từng dùng qua Word:

- **1 TEMPLATE cố định** — 1 layout có sẵn ô trống (khung ảnh, ô tên sản phẩm, ô kích thước, ô vật
  liệu, ô giá...). IF đã có 2 template đúng dạng này rồi: `material-palette`, `material-flatlay`
  (trong `templates.ts`).
- **1 CATALOGUE** — 1 bảng dữ liệu, mỗi dòng là 1 món (vd 30 món nội thất, mỗi dòng có: ảnh, tên,
  kích thước, vật liệu, giá).
- Máy **tự động điền** catalogue vào template, ra N trang — 1 trang/1 dòng, không cần kéo-thả tay
  từng cái.
- Bấm **"Export All"** — xuất hết N trang cùng lúc.

**Ví dụ cụ thể**: Hoà có 30 món nội thất cho 1 dự án, mỗi món cần 1 trang "spec sheet" (ảnh +
kích thước + vật liệu + giá) — đúng luồng Furniture Spec Sheet ở mục 28-30 nhật ký. Thay vì tạo
tay 30 slide trong Present, Hoà chỉ cần: 1 bảng catalogue 30 dòng + 1 template A4L đã chọn sẵn →
bấm 1 nút → ra ngay 30 trang PDF, xuất hàng loạt.

**Vì sao không AI**: đây là ghép dữ liệu thuần (deterministic data-binding), giống Mail Merge —
không cần máy "sáng tác" gì, chỉ cần đúng field nào vào đúng ô nào. Đúng yêu cầu "code lại với cơ
chế không AI" Hoà đã chốt ở phiên trước.

**Trạng thái**: chưa có mã trong `IF-FEATURE-TREE.md` — đây là ý THẬT SỰ mới, đúng Luật Đóng Băng
#2 phải ghi vào `docs/IDEAS-BACKLOG.md` trước, chờ mốc mở cây (sau khi Sprint 3 Render xong, ví
dụ). Hoà xác nhận thì Cowork soạn dòng đó gửi kèm.

---

*Cowork, 29/07/2026. Q8/Q9 là NHẬN ĐỊNH của Cowork theo uỷ quyền của Hoà ("bạn nhận định và chốt
làm với phương án tối ưu... đúng tinh thần IF nhất") — chưa phải dòng chính thức trong
`IF-FEATURE-TREE.md` (Cowork không tự sửa file đang có thay đổi chưa commit của Claude Code).
Dán nguyên văn Q8/Q9 vào file đó (mục CẦN HOÀ QUYẾT) khi mở phiên Claude Code tiếp theo.*
