'use client';

/**
 * NotebookButton — nút "Sổ tay dự án · Notebook" trong Header.
 *
 * Điều hướng tới `/projects/[id]/notebook`. Phase 1: chưa có "activeProjectId"
 * trong `useFlowStore` → dùng `flowName` slug hoặc fallback `default`. Khi
 * Larkbase project-picker chín, đọc từ store thay ở đây, không đổi call-site.
 */

import { BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActiveProjectRouteId } from '@/lib/scope';

export function NotebookButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  // SCOPE FIX (Task #18): dùng id ổn định (Project.id thật, hoặc Flow.id) — KHÔNG
  // slug tên flow (trùng tên → 2 dự án khác nhau chung 1 notebook = rò dữ liệu chéo).
  const routeId = useActiveProjectRouteId();
  const goNotebook = () => {
    router.push(`/projects/${routeId}/notebook`);
  };
  return (
    <button
      type="button"
      onClick={goNotebook}
      title="Sổ tay dự án · Project Notebook"
      aria-label="Notebook"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: compact ? 32 : 34,
        padding: compact ? '0 9px' : '0 11px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--field)',
        color: 'var(--t2)',
        fontSize: 12.5,
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flex: '0 0 auto',
      }}
    >
      <BookOpen size={14} strokeWidth={1.5} />
      {!compact && <span>Notebook</span>}
    </button>
  );
}
