# CLEANUP-1 — xoá 2 file dead (19/08)

① **Việc**: xoá `components/IntroSequence.tsx` (493 dòng, bản gốc/legacy, đã bị thay bởi
`components/intro/IntroSequence.tsx` — `app/intro/page.tsx:10` import bản mới) và `_shot.mjs`
(675 byte, root, script playwright screenshot chạy tay, không ai import).

② **Tiền đề xác nhận lại**: `git rev-parse HEAD` = `c7f3ac8` (main, đúng mốc MAIN giao).
`grep -rn "components/IntroSequence\b"` (loại node_modules/.claude/worktrees) = 0 caller ngoài
chính nó. `grep "_shot"` trong package.json = 0. Khớp đúng tiền đề MAIN đưa ra, không lệch —
xoá theo kế hoạch, không cần dừng hỏi lại.

③ **Thao tác**: `rm components/IntroSequence.tsx _shot.mjs` (rm trần, không qua `git rm`/commit —
đúng luật phiếu, để MAIN tự quản lý phần git).

④ **Nghiệm thu**:
- `npm run tsc` — PASS, 0 lỗi (không dòng output nào, compile sạch).
- `grep -rn "components/IntroSequence\b\|_shot\.mjs" --include="*.ts" --include="*.tsx" --include="*.json" .`
  (loại node_modules/.claude/worktrees) — RỖNG ở mọi file `.ts/.tsx`; 6 dòng còn lại nằm trong
  `.ua/knowledge-graph.json` + `.ua/fingerprints.json` (cache tri thức của tool ngoài, KHÔNG phải
  script/config điều khiển build — untracked `?? .ua/` theo git status đầu phiên). Không có dòng
  nào trong `package.json`/CI gọi `_shot.mjs`.
- `npm run soi:frontier` — trước xoá: `👁 1 qua mắt · ✅ 76 xong-máy · ⬜ 57 chờ · 🔴 0 LỆCH`;
  sau xoá: **giống hệt**, `🔴 0 LỆCH`. Không tăng lệch.

⑤ **Phạm vi**: chỉ đụng đúng 2 file trong phiếu. Không chạm `.claude/worktrees/`, `dev.db`, hay
file dirty của phiên khác. Không `git add`/`commit`/`push`.

⑥ **Kết luận**: xong, sạch, không cần hoàn nguyên.

⑦b **Chưa chắc/chưa kiểm**: không chạy được `npm test` đầy đủ trong phiếu này (phiếu chỉ yêu cầu
tsc + grep + soi:frontier, không yêu cầu test suite) — nếu có test nào import gián tiếp qua alias
động (`require(dynamicPath)`) thì grep tĩnh không bắt được, nhưng tsc pass đã loại khả năng đó cho
phần TypeScript.

⑦c **Hạn dùng kết luận**: đúng tại mốc `c7f3ac8`. Nếu có phiên khác thêm import mới tới
`components/IntroSequence.tsx` (bản cũ) hoặc `_shot.mjs` SAU mốc này mà chưa rebase, kết luận
"an toàn xoá" không còn hiệu lực cho nhánh đó.
