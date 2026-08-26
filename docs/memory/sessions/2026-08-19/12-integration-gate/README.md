# 12 · INTEGRATION GATE — ghép bản đồ thi công cuối (19/08 khuya)

## Việc gì, kết quả gì

Vai INTEGRATION COORDINATOR (prompt gốc cùng thư mục). Ghép ADR + Blueprint + MAP + UX lane +
audit orphan + lane 4 model thành bộ 3 tài liệu + 1 artifact duyệt mắt. **0 dòng production code
sửa, 0 commit.** Trước khi ghép, **re-verify độc lập cả 11 high-value reconnect tại HEAD `c7f3ac8`
+ working tree 88 dirty** — không chép audit.

## Sản phẩm

1. **`docs/IF-CAPABILITY-EXPOSURE-MATRIX.md`** — ma trận capability 9 lane, đủ 16 cột
   (engine/contract/caller/surface/action/output/truth/persistence/status/gap/action/dep/evidence),
   status 6 màu LIVE/PARTIAL/DISCONNECTED/ORPHAN/BLOCKED/TRUE-MISSING.
2. **`docs/IF-INTEGRATED-EXECUTION-MAP.md`** — 9 user flow trace trọn 13 mắt xích (GAP đánh tại
   đúng mắt) + Đợt 0 "cắm điện" R1-R11 kèm cỡ/phụ-thuộc/blast-radius/rollback + sơ đồ dependency
   + ranh giới lane + guardian contract.
3. **`docs/IF-INTEGRATION-GATE-2026-08-19.md`** — STOP GATE 7 điều kiện (**6/7 ĐẠT**, còn G7 =
   mắt Hoà) + 8 nút chờ Hoà (H1-H8) + cam kết số gate-exit + đề xuất P-S `soi:mount`.
4. **Artifact UI**: https://claude.ai/code/artifact/e78137f0-3a4b-404c-ad9b-31d3e1fe72bf —
   3 vùng (cây surface 2 cụm nav · lưới 43 capability filter lane/status · panel chi tiết),
   dải 11 reconnect ghim đầu, màu semantic đúng 6 trạng thái, legend + counts thật.

## Phát hiện mới so audit (re-verify 19/08 khuya)

1. **Cả 11 reconnect CÒN NGUYÊN** — 0 cái được phiên khác vá.
2. **2 path đã đổi**: `LibraryDropBridge` → `components/cad/` · `ReviewPanel` → `components/review/`
   (audit ghi path cũ — matrix đã sửa; đúng ca STALE-ANCHOR mà đề xuất `soi:mount` bắt được).
3. **1 điểm SÁNG mới**: nút XUẤT `.idfc` gói đủ 3 mặt đã sống thật (`LibrarySheet.tsx:975`
   truyền specs) — nhưng đường DROP vẫn không truyền (2 việc khác nhau, đừng nhầm là đã vá R1).
4. thao-tac-glyph: ToolbarChip/Tooltip chỉ NHẮC trong comment — grep -l đánh lừa, phải mở dòng.

## Số chốt

LIVE 28 · DISCONNECTED 6 · ORPHAN 7 · BLOCKED/WAIT-HOÀ 8 · TRUE-MISSING 6 (đều có negative
evidence — 0 đề xuất NEW sai luật; NEW duy nhất = `soi:mount` P-S có negative evidence 4 máy soi mù).

## CHƯA CHẮC

- Toàn bộ đo TĨNH — 0 phút browser (server 3001 bệnh; artifact thay thế cho duyệt kiến trúc,
  không thay browser verify khi phiếu R đóng).
- 2-3 phiên Claude khác đang mở cùng repo — 88 dirty biến động.
- `soi:mount` ước 150 dòng chưa đọc trọn walk của soi-that.mjs.
- Cột `matId` DB: tin đo pragma của lane 4, chưa tự tay chạy lại.

## HẠN DÙNG

Mọi số gắn HEAD `c7f3ac8` + working tree 19/08 khuya. Hết hạn khi: Hoà commit/dọn · bất kỳ R nào
thi công · runbook DB chạy. Phiếu mới PHẢI grep lại — không trích 3 file này làm sự thật vĩnh viễn.
