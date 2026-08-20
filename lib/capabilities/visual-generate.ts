/**
 * lib/capabilities/visual-generate.ts — LÕI THUẦN của năng lực gộp `visual-generate`
 * ("Dựng hình ảnh"). Đây là **tầng ĐIỀU PHỐI**, không phải tầng thi hành.
 *
 * ── NEGATIVE EVIDENCE (luật B25 NO-REBUILD, 6 mục) ─────────────────────────────────────────────
 *  ① Đã tìm ở đâu: `lib/nodes/registry.ts` (16 node `ai.*`) · `lib/execution.ts`
 *    (`runNode`/`estimateRunCredit`/`friendlyAiError`) · `lib/ai/providers/` · `lib/types.ts`
 *    (`RunStatus`/`Job`/`FlowRun`) · `components/render-studio/render-queue-store.ts` ·
 *    `lib/ui/tien-trinh.ts` · `lib/capabilities/compound.ts`.
 *  ② Primitive gần nhất: `runNode(nodeId)` — bộ thi hành THẬT, có hàng đợi, có cache theo
 *    input-hash, có kế toán credit, có dịch lỗi. `NANG_LUC_GOP` — bảng ý định.
 *  ③ Vì sao REUSE/CONNECT không đủ: giữa "ý định người dùng" (một ảnh nguồn + một câu) và
 *    "một node cụ thể trong 16 node" KHÔNG có ai dịch. Hôm nay người dùng phải tự biết
 *    `ai.sketch2render` khác `ai.clay2render` chỗ nào. Đó là chỗ trống thật.
 *  ④ Vì sao không EXTEND thẳng `compound.ts`: file đó là DỮ LIỆU THUẦN khai báo (bảng ý định).
 *    Nhét logic chọn-node vào đó là trộn bảng tra với thuật toán. File này TRỎ VÀO nó.
 *  ⑤ Không tạo island: mọi id node ở đây bắt buộc nằm trong `lenhNoiBo` của năng lực
 *    (`chuoiHopLe()` + test khoá). Không có tên node nào tự chế.
 *  ⑥ Không đẻ executor thứ hai: file này KHÔNG gọi provider, KHÔNG fetch, KHÔNG import store.
 *    Nó chỉ trả về **kế hoạch**; `visual-generate-run.ts` đem kế hoạch đó đi qua `runNode`.
 *
 * ── VÌ SAO THUẦN (không React, không store) ────────────────────────────────────────────────────
 * Cùng lối `lib/commands/toolbar-source.ts`: test chạy thẳng bằng `sucrase-node`, import TƯƠNG
 * ĐỐI (alias `@/` chỉ resolve qua bundler Next.js). Kéo `useFlowStore` vào đây là mất test thuần.
 *
 * ── LUẬT KHÔNG ĐƯỢC PHÁ ────────────────────────────────────────────────────────────────────────
 *  ⛔ CẤM BỊA PHẦN TRĂM. Đo được ở đây CHỈ có một thứ: **bước thứ mấy trên tổng mấy bước** — con
 *     số đếm thật. Phần trăm BÊN TRONG một bước là `KHONG_DO_DUOC`, và đó không phải sự cẩn thận
 *     thừa: `lib/ai/client.ts:95` phát `onProgress` bằng **ngoại suy thời gian**
 *     (`elapsed / typical`), tức một con số đoán. Bày nó ra như tiến trình thật là bịa.
 *  ⛔ Máy sinh = ĐỀ XUẤT. `XuatXu.trangThaiNhan` khởi tạo LUÔN là `'deXuat'`; không hàm nào ở đây
 *     tự chuyển sang `'daNhan'` — chỉ người bấm mới chuyển được (§19 cấm ghi đè im lặng).
 *  ⛔ Đầu ra là ẢNH ⇒ `mucSuThat: 'khongPhaiSoDo'`. Không con số nào từ đây được đi vào BOQ (§11).
 */

import { nangLucTheoId, type MucSuThat, type NacSau } from './compound';
import { KHONG_DO_DUOC, tuPhanSo, type TienTrinh } from '../ui/tien-trinh';

/** id năng lực — hằng, để không rắc chuỗi ma khắp nơi. */
export const VISUAL_GENERATE_ID = 'visual-generate';

/**
 * Ảnh nguồn LÀ GÌ — quyết định lệnh nội bộ nào đúng việc.
 * Đây là câu hỏi người dùng trả lời được ngay (nhìn ảnh là biết), khác hẳn câu
 * "dùng FLUX Canny hay FLUX Depth" mà chỉ người trong nghề AI mới trả lời nổi.
 */
export type KieuNguon = 'phac' | 'khoiTrang' | 'anhThat' | 'phongTrong';

