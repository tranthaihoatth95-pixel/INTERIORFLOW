'use client';

/**
 * useNotebook — hook state + API caller cho Project Notebook.
 *
 * Phase 1: gọi API contract đã brief với Agent P1a. Nếu API 404/500 (P1a chưa
 * merge kịp), tự fallback sang in-memory + localStorage để UI vẫn verify được
 * layout, upload zone, chat placeholder. Khi API sẵn, hook đổi sang gọi thật
 * không cần sửa component.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, Citation, NotebookSource, SourceKind } from './types';

const LS_KEY = (projectId: string) => `interiorflow.notebook.${projectId}.mock.v1`;

interface MockStore {
  sources: NotebookSource[];
  messages: ChatMessage[];
}

function loadMock(projectId: string): MockStore {
  if (typeof window === 'undefined') return { sources: [], messages: [] };
  try {
    const raw = localStorage.getItem(LS_KEY(projectId));
    if (!raw) return { sources: [], messages: [] };
    return JSON.parse(raw);
  } catch {
    return { sources: [], messages: [] };
  }
}

function saveMock(projectId: string, s: MockStore) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY(projectId), JSON.stringify(s));
  } catch {
    /* quota */
  }
}

function inferKind(name: string, url?: string): SourceKind {
  if (url) return 'url';
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(png|jpe?g|webp|gif|heic|heif)$/.test(lower)) return 'image';
  return 'text';
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function useNotebook(projectId: string) {
  const [sources, setSources] = useState<NotebookSource[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [querying, setQuerying] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const mockRef = useRef<MockStore>({ sources: [], messages: [] });

  // Init: probe API, else load mock.
  useEffect(() => {
    let cancelled = false;
    async function probe() {
      try {
        const res = await fetch(`/api/notebook/${projectId}/sources`, { method: 'GET' });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setApiAvailable(true);
          setSources(Array.isArray(data?.sources) ? data.sources : []);
          return;
        }
        throw new Error(String(res.status));
      } catch {
        if (cancelled) return;
        setApiAvailable(false);
        const m = loadMock(projectId);
        mockRef.current = m;
        setSources(m.sources);
        setMessages(m.messages);
      }
    }
    probe();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const persistMock = useCallback(
    (next: Partial<MockStore>) => {
      const merged = { ...mockRef.current, ...next };
      mockRef.current = merged;
      saveMock(projectId, merged);
    },
    [projectId],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const kind = inferKind(file.name);
      if (apiAvailable) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('kind', kind);
        fd.append('title', file.name);
        const optimistic: NotebookSource = {
          id: newId('src'),
          kind,
          title: file.name,
          size: file.size,
          status: 'processing',
          createdAt: new Date().toISOString(),
        };
        setSources((prev) => [optimistic, ...prev]);
        try {
          const res = await fetch(`/api/notebook/${projectId}/source`, { method: 'POST', body: fd });
          const data = await res.json();
          setSources((prev) =>
            prev.map((s) => (s.id === optimistic.id ? { ...optimistic, id: data.sourceId ?? optimistic.id, status: data.status ?? 'processing' } : s)),
          );
        } catch (e) {
          setSources((prev) => prev.map((s) => (s.id === optimistic.id ? { ...s, status: 'error', error: String(e) } : s)));
        }
        return;
      }
      // Mock: đọc thành text nếu là .txt/.md, còn lại chỉ ghi metadata
      const src: NotebookSource = {
        id: newId('src'),
        kind,
        title: file.name,
        size: file.size,
        status: 'ready',
        createdAt: new Date().toISOString(),
      };
      const next = [src, ...mockRef.current.sources];
      setSources(next);
      persistMock({ sources: next });
    },
    [apiAvailable, projectId, persistMock],
  );

  const addTextOrUrl = useCallback(
    async (payload: { kind: 'text' | 'url'; title: string; content?: string; url?: string }) => {
      if (apiAvailable) {
        try {
          const res = await fetch(`/api/notebook/${projectId}/source`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          setSources((prev) => [
            {
              id: data.sourceId ?? newId('src'),
              kind: payload.kind,
              title: payload.title,
              status: data.status ?? 'processing',
              createdAt: new Date().toISOString(),
              url: payload.url,
            },
            ...prev,
          ]);
          return;
        } catch (e) {
          // fallthrough to mock
        }
      }
      const src: NotebookSource = {
        id: newId('src'),
        kind: payload.kind,
        title: payload.title,
        status: 'ready',
        createdAt: new Date().toISOString(),
        url: payload.url,
      };
      const next = [src, ...mockRef.current.sources];
      setSources(next);
      persistMock({ sources: next });
    },
    [apiAvailable, projectId, persistMock],
  );

  const removeSource = useCallback(
    async (id: string) => {
      setSources((prev) => prev.filter((s) => s.id !== id));
      if (selectedSourceId === id) setSelectedSourceId(null);
      if (apiAvailable) {
        try {
          await fetch(`/api/notebook/${projectId}/source/${id}`, { method: 'DELETE' });
        } catch {
          /* noop */
        }
      } else {
        const next = mockRef.current.sources.filter((s) => s.id !== id);
        persistMock({ sources: next });
      }
    },
    [apiAvailable, projectId, selectedSourceId, persistMock],
  );

  const ask = useCallback(
    async (question: string, stage?: string) => {
      const uMsg: ChatMessage = {
        id: newId('msg'),
        role: 'user',
        content: question,
        createdAt: new Date().toISOString(),
      };
      const pending: ChatMessage = {
        id: newId('msg'),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, uMsg, pending]);
      setQuerying(true);
      try {
        if (apiAvailable) {
          const res = await fetch(`/api/notebook/${projectId}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, stage }),
          });
          const data = await res.json();
          const cits: Citation[] = Array.isArray(data?.sources) ? data.sources : [];
          setMessages((prev) =>
            prev.map((m) => (m.id === pending.id ? { ...m, content: data?.answer ?? '', citations: cits, pending: false } : m)),
          );
        } else {
          // Mock: câu trả lời placeholder + chỉ vào source đầu tiên nếu có
          await new Promise((r) => setTimeout(r, 700));
          const first = mockRef.current.sources[0];
          const cits: Citation[] = first
            ? [{ sourceId: first.id, sourceTitle: first.title, snippet: 'Trích đoạn mẫu (mock — chưa nối RAG).', score: 0.42 }]
            : [];
          const answer = `Đây là câu trả lời mẫu cho: "${question}". Khi API RAG sẵn sàng (Agent P1a), câu trả lời thật sẽ trích dẫn nguồn dạng [1] [2].`;
          setMessages((prev) => {
            const next = prev.map((m) => (m.id === pending.id ? { ...m, content: answer, citations: cits, pending: false } : m));
            persistMock({ messages: next });
            return next;
          });
        }
      } catch (e) {
        setMessages((prev) =>
          prev.map((m) => (m.id === pending.id ? { ...m, content: `Lỗi: ${String(e)}`, pending: false } : m)),
        );
      } finally {
        setQuerying(false);
      }
    },
    [apiAvailable, projectId, persistMock],
  );

  return {
    apiAvailable,
    sources,
    messages,
    selectedSourceId,
    setSelectedSourceId,
    querying,
    uploadFile,
    addTextOrUrl,
    removeSource,
    ask,
  };
}
