# IF · SHARED MEMORY BRIDGE

`Plane: IF` · phân luồng: `docs/control/BOS-PHAN-LUONG-TRI-NHO.md`


> **Namespace:** IF · **Authority:** adapter từ repo sang `00 · IDF CONTROL CENTER` trên Google Drive.

## Source of truth

- Repo IF giữ canonical/current-state/decision/tooling/failure knowledge của InteriorFlow.
- Drive giữ bản đọc chung trên điện thoại, raw memory events và inbox của Hoà.
- Bản `01-CURRENT-STATE/IF/**` trên Drive là **mirror**, không sửa tay.
- Ý kiến Drive chỉ có hiệu lực vận hành sau khi được xác minh và quay về đúng file repo/ADR.

## Xuất bản

Chạy:

```bash
node scripts/publish-idf-control-center.mjs
```

Máy xuất các nguồn IF cần đọc trên điện thoại, UI Review Board và `SYNC-RECEIPT.json`. Việc xuất dùng
ghi nguyên tử: tạo file tạm rồi đổi tên, tránh để Drive thấy nửa file.

## Luồng ngược

1. Hoà thêm ảnh/note vào `06-REVIEW/HOA-INBOX/` hoặc dùng Mobile Advisory tạo memory event.
2. Codex đọc event theo đúng topic, phân biệt nguyên văn với suy luận.
3. Nếu là quyết định: tạo/cập nhật ADR và canonical/current-state thích hợp.
4. Tạo event xác nhận `VERIFIED`/`DECIDED`; không sửa event gốc.
5. Xuất bản lại để điện thoại thấy version mới.

## Chống context bleed

- IF repo chỉ nạp tài liệu `IF-*` và bridge này.
- `IDF-*`/`AN-*` nằm ngoài repo IF; chỉ tra khi task thật sự liên-app.
- Một event luôn phải có namespace và topic. File thiếu hai trường này nằm ở inbox, chưa được nạp.
