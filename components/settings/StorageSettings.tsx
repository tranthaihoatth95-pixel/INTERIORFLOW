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
import { chooseRootFolder, rootFolderName, rootFolderSupported, testStorageConnection, type ConnectionTestResult } from '@/lib/root-folder';
import { useT } from '@/lib/i18n';

/** Sự cố 31/07: chọn thư mục xong, "Lưu Brand Kit" báo đã lưu nhưng KHÔNG có tệp nào ghi xuống đĩa
 * — quyền `readwrite` đã cấp lúc chọn thư mục RESET về 'prompt' sau khi tải lại trang/điều hướng
 * (đúng đặc tả File System Access API), và không ai báo cho người dùng biết. Nút "Kiểm tra kết nối
 * thư mục" dưới đây là NÚT DUY NHẤT chứng minh tầng đĩa còn sống — click này CHÍNH LÀ gesture cần
 * để `testStorageConnection()` xin lại quyền thành công, đồng thời là lối "cấp lại quyền" chung. */
function connectionResultText(res: ConnectionTestResult, tr: (vi: string, en: string) => string): string {
  if (res.ok) return tr('Ghi/đọc thử thành công — tầng đĩa hoạt động đúng.', 'Write/read test succeeded — disk layer works.');
  switch (res.reason) {
    case 'no-root':
      return tr('Chưa chọn thư mục.', 'No folder chosen yet.');
    case 'no-permission':
      return tr(
        'Trình duyệt từ chối quyền ghi (quyền đã mất sau khi tải lại trang) — bấm "Đổi thư mục" và chọn lại đúng thư mục này để cấp lại quyền.',
        'Browser denied write permission (lost after reload) — click "Change" and re-pick this same folder to re-grant it.',
      );
    case 'write-failed':
      return tr('Ghi tệp thử thất bại — kiểm tra thư mục còn tồn tại/còn dung lượng.', 'Test write failed — check the folder still exists and has space.');
    case 'read-mismatch':
      return tr('Ghi được nhưng đọc lại SAI nội dung — bất thường, báo lại cho đội kỹ thuật.', 'Wrote OK but read-back content mismatched — unusual, please report this.');
  }
}

export function StorageSettings() {
  const tr = useT();
  const [supported, setSupported] = useState(true);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setSupported(rootFolderSupported());
    rootFolderName().then(setFolderName);
  }, []);

  const onChoose = async () => {
    setBusy(true);
    setTestResult(null);
    const ok = await chooseRootFolder();
    if (ok) setFolderName(await rootFolderName());
    setBusy(false);
  };

  const onTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testStorageConnection();
    setTestResult({ ok: res.ok, text: connectionResultText(res, tr) });
    setTesting(false);
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

      {supported && folderName && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={onTestConnection}
            disabled={testing}
            className="rounded-[9px] border border-[var(--border)] px-2.5 py-1.5 text-[12px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)] disabled:opacity-50"
          >
            {testing ? tr('Đang kiểm tra…', 'Testing…') : tr('Kiểm tra kết nối thư mục', 'Test folder connection')}
          </button>
          {testResult && (
            <p
              role={testResult.ok ? undefined : 'alert'}
              className="mt-2 max-w-md rounded-[8px] border px-2.5 py-2 text-[12px] leading-relaxed"
              style={{
                borderColor: testResult.ok ? 'var(--border)' : '#d33',
                background: testResult.ok ? 'var(--field)' : 'color-mix(in srgb, #d33 15%, var(--field))',
                color: testResult.ok ? 'var(--accent)' : '#e0665a',
              }}
            >
              {testResult.ok ? '✓ ' : '⚠ '}
              {testResult.text}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
