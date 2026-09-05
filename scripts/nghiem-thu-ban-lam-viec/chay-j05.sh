#!/usr/bin/env bash
# Bàn làm việc J05 — dựng dev server 3098 rồi chạy hành trình thẻ tiêu điểm.
#
# ⚠️ `DATABASE_URL` phải TUYỆT ĐỐI: `@prisma/client` trong worktree là symlink sang repo chính,
# nên Prisma nạp `.env` theo đường THẬT của module — đường tương đối sẽ âm thầm ghi vào CSDL
# repo chính (đã xảy ra thật, xem docstring `nghiem-thu-g2-hanh-trinh.mjs`).
#
# Cổng 3098 là của lane này. 3097 là của lane khác — không đụng.
set -euo pipefail
cd "$(dirname "$0")/../.."

CONG="${CONG:-3098}"
export DATABASE_URL="file:$(pwd)/prisma/dev.db"
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers

case "${1:-chay}" in
  server)
    exec npx next dev -p "$CONG"
    ;;
  chay)
    exec node scripts/nghiem-thu-g2-hanh-trinh.mjs \
      --goc="http://localhost:$CONG" \
      --db="$DATABASE_URL" \
      --anh=docs/delivery/anh-duyet-mat/j05 \
      "${@:2}"
    ;;
  *)
    echo "dùng: $0 [server|chay] [--ca=J05|--hieu-chuan|--bo-hieu-chuan]" >&2
    exit 2
    ;;
esac
