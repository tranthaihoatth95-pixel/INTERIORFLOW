'use client';

/**
 * components/print/PaperSheetFrame.tsx — Màn 10. Port nguyên văn `docs/mocks/ToGiay.dc.html`.
 *
 * Khung TỜ GIẤY: mặt giấy + vùng in được (nét đứt) + N khung nhìn (viewport) + 1 ô trống cố định
 * gợi ý kéo-thả + 1 ô chừa chỗ khung tên. Component CHỈ VẼ KHUNG — không tự dựng khung tên thật:
 * nội dung khung tên do `titleBlockPro()` (`lib/cad/commands.ts`) sinh ở tầng PDF/plot, ngoài
 * phạm vi component thuần trình bày này (đúng ghi chú của mock, xem ô "CHỖ ĐẶT KHUNG TÊN").
 *
 * `variant`:
 *  - 'full'    → khung giấy đầy đủ, dùng làm mặt bằng chọn/kéo khung nhìn thật.
 *  - 'preview' → bản RÚT GỌN (chỉ khối hình chữ nhật minh hoạ, không nhãn VP/huy hiệu khoá + có
 *    dòng mono đáy "A3 · ngang · tờ 1 / 3") — dùng làm vùng xem trước trong ExportPdfDialog (Màn
 *    7). Port ĐÚNG bản rút gọn mà chính mock `HopXuatPDF.dc.html` đã vẽ (khối tĩnh, không phải
 *    suy ra từ props `viewports`) — 2 mock khác nhau ở đúng điểm này, không phải 1 component tự ý
 *    vẽ 2 kiểu.
 */

import type { CSSProperties, ReactNode } from 'react';
import { paperSizeMm, type PaperKey, type PaperOrientation } from '@/lib/cad/model';

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif";
const MONO = 'ui-monospace, Menlo, monospace';

export interface PaperSheetViewport {
  id: string;
  /** vd "VP-01" */
  label: string;
  /** N của "1/N" hiện trên nhãn nổi — KHÔNG phải zoom màn hình, giống `Viewport2D.scale` ở
   * `lib/cad/model.ts` nhưng lưu thẳng N cho dễ hiển thị (component không cần biết cách quy đổi). */
  scaleN: number;
  /** undefined = KHÔNG hiện huy hiệu khoá/mở — khớp đúng mock: VP-03 trong `ToGiay.dc.html` không
   * có huy hiệu nào (2/3 viewport có, 1/3 không) — port nguyên văn thay vì tự thêm cho "đều". */
  locked?: boolean;
  /** vị trí + kích thước, % của khổ giấy hiệu dụng (0-100), góc TRÊN-TRÁI — đúng cách mock định vị
   * bằng %, không phải mm (component không cần biết world coords). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** viền/nhãn tô accent khi đang chọn, `--paper-thin` khi không. */
  selected?: boolean;
  /** minh hoạ nét vẽ bên trong khung nhìn (thường là 1 <svg>) — không truyền thì khung để trống. */
  content?: ReactNode;
}

/** Ô nét đứt "chỗ trống" trên tờ giấy — vị trí tính bằng % khổ giấy, cùng hệ với `PaperSheetViewport`. */
export interface PaperSheetSlot {
  left: string;
  top: string;
  width: string;
  height: string;
}

/** Chỗ trống ĐÚNG như mock `ToGiay.dc.html` đặt — dùng kèm `DEMO_SHEET_VIEWPORTS`. */
export const DEMO_SHEET_EMPTY_SLOT: PaperSheetSlot = { left: '55.5%', top: '36%', width: '39%', height: '24%' };

/** Dữ liệu MẪU — 3 khung nhìn thật trong mock (VP-01 mặt bằng đã khoá · VP-02 mặt đứng chưa khoá ·
 * VP-03 chi tiết không có huy hiệu khoá). KHÔNG hardcode trong thân component (đúng chỉ đạo phiếu),
 * chỉ dùng khi nơi gọi chưa có dữ liệu Sheet/Viewport2D thật. */
