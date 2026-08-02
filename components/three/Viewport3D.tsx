'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { Scene3DData } from '@/lib/three/cad-to-obj';
import type { Scene3DMode } from './Scene3DViewer';
import { RawStyle } from './RawStyle';
import { VE3D_CSS } from './ve3d-css';

/**
 * `Scene3DViewer` kéo theo `three` (~170KB gzip) ⇒ BẮT BUỘC nạp động, `ssr:false`
 * (ghi rõ trong chính đầu file đó). Không import tĩnh, không thì mở app là tải three ngay.
 */
const Scene3DViewer = dynamic(() => import('./Scene3DViewer'), {
  ssr: false,
  loading: () => <div className="vpscene" aria-hidden />,
});

/** Hướng nhìn ViewCube — 5 mặt theo brief. */
export type ViewDir = 'tren' | 'duoi' | 'trai' | 'phai' | 'truoc';

const VIEW_LABEL: Record<ViewDir, string> = {
  tren: 'TRÊN', duoi: 'DƯỚI', trai: 'TRÁI', phai: 'PHẢI', truoc: 'TRƯỚC',
};

export interface Viewport3DProps {
  scene: Scene3DData;
  mode?: Scene3DMode;
  /** khối đang chọn — gizmo di chuyển vẽ trên khối này. */
  selectedId?: string | null;
  /** đổi hướng nhìn từ ViewCube. */
  onViewChange?: (dir: ViewDir) => void;
  /** kéo gizmo theo 1 trục (mm). Viewport KHÔNG tự ghi vào Doc — luật một nguồn. */
  onNudge?: (axis: 'x' | 'y' | 'z', deltaMm: number) => void;
  onPushPull?: (entityId: string, newHeightMm: number) => void;
  label?: string;
}

/**
 * VIEWPORT 3D — nội dung ổ ③ (canvas) của mode Vẽ 3D.
 *
 * BỌC `Scene3DViewer` ĐÃ CÓ (3D-1..3D-5 xong sẵn: `d9eea9b`, `d7dff63`, `4c81469`, `87c2e78`,
 * `2881c32`) — KHÔNG viết lại engine, không đụng `lib/three/*` sẵn có. Chỉ thêm 3 lớp phủ 2D:
 * trục toạ độ · ViewCube · gizmo di chuyển.
 *
 * ⛔ KHỐI XÁM TRƠN, KHÔNG PBR (`docs/SPEC-3D-CORE.md` §6: "PBR/vật liệu thật · đèn/bóng đổ ·
 * physics… mọi thứ 'cho đẹp'" đều KHÔNG làm — đẹp là việc của D5 bậc 5, IF chỉ cần ĐÚNG HÌNH HỌC).
 * Vật liệu gán ở đây chỉ lưu `matId`, KHÔNG đổi cách tô trong viewport.
 *
 * ⚠️ Không biết gì về shell — nhận props, tự render. CHINH cắm vào ổ ③ `AppShell`.
 */
