'use client';

/**
 * components/render-studio/CuaSoCongCu.tsx — **CỤM CỬA SỔ CÔNG CỤ** (khung môi trường + panel
 * vệ tinh), phần dùng chung cho mọi chặng.
 *
 * ⭐ NÓ LÀ MỘT CỤM, KHÔNG PHẢI MỘT TẤM (Hoà làm rõ 16/08): *"mỗi 1 cửa sổ là 1 window — được
 * hiểu là MÔI TRƯỜNG LÀM VIỆC TỐI ƯU (ảnh/video/3D prototype…), kéo thả trong môi trường canvas,
 * xung quanh đính kèm các tool tối ưu riêng cho tác vụ đó."* ⇒ **khung môi trường** ở giữa +
 * **vệ tinh** bám quanh, kéo là kéo **cả cụm**. Đúng hình 7 ảnh tham chiếu Photoshop ·
 * Lightroom · Illustrator · Premiere: khung tài liệu ở giữa, panel nổi vây quanh và đè mép.
 *
 * ⭐ TỆP NÀY CHỈ LO CÁI KHUNG, KHÔNG LO CÁI RUỘT. Nó không biết gì về node, ảnh, chặng — chỉ biết
 * *"một cụm tự chứa, có tiêu đề, có ba nấc, đặt được ở đâu đó, quanh nó có vệ tinh"*. Ruột do nơi
 * gọi truyền qua `children`; vệ tinh lấy từ bảng môi trường (`lib/nodes/cua-so-cong-cu.ts`).
 * Tách đúng chỗ này là điều kiện để cùng một cụm sống ở 2D · 3D · Trình chiếu ([T2] một cỗ máy
 * nhiều mặt tiền) — khoá nó vào `@xyflow` là tự chặn hai chặng kia.
 *
 * 🔴 RANH GIỚI PHẢI NHÌN THẤY ĐƯỢC: lệnh chuyên sâu nằm TRONG vệ tinh của cụm, **không tràn ra
 * thanh chung**. Vì thế tệp này KHÔNG có đường nào ghi vào thanh công cụ chung — thiếu đường đi
 * thì không có ai lỡ tay đi.
 *
 * BA BIẾN THỂ — cùng cụm, khác cách ĐỨNG:
 *  · `noi`     — THÁO RỜI, nổi quanh mặt làm việc, **kéo cả cụm bằng thanh tiêu đề**, nhiều cụm
 *                cùng lúc, chồng nhau có trên/dưới.
 *  · `neo`     — neo vào vật chủ (thân node canvas). **KHÔNG `position:fixed`, KHÔNG portal** —
 *                phải THUỘC mặt làm việc để pan/zoom theo và nối dây được (Hoà 15/08: *"nó phải
 *                thuộc môi trường canvas"*). Không tự kéo: kéo vật chủ, vệ tinh đi theo.
 *  · `toanMan` — lấp khung nhìn cho việc cần soi kỹ.
 *
 * VẬT LIỆU (giữ nguyên luật đã trả giá qua 4 vòng K1–K4):
 *  · **kính là VỎ, ruột ĐẶC** — khung và vệ tinh là kính; ruột sắc nét, không phủ màu.
 *  · **một tầng kính, không hai**: vệ tinh là ANH EM của khung (đặt tuyệt đối quanh bọc ngoài),
 *    KHÔNG lồng trong khung — lồng là kính chồng kính, đúng lỗi K4 đã trả giá.
 *  · `-webkit-backdrop-filter` LUÔN đi kèm (K3 — thiếu là tablet không blur).
 *  · Không bọc thêm lớp cha có `opacity` (K1 — mờ ở cha thì kính chết).
 *
 * BA TẦNG ÁNH SÁNG KHÔNG LẪN (Hoà chốt 16/08): cụm này chỉ dùng tầng ① (kính bắt sáng ở mép).
 * Tầng ② (trỏ vào) và ③ (đang chạy — viền chạy) thuộc về VẬT, không thuộc về cửa sổ; cửa sổ tự
 * phát sáng là cướp kênh của trạng thái chạy.
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Minimize2, Maximize2, Minus, X, GripHorizontal } from 'lucide-react';
import { RADIUS } from '@/lib/geometry';
import { useT } from '@/lib/i18n';
import { ToolbarChip } from '@/components/ui/ToolbarChip';
import { useKeoBeMat } from '@/components/ui/useKeoBeMat';
import {
  KHUNG_VUA,
  MOI_TRUONG,
  NHAN_CAP,
  capKe,
  capTruoc,
  nodeIdFromKhoa,
  type CapCuaSo,
  type MaMoiTruong,
  type NeoVeTinh,
  type VeTinh,
  type ViTriCuaSo,
} from '@/lib/nodes/cua-so-cong-cu';
import { useCuaSoCongCuUi } from '@/lib/nodes/cua-so-cong-cu-ui';
import NutLenhVeTinh from './NutLenhVeTinh';
import { NHAN_NHO_STYLE } from './nhan-nho';

/**
 * ⭐ LỆNH NÀO CÓ DÒNG ĐIỆN — nay khai ở `lib/nodes/thi-hanh-lenh-cua.ts`, không nằm rải trong
 * tệp khung này nữa (22/08). Lý do đổi chỗ: bảng ở đây là một `Set` id trần, nên **12 lệnh chưa
 * nối dùng CHUNG một câu lý do** — câu đó không nói người dùng đang thiếu cái gì. Bảng mới bắt
 * mỗi lệnh khai số phận của riêng nó, và có test canh (`lenhKhongKhaiSoPhan()` phải rỗng).
 */

