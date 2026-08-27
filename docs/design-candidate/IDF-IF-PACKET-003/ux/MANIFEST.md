# MANIFEST — Runtime UI Gap Map

> Sinh 2026-08-27 · HEAD `3b14972`.
> **Đây là tài liệu READ-ONLY của lane audit.** Mock/canvas cũ là `CANDIDATE / NOT FINAL TARGET`,
> **cấm lấy làm chuẩn để viết mã.**

## 🔒 LUẬT ẢNH RUNTIME — Hoà chốt 27/08, bốn điều

1. **Git giữ**: manifest · hash · route/state · đường dẫn mirror. **Không giữ ảnh.**
2. **Drive riêng có quyền giữ ảnh gốc** — 23/23 hash khớp với bảng dưới (đối chiếu chéo
   `SYNC-RECEIPT.json` ↔ manifest này).
3. **Cần review rộng hơn ⇒ dựng bản ĐÃ CHE tên khách/dự án riêng.** Tuyệt đối không đưa ảnh gốc
   ra ngoài vòng người có quyền.
4. ⛔ **Không dùng ảnh runtime thật làm asset hay mẫu mặc định của IF.** Đây là LUẬT NỀN TẢNG áp
   vào hiện vật: sản phẩm bán ra toàn cầu không mang dữ liệu của một studio cụ thể.

Vì sao ảnh không vào git, ghi lại để phiên sau không mở lại cuộc tranh luận: `.gitignore:85-90`
chặn `docs/**` ảnh dưới nhãn *"luật trung tính + repo nhẹ (chốt 01/08)"*. Lý do thứ hai là lý do
chặn — ảnh này chụp app với **dữ liệu dự án thật, mang tên khách hàng**.

| tệp | byte | sha256 |
|---|---|---|
| `01-RUNTIME-UI-GAP-MAP.md` | 59073 | `6ddf387a42779534` |
| `anh/01-login-1440x900.png` | 433165 | `6edad3614e025618` |
| `anh/02-home-1440x900.png` | 433091 | `12423546d09e5424` |
| `anh/03-intro-1440x900.png` | 41462 | `c694194f7ae7b174` |
| `anh/04-projects-1440x900.png` | 103814 | `1253ef94af044163` |
| `anh/05-library-1440x900.png` | 5851 | `99db2a93b06fa1bf` |
| `anh/06-gallery-1440x900.png` | 92061 | `d1fdac743e9d96e4` |
| `anh/07-ingest-1440x900.png` | 83776 | `ab28ca824a8f3d33` |
| `anh/08-files-1440x900.png` | 104135 | `a68495e209ae832a` |
| `anh/09-settings-1440x900.png` | 144912 | `64c78edf6817e064` |
| `anh/10-settings-about-1440x900.png` | 16487 | `e0a1499cb8685989` |
| `anh/11-materials-1440x900.png` | 61644 | `f8f6312ce7eff50d` |
| `anh/12-colors-1440x900.png` | 5851 | `99db2a93b06fa1bf` |
| `anh/13-tasks-1440x900.png` | 66553 | `8e16c78c418e71c7` |
| `anh/14-workhub-1440x900.png` | 197232 | `c56ad99a09ca85a6` |
| `anh/15-cad-editor-1440x900.png` | 433373 | `65487e94bf908480` |
| `anh/16-present-editor-1440x900.png` | 432965 | `c69eab202fd86bf2` |
| `anh/17-photo-editor-1440x900.png` | 433102 | `c0a7f97abe6d0c21` |
| `anh/18-share-token-sai-1440x900.png` | 9677 | `fd24364ae3ba36b3` |
| `anh/19-home-1100x800.png` | 348063 | `457855b296dac42e` |
| `anh/20-projects-1100x800.png` | 86742 | `816ae2b133ba492e` |
| `anh/21-home-393x852.png` | 203014 | `0020381079272ca2` |
| `anh/22-projects-393x852.png` | 62340 | `2273f5afc0833dbf` |
| `anh/23-login-393x852.png` | 203558 | `345497d8417a4fb5` |
