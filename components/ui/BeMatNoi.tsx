'use client';

/**
 * components/ui/BeMatNoi.tsx — BỀ MẶT KÍNH NỔI, nguyên thể DÙNG CHUNG.
 *
 * ⛔ ĐÂY LÀ NƠI DUY NHẤT ĐƯỢC DỰNG LỚP KÍNH NỔI. Mọi nơi cần một mặt nổi — Vitals Peek/Engage ·
 * bảng năng lực · viên ngữ cảnh · inspector nổi · trạng thái nghe giọng · cổng Spec/Present ·
 * bề mặt so sánh tạm · phản hồi hành động — GỌI VÀO ĐÂY. Cấm tự chế kính riêng: ba agent tự chế
 * ba hiện thực là ba cách nó hỏng, và lúc đó không sửa được ở một chỗ.
 *
 * 🔴 KÍNH MANG NGHĨA, KHÔNG PHẢI TRANG TRÍ: nổi lên · theo ngữ cảnh · tạm thời · đang hoạt động.
 * Thẻ nội dung THƯỜNG TRỰC giữ đặc (`--card`), đừng bọc vào đây cho đẹp.
 *
 * ⭐ HAI THỨ NÓ LÀM MÀ MỘT `<div className="kinh-noi">` KHÔNG LÀM ĐƯỢC:
 *   ① PORTAL ra `document.body` — bài học K4: kính lồng trong chrome kính thì backdrop root
 *     chặn blur, panel xuyên thấu. Không phải tuỳ chọn.
 *   ② MỌC TỪ NGUỒN — đo hộp của vật đã gọi rồi đặt `transform-origin` theo nó, nên bề mặt
 *     NỞ RA TỪ chính vật đó và ĐÓNG THÌ THU NGƯỢC VỀ đúng chỗ đó.
 */

import { createPortal } from 'react-dom';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  DUONG_CONG,
  gocMocTuNguon,
  giamChuyenDong,
  nhipToiBac,
  nhipDong,
  thoiLuong,
  tiLeDong,
  type BacBeMat,
  type HopNguon,
} from '@/lib/ui/nhip';

/** Ba nấc độ đặc, chọn theo LƯỢNG CHỮ đứng trên — không theo cỡ hình. */
export type DoDacKinh = 'mong' | 'vua' | 'dac';

