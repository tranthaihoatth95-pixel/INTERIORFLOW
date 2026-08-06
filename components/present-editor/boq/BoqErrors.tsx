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
    // 06/08 (G-M3-09) — món rời: đưa thẳng tới CHÍNH những món đang rơi khỏi báo giá, không bắt
    // người dùng tự đi tìm "cái ghế nào".
    case 'missing-specId-item':
      return tr(`Xem ${err.entityIds.length} món chưa gán mã`, `View ${err.entityIds.length} unlinked item(s)`);
    case 'specId-both-kinds':
      return tr('Mở kho vật liệu', 'Open material library');
    // KIỂM PHẢN BIỆN 06/08 — 4 lý do "số sai trông như đúng". Việc phải làm nằm ở KHO (sửa
    // giá/đơn vị) hay trên BẢN VẼ (vẽ lại vùng tô), nút đưa thẳng tới đúng nơi đó.
    case 'invalid-geometry':
      return tr(`Xem ${err.entityIds.length} vùng hỏng`, `View ${err.entityIds.length} broken region(s)`);
    case 'unit-mismatch':
    case 'unknown-unit':
    case 'invalid-price':
      return tr('Sửa trong kho vật liệu', 'Fix in material library');
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
    // Trùng mã 2 kiểu / đơn vị sai / giá hỏng ⇒ việc phải làm nằm ở KHO, không phải trên bản vẽ.
    if (err.reason === 'specId-both-kinds' || err.reason === 'unit-mismatch' || err.reason === 'unknown-unit' || err.reason === 'invalid-price') {
      router.push('/materials');
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
