'use client';

import { formatBytes } from '@/lib/filemanager/types';
import { FM } from './fm-tokens';

interface Props {
  name: string;
  size: number;
  progress: number;
  secondsLeft: number;
}

/**
 * Toast tải lên — VẬT MẪU mock-files-polished.html `.uptoast` (ref #10, IF-hoá): thẻ kính
 * (blur 20 + saturate 160%) · icon file góc gấp + badge loại · track tím 5px · % đậm tabular.
 */
export function UploadCard({ name, size, progress, secondsLeft }: Props) {
  const ext = name.slice(name.lastIndexOf('.') + 1).toUpperCase() || 'FILE';

  return (
    <div
      className="flex min-w-[330px] items-center gap-3 rounded-2xl px-3.5 py-2.5"
      style={{
        background: 'rgba(255,255,255,.82)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(255,255,255,.9)',
        boxShadow: FM.shadow,
      }}
    >
      <div
        className="relative flex h-11 w-[38px] shrink-0 items-end justify-center rounded-lg pb-1"
        style={{ background: FM.chip, border: `1px solid ${FM.line}` }}
      >
        <span
          className="rounded-[4px] px-[5px] py-px text-[7.5px] font-extrabold tracking-wide text-white"
          style={{ background: FM.ink }}
        >
          {ext}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold" style={{ color: FM.ink }}>{name}</div>
        <div className="mt-px text-[10.5px]" style={{ color: FM.mut }}>
          {formatBytes(size)} · còn {secondsLeft} giây
        </div>
        <div className="mt-[7px] h-[5px] overflow-hidden rounded-full" style={{ background: FM.chip }}>
          <div className="block h-full rounded-full" style={{ width: `${progress}%`, background: FM.accent }} />
        </div>
      </div>

      <div className="text-[12px] font-bold tabular-nums" style={{ color: FM.accent }}>{progress.toFixed(0)}%</div>
    </div>
  );
}
