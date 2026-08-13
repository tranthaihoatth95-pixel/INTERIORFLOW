'use client';

/**
 * components/materials/RnaPanel.tsx — IfRna v0 (P6): PANEL TỰ SINH TỪ ĐỊNH NGHĨA [T2].
 * Nhận defs (`IfRnaField[]`) + value + onChange → render ô nhập theo `kind`, gom + collapse
 * theo `group` [Đ6]. KHÔNG chế visual mới: khuôn ô nhập (rnaInputStyle/rnaLabelStyle) chép
 * nguyên từ `MaterialPbrEditor.tsx` bản tay (nay import ngược từ đây — MỘT nguồn style);
 * header nhóm chép đúng khuôn nút "Nâng cao" cũ (chevron xoay 120ms, reduce-motion thắng).
 *
 * Hành vi ghi KHÔNG nằm ở đây — nằm ở `ifRnaWrite` (lib/rna/types.ts, thuần, test khoá parity
 * với material-edit.ts). Panel chỉ là mặt tiền.
 *
 * [T0 khai thật] v0 tự sinh được: number-slider · color · bool · texture (nạp ảnh → data-URI).
 * KHÔNG tự sinh được: enum (type chưa có options) · trường giá trị OBJECT (sub-path) · điều
 * kiện hiển thị — caller đưa qua `tuyChinh` (renderer nhận nhãn ĐÃ dịch từ defs — chuỗi vẫn
 * một nguồn) hoặc giấu qua `an` để giữ tay hẳn bên ngoài.
 */
import { useState } from 'react';
import { ChevronRight, Upload } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { ifRnaDecimals, ifRnaWrite, type IfRnaField, type IfRnaText } from '@/lib/rna/types';

/** Khuôn ô nhập — CHÉP NGUYÊN từ MaterialPbrEditor.tsx bản tay (một ngôn ngữ giao diện). */
export const rnaInputStyle: React.CSSProperties = {
  width: '100%', height: 'var(--tap)', padding: '0 10px', borderRadius: 10,
  border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 'var(--fs-ui)',
};
export const rnaLabelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4 };

/** Đọc 1 file ảnh → data-URI (chép nguyên từ editor tay — map lưu thẳng trong value, kho cục bộ). */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export interface RnaFieldCtx<T> {
  field: IfRnaField<T>;
  /** nhãn ĐÃ dịch theo ngôn ngữ hiện tại — renderer tuỳ chỉnh dùng nó, không tự chép chuỗi. */
  nhan: string;
  value: T;
  onChange: (next: T) => void;
}
export type RnaRenderer<T> = (ctx: RnaFieldCtx<T>) => React.ReactNode;

/** Cắt danh sách field của 1 nhóm thành các RUN liên tiếp cùng "chất lưới" (texture ↔ thường)
 * — giữ đúng bố cục panel tay: 2 hàng map 3 cột, rồi hàng bước-lặp-vân full-width. */
function chiaRun<T>(fields: IfRnaField<T>[]): IfRnaField<T>[][] {
  const runs: IfRnaField<T>[][] = [];
  for (const f of fields) {
    const last = runs[runs.length - 1];
    if (last && (last[0].kind === 'texture') === (f.kind === 'texture')) last.push(f);
    else runs.push([f]);
  }
  return runs;
}

