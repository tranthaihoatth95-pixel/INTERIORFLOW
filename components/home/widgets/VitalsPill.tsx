'use client';

/**
 * ⛔ **LỖI THỜI 04/09 — KHÔNG CÒN ĐƯỢC MOUNT Ở ĐÂU. Đừng cắm lại.**
 *
 * `AppChrome.tsx` từng mount tệp này ở header, CHỈ khi `active === 'home'`. Đó là **chỗ đứng vật
 * lý thứ hai** của Vitals, và `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` §7 (Hoà duyệt mắt
 * 20/08) chốt Vitals nằm **VẬT LÝ trong TOP EDGE như một khẩu độ sống** — một vật, MỘT chỗ đứng.
 * Thay bằng `components/studio/VitalsAperture.tsx`, có mặt ở MỌI chặng chứ không riêng Home.
 *
 * ⚠️ Nó KHÔNG chỉ là một cái vỏ khác: pill này có **kho hội thoại RIÊNG** (state cục bộ) và gọi
 * `/api/ai-assist-chat` với `stage:'gallery'`, tách hẳn khỏi phiên chat của `VitalsGesture.tsx`.
 * Tức app từng có HAI cuộc trò chuyện Vitals không biết nhau. Giữ tệp làm bia mộ theo luật
 * *"mã bị thay phải đóng dấu tại chỗ, không im lặng bỏ hoang"*; hồi sinh nó là dựng lại đúng cái
 * lỗi vừa dọn (và làm đỏ `components/studio/mot-cho-dung.test.ts`).
 *
 * ── Nguyên văn mô tả cũ, giữ nguyên để tra lịch sử ────────────────────────────────────────────
 * components/home/widgets/VitalsPill.tsx — [marker: DongStudio] Vitals thu về PILL góc màn
 * (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.3 — khuôn Siri §4b `docs/00-CHOT.md` 12/08:
 * pill nhỏ tại chỗ → bấm bung thẻ kết quả, KHÔNG chatbot toàn màn, KHÔNG orb).
 *
 * Thay thanh "Vitals AI" to (từng luôn-hiện ngang dưới hero, chiếm ~1/3 màn — xem
 * `ProjectSelect.tsx` prop `hideVitalsBar`). Tự chứa — KHÔNG sửa `ProjectSelect.tsx` state,
 * gọi thẳng CÙNG endpoint `/api/ai-assist-chat` với `stage:'gallery'` (giữ nguyên lý do KHÔNG
 * gửi docContext — Home không mở một Doc cụ thể nào, xem comment gốc ở ProjectSelect.tsx).
 * v1: lịch sử chat sống trong state cục bộ, mất khi đóng pill — chấp nhận được (bản gốc dòng
 * to cũng chỉ giữ trong state, không lưu DB).
 *
 * 20/08 (COHERENCE-SHELL) — TÁCH `VitalsChatSurface` ra khỏi `VitalsPill`, THUẦN TÚY THÊM:
 * `VitalsPill` giữ nguyên 100% hành vi (nút pill → mở tấm chat), phần tấm chat nay là một
 * component xuất khẩu để mức **Engage** của khẩu độ Vitals (`VitalsAperture.tsx`) dùng LẠI
 * ĐÚNG bề mặt này. Lý do phải tách thay vì viết tấm chat thứ hai: phiếu cấm đẻ ngôn ngữ thị
 * giác Vitals thứ hai — mà chép tấm này ra chỗ khác là đẻ bản thứ hai theo nghĩa đen.
 *
 * v4 (13/08, phiếu home-bento-v4.md ④.4) — GỠ tự định vị `fixed right-5 top-5` khỏi root: giờ
 * `DongStudioHome.tsx` bọc component này trong MỘT cụm `fixed` chung ở góc màn cùng nút "Chi
 * tiết" (i) + `LangToggle` (trước đây 2 nút đó neo LẠC bên trong ô A nhỏ của ProjectSelect —
 * lỗi #4 "VI/EN·(i) lơ lửng"). Cụm dùng `flex` nên khi panel chat mở rộng ra 300px, cả cụm tự
 * giãn sang trái (element `fixed right:…` không set `left` → rộng theo nội dung, neo phải cố
 * định) — Info/LangToggle tự dạt theo, không đè lên panel. Root ở đây chỉ còn `shrink-0` để
 * không bị 2 nút cạnh nó bóp hẹp khi cụm tính flex-basis.
 */

import { useState } from 'react';
import VitalsIcon from '@/components/studio/VitalsIcon';
import { useT } from '@/lib/i18n';
// 📦 22/08 — HÀNH VI ĐÃ DỌN SANG `components/studio/VitalsChatSurface.tsx` (nhà canonical của
// Vitals). Tệp này từ nay CHỈ là VỎ TRÌNH BÀY: pill + chỗ đứng + chuyển vỏ↔bề mặt.
// ⛔ KHÔNG nhận lại vào đây: máy trạng thái giọng nói · ghi ghi chú · suy tín hiệu địa điểm ·
//    định tuyến lệnh · quyết định miền. Thấy một trong số đó mọc lại ở đây = đã trượt ranh giới.
import { VitalsChatSurface } from '@/components/studio/VitalsChatSurface';

export default function VitalsPill() {
  const tr = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="shrink-0" data-vitals-pill="">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={tr('Mở Vitals', 'Open Vitals')}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:bg-[var(--hover)]"
          style={{
            background: 'var(--nen-mo-header, var(--panel))',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(var(--blur)) saturate(150%)',
            WebkitBackdropFilter: 'blur(var(--blur)) saturate(150%)',
            boxShadow: '0 10px 28px -14px rgba(0,0,0,0.4)',
          }}
        >
          {/* 🔴 ĐỔI 02/09 — icon THÔI dùng `--accent`. Chốt 3 (Hoà 31/08, đọc lại 01/09 11:18)
              chê **RẢI** accent nhiều chỗ một màn, và lát H-3 giao accent cho ĐÚNG MỘT CTA của
              Home ("Mở lại"). Pill này mount lại vào header Home ⇒ để nguyên `--accent` là màn
              có hai điểm accent, tức tự tay phạm chốt ngay lúc khôi phục tính năng.
              Kênh phân biệt của nó là HÌNH (glyph Vitals) + chữ, không phải màu. */}
          <VitalsIcon size={14} className="shrink-0" style={{ color: 'var(--t2)' }} />
          <span className="text-[length:var(--fs-xs)] font-medium text-[var(--t2)]">Vitals</span>
        </button>
      ) : (
        <VitalsChatSurface onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

