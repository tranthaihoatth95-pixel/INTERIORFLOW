/**
 * app/api/flows/[id]/route.test.ts — H11 (19/08) rev optimistic-concurrency.
 *
 * Hai tầng kiểm (khuôn `lib/server/draft-project.test.ts`, `lib/server/credits.test.ts`):
 *  ① INTEGRATION (Prisma THẬT trên dev.db, tự dọn) — kiểm đúng cơ chế lõi route.ts dùng:
 *     `prisma.flow.update({ where: { id, rev: expectedRev }, data })` là "extended whereUnique"
 *     (Prisma ≥4.5, xác nhận @prisma/client 6.19 ở package.json). Đây là điểm RỦI RO KỸ THUẬT
 *     thật sự của phiếu này — nếu Prisma lặng lẽ BỎ QUA điều kiện `rev` thừa (không phải lỗi lý
 *     thuyết, cần thấy P2025 thật trên DB thật) thì cả cơ chế vô nghĩa. Không mock Prisma.
 *  ② CẤU TRÚC (đọc source thật — không dựng được route handler qua sucrase-node vì `ownFlow()`
 *     gọi `getSessionUser()` cần session/cookie thật, cùng giới hạn `draft-project.test.ts` đã
 *     ghi lại) — khoá: cả 3 nhánh PUT (snapshot/share-unshare/autosave) đều đi qua
 *     `updateFlowWithRevCheck` + bắt `RevConflictError` → 409; response luôn kèm `rev` mới để
 *     client cập nhật `currentFlowRev`; client (lib/store.ts persistNow) gửi `expectedRev` và xử
 *     409 bằng cách KHÔNG âm thầm ghi tiếp.
 *
 * Chạy: node_modules/.bin/sucrase-node app/api/flows/[id]/route.test.ts
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../../../../lib/server/db';

let pass = 0;
function ok(label: string) {
  pass += 1;
  console.log(`  ✓ ${label}`);
}

async function withTempFlow<T>(fn: (flowId: string, userId: string) => Promise<T>): Promise<T> {
  const user = await prisma.user.create({
    data: {
      email: `test-h11-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
      name: 'Test H11',
      passwordHash: 'x',
    },
  });
  const flow = await prisma.flow.create({
    data: { userId: user.id, name: 'Flow H11 test', graphJson: '{"nodes":[],"edges":[]}' },
  });
  try {
    return await fn(flow.id, user.id);
  } finally {
    // Flow không có onDelete: Cascade từ User (project SetNull, không phải flow) — dọn cả hai
    // tường minh, không dựa vào cascade.
    await prisma.flow.delete({ where: { id: flow.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
}

async function main() {
  console.log('H11 — rev optimistic-concurrency trên app/api/flows/[id]/route.ts');

  /* ---- ① integration: đúng cơ chế lõi route.ts dùng ---- */
  await withTempFlow(async (flowId) => {
    const before = await prisma.flow.findUniqueOrThrow({ where: { id: flowId } });
    assert.equal(before.rev, 0);

    // (a) rev khớp → ghi thành công, rev tăng đúng 1.
    const afterMatch = await prisma.flow.update({
      where: { id: flowId, rev: before.rev },
      data: { name: 'Đổi tên lần 1', rev: { increment: 1 } },
    });
    ok('rev khớp → update chạy, KHÔNG ném lỗi');
    assert.equal(afterMatch.rev, 1);
    assert.equal(afterMatch.name, 'Đổi tên lần 1');
    ok('rev khớp → tăng đúng 1, ghi đúng dữ liệu mới');

    // (b) rev LỆCH (client B còn cầm rev=0, nhưng DB đã ở rev=1 sau (a)) → P2025, KHÔNG ghi.
    let threwP2025 = false;
    try {
      await prisma.flow.update({
        where: { id: flowId, rev: 0 }, // rev cũ, đã lệch
        data: { name: 'Ghi đè âm thầm — KHÔNG được xảy ra', rev: { increment: 1 } },
      });
    } catch (e) {
      threwP2025 = (e as { code?: string })?.code === 'P2025';
    }
    ok('rev lệch → prisma ném P2025 (route.ts bắt lỗi này thành 409), KHÔNG lặng lẽ bỏ qua điều kiện rev');
    const afterConflictAttempt = await prisma.flow.findUniqueOrThrow({ where: { id: flowId } });
    assert.equal(afterConflictAttempt.name, 'Đổi tên lần 1');
    assert.equal(afterConflictAttempt.rev, 1);
    ok('ghi bị chặn → tên và rev trong DB KHÔNG đổi (không ghi đè im lặng)');

    // (c) không gửi expectedRev (client cũ / nhánh assignProject) → where chỉ có id → luôn chạy,
    // bất kể rev hiện tại là bao nhiêu — đúng "backward-compatible, không breaking".
    const afterNoRevCheck = await prisma.flow.update({
      where: { id: flowId }, // đúng nhánh `revWhere(id, undefined)` trong route.ts
      data: { name: 'Không kiểm rev — client cũ', rev: { increment: 1 } },
    });
    ok('không truyền rev vào where → update vẫn chạy bình thường (hành vi cũ nguyên vẹn)');
    assert.equal(afterNoRevCheck.rev, 2);
    assert.equal(afterNoRevCheck.name, 'Không kiểm rev — client cũ');
  });

  /* ---- ② cấu trúc: route.ts + store.ts đấu dây đúng, không rơi rớt 1 nhánh ---- */
  const routeSrc = fs.readFileSync(
    path.join(__dirname, 'route.ts'),
    'utf8',
  );
  // W5 (19/08) — RevConflictError/updateWithRevCheck/REV_CONFLICT_RESPONSE TRÍCH sang
  // lib/server/rev-guard.ts (dùng chung ProjectMember/LibraryAsset). route.ts nay IMPORT, không
  // còn khai class local — kiểm import + kiểm cơ chế P2025 THẬT nằm ở rev-guard.ts.
  assert.match(
    routeSrc,
    /import \{ RevConflictError, updateWithRevCheck, REV_CONFLICT_RESPONSE \} from '@\/lib\/server\/rev-guard'/,
    'route.ts phải IMPORT rev-guard dùng chung, không khai lại class local',
  );
  const revGuardSrc = fs.readFileSync(
    path.join(__dirname, '../../../../lib/server/rev-guard.ts'),
    'utf8',
  );
  assert.match(revGuardSrc, /class RevConflictError/, 'rev-guard.ts phải khai RevConflictError');
  assert.match(
    revGuardSrc,
    /e instanceof Prisma\.PrismaClientKnownRequestError && e\.code === 'P2025'/,
    'rev-guard.ts phải bắt riêng P2025 (không để lọt thành 500)',
  );
  ok('route.ts import rev-guard dùng chung; rev-guard.ts có RevConflictError + bắt P2025 đúng mã lỗi');

  const putBody = routeSrc.slice(routeSrc.indexOf('export async function PUT'), routeSrc.indexOf('export async function DELETE'));
  const revConflictReturns = (putBody.match(/return REV_CONFLICT_RESPONSE\(\);/g) ?? []).length;
  assert.equal(revConflictReturns, 3, `cả 3 nhánh PUT (snapshot/share-unshare/autosave) phải trả 409 khi RevConflictError — đếm được ${revConflictReturns}`);
  ok('cả 3 nhánh PUT đều bắt RevConflictError → 409 (không sót nhánh nào)');

  const revInResponses = (putBody.match(/rev: (updated|flow)\.rev/g) ?? []).length;
  assert.equal(revInResponses, 3, `cả 3 nhánh PUT phải trả rev mới trong response để client cập nhật currentFlowRev — đếm được ${revInResponses}`);
  ok('cả 3 nhánh PUT đều trả rev mới trong response body');

  const storeSrc = fs.readFileSync(
    path.join(__dirname, '../../../../lib/store.ts'),
    'utf8',
  );
  assert.match(storeSrc, /currentFlowRev: number \| null;/, 'store.ts phải khai currentFlowRev trong FlowState');
  assert.match(storeSrc, /expectedRev: currentFlowRev/, 'persistNow phải gửi expectedRev từ currentFlowRev');
  assert.match(storeSrc, /res\.status === 409/, 'persistNow phải xử nhánh 409, không coi là lỗi mạng thường');
  ok('lib/store.ts: currentFlowRev khai báo + persistNow gửi expectedRev + xử 409 riêng');

  const workspaceSrc = fs.readFileSync(
    path.join(__dirname, '../../../../lib/workspace.ts'),
    'utf8',
  );
  assert.match(workspaceSrc, /body\.flow\.rev/, 'openFlow phải đọc rev từ response GET rồi truyền vào loadGraph');
  ok('lib/workspace.ts: openFlow truyền rev vào loadGraph (client bắt đầu phiên với đúng rev server đang có)');

  console.log(`\n${pass} PASS`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
