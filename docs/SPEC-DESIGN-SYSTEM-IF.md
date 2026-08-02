# SPEC — DESIGN SYSTEM IF (tokens + motion + component chung)

> Hoà 02/08: *"tìm điểm chung của UI + motion → tạo design system cho app."* Rút từ loạt mock đã chốt
> (render-layout · mood-collab · ve3d · library). Nối `SPEC-CHANG2-UI-2MODE` · `SPEC-VITALS-VISUAL`.

## 1 · Màu (token)
| Token | Hex | Dùng |
|---|---|---|
| bg | `#eceae7` | nền app (sáng) |
| panel | `#ffffff` | mặt panel/card |
| line | `#e6e3de` | viền |
| ink | `#2b2b30` | mực chính |
| mut | `#9a9aa2` | chữ mờ |
| **accent** | `#6a57f5` | nhấn (Vitals) — DÙNG DÈ, 1 accent |
| accent-soft | `#efeafe` | nền nhấn nhẹ |
| chip | `#f4f2ef` | nền chip/segmented |

**Màu loại (node/nhánh):** Mood/Sinh-AI `#e8804d` · Master/AI `#6a57f5` · Thường/OK `#3fb984` · Logic `#4a90e2` · Comment `#e86a9a` · Cảnh báo `#e0a43a`.
**Trục 3D:** X `#e05c5c` · Y `#3fb984` · Z `#4a78e0`. **Badge phạm vi:** Chung(lá)·Studio(tím)·Chặng(dương)·Dự án(cam).

## 2 · Hình khối
Bo góc **6/9/12/16** (chip·nút·card·panel). Bóng card `0 6px 16px rgba(40,38,35,.14)`; panel `0 12px 40px rgba(40,38,35,.10)`. Nút chạm tablet **≥34px**. Chữ system sans, 9–17.

## 2b · Ngôn ngữ bề mặt (Hoà note 02/08)
- **Apple system design (HIG)** làm chuẩn cảm giác: rõ, phẳng, ít viền, spacing thở.
- **Kính lỏng/mờ (Liquid Glass · frosted)**: tool window, popover Vitals, panel nổi = nền blur
  `backdrop-filter` + biên sáng — khớp chốt "kính là VỎ không RUỘT" (`CHOT-RENDER-TOOL-WINDOW`).
- **Toàn bộ motion** theo §3 — mọi chuyển cảnh đều có spring, không cắt khô.

## 3 · Motion (nối SyncWork Reanimated)
- **Spring `withSpring`** gốc, không ease cứng; nhẹ, ngắn.
- Mở tool window = **scale 0.96→1 + fade**; đóng ngược lại.
- Gạt mode = **crossfade cả shell** (canvas+sidebar), không giật.
- Presence/con trỏ lerp mượt. **`prefers-reduced-motion` THẮNG tất cả.**

## 4 · Component chung (1 nguồn, mọi chặng)
Button · Badge(4 phạm vi) · **Node card**(dot loại + cr) · **Tool window**(kính·play·X·cổng nối) · **Toolbar bút**(bút·marker·highlight·tẩy) · **Presence**(on màu/off xám + mời) · **Mode toggle**(gạt) · **Bottom zoom bar** · **Axis gizmo + ViewCube** · **Material swatch**(matId) · Comment pin · Named cursor · Mindmap node · **Inspector panel**(phải: node/file/template) · **Vitals glyph**(cầu kính+electron, 1 accent, 4 trạng thái nghỉ/nghe/nghĩ/trả lời; **chế độ LM = 1 cửa chat AI + chat nhóm** — `SPEC-VITALS-VISUAL`/`SPEC-VITALS-AI`).

---
*Cowork ghi 02/08/2026. Nguồn token cho code — cùng tinh thần SyncWork (1 accent, motion spring) nhưng IF là hệ token RIÊNG.*