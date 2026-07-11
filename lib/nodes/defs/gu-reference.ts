/**
 * input.guref — kéo hồ sơ "gu" (Gu Engine, lib/gu.ts) từ thư viện Reference ra làm 1
 * node ĐỘC LẬP, thay vì chỉ ẩn ngầm bên trong các node ai.* (sketch2render/clay2render…
 * vốn tự gọi guRenderPrompt() nội bộ). Lợi ích: user THẤY rõ gu đang áp là gì, và có
 * thể cắm mẩu prompt này vào BẤT KỲ node nào nhận input text (nối tiếp cùng prompt
 * khác, hoặc feed thẳng vào node không tự đọc gu). 0 credit — chỉ đọc /api/library.
 */
import type { NodeDefinition } from '@/lib/types';
import { fetchGuProfile, guToPrompt } from '@/lib/gu';
import { USAGES } from '@/lib/refingest';

const ALL_LABEL = 'Tất cả';
const USAGE_OPTIONS = [ALL_LABEL, ...USAGES.map((u) => u.label)];
const LABEL_TO_USAGE: Record<string, string> = Object.fromEntries(USAGES.map((u) => [u.label, u.id]));

export const guReferenceNodes: NodeDefinition[] = [
  {
    type: 'input.guref',
    title: 'Gu Reference',
    category: 'INPUT',
    description:
      'Trích gu (palette · vật liệu · phong cách) từ thư viện Reference đã lưu → mẩu prompt, nối vào node AI khác.',
    inputs: [],
    outputs: [{ id: 'text', label: 'Gu prompt', dataType: 'text' }],
    params: [{ kind: 'select', id: 'usage', label: 'Lọc theo mục dùng', options: USAGE_OPTIONS }],
    creditCost: 0,
    async execute({ params, onProgress }) {
      onProgress(0.3);
      const label = String(params.usage ?? ALL_LABEL);
      const usage = label === ALL_LABEL ? undefined : LABEL_TO_USAGE[label];
      const profile = await fetchGuProfile(usage ? [usage] : undefined);
      onProgress(0.8);
      if (!profile.count) {
        throw new Error('Thư viện Reference chưa có ảnh (mục lọc này) — thêm ảnh vào Library rồi thử lại.');
      }
      const value = guToPrompt(profile);
      onProgress(1);
      return { text: { dataType: 'text', value: value || '(gu trống — chưa nhận diện được tag/màu từ ref)' } };
    },
  },
];
