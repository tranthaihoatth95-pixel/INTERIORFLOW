# BÁO CÁO G4 — Kệ Thư viện chặng 2 (Thư viện = sheet kính trượt lên)

> Worktree `~/Downloads/interiorflow-g4`, nhánh `nhanh-g4`. Bước "G4 · Kệ Thư viện chặng 2" trong
> `docs/TICKET-CHANG2-BUILD-2026-08-02.md` — ticket ghi ⏸ *chờ chốt 3 câu*, nhưng 3 câu ĐÃ CHỐT
> 02/08 (`SPEC-STAGE-LIBRARIES.md` mục "✅ 3 điểm — CHỐT 02/08") ⇒ mở khoá, đã làm.

## Đã kiểm trước khi code (L1 — `LUAT-GIAO-DIEN-BAT-BUOC.md`)

- `git merge main` trước (lấy `mock-if-3chang.html` + `StageShell` mới) — sạch, không conflict.
- Đọc: `SPEC-STAGE-LIBRARIES.md` (kệ theo chặng · 3 động tác · 4 mức phạm vi) ·
  `PLAN-LIBRARY-GATEWAY.md` **mục 0 đọc kỹ, 5 chỗ xung đột** · `SPEC-NAVIGATION-MODEL.md` §1 ·
  `SPEC-HOVER-FOCUS-IDF.md` §2 · `docs/mocks/mock-if-3chang.html` (khối THƯ VIỆN, port nguyên văn).
- `ls components/library/` (9 component sẵn) + `lib/library/` (3 file sẵn) — TÁI DÙNG
  `PublishModal` · `LibraryToast` · `local-state` thay vì viết lại.
- Kiểm TỪNG biến token mock cần trong `app/globals.css`: `--mat-card` `--blur-strong`
  `--shadow-sheet` `--mat-overlay` `--mat-hairline` `--border-strong` `--accent-warm`
  `--accent-strong` `--field` `--hover` `--radius-*` `--fw-semi` `--ease-apple` `--dur-base`
  → **có thật, dùng thẳng**. Thiếu đúng 2 thứ: `--fs-2xs` và class `.mat-sheet` ⇒ khai trong
  phạm vi sheet (`.if-lib-root`), KHÔNG sửa `globals.css` (ngoài vùng code G4).

## 4 commit

| # | Commit | Nội dung |
|---|---|---|
| 1 | `8e04f85` | `lib/library/shelves.ts` (cấu trúc kệ 2 nhóm + 4 mức phạm vi) · `use-library-sheet.ts` (một cửa vào duy nhất) |
| 2 | (sheet) | `library-sheet-css.ts` port nguyên văn + `LibrarySheet.tsx` + mount ở `/library` để nghiệm thu |
| 3 | `1ac485b` | `BulkIngestMode.tsx` — "Nạp hàng loạt" thành 1 CHẾ ĐỘ của sheet |
| 4 | (báo cáo) | File này |

## Đối chiếu yêu cầu

