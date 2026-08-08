'use client';

// lib/filemanager/local-state.ts — bình luận + file tải lên trong phiên, cục bộ (localStorage),
// KHÔNG đụng Prisma/DB. Cùng khuôn với lib/library/local-state.ts (G4).

import { useEffect, useState } from 'react';
import type { CommentEntry } from '@/lib/library/types';
import type { FmFile, FmFileKind } from './types';

const STORAGE_KEY = 'interiorflow.filemanager_g4.local_state_v1';

interface LocalState {
  comments: Record<string, CommentEntry[]>;
  /** file tải lên trong phiên trình duyệt này — session-only, không phải upload thật lên đĩa. */
  uploaded: FmFile[];
}

const EMPTY: LocalState = { comments: {}, uploaded: [] };

function readStorage(): LocalState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<LocalState>) };
  } catch {
    return EMPTY;
  }
}

function writeStorage(next: LocalState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota/private-mode — mock không cần bền tuyệt đối
  }
}

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i + 1).toLowerCase();
}

const KIND_BY_EXT: Record<string, FmFileKind> = {
  idf: 'idf', ifpack: 'archive',
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
  dwg: 'cad', dxf: 'cad',
  pdf: 'pdf',
  pptx: 'doc', docx: 'doc', ifpres: 'doc',
  xlsx: 'sheet', csv: 'sheet',
  mp4: 'video', mov: 'video',
  mat: 'material',
  zip: 'archive',
};

/** Suy loại file từ đuôi tên — chỉ để chọn icon/badge hiển thị, KHÔNG phải Gateway thật
 * (`lib/gateway/detect.ts` soi magic byte cho import thật — khác mục đích, xem BAO-CAO-FM.md). */
export function kindFromName(name: string): FmFileKind {
  return KIND_BY_EXT[extOf(name)] ?? 'other';
}

export function useFileManagerLocalState() {
  const [state, setState] = useState<LocalState>(EMPTY);

  useEffect(() => {
    setState(readStorage());
  }, []);

  const mutate = (fn: (prev: LocalState) => LocalState) => {
    setState((prev) => {
      const next = fn(prev);
      writeStorage(next);
      return next;
    });
  };

  const addComment = (fileId: string, text: string) => {
    const entry: CommentEntry = { id: `c-${Math.random().toString(36).slice(2, 8)}`, author: 'Bạn', text, createdAt: Date.now() };
    mutate((prev) => ({ ...prev, comments: { ...prev.comments, [fileId]: [...(prev.comments[fileId] ?? []), entry] } }));
  };

  const addUploadedFile = (folderId: string, file: { name: string; size: number }) => {
    const entry: FmFile = {
      id: `up-${Math.random().toString(36).slice(2, 8)}`,
      folderId,
      name: file.name,
      ext: extOf(file.name),
      kind: kindFromName(file.name),
      sizeBytes: file.size,
      addedById: 'you',
      addedByName: 'Bạn',
      source: 'local',
      lifecycle: 'nhap',
      description: 'Vừa tải lên trong phiên này (chưa ghi ổ đĩa — bản mock).',
    };
    mutate((prev) => ({ ...prev, uploaded: [...prev.uploaded, entry] }));
    return entry;
  };

  /** Bỏ 1 bản ghi tải-lên-trong-phiên (id `up-…`, xem `addUploadedFile`) — dùng cho nút Xoá ở
   *  menu chuột phải khi file đó chưa từng ghi thật xuống đĩa (`real-fs.ts` không biết gì về nó,
   *  nên không có hàm đĩa nào để gọi — xoá đúng nơi nó được tạo ra). */
  const removeUploadedFile = (fileId: string) => {
    mutate((prev) => ({ ...prev, uploaded: prev.uploaded.filter((f) => f.id !== fileId) }));
  };

  return { state, addComment, addUploadedFile, removeUploadedFile };
}
