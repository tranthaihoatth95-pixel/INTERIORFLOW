'use client';

import { formatBytes, type FmRootKind } from '@/lib/filemanager/types';
import { FM } from './fm-tokens';

interface Props {
  byRoot: Record<FmRootKind, number>;
  quotaBytes: number;
}

/** VẬT MẪU mock-files-polished.html `.card.stor` — ring r26/stroke8, big=bytes (không phải %),
 * 4 hàng "Dự án·Sao lưu·Thư viện·Khác" nhạt dần 1 sắc tím (làm giống hệt, không bịa thang màu mới). */
const PURPLE_SHADES = ['#6a57f5', '#a99cf8', '#c9c1f2', '#dcd7f5'];

export function StorageGauge({ byRoot, quotaBytes }: Props) {
  const rows = [
    { label: 'Dự án', bytes: byRoot.projects },
    { label: 'Sao lưu', bytes: byRoot.backups },
    { label: 'Thư viện', bytes: byRoot.library },
    { label: 'Khác', bytes: byRoot.knowledge + byRoot.system },
  ];
  const used = rows.reduce((s, r) => s + r.bytes, 0);
  const pct = Math.min(100, (used / quotaBytes) * 100);
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="rounded-2xl p-4" style={{ background: FM.panel, border: `1px solid ${FM.line}`, boxShadow: FM.shadowSoft }}>
      <div className="flex items-center gap-3.5">
        <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#efedea" strokeWidth="8" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={FM.accent} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${c - dash}`} />
        </svg>
        <div>
          <div className="text-[20px] font-bold" style={{ color: FM.ink, letterSpacing: '-0.02em' }}>{formatBytes(used)}</div>
          <div className="text-[11px]" style={{ color: FM.mut }}>trên {formatBytes(quotaBytes)} · {pct.toFixed(0)}%</div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {rows.map((row, i) => {
          const rowPct = used ? (row.bytes / used) * 100 : 0;
          return (
            <div key={row.label} className="flex items-center gap-2 text-[11px]" style={{ color: '#5a5a62' }}>
              <span className="w-[70px] shrink-0">{row.label}</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: FM.chip }}>
                <span className="block h-full rounded-full" style={{ width: `${rowPct}%`, background: PURPLE_SHADES[i] }} />
              </span>
              <span className="w-[46px] shrink-0 text-right tabular-nums" style={{ color: FM.mut }}>{formatBytes(row.bytes)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
