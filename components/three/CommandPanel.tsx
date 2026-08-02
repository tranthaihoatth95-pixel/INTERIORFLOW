'use client';

import { useMemo, useState } from 'react';
import {
  Plus, Pencil, Circle, Video, Layers,
  Box, Square, Grid3x3, DoorOpen, AppWindow, Triangle,
  FileText, Boxes, Library, Search,
  MoveVertical, Move, RotateCw, Scissors, Copy, FlipHorizontal2,
  Eye, EyeOff, Lock, Unlock, Route,
} from 'lucide-react';
import {
  ENGINES, MATERIAL_GROUPS, displayName, materialsIn,
  type MaterialEngine, type MaterialSwatch,
} from '@/lib/three/materials';
import { RawStyle } from './RawStyle';
import { VE3D_CSS } from './ve3d-css';

export type CommandTab = 'tao' | 'sua' | 'vatlieu' | 'camera' | 'hien';

/** 1 vật trong cảnh — dùng cho outliner tab "Hiện". */
export interface SceneObject {
  id: string;
  name: string;
  /** tầng/cao độ, để lọc theo tầng. */
  storey?: string;
  hidden?: boolean;
  locked?: boolean;
}

/** Khối đang chọn — 4 ô kích thước ở tab "Sửa". */
export interface SelectedBox {
  id: string;
  name: string;
  /** mm */
  widthMm: number;
  depthMm: number;
  heightMm: number;
  elevationMm: number;
  matId?: string;
}

export interface CommandPanelProps {
  tab?: CommandTab;
  onTabChange?: (tab: CommandTab) => void;
  selected?: SelectedBox | null;
  objects?: SceneObject[];
  /** matId đang cầm — chọn swatch rồi bấm lên mặt khối để gán. */
  activeMatId?: string | null;
  onPickMaterial?: (matId: string) => void;
  onToggleHidden?: (id: string) => void;
  onToggleLocked?: (id: string) => void;
  onSelectObject?: (id: string) => void;
  onResize?: (patch: Partial<Pick<SelectedBox, 'widthMm' | 'depthMm' | 'heightMm' | 'elevationMm'>>) => void;
  /** mọi lệnh đi qua 1 cửa — id dạng `render.3d.*` (Trụ 4 SPEC-HA-TANG-UI-IF). */
  onCommand?: (commandId: string) => void;
  defaultHeightMm?: number;
  onDefaultHeightChange?: (mm: number) => void;
}

const TABS: { id: CommandTab; label: string; icon: typeof Plus }[] = [
  { id: 'tao', label: 'Tạo', icon: Plus },
  { id: 'sua', label: 'Sửa', icon: Pencil },
  { id: 'vatlieu', label: 'Vật liệu', icon: Circle },
  { id: 'camera', label: 'Camera', icon: Video },
  { id: 'hien', label: 'Hiện', icon: Layers },
];

const CREATE_TOOLS: { cmd: string; label: string; icon: typeof Box }[] = [
  { cmd: 'render.3d.create.box', label: 'Hộp', icon: Box },
  { cmd: 'render.3d.create.wall', label: 'Tường', icon: Square },
  { cmd: 'render.3d.create.floor', label: 'Sàn', icon: Grid3x3 },
  { cmd: 'render.3d.create.door', label: 'Cửa', icon: DoorOpen },
  { cmd: 'render.3d.create.window', label: 'Cửa sổ', icon: AppWindow },
  { cmd: 'render.3d.create.roof', label: 'Mái', icon: Triangle },
];

const IMPORT_SOURCES: { cmd: string; label: string; icon: typeof FileText }[] = [
  { cmd: 'render.3d.import.plan2d', label: 'Bản vẽ 2D', icon: FileText },
  { cmd: 'render.3d.import.gltf', label: 'glTF / OBJ', icon: Boxes },
  { cmd: 'render.3d.import.library', label: 'Thư viện', icon: Library },
];

const EDIT_OPS: { cmd: string; label: string; icon: typeof Move }[] = [
  { cmd: 'render.3d.edit.pushpull', label: 'Kéo cao', icon: MoveVertical },
  { cmd: 'render.3d.edit.move', label: 'Di chuyển', icon: Move },
  { cmd: 'render.3d.edit.rotate', label: 'Xoay', icon: RotateCw },
  { cmd: 'render.3d.edit.bevel', label: 'Vát cạnh', icon: Scissors },
  { cmd: 'render.3d.edit.duplicate', label: 'Nhân bản', icon: Copy },
  { cmd: 'render.3d.edit.mirror', label: 'Đối xứng', icon: FlipHorizontal2 },
];

