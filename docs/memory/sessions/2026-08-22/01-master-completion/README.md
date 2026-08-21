# CURRENT POINTER

CURRENT COMMIT: 83ff452
CURRENT BRANCH: backup/2026-08-19-batch0a  (main = c7f3ac8, KHÔNG đụng)
LAST GREEN WAVE: 2D server backup + recovery (83ff452)
CURRENT WAVE: SESSION-01 · UI / Hệ thị giác
NEXT EXECUTABLE ACTION: đọc SESSION-01.md → đối chiếu Home với board EXS-C → sửa phần LỆCH
TRUE BLOCKERS:
  · DB write bị classifier chặn (1 lệnh cho Hoà, xem SESSION-05.md)
  · EXS-E biến thể Vitals V3-a — câu hỏi thị giác DUY NHẤT còn treo (SESSION-01)
  · Test điện thoại LAN (SESSION-06)
FILES NEXT SESSION MUST OPEN:
  docs/memory/sessions/2026-08-22/01-master-completion/SESSION-01.md
  docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md   ← HỢP ĐỒNG THỊ GIÁC, đọc trước
  components/home/DongStudioHome.tsx
EXACT TEST TO RUN NEXT:
  npm test && npx tsc --noEmit
  node scripts/kiem-3d-contro-that.js gate      # cần dev server :3000

---

# GREEN — DO NOT RE-AUDIT

Đã đo trên app thật bằng con trỏ thật + khẳng định bằng store/DB. Đừng chứng minh lại.

PRESENT: deck 25 slide "Giới thiệu IF" · sao lưu máy chủ · khôi phục sau khi XOÁ SẠCH IndexedDB ·
  lùi phiên bản khi bản mới hỏng · chặn deck rỗng ghi đè · activeId thắng resume.sheetId toàn cục.
2D: sao lưu máy chủ qua .idf · khôi phục sau xoá IDB · GIỮ NGUYÊN id từng entity · số entity · số
  điểm · không nhân đôi · "trống có chủ ý" vẫn lưu (không nuốt thao tác xoá) · sau khôi phục vẫn
  chạy 2D→Present→Quay lại 2D.
2D→PRESENT: neo cad2d · docId · sheetId · dấu vết nguồn · khổ · hướng · tỉ lệ · ảnh xem trước thật ·
  Thiết lập trang thuộc Present · về đúng tờ cũ · tờ gửi sống qua F5.
3D BASIC: vào 3D rỗng không đòi mặt bằng 2D · dựng Hộp/Tường/Trụ bằng cử chỉ · chọn · dời · xoay ·
  xoá · hoàn tác · Boolean · Array · Bevel · gizmo bám vật.
HỆ THỊ GIÁC: bộ board **EXS đã được Hoà DUYỆT MẮT 20/08** — hướng đã chốt, KHÔNG dựng lại,
  KHÔNG đề xuất lại. Đã xây xong: sidebar 3 độ sâu 52/240/320 · Vitals là APERTURE mép trên
  (không phải pill) · Profile gom Ngôn ngữ/Giới thiệu.
FORM: dùng lại BuildRecipe · gom theo ý định (Hình chính·Khoét·Chi tiết·Hoa văn) · sửa được bậc CŨ ·
  tắt bậc giữ nguyên tham số · hoàn tác · KHÔNG engine lịch sử thứ hai.

# OPEN WORK

Xem COMPLETION BOARD cuối tệp. Bảng đó là nguồn duy nhất, đừng đếm lại từ chat.

# SESSION MAP

01 UI / hệ thị giác / tích hợp Claude Design
02 3D còn lại (Scale/Resize thật) + Form + AI Form / FormScript
03 Workspace / continuity + UX lưu trữ + sức khoẻ bản sao
04 Chương trình ảnh chụp + bằng chứng deck
05 Hoà giải DB + toàn vẹn dữ liệu
06 Diễn tập toàn tuyến + sẵn sàng phát hành

# EVIDENCE / CHECKPOINT LOG

| commit | nội dung |
|---|---|
| 30e103b | 3D dựng khối bằng cử chỉ (nối tool3d.ts ↔ Scene3DViewer) |
| bf45718 | gom Hồ sơ — bỏ ⓘ/VI-EN lơ lửng khỏi Home |
| 8410638 | mock hệ thị giác 3 màn (đã đẩy Claude Design) |
| de6ad1e | cửa vào 3D rỗng hết đòi mặt bằng 2D |
| e40465d | Công Thức Hình — gom ngăn xếp theo ý định |
| b6095bc | đường về 2D từ Thiết lập trang |
| 4281f96 | rail hết khoá cụm CHẶNG khi hồ sơ trình duyệt trắng |
| f3d5079 | dựng lại deck + công thức deck lên đĩa |
| 3157787 | Present: bản sao máy chủ + sửa thứ tự quyền sở hữu tờ |
| d4d1fda | tờ gửi 2D sống qua tải lại |
| ae7dbd0 | NỐI bản sao máy chủ vào hydrate/autosave Present |
| 83ff452 | 2D: bản sao máy chủ + khôi phục + 9 test cổng chặn |

