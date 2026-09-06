'use client';

/**
 * components/materials/MaterialImpactPreview.tsx — Cổng R1 mục 4: "Material Impact preview".
 *
 * Bước XEM TRƯỚC chèn vào GIỮA "người dùng chọn vật liệu mới" và "ghi vào Doc" (KS3 duyệt từng
 * phần). Panel chỉ ĐỌC, KHÔNG tự ghi gì: bấm "Áp dụng" mới gọi `onApply` của nơi cắm, và nơi cắm
 * giữ NGUYÊN đường ghi + undo sẵn có (KS4). Không có tham chiếu nào thì vẫn hiện panel với dòng
 * "Không nơi nào khác dùng vật liệu này" — không giấu.
 *
 * V6 (06/09) — BA THỨ ĐỔI, và cả ba đều vì chuỗi hệ quả đang ĐỨT ở đúng chỗ này:
 *
 *  ① **DANH SÁCH TỪNG CHỖ DÙNG, bấm được.** Trước đó panel chỉ bày con số gộp theo nơi tiêu thụ
 *    ("12 tham chiếu") — người dùng biết có 12 chỗ mà **không đi tới được chỗ nào**. Nay mỗi chỗ
 *    là một dòng, bấm là nhảy tới đúng đối tượng đó trên bản vẽ (`lib/cad/nhay-toi.ts`).
 *
 *  ② **PHẠM VI LÀ LỰA CHỌN THẬT, không còn nhị phân.** Trước đó chỉ có hai nút — "chỉ vùng đang
 *    chọn" ↔ "toàn dự án". Muốn đổi 8 trong 12 chỗ thì KHÔNG có đường nào. Nay tick từng dòng, và
 *    `MaterialReplaceScope.usageKeys` chở đúng tập đã tick xuống engine.
 *
 *  ③ **KHÔNG CÒN CHẮN MÀN.** Panel cũ là modal có scrim đen phủ kín: nhảy tới một đối tượng xong
 *    thì… không nhìn thấy gì, vì chính panel đang che bản vẽ. Nay panel neo mép trái, scrim trong
 *    suốt và KHÔNG ăn con trỏ ⇒ vừa soi bản vẽ vừa cân nhắc. Đổi lại: bấm ra ngoài KHÔNG còn là
 *    "huỷ" (Esc và nút Huỷ vẫn nguyên) — một thao tác chọn phạm vi mà lỡ tay ra ngoài là mất sạch
 *    thì tệ hơn nhiều so với việc phải bấm Huỷ cho tường minh.
 *
 * Con số: chỉ hiện số đếm THẬT SỰ đọc được từ tập đang tick. Nơi tiêu thụ nào không có số đếm
 * riêng (Trình bày) thì ghi chữ "đọc lại từ Doc" — không bịa số trang/slide.
 */

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Crosshair, Layers, Package, PaintBucket, Palette, PencilRuler, Presentation, Ruler, Table2, Undo2 } from 'lucide-react';
import type { MaterialUsage, MaterialUsageKind } from '@/lib/materials/impact';
import { useT } from '@/lib/i18n';

/**
 * Một DÒNG trong bảng phạm vi. Rộng hơn `MaterialUsage` đúng hai trường, và cả hai đều để NÓI THẬT:
 *
 *  · `note`     — vùng tô ĐANG CHỌN mà CHƯA có vật liệu cũng là đích của lượt áp này (hành vi có
 *                 từ trước: `applyMaterial` ghi lên mọi hatch đang chọn). Nó không phải "chỗ đang
 *                 dùng vật liệu X" nên không ra từ `inspectMaterialImpact`, nhưng giấu nó đi thì
 *                 con số "áp cho N chỗ" nói thiếu đúng những chỗ sắp bị đổi.
 *  · `lyDoKhoa` — chỗ dùng mà vật liệu mới KHÔNG với tới được. Bày ô tick bấm-không-ra-gì là ô tick
 *                 giả; khoá nó lại và ghi lý do ngay tại dòng thì người dùng biết vì sao.
 */
export interface ImpactRow extends MaterialUsage {
  note?: string;
  lyDoKhoa?: string;
}

