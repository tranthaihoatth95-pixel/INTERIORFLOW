'use client';

/**
 * components/render-studio/scene3d-ui.ts — STATE **CHỈ-GIAO-DIỆN** của mode "3D" (chặng Thiết kế
 * 3D). Hai store rời nhau + vài bảng tra dùng chung.
 *
 * ⛔ **KHÔNG CHỨA DỮ LIỆU DỰ ÁN.** Tầng/loại tường/đèn đều sống trong `Doc` (`Doc.levels`,
 * `Doc.wallTypes`, `Doc.lighting`) và giải bằng hàm thuần của PHU (`lib/cad/levels.ts`,
 * `lib/cad/wall-types.ts`, `lib/three/lighting.ts`). File này chỉ giữ thứ KHÔNG thuộc về tệp
 * người dùng: "đang ẩn tầng nào", "đang mở chế độ mặt trời nào".
 *
 * ⚠️ VÌ SAO NẰM Ở `components/` chứ không `lib/render-studio/` (cạnh `tree3d-ui.ts` cùng loại):
 * phiếu CẤM đụng `lib/*`. Khi PHU mở cửa thì dời sang đó, đổi import, không đổi logic.
 *
 * ⚠️ VÌ SAO PHẢI LÀ STORE: `Object3DTree` (ổ ② Navigator) và `Object3DInspector` (ổ ④) là ổ
 * SIBLING của `AppShell`, không chung cây React cha gần với `Render3DModeSkeleton` (ổ ③) — cùng
 * lý do đã ghi ở `lib/render-studio/tree3d-ui.ts`.
 */

import { create } from 'zustand';
import type { RoomLightKind, SunLight, SkyLight } from '@/lib/three/lighting';

/* ────────────────────────────── ① TẦNG — ẩn/hiện trong khung nhìn ────────────────────────────── */

/** Khoá của nhóm "chưa xếp tầng" — cùng hằng số `Object3DTree` dùng để gom bucket. */
export const UNASSIGNED_LEVEL = '__unassigned';

/**
 * ⚠️ KHOÁ Ở ĐÂY LÀ **NHÃN `storey`**, KHÔNG PHẢI `Level.id`. Lý do đo được: `Scene3DGroup`
 * (`lib/three/cad-to-obj.ts:151`) chỉ mang `storey?: string`, KHÔNG có `levelId`. Muốn ẩn theo
 * đúng `Level.id` thì `cad-to-obj.ts` phải chuyển thêm `levelId` xuống group — file của PHU ⇒ ghi
 * thành đề nghị trong báo cáo, không tự sửa. Sau migration v1→v2 thì `Level.name` === nhãn
 * `storey` nên hai bên khớp; ca lệch duy nhất là đổi TÊN tầng mà entity còn giữ `storey` cũ.
 */
interface LevelUiState {
  hiddenLevels: Set<string>;
  toggleLevel: (key: string) => void;
  showAllLevels: () => void;
}

export const useLevelUi = create<LevelUiState>((set) => ({
  hiddenLevels: new Set(),
  toggleLevel: (key) =>
    set((s) => {
      const next = new Set(s.hiddenLevels);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { hiddenLevels: next };
    }),
  showAllLevels: () => set({ hiddenLevels: new Set() }),
}));

/* ─────────────────────────── ② MẶT TRỜI — tham số CHỈNH, không phải dữ liệu ─────────────────── */

/**
 * Hai chế độ đặt nắng, **đúng bộ đôi của Revit Sun Settings** (§0b bước 2 — không tự nghĩ ra):
 *  - `manual`   — gõ thẳng phương vị + cao độ góc. Luôn dùng được, không cần khai gì.
 *  - `datetime` — theo NGÀY GIỜ THẬT tại VỊ TRÍ THẬT, qua `sunLightFromDateTime()` (NOAA/Meeus
 *                 của PHU). Cần vĩ độ · kinh độ · ngày ⇒ chưa khai thì chưa bật được.
 *
 * ⛔ **LỖI THỜI — ĐÃ SỬA 22/08.** Docstring cũ ở đây từng ghi: *"VỊ TRÍ CÔNG TRÌNH VÀ HƯỚNG BẮC
 * CHƯA CÓ CHỖ LƯU TRONG `Doc` … nên chúng sống ở đây, MẤT KHI ĐÓNG APP"*, và store từng giữ
 * `latDeg` · `lngDeg` · `northDeg`. Đó đúng là "3DLocation" — 3D tự sở hữu sự thật cấp dự án
 * trong state giao diện của riêng nó. **Nay 3D THÔI SỞ HỮU, chỉ ĐỌC.**
 *   · nơi ở đúng của vị trí/hướng: `HoSoDiaDiem` (`lib/site/types.ts`), lưu qua
 *     `PATCH /api/projects/<id>/site`, đọc qua `components/site/dia-diem-client.ts`;
 *   · nắng thật: `lib/site/solar.ts#trangThaiNang` — KHÔNG có công thức mặt trời thứ hai.
 * Ba khoá còn lại (`mode` · `dateIso` · `hour`) ở lại đây **có lý do**: chúng là *đang xem lúc mấy
 * giờ*, tức cách nhìn của một người trước một màn hình — không phải sự thật của công trình.
 *
 * ⚠️ Hướng Bắc KHÔNG được gộp vào `SunLight.azimuthDeg` khi ghi xuống `Doc`: hợp đồng của PHU ghi
 * rõ phương vị đo **từ hướng Bắc địa lý** (`lighting.ts:42`). Gộp vào là biến field đó thành
 * "phương vị trong mặt bằng" — hai nghĩa cho một ô, đúng kiểu lỗi mà `sunDirectionCad` cảnh báo
 * ("chỗ dễ sai gương/lệch 90°"). Bắc chỉ xoay kim la bàn trên màn, và nay nó đọc từ
 * `HoSoDiaDiem.huong.bacThatDeg`.
 */
