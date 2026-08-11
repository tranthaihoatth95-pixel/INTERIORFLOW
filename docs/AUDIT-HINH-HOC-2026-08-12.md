# AUDIT HÌNH HỌC BO GÓC — 12/08/2026

> Đáp lời Hoà chê 12/08: *"bo góc không phát triển từ tâm, không nhất quán — hình sau phải là
> hệ quả thay đổi của hình trước như design system Apple."*
> Phiếu này: **đo thật + đề xuất thang + máy soi** (`scripts/soi-hinh-hoc.mjs`, `npm run soi:hinh-hoc`).
> KHÔNG sửa component nào trong phiếu này — sửa theo mục §5 ở các phiếu sau.

## §0 · Chẩn bệnh — vì sao "không phát triển từ tâm"

**HAI thang bo góc đang tồn tại song song**, không thang nào thắng:

| Thang | Nguồn | Giá trị | Đang dùng ở đâu |
|---|---|---|---|
| A | `SPEC-DESIGN-SYSTEM-IF` (chốt 02/08) | **6 / 9 / 12 / 16** | mock Claude Design, một phần component port từ mock |
| B | `app/globals.css:65-68` `--radius-sm/md/lg/xl` | **10 / 14 / 20 / 28** | 62 chỗ `var(--radius-*)` trong code |

Hệ quả đo được: code dùng **8px nhiều nhất (259 lần)** — mà 8 KHÔNG thuộc thang nào.
Người viết mỗi chỗ tự "nội suy" giữa hai thang → ra 5, 7, 8, 11, 13, 15, 18, 24…
Ba panel nổi cùng cấp ra ba radius khác nhau: CommandPalette 12 · AccountMenu 14 · modal export Present 16.

## §1 · Số liệu tần suất (grep thật 12/08)

### 1a · Code (`components/` + `app/globals.css`) — 250 file, 1.020 khai báo
Máy soi (`node scripts/soi-hinh-hoc.mjs`, thang tạm = CẢ 2 thang + dẫn xuất §2c) — output nguyên văn:

```
SOI HÌNH HỌC BO GÓC — 2026-08-11 (báo cáo)
Thang cho phép (TẠM — cả 2 thang cũ + dẫn xuất §2c): 0 / 1 / 2 / 3 / 4 / 6 / 9 / 10 / 11 / 12 / 14 / 16 / 17 / 20 / 22 / 28 + capsule 999
──────────────────────────────────────────────────────────────────────────────
🔴 GIÁ TRỊ NGOÀI THANG (giá trị → số lần):
       8px  × 259
       7px  × 72
       5px  × 23
      24px  × 2
      18px  × 2
      32px  × 1
      13px  × 1
🔎 TOP FILE VI PHẠM:
     17  components/cad/CadEditor.tsx
     14  components/cad/CadCanvas.tsx
     13  components/render-studio/Command3DPanel.tsx
     12  components/tasks/TaskBoardScreen.tsx
      8  components/FlowCanvas.tsx
      8  components/materials/MaterialImportWizard.tsx
      8  components/materials/MaterialPbrEditor.tsx
      8  components/present-editor/ImageEditor.tsx
──────────────────────────────────────────────────────────────────────────────
Đã quét 250 file · 1020 khai báo radius · 360 ngoài thang (7 giá trị lẻ)
```

**Tổng: 360/1.020 khai báo (35%) ngoài mọi thang · 7 giá trị lẻ.**
Tần suất chính trong code (JSX numeric + CSS px + Tailwind arbitrary):
`8`×259 · `10`×~210 · `6`×~90 · `7`×72 · `12`×~60 · `14`×~45 · `5`×23 · `9`×~50 · `999/full`×~180 · `var(--radius-sm)`×41 · `var(--radius-md)`×18.

### 1b · Mock (`docs/mocks/*.html` — 87 file)
Off-scale (5/7/8/13/15/18/24/26px): **787 lần**. Đậm nhất: `8px`×434 · `6px`×285 · `14px`×245 ·
`10px`×687 (hợp thang B) · `7px`×134 · `5px`×145. → xem §6.

## §2 · Bảng 15 cặp lồng đo tay (đọc code lấy radius + padding thật)

Công thức chuẩn: `rInner = max(4, rOuter − pad)`.

