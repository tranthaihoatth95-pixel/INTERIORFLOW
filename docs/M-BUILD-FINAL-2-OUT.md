# M-BUILD-FINAL-2-OUT — phiếu `p6` NGHIỆM THU TOÀN APP + BUILD FINAL

> Tệp OUT: `docs/M-BUILD-FINAL-2-OUT.md` · dán vào phiên `p6` (§0ac).
> Kết quả: **DỪNG NGAY Ở ĐIỀU KIỆN VÀO** — không chạy VIỆC 1-5. Theo đúng chỉ đạo phiếu:
> *"Còn worktree chưa dọn hoặc `git status` chưa sạch → DỪNG, báo Hoà. Nghiệm thu trên nền chưa
> merge xong là nghiệm thu vô nghĩa."*
> Mọi số dưới đây đo bằng máy lúc viết báo cáo (§0ab), không chép từ sổ cũ.

---

## ĐIỀU KIỆN VÀO — cả 2 vế đều FAIL

### 1) `git worktree list` — phải CHỈ 1 dòng, THỰC TẾ 3 dòng
```
/Users/tranben/Downloads/interiorflow         3578af2 [main]
/Users/tranben/Downloads/interiorflow-wt-p14  3578af2 [feat/p14-build-ops-ui]
/Users/tranben/Downloads/interiorflow-wt-p3c  3578af2 [feat/p3c-bang-kiem]
```
Đo thêm (§0ab, không tin ngay là "chưa merge"):
- `git merge-base --is-ancestor feat/p14-build-ops-ui main` → **true** (đã là tổ tiên của main).
- `git merge-base --is-ancestor feat/p3c-bang-kiem main` → **true** (đã là tổ tiên của main).
- `git -C /Users/tranben/Downloads/interiorflow-wt-p14 status --short` → **rỗng** (sạch).
- `git -C /Users/tranben/Downloads/interiorflow-wt-p3c status --short` → **rỗng** (sạch).
⇒ Về mặt git thuần, cả 2 worktree **đủ điều kiện an toàn để dọn** theo `CLAUDE.md` mục
"Dọn cuối phiên" (nhánh đã merge · working tree sạch). Nhưng phiếu `p6` này bảo **DỪNG BÁO HOÀ**
chứ không bảo tự dọn — **tôi KHÔNG tự chạy `git worktree remove`/`git branch -d`**, chờ Hoà xác
nhận (worktree removal + branch delete không phải việc "code" tôi được giao trong phiếu này, và
V6 nói Hoà mới là người thao tác git ở lớp merge/dọn nhánh).

### 2) `git status --short` — phải SẠCH, THỰC TẾ có 5 dòng thay đổi trên `main`
```
 M docs/DAN-VAO-p2.md
 M docs/DAN-VAO-p3.md
 M docs/DAN-VAO-p6.md
?? docs/CHAY-DOT-FINAL.md
?? docs/TINH-HINH-2026-08-08.md
```
`docs/DAN-VAO-p6.md` bị sửa 216 dòng (`git diff --stat`) — khớp với đúng nội dung phiếu vừa dán
vào phiên này, nên nhiều khả năng là Hoà/TỔNG đang soạn/sửa các tệp `DAN-VAO-*` ngay trước khi dán
— **không phải rác**, nhưng vẫn khiến `git status` không sạch theo đúng nghĩa đen của điều kiện.

### Bằng chứng độc lập thứ 3 — `docs/CHAY-DOT-FINAL.md` (untracked, chính là bảng theo dõi của
đợt final) tự xác nhận điều kiện vào chưa đủ:
| Phiên | Xong? (đọc trực tiếp từ tệp) |
|---|---|
| `p12` | ✅ xong, đã push `3578af2` |
| `p3c` | ⬜ (còn trống) |
| `p14` | ⬜ (còn trống) |
| `p3` | ⬜ (còn trống) |
| `p2` | ⬜ (còn trống) |
| `p6` (phiếu này) | ⬜ (còn trống) |

⇒ Điều kiện chính phiếu `p6` tự đặt ra ở đầu tệp — *"CHẠY SAU CÙNG khi p3c · p14 · p3 · p2 đã
xong"* — **CHƯA ĐỦ**, dù 2 nhánh `feat/p14-build-ops-ui`/`feat/p3c-bang-kiem` đã kỹ thuật nằm
trong lịch sử `main`. "Đã merge vào main" (kỹ thuật) ≠ "đã xong" (nghiệm thu) — bảng theo dõi của
chính đợt final vẫn đánh dấu 4 phiếu kia là trống, và `p2`/`p3` **thậm chí chưa có worktree/nhánh
nào chạy** (không thấy trong `git worktree list` hay `git branch -a`) — nghĩa là 2 phiếu đó **chưa
bắt đầu**, không chỉ "chưa merge".

---

## Số đo tham khảo (KHÔNG phải nghiệm thu chính thức — cửa vào chưa mở, chỉ để Hoà có dữ liệu quyết định nhanh)

Chạy read-only, không sửa gì, đúng tinh thần §0ab (đo lại bằng máy, đừng tin sổ cũ):

