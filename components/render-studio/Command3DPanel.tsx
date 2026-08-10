'use client';

/**
 * components/render-studio/Command3DPanel.tsx — G3 phần (1) (`docs/TICKET-CHANG2-BUILD-2026-08-02.md`
 * "G3 Vẽ 3D: Command Panel + Scene Objects", `docs/SPEC-CHANG2-UI-2MODE.md:30-43`): sidebar 5 tab
 * kiểu 3ds Max cho mode "Vẽ 3D" — đúng bố cục đã duyệt qua `docs/mocks/mock-ve-3d.html`
 * ("✅ Vẽ 3D CHỐT qua mock", `docs/00-CHOT.md`).
 *
 * SKELETON có chủ đích (đúng tinh thần `Render3DModeSkeleton.tsx`): chỉ tab "Vật liệu" hoạt động
 * thật (tái dùng NGUỒN DỮ LIỆU matId thật đã xây ở G2 phần (5) qua `useMaterials` — KHÔNG viết
 * fetch riêng). 2 tab còn lại (Tạo/Camera) là placeholder rõ ràng, KHÔNG giả vờ hoạt động — đúng
 * luật "không nút giả". Click-to-assign vật liệu lên mặt 3D thật CHƯA làm (cần raycast trong
 * `Scene3DViewer`, việc riêng phần sau) — bấm swatch ở đây chỉ ĐẶT "đang chọn" (state cục bộ),
 * chưa gán đi đâu.
 *
 * VIỆC "MỘT THƯ VIỆN" (`PHIEU-CODE-IF-DOT6`, 05/08) — tab "Hiện" (cây đối tượng theo tầng + panel
 * thuộc tính) đã DỜI RA khỏi panel này, sang `Object3DTree.tsx` (ổ ② Navigator) và
 * `Object3DInspector.tsx` (ổ ④ Inspector, xem `HomeScreen.tsx`). Lý do: Navigator của mode 3D
 * trước đó vẫn hiện nguyên `NodeLibraryPanel` (kệ Vật liệu ATLAS) ĐỘC LẬP với panel này — Hoà chụp
 * màn thấy vật liệu hiện Ở BA CHỖ cùng lúc (sidebar trái · tab Hiện tại đây · sheet Thư viện). Cây
 * đối tượng đứng riêng ở Navigator vừa xoá 1 trong 3 chỗ, vừa đúng cột trái 214px của
 * `mock-3d-thong-nhat.html` (panel này không phải cột trái của mock — mock không có cột thứ ba
 * kiểu tab, xem cảnh báo trong báo cáo phiên này về phần CHƯA làm: dock công cụ nổi đáy viewport).
 */

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCadStore, type Tool } from '@/lib/cad/store';
import { useTree3DUi } from '@/lib/render-studio/tree3d-ui';
import { applyArrayGrid } from '@/lib/render-studio/array-grid-ops';
import { pickStage } from '@/lib/studio/stage-nav';
import { useStageTransition } from '@/components/studio/StageTransitionProvider';
import {
  Plus, Pencil, Palette, Camera, Square, DoorClosed, AppWindow, TrendingUp,
  CornerUpRight, RotateCw, Fence, Minus, PanelTop, Archive, Lightbulb, Scissors,
  Disc, Triangle, Spline, Layers, CircleDot, Box, ArrowUpRight,
} from 'lucide-react';
import type { Scene3DData } from '@/lib/three/cad-to-obj';
import { SectionExtractPanel, type SectionAcceptPayload } from './SectionExtractPanel';
import { useMaterials, type MaterialSpecLite } from '@/lib/render-studio/use-materials';
import MaterialSphere from '@/components/three/MaterialSphere';
import { darken, kindFromName, sceneForKind } from '@/components/three/material-preview';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';
import { WallTypePanel3D } from './WallTypePanel3D';
import { LightTab } from './LightTab';
import { entityBox } from '@/lib/cad/model';
import { setEntityArrayRadial, setEntityMirror, setEntityBevelEx, setEntityTaper, setEntitySweep } from '@/lib/cad/commands';

/**
 * Tab do NƠI MOUNT giữ (mode Vẽ 3D cần mở thẳng tab Tạo khi bấm "Dựng khối đầu tiên").
 *
 * VIỆC 1 / A2 (`PHIEU-CODE-IF-DOT6` · `SPEC-DUNG-3D-THONG-NHAT` §1.3 M3, 05/08) — khoá đổi từ
 * tiếng Anh (`create/edit/material/camera/visibility`) sang tiếng Việt (`tao/sua/vatlieu/camera/
 * hien`) để khớp bản `components/three/CommandPanel.tsx` (đã xoá, xem BAO-CAO-G4) — đó là khoá
 * spec chọn làm chuẩn. Không có localStorage nào lưu tab (grep xác nhận trước khi đổi) nên KHÔNG
 * cần migrate dữ liệu cũ — đổi thẳng. `hien` bỏ khỏi union ở việc "MỘT THƯ VIỆN" (xem trên) — cây
 * dời sang Navigator, không còn là tab của panel này.
 */
// 05/08 (S2 BUILD#1) — thêm `banve`: chỗ RÚT ĐƯỜNG 2D ra khỏi khối 3D (`sectionToEntities`).
// Xếp CUỐI vì đúng thứ tự nghề: dựng khối → sửa → vật liệu → máy quay → đèn → *rồi mới* ra hồ sơ.
export type Command3DTab = 'tao' | 'sua' | 'vatlieu' | 'camera' | 'den' | 'banve';
type Tab = Command3DTab;

export interface Command3DPanelProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  /** nháy nút Tường sau khi người dùng bấm "Dựng khối đầu tiên" — chỉ dẫn ĐÚNG MỘT việc kế tiếp. */
  nhayNutTuong?: boolean;
  /** dựng tường mẫu (nơi mount ghi vào Doc qua engine `wallSegment`, panel không tự ghi). */
  onTaoTuong?: () => void;
  /** VIỆC 1 (nối `arrayLinear` thật) — dựng lan can mẫu (nơi mount ghi vào Doc qua engine
   * `railingPosts`, panel không tự ghi — cùng khuôn `onTaoTuong`). */
  onTaoLanCan?: () => void;
  /** báo lên nơi mount là người dùng ĐÃ chọn vật liệu — mode dùng để đánh dấu bước ②. */
  onPickMaterial?: (id: string) => void;
  /** VIỆC 2 (S2 BUILD#1) — cảnh 3D đang hiện, để tab "Bản vẽ" cắt lớp. `null` = chưa có khối nào. */
  scene?: Scene3DData | null;
  /** người dùng đã DUYỆT ở màn xem trước → nơi mount ghi vào `Doc` (panel không tự ghi). */
  onNhanMatCat?: (payload: SectionAcceptPayload) => void;
}

/** Một điểm vào theo ngữ cảnh, không phải danh mục "AI" mới. Mỗi nút chỉ dẫn đến hành động đã
 * có thật; phần còn lại của tác vụ giữ trong tab chuyên môn bên dưới. */
