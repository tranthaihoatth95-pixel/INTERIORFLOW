'use client';

/**
 * components/ui/BeMatNoi.tsx — BỀ MẶT NỔI, nguyên thể DÙNG CHUNG. BA MỨC VẬT LIỆU.
 *
 * ⛔ ĐÂY LÀ NƠI DUY NHẤT ĐƯỢC DỰNG BỀ MẶT NỔI. Mọi nơi cần một mặt nổi — Vitals Peek/Engage ·
 * bảng năng lực · viên ngữ cảnh · inspector nổi · trạng thái nghe giọng · cổng Spec/Present ·
 * bề mặt so sánh tạm · phản hồi hành động — GỌI VÀO ĐÂY. Cấm tự chế riêng: ba agent tự chế
 * ba hiện thực là ba cách nó hỏng, và lúc đó không sửa được ở một chỗ.
 *
 * ⭐⭐ VẬT LIỆU THEO CHỨC NĂNG — KÍNH PHẢI ĐÁNG, KHÔNG PHẢI BÔI LÊN (Hoà chốt 20/08).
 *   ① `dac`    ĐẶC/MỜ ĐỤC — **MẶC ĐỊNH** · biểu mẫu · cài đặt · thiết lập trang · spec ·
 *              dữ liệu kỹ thuật · vùng nhiều núm · chỗ đọc lâu.
 *   ② `ganDac` GẦN ĐẶC — bảng làm việc thường trực · inspector · Object Passport · bề mặt
 *              xem chi tiết / soát duyệt.
 *   ③ `kinh`   KÍNH MỎNG — CHỈ: Vitals Peek · viên giọng nói · hành động nhanh theo ngữ cảnh ·
 *              công cụ nổi nhỏ · lớp phủ tạm thoáng qua.
 *
 * 🔴 KÍNH LÀM GIẢM ĐỌC-ĐƯỢC / THỨ BẬC / ĐỘ TIN CẬY NGHỀ ⇒ **BỎ KÍNH**, hạ xuống `dac`.
 *   Đây là câu để lane sau đọc trước khi tiện tay bôi kính lên một bảng thông số: mặt kính
 *   đẹp trên ảnh chụp và tệ trên một buổi làm việc bốn tiếng.
 * ⛔ CẤM: mờ dày · phủ tím · acrylic dày · **KÍNH CHỒNG KÍNH** · phình bề mặt kính thành thẻ to
 *   (kính phải ÔM SÁT nội dung — kính to là kính đã mất lý do tồn tại).
 * Hai khuôn hợp lệ: **(A)** kính mỏng toàn phần cho bề mặt nhỏ/thoáng qua ·
 *   **(B)** VỎ KÍNH + RUỘT GẦN ĐẶC (`className="be-mat-ruot-dac"` cho ruột) khi cần chiều sâu
 *   mà nội dung phải sắc nét.
 * Bảng vai-trò → vật-liệu là bảng MÁY ĐỌC ĐƯỢC, có test: `lib/ui/vat-lieu.ts`.
 *
 * ⭐ HAI THỨ NÓ LÀM MÀ MỘT `<div className="be-mat-noi">` KHÔNG LÀM ĐƯỢC:
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
import {
  LOP_VAT_LIEU,
  vatLieuTheoVaiTro,
  type VaiTroBeMat,
  type VatLieu,
} from '@/lib/ui/vat-lieu';
import { CAM_DUOI, CAM_TREN, datCho, type Hop, type KetQuaDatCho } from '@/lib/ui/dat-cho';
import { useKeoBeMat } from './useKeoBeMat';

/**
 * ⚠️ CŨ — giữ để nơi gọi sẵn có không gãy. Trục thật bây giờ là `vatLieu` (chức năng),
 * không phải "độ đặc của kính" (thẩm mỹ). Ánh xạ ở `DO_DAC_SANG_VAT_LIEU` bên dưới.
 * @deprecated dùng `vatLieu` / `vaiTro`.
 */
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
   * ⭐ VAI TRÒ của bề mặt — *nó dùng để làm gì*. Cách khai ĐƯỢC KHUYẾN NGHỊ: khai vai trò rồi
   * để bảng luật (`lib/ui/vat-lieu.ts`) chọn vật liệu, thay vì nơi dùng tự chọn mặt kính.
   */
  vaiTro?: VaiTroBeMat;
  /** Vật liệu khai thẳng. Thắng `vaiTro`. Chỉ dùng khi vai trò chưa có trong bảng. */
  vatLieu?: VatLieu;
  /** @deprecated Trục cũ theo "độ đặc kính". Chỉ còn để nơi gọi sẵn có không gãy. */
  doDac?: DoDacKinh;
  /** Bề rộng tối đa (px). Bề mặt luôn `min(rộng, 100vw - 24px)` để màn hẹp không tràn. */
  rong?: number;
  /** Đang chạy việc gì đó ⇒ tầng ③ ánh sáng chạy viền. */
  dangChay?: boolean;
  /** Nhãn cho trình đọc màn hình — bề mặt nổi luôn phải tự giới thiệu nó là gì. */
  nhan: string;
  /**
   * Ngữ cảnh NHỚ CHỖ (vd `du-an-42.chang-3d`). Có thì vị trí cửa sổ sống qua lần tải lại trang,
   * lưu `localStorage` **theo máy** — luật 16/08: cách-bày-trên-màn không vào `.idf`/DB.
   * Bỏ trống ⇒ bề mặt tạm thời, không nhớ gì.
   */
  nguCanhNho?: string;
  /** Khoá riêng trong ngữ cảnh đó. Mặc định lấy theo `nhan`. */
  khoaNho?: string;
  /**
   * ⭐ VÙNG KHÔNG ĐƯỢC CHE, theo viewport (`getBoundingClientRect`). Sáu mục của luật đặt chỗ:
   * canvas chính · vật đang chọn · vật nguồn · vùng con trỏ đang thao tác · **Vitals** ·
   * **dải hành động mép dưới**. Ba mục sau cùng lo TỰ ĐỘNG (nguồn tự thêm; Vitals và dải
   * hành động là hai dải cấm thường trực trong `dat-cho.ts`) — nơi gọi chỉ cần truyền vùng
   * RIÊNG của màn mình: vật đang chọn, vùng con trỏ.
   */
  tranhChe?: Hop[];
  /**
   * Bề mặt này là quyết định NGẮN + CHẶN (xác nhận · xoá · cảnh báo nghiêm trọng · một câu hỏi
   * gật/lắc) ⇒ được ra GIỮA MÀN. ⛔ CẤM bật cờ này cho biểu mẫu dài / cài đặt.
   */
  quyetDinhChan?: boolean;
  /** Đóng bằng `Esc` / nút đóng. Có truyền thì cửa sổ mọc thêm thanh tiêu đề có nút ✕. */
  onDong?: () => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * ⭐ MẶC ĐỊNH THEO NẤC — ĐỔI HẲN so với bản trước (bản trước: viên/bảng/bảng-sâu = ba độ KÍNH).
 * Nay nấc nói lên CÔNG NĂNG, và công năng quyết vật liệu:
 *   · `vien`    viên ngữ cảnh, một-hai dòng, thoáng qua        → KÍNH MỎNG
 *   · `bang`    bảng làm việc / inspector, đứng lâu             → GẦN ĐẶC
 *   · `bangSau` bảng sâu: dày chữ-số, nhiều núm, đọc lâu        → ĐẶC
 * Tức mặc định của một cửa sổ làm việc thật KHÔNG còn là kính. Đó là điểm của luật này.
 */
