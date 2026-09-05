'use client';

/**
 * components/library/KnowledgeBase.tsx — KHO TRI THỨC (`/library/knowledge`): bày tri thức máy
 * dùng được KÈM NGUỒN GỐC, không phải danh sách tài liệu rời.
 *
 * Nguồn dữ liệu + luật: `lib/library/knowledge.ts` (thuần, có test). Mỗi dòng nói rõ ba điều
 * trước khi nói nội dung: AI BAN HÀNH (loaiNguon) · ĐÃ ĐỐI CHIẾU CHƯA (xacMinh) · CÒN HIỆU LỰC
 * KHÔNG (hieuLuc). Ba thứ đó đi bằng CHỮ + HÌNH (icon), không chỉ bằng màu — luật màu-không-là-
 * kênh-duy-nhất. Nhãn trục nguồn TÁI DÙNG `nhanLoaiNguon` của bảng kiểm (`lib/review/hien-thi-luat`).
 *
 * Trị số (`params`) hiện dạng mono `khoá=giá trị` — đó là phần "máy dùng được" thật sự, và cũng là
 * thứ để KTS thấy app kiểm bằng con số nào (chốt 15/08: kiểm chuẩn = việc của máy, có số).
 */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, CircleDashed, FileText, Scale, Search, ShieldCheck } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useLang, useT } from '@/lib/i18n';
import { nhanLoaiNguon } from '@/lib/review/hien-thi-luat';
import { useKnowledgeEntries } from '@/lib/library/use-library-overview';
import {
  filterKnowledge,
  groupKnowledge,
  NHAN_BINDING,
  NHAN_HIEU_LUC,
  NHAN_NHOM_QUY_CHUAN,
  NHAN_XAC_MINH,
  type KnowledgeEntry,
  type KnowledgeKind,
} from '@/lib/library/knowledge';

const CHIP = 'inline-flex h-7 items-center gap-1 rounded-[var(--r-full)] border px-2.5 text-[length:var(--fs-2xs)] font-medium transition-colors duration-[var(--nhip-bam)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]';
const CHIP_OFF = `${CHIP} border-[var(--vien-mo)] bg-[var(--field)] text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--hover)]`;
const CHIP_ON = `${CHIP} border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--t1)]`;
const TAG = 'inline-flex h-5 items-center gap-1 rounded-[var(--r-1)] border border-[var(--vien-mo)] bg-[var(--field)] px-1.5 text-[length:var(--fs-2xs)] text-[var(--t2)]';

const KIND_CHIPS: { id: KnowledgeKind | 'all'; label: [string, string] }[] = [
  { id: 'all', label: ['Tất cả', 'All'] },
  { id: 'quy-chuan', label: ['Quy chuẩn ngành', 'Standards'] },
  { id: 'tai-lieu-du-an', label: ['Tài liệu dự án', 'Project documents'] },
];

