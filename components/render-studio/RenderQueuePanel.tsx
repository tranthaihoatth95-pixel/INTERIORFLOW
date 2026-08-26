'use client';

/**
 * components/render-studio/RenderQueuePanel.tsx — [marker: RenderQueue] BẢNG HÀNG ĐỢI RENDER.
 *
 * Một dải thẻ, mỗi thẻ MỘT VIEW: ảnh nguồn → cung `LightArc` + % SỐ THẬT (tabular-nums) → xong
 * thì thumbnail ĐỔI SANG ẢNH KẾT QUẢ ngay tại chỗ, bấm phóng to (lightbox chung của app).
 * Trạng thái đọc bằng MÀU CÓ NGHĨA: đang chạy `--accent` · xong `--success` · lỗi `--danger`
 * kèm lý do đã dịch sang tiếng người. Không có màu trang trí.
 *
 * Vật liệu khung: khuôn kính của `ToolWindow.tsx` — VỎ kính mờ, RUỘT (thumbnail) sắc nét không
 * phủ màu. Bo góc theo thang đã duyệt (--r-14 vỏ, --r-10 thẻ, --r-6 thumbnail; đệm ≤8 nên bo
 * đồng tâm rInner = rOuter − pad).
 *
 * Nếp cửa sổ nổi: mặc định THU thành pill góc phải-dưới; bấm mở ra bảng; bấm − thu lại. Hàng đợi
 * rỗng thì KHÔNG mount gì (không để khung trống chiếm góc màn).
 *
 * Số liệu KHÔNG bịa: tổng ghi "n/m xong"; thời gian còn lại chỉ hiện khi đã có job xong để lấy
 * nhịp thật, chưa có thì ghi "—" (xem `estimateRemainingMs`).
 */

import { useMemo } from 'react';
import { Minus, X, ListVideo, Plus, Trash2, ImageOff } from 'lucide-react';
import LightArc from '@/components/ui/LightArc';
// R5 (19/08) — job ĐANG CHẠY dùng THANH `LightBar` (luật Hoà 16/08 "cái gì đang chạy cũng phải
// có thanh"; trước đây LightBar mồ côi 0 importer). Pill thu gọn giữ `LightArc` (vòng cung nhỏ
// vừa pill) — hai mặt tiền cùng MỘT lõi lib/ui/tien-trinh.ts, không phải hai bộ logic.
import LightBar from '@/components/ui/LightBar';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import {
  useRenderQueue,
  enqueueSelectedNodes,
  estimateRemainingMs,
  type RenderQueueJob,
  type RenderQueueStatus,
} from './render-queue-store';

const STATUS_COLOR: Record<RenderQueueStatus, string> = {
  queued: 'var(--t3)',
  running: 'var(--accent)',
  done: 'var(--success)',
  error: 'var(--danger)',
  cancelled: 'var(--t3)',
};

function statusLabel(s: RenderQueueStatus, tr: (vi: string, en: string) => string): string {
  switch (s) {
    case 'queued':
      return tr('Đang chờ', 'Waiting');
    case 'running':
      return tr('Đang dựng', 'Rendering');
    case 'done':
      return tr('Xong', 'Done');
    case 'error':
      return tr('Lỗi', 'Failed');
    case 'cancelled':
      return tr('Đã huỷ', 'Cancelled');
  }
}

