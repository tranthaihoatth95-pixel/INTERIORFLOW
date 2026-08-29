'use client';

/**
 * app/thu-the-khoa/page.tsx — MẪU SỐNG của thẻ khoá (nội bộ, KHÔNG nằm trong điều hướng).
 * Cùng khuôn `app/thu-trang-thai/page.tsx` và `app/thu-be-mat/page.tsx`.
 *
 * VÌ SAO CẦN: từ 29/08 màn khoá có HAI MỨC (`lib/lockscreen.ts`) — `ranh` (máy tự khoá, mở bằng
 * một nút) và `tay` (người bấm ⌘⇧L, đòi mật khẩu). Muốn nhìn mức `ranh` bằng mắt thì phải **ngồi
 * yên 15 phút**, nên trên thực tế **không ai nhìn** — và mặt không ai nhìn là mặt hỏng mà không
 * ai biết. Trang này bật thẳng từng mức.
 *
 * VÌ SAO LÀ ROUTE THẬT chứ không phải mock HTML: mock **chép** giá trị token, mẫu sống **dùng
 * chính nguyên thể**. Đây đúng bài học `M-59` — máy sinh ra thứ NHÌN ĐƯỢC thì phải có đường
 * nhìn nó, và phải nhìn ở mức phóng to thật, không suy từ số đo.
 *
 * ⚠️ Bấm nút ở đây là khoá app THẬT (không phải bản mô phỏng). Mở lại theo đúng luật của mức
 * đang thử: mức `ranh` bấm "Mở lại" là vào; mức `tay` phải gõ mật khẩu thật.
 */

import { lockScreenNow } from '@/lib/lockscreen';
import { LockScreen, docKieuKhoa, ghiKieuKhoa, type KieuKhoa } from '@/components/studio/LockScreen';
import { DANH_NGON } from '@/lib/lockscreen-danh-ngon';

export default function ThuTheKhoa() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-14">
      {/* Trang này nằm NGOÀI vỏ app (`AppChrome`), nơi `LockScreen` thường được mount — nên phải
          tự dựng lấy, nếu không bấm nút sẽ chỉ bật cờ mà không có lớp che nào hiện ra. */}
      <LockScreen />
      <h1 className="text-[22px] font-semibold text-[var(--t1)]">Mẫu sống — thẻ khoá</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--t2)]">
        Hai mức khoá, hai hành vi khác hẳn nhau. Bấm để xem mặt thật, không phải bản mô phỏng.
      </p>

      {/* HAI HƯỚNG Hoà đưa 29/08 — chọn kiểu rồi bấm khoá để xem mặt thật. Lựa chọn nhớ lại
          qua `localStorage`, đúng trục Reach = browser-local (đây là tiện nghi thử nghiệm của
          MỘT máy, không phải cài đặt đi theo tài khoản). */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(['A', 'D'] as KieuKhoa[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => { ghiKieuKhoa(k); location.reload(); }}
            className="rounded-[var(--r-full,999px)] px-4 py-2 text-[13px] transition-colors"
            style={
              docKieuKhoa() === k
                ? { background: 'var(--accent)', color: 'var(--on-accent, #fff)' }
                : { background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--t2)' }
            }
          >
            {k === 'A' ? 'Hướng A · thẻ hai nửa bọc kính' : 'Hướng D · nền động'}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => lockScreenNow('ranh')}
          className="rounded-[14px] p-5 text-left transition-colors hover:bg-[var(--hover)]"
          style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
        >
          <div className="text-[14px] font-semibold text-[var(--t1)]">Khoá rảnh tay</div>
          <div className="mt-1.5 text-[12px] leading-snug text-[var(--t2)]">
            Máy tự khoá sau 15 phút không thao tác. <b>Không hỏi mật khẩu</b> — một nút là vào.
            Lật thẻ ra mặt sau để đọc một câu về thiết kế.
          </div>
        </button>

        <button
          type="button"
          onClick={() => lockScreenNow('tay')}
          className="rounded-[14px] p-5 text-left transition-colors hover:bg-[var(--hover)]"
          style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
        >
          <div className="text-[14px] font-semibold text-[var(--t1)]">Khoá chủ động</div>
          <div className="mt-1.5 text-[12px] leading-snug text-[var(--t2)]">
            Người dùng tự bấm ⌘⇧L hoặc gọi lệnh. <b>Đòi mật khẩu</b> — đúng điều vừa xin khi rời
            máy cho người khác dùng.
          </div>
        </button>
      </div>

      <h2 className="mt-12 text-[15px] font-semibold text-[var(--t1)]">
        Bảng câu — {DANH_NGON.length} câu, mỗi câu khai nguồn
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--t2)]">
        Cột <b>nguồn</b> là thứ chặn việc bịa: máy không kiểm được câu có thật không, nhưng bắt
        được người thêm phải khai xuất xứ. Cổng ở <code className="text-[11.5px]">lib/lockscreen-danh-ngon.test.ts</code>.
      </p>

      <ul className="mt-5 flex flex-col gap-4">
        {DANH_NGON.map((c) => (
          <li
            key={c.en}
            className="rounded-[12px] p-4"
            style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
          >
            <p className="m-0 text-[14px] leading-snug text-[var(--t1)]">“{c.vi}”</p>
            <p className="m-0 mt-1.5 text-[12px] text-[var(--t3)]">
              <b className="text-[var(--t2)]">{c.ai}</b> · {c.vai}
            </p>
            <p className="m-0 mt-1 text-[11px] leading-snug text-[var(--t3)]">{c.nguon}</p>
            {c.luuY && <p className="m-0 mt-1 text-[11px] leading-snug text-[var(--t3)] opacity-75">⚠ {c.luuY}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