export type BienTheCuaSo = 'noi' | 'neo' | 'toanMan';

export interface CuaSoCongCuProps {
  /** Khoá trạng thái — `khoaCuaSoNode()` hoặc `khoaCuaSoThe()`. */
  khoa: string;
  /** Môi trường làm việc — quyết định vệ tinh nào bám quanh. Bỏ trống = cụm trần, không vệ tinh. */
  moiTruong?: MaMoiTruong;
  /** Ghi đè tiêu đề (vd tên thẻ việc cụ thể thay vì tên môi trường chung). */
  tieuDe?: string;
  moTa?: string;
  cap: CapCuaSo;
  bienThe: BienTheCuaSo;
  onCap: (cap: CapCuaSo) => void;
  /** Có nút đóng hẳn không. Cụm neo vào node thì "đóng" = thu về khối nhỏ, nên bỏ trống. */
  onDong?: () => void;
  /** Dải dưới đáy — chỗ sống của định nghĩa kết quả / trạng thái. */
  chanTrang?: ReactNode;
  children: ReactNode;
}

const VE_TINH_W = 168;

/** Vỏ kính — dùng chung cho khung môi trường LẪN vệ tinh, để hai thứ là một họ vật liệu. */
function voKinh(bo: number): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: bo,
    overflow: 'hidden',
    border: '1px solid var(--border-strong)',
    boxShadow: 'var(--shadow-pop)',
    background: 'color-mix(in srgb, var(--panel) 82%, transparent)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };
}

/**
 * Đặt vệ tinh quanh khung. Toạ độ tính theo BỌC NGOÀI của cụm ⇒ kéo cụm là vệ tinh đi theo.
 *
 * 🔴 `trong` — SỬA 22/08, lỗi bắt được bằng ẢNH CHỤP THẬT chứ không bằng đọc mã: ở nấc `toanMan`
 * bọc ngoài là `inset:0`, nên `right: calc(100% + 8px)` đẩy vệ tinh **ra ngoài mép màn** ⇒ nấc
 * to nhất là nấc DUY NHẤT không có vệ tinh nào. Đúng thứ luật *"nấc to phải có thứ nấc nhỏ
 * KHÔNG THỂ có"* cấm — nó còn ít hơn nấc vừa.
 * Nay ở toàn màn vệ tinh **nổi ĐÈ LÊN MÉP** mặt làm việc (đúng hình 7 ảnh tham chiếu Photoshop ·
 * Lightroom · Premiere: panel vây quanh và đè mép tài liệu), không bị đẩy ra ngoài.
 */
function choDung(neo: NeoVeTinh, thuTu: number, trong: boolean): CSSProperties {
  const cach = 8;
  const chung = { position: 'absolute', width: VE_TINH_W } as const;
  if (trong) {
    // Nổi ĐÈ mép trong. `zIndex` để chắc chắn đứng trên ruột, không lẫn vào nội dung.
    if (neo === 'trai') return { ...chung, left: 12, top: 64 + thuTu * 132, zIndex: 1 };
    if (neo === 'phai') return { ...chung, right: 12, top: 64 + thuTu * 132, zIndex: 1 };
    return { ...chung, bottom: 12, left: 12 + thuTu * (VE_TINH_W + cach), zIndex: 1 };
  }
  if (neo === 'trai') return { ...chung, right: `calc(100% + ${cach}px)`, top: thuTu * 132 };
  if (neo === 'phai') return { ...chung, left: `calc(100% + ${cach}px)`, top: thuTu * 132 };
  return { ...chung, top: `calc(100% + ${cach}px)`, left: thuTu * (VE_TINH_W + cach) };
}