/** "2 phút 10 giây" / "45 giây" — không hiện mili-giây, không hiện số lẻ vô nghĩa. */
function humanMs(ms: number, tr: (vi: string, en: string) => string): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} ${tr('giây', 's')}`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `${m} ${tr('phút', 'm')} ${rest} ${tr('giây', 's')}` : `${m} ${tr('phút', 'm')}`;
}

export default function RenderQueuePanel() {
  const jobs = useRenderQueue((s) => s.jobs);
  const expanded = useRenderQueue((s) => s.expanded);
  const setExpanded = useRenderQueue((s) => s.setExpanded);
  const cancel = useRenderQueue((s) => s.cancel);
  const cancelAll = useRenderQueue((s) => s.cancelAll);
  const clearFinished = useRenderQueue((s) => s.clearFinished);
  const setLightboxUrl = useFlowStore((s) => s.setLightboxUrl);
  const selectedCount = useFlowStore(
    (s) => s.nodes.filter((n) => n.selected && n.type === 'interior').length,
  );
  const tr = useT();

  const doneCount = jobs.filter((j) => j.status === 'done').length;
  const activeCount = jobs.filter((j) => j.status === 'queued' || j.status === 'running').length;
  const running = jobs.find((j) => j.status === 'running');
  const remainMs = useMemo(() => estimateRemainingMs(jobs), [jobs]);

  if (jobs.length === 0) return null;

  const summary = `${doneCount}/${jobs.length} ${tr('xong', 'done')}`;
  const remainText =
    activeCount === 0
      ? null
      : remainMs == null
        ? '—'
        : `${tr('còn ~', '~')}${humanMs(remainMs, tr)}`;

  /* ── THU: pill góc phải-dưới ─────────────────────────────────────────────────────────────── */
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="glass-float glass-float--bar"
        title={tr('Mở hàng đợi render', 'Open render queue')}
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 'var(--tap-lg)',
          padding: '0 14px',
          color: 'var(--t1)',
          fontSize: 'var(--fs-ui)',
        }}
      >
        <LightArc
          size={20}
          strokeWidth={1.5}
          value={running ? running.progress * 100 : activeCount > 0 ? undefined : 100}
          label={tr('Tiến trình hàng đợi render', 'Render queue progress')}
        />
        <span style={{ fontWeight: 600 }}>{tr('Hàng đợi render', 'Render queue')}</span>
        <span style={{ color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>{summary}</span>
      </button>
    );
  }

  /* ── MỞ: bảng kính ───────────────────────────────────────────────────────────────────────── */
  return (
    <section
      aria-label={tr('Hàng đợi render', 'Render queue')}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 32,
        width: 'min(400px, calc(100vw - 32px))',
        maxHeight: 'min(560px, calc(100vh - 140px))',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--border-strong)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
        background: 'color-mix(in srgb, var(--panel) 82%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* VỎ — đầu bảng */}
      <header
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <ListVideo size={16} style={{ color: 'var(--t2)', flex: 'none' }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
            {tr('Hàng đợi render', 'Render queue')}
          </p>
          <p
            style={{
              fontSize: 11,
              color: 'var(--t3)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {summary}
            {remainText ? ` · ${remainText}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          title={tr('Thu về góc màn', 'Collapse')}
          aria-label={tr('Thu về góc màn', 'Collapse')}
          style={{ padding: 6, borderRadius: 10, color: 'var(--t3)' }}
        >
          <Minus size={14} />
        </button>
      </header>

      {/* RUỘT — dải thẻ view */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 8, display: 'grid', gap: 8 }}>
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            tr={tr}
            onCancel={() => cancel(job.id)}
            onZoom={(url) => setLightboxUrl(url)}
          />
        ))}
      </div>

      {/* Chân bảng — thêm việc / huỷ / dọn */}
      <footer
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: 8,
          borderTop: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => enqueueSelectedNodes()}
          disabled={selectedCount === 0}
          title={
            selectedCount === 0
              ? tr('Chọn khối trên bảng làm việc trước', 'Select blocks on the canvas first')
              : tr('Thêm khối đang chọn vào hàng đợi', 'Add selected blocks to the queue')
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 'var(--tap)',
            padding: '0 10px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            color: selectedCount === 0 ? 'var(--t3)' : 'var(--t1)',
            opacity: selectedCount === 0 ? 0.55 : 1,
            fontSize: 12,
          }}
        >
          <Plus size={18} />
          {tr('Thêm vào hàng đợi', 'Add to queue')}
          {selectedCount > 0 ? (
            <span style={{ color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
              ({selectedCount})
            </span>
          ) : null}
        </button>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={cancelAll}
          disabled={activeCount === 0}
          title={tr('Huỷ mọi việc đang chờ và đang dựng', 'Cancel all waiting and running')}
          style={{
            height: 'var(--tap)',
            padding: '0 10px',
            borderRadius: 10,
            color: activeCount === 0 ? 'var(--t3)' : 'var(--danger)',
            opacity: activeCount === 0 ? 0.55 : 1,
            fontSize: 12,
          }}
        >
          {tr('Huỷ tất cả', 'Cancel all')}
        </button>
        <button
          type="button"
          onClick={clearFinished}
          title={tr('Dọn thẻ đã kết thúc', 'Clear finished cards')}
          aria-label={tr('Dọn thẻ đã kết thúc', 'Clear finished cards')}
          style={{ padding: 7, borderRadius: 10, color: 'var(--t3)' }}
        >
          <Trash2 size={14} />
        </button>
      </footer>
    </section>
  );
}

