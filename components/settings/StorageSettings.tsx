'use client';

/**
 * components/settings/StorageSettings.tsx — nhóm "Lưu trữ" MỚI của /settings (B1, 31/07, ĐỢT B
 * lớp lưu trữ, mã `4.1.a`). Chọn thư mục gốc `~/InteriorFlow` một lần — hạ tầng cho B2-B5, CHƯA
 * đọc/ghi dữ liệu dự án nào (xem `lib/root-folder.ts`).
 *
 * Nhóm thứ 5 bên cạnh Tài khoản·Giao diện·AI·Trải nghiệm (7.3.30) — "lưu trữ" là khái niệm mới
 * phát sinh từ ĐỢT B, không ép vào 1 trong 4 nhóm cũ (không phải tài khoản, không phải giao diện).
 */

import { useEffect, useState } from 'react';
import { FolderOpen, FolderCheck } from 'lucide-react';
import { chooseRootFolder, rootFolderName, rootFolderSupported } from '@/lib/root-folder';
import { useT } from '@/lib/i18n';

export function StorageSettings() {
  const tr = useT();
  const [supported, setSupported] = useState(true);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(rootFolderSupported());
    rootFolderName().then(setFolderName);
  }, []);

  const onChoose = async () => {
    setBusy(true);
    const ok = await chooseRootFolder();
    if (ok) setFolderName(await rootFolderName());
    setBusy(false);
  };

  return (
    <section>
      <h2 className="text-[15px] font-semibold text-[var(--t1)]">{tr('Lưu trữ', 'Storage')}</h2>

      {!supported ? (
        <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--t3)]">
          {tr(
            'Trình duyệt này chưa hỗ trợ chọn thư mục lưu trữ (cần Chrome/Edge hoặc bản Electron của InteriorFlow).',
            'This browser does not support picking a storage folder yet (needs Chrome/Edge or the InteriorFlow Electron build).',
          )}
        </p>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 py-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            {folderName ? <FolderCheck size={16} /> : <FolderOpen size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[var(--t1)]">
              {folderName ?? tr('Chưa chọn thư mục', 'No folder chosen')}
            </p>
            <p className="truncate text-[12px] text-[var(--t3)]">
              {folderName
                ? tr('Thư mục gốc InteriorFlow', 'InteriorFlow root folder')
                : tr('Chọn thư mục để chuẩn bị cho lưu trữ cục bộ', 'Choose a folder to prepare local storage')}
            </p>
          </div>
          <button
            type="button"
            onClick={onChoose}
            disabled={busy}
            className="shrink-0 rounded-[9px] border border-[var(--border)] px-2.5 py-1.5 text-[12px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)] disabled:opacity-50"
          >
            {folderName ? tr('Đổi thư mục', 'Change') : tr('Chọn thư mục', 'Choose folder')}
          </button>
        </div>
      )}
    </section>
  );
}
