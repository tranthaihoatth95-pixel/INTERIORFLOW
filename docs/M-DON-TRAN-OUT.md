# M-DON-TRAN-OUT — phiếu p2 · dọn trần "5 sheet" + cắt STATUS.md + thống nhất thước đếm (08/08)

Chạy trong **worktree riêng** `interiorflow-wt-p2` (nhánh `feat/p2-don-tran-sheet`, tách từ
`3578af2`) — đúng chỉ dẫn cuối phiếu; các phiên khác chưa thấy bản STATUS gọn cho tới khi Hoà merge.
Luật: V6 KHÔNG commit · §0u chỉ ghi tệp này · §0ab đo lại mọi số · N1/N5/N8.

---

## VIỆC 1 — trần "5 sheet": đo lại KHỚP phiếu, việc thật đúng 2 dòng comment

**Đo lại 08/08 trong worktree (§0ab):**

| Phép đo | Kết quả |
|---|---|
| `MAX_SHEETS` trong code | **0 hằng số sống** — chỉ 2 COMMENT tự khai "đã gỡ" (`lib/cad/model.ts:1316` · `lib/cad/sheet-migrate.ts:7`) — khớp phiếu |
| "5 sheet"/"trần 5" trong `.ts/.tsx` | 2 chỗ cần sửa lời + 4 comment "trần 5 ĐÃ GỠ" (tự khai đúng hiện trạng, giữ: `PresentSheets.tsx:12,282,502,588`) + 2 chỗ KHÔNG liên quan sheet (`GenerateFlow.tsx:88` trần 5 ẢNH reference — nghiệp vụ khác · `vitals-context.test.ts:184` trần 5 mục vi phạm) |
| Lệnh tìm chặn ẩn (nguyên văn lệnh phiếu) | **0 chặn thật** — ra đúng 3 nhóm: `SheetTabBar.tsx:80` `sheets.length > 1` (quyết định nút Đóng — nghiệp vụ) · `lib/sheets-persist.ts:81` + `lib/present-editor/project-doc.ts:64` `sheets.length > 0` (kiểm bản ghi rỗng) · 2 comment `MAX_SHEETS` nói trên. Khớp kết quả TỔNG |
| "5 sheet" trong `docs/` | KHÔNG đụng dòng nào (biên bản — đúng ⛔ của phiếu) |

**2 dòng đã sửa (bảng 3 cột):**

| `file:dòng` | Trước | Sau |
|---|---|---|
| `components/studio/SheetTabBar.tsx:217` | comment nói mẫu "1/5" *"thật ra là sheet 1 / trần 5 sheet"* — đọc như trần vẫn còn | Viết rõ đó là trần CŨ **đã gỡ hẳn D2 đợt 8 (04/08), nay không giới hạn**; prop `max` chỉ còn cho ca bên gọi tự đặt trần riêng, mặc định chỉ đếm |
| `lib/present-editor/custom-templates.ts:12` | docstring *"Slot hoá (đơn giản, đủ dùng cho deck ≤5 sheet)"* | Đã ĐỌC thuật toán trước khi sửa: slot-hoá chạy **theo TỪNG SLIDE**, không nhìn thấy và không phụ thuộc số sheet của deck (toàn bộ logic là ghi đè text role / ảnh / nhuộm màu trên MỘT slide — `custom-templates.ts:12-24`) ⇒ câu "≤5 sheet" là tàn dư thời còn trần, KHÔNG phải giới hạn thuật toán. Sửa lời: thuật toán đơn giản chạy theo từng slide, trần đã gỡ, đây không phải trần sản phẩm |

## VIỆC 2 — cắt STATUS.md (việc chính)

| | TRƯỚC | SAU |
|---|---|---|
| `wc -w STATUS.md` | **8.674 từ** (586 dòng) | **796 từ** (79 dòng) — DƯỚI trần 800 |

**Cách cắt — 0 rủi ro mất chữ:** toàn bộ bản cũ chép **NGUYÊN VĂN** vào `CHANGELOG.md` mục mới
"08/08 — DỌN STATUS.md" (bọc `<details>` cho đỡ choáng khi mở file; CHANGELOG 20.733 → 29.471 từ,
**chỉ ghi thêm, không đè dòng cũ nào** — đầu mục có ghi chú nguồn theo đúng tiền lệ mục 02/08
"Dời từ STATUS.md"). Bản STATUS mới giữ đúng 4 mục phiếu yêu cầu (đang chạy · vừa xong · worktree
đang mở · việc kế tiếp) + 3 mục sống (lời dặn còn hiệu lực · chờ Hoà quyết · quy tắc session).

