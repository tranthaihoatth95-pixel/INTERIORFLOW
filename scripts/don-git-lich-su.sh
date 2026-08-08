#!/bin/bash
# don-git-lich-su.sh — XOÁ VĨNH VIỄN dấu vết TTT/khách/Pantone khỏi LỊCH SỬ git.
# Hoà duyệt 08/08 ("dọn git"). Soạn sẵn để chạy Ở THỜI ĐIỂM YÊN TĨNH — xem ĐIỀU KIỆN dưới.
#
# ⛔ VÌ SAO KHÔNG CHẠY NGAY TRONG PHIÊN 08/08:
#   1. `git-filter-repo` CHƯA cài trên máy (which = not found).
#   2. Viết lại lịch sử làm MỌI worktree + phiên đang chạy lệch HEAD — lúc soạn còn
#      phiên .idfc đang sửa dở cây chính + worktree p7/p3c đang sống.
#   3. Phải force-push origin/main — mọi bản clone cũ phải clone lại.
#
# ✅ ĐIỀU KIỆN TRƯỚC KHI CHẠY (thiếu 1 là DỪNG):
#   [ ] Mọi phiên Claude Code đã đóng, mọi dev server đã tắt
#   [ ] `git worktree list` chỉ còn đúng cây chính (dọn hết worktree trước)
#   [ ] `git status` sạch, mọi thứ đã commit + push
#   [ ] Đã backup: `git clone --mirror . ../interiorflow-backup-$(date +%y%m%d).git`
#
# Cài công cụ (1 lần):  brew install git-filter-repo
set -euo pipefail
cd "$(dirname "$0")/.."

echo "⚠️  Script này VIẾT LẠI TOÀN BỘ LỊCH SỬ GIT — không hoàn tác được."
read -p "Đã đọc + đủ 4 điều kiện đầu file? Gõ 'dong-y' để tiếp: " ok
[ "$ok" = "dong-y" ] || { echo "Dừng."; exit 1; }

command -v git-filter-repo >/dev/null || { echo "Chưa cài git-filter-repo (brew install git-filter-repo)"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Working tree chưa sạch — dừng."; exit 1; }
[ "$(git worktree list | wc -l | tr -d ' ')" = "1" ] || { echo "Còn worktree — dọn trước."; exit 1; }

# Danh sách rút từ `git rev-list --objects --all` ngày 08/08 (đối chiếu AUDIT-BRAND-PII):
git filter-repo \
  --invert-paths \
  --path docs/files.zip \
  --path docs/mocks/mapa-de-zonas.html \
  --path knowledge/ttt-design-system \
  --path lib/gu/pantone-tcx.json \
  --path public/__dwg-cancel-test.dwg \
  --path public/detech \
  --path-glob 'public/wallpapers/ttt-*'

# filter-repo tự gỡ remote 'origin' để chống push nhầm — nối lại rồi force-push:
echo ""
echo "XONG phần viết lại. Bước cuối (tự chạy tay, kiểm lần nữa trước khi gõ):"
echo "  git remote add origin <URL-cu>   # lấy URL từ backup mirror nếu quên"
echo "  git push --force --all origin && git push --force --tags origin"
echo "Sau đó: các máy khác clone LẠI repo, đừng pull đè."
