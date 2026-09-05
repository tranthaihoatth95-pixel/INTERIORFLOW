'use client';

/**
 * components/auth/DeniedState.tsx — TRẠNG THÁI TỪ CHỐI TƯỜNG MINH (luật: không "lỗi không rõ",
 * không giả thành công). Nói đúng lý do server trả (`DenialReason`), kèm vai đang có và năng lực
 * thiếu khi là `insufficient`. `role="alert"` để trình đọc màn hình đọc ngay. Song ngữ.
 * Trạng thái `stale` (đang dùng quyền đã lưu vì mất mạng) và `unknown` cũng đi qua đây để UI có
 * MỘT chỗ nói chuyện quyền hạn.
 */
import { ShieldOff, WifiOff, Loader2 } from 'lucide-react';
import { useLang, useT } from '@/lib/i18n';
import { DENIAL_LABELS, ROLE_LABELS, type Denial } from '@/lib/auth/roles';
import type { PermissionResolution } from '@/lib/auth/permission-cache';

export function DeniedState({ denial, compact }: { denial: Denial; compact?: boolean }) {
  const lang = useLang();
  const tr = useT();
  const msg = lang === 'en' ? DENIAL_LABELS[denial.reason].en : DENIAL_LABELS[denial.reason].vi;
  const roleLbl = denial.role ? (lang === 'en' ? ROLE_LABELS[denial.role].en : ROLE_LABELS[denial.role].vi) : null;
  return (
    <div
      role="alert"
      style={{
        display: 'flex', gap: 10, alignItems: 'flex-start', padding: compact ? '8px 10px' : '14px 16px', margin: compact ? 0 : 12,
        borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--t1)',
      }}
    >
      <ShieldOff size={compact ? 14 : 18} aria-hidden style={{ flex: 'none', marginTop: 2, color: 'var(--t3)' }} />
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, fontWeight: 600 }}>{msg}</p>
        {denial.reason === 'insufficient' && (
          <p style={{ margin: '3px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--t3)' }}>
            {roleLbl && tr(`Vai của bạn: ${roleLbl}.`, `Your role: ${roleLbl}.`)}{' '}
            {denial.capability && tr(`Cần năng lực: ${denial.capability}.`, `Requires: ${denial.capability}.`)}{' '}
            {tr('Hỏi chủ dự án để đổi vai.', 'Ask the project owner to change your role.')}
          </p>
        )}
        {(denial.reason === 'anonymous' || denial.reason === 'session-stale') && (
          <p style={{ margin: '3px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--t3)' }}>
            {tr('Đăng nhập lại rồi thử tiếp — thao tác chưa gửi vẫn nằm trong hàng đợi.', 'Sign in again and retry — unsent actions stay queued.')}
          </p>
        )}
      </div>
    </div>
  );
}

/** Dải mỏng cho trạng thái quyền chưa chắc: đang tải · ngoại tuyến dùng cache · chưa biết. */
export function PermissionNotice({ resolution }: { resolution: PermissionResolution }) {
  const tr = useT();
  if (resolution.kind === 'denied') return <DeniedState denial={resolution.denial} compact />;
  if (resolution.kind === 'grant' && resolution.stale) {
    return (
      <p role="status" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, padding: '6px 10px', fontSize: 11, lineHeight: 1.5, color: 'var(--t2)', background: 'color-mix(in srgb, var(--warning) 14%, transparent)', borderRadius: 10 }}>
        <WifiOff size={14} aria-hidden />
        {tr('Không liên lạc được máy chủ — đang dùng quyền đã lưu. Thao tác sẽ được gửi khi có mạng.', 'Server unreachable — using cached permissions. Actions will be sent when back online.')}
      </p>
    );
  }
  if (resolution.kind === 'unknown') {
    const loading = resolution.reason === 'loading';
    return (
      <p role="status" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, padding: '6px 10px', fontSize: 11, lineHeight: 1.5, color: 'var(--t3)' }}>
        {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <WifiOff size={14} aria-hidden />}
        {loading
          ? tr('Đang kiểm quyền…', 'Checking permissions…')
          : resolution.reason === 'cache-expired'
            ? tr('Quyền đã lưu quá hạn và máy chủ chưa trả lời — chưa thể thao tác.', 'Cached permissions expired and the server is unreachable — actions unavailable.')
            : tr('Chưa có mạng và chưa có quyền đã lưu — chưa thể thao tác.', 'Offline with no cached permissions — actions unavailable.')}
      </p>
    );
  }
  return null;
}