export const DEMO_SHEET_VIEWPORTS: PaperSheetViewport[] = [
  {
    id: 'vp-01',
    label: 'VP-01',
    scaleN: 50,
    locked: true,
    selected: true,
    x: 5.5,
    y: 8,
    w: 47,
    h: 52,
    content: (
      <svg viewBox="0 0 300 170" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: '6%', width: '88%', height: '88%' }}>
        <g style={{ fill: 'none', stroke: 'var(--paper-ink)', strokeWidth: 2.4 }}>
          <path d="M20 20h260v130H20z" />
          <path d="M150 20v130" />
        </g>
        <g style={{ fill: 'none', stroke: 'var(--paper-ink)', strokeWidth: 1 }}>
          <path d="M20 100h130M60 20v40" />
          <path d="M175 60h90v60h-90z" />
        </g>
        <g style={{ fill: 'none', stroke: 'var(--paper-thin)', strokeWidth: 0.7 }}>
          <path d="M20 162h260M20 158v8M280 158v8" />
        </g>
        <text x={150} y={168} textAnchor="middle" style={{ fontFamily: 'ui-monospace,monospace', fontSize: 8, fill: 'var(--paper-ink)' }}>
          8 400
        </text>
      </svg>
    ),
  },
  {
    id: 'vp-02',
    label: 'VP-02',
    scaleN: 50,
    locked: false,
    x: 5.5,
    y: 64,
    w: 47,
    h: 24,
    content: (
      <svg viewBox="0 0 300 80" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: '8%', width: '84%', height: '84%' }}>
        <g style={{ fill: 'none', stroke: 'var(--paper-ink)', strokeWidth: 2.4 }}>
          <path d="M20 60h260M30 60V22h240v38" />
        </g>
        <g style={{ fill: 'none', stroke: 'var(--paper-ink)', strokeWidth: 1 }}>
          <path d="M30 40h240M90 40v20M210 40v20" />
        </g>
      </svg>
    ),
  },
  {
    id: 'vp-03',
    label: 'VP-03',
    scaleN: 20,
    // locked cố ý KHÔNG khai — VP-03 trong mock không có huy hiệu khoá.
    x: 55.5,
    y: 8,
    w: 24,
    h: 24,
    content: (
      <svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: '10%', width: '80%', height: '80%' }}>
        <g style={{ fill: 'none', stroke: 'var(--paper-ink)', strokeWidth: 2 }}>
          <path d="M20 70h80M30 70V30h60v40" />
        </g>
        <g style={{ fill: 'none', stroke: 'var(--paper-ink)', strokeWidth: 0.8 }}>
          <path d="M30 48h60M46 30v40" />
        </g>
      </svg>
    ),
  },
];

export interface PaperSheetFrameProps {
  paper: PaperKey;
  orientation: PaperOrientation;
  variant?: 'full' | 'preview';
  /** chỉ dùng ở variant 'full'; mặc định rỗng (không tự lấy DEMO_SHEET_VIEWPORTS — nơi gọi tự
   * quyết khi nào dùng dữ liệu mẫu). */
  viewports?: PaperSheetViewport[];
  /** ô nét đứt "chỗ trống — kéo khung nhìn vào"; không truyền = không vẽ (xem lý do tại nơi vẽ). */
  emptySlot?: PaperSheetSlot;
  /** chỉ dùng ở variant 'preview' — ghép dòng mono đáy "A3 · ngang · tờ {sheetIndex} / {sheetTotal}". */
  sheetIndex?: number;
  sheetTotal?: number;
}

