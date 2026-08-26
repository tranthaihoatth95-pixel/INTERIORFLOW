'use client';

/**
 * components/site/NhapViTri.tsx — KHAI VỊ TRÍ + HƯỚNG CÔNG TRÌNH. Một khối, hai mặt tiền
 * (`gonGang` cho bảng Đèn 3D · bản đầy đủ cho Tổng quan) — **cùng một cỗ máy**, không hai form.
 *
 * ⛔ KHÔNG PHẢI WIZARD, KHÔNG PHẢI CỔNG (§5). Không có chuỗi *vị trí → xác nhận → hướng → rồi mới
 * cho vào dự án*. Khối này luôn là **tuỳ chọn tại chỗ**: `chua-ro` là trạng thái HỢP LỆ, hướng
 * khai sau cũng được, và không màn nào bị chặn vì thiếu nó.
 *
 * ⛔ KHÔNG GÓI BẢN ĐỒ, KHÔNG GỌI GOOGLE/APPLE. Sự thật dự án phải TRUNG TÍNH với nhà cung cấp
 * (§7): `ViTriDuAn.nhaCungCap` chỉ là DẤU VẾT ai tra ra, không phải chủ sở hữu dữ liệu. Cũng
 * KHÔNG dựng sẵn lớp `MapProvider` rỗng — một giao diện chưa có bản cài nào là mã chết, và nó
 * khoá thiết kế vào hình dung hôm nay về một thứ chưa chọn.
 *
 * §8 — KHÔNG LẶNG LẼ GHI ĐÈ HƯỚNG ĐÃ CÓ: đổi một hướng đã khai thì dòng cảnh báo hiện TRƯỚC khi
 * bấm lưu, kèm giá trị cũ. §32 — lưu xong, sự thật nào phía sau thành CŨ thì nói ra, KHÔNG tự
 * tính lại và cũng KHÔNG tự xoá.
 */

