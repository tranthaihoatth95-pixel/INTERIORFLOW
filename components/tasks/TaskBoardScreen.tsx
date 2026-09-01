'use client';

/**
 * components/tasks/TaskBoardScreen.tsx — màn "Bảng việc" (client ĐẦU TIÊN tiêu thụ
 * `app/api/tasks/*`, phiếu `docs/DOI-CHIEU-42-SPEC-2026-08-08.md` §1#4).
 *
 * NGUỒN SỰ THẬT giao diện: mock `docs/mocks/Bảng việc.dc.html` — port bố cục/spacing:
 * thanh lọc 56px (lọc dự án · tìm · badge trễ hạn · nút Thêm việc) → lưới cột trạng thái
 * (cột panel bo 14, header 40px chấm màu + tên + đếm + nút ＋) → thẻ bo 12 (hạn góc phải,
 * tiêu đề 12.5/600, chân thẻ avatar chữ tắt) → footer 26px. Nền bảng chấm `--dots` như mock.
 *
 * Lệch mock CÓ LÝ DO (ghi cả trong báo cáo phiên):
 *  - Chip loại việc (Hồ sơ/Thiết kế…) + màu --l-1..5: DTO TaskRow KHÔNG có trường loại,
 *    globals.css không có bộ token --l-*. Không bịa dữ liệu — bỏ chip, chờ schema có cột.
 *  - Avatar nhiều màu theo người: chưa có bảng màu người dùng — mọi avatar dùng --accent.
 *  - Tab Bảng/Tiến độ/Lịch: chỉ "Bảng" có thật bản 1 — không vẽ nút giả (luật §9).
 *  - Đổi trạng thái: NÚT ‹ › trên thẻ là đường CHÍNH (G8 — kéo-thả không được là đường
 *    duy nhất); kéo-thả HTML5 làm thêm vì rẻ.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, CalendarClock, ClipboardList, Loader2, PencilRuler, Plus, Presentation, Search } from 'lucide-react';
import { useT, useLang } from '@/lib/i18n';
import { phanLoaiHong, nhan, HONG_KHONG_DOC_DUOC, type LyDoHong } from '@/lib/ui/trang-thai-tai';
import { useTrangThaiMang } from '@/lib/home/trang-thai';
import type { TaskRow, TaskStage, WorkflowStateRow } from '@/lib/server/tasks';
import { buildTaskDeepLink, STAGE_LABELS } from '@/lib/tasks/context';
import {
  adjacentStatusId,
  countOverdue,
  dueInfo,
  filterTasks,
  groupTasksByState,
  initialsOf,
  stateDotVar,
} from '@/lib/tasks/board';
import { EmptyState } from '@/components/ui/EmptyState';
import { RawStyle } from '@/components/filemanager/RawStyle';
import { GanttChart } from '@/components/tasks/GanttChart';

interface ProjectOpt { id: string; name: string }

const PROJECT_KEY = 'if.tasks.projectId';

/**
 * 11/08 Hoà chốt (kèm ảnh khoanh đỏ vùng trống dưới empty state): bảng trống chia HAI luồng —
 * người muốn MẪU SẴN chọn thẻ template theo nghiệp vụ, người muốn TỰ TẠO đi đường "Thêm việc
 * đầu tiên" (một mình) hoặc Vitals (AI — chưa nối, để disabled kèm lý do theo luật §9).
 * Template = gieo danh sách việc THẬT qua POST /api/tasks có sẵn (vào cột đầu "Chưa làm"),
 * không đẻ API mới, không nút giả.
 */
export const BOARD_TEMPLATES: { key: string; vi: string; en: string; descVi: string; descEn: string; tasks: [string, string][] }[] = [
  {
    key: 'concept', vi: 'Concept dự án', en: 'Project concept',
    descVi: 'Từ đề bài đến duyệt concept', descEn: 'From brief to concept sign-off',
    tasks: [
      ['Nhận đề bài & ngân sách', 'Take brief & budget'],
      ['Đo đạc hiện trạng', 'Site survey'],
      ['Moodboard định hướng', 'Direction moodboard'],
      ['Layout 2 phương án', 'Two layout options'],
      ['Duyệt concept với khách', 'Client concept review'],
    ],
  },
  {
    key: 'technical', vi: 'Hồ sơ kỹ thuật', en: 'Technical package',
    descVi: 'Bộ bản vẽ thi công đủ mã', descEn: 'Full construction drawing set',
    tasks: [
      ['Mặt bằng bố trí nội thất', 'Furniture layout plan'],
      ['Mặt bằng trần & đèn', 'Ceiling & lighting plan'],
      ['Mặt bằng sàn & hoàn thiện', 'Floor & finish plan'],
      ['Chi tiết tủ bếp / đồ mộc', 'Millwork details'],
      ['Khung tên · kiểm chuẩn · in', 'Title block · checks · print'],
    ],
  },
  {
    key: 'render', vi: 'Sản xuất render', en: 'Render production',
    descVi: 'Dựng khối đến ảnh final', descEn: 'Massing to final images',
    tasks: [
      ['Dựng khối từ mặt bằng', 'Extrude massing from plan'],
      ['Áp vật liệu theo matId', 'Assign materials by matId'],
      ['Đặt đèn & camera', 'Lights & cameras'],
      ['Render nháp duyệt nội bộ', 'Draft renders for internal review'],
      ['Render final + hậu kỳ', 'Final renders + post'],
    ],
  },
  {
    key: 'present', vi: 'Trình khách', en: 'Client presentation',
    descVi: 'Gom sản phẩm thành hồ sơ', descEn: 'Package outputs into a deck',
    tasks: [
      ['Chọn ảnh & bản vẽ chốt', 'Pick final images & drawings'],
      ['Dàn deck trình bày', 'Lay out the deck'],
      ['BOQ sơ bộ kèm hồ sơ', 'Preliminary BOQ'],
      ['Duyệt nội bộ', 'Internal review'],
      ['Gửi khách & ghi phản hồi', 'Send to client & log feedback'],
    ],
  },
  {
    key: 'fitout', vi: 'Fit-out thi công', en: 'Fit-out delivery',
    descVi: 'Từ khối lượng đến nghiệm thu', descEn: 'From quantities to handover',
    tasks: [
      ['Bóc khối lượng theo bản vẽ', 'Quantity take-off from drawings'],
      ['Chọn nhà cung cấp / báo giá', 'Vendors & quotations'],
      ['Duyệt shop drawing', 'Approve shop drawings'],
      ['Giám sát mẫu tại xưởng', 'Factory sample inspection'],
      ['Nghiệm thu & bàn giao', 'Acceptance & handover'],
    ],
  },
];

