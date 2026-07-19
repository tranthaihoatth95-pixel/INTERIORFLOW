'use client';

/**
 * app/cad-editor/page.tsx — CHẶNG 1 "Drafting CAD": trình vẽ / bố trí mặt bằng 2D.
 * Mount StudioBar (active='cad' — trục điều hướng Concept·Render·Present dùng chung) +
 * CadEditor. Route đứng riêng, không dùng canvas node của app chính.
 *
 * Sprint 2:
 *  - C-4: nội dung bọc <StageEnter> — vào chặng bằng crossfade + scale "dynamic wallpaper".
 *  - D-1: <FoldableDualPane> — màn thường y cũ; máy gập mở (hoặc cờ labs `dualpane`)
 *    thêm pane Reference chỉ-xem bên kia bản lề. Không đụng nội bộ CadSheets.
 */

import StudioBar from '@/components/studio/StudioBar';
import CadSheets from '@/components/cad/CadSheets';
import { StageEnter } from '@/components/studio/StageTransition';
import FoldableDualPane from '@/components/studio/FoldableDualPane';
import ReferencePane from '@/components/studio/ReferencePane';

export default function CadEditorPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      <StudioBar active="cad" />
      <StageEnter>
        {/* Tầng multi-sheet (phụ-thêm): thanh tab + CadEditor. 1 sheet ⇒ y hệt bản cũ. */}
        <FoldableDualPane primary={<CadSheets />} secondary={<ReferencePane />} />
      </StageEnter>
    </div>
  );
}
