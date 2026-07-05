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

export default function IngestPage() {
  const [project, setProject] = useState('Dự án chưa đặt tên');
  const [assets, setAssets] = useState<RefAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
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

      {/* bulk + export */}
      {assets.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <span style={{ fontSize: 12, opacity: 0.6, alignSelf: 'center' }}>Gán tất cả:</span>
          {USAGES.map((u) => <button key={u.id} onClick={() => setAllUsage(u.id)} style={chip(u.tone)}>{u.label}</button>)}
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
