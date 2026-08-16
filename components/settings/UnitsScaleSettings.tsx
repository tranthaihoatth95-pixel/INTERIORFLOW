'use client';

/**
 * components/settings/UnitsScaleSettings.tsx — nhóm "Đơn vị & Tỉ lệ" của /settings.
 * Phiếu P-A `docs/phieu-giao/P-A-don-vi-ty-le.md` (chốt 15/08 `docs/00-CHOT.md` mục "ĐƠN VỊ ĐO
 * + TỈ LỆ..." + A7 `docs/CHOT-PHIEN-15-08-CAN-SOAT.md`).
 *
 * Port NGUYÊN VĂN theo mock `docs/mocks/mock-cai-dat-don-vi-ty-le.html` (luật QUY TRÌNH DESIGN
 * 02/08 — mock là nguồn sự thật, phiên code chỉ port, không sáng tác thêm). Khuôn `<section>` +
 * `tr()` giống `ExperienceSettings.tsx`/`AppearanceSettings.tsx` sẵn có trong cùng thư mục — [Đ1]
 * nhìn vào trong trước, cấm đẻ khuôn mới.
 *
 * RÀNG BUỘC CỨNG A7: lưu trữ số đo LUÔN LÀ mm — màn này chỉ đổi lớp HIỂN THỊ/NHẬP
 * (`lib/units/index.ts`), không đụng dữ liệu Doc/entity nào.
 */

import { useState } from 'react';
import { Ruler, Keyboard, Grid3x3 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useUnitsSettings } from '@/lib/units/settings';
import { UNIT_IDS, UNIT_LABELS, formatLength, parseLength, type UnitId } from '@/lib/units';
import { SCALE_CHUAN, formatScale } from '@/lib/units/scale';

/** Số đo mẫu cho ô xem trước sống — 3 250mm, cùng con số dùng trong mock để nghiệm thu pixel-diff. */
const SAMPLE_MM = 3250;

/** Dãy chip lựa chọn dùng chung cho 2 nhóm đơn vị (hiển thị/nhập) — role=radiogroup + role=radio
 * (WCAG 4.1.2 name/role/value), KB-1 hình dạng chip (r-full, --tap chạm được ≥32/44px). */
function UnitChipRow({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy: string;
  value: UnitId;
  onChange: (u: UnitId) => void;
}) {
  const tr = useT();
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-wrap gap-[7px]">
      {UNIT_IDS.map((u) => (
        <button
          key={u}
          type="button"
          role="radio"
          aria-checked={value === u}
          onClick={() => onChange(u)}
          className={cn(
            'inline-flex h-[var(--tap)] min-w-[var(--tap)] items-center justify-center rounded-[var(--r-full,999px)] px-[13px] text-[12.5px] transition-colors',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
            value === u
              ? 'bg-[var(--accent)] font-semibold text-white'
              : 'bg-[var(--field)] text-[var(--t2)] hover:bg-[var(--hover)]',
          )}
        >
          {tr(...UNIT_LABELS[u])}
        </button>
      ))}
    </div>
  );
}

/** Dãy chip tỉ lệ chuẩn — CHỈ nhận giá trị trong `SCALE_CHUAN`, không nút nào sinh tỉ lệ lẻ. */
function ScaleChipRow({ labelledBy, value, onChange }: { labelledBy: string; value: number; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-wrap gap-[7px]">
      {SCALE_CHUAN.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onClick={() => onChange(n)}
          className={cn(
            'inline-flex h-[var(--tap)] min-w-[var(--tap)] items-center justify-center rounded-[var(--r-full,999px)] px-[13px] text-[12.5px] transition-colors',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
            value === n
              ? 'bg-[var(--accent)] font-semibold text-white'
              : 'bg-[var(--field)] text-[var(--t2)] hover:bg-[var(--hover)]',
          )}
        >
          {formatScale(n)}
        </button>
      ))}
    </div>
  );
}

