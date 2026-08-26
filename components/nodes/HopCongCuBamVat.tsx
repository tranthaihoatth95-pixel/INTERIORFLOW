'use client';

/**
 * components/nodes/HopCongCuBamVat.tsx — **hộp công cụ nổi cạnh vật đang chọn** (V1, entry
 * `master-tool-cong-dan-canvas`). Hiện khi node được chọn, biến mất khi bỏ chọn.
 *
 * ⭐ DÙNG `NodeToolbar` CỦA `@xyflow/react` — KHÔNG tự viết định vị. Đo 16/08: gói **v12.11.1 đã
 * cài** và ship sẵn `NodeToolbar` · `NodeResizer` · `EdgeToolbar`, mà `grep` toàn repo ra **0
 * chỗ dùng** ⇒ thứ cần nằm sẵn trong gói, chưa ai chạm. Nó tự bám node, tự lật khi hết chỗ,
 * **không co theo zoom** (nút giữ nguyên cỡ chạm ở mọi mức phóng — đúng thứ tự viết sẽ sai) và
 * tự ẩn khi chọn nhiều node cùng lúc để không thành rừng hộp chồng nhau.
 *
 * 🔴 RANH GIỚI (Hoà chốt 16/08 — điểm cốt lõi khiến hai tầng không đá nhau): hộp này chỉ chứa
 * lệnh **cùng bản chất ở mọi công cụ sáng tạo** — chạy · mở cửa sổ · nhân bản · xoá. Lệnh
 * **chuyên sâu theo môi trường** (lớp ảnh · dòng thời gian · công thức khối) KHÔNG được bò vào
 * đây: chúng sống trong **vệ tinh của cụm cửa sổ**. Thêm một lệnh chuyên sâu vào tệp này là bắt
 * đầu làm thanh chung phình — đúng thứ cả kiến trúc này sinh ra để chặn.
 *
 * ⭐ VỎ NÚT: `ToolbarChip` + `ToolbarBar` đã hợp nhất 3 chặng ([Đ2] — cấm kiểu nút thứ tư).
 * Nút mờ đi đường `aria-describedby` của `ToolbarChip`, KHÔNG đi `title` (`title` câm trên cảm
 * ứng, trình đọc màn hình đọc không nhất quán — đo thật 16/08, xem đầu `ToolbarChip.tsx`).
 */

import { NodeToolbar, Position } from '@xyflow/react';
import { Play, RotateCcw, Copy, Trash2, Maximize2, Minus } from 'lucide-react';
import { ToolbarBar, ToolbarChip } from '@/components/ui/ToolbarChip';
import { useFlowStore } from '@/lib/store';
import { runNode } from '@/lib/execution';
import { useT } from '@/lib/i18n';
import { NHAN_CAP, capKe, capTruoc, khoaCuaSoNode, type CapCuaSo } from '@/lib/nodes/cua-so-cong-cu';
import { useCuaSoCongCuUi } from '@/lib/nodes/cua-so-cong-cu-ui';

export function HopCongCuBamVat({
  nodeId,
  hien,
  laCuaSo,
  dangChay,
  loi,
}: {
  nodeId: string;
  hien: boolean;
  /** Node này có mở được thành cửa sổ công cụ không (= thuộc một MÔI TRƯỜNG làm việc;
   *  22/08 đổi từ "có thẻ việc" — thẻ việc 12/12 là node ảnh nên bám vào nó là khoá cửa sổ
   *  lại ở đúng một môi trường, xem `moiTruongChoDefType`). */
  laCuaSo: boolean;
  dangChay: boolean;
  loi: boolean;
}) {
  const tr = useT();
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const duplicateSelected = useFlowStore((s) => s.duplicateSelected);
  const khoa = khoaCuaSoNode(nodeId);
  const cap = useCuaSoCongCuUi((s) => s.bang[khoa]?.cap ?? 'thu');
  const datCap = useCuaSoCongCuUi((s) => s.datCap);

  return (
    <NodeToolbar isVisible={hien} position={Position.Top} offset={10}>
      <ToolbarBar>
        <ToolbarChip
          icon={loi ? <RotateCcw size={14} /> : <Play size={14} />}
          label={loi ? tr('Chạy lại', 'Retry') : tr('Chạy', 'Run')}
          desc={tr('Chạy khối này kèm khối nguồn', 'Run this block with its source blocks')}
          disabled={dangChay}
          disabledReason={tr('Đang chạy, chờ xong đã', 'Already running — wait for it to finish')}
          onClick={() => runNode(nodeId)}
        />
        {laCuaSo && (
          <>
            <ToolbarBar.Sep />
            <ToolbarChip
              icon={<Minus size={14} />}
              label={tr('Thu gọn', 'Collapse')}
              desc={tr(NHAN_CAP[capTruoc(cap)].vi, NHAN_CAP[capTruoc(cap)].en)}
              disabled={cap === 'thu'}
              disabledReason={tr('Đang là khối nhỏ rồi', 'Already a small block')}
              onClick={() => datCap(khoa, capTruoc(cap))}
            />
            <ToolbarChip
              icon={<Maximize2 size={14} />}
              label={tr('Mở cửa sổ', 'Open window')}
              desc={tr(NHAN_CAP[capKe(cap)].vi, NHAN_CAP[capKe(cap)].en)}
              active={cap !== 'thu'}
              disabled={cap === 'toanMan'}
              disabledReason={tr('Đã ở nấc rộng nhất', 'Already at the largest step')}
              onClick={() => datCap(khoa, capKe(cap) as CapCuaSo)}
            />
          </>
        )}
        <ToolbarBar.Sep />
        <ToolbarChip
          icon={<Copy size={14} />}
          label={tr('Nhân bản', 'Duplicate')}
          desc={tr('Tạo một bản giống hệt cạnh khối này', 'Create an identical copy next to it')}
          onClick={() => duplicateSelected()}
        />
        <ToolbarChip
          icon={<Trash2 size={14} />}
          label={tr('Xoá', 'Delete')}
          desc={tr('Xoá khối và các dây nối của nó', 'Delete the block and its links')}
          disabled={dangChay}
          disabledReason={tr('Đang chạy, không xoá giữa chừng', 'Running — cannot delete mid-run')}
          onClick={() => deleteNode(nodeId)}
        />
      </ToolbarBar>
    </NodeToolbar>
  );
}