| # | Cặp (file:dòng) | Ngoài | Đệm | Trong thật | Trong ĐÚNG | Kết luận |
|---|---|---|---|---|---|---|
| 1 | **BottomToolbar** bar→nút (`:115→:75`) | r22 (h44) | 5 | r17 | 17 | ✅ MẪU CHUẨN §2c |
| 2 | **CadToolbelt** wrapper→pill bar (`:45→:83`) | r24 | 0 | r18 | 24 | ❌ lệch 6; 24 còn lẻ thang |
| 3 | **CadToolbelt** pill bar→nút (`:83→:102`) | r18 | 6 | r11 | 12 | ❌ lệch 1 |
| 4 | **CadToolbelt** nút↔select cùng hàng (`:102/:105`) | — | — | r11 / r10 | bằng nhau | ❌ anh em lệch nhau |
| 5 | **ToolDock3D** bar→nút (`:163→:191`) | r14 | 4 | r10 | 10 | ✅ |
| 6 | **ToolDock3D** popup→nút (`:209→:266`) | r14 | 6 | r8 | 8 | ✅ |
| 7 | **LibrarySheet** tấm→thẻ (`library-sheet-css.ts:67→:202`) | r20 | 12 | r14 | 8 | ❌ lệch 6 (thẻ trong vùng cuộn — nếu giữ 14 phải ghi thành ngoại lệ có tên) |
| 8 | **LibrarySheet** thẻ→badge (`:202→:232`, inset 6) | r14 | 6 | r5 | 8 | ❌ lệch 3 |
| 9 | **LibrarySheet** sizeseg→nút (`:179→:180`) | r20 (h28) | 3 | r20 (h22) | capsule | ⚠️ đúng hình (capsule-trong-capsule) nhưng khai số 20 thay vì 999 — mù ý đồ |
| 10 | **StageSwitcher** khung→pill (`:249→:289`) | r10 | 2 | r8 | 8 | ✅ |
| 11 | **StageSwitcher** pill→badge (`:289→:334`) | r8 | 5 | r3 | 3 | ✅ |
| 12 | **ProjectInitBoard** card→hàng template (`:42→:55`) | r20 | 18 | r10 | max(4,2)=4 | ❌ theo công thức phải 4 — chứng minh công thức cần QUY ƯỚC KHOẢNG CÁCH (xem §3c); kèm input r9 vs btn r10 anh em lệch |
| 13 | **AccountMenu** panel→hàng menu (`:68→:76`) | r14 | 8 | r10 | 6 | ❌ lệch 4 (hoặc nâng panel 18) |
| 14 | **Present Toolbar** modal→nút đóng (`:835→:841`) | r16 | ~12 | r8 | 4* | ❌ + r16 thuộc thang A còn r8 lẻ cả hai thang — 2 thang trộn trong 1 file |
| 15 | **CommandPalette** vs panel nổi cùng cấp (`:215` / AccountMenu`:68` / Toolbar`:835`) | — | — | r12 / r14 / r16 | một giá trị | ❌ HỆ THỐNG: ba panel nổi ba radius |

Đối chứng tốt: `glass-float` (globals.css:917-920) tự nhất quán — khối `--radius-lg`, thanh 999.
**Điểm: 4 đạt · 1 đạt-có-điều-kiện · 10 vi phạm.**

## §3 · Đề xuất MỘT thang duy nhất (chờ Hoà duyệt)

### 3a · Dãy gốc — 4 token + capsule
```css
--r-1: 6px;    /* chip, badge, ô nhập nhỏ            (nuốt 5, 7, và 8 cỡ nhỏ) */
--r-2: 10px;   /* nút, hàng list, field              (nuốt 8 cỡ nút, 9, 11, 12) */
--r-3: 14px;   /* card, popover, panel con           (nuốt 13, 15, 16) */
--r-4: 20px;   /* tấm/sheet/modal, khối kính lớn     (nuốt 18, 22-khối, 24, 28) */
--r-full: 999px; /* capsule/tròn — MỌI thanh, pill, switch, track */
```
Chọn nhánh **thang B (globals)** làm gốc vì: đã token hoá (62 usage `var(--radius-*)`), khớp
`.glass-float`, khớp chốt "tấm Thư viện `--radius-lg`". Thang A (6/9/12/16) chỉ giữ lại nấc 6;
9→10, 12→10 hoặc 14 theo cỡ, 16→14.

### 3b · Phát hiện then chốt: chuỗi §2c thực chất là CAPSULE, không phải số lẻ
Bar 44/r22 · nút 34/r17 · track 22/r11 — cả ba đều `r = height/2` ⇒ khai đúng là `--r-full`
(999px, browser tự clamp). Núm tròn 18 = 50%. **⇒ 17/22/11 KHÔNG cần nằm trong thang** —
chúng là capsule. Thang chỉ còn 4 số + 999, mọi số khác phải là dẫn xuất concentric.

