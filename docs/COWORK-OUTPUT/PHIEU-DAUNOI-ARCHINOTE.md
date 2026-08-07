# PHIẾU · ĐẤU NỐI ARCHINOTE (M6) — ĐỌC MAP TRƯỚC, rồi cầu `.idf`
### Dán TRỌN vào MỘT phiên. IF (MÁY PHÁT) ↔ ArchiNote (MÁY THU) qua `.idf`.

## TỚI ĐÂU RỒI (đọc repo 06/08)
- Trong repo IF: mới có **mock** `docs/mocks/_archinote/` (Dự án · Cài đặt · Ảnh đại diện · bảng theo dõi) + **`docs/ARCHINOTE-MAP.md` (08-06)** — khảo sát M6 hình như đã ghi.
- Repo ArchiNote **thật** nằm riêng: `~/Downloads/ttt-tasks`.
- Cầu `.idf` phía IF đã có: `lib/root-folder.ts` · `lib/disk-sync.ts` · `lib/present-editor/model.ts` · `lib/ffe/item.ts`.

## LUẬT CHUNG
- **V6**: KHÔNG commit. Hoà commit.
- Phóng **1 agent làm/khảo sát + 1 agent phản biện**.
- **N7 / §0t**: `grep -a` trước khi sửa.
- Ghi `docs/M-ARCHINOTE-OUT.md`. **KHÔNG sửa `GAP-IF.md`** (§0u).
- 🔴 **TRUNG TÍNH**: cầu nối = tính năng (repo). **DATA khách** (ghi chú/ảnh công trường thật) → `.idf`/dự án, **KHÔNG vào repo**.

## VIỆC
**BƯỚC 0 — đọc trước, đừng khảo sát lại:**
- Đọc `docs/ARCHINOTE-MAP.md` (đã có). Nếu đủ (hệ con · nối/mồ côi/thiếu · `.idf` chung format chưa) → **bỏ qua khảo sát, sang đấu nối**. Nếu thiếu mục nào → bổ sung đúng mục đó thôi.

**Đấu nối `.idf` IF ↔ ArchiNote:**
1. `grep -a` schema `.idf` hai bên: IF ghi/đọc field gì (`lib/present-editor/model.ts`, `disk-sync.ts`) vs ArchiNote (`~/Downloads/ttt-tasks`) ghi field gì. Lập bảng **khớp / lệch / thiếu**.
2. Chốt **một schema `.idf` chung** (K1: một Doc, ArchiNote chỉ là một ống nạp — KHÔNG đẻ format thứ hai).
3. Đường **ArchiNote → IF**: ảnh + ghi chú công trường vào đúng node/dự án của IF qua `.idf` (ĐỌC-only trước, chưa ghi ngược).
4. Nếu ArchiNote chưa đọc/ghi `.idf` → ghi rõ trong M-OUT phần **ArchiNote cần sửa gì** (không tự sửa repo kia trong vòng này).

## NGHIỆM THU (N6)
- Bảng schema `.idf` khớp/lệch/thiếu có thật (đọc 2 repo).
- 1 ca thử: 1 `.idf` từ ArchiNote nạp được vào IF đúng node/dự án (hoặc ghi rõ vì sao chưa).
- `docs/M-ARCHINOTE-OUT.md`. KHÔNG commit.
