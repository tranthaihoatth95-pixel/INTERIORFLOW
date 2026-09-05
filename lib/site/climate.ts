/**
 * lib/site/climate.ts — Dải khí hậu + gió + câu chuyện địa phương, CHỈ từ nguồn có thật:
 *   (a) bằng chứng khảo sát (`measured`) · (b) gói vùng studio nạp, có nguồn (`inferred`, tin cậy
 *   theo `kiemChungDuoc`) · (c) suy từ vĩ độ thuần (`inferred`, tin cậy THẤP, chỉ cho dải khí hậu).
 * Không nguồn nào ⇒ trả `null` và caller ghi KHUYẾT. Tuyệt đối không có bảng "kiến thức chung" gõ
 * sẵn trong repo (app trung tính; gió/vật liệu/tập quán là chuyện của từng vùng, studio nạp gói).
 */
import {
  DO_TIN_CAY_MAC_DINH,
  type BienSoNguCanh,
  type DaiKhiHau,
  type GioChuDao,
  type NguonSite,
  type SiteFact,
  type SitePack,
  type SitePin,
  type SiteStory,
  type SurveyEvidence,
} from './types';

/** Chí tuyến 23.44° · vòng cực 66.56° — hằng thiên văn, không phải "kiến thức vùng". */
const CHI_TUYEN = 23.44;
const VONG_CUC = 66.56;

/** Vĩ độ → dải khí hậu THÔ. Đúng về mặt hình học Trái Đất, SAI ở mọi ngoại lệ địa phương (độ cao,
 * dòng biển, gió mùa) — vì thế `doTinCay` thấp và nguồn ghi rõ `suy-vi-do`. */
export function daiKhiHauTuViDo(lat: number): DaiKhiHau {
  const a = Math.abs(lat);
  if (a < CHI_TUYEN) return 'nhiet-doi';
  if (a < 35) return 'can-nhiet-doi';
  if (a < VONG_CUC) return 'on-doi';
  return 'han-doi';
}

export function fact<T>(value: T, nguon: NguonSite, trangThai: SiteFact<T>['trangThai'], tai: string, doTinCay?: number): SiteFact<T> {
  let tc = doTinCay ?? DO_TIN_CAY_MAC_DINH[nguon.loai];
  if (nguon.loai === 'goi-vung' && nguon.kiemChungDuoc === false) tc = Math.min(tc, 0.4);
  return { value, trangThai, nguon, doTinCay: Math.max(0, Math.min(1, tc)), tai };
}

export function goiApDung(pin: SitePin, packs: SitePack[]): SitePack[] {
  return packs.filter((p) => trongHop(pin, p.hopBao));
}

function trongHop(pin: SitePin, [latMin, latMax, lngMin, lngMax]: SitePack['hopBao']): boolean {
  return pin.lat >= latMin && pin.lat <= latMax && pin.lng >= lngMin && pin.lng <= lngMax;
}

function nguonGoi(p: SitePack): NguonSite {
  return { loai: 'goi-vung', ref: p.id, ghiChu: p.nguon.ten + (p.nguon.url ? ` · ${p.nguon.url}` : ''), kiemChungDuoc: p.nguon.kiemChungDuoc };
}

/** Dải khí hậu: gói vùng (nếu có) thắng suy-vĩ-độ; người xác nhận thì caller tự nâng `verified`. */
export function suyDaiKhiHau(pin: SitePin, packs: SitePack[], tai: string): SiteFact<DaiKhiHau> {
  const goi = goiApDung(pin, packs).find((p) => p.khiHau);
  if (goi?.khiHau) return fact(goi.khiHau.dai, nguonGoi(goi), 'inferred', tai);
  return fact(daiKhiHauTuViDo(pin.lat), { loai: 'suy-vi-do', ref: 'daiKhiHauTuViDo', ghiChu: 'chỉ theo vĩ độ — cần khảo sát/gói vùng' }, 'inferred', tai);
}

