# NC · HOME THEO CẢM NHẬN NGƯỜI DÙNG — nghiên cứu + 3 hướng + đề xuất (12/08/2026)

> Hoà đặt bài: *"luồng thao tác chung chưa tối ưu, cái thừa cái thiếu… cần một giải pháp
> thông minh, sáng tạo và tối ưu hơn dựa trên cảm nhận người dùng."*
> Bài này = quét 12 sản phẩm hàng đầu theo góc CẢM NHẬN (không liệt kê tính năng) →
> 7 nguyên tắc → 3 hướng phác (đã gửi Hoà bản nhìn được: `phac-home-3-huong.html`) →
> đề xuất tổng hợp. **Chưa chốt — chờ Hoà.**

## 1 · Bệnh hiện tại của Home (đo thật trên app 12/08)

Home đang là màn "chọn FLOW", không phải dashboard: hero 2 dòng + thanh Vitals to chiếm ~1/3
màn; card flow lẻ trộn card dự án ("Untitled flow" ×3, "Dự án mẫu" ×2); nút "Đồng bộ tiến độ"
bệnh (Lark chưa cấu hình, tooltip lỗi); thông tin đáng giá (ai online, việc đến hạn, dự án nào
nặng) không có mặt. Cái thừa đứng giữa màn, cái thiếu vắng mặt.

## 2 · Quét 12 sản phẩm — mỗi dòng một bài học cảm nhận

| Sản phẩm | Cảm nhận trung tâm | Bài học lấy được | Bẫy cảnh báo |
|---|---|---|---|
| Monograph (PM cho KTS) | kiểm soát vận hành | tín hiệu trực quan TRƯỚC, Gantt là lớp 2 | số khô không hình → KTS thấy xa lạ |
| Programa | tự hào trước khách | tách lớp NỘI BỘ ↔ lớp TRÌNH KHÁCH, cùng một nguồn | trộn 2 lớp → ngại chia sẻ |
| Rayon | tốc độ vào việc | màn đầu = đường tắt tới thao tác hay dùng | phơi cả kho → ngợp |
| Figma file browser | **tiếp tục việc dang dở** | Recents là mặc định, điều hướng là phụ | empty state trắng chờ đoán |
| D5 Launcher | cảm hứng + sẵn sàng | hub sống cả khi chưa có project | hub thành quảng cáo |
| Notion Home | "không gian CỦA TÔI" | mặc định phải có giá trị khi chưa ai cấu hình | bắt user tự dựng dashboard → bỏ trống |
| Linear Roadmap | tốc độ + chuẩn có chủ đích | **timeline = lớp phủ trên dữ liệu THẬT** (% tính từ issue thật, không cập nhật tay); gom cấp initiative, bung chi tiết khi cần | Gantt tĩnh phải bảo trì tay = chết |
| Frame.io | rõ ràng giữa hỗn loạn | neo dữ liệu lên HÌNH (comment trên khung hình) | nhồi nhiều bản/file → "nặng" |
| Things 3 | **nhẹ đầu** | Today/Evening — chỉ hiện việc cần NGAY, giấu cả hệ thống | nhét mọi trạng thái vào một màn |
| Fantastical | an tâm vì biết trước | **DayTicker: timeline BỎ QUA khoảng trống**, chỉ hiện ngày có việc | lịch đều tăm tắp kể cả ô trống = máy móc |
| Arc | bình tĩnh giữa quá tải | mặc định "quên" thứ cũ; danh sách cuộn, không nén | item co cụm khi tăng → mất kiểm soát |

## 3 · Bảy nguyên tắc cảm nhận cho Home IF (desktop, studio 2-15 người, dữ liệu còn mỏng)

1. **"Tiếp tục" trước "tổng kết"** — câu đầu tiên Home trả lời: *tôi đang dở gì, bấm đâu làm tiếp* (khớp chốt lastStage 12/08).
2. **Số đi kèm hình** — mọi con số gắn với ảnh dự án/avatar người; không có bảng số trần.
3. **Timeline là sự thật sống** — tính từ Task/stage/Milestone thật, gom mốc lớn, KHÔNG phải kế hoạch tĩnh cập nhật tay; đoạn trống trên trục thì nén lại (DayTicker).
4. **Ẩn/hiện theo NGỮ CẢNH** — mặc định lọc "dự án đang nóng", không liệt kê đều.
5. **Trống = khoảnh khắc dạy** — mỗi vùng trống có một hành động rõ, không số 0 tròn (khớp luật §9 "ô trống là bằng chứng còn việc").
6. **Tách lớp nội bộ ↔ trình khách** — Home nội bộ khoe tiến độ tự tin, nhưng lọc ra được "bản đẹp trình khách" sau này (nối Review Gate).
7. **Mật độ co giãn bằng ĐỔI DẠNG, không nén** — >8 dự án: carousel→grid (đã chốt TICKET-GALLERY-TOGGLE); nhiều nữa: lọc nóng mặc định.