/* ─────────────────────────────────────── thẻ một view ───────────────────────────────────────── */

function JobCard({
  job,
  tr,
  onCancel,
  onZoom,
}: {
  job: RenderQueueJob;
  tr: (vi: string, en: string) => string;
  onCancel: () => void;
  onZoom: (url: string) => void;
}) {
  const color = STATUS_COLOR[job.status];
  const active = job.status === 'queued' || job.status === 'running';
  // Xong thì thumbnail LÀ ảnh kết quả; chưa xong thì ảnh nguồn để nhận ra view.
  const thumb = job.resultUrl ?? job.sourceUrl;
  const isResult = Boolean(job.resultUrl);
  const pct = Math.round(job.progress * 100);
  const took =
    job.startedAt && job.finishedAt ? humanMs(job.finishedAt - job.startedAt, tr) : null;

  return (
    <article
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 6,
        borderRadius: 10,
        border: '1px solid var(--border)',
        // Trạng thái = màu NỀN rất nhạt + vạch trái, không phải viền loè loẹt (§2c).
        background:
          job.status === 'running'
            ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
            : 'var(--bg)',
        borderLeft: `3px solid ${color}`,
      }}
    >
      {/* thumbnail — RUỘT sắc nét, không phủ kính */}
      <button
        type="button"
        onClick={() => thumb && onZoom(thumb)}
        disabled={!thumb}
        title={
          thumb
            ? isResult
              ? tr('Phóng to ảnh kết quả', 'Zoom result image')
              : tr('Phóng to ảnh nguồn', 'Zoom source image')
            : tr('Chưa có ảnh', 'No image yet')
        }
        style={{
          flex: 'none',
          width: 64,
          height: 44,
          borderRadius: 6,
          overflow: 'hidden',
          border: `1px solid ${isResult ? 'var(--success)' : 'var(--border)'}`,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--panel)',
          cursor: thumb ? 'zoom-in' : 'default',
        }}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={job.viewName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <ImageOff size={20} style={{ color: 'var(--t3)' }} />
        )}
      </button>

      {/* tên view + trạng thái */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--t1)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {job.viewName}
        </p>
        <p
          style={{
            fontSize: 11,
            color: job.status === 'error' ? 'var(--danger)' : 'var(--t3)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={job.error}
        >
          {statusLabel(job.status, tr)}
          {job.status === 'error' && job.error ? ` — ${job.error}` : ''}
          {job.status === 'done' && took ? ` · ${took}` : ''}
        </p>

        {/* R5 (19/08) — THANH tiến trình cho job đang chạy (thay cụm cung+% cũ, tránh nói cùng
            một tin hai lần). Hai nhánh của union lõi tien-trinh.ts:
            · progress > 0  → SỐ THẬT engine đã báo (relay ở render-queue-store) ⇒ nhánh ĐO ĐƯỢC,
              LightBar tự in % (hienSo mặc định bật).
            · progress = 0  → số 0 là store TỰ GHI lúc chuyển sang running (store:155), engine
              CHƯA báo con số nào ⇒ truyền undefined = nhánh KHÔNG ĐO ĐƯỢC (rai trôi, không số).
              Bịa "0%" đứng yên chính là loại số giả luật 16/08 cấm.
            `soVach` hạ 20 vì thanh này hẹp (~230px trong bảng 400px) — xem ghi chú LightBar. */}
        {job.status === 'running' && (
          <div style={{ marginTop: 5 }}>
            <LightBar
              value={job.progress > 0 ? pct : undefined}
              soVach={20}
              height={7}
              label={job.viewName}
            />
          </div>
        )}
      </div>

      {active ? (
        <button
          type="button"
          onClick={onCancel}
          title={tr('Huỷ việc này', 'Cancel this job')}
          aria-label={tr('Huỷ việc này', 'Cancel this job')}
          style={{ flex: 'none', padding: 6, borderRadius: 10, color: 'var(--t3)' }}
        >
          <X size={14} />
        </button>
      ) : null}
    </article>
  );
}
