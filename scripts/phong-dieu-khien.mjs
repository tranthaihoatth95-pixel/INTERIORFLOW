#!/usr/bin/env node
/**
 * phong-dieu-khien.mjs — PHÒNG ĐIỀU KHIỂN CHẠY TẠI MÁY.
 *
 * ══ VÌ SAO KHÔNG PHẢI ARTIFACT ══
 * Hoà 30/08: *"thay vì đổ thông báo — diễn biến ở dạng hoạt ảnh realtime → thêm nút để tôi có thể
 * điều khiển đã thông mạch khi kẹt đi."*
 *
 * Bản artifact xuất bản hôm nay vẽ được diễn biến, nhưng nó chạy trong **hộp cát không có mạng ra
 * ngoài**: không đọc được repo, không chạy được lệnh. Nút trên đó sẽ là **nút giả** — và nút giả
 * tệ hơn không có nút, vì người bấm tưởng mình vừa làm gì đó.
 * ⇒ Trang này chạy tại máy, đọc trạng thái THẬT, và nút bấm chạy lệnh THẬT.
 *
 * ══ AN TOÀN — đọc trước khi thêm nút mới ══
 *  · Chỉ nghe trên `127.0.0.1`. Không ra mạng, không ai ngoài máy này gọi được.
 *  · **Danh sách hành động ĐÓNG.** Trang web KHÔNG gửi lệnh; nó gửi một cái TÊN trong bảng dưới.
 *    Không có đường nào để một chuỗi từ trình duyệt thành lệnh shell.
 *  · Dùng `execFile`, KHÔNG dùng `shell` — nên dấu `;` `&&` `$()` trong tham số là vô nghĩa.
 *  · Tham số lọc bằng khuôn chặt (`^[0-9]{2}$` cho lane, `^HO-[0-9]{14}-[0-9a-f]{12}$` cho phiếu).
 *  · **CẤM ở đây, có chủ ý:** `git push` · `git commit` · mọi lệnh chạm DB · `electron:publish` ·
 *    `rm`. Những thứ đó phải có người đọc diff, không phải một cú bấm.
 *
 * Chạy:  node scripts/phong-dieu-khien.mjs      → http://127.0.0.1:4173
 */

import { createServer } from 'node:http';
import { execFile, execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAU = path.join(process.env.BOS_SHARED_LOG_ROOT || path.join(os.homedir(), 'PROJECT/SHARED/LOG'),
  'agent-handoffs.jsonl');
const CONG = 4173;
const LANES = ['00', '03', '05', '06', '07'];

const chay = (cmd, args, cwd = REPO) => {
  try { return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return ''; }
};

/* ══ TRẠNG THÁI THẬT ══ */
function trangThai() {
  const suKien = existsSync(CAU)
    ? readFileSync(CAU, 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } })
    : [];
  const acked = new Set(suKien.filter((e) => e.type === 'ACK').map((e) => e.handoffId));
  const seen = new Set(suKien.filter((e) => e.type === 'SEEN').map((e) => e.handoffId));
  const sent = new Set(suKien.filter((e) => e.type === 'SENT').map((e) => e.handoffId));

  const lane = LANES.map((id) => {
    const mo = suKien.filter((e) => e.type === 'HANDOFF' && e.to === id && !acked.has(e.id));
    return {
      id,
      phieu: mo.map((e) => ({
        id: e.id, topic: e.topic, from: e.from,
        mat: acked.has(e.id) ? 'ACK' : seen.has(e.id) ? 'SEEN' : sent.has(e.id) ? 'SENT' : 'HANDOFF',
      })),
    };
  });

  const truoc = chay('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  return {
    luc: new Date().toISOString(),
    git: {
      nhanh: chay('git', ['branch', '--show-current']),
      head: chay('git', ['rev-parse', '--short', 'HEAD']),
      ban: chay('git', ['status', '--porcelain']).split('\n').filter(Boolean).length,
      chuaDay: truoc ? Number(chay('git', ['rev-list', '--count', `${truoc}..HEAD`]) || 0) : null,
    },
    devServer: !!chay('lsof', ['-nP', '-iTCP:3000', '-sTCP:LISTEN']),
    lane,
    tongPhieuMo: lane.reduce((a, l) => a + l.phieu.length, 0),
  };
}

/* ══ DANH SÁCH HÀNH ĐỘNG — ĐÓNG. Thêm mục là thêm quyền, cân nhắc kỹ. ══ */
const KHUON_LANE = /^[0-9]{2}$/;
const KHUON_PHIEU = /^HO-[0-9]{14}-[0-9a-f]{12}$/;