export function RnaPanel<T extends object>({
  defs, value, onChange, an, tuyChinh, soMacDinh, soCot, nhomDong,
}: {
  defs: readonly IfRnaField<T>[];
  value: T;
  onChange: (next: T) => void;
  /** key GIỮ TAY bên ngoài (hoặc chưa từng có control) — panel bỏ qua [T0]. */
  an?: readonly (keyof T & string)[];
  /** renderer tuỳ chỉnh cho field panel v0 chưa tự sinh được (object sub-path/enum/điều kiện). */
  tuyChinh?: Partial<Record<keyof T & string, RnaRenderer<T>>>;
  /** số hiển thị khi trường chưa có giá trị — callsite cấp (vd roughness → DEFAULT_PBR), v0
   * chưa nới type thêm `macDinh` (đề xuất treo ở báo cáo). */
  soMacDinh?: Partial<Record<keyof T & string, number>>;
  /** số cột lưới theo group.vi (vd map 3 cột, Nâng cao 2 cột như panel tay). Không khai = xếp dọc. */
  soCot?: Record<string, number>;
  /** group.vi đóng mặc định (vd 'Nâng cao' — panel tay cũ advancedOpen=false). */
  nhomDong?: readonly string[];
}) {
  const tr = useT();
  const [dong, setDong] = useState<ReadonlySet<string>>(() => new Set(nhomDong ?? []));
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const anSet = new Set<string>(an ?? []);
  const hien = defs.filter((f) => !anSet.has(f.key));

  // Nhóm theo thứ tự xuất hiện trong defs — thứ tự render = thứ tự định nghĩa.
  const nhom: { g: IfRnaText; fields: IfRnaField<T>[] }[] = [];
  for (const f of hien) {
    const last = nhom[nhom.length - 1];
    if (last && last.g.vi === f.group.vi) last.fields.push(f);
    else nhom.push({ g: f.group, fields: [f] });
  }

  const ghi = (f: IfRnaField<T>, v: unknown) => onChange(ifRnaWrite(f, value, v));

  const renderField = (f: IfRnaField<T>): React.ReactNode => {
    const nhan = tr(f.label.vi, f.label.en);
    const custom = tuyChinh?.[f.key];
    if (custom) return custom({ field: f, nhan, value, onChange });
    const raw = (value as Record<string, unknown>)[f.key];
    if (raw !== undefined && raw !== null && typeof raw === 'object') return null; // object sub-path — phải tuyChinh/an

    if (f.kind === 'number' && f.min !== undefined && f.max !== undefined) {
      const num = typeof raw === 'number' ? raw : (soMacDinh?.[f.key] ?? f.min);
      return (
        <div>
          <label style={rnaLabelStyle}>{nhan} · {num.toFixed(ifRnaDecimals(f as IfRnaField<never>))}{f.unit ? ` ${f.unit}` : ''}</label>
          <input type="range" min={f.min} max={f.max} step={f.step ?? 0.01} value={num}
            onChange={(e) => ghi(f, Number(e.target.value))} style={{ width: '100%' }} />
        </div>
      );
    }
    if (f.kind === 'color') {
      return (
        <div>
          <label style={rnaLabelStyle}>{nhan}</label>
          <input type="color" value={typeof raw === 'string' ? raw : '#9a9a9a'}
            onChange={(e) => ghi(f, e.target.value)} style={{ ...rnaInputStyle, padding: 2, cursor: 'pointer' }} />
        </div>
      );
    }
    if (f.kind === 'bool') {
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={raw === true} onChange={(e) => ghi(f, e.target.checked)} />
          {nhan}
        </label>
      );
    }
    if (f.kind === 'texture') {
      return (
        <div>
          <label style={rnaLabelStyle}>{nhan}</label>
          <label style={{ ...rnaInputStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: raw ? 'var(--t1)' : 'var(--t4)' }}>
            <Upload size={13} />
            {raw ? tr('Đã nạp — bấm đổi', 'Loaded — click to replace') : tr('Nạp ảnh…', 'Load image…')}
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) void fileToDataUrl(file).then((url) => ghi(f, url)); }} />
          </label>
        </div>
      );
    }
    return null; // enum không tuyChinh — v0 chưa có options metadata, không tự chế select rỗng
  };

  return (
    <div>
      {nhom.map(({ g, fields }) => {
        const mo = !dong.has(g.vi);
        const cot = soCot?.[g.vi];
        return (
          <div key={g.vi}>
            <button type="button"
              onClick={() => setDong((s) => { const n = new Set(s); if (n.has(g.vi)) n.delete(g.vi); else n.add(g.vi); return n; })}
              style={{ display: 'flex', alignItems: 'center', gap: 4, border: 0, background: 'transparent', color: 'var(--t3)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: mo ? 10 : 14 }}>
              <ChevronRight size={13} style={{ transform: mo ? 'rotate(90deg)' : undefined, transition: reduceMotion ? undefined : 'transform 120ms' }} />
              {tr(g.vi, g.en)}
            </button>
            {mo && chiaRun(fields).map((run, i) => {
              // Khuôn lưới chép từ panel tay: map ảnh LUÔN 3 cột; ô thường theo soCot (vd
              // "Nâng cao" 2 cột), không khai = xếp dọc full-width.
              const runCot = run[0].kind === 'texture' ? 3 : (cot ?? 1);
              return (
                <div key={i} style={runCot > 1
                  ? { display: 'grid', gridTemplateColumns: `repeat(${runCot}, 1fr)`, gap: 10, marginBottom: 10 }
                  : { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                  {run.map((f) => {
                    const node = renderField(f);
                    return node == null ? null : <div key={f.key}>{node}</div>;
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
