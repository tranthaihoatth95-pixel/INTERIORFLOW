/**
 * lib/site/survey-bridge.ts — CẦU sang ArchiNote / khảo sát hiện trường. IF là MÁY PHÁT, ArchiNote là
 * MÁY THU (chốt 03/08) — cầu này chỉ SOẠN PHIẾU KHẢO SÁT từ danh sách KHUYẾT, và KHAI hình dạng bằng
 * chứng mà máy thu trả về (`SurveyEvidence`). Không gọi ArchiNote (chưa tồn tại — 07/08: "archinote
 * chưa code"), không tạo ExternalRef (hệ `archinote` là chuỗi tự do đã chừa sẵn — `schema.prisma
 * ExternalRef.system`, cắm khi ArchiNote có thật).
 */
import type { KhuyetSite, SiteContext, SiteDerived } from './types';

export interface CauHoiKhaoSat {
  ma: KhuyetSite;
  cauHoi: { vi: string; en: string };
  /** loại bằng chứng mong nhận về — khớp `SurveyEvidence.kind`/`loai`. */
  mongNhan: string;
}

export const CAU_HOI_THEO_KHUYET: Record<KhuyetSite, CauHoiKhaoSat> = {
  ghim: { ma: 'ghim', cauHoi: { vi: 'Ghim vị trí công trình (GPS tại chỗ).', en: 'Pin the site location (on-site GPS).' }, mongNhan: 'pin(nguon=khao-sat)' },
  'mui-gio': { ma: 'mui-gio', cauHoi: { vi: 'Xác nhận múi giờ địa phương.', en: 'Confirm the local time zone.' }, mongNhan: 'pin.muiGioPhut' },
  'khi-hau': { ma: 'khi-hau', cauHoi: { vi: 'Đo nhiệt độ + độ ẩm tại chỗ (vài mốc giờ).', en: 'Measure on-site temperature + humidity (several times).' }, mongNhan: 'so-do(nhiet-do, do-am)' },
  gio: { ma: 'gio', cauHoi: { vi: 'Đo hướng + tốc độ gió chủ đạo.', en: 'Measure prevailing wind direction + speed.' }, mongNhan: 'so-do(gio-huong, gio-toc-do)' },
  'vat-lieu-tai-cho': { ma: 'vat-lieu-tai-cho', cauHoi: { vi: 'Ghi vật liệu sẵn có quanh công trình (chụp + ghi chú).', en: 'Record locally available materials (photo + note).' }, mongNhan: 'ngu-canh(vat-lieu-tai-cho)' },
  'tap-quan': { ma: 'tap-quan', cauHoi: { vi: 'Ghi tập quán ràng buộc (bàn thờ, hướng bếp…).', en: 'Record binding local customs (altar, kitchen orientation…).' }, mongNhan: 'ngu-canh(tap-quan)' },
};

export interface PhieuKhaoSat {
  projectId: string;
  /** hệ đích — chuỗi tự do đúng như `ExternalRef.system` chừa sẵn cho ArchiNote. */
  heDich: 'archinote';
  pin: SiteContext['pin'];
  cauHoi: CauHoiKhaoSat[];
  /** cửa còn phải mở để phiếu này ĐI được — nói thẳng, không giả vờ đã gửi. */
  cuaChua: string[];
  tai: string;
}

export function soanPhieuKhaoSat(ctx: SiteContext, suyDien: SiteDerived | null, now = new Date()): PhieuKhaoSat {
  const khuyet = suyDien?.khuyet ?? (['ghim'] as KhuyetSite[]);
  return {
    projectId: ctx.projectId,
    heDich: 'archinote',
    pin: ctx.pin,
    cauHoi: khuyet.map((k) => CAU_HOI_THEO_KHUYET[k]),
    cuaChua: ['ArchiNote chưa có mã (chốt 07/08) — phiếu chỉ xuất được dạng JSON/chép tay', 'ExternalRef(system=archinote) chưa nối — cắm khi máy thu có thật'],
    tai: now.toISOString(),
  };
}

/** Nhận bằng chứng từ máy thu (hoặc nhập tay) — chỉ THÊM, không sửa/xoá bằng chứng cũ (mỗi mảnh là một quan sát). */
export function nhanBangChung(ctx: SiteContext, moi: SiteContext['khaoSat'], now = new Date()): SiteContext {
  const daCo = new Set(ctx.khaoSat.map((e) => e.id));
  const them = moi.filter((e) => e.id && !daCo.has(e.id));
  if (them.length === 0) return ctx;
  return { ...ctx, khaoSat: [...ctx.khaoSat, ...them], capNhat: now.toISOString() };
}
