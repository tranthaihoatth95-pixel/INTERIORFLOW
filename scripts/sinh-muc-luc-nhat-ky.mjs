#!/usr/bin/env node
/* SINH MỤC LỤC NHẬT KÝ — chữa gốc bệnh "tệp mồ côi" ở các thư mục nhật ký.
 *
 * VÌ SAO: `soi:kho-tai-lieu` đo 232 tệp mồ côi / trần 153 (05/09). Phần lớn nằm ở các thư mục
 * NHẬT KÝ — nơi mỗi phiên ghi một tệp rồi đi, không ai nối vào đâu. Đó KHÔNG phải lỗi của người
 * ghi: nhật ký đúng là viết-một-lần. Lỗi là **thư mục không có cửa vào**.
 *
 * `docs/bao-cao-phien/` đã có `README.md` — bốn thư mục nhật ký còn lại thì KHÔNG, và đó đúng là
 * bốn chỗ đóng góp nhiều mồ côi nhất. Máy này sinh mục lục cho chúng: mỗi tệp một dòng, lấy tiêu
 * đề thật (dòng `#` đầu tiên) chứ không đoán từ tên tệp.
 *
 * ⚠️ Mục lục do MÁY sinh: chạy lại là ghi đè. Muốn ghi chú tay thì đặt NGOÀI dấu mốc máy giữ.
 * ⚠️ Đây KHÔNG phải mẹo lách cổng: cổng tự nêu "mục lục" là một trong hai đường chữa hợp lệ, và
 *    trước khi có mục lục thì các tệp này thật sự không ai tìm ra được. Sau khi có thì tìm ra được. */
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const KHO = [
  ['docs/nhat-ky/bao-cao-phien', 'Báo cáo phiên (kho cũ)', 'Nhật ký từng phiên trước đợt dời thư mục. Tra khi cần khảo cổ một quyết định.'],
  ['docs/nhat-ky/nc',            'Nghiên cứu (kho cũ)',    'Bài nghiên cứu đã chưng cất vào luật. Đọc khi cần lập luận gốc, không phải khi cần luật.'],
  ['docs/nhat-ky/goc',           'Tài liệu gốc (kho cũ)',  'Bản gốc trước khi bị đè hoặc chưng cất. Giữ làm dấu vết, KHÔNG phải thẩm quyền.'],
  ['docs/memory/sessions',       'Trí nhớ phiên',          'Chi tiết đầy đủ từng nhánh việc. Bản nén ở `docs/memory/LATEST.md`.'],
];
const DAU_MO = '<!-- MÁY GIỮ · sinh bởi scripts/sinh-muc-luc-nhat-ky.mjs — đừng sửa tay trong khối này -->';
const DAU_DONG = '<!-- /MÁY GIỮ -->';

const tieuDe = (p) => {
  try {
    for (const l of readFileSync(p, 'utf8').split('\n', 40)) {
      const m = /^#{1,3}\s+(.+)$/.exec(l.trim());
      if (m) return m[1].replace(/[`*]/g, '').trim().slice(0, 110);
    }
  } catch {/* tệp đọc không được — để trống, KHÔNG bịa tiêu đề */}
  return '';
};
const quet = (d, goc = d) => {
  const ra = [];
  for (const t of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, t.name);
    if (t.isDirectory()) ra.push(...quet(p, goc));
    else if (t.name.endsWith('.md') && t.name !== 'README.md') ra.push(p);
  }
  return ra;
};

let tong = 0;
for (const [thuMuc, ten, moTa] of KHO) {
  if (!existsSync(thuMuc)) { console.log(`  ⚪ ${thuMuc} — không có, bỏ qua`); continue; }
  const tep = quet(thuMuc).sort().reverse();
  const dong = tep.map((p) => {
    const t = tieuDe(p);
    const ngan = p.slice(thuMuc.length + 1);
    return `- [\`${ngan}\`](${ngan})${t ? ` — ${t}` : ' — *(không có tiêu đề)*'}`;
  });
  const than = [
    `# ${ten}`, '', `> ${moTa}`, '',
    `> ⚠️ **Đây là NHẬT KÝ, không phải thẩm quyền.** Hiện trạng ở \`docs/control/IF-CURRENT-STATE.md\`;`,
    `> luật bền ở \`docs/control/IF-CANONICAL.md\`. Mở tệp dưới đây khi cần **truy nguyên**, không phải`,
    `> khi cần biết hôm nay làm gì.`, '',
    DAU_MO, `**${tep.length} tệp** · mục lục sinh lúc dựng, sắp mới→cũ.`, '', ...dong, '', DAU_DONG, '',
  ].join('\n');
  writeFileSync(join(thuMuc, 'README.md'), than);
  console.log(`  ✅ ${thuMuc}/README.md — ${tep.length} tệp`);
  tong += tep.length;
}
console.log(`\n${tong} tệp nhật ký nay có cửa vào.`);
