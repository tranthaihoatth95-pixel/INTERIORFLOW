'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react';
import { Play, Loader2, CircleAlert, CircleCheck, RotateCcw, X } from 'lucide-react';
import { getDefinition } from '@/lib/nodes/registry';
import { useFlowStore, type FlowNode } from '@/lib/store';
import { nodeIconFor } from '@/components/nodes/NodeIcons';
import { runNode } from '@/lib/execution';
import { CATEGORY_META, DATA_TYPE_COLORS } from '@/lib/types';
import { NodeExtras } from '@/components/nodes/NodeExtras';
import { ParamField } from '@/components/nodes/ParamField';
import { HopCongCuBamVat } from '@/components/nodes/HopCongCuBamVat';
import { nodePop, pressableIcon } from '@/lib/motion';
import { cn } from '@/lib/utils';
import CommentPin from '@/components/nodes/CommentPin';
import { useT } from '@/lib/i18n';
import {
  KHUNG_VUA,
  KHUNG_VUA_MIN,
  khoaCuaSoNode,
  moiTruongChoDefType,
  theViecChoDefType,
} from '@/lib/nodes/cua-so-cong-cu';
import { useCuaSoCongCuUi } from '@/lib/nodes/cua-so-cong-cu-ui';
import { dinhNghiaKetQua, dongDinhNghia } from '@/lib/nodes/dinh-nghia-ket-qua';
import ToolWindow from '@/components/render-studio/ToolWindow';

const PORT_GAP = 26;
const PORT_TOP = 46;

/**
 * `ParamField` ĐÃ DỜI sang `components/nodes/ParamField.tsx` (16/08) để cắt vòng import
 * `InteriorNode → ToolWindow → ThanCuaSoNode → ParamField`. Re-export nguyên tên để 13 chỗ gọi
 * cũ (`MacroNodeFace.tsx`…) không phải sửa một dòng nào — đổi đường import hàng loạt chỉ để dọn
 * là rủi ro không đổi lấy gì.
 */
export { ParamField };


function StatusIcon({ status }: { status: string }) {
  if (status === 'running' || status === 'queued')
    return <Loader2 size={14} className="animate-spin text-[var(--accent)]" />;
  if (status === 'done') return <CircleCheck size={14} className="text-emerald-400" />;
  if (status === 'error') return <CircleAlert size={14} className="text-red-400" />;
  return null;
}

