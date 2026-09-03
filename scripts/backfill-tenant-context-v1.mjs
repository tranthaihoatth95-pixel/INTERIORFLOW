#!/usr/bin/env node
/**
 * Dry-run-first, idempotent backfill. It never invents tenant membership from filenames or owners.
 * Input JSON: { organizations:[{id,slug,name}], memberships:[{organizationId,userId,orgRole}],
 * projects:[{id,organizationId}], libraryAssets:[{id,organizationId}] }
 * Use --apply only after the mapping has been reviewed. Re-running converges via upsert/update.
 */
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const file = args.find((arg) => !arg.startsWith('--'));
if (!file) throw new Error('Cần đường dẫn mapping JSON đã được duyệt. Mặc định chỉ dry-run.');
const plan = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const key of ['organizations', 'memberships', 'projects', 'libraryAssets']) {
  if (!Array.isArray(plan[key])) throw new Error(`Mapping thiếu mảng ${key}.`);
}
console.log(JSON.stringify({ mode: apply ? 'APPLY' : 'DRY_RUN', counts: Object.fromEntries(Object.entries(plan).map(([k,v]) => [k, v.length])) }, null, 2));
if (!apply) process.exit(0);

const prisma = new PrismaClient();
try {
  await prisma.$transaction(async (tx) => {
    for (const row of plan.organizations) await tx.organization.upsert({ where: { id: row.id }, create: row, update: { slug: row.slug, name: row.name } });
    for (const row of plan.memberships) await tx.organizationMember.upsert({ where: { organizationId_userId: { organizationId: row.organizationId, userId: row.userId } }, create: row, update: { orgRole: row.orgRole, deletedAt: null } });
    for (const row of plan.projects) await tx.project.update({ where: { id: row.id }, data: { organizationId: row.organizationId } });
    for (const row of plan.libraryAssets) await tx.libraryAsset.update({ where: { id: row.id }, data: { organizationId: row.organizationId } });
  });
} finally {
  await prisma.$disconnect();
}
