'use client';

/**
 * lib/useDismissable.ts — luật "đóng khi bấm ra ngoài / Escape" DÙNG CHUNG toàn app (mã 2.2.90).
 *
 * Trước hook này, ~10 chỗ tự viết luật này và TRỘN HAI HỌ SỰ KIỆN khác nhau — một số dùng
 * `mousedown` pha nổi (MenuButton/IOMenu/RenderIOMenus cũ), Popover.tsx lại dùng `pointerdown`
 * pha bắt. `pointerdown` bắn TRƯỚC `mousedown`, và pha bắt chạy TRƯỚC pha nổi — khi 2 lớp nổi
 * lồng nhau, thứ tự ai đóng trước bị HỌ SỰ KIỆN quyết định chứ không phải do lớp nào NẰM TRÊN.
 * Hook này CHỐT 1 họ sự kiện duy nhất (`pointerdown`, pha bắt) cho toàn app — không cho người
 * gọi chọn lại họ sự kiện, chọn lại là mở lại đúng cái hố đã trả giá.
 *
 * Escape dùng `capture: true` tại document (chặn input con nuốt mất phím trước khi event lan
 * xuống tới nó), nhưng CHỈ LỚP TRÊN CÙNG (đăng ký sau cùng, theo thứ tự mount — luật d) mới thực
 * sự đóng — `stopPropagation` giữa nhiều listener CÙNG gắn trên `document` không loại nhau (chỉ
 * `stopImmediatePropagation` mới làm được điều đó), nên việc "chỉ lớp trên cùng phản ứng" phải tự
 * theo dõi bằng 1 stack module-level, không dựa vào cơ chế event.
 *
 * `stopPropagation()` CHỈ được gọi SAU KHI đã xác nhận lớp này thật sự đóng (đỉnh stack + không
 * bị `guard` chặn) — KHÔNG gọi vô điều kiện ngay khi thấy phím Escape. Toàn app còn ~11 chỗ nghe
 * Escape kiểu `window` pha nổi (CommandPalette, AppChrome, StageSwitcher, FlowCanvas…) — gọi
 * `stopPropagation` sớm ở pha bắt tại document sẽ chặn đứng phím trước khi nó kịp nổi lên `window`,
 * kể cả khi hook này KHÔNG làm gì (vd bị `guard` chặn) — phím biến mất, im lặng, không lớp nào
 * nhận được. Dời xuống sau 2 phép kiểm vẫn giữ nguyên tác dụng chặn input con NUỐT phím (vì đó là
 * lớp trên cùng thật sự đóng → stopPropagation → input con không bao giờ thấy event), chỉ khác
 * là lớp không-thật-sự-đóng thì để nguyên event đi tiếp.
 *
 * KHÔNG có cơ chế lớp cha–lớp con (parentId liên kết layer nọ render qua portal NẰM TRONG layer
 * kia) — hiện chưa có ca nào thật trong app để test, xây cho ca chưa tồn tại là đúng loại rủi ro
 * đã trả giá (CLAUDE.md luật #4). TODO: bật khi xuất hiện layer render qua portal nằm bên trong
 * layer khác (lúc đó "bấm ra ngoài" của layer cha phải BỎ QUA target nằm trong layer con).
 */

import { useEffect, useRef, type RefObject } from 'react';

interface UseDismissableOptions {
  open: boolean;
  onDismiss: () => void;
  /** biên của lớp — bấm bên TRONG bất kỳ ref nào ở đây không tính là "ra ngoài". */
  refs: RefObject<HTMLElement | null>[];
  /** false = lớp bảo vệ, chỉ đóng bằng Escape (không đóng khi bấm ra ngoài). Mặc định true. */
  outside?: boolean;
  /** trả true để tạm chặn đóng (vd đang có thao tác dở dang). */
  guard?: () => boolean;
}

let stackSeq = 0;
/** id các lớp đang mở, theo đúng thứ tự mount — phần tử cuối = lớp trên cùng. */
const openStack: number[] = [];

export function useDismissable({ open, onDismiss, refs, outside = true, guard }: UseDismissableOptions): void {
  // luôn giữ bản mới nhất qua ref — effect dưới chỉ cần chạy lại theo [open], không theo mỗi
  // lần onDismiss/refs/guard đổi tham chiếu (tránh gỡ-gắn lại listener + tính lại vị trí stack
  // mỗi lần component cha re-render).
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const refsRef = useRef(refs);
  refsRef.current = refs;
  const guardRef = useRef(guard);
  guardRef.current = guard;

  useEffect(() => {
    if (!open) return;

    const id = ++stackSeq;
    openStack.push(id);

    let armed = false; // false trong lúc chờ tick sau — chặn đúng cú bấm vừa mở lớp này
    const rafId = requestAnimationFrame(() => {
      armed = true;
    });

    const onPointerDown = (e: PointerEvent) => {
      if (!armed) return;
      if (guardRef.current?.()) return;
      const inside = refsRef.current.some((r) => r.current && r.current.contains(e.target as Node));
      if (inside) return;
      onDismissRef.current();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (openStack[openStack.length - 1] !== id) return; // không phải lớp trên cùng — bỏ qua
      if (guardRef.current?.()) return;
      e.stopPropagation(); // chỉ chặn lan xuống input con SAU KHI xác nhận lớp này thật sự đóng
      onDismissRef.current();
    };

    if (outside) document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKey, true);

    return () => {
      cancelAnimationFrame(rafId);
      if (outside) document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKey, true);
      const i = openStack.indexOf(id);
      if (i !== -1) openStack.splice(i, 1);
    };
  }, [open, outside]);
}