export interface MaterialImpactPreviewProps {
  /** Mọi chỗ sắp bị đụng — ĐÓNG BĂNG lúc mở panel, xem docstring nơi cắm. */
  rows: readonly ImpactRow[];
  /** Số vật liệu nguồn khác nhau — bảng vật liệu đếm theo đây, không đếm theo số tham chiếu. */
  specCount: number;
  /** Khoá `MaterialUsage.key` đang được tick. */
  chon: ReadonlySet<string>;
  onToggle: (key: string) => void;
  /** Đặt thẳng tập tick (chip "Tất cả" / "Vùng đang chọn" / "Bỏ chọn hết"). */
  onSetChon: (keys: readonly string[]) => void;
  /** Khoá của những chỗ nằm trong vùng người dùng đang chọn trên bản vẽ. */
  keysVungDangChon: readonly string[];
  /** Nhảy tới chỗ này. Trả false = không tới được (nơi cắm tự báo lý do). */
  onJump: (u: ImpactRow) => boolean;
  /** Tên vật liệu MỚI người dùng vừa chọn — chỉ để hiển thị, nhãn lấy từ nơi cắm, không tự bịa. */
  nextName: string;
  onApply: () => void;
  onCancel: () => void;
}

interface ConsumerRow {
  key: string;
  icon: React.ComponentType<{ size?: number | string }>;
  labelVi: string;
  labelEn: string;
  /** Số tham chiếu mà nơi tiêu thụ này đọc — null = chỉ có cờ, không có số đếm thật. */
  count: number | null;
}

/* ⚠️ CẤM dùng icon hình VUÔNG RỖNG ở đây (`Square`, `SquareDashed`…): nó đứng ngay cạnh ô tick
   thật và mắt đọc thành MỘT Ô TICK THỨ HAI CHƯA ĐÁNH DẤU — bắt được trên ảnh chụp app thật lượt
   06/09. Icon ở cột này chỉ để nói LOẠI, không được mang hình dạng của một điều khiển. */
const KIND_ICON: Record<MaterialUsageKind, React.ComponentType<{ size?: number | string }>> = {
  surface: PaintBucket,
  component: Package,
  'wall-default': Layers,
  'wall-layer': Layers,
};

const KIND_LABEL: Record<MaterialUsageKind, [string, string]> = {
  surface: ['Vùng tô', 'Surface'],
  component: ['Món rời', 'Component'],
  'wall-default': ['Loại tường', 'Wall type'],
  'wall-layer': ['Lớp tường', 'Wall layer'],
};

/**
 * Nơi tiêu thụ nào đọc lại, và đọc BAO NHIÊU — tính từ ĐÚNG tập đang tick.
 * Cùng luật phân loại với `inspectMaterialImpact()` (`lib/materials/impact.ts`), không luật thứ hai.
 */
function buildRows(chonUsages: readonly MaterialUsage[], specCount: number): ConsumerRow[] {
  const entityRefs = chonUsages.filter((u) => u.kind === 'surface' || u.kind === 'component').length;
  const wallRefs = chonUsages.length - entityRefs;
  const componentRefs = chonUsages.filter((u) => u.kind === 'component').length;
  return [
    { key: 'drawing2d', icon: PencilRuler, labelVi: 'Bản vẽ 2D', labelEn: '2D drawing', count: chonUsages.length },
    { key: 'model3d', icon: Box, labelVi: 'Mô hình 3D', labelEn: '3D model', count: chonUsages.length },
    { key: 'boq', icon: Table2, labelVi: 'BOQ / dự toán', labelEn: 'BOQ / estimate', count: entityRefs },
    { key: 'elevations', icon: Ruler, labelVi: 'Mặt đứng', labelEn: 'Elevations', count: wallRefs + componentRefs },
    { key: 'materialBoard', icon: Palette, labelVi: 'Bảng vật liệu', labelEn: 'Material board', count: chonUsages.length ? specCount : 0 },
    // Trình bày đọc lại Doc nhưng không đếm được số trang/slide → không bịa số.
    { key: 'presenting', icon: Presentation, labelVi: 'Hồ sơ trình bày', labelEn: 'Presentation', count: null },
  ];
}

