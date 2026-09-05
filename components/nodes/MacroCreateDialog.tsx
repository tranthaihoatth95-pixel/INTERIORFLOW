'use client';

/**
 * components/nodes/MacroCreateDialog.tsx — TRẠNG THÁI ② (`docs/mocks/mock-if-nut-tong.html` màn
 * 02): đặt tên + chọn tham số nào "hiện ra ngoài" mặt nút tổng. Bảng liệt kê MỌI tham số của MỌI
 * node con (`collectExposableParams`, `lib/nodes/macro.ts`) — mỗi dòng có công tắc hiện/ẩn + ô
 * đổi tên hiển thị (mặc định = nhãn gốc). Tham số KHÔNG hiện vẫn chạy bình thường, chỉ không lộ
 * ra mặt nút tổng (đúng dòng chữ mock: "Tham số không hiện vẫn chạy, chỉ nằm bên trong").
 *
 * Overlay KHÔNG dùng `fade` trên khối có backdrop blur (luật G1 `docs/00-BAT-DAU-DOC-DAY.md`
 * §4) — nền mờ ngoài cùng là scrim ĐẶC không blur (an toàn fade opacity), khối kính bên trong chỉ
 * animate y/scale, không opacity.
 */
import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { Box, CircleDot, Layers as LayersIcon, Sparkle, Grid3x3 } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { getDefinition } from '@/lib/nodes/registry';
import { collectExposableParams, computeBoundaryPorts, MACRO_ICONS, type MacroExposedParam } from '@/lib/nodes/macro';
import { tweenBase, tweenFast, springPop } from '@/lib/motion';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useDismissable } from '@/lib/useDismissable';

const ICON_MAP: Record<string, typeof Box> = { box: Box, sun: CircleDot, layers: LayersIcon, sparkle: Sparkle, grid: Grid3x3 };

const scrimFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: tweenBase },
  exit: { opacity: 0, transition: tweenFast },
};
/** Khối kính (backdrop blur) — CHỈ y/scale, không opacity (luật G1). */
const glassPop: Variants = {
  hidden: { y: 10, scale: 0.96 },
  visible: { y: 0, scale: 1, transition: springPop },
  exit: { y: 6, scale: 0.97, transition: tweenFast },
};

interface RowState {
  nodeId: string;
  paramId: string;
  nodeTitle: string;
  dotColor: string;
  originalLabel: string;
  exposed: boolean;
  label: string;
}

