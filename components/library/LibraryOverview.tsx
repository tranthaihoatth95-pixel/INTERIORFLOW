'use client';

/**
 * components/library/LibraryOverview.tsx — TRANG TỔNG THƯ VIỆN (`/library`), mặt thứ nhất của
 * Master Library theo chốt 10/08 ("trang tổng là gallery/collection"). Tấm `LibrarySheet` vẫn là
 * nơi KÉO-THẢ vào bàn làm việc; trang này là nơi ĐỨNG NHÌN toàn kho và đi tiếp đúng cửa.
 *
 * Bảng khai mục + số đếm nằm ở `lib/library/overview.ts` (thuần, có test) — file này chỉ VẼ.
 * Đây là bề mặt ỨNG DỤNG bình thường: không lưới vô hạn, không crosshair, không cảm giác canvas.
 *
 * Vỏ thẻ: TÁI DÙNG `WidgetCard` của Home (kính lỏng, hairline `--vien-mo`, bo `--r-3`, số ô
 * mono) — một vỏ cho hai bề mặt "đứng nhìn" (Home · Thư viện), không đẻ vỏ thứ hai.
 * Nút mờ (Collection+ chưa có mã) đi đường `aria-disabled` + `aria-describedby`, KHÔNG `disabled`,
 * KHÔNG `title` — bài học đo được 16/08 (`ToolbarChip.tsx`): nút disabled bị Tab bỏ qua, title câm
 * trên cảm ứng. Số ô "01…" là ĐỊA CHỈ để chỉ chỗ khi duyệt mắt (cùng luật `bento-layout.ts`).
 */

import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';
import {
  ArrowUpRight, BookOpenText, Box, Boxes, Dna, Download, FileStack, Folder, Images, LayoutTemplate, Layers, Palette, PencilRuler, RefreshCw, type LucideIcon,
} from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import WidgetCard from '@/components/home/widgets/WidgetCard';
import Tooltip from '@/components/ui/Tooltip';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import { exportIdfcStoreJson } from '@/lib/library/idfc-store';
import { taiVeJson } from '@/lib/library/tai-ve-json';
import { pushLibraryToast } from '@/components/library/LibraryToast';
import { useLibraryOverview } from '@/lib/library/use-library-overview';
import { sectionIndexMap, type HanhDong, type OverviewSection, type OverviewSectionId } from '@/lib/library/overview';

const ICON: Record<OverviewSectionId, LucideIcon> = {
  files: Folder,
  'cau-kien': Box,
  'vat-lieu': Palette,
  'anh-tai-san': Images,
  'ky-hieu-2d': PencilRuler,
  'mo-hinh-3d': Boxes,
  'mau-ho-so': LayoutTemplate,
  'the-dna': Dna,
  'tri-thuc': BookOpenText,
  'bo-suu-tap': Layers,
};

const BTN = 'inline-flex h-[var(--tap)] items-center gap-1.5 rounded-[var(--r-2)] px-3 text-[length:var(--fs-ui)] font-medium transition-colors duration-[var(--nhip-bam)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]';
const BTN_CHINH = `${BTN} bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]`;
const BTN_PHU = `${BTN} border border-[var(--vien-mo)] bg-[var(--field)] text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--hover)]`;

export function LibraryOverview() {
  const tr = useT();
  const projectId = useFlowStore((s) => s.currentProjectId);
  const { sections, refresh } = useLibraryOverview(projectId);
  const idx = useMemo(() => sectionIndexMap(sections), [sections]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-10 pt-5" data-marker="libraryOverview">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[length:var(--fs-xl)] font-semibold tracking-tight text-[var(--t1)]">{tr('Thư viện', 'Library')}</h1>
          <p className="mt-1 max-w-[62ch] text-[length:var(--fs-sm)] text-[var(--t3)]">
            {tr(
              'Kho tài sản dùng lại của studio — một nguồn, ba chặng cùng đọc. Kéo vào bàn làm việc bằng tấm Thư viện.',
              'The studio’s reusable asset store — one source, read by all three stages. Drag into your workspace with the Library sheet.',
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={refresh} className={BTN_PHU} aria-label={tr('Tải lại số đếm', 'Reload counts')}>
            <RefreshCw size={14} aria-hidden="true" />
            {tr('Tải lại', 'Reload')}
          </button>
          <Link href="/library/ingest" className={BTN_PHU}>
            <FileStack size={14} aria-hidden="true" />
            {tr('Nhập tài sản', 'Ingest assets')}
          </Link>
          <button type="button" onClick={() => openLibrarySheet()} className={BTN_CHINH}>
            {tr('Mở tấm Thư viện', 'Open Library sheet')}
            <kbd className="ml-1 rounded-[var(--r-1)] bg-black/20 px-1.5 font-mono text-[length:var(--fs-2xs)]">L</kbd>
          </button>
        </div>
      </header>

      <div className="grid gap-[var(--gap)]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {sections.map((s) => (
          <MucCard key={s.id} muc={s} index={idx[s.id]} projectId={projectId} />
        ))}
      </div>
    </div>
  );
}

