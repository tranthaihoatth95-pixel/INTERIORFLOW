# CHỐT — BỎ INTRO CODE, THAY BẰNG VIDEO (Google Flow)

> Hoà 02/08 tối, xem `/intro` chạy thật: *"gớm quá"* + *"intro thì sử dụng google flow, mình có credit"*.
> Cowork soi 2 khung thật + đọc code (998 dòng: `IntroSequence` 357 · `TitleSequence` 375 · `svgs` 266).

## 1 · Vì sao bỏ, không sửa
| Lỗi | Chi tiết |
|---|---|
| **Bố cục** | màn 1: đồ vật clipart (bàn·màn hình·đồng hồ·chuột·thước·bút) **bay rải đều**, không điểm nhìn |
| **Vô nghĩa** | màn 2: **3 màn hình GIỐNG HỆT** cho 3 chặng khác nhau ⇒ không phân biệt được gì; đường cong cam không mang nghĩa; "giọt nước" cam không rõ là gì |
| **Tỉ lệ** | nhân vật chibi lạc lõng, sai tỉ lệ so với màn hình |
| **Ngôn ngữ** | nhồi song ngữ Việt+Anh mọi dòng — sai `SPEC-NGON-NGU-CHI-DAN` |
| **🔴 Trung tính** | trọn bộ màu TTT: navy `#002850` · cam `#F06020` · be `#F1ECE3` · ink `#1B1512` (`IntroSequence.tsx:47-50`) |
| **🔴 Trung tính** | 6 ảnh **render dự án khách thật** `/detech/*` làm nội dung (`TitleSequence.tsx:37-60`); `public/detech/` = **18 file · 22 MB đang track git**, dùng ở **35 chỗ / 3 file** |

⇒ Sửa từng lỗi vẫn không cứu được ý tưởng gốc. **Bỏ hẳn.**

## 2 · Thay bằng gì
**Một video 8 giây + một dòng chữ + nút Bỏ qua.** Hết. Không animation tự code.
- Video sinh bằng **Google Flow** (Hoà có credit) — 2–3 bản 8s, chọn 1.
- Prompt đã soạn: nội thất rỗng giờ vàng, dolly tiến chậm, rèm lay, nắng xiên, kết fade nền kem
  chừa giữa khung cho chữ. Không người, không chữ, không logo trong video.
- Chữ overlay bằng **token IF** (`--t1`, `--fs-xl`), **một ngôn ngữ** qua `lib/i18n.ts`.
- Nút **Bỏ qua** góc phải; `prefers-reduced-motion` → hiện khung tĩnh + chữ, không phát video.

## 3 · Việc kèm theo (bắt buộc)
1. Xoá `components/intro/IntroSequence.tsx` · `TitleSequence.tsx` · `svgs/index.tsx` (998 dòng) —
   giữ trong git history, không cần nuối.
2. `app/intro/page.tsx` giữ nguyên cơ chế `localStorage if_intro_seen_v1`, chỉ đổi phần hiển thị.
3. Gỡ `/detech/*` khỏi **35 chỗ / 3 file** (`TitleSequence` sẽ xoá; còn `lib/present-editor/demo-enso-sample.ts`
   và `lib/demos/present.ts` phải thay ảnh demo trung tính).
4. `public/detech/` (18 file · 22 MB): `git rm --cached` + gitignore + dời ra `~/Downloads/_IF-ANH-DEMO/`.
   ⚠️ Lịch sử git vẫn còn ảnh → **cần `filter-repo` trước khi phát hành**.

---
*Cowork ghi 02/08/2026 theo chốt Hoà. Nối `AUDIT-BRAND-PII` (mức đỏ) · `SPEC-NGON-NGU-CHI-DAN`.*
