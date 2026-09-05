'use client';

/**
 * components/ui/useKeoBeMat.ts — MÁY KÉO CỬA SỔ NỔI, DÙNG CHUNG.
 *
 * ⛔ NƠI DUY NHẤT có logic kéo/dời cửa sổ. `CuaSoCongCu` (canvas) và `BeMatNoi` (bề mặt nổi
 * toàn app) đều gọi vào đây. Cấm mỗi tính năng một kiểu kéo — đó đúng thứ luật §17 chặn.
 *
 * ⭐ RÚT RA TỪ BẢN ĐÃ CHẠY, KHÔNG VIẾT LẠI [Đ2]: thân hàm dưới đây là logic của
 * `components/render-studio/CuaSoCongCu.tsx` (lượt P-R) — pointer capture + phím mũi tên +
 * `ghimTrongVung`. Giữ nguyên từng quyết định đã trả giá:
 *   · **pointer capture** thay listener trên `window` — chuột chạy ra ngoài giữa chừng vẫn không
 *     rớt kéo, và một họ sự kiện lo cả chuột · bút · ngón tay.
 *   · **`touchAction: 'none'`** — cảm ứng không cuộn trang lúc kéo.
 *   · **phím mũi tên** — không có đường này thì "kéo được" chỉ đúng với người dùng chuột.
 * Phần THÊM của lượt này: hút mép · nhớ chỗ · chặn kéo-nhầm-khi-đang-gõ.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ViTriCuaSo } from '@/lib/nodes/cua-so-cong-cu';
import { datChoAnToan, docCho, ghiCho, choConDungDuoc, type MepHut } from '@/lib/ui/keo-be-mat';

const MEP_RONG: MepHut = { trai: false, phai: false, tren: false };

/** Một nhịp phím mũi tên; giữ Shift đi nhanh gấp 4 (giữ đúng số của P-R). */
const BUOC = 16;
const BUOC_NHANH = 64;

export interface DungKeoBeMat {
  /** Ngữ cảnh để nhớ chỗ theo dự án/chặng. Bỏ trống ⇒ KHÔNG nhớ (bề mặt tạm thời). */
  nguCanh?: string;
  /** Khoá riêng của cửa sổ này trong ngữ cảnh đó. */
  khoa: string;
  /** Cỡ cửa sổ — cần để kẹp biên và hút mép cho đúng. */
  co: { w: number; h: number };
  /** Có cho kéo không. Bề mặt bậc `vien` (viên ngữ cảnh) thì KHÔNG — nó bám nguồn, không phải cửa sổ. */
  batKeo: boolean;
  /** Chỗ mọc ra ban đầu (từ nguồn). Dùng khi chưa có chỗ nhớ, hoặc chỗ nhớ hết dùng được. */
  viTriMoc: ViTriCuaSo | null;
  /**
   * Vị trí do NƠI GỌI giữ (kho ngoài). Truyền thì hook thôi giữ state, chỉ lo cơ chế.
   *
   * ⭐ VÌ SAO CÓ ĐƯỜNG NÀY: `CuaSoCongCu` (canvas) giữ vị trí trong `useCuaSoCongCuUi` để có
   * THỨ TỰ CHỒNG giữa nhiều cửa sổ — thứ `BeMatNoi` không cần. Không có lối cắm kho ngoài thì
   * hai bên buộc phải có hai bộ kéo, đúng thứ bị cấm. Cơ chế (pointer capture · phím mũi tên ·
   * hút mép · kẹp biên) vẫn CHỈ MỘT BẢN, ở đây.
   */
  viTriNgoai?: ViTriCuaSo;
  /** Báo về cho kho ngoài mỗi lần vị trí đổi (đã hút mép + kẹp biên xong). */
  onDoiCho?: (v: ViTriCuaSo) => void;
  /** Gọi lúc bắt đầu kéo — nơi dùng đẩy cửa sổ lên trên cùng. */
  onChamVao?: () => void;
}

export interface MayKeoBeMat {
  viTri: ViTriCuaSo | null;
  dangKeo: boolean;
  mep: MepHut;
  /** Người dùng đã tự kéo cửa sổ này chưa (trong phiên) — quyết định ngữ pháp lúc ĐÓNG. */
  daTuKeo: boolean;
  /** Rải lên phần tử THANH TIÊU ĐỀ. ⛔ Đừng rải lên cả cửa sổ. */
  thuocTinhTieuDe: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    tabIndex?: number;
    style: React.CSSProperties;
  };
}

