'use client';

/**
 * /projects/[id]/overview — TỔNG QUAN một dự án (Task #18 · nền T0).
 *
 * SCOPE 'project' (lib/scope.ts): trang này BẮT BUỘC thuộc đúng dự án `[id]` trên URL.
 * Mọi dữ liệu (flows, thành viên, chặng) lấy từ `/api/projects/[id]/overview` — API
 * đã lọc chặt theo `[id]`, không rò dữ liệu dự án khác. `[id]` là điểm neo chân lý,
 * KHÔNG đọc state global (currentFlowId/flowName) để suy ra dự án.
 *
 * Đây là màn "đúng dự án được click" mà card ở Gallery điều hướng tới (fix bug card
 * mở nhầm/mở chung dự án). Route giữ tên `/projects/` — KHÔNG đổi URL.
 *
 * Nhận diện: UI trung tính của chính InteriorFlow (không hardcode thương hiệu nào —
 * LUẬT NỀN TẢNG CLAUDE.md). Song ngữ VI·EN qua useT().
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, BookOpen, LayoutGrid, Users, Layers, ArrowRight, Loader2 } from 'lucide-react';
import { useScope } from '@/lib/scope';
import { useT } from '@/lib/i18n';

interface OverviewFlow {
  id: string;
  name: string;
  coverUrl: string;
  status: string;
  updatedAt: string;
  version: number;
}
interface OverviewData {
  kind: 'project' | 'flow';
  scope: 'project';
  id: string;
  myRole: string;
  project: {
    id: string;
    name: string;
    clientName: string | null;
    larkProjectCode: string | null;
    currentStage: string;
    stageLocked: boolean;
    createdAt: string | null;
  } | null;
  memberCount: number;
  flows: OverviewFlow[];
}

const STAGE_LABEL: Record<string, [string, string]> = {
  concept: ['Drafting CAD', 'Drafting CAD'],
  render: ['Rendering', 'Rendering'],
  present: ['Presenting', 'Presenting'],
};

export default function ProjectOverviewPage() {
  const params = useParams<{ id: string }>();
  const { projectId } = useScope(); // scope 'project' — chân lý từ URL
  const id = projectId ?? params?.id ?? 'default';
  const router = useRouter();
  const t = useT();

  const [data, setData] = useState<OverviewData | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');

  useEffect(() => {
    let alive = true;
    setState('loading');
    fetch(`/api/projects/${encodeURIComponent(id)}/overview`)
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 404) return setState('notfound');
        if (!r.ok) return setState('error');
        const j = (await r.json()) as OverviewData;
        if (!alive) return;
        setData(j);
        setState('ok');
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, [id]);

  const name = data?.project?.name ?? '';
  const stage = data?.project?.currentStage ?? 'concept';
  const stageLabel = STAGE_LABEL[stage]?.[0] ?? stage;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--t1)',
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 9px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--t2)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 12.5,
          }}
        >
          <ChevronLeft size={14} /> {t('Về Thư viện', 'Gallery')}
        </button>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--t4)',
          }}
        >
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            InteriorFlow
          </Link>{' '}
          / {t('Dự án', 'Project')}
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px 64px' }}>
        {state === 'loading' && (
          <div style={{ display: 'grid', placeItems: 'center', padding: '80px 0' }}>
            <Loader2 size={22} className="animate-spin" style={{ color: 'var(--t4)' }} />
          </div>
        )}

        {state === 'notfound' && (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--t3)' }}>
            <p style={{ fontSize: 15 }}>{t('Không tìm thấy dự án này.', 'This project was not found.')}</p>
            <p style={{ fontSize: 12.5, marginTop: 8, color: 'var(--t4)' }}>
              {t('Có thể dự án đã bị xoá hoặc bạn không có quyền truy cập.', 'It may have been deleted, or you may not have access.')}
            </p>
            <button
              type="button"
              onClick={() => router.push('/')}
              style={{
                marginTop: 20,
                padding: '8px 16px',
                borderRadius: 9,
                border: '1px solid var(--border)',
                background: 'var(--field)',
                color: 'var(--t2)',
                cursor: 'pointer',
                fontSize: 12.5,
              }}
            >
              {t('Về Thư viện dự án', 'Back to Gallery')}
            </button>
          </div>
        )}

        {state === 'error' && (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--t3)' }}>
            {t('Không tải được tổng quan — thử lại.', 'Could not load overview — try again.')}
          </div>
        )}

        {state === 'ok' && data && (
          <>
            {/* Tiêu đề dự án */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: 'var(--t4)',
                    marginBottom: 6,
                  }}
                >
                  {t('Tổng quan · Overview', 'Overview · Tổng quan')}
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0, lineHeight: 1.15 }}>{name}</h1>
                {data.project?.clientName && (
                  <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 6 }}>{data.project.clientName}</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  href={`/projects/${encodeURIComponent(id)}/notebook`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 14px',
                    borderRadius: 9,
                    border: '1px solid var(--border)',
                    background: 'var(--field)',
                    color: 'var(--t2)',
                    textDecoration: 'none',
                    fontSize: 12.5,
                  }}
                >
                  <BookOpen size={14} /> {t('Sổ tay · Notebook', 'Notebook')}
                </Link>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 14px',
                    borderRadius: 9,
                    border: 'none',
                    background: 'var(--accent, #F06020)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12.5,
                  }}
                >
                  {t('Mở canvas', 'Open canvas')} <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Chỉ số nhanh */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 12,
                marginTop: 24,
              }}
            >
              {[
                { icon: <LayoutGrid size={15} />, label: t('Số flow', 'Flows'), value: String(data.flows.length) },
                { icon: <Users size={15} />, label: t('Thành viên', 'Members'), value: String(data.memberCount) },
                { icon: <Layers size={15} />, label: t('Chặng', 'Stage'), value: stageLabel },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    background: 'var(--field)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t4)', fontSize: 11 }}>
                    {s.icon}
                    <span style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, marginTop: 8 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Danh sách flow (đã lọc theo [id]) */}
            <h2 style={{ fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--t3)', marginTop: 32, marginBottom: 12 }}>
              {t('Bản vẽ · Flows trong dự án', 'Flows in this project')}
            </h2>
            {data.flows.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--t4)' }}>{t('Chưa có flow nào.', 'No flows yet.')}</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.flows.map((f) => (
                  <li
                    key={f.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      background: 'var(--field)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{f.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 2 }}>
                        {f.status || t('Chưa có ghi chú', 'No note')}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--t4)' }}>v{f.version}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
