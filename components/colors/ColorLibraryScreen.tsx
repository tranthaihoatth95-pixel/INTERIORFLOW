'use client';

/**
 * components/colors/ColorLibraryScreen.tsx — màn "Bảng màu" (`/colors`).
 *
 * Gom 4 việc của phiếu 05/08 vào một màn:
 *   ① danh sách nguồn đã nạp (studio + dự án) — VIỆC 1
 *   ② tra màu top 3-5 kèm ΔE00 — VIỆC 2  (`ColorMatchPanel`)
 *   ③ dải tham chiếu Color of the Year, có link nguồn — VIỆC 3 (`trend.ts`)
 *   ④ câu cảnh báo độ chính xác, không tắt được — VIỆC 4 (`ColorAccuracyNotice`)
 * cộng cửa chặn lúc chạy (`registry.ts`): tắt nguồn / chặn theo hãng, có hiệu lực ngay.
 *
 * ⛔ App KHÔNG kèm bảng màu của hãng nào. Màn này trống lúc mới mở là ĐÚNG THIẾT KẾ, không
 * phải thiếu dữ liệu — EmptyState nói rõ điều đó thay vì để người dùng tưởng app hỏng.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Palette, Plus, Trash2, Ban, ExternalLink, EyeOff } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useFlowStore } from '@/lib/store';
import { EmptyState } from '@/components/ui/EmptyState';
import { listStudioColorSources, removeStudioColorSource, readProjectColorSources, removeProjectColorSource } from '@/lib/colors/store';
import { applyRegistryConfig, effectiveRegistryConfig, readLocalRegistryConfig, writeLocalRegistryConfig } from '@/lib/colors/registry';
import { TREND_COLORS, TREND_MISSING_YEARS } from '@/lib/colors/trend';
import type { ColorSource } from '@/lib/colors/types';
import { ColorImportWizard } from './ColorImportWizard';
import { ColorMatchPanel } from './ColorMatchPanel';
import { ColorAccuracyNotice } from './ColorAccuracyNotice';

export function ColorLibraryScreen() {
  const tr = useT();
  const projectId = useFlowStore((s) => s.currentProjectId);
  const projectName = useFlowStore((s) => s.flowName) || 'Không tên';

  const [raw, setRaw] = useState<ColorSource[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [blockInput, setBlockInput] = useState('');
  const [config, setConfig] = useState(() => ({ disabledSourceIds: [] as string[], blockedBrands: [] as string[] }));

  const load = useCallback(async () => {
    const studio = listStudioColorSources();
    const project = projectId ? await readProjectColorSources(projectId, projectName) : [];
    setRaw([...studio, ...project]);
    setConfig(effectiveRegistryConfig());
  }, [projectId, projectName]);

  useEffect(() => { void load(); }, [load]);

  /** Danh sách CÓ HIỆU LỰC — đã qua cửa chặn lúc chạy. */
  const sources = useMemo(() => (raw ? applyRegistryConfig(raw, config) : []), [raw, config]);

  const toggleDisabled = (id: string) => {
    const local = readLocalRegistryConfig();
    const has = local.disabledSourceIds.includes(id);
    const next = {
      ...local,
      disabledSourceIds: has ? local.disabledSourceIds.filter((x) => x !== id) : [...local.disabledSourceIds, id],
    };
    writeLocalRegistryConfig(next);
    setConfig(effectiveRegistryConfig());
  };

  const addBlockedBrand = () => {
    const brand = blockInput.trim();
    if (!brand) return;
    const local = readLocalRegistryConfig();
    writeLocalRegistryConfig({ ...local, blockedBrands: [...new Set([...local.blockedBrands, brand])] });
    setBlockInput('');
    setConfig(effectiveRegistryConfig());
  };

  const removeBlockedBrand = (brand: string) => {
    const local = readLocalRegistryConfig();
    writeLocalRegistryConfig({ ...local, blockedBrands: local.blockedBrands.filter((b) => b !== brand) });
    setConfig(effectiveRegistryConfig());
  };

  const onDelete = async (s: ColorSource) => {
    if (!window.confirm(tr(`Xoá bảng "${s.name}"? Không hoàn tác được.`, `Delete "${s.name}"? This cannot be undone.`))) return;
    if (s.scope === 'project' && s.projectId) await removeProjectColorSource(s.projectId, projectName, s.id);
    else removeStudioColorSource(s.id);
    await load();
  };

  const localBlocked = readLocalRegistryConfig();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={headBar}>
        <Palette size={14} style={{ color: 'var(--t4)' }} />
        <span style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 600, color: 'var(--t1)' }}>
          {tr('Bảng màu', 'Colour libraries')}
        </span>
        <span style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--t4)' }}>
          {raw ? tr(`${sources.length} bảng · ${sources.reduce((n, s) => n + s.colors.length, 0)} màu`,
            `${sources.length} librar${sources.length === 1 ? 'y' : 'ies'} · ${sources.reduce((n, s) => n + s.colors.length, 0)} colours`) : ''}
        </span>
        <button type="button" onClick={() => setImporting(true)} style={{ ...btn(true), marginLeft: 'auto' }}>
          <Plus size={13} /> {tr('Nạp bảng màu', 'Import a library')}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {raw !== null && sources.length === 0 ? (
          <EmptyState
            ghost="bays"
            icon={<Palette size={18} />}
            title={tr('Chưa có bảng màu nào', 'No colour library yet')}
            desc={tr(
              'InteriorFlow KHÔNG kèm sẵn bảng màu của hãng nào — bảng màu là tài sản của hãng, mỗi studio tự mang bảng mình được phép dùng vào. Kéo tệp CSV/Excel, dán từ Excel, hoặc nối bảng Larkbase của studio.',
              'InteriorFlow ships with no manufacturer colour libraries — those belong to their owners. Bring in the library you are entitled to use: import a CSV/Excel file, paste from a spreadsheet, or connect your studio Larkbase table.',
            )}
            actions={[
              { label: tr('Nạp bảng màu', 'Import a library'), primary: true, icon: <Plus size={13} />, onClick: () => setImporting(true) },
            ]}
          />
        ) : (
          <>
            <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(raw ?? []).map((s) => {
                const off = config.disabledSourceIds.includes(s.id);
                const live = sources.find((x) => x.id === s.id);
                return (
                  <div key={s.id} style={{ ...rowStyle, opacity: off ? 0.55 : 1 }}>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      {(live ?? s).colors.slice(0, 6).map((c, i) => (
                        <div key={i} title={`${c.code} ${c.name}`} style={{ width: 18, height: 26, borderRadius: 4, background: c.hex, border: '1px solid var(--border)' }} />
                      ))}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12.5, lineHeight: 1.5, fontWeight: 600, color: 'var(--t1)' }}>{s.name}</div>
                      <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--t4)' }}>
                        {tr(
                          `${live?.colors.length ?? 0}/${s.colors.length} màu · ${originLabel(s.origin, tr)} · ${s.scope === 'project' ? 'theo dự án' : 'theo studio'}`,
                          `${live?.colors.length ?? 0}/${s.colors.length} colours · ${originLabel(s.origin, tr)} · ${s.scope === 'project' ? 'project' : 'studio'}`,
                        )}
                        {s.licenseNote ? ` · ${s.licenseNote}` : ''}
                      </div>
                    </div>
                    <button
                      type="button" onClick={() => toggleDisabled(s.id)} style={btn(false)}
                      title={tr('Tắt/bật bảng này mà KHÔNG xoá dữ liệu — dùng khi cần gỡ gấp theo yêu cầu.',
                        'Disable/enable without deleting the data — for a takedown request.')}
                    >
                      <EyeOff size={13} /> {off ? tr('Bật lại', 'Enable') : tr('Tắt', 'Disable')}
                    </button>
                    <button type="button" onClick={() => void onDelete(s)} style={btn(false)}>
                      <Trash2 size={13} /> {tr('Xoá', 'Delete')}
                    </button>
                  </div>
                );
              })}
            </section>

            <ColorMatchPanel sources={sources.filter((s) => s.colors.length > 0)} />
          </>
        )}

        {/* ── Cửa chặn lúc chạy — lý do kiến trúc: có thư yêu cầu gỡ thì đổi ở đây, không build lại app ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ban size={14} style={{ color: 'var(--t4)' }} />
            <span style={{ fontSize: 13, lineHeight: 1.5, fontWeight: 600, color: 'var(--t1)' }}>
              {tr('Chặn theo hãng', 'Block by brand')}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6, color: 'var(--t4)' }}>
            {tr('Có hiệu lực NGAY trên mọi bảng đã nạp, không cần cài lại app. Dùng khi một hãng yêu cầu gỡ dữ liệu của họ.',
              'Takes effect immediately across every imported library — no reinstall needed. Use this when a manufacturer asks for their data to be removed.')}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={blockInput} onChange={(e) => setBlockInput(e.target.value)}
              placeholder={tr('Tên hãng…', 'Brand name…')} style={{ ...fieldStyle, minWidth: 180 }}
            />
            <button type="button" onClick={addBlockedBrand} disabled={!blockInput.trim()} style={btn(false, !blockInput.trim())}>
              {tr('Chặn', 'Block')}
            </button>
            {localBlocked.blockedBrands.map((b) => (
              <button key={b} type="button" onClick={() => removeBlockedBrand(b)} style={chip}
                title={tr('Bấm để bỏ chặn', 'Click to unblock')}>
                {b} ✕
              </button>
            ))}
          </div>
          {config.blockedBrands.length > localBlocked.blockedBrands.length && (
            <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6, color: 'var(--t4)' }}>
              {tr('Một số hãng bị chặn ở mức phát hành (biến môi trường) — máy này không mở lại được.',
                'Some brands are blocked at release level (environment variable) — this machine cannot re-enable them.')}
            </p>
          )}
        </section>

        {/* ── VIỆC 3: giữ THAM CHIẾU xu hướng, không giữ bảng tra ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 13, lineHeight: 1.5, fontWeight: 600, color: 'var(--t1)' }}>
            {tr('Màu của năm — tham chiếu xu hướng', 'Colour of the Year — trend reference')}
          </span>
          <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6, color: 'var(--t4)' }}>
            {tr('Vài mã mỗi năm kèm nguồn dẫn, để bàn gu với khách — KHÔNG phải bảng tra màu.',
              'A handful of entries per year with sources, for talking direction with clients — not a lookup table.')}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TREND_COLORS.map((t, i) => (
              <a key={`${t.year}-${i}`} href={t.source} target="_blank" rel="noreferrer noopener" style={trendCard}>
                <div style={{ width: '100%', height: 34, borderRadius: 6, background: t.hex, border: '1px solid var(--border)' }} />
                <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--t1)', fontWeight: 600 }}>{t.year} · {t.name}</div>
                <div style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {t.publisher}{t.code ? ` ${t.code}` : ''} <ExternalLink size={10} />
                </div>
              </a>
            ))}
            {TREND_MISSING_YEARS.map((y) => (
              <div key={y} style={{ ...trendCard, borderStyle: 'dashed', cursor: 'default' }}
                title={tr('Chưa có nguồn xác thực trong tay — cố ý để trống, không đoán.',
                  'No verified source at hand — deliberately left blank rather than guessed.')}>
                <div style={{ width: '100%', height: 34, borderRadius: 6, border: '1px dashed var(--border-strong)' }} />
                <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--t4)', fontWeight: 600 }}>{y} · {tr('chưa có', 'not added')}</div>
                <div style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--t4)' }}>{tr('cần nguồn dẫn', 'needs a source')}</div>
              </div>
            ))}
          </div>
        </section>

        <ColorAccuracyNotice />
      </div>

      {importing && (
        <ColorImportWizard onClose={() => setImporting(false)} onImported={() => { setImporting(false); void load(); }} />
      )}
    </div>
  );
}

function originLabel(o: ColorSource['origin'], tr: (vi: string, en: string) => string): string {
  if (o === 'larkbase') return tr('Larkbase', 'Larkbase');
  if (o === 'user-paste') return tr('dán tay', 'pasted');
  return tr('tệp CSV/Excel', 'CSV/Excel file');
}

const headBar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 14px',
  borderBottom: '1px solid var(--border)', flexShrink: 0,
};
const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: 8,
  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--field)',
};
const fieldStyle: React.CSSProperties = {
  height: 30, padding: '0 8px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--field)', color: 'var(--t1)', fontSize: 12.5, lineHeight: 1.6, outline: 'none',
};
const chip: React.CSSProperties = {
  height: 26, padding: '0 10px', borderRadius: 999, border: '1px solid var(--border)',
  background: 'var(--field)', color: 'var(--t2)', fontSize: 11.5, lineHeight: 1.6, cursor: 'pointer',
};
const trendCard: React.CSSProperties = {
  width: 128, display: 'flex', flexDirection: 'column', gap: 4, padding: 8, textDecoration: 'none',
  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--field)',
};
function btn(primary: boolean, disabled = false): React.CSSProperties {
  return {
    height: 30, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    border: primary ? 0 : '1px solid var(--border)', borderRadius: 8,
    fontSize: 12, lineHeight: 1.5, fontWeight: 600,
    background: primary ? 'var(--accent)' : 'var(--field)', color: primary ? '#fff' : 'var(--t2)',
  };
}