export function MacroCreateDialog({ selectedIds, onClose }: { selectedIds: string[]; onClose: () => void }) {
  const tr = useT();
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const addGroup = useFlowStore((s) => s.addGroup);
  const groupsCount = useFlowStore((s) => s.groups.length);

  const [name, setName] = useState(() => tr(`Nút tổng ${groupsCount + 1}`, `Macro node ${groupsCount + 1}`));
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<string>(MACRO_ICONS[0]);

  const paramRows = useMemo(() => collectExposableParams(nodes, selectedIds, getDefinition), [nodes, selectedIds]);
  const [rows, setRows] = useState<RowState[]>(() =>
    paramRows.map((r) => ({
      nodeId: r.nodeId,
      paramId: r.param.id,
      nodeTitle: r.nodeTitle,
      dotColor: r.dotColor,
      originalLabel: r.param.label,
      // mặc định lộ ra ngoài param đầu tiên của mỗi node (đủ dùng ngay, không bắt chọn tay hết —
      // người dùng tắt bớt nếu muốn kín hơn).
      exposed: !paramRows.some((other) => other.nodeId === r.nodeId && paramRows.indexOf(other) < paramRows.indexOf(r)),
      label: r.param.label,
    })),
  );

  const exposedCount = rows.filter((r) => r.exposed).length;

  const wrapRef = useRef<HTMLDivElement>(null);
  useDismissable({ open: true, onDismiss: onClose, refs: [wrapRef] });

  const create = () => {
    const trimmedName = name.trim() || tr('Nút tổng', 'Macro node');
    const boundary = computeBoundaryPorts(nodes, selectedIds, edges, getDefinition);
    const members = nodes.filter((n) => selectedIds.includes(n.id));
    const cx = members.reduce((s, n) => s + n.position.x, 0) / (members.length || 1);
    const cy = members.reduce((s, n) => s + n.position.y, 0) / (members.length || 1);
    const exposedParams: MacroExposedParam[] = rows
      .filter((r) => r.exposed)
      .map((r) => ({ nodeId: r.nodeId, paramId: r.paramId, label: r.label.trim() || r.originalLabel }));

    addGroup({
      id: `grp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      label: trimmedName,
      nodeIds: selectedIds,
      collapsed: true,
      center: { x: cx, y: cy },
      isMacro: true,
      description: description.trim() || undefined,
      icon,
      exposedParams,
      boundaryInputs: boundary.inputs,
      boundaryOutputs: boundary.outputs,
      usageCount: 0,
      shared: false,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={scrimFade}
        initial="hidden"
        animate="visible"
        exit="exit"
        /* `--scrim` thay `bg-black/45` — mock màn 02 phủ nền bằng `var(--scrim)`; token đó là
           bí danh của `--nen-mo-overlay` nên nền Kem tự có bản riêng, không kẹt màu đen nền Mực. */
        className="fixed inset-0 z-50 grid place-items-center bg-[var(--scrim)] p-6"
      >
        <motion.div
          ref={wrapRef}
          variants={glassPop}
          /* Bo 28px (`--radius-xl`) đúng mock màn 02 — trước là 20px.
             Nền GIỮ `nen-mo-card` (không đổi sang `nen-mo-panel` như mock): blur khớp (cả hai 40px)
             nhưng nen-mo-card đục hơn (.82 vs .68), và hộp này dày chữ ⇒ luật G2 "lớp nổi nhiều
             chữ phải nền đặc" thắng con số của mock. */
          className="nen-mo-card flex max-h-[85vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--vien-mo)] shadow-[var(--shadow-pop)]"
        >
          {/* Header */}
          <div className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-[var(--vien-mo)] px-5">
            <span className="text-[16px] font-semibold leading-[1.5] tracking-tight text-[var(--t1)]">
              {tr('Gom thành nút tổng', 'Combine into a macro node')}
            </span>
            <span className="text-[11px] leading-[1.5] text-[var(--t4)]">
              {tr(`${selectedIds.length} nút con`, `${selectedIds.length} child nodes`)}
            </span>
            <button
              type="button"
              onClick={onClose}
              title={tr('Đóng — Esc', 'Close — Esc')}
              className="ml-auto grid h-7 w-7 place-items-center rounded-[10px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
            >
              <X size={14} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Tên + mô tả + icon */}
            <div className="grid grid-cols-[1fr_230px] gap-5 border-b border-[var(--vien-mo)] p-5">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="mb-1.5 text-[11px] font-bold uppercase leading-[1.5] tracking-wide text-[var(--t4)]">
                    {tr('Tên nút tổng', 'Macro node name')}
                  </div>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 w-full rounded-[10px] border border-[var(--accent)] bg-[var(--field)] px-2.5 text-[14px] leading-[1.5] text-[var(--t1)] shadow-[0_0_0_3px_var(--accent-soft)]"
                  />
                </div>
                <div>
                  <div className="mb-1.5 text-[11px] font-bold uppercase leading-[1.5] tracking-wide text-[var(--t4)]">
                    {tr('Mô tả ngắn', 'Short description')}
                  </div>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={tr('Tuỳ chọn — hiện khi rê chuột vào nút tổng', 'Optional — shown on hover')}
                    className="h-9 w-full rounded-[10px] border border-transparent bg-[var(--field)] px-2.5 text-[12px] leading-[1.5] text-[var(--t2)] placeholder:text-[var(--t5)] focus:border-[var(--border-strong)]"
                  />
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-bold uppercase leading-[1.5] tracking-wide text-[var(--t4)]">
                  {tr('Biểu tượng', 'Icon')}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {MACRO_ICONS.map((key) => {
                    const Icon = ICON_MAP[key];
                    const active = icon === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setIcon(key)}
                        className={cn(
                          'flex h-11 items-center justify-center rounded-[10px] transition-colors',
                          active ? 'border-[1.5px] border-[var(--accent)] bg-[var(--accent-soft)]' : 'border border-transparent bg-[var(--field)] hover:bg-[var(--hover)]',
                        )}
                      >
                        <Icon size={18} className={active ? 'text-[var(--accent)]' : 'text-[var(--t2)]'} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bảng tham số */}
            <div className="p-5 pb-0">
              <div className="mb-2.5 flex items-baseline gap-2.5">
                <span className="text-[11px] font-bold uppercase leading-[1.5] tracking-wide text-[var(--t4)]">
                  {tr('Tham số đưa ra ngoài', 'Parameters exposed outside')}
                </span>
                <span className="text-[11px] leading-[1.5] text-[var(--t4)]">
                  {tr(`${exposedCount} trên ${rows.length} đang hiện`, `${exposedCount} of ${rows.length} shown`)}
                </span>
              </div>
              <div className="overflow-hidden rounded-[14px] border border-[var(--vien-mo)] bg-[var(--card)]">
                <div className="grid h-[30px] grid-cols-[150px_1fr_1fr_58px] items-center gap-3 border-b border-[var(--vien-mo)] bg-[var(--field)] px-3 text-[11px] font-bold uppercase leading-[1.5] tracking-wide text-[var(--t4)]">
                  <span>{tr('Nút con', 'Child node')}</span>
                  <span>{tr('Tham số gốc', 'Original param')}</span>
                  <span>{tr('Tên hiện ra ngoài', 'Exposed name')}</span>
                  <span className="text-right">{tr('Hiện', 'Show')}</span>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {rows.length === 0 && (
                    <p className="px-3 py-4 text-center text-[11px] leading-relaxed text-[var(--t5)]">
                      {tr('Các node đã chọn không có tham số nào.', 'The selected nodes have no parameters.')}
                    </p>
                  )}
                  {rows.map((row, i) => (
                    <div
                      key={`${row.nodeId}.${row.paramId}`}
                      className={cn(
                        'grid h-11 grid-cols-[150px_1fr_1fr_58px] items-center gap-3 px-3 transition-opacity',
                        i < rows.length - 1 && 'border-b border-[var(--vien-mo)]',
                        !row.exposed && 'opacity-50',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="h-[7px] w-[7px] flex-none rounded-[2px]" style={{ background: row.dotColor }} />
                        <span className="truncate text-[12px] leading-[1.5] text-[var(--t2)]">{row.nodeTitle}</span>
                      </span>
                      <span className="truncate text-[12px] leading-[1.5] text-[var(--t3)]">{row.originalLabel}</span>
                      {/* Hàng ĐÃ TẮT: mock (`docs/mocks/Nút tổng.dc.html:227,243,264`) thay ô nhập bằng
                          chữ tĩnh "Giữ bên trong" — nói thẳng tham số đó ở lại bên trong nút tổng.
                          Trước đây ô nhập disabled vẫn hiện TÊN GỐC mờ đi: người dùng thấy một ô
                          trông-như-sửa-được mà gõ không ăn, và không có câu nào giải thích vì sao.
                          Giữ NGUYÊN hình hộp (h28 · bo 10 · nền --field) để hàng không nhảy khi bật/tắt. */}
                      {row.exposed ? (
                        <input
                          value={row.label}
                          onChange={(e) => {
                            const v = e.target.value;
                            setRows((prev) => prev.map((r, j) => (j === i ? { ...r, label: v } : r)));
                          }}
                          className="h-7 w-full rounded-[10px] border-0 bg-[var(--field)] px-2.5 text-[12px] leading-[1.5] text-[var(--t1)]"
                        />
                      ) : (
                        <span className="flex h-7 w-full items-center rounded-[10px] bg-[var(--field)] px-2.5 text-[12px] leading-[1.5] text-[var(--t4)]">
                          {tr('Giữ bên trong', 'Kept inside')}
                        </span>
                      )}
                      <span className="flex justify-end">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.exposed}
                          onClick={() =>
                            setRows((prev) => prev.map((r, j) => (j === i ? { ...r, exposed: !r.exposed } : r)))
                          }
                          className={cn(
                            'flex h-[22px] w-[38px] items-center rounded-full px-[2px] transition-colors',
                            row.exposed ? 'justify-end bg-[var(--accent)]' : 'justify-start border border-[var(--border)] bg-[var(--field)]',
                          )}
                        >
                          {/* núm công tắc: nền accent → dùng token chữ-trên-accent, không #fff cứng */}
                          <span className={cn('h-[18px] w-[18px] rounded-full', row.exposed ? 'bg-[var(--on-accent)]' : 'bg-[var(--t4)]')} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center gap-2.5 p-5">
            <span className="text-[11px] leading-[1.5] text-[var(--t4)]">
              {tr('Tham số không hiện vẫn chạy, chỉ nằm bên trong', 'Hidden parameters still run — they just stay inside')}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto h-8 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-4 text-[12px] font-semibold leading-[1.5] text-[var(--t1)] transition-colors hover:bg-[var(--hover)]"
            >
              {tr('Huỷ', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={create}
              className="h-8 rounded-[10px] bg-[var(--accent)] px-4.5 text-[12px] font-semibold leading-[1.5] text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-strong)]"
            >
              {tr('Tạo nút tổng', 'Create macro node')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
