/**
 * lib/capabilities/nguon-anh.ts — SỔ NGUỒN của lát cắt dọc
 * `SOURCE → VISUAL GENERATE → PREVIEW → COMPARE → ACCEPT`.
 *
 * Giữ đúng ba thứ, không hơn: **ảnh nguồn đang chọn** · **các đề xuất máy vừa sinh** ·
 * **các kết quả người đã nhận**. Không giữ tiến trình (đó là việc của `visual-generate-run.ts`),
 * không giữ job (đó là `useFlowStore.flowRuns` — §20 cấm job model thứ hai).
 *
 * ── VÌ SAO KHÔNG DÙNG `useFlowStore` (negative evidence) ───────────────────────────────────────
 * `useFlowStore` là sổ của ĐỒ THỊ NODE: nodes/edges/jobs/flowRuns/undo. Ảnh nguồn của Toolbelt
 * KHÔNG phải một node và không được là một node — nhét vào đó thì mỗi lần chọn ảnh là một lần
 * ghi vào undo stack và vào bản lưu `.idf`, tức **cách bày trên màn của tôi** rơi vào **bản lưu
 * chung** (luật lưu chung↔máy, 16/08). Nên đây là một sổ riêng, cố ý bé, cố ý phù du.
 *
 * ── VÌ SAO THUẦN, KHÔNG ZUSTAND ────────────────────────────────────────────────────────────────
 * Đủ cho `useSyncExternalStore`: `subscribe` + `getSnapshot`. Không kéo thư viện, và test được
 * thẳng bằng `sucrase-node` (không cần React).
 *
 * ⛔ Kết quả máy sinh vào `deXuat`, KHÔNG tự nhảy sang `daNhan` và KHÔNG tự thay `anhNguon`.
 *    Tự thay chính là "ghi đè im lặng" mà §19 cấm. Chỉ `nhanDeXuat()` — tức một cú bấm — mới đổi.
 */

import { boKetQua, nhanKetQua, type DeXuatHinhAnh, type KieuNguon } from './visual-generate';
import { ghiXuatXuBen } from './xuat-xu-ben';

export interface NguonAnhState {
  readonly anhNguon?: string;
  readonly tenNguon?: string;
  readonly kieuNguon: KieuNguon;
  /** Đề xuất chưa quyết — hiện ở cửa duyệt. */
  readonly deXuat: readonly DeXuatHinhAnh[];
  /** Đã nhận — mang xuất xứ `daNhan`. Đây là thứ được phép đi tiếp vào dự án. */
  readonly daNhan: readonly DeXuatHinhAnh[];
}

const BAN_DAU: NguonAnhState = { kieuNguon: 'phac', deXuat: [], daNhan: [] };

let state: NguonAnhState = BAN_DAU;
const nguoiNghe = new Set<() => void>();

function dat(next: NguonAnhState) {
  state = next;
  for (const f of nguoiNghe) f();
}

export function subscribeNguonAnh(f: () => void): () => void {
  nguoiNghe.add(f);
  return () => nguoiNghe.delete(f);
}

export function getNguonAnh(): NguonAnhState {
  return state;
}

export function datAnhNguon(anh: string, ten?: string) {
  dat({ ...state, anhNguon: anh, tenNguon: ten });
}

export function datKieuNguon(kieu: KieuNguon) {
  dat({ ...state, kieuNguon: kieu });
}

export function themDeXuat(d: DeXuatHinhAnh) {
  dat({ ...state, deXuat: [...state.deXuat, d] });
}

/**
 * NHẬN một đề xuất: ghi xuất xứ `daNhan`, chuyển sang danh sách đã nhận, **và** để nó thành ảnh
 * nguồn cho bước kế — đúng chuỗi công đoạn (kết quả một bước là đầu vào đã-định-nghĩa của bước
 * sau). Việc thay nguồn xảy ra ở ĐÂY và chỉ ở đây, vì đây là chỗ có cú bấm của người.
 *
 * ── GHI BỀN (cờ `IF_PERSIST_XUATXU=1`) ────────────────────────────────────────────────────────
 * Đây là **chỗ DUY NHẤT có cú bấm của người**, nên cũng là chỗ duy nhất đáng ghi xuống nơi bền.
 * Sổ này sống trong RAM: F5 là mất — trong khi `/api/jobs` đã trừ tiền BỀN vào DB. Tiền bền mà
 * kết quả bay hơi là lời hứa gãy, nên `XuatXu` (nhẹ) được ghi xuống `xuat-xu-ben.ts`.
 *
 * ⛔ Ghi bền **KHÔNG được** đứng chắn giữa cú bấm và trạng thái: `dat()` chạy TRƯỚC, việc ghi là
 *    `void` (không `await`) và hàm ghi tự hứa không bao giờ ném. Người bấm Nhận thì nhận được
 *    ảnh, kể cả khi kho hỏng. Sự cố ghi đi ra `subscribeSuCoGhi()`, **không** bị nuốt im lặng.
 */
export function nhanDeXuat(id: string) {
  const d = state.deXuat.find((x) => x.id === id);
  if (!d) return;
  const daNhan: DeXuatHinhAnh = { ...d, xuatXu: nhanKetQua(d.xuatXu) };
  dat({
    ...state,
    anhNguon: daNhan.anh,
    tenNguon: 'Kết quả đã nhận',
    // Sau khi nhận, ảnh trong tay là một BẢN KẾT XUẤT — không còn là nét phác nữa.
    kieuNguon: 'anhThat',
    deXuat: state.deXuat.filter((x) => x.id !== id),
    daNhan: [...state.daNhan, daNhan],
  });
  // Sau khi trạng thái đã đổi — thứ tự này là hợp đồng, không phải tình cờ.
  try {
    void ghiXuatXuBen({ id: daNhan.id, xuatXu: daNhan.xuatXu, anhKetQua: daNhan.anh });
  } catch {
    /* `ghiXuatXuBen` đã tự hứa không ném; đây là lưới thứ hai để cú bấm Nhận không bao giờ rơi */
  }
}

/** BỎ một đề xuất. Vẫn đi qua `boKetQua()` để trạng thái được ghi, rồi mới rời danh sách. */
export function boDeXuat(id: string) {
  const d = state.deXuat.find((x) => x.id === id);
  if (!d) return;
  void boKetQua(d.xuatXu);
  dat({ ...state, deXuat: state.deXuat.filter((x) => x.id !== id) });
}

/** Dọn sạch — dùng trong test và khi đóng cửa duyệt để không để lại rác trạng thái. */
export function resetNguonAnh() {
  dat(BAN_DAU);
}
