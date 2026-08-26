'use client';

/**
 * components/render-studio/ToolWindow.tsx — **cửa sổ công cụ** (`docs/CHOT-RENDER-TOOL-WINDOW-
 * 2026-08-01.md` §1 mục 1: *"window LÀ node phóng to, không phải màn riêng"*).
 *
 * ⚠️ TÊN: sổ gọi thứ này là "master tool" 26 lần, code gọi `ToolWindow` từ 01/08. Hoà làm rõ
 * 16/08 — *"master tool mà tôi nói chính là window tool"* ⇒ **một tên: `cửa sổ công cụ`**, khoá
 * kỹ thuật giữ `ToolWindow`. Không dựng tên thứ ba.
 *
 * 16/08 — ĐỔI BẢN CHẤT, không phải sửa mặt:
 *   TRƯỚC: tệp này TỰ dựng khung — `position:fixed` · `zIndex 31` · `createPortal` ra
 *   `document.body`. Hệ quả đo được (docstring cũ tự thú `:15-17`): **1 window/lượt · KHÔNG kéo
 *   di chuyển · không cổng vào/ra ⇒ không nối được gì**. Nó **nổi TRÊN canvas chứ không THUỘC
 *   canvas** — trái đúng câu Hoà chốt 15/08: *"nó phải thuộc môi trường canvas. Cho phép mở
 *   nhiều cửa sổ để nối với nhau."*
 *   NAY: tệp này thôi sở hữu khung. Nó là **MẶT TIỀN MỎNG** gọi `CuaSoCongCu` (cụm khung môi
 *   trường + vệ tinh) — 0 dòng `position` của riêng mình. Nhờ đó nó nhận miễn phí: kéo cả cụm ·
 *   ba nấc · vệ tinh mang lệnh chuyên sâu · nhiều cụm chồng nhau có trên/dưới.
 *
 * HAI ĐƯỜNG GỌI, một cỗ máy ([T2]):
 *  ① `<ToolWindow cardId />` — đường cũ của `RenderToolModeOverlay`: cụm **NỔI, tháo rời**.
 *     Vẫn dùng `useToolModeUi` (kho SINGLETON) nên vẫn **đúng 1 cụm/lượt ở đường này** — đó là
 *     trần của kho đó, không phải của khung; gỡ trần ấy phải sửa `tool-mode-ui.ts`, ngoài vùng
 *     phiếu. Khai thẳng thay vì che.
 *  ② `<ToolWindow cardId nodeId />` — đường mới trong thân node: cụm **NEO**, thuộc canvas,
 *     pan/zoom theo, có cổng vào/ra thật. Nhiều node mở cùng lúc = nhiều cụm cùng lúc, **không
 *     qua kho singleton nào** (xem `ThanCuaSoNode.tsx`).
 */

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useToolModeUi, useIsSmallScreenForCanvas } from '@/lib/render-studio/tool-mode-ui';
import { taskCardById } from '@/lib/render-studio/task-cards';
import { useFlowStore } from '@/lib/store';
import { getDefinition } from '@/lib/nodes/registry';
import { khoaCuaSoNode, khoaCuaSoThe, moiTruongChoDefType, type CapCuaSo } from '@/lib/nodes/cua-so-cong-cu';
import { useCuaSoCongCuUi } from '@/lib/nodes/cua-so-cong-cu-ui';
import CuaSoCongCu from './CuaSoCongCu';
import ThanCuaSoNode, { DaiDinhNghiaKetQua } from './ThanCuaSoNode';
import ToolModeForm from './ToolModeForm';

/**
 * 🔴 22/08 — `cardId` thành TUỲ CHỌN, và môi trường thôi bị gõ cứng `"anh"`.
 *
 * Đo được trước lượt này: `TASK_CARDS` có 12 thẻ, **12/12 là node ẢNH** ⇒ mọi cửa sổ đều mở ra
 * môi trường "Ảnh", trong khi `MOI_TRUONG` khai đủ bốn. Ba môi trường kia có bảng vệ tinh, có
 * test canh, và **không có đường nào mở ra** — dây đủ, chưa có dòng điện. Node `three.*` /
 * `*2video` không có thẻ việc nên trước đây còn không mở nổi cửa sổ.
 * NAY: môi trường tra từ `moiTruongChoDefType(defType)`, tiêu đề lấy thẻ việc nếu có, không thì
 * lấy tên khối trong registry. Nhờ đó một canvas bày được **cửa sổ Khối 3D nối dây sang cửa sổ
 * Ảnh nối dây sang cửa sổ Phim** — ba xưởng khác loại, một dây chuyền.
 */
