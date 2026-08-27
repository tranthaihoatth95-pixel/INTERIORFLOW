/**
 * app/workhub/page.tsx — CỔNG VÀO `/workhub` (`IF-WORKHUB-CONTAINMENT-001`, 27/08).
 *
 * TRƯỚC lát này: tệp này là `'use client'` và render thẳng `<WorkHubShell />` — **không kiểm cờ,
 * không kiểm phiên**. `middleware.ts` cố ý chỉ chạy trên `/api/*` nên không có lưới đỡ nào ⇒ bất
 * kỳ ai mở `/workhub` đều thấy toàn bộ vỏ, kèm lời chào đích danh một người và sáu cửa iframe ra
 * miền ngoài. Lane `IF-UXUI-RUNTIME-001` đo được điều này trên runtime thật.
 *
 * NAY: **server component**, canh hai lớp trước khi render bất cứ thứ gì —
 *   ① cờ `NEXT_PUBLIC_IF_WORKHUB` (mặc định TẮT) · ② phiên đăng nhập.
 * Ba trạng thái **tách bạch** (`lib/workhub/cong.ts`): `chua-bat` ≠ `chua-dang-nhap` ≠ `mo`.
 * Đây là chỗ dễ gộp bừa nhất, và gộp là tái phạm đúng lỗi mà lane UX vừa đo ở `/projects`:
 * *"chưa có gì"* và *"không có quyền"* in ra **cùng một màn**.
 *
 * ⚠️ Không `redirect()`, không `router.back()`. Lane UX đo được `/library` và `/colors` cho
 * **trang trắng 12 giây** vì `router.back()` bật người dùng ra khỏi app khi vào bằng deep-link.
 * Trang này **luôn vẽ một trạng thái đọc được**, kèm đường đi tiếp.
 */

import Link from 'next/link';
import WorkHubShell from '@/components/workhub/WorkHubShell';
import { getSessionUser } from '@/lib/server/auth';
import { trangThaiCong } from '@/lib/workhub/cong';

export const dynamic = 'force-dynamic';

/** Trạng thái đọc được — song ngữ, không thương hiệu, không tên riêng. */
function ManTrangThai({ tieuDe, tieuDeEn, than, thanEn, cta }: {
  tieuDe: string; tieuDeEn: string; than: string; thanEn: string;
  cta?: { href: string; vi: string; en: string };
}) {
  return (
    <main
      style={{
        minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 32,
        background: 'var(--bg)', color: 'var(--t1)',
      }}
    >
      <div style={{ maxWidth: 460, textAlign: 'center', display: 'grid', gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
          {tieuDe}
          <span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: 'var(--t3)' }}>{tieuDeEn}</span>
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--t2)' }}>
          {than}
          <span style={{ display: 'block', color: 'var(--t4)' }}>{thanEn}</span>
        </p>
        {cta && (
          <Link
            href={cta.href}
            style={{
              justifySelf: 'center', marginTop: 8, padding: '8px 18px', borderRadius: 17,
              border: '1px solid var(--border-strong)', background: 'var(--panel)',
              color: 'var(--t1)', fontSize: 13, textDecoration: 'none',
            }}
          >
            {cta.vi} · {cta.en}
          </Link>
        )}
      </div>
    </main>
  );
}

export default async function WorkHubPage() {
  const user = await getSessionUser();
  const trangThai = trangThaiCong(!!user);

  if (trangThai === 'chua-bat') {
    // KHÔNG phải lỗi, KHÔNG phải thiếu quyền — nói đúng bản chất: bề mặt này chưa được bật.
    return (
      <ManTrangThai
        tieuDe="Bề mặt này chưa được bật"
        tieuDeEn="This surface is not enabled"
        than="Không gian làm việc đang được cô lập và chưa mở ở bản này. Không phải lỗi, và cũng không phải do quyền của bạn."
        thanEn="The work space is contained and not available in this build. This is not an error, and not a permission issue."
        cta={{ href: '/', vi: 'Về trang chính', en: 'Back to home' }}
      />
    );
  }

  if (trangThai === 'chua-dang-nhap') {
    // Khác hẳn ô trên: ở đây bề mặt CÓ, chỉ là phiên chưa có. Hai câu khác nhau, cố ý.
    return (
      <ManTrangThai
        tieuDe="Cần đăng nhập"
        tieuDeEn="Sign-in required"
        than="Bề mặt này có sẵn nhưng cần một phiên đăng nhập. Đăng nhập rồi mở lại đường dẫn này."
        thanEn="This surface exists but requires a signed-in session. Sign in, then open this link again."
        cta={{ href: '/', vi: 'Đăng nhập', en: 'Sign in' }}
      />
    );
  }

  return <WorkHubShell />;
}
