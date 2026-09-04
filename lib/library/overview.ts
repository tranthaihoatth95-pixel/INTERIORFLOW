/**
 * lib/library/overview.ts — TRANG TỔNG THƯ VIỆN: mục nào, đếm gì, dẫn đi đâu. THUẦN, có test.
 *
 * NGUỒN CHỐT: `docs/00-CHOT.md` [10/08 Hoà chốt] "Master Library có 2 mặt: TRANG TỔNG là
 * gallery/collection; trong mỗi chặng là sidebar tự lọc theo ngữ cảnh" + [16/08] "KHÔNG có thư
 * viện vật liệu riêng — chỉ MỘT Master Library; vật liệu là một KỆ, màu là một BƯỚC". Đo 02/09:
 * mặt thứ hai (tấm `LibrarySheet`) đã có; mặt TRANG TỔNG có 0 dòng mã — `/library` chỉ là redirect
 * bật về trang trước, nên bấm "Thư viện" trên rail điều hướng là bị đẩy ngược lại. File này là
 * bảng khai của mặt còn thiếu; UI ở `components/library/LibraryOverview.tsx` chỉ VẼ theo nó.
 *
 * ⚠️ Chốt 03/08 "Thư viện là sheet, không có trang /library" bị chốt 10/08 ĐÈ ở đúng điểm
 * "trang tổng" — tấm vẫn là nơi KÉO-THẢ, trang tổng là nơi ĐỨNG NHÌN toàn kho (đúng vai của mục
 * rail "Thư viện" 16/08). Không đẻ kho mới: mọi số ở đây đọc từ kho ĐÃ CÓ (`LibraryAsset` qua
 * `db-items.ts`, `idfc-store`, block built-in, Thẻ DNA per-project, Kho tri thức `knowledge.ts`).
 *
 * LUẬT §9 (00-BAT-DAU-DOC-DAY): ô chưa có mã (Collection+) VẪN HIỆN, mờ kèm lý do — ô trống là
 * bằng chứng còn việc, cấm xoá cho gọn mắt, cấm nút giả bấm không ra gì.
 */

import { BAY_OF_SHELF, builtinCount, type SheetItem } from './shelves';
import type { StageKey } from './types';
import { IDFC_KIND_LABEL } from './thumb-kinds';
import { object3dModelForName } from './object-3d-models';
import type { IdfcKind } from '../cad/idfc';
import type { KnowledgeStats } from './knowledge';

export type OverviewSectionId =
  | 'bo-suu-tap' // Collection+
  | 'cau-kien' // .idfc
  | 'vat-lieu'
  | 'anh-tai-san'
  | 'ky-hieu-2d'
  | 'mo-hinh-3d'
  | 'mau-ho-so'
  | 'the-dna'
  | 'files'
  | 'tri-thuc';

/** Hành động chính của một mục — ba kiểu, kiểu `khong` BẮT BUỘC kèm lý do đọc được. */
export type HanhDong =
  | { kieu: 'route'; href: string }
  | { kieu: 'sheet'; shelfId: string; stage?: StageKey }
  | { kieu: 'khong'; lyDo: [string, string] };

export interface OverviewSectionDef {
  id: OverviewSectionId;
  label: [string, string];
  moTa: [string, string];
  chinh: HanhDong;
  /** Đường thứ hai (vd Gallery đứng cạnh kệ Ảnh) — tuỳ chọn. */
  phu?: { label: [string, string]; hanhDong: HanhDong };
  /** Câu khi kho RỖNG — chỉ khai khi đường nạp KHÁC câu chung "nhập từ Files hoặc tấm Thư viện". */
  trong?: [string, string];
}