/**
 * COMMAND PANEL — nội dung ổ ② (navigator) của mode Vẽ 3D, học 3ds Max: 5 tab
 * Tạo · Sửa · Vật liệu · Camera · Hiện.
 *
 * ⚠️ Component này KHÔNG biết gì về shell: nhận props, tự render, không đọc layout/route/store
 * toàn cục. CHINH đang viết `AppShell` 6 ổ — khi xong chỉ việc cắm vào ổ ②, không phải sửa file
 * này (`docs/SPEC-HA-TANG-UI-IF` Trụ 4: mode chỉ khai 4 thứ, cấm state ẩn).
 *
 * Port từ `docs/mocks/mock-ve-3d.html` — mock chỉ vẽ chi tiết tab "Vật liệu"; 4 tab còn lại dựng
 * theo mô tả brief 03/08, dùng lại đúng ngôn ngữ hình khối của mock (xem `ve3d-css.ts`).
 */
export function CommandPanel({
  tab: tabProp,
  onTabChange,
  selected = null,
  objects = [],
  activeMatId = null,
  onPickMaterial,
  onToggleHidden,
  onToggleLocked,
  onSelectObject,
  onResize,
  onCommand,
  defaultHeightMm = 2700,
  onDefaultHeightChange,
}: CommandPanelProps) {
  const [tabState, setTabState] = useState<CommandTab>('vatlieu');
  const tab = tabProp ?? tabState;
  const setTab = (t: CommandTab) => {
    setTabState(t);
    onTabChange?.(t);
  };

  const [engine, setEngine] = useState<MaterialEngine>('if');
  const [query, setQuery] = useState('');
  const [storey, setStorey] = useState<string>('all');

  const storeys = useMemo(() => {
    const s = new Set<string>();
    objects.forEach((o) => o.storey && s.add(o.storey));
    return Array.from(s);
  }, [objects]);

  const visibleObjects = useMemo(
    () => (storey === 'all' ? objects : objects.filter((o) => o.storey === storey)),
    [objects, storey],
  );

  const run = (cmd: string) => onCommand?.(cmd);

  return (
    <div className="if-ve3d cmdp">
      <RawStyle css={VE3D_CSS} />

      <div className="ctabs" role="tablist" aria-label="Bảng lệnh 3D">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'on' : ''}
            onClick={() => setTab(id)}
          >
            <Icon size={14} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      <div className="sbody">
        {/* ───────── TẠO ───────── */}
        {tab === 'tao' && (
          <>
            <div className="tgrid">
              {CREATE_TOOLS.map(({ cmd, label, icon: Icon }) => (
                <button key={cmd} type="button" className="tool" onClick={() => run(cmd)}>
                  <Icon size={18} strokeWidth={1.6} />
                  {label}
                </button>
              ))}
            </div>

            <div className="shelf">
              <div className="zt">Từ nguồn khác</div>
              {IMPORT_SOURCES.map(({ cmd, label, icon: Icon }) => (
                <button key={cmd} type="button" className="row" onClick={() => run(cmd)}>
                  <Icon size={14} strokeWidth={1.75} />
                  {label}
                </button>
              ))}
            </div>

            <div className="fields" style={{ gridTemplateColumns: '1fr' }}>
              <div className="fld">
                <label htmlFor="ve3d-h">Cao độ mặc định</label>
                <div className="box">
                  <input
                    id="ve3d-h"
                    type="number"
                    value={defaultHeightMm}
                    onChange={(e) => onDefaultHeightChange?.(Number(e.target.value))}
                  />
                  <span className="u">mm</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ───────── SỬA ───────── */}
        {tab === 'sua' && (
          <>
            <div className="tgrid">
              {EDIT_OPS.map(({ cmd, label, icon: Icon }) => (
                <button key={cmd} type="button" className="tool" onClick={() => run(cmd)} disabled={!selected}>
                  <Icon size={18} strokeWidth={1.6} />
                  {label}
                </button>
              ))}
            </div>

            {selected ? (
              <>
                <div className="zt" style={{ marginTop: 2 }}>Kích thước · {selected.name}</div>
                <div className="fields">
                  {([
                    ['Rộng', 'widthMm'],
                    ['Sâu', 'depthMm'],
                    ['Cao', 'heightMm'],
                    ['Cao độ đáy', 'elevationMm'],
                  ] as const).map(([label, key]) => (
                    <div className="fld" key={key}>
                      <label htmlFor={`ve3d-${key}`}>{label}</label>
                      <div className="box">
                        <input
                          id={`ve3d-${key}`}
                          type="number"
                          value={selected[key]}
                          onChange={(e) => onResize?.({ [key]: Number(e.target.value) } as Partial<SelectedBox>)}
                        />
                        <span className="u">mm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="empty">Chọn 1 khối trong khung nhìn để sửa kích thước.</p>
            )}
          </>
        )}

        {/* ───────── VẬT LIỆU (mock vẽ chi tiết tab này) ───────── */}
        {tab === 'vatlieu' && (
          <>
            <div className="search">
              <Search size={13} strokeWidth={1.75} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm vật liệu (tag)…"
                aria-label="Tìm vật liệu"
              />
            </div>

            <div className="mtabs" role="group" aria-label="Nguồn vật liệu">
              {ENGINES.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={engine === e.id ? 'on' : ''}
                  aria-pressed={engine === e.id}
                  onClick={() => setEngine(e.id)}
                >
                  {e.label}
                </button>
              ))}
            </div>

            {MATERIAL_GROUPS.map((g) => {
              const list = materialsIn(g.id, query);
              if (list.length === 0) return null;
              return (
                <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="gcap">{g.label}</div>
                  <div className="mgrid">
                    {list.map((m: MaterialSwatch) => (
                      <button
                        key={m.matId}
                        type="button"
                        className={activeMatId === m.matId ? 'msw on' : 'msw'}
                        aria-pressed={activeMatId === m.matId}
                        title={`${displayName(m, engine)} · ${m.matId}`}
                        onClick={() => onPickMaterial?.(m.matId)}
                      >
                        <span className="th" style={{ background: m.swatch }} />
                        <span className="mn">{displayName(m, engine)}</span>
                        <span className="id">{m.matId}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* ⭐ MOAT — câu này phải hiện đúng như mock */}
            <div className="hint">
              Chọn → <b>bấm lên mặt khối</b> để gán. Mã <code>matId</code> giữ nguyên khi xuất sang
              D5 hoặc V-Ray — đổi engine không phải gán lại vật liệu.
            </div>
          </>
        )}

        {/* ───────── CAMERA ───────── */}
        {tab === 'camera' && (
          <>
            <button type="button" className="row" onClick={() => run('render.3d.camera.add')}>
              <Video size={14} strokeWidth={1.75} /> Đặt camera
            </button>
            <button type="button" className="row" onClick={() => run('render.3d.camera.path')}>
              <Route size={14} strokeWidth={1.75} /> Đường quay (campath)
            </button>

            <div className="zt" style={{ marginTop: 4 }}>Thông số</div>
            <div className="fields">
              <div className="fld">
                <label htmlFor="ve3d-lens">Ống kính</label>
                <div className="box">
                  <input id="ve3d-lens" type="number" defaultValue={35} />
                  <span className="u">mm</span>
                </div>
              </div>
              <div className="fld">
                {/* 1650 = tầm mắt người, số đã chốt (SPEC-VIDEO-MAT-BANG; KHÁC 1550 của
                    metrology máy ảnh — 2 con số dễ lẫn, xem docs/00-CHOT.md) */}
                <label htmlFor="ve3d-eye">Tầm mắt</label>
                <div className="box">
                  <input id="ve3d-eye" type="number" defaultValue={1650} />
                  <span className="u">mm</span>
                </div>
              </div>
            </div>
            <div className="hint">Tầm mắt <b>1650mm</b> là chiều cao mắt người đi bộ — số đã chốt cho đường quay.</div>
          </>
        )}

        {/* ───────── HIỆN (outliner) ───────── */}
        {tab === 'hien' && (
          <>
            {storeys.length > 0 && (
              <div className="fld">
                <label htmlFor="ve3d-storey">Tầng</label>
                <div className="box">
                  <select
                    id="ve3d-storey"
                    value={storey}
                    onChange={(e) => setStorey(e.target.value)}
                    style={{ flex: 1, border: 0, background: 'none', outline: 'none', color: 'var(--t1)', font: 'inherit', fontSize: 'var(--fs-xs)' }}
                  >
                    <option value="all">Tất cả tầng</option>
                    {storeys.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}

            {visibleObjects.length === 0 ? (
              <p className="empty">Chưa có vật nào trong cảnh.</p>
            ) : (
              <div className="outl" role="list">
                {visibleObjects.map((o) => (
                  <div key={o.id} className={selected?.id === o.id ? 'orow on' : 'orow'} role="listitem">
                    <button
                      type="button"
                      className="nm"
                      style={{ border: 0, background: 'none', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                      onClick={() => onSelectObject?.(o.id)}
                    >
                      {o.name}
                    </button>
                    <button
                      type="button"
                      className={o.hidden ? 'ib off' : 'ib'}
                      aria-label={o.hidden ? `Hiện ${o.name}` : `Ẩn ${o.name}`}
                      aria-pressed={!o.hidden}
                      onClick={() => onToggleHidden?.(o.id)}
                    >
                      {o.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      type="button"
                      className={o.locked ? 'ib' : 'ib off'}
                      aria-label={o.locked ? `Mở khoá ${o.name}` : `Khoá ${o.name}`}
                      aria-pressed={!!o.locked}
                      onClick={() => onToggleLocked?.(o.id)}
                    >
                      {o.locked ? <Lock size={13} /> : <Unlock size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
