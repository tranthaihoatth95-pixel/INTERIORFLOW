'use client';

import type { FmFile } from '@/lib/filemanager/types';
import { formatBytes } from '@/lib/filemanager/types';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { KIND_ICON, SOURCE_ICON } from './icons';
import { FM } from './fm-tokens';

const LIFECYCLE_LABEL: Record<FmFile['lifecycle'], string> = {
  nhap: 'Nháp',
  chinh_thuc: 'Chính thức',
  luu_tru: 'Lưu trữ',
};

interface Props {
  file: FmFile;
  view: 'grid' | 'list';
  selected: boolean;
  onSelect: (file: FmFile) => void;
}

function Thumb({ file, size }: { file: FmFile; size: number }) {
  const Icon = KIND_ICON[file.kind];
  if (file.thumbnail) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-xl"
        style={{ width: size, height: size, background: `linear-gradient(135deg, ${file.thumbnail[0]}, ${file.thumbnail[1]})` }}
      />
    );
  }
  return (
    <div className="flex shrink-0 items-center justify-center rounded-xl" style={{ width: size, height: size, background: FM.chip }}>
      <Icon size={size * 0.42} style={{ color: FM.mut }} />
    </div>
  );
}

/**
 * Mock-files-polished.html không demo lưới file đầy (chỉ demo empty-state + toast) — giữ khung
 * card cũ, chỉ RETINT theo fm-tokens cho đồng bộ màu với phần còn lại của trang. Nếu cần khớp
 * pixel lưới file thật, xin thêm mock riêng (luật mới 00-CHOT).
 */
export function FileTile({ file, view, selected, onSelect }: Props) {
  const SourceIcon = SOURCE_ICON[file.source];

  if (view === 'list') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(file)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(file)}
        className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-150"
        style={{ background: selected ? FM.accentSoft : 'transparent' }}
      >
        <Thumb file={file} size={32} />
        <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: FM.ink }}>{file.name}</span>
        <SourceIcon size={13} style={{ color: FM.mut }} />
        <UserAvatar id={file.addedById} name={file.addedByName} size={20} />
        <span className="w-[64px] shrink-0 text-right text-[11.5px] tabular-nums" style={{ color: FM.mut }}>
          {formatBytes(file.sizeBytes)}
        </span>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(file)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(file)}
      className="flex w-[152px] shrink-0 cursor-pointer flex-col gap-2 rounded-2xl p-3 transition-transform duration-150 hover:-translate-y-0.5"
      style={{
        background: FM.panel,
        border: selected ? `1.5px solid ${FM.accent}` : `1px solid ${FM.line}`,
        boxShadow: selected ? `0 0 0 3px ${FM.accentSoft}` : FM.shadowSoft,
      }}
    >
      <Thumb file={file} size={126} />
      <div className="truncate text-[12.5px] font-medium leading-tight" style={{ color: FM.ink }} title={file.name}>
        {file.name}
      </div>
      <div className="flex items-center justify-between">
        <UserAvatar id={file.addedById} name={file.addedByName} size={18} />
        <span className="text-[10.5px]" style={{ color: FM.mut }}>{formatBytes(file.sizeBytes)}</span>
      </div>
    </div>
  );
}

export { LIFECYCLE_LABEL };
