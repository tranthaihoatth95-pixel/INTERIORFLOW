# ĐỐI CHIẾU 3 TRƯỜNG PHÁI — Google · Apple · Creative Tools → công thức IF/IDF (13/08/2026)

> Hoà đặt bài: các hãng đỉnh có ĐIỂM CHUNG, nhưng tối ưu sâu theo con đường riêng vì đầu ra khác
> nhau; IF/IDF thống nhất yếu tố chung làm NỀN, tối ưu riêng thành GÓI TÁC VỤ linh hoạt.
> Nguồn: about.google/philosophy · SWE-at-Google (Abseil) · SRE books · HIG gốc + Liquid Glass
> 27 · Creative Selection · Figma/Blender/Adobe/Procreate. Bản đầy đủ 10 bài học + nguồn:
> báo cáo agent NC 13/08. [Đ2][Đ3]

## 1 · ĐIỂM CHUNG cả 3 trường phái — và nó TRÙNG với cây TRIET-LY-IF

| Nguyên tắc chung (có nguồn cả 3 nhà) | Điều khoản IF tương ứng |
|---|---|
| Lấy người dùng làm gốc ("Focus on the user…" · HIG user-control · "tool disappears") | [N1] |
| Một nguồn sự thật, chống phân mảnh (monorepo · Consistency HIG · Lightroom non-destructive) | [T1] |
| Kiểm chứng bằng thực nghiệm, không cảm tính (Beyoncé Rule/SLO · demo-driven · Blender RNA) | [T6] |
| Phức tạp được GIẤU, không bị XOÁ năng lực ("it just works" · design docs alternatives) | [N2] |
| Sửa sai công khai (blameless postmortem · Apple sửa Liquid Glass · Adobe mở PDF) | [T0] |

**Kết luận 1:** phần chung của cả 3 đế chế = đúng 5 điều đã nằm trong TRIET-LY-IF. Cây triết lý
của Hoà không cần vay thêm nguyên tắc nền nào — nền ĐÃ ĐỦ, việc còn lại là thực thi.

## 2 · ĐƯỜNG RIÊNG từng nhà — họ hy sinh gì để sâu ở đâu

- **Google → SCALE + ĐỘ TIN ĐO ĐƯỢC**: hy sinh linh cảm cá nhân lấy quy trình lặp được ngàn người;
  review tập thể trước trunk; toil bị coi là nợ (trần 50%).
- **Apple → TRẢI NGHIỆM CẢM NHẬN + TÍCH HỢP DỌC**: hy sinh độ mở lấy kiểm soát chip-tới-pixel;
  hy sinh tốc độ ship lấy gu (demo chết trong nội bộ là bình thường); Undo là hạ tầng bắt buộc.
- **Creative tools → FLOW-STATE NGƯỜI LÀM NGHỀ** (trong nhóm lại chia đường): Adobe phủ chuẩn
  ngành đổi bằng nặng-học-lâu · Figma zero-friction cộng tác đổi bằng offline · Blender pro-speed
  + script-hoá đổi bằng dốc học · Procreate mượt tuyệt đối đổi bằng THU HẸP phạm vi.

**Kết luận 2 — gọi tên đường của IF:** *HIỂU SÂU NGHỀ NỘI THẤT + MỘT-NGUỒN XUYÊN CHẶNG + GÓI TÁC
VỤ 2 TẦNG [N2]*. IF hy sinh: không đua render-engine thuần (D5 lo), không đua multiplayer thuần
(Figma lo), không thu hẹp kiểu Procreate (vì K1 một-nguồn 2D-3D-Present là luận điểm cạnh tranh)
— đổi lại phải BÙ rủi ro ôm-nhiều-việc bằng kỷ luật mode/chặng để TỪNG MÀN vẫn cảm giác
một-việc-ít-nút như Procreate dù hệ bên dưới lớn.

## 3 · Bài học chuyển giao — 10 bài kèm CẢNH GIÁC (đầy đủ trong báo cáo NC; đây là 3 cảnh báo vận hành T nâng lên mức đỏ)

1. **Băng thông duyệt của Hoà là tài nguyên khan hiếm nhất hệ thống** (bài #6 — Apple có cả đội
   gu, IF có MỘT người duyệt mắt; nợ mắt đang 45). Đối sách: lô duyệt mắt gộp + checklist 7 cấm
   kỵ rút ngắn mỗi lần soi + T pre-soi bằng máy tối đa trước khi đụng mắt Hoà.
2. **Học ĐÍCH ĐẾN của Adobe, đừng học TRÌNH TỰ** (bài #8): Adobe mở PDF sau khi đã thống trị;
   IF mở từ đầu (xuất thật, sửa được, Gói Hồ Sơ Sống 3 tầng thoái lui) — đó là chiến lược đúng
   cho kẻ đến sau, không phải bắt chước ngược.
3. **Phân biệt CHỐT NỀN vs CHI TIẾT THI CÔNG** (bài #10): Google xét lại 10 điều sau nhiều năm;
   IF đang định hình nhanh — nếu cái gì cũng "chốt lại được mỗi phiên" thì chữ CHỐT mất giá.
   Từ nay: TRIET-LY-IF = chốt nền (đổi phải sửa văn bản hiến pháp, hiếm); mọi thứ khác = thi
   công (đổi thoải mái theo quy trình). Sổ 00-CHOT giữ vai trò nhật ký thi công.

Các bài còn lại đã trùng cơ chế sẵn có (design-docs≈bảng plan · SLO≈CHUAN_DAU_RA nhị phân ·
blameless≈luật sự-cố-DB · demo-driven≈ship-trước-sửa-sau · undo-hạ-tầng≈hệ CẤP 1 · Figma-học-
có-chọn-lọc≈đã hoãn WebRTC đúng). Một ghi chú T0 đẹp từ chính NC: câu trích "concentric circles
of caring" KHÔNG tìm được nguồn gốc → không dùng — sửa-sai-công-khai áp cho cả việc nghiên cứu.
