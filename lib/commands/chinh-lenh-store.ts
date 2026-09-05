/**
 * lib/commands/chinh-lenh-store.ts — trạng thái UI của "Chỉnh lệnh vừa chạy" (xem
 * `chinh-lenh-vua-chay.ts` cho lõi thuần). Cùng khuôn `lib/cad/live-status.ts`: một store zustand
 * nhỏ để mặt tiền DOM (`components/cad/ChinhLenhVuaChay.tsx`) và canvas (`CadCanvas.tsx`, nơi giữ
 * BẢN GỐC hình học) nói chuyện mà không kéo React re-render vào hot path vẽ.
 *
 * AI GHI GÌ:
 *  · canvas  → `datLenh(lenh, neo, apDung)` ngay sau khi một lệnh nhiều bước VỪA CHỐT; `apDung`
 *    là closure của canvas tái áp từ bản gốc (mỗi lần = 1 snapshot undo, giống VCB). Canvas gọi
 *    `capNhat` sau khi tái áp (kể cả tái áp do gõ số trên canvas — hai cửa vào, một trạng thái).
 *  · mặt tiền → `sua(key, raw)`: lõi thuần kiểm hợp lệ rồi mới gọi `apDung` — từ chối thì trả lý
 *    do, KHÔNG đụng hình học. `xoa()` khi người dùng đóng (Esc/✓) — kết quả GIỮ NGUYÊN.
 *  · bất kỳ ai → `yeuCauFocus()` (F9 / gõ ADJ): mặt tiền focus ô đầu; chưa có lệnh thì báo ở
 *    thanh trạng thái thay vì im lặng (§9 cấm nút giả).
 */

import { create } from 'zustand';
import { useCadStore } from '../cad/store';
import { apDungSua, type KetQuaSua, type LenhVuaChay } from './chinh-lenh-vua-chay';

export interface ChinhLenhState {
  lenh: LenhVuaChay | null;
  /** Điểm neo (px, trong khung canvas) — nơi mặt tiền mọc ra, cạnh chỗ tay vừa thao tác. */
  neo: { x: number; y: number } | null;
  apDung: ((l: LenhVuaChay) => void) | null;
  /** Tăng mỗi lần có yêu cầu focus (F9/ADJ) — mặt tiền theo dõi số này. */
  focusSeq: number;
  datLenh: (lenh: LenhVuaChay, neo: { x: number; y: number }, apDung: (l: LenhVuaChay) => void) => void;
  capNhat: (lenh: LenhVuaChay) => void;
  sua: (key: string, raw: string) => KetQuaSua;
  xoa: () => void;
  yeuCauFocus: () => void;
}

export const useChinhLenh = create<ChinhLenhState>((set, get) => ({
  lenh: null,
  neo: null,
  apDung: null,
  focusSeq: 0,
  datLenh: (lenh, neo, apDung) => set({ lenh, neo, apDung }),
  capNhat: (lenh) => set((s) => (s.lenh ? { lenh } : s)),
  sua: (key, raw) => {
    const { lenh, apDung } = get();
    if (!lenh || !apDung) {
      return { ok: false, lyDo: ['Không còn lệnh vừa chạy để chỉnh.', 'No recent command to adjust.'] };
    }
    const r = apDungSua(lenh, key, raw);
    if (r.ok) apDung(r.lenh);
    return r;
  },
  xoa: () => set((s) => (s.lenh ? { lenh: null, neo: null, apDung: null } : s)),
  yeuCauFocus: () => {
    if (!get().lenh) {
      useCadStore.getState().setStatus('Chưa có lệnh vừa chạy để chỉnh — dời/chép/xoay/offset/vẽ tường xong rồi bấm F9.');
      return;
    }
    set((s) => ({ focusSeq: s.focusSeq + 1 }));
  },
}));
