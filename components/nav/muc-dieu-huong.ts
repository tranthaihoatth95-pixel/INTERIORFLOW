/**
 * components/nav/muc-dieu-huong.ts — [marker: railHaiCum] BẢNG KHAI của rail điều hướng.
 *
 * Vì sao tách khỏi component: đây là phần DUY NHẤT kiểm được bằng máy (đường đi · mục đang mở ·
 * lý do mờ · nấc chi tiết nào có gì để nhìn). Để chung trong `.tsx` thì muốn kiểm phải dựng DOM.
 *
 * NGUỒN CẤU TRÚC — `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §1 (hai cụm) · §5 (ba nấc chi tiết =
 * ba công năng) · §6 (ràng buộc chung). Bản đồ: `docs/IF-KIEN-TRUC.md` §2 §3 §7.
 * Hoà chốt 16/08: **sidebar là hệ router toàn app**; ba chặng chỉ là MỘT nhóm stage, không phải
 * trục riêng ⇒ `components/studio/StageSwitcher.tsx` thôi là "trục điều hướng duy nhất".
 *
 * ⚠️ MỘT ĐÍNH CHÍNH SO VỚI BẢNG §1 CỦA HỢP ĐỒNG — nhãn ba chặng.
 * Hợp đồng §1 ghi "2D Kỹ thuật · 3D Thiết kế"; nhưng chốt 07/08 (mục ĐỊNH NGHĨA BA CHẶNG, bản
 * cuối) là **Thiết kế 2D · Thiết kế 3D · Trình chiếu**, và cả hai chỗ đang thi hành đều theo bản
 * cuối: `components/studio/StageSwitcher.tsx:48-52` (WIDEST_LABEL) và từ điển máy
 * (`scripts/soi-tu-dien.mjs:33-34` — dùng chuỗi "2D Kỹ thuật" trong `components/` bị BÁO ĐỎ).
 * ⇒ Lấy theo bản cuối. Đây là đổi NHÃN, KHÔNG đổi route — không kéo theo thay đổi nào ở vùng
 * phiên V2, nên không phải ca "chạm biên phải dừng".
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
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────────────────
   BA NẤC CHI TIẾT = BA CÔNG NĂNG (hợp đồng §5 · bản đồ §7)

   28  "tôi đang ở đâu"     — định vị bằng vị trí + hình, KHÔNG chữ
   240 "tôi đi đâu được"    — thêm CHỮ
   320 "ở đó đang có gì"    — thêm HÌNH, hoặc TÌNH TRẠNG nếu thứ đó không có hình

   ⛔ Ba nấc chi tiết là một NHỊP, không phải HẠN NGẠCH: mục nào không có gì để nhìn ở 320 thì
   BỎ nấc đó cho riêng mục ấy (`mat320.kieu === 'khong'` + lý do đọc được). Giữ lại một nấc chỉ
   to hơn mà không mang thêm tin chính là "kéo dãn" — thứ Hoà bác thẳng 16/08.
   ───────────────────────────────────────────────────────────────────────────────────────── */

export const BE_RONG_NAC = { dinhVi: 28, dieuHuong: 240, duyet: 320 } as const;

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

export type CumRail = 'xuong' | 'duAn';

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
  /** Cụm XƯỞNG — đường tuyệt đối, sống không cần dự án nào. */
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
  // ── CỤM XƯỞNG — sống không cần dự án nào ─────────────────────────────────────────────────
  {
    id: 'tong-quan',
    vi: 'Tổng quan',
    en: 'Overview',
    cum: 'xuong',
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
    cum: 'xuong',
    icon: ListTodo,
    duong: '/tasks',
    mat320: { kieu: 'tinhTrang', moTa: 'việc tới hạn gần nhất', daNoiNguon: false },
  },
  {
    id: 'chat-hop',
    vi: 'Chat · Họp',
    en: 'Chat · Meetings',
    cum: 'xuong',
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
    cum: 'xuong',
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
    cum: 'xuong',
    icon: Library,
    duong: '/library',
    // Hoà nêu đích danh 16/08: "thư viện vật liệu, size to nhất là cột dọc ô tròn vật liệu".
    mat320: { kieu: 'hinh', moTa: 'cột ô tròn vật liệu', daNoiNguon: false },
  },
  {
    id: 'cai-dat',
    vi: 'Cài đặt',
    en: 'Settings',
    cum: 'xuong',
    icon: Settings,
    duong: '/settings',
    mat320: {
      kieu: 'khong',
      // Bản đồ §7 / hợp đồng §5 nêu ĐÍCH DANH Cài đặt làm ví dụ cho luật "bỏ nấc khi không có gì
      // để nhìn". Giữ nấc 320 ở đây là ca kéo dãn mẫu.
      viSao: 'Cài đặt không có gì để NHÌN — chỉ có thứ để đọc và bấm; nấc rộng chỉ làm chữ xa nhau ra.',
    },
  },

  // ── CỤM DỰ ÁN — chỉ có nghĩa khi đã mở một dự án ─────────────────────────────────────────
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
] as const;

export const NHAN_CUM: Record<CumRail, { vi: string; en: string }> = {
  xuong: { vi: 'Xưởng', en: 'Studio' },
  duAn: { vi: 'Dự án', en: 'Project' },
};

/** Đường đi thật của một mục — `null` khi mục chưa dùng được (chưa có trang / chưa mở dự án). */
export function duongCua(muc: MucRail, duAnId: string | null): string | null {
  if (muc.chuaCoTrang) return null;
  if (muc.cum === 'xuong') return muc.duong ?? null;
  return duAnId ? `/projects/${duAnId}/${muc.duoi}` : null;
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
export function lyDoMo(muc: MucRail, daMoDuAn: boolean): { vi: string; en: string } | null {
  if (muc.chuaCoTrang) return muc.chuaCoTrang;
  if (muc.cum === 'duAn' && !daMoDuAn) {
    return {
      vi: 'Chưa mở dự án — chọn một dự án ở Tổng quan',
      en: 'No project open — pick one from Overview',
    };
  }
  return null;
}

/** Mục có bày thêm gì ở nấc 320 hay không (dùng cả ở component lẫn ở test). */
export function co320(muc: MucRail): boolean {
  return muc.mat320.kieu !== 'khong';
}
