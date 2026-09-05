'use client';

/**
 * components/render-studio/Library3DApplyBridge.tsx — CHỖ NGHE còn thiếu của `LIBRARY_APPLY_EVENT`
 * ở chặng 3D (`[3D-VL-01]`).
 *
 * Cùng khuôn `components/cad/LibraryDropBridge.tsx` đã dựng 06/08 cho `LIBRARY_INSTANTIATE_EVENT`
 * — KHÔNG đẻ cơ chế thứ hai: nghe sự kiện → tra món → ghi vào ĐÚNG đường có sẵn
 * (`useCadStore.updateEntities()`, một nấc Undo) → bật `detail.claimed` để nơi PHÁT biết đã có
 * người nhận. `dispatchEvent` chạy đồng bộ nên `LibrarySheet` đọc được cờ ngay dòng sau.
 *
 * KHÔNG vẽ gì (trả `null`). Mount ở `Render3DModeSkeleton` — nơi duy nhất có khối 3D để nhận.
 *
 * 🔴 VÌ SAO PHẢI CÓ CỜ `claimed` (bài học lặp lại lần hai): đường `instantiate` đã trả giá đúng
 * bài này 06/08 (G-M3-14 "SỬA LỜI BÁO NÓI DỐI") và được vá bằng cờ `claimed`; đường `ap` thì
 * KHÔNG được vá theo, nên nó tiếp tục bắn toast xanh vô điều kiện suốt một tháng. Sửa đường ghi
 * mà để toast bắn vô điều kiện là chỉ chữa nửa bệnh — nút vẫn nói dối khi gán trượt.
 */
import { useEffect } from 'react';
import { LIBRARY_APPLY_EVENT } from '@/components/library/LibrarySheet';
import { useCadStore } from '@/lib/cad/store';
import { useTree3DUi } from '@/lib/render-studio/tree3d-ui';
import { useScene3D } from '@/lib/render-studio/use-scene3d';
import { useMaterials } from '@/lib/render-studio/use-materials';
import { useT } from '@/lib/i18n';
import {
  cauBaoKhongGan,
  ganSpecVaoEntity,
  laMonVatLieu,
  traSpecId,
  type KetQuaGan,
  type LyDoKhongGan,
} from '@/lib/render-studio/gan-vat-lieu';

/** Chi tiết `LibrarySheet` gửi kèm (nó spread cả `SheetItem`), + cờ hai chiều. */
export interface Library3DApplyDetail {
  id?: string;
  shelfId?: string;
  name?: string;
  code?: string;
  kind?: string;
  /** nơi NGHE bật lên khi ĐÃ ghi thật; nơi PHÁT đọc để quyết câu báo. */
  claimed?: boolean;
  /** nơi NGHE điền khi nhận việc nhưng KHÔNG ghi được — nơi PHÁT lấy câu này báo, không tự bịa. */
  loi?: string;
}

export default function Library3DApplyBridge() {
  const tr = useT();
  const scene = useScene3D();
  const materials = useMaterials(true);

  useEffect(() => {
    function onApply(ev: Event) {
      const detail = (ev as CustomEvent<Library3DApplyDetail>).detail;
      if (!detail) return;
      // Món không phải vật liệu ⇒ KHÔNG nhận việc: để nguyên `claimed=false` cho nơi khác (hoặc
      // câu báo mặc định của LibrarySheet) xử. Nhận bừa rồi ghi specId bậy còn tệ hơn không nhận.
      if (!laMonVatLieu(detail)) return;

      detail.claimed = true; // đã nhận việc — từ đây MỌI ngả đều phải báo đúng sự thật
      const ten = detail.name ?? '—';
      const bao = (lyDo: LyDoKhongGan) => {
        const c = cauBaoKhongGan(lyDo, ten);
        detail.loi = tr(c.vi, c.en);
      };

      const ui = useTree3DUi.getState();
      if (!ui.selectedName) return bao('chua-chon');

      // entityId: đường bấm-vào-khối đã đặt sẵn (`pick`); đường chọn từ cây Navigator thì chưa,
      // nên tra ngược tên group → entity qua CHÍNH scene đang hiện (không nguồn thứ hai).
      const entityId =
        ui.selectedEntityId ?? scene?.groups.find((g) => g.name === ui.selectedName)?.entityId ?? null;
      if (!entityId) return bao('khong-co-entity');

      const specId = traSpecId(detail.code ?? '', materials);
      if (!specId) return bao('khong-tra-duoc-ma');

      const doc = useCadStore.getState().doc;
      const kq: KetQuaGan = ganSpecVaoEntity(doc, entityId, specId);
      if (!kq.ok || !kq.entityMoi) return bao(kq.lyDo ?? 'entity-mat');

      useCadStore.getState().updateEntities([kq.entityMoi]);

      /* ⚠️ `updateEntities` BỎ QUA entity thuộc layer đang KHOÁ (`lib/cad/store.ts:632`) và trả
         về lặng lẽ. Đọc lại Doc để biết ghi có ăn không — KHÔNG tin là đã ghi chỉ vì đã gọi hàm.
         Đây đúng bài học `docs/00-CHOT.md` 04/09: "có trong mã" không bằng "tới được người dùng". */
      const sau = useCadStore.getState().doc.entities.find((x) => x.id === entityId);
      if (sau?.specId !== specId) {
        detail.loi = tr(
          `Chưa áp được "${ten}" — khối này nằm trên lớp đang khoá. Mở khoá lớp rồi áp lại.`,
          `Couldn't apply "${ten}" — this block sits on a locked layer. Unlock it and try again.`,
        );
      }
    }
    window.addEventListener(LIBRARY_APPLY_EVENT, onApply);
    return () => window.removeEventListener(LIBRARY_APPLY_EVENT, onApply);
  }, [scene, materials, tr]);

  return null;
}
