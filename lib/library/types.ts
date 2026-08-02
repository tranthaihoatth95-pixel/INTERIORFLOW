// lib/library/types.ts — Kệ Thư viện (Master Library), kiểu dữ liệu mock cục bộ.
// Nguồn: docs/SPEC-STAGE-LIBRARIES.md + docs/mocks/library-mock-note.md.

export type ScopeLevel = 'chung' | 'studio' | 'chang' | 'du_an';

export type StageKey = 'cad' | 'render' | 'present';

/** Kệ hiển thị trong 1 tab — 'chung' = kệ xuyên chặng (vật liệu…), hiện ở mọi tab, không lặp. */
export type ShelfStage = StageKey | 'chung';

export type LibraryMechanic = 'keo' | 'ap';

export interface LibraryItem {
  id: string;
  shelfId: string;
  name: string;
  scope: ScopeLevel;
  /** Loại hiển thị ở inspector, vd "Form lập luận", "Vật liệu (matId)". */
  kind: string;
  author: string;
  version: string;
  usageCount: number;
  description: string;
  /** 2 màu gradient thumbnail — theo bảng "màu loại" SPEC-DESIGN-SYSTEM-IF §1. */
  thumbnail: [string, string];
  mechanic: LibraryMechanic;
  matId?: string;
}

export interface LibraryShelf {
  id: string;
  stage: ShelfStage;
  icon: string;
  title: string;
  items: LibraryItem[];
}

export interface CommentEntry {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface PublishDraft {
  id: string;
  name: string;
  stage: StageKey;
  scope: ScopeLevel;
  kind: string;
  description: string;
  createdAt: number;
  status: 'cho_duyet';
}

export const SCOPE_META: Record<ScopeLevel, { label: string; bg: string; fg: string; hint: string }> = {
  chung: {
    label: 'Chung',
    bg: '#e9f6ef',
    fg: '#1f9d6b',
    hint: 'Dùng ở mọi dự án, mọi studio.',
  },
  studio: {
    label: 'Studio',
    bg: '#efeafe',
    fg: '#6a57f5',
    hint: 'Dùng lại trong mọi dự án của studio này.',
  },
  chang: {
    label: 'Chặng',
    bg: '#eaf1fb',
    fg: '#3a6fc4',
    hint: 'Chỉ hiện khi đang ở chặng này.',
  },
  du_an: {
    label: 'Dự án',
    bg: '#fdf0e8',
    fg: '#c96a35',
    hint: 'Chỉ dùng trong dự án hiện tại.',
  },
};

export const STAGE_META: Record<StageKey, { label: string }> = {
  cad: { label: 'CAD' },
  render: { label: 'Render' },
  present: { label: 'Present' },
};
