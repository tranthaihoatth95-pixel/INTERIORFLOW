/**
 * lib/materials/pbr-migration.test.ts — canh `migratePbrLegacyToCanonical()` (pbr-store.ts,
 * bước 2A 19/08). Chạy: node_modules/.bin/sucrase-node lib/materials/pbr-migration.test.ts
 */
import {
  migratePbrLegacyToCanonical, ensurePbrCanonicalKeys, normalizeMatId,
  type PbrMigrationSpec, type PbrStoreIo,
} from './pbr-store';
import type { MaterialPbr } from './schema';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const UUID_A = 'a1b2c3d4-e5f6-4789-8abc-def012345678';
const UUID_B = 'b2c3d4e5-f6a7-4890-9bcd-ef0123456789';

console.log('legacy SKU key → UUID key copy');
{
  const legacyPbr: MaterialPbr = { typeId: 'da-tu-nhien', roughness: 0.42, metallic: 0 };
  const pbrMap = { [normalizeMatId('SW-TRV-BE')]: legacyPbr };
  const specs: PbrMigrationSpec[] = [{ sku: 'SW-TRV-BE', matId: UUID_A }];
  const { map, report } = migratePbrLegacyToCanonical(pbrMap, specs);
  ok('canonical key được tạo', UUID_A in map);
  ok('giá trị copy đúng (cùng object PBR)', map[UUID_A] === legacyPbr);
  ok('report.migrated = 1', report.migrated === 1);
  ok('report.alreadyCanonical = 0', report.alreadyCanonical === 0);
  ok('report.skippedNoLegacy = 0', report.skippedNoLegacy === 0);
}

console.log('canonical UUID đã tồn tại → thắng, KHÔNG bị ghi đè');
{
  const legacyPbr: MaterialPbr = { roughness: 0.1, metallic: 1 };
  const canonicalPbr: MaterialPbr = { roughness: 0.9, metallic: 0 };
  const pbrMap = { [normalizeMatId('OAK-1')]: legacyPbr, [UUID_A]: canonicalPbr };
  const specs: PbrMigrationSpec[] = [{ sku: 'OAK-1', matId: UUID_A }];
  const { map, report } = migratePbrLegacyToCanonical(pbrMap, specs);
  ok('canonical KHÔNG đổi', map[UUID_A] === canonicalPbr);
  ok('report.alreadyCanonical = 1', report.alreadyCanonical === 1);
  ok('report.migrated = 0', report.migrated === 0);
}

console.log('chạy lại (rerun) idempotent — kết quả không đổi lần hai');
{
  const legacyPbr: MaterialPbr = { roughness: 0.5 };
  const pbrMap = { [normalizeMatId('WAL-9')]: legacyPbr };
  const specs: PbrMigrationSpec[] = [{ sku: 'WAL-9', matId: UUID_B }];
  const first = migratePbrLegacyToCanonical(pbrMap, specs);
  ok('lần 1 migrated = 1', first.report.migrated === 1);
  const second = migratePbrLegacyToCanonical(first.map, specs);
  ok('lần 2 migrated = 0 (đã có canonical)', second.report.migrated === 0);
  ok('lần 2 alreadyCanonical = 1', second.report.alreadyCanonical === 1);
  ok('map hai lần chạy giống nhau (idempotent)', second.map[UUID_B] === first.map[UUID_B]);
}

console.log('legacy key ĐƯỢC GIỮ LẠI, không bị xoá sau migration');
{
  const legacyPbr: MaterialPbr = { roughness: 0.3 };
  const pbrMap = { [normalizeMatId('GRN-2')]: legacyPbr };
  const specs: PbrMigrationSpec[] = [{ sku: 'GRN-2', matId: UUID_A }];
  const { map } = migratePbrLegacyToCanonical(pbrMap, specs);
  ok('legacy key vẫn còn', map[normalizeMatId('GRN-2')] === legacyPbr);
  ok('cả legacy lẫn canonical cùng tồn tại', normalizeMatId('GRN-2') in map && UUID_A in map);
}

