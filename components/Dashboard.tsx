'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FolderKanban, Workflow, Users, Coins, Plus, Loader2, Share2, Clock, Crown, Circle, Check,
} from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { openFlow, createProject } from '@/lib/workspace';
import { fade, pressable, pressableIcon, staggerList, staggerItem } from '@/lib/motion';
import { cn } from '@/lib/utils';

/* ---------- kiểu dữ liệu trả về từ /api/dashboard ---------- */
interface Member {
  id: string; name: string; email: string; credits: number; isAdmin: boolean;
  lastSeenAt: string; online: boolean; flowCount: number; projectCount: number;
}
interface ProjectRow {
  id: string; name: string; clientName: string | null; createdAt: string;
  user: { id: string; name: string }; _count: { flows: number };
}
interface FlowRow {
  id: string; name: string; version: number; updatedAt: string; shareToken: string | null;
  user: { id: string; name: string }; project: { id: string; name: string } | null;
}
interface DashboardData {
  me: string;
  stats: { projects: number; flows: number; members: number; online: number; creditsSpent30d: number; creditsRemaining: number };
  team: Member[];
  projects: ProjectRow[];
  flows: FlowRow[];
}

/* ---------- tiện ích hiển thị ---------- */
const AVATAR_COLORS = ['#8b7cf7', '#f59e0b', '#22c55e', '#38bdf8', '#ec4899', '#14b8a6', '#f97316', '#a855f7'];
function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';
}
function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

function Avatar({ id, name, size = 32, online }: { id: string; name: string; size?: number; online?: boolean }) {
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <span
        className="grid h-full w-full place-items-center rounded-full font-semibold text-white"
        style={{ background: colorFor(id), fontSize: size * 0.36 }}
        title={name}
      >
        {initials(name)}
      </span>
      {online !== undefined && (
        <span
          className={cn('absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-[var(--bg)]', online ? 'bg-emerald-400' : 'bg-[var(--t5)]')}
          style={{ width: size * 0.3, height: size * 0.3 }}
        />
      )}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof FolderKanban; label: string; value: string | number; sub?: string }) {
  return (
    <motion.div variants={staggerItem} className="mat-card rounded-[16px] border border-[var(--mat-hairline)] p-4">
      <div className="flex items-center gap-2 text-[var(--t4)]">
        <Icon size={15} />
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--t1)]">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-[var(--t4)]">{sub}</div>}
    </motion.div>
  );
}

/**
 * Dashboard tổng quan.
 * - Mặc định: overlay toàn màn (gated dashboardOpen) — có thao tác (mở flow, tạo dự án).
 * - coverMode: dùng cho MÀN HÌNH NGOÀI của foldable (cover, hẹp) → chỉ XEM (read-only):
 *   render inline (không overlay/không cần store), ẩn nút thao tác, hàng flow không bấm mở.
 */
