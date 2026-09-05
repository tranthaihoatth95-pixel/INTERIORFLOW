/**
 * components/nav/muc-dieu-huong.ts — [marker: railHaiCum] BẢNG KHAI của rail điều hướng.
 * (Marker GIỮ NGUYÊN chuỗi `railHaiCum` làm ĐỊNH DANH ổn định dù rail nay là BA CỤM — đổi chuỗi
 *  marker là vỡ mọi con trỏ trong phiếu/nhật ký cũ; tên marker là khoá kỹ thuật, không phải nhãn.)
 *
 * Vì sao tách khỏi component: đây là phần DUY NHẤT kiểm được bằng máy (đường đi · mục đang mở ·
 * lý do mờ · nấc chi tiết nào có gì để nhìn). Để chung trong `.tsx` thì muốn kiểm phải dựng DOM.
 *
 * NGUỒN CẤU TRÚC — `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` điều 3 (BA CỤM: Workspace chung ·
 * ba chặng · cá nhân/hệ thống — ĐÈ chốt "hai cụm" 16-17/08) + điều 4 (ba độ sâu: Rail 52-56 ·
 * Context Shelf 220-280 · Work Panel 320-440). Nền cũ vẫn đúng phần ràng buộc:
 * `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §5 (ba nấc chi tiết = ba công năng) · §6 (ràng buộc
 * chung). Bản đồ: `docs/IF-KIEN-TRUC.md` §2 §3 §7.
 * Hoà chốt 16/08: **sidebar là hệ router toàn app**; ba chặng chỉ là MỘT nhóm stage, không phải
 * trục riêng ⇒ `components/studio/StageSwitcher.tsx` thôi là "trục điều hướng duy nhất".
 *
 * ⚠️ MỘT ĐÍNH CHÍNH SO VỚI BẢNG §1 CỦA HỢP ĐỒNG — nhãn ba chặng.
 * Bảng §1 gọi hai chặng đầu theo lối đảo chữ (kỹ-thuật trước, thiết-kế trước); nhưng chốt 07/08
 * (mục ĐỊNH NGHĨA BA CHẶNG, bản cuối) là **Thiết kế 2D · Thiết kế 3D · Trình chiếu**, và cả hai
 * chỗ đang thi hành đều theo bản cuối: `components/studio/StageSwitcher.tsx` (WIDEST_LABEL) và
 * từ điển máy `scripts/soi-tu-dien.mjs:33-34` — lối đảo chữ kia dùng trong `components/` là BÁO ĐỎ.
 * ⇒ Lấy theo bản cuối. Đây là đổi NHÃN, KHÔNG đổi route — không kéo theo thay đổi nào ở vùng
 * phiên V2, nên không phải ca "chạm biên phải dừng".
 * (Chính dòng này lúc đầu TRÍCH NGUYÊN chuỗi bị cấm để giải thích, và máy soi bắt được ngay —
 *  ghi lại vì nó chứng minh máy soi chạy đúng, kể cả khi người viết đang nói về chính luật đó.)
 */

import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  ListTodo,
  MessagesSquare,
  Folder,
  Library,
  Settings,
  Building2,
  NotebookPen,
  PencilRuler,
  Box,
  Presentation,
  CircleUserRound,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────────────────
   BA NẤC CHI TIẾT = BA CÔNG NĂNG (hợp đồng §5 · bản đồ §7 · CHOT-EXPERIENCE-SYSTEM điều 4)

   52  "tôi đang ở đâu"     — định vị bằng vị trí + hình, KHÔNG chữ (Rail icon-only)
   240 "tôi đi đâu được"    — thêm CHỮ (Context Shelf)
   320 "ở đó đang có gì"    — thêm HÌNH, hoặc TÌNH TRẠNG nếu thứ đó không có hình (Work Panel)

   VÌ SAO 52 (chốt điều 4 cho KHOẢNG 52-56, số chính xác chốt theo token):
   52 = `--tap-lg` 44px (ô chạm LỚN, globals.css:110 — cỡ ngón tay, KHÔNG đổi theo con trỏ)
      + 2 × 4px lề hàng (mỗi hàng rail đã có `margin: 0 4px` sẵn).
   Tức nút icon ở nấc này ăn TRỌN bề ngang 44px = đúng một ô chạm lớn — không số mới nào bịa ra.
   240 GIỮ: đã nằm trong khoảng 220-280 của chốt, đổi là churn không mang tin.
   320 GIỮ min: chốt cho resize tới trần 440 nhưng rail HIỆN CHƯA có cơ chế resize —
   ⛳ NỢ (phiếu riêng): thêm resize kéo tay nấc `duyet` trong khoảng [320, 440].
   ───────────────────────────────────────────────────────────────────────────────────────── */

