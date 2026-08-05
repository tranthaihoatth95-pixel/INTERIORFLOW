/**
 * lib/colors/registry.ts — CỬA CHẶN LÚC CHẠY (lý do kiến trúc Hoà nêu: *"có thư yêu cầu gỡ thì
 * đổi config, không build lại app"*).
 *
 * Bảng màu không nằm trong bundle (xem `types.ts`), nên "gỡ" là chuyện DỮ LIỆU, không phải chuyện
 * phát hành. Nhưng dữ liệu nằm rải ở máy từng studio — nếu một hãng gửi thư yêu cầu gỡ thì cần
 * một công tắc **có hiệu lực ngay, không cần đợi ai cập nhật app**:
 *
 *   • `blockedBrands` — chặn theo TÊN HÃNG, xuyên mọi nguồn. Đây là công tắc hay dùng nhất: một
 *     bảng CSV studio tự kéo vào có thể trộn nhiều hãng, chặn cả nguồn là chặn oan phần còn lại.
 *   • `disabledSourceIds` — tắt hẳn một nguồn cụ thể mà KHÔNG xoá dữ liệu (bật lại được nếu sau
 *     đó làm rõ được giấy phép; xoá là mất công nạp lại).
 *
 * Cấu hình đọc theo thứ tự, cái sau GỘP THÊM chứ không thay thế:
 *   1. `NEXT_PUBLIC_IF_BLOCKED_COLOR_BRANDS` (env, phẩy ngăn) — mức phát hành, cho bản đóng gói.
 *   2. `localStorage` (`interiorflow.colorRegistry`) — mức máy, sửa được ngay trong IF.
 * Gộp-thêm chứ không ghi-đè là CỐ Ý: chặn ở mức phát hành thì máy lẻ KHÔNG được tự mở lại.
 *
 * `applyRegistryConfig` là hàm THUẦN — đó là chỗ có test; phần đọc env/localStorage chỉ là vỏ.
 */

import type { ColorSource } from './types';

export interface ColorRegistryConfig {
  disabledSourceIds: string[];
  /** So khớp KHÔNG phân biệt hoa/thường và bỏ khoảng trắng thừa ("Dulux" = "dulux " = "DULUX"). */
  blockedBrands: string[];
}

export const EMPTY_REGISTRY_CONFIG: ColorRegistryConfig = { disabledSourceIds: [], blockedBrands: [] };

const KEY = 'interiorflow.colorRegistry';

function normBrand(s: string): string {
  return (s || '').trim().toLowerCase();
}

/**
 * Áp cấu hình lên danh sách nguồn. THUẦN.
 * - Nguồn bị tắt → biến mất khỏi kết quả.
 * - Màu có `brand` bị chặn → biến mất khỏi nguồn; nguồn rỗng sạch thì **vẫn giữ lại** (colors=[])
 *   để UI nói được "bảng này đã bị gỡ theo yêu cầu" thay vì im lặng mất tiêu — biến mất không
 *   giải thích là kiểu hỏng người dùng báo lại thành "app mất dữ liệu của tôi".
 */
export function applyRegistryConfig(sources: ColorSource[], config: ColorRegistryConfig): ColorSource[] {
  const disabled = new Set(config.disabledSourceIds);
  const blocked = new Set(config.blockedBrands.map(normBrand).filter(Boolean));
  return sources
    .filter((s) => !disabled.has(s.id))
    .map((s) =>
      blocked.size === 0
        ? s
        : { ...s, colors: s.colors.filter((c) => !blocked.has(normBrand(c.brand ?? ''))) },
    );
}

/** Gộp 2 cấu hình (env + máy) — hợp của cả hai, khử trùng. */
export function mergeRegistryConfig(a: ColorRegistryConfig, b: ColorRegistryConfig): ColorRegistryConfig {
  return {
    disabledSourceIds: [...new Set([...a.disabledSourceIds, ...b.disabledSourceIds])],
    blockedBrands: [...new Set([...a.blockedBrands, ...b.blockedBrands])],
  };
}

/** Cấu hình mức phát hành (env). Thuần theo nghĩa "không đụng localStorage" — test được. */
export function envRegistryConfig(env: Record<string, string | undefined>): ColorRegistryConfig {
  const brands = (env.NEXT_PUBLIC_IF_BLOCKED_COLOR_BRANDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const ids = (env.NEXT_PUBLIC_IF_DISABLED_COLOR_SOURCES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return { disabledSourceIds: ids, blockedBrands: brands };
}

/* ═══════════════════════ vỏ đọc/ghi (client) ═══════════════════════ */

export function readLocalRegistryConfig(): ColorRegistryConfig {
  if (typeof window === 'undefined') return EMPTY_REGISTRY_CONFIG;
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null') as Partial<ColorRegistryConfig> | null;
    if (!j) return EMPTY_REGISTRY_CONFIG;
    return {
      disabledSourceIds: Array.isArray(j.disabledSourceIds) ? j.disabledSourceIds.filter((x) => typeof x === 'string') : [],
      blockedBrands: Array.isArray(j.blockedBrands) ? j.blockedBrands.filter((x) => typeof x === 'string') : [],
    };
  } catch {
    return EMPTY_REGISTRY_CONFIG;
  }
}

export function writeLocalRegistryConfig(config: ColorRegistryConfig): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

/** Cấu hình có hiệu lực = env (phát hành) ∪ máy. */
export function effectiveRegistryConfig(): ColorRegistryConfig {
  return mergeRegistryConfig(
    envRegistryConfig({
      NEXT_PUBLIC_IF_BLOCKED_COLOR_BRANDS: process.env.NEXT_PUBLIC_IF_BLOCKED_COLOR_BRANDS,
      NEXT_PUBLIC_IF_DISABLED_COLOR_SOURCES: process.env.NEXT_PUBLIC_IF_DISABLED_COLOR_SOURCES,
    }),
    readLocalRegistryConfig(),
  );
}
