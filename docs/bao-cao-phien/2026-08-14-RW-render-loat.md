# RW · BÁO CÁO — RENDER LOẠT WESTLAKE C4 (14/08)

Phiếu: `docs/phieu-giao/render-loat-westlake.md`. Luật cứng: giữ nguyên thiết kế, chỉ nâng
ánh sáng + chất vật liệu + sắc độ 3 lớp + nước hình.

## 0 · KẾT LUẬN NGẮN — NÓI THẲNG
Một nửa nhiệm vụ ĐẠT, một nửa TRƯỢT.
- **ĐẠT**: giữ thiết kế. 4/4 view nhận ra ngay là cùng căn phòng, không mất đồ, không đổi bố cục.
- **TRƯỢT**: nâng ánh sáng. Đo được — lượt AI làm **lệch tone dưới 2 điểm** ở mọi dải. Không có
  GI thật, không có đèn bật quầng ấm, không có bóng đổ nhiều tầng. Ảnh ra vẫn là screenshot sạch,
  **chưa phải render**.
- Sắc độ 3 lớp về đúng chuẩn nhờ **lớp chỉnh tone tất định 0 credit** làm thêm, KHÔNG phải nhờ AI.

## 1 · PHÁT HIỆN ĐẦU VÀO (khác phiếu)
- **V5.jpg KHÔNG phải screenshot** — nó là **render D5 hoàn chỉnh của đúng view V2**. Phiếu ghi
  "V4/V5 bếp" là sai; chỉ V4 là bếp.
- `tham-chieu-B/` **rỗng** → không có `CHUAN-TONE-*`. ⇒ Quyết định: **dùng V5 làm chuẩn tone**
  (đúng tinh thần phiếu "có CHUAN-TONE thì đo pixel, ưu tiên") và **không đốt job render lại nó**.
  ⇒ Loạt render thật = **4 view V1–V4**, không phải 5.
- V4 có chữ UI SketchUp góc trên-trái + dấu trục đỏ góc dưới-trái → cắt 18px trên / 12px trái
  trước khi đưa vào. Đây là rác giao diện, **không phải nội dung thiết kế**.
- V1/V2/V3 có chữ `VRayFur` giữa khung (nhãn proxy trong model) — lượt render đã xoá sạch, tốt.

## 2 · SỐ ĐO CHUẨN TONE (trích từ V5 — render D5 hoàn chỉnh)
| | trần | tường | sàn | WB (R−B) |
|---|---|---|---|---|
| **V5 chuẩn D5** | 62,4 | 54,4 | **21,9** | **+16** (ấm) |
| screenshot V1–V4 | 60–68 | 36–71 | **42–44** | +9…+10 |
⇒ Bệnh đúng như DF4 chẩn: **sàn/thảm không đậm hơn vách**, sắc độ dính nhau, nước hình lạnh.

## 3 · THAM SỐ ĐÃ CHẠY
| | |
|---|---|
| Model | `fal-ai/flux/dev/image-to-image` (khai trong `lib/ai/models.ts` — `sketch2render.falFast`) |
| Control | **chính screenshot** (`image_url`) |
| strength (denoise) | **0,50** — thấp, giữ hình học + giữ màu/vật liệu gốc |
| guidance_scale | **3,5** — đúng `CONTROL_GUIDANCE_DEFAULT` |
| steps | 40 · **seed 20260814 — CÙNG seed cả 4 view** |
| Prompt | chỉ tả ánh sáng + vật liệu **đang có trong ảnh đó** + nước hình. **Không** câu lệnh "giữ nguyên" (bài học F7) |

## 4 · ĐƯỜNG ĐÃ THỬ VÀ LOẠI — FLUX Pro Canny
Phiếu đề cử `sketch2render`/`clay2render` (control lock). Đã chạy thật V1 qua
`fal-ai/flux-pro/v1/canny`, guidance 3,5. **LOẠI — vi phạm luật cứng nặng**:
đổi vách travertine thành gỗ sáng · đổi sàn đá xám thành gỗ nâu đậm · **thêm nguyên bộ sofa
tiền cảnh không có trong thiết kế** · đổi cả bảng vật liệu sang họ nâu ấm.
Nguyên nhân: canny chỉ khoá **đường nét**, **không neo màu/vật liệu** — mọi vật liệu do prompt đẻ ra.
⇒ **Ghi thành luật cho phiên sau: với ảnh nguồn ĐÃ CÓ vật liệu đúng, cấm dùng canny/depth thuần.**
Ảnh bằng chứng giữ lại: `ket-qua/V1-render-canny.jpg`.

