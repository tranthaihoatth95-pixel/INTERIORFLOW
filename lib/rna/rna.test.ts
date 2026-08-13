/**
 * lib/rna/rna.test.ts — IfRna v0: máy canh drift định nghĩa MaterialPbr ↔ registry RNA +
 * parity hành vi ghi (ifRnaWrite ≡ setRoughness của material-edit.ts).
 * Chạy: node_modules/.bin/sucrase-node lib/rna/rna.test.ts
 */
import { MATERIAL_PBR_RNA } from './material-pbr.rna';
import { ifRnaWrite, ifRnaField, ifRnaDecimals, type IfRnaField } from './types';
import { MATERIAL_PBR_KEYS, type MaterialPbr } from '../materials/schema';
import { setRoughness } from '../materials/material-edit';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('ĐỦ KEY — registry khớp keyof MaterialPbr, không thừa không thiếu (máy canh drift)');
{
  const defKeys = MATERIAL_PBR_RNA.map((f) => f.key);
  const defSet = new Set<string>(defKeys);
  const schemaSet = new Set<string>(MATERIAL_PBR_KEYS);
  ok('không có key trùng trong registry', defSet.size === defKeys.length);
  const thieu = MATERIAL_PBR_KEYS.filter((k) => !defSet.has(k));
  const thua = defKeys.filter((k) => !schemaSet.has(k));
  ok(`không thiếu key (thiếu: ${thieu.join(',') || '∅'})`, thieu.length === 0);
  ok(`không thừa key (thừa: ${thua.join(',') || '∅'})`, thua.length === 0);
}

console.log('TỪNG FIELD — min≤max · label/group đủ vi+en · anTheo trỏ key có thật');
for (const f of MATERIAL_PBR_RNA) {
  if (f.min !== undefined && f.max !== undefined) {
    ok(`${f.key}: min ${f.min} ≤ max ${f.max}`, f.min <= f.max);
  }
  ok(`${f.key}: label đủ vi/en`, f.label.vi.length > 0 && f.label.en.length > 0);
  ok(`${f.key}: group đủ vi/en`, f.group.vi.length > 0 && f.group.en.length > 0);
  for (const a of f.anTheo ?? []) {
    ok(`${f.key}: anTheo '${a}' là key MaterialPbr thật`, (MATERIAL_PBR_KEYS as readonly string[]).includes(a));
  }
}

console.log('ROUND-TRIP — ghi 1 giá trị qua defs không làm MẤT trường nào khác');
{
  const full: MaterialPbr = {
    baseColor: '#aa8866', roughness: 0.6, metallic: 0, specular: 0.04,
    normalUrl: 'n', heightUrl: 'h', aoUrl: 'a',
    baseColorMapUrl: 'b', roughnessMapUrl: 'r', metallicMapUrl: 'm',
    uvScaleMm: { w: 600, h: 600 },
    emissive: { color: '#ffffff', intensity: 2 },
    opacity: { value: 1, mode: 'blend' },
    transmission: { value: 0.9, ior: 1.5 },
    clearcoat: { value: 0.3, roughness: 0.1 },
    sheen: 0.2, reflectance: 0.4, suyDoan: true, typeId: 'go',
  };
  const rough = ifRnaField(MATERIAL_PBR_RNA, 'roughness');
  const next = ifRnaWrite(rough, full, 0.8);
  const giu = (Object.keys(full) as (keyof MaterialPbr)[])
    .filter((k) => k !== 'roughness' && k !== 'suyDoan')
    .every((k) => next[k] === full[k]);
  ok('mọi trường khác giữ nguyên tham chiếu', giu);
  ok('roughness ghi đúng 0.8', next.roughness === 0.8);
  ok('suyDoan bị xoá (anTheo khai)', !('suyDoan' in next));
  ok('không sửa tại chỗ (KS4)', full.roughness === 0.6 && full.suyDoan === true);
}

console.log('PARITY — ifRnaWrite(roughness) ≡ setRoughness của material-edit.ts (hành vi giữ nguyên)');
{
  const rough = ifRnaField(MATERIAL_PBR_RNA, 'roughness');
  const base: MaterialPbr = { roughness: 0.5, suyDoan: true, baseColor: '#abcabc' };
  for (const v of [-0.2, 0, 0.37, 1, 1.7]) {
    const a = ifRnaWrite(rough, base, v);
    const b = setRoughness(base, v);
    ok(`v=${v}: cùng kết quả (${JSON.stringify(a)})`, JSON.stringify(a) === JSON.stringify(b));
  }
}

console.log('CLAMP — ghi ngoài miền bị kẹp theo min/max của def');
{
  const sheen = ifRnaField(MATERIAL_PBR_RNA, 'sheen');
  const trong: MaterialPbr = {};
  ok('sheen 1.5 → 1', ifRnaWrite(sheen, trong, 1.5).sheen === 1);
  ok('sheen -1 → 0', ifRnaWrite(sheen, trong, -1).sheen === 0);
  ok('sheen KHÔNG xoá suyDoan (anTheo không khai — panel tay cũ cũng không xoá)',
    ifRnaWrite(sheen, { suyDoan: true } as MaterialPbr, 0.5).suyDoan === true);
}

console.log('HIỂN THỊ — số thập phân suy từ step MỘT chỗ');
{
  ok('step 0.01 → 2 chữ số', ifRnaDecimals(ifRnaField(MATERIAL_PBR_RNA, 'roughness') as IfRnaField<never>) === 2);
  ok('step 0.1 → 1 chữ số', ifRnaDecimals(ifRnaField(MATERIAL_PBR_RNA, 'emissive') as IfRnaField<never>) === 1);
  ok('step 1 → 0 chữ số', ifRnaDecimals(ifRnaField(MATERIAL_PBR_RNA, 'metallic') as IfRnaField<never>) === 0);
}

console.log('ifRnaField — key lạ throw ngay, không im lặng');
{
  let threw = false;
  try { ifRnaField(MATERIAL_PBR_RNA, 'khongCo' as never); } catch { threw = true; }
  ok('throw cho key không có def', threw);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
