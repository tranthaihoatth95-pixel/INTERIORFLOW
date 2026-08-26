'use client';

/**
 * components/library/AssetWhereUsed.tsx — "where-used" cho một `LibraryAsset` (phiếu Reference/
 * Library UI, 20/08): danh sách các Project đang REUSE món này (Golden Journey Hoà chốt — asset
 * X dùng ở Project A → reuse Project B → where-used thấy cả A/B).
 *
 * Gọi `GET /api/project-asset-usage?assetId=X` — route do worker khác dựng song song
 * (`app/api/project-asset-usage/**`), KHÔNG đụng file đó ở đây, chỉ `fetch()` theo đúng contract
 * đã thống nhất. Pattern loading/error copy từ `components/dna/DesignDnaCardPanel.tsx`
 * (`fetchDnaCards` — try/catch quanh fetch, không throw ra UI).
 *
 * MVP: chỉ liệt kê TÊN project, không sửa/xoá tại đây (xoá 1 usage là việc của màn khác —
 * DELETE /api/project-asset-usage/[id] đã có trong contract nhưng chưa có nơi gọi ở UI này).
 *
 * 20/08 (PREFETCH-ATTACH) — MỘT REQUEST, HAI NƠI DÙNG. Nút "Dùng cho dự án này" cần đúng dữ
 * liệu này để biết trạng thái ĐÃ GẮN ngay khi mở panel. Cách chọn: NÂNG chỗ fetch lên hook
 * `useAssetWhereUsed` (cha gọi một lần, truyền kết quả xuống), thay vì callback báo-ngược.
 * Lý do chọn lift-state thay vì callback:
 *  · callback đồng bộ state hai chiều ⇒ có nhịp cha và con lệch nhau (con đã 'ready', cha còn
 *    'loading') — đúng loại bug khó thấy mà phiếu này sinh ra để diệt;
 *  · gọi hook ở CẢ hai nơi thì thành HAI request cho cùng một dữ liệu, phạm ràng buộc REUSE;
 *  · lift lên cha giữ được đúng một nguồn sự thật, component này thành thuần trình bày.
 * Component KHÔNG còn tự fetch — bên gọi bắt buộc truyền `state` + `rows`.
 */

import { useEffect, useState } from 'react';
import { Loader2, FolderOpen } from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { WhereUsedRow } from './da-gan-du-an';

export type LoadState = 'loading' | 'ready' | 'error';

async function fetchWhereUsed(assetId: string): Promise<WhereUsedRow[]> {
  const r = await fetch(`/api/project-asset-usage?assetId=${encodeURIComponent(assetId)}`);
  if (!r.ok) throw new Error('where-used-load-failed');
  const j = (await r.json()) as { usages?: WhereUsedRow[] };
  return Array.isArray(j.usages) ? j.usages : [];
}

/**
 * Hook DUY NHẤT gọi mạng cho where-used. Gọi ở component CHA (LibrarySheet), kết quả dùng cho
 * cả danh sách where-used lẫn trạng thái nút "Dùng cho dự án này" — một request, hai nơi dùng.
 *
 * `assetId` là `LibraryAsset.id` THẬT (không phải `SheetItem.id` — bên gọi phải bóc tiền tố
 * `db:` trước, xem `LIBRARY_INSTANTIATE`/`db-items.ts:87`); truyền `null` khi món đang xem
 * không phải asset DB (built-in/mock) ⇒ không gọi mạng, trả 'ready' + rỗng.
 * `refreshKey` đổi thì fetch lại (dùng sau khi vừa POST một usage mới — không tự poll).
 */
export function useAssetWhereUsed(
  assetId: string | null,
  refreshKey?: number,
): { state: LoadState; rows: WhereUsedRow[] } {
  const [state, setState] = useState<LoadState>('loading');
  const [rows, setRows] = useState<WhereUsedRow[]>([]);

  useEffect(() => {
    if (!assetId) {
      setRows([]);
      setState('ready');
      return;
    }
    let cancelled = false;
    setState('loading');
    setRows([]); // đổi món mà giữ rows cũ = nút nói về ASSET TRƯỚC trong một nhịp.
    fetchWhereUsed(assetId)
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [assetId, refreshKey]);

  return { state, rows };
}

/** Thuần trình bày — dữ liệu do cha tải qua `useAssetWhereUsed`, ở đây KHÔNG gọi mạng. */
export function AssetWhereUsed({ state, rows }: { state: LoadState; rows: WhereUsedRow[] }) {
  const tr = useT();

  if (state === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', color: 'var(--t3)', fontSize: 'var(--fs-2xs)' }}>
        <Loader2 size={14} strokeWidth={2} className="animate-spin" aria-hidden />
        {tr('Đang tra nơi dùng…', 'Checking where this is used…')}
      </div>
    );
  }

  if (state === 'error') {
    // Lỗi mạng/route chưa sẵn — KHÔNG hiện lỗi to giữa panel thông số, chỉ một dòng nhạt.
    return (
      <div style={{ padding: '2px 0', color: 'var(--t3)', fontSize: 'var(--fs-2xs)' }}>
        {tr('Chưa tra được nơi dùng.', "Couldn't check where this is used.")}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div style={{ padding: '2px 0', color: 'var(--t3)', fontSize: 'var(--fs-2xs)' }}>
        {tr('Chưa dự án nào dùng món này.', 'No project uses this yet.')}
      </div>
    );
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
      {rows.map((row) => (
        <li key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-2xs)', color: 'var(--t2)' }}>
          <FolderOpen size={14} strokeWidth={1.8} aria-hidden style={{ flexShrink: 0, color: 'var(--t3)' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.project?.name ?? row.projectId}>
            {row.project?.name ?? row.projectId}
          </span>
        </li>
      ))}
    </ul>
  );
}
