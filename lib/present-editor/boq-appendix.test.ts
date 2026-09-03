/**
 * lib/present-editor/boq-appendix.test.ts — nghiệm thu PHỤ LỤC BOQ trong deck (02/09).
 * Chạy: node_modules/.bin/sucrase-node lib/present-editor/boq-appendix.test.ts
 *
 * Giữ 6 điều: nhãn nguồn từng dòng đúng (máy ↔ sửa tay, số máy lộ ra) · lỗi engine không giấu ·
 * phân trang tất định theo hướng khổ · thay cụm trang = một chỗ, không nhân bản · báo cũ theo
 * vân tay · round-trip `.idfp` giữ meta · không chuỗi thương hiệu nào.
 */
import {
  buildBoqAppendixSlides, findBoqAppendixSlides, replaceBoqAppendixSlides, boqAppendixInsertIndex,
  isBoqAppendixStale, shortBoqFingerprint, rowGrade, describeBoqAppendix, paginateLines,
  BOQ_APPENDIX_TEMPLATE_ID,
} from './boq-appendix';
import { applyBoqOverrides, overrideKey, type BoqOverrideMap } from './boq-overrides';
import { exportIdfp, importIdfp } from './idfp';
import { buildStorySetDeck } from './story-set';
import type { BoqRow, BoqError } from '../boq/model';
import type { EditorDeck, TextElement } from './model';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log('  ok  -', m); } else { fail++; console.log('  FAIL-', m); } };

function row(i: number, extra: Partial<BoqRow> = {}): BoqRow {
  const id = `spec-${i}`;
  return {
    specId: id, matId: id, ten: `Vật liệu ${i}`, ncc: 'NCC', ma: `VL-${String(i).padStart(2, '0')}`,
    m2: 10 + i, qty: 10 + i, unit: 'm2', kind: 'area', donGia: 100000, haoHutPhanTram: 5,
    thanhTien: Math.round((10 + i) * 1.05 * 100000), entityIds: [`h${i}`], ...extra,
  };
}
const texts = (s: { elements: Array<{ kind: string }> }) => s.elements.filter((e) => e.kind === 'text') as TextElement[];
const allText = (s: { elements: Array<{ kind: string }> }) => texts(s).map((t) => t.text).join('\n');

