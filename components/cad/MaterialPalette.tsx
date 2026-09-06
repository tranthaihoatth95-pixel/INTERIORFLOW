'use client';

/**
 * components/cad/MaterialPalette.tsx — Sprint 5 / Việc 1: panel chọn "vật liệu" cho lệnh Hatch.
 *
 * Khác ShapePalette.tsx (props-in/callback-out thuần), panel này nối thẳng useCadStore — theo
 * đúng pattern các panel khác trong CadEditor.tsx (FurniturePanel/StandardsPanel cũng tự đọc
 * store), vì trạng thái pattern/scale/angle/color của Hatch vốn đã sống trong store (Nấc 4).
 *
 * 3 phần:
 *  0. **Kho vật liệu (G4 · MOAT, 04/09)** — danh sách `ProductSpec` kind='material' THẬT của studio.
 *     Đây là phần DUY NHẤT mang **DANH TÍNH**: click ⇒ ghi `ProductSpec.id` xuống `HatchEntity.specId`,
 *     thứ mà BOQ · 3D · Trình bày thật sự đọc.
 *  1. Lưới "vật liệu" — mỗi ô 1 swatch preview (CSS/pattern, KHÔNG PHẢI ảnh thật — xem
 *     lib/cad/materials.ts đầu file) + tên. Click = applyMaterial() (đổi cả pattern/scale/
 *     angle/màu + chuyển tool sang Hatch luôn, đỡ phải bấm thêm).
 *  2. "Pattern kỹ thuật" — giữ nguyên UI chọn 5 pattern ANSI/SOLID/DOTS + scale/angle thô, cho
 *     ai cần chỉnh tay chi tiết hơn preset vật liệu (không xoá tính năng cũ, chỉ thêm lớp trên).
 *
 * ⛔ VÌ SAO PHẢI TÁCH ①(kho) KHỎI ②(preset thị giác) — đứt gãy đo được 04/09: 13 preset ở
 * `lib/cad/materials.ts` là vật liệu THỊ GIÁC, **không preset nào có mã kho** (`grep matId` trong
 * `MATERIALS` = 0 preset khai). Chúng đổi được HÌNH mà không đổi được DANH TÍNH. Trước lượt này
 * `applyMaterial()` chỉ có nhánh hình ⇒ đổi vật liệu thì hatch đổi nét mà `specId` đứng yên, BOQ
 * vẫn tính theo vật liệu cũ. Danh tính phải đến từ nơi có giá và có nhà cung cấp — tức KHO.
 * Preset thị giác cố ý **KHÔNG** tự gán mã: bịa danh tính còn tệ hơn để trống (`lib/boq/compute.ts`
 * báo `missing-specId` là sự thật đọc được, mã bịa thì không ai bắt được).
 */

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import type { HatchPattern } from '@/lib/cad/model';
import { MATERIALS, materialSwatchStyle, type MaterialDef, type MaterialCategory } from '@/lib/cad/materials';
import { materialTextureDataUrl } from '@/lib/cad/material-texture';
import MaterialImpactPreview from '@/components/materials/MaterialImpactPreview';
import { useT } from '@/lib/i18n';
import { loadMaterialPicks, type MaterialPick } from '@/lib/library/spec-refs';
import { tronPickHatGiong } from '@/lib/materials/kho-mo-dau';
// CÙNG luật danh tính mà chặng 3D dùng (`lib/three/vat-lieu-nhom.ts` re-export chính hàm này).
// Module THUẦN, không kéo `three` vào bundle 2D — xem docstring của nó.
import { matIdCuaNhom } from '@/lib/materials/danh-tinh-vat-lieu';

const PATTERNS: HatchPattern[] = ['SOLID', 'ANSI31', 'ANSI32', 'ANSI37', 'DOTS'];

/** Một lượt bấm đang CHỜ xác nhận — gói đủ cả hai mặt để lúc bấm "Áp dụng" không phải dựng lại. */
type ChoAp =
  | { loai: 'preset'; def: MaterialDef }
  | { loai: 'kho'; row: MaterialPick };

/** Tên hiện trên hộp xác nhận — lấy từ chính dữ liệu, không tự đặt. */
function tenCho(p: ChoAp): string {
  return p.loai === 'preset' ? p.def.name : p.row.name;
}

