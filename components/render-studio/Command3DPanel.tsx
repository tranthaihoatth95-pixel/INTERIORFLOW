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
import {
  Plus, Pencil, Palette, Camera, Square, DoorClosed, AppWindow, TrendingUp,
  CornerUpRight, RotateCw, Fence, Minus, PanelTop, Archive,
} from 'lucide-react';
import { useMaterials, type MaterialSpecLite } from '@/lib/render-studio/use-materials';
import MaterialSphere from '@/components/three/MaterialSphere';
import { darken, kindFromName, sceneForKind } from '@/components/three/material-preview';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';

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
export type Command3DTab = 'tao' | 'sua' | 'vatlieu' | 'camera';
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
}

const TABS: { id: Tab; icon: typeof Plus; label: [string, string] }[] = [
  { id: 'tao', icon: Plus, label: ['Tạo', 'Create'] },
  { id: 'sua', icon: Pencil, label: ['Sửa', 'Edit'] },
  { id: 'vatlieu', icon: Palette, label: ['Vật liệu', 'Material'] },
  { id: 'camera', icon: Camera, label: ['Camera', 'Camera'] },
];

export default function Command3DPanel({
  tab,
  onTabChange,
  nhayNutTuong = false,
  onTaoTuong,
  onTaoLanCan,
  onPickMaterial,
}: Command3DPanelProps) {
  const setTab = onTabChange;
  const tr = useT();
  const materials = useMaterials(true);

  return (
    <div className="mat-panel flex h-full w-64 shrink-0 flex-col border-r border-[var(--border)]">
      <div className="flex border-b border-[var(--border)]">
        {TABS.map(({ id, icon: Icon, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 px-0.5 py-2 text-[10px] transition-colors',
                active ? 'font-semibold text-[var(--accent)] shadow-[inset_0_-2px_0_var(--accent)]' : 'text-[var(--t4)] hover:text-[var(--t2)]',
              )}
              title={tr(label[0], label[1])}
            >
              <Icon size={14} />
              {tr(label[0], label[1])}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'vatlieu' && <MaterialTab materials={materials} onPick={onPickMaterial} />}
        {tab === 'tao' && <CreateTab nhayNutTuong={nhayNutTuong} onTaoTuong={onTaoTuong} onTaoLanCan={onTaoLanCan} />}
        {tab !== 'vatlieu' && tab !== 'tao' && <PlaceholderTab tab={tab} />}
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
const CAU_KIEN_TANG_6: { id: string; vi: string; en: string; icon: typeof Square; lam?: boolean; reason?: [string, string] }[] = [
  { id: 'tuong', vi: 'Tường', en: 'Wall', icon: Square, lam: true },
  {
    id: 'cua', vi: 'Cửa', en: 'Door', icon: DoorClosed,
    reason: [
      'Dựng được rồi — kéo khối cửa từ thư viện đồ vào tường, tự khoét lỗ (ops[] boolean). Nút tạo trực tiếp ở đây chưa nối cùng luồng.',
      'Already works — drag a door block from the library onto a wall, it auto-cuts the opening (ops[] boolean). This create button just isn’t wired to that flow yet.',
    ],
  },
  {
    id: 'cuaso', vi: 'Cửa sổ', en: 'Window', icon: AppWindow,
    reason: [
      'Dựng được rồi — kéo khối cửa sổ từ thư viện đồ vào tường, tự khoét lỗ + lắp kính (ops[] boolean). Nút tạo trực tiếp ở đây chưa nối cùng luồng.',
      'Already works — drag a window block from the library onto a wall, it auto-cuts the opening and fits glass (ops[] boolean). This create button just isn’t wired to that flow yet.',
    ],
  },
  {
    id: 'thang-thang', vi: 'Cầu thang thẳng', en: 'Straight stair', icon: TrendingUp,
    reason: [
      'Chưa có lệnh tham số cầu thang (tầng ⑥) — extrude/array/boolean đã sẵn, chưa ai ráp thành lệnh riêng loại này.',
      'No parametric stair command yet (tier ⑥) — extrude/array/boolean already work, nobody has assembled this specific command yet.',
    ],
  },
  {
    id: 'thang-gap', vi: 'Cầu thang gấp khúc', en: 'Switchback stair', icon: CornerUpRight,
    reason: [
      'Chưa có lệnh tham số cầu thang (tầng ⑥) — extrude/array/boolean đã sẵn, chưa ai ráp thành lệnh riêng loại này.',
      'No parametric stair command yet (tier ⑥) — extrude/array/boolean already work, nobody has assembled this specific command yet.',
    ],
  },
  {
    id: 'thang-xoan', vi: 'Cầu thang xoắn', en: 'Spiral stair', icon: RotateCw,
    reason: [
      'Chưa có lệnh tham số cầu thang (tầng ⑥) — extrude/array/boolean đã sẵn, chưa ai ráp thành lệnh riêng loại này.',
      'No parametric stair command yet (tier ⑥) — extrude/array/boolean already work, nobody has assembled this specific command yet.',
    ],
  },
  { id: 'lancan', vi: 'Lan can', en: 'Railing', icon: Fence, lam: true },
  {
    id: 'phaochi', vi: 'Phào chỉ', en: 'Moulding', icon: Minus,
    reason: [
      'Phào chỉ cần lệnh "sweep" (quét tiết diện theo đường) — tầng ③ mới nối extrude/lathe, sweep chưa code.',
      'Moulding needs a "sweep" command (profile swept along a path) — tier ③ only has extrude/lathe wired so far, sweep isn’t built.',
    ],
  },
  {
    id: 'tranthar', vi: 'Trần thả', en: 'Drop ceiling', icon: PanelTop,
    reason: [
      'Cần khối NỔI (đặt lơ lửng giữa sàn/trần) — tường hôm nay luôn đùn từ sàn z=0, chưa có cơ chế đặt khối treo.',
      'Needs a floating block (suspended mid-height) — walls today always extrude from the floor (z=0), no mechanism yet for a suspended block.',
    ],
  },
  {
    id: 'tubep', vi: 'Tủ bếp module', en: 'Kitchen cabinet module', icon: Archive,
    reason: [
      'Cần bộ tham số module (rộng/sâu/cao theo chuẩn tủ bếp) — chưa ai ráp thành lệnh, dù mảng (array) đã dùng được để lặp module.',
      'Needs a module parameter set (width/depth/height per cabinet standard) — nobody has assembled the command yet, even though array can already repeat modules.',
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
const KHOI_CO_BAN: [string, string][] = [
  ['Hộp', 'Box'], ['Sàn', 'Floor'], ['Mái', 'Roof'],
];

function CreateTab({
  nhayNutTuong,
  onTaoTuong,
  onTaoLanCan,
}: {
  nhayNutTuong: boolean;
  onTaoTuong?: () => void;
  onTaoLanCan?: () => void;
}) {
  const CAU_KIEN_HANDLER: Partial<Record<string, (() => void) | undefined>> = { tuong: onTaoTuong, lancan: onTaoLanCan };
  const CAU_KIEN_TIP: Partial<Record<string, [string, string]>> = {
    tuong: ['Đoạn 4m, dày 220 — sửa được sau', '4m segment, 220 thick — editable'],
    lancan: ['9 cột 60×60mm cách 300mm — chưa có tay vịn ngang (N5)', '9 posts 60×60mm at 300mm spacing — no top rail yet (N5)'],
  };
  const tr = useT();
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="px-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--t4)]">
          {tr('Khối cơ bản', 'Basic blocks')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {KHOI_CO_BAN.map(([vi, en]) => (
            <Tooltip key={vi} side="right" label={tr('Chưa dựng được — hiện dùng Tường hoặc đùn từ bản vẽ', 'Not available yet — use Wall or extrude from the drawing')}>
              <button
                type="button"
                disabled
                className="flex aspect-square w-full cursor-not-allowed flex-col items-center justify-center rounded-[9px] border border-dashed border-[var(--border)] px-2 py-2 text-[10.5px] text-[var(--t5)]"
              >
                {tr(vi, en)}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-[var(--border)] pt-3">
        <p className="px-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--t4)]">
          {tr('Cấu kiện', 'Building components')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {CAU_KIEN_TANG_6.map(({ id, vi, en, icon: Icon, lam, reason }) => {
            // Tường vừa gộp về đây (LỖI 1) — GIỮ hiệu ứng nháy chỉ dẫn `nhayNutTuong` (trước ở
            // nút đứng riêng), chỉ đổi CHỖ hiển thị, không đổi Ý NGHĨA của tín hiệu đó.
            const nhay = id === 'tuong' && nhayNutTuong;
            return (
              <Tooltip
                key={id}
                side="right"
                label={
                  lam
                    ? tr(...(CAU_KIEN_TIP[id] ?? ['Sửa được sau', 'Editable afterwards']))
                    : tr(...(reason ?? ['Chưa dựng được', 'Not available yet']))
                }
              >
                <button
                  type="button"
                  disabled={!lam}
                  onClick={lam ? CAU_KIEN_HANDLER[id] : undefined}
                  className={cn(
                    'flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-[9px] border p-1 text-center text-[9.5px] font-medium transition-colors',
                    nhay
                      ? 'animate-pulse cursor-pointer border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : lam
                        ? 'cursor-pointer border-[var(--border)] bg-[var(--panel)] text-[var(--t2)] hover:border-[var(--accent-ring)] hover:text-[var(--accent)]'
                        : 'cursor-not-allowed border-dashed border-[var(--border)] text-[var(--t5)] opacity-45',
                  )}
                >
                  <Icon size={15} strokeWidth={1.7} />
                  <span className="leading-tight">{tr(vi, en)}</span>
                </button>
              </Tooltip>
            );
          })}
        </div>
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
            <button
              key={m.id}
              onClick={() => { setSelectedId(m.id); onPick?.(m.id); }}
              className={cn(
                'overflow-hidden rounded-[9px] border bg-[var(--field)] text-left transition-colors',
                active ? 'border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--accent-ring)]',
              )}
              title={`${m.name}${m.sku ? ` · ${m.sku}` : ''}`}
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

type PlaceholderKey = Exclude<Tab, 'vatlieu' | 'tao'>;

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
