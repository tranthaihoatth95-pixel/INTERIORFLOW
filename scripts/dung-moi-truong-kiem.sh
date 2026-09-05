#!/bin/bash
# scripts/dung-moi-truong-kiem.sh — DỰNG MÔI TRƯỜNG XÁC MINH DÙNG-XONG-BỎ (W0).
#
# Mục đích: máy sạch chạy MỘT lệnh là có đủ .env + CSDL để `npm test` và các
# workflow lõi chạy được — không cần chủ dự án thao tác tay.
#
# ⛔ KHÔNG DÙNG CHO DỮ LIỆU THẬT. Không khoá thật, không dữ liệu người dùng.
#    `.env` và `prisma/dev.db*` đều đã gitignore (.gitignore:3,6).
#
# DÙNG `migrate deploy` — CỐ Ý, và đây là điều kiện để script này có giá trị: nó dựng CSDL bằng
#    ĐÚNG đường mà máy chủ thật dùng, nên mỗi lần chạy cũng là một lần kiểm rằng thư mục
#    migrations còn dựng được đủ schema. `db push` tiện hơn nhưng CHE MẤT lệch migrations — đúng
#    cái bẫy đã cắn một lần: sáng 04/09 `migrate deploy` chỉ dựng 21/24 bảng vì 3 model chỉ từng
#    tồn tại nhờ `db push` gõ tay (xem tên migration cũ `catchup_db_push_baseline`). Đã vá bằng
#    migration `20260904000000_catchup_schema_drift`.
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
echo "· dựng CSDL bằng migrations (đúng đường máy chủ thật dùng)"; npx prisma migrate deploy >/dev/null

MODEL=$(grep -cE '^model ' prisma/schema.prisma)
BANG=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$queryRawUnsafe(\"SELECT count(*) c FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite_%'\").then(r=>{process.stdout.write(String(r[0].c));return p.\$disconnect()})")
echo
if [ "$MODEL" = "$BANG" ]; then
  echo "✅ môi trường xác minh sẵn sàng — $BANG/$MODEL bảng khớp schema"
  echo "   chạy: npm test   ·   npm run build   ·   npx next start"
else
  echo "❌ LỆCH MIGRATIONS: schema có $MODEL model nhưng migrate deploy chỉ dựng $BANG bảng."
  echo "   ⇒ prisma/migrations đang tụt sau schema.prisma. Sinh migration bù bằng:"
  echo "     npx prisma migrate diff --from-migrations prisma/migrations \\"
  echo "       --to-schema-datamodel prisma/schema.prisma --shadow-database-url file:/tmp/shadow.db --script"
  echo "   ĐỪNG chữa bằng db push — nó làm script xanh mà máy chủ thật vẫn thiếu bảng."
  exit 1
fi
