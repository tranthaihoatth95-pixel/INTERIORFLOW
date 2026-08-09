'use client';

/**
 * components/cad/CadToolbelt.tsx — DOCK KÍNH ổ ⑤ của chặng Vẽ (`SPEC-HA-TANG-UI-IF` Trụ 1,
 * hàng đợi CHINH việc a): gộp `CadToolbar` (pill công cụ, trước tự nổi top-giữa canvas — tràn
 * phải ĐÈ Inspector khi mở, bug ghi nhiều lần) + `CadTouchDock` (cụm cảm ứng Sketch, trước nổi
 * góc dưới-trái) vào MỘT khối kính giữa-dưới Stage, mount qua prop `toolbelt` của `AppShell`.
 *
 * Hình khối theo §2c "một-khối-một-bóng" (SPEC-DESIGN-SYSTEM-IF): một nền kính, một bóng.
 * Hàng 1 là công cụ; hàng 2 đổi theo mode: Sketch = thao tác cảm ứng, Chuyên = ngữ cảnh
 * Model/Paper/BIM. Cùng một khối bo 24, hairline ngăn hàng.
 *
 * Vị trí: slot ⑤ của AppShell đặt `bottom-4` của Stage — Stage chặng Vẽ còn `CommandLine` 34px
 * in-flow ở đáy (CadEditor), nên dock tự cộng marginBottom 34 để nổi TRÊN ô lệnh, không đè.
 *
 * Nút "Nội thất"/"Vật liệu" cần state panel nằm sâu trong CadEditor → bắc cầu CustomEvent
 * `cad:toggle-furniture`/`cad:toggle-material` (cùng idiom `cad:zoom-extents`/`cad:cmd-focus`
 * đã dùng khắp chặng Vẽ), CadEditor nghe và toggle — không có bản logic thứ hai.
 */

import CadToolbar from './CadToolbar';
import CadTouchDock from './CadTouchDock';
import { useCadStore } from '@/lib/cad/store';
import { FileText, Terminal } from 'lucide-react';

function fire(name: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name));
}

export default function CadToolbelt() {
  const cadMode = useCadStore((s) => s.cadMode);
  const twoRows = cadMode === 'sketch';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
        marginBottom: 34,
        borderRadius: 24,
        background: 'color-mix(in srgb, var(--panel) 78%, transparent)',
        backdropFilter: 'blur(18px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 30px rgba(0,0,0,.22)',
      }}
    >
      <CadToolbar
        onToggleFurniture={() => fire('cad:toggle-furniture')}
        onToggleMaterial={() => fire('cad:toggle-material')}
      />
      {!twoRows && <div style={{ borderTop: '1px solid var(--mat-hairline)' }}><ProWorkspaceBar /></div>}
      {twoRows && (
        <div style={{ borderTop: '1px solid var(--mat-hairline)', minWidth: 0, overflow: 'hidden' }}>
          <CadTouchDock />
        </div>
      )}
    </div>
  );
}

/** Mode Chuyên phải lộ workflow, không chỉ "thêm nút": dòng này nói rõ đang ở Model Space,
 * đơn vị và tờ in hiện hành; hai CTA mở đúng dòng lệnh/thiết lập tờ đã có thật. */
function ProWorkspaceBar() {
  const doc = useCadStore((s) => s.doc);
  const workspace = useCadStore((s) => s.cadWorkspace);
  const setWorkspace = useCadStore((s) => s.setCadWorkspace);
  const paper = doc.paperKey ?? 'A3';
  const orientation = doc.paperOrientation === 'portrait' ? 'Dọc' : 'Ngang';
  const scale = doc.printScale ? `1:${doc.printScale}` : 'Tự khớp';
  const assigned = doc.entities.filter((entity) => entity.elementType !== undefined).length;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32, padding: '0 10px 6px', fontSize: 11.5, color: 'var(--t3)' }}>
      <button type="button" aria-pressed={workspace === 'model'} onClick={() => setWorkspace('model')} style={workspaceTab(workspace === 'model')}>MODEL</button>
      <button type="button" aria-pressed={workspace === 'paper'} onClick={() => setWorkspace('paper')} style={workspaceTab(workspace === 'paper')}>PAPER</button>
      <span>mm</span>
      <span style={{ width: 1, height: 16, background: 'var(--border)' }} />
      <span>{paper} · {orientation} · {scale}</span>
      <span style={{ width: 1, height: 16, background: 'var(--border)' }} />
      <span>BIM 2D {assigned}/{doc.entities.length}</span>
      <button type="button" onClick={() => fire('cad:cmd-focus')} style={modeActionBtn}>
        <Terminal size={13} /> Lệnh
      </button>
      <button type="button" onClick={() => fire('cad:paper-export-dialog-request')} style={modeActionBtn}>
        <FileText size={13} /> Thiết lập tờ
      </button>
    </div>
  );
}

const modeActionBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, minHeight: 28, padding: '0 9px',
  borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)',
  fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
};

const workspaceTab = (active: boolean): React.CSSProperties => ({
  minHeight: 26, padding: '0 8px', borderRadius: 7, border: '1px solid var(--border)',
  background: active ? 'var(--accent)' : 'var(--field)', color: active ? 'white' : 'var(--t2)',
  fontFamily: 'inherit', fontSize: 10.5, fontWeight: 750, letterSpacing: '.08em', cursor: 'pointer',
});
