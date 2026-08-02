'use client';

/**
 * Bơm CSS thô cho mode Vẽ 3D — `dangerouslySetInnerHTML`, KHÔNG `<style>{css}</style>`.
 *
 * Lý do (bug thật đã gặp và sửa ở đợt trước): React HTML-escape text con khi render server
 * (`'` → `&#x27;`), nhưng trình duyệt KHÔNG giải mã entity bên trong `<style>` ⇒ CSS vỡ ở bản
 * server-render, lệch bản client ⇒ hydration mismatch.
 *
 * Có 1 bản y hệt ở `components/filemanager/RawStyle.tsx` — cố ý KHÔNG import chéo: vùng code
 * `components/three/*` phải tự đứng được để CHINH cắm vào `AppShell` mà không kéo theo File
 * Manager. 5 dòng, trùng lặp rẻ hơn phụ thuộc chéo.
 */
export function RawStyle({ css }: { css: string }) {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
