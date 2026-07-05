'use client';
/**
 * Khu Import Thư viện — Reference Ingest (manual-first).
 * Nạp nhiều ảnh / file lớn → chưng cất thành JSON manifest NHẸ, không vỡ context:
 *   ảnh → thumbnail + palette local + gắn USAGE (ref-render / slide / vật liệu / cad / brief) + tag tay.
 * Xuất "AI manifest" (bỏ thumbnail) = vài KB → feed pipeline không tràn context window.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ingestFile, loadManifest, saveManifest, toAiManifest, byteSize, human,
  USAGES, type RefAsset, type RefManifest, type RefUsage,
} from '@/lib/refingest';

const TYPE_BADGE: Record<string, string> = { pdf: 'PDF', excel: 'XLS', cad: 'CAD', other: 'FILE' };

interface Scenario { rank: string; title: string; angle: string; why: string; outline?: string[] }
interface Strategy { understanding?: string; scenarios?: Scenario[] }
interface Pick {
  source: 'reference' | 'openverse';
  refId?: string; url?: string; thumb?: string; title?: string;
  credit?: string; license?: string; landing?: string;
}
const RANK_META: Record<string, { label: string; tone: string }> = {
  best: { label: 'Tốt nhất', tone: '#7C9A6B' },
  uncertain: { label: 'Phân vân', tone: '#C79A63' },
  reject: { label: 'Để loại', tone: '#9A6B84' },
};

export default function IngestPage() {
  const [project, setProject] = useState('Dự án chưa đặt tên');
  const [assets, setAssets] = useState<RefAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [captioning, setCaptioning] = useState(false);
  const [brief, setBrief] = useState('');
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [thinking, setThinking] = useState(false);
  const [illusQuery, setIllusQuery] = useState('');
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [picking, setPicking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const m = loadManifest();
    if (m) { setProject(m.project); setAssets(m.assets); }
    mounted.current = true;
  }, []);

  // autosave manifest (không thọc base64 gốc — chỉ thumbnail nhẹ)
  useEffect(() => {
    if (mounted.current) saveManifest({ project, createdAt: new Date().toISOString(), assets });
  }, [project, assets]);

  const add = async (files: FileList | File[]) => {
    setBusy(true);
    const arr = Array.from(files);
    for (const f of arr) {
      const a = await ingestFile(f);
      setAssets((prev) => [...prev, a]);
    }
    setBusy(false);
  };

  const patch = (id: string, p: Partial<RefAsset>) => setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...p } : a)));
  const remove = (id: string) => setAssets((prev) => prev.filter((a) => a.id !== id));
  const setAllUsage = (u: RefUsage) => setAssets((prev) => prev.map((a) => ({ ...a, usage: u })));

  // Auto-caption VLM (NVIDIA free). "Chỉ báo, không tự tụt": hết free → banner, dừng, KHÔNG fallback.
  // Trả về: 'ok' | 'stop' (không nên chạy tiếp) khi 1 ảnh caption.
  const captionOne = async (a: RefAsset): Promise<'ok' | 'stop'> => {
    if (a.type !== 'image' || !a.thumb) return 'ok';
    const res = await fetch('/api/vision/caption', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: a.thumb }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (body.code === 'NVIDIA_FREE_EXHAUSTED') setNotice('⚠︎ NVIDIA free đã hết lượt — không tự chuyển. Đổi nguồn thủ công (local / oneAI) rồi caption tiếp.');
      else if (body.code === 'NVIDIA_NOT_CONFIGURED') setNotice('Chưa nối NVIDIA. Tạo key free ở build.nvidia.com → thêm NVIDIA_API_KEY vào .env.local → restart.');
      else setNotice(`Lỗi caption: ${body.error ?? res.status}`);
      return 'stop';
    }
    const extra = [body.style, body.room, ...(body.materials ?? [])].map((s: string) => String(s).trim()).filter(Boolean);
    patch(a.id, { caption: String(body.caption ?? ''), tags: Array.from(new Set([...a.tags, ...extra])) });
    return 'ok';
  };

  const captionAll = async () => {
    setNotice(null); setCaptioning(true);
    try {
      for (const a of assets.filter((x) => x.type === 'image' && !x.caption)) {
        if ((await captionOne(a)) === 'stop') break; // hết free → dừng, chờ user đổi nguồn
      }
    } finally { setCaptioning(false); }
  };

  // AI Content Strategist — 3 kịch bản (tốt nhất / phân vân / loại) từ đề bài + reference.
  const suggestStrategy = async () => {
    setThinking(true); setNotice(null);
    try {
      const res = await fetch('/api/strategy/scenarios', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, references: assets.map((a) => ({ name: a.name, caption: a.caption, tags: a.tags, usage: a.usage, content: a.content })) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.code === 'NVIDIA_FREE_EXHAUSTED') setNotice('⚠︎ NVIDIA free đã hết lượt — đổi nguồn thủ công (local / oneAI).');
        else if (body.code === 'NVIDIA_NOT_CONFIGURED') setNotice('Chưa nối NVIDIA. Tạo key free ở build.nvidia.com → NVIDIA_API_KEY vào .env.local → restart.');
        else setNotice(`Lỗi chiến lược: ${body.error ?? res.status}`);
        return;
      }
      setStrategy(body);
    } finally { setThinking(false); }
  };

  // Illustration Picker — thác 3 nguồn: Reference → Openverse (CC) → cờ generate.
  const pickIllustrations = async () => {
    if (!illusQuery.trim()) return;
    setPicking(true); setNotice(null);
    try {
      const res = await fetch('/api/illustration', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: illusQuery, references: assets.map((a) => ({ id: a.id, name: a.name, caption: a.caption, tags: a.tags, usage: a.usage })), count: 6, allowSearch: true, allowGenerate: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setNotice(`Lỗi pick hình: ${body.error ?? res.status}`); return; }
      setPicks(body.picks ?? []);
      if (body.searchError) setNotice(`Nguồn free lỗi: ${body.searchError}`);
    } finally { setPicking(false); }
  };

  const manifest: RefManifest = { project, createdAt: new Date().toISOString(), assets };
  const aiManifest = toAiManifest(manifest);
  const rawBytes = assets.reduce((s, a) => s + a.bytes, 0);
  const aiBytes = byteSize(aiManifest);

  const exportJson = (str: string, name: string) => {
    const a = document.createElement('a');
    a.href = `data:application/json;charset=utf-8,${encodeURIComponent(str)}`;
    a.download = name; a.click();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0E0C09', color: '#EFE9DC', fontFamily: 'system-ui', padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Thư viện · Reference Ingest</h1>
        <input value={project} onChange={(e) => setProject(e.target.value)}
          style={{ background: '#1B1712', border: '1px solid #33302a', color: '#EFE9DC', borderRadius: 8, padding: '6px 10px', fontSize: 13 }} />
      </div>
      <p style={{ opacity: 0.6, fontSize: 12.5, maxWidth: 720 }}>
        Nạp ảnh/file tham khảo → chưng cất JSON nhẹ (palette · công dụng · tag), ảnh giữ dạng thumbnail.
        Feed AI bằng “AI manifest” (bỏ thumbnail) → không vỡ context.
      </p>

      {/* AI Content Strategist — 3 kịch bản trình khách */}
      <div style={{ border: '1px solid #2A261F', borderRadius: 12, background: 'linear-gradient(180deg,#141009,transparent)', padding: 18, margin: '16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontFamily: '"SF Mono",monospace', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#C79A63' }}>AI · Chiến lược content</span>
          <span style={{ fontSize: 11.5, color: '#8B887F' }}>khai thác → hiểu → biện luận → tốt nhất · phân vân · loại</span>
        </div>
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={2}
          placeholder="Đề bài / input dự án Detech: khách là ai, mục tiêu, ràng buộc, mong muốn… (càng rõ, kịch bản càng sắc)"
          style={{ width: '100%', boxSizing: 'border-box', background: '#1B1712', color: '#EFE9DC', border: '1px solid #33302a', borderRadius: 8, padding: '9px 11px', fontSize: 13, resize: 'vertical' }} />
        <button onClick={suggestStrategy} disabled={thinking}
          style={{ ...btnPrimary, marginTop: 10 }}>{thinking ? 'Đang tư duy…' : '◆ Đề xuất 3 kịch bản content'}</button>

        {strategy && (
          <div style={{ marginTop: 16 }}>
            {strategy.understanding && <p style={{ fontSize: 13, color: '#CFC7B8', margin: '0 0 14px', lineHeight: 1.6 }}><b style={{ color: '#C79A63' }}>Hiểu đề:</b> {strategy.understanding}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
              {(strategy.scenarios ?? []).map((s, i) => {
                const rm = RANK_META[s.rank] ?? { label: s.rank, tone: '#8B887F' };
                return (
                  <div key={i} style={{ border: `1px solid ${rm.tone}55`, borderRadius: 10, padding: 14, background: `${rm.tone}0D` }}>
                    <span style={{ fontFamily: '"SF Mono",monospace', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: rm.tone }}>{rm.label}</span>
                    <h3 style={{ fontSize: 15, margin: '6px 0 4px', color: '#EFE9DC', fontWeight: 600 }}>{s.title}</h3>
                    <p style={{ fontSize: 12, color: '#9C8E76', margin: '0 0 8px', fontStyle: 'italic' }}>{s.angle}</p>
                    <p style={{ fontSize: 12, color: '#CFC7B8', margin: '0 0 8px', lineHeight: 1.5 }}>{s.why}</p>
                    {s.outline && s.outline.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: '#8B887F', lineHeight: 1.6 }}>
                        {s.outline.map((o, k) => <li key={k}>{o}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Illustration Picker — thác 3 nguồn */}
      <div style={{ border: '1px solid #2A261F', borderRadius: 12, background: 'linear-gradient(180deg,#100D14,transparent)', padding: 18, margin: '0 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: '"SF Mono",monospace', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#6B84A8' }}>Hình minh hoạ · 3 nguồn</span>
          <span style={{ fontSize: 11.5, color: '#8B887F' }}>Reference → Openverse (không bản quyền) → sinh khi cần</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={illusQuery} onChange={(e) => setIllusQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && pickIllustrations()}
            placeholder="Từ khoá mood/nội dung: vd 'warm minimalist bedroom oak', 'quiet luxury lobby stone'…"
            style={{ flex: 1, background: '#1B1712', color: '#EFE9DC', border: '1px solid #33302a', borderRadius: 8, padding: '9px 11px', fontSize: 13 }} />
          <button onClick={pickIllustrations} disabled={picking} style={{ ...btn, borderColor: '#6B84A8', color: '#9DB8DE' }}>{picking ? 'Đang tìm…' : '◆ Pick hình'}</button>
        </div>
        {picks && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginTop: 14 }}>
            {picks.length === 0 && <p style={{ fontSize: 12, color: '#8B887F', gridColumn: '1/-1' }}>Không tìm thấy — thử từ khoá khác, hoặc bật sinh hình.</p>}
            {picks.map((p, i) => {
              const ref = p.source === 'reference' ? assets.find((a) => a.id === p.refId) : null;
              const src = p.source === 'reference' ? ref?.thumb : p.thumb;
              const tone = p.source === 'reference' ? '#7C9A6B' : '#6B84A8';
              return (
                <div key={i} style={{ border: `1px solid ${tone}55`, borderRadius: 9, overflow: 'hidden', background: '#0B0906' }}>
                  <div style={{ height: 104, background: '#0B0906' }}>
                    {src ? <img src={src} alt={p.title ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <div style={{ padding: '7px 8px' }}>
                    <span style={{ fontFamily: '"SF Mono",monospace', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: tone }}>
                      {p.source === 'reference' ? 'Reference' : `Openverse · ${p.license || 'CC'}`}
                    </span>
                    {p.source === 'openverse' && p.credit && (
                      <p style={{ fontSize: 9.5, color: '#8B887F', margin: '3px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`© ${p.credit}`}>© {p.credit}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) add(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${drag ? '#C79A63' : '#3A362F'}`, borderRadius: 14, padding: 28, textAlign: 'center',
          cursor: 'pointer', background: drag ? 'rgba(199,154,99,0.08)' : 'transparent', margin: '14px 0',
        }}>
        <input ref={inputRef} type="file" multiple hidden accept="image/*,.pdf,.xlsx,.xls,.csv,.dxf,.dwg"
          onChange={(e) => e.target.files && add(e.target.files)} />
        <div style={{ fontSize: 14 }}>{busy ? 'Đang xử lý…' : 'Kéo-thả nhiều ảnh / PDF / Excel / CAD vào đây — hoặc bấm chọn'}</div>
        <div style={{ fontSize: 11.5, opacity: 0.5, marginTop: 4 }}>Ảnh xử lý local (palette + thumbnail). File khác: giữ tham chiếu metadata.</div>
      </div>

      {/* thanh thống kê — bằng chứng "không vỡ context" */}
      {assets.length > 0 && (
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5, background: '#151109', border: '1px solid #2A261F', borderRadius: 10, padding: '10px 14px', margin: '4px 0 14px' }}>
          <span><b>{assets.length}</b> ref</span>
          <span>Ảnh gốc: <b>{human(rawBytes)}</b></span>
          <span style={{ color: '#9FCB8B' }}>→ AI manifest: <b>{human(aiBytes)}</b> {rawBytes > 0 && `(${Math.max(1, Math.round(rawBytes / Math.max(aiBytes, 1)))}× gọn)`}</span>
        </div>
      )}

      {/* banner "chỉ báo" — hết free / chưa nối, KHÔNG tự tụt */}
      {notice && (
        <div style={{ background: '#2A1E12', border: '1px solid #C79A6366', color: '#E9D9BE', borderRadius: 10, padding: '10px 14px', margin: '0 0 14px', fontSize: 12.5, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ flex: 1 }}>{notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'none', border: 'none', color: '#C79A63', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* bulk + export */}
      {assets.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <span style={{ fontSize: 12, opacity: 0.6, alignSelf: 'center' }}>Gán tất cả:</span>
          {USAGES.map((u) => <button key={u.id} onClick={() => setAllUsage(u.id)} style={chip(u.tone)}>{u.label}</button>)}
          <button onClick={captionAll} disabled={captioning} style={{ ...btn, borderColor: '#76b900', color: '#9FCB4B' }}>
            {captioning ? 'Đang đọc ảnh…' : '✨ Auto-caption (NVIDIA free)'}
          </button>
          <span style={{ flex: 1 }} />
          <button onClick={() => exportJson(aiManifest, `${project}-ai-manifest.json`)} style={btnPrimary}>⬇ AI manifest (nhẹ)</button>
          <button onClick={() => exportJson(JSON.stringify(manifest), `${project}-full.json`)} style={btn}>⬇ Full (kèm thumb)</button>
          <button onClick={() => { if (confirm('Xoá hết ref?')) setAssets([]); }} style={btn}>Xoá hết</button>
        </div>
      )}

      {/* lưới ref */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 12 }}>
        {assets.map((a) => {
          const u = USAGES.find((x) => x.id === a.usage)!;
          return (
            <div key={a.id} style={{ background: '#151109', border: `1px solid ${u.tone}55`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ height: 130, background: '#0B0906', display: 'grid', placeItems: 'center', position: 'relative' }}>
                {a.thumb
                  ? <img src={a.thumb} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 22, fontWeight: 700, opacity: 0.5 }}>{TYPE_BADGE[a.type] ?? 'FILE'}</span>}
                <button onClick={() => remove(a.id)} title="Xoá" style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: 6, width: 24, height: 24, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: 10 }}>
                <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.name}>{a.name}</div>
                {a.palette.length > 0 && (
                  <div style={{ display: 'flex', gap: 3, margin: '6px 0' }}>
                    {a.palette.slice(0, 6).map((c, i) => <span key={i} style={{ width: 18, height: 12, borderRadius: 3, background: c, border: '1px solid #0006' }} title={c} />)}
                  </div>
                )}
                <select value={a.usage} onChange={(e) => patch(a.id, { usage: e.target.value as RefUsage })}
                  style={{ width: '100%', background: '#1B1712', color: u.tone, border: `1px solid ${u.tone}66`, borderRadius: 7, padding: '5px 6px', fontSize: 12, marginTop: 4 }}>
                  {USAGES.map((x) => <option key={x.id} value={x.id} style={{ color: '#111' }}>{x.label}</option>)}
                </select>
                <input placeholder="tag: NCC, mã, style…" defaultValue={a.tags.join(', ')}
                  onBlur={(e) => patch(a.id, { tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
                  style={{ width: '100%', boxSizing: 'border-box', background: '#1B1712', color: '#CFC7B8', border: '1px solid #2A261F', borderRadius: 7, padding: '5px 6px', fontSize: 11.5, marginTop: 6 }} />
                {a.caption
                  ? <p style={{ fontSize: 11, color: '#9FCB4B', margin: '7px 0 0', lineHeight: 1.45 }}>✨ {a.caption}</p>
                  : a.type === 'image' && <button onClick={() => captionOne(a)} style={{ marginTop: 7, background: 'none', border: '1px solid #76b90055', color: '#9FCB4B', borderRadius: 6, padding: '3px 8px', fontSize: 10.5, cursor: 'pointer' }}>✨ caption</button>}
              </div>
            </div>
          );
        })}
      </div>

      {assets.length === 0 && !busy && <p style={{ opacity: 0.4, fontSize: 13, marginTop: 20 }}>Chưa có ref nào. Kéo ảnh/tài liệu vào ô trên để bắt đầu.</p>}
    </div>
  );
}

const btn: React.CSSProperties = { background: '#1B1712', color: '#EFE9DC', border: '1px solid #33302a', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { ...btn, background: '#C79A63', color: '#151109', border: 'none', fontWeight: 600 };
function chip(tone: string): React.CSSProperties {
  return { background: `${tone}22`, color: tone, border: `1px solid ${tone}66`, borderRadius: 999, padding: '4px 10px', fontSize: 11.5, cursor: 'pointer' };
}
