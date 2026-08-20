/**
 * components/nav/muc-dieu-huong.ts — [marker: railHaiCum] BẢNG KHAI của rail điều hướng.
 * (Marker GIỮ NGUYÊN chuỗi `railHaiCum` làm ĐỊNH DANH ổn định qua mọi lần đổi cấu trúc — hai cụm
 *  16/08 → ba cụm 20/08 → HAI ĐẢO 20/08. Đổi chuỗi marker là vỡ mọi con trỏ trong phiếu/nhật ký
 *  cũ; tên marker là khoá kỹ thuật, không phải nhãn. Đừng "sửa cho khớp".)
 *
 * Vì sao tách khỏi component: đây là phần DUY NHẤT kiểm được bằng máy (đường đi · mục đang mở ·
 * lý do mờ · nấc chi tiết nào có gì để nhìn). Để chung trong `.tsx` thì muốn kiểm phải dựng DOM.
 *
 * 🔴 NGUỒN CẤU TRÚC HIỆN HÀNH — **Hoà chốt 20/08 (đợt NAV-HAI-DAO)**: thanh trái CHỈ CÒN VIỆC,
 * dựng thành **HAI ĐẢO DỌC**:
 *   ĐẢO A · XƯỞNG/VIỆC  — Trang chủ · Dự án · Files · Thư viện · Soát duyệt
 *   ĐẢO B · CHẶNG        — Thiết kế 2D · Thiết kế 3D · Trình chiếu   (ổn định, dễ với tới, quen tay)
 * Hai đảo tách bằng KHOẢNG THỞ CÓ NGHĨA, ⛔ không gộp thành một menu dài.
 * Thanh trái trả lời đúng hai câu: *tôi đang làm việc ở đâu* · *tôi đang ở chặng nào*.
 * ⛔ **Cá nhân/Cộng tác/Hệ thống RỜI KHỎI thanh trái** — Hồ sơ · Credit · Cài đặt · Tài khoản ·
 * Đăng xuất nay sống trong MENU ẢNH ĐẠI DIỆN ở cụm phải-trên
 * (`components/studio/CumPhaiTren.tsx` + `components/AccountMenu.tsx`). Hoà nêu thẳng đây là
 * TIÊU CHÍ TRƯỢT: *"trượt nếu thanh trái còn chứa Hồ sơ/Credit/Cài đặt"* ⇒ ai định thêm lại một
 * mục Cá nhân/Cài đặt vào bảng này, đọc dòng này trước; test [2] chặn cứng.
 *
 * ĐÈ CHỐT NÀO: "BA CỤM" của `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` điều 3 (Workspace chung ·
 * ba chặng · cá nhân/hệ thống) — bản đó tự nó đã ĐÈ "hai cụm" 16-17/08, và nay bị đè tiếp: cụm
 * cá nhân/hệ thống KHÔNG còn là đảo thứ ba trên trục dọc, nó chuyển sang trục phải-trên.
 * Điều 4 của cùng chốt (ba độ sâu: Rail 52-56 · Context Shelf 220-280 · Work Panel 320-440)
 * GIỮ NGUYÊN, không đụng. Nền cũ vẫn đúng phần ràng buộc:
 * `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §5 (ba nấc chi tiết = ba công năng) · §6 (ràng buộc
 * chung). Bản đồ: `docs/IF-KIEN-TRUC.md` §2 §3 §7.
 * Hoà chốt 16/08 (VẪN ĐÚNG): **sidebar là hệ router toàn app** ⇒
 * `components/studio/StageSwitcher.tsx` thôi là "trục điều hướng duy nhất". Nhưng câu "ba chặng
 * chỉ là MỘT nhóm stage ngang hàng Files/Thư viện" nay ĐƯỢC LÀM RÕ: ba chặng là ĐẢO RIÊNG, tách
 * bằng khoảng thở — ngang hàng về trục, KHÔNG trộn vào cùng một danh sách.
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
  Folder,
  Library,
  ShieldCheck,
  Building2,
  PencilRuler,
  Box,
  Presentation,
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
 * HAI ĐẢO DỌC (Hoà chốt 20/08 — ĐÈ ba cụm):
 *   `viec`  — ĐẢO A, XƯỞNG/VIỆC: *tôi đang làm việc ở đâu*.
 *   `chang` — ĐẢO B, CHẶNG: *tôi đang ở chặng nào*. Đúng ba mục, không hơn — đảo này phải ỔN
 *             ĐỊNH và QUEN TAY, thêm mục vào đây là làm mất tính đoán-trước của nó.
 * Đảo thứ ba (cá nhân/hệ thống) KHÔNG còn — nó sang cụm phải-trên. Xem docstring đầu file.
 *
 * ĐỔI KHOÁ CÓ AN TOÀN KHÔNG — đo trước khi đổi, không đoán: `grep -rn "CumRail\|'chung'\|'caNhan'"`
 * chỉ ra `CumRail` sống trong đúng ba tệp `components/nav/**`, và localStorage của rail chỉ có
 * MỘT khoá `interiorflow.rail.nac_v1` lưu **NacRail** (`RailDieuHuong.tsx:71`) — không khoá nào
 * lưu CumRail. ⇒ đổi `chung|duAn|caNhan` → `viec|chang` KHÔNG vỡ dữ liệu đã ghi, không cần
 * đường nâng cấp. (Nấc chi tiết vẫn nhớ nguyên như cũ.)
 */
