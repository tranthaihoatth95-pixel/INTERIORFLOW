/** 4 mặt tiền route của AppChrome — tách riêng file để `lib/studio/stage-nav.ts` import được
 * mà không tạo vòng lặp import với `AppChrome.tsx` (component import ngược lại `stage-nav.ts`). */
export type AppChromeActive = 'render' | 'cad' | 'present' | 'photo';
