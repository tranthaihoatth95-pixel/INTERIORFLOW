/**
 * CA ĐỘT BIẾN cho `scripts/phieu-ca.mjs` — CÁCH LY BÀN · WRITER NGUYÊN TỬ · CỔNG HẾT MÙ.
 *
 * ══ VÌ SAO CÓ NHÓM NÀY ══
 * `moc.mjs` spawn `phieu-ca.mjs --ghi-ban` (detached + unref, cwd = REPO) sau MỖI biên nhận.
 * Ca đột biến của `moc.mjs` chạy máy THẬT với `BOS_SHARED_LOG_ROOT=<tmp>` — cách ly ĐÚNG SỔ,
 * SAI REPO. Đo 30–31/08: mỗi lượt `npm test` ghi đè 9 tệp `docs/control/ban/*.md` THẬT bằng dữ
 * liệu fixture; nhiều tiến trình detached ghi chồng không nguyên tử ⇒ `06.md`/`08.md` mọc HAI
 * khối MÁY GIỮ, `01.md`/`05.md` mất sạch phần người viết, `08.md:19` còn lại chuỗi UTF-8 vỡ.
 * Cổng `soi:ban` XANH suốt trong lúc đó vì nó chỉ canh khối máy giữ, và chỉ `indexOf` khối ĐẦU.
 *
 * ══ TỆP NÀY TỪNG KHÔNG TỒN TẠI ══
 * Nhóm ca dưới đây ở TẠM TRÚ trong `scripts/cau-mo-hinh.test.ts` từ 31/08, có banner cảnh báo
 * hẳn hoi — không phải vì nó thuộc về đó, mà vì lease `HO-phuc-hoi-ban` khoá 15 tệp và **không
 * có lệnh sửa danh sách tệp giữa phiên**. Mã phải nằm sai chỗ vì công cụ quản lý quyền thiếu
 * một nước đi. Nợ đó trả bằng `claude-lease.mjs amend` (HO-guard-v3 mục 5), và tệp này là chỗ
 * đúng của chúng. Theo F-17, mỗi nhóm giữ CẢ ca mong ĐỎ lẫn ca mong XANH.
 */