export function Dashboard({
  coverMode = false,
  onEnterFullApp,
}: {
  coverMode?: boolean;
  /** Cover-mode: nút ép vào full app (không bị kẹt màn ngoài khi viewport hẹp). */
  onEnterFullApp?: () => void;
}) {
  const open = useFlowStore((s) => s.dashboardOpen);
  const setOpen = useFlowStore((s) => s.setDashboardOpen);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  // Ô nhập tên dự án mới — thay cho window.prompt (crash trong webview nhúng, vd Electron).
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Ở cover luôn coi như "mở" để nạp dữ liệu + hiển thị inline.
  const shown = coverMode || open;

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/dashboard')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (shown) load();
  }, [shown, load]);

  useEffect(() => {
    // Esc chỉ đóng ở chế độ overlay; cover-mode không có gì để đóng.
    if (!open || coverMode) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, coverMode, setOpen]);

  const onOpenFlow = async (id: string) => {
    if (coverMode) return; // màn ngoài read-only — không mở flow
    await openFlow(id);
    setOpen(false);
  };

  const onNewProject = () => {
    setNewProjectName('');
    setNewProjectOpen(true);
  };

  const cancelNewProject = useCallback(() => {
    setNewProjectOpen(false);
    setNewProjectName('');
  }, []);

  const confirmNewProject = useCallback(async () => {
    const name = newProjectName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createProject(name);
      load();
      setNewProjectOpen(false);
      setNewProjectName('');
    } finally {
      setCreating(false);
    }
  }, [newProjectName, load]);

  // Nội dung dùng chung cho cả overlay lẫn cover-mode.
  const inner = (
    <>
      {/* thanh trên */}
      <div className="mat-header flex h-14 shrink-0 items-center gap-3 border-b border-[var(--border)] px-4 sm:px-6">
        <FolderKanban size={18} className="text-[var(--accent)]" />
        <h1 className="text-base font-semibold tracking-tight text-[var(--t1)]">Tổng quan</h1>
        <span className="hidden text-xs text-[var(--t4)] sm:block">Dự án · Team · Hoạt động</span>
        <div className="flex-1" />
        {/* Cover (màn ngoài) = CHỈ XEM → ẩn nút thao tác, thay bằng gợi ý mở màn trong. */}
        {coverMode ? (
          <span className="text-[11px] text-[var(--t4)]">Mở màn hình trong để thao tác</span>
        ) : newProjectOpen ? (
          <>
            {/* Đặt tên dự án — input inline thay window.prompt (không hoạt động trong webview nhúng). */}
            <input
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmNewProject();
                else if (e.key === 'Escape') {
                  e.stopPropagation();
                  cancelNewProject();
                }
              }}
              placeholder="Tên dự án mới…"
              className="w-48 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-xs text-[var(--t1)] outline-none focus:border-[var(--accent)]"
            />
            <motion.button
              {...pressableIcon}
              onClick={confirmNewProject}
              disabled={creating || !newProjectName.trim()}
              title="Tạo dự án"
              className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--accent-strong)] text-white transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
            >
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
            </motion.button>
            <motion.button
              {...pressableIcon}
              onClick={cancelNewProject}
              disabled={creating}
              title="Huỷ (Esc)"
              className="grid h-8 w-8 place-items-center rounded-[10px] border border-[var(--border)] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)] disabled:opacity-50"
            >
              <X size={14} />
            </motion.button>
          </>
        ) : (
          <>
            <motion.button
              {...pressable}
              onClick={onNewProject}
              disabled={creating}
              className="flex items-center gap-1.5 rounded-[10px] bg-[var(--accent-strong)] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
            >
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Dự án mới
            </motion.button>
            <motion.button
              {...pressableIcon}
              whileHover={{ scale: 1.06 }}
              onClick={() => setOpen(false)}
              title="Đóng (Esc)"
              className="grid h-8 w-8 place-items-center rounded-[10px] border border-[var(--border)] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
            >
              <X size={16} />
            </motion.button>
          </>
        )}
      </div>

      {/* Gợi ý mở màn trong — dải mảnh dưới thanh trên (chỉ cover). */}
      {coverMode && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-b border-[var(--border)] bg-[var(--accent-soft)] px-4 py-2 text-[12px] text-[var(--accent)]">
          <span>Màn hình hẹp — bản xem nhanh (chỉ đọc). Mở toàn bộ app hoặc dùng màn rộng hơn để thao tác.</span>
          {onEnterFullApp && (
            <button
              type="button"
              onClick={onEnterFullApp}
              className="rounded-full border border-[var(--accent)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
            >
              Mở toàn bộ app
            </button>
          )}
        </div>
      )}

      {/* nội dung cuộn */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {loading && !data ? (
              <div className="grid h-64 place-items-center text-[var(--t4)]">
                <Loader2 size={22} className="animate-spin" />
              </div>
            ) : !data ? (
              <div className="grid h-64 place-items-center text-sm text-[var(--t4)]">
                Chưa tải được dữ liệu. Cần đăng nhập để xem tổng quan team.
              </div>
            ) : (
              <div className="mx-auto max-w-6xl space-y-6">
                {/* thống kê */}
                <motion.div variants={staggerList} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <StatCard icon={FolderKanban} label="Dự án" value={data.stats.projects} />
                  <StatCard icon={Workflow} label="Flow" value={data.stats.flows} />
                  <StatCard icon={Users} label="Thành viên" value={data.stats.members} sub={`${data.stats.online} đang online`} />
                  <StatCard icon={Coins} label="Credit dùng 30 ngày" value={data.stats.creditsSpent30d} sub={`còn ${data.stats.creditsRemaining} trong team`} />
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                  {/* dự án */}
                  <section>
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--t2)]">
                      <FolderKanban size={15} /> Dự án ({data.projects.length})
                    </h2>
                    {data.projects.length === 0 ? (
                      <p className="rounded-[14px] border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--t4)]">
                        Chưa có dự án nào. Bấm <span className="text-[var(--t2)]">Dự án mới</span> để bắt đầu.
                      </p>
                    ) : (
                      <motion.div variants={staggerList} initial="hidden" animate="visible" className="grid gap-3 sm:grid-cols-2">
                        {data.projects.map((p) => (
                          <motion.div
                            key={p.id}
                            variants={staggerItem}
                            className="mat-card rounded-[16px] border border-[var(--mat-hairline)] p-4 transition-colors hover:border-[var(--accent-ring)]"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-[var(--t1)]">{p.name}</div>
                                {p.clientName && <div className="truncate text-xs text-[var(--t4)]">KH: {p.clientName}</div>}
                              </div>
                              <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                                {p._count.flows} flow
                              </span>
                            </div>
                            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--t4)]">
                              <Avatar id={p.user.id} name={p.user.name} size={18} />
                              {p.user.name} · {timeAgo(p.createdAt)}
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </section>

                  {/* team */}
                  <section>
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--t2)]">
                      <Users size={15} /> Team ({data.stats.online}/{data.stats.members} online)
                    </h2>
                    <div className="mat-card divide-y divide-[var(--border)] overflow-hidden rounded-[16px] border border-[var(--mat-hairline)]">
                      {data.team.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                          <Avatar id={m.id} name={m.name} size={34} online={m.online} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 truncate text-sm font-medium text-[var(--t1)]">
                              {m.name}
                              {m.id === data.me && <span className="rounded bg-[var(--hover)] px-1 text-[9px] text-[var(--t3)]">bạn</span>}
                              {m.isAdmin && <Crown size={11} className="text-amber-400" />}
                            </div>
                            <div className="truncate text-[11px] text-[var(--t4)]">
                              {m.online ? 'online' : timeAgo(m.lastSeenAt)} · {m.flowCount} flow
                            </div>
                          </div>
                          <span className="flex shrink-0 items-center gap-1 text-[11px] text-[var(--t3)]">
                            <Coins size={12} className="text-amber-400" /> {m.credits}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* hoạt động gần đây */}
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--t2)]">
                    <Clock size={15} /> Flow cập nhật gần đây
                  </h2>
                  {data.flows.length === 0 ? (
                    <p className="text-sm text-[var(--t4)]">Chưa có flow nào.</p>
                  ) : (
                    <div className="mat-card divide-y divide-[var(--border)] overflow-hidden rounded-[16px] border border-[var(--mat-hairline)]">
                      {data.flows.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => onOpenFlow(f.id)}
                          disabled={coverMode}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            coverMode ? 'cursor-default' : 'hover:bg-[var(--hover)]',
                          )}
                        >
                          <Workflow size={15} className="shrink-0 text-[var(--t4)]" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm text-[var(--t1)]">{f.name}</div>
                            <div className="truncate text-[11px] text-[var(--t4)]">
                              {f.project ? `${f.project.name} · ` : ''}{f.user.name} · v{f.version} · {timeAgo(f.updatedAt)}
                            </div>
                          </div>
                          {f.shareToken && <Share2 size={13} className="shrink-0 text-emerald-400" />}
                          <Circle size={5} className="shrink-0 fill-[var(--accent)] text-[var(--accent)]" />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
    </>
  );

  // Cover-mode: render INLINE làm nội dung chính của màn ngoài (không overlay,
  // không phụ thuộc dashboardOpen). Full chiều cao, tự cuộn.
  if (coverMode) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-[var(--bg)]">{inner}</div>
    );
  }

  // Mặc định: overlay toàn màn có animate + gate dashboardOpen.
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={fade}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]"
        >
          {inner}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
