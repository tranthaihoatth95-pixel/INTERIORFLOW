/**
 * scripts/tai-khoan-kiem.mjs — ĐẶT LẠI MẬT KHẨU CHO TÀI KHOẢN KIỂM (CSDL nháp, dùng-rồi-bỏ).
 *
 * VÌ SAO CÓ TỆP NÀY: máy chụp màn (`chup-man-duyet-mat.mjs`) phải ĐĂNG NHẬP mới chụp được bên
 * trong app. Trên máy Hoà thì Hoà đăng nhập tay một lần rồi phiên được nhớ. Trong môi trường
 * kiểm tự động thì không có ai gõ tay ⇒ phải có một tài khoản nháp biết mật khẩu.
 *
 * ⛔ RANH GIỚI, đọc trước khi dùng:
 *   · CHỈ chạy trên CSDL nháp dựng bằng `scripts/dung-moi-truong-kiem.sh` — thứ có thể xoá và
 *     dựng lại bất cứ lúc nào, không có dữ liệu người dùng thật.
 *   · Mật khẩu **KHÔNG có giá trị mặc định trong tệp này** và không bao giờ được ghi vào git.
 *     Nó đi qua biến môi trường của đúng lệnh đó rồi biến mất.
 *   · Tệp này KHÔNG được gọi từ mã sản phẩm. Nó là đồ nghề, không phải tính năng.
 *
 * CHẠY:
 *   IF_MK='<mật khẩu nháp>' node scripts/tai-khoan-kiem.mjs
 *   (tuỳ chọn: IF_TK='kiem@localhost.test' — mặc định đúng tài khoản môi trường kiểm dựng ra)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const EMAIL = process.env.IF_TK ?? 'kiem@localhost.test';
const MK = process.env.IF_MK ?? '';

if (!MK) {
  console.error('⛔ Thiếu IF_MK — tệp này CỐ Ý không có mật khẩu mặc định.');
  console.error("   Chạy:  IF_MK='<mật khẩu nháp>' node scripts/tai-khoan-kiem.mjs");
  process.exit(1);
}

const p = new PrismaClient();
try {
  const hash = await bcrypt.hash(MK, 10);
  const u = await p.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash: hash },
    create: { email: EMAIL, name: 'kiem', passwordHash: hash },
    select: { id: true, email: true },
  });
  console.log(`✅ đặt lại mật khẩu cho ${u.email} (${u.id})`);
} finally {
  await p.$disconnect();
}