const VIEC = {
  'bao-nhan': {
    nhan: 'Báo nhận phiếu', y: 'ghi ACK — phiếu thôi lặp lại trong hộp thư',
    lam: (p) => (KHUON_LANE.test(p.lane || '') && KHUON_PHIEU.test(p.phieu || ''))
      ? ['node', ['scripts/moc.mjs', 'ack', p.lane, p.phieu]] : null,
  },
  'danh-thuc': {
    nhan: 'Đánh thức lane', y: 'ghi một phiếu nhắc vào hộp thư của lane đó',
    lam: (p) => KHUON_LANE.test(p.lane || '')
      ? ['node', ['scripts/moc.mjs', 'handoff', '00', p.lane, 'NHẮC — có phiếu đang chờ',
          'Gửi từ phòng điều khiển. Chạy `node scripts/moc.mjs inbox ' + p.lane + '` để xem việc của bạn.',
          chay('git', ['rev-parse', '--short', 'HEAD'])]] : null,
  },
  'dung-dev': {
    nhan: 'Dừng máy chủ dev', y: 'giải phóng .next để chạy được chuỗi dựng sạch — đúng chỗ lane 07 kẹt',
    lam: () => {
      const pid = chay('lsof', ['-nP', '-iTCP:3000', '-sTCP:LISTEN', '-t']).split('\n')[0];
      return /^[0-9]+$/.test(pid) ? ['kill', [pid]] : null;
    },
  },
  'soi-con-tro': { nhan: 'Soi con trỏ', y: 'nguồn đã chưng cất có đường về không', lam: () => ['node', ['scripts/soi-con-tro.mjs']] },
  'soi-route-dev': { nhan: 'Soi route thử', y: 'route dev nào lọt được vào bản phát hành', lam: () => ['node', ['scripts/soi-route-dev.mjs']] },
  'soi-tep-nang': { nhan: 'Soi tệp nặng', y: 'tệp >90MB và mọi bản sao CSDL trong git', lam: () => ['node', ['scripts/soi-tep-nang.mjs']] },
  'soi-thu-muc': { nhan: 'Soi thư mục', y: 'đồ dự án có rơi ra gốc Tải về không', lam: () => ['node', ['scripts/soi-thu-muc.mjs']] },
  'soi-chu-viet': { nhan: 'Soi chữ Việt', y: 'vi phạm luật chữ có dấu, so với trần', lam: () => ['node', ['scripts/soi-chu-viet.mjs']] },
};

function nghe(req, res) {
  const url = new URL(req.url, `http://127.0.0.1:${CONG}`);
  const json = (m, o) => { res.writeHead(m, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(o)); };

  if (url.pathname === '/api/trang-thai') return json(200, trangThai());

  if (url.pathname === '/api/viec' && req.method === 'GET')
    return json(200, Object.entries(VIEC).map(([k, v]) => ({ ma: k, nhan: v.nhan, y: v.y })));

  if (url.pathname === '/api/lam' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 4096) req.destroy(); });
    req.on('end', () => {
      let p; try { p = JSON.parse(body || '{}'); } catch { return json(400, { loi: 'JSON hỏng' }); }
      const v = VIEC[p.ma];
      if (!v) return json(400, { loi: `Không có việc tên "${p.ma}". Danh sách ĐÓNG, không nhận lệnh tự do.` });
      const lenh = v.lam(p);
      if (!lenh) return json(400, { loi: 'Tham số không hợp khuôn, hoặc không có gì để làm.' });
      execFile(lenh[0], lenh[1], { cwd: REPO, timeout: 120000 }, (err, out, errOut) => {
        json(200, { ma: p.ma, ok: !err, ra: (out || errOut || '').slice(-4000), lenh: `${lenh[0]} ${lenh[1].slice(0, 3).join(' ')}…` });
      });
    });
    return;
  }

  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(TRANG);
}

const TRANG = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Phòng điều khiển IF</title>
<style>
:root{--bg:#0c0c0e;--panel:#141417;--field:#202024;--line:#2a2a31;--t1:#f5f5f7;--t2:#d6d6db;
 --t3:#9e9ea8;--t4:#6e6e78;--ac:#8b7bf7;--acs:rgba(106,87,245,.18);--ok:#46b876;--warn:#d9a34a;--bad:#e5674f;
 --rf:999px;--r3:14px;--r4:20px}