function MucCard({ muc, index, projectId }: { muc: OverviewSection; index: string; projectId: string | null }) {
  const tr = useT();
  const Icon = ICON[muc.id];
  const mo = muc.trangThai === 'chuaNoi';
  const idLyDo = `lib-muc-ly-do-${muc.id}`;
  const lyDo = muc.chinh.kieu === 'khong' ? tr(muc.chinh.lyDo[0], muc.chinh.lyDo[1]) : null;

  // Thẻ DNA sống theo DỰ ÁN (route `/projects/[id]/overview`) — có dự án mở thì dẫn thẳng vào đó,
  // chưa mở thì về Tổng quan để chọn. Không bịa trang "/dna" chung chưa tồn tại.
  const chinh: HanhDong =
    muc.id === 'the-dna' ? (projectId ? { kieu: 'route', href: `/projects/${projectId}/overview` } : { kieu: 'route', href: '/' }) : muc.chinh;
  const nhanChinh =
    muc.id === 'the-dna'
      ? projectId
        ? tr('Mở thẻ của dự án này', 'Open this project’s cards')
        : tr('Chọn dự án ở Tổng quan', 'Pick a project on Overview')
      : chinh.kieu === 'sheet'
        ? tr('Mở kệ', 'Open shelf')
        : tr('Mở', 'Open');

  return (
    <section id={`muc-${muc.id}`} aria-labelledby={`muc-${muc.id}-h`} className="min-h-[220px] scroll-mt-4" style={mo ? { opacity: 'var(--mo-vo-hieu)' } : undefined}>
      <WidgetCard title={tr(muc.label[0], muc.label[1])} index={index} action={<Icon size={16} strokeWidth={1.75} className="text-[var(--t3)]" aria-hidden="true" />}>
        <div className="flex h-full flex-col gap-3">
          <SoDem muc={muc} />
          <p id={`muc-${muc.id}-h`} className="text-[length:var(--fs-xs)] leading-[1.5] text-[var(--t3)]">
            {tr(muc.moTa[0], muc.moTa[1])}
          </p>
          {muc.chiTiet.length > 0 && (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[length:var(--fs-2xs)] text-[var(--t3)]">
              {muc.chiTiet.map((c, i) => (
                <li key={i} className="tabular-nums">{tr(c[0], c[1])}</li>
              ))}
            </ul>
          )}
          {muc.thumbs.length > 0 && (
            <ul className="flex gap-1.5" aria-label={tr('Xem trước', 'Preview')}>
              {muc.thumbs.map((t) => (
                <li key={t.id} className="h-11 w-11 overflow-hidden rounded-[var(--r-1)] border border-[var(--vien-mo)] bg-[var(--field)]">
                  {/* Ảnh thu nhỏ đã có sẵn ở /api/library/[id]/file — metadata/thumb trước, hình học nặng để dành lúc mở. */}
                  <img src={t.url} alt={t.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            {lyDo ? (
              <Tooltip label={tr(muc.label[0], muc.label[1])} desc={lyDo}>
                <button type="button" aria-disabled="true" aria-describedby={idLyDo} className={`${BTN_PHU} cursor-not-allowed`}>
                  {tr('Chưa có mã', 'No code yet')}
                </button>
                <span id={idLyDo} className="if-tooltip-a11y">{lyDo}</span>
              </Tooltip>
            ) : (
              <HanhDongNut hanhDong={chinh} className={BTN_CHINH}>
                {nhanChinh}
              </HanhDongNut>
            )}
            {muc.phu && (
              <HanhDongNut hanhDong={muc.phu.hanhDong} className={BTN_PHU}>
                {tr(muc.phu.label[0], muc.phu.label[1])}
                <ArrowUpRight size={14} aria-hidden="true" />
              </HanhDongNut>
            )}
            {muc.id === 'cau-kien' && (muc.count ?? 0) > 0 && <XuatKhoIdfc soMon={muc.count ?? 0} />}
          </div>
        </div>
      </WidgetCard>
    </section>
  );
}


/** Nút XUẤT KHO CẤU KIỆN — mặt cho một năng lực đã có mà chưa ai gọi.
 *
 * `exportIdfcStoreJson()` (`lib/library/idfc-store.ts:84`) ra đời ở W0.3 kèm ghi chú "năng lực
 * trước, nút UI gọi sau (luật 7)" và từ đó đứng im **0 caller** — audit của repo xếp nó vào diện
 * cân nhắc gỡ. Nó không đáng gỡ: kho `.idfc` studio nằm trong IndexedDB của MỘT trình duyệt, nên
 * không có đường mang sang máy khác thì đó là dữ liệu bị nhốt. Trang tổng là chỗ đứng đúng của
 * nút này — nơi người dùng đang NHÌN cả kho, không phải nơi đang thao tác một món.
 *
 * Chỉ hiện khi kho có món: nút xuất ra tệp rỗng là nút nói dối về việc mình vừa làm.
 */
function XuatKhoIdfc({ soMon }: { soMon: number }) {
  const tr = useT();
  return (
    <button
      type="button"
      className={BTN_PHU}
      onClick={() => {
        // Ngày trong tên tệp theo giờ MÁY NGƯỜI DÙNG — bản sao lưu là để họ tìm lại, không phải
        // để máy đọc; `sv-SE` cho đúng dạng YYYY-MM-DD tự xếp thứ tự trong thư mục.
        const ngay = new Date().toLocaleDateString('sv-SE');
        taiVeJson(exportIdfcStoreJson(), `if-cau-kien-${ngay}.json`);
        pushLibraryToast(tr(`Đã xuất ${soMon} cấu kiện ra tệp JSON`, `Exported ${soMon} components to a JSON file`));
      }}
    >
      <Download size={14} aria-hidden="true" />
      {tr('Xuất JSON', 'Export JSON')}
    </button>
  );
}

/** Con số lớn — hoặc chữ trạng thái khi không có số. Không bao giờ hiện "0" như thể là số đo
 * khi kho chưa tải; "Kho trống" và "Đang tải" là hai điều khác nhau, phải nói khác nhau. */
function SoDem({ muc }: { muc: OverviewSection }) {
  const tr = useT();
  if (muc.trangThai === 'dangTai') return <div className="text-[length:var(--fs-sm)] text-[var(--t4)]">{tr('Đang tải…', 'Loading…')}</div>;
  if (muc.trangThai === 'chuaNoi') return <div className="text-[length:var(--fs-sm)] text-[var(--t3)]">{tr('Chưa nối', 'Not connected')}</div>;
  if (muc.count === null) return <div className="text-[length:var(--fs-sm)] text-[var(--t3)]">{tr('Bề mặt riêng — mở để duyệt', 'Own surface — open to browse')}</div>;
  if (muc.count === 0) {
    const [vi, en] = muc.trong ?? ['Kho trống — nhập từ Files hoặc tấm Thư viện', 'Empty — ingest from Files or the Library sheet'];
    return <div className="text-[length:var(--fs-sm)] text-[var(--t3)]">{tr(vi, en)}</div>;
  }
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[length:var(--fs-xl)] font-semibold tabular-nums leading-none text-[var(--t1)]">{muc.count}</span>
      <span className="text-[length:var(--fs-xs)] text-[var(--t3)]">{tr('món', 'items')}</span>
    </div>
  );
}

function HanhDongNut({ hanhDong, className, children }: { hanhDong: HanhDong; className: string; children: ReactNode }) {
  if (hanhDong.kieu === 'route') {
    return (
      <Link href={hanhDong.href} className={className}>
        {children}
      </Link>
    );
  }
  if (hanhDong.kieu === 'sheet') {
    return (
      <button type="button" onClick={() => openLibrarySheet({ shelfId: hanhDong.shelfId, stage: hanhDong.stage })} className={className}>
        {children}
      </button>
    );
  }
  return null;
}
