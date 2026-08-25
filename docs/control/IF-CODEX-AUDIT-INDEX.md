# CHỈ MỤC AUDIT CODEX — 8 phiên, 25/08/2026

> ⚠️ **VÌ SAO TỆP NÀY TỒN TẠI.** Tám phiên Codex dưới đây sản sinh audit/ADR/nghiên cứu có giá trị
> thật, nhưng chúng **chỉ sống trong link chat ChatGPT**. Đó đúng là thứ `IF-CANONICAL` cấm:
> *chat không phải nguồn sự thật*. Link mục nát, hoặc một phiên nguội không mở được link, là mất sạch.
> Tệp này **KHÔNG** chép lại nội dung — nó ghi **kết luận + con trỏ**, để biết đã có gì và đi tìm ở đâu.
>
> 🔴 **TRẠNG THÁI CỦA MỌI THỨ DƯỚI ĐÂY: `[ĐỀ XUẤT]`.** Chưa cái nào là `[CHỐT]`.
> Luật `IF-AUDIT-MEMORY`: **AUDIT LÀ BẰNG CHỨNG, KHÔNG PHẢI THẨM QUYỀN.** Muốn thành luật thì
> phải qua ADR có Hoà duyệt, ghi vào canonical, và đóng dấu thứ nó thay.

| # | Phiên | Namespace | Kết luận chính |
|---|---|---|---|
| 13 | **IF Kiểm định · Chất lượng** | IF | Trạng thái là **PARTIAL, không phải PASS**. Trần bánh cóc khoá đúng số 137 F-ICON-STROKE nhưng **không chứng minh 137 ca đều là icon**. Thước stroke có nguy cơ đếm oan: nó lấy `viewBox` **gần nhất phía trước**, không xác nhận cùng phần tử SVG; không thấy viewBox thì **mặc nhiên tính là icon**; regex nhận cả `stroke-width: N` trong CSS. `--tu-kiem` chứng minh **recall**, chưa chứng minh **precision** |
| 20 | **IDF Kiến trúc · Contract liên-app** | IDF | **Chưa có cross-app contract chạy thật** IF↔ArchiNote. Hai hướng cạnh tranh chưa ai phân xử: PROJECT_STATUS qua Lark ↔ field-note qua `.idf`. **`.idfnotes` là khái niệm ma** — 0 nơi đọc, 0 nơi ghi. Đề nghị `ADR-IDF-AN-001`: tách **control plane** (Lark, nhẹ) khỏi **data plane** (capture bundle) |
| 11 | **IF Sản phẩm · Luồng nghề** | IF | Chưng cất chuỗi vàng thành **sáu outcome người dùng**: vào đúng việc · hình thành một sự thật dự án · phát triển liên tục · biến ý tưởng thành quyết định · phát hành có trách nhiệm · quay lại mà không mất trí nhớ |
| 10 | **IF Thiết kế · UX/UI Authority** | IF | Liệt kê target còn hiệu lực + trạng thái. **Foundation vẫn là CANDIDATE, chưa APPROVED.** Ba phương án Login A/B/C **chờ chọn bằng mắt**. Xác nhận canonical thắng mock ở con số rail: **52px**, `PEEK` tự thu / `OPEN` không / `PINNED` thường trực |
| 30 | **Nghiên cứu · Tham chiếu** | — | Ma trận **cơ chế** (không phải diện mạo) của sản phẩm chuyên nghiệp về resource hub/permission. Nguồn chính thức, tách rõ `OBSERVED` ↔ `INFERENCE` ↔ `PROPOSED` |
| — | **Product Architecture · Tenant** | IF | IF **chưa có tenant/org/team model**, chưa có guest lifecycle. Đang dùng `User` + `Project` + thư mục local làm ranh giới quyền — **không tương thích SaaS đa tenant** |
| — | **Knowledge storage** | IF | So sánh 5 hướng lưu tri thức sản phẩm (Drive-backed ↔ cloud DB ↔ local-only ↔ hybrid local-first ↔ connector ngoài). **Chưa kết luận** — đúng luật, chưa đủ requirement |
| — | **TTT Client Profile** | TTT-* | Hồ sơ khách hàng đầu tiên như một **tenant**. Ràng buộc trung tính: **cấm hardcode TTT** vào IF core; brand chỉ sống trong Brand Kit/adapter |
| — | **IDF System Audit** | IDF | 10 finding P0–P3. Bốn P0: cây làm việc là kho duy nhất của khối chưa bảo toàn · nhiều tài sản governance vẫn untracked · current-state stale + tự chứa hai writer state · **nguy cơ nhiều command center cùng sống** |

## Ba thứ đã KIỂM và đã VÁ trong lượt này

| Cáo buộc | Kiểm | Xử |
|---|---|---|
| `IF-CURRENT-STATE` dòng đầu stale (`main · c7f3ac8`) | **ĐÚNG** — thật là `checkpoint/2026-08-24-control-plane · f70adb6` | đã vá + luật: đóng phiên phải **đo lại**, cấm chép số cũ |
| Ô người ghi tự mâu thuẫn | **ĐÚNG** | ô nay `NONE`; phiên Codex đã trả bút đúng thủ tục |
| Định danh bằng `pid` | 🔴 **LỖI CỦA CONTROL PLANE** | xem **M-56** — `ps -p` LUÔN báo chết vì pid là shell của MỘT lệnh Bash. Nay định danh = **tên phiên**, kiểm sống = **`ListAgents`** |

## Việc phải làm với tệp này — đừng để nó thành chỉ mục chết

1. Mỗi kết luận muốn thành luật ⇒ **ADR riêng**, Hoà duyệt, ghi vào canonical, **đóng dấu thứ nó thay**.
2. Cáo buộc nào chưa kiểm thì **giữ nguyên nhãn `[ĐỀ XUẤT]`** — cấm đọc thành sự thật.
3. Ưu tiên cao nhất, và nó **khớp đúng việc kế tiếp đã chốt**: audit thước `F-ICON-STROKE`.
   Phiên 13 đã cho sẵn **bộ probe** — dùng nó, đừng nghĩ lại từ đầu:
   · icon 24×24 nét sai → **phải bắt**
   · icon không khai viewBox → quyết rõ: bắt, hay báo *"không đo được"*
   · tranh 200×200 nét 0.35 → **không được tính**
   · chuỗi sinh SVG → **không được tính**
   · hai SVG liên tiếp → `strokeWidth` của SVG sau **không được gán viewBox của SVG trước**
   · SVG lồng nhau · CSS `stroke-width` → phải phân loại đúng
   ⇒ **Chỉ sau khi precision được chứng minh mới chốt baseline thật rồi mới sửa 137 chỗ.**
