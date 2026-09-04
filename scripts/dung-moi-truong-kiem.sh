#!/bin/bash
# scripts/dung-moi-truong-kiem.sh — DỰNG MÔI TRƯỜNG XÁC MINH DÙNG-XONG-BỎ (W0).
#
# Mục đích: máy sạch chạy MỘT lệnh là có đủ .env + CSDL để `npm test` và các
# workflow lõi chạy được — không cần chủ dự án thao tác tay.
#
# ⛔ KHÔNG DÙNG CHO DỮ LIỆU THẬT. Không khoá thật, không dữ liệu người dùng.
#    `.env` và `prisma/dev.db*` đều đã gitignore (.gitignore:3,6).
#
# VÌ SAO `db push` CHỨ KHÔNG `migrate deploy` (đo 04/09, ghi lại để khỏi thử lại):
#    `migrate deploy` áp đủ 6 migration nhưng chỉ dựng **21/24 bảng** — thư mục
#    migrations đang TỤT SAU `schema.prisma` (3 model chỉ tồn tại nhờ `db push`
#    trước đây; xem tên migration `catchup_db_push_baseline`). Với DB rỗng
#    dùng-xong-bỏ thì `db push` cho cây đúng bằng schema. ⚠️ Nhưng đây là RỦI RO
#    PHÁT HÀNH THẬT: máy chủ mới chạy `migrate deploy` sẽ có CSDL THIẾU BẢNG.
#
# CHẠY:  bash scripts/dung-moi-truong-kiem.sh
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if [ ! -f .env ]; then
  echo "· dựng .env (dùng-xong-bỏ)"
  cat > .env <<'ENV'
# MÔI TRƯỜNG XÁC MINH — DÙNG-XONG-BỎ. Không dữ liệu thật, không khoá thật.
# Sinh bởi scripts/dung-moi-truong-kiem.sh (W0). Tệp này đã gitignore.
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_DEMO=0
AUTH_SECRET="KIEM-THU-KHONG-PHAI-KHOA-THAT-0000000000000000"
INTEGRATION_ENC_KEY="0000000000000000000000000000000000000000000000000000000000000000"
ENV
else
  echo "· .env đã có — giữ nguyên"
fi

set -a; . ./.env; set +a
echo "· sinh Prisma client"; npx prisma generate >/dev/null
echo "· đồng bộ CSDL theo schema"; npx prisma db push --skip-generate --accept-data-loss >/dev/null

MODEL=$(grep -cE '^model ' prisma/schema.prisma)
BANG=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$queryRawUnsafe(\"SELECT count(*) c FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite_%'\").then(r=>{process.stdout.write(String(r[0].c));return p.\$disconnect()})")
echo
if [ "$MODEL" = "$BANG" ]; then
  echo "✅ môi trường xác minh sẵn sàng — $BANG/$MODEL bảng khớp schema"
  echo "   chạy: npm test   ·   npm run build   ·   npx next start"
else
  echo "❌ lệch: schema $MODEL model nhưng CSDL $BANG bảng"; exit 1
fi
