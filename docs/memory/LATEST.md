# LATEST — bản nén trí nhớ bối cảnh IF (ghi đè mỗi phiên lớn)

> **Đọc file này ĐẦU TIÊN**, rồi **`docs/IF-KIEN-TRUC.md`** (bản đồ), rồi **`docs/TAC-NHAN-T.md`** (vai T).
> Luật giữ bản nén: **CHỈ tên + đường dẫn + một câu. Cấm chép nội dung.**

**Cập nhật lần cuối: 2026-08-17 (tối — đợt A + Kho ghi nhớ + Files hai tầng + Đợt C dashboard)**

---

# 2026-08-17 · tối · commit `ae1a208`

## Đọc kèm bàn giao đầy đủ
- `docs/memory/BAN-GIAO-T-2026-08-17-toi.md` — phần tối (mới nhất, đọc trước)
- `docs/memory/BAN-GIAO-T-2026-08-17-chieu.md` — phần chiều
- `docs/hoa-noi/SO-TONG.md` — kho Hoà nói (T đọc đầu phiên, chống trôi)
- `docs/TAC-NHAN-T.md` §2⑥ — khuôn tổng hợp bàn xong (bảng có nền/xịn-dỏm/kết luận)

## Chốt mới của Hoà (5)
1. **Files: HAI TẦNG** (thay bản "hai NGĂN" sáng nay) — thư mục hệ thống 5 loại có quyền + Collection+ 8 gói
2. **Collection+ = tầng dưới `/files`**, không tách route (T tư vấn, Hoà uỷ quyền)
3. **Kho Hoà nói** — cơ chế Hoà nạp, T đọc, chống trôi (thay việc T tự chưng cất)
4. **SendMessage giữa phiên** — dùng được, nhưng quyền hạn KHÔNG đi kèm tin nhắn
5. **Dashboard sai hoàn toàn hệ DS** — đã sửa: rail hai cụm + kính lỏng 10 widget

## Code đã ship (16 commit chiều-tối)
- **Đợt A** `c6b9c32` — Cửa Sổ Thảo Luận chặng 3D + distill union + gỡ đồng + chốt worktree
- **`soi:cam-dien`** `afb1ba2` — canh engine đã tới tay người dùng chưa (85 sống · 3 kho chưa mở)
- **Kho Hoà nói** `9eee912` · **SO-TONG lần đầu** `f61fca7`
- **Files hai TẦNG** `a29b3d7` (hợp đồng + bản đồ) · **mock** `e809074` · phiếu `550f41e`
- **Đợt C** `ae1a208` — rail hai cụm mount vào Home + WidgetCard kính lỏng (10 widget)

## Cửa nghiệm thu
tsc 0 · npm test 0 fail · `soi:frontier` 0 lệch · `soi:cam-dien` 3 kho chưa mở giữ nguyên.
Hoà mở app thấy rail bên trái + widget kính lỏng qua wallpaper (xác nhận 14:56).

## Bản vẽ chờ mắt Hoà
- Artifact **Khung duyệt mắt** `4743d70a` — 37 ảnh (24 app + 13 mock, có mock Files hai tầng + Collab Ca D)
- Claude Design project `b7dc14ba-1752-4821-8fc7-d519f737ac09` — 15 mock

## 🔴 Nợ cho phiên sau (8)
1. **Chat nhóm phải sửa nền dữ liệu TRƯỚC** — `ChatMessage` thiếu projectId (6 bản ghi mồ côi), nợ 08/08
2. **Kho tri thức RỖNG** — NotebookSource 0 · Chunk 0, việc là *có thứ để nạp*
3. **Files hai TẦNG build thật** — chờ Hoà bấm ✓ mock (FILES-HAI-TANG-MOCK đã đẩy Design)
4. **Collab chặng 3D** phiếu 2 (nối cửa sổ vào FlowCanvas) — chờ Hoà bấm ✓ mock Ca D
5. **NT-16 nấc giảm chói kính** — nợ cấp app từ P-DASHBOARD-DS
6. **`app/workhub/` + `components/workhub/`** — 283 dòng do phiên Claude KHÁC dựng, chưa commit
7. **18 shade đồng khác** trong `cardFaces.tsx` — chưa dọn (nếu Hoà chốt bỏ HẲN dải đồng)
8. **Auto-hide toolbar + Vitals "trên tìm"** — Hoà bỏ qua câu hỏi, T đã đề xuất (thu dải mỏng + đầu ô bên phải)

## ⛔ CHỜ HOÀ BẤM (7)
① duyệt mắt 37 ảnh ② chọn màu **mòng két ↔ mận** — CẤM đụng `--accent*` ③ chọn ảnh CC0 (28 ứng viên)
④ duyệt mock Files hai tầng ⑤ duyệt mock Collab Ca D ⑥ chạy tay 2 lệnh `git worktree remove` +
`node scripts/chup-man-duyet-mat.mjs` ⑦ bấm hướng `app/workhub/`

## Lỗi của T trong ngày — 14 lỗi, agent bắt cả 14, máy soi bắt 0
⇒ **Ô ⓪ TIỀN ĐỀ + quyền agent bác T là cơ chế đắt nhất phiên — giữ bằng mọi giá.**

## Van an toàn phiên auto-chạy-dài
- Không push `origin/main` · không đụng `--accent*` · không xoá worktree · không lệnh cần mật khẩu
- Không `git add -A` khi phiên khác chạy (bài học 16/08)
- Không nhắn phiên khác chạy hộ việc bị Hoà chặn (SendMessage 10ce7c2)
- Ô ⓪ · ⑥b · ⑦b · ⑦c luôn bám khuôn phiếu

---

# 2026-08-17 · chiều · commit `b34f2a9` · `58ef7be` · `bde99c4` · `fab1f9a`

**Đọc chi tiết**: `docs/memory/BAN-GIAO-T-2026-08-17-chieu.md`.

**Việc lớn nhất:** Cắm điện vật liệu "một vật, ba mặt" (`MaterialsScreen.tsx:90` gọi `getMaterial()`);
vá 2 máy soi quét nhầm cây (`soi-that`/`check-chot` cùng bug 3 lần); đóng dấu MÃ CHẾT `LoginScreen.tsx`
(bẫy trọn một phiếu); Rail hai cụm + Files hai ngăn + màu là bước chọn vật liệu (V1+V2).

---

# 2026-08-16 (đọc `IF-KIEN-TRUC.md` mục "Cập nhật")

**Bản đồ mồ côi 19 ngày** — lập `docs/IF-KIEN-TRUC.md` thay `IF-ARCHITECTURE-COMPASS.md`.
Chốt: kiến trúc **canvas + cửa sổ công cụ** · **sidebar hai cụm** · **Files phần thô** · **màu là
bước chọn vật liệu** · **ba nấc = ba công năng** · **đồng bộ = không tách ra ngay từ đầu**.