@media(prefers-color-scheme:light){:root{--bg:#f2f2f7;--panel:#f9f9fb;--field:#f4f4f9;--line:#e2e2ea;
 --t1:#1d1d24;--t2:#43434e;--t3:#6c6c78;--t4:#93939f;--ac:#553ff3;--acs:rgba(85,63,243,.12);
 --ok:#107043;--warn:#9a6304;--bad:#c9341d}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--t1);line-height:1.5;
 font-family:-apple-system,'SF Pro Text','Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding:36px 24px 64px;display:flex;flex-direction:column;gap:30px}
.num{font-variant-numeric:tabular-nums}
.eye{font-size:12px;letter-spacing:.15em;color:var(--t4)}
h1{margin:8px 0 0;font-size:28px;font-weight:600;letter-spacing:-.02em}
h2{margin:0;font-size:17px;font-weight:600;letter-spacing:-.01em}
.card{background:linear-gradient(155deg,rgba(255,255,255,.055),rgba(255,255,255,.018));
 box-shadow:0 0 0 1px var(--line),0 18px 40px -24px rgba(0,0,0,.75);border-radius:var(--r3);
 -webkit-backdrop-filter:blur(22px) saturate(150%);backdrop-filter:blur(22px) saturate(150%)}
.pad{padding:18px}
.g{display:grid;gap:12px}
.g3{grid-template-columns:repeat(3,minmax(0,1fr))}
.g5{grid-template-columns:repeat(5,minmax(0,1fr))}
@media(max-width:820px){.g3,.g5{grid-template-columns:1fr 1fr}}
.big{font-size:26px;font-weight:600;letter-spacing:-.02em}
.cap{font-size:12px;color:var(--t4);margin-top:5px}
.pill{display:inline-flex;align-items:center;gap:6px;border-radius:var(--rf);padding:4px 10px;
 font-size:12px;background:var(--field);color:var(--t3)}
.dot{width:7px;height:7px;border-radius:var(--rf)}
/* mạch cầu — chỉ chạy khi CÓ phiếu đang mở */
.track{position:relative;height:3px;border-radius:var(--rf);background:var(--line);margin:16px 0 18px;overflow:hidden}
.spark{position:absolute;top:-3px;left:-16%;width:16%;height:9px;border-radius:var(--rf);
 background:linear-gradient(90deg,transparent,var(--ac),transparent);filter:blur(1px);
 animation:chay 4.4s linear infinite}
.spark.b{animation-delay:1.5s}.spark.c{animation-delay:2.9s}
@keyframes chay{to{left:116%}}
.track.im .spark{animation:none;opacity:0}
@media(prefers-reduced-motion:reduce){.spark{animation:none;left:44%}}
.mat{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:11.5px;letter-spacing:.1em;color:var(--t4)}
.lane{padding:14px;display:flex;flex-direction:column;gap:8px}
.lane .id{font-size:14px;font-weight:600}
.ph{font-size:11.5px;color:var(--t3);font-family:ui-monospace,'SF Mono',Menlo,monospace;
 word-break:break-all;line-height:1.5}
button{font:inherit;cursor:pointer;border:0;border-radius:var(--rf);padding:9px 14px;font-size:13px;
 background:var(--field);color:var(--t2);transition:background .14s,color .14s}
button:hover{background:var(--acs);color:var(--ac)}
button:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
button.chinh{background:var(--acs);color:var(--ac)}
button[disabled]{opacity:.45;cursor:not-allowed}
.nut{display:flex;flex-wrap:wrap;gap:9px}
.ra{margin:0;padding:14px 16px;background:var(--field);border-radius:var(--r3);font-size:12px;
 font-family:ui-monospace,'SF Mono',Menlo,monospace;white-space:pre-wrap;color:var(--t2);
 max-height:340px;overflow:auto;line-height:1.55}
.sub{font-size:12.5px;color:var(--t4)}
</style></head><body><div class="wrap">

<header>
  <div class="eye">INTERIORFLOW · PHÒNG ĐIỀU KHIỂN · CHẠY TẠI MÁY</div>
  <h1>Diễn biến, và nút để thông mạch</h1>
  <p class="sub" style="margin:10px 0 0">Đọc trạng thái thật mỗi 2 giây. Nút bấm chạy lệnh thật —
  danh sách hành động là <b style="color:var(--t2)">đóng</b>, trang này không gửi lệnh tự do.</p>
</header>

<section class="g g3">
  <div class="card pad"><div class="big num" id="s-head">…</div><div class="cap" id="s-nhanh">nhánh</div></div>
  <div class="card pad"><div class="big num" id="s-phieu">…</div><div class="cap">phiếu đang mở trên cầu</div></div>
  <div class="card pad"><div class="big" id="s-dev">…</div><div class="cap">máy chủ dev cổng 3000</div></div>
</section>

<section style="display:flex;flex-direction:column;gap:12px">
  <h2>Cầu bàn giao</h2>
  <div class="card pad">
    <div class="mat"><span>HANDOFF</span><span>SENT</span><span>SEEN</span><span>ACK</span></div>
    <div class="track im" id="track"><i class="spark"></i><i class="spark b"></i><i class="spark c"></i></div>
    <div class="g g5" id="lanes"></div>
  </div>
</section>

<section style="display:flex;flex-direction:column;gap:12px">
  <h2>Thông mạch</h2>
  <div class="card pad" style="display:flex;flex-direction:column;gap:14px">
    <div class="nut" id="nut"></div>
    <pre class="ra" id="ra">Chưa chạy gì. Bấm một nút ở trên.</pre>
  </div>
</section>

</div><script>
const $=s=>document.querySelector(s);
let dangChay=false;

async function ve(){
  let d; try{ d=await (await fetch('/api/trang-thai')).json(); }catch{ return; }
  $('#s-head').textContent=d.git.head||'—';
  $('#s-nhanh').textContent=(d.git.nhanh||'—')+' · '+d.git.ban+' bẩn'+
    (d.git.chuaDay===null?'':' · '+d.git.chuaDay+' chưa đẩy');
  $('#s-phieu').textContent=d.tongPhieuMo;
  $('#s-dev').innerHTML=d.devServer
    ? '<span style="color:var(--ok)">đang chạy</span>' : '<span style="color:var(--t4)">tắt</span>';
  $('#track').classList.toggle('im', d.tongPhieuMo===0);

  $('#lanes').innerHTML=d.lane.map(l=>{
    const n=l.phieu.length;
    const mau=n===0?'var(--t4)':l.phieu.some(p=>p.mat==='HANDOFF')?'var(--bad)':'var(--warn)';
    return '<div class="card lane"><div style="display:flex;justify-content:space-between;align-items:center">'
      +'<span class="id">'+l.id+'</span>'
      +'<span class="pill"><span class="dot" style="background:'+mau+'"></span>'+(n||'—')+'</span></div>'
      +(n? '<div class="ph">'+l.phieu.map(p=>p.mat+' · '+p.topic.slice(0,42)).join('<br>')+'</div>'
         : '<div class="sub">hộp thư rỗng</div>')
      +(n? '<button data-ma="bao-nhan" data-lane="'+l.id+'" data-phieu="'+l.phieu[0].id+'">Báo nhận phiếu đầu</button>'
         : '<button data-ma="danh-thuc" data-lane="'+l.id+'">Đánh thức</button>')
      +'</div>';
  }).join('');
}

async function veNut(){
  const v=await (await fetch('/api/viec')).json();
  $('#nut').innerHTML=v.filter(x=>x.ma.startsWith('soi')||x.ma==='dung-dev')
    .map(x=>'<button class="'+(x.ma==='dung-dev'?'chinh':'')+'" data-ma="'+x.ma+'" title="'+x.y+'">'+x.nhan+'</button>').join('');
}

document.addEventListener('click',async e=>{
  const b=e.target.closest('button[data-ma]'); if(!b||dangChay) return;
  dangChay=true; const cu=b.textContent; b.textContent='đang chạy…';
  document.querySelectorAll('button').forEach(x=>x.disabled=true);
  try{
    const r=await (await fetch('/api/lam',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({ma:b.dataset.ma,lane:b.dataset.lane,phieu:b.dataset.phieu})})).json();
    $('#ra').textContent=(r.ok===false?'⚠️ lệnh trả mã lỗi\\n\\n':'')+(r.ra||r.loi||'(không có đầu ra)');
  }catch(err){ $('#ra').textContent='Không gọi được máy chủ: '+err.message; }
  document.querySelectorAll('button').forEach(x=>x.disabled=false);
  b.textContent=cu; dangChay=false; ve();
});

veNut(); ve(); setInterval(ve,2000);
</script></body></html>`;

createServer(nghe).listen(CONG, '127.0.0.1', () => {
  console.log(`\n  Phòng điều khiển IF  →  http://127.0.0.1:${CONG}`);
  console.log(`  Đọc trạng thái thật mỗi 2 giây. Danh sách hành động ĐÓNG (${Object.keys(VIEC).length} việc).`);
  console.log('  Ctrl+C để tắt.\n');
});