export const BE_RONG_NAC = { dinhVi: 52, dieuHuong: 240, duyet: 320 } as const;

export type NacRail = keyof typeof BE_RONG_NAC;

/** Thứ tự từ hẹp tới rộng — dùng cho hai nút bước tới/bước lui. */
export const THU_TU_NAC: readonly NacRail[] = ['dinhVi', 'dieuHuong', 'duyet'] as const;

export const NHAN_NAC: Record<NacRail, { vi: string; en: string }> = {
  dinhVi: { vi: 'Định vị', en: 'Locate' },
  dieuHuong: { vi: 'Điều hướng', en: 'Navigate' },
  duyet: { vi: 'Duyệt', en: 'Browse' },
};

/** Bước một nấc chi tiết theo hướng; đã ở đầu/cuối dải thì trả `null` (nơi gọi không vẽ nút). */
export function nacKe(nac: NacRail, huong: 1 | -1): NacRail | null {
  const i = THU_TU_NAC.indexOf(nac);
  const j = i + huong;
  return j >= 0 && j < THU_TU_NAC.length ? THU_TU_NAC[j] : null;
}

/* ───────────────────────────────────────────────────────────────────────────────────────── */

/**
 * BA CỤM (CHOT-EXPERIENCE-SYSTEM điều 3, ĐÈ chốt hai-cụm 16-17/08):
 *   `chung`  — Workspace chung: sống không cần dự án nào.
 *   `duAn`   — cụm ba chặng + hai mục dự án (Dự án này · Sổ tay): chỉ có nghĩa khi mở dự án.
 *              Khoá GIỮ tên `duAn` chứ không đổi thành `chang` vì cụm chứa cả hai mục KHÔNG phải
 *              chặng (du-an-nay · so-tay) — điều kiện sống của cả cụm là "đã mở dự án", đó mới là
 *              bản chất; "ba chặng" là nhãn của chốt, không phải ranh giới kỹ thuật của cụm.
 *   `caNhan` — cá nhân/hệ thống.
 * Khoá cụm KHÔNG persist ở đâu (đo 20/08: localStorage chỉ lưu NẤC `interiorflow.rail.nac_v1`,
 * giá trị là NacRail — không dính CumRail) ⇒ đổi/thêm khoá cụm an toàn, không cần đường nâng cấp.
 */
export type CumRail = 'chung' | 'duAn' | 'caNhan';

/**
 * Nấc 320 của TỪNG mục — "ở đó đang có gì".
 * `khong` bắt buộc kèm `viSao`: bỏ một nấc chi tiết là quyết định thiết kế, phải đọc được lý do
 * ngay tại chỗ, đừng để phiên sau tưởng là bỏ sót rồi đi "bù" cho đủ ba.
 */
export type Mat320 =
  | { kieu: 'tinhTrang'; moTa: string; daNoiNguon: boolean }
  | { kieu: 'hinh'; moTa: string; daNoiNguon: boolean }
  | { kieu: 'khong'; viSao: string };

export interface MucRail {
  id: string;
  vi: string;
  en: string;
  cum: CumRail;
  icon: LucideIcon;
  /** Cụm CHUNG / CÁ NHÂN — đường tuyệt đối, sống không cần dự án nào. */
  duong?: string;
  /** Cụm DỰ ÁN — đuôi sau `/projects/<id>/`; chỉ có nghĩa khi đã mở một dự án. */
  duoi?: string;
  /** Có giá trị = mục hiện MỜ vĩnh viễn, và đây là lý do đọc được (§9 cấm nút giả không lý do). */
  chuaCoTrang?: { vi: string; en: string };
  mat320: Mat320;
}