export const NHAN_KIEU_NGUON: Record<KieuNguon, [string, string]> = {
  phac: ['Nét phác / bản vẽ', 'Sketch / line drawing'],
  khoiTrang: ['Khối trắng 3D', 'Clay 3D block'],
  anhThat: ['Ảnh thật / bản kết xuất', 'Photo / existing render'],
  phongTrong: ['Phòng trống', 'Empty room'],
};

/** Vai trò một bước trong dây chuyền — để giải thích được bằng lời, không chỉ bằng tên node. */
export type VaiTroBuoc = 'goc' | 'anhSang' | 'nangCap';

export interface BuocLenh {
  /** id node nội bộ — BẮT BUỘC nằm trong `lenhNoiBo` của năng lực. */
  readonly node: string;
  readonly vaiTro: VaiTroBuoc;
  /** Tham số truyền cho node (khớp `params` node khai trong registry). */
  readonly thamSo: Readonly<Record<string, string | number>>;
}

export interface YeuCauDung {
  /** URL/data-URL ảnh nguồn. Thiếu ⇒ không chạy được (xem `sanSangDung`). */
  readonly anhNguon?: string;
  /** Định danh vật nguồn (để truy về một nguồn) — có thì ghi vào xuất xứ, không có thì bỏ trống. */
  readonly nguonId?: string;
  /** Revision của nguồn nếu nguồn có đánh bản. Không bịa khi không có. */
  readonly nguonRevision?: string;
  readonly kieuNguon: KieuNguon;
  /** Ý định bằng chữ của người dùng. Rỗng cũng chạy được (node tự có style preset). */
  readonly yDinh: string;
  readonly nac: NacSau;
  /** Phong cách chọn sẵn (khớp `STYLE_OPTIONS` của registry). */
  readonly phongCach?: string;
  /** Đổi ánh sáng sau khi dựng. */
  readonly doiAnhSang?: string;
  /** Phóng to để in (≥300dpi — luật 300dpi 29/07). */
  readonly nangCap?: boolean;
}

/** Node gốc theo kiểu nguồn — bảng tra, không phải if lồng nhau. */
const NODE_GOC: Record<KieuNguon, string> = {
  phac: 'ai.sketch2render',
  khoiTrang: 'ai.clay2render',
  anhThat: 'ai.styletransfer',
  phongTrong: 'ai.emptystaging',
};

/**
 * Lệnh nội bộ mà năng lực này được phép gọi — đọc TỪ `compound.ts`, không chép danh sách.
 * Chép là đẻ nguồn thứ hai; hai bảng rồi sẽ lệch nhau.
 */
export function lenhNoiBoChoPhep(): readonly string[] {
  return nangLucTheoId(VISUAL_GENERATE_ID)?.lenhNoiBo ?? [];
}

/** Mức sự thật của đầu ra — đọc từ bảng năng lực, không tự khai lại. */
export function mucSuThatDauRa(): MucSuThat {
  return nangLucTheoId(VISUAL_GENERATE_ID)?.mucSuThat ?? 'khongPhaiSoDo';
}

/**
 * DỰNG KẾ HOẠCH — ý định người dùng ⇒ chuỗi lệnh nội bộ, theo đúng thứ tự chạy.
 *
 * Không gọi gì, không chạy gì: trả về DỮ LIỆU. Nhờ vậy test được thẳng, và người đọc thấy được
 * "bấm một nút thì máy định làm gì" trước khi tiêu một đồng credit nào.
 *
 * ⚠️ `ai.materialswap` CỐ Ý không bao giờ vào chuỗi tự động dù nó có trong `lenhNoiBo`:
 * node đó đòi cổng `mask` bắt buộc (`registry.ts` — "Thiếu mask — nối node Mask Painter vào").
 * Tự thêm nó vào chuỗi = job chắc chắn lỗi = tiêu credit cho một lỗi biết trước. Nó chỉ chạy khi
 * người dùng đã vẽ mask, và đó là một luồng khác (chưa nối ở lượt này — khai thẳng, không giấu).
 */
export function dungKeHoach(yc: YeuCauDung): BuocLenh[] {
  const chuoi: BuocLenh[] = [];
  const goc = NODE_GOC[yc.kieuNguon];
  const thamSoGoc: Record<string, string | number> = {};
  if (yc.phongCach) thamSoGoc.style = yc.phongCach;
  chuoi.push({ node: goc, vaiTro: 'goc', thamSo: thamSoGoc });

  if (yc.doiAnhSang) {
    chuoi.push({ node: 'ai.relight', vaiTro: 'anhSang', thamSo: { lighting: yc.doiAnhSang } });
  }
  // Phóng to đứng CUỐI: phóng trước rồi mới đổi ánh sáng là trả tiền pixel to cho một bước
  // sẽ vẽ lại toàn bộ ảnh — vô nghĩa về cả chất lượng lẫn tiền.
  if (yc.nangCap) {
    chuoi.push({ node: 'ai.upscale', vaiTro: 'nangCap', thamSo: { scale: '2' } });
  }
  return chuoi;
}

