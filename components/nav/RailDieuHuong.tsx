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

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pin, Plus } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { getLastStage } from '@/lib/shell/last-stage';
import { getLastUserId, loadResume } from '@/lib/resume';
import { RADIUS } from '@/lib/geometry';
import Tooltip from '@/components/ui/Tooltip';
import { HE_BIEU_TUONG } from '@/components/ui/command-icon';
import {
  MUC_RAIL,
  NHAN_CUM,
  type CumRail,
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
const KHOA_RONG_DUYET = 'interiorflow.rail.rongDuyet_v1';
/** Dải chốt #4 Experience System — Work Panel 320–440. */
const RONG_DUYET_MIN = 320;
const RONG_DUYET_MAX = 440;
const KHOA_NAC = 'interiorflow.rail.nac_v1';
/**
 * MẶC ĐỊNH THEO NGỮ CẢNH — chỉ khi người dùng CHƯA từng chọn (Hoà chốt 20/08 + CHOT-EXPERIENCE
 * điều 4 *"vào chặng mặc định rail gọn bảo vệ canvas"*).
 *   đang trong CHẶNG → `dinhVi` (52): đang sáng tác, canvas phải áp đảo
 *   ngoài chặng       → `dieuHuong` (240): đang đi tìm việc, cần đọc tên
 * Vì sao nấc hẹp lúc sáng tác — số, không cảm tính: rail 240 + thềm Lớp 224 = **464px**, tức
 * **32,2%** màn 1440 (đo thật 20/08), vượt xa trần ~20% Hoà chốt. Rail 52 + thềm 224 = **276**
 * = **19,2%** ✓ — vẫn dưới trần. (Bản 28px cho 17,5%, rộng cửa hơn, nhưng 28 đã bị THAY BỞI
 * IF-CANONICAL §10 "Neo 52px" — trần ~20% không phải lý do để hạ nấc xuống 28.)
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
 * ⇒ Nền vốn KHÔNG phải kênh mạnh; giữ nó dày chỉ đổi lấy cảm giác nặng.
 *
 * 🟣 01/09 — ĐỔI KÊNH MÀU: bản vẽ GĐ1 (`design-if/Main.dc.html`, rail 52px) chốt hàng đang mở là
 * **sương TRẮNG-MỜ TRUNG TÍNH** (rgba(255,255,255,.08) trên nền tối), KHÔNG tím — accent của mỗi
 * màn để dành cho ĐÚNG MỘT CTA + trạng thái chạy, rail là bản đồ nên đứng trung tính. Token-hoá
 * bằng `--t1` (mực đảo cực theo theme) ⇒ theme sáng ra sương MỰC-MỜ, cùng cường độ 8%.
 * ⛔ Đừng nâng lại vì "nhìn không rõ" — không rõ thì tăng vạch/tương phản icon, đừng tăng nền.
 * Dùng `color-mix` tại chỗ chứ không thêm token: `app/globals.css` là vùng lane khác đang ghi.
 */
/* 8% → 14% (02/09). Trần 8% cũ đặt khi VẠCH MÉP là kênh chính và nền chỉ là "trường tông rất
 * nhẹ" — nguyên văn ghi chú của cổng. Vạch nay đã gỡ, nên viên nang phải tự đủ rõ; 8% gần như
 * tan trên mặt frosted. Vẫn ĐÚNG kênh trung tính `--t1` (chốt GĐ1: rail không tím) — đổi ĐỘ, không
 * đổi HUE. Cổng đã sửa trần kèm lý do, không nới lén. */
const NEN_DANG_MO = 'color-mix(in srgb, var(--t1) 14%, transparent)';

/**
 * CỠ ICON RIÊNG CỦA RAIL (02/09) — Hoà chê icon rail "18 mảnh" khi soi bản cài.
 *
 * Rail là thanh điều hướng CHÍNH và nay đứng trên nền frosted; hình 18px nét 1.5 đọc ra mảnh và
 * chìm. Tab bar của iPad — thứ Hoà lấy làm mốc (chốt 14) — dùng hình to hơn hẳn so với icon
 * trong panel.
 * ⛔ KHÔNG đổi `HE_BIEU_TUONG` toàn cục: hệ đó dùng chung với command icon và nhiều bảng khác,
 * đổi ở đó là kéo theo những chỗ chưa ai nhìn. Một hằng CỤC BỘ cho đúng một bề mặt.
 * Nét 1.75 nằm ĐÚNG trần cứng của cổng nền (`muc-dieu-huong.test.ts` [9]: nét khi nhấn ≤ 1.75)
 * — mượn đúng trần đã có, không nới.
 */
const ICON_RAIL = { khung: 26, hinh: 22, net: 1.75, netDangMo: 2 } as const;

/**
 * 🟡 MÀU AI — MỘT BIẾN ĐẶT TẠM, CHỜ HOÀ CHỐT. Đổi đúng MỘT dòng dưới đây là đổi cả nút `+`.
 *
 * Vì sao chưa chốt được ở lane này: IF có **một** màu nhấn (tím `--accent`); màu nhấn **thứ hai**
 * Hoà đang cân giữa **mòng két ~180-190°** và **mận trầm ~330-340°**, và việc chọn là quyết định
 * của Hoà bằng mắt (bàn thử `docs/mocks/mock-ban-thu-2-huong-mau.html`). ⛔ Lane rail KHÔNG được
 * tự phong một màu thứ ba, và KHÔNG được rải giá trị này ra nhiều chỗ.
 *
 * Vì sao KHÔNG dùng thẳng `--accent` (tím) cho nút này: tím đã mang nghĩa **"đang mở / đang chọn"**
 * trên chính thanh này (nền hàng + dải chỉ dấu). Lấy lại tím cho `+` là để hai nghĩa dùng chung
 * một kênh ⇒ `+` đọc ra như "mục đang mở".
 *
 * Giá trị tạm = **mòng két** (`oklch` ~200°). Ràng buộc đã kiểm: ngoài bán kính cấm 20° của cả ba
 * màu-nghĩa (đỏ ~10° · vàng ~37° · xanh đạt ~145°) và cách `--accent` hơn 60°.
 * ⛔ Không khai vào `app/globals.css` — tệp đó là vùng ghi của lane MÀU. Khai tại chỗ, MAIN gộp sau.
 * Đổi sang mận: sửa `--mau-ai` / `--mau-ai-sang` trong `app/globals.css`. KHÔNG sửa ở đây.
 */
const MAU_AI = 'var(--mau-ai)';
/** Bản sáng hơn một nấc — dùng cho nét/chữ trên nền tối, giữ tương phản khi kính "ăn màu". */
const MAU_AI_SANG = 'var(--mau-ai-sang)';

const laNac = (v: unknown): v is NacRail => v === 'dinhVi' || v === 'dieuHuong' || v === 'duyet';

export function RailDieuHuong() {
  const tr = useT();
  const duong = usePathname();
  const reduceMotion = useReducedMotion();
  const duAnId = useFlowStore((s) => s.currentProjectId);
  // 🔴 GỠ 27/08 (P0 `L2-02`): `currentFlowId` là FLOW id, và nơi duy nhất nó được dùng ở tệp này
  // là chuỗi dựng URL `/projects/<id>/…` — tức nó luôn sai ở đó. Gỡ khỏi chuỗi rồi thì biến này
  // thành mã chết; giữ lại một `useFlowStore` không ai đọc là mời phiên sau nối nó vào lần nữa.
  // const flowId = useFlowStore((s) => s.currentFlowId);

  // `dangMo`/`dangTrongChang` tính trước state vì giá trị MỞ ĐẦU của nấc phụ thuộc ngữ cảnh.
  const dangMo = mucDangMo(duong);
  const dangTrongChang = MUC_RAIL.some((m) => m.id === dangMo && m.cum === 'chang');

  const [nac, setNac] = useState<NacRail>('dieuHuong');
  /* ── BẢN ĐỒ NỔI + TỰ THU (hiến pháp Smart Shell §7–8, 22/08) ─────────────────────────────
     🔴 Vì sao: rail nằm TRONG dòng chảy layout, nên mở rộng nó là BÓP canvas — đúng thứ §7 cấm
     ("Map floats above content, does not permanently resize the viewport"). Nay: trong dòng chảy
     LUÔN chỉ có 52px; nấc 240/320 vẽ thành TẤM NỔI đè lên nội dung.
     §8: rời chuột khỏi vùng rail+tấm → ÂN HẠN ngắn → tự thu về định vị — TRỪ khi đã GHIM, đang
     giữ focus bàn phím bên trong, hoặc đang KÉO đổi bề rộng. Esc thu ngay. Mặc định làm-sâu là
     KHÔNG ghim. */
  const [ghimBanDo, setGhimBanDo] = useState(false);
  const henThuBanDo = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    try { setGhimBanDo(localStorage.getItem('interiorflow.rail.ghim_v1') === '1'); } catch { /* tiện nghi */ }
  }, []);
  const datGhimBanDo = (v: boolean) => {
    setGhimBanDo(v);
    try { localStorage.setItem('interiorflow.rail.ghim_v1', v ? '1' : '0'); } catch { /* tiện nghi */ }
  };
  const huyHenThu = () => { if (henThuBanDo.current) { clearTimeout(henThuBanDo.current); henThuBanDo.current = null; } };
  const thuBanDo = () => { huyHenThu(); setNac('dinhVi'); };
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

  /**
   * NỚI TRẦN NẤC "DUYỆT" (22/08) — đóng đúng dòng nợ ghi sẵn ở `muc-dieu-huong.ts:127` (dấu `⛳ NỢ`)
   * ("thêm resize kéo tay nấc `duyet` trong khoảng [320, 440]") và thi hành chốt #4 của
   * `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md`: Work Panel 320–440 **resizable**.
   * Trước bản này nấc duyệt đứng cứng ở SÀN 320 — tức mức "duyệt nội dung" không bao giờ có đủ
   * chỗ cho thứ nó sinh ra để bày (cột ô tròn vật liệu, màn dang dở của chặng).
   * Chỉ nấc `duyet` mới kéo được: `dinhVi`/`dieuHuong` là hai mức có bề rộng MANG NGHĨA (định vị
   * và điều hướng), kéo chúng là phá nhịp ba-nấc.
   */
  const [beRongDuyet, setBeRongDuyet] = useState<number>(BE_RONG_NAC.duyet);
  useEffect(() => {
    try {
      const luu = Number(localStorage.getItem(KHOA_RONG_DUYET));
      if (Number.isFinite(luu) && luu >= RONG_DUYET_MIN && luu <= RONG_DUYET_MAX) setBeRongDuyet(luu);
    } catch {
      /* im lặng — bề rộng là tiện nghi, không được chặn rail */
    }
  }, []);
  const batDauKeo = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const x0 = e.clientX;
    const r0 = beRongDuyet;
    const keo = (ev: PointerEvent) => {
      const moi = Math.min(RONG_DUYET_MAX, Math.max(RONG_DUYET_MIN, r0 + (ev.clientX - x0)));
      setBeRongDuyet(moi);
    };
    const tha = () => {
      window.removeEventListener('pointermove', keo);
      window.removeEventListener('pointerup', tha);
      try {
        localStorage.setItem(KHOA_RONG_DUYET, String(beRongDuyet));
      } catch {
        /* im lặng */
      }
    };
    window.addEventListener('pointermove', keo);
    window.addEventListener('pointerup', tha);
  };

  const beRong = nac === 'duyet' ? beRongDuyet : BE_RONG_NAC[nac];
  const hienChu = nac !== 'dinhVi';
  const hienTinhTrang = nac === 'duyet';

  /**
   * P0 21/08 (Hoà: "trỏ vào gần như cái gì cũng khoá") — đo trên app thật: mở `/` ở phiên mới
   * thì `currentProjectId`/`currentFlowId` đều null cho tới khi người dùng BẤM một dự án ⇒
   * 5/8 mục rail (Dự án + cả cụm CHẶNG) `aria-disabled` + `cursor:not-allowed` ngay từ khung
   * hình đầu — thanh được rê chuột nhiều nhất thì 5/8 chỗ "khoá", đọc ra như cả app khoá.
   *
   * Nhưng app BIẾT dự án gần nhất: card "Việc đang dở · Mở lại" đọc `loadResume(userId).flowId`
   * ([Đ2] — cùng nguồn, không đẻ bộ nhớ thứ hai). Rail lùi về nguồn đó khi store chưa có dự án:
   * mục chặng thành LINK THẬT `/projects/<flowId>/<stage>` — bấm là vào thẳng chặng của dự án
   * gần nhất, đúng thứ người dùng muốn khi bấm "Thiết kế 3D" từ Home.
   *
   * Đọc sau `daNap` (localStorage, client-only) để không lệch SSR. Người CHƯA TỪNG mở dự án nào
   * (resume rỗng) thì mục vẫn mờ kèm lý do — đó là khoá THẬT, không phải bệnh.
   */
  /**
   * ⚠️ CHỈ nhận khi resume khai rõ đó là PROJECT id (`scopeKind === 'project'`).
   *
   * `resume.flowId` mang HAI loại danh tính (xem `lib/resume.ts`): route `/` ghi **flow id**,
   * route `/projects/[id]/…` ghi **project id**, và `saveResume` gộp nông nên giá trị cũ sống
   * sót. Trước 27/08 rail đọc trường này rồi dán thẳng vào `/projects/<id>/<chặng>` — đúng nửa
   * số trường hợp. Dữ liệu ghi TRƯỚC lát này không có `scopeKind` ⇒ **KHÔNG BIẾT** ⇒ bỏ qua.
   * "Không biết" phải được xử như "không dùng được", không phải như "chắc là project".
   */
  const duAnGanNhat = (() => {
    if (!daNap) return null;
    const r = loadResume(getLastUserId() ?? '');
    return r?.scopeKind === 'project' ? (r.flowId ?? null) : null;
  })();

  /**
   * P0 21/08 vòng 2 (Hoà: "bấm Trình chiếu không được — chỗ thanh sidebar") — đo trên tài khoản
   * THẬT: `/api/flows` trả 3 dự án · 19 flow, nhưng `resume` của hồ sơ trình duyệt này RỖNG ⇒
   * cả ba mục CHẶNG mờ kèm lý do "Chưa mở dự án". Giả định của vòng 1 ("resume rỗng = khoá
   * THẬT") SAI: resume rỗng chỉ nói *chưa mở dự án nào TRÊN MÁY NÀY*, không nói *không có dự
   * án*. Người vừa đăng nhập ở máy khác, vừa xoá cache, hay vừa mở tab mới đều rơi đúng vào đây
   * — và họ gặp một thanh bên khoá 5/8 mục ngay khung hình đầu.
   *
   * Nấc lùi CUỐI: hỏi máy chủ flow mới sửa gần nhất. Chỉ chạy khi đã cạn cả ba nguồn cục bộ
   * (URL · store · resume) nên phiên bình thường KHÔNG tốn thêm request nào. Dùng đúng
   * `/api/flows` mà app vẫn gọi — không đẻ endpoint thứ hai.
   * Còn khoá thật (tài khoản CHƯA có flow nào) thì vẫn mờ kèm lý do — lúc đó nó đúng là khoá.
   */
  const [duAnMayChu, setDuAnMayChu] = useState<string | null>(null);
  /**
   * ⚠️ Đã GỠ `!flowId` khỏi điều kiện này (27/08). `flowId` không còn góp vào `duAnHieuLuc` nữa,
   * nên "đang có một flow mở" KHÔNG còn là lý do để BỎ QUA lượt tra máy chủ. Giữ nó lại là tạo
   * ra đúng ca xấu: có flow mở ⇒ không tra ⇒ không có project id ⇒ rail mờ, dù tài khoản có dự án.
   */
  const cankiemMayChu = daNap && !duAnId && !duAnGanNhat;
  useEffect(() => {
    if (!cankiemMayChu || duAnMayChu) return;
    let huy = false;
    fetch('/api/flows')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        /* `!d.flows.length` KHÔNG còn được thoát sớm: phản hồi này chở CẢ `projects`, và ca cần
         * cứu nhất chính là *có dự án mà chưa có flow nào*. Thoát ở đây là bỏ luôn nấc lùi thứ
         * hai bên dưới trước khi nó kịp chạy. */
        if (huy || !d) return;
        /**
         * 🔴 SỬA 27/08 — P0 `L2-02`. Bản cũ: `setDuAnMayChu(moiNhat.id)`.
         * `moiNhat.id` là **FLOW id**, và nó được ghép vào `/projects/<id>/<chặng>`. Lane
         * `IF-UXUI-RUNTIME-001` đo trên app thật: id trên ba nút Chặng **không có hàng nào trong
         * bảng `Project`** — nó là một `Flow` tên *"Untitled flow"*. Ba lối vào chính của app
         * trỏ vào một dự án không tồn tại, trong khi người dùng chưa chọn gì.
         *
         * Đo thêm trên dữ liệu thật: **42/48 flow đang sống KHÔNG có `projectId`**. Flow độc
         * lập là chuyện THƯỜNG, không phải ngoại lệ — nên "lấy flow mới nhất rồi coi như dự án"
         * sai ở gốc, không phải sai ở một ca hiếm.
         *
         * Nay lấy `moiNhat.project?.id` — chính PROJECT id mà `/api/flows` đã trả sẵn
         * (`app/api/flows/route.ts` select `project: { id, name, larkProjectCode }`).
         * Flow không thuộc dự án nào ⇒ để `null`, rail giữ nguyên trạng thái mờ kèm lý do.
         * ⛔ KHÔNG bịa URL — app hiện KHÔNG có route trang nào cho một flow độc lập
         * (`find app -name page.tsx` = 0 hit cho `flows/[id]`). Đó là **PRODUCT MISSING**, đã ghi
         * ở `docs/design-candidate/IDF-IF-PACKET-003/ux/`; ép nó thành URL dự án là dựng lại
         * đúng lỗi vừa sửa.
         */
        const moiNhatCoDuAn = [...d.flows]
          .filter((f: { project?: { id?: string } | null }) => !!f.project?.id)
          .sort(
            (a: { updatedAt?: string }, b: { updatedAt?: string }) =>
              new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime(),
          )[0] as { project?: { id?: string } } | undefined;
        /* 🔴 THÊM NẤC LÙI THỨ HAI — Hoà 02/09 09:15, chốt 15.
         * Nhánh trên chỉ tìm được dự án khi có FLOW trỏ vào nó. Tài khoản CÓ dự án mà chưa dựng
         * flow nào (rất thường: dự án mới tạo, hoặc dự án chỉ có bản vẽ CAD) ⇒ `moiNhatCoDuAn`
         * rỗng ⇒ ba chặng khoá, đúng cảnh Hoà gặp. Nhưng `/api/flows` ĐÃ trả kèm mảng `projects`
         * (`app/api/flows/route.ts`) — chính nguồn mà `/tasks` đang dùng để đổ dropdown. Dữ liệu
         * nằm sẵn trong cùng một phản hồi; thiếu chỉ là chưa ai đọc tới.
         * ⚠️ Vẫn KHÔNG bịa URL: chỉ nhận `projects[0].id` là id DỰ ÁN thật. Không có dự án nào
         * thì để `null` và rail giữ mờ — nay kèm câu lý do NÓI VIỆC LÀM ĐƯỢC (tạo dự án),
         * không phải câu chỉ sang một Trang chủ trống. */
        const duAnDauTien = (d.projects as { id?: string }[] | undefined)?.find((p) => !!p?.id)?.id;
        const chon = moiNhatCoDuAn?.project?.id ?? duAnDauTien;
        if (chon) setDuAnMayChu(chon);
      })
      .catch(() => {
        /* mất mạng/401 — giữ nguyên trạng thái mờ kèm lý do, không bịa đường vào */
      });
    return () => {
      huy = true;
    };
  }, [cankiemMayChu, duAnMayChu]);

  /**
   * 🔴 URL THẮNG TẤT CẢ (sửa 22/08 — Lane C bắt được trên app thật).
   * Bản cũ: `duAnId ?? flowId ?? duAnGanNhat ?? duAnMayChu` — KHÔNG hề đọc URL, dù `usePathname()`
   * đã có sẵn ngay trên kia. Hệ quả đo được: đứng ở `/projects/<A>/overview` mà kho chưa kịp đặt
   * `currentProjectId` thì rail rơi xuống `duAnGanNhat` (dự án vừa mở LẦN TRƯỚC) ⇒ **thanh trái
   * nói tên dự án B trong khi trang đang là dự án A**. Đó đúng là hai-nguồn-sự-thật ở tầng điều
   * hướng: URL bảo một đằng, rail bảo một nẻo.
   * Nay `/projects/<id>/…` là CHÂN LÝ, đứng đầu chuỗi — cùng luật mà trang Tổng quan đã theo
   * (`useScope()` lấy id từ URL, không suy từ state toàn cục). Các nhánh sau chỉ còn phục vụ
   * những route KHÔNG mang id trên đường (Trang chủ, Files, Thư viện).
   */
  const duAnTrenDuong = /^\/projects\/([^/]+)/.exec(duong ?? '')?.[1] ?? null;
  /**
   * 🔴 GỠ `flowId` KHỎI CHUỖI NÀY — 27/08, P0 `L2-02`.
   *
   * `flowId` là `useFlowStore(s => s.currentFlowId)` — **luôn luôn** là một FLOW id
   * (`lib/store.ts:536` đặt nó từ tham số `flowId` của `loadGraph`). Nó nằm trong một chuỗi mà
   * kết quả được ghép vào `/projects/<id>/<chặng>`. Không có ca nào nó đúng.
   *
   * Bốn nguồn còn lại đều **chứng minh được là PROJECT id**:
   *   · `duAnTrenDuong` — bóc từ chính `/projects/<id>` trên URL (chân lý, xem ghi chú 22/08)
   *   · `duAnId`        — `currentProjectId` của store
   *   · `duAnGanNhat`   — chỉ nhận khi resume khai `scopeKind === 'project'`
   *   · `duAnMayChu`    — `flow.project.id` do máy chủ trả, không phải `flow.id`
   * Không nguồn nào cho ⇒ `null` ⇒ rail **mờ kèm lý do**, đúng hành vi đã có. Thà không có
   * đường vào còn hơn một đường vào dẫn tới trang không tồn tại.
   */
  const duAnHieuLuc = duAnTrenDuong ?? duAnId ?? duAnGanNhat ?? duAnMayChu;
  const daMoDuAn = Boolean(duAnHieuLuc);

  /**
   * SỐ DỰ ÁN — dữ liệu THẬT cho nấc Duyệt của mục "Dự án". `null` = chưa đọc được ⇒ không vẽ gì
   * (⛔ không bịa số 0: "0 dự án" và "chưa biết" là hai điều khác hẳn nhau).
   *
   * 🔴 23/08 — ĐÃ GỠ nhánh đọc TÊN DỰ ÁN khỏi đây. Tên dự án chỉ phục vụ nhãn của viên NGỮ CẢNH
   * DỰ ÁN, mà cả viên đó vừa rời rail ("bỏ luôn cái nháp") ⇒ giữ lại là một trường state không
   * ai đọc, và là mồi cho phiên sau tưởng rail vẫn còn chỗ bày tên dự án.
   * Nguồn giữ nguyên `/api/flows` — endpoint component này ĐÃ gọi sẵn cho `duAnMayChu`, không
   * thêm đường mạng mới.
   */
  const [soDuAn, setSoDuAn] = useState<number | null>(null);
  useEffect(() => {
    let huy = false;
    fetch('/api/flows')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (huy || !d) return;
        if (Array.isArray(d.projects)) setSoDuAn(d.projects.length);
      })
      .catch(() => {});
    return () => { huy = true; };
  }, []);

  // "Chặng đang dở" — dữ liệu THẬT, cùng khoá mà card Gallery đang đọc ([marker: lastStage]).
  // Đọc sau khi đã nạp xong để tránh lệch server/client.
  const changDangDo = daNap ? getLastStage(duAnHieuLuc) : null;

  const duoiDangDo = changDangDo ? MUC_DUOI_THEO_PHA[changDangDo] : null;

  /**
   * Nhãn của một viên. 23/08 — bỏ nhánh "nhãn mang TÊN DỰ ÁN": viên mang tên dự án là viên NGỮ
   * CẢNH DỰ ÁN, và cả viên đó vừa rời rail theo chốt "bỏ luôn cái nháp". Còn đúng hai nhãn tĩnh.
   */
  const nhanCum = (cum: CumRail): string => tr(NHAN_CUM[cum].vi, NHAN_CUM[cum].en);

  const tinhTrangCua = (muc: MucRail): string | null => {
    if (!hienTinhTrang || muc.mat320.kieu === 'khong') return null;
    // SỔ DỰ ÁN — số thật, không phải nhãn trang trí. Chưa đọc được thì im.
    if (muc.id === 'du-an') return soDuAn === null ? null : tr(`${soDuAn} dự án`, `${soDuAn} projects`);
    if (muc.cum === 'chang' && muc.duoi && muc.duoi === duoiDangDo) return tr('đang dở', 'in progress');
    // Chưa nối nguồn ⇒ KHÔNG vẽ gì. Bịa một con số ở đây là hỏng đúng thứ nấc này sinh ra để làm.
    return null;
  };

  const hepHon = nacKe(nac, -1);
  const rongHon = nacKe(nac, 1);

  const noi = nac !== 'dinhVi';
  return (
    <div
      // CHỖ TRONG DÒNG CHẢY.
      //  · TRONG CHẶNG → luôn 52px: nấc mở vẽ thành TẤM NỔI đè lên, canvas KHÔNG BAO GIỜ bị bóp (§7).
      //  · NGOÀI CHẶNG (Trang chủ) → chỗ trong dòng chảy ĐÚNG BẰNG nấc đang mở.
      //
      // 🔴 22/08 — SỬA LỖI ĐÈ ĐO ĐƯỢC. `nacMoDau` (dòng ~98) cố ý mở `dieuHuong` khi ở ngoài
      // chặng — ý đồ ĐÚNG và giữ nguyên: *"đang đi tìm việc, cần đọc tên"*. Nhưng nấc mở lại vẽ
      // NỔI, nên ở Trang chủ tấm 240 **đè vĩnh viễn ~144px lên nội dung** (đo app thật: nội dung
      // bắt đầu x=186, tấm rộng ~330). Nổi-đè sinh ra cho lượt RÊ CHUỘT THOÁNG QUA trong chặng,
      // không phải cho một nấc mở THƯỜNG TRỰC.
      // ⇒ Ngoài chặng thì nó CHIẾM CHỖ THẬT: overlap về 0, và bản đồ mở vẫn còn.
      // Giữ trọn cả hai luật: canvas không bao giờ bị bóp · nấc mở không bao giờ che nội dung.
      style={{
        width: dangTrongChang ? BE_RONG_NAC.dinhVi : BE_RONG_NAC[nac],
        transition: 'width 180ms cubic-bezier(.32,.72,0,1)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 5,
        height: '100%',
      }}
      onPointerLeave={(e) => {
        // §8 — rời cả vùng rail+tấm: ân hạn ngắn rồi thu, TRỪ khi ghim / focus còn bên trong.
        if (!noi || ghimBanDo || e.pointerType !== 'mouse') return;
        if (e.currentTarget.contains(document.activeElement)) return;
        huyHenThu();
        henThuBanDo.current = setTimeout(() => setNac('dinhVi'), 320);
      }}
      onPointerEnter={huyHenThu}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && noi) { e.stopPropagation(); thuBanDo(); }
      }}
      // Focus bàn phím vào trong tấm phải giữ nó mở (a11y §34) — huỷ mọi hẹn thu đang treo.
      onFocusCapture={huyHenThu}
    >
    <nav
      aria-label={tr('Điều hướng chính', 'Main navigation')}
      data-marker="railHaiCum"
      data-rail-noi={noi ? '1' : undefined}
      // 🔴 23/08 — MÁNG RỖNG. Trước bản này `<nav>` tự mang `bg-[var(--panel)]` + `border-r`, tức
      // CHÍNH NÓ là một mặt phẳng chạy suốt chiều cao màn — đó đúng là thứ Hoà chê *"1 thanh dọc
      // dài, cảm giác thô"*. Nay nav trong suốt và không viền: nó chỉ còn là CHỖ (52px giữ trong
      // dòng chảy), còn MẶT thì do hai VIÊN bên trong gánh. Cột là chỗ, viên là vật đứng trong chỗ.
      // ⛔ Đừng trả `bg`/`border-r` về đây cho "gọn" — trả về là dựng lại đúng cái thanh dài.
      className="flex min-h-0 flex-col"
      style={{
        width: beRong,
        // TẤM NỔI: nấc rộng đè LÊN nội dung, không chen vào dòng chảy. Bóng nay ở trên từng VIÊN
        // (xem `vienCum`) chứ không ở nav — nav không còn mặt nào để đổ bóng.
        ...(noi
          ? { position: 'absolute' as const, left: 0, top: 0, bottom: 0 }
          : null),
        // (22/08) `position`/`zIndex` chuyển lên VỎ giữ-chỗ — nav chỉ còn lo chiều rộng của mình.
        ...(noi ? null : { position: 'relative' as const }),
        // Ẩn tới khi biết nấc chi tiết đã lưu — nhấp nháy đổi bề rộng lúc mở app đọc ra như lỗi.
        visibility: daNap ? 'visible' : 'hidden',
        // Đang KÉO thì tắt transition — nếu không con trỏ đi trước, mép rail đuổi theo sau.
        transition: reduceMotion || nac === 'duyet' ? 'none' : 'width .2s var(--ease-apple)',
      }}
    >
      {/* TAY NẮM KÉO — chỉ ở nấc "duyệt" (chốt #4: Work Panel 320–440 resizable). Dải 6px sát
          mép phải, trong suốt: nó là vùng CHẠM chứ không phải một vạch trang trí — thêm một
          đường kẻ dọc nữa ở đây là thêm chrome đúng chỗ đang muốn nhường cho nội dung.
          Bàn phím: mũi tên trái/phải đổi 16px một nhịp — kéo-thả không được là kênh DUY NHẤT
          (luật a11y đã ghi ở phiếu kéo-thả 16/08). */}
      {nac === 'duyet' && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={tr('Kéo để đổi bề rộng bảng', 'Drag to resize the panel')}
          aria-valuenow={beRongDuyet}
          aria-valuemin={RONG_DUYET_MIN}
          aria-valuemax={RONG_DUYET_MAX}
          tabIndex={0}
          onPointerDown={batDauKeo}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault();
            const moi = Math.min(
              RONG_DUYET_MAX,
              Math.max(RONG_DUYET_MIN, beRongDuyet + (e.key === 'ArrowRight' ? 16 : -16)),
            );
            setBeRongDuyet(moi);
            try {
              localStorage.setItem(KHOA_RONG_DUYET, String(moi));
            } catch {
              /* im lặng */
            }
          }}
          style={{
            position: 'absolute',
            top: 0,
            right: -3,
            width: 6,
            height: '100%',
            cursor: 'col-resize',
            zIndex: 6,
          }}
        />
      )}
      {/* Ở nấc ĐỊNH VỊ khung cuộn phải VISIBLE **CẢ HAI TRỤC** — viên nhãn mọc ra ngoài 52px.
          🔴 Bẫy CSS đã đo: `overflow-y: auto` + `overflow-x: visible` KHÔNG cho ra "tràn ngang
          được" — theo spec, một trục là scroll thì trục kia tự nâng `visible` → `auto`, tức VẪN
          CẮT. Lần đầu chỉ mở `overflowX` nên viên nhãn vẫn bị xén, chỉ ló một chữ.
          Bỏ cuộn dọc ở nấc này không mất gì: 8 icon × ~30px không bao giờ tràn chiều cao màn.
          Hai nấc rộng giữ `auto/hidden` như cũ. */}
      <div
        // `py-2` = 8px, đúng `.than{padding:8px 0}` của bản vẽ. HAI ĐẦU HỞ: chính chỗ hở này làm
        // viên đọc ra *vật nổi* thay vì *thanh* — phép nghiệm thu, không phải đệm cho thoáng.
        /* 🔴 26/08 — HAI VIÊN NEO QUANH TRỤC GIỮA, KHÔNG BÁM ĐỈNH.
           Mã đã dựng đúng hai viên có mép riêng từ 23/08, nhưng trên app thật chúng vẫn
           đọc ra *một thanh dọc dài*. Đo ảnh 26/08 ra hai nguyên nhân, cả hai là CHỖ ĐẶT
           chứ không phải hình dạng:
             ① viên dán SÁT MÉP TRÁI ⇒ không còn dải máng nào để mắt thấy là "vật đứng
                trong chỗ". Không thấy máng thì viên = thanh.
             ② cụm BÁM ĐỈNH rồi đổ dài xuống ⇒ đúng bóng dáng menu app cao suốt màn.
           Nay: thụt trái 6px cho máng lộ ra, và `justify-center` để khối điều hướng neo
           quanh trục giữa — "vật nổi gắn vào mép trái căn phòng", không phải tấm ván
           treo từ trần xuống sàn. */
        className="flex min-h-0 flex-1 flex-col justify-center gap-1 py-2 pl-1.5"
        style={{
          scrollbarWidth: 'thin',
          overflowY: hienChu ? 'auto' : 'visible',
          overflowX: hienChu ? 'hidden' : 'visible',
        }}
      >
        {/* 🔴 23/08 — KHỐI NGỮ CẢNH DỰ ÁN (`NguCanhDuAn`) ĐÃ GỠ khỏi rail. Nó nói *đang ở dự án
            nào, có ai* — tức cùng loại với bốn mục "cái nháp" Hoà vừa bỏ, và nó là VẬT THỨ BA
            trên một thanh Hoà chốt là ĐÚNG HAI VIÊN. Tệp `./NguCanhDuAn.tsx` GIỮ NGUYÊN, không
            xoá: bề mặt dự án sẽ cần lại nó. Xem cảnh báo trong báo cáo phiên 23/08. */}
        {THU_TU_CUM.map((cum, i) => (
          <div
            key={cum}
            role="group"
            // `aria-label` chứ không `aria-labelledby`: ở nấc định vị tiêu đề cụm KHÔNG được render
            // (chỉ hình, không chữ) ⇒ trỏ vào một phần tử không tồn tại thì cụm mất tên với trình
            // đọc màn hình đúng ở nấc hẹp nhất. `aria-label` sống ở cả ba nấc chi tiết.
            aria-label={nhanCum(cum)}
            data-vien-rail={cum}
            style={{
              // ── VIÊN, KHÔNG PHẢI ĐOẠN CỦA MỘT THANH (Hoà chốt 23/08) ───────────────────────
              // MẶT nay ở đây chứ không ở `<nav>`. Mỗi cụm là một vật có mép riêng, đứng trong
              // máng 52px rỗng. Đây là toàn bộ khác biệt giữa *"thanh dọc dài, thô"* và *"hai
              // viên nổi"* — cùng số mục, cùng bố cục, khác chỗ đặt cái mặt phẳng.
              /* ── DA GĐ2 (02/09) — Hoà 00:33: *"thanh side left bar cũng sai"* ──────────────
                 GU §2 (`docs/GU-PROFILE.md`, chưng cất từ 4 board Pinterest của Hoà): *liquid-glass
                 / soft neumorphism · pill bo tròn full · frosted blur · đổ bóng mềm HAI CHIỀU ·
                 KHÔNG rẽ flat*. Bản trước là `--panel` ĐẶC TRƠN + một bóng đổ một phía ⇒ đọc ra
                 phẳng, đúng chỗ Hoà chê.

                 ⚠️ VÌ SAO KHÔNG DÙNG `.glass-float` (kính lỏng 34%) — luật `globals.css:1322`:
                 class đó bị khoá ở ĐÚNG 4 chỗ, cả 4 nằm TRÊN canvas WebGL, và trần đó có lý do
                 hiệu năng ("quá 4 tấm là giật"), *"thêm tấm thứ 5 = phải gỡ 1 tấm cũ"*. Rail không
                 nằm trên canvas, nhưng luật thứ HAI mới là luật quyết định ở đây: mặt CÓ CHỮ thì
                 nền phải ĐẶC ≥92%, blur chỉ là gia vị (`globals.css:1286`, *"kính là gia vị, đọc
                 được TRƯỚC"* — iOS 27 đã tự sửa Liquid Glass vì lý do y hệt). Rail chở 7 nhãn chữ
                 ⇒ nó là **frosted DÀY**, không phải kính lỏng. Vẫn "kính mờ có chiều dày" theo GU,
                 mà không tiêu một suất nào trong 4 tấm canvas và không hạ tương phản chữ. */
              background: 'color-mix(in srgb, var(--panel) 94%, transparent)',
              backdropFilter: 'blur(14px) saturate(140%)',
              // -webkit- BẮT BUỘC (luật nền `kinh-webkit-prefix`): thiếu là Safari/tablet mất mờ.
              WebkitBackdropFilter: 'blur(14px) saturate(140%)',
              border: '1px solid var(--vien-mo)',
              // BO ĐỒNG TÂM — TÍNH, KHÔNG CHỌN BẰNG MẮT. Hàng bên trong có `margin: 0 4px` ⇒ đệm 4.
              // 🔴 TÍNH LẠI 02/09 vì HÀNG ĐÃ ĐỔI HÌNH. Ghi chú cũ chốt viên `r3` (14) để hàng ra
              // đúng `r2` (10), và cảnh báo r4 sẽ làm "hàng r2 hụt 6px". Cảnh báo đó đúng CHO HÀNG
              // r2 — nay hàng là VIÊN NANG (GU §2: "nút dạng pill/capsule"), curvature liên tục nên
              // không có góc nào để lệch tâm. Với hàng cao `--row`, bán kính viên nang ≈ 18 ⇒ viên
              // ngoài lý tưởng ≈ 18 + 4 = 22, lấy nấc gần nhất trên thang là **r4 (20)**.
              // Đây là tính lại theo luật cũ với đầu vào mới, KHÔNG phải bỏ luật.
              borderRadius: RADIUS.r4,
              padding: '4px 0',
              // TÁCH BẰNG KHOẢNG HỞ, KHÔNG BẰNG ĐƯỜNG KẺ (Hoà 16/08 "không thích đường kẻ ngăn
              // một cái rẹt chia khối"). Nay khoảng hở làm việc mạnh hơn hẳn bản cũ: hai bên nó
              // là hai MÉP VIÊN thật, nên mắt đọc ra hai vật kể cả khi không có chữ nào.
              // 18px — đúng `.cum + .cum{margin-top:18px}` của bản vẽ đã duyệt.
              marginTop: i === 0 ? 0 : 18,
              /* BÓNG MỀM HAI CHIỀU (neumorphic, GU §2) — bản cũ chỉ có MỘT lớp đổ sang phải
                 (`8px 0 …`), tức viên chỉ "hắt bóng", không có chiều dày. Nay ba lớp:
                   ① bóng xa, mềm, đổ XUỐNG-PHẢI  → vật nặng, nổi khỏi nền;
                   ② bóng gần, chặt              → mép tiếp đất, chống cảm giác dán;
                   ③ gờ sáng TRONG mép trên      → ánh sáng từ trên, đúng công thức Apple mà
                                                    `.glass-float` đang dùng (`globals.css:1330`).
                 Lớp ③ là thứ thật sự gỡ cảm giác "phẳng" — cùng chẩn đoán đã ghi ở `.vitals-pop`
                 08/08 (*"gờ sáng viền trên … đây là phần thật sự gây cảm giác đục, không phải
                 opacity"*). Bóng luôn bật, không chỉ khi nấc rộng: chiều dày là thuộc tính của
                 VẬT, không phải của trạng thái. */
              boxShadow: noi
                ? '10px 0 34px -20px rgba(0,0,0,.50), 2px 0 8px -6px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.10)'
                : '0 6px 20px -14px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.10)',
              ...(cum === 'chang' ? { position: 'relative' as const } : null),
            }}
            // GIÃN DỌC GỌN cho viên chặng: khoảng giữa ba hàng khít hơn viên việc (0 vs 2px) —
            // nhịp dày hơn đọc ra "một cụm liền", nhịp thưa đọc ra "các mục rời".
            className={cum === 'chang' ? 'if-rail-spine flex flex-col' : 'flex flex-col gap-0.5'}
            data-nac={nac}
          >
            {hienChu && (
              // `--t3` chứ không `--t4`: đo được 17/08 — --t4 trên --panel chỉ 3,65:1 (Tối) và
              // 2,86:1 (Sáng), dưới ngưỡng 4,5:1 của WCAG 1.4.3; chữ 11px in hoa KHÔNG tính là
              // "chữ lớn" nên không được hưởng ngưỡng 3:1. --t3 cho 6,93 / 4,90 — đạt cả hai nền.
              <div
                aria-hidden
                /* 🔴 BỎ `uppercase` 26/08 — Hoà soi app thật, nhãn ra "VIỆC" · "CHẶNG".
                   Vi phạm LUAT-CHU-VIET-7.1.23: hoa toàn phần GIẾT DẤU, mà dấu tiếng Việt
                   mang nghĩa. "VIỆC"/"CHẶNG" còn đọc được vì dấu nằm dưới, nhưng luật là luật
                   và nhãn nhóm dài hơn (vd "Cảm hứng") sẽ hỏng thật.
                   Bỏ luôn `font-bold`: đây là nhãn NHÓM, nó phải LÙI ra sau mục điều hướng,
                   không tranh vai. Đậm + hoa + giãn chữ = ba kênh nhấn cùng lúc cho một thứ
                   đáng lẽ phải mờ đi. Giữ `tracking-wider` — giãn nhẹ vẫn giúp phân tầng. */
                className="px-3 pb-1 pt-0.5 text-[var(--fs-2xs)] font-medium tracking-wider text-[var(--t3)]"
              >
                {nhanCum(cum)}
              </div>
            )}
            {MUC_RAIL.filter((m) => m.cum === cum).map((muc) => (
              <HangRail
                key={muc.id}
                muc={muc}
                duongDi={duongCua(muc, duAnHieuLuc)}
                lyDo={lyDoMo(muc, daMoDuAn)}
                dangMo={dangMo === muc.id}
                hienChu={hienChu}
                gonDoc={cum === 'chang'}
                tinhTrang={tinhTrangCua(muc)}
              />
            ))}
            {/* `+` ĐỨNG CUỐI VIÊN CHẶNG — phần tử MÀU duy nhất của cả thanh (Hoà chốt 23/08). */}
            {/* 🔴 GỠ KHỎI MÀN 02/09 — Hoà đang cầm app soi từng màn và nút này là một CỬA CHẾT.
                `NutTaoAi` được dựng ĐÚNG luật §9 (mờ KÈM lý do "đang dựng — chưa nối"), và nó vẫn
                phải đi: §9 cho phép mờ khi việc CHƯA LÀM ĐƯỢC, nhưng không biến một chỗ chưa có
                gì thành một món đồ trên thanh điều hướng chính. Cùng phán quyết với "Ask AI" —
                AI chỉ được lên màn dưới danh VITALS theo khuôn đã thiết kế, hoặc không lên.
                ⚠️ CHỈ gỡ CHỖ HIỆN, giữ nguyên hàm bên dưới: nó chở lời chứng về `aria-disabled`
                vs `disabled` (đo 16/08) — xoá hàm là xoá luôn bài học đó. Nối được cửa AI thật
                thì trả lại một dòng này. */}
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
        {/* GHIM (§8) — chỉ có nghĩa khi tấm đang nổi: ghim = tấm ở lại; bỏ ghim = tự thu khi rời
            chuột. Mặc định làm-sâu là KHÔNG ghim. */}
        {noi && (
          <button
            type="button"
            onClick={() => datGhimBanDo(!ghimBanDo)}
            aria-pressed={ghimBanDo}
            aria-label={ghimBanDo ? tr('Bỏ ghim bản đồ — tự thu khi rời chuột', 'Unpin map — auto-collapse on leave') : tr('Ghim bản đồ ở lại', 'Pin map open')}
            title={ghimBanDo ? tr('Bỏ ghim', 'Unpin') : tr('Ghim', 'Pin')}
            className="grid h-7 w-7 place-items-center rounded-[var(--r-1)] transition-colors hover:bg-[var(--hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            style={{ color: ghimBanDo ? 'var(--accent)' : 'var(--t4)' }}
          >
            <Pin size={16} aria-hidden style={ghimBanDo ? undefined : { transform: 'rotate(45deg)' }} />
          </button>
        )}
        {hepHon && <NutNac huong="hep" toi={hepHon} onDoi={doiNac} hep={!hienChu} />}
        {rongHon && <NutNac huong="rong" toi={rongHon} onDoi={doiNac} hep={!hienChu} />}
      </div>
    </nav>
    </div>
  );
}

/** Đuôi route của từng chặng — dùng để soi "chặng đang dở" trỏ vào mục nào. */
const MUC_DUOI_THEO_PHA: Record<string, string> = { concept: 'cad', render: 'render', present: 'present' };

/**
 * NÚT `+` — CUỐI VIÊN CHẶNG. Hoà chốt 23/08, nguyên văn:
 *   *"3 chặng với dấu + có dấu ấn kính lỏng màu. bình thường trượt lên xuống 3 chặng kính chỉ
 *    trong bình thường; khi trượt xuống + lập tức kính lỏng trong nhưng có màu sắc AI, biểu thị
 *    chuyện nhấn vào đây sẽ tạo ra những sản phẩm từ AI."*
 *
 * ── BA ĐIỀU LÀM ĐÚNG CHỮ, ĐỪNG SỬA CHO TIỆN ─────────────────────────────────────────────────
 * ① **"KÍNH VẪN TRONG"** — lúc ăn màu KHÔNG được đặc lại. Nền màu giữ ở 10-14%, `backdrop-filter`
 *    vẫn chạy ⇒ vẫn nhìn xuyên. Tô đặc là biến kính thành nút bấm sơn màu, mất hẳn ý "kính lỏng".
 * ② **KHÔNG QUẦNG SÁNG** (luật G3 + NT-11 cấm glow tĩnh). "Ăn màu" làm bằng QUANG HỌC: mép dày
 *    lên (`inset` shadow mô phỏng thành kính) + viền chuyển màu + nền màu rất loãng. ⛔ Không
 *    `box-shadow` toả ra ngoài, không `filter: drop-shadow` màu.
 * ③ **MÀU LÀ LỜI KHAI, KHÔNG PHẢI TRANG TRÍ** — nó chỉ xuất hiện khi con trỏ/tiêu điểm ĐANG Ở
 *    ĐÂY, và nó nói *"bấm vào là sinh ra thứ mới bằng AI"*. Nút đứng yên thì trung tính như mọi
 *    hàng khác, đúng luật "đúng một màu nhấn, còn lại trung tính".
 *
 * 🟡 CHƯA NỐI HÀNH VI — khai thẳng, không giả vờ. Cửa "tạo sản phẩm bằng AI" chưa có bề mặt nào
 * để mở: `+` là một BỀ MẶT MỚI, mà dựng bề mặt mới nằm ngoài vùng ghi `components/nav/**`.
 * ⛔ Đường sai là cho nó `router.push` bừa vào một trang gần giống — đó là nút giả, §9 cấm.
 * Đường đúng (đang làm): nút CÓ MẶT, hình đầy đủ để duyệt bằng mắt, `aria-disabled` + lý do đọc
 * được qua `aria-describedby`. Nối xong thì bỏ `aria-disabled` và gắn `onClick` — hình không đổi.
 *
 * ⚠️ `aria-disabled` chứ KHÔNG `disabled`: `<button disabled>` bị Tab bỏ qua hẳn và không bắn
 * `focus` ⇒ đúng cái nút cần giải thích nhất lại mất sạch kênh giải thích với bàn phím và trình
 * đọc màn hình (đo được 16/08, `components/ui/ToolbarChip.tsx:24-37`). Hệ quả cố ý: nút vẫn
 * chiếm một chặng Tab, và tiêu điểm bàn phím LÀM NÓ ĂN MÀU y như con trỏ — "trượt tới" phải đúng
 * cho cả hai cách trượt.
 */
function NutTaoAi({ hienChu }: { hienChu: boolean }) {
  const tr = useT();
  const reduceMotion = useReducedMotion();
  const [chieuSang, setChieuSang] = useState(false);
  const nhan = tr('Tạo bằng AI', 'Create with AI');
  const lyDo = tr('Cửa tạo bằng AI đang dựng — chưa nối', 'The AI create surface is not wired yet');
  const idLyDo = 'rail-ly-do-tao-ai';

  const cuChi = {
    onMouseEnter: () => setChieuSang(true),
    onMouseLeave: () => setChieuSang(false),
    onFocus: () => setChieuSang(true),
    onBlur: () => setChieuSang(false),
  };

  return (
    <>
      <button
        type="button"
        {...cuChi}
        aria-disabled
        aria-describedby={idLyDo}
        aria-label={nhan}
        data-nut-tao-ai={chieuSang ? 'an-mau' : 'trong'}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 30,
          padding: hienChu ? '3px 10px' : '3px 0',
          margin: '2px 4px 0',
          width: 'calc(100% - 8px)',
          justifyContent: hienChu ? 'flex-start' : 'center',
          // r2 giống mọi hàng trong viên — `+` là CÔNG DÂN của viên chặng, không phải vật lạ
          // dán thêm vào cuối. Khác biệt của nó nằm ở MÀU khi trượt tới, không ở hình dạng.
          borderRadius: RADIUS.r2,
          cursor: 'not-allowed',
          // MỜ NHƯ MỌI MỤC CHƯA DÙNG ĐƯỢC — cùng token, cùng theme-aware (tối .5 · sáng .62).
          // ⚠️ Cái giá đã biết, khai thẳng: màu AI lúc "ăn màu" bị nhìn qua lớp mờ này nên nhạt
          // hơn màu thật. Đó là đánh đổi ĐÚNG — một nút sáng rực mà bấm không ra gì là nút giả
          // (§9), tệ hơn hẳn một nút thành thật nói "chưa nối". Nối xong thì bỏ dòng này và màu
          // lên đủ độ, KHÔNG phải chỉnh lại giá trị màu.
          opacity: 'var(--mo-vo-hieu)',
          fontFamily: 'inherit',
          fontSize: 'var(--fs-ui)',
          textAlign: 'left',
          // KÍNH: nền trong suốt + làm mờ nền phía sau. Đây là trạng thái "kính chỉ trong".
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          background: chieuSang ? `color-mix(in srgb, ${MAU_AI} 12%, transparent)` : 'transparent',
          border: `1px solid ${chieuSang ? MAU_AI_SANG : 'var(--vien-mo)'}`,
          // 🔴 MÀU CHỈ ĐI VÀO HÌNH (viền + dấu `+`), CHỮ Ở LẠI TOKEN MỰC — đúng luật đã có sẵn
          // vài dòng trên cho hàng đang mở. Lý do là SỐ, không phải gu: `#2a99a4` trên nền sáng
          // `--panel` chỉ **3,23:1** (tính 23/08). Đạt ngưỡng 3:1 cho PHẦN TỬ GIAO DIỆN nên viền
          // và glyph dùng được, nhưng trượt ngưỡng **4,5:1 cho CHỮ** (WCAG 1.4.3) — mà ở nấc rộng
          // nút này CÓ nhãn chữ. Để màu lên chữ là hỏng đúng chỗ dễ bỏ sót nhất.
          color: 'var(--t2)',
          // THÀNH KÍNH DÀY LÊN — `inset`, tức ánh sáng nằm TRONG mép nút. Không toả ra ngoài nên
          // không thành quầng sáng; nó đọc ra như rìa một khối kính bắt sáng.
          boxShadow: chieuSang
            ? `inset 0 0 0 1px color-mix(in srgb, ${MAU_AI_SANG} 35%, transparent), inset 0 1px 0 0 color-mix(in srgb, #fff 22%, transparent)`
            : 'inset 0 1px 0 0 color-mix(in srgb, #fff 8%, transparent)',
          transition: reduceMotion
            ? 'none'
            : 'background var(--nhip-bam) var(--ease-apple), border-color var(--nhip-bam) var(--ease-apple), color var(--nhip-bam) var(--ease-apple), box-shadow var(--nhip-bam) var(--ease-apple)',
        }}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <span
          aria-hidden
          data-o-icon
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 20,
            height: 20,
            flexShrink: 0,
            // Màu sống ở ĐÂY — dấu `+` là HÌNH, ngưỡng 3:1 là đủ và nó đạt (3,23 sáng · 5,42 tối
            // ở độ đậm đầy đủ). Ở nấc hẹp 52px đây cũng là kênh màu DUY NHẤT nhìn thấy.
            color: chieuSang ? MAU_AI_SANG : 'var(--t3)',
          }}
        >
          <Plus size={HE_BIEU_TUONG.hinh} strokeWidth={HE_BIEU_TUONG.net} />
        </span>
        {hienChu && <span style={{ whiteSpace: 'nowrap' }}>{nhan}</span>}
      </button>
      {/* Lý do sống trong DOM (không phải `title=`) nên trình đọc màn hình đọc được, và cảm ứng
          cũng tới được — `title` câm trên cảm ứng. Ẩn khỏi mắt, không ẩn khỏi cây trợ năng. */}
      <span id={idLyDo} className="if-tooltip-a11y">
        {lyDo}
      </span>
    </>
  );
}

