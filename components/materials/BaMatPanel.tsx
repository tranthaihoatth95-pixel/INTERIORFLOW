'use client';

/**
 * components/materials/BaMatPanel.tsx — [marker: vatLieuBaMat] MỘT VẬT, BA MẶT.
 *
 * Chỗ SỜ ĐƯỢC vào câu định vị của sản phẩm (`IF-KIEN-TRUC.md` §6): chọn một vật liệu là thấy
 * ngay **cùng một `matId` ra cái gì ở từng chặng** — 2D ra ký hiệu nào · 3D ra chất liệu render
 * nào · Trình bày ra giá nào. Không phải ba bảng nối lại; là một vật nhìn từ ba phía.
 *
 * ⛔ Mặt Trình bày **ĐỌC** bản ghi thương mại, không chép giá sang bên thị giác. Panel này không
 * có đường ghi nào — chỉ hiển thị và mở đúng cửa sửa đã có sẵn.
 * ⛔ Mặt nào KHÔNG có việc làm được ngay tại đây thì **không mọc ra nút** (luật §9 cấm nút giả
 * bấm không ra gì) — thay vào đó nói thẳng phải làm ở đâu.
 *
 * Khuôn hộp thoại chép nguyên `MaterialPbrEditor.tsx` (nền mờ + tấm `--panel` + nút ✕) — một
 * ngôn ngữ giao diện, không chế khuôn thứ hai.
 */
import { useEffect, useRef } from 'react';
import { Ruler, Orbit, Tag, X, Sparkles } from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { BaMat, MatKhoa, MatMotMat } from '@/lib/materials/ba-mat';

const KY_HIEU: Record<MatKhoa, typeof Ruler> = { ve2d: Ruler, dung3d: Orbit, trinhBay: Tag };

/** Chặng nào nhìn vào mặt này — chữ nối mặt với nơi người dùng thật sự làm việc. */
const CHANG: Record<MatKhoa, { vi: string; en: string }> = {
  ve2d: { vi: 'Đứng ở 2D Kỹ thuật', en: 'Seen from 2D Technical' },
  dung3d: { vi: 'Đứng ở 3D Thiết kế', en: 'Seen from 3D Design' },
  trinhBay: { vi: 'Đứng ở Trình bày', en: 'Seen from Presenting' },
};

function mauCua(m: MatMotMat): string {
  if (m.trangThai === 'du') return 'var(--success)';
  return m.trangThai === 'chuaDu' ? 'var(--warning)' : 'var(--t3)';
}
function dauCua(m: MatMotMat): string {
  if (m.trangThai === 'du') return m.suyDoan ? '≈' : '✓';
  return m.trangThai === 'chuaDu' ? '!' : '–';
}