/** Hover/kéo-thả cần pseudo-class — inline style không làm được, 1 khối CSS phạm vi `tb-`. */
const BOARD_CSS = `
.tb-card { position: relative; }
.tb-card .tb-tools { opacity: 0; transition: opacity .15s var(--ease-apple, ease); }
.tb-card:hover .tb-tools, .tb-card:focus-within .tb-tools { opacity: 1; }
.tb-card:hover { border-color: var(--border-strong) !important; }
.tb-tool { width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--border); border-radius: 6px; background: var(--field); color: var(--t3);
  cursor: pointer; font-size: 12px; line-height: 1; padding: 0; }
.tb-tool:hover:not(:disabled) { background: var(--hover); color: var(--t1); }
.tb-tool:disabled { opacity: .35; cursor: not-allowed; }
/* MÁY CHẠM KHÔNG CÓ HOVER (02/09) — chốt 5 của Hoà "hai bản desktop/chạm, cấm bản lai" +
   luật nền tablet-khong-giau-sau-hover. Thẻ là một div, chạm vào KHÔNG sinh focus, nên trên
   tablet cả cụm công cụ trước nay không có đường nào chạm tới. Lỗi cũ, nhưng từ 02/09 nó nặng
   hơn hẳn: nút đặt NGÀY nằm trong cụm này, mà ngày là thứ DUY NHẤT làm dải Tiến độ vẽ được. */
@media (hover: none) { .tb-card .tb-tools { opacity: 1; } }
.tb-col-drop { outline: 1.5px dashed var(--accent); outline-offset: -4px; background: var(--accent-soft) !important; }
.tb-addbtn:hover { background: var(--hover) !important; color: var(--t1) !important; }
/* Chip ngữ cảnh (TaskContext Link 11/08) — bấm là nhảy đúng chặng của dự án. */
.tb-ctx { display: inline-flex; align-items: center; gap: 4px; height: 18px; padding: 0 7px;
  border: 1px solid var(--border); border-radius: 10px; background: var(--field); color: var(--t3);
  font-size: 10px; font-weight: 600; line-height: 1; cursor: pointer; flex: none;
  transition: color .15s var(--ease-apple, ease), border-color .15s var(--ease-apple, ease); }
.tb-ctx:hover { color: var(--accent); border-color: var(--accent); }
/* Thẻ template — vật đơn lẻ nên ĐƯỢC scale nhẹ (SPEC-HOVER-FOCUS-IDF: thẻ 1.02 + lift 2px var(--nhip-bang)). */
.tb-tpl { transition: transform .2s var(--ease-apple, ease), border-color .2s, box-shadow .2s; }
.tb-tpl:hover:not(:disabled) { transform: translateY(-2px) scale(1.02); border-color: var(--border-strong); box-shadow: 0 6px 18px rgba(0,0,0,.12); }
.tb-tpl:disabled { opacity: .55; cursor: default; }
@media (prefers-reduced-motion: reduce) { .tb-tpl, .tb-tpl:hover:not(:disabled) { transition: none; transform: none; } }
`;

