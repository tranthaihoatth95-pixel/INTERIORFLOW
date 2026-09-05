/**
 * lib/nodes/provenance.test.ts — khoá: mock KHÔNG BAO GIỜ được đọc thành kết quả thật, và tầng
 * ghi trong `_tier` là nguồn ưu tiên. Chạy: node_modules/.bin/sucrase-node lib/nodes/provenance.test.ts
 */
import { deriveProvenance, isTrustworthy, looksLikeMockImage } from './provenance';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const mockSvg = `data:image/svg+xml;utf8,${encodeURIComponent('<svg><text>Sketch · mock</text></svg>')}`;
const realPng = 'data:image/png;base64,iVBORw0KGgo=';

ok('SVG có chữ mock → là mock', looksLikeMockImage({ dataType: 'image', value: mockSvg }));
ok('PNG thật → không phải mock', !looksLikeMockImage({ dataType: 'image', value: realPng }));
ok('SVG tất định không chữ mock (vd thẻ vật liệu) → không phải mock',
  !looksLikeMockImage({ dataType: 'image', value: `data:image/svg+xml;utf8,${encodeURIComponent('<svg>Đá travertine</svg>')}` }));

const none = deriveProvenance({ run: { status: 'running', progress: 0 } as never, creditCost: 4 });
ok('đang chạy → none, không cache', none.kind === 'none' && !none.cached);

const ai = deriveProvenance({ run: { status: 'done', inputHash: 'h', outputs: { image: { dataType: 'image', value: realPng }, _tier: { dataType: 'text', value: 'Tầng AI · BiRefNet v2 (tách nền)' } } }, creditCost: 0 });
ok('_tier "Tầng AI" thắng creditCost=0 → ai, có detail, cached', ai.kind === 'ai' && ai.detail?.includes('BiRefNet') === true && ai.cached);

const det = deriveProvenance({ run: { status: 'done', inputHash: 'h', outputs: { image: { dataType: 'image', value: realPng }, _tier: { dataType: 'text', value: 'Tầng lõi tất định (chỉnh pixel)' } } }, creditCost: 4 });
ok('_tier "tất định" thắng creditCost>0 → deterministic', det.kind === 'deterministic');

const mock = deriveProvenance({ run: { status: 'done', inputHash: 'h', outputs: { image: { dataType: 'image', value: mockSvg } } }, creditCost: 4 });
ok('ảnh mock không _tier → mock, KHÔNG đáng tin', mock.kind === 'mock' && !isTrustworthy(mock));

const zero = deriveProvenance({ run: { status: 'done', inputHash: 'h', outputs: { text: { dataType: 'text', value: '{}' } } }, creditCost: 0 });
ok('0 credit, không _tier, không mock → deterministic', zero.kind === 'deterministic' && isTrustworthy(zero));

const unl = deriveProvenance({ run: { status: 'done', inputHash: 'h', outputs: { image: { dataType: 'image', value: realPng } } }, creditCost: 4 });
ok('tốn credit, done, không _tier → ai-unlabelled (nói thật là không biết tầng)', unl.kind === 'ai-unlabelled');

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
