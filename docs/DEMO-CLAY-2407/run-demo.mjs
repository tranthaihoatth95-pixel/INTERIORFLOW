// LIVE demo clay2render qua API InteriorFlow (cookie session, tier 4 fal FLUX Pro Depth)
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:3014';
const OUT = '/Users/tranben/Downloads/interiorflow-wt-clay2img-audit/docs/DEMO-CLAY-2407';

// đọc cookie từ jar curl
const jar = fs.readFileSync('/tmp/if-demo.jar', 'utf8');
const cookies = jar.split('\n').filter(l => l && !l.startsWith('#') || l.startsWith('#HttpOnly'))
  .map(l => l.replace(/^#HttpOnly_/, '').split('\t'))
  .filter(p => p.length >= 7)
  .map(p => `${p[5]}=${p[6]}`).join('; ');
if (!cookies) throw new Error('Không đọc được cookie từ /tmp/if-demo.jar');

const NEG = 'extra legs, extra stools, duplicated furniture, duplicate objects, cloned furniture, deformed furniture, malformed, warped geometry, floating objects, floating rods, skeletal furniture, broken chair legs, spindly legs, merged legs, cluttered, messy, recessed room, room within a room, doorway, archway, niche, passage, alcove, clashing colors, random stripes, gaudy, garish, oversaturated, blurry, lowres, distorted, watermark, text, signature, cartoon, cgi, overexposed, blown highlights';

const CASES = [
  {
    name: 'case1-lobby',
    file: '/Users/tranben/Downloads/interiorflow/2407-Test/cgi-clay-render.webp',
    mime: 'image/webp',
    prompt: 'modern hotel lobby, warm quiet-luxury interior, walnut wood slats, travertine reception desk, warm beige palette, soft daylight, photorealistic, keep exact same geometry, layout and camera, only add realistic materials, lighting and atmosphere',
  },
  {
    name: 'case2-livingroom',
    file: '/Users/tranben/Downloads/interiorflow/2407-Test/model-3dsmax-noi-that-1.jpg',
    mime: 'image/jpeg',
    prompt: 'scandinavian living room, warm oak floor, linen sofa, rattan armchair, warm afternoon sunlight through window, photorealistic interior photography, keep exact same geometry, layout and camera, only add realistic materials, lighting and atmosphere',
  },
];

async function api(pathname, opts = {}) {
  const res = await fetch(BASE + pathname, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Cookie: cookies, ...(opts.headers || {}) },
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

const results = [];
for (const c of CASES) {
  const b64 = fs.readFileSync(c.file).toString('base64');
  const dataUri = `data:${c.mime};base64,${b64}`;
  const t0 = Date.now();
  console.log(`[${c.name}] submit… (input ${(b64.length * 0.75 / 1024).toFixed(0)} KB)`);
  const sub = await api('/api/jobs', {
    method: 'POST',
    body: JSON.stringify({
      task: 'clay2render',
      tier: 4,
      input: {
        prompt: c.prompt,
        negative_prompt: NEG,
        control_image_url: dataUri,
        guidance_scale: 16,
        num_images: 1,
      },
    }),
  });
  console.log(`[${c.name}] submit → ${sub.status}`, JSON.stringify(sub.json).slice(0, 300));
  if (sub.status !== 200 || !sub.json.jobId) {
    results.push({ ...c, verdict: 'FAIL-SUBMIT', error: JSON.stringify(sub.json), httpStatus: sub.status });
    continue;
  }
  const { jobId, provider } = sub.json;
  let status, tries = 0;
  while (tries++ < 120) {
    await new Promise(r => setTimeout(r, 3000));
    const s = await api(`/api/jobs/${jobId}?task=clay2render&tier=4`);
    status = s.json;
    if (status.status === 'COMPLETED' || status.status === 'FAILED') break;
    if (tries % 5 === 0) console.log(`[${c.name}] poll ${tries}: ${status.status}`);
  }
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  if (!status || status.status !== 'COMPLETED') {
    results.push({ ...c, verdict: 'FAIL-PROVIDER', error: JSON.stringify(status), elapsed, jobId, provider });
    console.log(`[${c.name}] FAIL sau ${elapsed}s:`, JSON.stringify(status));
    continue;
  }
  const url = status.mediaUrls[0];
  const img = await fetch(url);
  const buf = Buffer.from(await img.arrayBuffer());
  const ext = (img.headers.get('content-type') || '').includes('png') ? 'png' : 'jpg';
  const outFile = path.join(OUT, `${c.name}-output.${ext}`);
  fs.writeFileSync(outFile, buf);
  // copy input
  fs.copyFileSync(c.file, path.join(OUT, `${c.name}-input${path.extname(c.file)}`));
  results.push({ ...c, verdict: 'OK', elapsed, jobId, provider, outFile, outUrl: url, outBytes: buf.length });
  console.log(`[${c.name}] OK ${elapsed}s → ${outFile} (${(buf.length / 1024).toFixed(0)} KB)`);
}
fs.writeFileSync(path.join(OUT, 'run-results.json'), JSON.stringify(results, null, 2));
console.log('DONE');
