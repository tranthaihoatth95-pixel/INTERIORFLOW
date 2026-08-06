/**
 * lib/three/lighting.ts — LÕI CHIẾU SÁNG, **thuần tham số**. Hàm THUẦN (không React/DOM/three.js),
 * test độc lập: `node_modules/.bin/sucrase-node lib/three/lighting.test.ts`.
 *
 * §0b SEARCH trước khi viết: `ls lib/three | grep -iE "light|sun|env"` = **0 file**; grep toàn repo
 * `sunlight|skylight|buildLightRig|azimuth|hdri` = 0 kết quả trong mã sản phẩm ⇒ đây là file MỚI
 * thật, không đập lên thứ đang chạy (§0d). Thứ DUY NHẤT đã tồn tại liên quan tới "đèn":
 *  - `lib/cad/mep-suggest.ts` `suggestRoomLightingPlans()` — **việc KHÁC HẲN**: rải vị trí đèn
 *    trên MẶT BẰNG theo lux tiêu chuẩn (hồ sơ M&E 2D). File này lo NGUỒN SÁNG cho ảnh 3D. Hai
 *    thứ có thể nối sau (plan M&E → `RoomLight[]`) nhưng KHÔNG gộp làm một, và tôi KHÔNG đụng nó.
 *  - `components/three/material-preview.ts` — `RoomEnvironment` cho quả cầu vật liệu, phạm vi G4.
 *
 * ⛔ **KHÔNG TẠO OBJECT THREE** (yêu cầu phiếu). `buildLightRig()` trả về DỮ LIỆU MÔ TẢ đèn
 * (hướng, vị trí, màu, cường độ) — nơi gọi ở tầng viewer tự dựng `DirectionalLight`/`PointLight`.
 * Lý do kiến trúc: giữ đúng luật "hàm thuần test được không cần WebGL", cùng khuôn
 * `docToObjScene()` (trả `SceneGroup[]`, không trả `THREE.Mesh`).
 *
 * ⚠️ **KHÔNG BỊA SỐ THIÊN VĂN** (§0/N4). Vị trí mặt trời dùng **thuật toán NOAA Solar Calculator**
 * (rút từ Jean Meeus, *Astronomical Algorithms*, 2nd ed. — cùng bộ công thức NOAA ESRL công bố).
 * Từng bước ghi rõ tên đại lượng bên dưới để đối chiếu được với bảng gốc, không phải hằng số chép
 * mù. Sai số công bố của bộ công thức này: khoảng **±0,1° cho năm 1800–2100** — thừa cho việc đổ
 * bóng nắng kiến trúc (bóng lệch ~vài cm trên 10m). Test đối chiếu bằng SỰ KIỆN THIÊN VĂN ĐO ĐƯỢC
 * (xích vĩ tại 2 chí/2 phân, phương trình thời gian tại 4 mốc, cao độ trưa = 90−|vĩ độ−xích vĩ|),
 * KHÔNG tự nghiệm bằng chính công thức mình vừa viết.
 */

import type { Doc } from '../cad/model';
import { levelById } from '../cad/levels';
import { cadAxesToThree } from './cad-to-obj';

/* ═════════════════════════ 1 · KIỂU THAM SỐ (vào Doc) ═════════════════════════ */

/** Điểm 3D mm trong hệ CAD (x Đông, y Bắc, z lên) — `Pt` của `model.ts` chỉ có 2 chiều. */
export interface Pt3Mm {
  x: number;
  y: number;
  z: number;
}

