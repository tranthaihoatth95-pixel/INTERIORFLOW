'use client';

/**
 * components/site/SunArc.tsx — SƠ ĐỒ MẶT TRỜI theo ghim: vòng la bàn (N/E/S/W) + cung ngày hôm nay +
 * hai cung chí (nét đứt). Vẽ kiểu sơ đồ kỹ thuật (đúng gu LightClock: hairline + nhãn mono), KHÔNG
 * mặt trời cartoon. Số lấy từ `SolarSummary` — không tự tính lại ở đây.
 *
 * Hình chiếu: phương vị → góc quanh tâm (Bắc lên trên); độ cao → bán kính (chân trời = vành ngoài,
 * thiên đỉnh = tâm). Cung ngày = quét từ phương vị mọc tới phương vị lặn qua điểm giữa trưa.
 */
import { useT } from '@/lib/i18n';
import type { SolarSummary } from '@/lib/site/types';

const S = 200;
const C = S / 2;
const R = 84;

function toXY(azDeg: number, altDeg: number): [number, number] {
  const r = R * (1 - Math.max(0, Math.min(90, altDeg)) / 90);
  const a = (azDeg - 90) * (Math.PI / 180);
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

/** Đường cong xấp xỉ: mọc (alt 0) → giữa trưa (alt max, phương vị 180 ở Bắc bán cầu / 0 ở Nam) → lặn. */
function arcPath(azMoc: number | null, azLan: number | null, altTrua: number, azTrua: number): string | null {
  if (azMoc === null || azLan === null) return null;
  const pts: [number, number][] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // phương vị đi từ mọc tới lặn theo chiều qua giữa trưa; độ cao hình sin
    // đi theo cung ngắn quanh vòng tròn (mọc 65° → trưa 350° phải đi qua 0°, không vòng ngược qua 180°)
    const buoc = (a: number, b: number, k: number) => a + (((b - a + 540) % 360) - 180) * k;
    const az = t <= 0.5 ? buoc(azMoc, azTrua, t / 0.5) : buoc(azTrua, azLan, (t - 0.5) / 0.5);
    const alt = Math.sin(t * Math.PI) * altTrua;
    pts.push(toXY(az, alt));
  }
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
}

export default function SunArc({ s, lat }: { s: SolarSummary; lat: number }) {
  const t = useT();
  void lat;
  const azTrua = s.phuongViGiuaTruaDo;
  const homNay = arcPath(s.phuongViBinhMinhDo, s.phuongViHoangHonDo, s.doCaoGiuaTruaDo, azTrua);
  // Hai chí: summary không mang phương vị mọc/lặn riêng → xấp xỉ bằng cung hôm nay co/giãn theo độ cao
  // (chỉ để đọc "biên độ trong năm", KHÔNG phải số đo — nét đứt, không nhãn số).
  const he = arcPath(s.phuongViBinhMinhDo === null ? null : s.phuongViBinhMinhDo - 12, s.phuongViHoangHonDo === null ? null : s.phuongViHoangHonDo + 12, s.chiHe.doCaoGiuaTruaDo, azTrua);
  const dong = arcPath(s.phuongViBinhMinhDo === null ? null : s.phuongViBinhMinhDo + 12, s.phuongViHoangHonDo === null ? null : s.phuongViHoangHonDo - 12, s.chiDong.doCaoGiuaTruaDo, azTrua);
  const nhan = [
    ['N', 0],
    ['E', 90],
    ['S', 180],
    ['W', 270],
  ] as const;
  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" role="img" aria-label={t(`Đường mặt trời ${s.ngay}: mọc ${s.binhMinh ?? '—'}, lặn ${s.hoangHon ?? '—'}, cao giữa trưa ${s.doCaoGiuaTruaDo}°`, `Sun path ${s.ngay}: rise ${s.binhMinh ?? '—'}, set ${s.hoangHon ?? '—'}, noon altitude ${s.doCaoGiuaTruaDo}°`)}>
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--vien-mo)" strokeWidth="1" />
      <circle cx={C} cy={C} r={R / 2} fill="none" stroke="var(--vien-mo)" strokeWidth="1" strokeDasharray="2 3" />
      <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="var(--vien-mo)" strokeWidth="1" />
      <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="var(--vien-mo)" strokeWidth="1" />
      {he && <path d={he} fill="none" stroke="var(--t4)" strokeWidth="1" strokeDasharray="3 3" />}
      {dong && <path d={dong} fill="none" stroke="var(--t4)" strokeWidth="1" strokeDasharray="3 3" />}
      {homNay && <path d={homNay} fill="none" stroke="var(--t2)" strokeWidth="2" />}
      {s.phuongViBinhMinhDo !== null && (() => { const [x, y] = toXY(s.phuongViBinhMinhDo, 0); return <circle cx={x} cy={y} r="3.5" fill="var(--t1)" />; })()}
      {s.phuongViHoangHonDo !== null && (() => { const [x, y] = toXY(s.phuongViHoangHonDo, 0); return <circle cx={x} cy={y} r="3.5" fill="var(--t1)" />; })()}
      {nhan.map(([k, az]) => {
        const [x, y] = toXY(az, -12);
        return (
          <text key={k} x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono, monospace)" fill="var(--t3)">
            {k}
          </text>
        );
      })}
      {homNay === null && (
        <text x={C} y={C + 3} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono, monospace)" fill="var(--t3)">
          {t('vùng cực: không mọc/lặn', 'polar: no rise/set')}
        </text>
      )}
    </svg>
  );
}