/**
 * PANEL VỆ TINH — mang lệnh chuyên sâu CỦA RIÊNG môi trường này.
 * Lệnh hiện dạng nút mờ KÈM LÝ DO: chúng chưa nối vào bộ thi hành nào, và §9 cấm nút giả —
 * nút bấm không ra gì còn tệ hơn ô trống. Ô trống là bằng chứng còn việc (luật §9 "cấm xoá ô
 * trống cho gọn mắt"); nút giả là lời hứa suông.
 */
function PanelVeTinh({ v, thuTu, khoa, trong }: { v: VeTinh; thuTu: number; khoa: string; trong: boolean }) {
  const tr = useT();
  const nodeId = nodeIdFromKhoa(khoa);
  return (
    <aside
      style={{ ...voKinh(RADIUS.r2), ...choDung(v.neo, thuTu, trong) }}
      aria-label={tr(v.ten.vi, v.ten.en)}
      className="nodrag nowheel"
    >
      <p
        style={{
          ...NHAN_NHO_STYLE,
          color: 'var(--t3)',
          padding: '6px 10px',
          borderBottom: '1px solid var(--vien-mo)',
        }}
      >
        {tr(v.ten.vi, v.ten.en)}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 6, background: 'var(--bg)' }}>
        {v.lenh.map((l) => (
          <NutLenhVeTinh key={l.id} lenhId={l.id} nhan={tr(l.nhan.vi, l.nhan.en)} nodeId={nodeId} />
        ))}
      </div>
    </aside>
  );
}

