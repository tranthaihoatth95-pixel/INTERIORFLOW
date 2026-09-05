'use client';

/**
 * components/project-init/ProjectInitBoard.tsx — [marker: ProjectInitBoard]
 * Bảng khởi tạo dự án v1 (`docs/SPEC-KHOI-TAO-DU-AN-2026-08-11.md`): MỘT màn, 3 mảnh dọc
 * PLAN · TASK · TIMELINE — quản lý điền ≤90 giây, mọi ô đều BỎ TRỐNG ĐƯỢC (luật X2, nút
 * "Bỏ qua, tạo trống" luôn có). TASK đọc gợi ý từ lib/tasks/scaffolder (ProjectScaffolder);
 * gợi ý luôn kèm căn cứ "vì loại hình …", người quyết cuối (luật 6): tick/bỏ tự do.
 *
 * Việc gieo mang `stage` (TaskContext Link) qua POST /api/tasks sẵn có — không đẻ API mới.
 * Phân quyền thư mục / gán chủ trì: HIỆN MỜ kèm lý do (FM quyền còn mock — spec mục "chưa
 * làm được" #5), không nút giả (luật §9).
 *
 * Tấm NỔI GIỮA màn, bo 4 góc, vào bằng nhích 10px + scale .97 (chốt 07/08 "card rời" —
 * KHÔNG trượt từ đáy kiểu ngăn kéo); prefers-reduced-motion → hiện thẳng.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Lock, Plus, X } from 'lucide-react';
import { BOARD_TEMPLATES } from '@/components/tasks/TaskBoardScreen';
import { suggestScaffold, stageForTemplate, LOAI_HINH_OPTIONS } from '@/lib/tasks/scaffolder';
import { createFlow, createProject } from '@/lib/workspace';
import { RawStyle } from '@/components/filemanager/RawStyle';

interface Props {
  open: boolean;
  en: boolean;
  /** Mã Larkbase đã chọn TRƯỚC khi bấm ＋ (luồng tuỳ chọn sẵn có của ProjectSelect). */
  larkCode?: string;
  larkName?: string;
  onClose: () => void;
  /** "Bỏ qua, tạo trống" — parent chạy đúng đường tạo-1-click cũ, không qua bảng. */
  onSkip: () => void;
  /** Tạo xong: parent openFlow + vào app. */
  onCreated: (flowId: string) => void;
}

