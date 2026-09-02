'use client';

/**
 * components/home/widgets/WidgetCard.tsx — [marker: DongStudio] vỏ card dùng chung cho widget
 * Home (phiếu docs/phieu-giao/home-dong-studio.md ④.5-10, nâng BENTO v3
 * docs/phieu-giao/home-bento-v3.md) — MỘT nơi định nghĩa nền/viền/bo/khoảng đệm, tránh N file
 * lặp cùng style (đúng luật "một cỗ máy nhiều mặt tiền" CLAUDE.md). Token qua CSS var sẵn có,
 * KHÔNG hardcode hex. Thang bo `--r-3` (14px, `lib/geometry.ts` RADIUS.r3) — một-khối-một-bóng
 * (SPEC-DESIGN-SYSTEM-IF §2c).
 *
 * v3 — mỗi ô bento phải LẤP ĐẦY đúng khung lưới cha (grid area cố định ở DongStudioHome.tsx) và
 * không tràn: `h-full flex flex-col`, phần thân `noPad` cho widget ảnh full-bleed (ô D), `dense`
 * giảm đệm cho ô hẹp (B/C), `bodyClassName` cho phần cuộn riêng (KHÔNG cuộn cả card — chỉ danh
 * sách bên trong, giữ tiêu đề cố định).
 *
 * GU (chỉ đạo giữa phiên, `docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md` mạch #1 Swiss/editorial)
 * — `index` là số thứ tự ô (đúng chữ Hoà pin nhiều lần: "SỐ THỨ TỰ to làm nhân vật, nhãn mono nhỏ
 * uppercase") — hiện TRƯỚC tiêu đề, `font-mono`, KHÔNG phải badge/pill riêng (giữ hairline, tránh
 * bo bubbly). border hairline `--vien-mo` + `--r-3` (14px) đã đúng gu — không đổi.
 *
 * v4 (13/08, phiếu home-bento-v4.md ④.6, lỗi #6 "theme sáng trắng-trên-trắng thiếu phân tầng") —
 * thêm `box-shadow: var(--shadow-node)` (token SẴN CÓ, đủ cả 2 theme — `globals.css`, không đụng
 * file đó). Ở theme tối card gần như không đổi (nền đã tối, viền đã đủ); ở theme sáng `--card`
 * (#fff) đứng trên `--bg` (#f2efe9, giấy ấm) chỉ cách nhau ~14 điểm sáng — viền `--border` mỏng
 * dễ chìm, bóng 1 lớp là thứ TÁCH card ra khỏi nền rõ ràng nhất (đúng "một-khối-một-bóng" §2c).
 *
 * P-DASHBOARD-DS (17/08, phiếu docs/phieu-giao/P-DASHBOARD-DS.md ③.1-2) — Hoà chê "dashboard sai
 * HOÀN TOÀN hệ design system" vì card đặc trơn không kính lỏng, không ambient tint. Home nay có
 * `SystemWallpaper` nền ảnh sinh bằng mã (chốt A2 16/08: nền để NÉT, KHÔNG bôi mờ). Card phải là
 * KÍNH LỎNG mới đứng đúng trên ảnh — chốt 16/08 ba tầng ánh sáng, tầng ① "kính nhận sáng và bị
 * ảnh hưởng bởi thứ nằm dưới" (backdrop-filter làm đúng). Đổi:
 *   1. Nền `var(--card)` (đặc) → class `.nen-mo-card` (token `--nen-mo-card` translucent 0.82/0.82
 *      2 theme, backdrop-filter blur-strong 40px + saturate 180%) — class SẴN CÓ ở globals.css:431,
 *      TÁI DÙNG, không đẻ hệ kính mới. Class này đã trả giá qua K1-K4 (4 vòng sửa) — Webkit
 *      prefix có sẵn (K3: tablet mới blur), portal-ra-body cho popover (K4: kính lồng kính chết).
 *   2. AMBIENT TINT = MÉP BẮT SÁNG (tầng ① NHẬN SÁNG chốt 16/08): thêm `inset 0 1px 0 var(--vien-mo)`
 *      vào box-shadow — vệt sáng mảnh cạnh trên, ánh sáng liếm rìa vật liệu. `--vien-mo` là token
 *      SẴN CÓ (globals.css:207-211), tự đảo cực theo theme (tối = trắng loãng, sáng = đen loãng).
 *      KHÔNG hex mới. Đây là "mép card có gradient nhẹ theo nội dung" của ticket ③.2.
 *   3. Viền `--border` → `--vien-mo` cho đồng bộ hairline (chốt 16/08 P-L đã đo 80/80 chỗ dùng làm
 *      đường kẻ chứ không phải nền, xem globals.css:207 comment).
 *   4. KÍNH CHỈ Ở VỎ (chốt 01/08): ruột widget vẫn dùng `--field`/`--card`/`--panel` đặc như cũ
 *      (LightClock inner buttons đã ĐÚNG — `background: 'var(--field)'` opaque). KHÔNG lồng kính
 *      trong kính (K4: dropdown lồng chrome kính xuyên thấu).
 *   5. Bằng chứng grep: `backdropFilter` + `WebkitBackdropFilter` inline (không phải qua class)
 *      để ticket ⑥b `grep -c backdrop-filter` ≥3 có bằng chứng máy soi được — VÀ Webkit prefix
 *      tường minh (K3). Class `.nen-mo-card` là bản dự phòng nếu inline bị override.
 */

