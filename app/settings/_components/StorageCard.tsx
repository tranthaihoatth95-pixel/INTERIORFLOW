'use client';

import { useEffect, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { chooseRootFolder, rootFolderName, rootFolderSupported, testStorageConnection, type ConnectionTestResult } from '@/lib/root-folder';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

function connectionResultText(res: ConnectionTestResult, tr: (vi: string, en: string) => string): string {
  if (res.ok) return tr('Ghi/đọc thử thành công.', 'Write/read test succeeded.');
  switch (res.reason) {
    case 'no-root':
      return tr('Chưa chọn thư mục.', 'No folder chosen yet.');
    case 'no-permission':
      return tr('Trình duyệt từ chối quyền ghi — bấm "Đổi…" và chọn lại đúng thư mục để cấp lại quyền.', 'Browser denied write permission — click "Change…" and re-pick this folder.');
    case 'write-failed':
      return tr('Ghi tệp thử thất bại.', 'Test write failed.');
    case 'read-mismatch':
      return tr('Ghi được nhưng đọc lại sai — báo đội kỹ thuật.', 'Wrote OK but read-back mismatched.');
  }
}

/**
 * Nơi lưu file + Ngôn ngữ/switch — docs/mocks/mock-settings-polished.html `.pathbox`/`.seg`/`.sw`.
 * Nơi lưu = THẬT (lib/root-folder.ts, File System Access API có sẵn, không viết lại). Ngôn ngữ =
 * THẬT (useFlowStore.lang/setLang). Giữ thêm nút "Kiểm tra kết nối" (mock không vẽ) vì đây là
 * chẩn đoán cho lỗi quyền ghi ĐÃ BIẾT trong StorageSettings.tsx cũ — xoá sẽ mất công cụ thật.
 */
export function StorageCard({
  reducedMotion,
  autoBackup,
  onToggleReducedMotion,
  onToggleAutoBackup,
}: {
  reducedMotion: boolean;
  autoBackup: boolean;
  onToggleReducedMotion: () => void;
  onToggleAutoBackup: () => void;
}) {
  const tr = useT();
  const lang = useFlowStore((s) => s.lang);
  const setLang = useFlowStore((s) => s.setLang);

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
    <div className="card">
      <h3><FolderOpen size={15} /> {tr('Nơi lưu file', 'File location')}</h3>
      <div className="hint">{tr('IF đọc/ghi thẳng thư mục thật — mở Finder vẫn hiểu', 'IF reads/writes a real folder — open Finder and it still makes sense')}</div>

      {!supported ? (
        <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
          {tr('Trình duyệt chưa hỗ trợ chọn thư mục (cần Chrome/Edge hoặc bản Electron).', 'Browser does not support folder picking yet (needs Chrome/Edge or the Electron build).')}
        </p>
      ) : (
        <div className="pathbox">
          <span className="fi" />
          <span className="p">
            <span className="pp">{folderName ?? tr('Chưa chọn thư mục', 'No folder chosen')}</span>
            {folderName && (
              <span className="ps"><span className="dot" /> {tr('Đang đồng bộ tốt', 'Syncing fine')}</span>
            )}
          </span>
          <button type="button" className="ghost" onClick={onChoose} disabled={busy}>
            {folderName ? tr('Đổi…', 'Change…') : tr('Chọn…', 'Choose…')}
          </button>
        </div>
      )}

      <div className="warn">{tr('Đổi nơi lưu sẽ di chuyển toàn bộ dự án — IF tự chuyển và kiểm đủ file trước khi xoá chỗ cũ.', 'Changing location moves every project — IF copies and verifies before removing the old one.')}</div>

      {supported && folderName && (
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={onTestConnection} disabled={testing} style={{ fontSize: 11, fontWeight: 500, textDecoration: 'underline', color: 'var(--accent)', background: 'none', border: 0, cursor: 'pointer' }}>
            {testing ? tr('Đang kiểm tra…', 'Testing…') : tr('Kiểm tra kết nối thư mục', 'Test folder connection')}
          </button>
          {testResult && (
            <p style={{ marginTop: 6, fontSize: 11, lineHeight: 1.6, color: testResult.ok ? 'var(--success)' : 'var(--danger)' }}>
              {testResult.text}
            </p>
          )}
        </div>
      )}

      <div style={{ height: 14 }} />

      <div className="noterow">
        <span className="k"><b>{tr('Ngôn ngữ', 'Language')}</b><span>{tr('chữ trong app', 'app text')}</span></span>
        <span className="seg">
          {(['vi', 'en'] as const).map((l) => (
            <span key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{l === 'vi' ? 'Tiếng Việt' : 'English'}</span>
          ))}
        </span>
      </div>
      <div className="noterow">
        <span className="k"><b>{tr('Giảm chuyển động', 'Reduce motion')}</b><span>{tr('tắt hiệu ứng cho máy yếu', 'turn off effects on weaker machines')}</span></span>
        <button type="button" className={reducedMotion ? 'sw on' : 'sw'} role="switch" aria-checked={reducedMotion} onClick={onToggleReducedMotion} />
      </div>
      <div className="noterow">
        <span className="k"><b>{tr('Tự sao lưu mỗi ngày', 'Auto-backup daily')}</b><span>{tr('giữ 7 bản gần nhất', 'keeps the last 7 backups')}</span></span>
        <button type="button" className={autoBackup ? 'sw on' : 'sw'} role="switch" aria-checked={autoBackup} onClick={onToggleAutoBackup} />
      </div>
    </div>
  );
}