/**
 * Thao tác này có bắt đầu từ chỗ ĐANG GÕ / ĐANG BẤM không.
 *
 * 🔴 TIÊU CHÍ PASS CỦA HOÀ: *"không lỡ tay kéo khi đang gõ"*. Thanh tiêu đề có thể chứa ô nhập
 * tên, nút đóng, nút đổi nấc — bấm vào chúng phải là BẤM, không phải bắt đầu kéo.
 * Kiểm bằng `closest()` trên đích thật của sự kiện, không kiểm bằng toạ độ: toạ độ không biết
 * dưới ngón tay là cái gì, và bố cục thanh tiêu đề sẽ đổi.
 */
function laVungKhongKeo(t: EventTarget | null): boolean {
  if (!(t instanceof Element)) return false;
  return !!t.closest('input, textarea, select, button, a, [contenteditable="true"], [data-khong-keo]');
}

export function useKeoBeMat({
  nguCanh,
  khoa,
  co,
  batKeo,
  viTriMoc,
  viTriNgoai,
  onDoiCho,
  onChamVao,
}: DungKeoBeMat): MayKeoBeMat {
  const [viTriTrong, setViTriTrong] = useState<ViTriCuaSo | null>(null);
  const [dangKeo, setDangKeo] = useState(false);
  const [mep, setMep] = useState<MepHut>(MEP_RONG);
  const [daTuKeo, setDaTuKeo] = useState(false);
  const moc = useRef<{ dx: number; dy: number } | null>(null);
  /**
   * Vị trí MỚI NHẤT, cập nhật đồng bộ ngay trong lúc kéo.
   *
   * 🔴 VÌ SAO PHẢI CÓ (bug browser QA 20/08 bắt được): lúc thả, `thoi()` đọc `viTri` từ closure
   * của lần render hiện tại — mà `setState` trong `pointermove` là BẤT ĐỒNG BỘ, nên trong một
   * chuỗi kéo nhanh, closure vẫn giữ vị trí TRƯỚC KHI KÉO ⇒ ghi vào localStorage đúng cái chỗ cũ.
   * Triệu chứng: kéo cửa sổ đi, đóng, mở lại thì nó về chỗ của lần kéo TRƯỚC nữa.
   * Ref cập nhật đồng bộ nên lúc thả luôn ghi đúng chỗ mắt đang nhìn thấy.
   */
  const viTriMoiNhat = useRef<ViTriCuaSo | null>(null);

  /** Kho ngoài thắng nếu có — hook chỉ giữ state khi không ai giữ hộ. */
  const dungKhoNgoai = viTriNgoai !== undefined;
  const viTri = dungKhoNgoai ? viTriNgoai : viTriTrong;
  const setViTri = useCallback(
    (v: ViTriCuaSo) => {
      if (dungKhoNgoai) onDoiCho?.(v);
      else setViTriTrong(v);
    },
    [dungKhoNgoai, onDoiCho],
  );

  const vung = useCallback(() => ({ w: window.innerWidth, h: window.innerHeight }), []);

  /**
   * ĐÓNG THÌ QUÊN VỊ TRÍ TRONG BỘ NHỚ — bắt buộc, không phải dọn dẹp cho gọn.
   *
   * 🔴 BUG BROWSER QA 20/08 BẮT ĐƯỢC: `BeMatNoi` không unmount lúc đóng (nó trả `null`), nên
   * state của hook SỐNG TIẾP. Mở lại thì vị trí cũ trong bộ nhớ thắng, nhánh đọc localStorage
   * không bao giờ chạy ⇒ tính năng NHỚ CHỖ coi như chết, và cửa sổ còn kẹt luôn ở chỗ bị kẹp
   * biên của lần trước. Quên đi lúc đóng để lần mở sau đi lại đúng đường:
   * đọc chỗ nhớ → không dùng được thì mọc từ nguồn.
   */
  useEffect(() => {
    if (batKeo) return;
    setViTriTrong(null);
    setMep(MEP_RONG);
    setDaTuKeo(false);
    viTriMoiNhat.current = null;
  }, [batKeo]);

  /**
   * Khôi phục chỗ đã nhớ — nhưng CHỈ khi nó còn với tới được trên màn hiện tại.
   * Đổi màn 27" → 13" mà cứ khôi phục mù là cửa sổ nằm ngoài, không gọi lại được.
   */
  useEffect(() => {
    // Kho ngoài tự lo chỗ ban đầu — hook không giành quyền đặt hộ.
    if (dungKhoNgoai || !batKeo || viTri !== null) return;
    if (nguCanh) {
      const nho = docCho(nguCanh, khoa);
      if (nho && choConDungDuoc(nho, co, vung())) {
        viTriMoiNhat.current = nho.viTri;
        setViTri(nho.viTri);
        setDaTuKeo(true); // đã từng tự đặt chỗ ⇒ đóng thì đừng bay về nguồn
        return;
      }
    }
    if (viTriMoc) {
      viTriMoiNhat.current = viTriMoc;
      setViTri(viTriMoc);
    }
  }, [dungKhoNgoai, batKeo, khoa, nguCanh, viTri, viTriMoc, co, vung, setViTri]);

  /** Một cửa duy nhất cho mọi lần dời: hút mép → kẹp biên → nhớ chỗ. */
  const doiCho = useCallback(
    (v: ViTriCuaSo, ghi: boolean) => {
      const kq = datChoAnToan(v, co, vung());
      viTriMoiNhat.current = kq.viTri;
      setViTri(kq.viTri);
      setMep(kq.mep);
      if (ghi && nguCanh) ghiCho(nguCanh, khoa, { viTri: kq.viTri });
    },
    [co, khoa, nguCanh, vung, setViTri],
  );

  const batDau = useCallback(
    (e: React.PointerEvent) => {
      if (!batKeo || laVungKhongKeo(e.target)) return;
      onChamVao?.();
      const goc = viTri ?? viTriMoc ?? { x: 0, y: 0 };
      moc.current = { dx: e.clientX - goc.x, dy: e.clientY - goc.y };
      setDangKeo(true);
      setDaTuKeo(true);
      /* `setPointerCapture` NÉM DOMException "No active pointer with the given id" khi pointerId
         không còn hoạt động ở tầng trình duyệt (bút nhấc giữa chừng · thiết bị lai · sự kiện tổng
         hợp). Repo đã trả giá và chốt khuôn này ở `CadCanvas.tsx:765` và `SlideSorter.tsx:116` —
         `?.` + try/catch. Bản P-R gọi trần; giữ nguyên là mang lỗi cũ sang máy dùng chung.
         Mất capture chỉ làm kéo rớt khi con trỏ ra ngoài — vẫn kéo được; ném lỗi thì chết cả handler. */
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {
        /* không sao — xem trên */
      }
    },
    [batKeo, viTri, viTriMoc, onChamVao],
  );

  const dangDiChuyen = useCallback(
    (e: React.PointerEvent) => {
      if (!moc.current) return;
      doiCho({ x: e.clientX - moc.current.dx, y: e.clientY - moc.current.dy }, false);
    },
    [doiCho],
  );

  const thoi = useCallback(
    (e: React.PointerEvent) => {
      if (!moc.current) return;
      moc.current = null;
      setDangKeo(false);
      try {
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {
        /* cùng lý do với setPointerCapture ở trên */
      }
      // Chỉ ghi lúc THẢ, không ghi từng khung hình lúc kéo — tránh đập localStorage 60 lần/giây.
      // Đọc từ REF, không đọc state: state của lần render này còn là chỗ TRƯỚC khi kéo.
      const cuoi = viTriMoiNhat.current;
      if (cuoi && nguCanh) ghiCho(nguCanh, khoa, { viTri: cuoi });
    },
    [nguCanh, khoa],
  );

  const phim = useCallback(
    (e: React.KeyboardEvent) => {
      if (!batKeo || laVungKhongKeo(e.target)) return;
      const buoc = e.shiftKey ? BUOC_NHANH : BUOC;
      const d: Record<string, [number, number]> = {
        ArrowLeft: [-buoc, 0],
        ArrowRight: [buoc, 0],
        ArrowUp: [0, -buoc],
        ArrowDown: [0, buoc],
      };
      const v = d[e.key];
      if (!v) return;
      e.preventDefault();
      const goc = viTri ?? viTriMoc ?? { x: 0, y: 0 };
      setDaTuKeo(true);
      doiCho({ x: goc.x + v[0], y: goc.y + v[1] }, true);
    },
    [batKeo, viTri, viTriMoc, doiCho],
  );

  return {
    viTri,
    dangKeo,
    mep,
    daTuKeo,
    thuocTinhTieuDe: {
      onPointerDown: batDau,
      onPointerMove: dangDiChuyen,
      onPointerUp: thoi,
      onPointerCancel: thoi,
      onKeyDown: phim,
      tabIndex: batKeo ? 0 : undefined,
      style: batKeo
        ? { cursor: dangKeo ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none' }
        : {},
    },
  };
}