function InteriorNodeInner({ id, data, selected, width, height }: NodeProps<FlowNode>) {
  const tr = useT();
  const def = getDefinition(data.defType);
  const meta = CATEGORY_META[def.category];
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const { status, progress, error } = data.run;
  const busy = status === 'running' || status === 'queued';

  /* ── CỬA SỔ CÔNG CỤ NEO VÀO NODE (entry `master-tool-cong-dan-canvas`).
     Node nào có thẻ việc tương ứng thì mở ra được thành cụm cửa sổ NGAY TẠI CHỖ — không phải hộp
     thoại nổi trên canvas như trước. Nấc lưu ngoài `data` (xem `cua-so-cong-cu-ui.ts`): nó là
     CÁCH NHÌN, không phải nội dung tài liệu, nên không được đi theo bản lưu/chia sẻ/xuất. */
  /* 🔴 22/08 — điều kiện mở cửa sổ đổi từ "CÓ THẺ VIỆC" sang "THUỘC MỘT MÔI TRƯỜNG". Thẻ việc
     12/12 là node ảnh, nên bám vào nó là khoá cửa sổ lại ở đúng một môi trường; `three.*` và
     `*2video` khi ấy không mở nổi cửa sổ nào dù bảng `MOI_TRUONG` đã khai sẵn vệ tinh cho chúng.
     `cardId` vẫn giữ — nó cho tiêu đề + ảnh Trước/Sau khi node đó có thẻ. */
  const moiTruong = moiTruongChoDefType(data.defType);
  const cardId = theViecChoDefType(data.defType);
  const khoaCua = khoaCuaSoNode(id);
  const capCua = useCuaSoCongCuUi((s) => s.bang[khoaCua]?.cap ?? 'thu');
  const moRong = moiTruong !== null && capCua !== 'thu';
  /* Dây nối — chỉ để dựng ĐỊNH NGHĨA của kết quả ("định nghĩa file = kết quả", Hoà 15/08):
     phần "nuôi bởi" cần biết node nào đang chảy vào node này. */
  const edges = useFlowStore((s) => s.edges);
  const dinhNghia = dinhNghiaKetQua(id, data.defType, def.outputs, data.run.outputs, edges);
  /* Đang kéo dây từ MỘT cổng nguồn ở đâu đó trên canvas (FlowCanvas onConnectStart/onConnectEnd
     ghi vào store) — sáng cổng NHẬN cùng kiểu dữ liệu, mờ cổng khác kiểu (mock-if-bang-nut.html
     màn 03). CHỈ áp cho cổng target (input) — cổng nguồn không phải đích thả dây. */
  const connectFromType = useFlowStore((s) => s.connectFromType);
  const dragging = connectFromType !== null;
  /* CHẤM TÍM "tham số đã đưa ra ngoài" (port `docs/mocks/Nút tổng.dc.html` màn 04 — 3 node con
     có chấm ở góc phải tiêu đề + chú thích cuối khung "Chấm tím là tham số đã đưa ra ngoài").
     CHỈ hiện khi nút tổng chứa node này ĐANG MỞ RA XEM (`!g.collapsed`): lúc thu gọn, node con
     không nằm trên màn nên chấm vô nghĩa; chú thích trong khung mở cũng chỉ có ở trạng thái đó.
     Chọn `some()` chứ không map cả bảng: mỗi node chỉ cần biết CÓ/KHÔNG, so sánh boolean nên
     selector không tạo tham chiếu mới mỗi lần store đổi. */
  const hasExposedParam = useFlowStore((s) =>
    s.groups.some((g) => g.isMacro && !g.collapsed && (g.exposedParams ?? []).some((p) => p.nodeId === id)),
  );

  return (
    <motion.div
      variants={nodePop}
      initial="hidden"
      animate="visible"
      /* VIỀN CHỌN (port `docs/mocks/Nút tổng.dc.html` màn 01 "Đang chọn năm nút"): node được
         chọn có viền 1.5px accent ĐẶC + quầng 4px accent-soft. Trước đây chỉ đổi màu viền sang
         --accent-ring (accent pha 55% alpha) — ở nền Kem gần như không thấy, nên lúc quét chọn
         5 nút để gom nút tổng không biết mình đang cầm những nút nào.
         Quầng đi bằng box-shadow (thuộc tính paint), KHÔNG opacity — nen-mo-card có backdrop blur
         (luật G1). Lúc node chạy, `.node-running-halo` là animation nên vẫn thắng inline style
         này theo thứ tự tầng CSS — đúng ý: đang chạy thì tín hiệu "chạy" quan trọng hơn "chọn". */
      /* Lúc MỞ RỘNG, bọc ngoài phải TRONG SUỐT và KHÔNG đổ bóng: cụm cửa sổ tự mang kính + bóng
         của nó. Giữ bóng ở đây nữa là hai lớp bóng chồng, và giữ `nen-mo-card` nữa là kính chồng
         kính — đúng lỗi K4 đã trả giá 02/08. */
      style={
        moRong
          ? { width: width ?? KHUNG_VUA.w, height: height ?? KHUNG_VUA.h }
          : { boxShadow: selected ? 'var(--shadow-pop), 0 0 0 4px var(--accent-soft)' : 'var(--shadow-pop)' }
      }
      className={cn(
        'group relative rounded-[14px] transition-colors',
        !moRong && 'nen-mo-card w-64 border',
        !moRong && (selected ? 'border-[1.5px] border-[var(--accent)]' : 'border-[var(--vien-mo)]'),
        !moRong && status === 'error' && 'border-red-500/60',
        status === 'running' && 'node-running-halo glass-gradient-run',
      )}
    >
      {/* V1 — hộp công cụ nổi cạnh vật đang chọn. `NodeToolbar` tự bám node, tự đi theo pan/zoom,
          tự ẩn khi chọn nhiều node (không thành rừng hộp chồng nhau). */}
      <HopCongCuBamVat
        nodeId={id}
        hien={Boolean(selected)}
        laCuaSo={moiTruong !== null}
        dangChay={busy}
        loi={status === 'error'}
      />

      {/* Đổi cỡ cụm cửa sổ — `NodeResizer` có sẵn trong gói, chỉ hiện lúc đang mở VÀ đang chọn
          (hiện thường trực là tám tay nắm bám lấy mọi node, rối mắt vô ích). */}
      {moRong && (
        <NodeResizer
          isVisible={Boolean(selected)}
          minWidth={KHUNG_VUA_MIN.w}
          minHeight={KHUNG_VUA_MIN.h}
          color="var(--accent)"
        />
      )}

      {/* G2 phần (2) — comment neo vào node này (badge góc phải-trên, xem CommentPin.tsx). */}
      <CommentPin nodeId={id} />

      {/* ── NẤC MỞ: thân node LÀ cụm cửa sổ công cụ. Không portal, không `position:fixed` — nó
          THUỘC canvas nên pan/zoom theo, kéo theo node, và giữ nguyên cổng vào/ra bên dưới để
          nối sang cửa sổ kế (Hoà 15/08). Ruột là chính node này nhìn gần, không phải màn khác. */}
      {moRong && <ToolWindow cardId={cardId ?? undefined} nodeId={id} />}

      {/* ── NẤC THU: khối nhỏ như cũ. Phải ĐỦ TỰ THÂN — che hai nấc kia đi vẫn đứng được một mình
          (Hoà 16/08: *"luôn gọn và tươm tất ở lớp mặc định"*). */}
      {!moRong && (
      <>
      {/* header — icon flat, nhãn dùng font hệ thống app (2.2.85, 30/07: bỏ font mono —
          SF Mono/Cascadia Code/Fira Code thiếu glyph dấu tiếng Việt tổ hợp, xung khắc với
          luật thoại 2.2.69 "Việt dẫn · Anh theo") */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        {(() => { const Icon = nodeIconFor(data.defType); return <Icon size={14} className="shrink-0 text-[var(--t2)]" />; })()}
        {/* nhãn chỉ tiếng Việt (05/08) — tên tiếng Anh của công cụ ở tooltip, giống thẻ trong
            bảng chọn node (components/NodeLibraryPanel.tsx `NodeCard`). */}
        <span className="flex-1 truncate text-[11.5px] font-medium tracking-[-.005em] text-[var(--t1)]" title={def.titleEn}>
          {def.title}
        </span>
        {hasExposedParam && (
          <span
            aria-hidden
            title={tr('Có tham số đưa ra ngoài mặt nút tổng', 'Has a parameter exposed on the macro node face')}
            className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--accent)]"
          />
        )}
        {status === 'queued' && (
          <span className="text-[10px] text-[var(--t4)]">đang chờ</span>
        )}
        {status === 'running' && (
          <span className="text-[10px] font-semibold tabular-nums text-[var(--accent)]">{Math.round(progress * 100)}%</span>
        )}
        {def.creditCost > 0 && (
          <span className="rounded bg-[var(--hover)] px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--t3)]">
            {def.creditCost}cr
          </span>
        )}
        <StatusIcon status={status} />
        <motion.button
          {...pressableIcon}
          // A5 (DS-A 14/08, SPEC-NGON-NGU): VI trước, không lộ jargon "node/upstream"
          title={status === 'error' ? tr('Chạy lại', 'Retry') : tr('Chạy khối (kèm khối nguồn)', 'Run block (with source blocks)')}
          disabled={busy}
          onClick={() => runNode(id)}
          className="nodrag grid h-6 w-6 place-items-center rounded-md bg-[var(--accent-strong)] text-white transition-colors hover:bg-[var(--accent)] disabled:opacity-40"
        >
          {status === 'error' ? <RotateCcw size={14} /> : <Play size={14} className="translate-x-[1px]" />}
        </motion.button>
        <motion.button
          {...pressableIcon}
          title="Xoá node"
          disabled={busy}
          onClick={() => deleteNode(id)}
          className="nodrag grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
        >
          <X size={14} />
        </motion.button>
      </div>

      {/* body */}
      <div
        className="space-y-2.5 px-3 py-2.5"
        style={{ minHeight: Math.max(def.inputs.length, def.outputs.length) * PORT_GAP }}
      >
        {def.params.map((p) => (
          <ParamField key={p.id} nodeId={id} param={p} value={data.params[p.id]} />
        ))}

        {status === 'running' && (
          <div className="h-1 overflow-hidden rounded-full bg-[var(--hover)]">
            {/* Rà soát motion 20/07: trước dùng `transition-all` + `width: n%` — animate width là
                animate LAYOUT, mà thanh này chạy trên TỪNG node của canvas trong suốt lúc render.
                Đổi sang scaleX (chỉ composite): thanh đặc bo tròn nên nhìn y hệt. */}
            <div
              className="h-full w-full origin-left rounded-full bg-[var(--accent)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        )}

        {status === 'error' && error && (
          <p className="rounded-md bg-red-500/10 px-2 py-1.5 text-[11px] leading-snug text-red-300">{error}</p>
        )}

        <NodeExtras nodeId={id} data={data} />
      </div>
      </>
      )}

      {/* ports — MÀU THEO KIỂU DỮ LIỆU. `DATA_TYPE_COLORS` (lib/types.ts) nay trả BIẾN token
          `var(--p-img)`/`var(--p-mask)`/`var(--p-num)` (`app/globals.css`, port ① mock
          `docs/mocks/Bảng nút.dc.html`) thay hex cứng ⇒ chấm cổng tự đổi theo theme Sáng/Tối
          và theo --accent, không phải sửa 2 nơi. Viền `2px solid var(--bg)` giữ đúng mock. */}
      {def.inputs.map((port, i) => {
        const isMatch = port.dataType === connectFromType;
        return (
          <Handle
            key={port.id}
            id={port.id}
            type="target"
            position={Position.Left}
            style={{
              top: PORT_TOP + i * PORT_GAP,
              background: DATA_TYPE_COLORS[port.dataType],
              width: dragging && isMatch ? 13 : 10,
              height: dragging && isMatch ? 13 : 10,
              border: dragging && isMatch ? '2px solid var(--accent)' : '2px solid var(--bg)',
              boxShadow: dragging && isMatch ? '0 0 0 3px var(--accent-soft)' : undefined,
              filter: dragging && !isMatch ? 'grayscale(0.9) brightness(0.55)' : undefined,
              transition: 'width .15s var(--ease-apple), height .15s var(--ease-apple), box-shadow .15s var(--ease-apple), filter .15s var(--ease-apple), border-color .15s var(--ease-apple)',
            }}
            title={`${port.label} · ${port.dataType}${dragging ? (isMatch ? ' · nhận được' : ' · khác kiểu') : ''}`}
          />
        );
      })}
      {/* CỔNG RA MANG ĐỊNH NGHĨA ("định nghĩa file = kết quả", Hoà 15/08): nhãn cổng nay đọc ra
          tiếng người — *"Ảnh · Kết quả render · chờ chạy"* — thay vì lộ khoá kỹ thuật `image`.
          Ba mảnh (loại · vai trò · nguồn gốc) ghép từ dữ liệu ĐÃ CÓ, không thêm trường nào. */}
      {def.outputs.map((port, i) => (
        <Handle
          key={port.id}
          id={port.id}
          type="source"
          position={Position.Right}
          style={{
            top: PORT_TOP + i * PORT_GAP,
            background: DATA_TYPE_COLORS[port.dataType],
            width: 10,
            height: 10,
            border: '2px solid var(--bg)',
          }}
          title={dongDinhNghia(dinhNghia[i], tr('vi', 'en') === 'vi')}
        />
      ))}
    </motion.div>
  );
}

export const InteriorNode = memo(InteriorNodeInner);
