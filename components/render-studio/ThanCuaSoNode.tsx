'use client';

/**
 * components/render-studio/ThanCuaSoNode.tsx — RUỘT của cửa sổ công cụ khi nó neo vào một node
 * (mặt tiền canvas). Khung do `CuaSoCongCu.tsx` lo; tệp này chỉ lo NỘI DUNG.
 *
 * ⭐ MỌI THỨ Ở ĐÂY ĐỀU LÀ TÁI DÙNG, không có bộ máy thứ hai ([T2] · [Đ2] nhìn vào trong trước):
 *   · tham số  ← `ParamField` (chính hàng điều khiển của node, `components/nodes/ParamField.tsx`)
 *   · kết quả  ← `NodeExtras` (chính khối kết quả của node, kể cả deck/3D/bảng màu)
 *   · chạy     ← `runNode()` — CÙNG đường với nút ▶ trên khối nhỏ, không có luồng "giả"
 *   · ảnh nguồn← `useSourceImage()` (đã dùng ở mask/smart-select/warp)
 * ⇒ Cửa sổ mở ra KHÔNG phải một màn khác: nó là **chính node đó nhìn gần**. Sửa ở cửa sổ hay sửa
 * trên khối nhỏ đều ghi vào một chỗ, undo chung, không có bản sao nào để lệch.
 *
 * ⛔ CỐ Ý KHÔNG DÙNG `useToolModeUi` (`sessionImageDataUrl` / `sessionNodeRefs`): kho đó là
 * SINGLETON — đúng chỗ khoá cứng "1 cửa sổ/lượt" mà `ToolWindow` cũ tự thú. Mọi thứ tệp này đọc
 * đều gắn theo `nodeId`, nên mở mười cửa sổ cùng lúc thì mười cái độc lập, không cái nào giẫm
 * dữ liệu cái nào. Đây là điều kiện kỹ thuật để câu *"mở nhiều cửa sổ để nối với nhau"* thành
 * thật chứ không chỉ là ba cửa sổ cùng nhìn một dữ liệu.
 */

import { Play, RotateCcw, Loader2 } from 'lucide-react';
import { getDefinition } from '@/lib/nodes/registry';
import { runNode } from '@/lib/execution';
import { useSourceImage } from '@/lib/nodes/source-image';
import { useFlowStore } from '@/lib/store';
import { dinhNghiaKetQua, dongDinhNghia } from '@/lib/nodes/dinh-nghia-ket-qua';
import { ParamField } from '@/components/nodes/ParamField';
import { NodeExtras } from '@/components/nodes/NodeExtras';
import { ToolbarChip } from '@/components/ui/ToolbarChip';
import { useT } from '@/lib/i18n';
import { RADIUS } from '@/lib/geometry';
import { DATA_TYPE_COLORS, type InteriorNodeData } from '@/lib/types';

/**
 * DẢI ĐỊNH NGHĨA KẾT QUẢ — chân cửa sổ. *"Định nghĩa file = kết quả"* (Hoà 15/08): đầu ra của
 * cửa sổ không phải một tệp trần, nó mang sẵn **loại · vai trò · nguồn gốc**, và chính định
 * nghĩa đó làm nó thành ĐẦU VÀO ĐÃ-ĐỊNH-NGHĨA của cửa sổ kế.
 *
 * ⚠️ Cửa sổ THẢO LUẬN (moodboard · khung tư duy) không có cổng ra — dải này tự vắng mặt, không
 * bịa ra một dòng "chưa có kết quả" để lấp chỗ. Đầu ra của loại đó là một QUYẾT ĐỊNH, không
 * phải một tệp.
 */
export function DaiDinhNghiaKetQua({ nodeId, data }: { nodeId: string; data: InteriorNodeData }) {
  const tr = useT();
  const def = getDefinition(data.defType);
  const edges = useFlowStore((s) => s.edges);
  if (def.outputs.length === 0) return null;
  const ds = dinhNghiaKetQua(nodeId, data.defType, def.outputs, data.run.outputs, edges);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t4)' }}>
        {tr('Cổng ra', 'Output')}
      </span>
      {ds.map((d) => (
        <span
          key={d.cong}
          style={{ fontSize: 11, color: d.coGiaTri ? 'var(--t2)' : 'var(--t4)', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          // Phần dài (nguồn gốc + node đã nuôi) để ô giải nghĩa — nhãn giữ ≤ 12 từ.
          title={tr(
            `Sinh bởi ${d.nguonGoc}${d.nuoiBoi.length ? ` · nuôi bởi ${d.nuoiBoi.join(', ')}` : ''}`,
            `Produced by ${d.nguonGoc}${d.nuoiBoi.length ? ` · fed by ${d.nuoiBoi.join(', ')}` : ''}`,
          )}
        >
          {/* Chấm màu THEO KIỂU DỮ LIỆU — cùng bảng màu với chấm cổng trên node, để mắt nối được
              dòng chữ này với đúng cái cổng bên phải. Màu KHÔNG phải kênh duy nhất: chữ ngay cạnh. */}
          <span
            aria-hidden
            style={{ width: 8, height: 8, borderRadius: 999, background: DATA_TYPE_COLORS[d.loai], flexShrink: 0 }}
          />
          {dongDinhNghia(d, tr('vi', 'en') === 'vi')}
        </span>
      ))}
    </div>
  );
}