## 4 · Ba hướng phác (bản nhìn được đã gửi Hoà)

- **A · "Sáng nay"** — briefing trước, card sau. Cảm nhận: an tâm/nhẹ đầu (Things 3). Yếu khi dữ liệu mỏng.
- **B · "Dòng thời gian studio"** — trục năm + nấc tháng, card neo trên trục. Cảm nhận: tự hào + nắm nhịp. Đúng trực giác Hoà; cần Milestone model làm chân.
- **C · "Sảnh triển lãm + lớp dữ liệu"** — gallery yên tĩnh, hover/Tab phủ lớp kính số liệu. Cảm nhận: đẹp trước, kiểm soát khi cần.

## 5 · ĐỀ XUẤT CỦA T — "DÒNG STUDIO": ghép 3 hướng thành 3 TẦNG CẢM NHẬN trên một màn

Không chọn 1 bỏ 2 — mỗi hướng đúng cho MỘT khoảnh khắc, xếp chồng theo thứ tự mắt đọc:

```
┌─ TẦNG 1 · TIẾP TỤC (mỏng, 1 dòng)  ← cảm nhận: nhẹ đầu, vào việc ngay
│  "Chào Hoà · thứ Tư" + 2-3 việc/mốc NÓNG nhất + pill Vitals góc phải
│  (Figma Recents + Things Today; TRỐNG THÌ TỰ ẨN — còn mỗi lời chào)
├─ TẦNG 2 · TRIỂN LÃM (chiếm màn)    ← cảm nhận: tự hào, "studio của tôi"
│  Card DỰ ÁN image-forward, ambient tint từ ảnh (ref #5); hover/giữ Tab
│  → lớp kính dữ liệu phủ lên (chặng · việc mở · ai online · mốc kế — hướng C)
│  Flow lẻ chưa gắn dự án gom 1 ngăn "Nháp" thu gọn.
└─ TẦNG 3 · NHỊP THỜI GIAN (dải dưới) ← cảm nhận: an tâm, biết chuyện sắp tới
   Trục năm + nấc tháng kiểu DayTicker: CHỈ hiện đoạn có mốc/hoạt động,
   thanh dự án + vạch HÔM NAY kem; dữ liệu THẬT từ ProjectProfile.start +
   Milestone + Task (Linear-style, không Gantt tay). Click mốc → deep-link
   TaskContext rơi đúng workspace. Hover card tầng 2 ↔ thanh tầng 3 sáng đồng bộ.
```

Vì sao "thông minh hơn" bảng-widget: nó không thêm widget nào — nó xếp lại đúng **3 câu hỏi
người dùng tự hỏi theo thứ tự** khi mở app: *làm gì tiếp? → studio mình thế nào? → sắp tới có gì?*
Mỗi tầng một nguyên tắc, tầng nào thiếu dữ liệu tầng đó tự ẩn, không tầng nào chồng chức năng
với workspace sâu (Bảng việc/Gantt/Chat giữ nguyên vai cấp 0.5).

**Cắt bỏ (điều Hoà đòi "logic ít xài thì bỏ"):** hero 2 dòng + subtitle → 1 lời chào; nút Lark
chưa cấu hình → ẩn hẳn; thanh Vitals giữa màn → pill (khuôn Siri §4b); "Chi tiết"/"Đổi bìa" gom
vào menu card; card flow lẻ rời khỏi mặt tiền.

**Chân kỹ thuật cần (đợt thi công):** ① Milestone model + mảnh TIMELINE bảng khởi tạo ghi thật
② tải dự án đếm từ Task ③ lớp kính hover dùng hover-gradient-kem (entry sẵn) ④ giữ toggle
carousel/grid. Toàn bộ ăn dây đã ship: ProjectProfile · TaskContext · PresenceRow · Bảng khởi tạo.

## 6 · Nguồn chính

Monograph/Programa/Rayon (site + review) · Figma Help "file browser" · D5 Launcher guide ·
Notion home templates · Linear docs (Triage, Roadmap Timeline changelog 2021-05) · Frame.io
workflow + G2 · Things 3/Fantastical reviews (Sweet Setup, Flexibits DayTicker) · Arc UX
analyses (LogRocket) · Eleken/Pencil&Paper empty-state UX · Userpilot progressive disclosure.
(Link đầy đủ trong báo cáo agent NC, phiên 12/08.)
