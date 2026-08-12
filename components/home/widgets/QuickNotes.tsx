'use client';

/**
 * components/home/widgets/QuickNotes.tsx — [marker: DongStudio] Ô F "Ghi chú nhanh kiểu Tot"
 * (bento v3, docs/phieu-giao/home-bento-v3.md ④.2) — dải chấm màu theo dự án gần dùng + 1 ô gõ
 * ngay (Enter = lưu, KHÔNG form/modal). Lưu qua `lib/home/notes-store.ts`
 * (`uploads/home-notes/<userId>.json`, KHÔNG bảng DB mới).
 *
 * Widget LUÔN hiện (ô gõ hữu ích ngay cả khi chưa có ghi chú/dự án nào — khác các widget khác
 * chỉ hiện khi có dữ liệu, vì đây là NƠI TẠO dữ liệu, không phải nơi đọc).
 *
 * v3 (④.2 "kéo một chấm note thả vào card dự án ở ô A → note gắn dự án đó") — mỗi ghi chú đã lưu
 * giờ KÉO ĐƯỢC (HTML5 DnD, `dataTransfer` khoá `text/if-note-id`) thả vào 1 card ở
 * `components/ProjectSelect.tsx` (prop `onNoteDrop`, PATCH `/api/home/notes`). Có fallback CLICK
 * (bấm note → "gắn" armed, đổi viền sáng — tactile theo gu 13/08; bấm 1 card dự án tiếp theo =
 * gán, KHÔNG cần kéo chuột chính xác) — `armedNoteId`/`onArmNote` là state NÂNG lên
 * `DongStudioHome` (dùng chung với ô A).
 */

import { useEffect, useState, useCallback } from 'react';
import { useT } from '@/lib/i18n';
import WidgetCard from './WidgetCard';
import type { HomeSummary } from './types';

interface HomeNote {
  id: string;
  projectId: string | null;
  text: string;
  createdAt: string;
}

/** Hash tên → màu — CÙNG công thức `avatarGradient` của ProjectSelect.tsx (đọc, không import
 * chéo component nội bộ của file khác — tự chứa để không tăng phụ thuộc chéo ngoài vùng). */
function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 58% 54%)`;
}

/** Khoá `dataTransfer` dùng chung với `ProjectSelect.tsx` (`onNoteDrop`) — MỘT nơi khai để 2 file
 * không lệch chuỗi khoá (đã thử: lệch khoá là kéo-thả câm lặng, khó soi bằng mắt). */
export const NOTE_DRAG_MIME = 'text/if-note-id';

export default function QuickNotes({
  summary,
  armedNoteId,
  onArmNote,
  refreshKey,
  index,
}: {
  summary: HomeSummary;
  /** id ghi chú đang "cầm sẵn" chờ gắn dự án (fallback click-chọn) — null = không cầm gì. */
  armedNoteId?: string | null;
  onArmNote?: (id: string | null) => void;
  /** đổi giá trị này (DongStudioHome tăng sau khi PATCH gán note từ NGOÀI widget này — kéo-thả
   * vào card dự án ô A) → tải lại danh sách, để chấm màu note cập nhật đúng dự án mới gán. */
  refreshKey?: number;
  index?: string;
}) {
  const tr = useT();
  const [notes, setNotes] = useState<HomeNote[] | null>(null);
  const [text, setText] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/home/notes')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j) setNotes(j.notes ?? []);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const save = useCallback(async () => {
    const t = text.trim();
    if (!t || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/home/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, projectId }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(j.notes)) {
        setNotes(j.notes);
        setText('');
      }
    } catch {
      /* best-effort — ô gõ giữ nguyên chữ để thử lại, không mất việc người dùng vừa gõ */
    } finally {
      setSaving(false);
    }
  }, [text, projectId, saving]);

  const projectName = (id: string | null) =>
    id ? summary.recentProjects.find((p) => p.id === id)?.name ?? null : null;

  return (
    <WidgetCard dense index={index} title={tr('Ghi chú nhanh', 'Quick notes')} bodyClassName="flex flex-col overflow-hidden">
      {armedNoteId && (
        <button
          type="button"
          onClick={() => onArmNote?.(null)}
          className="mb-1.5 flex w-full items-center justify-between gap-1.5 rounded-[var(--r-2)] px-2 py-1 text-left font-mono text-[length:var(--fs-2xs)] uppercase tracking-wide"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          {tr('Đã chọn — bấm dự án ở ô Dự án để gắn', 'Armed — click a project card to attach')}
          <span aria-hidden>✕</span>
        </button>
      )}
      {summary.recentProjects.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setProjectId(null)}
            title={tr('Ghi chú chung', 'General note')}
            aria-pressed={projectId === null}
            className="h-3.5 w-3.5 shrink-0 rounded-full"
            style={{
              background: 'var(--t5)',
              outline: projectId === null ? '2px solid var(--accent)' : undefined,
              outlineOffset: 2,
            }}
          />
          {summary.recentProjects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProjectId(p.id)}
              title={p.name}
              aria-pressed={projectId === p.id}
              className="h-3.5 w-3.5 shrink-0 rounded-full"
              style={{
                background: colorFor(p.id),
                outline: projectId === p.id ? '2px solid var(--accent)' : undefined,
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="flex items-center gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            projectId
              ? tr(`Ghi cho ${projectName(projectId)}…`, `Note for ${projectName(projectId)}…`)
              : tr('Gõ ghi chú rồi Enter…', 'Type a note, then Enter…')
          }
          className="min-w-0 flex-1 rounded-full px-3.5 py-1.5 text-[length:var(--fs-sm)] text-[var(--t1)] outline-none"
          style={{ background: 'var(--field)' }}
        />
        <button
          type="submit"
          disabled={!text.trim() || saving}
          className="shrink-0 rounded-full px-3.5 py-1.5 text-[length:var(--fs-xs)] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
        >
          {tr('Lưu', 'Save')}
        </button>
      </form>

      {notes && notes.length > 0 && (
        <ul className="mt-2.5 min-h-0 flex-1 space-y-1 overflow-y-auto">
          {notes.slice(0, 8).map((n) => {
            const armed = armedNoteId === n.id;
            return (
              <li
                key={n.id}
                draggable={!!onArmNote}
                onDragStart={(e) => {
                  e.dataTransfer.setData(NOTE_DRAG_MIME, n.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => onArmNote?.(armed ? null : n.id)}
                title={tr('Kéo — hoặc bấm rồi chọn 1 dự án — để gắn ghi chú', 'Drag — or click, then pick a project — to attach')}
                className="flex cursor-grab items-center gap-2 rounded-[var(--r-2)] px-1.5 py-1 text-[length:var(--fs-xs)] text-[var(--t3)] transition-colors active:cursor-grabbing hover:bg-[var(--hover)]"
                style={
                  armed
                    ? { outline: '1.5px solid var(--accent)', outlineOffset: -1, boxShadow: '0 0 0 3px var(--accent-soft)' }
                    : undefined
                }
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: n.projectId ? colorFor(n.projectId) : 'var(--t5)' }}
                />
                <span className="truncate">{n.text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
