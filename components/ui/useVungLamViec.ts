'use client';

/**
 * components/ui/useVungLamViec.ts — ĐO vùng làm việc thật (cột canvas), để ổ Vitals neo vào TÂM
 * của nó chứ không vào tâm cửa sổ.
 *
 * ⭐ [Đ2] CONNECT, KHÔNG NEW — ba nguồn đã có sẵn, hook này chỉ nối:
 *   ① hộp DOM của cột canvas, đánh dấu `data-if-vung-lam-viec` (`AppShell.tsx`) — nguồn CHÍNH,
 *      vì nó tự đúng ở MỌI nấc sidebar và tự đúng cả khi inspector phải mọc ra;
 *   ② `ResizeObserver` — đã dùng khắp app, không thêm phụ thuộc;
 *   ③ sự kiện `if:navigator-width` (`CadEditor.tsx:1468` phát) — nguồn PHỤ, đá vào một lần đo
 *      lại cho những nhịp cột trái đổi nấc mà hộp cha chưa kịp bố trí lại.
 *
 * 🔴 ĐƯỜNG LÙI ĐO ĐƯỢC (thêm 04/09, nhánh `integration/2026-09-04`) — trên nhánh này `AppShell`
 * CHƯA gắn `data-if-vung-lam-viec` (`grep` = 0 nơi). Nếu chỉ có nguồn ①, hook luôn trả `null` ⇒
 * khẩu độ Vitals KHÔNG BAO GIỜ hiện. Nên thêm nguồn ①b: đo hộp THẬT của rail điều hướng
 * (`[data-marker="railHaiCum"]`, `components/nav/RailDieuHuong.tsx:186`) rồi lấy phần CÒN LẠI
 * bên phải nó làm vùng làm việc. Vẫn là ĐO hộp có thật, không bịa.
 * ⚠️ Đường lùi này KHÔNG trừ cột Inspector bên phải (ổ ④ 236px, `AppShell`) — khi inspector mở,
 * tâm lệch phải ~118px. Gắn marker ① vào cột canvas ở `AppShell` là hết lệch; đó là việc của
 * phiếu khác (AppShell ngoài phạm vi ghi của phiếu này).
 *
 * ⚠️ KHÔNG có ổ marker nào (màn chưa dùng `AppShell`, vd trang đăng nhập) ⇒ trả `null`, và nơi
 * dùng phải tự lo đường lùi. Cố ý KHÔNG bịa ra tâm cửa sổ khi thiếu số đo: bịa thì ổ đứng sai mà
 * không ai biết là đang sai — đúng loại lỗi luật này sinh ra để diệt.
 */

import { useEffect, useState } from 'react';

export interface HopVungLamViec {
  trai: number;
  rong: number;
}

export function useVungLamViec(): HopVungLamViec | null {
  const [hop, setHop] = useState<HopVungLamViec | null>(null);

  useEffect(() => {
    let ro: ResizeObserver | null = null;
    let el: HTMLElement | null = null;

    const do_ = () => {
      // ① nguồn CHÍNH — cột canvas tự khai. ①b đường lùi — rail điều hướng, lấy phần bên phải.
      const cot = document.querySelector<HTMLElement>('[data-if-vung-lam-viec]');
      const rail = cot ? null : document.querySelector<HTMLElement>('[data-marker="railHaiCum"]');
      const found = cot ?? rail;
      if (!found) {
        setHop(null);
        return;
      }
      if (found !== el) {
        el = found;
        ro?.disconnect();
        ro = new ResizeObserver(() => do_());
        ro.observe(el);
      }
      const r = el.getBoundingClientRect();
      const trai = cot ? r.left : r.right;
      const rong = cot ? r.width : Math.max(0, window.innerWidth - r.right);
      setHop((cu) =>
        cu && Math.abs(cu.trai - trai) < 0.5 && Math.abs(cu.rong - rong) < 0.5
          ? cu // giữ nguyên tham chiếu ⇒ không đẻ một lượt vẽ lại vì một con số y hệt
          : { trai, rong },
      );
    };

    do_();
    /* Cột trái nở/thu bằng transition ⇒ hộp cha đổi dần qua nhiều khung hình. `ResizeObserver`
       bắt được, nhưng chỉ khi CHÍNH hộp đó đổi kích thước; sự kiện dưới đây là mũi kim đá thêm
       một lần đo cho nhịp đầu, lúc bố cục còn đang chạy. */
    const onNav = () => requestAnimationFrame(do_);
    window.addEventListener('if:navigator-width', onNav);
    window.addEventListener('resize', do_);
    // Một lần đo trễ: nấc sidebar đổi bằng transition ~200ms, đo lại ở cuối nhịp cho chắc.
    const t = window.setTimeout(do_, 260);

    return () => {
      ro?.disconnect();
      window.removeEventListener('if:navigator-width', onNav);
      window.removeEventListener('resize', do_);
      window.clearTimeout(t);
    };
  }, []);

  return hop;
}

export default useVungLamViec;
