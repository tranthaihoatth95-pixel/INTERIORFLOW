'use client';

/**
 * components/review/ReviewPanel.tsx — BẢNG KIỂM BA CHẶNG (p3c, 08/08). Đồng hồ cho động cơ
 * `lib/review/` (khung hai lớp đã dựng + test 20/20, xem `docs/M-REVIEW-OUT.md`) — trước phiếu
 * này grep toàn repo `review2d|review3d|reviewDeck` = 0 nơi gọi (động cơ chạy trong phòng kín).
 *
 * VẼ ĐÚNG SPEC trong docstring `lib/review/index.ts` — KHÔNG thiết kế lại:
 *   phần trên  LUẬT  — đỏ/vàng · dẫn `nguon` · nút "Sửa" khi có `cachSua`
 *   ─── vạch ngăn ───
 *   phần dưới  GỢI Ý — dấu Magic tím + glyph · chữ "gợi ý" · nút "Bỏ qua" · KHÔNG chặn
 *
 * Hai lớp KHÔNG trộn trên màn: hai khối riêng, tiêu đề riêng, và dữ liệu đã TÁCH SẴN từ
 * `ReviewResult` (types.ts khoá ở compile-time) — component này không phân loại gì cả.
 *
 * MỘT chỗ ngồi cho cả ba chặng (CHOT-TACH-AI §4 luật ① "chỗ ngồi cố định"): mount DUY NHẤT ở
 * `AppShell` (ổ mép phải, ngoài Inspector), panel tự đọc chặng đang mở qua prop `active` rồi gọi
 * đúng hàm — không mount 3 bản ở 3 màn.
 *
 * Tay cầm thu/mở = `PanelFlank` dùng chung (Hoà chốt 07/08 — không chế dải thứ hai); mặc định
 * THU (defaultOpen=false) để không chiếm 300px mọi màn, PanelFlank tự nhớ lựa chọn theo panel.
 *
 * Nhảy-tới-đối-tượng: bấm mục → `select([entityId])` của useCadStore + sự kiện `cad:goto-box`
 * CÓ SẴN (`CadCanvas.tsx:434` — fit camera vào box, cùng đường CadSheets dùng). Chặng deck CHƯA
 * nhảy được (dữ liệu deck sống trong PresentEditor — vùng p12 cấm đụng, xem ghi chú DECK dưới).
 *
 * G2: nền đặc `var(--panel)` 100% · G4: mọi chữ line-height ≥1.5 · G6: nút hành động có CHỮ ·
 * G8: PanelFlank là nút bấm, không kéo thả.
 */

import { useMemo, useState } from 'react';
import { Sparkles, Crosshair, Wrench, ShieldCheck } from 'lucide-react';
import PanelFlank from '@/components/ui/PanelFlank';
import { useCadStore } from '@/lib/cad/store';
import { entityBox } from '@/lib/cad/model';
import { review2d, review3d, reviewDeck, type FindingLuat, type FindingGopy, type ReviewChang } from '@/lib/review';
import { useT } from '@/lib/i18n';

export type ReviewPanelStage = 'cad' | 'render' | 'present';

const CHANG_OF_STAGE: Record<ReviewPanelStage, ReviewChang> = { cad: '2d', render: '3d', present: 'deck' };

export default function ReviewPanel({ stage }: { stage: ReviewPanelStage }) {
  const tr = useT();
  return (
    <PanelFlank side="right" storageKey={`review.${stage}`} label={tr('bảng kiểm', 'review board')} defaultOpen={false}>
      <ReviewBody stage={stage} />
    </PanelFlank>
  );
}

/** Ruột tách riêng để chỉ TÍNH khi panel đang mở — PanelFlank không render children lúc thu,
 * nên checkStandards (đo hình học cả Doc) không chạy nền trên mọi màn. */
