'use client';

/**
 * components/MoodboardModal.tsx — Overlay "Tạo Moodboard" cho chặng CONCEPT.
 *
 * Vai trò (user chốt): ở Concept, nút "Tải lên" mở bảng chọn ảnh (như form cũ) → chọn
 * nhiều hình → chọn style → Moodboard. KHÔNG dùng node. Tái dùng nguyên ConceptForm.
 * Mở/đóng qua store.moodboardOpen. Portal-free (đã nằm ngoài mọi transform ở page root).
 */

import { X } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { ConceptForm } from './form/ConceptForm';

export function MoodboardModal() {
  const open = useFlowStore((s) => s.moodboardOpen);
  const setOpen = useFlowStore((s) => s.setMoodboardOpen);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 sm:p-8"
      onClick={() => setOpen(false)}
    >
      <div
        className="flex max-h-full w-full max-w-[1120px] flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header modal */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[var(--t1)]">Tạo Moodboard</h2>
          <button
            onClick={() => setOpen(false)}
            title="Đóng"
            className="grid h-8 w-8 place-items-center rounded-[10px] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
          >
            <X size={18} />
          </button>
        </div>
        {/* nội dung — cuộn dọc */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <ConceptForm />
        </div>
      </div>
    </div>
  );
}