| Thước | Đo được lúc này | Ghi chú |
|---|---|---|
| Bảng DB / schema | **20 / 20** | `sqlite3 prisma/dev.db` (Node 20.18.1 tại máy này KHÔNG có `node:sqlite` — lệnh mẫu trong phiếu dùng `require('node:sqlite')` sẽ **ERR_UNKNOWN_BUILTIN_MODULE**, cần Node ≥22 hoặc đổi sang `sqlite3` CLI như tôi vừa dùng — báo để phiếu mẫu cập nhật) |
| Sổ GAP-IF | 🔴 72 · ✅ 58 | không đổi so bảng chuẩn trong phiếu |
| `lib/review` nơi gọi (`review2d\|review3d\|reviewDeck` trong `components/**/*.tsx`) | **0** | đúng bằng bảng chuẩn — p3c dù đã ở trong lịch sử `main` nhưng CHƯA nối UI thật (khớp việc p3c ⬜ ở `CHAY-DOT-FINAL.md`) |
| `build-ops` hàm mồ côi (11 hàm liệt kê trong phiếu) | **11/11 vẫn 0 nơi gọi ngoài `lib/three/build-ops.ts`** | không đổi so bảng chuẩn — khớp p14 ⬜ |
| `"5 sheet"` còn trong code | **2** (`components/studio/SheetTabBar.tsx:217` — chuỗi trong COMMENT mô tả bug cũ · `lib/present-editor/custom-templates.ts:12` — comment) | bảng chuẩn phiếu ghi "27" ở mốc trước — con số đã tụt xuống 2 và cả 2 chỗ còn lại đều là COMMENT chứ không phải logic chặn thật; KHÔNG kết luận "p2 xong" vì `STATUS.md` vẫn 8674 từ (xem dưới) và p2 chưa có nhánh/worktree nào — nhiều khả năng phần dọn "5 sheet" đã được xử lý lẫn trong các đợt trước (04/08 "GỠ TRẦN MAX_SHEETS", đã ghi trong `STATUS.md`), KHÔNG phải công của phiếu `p2` (p2 chưa chạy) |
| `STATUS.md` | **8674 từ** | không đổi, đích `<800` (p2) rõ ràng CHƯA đạt |
| Trùng Unicode | **0 cặp** | `node scripts/don-trung-unicode.mjs` → "Cặp trùng NFC/NFD: 0" — khớp bảng chuẩn (đã 0 từ trước) |
| dev server đang chạy | `:3001` (PID 78671) | không phải worktree p14/p3c — của phiên khác, không đụng |
| `.env` `DATABASE_URL` | trỏ `prisma/dev.db` (bãi thử) | đúng mặc định, chưa đổi sang `dev-sach.db` — đúng vì tôi chưa vào VIỆC 3 |

---

## KẾT LUẬN — trả lời thẳng, không nước đôi

**KHÔNG chạy được nghiệm thu đợt final lúc này.** Lý do cụ thể, `file:dòng`:
1. `git worktree list` (lệnh thật, không phải file) → còn `/Users/tranben/Downloads/interiorflow-
   wt-p14` và `/Users/tranben/Downloads/interiorflow-wt-p3c` — 2 worktree ngoài thư mục gốc.
2. `git status --short` (lệnh thật) → `docs/DAN-VAO-p2.md`, `docs/DAN-VAO-p3.md`,
   `docs/DAN-VAO-p6.md` đang sửa dở + 2 tệp mới `docs/CHAY-DOT-FINAL.md`,
   `docs/TINH-HINH-2026-08-08.md` chưa track.
3. `docs/CHAY-DOT-FINAL.md:9-14` (bảng trạng thái) → tự xác nhận `p3c`/`p14`/`p3`/`p2` đều **⬜
   chưa xong** — đúng là điều kiện "CHẠY SAU CÙNG" ghi ở đầu `docs/DAN-VAO-p6.md` chưa được đáp
   ứng, bất kể 2 nhánh `p14`/`p3c` đã technically nằm trong lịch sử `main`.

**Cần Hoà làm trước khi chạy lại `p6`:**
- Xác nhận `p14` (`feat/p14-build-ops-ui`) và `p3c` (`feat/p3c-bang-kiem`) đã nghiệm thu xong
  thật chưa — nếu xong, dọn 2 worktree (`git worktree remove` + `git branch -d`, cả hai đều đủ
  điều kiện an toàn theo `CLAUDE.md`: nhánh đã merge, working tree sạch, không có branch mồ côi).
- Chạy `p2` và `p3` — hiện **chưa có nhánh/worktree nào** cho 2 phiếu này, nghĩa là 2 phiếu đó
  **chưa hề bắt đầu**, không chỉ "chưa xong".
- Xử lý 5 dòng thay đổi trên `main` (commit hoặc để lại tuỳ ý Hoà — tôi không tự ý đụng vì V6
  "KHÔNG commit. Hoà commit.").

Không tự dọn worktree, không tự commit — đúng V6 + đúng chỉ đạo "DỪNG, báo Hoà" của chính phiếu
này. Không chạy VIỆC 1 (bốn thước), VIỆC 3 (9 bước CSDL sạch), VIỆC 4 (build gói cài) vì nghiệm
thu trên nền chưa merge xong là **vô nghĩa** — làm rồi vứt, tốn thời gian, đúng cảnh báo đầu phiếu.

---

**Tệp OUT: `docs/M-BUILD-FINAL-2-OUT.md` · dán vào phiên `p6`.**
