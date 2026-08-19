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
 */

import { useEffect, useState } from 'react';
import { Loader2, FolderOpen } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface WhereUsedRow {
  id: string;
  projectId: string;
  usage: string;
  project: { id: string; name: string };
}

type LoadState = 'loading' | 'ready' | 'error';

async function fetchWhereUsed(assetId: string): Promise<WhereUsedRow[]> {
  const r = await fetch(`/api/project-asset-usage?assetId=${encodeURIComponent(assetId)}`);
  if (!r.ok) throw new Error('where-used-load-failed');
  const j = (await r.json()) as { usages?: WhereUsedRow[] };
  return Array.isArray(j.usages) ? j.usages : [];
}

/**
 * `assetId` là `LibraryAsset.id` THẬT (không phải `SheetItem.id` — bên gọi phải bóc tiền tố
 * `db:` trước, xem `LIBRARY_INSTANTIATE`/`db-items.ts:87`). `refreshKey` đổi thì fetch lại
 * (dùng sau khi vừa POST một usage mới — không tự poll).
 */
export function AssetWhereUsed({ assetId, refreshKey }: { assetId: string; refreshKey?: number }) {
  const tr = useT();
  const [state, setState] = useState<LoadState>('loading');
  const [rows, setRows] = useState<WhereUsedRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
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

  if (state === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', color: 'var(--t3)', fontSize: 'var(--fs-2xs)' }}>
        <Loader2 size={12} strokeWidth={2} className="animate-spin" aria-hidden />
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
          <FolderOpen size={12} strokeWidth={1.8} aria-hidden style={{ flexShrink: 0, color: 'var(--t3)' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.project?.name ?? row.projectId}>
            {row.project?.name ?? row.projectId}
          </span>
        </li>
      ))}
    </ul>
  );
}
