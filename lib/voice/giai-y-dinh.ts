/**
 * lib/voice/giai-y-dinh.ts — BẢN CHỮ → ĐẦU VÀO NGỮ NGHĨA. Đây là "cửa" mà cả tính năng đi qua.
 *
 * ⭐ BẰNG CHỨNG TÁI DÙNG SỔ LỆNH CHUNG: file này **không có một bảng ánh xạ lời-nói → hành-động
 * nào**. Ngữ cảnh `lenh` giải bằng cách tra `cmdsFor(ctx)` của `lib/commands/registry.ts` —
 * đúng sổ mà ⌘K (`AppCommandPalette`) và thanh công cụ đang đọc — rồi so lời nói với `aliases`
 * và `label` CÓ SẴN trong sổ. Hệ quả kiểm chứng được: lệnh nào chưa có trong sổ thì **nói cũng
 * không chạy** (trả `khong-co-trong-so-lenh`), thay vì thoại tự chế một đường riêng. Muốn nói
 * "mở vật liệu" chạy được thì phải thêm lệnh đó vào SỔ — đúng một chỗ, sáu mặt tiền cùng được.
 *
 * ⛔ Bản chữ TẠM (`tamThoi: true`) không bao giờ được giải ra ý định. Engine còn đang nghe thì
 *    câu còn đổi; thi hành bản tạm là thi hành thứ người dùng chưa nói xong.
 *
 * File THUẦN, import tương đối — test bằng sucrase-node.
 */

import { cmdsFor, type CommandDef, type WhenCtx } from '../commands/registry';
import { chuanHoa, goTiengDem, tachSoCuoi, soDauTien } from './chuan-hoa';
import { canXacNhan } from './rui-ro';
import type {
  BanChu,
  DauVaoNguNghia,
  KetQuaGiai,
  Neo,
  NguCanhHienTai,
  NguonDauVao,
  YDinh,
} from './types';

/* ════════════════════════════════════════════════════════════════════════════════════════════
   Tiền tố ngữ cảnh — tiếng Việt là đường chính, tiếng Anh nhận thêm được thì nhận
   ════════════════════════════════════════════════════════════════════════════════════════════ */

/** C · GHI CHÚ. "ghi chú chỗ này cần kiểm lại cao độ" → nội dung = "chỗ này cần kiểm lại cao độ". */
const TIEN_TO_GHI_CHU = ['ghi chu rang', 'ghi chu la', 'ghi chu', 'ghi lai', 'note'];

/** D · SOÁT DUYỆT — ghi chú GHIM, vào đường checklist. */
const TIEN_TO_SOAT = ['ghim lai', 'ghim', 'soat lai', 'soat duyet', 'danh dau soat'];

/** E · TÌM KIẾM. */
const TIEN_TO_TIM = ['tim kiem', 'tim giup', 'tim', 'tra cuu', 'search'];

/**
 * B · Ý ĐỊNH THIẾT KẾ — thuộc tính đo được nói trong câu. CỐ Ý NGẮN: mỗi từ ở đây là một cửa
 * cho phép câu nói chạm vào SỰ THẬT dự án, nên chỉ nhận thuộc tính không thể hiểu nhầm.
 * Khoá bên trái là dạng đã bỏ dấu (`chuanHoa`), giá trị là khoá ổn định đi vào `YDinh.truong`.
 */
const THUOC_TINH: ReadonlyArray<{
  /** Dạng đã bỏ dấu, để bắt trong câu nói. */
  readonly nghe: string;
  /** Khoá ổn định đi vào `YDinh.truong` — dữ liệu, KHÔNG phải chữ cho người đọc. */
  readonly khoa: string;
  /** Chữ cho NGƯỜI [vi, en]. Thiếu cái này là chữ nghề lọt ra giao diện — lỗi bắt được bằng
   * mắt ở ảnh chụp phiếu xác nhận đầu tiên (22/08): phiếu hiện "Thuộc tính: day". */
  readonly nhan: readonly [string, string];
}> = [
  { nghe: 'day', khoa: 'day', nhan: ['Độ dày', 'Thickness'] },
  { nghe: 'cao', khoa: 'cao', nhan: ['Chiều cao', 'Height'] },
  { nghe: 'rong', khoa: 'rong', nhan: ['Chiều rộng', 'Width'] },
  { nghe: 'dai', khoa: 'dai', nhan: ['Chiều dài', 'Length'] },
];

