'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { saveResume, computeResumePatch } from '@/lib/resume';
import { danhTinhChoLuot } from '@/lib/danh-tinh-phien';

/**
 * ResumeTracker — ghi "đang đứng route nào" cho persistent-state B-3 (Sprint 1).
 *
 * Mount 1 lần ở app/layout.tsx nên chạy trên MỌI route. Các route studio
 * (/cad-editor, /present-editor, /photo-editor) không nạp user vào store → định danh giải từ
 * PHIÊN MÁY CHỦ (`lib/danh-tinh-phien.ts`), `interiorflow.lastUserId` chỉ là bộ đệm của nguồn đó.
 *
 * CHỈ ghi các route STUDIO — KHÔNG ghi '/': route '/' do app/page.tsx tự ghi (kèm
 * flowId + chặng) và chỉ khi user THẬT SỰ đứng trên canvas (stageDone). Nếu ghi '/'
 * ở đây thì ngay lúc mở app, resume của studio bị đè thành '/' TRƯỚC KHI gate
 * đọc nó → auto-resume về /cad-editor không bao giờ chạy.
 *
 * Render null — zero UI, zero ảnh hưởng cây layout server (client component lá).
 *
 * CONTINUITY-1 (19/08): khi đứng trên route scope dự án (`/projects/[id]/cad`…), PHẢI kèm
 * `flowId = projectId` trong patch ghi resume. Thiếu nó thì `buildResumeCard()`
 * (components/home/widgets/resume-card.ts) tính `routeId = currentProjectId || resume.flowId
 * || null` ra `null` cho lượt "vào thẳng URL/bookmark" (currentProjectId chưa nạp store),
 * `resumeHref()` rơi về route TOÀN CỤC cũ (`/cad-editor`…) thay vì `/projects/<id>/<stage>`,
 * và `LegacyStageRedirect` tra lại cũng ra null (store rỗng + resume rỗng) ⇒ dội về
 * `/?notice=choose-project` dù widget "Việc đang dở" vừa trỏ đúng chỗ.
 *
 * ⛔ D6 (04/09) — ĐÂY LÀ ĐƯỜNG ĐỌC-MỘT-LẦN-LÚC-MOUNT THỨ TƯ, và là đường DUY NHẤT chưa được nối
 * vào tầng nguồn định danh lúc D1 được chữa. Bản cũ đọc `getLastUserId()` ĐỒNG BỘ rồi
 * `if (!userId) return;` — bỏ hẳn lượt ghi, và **không hẹn làm lại**:
 *
 *   vào thẳng `/projects/<id>/cad` (tab mới · bookmark · F5)
 *   → effect chạy, `interiorflow.lastUserId` CHƯA gieo (`danhTinhSanSang()` mới chỉ KHỞI ĐỘNG
 *     một request — xem `lib/danh-tinh-phien.ts`) ⇒ thua cuộc đua TẤT ĐỊNH
 *   → định danh có ngay sau đó, nhưng `pathname` KHÔNG đổi nữa ⇒ **không ai ghi lại**
 *   → `CadSheets` ghi tiếp `{route, sheetId}` KHÔNG kèm `flowId`, và `saveResume` merge nông nên
 *     không có gì để kế thừa
 *   ⇒ `buildResumeCard()` tính `routeId=null` ⇒ bấm thẻ tiêu điểm ở Home là **dội về `/`**.
 *
 * Tái hiện CÓ KIỂM SOÁT: `scripts/nghiem-thu-ban-lam-viec/tai-hien-d6.mjs` — ba thế giới, biến
 * duy nhất khác nhau là thứ tự gieo định danh: deep-link ❌ · làm chậm `/api/auth/me` ❌ ·
 * gieo trước ✅. Máy canh tái phát: khẳng định `flowId` ở J16 (`nghiem-thu-g2-hanh-trinh.mjs`),
 * kiểm trên LƯỢT VÀO ĐẦU TIÊN chứ không phải lượt thứ hai đã ấm.
 *
 * NAY: `danhTinhChoLuot()` — ĐÚNG cỗ máy `CadSheets`/`PresentSheets`/autosave-3D đã dùng. KHÔNG
 * thêm một chỗ gọi `getLastUserId()` nào nữa (lệnh cấm ở `danh-tinh-phien.ts:20`), KHÔNG chế
 * cách chờ riêng, KHÔNG `setTimeout` đoán chừng. Lượt ghi thôi bị BỎ — nó ĐỢI, nên **không còn
 * lượt lỡ nào để phải ghi bù**, và nửa thứ hai của bệnh ("pathname không đổi nên không chạy
 * lại") hết là vấn đề: một lượt chạy là đủ vì lượt đó không bỏ cuộc.
 *
 * ⚠️ Vì sao KHÔNG chọn hướng ngược lại ("gieo định danh đồng bộ trước khi ai đọc"): nguồn sự
 * thật của định danh là PHIÊN MÁY CHỦ, tức một vòng mạng — không đồng bộ hoá được. Ép nó đồng bộ
 * nghĩa là quay về neo vào `localStorage`, tức lật chính bản sửa D1 và mở lại lỗ rò chéo người
 * dùng (`scripts/nghiem-thu-g1.mjs` CA4/CA8).
 *
 * 🔒 `conSong` là cờ huỷ của chính lượt effect này. Điều hướng sang route khác giữa lúc đang đợi
 * ⇒ lượt cũ DỪNG, không ghi route cũ đè lên route mới.
 */
export function ResumeTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Task #21: chặng đã dời xuống `/projects/[id]/(cad|present|photo)`. Resume-state vẫn
    // ghi TÊN ROUTE CŨ tương ứng ('/cad-editor'…): route cũ nay là cầu redirect nên
    // auto-resume vẫn đưa về đúng chặng + đúng dự án (redirect tra lại id), mà không phải
    // đổi kiểu `ResumableRoute` hay lưu id dự án trùng lặp ở hai chỗ.
    // Logic tách sang `computeResumePatch` (lib/resume.ts) để test được thuần (sucrase-node,
    // không cần DOM/usePathname) — xem docstring hàm đó cho chi tiết bug CONTINUITY-1.
    const patch = computeResumePatch(pathname);
    // Tính patch TRƯỚC khi chạm định danh: route không đáng ghi resume (vd '/' hay màn đăng
    // nhập) thì thoát ngay, không kéo theo một lượt giải định danh nào.
    if (!patch) return;
    let conSong = true;
    void (async () => {
      const { tiepTuc, userId } = await danhTinhChoLuot(() => conSong);
      if (!tiepTuc || !userId) return; // đã điều hướng đi chỗ khác, hoặc thật sự chưa đăng nhập
      saveResume(userId, patch);
    })();
    return () => {
      conSong = false;
    };
  }, [pathname]);

  return null;
}