export interface BeMatNoiProps {
  /** Đang mở hay không. Đóng thì bề mặt THU VỀ NGUỒN rồi mới rời DOM (không cắt phựt). */
  mo: boolean;
  /**
   * NGUỒN đã gọi bề mặt này — cái nút/thẻ/vật người dùng vừa chạm.
   * Bắt buộc: không có nguồn thì không có "mọc từ nguồn", và bề mặt sẽ mọc từ hư không —
   * đúng thứ luật này sinh ra để cấm. Truyền `ref` của phần tử nguồn.
   */
  nguonRef: React.RefObject<HTMLElement | null>;
  /** Nấc — quyết định NHỊP mở và độ sâu thu về khi đóng. */
  bac: Exclude<BacBeMat, 'nguon'>;
  /**
   * Độ đặc. Mặc định suy từ nấc: viên ít chữ → mỏng · bảng → vừa · bảng sâu (dày chữ/số) → đặc.
   * Khai tay khi biết rõ nội dung dày hơn nấc gợi ý (vd một viên chứa bảng số liệu).
   */
  doDac?: DoDacKinh;
  /** Bề rộng tối đa (px). Bề mặt luôn `min(rộng, 100vw - 24px)` để màn hẹp không tràn. */
  rong?: number;
  /** Đang chạy việc gì đó ⇒ tầng ③ ánh sáng chạy viền. */
  dangChay?: boolean;
  /** Nhãn cho trình đọc màn hình — bề mặt nổi luôn phải tự giới thiệu nó là gì. */
  nhan: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const DO_DAC_THEO_BAC: Record<Exclude<BacBeMat, 'nguon'>, DoDacKinh> = {
  vien: 'mong',
  bang: 'vua',
  bangSau: 'dac',
};

const LOP_DO_DAC: Record<DoDacKinh, string> = {
  mong: 'kinh-noi--mong',
  vua: '',
  dac: 'kinh-noi--dac',
};

/** Bo góc theo nấc — thang 6/10/14/20, bề mặt càng lớn bo càng lớn. */
const BO_THEO_BAC: Record<Exclude<BacBeMat, 'nguon'>, string> = {
  vien: 'var(--r-3)',
  bang: 'var(--r-4)',
  bangSau: 'var(--r-4)',
};

export function BeMatNoi({
  mo,
  nguonRef,
  bac,
  doDac,
  rong = 360,
  dangChay = false,
  nhan,
  children,
  className = '',
  style,
}: BeMatNoiProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  /** Còn trong DOM không — trễ hơn `mo` đúng một nhịp đóng, để kịp thu về nguồn. */
  const [conTrongDom, setConTrongDom] = useState(mo);
  /** Đã sang khung hình thứ hai chưa — mốc để trạng thái "đóng" kịp vẽ trước khi đổi sang "mở". */
  const [daNo, setDaNo] = useState(false);
  const [viTri, setViTri] = useState<{ trai: number; tren: number } | null>(null);
  const [goc, setGoc] = useState({ originX: 50, originY: 50 });

  const giam = giamChuyenDong();
  const msMo = thoiLuong(nhipToiBac(bac), giam);
  const msDong = thoiLuong(nhipDong(bac), giam);

  useEffect(() => {
    if (mo) {
      setConTrongDom(true);
      return;
    }
    setDaNo(false);
    if (msDong === 0) {
      setConTrongDom(false);
      return;
    }
    const t = window.setTimeout(() => setConTrongDom(false), msDong);
    return () => window.clearTimeout(t);
  }, [mo, msDong]);

  /**
   * Đo NGUỒN + đo CHÍNH MÌNH rồi tính gốc mọc. `useLayoutEffect` để đo xong mới vẽ —
   * đo trong `useEffect` là người dùng thấy một khung hình bề mặt đứng sai chỗ rồi nhảy.
   */
  useLayoutEffect(() => {
    if (!conTrongDom || !ref.current) return;
    const hopNguon: HopNguon | null = (() => {
      const el = nguonRef.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, rong: r.width, cao: r.height };
    })();
    const r = ref.current.getBoundingClientRect();

    // Chưa đặt chỗ lần nào ⇒ neo dưới nguồn, kẹp trong viewport (không để tràn mép).
    if (!viTri && hopNguon) {
      const le = 12;
      const trai = Math.min(
        Math.max(le, hopNguon.x + hopNguon.rong / 2 - r.width / 2),
        Math.max(le, window.innerWidth - r.width - le),
      );
      const duoi = hopNguon.y + hopNguon.cao + 10;
      // Không đủ chỗ dưới thì lật lên trên — cùng lối Popover.tsx đã đi.
      const tren = duoi + r.height + le > window.innerHeight ? Math.max(le, hopNguon.y - r.height - 10) : duoi;
      setViTri({ trai, tren });
      return; // lượt sau đo lại với vị trí thật rồi mới tính gốc
    }

    if (hopNguon) {
      setGoc(gocMocTuNguon(hopNguon, { x: r.left, y: r.top, rong: r.width, cao: r.height }));
    }
  }, [conTrongDom, nguonRef, viTri]);

  /** Bật cờ "đã nở" ở khung hình SAU — có thế trình duyệt mới nội suy được, không nhảy thẳng. */
  useLayoutEffect(() => {
    if (!conTrongDom || !mo || !viTri) return;
    const id = requestAnimationFrame(() => setDaNo(true));
    return () => cancelAnimationFrame(id);
  }, [conTrongDom, mo, viTri]);

  useEffect(() => {
    if (!mo) setViTri(null);
  }, [mo]);

  if (!conTrongDom || typeof document === 'undefined') return null;

  const hienRa = mo && daNo;
  const tl = hienRa ? 1 : tiLeDong(bac);

  const lopDoDac = LOP_DO_DAC[doDac ?? DO_DAC_THEO_BAC[bac]];

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal={false}
      aria-label={nhan}
      className={`kinh-noi ${lopDoDac} ${dangChay ? 'kinh-noi--dang-chay' : ''} ${className}`.trim()}
      style={{
        position: 'fixed',
        left: viTri?.trai ?? 0,
        top: viTri?.tren ?? 0,
        width: `min(${rong}px, calc(100vw - 24px))`,
        borderRadius: BO_THEO_BAC[bac],
        zIndex: 60,
        // Bề mặt chưa đo xong chỗ đứng thì đừng vẽ ra — thà chậm một khung hình còn hơn nhảy.
        visibility: viTri ? 'visible' : 'hidden',
        transformOrigin: `${goc.originX}% ${goc.originY}%`,
        transform: `scale(${tl})`,
        opacity: hienRa ? 1 : 0,
        // ⚠️ Transition đặt ở CHÍNH phần tử kính, KHÔNG ở cha — bài học K1: `opacity` trên cha
        // làm `backdrop-filter` chết giữa chừng, kính thành ô xám.
        transition:
          msMo === 0
            ? 'none'
            : `transform ${hienRa ? msMo : msDong}ms ${DUONG_CONG}, opacity ${
                hienRa ? msMo : msDong
              }ms ${DUONG_CONG}`,
        ...style,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export default BeMatNoi;
