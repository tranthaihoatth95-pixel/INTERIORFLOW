'use client';

/**
 * components/present-editor/boq/BoqAppendixStatus.tsx — ô trạng thái của MỘT TRANG PHỤ LỤC BOQ
 * trong Inspector (02/09). Cùng khuôn `RecipeStatus` (Inspector.tsx, ảnh "có công thức"): đọc
 * Doc SỐNG qua `getProjectDoc` → so vân tay với lúc dựng → báo "đã cũ so với bản vẽ" + nút
 * "Làm mới" (thay đúng cụm trang, một lượt undo — logic ở PresentEditor#onInsertBoqAppendix).
 * KHÔNG tự làm mới sau lưng (L5) — chỉ báo cờ, người bấm.
 *
 * Khai thật giới hạn: chỉ so BẢN VẼ; giá đổi trong Kho vật liệu KHÔNG bắt được ở đây.
 */
import { useEffect, useState } from 'react';
import { RefreshCw, TableProperties } from 'lucide-react';
import { useT, useLang } from '@/lib/i18n';
import { RADIUS } from '@/lib/geometry';
import { useFlowStore } from '@/lib/store';
import { effectiveUserId } from '@/lib/resume';
import type { BoqAppendixMeta } from '@/lib/present-editor/model';
import { describeBoqAppendix, isBoqAppendixStale } from '@/lib/present-editor/boq-appendix';
import { liveBoqFingerprint } from '@/lib/present-editor/boq-appendix-source';

export function BoqAppendixStatus({ meta, onRefresh, busy }: { meta: BoqAppendixMeta; onRefresh?: () => void | Promise<void>; busy?: boolean }) {
  const tr = useT();
  const lang = useLang();
  const storeUserId = useFlowStore((s) => s.user?.id);
  const userId = effectiveUserId(storeUserId) ?? '';
  const [stale, setStale] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const live = await liveBoqFingerprint(userId, meta.projectId);
        if (!cancelled) setStale(isBoqAppendixStale(meta, live));
      } catch {
        if (!cancelled) setStale(null);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, meta.projectId, meta.fingerprint]);

  const when = new Date(meta.generatedAt);
  const stamp = Number.isFinite(when.getTime()) ? when.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB') : '—';
  const staleText = stale === true
    ? tr('Bản vẽ đã đổi từ lúc dựng — số trên trang có thể không còn đúng.', 'The drawing changed since this page was built — numbers may be out of date.')
    : stale === false
      ? tr('Khớp bản vẽ hiện tại.', 'Matches the current drawing.')
      : tr('Chưa đọc được bản vẽ sống để so — mở chặng Thiết kế 2D một lần.', 'No live drawing to compare — open the 2D Design stage once.');

  return (
    <div
      role="group"
      aria-label={tr('Phụ lục BOQ', 'BOQ appendix')}
      style={{ display: 'grid', gap: 6, padding: '10px 12px', borderRadius: RADIUS.r2, border: '1px solid var(--border)', background: 'var(--card)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>
        <TableProperties size={14} aria-hidden /> {describeBoqAppendix(meta, lang)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4 }}>
        {tr('Dựng lúc', 'Built')} {stamp} · {tr('vân tay', 'fingerprint')} <code style={{ fontSize: 10 }}>{meta.fingerprint}</code>
      </div>
      <div
        role="status"
        style={{ fontSize: 11, lineHeight: 1.4, color: stale === true ? 'var(--warning)' : 'var(--t2)', fontWeight: stale === true ? 600 : 400 }}
      >
        {stale === true ? '⚠ ' : ''}{staleText}
      </div>
      <div style={{ fontSize: 11, color: 'var(--t4)', lineHeight: 1.4 }}>
        {tr('Số sửa tay trên trang lấy từ Bảng tính BOQ (✎, số máy trong ngoặc). Chỉ so bản vẽ — giá đổi trong Kho vật liệu không tự báo.', 'Hand-edited numbers come from the BOQ sheet (✎, machine value in brackets). Only the drawing is compared — price changes in the library are not flagged.')}
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={() => { void onRefresh(); }}
          aria-disabled={busy || undefined}
          aria-busy={busy || undefined}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 32, padding: '0 12px',
            borderRadius: RADIUS.r1, border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--t1)', fontSize: 12,
            cursor: busy ? 'progress' : 'pointer', opacity: busy ? 'var(--mo-vo-hieu, 0.6)' : 1,
          }}
        >
          <RefreshCw size={14} aria-hidden /> {busy ? tr('Đang dựng lại…', 'Rebuilding…') : tr('Làm mới từ bản vẽ + BOQ', 'Rebuild from drawing + BOQ')}
        </button>
      )}
    </div>
  );
}