function ReviewBody({ stage }: { stage: ReviewPanelStage }) {
  const tr = useT();
  const doc = useCadStore((s) => s.doc);
  const chang = CHANG_OF_STAGE[stage];
  // "Bỏ qua" của lớp GỢI Ý — state phiên (không persist): gợi ý là chuyện của lần nhìn này.
  const [boQua, setBoQua] = useState<Set<number>>(new Set());

  const result = useMemo(() => {
    if (chang === '2d') return review2d({ doc, deBai: null });
    if (chang === '3d') return review3d({ doc, deBai: null });
    // DECK: slides sống trong state nội bộ PresentEditor (vùng p12) — vỏ app không với tới nguồn
    // sự thật đó, và đọc bản autosave là đẻ nguồn thứ hai. Trả kết quả rỗng + panel tự ghi chú
    // "chưa nối nguồn deck" ở khối LUẬT (N5 — nói thẳng, không giả vờ đã kiểm).
    return reviewDeck({ deBai: null });
  }, [chang, doc]);

  const nhayToi = (f: FindingLuat) => {
    const st = useCadStore.getState();
    const id = f.viTri?.entityId;
    const e = id ? st.doc.entities.find((x) => x.id === id) : undefined;
    if (e) {
      st.select([e.id]);
      const b = entityBox(e);
      const PAD = 1200;
      window.dispatchEvent(new CustomEvent('cad:goto-box', { detail: { minX: b.minX - PAD, minY: b.minY - PAD, maxX: b.maxX + PAD, maxY: b.maxY + PAD } }));
      return;
    }
    if (f.viTri?.mm) {
      const { x, y } = f.viTri.mm;
      window.dispatchEvent(new CustomEvent('cad:goto-box', { detail: { minX: x - 1500, minY: y - 1500, maxX: x + 1500, maxY: y + 1500 } }));
    }
  };

  const sua = (f: FindingLuat) => {
    nhayToi(f);
    if (f.cachSua) useCadStore.getState().setStatus(`${tr('Sửa', 'Fix')}: ${f.cachSua}`);
  };

  const doCount = result.luat.filter((f) => f.muc === 'do').length;
  const vangCount = result.luat.length - doCount;
  const goiYConLai = result.gopy.filter((_, i) => !boQua.has(i));

  return (
    <div
      style={{
        width: 300, flex: '0 0 300px', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid var(--border)', background: 'var(--panel)', // G2 — nền đặc 100%
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
        <ShieldCheck size={14} color="var(--t3)" />
        <span style={{ fontSize: 12, lineHeight: 1.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)' }}>
          {tr('Bảng kiểm', 'Review board')}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, lineHeight: 1.5, color: 'var(--t4)', fontVariantNumeric: 'tabular-nums' }}>
          {doCount > 0 && <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{doCount} </span>}
          {vangCount > 0 && <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{vangCount}</span>}
          {result.luat.length === 0 && tr('0 vi phạm', '0 issues')}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* ───────────────── KHỐI LUẬT — tất định, dẫn điều khoản ───────────────── */}
        <div style={{ padding: '10px 12px 4px', fontSize: 11, lineHeight: 1.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)' }}>
          {tr('Luật — theo chuẩn, dẫn được điều khoản', 'Rules — standards, citable')}
        </div>

        {chang === 'deck' && (
          <p style={{ margin: '2px 12px 10px', fontSize: 12, lineHeight: 1.5, color: 'var(--t4)' }}>
            {tr(
              'Chưa nối được hồ sơ đang mở — dữ liệu deck sống trong trình dàn trang, phiếu sau nối. Không có gì được kiểm ở chặng này, đây không phải "0 vi phạm".',
              'Deck data lives inside the layout editor — not wired to this board yet. Nothing was checked here; this is not "0 issues".',
            )}
          </p>
        )}
        {chang !== 'deck' && result.luat.length === 0 && (
          <p style={{ margin: '2px 12px 10px', fontSize: 12, lineHeight: 1.5, color: 'var(--t4)' }}>
            {tr('Không phát hiện vi phạm nào trên bản vẽ hiện tại.', 'No violations found in the current drawing.')}
          </p>
        )}

        {result.luat.map((f, i) => (
          <div key={`${f.ruleId}-${i}`} style={{ margin: '0 10px 8px', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
              <span
                aria-label={f.muc === 'do' ? tr('Mức đỏ — sai chuẩn bắt buộc', 'Red — mandatory violation') : tr('Mức vàng — khuyến nghị', 'Yellow — advisory')}
                style={{ width: 8, height: 8, borderRadius: 999, marginTop: 5, flexShrink: 0, background: f.muc === 'do' ? 'var(--danger)' : 'var(--warning)' }}
              />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--t1)' }}>{f.moTa}</p>
                <p style={{ margin: '3px 0 0', fontSize: 10, lineHeight: 1.5, color: 'var(--t4)', wordBreak: 'break-word' }}>{f.nguon}</p>
                {f.chuaKiemChung && (
                  <span style={{ display: 'inline-block', marginTop: 4, padding: '1px 6px', borderRadius: 6, fontSize: 10, lineHeight: 1.5, fontWeight: 700, color: 'var(--warning)', border: '1px solid var(--warning)' }}>
                    {tr('CHƯA KIỂM CHỨNG VỚI VĂN BẢN GỐC', 'NOT VERIFIED AGAINST SOURCE TEXT')}
                  </span>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {(f.viTri?.entityId || f.viTri?.mm) && (
                    <button type="button" onClick={() => nhayToi(f)} style={btnNho}>
                      <Crosshair size={11} strokeWidth={2} />
                      {tr('Tới chỗ này', 'Go there')}
                    </button>
                  )}
                  {f.cachSua && (
                    <button type="button" onClick={() => sua(f)} title={f.cachSua} style={btnNho}>
                      <Wrench size={11} strokeWidth={2} />
                      {tr('Sửa', 'Fix')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ─── vạch ngăn — hai lớp là hai bản chất, không trộn ─── */}
        <div style={{ height: 1, background: 'var(--border)', margin: '6px 0 0' }} />

        {/* ───────────────── KHỐI GỢI Ý — Magic, không màu cảnh báo, không chặn ───────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px 4px' }}>
          <Sparkles size={12} color="var(--accent)" />
          <span style={{ fontSize: 11, lineHeight: 1.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            {tr('Gợi ý — Magic, chỉ là ý kiến', 'Suggestions — Magic, opinions only')}
          </span>
        </div>

        {result.gopyBiChan && (
          <p style={{ margin: '2px 12px 12px', fontSize: 12, lineHeight: 1.5, color: 'var(--t4)' }}>{result.gopyBiChan}</p>
        )}
        {goiYConLai.map((g: FindingGopy, i: number) => (
          <div key={i} style={{ margin: '0 10px 8px', padding: '8px 10px', borderRadius: 10, border: '1px dashed color-mix(in srgb, var(--accent) 45%, transparent)', background: 'var(--card)' }}>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--t2)' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{tr('gợi ý', 'suggestion')} · </span>
              {g.moTa}
            </p>
            <button type="button" onClick={() => setBoQua((s) => new Set(s).add(i))} style={{ ...btnNho, marginTop: 6 }}>
              {tr('Bỏ qua', 'Dismiss')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const btnNho: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 9px',
  borderRadius: 6, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)',
  fontSize: 11, lineHeight: 1.5, fontWeight: 600, cursor: 'pointer',
};
