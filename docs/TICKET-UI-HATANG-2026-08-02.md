# TICKET ƯU TIÊN — GIAO DIỆN HẠ TẦNG (làm TRƯỚC tính năng lẻ)

> Hoà chốt 02/08: "phần giao diện hạ tầng nên làm trước". Đọc `SPEC-MODE-PER-STAGE.md` là hợp đồng.
> Chèn LÊN ĐẦU hàng đợi code chính, TRƯỚC các việc render/tính năng lẻ khác. Sau D2 push-pull.

## Thứ tự thi công (mỗi bước 1 commit + test, verify browser)

**H1 · Bộ khung MODE-SHELL dùng chung.** Một cơ chế `useStageMode()` + `<ModeShell>` cho cả 3
chặng: bật/tắt mode → đổi CẢ layout (không phải toggle panel con). Skeleton trước, chưa cần đủ
nội dung từng mode. Verify: chuyển mode thấy shell đổi.

**H2 · Sidebar Render 3 vùng node.** Dựng side trái 3 vùng (Mood+Collab / Master / Thường) theo
§2. Phân loại 30 node của `CATALOG-STAGE2-RENDERING.md` vào đúng vùng — **rà kỹ từng node**, không
xếp bừa (Hoà nhấn "phân loại kỹ"). Bảng phân loại sơ bộ có trong CHOT-RENDER-TOOL-WINDOW.

**H3 · Tool = node → xổ window.** Nhấn/kéo node MASTER từ side trái → xổ tool window (play·X·cổng·
vỏ kính·ruột sắc nét). Đóng bug 2.2.92 (portal hoá overlay). Bỏ HẲN thanh tab ngang phía trên.

**H4 · Present chọn loại hồ sơ.** Cửa vào Present = chọn 1 trong 5 loại (§4) từ Thư viện Template →
mở editor tương ứng (skeleton editor cho Bảng tính + Word, chưa cần đủ tính năng — chỉ đúng KHUNG).

## Ràng buộc
- KHÔNG đập engine hiện có — bọc thêm lớp shell, tái dùng canvas/node/editor đang chạy.
- Additive: `.idf`/`.idfp` cũ mở bình thường.
- Verify từng bước trên browser thật. Test tốn credit: 1 ảnh/lần.
- Tránh vùng E của code phụ.

*Cowork ghi 02/08/2026. Ưu tiên cao — hạ tầng khung, mọi tính năng sau gắn vào đây.*
