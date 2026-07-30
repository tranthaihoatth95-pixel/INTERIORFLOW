# VERIFY-B3 — Thử sập & phục hồi (auto-backup CAD)

> 30/07 khuya. Trước khi thử: Hoà chốt sửa TRƯỚC 3 việc ①②③ (bỏ "giữ 5 bản" → thang thời gian +
> lưu chênh lệch). Mã liên quan: B1 (ghi, đã có), B3 (phục hồi, tài liệu này).

## Tóm tắt kết quả

| Bước Hoà yêu cầu | Đạt/Không | Ghi chú |
|---|---|---|
| Sửa ①②③ trước khi thử | ✅ Đạt | `lib/cad/backup-diff.ts` mới + `auto-backup.ts` viết lại |
| (a) app không crash lúc khởi động | ✅ Đạt (suy ra từ code) | mọi đường đọc file bọc try/catch, không throw ra ngoài |
| (b) hiện được lối phục hồi | ✅ Đạt | menu "Khôi phục từ backup…" + modal mới, verify browser thật |
| (c) phục hồi ra ĐÚNG nội dung trước khi giết | 🟡 Đạt ở mức thuật toán, CHƯA đạt ở mức OS-kill thật | xem "Giới hạn" bên dưới |
| (d) đúng sheet đang mở | ✅ Đạt | `activeId` = sheet đầu tiên trong bản ráp được |
| (e) không mất sheet nào | ✅ Đạt (khi chuỗi nguyên vẹn) | round-trip test đủ kiểu đổi (thêm/xoá/sửa sheet+entity) |
| Giết ĐÚNG LÚC đang ghi | 🟡 Đạt ở mức thuật toán (file hỏng dở → bỏ qua) | chưa giết tiến trình thật được |
| Lấy bản thứ 2/3/4/5, không chỉ mới nhất | ✅ Đạt | `reconstructUpTo`/`recoverBackup` nhận `targetIndex` bất kỳ, UI liệt kê đủ |

**Kết luận ngắn**: lớp THUẬT TOÁN (chỗ dễ sai nhất — sai ở đây là mất dữ liệu âm thầm) đã được
thử nghiêm ngặt và ĐẠT. Lớp "giết tiến trình OS thật giữa lúc ghi" KHÔNG thử được trong môi
trường phiên này (giải thích ở dưới) — cần Hoà (hoặc máy thật) tự làm 1 lần, có hướng dẫn 3 bước
ở cuối tài liệu.

---

## ① SỬA TRƯỚC — bỏ "giữ 5 bản", thang thời gian + lưu chênh lệch

**`lib/cad/backup-diff.ts`** (mới, thuần — không đụng File System Access API):
- `diffSheets()`/`applyDiff()` — chênh lệch theo ENTITY (không phải byte), fallback lưu NGUYÊN
  sheet khi field khác `entities` đổi (layers/viewport/...).
- `planRetention()` — thang: 1 giờ giữ MỌI bản · 24 giờ 1 bản/giờ · 30 ngày 1 bản/ngày · xa hơn 1
  bản/tuần KHÔNG giới hạn (`RETENTION_TIERS`, CONFIG không hard-code). **Bất biến bắt buộc**: một
  bản chênh lệch được GIỮ mà đoạn chuỗi dẫn tới nó có chỗ bị XOÁ → tự ĐÚC (materialize) thành bản
  đầy đủ MỚI trước khi xoá — không bao giờ để lại 1 bản không tự đứng được.
- `reconstructUpTo()` — ráp trạng thái tại 1 điểm bất kỳ; gặp entry thiếu/hỏng → DỪNG NGAY, trả về
  mốc TỐT NHẤT ngay trước đó (không nhảy qua lỗ hổng ráp tiếp — sẽ ra bản SAI mà tưởng đúng); mốc
  đầy đủ bản thân cũng hỏng → tự lùi về mốc đầy đủ TRƯỚC ĐÓ, không throw.
- `formatBackupRelativeTime()` — "10 phút trước · 1 giờ trước · hôm qua 15:20 · thứ Hai · tuần
  trước" đúng yêu cầu ③.
- Cứ 20 bản ghi 1 mốc đầy đủ (`FULL_SNAPSHOT_EVERY`).

