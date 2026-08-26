# PROMPT GỐC — 19/08 (cứu nguyên văn, 2 lệnh)

## Lệnh 1 — REPO ARCHAEOLOGY
Yêu cầu: audit orphan capability toàn repo, read-only. Phân loại A–M (engine no caller · caller
no UI · UI no backend · contract disconnected · route no consumer · 0 mount · flag hides ·
duplicate · stale doc 2 chiều · unknown owner · dead intentional · unknown). Scan strategy:
trace definition→imports→callers→mount→route→store→event→persistence→test→user entry→E2E;
feature "có thật" = đủ dây ENGINE→CONTRACT→CALLER→SURFACE→USER ACTION→OUTPUT. Vùng scan: app,
components, lib, scripts, prisma, public, docs, .claude, config, package.json, git history,
deleted files, flags, unused exports. Danh sách ca đã biết phải verify lại HEAD (idfc-import,
to-cad, DistillEngine, CuaSoThaoLuan, StageSwitcher/VitalsGesturePanel, capabilityFor, geom2d,
recipeJson, Workhub, IF_CAMPATH, elevation, ReviewPanel Present, specId/srcInsertId, matId
namespaces, exportIdfcStoreJson, SELLABLE_KINDS, LibraryItem, Project/Workspace). Git
archaeology: file xoá, package add-rồi-remove, mount-rồi-unmount, FIRST SEEN/LAST LIVE/WHEN
DISCONNECTED/WHY. Bảng kết quả Capability|Definition|Caller|UI|E2E|Status|Owner|Evidence|Action;
Action chỉ KEEP/RECONNECT/EXTEND/DEPRECATE/INVESTIGATE/IGNORE, không NEW. Ưu tiên P0 nút
giả/data loss → P1 engine lớn 0 caller → P2 stale docs → P3 helper nhỏ. Output:
docs/AUDIT-ORPHAN-CAPABILITIES-2026-08-19.md + session folder + cập nhật RETRIEVAL-MAP.
Kết bằng khối STOP (ORPHAN FOUND / HIGH-VALUE RECONNECT / STALE DOCS / UNKNOWN OWNER / DEAD
INTENTIONAL / TRUE MISSING / PRODUCTION CODE MODIFIED: NO / COMMIT: NO).

## Lệnh 2 — MEMORY + RETRIEVAL + ARTIFACT CONTRACT
Từ lượt này chat/context không phải nơi lưu trí nhớ chính. Memory 3 tầng: A living
(`LATEST.md` — HEAD/trạng thái/lane/blocker/chốt/canonical/việc kế, không reasoning dài) ·
B retrieval map (`RETRIEVAL-MAP.md` — mỗi topic: CURRENT CANONICAL / LATEST AUDIT / HISTORICAL
ORIGIN / KEY DECISIONS / CODE ANCHORS / KNOWN DRIFT / WHEN MAKING A BIG DECISION 4 bước; 11
topic tối thiểu; là INDEX không phải source-of-truth) · C deep decision record (QUESTION→OPTIONS
→EVIDENCE→STRONGEST COUNTERARGUMENT→REJECTED→DECISION→WHY→COST→SUPERSEDES→ANCHORS→AUDIT/DRIFT
→STATUS→HẠN DÙNG; không nén còn "Hoà chọn A"; trỏ ADR/session thay vì duplicate). Genealogy:
ORIGIN→CHỐT→IMPLEMENTATION→AUDIT→DRIFT→OWNER→CODE ANCHOR, không rewrite lịch sử. Code reality
rule: memory FIND THE PLACE, code CONFIRM THE REALITY, cấm MEMORY→CONCLUSION. Artifact bắt buộc:
`docs/memory/IF-MEMORY-RETRIEVAL-SYSTEM-2026-08-19.md` 13 mục, đọc độc lập; xuất artifact UI nếu
hỗ trợ, không thì khai UNAVAILABLE. Anti-loss checklist 11 ô. Cuối báo: MEMORY SYSTEM /
RETRIEVAL MAP / DECISION GENEALOGY: READY|PARTIAL · ARTIFACT FILE · ARTIFACT UI · ANTI-LOSS.
Không commit/push nếu Hoà chưa yêu cầu.
