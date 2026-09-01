/**
 * lib/tasks/gantt.ts — logic THUẦN cho dải Gantt của màn "Bảng việc".
 *
 * Tái dùng `TaskRow` (`lib/server/tasks`) — KHÔNG đẻ mô hình việc thứ hai (luật 6).
 * Chỉ `import type`, đúng lý do đã ghi ở `board.ts`: type-import bị xoá lúc build
 * nên prisma không lọt vào bundle client.
 *
 * ⚠️ CHỖ GANTT HAY NÓI DỐI, và là lý do tệp này tồn tại:
 *  · việc KHÔNG có ngày → phần mềm thường lặng lẽ gán "hôm nay" rồi vẽ một thanh
 *    trông rất thật. Ở đây nó KHÔNG được vẽ; nó đi vào `khongXepDuoc` kèm lý do.
 *  · việc có `startAt` SAU `dueAt` → nhiều phần mềm vẽ thanh ngược hoặc dài 0 mà
 *    không kêu. Ở đây nó vẫn được vẽ (dữ liệu là dữ liệu) nhưng bị ĐÁNH DẤU `nguoc`.
 *  · cửa sổ thời gian suy từ dữ liệu THẬT; không có việc nào xếp được thì cửa sổ là
 *    `null`, không phải "tuần này".
 */

import type { TaskRow } from '../server/tasks';

/** Một thanh việc đã có chỗ trên dải. */
export interface ThanhGantt {
  id: string;
  tieuDe: string;
  /** mốc bắt đầu (ms epoch) — bằng `ketThuc` khi việc chỉ có hạn (cột mốc) */
  batDau: number;
  /** mốc kết thúc (ms epoch) */
  ketThuc: number;
  /** việc chỉ có hạn, không có ngày bắt đầu ⇒ vẽ như CỘT MỐC, không phải thanh */
  laCotMoc: boolean;
  /** `startAt` nằm SAU `dueAt` — dữ liệu mâu thuẫn, vẫn vẽ nhưng phải nói ra */
  nguoc: boolean;
  /** vị trí trái theo % cửa sổ (0–100) */
  traiPhanTram: number;
  /** bề rộng theo % cửa sổ (0–100); cột mốc ra 0 */
  rongPhanTram: number;
}

export interface ViecKhongXepDuoc {
  id: string;
  tieuDe: string;
  lyDo: string;
}

export interface CuaSoGantt {
  batDau: number;
  ketThuc: number;
  soNgay: number;
}

export interface DaiGantt {
  cuaSo: CuaSoGantt | null;
  thanh: ThanhGantt[];
  khongXepDuoc: ViecKhongXepDuoc[];
}

const MOT_NGAY_MS = 86_400_000;