/**
 * ⛔ KHÔNG lên rail (hợp đồng §1) — Bảng màu là một BƯỚC trong chọn vật liệu · Kho vật liệu là
 * một KỆ của Thư viện · Gallery là mặt tuyển chọn của kệ Ảnh. Ba thứ đó KHÔNG có mục riêng ở đây;
 * ai định thêm vào, đọc §1 trước.
 */
export const MUC_RAIL: readonly MucRail[] = [
  // ── CỤM ① WORKSPACE CHUNG — sống không cần dự án nào (chốt điều 3) ───────────────────────
  {
    id: 'tong-quan',
    vi: 'Tổng quan',
    en: 'Overview',
    cum: 'chung',
    icon: LayoutGrid,
    duong: '/',
    // Hợp đồng §2: tên "Tổng quan" thuộc về Home; hai mặt cùng tên kia đổi thành "Bảng chi tiết"
    // và "Dự án này".
    mat320: {
      kieu: 'khong',
      viSao:
        'Tổng quan CHÍNH LÀ mặt nhìn của app — bày một bản thu nhỏ của nó ngay cạnh nó là nói cùng một điều hai lần.',
    },
  },
  {
    id: 'bang-viec',
    vi: 'Bảng việc',
    en: 'Tasks',
    cum: 'chung',
    icon: ListTodo,
    duong: '/tasks',
    mat320: { kieu: 'tinhTrang', moTa: 'việc tới hạn gần nhất', daNoiNguon: false },
  },
  {
    id: 'chat-hop',
    vi: 'Chat · Họp',
    en: 'Chat · Meetings',
    cum: 'chung',
    icon: MessagesSquare,
    // Hợp đồng §7: có `app/api/chat/route.ts`, KHÔNG có trang. Mục vẫn hiện — ẩn thì người dùng
    // không biết app có gì; nhưng không được là nút bấm-không-ra-gì.
    chuaCoTrang: { vi: 'Chưa có trang — phần này đang dựng', en: 'No page yet — under construction' },
    mat320: { kieu: 'khong', viSao: 'Chưa có trang thì chưa có gì để nhìn.' },
  },
  {
    id: 'files',
    vi: 'Files',
    en: 'Files',
    cum: 'chung',
    icon: Folder,
    duong: '/files',
    // Nguồn nằm trong vùng ghi của phiên V2 (`app/files/**`) ⇒ khai trước, KHÔNG tự nối và
    // tuyệt đối không bịa dữ liệu để nấc 320 trông có vẻ đầy (hợp đồng §8: chạm biên thì dừng).
    mat320: { kieu: 'hinh', moTa: 'thư mục gần đây + ảnh xem trước', daNoiNguon: false },
  },
  {
    id: 'thu-vien',
    vi: 'Thư viện',
    en: 'Library',
    cum: 'chung',
    icon: Library,
    duong: '/library',
    // Hoà nêu đích danh 16/08: "thư viện vật liệu, size to nhất là cột dọc ô tròn vật liệu".
    mat320: { kieu: 'hinh', moTa: 'cột ô tròn vật liệu', daNoiNguon: false },
  },
  // ── CỤM ② DỰ ÁN (ba chặng + hai mục dự án) — chỉ có nghĩa khi đã mở một dự án ────────────
  {
    id: 'du-an-nay',
    vi: 'Dự án này',
    en: 'This project',
    cum: 'duAn',
    icon: Building2,
    duoi: 'overview',
    // Route GIỮ NGUYÊN `/projects/[id]/overview` — đổi route là vỡ deep-link (hợp đồng §2).
    mat320: { kieu: 'tinhTrang', moTa: 'tên bản đang mở', daNoiNguon: true },
  },
  {
    id: 'so-tay',
    vi: 'Sổ tay',
    en: 'Notebook',
    cum: 'duAn',
    icon: NotebookPen,
    duoi: 'notebook',
    mat320: { kieu: 'tinhTrang', moTa: 'ghi chú gần nhất', daNoiNguon: false },
  },
  {
    id: 'thiet-ke-2d',
    vi: 'Thiết kế 2D',
    en: '2D Design',
    cum: 'duAn',
    icon: PencilRuler,
    duoi: 'cad',
    mat320: { kieu: 'tinhTrang', moTa: 'chặng đang dở', daNoiNguon: true },
  },
  {
    id: 'thiet-ke-3d',
    vi: 'Thiết kế 3D',
    en: '3D Design',
    cum: 'duAn',
    icon: Box,
    duoi: 'render',
    mat320: { kieu: 'tinhTrang', moTa: 'chặng đang dở', daNoiNguon: true },
  },
  {
    id: 'trinh-chieu',
    vi: 'Trình chiếu',
    en: 'Presenting',
    cum: 'duAn',
    icon: Presentation,
    duoi: 'present',
    mat320: { kieu: 'tinhTrang', moTa: 'chặng đang dở', daNoiNguon: true },
  },

  // ── CỤM ③ CÁ NHÂN / HỆ THỐNG (chốt điều 3) ───────────────────────────────────────────────
  {
    id: 'ca-nhan',
    vi: 'Cá nhân',
    en: 'Personal',
    cum: 'caNhan',
    icon: CircleUserRound,
    // Trang thật đã có: /settings/avatar (AvatarBuilder, route sống từ trước) — KHÔNG phải nút
    // giả. `mucDangMo` bắt '/settings/avatar' TRƯỚC '/settings' nên hai mục không giẫm nhau.
    duong: '/settings/avatar',
    mat320: {
      kieu: 'khong',
      viSao: 'Trang cá nhân là chỗ SỬA (avatar, hồ sơ) — không có dòng tình trạng nào đáng bày.',
    },
  },
  {
    id: 'cai-dat',
    vi: 'Cài đặt',
    en: 'Settings',
    cum: 'caNhan',
    icon: Settings,
    duong: '/settings',
    mat320: {
      kieu: 'khong',
      // Bản đồ §7 / hợp đồng §5 nêu ĐÍCH DANH Cài đặt làm ví dụ cho luật "bỏ nấc khi không có gì
      // để nhìn". Giữ nấc 320 ở đây là ca kéo dãn mẫu.
      viSao: 'Cài đặt không có gì để NHÌN — chỉ có thứ để đọc và bấm; nấc rộng chỉ làm chữ xa nhau ra.',
    },
  },
] as const;