/**
 * Kế hoạch có sạch không — MỌI node phải nằm trong `lenhNoiBo` đã khai.
 * Đây là cái chốt của mục ⑤ negative evidence: không cho tầng điều phối lén gọi node lạ.
 */
export function chuoiHopLe(chuoi: readonly BuocLenh[]): boolean {
  const chophep = new Set(lenhNoiBoChoPhep());
  return chuoi.every((b) => chophep.has(b.node));
}

/* ─────────────────────────── cổng: chạy được chưa ─────────────────────────── */

export interface NgữCanhNguon {
  /** Có ảnh nguồn trong tay chưa. */
  readonly coAnhNguon: boolean;
}

export interface KetQuaCong {
  readonly sanSang: boolean;
  /** [vi, en] — câu cho NGƯỜI ĐỌC, ≤12 từ, nói hiện trạng + lối ra (SPEC-NGON-NGU-CHI-DAN). */
  readonly lyDo?: [string, string];
}

/**
 * Chạy được chưa. Một cổng duy nhất, dùng chung cho cả nút trên thanh (mờ kèm lý do) lẫn
 * cửa duyệt — hai chỗ hỏi cùng một câu thì phải nhận cùng một câu trả lời.
 */
export function sanSangDung(ctx: NgữCanhNguon): KetQuaCong {
  if (!ctx.coAnhNguon) {
    return {
      sanSang: false,
      lyDo: [
        'Chưa có ảnh nguồn — chọn một ảnh hoặc khung nhìn',
        'No source image — pick an image or a view',
      ],
    };
  }
  return { sanSang: true };
}

/* ─────────────────────────── trạng thái việc ─────────────────────────── */

/**
 * Trạng thái một lượt dựng. **Mượn nguyên từ vựng `RunStatus`** của `lib/types.ts`
 * (`idle|queued|running|done|error`) + `cancelled` của `FlowRunStatus` — KHÔNG đẻ job model thứ
 * hai (§20). Kiểu khai lại ở đây dưới dạng union chuỗi thay vì `import type` là để giữ file
 * THUẦN (lib/types.ts kéo theo cả cây kiểu của flow); test `[7]` khoá cho hai bên không lệch.
 */
export type TrangThaiDung = 'idle' | 'queued' | 'running' | 'done' | 'error' | 'cancelled';

export interface TienDoDung {
  readonly trangThai: TrangThaiDung;
  /** Bước thứ mấy đã xong (0..tongBuoc). */
  readonly soBuocXong: number;
  readonly tongBuoc: number;
  /** Lỗi thật từ provider, đã dịch sang lời người dùng ở tầng chạy. Không bịa. */
  readonly loi?: string;
}

/**
 * Tiến trình CẢ LƯỢT — đo được, vì **đếm bước là đếm thật**.
 *
 * ⚠️ Chuỗi MỘT bước ⇒ KHÔNG ĐO ĐƯỢC, dù `tuPhanSo(0, 1)` về mặt số học ra 0%.
 * Lý do không phải kỹ thuật mà là ĐỌC ĐƯỢC: với một bước, thanh sẽ đứng ở 0% suốt cả lượt rồi
 * biến mất — người dùng thấy một con số không nhúc nhích và đọc ra "treo". Con số ấy đúng nhưng
 * KHÔNG MANG TIN, mà chi tiết không mang tin thì không được bày ra (`simpleCoChiTiet`).
 * "Bước i/n" chỉ nói được điều gì đó khi n ≥ 2.
 */
export function tienTrinhCaLuot(t: TienDoDung): TienTrinh {
  if (t.tongBuoc < 2) return KHONG_DO_DUOC;
  return tuPhanSo(t.soBuocXong, t.tongBuoc);
}

/**
 * Tiến trình BÊN TRONG một bước — **luôn KHÔNG ĐO ĐƯỢC**, không có ngoại lệ.
 *
 * Đây là hàm cố ý không nhận tham số nào. Ai muốn đưa một con số vào đây sẽ phải sửa chữ ký hàm,
 * tức phải cố ý — chứ không lỡ tay. Lý do ở đầu file (`lib/ai/client.ts:95` ngoại suy thời gian).
 */
export function tienTrinhTrongBuoc(): TienTrinh {
  return KHONG_DO_DUOC;
}

