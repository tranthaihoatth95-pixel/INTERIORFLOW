'use client';

/**
 * app/files/_components/NganPhanTho.tsx — [marker: filesHaiNgan] NGĂN ② *Phần thô dùng chung*.
 *
 * Hoà chốt 17/08: đây là **nguyên liệu nhiều người góp, chưa đủ định nghĩa để render** — map
 * texture · nhà cung cấp · **range giá**. Nó là ĐẦU VÀO của dòng chảy `Files → cửa sổ công cụ →
 * Thư viện` (`docs/IF-KIEN-TRUC.md` §5): thêm thông số xong thì món **rời ngăn này**.
 *
 * ⚡ *Thô* KHÔNG phải cờ mới — đọc ra từ `lib/materials/ba-mat.ts` (mặt `dung3d` chưa `du`). Lõi
 * thuần + test ở `app/files/_lib/ngan-tho.ts`. Ở đây chỉ có: nạp dữ liệu và bày ra.
 *
 * ⛔ Module này **chỉ ĐỌC** `lib/materials/**` — không sửa dòng nào bên đó (biên phiếu V2).
 * ⛔ **Range giá = KHO CHUNG.** Không đọc giá chốt của dự án (`boq-overrides`) — hai nửa cố ý tách.
 *
 * 🎨 Không token màu mới, không đụng `--accent*` (Hoà chưa chốt màu nhấn thứ hai). Trạng thái nói
 * bằng **chữ + hình dạng**, màu chỉ là kênh phụ — nên ngăn vẫn đọc được khi bỏ hết màu.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ImageOff, Image as ImageIcon, RefreshCw, Truck, Wallet } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { loadPbrMap } from '@/lib/materials/pbr-store';
import { pbrMapBaTang } from '@/lib/materials/tang-phan-giai';
import { tronHatGiong } from '@/lib/materials/kho-mo-dau';
import { MATERIALS } from '@/lib/cad/materials';
import type { MaterialPbr } from '@/lib/materials/schema';
import type { MaterialSpecDto } from '@/lib/materials/warehouse/dto';
import { locMonTho, tomTatNganTho, type MonTho } from '../_lib/ngan-tho';

/** Dấu hình học cho trạng thái — KHÔNG dùng màu làm kênh duy nhất (luật màu-không-là-kênh-duy-nhất).
 *  `chuaDu` là ca đắt nhất: nó TRÔNG như đã xong, nên phải có dấu riêng chứ không gộp với `chuaCo`. */
const DAU_TRANG_THAI: Record<'chuaDu' | 'chuaCo', { ky: string; nhan: [string, string] }> = {
  chuaDu: { ky: '◐', nhan: ['Thiếu một phần', 'Partly defined'] },
  chuaCo: { ky: '○', nhan: ['Chưa có thông số', 'No parameters yet'] },
};