export type SunMode = 'manual' | 'datetime';

/**
 * ⛔ **KHÔNG THÊM `latDeg`/`lngDeg`/`northDeg` VÀO ĐÂY LẦN NỮA.** Chúng đã bị gỡ 22/08 và chuyển
 * về `HoSoDiaDiem` của dự án. Thêm lại là dựng nguồn sự thật thứ hai cho cùng một sự thật.
 */
interface SunUiState {
  mode: SunMode;
  /** 'YYYY-MM-DD'. Rỗng = chưa chọn. Cố ý KHÔNG mặc định `new Date()` — giá trị khác nhau giữa
   * lần render trên máy chủ và trên trình duyệt sẽ gây hydration mismatch thật. */
  dateIso: string;
  /** giờ đồng hồ địa phương 0–24, cho phép lẻ (13.5 = 13h30). */
  hour: number;
  set: (patch: Partial<Omit<SunUiState, 'set'>>) => void;
}

export const useSunUi = create<SunUiState>((set) => ({
  mode: 'manual',
  dateIso: '',
  hour: 10,
  set: (patch) => set(patch),
}));

/**
 * Đủ điều kiện tính nắng thật chưa: dự án đã có toạ độ **và** đã chọn ngày.
 * Toạ độ đến từ hồ sơ dự án (`coToaDo(hoSo)`), KHÔNG từ store này nữa.
 */
export function canUseDateTime(coToaDoDuAn: boolean, dateIso: string): boolean {
  return coToaDoDuAn && dateIso !== '';
}

/* ─────────────────────────────────── ③ BẢNG TRA DÙNG CHUNG ──────────────────────────────────── */

/**
 * Bốn loại đèn phiếu liệt kê (trần · hắt · dây · rọi) khớp 1-1 với `RoomLightKind` của PHU
 * (`ceiling | wall | strip | spot`) — KHÔNG khai thêm loại nào ngoài hợp đồng đó.
 *
 * `lumens` mặc định là **quang thông thật đọc được trên hộp đèn**, không phải thang 0–100:
 * downlight trần âm 9–12W ≈ 800lm · đèn hắt cove LED ≈ 500lm/bộ · đèn dây thả bàn ăn ≈ 450lm ·
 * đèn rọi tranh MR16 ≈ 400lm. Người dùng sửa được; đây chỉ là điểm khởi đầu quen tay.
 */
export const ROOM_LIGHT_KINDS: { id: RoomLightKind; vi: string; en: string; lumens: number; colorK: number }[] = [
  { id: 'ceiling', vi: 'Đèn trần', en: 'Ceiling', lumens: 800, colorK: 3000 },
  { id: 'wall', vi: 'Đèn hắt', en: 'Wall wash', lumens: 500, colorK: 2700 },
  { id: 'strip', vi: 'Đèn dây', en: 'Strip', lumens: 450, colorK: 2700 },
  { id: 'spot', vi: 'Đèn rọi', en: 'Spot', lumens: 400, colorK: 3000 },
];

/** Cao độ mặc định theo loại đèn (mm so với mặt tầng) — trần 2700 (mặt trần điển hình), hắt 2500,
 * dây thả 1500 trên mặt bàn ăn, rọi 2600. Đặt sẵn cho đúng chỗ còn hơn thả tất cả xuống z=0. */
export const ROOM_LIGHT_DEFAULT_Z_MM: Record<RoomLightKind, number> = {
  ceiling: 2700,
  wall: 2500,
  strip: 2500,
  spot: 2600,
};

/**
 * Danh mục bầu trời — **TÊN LOẠI, chưa có tệp HDRI nào trong repo** (`ls public/` không có thư mục
 * hdri, `grep -rn "\.hdr" public app` = 0). Đây là KHOÁ tra đúng nghĩa `SkyLight.hdriId` mà PHU
 * khai ("chuỗi id, KHÔNG phải đường dẫn file") — nhưng thư viện phía sau chưa có, ghi rõ trên UI
 * để không ai tưởng bấm vào là đổi được nền trời ngay (N4/N5). Tên trung tính, không địa danh.
 */
