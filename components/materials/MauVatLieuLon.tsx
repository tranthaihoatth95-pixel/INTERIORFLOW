'use client';

/**
 * components/materials/MauVatLieuLon.tsx — MẪU VẬT ở nấc chi tiết **JUDGE** và **INSPECT**.
 *
 * ⛔ VÌ SAO KHÔNG PHẢI `MauVatLieu` PHÓNG TO (Hoà chốt 16/08, đã phải sửa hai lần):
 * *"ba nấc phải thật sự có công năng đúng của nó — size to là BỔ SUNG CHI TIẾT cho size nhỏ."*
 * Cửa nghiệm thu hai vế: nấc nhỏ đứng được một mình **và** nấc to mang thứ nấc nhỏ KHÔNG THỂ có.
 *   · SCAN 44 px (`MauVatLieu`) — *món nào*: quả cầu + màu. Ở cỡ này vân **không đọc được**, và
 *     ảnh quả cầu còn mang sẵn nền xám studio đục phủ kín lớp vân bên dưới (đo V1–V4).
 *   · **JUDGE** — *chất*: bỏ hẳn nền studio, bày **VÂN THẬT** đủ lớn để nói "sồi hay óc chó",
 *     kèm quả cầu riêng một ô để đọc **độ hoàn thiện** (mờ hay bóng). Thứ SCAN không thể có: vân.
 *   · **INSPECT** — *khổ*: lát đúng `uvScaleMm`, thấy **mạch nối** sang tấm kế, có **thước mm**,
 *     có danh sách map, có nguồn và gốc gác. Thứ JUDGE không thể có: một con số đo được.
 *
 * 🔴 KHÔNG PHẢI NGUỒN THỨ HAI. Cả ba nấc đọc **cùng một** `XemTruocO` (do `getMaterial()` hợp
 * nhất ba mặt) và **cùng một** hợp đồng ngưỡng `nacXemTruoc()`. Ba mức chi tiết của một sự thật.
 *
 * 🔴 NẤC CHƯA ĐỨNG ĐƯỢC THÌ **KHOÁ KÈM LÝ DO**, không hiện ra như một ảnh phóng to. Đây là chỗ
 * luật "nấc to phải khác BẢN CHẤT" được thi hành trước mắt người dùng, không chỉ trong test.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Orbit, Ruler } from 'lucide-react';
import MaterialSphere from '@/components/three/MaterialSphere';
import { materialTextureDataUrl } from '@/lib/cad/material-texture';
import { nacXemTruoc, type NacXem } from '@/lib/materials/nac-xem-truoc';
import { nenVanNac, thuocMm, docKhoMm } from '@/lib/materials/nen-van';
import { loiOMau } from '@/lib/materials/o-an-toan';
import type { XemTruocO } from '@/lib/materials/xem-truoc-o';
import { useT } from '@/lib/i18n';

/** Cao khung mẫu vật, px. **168 KHÔNG phải con số cho đẹp**: hợp đồng đòi JUDGE đạt 6,7 px/mm
 * trên khung soi 25 mm ⇒ 168/25 = 6,72 — vừa đủ. Hạ xuống 160 là nấc JUDGE **tự khoá lại** và
 * người dùng đọc được lý do. Cũng đúng nấc thẻ "Vừa" đã chốt 07/08 (122 · 168 · 232). */
export const CAO_KHUNG = 168;
/** Bề rộng ô quả cầu ở nấc JUDGE — vuông, để quả cầu không bị cắt chỏm. */
const RONG_CAU = 168;
const CACH = 8;

/** Sáu map ảnh của `MaterialPbr`. Đếm để nói THẲNG vật liệu này đang dựng từ tham số hay từ ảnh. */
const KHOA_MAP = ['baseColorMapUrl', 'roughnessMapUrl', 'metallicMapUrl', 'normalUrl', 'heightUrl', 'aoUrl'] as const;

