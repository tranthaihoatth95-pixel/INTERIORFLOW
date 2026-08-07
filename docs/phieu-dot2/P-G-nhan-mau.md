# PHIẾU G · NHÃN & MÀU — trả nợ P0

Vùng sở hữu: `components/studio/` · `components/entry/` · `lib/stages/` · `app/globals.css`.
**KHÔNG** đụng `lib/cad/`, `lib/three/`, `lib/boq/`.
Luật: V6 KHÔNG commit · §0u ghi `docs/M-NHAN-OUT.md` · G2 (panel nền đặc ≥92%, chữ ≥4,5:1) · G4 (line-height ≥1,5 — cắt dấu tiếng Việt) · G6 (nút quyết định có CHỮ) · N8.

## CHỐT NGÔN NGỮ (Hoà chốt 07/08, `docs/00-CHOT.md`)
| id trong code (GIỮ NGUYÊN) | nhãn VI | nhãn EN |
|---|---|---|
| `concept` | Thiết kế 2D | 2D Design |
| `render`  | Thiết kế 3D | 3D Design |
| `present` | Trình chiếu | Presenting |

**Bỏ chữ "CAD" khỏi mọi NHÃN người dùng thấy** (14 chỗ, `G-M15-06`). **KHÔNG** đổi tên code: `lib/cad/`, `useCadStore`, route `/projects/[id]/cad` giữ nguyên.

## VIỆC
1. **G-M15-01** (`GAP-IF.md:106`) — nút chặng mờ như bị khoá. Đã sửa `StageSwitcher.tsx:272`; **kiểm lại còn chỗ nào khác** dùng `--t3` cho nút bật.
2. **G-M15-02** (dòng 107) — **gộp tên chặng với mode**. Ảnh 07/08 vẫn hiện `Thiết kế 2D · Sơ phác` trên một nút. Tên chặng và mode là HAI thứ, không dán vào nhau.
3. **G-M15-03** (dòng 108) — **hai bộ "3 chặng" cùng tên khác nghĩa**. Tìm cả hai, chốt một, xoá/đổi tên bộ kia. Ghi rõ bộ nào thắng và vì sao.
4. **G-M15-05** (dòng 110) — comment sai trong code, sửa theo chốt trên.
5. **G-M15-06** (dòng 111) — 14 chỗ chữ "CAD" trên nhãn.
6. **G-M22-03** (dòng 143) — nút **Home** đang đứng riêng (`components/studio/AppChrome.tsx:254 {logoMenu && <HomeButton compact />}`). Hoà chốt: đưa vào menu logo (`AppLogoMenu.tsx:7`, hiện 5 mục), đặt **phía trên** mục "Về Thư viện dự án". `HomeButton.tsx:13` tự khai trùng vai với mục đó ⇒ gộp là đúng, bớt một chỗ bấm mơ hồ.

## VERIFY BẮT BUỘC
Mở trình duyệt thật, chụp **cả hai theme** (sáng/tối) + **cả hai ngôn ngữ** (VI/EN). Đọc DOM xác nhận 0 chuỗi khoá kỹ thuật lọt ra UI. Không kết luận từ ảnh chụp một trạng thái.

## CẤM
- Không đổi tên code, chỉ đổi nhãn.
- Không tự chạy dev server mới (§0aa).

## HÀNG ĐỢI (§V7) — bắt buộc cuối lượt