## 5 · BẢNG 5 VIEW — ĐẠT / LỆCH (tự soi mắt, không tô hồng)
| View | Giữ thiết kế | Ánh sáng thật | Sắc độ 3 lớp (sau grade) | Lệch phải nói rõ |
|---|---|---|---|---|
| **V1** khách+TV | 🟡 phần lớn | ❌ | ✅ sàn 25,5 | **cành ô liu thành cành khô trụi** · ghế bar đổi kiểu (đan/vàng đồng) · thêm chậu cây trên kệ · đồ trên kệ đổi |
| **V2** khách sofa | 🟡 phần lớn | ❌ | ✅ sàn 23,9 | **sofa + ghế đơn đổi dáng** (bouclé chân vòm → hộp vuông có nẹp da) · tranh đổi nội dung (cành → hoa lá) · chao đèn cầu đổi |
| **V3** phòng ăn | 🟡 phần lớn | ❌ đèn thả **vẫn không sáng** | ✅ sàn 24,1 | ghế đổi chất (da → nỉ, thêm đinh tán) · tranh đổi hoạ tiết · **phù điêu tường phải thành đèn nến** |
| **V4** bếp | ✅ **tốt nhất loạt** | ❌ | ✅ sàn 23,6 | không mất đồ; tủ/đảo/nan/tủ rượu/tủ lạnh/ghế đúng nguyên |
| **V5** | — | — | — | **không render** — là ảnh chuẩn D5, dùng làm tham chiếu |

Sau grade, **4/4 view có sàn đậm hơn vách** (−11,3 / −49,6 / −21,3 / −32,1) — đạt ràng buộc B3 của DF4.
WB ấm +17…+23 (chuẩn +16) — **V1/V2 hơi quá ấm một nhịp**, nói luôn.

## 6 · CHI PHÍ
**5/5 job — đúng trần, không vượt.** V1 img2img · V1 canny (thử, loại) · V2 · V3 · V4.
Lớp chỉnh tone tất định: **0 job**.

## 7 · ĐƯỜNG DẪN
`~/Downloads/WESTLAKE-C4-RENDER/ket-qua/`
- `V1..V4-render.jpg` — bản AI giữ thiết kế
- `V1..V4-render-grade.jpg` — **bản giao Hoà xem** (AI + sắc độ 3 lớp + WB ấm)
- `V1-render-canny.jpg` — bằng chứng đường loại
- `doi-chieu.html` — 3 cột trước / AI / AI+grade từng view + V5 chuẩn

## 8 · VÌ SAO TRƯỢT PHẦN ÁNH SÁNG — và đường ra
img2img strength thấp **neo luôn cả tone gốc**, nên vừa giữ được thiết kế vừa không đổi được sáng.
Đẩy strength lên thì được sáng nhưng **trôi thiết kế** (đã thấy mầm trôi ngay ở 0,50: cành ô liu,
dáng sofa). Hai yêu cầu này **kéo ngược nhau trên cùng một núm** — không có điểm nào của núm
strength thoả cả hai.
⇒ Đường ra đúng là **Grounded Render** (`docs/SPEC-GROUNDED-RENDER-2026-08-13.md`): tách mảng bằng
mask rồi **sinh từng mảng**, không trộn toàn cục — ánh sáng đổi mảng nào chỉ mảng đó, vật liệu mảng
khác không có cửa trôi. Loạt này chính là **bằng chứng thực nghiệm** cho lý do spec đó tồn tại.
Muốn có ánh sáng thật ở loạt Westlake mà không trôi thiết kế thì cần mở budget cho v0 mask-based,
không phải chỉnh thêm núm.