export function MauVatLieuLon({
  xemTruoc, nac, ten, nguon, rongKhung = 420,
}: {
  xemTruoc: XemTruocO | null;
  nac: Exclude<NacXem, 'scan'>;
  ten: string;
  /** nhãn nguồn của dòng kho (`materialSourceLabel`) — gốc gác, không tự suy lại ở đây. */
  nguon?: string | null;
  /** bề rộng khung chứa lúc chưa đo được (SSR · trình duyệt không có ResizeObserver). Con số
   * THẬT lấy bằng đo — xem `rongDo` bên dưới. */
  rongKhung?: number;
}) {
  const tr = useT();
  const [lyDoCau, setLyDoCau] = useState<string | null>(null);

  /* 🔴 PHẢI ĐO, KHÔNG ĐƯỢC ĐOÁN. Nấc INSPECT khẳng định *"khung soi rộng 1,8 m, mạch rơi ở
     1,2 m"* và vẽ tấm vân theo px tuyệt đối. Lấy bề rộng theo một hằng số truyền vào thì trên
     khổ hẹp (hộp thoại co lại theo `maxWidth: 100vw - 32px`) tấm vẫn vẽ theo số cũ ⇒ **thước
     và ảnh nói hai điều khác nhau**. Đó không phải lệch thẩm mỹ, đó là NÓI SAI SỐ ĐO. */
  const khungRef = useRef<HTMLDivElement>(null);
  const [rongDo, setRongDo] = useState<number | null>(null);
  useEffect(() => {
    const el = khungRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setRongDo(el.getBoundingClientRect().width));
    ro.observe(el);
    setRongDo(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  const rongThat = rongDo && rongDo > 0 ? rongDo : rongKhung;

  const pbr = xemTruoc?.pbr ?? null;
  const kq = nacXemTruoc(pbr, nac, CAO_KHUNG);
  const uv = pbr?.uvScaleMm;
  const rongVan = nac === 'judge' ? Math.max(120, rongThat - RONG_CAU - CACH) : rongThat;
  const nen = nenVanNac(nac, kq, rongVan, uv && uv.w > 0 ? uv.h / uv.w : undefined);

  /* ẢNH VÂN THẬT thắng — cùng MỘT tệp ảnh mà quả cầu PBR đang dùng, không đường vẽ thứ hai.
     Không có thì mới sinh vân procedural THEO NẤC (không phải một tấm 96 px kéo giãn cho cả ba);
     `nenVanNac` đã kẹp cạnh tấm trong [96, 384] nên không có đường nào sinh vòng lặp triệu pixel. */
  const van = useMemo(
    () => xemTruoc?.anhVan ?? (xemTruoc?.def && nen ? materialTextureDataUrl(xemTruoc.def, nen.canhTile) : ''),
    [xemTruoc?.anhVan, xemTruoc?.def, nen?.canhTile],
  );

  /* NẤC KHOÁ — nói thẳng vì sao, đúng khuôn "nút mờ phải kèm lý do". Đây KHÔNG phải lỗi: nó là
     câu trả lời trung thực cho một vật liệu chưa khai đủ số. */
  if (!nen) {
    return (
      <div
        ref={khungRef}
        style={{
          height: CAO_KHUNG, display: 'grid', placeItems: 'center', padding: 16, textAlign: 'center',
          borderRadius: 'var(--r-2)', border: '1px dashed var(--border)', background: 'var(--card)',
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5, maxWidth: 320 }}>
          <div style={{ fontWeight: 600, color: 'var(--t2)', marginBottom: 4 }}>
            {nac === 'judge'
              ? tr('Chưa soi được chất ở nấc này', 'Cannot inspect the surface at this level')
              : tr('Chưa soi được khổ thật ở nấc này', 'Cannot inspect the true scale at this level')}
          </div>
          {kq.lyDo ?? tr('mã này chưa có ký hiệu 2D nên chưa có vân để soi', 'no 2D pattern for this code yet, so there is no grain to inspect')}
        </div>
      </div>
    );
  }

  const nenVan: React.CSSProperties = van
    ? { backgroundImage: `url(${van})`, backgroundSize: nen.coNen, backgroundRepeat: nen.lapNen, backgroundPosition: 'left top' }
    : { background: xemTruoc?.mauA ?? 'var(--field)' };

  const khungVan: React.CSSProperties = {
    height: CAO_KHUNG, borderRadius: 'var(--r-2)', overflow: 'hidden',
    boxShadow: 'inset 0 0 0 1px var(--vien-mo)', ...nenVan,
  };

  /* ── JUDGE — hai ô cạnh nhau, mỗi ô trả lời một nửa câu "chất là gì" ── */
  if (nac === 'judge') {
    const loi = loiOMau(!!van, lyDoCau);
    const nham = typeof pbr?.roughness === 'number' ? pbr.roughness.toFixed(2).replace('.', ',') : null;
    return (
      <div ref={khungRef}>
        <div style={{ display: 'flex', gap: CACH, alignItems: 'flex-start' }}>
          <figure style={{ flex: 1, minWidth: 0, margin: 0 }}>
            <div style={khungVan} role="img" aria-label={tr(`Vân của ${ten}`, `Grain of ${ten}`)} />
            <figcaption style={{ ...nhanO, marginTop: 4 }}>
              <Ruler size={14} aria-hidden style={{ color: 'var(--t4)' }} />
              {/* NÓI ĐÚNG NGUỒN. Ảnh thật thì khai được khổ một tấm (nấc này bày TRỌN một chu kỳ
                  lặp, đó là con số duy nhất về mm mà nó dám khai); vân thuật toán thì KHÔNG khai
                  mm — nó chưa hiệu chuẩn, xem 🔴 đầu `nen-van.ts`. */}
              {!van
                ? tr('Chưa có ký hiệu 2D nên chưa có vân', 'No 2D symbol yet, so no grain')
                : xemTruoc?.anhVan && uv?.w
                  ? tr(`Vân thật — trọn một tấm ${docKhoMm(uv.w)} ngang`, `Real grain — one full ${docKhoMm(uv.w)} tile across`)
                  : tr('Vân · hoa văn (dựng bằng thuật toán)', 'Grain · pattern (drawn algorithmically)')}
            </figcaption>
          </figure>
          <figure style={{ width: RONG_CAU, flexShrink: 0, margin: 0 }}>
            <MaterialSphere
              title={ten}
              style={{ width: RONG_CAU, height: CAO_KHUNG, borderRadius: 'var(--r-2)', boxShadow: 'inset 0 0 0 1px var(--vien-mo)' }}
              fit="contain"
              size={RONG_CAU}
              /* Nấc soi ⇒ phân giải đầy đủ (spec §5.4 P3: chỉ nâng lên 1 khi mở JUDGE/INSPECT). */
              resolution={1}
              fallback={nenVan}
              onLoi={setLyDoCau}
              spec={{ id: xemTruoc!.id, colorA: xemTruoc!.mauA, colorB: xemTruoc!.mauB, kind: xemTruoc!.ho ?? 'paint', pbr: pbr ?? undefined }}
            />
            <figcaption style={{ ...nhanO, marginTop: 4 }}>
              <Orbit size={14} aria-hidden style={{ color: 'var(--t4)' }} />
              {nham
                ? tr(`Độ hoàn thiện — nhám ${nham}`, `Finish — roughness ${nham}`)
                : tr('Độ hoàn thiện', 'Finish')}
            </figcaption>
          </figure>
        </div>
        {loi.cau && (
          <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--warning)', lineHeight: 1.5 }}>{loi.cau}</div>
        )}
      </div>
    );
  }

  /* ── INSPECT — một dải lát đúng khổ + thước mm + số đo. Đây là nấc DUY NHẤT được nói về mm. ── */
  const span = kq.spanMm ?? 0;
  const thuoc = thuocMm(span);
  const mach = uv && uv.w > 0 && uv.w < span ? (uv.w / span) * 100 : null;
  const soMap = pbr ? KHOA_MAP.filter((k) => typeof pbr[k] === 'string' && (pbr[k] as string).length > 0).length : 0;

  return (
    <div ref={khungRef}>
      <div data-nen-van={nen.coNen} style={{ position: 'relative', ...khungVan }} role="img" aria-label={tr(`${ten} ở khổ thật, khung soi ${docKhoMm(span)}`, `${ten} at true scale, ${docKhoMm(span)} wide`)}>
        {/* MẠCH NỐI — LƯỚI đúng chỗ tấm kế bắt đầu, cả hai chiều, vẽ theo ĐÚNG `coNen` của nền
            vân nên nó không thể trôi lệch khỏi module. Đây là thứ nấc JUDGE không thể có và là
            lý do nấc này tồn tại: người nghề nhìn mạch để biết ván ghép ra sao. Không phải trang
            trí — bỏ nó đi thì dải vân đọc thành một tấm liền vô tận, tức SAI. */}
        <span
          aria-hidden
          style={{
            position: 'absolute', inset: 0, opacity: 0.4,
            backgroundImage:
              'linear-gradient(to right, var(--t1) 0 1px, transparent 1px), linear-gradient(to bottom, var(--t1) 0 1px, transparent 1px)',
            backgroundSize: `${nen.coNen}, ${nen.coNen}`,
            backgroundRepeat: 'repeat',
          }}
        />
      </div>

      {thuoc && (
        <div style={{ position: 'relative', height: 16, marginTop: 4 }} aria-hidden>
          <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: 'var(--vien-mo)' }} />
          {thuoc.mocMm.map((v) => (
            <span key={v} style={{ position: 'absolute', top: 0, left: `${(v / span) * 100}%`, width: 1, height: v % (thuoc.buocMm * 2) === 0 ? 8 : 4, background: 'var(--t4)' }} />
          ))}
          {mach != null && (
            <span style={{ position: 'absolute', top: 0, left: `${mach}%`, width: 1, height: 12, background: 'var(--t2)' }} />
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t4)', fontVariantNumeric: 'tabular-nums' }}>
        <span>0</span>
        {mach != null && uv && <span>{tr(`mạch ${docKhoMm(uv.w)}`, `seam ${docKhoMm(uv.w)}`)}</span>}
        <span>{docKhoMm(span)}</span>
      </div>

      <dl style={{ margin: 0, marginTop: 8, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 4, fontSize: 12, lineHeight: 1.5 }}>
        <Dong nhan={tr('Khổ một tấm', 'One tile')}>
          {uv ? `${docKhoMm(uv.w)} × ${docKhoMm(uv.h)}` : tr('chưa khai', 'not declared')}
        </Dong>
        <Dong nhan={tr('Khung soi', 'Viewport')}>
          {tr(`${docKhoMm(span)} — thấy ${(kq.repeat ?? 0).toFixed(1).replace('.', ',')} tấm`, `${docKhoMm(span)} — ${(kq.repeat ?? 0).toFixed(1)} tiles`)}
        </Dong>
        <Dong nhan={tr('Ảnh chất liệu', 'Texture maps')}>
          {soMap > 0
            ? tr(
              `${soMap} trên ${KHOA_MAP.length} map — ảnh do IF sinh bằng thuật toán, không phải ảnh chụp vật thật`,
              `${soMap} of ${KHOA_MAP.length} maps — images generated by IF, not photographs of a real sample`,
            )
            : tr('chưa có map — vân dựng bằng thuật toán, chi tiết bên trong tấm là suy diễn, không phải đo', 'no maps — the grain is drawn algorithmically; detail inside the tile is inferred, not measured')}
        </Dong>
        {nguon && <Dong nhan={tr('Gốc gác', 'Origin')}>{nguon}</Dong>}
        {pbr?.suyDoan && (
          <Dong nhan={tr('Thông số render', 'Render parameters')}>
            {tr('máy suy đoán, chưa ai xác nhận', 'machine-inferred, unconfirmed')}
          </Dong>
        )}
      </dl>
    </div>
  );
}

function Dong({ nhan, children }: { nhan: string; children: React.ReactNode }) {
  return (
    <>
      <dt style={{ color: 'var(--t4)', whiteSpace: 'nowrap' }}>{nhan}</dt>
      <dd style={{ margin: 0, color: 'var(--t2)', fontVariantNumeric: 'tabular-nums' }}>{children}</dd>
    </>
  );
}

const nhanO: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--t4)', lineHeight: 1.4,
  /* MỘT DÒNG. Nhãn quấn hai dòng đẩy cụm nút nấc chi tiết bên dưới chồm lên — bắt được bằng mắt
     trên ảnh chụp 1440 lượt đầu, không bằng suy luận. */
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};
