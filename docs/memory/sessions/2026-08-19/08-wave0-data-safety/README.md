# 08 · Wave 0 — Data Safety xong-máy (19/08)

> Handoff nhánh. **Report tổng**: `docs/bao-cao-phien/2026-08-19-wave0-tong-ket.md`.
> **Runbook DB cho Hoà**: `docs/bao-cao-phien/2026-08-19-wave0-runbook-db.md`.

## 5 mảnh (4 phiên phụ song song, khoá phạm vi rời nhau — không ai đụng frontier-registry, T gộp)
| Mảnh | Kết quả | Nơi sống |
|---|---|---|
| VIỆC 0 | Bản đồ chính tắc `INTERIORFLOW-ARCHITECTURE-MAP.md` (24 direction có tag) + con trỏ sửa cùng lượt | docs/ + registry `ban-do-chinh-tac` |
| W0.1 | Runbook 6 bước + rollback; **drift DB thật = 1 cột matId** (3/4 nhóm pending đã migrate 06-08/08; ExternalRef chỉ còn flip cờ `EXTERNAL_REF_TABLE_READY` tại `lib/integrations/external-ref.ts:47` + test guard `external-ref.test.ts:111-116` đang khẳng định false) | bao-cao-phien runbook |
| W0.2 | BOQ `specId` required + `matId` alias @deprecated (khuôn m2/qty), migration-on-read IDB, PBR `ensurePbrCanonicalKeys` cắm `MaterialsScreen.load()` | lib/boq · pbr-store · registry `boq-specid-namespace` |
| W0.3 | 4 kho studio rời localStorage→IDB bridge (`lib/storage/studio-persist.ts` trên khuôn sheets-persist); inventory 212 usage | registry `studio-asset-idb` |
| W0.4+W0.5 | 4 đính chính stale đóng dấu tại chỗ · contract `soi-ranh-gioi` vào registry (chưa build) | ADR/CLAUDE/BAN-DO · registry |

## Trạng thái acceptance (15 mục — THỰC, machine ≠ mắt)
Đạt: tsc 0 · 309 test targeted pass · soi:frontier 0 lệch · rollback chứng minh bằng test+thiết kế ·
không commit/push/secret. **PARTIAL**: browser verify (server 3001 bệnh .next của phiên khác + auth
wall T bị cấm nhập mật khẩu + profile pane hỏng bởi probe của T, deleteDatabase bị permission chặn) —
**6 ca IDB chờ mắt Hoà** (danh sách trong report W0.3, nén ở report tổng). **CHỜ HOÀ**: db push chưa
chạy (mục 1-2 acceptance treo tay Hoà).

## Nợ bàn giao từ Wave 0
Flip cờ ExternalRef + sửa test guard (sau push) · PBR storage move (sau W0.2 đã xong → giờ làm được)
· gallery.v1/customTemplates/customRules/boq-custom-columns (canonical-lean, wave sau) · nút UI
Export/Import · mở scope soi:tu-dien sang docs/ gốc · registry `boq-specid-callsite-migrate` (~70
chỗ đọc .matId → .specId) · vỏ-DB-rỗng sheets-persist (điểm giòn, một dòng hàng đợi).
