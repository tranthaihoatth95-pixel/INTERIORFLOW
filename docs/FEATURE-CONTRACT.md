# FEATURE CONTRACT — hợp đồng 4 câu máy-đọc (P5 bậc 1, 13/08/2026)

> Chữa anti-pattern #1: "lõi dày, tính năng lẻ tẻ, KHÔNG sợi dây liên kết" (đo 08/08:
> 14 kho code+test xong, 0 caller). Từ nay engine mất dây là MÁY báo — không đợi ai
> đối chiếu tay 42 spec. Sổ: `scripts/contract-registry.mjs` · máy: `npm run soi:contract`.

## 4 câu là gì (chốt 11/08, CẤP 1 hệ tên)

Mọi tính năng/engine phải trả lời được 4 câu — chữ người đọc, không phải regex:

| Câu | Trường | Ví dụ (build-ops) |
|---|---|---|
| **Đọc gì** | `doc` | hình học nhóm khối + tham số BuildOp trong Doc |
| **Ghi gì** | `ghi` | geometry three.js — không ghi ngược Doc |
| **Để lại công thức gì** | `congThuc` | BuildOp union tái-chạy-được (model.ts:490) |
| **Ai ăn theo** | `anTheo` | Command3DPanel · Scene3DViewer · BuildRecipe |

Kèm 2 điều kiện MÁY soi: `loi` (hàm lõi có tên — mất khớp = regress) và `day`
(grep caller thật NGOÀI module gốc + ngoài test) + `trangThai: 'co-day' | 'cho-day'`.

## Cách thêm entry — cùng kỷ luật frontier

1. **Tính năng/engine mới = entry contract NGAY LÚC CHỐT, trước khi code.**
   Chốt không vào registry coi như chưa chốt (luật 11/08).
2. Viết đủ 4 câu — câu nào chưa biết thì ĐỌC CODE/SPEC rồi viết đúng, không viết suông.
3. `loi.mau` trỏ HÀM CÓ TÊN (khớp luật 7 hiến pháp "không có nút thì không có AI" —
   năng lực phải là hàm gọi được). `day.mau` ưu tiên pattern import/chuỗi literal
   để né comment nhắc tên (bài học: Scene3DViewer chỉ COMMENT captureSequence).
4. Kho viết xong chưa ai gọi → `trangThai: 'cho-day'` — nó vào bảng KHO CHỜ DÂY,
   không tính lệch. Khi có caller đầu tiên, máy tự nhắc flip.
5. Miễn khai: các máy soi (`soi-*.mjs`) — build-tooling, không phải feature app.

## Cách đọc output `soi:contract`

- **① 🔴 REGRESS** — lõi mất khớp: engine bị xoá/đổi tên mà sổ vẫn khai. Sửa code
  hoặc sửa sổ theo sự thật, KHÔNG nới pattern cho sạch giả.
- **② 🔴 MẤT DÂY** — khai `co-day` mà 0 caller: dây từng có nay đứt (refactor làm rơi).
- **③ 🔴 SỔ QUÊN** — khai `cho-day` mà có caller: kho đã mở, sổ chưa flip → máy in
  gợi ý flip. Đúng bệnh "đề xuất lại thứ đã có" (luật N8).
- **🟡 KHO CHỜ DÂY** — lõi sống, 0 caller: hàng đợi nối dây xếp theo đòn bẩy
  (thứ tự trong registry). Đây là danh sách việc-rẻ-nhất cho phiếu sau.
- Exit 1 CHỈ khi có 🔴 — gắn được vào nhịp kết-phiên cùng `soi:frontier`.

## Nạp đầu 13/08 — sự thật grep, không chép sổ 08/08

22 entry: 14 kho `DOI-CHIEU-42-SPEC §1` (kiểm lại từng kho: **12/14 ĐÃ MỞ** trong các
đợt 12-13/08, chỉ còn capture-sequence + lux-l6 chờ dây) + 8 engine 12-13/08
(DistillEngine · TableDocEngine · BuildRecipe · pdfToDeck · packHoSoSong ·
GroundedRender · suggestScaffold · TaskContext). Dòng tổng lần đầu:
`CONTRACT — 🔗 20 có dây · 🟡 2 chờ dây · 🔴 0 LỆCH`.

## Giới hạn bậc 1 — nói thẳng

- **Chưa soi được "nút mồ côi" tổng quát** (nút UI không trỏ về hàm lõi có tên — chiều
  ngược của mất-dây). Cần map nút→lệnh của `hotkey-registry` (entry frontier đợt 6)
  làm nguồn; đó là việc BẬC SAU, mở rộng luật 7 thành "không có DÂY thì không có NÚT".
- Đếm dây ở mức FILE khớp regex, không phân tích import-graph thật — caller trong
  comment vẫn có thể lọt nếu pattern khai ẩu (kỷ luật: pattern import-based).
- 4 câu là văn người viết — máy chỉ soi `loi`/`day`, không kiểm ngữ nghĩa 4 câu.
