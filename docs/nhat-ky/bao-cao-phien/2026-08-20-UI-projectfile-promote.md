# 2026-08-20 — UI ProjectFile → Promote → Library (khu "Tệp nguồn dự án")

## ⓪ Tiền đề — đã kiểm, ĐÚNG (có một chỗ phiếu mô tả SAI, đã đi theo code)
- `git log --oneline -1` = `c7f3ac8` (main) ✓. Không chạy git nào khác, không restart server, không đụng prisma.
- API live ✓ — nhưng **phiếu ghi "POST multipart" là SAI**: đọc code `app/api/project-files/route.ts:53-64` thì POST nhận **JSON `{projectId, name, dataUrl|url}`** (dataUrl và url loại trừ nhau). UI viết theo code, không theo mô tả — đúng lời dặn "đừng tin mô tả tôi".
- Không dedupe hash ✓ (`lib/server/promote.ts:16-27` khai thẳng) — UI không tự chế dedupe.

## ① Việc đã làm — file:dòng
| File | Gì |
|---|---|
| `components/filemanager/tep-nguon.ts` (MỚI, thuần) | usages hiển thị · `usageMacDinh` (PDF→brief) · `loaiTep` · `kiemKichThuoc` 25MB fail-fast · `lyDoChuaGui` (human gate) · `nhanKetQua` (daCo ↔ mới) |
| `components/filemanager/tep-nguon.test.ts` (MỚI) | **DRIFT-GUARD** import cả `lib/server/library-save` + `lib/server/promote`: USAGE_LIST ≡ `LIBRARY_USAGES`, trần ≡ `LIBRARY_MAX_BYTES`, `usageMacDinh` ≡ `usageTuMime` cho 7 mime — server đổi mà client quên là test đỏ |
| `components/filemanager/TepNguonDuAn.tsx` (MỚI) | khu Tệp nguồn dự án: list GET `?projectId=` · upload (input + drop, dataUrl JSON) · preview · checkbox "Đã xem" · dropdown usage + note → promote · xoá mềm có confirm · mọi trạng thái loading/empty/error thật |
| `app/files/page.tsx` | mount `<TepNguonDuAn/>` TRÊN `FileManagerShell` trong ngăn ① *Tệp dự án* (không route mới — EXTEND `/files` đúng NO-REBUILD) |
| `components/library/LibrarySheet.tsx` (~:300) | +1 `useEffect` nghe event `window` **`if:library-db-refresh`** → gọi `refreshDb()` sẵn có của `useLibraryDbItems` (cache theo phiên, thiếu tín hiệu là kệ bày bản cũ). Cùng khuôn event `if:navigator-toggle`, KHÔNG store mới |

Quyết định thiết kế đáng ghi:
- **projectId**: đọc `useFlowStore(s => s.currentProjectId)` (đúng khuôn `LibrarySheet.tsx:381`); vào thẳng `/files` (store null) thì `<select>` chọn từ `fetchFlows()` (API thật `/api/flows`) — chọn là state cục bộ, **không ghi ngược store** (currentProjectId còn điều khiển điều hướng, `lib/store.ts:107`).
- **Review tối thiểu = checkbox "Đã xem"** (human gate, đúng phạm vi phiếu — không chế engine). Chưa tick thì nút Promote đi đường `aria-disabled` + `aria-describedby` → phần tử `.if-tooltip-a11y` mang lý do; độ mờ = token `--mo-vo-hieu` (đo runtime 0.62 theme sáng). Không `title`, không opacity gõ số.
- **Preview nói thật giới hạn**: `ProjectFile` KHÔNG có route đọc nội dung (chỉ `/api/library/[id]/file` cho asset đã promote). Ảnh thật hiện cho ① tệp vừa upload trong phiên (dataUrl còn trong bộ nhớ) ② tệp đã promote (đọc qua asset url). Tệp cũ chưa promote = badge loại tệp, không giả vờ (cùng luật `FileThumb`).
- 415/413: hiện **nguyên văn** `error` server trả (đã verify chuỗi sniff magic-bytes lộ đủ trên UI).
- daCo: nút bấm lại vẫn bấm được, kết quả đổi thành "Đã có trong Thư viện — không nhân bản" — không báo lỗi giả.

## ② Vì sao có 3 hằng số "chép" từ lib/server (nói thẳng, có khoá máy)
`LIBRARY_USAGES`/`LIBRARY_MAX_BYTES`/`usageTuMime` nằm trong module import `fs/promises` + PrismaClient top-level (`library-save.ts:10-12`, `promote.ts:42`) ⇒ client component import vào là vỡ bundle Next; `lib/server/**` là vùng cấm sửa nên không tách được. ⇒ Khai lại phía client + **drift-guard test** khoá đồng bộ (chạy pass). Đây là REUSE-qua-máy-canh, không phải chép-rồi-quên.

## ③ Verify máy
- `npx tsc --noEmit` → **0 lỗi**.
- `tep-nguon.test.ts` PASS (drift-guard + biên 25MB + gate + nhãn daCo) · `ngan-tho.test.ts` 25 pass (không regress ngăn thô) · `lib/server/promote.test.ts` 16 assertions PASS (backend nguyên vẹn, tự dọn đĩa sạch).