export function Viewport3D({
  scene,
  mode = 'orbit',
  selectedId = null,
  onViewChange,
  onNudge,
  onPushPull,
  label = 'Khối xám · chưa vật liệu',
}: Viewport3DProps) {
  const [view, setView] = useState<ViewDir>('tren');

  const pickView = (d: ViewDir) => {
    setView(d);
    onViewChange?.(d);
  };

  return (
    <div className="if-ve3d vp3d">
      <RawStyle css={VE3D_CSS} />

      <Scene3DViewer scene={scene} mode={mode} onPushPull={onPushPull} className="vpscene" />

      <div className="vplabel vpover">{label}</div>

      {/* ── ViewCube (góc trên phải) — 3 mặt hình thoi + 5 hướng bấm được ── */}
      <svg className="viewcube" viewBox="0 0 60 60" role="group" aria-label="Hướng nhìn">
        <polygon points="30,6 54,20 30,34 6,20" fill="var(--accent-soft)" stroke="var(--accent)" strokeOpacity=".35" />
        <polygon points="6,20 30,34 30,56 6,42" fill="var(--accent-soft)" fillOpacity=".7" stroke="var(--accent)" strokeOpacity=".35" />
        <polygon points="54,20 30,34 30,56 54,42" fill="var(--accent-soft)" fillOpacity=".45" stroke="var(--accent)" strokeOpacity=".35" />
        <text x="30" y="23" fontSize="7.5" fill="var(--accent)" textAnchor="middle" fontWeight="700">
          {VIEW_LABEL[view]}
        </text>
        {/* vùng bấm: mặt trên = TRÊN, mặt trái = TRÁI, mặt phải = PHẢI */}
        <polygon points="30,6 54,20 30,34 6,20" fill="transparent" style={{ cursor: 'pointer' }} role="button" aria-label="Nhìn từ trên" onClick={() => pickView('tren')} />
        <polygon points="6,20 30,34 30,56 6,42" fill="transparent" style={{ cursor: 'pointer' }} role="button" aria-label="Nhìn từ trái" onClick={() => pickView('trai')} />
        <polygon points="54,20 30,34 30,56 54,42" fill="transparent" style={{ cursor: 'pointer' }} role="button" aria-label="Nhìn từ phải" onClick={() => pickView('phai')} />
      </svg>

      {/* 2 hướng còn lại không có mặt riêng trên khối lập phương chiếu 3 mặt ⇒ để nút chữ,
          không giấu sau hover (SPEC-HOVER §3.7: cấm giấu chức năng sau hover). */}
      <div style={{ position: 'absolute', right: 18, top: 82, zIndex: 4, display: 'flex', gap: 4 }}>
        {(['truoc', 'duoi'] as ViewDir[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => pickView(d)}
            className="vbtn vpover"
          >
            {VIEW_LABEL[d]}
          </button>
        ))}
      </div>

      {/* ── Trục toạ độ (góc dưới trái) — X đỏ · Y xanh lá · Z xanh dương, đúng mock ── */}
      <svg className="axisg" viewBox="0 0 90 90" aria-label="Trục toạ độ X Y Z">
        <line x1="45" y1="60" x2="45" y2="18" stroke="var(--ax-z)" strokeWidth="3" />
        <text x="45" y="14" fontSize="11" fill="var(--ax-z)" textAnchor="middle" fontWeight="700">Z</text>
        <line x1="45" y1="60" x2="80" y2="80" stroke="var(--ax-x)" strokeWidth="3" />
        <text x="85" y="84" fontSize="11" fill="var(--ax-x)" fontWeight="700">X</text>
        <line x1="45" y1="60" x2="10" y2="80" stroke="var(--ax-y)" strokeWidth="3" />
        <text x="3" y="84" fontSize="11" fill="var(--ax-y)" fontWeight="700">Y</text>
        <circle cx="45" cy="60" r="3" fill="var(--t3)" />
      </svg>

      {/* ── Gizmo di chuyển 3 trục trên khối đang chọn ── */}
      {selectedId && (
        <svg
          style={{ position: 'absolute', left: '50%', top: '50%', width: 120, height: 120, transform: 'translate(-50%,-50%)', zIndex: 5 }}
          viewBox="0 0 120 120"
          aria-label="Gizmo di chuyển"
        >
          {([
            ['z', 60, 60, 60, 18, 'var(--ax-z)'],
            ['x', 60, 60, 100, 82, 'var(--ax-x)'],
            ['y', 60, 60, 20, 82, 'var(--ax-y)'],
          ] as const).map(([axis, x1, y1, x2, y2, color]) => (
            /* Dùng aria-label, KHÔNG <title> trong SVG: React 18 xử lý <title> khác giữa
               server/client ⇒ hydration mismatch thật (bắt ở console lúc verify; đổi sang
               template literal vẫn không hết, nên bỏ hẳn phần tử này). */
            <g key={axis} style={{ cursor: 'grab' }} role="button" aria-label={`Kéo theo trục ${axis.toUpperCase()}`} onPointerDown={() => onNudge?.(axis, 100)}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.5" />
              <circle cx={x2} cy={y2} r="5" fill={color} />
            </g>
          ))}
          <circle cx="60" cy="60" r="3.5" fill="var(--t2)" />
        </svg>
      )}

      <div className="vpnote vpover">
        Khối xám trơn — chưa vật liệu, chưa đèn. Vật liệu chỉ lưu <b>matId</b>; ảnh thật do D5 dựng.
      </div>
    </div>
  );
}