import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';

/**
 * ─── VAI CỦA Ô — thứ bậc, KHÔNG phải kích cỡ (sửa 23/08, Hoà: *"XẤU"*) ─────────────────────
 *
 * Trước: MỌI widget Home đều gọi `WidgetCard` ⇒ mọi ô đều là **một tấm kính giống hệt nhau**.
 * Trên theme sáng (`--card` ≈ `--bg`, đo 23/08: `#fff` trên `rgb(242,242,247)`) chuỗi tấm đó
 * đọc ra đúng thứ đã bị đánh trượt HAI LẦN — *"dashboard SaaS"* (20/08) và *"tường widget"*
 * (22/08). Bo góc và bóng không cứu được: **thứ bậc phải nằm ở CHẤT LIỆU, không ở kích cỡ.**
 *
 * Nay ô khai `vai`, và vai quyết định VỎ:
 *   · `hero`  — tấm kính, bắt sáng rõ nhất. Đúng MỘT ô/màn.
 *   · `chinh` — tấm kính thường.
 *   · `phu`   — **KHÔNG VỎ**: không nền, không viền, không bóng. Đứng trần trên nền, tách khỏi
 *               hàng xóm bằng một đường tóc trên đỉnh. Đây là thứ phá "tường thẻ": ba tấm kính
 *               cạnh sáu mục trần thì mắt đọc ra ngay cái nào quan trọng.
 *
 * Truyền bằng CONTEXT chứ không bằng prop: 12 nơi gọi `WidgetCard` nằm rải trong 10 tệp widget,
 * mà quyết định vai thuộc về **bố cục** (`BeMatHome`) chứ không thuộc widget. Bắt mỗi widget
 * nhận thêm một prop rồi chuyền tay là bắt chúng biết một thứ không phải việc của chúng — và là
 * 12 chỗ có thể quên. Context giữ ĐÚNG MỘT nguồn.
 */
export type VaiO = 'hero' | 'chinh' | 'phu';

const VaiOCtx = createContext<VaiO>('chinh');

/** Bố cục bọc quanh mỗi ô để `WidgetCard` bên trong tự biết mình đứng vai nào. */
export function VaiOProvider({ vai, children }: { vai: VaiO; children: ReactNode }) {
  return <VaiOCtx.Provider value={vai}>{children}</VaiOCtx.Provider>;
}

export function useVaiO(): VaiO {
  return useContext(VaiOCtx);
}

/** Vỏ kính lỏng dùng chung — kính chỉ ở LỚP VỎ (chốt 01/08); backdrop-filter + Webkit prefix
 * tường minh (K3 02/08); border hairline `--vien-mo` + top-highlight inset (ambient mép bắt sáng
 * chốt 16/08); bo `--r-3` (thang RADIUS chốt 12/08); bóng `--shadow-node` (một-khối-một-bóng §2c
 * SPEC-DESIGN-SYSTEM-IF).
 * KHÔNG hex/số ma — mọi giá trị đều là token đã khai. */