const CSS = `
.pib-scrim { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center;
  background: rgba(0,0,0,.45); padding: 12px; }
/* 🔴 ĐO 05/09 TRÊN APP THẬT, khổ 1440×900 (đúng khổ nghiệm thu của hệ thiết kế):
 * cả hai nút của hộp thoại nằm ở **y = 909**, tức DƯỚI mép màn. .pib-card thừa 123px nội dung
 * và máng cuộn chỉ 2px ⇒ người dùng MỚI mở "Tạo dự án mới" và **không nhìn thấy nút "Tạo dự án"**.
 * Đây là hành động ĐẦU TIÊN của một người dùng mới, và nó vô hình.
 * Cùng họ với luật ngầm mép cuộn (docs/delivery/LUAT-NGAM-MEP-CUON.md): một hộp cuộn không ai
 * sở hữu cái mép. Ở hộp thoại thì nặng hơn — thứ trôi khỏi tầm nhìn là CHÍNH HÀNH ĐỘNG.
 * Chữa: hàng nút GHIM ĐÁY (.pib-footer sticky), và giữ chỗ cho thanh cuộn để có tín hiệu còn tiếp. */
.pib-card { width: min(620px, 100vw - 24px); max-height: min(86vh, 780px); overflow: auto;
  scrollbar-gutter: stable;
  background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius-lg, 20px);
  box-shadow: 0 24px 64px -24px rgba(0,0,0,.5); padding: 18px 20px 16px;
  transform: translateY(0) scale(1); opacity: 1;
  animation: pib-in .2s cubic-bezier(.32,.72,0,1); }
@keyframes pib-in { from { transform: translateY(10px) scale(.97); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .pib-card { animation: none; } }
/* Hàng nút ghim đáy: âm lề để tràn hết bề ngang thẻ, nền đặc để chữ cuộn bên dưới không lộ qua,
 * vạch mảnh phía trên để mắt biết đây là chân hộp thoại chứ không phải một hàng nội dung. */
.pib-footer { position: sticky; bottom: -16px; z-index: 2;
  margin: 10px -20px -16px; padding: 12px 20px 16px;
  background: var(--panel); border-top: 1px solid var(--vien-mo, var(--border)); }
.pib-h { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  color: var(--t3); margin: 0 0 8px; }
.pib-field { display: flex; flex-direction: column; gap: 4px; }
.pib-field > span { font-size: 11.5px; color: var(--t3); }
.pib-input, .pib-select { height: 32px; padding: 0 10px; border-radius: var(--r-2, 10px); font-size: 12.5px;
  border: 1px solid var(--border); background: var(--field); color: var(--t1); outline: none; }
.pib-input:focus, .pib-select:focus { border-color: var(--accent); }
/* "outline: none" ở trên nằm trong <style> của component (đứng SAU globals.css, cùng đặc hiệu
   0-1-0) ⇒ nó THẮNG luật :where(...):focus-visible toàn app — đo trên Chromium: outline 0px none.
   Đổi màu viền là affordance, KHÔNG thay được vòng focus (SPEC-HOVER-FOCUS-IDF §3.6). */
.pib-input:focus-visible, .pib-select:focus-visible {
  outline: var(--stroke-focus) solid var(--focus-ring); outline-offset: 2px; }
.pib-tpl { display: flex; align-items: flex-start; gap: 9px; padding: 8px 10px; border-radius: var(--r-2, 10px);
  border: 1px solid var(--border); background: var(--card); cursor: pointer; }
.pib-tpl:hover { background: var(--hover); }
.pib-tpl[data-on='true'] { border-color: var(--accent); background: var(--accent-soft); }
.pib-btn { height: 34px; padding: 0 14px; border-radius: var(--r-2, 10px); font-size: 12.5px; font-weight: 600;
  border: 1px solid var(--border); background: var(--field); color: var(--t1); cursor: pointer; }
.pib-btn:hover:not(:disabled) { background: var(--hover); }
.pib-btn:disabled { opacity: .5; cursor: not-allowed; }
.pib-btn.pib-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.pib-btn.pib-primary:hover:not(:disabled) { filter: brightness(1.08); }
`;