/**
 * §27 AN TOÀN DEMO — chọn câu báo lỗi khi một lượt KHÔNG về đích.
 *
 * Tách thành hàm thuần để kiểm được mà không cần dựng cả store: đây đúng là nhánh khó tái hiện
 * nhất (phải chặn mạng), nên nó phải là nhánh dễ TEST nhất.
 *
 * ⛔ Không có nhánh nào trả về `undefined`/rỗng: lượt hỏng mà giao diện im lặng là ca tệ nhất —
 *    người dùng ngồi chờ một thứ đã chết. Luôn có câu, và câu ưu tiên là câu THẬT của nhà cung
 *    cấp (`execNode` đã dịch qua `friendlyAiError`), không phải câu chung chung của IF.
 */
export function loiHienThi(trangThai: TrangThaiDung, loiTuNode?: string): string {
  if (trangThai === 'cancelled') return 'Đã huỷ lượt dựng.';
  const that = (loiTuNode ?? '').trim();
  if (that) return that;
  return 'Lượt dựng thất bại — chưa rõ nguyên nhân từ nhà cung cấp.';
}

/* ─────────────────────────── xuất xứ ─────────────────────────── */

export type TrangThaiNhan = 'deXuat' | 'daNhan' | 'daBo';

/**
 * XUẤT XỨ — đi kèm mọi kết quả, không tách rời. Đây là phần khiến kết quả của IF khác một tấm
 * ảnh tải về từ đâu đó: nhìn vào là biết nó ra từ đâu, qua tay máy nào, tốn bao nhiêu, đã được
 * người duyệt chưa.
 */
export interface XuatXu {
  readonly nangLucId: string;
  readonly nguon: {
    readonly id?: string;
    readonly revision?: string;
    readonly kieu: KieuNguon;
    /** Ảnh nguồn — giữ để so sánh trước/sau; đây là ĐẦU VÀO, không phải kết quả. */
    readonly anh?: string;
  };
  /** Chuỗi lệnh nội bộ đã chạy, đúng thứ tự. */
  readonly chuoiLenh: readonly string[];
  readonly thamSo: Readonly<Record<string, string | number>>;
  /** Nhà cung cấp / model — CHỈ điền khi đường chạy cũ thật sự trả về. Không có thì bỏ trống. */
  readonly provider?: string;
  readonly model?: string;
  readonly taoLuc: number;
  /** Credit ƯỚC TÍNH trước khi chạy (`estimateRunCredit`), khai rõ là ước tính. */
  readonly creditUocTinh: number;
  readonly mucSuThat: MucSuThat;
  readonly trangThaiNhan: TrangThaiNhan;
}

export interface ThamSoXuatXu {
  readonly yeuCau: YeuCauDung;
  readonly chuoi: readonly BuocLenh[];
  readonly creditUocTinh: number;
  readonly taoLuc: number;
  readonly provider?: string;
  readonly model?: string;
}

/**
 * Dựng xuất xứ. `trangThaiNhan` LUÔN khởi tạo `'deXuat'` — hàm này không có tham số nào để đặt
 * khác đi. Muốn `'daNhan'` phải đi qua `nhanKetQua()`, tức phải có một cú bấm của người.
 */
export function dungXuatXu(p: ThamSoXuatXu): XuatXu {
  const thamSo: Record<string, string | number> = {};
  for (const b of p.chuoi) for (const [k, v] of Object.entries(b.thamSo)) thamSo[`${b.node}.${k}`] = v;
  if (p.yeuCau.yDinh.trim()) thamSo.yDinh = p.yeuCau.yDinh.trim();

  return {
    nangLucId: VISUAL_GENERATE_ID,
    nguon: {
      id: p.yeuCau.nguonId,
      revision: p.yeuCau.nguonRevision,
      kieu: p.yeuCau.kieuNguon,
      anh: p.yeuCau.anhNguon,
    },
    chuoiLenh: p.chuoi.map((b) => b.node),
    thamSo,
    provider: p.provider,
    model: p.model,
    taoLuc: p.taoLuc,
    creditUocTinh: p.creditUocTinh,
    mucSuThat: mucSuThatDauRa(),
    trangThaiNhan: 'deXuat',
  };
}

/** Người bấm NHẬN. Trả bản mới — không sửa tại chỗ, để bản đề xuất cũ vẫn truy được. */
export function nhanKetQua(x: XuatXu): XuatXu {
  return { ...x, trangThaiNhan: 'daNhan' };
}

/** Người bấm BỎ. Cũng ghi lại — bỏ cũng là một quyết định có ích khi truy lại về sau. */
export function boKetQua(x: XuatXu): XuatXu {
  return { ...x, trangThaiNhan: 'daBo' };
}

/** Một kết quả đề xuất, đủ để xem trước · so sánh · nhận/bỏ. */
export interface DeXuatHinhAnh {
  readonly id: string;
  /** Ảnh máy sinh ra. */
  readonly anh: string;
  /** Ảnh nguồn, để so cạnh nhau. */
  readonly anhTruoc?: string;
  readonly xuatXu: XuatXu;
}