function ContextQuickTools({ tab, onTaoTuong }: { tab: Command3DTab; onTaoTuong?: () => void }) {
  const tr = useT();
  const openParts = () => openLibrarySheet({ shelfId: 'common-idfc' });
  const openMaterials = () => openLibrarySheet({ shelfId: 'common-atlas' });

  const config: Partial<Record<Command3DTab, { title: [string, string]; detail: [string, string]; action?: { label: [string, string]; icon: typeof Plus; run: () => void } }>> = {
    tao: {
      title: ['Bắt đầu từ cấu kiện', 'Start with components'],
      detail: ['Dựng nhanh hoặc kéo cấu kiện có sẵn vào cảnh.', 'Build quickly or place a saved component.'],
      action: onTaoTuong ? { label: ['Thêm tường', 'Add wall'], icon: Plus, run: onTaoTuong } : { label: ['Mở cấu kiện', 'Browse components'], icon: Box, run: openParts },
    },
    vatlieu: {
      title: ['Gán vật liệu đúng chỗ', 'Assign material in context'],
      detail: ['Mở ATLAS để so sánh bề mặt trước khi áp.', 'Open ATLAS to compare surfaces before applying.'],
      action: { label: ['Mở ATLAS', 'Open ATLAS'], icon: Palette, run: openMaterials },
    },
    den: {
      title: ['Kiểm tra ánh sáng', 'Check lighting'],
      detail: ['Đặt nguồn đèn, xem tiền kiểm lux và phối cảnh cùng lúc.', 'Place sources, check estimated lux and perspective together.'],
    },
    camera: {
      title: ['Chuẩn bị góc máy', 'Prepare a camera view'],
      detail: ['Thiết lập khung hình, ống kính và đường đi trước khi xuất.', 'Set framing, lens, and the path before export.'],
    },
    sua: {
      title: ['Sửa đối tượng đã chọn', 'Refine the selected object'],
      detail: ['Chọn một khối trên khung nhìn để mở các phép biến đổi phù hợp.', 'Select a block in the viewport to reveal applicable transforms.'],
    },
    banve: {
      title: ['Rút nét về 2D', 'Extract back to 2D'],
      detail: ['Chọn mặt cắt, duyệt bản xem trước rồi nhận nét vào bản vẽ.', 'Choose a section, review it, then add lines to the drawing.'],
    },
  };
  const item = config[tab];
  if (!item) return null;
  const Icon = item.action?.icon ?? CircleDot;
  return (
    <section className="mb-3 rounded-[10px] border border-[var(--mat-hairline)] bg-[var(--field)] p-2.5" aria-label={tr('Tác vụ theo ngữ cảnh', 'Contextual tasks')}>
      <div className="flex gap-2">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-[var(--accent-soft)] text-[var(--accent)]"><Icon size={14} strokeWidth={1.8} /></span>
        <span className="min-w-0">
          <b className="block text-[11px] font-semibold text-[var(--t1)]">{tr(item.title[0], item.title[1])}</b>
          <span className="mt-0.5 block text-[10px] leading-[1.5] text-[var(--t4)]">{tr(item.detail[0], item.detail[1])}</span>
        </span>
      </div>
      {item.action && (
        <button type="button" onClick={item.action.run} className="mt-2 flex h-7 items-center gap-1 rounded-[7px] border border-[var(--border)] bg-transparent px-2 text-[10px] font-semibold text-[var(--t2)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]">
          <Icon size={12} strokeWidth={1.8} />{tr(item.action.label[0], item.action.label[1])}<ArrowUpRight size={11} strokeWidth={1.8} />
        </button>
      )}
    </section>
  );
}

const TABS: { id: Tab; icon: typeof Plus; label: [string, string] }[] = [
  { id: 'tao', icon: Plus, label: ['＋', '＋'] },
  { id: 'sua', icon: Pencil, label: ['Sửa', 'Edit'] },
  { id: 'vatlieu', icon: Palette, label: ['Vật liệu', 'Material'] },
  { id: 'camera', icon: Camera, label: ['Camera', 'Camera'] },
  // VIỆC 3 (05/08) — nhóm "Đặt đèn" TRƯỚC PHIÊN NÀY KHÔNG TỒN TẠI (không tab, không nút). Xếp
  // cuối theo đúng trình tự nghề: dựng khối → gán vật liệu → đặt máy quay → đánh đèn.
  { id: 'den', icon: Lightbulb, label: ['Đèn', 'Light'] },
  { id: 'banve', icon: Scissors, label: ['Bản vẽ', 'Drawing'] },
];

