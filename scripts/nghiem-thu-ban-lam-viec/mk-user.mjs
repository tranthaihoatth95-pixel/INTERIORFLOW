import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const p = new PrismaClient();
const hash = await bcrypt.hash('matkhau123', 10);
const u = await p.user.update({
  where: { email: 'kiem@localhost.test' },
  data: { passwordHash: hash },
  select: { id: true, email: true },
});
console.log('user', u.id, u.email);
await p.$disconnect();
