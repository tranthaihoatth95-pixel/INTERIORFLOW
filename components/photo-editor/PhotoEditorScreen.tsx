'use client';

/**
 * components/photo-editor/PhotoEditorScreen.tsx — MÀN "Chỉnh ảnh" dùng chung
 * (tách khỏi app/photo-editor/page.tsx trong Task #21 · ĐỔ NỀN 1B).
 *
 * Hai route mount CÙNG component này:
 *   · `/projects/[id]/photo` — scope dự án (route chính thức).
 *   · `/photo-editor`        — route cũ, nay chỉ redirect; khi CHƯA xác định được dự án
 *                              nào đang hoạt động thì render thẳng màn này (hành vi cũ).
 *
 * Toàn bộ logic seed doc / handoff / write-back giữ NGUYÊN 100% từ bản cũ:
 *
 * PS-3: có 2 cách vào màn này:
 *  1) Mở TRỰC TIẾP (dán URL / phát triển biệt lập) → KHÔNG có handoff → seed tài liệu MẪU
 *     (rỗng, nền trắng).
 *  2) Mở từ trình dàn trang (nút "Chỉnh ảnh nâng cao" → `openAdvancedEditor` trong
 *     PresentEditor.tsx, qua `window.open(...)`) → CÓ handoff (`lib/photo-editor/handoff.ts`,
 *     stash sessionStorage NGAY TRƯỚC khi mở tab) → seed tài liệu từ ĐÚNG ảnh trên slide.
 *
 * Ghi về (write-back): khi có handoff, PhotoEditor nhận thêm prop `onWriteBack` — bấm
 * "Ghi về Present" sẽ composite tài liệu rồi ghi vào localStorage (`writePhotoEditorReturn`)
 * để tab Present (tab KHÁC — window.open) tự nhận qua sự kiện `storage`.
 *
 * Hydration-safe: mọi việc dựng doc chạy trong effect ở client.
 *
 * `consumedRef` chặn double-consume: `consumePhotoEditorIn()` là CONSUME-ONCE (đọc xong dọn
 * sessionStorage) — React 18 Strict Mode (dev) chạy effect mount HAI LẦN trên CÙNG 1 lần
 * mount thật; không chặn thì lần 2 nhận `null` rồi ĐÈ doc đã seed đúng bằng doc mẫu trắng.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import PhotoEditor from '@/components/photo-editor/PhotoEditor';
import { makeSampleDoc } from '@/lib/photo-editor/sample';
import { makeEmptyDoc, makeRasterLayer, type PhotoDoc } from '@/lib/photo-editor/model';
import { loadImage } from '@/lib/photo-editor/imaging';
import { AppChrome } from '@/components/studio/AppChrome';
import {
  consumePhotoEditorIn,
  writePhotoEditorReturn,
  type PhotoHandoffTarget,
} from '@/lib/photo-editor/handoff';

/** cạnh dài tối đa khi seed từ handoff — cùng giới hạn PhotoEditor.importImage() dùng cho ảnh đầu. */
const MAX_SIDE = 2400;

export default function PhotoEditorScreen() {
  const [doc, setDoc] = useState<PhotoDoc | null>(null);
  const [target, setTarget] = useState<PhotoHandoffTarget | null>(null);
  const consumedRef = useRef(false);

  useEffect(() => {
    // consumedRef (KHÔNG phải useState) sống qua cả 2 lần chạy effect ở Strict Mode — chặn
    // gọi consume lần 2. KHÔNG dùng cờ "cancelled" kiểu cleanup ở đây: cleanup mô phỏng của
    // Strict Mode chạy NGAY sau lần mount đầu (trước khi ảnh async tải xong) — nếu tự huỷ
    // theo cờ đó, kết quả tải đúng ảnh sẽ bị vứt bỏ oan.
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
      <AppChrome active="photo" />
      <div style={{ flex: 1, minHeight: 0 }}>
        {doc && <PhotoEditor initialDoc={doc} onWriteBack={target ? onWriteBack : undefined} />}
      </div>
    </div>
  );
}
