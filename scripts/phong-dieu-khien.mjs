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
import { PHA, NGUOI, VIEC } from './bos-so-viec.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAU = path.join(process.env.BOS_SHARED_LOG_ROOT || path.join(os.homedir(), 'PROJECT/SHARED/LOG'),
  'agent-handoffs.jsonl');
const CONG = 4173;
const LANES = ['00', '03', '05', '06', '07'];

const chay = (cmd, args, cwd = REPO) => {
  try { return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return ''; }
};

/* ══ BỘ NHỚ ĐỆM KẾT QUẢ SOÁT ══
 * `soat-toan-dien` chạy cả `npm test` ⇒ ~60 giây. KHÔNG được chạy mỗi 2 giây.
 * Nên: trang vẽ kết quả ĐÃ ĐỆM, kèm dấu thời gian, và có nút chạy lại. Vẽ số cũ mà không nói nó
 * cũ là nói dối bằng giao diện — nên dấu thời gian luôn hiện. */
let DEM = { luc: null, dang: false, du: null };

function soatLai() {
  if (DEM.dang) return;
  DEM.dang = true;
  execFile('node', ['scripts/soat-toan-dien.mjs', '--json'], { cwd: REPO, timeout: 900000, maxBuffer: 8 * 1024 * 1024 },
    (err, out) => {
      try { DEM = { luc: new Date().toISOString(), dang: false, du: JSON.parse(out) }; }
      catch { DEM = { ...DEM, dang: false }; }
    });
}

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

/* ══ DANH SÁCH HÀNH ĐỘNG — ĐÓNG. Thêm mục là thêm quyền, cân nhắc kỹ. ══
 * Tên `HANH_DONG` chứ không phải `VIEC`: `VIEC` đã là ĐẦU VIỆC trong sổ `bos-so-viec.mjs`.
 * Hai thứ khác hẳn nhau — đầu việc là thứ phải làm xong; hành động là cái nút bấm được. */
const KHUON_LANE = /^[0-9]{2}$/;
const KHUON_PHIEU = /^HO-[0-9]{14}-[0-9a-f]{12}$/;

const HANH_DONG = {
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
  'chuan-nap': {
    nhan: 'Chạy chuẩn nạp DXF', y: '5 tiêu chí bảo toàn dữ liệu trên mọi DXF của repo — máy chấm, không cần mắt',
    lam: () => ['node_modules/.bin/sucrase-node', ['lib/cad/chuan-nap.test.ts']],
  },
  'soi-worker': {
    nhan: 'Soi chuỗi worker', y: 'worker kéo phải React/zustand là chết IM — giao diện quay mãi',
    lam: () => ['node', ['scripts/soi-worker-sach.mjs']],
  },
  'dung-lai-sach': {
    nhan: 'Dựng lại sạch + sinh biên nhận', y: 'dừng dev → đóng gói mac → biên nhận tự sinh cuối chuỗi (vài phút)',
    lam: () => {
      const pid = chay('lsof', ['-nP', '-iTCP:3000', '-sTCP:LISTEN', '-t']).split('\n')[0];
      if (/^[0-9]+$/.test(pid)) chay('kill', [pid]);   // giải phóng .next trước
      return ['npm', ['run', 'electron:pack:mac']];
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

  if (url.pathname === '/api/so-viec') {
    if (!DEM.luc && !DEM.dang) soatLai();
    return json(200, { luc: DEM.luc, dang: DEM.dang, pha: PHA, nguoi: NGUOI,
      viec: DEM.du ? DEM.du.viec : VIEC.map((v) => ({ ...v, kq: null })), tong: DEM.du?.tong ?? null });
  }
  if (url.pathname === '/api/soat-lai' && req.method === 'POST') { soatLai(); return json(200, { dang: true }); }

  if (url.pathname === '/api/viec' && req.method === 'GET')
    return json(200, Object.entries(HANH_DONG).map(([k, v]) => ({ ma: k, nhan: v.nhan, y: v.y })));

  if (url.pathname === '/api/lam' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 4096) req.destroy(); });
    req.on('end', () => {
      let p; try { p = JSON.parse(body || '{}'); } catch { return json(400, { loi: 'JSON hỏng' }); }
      const v = HANH_DONG[p.ma];
      if (!v) return json(400, { loi: `Không có việc tên "${p.ma}". Danh sách ĐÓNG, không nhận lệnh tự do.` });
      const lenh = v.lam(p);
      if (!lenh) return json(400, { loi: 'Tham số không hợp khuôn, hoặc không có gì để làm.' });
      execFile(lenh[0], lenh[1], { cwd: REPO, timeout: p.ma === 'dung-lai-sach' ? 1800000 : 120000, maxBuffer: 8 * 1024 * 1024 }, (err, out, errOut) => {
        json(200, { ma: p.ma, ok: !err, ra: (out || errOut || '').slice(-4000), lenh: `${lenh[0]} ${lenh[1].slice(0, 3).join(' ')}…` });
      });
    });
    return;
  }

  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(TRANG);
}

