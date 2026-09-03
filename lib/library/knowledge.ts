/**
 * lib/library/knowledge.ts — KHO TRI THỨC của Thư viện: tri thức MÁY DÙNG ĐƯỢC, CÓ NGUỒN GỐC.
 *
 * VÌ SAO CÓ FILE NÀY (02/09, slice Home + Thư viện): `docs/00-CHOT.md` [15/08] khai
 * "kho-mot-cua-han-dung" + chiều thời gian trên tri thức (`effectiveFrom`/`supersededBy`), và
 * `docs/BAN-THIET-KE-HE-THONG-IF` liệt Knowledge Base là mục của Master Library. Đo tại nguồn
 * 02/09: `grep -rniE "knowledge" lib components app` — KHÔNG có mô-đun tri thức nào; thứ gần nhất
 * là hai kho ĐÃ CÓ dữ liệu cấu trúc + nguồn gốc mà chưa nơi nào gọi chung một tên:
 *   ① `lib/cad/standards/registry.ts` — 9 bộ quy chuẩn, mỗi rule có `source`·`verified`·
 *     `region`·`binding`·`effectiveFrom`·`supersededBy`·`loaiNguon`·`nguyenVan` + `params` số.
 *   ② Notebook dự án (`/api/notebook/[projectId]/sources`) — tài liệu đã cắt chunk + embed cho
 *     RAG (`lib/notebook/rag.ts`), có `originalUrl`/`hasFile`/`chunkCount`.
 * ⇒ [Đ2] NHÌN VÀO TRONG TRƯỚC: file này KHÔNG đẻ kho thứ ba. Nó là LỚP ĐỌC CHUNG (adapter) đưa
 * hai kho ấy về MỘT hình dạng `KnowledgeEntry` để trang Kho tri thức bày + lọc + đếm. Không ghi.
 *
 * LUẬT GIỮ (chốt 15/08 "kiểm chuẩn = việc của máy" + rào ①-③ `lib/cad/standards/types.ts`):
 *   · KHÔNG suy `loaiNguon` từ `severity`/`binding`/chuỗi `source` — thiếu thì ghi "chưa phân loại".
 *   · KHÔNG bịa `verified`: rule nói sao ghi vậy; tài liệu người dùng tải lên = CHƯA ĐỐI CHIẾU.
 *   · KHÔNG gọi `Date.now()` để quyết hiệu lực — ngày mốc do caller đưa (đúng `resolveRulesAsOf`).
 *
 * THUẦN — import TƯƠNG ĐỐI để `sucrase-node` chạy test không cần alias `@/`.
 */

import { resolveRulesAsOf, type RuleBinding, type StandardRegion, type StandardRule } from '../cad/standards/registry';
import type { LoaiNguon } from '../cad/standards/types';

export type KnowledgeKind = 'quy-chuan' | 'tai-lieu-du-an';

/** Đã đối chiếu với nguồn kiểm chứng được hay chưa — ĐỌC TỪ DỮ LIỆU, không đoán. */
export type XacMinh = 'da-kiem' | 'chua-kiem';

/** Chiều thời gian của một mục tri thức tại ngày mốc đã chọn. */
export type HieuLuc = 'hien-hanh' | 'chuyen-tiep' | 'da-thay-the';

export interface KnowledgeProvenance {
  /** Tên văn bản + điều khoản, hoặc tên tệp/URL tài liệu. */
  nguon: string;
  url: string | null;
  /** Ai ban hành — `undefined` = CHƯA PHÂN LOẠI (rào B3: không suy từ trục khác). */
  loaiNguon?: LoaiNguon;
  xacMinh: XacMinh;
  /** Lý do chưa chắc / cần đối chiếu gì (rule.note) — hoặc ghi chú xuất xứ của tài liệu. */
  ghiChu: string | null;
  region?: StandardRegion;
  binding?: RuleBinding;
  effectiveFrom?: string;
  supersededBy?: string;
  /** Có NGUYÊN VĂN điều khoản chép đúng từng chữ hay không (chỉ nghĩa với `loaiNguon:'luat'`). */
  coNguyenVan: boolean;
}