export const NHAN_CUM: Record<CumRail, { vi: string; en: string }> = {
  chung: { vi: 'Workspace chung', en: 'Shared workspace' },
  duAn: { vi: 'Dự án', en: 'Project' },
  caNhan: { vi: 'Cá nhân', en: 'Personal' },
};

/** Thứ tự vẽ ba cụm — ba "đảo dọc" cùng một trục (chốt điều 3). */
export const THU_TU_CUM: readonly CumRail[] = ['chung', 'duAn', 'caNhan'] as const;

/** Đường đi thật của một mục — `null` khi mục chưa dùng được (chưa có trang / chưa mở dự án). */
/** Đường tới chỗ MỞ/TẠO dự án — Home tự bung hộp khởi tạo khi thấy tham số này. */
export const DUONG_MO_DU_AN = '/?mo=du-an';

export function duongCua(muc: MucRail, duAnId: string | null): string | null {
  if (muc.chuaCoTrang) return null;
  if (muc.cum !== 'duAn') return muc.duong ?? null;
  // ⚠️ CHƯA CÓ DỰ ÁN THÌ VẪN TRẢ ĐƯỜNG — dẫn về chỗ tạo, KHÔNG trả null.
  //
  // Trước 05/09 chỗ này trả `null` ⇒ cả năm mục chặng (Dự án này · Sổ tay · 2D · 3D · Trình
  // chiếu) thành nút `aria-disabled`, bấm không ra gì. Chủ dự án mở bản cài lần đầu, chưa có
  // dự án nào, gặp đúng năm nút chết — báo "app không chạy được chặng". Đo lại trên app thật:
  // cả 5 đều `aria-disabled="true"`, không href.
  //
  // Trái LUẬT X2 (00-CHOT 03/08): "KHÔNG màn nào được chặn vì chưa làm bước trước — chặng trống
  // hiện empty state LÀM ĐƯỢC VIỆC tại chỗ". Nút chết còn tệ hơn màn trống: nó không nói được
  // phải làm gì tiếp.
  //
  // Nay: chưa có dự án ⇒ bấm chặng là về Home và BUNG SẴN hộp tạo dự án. Một cú bấm ra đúng
  // việc người dùng đang muốn, thay vì một cú bấm vào hư không.
  return duAnId ? `/projects/${duAnId}/${muc.duoi}` : DUONG_MO_DU_AN;
}

