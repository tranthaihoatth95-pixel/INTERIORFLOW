# WT-CHOT · CHỐT MỘT ĐƯỜNG WORKTREE — 17/08

**Phiên**: WT-CHOT (phiên phụ, T điều phối)
**Cây**: cây chính `/Users/tranben/Downloads/interiorflow` (KHÔNG worktree)
**HEAD**: `3d36277 docs(phieu): 4 phiếu đợt A — Collab lõi/vỏ · gỡ đồng · chốt worktree`
**Lệch main**: 0 · working tree clean lúc bắt đầu

---

## ⓪b TIỀN ĐỀ HẠ TẦNG — PASS
`git log -1` = `3d36277` · `rev-list --count HEAD..main` = 0 · `pwd` đúng cây chính · `git worktree list` cho thấy 2 worktree đang sống ở `.claude/worktrees/agent-*` (2 phiên phụ khác chạy song song).

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — ĐÍNH CHÍNH BỀ MẶT PHIẾU

**Ba giả định phiếu, kiểm bằng số:**

| Giả định | Đo được | Kết luận |
|---|---|---|
| pattern `interiorflow-wt-*` chưa dùng lần nào | 20+ dòng trong docs/CHAY-DOT-FINAL, docs/PHIEU-FINAL-2026-08-08, CHANGELOG | 🔴 **SAI** — DÙNG THẬT hồi 08/08, nhưng đó là NHẬT KÝ đã đóng; theo luật `IF-KIEN-TRUC` §4/CLAUDE.md không sửa nhật ký. Chỉ xoá pattern khỏi **luật đang sống** (CLAUDE.md), không đụng docs lịch sử |
| `launch.json` p3mock trỏ đường không tồn tại | `.worktrees/p3-mock` không có (ls trả rỗng) | ✅ đúng — gỡ entry |
| còn máy soi mắc bug cùng loại | grep `worktree` scripts/*.mjs 10 tệp | ⚠️ **ĐÚNG mà cũng SAI** — 5 tệp có `SKIP({'.worktrees'})` chỉ khớp nguyên văn, nhưng chúng walk-từ-scan-dirs (`lib/`, `components/`, `app/`, `docs/`, `styles/`) chứ không walk-từ-ROOT ⇒ **không thực sự chạm `.claude/worktrees/`** ⇒ dead code, không phải bug thật |

**Không bác phiếu** — mục tiêu chốt MỘT đường vẫn đúng, chỉ đọc lại tiền đề.

---

## ①-④ THI HÀNH — 4 sửa, đúng vùng phiếu

### 1) `CLAUDE.md` — xoá luật pattern `interiorflow-wt-*` cũ, ghim luật MỘT đường mới
- Dòng 14 cũ: *"Mỗi worktree PHẢI đặt tên theo pattern: `interiorflow-wt-{tên-nhánh}` …"* → thay bằng **MỘT đường duy nhất `.claude/worktrees/`** + giải thích chỗ đặt sinh ra 9 máy soi/tool khớp
- Dòng 26 cũ: `git worktree remove interiorflow-wt-{tên}` → `git worktree remove .claude/worktrees/{tên}`
- Dòng 32 cũ: *"Kiểm ~/Downloads không có folder `interiorflow-*` rác"* → *"Kiểm `.claude/worktrees/` không còn `agent-*` mồ côi"*

### 2) `.claude/launch.json` — gỡ entry `interiorflow-p3mock-worktree`
Entry trỏ `.worktrees/p3-mock` (đường không tồn tại 8+ ngày). Còn lại một entry `interiorflow-main`. Preview chính không bị đụng.

### 3) `.gitignore` — thêm `.claude/worktrees/`
Trước: chỉ có `.worktrees/`. Sau: thêm `.claude/worktrees/` (đường mới) và giữ `.worktrees/` (phòng khôi phục cây cũ + luật đối xứng với package.json test đang có cả 2 nhánh).

### 4) 5 máy soi (soi-frontier, soi-tu-dien, soi-contract, soi-thao-tac, soi-hinh-hoc) — **CỐ Ý KHÔNG VÁ**
Lý do (đo bằng grep): cả 5 gọi `walk(scan_dir)` với `scan_dir` là thư mục con cụ thể chứ không phải ROOT ⇒ không thể bò vào `.claude/worktrees/` vì `.claude` không nằm trong scan_dirs. Vá đúng khuôn cho ca không xảy ra = thêm nhiễu, và trái ràng buộc phiếu ("chỉ vá NẾU cùng bug"). Ghi rõ trong CLAUDE.md để phiên sau không nhầm.

---

## ⑤ NGHIỆM THU — máy + đọc bằng mắt

**Máy**:
- `npm run soi:frontier` → exit 0, `🔴 0 LỆCH` (không đẻ lệch mới)
- `git status` → chỉ 3 file trong phạm vi tôi (`CLAUDE.md`, `.claude/launch.json`, `.gitignore`); 5 file khác thuộc 3 phiên phụ song song (`components/entry/*`, `lib/dna/*`, `lib/distill/types.ts`, `components/collab/feature-flags.ts`) — KHÔNG đụng
- `git diff --stat` → 3 file, +17 dòng / -11 dòng
- `grep -l interiorflow-wt CLAUDE.md .claude/launch.json .gitignore package.json scripts/*.mjs` → chỉ còn 1 kết quả là **CLAUDE.md** (dòng do tôi viết giải thích luật cũ hết dùng — không phải bắt buộc mới)

**Đọc bằng mắt**: 3 file diff nhỏ, đọc trực tiếp được ở phần ⑤. Không có mock (phiếu KHÔNG có ô ⑤ giao diện — đây là phiếu hạ tầng luật, không sản phẩm nhìn-thấy).

---

## ⑥ BÀN GIAO
- **Vùng T đã đóng**: 3 file luật/config đồng bộ về `.claude/worktrees/`; 5 máy soi giữ nguyên có lý do khai rõ trong CLAUDE.md.
- **Không mở entry frontier mới** — đây là dọn nợ, không phải tính năng.
- **Không tự merge** — 3 phiên phụ khác đang chạy song song ở worktree agent-* riêng, cây chính đang có 8 file dirty của phiên khác. Hoà sẽ tự commit đợt.

---

## ⑦b CHƯA CHẮC · CHƯA KIỂM

1. **Docs lịch sử vẫn còn 20+ dòng `interiorflow-wt-*`** (CHAY-DOT-FINAL, PHIEU-FINAL-2026-08-08, CHANGELOG:771, TECHNICAL_GLOSSARY:184, M-BUILD-OPS-2-OUT:4). Tôi **cố ý không sửa** theo luật *"nhật ký lịch sử không sửa"* (`IF-KIEN-TRUC` §4). Nếu Hoà muốn dọn thì phải mở phiếu riêng khai rõ *"sửa nhật ký để dọn tên chết"* — không được im lặng.
2. **Không chạy `npm test`** — phiếu cấm chạy dev server và test lâu; và test đang có 8 file dirty của 3 phiên phụ song song ⇒ chạy test lúc này sẽ ĐO SAI (đo cả code phiên khác đang dở). Máy soi `soi:frontier` đại diện đủ cho vùng tôi ghi.
3. **Không kiểm launch.json entry mới có breaking khi mở preview** — tôi chỉ GỠ entry (giảm), không thêm/sửa entry `interiorflow-main`. Rủi ro breaking bằng 0 theo lý thuyết, nhưng chưa mở preview_start thử.
4. **Không kiểm `.gitignore` mới có bỏ sót file tracked nào không** — nếu ai đó đã lỡ track `.claude/worktrees/*` trước đó thì `git rm --cached` mới xoá được. Grep `git ls-files .claude/worktrees` = **0 dòng** (không có file nào được tracked), nên rủi ro bằng 0. Nhưng chưa `git check-ignore` thử.
5. **Grep pattern có bỏ sót không** — dùng `grep -rn "interiorflow-wt"` với các đuôi `.md .json .mjs .ts .tsx .js`. Không quét `.sh` (bỏ sót `don-git-lich-su.sh` nếu có — kiểm lại: có `worktree` chung chung, không có `interiorflow-wt`). Không quét bên trong `.claude/worktrees/*` (đúng cách — đó là bản sao).

## ⑦c HẠN DÙNG KẾT LUẬN
- **Luật MỘT đường `.claude/worktrees/`**: hạn dùng dài — chỉ đổi khi Claude Code đổi convention (thứ ngoài IF).
- **`launch.json` một entry**: hạn dùng dài — khi cần thêm preview cho worktree/nhánh cụ thể thì thêm entry MỚI, không khôi phục entry đã gỡ.
- **`.gitignore` giữ cả 2 nhánh**: hạn dùng dài — chi phí giữ = 1 dòng, gỡ ra chỉ khi CLAUDE.md tuyên bố hoàn toàn không còn tương thích với `.worktrees/` cũ.
- **Kết luận "5 máy soi không dính bug"**: hạn dùng đến khi ai đó đổi `walk(scan_dir)` sang `walk(ROOT)` trong bất kỳ máy nào. Máy soi tự-đối-chiếu chưa canh chuyện này ⇒ nếu tương lai cần phòng ngừa toàn diện, mở phiếu riêng đổi cả 5 sang khuôn hàm `.includes('worktrees')`.

---

## FILES ĐÃ SỬA
- `/Users/tranben/Downloads/interiorflow/CLAUDE.md` (3 chỗ)
- `/Users/tranben/Downloads/interiorflow/.claude/launch.json` (gỡ 1 entry)
- `/Users/tranben/Downloads/interiorflow/.gitignore` (thêm 1 dòng + comment)

## FILES CỐ Ý KHÔNG SỬA (khai rõ)
- `scripts/soi-frontier.mjs` `soi-tu-dien.mjs` `soi-contract.mjs` `soi-thao-tac.mjs` `soi-hinh-hoc.mjs` — không chạm bug thực tế
- `scripts/soi-app.py` — cùng lý do, và ngoài tay: không rõ ai còn chạy Python script này
- docs/CHAY-DOT-FINAL, docs/PHIEU-FINAL-2026-08-08, docs/M-BUILD-OPS-2-OUT, docs/TECHNICAL_GLOSSARY, CHANGELOG — nhật ký lịch sử
- `AGENTS.md` — symlink → CLAUDE.md, tự cập nhật theo