/** THỨ TỰ ĐỌC = thứ tự dòng chảy của vật (`IF-KIEN-TRUC.md` §5): thô → định nghĩa → dùng lại. */
export const OVERVIEW_SECTIONS: readonly OverviewSectionDef[] = [
  {
    id: 'files',
    label: ['Files', 'Files'],
    moTa: ['Tệp thô của dự án + phần thô dùng chung — đầu vào của dòng chảy.', 'Raw project files + shared raw inputs — where the flow starts.'],
    chinh: { kieu: 'route', href: '/files' },
    phu: { label: ['Nhập tài sản', 'Ingest assets'], hanhDong: { kieu: 'route', href: '/library/ingest' } },
  },
  {
    id: 'cau-kien',
    label: ['Cấu kiện (.idfc)', 'Components (.idfc)'],
    moTa: ['Một tệp = một cấu kiện, ba chặng đọc ba mặt của nó.', 'One file = one component; all three stages read it.'],
    chinh: { kieu: 'sheet', shelfId: 'common-idfc' },
    trong: ['Kho trống — nhập tệp .idfc qua tấm Thư viện', 'Empty — import .idfc files via the Library sheet'],
  },
  {
    id: 'vat-lieu',
    label: ['Vật liệu', 'Materials'],
    moTa: ['Một matId cho 2D · 3D · bảng vật liệu; màu là một bước lọc trong kệ này.', 'One matId for 2D · 3D · boards; colour is a filter step inside this shelf.'],
    chinh: { kieu: 'sheet', shelfId: 'common-atlas' },
    phu: { label: ['Kho vật liệu', 'Material store'], hanhDong: { kieu: 'route', href: '/materials' } },
  },
  {
    id: 'anh-tai-san',
    label: ['Ảnh & tài sản', 'Images & assets'],
    moTa: ['Ảnh tham chiếu có nguồn và giấy phép; Gallery là mặt tuyển chọn của kệ này.', 'Sourced, licensed reference imagery; Gallery is the curated face of this shelf.'],
    chinh: { kieu: 'sheet', shelfId: 'common-asset' },
    phu: { label: ['Gallery', 'Gallery'], hanhDong: { kieu: 'route', href: '/library/gallery' } },
  },
  {
    id: 'ky-hieu-2d',
    label: ['Ký hiệu · mặt bằng 2D', '2D symbols · plans'],
    moTa: ['Khối ký hiệu bản vẽ (cửa, thiết bị, đồ đạc) kéo thẳng vào Thiết kế 2D.', 'Drawing blocks (doors, fixtures, furniture) dragged straight into 2D Design.'],
    chinh: { kieu: 'sheet', shelfId: 'cad-kyhieu', stage: 'cad' },
  },
  {
    id: 'mo-hinh-3d',
    label: ['Mô hình 3D', '3D models'],
    moTa: ['Món có hình học xem được trong cửa sổ 3D — tải hình học khi mở, không tải trước.', 'Items with viewable geometry — loaded on open, never up front.'],
    chinh: { kieu: 'sheet', shelfId: 'common-asset' },
  },
  {
    id: 'mau-ho-so',
    label: ['Mẫu bản vẽ · hồ sơ', 'Drawing & document templates'],
    moTa: ['Khung tên, mẫu trang, bảng vật liệu A3, biểu mẫu dự toán, mẫu video.', 'Title blocks, page templates, A3 material boards, BOQ forms, video templates.'],
    chinh: { kieu: 'sheet', shelfId: 'present-page', stage: 'present' },
  },
  {
    id: 'the-dna',
    label: ['Thẻ DNA Thiết kế', 'Design DNA cards'],
    moTa: ['Gu của từng phương án, 8 trục có nguồn — nuôi moodboard, Grounded Render, dàn ý deck.', 'Per-scheme design DNA, 8 sourced layers — feeds moodboards, Grounded Render, deck outlines.'],
    chinh: { kieu: 'route', href: '/' },
    trong: ['Chưa có thẻ — tạo trong Dự án này › Thẻ DNA', 'No cards yet — create one in This project › Design DNA'],
  },
  {
    id: 'tri-thuc',
    label: ['Kho tri thức', 'Knowledge base'],
    moTa: ['Quy chuẩn ngành + tài liệu dự án ở dạng máy đọc được, mỗi mục có nguồn và ngày hiệu lực.', 'Industry standards + project documents in machine-usable form, each with source and effective date.'],
    chinh: { kieu: 'route', href: '/library/knowledge' },
  },
  {
    id: 'bo-suu-tap',
    label: ['Collection+', 'Collection+'],
    moTa: ['Gói component chưng cất cấp studio (vật liệu · furniture · chi tiết điển hình · cách làm).', 'Studio-level distilled packages (materials · furniture · typical details · know-how).'],
    // Đo 02/09: `grep -rniE "collection\\+|COL-" lib components app` = 0 dòng mã. Chốt 17/08 mới ở
    // mức mock Files hai tầng. Hiện mờ kèm lý do — không giả bằng nút chết (§9).
    chinh: { kieu: 'khong', lyDo: ['Chưa có mã — chốt 17/08 mới ở mức bản vẽ Files hai tầng', 'No code yet — the 17/08 decision only exists as the two-tier Files mock'] },
  },
];