/* 🔴 R-2d (02/09) — HAI TẦNG: VÀNH kính + LÕI đọc chữ.
 *
 * Bản trước là MỘT lớp `--nen-mo-card` .82. Đo trên ảnh 19:32 và đúng dòng 4 bảng chấm: nó đọc
 * ra *"thẻ flat — giấy dán lên giấy"*. Lý do không phải màu mà là CẤU TẠO: một lớp đục đều thì
 * không có mép, không có bề dày, và `backdrop-filter` gần như vô nghĩa vì .82 đã che hết nền.
 *
 * Bản vẽ `Widget.dc.html:77-84` dựng tấm bằng hai lớp, kèm luật lớp ④: *"chỉ mặt ĐỌC CHỮ mới
 * đặc"*. Áp đúng vậy:
 *   · VÀNH — kính thật, `--nen-mo-vanh` .55, blur mạnh, bo `--r-5`, đệm 4px. Nền xuyên qua
 *     được nên lưới caro phía sau đọc ra ⇒ mắt thấy đây là một tấm ĐẶT TRÊN một mặt, không
 *     phải một mảng màu dán vào.
 *   · LÕI — mặt giấy, `--nen-mo-loi` .90, bo `--r-4`. Chữ đứng trên đây nên nó phải đủ đặc;
 *     độ đọc không được trả giá cho hiệu ứng.
 * Chênh 4px giữa hai bo (`--r-5` 24 và `--r-4` 20) là thứ làm vành đọc ra một VIỀN đều, không
 * ra hai hộp lồng lệch.
 *
 * ⚠️ Thứ tự bắt buộc, và lát này chỉ đúng vì bước trước đã xong: kính chỉ "hiện" khi nền CÓ
 * HÌNH để xuyên qua. Trên nền xám gần trắng của sáng nay, hạ .82 xuống .55 sẽ không cho ra
 * kính — nó cho ra một thẻ NHẠT MÀU, mất cả độ đặc lẫn độ trong. Nền caro (`8da927cd`) phải
 * vào trước, và nó đã vào. */
const VANH: CSSProperties = {
  background: 'var(--nen-mo-vanh, var(--card))',
  border: '1px solid var(--vien-mo, var(--border))',
  backdropFilter: 'saturate(180%) blur(var(--blur-strong))',
  WebkitBackdropFilter: 'saturate(180%) blur(var(--blur-strong))',
  /* Bóng đổ XUỐNG TRƯỜNG (luật lớp ②) + mép trên bắt sáng (luật ③). Hai luật này ở VÀNH chứ
     không ở lõi: chúng nói về quan hệ giữa TẤM và NỀN, mà lõi thì không chạm nền. */
  boxShadow: 'var(--shadow-node), inset 0 1px 0 var(--vien-mo)',
  /* Bo `--r-5` (24px, thêm 02/09) — nấc trên `--r-4`, dành riêng cho ô widget lớn kiểu iPad.
     Khai ở ĐÂY chứ không ở class Tailwind: vỏ nay là MỘT khuôn cho mọi vai, nên bo cũng phải
     nằm cùng chỗ với phần còn lại của khuôn, không tách ra một chuỗi class song song. */
  borderRadius: 'var(--r-5)',
  padding: 4,
};
const LOI: CSSProperties = {
  background: 'var(--nen-mo-loi, var(--card))',
  borderRadius: 'var(--r-4)',
};

/* 🔴 `data-widget=""` trên vỏ VÀNH — DẤU CHO MÁY ĐỌC, thêm 02/09 sau một ca đo mù.
 * Máy chụp đang đếm ô bằng `querySelectorAll('.nen-mo-card')`. Lát kính hai tầng bỏ class đó
 * khỏi vỏ (vỏ nay dùng `--nen-mo-vanh`), nên lô ảnh 20:36 in `soO: 0, oTran: []` — đọc ra như
 * *"hết tràn rồi"*, trong khi thật là MÁY KHÔNG THẤY Ô NÀO.
 * ⇒ Neo một phép đo vào TÊN CHẤT LIỆU là buộc dụng cụ vào một quyết định thẩm mỹ: đổi vật liệu
 * là dụng cụ mù, và nó mù theo chiều IM LẶNG (báo 0 lỗi), tức chiều nguy hiểm nhất.
 * Dấu này nói *"đây là một widget"*, không nói nó làm bằng gì — nên nó sống qua mọi lần đổi da. */

