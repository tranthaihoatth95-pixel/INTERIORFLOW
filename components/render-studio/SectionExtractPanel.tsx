'use client';

/**
 * components/render-studio/SectionExtractPanel.tsx — VIỆC 2 (S2 BUILD#1, 05/08):
 * **NỐI `lib/three/section-entities.ts` VÀO ỨNG DỤNG.**
 *
 * Trước phiên này module đó xong 452 dòng + 54 test nhưng
 * `grep -rn "sectionToEntities" app/ components/` = **0 dòng** — dựng được khối 3D nhưng không rút
 * được một đường 2D nào ra bản vẽ, chuỗi mood → layout → mặt đứng → phối cảnh đứt ở giữa.
 *
 * ⛔ **CHECKPOINT DUYỆT LÀ BẮT BUỘC** (Hoà chốt: *"kiến trúc sư ghét cảm giác mông lung khi AI tạo
 * ra sản phẩm không đồng nhất — từ flow lớn đến flow nhỏ phải có checkpoint và thấy được sản phẩm
 * để duyệt"*). Panel này TUYỆT ĐỐI không ghi thẳng vào `Doc`: bấm "Xem trước" chỉ TÍNH (hàm thuần,
 * không đụng store) → mở `SectionPreviewOverlay` vẽ đúng hình sắp nhận → người bấm "Nhận vào bản
 * vẽ" thì nơi mount mới ghi. Bấm Huỷ = mất trắng, Doc không suy suyển một byte.
 *
 * K1 — KHÔNG có `sync3DTo2D`: đây là ĐỌC scene (vốn tính ra từ chính `Doc`) rồi GHI entity mới vào
 * CHÍNH `Doc` đó. Một kho, hai ống kính; không có kho thứ hai để mà đồng bộ.
 *
 * Panel không tự ghi store — cùng khuôn `onTaoTuong`/`onTaoLanCan` đã có ở `Command3DPanel`:
 * nơi mount (`Render3DModeSkeleton`) giữ quyền ghi `Doc`.
 */

import { useMemo, useState } from 'react';
import { useCadStore } from '@/lib/cad/store';
import { Scissors, Eye, Loader2 } from 'lucide-react';
import type { Entity } from '@/lib/cad/model';
import type { Scene3DData } from '@/lib/three/cad-to-obj';
import type { SectionSpec } from '@/lib/three/section';
import {
  sectionReport,
  elevationToEntities,
  SECTION_CUT_LAYER,
  SECTION_VIEW_LAYER,
  SECTION_FAR_LAYER,
  SECTION_LAYERS,
  type SectionReport,
} from '@/lib/three/section-entities';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';
import { SectionPreviewOverlay } from './SectionPreviewOverlay';
import type { CheckpointParam } from '@/components/studio/Checkpoint';
import { NHAN_NHO } from './nhan-nho';

/** Tên layer người dùng đặt — khoá kỹ thuật (`S-CUT`…) giữ nguyên bên trong, chỉ TÊN đổi. */
export interface SectionLayerNames {
  cut: string;
  view: string;
  far: string;
}

export interface SectionAcceptPayload {
  entities: Entity[];
  layerNames: SectionLayerNames;
  /** để nơi mount ghi câu status đúng việc vừa làm, không đoán lại. */
  label: string;
}

export interface SectionExtractPanelProps {
  scene: Scene3DData | null;
  /** nơi mount ghi vào `Doc` (panel không tự ghi — xem docstring đầu file). */
  onNhan?: (payload: SectionAcceptPayload) => void;
}

type Mode = 'section' | 'elevation';

/** Trục nói bằng TIẾNG NGHỀ, không bắt người dùng dịch 'x/y/z' (SPEC-NGON-NGU §1 — cấm jargon). */
const TRUC: { axis: SectionSpec['axis']; vi: string; en: string; giaiThich: [string, string] }[] = [
  { axis: 'z', vi: 'Mặt bằng', en: 'Plan', giaiThich: ['Cắt ngang theo cao độ, nhìn từ trên xuống', 'Horizontal cut at a height, seen from above'] },
  { axis: 'y', vi: 'Cắt dọc', en: 'Section Y', giaiThich: ['Mặt cắt đứng, tung độ là cao độ thật', 'Vertical section — vertical axis is real height'] },
  { axis: 'x', vi: 'Cắt ngang', en: 'Section X', giaiThich: ['Mặt cắt đứng theo phương còn lại', 'Vertical section along the other direction'] },
];

