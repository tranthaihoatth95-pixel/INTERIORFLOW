'use client';

/**
 * components/site/dia-diem-client.ts — CỬA DUY NHẤT phía trình duyệt để ĐỌC/GHI `HoSoDiaDiem`.
 *
 * ⭐ MỘT SỰ THẬT. Trước phiên này, vĩ độ/kinh độ/hướng Bắc sống trong `useSunUi` — state giao
 * diện riêng của mode 3D, mất khi đóng app (`scene3d-ui.ts` tự thú điều đó). Từ nay mọi màn ĐỌC
 * qua hook này, và mọi lần GHI đi qua `PATCH /api/projects/<id>/site`. KHÔNG có kho thứ hai:
 * không localStorage, không zustand giữ toạ độ, không field mới trong `Doc`.
 *
 * [Đ2] KHÔNG dựng lại thứ đã có:
 *   · tầng miền + hình học mặt trời → `lib/site/*` (MAIN) — file này chỉ gọi, không tính lại;
 *   · "tôi đang ở dự án nào" → `useScope()` (URL) rồi `useActiveProjectRouteId()` (store),
 *     đúng thứ tự `useSheetsBucketId` đã dùng — URL là chân lý, route toàn cục thì hỏi store.
 *
 * §34 QUYỀN: đọc cần `viewer`, ghi cần `owner`. Server đã chặn; ở đây chỉ có nhiệm vụ **nói ra**
 * kết quả chặn đó cho người dùng — nuốt lỗi im lặng còn tệ hơn không cho sửa.
 */

import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { useScope, useActiveProjectRouteId } from '@/lib/scope';
import { hoSoRong, type HoSoDiaDiem, type HuongCongTrinh, type ViTriDuAn } from '@/lib/site/types';
import type { ThayDoi } from '@/lib/site/anh-huong';

/** Dự án đang mở. URL trước (route `/projects/[id]/…`), rồi tới flow đang mở trong store. */
export function useDuAnHienTai(): string {
  const tuUrl = useScope().projectId ?? '';
  const tuStore = useActiveProjectRouteId('');
  return tuUrl || tuStore;
}

/* ── Kho dùng chung trong một phiên trình duyệt ────────────────────────────────────────────────
 * Vì sao cần: Tổng quan và bảng Đèn 3D có thể cùng sống trong một lượt xem. Hai bản sao state là
 * hai sự thật — đúng bệnh vừa đi chữa. Kho này KHÔNG phải nguồn sự thật (máy chủ mới là), nó chỉ
 * là bộ nhớ tạm chia sẻ để hai màn không lệch nhau giữa hai lần tải. */
interface Kho {
  hoSo: Record<string, HoSoDiaDiem>;
  dat: (duAnId: string, h: HoSoDiaDiem) => void;
}
const useKho = create<Kho>((set) => ({
  hoSo: {},
  dat: (duAnId, h) => set((s) => ({ hoSo: { ...s.hoSo, [duAnId]: h } })),
}));

/** Hồ sơ rỗng ỔN ĐỊNH theo dự án — xem ghi chú ở chỗ dùng. */
const RONG = new Map<string, HoSoDiaDiem>();
function hoSoRongCua(duAnId: string): HoSoDiaDiem {
  const khoa = duAnId || 'chua-ro';
  let h = RONG.get(khoa);
  if (!h) {
    h = hoSoRong(khoa, '');
    RONG.set(khoa, h);
  }
  return h;
}

export type LoaiLoi = 'chua-dang-nhap' | 'khong-du-quyen' | 'khong-ro';

export interface KetQuaLuu {
  ok: boolean;
  loai?: LoaiLoi;
  /** Sự thật gốc nào vừa đổi (§32) — nơi gọi bày ra, không tự xử. */
  thayDoi?: ThayDoi[];
  /** Khoá các sự thật phía sau nay đã CŨ. KHÔNG tự tính lại, KHÔNG tự xoá — người quyết. */
  daCu?: string[];
}