const TRANG = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Bản vẽ luồng việc IF</title>
<style>
:root{--bg:#0c0c0e;--panel:#141417;--field:#202024;--line:#2a2a31;--t1:#f5f5f7;--t2:#d6d6db;
 --t3:#9e9ea8;--t4:#6e6e78;--ac:#8b7bf7;--acs:rgba(106,87,245,.18);
 --ok:#46b876;--oks:rgba(70,184,118,.15);--warn:#d9a34a;--warns:rgba(217,163,74,.15);
 --bad:#e5674f;--bads:rgba(229,103,79,.15);--rf:999px}
@media(prefers-color-scheme:light){:root{--bg:#f2f2f7;--panel:#f9f9fb;--field:#f4f4f9;--line:#e2e2ea;
 --t1:#1d1d24;--t2:#43434e;--t3:#6c6c78;--t4:#93939f;--ac:#553ff3;--acs:rgba(85,63,243,.12);
 --ok:#107043;--oks:rgba(16,112,67,.12);--warn:#9a6304;--warns:rgba(154,99,4,.12);
 --bad:#c9341d;--bads:rgba(201,52,29,.12)}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--t1);line-height:1.5;
 font-family:-apple-system,'SF Pro Text','Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1400px;margin:0 auto;padding:32px 22px 60px;display:flex;flex-direction:column;gap:26px}
.num{font-variant-numeric:tabular-nums}
.eye{font-size:12px;letter-spacing:.15em;color:var(--t4)}
h1{margin:8px 0 0;font-size:27px;font-weight:600;letter-spacing:-.02em}
.sub{font-size:13px;color:var(--t3)}
.card{background:linear-gradient(155deg,rgba(255,255,255,.05),rgba(255,255,255,.015));
 box-shadow:0 0 0 1px var(--line),0 16px 36px -26px rgba(0,0,0,.7);border-radius:14px}
.pad{padding:16px}
.top{display:flex;gap:12px;flex-wrap:wrap}
.chip{display:inline-flex;align-items:center;gap:7px;border-radius:var(--rf);padding:7px 14px;
 font-size:13px;background:var(--field);color:var(--t2)}
.chip b{font-weight:600;color:var(--t1)}
.dot{width:8px;height:8px;border-radius:var(--rf)}

/* ── BẢN VẼ: cột = trạng thái dự án · hàng = người ── */
.ve{overflow-x:auto}
.grid{display:grid;grid-template-columns:150px 1fr 1fr;gap:0;min-width:900px}
.hd{padding:12px 14px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:2}
.hd .ten{font-size:14px;font-weight:600;letter-spacing:-.01em}
.hd .y{font-size:11.5px;color:var(--t4);margin-top:3px;line-height:1.45}
.lan{padding:16px 14px;border-bottom:1px solid var(--line);border-right:1px solid var(--line)}
.lan .ma{font-size:19px;font-weight:600;letter-spacing:-.02em}
.lan .ten{font-size:12.5px;color:var(--t2);margin-top:1px}
.lan .mo{font-size:11.5px;color:var(--t4);margin-top:6px;line-height:1.45}
.o{padding:12px 12px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:9px;
 min-height:78px;border-right:1px solid var(--line)}
.o:last-child{border-right:0}

/* ── THẺ VIỆC: trạng thái hiện bằng HÌNH, không chỉ bằng chữ ── */
.v{border-radius:11px;padding:11px 12px;background:var(--field);
 box-shadow:0 0 0 1px var(--line);transition:box-shadow .2s,transform .2s}
.v .n{font-size:13.5px;font-weight:600;letter-spacing:-.005em;line-height:1.35}
.v .y{font-size:11.5px;color:var(--t3);margin-top:5px;line-height:1.5}
.v .cho{font-size:11.5px;color:var(--t4);margin-top:7px;display:flex;align-items:center;gap:5px}
.v .bar{height:3px;border-radius:var(--rf);background:var(--line);margin-bottom:9px}
/* ĐẠT — sáng, có màu, nhấc lên */
.v.dat{background:var(--oks);box-shadow:0 0 0 1px rgba(70,184,118,.4),0 10px 24px -18px rgba(0,0,0,.8)}
.v.dat .bar{background:var(--ok)}
.v.dat .n{color:var(--t1)}
/* HỎNG — đỏ, mạch đập */
.v.hong{background:var(--bads);box-shadow:0 0 0 1px rgba(229,103,79,.5)}
.v.hong .bar{background:var(--bad);animation:dap 1.7s ease-in-out infinite}
@keyframes dap{0%,100%{opacity:1}50%{opacity:.3}}
/* CHƯA XÁC NHẬN — hổ phách, viền đứt */
.v.tay{background:var(--warns);box-shadow:0 0 0 1px rgba(217,163,74,.45)}
.v.tay .bar{background:repeating-linear-gradient(90deg,var(--warn) 0 6px,transparent 6px 11px)}
/* CHƯA TỚI — XÁM, chìm, không sáng gì cả */
.v.chuaToi{background:transparent;box-shadow:0 0 0 1px var(--line);opacity:.42}
.v.chuaToi .n{color:var(--t3);font-weight:500}
/* CHƯA CHẤM */
.v.trong{background:transparent;box-shadow:0 0 0 1px var(--line);opacity:.3}
@media(prefers-reduced-motion:reduce){.v.hong .bar{animation:none}}

.chugiai{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--t3)}
.chugiai span{display:inline-flex;align-items:center;gap:7px}
.sw{width:22px;height:8px;border-radius:var(--rf)}

button{font:inherit;cursor:pointer;border:0;border-radius:var(--rf);padding:9px 15px;font-size:13px;
 background:var(--field);color:var(--t2);transition:background .14s,color .14s}
button:hover{background:var(--acs);color:var(--ac)}
button:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
button.chinh{background:var(--acs);color:var(--ac);font-weight:600}
button[disabled]{opacity:.45;cursor:not-allowed}
.nut{display:flex;flex-wrap:wrap;gap:9px}
.ra{margin:0;padding:13px 15px;background:var(--field);border-radius:12px;font-size:12px;
 font-family:ui-monospace,'SF Mono',Menlo,monospace;white-space:pre-wrap;color:var(--t2);
 max-height:300px;overflow:auto;line-height:1.55}
</style></head><body><div class="wrap">

<header>
  <div class="eye">INTERIORFLOW · BẢN VẼ LUỒNG VIỆC · CHẠY TẠI MÁY</div>
  <h1>Ai đang làm gì, và cái gì chưa tới lượt</h1>
  <p class="sub" style="margin:9px 0 0">Hàng là <b>người</b>. Cột là <b>trạng thái của dự án</b>.
  Ô sáng là việc đang sống; ô <b>xám</b> là việc chưa tới lượt vì còn chờ thứ khác.</p>
</header>

<section class="top" id="top"></section>

<section class="card ve"><div class="grid" id="grid"></div></section>

<section class="chugiai">
  <span><i class="sw" style="background:var(--ok)"></i>đạt — máy đã chứng minh</span>
  <span><i class="sw" style="background:var(--bad)"></i>hỏng — phải sửa</span>
  <span><i class="sw" style="background:repeating-linear-gradient(90deg,var(--warn) 0 6px,transparent 6px 11px)"></i>chờ mắt người — máy không có quyền tuyên</span>
  <span><i class="sw" style="background:var(--line)"></i>chưa tới lượt — còn chờ việc khác</span>
</section>

<section class="card pad" style="display:flex;flex-direction:column;gap:13px">
  <div class="nut" id="nut"></div>
  <pre class="ra" id="ra">Chưa chạy gì.</pre>
</section>

</div><script>
const $=s=>document.querySelector(s);
const BIEU={dat:'đạt',hong:'hỏng',tay:'chờ mắt người',chuaToi:'chưa tới lượt'};
let dangChay=false, soVe=null;

async function veTop(){
  let d; try{ d=await (await fetch('/api/trang-thai')).json(); }catch{ return; }
  const s=soVe&&soVe.tong;
  $('#top').innerHTML=
    '<span class="chip"><b class="num">'+(d.git.head||'—')+'</b>'+d.git.ban+' bẩn · '+
      (d.git.chuaDay??0)+' chưa đẩy</span>'+
    '<span class="chip"><span class="dot" style="background:'+(d.devServer?'var(--ok)':'var(--t4)')+'"></span>'+
      'máy chủ dev '+(d.devServer?'đang chạy':'tắt')+'</span>'+
    '<span class="chip"><b class="num">'+d.tongPhieuMo+'</b>phiếu đang mở trên cầu</span>'+
    (s?'<span class="chip"><b class="num" style="color:var(--ok)">'+s.dat+'</b>đạt · '+
      '<b class="num" style="color:var(--bad)">'+s.hong+'</b>hỏng · '+
      '<b class="num" style="color:var(--warn)">'+s.tay+'</b>chờ người</span>':'')+
    '<span class="chip" id="dau-thoi-gian">…</span>';
}

async function veGrid(){
  const d=await (await fetch('/api/so-viec')).json(); soVe=d;
  const pha=['soat','dung'];
  let h='<div class="hd"><div class="ten">Người</div><div class="y">làn việc — ai chịu trách nhiệm</div></div>';
  for(const p of pha) h+='<div class="hd"><div class="ten">'+d.pha[p].ten+'</div><div class="y">'+d.pha[p].y+'</div></div>';

  for(const ng of d.nguoi){
    h+='<div class="lan"><div class="ma num">'+ng.ma+'</div><div class="ten">'+ng.ten+'</div>'
      +'<div class="mo">'+ng.mo+'</div></div>';
    for(const p of pha){
      const oViec=d.viec.filter(v=>v.lane===ng.ma&&v.pha===p);
      h+='<div class="o">'+(oViec.length?oViec.map(v=>{
        const t=v.kq?v.kq.trang:'trong';
        const cho=v.kq&&v.kq.trang==='chuaToi'?v.kq.ghi:'';
        return '<div class="v '+t+'" title="'+(v.y||'').replace(/"/g,'&quot;')+'">'
          +'<div class="bar"></div><div class="n">'+v.ten+'</div>'
          +'<div class="y">'+(v.y||'')+'</div>'
          +(cho?'<div class="cho">⏳ '+cho+'</div>':'')
          +(v.kq&&v.kq.trang==='hong'?'<div class="cho" style="color:var(--bad)">'+(v.kq.ghi||'').slice(0,90)+'</div>':'')
          +(v.kq&&v.kq.trang==='tay'?'<div class="cho">👁 '+v.kq.ghi+'</div>':'')
          +'</div>';
      }).join(''):'<div class="sub" style="color:var(--t4);font-size:11.5px">—</div>')+'</div>';
    }
  }
  $('#grid').innerHTML=h;
  const dt=$('#dau-thoi-gian');
  if(dt) dt.textContent=d.dang?'đang soát lại…':(d.luc?'soát lúc '+new Date(d.luc).toLocaleTimeString('vi-VN'):'chưa soát');
}

async function veNut(){
  const v=await (await fetch('/api/viec')).json();
  $('#nut').innerHTML='<button class="chinh" data-soat="1">Soát lại toàn diện</button>'
    +v.map(x=>'<button data-ma="'+x.ma+'" title="'+x.y+'">'+x.nhan+'</button>').join('');
}

document.addEventListener('click',async e=>{
  const b=e.target.closest('button'); if(!b||dangChay) return;
  dangChay=true; const cu=b.textContent; b.textContent='đang chạy…';
  document.querySelectorAll('button').forEach(x=>x.disabled=true);
  try{
    if(b.dataset.soat){
      await fetch('/api/soat-lai',{method:'POST'});
      $('#ra').textContent='Đang soát toàn diện — mẻ này chạy cả npm test nên mất khoảng một phút.';
    }else{
      const r=await (await fetch('/api/lam',{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({ma:b.dataset.ma})})).json();
      $('#ra').textContent=(r.ok===false?'⚠️ lệnh trả mã lỗi\\n\\n':'')+(r.ra||r.loi||'(không có đầu ra)');
    }
  }catch(err){ $('#ra').textContent='Không gọi được máy chủ: '+err.message; }
  document.querySelectorAll('button').forEach(x=>x.disabled=false);
  b.textContent=cu; dangChay=false; veGrid(); veTop();
});

veNut(); veGrid(); veTop();
setInterval(()=>{veTop(); if(soVe&&soVe.dang) veGrid();},2500);
</script></body></html>`;

createServer(nghe).listen(CONG, '127.0.0.1', () => {
  console.log(`\n  Phòng điều khiển IF  →  http://127.0.0.1:${CONG}`);
  console.log(`  Đọc trạng thái thật mỗi 2 giây. Danh sách hành động ĐÓNG (${Object.keys(HANH_DONG).length} việc).`);
  console.log('  Ctrl+C để tắt.\n');
});
