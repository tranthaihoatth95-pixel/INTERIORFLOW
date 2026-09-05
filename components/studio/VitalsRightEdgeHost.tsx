'use client';

/**
 * components/studio/VitalsRightEdgeHost.tsx — ⛔ **LỖI THỜI 04/09. BIA MỘ, KHÔNG PHẢI CODE SỐNG.**
 *
 * Tệp này từng là chỗ mount `VitalsGesturePanel` neo **cạnh TRỤC PHẢI**, theo chốt 16/08
 * (*"Vitals ở chặng làm việc = nút RỜI cạnh trục phải — cùng một vật, di chuyển theo chỗ tay
 * đang đặt"*). Chỗ đứng đó **ĐÃ BỊ ĐÈ**:
 *
 *   `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` §7 (Hoà duyệt mắt 20/08) — Vitals nằm **VẬT LÝ
 *   trong TOP EDGE như một khẩu độ sống**, ba mức Ambient → Peek → Engage, *"không phải popover
 *   gắn lên"*. ⇒ `components/studio/VitalsAperture.tsx`.
 *
 * ⭐ HÀNH VI THÌ KHÔNG MẤT — tách hành vi khỏi chỗ đứng, hai thứ nó làm đúng đã chuyển sang khẩu độ:
 *   · **chỗ mount duy nhất của `VitalsGesturePanel`** → mức ③ Engage của khẩu độ;
 *   · **⌘J / Ctrl+J** → đăng ký duy nhất trong `VitalsAperture.tsx` (kèm guard né ô nhập);
 *   · **đọc kho dùng chung `lib/vitals-ui.ts`** (để ô gõ nhanh ở `StatusBar` gọi `open()` là câu
 *     hỏi tới được panel — trước đó gõ Enter là mất câu hỏi) → khẩu độ soi gương `panelOpen`.
 *
 * ⚠️ GIỮ TỆP LẠI, KHÔNG XOÁ MÙ — luật *"văn bản/mã bị thay phải đóng dấu TẠI CHỖ, không im lặng
 * bỏ hoang"* (`00-CHOT` 15/08, rút từ ca `QUY_TRINH_SPIRAL`). Nó chưa từng được mount ở đâu
 * (`grep` toàn repo lúc gỡ: 0 nơi dùng), nên xoá cũng không gãy gì — nhưng để lại một bia mộ có
 * ghi *bị thay bởi cái gì và vì sao* thì phiên sau khỏi dựng lại đúng chỗ đứng vừa bị bỏ.
 *
 * ⛔ ĐỪNG HỒI SINH: mount lại tệp này = **HAI chỗ đứng vật lý cho MỘT Vitals**, phá luật
 * `SO-KIEM-TONG` §1 (*"cấm mount cùng một panel ở 2 ổ"*) và làm đỏ máy canh
 * `components/studio/mot-cho-dung.test.ts`.
 */

export type VitalsHostStage = 'cad' | 'render' | 'present';

/**
 * Không render gì. Giữ chữ ký cũ để mọi nơi gọi (nếu có) vẫn biên dịch được trong lúc dọn,
 * nhưng KHÔNG dựng lại chỗ đứng cạnh trục phải.
 */
export default function VitalsRightEdgeHost(_props?: {
  stage?: VitalsHostStage;
  offsetRightPx?: number;
  offsetBottomPx?: number;
}) {
  return null;
}