/**
 * MẶT TRỜI — nguồn sáng có hướng, không có vị trí (tia song song).
 *  - `azimuthDeg`: phương vị, **độ, tính THEO CHIỀU KIM ĐỒNG HỒ TỪ HƯỚNG BẮC** (0=Bắc · 90=Đông ·
 *    180=Nam · 270=Tây) — quy ước của NOAA và của mọi phần mềm kiến trúc (Revit/SketchUp/D5).
 *  - `altitudeDeg`: cao độ góc trên đường chân trời (0=mọc/lặn, 90=đỉnh đầu). **Âm = đã lặn.**
 *  - `intensity`: hệ số tương đối do người dùng chỉnh (KHÔNG phải lux — app chưa có mô hình trắc
 *    quang thật; đặt tên "intensity" đúng nghĩa "núm chỉnh", không giả vờ là đơn vị vật lý).
 *  - `colorK`: nhiệt độ màu Kelvin (~2000K nắng chiều, ~5500K trưa).
 */
export interface SunLight {
  azimuthDeg: number;
  altitudeDeg: number;
  intensity: number;
  colorK: number;
}

/**
 * BẦU TRỜI / môi trường. `hdriId` là KHOÁ tra trong thư viện HDRI (chuỗi id, KHÔNG phải đường dẫn
 * file — file nằm ở tầng asset, đổi chỗ lưu không được phá `.idf` của người dùng). undefined =
 * chưa chọn HDRI, nơi gọi tự dùng môi trường mặc định (hôm nay là `RoomEnvironment`).
 * `rotationDeg` xoay HDRI quanh trục đứng, cùng quy ước phương vị của `SunLight`.
 */
export interface SkyLight {
  hdriId?: string;
  intensity: number;
  rotationDeg: number;
}

export type RoomLightKind = 'ceiling' | 'wall' | 'strip' | 'spot';

/**
 * ĐÈN TRONG NHÀ — đây là chỗ "BIM nội thất" ăn tiền (`00-BAT-DAU-DOC-DAY.md` §1): hắt trần, rọi
 * tranh, đèn thả bàn ăn là thứ Revit/ArchiCAD làm dở nhất.
 *
 * ⚠️ `posMm.z` là **cao độ TƯƠNG ĐỐI so với mặt tầng** khi có `levelId` (cùng ngữ nghĩa
 * `baseConstraint.offsetMm` — đèn trần cao 2700 so với sàn tầng nào cũng là 2700). Không có
 * `levelId` ⇒ z là cao độ TUYỆT ĐỐI. `buildLightRig()` giải ra số tuyệt đối, xem `RigRoomLight.posCadMm`.
 *
 * `lumens` là quang thông thật của bóng (đọc được trên hộp đèn — đúng ngôn ngữ người làm nghề,
 * không bắt họ quy đổi sang "intensity" trừu tượng). `targetMm` chỉ có nghĩa với `spot`/`wall`
 * (đèn rọi cần biết rọi vào đâu); `ceiling`/`strip` bỏ qua.
 */
export interface RoomLight {
  id: string;
  kind: RoomLightKind;
  posMm: Pt3Mm;
  targetMm?: Pt3Mm;
  lumens: number;
  colorK: number;
  levelId?: string;
}

/** Toàn bộ chiếu sáng của 1 bản vẽ — gắn vào `Doc.lighting` (`lib/cad/model.ts`). additive:
 * `.idf` cũ không có field này ⇒ `buildLightRig()` trả bộ mặc định, không sập. */
export interface DocLighting {
  sun: SunLight;
  sky: SkyLight;
  rooms: RoomLight[];
}

/** Mặc định khi `Doc.lighting` chưa có: nắng chếch Đông-Nam buổi sáng, KHÔNG phải số thiên văn của
 * ngày nào cả — chỉ là điểm khởi đầu dễ nhìn, người dùng bấm "theo ngày giờ thật" thì
 * `sunFromDateTime()` ghi đè. Ghi rõ để không ai tưởng đây là dữ liệu đo được (N4). */
export const DEFAULT_SUN: SunLight = { azimuthDeg: 135, altitudeDeg: 45, intensity: 1, colorK: 5500 };
export const DEFAULT_SKY: SkyLight = { intensity: 1, rotationDeg: 0 };