export function KnowledgeBase() {
  const tr = useT();
  const en = useLang() === 'en';
  const projectId = useFlowStore((s) => s.currentProjectId);
  const { entries, stats, loaded } = useKnowledgeEntries(projectId);

  const [q, setQ] = useState('');
  const [kind, setKind] = useState<KnowledgeKind | 'all'>('all');
  const [chiDaKiem, setChiDaKiem] = useState(false);
  const [hienDaThayThe, setHienDaThayThe] = useState(false);

  const filtered = useMemo(() => filterKnowledge(entries, { q, kind, chiDaKiem, anDaThayThe: !hienDaThayThe }), [entries, q, kind, chiDaKiem, hienDaThayThe]);
  const groups = useMemo(() => groupKnowledge(filtered), [filtered]);

  const nhomLabel = (nhom: string) => {
    const hit = NHAN_NHOM_QUY_CHUAN[nhom];
    return hit ? tr(hit[0], hit[1]) : nhom;
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 pb-10 pt-5" data-marker="knowledgeBase">
      <header className="mb-4">
        <h1 className="text-[length:var(--fs-xl)] font-semibold tracking-tight text-[var(--t1)]">{tr('Kho tri thức', 'Knowledge base')}</h1>
        <p className="mt-1 max-w-[70ch] text-[length:var(--fs-sm)] text-[var(--t3)]">
          {tr(
            'Quy chuẩn ngành và tài liệu dự án ở dạng máy đọc được. Mỗi mục ghi ai ban hành, đã đối chiếu chưa, và còn hiệu lực không — không đoán, không tô.',
            'Industry standards and project documents in machine-usable form. Each entry states who issued it, whether it was verified, and whether it is in force — nothing inferred, nothing embellished.',
          )}
        </p>
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[length:var(--fs-2xs)] text-[var(--t3)]">
          <div className="flex gap-1.5"><dt>{tr('Tổng', 'Total')}</dt><dd className="tabular-nums text-[var(--t1)]">{stats.tong}</dd></div>
          <div className="flex gap-1.5"><dt>{tr('Đã đối chiếu nguồn', 'Source verified')}</dt><dd className="tabular-nums text-[var(--t1)]">{stats.daKiem}</dd></div>
          <div className="flex gap-1.5"><dt>{tr('Hiện hành', 'In force')}</dt><dd className="tabular-nums text-[var(--t1)]">{stats.hienHanh}</dd></div>
          <div className="flex gap-1.5"><dt>{tr('Đã thay thế', 'Superseded')}</dt><dd className="tabular-nums text-[var(--t1)]">{stats.daThayThe}</dd></div>
        </dl>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={tr('Bộ lọc', 'Filters')}>
        {KIND_CHIPS.map((c) => (
          <button key={c.id} type="button" aria-pressed={kind === c.id} onClick={() => setKind(c.id)} className={kind === c.id ? CHIP_ON : CHIP_OFF}>
            {tr(c.label[0], c.label[1])}
            {c.id !== 'all' && <span className="tabular-nums text-[var(--t3)]">{stats.theoLoai[c.id]}</span>}
          </button>
        ))}
        <span aria-hidden className="mx-1 h-4 w-px bg-[var(--vien-mo)]" />
        <button type="button" aria-pressed={chiDaKiem} onClick={() => setChiDaKiem((v) => !v)} className={chiDaKiem ? CHIP_ON : CHIP_OFF}>
          <ShieldCheck size={14} aria-hidden="true" />
          {tr('Chỉ đã đối chiếu', 'Verified only')}
        </button>
        <button type="button" aria-pressed={hienDaThayThe} onClick={() => setHienDaThayThe((v) => !v)} className={hienDaThayThe ? CHIP_ON : CHIP_OFF}>
          {tr('Hiện cả đã thay thế', 'Include superseded')}
        </button>
        <label className="ml-auto flex h-8 min-w-[220px] items-center gap-2 rounded-[var(--r-2)] border border-[var(--vien-mo)] bg-[var(--field)] px-2.5 text-[var(--t3)] focus-within:ring-2 focus-within:ring-[var(--accent)]">
          <Search size={14} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr('Tìm theo tên, nguồn, điều khoản…', 'Search title, source, clause…')}
            aria-label={tr('Tìm trong kho tri thức', 'Search the knowledge base')}
            className="min-w-0 flex-1 bg-transparent text-[length:var(--fs-ui)] text-[var(--t1)] placeholder:text-[var(--t4)]"
          />
        </label>
      </div>

      {!projectId && kind !== 'quy-chuan' && (
        <p className="mb-4 rounded-[var(--r-2)] border border-[var(--vien-mo)] bg-[var(--field)] px-3 py-2 text-[length:var(--fs-xs)] text-[var(--t3)]">
          {tr('Tài liệu dự án chỉ hiện khi đang mở một dự án — chọn dự án ở', 'Project documents appear only while a project is open — pick one on')}{' '}
          <Link href="/" className="text-[var(--t1)] underline decoration-[var(--vien-mo)] underline-offset-2 hover:decoration-[var(--t1)]">{tr('Tổng quan', 'Overview')}</Link>.
        </p>
      )}

      {!loaded && <p className="text-[length:var(--fs-sm)] text-[var(--t4)]">{tr('Đang tải…', 'Loading…')}</p>}
      {loaded && filtered.length === 0 && (
        <p className="text-[length:var(--fs-sm)] text-[var(--t3)]">{tr('Không có mục nào khớp bộ lọc.', 'Nothing matches the current filters.')}</p>
      )}

      {groups.map((g) => (
        <section key={g.nhom} className="mb-6" aria-labelledby={`kb-nhom-${g.nhom}`}>
          <h2 id={`kb-nhom-${g.nhom}`} className="mb-2 flex items-baseline gap-2 font-mono text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--t3)]">
            {nhomLabel(g.nhom)}
            <span className="font-normal tabular-nums">{g.items.length}</span>
          </h2>
          <ul className="flex flex-col gap-1.5">
            {g.items.map((e) => (
              <DongTriThuc key={e.id} e={e} en={en} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function DongTriThuc({ e, en }: { e: KnowledgeEntry; en: boolean }) {
  const tr = useT();
  const p = e.provenance;
  const daKiem = p.xacMinh === 'da-kiem';
  const nguonNhan = nhanLoaiNguon(p.loaiNguon);
  const thamSo = e.mayDung.thamSo ? Object.entries(e.mayDung.thamSo) : [];
  return (
    <li className="rounded-[var(--r-3)] border border-[var(--vien-mo)] bg-[var(--card)] px-4 py-3" style={{ boxShadow: 'var(--shadow-node)' }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {e.kind === 'quy-chuan' ? <Scale size={16} className="mt-0.5 shrink-0 text-[var(--t3)]" aria-hidden="true" /> : <FileText size={16} className="mt-0.5 shrink-0 text-[var(--t3)]" aria-hidden="true" />}
            <p className="text-[length:var(--fs-sm)] leading-[1.5] text-[var(--t1)]">{e.title}</p>
          </div>
          <p className="mt-1 pl-[23px] font-mono text-[length:var(--fs-2xs)] text-[var(--t3)]">
            {p.url ? (
              <a href={p.url} target="_blank" rel="noreferrer noopener" className="underline decoration-[var(--vien-mo)] underline-offset-2 hover:text-[var(--t1)]">{p.nguon}</a>
            ) : (
              p.nguon
            )}
            {p.effectiveFrom && <span> · {tr('hiệu lực từ', 'from')} {p.effectiveFrom}</span>}
            {p.supersededBy && <span> · {tr('thay bởi', 'replaced by')} {p.supersededBy}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={TAG} style={daKiem ? { color: 'var(--t1)' } : undefined}>
            {daKiem ? <ShieldCheck size={14} aria-hidden="true" /> : <CircleDashed size={14} aria-hidden="true" />}
            {tr(NHAN_XAC_MINH[p.xacMinh][0], NHAN_XAC_MINH[p.xacMinh][1])}
          </span>
          {e.kind === 'quy-chuan' && <span className={TAG}>{en ? nguonNhan.en : nguonNhan.vi}</span>}
          {p.region && <span className={TAG}>{p.region}</span>}
          {p.binding && <span className={TAG}>{tr(NHAN_BINDING[p.binding][0], NHAN_BINDING[p.binding][1])}</span>}
          {e.hieuLuc !== 'hien-hanh' && <span className={TAG}>{tr(NHAN_HIEU_LUC[e.hieuLuc][0], NHAN_HIEU_LUC[e.hieuLuc][1])}</span>}
          {p.loaiNguon === 'luat' && !p.coNguyenVan && <span className={TAG}>{tr('Chưa có nguyên văn', 'No verbatim text')}</span>}
        </div>
      </div>

      {(thamSo.length > 0 || e.mayDung.soChunk !== undefined) && (
        <ul className="mt-2 flex flex-wrap gap-1.5 pl-[23px]" aria-label={tr('Phần máy dùng được', 'Machine-usable part')}>
          {thamSo.map(([k, v]) => (
            <li key={k} className="rounded-[var(--r-1)] bg-[var(--field)] px-1.5 py-0.5 font-mono text-[length:var(--fs-2xs)] tabular-nums text-[var(--t2)]">
              {k}={v}
            </li>
          ))}
          {e.mayDung.soChunk !== undefined && (
            <li className="rounded-[var(--r-1)] bg-[var(--field)] px-1.5 py-0.5 font-mono text-[length:var(--fs-2xs)] tabular-nums text-[var(--t2)]">
              {e.mayDung.soChunk} {tr('đoạn đã cắt', 'chunks')} · {e.mayDung.sanSang ? tr('hỏi được', 'queryable') : tr('chưa sẵn sàng', 'not ready')}
            </li>
          )}
        </ul>
      )}

      {(p.ghiChu || e.ghiChuHieuLuc) && (
        <p className="mt-2 pl-[23px] text-[length:var(--fs-2xs)] leading-[1.5] text-[var(--t3)]">{e.ghiChuHieuLuc ?? p.ghiChu}</p>
      )}

      {e.href && (
        <Link href={e.href} className="mt-2 inline-flex items-center gap-1 pl-[23px] text-[length:var(--fs-2xs)] text-[var(--t2)] hover:text-[var(--t1)]">
          {tr('Mở Sổ tay dự án', 'Open project notebook')}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      )}
    </li>
  );
}