export function SectionExtractPanel({ scene, onNhan }: SectionExtractPanelProps) {
  const tr = useT();
  const [mode, setMode] = useState<Mode>('section');
  const [axis, setAxis] = useState<SectionSpec['axis']>('z');
  const [atMm, setAtMm] = useState(1200);
  const [names, setNames] = useState<SectionLayerNames>({
    cut: SECTION_LAYERS[0].name,
    view: SECTION_LAYERS[1].name,
    far: SECTION_LAYERS[2].name,
  });
  const [dangTinh, setDangTinh] = useState(false);
  const [xemTruoc, setXemTruoc] = useState<{ report: SectionReport; label: string; params: CheckpointParam[]; seed: string } | null>(null);
  // KS4 — nhãn hoàn tác phải nói SỐ THẬT của bản vẽ trước khi ghi, không nói chung chung.
  const soEntityTruoc = useCadStore((st) => st.doc.entities.length);

  const coKhoi = !!scene && scene.groups.length > 0;

  /** Khoảng cao độ THẬT của mô hình — để câu "cắt ở đâu" có mốc, không bắt gõ số mù. */
  const caoDo = useMemo(() => {
    if (!scene) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const g of scene.groups) {
      for (let i = 1; i < g.positions.length; i += 3) {
        const v = g.positions[i] * 1000;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    return Number.isFinite(min) ? { min: Math.round(min), max: Math.round(max) } : null;
  }, [scene]);

  const tinh = () => {
    if (!scene) return;
    setDangTinh(true);
    try {
      const truc = TRUC.find((t) => t.axis === axis);
      const thamSo: CheckpointParam[] = [
        { label: tr('Chế độ', 'Mode'), value: mode === 'section' ? tr('Cắt lớp', 'Section') : tr('Mặt đứng', 'Elevation') },
        { label: tr('Hướng', 'Direction'), value: `${tr(truc?.vi ?? axis, truc?.en ?? axis)} (${axis})` },
        ...(mode === 'section' ? [{ label: tr('Vị trí cắt', 'Cut at'), value: `${atMm} mm` }] : []),
        { label: tr('Ngưỡng nét xa', 'Far threshold'), value: '3000 mm' },
      ];
      if (mode === 'elevation') {
        // `elevationToEntities` không trả report — bọc lại thành cùng hình dạng để màn xem trước
        // chỉ có MỘT đường đọc số, không rẽ nhánh theo chế độ.
        const entities = elevationToEntities(scene, axis, {});
        setXemTruoc({
          report: { entities, counts: { cut: 0, view: entities.length, far: 0 }, cutLoops: 0, cutOpenChains: 0, warnings: [] },
          label: tr('Trích mặt đứng', 'Extract elevation'),
          params: thamSo,
          seed: `elevation:${axis}`,
        });
      } else {
        setXemTruoc({
          report: sectionReport(scene, { axis, at: atMm }, {}),
          label: tr(`Cắt lớp ${truc?.vi} @ ${atMm}mm`, `Section ${axis.toUpperCase()} @ ${atMm}mm`),
          params: thamSo,
          seed: `section:${axis}@${atMm}`,
        });
      }
    } finally {
      setDangTinh(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="px-0.5 text-[10.5px] leading-relaxed text-[var(--t4)]">
        {tr(
          'Rút đường 2D từ khối 3D ra bản vẽ. Xem trước rồi mới nhận — không tự ghi.',
          'Pull 2D lines out of the 3D model. Preview first, accept second — nothing is written automatically.',
        )}
      </p>

      {/* ── chế độ ── */}
      <div className="flex gap-1 rounded-[10px] bg-[var(--field)] p-1">
        {(
          [
            ['section', 'Cắt lớp', 'Section'],
            ['elevation', 'Mặt đứng', 'Elevation'],
          ] as [Mode, string, string][]
        ).map(([id, vi, en]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={cn(
              'flex-1 rounded-[6px] px-2 py-1 text-[10.5px] leading-normal transition-colors',
              mode === id ? 'bg-[var(--panel)] font-semibold text-[var(--t1)]' : 'text-[var(--t3)] hover:text-[var(--t1)]',
            )}
          >
            {tr(vi, en)}
          </button>
        ))}
      </div>

      {/* ── trục ── */}
      <div className="space-y-1.5">
        <p className={`px-0.5 ${NHAN_NHO}`}>{tr('Hướng', 'Direction')}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {TRUC.map((t) => (
            <Tooltip key={t.axis} side="right" label={tr(t.giaiThich[0], t.giaiThich[1])}>
              <button
                type="button"
                onClick={() => setAxis(t.axis)}
                className={cn(
                  'w-full rounded-[6px] border px-1 py-1.5 text-[10px] leading-normal transition-colors',
                  axis === t.axis
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--t3)] hover:border-[var(--accent-ring)]',
                )}
              >
                {tr(t.vi, t.en)}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ── cao độ cắt (chỉ chế độ cắt lớp) ── */}
      {mode === 'section' && (
        <label className="block space-y-1">
          <span className={`px-0.5 ${NHAN_NHO}`}>
            {axis === 'z' ? tr('Cắt ở cao độ (mm)', 'Cut at height (mm)') : tr('Cắt tại toạ độ (mm)', 'Cut at coordinate (mm)')}
          </span>
          <input
            type="number"
            step={100}
            value={atMm}
            onChange={(e) => setAtMm(Number(e.target.value))}
            className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-[11px] leading-normal text-[var(--t1)] outline-none focus:border-[var(--accent)]"
          />
          {caoDo && (
            <span className="block px-0.5 text-[9.5px] leading-normal text-[var(--t5)]">
              {tr(`Mô hình cao ${caoDo.min}–${caoDo.max}mm`, `Model spans ${caoDo.min}–${caoDo.max}mm`)}
            </span>
          )}
        </label>
      )}

      {/* ── tên layer: người dùng đổi được, KHÔNG chốt theo quy ước 1 bộ hồ sơ ── */}
      <div className="space-y-1.5 border-t border-[var(--border)] pt-3">
        <p className={`px-0.5 ${NHAN_NHO}`}>{tr('Đặt vào lớp', 'Target layers')}</p>
        {(
          [
            ['cut', 'Nét cắt', 'Cut'],
            ['view', 'Nét thấy', 'Seen'],
            ['far', 'Nét xa', 'Far'],
          ] as [keyof SectionLayerNames, string, string][]
        ).map(([key, vi, en]) => (
          <label key={key} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[9.5px] leading-normal text-[var(--t4)]">{tr(vi, en)}</span>
            <input
              value={names[key]}
              onChange={(e) => setNames((n) => ({ ...n, [key]: e.target.value }))}
              disabled={mode === 'elevation' && key === 'cut'}
              className="min-w-0 flex-1 rounded-[6px] border border-[var(--border)] bg-[var(--field)] px-1.5 py-1 text-[10px] leading-normal text-[var(--t1)] outline-none focus:border-[var(--accent)] disabled:opacity-40"
            />
          </label>
        ))}
      </div>

      <Tooltip
        side="right"
        label={coKhoi ? tr('Tính rồi hiện xem trước — chưa ghi gì vào bản vẽ', 'Computes and shows a preview — nothing written yet') : tr('Chưa có khối 3D nào để cắt — dựng tường hoặc đùn từ bản vẽ trước', 'No 3D geometry to cut yet — build a wall or extrude from the drawing first')}
      >
        <button
          type="button"
          disabled={!coKhoi || dangTinh}
          onClick={tinh}
          className={cn(
            'flex w-full items-center justify-center gap-1.5 rounded-[10px] px-2 py-2 text-[11px] font-semibold leading-normal transition-colors',
            coKhoi && !dangTinh
              ? 'cursor-pointer bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]'
              : 'cursor-not-allowed border border-dashed border-[var(--border)] text-[var(--t5)]',
          )}
        >
          {dangTinh ? <Loader2 size={18} className="animate-spin" /> : mode === 'section' ? <Scissors size={18} /> : <Eye size={18} />}
          {tr('Xem trước', 'Preview')}
        </button>
      </Tooltip>

      <ChuaCoNhungPhaiThay />

      {xemTruoc && (
        <SectionPreviewOverlay
          report={xemTruoc.report}
          label={xemTruoc.label}
          layerNames={names}
          params={xemTruoc.params}
          seed={xemTruoc.seed}
          soEntityTruoc={soEntityTruoc}
          onHuy={() => setXemTruoc(null)}
          onLamLai={tinh}
          onSuaThamSo={() => setXemTruoc(null)}
          onNhan={(entities) => {
            onNhan?.({ entities, layerNames: names, label: xemTruoc.label });
            setXemTruoc(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * §9 — THIẾT KẾ TRƯỚC, TÍNH NĂNG FILL SAU. Cắt ra được nét mới là bước ĐẦU của việc "ra hồ sơ";
 * 5 việc dưới đây là phần còn lại của chính chuỗi đó, CHƯA code. Vẽ ra đây ở trạng thái mờ + LÝ DO
 * THẬT của từng cái, để mở app ra là thấy còn thiếu gì — không phải tra sổ.
 *
 * ⛔ Không nút giả: mọi nút đều `disabled` thật, bấm không ra gì thì cũng không cho bấm.
 * Mỗi dòng ở đây khớp 1 dòng trong `docs/CHECKLIST-TONG.md` (mục "Rút hồ sơ 2D từ khối 3D").
 * Lý do đều đã grep trước khi viết (N8) — xem báo cáo phiên để biết lệnh + kết quả 0/0/0/0/0.
 */
const CHUA_CO: { vi: string; en: string; ly: [string, string] }[] = [
  {
    vi: 'Tự ghi kích thước', en: 'Auto-dimension',
    ly: [
      'Chưa có bộ sinh kích thước từ nét cắt — `grep autoDimension` = 0. Hiện phải ghi tay bằng lệnh DIM ở chặng Thiết kế 2D.',
      'No dimension generator from cut lines yet (`grep autoDimension` = 0). Dimension by hand with DIM in the 2D stage for now.',
    ],
  },
  {
    vi: 'Ký hiệu cao độ', en: 'Level tags',
    ly: [
      'Chưa có ký hiệu cao độ (▽ ±0.000) — `grep spotElevation` = 0. Cắt đứng đã cho tung độ = cao độ thật nên đo tay ra đúng số.',
      'No spot-elevation symbol yet (`grep spotElevation` = 0). Vertical sections already put real height on the vertical axis, so manual reading is correct.',
    ],
  },
  {
    vi: 'Ký hiệu mặt cắt lên mặt bằng', en: 'Section callout',
    ly: [
      'Chưa có ký hiệu A-A/B-B đặt ngược lên mặt bằng — `grep sectionMarker` = 0. Cần EntityType ký hiệu riêng, chưa khai.',
      'No A-A/B-B callout placed back on the plan (`grep sectionMarker` = 0). Needs its own symbol EntityType, not declared yet.',
    ],
  },
  {
    vi: 'Cắt lại khi khối đổi', en: 'Re-cut on change',
    ly: [
      'Nét cắt hiện là ẢNH CHỤP một lần — sửa khối 3D thì nét cũ KHÔNG tự đổi. `grep liveSection` = 0. Cắt lại rồi xoá bản cũ.',
      'Cut lines are a one-time snapshot — editing the 3D does NOT update them (`grep liveSection` = 0). Re-cut and delete the old set.',
    ],
  },
  {
    vi: 'Đưa thẳng vào tờ in', en: 'Place on sheet',
    ly: [
      'Chưa nối sang khung tên/tờ in — `grep sectionToSheet` = 0. Nét vào `Doc` rồi thì bố trí tờ ở chặng Thiết kế 2D như bản vẽ thường.',
      'Not wired to the title block / sheet yet (`grep sectionToSheet` = 0). Once in the Doc, lay it out in the 2D stage like any drawing.',
    ],
  },
];

function ChuaCoNhungPhaiThay() {
  const tr = useT();
  return (
    <div className="space-y-1.5 border-t border-[var(--border)] pt-3">
      <p className={`px-0.5 ${NHAN_NHO}`}>{tr('Chưa dựng được', 'Not built yet')}</p>
      {CHUA_CO.map((c) => (
        <Tooltip key={c.en} side="right" label={tr(c.ly[0], c.ly[1])}>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-[6px] border border-dashed border-[var(--border)] px-2 py-1.5 text-left text-[10px] leading-normal text-[var(--t5)] opacity-60"
          >
            {tr(c.vi, c.en)}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

/** Khoá kỹ thuật 3 layer — nơi mount cần để ánh xạ sang layer thật của `Doc`. */
export const SECTION_LAYER_KEYS = {
  cut: SECTION_CUT_LAYER,
  view: SECTION_VIEW_LAYER,
  far: SECTION_FAR_LAYER,
} as const;