function ThePhanTho({ mon }: { mon: MonTho }) {
  const tr = useT();
  const tt = mon.matDung3d.trangThai === 'chuaDu' ? DAU_TRANG_THAI.chuaDu : DAU_TRANG_THAI.chuaCo;
  return (
    <li
      style={{
        display: 'grid', gap: 6, padding: 'var(--pad-card)',
        borderRadius: 'var(--r-3)', border: '1px solid var(--border)', background: 'var(--card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        {/* Dấu hình học đứng TRƯỚC tên: quét mắt xuống cột là thấy ngay món nào thiếu tới đâu. */}
        <span aria-hidden style={{ fontSize: 15, lineHeight: 1, color: 'var(--t3)' }}>{tt.ky}</span>
        <span style={{ fontSize: 'var(--fs-ui)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)' }}>{mon.ten}</span>
        <code style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>{mon.matId}</code>
        <span
          style={{
            marginLeft: 'auto', fontSize: 'var(--fs-2xs)', color: 'var(--t2)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '1px 8px',
          }}
        >
          {tr(tt.nhan[0], tt.nhan[1])}
        </span>
      </div>

      {/* THIẾU GÌ + LÀM SAO CÓ — hai dòng này là lý do ngăn tồn tại. Cấm ô trống câm (`ba-mat.ts`). */}
      {mon.matDung3d.thieu && (
        <p style={{ margin: 0, display: 'flex', gap: 6, fontSize: 'var(--fs-2xs)', color: 'var(--t2)' }}>
          <AlertTriangle size={14} strokeWidth={1.5} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{tr(mon.matDung3d.thieu.vi, mon.matDung3d.thieu.en)}</span>
        </p>
      )}
      {mon.matDung3d.loiRa && (
        <p style={{ margin: 0, paddingLeft: 19, fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
          → {tr(mon.matDung3d.loiRa.vi, mon.matDung3d.loiRa.en)}
        </p>
      )}

      {/* Ba thứ Hoà kể tên của phần thô: map texture · nhà cung cấp · range giá. */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {mon.coAnhVan
            ? <><ImageIcon size={14} strokeWidth={1.5} aria-hidden />{tr('có ảnh vân', 'has colour map')}</>
            : <><ImageOff size={14} strokeWidth={1.5} aria-hidden />{tr('chưa có ảnh vân', 'no colour map')}</>}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Truck size={14} strokeWidth={1.5} aria-hidden />
          {mon.nhaCungCap ?? tr('chưa khai nhà cung cấp', 'no supplier yet')}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Wallet size={14} strokeWidth={1.5} aria-hidden />
          {mon.khoangGia
            ? tr(mon.khoangGia.chu.vi, mon.khoangGia.chu.en)
            : tr('nhóm này chưa món nào ghi giá', 'no item in this group has a price')}
        </span>
      </div>
    </li>
  );
}

export function NganPhanTho() {
  const tr = useT();
  /* `MaterialSpecDto` (không phải shape con `MonKhoChung`) vì `tronHatGiong` trả về dòng đầy đủ và
     `/api/specs` cũng trả đầy đủ; `MonKhoChung` vẫn là shape con hợp lệ nên `locMonTho` nhận được. */
  const [kho, setKho] = useState<MaterialSpecDto[] | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [pbrMap, setPbrMap] = useState<Record<string, MaterialPbr>>({});

  const nap = useCallback(async () => {
    setLoi(null);
    try {
      const res = await fetch('/api/specs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      setKho(j.specs ?? []);
    } catch (e) {
      /* Máy chủ ngã KHÔNG được làm ngăn này rỗng: tầng hạt giống nằm trong REPO, nó không phụ
         thuộc `/api/specs` — đó chính là lý do nó tồn tại. Giữ `kho = []` để `khoChung` bên dưới
         vẫn trộn ra hàng hạt giống; dải báo lỗi vẫn hiện nên người dùng biết mặt THƯƠNG MẠI đang
         thiếu, không bị lừa là đã đủ. (Cùng ca 401 đã vá ở `MaterialsScreen` 04/09.) */
      setKho([]);
      setLoi(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => { void nap(); }, [nap]);
  /* Kho PBR sống trong localStorage ⇒ chỉ đọc được sau khi lên client (SSR trả {}). Cùng lý do đã
     ghi ở `MaterialsScreen`: đọc sớm thì người vừa đặt xong thông số vẫn thấy "chưa có".
     `pbrMapBaTang` chứ không `loadPbrMap` trần — nếu chỉ đọc tầng studio thì vật liệu ship sẵn
     không có thông số nào ⇒ ngăn thô bày chúng ra như hàng chưa định nghĩa. */
  useEffect(() => { setPbrMap(pbrMapBaTang({ studio: loadPbrMap() })); }, []);

  /* KHO CHUNG = hạt giống (theo bản cài) + dòng DB, dòng DB thắng khi trùng `matId`. Trước 04/09
     ngăn này chỉ đọc `/api/specs` ⇒ trên máy sạch nó LUÔN rỗng và nói "Kho chung chưa có món nào",
     trong khi bản cài đã ship sẵn vật liệu — câu đó SAI về hiện trạng, đúng họ lỗi "cột Nguồn nói
     sai". `tronHatGiong` là cùng một hàm `MaterialsScreen` dùng, không đẻ luật xếp thứ hai. */
  const khoChung = useMemo(() => (kho === null ? null : tronHatGiong(kho)), [kho]);

  const tho = useMemo(
    () => (khoChung ? locMonTho(khoChung, { pbrMap, specs: khoChung, defs: MATERIALS }) : []),
    [khoChung, pbrMap],
  );
  const tomTat = useMemo(() => tomTatNganTho(tho, khoChung?.length ?? 0), [tho, khoChung]);

  return (
    <section style={{ display: 'grid', gap: 10, padding: '12px 14px' }} aria-label={tr('Phần thô dùng chung', 'Shared raw stock')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 'var(--fs-ui)', color: 'var(--t2)' }}>
          {khoChung === null && !loi ? tr('Đang đọc kho chung…', 'Reading the shared catalogue…') : tr(tomTat.vi, tomTat.en)}
        </p>
        <button
          type="button"
          onClick={() => { void nap(); setPbrMap(loadPbrMap()); }}
          style={{
            marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
            minHeight: 'var(--tap)', padding: '0 12px', borderRadius: 'var(--r-2)',
            border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)',
            fontSize: 'var(--fs-2xs)', cursor: 'pointer',
          }}
        >
          <RefreshCw size={18} strokeWidth={1.5} aria-hidden />{tr('Đọc lại', 'Reload')}
        </button>
      </div>

      {loi && (
        <p style={{ margin: 0, padding: '8px 12px', borderRadius: 'var(--r-2)', border: '1px solid var(--border)', fontSize: 'var(--fs-2xs)', color: 'var(--t2)' }}>
          {tr('Không đọc được kho chung', 'Could not read the shared catalogue')}: {loi}
        </p>
      )}

      {/* NGĂN RỖNG — hai ca khác hẳn nhau, cố ý không dùng chung một câu:
          ① kho chưa có gì  ② mọi món đều đã đủ định nghĩa (tin TỐT, không phải trạng thái lỗi). */}
      {khoChung !== null && tho.length === 0 && !loi && (
        <p
          style={{
            margin: 0, padding: '18px 14px', textAlign: 'center',
            border: '1px dashed var(--border)', borderRadius: 'var(--r-3)',
            fontSize: 'var(--fs-2xs)', color: 'var(--t3)',
          }}
        >
          {khoChung.length === 0
            ? tr('Chưa món nào trong kho chung. Thả tệp vật liệu vào đây để bắt đầu.',
                 'Nothing in the shared catalogue yet. Drop material files here to start.')
            : tr('Không còn món thô nào — mọi món đều đã đủ định nghĩa để render.',
                 'No raw items left — everything is defined enough to render.')}
        </p>
      )}

      {tho.length > 0 && (
        <ul style={{ display: 'grid', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
          {tho.map((m) => <ThePhanTho key={m.matId} mon={m} />)}
        </ul>
      )}
    </section>
  );
}
