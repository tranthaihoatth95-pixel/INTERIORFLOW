# 13 · MAIN foreman — Batch 0A (durability) + mở Batch 0B — 19/08 tối

## Vai + premise
MAIN/Tổng điều phối theo prompt Hoà 19/08 (CONTINUITY · DURABLE GIT · INTEGRATION EXECUTION).
Premise đọc: prompt MAIN (mới hơn Gate doc) **đè** luật Gate §2.5 "không commit" — từ giờ
implementation phải CHECKPOINTED trên nhánh backup/feature, `main` vẫn của Hoà (H7 nguyên).
H1 (duyệt artifact) đọc là EYE-gate, không còn là code-freeze — vì chính prompt MAIN lệnh chạy batch.

## Batch 0A — làm gì, bằng chứng
1. Đo reality: HEAD `c7f3ac8` · main · 53 M + 53 untracked (0 deleted).
2. Verify diff trên đĩa: R1 (specId drop — LibraryDropBridge/LibrarySheet/library-item-resolve),
   R3 (thao-tac-glyph → sổ lệnh: registry desc+hinh, commandHinh, CadToolbar+ToolDock3D),
   R7 (present:* events PresentEditor↔ReviewPanel) — CẢ BA CÒN NGUYÊN.
   Phát hiện: LibrarySheet lẫn 1 hunk W0.3 (hydrateIdfcStore) → R1 checkpoint phải đứng SAU wave0.
3. Machine re-verify: 224 test targeted pass (resolve 38 · registry 105 · toolbar-doc 51 · boq 30).
4. **Checkpoint bằng plumbing** (GIT_INDEX_FILE tạm + read-tree/write-tree/commit-tree — KHÔNG
   checkout/stash/đụng index thật, đúng luật cây-nhiều-phiên):
   nhánh `backup/2026-08-19-batch0a` = R3 `f25716e` → R7 `355459d` → wave0-snapshot `5249447`
   → R1 `bcb13c5` → untracked-dirs `bb53eae`. Verify: temp-index status cột-2 rỗng ⇒ tip == worktree.
   Loại duy nhất: `.ua/` (cache understand-anything 7,5MB).
5. Bundle: `~/Downloads/IF-git-backup/if-backup-2026-08-19-batch0a.bundle` (205MB, main+backup).
6. ⛔ `git push origin backup/*` bị permission classifier chặn 2 lần → BACKED-UP-remote chờ Hoà.

## Bẫy đã gặp (cho phiên sau)
- zsh KHÔNG word-split biến ⇒ `git update-index --add -- $LIST` nhận cả chuỗi làm 1 path. Dùng
  `--stdin` + file list. Branch hỏng đầu tiên đã `branch -D` (chưa push, an toàn).
- `git status --porcelain` liệt untracked ở dạng THƯ MỤC ⇒ update-index "Ignoring path". Phải
  expand bằng `git ls-files -o --exclude-standard`.
- `git diff <commit>` với file untracked-trong-index-thật nhưng có-trong-commit → hiện "deleted"
  GIẢ. Verify đúng = temp index read-tree tip rồi status.

## Batch 0B — giao 19/08 tối
3 worker song song, file rời nhau, không H-gate riêng: **R4** Tool3DBar→ToolbarChip ·
**R5** LightBar vào panel hàng đợi + ResumeWork vào DongStudioHome · **R8** geom2d reader (trên R1).
R10 GIỮ (H3 "✓" trong LATEST chưa đủ bằng chứng Hoà bấm). Worker cấm git add/commit — MAIN
checkpoint sau khi nghiệm thu.

## CHƯA CHẮC
- Chưa browser verify gì trong 0A (diff không đổi so report gốc — dựa browser-pass của report).
- `.ua/` bỏ ngoài backup — nếu Hoà muốn giữ knowledge graph thì tự copy.
- Đọc H1=EYE-gate là DIỄN GIẢI của MAIN từ prompt — Hoà bác thì mọi thứ nằm trên backup branch,
  revert = 0 chi phí.

## HẠN DÙNG
Hết hạn khi: Hoà commit/push working tree · bất kỳ R 0B nào đóng · HEAD đổi.
