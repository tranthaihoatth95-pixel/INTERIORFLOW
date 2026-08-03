# NC-3 · SPREADSHEET NHÚNG — Airtable / Notion / Grist
**COWORK-NC · 02/08/2026 đêm.** Nuôi: `SPEC-TRINH-BOQ-EDITOR` (COWORK-TRÌNH đang chờ) — bảng tính BOQ ăn `lib/boq` (compute·xlsx·cache·from-project đã vào git `49ebadd`, chờ merge). Yêu cầu ticket: cột, công thức hiển thị, live-link vùng tô, xuất xlsx.
**Liên quan luật đã chốt:** `CHOT-TACH-AI-VA-CHINH-TAY` — tách máy/tay bằng **dấu + truy vết**, không bằng vị trí.

---

## 1 · Ba mô hình bảng — cùng một kết luận: KHÔNG app nào làm cell-formula kiểu Excel

| | Airtable | Notion database | Grist |
|---|---|---|---|
| Đơn vị tư duy | base > table > view; record có schema | database > page; property | doc > table > page/widget |
| Công thức | **theo CỘT (field)** — KHÔNG có tham chiếu ô `B4`, không tham chiếu ngang bảng kiểu `Sheet!B2:B` | theo property; tham chiếu property khác; **relation + rollup** để kéo số qua bảng liên kết | **theo CỘT, viết Python** (`$Cot` = giá trị dòng hiện tại); có **trigger formula** = tính 1 lần khi có sự kiện rồi THÀNH DỮ LIỆU SỬA ĐƯỢC |
| Group / subtotal | Group by field trong view; **summary bar mỗi group** (sum·avg·count·min·max…); ⚠️ formula KHÔNG đọc được group-sum — workaround chính thống = bảng phụ + rollup; ⚠️ không group theo computed field khi cần thêm record | Group by trong table/board; calculation trên cột (kể cả rollup) | **Summary table** = pivot thật: chọn group-by field → 1 dòng/bucket, công thức dùng `$group` (`len($group)`, `sum(r.X for r in $group)`); group-by column bị khoá không sửa |
| Kiểu cột | ~25 field types, single/multi select, linked record, lookup, rollup, attachment | text·number·select·multi·date·person·files·checkbox·url·relation·rollup·formula… | **11 kiểu**: Text (có Markdown) · Numeric · Integer · Toggle · Date · DateTime · Choice · Choice List · Reference · Reference List · Attachment; cột mới = kiểu `Any`, tự thu hẹp theo giá trị đầu tiên nhập |
| Format số | theo field | theo property | chuẩn kế toán đủ bộ: **`$` currency (chọn quốc gia) · `,` ngăn nghìn · `%` · `Exp` · `(-)` số âm trong ngoặc** + min/max chữ số thập phân + spinner |
| Nhập sai kiểu | chặn theo kiểu | chặn theo kiểu | **cho nhập nhưng highlight lỗi** ở cell (và cell tham chiếu nó cũng báo) |
| Live/derive | lookup/rollup qua linked record | rollup qua relation | Reference column + lookup; trigger formula shortcuts sẵn (Timestamp · Authorship · UUID · Detect Duplicates) |

