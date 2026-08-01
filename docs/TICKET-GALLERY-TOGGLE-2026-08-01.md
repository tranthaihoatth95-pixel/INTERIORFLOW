# TICKET — Gallery Home: toggle Carousel 3D ↔ Grid

> Hoà duyệt **01/08/2026**. Gốc: `ProjectSelect.tsx:475` (J-4c) tự đổi carousel → grid khi
> **>8 dự án** — hành vi đúng thiết kế, nhưng người dùng không có quyền chọn ngược lại.
> Nguyên tắc áp dụng: **một năng lực, hai lối vào** (luật `2.1.10`).

## Yêu cầu

1. Thêm **nút toggle** cạnh bộ lọc "Tất cả dự án": hai trạng thái 🎠 carousel 3D / 🔲 grid.
2. **Mặc định giữ nguyên hành vi J-4c** (≤8 carousel · >8 grid) — toggle là GHI ĐÈ của người dùng,
   không phải thay thế logic tự động.
3. **Nhớ lựa chọn** qua phiên — **kênh lưu ĐÃ CÓ, đừng đẻ kênh mới**.
   🔍 Cowork tra giúp (`ExperienceSettings.tsx:15`): app dùng `lib/resume.ts` với **cờ khoá theo
   user** — `resetTourDone(u.id)` · `resetStageIntroSeen(stage, u.id)` · `resetCoachmarkSeen(name, u.id)`
   · `requestGallery()`. Thêm cặp get/set cho tuỳ chọn gallery **vào đúng `lib/resume.ts` theo cùng
   khuôn khoá-theo-`u.id`**. Không dùng `localStorage` trần, không thêm store mới.
4. `useReducedMotion` (`:295`) vẫn **thắng tất cả** — reduce-motion luôn ra danh sách phẳng,
   toggle bị vô hiệu (disabled + tooltip giải thích), không phải bị giấu.
5. Carousel với nhiều dự án (9–20+): giữ nguyên cơ chế pose 5 card hiện có (`POSES` `:202-206`)
   — chỉ card focus ±2 render pose 3D, còn lại ẩn; KHÔNG render 20 card 3D cùng lúc.

## ⚠️ Ranh giới file — hai phiên code đang chạy song song

| File | Ai được đụng |
|---|---|
| `components/ProjectSelect.tsx` · `lib/resume.ts` · `ExperienceSettings.tsx` | **code chính** (ticket này). 🧮 Code phụ đã tuyên bố KHÔNG đụng `ProjectSelect` (Escape ở đó là huỷ-input-inline, không phải đóng lớp) — an toàn |
| `components/cad/CadEditor.tsx` | 🔴 **TRANH CHẤP** — code chính cần nó cho panel V2 đường cam, code phụ cần nó ở ĐỢT 3 cụm CAD. Ai đụng trước phải báo; **không sửa mù** |

## Không thuộc phạm vi

Panel "Chi tiết" xổ ra + trạng thái Larkbase trên card (`RESEARCH-HOME-GALLERY-DASHBOARD.md` §2.2)
— việc riêng, đã có nghiên cứu, chờ xếp đợt.

---

*Cowork ghi 01/08/2026 sau khi Hoà gật hướng 2 (toggle) thay vì nâng ngưỡng.*