import { useEffect, useState } from 'react';
import { MapPin, Compass, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { DoChinhXacViTri } from '@/lib/site/types';
import { docToaDo, hienToaDo } from './doc-toa-do';
import { loiThanhCau, useHoSoDiaDiem, type KetQuaLuu } from './dia-diem-client';

const CAP: { id: DoChinhXacViTri; vi: string; en: string }[] = [
  { id: 'cong-truong', vi: 'Tại công trường', en: 'On site' },
  { id: 'thanh-pho', vi: 'Thành phố (gần đúng)', en: 'City (approximate)' },
  { id: 'chua-ro', vi: 'Chưa rõ', en: 'Not known yet' },
];

function nhan(vi: string) {
  return cn('text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]', vi);
}
const O_NHAP =
  'h-[var(--tap)] w-full rounded-[6px] border border-[var(--border)] bg-[var(--panel)] px-2 text-[11px] leading-[1.6] text-[var(--t1)] focus:border-[var(--accent-ring)] focus:outline-none';

export function NhapViTri({
  duAnId,
  gonGang = false,
  onLuuXong,
}: {
  duAnId: string;
  gonGang?: boolean;
  onLuuXong?: (kq: KetQuaLuu) => void;
}) {
  const tr = useT();
  const { hoSo, dangTai, dangLuu, luu } = useHoSoDiaDiem(duAnId);

  const [cap, setCap] = useState<DoChinhXacViTri>('cong-truong');
  const [chuoi, setChuoi] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [matDung, setMatDung] = useState('');
  const [ketQua, setKetQua] = useState<KetQuaLuu | null>(null);
  const [daNap, setDaNap] = useState(false);

  // Nạp giá trị đang có MỘT LẦN. Nạp lại mỗi lần hồ sơ đổi sẽ giật mất chữ đang gõ dở.
  useEffect(() => {
    if (daNap || dangTai || !hoSo.suaLuc) return;
    // ⚠️ Hồ sơ trống trả về `chua-ro`. Nạp thẳng nó vào đây thì người vừa bấm "Thêm vị trí" mở ra
    // một form KHÔNG CÓ Ô NÀO để nhập — bắt được lúc chạy trên app thật. Chưa khai gì thì bắt đầu
    // ở "tại công trường"; ai chưa biết vẫn bấm sang "Chưa rõ" được.
    setCap(hoSo.viTri.doChinhXac === 'chua-ro' ? 'cong-truong' : hoSo.viTri.doChinhXac);
    setChuoi(hienToaDo(hoSo.viTri.viDo, hoSo.viTri.kinhDo));
    setDiaChi(hoSo.viTri.diaChi ?? hoSo.viTri.tinh_thanh ?? '');
    setMatDung(typeof hoSo.huong.matDungChinhDeg === 'number' ? String(hoSo.huong.matDungChinhDeg) : '');
    setDaNap(true);
  }, [daNap, dangTai, hoSo]);

  const doc = docToaDo(chuoi);
  const canToaDo = cap !== 'chua-ro';
  const toaDoHong = canToaDo && chuoi.trim() !== '' && doc.loi !== undefined;
  const matDungSo = matDung.trim() === '' ? undefined : Number(matDung);
  const matDungHopLe = matDungSo === undefined || (Number.isFinite(matDungSo) && matDungSo >= 0 && matDungSo < 360);

  const huongCu = hoSo.huong.matDungChinhDeg;
  const deDoiHuong =
    typeof huongCu === 'number' && matDungSo !== undefined && Math.abs(huongCu - matDungSo) > 0.01;

  const loiToaDo = (() => {
    if (!toaDoHong) return null;
    if (doc.loi === 'ngoai-pham-vi') return tr('Vĩ độ phải trong −90…90 và kinh độ −180…180.', 'Latitude must be −90…90 and longitude −180…180.');
    if (doc.loi === 'dang-dms')
      return tr('Dạng độ-phút-giây chưa đọc được. Nhập dạng thập phân, ví dụ 10.7769, 106.7009.', 'Degrees-minutes-seconds is not supported yet. Use decimals, e.g. 10.7769, 106.7009.');
    return tr('Cần hai số: vĩ độ rồi kinh độ. Ví dụ 10.7769, 106.7009.', 'Two numbers expected: latitude then longitude. e.g. 10.7769, 106.7009.');
  })();

  const luuDuoc = !dangLuu && !toaDoHong && matDungHopLe;

  async function bamLuu() {
    if (!luuDuoc) return;
    const kq = await luu({
      viTri: {
        doChinhXac: cap,
        // Chọn "Chưa rõ" thì GỠ toạ độ — giữ lại số cũ dưới nhãn "chưa rõ" là nói dối về độ tin cậy.
        viDo: cap === 'chua-ro' ? undefined : doc.viDo,
        kinhDo: cap === 'chua-ro' ? undefined : doc.kinhDo,
        diaChi: diaChi.trim() || undefined,
        // Người tự khai = người đã gật, không phải máy tra ra (§6).
        nguoiDungXacNhan: cap !== 'chua-ro',
      },
      huong: matDungSo === undefined ? {} : { matDungChinhDeg: matDungSo },
    });
    setKetQua(kq);
    onLuuXong?.(kq);
  }

  return (
    <div className={cn('space-y-2', gonGang ? 'rounded-[10px] border border-[var(--border)] bg-[var(--field)] p-1.5' : '')}>
      <span className={cn(nhan(''), 'flex items-center gap-1')}>
        <MapPin size={14} /> {tr('Vị trí công trình', 'Project location')}
      </span>

      {/* ĐỘ CHÍNH XÁC là một sự thật riêng, không phải chú thích (§6). */}
      <div className="flex gap-1">
        {CAP.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCap(c.id)}
            aria-pressed={cap === c.id}
            className={cn(
              'h-[var(--tap)] flex-1 rounded-[10px] border px-1 text-[10px] font-semibold leading-[1.3] transition-colors',
              cap === c.id
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--field)] text-[var(--t3)] hover:border-[var(--accent-ring)]',
            )}
          >
            {tr(c.vi, c.en)}
          </button>
        ))}
      </div>

      {canToaDo && (
        <>
          <label className="block">
            <span className={nhan('')}>{tr('Toạ độ', 'Coordinates')}</span>
            <input
              value={chuoi}
              onChange={(e) => setChuoi(e.target.value)}
              placeholder="10.7769, 106.7009"
              inputMode="text"
              aria-label={tr('Toạ độ — vĩ độ rồi kinh độ', 'Coordinates — latitude then longitude')}
              aria-invalid={toaDoHong || undefined}
              className={cn(O_NHAP, 'mt-0.5 font-mono', toaDoHong && 'border-[var(--warning)]')}
            />
          </label>
          {loiToaDo && (
            <p className="flex items-start gap-1 text-[9.5px] leading-relaxed text-[var(--warning)]">
              <AlertTriangle size={14} className="mt-[1px] flex-none" />
              {loiToaDo}
            </p>
          )}

          <label className="block">
            <span className={nhan('')}>{tr('Địa chỉ hoặc thành phố', 'Address or city')}</span>
            <input
              value={diaChi}
              onChange={(e) => setDiaChi(e.target.value)}
              placeholder={tr('Quận 1, TP.HCM', 'District 1, Ho Chi Minh City')}
              aria-label={tr('Địa chỉ hoặc thành phố', 'Address or city')}
              className={cn(O_NHAP, 'mt-0.5')}
            />
          </label>
        </>
      )}

      <label className="block">
        <span className={cn(nhan(''), 'flex items-center gap-1')}>
          <Compass size={14} /> {tr('Phương vị mặt đứng chính', 'Main façade azimuth')}
        </span>
        <input
          value={matDung}
          onChange={(e) => setMatDung(e.target.value)}
          placeholder={tr('để trống nếu chưa khai', 'leave blank if not known')}
          inputMode="decimal"
          aria-label={tr('Phương vị mặt đứng chính, độ tính từ hướng Bắc', 'Main façade azimuth in degrees clockwise from north')}
          aria-invalid={!matDungHopLe || undefined}
          className={cn(O_NHAP, 'mt-0.5 font-mono', !matDungHopLe && 'border-[var(--warning)]')}
        />
      </label>
      <p className="text-[9.5px] leading-relaxed text-[var(--t5)]">
        {tr('Độ, thuận kim đồng hồ từ Bắc: 0 Bắc · 90 Đông · 180 Nam · 270 Tây.', 'Degrees clockwise from north: 0 N · 90 E · 180 S · 270 W.')}
      </p>
      {!matDungHopLe && (
        <p className="text-[9.5px] leading-relaxed text-[var(--warning)]">{tr('Phương vị nằm trong 0…359.', 'Azimuth must be within 0…359.')}</p>
      )}
      {/* §8 — nói TRƯỚC khi ghi đè, kèm giá trị cũ. */}
      {deDoiHuong && (
        <p className="flex items-start gap-1 text-[9.5px] leading-relaxed text-[var(--warning)]">
          <AlertTriangle size={14} className="mt-[1px] flex-none" />
          {tr(`Sẽ thay hướng đã khai ${Math.round(huongCu as number)}° bằng ${Math.round(matDungSo as number)}°.`,
              `This replaces the recorded orientation ${Math.round(huongCu as number)}° with ${Math.round(matDungSo as number)}°.`)}
        </p>
      )}

      <button
        type="button"
        onClick={bamLuu}
        disabled={!luuDuoc}
        className={cn(
          'flex h-[var(--tap)] w-full items-center justify-center gap-1.5 rounded-[10px] border text-[11px] font-semibold transition-colors',
          luuDuoc
            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] hover:border-[var(--accent)]'
            : 'cursor-not-allowed border-[var(--border)] bg-[var(--field)] text-[var(--t4)] opacity-[var(--mo-vo-hieu,0.5)]',
        )}
      >
        {dangLuu ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
        {tr('Lưu vào dự án', 'Save to project')}
      </button>

      {/* Kết quả nói bằng lời người: được thì được, bị chặn quyền thì nói rõ ai mới sửa được. */}
      {ketQua && !ketQua.ok && ketQua.loai && (
        <p role="alert" className="flex items-start gap-1 text-[9.5px] leading-relaxed text-[var(--warning)]">
          <AlertTriangle size={14} className="mt-[1px] flex-none" />
          {loiThanhCau(ketQua.loai, tr)}
        </p>
      )}
      {ketQua?.ok && (
        <div role="status" className="space-y-0.5">
          <p className="text-[9.5px] leading-relaxed text-[var(--t3)]">
            {tr('Đã lưu vào dự án. Mọi chặng đọc chung số này.', 'Saved to the project. Every stage reads this one value.')}
          </p>
          {/* §32 — nói ra thứ nay đã cũ, KHÔNG tự tính lại và KHÔNG tự xoá. */}
          {ketQua.daCu && ketQua.daCu.length > 0 && (
            <p className="text-[9.5px] leading-relaxed text-[var(--t5)]">
              {tr(`${ketQua.daCu.length} kết quả phân tích cũ đi vì đổi sự thật gốc — xem lại khi cần.`,
                  `${ketQua.daCu.length} earlier analyses are now stale because a base fact changed — revisit when needed.`)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default NhapViTri;