function TieuMuc({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t4)', marginBottom: 8 }}>
      {children}
    </p>
  );
}

export default function ThanCuaSoNode({ nodeId, data }: { nodeId: string; data: InteriorNodeData }) {
  const tr = useT();
  const def = getDefinition(data.defType);
  const anhNguon = useSourceImage(nodeId);
  const { status, progress } = data.run;
  const dangChay = status === 'running' || status === 'queued';

  // Cổng vào KHÔNG có ảnh nối tới → nút chạy mờ KÈM LÝ DO. Luật §9 "cấm nút giả": mờ mà không
  // nói vì sao là nút câm. Lý do đi đường `aria-describedby` của ToolbarChip, không đi `title`.
  const canAnh = def.inputs.some((p) => p.dataType === 'image');
  const thieuAnh = canAnh && !anhNguon;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 300px) 1fr',
        gap: 1,
        background: 'var(--vien-mo)', // khe 1px giữa hai cột = đường phân vùng, không cần kẻ thêm
        minHeight: '100%',
      }}
    >
      {/* CỘT TRÁI — đầu vào */}
      <div style={{ background: 'var(--bg)', padding: 12, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
        <div>
          <TieuMuc>{tr('Đầu vào', 'Input')}</TieuMuc>
          {anhNguon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={anhNguon}
              alt={tr('Ảnh nguồn', 'Source image')}
              style={{ width: '100%', borderRadius: RADIUS.r2, objectFit: 'cover', maxHeight: 160 }}
              loading="lazy"
            />
          ) : (
            <p
              style={{
                fontSize: 11,
                color: 'var(--t4)',
                border: '1px dashed var(--vien-mo)',
                borderRadius: RADIUS.r2,
                padding: '14px 10px',
                textAlign: 'center',
              }}
            >
              {canAnh
                ? tr('Nối ảnh vào cổng bên trái', 'Connect an image to the left port')
                : tr('Công cụ này không cần ảnh', 'This tool needs no image')}
            </p>
          )}
        </div>

        {def.params.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <TieuMuc>{tr('Thông số', 'Settings')}</TieuMuc>
            {def.params.map((p) => (
              <ParamField key={p.id} nodeId={nodeId} param={p} value={data.params[p.id]} />
            ))}
          </div>
        )}
      </div>

      {/* CỘT PHẢI — kết quả. Dùng đúng khối kết quả của node, không dựng bản xem trước thứ hai. */}
      <div style={{ background: 'var(--bg)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <TieuMuc>{tr('Kết quả', 'Result')}</TieuMuc>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {def.creditCost > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--t3)',
                  background: 'var(--hover)',
                  padding: '2px 6px',
                  borderRadius: RADIUS.r1,
                }}
              >
                {def.creditCost}cr
              </span>
            )}
            <ToolbarChip
              icon={
                dangChay ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : status === 'error' ? (
                  <RotateCcw size={14} />
                ) : (
                  <Play size={14} />
                )
              }
              label={status === 'error' ? tr('Chạy lại', 'Retry') : tr('Chạy', 'Run')}
              desc={tr('Chạy khối này kèm khối nguồn', 'Run this block with its source blocks')}
              size={28}
              disabled={dangChay || thieuAnh}
              disabledReason={
                dangChay
                  ? tr('Đang chạy, chờ xong đã', 'Already running — wait for it to finish')
                  : tr('Chưa có ảnh nối vào cổng vào', 'No image connected to the input port')
              }
              onClick={() => runNode(nodeId)}
            />
          </div>
        </div>

        {status === 'idle' && (
          <p style={{ fontSize: 11, color: 'var(--t4)' }}>
            {tr('Chưa chạy lần nào.', 'Not run yet.')}
          </p>
        )}
        {dangChay && (
          <p style={{ fontSize: 11, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
            {tr('Đang chạy', 'Running')} {Math.round(progress * 100)}%
          </p>
        )}
        <NodeExtras nodeId={nodeId} data={data} />
      </div>
    </div>
  );
}
