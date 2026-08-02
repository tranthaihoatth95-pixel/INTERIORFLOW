# SPEC — KỆ THƯ VIỆN THEO CHẶNG (Stage Libraries)

> Hoà 02/08: *"soạn hết stage library, stage nào hiện gì, cơ chế ra sao — mổ xẻ làm rõ."* Nối `SPEC-IF-LIBRARY`
> (Master Library = cửa hàng) · `SPEC-FILE-MANAGER` · `SPEC-MODE-PER-STAGE` §3.

## Nguyên tắc gốc
**1 Master Library duy nhất (kho xuyên app)** — nhưng **KỆ tự lọc theo chặng đang mở** *(contextual shelf)*.
Vào chặng nào hiện món chặng đó; vẫn có tab **"Tất cả"** xem toàn kho.

**Cơ chế dùng — 3 động tác:** **kéo–thả** = instantiate (template → 1 bản làm việc, sửa không đụng gốc) ·
**áp** = preset lên vật đang chọn · **publish** = bản của mình → template mới (versioned).
Template gốc = **read-only master, một chiều** (đúng luật Brand Kit `_studio`). Phạm vi: **Chung · Riêng chặng · Riêng dự án**.

## Chặng 1 · CAD
| Kệ | Món | Cơ chế |
|---|---|---|
| Template bản vẽ | khung tên · tỉ lệ · layout A1/A3 · tiêu chuẩn nét TCVN | kéo → sheet mới |
| Thư viện ký hiệu | cửa · cửa sổ · TB vệ sinh · block nội thất · người/cây scale | kéo → đặt (giữ `matId`/`elementType`) |
| Template phòng | layout mẫu bếp/WC/PN | kéo → thả cụm |
| Hatch / vật liệu 2D | hatch · gạch · gỗ | áp lên vùng tô |
| Form lập luận | dây chuyền công năng · sơ đồ bong bóng | kéo lên canvas phân tích |

## Chặng 2 · Rendering
| Kệ | Món | Cơ chế |
|---|---|---|
| **Form lập luận (nhiều loại)** | Khung concept 5 nhánh · Ma trận so sánh phương án · 6 chiếc mũ · SWOT không gian · Bảng tiêu chí chọn vật liệu · Mood→Concept map | kéo lên canvas Mood+Collab |
| Template moodboard | bố cục board theo phòng/phong cách | kéo → khung sẵn |
| Preset render | ánh sáng/giờ · phong cách · bookmark góc máy | áp lên node |
| Template pipeline | chuỗi node sẵn (Sketch→Render→Upscale) | kéo → dựng cả chuỗi |
| (Vẽ 3D) template khối/scene · vật liệu V-Ray/D5/IF · preset camera | massing mẫu · đường cam mẫu | kéo/áp vào scene |

## Chặng 3 · Presenting  (5 loại hồ sơ)
| Kệ | Món |
|---|---|
| Template Deck | bố cục slide · master page · `DECK_STANDARDS` |
| Template Material board | lưới A3 |
| Template Bảng tính/BOQ | biểu mẫu dự toán (live-link CAD) |
| Template Word biểu mẫu | thuyết minh · hợp đồng song ngữ *(hư cấu 100%)* |
| Template Video | timeline mẫu · intro/outro · nhịp cắt |

## Kệ CHUNG (mọi chặng, không lặp)
Vật liệu (ATLAS `matId`) · Brand Kit (dự án) · Asset/ảnh (File Manager) · Font·màu·theme.

## ⛔ 3 câu treo — CẦN HOÀ mổ xẻ
1. **Danh sách form lập luận chặng 2** — thêm/bớt form nào ngoài 6 cái trên?
2. **Phạm vi template** — 3 mức (Chung/Riêng chặng/Riêng dự án) đủ chưa, hay thêm **Riêng studio** (dùng chung nhiều dự án)?
3. **Ai được publish lên kệ** — chỉ Hoà, hay cả studio (có duyệt)?

---
*Cowork ghi 02/08/2026 theo yêu cầu Hoà. Chốt 3 câu treo xong thì đây thành spec đầy đủ.*
