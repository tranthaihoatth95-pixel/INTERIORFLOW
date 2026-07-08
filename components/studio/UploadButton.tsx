'use client';

/**
 * components/studio/UploadButton.tsx — Nút "Tải lên" cạnh StageSwitcher, hành vi THEO CHẶNG:
 *   - Concept: mở Moodboard modal (chọn ảnh → style → moodboard, KHÔNG node).
 *   - Render:  chọn ảnh từ máy → tạo node Import Image gắn sẵn ảnh (node là chính).
 *   - Present: sang slide studio /present-editor (ảnh nội dung slide thêm trong đó).
 * Thay hẳn khái niệm Canvas/Form cũ — Form giờ chỉ là "chỗ input ảnh để tạo nội dung".
 */

import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export function UploadButton() {
  const workspace = useFlowStore((s) => s.workspace);
  const setMoodboardOpen = useFlowStore((s) => s.setMoodboardOpen);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const tr = useT();

  const phase = workspace ?? 'render';

  const onClick = () => {
    if (phase === 'concept') {
      setMoodboardOpen(true);
    } else if (phase === 'present') {
      router.push('/present-editor');
    } else {
      // render → chọn ảnh tạo node Import Image
      fileRef.current?.click();
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const store = useFlowStore.getState();
    let x = 80;
    for (const f of files) {
      const dataUrl = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(String(reader.result));
        reader.onerror = () => rej(reader.error);
        reader.readAsDataURL(f);
      });
      store.addNode('input.image', { x, y: 80 });
      const n = useFlowStore.getState().nodes.at(-1);
      if (n) store.updateParam(n.id, 'file', dataUrl);
      x += 40;
    }
  };

  const label =
    phase === 'concept'
      ? tr('Tạo moodboard', 'Make moodboard')
      : phase === 'present'
        ? tr('Ảnh nội dung', 'Content images')
        : tr('Tải lên', 'Upload');

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        title={
          phase === 'concept'
            ? tr('Chọn ảnh → style → moodboard', 'Pick images → style → moodboard')
            : phase === 'present'
              ? tr('Thêm ảnh nội dung cho slide', 'Add content images to slides')
              : tr('Chọn ảnh từ máy → tạo node Import Image', 'Pick image → create Import Image node')
        }
        className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
      >
        <Upload size={13} /> <span className="hidden lg:inline">{label}</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFile} />
    </>
  );
}