console.log('chuẩn hoá HOA/THƯỜNG chỉ áp cho phía SKU (legacy) — UUID KHÔNG bị upperCase');
{
  const legacyPbr: MaterialPbr = { roughness: 0.7 };
  // pbrMap đã lưu dưới khoá normalizeMatId (upper) — sku gõ tay chữ thường vẫn phải khớp.
  const pbrMap = { [normalizeMatId('sw-trv-be')]: legacyPbr };
  const specs: PbrMigrationSpec[] = [{ sku: 'sw-trv-be', matId: UUID_A }];
  const { map } = migratePbrLegacyToCanonical(pbrMap, specs);
  ok('sku thường vẫn tìm ra legacy key (upper)', normalizeMatId('sw-trv-be') === 'SW-TRV-BE');
  ok('migrate thành công dù sku gõ thường', map[UUID_A] === legacyPbr);
  ok('canonical key GIỮ NGUYÊN lowercase của UUID, KHÔNG upperCase', UUID_A === UUID_A.toLowerCase());
  ok('khoá canonical trong map đúng y input UUID (không biến đổi case)', Object.prototype.hasOwnProperty.call(map, UUID_A));
  ok('KHÔNG có khoá UUID viết hoa nào lọt vào map', !(UUID_A.toUpperCase() in map));
}

console.log('không có PBR ở legacy key → skippedNoLegacy, không tạo canonical rác');
{
  const pbrMap: Record<string, MaterialPbr> = {};
  const specs: PbrMigrationSpec[] = [{ sku: 'KHONG-CO-PBR', matId: UUID_A }];
  const { map, report } = migratePbrLegacyToCanonical(pbrMap, specs);
  ok('report.skippedNoLegacy = 1', report.skippedNoLegacy === 1);
  ok('không tạo canonical rỗng', !(UUID_A in map));
}

console.log('dòng thiếu sku hoặc thiếu matId → bỏ qua, không đếm vào báo cáo nào');
{
  const pbrMap = { [normalizeMatId('X')]: { roughness: 0.2 } as MaterialPbr };
  const specs: PbrMigrationSpec[] = [
    { sku: null, matId: UUID_A },
    { sku: 'X', matId: null },
    { sku: 'X', matId: undefined },
  ];
  const { report } = migratePbrLegacyToCanonical(pbrMap, specs);
  ok('không dòng nào được xử lý', report.migrated === 0 && report.alreadyCanonical === 0 && report.skippedNoLegacy === 0);
}

/* ═══ [W0.2 19/08] ensurePbrCanonicalKeys — wrapper callsite, io tiêm được ═══ */
console.log('\nensurePbrCanonicalKeys: save CHỈ khi migrated > 0, rerun không ghi lại');
{
  const legacyPbr = { typeId: 'go', roughness: 0.5 } as MaterialPbr;
  let store: Record<string, MaterialPbr> = { [normalizeMatId('SKU-1')]: legacyPbr };
  let saves = 0;
  const io: PbrStoreIo = {
    load: () => ({ ...store }),
    save: (m) => { store = m; saves += 1; },
  };
  const specs: PbrMigrationSpec[] = [{ sku: 'SKU-1', matId: UUID_A }];

  const r1 = ensurePbrCanonicalKeys(specs, io);
  ok('lượt 1: migrated 1 + có ghi', r1?.migrated === 1 && saves === 1);
  ok('kho sau ghi: có canonical, legacy GIỮ NGUYÊN', UUID_A in store && normalizeMatId('SKU-1') in store);

  const r2 = ensurePbrCanonicalKeys(specs, io);
  ok('lượt 2 (rerun): migrated 0, KHÔNG ghi thêm', r2?.migrated === 0 && saves === 1);

  const r3 = ensurePbrCanonicalKeys([], io);
  ok('specs rỗng: report 0/0/0, không ghi', r3?.migrated === 0 && saves === 1);
}

console.log('\nensurePbrCanonicalKeys: SSR (không window, không io) → null, không nổ');
{
  ok('trả null trên môi trường không có localStorage', ensurePbrCanonicalKeys([{ sku: 'A', matId: UUID_B }]) === null);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
