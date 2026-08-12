'use client';

/**
 * components/home/ProjectOverviewCard.tsx — [marker: ProjectOverviewCard] khối TỔNG QUAN
 * trên card dự án ở Home/Gallery (phiếu docs/phieu-giao/home-overview-card.md, chốt 12/08
 * "Home đổi ngữ nghĩa thành TỔNG QUAN DỰ ÁN").
 *
 * Nhìn 2 giây biết: dự án gì (quy mô ProjectProfile) · bắt đầu từ bao giờ (Project.createdAt)
 * · đang dở đâu (lastStage) · ai đang làm (PresenceRow online màu / offline trắng-đen).
 *
 * Nguồn dữ liệu — TOÀN BỘ best-effort, thiếu dòng nào ẨN dòng đó (không bịa, luật X2):
 *   - GET /api/projects/[id]/profile  → loaiHinh · dienTichM2 (ProjectProfile, null = chưa khai)
 *   - GET /api/projects/[id]/overview → project.createdAt ("bắt đầu từ")
 *   - GET /api/projects/[id]/members  → danh sách thành viên dự án; online đối chiếu roster
 *     /api/flows (prop `onlineOf`) — cùng nguồn presence PresenceBar/card cũ đang dùng.
 *   - Không có Project thật (flow tự do) → chỉ còn PresenceRow fallback (owner) + chặng đang dở.
 *
 * Cache module-level theo projectId — Gallery render nhiều card cùng dự án/lướt qua lại
 * không bắn lại 3 request.
 */

import { useEffect, useState } from 'react';
import PresenceRow, { type PresenceMember } from '@/components/ui/PresenceRow';
import { PHASE_MAP } from '@/lib/phases';
import { getLastStage } from '@/lib/shell/last-stage';

export interface ProjectOverviewData {
  loaiHinh: string | null;
  dienTichM2: number | null;
  /** Project.createdAt ISO — null khi không đọc được */
  startedAt: string | null;
  /** thành viên dự án (ProjectMember) — null khi không đọc được / flow tự do */
  members: { id: string; name: string }[] | null;
}

const cache = new Map<string, Promise<ProjectOverviewData>>();

async function jsonOrNull(url: string): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function loadOverview(projectId: string): Promise<ProjectOverviewData> {
  const hit = cache.get(projectId);
  if (hit) return hit;
  const id = encodeURIComponent(projectId);
  const p = Promise.all([
    jsonOrNull(`/api/projects/${id}/profile`),
    jsonOrNull(`/api/projects/${id}/overview`),
    jsonOrNull(`/api/projects/${id}/members`),
  ]).then(([profileJ, overviewJ, membersJ]): ProjectOverviewData => {
    const profile = (profileJ?.profile ?? null) as { loaiHinh?: unknown; dienTichM2?: unknown } | null;
    const project = (overviewJ?.project ?? null) as { createdAt?: unknown } | null;
    const rawMembers = Array.isArray(membersJ?.members) ? (membersJ!.members as unknown[]) : null;
    return {
      loaiHinh: typeof profile?.loaiHinh === 'string' && profile.loaiHinh ? profile.loaiHinh : null,
      dienTichM2:
        typeof profile?.dienTichM2 === 'number' && Number.isFinite(profile.dienTichM2) && profile.dienTichM2 > 0
          ? profile.dienTichM2
          : null,
      startedAt: typeof project?.createdAt === 'string' && project.createdAt ? project.createdAt : null,
      members: rawMembers
        ? rawMembers
            .map((m) => m as { userId?: unknown; name?: unknown })
            .filter((m): m is { userId: string; name: string } => typeof m.userId === 'string' && typeof m.name === 'string')
            .map((m) => ({ id: m.userId, name: m.name }))
        : null,
    };
  });
  cache.set(projectId, p);
  return p;
}

/** "12/08/2026" (vi) / "12 Aug 2026" (en) — sai ISO thì trả null để ẩn dòng. */
function fmtDate(iso: string, en: boolean): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toLocaleDateString(en ? 'en-GB' : 'vi-VN', { day: '2-digit', month: en ? 'short' : '2-digit', year: 'numeric' });
  } catch {
    return null;
  }
}

export interface ProjectOverviewCardProps {
  /** Project.id thật — null = flow tự do (không fetch, chỉ còn fallback) */
  projectId: string | null;
  /** Flow.id — khoá phụ tra lastStage (cùng quy ước id ổn định của card) */
  flowId: string;
  en: boolean;
  /** owner từ roster sẵn có của card — dùng khi chưa đọc được members dự án */
  fallbackMembers: PresenceMember[];
  /** online theo roster GET /api/flows (team) — id lạ coi như offline */
  onlineOf: (userId: string) => boolean;
  /** style dòng chữ phụ theo nền card (caption thích ứng / thân card tối) */
  textMutedStyle?: React.CSSProperties;
}

export default function ProjectOverviewCard({
  projectId,
  flowId,
  en,
  fallbackMembers,
  onlineOf,
  textMutedStyle,
}: ProjectOverviewCardProps) {
  const [data, setData] = useState<ProjectOverviewData | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    loadOverview(projectId).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Quy mô: "Căn hộ · 86 m²" — thiếu nửa nào bỏ nửa đó, thiếu cả hai ẩn dòng.
  const scaleBits: string[] = [];
  if (data?.loaiHinh) scaleBits.push(data.loaiHinh);
  if (data?.dienTichM2 != null) scaleBits.push(`${data.dienTichM2} m²`);
  const scaleLine = scaleBits.length ? scaleBits.join(' · ') : null;

  const started = data?.startedAt ? fmtDate(data.startedAt, en) : null;

  // Chặng đang dở — chỉ hiện khi ĐÃ từng ghi (không bịa mặc định lên mặt card).
  const lastStage = getLastStage(projectId) ?? getLastStage(flowId);
  const stageMeta = lastStage ? PHASE_MAP[lastStage] : null;

  // PresenceRow: ưu tiên thành viên dự án thật; chưa có → owner fallback của card.
  const members: PresenceMember[] =
    data?.members && data.members.length > 0
      ? data.members.map((m) => ({ id: m.id, name: m.name, online: onlineOf(m.id) }))
      : fallbackMembers;

  const rowStyle: React.CSSProperties = {
    fontSize: 'var(--fs-xs)',
    lineHeight: 1.5,
    ...(textMutedStyle ?? { color: 'var(--t4)' }),
  };

  return (
    <div data-overview-card>
      {scaleLine && (
        <div className="truncate" style={rowStyle}>
          {scaleLine}
        </div>
      )}
      {started && (
        <div className="truncate" style={rowStyle}>
          {en ? `Started ${started}` : `Bắt đầu từ ${started}`}
        </div>
      )}
      {stageMeta && (
        <div className="truncate" style={rowStyle}>
          {en ? `In progress · ${stageMeta.labelEn}` : `Đang dở · ${stageMeta.label}`}
        </div>
      )}
      {members.length > 0 && (
        <div className="mt-1.5">
          <PresenceRow members={members} />
        </div>
      )}
    </div>
  );
}
