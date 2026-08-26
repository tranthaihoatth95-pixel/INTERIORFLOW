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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TouchEvent as ReactTouchEvent } from 'react';
import { Hammer, Sun, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useCadStore } from '@/lib/cad/store';
import { pickStage } from '@/lib/studio/stage-nav';
import { useStageTransition } from '@/components/studio/StageTransitionProvider';
import { useCad3DAutosave } from '@/lib/cad/cad3d-autosave';
import { useStageMode } from '@/lib/stage-mode';
import { useT } from '@/lib/i18n';
import { wallSegmentOutline, railingPosts } from '@/lib/cad/commands';
import { translateEntity } from '@/lib/cad/geometry';
import { useScene3D } from '@/lib/render-studio/use-scene3d';
import { useTree3DUi } from '@/lib/render-studio/tree3d-ui';
import { useTool3D, rotateSelectionUpdates } from '@/lib/render-studio/tool3d';
import { Viewport3D, EMPTY_SCENE_3D } from '@/components/three/Viewport3D';
import ModeSwitchBar from '@/components/render-studio/ModeSwitchBar';
import Command3DPanel, { type Command3DTab, type WallDraft3D } from '@/components/render-studio/Command3DPanel';
import ToolDock3D from '@/components/render-studio/ToolDock3D';
import Tool3DBar from '@/components/render-studio/Tool3DBar';
import StageToolbelt from '@/components/ui/StageToolbelt';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import PanelFlank from '@/components/ui/PanelFlank';
import KetXuatPanel from '@/components/render-studio/KetXuatPanel';
import type { Scene3DCameraApi } from '@/components/three/Scene3DViewer';
import { SECTION_LAYER_KEYS, type SectionAcceptPayload } from '@/components/render-studio/SectionExtractPanel';
import { SECTION_LAYERS } from '@/lib/three/section-entities';
import { useLevelUi, UNASSIGNED_LEVEL, ROOM_LIGHT_KINDS, ROOM_LIGHT_DEFAULT_Z_MM } from '@/components/render-studio/scene3d-ui';
import { addLevelToDoc, currentLighting, writeSun, writeRoomLights, patchRoomLight, newRoomLightId } from '@/components/render-studio/doc-catalog';
import { buildLightRig, type RoomLight } from '@/lib/three/lighting';

