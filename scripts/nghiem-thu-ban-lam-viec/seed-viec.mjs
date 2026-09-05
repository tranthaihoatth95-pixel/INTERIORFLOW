/**
 * Nạp VIỆC THẬT vào CSDL nháp của worktree — để bậc NỀN chạy bằng đường dữ liệu THẬT
 * (`/api/home/summary` → `groupUpcoming` → `vatTuThat`), KHÔNG phải đường `?demo=`.
 */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const duAn = await p.project.findMany({ select: { id: true, name: true } });
if (duAn.length === 0) throw new Error('không có dự án nào');

const ngay = (n) => new Date(Date.now() + n * 86_400_000);
let dem = 0;
for (const d of duAn) {
  let cot = await p.workflowState.findFirst({ where: { projectId: d.id, isDone: false } });
  if (!cot) cot = await p.workflowState.create({ data: { projectId: d.id, name: 'Đang làm', order: 0, isDone: false } });
  const viec = [
    { title: 'Duyệt vật liệu sàn phòng khách', dueAt: ngay(0), stage: 'render' },
    { title: 'Chốt cao độ trần bếp', dueAt: ngay(1), stage: 'concept' },
    { title: 'Gửi bảng vật liệu cho chủ đầu tư', dueAt: ngay(3), stage: 'present' },
  ];
  for (const v of viec) {
    const co = await p.task.findFirst({ where: { projectId: d.id, title: v.title } });
    if (co) continue;
    await p.task.create({ data: { projectId: d.id, statusId: cot.id, title: v.title, dueAt: v.dueAt, stage: v.stage } });
    dem++;
  }
}
console.log('tạo', dem, 'việc · tổng', await p.task.count());
await p.$disconnect();
