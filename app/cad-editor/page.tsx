'use client';

/**
 * app/cad-editor/page.tsx — CHẶNG 1 "Layout CAD": trình vẽ / bố trí mặt bằng 2D.
 * Mount StudioBar (active='cad' — trục điều hướng Concept·Render·Present dùng chung) +
 * CadEditor. Route đứng riêng, không dùng canvas node của app chính.
 */

import StudioBar from '@/components/studio/StudioBar';
import CadEditor from '@/components/cad/CadEditor';

export default function CadEditorPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      <StudioBar active="cad" />
      <CadEditor />
    </div>
  );
}