export interface KnowledgeEntry {
  id: string;
  kind: KnowledgeKind;
  title: string;
  /** Nhóm bày trong danh sách — category của rule, hoặc loại tài liệu (pdf/url/…). */
  nhom: string;
  provenance: KnowledgeProvenance;
  hieuLuc: HieuLuc;
  /** Ghi chú chuyển tiếp từ `resolveRulesAsOf` (chỉ khi `hieuLuc === 'chuyen-tiep'`). */
  ghiChuHieuLuc: string | null;
  /** Phần MÁY DÙNG ĐƯỢC — trị số cấu trúc (rule.params) hoặc số chunk đã embed cho RAG. */
  mayDung: { thamSo?: Record<string, number>; soChunk?: number; sanSang: boolean };
  /** Đường tới nơi tri thức này đang được DÙNG (trang có nó) — `null` khi chưa có trang riêng. */
  href: string | null;
}

/* ───────────────────────────── ① quy chuẩn ngành ───────────────────────────── */

/**
 * Mọi rule → mục tri thức, KÈM trạng thái hiệu lực tại `asOfDate` (null = bộ mới nhất).
 * Rule đã bị thay KHÔNG bị bỏ: nó vẫn là tri thức (hồ sơ cũ nghiệm thu theo bản cũ), chỉ được
 * đánh dấu `da-thay-the` để bộ lọc mặc định ẩn đi.
 */
export function knowledgeFromRules(rules: readonly StandardRule[], asOfDate?: string | null): KnowledgeEntry[] {
  const resolved = resolveRulesAsOf([...rules], asOfDate);
  const inForce = new Set(resolved.rules.map((r) => r.id));
  return rules.map((r) => {
    const chuyenTiep = resolved.noteByRuleId[r.id] ?? null;
    const hieuLuc: HieuLuc = !inForce.has(r.id) ? 'da-thay-the' : chuyenTiep ? 'chuyen-tiep' : 'hien-hanh';
    return {
      id: `rule:${r.id}`,
      kind: 'quy-chuan',
      title: r.description,
      nhom: r.category,
      provenance: {
        nguon: r.source,
        url: null,
        loaiNguon: r.loaiNguon,
        xacMinh: r.verified ? 'da-kiem' : 'chua-kiem',
        ghiChu: r.note ?? null,
        region: r.region,
        binding: r.binding,
        effectiveFrom: r.effectiveFrom,
        supersededBy: r.supersededBy,
        coNguyenVan: typeof r.nguyenVan === 'string' && r.nguyenVan.trim().length > 0,
      },
      hieuLuc,
      ghiChuHieuLuc: chuyenTiep,
      mayDung: { thamSo: { ...r.params }, sanSang: true },
      href: null,
    };
  });
}

/* ───────────────────────────── ② tài liệu dự án (RAG) ───────────────────────────── */

/** Trường mình dùng từ `GET /api/notebook/[projectId]/sources` — route trả nhiều hơn. */
export interface NotebookSourceLite {
  id: string;
  kind: string;
  title: string;
  status: string;
  originalUrl?: string | null;
  hasFile?: boolean;
  chunkCount?: number;
}

/**
 * Tài liệu dự án → mục tri thức. `xacMinh` LUÔN là `chua-kiem`: tài liệu do người dùng tải
 * lên là NGUỒN chứ không phải nguồn ĐÃ ĐỐI CHIẾU — ghi thẳng như vậy, không tô.
 * `mayDung.sanSang` = đã cắt chunk xong (RAG trả lời được) — đúng nghĩa "máy dùng được".
 */
export function knowledgeFromNotebookSources(projectId: string, sources: readonly NotebookSourceLite[]): KnowledgeEntry[] {
  return sources.map((s) => {
    const soChunk = Number.isFinite(s.chunkCount) ? Math.max(0, Math.trunc(s.chunkCount as number)) : 0;
    const url = typeof s.originalUrl === 'string' && s.originalUrl.trim() ? s.originalUrl : null;
    return {
      id: `nb:${projectId}:${s.id}`,
      kind: 'tai-lieu-du-an',
      title: s.title,
      nhom: s.kind,
      provenance: {
        nguon: url ?? (s.hasFile ? s.title : s.title),
        url,
        xacMinh: 'chua-kiem',
        ghiChu: url ? 'Tài liệu người dùng nạp từ URL — chưa đối chiếu với nguồn gốc.' : 'Tài liệu người dùng tải lên — chưa đối chiếu với nguồn gốc.',
        coNguyenVan: false,
      },
      hieuLuc: 'hien-hanh',
      ghiChuHieuLuc: null,
      mayDung: { soChunk, sanSang: s.status === 'ready' && soChunk > 0 },
      href: `/projects/${projectId}/notebook`,
    };
  });
}