export const HDRI_OPTIONS: { id: string; vi: string; en: string }[] = [
  { id: 'clear', vi: 'Trời quang', en: 'Clear sky' },
  { id: 'overcast', vi: 'Nhiều mây', en: 'Overcast' },
  { id: 'sunset', vi: 'Hoàng hôn', en: 'Sunset' },
  { id: 'night', vi: 'Đêm', en: 'Night' },
  { id: 'studio', vi: 'Studio trong nhà', en: 'Indoor studio' },
];

export type LightPresetId = 'sang' | 'trua' | 'chieu' | 'dem';

/**
 * Bốn cảnh sáng phiếu yêu cầu. Đặt bằng **phương vị + cao độ góc trực tiếp** (chế độ `manual`) nên
 * dùng được NGAY cả khi chưa khai vị trí công trình — preset là "đặt nhanh một kiểu nắng", không
 * phải "mô phỏng ngày X tại nơi Y" (muốn số thật thì chuyển sang chế độ theo ngày giờ).
 *
 * Preset **KHÔNG đụng đèn phòng của người dùng** — kể cả `dem`. Nó chỉ hạ mặt trời xuống dưới
 * đường chân trời; bật đèn nào trong nhà là quyền của người dùng, không phải việc của preset.
 */
export const LIGHT_PRESETS: {
  id: LightPresetId;
  vi: string;
  en: string;
  sun: Pick<SunLight, 'azimuthDeg' | 'altitudeDeg' | 'intensity' | 'colorK'>;
  sky: Pick<SkyLight, 'hdriId' | 'intensity'>;
}[] = [
  { id: 'sang', vi: 'Nắng sớm', en: 'Early sun', sun: { azimuthDeg: 95, altitudeDeg: 18, intensity: 0.9, colorK: 4200 }, sky: { hdriId: 'clear', intensity: 0.9 } },
  { id: 'trua', vi: 'Trưa', en: 'Midday', sun: { azimuthDeg: 180, altitudeDeg: 72, intensity: 1.2, colorK: 5600 }, sky: { hdriId: 'clear', intensity: 1.2 } },
  { id: 'chieu', vi: 'Chiều vàng', en: 'Golden hour', sun: { azimuthDeg: 262, altitudeDeg: 9, intensity: 0.8, colorK: 2600 }, sky: { hdriId: 'sunset', intensity: 0.8 } },
  { id: 'dem', vi: 'Đêm + đèn trong nhà', en: 'Night + interior', sun: { azimuthDeg: 300, altitudeDeg: -12, intensity: 0.15, colorK: 6500 }, sky: { hdriId: 'night', intensity: 0.2 } },
];

/* ───────────────────────────────────── ④ ĐỊNH DẠNG SỐ ───────────────────────────────────────── */

/**
 * Số có dấu phân cách nghìn — MỘT chỗ định dạng cho cao độ tầng, toạ độ đèn, quang thông, Kelvin.
 * `vi-VN` (nhóm bằng dấu chấm) đồng bộ với chỗ đã có sẵn (`Object3DInspector`).
 *
 * `decimals > 0` cho đại lượng KHÔNG nguyên (vĩ độ/kinh độ) — `vi-VN` in dấu thập phân là dấu
 * PHẨY, nên `21,03` chứ không phải `21.03`.
 */
export function formatThousands(n: number, decimals = 0): string {
  return n.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

/**
 * Đọc lại số người dùng gõ. Trả `null` khi không đọc ra số — nơi gọi tự quyết giữ giá trị cũ.
 *
 * 🔴 **BẮT ĐƯỢC LÚC VERIFY (05/08), không phải lo xa**: bản đầu bỏ MỌI dấu `.` như dấu phân nhóm
 * ⇒ gõ vĩ độ `21.03` ra **2103**, bị kẹp thành 90° (cực Bắc) ⇒ `sunFromDateTime()` rơi đúng nhánh
 * suy biến `|cos(lat)| < 1e-9` và trả phương vị 180 cứng. Mặt trời vẫn "chạy" nhưng SAI HOÀN TOÀN
 * — kiểu lỗi nhìn như thật, tệ nhất. ⇒ Ô nào có phần thập phân PHẢI khai `decimals`:
 *  - `decimals = 0` (mặc định): `.` `,` khoảng trắng đều là dấu phân NHÓM, bỏ hết. '3.300' → 3300.
 *  - `decimals > 0`: `.` và `,` đều là dấu THẬP PHÂN (bàn phím số gõ `.`, người Việt gõ `,`);
 *    chỉ dấu CUỐI CÙNG tính là thập phân, dấu trước đó là phân nhóm. '1.234,5' → 1234.5.
 */
export function parseThousands(raw: string, decimals = 0): number | null {
  let s = raw.replace(/\s/g, '');
  if (decimals > 0) {
    s = s.replace(/,/g, '.');
    const last = s.lastIndexOf('.');
    if (last >= 0) s = `${s.slice(0, last).replace(/\./g, '')}.${s.slice(last + 1)}`;
  } else {
    s = s.replace(/[.,]/g, '');
  }
  if (s === '' || s === '-' || s === '.' || s === '-.') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
