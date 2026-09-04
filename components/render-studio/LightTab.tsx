'use client';

/**
 * components/render-studio/LightTab.tsx — VIỆC 3: nhóm "ĐẶT ĐÈN" của `Command3DPanel` (mode 3D).
 * Trước phiên này nhóm đèn **TRỐNG HẲN** — không tab, không nút, không ô trống nào.
 *
 * ✅ NGỒI TRÊN HỢP ĐỒNG CỦA PHU, KHÔNG TỰ ĐỊNH NGHĨA CẤU TRÚC ĐÈN: `lib/three/lighting.ts`
 * (`DocLighting` · `SunLight` · `SkyLight` · `RoomLight` · `RoomLightKind` · `buildLightRig()` ·
 * `sunLightFromDateTime()` · `kelvinToHex()`). Dữ liệu sống trong `Doc.lighting` (`model.ts:747`)
 * ⇒ lưu theo `.idf`, hoàn tác được bằng ⌘Z, KHÔNG có kho thứ hai (K1).
 *
 * ✅ ĐƠN VỊ NGHỀ, KHÔNG PHẢI THANG 0–100: mỗi đèn hiện **lumens** (quang thông đọc trên hộp đèn)
 * + **Kelvin**. Riêng mặt trời/bầu trời giữ `intensity` **vì đó đúng là tên PHU đặt** và chính
 * docstring của PHU giải thích tại sao nó KHÔNG phải lux (`lighting.ts:45`: *"app chưa có mô hình
 * trắc quang thật; đặt tên 'intensity' đúng nghĩa 'núm chỉnh', không giả vờ là đơn vị vật lý"*).
 * Bịa lumens cho mặt trời mới là sai — không ai mua nắng theo lumen.
 *
 * 🔴 SỰ THẬT PHẢI ĐỌC (§0): **khung nhìn 3D của IF không có đèn và sẽ không đổi theo bảng này.**
 * `Scene3DViewer` dựng khối bằng `MeshBasicMaterial` — vật liệu KHÔNG nhận ánh sáng (quyết định #3,
 * `SPEC-3D-CORE.md` §6). Bộ đèn khai ở đây là dữ liệu cho đường DỰNG ẢNH đọc. Câu này in trên UI,
 * không giấu ở tooltip. Thứ DUY NHẤT hiện trong khung nhìn là **dấu vị trí đèn** để kéo bằng gizmo.
 */

import { Lightbulb, Plus, Sun, Trash2, Cloud, Compass, MoveHorizontal, MapPin, AlertTriangle } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { sortedLevels } from '@/lib/cad/levels';
import { buildLightRig, estimateLightingQuick, kelvinToHex, sunLightFromDateTime, type RoomLight, type RoomLightKind } from '@/lib/three/lighting';
import { useScene3D } from '@/lib/render-studio/use-scene3d';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';
import { NumberField } from './NumberField';
import {
  useSunUi,
  canUseDateTime,
  formatThousands,
  HDRI_OPTIONS,
  LIGHT_PRESETS,
  ROOM_LIGHT_KINDS,
  ROOM_LIGHT_DEFAULT_Z_MM,
} from './scene3d-ui';
import { currentLighting, writeSun, writeSky, writeRoomLights, patchRoomLight, newRoomLightId } from './doc-catalog';

/** Thanh trượt dùng chung — cao `--tap` (32 desktop / 44 cảm ứng) để ngón tay bắt được núm, không
 * phải rãnh 4px chỉ chuột mới trúng (§0c mảng 3). */
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  readout,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  readout: string;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className={cn('block', disabled && 'opacity-45')}>
      <span className="flex items-baseline gap-1.5">
        <span className="flex-1 text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{label}</span>
        <span className="font-mono text-[10.5px] leading-[1.6] text-[var(--t2)]">{readout}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-0.5 h-[var(--tap)] w-full accent-[var(--accent)]"
        style={{ touchAction: 'pan-y' }}
      />
    </label>
  );
}

