'use client';

/**
 * components/render-studio/NutLenhVeTinh.tsx — MỘT nút lệnh trong panel vệ tinh của cửa sổ công
 * cụ: nơi lệnh chuyên sâu **có dòng điện** hoặc **mờ kèm lý do riêng của chính nó**.
 *
 * ⭐ VÌ SAO TÁCH KHỎI `CuaSoCongCu.tsx`: tệp kia tự khai *"chỉ lo cái khung, không lo cái ruột —
 * nó không biết gì về node"*, và đó là điều kiện để cùng một cụm sống được ở 2D · 3D · Trình bày
 * ([T2]). Nối lệnh vào `useFlowStore` ngay trong khung là phá đúng ranh giới đó. Nút đứng riêng
 * thì khung vẫn mù về node, còn nút thì biết đủ để chạy thật.
 *
 * ⛔ KHÔNG CÓ ĐƯỜNG NÀO GHI RA THANH CHUNG trong tệp này — cùng lý do `CuaSoCongCu.tsx` đã ghi:
 * thiếu đường đi thì không ai lỡ tay đi. Lệnh chuyên sâu ở lại trong cửa sổ, thanh chung không
 * phình theo chặng.
 *
 * ⚠️ MỜ THÌ ĐI `aria-disabled` + `aria-describedby`, KHÔNG đi `disabled` + `title`: bài học
 * 16/08 đo bằng bàn phím thật — `<button disabled>` **rơi khỏi Tab** và `title` **câm trên cảm
 * ứng** ⇒ lý do có trong mã mà không bao giờ tới người dùng. Ở đây dùng lại `ToolbarChip`, vốn
 * đã đi đúng đường đó.
 */

import { getDefinition } from '@/lib/nodes/registry';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { RADIUS } from '@/lib/geometry';
import { useControlledEditUi } from '@/lib/render-studio/controlled-edit-ui';
import { LENH_DA_NOI, LY_DO_CHUA_NOI, giaTriKe } from '@/lib/nodes/thi-hanh-lenh-cua';

export interface NutLenhVeTinhProps {
  lenhId: string;
  nhan: string;
  /** Node đang là vật chủ của cửa sổ. `null` = cửa sổ nổi chưa gắn vào node nào. */
  nodeId: string | null;
}

/** Kiểu chữ dùng chung cho cả hai trạng thái — để nút chạy được và nút mờ cùng một hình dạng. */
const KHUON = {
  textAlign: 'left',
  fontSize: 11,
  padding: '5px 8px',
  borderRadius: RADIUS.r1,
  border: 'none',
  width: '100%',
} as const;

export default function NutLenhVeTinh({ lenhId, nhan, nodeId }: NutLenhVeTinhProps) {
  const tr = useT();
  const cach = LENH_DA_NOI[lenhId];
  const dangSuaNode = useControlledEditUi((s) => s.openNodeId);
  const toggleSua = useControlledEditUi((s) => s.toggle);
  const updateParam = useFlowStore((s) => s.updateParam);
  const node = useFlowStore((s) => (nodeId ? s.nodes.find((n) => n.id === nodeId) : undefined));

  /** Mờ + lý do — MỘT chỗ dựng, để nút mờ vì lý do gì cũng cùng hình dạng. */
  function moKemLyDo(lyDo: string) {
    return (
      <button
        type="button"
        aria-disabled
        aria-describedby={`ly-do-${lenhId}`}
        style={{ ...KHUON, color: 'var(--t2)', opacity: 'var(--mo-vo-hieu)', cursor: 'not-allowed', background: 'transparent' }}
      >
        {nhan}
        {/* Lý do đi đường trình đọc màn hình được, không nằm trong `title` (câm trên cảm ứng). */}
        <span id={`ly-do-${lenhId}`} className="if-tooltip-a11y">
          {lyDo}
        </span>
      </button>
    );
  }

  // ── CHƯA NỐI: lý do RIÊNG của lệnh này. Không có mục nào trong bảng lý do là lỗi khai báo —
  // `lenhKhongKhaiSoPhan()` có test canh, nên nhánh này gần như không tới được; giữ câu chung ở
  // đây chỉ để giao diện không vỡ nếu ai đó chạy bản chưa qua test.
  if (!cach) {
    const lyDo = LY_DO_CHUA_NOI[lenhId];
    return moKemLyDo(
      lyDo ? tr(lyDo.vi, lyDo.en) : tr('Lệnh chưa khai bộ thi hành', 'Command has no executor declared'),
    );
  }

  // ── ĐÃ NỐI nhưng cửa sổ chưa gắn vào node nào (cửa sổ NỔI mở từ thẻ việc): không có vật nào
  // để tác động. Mờ, và nói đúng thứ đang thiếu.
  if (!nodeId || !node) {
    return moKemLyDo(tr('Cửa sổ chưa gắn vào khối nào trên bảng', 'This window is not attached to a block yet'));
  }

  // ── SỬA CÓ KIỂM SOÁT — bật/tắt bảng Trước/Sau ngay trong thân cửa sổ.
  if (cach.kieu === 'sua-co-kiem-soat') {
    const dangMo = dangSuaNode === nodeId;
    return (
      <button
        type="button"
        aria-pressed={dangMo}
        onClick={() => toggleSua(nodeId)}
        aria-describedby={`ly-do-${lenhId}`}
        style={{
          ...KHUON,
          color: dangMo ? 'var(--on-accent, #fff)' : 'var(--t1)',
          background: dangMo ? 'var(--accent)' : 'transparent',
          cursor: 'pointer',
        }}
      >
        {nhan}
        <span id={`ly-do-${lenhId}`} className="if-tooltip-a11y">
          {tr('Chỉnh vùng chọn thủ công, có Trước/Sau + Nhận/Bỏ', 'Adjust a manual region, with Before/After + Accept/Reject')}
        </span>
      </button>
    );
  }

  // ── XOAY THAM SỐ — lệnh chỉ sống trên đúng khối đã khai. Khối khác thì mờ, và nói RÕ khối nào,
  // chứ không im lặng biến mất (ô trống là bằng chứng còn việc; nút câm là lời hứa suông).
  const def = getDefinition(node.data.defType);
  if (node.data.defType !== cach.defType) {
    const tenDung = getDefinition(cach.defType).title;
    return moKemLyDo(tr(`Lệnh của khối “${tenDung}”, không phải khối này`, `Belongs to the “${tenDung}” block, not this one`));
  }

  const p = def.params.find((x) => x.id === cach.thamSo);
  if (!p || p.kind !== 'select') {
    return moKemLyDo(tr('Khối này không còn tham số tương ứng', 'This block no longer has the matching setting'));
  }

  const hienTai = node.data.params[cach.thamSo];
  const ke = giaTriKe(p.options, hienTai);

  return (
    <button
      type="button"
      onClick={() => ke !== null && updateParam(nodeId, cach.thamSo, ke)}
      aria-describedby={`ly-do-${lenhId}`}
      style={{ ...KHUON, color: 'var(--t1)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
    >
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nhan}</span>
      {/* Giá trị ĐANG dùng hiện ngay trên nút: nút đổi một thứ thì phải cho thấy thứ đó đang là gì,
          không bắt người dùng mở tham số ra đối chiếu. Chữ, không phải màu — kênh dự phòng. */}
      <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {String(hienTai ?? p.options[0] ?? '')}
      </span>
      <span id={`ly-do-${lenhId}`} className="if-tooltip-a11y">
        {tr(`Đổi ${p.label} sang “${ke ?? ''}”`, `Switch ${p.label} to “${ke ?? ''}”`)}
      </span>
    </button>
  );
}
