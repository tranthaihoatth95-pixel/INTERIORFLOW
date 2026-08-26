'use client';

/**
 * lib/auth/xac-thuc-lai.ts — XÁC THỰC LẠI để MỞ KHOÁ (Lane K, 22/08).
 *
 * KHÁC ĐĂNG NHẬP ở chỗ nào — đây là toàn bộ lý do file này tồn tại:
 *   · Đăng nhập  = "anh là ai?"  ⇒ cần email + mật khẩu, xong thì ĐI ĐÂU ĐÓ (Trang chủ).
 *   · Xác thực lại = "vẫn là anh chứ?" ⇒ ĐÃ BIẾT là ai (phiên chưa hề mất), chỉ cần một bằng
 *     chứng nhanh, xong thì Ở NGUYÊN CHỖ CŨ.
 * Vì vậy mặt khoá KHÔNG có ô email: điền lại email tài khoản đang mở là bắt người dùng khai
 * thứ máy đã biết, và làm mặt khoá đọc ra như một màn đăng nhập thứ hai — đúng thứ bị cấm.
 *
 * KHÔNG dựng đường auth mới: dùng lại `POST /api/auth/login` đang chạy (vùng `app/api/**`
 * KHÔNG bị đụng một dòng nào), chỉ khác là email lấy từ phiên hiện tại chứ không từ bàn phím.
 *
 * ⚠️ SINH TRẮC/PASSKEY — NÓI THẲNG: **IF chưa có**. Đo tại nguồn 22/08: `app/api/auth/` chỉ có
 * apple · google · login · me · microsoft · providers · register — KHÔNG có route đăng ký/xác
 * minh WebAuthn, và không gói WebAuthn nào trong dự án. Xác thực nền tảng cần MÁY CHỦ giữ
 * credential và kiểm challenge; thiếu nửa đó thì `navigator.credentials.get()` chỉ là một hộp
 * thoại đẹp không chứng minh được gì. `sinhTracKhaDung()` dưới đây vì thế luôn trả `false` kèm
 * lý do — CẤM đổi thành `true` cho tới khi có route thật; giả lập sinh trắc là nói dối về bảo
 * mật, tệ hơn hẳn một nút giả bình thường.
 */

/** Vì sao chưa có sinh trắc — trả về để UI/báo cáo dẫn nguyên văn, không ai phải đoán. */
export const LY_DO_CHUA_CO_SINH_TRAC =
  'Chưa có: máy chủ IF chưa có đường đăng ký/kiểm chứng WebAuthn (app/api/auth/ không có route nào), ' +
  'nên xác thực nền tảng sẽ không chứng minh được gì.';

/** Có dùng được passkey/sinh trắc để mở khoá không. Luôn `false` cho tới khi có route thật. */
export function sinhTracKhaDung(): { duoc: false; lyDo: string } {
  return { duoc: false, lyDo: LY_DO_CHUA_CO_SINH_TRAC };
}

export type KetQuaXacThuc = { ok: true } | { ok: false; loi: string };

/**
 * Xác thực lại bằng mật khẩu của CHÍNH tài khoản đang mở.
 * `email` do nơi gọi lấy từ phiên (`useFlowStore().user.email`) — không bao giờ do người dùng gõ.
 *
 * Không `setUser`, không điều hướng, không đụng localStorage phiên: phiên vốn chưa mất, gọi này
 * chỉ để lấy một câu trả lời đúng/sai. Việc mở lớp che là của `useLockScreen.unlock()`.
 */
export async function xacThucLaiBangMatKhau(
  email: string,
  matKhau: string,
  en = false,
): Promise<KetQuaXacThuc> {
  if (!email) {
    return { ok: false, loi: en ? 'No account is open.' : 'Không có tài khoản nào đang mở.' };
  }
  if (!matKhau) {
    return { ok: false, loi: en ? 'Enter your password.' : 'Nhập mật khẩu.' };
  }
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: matKhau, remember: true }),
    });
    if (res.ok) return { ok: true };
    // Thân phản hồi có thể là trang lỗi HTML (500/404) — đọc an toàn, đúng bài học G-AUTH-01
    // ở `components/entry/LoginForm.tsx` (đừng để người dùng nhận nguyên văn lỗi JSON.parse).
    const raw = await res.text();
    let loi = '';
    try {
      loi = (JSON.parse(raw) as { error?: string }).error ?? '';
    } catch {
      loi = en ? `Server error (HTTP ${res.status}).` : `Máy chủ báo lỗi (HTTP ${res.status}).`;
    }
    return { ok: false, loi: loi || (en ? 'Wrong password.' : 'Mật khẩu chưa đúng.') };
  } catch {
    return {
      ok: false,
      loi: en ? 'Cannot reach the server.' : 'Không kết nối được máy chủ.',
    };
  }
}