export function TaskBoardScreen() {
  const tr = useT();
  const en = useLang() === 'en';

  const [projects, setProjects] = useState<ProjectOpt[] | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [states, setStates] = useState<WorkflowStateRow[] | null>(null);
  const [tasks, setTasks] = useState<TaskRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** ⚙️ P0-2 — lý do lượt NẠP hỏng (khác `error` ở trên: đó là lỗi của THAO TÁC). */
  const [lyDoHong, setLyDoHong] = useState<{ lyDo: LyDoHong; ma?: number } | null>(null);
  const trucTuyen = useTrangThaiMang();
  /* `loadProjects` là `useCallback([])` — đọc `trucTuyen` qua ref để không phải nối lại callback
     mỗi lần mạng nhấp nháy (nối lại ⇒ `useEffect` chạy lại ⇒ gọi API lại, đúng lúc mạng yếu). */
  const trucTuyenRef = useRef(trucTuyen);
  trucTuyenRef.current = trucTuyen;
  const [query, setQuery] = useState('');
  /** cột đang mở ô nhập thẻ mới (statusId) — mở từ nút ＋ cột, nút "Thêm việc", hoặc EmptyState. */
  const [adding, setAdding] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  /** form tạo dự án tại chỗ khi chưa có dự án nào (EmptyState — làm được việc NGAY TẠI ĐÂY). */
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const addInputRef = useRef<HTMLInputElement | null>(null);

  /* ── nạp danh sách dự án (nguồn: GET /api/flows — cùng nguồn Gallery, không route mới) ── */
  const loadProjects = useCallback(async () => {
    /**
     * ⚙️ P0-2 (27/08) — lượt NẠP không được in mã kỹ thuật ra mặt người dùng.
     * Bản cũ ném `HTTP ${res.status}` rồi hiện thẳng chuỗi đó. Lane `IF-UXUI-RUNTIME-001` đo
     * được `HTTP 401` nằm cạnh câu "chưa có gì" — người dùng hết phiên bị bảo là bảng trống.
     * Từ vựng chung `lib/ui/trang-thai-tai.ts`, dùng chung với `/projects` và `/materials`.
     * ⚠️ Chỉ đổi đường NẠP. Lỗi của THAO TÁC (tạo/sửa/xoá) là chuyện khác — chúng đã ưu tiên
     * `j.error` của máy chủ và cần nói đúng thao tác nào hỏng, nên để nguyên.
     */
    let res: Response;
    try {
      res = await fetch('/api/flows');
    } catch {
      setLyDoHong(phanLoaiHong(null, trucTuyenRef.current));
      setProjects([]);
      return;
    }
    if (!res.ok) {
      setLyDoHong(phanLoaiHong(res, trucTuyenRef.current));
      setProjects([]);
      return;
    }
    try {
      const j = await res.json();
      const list: ProjectOpt[] = (j.projects ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }));
      setProjects(list);
      setProjectId((prev) => {
        if (prev && list.some((p) => p.id === prev)) return prev;
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem(PROJECT_KEY) : null;
        if (saved && list.some((p) => p.id === saved)) return saved;
        return list[0]?.id ?? '';
      });
    } catch {
      setLyDoHong(HONG_KHONG_DOC_DUOC);
      setProjects([]);
    }
  }, []);
  useEffect(() => { void loadProjects(); }, [loadProjects]);

  /* ── nạp bảng của dự án đang chọn: GET /api/tasks?projectId= (states + tasks 1 lượt) ── */
  const loadBoard = useCallback(async (pid: string) => {
    if (!pid) { setStates(null); setTasks(null); return; }
    setError(null);
    setStates(null);
    setTasks(null);
    try {
      const res = await fetch(`/api/tasks?projectId=${encodeURIComponent(pid)}`);
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setStates(j.states ?? []);
      setTasks(j.tasks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStates([]);
      setTasks([]);
    }
  }, []);
  useEffect(() => { void loadBoard(projectId); }, [projectId, loadBoard]);

  useEffect(() => {
    if (projectId && typeof window !== 'undefined') window.localStorage.setItem(PROJECT_KEY, projectId);
  }, [projectId]);

  useEffect(() => { if (adding) addInputRef.current?.focus(); }, [adding]);

  const now = useMemo(() => new Date(), [tasks]); // eslint-disable-line react-hooks/exhaustive-deps -- mốc "bây giờ" tươi lại mỗi lần dữ liệu đổi là đủ cho nhãn hạn
  const visibleTasks = useMemo(() => filterTasks(tasks ?? [], query), [tasks, query]);
  const { columns, orphans } = useMemo(
    () => groupTasksByState(states ?? [], visibleTasks),
    [states, visibleTasks],
  );
  const overdue = useMemo(() => countOverdue(states ?? [], tasks ?? [], now), [states, tasks, now]);

  /* ── hành động qua API thật ─────────────────────────────────────────────── */
  const apiError = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  /** Gieo template = POST tuần tự từng việc vào cột đầu (statusId bỏ trống → server tự chọn
   *  cột order thấp nhất). Tuần tự chứ không Promise.all để giữ đúng THỨ TỰ trong cột. */
  const applyTemplate = async (tpl: (typeof BOARD_TEMPLATES)[number]) => {
    if (!projectId || busy) return;
    setBusy(true);
    try {
      const created: TaskRow[] = [];
      for (const [vi, en] of tpl.tasks) {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, title: tr(vi, en) }),
        });
        const j = await res.json().catch(() => null);
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        created.push(j.task);
      }
      setTasks((prev) => [...(prev ?? []), ...created]);
    } catch (e) { apiError(e); } finally { setBusy(false); }
  };

  const addTask = async (statusId: string) => {
    const title = newTitle.trim();
    if (!title || !projectId) return;
    setBusy(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, title, statusId }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setTasks((prev) => [...(prev ?? []), j.task]);
      setNewTitle('');
      // giữ ô nhập mở — nhập liên tiếp nhiều việc là ca thường gặp
      addInputRef.current?.focus();
    } catch (e) { apiError(e); } finally { setBusy(false); }
  };

  const patchTask = async (t: TaskRow, patch: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/tasks/${encodeURIComponent(t.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, ...patch }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setTasks((prev) => (prev ? prev.map((x) => (x.id === t.id ? j.task : x)) : prev));
    } catch (e) { apiError(e); } finally { setBusy(false); }
  };

  const moveTask = (t: TaskRow, dir: -1 | 1) => {
    const next = adjacentStatusId(states ?? [], t.statusId, dir);
    if (next) void patchTask(t, { statusId: next });
  };
  const moveTaskTo = (taskId: string, statusId: string) => {
    const t = (tasks ?? []).find((x) => x.id === taskId);
    if (t && t.statusId !== statusId) void patchTask(t, { statusId });
  };

  const removeTask = async (t: TaskRow) => {
    if (!window.confirm(tr(`Xoá việc "${t.title}"? Không hoàn tác được.`, `Delete task "${t.title}"? This cannot be undone.`))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tasks/${encodeURIComponent(t.id)}?projectId=${encodeURIComponent(projectId)}`, { method: 'DELETE' });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setTasks((prev) => (prev ? prev.filter((x) => x.id !== t.id) : prev));
    } catch (e) { apiError(e); } finally { setBusy(false); }
  };

  const createProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'project', name }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setCreatingProject(false);
      setNewProjectName('');
      await loadProjects();
      if (j?.project?.id) setProjectId(j.project.id);
    } catch (e) { apiError(e); } finally { setBusy(false); }
  };

  const startEdit = (t: TaskRow) => { setEditingId(t.id); setEditTitle(t.title); };
  const commitEdit = (t: TaskRow) => {
    const title = editTitle.trim();
    setEditingId(null);
    if (title && title !== t.title) void patchTask(t, { title });
  };

  const firstStateId = columns[0]?.state.id ?? null;
  const loadingBoard = projectId !== '' && (states === null || tasks === null);
  const boardEmpty = (tasks?.length ?? 0) === 0 && !query;

  /* ── TAB BẢNG | TIẾN ĐỘ (01/09) ────────────────────────────────────────────────────────────
     Docstring đầu tệp ghi từ 08/08: *"Tab Bảng/Tiến độ/Lịch: chỉ 'Bảng' có thật bản 1 — không vẽ
     nút giả"*. Nay Tiến độ CÓ THẬT vì `lib/tasks/gantt.ts` đã có, kèm điều kiện làm nó dùng được:
     dải đó biết TỪ CHỐI vẽ việc thiếu ngày thay vì gán ngầm "hôm nay". "Lịch" vẫn chưa có gì đứng
     sau nên vẫn KHÔNG vẽ — cùng luật §9, không đổi. */
  const [che, setChe] = useState<'bang' | 'tien-do'>('bang');

  /* ── Ô NHẬP NGÀY (02/09) — nợ có tên do chính dải Gantt phơi ra ────────────────────────────
     Dựng xong tab Tiến độ mới lộ: `startAt`/`dueAt` CÓ trong `TaskRow`, CÓ trong `PATCH
     /api/tasks/:id`, mà TOÀN APP không có một ô nhập nào (`grep 'type="date"'` ⇒ 0 dòng). Tức
     dải chỉ vẽ được dữ liệu bơm bằng API — người dùng không có đường nào tự cho nó dữ liệu.
     Một màn hình phụ thuộc vào trường mà không ai điền nổi thì nó là màn chết.
     ⇒ Mở ĐÚNG một ô trên thẻ, thu gọn mặc định (gu Hoà: gọn mặc định, sâu khi cần), ghi qua
     ĐÚNG `patchTask` sẵn có — không đẻ API, không đẻ đường ghi thứ hai. */
  const [datNgayId, setDatNgayId] = useState<string | null>(null);
  /** ISO ↔ giá trị `<input type="date">`. Cắt theo UTC, CÙNG hệ với `gantt.chiaNgay()` — lấy
   *  giờ máy ở một đầu và UTC ở đầu kia là ca lệch 7 tiếng đã trả giá 30/08. */
  const ngayCuaO = (iso: string | null) => (iso ? iso.slice(0, 10) : '');
  const oThanhIso = (v: string) => (v ? `${v}T00:00:00.000Z` : null);

  /* ── chip ngữ cảnh (TaskContext Link 11/08) — chỉ hiện khi việc CÓ stage; bấm = deep-link ── */
  const STAGE_ICONS: Record<TaskStage, JSX.Element> = {
    concept: <PencilRuler size={14} />,
    render: <Box size={14} />,
    present: <Presentation size={14} />,
  };
  const contextChip = (t: TaskRow) => {
    if (!t.stage) return null;
    const href = buildTaskDeepLink(t);
    if (!href) return null;
    const label = tr(STAGE_LABELS[t.stage].vi, STAGE_LABELS[t.stage].en);
    return (
      <button
        type="button"
        className="tb-ctx"
        title={tr(`Mở ${label} của dự án này`, `Open ${label} for this project`)}
        onClick={(e) => { e.stopPropagation(); window.location.href = href; }}
        // draggable cha bắt pointer — chặn để bấm chip không kích hoạt kéo thẻ
        onMouseDown={(e) => e.stopPropagation()}
        draggable={false}
      >
        {STAGE_ICONS[t.stage]} {label}
      </button>
    );
  };

  /* ── nhãn hạn — mock: trễ đỏ "Trễ N ngày" · nay vàng "Hôm nay" · còn lại "d/m" ── */
  const dueBadge = (t: TaskRow) => {
    const d = dueInfo(t.dueAt, now);
    if (d.kind === 'none') return null;
    const color = d.kind === 'overdue' ? 'var(--danger)' : d.kind === 'today' ? 'var(--warning)' : 'var(--t4)';
    const text =
      d.kind === 'overdue' ? tr(`Trễ ${d.days} ngày`, `${d.days}d late`)
      : d.kind === 'today' ? tr('Hôm nay', 'Today')
      : `${d.day}/${d.month}`;
    return (
      <span style={{ marginLeft: 'auto', fontSize: 10, lineHeight: 1.5, fontVariantNumeric: 'tabular-nums', color, flex: 'none' }}>
        {text}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <RawStyle css={BOARD_CSS} />

      {/* ── thanh lọc (mock hàng 56px: lọc dự án · tìm · badge trễ · Thêm việc) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{tr('Bảng việc', 'Task board')}</span>
        <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>
          {tasks ? tr(`${tasks.length} việc`, `${tasks.length} task(s)`) : ''}
        </span>

        {(projects?.length ?? 0) > 0 && (
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            aria-label={tr('Lọc theo dự án', 'Filter by project')}
            style={{
              marginLeft: 16, height: 30, borderRadius: 10, padding: '0 8px', fontSize: 12.5, fontWeight: 600,
              border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)',
            }}
          >
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--field)', minWidth: 200 }}>
          <Search size={18} style={{ color: 'var(--t4)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr('Tìm việc', 'Search tasks')}
            style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', fontSize: 12.5, color: 'var(--t1)' }}
          />
        </div>

        {/* ── công tắc Bảng | Tiến độ. Một dải hai nút, không icon-hoá (G6).
            ⚠️ KHÔNG dùng `role="tab"`: WAI-ARIA đòi mỗi `tab` trỏ tới một `tabpanel` qua
            `aria-controls`, mà ở đây thứ đổi là CẢ THÂN MÀN (kể cả nhánh rỗng/hỏng), không phải
            một ô nội dung. Khai `tab` mà không có panel là nói dối bộ đọc màn hình — và đã đo
            được hậu quả thật: nút biến mất khỏi `getByRole('button')`, máy chụp nghiệm thu 21:26
            trượt đúng vì lý do đó. Đây là công tắc HAI TRẠNG THÁI ⇒ `aria-pressed`. */}
        <div role="group" aria-label={tr('Cách xem bảng việc', 'Task board view')} style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 10, background: 'var(--field)', border: '1px solid var(--border)' }}>
          {([['bang', 'Bảng', 'Board'], ['tien-do', 'Tiến độ', 'Timeline']] as const).map(([k, vi, en2]) => (
            <button
              key={k}
              type="button"
              aria-pressed={che === k}
              onClick={() => setChe(k)}
              style={{
                height: 24, padding: '0 10px', border: 0, borderRadius: 6, cursor: 'pointer',
                fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit',
                background: che === k ? 'var(--panel)' : 'transparent',
                color: che === k ? 'var(--t1)' : 'var(--t4)',
                boxShadow: che === k ? '0 1px 2px rgba(0,0,0,.10)' : 'none',
              }}
            >
              {tr(vi, en2)}
            </button>
          ))}
        </div>

        {overdue > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 24, padding: '0 10px', borderRadius: 6, background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)', fontSize: 11, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} />
            {tr(`${overdue} việc trễ hạn`, `${overdue} overdue`)}
          </span>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            disabled={!firstStateId}
            onClick={() => { if (firstStateId) { setAdding(firstStateId); setNewTitle(''); } }}
            style={{
              height: 30, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: firstStateId ? 'pointer' : 'not-allowed',
              border: 0, borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'var(--accent)', color: '#fff', opacity: firstStateId ? 1 : 0.5,
            }}
          >
            <Plus size={18} /> {tr('Thêm việc', 'Add task')}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ margin: '10px 14px 0', padding: '8px 12px', borderRadius: 10, background: 'color-mix(in srgb, var(--danger) 14%, var(--panel))', fontSize: 13, color: 'var(--t1)' }}>
          {error}
        </div>
      )}

      {/* ── thân màn ─────────────────────────────────────────────────────────── */}
      {lyDoHong ? (
        /* ⚙️ P0-2 — nhánh HỎNG phải đứng TRƯỚC nhánh RỖNG.
           Bản cũ: nạp hỏng ⇒ `setProjects([])` ⇒ rơi thẳng vào "chưa có dự án nào" — nói với
           một tài khoản có 15 dự án rằng họ chẳng có dự án nào. Đây đúng là ca lane
           `IF-UXUI-RUNTIME-001` đo được: "không có quyền" và "chưa có gì" hiện cùng một màn. */
        (() => {
          const n = nhan(lyDoHong.lyDo, { vi: 'bảng việc', en: 'task boards' }, en);
          return (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 0, padding: 24 }}>
              <EmptyState
                icon={<ClipboardList size={18} />}
                title={n.tieuDe}
                desc={n.moTa}
                actions={
                  n.hanhDong
                    ? [{
                        label: n.hanhDong,
                        primary: true,
                        onClick: lyDoHong.lyDo === 'khong-quyen'
                          ? () => { window.location.href = '/'; }
                          : () => { setLyDoHong(null); void loadProjects(); },
                      }]
                    : []
                }
              />
            </div>
          );
        })()
      ) : projects === null || loadingBoard ? (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--t4)' }}>
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (projects.length === 0) ? (
        /* RỖNG THẬT cấp 1: chưa có dự án nào — tạo được dự án NGAY TẠI ĐÂY (luật X2/EmptyState). */
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 0, overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <EmptyState
              ghost="rows"
              icon={<ClipboardList size={18} />}
              title={tr('Chưa có dự án nào để giao việc', 'No project to assign tasks yet')}
              desc={tr(
                'Mỗi bảng việc thuộc một dự án: cột trạng thái riêng, thẻ việc riêng. Tạo dự án đầu tiên rồi thêm việc ngay tại đây.',
                'Each task board belongs to a project: its own status columns, its own cards. Create the first project, then add tasks right here.',
              )}
              actions={creatingProject ? [] : [
                { label: tr('Tạo dự án đầu tiên', 'Create the first project'), primary: true, icon: <Plus size={18} />, onClick: () => setCreatingProject(true) },
              ]}
            />
            {creatingProject && (
              <form
                onSubmit={(e) => { e.preventDefault(); void createProject(); }}
                style={{ display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <input
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={tr('Tên dự án', 'Project name')}
                  style={{ height: 32, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 12.5, outline: 'none', minWidth: 220 }}
                />
                <button type="submit" disabled={busy || !newProjectName.trim()} style={{ height: 32, padding: '0 14px', border: 0, borderRadius: 10, background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: busy || !newProjectName.trim() ? 0.5 : 1 }}>
                  {tr('Tạo dự án', 'Create project')}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : boardEmpty && adding === null ? (
        /* RỖNG THẬT cấp 2 (≠ tìm không khớp): dự án chưa có việc — nút mở thẳng ô nhập cột đầu. */
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'grid', alignContent: 'center', justifyItems: 'center', gap: 26, padding: '24px 20px' }}>
          <EmptyState
            ghost="rows"
            icon={<ClipboardList size={18} />}
            title={tr('Dự án này chưa có việc nào', 'This project has no tasks yet')}
            desc={tr(
              'Mỗi thẻ là một đầu việc: tiêu đề, hạn, người phụ trách. Thẻ nằm theo cột trạng thái — đổi cột bằng nút trên thẻ hoặc kéo thả.',
              'Each card is one task: title, due date, assignee. Cards live in status columns — change status with the card buttons or by dragging.',
            )}
            actions={[
              { label: tr('Thêm việc đầu tiên', 'Add the first task'), primary: true, icon: <Plus size={18} />, onClick: () => { if (firstStateId) { setAdding(firstStateId); setNewTitle(''); } }, disabled: !firstStateId, disabledReason: tr('Dự án chưa có cột trạng thái', 'Project has no status columns') },
              { label: tr('✨ Soạn việc với Vitals', '✨ Draft tasks with Vitals'), onClick: () => {}, disabled: true, disabledReason: tr('Sắp có — Vitals sẽ soạn danh sách việc từ đề bài dự án', 'Coming soon — Vitals will draft a task list from the project brief') },
            ]}
          />
          {/* 11/08 — luồng "muốn mẫu sẵn": dải template theo nghiệp vụ, bấm là gieo việc thật. */}
          <div style={{ width: '100%', maxWidth: 880, display: 'grid', gap: 12, justifyItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 650, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--t4)' }}>
              {tr('Hoặc bắt đầu từ mẫu', 'Or start from a template')}
            </div>
            <div style={{ width: '100%', display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              {BOARD_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  className="tb-tpl"
                  disabled={busy || !projectId}
                  onClick={() => void applyTemplate(tpl)}
                  title={tr(`Tạo ${tpl.tasks.length} việc vào cột đầu — sửa/xoá tự do sau đó`, `Creates ${tpl.tasks.length} tasks in the first column — edit or delete freely after`)}
                  style={{
                    display: 'grid', gap: 8, padding: 12, textAlign: 'left', cursor: 'pointer',
                    borderRadius: 14, border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--t1)',
                  }}
                >
                  {/* preview mini: 3 cột board thu nhỏ — thuần token, không ảnh */}
                  <span aria-hidden style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, height: 34 }}>
                    {[3, 2, 1].map((rows, ci) => (
                      <span key={ci} style={{ display: 'grid', alignContent: 'start', gap: 3, padding: 3, borderRadius: 6, background: 'var(--field)' }}>
                        {Array.from({ length: rows }).map((_, ri) => (
                          <span key={ri} style={{ height: 5, borderRadius: 2, background: ci === 0 && ri === 0 ? 'var(--accent)' : 'var(--border-strong)', opacity: ci === 0 && ri === 0 ? 0.8 : 1 }} />
                        ))}
                      </span>
                    ))}
                  </span>
                  <span style={{ display: 'grid', gap: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 650, lineHeight: 1.5 }}>{tr(tpl.vi, tpl.en)}</span>
                    <span style={{ fontSize: 11, color: 'var(--t4)', lineHeight: 1.5 }}>{tr(tpl.descVi, tpl.descEn)} · {tpl.tasks.length} {tr('việc', 'tasks')}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : che === 'tien-do' ? (
        /* DẢI GANTT — cùng danh sách việc mà các cột đang hiện (`visibleTasks`, đã qua lọc/tìm),
           không truy vấn riêng, không lọc riêng. Một nguồn.
           `states` đi kèm là BẮT BUỘC, không phải trang trí: thiếu nó thì dải không biết cột nào
           là ĐÃ XONG, và mọi việc hoàn tất quá hạn sẽ bị tô đỏ như việc đang cháy — đúng lỗi
           02/09 (badge trên thanh lọc đếm theo `countOverdue` loại cột Xong, dải thì không). */
        <GanttChart tasks={visibleTasks} states={states ?? []} />
      ) : (
        <>
          {/* lưới cột — mock: gap 14, padding 16, nền chấm --dots 22px */}
          <div
            style={{
              flex: 1, minHeight: 0, display: 'grid', gap: 14, padding: 16,
              gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(220px, 1fr))`,
              overflow: 'auto',
              backgroundImage: 'radial-gradient(circle, var(--dots) 0 1px, transparent 1.4px)',
              backgroundSize: '22px 22px',
            }}
          >
            {columns.map((col, i) => (
              <div
                key={col.state.id}
                className={dragOverCol === col.state.id ? 'tb-col-drop' : undefined}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.state.id); }}
                onDragLeave={() => setDragOverCol((c) => (c === col.state.id ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCol(null);
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) moveTaskTo(id, col.state.id);
                }}
                style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: 14, background: 'var(--panel)', border: '1px solid var(--border)', overflow: 'hidden' }}
              >
                {/* header cột 40px: chấm màu + tên + đếm + nút ＋ (mock :107-119) */}
                <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px', borderBottom: '1px solid var(--border)', flex: 'none' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: stateDotVar(col.state, i, columns.map((c) => c.state)), flex: 'none' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.state.name}</span>
                  <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'var(--t4)' }}>{col.tasks.length}</span>
                  <button
                    type="button"
                    className="tb-addbtn"
                    aria-label={tr('Thêm thẻ', 'Add card')}
                    title={tr(`Thêm thẻ vào ${col.state.name}`, `Add card to ${col.state.name}`)}
                    onClick={() => { setAdding(col.state.id); setNewTitle(''); }}
                    style={{ marginLeft: 'auto', width: 24, height: 24, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--field)', color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* thân cột: thẻ gap 9, padding 10 (mock :120) */}
                <div style={{ flex: 1, minHeight: 40, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {adding === col.state.id && (
                    <form
                      onSubmit={(e) => { e.preventDefault(); void addTask(col.state.id); }}
                      style={{ borderRadius: 10, background: 'var(--card)', border: '1.5px dashed var(--accent)', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}
                    >
                      <input
                        ref={addInputRef}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Escape') setAdding(null); }}
                        placeholder={tr('Tên việc, Enter để lưu', 'Task title, Enter to save')}
                        style={{ border: 0, outline: 'none', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="submit" disabled={busy || !newTitle.trim()} style={{ height: 24, padding: '0 10px', border: 0, borderRadius: 6, background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: busy || !newTitle.trim() ? 0.5 : 1 }}>
                          {tr('Lưu', 'Save')}
                        </button>
                        <button type="button" onClick={() => setAdding(null)} style={{ height: 24, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--field)', color: 'var(--t3)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          {tr('Thôi', 'Cancel')}
                        </button>
                      </div>
                    </form>
                  )}

                  {col.tasks.map((t) => (
                    <div
                      key={t.id}
                      className="tb-card"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}
                      style={{ borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)', padding: '11px 12px', cursor: 'grab', display: 'flex', flexDirection: 'column', gap: 8 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 15 }}>
                        {contextChip(t)}
                        {dueBadge(t)}
                      </div>

                      {editingId === t.id ? (
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => commitEdit(t)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(t);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          style={{ border: 0, outline: 'none', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', borderBottom: '1px dashed var(--accent)' }}
                        />
                      ) : (
                        <div
                          onDoubleClick={() => startEdit(t)}
                          title={tr('Bấm đúp để sửa tên', 'Double-click to rename')}
                          style={{ fontSize: 12.5, lineHeight: 1.5, fontWeight: 600, color: 'var(--t1)', textWrap: 'pretty' as never }}
                        >
                          {t.title}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ flex: 1, minWidth: 0 }} />
                        {t.assigneeIds.length > 0 ? (
                          <span
                            title={t.assigneeIds.join(', ')}
                            style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flex: 'none' }}
                          >
                            {initialsOf(t.assigneeIds[0])}
                          </span>
                        ) : (
                          <span
                            title={tr('Chưa giao ai', 'Unassigned')}
                            aria-label={tr('Chưa giao ai', 'Unassigned')}
                            style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px dashed var(--border-strong)', flex: 'none' }}
                          />
                        )}
                      </div>

                      {/* ── ô nhập ngày, mở theo yêu cầu. Hai ô rời chứ không một khoảng: việc
                          CHỈ CÓ HẠN là ca hợp lệ (cột mốc trên dải), ép nhập cả cặp sẽ đẩy người
                          dùng bịa một ngày bắt đầu — đúng thứ dải Gantt từ chối vẽ. ── */}
                      {datNgayId === t.id && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {([
                            ['startAt', t.startAt, tr('Bắt đầu', 'Start')],
                            ['dueAt', t.dueAt, tr('Hạn', 'Due')],
                          ] as const).map(([khoa, giaTri, nhan]) => (
                            <label key={khoa} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--t4)' }}>
                              {nhan}
                              <input
                                type="date"
                                value={ngayCuaO(giaTri)}
                                disabled={busy}
                                onChange={(e) => void patchTask(t, { [khoa]: oThanhIso(e.target.value) })}
                                onMouseDown={(e) => e.stopPropagation()}
                                style={{
                                  height: 22, padding: '0 4px', borderRadius: 6, fontSize: 10.5,
                                  fontVariantNumeric: 'tabular-nums', border: '1px solid var(--border)',
                                  background: 'var(--field)', color: 'var(--t1)', colorScheme: 'light dark',
                                }}
                              />
                            </label>
                          ))}
                          {/* XOÁ NGÀY phải làm được: một việc lỡ nhập hạn rồi thấy chưa chốt được
                              hạn thì phải gỡ ra được, nếu không dải sẽ vẽ mãi một mốc không thật. */}
                          {(t.startAt || t.dueAt) && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void patchTask(t, { startAt: null, dueAt: null })}
                              title={tr('Gỡ cả hai ngày — việc quay về “chưa có ngày”', 'Clear both dates — task goes back to “no dates”')}
                              style={{ height: 22, padding: '0 7px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--t4)', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              {tr('Gỡ ngày', 'Clear')}
                            </button>
                          )}
                        </div>
                      )}

                      {/* nút hành động — đường CHÍNH đổi trạng thái (G8), hiện khi rê/focus */}
                      <div className="tb-tools" style={{ display: 'flex', gap: 5 }}>
                        <button
                          type="button"
                          className="tb-tool"
                          aria-pressed={datNgayId === t.id}
                          title={tr('Đặt ngày bắt đầu / hạn — dải Tiến độ chỉ vẽ việc CÓ HẠN', 'Set start / due date — the Timeline only draws tasks that have a due date')}
                          aria-label={tr('Đặt ngày', 'Set dates')}
                          onClick={() => setDatNgayId((cu) => (cu === t.id ? null : t.id))}
                        >
                          <CalendarClock size={13} strokeWidth={1.5} />
                        </button>
                        <button type="button" className="tb-tool" disabled={busy || !adjacentStatusId(states ?? [], t.statusId, -1)} title={tr('Lùi một cột', 'Move one column left')} aria-label={tr('Lùi một cột', 'Move one column left')} onClick={() => moveTask(t, -1)}>‹</button>
                        <button type="button" className="tb-tool" disabled={busy || !adjacentStatusId(states ?? [], t.statusId, 1)} title={tr('Tiến một cột', 'Move one column right')} aria-label={tr('Tiến một cột', 'Move one column right')} onClick={() => moveTask(t, 1)}>›</button>
                        <button type="button" className="tb-tool" title={tr('Sửa tên việc', 'Rename task')} aria-label={tr('Sửa tên việc', 'Rename task')} onClick={() => startEdit(t)}>✎</button>
                        <button type="button" className="tb-tool" disabled={busy} title={tr('Xoá việc', 'Delete task')} aria-label={tr('Xoá việc', 'Delete task')} onClick={() => void removeTask(t)} style={{ marginLeft: 'auto', color: 'var(--danger)' }}>×</button>
                      </div>
                    </div>
                  ))}

                  {col.tasks.length === 0 && adding !== col.state.id && query && (
                    <div style={{ fontSize: 11, color: 'var(--t5)', textAlign: 'center', padding: '8px 0' }}>
                      {tr('Không khớp việc nào', 'No matching tasks')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {orphans.length > 0 && (
            <div style={{ margin: '0 16px 8px', padding: '6px 10px', borderRadius: 10, background: 'color-mix(in srgb, var(--warning) 14%, transparent)', fontSize: 11, color: 'var(--t2)' }}>
              {tr(
                `${orphans.length} việc có trạng thái không còn tồn tại — tải lại trang để đồng bộ.`,
                `${orphans.length} task(s) reference a status that no longer exists — reload to sync.`,
              )}
            </div>
          )}

          {/* footer 26px (mock :310) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 26, padding: '0 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'var(--t4)' }}>
              {tr(`${tasks?.length ?? 0} việc`, `${tasks?.length ?? 0} task(s)`)}
              {query ? tr(` · đang lọc "${query}"`, ` · filtering "${query}"`) : ''}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--t4)' }}>
              {tr('Kéo thẻ sang cột khác để đổi trạng thái — hoặc dùng nút ‹ › trên thẻ', 'Drag cards between columns to change status — or use the ‹ › buttons')}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
