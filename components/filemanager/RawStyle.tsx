'use client';

/** Bơm CSS thô — dùng `dangerouslySetInnerHTML`, KHÔNG `<style>{css}</style>` (React escape text
 * con thành HTML entity, trình duyệt không giải mã entity trong `<style>` → CSS vỡ + hydration
 * mismatch — bug thật đã gặp và sửa ở lib G4 trước, xem docs/BAO-CAO-FM.md). */
export function RawStyle({ css }: { css: string }) {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
