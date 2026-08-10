'use client';

/**
 * components/render-studio/Render3DModeSkeleton.tsx — nội dung mode "Vẽ 3D" của chặng Render
 * (`docs/SPEC-MODE-PER-STAGE.md` §1). Đúng luật "mode = đổi CẢ shell": thay hẳn node canvas 2D
 * bằng khung nhìn 3D toàn màn.
 *
 * 🔴 DỰNG LẠI TRẢI NGHIỆM MỞ MÀN 04/08 (Hoà chê "rối rắm, không hệ thống"):
 *  1. SÂN KHẤU LUÔN HIỆN — `Viewport3D` (lưới sàn · chân trời · trục XYZ · ViewCube) render NGAY
 *     CẢ KHI 0 khối, thay cho câu chữ "chưa có bản vẽ" nhìn như màn hỏng. Chuẩn: mở Blender/
 *     SketchUp file trống vẫn thấy mình đang đứng trong không gian.
 *  2. Không còn ghi chú dev trên UI (B2-B4/"việc riêng") — chuyện nội bộ nằm ở comment code này.
 *  3. EMPTY STATE có 2 NÚT LÀM ĐƯỢC VIỆC TẠI CHỖ: đùn từ bản vẽ · dựng khối đầu tiên (mở tab Tạo
 *     + nháy nút Tường). Không đá người dùng sang chặng khác rồi bảo quay lại.
 *  4. TRÌNH TỰ 3 BƯỚC (dựng khối → gán vật liệu → đặt máy quay) mờ ở góc — xương sống của mode,
 *     tự đánh dấu theo dữ liệu THẬT trong Doc, ẩn được và nhớ lựa chọn.
 *
 * Nguồn dữ liệu vẫn là Doc chặng 1 (`docToObjScene`) — luật một nguồn, mode KHÔNG giữ bản 3D riêng.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Boxes, Check, Hammer, Sparkles, Sun, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useCadStore } from '@/lib/cad/store';
import { pickStage } from '@/lib/studio/stage-nav';
import { useStageTransition } from '@/components/studio/StageTransitionProvider';
import { useCad3DAutosave } from '@/lib/cad/cad3d-autosave';
import { useStageMode } from '@/lib/stage-mode';
import { useT } from '@/lib/i18n';
import { wallSegment, railingPosts } from '@/lib/cad/commands';
import { useScene3D } from '@/lib/render-studio/use-scene3d';
import { useTree3DUi } from '@/lib/render-studio/tree3d-ui';
import { Viewport3D, EMPTY_SCENE_3D } from '@/components/three/Viewport3D';
import ModeSwitchBar from '@/components/render-studio/ModeSwitchBar';
import Command3DPanel, { type Command3DTab } from '@/components/render-studio/Command3DPanel';
import ToolDock3D from '@/components/render-studio/ToolDock3D';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import PanelFlank from '@/components/ui/PanelFlank';
import { SECTION_LAYER_KEYS, type SectionAcceptPayload } from '@/components/render-studio/SectionExtractPanel';
import { SECTION_LAYERS } from '@/lib/three/section-entities';
import { useLevelUi, UNASSIGNED_LEVEL, ROOM_LIGHT_KINDS, ROOM_LIGHT_DEFAULT_Z_MM } from '@/components/render-studio/scene3d-ui';
import { addLevelToDoc, currentLighting, writeSun, writeRoomLights, patchRoomLight, newRoomLightId } from '@/components/render-studio/doc-catalog';
import { buildLightRig, type RoomLight } from '@/lib/three/lighting';

const GUIDE_HIDDEN_KEY = 'if.ve3d.guide_hidden_v1';
const GUIDE_POS_KEY = 'if.ve3d.guide_pos_v1';
const WELCOME_HIDDEN_KEY = 'if.ve3d.welcome_hidden_v1';

interface GuidePos {
  left: number;
  top: number;
}

/** Tường mẫu 4m khi bấm "Dựng khối đầu tiên" — dùng ĐÚNG hàm engine `wallSegment()` của chặng Vẽ
 * (không tự chế hình học), dày 220mm, đặt ở gốc toạ độ để camera đang khung sẵn nhìn thấy ngay. */
const FIRST_WALL = { from: { x: 0, y: 0 }, to: { x: 4000, y: 0 }, thicknessMm: 220 };

/** VIỆC 1 (nối `arrayLinear` thật) — lan can mẫu khi bấm nút "Lan can" (tầng ⑥
 * `Command3DPanel`): 9 cột 60×60mm cách 300mm dọc 1 đoạn 2,4m gần tường mẫu, dùng ĐÚNG hàm engine
 * `railingPosts()` (đùn từ `wallSegment()` + gắn bậc `arrayLinear`). */
const FIRST_RAILING = { from: { x: 0, y: 600 }, to: { x: 2400, y: 600 }, count: 9, spacingMm: 300, postMm: 60, heightMm: 900 };

