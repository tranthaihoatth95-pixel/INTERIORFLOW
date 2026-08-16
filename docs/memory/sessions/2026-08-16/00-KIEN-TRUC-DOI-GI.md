# 2026-08-16 · Kiến trúc đổi gì — bằng chứng

> Cốt lõi đã viết lại ở `docs/IF-KIEN-TRUC.md`. File này giữ **lý do + số đo**, để cốt lõi không phình.

## Vì sao lập bản mới
`IF-ARCHITECTURE-COMPASS.md` (12KB) sửa lần cuối **29/07**, **19 ngày không phiên nào đọc**:
`docs/CLAUDE.md:14` trỏ vào `IF-MASTER-BLUEPRINT.md` — tệp này đã thành **mẩu chuyển hướng 774 byte**
từ 28/07. `COMPASS` được nhắc **0 lần** trong `CLAUDE.md` · `STATUS.md` · `00-CHOT.md` · `memory/LATEST.md`.
⇒ Bản đồ **không mất, nó MỒ CÔI**. Con trỏ chết làm tệp sống đọc ra như đã chết.

## Giá phải trả, đo được trong MỘT ngày
| Ca | Thiệt hại |
|---|---|
| `master tool` ↔ `ToolWindow` là một thứ mà tưởng hai | **6 phiếu** đi sai hướng; entry `master-tool-cong-dan-canvas` mở 15/08 tới 16/08 không thi công dòng nào |
| Vật liệu chẻ ba | đo 07/08 `lib/materials`↔`ProductSpec` = **0 code nối**; đo lại 16/08 **vẫn 0** — 9 ngày không nhúc nhích |
| Thư viện xếp sai chỗ | T mượn luật ngành *"thư viện không lên sidebar"* cho một thứ **khác bản chất** (của họ là kho-để-tìm, của IF là thứ-mang-đồ-tới); chốt 10/08 đã ghi đúng mà T không thấy |
| `KB-5` | lan **14 chỗ**, chưa bao giờ được định nghĩa (tài liệu gốc chỉ có KB-1..4) |
| `.idfnotes` | **0 code**, 2 dòng trong sổ |
| `[Đ1]` ↔ `[Đ2]` | trích sai diện rộng: 9 phiếu + 4 tệp code + 4 chỗ `00-CHOT` + 2 entry registry |

**Không ca nào thiếu dữ kiện. Ca nào cũng thiếu QUAN HỆ.**

## Số đo dùng cho cốt lõi
- Đuôi tệp: `.idf` 192 code · `.idfp` 50 · `.idfc` 62 · `.ifpack` 41 · `.idfnotes` **0**
- `"master tool"`: code **0** / sổ **26** · `ToolWindow`: code **13** / sổ 0
- `lib/materials` nối `ProductSpec` = **0** · `MaterialPbr` có trường giá/NCC = **0**
- `cadMode === 'sketch'`: 13 nhánh sản phẩm — 8 pen/touch · 4 bố cục · 1 mặc định
- Trục năng lực sketch↔pro **không** viết bằng `cadMode` mà bằng `isPro` (25 lần/1 tệp) + `PRO_ONLY_TOOLS` (35)
- "3 chặng như 3 app": khớp ổ **3/7** · lệnh chung sống **19/30** · một-việc-cùng-chỗ **1/5** · chia sẻ code **5,7%**
- Ngưỡng nấc-hình: **141px** quá nhỏ để phân biệt vân sồi ↔ óc chó (đo 07/08)

## Chốt của Hoà trong ngày, nguồn của từng mục cốt lõi
§2 bốn bề mặt · §3 sidebar hai cụm + chat dưới task manager · §5 Files là phần thô, bỏ nghĩa "chợ đầu mối",
Thư viện hiểu ngữ cảnh · §6 *"đồng bộ mới xuất hiện đó"* · §7 *"bỏ tư duy kéo dãn, size to bổ sung chi tiết
cho size nhỏ"* + *"size to nhất là cột dọc ô tròn vật liệu"* · §9 *"file manager là nơi ai cũng thấy"* ·
§10 *"phải có bảng quy ước từ ngữ hoặc cơ chế ngôn ngữ"* · §11 *"lỗi hiểu sai từ nữa đó"*.
Nguyên văn đầy đủ: `docs/00-CHOT.md` mục ngày 16/08.

## Còn nợ, sinh ra từ chính ngày này
1. **Máy đối chiếu SỔ ↔ CODE** — thứ duy nhất bắt được cả ba con ma. Quét riêng từng bên thì mỗi bên đều nhất quán.
2. **Nối vật liệu ba mảnh** — món đáng làm nhất của sản phẩm, đứng yên 9 ngày.
3. **Một xương sống lưu chung** cho 4 đuôi (nay chỉ `.idfc` có đường nâng cấp thật).
4. **4 kịch bản sidebar phải dựng lại** — chúng dựng trên danh sách stage cũ.
5. `.idfnotes` — dựng hoặc khai tử.