export default function MaterialPalette({ onClose }: { onClose: () => void }) {
  const tr = useT();
  const hatchMaterialId = useCadStore((s) => s.hatchMaterialId);
  const cadMode = useCadStore((s) => s.cadMode);
  const hatchPattern = useCadStore((s) => s.hatchPattern);
  const hatchScale = useCadStore((s) => s.hatchScale);
  const hatchAngle = useCadStore((s) => s.hatchAngle);
  const hatchColor = useCadStore((s) => s.hatchColor);
  const applyMaterial = useCadStore((s) => s.applyMaterial);
  const replaceMaterial = useCadStore((s) => s.replaceMaterial);
  const hatchSpecId = useCadStore((s) => s.hatchSpecId);
  const setHatchPattern = useCadStore((s) => s.setHatchPattern);
  const setHatchScale = useCadStore((s) => s.setHatchScale);
  const setHatchAngle = useCadStore((s) => s.setHatchAngle);
  const setHatchColor = useCadStore((s) => s.setHatchColor);
  const setTool = useCadStore((s) => s.setTool);
  const doc = useCadStore((s) => s.doc);
  const selection = useCadStore((s) => s.selection);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'all' | MaterialCategory>('all');
  const [hovered, setHovered] = useState<MaterialDef | null>(null);
  /** Material Impact preview (Cổng R1 mục 4) — vật liệu đang CHỜ áp, treo lại tới khi xác nhận. */
  const [pendingPick, setPendingPick] = useState<ChoAp | null>(null);
  /** Kho vật liệu THẬT (`ProductSpec` kind='material'). `null` = chưa nạp xong — khác hẳn `[]`
   * ("đã hỏi, kho rỗng"). Hai trạng thái này nói hai điều khác nhau nên KHÔNG gộp. */
  const [kho, setKho] = useState<MaterialPick[] | null>(null);

  useEffect(() => {
    let con = true;
    /* CẮM ĐIỆN TẦNG HẠT GIỐNG (04/09) — trước dòng này ô chọn vật liệu 2D đọc THUẦN `/api/specs`
       (tức bảng `ProductSpec`), mà vật liệu ship kèm bản cài KHÔNG phải bản ghi DB — nó là tệp
       trong repo. Đo trên máy sạch: `ProductSpec` = 0 ⇒ mặt tiền này LUÔN hiện "Kho chưa có vật
       liệu nào" ⇒ **không có gì để chọn, mọi vùng tô vẽ ra đều không mang mã**. Bốn mặt tiền kia
       (`MaterialsScreen` · `NganPhanTho` · Phần thô · Thư viện) đã trộn hạt giống từ lượt trước;
       đây là mặt tiền còn sót. CONNECT, không NEW: dùng đúng `kho-mo-dau.ts` bốn mặt kia đang dùng.
       Kho hỏng/chưa đăng nhập (`loadMaterialPicks` trả `[]`) thì vẫn còn hạt giống — đúng tinh
       thần local-first: thứ đi theo bản cài không phụ thuộc mạng. */
    loadMaterialPicks().then((r) => { if (con) setKho(tronPickHatGiong(r)); });
    return () => { con = false; };
  }, []);

  const categories = useMemo(() => Array.from(new Set(MATERIALS.map((m) => m.category))), []);
  const shown = tab === 'all' ? MATERIALS : MATERIALS.filter((m) => m.category === tab);

  useEffect(() => setMounted(true), []);

  // Sinh 1 lần hoạ tiết procedural (data URL PNG) cho từng vật liệu, có cache — dùng cho cả swatch
  // nhỏ lẫn preview hover. materialTextureDataUrl tự ưu tiên photoUrl nếu preset có ảnh thật.
  const swatchUrls = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of MATERIALS) map[m.id] = materialTextureDataUrl(m, 96);
    return map;
  }, []);

  // Style nền cho swatch: ảnh procedural nếu có, fallback gradient CSS cũ (SSR / canvas lỗi).
  const swatchBg = (m: MaterialDef): React.CSSProperties => {
    const url = swatchUrls[m.id];
    return url
      ? { backgroundImage: `url("${url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : (materialSwatchStyle(m) as React.CSSProperties);
  };

  /**
   * Material Impact preview (KS3, chèn TRƯỚC bước ghi — impact.ts docstring bắt caller hiển thị
   * impact trước khi thay): chỉ khi đang có vùng tô ĐƯỢC CHỌN thì applyMaterial mới GHI vào Doc
   * (store.ts:804 — nhánh selectedHatches), lúc đó dừng lại hỏi trước. Không có selection thì
   * applyMaterial chỉ đổi "vật liệu đang cầm để vẽ tiếp" (không đụng Doc) — áp thẳng, không hỏi.
   * Đường ghi + undo giữ NGUYÊN: xác nhận xong vẫn gọi đúng applyMaterial cũ (updateEntities đã
   * snapshot ⇒ ⌘Z lùi được).
   */
  const selectedHatches = doc.entities.filter((e) => e.type === 'hatch' && selection.includes(e.id));
  const selectedSpecIds = Array.from(
    new Set(selectedHatches.map((e) => (e.type === 'hatch' ? e.specId : undefined)).filter((id): id is string => !!id)),
  );

  /**
   * ÁP CHO PHẠM VI HẸP — vật đang chọn, hoặc (không chọn gì) "vật liệu đang cầm để vẽ tiếp".
   *
   * Hai nhánh khác nhau ở HAI THAM SỐ CUỐI (`specId` = cuid thương mại · `matId` = UUID vật liệu).
   *  · preset thị giác ⇒ KHÔNG truyền ⇒ entity GIỮ NGUYÊN mã đang có (không xoá mã im lặng), và
   *    "mã đang cầm" về null (không nhận vơ danh tính mình không được trao).
   *    ⚠️ Trừ preset ĐÃ khai `matId` (`tronDefsHatGiong` — hạt giống có UUID thật): lúc đó nó KHÔNG
   *    còn là preset thị giác thuần, và truyền UUID xuống là đúng, không phải "nhận vơ".
   *  · dòng kho ⇒ truyền `row.id` (`ProductSpec.id`) ⇒ danh tính thương mại đi xuống Doc; kèm
   *    `row.matId` (UUID) ⇒ danh tính VẬT LIỆU, thứ chặng 3D tra ra ảnh vân (V8c bước 4).
   *    Nét vẽ giữ nguyên thứ người dùng đang cầm (kho khai giá/NCC, KHÔNG khai nét gạch); màu lấy
   *    `colorHex` của kho nếu kho có khai, không khai thì giữ màu hiện tại — KHÔNG bịa màu.
   *    `matId` rỗng (bản ghi kho chưa backfill) ⇒ không truyền ⇒ 3D rơi về màu phẳng. Đó là sự thật
   *    của bản ghi đó; bịa UUID từ cuid để lấp chỗ trống là dựng một danh tính không tồn tại.
   */
  const reallyApply = (p: ChoAp) => {
    if (p.loai === 'preset') {
      const m = p.def;
      applyMaterial(m.name, m.hatchPattern, m.patternScale, m.patternAngle, m.color, undefined, m.matId ?? undefined);
      return;
    }
    const r = p.row;
    // `matIdCuaNhom` nhận CẢ hai đường: `matId` khai thẳng (dòng kho đã backfill) và `id` dạng
    // `hat-giong:<uuid>` (dòng hạt giống) — một hàm, không hai nhánh tự cắt chuỗi.
    applyMaterial(r.name, hatchPattern, hatchScale, hatchAngle, r.colorHex ?? hatchColor, r.id, matIdCuaNhom({ matId: r.matId ?? undefined, specId: r.id }) ?? undefined);
  };

  /**
   * ÁP CHO TOÀN DỰ ÁN — đi qua ĐÚNG `replaceMaterialReferences` (`lib/materials/impact.ts`), tức
   * cùng cỗ máy mà `MaterialImpactPreview` vừa đếm để trình con số. Đếm bằng một hàm rồi đổi bằng
   * một hàm khác thì bảng tác động thành lời hứa suông.
   * Chỉ có nghĩa khi vật đang chọn ĐÃ có mã (`from`); chưa có mã thì không có gì để "thay".
   */
  const applyProject = (p: ChoAp) => {
    if (p.loai !== 'kho') return;
    for (const from of selectedSpecIds) replaceMaterial(from, p.row.id);
    // Vật đang chọn nếu chưa có mã thì `replaceMaterialReferences` không đụng tới — gán thẳng cho
    // chúng, để "toàn dự án" không bỏ sót đúng thứ người dùng đang trỏ vào.
    reallyApply(p);
  };

  const pick = (p: ChoAp) => {
    if (selectedHatches.length) setPendingPick(p);
    else reallyApply(p);
  };

  if (!mounted) return null;
  return createPortal(
    <div
      style={{
        ...panel,
        right: 16,
        top: 120,
        bottom: cadMode === 'sketch' ? 252 : 120,
        width: 'min(360px, calc(100vw - 32px))',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {pendingPick && (
        // Tự portal ra body (K4) — đặt ở đây chỉ để cùng vòng đời panel, DOM không lồng trong kính.
        <MaterialImpactPreview
          doc={doc}
          specIds={selectedSpecIds}
          nextName={tenCho(pendingPick)}
          selectedCount={selectedHatches.length}
          onApply={() => {
            reallyApply(pendingPick);
            setPendingPick(null);
          }}
          /* Nút "toàn dự án" chỉ có nghĩa khi (a) đang chọn một vật liệu CÓ MÃ để đổi sang, và
             (b) vật đang chọn đã có mã để mà thay. Thiếu một trong hai thì không bày nút. */
          onApplyProject={
            pendingPick.loai === 'kho' && selectedSpecIds.length
              ? () => { applyProject(pendingPick); setPendingPick(null); }
              : undefined
          }
          onCancel={() => setPendingPick(null)}
        />
      )}
      {hovered && (
        <div style={hoverPreview} aria-hidden>
          <span
            style={{
              width: 132, height: 132, borderRadius: 10, border: '1px solid rgba(0,0,0,.2)',
              boxShadow: '0 6px 20px rgba(0,0,0,.22)',
              ...swatchBg(hovered),
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', textAlign: 'center' }}>{hovered.name}</span>
          <span style={{ fontSize: 9.5, color: 'var(--t4)', textAlign: 'center' }}>{hovered.category}</span>
        </div>
      )}
      <div style={panelHead}>
        <span>Vật liệu (Hatch)</span>
        <button type="button" onClick={onClose} style={miniBtn} title="Đóng">
          <X size={14} />
        </button>
      </div>

      <div style={{ minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: '0 2px 4px' }}>

      {/* ───────── ① KHO VẬT LIỆU — phần DUY NHẤT mang danh tính ───────── */}
      <div style={{ paddingBottom: 8 }}>
        <div style={sectionHead}>
          {tr('Kho vật liệu · gán mã', 'Material warehouse · assign code')}
        </div>
        {kho === null ? (
          <div style={khoNote}>{tr('Đang đọc kho…', 'Loading warehouse…')}</div>
        ) : kho.length === 0 ? (
          /* Ô trống là BẰNG CHỨNG còn việc (§9) — nói thẳng vì sao trống và làm gì để hết trống,
             không giấu section đi cho gọn mắt. */
          <div style={khoNote}>
            {tr(
              'Kho chưa có vật liệu nào. Vùng tô vẽ ra sẽ không mang mã, và BOQ sẽ báo thiếu mã — đó là sự thật, không phải lỗi. Thêm vật liệu ở màn Kho vật liệu rồi quay lại.',
              'The warehouse is empty. New fills carry no code and BOQ will report it missing — that is the truth, not a bug. Add materials in the Materials screen first.',
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 2px' }}>
            {kho.map((r) => {
              const dangCam = hatchSpecId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => pick({ loai: 'kho', row: r })}
                  aria-pressed={dangCam}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', minWidth: 0,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: dangCam ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: 'transparent',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 22, height: 22, flex: '0 0 auto', borderRadius: 6,
                      border: '1px solid rgba(0,0,0,.2)',
                      background: r.colorHex ?? 'var(--field)',
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 11, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.name}
                    </span>
                    <span style={{ fontSize: 9.5, color: 'var(--t4)', fontVariantNumeric: 'tabular-nums' }}>
                      {/* Giá chỉ để NHÌN — vật liệu trỏ tới bản ghi thương mại qua `id`, không mang
                          giá theo mình (luật 2.1.9.i). Kho chưa có giá thì hiện "—", không đoán. */}
                      {r.sku ?? '—'} · {r.priceVnd === null ? '—' : r.priceVnd.toLocaleString('vi-VN')}
                      {r.unit ? `/${r.unit}` : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={sectionHead}>{tr('Hình vẽ (không đổi mã)', 'Appearance (code unchanged)')}</div>

      <div style={{ display: 'flex', gap: 4, padding: '0 4px 8px', flexWrap: 'wrap' }}>
        {(['all', ...categories] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setTab(c)}
            style={{
              padding: '3px 8px', borderRadius: 999, border: '1px solid var(--border)', fontSize: 10.5,
              background: tab === c ? 'var(--accent)' : 'transparent', color: tab === c ? '#fff' : 'var(--t3)', cursor: 'pointer',
            }}
          >
            {c === 'all' ? 'Tất cả' : c}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8,
          padding: '0 2px 4px',
        }}
      >
        {shown.map((m) => {
          const active = hatchMaterialId === m.name;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => pick({ loai: 'preset', def: m })}
              onMouseEnter={() => setHovered(m)}
              onMouseLeave={() => setHovered((h) => (h === m ? null : h))}
              onFocus={() => setHovered(m)}
              onBlur={() => setHovered((h) => (h === m ? null : h))}
              title={`${m.name} — hoạ tiết vẽ bằng thuật toán (procedural), chưa có ảnh chụp thật`}
              style={{
                display: 'flex', flexDirection: 'column', gap: 5, padding: 5, minWidth: 0, borderRadius: 10,
                border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: 'transparent', cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '100%', aspectRatio: '4 / 3', borderRadius: 6, border: '1px solid rgba(0,0,0,.15)',
                  ...swatchBg(m),
                }}
              />
              <span style={{ width: '100%', fontSize: 10.5, lineHeight: 1.35, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {m.name}
              </span>
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 9.5, color: 'var(--t4)', padding: '4px 4px 8px', lineHeight: 1.4 }}>
        Hoạ tiết vẽ bằng thuật toán (procedural, chưa phải ảnh chụp thật) — di chuột/chạm giữ để
        xem lớn, chọn xong click 1 điểm trong vùng kín cần tô (giống Hatch cũ).
      </p>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2 }}>
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--t4)', padding: '0 4px 5px' }}>
          Pattern kỹ thuật (chỉnh tay)
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '0 4px 6px' }}>
          {PATTERNS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setHatchPattern(p);
                setTool('hatch');
              }}
              style={{
                padding: '3px 7px', borderRadius: 6, fontSize: 10.5, cursor: 'pointer',
                border: '1px solid var(--border)',
                background: hatchPattern === p && !hatchMaterialId ? 'var(--accent)' : 'var(--field)',
                color: hatchPattern === p && !hatchMaterialId ? '#fff' : 'var(--t2)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '0 4px', alignItems: 'center' }}>
          <label style={{ fontSize: 10, color: 'var(--t3)', display: 'flex', gap: 4, alignItems: 'center' }}>
            Tỉ lệ
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={hatchScale}
              onChange={(e) => setHatchScale(parseFloat(e.target.value) || 1)}
              style={{ width: 46, fontSize: 10.5, background: 'var(--field)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--t2)' }}
            />
          </label>
          <label style={{ fontSize: 10, color: 'var(--t3)', display: 'flex', gap: 4, alignItems: 'center' }}>
            Góc
            <input
              type="number"
              step={5}
              value={hatchAngle}
              onChange={(e) => setHatchAngle(parseFloat(e.target.value) || 0)}
              style={{ width: 46, fontSize: 10.5, background: 'var(--field)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--t2)' }}
            />
          </label>
          <button
            type="button"
            onClick={() => setHatchColor('')}
            title="Bỏ màu vật liệu — quay lại dùng màu layer"
            style={{ fontSize: 9.5, color: 'var(--t4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            reset màu
          </button>
        </div>
      </div>
      </div>
    </div>,
    document.body,
  );
}

const panel: React.CSSProperties = {
  position: 'fixed',
  zIndex: 45,
  background: 'color-mix(in srgb, var(--panel) 82%, transparent)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 8,
  boxShadow: '0 8px 30px rgba(0,0,0,.18)',
};
const hoverPreview: React.CSSProperties = {
  position: 'absolute',
  right: 'calc(100% + 10px)',
  top: 0,
  width: 152,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  padding: 10,
  background: 'color-mix(in srgb, var(--panel) 92%, transparent)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  boxShadow: '0 8px 30px rgba(0,0,0,.24)',
  pointerEvents: 'none',
  zIndex: 16,
};
const sectionHead: React.CSSProperties = {
  fontSize: 10.5,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: 'var(--t4)',
  padding: '0 4px 5px',
};
const khoNote: React.CSSProperties = {
  fontSize: 9.5,
  color: 'var(--t4)',
  lineHeight: 1.45,
  padding: '0 4px 2px',
};
const panelHead: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--t2)',
  padding: '2px 6px 8px',
};
const miniBtn: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 22,
  height: 22,
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  color: 'var(--t3)',
  cursor: 'pointer',
};