/* ═════════════════════════ 2 · VỊ TRÍ MẶT TRỜI (NOAA) ═════════════════════════ */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** Chuẩn hoá góc về [0,360). */
function norm360(d: number): number {
  return ((d % 360) + 360) % 360;
}

/**
 * Julian Day từ mốc thời gian UTC. Quan hệ chuẩn với epoch Unix: JD = ms/86400000 + 2440587.5
 * (2440587.5 = JD của 1970-01-01T00:00:00Z). Chính xác tuyệt đối, không phải xấp xỉ — nên KHÔNG
 * dùng công thức lịch Gregorian chép tay (dễ sai ở tháng 1/2 và năm nhuận).
 */
export function julianDayFromMs(ms: number): number {
  return ms / 86400000 + 2440587.5;
}

export interface SunPosition {
  /** phương vị, độ, thuận kim đồng hồ từ Bắc (0..360). */
  azimuthDeg: number;
  /** cao độ góc, độ. ÂM = mặt trời đã lặn. */
  altitudeDeg: number;
  /** xích vĩ mặt trời, độ (±23,44° tại 2 chí, ~0 tại 2 phân) — trả ra để đối chiếu/hiển thị. */
  declinationDeg: number;
  /** phương trình thời gian, PHÚT (chênh giữa giờ mặt trời thật và giờ mặt trời trung bình). */
  equationOfTimeMin: number;
  /** múi giờ THỰC SỰ đã dùng (giờ), sau khi áp mặc định theo kinh độ. */
  tzOffsetHours: number;
}

/**
 * VỊ TRÍ MẶT TRỜI theo thuật toán **NOAA Solar Calculator** (Meeus). Từng biến giữ đúng tên gốc
 * trong bảng NOAA để đối chiếu được.
 *
 * @param lat  vĩ độ, độ (Bắc dương). VD Hà Nội 21.0285
 * @param lng  kinh độ, độ (**Đông dương** — quy ước NOAA hiện hành; chú ý bảng NOAA đời cũ dùng
 *             Tây-dương, chép nhầm là lệch gương toàn bộ phương vị)
 * @param date ngày — **đọc Y/M/D theo UTC** (`getUTCFullYear/Month/Date`) để kết quả KHÔNG phụ
 *             thuộc múi giờ của máy đang chạy (test chạy ở máy Hoà UTC+7 và ở CI UTC phải ra cùng
 *             một số). ⚠️ Vì vậy `new Date(2026, 5, 21)` (nửa đêm GIỜ MÁY) ở UTC+7 sẽ ra ngày
 *             **20/6** theo UTC — hãy dựng bằng `new Date(Date.UTC(2026, 5, 21))`.
 * @param hour giờ ĐỒNG HỒ ĐỊA PHƯƠNG (có thể lẻ, VD 13.5 = 13h30)
 * @param tzOffsetHours múi giờ. Bỏ trống ⇒ suy từ kinh độ `Math.round(lng/15)` — đúng cho VN
 *             (105.85/15 → 7 = UTC+7). Đây là XẤP XỈ ranh giới múi giờ hành chính, KHÔNG tra
 *             database IANA; nơi nào cần chuẩn từng nước thì truyền tay.
 */