export default function PaperSheetFrame({
  paper,
  orientation,
  variant = 'full',
  viewports = [],
  emptySlot,
  sheetIndex = 1,
  sheetTotal = 1,
}: PaperSheetFrameProps) {
  const [pw, ph] = paperSizeMm(paper, orientation);
  const aspectRatio = `${pw} / ${ph}`;

  if (variant === 'preview') {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 330,
          aspectRatio,
          background: 'var(--paper)',
          border: '1px solid var(--paper-edge)',
          boxShadow: 'var(--paper-shadow-sm)',
          fontFamily: FONT,
        }}
      >
        <div style={{ position: 'absolute', left: '4%', top: '5%', right: '4%', bottom: '5%', border: '1px dashed var(--paper-thin)' }} />
        <div style={{ position: 'absolute', left: '7%', top: '9%', width: '46%', height: '50%', border: '1.4px solid var(--paper-ink)' }} />
        <div style={{ position: 'absolute', left: '7%', top: '63%', width: '46%', height: '22%', border: '1px solid var(--paper-thin)' }} />
        <div style={{ position: 'absolute', left: '57%', top: '9%', width: '22%', height: '22%', border: '1px solid var(--paper-thin)' }} />
        <div
          style={{
            position: 'absolute',
            right: '4%',
            bottom: '5%',
            width: '38%',
            height: '25%',
            border: '1.4px solid var(--paper-ink)',
            background: 'color-mix(in srgb, var(--paper-ink) 5%, transparent)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: '4%',
            bottom: '1.4%',
            fontFamily: MONO,
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: 'var(--paper-thin)',
          }}
        >
          {paper} · {orientation === 'landscape' ? 'ngang' : 'dọc'} · tờ {sheetIndex} / {sheetTotal}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: 'min(94%, 900px)',
        aspectRatio,
        background: 'var(--paper)',
        border: '1px solid var(--paper-edge)',
        boxShadow: 'var(--paper-shadow)',
        flex: 'none',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '3.2%',
          top: '4.5%',
          right: '3.2%',
          bottom: '4.5%',
          border: '1px dashed var(--paper-thin)',
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: '3.2%',
          top: '1.2%',
          fontFamily: MONO,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          color: 'var(--paper-thin)',
        }}
      >
        vùng in được
      </span>

      {viewports.map((vp) => (
        <ViewportBox key={vp.id} vp={vp} />
      ))}

      {/* Ô "chỗ trống" là VỊ TRÍ THẬT trên tờ giấy, không phải hoa văn: mock là ảnh tĩnh nên vẽ
       * cứng ở 55.5%/36% được, còn ở đây khung nhìn do người dùng đặt ⇒ vẽ cứng sẽ đè nét đứt lên
       * đúng khung nhìn họ vừa kéo vào. Chỉ vẽ khi nơi gọi CHỈ ĐỊNH chỗ trống. */}
      {emptySlot && (
        <div
          style={{
            position: 'absolute',
            left: emptySlot.left,
            top: emptySlot.top,
            width: emptySlot.width,
            height: emptySlot.height,
            border: '1px dashed var(--paper-thin)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--paper-thin)',
            }}
          >
            chỗ trống — kéo khung nhìn vào
          </span>
        </div>
      )}

      {/* CHỖ ĐẶT KHUNG TÊN — nội dung thật do titleBlockPro() (lib/cad/commands.ts) sinh ở tầng
       * PDF/plot. Component này KHÔNG dựng lại khung tên, chỉ chừa đúng vị trí + kích thước, đúng
       * tinh thần ghi chú trong mock ToGiay.dc.html. */}
      <div
        style={{
          position: 'absolute',
          right: '3.2%',
          bottom: '4.5%',
          width: '39%',
          height: '26%',
          border: '1.5px solid var(--paper-ink)',
          // mock ghi thẳng rgba(42,37,29,.04) = mực giấy pha 4% — pha lại TỪ token để đổi
          // --paper-ink một chỗ là mảng nền đổi theo, không lệch (LUẬT L4: cấm hex/rgba tự chế).
          background: 'color-mix(in srgb, var(--paper-ink) 4%, transparent)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            color: 'var(--paper-ink)',
          }}
        >
          chỗ đặt khung tên
        </span>
        {/* Mock viết "Nội dung do titleBlockPro() sinh — lib/cad/commands.ts" — đó là ghi chú CHO
            LẬP TRÌNH VIÊN, không phải câu cho kiến trúc sư đang xem tờ giấy. `SPEC-NGON-NGU-CHI-DAN`
            cấm jargon nội bộ lộ ra UI ⇒ nói bằng lời người dùng, giữ nguyên ý. */}
        <span style={{ fontSize: 10, color: 'var(--paper-thin)', textAlign: 'center', maxWidth: '78%', textWrap: 'pretty' }}>
          Khung tên tự điền khi in — theo Brand Kit của dự án.
        </span>
      </div>
    </div>
  );
}

function ViewportBox({ vp }: { vp: PaperSheetViewport }) {
  const boxStyle: CSSProperties = {
    position: 'absolute',
    left: `${vp.x}%`,
    top: `${vp.y}%`,
    width: `${vp.w}%`,
    height: `${vp.h}%`,
    border: vp.selected ? '1.5px solid var(--accent)' : '1.5px solid var(--paper-thin)',
  };
  if (vp.selected) boxStyle.background = 'var(--accent-soft)';

  return (
    <div style={boxStyle}>
      {vp.content}
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: -19,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 17,
          padding: '0 6px',
          borderRadius: 5,
          background: vp.selected ? 'var(--accent)' : 'var(--field)',
          color: vp.selected ? 'var(--on-accent)' : 'var(--t3)',
          fontFamily: MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '.1em',
          whiteSpace: 'nowrap',
        }}
      >
        {vp.label} · 1/{vp.scaleN}
      </span>
      {vp.locked !== undefined && (
        <span
          style={{
            position: 'absolute',
            right: 4,
            top: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 16,
            padding: '0 5px',
            borderRadius: 5,
            // Chữ trên huy hiệu ok/warn cần TỐI trong theme tối (badge sáng), SÁNG trong theme
            // sáng (badge đậm hơn) — --bg đổi cực đúng chiều đó ở cả 2 theme (tối:#0c0c0e sáng:
            // #f2efe9), khớp giá trị mock hardcode #0c0c0e cho theme tối. Không có token "--on-ok"
            // riêng nên tái dùng --bg thay vì hardcode hex.
            background: vp.locked ? 'var(--vp-lock)' : 'var(--vp-open)',
            color: 'var(--bg)',
            fontFamily: MONO,
            fontSize: 8,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {vp.locked && (
            <svg width={8} height={8} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x={3.5} y={7} width={9} height={6.5} rx={1} />
              <path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.8 0V7" />
            </svg>
          )}
          {vp.locked ? 'ĐÃ KHOÁ' : 'CHƯA KHOÁ'}
        </span>
      )}
    </div>
  );
}