function loaiTheoMa(status: number): LoaiLoi {
  if (status === 401) return 'chua-dang-nhap';
  if (status === 403) return 'khong-du-quyen';
  return 'khong-ro';
}

export interface HoSoClient {
  hoSo: HoSoDiaDiem;
  dangTai: boolean;
  /** Lỗi lúc ĐỌC. `khong-du-quyen` ở đây nghĩa là không được xem dự án này. */
  loiDoc: LoaiLoi | null;
  dangLuu: boolean;
  luu: (patch: { viTri?: Partial<ViTriDuAn>; huong?: Partial<HuongCongTrinh> }) => Promise<KetQuaLuu>;
}

/**
 * Đọc hồ sơ địa điểm của một dự án và cho ghi lại.
 * `duAnId` rỗng ⇒ trả hồ sơ rỗng và KHÔNG gọi mạng (màn toàn cục chưa mở dự án nào).
 */
export function useHoSoDiaDiem(duAnId: string): HoSoClient {
  const trongKho = useKho((s) => s.hoSo[duAnId]);
  const dat = useKho((s) => s.dat);
  const [dangTai, setDangTai] = useState(false);
  const [loiDoc, setLoiDoc] = useState<LoaiLoi | null>(null);
  const [dangLuu, setDangLuu] = useState(false);

  useEffect(() => {
    if (!duAnId || trongKho) return;
    let song = true;
    setDangTai(true);
    setLoiDoc(null);
    fetch(`/api/projects/${encodeURIComponent(duAnId)}/site`)
      .then(async (r) => {
        if (!song) return;
        if (!r.ok) {
          setLoiDoc(loaiTheoMa(r.status));
          return;
        }
        const j = (await r.json()) as HoSoDiaDiem;
        if (song) dat(duAnId, j);
      })
      .catch(() => song && setLoiDoc('khong-ro'))
      .finally(() => song && setDangTai(false));
    return () => {
      song = false;
    };
    // `trongKho` cố ý KHÔNG nằm trong deps: có rồi thì thôi tải, thêm vào sẽ thành vòng lặp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duAnId]);

  const luu = useCallback<HoSoClient['luu']>(
    async (patch) => {
      if (!duAnId) return { ok: false, loai: 'khong-ro' };
      setDangLuu(true);
      try {
        const r = await fetch(`/api/projects/${encodeURIComponent(duAnId)}/site`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!r.ok) return { ok: false, loai: loaiTheoMa(r.status) };
        const j = (await r.json()) as { hoSo: HoSoDiaDiem; thayDoi: ThayDoi[]; daCu: string[] };
        dat(duAnId, j.hoSo);
        return { ok: true, thayDoi: j.thayDoi, daCu: j.daCu };
      } catch {
        return { ok: false, loai: 'khong-ro' };
      } finally {
        setDangLuu(false);
      }
    },
    [duAnId, dat],
  );

  return {
    // ⚠️ Hồ sơ rỗng phải GIỮ NGUYÊN DANH TÍNH giữa các lần render — dựng mới mỗi lần thì mọi
    // `useEffect([hoSo])` phía dưới chạy lại liên tục (và có nơi sẽ thành vòng lặp).
    hoSo: trongKho ?? hoSoRongCua(duAnId),
    dangTai,
    loiDoc,
    dangLuu,
    luu,
  };
}

/** Câu giải thích lỗi — viết cho người dùng, không phải mã lỗi HTTP. */
export function loiThanhCau(loai: LoaiLoi, tr: (vi: string, en: string) => string): string {
  if (loai === 'khong-du-quyen')
    return tr(
      'Chỉ chủ dự án đổi được vị trí và hướng. Bạn vẫn xem được số liệu.',
      'Only the project owner can change location and orientation. You can still read the values.',
    );
  if (loai === 'chua-dang-nhap') return tr('Phiên đăng nhập đã hết. Đăng nhập lại để tiếp tục.', 'Session expired. Sign in again to continue.');
  return tr('Không lưu được lúc này. Thử lại.', 'Could not save right now. Try again.');
}