## Bài học đã trả giá — đừng lặp
1. Thành phẩm chỉ sống ở IndexedDB = tài sản KHÔNG có bản sao. Deck đã mất trắng một lần.
2. Sao lưu định kỳ có thể GIẾT bản sao: chạy lúc bộ nhớ rỗng → ghi đè bản tốt. Phải có cổng chặn.
3. Guard 2D KHÁC guard Present: KHÔNG lấy "0 entity" làm cớ từ chối — bản vẽ trống có chủ ý là hợp
   lệ; phân biệt bằng DANH TÍNH (hydrate + id/name/doc + tự đọc lại được).
4. `resume.sheetId` là con trỏ TOÀN CỤC, `activeId` là sự thật PER-PROJECT → activeId phải thắng.
5. `deck.id` bắt buộc, thiếu là `importIdfp` loại sạch, im lặng.
6. Đường đọc tệp là `/api/project-files/<id>/file`; `<id>` trần trả 405. Trường thời gian là
   `uploadedAt`, KHÔNG phải `updatedAt`.
7. Hai dev server cùng một thư mục = hỏng `.next` → route 404 / handler không gắn dù HTML hiện đủ.
   Chỉ MỘT server mỗi thư mục.
9. ⭐ TRUY BẢN ĐÃ CÓ TRƯỚC KHI VẼ MỚI. 21/08 tôi dựng `mock-he-thi-giac-3-man.html` như một đề
   xuất mới, trong khi bộ EXS đã được duyệt 20/08 VÀ phần lớn đã được xây (rail 52/240/320,
   VitalsAperture). Suýt làm lại việc đã xong. Claude Design có 44 board — `DesignSync list_files`
   trước, luôn luôn.
8. Cookie phiên là HttpOnly → không xuất được sang Playwright. Chụp ảnh phải qua pane đã đăng nhập.

# COMPLETION BOARD

| hạng mục | trạng thái | session |
|---|---|---|
| UI / SHARED SHELL | GREEN (EXS duyệt 20/08 + rail/Vitals đã xây) | 01 |
| HOME LIVING CANVAS (EXS-C, hero=Resume) | PARTIAL | 01 |
| VITALS aperture mép trên | GREEN · biến thể V3-a HUMAN-GATED | 01 |
| PROFILE / SETTINGS | GREEN | — |
| 2D VISUAL | OPEN | 01 |
| 3D VISUAL | PARTIAL | 01 |
| PRESENT VISUAL | PARTIAL | 01 |
| 3D GENERIC RESIZE | OPEN | 02 |
| 3D DETAIL CURRENT SET | PARTIAL | 02 |
| FORM RECIPE | GREEN | — |
| AI FORM | OPEN | 02 |
| FORMSCRIPT | OPEN | 02 |
| WORKSPACE CONTINUITY | PARTIAL | 03 |
| 2D PERSISTENCE | GREEN | — |
| PRESENT PERSISTENCE | GREEN | — |
| LOCAL DISK UX (lời mời) | OPEN | 03 |
| STORAGE SETTINGS | OPEN | 03 |
| BACKUP HEALTH (tín hiệu Vitals) | OPEN | 03 |
| SCREENSHOT SET | PARTIAL | 04 |
| 25-SLIDE DECK | GREEN | — |
| AUTO GRID / CUTOUTS | GREEN | — |
| DEEP LINKS | GREEN | — |
| RETURN LOOP | GREEN | — |
| DB RECONCILIATION | HUMAN-GATED | 05 |
| LAN | PARTIAL | 06 |
| PHONE | HUMAN-GATED | 06 |
| FULL-SPINE REHEARSAL | OPEN | 06 |
| RECOVERY REHEARSAL | GREEN | — |
| PRESENTATION READINESS | PARTIAL | 06 |
| PRODUCT TEST READINESS | PARTIAL | 06 |
| MAIN INTEGRATION READINESS | OPEN | 06 |

MASTER CAPABILITY 4 ĐỘ SÂU (chốt #10) | OPEN | 01-02
NON-DESTRUCTIVE LIBRARY SEMANTICS (chốt #12) | OPEN | 03

OPEN/PARTIAL/HUMAN-GATED còn lại: **21 cổng** (UI/shared-shell chuyển GREEN sau khi truy bản đã có).