const VAT_LIEU_THEO_BAC: Record<Exclude<BacBeMat, 'nguon'>, VatLieu> = {
  vien: 'kinh',
  bang: 'ganDac',
  bangSau: 'dac',
};

/** Trục cũ → trục mới. `vua` từng là kính-vừa; theo luật mới nó là GẦN ĐẶC. */
const DO_DAC_SANG_VAT_LIEU: Record<DoDacKinh, VatLieu> = {
  mong: 'kinh',
  vua: 'ganDac',
  dac: 'dac',
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
  vaiTro,
  vatLieu,
  doDac,
  rong = 360,
  dangChay = false,
  nhan,
  nguCanhNho,
  khoaNho,
  tranhChe,
  quyetDinhChan,
  onDong,
  children,
  className = '',
  style,
}: BeMatNoiProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  /** Còn trong DOM không — trễ hơn `mo` đúng một nhịp đóng, để kịp thu về nguồn. */
  const [conTrongDom, setConTrongDom] = useState(mo);
  /** Đã sang khung hình thứ hai chưa — mốc để trạng thái "đóng" kịp vẽ trước khi đổi sang "mở". */
  const [daNo, setDaNo] = useState(false);
  const [dat, setDat] = useState<KetQuaDatCho | null>(null);
  /** Nhịp ④ AN VỊ — sau khi nở xong, bề mặt "cắm" lại chỗ của nó (bóng đổ đầy đủ), không
   * lơ lửng nửa chừng. Bốn nhịp của luật: mọc từ nguồn → NỞ RA → CẮM/AN VỊ → thu về nguồn. */
  const [daAnVi, setDaAnVi] = useState(false);
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
    /* ⚠️ `mo` PHẢI có trong điều kiện, không chỉ `conTrongDom`. Bug browser QA 20/08 bắt được:
       lúc ĐÓNG, `conTrongDom` còn true suốt nhịp thu về, mà `setDat(null)` chạy ngay ⇒ effect
       này tính lại chỗ đặt NGAY LÚC ĐÓNG, bằng vị trí nguồn CŨ, rồi lần mở sau dùng lại kết quả
       đó. Triệu chứng: mọi phép đo lệch ĐÚNG MỘT NHỊP — bề mặt đứng đúng chỗ của lần trước.
       Loại lỗi này không lộ ra ở test thuần (lõi `datCho` vẫn đúng), chỉ lộ khi đo trên app thật. */
    if (!mo || !conTrongDom || !ref.current) return;
    const hopNguon: Hop | null = (() => {
      const el = nguonRef.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, rong: r.width, cao: r.height };
    })();
    const r = ref.current.getBoundingClientRect();
    /* 🔴 ĐO BẰNG `offsetWidth/Height`, KHÔNG bằng `getBoundingClientRect`. Lúc đo, bề mặt đang
       ở `scale(0.96)` của nhịp chưa-nở ⇒ rect trả về kích thước ĐÃ CO. Sai 4% nghe như không
       đáng kể, nhưng nó là 4px của một tấm 100px, và 4px đó đủ để tấm thò xuống dưới dải hành
       động mép dưới — đúng ca vừa đo được trên app thật. `offset*` là kích thước LAYOUT, không
       bị `transform` đụng vào. */
    const coThat = { rong: ref.current.offsetWidth, cao: ref.current.offsetHeight };

    /* ⭐ CHỖ ĐẶT DO **LUẬT** QUYẾT, KHÔNG DO TỆP NÀY TỰ TÍNH — bảy bước ở `lib/ui/dat-cho.ts`.
       Trước đây đoạn này là ~12 dòng "neo dưới nguồn, lật nếu hết chỗ, kẹp viewport" viết tại
       chỗ; nó đúng ba bước và bỏ qua bốn bước còn lại — trong đó có hai bước đắt nhất
       (đổi LOẠI theo kích cỡ, và tránh che Vitals / dải hành động). Mỗi nơi tự tính là mỗi nơi
       bỏ sót một bước khác nhau. */
    /* Đo LẠI nếu chiều cao thật khác chiều cao lúc tính chỗ. Lượt đo đầu chạy khi bề mặt còn
       `visibility:hidden` ở góc (0,0) — chữ có thể xuống dòng khác đi, và bề mặt cao hơn vài px
       là đủ để nó thò xuống dưới dải cấm mép dưới. Browser QA 20/08 đo được lệch 6-10px đúng ở
       hai ca sát mép; lõi `datCho` không sai, nó chỉ được cho một con số cao đã cũ. */
    if (dat && dat.loai === 'popover' && Math.abs(coThat.cao - dat.cao) > 2) {
      setDat(null);
      return;
    }
    if (!dat) {
      setDat(
        datCho({
          nguon: hopNguon,
          beMat: { rong: Math.min(coThat.rong, window.innerWidth - 24), cao: coThat.cao },
          khung: { rong: window.innerWidth, cao: window.innerHeight },
          tranhChe,
          quyetDinhChan,
          camTren: CAM_TREN,
          camDuoi: CAM_DUOI,
        }),
      );
      return; // lượt sau đo lại với chỗ đứng thật rồi mới tính gốc mọc
    }

    if (hopNguon) {
      setGoc(gocMocTuNguon(hopNguon, { x: r.left, y: r.top, rong: r.width, cao: r.height }));
    }
  }, [mo, conTrongDom, nguonRef, dat, rong, tranhChe, quyetDinhChan]);

  /** Bật cờ "đã nở" ở khung hình SAU — có thế trình duyệt mới nội suy được, không nhảy thẳng. */
  useLayoutEffect(() => {
    if (!conTrongDom || !mo || !dat) return;
    const id = requestAnimationFrame(() => setDaNo(true));
    return () => cancelAnimationFrame(id);
  }, [conTrongDom, mo, dat]);

  /* Nhịp AN VỊ — bật SAU khi nhịp nở kết thúc. Nó không dời bề mặt (dời lúc này là "tự nhảy"),
     nó làm bề mặt ĐỨNG HẲN: bóng đổ vào đầy đủ, cạnh ăn xuống nền. */
  useEffect(() => {
    if (!(mo && daNo)) {
      setDaAnVi(false);
      return;
    }
    if (msMo === 0) {
      setDaAnVi(true);
      return;
    }
    const t = window.setTimeout(() => setDaAnVi(true), msMo);
    return () => window.clearTimeout(t);
  }, [mo, daNo, msMo]);

  useEffect(() => {
    if (!mo) setDat(null);
  }, [mo]);

  /* ---------- CỬA SỔ NỔI DI CHUYỂN ĐƯỢC ----------
     🔴 LUẬT: bề mặt nào TRÔNG NHƯ cửa sổ nổi thì KHÔNG được ghim cứng mặc định.
     `bang`/`bangSau` là cửa sổ ⇒ kéo được. `vien` thì KHÔNG: nó là viên ngữ cảnh BÁM NGUỒN,
     một dòng thông tin cạnh vật — cho kéo là biến nó thành cửa sổ, mà đó là vật khác.
     ⛔ Không dùng bộ kéo riêng: `useKeoBeMat` là máy dùng chung với `CuaSoCongCu`. */
  const laCuaSo = bac !== 'vien';
  const coCuaSo = { w: rong, h: 320 };
  const keo = useKeoBeMat({
    nguCanh: nguCanhNho,
    khoa: khoaNho ?? nhan,
    co: coCuaSo,
    batKeo: laCuaSo && conTrongDom,
    viTriMoc: dat ? { x: dat.x, y: dat.y } : null,
  });

  /* `Esc` đóng — chỉ khi nơi dùng có đường đóng thật. Gắn ở `document` vì tiêu điểm có thể đang
     nằm trong một ô nhập bên trong cửa sổ. */
  useEffect(() => {
    if (!mo || !onDong) return;
    // esc-only: handler CHỈ đóng bằng Escape — Escape phải luôn thoát được dù tiêu điểm đang ở
    // trong một ô nhập bên trong cửa sổ (đúng lý do gắn ở `document` ghi trên), nên KHÔNG bail
    // theo INPUT/TEXTAREA ở đây.
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onDong(); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [mo, onDong]);

  if (!conTrongDom || typeof document === 'undefined') return null;

  const hienRa = mo && daNo;
  const tl = hienRa ? 1 : tiLeDong(bac);

  /* Thứ tự thắng: khai thẳng `vatLieu` → `vaiTro` (qua bảng luật) → trục cũ `doDac` → nấc. */
  const vatLieuThat: VatLieu =
    vatLieu ??
    (vaiTro ? vatLieuTheoVaiTro(vaiTro) : undefined) ??
    (doDac ? DO_DAC_SANG_VAT_LIEU[doDac] : undefined) ??
    VAT_LIEU_THEO_BAC[bac];
  const lopVatLieu = LOP_VAT_LIEU[vatLieuThat];

  /** Người dùng đã kéo đi thì cửa sổ đứng ở chỗ họ đặt; chưa kéo thì đứng ở chỗ mọc từ nguồn. */
  const choDung = keo.viTri ?? (dat ? { x: dat.x, y: dat.y } : null);

  /**
   * ⭐ NGỮ PHÁP LÚC ĐÓNG — chỗ phải quyết, và tôi quyết thế này:
   *   · CHƯA kéo ⇒ thu ngược về NGUỒN (giữ nguyên mọc-từ-nguồn, trí nhớ không gian còn đúng).
   *   · ĐÃ kéo đi ⇒ thu về CHÍNH NÓ (gốc 50% 50%), KHÔNG bay ngang màn về nguồn cũ.
   * Lý do: sau khi người dùng chủ động dời cửa sổ sang góc kia, "nguồn" thôi là chỗ họ nghĩ nó
   * thuộc về — bay ngang cả màn hình về một cái nút xa lắc là đường bay lố, đọc ra như lỗi.
   * Trí nhớ không gian lúc này neo vào CHỖ HỌ ĐẶT, nên co tại chỗ mới là đúng ngữ pháp.
   */
  const gocDong = keo.daTuKeo ? { originX: 50, originY: 50 } : goc;
  const bamMep = keo.mep.trai || keo.mep.phai || keo.mep.tren;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal={false}
      aria-label={nhan}
      className={`be-mat-noi ${lopVatLieu} ${daAnVi ? 'be-mat-noi--an-vi' : ''} ${dangChay ? 'be-mat-noi--dang-chay' : ''} ${className}`.trim()}
      style={{
        position: 'fixed',
        left: choDung?.x ?? 0,
        top: choDung?.y ?? 0,
        // Hạng `vua`/`lon` đã ĐỔI LOẠI (inspector cắm bên / toàn không gian) ⇒ bề rộng và
        // chiều cao do luật đặt chỗ quyết, không do `rong` nơi gọi đề nghị.
        width: dat && dat.loai !== 'popover' ? dat.rong : `min(${rong}px, calc(100vw - 24px))`,
        ...(dat && dat.loai !== 'popover' && dat.loai !== 'giua-man' ? { height: dat.cao } : {}),
        borderRadius: BO_THEO_BAC[bac],
        zIndex: 60,
        // Bề mặt chưa đo xong chỗ đứng thì đừng vẽ ra — thà chậm một khung hình còn hơn nhảy.
        visibility: choDung ? 'visible' : 'hidden',
        transformOrigin: `${(hienRa ? goc : gocDong).originX}% ${(hienRa ? goc : gocDong).originY}%`,
        transform: `scale(${tl})`,
        opacity: hienRa ? 1 : 0,
        // ⚠️ Transition đặt ở CHÍNH phần tử kính, KHÔNG ở cha — bài học K1: `opacity` trên cha
        // làm `backdrop-filter` chết giữa chừng, kính thành ô xám.
        // ⚠️ KHÔNG cho `left/top` vào transition: lúc kéo, mỗi khung hình một toạ độ mới ⇒
        // cửa sổ chạy đuổi theo con trỏ, cảm giác trôi/dính. Kéo phải bám tay tức thì.
        transition:
          msMo === 0
            ? 'none'
            : `transform ${hienRa ? msMo : msDong}ms ${DUONG_CONG}, opacity ${
                hienRa ? msMo : msDong
              }ms ${DUONG_CONG}`,
        ...style,
      }}
    >
      {laCuaSo && (
        <div
          {...keo.thuocTinhTieuDe}
          role="toolbar"
          aria-label={`${nhan} — thanh tiêu đề, kéo hoặc dùng phím mũi tên để di chuyển`}
          style={{
            ...keo.thuocTinhTieuDe.style,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px 8px 12px',
            borderBottom: '1px solid var(--vien-mo)',
          }}
        >
          {/* Chấm nắm — nói bằng HÌNH rằng chỗ này kéo được, không chỉ bằng con trỏ (con trỏ
              `grab` vô hình với cảm ứng và với người không rê chuột qua). */}
          <span aria-hidden style={{ letterSpacing: 2, color: 'var(--t3)', fontSize: 11 }}>⠿</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{nhan}</span>
          {/* Bám mép phải NÓI RA — hút mà im lặng thì đọc ra là cửa sổ "tự nhảy". */}
          {bamMep && (
            <span style={{ fontSize: 10, color: 'var(--t3)' }}>
              bám mép {keo.mep.trai ? 'trái' : keo.mep.phai ? 'phải' : 'trên'}
            </span>
          )}
          {onDong && (
            <button
              type="button"
              onClick={onDong}
              aria-label={`Đóng ${nhan}`}
              // `data-khong-keo`: bấm nút là BẤM, không phải bắt đầu kéo.
              data-khong-keo
              style={{
                marginLeft: 'auto',
                width: 22,
                height: 22,
                borderRadius: 'var(--r-1)',
                border: '1px solid var(--vien-mo)',
                background: 'transparent',
                color: 'var(--t2)',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}
      {children}
    </div>,
    document.body,
  );
}

export default BeMatNoi;