**Test — `lib/cad/backup-diff.test.ts`, 50/50 pass**: round-trip diff/apply đủ 8 kiểu đổi (thêm/
xoá/sửa entity, thêm/xoá sheet, đổi field khác entities, diff hỏng không throw) · tỉa theo thang
thời gian (2 kịch bản: thưa không tỉa gì / dày tỉa đúng, kể cả trường hợp **bản full-anchor gốc
cũng bị xoá** khi không phải đại diện — đã xác nhận đúng bằng debug script trước khi sửa test, KHÔNG
phải bug) · **2 đại diện khác bucket cùng gãy bởi 1 lần xoá → cả 2 đúc ĐỘC LẬP** (bẫy dễ mắc nếu
code chỉ nhìn "bản cuối trong đoạn gãy") · phục hồi điểm bất kỳ (không chỉ mới nhất) · **diff giữa
chuỗi mất → lùi đúng về mốc ngay trước đó, không throw** (đúng kịch bản Hoà yêu cầu thử) · mốc đầy
đủ hỏng → lùi tiếp về mốc đầy đủ trước nữa · format hiển thị 8 mốc thời gian.

**`lib/cad/auto-backup.ts`** viết lại — lớp keo mỏng chạm File System Access API thật: quyết định
ghi đầy đủ hay chênh lệch (đếm số bản kể từ mốc đầy đủ gần nhất), gọi `planRetention()` sau mỗi lần
ghi, đúc TRƯỚC rồi mới xoá. `namesToPrune()` (cơ chế cũ, "giữ 5 bản") đã xoá — thay hẳn bởi cơ chế
trên, không còn dùng.

## ② Lối vào UI mới — trước đây KHÔNG có

Trước B3, "phục hồi" chỉ có đường .ifpack export/import thủ công (tự tìm file trong Finder). Thêm:
- `components/cad/BackupRecoveryModal.tsx` — liệt kê backup qua `formatBackupRelativeTime()`,
  bấm 1 mục → `recoverBackup()` → phát `cad:backup-restore-request` → `CadSheets.tsx` tạo DỰ ÁN
  MỚI (không đè dự án đang mở, đúng nguyên tắc `onRestoreIfpack` cũ), báo rõ nếu phải lùi mốc
  (`degraded`/`recoveredAsOf`) thay vì im lặng.
- Menu "Xuất" → mục "Khôi phục từ backup…" chỉ hiện khi đã bật backup tự động.

**Verify browser thật** (`127.0.0.1:3000`, không mở panel riêng — dùng preview đang chạy sẵn):
1. Mở menu Xuất → xác nhận mô tả "Bật backup tự động" đã đổi (không còn "giữ 5 bản gần nhất").
2. Phát `cad:backup-browse-open` qua console → modal mở đúng, hiện "Chưa có bản backup nào" (đúng
   — chưa chọn thư mục), dải cảnh báo gãy-chuỗi hiện rõ. Ảnh chụp xác nhận layout đúng.
3. Phát `cad:backup-restore-request` với 1 sheet giả lập (`{id, name, doc:{entities:[1 line],
   layers:[1 layer]}}`) → **xác nhận điều hướng sang project MỚI** (`cuid` khác hẳn project đang
   mở), đọc `window.__cadStore.getState()` sau khi trang tải xong → **entity + layer khớp CHÍNH
   XÁC dữ liệu đã gửi** (`entityCount:1`, `id:'e1'`, toạ độ khớp, layer "Tường" đúng tên) — chứng
   minh đường ống phục hồi THẬT chạy trọn từ event → tạo project → ghi IndexedDB → điều hướng →
   nạp lại, không phải giả lập.
   ⚠️ Project test này (`cms7imxpt0009w9puvlzzgdzs`, tên "Test B3 (phục hồi backup)") **CÒN TRONG
   TÀI KHOẢN DEMO** — thử xoá qua API bị chặn đúng luật (hành động phá huỷ cần Hoà tự làm), **Hoà
   xoá tay giúp trong Gallery nếu không cần giữ lại**.