/**
 * Mục nào đang mở, suy từ đường hiện tại.
 *
 * `/materials` và `/colors` cùng sáng ở **Thư viện**: hợp đồng §1 khai chúng là KỆ và BƯỚC bên
 * trong Thư viện, không phải mục rail. Hai route đó còn đứng riêng cho tới khi phiên V2 gộp
 * xong; tới lúc ấy hai dòng này tự thành thừa và xoá được mà không đụng gì khác.
 */
export function mucDangMo(duong: string | null | undefined): string | null {
  if (!duong) return null;
  if (duong === '/') return 'tong-quan';
  if (duong.startsWith('/tasks')) return 'bang-viec';
  if (duong.startsWith('/files')) return 'files';
  if (duong.startsWith('/library') || duong.startsWith('/materials') || duong.startsWith('/colors')) return 'thu-vien';
  // Avatar là trang của mục CÁ NHÂN — bắt TRƯỚC nhánh '/settings' chung, kẻo cả hai cùng sáng.
  if (duong.startsWith('/settings/avatar')) return 'ca-nhan';
  if (duong.startsWith('/settings')) return 'cai-dat';

  const duAn = /^\/projects\/[^/]+\/([^/?#]+)/.exec(duong);
  if (duAn) {
    const found = MUC_RAIL.find((m) => m.cum === 'duAn' && m.duoi === duAn[1]);
    if (found) return found.id;
  }
  return null;
}

/**
 * Lý do một mục hiện MỜ — `null` nghĩa là dùng được.
 *
 * Lý do PHẢI đọc được và phải tới được bằng bàn phím: đường đi là `aria-disabled` +
 * `aria-describedby`, KHÔNG phải `title`. Bài học đo được 16/08 (`ToolbarChip.tsx:24-37`):
 * `<button disabled>` bị Tab bỏ qua hẳn và `title=` câm trên cảm ứng ⇒ đúng cái nút cần giải
 * thích nhất lại là cái mất sạch kênh giải thích.
 */
export function lyDoMo(muc: MucRail): { vi: string; en: string } | null {
  // CHỈ mục THẬT SỰ chưa có trang mới bị tắt. "Chưa mở dự án" KHÔNG còn là lý do tắt — nó là
  // GỢI Ý đi kèm một đường dẫn sống (xem `goiYCua` + `duongCua`), vì nút chết không nói được
  // phải làm gì tiếp; nó chỉ bảo người dùng rằng họ đã sai ở đâu đó.
  if (muc.chuaCoTrang) return muc.chuaCoTrang;
  return null;
}

/**
 * Gợi ý đi kèm mục CÒN BẤM ĐƯỢC — khác hẳn `lyDoMo` (lý do TẮT).
 *
 * Ranh giới, để lần sau không lẫn: `lyDoMo` = "bấm cũng không ra gì, và đây là vì sao";
 * `goiYCua` = "bấm được, và đây là điều sẽ xảy ra". Trước 05/09 hai thứ này bị gộp làm một,
 * nên "chưa mở dự án" — vốn chỉ là một trạng thái tạm — lại đi tắt mất năm mục chặng.
 */
export function goiYCua(muc: MucRail, daMoDuAn: boolean): { vi: string; en: string } | null {
  if (muc.cum === 'duAn' && !daMoDuAn && !muc.chuaCoTrang) {
    return {
      vi: 'Chưa có dự án nào — bấm để tạo dự án rồi vào chặng này',
      en: 'No project yet — click to create one, then enter this stage',
    };
  }
  return null;
}

/** Mục có bày thêm gì ở nấc 320 hay không (dùng cả ở component lẫn ở test). */
export function co320(muc: MucRail): boolean {
  return muc.mat320.kieu !== 'khong';
}
