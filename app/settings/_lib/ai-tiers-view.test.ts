/**
 * app/settings/_lib/ai-tiers-view.test.ts — bốn mức AI + năng lực provider suy từ registry thật.
 * Chạy: node_modules/.bin/sucrase-node app/settings/_lib/ai-tiers-view.test.ts
 */
import { AI_TASKS } from '../../../lib/ai/models';
import { fourTierOf, fourTierViews, PROVIDER_FACTS, probeProviders, providerCapabilities, redactSecrets } from './ai-tiers-view';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const views = fourTierViews('flux');
ok('đúng 4 mức theo nghĩa, thứ tự tất định → cục bộ → kết nối → tổ hợp',
  views.map((v) => v.id).join() === 'deterministic,local,connected,orchestrated');
ok('4 mức aiTier hiện có đều được phủ (1·2·3·4)', [1, 2, 3, 4].every((t) => views.some((v) => v.aiTiers.includes(t as 1))));
ok('mức tổ hợp NÓI THẬT chưa có nấc toàn cục (aiTiers rỗng) nhưng có bằng chứng theo khối',
  views[3].aiTiers.length === 0 && views[3].evidence.length >= 2);
ok('tất định: không provider, offline, không dữ liệu rời máy', views[0].providers.length === 0 && views[0].offline && views[0].privacy === 'none');
ok('cục bộ theo engine: flux → comfyui, sd → sd', views[1].providers.join() === 'comfyui' && fourTierViews('sd')[1].providers.join() === 'sd');
ok('kết nối: fal, cloud, không offline', views[2].providers.join() === 'fal' && views[2].privacy === 'cloud' && !views[2].offline);
ok('ánh xạ aiTier → nghĩa', fourTierOf(1) === 'deterministic' && fourTierOf(2) === 'local' && fourTierOf(3) === 'connected' && fourTierOf(4) === 'connected');

const all = Object.keys(AI_TASKS).length;
const fal = providerCapabilities('fal');
const comfy = providerCapabilities('comfyui');
const sd = providerCapabilities('sd');
ok(`fal chạy mọi task (${fal.tasks.length}/${all})`, fal.tasks.length === all && fal.missing.length === 0);
ok('fal có video, cục bộ không có video (Kling chỉ cloud)', fal.video && !comfy.video && !sd.video);
ok('comfyui thiếu task (video/relight/…) và KHAI ra, không giấu', comfy.missing.length > 0 && comfy.tasks.length + comfy.missing.length === all);
ok(`comfyui = nhiều workflow (${comfy.workflows.length}), không phải "1 model"`, comfy.workflows.length >= 4);
ok('sd mượn workflow comfy khi không có bản sd → tập task ⊇ comfy', comfy.tasks.every((t) => sd.tasks.includes(t)));
ok('mọi provider có facts: env chỉ là TÊN biến, không giá trị', (['fal', 'comfyui', 'sd'] as const).every((p) => PROVIDER_FACTS[p].envVars.every((v) => !v.includes('='))));
ok('ComfyUI khai đúng bản chất máy chạy workflow', PROVIDER_FACTS.comfyui.kind === 'workflow-runner');

ok('redact: FAL_KEY=abc → che', redactSecrets('FAL_KEY=abc123').includes('•••') && !redactSecrets('FAL_KEY=abc123').includes('abc123'));
ok('redact: Bearer token → che', !redactSecrets('Authorization Bearer sk-live-xyz').includes('sk-live'));
ok('redact: chuỗi thường giữ nguyên', redactSecrets('COMFYUI_URL chưa cấu hình') === 'COMFYUI_URL chưa cấu hình');

(async () => {
  const fakeFetch = (async () => ({ ok: true, json: async () => ({ providers: { fal: true, comfyui: false, sd: false }, FAL_KEY: 'leak?' }) })) as unknown as typeof fetch;
  const r = await probeProviders(fakeFetch);
  ok('probe: chỉ trả boolean từng provider, không mang field lạ', r.ok && r.providers.length === 3 && r.providers[0].configured && !r.providers[1].configured && !('FAL_KEY' in r));
  const boom = (async () => { throw new Error('ECONNREFUSED'); }) as unknown as typeof fetch;
  const e = await probeProviders(boom);
  ok('probe lỗi mạng → ok:false + error, mọi provider false, không throw', !e.ok && e.error?.includes('ECONNREFUSED') === true && e.providers.every((p) => !p.configured));
  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail) process.exit(1);
})();
