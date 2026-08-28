# LOẠT ĐÁNH GIÁ — Hoà soi 14/08 (T soạn: kiểm trung tính + tick luồng việc thật)

## PHẦN 1 · KIỂM TRUNG TÍNH THUẬT TOÁN RENDER (Hoà yêu cầu)
| Chỗ | Nội dung | Phán |
|---|---|---|
| `lib/nodes/registry.ts:292-295` | 4 phong cách Scandinavian · Japandi · Indochine · Modern Luxury kèm mô tả vật liệu | ✅ **ĐẠT** — đây là DANH MỤC người dùng CHỌN (giống D5/Enscape có preset), không ép gu; user chọn gì máy theo nấy |
| `lib/ai/chat-assist.ts:37` | chữ "tinh thần quiet-luxury" | ✅ **ĐẠT** — chỉ nằm trong COMMENT mô tả, KHÔNG vào prompt thật (grep xác nhận 0 chỗ trong chuỗi gửi model) |
| `lib/ai/tiers.ts:87` | blurb tier FLUX-RTX: *"ảnh chốt quiet-luxury"* | 🟡 **LỆCH NHẸ** — chuỗi UI mô tả tier lại gán gu; sửa thành "ảnh chốt chất lượng cao" (1 dòng, không ảnh hưởng logic) |
| placeholder ô nhập (`registry.ts:619`, `render-v2.ts:132`) | ví dụ "warm japandi living room…" | 🟡 **LỆCH NHẸ** — ví dụ trong ô nhập vẫn nghiêng 1 gu; nên xoay vòng nhiều gu hoặc dùng câu trung tính |
| `lib/ai/models.ts` (làn máy render) | 0 chuỗi gu/brand | ✅ **SẠCH** |
| Prompt lượt render Westlake hôm nay | tả theo ẢNH THAM CHIẾU CỦA HOÀ, không có gu cài sẵn | ✅ **ĐẠT** |
**Kết luận:** lõi render KHÔNG vi phạm luật trung tính. 2 vết nhẹ ở lớp CHỮ hiển thị (tier blurb + placeholder) — đã ghi thành việc, sửa 2 dòng.

## PHẦN 2 · LUỒNG VIỆC THẬT — TICK ĐẠT / GHI LỖI
### ✅ ĐẠT (chạy trọn trên app/máy thật, có bằng chứng)
- ✅ **PDF → deck sửa được**: 477 trang, chọn trang, chữ thật + ảnh đúng vị trí, deck 0,05MB
- ✅ **Vòng chỉnh ảnh liên chặng**: bấm ✨ trên ảnh deck → node chặng 3D → chỉnh → ảnh thay ĐÚNG khung
- ✅ **Xuất PDF lại từ deck** (11 trang, ảnh đã sửa nằm đúng chỗ)
- ✅ **Gói Hồ Sơ Sống .zip** 3 tầng + viewer tự chứa + kênh PDF
- ✅ **Xuất chuỗi ảnh PNG** từ đường camera (kho chờ dây cuối đã nối)
- ✅ **Ảnh → 3D mesh có tham số** (Lincoln 327: GLB + .idfc, cờ verified/inferred từng trường)
- ✅ **Chuẩn nét mesh**: xoá bóng nướng nhầm · 4 chân thành trụ tham số · 2 vòng thành xuyến · xuất OBJ cho Max
- ✅ **Wireframe định biên theo diện**: 62 diện, 3 hình chiếu đọc được, chuỗi nét→màu→vật liệu
- ✅ **Ghế vào Thư viện app + cửa sổ 3D bật/tắt**
- ✅ **Nhất quán sắc độ cả loạt** (4/4 view sàn đậm hơn vách — bằng lớp chỉnh tất định)

### ❌ CHƯA ĐẠT — ghi lỗi thật
| # | Lỗi | Nơi |
|---|---|---|
| L1 | **Render AI không lên được ánh sáng thật** (không GI, đèn thả vẫn tắt, không quầng ấm) — bám hình học cao thì neo luôn tone | lượt Westlake hôm nay |
| L2 | **Trôi thiết kế ở V1/V2/V3**: đổi cành cây, dáng ghế/sofa, nội dung tranh, phù điêu→đèn nến | 3/4 view |
| L3 | **Canny bị loại**: khoá nét nhưng không neo vật liệu (travertine→gỗ, thêm sofa lạ) | thử nghiệm V1 |
| L4 | PDF xuất **nướng phẳng 1 JPEG/trang, mất lớp chữ** (trái luật đích-sửa-được) | DF2-F9 |
| L5 | Nhập trang render **treo tab + mất slide sau reload** · autosave ôm 190MB rác | DF2-F4/F5 |
| L6 | **DWG/DXF import**: lỗi vài chỗ, mất entity, không chọn được | Hoà bắt, chưa tái hiện |
| L7 | Mesh máy sinh còn **mảnh vụn + màng giả**, chưa xuất FBX | chuẩn nét v2 |

## PHẦN 3 · ĐỀ XUẤT THỨ TỰ XỬ (T đề xuất, Hoà quyết)
1. **Grounded Render v0 mask-based** trên đúng V3 phòng ăn — giải L1+L2+L3 cùng lúc (tách "giữ hình học" khỏi "nâng sáng")
2. **L4 PDF mất lớp chữ** — chặn hàng giao thật
3. L5 ổn định nhập trang · L6 tái hiện DWG · L7 dọn mesh
4. 2 vết trung tính lớp chữ (2 dòng)
