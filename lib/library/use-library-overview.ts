'use client';

/**
 * lib/library/use-library-overview.ts — DÂY DỮ LIỆU cho trang tổng Thư viện + Kho tri thức.
 *
 * [Đ2] KHÔNG route mới, KHÔNG cột DB mới — chỉ nối các nguồn ĐÃ CÓ:
 *   · `GET /api/library`            → kệ (qua `useLibraryDbItems`, cùng hook tấm Thư viện dùng)
 *   · `idfc-store` (IndexedDB)      → cấu kiện `.idfc` tầng studio
 *   · `GET /api/flows`              → danh sách dự án → `GET /api/projects/[id]/dna` (Thẻ DNA)
 *   · `getAllRules()`               → quy chuẩn ngành (built-in + tuỳ biến localStorage)
 *   · `GET /api/notebook/[id]/sources` → tài liệu dự án đang mở (RAG)
 * Mọi lỗi mạng/401/403 ⇒ nguồn đó coi như rỗng, trang vẫn đứng; KHÔNG bịa số cho đầy mắt.
 *
 * Thẻ DNA: fan-out theo dự án có TRẦN (`MAX_DNA_PROJECTS`) — trang tổng cần CON SỐ, không cần
 * ruột thẻ; studio nhiều dự án hơn trần thì dòng "N dự án đã soi" nói thật số đã soi.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLibraryDbItems } from './db-items';
import { hydrateIdfcStore, loadIdfcStore } from './idfc-store';
import { buildLibraryOverview, type OverviewSection } from './overview';
import {
  knowledgeFromNotebookSources,
  knowledgeFromRules,
  knowledgeStats,
  type KnowledgeEntry,
  type KnowledgeStats,
  type NotebookSourceLite,
} from './knowledge';
import { getAllRules } from '../cad/standards/registry';
import type { IdfcKind } from '../cad/idfc';

const MAX_DNA_PROJECTS = 12;

export interface DnaSummary {
  soThe: number;
  /** Số dự án đã tra được Thẻ DNA (không tính dự án trả lỗi/không có quyền). */
  soDuAn: number;
  duAn: { id: string; name: string; soThe: number }[];
}

/** Đếm Thẻ DNA trên các dự án của người dùng. `null` = chưa tải xong. */
export function useDnaSummary(): DnaSummary | null {
  const [dna, setDna] = useState<DnaSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/flows');
        const j = res.ok ? await res.json() : null;
        const projects: { id: string; name: string }[] = Array.isArray(j?.projects)
          ? j.projects
              .filter((p: unknown): p is { id: string; name: string } => !!p && typeof (p as { id?: unknown }).id === 'string')
              .slice(0, MAX_DNA_PROJECTS)
          : [];
        const rows = await Promise.all(
          projects.map(async (p) => {
            try {
              const r = await fetch(`/api/projects/${p.id}/dna`);
              if (!r.ok) return null;
              const d = await r.json();
              return { id: p.id, name: p.name, soThe: Array.isArray(d?.cards) ? d.cards.length : 0 };
            } catch {
              return null;
            }
          }),
        );
        const duAn = rows.filter((r): r is NonNullable<typeof r> => r !== null);
        if (!cancelled) setDna({ soThe: duAn.reduce((a, r) => a + r.soThe, 0), soDuAn: duAn.length, duAn });
      } catch {
        if (!cancelled) setDna({ soThe: 0, soDuAn: 0, duAn: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return dna;
}

/** Mục tri thức = quy chuẩn (luôn) + tài liệu Sổ tay của dự án đang mở (nếu có). */
export function useKnowledgeEntries(projectId: string | null): { entries: KnowledgeEntry[]; stats: KnowledgeStats; loaded: boolean } {
  const [rules, setRules] = useState<KnowledgeEntry[] | null>(null);
  const [docs, setDocs] = useState<KnowledgeEntry[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);

  // `getAllRules()` đọc rule tuỳ biến từ localStorage ⇒ chỉ gọi sau mount (SSR-safe).
  useEffect(() => {
    setRules(knowledgeFromRules(getAllRules()));
  }, []);

  useEffect(() => {
    if (!projectId) {
      setDocs([]);
      setDocsLoaded(true);
      return;
    }
    let cancelled = false;
    setDocsLoaded(false);
    fetch(`/api/notebook/${projectId}/sources`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        const sources: NotebookSourceLite[] = Array.isArray(j?.sources) ? j.sources : [];
        setDocs(knowledgeFromNotebookSources(projectId, sources));
      })
      .catch(() => {
        if (!cancelled) setDocs([]);
      })
      .finally(() => {
        if (!cancelled) setDocsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const entries = useMemo(() => [...(rules ?? []), ...docs], [rules, docs]);
  const stats = useMemo(() => knowledgeStats(entries), [entries]);
  return { entries, stats, loaded: rules !== null && docsLoaded };
}

export function useLibraryOverview(projectId: string | null): {
  sections: OverviewSection[];
  dna: DnaSummary | null;
  knowledge: { entries: KnowledgeEntry[]; stats: KnowledgeStats; loaded: boolean };
  refresh: () => void;
} {
  const { dbItems, dbLoaded, refreshDb } = useLibraryDbItems(true);
  const dna = useDnaSummary();
  const knowledge = useKnowledgeEntries(projectId);

  const [idfcKinds, setIdfcKinds] = useState<IdfcKind[]>([]);
  const [idfcTick, setIdfcTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    hydrateIdfcStore()
      .catch(() => {
        /* IDB chặn — cache rỗng, trang vẫn đứng */
      })
      .finally(() => {
        if (!cancelled) setIdfcKinds(loadIdfcStore().map((s) => s.meta.kind));
      });
    return () => {
      cancelled = true;
    };
  }, [idfcTick]);

  // Tấm Thư viện phát sự kiện này sau khi nhập/promote (xem LibrarySheet) — trang tổng nghe cùng
  // một tín hiệu, không đẻ kênh riêng.
  useEffect(() => {
    const onRefresh = () => {
      refreshDb();
      setIdfcTick((t) => t + 1);
    };
    window.addEventListener('if:library-db-refresh', onRefresh);
    return () => window.removeEventListener('if:library-db-refresh', onRefresh);
  }, [refreshDb]);

  const refresh = useCallback(() => {
    refreshDb();
    setIdfcTick((t) => t + 1);
  }, [refreshDb]);

  const sections = useMemo(
    () =>
      buildLibraryOverview({
        daTaiKho: dbLoaded,
        items: dbItems,
        idfcKinds,
        dna: dna ? { soThe: dna.soThe, soDuAn: dna.soDuAn } : null,
        knowledge: knowledge.loaded ? knowledge.stats : null,
      }),
    [dbLoaded, dbItems, idfcKinds, dna, knowledge.loaded, knowledge.stats],
  );

  return { sections, dna, knowledge, refresh };
}