**Danh sách dòng GIỮ LẠI vì còn hiệu lực** (mục "🔴 LỜI DẶN CÒN HIỆU LỰC" + rải trong 4 mục):
1. "G-M3-15 (54 block) chừa cho p2 — không đụng, tầng dữ liệu ngăn Cấu kiện sẵn chỗ" (ví dụ phiếu nêu — giữ nguyên văn).
2. Bẫy hydrate `useFlowStore.hydrate()` chỉ chạy từ HomeScreen (đã có hậu quả thật — nút BOQ).
3. `findHatchBoundary` treo >2 phút (TECH-DEBT) · `tsc` phải chạy nền.
4. Scratch chờ Hoà rm: `app/dev-bench-3d-2/page.tsx` (đo lại: còn trên đĩa; `tsconfig.scoped.json` ĐÃ dọn — đo `ls` ra không còn, STATUS mới ghi đúng hiện trạng).
5. Luật `*-css.ts` cấm backtick trong comment · cấm stash/checkout khi chung working tree.
6. VIỆC 4-6 p14 còn treo + cảnh báo `ad2d23b` cuốn bản giữa chừng (đo `git log --all` — commit có thật).
7. Chờ Hoà quyết: DWG §11d · kind `preset` · kênh liên hệ GPL · Pantone · 5 ảnh covers · filter-repo · 4.1.f · BOQ ĐỢT 3.
8. Toàn bộ 5 quy tắc session (cập nhật #4-5 theo hiện trạng worktree-per-phiếu thay câu "hai phiên chung .git" đã lỗi thời).

**Đã đo lại trước khi ghi (§0ab), sửa 2 chỗ STATUS cũ nói sai hiện trạng:**
- Mục "Worktree đang mở" cũ ghi `interiorflow-g4` (dirty + server 3004) — `git worktree list` 08/08
  ra: `main · wt-p14 · wt-p3c · wt-p2`, **không còn g4** → STATUS mới ghi danh sách thật + 1 dòng
  đánh dấu ghi chú cũ lỗi thời (bản đầy đủ vẫn nằm nguyên văn trong CHANGELOG).
- `tsconfig.scoped.json` cũ ghi "kẹt chờ Hoà rm" — nay đã biến mất khỏi đĩa → ghi "ĐÃ dọn".

**Không chắc → giữ:** không có dòng nào rơi vào diện "không chắc" phải treo cho TỔNG — mọi dòng
lịch sử đều còn nguyên văn trong CHANGELOG nên quyết sai vẫn lùi được (KS4).

## VIỆC 3 — hai thước đếm: KHÔNG lệch tiêu chí, lệch THỜI ĐIỂM chụp

**Đọc `scripts/soi-app.py` (170 dòng):**
- Flow mồ côi = `select count(*) from Flow where projectId is null` / `count(*) from Flow` (`soi-app.py:63-64`).
- Mã đỏ = đếm dòng bảng bắt đầu `| G-` trong `docs/GAP-IF.md` có chứa 🔴 (`soi-app.py:32-41`).

**Chạy CẢ HAI thước trên CÙNG dữ liệu, cùng lúc (08/08):**

| Thước | Flow mồ côi | Mã đỏ |
|---|---|---|
| `python3 scripts/soi-app.py` | **45/46** | **72**/157 |
| Đo tay (`sqlite3` + `grep '^| G-' \| grep -c 🔴`) | **45/46** | **72** |

⇒ **KHỚP TUYỆT ĐỐI.** Hai con số trong phiếu (43/43 · 75/107 vs 45/46 · 72) là **hai ảnh chụp ở
hai thời điểm khác nhau** của cùng một thước: giữa hai lần đo, DB đổi (commit `3578af2` "bịt đường
đẻ flow mồ côi + CSDL sạch" đụng đúng bảng Flow) và `GAP-IF.md` được TỔNG cập nhật (107→157 dòng,
75→72 đỏ). Kiểm thêm mối nghi "mồ côi kiểu dangling FK": `Flow.projectId trỏ Project không tồn
tại` = **0** — định nghĩa `projectId is null` của soi-app hiện không bỏ sót ca nào.

**Chọn chuẩn:** `soi-app.py` làm thước chuẩn (đếm theo dòng bảng `| G-` — đúng đơn vị "một mã một
dòng sổ"). Hai lưu ý ghi lại để thước không lệch về sau, KHÔNG cần sửa code ngay:
1. Đo tay phải dùng đúng công thức `grep '^| G-' docs/GAP-IF.md | grep -c '🔴'` — `grep -c '🔴'`
   trần sẽ lệch ngay khi có dòng chú thích chứa 🔴 ngoài bảng (hôm nay ngoài bảng = 0 nên hai cách
   tình cờ bằng nhau).
2. `soi-app.py:39-41` xếp trạng thái theo emoji ĐẦU TIÊN tìm thấy trong thứ tự `🔴✅🟡🟠⚪` — dòng
   chứa nhiều emoji sẽ được tính là 🔴 (thiên về báo đỏ, an toàn). Cố ý hay không thì hành vi này
   hợp lý — ghi nhận, không đổi.
3. Không xoá/sửa `soi-app.py` (đúng ⚠️ phiếu — nó không sai).

## CỬA KIỂM (chạy trong worktree, sau mọi sửa đổi — số cuối, đã chạy xong)

```
npx tsc --noEmit -p .        → EXIT 0 · 0 dòng lỗi
node scripts/check-chot.mjs  → EXIT 0 · 9 luật · 🔴 0 · 🟡 0
npm test                     → EXIT 0 · 6.383 dòng ok · 0 fail
```

### ⚠️ BÀI HỌC WORKTREE MỚI — 3 thứ gitignored phải tự dựng, ghi cho mọi phiên worktree sau

`npm test` lần đầu trong worktree ĐỎ (3 tệp `lib/server/*.test.ts` mới của `3578af2` ném
`PrismaClientInitializationError: Environment variable not found: DATABASE_URL`) — **không phải
lỗi của phiếu này**, là worktree mới thiếu 3 thứ gitignored:
1. `prisma/dev.db` — dựng bằng đúng cách luật cho phép:
   `sqlite3 <cây-chính>/prisma/dev.db ".backup '<worktree>/prisma/dev.db'"` (KHÔNG `cp`).
2. `.env` / `.env.local` — chép tay từ cây chính.
3. **Bẫy kín nhất**: `npm install` chạy `prisma generate` TRƯỚC khi có `.env` ⇒ client sinh ra
   **không ghi `schemaEnvPath`** (so bằng `grep '"schemaEnvPath"' node_modules/.prisma/client/index.js`:
   cây chính có `"../../../.env"`, worktree không có) ⇒ runtime không bao giờ tự nạp `.env`,
   test DB đỏ dù `.env` đã nằm đúng chỗ. Chữa: `npx prisma generate` chạy LẠI sau khi đã có
   `.env` (generate không phải push/migrate — không đụng luật sandbox).
⇒ Đề nghị TỔNG cân nhắc thêm 3 bước này vào khối "TRƯỚC KHI BẮT ĐẦU — mở worktree riêng" của
mẫu phiếu (sau `npm install`).

## File đã sửa (V6 — Hoà commit, tất cả trong worktree `interiorflow-wt-p2`)
```
STATUS.md                                    (586 dòng/8.674 từ → 79 dòng/796 từ)
CHANGELOG.md                                 (append nguyên văn bản STATUS cũ — mục 08/08)
components/studio/SheetTabBar.tsx            (1 comment — VIỆC 1)
lib/present-editor/custom-templates.ts       (1 docstring — VIỆC 1)
docs/M-DON-TRAN-OUT.md                       (tệp này)
```

## CHƯA VERIFY (N5)
- 3 lệnh cửa kiểm đang chạy nền tại thời điểm soạn báo cáo — kết quả cuối dán ở mục CỬA KIỂM
  (nếu lệch sẽ đính chính ngay trong báo cáo phiên).
- Không dựng dev server 3014 như khối lệnh cuối phiếu: phiếu này chỉ đổi markdown + 2 comment,
  không có gì quan sát được trên browser — không đốt cổng vô ích (một thư mục = MỘT dev server).

Tệp OUT: `docs/M-DON-TRAN-OUT.md` · dán vào phiên `p2`