/** Đọc mốc ISO → ms. Chuỗi rác trả `null` (không ném, client hay cầm dữ liệu lệch phiên). */
export function docMoc(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

/**
 * Dựng dải Gantt từ danh sách việc.
 * Thứ tự thanh: `batDau` tăng dần → việc ngắn trước → `id` (ổn định, không đảo bừa).
 */
export function dungGantt(viec: readonly TaskRow[]): DaiGantt {
  const khongXepDuoc: ViecKhongXepDuoc[] = [];
  const tho: Omit<ThanhGantt, 'traiPhanTram' | 'rongPhanTram'>[] = [];

  for (const t of viec) {
    const s = docMoc(t.startAt);
    const d = docMoc(t.dueAt);
    if (s === null && d === null) {
      khongXepDuoc.push({
        id: t.id,
        tieuDe: t.title,
        lyDo: t.startAt || t.dueAt ? 'ngày không đọc được' : 'chưa có ngày bắt đầu lẫn hạn',
      });
      continue;
    }
    if (s !== null && d === null) {
      khongXepDuoc.push({ id: t.id, tieuDe: t.title, lyDo: 'có ngày bắt đầu nhưng chưa có hạn' });
      continue;
    }
    // d !== null từ đây
    const han = d as number;
    const batDau = s ?? han;
    tho.push({
      id: t.id,
      tieuDe: t.title,
      batDau: Math.min(batDau, han),
      ketThuc: Math.max(batDau, han),
      laCotMoc: s === null,
      nguoc: s !== null && s > han,
    });
  }

  if (!tho.length) return { cuaSo: null, thanh: [], khongXepDuoc };

  tho.sort((a, b) => {
    if (a.batDau !== b.batDau) return a.batDau - b.batDau;
    const da = a.ketThuc - a.batDau;
    const db = b.ketThuc - b.batDau;
    if (da !== db) return da - db;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const min = Math.min(...tho.map((b) => b.batDau));
  const max = Math.max(...tho.map((b) => b.ketThuc));
  const nhip = max - min;
  const cuaSo: CuaSoGantt = {
    batDau: min,
    ketThuc: max,
    soNgay: nhip === 0 ? 0 : nhip / MOT_NGAY_MS,
  };

  const thanh = tho.map((b) => ({
    ...b,
    // cửa sổ dẹt (mọi việc cùng một mốc) ⇒ mọi thanh về 0%, không chia cho 0
    traiPhanTram: nhip === 0 ? 0 : ((b.batDau - min) / nhip) * 100,
    rongPhanTram: nhip === 0 ? 0 : ((b.ketThuc - b.batDau) / nhip) * 100,
  }));

  return { cuaSo, thanh, khongXepDuoc };
}

/**
 * Việc TRỄ so với một mốc "bây giờ" truyền vào.
 * `bayGio` là THAM SỐ, không đọc `Date.now()` bên trong — hàm tất định thì test được,
 * và màn hình nào cũng phải nói rõ nó đang lấy giờ ở đâu.
 */
export function viecTre(dai: DaiGantt, bayGio: number): ThanhGantt[] {
  return dai.thanh.filter((b) => b.ketThuc < bayGio);
}

/**
 * Việc TRỄ THẬT: quá hạn **và chưa xong**.
 *
 * 🔴 VÌ SAO PHẢI CÓ HÀM THỨ HAI — lỗi này đã lên tới màn hình (02/09).
 * `viecTre()` trả lời đúng câu hỏi của nó: *"mốc kết thúc đã trôi qua chưa"*. Nhưng màn
 * hình hỏi câu KHÁC: *"việc nào đang có vấn đề"*. Một việc ĐÃ XONG hôm qua thì hạn của nó
 * trôi qua là chuyện bình thường, không phải báo động. Dùng `viecTre()` cho ô đếm là biến
 * mọi việc đã hoàn tất thành một con số đỏ — **báo động giả có quy mô**, đúng thứ họ lỗi
 * mà cả module này sinh ra để chống.
 *
 * Bảng việc ĐÃ CÓ sẵn luật này ở `board.countOverdue()` (nó loại cột `isDone`); dải Gantt
 * thì không, nên hai chỗ trên CÙNG MỘT MÀN đếm theo hai luật khác nhau. Hàm này kéo dải về
 * đúng luật đã có — không đẻ luật thứ hai (luật 6).
 *
 * ⚠️ Ghi lại một chỗ suýt tự lừa: lượt đo đầu tiên hai con số BẰNG NHAU (17 = 17), và tôi
 * đã tính đó là kiểm chéo. Không phải: lô việc gieo lúc đó nằm hết ở cột đầu, KHÔNG việc
 * nào `isDone`, nên hai luật khác nhau tình cờ ra cùng một số. Số trùng nhau không chứng
 * minh hai đường tính giống nhau.
 *
 * `idDaXong` là tập `statusId` của các cột đã Xong — nơi gọi tự dựng từ `WorkflowStateRow`,
 * hàm này không biết gì về schema.
 */
export function viecTreChuaXong(
  dai: DaiGantt,
  bayGio: number,
  trangThaiCuaViec: ReadonlyMap<string, string>,
  idDaXong: ReadonlySet<string>,
): ThanhGantt[] {
  return dai.thanh.filter((b) => {
    if (b.ketThuc >= bayGio) return false;
    const tt = trangThaiCuaViec.get(b.id);
    return tt === undefined || !idDaXong.has(tt);
  });
}

/** Một ô NGÀY trên nền dải — để vẽ lưới thời gian và tô cuối tuần. */
export interface ONgayGantt {
  /** mốc 0h UTC của ngày đó */
  ms: number;
  traiPhanTram: number;
  rongPhanTram: number;
  /** thứ Bảy hoặc Chủ nhật */
  cuoiTuan: boolean;
  /** thứ Hai — chỗ kẻ vạch tuần */
  dauTuan: boolean;
}

/**
 * Chia cửa sổ thành các ô NGÀY. Không có lưới thì mắt không đọc được một thanh dài bao
 * nhiêu — đó là khác biệt giữa "dải Gantt" và "mấy vạch màu".
 *
 * Mốc ngày tính theo **UTC**, cùng hệ với `dueAt`/`startAt` (ISO). Trộn UTC với giờ máy là
 * đúng ca đã trả giá ở khối phiếu 30/08 (dấu 19:05 giờ máy cạnh dấu 12:05 UTC ⇒ người đọc
 * kết luận sai 7 tiếng). Một khối, một hệ giờ.
 *
 * Ô đầu và ô cuối bị CẮT theo cửa sổ (cửa sổ bắt đầu giữa ngày là chuyện thường), nên tổng
 * bề rộng luôn đúng 100% chứ không tràn.
 */
export function chiaNgay(cuaSo: CuaSoGantt): ONgayGantt[] {
  const nhip = cuaSo.ketThuc - cuaSo.batDau;
  if (nhip <= 0) return [];
  const o: ONgayGantt[] = [];
  const dauNgay = Math.floor(cuaSo.batDau / MOT_NGAY_MS) * MOT_NGAY_MS;
  for (let t = dauNgay; t < cuaSo.ketThuc; t += MOT_NGAY_MS) {
    const trai = Math.max(0, ((t - cuaSo.batDau) / nhip) * 100);
    const phai = Math.min(100, ((t + MOT_NGAY_MS - cuaSo.batDau) / nhip) * 100);
    if (phai <= trai) continue;
    const thu = new Date(t).getUTCDay();
    o.push({ ms: t, traiPhanTram: trai, rongPhanTram: phai - trai, cuoiTuan: thu === 0 || thu === 6, dauTuan: thu === 1 });
  }
  return o;
}
