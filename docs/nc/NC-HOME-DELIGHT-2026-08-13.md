# NC · ĐẨY HOME THÚ VỊ — cơ chế "muốn trở về" (13/08/2026)

> Hoà đặt bài 13/08: *"trang home phải làm sao cho người ta cảm giác muốn trở về. nghiên cứu
> thêm đẩy home thú vị đi."* Bổ sung cho `NC-HOME-CAM-NHAN-2026-08-12.md`. Nguồn quét:
> Momentum · Arc Spaces · Apple TV Aerial · macOS dynamic wallpaper · GitHub graph · Strava
> Year-in-Sport · Fantastical DayTicker · Linear Cycle Graph · CARROT Weather · studio
> kiến trúc thật · Tot/Apple Notes/FigJam.

## Ba định luật rút ra

1. **Dữ liệu THẬT của studio là thứ duy nhất không "hết mới" sau 2 tuần.** Nội dung trang trí
   ngoài (ảnh Aerial, quote Momentum) thú vị lần đầu rồi thành noise; số thật đang chạy
   (Linear Cycle Graph) thì mỗi lần nhìn là một sự thật mới.
2. **Ánh sáng/thời gian là cơ chế rẻ nhất mà bền nhất** — dựa quy luật vật lý thật (macOS
   dynamic wallpaper tính góc mặt trời), não tin vì khớp ánh sáng ngoài cửa sổ. Với app nội
   thất còn ăn khớp nghề ("ánh sáng kể giờ" đã chốt).
3. **Tích luỹ, không streak.** GitHub graph được yêu vì "một năm nỗ lực trong một hình";
   thành áp lực khi có ngôn ngữ giữ-chuỗi/phạt (bài học đã ghi nhận công khai). Strava
   paywall cảm xúc → phản tác dụng. IF: chỉ TÍCH LUỸ + TƯỜNG THUẬT, cấm phạt/điểm/streak.

## 8 cơ chế (xếp theo bền/chi phí) — 1-3+5-8 đã vào phiếu `home-dong-studio` v1

| # | Cơ chế | Nguồn dữ liệu IF | Bền | Chi phí | V1? |
|---|---|---|---|---|---|
| 1 | Ánh sáng theo giờ thật (nền đổi sắc độ; ảnh render dự án làm nền khi có) | asset dự án + giờ hệ thống | cao | TB | ✅ |
| 2 | Dải "hôm nay của studio" (việc xong · ai online · chuyển chặng, click nhảy ngữ cảnh) | Task/Presence/lastStage | cao | thấp | ✅ |
| 3 | Lưới tích luỹ studio (GitHub-graph, KHÔNG streak) | Task xong + revision | TB-cao | TB | ✅ |
| 4 | "Chuyện của tuần" tự sinh (Strava-style rút gọn, rule-based) | aggregate tuần | TB | TB-cao | hàng đợi |
| 5 | Bảng tin studio TỰ SINH (không CMS — chết nếu bắt người viết) | sự kiện thật từ dữ liệu | TB | thấp-TB | ✅ |
| 6 | Ghi chú nhanh kiểu Tot (chấm màu theo dự án, gõ 2 giây, 0 form) | JSON per-user + neo dự án | cao | thấp | ✅ |
| 7 | Lời chào dữ liệu thật (không quote sáo — nhàm NGAY nếu chung chung) | Task đến hạn + TaskContext | cao | thấp | ✅ |
| 8 | Card dự án "còn sống" (cover = ảnh mới nhất + presence) | asset mới nhất + PresenceRow | cao | thấp | ✅ |

## Bẫy ghi bảng (áp khi nghiệm thu Home)

- Quote/câu chào lặp sau 2 tuần = noise → chỉ nói khi CÓ chuyện thật, không có thì im (tự ẩn).
- Ánh sáng theo giờ mà LỆCH giờ thật/giật chuyển cảnh = phản tác dụng ("thấy sai").
- Feed tin bắt người đăng tay = chết sau vài tuần → chỉ tự sinh.
- Giọng bình luận (nếu sau này Vitals nói) phải điềm tĩnh quiet-luxury, không "sassy" CARROT.
- Cảm xúc không được paywall (bài học Strava).

Link nguồn đầy đủ: báo cáo agent NC 13/08 (phiên T).