export default function ToolWindow({ cardId, nodeId }: { cardId?: string; nodeId?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const backToHome = useToolModeUi((s) => s.backToHome);
  const setSessionImageDataUrl = useToolModeUi((s) => s.setSessionImageDataUrl);
  const setSessionNodeRefs = useToolModeUi((s) => s.setSessionNodeRefs);
  const smallScreen = useIsSmallScreenForCanvas();
  const card = cardId ? taskCardById(cardId) : undefined;

  const khoa = nodeId ? khoaCuaSoNode(nodeId) : khoaCuaSoThe(cardId ?? '');
  const cap = useCuaSoCongCuUi((s) => s.bang[khoa]?.cap ?? (nodeId ? 'thu' : 'vua'));
  const datCap = useCuaSoCongCuUi((s) => s.datCap);
  const node = useFlowStore((s) => (nodeId ? s.nodes.find((n) => n.id === nodeId) : undefined));

  if (!mounted) return null;

  // ── ĐƯỜNG ② — neo vào node. Ruột là chính node đó nhìn gần (`ThanCuaSoNode`).
  if (nodeId) {
    if (!node) return null;
    // Môi trường ĐỌC TỪ NODE, không gõ cứng: đây là chỗ cửa sổ 3D khác cửa sổ ảnh khác cửa sổ
    // phim. Node không thuộc môi trường nào thì không có cửa sổ nào để mở (`InteriorNode` đã
    // chặn từ trước, nhánh này chỉ là lưới đỡ).
    const mt = moiTruongChoDefType(node.data.defType);
    if (!mt) return null;
    const def = getDefinition(node.data.defType);
    return (
      <CuaSoCongCu
        khoa={khoa}
        moiTruong={mt}
        tieuDe={card?.label ?? def.title}
        moTa={card?.desc ?? def.description}
        cap={cap}
        bienThe={cap === 'toanMan' ? 'toanMan' : 'neo'}
        onCap={(c: CapCuaSo) => datCap(khoa, c)}
        chanTrang={<DaiDinhNghiaKetQua nodeId={nodeId} data={node.data} />}
      >
        <ThanCuaSoNode nodeId={nodeId} data={node.data} />
      </CuaSoCongCu>
    );
  }

  // ── ĐƯỜNG ① chỉ có nghĩa khi mở TỪ MỘT THẺ VIỆC (không node nào để neo vào). Không thẻ thì
  // không có gì để bày — trước đây guard này nằm chung ở đầu hàm, nay tách ra vì đường ② không
  // còn đòi thẻ việc.
  if (!cardId || !card) return null;

  // Màn ≤7 inch: cụm CHÍNH NÓ trở thành Tool Mode toàn màn cũ — cùng 1 code (`ToolModeForm`),
  // không dựng khung kính (§1 mục 4 "không nuôi hai giao diện"). `ToolModeForm` tự
  // `position:absolute;inset:0` sẵn — không cần bọc gì thêm.
  if (smallScreen) return createPortal(<ToolModeForm cardId={cardId} />, document.body);

  function handleClose() {
    backToHome();
    setSessionImageDataUrl(null);
    setSessionNodeRefs(null);
  }

  // ── ĐƯỜNG ① — cụm nổi, tháo rời. Nấc `thu` ở đường này nghĩa là đóng hẳn về Tool Mode Home:
  // không có khối nhỏ nào trên canvas để thu về, nên "thu hết cỡ" = rời cửa sổ.
  return (
    <CuaSoCongCu
      khoa={khoa}
      moiTruong="anh"
      tieuDe={card.label}
      moTa={card.desc}
      cap={cap === 'thu' ? 'vua' : cap}
      bienThe={cap === 'toanMan' ? 'toanMan' : 'noi'}
      onCap={(c: CapCuaSo) => (c === 'thu' ? backToHome() : datCap(khoa, c))}
      onDong={handleClose}
    >
      <ToolModeForm cardId={cardId} />
    </CuaSoCongCu>
  );
}