## ④ Verify BROWSER THẬT (:3001, đã đăng nhập sẵn, click thật)
Số đo trước khi thử: LibraryAsset **1613** · ProjectFile 0 · ProjectAssetUsage 0 (sqlite đo tại nguồn).
1. `/files` → khu hiện, store không có dự án → select nạp 2 dự án thật; chọn "Dự án mới" → GET chạy, empty-state đúng chữ.
2. Upload PNG 64×64 tự tạo (`thu-nghiem-ui.png`, qua input change thật) → POST 200, hàng hiện với **ảnh thật** (dataUrl phiên), mime `image/png`.
3. Nút Promote khi chưa tick: `aria-disabled="true"`, `aria-describedby` → *"Xem tệp rồi đánh dấu 'Đã xem'…"*, opacity 0.62; **click không bắn request nào** (network log rỗng).
4. Tick "Đã xem" → click → `POST /api/project-files/…/promote → 200`, badge "Đã vào Thư viện ✓". **Click lần 2** → "Đã có trong Thư viện — không nhân bản"; DB: LibraryAsset **1614 (+1 đúng, không nhân bản)**, usage 1 hàng `ref-render` đúng projectId, tag `nguon:projectfile:<id>` đúng khuôn.
5. Phím L mở LibrarySheet → kệ **Ảnh & tài sản** → `thu-nghiem-ui.png` (LIB-RWG0VP) đứng ĐẦU lưới, ảnh thật qua `/api/library/<id>/file`.
6. **Vòng refresh**: đóng sheet (cache dbLoaded đã true) → upload + promote tệp #2 (`thu-nghiem-refresh.png`) → mở lại sheet → **thấy cả hai** ⇒ event `if:library-db-refresh` → `refreshDb()` chạy thật (không có nó thì cache phiên bày bản cũ).
7. **415**: upload `ghi-chu.txt` → alert hiện nguyên văn *"Loại file chưa nhận được — v0 chỉ nhận PNG/JPEG/WEBP/GIF/AVIF/PDF…"*.
8. **Xoá mềm**: bấm Xoá 2 tệp thử (confirm mock =true cho headless) → DELETE 200, hàng biến mất, DB `deletedAt` set.
9. **DỌN SẠCH**: hard-delete 2 LibraryAsset thử + 2 usage + 2 ProjectFile qua sqlite, xoá 2 file `uploads/` → đếm sau = **1613 / 0 / 0**, khớp trước từng con số.

## ⑤ Cố ý KHÔNG làm — và vì sao
- Không route/trang mới, không đụng `app/api/**`, `lib/server/**`, schema, `--accent*`, globals.css (vùng cấm).
- Không dedupe client (human gate riêng, phiếu cấm chờ).
- Không preview ảnh thật cho tệp cũ chưa promote — cần route đọc nội dung ProjectFile = việc `app/api/**`, ngoài vùng. Ghi làm nợ.
- Không dùng `ToolbarChip` cho nút Promote: chip là khuôn icon-toolbar; ở đây là nút chữ trong form — lấy đúng **cơ chế** (aria-disabled + describedby + token mờ) thay vì ép vỏ.
- Không persist trạng thái "Đã xem" (state phiên): gate là hành vi xem-tại-chỗ, persist nó thành cờ dữ liệu là đẻ schema ngầm phía client.

## ⑦b CHƯA CHẮC / CHƯA KIỂM
- **Upload trong browser-verify đi qua `input.dispatchEvent(change)` + `DataTransfer` JS**, không phải hộp thoại chọn file của OS (headless không mở được) — handler React là THẬT nhưng cú click-chọn-file bằng tay chưa ai bấm. Kéo-thả (onDrop) cũng mới kiểm bằng code-path input, chưa kéo chuột thật.
- `window.confirm` khi xoá: dialog thật chưa nhìn bằng mắt (headless mock true) — khuôn giống hệt `FileManagerShell.handleDeleteMany` nên rủi ro thấp.
- Chỉ đo Chromium (pane trình duyệt) · theme sáng; theme tối chưa soi mắt (toàn token nên rủi ro chủ yếu là tương phản badge).
- Tệp PDF chưa upload thử trên browser (chỉ PNG + txt); nhánh `usageMacDinh('application/pdf')→brief` có test thuần + drift-guard.
- Danh sách dự án lấy từ `/api/flows` — user không có quyền 'bim' trên dự án chọn sẽ ăn 403 từ server (hiện nguyên văn), chưa dựng ca này.

## ⑦c HẠN DÙNG
- Kết luận đúng tại `c7f3ac8` + tree dirty 20/08. Nếu `LIBRARY_USAGES`/trần bytes/`usageTuMime` đổi → drift-guard tự đỏ (đó là chủ ý). Nếu ProjectFile mọc route đọc nội dung → gỡ giới hạn preview ở docstring `TepNguonDuAn.tsx`. Nếu LibrarySheet đổi nguồn dữ liệu khỏi `useLibraryDbItems` → event `if:library-db-refresh` cần nối lại.
