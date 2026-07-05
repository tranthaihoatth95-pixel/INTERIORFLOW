/**
 * Dàn model "chế độ xịn" (AI Cao) — nhiều model đỉnh cho ảnh chốt, chạy qua fal.
 * Whitelist: chỉ các key ở đây mới được /api/render/premium gọi (không cho model tuỳ ý).
 * Chưa nạp balance fal → route trả placeholder có nhãn model (demo/mock vẫn chạy).
 */
export interface PremiumModel {
  key: string;
  name: string;
  fal: string;      // fal model id
  strength: string; // điểm mạnh — hiện trên UI/board so sánh
  tint: string;     // màu nhãn khi mock
}

export const PREMIUM_MODELS: PremiumModel[] = [
  { key: 'flux-pro', name: 'FLUX 1.1 Pro', fal: 'fal-ai/flux-pro/v1.1', strength: 'Photoreal hero', tint: '#C79A63' },
  { key: 'sd35', name: 'SD 3.5 Large', fal: 'fal-ai/stable-diffusion-v35-large', strength: 'Đa dạng · rẻ', tint: '#7C9A6B' },
  { key: 'ideogram', name: 'Ideogram v3', fal: 'fal-ai/ideogram/v3', strength: 'Chữ · biển hiệu', tint: '#6B84A8' },
  { key: 'recraft', name: 'Recraft V3', fal: 'fal-ai/recraft-v3', strength: 'Trung thực vật liệu', tint: '#9A6B84' },
];

export const DEFAULT_COMPARE = ['flux-pro', 'sd35', 'ideogram', 'recraft'];

export function getPremiumModel(key: string): PremiumModel | undefined {
  return PREMIUM_MODELS.find((m) => m.key === key);
}
export function isPremiumModel(key: unknown): key is string {
  return typeof key === 'string' && PREMIUM_MODELS.some((m) => m.key === key);
}
