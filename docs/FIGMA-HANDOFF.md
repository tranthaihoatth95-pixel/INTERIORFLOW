# InteriorFlow — Bàn giao cho Figma
> Xuất 25/07/2026 từ code thật (`app/globals.css`, `app/**/page.tsx`, `lib/nodes/`). Dùng file này để dựng Design System + thiết kế từng màn trong Figma.
> ⚠️ **IF là sản phẩm ĐỘC LẬP GLOBAL** — không dùng nhận diện TTT. Thương hiệu trong nội dung dự án đến từ **Brand Kit của từng dự án** (người dùng tự nhập), không hardcode.

---

## 1 · Design tokens (giá trị THẬT đang chạy)

### Màu — tối (mặc định)
| Token | Hex | Dùng cho |
|---|---|---|
| `--bg` | `#0C0C0E` | nền app / canvas |
| `--panel` | `#141417` | panel, header |
| `--card` | `#1A1A1E` | thẻ, node |
| `--field` | `#202024` | input, ô nhập |
| `--hover` | `#2A2A30` | trạng thái hover |
| `--border` | `#2A2A31` | viền thường |
| `--border-strong` | `#3D3D45` | viền nhấn |
| `--dots` | `#26262D` | lưới chấm canvas |

### Màu — sáng
| Token | Hex |
|---|---|
| `--bg` | `#F2EFE9` |
| `--panel` | `#FAF8F4` |
| `--card` | `#FFFFFF` |
| `--field` | `#F4F1EB` |
| `--hover` | `#E9E5DD` |
| `--border` | `#E3DED4` |
| `--border-strong` | `#CBC4B6` |
| `--dots` | `#DDD8CE` |

### Accent (một màu duy nhất)
| Token | Giá trị |
|---|---|
| `--accent` | `#8B7CF7` (tím) |
| `--accent-strong` | `#7C6CF0` |
| `--accent-soft` | `rgba(139,124,247,0.14)` — nền nhạt của trạng thái chọn |
| `--accent-ring` | `rgba(139,124,247,0.55)` — vòng focus |

### Kính mờ (glass) — đặc trưng của app
| Token | Giá trị |
|---|---|
| `--mat-header` | `rgba(20,20,23,0.72)` |
| `--mat-panel` | `rgba(20,20,23,0.68)` |
| `--mat-card` | `rgba(26,26,30,0.82)` |
| `--mat-overlay` | `rgba(6,6,8,0.56)` |
| `--mat-hairline` | `rgba(255,255,255,0.06)` — viền 1px trên kính |
| `--blur` | `22px` · `--blur-strong` `40px` |

→ Trong Figma: dùng **Background blur** 22px (hoặc 40px cho modal) + fill `mat-*` + stroke 1px `mat-hairline`.

### Bo góc
`--radius-sm` **10px** · `--radius-md` **14px** (mặc định) · `--radius-lg` **20px** · `--radius-xl` **28px**

### Đổ bóng
| Token | Giá trị |
|---|---|
| `--shadow-sheet` | `0 12px 40px -12px rgba(0,0,0,0.70)` — modal/sheet |
| `--shadow-pop` | `0 8px 30px -8px rgba(0,0,0,0.65)` — popover |
| `--shadow-node` | `0 6px 20px -8px rgba(0,0,0,0.60)` — node trên canvas |

### Chữ
- **Font**: `Be Vietnam Pro` (Google Fonts) — có đủ dấu tiếng Việt. Fallback: `-apple-system`, `SF Pro Text`, `system-ui`, `Segoe UI`, `Roboto`.
- Cài trong Figma: Be Vietnam Pro (Regular 400 · Medium 500 · SemiBold 600).

### Chuyển động
- Easing: `cubic-bezier(0.32, 0.72, 0, 1)` (kiểu Apple)
- Thời lượng: nhanh **180ms** · thường **320ms**

---

## 2 · Cấu trúc màn hình → page Figma

**Quy ước quan trọng**: đặt tên page/frame **khớp route thật** để không lệch khi bàn giao code.

| Page Figma | Route thật | Scope | Ghi chú |
|---|---|---|---|
| `00 · Foundations` | — | — | tokens ở mục 1 |
| `01 · Components` | — | — | xem mục 3 |
| `10 · Global / Login` | `/login` | global | ảnh nền + card kính, có VI/EN + "Đổi nền" |
| `11 · Global / Intro` | `/intro` | global | 4 cảnh cinematic 60s |
| `12 · Global / Gallery` | `/` | global | card-deck dự án + ô chat Vitals |
| `13 · Global / Library` | `/library/ingest` | global | nhập ảnh/PDF/CAD + AI phân loại |
| `14 · Global / Settings` | `/settings/avatar` | global | avatar builder |
| `20 · Project / Overview` | `/projects/[id]/overview` | project | nhân sự + tiến độ |
| `21 · Project / CAD` | `/projects/[id]/cad` | project | Drafting CAD |
| `22 · Project / Render` | `/projects/[id]/render` | project | canvas node |
| `23 · Project / Present` | `/projects/[id]/present` | project | biên tập slide |
| `24 · Project / Photo` | `/projects/[id]/photo` | project | chỉnh ảnh raster |
| `25 · Project / Notebook` | `/projects/[id]/notebook` | project | 3 cột: nguồn · chat · xem trước |
| `30 · Present mode` | `/present` | global | trình chiếu toàn màn |
| `31 · Share` | `/share/[token]` | global | link chia sẻ khách xem |

