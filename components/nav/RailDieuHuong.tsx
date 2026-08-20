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
import { HE_BIEU_TUONG } from '@/components/ui/command-icon';
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
/**
 * MẶC ĐỊNH THEO NGỮ CẢNH — chỉ khi người dùng CHƯA từng chọn (Hoà chốt 20/08 + CHOT-EXPERIENCE
 * điều 4 *"vào chặng mặc định rail gọn bảo vệ canvas"*).
 *   đang trong CHẶNG → `dinhVi` (52): đang sáng tác, canvas phải áp đảo
 *   ngoài chặng       → `dieuHuong` (240): đang đi tìm việc, cần đọc tên
 * Vì sao 52 mà không 240 lúc sáng tác — số, không cảm tính: rail 240 + thềm Lớp 224 = **464px**,
 * tức **32,2%** màn 1440 (đo thật 20/08), vượt xa trần ~20% Hoà chốt. Rail 52 + thềm 224 = **276**
 * = **19,2%** ✓.
 * ⚠️ KHÔNG mâu thuẫn luật ① "không auto-thu": đây là GIÁ TRỊ MỞ ĐẦU khi chưa có lựa chọn nào,
 * không phải app tự đổi nấc sau lưng. Đã chọn một lần là lựa chọn đó thắng ở MỌI màn, mãi mãi —
 * `localStorage` đọc TRƯỚC và ghi đè giá trị mở đầu này.
 */
function nacMoDau(dangTrongChang: boolean): NacRail {
  return dangTrongChang ? 'dinhVi' : 'dieuHuong';
}

/**
 * NỀN CỦA HÀNG ĐANG MỞ — **rất nhẹ**, chỉ để GỢI Ý.
 *
 * 🔴 Hoà bác 20/08: `--accent-soft` (accent 14%) chạy hết bề ngang đọc ra **"ô vuông tím to"** —
 * đúng thứ chốt cấm. Cường độ quá tay, không phải sai kênh.
 * Số làm căn cứ hạ (đo ở lượt trước, thang XÁM tức đã vứt hết hue):
 *   nền 14%  ↔ nền rail : **1,20:1**  — yếu, mà vẫn đủ nặng để đọc ra một khối màu
 *   vạch mép ↔ nền rail : **4,61:1**  — mạnh gấp bội
 * ⇒ Nền vốn KHÔNG phải kênh mạnh; giữ nó dày chỉ đổi lấy cảm giác nặng. Hạ về **5%** để nó lùi
 * hẳn về vai "trường tông rất nhẹ", VẠCH MÉP gánh vai chính.
 * ⛔ Đừng nâng lại vì "nhìn không rõ" — không rõ thì tăng vạch/tương phản icon, đừng tăng nền.
 * Dùng `color-mix` tại chỗ chứ không thêm token: `app/globals.css` là vùng lane khác đang ghi.
 */
const NEN_DANG_MO = 'color-mix(in srgb, var(--accent) 5%, transparent)';

const laNac = (v: unknown): v is NacRail => v === 'dinhVi' || v === 'dieuHuong' || v === 'duyet';

