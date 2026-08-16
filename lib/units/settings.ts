'use client';

/**
 * lib/units/settings.ts — lựa chọn đơn vị/tỉ lệ PER-USER, lưu localStorage (Phiếu P-A ④.3:
 * "cùng khuôn các cài đặt sẵn có — không thêm bảng DB"). Theo đúng mẫu
 * `app/settings/_lib/local-state.ts` (đọc→hydrate trong `useEffect`→ghi lại mỗi lần đổi).
 *
 * KHÔNG lưu SỐ ĐO ở đây — chỉ lưu LỰA CHỌN đơn vị/tỉ lệ. Số đo luôn ở nguồn khác (Doc, entity)
 * và luôn là mm — đúng ràng buộc A7.
 */

import { useEffect, useState } from 'react';
import type { UnitId } from './index';
import { isValidScale } from './scale';

const STORAGE_KEY = 'interiorflow.units_v1';

export interface UnitsSettings {
  /** Đơn vị dùng để HIỂN THỊ mọi số đo trên bản vẽ/bảng vật liệu/BOQ. */
  displayUnit: UnitId;
  /** Đơn vị ngầm định khi người dùng gõ số KHÔNG kèm hậu tố — gõ kèm hậu tố tường minh
   * (vd "320cm") luôn thắng, bất kể setting này. */
  inputUnit: UnitId;
  /** Tỉ lệ in mặc định — luôn là một nấc trong SCALE_CHUAN (ràng buộc §ty-le-chuan). */
  defaultScale: number;
}

const DEFAULTS: UnitsSettings = { displayUnit: 'mm', inputUnit: 'mm', defaultScale: 50 };

function readStorage(): UnitsSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<UnitsSettings>;
    const merged = { ...DEFAULTS, ...parsed };
    // Cấm tỉ lệ lẻ lọt qua localStorage hỏng/cũ — nếu lệch dãy chuẩn thì bắt về nấc chuẩn gần nhất.
    if (!isValidScale(merged.defaultScale)) merged.defaultScale = DEFAULTS.defaultScale;
    return merged;
  } catch {
    return DEFAULTS;
  }
}

export function useUnitsSettings() {
  const [state, setState] = useState<UnitsSettings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStorage());
    setHydrated(true);
  }, []);

  const mutate = (fn: (prev: UnitsSettings) => UnitsSettings) => {
    setState((prev) => {
      const next = fn(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // quota/private-mode — không chặn UI, chỉ mất bền giữa phiên
      }
      return next;
    });
  };

  const setDisplayUnit = (u: UnitId) => mutate((prev) => ({ ...prev, displayUnit: u }));
  const setInputUnit = (u: UnitId) => mutate((prev) => ({ ...prev, inputUnit: u }));
  const setDefaultScale = (n: number) => {
    if (!isValidScale(n)) return; // im lặng bỏ qua — nút gọi hàm này chỉ nhận giá trị từ SCALE_CHUAN
    mutate((prev) => ({ ...prev, defaultScale: n }));
  };

  return { state, hydrated, setDisplayUnit, setInputUnit, setDefaultScale };
}
