/**
 * util.sketchpad — "Free Sketch": vẽ tay tự do (brush/eraser/line/shape + palette màu,
 * undo/redo) → xuất ảnh (data URL) cắm thẳng vào ai.sketch2render (control image) hoặc
 * bất kỳ node nhận `image`. UI vẽ thật ở components/sketch/SketchStudioModal.tsx (mở
 * qua param kind 'sketch' — xem InteriorNode.tsx ParamField). Node chỉ là "cổng" giữ
 * data URL đã vẽ. 0 AI, 0 credit.
 */
import type { NodeDefinition } from '@/lib/types';

export const sketchNodes: NodeDefinition[] = [
  {
    type: 'util.sketchpad',
    title: 'Free Sketch',
    category: 'UTILITY',
    description:
      'Vẽ phác tay tự do (brush/eraser/đường thẳng/hình khối, palette màu vật liệu) — mở Sketch Studio trên node. 0 credit.',
    inputs: [{ id: 'background', label: 'Ảnh nền để đồ theo (tuỳ chọn)', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Sketch', dataType: 'image' }],
    params: [{ kind: 'sketch', id: 'sketch', label: 'Vẽ tay' }],
    creditCost: 0,
    async execute({ inputs, params }) {
      const drawn = params.sketch as string;
      if (!drawn) throw new Error('Chưa vẽ gì — bấm "Vẽ tay" trên node để mở Sketch Studio.');
      // background input chỉ dùng để trace trong studio — không bắt buộc cho execute.
      void inputs.background;
      return { image: { dataType: 'image', value: drawn } };
    },
  },
];