const WELCOME_HIDDEN_KEY = 'if.ve3d.welcome_hidden_v1';

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
  // Mở bằng nhóm Tạo: một cảnh trống cần cho thấy cách bắt đầu dựng, không phải kệ vật liệu.
  const [tab, setTab] = useState<Command3DTab>('tao');
  const [nhayNutTuong, setNhayNutTuong] = useState(false);
  const [openWallBuilderNonce, setOpenWallBuilderNonce] = useState(0);
  // VIỆC 2 (M-3D-OUT) — dock công cụ nổi đáy viewport, đúng mock "3D Dựng khối" trạng thái 03/04.
  const [dockOpen, setDockOpen] = useState(false);
  const [matDangCam, setMatDangCam] = useState<string | null>(null);
  // VIỆC "MỘT THƯ VIỆN" (`PHIEU-CODE-IF-DOT6`, 05/08) — cây đối tượng + panel thuộc tính dời sang
  // Navigator/Inspector (`Object3DTree.tsx`/`Object3DInspector.tsx`, ổ SIBLING của AppShell, xem
  // `HomeScreen.tsx`) — tên group ẩn/đang chọn nay sống ở store chia sẻ `useTree3DUi`, không phải
  // `useState` cục bộ (2 ổ kia không chung cây React cha gần để nhận props).
  const hiddenGroupNames = useTree3DUi((s) => s.hiddenNames);
  const selectedGroupName = useTree3DUi((s) => s.selectedName);
  const [welcomeHidden, setWelcomeHidden] = useState(false);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const soKhoiRef = useRef(0);
  const viewportWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setWelcomeHidden(localStorage.getItem(WELCOME_HIDDEN_KEY) === '1');
    } catch {
      /* localStorage bị chặn hoặc dữ liệu hỏng — cứ hiện ở vị trí mặc định, không phải lỗi chặn việc */
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

  /**
   * [marker: focusEntity] — nhánh 3D của TaskContext deep-link (phiếu tool-state-3d ô④(3), hợp
   * đồng `lib/tasks/context.ts` `buildTaskDeepLink`): mở `/projects/{id}/render?focusEntity={id}`
   * → chọn ĐÚNG khối đó trong cảnh (ghi vào `useTree3DUi` — cùng ổ chọn của cây/Inspector/gizmo).
   * Đọc query bằng `window.location.search` (không `useSearchParams` — khỏi ép Suspense boundary
   * lên cả trang). Áp MỘT lần cho mỗi giá trị param, chỉ khi tìm thấy — entity chưa vào cảnh
   * (scene còn dựng dở) thì lần scene sau thử lại, không bịa chọn khối khác.
   */
  const focusAppliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!scene) return;
    let param: string | null = null;
    try {
      param = new URLSearchParams(window.location.search).get('focusEntity');
    } catch {
      return; // môi trường không có location — không có gì để focus
    }
    if (!param || focusAppliedRef.current === param) return;
    const group = scene.groups.find((g) => g.entityId === param);
    if (!group) return;
    focusAppliedRef.current = param;
    const ui = useTree3DUi.getState();
    if (ui.selectedName !== group.name) ui.select(group.name);
  }, [scene]);

  /* ── VIỆC 3 + VIỆC 4 (§0c mảng 1 & 3): cử chỉ BA NGÓN xoay mặt trời + phím tắt của mode ── */
  const hiddenLevels = useLevelUi((s) => s.hiddenLevels);
  // Đèn đọc THẲNG từ Doc qua `buildLightRig()` của PHU — không có bản sao nào trong component này
  // (K1 một nguồn). `rig` cho toạ độ tuyệt đối + màu Kelvin đã quy đổi, dùng luôn cho dấu đèn 3D.
  // `Scene3DViewer` dựng renderer/cảnh trong effect phụ thuộc `lightingPreview`.
  // Không memo hoá ở đây khiến mọi thay đổi UI như chọn/ẩn một khối tạo LightRig mới,
  // rồi teardown + dựng lại WebGL dù Doc chưa đổi — nguyên nhân giật khi thao tác.
  const rig = useMemo(() => buildLightRig(doc), [doc]);
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
   *   W        mở lệnh Tường hai điểm (nhập số, ghi vào cùng Doc)
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
      if (!e.shiftKey && (e.key === 'w' || e.key === 'W')) {
        moLenhTuongHaiDiem();
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

  // LANE C — ref camera SỐNG, mượn từ Viewport3D để `KetXuatPanel` chụp đúng góc đang nhìn.
  const cameraApiRef = useRef<Scene3DCameraApi | null>(null);

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

  /**
   * [marker: taoViecTuDay] — chiều NGƯỢC của TaskContext (phiếu tool-state-3d ô④(3)): đang đứng
   * ở khối 3D → một nút tạo việc GẮN SẴN {stage:'render', entityId} qua POST /api/tasks (API thật,
   * `app/api/tasks/route.ts`). Việc sinh ra bấm từ Bảng việc sẽ deep-link ngược về đúng khối này
   * (nhánh focusEntity phía trên — vòng khép kín). Toast kèm link mở Bảng việc (`/tasks`).
   */
  const [taskToast, setTaskToast] = useState<{ text: string; href?: string; err?: boolean } | null>(null);
  const [taskPosting, setTaskPosting] = useState(false);
  const taoViecProjectId = pathname?.startsWith('/projects/') ? (pathname.split('/')[2] || null) : null;
  useEffect(() => {
    if (!taskToast) return;
    const t = window.setTimeout(() => setTaskToast(null), 8000);
    return () => window.clearTimeout(t);
  }, [taskToast]);
  async function taoViecTuDay() {
    if (!taoViecProjectId || !selectedGroup?.entityId || taskPosting) return;
    setTaskPosting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: taoViecProjectId,
          // Tựa gợi từ entity — người dùng sửa lại ở Bảng việc (đích đến sửa được, luật nền §7②).
          title: tr(`Xử lý khối ${selectedGroup.name}`, `Handle block ${selectedGroup.name}`),
          stage: 'render',
          entityId: selectedGroup.entityId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : `HTTP ${res.status}`);
      setTaskToast({ text: tr('Đã tạo việc gắn khối này.', 'Task created for this block.'), href: '/tasks' });
    } catch (e) {
      setTaskToast({
        text: tr('Tạo việc thất bại: ', 'Task creation failed: ') + (e instanceof Error ? e.message : String(e)),
        err: true,
      });
    } finally {
      setTaskPosting(false);
    }
  }

  // `updateEntities`/`addEntities` tạo Doc MỚI trong store → `doc` đổi reference → `scene` tự tính
  // lại → viewer dựng lại. Không ép remount tay (luật một nguồn).
  function handlePushPull(entityId: string, newHeightMm: number) {
    const store = useCadStore.getState();
    const entity = store.doc.entities.find((e) => e.id === entityId);
    if (!entity) return;
    store.updateEntities([{ ...entity, heightMm: newHeightMm }]);
  }

  /** Gizmo 3D phải ghi được: X/Y tịnh tiến tất cả phần của cấu kiện đang chọn;
   * Z đổi cao độ đáy. Với tường hatch+outline, hostId giữ hai phần đi cùng nhau. */
  function handleNudge(axis: 'x' | 'y' | 'z', deltaMm: number) {
    const store = useCadStore.getState();
    const selected = store.doc.entities.find((entity) => entity.id === viewportSelectedId);
    if (!selected) return;
    const linkedIds = new Set<string>([selected.id]);
    if (selected.hostId) linkedIds.add(selected.hostId);
    for (const entity of store.doc.entities) {
      if (entity.hostId === selected.id || (selected.hostId && entity.hostId === selected.hostId)) linkedIds.add(entity.id);
    }
    const updates = store.doc.entities
      .filter((entity) => linkedIds.has(entity.id))
      .map((entity) => axis === 'z'
        ? { ...entity, elevationMm: Math.max(0, (entity.elevationMm ?? 0) + deltaMm) }
        : translateEntity(entity, axis === 'x' ? deltaMm : 0, axis === 'y' ? deltaMm : 0));
    store.updateEntities(updates);
    store.setStatus(tr(
      `Đã dịch ${axis.toUpperCase()} ${Math.abs(deltaMm)} mm.`,
      `Moved ${axis.toUpperCase()} by ${Math.abs(deltaMm)} mm.`,
    ));
  }

  /**
   * XOAY khối đang chọn quanh tâm bbox (21/08 — kéo vòng ngoài gizmo).
   * TÁI DÙNG `rotateSelectionUpdates` sẵn có ở `lib/render-studio/tool3d.ts` (đã lo `linkedIds`
   * qua hostId + `rotateEntity` của engine 2D) — không chép lại phép quay ở đây.
   */
  function handleRotate(deltaDeg: number) {
    if (!viewportSelectedId) return;
    const store = useCadStore.getState();
    const updates = rotateSelectionUpdates(store.doc.entities, viewportSelectedId, deltaDeg);
    if (!updates.length) return;
    store.updateEntities(updates);
    store.setStatus(tr(`Đã xoay ${Math.round(deltaDeg)}°.`, `Rotated ${Math.round(deltaDeg)}°.`));
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

  /**
   * LỐI CHÍNH của cửa vào 3D rỗng (21/08): đóng card chào, mở tab Tạo, và CẦM SẴN công cụ tường —
   * người dùng chỉ việc kéo trên mặt sàn là có khối (cử chỉ dựng đã chạy thật, xem
   * `Scene3DViewer.onGroundDraw`). KHÔNG mở form gõ số, KHÔNG đụng chặng 2D: đây là đường "vào
   * thẳng 3D dựng được ngay" mà luật X3 đòi phải ngang hàng với đường đi từ mặt bằng.
   */
  function batDauTrong3D() {
    dongCardChao();
    setTab('tao');
    useTool3D.getState().setActive('line');
    useCadStore
      .getState()
      .setStatus(tr('Kéo trên mặt sàn để dựng tường. Esc để bỏ.', 'Drag on the ground to build a wall. Esc to cancel.'));
  }

  function moLenhTuongHaiDiem() {
    setTab('tao');
    setNhayNutTuong(false);
    setOpenWallBuilderNonce((nonce) => nonce + 1);
  }

  /** M-EMPTY-2 (07/08, mock [BẢN CHỐT] màn 1c) — lối thoát "Vẽ mặt bằng trước": mở chặng Thiết
   * kế 2D bằng ĐÚNG đường StageSwitcher đang đi (`pickStage`, lib/studio/stage-nav — origin
   * 'render' → begin('concept') + push href cad), không chế đường điều hướng thứ hai. */
  function veMatBangTruoc() {
    pickStage('concept', { active: 'render', pathname, router, begin });
  }

  function taoTuongMau(draft: WallDraft3D = { ...FIRST_WALL, heightMm: 2700 }) {
    const store = useCadStore.getState();
    store.addEntities(
      wallSegmentOutline(draft.from, draft.to, draft.thicknessMm, store.currentLayer)
        .map((entity) => ({ ...entity, heightMm: draft.heightMm })),
    );
    setNhayNutTuong(false);
    store.setStatus(tr('Đã tạo tường hai điểm. Chọn khối để đổi cao độ hoặc mở Inspector để chỉnh thông số.', 'Two-point wall created. Select it to change height or open Inspector for parameters.'));
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
          Bảng lệnh 256px là panel bên duy nhất của mode 3D chưa thu được (đo 2/18 render-studio).
          LANE 3 (20/08) — "viewport is primary, no giant control chrome": trước nay panel này mở
          SẴN 100% các phiên đầu (defaultOpen mặc định của PanelFlank là true), đứng cạnh khung
          nhìn 3D ngay từ khung hình đầu ⇒ chiếm ~31% bề rộng màn trước khi người dùng làm gì.
          Đổi về THU-MẶC-ĐỊNH (khớp panel kết xuất bên phải đã `defaultOpen={false}` — cùng mode,
          hai bên lệch nhau không có lý do). Tay cầm PanelFlank luôn hiện + nhớ lựa chọn qua
          localStorage — người bấm mở một lần thì phiên sau mở lại đúng ý họ, không mất chức năng. */}
      <PanelFlank side="left" storageKey="render3d.command-panel" label={tr('bảng lệnh 3D', '3D command panel')} defaultOpen={false}>
        <Command3DPanel
          tab={tab}
          onTabChange={setTab}
          nhayNutTuong={nhayNutTuong}
          openWallBuilderNonce={openWallBuilderNonce}
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
          cameraApiRef={cameraApiRef}
          selectedId={viewportSelectedId}
          mode="massing"
          onNudge={handleNudge}
          onRotate={handleRotate}
          onPushPull={handlePushPull}
          lightMarkers={lightMarkers}
          onLightMove={handleLightMove}
          lightingPreview={rig}
          ground
          snap3d={{ settings: snapSettings, gridStepMm }}
          label={soKhoi > 0 ? 'Khối xám · chưa vật liệu' : 'Không gian trống'}
        >
          {/* LANE D (20/08) — Toolbelt năng lực gộp cho chặng Vẽ 3D. Registry `compound.ts` đã
              khai `image-to-3d.stages = ['cad','render']` từ trước (cửa Ảnh→Spec ĐÃ thiết kế
              để bấm được ở đây) nhưng KHÔNG nơi nào mount `<StageToolbelt stage="render">` —
              chỉ `CadToolbelt` (stage="cad") gọi nó. Cửa duyệt G1-G4 vì vậy mồ côi ở chặng 3D:
              registry hứa, không ai mở cửa. Đặt top-center (mẫu vị trí switcher mặc định của
              `ModeShell`, ở đây bị `hideBuiltInSwitcher`/`ModeSwitchBar` thay chỗ nên top đang
              trống) — không đụng ToolDock3D/Tool3DBar/QuickCommandBox ở đáy. */}
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 8 }}>
            <StageToolbelt stage="render" coDoiTuongChon={!!viewportSelectedId} />
          </div>

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
              <Sun size={18} color={rig.sun.belowHorizon ? 'var(--t4)' : rig.sun.colorHex} />
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
                  position: 'relative', pointerEvents: 'auto', textAlign: 'center', maxWidth: 400, padding: '8px 12px 12px',
                  // Empty state là chỉ dẫn trên sân khấu, không phải một card kính thứ hai.
                  textShadow: '0 2px 16px color-mix(in srgb, var(--bg) 86%, transparent)',
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
                    borderRadius: 6, cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
                {/* 21/08 (Hoà bác bản cũ) — CỬA VÀO 3D KHÔNG CÒN CỔNG 2D.
                    Bản trước: nút chính "Dựng khối từ mặt bằng 2D" bị KHOÁ kèm cảnh báo vàng khi
                    chưa có bản vẽ, còn nút được tô đậm lại là "Vẽ mặt bằng trước → mở chặng 2D".
                    Đọc ra thành "3D là bước 2, phải xong bước 1 đã" — trái LUẬT X2 (`docs/00-CHOT.md`:
                    *"KHÔNG MÀN NÀO ĐƯỢC CHẶN VÌ chưa-làm-bước-trước"*) và trái X3 (ba đường vào
                    NGANG NHAU). 2D và 3D là hai MÔI TRƯỜNG nối nhau, không phải hai chặng của một
                    phù thuỷ.
                    Nay: lối chính là DỰNG THẲNG TRONG 3D (mở tab Tạo, cầm luôn công cụ tường —
                    cử chỉ kéo trên mặt sàn đã chạy thật từ 21/08). Mặt bằng 2D tụt xuống lối phụ
                    và CHỈ mời khi dự án CÓ bản vẽ thật; không có thì nó là một dòng chữ đi tiếp,
                    không phải nút chết. Bỏ luôn dòng phụ "3D modelling space" — nhắc lại chính
                    tiêu đề bằng tiếng Anh, không mang thêm tin nào. */}
                <p style={{ margin: 0, fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)', lineHeight: 1.5 }}>
                  {tr('Bắt đầu dựng', 'Start building')}
                </p>
                <p style={{ margin: '6px 0 14px', fontSize: 'var(--fs-2xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
                  {tr(
                    'Kéo thẳng trên mặt sàn để dựng tường và khối. Hoặc nâng một mặt bằng 2D lên.',
                    'Drag on the ground to build walls and blocks — or raise a 2D plan.',
                  )}
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* LỐI CHÍNH — luôn bấm được, không phụ thuộc gì. */}
                  <button
                    type="button"
                    onClick={batDauTrong3D}
                    style={{
                      height: 32, padding: '0 14px', borderRadius: 999, cursor: 'pointer', border: 0,
                      background: 'var(--accent)', color: '#fff', fontSize: 'var(--fs-2xs)',
                      fontWeight: 'var(--fw-semi)', display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Hammer size={18} strokeWidth={1.5} />
                    {tr('Bắt đầu trong 3D', 'Start in 3D')}
                  </button>

                  {/* LỐI PHỤ — chỉ mời khi CÓ mặt bằng thật; không có thì chỉ là đường đi tiếp. */}
                  {coBanVe ? (
                    <button
                      type="button"
                      onClick={dunTuBanVe}
                      style={{
                        height: 32, padding: '0 14px', borderRadius: 999, cursor: 'pointer',
                        border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)',
                        fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)',
                      }}
                    >
                      {tr('Dùng mặt bằng này →', 'Use this plan →')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={veMatBangTruoc}
                      style={{
                        height: 32, padding: '0 10px', borderRadius: 999, cursor: 'pointer', border: 0,
                        background: 'none', color: 'var(--t3)', fontSize: 'var(--fs-2xs)',
                      }}
                    >
                      {tr('Vẽ / nhập mặt bằng →', 'Draw or import a plan →')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lối quay lại gợi ý bắt đầu — SPEC-NGON-NGU: đóng thứ gì cũng phải mở lại được.
              21/08: hạ hẳn xuống CHỮ MỜ, bỏ viên kính + viền + nền mờ. Lý do: một viên nổi ở góc
              là thêm MỘT VẬT trên khung nhìn cho việc chỉ dùng đúng một lần lúc cảnh còn trống —
              đúng loại "capsule bí ẩn" đang phải cắt. Vẫn gate `soKhoi === 0` nên có khối là nó
              biến mất hẳn, không lởn vởn suốt phiên dựng. Đường CHÍNH để tạo hình vẫn là tab Tạo
              (mở sẵn) + dock công cụ; đây chỉ là lối quay lại lời mời. */}
          {soKhoi === 0 && welcomeHidden && (
            <button
              type="button"
              onClick={moLaiCardChao}
              style={{
                position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 74, zIndex: 6,
                border: 0, background: 'none', padding: '4px 8px', color: 'var(--t4)',
                fontSize: 'var(--fs-2xs)', cursor: 'pointer',
              }}
            >
              {tr('Gợi ý bắt đầu', 'Show start options')}
            </button>
          )}

        </Viewport3D>

        <ToolDock3D
          open={dockOpen}
          onToggleOpen={() => setDockOpen((o) => !o)}
          onCreateWall={moLenhTuongHaiDiem}
          onOpenLibrary={() => openLibrarySheet({ stage: 'render' })}
          onOpenMaterialTab={() => setTab('vatlieu')}
          onOpenCameraTab={() => setTab('camera')}
        />

        {/* Máy trạng thái công cụ 3D — bar ô nhập số của tool đang cầm (Tool3DStateMachine).
            Dock mở rộng cao hơn dạng thu gọn → nâng bar lên để hai tấm không đè nhau. */}
        <Tool3DBar selectedEntityId={viewportSelectedId} bottomPx={dockOpen ? 264 : 130} />

        {/* [marker: taoViecTuDay] — chỉ hiện khi khối đang chọn CÓ entityId thật (không nút giả);
            đứng góc trái đáy, tránh dock (giữa) và dòng lệnh nhanh (phải). */}
        {selectedGroup?.entityId && taoViecProjectId && (
          <button
            type="button"
            onClick={taoViecTuDay}
            disabled={taskPosting}
            title={tr('Tạo việc gắn khối này, mở lại là nhảy về đúng đây', 'Create a task pinned to this block')}
            style={{
              position: 'absolute', left: 14, bottom: 76, zIndex: 6, height: 26, padding: '0 11px',
              borderRadius: 999, border: '1px solid var(--vien-mo)',
              background: 'color-mix(in srgb, var(--panel) 96%, transparent)',
              color: 'var(--t2)', fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
              cursor: taskPosting ? 'progress' : 'pointer', boxShadow: '0 8px 20px rgba(0, 0, 0, .18)',
            }}
          >
            {taskPosting ? tr('Đang tạo việc…', 'Creating task…') : tr('＋ Tạo việc từ đây', '＋ Create task from here')}
          </button>
        )}
        {taskToast && (
          <div
            role="status"
            style={{
              position: 'absolute', left: 14, bottom: 110, zIndex: 7, maxWidth: 320,
              padding: '7px 12px', borderRadius: 10, fontSize: 11, lineHeight: 1.5,
              background: 'color-mix(in srgb, var(--panel) 96%, transparent)',
              border: `1px solid ${taskToast.err ? 'var(--danger, #e5484d)' : 'var(--border-strong)'}`,
              color: taskToast.err ? 'var(--danger, #e5484d)' : 'var(--t1)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, .2)', display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <span>{taskToast.text}</span>
            {taskToast.href && (
              <a href={taskToast.href} style={{ color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {tr('Mở Bảng việc', 'Open task board')}
              </a>
            )}
          </div>
        )}

        <ModeSwitchBar />
      </div>

      {/* LANE C (20/08) — bảng Kết xuất + Chuyển động. Đứng mép PHẢI, cùng mẫu tay cầm PanelFlank
          với bảng lệnh bên trái (chốt 07/08 mục 10: một mẫu thu/mở cho toàn app). Nó đọc camera
          SỐNG qua `cameraApiRef` mượn từ Viewport3D — không dựng viewport thứ hai. */}
      <PanelFlank side="right" storageKey="render3d.ketxuat-panel" label={tr('bảng kết xuất', 'render panel')} defaultOpen={false}>
        <KetXuatPanel scene={visibleScene ?? null} cameraApiRef={cameraApiRef} soKhoi={soKhoi} />
      </PanelFlank>
    </div>
  );
}