export type CumRail = 'viec' | 'chang';

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
  /** Đường tuyệt đối, sống không cần dự án nào. */
  duong?: string;
  /**
   * Đuôi sau `/projects/<id>/` — mục CHỈ có nghĩa khi đã mở một dự án.
   * Điều kiện "cần dự án" nay đọc từ CHÍNH trường này chứ không suy từ cụm: đảo VIỆC có cả mục
   * cần dự án (Dự án) lẫn mục không cần (Files · Thư viện), nên lấy cụm làm điều kiện là sai.
   */
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
  // ── ĐẢO A · XƯỞNG/VIỆC — "tôi đang làm việc ở đâu" ───────────────────────────────────────
  {
    id: 'trang-chu',
    vi: 'Trang chủ',
    en: 'Home',
    cum: 'viec',
    icon: LayoutGrid,
    duong: '/',
    mat320: {
      kieu: 'khong',
      viSao:
        'Trang chủ CHÍNH LÀ mặt nhìn của app — bày một bản thu nhỏ của nó ngay cạnh nó là nói cùng một điều hai lần.',
    },
  },
  {
    id: 'du-an',
    vi: 'Dự án',
    en: 'Project',
    cum: 'viec',
    icon: Building2,
    // Route GIỮ NGUYÊN `/projects/[id]/overview` — đổi route là vỡ deep-link (hợp đồng §2).
    // KHÔNG có route danh sách dự án riêng (đo 20/08: `app/projects/` chỉ có `[id]`; gallery
    // chọn dự án sống BÊN TRONG `/` qua `ProjectSelect`) ⇒ mục này trỏ vào dự án ĐANG MỞ, chưa
    // mở thì mờ kèm lý do chỉ đúng chỗ chọn dự án. Không bịa route `/projects`.
    duoi: 'overview',
    mat320: { kieu: 'tinhTrang', moTa: 'tên bản đang mở', daNoiNguon: true },
  },
  {
    id: 'files',
    vi: 'Files',
    en: 'Files',
    cum: 'viec',
    icon: Folder,
    duong: '/files',
    // Nguồn nằm trong vùng ghi của phiên khác (`app/files/**`) ⇒ khai trước, KHÔNG tự nối và
    // tuyệt đối không bịa dữ liệu để nấc 320 trông có vẻ đầy (hợp đồng §8: chạm biên thì dừng).
    mat320: { kieu: 'hinh', moTa: 'thư mục gần đây + ảnh xem trước', daNoiNguon: false },
  },
  {
    id: 'thu-vien',
    vi: 'Thư viện',
    en: 'Library',
    cum: 'viec',
    icon: Library,
    duong: '/library',
    // Hoà nêu đích danh 16/08: "thư viện vật liệu, size to nhất là cột dọc ô tròn vật liệu".
    mat320: { kieu: 'hinh', moTa: 'cột ô tròn vật liệu', daNoiNguon: false },
  },
  {
    id: 'soat-duyet',
    vi: 'Soát duyệt',
    en: 'Review',
    cum: 'viec',
    icon: ShieldCheck,
    // ⚠️ LÝ DO THẬT, đo tại nguồn 20/08 — KHÔNG phải "chưa làm": động cơ soát duyệt ĐANG CHẠY
    // (`lib/review/` + `components/review/ReviewPanel.tsx`), nhưng nó mount ở MÉP PHẢI của
    // AppShell (`AppShell.tsx:192`) theo luật "một chỗ ngồi cố định" — không có route riêng để
    // rail trỏ tới. Mở nó bằng tay cầm `PanelFlank` ở mép phải.
    // ⛳ NỢ (phiếu riêng, chạm `components/ui/PanelFlank.tsx` — ngoài vùng ghi đợt này): cho
    // PanelFlank nhận một sự kiện mở, rồi mục này bấm được thay vì mờ.
    chuaCoTrang: {
      vi: 'Chưa có trang riêng — bảng soát duyệt ở mép phải mỗi chặng',
      en: 'No page of its own — the review panel sits on each stage right edge',
    },
    mat320: { kieu: 'khong', viSao: 'Chưa có trang riêng thì rail chưa có gì để bày thay cho nó.' },
  },

  // ── ĐẢO B · CHẶNG — "tôi đang ở chặng nào". ĐÚNG BA MỤC: ổn định, dễ với tới, quen tay ────
  {
    id: 'thiet-ke-2d',
    vi: 'Thiết kế 2D',
    en: '2D Design',
    cum: 'chang',
    icon: PencilRuler,
    duoi: 'cad',
    mat320: { kieu: 'tinhTrang', moTa: 'chặng đang dở', daNoiNguon: true },
  },
  {
    id: 'thiet-ke-3d',
    vi: 'Thiết kế 3D',
    en: '3D Design',
    cum: 'chang',
    icon: Box,
    duoi: 'render',
    mat320: { kieu: 'tinhTrang', moTa: 'chặng đang dở', daNoiNguon: true },
  },
  {
    id: 'trinh-chieu',
    vi: 'Trình chiếu',
    en: 'Presenting',
    cum: 'chang',
    icon: Presentation,
    duoi: 'present',
    mat320: { kieu: 'tinhTrang', moTa: 'chặng đang dở', daNoiNguon: true },
  },
] as const;