export function sunFromDateTime(
  lat: number,
  lng: number,
  date: Date,
  hour: number,
  tzOffsetHours?: number,
): SunPosition {
  const tz = tzOffsetHours ?? Math.round(lng / 15);

  // Mốc UTC = nửa đêm UTC của ngày đó + (giờ địa phương − múi giờ).
  const midnightUtcMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const ms = midnightUtcMs + (hour - tz) * 3600000;

  const jd = julianDayFromMs(ms);
  // T — thế kỷ Julian từ J2000.0
  const T = (jd - 2451545) / 36525;

  // L0 — kinh độ trung bình hình học của Mặt Trời (độ)
  const L0 = norm360(280.46646 + T * (36000.76983 + T * 0.0003032));
  // M — dị thường trung bình (độ)
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  // e — tâm sai quỹ đạo Trái Đất (không thứ nguyên)
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  // C — phương trình tâm (độ)
  const C =
    Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M * RAD) * 0.000289;
  // O — kinh độ thật; λ — kinh độ biểu kiến (đã hiệu chỉnh chương động + quang sai)
  const O = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = O - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  // ε0 — độ nghiêng trung bình hoàng đạo; ε — sau hiệu chỉnh
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);

  // δ — xích vĩ
  const declinationDeg = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) * DEG;

  // EoT — phương trình thời gian (phút)
  const y = Math.tan((eps / 2) * RAD) ** 2;
  const eqTime =
    4 *
    DEG *
    (y * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD));

  // Giờ mặt trời thật (phút trong ngày) → góc giờ.
  // NOAA: TST = mod(giờ_địa_phương_phút + EoT + 4*lng − 60*tz, 1440); (giờ_địa_phương − 60*tz) = UTC.
  const utcMinutes = (hour - tz) * 60;
  const tst = ((utcMinutes + eqTime + 4 * lng) % 1440 + 1440) % 1440;
  const hourAngle = tst / 4 - 180; // độ; âm = trước trưa mặt trời

  const latR = lat * RAD;
  const decR = declinationDeg * RAD;
  const haR = hourAngle * RAD;

  // Thiên đỉnh
  const cosZen = Math.min(1, Math.max(-1, Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(haR)));
  const zenith = Math.acos(cosZen);
  const altitudeDeg = 90 - zenith * DEG;

  // Phương vị (NOAA): qua acos rồi lật theo dấu góc giờ.
  const sinZen = Math.sin(zenith);
  let azimuthDeg: number;
  if (Math.abs(sinZen) < 1e-9 || Math.abs(Math.cos(latR)) < 1e-9) {
    // Mặt trời đúng đỉnh đầu, hoặc quan sát tại cực — phương vị suy biến (mọi hướng như nhau).
    // Trả 180 (Nam) làm quy ước thay vì NaN; nơi gọi không cần xử lý ca đặc biệt.
    azimuthDeg = 180;
  } else {
    const cosAz = Math.min(1, Math.max(-1, (Math.sin(latR) * cosZen - Math.sin(decR)) / (Math.cos(latR) * sinZen)));
    const az = Math.acos(cosAz) * DEG;
    azimuthDeg = hourAngle > 0 ? norm360(az + 180) : norm360(540 - az);
  }

  return { azimuthDeg, altitudeDeg, declinationDeg, equationOfTimeMin: eqTime, tzOffsetHours: tz };
}

/**
 * Vector đơn vị TRỎ TỪ GỐC RA PHÍA MẶT TRỜI, hệ CAD (x Đông, y Bắc, z lên).
 * Phương vị thuận kim đồng hồ từ Bắc ⇒ x = sin(az), y = cos(az) (KHÔNG phải cos/sin như hệ toán
 * học ngược kim đồng hồ từ Đông — đây đúng là chỗ dễ sai gương/lệch 90°).
 * Đèn hướng trong three.js cần vector NGƯỢC lại (từ mặt trời chiếu xuống) — xem `buildLightRig`.
 */
export function sunDirectionCad(sun: Pick<SunLight, 'azimuthDeg' | 'altitudeDeg'>): Pt3Mm {
  const az = sun.azimuthDeg * RAD;
  const alt = sun.altitudeDeg * RAD;
  const h = Math.cos(alt);
  return { x: h * Math.sin(az), y: h * Math.cos(az), z: Math.sin(alt) };
}

/* ═════════════════════════ 3 · NHIỆT ĐỘ MÀU → RGB ═════════════════════════ */

/**
 * Kelvin → RGB 0..255, **xấp xỉ Tanner Helland** (khớp đường cong vật đen của Mitchell Charity),
 * hợp lệ ~1000–40000K, sai lệch thị giác nhỏ — đủ cho preview đèn, **KHÔNG phải** trắc quang chuẩn
 * CIE. Ghi rõ là xấp xỉ để không ai dùng con số này làm căn cứ kỹ thuật (N4).
 */
