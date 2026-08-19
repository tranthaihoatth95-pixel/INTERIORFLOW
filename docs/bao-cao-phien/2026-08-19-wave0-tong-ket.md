# BÁO CÁO TỔNG WAVE 0 — DATA SAFETY · 19/08 · xong-máy, DỪNG chờ Hoà

> Report tổng của 4 phiên phụ + T verify. Chi tiết nhánh: `docs/memory/sessions/2026-08-19/08-wave0-data-safety/`.
> Runbook DB Hoà chạy tay: `2026-08-19-wave0-runbook-db.md` (cùng thư mục).

## 1 · Tổng quan
Wave 0 xong-máy toàn bộ 5 mảnh. T verify độc lập: tsc 0 · **309 test targeted pass** (compute 160 ·
overrides 29 · pbr-migration 27 · studio-persist 18 · idfc-store 21 · resolve 22 · matid-identity 32)
· soi:frontier 0 lệch (ĐỢT 12: +3 xong-máy +2 chờ) · git diff khớp phạm vi. Phát hiện đắt nhất:
**drift DB thật chỉ 1 cột `matId`** — sổ khai 4 nhóm pending nhưng 3 nhóm đã migrate 06-08/08.

## 2 · Chi tiết
| Mảnh | Kết quả | Bằng chứng |
|---|---|---|
| VIỆC 0 chống trôi | Bản đồ chính tắc `INTERIORFLOW-ARCHITECTURE-MAP.md`: 24 direction đủ tag (3 nâng [CHỐT] có căn cứ: #1 #20 #21); IF-KIEN-TRUC đóng dấu chuyển hướng; con trỏ CLAUDE.md + LATEST sửa cùng lượt | soi:tu-dien exit 0 |
| W0.1 runbook DB | 6 bước backup→push→generate→flip-cờ→backfill→verify + rollback từng bước. ExternalRef bảng ĐÃ có (migration 20260808000002, 0 bản ghi) — chỉ còn flip cờ code + test guard | PRAGMA đo thật từng bảng |
| W0.2 matId namespace | `BoqRow.specId` REQUIRED (compile-enforced) + `matId` alias @deprecated theo tiền lệ m2/qty; override IDB migration-on-read (giá trị khoá không đổi — zero-risk, idempotent, bản cũ giữ); PBR `ensurePbrCanonicalKeys` cắm `MaterialsScreen.load()`, chỉ ghi khi migrated>0 | 5 chỗ `matId: specId` compute.ts:343+ đã phủ |
| W0.3 studio assets | Inventory **212 usage** localStorage phân loại đủ; 4 kho canonical (idfc · màu · brand-kit · refManifest) rời sang IDB qua `lib/storage/studio-persist.ts` (REUSE khuôn sheets-persist/boq-overrides-persist, API giữ chữ ký, bridge giữ bản localStorage); export JSON có tên. PBR hoãn (vùng W0.2) — nay làm được | grep 0 đường ghi canonical mới vào localStorage |
| W0.4 docs stale | 4 đính chính đóng dấu tại chỗ: ADR-Q9 DistillEngine 2 caller · bản đồ 19-store · Lark=adapter đè câu cũ CLAUDE.md · cấm prisma generate sandbox | khối ⚠️ trong từng file |
| W0.5 | Contract `soi-ranh-gioi` vào registry (phương án B — ghi trước, build sau) kèm baseline chống-tệ-thêm | registry ĐỢT 12 |

## 3 · Tổng kết
Ba quả bom FINAL-AUDIT tháo ở tầng code (matId hết ba-nghĩa ở BOQ · tài sản studio hết
chết-theo-browser-profile · đường DB của Hoà rẻ hơn sổ khai nhiều). Việc còn trên tay Hoà: runbook.

## 4 · Đánh giá khách quan — cái chưa trọn
- **Browser verify = PARTIAL** (acceptance #11): server 3001 của phiên khác bệnh `.next` (T không
  restart server người khác) · auth wall (T bị cấm nhập mật khẩu) · profile pane hỏng bởi chính
  probe của T (tạo vỏ IDB v1 rỗng), `deleteDatabase` bị permission chặn — T dừng, không lách.
  **6 ca kiểm tay chờ Hoà**: ①nhập .idfc → reload → còn ②xoá localStorage key cũ → dữ liệu còn (IDB)
  ③máy có localStorage cũ → mở app → tự di trú, localStorage nguyên ④Brand Kit tạo/sửa/active qua
  reload ⑤bảng màu studio import/xoá qua reload ⑥trang ingest giữ manifest.
- Phát hiện phụ: vỏ-DB-rỗng cùng version làm sheets-persist **câm lặng lẽ** (fail-soft, không crash,
  không mất data — nhưng không persist). Điểm giòn có sẵn, không do W0.3.
- Rollback chứng minh bằng test + thiết kế (chưa diễn tập máy thật).

## 5-6 · Hướng + đề xuất (đã trình, giữ nguyên)
H1 (chọn): Hoà chạy runbook ngay → phiếu nhỏ flip cờ ExternalRef → mới bàn Wave 1. H2: duyệt mắt
6 ca IDB trước runbook — an toàn hơn một nấc, chậm một nhịp; 6 ca không phụ thuộc DB nên lúc nào
cũng duyệt được.

## CHƯA CHẮC
IDB thật chưa round-trip trên browser (test IO in-memory) · MaterialsScreen wiring verify bằng tsc +
suy luận effect-order · `npm test` full chưa chạy (cây chung nhiều phiên) · dirty-wins 2-tab ngang
rủi ro localStorage cũ.

## HẠN DÙNG
Đúng tại working tree 19/08 sau `3da4b8c`, chưa commit. Vô hiệu từng phần khi Hoà chạy runbook hoặc
Wave 1 thi công.
