'use client';

/**
 * lib/present-editor/present-return.ts — MỐC "QUAY VỀ TRÌNH BÀY" cho demo deep-link (21/08).
 *
 * Bài toán: đang trình chiếu slide N, bấm một deep link trên slide → nhảy sang ngữ cảnh sống
 * (2D/3D/Files…). Quay về phải là ĐÚNG SLIDE N Ở CHẾ ĐỘ TRÌNH CHIẾU — không phải Present home,
 * không phải slide 1 (yêu cầu cứng của kịch bản demo: người trình bày không được lạc).
 *
 * [Đ2] pattern CONSUME-ONCE + sessionStorage — đúng khuôn mọi cầu handoff của Present
 * (`handoff.ts` · `spec-present-handoff.ts` · `to-ban-ve.ts`): sessionStorage vì mốc là chuyện
 * CỦA PHIÊN TRÌNH BÀY này (đóng tab là hết demo, không có lý do sống lâu hơn), consume-once vì
 * áp lại mốc cũ lần thứ hai là tự nhảy slide sau lưng người dùng.
 *
 * Hai đầu dây:
 *  · `SlidePlayer.tsx` GHI mốc ngay trước khi router.push deep link.
 *  · `PresentEditor.tsx` TIÊU mốc lúc mount: nhảy đúng slide + tự vào lại chế độ trình chiếu.
 *  · `AppChrome.tsx` ĐỌC (không tiêu) để bày viên "Quay về Trình bày" trên mọi màn khác.
 */

export interface PresentReturnMark {
  /** Đường Present để quay về — giữ nguyên projectId đang trình bày. */
  path: string;
  /** Slide đang đứng lúc rời đi (0-based). */
  slideIndex: number;
  ts: number;
}

const KEY = 'interiorflow.presentReturn';

export function savePresentReturn(mark: Omit<PresentReturnMark, 'ts'>): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...mark, ts: Date.now() }));
  } catch {
    /* sessionStorage chặn — mất tiện nghi quay-về, không chặn điều hướng */
  }
}

/** Đọc KHÔNG tiêu — cho viên "Quay về Trình bày" quyết định có hiện hay không. */
export function peekPresentReturn(): PresentReturnMark | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as PresentReturnMark;
    return typeof m.path === 'string' && m.path.startsWith('/') && typeof m.slideIndex === 'number' ? m : null;
  } catch {
    return null;
  }
}

/** Tiêu mốc — gọi ở PresentEditor khi đã áp xong (consume-once). */
export function consumePresentReturn(): PresentReturnMark | null {
  const m = peekPresentReturn();
  if (m) {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
  return m;
}

/** Huỷ mốc không áp (người dùng tự thoát demo giữa chừng). */
export function clearPresentReturn(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
