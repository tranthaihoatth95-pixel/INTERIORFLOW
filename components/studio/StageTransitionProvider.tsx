'use client';

/**
 * components/studio/StageTransitionProvider.tsx — TẦNG CHUYỂN CHẶNG ĐẶT TRÊN ROUTE.
 *
 * VÌ SAO CÓ FILE NÀY (rà soát motion 20/07)
 * ----------------------------------------
 * Bản cũ đặt <StageVeil> BÊN TRONG StudioBar/Header — tức là bên trong cây React của route
 * ĐANG RỜI ĐI. Hệ quả (nhìn thấy được, không phải lý thuyết):
 *
 *   1. `router.push` xong → route cũ unmount → StudioBar unmount → AnimatePresence bọc veil
 *      unmount theo → veil BIẾN MẤT TỨC THÌ, `exit` không bao giờ chạy.
 *   2. Đúng lúc đó route mới mount với <StageEnter> ở opacity 0 (wallpaperIn fade 450ms).
 *      Giữa hai việc đó có một khoảng màn hình chỉ còn `var(--bg)` phẳng + thanh StudioBar
 *      hiện tức thì ở trên → đây chính là cú "chớp" người dùng cảm thấy.
 *   3. Veil fade VÀO mất 280ms nhưng nav đã prefetch thường xong sớm hơn, nên nhiều khi route
 *      đổi lúc veil mới ~50% → thấy trang cũ mờ nửa chừng rồi bị thay phựt.
 *
 * CÁCH SỬA: đưa veil LÊN root layout — trên cả hai route — nên nó SỐNG XUYÊN qua lần đổi
 * route. Trình tự mới chỉ còn MỘT lần crossfade, không có khoảng nền phẳng:
 *
 *   click → veil fade vào (DUR.stage) → đổi route dưới lớp veil → route mới vẽ xong
 *         → veil fade ra, để lộ nội dung ĐÃ SẴN SÀNG ở opacity 1.
 *
 * <StageEnter> ở route đích đọc `arriving` từ context: nếu đang có veil che thì KHÔNG tự fade
 * nữa (veil lo phần chuyển cảnh rồi) — tránh fade chồng fade. Vào thẳng bằng URL (không có veil)
 * thì vẫn chạy `wallpaperIn` như cũ.
 *
 * Tiện thể bọc luôn <MotionConfig reducedMotion="user"> cho TOÀN BỘ app: framer-motion sẽ tự bỏ
 * animation transform/layout khi người dùng bật Reduce Motion. Trước đó chỉ 6/36 file tự xử lý
 * việc này bằng tay; giờ mặc định đúng ở mọi nơi, file nào cần tinh chỉnh thêm vẫn tự do dùng
 * `useReducedMotion()`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import type { Phase } from '@/lib/phases';
import { StageVeil } from './StageTransition';

interface StageTransitionValue {
  /** Bật màn che rồi mới điều hướng. Gọi TRƯỚC `router.push`. */
  begin: (target: Phase) => void;
  /** True khi route hiện tại vừa được mở DƯỚI lớp veil (dùng cho StageEnter). */
  arriving: boolean;
}

const Ctx = createContext<StageTransitionValue>({ begin: () => {}, arriving: false });

/** Dùng trong StudioBar/Header để mở màn che trước khi đổi route. */
export function useStageTransition() {
  return useContext(Ctx);
}

/**
 * Chốt chặn an toàn: nếu điều hướng hỏng (route lỗi, chunk tải fail) thì veil vẫn phải tự tắt,
 * không được che chết màn hình. Rộng tay hơn nhiều so với thời gian nav thật.
 */
const VEIL_MAX_MS = 6000;

export default function StageTransitionProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<Phase | null>(null);
  const pathname = usePathname();
  // Path lúc bấm — để biết route đã ĐỔI chưa (chứ không chỉ "đã qua bao lâu").
  const fromPath = useRef<string | null>(null);

  const begin = useCallback(
    (next: Phase) => {
      fromPath.current = pathname;
      setTarget(next);
    },
    [pathname],
  );

  // Route đã đổi → đợi trình duyệt VẼ XONG khung đầu của trang mới rồi mới kéo veil ra.
  // 2 lần rAF: lần 1 chạy trước paint của khung hiện tại, lần 2 đảm bảo khung đó đã lên màn hình.
  //
  // ĐUA VỚI MỘT setTimeout NGẮN — bắt buộc: tab ở nền bị trình duyệt đóng băng rAF (đã dựng lại
  // được lỗi này lúc verify: điều hướng xong rồi chuyển tab đi, rAF không chạy nữa nên veil treo
  // tới tận van an toàn). Timer vẫn chạy (dù bị bóp còn ~1s) nên luôn có đường thoát. Bên nào
  // xong trước thì kéo màn ra — tab đang hiện gần như luôn là nhánh rAF (~2 khung hình).
  useEffect(() => {
    if (!target) return;
    if (fromPath.current === null || pathname === fromPath.current) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      fromPath.current = null;
      setTarget(null);
    };
    // 1 rAF là đủ để tránh chớp — 2 rAF cộng dồn với duration veil gây lag rõ (21/07).
    const raf1 = requestAnimationFrame(finish);
    const fallback = setTimeout(finish, 120);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(fallback);
    };
  }, [pathname, target]);

  // Van an toàn — veil không bao giờ được kẹt vĩnh viễn.
  useEffect(() => {
    if (!target) return;
    const t = setTimeout(() => {
      fromPath.current = null;
      setTarget(null);
    }, VEIL_MAX_MS);
    return () => clearTimeout(t);
  }, [target]);

  return (
    <Ctx.Provider value={{ begin, arriving: target !== null }}>
      <MotionConfig reducedMotion="user">
        {children}
        {/* Nằm NGOÀI `children` nên không bị route unmount cuốn theo — cả điểm mấu chốt là đây. */}
        <StageVeil show={target !== null} target={target} />
      </MotionConfig>
    </Ctx.Provider>
  );
}