export function kelvinToRgb(kelvin: number): { r: number; g: number; b: number } {
  const t = Math.min(40000, Math.max(1000, kelvin)) / 100;
  const clamp = (v: number) => Math.round(Math.min(255, Math.max(0, v)));
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return { r: clamp(r), g: clamp(g), b: clamp(b) };
}

export function kelvinToHex(kelvin: number): string {
  const { r, g, b } = kelvinToRgb(kelvin);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/* ═════════════════════════ 4 · LIGHT RIG (dữ liệu, KHÔNG phải object three) ═════════════════════════ */

export interface RigSun {
  kind: 'sun';
  /** hướng TỪ gốc RA mặt trời (hệ CAD). */
  directionCad: Pt3Mm;
  /** cùng vector đó, đã hoán trục sang three.js — nơi gọi đặt `light.position` theo đây rồi
   * `target` tại gốc là ra đúng hướng nắng. Dùng CHUNG `cadAxesToThree()`, không viết lại công
   * thức trục lần thứ hai (luật 1-công-thức của `cad-to-obj.ts:190`). */
  directionThree: [number, number, number];
  intensity: number;
  colorK: number;
  colorHex: string;
  /** true = mặt trời dưới đường chân trời (altitude < 0). Nơi gọi PHẢI tự tắt/giảm đèn — hàm này
   * KHÔNG tự ép intensity về 0 (đó là quyết định thẩm mỹ của tầng viewer, không phải của dữ liệu). */
  belowHorizon: boolean;
}

export interface RigSky {
  kind: 'sky';
  hdriId?: string;
  intensity: number;
  rotationDeg: number;
}

export interface RigRoomLight {
  kind: 'room';
  id: string;
  lightKind: RoomLightKind;
  /** vị trí TUYỆT ĐỐI đã giải xong cao độ tầng (mm, hệ CAD). */
  posCadMm: Pt3Mm;
  posThreeM: [number, number, number];
  targetCadMm?: Pt3Mm;
  targetThreeM?: [number, number, number];
  lumens: number;
  /**
   * Cường độ sáng quy đổi cho nguồn ĐẲNG HƯỚNG: cd = lm / 4π. three.js (chế độ đèn vật lý) nhận
   * candela cho point/spot nên đây là con số dùng thẳng được.
   * ⚠️ **Với `spot` con số này THẤP hơn thực tế**: đèn rọi dồn quang thông vào một nón (cd =
   * lm / (2π(1−cos½θ))), mà `RoomLight` **chưa có trường góc nón** nên không tính đúng được.
   * KHÔNG đoán bừa một góc mặc định (N4) — nơi gọi biết góc nón thì tự quy đổi lại. Đây là ô
   * trống có thật, ghi ra chứ không giấu (§9).
   */
  candelaIsotropic: number;
  colorK: number;
  colorHex: string;
  levelId?: string;
  /** cao độ tầng đã cộng vào `posCadMm.z` (mm). undefined = đèn không gắn tầng. */
  levelElevationMm?: number;
}

export interface LightRig {
  sun: RigSun;
  sky: RigSky;
  rooms: RigRoomLight[];
  /** Cảnh báo cho UI — dữ liệu hỏng nhưng KHÔNG làm sập (levelId mồ côi, lumens ≤ 0…). Rỗng = sạch. */
  warnings: string[];
}

function toThreeM(p: Pt3Mm): [number, number, number] {
  const [x, y, z] = cadAxesToThree(p.x, p.y, p.z);
  return [x / 1000, y / 1000, z / 1000];
}

/**
 * Dựng MÔ TẢ dàn đèn từ `Doc` — **trả dữ liệu thuần, không tạo một object three.js nào**.
 *
 * `Doc.lighting` chưa có ⇒ dùng `DEFAULT_SUN`/`DEFAULT_SKY` + 0 đèn phòng (dữ liệu cũ chạy bình
 * thường, không sập — cùng tinh thần backward-compat của `levels.ts`).
 *
 * Cao độ đèn: `posMm.z` cộng `Level.elevationMm` khi có `levelId` tra được. `levelId` mồ côi ⇒
 * **giữ nguyên z tương đối** + ghi cảnh báo (không im lặng thả đèn xuống sàn tầng trệt).
 */
export function buildLightRig(doc: Doc): LightRig {
  const warnings: string[] = [];
  const lighting = doc.lighting;

  const sunParam = lighting?.sun ?? DEFAULT_SUN;
  const dirCad = sunDirectionCad(sunParam);
  const sun: RigSun = {
    kind: 'sun',
    directionCad: dirCad,
    directionThree: cadAxesToThree(dirCad.x, dirCad.y, dirCad.z),
    intensity: sunParam.intensity,
    colorK: sunParam.colorK,
    colorHex: kelvinToHex(sunParam.colorK),
    belowHorizon: sunParam.altitudeDeg < 0,
  };
  if (sun.belowHorizon) warnings.push(`Mặt trời đang dưới đường chân trời (${sunParam.altitudeDeg.toFixed(1)}°) — cảnh sẽ tối.`);

  const skyParam = lighting?.sky ?? DEFAULT_SKY;
  const sky: RigSky = {
    kind: 'sky',
    ...(skyParam.hdriId ? { hdriId: skyParam.hdriId } : {}),
    intensity: skyParam.intensity,
    rotationDeg: skyParam.rotationDeg,
  };

  const rooms: RigRoomLight[] = [];
  for (const rl of lighting?.rooms ?? []) {
    let elevation: number | undefined;
    if (rl.levelId) {
      const lv = levelById(doc, rl.levelId);
      if (lv) {
        elevation = lv.elevationMm;
      } else {
        warnings.push(`Đèn "${rl.id}" trỏ tầng không còn tồn tại (${rl.levelId}) — giữ nguyên cao độ tương đối.`);
      }
    }
    const dz = elevation ?? 0;
    const posCadMm: Pt3Mm = { x: rl.posMm.x, y: rl.posMm.y, z: rl.posMm.z + dz };
    // Đích rọi cũng phải nâng theo tầng — nếu không, đèn tầng 3 sẽ rọi xuống sàn tầng trệt.
    const targetCadMm = rl.targetMm ? { x: rl.targetMm.x, y: rl.targetMm.y, z: rl.targetMm.z + dz } : undefined;

    if (!(rl.lumens > 0)) warnings.push(`Đèn "${rl.id}" có quang thông ${rl.lumens} lm — không phát sáng.`);

    rooms.push({
      kind: 'room',
      id: rl.id,
      lightKind: rl.kind,
      posCadMm,
      posThreeM: toThreeM(posCadMm),
      ...(targetCadMm ? { targetCadMm, targetThreeM: toThreeM(targetCadMm) } : {}),
      lumens: rl.lumens,
      candelaIsotropic: rl.lumens / (4 * Math.PI),
      colorK: rl.colorK,
      colorHex: kelvinToHex(rl.colorK),
      ...(rl.levelId ? { levelId: rl.levelId } : {}),
      ...(elevation === undefined ? {} : { levelElevationMm: elevation }),
    });
  }

  return { sun, sky, rooms, warnings };
}

/** Tiện ích: đặt mặt trời theo ngày giờ thật, giữ nguyên `intensity`/`colorK` người dùng đang chỉnh. */
export function sunLightFromDateTime(
  base: SunLight,
  lat: number,
  lng: number,
  date: Date,
  hour: number,
  tzOffsetHours?: number,
): SunLight {
  const p = sunFromDateTime(lat, lng, date, hour, tzOffsetHours);
  return { ...base, azimuthDeg: p.azimuthDeg, altitudeDeg: p.altitudeDeg };
}
