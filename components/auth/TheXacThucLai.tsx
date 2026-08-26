'use client';

/**
 * components/auth/TheXacThucLai.tsx — MẶT SAU của thẻ khoá (Lane K, 22/08).
 *
 * Đây KHÔNG phải form đăng nhập: tài khoản đã biết, hiện ra dạng CHỮ ĐỌC (tên + email), không
 * có ô email, không có tab Đăng ký, không có nút OAuth, không có "Quên mật khẩu". Đúng một ô
 * mật khẩu — bằng chứng "vẫn là anh" — rồi trở lại đúng chỗ đang làm dở.
 *
 * Vì sao không tái dùng `components/entry/LoginForm.tsx` dù nó có sẵn: LoginForm giải bài
 * "anh là ai" (2 tab, 3 nút OAuth, ô email, ghi nhớ đăng nhập). Nhồi nó vào mặt khoá chính là
 * lỗi đang phải sửa — mặt khoá đọc ra như màn đăng nhập thứ hai. Đường AUTH THẬT vẫn dùng
 * chung (`POST /api/auth/login` qua `lib/auth/xac-thuc-lai.ts`), chỉ khác cái mặt.
 *
 * Sinh trắc/passkey: CHƯA CÓ (xem `lib/auth/xac-thuc-lai.ts`) ⇒ không vẽ nút nào cho nó. Cấm
 * nút giả (§9) — bịa nút sinh trắc còn nặng hơn, vì nó hứa một mức bảo mật không tồn tại.
 */

import { useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { xacThucLaiBangMatKhau } from '@/lib/auth/xac-thuc-lai';

export function TheXacThucLai({
  ten,
  email,
  en,
  onXong,
  onHuy,
}: {
  ten: string;
  email: string;
  en: boolean;
  onXong: () => void;
  onHuy: () => void;
}) {
  const tr = useT();
  const [matKhau, setMatKhau] = useState('');
  const [hien, setHien] = useState(false);
  const [dangChay, setDangChay] = useState(false);
  const [loi, setLoi] = useState('');
  const oRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Con trỏ nhảy thẳng vào ô mật khẩu — người dùng gõ được ngay, không phải bấm tìm ô.
    const t = setTimeout(() => oRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const gui = async () => {
    if (dangChay) return;
    setDangChay(true);
    setLoi('');
    const kq = await xacThucLaiBangMatKhau(email, matKhau, en);
    setDangChay(false);
    if (kq.ok) {
      setMatKhau('');
      onXong();
    } else {
      setLoi(kq.loi);
      oRef.current?.focus();
    }
  };

  return (
    <div
      className="w-[300px] rounded-[20px] p-5"
      style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
          style={{ background: 'var(--field)', border: '1px solid var(--border)' }}
        >
          <KeyRound size={18} className="text-[var(--t2)]" />
        </div>
        <div className="min-w-0">
          {/* Tài khoản đang mở — CHỮ ĐỌC, không phải ô nhập. Máy đã biết là ai. */}
          <div className="truncate text-[13px] font-medium text-[var(--t1)]">{ten || email}</div>
          <div className="truncate text-[11px] text-[var(--t3)]">{email}</div>
        </div>
      </div>

      <label className="mt-4 block text-[11px] text-[var(--t3)]" htmlFor="if-mk-mo-khoa">
        {tr('Mật khẩu', 'Password')}
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id="if-mk-mo-khoa"
          ref={oRef}
          type={hien ? 'text' : 'password'}
          autoComplete="current-password"
          value={matKhau}
          onChange={(e) => setMatKhau(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void gui();
            }
          }}
          className="min-w-0 flex-1 rounded-[10px] px-2.5 py-2 text-[13px] text-[var(--t1)] outline-none"
          style={{ background: 'var(--field)', border: '1px solid var(--border)' }}
        />
        <button
          type="button"
          onClick={() => setHien((v) => !v)}
          aria-label={hien ? tr('Ẩn mật khẩu', 'Hide password') : tr('Hiện mật khẩu', 'Show password')}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-[var(--t3)] transition-colors hover:bg-[var(--hover)]"
          style={{ border: '1px solid var(--border)' }}
        >
          {hien ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {loi && (
        <div className="mt-2 text-[11px] leading-snug text-[var(--danger,var(--t2))]" role="alert">
          {loi}
        </div>
      )}

      <button
        type="button"
        onClick={() => void gui()}
        disabled={dangChay}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--r-full,999px)] px-4 py-2.5 text-[13px] font-medium transition-opacity disabled:opacity-[var(--mo-vo-hieu,0.5)]"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {dangChay ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
        {tr('Mở lại', 'Resume')}
      </button>

      <button
        type="button"
        onClick={onHuy}
        className="mt-2 w-full rounded-[10px] py-1.5 text-[11px] text-[var(--t3)] transition-colors hover:bg-[var(--hover)]"
      >
        {tr('Quay lại màn khoá', 'Back to lock screen')}
      </button>
    </div>
  );
}