export type TrangThaiMuc = 'dangTai' | 'song' | 'trong' | 'chuaNoi';

export interface OverviewThumb {
  id: string;
  url: string;
  name: string;
}

export interface OverviewSection extends OverviewSectionDef {
  /** `null` = mục không có số (route thuần) hoặc chưa tải. */
  count: number | null;
  trangThai: TrangThaiMuc;
  /** Dòng chi tiết mono, vd "Đồ rời 3 · Vật liệu 2" — KHÔNG bịa, chỉ từ dữ liệu đã đếm. */
  chiTiet: [string, string][];
  /** Tối đa 4 ảnh xem trước — metadata/thumb trước, hình học nặng để dành lúc mở (luật slice). */
  thumbs: OverviewThumb[];
}

export interface OverviewInput {
  /** `/api/library` đã trả lời (kể cả rỗng) — trước đó các mục DB hiện "đang tải". */
  daTaiKho: boolean;
  items: readonly SheetItem[];
  idfcKinds: readonly IdfcKind[];
  /** `null` = chưa tải xong danh sách dự án/Thẻ DNA. */
  dna: { soThe: number; soDuAn: number } | null;
  knowledge: KnowledgeStats | null;
}

const MAU_SHELVES = new Set(Object.entries(BAY_OF_SHELF).filter(([, bay]) => bay === 'mau').map(([id]) => id));

function thumbsOf(items: readonly SheetItem[], max = 4): OverviewThumb[] {
  const out: OverviewThumb[] = [];
  for (const it of items) {
    if (!it.imageUrl) continue;
    out.push({ id: it.id, url: it.imageUrl, name: it.name });
    if (out.length >= max) break;
  }
  return out;
}

function trangThaiTheoSo(daTai: boolean, count: number): TrangThaiMuc {
  if (!daTai) return 'dangTai';
  return count > 0 ? 'song' : 'trong';
}

/** Đếm cấu kiện theo loại, giữ thứ tự loại chuẩn của `.idfc`, bỏ loại 0. */
export function idfcKindBreakdown(kinds: readonly IdfcKind[]): [string, string][] {
  const counts = new Map<IdfcKind, number>();
  for (const k of kinds) counts.set(k, (counts.get(k) ?? 0) + 1);
  return (Object.keys(IDFC_KIND_LABEL) as IdfcKind[])
    .filter((k) => (counts.get(k) ?? 0) > 0)
    .map((k) => [`${IDFC_KIND_LABEL[k][0]} ${counts.get(k)}`, `${IDFC_KIND_LABEL[k][1]} ${counts.get(k)}`]);
}

