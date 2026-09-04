import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const flows = await p.flow.findMany({ select: { id: true, name: true, userId: true, projectId: true, updatedAt: true } });
console.log('FLOWS', JSON.stringify(flows, null, 1));
console.log('projects', await p.project.count());
console.log('tasks', await p.task.count());
await p.$disconnect();
