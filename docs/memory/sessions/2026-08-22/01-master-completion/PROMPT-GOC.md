# PROMPT GỐC — chiến dịch hoàn tất IF (Hoà giao 22/08)

Lưu nguyên văn để phiên sau không phải hỏi lại ý định. Bản thi hành nằm ở README.md + SESSION-*.md.

## Luật nền của chiến dịch
- KHÔNG phiên nào được cần lại bản chat này. Repo phải đủ ngữ cảnh.
- Chia việc còn lại thành NHIỀU PHIÊN, cấm gộp về một context khổng lồ.
- Ngân sách token: grep có đích · đọc đúng dải dòng · dùng lại test/harness sẵn có · ghi bằng
  chứng vào repo thay vì vào chat · báo cáo chỉ nói phần CHÊNH.
- Phiên mới thường chỉ cần đọc: docs/CLAUDE.md → docs/memory/LATEST.md → CURRENT POINTER của
  README chiến dịch → SESSION-XX.md của mình → đúng tệp mã nêu trong đó. Rồi THI HÀNH.
- NO-REBUILD: LOOK INSIDE → MAP EXISTING → CLASSIFY → CONNECT → EXTEND → NEW (chỉ khi có bằng
  chứng phủ định).
- Checkpoint nhỏ, có phạm vi. CẤM `git add -A`. Push nhánh backup. main KHÔNG đụng tới khi Hoà
  quyết tích hợp.
- Hết context KHÔNG phải là dừng chiến dịch — là BÀN GIAO sang phiên mới.

## Chỉ những thứ này mới là blocker của Hoà
1. quyền/thông tin đăng nhập Claude không có
2. hành động vật lý Claude không làm được
3. quyết định phá huỷ cần chủ sở hữu duyệt
4. lựa chọn sản phẩm mơ hồ về bản chất
5. bản ứng viên thị giác cần Hoà duyệt mắt
6. mọi cổng đạt hết
KHÔNG phải blocker: test đỏ · bug · thiếu mã · UI hỏng · ảnh cần chụp lại · việc dài · hết context.

## Cuối mỗi phiên
checkpoint → push → cập nhật CURRENT POINTER → cập nhật dòng GREEN/OPEN bị ảnh hưởng →
cập nhật docs/memory/LATEST.md (ngắn) → sửa SESSION-XX.md kế nếu thực tế đã đổi.
Trả lời cuối phiên NGẮN: COMMIT / GREEN / OPEN / BLOCKER / NEXT SESSION / FILES TO OPEN / FIRST TEST.

## Phân vai 6 phiên
01 UI/hệ thị giác · 02 3D còn lại + Form + AI Form · 03 Workspace + UX lưu trữ ·
04 Ảnh chụp + bằng chứng deck · 05 Hoà giải DB · 06 Diễn tập toàn tuyến.

## Song song trong một phiên
Tối đa ~3 lane ghi rời nhau + 1 lane QA chỉ-đọc. MAIN là người tích hợp và là nơi checkpoint duy
nhất. Agent con KHÔNG tự push khi lane còn chạy.
