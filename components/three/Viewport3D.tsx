'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import type { Scene3DData } from '@/lib/three/cad-to-obj';
import type { Scene3DMode, Scene3DCameraApi, LightMarker } from './Scene3DViewer';
import type { ViewDir } from './ViewCube3D';
import { RawStyle } from './RawStyle';
import { VE3D_CSS } from './ve3d-css';
import { useT } from '@/lib/i18n';
import { Maximize } from 'lucide-react';

/**
 * `Scene3DViewer`/`ViewCube3D` kéo theo `three` (~170KB gzip) ⇒ BẮT BUỘC nạp động, `ssr:false`
 * (ghi rõ trong chính đầu 2 file đó). Không import tĩnh, không thì mở app là tải three ngay —
 * kể cả kiểu `Scene3DCameraApi` cũng chỉ `import type` (xoá lúc build, không kéo runtime).
 */
const Scene3DViewer = dynamic(() => import('./Scene3DViewer'), {
  ssr: false,
  loading: () => <div className="vpscene" aria-hidden />,
});
const ViewCube3D = dynamic(() => import('./ViewCube3D'), { ssr: false });

export type { ViewDir, LightMarker };

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
  /** VIỆC 3.c — dấu vị trí đèn kéo được (`Scene3DViewer.LightMarker`). Viewport chỉ CHUYỂN TIẾP,
   * không tự dựng/ghi gì — cùng khuôn `onPushPull`. */
  lightMarkers?: LightMarker[];
  onLightMove?: (id: string, posCadMm: { x: number; y: number; z: number }) => void;
  label?: string;
  /** lưới sàn + chân trời (xem `Scene3DViewer.ground`) — mode Vẽ 3D bật, chỗ chụp ảnh tắt. */
  ground?: boolean;
  /** T4 (P14) — bắt điểm 3D: SnapSettings của useCadStore + bước lưới mm. Viewport chỉ CHUYỂN
   * TIẾP (cùng khuôn lightMarkers) — bỏ trống = không bắt, chỗ chụp ảnh không bị đụng. */
  snap3d?: { settings: import('@/lib/cad/store').SnapSettings; gridStepMm: number } | null;
  /** lớp phủ riêng của nơi dùng (empty state, trình tự bước…) — nằm TRÊN cảnh, dưới ViewCube. */
  children?: React.ReactNode;
}

/** Cảnh RỖNG hợp lệ — dùng khi chưa có khối nào. Không phải "không có cảnh": sân khấu vẫn dựng,
 * bbox 8×8m cho camera khung sẵn một khoảng người-ở-được (mở ra thấy mình đứng đâu đó, không
 * phải nhìn vào hư không). */
export const EMPTY_SCENE_3D: Scene3DData = {
  groups: [],
  bboxMm: { minX: 0, minY: 0, maxX: 8000, maxY: 8000 },
  sizeM: { w: 8, d: 8, h: 2.7 },
};

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
  lightMarkers,
  onLightMove,
  label = 'Khối xám · chưa vật liệu',
  ground = false,
  snap3d = null,
  children,
}: Viewport3DProps) {
  // PHIẾU ĐỢT 7 NHÓM B — cầu nối camera SỐNG cho ViewCube3D, xem comment `Scene3DCameraApi`
  // (`Scene3DViewer.tsx`). Viewport3D chỉ CHUYỂN TIẾP ref, không tự đọc/ghi vào đây.
  const cameraApiRef = useRef<Scene3DCameraApi | null>(null);
  const tr = useT();
  // G-M18-04 — walk/campath tự lái camera mỗi khung (xem `Scene3DCameraApi.fit`), nút mờ đi kèm
  // lý do thay vì ẩn hẳn (đúng §9 "disabled kèm lý do", không phải nút giả vì 2 mode này thật sự
  // không có khái niệm "toàn cảnh").
  const fitDisabled = mode === 'walk' || mode === 'campath';

  return (
    <div className="if-ve3d vp3d">
      <RawStyle css={VE3D_CSS} />

      <Scene3DViewer
        scene={scene}
        mode={mode}
        onPushPull={onPushPull}
        lightMarkers={lightMarkers}
        onLightMove={onLightMove}
        ground={ground}
        snap3d={snap3d}
        className="vpscene"
        cameraApiRef={cameraApiRef}
      />

      <div className="vplabel vpover">{label}</div>

      {children}

      {/* ── ViewCube 3D THẬT (góc trên phải) — xoay theo camera, 26 vùng bấm/kéo. Thay bản SVG
          2D tĩnh cũ (3 hình thoi toạ độ chết + 2 nút chữ TRƯỚC/DƯỚI rời) — cube nay phủ đủ cả
          6 mặt · 12 cạnh · 8 góc, không cần 2 nút chữ đứng ngoài nữa. ── */}
      {/* P5 (04/08): kính lỏng `.glass-float` — 1 trong ĐÚNG 4 chỗ được phép (ViewCube), luật ở
          globals.css. Khối vuông → bo mặc định var(--radius-lg) của class. */}
      <ViewCube3D className="viewcube glass-float" cameraApiRef={cameraApiRef} onPick={onViewChange} />

      {/* G-M18-04 — đưa camera về khung bao trọn toàn cảnh. Chữ THẬT (G6 — nút hành động, không
          icon-hoá), dưới ViewCube. */}
      <button
        type="button"
        className="fitbtn"
        disabled={fitDisabled}
        onClick={() => cameraApiRef.current?.fit()}
        title={fitDisabled
          ? tr('Chế độ này camera tự lái mỗi khung — không có "toàn cảnh"', 'This mode drives the camera every frame — no "fit view" here')
          : tr('Đưa camera về khung bao trọn mọi khối', 'Bring the camera back to frame all blocks')}
      >
        <Maximize size={13} strokeWidth={2} />
        {tr('Toàn cảnh', 'Fit view')}
      </button>

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
