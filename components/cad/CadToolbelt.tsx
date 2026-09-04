'use client';

/**
 * components/cad/CadToolbelt.tsx — DOCK KÍNH ổ ⑤ của chặng Vẽ (`SPEC-HA-TANG-UI-IF` Trụ 1,
 * hàng đợi CHINH việc a): gộp `CadToolbar` (pill công cụ, trước tự nổi top-giữa canvas — tràn
 * phải ĐÈ Inspector khi mở, bug ghi nhiều lần) + `CadTouchDock` (cụm cảm ứng Sketch, trước nổi
 * góc dưới-trái) vào MỘT khối kính giữa-dưới Stage, mount qua prop `toolbelt` của `AppShell`.
 *
 * Hình khối theo §2c "một-khối-một-bóng" (SPEC-DESIGN-SYSTEM-IF): một nền kính, một bóng.
 * Hàng 1 là công cụ; hàng 2 đổi theo mode: Sketch = thao tác cảm ứng, Chuyên = ngữ cảnh
 * Model/Paper/BIM. Cùng một khối bo 20 (--r-4), hairline ngăn hàng.
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
import StageToolbelt from '@/components/ui/StageToolbelt';
import { useCadStore } from '@/lib/cad/store';
import { RADIUS, concentricRadius } from '@/lib/geometry';
import { useEffect, useState } from 'react';
import { Eye, FileOutput, FileText, Focus, Layers3, Lock, LockOpen, Plus, Settings2, Terminal } from 'lucide-react';

function fire(name: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name));
}

export default function CadToolbelt() {
  const cadMode = useCadStore((s) => s.cadMode);
  const workspace = useCadStore((s) => s.cadWorkspace);
  const twoRows = cadMode === 'sketch';
  if (cadMode !== 'sketch' && workspace === 'paper') return <PaperToolbelt />;
  return (
    /* 🔴 `pointerEvents:'none'` Ở GỐC — sửa lỗi đo được 04/09, KHÔNG phải chuyện thẩm mỹ.
       Khối kính dùng `marginBottom: 34` để "nổi TRÊN ô lệnh, không đè" (xem docstring đầu tệp).
       Nhưng margin của CON nằm BÊN TRONG hộp CHA, mà cha là con trực tiếp của `.pointer-events-auto`
       trong `AppShell` ⇒ **chính 34px dùng để né lại là 34px nuốt chuột**. Số đo trên app thật
       (1600×900): khối kính đáy y=818, hộp cha đáy y=**852** — mà tâm ô lệnh đúng y=852 ⇒ bấm vào
       ô lệnh rơi trúng `div` rỗng, KHÔNG vào được ô lệnh.
       Cách sửa giữ nguyên bố cục (phiếu cấm thiết kế lại): gốc không nhận sự kiện, hai khối con
       tự nhận. Vùng hở giữa/quanh chúng trả lại cho mặt vẽ và cho ô lệnh. */
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: '100%', minWidth: 0, pointerEvents: 'none' }}>
    {/* 20/08 (LANE A) — hàng NĂNG LỰC GỘP đứng RIÊNG, trên khối kính công cụ. Cố ý không nhét
        chung một khối: lệnh đơn ("xoay", "đo") và năng lực gộp ("dựng hình ảnh") là hai HẠT khác
        nhau — một cái là một cú bấm, một cái là cả dây chuyền có tiêu tiền và có cửa duyệt. Xếp
        chung hàng là nói dối rằng chúng ngang giá. Danh sách đọc từ `workingSetChips()`, thanh 2D
        không biết gì về nó. */}
    <div style={{ pointerEvents: 'auto', maxWidth: '100%', minWidth: 0 }}>
      <StageToolbelt stage="cad" />
    </div>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
        pointerEvents: 'auto',
        marginBottom: 34,
        borderRadius: RADIUS.r4,
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
      {!twoRows && <div style={{ borderTop: '1px solid var(--vien-mo)' }}><ProWorkspaceBar /></div>}
      {twoRows && (
        <div style={{ borderTop: '1px solid var(--vien-mo)', minWidth: 0, overflow: 'hidden' }}>
          <CadTouchDock />
        </div>
      )}
    </div>
    </div>
  );
}

type PaperSelectionState = { scale: number; locked: boolean; clean: boolean };

function paperAction(action: string, value?: number) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cad:paper-action', { detail: { action, value } }));
}