/** '13.5' → '13:30' — thanh giờ đi bước 15 phút nên luôn ra số tròn. */
function hourLabel(h: number): string {
  const total = Math.round(h * 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function LightTab() {
  const tr = useT();
  const doc = useCadStore((s) => s.doc);
  const scene = useScene3D();
  const sunUi = useSunUi();
  const setSunUi = useSunUi((s) => s.set);

  // buildLightRig() là NGUỒN DUY NHẤT cho mọi con số dẫn xuất hiện trên UI (màu Kelvin đã đổi hex,
  // cảnh báo, cao độ đèn đã cộng cao độ tầng). Không tự tính lại bất kỳ dòng nào trong đó.
  const rig = buildLightRig(doc);
  const quickEstimate = estimateLightingQuick(
    rig,
    scene ? ((scene.bboxMm.maxX - scene.bboxMm.minX) * (scene.bboxMm.maxY - scene.bboxMm.minY)) / 1_000_000 : 0,
  );
  const lighting = currentLighting();
  const levels = sortedLevels(doc);
  const dateTimeReady = canUseDateTime(sunUi);

  /** Đèn mới rơi vào GIỮA mặt bằng, cao độ theo loại — đặt ở gốc toạ độ thì đèn thường nằm ngoài
   * phòng, người dùng phải kéo lại ngay. */
  const addLight = (kind: RoomLightKind) => {
    // ⚠️ Đọc `currentLighting()` TƯƠI ở đây, không dùng biến `lighting` của closure render — cùng
    // lớp lỗi với `applyDateTime` và cũng bắt được lúc verify: bấm 4 loại đèn liên tiếp trong một
    // nhịp thì cả 4 lần đều thấy danh sách CŨ ⇒ ghi đè nhau, còn đúng 1 đèn.
    const cur = currentLighting();
    const def = ROOM_LIGHT_KINDS.find((k) => k.id === kind) ?? ROOM_LIGHT_KINDS[0];
    const b = scene?.bboxMm;
    const light: RoomLight = {
      id: newRoomLightId(cur.rooms),
      kind,
      posMm: {
        x: b ? Math.round((b.minX + b.maxX) / 2) : 0,
        y: b ? Math.round((b.minY + b.maxY) / 2) : 0,
        z: ROOM_LIGHT_DEFAULT_Z_MM[kind],
      },
      lumens: def.lumens,
      colorK: def.colorK,
    };
    writeRoomLights([...cur.rooms, light]);
  };

  /** Chuyển thanh giờ/ngày/vị trí → phương vị + cao độ THẬT bằng NOAA của PHU. KHÔNG tự viết công
   * thức thiên văn thứ hai (`sunLightFromDateTime` giữ nguyên intensity/colorK người dùng chỉnh). */
  const applyDateTime = (patch: { hour?: number; dateIso?: string; lat?: number; lng?: number }) => {
    // ⚠️ ĐỌC STORE BẰNG `getState()`, KHÔNG dùng `sunUi` của closure render hiện tại. Bắt được
    // lúc verify: gõ vĩ độ → kinh độ → ngày trong CÙNG một nhịp (chưa kịp render lại) thì cả 3
    // lần gọi đều thấy giá trị CŨ ⇒ không lần nào đủ điều kiện, mặt trời không nhúc nhích. Người
    // dùng thật gõ chậm nên hiếm gặp, nhưng "hiếm gặp" không phải là "không có" (§0).
    const cur = useSunUi.getState();
    const next = {
      hour: patch.hour ?? cur.hour,
      dateIso: patch.dateIso ?? cur.dateIso,
      lat: patch.lat ?? cur.latDeg,
      lng: patch.lng ?? cur.lngDeg,
    };
    setSunUi({
      hour: next.hour,
      dateIso: next.dateIso,
      ...(patch.lat !== undefined ? { latDeg: patch.lat } : {}),
      ...(patch.lng !== undefined ? { lngDeg: patch.lng } : {}),
    });
    if (next.lat === null || next.lng === null || !next.dateIso) return;
    // `new Date('YYYY-MM-DD')` được ECMAScript quy định là đọc theo UTC — đúng thứ
    // `sunFromDateTime` yêu cầu (docstring của PHU cảnh báo đừng dùng `new Date(y,m,d)` giờ máy).
    writeSun(sunLightFromDateTime(lighting.sun, next.lat, next.lng, new Date(next.dateIso), next.hour));
  };

  return (
    <div className="space-y-3.5">
      <p className="rounded-[10px] border border-dashed border-[var(--border)] px-2 py-1.5 text-[10px] leading-relaxed text-[var(--t4)]">
        {tr(
          'Khung nhìn đổi sáng ngay theo bộ đèn. Số lux dưới đây là ước tính, chưa thay báo cáo IES/LDT.',
          'The viewport updates with this light rig. The lux values below are estimates, not an IES/LDT report.',
        )}
      </p>

      <section className="grid grid-cols-2 gap-1.5" aria-label={tr('Chỉ số ánh sáng ước tính', 'Estimated lighting metrics')}>
        {[
          [tr('Độ rọi', 'Illuminance'), quickEstimate.estimatedLux === null ? '—' : `${quickEstimate.estimatedLux} lux`],
          [tr('Quang thông', 'Luminous flux'), `${formatThousands(quickEstimate.totalLumens)} lm`],
          [tr('Diện tích', 'Area'), quickEstimate.areaM2 ? `${quickEstimate.areaM2} m²` : '—'],
          [tr('Đồng đều', 'Uniformity'), quickEstimate.uniformity === null ? '—' : quickEstimate.uniformity.toFixed(2)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[6px] border border-[var(--border)] bg-[var(--field)] px-2 py-1.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--t4)]">{label}</p>
            <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-[var(--t1)]">{value}</p>
          </div>
        ))}
      </section>

      {rig.warnings.length > 0 && (
        <ul className="space-y-1 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2 py-1.5">
          {rig.warnings.map((w) => (
            <li key={w} className="flex items-start gap-1 text-[10px] leading-relaxed text-[var(--warning)]">
              <AlertTriangle size={11} className="mt-[2px] flex-none" />
              {w}
            </li>
          ))}
        </ul>
      )}

      {/* ── d) Bốn cảnh sáng dựng sẵn ── */}
      <section className="space-y-1.5">
        <span className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Cảnh sáng', 'Presets')}</span>
        <div className="grid grid-cols-2 gap-1.5">
          {LIGHT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSunUi({ mode: 'manual' });
                writeSun(p.sun);
                writeSky(p.sky);
              }}
              className="min-h-[var(--tap)] rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-1.5 py-1 text-[10.5px] font-medium leading-[1.4] text-[var(--t2)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
            >
              {tr(p.vi, p.en)}
            </button>
          ))}
        </div>
      </section>

      {/* ── a) Mặt trời ── */}
      <section className="space-y-1.5 border-t border-[var(--border)] pt-3">
        <div className="flex items-center gap-1.5">
          <Sun size={12} className="text-[var(--t4)]" />
          <span className="flex-1 text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Mặt trời', 'Sun')}</span>
        </div>

        {/* Hai chế độ, đúng bộ đôi Sun Settings của Revit. */}
        <div className="flex gap-1">
          {(['manual', 'datetime'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSunUi({ mode: m })}
              className={cn(
                'h-[var(--tap)] flex-1 rounded-[10px] border text-[10.5px] font-semibold leading-[1.6] transition-colors',
                sunUi.mode === m
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--field)] text-[var(--t3)] hover:border-[var(--accent-ring)]',
              )}
            >
              {m === 'manual' ? tr('Đặt tay', 'Manual') : tr('Theo ngày giờ', 'By date & time')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Kim la bàn — phản hồi NHÌN THẤY cho cả 2 chế độ. Xoay theo hướng Bắc của bản vẽ. */}
          <svg viewBox="0 0 48 48" className="h-12 w-12 flex-none" aria-label={tr('Hướng nắng', 'Sun direction')}>
            <circle cx="24" cy="24" r="19" fill="none" stroke="var(--border)" strokeWidth="1.5" />
            <g transform={`rotate(${-sunUi.northDeg} 24 24)`}>
              <text x="24" y="9.5" textAnchor="middle" fontSize="7.5" fill="var(--t4)" fontWeight="700">N</text>
            </g>
            {/* 🔴 Kim KHÔNG tô bằng `rig.sun.colorHex`: nắng 5500K ra gần TRẮNG, trên theme sáng
                là kim tàng hình — bắt được lúc verify 2 theme (luật G2: nét phải tương phản với
                nền CỦA CHÍNH NÓ). Dùng token `--warning` (chỉnh sẵn cho cả 2 theme); nhiệt độ màu
                thật đã có ô vuông màu riêng ở mục "Nhiệt màu nắng" bên dưới. */}
            <g transform={`rotate(${lighting.sun.azimuthDeg - sunUi.northDeg} 24 24)`}>
              <line x1="24" y1="24" x2="24" y2="8.5" stroke={rig.sun.belowHorizon ? 'var(--t5)' : 'var(--warning)'} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="24" cy="8.5" r="3" fill={rig.sun.belowHorizon ? 'var(--t5)' : 'var(--warning)'} />
            </g>
            <circle cx="24" cy="24" r="2" fill="var(--t3)" />
          </svg>

          <div className="min-w-0 flex-1 space-y-1">
            <label className="block">
              <span className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Hướng Bắc của bản vẽ', 'Drawing north')}</span>
              <span className="mt-0.5 flex items-center gap-1">
                <Compass size={12} className="flex-none text-[var(--t4)]" />
                <NumberField
                  value={sunUi.northDeg}
                  onCommit={(v) => setSunUi({ northDeg: ((v % 360) + 360) % 360 })}
                  suffix="°"
                  step={5}
                  ariaLabel={tr('Hướng Bắc của bản vẽ (độ)', 'Drawing north (deg)')}
                />
              </span>
            </label>
            <p className="text-[9.5px] leading-relaxed text-[var(--t5)]">
              {rig.sun.belowHorizon
                ? tr('Mặt trời đã lặn.', 'Sun is below the horizon.')
                : tr(
                    `Cao ${Math.round(lighting.sun.altitudeDeg)}° · phương vị ${Math.round(lighting.sun.azimuthDeg)}°`,
                    `${Math.round(lighting.sun.altitudeDeg)}° altitude · ${Math.round(lighting.sun.azimuthDeg)}° azimuth`,
                  )}
            </p>
          </div>
        </div>

        {sunUi.mode === 'manual' ? (
          <>
            <Slider
              label={tr('Phương vị (từ Bắc)', 'Azimuth (from north)')}
              value={lighting.sun.azimuthDeg}
              min={0}
              max={359}
              step={1}
              readout={`${Math.round(lighting.sun.azimuthDeg)}°`}
              onChange={(v) => writeSun({ azimuthDeg: v })}
            />
            <Slider
              label={tr('Cao độ góc', 'Altitude')}
              value={lighting.sun.altitudeDeg}
              min={-30}
              max={90}
              step={1}
              readout={`${Math.round(lighting.sun.altitudeDeg)}°`}
              onChange={(v) => writeSun({ altitudeDeg: v })}
            />
          </>
        ) : (
          <>
            {/* Chưa khai vị trí/ngày thì KHÔNG bịa Hà Nội vào hồ sơ người dùng (N4) — hiện ô nhập
                ngay tại chỗ, đúng luật "empty state làm được việc TẠI CHỖ" (X2). */}
            <div className="space-y-1 rounded-[10px] border border-[var(--border)] bg-[var(--field)] p-1.5">
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">
                <MapPin size={10} /> {tr('Vị trí công trình', 'Project location')}
              </span>
              <div className="grid grid-cols-2 gap-1">
                <label className="block">
                  <span className="text-[9px] leading-[1.6] text-[var(--t5)]">{tr('Vĩ độ', 'Latitude')}</span>
                  <NumberField
                    value={sunUi.latDeg ?? 0}
                    onCommit={(v) => applyDateTime({ lat: Math.min(90, Math.max(-90, v)) })}
                    suffix="°"
                    step={1}
                    decimals={4}
                    ariaLabel={tr('Vĩ độ', 'Latitude')}
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] leading-[1.6] text-[var(--t5)]">{tr('Kinh độ', 'Longitude')}</span>
                  <NumberField
                    value={sunUi.lngDeg ?? 0}
                    onCommit={(v) => applyDateTime({ lng: Math.min(180, Math.max(-180, v)) })}
                    suffix="°"
                    step={1}
                    decimals={4}
                    ariaLabel={tr('Kinh độ', 'Longitude')}
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-[9px] leading-[1.6] text-[var(--t5)]">{tr('Ngày', 'Date')}</span>
                <input
                  type="date"
                  value={sunUi.dateIso}
                  onChange={(e) => applyDateTime({ dateIso: e.target.value })}
                  aria-label={tr('Ngày', 'Date')}
                  className="h-[var(--tap)] w-full rounded-[6px] border border-[var(--border)] bg-[var(--panel)] px-1.5 text-[11px] leading-[1.6] text-[var(--t1)] focus:border-[var(--focus-ring)]"
                />
              </label>
              <p className="text-[9.5px] leading-relaxed text-[var(--t5)]">
                {tr(
                  'Chưa lưu vào tệp dự án — khai lại mỗi phiên. Múi giờ suy từ kinh độ.',
                  'Not stored in the project file yet — re-enter each session. Time zone is derived from longitude.',
                )}
              </p>
            </div>

            <Slider
              label={tr('Giờ trong ngày', 'Time of day')}
              value={sunUi.hour}
              min={0}
              max={24}
              step={0.25}
              readout={hourLabel(sunUi.hour)}
              disabled={!dateTimeReady}
              onChange={(v) => applyDateTime({ hour: v })}
            />
            {!dateTimeReady && (
              <p className="text-[9.5px] leading-relaxed text-[var(--t5)]">
                {tr('Nhập vĩ độ · kinh độ · ngày thì thanh giờ mới tính được góc nắng thật.', 'Enter latitude · longitude · date to unlock real sun angles.')}
              </p>
            )}
          </>
        )}

        <Slider
          label={tr('Độ mạnh nắng', 'Sun intensity')}
          value={Math.round(lighting.sun.intensity * 100)}
          min={0}
          max={200}
          step={5}
          readout={`${Math.round(lighting.sun.intensity * 100)}%`}
          onChange={(v) => writeSun({ intensity: v / 100 })}
        />
        <div className="flex items-center gap-1.5">
          <span className="flex-1 text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Nhiệt màu nắng', 'Sun colour')}</span>
          <span className="h-[14px] w-[14px] flex-none rounded-[4px] border border-[var(--border)]" style={{ background: rig.sun.colorHex }} aria-hidden />
          <span className="w-[74px] flex-none">
            <NumberField
              value={lighting.sun.colorK}
              onCommit={(v) => writeSun({ colorK: v })}
              suffix="K"
              step={100}
              min={1000}
              max={12000}
              ariaLabel={tr('Nhiệt màu nắng (K)', 'Sun colour temperature (K)')}
            />
          </span>
        </div>

        <p className="flex items-start gap-1 text-[9.5px] leading-relaxed text-[var(--t5)]">
          <MoveHorizontal size={11} className="mt-[1px] flex-none" />
          {tr(
            'Trên khung nhìn: kéo ngang bằng BA NGÓN để xoay mặt trời. Bàn phím: [ và ] (giữ Shift = 15°).',
            'In the viewport: drag horizontally with THREE FINGERS to swing the sun. Keyboard: [ and ] (hold Shift for 15°).',
          )}
        </p>
        <p className="text-[9.5px] leading-relaxed text-[var(--t5)]">
          {tr(
            'Góc nắng chế độ "Theo ngày giờ" tính bằng thuật toán NOAA (sai số ~0,1°). Chế độ "Đặt tay" là góc bạn tự chọn, không gắn với ngày nào.',
            'In "By date & time" the angle comes from the NOAA algorithm (~0.1° error). "Manual" is whatever angle you pick, tied to no date.',
          )}
        </p>
      </section>

      {/* ── b) Bầu trời ── */}
      <section className="space-y-1.5 border-t border-[var(--border)] pt-3">
        <div className="flex items-center gap-1.5">
          <Cloud size={12} className="text-[var(--t4)]" />
          <span className="flex-1 text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Bầu trời', 'Sky')}</span>
        </div>
        <select
          value={lighting.sky.hdriId ?? ''}
          onChange={(e) => writeSky({ hdriId: e.target.value || undefined })}
          aria-label={tr('Chọn bầu trời', 'Pick a sky')}
          className="h-[var(--tap)] w-full rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-1.5 text-[11px] leading-[1.6] text-[var(--t1)] focus:border-[var(--focus-ring)]"
        >
          <option value="">{tr('— môi trường mặc định —', '— default environment —')}</option>
          {HDRI_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{tr(o.vi, o.en)}</option>
          ))}
        </select>
        <Slider
          label={tr('Xoay bầu trời', 'Sky rotation')}
          value={lighting.sky.rotationDeg}
          min={0}
          max={359}
          step={5}
          readout={`${Math.round(lighting.sky.rotationDeg)}°`}
          onChange={(v) => writeSky({ rotationDeg: v })}
        />
        <Slider
          label={tr('Độ mạnh', 'Intensity')}
          value={Math.round(lighting.sky.intensity * 100)}
          min={0}
          max={200}
          step={5}
          readout={`${Math.round(lighting.sky.intensity * 100)}%`}
          onChange={(v) => writeSky({ intensity: v / 100 })}
        />
        <p className="text-[9.5px] leading-relaxed text-[var(--t5)]">
          {tr(
            'Chọn loại trời để ghi vào phiếu dựng ảnh — ảnh nền trời thật chưa có trong máy.',
            'Picking a sky records it for the render job — the actual sky images aren’t bundled yet.',
          )}
        </p>
      </section>

      {/* ── c) Đèn phòng ── */}
      <section className="space-y-1.5 border-t border-[var(--border)] pt-3">
        <div className="flex items-center gap-1.5">
          <Lightbulb size={12} className="text-[var(--t4)]" />
          <span className="flex-1 text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Đèn phòng', 'Room lights')}</span>
        </div>

        {/* Thả đèn = chọn THẲNG loại, không phải thêm rồi mới đổi loại (4 loại, 4 nút — nhanh hơn
            1 nút + 1 select, và mỗi loại có cao độ/lumens mặc định riêng nên chọn trước là đúng). */}
        <div className="grid grid-cols-2 gap-1.5">
          {ROOM_LIGHT_KINDS.map((k) => (
            <Tooltip
              key={k.id}
              side="right"
              label={tr(
                `Thả ${k.vi.toLowerCase()} vào giữa cảnh — ${formatThousands(k.lumens)} lm · ${k.colorK}K, sửa được`,
                `Drop a ${k.en.toLowerCase()} at the scene centre — ${k.lumens} lm · ${k.colorK}K, editable`,
              )}
            >
              <button
                type="button"
                onClick={() => addLight(k.id)}
                className="flex min-h-[var(--tap)] w-full items-center justify-center gap-1 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-1 text-[10.5px] font-medium leading-[1.4] text-[var(--t2)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
              >
                <Plus size={11} className="flex-none" />
                {tr(k.vi, k.en)}
              </button>
            </Tooltip>
          ))}
        </div>

        {lighting.rooms.length === 0 ? (
          <p className="rounded-[10px] border border-dashed border-[var(--border)] px-2 py-2 text-[10.5px] leading-relaxed text-[var(--t4)]">
            {tr('Chưa có đèn nào trong cảnh.', 'No lights in the scene yet.')}
          </p>
        ) : (
          <ul className="space-y-1">
            {lighting.rooms.map((l) => {
              const kindDef = ROOM_LIGHT_KINDS.find((k) => k.id === l.kind);
              const resolved = rig.rooms.find((r) => r.id === l.id);
              return (
                <li key={l.id} className="space-y-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--field)] p-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-[10px] w-[10px] flex-none rounded-full border border-[var(--border)]"
                      style={{ background: resolved?.colorHex ?? kelvinToHex(l.colorK) }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-[1.6] text-[var(--t2)]">
                      {tr(kindDef?.vi ?? l.kind, kindDef?.en ?? l.kind)} · {l.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => writeRoomLights(currentLighting().rooms.filter((r) => r.id !== l.id))}
                      aria-label={tr('Xoá đèn', 'Delete light')}
                      title={tr('Xoá đèn', 'Delete light')}
                      className="grid h-[var(--tap)] w-[var(--tap)] flex-none place-items-center rounded-[6px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--danger)]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <select
                    value={l.kind}
                    onChange={(e) => {
                      const kind = e.target.value as RoomLightKind;
                      const def = ROOM_LIGHT_KINDS.find((k) => k.id === kind);
                      patchRoomLight(l.id, { kind, ...(def ? { lumens: def.lumens, colorK: def.colorK } : {}) });
                    }}
                    aria-label={tr('Loại đèn', 'Light kind')}
                    className="h-[var(--tap)] w-full rounded-[6px] border border-[var(--border)] bg-[var(--panel)] px-1.5 text-[10.5px] leading-[1.6] text-[var(--t1)] focus:border-[var(--focus-ring)]"
                  >
                    {ROOM_LIGHT_KINDS.map((k) => (
                      <option key={k.id} value={k.id}>{tr(k.vi, k.en)}</option>
                    ))}
                  </select>

                  <div className="grid grid-cols-3 gap-1">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <label key={axis} className="block">
                        <span className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{axis}</span>
                        <NumberField
                          value={l.posMm[axis]}
                          onCommit={(v) => patchRoomLight(l.id, { posMm: { ...l.posMm, [axis]: v } })}
                          suffix="mm"
                          step={100}
                          ariaLabel={`${axis.toUpperCase()} (mm)`}
                        />
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <label className="block">
                      <span className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Quang thông', 'Luminous flux')}</span>
                      <NumberField
                        value={l.lumens}
                        onCommit={(v) => patchRoomLight(l.id, { lumens: v })}
                        suffix="lm"
                        step={50}
                        min={0}
                        ariaLabel={tr('Quang thông (lumen)', 'Luminous flux (lumen)')}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Nhiệt màu', 'Colour temp')}</span>
                      <NumberField
                        value={l.colorK}
                        onCommit={(v) => patchRoomLight(l.id, { colorK: v })}
                        suffix="K"
                        step={100}
                        min={1000}
                        max={12000}
                        ariaLabel={tr('Nhiệt màu (K)', 'Colour temperature (K)')}
                      />
                    </label>
                  </div>

                  {/* Gắn tầng — đèn trần tầng 3 phải cao theo tầng 3, đúng ngữ nghĩa
                      `RoomLight.levelId` PHU khai (z là cao độ TƯƠNG ĐỐI khi có levelId). */}
                  {levels.length > 0 && (
                    <label className="block">
                      <span className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Gắn tầng', 'Level')}</span>
                      <select
                        value={l.levelId ?? ''}
                        onChange={(e) => patchRoomLight(l.id, { levelId: e.target.value || undefined })}
                        aria-label={tr('Gắn tầng', 'Level')}
                        className="h-[var(--tap)] w-full rounded-[6px] border border-[var(--border)] bg-[var(--panel)] px-1.5 text-[10.5px] leading-[1.6] text-[var(--t1)] focus:border-[var(--focus-ring)]"
                      >
                        <option value="">{tr('— cao độ tuyệt đối —', '— absolute elevation —')}</option>
                        {levels.map((lv) => (
                          <option key={lv.id} value={lv.id}>{lv.name} · {formatThousands(lv.elevationMm)} mm</option>
                        ))}
                      </select>
                    </label>
                  )}

                  {resolved && (
                    <p className="text-[9.5px] leading-relaxed text-[var(--t5)]">
                      {tr(
                        `Cao độ thật ${formatThousands(resolved.posCadMm.z)} mm · ${formatThousands(resolved.candelaIsotropic)} cd (đẳng hướng)`,
                        `Absolute height ${formatThousands(resolved.posCadMm.z)} mm · ${formatThousands(resolved.candelaIsotropic)} cd (isotropic)`,
                      )}
                      {l.kind === 'spot' &&
                        tr(
                          ' — đèn rọi dồn sáng vào nón hẹp nên số cd thật cao hơn; chưa có ô nhập góc nón.',
                          ' — a spot concentrates its flux, so real cd is higher; there’s no beam-angle field yet.',
                        )}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {lighting.rooms.length > 0 && (
          <p className="text-[9.5px] leading-relaxed text-[var(--t5)]">
            {tr(
              'Trong khung nhìn: kéo dấu đèn để đổi chỗ, giữ Shift để kéo lên/xuống.',
              'In the viewport: drag a light marker to move it, hold Shift to move it vertically.',
            )}
          </p>
        )}
      </section>
    </div>
  );
}