export const NHAN_CUM: Record<CumRail, { vi: string; en: string }> = {
  viec: { vi: 'Việc', en: 'Work' },
  chang: { vi: 'Chặng', en: 'Stages' },
};

/** Thứ tự vẽ HAI ĐẢO trên cùng một trục dọc — việc trước, chặng sau (Hoà chốt 20/08). */
export const THU_TU_CUM: readonly CumRail[] = ['viec', 'chang'] as const;

/** Đường đi thật của một mục — `null` khi mục chưa dùng được (chưa có trang / chưa mở dự án). */
export function duongCua(muc: MucRail, duAnId: string | null): string | null {
  if (muc.chuaCoTrang) return null;
  // Điều kiện đọc từ `duoi`, KHÔNG từ cụm: đảo VIỆC trộn cả mục cần dự án (Dự án) lẫn mục không
  // cần (Files · Thư viện) ⇒ lấy cụm làm điều kiện sẽ khoá nhầm nửa đảo.
  if (!muc.duoi) return muc.duong ?? null;
  return duAnId ? `/projects/${duAnId}/${muc.duoi}` : null;
}

/**
 * Mục nào đang mở, suy từ đường hiện tại.
 *
 * `/materials` và `/colors` cùng sáng ở **Thư viện**: hợp đồng §1 khai chúng là KỆ và BƯỚC bên
 * trong Thư viện, không phải mục rail. Hai route đó còn đứng riêng cho tới khi phiên V2 gộp
 * xong; tới lúc ấy hai dòng này tự thành thừa và xoá được mà không đụng gì khác.
 *
 * ⚠️ `/settings`, `/settings/avatar`, `/tasks`, `/projects/<id>/notebook` nay trả **null** — CÓ Ý,
 * không phải bỏ sót: bốn route đó vẫn sống, nhưng KHÔNG còn mục nào trên thanh trái đại diện cho
 * chúng (Cài đặt/Hồ sơ sang menu ảnh đại diện; Bảng việc/Sổ tay rời rail theo chốt hai đảo).
 * Trả về id của một mục không tồn tại thì rail sẽ sáng nhầm hoặc không sáng gì — null là đúng.
 */
export function mucDangMo(duong: string | null | undefined): string | null {
  if (!duong) return null;
  if (duong === '/') return 'trang-chu';
  if (duong.startsWith('/files')) return 'files';
  if (duong.startsWith('/library') || duong.startsWith('/materials') || duong.startsWith('/colors')) return 'thu-vien';

  const duAn = /^\/projects\/[^/]+\/([^/?#]+)/.exec(duong);
  if (duAn) {
    const found = MUC_RAIL.find((m) => m.duoi === duAn[1]);
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
  if (muc.duoi && !daMoDuAn) {
    return {
      vi: 'Chưa mở dự án — chọn một dự án ở Trang chủ',
      en: 'No project open — pick one from Home',
    };
  }
  return null;
}

/** Mục có bày thêm gì ở nấc 320 hay không (dùng cả ở component lẫn ở test). */
export function co320(muc: MucRail): boolean {
  return muc.mat320.kieu !== 'khong';
}
