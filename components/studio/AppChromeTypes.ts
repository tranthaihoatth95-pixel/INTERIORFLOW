/** 4 mặt tiền route của AppChrome + mặt 'home' (17/08, phiếu P-ROUTER-HOME — Hoà chốt 16/08
 * "sidebar là hệ router toàn app; ba chặng chỉ là MỘT nhóm stage"). Home KHÔNG phải chặng
 * thiết kế — bọc trong `<AppShell active="home">` chỉ để rail điều hướng hiện ở '/'.
 * Tách riêng file để `lib/studio/stage-nav.ts` import được mà không tạo vòng lặp import với
 * `AppChrome.tsx` (component import ngược lại `stage-nav.ts`).
 *
 * ⚠️ Nơi nhận `AppChromeActive` KHÔNG cần thêm case 'home' — tất cả đều đã null-safe / có
 * default: `activeToPhase` (if/else chain default 'render'), `routeScope` (return null),
 * `AppCommandPalette` (fallback 'render'), AppChrome StageSwitcher (không mục nào active, đúng
 * ngữ nghĩa Home không thuộc chặng nào). */
export type AppChromeActive = 'render' | 'cad' | 'present' | 'photo' | 'home';