export default function Render3DModeSkeleton() {
  // Sửa "mode 3D không autosave" (docs/TECH-DEBT.md) — nối lại autosave CAD sẵn có
  // (lib/sheets-persist.ts) vào Doc; mount/unmount đúng lúc mode 3D bật/tắt.
  useCad3DAutosave();
  const doc = useCadStore((s) => s.doc);
  // T4 (P14) — bắt điểm 3D dùng ĐÚNG SnapSettings + gridStep của chặng 2D (K1, một bộ công tắc
  // chung — bật/tắt Đầu mút/Giữa cạnh… ở 2D là 3D nghe theo). Không đẻ state snap thứ hai.
  const snapSettings = useCadStore((s) => s.snap);
  const gridStepMm = useCadStore((s) => s.gridStep);
  const { setMode } = useStageMode('render');
  const tr = useT();
  // M-EMPTY-2 — dây điều hướng cho lối "Vẽ mặt bằng trước" của card màn trống (xem veMatBangTruoc).
  const router = useRouter();
  const pathname = usePathname();
  const { begin } = useStageTransition();
  const [tab, setTab] = useState<Command3DTab>('vatlieu');
  const [nhayNutTuong, setNhayNutTuong] = useState(false);
  // VIỆC 2 (M-3D-OUT) — dock công cụ nổi đáy viewport, đúng mock "3D Dựng khối" trạng thái 03/04.
  const [dockOpen, setDockOpen] = useState(false);
  const [matDangCam, setMatDangCam] = useState<string | null>(null);
  // VIỆC "MỘT THƯ VIỆN" (`PHIEU-CODE-IF-DOT6`, 05/08) — cây đối tượng + panel thuộc tính dời sang
  // Navigator/Inspector (`Object3DTree.tsx`/`Object3DInspector.tsx`, ổ SIBLING của AppShell, xem
  // `HomeScreen.tsx`) — tên group ẩn/đang chọn nay sống ở store chia sẻ `useTree3DUi`, không phải
  // `useState` cục bộ (2 ổ kia không chung cây React cha gần để nhận props).
  const hiddenGroupNames = useTree3DUi((s) => s.hiddenNames);
  const selectedGroupName = useTree3DUi((s) => s.selectedName);
  const [guideHidden, setGuideHidden] = useState(false);
  // PHIẾU ĐỢT 7 A1 — bảng TRÌNH TỰ đóng đinh `left:12;bottom:156` đè lên vùng nhìn khối. Kéo được
  // (di chuyển tự do) + thu gọn còn 1 dòng khi bấm nhãn (KHÁC nút ✕ = ẩn hẳn, giữ nguyên bên dưới).
  const [guidePos, setGuidePos] = useState<GuidePos | null>(null);
  const [guideCollapsed, setGuideCollapsed] = useState(false);
  const [welcomeHidden, setWelcomeHidden] = useState(false);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const soKhoiRef = useRef(0);
  const guideRef = useRef<HTMLDivElement>(null);
  const viewportWrapRef = useRef<HTMLDivElement>(null);
  const guideDragRef = useRef<{ id: number; startX: number; startY: number; startLeft: number; startTop: number; moved: boolean } | null>(null);

  useEffect(() => {
    try {
      setGuideHidden(localStorage.getItem(GUIDE_HIDDEN_KEY) === '1');
      setWelcomeHidden(localStorage.getItem(WELCOME_HIDDEN_KEY) === '1');
      const savedPos = localStorage.getItem(GUIDE_POS_KEY);
      if (savedPos) {
        const parsed = JSON.parse(savedPos) as GuidePos;
        if (typeof parsed?.left === 'number' && typeof parsed?.top === 'number') setGuidePos(parsed);
      }
    } catch {
      /* localStorage bị chặn hoặc dữ liệu hỏng — cứ hiện ở vị trí mặc định, không phải lỗi chặn việc */
    }
  }, []);

  /** pointerdown trên thanh tiêu đề (bọc icon+nhãn, KHÔNG bọc nút ✕ — click ✕ vẫn chỉ ẩn hẳn,
   * không kéo/thu gọn theo). Kéo thật (> 3px) thì di chuyển bảng, kẹp trong lòng viewport; bấm
   * đứng yên (không kéo) thì đổi vai trò thành thu-gọn/mở-lại — cả 2 dùng CHUNG 3 pointer handler
   * để không phải phân biệt 2 bộ listener cho 2 trạng thái mở/gọn. */
  const onGuideHeaderPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const panel = guideRef.current;
    const wrap = viewportWrapRef.current;
    if (!panel || !wrap) return;
    const panelRect = panel.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    guideDragRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: panelRect.left - wrapRect.left,
      startTop: panelRect.top - wrapRect.top,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onGuideHeaderPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const ds = guideDragRef.current;
    const wrap = viewportWrapRef.current;
    const panel = guideRef.current;
    if (!ds || ds.id !== e.pointerId || !wrap || !panel) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) ds.moved = true;
    if (!ds.moved) return;
    const wrapRect = wrap.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const left = Math.max(0, Math.min(ds.startLeft + dx, wrapRect.width - panelRect.width));
    const top = Math.max(0, Math.min(ds.startTop + dy, wrapRect.height - panelRect.height));
    setGuidePos({ left, top });
  }, []);

  const onGuideHeaderPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const ds = guideDragRef.current;
    if (!ds || ds.id !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    guideDragRef.current = null;
    if (ds.moved) {
      setGuidePos((pos) => {
        if (pos) {
          try {
            localStorage.setItem(GUIDE_POS_KEY, JSON.stringify(pos));
          } catch {
            /* không lưu được thì phiên sau về vị trí mặc định — không chặn việc */
          }
        }
        return pos;
      });
    } else {
      setGuideCollapsed((c) => !c);
    }
  }, []);

  /** Đóng card chào + NHỚ lựa chọn. Gọi được từ 4 đường: nút ✕, Esc, bấm ra ngoài card, và
   * (gián tiếp) khi dựng xong khối đầu tiên — lúc đó card tự biến mất vì `soKhoi > 0`. */
  const dongCardChao = useCallback(() => {
    setWelcomeHidden(true);
    try {
      localStorage.setItem(WELCOME_HIDDEN_KEY, '1');
    } catch {
      /* không lưu được thì phiên sau hiện lại — không chặn việc */
    }
  }, []);

  const moLaiCardChao = useCallback(() => {
    setWelcomeHidden(false);
    try {
      localStorage.removeItem(WELCOME_HIDDEN_KEY);
    } catch {
      /* bỏ qua */
    }
  }, []);

  // Esc đóng card chào (đường thoát #2). Chỉ gắn khi card đang hiện — không để listener rác.
  useEffect(() => {
    if (welcomeHidden || soKhoiRef.current > 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dongCardChao();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [welcomeHidden, dongCardChao]);

  // Bấm RA NGOÀI card thì đóng (đường thoát #3) — pha BẮT, cùng họ sự kiện `pointerdown` mà
  // `lib/useDismissable` dùng cho mọi lớp nổi của app (00-CHOT "hạ tầng đóng lớp").
  useEffect(() => {
    if (welcomeHidden) return;
    const onDown = (e: PointerEvent) => {
      const card = welcomeRef.current;
      if (card && !card.contains(e.target as Node)) dongCardChao();
    };
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, [welcomeHidden, dongCardChao]);

  const scene = useScene3D();

  /* ── VIỆC 3 + VIỆC 4 (§0c mảng 1 & 3): cử chỉ BA NGÓN xoay mặt trời + phím tắt của mode ── */
  const hiddenLevels = useLevelUi((s) => s.hiddenLevels);
  // Đèn đọc THẲNG từ Doc qua `buildLightRig()` của PHU — không có bản sao nào trong component này
  // (K1 một nguồn). `rig` cho toạ độ tuyệt đối + màu Kelvin đã quy đổi, dùng luôn cho dấu đèn 3D.
  const rig = buildLightRig(doc);
  /** HUD góc nắng chỉ hiện TRONG LÚC đang xoay — không đắp thêm tấm thông tin thường trực lên
   * canvas WebGL (G9: quá 4 tấm backdrop là giật; HUD này không dùng backdrop-filter). */
  const [sunScrubbing, setSunScrubbing] = useState(false);
  const sunGestureRef = useRef<{ startX: number; startAzimuth: number; width: number } | null>(null);

  const lightMarkers = rig.rooms.map((r) => ({ id: r.id, posCadMm: r.posCadMm, colorHex: r.colorHex }));

  /** Nhả tay sau khi kéo dấu đèn trong khung nhìn: viewer trả về toạ độ TUYỆT ĐỐI, còn
   * `RoomLight.posMm.z` là cao độ TƯƠNG ĐỐI khi đèn gắn tầng (hợp đồng `lighting.ts:74`) ⇒ phải
   * TRỪ LẠI cao độ tầng trước khi ghi, không thì mỗi lần kéo là đèn tự leo thêm một tầng. */
  const handleLightMove = useCallback((id: string, posCadMm: { x: number; y: number; z: number }) => {
    const resolved = buildLightRig(useCadStore.getState().doc).rooms.find((r) => r.id === id);
    const dz = resolved?.levelElevationMm ?? 0;
    patchRoomLight(id, { posMm: { x: posCadMm.x, y: posCadMm.y, z: posCadMm.z - dz } });
  }, []);

  const addRoomLight = useCallback(() => {
    const lighting = currentLighting();
    const def = ROOM_LIGHT_KINDS[0];
    const b = useCadStore.getState().doc.entities.length ? scene?.bboxMm : undefined;
    const light: RoomLight = {
      id: newRoomLightId(lighting.rooms),
      kind: def.id,
      posMm: {
        x: b ? Math.round((b.minX + b.maxX) / 2) : 0,
        y: b ? Math.round((b.minY + b.maxY) / 2) : 0,
        z: ROOM_LIGHT_DEFAULT_Z_MM[def.id],
      },
      lumens: def.lumens,
      colorK: def.colorK,
    };
    writeRoomLights([...lighting.rooms, light]);
  }, [scene]);

  /**
   * BA NGÓN kéo ngang = XOAY MẶT TRỜI sống (phiếu VIỆC 3.e, tham chiếu Nomad Sculpt: cử chỉ nhiều
   * ngón đổi tham số môi trường mà không rời tay khỏi khung nhìn).
   * ⚠️ `docs/NC-14-CAM-UNG.md` §3⑧ mà phiếu trỏ tới **KHÔNG CÓ NỘI DUNG** — file 6 dòng, ghi
   * "CHỜ HOÀ DÁN NỘI DUNG". Làm theo mô tả trong phiếu, không theo NC-14 (N5, không giả vờ đã đọc).
   * An toàn với orbit: `OrbitControls` chỉ khai `touches.ONE`/`touches.TWO`, chạm 3 ngón nó về
   * trạng thái NONE ⇒ không tranh chấp. Kéo hết bề ngang ≈ 360° — một vòng nắng trong một nhịp tay.
   */
  const onViewportTouchStart = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 3) return;
    const rect = e.currentTarget.getBoundingClientRect();
    sunGestureRef.current = {
      startX: e.touches[0].clientX,
      startAzimuth: currentLighting().sun.azimuthDeg,
      width: rect.width || 1,
    };
    setSunScrubbing(true);
  }, []);

  const onViewportTouchMove = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    const g = sunGestureRef.current;
    if (!g || e.touches.length !== 3) return;
    const delta = ((e.touches[0].clientX - g.startX) / g.width) * 360;
    writeSun({ azimuthDeg: (((g.startAzimuth + delta) % 360) + 360) % 360 });
  }, []);

  const onViewportTouchEnd = useCallback(() => {
    if (!sunGestureRef.current) return;
    sunGestureRef.current = null;
    setSunScrubbing(false);
  }, []);

  /**
   * VIỆC 4 · §0c MẢNG 1 — PHÍM TẮT CỦA MODE 3D, đăng ký ngay tại đây (mount/unmount cùng mode nên
   * không rò ra chặng khác):
   *   1…5      đổi tab bảng lệnh (Tạo · Sửa · Vật liệu · Camera · Đèn)
   *   [ / ]    xoay mặt trời ∓5° — giữ Shift = 15° (quen tay Photoshop: ngoặc = chỉnh một tham
   *            số đang cầm, không cần rời chuột khỏi khung nhìn)
   *   Shift+N  thả một đèn phòng vào giữa cảnh
   *   Shift+T  thêm một tầng
   *
   * ⚠️ CHƯA vào `lib/shortcuts.ts` (bảng ⌘? ) và `lib/commands/registry.ts` (⌘K + lệnh gõ) — hai
   * file đó thuộc vùng cấm của phiên này; danh sách chính xác cần thêm nằm trong báo cáo phiên.
   * Nên §0c mảng 1 mới đạt phần "bấm được + có tooltip ghi phím", CHƯA đạt phần "⌘K tìm ra lệnh".
   *
   * Bỏ qua khi con trỏ đang ở ô nhập (bảng đèn/tầng đầy input số) — không thì gõ "5" vào ô cao độ
   * lại nhảy tab.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      if (el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;

      const stepDeg = e.shiftKey ? 15 : 5;
      if (e.key === '[' || e.key === ']') {
        const dir = e.key === ']' ? 1 : -1;
        const cur = currentLighting().sun.azimuthDeg;
        writeSun({ azimuthDeg: (((cur + dir * stepDeg) % 360) + 360) % 360 });
        e.preventDefault();
        return;
      }
      if (e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        addRoomLight();
        setTab('den');
        e.preventDefault();
        return;
      }
      if (e.shiftKey && (e.key === 'T' || e.key === 't')) {
        addLevelToDoc('Tầng mới');
        e.preventDefault();
        return;
      }
      const TAB_BY_KEY: Record<string, Command3DTab> = { '1': 'tao', '2': 'sua', '3': 'vatlieu', '4': 'camera', '5': 'den' };
      const next = TAB_BY_KEY[e.key];
      if (next) {
        setTab(next);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addRoomLight]);

  /**
   * VIỆC 4 (M-3D-OUT, G-M2-05) — ⌘Z/⌘⇧Z chặng 3D trước đây KHÔNG BẮT ĐƯỢC PHÍM GÌ (im lặng, đo
   * 2 lần theo GAP-IF.md). Doc là MỘT nguồn chung 2D/3D (K1) — `useCadStore.undo()/redo()` đã
   * hoạt động đúng trên đúng entity 3D dựng ra (push wall/railing mẫu đều qua `addEntities` đẩy
   * `past`), thiếu duy nhất là KHÔNG CÓ listener nào gọi nó trong mode này (khác `CadCanvas.tsx`
   * đã bắt phím này cho chặng 2D). Bù listener riêng (giữ tách khỏi effect trên — effect trên cố
   * ý bỏ qua mọi phím có metaKey/ctrlKey). Có báo trạng thái khi KHÔNG còn gì để hoàn tác/làm lại
   * — đúng luật "im lặng là lỗi", không để ⌘Z bấm xong không biết có tác dụng hay không.
   */
  useEffect(() => {
    const onUndoKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const el = e.target;
      if (el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      const k = e.key.toLowerCase();
      if (k !== 'z' && k !== 'y') return;
      e.preventDefault();
      const store = useCadStore.getState();
      if (k === 'y' || (k === 'z' && e.shiftKey)) {
        if (store.future.length === 0) { store.setStatus(tr('Không còn gì để làm lại.', 'Nothing to redo.')); return; }
        store.redo();
      } else {
        if (store.past.length === 0) { store.setStatus(tr('Không còn gì để hoàn tác.', 'Nothing to undo.')); return; }
        store.undo();
      }
    };
    window.addEventListener('keydown', onUndoKey);
    return () => window.removeEventListener('keydown', onUndoKey);
  }, [tr]);

  const soKhoi = scene?.groups.length ?? 0;
  soKhoiRef.current = soKhoi;
  const coBanVe = doc.entities.length > 0;

  // Lọc THẬT khỏi cảnh đưa vào Viewport3D theo tên group đang ẩn (state chia sẻ `useTree3DUi`,
  // xem trên) — không phải cờ trang trí. Không dùng useMemo riêng vì `hiddenGroupNames` đổi ít
  // (bấm tay), phép lọc rẻ, tính lại mỗi render cũng không đáng lo.
  // VIỆC 1 — cộng thêm bộ lọc THEO TẦNG (`useLevelUi`, bật từ nút mắt trên dòng tiêu đề tầng ở
  // `Object3DTree`). Hai bộ lọc ĐỘC LẬP và cùng chiều "ẩn": ẩn cả tầng không xoá dấu ẩn riêng của
  // từng khối, bật lại tầng thì khối nào đang ẩn riêng vẫn ẩn (đúng cách Revit/AutoCAD hành xử).
  const visibleScene = !scene || (hiddenGroupNames.size === 0 && hiddenLevels.size === 0)
    ? scene
    : {
        ...scene,
        groups: scene.groups.filter(
          (g) => !hiddenGroupNames.has(g.name) && !hiddenLevels.has(g.storey ?? UNASSIGNED_LEVEL),
        ),
      };

  // Chỉ group có entityId (hôm nay = tường, xem cảnh báo `cad-to-obj.ts`) mới đẩy tiếp thành
  // Viewport3D.selectedId — group khác chọn được để XEM thuộc tính (ở Object3DInspector) nhưng
  // chưa có gizmo thật.
  const selectedGroup = scene?.groups.find((g) => g.name === selectedGroupName) ?? null;
  const viewportSelectedId = selectedGroup?.entityId ?? null;

  // Doc CAD chưa có field vật liệu (grep matId trong lib/cad = 0) ⇒ tín hiệu khả dụng duy nhất
  // hôm nay là "người dùng đã chọn vật liệu trong panel". Khi gán-lên-mặt (raycast) xong thì đổi
  // tín hiệu này sang dữ liệu Doc, đừng để nó mãi là state phiên.
  const daGanVatLieu = matDangCam !== null;
  const daDatMayQuay = doc.entities.some((e) => e.layer === 'IF_CAMPATH' || Boolean(e.campath));

  // `updateEntities`/`addEntities` tạo Doc MỚI trong store → `doc` đổi reference → `scene` tự tính
  // lại → viewer dựng lại. Không ép remount tay (luật một nguồn).
  function handlePushPull(entityId: string, newHeightMm: number) {
    const store = useCadStore.getState();
    const entity = store.doc.entities.find((e) => e.id === entityId);
    if (!entity) return;
    store.updateEntities([{ ...entity, heightMm: newHeightMm }]);
  }

  /** Đùn từ bản vẽ: cảnh 3D vốn tự suy từ Doc, nên việc thật ở đây là ĐẶT CAO ĐỘ cho các nét
   * tường chưa có `heightMm` — đúng nghĩa "đùn", và ghi thẳng vào Doc (một nguồn). */
  function dunTuBanVe() {
    const store = useCadStore.getState();
    const canDun = store.doc.entities.filter((e) => e.heightMm === undefined && (e.type === 'hatch' || e.type === 'polyline'));
    if (!canDun.length) return;
    store.updateEntities(canDun.map((e) => ({ ...e, heightMm: 2700 })));
  }

  /** Dựng khối tại chỗ: mở tab Tạo + nháy nút Tường (SPEC-NGON-NGU: chỉ đúng MỘT việc kế tiếp).
   * M-EMPTY-2: nút "Dựng khối đầu tiên" trên card chào đã rời theo mock [BẢN CHỐT] (2 lối), nhưng
   * cơ chế nháy-nút-Tường GIỮ NGUYÊN — vẫn là đường tại chỗ khi người dùng tự mở tab Tạo (X2). */
  function dungKhoiTaiCho() {
    setTab('tao');
    setNhayNutTuong(true);
  }
  void dungKhoiTaiCho; // giữ hàm cho đường quay lại; tránh cảnh báo unused khi lint bật

  /** M-EMPTY-2 (07/08, mock [BẢN CHỐT] màn 1c) — lối thoát "Vẽ mặt bằng trước": mở chặng Thiết
   * kế 2D bằng ĐÚNG đường StageSwitcher đang đi (`pickStage`, lib/studio/stage-nav — origin
   * 'render' → begin('concept') + push href cad), không chế đường điều hướng thứ hai. */
  function veMatBangTruoc() {
    pickStage('concept', { active: 'render', pathname, router, begin });
  }

  function taoTuongMau() {
    useCadStore.getState().addEntities(
      wallSegment(FIRST_WALL.from, FIRST_WALL.to, FIRST_WALL.thicknessMm, useCadStore.getState().currentLayer),
    );
    setNhayNutTuong(false);
  }

  function taoLanCanMau() {
    useCadStore.getState().addEntities(
      railingPosts(
        FIRST_RAILING.from,
        FIRST_RAILING.to,
        FIRST_RAILING.count,
        FIRST_RAILING.spacingMm,
        FIRST_RAILING.postMm,
        FIRST_RAILING.heightMm,
        useCadStore.getState().currentLayer,
      ),
    );
  }

  function anTrinhTu() {
    setGuideHidden(true);
    try {
      localStorage.setItem(GUIDE_HIDDEN_KEY, '1');
    } catch {
      /* không lưu được thì thôi, phiên sau hiện lại — không chặn việc */
    }
  }

  const buoc = [
    { xong: soKhoi > 0, chu: 'Dựng khối' },
    { xong: daGanVatLieu, chu: 'Gán vật liệu' },
    { xong: daDatMayQuay, chu: 'Đặt máy quay' },
  ];

  /**
   * VIỆC 2 (S2 BUILD#1) — NGƯỜI DÙNG ĐÃ DUYỆT ở màn xem trước ⇒ giờ mới ghi vào `Doc`.
   * Đây là điểm ghi DUY NHẤT của luồng cắt lớp; panel chỉ tính rồi hỏi (xem docstring
   * `SectionExtractPanel`). K1 — ghi vào CHÍNH `Doc` đang mở, không có kho 3D riêng để đồng bộ.
   *
   * Layer: dùng `ensureLayerByName` SẴN CÓ của store (không đẻ cơ chế layer thứ hai). Tên do người
   * dùng gõ ở panel ⇒ ánh xạ khoá kỹ thuật `S-CUT`/`S-VIEW`/`S-FAR` → id layer thật. Trùng tên với
   * layer đang có thì DÙNG LẠI layer đó, không tạo bản sao.
   */
  const nhanMatCat = useCallback((p: SectionAcceptPayload) => {
    const store = useCadStore.getState();
    const idTheoKhoa: Record<string, string> = {};
    // CHỈ tạo layer cho nhóm THỰC SỰ có nét được nhận — người dùng bỏ tick "nét xa", hoặc mặt cắt
    // không có nét xa nào, thì đừng đẻ ra 1 layer rỗng nằm chật panel Lớp.
    const dungKhoa = new Set(p.entities.map((e) => e.layer));
    ([['cut', 0], ['view', 1], ['far', 2]] as const).forEach(([k, i]) => {
      if (!dungKhoa.has(SECTION_LAYER_KEYS[k])) return;
      const ten = p.layerNames[k].trim() || SECTION_LAYERS[i].name;
      const id = store.ensureLayerByName(ten, SECTION_LAYERS[i].color, SECTION_LAYERS[i].lineType);
      // bề dày nét không nằm trong chữ ký `ensureLayerByName` — vá ngay sau, chỉ khi lệch.
      const dang = useCadStore.getState().doc.layers.find((l) => l.id === id);
      if (dang && dang.lineweight !== SECTION_LAYERS[i].lineweight) {
        useCadStore.getState().updateLayer(id, { lineweight: SECTION_LAYERS[i].lineweight });
      }
      idTheoKhoa[SECTION_LAYER_KEYS[k]] = id;
    });
    useCadStore.getState().addEntities(
      p.entities.map((e) => ({ ...e, layer: idTheoKhoa[e.layer] ?? e.layer })),
    );
    useCadStore.getState().setStatus(
      tr(
        `${p.label} — đã nhận ${p.entities.length} nét vào bản vẽ. Mở chặng Thiết kế 2D để xem.`,
        `${p.label} — ${p.entities.length} lines added to the drawing. Open the 2D Design stage to see them.`,
      ),
    );
  }, [tr]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', minHeight: 0, background: 'var(--bg)' }}>
      {/* p3 (07/08) — tay cầm thu/mở dùng chung PanelFlank (Hoà chốt nhân bản mẫu Trình chiếu).
          Bảng lệnh 256px là panel bên duy nhất của mode 3D chưa thu được (đo 2/18 render-studio). */}
      <PanelFlank side="left" storageKey="render3d.command-panel" label={tr('bảng lệnh 3D', '3D command panel')}>
        <Command3DPanel
          tab={tab}
          onTabChange={setTab}
          nhayNutTuong={nhayNutTuong}
          onTaoTuong={taoTuongMau}
          onTaoLanCan={taoLanCanMau}
          onPickMaterial={setMatDangCam}
          scene={scene}
          onNhanMatCat={nhanMatCat}
        />
      </PanelFlank>

      <div
        ref={viewportWrapRef}
        style={{ position: 'relative', flex: 1, minWidth: 0, height: '100%' }}
        /* VIỆC 3.d — cử chỉ 3 ngón quét giờ nắng. Bắt ở đây (bọc NGOÀI canvas) chứ không bên
           trong `Scene3DViewer`: file đó thuộc hạ tầng 3D dùng chung cho 4 nơi tiêu thụ, nhét cử
           chỉ riêng của mode Vẽ 3D vào là bắt cả chỗ chụp ảnh/công trường chịu theo. */
        onTouchStart={onViewportTouchStart}
        onTouchMove={onViewportTouchMove}
        onTouchEnd={onViewportTouchEnd}
        onTouchCancel={onViewportTouchEnd}
      >
        <Viewport3D
          scene={visibleScene ?? EMPTY_SCENE_3D}
          selectedId={viewportSelectedId}
          mode="massing"
          onPushPull={handlePushPull}
          lightMarkers={lightMarkers}
          onLightMove={handleLightMove}
          lightingPreview={rig}
          ground
          snap3d={{ settings: snapSettings, gridStepMm }}
          label={soKhoi > 0 ? 'Khối xám · chưa vật liệu' : 'Không gian trống'}
        >
          {/* HUD giờ nắng — CHỈ hiện trong lúc 3 ngón đang quét (VIỆC 3.d). Nền đặc, không
              backdrop-filter (G9: trần 4 tấm kính trên WebGL đã dùng hết cho toolbelt/nút Dựng
              ảnh/ViewCube/Lightbox). */}
          {sunScrubbing && (
            <div
              style={{
                position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 7,
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999,
                background: 'var(--panel)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-pop)',
                pointerEvents: 'none',
              }}
            >
              <Sun size={15} color={rig.sun.belowHorizon ? 'var(--t4)' : rig.sun.colorHex} />
              <span style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 600, color: 'var(--t1)', fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(currentLighting().sun.azimuthDeg)}° · {Math.round(currentLighting().sun.altitudeDeg)}°
              </span>
            </div>
          )}

          {soKhoi === 0 && !welcomeHidden && (
            <div
              // pointer-events:none ⇒ overlay KHÔNG chặn orbit/pan; chỉ CARD bắt chuột (đường
              // thoát #4). Bấm ra ngoài card đóng được nhờ listener pointerdown ở dưới, không
              // phải nhờ overlay hứng sự kiện.
              style={{
                position: 'absolute', inset: 0, zIndex: 6, display: 'grid', placeItems: 'center',
                pointerEvents: 'none', padding: 24,
              }}
            >
              <div
                ref={welcomeRef}
                style={{
                  position: 'relative', pointerEvents: 'auto', textAlign: 'center', maxWidth: 360, padding: '18px 20px 20px',
                  borderRadius: 'var(--radius-lg)', border: '1px solid var(--mat-hairline)',
                  background: 'color-mix(in srgb, var(--panel) 88%, transparent)',
                  backdropFilter: 'blur(var(--blur))', WebkitBackdropFilter: 'blur(var(--blur))',
                  boxShadow: 'var(--shadow-pop)',
                }}
              >
                <button
                  type="button"
                  onClick={dongCardChao}
                  title="Đóng"
                  aria-label="Đóng"
                  style={{
                    position: 'absolute', top: 8, right: 8, width: 24, height: 24, display: 'grid',
                    placeItems: 'center', border: 0, background: 'none', color: 'var(--t4)',
                    borderRadius: 7, cursor: 'pointer',
                  }}
                >
                  <X size={13} />
                </button>
                {/* M-EMPTY-2 (07/08) — chữ + 2 lối theo mock [BẢN CHỐT] `Bốn trạng thái rỗng.dc.html`
                    màn 1c: "Dựng khối từ mặt bằng 2D" KHOÁ KÈM LÝ DO NHÌN THẤY khi chưa có bản vẽ
                    (không chỉ title-hover như bản cũ) · "Vẽ mặt bằng trước" mở chặng 2D qua pickStage.
                    Nút "Dựng khối đầu tiên" cũ rời card nhưng ĐƯỜNG TẠI CHỖ vẫn còn (Command panel
                    Tạo → Tường) — X2 thoả ở mức màn, ghi nhận trong M-EMPTY-2-OUT. */}
                <p style={{ margin: 0, fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)', lineHeight: 1.5 }}>
                  {tr('Không gian dựng khối', '3D modelling space')}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: 10.5, color: 'var(--t4)', lineHeight: 1.5 }}>
                  {tr('3D modelling space', 'Không gian dựng khối')}
                </p>
                <p style={{ margin: '6px 0 14px', fontSize: 'var(--fs-2xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
                  {tr(
                    'Mặt bằng hai chiều nâng thẳng lên thành tường, sàn và trần. Nét vẽ tới đâu, khối dựng tới đó.',
                    'Walls, floors and ceilings rise straight from the 2D plan.',
                  )}
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <button
                      type="button"
                      onClick={dunTuBanVe}
                      disabled={!coBanVe}
                      style={
                        coBanVe
                          ? {
                              height: 32, padding: '0 14px', borderRadius: 999, cursor: 'pointer', border: 0,
                              background: 'var(--accent)', color: '#fff', fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)',
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                            }
                          : {
                              height: 32, padding: '0 14px', borderRadius: 999, cursor: 'not-allowed',
                              border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t4)',
                              fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)',
                            }
                      }
                    >
                      {coBanVe && <Hammer size={13} strokeWidth={1.9} />}
                      {tr('Dựng khối từ mặt bằng 2D', 'Build from 2D plan')}
                    </button>
                    {!coBanVe && (
                      <span style={{ fontSize: 10.5, lineHeight: 1.6, color: 'var(--warning)' }}>
                        {tr('Cần ít nhất một mặt bằng ở chặng Thiết kế 2D', 'Needs at least one plan in the 2D stage')}
                      </span>
                    )}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <button
                      type="button"
                      onClick={veMatBangTruoc}
                      style={
                        coBanVe
                          ? {
                              height: 32, padding: '0 14px', borderRadius: 999, cursor: 'pointer',
                              border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)',
                              fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)',
                            }
                          : {
                              height: 32, padding: '0 14px', borderRadius: 999, cursor: 'pointer', border: 0,
                              background: 'var(--accent)', color: '#fff', fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)',
                            }
                      }
                    >
                      {tr('Vẽ mặt bằng trước', 'Draw a plan first')}
                    </button>
                    <span style={{ fontSize: 10.5, lineHeight: 1.6, color: 'var(--t4)' }}>
                      {tr('Mở chặng Thiết kế 2D', 'Opens the 2D stage')}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Nút gọi lại card chào sau khi đã đóng (đường thoát #3 nói "nhớ", nên phải có lối
              quay lại — SPEC-NGON-NGU: đóng thứ gì cũng phải mở lại được). */}
          {soKhoi === 0 && welcomeHidden && (
            <button
              type="button"
              onClick={moLaiCardChao}
              title="Hiện lại gợi ý bắt đầu"
              aria-label="Hiện lại gợi ý bắt đầu"
              style={{
                position: 'absolute', right: 14, bottom: 74, zIndex: 6, width: 26, height: 26,
                borderRadius: 999, border: '1px solid var(--mat-hairline)',
                background: 'color-mix(in srgb, var(--panel) 82%, transparent)',
                backdropFilter: 'blur(var(--blur))', WebkitBackdropFilter: 'blur(var(--blur))',
                color: 'var(--t3)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ?
            </button>
          )}

          {/* ── TRÌNH TỰ 3 BƯỚC — xương sống của mode, kéo thả tự do (mặc định góc dưới trái) ── */}
          {!guideHidden && (
            <div
              ref={guideRef}
              className="vitals-pop"
              style={{
                position: 'absolute', zIndex: 6,
                ...(guidePos
                  ? { left: guidePos.left, top: guidePos.top }
                  // bottom 156 = 54 (chỗ trục XYZ đứng) + 90 (chiều cao trục) + 12 thở — mặc định
                  // TRƯỚC khi kéo lần nào; sau khi kéo thì luôn dùng toạ độ đã lưu (left/top).
                  : { left: 12, bottom: 156 }),
                padding: guideCollapsed ? '6px 11px' : '9px 10px 9px 11px',
                display: 'flex', flexDirection: 'column', gap: guideCollapsed ? 0 : 5,
                minWidth: guideCollapsed ? 0 : 156,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  onPointerDown={onGuideHeaderPointerDown}
                  onPointerMove={onGuideHeaderPointerMove}
                  onPointerUp={onGuideHeaderPointerUp}
                  onPointerCancel={onGuideHeaderPointerUp}
                  title={guideCollapsed ? 'Kéo để di chuyển · bấm để mở lại' : 'Kéo để di chuyển · bấm để thu gọn'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0,
                    cursor: 'grab', touchAction: 'none', userSelect: 'none',
                  }}
                >
                  <Boxes size={12} color="var(--t4)" style={{ flexShrink: 0 }} />
                  {guideCollapsed ? (
                    <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                      ✓{buoc.filter((b) => b.xong).length}/3 · Trình tự
                    </span>
                  ) : (
                    <span style={{ fontSize: 'var(--fs-3xs, 10px)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t4)', fontWeight: 700 }}>
                      Trình tự
                    </span>
                  )}
                </div>
                {!guideCollapsed && (
                  <button
                    type="button"
                    onClick={anTrinhTu}
                    title="Ẩn trình tự"
                    aria-label="Ẩn trình tự"
                    style={{
                      marginLeft: 'auto', width: 18, height: 18, display: 'grid', placeItems: 'center', border: 0,
                      background: 'none', color: 'var(--t4)', cursor: 'pointer', borderRadius: 5, flexShrink: 0,
                    }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
              {!guideCollapsed && buoc.map((b, i) => (
                <div key={b.chu} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span
                    style={{
                      width: 15, height: 15, flexShrink: 0, borderRadius: 999, display: 'grid', placeItems: 'center',
                      fontSize: 9, fontWeight: 700,
                      background: b.xong ? 'var(--accent)' : 'var(--field)',
                      color: b.xong ? '#fff' : 'var(--t4)',
                      border: b.xong ? '1px solid var(--accent)' : '1px solid var(--border)',
                    }}
                  >
                    {b.xong ? <Check size={9} strokeWidth={3} /> : i + 1}
                  </span>
                  <span style={{ fontSize: 'var(--fs-2xs)', color: b.xong ? 'var(--t3)' : 'var(--t2)', textDecoration: b.xong ? 'line-through' : 'none' }}>
                    {b.chu}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Viewport3D>

        {/* 08/08 — Hoà chốt trực tiếp: nút này TRÙNG HỆT công tắc "Vẽ 3D" tắt (cả hai chỉ gọi
            `setMode('render')`, cùng về Bảng dựng) — gốc là vì việc dựng-sẵn-chuỗi node ở VIỆC 2
            cũ (SPEC-DUNG-3D-THONG-NHAT §7.2) CHƯA BAO GIỜ làm, nút rơi lại đúng hành vi trùng.
            ĐỔI VAI: đây là chỗ đứng cho "Dựng khối · Magic" (docs/SPEC-MAGIC-DUNG-KHOI-3D.md,
            ĐƯỜNG B đã chốt hướng 00-CHOT.md PHẦN 6§②) — mô tả tự nhiên → bộ THAM SỐ thấy được,
            sửa được → lệnh dựng hình TẤT ĐỊNH (build-ops.ts, vừa mở khoá 08/08) chạy ra khối/mesh
            CHI TIẾT (một vật thể). Phân vai với công tắc "Vẽ 3D": công tắc = TỔNG THỂ (đổi cả
            khung nhìn Node↔3D); nút này = CHI TIẾT (sinh một khối trong khung nhìn đang có).
            CHƯA NỐI ENGINE THẬT — luật CLAUDE.md #2 "không có spec thì không code": spec vừa
            soạn, chưa duyệt. Disabled + lý do thay vì bịa hành vi (§9, cấm nút giả). */}
        <button
          type="button"
          disabled
          /* P5 (04/08): kính lỏng `.glass-float--bar` — 1 trong ĐÚNG 4 chỗ được phép (nút này),
             luật ở globals.css. Giữ dù disabled — đây là chỗ đứng cố định cho Magic, không phải
             xoá khỏi giao diện (§9 "cấm xoá ô trống cho gọn mắt"). */
          className="glass-float glass-float--bar"
          title={tr(
            'Dựng khối Magic — mô tả bằng lời → bộ tham số thấy được, sửa được → khối dựng đúng số. Đang soạn spec (docs/SPEC-MAGIC-DUNG-KHOI-3D.md), chưa nối.',
            'Magic build — describe in words → a visible, editable parameter set → block built to exact numbers. Spec being drafted, not wired yet.',
          )}
          /* ⑥ p14 (Hoà 08/08, đo DOM 1440×900): bottom:76 đặt nút HÀNH ĐỘNG này ĐÈ lên nút "Thêm"
             của dock công cụ (dock 1240–1313 · nút này x=1300, cùng hàng y≈754) — hành động và
             cần-số/công cụ dính một cụm. Nâng lên bottom:132: một mình góc phải (nổi bật giữ
             nguyên), cụm dock + công tắc chế độ (ModeSwitchBar) ở dưới tách hẳn. */
          style={{
            position: 'absolute', right: 18, bottom: 132, zIndex: 6,
            height: 38, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 9,
            color: 'var(--t3)', fontSize: 13, fontWeight: 600, cursor: 'not-allowed', opacity: 0.55,
          }}
        >
          <Sparkles size={16} strokeWidth={2} color="var(--t3)" />
          {tr('Dựng khối · Magic', 'Magic build')}
        </button>

        <ToolDock3D
          open={dockOpen}
          onToggleOpen={() => setDockOpen((o) => !o)}
          onOpenLibrary={() => openLibrarySheet({ stage: 'render' })}
          onOpenMaterialTab={() => setTab('vatlieu')}
        />

        <ModeSwitchBar />
      </div>
    </div>
  );
}