Nguồn: [Grist Columns & types (chính hãng)](https://support.getgrist.com/col-types/) · [Grist Summary tables](https://support.getgrist.com/summary-tables/) · [Grist Intro to formulas](https://support.getgrist.com/formulas/) · [Airtable Guide to Grouped Records](https://support.airtable.com/docs/grouping-records-in-airtable) · [Airtable community: formula trên group-sum không được](https://community.airtable.com/t5/base-design/how-can-i-compute-formulas-on-group-summary-statistics/td-p/90206) · [Airtable community: "Make formula for a single cell" → không, đây là database](https://community.airtable.com/t5/formulas/make-formula-for-a-single-cell/td-p/95842) · [Notion Database properties](https://www.notion.com/help/database-properties) · [Notion Relations & rollups](https://www.notion.com/help/relations-and-rollups)

**Đọc ra bản chất:** cả 3 đều chọn **records-có-schema + công thức theo cột**, và đều SỐNG KHOẺ với lựa chọn đó — vì dữ liệu của họ (như BOQ của IF) là bản ghi có cấu trúc, không phải lưới ô tự do. Excel-grid chỉ cần khi người dùng phải tự chế mô hình dữ liệu — BOQ của IF thì mô hình đã có sẵn trong `lib/boq/model`.

---

## 2 · Than phiền cộng đồng

- **Airtable:** dân Excel sang đòi cell-formula, câu trả lời cộng đồng luôn là "đây là database, by design" ([thread](https://community.airtable.com/t5/formulas/make-formula-for-a-single-cell/td-p/95842)); trần 500 field/base ([than phiền "flaw of design"](https://community.airtable.com/t5/base-design/sorry-you-ve-exceeded-the-usage-limits-for-this-base-airtable/td-p/98437)); lỗi "exceeds the limit of formula dependencies" ([thread](https://community.airtable.com/t5/formulas/quot-can-t-save-field-because-it-exceeds-the-limit-of-formula/td-p/122235)); group-sum không dùng được trong formula (trên).
- **Notion:** chậm rõ với database lớn nhiều relation/formula; lỗi "Formula depth" khi chuỗi tham chiếu quá 10 bảng; hàm nghèo hơn spreadsheet — "quick calculation trong Excel thành phức tạp hoặc bất khả" ([Notion Mastery "Pushing Notion to the Limits"](https://notionmastery.com/pushing-notion-to-the-limits/)).
- **Grist:** ít ồn ào nhất (cộng đồng nhỏ hơn); rào cản là viết Python với non-tech — nhưng Grist bù bằng shortcuts + AI assistant. *(Ghi nhận: chưa tìm được thread than phiền tiêu biểu — coi là khoảng trống nghiên cứu, không phải "Grist hoàn hảo".)*

Bài học chung: **giới hạn minh bạch ngay từ mô hình (không có cell-formula) thì user chấp nhận; giới hạn lộ ra giữa chừng (formula depth, dependency limit, group-sum không ăn formula) thì user nổi giận.**

---

## 3 · ĐIỀU IF NÊN LÀM (đầu vào cho `SPEC-TRINH-BOQ-EDITOR`)

| # | Đề xuất | Căn cứ |
|---|---|---|
| 1 | **Chọn mô hình records-có-schema, TUYÊN BỐ thẳng trong spec: BOQ editor không phải Excel, không có tham chiếu ô.** Dòng = hạng mục từ `lib/boq/model`; cột = schema cố định + cột tuỳ chọn thêm | Cả 3 app chứng minh mô hình này đúng cho dữ liệu có cấu trúc; né toàn bộ nồi phức tạp engine công thức |
| 2 | **Bộ kiểu cột v1 chép tối giản từ Grist (6/11 kiểu):** Text · Numeric (format currency/`,`/số lẻ) · Integer · Choice (đơn vị: m²·m·md·cái·bộ·tấm…) · **Reference → vật liệu matId** (bảng vật liệu/ATLAS) · Computed (chỉ đọc). Attachment/Date/Toggle chưa cần | Grist 11 kiểu là bộ gọn nhất trong 3 app mà vẫn đủ; BOQ không cần hơn 6 |
| 3 | **Công thức theo CỘT, hiển thị kiểu "ƒx" trên header** (click header thấy công thức: `thành_tiền = khối_lượng × đơn_giá`), viết bằng ngôn ngữ công thức MINI chỉ có: `+−×÷`, tham chiếu cột cùng dòng, `ROUND`, `IF`. KHÔNG Python, KHÔNG cell ref | "Công thức hiển thị" đúng chữ ticket; mini-DSL đủ cho BOQ (thành tiền, VAT, hao hụt %); tránh depth-limit surprise kiểu Notion |
| 4 | **Khối lượng live-link = TRIGGER FORMULA kiểu Grist**: cell tính từ vùng tô/CAD, **sửa tay được**, sửa xong thành dữ liệu + **badge dấu chấm màu "đã sửa tay" + revert về số máy** (đúng luật `CHOT-TACH-AI-VA-CHINH-TAY`: tách bằng dấu + truy vết). Reload dự án: cell chưa sửa tay thì cập nhật theo CAD, cell đã sửa tay giữ nguyên + cảnh báo nếu số máy đổi | Trigger formula là phát minh đáng chép nhất của Grist; không app nào giải bài "auto nhưng override được có truy vết" — IF làm được vì có nguồn CAD |
| 5 | **Group + subtotal theo mô hình summary-bar của Airtable** (group theo phòng/tầng/hạng mục → dòng subtotal sum mỗi group + grand total), subtotal là DÒNG HIỂN THỊ do engine tính, không phải cell công thức | Né đúng cái bẫy Airtable (formula không đọc group-sum) bằng cách không cho công thức đụng subtotal ngay từ đầu; Grist summary table mạnh hơn nhưng là khái niệm thứ 2 phải học — v2 nếu cần pivot |
| 6 | **Nhập sai kiểu: cho nhập + highlight lỗi ở cell (kiểu Grist), không chặn cứng** | Chặn cứng làm mất số liệu đang gõ dở; Grist pattern thân thiện hơn |
| 7 | **Format số chép bảng Grist**: ngăn nghìn mặc định cho VND (0 số lẻ), chọn được số lẻ 0–2, `(-)` kiểu kế toán. Đơn giá nhập tay hoặc kéo từ Reference vật liệu (giá ATLAS nếu có) | Chuẩn kế toán quen mắt QS Việt Nam; ATLAS chỉ-đọc đúng `CHOT-HUONG-3D` |
| 8 | **Cột do người dùng thêm chỉ được 6 kiểu ở #2, có trần** (vd 30 cột) — công bố trần NGAY trong UI thêm cột | Airtable 500-field limit gây nổ vì lộ muộn; trần công bố sớm thì không ai giận |
| 9 | **Xuất xlsx: subtotal/group xuất thành dòng thật có công thức `SUM()` Excel** (không phải giá trị chết) — `lib/boq/xlsx` đã có, spec chỉ cần ghi yêu cầu này | Người nhận file xlsx (QS/nhà thầu) sẽ sửa tiếp trong Excel; số chết làm họ vứt file |
| 10 | **Không làm:** relation/rollup đa bảng kiểu Notion · pivot tự do · công thức Python · view lạ (board/gallery). BOQ v1 = MỘT bảng + group + subtotal + xlsx | Phạm vi ticket; mọi độ phức tạp thêm đều có án lệ than phiền ở §2 |

**Giới hạn nghiên cứu:** chưa khảo được UI thao tác INLINE thật của 3 app (kéo cột, resize, keyboard nav trong bảng lớn) — mô tả trên từ doc, không từ dùng thử; danh mục field Airtable/Notion tóm lược không đầy đủ từng kiểu (đủ cho mục đích chọn mô hình). Mini-DSL công thức ở #3 cần PHU thẩm định độ khó parse trước khi vào phiếu.