export default function Command3DPanel({
  tab,
  onTabChange,
  nhayNutTuong = false,
  onTaoTuong,
  onTaoLanCan,
  onPickMaterial,
  scene = null,
  onNhanMatCat,
}: Command3DPanelProps) {
  const setTab = onTabChange;
  const tr = useT();
  const materials = useMaterials(true);

  return (
    // Port `docs/mocks/mock-if-ve3d.html` `.side` (08/06): panel NỀN ĐẶC var(--panel) 214px, không
    // kính — đúng G9 (kính chỉ dành 4 chỗ nổi TRÊN WebGL: ModeSwitchBar/nút Dựng ảnh/ViewCube/
    // Lightbox, sidebar KHÔNG nằm trong danh sách đó). Trước là `.mat-panel` (kính) + `w-64`(256px).
    <div className="flex h-full w-[214px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)]">
      {/* mock `.cptabs`: gap 1px, padding 5px 6px, viền dưới mat-hairline (không phải --border đặc) */}
      <div className="flex gap-px border-b border-[var(--mat-hairline)] p-[5px]">
        {TABS.map(({ id, icon: Icon, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-label={id === 'tao' ? tr('Tạo mới', 'Create new') : tr(label[0], label[1])}
              className={cn(
                // mock `.cpt`: bo góc 8px, nền pill khi active (không phải gạch chân), hover đổi nền
                'flex flex-1 flex-col items-center gap-1 rounded-[8px] px-0.5 py-1.5 text-[10px] transition-colors',
                active ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]' : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
              )}
              /* `title=` gỡ 05/08 (VIỆC 2): nhãn tab ĐÃ hiện ngay dưới icon — `title=` chỉ lặp
                 đúng chữ đó sau 1-2s chờ, không thêm thông tin nào. Tab không cần tooltip. */
            >
              <Icon size={14} />
              {tr(label[0], label[1])}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <ContextQuickTools tab={tab} onTaoTuong={onTaoTuong} />
        {tab === 'vatlieu' && <MaterialTab materials={materials} onPick={onPickMaterial} />}
        {tab === 'tao' && <CreateTab nhayNutTuong={nhayNutTuong} onTaoTuong={onTaoTuong} onTaoLanCan={onTaoLanCan} onTabChange={onTabChange} />}
        {tab === 'sua' && <EditTab scene={scene} />}
        {tab === 'den' && <LightTab />}
        {tab === 'banve' && <SectionExtractPanel scene={scene} onNhan={onNhanMatCat} />}
        {tab === 'camera' && <PlaceholderTab tab={tab} />}
      </div>
    </div>
  );
}

/** Tab TẠO — trước đây là câu "sắp có" suông (Hoà: "rối rắm, không hệ thống"). Nay dựng được
 * TẠI CHỖ: nút Tường gọi engine `wallSegment()` của chặng Vẽ qua nơi mount. Các khối còn lại giữ
 * chỗ dạng disabled — thà nói thẳng "chưa dựng được" còn hơn nút bấm không ra gì. */
/** NHÓM C, VIỆC C2 (`docs/PHIEU-CODE-IF-DOT7-3D-2026-08-03.md`) — đúng tầng ⑥ "Cấu kiện tham số"
 * của `docs/SPEC-DUNG-BO-LENH-3D.md` (bảng 6 tầng). §9 *"thiết kế trước — tính năng fill sau"*:
 * vẽ ĐỦ cả tầng lên giao diện ngay cả khi chưa code, KHÔNG ẩn/bỏ sót — ô mờ là bằng chứng còn
 * việc, không phải chỗ trống cho gọn mắt.
 *
 * VIỆC 1 (nối `extrude`+`arrayLinear` thật, `docs/SPEC-DUNG-BO-LENH-3D.md`) — `lancan` MỞ KHOÁ
 * thêm (bấm gọi `onTaoLanCan`, engine `railingPosts()` dựng 1 cột + gắn bậc `arrayLinear` thật,
 * xem `lib/cad/commands.ts`) — đúng ví dụ "nan chớp/song sắt lặp" đã ghi ở `Base.ops`
 * (`lib/cad/model.ts`). `tuong`/`lancan` là 2 NGOẠI LỆ đã dựng thật trong danh sách này. 8 mục còn
 * lại vẫn mờ — lý do BÂY GIỜ ĐÃ KHÁC nhau theo TỪNG mục (`reason`, xem bên dưới list này), KHÔNG
 * còn dùng chung 1 câu "đợi ops[]" như trước (ops[] tầng ③④⑤ đã đủ cả 3 phép — boolean/extrude/
 * arrayLinear; cái còn thiếu là LỆNH THAM SỐ RIÊNG của từng loại cấu kiện tầng ⑥, hoặc — với cửa/
 * cửa sổ — chỉ thiếu NỐI nút này vào luồng ĐÃ CHẠY THẬT ở nơi khác).
 */
/** p14 (Hoà 08/08 ②③): panel Tạo chia lại 3 NHÓM THEO ĐỘNG TÁC — ① Vẽ rồi đùn (tạo từ đâu) ·
 * ② Cấu kiện (tạo cái gì) · ③ Biến đổi (sửa thế nào). Tên lệnh giữ TIẾNG ANH (chốt 08/08,
 * docs/00-CHOT.md dòng cuối) + dòng nhỏ giải thích Việt. Nút chết GIỮA nhóm sống GIỮ + lý do
 * lộ qua tooltip (luật §9); 3 kiểu cầu thang gộp 1 ô "Stair" theo danh sách Hoà chốt — không
 * mất dấu việc (lý do ghi đủ 3 kiểu). Sàn/Mái từ nhóm Khối cơ bản cũ chuyển vào đây. */
interface CellDef { id: string; en: string; vi: string; icon: typeof Square; lam?: boolean; reason?: [string, string] }

const NHOM_CAU_KIEN: CellDef[] = [
  { id: 'tuong', en: 'Wall', vi: 'tường', icon: Square, lam: true },
  {
    id: 'san', en: 'Floor', vi: 'sàn', icon: Minus,
    reason: [
      'Chưa có lệnh tạo sàn riêng — sàn hiện tự sinh theo biên phòng khi dựng tường (room tự nhận biên).',
      'No standalone floor command yet — floors auto-generate from room boundaries when walls exist.',
    ],
  },
  {
    id: 'mai', en: 'Roof', vi: 'mái', icon: PanelTop,
    reason: [
      'Chưa có lệnh mái tham số — cần khối nghiêng/đa mặt phẳng, engine đùn thẳng hôm nay chưa dựng được.',
      'No parametric roof command yet — needs sloped/multi-plane solids beyond today’s straight extrude.',
    ],
  },
  {
    id: 'cua', en: 'Door', vi: 'cửa', icon: DoorClosed,
    reason: [
      'Dựng được rồi — kéo khối cửa từ thư viện đồ vào tường, tự khoét lỗ (Boolean). Nút tạo trực tiếp chưa nối cùng luồng.',
      'Already works — drag a door block from the library onto a wall (auto Boolean cut). This button isn’t wired to that flow yet.',
    ],
  },
  {
    id: 'cuaso', en: 'Window', vi: 'cửa sổ', icon: AppWindow,
    reason: [
      'Dựng được rồi — kéo khối cửa sổ từ thư viện đồ vào tường, tự khoét lỗ + lắp kính (Boolean). Nút tạo trực tiếp chưa nối cùng luồng.',
      'Already works — drag a window block from the library onto a wall (auto Boolean cut + glass). This button isn’t wired to that flow yet.',
    ],
  },
  {
    id: 'thang', en: 'Stair', vi: 'cầu thang', icon: TrendingUp,
    reason: [
      'Chưa có lệnh cầu thang tham số (thẳng/gấp khúc/xoắn) — Extrude/Array/Boolean đã sẵn, chưa ai ráp thành lệnh.',
      'No parametric stair command yet (straight/switchback/spiral) — Extrude/Array/Boolean exist, nobody has assembled the command.',
    ],
  },
  { id: 'lancan', en: 'Railing', vi: 'lan can', icon: Fence, lam: true },
  {
    id: 'tranthar', en: 'Ceiling', vi: 'trần thả', icon: PanelTop,
    reason: [
      'Cần khối NỔI (lơ lửng giữa sàn/trần) — khối hôm nay luôn đùn từ sàn z=0, chưa có cơ chế đặt khối treo.',
      'Needs a floating block (suspended mid-height) — blocks today always extrude from z=0.',
    ],
  },
  {
    id: 'tubep', en: 'Cabinet', vi: 'tủ bếp module', icon: Archive,
    reason: [
      'Cần bộ tham số module (rộng/sâu/cao chuẩn tủ bếp) — Array đã lặp được module, chưa ai ráp thành lệnh.',
      'Needs a module parameter set (per cabinet standards) — Array can repeat modules, the command isn’t assembled.',
    ],
  },
];

/** nhóm ③ BIẾN ĐỔI — trạng thái đo thật từng lệnh (không nút giả). MỞ KHO 08/08
 * (`docs/DOI-CHIEU-42-SPEC-2026-08-08.md` §1#1): `BuildOp` union có 6 biến thể mới +
 * `resolveGroupGeometry` nối đủ (`lib/three/build-ops.ts`) ⇒ Array/Array Radial/Mirror/Chamfer-
 * Fillet/Taper/Sweep nay SỐNG (mở mục tương ứng ở tab Sửa) · Extrude/Bevel/Boolean vẫn sống Ở CHỖ
 * KHÁC (lý do trỏ đúng nơi, không đổi) · Revolve/Loft VẪN MỜ — engine xong nhưng cần UI vẽ tiết
 * diện nhiều điểm mà `Command3DPanel`/viewport chưa có (N5, ngoài vùng phiếu này). */
const NHOM_BIEN_DOI: CellDef[] = [
  {
    id: 'extrude', en: 'Extrude', vi: 'đùn khối', icon: TrendingUp,
    reason: [
      'Dùng ngay trên khung nhìn — chọn khối, kéo mặt trên (push/pull). Không cần bấm nút trước.',
      'Use it directly in the viewport — select a block and drag its top face (push/pull).',
    ],
  },
  {
    id: 'bevel', en: 'Bevel', vi: 'vát cạnh trên', icon: CornerUpRight,
    reason: [
      'Đã chạy — chọn 1 tường rồi mở panel bên phải (Inspector), nút Bevel ở đó.',
      'Already works — select a wall, the Bevel action lives in the right-side Inspector.',
    ],
  },
  { id: 'chamfer', en: 'Chamfer / Fillet', vi: 'vát phẳng / bo tròn cạnh', icon: CornerUpRight, lam: true },
  { id: 'array', en: 'Array', vi: 'lặp khối theo lưới', icon: RotateCw, lam: true },
  { id: 'arrayradial', en: 'Array Radial', vi: 'lặp khối theo vòng tròn', icon: Disc, lam: true },
  {
    id: 'boolean', en: 'Boolean', vi: 'khoét / hợp khối', icon: Scissors,
    reason: [
      'Đã chạy — Khoét hốc ở panel bên phải (Inspector) khi chọn tường; cửa/cửa sổ tự khoét bằng chính nó.',
      'Already works — Cut-hole lives in the right-side Inspector; doors/windows auto-cut with it.',
    ],
  },
  { id: 'mirror', en: 'Mirror', vi: 'đối xứng', icon: Square, lam: true },
  { id: 'taper', en: 'Taper', vi: 'thu nhỏ dần lên đỉnh', icon: Triangle, lam: true },
  { id: 'sweep', en: 'Sweep', vi: 'quét tiết diện (phào chỉ)', icon: Minus, lam: true },
  {
    id: 'revolve', en: 'Revolve', vi: 'xoay tiết diện (chân bàn tiện)', icon: Spline,
    reason: [
      'Engine viết xong (revolveProfile) + có chỗ lưu (bậc BuildOp) — còn thiếu UI vẽ tiết diện nhiều điểm (bán kính×cao), chưa có công cụ nhập trên khung nhìn.',
      'Engine done (revolveProfile) + persisted (BuildOp slot) — still missing a multi-point profile editor UI in the viewport.',
    ],
  },
  {
    id: 'loft', en: 'Loft', vi: 'nối nhiều tiết diện (chụp đèn côn)', icon: Layers,
    reason: [
      'Engine viết xong (loftSections) + có chỗ lưu (bậc BuildOp) — còn thiếu UI nhập ≥2 tiết diện ở nhiều cao độ.',
      'Engine done (loftSections) + persisted (BuildOp slot) — still missing UI to enter ≥2 sections at different heights.',
    ],
  },
];

/** LỖI 1 (P8, 04/08, Hoà chụp màn 3D) — Tường/Cửa/Cửa sổ trước xuất hiện Ở CẢ HAI nhóm (nút
 * Tường đứng riêng + lưới "chưa có" Hộp/Sàn/Cửa/Cửa sổ/Mái, VÀ LẶP LẠI trong lưới "Cấu kiện" tầng
 * ⑥ bên dưới). GỘP LÀM MỘT: nhóm ⑥ tầng "Cấu kiện" (`CAU_KIEN_TANG_6`) là nguồn DUY NHẤT cho
 * Tường/Cửa/Cửa sổ (đúng `docs/SPEC-DUNG-BO-LENH-3D.md`) — nút Tường đứng riêng ở trên XOÁ, thay
 * bằng cell 'tuong' trong lưới ⑥ (vẫn giữ hiệu ứng nháy `nhayNutTuong` khi cần chỉ dẫn, chỉ đổi
 * VỊ TRÍ hiển thị). Hộp/Sàn/Mái là KHỐI CƠ BẢN (hình khối generic, KHÔNG phải cấu kiện tham số
 * tầng ⑥) — tách hẳn nhóm riêng "Khối cơ bản", không trộn 2 khái niệm khác tầng vào chung 1 lưới. */
/** p14 (Hoà 08/08): nhóm "KHỐI CƠ BẢN" 3 nút disabled cứng ĐÃ BỎ HẲN — cả nhóm chết thì không
 * trưng bày (SketchUp cố ý không có nút Box; 3ds Max không hiện nút không dùng được). Luật mới:
 * nút chết GIỮA nhóm sống thì GIỮ + nói lý do (§9 giữ nguyên cho ca đó); CẢ NHÓM chết thì BỎ NHÓM.
 * Sàn/Mái không mất dấu — chuyển vào nhóm CẤU KIỆN bên dưới dạng disabled + lý do riêng. */

function CreateTab({
  nhayNutTuong,
  onTaoTuong,
  onTaoLanCan,
  onTabChange,
}: {
  nhayNutTuong: boolean;
  onTaoTuong?: () => void;
  onTaoLanCan?: () => void;
  onTabChange?: (tab: Tab) => void;
}) {
  const tr = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { begin } = useStageTransition();
  // ① VẼ RỒI ĐÙN — trang bị công cụ 2D rồi mở chặng Thiết kế 2D bằng ĐÚNG đường StageSwitcher
  // (pickStage — không chế đường điều hướng thứ hai); vẽ xong khối đùn tự có ở đây (K1 một Doc).
  const veRoiDun = (tool: Tool) => {
    useCadStore.getState().setTool(tool);
    useCadStore.getState().setStatus(tr('Vẽ xong ở Thiết kế 2D, khối đùn tự hiện lại đây (một nguồn).', 'Draw in 2D Design — the extruded block appears back here (one source).'));
    pickStage('concept', { active: 'render', pathname, router, begin });
  };
  const NHOM_VE: { id: string; en: string; vi: string; tool: Tool }[] = [
    { id: 'rect', en: 'Rectangle', vi: 'chữ nhật', tool: 'rect' },
    { id: 'circle', en: 'Circle', vi: 'vòng tròn', tool: 'circle' },
    { id: 'polygon', en: 'Polygon', vi: 'đa giác', tool: 'polyline' },
  ];
  // MỞ KHO 08/08 — chamfer/arrayradial/mirror/taper/sweep đều mở tab Sửa (một ổ ghi mỗi lệnh,
  // cùng lý do `array` đã ghi — form nhập số cần chỗ rộng hơn 1 ô lưới vuông ở tab Tạo).
  const HANDLER: Partial<Record<string, (() => void) | undefined>> = {
    tuong: onTaoTuong,
    lancan: onTaoLanCan,
    array: () => onTabChange?.('sua'), // Array sống ở mục Array tab Sửa (một ổ ghi, không nhân đôi form)
    arrayradial: () => onTabChange?.('sua'),
    mirror: () => onTabChange?.('sua'),
    chamfer: () => onTabChange?.('sua'),
    taper: () => onTabChange?.('sua'),
    sweep: () => onTabChange?.('sua'),
  };
  const TIP: Partial<Record<string, [string, string]>> = {
    tuong: ['Đoạn 4m, dày 220 — sửa được sau', '4m segment, 220 thick — editable'],
    lancan: ['9 cột 60×60mm cách 300mm — chưa có tay vịn ngang (N5)', '9 posts 60×60mm at 300mm spacing — no top rail yet (N5)'],
    array: ['Mở mục Array (tab Sửa) — hoặc gõ thẳng: array 3x2 1200,900', 'Opens the Array section (Edit tab) — or type: array 3x2 1200,900'],
    arrayradial: ['Mở mục Array Radial (tab Sửa)', 'Opens the Array Radial section (Edit tab)'],
    mirror: ['Mở mục Mirror (tab Sửa)', 'Opens the Mirror section (Edit tab)'],
    chamfer: ['Mở mục Chamfer / Fillet (tab Sửa)', 'Opens the Chamfer / Fillet section (Edit tab)'],
    taper: ['Mở mục Taper (tab Sửa)', 'Opens the Taper section (Edit tab)'],
    sweep: ['Mở mục Sweep (tab Sửa)', 'Opens the Sweep section (Edit tab)'],
  };

  const cell = ({ id, en, vi, icon: Icon, lam, reason }: CellDef) => {
    const nhay = id === 'tuong' && nhayNutTuong;
    return (
      <Tooltip key={id} side="right" label={lam ? tr(...(TIP[id] ?? ['Sửa được sau', 'Editable afterwards'])) : tr(...(reason ?? ['Chưa dựng được', 'Not available yet']))}>
        <button
          type="button"
          disabled={!lam}
          onClick={lam ? HANDLER[id] : undefined}
          className={cn(
            'flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[9px] border p-1 text-center transition-colors',
            nhay
              ? 'animate-pulse cursor-pointer border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
              : lam
                ? 'cursor-pointer border-[var(--border)] bg-[var(--panel)] text-[var(--t2)] hover:border-[var(--accent-ring)] hover:text-[var(--accent)]'
                : 'cursor-not-allowed border-dashed border-[var(--border)] text-[var(--t5)] opacity-45',
          )}
        >
          <Icon size={14} strokeWidth={1.7} />
          {/* ② — tên lệnh EN dòng chính, giải thích VI dòng nhỏ (line-height ≥1.5, G4) */}
          <span className="text-[9.5px] font-semibold leading-[1.5]">{en}</span>
          <span className="text-[8px] leading-[1.5] opacity-80">{vi}</span>
        </button>
      </Tooltip>
    );
  };

  return (
    <div className="space-y-3">
      {/* ① VẼ RỒI ĐÙN — tạo TỪ ĐÂU (không nút xám nào — nhóm đầu tiên toàn nút sống) */}
      <div className="space-y-2">
        <p className="px-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--t4)]">
          {tr('Vẽ rồi đùn', 'Draw then extrude')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {NHOM_VE.map(({ id, en, vi, tool }) => (
            <Tooltip key={id} side="right" label={tr('Mở chặng Thiết kế 2D với công cụ này — vẽ xong, khối đùn tự hiện lại đây.', 'Opens 2D Design with this tool — draw, and the extruded block appears back here.')}>
              <button
                type="button"
                onClick={() => veRoiDun(tool)}
                className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[9px] border border-[var(--border)] bg-[var(--panel)] p-1 text-center text-[var(--t2)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
              >
                <Square size={14} strokeWidth={1.7} />
                <span className="text-[9.5px] font-semibold leading-[1.5]">{en}</span>
                <span className="text-[8px] leading-[1.5] opacity-80">{vi}</span>
              </button>
            </Tooltip>
          ))}
        </div>
        <p className="px-0.5 text-[9px] leading-[1.5] text-[var(--t4)]">
          → Push/Pull: {tr('kéo mặt trên khối ngay trên khung nhìn để đổi cao độ.', 'drag a block’s top face in the viewport to change its height.')}
        </p>
      </div>

      {/* ② CẤU KIỆN — tạo CÁI GÌ */}
      <div className="space-y-2 border-t border-[var(--border)] pt-3">
        <p className="px-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--t4)]">
          {tr('Cấu kiện', 'Building components')}
        </p>
        <div className="grid grid-cols-3 gap-2">{NHOM_CAU_KIEN.map(cell)}</div>
      </div>

      {/* ③ BIẾN ĐỔI — sửa THẾ NÀO */}
      <div className="space-y-2 border-t border-[var(--border)] pt-3">
        <p className="px-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--t4)]">
          {tr('Biến đổi', 'Modify')}
        </p>
        <div className="grid grid-cols-3 gap-2">{NHOM_BIEN_DOI.map(cell)}</div>
      </div>
    </div>
  );
}

function MaterialTab({ materials, onPick }: { materials: MaterialSpecLite[]; onPick?: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const tr = useT();

  return (
    <div className="space-y-3">
      {/* Câu cũ ở đây kể chuyện nội bộ với người dùng ("chưa làm — việc riêng") — SPEC-NGON-NGU
          §1 cấm. Sự thật kỹ thuật giữ lại ở comment này: chọn mặt khối trong khung nhìn 3D
          (raycast) CHƯA làm, nên bấm swatch mới chỉ ĐẶT vật liệu đang cầm. */}
      <p className="px-0.5 text-[10.5px] leading-relaxed text-[var(--t4)]">
        {tr('Chọn vật liệu để cầm, rồi bấm lên mặt khối.', 'Pick a material, then click a face.')}
      </p>
      {/* MỘT thư viện chặng 2 (Hoà chốt 04/08): tab này chỉ là kệ nhanh — kho đầy đủ (1449 món
          ATLAS) nằm trong sheet Thư viện, mở đúng kệ vật liệu bằng cửa chung openLibrarySheet. */}
      <button
        type="button"
        onClick={() => openLibrarySheet({ shelfId: 'common-atlas' })}
        className="w-full rounded-[9px] border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-[10.5px] font-medium text-[var(--t2)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
      >
        {tr('Xem cả kho', 'Browse the full library')}
      </button>
      {materials.length === 0 && (
        <p className="px-1 text-center text-[11px] text-[var(--t5)]">{tr('Chưa có vật liệu trong ATLAS.', 'No materials in ATLAS yet.')}</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {materials.map((m) => {
          const active = selectedId === m.id;
          const swatchColor = m.colorHex && /^#?[0-9a-fA-F]{6}$/.test(m.colorHex) ? m.colorHex : 'var(--border-strong)';
          return (
            /* 05/08 VIỆC 2 — tên + SKU dưới ô đều `truncate`, nên tooltip là đường DUY NHẤT đọc
               được tên đầy đủ. Bỏ `title=` (chậm, câm trên tablet — mà đây đúng là panel hay dùng
               bằng bút). `side="right"` vì lưới 3 cột hẹp: tag canh giữa sẽ đè ô bên cạnh.
               `w-full` cả span bọc lẫn nút — span của Tooltip là inline-flex, không tự giãn
               bằng ô lưới. */
            <Tooltip key={m.id} side="right" label={m.name} desc={m.sku ? `Mã: ${m.sku}` : undefined} style={{ width: '100%' }}>
            <button
              onClick={() => { setSelectedId(m.id); onPick?.(m.id); }}
              className={cn(
                'w-full overflow-hidden rounded-[9px] border bg-[var(--field)] text-left transition-colors',
                active ? 'border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--accent-ring)]',
              )}
            >
              {/* G4 (SPEC-VAT-LIEU-PBR-IF §2) — quả cầu render thật thay ô màu phẳng. ATLAS chưa
                  có cột PBR (việc PHU) → loại bề mặt suy từ TÊN, màu 2 tông từ colorHex; cảnh
                  Cầu/Sàn/Vải tự chọn theo loại. Fallback = ô màu cũ khi WebGL tắt. */}
              <MaterialSphere
                className="h-11 w-full"
                spec={{
                  id: m.id,
                  colorA: swatchColor.startsWith('#') ? swatchColor : '#9a9a9a',
                  colorB: darken(swatchColor.startsWith('#') ? swatchColor : '#9a9a9a'),
                  kind: kindFromName(m.name),
                  // Cùng MỘT kiểu xem trước cho mọi vật liệu — `sceneForKind` chỉ trả quả cầu.
                  scene: sceneForKind(kindFromName(m.name)),
                }}
                fallback={swatchColor}
                size={88}
                resolution={0.25}
              />
              <p className="truncate px-1.5 py-1 text-[9px] font-medium text-[var(--t2)]">{m.name}</p>
              {m.sku && <p className="truncate px-1.5 pb-1 text-[8px] text-[var(--accent)]">{m.sku}</p>}
            </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

// Cây đối tượng theo tầng + panel thuộc tính (trước là tab "Hiện" ở đây) đã DỜI sang
// `Object3DTree.tsx` (Navigator) + `Object3DInspector.tsx` (Inspector) — xem comment đầu file
// "VIỆC MỘT THƯ VIỆN". `kindOfGroup`/`labelOfGroup`/`KIND_LABEL_*`/`KIND_DOT` dời sang
// `lib/render-studio/group-kind.ts` để 2 file kia dùng chung, không lệch nhau.

/**
 * VIỆC 2 (05/08) — tab "Sửa" thôi làm placeholder thuần: nay chở BẢNG LOẠI TƯỜNG (Type/Instance
 * kiểu Revit, `WallTypePanel3D.tsx`). Câu chỉ đường cũ GIỮ NGUYÊN bên dưới bảng — nó vẫn đúng và
 * vẫn cần (3 nút khoét hốc/vát cạnh/nhân bản dãy nằm ở Inspector bên phải, không phải ở đây).
 */
function EditTab({ scene }: { scene?: Scene3DData | null }) {
  const tr = useT();
  const [vi, en] = PLACEHOLDER_COPY.sua;
  return (
    <div className="space-y-3">
      <WallTypePanel3D />
      <ArrayGridSection scene={scene ?? null} />
      {/* MỞ KHO 08/08 (`docs/DOI-CHIEU-42-SPEC-2026-08-08.md` §1#1) — 4 mục "Biến đổi" nâng cao,
          cùng khuôn ArrayGridSection ở trên (1 ổ ghi, chọn khối rồi mở panel này). */}
      <ArrayRadialSection scene={scene ?? null} />
      <MirrorSection scene={scene ?? null} />
      <BevelExSection scene={scene ?? null} />
      <TaperSection scene={scene ?? null} />
      <SweepSection scene={scene ?? null} />
      <p className="rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-2.5 text-[10.5px] leading-relaxed text-[var(--t4)]">
        {tr(vi, en)}
      </p>
    </div>
  );
}

/**
 * p14 MỞ KHO — NHÂN BẢN LƯỚI (hàng × cột), nhóm A duy nhất nối được trong vùng phiếu: persist
 * bằng 2 bậc `arrayLinear` CÓ SẴN trong `ops[]` (không kiểu BuildOp mới — `lib/cad/model.ts`
 * ngoài vùng), engine `arrayGrid` ăn qua `resolveGroupGeometry` (`lib/three/build-ops.ts`, grep
 * `applyArrayOps`). Ghi Doc qua `useCadStore.updateEntities` ⇒ vào lịch sử ⇒ **Ctrl+Z lùi được**
 * (KS4, phím đã có sẵn ở nơi mount). Selection đọc từ store chia sẻ `useTree3DUi` (cùng nguồn
 * Navigator/Inspector) — panel không cần prop mới từ nơi mount (nơi mount ngoài vùng phiếu).
 *
 * Chưa chọn khối / khối không phải khối đùn ⇒ khoá + LÝ DO LỘ MẶT tại chỗ (bài học màn rỗng
 * 07/08 — không giấu trong tooltip). Lưới ≤1×1 = gỡ nhân bản (nút "Gỡ" riêng, có chữ — G6/G8).
 */
function ArrayGridSection({ scene }: { scene: Scene3DData | null }) {
  const tr = useT();
  const selectedName = useTree3DUi((s) => s.selectedName);
  const group = scene?.groups.find((gr) => gr.name === selectedName) ?? null;
  // ops chỉ chảy qua hatch tường/khối đùn (`cad-to-obj.ts` `wallHatches.forEach` — grep `h.ops`):
  // group hợp lệ = có entityId VÀ heightMm (cùng điều kiện khối massing).
  const entityId = group?.entityId && group.heightMm ? group.entityId : null;
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(2);
  const [dxMm, setDxMm] = useState(1200);
  const [dyMm, setDyMm] = useState(900);

  const entity = useCadStore((s) => (entityId ? s.doc.entities.find((e) => e.id === entityId) : undefined));
  const hasGrid = (entity?.ops ?? []).filter((op) => op.op === 'arrayLinear').length > 0;

  // MỘT nguồn ghi ops (chung với dòng nhập nhanh ③) — `lib/render-studio/array-grid-ops.ts`.
  const apply = (grid: boolean) => {
    if (!entityId) return;
    applyArrayGrid(entityId, grid ? { cols, rows, dxMm, dyMm } : null);
  };

  const num =
    'w-full rounded-[7px] border border-[var(--border)] bg-[var(--field)] px-1.5 py-1 text-right text-[11px] tabular-nums text-[var(--t1)] outline-none focus:border-[var(--accent-ring)]';
  const lab = 'text-[9px] font-medium leading-[1.5] text-[var(--t4)]';

  return (
    <div className="space-y-2 rounded-[10px] border border-[var(--border)] p-2">
      {/* Hoà chốt 08/08 (②): LỆNH DỰNG HÌNH giữ TÊN ANH (thuật ngữ nghề quốc tế — dân 3ds Max/
          SketchUp đọc là hiểu), dòng nhỏ dưới là giải thích tiếng Việt. Chỉ áp cho tên LỆNH —
          nhãn ô nhập/lý do khoá vẫn theo ngôn ngữ giao diện. Chốt ghi ở docs/00-CHOT.md. */}
      <p className="px-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--t2)]">
        Array
      </p>
      <p className="-mt-1 px-0.5 text-[9px] leading-[1.5] text-[var(--t4)]">
        {tr('lặp khối theo lưới hàng × cột', 'repeat the block in a rows × columns grid')}
      </p>
      {!entityId ? (
        // LÝ DO KHOÁ LỘ MẶT — không tooltip (điều khoản phiếu p14 · bài học màn rỗng 07/08)
        <p className="rounded-[8px] border border-dashed border-[var(--border)] px-2 py-2 text-[10.5px] leading-relaxed text-[var(--t4)]">
          {group
            ? tr(
                'Khối đang chọn chưa nhân bản được — hiện chỉ áp cho khối đùn có cao độ (tường, khối dựng).',
                'This block can’t be arrayed yet — only extruded blocks with a height (walls, massing) support it.',
              )
            : tr('Chưa chọn khối — bấm một khối trên khung nhìn trước.', 'No block selected — click a block in the viewport first.')}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <label className={lab}>
              {tr('Số cột (trục X)', 'Columns (X axis)')}
              <input type="number" min={1} className={num} value={cols} onChange={(e) => setCols(Number(e.target.value))} />
            </label>
            <label className={lab}>
              {tr('Khoảng cột (mm)', 'Column spacing (mm)')}
              <input type="number" step={50} className={num} value={dxMm} onChange={(e) => setDxMm(Number(e.target.value))} />
            </label>
            <label className={lab}>
              {tr('Số hàng (trục Y)', 'Rows (Y axis)')}
              <input type="number" min={1} className={num} value={rows} onChange={(e) => setRows(Number(e.target.value))} />
            </label>
            <label className={lab}>
              {tr('Khoảng hàng (mm)', 'Row spacing (mm)')}
              <input type="number" step={50} className={num} value={dyMm} onChange={(e) => setDyMm(Number(e.target.value))} />
            </label>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={cols <= 1 && rows <= 1}
              onClick={() => apply(true)}
              className={cn(
                'flex-1 rounded-[8px] border px-2 py-1.5 text-[10.5px] font-semibold transition-colors',
                cols <= 1 && rows <= 1
                  ? 'cursor-not-allowed border-dashed border-[var(--border)] text-[var(--t5)]'
                  : 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)] hover:border-[var(--accent)]',
              )}
            >
              {/* ② — tên lệnh giữ EN, giải thích VI nằm dòng phụ đầu mục */}
              Array
            </button>
            {hasGrid && (
              <button
                type="button"
                onClick={() => apply(false)}
                title={tr('gỡ lưới đã áp', 'remove the applied grid')}
                className="rounded-[8px] border border-[var(--border)] px-2 py-1.5 text-[10.5px] font-medium text-[var(--t3)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
              >
                Remove
              </button>
            )}
          </div>
          {cols <= 1 && rows <= 1 && (
            <p className="px-0.5 text-[9.5px] leading-[1.5] text-[var(--t5)]">
              {tr('Cần ít nhất 2 hàng hoặc 2 cột mới thành lưới.', 'Needs at least 2 rows or 2 columns to form a grid.')}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════ MỞ KHO 08/08 — 4 mục "Biến đổi" nâng cao ═══════════════════════
 * `docs/DOI-CHIEU-42-SPEC-2026-08-08.md` §1#1: 9 hàm engine `lib/three/build-ops.ts` viết xong+test
 * 07/08 nay có chỗ LƯU (`BuildOp` union mới, `lib/cad/model.ts`) + panel THẬT — cùng khuôn
 * `ArrayGridSection` phía trên (chọn khối trên khung nhìn → mở mục tương ứng ở đây, ghi qua
 * `useCadStore.updateEntities` ⇒ Ctrl+Z lùi được, KS4). Revolve/Loft KHÔNG có mục ở đây — cần UI vẽ
 * tiết diện nhiều điểm mà `Command3DPanel`/`Object3DTree` chưa có (ngoài vùng phiếu, xem 2 ô mờ
 * "Revolve"/"Loft" trong `NHOM_BIEN_DOI` — lý do lộ đúng chỗ đó, không giấu).
 */

/** DÙNG CHUNG cho 5 mục dưới — cùng điều kiện hợp lệ `ArrayGridSection` đã dùng (group phải có
 * `entityId` VÀ `heightMm`: `ops` chỉ chảy qua nhánh khối đùn ở `cad-to-obj.ts`). Gom 1 chỗ để
 * không chép lại 3 dòng giống hệt nhau × 5 lần. */
function useSelected3DEntity(scene: Scene3DData | null) {
  const selectedName = useTree3DUi((s) => s.selectedName);
  const group = scene?.groups.find((gr) => gr.name === selectedName) ?? null;
  const entityId = group?.entityId && group.heightMm ? group.entityId : null;
  const entity = useCadStore((s) => (entityId ? s.doc.entities.find((e) => e.id === entityId) : undefined));
  return { group, entityId, entity };
}

/** LÝ DO KHOÁ LỘ MẶT dùng chung — cùng câu `ArrayGridSection` (bài học màn rỗng 07/08, không giấu
 * trong tooltip). */
function NoSelectionNote({ group, tr }: { group: unknown; tr: (vi: string, en: string) => string }) {
  return (
    <p className="rounded-[8px] border border-dashed border-[var(--border)] px-2 py-2 text-[10.5px] leading-relaxed text-[var(--t4)]">
      {group
        ? tr(
            'Khối đang chọn chưa áp được — hiện chỉ áp cho khối đùn có cao độ (tường, khối dựng).',
            'This block isn’t supported yet — only extruded blocks with a height (walls, massing) work.',
          )
        : tr('Chưa chọn khối — bấm một khối trên khung nhìn trước.', 'No block selected — click a block in the viewport first.')}
    </p>
  );
}

const numCls =
  'w-full rounded-[7px] border border-[var(--border)] bg-[var(--field)] px-1.5 py-1 text-right text-[11px] tabular-nums text-[var(--t1)] outline-none focus:border-[var(--accent-ring)]';
const labCls = 'text-[9px] font-medium leading-[1.5] text-[var(--t4)]';
const sectionTitle = (en: string) => (
  <p className="px-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--t2)]">{en}</p>
);
const applyBtnCls = (enabled: boolean) =>
  cn(
    'flex-1 rounded-[8px] border px-2 py-1.5 text-[10.5px] font-semibold transition-colors',
    enabled
      ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)] hover:border-[var(--accent)]'
      : 'cursor-not-allowed border-dashed border-[var(--border)] text-[var(--t5)]',
  );
const removeBtnCls =
  'rounded-[8px] border border-[var(--border)] px-2 py-1.5 text-[10.5px] font-medium text-[var(--t3)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]';

/** Array Radial — mảng vòng tròn quanh trục đứng. Tâm mặc định = TÂM bbox của khối đang chọn
 * (`entityBox`, không bắt gõ tay — cùng cách `ArrayAction` Object3DInspector suy trục dài tường). */
function ArrayRadialSection({ scene }: { scene: Scene3DData | null }) {
  const tr = useT();
  const { group, entityId, entity } = useSelected3DEntity(scene);
  const box = entity ? entityBox(entity) : null;
  const defCx = box && Number.isFinite(box.minX) ? Math.round((box.minX + box.maxX) / 2) : 0;
  const defCy = box && Number.isFinite(box.minY) ? Math.round((box.minY + box.maxY) / 2) : 0;
  const [n, setN] = useState(6);
  const [cx, setCx] = useState(defCx);
  const [cy, setCy] = useState(defCy);
  const [sweepDeg, setSweepDeg] = useState(360);
  const current = entity?.ops?.find((op) => op.op === 'arrayRadial') as { n: number } | undefined;

  const apply = (on: boolean) => {
    if (!entity) return;
    const updated = setEntityArrayRadial(entity, on ? { n, centerXMm: cx, centerYMm: cy, sweepDeg } : null);
    useCadStore.getState().updateEntities([updated]);
    useCadStore.getState().setStatus(on ? `Array Radial ×${n} — Ctrl+Z để lùi` : 'Đã gỡ Array Radial — Ctrl+Z để lùi');
  };

  return (
    <div className="space-y-2 rounded-[10px] border border-[var(--border)] p-2">
      {sectionTitle('Array Radial')}
      <p className="-mt-1 px-0.5 text-[9px] leading-[1.5] text-[var(--t4)]">
        {tr('nhân bản vòng tròn quanh 1 tâm', 'repeat around a center point in a circle')}
      </p>
      {!entityId ? (
        <NoSelectionNote group={group} tr={tr} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <label className={labCls}>
              {tr('Số bản', 'Count')}
              <input type="number" min={2} className={numCls} value={n} onChange={(e) => setN(Number(e.target.value))} />
            </label>
            <label className={labCls}>
              {tr('Góc quét (độ)', 'Sweep (deg)')}
              <input type="number" step={5} className={numCls} value={sweepDeg} onChange={(e) => setSweepDeg(Number(e.target.value))} />
            </label>
            <label className={labCls}>
              {tr('Tâm X (mm)', 'Center X (mm)')}
              <input type="number" step={50} className={numCls} value={cx} onChange={(e) => setCx(Number(e.target.value))} />
            </label>
            <label className={labCls}>
              {tr('Tâm Y (mm)', 'Center Y (mm)')}
              <input type="number" step={50} className={numCls} value={cy} onChange={(e) => setCy(Number(e.target.value))} />
            </label>
          </div>
          <div className="flex gap-1.5">
            <button type="button" disabled={n <= 1} onClick={() => apply(true)} className={applyBtnCls(n > 1)}>
              Array Radial
            </button>
            {current && (
              <button type="button" onClick={() => apply(false)} title={tr('gỡ mảng đã áp', 'remove the applied array')} className={removeBtnCls}>
                Remove
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Mirror — đối xứng gương qua 1 mặt phẳng vuông góc trục CAD. `atMm` mặc định = TÂM bbox theo
 * trục đang chọn (đổi trục thì đổi luôn mặc định, đỡ phải tính tay). */
function MirrorSection({ scene }: { scene: Scene3DData | null }) {
  const tr = useT();
  const { group, entityId, entity } = useSelected3DEntity(scene);
  const box = entity ? entityBox(entity) : null;
  const [axis, setAxis] = useState<'x' | 'y' | 'z'>('x');
  const centerFor = (a: 'x' | 'y' | 'z') => {
    if (!box || !Number.isFinite(box.minX)) return 0;
    if (a === 'x') return Math.round((box.minX + box.maxX) / 2);
    if (a === 'y') return Math.round((box.minY + box.maxY) / 2);
    return 0; // trục z (cao độ) — không có bbox Z ở entityBox 2D, mặc định 0
  };
  const [atMm, setAtMm] = useState(() => centerFor('x'));
  const [withOriginal, setWithOriginal] = useState(true);
  const current = entity?.ops?.find((op) => op.op === 'mirror') as { axis: string } | undefined;

  const apply = (on: boolean) => {
    if (!entity) return;
    const updated = setEntityMirror(entity, on ? { axis, atMm, withOriginal } : null);
    useCadStore.getState().updateEntities([updated]);
    useCadStore.getState().setStatus(on ? `Mirror qua trục ${axis} — Ctrl+Z để lùi` : 'Đã gỡ Mirror — Ctrl+Z để lùi');
  };

  return (
    <div className="space-y-2 rounded-[10px] border border-[var(--border)] p-2">
      {sectionTitle('Mirror')}
      <p className="-mt-1 px-0.5 text-[9px] leading-[1.5] text-[var(--t4)]">
        {tr('đối xứng gương qua 1 mặt phẳng', 'mirror across a plane')}
      </p>
      {!entityId ? (
        <NoSelectionNote group={group} tr={tr} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <label className={labCls}>
              {tr('Trục gương', 'Mirror axis')}
              <select
                className={numCls + ' text-left'}
                value={axis}
                onChange={(e) => {
                  const a = e.target.value as 'x' | 'y' | 'z';
                  setAxis(a);
                  setAtMm(centerFor(a));
                }}
              >
                <option value="x">X</option>
                <option value="y">Y</option>
                <option value="z">Z ({tr('cao độ', 'elevation')})</option>
              </select>
            </label>
            <label className={labCls}>
              {tr('Vị trí mặt gương (mm)', 'Plane position (mm)')}
              <input type="number" step={10} className={numCls} value={atMm} onChange={(e) => setAtMm(Number(e.target.value))} />
            </label>
          </div>
          <label className="flex items-center gap-1.5 px-0.5 text-[10px] text-[var(--t3)]">
            <input type="checkbox" checked={withOriginal} onChange={(e) => setWithOriginal(e.target.checked)} />
            {tr('Giữ bản gốc (tủ đôi)', 'Keep the original (twin cabinet)')}
          </label>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => apply(true)} className={applyBtnCls(true)}>
              Mirror
            </button>
            {current && (
              <button type="button" onClick={() => apply(false)} title={tr('gỡ mirror đã áp', 'remove the applied mirror')} className={removeBtnCls}>
                Remove
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const BEVEL_EX_EDGE_OPTS: { value: 'all' | 'vertical' | 'top'; vi: string; en: string }[] = [
  { value: 'top', vi: 'cạnh trên', en: 'top' },
  { value: 'vertical', vi: '4 góc đứng', en: 'vertical' },
  { value: 'all', vi: 'cả hai', en: 'both' },
];

/** Chamfer / Fillet — bo/vát nâng cao (`bevelEx`, `prismBeveledEx`): `segments=1` = vát phẳng
 * (chamfer), `segments>=2` = bo tròn (fillet/bevel). MỘT mục cho cả hai — chỉ khác số đoạn chia. */
function BevelExSection({ scene }: { scene: Scene3DData | null }) {
  const tr = useT();
  const { group, entityId, entity } = useSelected3DEntity(scene);
  const [radiusMm, setRadiusMm] = useState(30);
  const [segments, setSegments] = useState(1);
  const [edges, setEdges] = useState<'all' | 'vertical' | 'top'>('top');
  const current = entity?.ops?.find((op) => op.op === 'bevelEx') as { radiusMm: number } | undefined;

  const apply = (on: boolean) => {
    if (!entity) return;
    const updated = setEntityBevelEx(entity, { radiusMm: on ? radiusMm : 0, segments, edges });
    useCadStore.getState().updateEntities([updated]);
    useCadStore.getState().setStatus(on ? `${segments <= 1 ? 'Chamfer' : 'Fillet'} ${radiusMm}mm — Ctrl+Z để lùi` : 'Đã gỡ — Ctrl+Z để lùi');
  };

  return (
    <div className="space-y-2 rounded-[10px] border border-[var(--border)] p-2">
      {sectionTitle('Chamfer / Fillet')}
      <p className="-mt-1 px-0.5 text-[9px] leading-[1.5] text-[var(--t4)]">
        {tr('vát phẳng (1 đoạn) hoặc bo tròn (≥2 đoạn) cạnh khối', 'flat chamfer (1 segment) or rounded fillet (≥2 segments)')}
      </p>
      {!entityId ? (
        <NoSelectionNote group={group} tr={tr} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <label className={labCls}>
              {tr('Bán kính (mm)', 'Radius (mm)')}
              <input type="number" min={1} className={numCls} value={radiusMm} onChange={(e) => setRadiusMm(Number(e.target.value))} />
            </label>
            <label className={labCls}>
              {tr('Số đoạn chia', 'Segments')}
              <input type="number" min={1} className={numCls} value={segments} onChange={(e) => setSegments(Math.max(1, Number(e.target.value)))} />
            </label>
            <label className={labCls + ' col-span-2'}>
              {tr('Cạnh', 'Edges')}
              <select className={numCls + ' text-left'} value={edges} onChange={(e) => setEdges(e.target.value as 'all' | 'vertical' | 'top')}>
                {BEVEL_EX_EDGE_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>{tr(o.vi, o.en)}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-1.5">
            <button type="button" disabled={radiusMm <= 0} onClick={() => apply(true)} className={applyBtnCls(radiusMm > 0)}>
              {segments <= 1 ? 'Chamfer' : 'Fillet'}
            </button>
            {current && (
              <button type="button" onClick={() => apply(false)} title={tr('gỡ đã áp', 'remove the applied edge')} className={removeBtnCls}>
                Remove
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Taper — lăng trụ thu nhỏ dần lên đỉnh (chân bàn côn). */
function TaperSection({ scene }: { scene: Scene3DData | null }) {
  const tr = useT();
  const { group, entityId, entity } = useSelected3DEntity(scene);
  const [topInsetMm, setTopInsetMm] = useState(20);
  const current = entity?.ops?.find((op) => op.op === 'taper') as { topInsetMm: number } | undefined;

  const apply = (on: boolean) => {
    if (!entity) return;
    const updated = setEntityTaper(entity, on ? topInsetMm : 0);
    useCadStore.getState().updateEntities([updated]);
    useCadStore.getState().setStatus(on ? `Taper ${topInsetMm}mm — Ctrl+Z để lùi` : 'Đã gỡ Taper — Ctrl+Z để lùi');
  };

  return (
    <div className="space-y-2 rounded-[10px] border border-[var(--border)] p-2">
      {sectionTitle('Taper')}
      <p className="-mt-1 px-0.5 text-[9px] leading-[1.5] text-[var(--t4)]">
        {tr('thu nhỏ dần lên đỉnh (chân bàn côn)', 'narrow toward the top (tapered leg)')}
      </p>
      {!entityId ? (
        <NoSelectionNote group={group} tr={tr} />
      ) : (
        <>
          <label className={labCls}>
            {tr('Co đỉnh (mm mỗi phía)', 'Top inset (mm per side)')}
            <input type="number" min={1} className={numCls} value={topInsetMm} onChange={(e) => setTopInsetMm(Number(e.target.value))} />
          </label>
          <div className="flex gap-1.5">
            <button type="button" disabled={topInsetMm <= 0} onClick={() => apply(true)} className={applyBtnCls(topInsetMm > 0)}>
              Taper
            </button>
            {current && (
              <button type="button" onClick={() => apply(false)} title={tr('gỡ Taper đã áp', 'remove the applied taper')} className={removeBtnCls}>
                Remove
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Sweep — MVP tiết diện CHỮ NHẬT (width×height) quét dọc đường bao/đường tim của chính khối đang
 * chọn (`entityFootprintMm`/`entityPathMm`, `lib/cad/commands.ts` `setEntitySweep`). Đủ cho phào
 * chỉ/nẹp vuông áp quanh 1 tường; tiết diện tuỳ ý (đa giác nhiều điểm) CHƯA có UI vẽ — engine
 * (`sweepProfile`) đã sẵn cho khi UI đó có, không cần đổi lại op. */
function SweepSection({ scene }: { scene: Scene3DData | null }) {
  const tr = useT();
  const { group, entityId, entity } = useSelected3DEntity(scene);
  const [widthMm, setWidthMm] = useState(50);
  const [heightMm, setHeightMm] = useState(80);
  const current = entity?.ops?.find((op) => op.op === 'sweep') as { profileMm: unknown } | undefined;

  const apply = (on: boolean) => {
    if (!entity) return;
    const updated = setEntitySweep(entity, on ? { widthMm, heightMm } : null);
    useCadStore.getState().updateEntities([updated]);
    useCadStore.getState().setStatus(on ? `Sweep ${widthMm}×${heightMm}mm — Ctrl+Z để lùi` : 'Đã gỡ Sweep — Ctrl+Z để lùi');
  };

  return (
    <div className="space-y-2 rounded-[10px] border border-[var(--border)] p-2">
      {sectionTitle('Sweep')}
      <p className="-mt-1 px-0.5 text-[9px] leading-[1.5] text-[var(--t4)]">
        {tr('quét tiết diện chữ nhật dọc đường bao khối (phào chỉ)', 'sweep a rectangular profile along the block outline (moulding)')}
      </p>
      {!entityId ? (
        <NoSelectionNote group={group} tr={tr} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <label className={labCls}>
              {tr('Rộng (mm)', 'Width (mm)')}
              <input type="number" min={1} className={numCls} value={widthMm} onChange={(e) => setWidthMm(Number(e.target.value))} />
            </label>
            <label className={labCls}>
              {tr('Cao (mm)', 'Height (mm)')}
              <input type="number" min={1} className={numCls} value={heightMm} onChange={(e) => setHeightMm(Number(e.target.value))} />
            </label>
          </div>
          <div className="flex gap-1.5">
            <button type="button" disabled={widthMm <= 0 || heightMm <= 0} onClick={() => apply(true)} className={applyBtnCls(widthMm > 0 && heightMm > 0)}>
              Sweep
            </button>
            {current && (
              <button type="button" onClick={() => apply(false)} title={tr('gỡ Sweep đã áp', 'remove the applied sweep')} className={removeBtnCls}>
                Remove
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

type PlaceholderKey = Exclude<Tab, 'vatlieu' | 'tao' | 'den' | 'banve'>;

// Camera GIỮ placeholder (không bịa ô nhập số vô chủ — spec §6.2 cần model camera thật trong Doc
// trước, hôm nay chưa có; input "sống nhưng không lưu gì" tệ hơn câu "sắp có" trung thực).
// VIỆC 1 (nối extrude/arrayLinear thật) — sửa lại câu "sua" ĐANG SAI: từng nói "Bevel... sắp có"
// dù bản thân tab này không chứa nút bevel/khoét hốc/nhân bản dãy (3 nút đó nằm ở Inspector bên
// phải khi chọn tường, cùng chỗ với `CutHoleAction` boolean đã xong trước đó — panel này chưa
// từng cập nhật theo). Câu mới không hứa gì tab này KHÔNG chứa — chỉ TRỎ đúng nơi có thật.
const PLACEHOLDER_COPY: Record<PlaceholderKey, [string, string]> = {
  sua: [
    'Đẩy-kéo cao độ dùng ngay trên khối (kéo mặt trên). Khoét hốc · vát cạnh (bevel) · nhân bản dãy — chọn 1 tường rồi mở panel bên phải. Nhập số tay — sắp có.',
    'Push-pull height works directly on the block (drag the top face). Cut a hole · bevel · linear array — select a wall, then open the right-side panel. Manual numeric input — coming soon.',
  ],
  camera: ['Đặt camera · đường cam (campath) — sắp có.', 'Place camera · camera path — coming soon.'],
};

function PlaceholderTab({ tab }: { tab: PlaceholderKey }) {
  const tr = useT();
  const [vi, en] = PLACEHOLDER_COPY[tab];
  return (
    <div className="rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-3 text-center text-[11px] leading-relaxed text-[var(--t4)]">
      {tr(vi, en)}
    </div>
  );
}
