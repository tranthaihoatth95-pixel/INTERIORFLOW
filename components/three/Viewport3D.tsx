'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useTree3DUi } from '@/lib/render-studio/tree3d-ui';
import { useTool3D } from '@/lib/render-studio/tool3d';
import { useCadStore } from '@/lib/cad/store';
import { wallSegmentOutline } from '@/lib/cad/commands';
import { duongBaoKhoiDac, type CreateTool3D } from '@/lib/three/tao-khoi-3d';
import { applyArrayGrid, parseArrayCommand } from '@/lib/render-studio/array-grid-ops';
import type { Scene3DData } from '@/lib/three/cad-to-obj';
import type { Scene3DMode, Scene3DCameraApi, LightMarker } from './Scene3DViewer';
import type { CamPathResult } from '@/lib/cad/campath';
import type { LightRig } from '@/lib/three/lighting';
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
  camPath?: CamPathResult;
  cameraHeightMm?: number;
  lensMm?: number;
  /** Bật riêng cho workspace Chiếu sáng; các nơi khác giữ khối xám như trước. */
  lightingPreview?: LightRig | null;
  /** khối đang chọn — gizmo di chuyển vẽ trên khối này. */
  selectedId?: string | null;
  /** đổi hướng nhìn từ ViewCube. */
  onViewChange?: (dir: ViewDir) => void;
  /** kéo gizmo theo 1 trục (mm). Viewport KHÔNG tự ghi vào Doc — luật một nguồn. */
  onNudge?: (axis: 'x' | 'y' | 'z', deltaMm: number) => void;
  /** 21/08 — kéo vòng ngoài gizmo để XOAY quanh trục đứng (độ, dương = ngược kim đồng hồ theo hệ
   *  Y-Bắc của Doc). Cùng luật với `onNudge`: Viewport KHÔNG tự ghi Doc, nơi gọi ghi. */
  onRotate?: (deltaDeg: number) => void;
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
  /**
   * LANE C (20/08) — mượn ref camera SỐNG ra ngoài. Bỏ trống thì Viewport tự giữ ref riêng y như
   * trước (ViewCube vẫn chạy); truyền vào thì nơi mount đọc được `camera`/`controls` thật để CHỤP
   * đúng góc đang nhìn (`components/three/capture-live.ts`). Chỉ MƯỢN, không đổi hành vi: cùng
   * một ref được truyền tiếp xuống `Scene3DViewer` như cũ.
   */
  cameraApiRef?: React.MutableRefObject<Scene3DCameraApi | null>;
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
  camPath,
  cameraHeightMm,
  lensMm,
  lightingPreview = null,
  selectedId = null,
  onViewChange,
  onNudge,
  onRotate,
  onPushPull,
  lightMarkers,
  onLightMove,
  label = 'Khối xám · chưa vật liệu',
  ground = false,
  snap3d = null,
  cameraApiRef: cameraApiRefNgoai,
  children,
}: Viewport3DProps) {
  // PHIẾU ĐỢT 7 NHÓM B — cầu nối camera SỐNG cho ViewCube3D, xem comment `Scene3DCameraApi`
  // (`Scene3DViewer.tsx`). Viewport3D chỉ CHUYỂN TIẾP ref, không tự đọc/ghi vào đây.
  // Ref nội bộ chỉ dùng khi nơi mount KHÔNG truyền ref của mình vào (giữ nguyên hành vi cũ).
  const cameraApiRefNoi = useRef<Scene3DCameraApi | null>(null);

  /* ── DỰNG KHỐI BẰNG CỬ CHỈ (21/08) ───────────────────────────────────────────────────────
     NỐI, KHÔNG XÂY: hình học đã có đủ từ trước (`lib/three/tao-khoi-3d.ts` sinh đường bao,
     `lib/cad/commands.wallSegmentOutline` dựng tường), công cụ đang cầm đã có store riêng
     (`useTool3D`), Doc đã có `addEntities` + undo. Thứ DUY NHẤT thiếu là con trỏ→mặt sàn, nay
     `Scene3DViewer` mở ra. Ở đây chỉ ghép ba mảnh đó lại.
     Ánh xạ tên: dock gọi theo hình vẽ (Đường/Chữ nhật/Vòng tròn), khối dựng ra gọi theo vật
     (tường/hộp/trụ) — cùng một lệnh, hai mặt tiền, không đẻ tập lệnh thứ hai. */
  const toolDangCam = useTool3D((s) => s.active);
  const cuChiDung: CreateTool3D | null =
    toolDangCam === 'line' ? 'wall' : toolDangCam === 'rect' ? 'box' : toolDangCam === 'circle' ? 'cylinder' : null;

  // Khối vừa dựng phải TỰ ĐƯỢC CHỌN, nhưng tên group chỉ tồn tại sau khi `scene` dựng lại ở lượt
  // render kế ⇒ ghi nhớ id rồi chọn khi scene mới tới (không thể chọn ngay trong handler).
  const chonSauKhiDungRef = useRef<string | null>(null);
  useEffect(() => {
    const id = chonSauKhiDungRef.current;
    if (!id) return;
    const g = scene.groups.find((x) => x.entityId === id);
    if (!g) return;
    chonSauKhiDungRef.current = null;
    useTree3DUi.getState().pick(g.name, id);
  }, [scene]);

  function ghiKhoiMoi(p: import('./Scene3DViewer').CreateSolidPayload) {
    const st = useCadStore.getState();
    const layer = st.currentLayer;
    const ents =
      p.tool === 'wall'
        ? wallSegmentOutline(p.aMm, p.bMm, p.thicknessMm, layer).map((e) => ({ ...e, heightMm: p.heightMm }))
        : duongBaoKhoiDac(p.pointsMm, layer).map((e) => ({ ...e, heightMm: p.heightMm }));
    st.addEntities(ents);
    // `polyline` kín là entity MANG hình (hatch chỉ là poché bám vào nó qua hostId) — đây là id
    // mà `docToObjScene` gắn lên group, nên cũng là id chọn được.
    chonSauKhiDungRef.current = ents.find((e) => e.type === 'polyline')?.id ?? ents[0]?.id ?? null;
    // Thả tay khỏi công cụ sau MỘT hình: đúng nhịp "vẽ xong là chọn để chỉnh số ngay", không bắt
    // người dùng nhớ tắt công cụ (máy trạng thái `tool3d` cũng về 'select' sau Enter/Esc).
    useTool3D.getState().setActive('select');
  }
  const cameraApiRef = cameraApiRefNgoai ?? cameraApiRefNoi;
  const tr = useT();

  /* ── GIZMO BÁM VẬT + KÉO ĐƯỢC (21/08) ────────────────────────────────────────────────────
     Trước: gizmo ghim giữa màn, mỗi trục chỉ là nút nhích 100mm ⇒ "Dời/Xoay" trên thực tế không
     tồn tại như một thao tác kéo (đo bằng con trỏ thật: kéo chỉ xoay máy ảnh).                */
  const boxRef = useRef<HTMLDivElement>(null);
  const [neoGizmo, setNeoGizmo] = useState<{ x: number; y: number } | null>(null);
  const [keo, setKeo] = useState<{ truc: 'x' | 'y' | 'z' | 'xoay'; d: number } | null>(null);
  const keoRef = useRef<{ truc: 'x' | 'y' | 'z' | 'xoay'; x0: number; y0: number; d: number } | null>(null);

  /** Tâm khối đang chọn, chiếu ra toạ độ màn. Chạy mỗi khung: camera xoay/zoom là gizmo phải đi
   *  theo, không thể tính một lần rồi thôi. Rẻ — vài phép nhân ma trận cho một điểm. */
  useEffect(() => {
    if (!selectedId) {
      setNeoGizmo(null);
      return;
    }
    let raf = 0;
    const chay = () => {
      raf = requestAnimationFrame(chay);
      const cam = cameraApiRef.current?.camera;
      const host = boxRef.current;
      const g = scene.groups.find((x) => x.entityId === selectedId);
      if (!cam || !host || !g || !g.positions.length) return;
      // trọng tâm các đỉnh (three, mét) — đủ đúng cho một cái neo, không cần Box3 đầy đủ
      let sx = 0;
      let sy = 0;
      let sz = 0;
      const n = g.positions.length / 3;
      for (let i = 0; i < g.positions.length; i += 3) {
        sx += g.positions[i];
        sy += g.positions[i + 1];
        sz += g.positions[i + 2];
      }
      // Chiếu thủ công world → clip bằng CHÍNH ma trận của camera, KHÔNG `import * as THREE`:
      // docstring đầu file cấm import tĩnh `three` (≈170KB gzip vào bundle chính; cả kiểu cũng
      // chỉ `import type`). Camera là object three thật do Scene3DViewer giữ, nên đọc `.elements`
      // là đủ — vài phép nhân, không cần thư viện.
      const px = sx / n;
      const py = sy / n;
      const pz = sz / n;
      const mv = cam.matrixWorldInverse.elements;
      const pr = cam.projectionMatrix.elements;
      const ap = (m: number[], x: number, y: number, z: number, w: number) => [
        m[0] * x + m[4] * y + m[8] * z + m[12] * w,
        m[1] * x + m[5] * y + m[9] * z + m[13] * w,
        m[2] * x + m[6] * y + m[10] * z + m[14] * w,
        m[3] * x + m[7] * y + m[11] * z + m[15] * w,
      ];
      const e = ap(mv as unknown as number[], px, py, pz, 1);
      const c = ap(pr as unknown as number[], e[0], e[1], e[2], e[3]);
      if (!c[3]) return;
      const r = host.getBoundingClientRect();
      setNeoGizmo({ x: ((c[0] / c[3] + 1) / 2) * r.width, y: ((1 - c[1] / c[3]) / 2) * r.height });
    };
    raf = requestAnimationFrame(chay);
    return () => cancelAnimationFrame(raf);
  }, [selectedId, scene, cameraApiRef]);

  /**
   * Bắt đầu kéo một trục (hoặc vòng xoay). GHI MỘT LẦN LÚC THẢ: trong lúc kéo chỉ cập nhật con
   * số hiện trên gizmo, thả tay mới gọi `onNudge`/`onRotate` đúng một nhịp ⇒ một bước hoàn tác.
   * Ghi từng khung sẽ mượt hơn nhưng đẻ hàng trăm bước Ctrl+Z rác — đổi lại không đáng.
   * Kéo dưới 3px coi là CÚ BẤM: giữ nguyên hành vi nhích 100mm cũ, không cướp mất đường đó.
   */
  function batDauKeo(e: React.PointerEvent, truc: 'x' | 'y' | 'z' | 'xoay') {
    e.preventDefault();
    e.stopPropagation();
    keoRef.current = { truc, x0: e.clientX, y0: e.clientY, d: 0 };
    setKeo({ truc, d: 0 });
    const el = e.currentTarget as Element;
    el.setPointerCapture?.(e.pointerId);

    const move = (ev: PointerEvent) => {
      const k = keoRef.current;
      if (!k) return;
      const dx = ev.clientX - k.x0;
      const dy = ev.clientY - k.y0;
      // Quy đổi màn → thế giới: 1px ≈ 10mm (trục) / 0,5° (xoay). Hằng số thô có chủ ý — chính
      // xác thì gõ số ở Inspector; ở đây cần CẢM GIÁC kéo, và số hiện ngay nên không ai đoán mò.
      k.d = truc === 'xoay' ? dx * 0.5 : truc === 'z' ? -dy * 10 : (truc === 'x' ? dx : dy) * 10;
      setKeo({ truc, d: k.d });
    };
    const up = () => {
      const k = keoRef.current;
      keoRef.current = null;
      setKeo(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!k) return;
      if (Math.abs(k.d) < 30) {
        // gần như không di chuyển ⇒ đối xử như CÚ BẤM (đường nhích cũ).
        if (k.truc !== 'xoay') onNudge?.(k.truc, 100);
        return;
      }
      if (k.truc === 'xoay') onRotate?.(k.d);
      else onNudge?.(k.truc, Math.round(k.d));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
  // G-M18-04 — walk/campath tự lái camera mỗi khung (xem `Scene3DCameraApi.fit`), nút mờ đi kèm
  // lý do thay vì ẩn hẳn (đúng §9 "disabled kèm lý do", không phải nút giả vì 2 mode này thật sự
  // không có khái niệm "toàn cảnh").
  const fitDisabled = mode === 'walk' || mode === 'campath';

  /**
   * GOTO-3D (19/08) — nhảy-tới-đối-tượng cho `ReviewPanel` (mặt tiền chặng 3D, cùng khuôn
   * `cad:goto-box`/`present:goto-slide`). Nghe TRỰC TIẾP qua `window` (không props) — cùng cách
   * `Render3DModeSkeleton.tsx` nghe `focusEntity` URL param, và cùng lý do `CadCanvas` nghe
   * `cad:goto-box`: bên bấm (ReviewPanel) không biết/không cần biết Viewport3D đang mount ở đâu.
   * `useTree3DUi.select` TOGGLE nếu gọi lại đúng tên đang chọn (xem store) — canh y hệt guard của
   * nhánh `focusEntity` để bấm lại cùng một finding không vô tình BỎ chọn khối đó.
   */
  useEffect(() => {
    const onGotoEntity = (ev: Event) => {
      const id = (ev as CustomEvent<{ entityId?: string }>).detail?.entityId;
      if (!id) return;
      const g = scene.groups.find((x) => x.entityId === id);
      if (g) {
        const ui = useTree3DUi.getState();
        if (ui.selectedName !== g.name) ui.select(g.name);
      }
      cameraApiRef.current?.fit(id);
    };
    window.addEventListener('render:goto-entity', onGotoEntity);
    return () => window.removeEventListener('render:goto-entity', onGotoEntity);
  }, [scene]);

  return (
    <div className="if-ve3d vp3d" ref={boxRef}>
      <RawStyle css={VE3D_CSS} />

      <Scene3DViewer
        scene={scene}
        mode={mode}
        selectedId={selectedId}
        camPath={camPath}
        cameraHeightMm={cameraHeightMm}
        lensMm={lensMm}
        lightingPreview={lightingPreview}
        onPushPull={onPushPull}
        lightMarkers={lightMarkers}
        onLightMove={onLightMove}
        ground={ground}
        snap3d={snap3d}
        className="vpscene"
        cameraApiRef={cameraApiRef}
        // 21/08 — bấm thẳng vào khối trên khung nhìn là CHỌN (viewport-first). Map entityId→group
        // y hệt đường `render:goto-entity` ngay trên; `pick` đặt thẳng (không toggle) để bấm lại
        // cùng khối vẫn giữ chọn. Inspector/Tool3DBar tự ăn theo `useTree3DUi.selectedName`.
        onPickEntity={(id) => {
          const g = scene.groups.find((x) => x.entityId === id);
          if (g) useTree3DUi.getState().pick(g.name, id);
        }}
        createTool={cuChiDung}
        onCreateSolid={ghiKhoiMoi}
        onCreateCancel={() => useTool3D.getState().setActive('select')}
      />

      <div className="vplabel vpover">{label}</div>

      {children}

      {/* ── ViewCube 3D THẬT (góc trên phải) — xoay theo camera, 26 vùng bấm/kéo. Thay bản SVG
          2D tĩnh cũ (3 hình thoi toạ độ chết + 2 nút chữ TRƯỚC/DƯỚI rời) — cube nay phủ đủ cả
          6 mặt · 12 cạnh · 8 góc, không cần 2 nút chữ đứng ngoài nữa. ── */}
      {/* P5 (04/08): kính lỏng `.glass-float` — 1 trong ĐÚNG 4 chỗ được phép (ViewCube), luật ở
          globals.css. Khối vuông → bo mặc định var(--radius-lg) của class. */}
      <ViewCube3D size={76} className="viewcube" cameraApiRef={cameraApiRef} onPick={onViewChange} />

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

      {/* ── GIZMO BIẾN ĐỔI — 21/08 dựng lại cho KÉO ĐƯỢC ─────────────────────────────────────
          Bản cũ: SVG ghim cứng ở GIỮA MÀN (`left:50% top:50%`), mỗi trục chỉ `onPointerDown` gọi
          `onNudge(axis, 100)` — tức "Dời" thật ra là NÚT NHÍCH 100mm, và nó không dính vào vật
          đang chọn. Đo bằng con trỏ thật: kéo trên khối chỉ xoay máy ảnh, toạ độ trong Doc không
          đổi.
          Nay: gizmo BÁM VẬT (chiếu tâm khối đang chọn ra màn mỗi khung hình) và KÉO ĐƯỢC.
          · kéo trục X/Y/Z → dời · kéo vòng ngoài → xoay quanh trục đứng;
          · GHI MỘT LẦN lúc thả (không ghi từng khung) ⇒ đúng MỘT bước hoàn tác, không phải hàng
            trăm bước rác — đây là lý do chọn commit-on-release thay vì hình chạy theo con trỏ;
          · số mm/độ hiện ngay cạnh gizmo trong lúc kéo nên vẫn thấy mình đang làm gì;
          · bấm (không kéo) vẫn nhích 100mm như cũ — đường phím/chính xác giữ nguyên. */}
      {selectedId && neoGizmo && (
        <svg
          style={{
            position: 'absolute', left: neoGizmo.x, top: neoGizmo.y, width: 128, height: 128,
            transform: 'translate(-50%,-50%)', zIndex: 5, overflow: 'visible',
          }}
          viewBox="0 0 128 128"
          aria-label="Gizmo biến đổi"
        >
          {/* vòng XOAY — ngoài cùng để không tranh chỗ với 3 trục dời */}
          <circle cx="64" cy="64" r="44" fill="none" stroke="var(--t4)" strokeWidth="1.6" strokeDasharray="3 5" pointerEvents="none" />
          {/* Vùng bắt chuột RIÊNG, trong suốt, dày 16px. Nét vẽ 1,6px lại còn ĐỨT QUÃNG thì gần
              như không thể kéo trúng — con trỏ rơi vào khe là sự kiện xuyên xuống canvas và biến
              thành xoay máy ảnh. Đã đo thật: `elementFromPoint` ngay trên vành trả về <svg>, không
              phải <circle>. Tách nét-để-nhìn khỏi vùng-để-bắt, cùng khuôn đã dùng cho 3 trục. */}
          <circle
            cx="64" cy="64" r="44" fill="none" stroke="transparent" strokeWidth="16"
            style={{ cursor: 'grab' }} role="button"
            aria-label="Kéo để xoay quanh trục đứng"
            onPointerDown={(e) => batDauKeo(e, 'xoay')}
          />
          {([
            ['z', 64, 64, 64, 14, 'var(--ax-z)'],
            ['x', 64, 64, 112, 84, 'var(--ax-x)'],
            ['y', 64, 64, 16, 84, 'var(--ax-y)'],
          ] as const).map(([axis, x1, y1, x2, y2, color]) => (
            /* aria-label chứ KHÔNG <title> trong SVG: React 18 xử lý <title> khác nhau giữa
               server/client ⇒ hydration mismatch thật (đã bắt ở console lúc verify). */
            <g
              key={axis}
              style={{ cursor: 'grab' }}
              role="button"
              aria-label={`Kéo theo trục ${axis.toUpperCase()}`}
              onPointerDown={(e) => batDauKeo(e, axis)}
            >
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.4" />
              <circle cx={x2} cy={y2} r="4.4" fill={color} />
              {/* vùng bắt chuột rộng hơn nét vẽ — nét 2.4px thì gần như không kéo trúng */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="16" />
            </g>
          ))}
          <circle cx="64" cy="64" r="3.4" fill="var(--t2)" />
          {keo && (
            <text x="72" y="52" fontSize="12" fill="var(--t1)" fontWeight="600" style={{ paintOrder: 'stroke' }}
                  stroke="var(--bg)" strokeWidth="3">
              {keo.truc === 'xoay' ? `${Math.round(keo.d)}°` : `${Math.round(keo.d)} mm`}
            </text>
          )}
        </svg>
      )}

      <div className="vpnote vpover">
        Khối xám trơn — chưa vật liệu, chưa đèn. Vật liệu chỉ lưu <b>matId</b>; ảnh thật do D5 dựng.
      </div>

      {mode === 'massing' && <QuickCommandBox scene={scene} />}
    </div>
  );
}

/**
 * ③ (Hoà chốt 08/08) — DÒNG NHẬP NHANH kiểu SketchUp Measurements box / 3ds Max Type-in: góc
 * DƯỚI PHẢI khung nhìn, gõ lệnh → Enter, tay không rời chuột. Panel bên GIỮ NGUYÊN (đúng cho xem
 * lại/sửa sau) — cả hai cửa ghi qua MỘT logic `applyArrayGrid` (lib/render-studio/array-grid-ops).
 *
 * Bắt phím kiểu SketchUp: đang không focus ô nhập nào mà gõ chữ/số ⇒ ký tự rơi thẳng vào dòng
 * này (không phải click). An toàn với phím X/Y/Z khoá trục của viewer: các phím đó chỉ có tác
 * dụng KHI ĐANG KÉO (guard dragging trong Scene3DViewer) — đang kéo thì không ai gõ lệnh.
 * Lệnh hiểu được hôm nay: `array CxR [dx[,dy]]` (mm, mặc định 1200/900). Tên lệnh giữ EN (②).
 */
function QuickCommandBox({ scene }: { scene: Scene3DData }) {
  const tr = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState<{ text: string; err: boolean } | null>(null);
  const selectedName = useTree3DUi((s) => s.selectedName);
  const entityId = (() => {
    const g = scene.groups.find((gr) => gr.name === selectedName);
    return g?.entityId && g.heightMm ? g.entityId : null;
  })();

  useEffect(() => {
    // gõ phím khi không có ô nhập nào đang focus ⇒ dồn vào dòng lệnh (chuẩn SketchUp)
    function onKey(e: KeyboardEvent) {
      const ae = document.activeElement;
      const typingElsewhere = ae instanceof HTMLElement && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
      if (typingElsewhere || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length === 1 && /[\p{L}\p{N} x×@,./]/u.test(e.key)) {
        inputRef.current?.focus();
        setValue((v) => v + e.key);
        e.preventDefault();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const run = () => {
    const grid = parseArrayCommand(value);
    if (!grid) {
      setMsg({ text: tr('Chưa hiểu — thử: array 3x2 1200,900', 'Not recognized — try: array 3x2 1200,900'), err: true });
      return;
    }
    if (!entityId) {
      setMsg({ text: tr('Chưa chọn khối — bấm một khối trước.', 'No block selected — click a block first.'), err: true });
      return;
    }
    applyArrayGrid(entityId, grid);
    setMsg({ text: `Array ${grid.cols}×${grid.rows} — Ctrl+Z ${tr('để lùi', 'to undo')}`, err: false });
    setValue(''); // gõ lệnh mới là CHỈNH LẠI được (áp lại thay bậc cũ, đúng tinh thần VCB)
  };

  return (
    <div
      style={{
        position: 'absolute', right: 12, bottom: 40, zIndex: 6, width: 236,
        display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end',
      }}
    >
      {msg && (
        <div
          style={{
            padding: '2px 8px', borderRadius: 6, fontSize: 10.5, lineHeight: 1.5, maxWidth: 236,
            background: 'color-mix(in srgb, var(--panel) 96%, transparent)',
            border: `1px solid ${msg.err ? 'var(--danger, #e5484d)' : 'var(--border-strong)'}`,
            color: msg.err ? 'var(--danger, #e5484d)' : 'var(--t3)',
          }}
        >
          {msg.text}
        </div>
      )}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') run();
          if (e.key === 'Escape') { setValue(''); setMsg(null); inputRef.current?.blur(); }
          e.stopPropagation(); // không cho phím lệnh rơi xuống viewer (WASD/⇧/XYZ)
        }}
        placeholder={tr('Lệnh · array 3x2 1200,900', 'Command · array 3x2 1200,900')}
        aria-label={tr('Dòng nhập lệnh nhanh', 'Quick command input')}
        style={{
          width: 236, padding: '4px 8px', borderRadius: 6, fontSize: 11, lineHeight: 1.5,
          fontVariantNumeric: 'tabular-nums',
          background: 'color-mix(in srgb, var(--panel) 96%, transparent)',
          border: '1px solid var(--border-strong)', color: 'var(--t1)', outline: 'none',
        }}
      />
    </div>
  );
}