### 3c · Công thức concentric + quy ước khoảng cách
```
rInner = max(4, rOuter − pad)        // pad = khoảng mép ngoài → mép con
```
- **TS util** (inline style): `lib/geometry.ts` → `export const concentricRadius = (rOuter: number, pad: number) => Math.max(4, rOuter - pad);`
- **CSS** (stylesheet): `border-radius: max(4px, calc(var(--r-out) - var(--pad)));`
- **Quy ước khoảng cách** (bài học cặp #12): công thức concentric chỉ áp khi con **ôm sát mép**
  (pad ≤ ~8px — mắt còn đọc hai đường cong là "đồng tâm"). Con nằm sâu trong vùng nội dung
  (pad > 8) thì lấy radius theo **cỡ của chính nó** từ thang 3a. Đây đúng cách Apple làm:
  icon trong dock đồng tâm với dock; hàng chữ trong Settings thì theo cỡ hàng.

### 3d · Bảng migrate (cũ → mới)
| Cũ | Mới | Ghi chú |
|---|---|---|
| 5, 7 | `--r-1` 6 | |
| 8 | `--r-1` 6 (chip <28px) hoặc `--r-2` 10 (nút ≥28px) | 259 chỗ — phân loại theo cỡ, không thay hàng loạt |
| 9, 11, 12 | `--r-2` 10 | 11 giữ nguyên NẾU chứng minh được là dẫn xuất concentric |
| 13, 15, 16 | `--r-3` 14 | |
| 18, 22 (khối), 24, 28 | `--r-4` 20 | `--radius-xl` 28 chỉ 6 usage → gộp về 20 |
| 17, 22 (thanh h44), 11 (track h22) | `--r-full` | capsule, xem §3b |
| 50% | giữ | phần tử vuông → tròn |
| 0–4 | giữ nguyên số | vi mô (vạch, focus-ring, chấm) — dưới ngưỡng thang |

Khi Hoà duyệt: đổi mảng `ALLOWED` trong `scripts/soi-hinh-hoc.mjs` về `[6,10,14,20]` + bật
`--strict` trong pre-push.

## §4 · Top 10 chỗ sửa trước (ưu tiên chỗ Hoà nhìn nhiều)

1. **`components/cad/CadToolbelt.tsx`** — toolbelt 2D: wrapper 24→20, pill 18→concentric, nút 11↔select 10 đồng bộ (cặp #2·3·4).
2. **`components/render-studio/Command3DPanel.tsx`** — dock/panel 3D, 13 vi phạm (nhiều r8/r7).
3. **`components/library/library-sheet-css.ts`** — tấm Thư viện: badge r5→8 (concentric), thẻ 14 khai ngoại lệ hoặc hạ 20−pad; sizeseg 20→999.
4. **`components/project-init/ProjectInitBoard.tsx`** — bảng khởi tạo: input 9 / btn 10 / tpl 10 → một giá trị `--r-2`.
5. **`components/cad/CadEditor.tsx`** — 17 vi phạm, nhiều panel/overlay chặng 2D.
6. **`components/cad/CadCanvas.tsx`** — 14 vi phạm (tooltip/HUD trên canvas).
7. **Ba panel nổi đồng cấp**: `CommandPalette.tsx:215` (12) · `AccountMenu.tsx:68` (14) · `present-editor/Toolbar.tsx:835` (16) → cùng `--r-3` 14.
8. **`components/tasks/TaskBoardScreen.tsx`** — 12 vi phạm.
9. **`components/present-editor/LayoutShelf.tsx` + `Inspector.tsx` + `Toolbar.tsx`** — thẻ template & toolbar Trình bày (r8/r5 rải).
10. **Vitals**: `StatusBar.tsx:231` pill 999 ✅ giữ làm mẫu; rà `VitalsChatBubble` khi chạm.

## §5 · Cách triển khai (phiếu sau, không thuộc phiếu này)

1. Hoà duyệt §3 → thêm `--r-1..--r-4`, `--r-full` vào globals.css, alias `--radius-sm/md/lg/xl` trỏ về (không phá 62 usage cũ).
2. Sửa theo thứ tự §4, mỗi phiếu 1–2 file, nghiệm thu ảnh 2 theme.
3. Siết `ALLOWED` + bật strict.

## §6 · MOCK Claude Design lệch thang — COWORK-UI sửa khi chạm

787 khai báo off-scale trong 87 mock. Nặng nhất (đếm 5/7/8/13/15/18/24/26px):

| Mock | Off-scale |
|---|---|
| `mock-if-tep.html` | 34 |
| `mock-if-thu-vien.html` | 29 |
| `Tiến độ · Gantt.dc.html` | 26 |
| `Báo giá từ bảng khối lượng.dc.html` | 25 |
| `mock-if-vitals-v2.html` | 24 |
| `mock-2d-ky-thuat_cu.html` · `Bảng món nội thất.dc.html` · `2D Kỹ thuật.dc.html` | 22 mỗi file |
| `Kéo thả.dc.html` | 21 |
| `Thư viện.dc.html` · `Nút tổng.dc.html` | 20 mỗi file |
| `Vitals.dc.html` | 19 |

Luật cho COWORK-UI: mock là hợp đồng (L3) — mock mới PHẢI dùng thang §3a; mock cũ sửa khi
chạm lại màn đó, không mở chiến dịch sửa 87 file.

---
*Đo bằng grep + đọc code thật 12/08. Máy soi: `npm run soi:hinh-hoc` (hiện chế độ báo cáo,
exit 0; `--strict` exit 1 — bật sau khi thang §3 được duyệt).*
