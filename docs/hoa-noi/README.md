# `docs/hoa-noi/` — kho ý Hoà nạp, T đọc, chống trôi

> Cơ chế thay cho việc T tự chưng cất ý Hoà (đã sai vài lần). Hoà nạp, máy dedup + phân họ,
> T commit vào đây, phiên sau đọc trước tiên.

## Công cụ

**Artifact "Kho Hoà nói"**: https://claude.ai/code/artifact/c369a03d-6fd0-4eed-b2ba-c2aa13a49d80

Hoà gõ ý (Cmd+Enter để nạp) · thả ảnh · máy tự đề xuất họ từ 16 nhãn có sẵn (mau · gallery · chat ·
vitals · design-system · workflow · worktree · file-manager · thu-vien · canvas · chang · idf ·
duyet-mat · kien-truc · agent · bug) · cảnh báo trùng bằng Jaccard token ≥ 0.55 · xuất MD/JSON.

## Cách T đọc

1. **Đầu mỗi phiên**: đọc `SO-TONG.md` (nếu có) — bản MD Hoà xuất gần nhất
2. **Chống trôi**: khi Hoà nói ý mới trong chat, nhắc Hoà nạp vào kho (nếu quan trọng)
3. **Cập nhật**: Hoà bấm "Sao chép cho T" → gửi vào chat → T commit vào `SO-TONG.md`
4. **Kho ảnh + full**: `kho.json` (T commit khi Hoà xuất JSON, có ảnh base64)

## Luật giữ kho

- **Dedup ở artifact, không ở đây** — T chỉ commit thứ Hoà đã dedup
- **Không sửa nội dung ý** khi Hoà đã nạp — T sửa là làm rớt tín hiệu
- **Sắp theo họ, không theo thời gian** — họ nào nhiều ý nhất lên đầu
- **Ảnh base64 chỉ trong `kho.json`**, không đưa vào MD (kho MD phải đọc được không tải)