/**
 * Khoá thuộc tính → chữ cho người đọc. Mặt tiền PHẢI gọi hàm này, cấm in thẳng `YDinh.truong`
 * (SPEC-NGON-NGU-CHI-DAN: cấm jargon nội bộ lộ ra giao diện). Khoá lạ ⇒ trả chính nó, để lỗi
 * nhìn thấy được thay vì lặng lẽ hiện chuỗi rỗng.
 */
export function nhanThuocTinh(khoa: string): [string, string] {
  const t = THUOC_TINH.find((x) => x.khoa === khoa);
  return t ? [t.nhan[0], t.nhan[1]] : [khoa, khoa];
}

/** Đơn vị mặc định khi người nói không nói đơn vị. Bản vẽ IF làm việc bằng mm. */
const DON_VI_MAC_DINH = 'mm';

function boTienTo(cau: string, danhSach: readonly string[]): string | null {
  for (const t of danhSach) {
    if (cau === t) return '';
    if (cau.startsWith(t + ' ')) return cau.slice(t.length + 1).trim();
  }
  return null;
}

/**
 * Lấy lại NGUYÊN VĂN (còn dấu) phần đuôi sau tiền tố. Ghi chú phải lưu đúng chữ người nói —
 * lưu bản đã bỏ dấu là làm hỏng dữ liệu (luật chữ Việt 7.1.23). Đếm theo SỐ TỪ vì `chuanHoa`
 * giữ nguyên số từ (nó chỉ bỏ dấu/dấu câu, không thêm bớt từ).
 */
function duoiNguyenVan(van: string, soTuTienTo: number): string {
  const tu = van.trim().split(/\s+/);
  return tu.slice(soTuTienTo).join(' ').replace(/^[,.;:\s]+/, '').trim();
}

function demTu(s: string): number {
  const t = s.trim();
  return t === '' ? 0 : t.split(/\s+/).length;
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   A · LỆNH — tra SỔ LỆNH CHUNG
   ════════════════════════════════════════════════════════════════════════════════════════════ */

interface KhopLenh {
  readonly cmd: CommandDef;
  readonly alias: string;
  readonly diem: number;
}

/**
 * TÊN CHÍNH của một nhãn: bỏ phần trong ngoặc và phần giải nghĩa sau gạch dài.
 *   "Tường (W 200)"                          → "tuong"
 *   "Divide/Measure — click đối tượng rồi…"  → "divide measure"
 *   "Xline — đường tham chiếu vô hạn"        → "xline"
 *
 * 🔴 VÌ SAO PHẢI CẮT, và vì sao chỉ so PHẦN ĐẦU — bẫy tiếng Việt bắt được lúc chạy thử 22/08:
 * bỏ dấu xong thì **"đối tượng" chứa đúng chữ "tuong"**. Nếu chấm điểm bằng kiểu "nhãn có chứa
 * cụm ở bất kỳ đâu" thì câu "vẽ tường" khớp cả lệnh `cad.edit.divide` (nhãn có "đối tượng") —
 * hai lệnh chẳng liên quan gì nhau. Tiếng Việt tách theo ÂM TIẾT nên "ranh giới từ" không cứu
 * được. Cách chắc chắn: chỉ so với TÊN, và so từ ĐẦU tên — nhãn trong sổ đều đặt danh từ chính
 * lên trước, nên khớp-phần-đầu vừa đúng ngữ pháp nhãn vừa cắt sạch loại nhầm này.
 */
function tenChinh(nhan: string): string {
  return chuanHoa(nhan.replace(/\([^)]*\)/g, ' ').split('—')[0]);
}