export function buildLibraryOverview(input: OverviewInput): OverviewSection[] {
  const { daTaiKho, items } = input;
  const vatLieu = items.filter((i) => i.shelfId === 'common-atlas');
  const anh = items.filter((i) => i.shelfId === 'common-asset');
  const kyHieuDb = items.filter((i) => i.shelfId === 'cad-kyhieu');
  const moHinh3d = items.filter((i) => object3dModelForName(i.name) !== null);
  const mau = items.filter((i) => MAU_SHELVES.has(i.shelfId));
  const kyHieuBuiltin = builtinCount('cad-kyhieu');

  return OVERVIEW_SECTIONS.map((def): OverviewSection => {
    switch (def.id) {
      case 'files':
        return { ...def, count: null, trangThai: 'song', chiTiet: [], thumbs: [] };
      case 'cau-kien': {
        const n = input.idfcKinds.length;
        return { ...def, count: n, trangThai: trangThaiTheoSo(true, n), chiTiet: idfcKindBreakdown(input.idfcKinds), thumbs: [] };
      }
      case 'vat-lieu':
        return { ...def, count: daTaiKho ? vatLieu.length : null, trangThai: trangThaiTheoSo(daTaiKho, vatLieu.length), chiTiet: [], thumbs: thumbsOf(vatLieu) };
      case 'anh-tai-san':
        return { ...def, count: daTaiKho ? anh.length : null, trangThai: trangThaiTheoSo(daTaiKho, anh.length), chiTiet: [], thumbs: thumbsOf(anh) };
      case 'ky-hieu-2d': {
        const n = kyHieuBuiltin + kyHieuDb.length;
        return {
          ...def,
          count: n,
          trangThai: trangThaiTheoSo(true, n),
          chiTiet: [[`${kyHieuBuiltin} khối đi kèm app`, `${kyHieuBuiltin} bundled blocks`]],
          thumbs: thumbsOf(kyHieuDb),
        };
      }
      case 'mo-hinh-3d':
        return { ...def, count: daTaiKho ? moHinh3d.length : null, trangThai: trangThaiTheoSo(daTaiKho, moHinh3d.length), chiTiet: [], thumbs: thumbsOf(moHinh3d) };
      case 'mau-ho-so':
        return { ...def, count: daTaiKho ? mau.length : null, trangThai: trangThaiTheoSo(daTaiKho, mau.length), chiTiet: [], thumbs: thumbsOf(mau) };
      case 'the-dna': {
        if (!input.dna) return { ...def, count: null, trangThai: 'dangTai', chiTiet: [], thumbs: [] };
        const { soThe, soDuAn } = input.dna;
        return {
          ...def,
          count: soThe,
          trangThai: trangThaiTheoSo(true, soThe),
          chiTiet: [[`${soDuAn} dự án đã soi`, `${soDuAn} projects scanned`]],
          thumbs: [],
        };
      }
      case 'tri-thuc': {
        if (!input.knowledge) return { ...def, count: null, trangThai: 'dangTai', chiTiet: [], thumbs: [] };
        const k = input.knowledge;
        return {
          ...def,
          count: k.tong,
          trangThai: trangThaiTheoSo(true, k.tong),
          chiTiet: [
            [`Đã đối chiếu nguồn ${k.daKiem}`, `Source verified ${k.daKiem}`],
            [`Quy chuẩn ${k.theoLoai['quy-chuan']} · Tài liệu dự án ${k.theoLoai['tai-lieu-du-an']}`, `Standards ${k.theoLoai['quy-chuan']} · Project docs ${k.theoLoai['tai-lieu-du-an']}`],
          ],
          thumbs: [],
        };
      }
      case 'bo-suu-tap':
        return { ...def, count: null, trangThai: 'chuaNoi', chiTiet: [], thumbs: [] };
    }
  });
}

/** Số thứ tự ô "01…10" theo THỨ TỰ HIỆN RA — cùng luật địa chỉ ô của Home (`bento-layout.ts`). */
export function sectionIndexMap(sections: readonly OverviewSection[]): Record<string, string> {
  const out: Record<string, string> = {};
  sections.forEach((s, i) => {
    out[s.id] = String(i + 1).padStart(2, '0');
  });
  return out;
}