/** Paper chỉ hiện thao tác dàn tờ; không bê nguyên gia phả lệnh vẽ Model sang che giấy. */
function PaperToolbelt() {
  const setWorkspace = useCadStore((s) => s.setCadWorkspace);
  const [state, setState] = useState<PaperSelectionState>({ scale: 100, locked: false, clean: false });
  useEffect(() => {
    const onState = (event: Event) => setState((event as CustomEvent<PaperSelectionState>).detail);
    window.addEventListener('cad:paper-selection-state', onState);
    paperAction('report');
    return () => window.removeEventListener('cad:paper-selection-state', onState);
  }, []);
  return <div className="cad-pill-scroll" style={{ display: 'flex', alignItems: 'center', gap: 5, minHeight: 52, padding: 6, maxWidth: 'calc(100vw - 40px)', overflowX: 'auto', borderRadius: concentricRadius(RADIUS.r4, 0), background: 'color-mix(in srgb, var(--panel) 82%, transparent)', backdropFilter: 'blur(18px) saturate(1.35)', WebkitBackdropFilter: 'blur(18px) saturate(1.35)', border: '1px solid var(--border)', boxShadow: '0 8px 28px rgba(0,0,0,.2)' }}>
    <button type="button" onClick={() => setWorkspace('model')} style={paperToolBtn}><span style={paperModeBadge}>PAPER</span><span style={{ color: 'var(--t3)' }}>Model</span></button>
    <Divider />
    <button type="button" onClick={() => paperAction('add')} style={paperToolBtn} title="Thêm một ô nhìn"><Plus size={15} /> Ô nhìn</button>
    <button type="button" onClick={() => paperAction('center')} style={paperToolBtn} title="Căn ô nhìn vào toàn bộ bản vẽ"><Focus size={15} /> Căn vùng</button>
    <select aria-label="Tỉ lệ ô nhìn trên Paper" value={state.scale} onChange={(event) => paperAction('scale', Number(event.target.value))} style={paperScaleSelect}>
      {PAPER_TOOL_SCALES.map((scale) => <option key={scale} value={scale}>1:{scale}</option>)}
    </select>
    <button type="button" onClick={() => paperAction('lock')} style={{ ...paperToolBtn, ...(state.locked ? paperToolActive : {}) }} title={state.locked ? 'Mở khóa ô nhìn' : 'Khóa ô nhìn'}>{state.locked ? <Lock size={15} /> : <LockOpen size={15} />}<span className="paper-tool-label">{state.locked ? 'Đã khóa' : 'Khóa'}</span></button>
    <button type="button" onClick={() => paperAction('layers')} style={paperToolBtn}><Layers3 size={15} /> Lớp</button>
    <Divider />
    <button type="button" onClick={() => fire('cad:paper-export-dialog-request')} style={paperToolBtn}><Settings2 size={15} /> Thiết lập</button>
    <button type="button" onClick={() => paperAction('clean')} style={{ ...paperToolBtn, ...(state.clean ? paperToolActive : {}) }}><Eye size={15} /> {state.clean ? 'Chỉnh tờ' : 'Xem sạch'}</button>
    <button type="button" onClick={() => fire('cad:paper-export-dialog-request')} style={{ ...paperToolBtn, background: 'var(--accent)', color: '#fff', borderColor: 'transparent' }}><FileOutput size={15} /> Xuất PDF</button>
  </div>;
}

const PAPER_TOOL_SCALES = [20, 25, 50, 75, 100, 150, 200] as const;
const Divider = () => <span aria-hidden style={{ width: 1, height: 24, flex: 'none', background: 'var(--border)' }} />;
const paperToolBtn: React.CSSProperties = { height: 38, flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 10px', borderRadius: concentricRadius(RADIUS.r4, 6), border: '1px solid transparent', background: 'transparent', color: 'var(--t2)', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 650, cursor: 'pointer', whiteSpace: 'nowrap' };
const paperToolActive: React.CSSProperties = { background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' };
const paperModeBadge: React.CSSProperties = { padding: '4px 7px', borderRadius: RADIUS.r1, background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '.06em' };
const paperScaleSelect: React.CSSProperties = { height: 38, flex: 'none', padding: '0 8px', borderRadius: concentricRadius(RADIUS.r4, 6), border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700 };

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
  borderRadius: RADIUS.r2, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)',
  fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
};

const workspaceTab = (active: boolean): React.CSSProperties => ({
  minHeight: 26, padding: '0 8px', borderRadius: RADIUS.r1, border: '1px solid var(--border)',
  background: active ? 'var(--accent)' : 'var(--field)', color: active ? 'white' : 'var(--t2)',
  fontFamily: 'inherit', fontSize: 10.5, fontWeight: 750, letterSpacing: '.08em', cursor: 'pointer',
});
