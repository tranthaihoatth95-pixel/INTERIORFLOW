# SNAPSHOT TRƯỚC DISPATCH — hợp đồng ZERO-LOSS §3

```
REPO_ROOT   = /home/user/INTERIORFLOW
BRANCH      = integration/2026-09-04
HEAD        = a64c0248ffcda9865c58ff8c9e75e49947655a6d
NGÀY GIỜ    = 2026-09-04T16:20:06Z
```

## Tình trạng cây (tracked)
```
?? docs/delivery/SNAPSHOT-TRUOC-DISPATCH.md
(rỗng = sạch)
```

## Tệp untracked (không tính ignored)
```
docs/delivery/SNAPSHOT-TRUOC-DISPATCH.md
TỔNG: 1
```

## Thư mục output bị ignore — PHẢI KIỂM khi worker về (§5: ignored KHÔNG an toàn)
```
.nen-chrome-out  →  68 tệp
.next  →  726 tệp
docs/delivery/anh-duyet-mat  →  97 tệp
```

## Stash / worktree / nhánh chưa đẩy
```
stash: 0
/home/user/INTERIORFLOW  a64c0248 [integration/2026-09-04]
--- nhánh local chưa có trên remote ---
claude/interiorflow-design-system-vbdcku 
integration/2026-09-04 
main [behind 2]
```

---

## Đợt 04/09 — lô 2 (ba lane cùng lúc)

| | |
|---|---|
| REPO_ROOT | `/home/user/INTERIORFLOW` (`git rev-parse --show-toplevel`) |
| BRANCH | `integration/2026-09-04` |
| HEAD | `5cb4db6ceee9d05410dbf9665f105331ae144962` |
| `git status --short` | **rỗng** |
| Worktree trước dispatch | 1 (lane DESIGN `a4780dfca8010ed71`, đang chạy) |
| Worktree sau dispatch | 4 |

**Đã dọn trước lô này** (đủ cả bốn điều kiện an toàn: đã merge · cây sạch · không server chạy trong đó · không commit chỉ-có-ở-nhánh):
- `agent-a7a3306f0a157f8d9` (`fa9fb12d`, G1 phủ 3D/Present) — `merge-base --is-ancestor` rc=0
- `agent-ad4a1765ee349da2e` (`c5ab4d00`, G2 đợt 1) — `merge-base --is-ancestor` rc=0

**Server rác đã tắt**: PID 2876 · 3471 · 11294/11307/11308 (cổng 3130 `next start`) — cả năm chạy trong repo chính, thuộc lane đã đóng. Còn đúng một server: **3081** của lane DESIGN.

**Phân cổng chống va chạm**: 3081 DESIGN · 3091 lane 02 · 3092 lane 05 · 3093 lane 07.

**Khoá phạm vi ghi (claim keys)** — khai tường minh trong từng phiếu vì bốn lane chạy song song:

| Lane | ĐƯỢC GHI | CẤM |
|---|---|---|
| 02 · WORKFLOW | `scripts/nghiem-thu-g2-hanh-trinh.mjs` · `JOURNEY-MATRIX.md` · ảnh `g2-hanh-trinh/` | present-editor · materials/library · home/studio |
| 05 · ASSET | `lib/materials/**` · `lib/library/**` · `components/materials|library/**` · `app/files|library/**` · `nghiem-thu-g6-*` | harness G2 · export-checks · home/studio |
| 07 · RELEASE | `lib/present-editor/export*` · `export-checks*` · `PRODUCT-DEFECTS.md` | harness G2 · materials/library · home/studio |
| 04 · DESIGN (đang chạy) | `components/home/**` · `components/studio/**` · `app/globals.css` | ba vùng trên |