export function ProjectInitBoard({ open, en, larkCode, larkName, onClose, onSkip, onCreated }: Props) {
  const [name, setName] = useState('');
  const [loaiHinh, setLoaiHinh] = useState('');
  const [dienTich, setDienTich] = useState('');
  const [nganSach, setNganSach] = useState('');
  const [hienTrang, setHienTrang] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [mocBanGiao, setMocBanGiao] = useState(''); // yyyy-mm-dd từ <input type=date>
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gợi ý Scaffolder — nguồn duy nhất là loại hình; trống/khoá lạ → [] (máy im, không đoán).
  const suggestions = useMemo(() => suggestScaffold({ loaiHinh }), [loaiHinh]);
  const reasonFor = useCallback(
    (key: string) => {
      const s = suggestions.find((x) => x.templateKey === key);
      return s ? (en ? s.reasonEn : s.reasonVi) : null;
    },
    [suggestions, en],
  );

  // Đổi loại hình → tick lại theo gợi ý mới (người dùng vẫn sửa tự do sau đó).
  const pickLoaiHinh = useCallback((key: string) => {
    setLoaiHinh(key);
    setTicked(new Set(suggestScaffold({ loaiHinh: key }).map((s) => s.templateKey)));
  }, []);

  const toggleTpl = useCallback((key: string) => {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Esc đóng bảng (khi không đang tạo).
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onEsc); // esc-only: chỉ xử Escape đóng lớp — đúng chuẩn dialog, không cần né ô nhập
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, busy, onClose]);

  const seedCount = useMemo(
    () => BOARD_TEMPLATES.filter((t) => ticked.has(t.key)).reduce((n, t) => n + t.tasks.length, 0),
    [ticked],
  );

  const handleCreate = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const projName = name.trim() || larkName || (en ? 'New project' : 'Dự án mới');
      // 1. Project (kèm mã Larkbase nếu đã chọn từ trước) + Flow gắn thẳng vào project.
      const project = await createProject(projName, larkCode || undefined);
      if (!project?.id) throw new Error(en ? 'Could not create the project.' : 'Không tạo được dự án.');
      const flowId = await createFlow(projName, JSON.stringify({ nodes: [], edges: [] }), project.id);

      // 2. Profile — chỉ ghi khi có ít nhất một ô có giá trị (trống thì KHÔNG tạo hàng rác).
      const patch: Record<string, unknown> = {};
      if (loaiHinh) patch.loaiHinh = loaiHinh;
      const area = parseFloat(dienTich.replace(',', '.'));
      if (dienTich.trim() && Number.isFinite(area) && area > 0) patch.dienTichM2 = area;
      if (nganSach.trim()) patch.nganSach = nganSach.trim();
      if (hienTrang.trim()) patch.hienTrang = hienTrang.trim();
      if (ghiChu.trim()) patch.ghiChu = ghiChu.trim();
      if (mocBanGiao) patch.mocBanGiao = new Date(`${mocBanGiao}T00:00:00`).toISOString();
      if (Object.keys(patch).length > 0) {
        const r = await fetch(`/api/projects/${project.id}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          throw new Error(j?.error || (en ? 'Could not save the profile.' : 'Không lưu được hồ sơ dự án.'));
        }
      }

      // 3. Gieo việc từ các template đã tick — mỗi việc mang `stage` (TaskContext Link).
      let order = 0;
      for (const tpl of BOARD_TEMPLATES) {
        if (!ticked.has(tpl.key)) continue;
        const stage = stageForTemplate(tpl.key);
        for (const [vi, enTitle] of tpl.tasks) {
          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: project.id,
              title: en ? enTitle : vi,
              order: order++,
              ...(stage ? { stage } : {}),
            }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => null);
            throw new Error(j?.error || (en ? 'Could not seed tasks.' : 'Không gieo được việc.'));
          }
        }
      }

      onCreated(flowId);
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : en ? 'Something went wrong.' : 'Có lỗi xảy ra.');
    }
  }, [busy, name, larkName, larkCode, en, loaiHinh, dienTich, nganSach, hienTrang, ghiChu, mocBanGiao, ticked, onCreated]);

  if (!open) return null;

  return (
    <div
      className="pib-scrim"
      role="dialog"
      aria-modal="true"
      aria-label={en ? 'New project setup' : 'Bảng khởi tạo dự án'}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <RawStyle css={CSS} />
      <div className="pib-card">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>
              {en ? 'New project' : 'Dự án mới'}
            </div>
            <div className="text-[11.5px]" style={{ color: 'var(--t3)' }}>
              {en ? 'Fill in 60 seconds — every field optional' : 'Điền trong 60 giây — ô nào cũng bỏ trống được'}
            </div>
          </div>
          <button
            type="button"
            className="pib-btn"
            style={{ height: 28, padding: '0 8px' }}
            aria-label={en ? 'Close' : 'Đóng'}
            onClick={onClose}
            disabled={busy}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── PLAN ── */}
        <section className="mb-4">
          <h3 className="pib-h">{en ? 'Plan — project profile' : 'Plan — hồ sơ dự án'}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="pib-field col-span-2">
              <span>{en ? 'Project name' : 'Tên dự án'}</span>
              <input
                className="pib-input"
                value={name}
                maxLength={120}
                placeholder={larkName || (en ? 'New project' : 'Dự án mới')}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="pib-field">
              <span>{en ? 'Project type' : 'Loại hình'}</span>
              <select className="pib-select" value={loaiHinh} onChange={(e) => pickLoaiHinh(e.target.value)}>
                <option value="">{en ? 'Not set' : 'Chưa chọn'}</option>
                {LOAI_HINH_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {en ? o.en : o.vi}
                  </option>
                ))}
              </select>
            </label>
            <label className="pib-field">
              <span>{en ? 'Area (m²)' : 'Diện tích (m²)'}</span>
              <input
                className="pib-input"
                inputMode="decimal"
                value={dienTich}
                placeholder="120"
                onChange={(e) => setDienTich(e.target.value)}
              />
            </label>
            <label className="pib-field">
              <span>{en ? 'Budget' : 'Ngân sách'}</span>
              <input
                className="pib-input"
                value={nganSach}
                maxLength={160}
                placeholder={en ? 'e.g. 2 billion VND' : 'vd: 2 tỷ'}
                onChange={(e) => setNganSach(e.target.value)}
              />
            </label>
            <label className="pib-field">
              <span>{en ? 'Site condition' : 'Hiện trạng'}</span>
              <input
                className="pib-input"
                value={hienTrang}
                maxLength={160}
                placeholder={en ? 'e.g. bare shell' : 'vd: nhà thô'}
                onChange={(e) => setHienTrang(e.target.value)}
              />
            </label>
            <label className="pib-field col-span-2">
              <span>{en ? 'Notes' : 'Ghi chú'}</span>
              <input
                className="pib-input"
                value={ghiChu}
                maxLength={300}
                onChange={(e) => setGhiChu(e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* ── TASK ── */}
        <section className="mb-4">
          <h3 className="pib-h">{en ? 'Task — starter boards' : 'Task — khung việc'}</h3>
          {suggestions.length === 0 && (
            <div className="mb-2 text-[11.5px]" style={{ color: 'var(--t3)' }}>
              {en
                ? 'Pick a project type to get suggestions — or tick freely.'
                : 'Chọn loại hình để nhận gợi ý — hoặc tự tick.'}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {BOARD_TEMPLATES.map((tpl) => {
              const on = ticked.has(tpl.key);
              const reason = reasonFor(tpl.key);
              return (
                <label key={tpl.key} className="pib-tpl" data-on={on ? 'true' : 'false'}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleTpl(tpl.key)}
                    style={{ accentColor: 'var(--accent)', marginTop: 2 }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold" style={{ color: 'var(--t1)' }}>
                      {en ? tpl.en : tpl.vi}
                      <span className="ml-1.5 font-normal" style={{ color: 'var(--t3)' }}>
                        · {tpl.tasks.length} {en ? 'tasks' : 'việc'}
                      </span>
                    </span>
                    <span className="block text-[11px]" style={{ color: 'var(--t3)' }}>
                      {en ? tpl.descEn : tpl.descVi}
                      {reason ? (
                        <span style={{ color: 'var(--accent)' }}> — {reason}</span>
                      ) : null}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {/* Phân quyền thư mục · gán chủ trì — CHƯA có nền thật (FM quyền còn mock, spec mục
              "chưa làm được" #5) → hiện mờ kèm lý do, không nút giả. */}
          <div
            className="mt-2 flex items-center gap-2 rounded-[10px] border px-2.5 py-2 text-[11.5px]"
            style={{ borderColor: 'var(--border)', color: 'var(--t3)', opacity: 0.65 }}
            title={
              en
                ? 'Folder permissions are still mocked in File Manager — coming later.'
                : 'Quyền thư mục File Manager còn là mock — nối sau.'
            }
          >
            <Lock size={16} />
            <span>{en ? 'Folder access · project lead — coming soon' : 'Phân quyền thư mục · gán chủ trì — sắp có'}</span>
          </div>
        </section>

        {/* ── TIMELINE ── */}
        <section className="mb-4">
          <h3 className="pib-h">{en ? 'Timeline — key date' : 'Timeline — mốc chính'}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="pib-field">
              <span>{en ? 'Handover date' : 'Mốc bàn giao'}</span>
              <input
                className="pib-input"
                type="date"
                value={mocBanGiao}
                onChange={(e) => setMocBanGiao(e.target.value)}
              />
            </label>
            <div className="pib-field justify-end pb-1.5 text-[11px]" style={{ color: 'var(--t3)' }}>
              {en ? 'Detailed milestones: coming soon' : 'Mốc chi tiết: sắp có'}
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-3 text-[12px]" style={{ color: 'var(--danger, #e5484d)' }}>
            {error}
          </div>
        )}

        {/* Footer — GHIM ĐÁY. Trước 05/09 nó cuộn mất khỏi tầm nhìn ở 1440×900 (đo: y=909). */}
        <div className="pib-footer flex items-center justify-between gap-2">
          <button type="button" className="pib-btn" onClick={onSkip} disabled={busy}>
            {en ? 'Skip, create empty' : 'Bỏ qua, tạo trống'}
          </button>
          <button type="button" className="pib-btn pib-primary" onClick={() => void handleCreate()} disabled={busy}>
            {busy ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 size={18} className="animate-spin" />
                {en ? 'Creating…' : 'Đang tạo…'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Plus size={18} />
                {seedCount > 0
                  ? en
                    ? `Create project · ${seedCount} tasks`
                    : `Tạo dự án · ${seedCount} việc`
                  : en
                    ? 'Create project'
                    : 'Tạo dự án'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
