'use client';

/**
 * components/nav/RailDieuHuong.tsx — [marker: railHaiCum] THANH TRÁI: một trục dọc, HAI ĐẢO.
 * (Chuỗi marker giữ nguyên làm định danh — xem ghi chú đầu `./muc-dieu-huong.ts`.)
 *
 * Hoà chốt 16/08: **sidebar là hệ router toàn app**. Đo 17/08: chốt đó có **0 dòng mã** — app vẫn
 * là các route rời không bản đồ chung. File này là bản đồ ấy.
 * 20/08 (đợt NAV-HAI-DAO) Hoà chốt tiếp: **thanh trái CHỈ CÒN VIỆC** —
 *   ĐẢO A · XƯỞNG/VIỆC : Trang chủ · Dự án · Files · Thư viện · Soát duyệt
 *   ĐẢO B · CHẶNG      : 2D · 3D · Trình chiếu
 * ⛔ **Cá nhân · Hồ sơ · Credit · Cài đặt KHÔNG được ở đây** — chúng sang cụm phải-trên
 * (`components/studio/CumPhaiTren.tsx`). Hoà nêu đây là tiêu chí TRƯỢT của cả đợt.
 * Giữ nguyên `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` điều 4 (Rail icon-only 52px · Context
 * Shelf 240 · Work Panel 320, trần resize 440 là NỢ phiếu riêng).
 *
 * Nguồn cấu trúc: `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` (§5 ba nấc chi tiết · §6 ràng buộc).
 * Danh sách mục + mọi quyết định "mục nào có gì" nằm ở `./muc-dieu-huong.ts` — file
 * này chỉ VẼ, không tự quyết cấu trúc.
 *
 * ── BỐN THỨ DỄ BỊ "SỬA CHO TIỆN TAY" VỀ SAU, ĐỪNG ─────────────────────────────────────────
 * ① KHÔNG auto-hide, KHÔNG auto-thu theo bề rộng cửa sổ (§6.1). `Navigator.tsx:74-80` có auto-thu
 *    — đó là panel nội dung của chặng, khác hẳn: rail là BẢN ĐỒ, bản đồ tự gấp lại khi mình đang
 *    cần nó nhất là hỏng. Người dùng chọn nấc chi tiết nào thì giữ nguyên nấc ấy.
 * ② Rail KHÔNG BAO GIỜ đổi nội dung theo chặng (§6.2). Đổi theo chặng thì nó thôi là bản đồ và
 *    thành thanh công cụ thứ hai — đúng bệnh "ba chặng như ba app".
 * ③ Nút mờ đi đường `aria-disabled` + `aria-describedby`, KHÔNG `title`, KHÔNG thuộc tính
 *    `disabled`. Lý do đo được ở `components/ui/ToolbarChip.tsx:24-37`: `<button disabled>` bị Tab
 *    BỎ QUA hẳn và `title=` câm trên cảm ứng ⇒ đúng cái nút cần giải thích nhất lại mất sạch kênh
 *    giải thích. Hệ quả cố ý: nút mờ VẪN chiếm một chặng Tab.
 * ④ Hai ĐẢO tách bằng KHOẢNG THỞ, không phải đường kẻ (Hoà 16/08 "không thích đường kẻ ngăn một
 *    cái rẹt chia khối") — và khoảng thở đó phải ĐỦ ĐỂ ĐỌC RA là hai khối, không phải gap cho
 *    thoáng: 24px, gấp ~3 lần khoảng cách giữa hai hàng trong cùng đảo (6px). Gộp hai đảo thành
 *    một danh sách dài là hỏng đúng thứ chốt 20/08 sinh ra để chữa.
 *
 * ── BA NẤC CHI TIẾT = BA CÔNG NĂNG, KHÔNG PHẢI BA CỠ ──────────────────────────────────────
 * Hoà 16/08: *"bỏ tư duy kéo dãn khi mình nói 3 size — size to là BỔ SUNG CHI TIẾT cho size nhỏ"*.
 *   52  định vị    → chỉ hình, không chữ
 *   240 điều hướng → thêm CHỮ
 *   320 duyệt      → thêm TÌNH TRẠNG (thứ hai nấc kia không mang nổi)
 * Cửa nghiệm thu hai vế: ① che nấc rộng đi, nấc hẹp vẫn đứng được một mình ② nấc rộng phải có thứ
 * nấc hẹp KHÔNG THỂ có. Vế ② là vế chặn kéo dãn — nay do `mat320` giữ, và mục nào không có gì để
 * nhìn thì BỎ hẳn phần thêm ấy (Trang chủ · Soát duyệt).
 *
 * ⚠️ Nguồn cho phần thêm ở nấc 320 mới nối được phần của CỤM DỰ ÁN (chặng đang dở + tên bản đang
 * mở — đều là dữ liệu THẬT, đọc từ `lib/shell/last-stage.ts` và store). Phần của Files và Thư
 * viện nằm trong vùng ghi của phiên V2 ⇒ khai trong `mat320` rồi để đó, KHÔNG bịa số cho đầy mắt;
 * thiếu nguồn thì dòng tình trạng TỰ ẨN (luật widget-thiếu-dữ-liệu-tự-ẩn, Hoà chốt 13/08).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { getLastStage } from '@/lib/shell/last-stage';
import { RADIUS } from '@/lib/geometry';
import Tooltip from '@/components/ui/Tooltip';
import {
  MUC_RAIL,
  NHAN_CUM,
  THU_TU_CUM,
  NHAN_NAC,
  BE_RONG_NAC,
  nacKe,
  duongCua,
  mucDangMo,
  lyDoMo,
  type MucRail,
  type NacRail,
} from './muc-dieu-huong';

/** Khoá nhớ nấc chi tiết. Lưu THEO MÁY, không vào `.idf` (§6.4 — cách bày trên màn của tôi ≠ tài sản). */
const KHOA_NAC = 'interiorflow.rail.nac_v1';
const NAC_MAC_DINH: NacRail = 'dieuHuong';