export function RailDieuHuong() {
  const tr = useT();
  const duong = usePathname();
  const reduceMotion = useReducedMotion();
  const duAnId = useFlowStore((s) => s.currentProjectId);
  const flowId = useFlowStore((s) => s.currentFlowId);
  const tenBan = useFlowStore((s) => s.flowName);

  // `dangMo`/`dangTrongChang` tính trước state vì giá trị MỞ ĐẦU của nấc phụ thuộc ngữ cảnh.
  const dangMo = mucDangMo(duong);
  const dangTrongChang = MUC_RAIL.some((m) => m.id === dangMo && m.cum === 'chang');

  const [nac, setNac] = useState<NacRail>('dieuHuong');
  const [daNap, setDaNap] = useState(false);

  // Nạp lựa chọn cũ MỘT lần. Không nghe `resize`: rail tuyệt đối không tự đổi nấc chi tiết (§6.1).
  // Lựa chọn đã lưu THẮNG giá trị mở đầu theo ngữ cảnh — người dùng chọn rồi thì thôi đoán hộ.
  useEffect(() => {
    try {
      const cu = localStorage.getItem(KHOA_NAC);
      setNac(laNac(cu) ? cu : nacMoDau(dangTrongChang));
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
        // VIÊN NHÃN mọc RA NGOÀI bề ngang 52px, mà thềm Lớp là anh em ĐỨNG SAU trong DOM nên vẽ
        // đè lên phần tràn (đo được: viên nhãn bị thềm che, chỉ ló một chữ). Nâng cả rail lên một
        // tầng xếp lớp để phần tràn nằm trên. Rail chỉ rộng 52-320 nên không che gì của thềm.
        position: 'relative',
        zIndex: 5,
        // Ẩn tới khi biết nấc chi tiết đã lưu — nhấp nháy đổi bề rộng lúc mở app đọc ra như lỗi.
        visibility: daNap ? 'visible' : 'hidden',
        transition: reduceMotion ? 'none' : 'width .2s var(--ease-apple)',
      }}
    >
      {/* Ở nấc ĐỊNH VỊ khung cuộn phải VISIBLE **CẢ HAI TRỤC** — viên nhãn mọc ra ngoài 52px.
          🔴 Bẫy CSS đã đo: `overflow-y: auto` + `overflow-x: visible` KHÔNG cho ra "tràn ngang
          được" — theo spec, một trục là scroll thì trục kia tự nâng `visible` → `auto`, tức VẪN
          CẮT. Lần đầu chỉ mở `overflowX` nên viên nhãn vẫn bị xén, chỉ ló một chữ.
          Bỏ cuộn dọc ở nấc này không mất gì: 8 icon × ~30px không bao giờ tràn chiều cao màn.
          Hai nấc rộng giữ `auto/hidden` như cũ. */}
      <div
        className="flex min-h-0 flex-1 flex-col gap-1 py-2"
        style={{
          scrollbarWidth: 'thin',
          overflowY: hienChu ? 'auto' : 'visible',
          overflowX: hienChu ? 'hidden' : 'visible',
        }}
      >
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
            style={{
              marginTop: i === 0 ? 0 : 24,
              // ĐẢO CHẶNG = MỘT HỘP QUANG HỌC DÙNG CHUNG (Hoà bác 20/08: ba chặng đang đọc ra "ba
              // khối nặng rời rạc"). Một trường tông rất nhẹ ôm CẢ BA + bo r3, thay vì mỗi chặng
              // một nền riêng. Đây là thứ làm ba cái đọc thành MỘT bộ: chúng nằm chung một hộp,
              // canh chung một trục, chứ không phải ba nút cạnh nhau.
              // ⛔ Cấm cho từng hàng chặng một nền dày riêng — nền dày chỉ còn ở mức "rất nhẹ" và
              // chỉ cho hàng đang mở (xem `NEN_DANG_MO`).
              ...(cum === 'chang'
                ? {
                    background: 'color-mix(in srgb, var(--t1) 3%, transparent)',
                    borderRadius: RADIUS.r3,
                    padding: hienChu ? '3px 0' : 3,
                  }
                : null),
            }}
            // GIÃN DỌC GỌN cho đảo chặng: khoảng giữa ba hàng khít hơn đảo việc (0 vs 2px) — nhịp
            // dày hơn đọc ra "một cụm liền", nhịp thưa đọc ra "các mục rời".
            className={cum === 'chang' ? 'flex flex-col' : 'flex flex-col gap-0.5'}
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
                gonDoc={cum === 'chang'}
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
        {/* Cùng hệ với 8 icon điều hướng: nét 1,5 (mặc định lucide là 2 — ngoài dải). Hình 16 chứ
            không 18 vì đây là NÚT ĐIỀU KHIỂN nấc, không phải một mục của bản đồ; 16 vẫn trong dải
            16-18, và nhỏ hơn một bậc là kênh phân biệt "điều khiển ≠ nội dung". Ô nút giữ 32 để
            không tụt dưới ngưỡng chạm 24×24 của WCAG 2.2 AA. */}
        {huong === 'hep' ? (
          <ChevronLeft size={16} strokeWidth={HE_BIEU_TUONG.net} />
        ) : (
          <ChevronRight size={16} strokeWidth={HE_BIEU_TUONG.net} />
        )}
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
  gonDoc,
}: {
  muc: MucRail;
  duongDi: string | null;
  lyDo: { vi: string; en: string } | null;
  dangMo: boolean;
  hienChu: boolean;
  tinhTrang: string | null;
  /** Hàng thuộc ĐẢO CHẶNG — nhịp dọc khít hơn để ba cái đọc thành một cụm liền. */
  gonDoc?: boolean;
}) {
  const tr = useT();
  const reduceMotion = useReducedMotion();
  const Icon = muc.icon;
  const nhan = tr(muc.vi, muc.en);
  /**
   * VIÊN NHÃN KHI RÊ/FOCUS — chỉ ở nấc ĐỊNH VỊ (icon-only), nơi hàng không có chữ.
   * Hoà chốt 20/08: icon **nở từ TÂM thành viên nhãn nhỏ** rồi thu về icon — ⛔ KHÔNG phải
   * tooltip nhảy ra chỗ khác. Nên viên nhãn là con của CHÍNH hàng, mọc từ tâm ô icon
   * (`transformOrigin` đặt đúng tâm ô 20px + lề), không phải một tấm nổi neo theo con trỏ.
   * Cả `mouseenter` lẫn `focus` đều mở: bàn phím phải thấy đúng thứ chuột thấy.
   */
  const [reVao, setReVao] = useState(false);
  const hienVien = !hienChu && reVao;
  const lyDoChu = lyDo ? tr(lyDo.vi, lyDo.en) : null;
  const idLyDo = `rail-ly-do-${muc.id}`;
  // Mở/đóng viên nhãn. Gắn cho CẢ chuột lẫn bàn phím — tablet không có hover nên ở đó viên nhãn
  // không mọc, và đó là chấp nhận được: nấc định vị trên cảm ứng vẫn còn Tooltip nhấn-giữ.
  const cuChi = {
    onMouseEnter: () => setReVao(true),
    onMouseLeave: () => setReVao(false),
    onFocus: () => setReVao(true),
    onBlur: () => setReVao(false),
  };

  const chung: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: gonDoc ? 30 : 'var(--row)',
    padding: gonDoc ? (hienChu ? '3px 10px' : '3px 0') : hienChu ? '5px 10px' : '5px 0',
    margin: '0 4px',
    justifyContent: hienChu ? 'flex-start' : 'center',
    borderRadius: RADIUS.r2,
    background: dangMo ? NEN_DANG_MO : 'transparent',
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
          data-chi-dau="dang-mo"
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
      {/* Ô ĐẶT ICON 20×20 CỐ ĐỊNH, hình 18 bên trong (`HE_BIEU_TUONG`). Ô cố định chứ không để
          icon tự chiếm chỗ: hình lucide có cái vuông có cái dẹt, thả trần thì TÂM QUANG HỌC mỗi
          hàng lệch một kiểu và cả cột đọc ra "nhặt từ nhiều bộ". Có ô thì tám tâm thẳng một trục
          dọc — đo được, xem test [9] và số đo trong báo cáo.

          🔴 NÉT KHÔNG ĐỔI THEO TRẠNG THÁI. Trước đó chỗ này là `strokeWidth={2}` rồi
          `netNhan` khi đang mở — cả hai đều lấy ĐỘ DÀY NÉT làm kênh trạng thái, mà nét là thuộc
          tính của HỌ: nét đổi thì icon đó thôi cùng bộ với hàng xóm. Trạng thái nay đi bằng
          NỀN + DẤU CHỈ (xem trên), nét ở nguyên `HE_BIEU_TUONG.net` cho cả tám hàng.
          `netNhan` vẫn còn trong hệ cho nơi khác cần nhấn TĨNH — không dùng ở đây. */}
      <span
        aria-hidden
        data-o-icon=""
        style={{
          width: HE_BIEU_TUONG.khung,
          height: HE_BIEU_TUONG.khung,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          // ĐỔI TƯƠNG PHẢN, KHÔNG ĐỔI HUE (Hoà chốt 20/08). Trước đây icon đang mở tô `--accent`
          // ⇒ tím thành thứ đầu tiên mắt bắt được, cộng với nền tím thành "khối tím". Nay icon
          // đang mở lên `--t1` (mực đậm nhất) còn hàng thường ở `--t2`: cùng một màu mực, khác
          // ĐỘ ĐẬM ⇒ kênh sống nguyên vẹn khi in trắng đen. Hue nay chỉ còn ở VẠCH MÉP.
          color: dangMo ? 'var(--t1)' : undefined,
        }}
      >
        <Icon size={HE_BIEU_TUONG.hinh} strokeWidth={HE_BIEU_TUONG.net} />
      </span>
      {/* Viên nhãn: nở từ tâm ô icon ra phải. `scaleX` + `opacity` — không animate `width` (giật
          layout). `prefers-reduced-motion` thắng: hiện thẳng, không nở. */}
      {!hienChu && (
        <span
          aria-hidden
          data-vien-nhan=""
          style={{
            position: 'absolute',
            left: 'calc(50% + 12px)',
            top: '50%',
            transform: `translateY(-50%) scaleX(${hienVien ? 1 : 0})`,
            transformOrigin: 'left center',
            opacity: hienVien ? 1 : 0,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            padding: '3px 9px',
            borderRadius: RADIUS.full,
            background: 'var(--panel)',
            border: '1px solid var(--vien-mo)',
            boxShadow: '0 2px 10px rgba(0,0,0,.14)',
            color: 'var(--t1)',
            fontSize: 'var(--fs-2xs)',
            transition: reduceMotion ? 'none' : 'transform .16s var(--ease-apple), opacity .12s linear',
            zIndex: 2,
          }}
        >
          {nhan}
        </span>
      )}
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
          {...cuChi}
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

  // Ở nấc ĐỊNH VỊ hàng dùng được thì VIÊN NHÃN đã nói tên — bày thêm Tooltip là hai tấm cùng lúc,
  // và tấm kia neo theo con trỏ đúng thứ chốt cấm. Hàng MỜ vẫn giữ Tooltip vì nó chở LÝ DO, thứ
  // viên nhãn không chở.
  if (!hienChu) {
    return (
      <Link
        href={duongDi}
        {...cuChi}
        aria-current={dangMo ? 'page' : undefined}
        aria-label={nhan}
        style={chung}
        className="transition-colors duration-[120ms] hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
      >
        {ruot}
      </Link>
    );
  }

  return (
    <Tooltip label={nhan} style={{ width: '100%' }}>
      <Link
        href={duongDi}
        {...cuChi}
        aria-current={dangMo ? 'page' : undefined}
        style={chung}
        className="transition-colors duration-[120ms] hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
      >
        {ruot}
      </Link>
    </Tooltip>
  );
}