export default function CuaSoCongCu({
  khoa,
  moiTruong,
  tieuDe,
  moTa,
  cap,
  bienThe,
  onCap,
  onDong,
  chanTrang,
  children,
}: CuaSoCongCuProps) {
  const tr = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const viTriLuu = useCuaSoCongCuUi((s) => s.bang[khoa]?.viTri);
  const thuTuChong = useCuaSoCongCuUi((s) => s.thuTu);
  const datViTri = useCuaSoCongCuUi((s) => s.datViTri);
  const dayLenTren = useCuaSoCongCuUi((s) => s.dayLenTren);

  const viTri: ViTriCuaSo = viTriLuu ?? { x: 96, y: 88 };

  const mt = moiTruong ? MOI_TRUONG[moiTruong] : null;
  const ten = tieuDe ?? (mt ? tr(mt.ten.vi, mt.ten.en) : '');
  const phu = moTa ?? (mt ? tr(mt.moTa.vi, mt.moTa.en) : undefined);

  /* ⭐ KÉO — dùng MÁY CHUNG `useKeoBeMat`, không giữ bản riêng nữa (20/08).
     Trước đây phần này là ~60 dòng pointer capture + phím mũi tên viết tại chỗ. Khi `BeMatNoi`
     cũng cần kéo, giữ nguyên ở đây là có HAI bộ kéo — đúng thứ luật §17 cấm. Cơ chế đã rút ra
     `components/ui/useKeoBeMat.ts`; mọi quyết định cũ giữ nguyên (pointer capture · Shift đi
     nhanh gấp 4 · `touchAction:'none'`), và được THÊM hút mép + chặn kéo-nhầm-khi-đang-gõ.
     Vị trí vẫn do `useCuaSoCongCuUi` giữ (cần THỨ TỰ CHỒNG giữa nhiều cửa sổ) — hook nhận kho
     ngoài qua `viTriNgoai`/`onDoiCho`, nên không phải đổi kho. */
  const keo = useKeoBeMat({
    khoa,
    co: { w: KHUNG_VUA.w, h: KHUNG_VUA.h },
    batKeo: bienThe === 'noi',
    viTriMoc: viTri,
    viTriNgoai: viTri,
    onDoiCho: (v) =>
      datViTri(khoa, v, { w: KHUNG_VUA.w, h: KHUNG_VUA.h }, { w: window.innerWidth, h: window.innerHeight }),
    onChamVao: () => dayLenTren(khoa),
  });

  const bo = bienThe === 'toanMan' ? 0 : RADIUS.r3;

  const thanhTieuDe = (
    <div
      {...keo.thuocTinhTieuDe}
      role={bienThe === 'noi' ? 'toolbar' : undefined}
      aria-label={
        bienThe === 'noi'
          ? tr(`${ten} — mũi tên để dời cụm`, `${ten} — arrow keys move the cluster`)
          : undefined
      }
      // `nodrag`: trong canvas, ngăn xyflow cướp thao tác của thanh tiêu đề.
      className="nodrag"
      style={{
        ...keo.thuocTinhTieuDe.style,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px 8px 12px',
        borderBottom: '1px solid var(--vien-mo)',
      }}
    >
      {bienThe === 'noi' && <GripHorizontal size={14} aria-hidden style={{ color: 'var(--t4)', flexShrink: 0 }} />}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--t1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {ten}
        </p>
        {phu && (
          <p style={{ fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {phu}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <ToolbarChip
          icon={<Minus size={14} />}
          label={tr('Thu gọn', 'Collapse')}
          desc={tr(NHAN_CAP[capTruoc(cap)].vi, NHAN_CAP[capTruoc(cap)].en)}
          size={28}
          disabled={cap === 'thu'}
          disabledReason={tr('Đã ở nấc gọn nhất', 'Already at the smallest step')}
          onClick={() => onCap(capTruoc(cap))}
        />
        <ToolbarChip
          icon={cap === 'toanMan' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          label={cap === 'toanMan' ? tr('Thoát toàn màn', 'Exit full screen') : tr('Mở rộng', 'Expand')}
          desc={tr(NHAN_CAP[capKe(cap)].vi, NHAN_CAP[capKe(cap)].en)}
          size={28}
          disabled={cap === 'toanMan'}
          disabledReason={tr('Đã ở nấc rộng nhất', 'Already at the largest step')}
          onClick={() => onCap(capKe(cap))}
        />
        {onDong && <ToolbarChip icon={<X size={14} />} label={tr('Đóng', 'Close')} size={28} onClick={onDong} />}
      </div>
    </div>
  );

  /* RUỘT — sắc nét, KHÔNG kính. `position:relative` để nội dung nào tự `absolute;inset:0`
     (vd `ToolModeForm`) lấp đúng khung này thay vì lấp cả viewport. */
  const khungMoiTruong = (
    <div style={{ ...voKinh(bo), width: '100%', height: '100%' }}>
      {thanhTieuDe}
      <div className="nowheel" style={{ position: 'relative', flex: 1, minHeight: 0, background: 'var(--bg)', overflow: 'auto' }}>
        {children}
      </div>
      {chanTrang && (
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--vien-mo)', padding: '6px 12px', background: 'var(--panel)' }}>
          {chanTrang}
        </div>
      )}
    </div>
  );

  // Vệ tinh chỉ có nghĩa khi cụm đang mở. Nấc `thu` không vẽ vệ tinh — "gọn và tươm tất ở lớp
  // mặc định" (Hoà 16/08) và nấc thu phải ĐỦ TỰ THÂN, không phải bản cắt xén chờ mở ra.
  const veTinh =
    mt && cap !== 'thu'
      ? (['trai', 'phai', 'duoi'] as NeoVeTinh[]).flatMap((neo) =>
          mt.veTinh
            .filter((v) => v.neo === neo)
            // Nấc `vua` và `toanMan` bày đủ lệnh như nhau — khác nhau ở CHỖ ĐỨNG, không ở chỗ
            // giấu bớt lệnh (giấu theo nấc là bắt người dùng học hai bản đồ lệnh).
            .map((v, i) => (
              <PanelVeTinh key={v.id} v={v} thuTu={i} khoa={khoa} trong={bienThe === 'toanMan'} />
            )),
        )
      : null;

  // BỌC NGOÀI — trong suốt, KHÔNG kính (nếu bọc ngoài cũng kính thì thành kính chồng kính với
  // cả khung lẫn vệ tinh). Nó chỉ làm gốc toạ độ để vệ tinh bám theo khi kéo cụm.
  const cum = (style: CSSProperties) => (
    <div style={{ position: 'relative', ...style }}>
      {khungMoiTruong}
      {veTinh}
    </div>
  );

  // ── NEO: nằm TRONG mặt làm việc. Không fixed, không portal — đó là cả ý nghĩa của biến thể này.
  if (bienThe === 'neo') return cum({ width: '100%', height: '100%' });

  if (!mounted) return null; // portal cần DOM — tránh lệch SSR.

  // ── TOÀN MÀN
  if (bienThe === 'toanMan') {
    return createPortal(cum({ position: 'fixed', inset: 0, zIndex: 36 }), document.body);
  }

  // ── NỔI: tháo rời, kéo cả cụm, chồng nhau có trên/dưới.
  const bac = thuTuChong.indexOf(khoa);
  return createPortal(
    <div onPointerDownCapture={() => dayLenTren(khoa)} style={{ position: 'fixed', left: viTri.x, top: viTri.y, zIndex: 31 + Math.max(bac, 0) }}>
      {cum({
        width: `min(${KHUNG_VUA.w}px, calc(100vw - 32px))`,
        height: `min(${KHUNG_VUA.h}px, calc(100vh - 120px))`,
      })}
    </div>,
    document.body,
  );
}
