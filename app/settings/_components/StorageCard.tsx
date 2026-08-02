'use client';

import { useEffect, useState } from 'react';
import { chooseRootFolder, rootFolderName, rootFolderSupported, testStorageConnection, type ConnectionTestResult } from '@/lib/root-folder';
import { useFlowStore } from '@/lib/store';
import { FM } from '@/components/filemanager/fm-tokens';
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

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className="relative h-[22px] w-9 shrink-0 rounded-full transition-colors duration-150"
      style={{ background: on ? FM.accent : '#d8d5d0' }}
    >
      <span
        className="absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-[left] duration-150"
        style={{ left: on ? 16 : 2, boxShadow: '0 1px 3px rgba(0,0,0,.25)' }}
      />
    </button>
  );
}

/**
 * VẬT MẪU mock-settings-polished.html card "Nơi lưu file" + khối Ngôn ngữ/switch bên dưới cùng
 * card (mock gộp 1 card). Nơi lưu = THẬT (`lib/root-folder.ts`, File System Access API đã có sẵn
 * — giữ nguyên logic cũ, chỉ đổi vỏ; xoá nút "Kiểm tra kết nối" sẽ mất chẩn đoán cho lỗi quyền ghi
 * ĐÃ BIẾT nên GIỮ LẠI dù mock không vẽ, đặt gọn dưới dòng cảnh báo). Ngôn ngữ = THẬT
 * (useFlowStore.lang/setLang). Giảm chuyển động/Tự sao lưu = state cục bộ (chưa có nguồn thật,
 * xem docs/BAO-CAO-FM.md).
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
    <div className="rounded-2xl p-[18px]" style={{ background: FM.panel, border: `1px solid ${FM.line}`, boxShadow: FM.shadowSoft }}>
      <h3 className="m-0 mb-[3px] flex items-center gap-2 text-[13px]">🗀 {tr('Nơi lưu file', 'File location')}</h3>
      <p className="mb-3.5 text-[11px]" style={{ color: FM.mut }}>
        {tr('IF đọc/ghi thẳng thư mục thật — mở Finder vẫn hiểu', 'IF reads/writes a real folder — open Finder and it still makes sense')}
      </p>

      {!supported ? (
        <p className="text-[12px] leading-relaxed" style={{ color: FM.mut }}>
          {tr('Trình duyệt chưa hỗ trợ chọn thư mục (cần Chrome/Edge hoặc bản Electron).', 'Browser does not support folder picking yet (needs Chrome/Edge or the Electron build).')}
        </p>
      ) : (
        <div className="flex items-center gap-[11px] rounded-xl px-[13px] py-[11px]" style={{ background: FM.chip }}>
          <span className="relative block h-[27px] w-8 shrink-0 rounded-[7px]" style={{ background: `linear-gradient(180deg, #8f7df7, ${FM.accent})` }}>
            <span className="absolute -top-1 left-0 h-1.5 w-3.5 rounded-t-[4px]" style={{ background: '#8f7df7' }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold">{folderName ?? tr('Chưa chọn thư mục', 'No folder chosen')}</span>
            {folderName && (
              <span className="mt-px flex items-center gap-1.5 text-[10.5px]" style={{ color: '#1f9d6b' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#1f9d6b' }} />
                {tr('Đang đồng bộ tốt', 'Syncing fine')}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={onChoose}
            disabled={busy}
            className="h-[34px] shrink-0 rounded-[11px] border px-3.5 text-[12px] font-semibold disabled:opacity-50"
            style={{ borderColor: FM.line, background: '#fff', color: '#3a3a42' }}
          >
            {folderName ? tr('Đổi…', 'Change…') : tr('Chọn…', 'Choose…')}
          </button>
        </div>
      )}

      <p className="mt-[9px] text-[10.5px] leading-relaxed" style={{ color: FM.mut }}>
        {tr('Đổi nơi lưu sẽ di chuyển toàn bộ dự án — IF tự chuyển và kiểm đủ file trước khi xoá chỗ cũ.', 'Changing location moves every project — IF copies and verifies before removing the old one.')}
      </p>

      {supported && folderName && (
        <div className="mt-2">
          <button type="button" onClick={onTestConnection} disabled={testing} className="text-[11px] font-medium underline disabled:opacity-50" style={{ color: FM.accent }}>
            {testing ? tr('Đang kiểm tra…', 'Testing…') : tr('Kiểm tra kết nối thư mục', 'Test folder connection')}
          </button>
          {testResult && (
            <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: testResult.ok ? '#1f9d6b' : '#c9552e' }}>
              {testResult.ok ? '✓ ' : '⚠ '}
              {testResult.text}
            </p>
          )}
        </div>
      )}

      <div className="h-3.5" />

      <div className="flex items-center justify-between py-2.5 text-[12.5px]" style={{ borderTop: `1px solid ${FM.line}` }}>
        <span>
          <b className="block font-semibold">{tr('Ngôn ngữ', 'Language')}</b>
          <span className="text-[10.5px]" style={{ color: FM.mut }}>{tr('chữ trong app', 'app text')}</span>
        </span>
        <span className="flex w-max gap-[3px] rounded-[11px] p-[3px]" style={{ background: FM.chip }}>
          {(['vi', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className="rounded-lg px-4 py-[7px] text-[12px]"
              style={lang === l ? { background: '#fff', color: FM.ink, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,.10)' } : { color: '#77777f' }}
            >
              {l === 'vi' ? 'Tiếng Việt' : 'English'}
            </button>
          ))}
        </span>
      </div>

      <div className="flex items-center justify-between py-2.5 text-[12.5px]" style={{ borderTop: `1px solid ${FM.line}` }}>
        <span>
          <b className="block font-semibold">{tr('Giảm chuyển động', 'Reduce motion')}</b>
          <span className="text-[10.5px]" style={{ color: FM.mut }}>{tr('tắt hiệu ứng cho máy yếu', 'turn off effects on weaker machines')}</span>
        </span>
        <Switch on={reducedMotion} onToggle={onToggleReducedMotion} label={tr('Giảm chuyển động', 'Reduce motion')} />
      </div>

      <div className="flex items-center justify-between py-2.5 text-[12.5px]" style={{ borderTop: `1px solid ${FM.line}` }}>
        <span>
          <b className="block font-semibold">{tr('Tự sao lưu mỗi ngày', 'Auto-backup daily')}</b>
          <span className="text-[10.5px]" style={{ color: FM.mut }}>{tr('giữ 7 bản gần nhất', 'keeps the last 7 backups')}</span>
        </span>
        <Switch on={autoBackup} onToggle={onToggleAutoBackup} label={tr('Tự sao lưu mỗi ngày', 'Auto-backup daily')} />
      </div>
    </div>
  );
}