export function BaMatPanel({
  baMat, ten, onClose, onMoChatLieu, onMoSuaThuongMai,
}: {
  baMat: BaMat;
  ten: string;
  onClose: () => void;
  /** mở cửa sổ chất liệu render — chỉ truyền khi món CÓ mã (matId = mã vật liệu). */
  onMoChatLieu?: () => void;
  /** mở cửa sửa bản ghi thương mại (giá, đơn vị, mã). */
  onMoSuaThuongMai?: () => void;
}) {
  const tr = useT();
  const tamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* Mở ra thì con trỏ bàn phím phải NHẢY VÀO trong, đóng lại thì TRẢ VỀ chỗ cũ. Thiếu bước này
     thì người dùng bàn phím/trình đọc màn hình bấm mở xong vẫn đứng ngoài, Tab tiếp là đi lạc ra
     sau tấm — đúng loại lỗi "có trong mã nhưng không tới được người dùng". */
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null;
    tamRef.current?.focus();
    return () => truoc?.focus?.();
  }, []);

  const viecCua = (m: MatMotMat): { chu: string; chay: () => void } | null => {
    if (m.trangThai === 'du' && !m.suyDoan) return null;
    if (m.khoa === 'dung3d' && onMoChatLieu) {
      return { chu: tr('Mở cửa sổ chất liệu render', 'Open render material window'), chay: onMoChatLieu };
    }
    if (m.khoa === 'trinhBay' && onMoSuaThuongMai) {
      return { chu: tr('Sửa bản ghi thương mại', 'Edit the commercial record'), chay: onMoSuaThuongMai };
    }
    return null; // 2D gán ở thư viện mẫu — không có cửa nào ở màn này, nên KHÔNG mọc nút giả
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--nen-mo-overlay)' }}
    >
      {/* `role="dialog"` đặt ở TẤM, không đặt ở nền mờ: nền mờ là lớp phủ, không phải hộp thoại —
          gắn nhầm ra ngoài thì trình đọc màn hình coi cả màn là nội dung hộp thoại. */}
      <div
        ref={tamRef}
        tabIndex={-1}
        role="dialog"
        aria-modal
        aria-label={tr('Ba mặt của vật liệu', 'The three faces of this material')}
        onClick={(e) => e.stopPropagation()}
        className="focus-visible:outline-none"
        /* `maxWidth` chứ không chỉ `width`: cửa sổ hẹp (chia đôi màn, tablet dọc) thì tấm 460 cứng
           sẽ tràn ra ngoài mép và nút ✕ đi mất — người dùng kẹt trong hộp thoại. */
        style={{ width: 460, maxWidth: 'calc(100vw - 32px)', maxHeight: '86vh', overflowY: 'auto', background: 'var(--panel)', borderRadius: 'var(--r-3)', border: '1px solid var(--border)', padding: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>{tr('Một vật, ba mặt', 'One item, three faces')}</span>
          <button
            type="button" onClick={onClose} aria-label={tr('Đóng', 'Close')}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
            style={{ marginLeft: 'auto', width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, borderRadius: 'var(--r-1)', background: 'transparent', color: 'var(--t3)', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 4, lineHeight: 1.5 }}>
          {ten}
          {baMat.matId && <> · <span style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{baMat.matId}</span></>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14, lineHeight: 1.5 }}>
          {baMat.matId
            ? tr(
              `Đủ ${baMat.soDu} trên 3 mặt. Cùng một mã này, ba chặng đọc ba phía của nó.`,
              `${baMat.soDu} of 3 faces complete. Three stages read three sides of this one code.`,
            )
            : tr(
              'Món chưa có mã, nên chưa chặng nào tra được. Mã là khoá nối cả ba mặt.',
              'No code yet, so no stage can look it up. The code is what links all three faces.',
            )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {baMat.mats.map((m) => {
            const Icon = KY_HIEU[m.khoa];
            const mau = mauCua(m);
            const viec = viecCua(m);
            return (
              <div
                key={m.khoa}
                style={{
                  padding: 12, borderRadius: 'var(--r-2)', background: 'var(--card)',
                  border: `1px ${m.trangThai === 'chuaCo' ? 'dashed' : 'solid'} var(--border)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Icon size={13} style={{ color: mau }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>{tr(m.nhanDay.vi, m.nhanDay.en)}</span>
                  <span aria-hidden style={{ color: mau, fontSize: 12, fontWeight: 700 }}>{dauCua(m)}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--t3)' }}>{tr(CHANG[m.khoa].vi, CHANG[m.khoa].en)}</span>
                </div>

                {m.tomTat && (
                  <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.5, fontVariantNumeric: 'tabular-nums' }}>
                    {tr(m.tomTat.vi, m.tomTat.en)}
                  </div>
                )}

                {m.suyDoan && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5 }}>
                    <Sparkles size={12} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    {tr('Máy suy đoán từ tên/danh mục — chưa ai xác nhận.', 'Machine-inferred from name/category — nobody has confirmed it.')}
                  </div>
                )}

                {m.thieu && (
                  <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5, marginTop: m.tomTat ? 6 : 0 }}>
                    {tr(m.thieu.vi, m.thieu.en)}
                    {m.loiRa && (
                      <span style={{ color: 'var(--t3)' }}> — {tr(m.loiRa.vi, m.loiRa.en)}</span>
                    )}
                  </div>
                )}

                {viec && (
                  <button
                    type="button" onClick={viec.chay}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    style={{
                      marginTop: 8, height: 'var(--tap)', padding: '0 12px', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-2)', background: 'var(--field)', color: 'var(--t2)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {viec.chu}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.55 }}>
          {tr(
            'Giá đọc thẳng từ bản ghi thương mại của kho chung, không chép sang chất liệu render — giá đổi hằng ngày, vân vật liệu thì không. Giá chốt của từng dự án là chuyện riêng của dự án đó.',
            'The price is read straight from the shared-catalogue commercial record; it is never copied into the render material — prices change daily, textures do not. Per-project agreed prices live with the project.',
          )}
        </div>
      </div>
    </div>
  );
}