**Corrupt `.ifpack` (mô phỏng "giết đúng lúc đang ghi" cho MỐC ĐẦY ĐỦ)**: `lib/cad/ifpack.test.ts`
đã có sẵn `testCorruptZipDoesNotThrow` (không phải viết mới) — `restoreIfpack()` với bytes ZIP vỡ
cấu trúc → trả `null`, không throw. Chạy lại xác nhận PASS trong lượt sweep 100+ test toàn repo,
không hồi quy.

## ⚠️ Giới hạn thật — KHÔNG giấu

Không thể tự động hoá 2 việc trong kịch bản gốc của Hoà, vì lý do CÔNG CỤ (không phải bỏ sót):
1. **`showDirectoryPicker()` bắt buộc gesture người dùng thật + hộp thoại OS thật** (comment sẵn
   trong code trước khi tôi sửa: *"bắt buộc gesture người dùng, không tự động hoá được"*) — trình
   duyệt tự động hoá của tôi không đưa được hộp thoại chọn thư mục thật để tôi tự bấm chọn. Không
   thử được đường "ghi backup thật ra ổ đĩa thật" bằng browser tool.
2. **`kill -9`/tắt cứng tiến trình Electron thật** — tôi không có quyền chạy shell trên máy Hoà
   hay điều khiển tiến trình Electron đang chạy (nếu có) từ môi trường phiên này.

**Bù lại bằng cách nào**: toàn bộ RỦI RO THẬT của cơ chế (không phải "app có crash không" — code
đã bọc try/catch khắp nơi, không throw ra UI — mà là "có ĐÚNG dữ liệu không, có lặng lẽ mất gì
không") nằm ở LỚP THUẬT TOÁN reconstruct/retention, và lớp đó đã test bằng 50 kịch bản kể cả cố ý
mô phỏng "1 file giữa chuỗi hỏng/mất" — đúng chính kịch bản Hoà mô tả, chỉ khác là mô phỏng bằng
xoá key trong `Map` thay vì `kill -9` thật. Về mặt LOGIC ứng dụng, 2 việc tương đương: cả 2 đều
kết thúc bằng "file trên đĩa không đọc được/không tồn tại lúc phục hồi" — thứ duy nhất `kill -9`
thật thêm được là XÁC NHẬN file HĐH thật sự bị cắt cụt đúng kiểu 1 lần ghi dở dang tạo ra (không
phải file thiếu hoàn toàn), nhưng `testCorruptZipDoesNotThrow` đã phủ đúng trường hợp "bytes ZIP
vỡ cấu trúc" — sát nhất với "ghi dở dang" mà không cần kill tiến trình thật.

### Việc còn lại — Hoà tự làm 1 lần (3 bước, ~10 phút)

1. Mở app thật (Electron hoặc Chrome/Edge), vào CAD, menu Xuất → "Bật backup tự động" → chọn 1
   thư mục thật. Vẽ vài entity, đợi backup ghi (10 phút, hoặc gọi `window.__cadAutoBackup?.
   triggerNow?.()` nếu cần nhanh — kiểm tra tên hàm thật lúc đó vì đây chỉ là gợi ý, không phải
   API đã export sẵn ra window).
2. **`kill -9` tiến trình thật** (Activity Monitor/Task Manager) đúng lúc thấy file `.ifdiff.json`
   hoặc `.ifpack` mới xuất hiện trong thư mục (canh vài giây sau khi sửa bản vẽ).
3. Mở lại app → menu Xuất → "Khôi phục từ backup…" → chọn bản mới nhất → xác nhận nội dung đúng
   (hoặc, nếu file vừa ghi bị cắt cụt, app tự báo "không ráp trọn tới đúng điểm — dừng ở mốc X").

Ghi kết quả 3 bước này thẳng vào tài liệu này (thêm mục bên dưới) khi làm — đây là bằng chứng cần
cho phần trình BGĐ "mất dữ liệu: rủi ro thấp".

## Việc CHƯA làm, để đợt sau (ghi rõ theo Hoà chốt, không phải yêu cầu bây giờ)

④ Dự án ĐÓNG >6 tháng nén cả chuỗi backup vào 1 `.ifpack` lạnh — Hoà chỉ yêu cầu ①②③ xong TRƯỚC
khi thử sập, không yêu cầu ④ chặn kịch bản thử. Để đợt sau khi cần.