export function UnitsScaleSettings() {
  const tr = useT();
  const { state, hydrated, setDisplayUnit, setInputUnit, setDefaultScale } = useUnitsSettings();
  const [tryValue, setTryValue] = useState('3250');

  const tryMm = parseLength(tryValue, { unit: state.inputUnit });
  const tryInvalid = tryValue.trim() !== '' && tryMm === null;

  // Chưa hydrate (SSR/lần render đầu) → dùng mặc định mm/mm/1:50, tránh nhấp nháy giá trị lạ.
  const displayUnit = hydrated ? state.displayUnit : 'mm';
  const inputUnit = hydrated ? state.inputUnit : 'mm';
  const defaultScale = hydrated ? state.defaultScale : 50;

  return (
    <section>
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--t1)]">
        <Ruler size={16} strokeWidth={1.75} aria-hidden="true" />
        {tr('Đơn vị & Tỉ lệ', 'Units & Scale')}
      </h2>
      <p className="mt-1 text-[12px] text-[var(--t3)]">
        {tr(
          'Đổi cách hiển thị và cách gõ số đo — dữ liệu bên trong luôn lưu bằng mm, đổi ở đây không sửa bản vẽ.',
          'Change how measurements are shown and typed — data is always stored in mm, this never edits your drawing.',
        )}
      </p>

      {/* Đơn vị hiển thị */}
      <div className="mt-4">
        <h3
          id="units-display-label"
          className="text-[11px] font-bold uppercase tracking-[.06em] text-[var(--t4)]"
        >
          {tr('Đơn vị hiển thị', 'Display unit')}
        </h3>
        <p className="mb-2.5 mt-0.5 text-[11px] text-[var(--t4)]">
          {tr('Áp dụng cho mọi con số đo hiện trên bản vẽ, bảng vật liệu, BOQ.', 'Applies to every measurement shown on drawings, material boards, BOQ.')}
        </p>
        <UnitChipRow labelledBy="units-display-label" value={displayUnit} onChange={setDisplayUnit} />
      </div>

      {/* Cách nhập */}
      <div className="mt-4">
        <h3 id="units-input-label" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.06em] text-[var(--t4)]">
          <Keyboard size={12} strokeWidth={2} aria-hidden="true" />
          {tr('Cách nhập số đo', 'Input unit')}
        </h3>
        <p className="mb-2.5 mt-0.5 text-[11px] text-[var(--t4)]">
          {tr(
            'Gõ số KHÔNG kèm đơn vị thì hiểu theo lựa chọn này. Gõ kèm hậu tố (12cm · 3′ · 1m) thì luôn ưu tiên hậu tố đã gõ.',
            'A bare number without a unit is read using this setting. Typing an explicit suffix (12cm · 3′ · 1m) always wins.',
          )}
        </p>
        <UnitChipRow labelledBy="units-input-label" value={inputUnit} onChange={setInputUnit} />

        <div className="mt-3">
          <label htmlFor="units-try-input" className="mb-1.5 block text-[11px] text-[var(--t3)]">
            {tr('Gõ thử một số đo để xem quy đổi', 'Type a measurement to preview the conversion')}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="units-try-input"
              type="text"
              inputMode="decimal"
              value={tryValue}
              onChange={(e) => setTryValue(e.target.value)}
              aria-describedby="units-try-result units-try-err"
              className={cn(
                'h-[var(--tap-lg)] flex-1 rounded-[var(--r-2,10px)] border bg-[var(--field)] px-3 font-mono text-[14px] text-[var(--t1)]',
                'focus-visible:outline-none focus-visible:border-[var(--accent)]',
                tryInvalid ? 'border-[var(--danger)]' : 'border-[var(--border)]',
              )}
            />
            <span
              id="units-try-result"
              aria-live="polite"
              className={cn('min-w-[110px] text-right font-mono text-[12.5px] tabular-nums', tryInvalid ? 'text-[var(--danger)]' : 'text-[var(--t2)]')}
            >
              {tryMm !== null ? `= ${formatLength(tryMm)}` : '= —'}
            </span>
          </div>
          {tryInvalid && (
            <p id="units-try-err" role="alert" className="mt-1.5 text-[11px] text-[var(--danger)]">
              {tr(
                "Không đọc được số này. Gõ số kèm đơn vị (vd 320cm) hoặc theo dạng feet-inch (vd 5'6\").",
                "Can't read this. Type a number with a unit (e.g. 320cm) or feet-inch (e.g. 5'6\").",
              )}
            </p>
          )}
        </div>
      </div>

      {/* Tỉ lệ in mặc định */}
      <div className="mt-4 border-t border-[var(--border)] pt-3.5">
        <h3 id="units-scale-label" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.06em] text-[var(--t4)]">
          <Grid3x3 size={12} strokeWidth={2} aria-hidden="true" />
          {tr('Tỉ lệ in mặc định', 'Default print scale')}
        </h3>
        <p className="mb-2.5 mt-0.5 text-[11px] text-[var(--t4)]">
          {tr('Chỉ nhận đúng các nấc chuẩn ISO — không sinh tỉ lệ lẻ kiểu "1:47".', 'Only accepts standard ISO steps — never a stray scale like "1:47".')}
        </p>
        <ScaleChipRow labelledBy="units-scale-label" value={defaultScale} onChange={setDefaultScale} />
      </div>

      {/* Ô xem trước sống — luôn hiện, đổi NGAY khi đổi lựa chọn ở trên */}
      <div
        role="region"
        aria-label={tr('Xem trước đổi đơn vị và tỉ lệ', 'Unit and scale preview')}
        className="mt-4 rounded-[var(--r-3,14px)] border border-[var(--mat-hairline,var(--border))] bg-[var(--field)] px-4 py-3.5"
      >
        <div className="flex items-baseline justify-between gap-2.5 py-1">
          <span className="text-[11px] text-[var(--t3)]">{tr('Chiều dài tường mẫu', 'Sample wall length')}</span>
          <span aria-live="polite" className="font-mono text-[14px] font-semibold tabular-nums text-[var(--t1)]">
            {formatLength(SAMPLE_MM, { unit: displayUnit })}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2.5 border-t border-[var(--border)] py-1">
          <span className="text-[11px] text-[var(--t3)]">{tr('Tỉ lệ đang chọn', 'Selected scale')}</span>
          <span aria-live="polite" className="font-mono text-[13px] font-semibold tabular-nums text-[var(--t1)]">
            {formatScale(defaultScale)} — {tr('1m ngoài đời =', '1m real =')} {(1000 / defaultScale).toFixed(2)}mm {tr('trên giấy', 'on paper')}
          </span>
        </div>
      </div>
    </section>
  );
}