export default function MaterialImpactPreview({
  rows: usages, specCount, chon, onToggle, onSetChon, keysVungDangChon,
  onJump, nextName, onApply, onCancel,
}: MaterialImpactPreviewProps) {
  const tr = useT();
  const [mounted, setMounted] = useState(false);
  /** Chỗ dùng vừa nhảy tới — chỉ để đánh dấu dòng, KHÔNG đổi phạm vi áp. */
  const [dangSoi, setDangSoi] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey); // esc-only: chỉ xử Escape đóng lớp — đúng chuẩn dialog
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const apDuocKeys = useMemo(() => usages.filter((u) => !u.lyDoKhoa).map((u) => u.key), [usages]);
  const chonUsages = useMemo(() => usages.filter((u) => chon.has(u.key)), [usages, chon]);
  const rows = useMemo(() => buildRows(chonUsages, specCount), [chonUsages, specCount]);
  const soChon = chonUsages.length;

  if (!mounted) return null;
  return createPortal(
    // Scrim KHÔNG ăn con trỏ (xem docstring ③) — bản vẽ phía dưới vẫn soi và vẫn thao tác được.
    <div style={scrim} aria-hidden={false}>
      <div
        role="dialog"
        aria-label={tr('Ảnh hưởng khi đổi vật liệu', 'Impact of changing this material')}
        style={card}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 2 }}>
          {tr('Ảnh hưởng khi đổi', 'Impact of this change')}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5, marginBottom: 10 }}>
          {tr('Đổi sang', 'Switching to')} <b style={{ color: 'var(--t2)' }}>{nextName}</b>
          {usages.length > 0
            ? tr(` — chọn ${soChon}/${usages.length} chỗ đang dùng.`, ` — ${soChon} of ${usages.length} uses selected.`)
            : ''}
        </div>

        {usages.length === 0 ? (
          <div style={emptyBox}>
            {tr('Không nơi nào khác dùng vật liệu này.', 'No other place uses this material.')}
          </div>
        ) : (
          <>
            <div style={secHead}>
              <span>{tr('Đổi ở những chỗ nào', 'Where to change')}</span>
              <span style={{ display: 'flex', gap: 4 }}>
                <button type="button" style={chip} className="if-impact-chip" onClick={() => onSetChon(apDuocKeys)}>
                  {tr(`Tất cả ${apDuocKeys.length}`, `All ${apDuocKeys.length}`)}
                </button>
                {keysVungDangChon.length > 0 && (
                  <button type="button" style={chip} className="if-impact-chip" onClick={() => onSetChon(keysVungDangChon)}>
                    {tr(`Đang chọn ${keysVungDangChon.length}`, `Selected ${keysVungDangChon.length}`)}
                  </button>
                )}
                <button type="button" style={chip} className="if-impact-chip" onClick={() => onSetChon([])}>
                  {tr('Bỏ hết', 'None')}
                </button>
              </span>
            </div>

            <ul style={list}>
              {usages.map((u, i) => {
                const KindIcon = KIND_ICON[u.kind];
                const [kVi, kEn] = KIND_LABEL[u.kind];
                const lyDo = u.lyDoKhoa ?? null;
                const ticked = chon.has(u.key);
                const soi = dangSoi === u.key;
                return (
                  <li
                    key={u.key}
                    data-key={u.key}
                    data-owner={u.ownerId}
                    style={{
                      ...usageRow,
                      background: soi ? 'var(--hover)' : 'transparent',
                      opacity: lyDo ? 0.55 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={ticked}
                      disabled={!!lyDo}
                      onChange={() => onToggle(u.key)}
                      style={{ accentColor: 'var(--accent)', width: 14, height: 14, flex: '0 0 auto', cursor: lyDo ? 'not-allowed' : 'pointer' }}
                      aria-label={tr(`${kVi} · ${u.label}`, `${kEn} · ${u.label}`)}
                    />
                    <span style={{ display: 'grid', placeItems: 'center', color: 'var(--t4)', flex: '0 0 auto' }}>
                      <KindIcon size={14} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {/* Nhãn lấy NGUYÊN từ Doc (tên lớp) nên bốn chỗ cùng lớp ra bốn dòng chữ y
                          hệt nhau. Số thứ tự là thứ RẺ NHẤT phân biệt được mà không bịa thêm dữ
                          liệu — muốn biết dòng nào là vật nào thì bấm nút nhảy bên phải. */}
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--t4)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}. </span>
                        {u.label}
                      </span>
                      <span style={{ display: 'block', fontSize: 10, color: 'var(--t4)' }}>
                        {lyDo ?? (u.note ? `${tr(kVi, kEn)} · ${u.note}` : tr(kVi, kEn))}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="if-impact-jump"
                      style={jumpBtn}
                      onClick={() => { if (onJump(u)) setDangSoi(u.key); }}
                      aria-label={tr(`Nhảy tới ${u.label}`, `Jump to ${u.label}`)}
                      title={tr('Nhảy tới chỗ này trên bản vẽ', 'Jump to this place in the drawing')}
                    >
                      <Crosshair size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>

            <div style={{ ...secHead, marginTop: 12 }}>
              <span>{tr('Những đâu đọc lại', 'What reloads')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
              {rows.map((row) => {
                const Icon = row.icon;
                const active = soChon > 0 && (row.count === null || row.count > 0);
                return (
                  <div key={row.key} style={{ ...rowStyle, opacity: active ? 1 : 0.45 }}>
                    <span style={{ display: 'grid', placeItems: 'center', color: active ? 'var(--accent)' : 'var(--t4)' }}>
                      <Icon size={14} />
                    </span>
                    <span style={{ flex: 1, fontSize: 11.5, color: 'var(--t2)' }}>{tr(row.labelVi, row.labelEn)}</span>
                    <span style={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums', color: active ? 'var(--t1)' : 'var(--t4)', fontWeight: 600 }}>
                      {!active
                        ? tr('không đổi', 'unchanged')
                        : row.count === null
                          ? tr('đọc lại từ Doc', 'reloads from Doc')
                          : tr(`${row.count} tham chiếu`, `${row.count} refs`)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--t4)', marginBottom: 12 }}>
          <Undo2 size={14} />
          {tr('Áp xong vẫn hoàn tác được (⌘Z).', 'You can still undo afterwards (⌘Z).')}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={onCancel} style={ghostBtn} className="if-impact-ghost">
            {tr('Huỷ', 'Cancel')}
          </button>
          {/* Nhãn nói THẲNG con số sắp đụng — người bấm biết trước mình vừa đổi bao nhiêu chỗ. */}
          <button type="button" onClick={onApply} style={applyBtn} className="if-impact-apply" autoFocus>
            {usages.length === 0
              ? tr('Áp dụng', 'Apply')
              : tr(`Áp cho ${soChon} chỗ`, `Apply to ${soChon}`)}
          </button>
        </div>
      </div>
      {/* Hover chỉ đổi nền var(--nhip-bam), không scale (SPEC-HOVER-FOCUS-IDF: nút = đổi nền, cấm zoom). */}
      <style>{`
        .if-impact-ghost { transition: background var(--nhip-bam) ease; }
        .if-impact-ghost:hover { background: var(--hover); }
        .if-impact-apply { transition: background var(--nhip-bam) ease; }
        .if-impact-apply:hover { background: color-mix(in srgb, var(--accent) 88%, #000); }
        .if-impact-chip:hover { background: var(--hover); }
        .if-impact-jump:hover { background: var(--hover); color: var(--accent); }
      `}</style>
    </div>,
    document.body,
  );
}

/**
 * Không phủ kín, không ăn con trỏ — chỉ là lớp định vị. Bản vẽ phía dưới vẫn soi được, đó là điều
 * kiện để "nhảy tới chỗ dùng" có nghĩa (xem docstring ③).
 */
const scrim: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 70, // trên MaterialPalette (45) và modal vật liệu (60)
  pointerEvents: 'none',
};
const card: React.CSSProperties = {
  pointerEvents: 'auto',
  position: 'absolute',
  // Né rail điều hướng bên trái (rộng ~108px ở 1440) — che mất đường về Trang chủ chỉ vì một bảng
  // tạm là đổi một thứ người dùng luôn cần lấy một thứ họ chỉ cần lúc này.
  left: 124,
  top: 120,
  maxHeight: 'calc(100vh - 200px)',
  overflowY: 'auto',
  scrollbarGutter: 'stable',
  width: 'min(340px, calc(100vw - 32px))',
  padding: 14,
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'color-mix(in srgb, var(--panel) 92%, transparent)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 12px 40px rgba(0,0,0,.28)',
};
const secHead: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: '.02em',
  color: 'var(--t4)',
  marginBottom: 4,
};
const chip: React.CSSProperties = {
  height: 20,
  padding: '0 8px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--t3)',
  fontSize: 10,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};
const list: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  maxHeight: 192,
  overflowY: 'auto',
  scrollbarGutter: 'stable',
  border: '1px solid var(--border)',
  borderRadius: 10,
};
const usageRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 8px',
};
const jumpBtn: React.CSSProperties = {
  flex: '0 0 auto',
  width: 24,
  height: 24,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--t3)',
  cursor: 'pointer',
};
const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '5px 6px',
  borderRadius: 10,
};
const emptyBox: React.CSSProperties = {
  padding: '10px 12px',
  marginBottom: 10,
  borderRadius: 10,
  border: '1px dashed var(--border)',
  background: 'var(--field)',
  fontSize: 11.5,
  lineHeight: 1.5,
  color: 'var(--t3)',
};
const ghostBtn: React.CSSProperties = {
  height: 30,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--t2)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};
const applyBtn: React.CSSProperties = {
  height: 30,
  padding: '0 14px',
  borderRadius: 10,
  border: 0,
  background: 'var(--accent)',
  color: 'var(--on-accent)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};