/* ───────────────────────────── lọc · đếm · nhóm ───────────────────────────── */

export interface KnowledgeFilter {
  q?: string;
  kind?: KnowledgeKind | 'all';
  /** Chỉ mục đã đối chiếu nguồn. */
  chiDaKiem?: boolean;
  /** Ẩn mục đã bị thay thế (mặc định ẩn — tri thức lỗi thời không nên là thứ đập vào mắt). */
  anDaThayThe?: boolean;
}

export function filterKnowledge(entries: readonly KnowledgeEntry[], f: KnowledgeFilter = {}): KnowledgeEntry[] {
  const q = (f.q ?? '').trim().toLowerCase();
  const kind = f.kind ?? 'all';
  const anDaThayThe = f.anDaThayThe ?? true;
  return entries.filter((e) => {
    if (kind !== 'all' && e.kind !== kind) return false;
    if (f.chiDaKiem && e.provenance.xacMinh !== 'da-kiem') return false;
    if (anDaThayThe && e.hieuLuc === 'da-thay-the') return false;
    if (q) {
      const hay = `${e.title} ${e.provenance.nguon} ${e.nhom} ${e.id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export interface KnowledgeStats {
  tong: number;
  daKiem: number;
  hienHanh: number;
  daThayThe: number;
  theoLoai: Record<KnowledgeKind, number>;
}

export function knowledgeStats(entries: readonly KnowledgeEntry[]): KnowledgeStats {
  const st: KnowledgeStats = { tong: 0, daKiem: 0, hienHanh: 0, daThayThe: 0, theoLoai: { 'quy-chuan': 0, 'tai-lieu-du-an': 0 } };
  for (const e of entries) {
    st.tong += 1;
    if (e.provenance.xacMinh === 'da-kiem') st.daKiem += 1;
    if (e.hieuLuc === 'da-thay-the') st.daThayThe += 1;
    else st.hienHanh += 1;
    st.theoLoai[e.kind] += 1;
  }
  return st;
}

/** Nhóm theo `nhom`, GIỮ thứ tự xuất hiện đầu tiên (không sort chữ cái — thứ tự bộ luật là có nghĩa). */
export function groupKnowledge(entries: readonly KnowledgeEntry[]): { nhom: string; items: KnowledgeEntry[] }[] {
  const order: string[] = [];
  const by = new Map<string, KnowledgeEntry[]>();
  for (const e of entries) {
    if (!by.has(e.nhom)) {
      by.set(e.nhom, []);
      order.push(e.nhom);
    }
    by.get(e.nhom)!.push(e);
  }
  return order.map((nhom) => ({ nhom, items: by.get(nhom)! }));
}

/** Nhãn song ngữ cho nhóm quy chuẩn (category của registry) — nhóm lạ trả nguyên chuỗi. */
export const NHAN_NHOM_QUY_CHUAN: Record<string, [string, string]> = {
  'room-size': ['Kích thước phòng', 'Room size'],
  clearance: ['Khoảng trống thao tác', 'Clearance'],
  'door-window': ['Cửa đi · cửa sổ', 'Doors & windows'],
  egress: ['Thoát nạn', 'Egress'],
  'corridor-stair': ['Hành lang · cầu thang', 'Corridors & stairs'],
  drafting: ['Thể hiện bản vẽ', 'Drafting'],
  other: ['Khác', 'Other'],
};

export const NHAN_XAC_MINH: Record<XacMinh, [string, string]> = {
  'da-kiem': ['Đã đối chiếu nguồn', 'Source verified'],
  'chua-kiem': ['Chưa đối chiếu', 'Not verified'],
};

export const NHAN_HIEU_LUC: Record<HieuLuc, [string, string]> = {
  'hien-hanh': ['Hiện hành', 'In force'],
  'chuyen-tiep': ['Chuyển tiếp', 'Transitional'],
  'da-thay-the': ['Đã thay thế', 'Superseded'],
};

export const NHAN_BINDING: Record<RuleBinding, [string, string]> = {
  mandatory: ['Bắt buộc', 'Mandatory'],
  adjustable: ['Tuỳ chỉnh', 'Adjustable'],
  advisory: ['Tham khảo', 'Advisory'],
};