| # | Yêu cầu | Trạng thái |
|---|---|---|
| 1 | Sheet kính TRƯỢT LÊN từ đáy, không panel hẹp/trang riêng · Esc + bấm ngoài đóng · port `.lib/.scrim/.shelf/.chips/.grid` · `.mat-sheet` blur-strong · `--shadow-sheet` · bo `--radius-xl` 2 góc trên | ✅ Đo DOM thật: đóng `top=900`, mở `top=340 height=560` = đúng `min(560px,74vh)`; `width=980` = `min(980px,94vw)` |
| 2 | Kệ trái 2 nhóm — nhóm trên đổi theo chặng, nhóm dưới kệ chung | ✅ Đọc DOM ở `?stage=cad`: caption `Kệ chặng Vẽ` → Ký hiệu·khối 46 · Template bản vẽ 12 · Template phòng 9 · Hatch·vật liệu 2D 31 · Form lập luận 6; caption `Kệ chung` → ATLAS 1449 · Bộ nhận diện 3 · Ảnh & tài sản 218 · Phông·màu·nền 14 |
| 3 | Chip lọc 4 mức phạm vi (+ Tất cả · Gần đây) · badge phạm vi ở góc thumbnail | ✅ Lọc THẬT, không phải trang trí: Tất cả→12 món (4 loại badge), Chung→3 (chỉ CHUNG), Studio→3 (chỉ STUDIO), Dự án này→3 (chỉ DỰ ÁN) |
| 4 | 3 động tác: kéo=bản làm việc · áp=preset · publish CÓ CHỦ DUYỆT · nút "Đưa lên kệ" chân sheet | ✅ Vật liệu/hatch/preset = **áp**, còn lại = **kéo** (`APPLY_SHELVES`). Publish qua `PublishModal` sẵn có → hàng chờ duyệt, KHÔNG tự lên kệ chung |
| 5 | Một cửa vào duy nhất (nút Navigator mọi chặng · ô Vật liệu Inspector · phím tắt) | ⚠️ Hàm `openLibrarySheet()` + phím tắt **L**/Esc đã xong và verify. Nút ở Navigator/Inspector **chưa gắn được** — `components/studio/*` ngoài vùng code G4. Xem "Cần CHINH" bên dưới |
| 6 | Gộp `/library/ingest` thành 1 chế độ của sheet | 🟡 Làm phần LÕI (segmented "Duyệt kho \| Nạp hàng loạt" trong sheet). **DỪNG** trước phần đụng kiến trúc — xem mục ⛔ |

## ⛔ ĐÃ DỪNG — chỗ đụng `PLAN-LIBRARY-GATEWAY` mục 0.1, cần Hoà quyết

**Sự thật kiểm được:** `[+]` popover VÀ link `/library/ingest` **cùng nằm trong
`components/LibraryPanel.tsx`** (dòng 60 và 235–240) — file này **ngoài vùng code G4**
(`components/library/*` là thư mục con khác). Nên gộp trọn NT1 sẽ phải: xoá popover `[+]` +
đổi/xoá route `/library/ingest` + sửa `LibraryPanel.tsx` — đúng chỗ mục 0.1 gọi là *"đảo ngược
kiến trúc vừa chốt tháng 7, không phải xây tiếp"*.

**Mâu thuẫn tài liệu cần Hoà gỡ** (báo thẳng, không tự chọn):
- Mục 0.1 (viết 28/07 sáng) cảnh báo BỎ popover là đảo ngược ⇒ *"cần Hoà xác nhận"*.
- Nhưng **cuối chính file đó**, mục "Câu hỏi cần Hoà quyết — ĐÃ CHỐT 28/07" câu 1 ghi:
  > **CHỐT: BỎ HẲN, đúng NT1.** Không giữ, không thêm mục… tự chuyển sang chế độ "nạp hàng loạt"
  > TRONG CÙNG PANEL, không hỏi người dùng.
- Tức **cảnh báo mục 0 đã cũ hơn quyết định ở cuối file**. Ticket 02/08 lại nhắc cảnh báo cũ.

**Đã chọn đường an toàn:** làm phần additive trong vùng G4 (chế độ "Nạp hàng loạt" trong sheet),
**KHÔNG** đụng `LibraryPanel.tsx`, **KHÔNG** xoá `/library/ingest`. Không có gì gãy; bỏ phần thừa
sau này chỉ là xoá, không phải làm lại.

**3 việc còn lại chờ Hoà gật** (làm được ngay khi có lệnh):
1. Xoá popover `[+]` trong `components/LibraryPanel.tsx`, thay bằng thả tệp → tự nhận (đúng NT1).
2. `/library/ingest` → chuyển hẳn vào sheet, route cũ redirect (giữ bookmark) hoặc xoá.
3. Chuyển nốt bộ nâng cao của trang ingest (chưng cất manifest · AI Content Strategist) vào chế độ
   sheet — hiện **vẫn ở trang cũ**, chưa gộp, để không phải bê 371 dòng khi hướng còn chưa chốt.

## Cần CHINH — 1 dòng, ngoài vùng code G4