/**
 * Chấm điểm một lệnh với cụm chữ đã chuẩn hoá.
 *   100 — trùng khít một ALIAS gõ tay (người dùng đọc thẳng "offset", "trim")
 *    90 — trùng khít TÊN CHÍNH (vi hoặc en)
 *    60+n — tên chính BẮT ĐẦU bằng cụm (n = số từ của cụm; cụm dài thắng cụm ngắn)
 *     0 — không khớp
 */
function chamDiem(cmd: CommandDef, cum: string): KhopLenh | null {
  if (!cum) return null;
  const hoa = cum.toUpperCase();
  if (cmd.aliases.includes(hoa)) return { cmd, alias: hoa, diem: 100 };

  const ten = [tenChinh(cmd.label[0]), tenChinh(cmd.label[1])];
  const alias0 = cmd.aliases[0] ?? cmd.id;
  if (ten.includes(cum)) return { cmd, alias: alias0, diem: 90 };
  if (ten.some((n) => n.startsWith(cum + ' '))) return { cmd, alias: alias0, diem: 60 + demTu(cum) };
  return null;
}

interface KetQuaTraLenh {
  readonly khop?: KhopLenh;
  /** Nhiều lệnh cùng điểm cao nhất — KHÔNG chọn bừa, báo mập mờ. */
  readonly mapMo?: string[];
}

/**
 * Tra sổ lệnh. Hoà điểm ⇒ trả `mapMo`, KHÔNG tự chọn: chọn bừa một trong hai lệnh khi máy
 * không chắc chính là kiểu "lặng lẽ làm sai" mà cả lane này sinh ra để chặn.
 */
