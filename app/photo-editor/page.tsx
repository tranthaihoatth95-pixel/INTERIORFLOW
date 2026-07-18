'use client';

/**
 * app/photo-editor/page.tsx — Route standalone `/photo-editor`.
 *
 * PS-3: giờ có 2 cách vào trang này:
 *  1) Mở TRỰC TIẾP (dán URL / phát triển biệt lập) → KHÔNG có handoff → seed tài liệu MẪU
 *     (rỗng, nền trắng) y hệt trước — hành vi cũ giữ nguyên 100%.
 *  2) Mở từ /present-editor (nút "Chỉnh ảnh nâng cao" → `openAdvancedEditor` trong
 *     PresentEditor.tsx, qua `window.open('/photo-editor', '_blank')`) → CÓ handoff
 *     (`lib/photo-editor/handoff.ts`, stash sessionStorage NGAY TRƯỚC khi mở tab) → seed
 *     tài liệu từ ĐÚNG ảnh trên slide (như 1 raster layer), không phải doc trắng.
 *
 * Ghi về (write-back): khi có handoff, PhotoEditor nhận thêm prop `onWriteBack` — bấm
 * "Ghi về Present" sẽ composite tài liệu (exportDoc PNG, engine sẵn có) rồi ghi vào
 * localStorage (`writePhotoEditorReturn`) để tab /present-editor (tab KHÁC — window.open)
 * tự nhận qua sự kiện `storage` và cập nhật đúng ImageElement trên slide.
 *
 * StudioBar ở đầu để chuyển Node ↔ Dàn trang ↔ Chỉnh ảnh + luôn có đường về app chính.
 * Hydration-safe: mọi việc dựng doc (kể cả doc mẫu) chạy trong effect ở client, không ở
 * render body — tránh cả 2 nhánh (mẫu / handoff) gây lệch hydration.
 *
 * `consumedRef` chặn double-consume: `consumePhotoEditorIn()` là CONSUME-ONCE (đọc xong dọn
 * sessionStorage) — React 18 Strict Mode (dev) chạy effect mount HAI LẦN (mount → cleanup →
 * mount lại) trên CÙNG 1 lần mount thật; không chặn thì lần chạy thứ 2 gọi lại hàm consume,
 * nhận `null` (đã bị lần đầu dọn sạch) rồi ĐÈ doc đã seed đúng bằng doc mẫu trắng. Ref sống
 * qua cả 2 lần chạy effect (khác useState — không bị reset) nên chặn được, hành vi PROD không đổi
 * (PROD chỉ chạy effect 1 lần nên ref không cần thiết nhưng vô hại).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import PhotoEditor from '@/components/photo-editor/PhotoEditor';
import { makeSampleDoc } from '@/lib/photo-editor/sample';
import { makeEmptyDoc, makeRasterLayer, type PhotoDoc } from '@/lib/photo-editor/model';
import { loadImage } from '@/lib/photo-editor/imaging';
import StudioBar from '@/components/studio/StudioBar';
import {
  consumePhotoEditorIn,
  writePhotoEditorReturn,
  type PhotoHandoffTarget,
} from '@/lib/photo-editor/handoff';

/** cạnh dài tối đa khi seed từ handoff — cùng giới hạn PhotoEditor.importImage() dùng cho ảnh đầu. */
const MAX_SIDE = 2400;

export default function PhotoEditorPage() {
  const [doc, setDoc] = useState<PhotoDoc | null>(null);
  const [target, setTarget] = useState<PhotoHandoffTarget | null>(null);
  const consumedRef = useRef(false);

  useEffect(() => {
    // consumedRef (KHÔNG phải useState) sống qua cả 2 lần chạy effect ở Strict Mode — chặn
    // gọi consume lần 2. KHÔNG dùng cờ "cancelled" kiểu cleanup ở đây: cleanup mô phỏng của
    // Strict Mode chạy NGAY sau lần mount đầu (trước khi ảnh async tải xong) — nếu tự huỷ
    // theo cờ đó, kết quả tải đúng ảnh sẽ bị vứt bỏ oan. Tác vụ này gắn 1-1 với vòng đời
    // trang, an toàn để hoàn tất kể cả khi Strict Mode mô phỏng unmount.
    if (consumedRef.current) return;
    consumedRef.current = true;
    const handoff = consumePhotoEditorIn();
    if (!handoff) {
      // Không có handoff — mở biệt lập/test, giữ NGUYÊN hành vi cũ (doc mẫu trắng).
      setDoc(makeSampleDoc());
      return;
    }
    (async () => {
      try {
        const img = await loadImage(handoff.src);
        const iw = img.naturalWidth || img.width || 1280;
        const ih = img.naturalHeight || img.height || 800;
        const scale = Math.min(1, MAX_SIDE / Math.max(iw, ih));
        const w = Math.round(iw * scale) || 1280;
        const h = Math.round(ih * scale) || 800;
        const d = makeEmptyDoc(w, h);
        d.name = 'Ảnh từ Present';
        d.layers.push(makeRasterLayer(handoff.src, { name: 'Ảnh gốc' }));
        setDoc(d);
        setTarget(handoff.target);
      } catch (e) {
        // Ảnh handoff hỏng/CORS — rơi về doc mẫu trắng thay vì kẹt màn hình trắng vô thời hạn.
        console.error('[photo-editor] không tải được ảnh từ Present, dùng doc mẫu', e);
        setDoc(makeSampleDoc());
      }
    })();
  }, []);

  const onWriteBack = useCallback(
    (dataUrl: string) => {
      if (!target) return;
      writePhotoEditorReturn(dataUrl, target);
    },
    [target],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <StudioBar active="photo" />
      <div style={{ flex: 1, minHeight: 0 }}>
        {doc && <PhotoEditor initialDoc={doc} onWriteBack={target ? onWriteBack : undefined} />}
      </div>
    </div>
  );
}
