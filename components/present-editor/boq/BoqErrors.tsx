'use client';

/**
 * components/present-editor/boq/BoqErrors.tsx — B3 (`docs/PHIEU-TRINH-BOQ-EDITOR.md`): LỖI LÀ DỮ
 * LIỆU HẠNG NHẤT. Banner đếm lỗi + khối lỗi riêng — mỗi lỗi hiện NGUYÊN VĂN `err.message` (đã
 * tiếng Việt, sinh từ `lib/boq/compute.ts`), KHÔNG viết lại câu lỗi ở tầng UI. `totalAmount` không
 * đổi khi có lỗi (đã đúng ở engine — `BoqResult.totalAmount` chỉ cộng `rows`, không cộng lỗi).
 */
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useCadStore } from '@/lib/cad/store';
import type { BoqError } from '@/lib/boq/model';

function actionLabel(err: BoqError, tr: (vi: string, en: string) => string): string {
  switch (err.reason) {
    case 'missing-specId':
    case 'spec-not-found':
      return tr(`Xem ${err.entityIds.length} vùng này`, `View ${err.entityIds.length} region(s)`);
    case 'overlapping-region':
      return tr(`Xem ${err.entityIds.length} vùng chồng lấn`, `View ${err.entityIds.length} overlapping region(s)`);
    case 'missing-priceVnd':
      return tr('Mở vật liệu', 'Open material');
  }
}

export function BoqErrorBanner({ errors }: { errors: BoqError[] }) {
  const tr = useT();
  if (!errors.length) return null;
  return (
    <div
      style={{
        margin: '8px 14px 0', display: 'flex', alignItems: 'center', gap: 9,
        background: 'color-mix(in srgb, var(--danger) 14%, var(--panel))',
        borderRadius: 10, padding: '7px 12px', fontSize: 13, color: 'var(--t1)',
      }}
    >
      <AlertTriangle size={15} style={{ color: 'var(--danger)', flexShrink: 0 }} />
      {tr(`${errors.length} vùng chưa vào tổng`, `${errors.length} region(s) not counted`)}
    </div>
  );
}

export function BoqErrorRows({ errors, projectId, columns }: { errors: BoqError[]; projectId: string; columns: number }) {
  const tr = useT();
  const router = useRouter();

  const onAction = (err: BoqError) => {
    if (err.reason === 'missing-priceVnd') {
      router.push('/library');
      return;
    }
    if (err.entityIds.length) {
      useCadStore.getState().select(err.entityIds);
      router.push(`/projects/${projectId}/cad`);
    }
  };

  if (!errors.length) return null;
  return (
    <>
      {errors.map((err, i) => (
        <tr key={`${err.reason}-${err.matId ?? i}`} style={{ background: 'color-mix(in srgb, var(--danger) 8%, var(--panel))' }}>
          <td colSpan={columns} style={{ padding: '0 10px', height: 'var(--row, 28px)', color: 'var(--t2)', fontSize: 13 }}>
            <AlertTriangle size={12} style={{ color: 'var(--danger)', display: 'inline-block', verticalAlign: -2, marginRight: 6 }} />
            {err.message}
            <button
              type="button"
              onClick={() => onAction(err)}
              style={{
                height: 22, padding: '0 9px', marginLeft: 8, border: 0, borderRadius: 7,
                background: 'var(--danger)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {actionLabel(err, tr)}
            </button>
          </td>
        </tr>
      ))}
    </>
  );
}