console.log('[1] Nhãn nguồn từng dòng — máy đo ↔ sửa tay, số máy lộ ra trong ngoặc');
{
  const rows = [row(1), row(2), row(3)];
  const ov: BoqOverrideMap = {
    [overrideKey('spec-2', 'm2')]: { specId: 'spec-2', matId: 'spec-2', field: 'm2', value: 20, at: 1 },
    [overrideKey('spec-3', 'donGia')]: { specId: 'spec-3', matId: 'spec-3', field: 'donGia', value: 250000, at: 2 },
  };
  const display = applyBoqOverrides(rows, ov);
  ok(rowGrade(display[0]) === 'measured' && rowGrade(display[1]) === 'hand-edited' && rowGrade(display[2]) === 'hand-edited', 'rowGrade phân đúng 3 dòng');
  const slides = buildBoqAppendixSlides({
    rows: display, errors: [], projectId: 'p1', fingerprint: 'fp-A', generatedAt: Date.UTC(2026, 8, 2, 9, 0), lang: 'vi',
  });
  ok(slides.length === 1, `3 dòng vừa 1 trang (thực ${slides.length})`);
  const t = allText(slides[0]);
  ok(t.includes('20.00 ✎ (12.00)'), 'ô khối lượng sửa tay in số người dùng + số máy trong ngoặc');
  ok(t.includes('250 000 ✎ (100 000)'), 'ô đơn giá sửa tay in số người dùng + số máy trong ngoặc');
  ok((t.match(/Sửa tay ✎/g) ?? []).length === 2 && (t.match(/\nBản vẽ\n|^Bản vẽ$/m) ?? []).length >= 1, 'cột Nguồn: 2 dòng "Sửa tay ✎", dòng còn lại "Bản vẽ"');
  ok(t.includes('1 dòng theo máy · 2 dòng sửa tay'), 'chân trang đếm đúng máy/sửa tay');
  ok(t.includes('TỔNG CỘNG') && t.includes(display.reduce((s, r) => s + r.thanhTien, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')), 'tổng cộng = tổng thành tiền ĐÃ áp override');
  const meta = slides[0].boqAppendix!;
  ok(meta.rowCount === 3 && meta.handEdited === 2 && meta.errorCount === 0 && meta.page === 1 && meta.pages === 1, 'meta đúng số');
  ok(meta.fingerprint === shortBoqFingerprint('fp-A') && meta.fingerprint.length < 20, 'meta giữ vân tay NGẮN');
  ok(slides[0].templateId === BOQ_APPENDIX_TEMPLATE_ID, 'templateId = boq-appendix');
  ok(slides[0].elements.every((e) => typeof e.id === 'string' && e.id), 'mọi element có id');
  ok(new Set(slides[0].elements.map((e) => e.id)).size === slides[0].elements.length, 'id element duy nhất');
  ok(!/TTT|DETECH|Detech/i.test(t), 'không chuỗi thương hiệu nào');
  ok(texts(slides[0]).every((e) => e.frame.x >= 4.9 && e.frame.x + e.frame.w <= 95.1), 'mọi chữ nằm trong lề 5..95');
}

console.log('[2] Lỗi engine — không giấu: kicker đếm + khối "Chưa đủ nguồn" trên trang cuối');
{
  const errors: BoqError[] = [
    { reason: 'missing-priceVnd', entityIds: ['h9'], specId: 'spec-9', matId: 'spec-9', message: 'Vật liệu 9 chưa có giá trong kho.' },
    { reason: 'missing-specId', entityIds: ['h10'], message: 'Vùng tô h10 chưa gán mã vật liệu.' },
  ];
  const slides = buildBoqAppendixSlides({ rows: [row(1)], errors, projectId: 'p1', fingerprint: 'x', generatedAt: 0, lang: 'en' });
  const t = allText(slides[0]);
  ok(t.includes('2 ITEMS MISSING A SOURCE'), 'kicker (EN) đếm 2 mục chưa đủ nguồn');
  ok(t.includes('MISSING SOURCE') && t.includes('Vật liệu 9 chưa có giá trong kho.') && t.includes('h10'), 'khối lỗi in nguyên câu engine');
  ok(slides[0].boqAppendix!.errorCount === 2, 'meta.errorCount = 2');
  const empty = buildBoqAppendixSlides({ rows: [], errors: [], projectId: 'p1', fingerprint: 'x', generatedAt: 0, lang: 'vi' });
  ok(empty.length === 1 && allText(empty[0]).includes('TỔNG CỘNG'), '0 dòng vẫn ra 1 trang có dòng tổng (0)');
}

console.log('[3] Phân trang tất định theo hướng khổ + nhóm tầng không mồ côi');
{
  const rows = Array.from({ length: 40 }, (_, i) => row(i + 1));
  const land = buildBoqAppendixSlides({ rows, errors: [], projectId: 'p1', fingerprint: 'x', generatedAt: 0, lang: 'vi', stagePreset: '16:9' });
  const port = buildBoqAppendixSlides({ rows, errors: [], projectId: 'p1', fingerprint: 'x', generatedAt: 0, lang: 'vi', stagePreset: 'a4-portrait' });
  ok(land.length > 1 && port.length >= 1 && port.length < land.length, `khổ dọc ít trang hơn khổ ngang (ngang ${land.length} · dọc ${port.length})`);
  ok(land.every((s, i) => s.boqAppendix!.page === i + 1 && s.boqAppendix!.pages === land.length), 'page/pages đánh liên tục');
  const nos = land.flatMap((s) => texts(s).filter((e) => e.name?.endsWith('· no')).map((e) => Number(e.text)));
  ok(nos.length === 40 && nos.every((n, i) => n === i + 1), 'STT 1..40 liên tục xuyên trang, không mất dòng');
  ok(allText(land[land.length - 1]).includes('TỔNG CỘNG') && !allText(land[0]).includes('TỔNG CỘNG'), 'tổng cộng chỉ ở trang cuối');
  const again = buildBoqAppendixSlides({ rows, errors: [], projectId: 'p1', fingerprint: 'x', generatedAt: 0, lang: 'vi', stagePreset: '16:9' });
  ok(again.length === land.length && again.every((s, i) => allText(s) === allText(land[i])), 'cùng input → cùng chữ từng trang (tất định)');
  // nhóm: đầu nhóm không đứng cuối trang
  const lines = paginateLines([
    ...Array.from({ length: 5 }, (_, i) => ({ t: 'row' as const, row: rows[i], no: i + 1 })),
    { t: 'group' as const, label: 'Tầng 2', inferred: false },
    { t: 'row' as const, row: rows[5], no: 6 },
  ], 6);
  ok(lines.length === 2 && lines[1][0].t === 'group' && lines[0].length === 5, 'đầu nhóm cuối trang bị đẩy sang trang sau');
  const grouped = buildBoqAppendixSlides({
    rows: rows.slice(0, 4), errors: [], projectId: 'p1', fingerprint: 'x', generatedAt: 0, lang: 'vi', groupMode: 'room',
    groups: [
      { key: 'a', label: 'Phòng khách', multiStorey: false, inferred: false, rows: rows.slice(0, 2), subtotalM2: 0, subtotalAmount: 0 },
      { key: 'b', label: 'Bếp', multiStorey: false, inferred: true, rows: rows.slice(2, 4), subtotalM2: 0, subtotalAmount: 0 },
    ],
  });
  const gt = allText(grouped[0]);
  ok(gt.includes('PHÒNG KHÁCH') && gt.includes('BẾP · SUY ĐOÁN THEO VỊ TRÍ') && gt.includes('Cộng · Bếp'), 'dòng nhóm + badge suy đoán + cộng nhóm');
  const groupEl = texts(grouped[0]).find((e) => e.name === 'BOQ · tên nhóm');
  ok(!!groupEl && groupEl.frame.w > 60, `nhãn nhóm trải rộng nhiều cột, không gãy dòng (w=${groupEl?.frame.w.toFixed(1)})`);
}

console.log('[4] Thay cụm trang trong deck — một chỗ, không nhân bản; vị trí chèn theo Story Set');
{
  const deck: EditorDeck = buildStorySetDeck({ projectName: 'Nhà A', sampleImages: false });
  const storyIdx = deck.slides.findIndex((s) => s.templateId === 'story-appendix');
  ok(storyIdx >= 0 && boqAppendixInsertIndex(deck, 0) === storyIdx + 1, 'deck Story Set: chèn ngay sau chương phụ lục');
  const n0 = deck.slides.length;
  const s1 = buildBoqAppendixSlides({ rows: Array.from({ length: 30 }, (_, i) => row(i + 1)), errors: [], projectId: 'p1', fingerprint: 'A', generatedAt: 1, lang: 'vi' });
  const at1 = replaceBoqAppendixSlides(deck, s1, 'p1', 0);
  ok(at1 === storyIdx + 1 && deck.slides.length === n0 + s1.length, `chèn ${s1.length} trang sau story-appendix`);
  ok(findBoqAppendixSlides(deck, 'p1').length === s1.length, 'tìm lại đủ cụm');
  const s2 = buildBoqAppendixSlides({ rows: [row(1)], errors: [], projectId: 'p1', fingerprint: 'B', generatedAt: 2, lang: 'vi' });
  const at2 = replaceBoqAppendixSlides(deck, s2, 'p1', 99);
  ok(at2 === at1 && deck.slides.length === n0 + 1 && findBoqAppendixSlides(deck, 'p1').length === 1, 'làm mới: cụm cũ gỡ hết, cụm mới đứng đúng chỗ cũ');
  ok(findBoqAppendixSlides(deck, 'p2').length === 0, 'dự án khác không bị đụng');
  const plain: EditorDeck = { ...deck, slides: [{ id: 'a', background: '#fff', elements: [] }, { id: 'b', background: '#fff', elements: [] }] };
  ok(boqAppendixInsertIndex(plain, 0) === 1 && boqAppendixInsertIndex(plain, null) === 2, 'deck thường: sau trang đang đứng, không có thì cuối');
}

console.log('[5] Báo cũ theo vân tay + mô tả + round-trip .idfp giữ meta');
{
  const s = buildBoqAppendixSlides({ rows: [row(1)], errors: [], projectId: 'p1', fingerprint: 'h:1|s|0,0', generatedAt: 0, lang: 'vi' });
  const meta = s[0].boqAppendix!;
  ok(isBoqAppendixStale(meta, 'h:1|s|0,0') === false, 'cùng Doc → không cũ');
  ok(isBoqAppendixStale(meta, 'h:1|s|0,1') === true, 'Doc đổi 1 toạ độ → cũ');
  ok(isBoqAppendixStale(meta, null) === null, 'không có Doc sống → không kết luận');
  ok(describeBoqAppendix(meta, 'vi').includes('1 dòng (1 theo máy · 0 sửa tay)'), `mô tả VI: ${describeBoqAppendix(meta, 'vi')}`);
  ok(describeBoqAppendix(meta, 'en').startsWith('BOQ appendix · page 1/1'), 'mô tả EN');
  const deck: EditorDeck = { id: 'd', brand: '', project: 'X', fonts: 'Editorial' as EditorDeck['fonts'], palette: [], slides: s };
  const json = exportIdfp([{ id: 's', name: 'S', deck }], null);
  const back = importIdfp(json);
  const got = back && 'sheets' in back ? (back as { sheets: Array<{ deck: EditorDeck }> }).sheets[0].deck.slides[0].boqAppendix : undefined;
  ok(!!got && got.fingerprint === meta.fingerprint && got.rowCount === 1, 'round-trip .idfp giữ nguyên meta');
}

console.log(`\n${pass} ok · ${fail} fail`);
if (fail) process.exit(1);
