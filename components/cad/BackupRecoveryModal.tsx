'use client';

/**
 * components/cad/BackupRecoveryModal.tsx — B3 (30/07): lối vào UI cho phục hồi từ backup tự động
 * (`lib/cad/auto-backup.ts`). Trước đây KHÔNG có cách nào trong app để XEM danh sách backup đã
 * ghi — người dùng phải tự mò Finder/File Explorer đoán tên file. Hiện theo THANG (Hoà chốt
 * 30/07): "10 phút trước · 1 giờ trước · hôm qua 15:20 · thứ Hai · tuần trước" — không phải danh
 * sách phẳng hàng chục dòng thời gian giống hệt nhau.
 */

import { useEffect, useState } from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { listBackupsForUi, recoverBackup, type BackupListItem } from '@/lib/cad/auto-backup';
import { formatBackupRelativeTime } from '@/lib/cad/backup-diff';

export default function BackupRecoveryModal({ projectId, projectName, onClose }: { projectId: string; projectName: string; onClose: () => void }) {
  const [items, setItems] = useState<BackupListItem[] | null>(null);
  const [recoveringName, setRecoveringName] = useState<string | null>(null);
  const nowMs = useState(() => Date.now())[0];

  useEffect(() => {
    let cancelled = false;
    void listBackupsForUi(projectId).then((list) => {
      if (!cancelled) setItems(list);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const onPick = async (item: BackupListItem) => {
    setRecoveringName(item.name);
    const result = await recoverBackup(projectId, item.name);
    setRecoveringName(null);
    if (!result || !result.sheets.length) {
      window.dispatchEvent(
        new CustomEvent('cad:backup-restore-request', {
          detail: { sheets: [], projectName, degraded: true, recoveredAsOf: null },
        }),
      );
      onClose();
      return;
    }
    window.dispatchEvent(
      new CustomEvent('cad:backup-restore-request', {
        detail: { sheets: result.sheets, projectName, degraded: result.degraded, recoveredAsOf: result.recoveredAsOf },
      }),
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxHeight: '70vh',
          overflowY: 'auto',
          background: 'var(--panel, #1c1c1f)',
          borderRadius: 14,
          border: '1px solid var(--border, #333)',
          padding: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--t1, #eee)' }}>
            <Clock size={16} /> Khôi phục từ backup
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--t3, #999)' }}>
            <X size={16} />
          </button>
        </div>

        {items === null && <div style={{ fontSize: 12.5, color: 'var(--t3, #999)' }}>Đang đọc thư mục backup…</div>}
        {items !== null && items.length === 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--t3, #999)' }}>Chưa có bản backup nào cho dự án này (hoặc chưa bật backup tự động).</div>
        )}
        {items !== null && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 11, color: 'var(--t4, #777)', marginBottom: 6 }}>
              Phục hồi TẠO DỰ ÁN MỚI — dự án đang mở không bị đụng vào.
            </div>
            {items.map((item) => (
              <button
                key={item.name}
                type="button"
                disabled={recoveringName !== null}
                onClick={() => void onPick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 10px',
                  borderRadius: 10,
                  border: '1px solid transparent',
                  background: 'transparent',
                  cursor: recoveringName ? 'wait' : 'pointer',
                  color: 'var(--t1, #eee)',
                  fontSize: 12.5,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--field, #2a2a2e)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>{formatBackupRelativeTime(item.timestampMs, nowMs)}</span>
                <span style={{ fontSize: 10.5, color: 'var(--t4, #777)' }}>
                  {recoveringName === item.name ? 'Đang ráp…' : item.kind === 'full' ? 'mốc đầy đủ' : 'chênh lệch'}
                </span>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 14, padding: '8px 10px', borderRadius: 10, background: 'rgba(217,163,74,0.1)', border: '1px solid var(--warning, #d9a34a)' }}>
          <AlertTriangle size={13} style={{ marginTop: 1, flexShrink: 0, color: 'var(--warning, #d9a34a)' }} />
          <span style={{ fontSize: 10.5, color: 'var(--warning, #d9a34a)' }}>
            Nếu 1 phần chuỗi backup bị hỏng/mất, app tự lùi về mốc gần nhất ráp được trước đó — sẽ báo rõ khi xảy ra, không âm thầm trả bản sai.
          </span>
        </div>
      </div>
    </div>
  );
}
