/**
 * lib/server/rev-guard.test.ts — W5 (19/08), tiếp phần H11.
 *
 * H11 dựng cơ chế rev optimistic-concurrency (extended whereUnique `{id,rev}` → Prisma ném
 * P2025 khi lệch → 409) NHƯNG gói cứng cho `Flow`. W5 trích thành `lib/server/rev-guard.ts`
 * dùng chung, rồi áp cho `ProjectMember` (POST/PATCH/DELETE, app/api/projects/[id]/members/
 * route.ts) và `LibraryAsset` (DELETE, app/api/library/[id]/route.ts).
 *
 * Hai tầng kiểm (khuôn `app/api/flows/[id]/route.test.ts`):
 *  ① INTEGRATION (Prisma THẬT trên dev.db, tự dọn) — Prisma thật ném P2025 khi rev lệch, CHO
 *     CẢ HAI model (không chỉ Flow) — đây là điểm rủi ro kỹ thuật thật của phiếu này: nếu
 *     `updateWithRevCheck` generic hoá sai (vd quên truyền where đúng) thì cơ chế vô nghĩa cho
 *     model mới mà model cũ (Flow, đã test riêng) vẫn xanh.
 *  ② CẤU TRÚC (đọc source thật) — cả 3 route (members POST/PATCH/DELETE, library DELETE) đều
 *     import từ `lib/server/rev-guard.ts` (KHÔNG khai lại RevConflictError/P2025 cục bộ — B25
 *     cấm "đường thứ hai" cho cùng cơ chế), và đều bắt RevConflictError → 409.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/server/rev-guard.test.ts
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from './db';
import { RevConflictError, updateWithRevCheck } from './rev-guard';

let pass = 0;
function ok(label: string) {
  pass += 1;
  console.log(`  ✓ ${label}`);
}

async function withTempUser<T>(fn: (userId: string) => Promise<T>): Promise<T> {
  const user = await prisma.user.create({
    data: {
      email: `test-w5-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
      name: 'Test W5',
      passwordHash: 'x',
    },
  });
  try {
    return await fn(user.id);
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
}

async function main() {
  console.log('W5 — rev-guard dùng chung cho ProjectMember + LibraryAsset');

  /* ---- ① integration: ProjectMember ---- */
  await withTempUser(async (ownerId) => {
    await withTempUser(async (memberId) => {
      const project = await prisma.project.create({
        data: { userId: ownerId, name: 'Dự án test W5' },
      });
      const member = await prisma.projectMember.create({
        data: { projectId: project.id, userId: memberId, role: 'viewer', lastEditedBy: ownerId },
      });
      try {
        assert.equal(member.rev, 0);

        // rev khớp → updateWithRevCheck chạy, không ném.
        const afterMatch = await updateWithRevCheck(member.id, member.rev, (where) =>
          prisma.projectMember.update({ where, data: { role: 'drafter', rev: { increment: 1 } } }),
        );
        assert.equal(afterMatch.rev, 1);
        assert.equal(afterMatch.role, 'drafter');
        ok('ProjectMember: rev khớp → update chạy, rev tăng đúng 1');

        // rev lệch → RevConflictError (bọc từ P2025 thật của Prisma), KHÔNG ghi.
        let threw = false;
        try {
          await updateWithRevCheck(member.id, 0, (where) =>
            prisma.projectMember.update({ where, data: { role: 'owner', rev: { increment: 1 } } }),
          );
        } catch (e) {
          threw = e instanceof RevConflictError;
        }
        assert.ok(threw, 'phải ném RevConflictError khi rev lệch');
        ok('ProjectMember: rev lệch → RevConflictError (Prisma thật ném P2025)');
        const unchanged = await prisma.projectMember.findUniqueOrThrow({ where: { id: member.id } });
        assert.equal(unchanged.role, 'drafter');
        assert.equal(unchanged.rev, 1);
        ok('ProjectMember: ghi bị chặn → role/rev trong DB KHÔNG đổi');

        // không gửi expectedRev → luôn chạy, bất kể rev hiện tại.
        const afterNoCheck = await updateWithRevCheck(member.id, undefined, (where) =>
          prisma.projectMember.update({ where, data: { role: 'viewer', rev: { increment: 1 } } }),
        );
        assert.equal(afterNoCheck.rev, 2);
        assert.equal(afterNoCheck.role, 'viewer');
        ok('ProjectMember: không truyền expectedRev → update vẫn chạy (backward-compatible)');
      } finally {
        await prisma.projectMember.deleteMany({ where: { projectId: project.id } }).catch(() => {});
        await prisma.project.delete({ where: { id: project.id } }).catch(() => {});
      }
    });
  });

  /* ---- ① integration: LibraryAsset ---- */
  await withTempUser(async (userId) => {
    const asset = await prisma.libraryAsset.create({
      data: {
        userId,
        name: 'Ảnh test W5',
        category: 'ref-render',
        mime: 'image/png',
        path: 'test-w5.png',
      },
    });
    try {
      assert.equal(asset.rev, 0);

      const afterMatch = await updateWithRevCheck(asset.id, asset.rev, (where) =>
        prisma.libraryAsset.update({ where, data: { caption: 'đã sửa', rev: { increment: 1 } } }),
      );
      assert.equal(afterMatch.rev, 1);
      assert.equal(afterMatch.caption, 'đã sửa');
      ok('LibraryAsset: rev khớp → update chạy, rev tăng đúng 1');

      let threw = false;
      try {
        await updateWithRevCheck(asset.id, 0, (where) =>
          prisma.libraryAsset.update({
            where,
            data: { deletedAt: new Date(), rev: { increment: 1 } },
          }),
        );
      } catch (e) {
        threw = e instanceof RevConflictError;
      }
      assert.ok(threw, 'phải ném RevConflictError khi rev lệch');
      ok('LibraryAsset: rev lệch → RevConflictError (Prisma thật ném P2025)');
      const unchanged = await prisma.libraryAsset.findUniqueOrThrow({ where: { id: asset.id } });
      assert.equal(unchanged.deletedAt, null);
      assert.equal(unchanged.rev, 1);
      ok('LibraryAsset: ghi bị chặn (xoá mềm) KHÔNG xảy ra — deletedAt vẫn null, rev không đổi');

      const afterNoCheck = await updateWithRevCheck(asset.id, undefined, (where) =>
        prisma.libraryAsset.update({ where, data: { rev: { increment: 1 } } }),
      );
      assert.equal(afterNoCheck.rev, 2);
      ok('LibraryAsset: không truyền expectedRev → update vẫn chạy (backward-compatible)');
    } finally {
      await prisma.libraryAsset.delete({ where: { id: asset.id } }).catch(() => {});
    }
  });

  /* ---- ② cấu trúc: 3 route đi qua rev-guard dùng chung, không khai lại cơ chế cục bộ ---- */
  const membersSrc = fs.readFileSync(
    path.join(__dirname, '../../app/api/projects/[id]/members/route.ts'),
    'utf8',
  );
  assert.match(
    membersSrc,
    /import \{ RevConflictError, updateWithRevCheck, REV_CONFLICT_RESPONSE \} from '@\/lib\/server\/rev-guard'/,
    'members/route.ts phải import rev-guard dùng chung',
  );
  assert.ok(!/class RevConflictError/.test(membersSrc), 'members/route.ts KHÔNG được khai lại RevConflictError cục bộ');
  const membersRevConflictReturns = (membersSrc.match(/return REV_CONFLICT_RESPONSE\(\);/g) ?? []).length;
  assert.equal(
    membersRevConflictReturns,
    3,
    `members/route.ts: cả 3 route POST/PATCH/DELETE phải trả 409 khi RevConflictError — đếm được ${membersRevConflictReturns}`,
  );
  ok('members/route.ts: import rev-guard dùng chung, cả 3 route (POST/PATCH/DELETE) bắt RevConflictError → 409');

  const librarySrc = fs.readFileSync(path.join(__dirname, '../../app/api/library/[id]/route.ts'), 'utf8');
  assert.match(
    librarySrc,
    /import \{ RevConflictError, updateWithRevCheck, REV_CONFLICT_RESPONSE \} from '@\/lib\/server\/rev-guard'/,
    'library/[id]/route.ts phải import rev-guard dùng chung',
  );
  assert.ok(!/class RevConflictError/.test(librarySrc), 'library/[id]/route.ts KHÔNG được khai lại RevConflictError cục bộ');
  assert.match(
    librarySrc,
    /return REV_CONFLICT_RESPONSE\(\);/,
    'library/[id]/route.ts DELETE phải trả 409 khi RevConflictError',
  );
  ok('library/[id]/route.ts: import rev-guard dùng chung, DELETE bắt RevConflictError → 409');

  const flowSrc = fs.readFileSync(path.join(__dirname, '../../app/api/flows/[id]/route.ts'), 'utf8');
  assert.ok(!/class RevConflictError/.test(flowSrc), 'flows/[id]/route.ts KHÔNG còn khai RevConflictError cục bộ sau refactor');
  ok('flows/[id]/route.ts: đã refactor dùng rev-guard dùng chung, không còn bản local (REUSE thật, không phải NEW rồi bỏ cũ)');

  console.log(`\n${pass} PASS`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