export default function WidgetCard({
  title,
  index,
  action,
  children,
  className = '',
  dense = false,
  noPad = false,
  bodyClassName = '',
}: {
  title?: string;
  /**
   * ⛔ THÔI RENDER TỪ 22/08 (hotfix hướng sản phẩm — Hoà: *"No numbered 01/02/03 sections"*).
   * Đánh số 01…06 làm Trang chủ đọc ra **bảng điều khiển đánh mục**, trong khi Home phải là
   * **Living Canvas** — một NƠI CHỐN của con người, không phải trang quản trị. Số thứ tự là thứ
   * duy nhất ép mắt đọc các ô thành một DANH SÁCH CÓ TRẬT TỰ HÀNH CHÍNH.
   * Prop giữ lại (không xoá) vì 12 nơi gọi đang truyền — xoá kiểu bắn tỉa 12 chỗ trong một
   * hotfix cấu trúc là rủi ro thừa. Chặn ở MỘT chỗ: nơi render. Dọn call site là việc dọn rác
   * riêng, không phải việc của hotfix này.
   */
  index?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Đệm nhỏ hơn — cho ô hẹp (B/C, ~2-3 cột). */
  dense?: boolean;
  /** Bỏ hẳn đệm/tiêu đề mặc định — widget tự vẽ layout riêng (ô D ảnh full-bleed). */
  noPad?: boolean;
  bodyClassName?: string;
}) {
  const vai = useVaiO();
  /* `laPhu` đã gỡ (02/09): vai `phu` không còn đổi CHẤT LIỆU nào — nó chỉ còn nghĩa ở CỠ Ô, mà
   * cỡ ô do lưới quyết định chứ không do thẻ. Giữ `VaiOProvider`/`useVaiO` nguyên vẹn: 12 nơi
   * gọi vẫn khai vai, và lát sau (thứ bậc theo cỡ) sẽ cần đúng thông tin đó. */

  /* 🔴 MỘT CHẤT LIỆU CHO MỌI Ô (02/09, chốt 14 Hoà: widget giống y chang iPad).
     GHI ĐÈ chốt 23/08 "ô phụ KHÔNG vỏ". Chốt cũ giải đúng bài của nó — chống TƯỜNG THẺ, bằng
     cách bỏ vỏ ở ô phụ. iPad giải cùng bài đó bằng đường khác và đó là đường Hoà chọn: mọi ô
     CÙNG một chất liệu, thứ bậc đi bằng **CỠ Ô + VỊ TRÍ**, không bằng vật liệu. Trộn hai lời
     giải mới là thứ đọc ra lộn xộn — nửa số ô có kính, nửa không.
     ⚠️ Ô phụ nay CÓ vỏ, nên rủi ro tường-thẻ quay lại phải chặn ở chỗ khác: bằng SỐ Ô (H-4 cắt
     bớt widget) và bằng khe thoáng của lưới, không bằng cách bỏ vỏ. */
  const dem = dense ? 'p-3.5' : 'p-4';

  if (noPad) {
    return (
      <div data-widget="" className={`relative h-full overflow-hidden ${className}`} style={VANH}>
        <div className="h-full overflow-hidden" style={LOI}>{children}</div>
      </div>
    );
  }
  return (
    <div data-widget="" className={`h-full overflow-hidden ${className}`} style={VANH}>
    <div
      className={`flex h-full flex-col overflow-hidden ${dem}`}
      style={LOI}
    >
      {title && (
        <div className={`flex items-center justify-between gap-2 ${dense ? 'mb-1.5' : 'mb-2.5'} shrink-0`}>
          {/* P-X ⑤ (17/08) — tương phản: tiêu đề `--t4` đo được 3,44 (tối) / 3,26 (sáng) và số
              `--t5` 1,98 / 2,21, ĐỀU dưới ngưỡng 4,5:1 — mà đây là tiêu đề của CẢ 10 widget Home.
              Cả hai lên `--t3` (7,24 / 5,20 ✓). Số vẫn tách khỏi nhãn, nhưng bằng CÂN NẶNG chữ
              (`font-normal` cạnh `font-semibold`) chứ không bằng màu nhạt — màu/độ nhạt không
              được là kênh phân biệt duy nhất. Đổi TOKEN, không tự chế màu. */}
          {/* 🔴 23/08 — BỎ `uppercase`. Không phải chuyện gu: `LUAT-CHU-VIET-7.1.23` **cấm hoa
              toàn phần** với tiếng Việt, vì dấu chồng mang nghĩa và viết hoa hết là giết dấu
              ("VẬT LIỆU CỦA TUẦN" · "GHI CHÚ NHANH"). Một chữ `uppercase` ở ĐÂY đẻ ra nhãn hoa
              cho CẢ 10 widget Home — Hoà đếm được sáu cái trên một màn.
              Hệ quả thứ hai, cũng đáng: sáu nhãn hoa mono giống hệt nhau thì **không nhãn nào
              nổi**, mắt không phân được cái nào quan trọng. Nay thứ bậc đi bằng CỠ + CÂN NẶNG +
              vai của ô, không bằng chữ hoa. Ô phụ có nhãn nhỏ hơn và nhạt hơn ô chính. */}
          {/* 02/09 — MỘT kiểu tiêu đề, cùng lý do với một chất liệu vỏ: thứ bậc đi bằng CỠ Ô,
              không bằng cỡ chữ nhãn. Hai cỡ nhãn trên cùng một lưới ô vuông đọc ra "hai hệ". */}
          <h3
            className="flex items-baseline gap-1.5 text-[length:var(--fs-xs)] font-semibold tracking-[.01em] text-[var(--t2)]"
          >
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </div>
    </div>
  );
}
