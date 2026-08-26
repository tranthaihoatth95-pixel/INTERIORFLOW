# P0B · CONTENT-INTEGRITY PILOT — REPORT ONLY
**26/08/2026** · task `IDF-BUILDER-OS-CLAUDE-BOOTSTRAP-001` · writer `interiorflow-65`

> ⛔ **REPORT-ONLY.** Không move · không delete · không rename · không sửa artefact ·
> không suy authority từ tên tệp hay mtime. Manifest: `pilot-manifest-2026-08-26.json`.

## Phạm vi — 13 artefact, 22,9 MB
`artifacts/pdf` 3 PDF · `docs/audit-2026-08-18` 9 PDF · `docs/IF-nguon-tham-chieu-tham-my.zip`
Mặc định toàn bộ: **`UNVERIFIED` + `QUARANTINE`**. Không cái nào là CURRENT/CANONICAL/global asset.

## Cổng soi

| Cổng | Kết quả | Nghĩa |
|---|---|---|
| G1 dual CURRENT | **0** | không có hai artefact cùng tự xưng CURRENT |
| G2 CURRENT+REJECTED | **0** | |
| G3 thiếu trường bắt buộc | **13/13** | không artefact nào khai `authority_owner` · `source` · `license` |
| G4 con trỏ mục | **0** | |
| G5 source/output mismatch | **13/13** | không cái nào có `source_sha256` ⇒ **không chứng minh được nó sinh ra từ đâu** |
| G6 nhiễm dữ liệu khách | **CHƯA QUÉT** | cần đọc nội dung PDF — ngoài phạm vi report-only lượt này |
| G7 quan hệ PDF↔HTML | **12/12 PDF** | chưa cái nào chứng minh được bản HTML nguồn |
| G8 supersede ↛ con trỏ | **0** | |
| G9 **KHÔNG được git theo dõi** | 🔴 **12/13** | |

## 🔴 Phát hiện chính — G9, và nó không phải chuyện giấy tờ

**12 trên 13 artefact không nằm trong git.** 22,9 MB bằng chứng audit và đầu ra PDF sống **chỉ trên
một ổ đĩa**, trong thư mục `~/Downloads` — thư mục mà macOS có tuỳ chọn **tự xoá mục cũ**, và là
thư mục người ta dọn định kỳ nhất.

⭐ Đây là **cùng một họ bệnh** với thứ P0A vừa vá: spec UX/UI chỉ sống trong một link chat.
Khác vật liệu, cùng cơ chế — **tài sản quan trọng nằm ngoài thứ duy nhất có bản sao.**

⚠️ **Không tự ý `git add`.** 22,9 MB nhị phân vào lịch sử git là quyết định không đảo được, và
G6 (nhiễm dữ liệu khách) **chưa quét** — 9 PDF trong `docs/audit-2026-08-18` có thể chứa hồ sơ
khách thật. Đưa vào git rồi push là **không gỡ ra được**.

## Ba việc kế, theo thứ tự — chưa làm cái nào

1. **Quét G6 trước mọi thứ khác.** Rút chữ từ 12 PDF, tìm tên khách/dự án thật/PII. Chưa biết
   sạch thì **không** đưa vào git, **không** mirror Drive.
2. **Phân loại theo kết quả G6:** sạch ⇒ ứng viên `git-lfs` hoặc kho bằng chứng riêng ·
   có dữ liệu khách ⇒ **giữ ngoài repo**, chỉ ghi manifest + hash làm con trỏ.
3. **Trước khi dời thư mục:** 12 tệp này là thứ **mất trắng** nếu Downloads bị dọn. Sao lưu ra
   ngoài trước khi đụng vào cây.

## Nợ chưa trả — khai thẳng
`authority_owner` · `source` · `license` · `consumers` của cả 13 artefact đều **UNKNOWN**. Manifest
ghi `UNKNOWN`, **không đoán** — suy authority từ tên tệp hay mtime là đúng thứ chỉ thị cấm.