/** Gió: số đo khảo sát (measured) > gói vùng (inferred) > null (khuyết). */
export function suyGio(pin: SitePin, khaoSat: SurveyEvidence[], packs: SitePack[], tai: string): SiteFact<GioChuDao[]> | null {
  const huong = khaoSat.filter((e): e is Extract<SurveyEvidence, { kind: 'so-do' }> => e.kind === 'so-do' && e.loai === 'gio-huong');
  if (huong.length > 0) {
    const tocDo = khaoSat.filter((e): e is Extract<SurveyEvidence, { kind: 'so-do' }> => e.kind === 'so-do' && e.loai === 'gio-toc-do');
    const tb = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const gio: GioChuDao = { huongDo: Math.round(tb(huong.map((h) => h.giaTri))) % 360 };
    if (tocDo.length > 0) gio.tocDoMs = Math.round(tb(tocDo.map((t) => t.giaTri)) * 10) / 10;
    return fact([gio], { loai: 'khao-sat', ref: huong.map((h) => h.id).join(','), ghiChu: `trung bình ${huong.length} lần đo` }, 'measured', tai);
  }
  const goi = goiApDung(pin, packs).find((p) => p.gioChuDao?.length);
  if (goi?.gioChuDao) return fact(goi.gioChuDao, nguonGoi(goi), 'inferred', tai);
  return null;
}

/** Câu chuyện: ghi chú ngữ cảnh khảo sát (measured — người tại chỗ ghi) + gói vùng (inferred). */
export function suyCauChuyen(pin: SitePin, khaoSat: SurveyEvidence[], packs: SitePack[], tai: string): SiteStory[] {
  const out: SiteStory[] = [];
  for (const e of khaoSat) {
    if (e.kind !== 'ngu-canh') continue;
    const chuDe: SiteStory['chuDe'] = e.loai === 'vat-lieu-tai-cho' ? 'vat-lieu' : e.loai === 'tap-quan' ? 'tap-quan' : 'boi-canh';
    out.push({ id: `ks:${e.id}`, chuDe, text: e.text, fact: fact(e.text, { loai: 'khao-sat', ref: e.id }, 'measured', e.tai) });
  }
  for (const p of goiApDung(pin, packs)) {
    (p.cauChuyen ?? []).forEach((c, i) => {
      out.push({ id: `goi:${p.id}:${i}`, chuDe: c.chuDe, text: c.text, fact: fact(c.text, nguonGoi(p), 'inferred', tai) });
    });
  }
  return out;
}

/**
 * Biến số ngữ cảnh máy GỢI Ý (spec §2 trục thứ ba: máy gợi ý — người thêm). Chỉ đề xuất khi có
 * CĂN CỨ nêu được: bằng chứng đo hoặc gói vùng. Suy-vĩ-độ KHÔNG đẻ gợi ý (quá mỏng để nói "ven biển"
 * hay "có mùa đông" — đó là chuyện địa phương, không phải hình học).
 */
export function goiYBienSo(pin: SitePin, khaoSat: SurveyEvidence[], packs: SitePack[], daNhan: BienSoNguCanh[], tai: string): BienSoNguCanh[] {
  const daCo = new Set(daNhan.map((b) => b.ma));
  const out: BienSoNguCanh[] = [];
  const push = (b: BienSoNguCanh) => {
    if (daCo.has(b.ma) || out.some((o) => o.ma === b.ma)) return;
    out.push(b);
  };
  const soDo = khaoSat.filter((e): e is Extract<SurveyEvidence, { kind: 'so-do' }> => e.kind === 'so-do');
  const doAm = soDo.filter((e) => e.loai === 'do-am');
  const nhiet = soDo.filter((e) => e.loai === 'nhiet-do');
  if (doAm.length > 0 && nhiet.length > 0) {
    const tbAm = doAm.reduce((a, e) => a + e.giaTri, 0) / doAm.length;
    const tbNhiet = nhiet.reduce((a, e) => a + e.giaTri, 0) / nhiet.length;
    if (tbAm >= 75 && tbNhiet >= 27) {
      push({ ma: 'nong-am', trangThai: 'inferred', nguon: { loai: 'khao-sat', ref: [...doAm, ...nhiet].map((e) => e.id).join(',') }, lyDo: `độ ẩm TB ${Math.round(tbAm)}% · nhiệt TB ${Math.round(tbNhiet)}°C`, tai });
    }
  }
  const ngap = soDo.filter((e) => e.loai === 'muc-ngap' && e.giaTri > 0);
  if (ngap.length > 0) {
    push({ ma: 'vung-ngap', trangThai: 'inferred', nguon: { loai: 'khao-sat', ref: ngap.map((e) => e.id).join(',') }, lyDo: `ghi nhận mức ngập ${Math.max(...ngap.map((e) => e.giaTri))} ${ngap[0].donVi}`, tai });
  }
  for (const p of goiApDung(pin, packs)) {
    for (const g of p.bienSoGoiY ?? []) push({ ma: g.ma, trangThai: 'inferred', nguon: nguonGoi(p), lyDo: g.lyDo, tai });
  }
  return out;
}