void (async () => {

let ok = 0, fail = 0;
const la = (ten: string, duoc: unknown, mong: unknown) => {
  const d = JSON.stringify(duoc), m = JSON.stringify(mong);
  if (d === m) { ok++; console.log(`  ok  - ${ten}`); }
  else { fail++; console.log(`  FAIL- ${ten}\n        mong ${m}\n        được ${d}`); }
};

console.log('\n[phieu-ca] CÁCH LY BÀN · WRITER NGUYÊN TỬ · CỔNG HẾT MÙ');
{
  const { spawnSync, spawn } = require('node:child_process') as typeof import('node:child_process');
  const fs = require('node:fs') as typeof import('node:fs');
  const os2 = require('node:os') as typeof import('node:os');
  const p2 = require('node:path') as typeof import('node:path');

  const REPO = process.cwd();
  const BAN_THAT = p2.join(REPO, 'docs/control/ban');
  const MOC_BAN = '<!-- MÁY GIỮ · phieu-ca.mjs · CẤM SỬA TAY -->';
  const DONG_BAN = '<!-- /MÁY GIỮ -->';
  const KHOI_CU = `${MOC_BAN}\ncũ — chưa sinh lại\n${DONG_BAN}`;

  /** Bàn fixture: đủ mọi mục bắt buộc · đúng MỘT cặp mốc · một dòng chữ người viết để soi mất mát. */
  const banMau = (ma: string, them = '') => `# BÀN \`${ma}\` · fixture

## VAI
fixture

## CẤM
fixture

## NGHIỆM THU — xong ở bàn này nghĩa là
fixture

## ĐANG DỞ
CHỮ NGƯỜI VIẾT ${ma} — máy không sinh lại được, mất là mất hẳn
${them}
## NẠP TRƯỚC KHI GÕ
- fixture

---

${KHOI_CU}
`;

  /** Môi trường SẠCH — xoá hẳn hai biến, không để env của phiên đang chạy rò vào ca đo. */
  const moiTruong = (them: Record<string, string> = {}): typeof process.env => {
    const e = { ...process.env, ...them };
    if (!them.BOS_SHARED_LOG_ROOT) delete e.BOS_SHARED_LOG_ROOT;
    if (!them.BOS_BAN_ROOT) delete e.BOS_BAN_ROOT;
    return e;
  };
  const goiBan = (args: string[], them: Record<string, string> = {}) =>
    spawnSync(process.execPath, ['scripts/phieu-ca.mjs', ...args],
      { cwd: REPO, encoding: 'utf8', env: moiTruong(them) });

  /** Dấu vết 9 tệp bàn THẬT — mtime · kích thước · độ dài nội dung. Đây là thứ phải KHÔNG đổi. */
  const dauVet = () => Object.fromEntries(
    fs.readdirSync(BAN_THAT).filter((f) => /^\d\d\.md$/.test(f)).sort().map((f) => {
      const s = fs.statSync(p2.join(BAN_THAT, f));
      return [f, `${s.mtimeMs}|${s.size}|${fs.readFileSync(p2.join(BAN_THAT, f), 'utf8').length}`];
    }));

  const goc = fs.mkdtempSync(p2.join(os2.tmpdir(), 'if-ban-'));
  const thuMuc = (ten: string) => { const d = p2.join(goc, ten); fs.mkdirSync(d, { recursive: true }); return d; };
  const logTam = thuMuc('log');
  const truoc = dauVet();

  try {
    /* ── B1 · CÁCH LY ── */
    la('B1 phải có đúng 9 tệp bàn thật để so dấu vết', Object.keys(truoc).length, 9);

    // ⓐ log tạm + ban tạm ⇒ ghi vào tạm; bàn thật không suy suyển.
    const banA = thuMuc('a');
    for (const ma of ['06', '08']) fs.writeFileSync(p2.join(banA, `${ma}.md`), banMau(ma));
    const a = goiBan(['--ghi-ban'], { BOS_SHARED_LOG_ROOT: logTam, BOS_BAN_ROOT: banA });
    la('B1ⓐ log tạm + ban tạm → GHI ĐƯỢC', a.status, 0);
    const a06 = fs.readFileSync(p2.join(banA, '06.md'), 'utf8');
    la('B1ⓐ  … khối máy giữ sinh vào bàn TẠM', a06.includes('## VIỆC ĐANG MỞ'), true);
    la('B1ⓐ  … phần người viết ngoài mốc nguyên vẹn', a06.includes('CHỮ NGƯỜI VIẾT 06'), true);
    la('B1ⓐ ⛔ 9 tệp bàn THẬT KHÔNG đổi', dauVet(), truoc);

    // ⓑ log tạm + ban repo ⇒ FAIL-CLOSED, không cảnh-báo-rồi-cho-qua.
    const b = goiBan(['--ghi-ban'], { BOS_SHARED_LOG_ROOT: logTam });
    la('B1ⓑ cách ly nửa vời → TỪ CHỐI GHI, exit ≠ 0', b.status, 3);
    la('B1ⓑ  … và nói rõ vì sao', /TỪ CHỐI GHI BÀN/.test(b.stderr), true);
    la('B1ⓑ ⛔ đã từ chối thì bàn thật KHÔNG đổi', dauVet(), truoc);

    /* ⓒ ĐƯỜNG MẶC ĐỊNH VẪN TRỎ BÀN THẬT.
     * Phiếu ghi "không biến nào → hành vi cũ ghi repo". Chạy đúng chữ đó TRONG `npm test` sẽ ghi
     * lại chính 9 tệp bàn thật (dòng "máy sinh <giờ>" đổi ⇒ `git status` bẩn) — dựng lại đúng cái
     * bẫy vừa gỡ, và phá nghiệm thu vàng. Nên ⓒ tách hai nửa, vẫn đo đúng thứ cần đo. */
    const c1 = goiBan(['--kiem-ban']);
    /* BỐN trạng thái, không phải ba. `❓` = MÙ (máy này không có sổ phiếu — sổ sống NGOÀI repo ở
     * `$BOS_SHARED_LOG_ROOT`). Trước 04/09 máy không có sổ vẫn phán 🔴, tức VU OAN người viết:
     * `doc()` trả `[]` khi thiếu tệp, và mảng rỗng đọc ra y hệt "không ai giao phiếu".
     * Ở đây chỉ đo ĐỘ PHỦ — mọi bàn thật đều có một dòng phán. `❓ ≠ ✅`: dòng tổng cuối
     * `--kiem-ban` nói thẳng "đây KHÔNG phải xanh". */
    la('B1ⓒ1 không biến nào → --kiem-ban soi đúng 9 bàn THẬT',
      Object.keys(truoc).every((f) => new RegExp(`[✅🔴⚪❓] ${f.slice(0, 2)} `).test(c1.stdout)), true);
    la('B1ⓒ1  … và --kiem-ban là lệnh CHỈ-ĐỌC', dauVet(), truoc);

    const banC = thuMuc('c');
    for (const ma of ['06', '08']) fs.writeFileSync(p2.join(banC, `${ma}.md`), banMau(ma));
    const c2 = goiBan(['--ghi-ban'], { BOS_BAN_ROOT: banC });
    la('B1ⓒ2 cầu THẬT + bàn chỉ định → đường ghi sản xuất vẫn sống', c2.status, 0);
    const c206 = fs.readFileSync(p2.join(banC, '06.md'), 'utf8');
    la('B1ⓒ2  … sinh khối máy giữ', c206.includes('## VIỆC ĐANG MỞ'), true);
    la('B1ⓒ2  … KHÔNG nuốt chữ người viết', c206.includes('CHỮ NGƯỜI VIẾT 06'), true);
    la('B1ⓓ counterproof: cả ⓒ1 và ⓒ2 XANH mà bàn thật vẫn nguyên', dauVet(), truoc);

    /* ── B2 · WRITER NGUYÊN TỬ ── */
    // 0 khối ⇒ TỪ CHỐI. Không tự đoán rồi vá: đoán sai ở đây là nuốt chữ người viết.
    const ban0 = thuMuc('khoi0'); const tep0 = p2.join(ban0, '06.md');
    fs.writeFileSync(tep0, banMau('06').replace(KHOI_CU, ''));
    const n0 = fs.readFileSync(tep0, 'utf8');
    const r0 = goiBan(['--ghi-ban'], { BOS_SHARED_LOG_ROOT: logTam, BOS_BAN_ROOT: ban0 });
    la('B2 0 khối → TỪ CHỐI, exit 1', r0.status, 1);
    la('B2 0 khối → nói rõ đếm được bao nhiêu', /0 mốc MỞ/.test(r0.stderr), true);
    la('B2 0 khối → tệp nguyên si', fs.readFileSync(tep0, 'utf8'), n0);

    // 2 khối ⇒ TỪ CHỐI (đúng hình dạng `06.md`/`08.md` sau khi bị phá).
    const ban2 = thuMuc('khoi2'); const tep2 = p2.join(ban2, '06.md');
    fs.writeFileSync(tep2, `${banMau('06')}\n---\n\n${KHOI_CU}\n`);
    const n2 = fs.readFileSync(tep2, 'utf8');
    const r2b = goiBan(['--ghi-ban'], { BOS_SHARED_LOG_ROOT: logTam, BOS_BAN_ROOT: ban2 });
    la('B2 2 khối → TỪ CHỐI, exit 1', r2b.status, 1);
    la('B2 2 khối → nói rõ đếm được bao nhiêu', /2 mốc MỞ/.test(r2b.stderr), true);
    la('B2 2 khối → tệp nguyên si', fs.readFileSync(tep2, 'utf8'), n2);

    // SONG SONG: 6 tiến trình cùng ghi ⇒ MỘT bản hợp lệ, không bao giờ bản trộn.
    const banS = thuMuc('song-song');
    fs.writeFileSync(p2.join(banS, '06.md'), banMau('06'));
    await Promise.all([...Array(6)].map(() => new Promise<void>((xong) => {
      const c = spawn(process.execPath, ['scripts/phieu-ca.mjs', '--ghi-ban'],
        { cwd: REPO, stdio: 'ignore', env: moiTruong({ BOS_SHARED_LOG_ROOT: logTam, BOS_BAN_ROOT: banS }) });
      c.on('close', () => xong());
    })));
    const s = fs.readFileSync(p2.join(banS, '06.md'), 'utf8');
    la('B2 song song → vẫn đúng MỘT cặp mốc',
      [s.split(MOC_BAN).length - 1, s.split(DONG_BAN).length - 1], [1, 1]);
    la('B2 song song → khối không nhân đôi', s.split('## VIỆC ĐANG MỞ').length - 1, 1);
    la('B2 song song → chữ người viết còn đúng một bản', s.split('CHỮ NGƯỜI VIẾT 06').length - 1, 1);
    la('B2 song song → không lẫn nửa bản cũ', s.includes('cũ — chưa sinh lại'), false);
    la('B2 song song → không để lại tệp tạm hay khoá mồ côi',
      fs.readdirSync(banS).filter((f) => f.includes('.tam-') || f.endsWith('.khoa')), []);

    /* ── B3 · CỔNG soi:ban HẾT MÙ ── */
    const soi = (ten: string, noiDung: string) => {
      const d = thuMuc(`soi-${ten}`);
      fs.writeFileSync(p2.join(d, '06.md'), noiDung);
      return goiBan(['--kiem-ban', '--chan'], { BOS_SHARED_LOG_ROOT: logTam, BOS_BAN_ROOT: d });
    };

    const doi = soi('mocdoi', `${banMau('06')}\n---\n\n${KHOI_CU}\n`);
    la('B3① 2 khối → cổng ĐỎ', [doi.status, /2 mốc MỞ/.test(doi.stdout)], [1, true]);
    const khong = soi('khongmoc', banMau('06').replace(KHOI_CU, ''));
    la('B3① 0 khối → cổng ĐỎ', [khong.status, /0 mốc MỞ/.test(khong.stdout)], [1, true]);
    const nua = soi('nuanguoi', banMau('06').replace('## VAI\nfixture\n', ''));
    la('B3② mất nửa-người → cổng ĐỎ, gọi tên mục đã mất',
      [nua.status, /mất phần người viết/.test(nua.stdout), /## VAI/.test(nua.stdout)], [1, true, true]);
    const vo = soi('utf8vo', banMau('06').replace('## NẠP TRƯỚC KHI GÕ', `��i\n\n## NẠP TRƯỚC KHI GÕ`));
    la('B3③ U+FFFD trần → cổng ĐỎ', [vo.status, /U\+FFFD/.test(vo.stdout)], [1, true]);

    /* COUNTERPROOF — thiếu nhóm này thì cả B3 vẫn xanh khi cổng chết hẳn (đỏ-hết là cổng vô dụng). */
    const banLanh = thuMuc('lanh');
    fs.writeFileSync(p2.join(banLanh, '06.md'), banMau('06'));
    goiBan(['--ghi-ban'], { BOS_SHARED_LOG_ROOT: logTam, BOS_BAN_ROOT: banLanh });
    la('B3 COUNTERPROOF: bàn LÀNH phải XANH',
      goiBan(['--kiem-ban', '--chan'], { BOS_SHARED_LOG_ROOT: logTam, BOS_BAN_ROOT: banLanh }).status, 0);

    /* U+FFFD TRONG `dấu nháy ngược` LÀ TANG VẬT ĐƯỢC TRÍCH, KHÔNG PHẢI LỖI.
     * Ca thật: `ban/07.md:76,107` chép đúng chuỗi vỡ của `08.md` vào bài học đã trả giá. Cổng bắt
     * cả nó thì đúng cái bàn ghi lại bài học sẽ ĐỎ vĩnh viễn — phạt người làm đúng. */
    const banTrich = thuMuc('trich');
    fs.writeFileSync(p2.join(banTrich, '06.md'), banMau('06', 'bài học: chuỗi vỡ trông như `��i`\n'));
    goiBan(['--ghi-ban'], { BOS_SHARED_LOG_ROOT: logTam, BOS_BAN_ROOT: banTrich });
    la('B3 COUNTERPROOF: U+FFFD trong code span là TRÍCH DẪN, phải XANH',
      goiBan(['--kiem-ban', '--chan'], { BOS_SHARED_LOG_ROOT: logTam, BOS_BAN_ROOT: banTrich }).status, 0);

    /* CHỐT — sau TẤT CẢ ca trên, 9 tệp bàn thật vẫn y nguyên. */
    la('⛔ CHỐT: chạy hết ca đột biến mà bàn THẬT vẫn không bị chạm', dauVet(), truoc);
  } finally {
    fs.rmSync(goc, { recursive: true, force: true });
  }
}

/* ══ TRẠNG THÁI PHIẾU LEGACY — bàn không được đổ oan cho người đang ngồi (thêm 01/09) ══
 *
 * `phieu-ca.mjs` đọc trạng thái qua `khoaHandoff`. Khi khoá hai đầu lệch nhau, một phiếu legacy
 * ĐÃ ĐƯỢC GỌI vẫn in ra "🔴 KẸT — ghi rồi mà chưa ai gọi" — bàn tố cáo người đang ngồi vì một
 * lỗi của sổ. Đó không phải chuyện thẩm mỹ bản in: bàn là thứ phiên sau đọc để nhận bàn giao,
 * nên một dòng sai ở đây được chép tiếp sang mọi phiên sau.
 *
 * Nhóm này chạy MÁY THẬT trên cầu tạm, và giữ cả ca mong ĐỎ (phiếu chưa gọi vẫn phải KẸT) lẫn
 * ca mong XANH (phiếu đã gọi phải hết KẸT) — F-17. */
console.log('\n[phieu-ca] TRẠNG THÁI PHIẾU LEGACY');
{
  const { spawnSync } = require('node:child_process') as typeof import('node:child_process');
  const fs = require('node:fs') as typeof import('node:fs');
  const os2 = require('node:os') as typeof import('node:os');
  const p2 = require('node:path') as typeof import('node:path');

  const tam = fs.mkdtempSync(p2.join(os2.tmpdir(), 'phieu-ca-legacy-'));
  try {
    const luc = new Date().toISOString();
    const dong = (o: object) => `${JSON.stringify(o)}\n`;
    fs.writeFileSync(p2.join(tam, 'agent-handoffs.jsonl'),
      // ① phiếu legacy ĐÃ được gọi — biên nhận khai target_lane legacy, tác giả là lane KHÁC
      dong({ type: 'HANDOFF', id: 'HO-GOI-ROI', from: '00', to: '06', topic: 'legacy đã gọi', createdAt: luc })
      + dong({ type: 'WAKE_ATTEMPTED', handoffId: 'HO-GOI-ROI', system: 'cl', lane: '00', target_system: null, target_lane: '06', cach: 'SendMessage → interiorflow-16', createdAt: luc })
      // ② phiếu legacy CHƯA gọi — phải vẫn KẸT, nếu không thì bản vá đang bịt mắt cổng
      + dong({ type: 'HANDOFF', id: 'HO-CHUA-GOI', from: '00', to: '06', topic: 'legacy chưa gọi', createdAt: luc }));

    const moi = { ...process.env, BOS_SHARED_LOG_ROOT: tam, BOS_BAN_ROOT: p2.join(tam, 'ban') };
    // Đường nóng in theo TOPIC (`p.viec`), không in id — soi đúng thứ mắt người đọc trên bàn.
    const r = spawnSync('node', ['scripts/phieu-ca.mjs'], { encoding: 'utf8', env: moi });
    const dongCua = (topic: string) => (r.stdout.split('\n').find((l) => l.includes(topic)) ?? '');

    la('legacy ĐÃ gọi → hết "KẸT"', /KẸT/.test(dongCua('legacy đã gọi')), false);
    la('legacy ĐÃ gọi → đọc ra là đã gọi', /đã gọi, chưa thấy/.test(dongCua('legacy đã gọi')), true);
    la('COUNTERPROOF: legacy CHƯA gọi vẫn phải KẸT', /KẸT/.test(dongCua('legacy chưa gọi')), true);

    const js = JSON.parse(spawnSync('node', ['scripts/phieu-ca.mjs', '--json'], { encoding: 'utf8', env: moi }).stdout);
    const p = js.phieu.find((x: any) => x.viec.includes('legacy đã gọi'));
    la('legacy ĐÃ gọi → noted của biên nhận đi kèm được trạng thái',
      /SendMessage/.test(p?.noted ?? ''), true);
  } finally {
    fs.rmSync(tam, { recursive: true, force: true });
  }
}

console.log(`\n${ok} ok, ${fail} fail`);
if (fail) process.exit(1);
})();