export function traSoLenh(cum: string, ctx: WhenCtx): KetQuaTraLenh {
  const co = cmdsFor(ctx);
  let tot: KhopLenh[] = [];
  for (const cmd of co) {
    const k = chamDiem(cmd, cum);
    if (!k) continue;
    if (tot.length === 0 || k.diem > tot[0].diem) tot = [k];
    else if (k.diem === tot[0].diem) tot.push(k);
  }
  if (tot.length === 0) return {};
  if (tot.length > 1) return { mapMo: tot.map((k) => k.cmd.label[0]) };
  return { khop: tot[0] };
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   Bộ giải
   ════════════════════════════════════════════════════════════════════════════════════════════ */

function neoTu(ngu: NguCanhHienTai): Neo {
  return {
    stage: ngu.stage,
    workspaceId: ngu.workspaceId,
    projectId: ngu.projectId,
    entityId: ngu.entityId,
  };
}

function dong(yDinh: YDinh, banChu: BanChu, nguon: NguonDauVao): KetQuaGiai {
  const dauVao: DauVaoNguNghia = {
    nguon,
    yDinh,
    banChu,
    // Tính bằng máy, KHÔNG nhận từ nơi gọi — xem docstring `DauVaoNguNghia.doiSuThat`.
    doiSuThat: canXacNhan(yDinh),
  };
  return { ok: true, dauVao };
}

/**
 * BẢN CHỮ → ĐẦU VÀO NGỮ NGHĨA.
 *
 * `nguon` mặc định `'giong-noi'` nhưng nhận cả `'chu-go'` — chính là cách chứng minh hợp đồng
 * dùng chung: gõ cùng câu đó vào ô chữ sẽ ra CÙNG MỘT `DauVaoNguNghia`, chỉ khác một chữ ở
 * `nguon`. Không có nhánh xử lý riêng cho giọng nói ở bất kỳ đâu bên dưới.
 */
export function giaiBanChu(
  banChu: BanChu,
  ngu: NguCanhHienTai,
  nguon: NguonDauVao = 'giong-noi',
): KetQuaGiai {
  if (banChu.tamThoi) return { ok: false, lyDo: 'ban-tam' };
  const van = banChu.van.trim();
  if (!van) return { ok: false, lyDo: 'rong' };

  const cau = chuanHoa(van);
  if (!cau) return { ok: false, lyDo: 'rong' };
  const neo = neoTu(ngu);

  // ── C · GHI CHÚ ────────────────────────────────────────────────────────────────────────────
  for (const t of TIEN_TO_GHI_CHU) {
    const duoi = boTienTo(cau, [t]);
    if (duoi === null) continue;
    const noiDung = duoiNguyenVan(van, demTu(t));
    if (!noiDung) return { ok: false, lyDo: 'rong', goiY: 'Nói "ghi chú" rồi nói nội dung.' };
    return dong({ nguCanh: 'ghi-chu', noiDung, neo }, banChu, nguon);
  }

  // ── D · SOÁT DUYỆT ─────────────────────────────────────────────────────────────────────────
  for (const t of TIEN_TO_SOAT) {
    const duoi = boTienTo(cau, [t]);
    if (duoi === null) continue;
    const noiDung = duoiNguyenVan(van, demTu(t));
    if (!noiDung) return { ok: false, lyDo: 'rong', goiY: 'Nói "ghim" rồi nói điều cần soát lại.' };
    return dong({ nguCanh: 'soat-duyet', noiDung, neo }, banChu, nguon);
  }

  // ── E · TÌM KIẾM ───────────────────────────────────────────────────────────────────────────
  for (const t of TIEN_TO_TIM) {
    const duoi = boTienTo(cau, [t]);
    if (duoi === null) continue;
    const tuKhoa = duoiNguyenVan(van, demTu(t));
    if (!tuKhoa) return { ok: false, lyDo: 'rong', goiY: 'Nói "tìm" rồi nói thứ cần tìm.' };
    const kho = duoi.includes('thu vien')
      ? ('thu-vien' as const)
      : duoi.includes('gallery') || duoi.includes('anh dep')
        ? ('gallery' as const)
        : duoi.includes('du an')
          ? ('du-an' as const)
          : undefined;
    return dong({ nguCanh: 'tim-kiem', tuKhoa, kho }, banChu, nguon);
  }

  // ── B · Ý ĐỊNH THIẾT KẾ ────────────────────────────────────────────────────────────────────
  // Chỉ nhận khi câu có ĐỦ hai vế: một thuộc tính đo được + một con số. Thiếu số thì báo thẳng
  // `thieu-so` chứ KHÔNG đoán — đoán ở đây là đoán vào sự thật dự án.
  const tuCau = cau.split(' ');
  const thuocTinh = THUOC_TINH.find((x) => tuCau.includes(x.nghe));
  if (thuocTinh) {
    const giaTri = soDauTien(cau);
    if (giaTri === null) {
      return { ok: false, lyDo: 'thieu-so', goiY: 'Nói kèm con số, ví dụ "dày 120".' };
    }
    return dong(
      {
        nguCanh: 'y-dinh-thiet-ke',
        truong: thuocTinh.khoa,
        giaTri,
        donVi: DON_VI_MAC_DINH,
        neo,
      },
      banChu,
      nguon,
    );
  }

  // ── A · LỆNH — tra SỔ LỆNH CHUNG ───────────────────────────────────────────────────────────
  const { chu, so } = tachSoCuoi(cau);
  const cum = goTiengDem(chu);
  const ctx: WhenCtx = { stage: ngu.stage, mode: ngu.mode, proToolsAllowed: ngu.proToolsAllowed };
  const tra = traSoLenh(cum, ctx);
  if (tra.mapMo) {
    return {
      ok: false,
      lyDo: 'khong-hieu',
      goiY: `Có ${tra.mapMo.length} lệnh cùng khớp: ${tra.mapMo.join(' · ')}. Nói rõ hơn.`,
    };
  }
  if (tra.khop) {
    return dong(
      {
        nguCanh: 'lenh',
        commandId: tra.khop.cmd.id,
        alias: tra.khop.alias,
        nhan: tra.khop.cmd.label[0],
        arg: so[0],
        arg2: so[1],
      },
      banChu,
      nguon,
    );
  }

  return {
    ok: false,
    lyDo: 'khong-co-trong-so-lenh',
    goiY: 'Chưa có lệnh nào tên như vậy trong sổ lệnh.',
  };
}