function NutNac({
  huong,
  toi,
  onDoi,
  hep,
}: {
  huong: 'hep' | 'rong';
  toi: NacRail;
  onDoi: (n: NacRail) => void;
  /** Nấc định vị nay rộng **52px** (IF-CANONICAL §10 `[CHỐT]` Neo 52px; trước là 28).
   *  Chỗ dùng được = 52 − 2×6 (padding máng) = **40px**, và ở nấc này chỉ vẽ MỘT nút.
   *  ⇒ ghim **32px CỐ ĐỊNH**: trên 24 của thời 28px (24 là hệ quả BỊ ÉP, không phải lựa chọn
   *  a11y), vượt sàn WCAG 2.2 AA 2.5.8 (24×24), và vẫn lọt 40px.
   *  ⛔ ĐỪNG đổi thành `var(--tap)`: `--tap` bị override thành **44px** dưới
   *  `@media (hover:none) and (pointer:coarse)` (`app/globals.css:206-208`) ⇒ 44 > 40 là tràn
   *  máng trên cảm ứng — đúng lại cái bẫy mà bản 28px đã trả giá để tìm ra.
   *  **`flex-shrink:0` phải giữ**: thiếu nó nút bị bóp còn 16px (đo trên trình duyệt, đọc mã
   *  không ra). */
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
        className="grid shrink-0 place-items-center text-[var(--t3)] transition-colors duration-[var(--nhip-bam)] hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
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
  /* `hienVien` đã gỡ cùng viên nhãn nở-khi-rê (02/09). `reVao` GIỮ LẠI: nó vẫn là kênh hover
   * cho nền hàng, và giữ `onFocus`/`onBlur` nghĩa là bàn phím vẫn thấy đúng thứ chuột thấy. */
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
    /* NẤC HẸP = CỘT icon-trên / chữ-dưới (02/09, dáng tab bar iPad — chốt 14).
       Nấc rộng vẫn là HÀNG ngang icon-rồi-chữ, không đổi. */
    ...(hienChu ? null : { flexDirection: 'column' as const }),
    gap: hienChu ? 10 : 3,
    minHeight: gonDoc ? 30 : 'var(--row)',
    padding: gonDoc ? (hienChu ? '3px 10px' : '5px 0') : hienChu ? '5px 10px' : '7px 0',
    margin: '0 4px',
    justifyContent: hienChu ? 'flex-start' : 'center',
    /* VIÊN NANG (02/09, GU §2 "nút dạng pill/capsule · pill bo tròn full"). Trước là `r2` (10) —
       một hình chữ nhật bo nhẹ, đọc ra "ô danh sách", không đọc ra "nút". Bo full là thứ phân
       biệt hai cái đó, và nó là chữ ĐẦU TIÊN trong câu tả gu của Hoà.
       Viên ngoài đã tính lại lên `r4` cho đồng tâm — xem ghi chú tại chỗ khai `borderRadius` của
       cụm. Bo full KHÔNG đụng nền `--t1 8%`: hình đổi, kênh màu giữ nguyên (rail vẫn trung tính,
       accent vẫn để dành cho CTA — chốt GĐ1, và là cổng `muc-dieu-huong.test.ts` đang canh). */
    borderRadius: RADIUS.full,
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
      {/* Dải đặc 2px đánh dấu mục đang mở (khuôn định danh Hoà chốt 15/08). Nó cũng là KÊNH
          THỨ HAI ngoài màu — hình dạng — nên trạng thái "đang mở" không phụ thuộc mỗi việc phân
          biệt được sắc độ.
          🟣 01/09 — dải đổi `--accent` → `--t1` (MỰC trung tính): bản vẽ GĐ1 chốt trạng thái
          đang-mở của rail là TRUNG TÍNH trắng-mờ, không tím — accent để dành cho CTA + trạng
          thái chạy của từng màn. Kênh HÌNH DẠNG giữ nguyên, chỉ đổi hue; tương phản `--t1` trên
          `--panel` cao hơn hẳn accent cũ nên không mất khả năng nhận ra. */}
      {/* 🔴 GẠCH DỌC 2px ĐÃ GỠ (02/09). Nó là dấu chỉ đúng khi hàng còn là ô chữ nhật xếp ngang;
          hàng nay là VIÊN NANG có nền, gạch dính mép trái đọc ra như một lỗi tràn. Dấu chỉ
          `data-chi-dau="dang-mo"` chuyển LÊN CHÍNH HÀNG (xem chỗ dựng `<a>`/`<button>`), và kênh
          phi-màu thay nó là NÉT ICON + ĐỘ ĐẬM NHÃN — xem hai ghi chú bên dưới. */}
      {/* Ô ĐẶT ICON 20×20 CỐ ĐỊNH, hình 18 bên trong (`HE_BIEU_TUONG`). Ô cố định chứ không để
          icon tự chiếm chỗ: hình lucide có cái vuông có cái dẹt, thả trần thì TÂM QUANG HỌC mỗi
          hàng lệch một kiểu và cả cột đọc ra "nhặt từ nhiều bộ". Có ô thì tám tâm thẳng một trục
          dọc — đo được, xem test [9] và số đo trong báo cáo.

          🔴 NÉT KHÔNG ĐỔI THEO TRẠNG THÁI. Trước đó chỗ này là `strokeWidth={1.5}` rồi
          `netNhan` khi đang mở — cả hai đều lấy ĐỘ DÀY NÉT làm kênh trạng thái, mà nét là thuộc
          tính của HỌ: nét đổi thì icon đó thôi cùng bộ với hàng xóm. Trạng thái nay đi bằng
          NỀN + DẤU CHỈ (xem trên), nét ở nguyên `HE_BIEU_TUONG.net` cho cả tám hàng.
          `netNhan` vẫn còn trong hệ cho nơi khác cần nhấn TĨNH — không dùng ở đây. */}
      <span
        aria-hidden
        data-o-icon=""
        style={{
          width: ICON_RAIL.khung,
          height: ICON_RAIL.khung,
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
        {/* 🔴 NÉT LẠI MANG TRẠNG THÁI — và lần này là CÓ LÝ DO, khác lần bị gỡ trước.
            Ghi chú ngay trên nói "nét không đổi theo trạng thái" vì hồi đó trạng thái đã có
            DẤU CHỈ riêng (gạch dọc 2px). Gạch nay bị gỡ (02/09), nên nếu không bù thì "đang mở"
            chỉ còn sống bằng NỀN — tức chỉ còn kênh TÔNG MÀU, và mất sạch khi in trắng đen hoặc
            với mắt kém phân biệt sắc độ. Hai kênh bù, cả hai đều PHI MÀU:
              ① nét icon dày lên (2 vs 1.75)  ② nhãn dưới icon đậm lên (600 vs 500)
            Đánh đổi đã cân: nét đổi làm icon đang-mở hơi lệch họ với hàng xóm — chấp nhận, vì
            mất kênh trợ năng nặng hơn lệch họ một hàng. */}
        <Icon size={ICON_RAIL.hinh} strokeWidth={dangMo ? ICON_RAIL.netDangMo : ICON_RAIL.net} />
      </span>
      {/* 🔴 NHÃN TĨNH DƯỚI ICON (02/09) — thay VIÊN NHÃN nở-khi-rê.
          Viên nhãn cũ chỉ hiện khi RÊ hoặc FOCUS ⇒ ở nấc hẹp, bảy mục là bảy hình câm: muốn biết
          hình nào là gì phải rê từng cái. Trên máy CHẠM thì không có "rê" — tức nhãn gần như
          không tồn tại (đúng luật nền `tablet-khong-giau-sau-hover`, và chốt 5 của Hoà "hai bản
          desktop/chạm, cấm bản lai").
          Tab bar iPad — mốc Hoà chốt 14 — luôn để CHỮ DƯỚI HÌNH, không giấu sau tương tác. Nhãn
          nay đứng yên, đọc được ngay, và mang luôn kênh trạng thái thứ hai bằng ĐỘ ĐẬM.
          `aria-hidden`: tên mục đã nằm ở `aria-label` của hàng — để chữ này lộ ra là trình đọc
          màn hình đọc tên hai lần. */}
      {!hienChu && (
        <span
          aria-hidden
          data-nhan-rail=""
          style={{
            fontSize: 10.5,
            lineHeight: 1.1,
            letterSpacing: '.01em',
            fontWeight: dangMo ? 600 : 500,
            color: dangMo ? 'var(--t1)' : 'var(--t3)',
            maxWidth: 64,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
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
  /* 🔴 23/08 — NHÁNH "MỤC HÀNH ĐỘNG" ĐÃ GỠ. Nó chỉ phục vụ Soát duyệt (bắn `if:panel-flank-open`
     mở bảng kiểm ở mép phải), mà Soát duyệt vừa rời rail theo danh sách Hoà chốt.
     ⚠️ Động cơ soát duyệt VẪN CHẠY — `ReviewPanel` qua `PanelFlank`, khoá `review.<chặng>`; nó
     chỉ mất một lối vào từ thanh trái. Xem mục "lối vào còn lại" trong báo cáo phiên 23/08. */
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
        data-chi-dau={dangMo ? 'dang-mo' : undefined}
        aria-label={nhan}
        style={chung}
        className="transition-colors duration-[var(--nhip-bam)] hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
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
        data-chi-dau={dangMo ? 'dang-mo' : undefined}
        style={chung}
        className="transition-colors duration-[var(--nhip-bam)] hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
      >
        {ruot}
      </Link>
    </Tooltip>
  );
}