**Tên frame** = `route — trạng thái`, ví dụ:
`/projects/[id]/cad — trống` · `— đang vẽ` · `— panel Zone mở` · `— khung tên`

**Khổ frame**: Desktop **1440×900** (chính) · Laptop **1280×800** · Tablet **1024×768** · Mobile **390×844**.
⚠️ CAD và canvas node **chỉ desktop** — không thiết kế mobile cho 2 màn này.

---

## 3 · Component cần dựng trong Figma

### Khung chung (mọi màn trong dự án)
- **Header** — wordmark IF · 3 tab chặng (CAD · Phác thảo / Rendering / Presenting) · nút Home · Việc · Chat · Tổng quan · Notebook
- **StudioBar** — thanh chuyển chặng
- **Vitals** — cử chỉ kéo xuống: **tầng 1** popover chat nhanh · **tầng 2** NotebookLM toàn màn (ngưỡng kéo 120px)
- **Panel** kính mờ — dùng chung: Layer · Zone · Schedule · Legend · Khung tên · Kiểm chuẩn
- **Modal** — Mask Painter · Smart Select · Warp 4 góc · Annotate
- **Toast / trạng thái** · **Empty state** · **Coachmark** (tour)

### Chặng CAD
Toolbar vẽ (line/rect/ellipse/hatch/zone/arrow…) · **command line** kiểu AutoCAD (gõ `L`, `REC`, `ZONE`…) · panel Layer 5 lớp · panel Thống kê+Chú giải · khung tên · status bar

### Chặng Render (canvas node)
- **Node card** — trạng thái: chờ · đang chạy · xong · lỗi. Có: tiêu đề, badge credit, nút chạy, nút xoá, các cổng vào/ra (`image` · `mask` · `text` · `video`)
- **45 kiểu node** chia 5 nhóm: INPUT (7) · AI_GENERATE (11) · AI_EDIT (8+) · UTILITY (12+) · OUTPUT (3)
- **Node Library panel** (trái) — có ô tìm, hỗ trợ tiếng Việt không dấu
- **Command palette ⌘K**
- **Bottom toolbar** — select/pan/undo/redo/zoom/fit/auto-layout/snap
- **Minimap** góc phải dưới

### Chặng Present
Filmstrip slide (dưới) · panel `Mẫu / Reference / Motion` (trái) · panel Lớp + Nền slide (phải) · toolbar chèn (chữ/ảnh/shape/mũi tên) · Brand Kit · chọn khổ 16:9 · A4/A3

---

## 4 · Nguyên tắc thiết kế (rút từ code hiện tại)

1. **Tối là mặc định**, sáng là tuỳ chọn — làm cả 2 theme cho mọi frame.
2. **Kính mờ + viền hairline 1px** là đặc trưng, không dùng bóng nặng cho panel.
3. **Một accent duy nhất** (tím `#8B7CF7`). Không thêm màu thương hiệu nào khác vào UI.
4. **Nội dung người dùng ≠ UI app** — slide/bản vẽ/render của khách dùng Brand Kit dự án; không áp palette app lên nội dung.
5. **Song ngữ VI · EN** — nhãn có thể ghép bằng dấu `·`. Chừa chỗ cho tiếng Việt dài hơn ~25%.
6. **Canvas là trung tâm** — panel nổi trên canvas, thu gọn được, không chiếm cứng chỗ.

---

## 5 · Việc nên làm trong Figma (thứ tự)

1. `00 · Foundations` — tạo **Variables** đúng tên token ở mục 1 (2 mode: Dark/Light) → sau này đổi màu là code theo được.
2. `01 · Components` — dựng Node card + Panel + Modal + Header trước (dùng nhiều nhất).
3. Thiết kế theo thứ tự màn: **Gallery → Render → CAD → Present** (đúng thứ tự người dùng gặp).
4. Mỗi frame làm **cả Dark + Light**.

## 6 · Khi bàn giao ngược về code
Gửi **link node cụ thể** (URL có `?node-id=...`) cho từng frame — không gửi link file chung. Mỗi lượt 1 frame để sửa đúng phạm vi.