Sheet phải sống ở `StageShell` để có mặt ở **mọi chặng, cùng chỗ** (yêu cầu #5). Hiện mount tạm ở
`/library` để chạy/nghiệm thu được thật.

```tsx
// components/studio/StageShell.tsx
import { LibrarySheet } from '@/components/library/LibrarySheet';
// …trong JSX, sau {children}:
<LibrarySheet stage={active === 'cad' ? 'cad' : active === 'present' ? 'present' : 'render'} />
```

Nút "Thư viện" ở Navigator + ô Vật liệu trong Inspector chỉ cần gọi:

```tsx
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
onClick={() => openLibrarySheet()}                          // nút Navigator
onClick={() => openLibrarySheet({ shelfId: 'render-mat' })} // ô Vật liệu → mở thẳng kệ Vật liệu
```

Canvas nhận món kéo ra / preset áp vào bằng 2 sự kiện (đã phát, chưa ai nghe):
`if:library-instantiate` (detail = `SheetItem`, tạo BẢN LÀM VIỆC) · `if:library-apply`
(detail = `SheetItem`, áp preset lên vật đang chọn).

## Nghiệm thu

`tsc --noEmit` **0 lỗi** · `next lint` sạch vùng `components/library` + `lib/library` +
`app/library` (2 cảnh báo `no-img-element` còn lại là của `ingest/page.tsx` cũ, không thuộc việc
này) · `npm test` **exit 0**.

Verify browser thật 1440×900, **kiểm Tối trước** (Tối là mặc định app) rồi Sáng — console sạch:

| Kiểm | Kết quả |
|---|---|
| Sheet trượt lên/xuống | đo DOM: `top 900 → 340`, `height 560`, `width 980` |
| Phím tắt `L` | mở (`data-open=false→true`) |
| `Esc` | đóng (`true→false`), nghe ở pha bắt nên ô tìm kiếm trong sheet không nuốt phím |
| Kệ theo chặng | `?stage=cad` ra đúng 5 kệ chặng Vẽ + 4 kệ chung (đọc DOM, không nhìn ảnh) |
| Chip phạm vi | lọc thật — Chung/Studio/Dự án mỗi loại 3 món, badge khớp 1-1 |
| Nạp hàng loạt | 3 tệp → nhận đúng `Bản vẽ`/`Ảnh`/`Bảng tính`, chân sheet "3 tệp sẵn sàng" |
| Bàn phím | 32 phần tử focus được trong sheet; khi đóng đặt `inert` để Tab không chui vào sheet vô hình |
| 2 theme | Tối + Sáng đều đọc được (badge STUDIO dùng `--accent-warm` như mock) |

## Quyết định tự chọn khi gặp mơ hồ

1. **`body.lib` → `data-open`**: mock bật/tắt bằng class trên `<body>`; ở React ghi class lên
   `<body>` từ component dễ rò khi unmount ⇒ dùng thuộc tính trên chính 2 phần tử. Giá trị CSS y hệt.
2. **Món cho kệ KHÔNG phải kệ mặc định**: mock chỉ vẽ kệ mặc định (12 món/chặng, đã chép nguyên
   văn). Các kệ còn lại không có vật mẫu ⇒ đặt 2–3 món đúng nghĩa từng kệ, **đánh dấu rõ là mock**
   trong `shelves.ts`, để bấm vào kệ không thấy trống.
3. **Số đếm trên kệ** (46/12/9/31/6…) giữ nguyên số của mock — là số kho mock, chưa nối
   `/api/library`/ATLAS thật; đã ghi cảnh báo ở đầu `shelves.ts`.

## Đề xuất 3 việc tiếp theo

1. Hoà gỡ mâu thuẫn mục ⛔ → làm nốt 3 việc gộp ingest (đã liệt kê, làm được ngay).
2. CHINH gắn 1 dòng `<LibrarySheet/>` vào `StageShell` + nút Navigator/ô Vật liệu → đóng yêu cầu #5.
3. Nối `if:library-instantiate` / `if:library-apply` vào canvas thật (Render node · CAD block ·
   Present trang) — hiện mới phát sự kiện + toast, chưa có ai tiêu thụ.