const laNac = (v: unknown): v is NacRail => v === 'dinhVi' || v === 'dieuHuong' || v === 'duyet';

export function RailDieuHuong() {
  const tr = useT();
  const duong = usePathname();
  const reduceMotion = useReducedMotion();
  const duAnId = useFlowStore((s) => s.currentProjectId);
  const flowId = useFlowStore((s) => s.currentFlowId);
  const tenBan = useFlowStore((s) => s.flowName);

  const [nac, setNac] = useState<NacRail>(NAC_MAC_DINH);
  const [daNap, setDaNap] = useState(false);

  // Nạp lựa chọn cũ MỘT lần. Không nghe `resize`: rail tuyệt đối không tự đổi nấc chi tiết (§6.1).
  useEffect(() => {
    try {
      const cu = localStorage.getItem(KHOA_NAC);
      if (laNac(cu)) setNac(cu);
    } catch {
      /* localStorage bị chặn — dùng mặc định, đây là tiện nghi không phải nguồn sự thật */
    }
    setDaNap(true);
  }, []);

  const doiNac = (moi: NacRail) => {
    setNac(moi);
    try {
      localStorage.setItem(KHOA_NAC, moi);
    } catch {
      /* im lặng — xem trên */
    }
  };

  const beRong = BE_RONG_NAC[nac];
  const hienChu = nac !== 'dinhVi';
  const hienTinhTrang = nac === 'duyet';
  const dangMo = mucDangMo(duong);
  const daMoDuAn = Boolean(duAnId ?? flowId);

  // "Chặng đang dở" — dữ liệu THẬT, cùng khoá mà card Gallery đang đọc ([marker: lastStage]).
  // Đọc sau khi đã nạp xong để tránh lệch server/client.
  const changDangDo = daNap ? getLastStage(duAnId ?? flowId) : null;

  const duoiDangDo = changDangDo ? MUC_DUOI_THEO_PHA[changDangDo] : null;

  const tinhTrangCua = (muc: MucRail): string | null => {
    if (!hienTinhTrang || muc.mat320.kieu === 'khong') return null;
    if (muc.id === 'du-an') return tenBan || null;
    if (muc.cum === 'chang' && muc.duoi && muc.duoi === duoiDangDo) return tr('đang dở', 'in progress');
    // Chưa nối nguồn ⇒ KHÔNG vẽ gì. Bịa một con số ở đây là hỏng đúng thứ nấc này sinh ra để làm.
    return null;
  };

  const hepHon = nacKe(nac, -1);
  const rongHon = nacKe(nac, 1);

  return (
    <nav
      aria-label={tr('Điều hướng chính', 'Main navigation')}
      data-marker="railHaiCum"
      className="flex min-h-0 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)]"
      style={{
        width: beRong,
        // Ẩn tới khi biết nấc chi tiết đã lưu — nhấp nháy đổi bề rộng lúc mở app đọc ra như lỗi.
        visibility: daNap ? 'visible' : 'hidden',
        transition: reduceMotion ? 'none' : 'width .2s var(--ease-apple)',
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-2" style={{ scrollbarWidth: 'thin' }}>
        {THU_TU_CUM.map((cum, i) => (
          <div
            key={cum}
            role="group"
            // `aria-label` chứ không `aria-labelledby`: ở nấc định vị tiêu đề cụm KHÔNG được render
            // (chỉ hình, không chữ) ⇒ trỏ vào một phần tử không tồn tại thì cụm mất tên với trình
            // đọc màn hình đúng ở nấc hẹp nhất. `aria-label` sống ở cả ba nấc chi tiết.
            aria-label={tr(NHAN_CUM[cum].vi, NHAN_CUM[cum].en)}
            // HAI ĐẢO cùng trục, tách bằng KHOẢNG THỞ CÓ NGHĨA — không đường kẻ ngang (Hoà 16/08
            // "không thích đường kẻ ngăn một cái rẹt"). 24 > 18 cũ: còn ba cụm thì 18 đủ vì có
            // tiêu đề cụm đỡ; nay ở nấc ĐỊNH VỊ (icon-only, tiêu đề không render) khoảng thở là
            // KÊNH DUY NHẤT nói "đây là hai khối" ⇒ phải đọc được cả khi không có chữ nào.
            style={{ marginTop: i === 0 ? 0 : 24 }}
            className="flex flex-col gap-0.5"
          >
            {hienChu && (
              // `--t3` chứ không `--t4`: đo được 17/08 — --t4 trên --panel chỉ 3,65:1 (Tối) và
              // 2,86:1 (Sáng), dưới ngưỡng 4,5:1 của WCAG 1.4.3; chữ 11px in hoa KHÔNG tính là
              // "chữ lớn" nên không được hưởng ngưỡng 3:1. --t3 cho 6,93 / 4,90 — đạt cả hai nền.
              <div
                aria-hidden
                className="px-3 pb-1 pt-0.5 text-[var(--fs-2xs)] font-bold uppercase tracking-wider text-[var(--t3)]"
              >
                {tr(NHAN_CUM[cum].vi, NHAN_CUM[cum].en)}
              </div>
            )}
            {MUC_RAIL.filter((m) => m.cum === cum).map((muc) => (
              <HangRail
                key={muc.id}
                muc={muc}
                duongDi={duongCua(muc, duAnId ?? flowId)}
                lyDo={lyDoMo(muc, daMoDuAn)}
                dangMo={dangMo === muc.id}
                hienChu={hienChu}
                tinhTrang={tinhTrangCua(muc)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Đổi nấc chi tiết — hai nút bước, KHÔNG cuộn vòng: ở đầu dải thì nút kia không vẽ, để bấm
          nhầm không bao giờ nhảy từ rộng nhất về hẹp nhất. Ở nấc định vị chỉ đủ chỗ một nút. */}
      <div
        className="flex shrink-0 items-center gap-1 border-t border-[var(--vien-mo)]"
        style={{
          justifyContent: hienChu ? 'flex-end' : 'center',
          padding: 6,
        }}
      >
        {hepHon && <NutNac huong="hep" toi={hepHon} onDoi={doiNac} hep={!hienChu} />}
        {rongHon && <NutNac huong="rong" toi={rongHon} onDoi={doiNac} hep={!hienChu} />}
      </div>
    </nav>
  );
}

/** Đuôi route của từng chặng — dùng để soi "chặng đang dở" trỏ vào mục nào. */
const MUC_DUOI_THEO_PHA: Record<string, string> = { concept: 'cad', render: 'render', present: 'present' };

function NutNac({
  huong,
  toi,
  onDoi,
  hep,
}: {
  huong: 'hep' | 'rong';
  toi: NacRail;
  onDoi: (n: NacRail) => void;
  /** Nấc định vị nay 52px, chứa được nút 32px + đệm 6 hai bên (44 ≤ 52) — ghim 32px CỐ ĐỊNH
   *  chứ không `var(--tap)` vì trên cảm ứng `--tap` nở thành 44 ⇒ 44+12 = 56 > 52 sẽ tràn.
   *  32×32 vượt ngưỡng 24×24 của WCAG 2.2 AA (2.5.8). */
  hep?: boolean;
}) {
  const tr = useT();
  const nhan = tr(
    `${huong === 'hep' ? 'Thu gọn' : 'Mở rộng'} — ${NHAN_NAC[toi].vi}`,
    `${huong === 'hep' ? 'Collapse' : 'Expand'} — ${NHAN_NAC[toi].en}`,
  );
  return (
    <Tooltip label={nhan}>
      <button
        type="button"
        aria-label={nhan}
        onClick={() => onDoi(toi)}
        style={{ borderRadius: RADIUS.r2, width: hep ? 32 : 'var(--tap)', height: hep ? 32 : 'var(--tap)', flexShrink: 0 }}
        className="grid shrink-0 place-items-center text-[var(--t3)] transition-colors duration-[120ms] hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
      >
        {huong === 'hep' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </Tooltip>
  );
}

function HangRail({
  muc,
  duongDi,
  lyDo,
  dangMo,
  hienChu,
  tinhTrang,
}: {
  muc: MucRail;
  duongDi: string | null;
  lyDo: { vi: string; en: string } | null;
  dangMo: boolean;
  hienChu: boolean;
  tinhTrang: string | null;
}) {
  const tr = useT();
  const Icon = muc.icon;
  const nhan = tr(muc.vi, muc.en);
  const lyDoChu = lyDo ? tr(lyDo.vi, lyDo.en) : null;
  const idLyDo = `rail-ly-do-${muc.id}`;

  const chung: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 'var(--row)',
    padding: hienChu ? '5px 10px' : '5px 0',
    margin: '0 4px',
    justifyContent: hienChu ? 'flex-start' : 'center',
    borderRadius: RADIUS.r2,
    background: dangMo ? 'var(--accent-soft)' : 'transparent',
    // CHỮ của mục đang mở dùng `--t1`, KHÔNG dùng `--accent`. Đo 17/08: `--accent` trên nền
    // `--accent-soft` chỉ 3,32:1 (Tối) / 3,84:1 (Sáng) — đạt ngưỡng 3:1 cho HÌNH nhưng trượt
    // ngưỡng 4,5:1 cho CHỮ (WCAG 1.4.3). `--t1` cho 14,9 / 13,0. Màu nhấn ở lại đúng chỗ nó hợp
    // lệ: cái hình (icon + dải bên trái). Không đụng `--accent*`, không thêm màu — chỉ đổi CHỖ dùng.
    color: dangMo ? 'var(--t1)' : 'var(--t2)',
    fontSize: 'var(--fs-ui)',
    textDecoration: 'none',
    // Mục mờ là <button>, mục dùng được là <a>: không dựng lại phông/viền thì nút ăn kiểu mặc
    // định của trình duyệt và trông khác hẳn hàng bên cạnh (đo được trên ảnh thật, không phải
    // suy từ mã). `background` đã khai ở trên nên nút không ra pill trắng.
    fontFamily: 'inherit',
    border: 0,
    textAlign: 'left',
    width: 'calc(100% - 8px)',
  };

  const ruot = (
    <>
      {/* Dải màu đặc 2px đánh dấu mục đang mở (khuôn định danh Hoà chốt 15/08). Nó cũng là KÊNH
          THỨ HAI ngoài màu — hình dạng — nên trạng thái "đang mở" không phụ thuộc mỗi việc phân
          biệt được sắc độ. */}
      {dangMo && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 6,
            bottom: 6,
            width: 2,
            borderRadius: RADIUS.full,
            background: 'var(--accent)',
          }}
        />
      )}
      <Icon
        size={16}
        strokeWidth={dangMo ? 2 : 1.75}
        style={{ flexShrink: 0, color: dangMo ? 'var(--accent)' : undefined }}
      />
      {hienChu && (
        <span style={{ minWidth: 0, flex: 1 }}>
          <span className="block truncate">{nhan}</span>
          {/* Nấc duyệt: dòng tình trạng — thứ hai nấc kia không mang nổi. Không có nguồn thì
              KHÔNG vẽ dòng này (tự ẩn), tuyệt đối không bày chỗ trống có gạch ngang cho đủ hình.
              `--t3` chứ không `--t4` — cùng lý do đo được ở tiêu đề cụm. */}
          {tinhTrang && (
            <span className="block truncate text-[var(--fs-2xs)] text-[var(--t3)]">{tinhTrang}</span>
          )}
        </span>
      )}
    </>
  );

  // ── Mục MỜ ──────────────────────────────────────────────────────────────────────────────
  // `aria-disabled` (không phải thuộc tính `disabled`) + `aria-describedby` trỏ phần tử ẩn:
  // nút vẫn nhận Tab và vẫn bắn hover/focus ⇒ lý do tới được cả chuột, bàn phím lẫn trình đọc
  // màn hình. Chặn kích hoạt bằng cách KHÔNG gắn `onClick` (bàn phím kích hoạt nút bằng chính
  // sự kiện click), nên không cần chặn phím riêng.
  // `style width:100%` cho span bọc của Tooltip (cả hai nhánh dưới): span đó vốn inline-flex
  // SHRINK-WRAP, làm `width: calc(100% - 8px)` của hàng tính trên fit-content ⇒ hàng co lại 32px
  // thay vì ăn trọn 44px ở nấc định vị (đo trên trình duyệt thật 20/08, đọc mã không ra).
  if (!duongDi || lyDoChu) {
    return (
      <Tooltip label={nhan} desc={lyDoChu ?? undefined} style={{ width: '100%' }}>
        <button
          type="button"
          aria-disabled="true"
          aria-describedby={lyDoChu ? idLyDo : undefined}
          style={{ ...chung, opacity: 'var(--mo-vo-hieu)', cursor: 'not-allowed' }}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
        >
          {ruot}
        </button>
        {lyDoChu && (
          <span id={idLyDo} className="if-tooltip-a11y">
            {lyDoChu}
          </span>
        )}
      </Tooltip>
    );
  }

  return (
    <Tooltip label={nhan} style={{ width: '100%' }}>
      <Link
        href={duongDi}
        aria-current={dangMo ? 'page' : undefined}
        style={chung}
        className="transition-colors duration-[120ms] hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
      >
        {ruot}
      </Link>
    </Tooltip>
  );
}
