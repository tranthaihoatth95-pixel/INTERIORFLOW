'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw, ArrowRight } from 'lucide-react';
import { easeApple, pressable, springStage } from '@/lib/motion';
import { useLang } from '@/lib/i18n';
import { useFlowStore } from '@/lib/store';
import { createFlow, fetchFlows, openFlow, type FlowMeta } from '@/lib/workspace';
import { LangToggle } from '@/components/LangToggle';

/**
 * ProjectSelect — MÀN CHỌN DỰ ÁN sau đăng nhập, THAY cho StageSelect cũ.
 *
 * Gu: tái dùng ngôn ngữ "spatial gallery" visionOS của TitleSequence (đã duyệt):
 * card kính trung tâm rõ nét, các card hai bên xếp lớp 3D (rotateY, mờ + tối dần
 * vào chiều sâu), caption kính dưới card, pill kính phía trên chào user.
 * KHÁC TitleSequence: đây là màn TƯƠNG TÁC — không tự trôi; điều hướng bằng
 * bấm card bên / phím ← → / nút kính ‹ ›; bấm card giữa (hoặc Enter) để VÀO.
 *
 * Data thật: fetchFlows() → mỗi flow một card (tên, project, "x ngày trước",
 * thumbnail cover tĩnh xoay vòng theo hash id). Card cuối = "+ Dự án mới"
 * (dashed, kính mờ) → createFlow rỗng → openFlow → onEnter.
 * Chọn flow → openFlow(id) (nạp graph vào store + currentFlowId) → onEnter().
 * Vì tự openFlow nên KHÔNG cần bootstrapWorkspace ở nhánh chọn tay.
 * Lỗi API → thông báo nhẹ + "Vào canvas trống" để user không bao giờ kẹt.
 *
 * Reduce Motion / mobile hẹp: bỏ gallery 3D, hiện danh sách card phẳng cuộn dọc.
 * Trong app đã có bar 3 chặng Concept·Render·Present trên Header — vào thẳng canvas.
 */

const COPPER = '#c79a63';
const SANS = '-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue","Space Grotesk",system-ui,sans-serif';
const MONO = '"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace';

/** Cover tĩnh xoay vòng — chưa có cover thật per-flow, chọn theo hash id cho ổn định. */
const COVERS = ['/covers/render_00.jpeg', '/covers/render_04.jpeg', '/covers/render_10.jpeg'];

function coverFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COVERS[h % COVERS.length];
}

/** "2 ngày trước" / "2 days ago" từ ISO updatedAt. */
function timeAgo(iso: string, en: boolean): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return en ? 'just now' : 'vừa xong';
  const min = Math.floor(diff / 60_000);
  if (min < 1) return en ? 'just now' : 'vừa xong';
  if (min < 60) return en ? `${min} min ago` : `${min} phút trước`;
  const h = Math.floor(min / 60);
  if (h < 24) return en ? `${h} h ago` : `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return en ? (d === 1 ? '1 day ago' : `${d} days ago`) : `${d} ngày trước`;
  const mo = Math.floor(d / 30);
  return en ? (mo === 1 ? '1 month ago' : `${mo} months ago`) : `${mo} tháng trước`;
}

/* ---------- Pose 3D theo offset so với card focus (gu TitleSequence) ---------- */

type Pose = {
  x: string;
  rotateY: number;
  scale: number;
  opacity: number;
  filter: string;
  zIndex: number;
};

const POSES: Record<number, Pose> = {
  [-2]: { x: '-138%', rotateY: 42, scale: 0.7, opacity: 0.32, filter: 'brightness(0.55) blur(2.5px)', zIndex: 1 },
  [-1]: { x: '-76%', rotateY: 30, scale: 0.84, opacity: 0.68, filter: 'brightness(0.72) blur(1px)', zIndex: 2 },
  [0]: { x: '0%', rotateY: 0, scale: 1, opacity: 1, filter: 'brightness(1) blur(0px)', zIndex: 3 },
  [1]: { x: '76%', rotateY: -30, scale: 0.84, opacity: 0.68, filter: 'brightness(0.72) blur(1px)', zIndex: 2 },
  [2]: { x: '138%', rotateY: -42, scale: 0.7, opacity: 0.32, filter: 'brightness(0.55) blur(2.5px)', zIndex: 1 },
};

/** Card ngoài tầm nhìn (|offset| > 2) — trượt tiếp ra rìa rồi tan. */
const hiddenPose = (side: number): Pose => ({
  x: `${side * 176}%`,
  rotateY: side * -48,
  scale: 0.62,
  opacity: 0,
  filter: 'brightness(0.5) blur(3px)',
  zIndex: 0,
});

/** Chất liệu kính trung tính — đọc được trên cả theme sáng/tối (nền var(--bg)). */
const glass: React.CSSProperties = {
  background: 'rgba(127,127,127,0.08)',
  backdropFilter: 'blur(var(--blur-strong)) saturate(160%)',
  WebkitBackdropFilter: 'blur(var(--blur-strong)) saturate(160%)',
  border: '1px solid rgba(127,127,127,0.2)',
};

/** Caption kính TỐI đè lên ảnh — ảnh cover luôn tối nên chữ trắng an toàn mọi theme. */
const captionGlass: React.CSSProperties = {
  background: 'linear-gradient(180deg, transparent 0%, rgba(14,12,10,0.45) 34%, rgba(14,12,10,0.7) 100%)',
  backdropFilter: 'blur(14px) saturate(160%)',
  WebkitBackdropFilter: 'blur(14px) saturate(160%)',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  maskImage: 'linear-gradient(180deg, transparent 0%, black 26%)',
  WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 26%)',
};

type CardItem = { kind: 'flow'; flow: FlowMeta } | { kind: 'new' };

export function ProjectSelect({ onEnter }: { onEnter: () => void }) {
  const user = useFlowStore((s) => s.user);
  const reduce = useReducedMotion();
  const lang = useLang();
  const en = lang === 'en';

  const [flows, setFlows] = useState<FlowMeta[] | null>(null); // null = đang tải
  const [loadError, setLoadError] = useState(false);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false); // đang mở/tạo flow
  const [openError, setOpenError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadError(false);
    setFlows(null);
    fetchFlows()
      .then((r) => {
        setFlows(r.flows);
        setActive(0); // flow mới nhất đứng giữa
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(load, [load]);

  // flows đã sort mới nhất trước (server) + card cuối "+ Dự án mới".
  const items = useMemo<CardItem[]>(
    () => (flows ? [...flows.map((f): CardItem => ({ kind: 'flow', flow: f })), { kind: 'new' }] : []),
    [flows],
  );
  const n = items.length;

  /** Chọn card: flow → openFlow; new → createFlow rỗng rồi openFlow. Xong gọi onEnter. */
  const choose = useCallback(
    async (item: CardItem) => {
      if (busy) return;
      setBusy(true);
      setOpenError(null);
      try {
        const id =
          item.kind === 'new'
            ? await createFlow('Untitled flow', JSON.stringify({ nodes: [], edges: [] }))
            : item.flow.id;
        await openFlow(id); // nạp graph vào store + set currentFlowId
        onEnter();
      } catch {
        setBusy(false);
        setOpenError(
          en
            ? 'Could not open the project — try again, or enter an empty canvas.'
            : 'Không mở được dự án — thử lại, hoặc vào canvas trống.',
        );
      }
    },
    [busy, en, onEnter],
  );

  // Phím ← → điều hướng, Enter mở card đang focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy || n === 0) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActive((a) => Math.min(n - 1, a + 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        void choose(items[active]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, n, active, items, choose]);

  const step = (dir: 1 | -1) => setActive((a) => Math.min(n - 1, Math.max(0, a + dir)));

  const firstName = user?.name?.split(' ').slice(-1)[0] ?? null;

  const cardTransition = reduce
    ? { duration: 0 }
    : {
        default: springStage,
        opacity: { duration: 0.55, ease: easeApple },
        filter: { duration: 0.55, ease: easeApple },
      };

  /* ---------- Nội dung card dùng chung (gallery + list phẳng) ---------- */

  const flowCaption = (f: FlowMeta) => (
    <>
      <div className="truncate text-[15px] font-semibold leading-tight text-white sm:text-[17px]" style={{ fontFamily: SANS }}>
        {f.name}
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="truncate text-[11px] text-white/60 sm:text-[12px]" style={{ fontFamily: SANS }}>
          {f.project ? f.project.name : en ? 'No project' : 'Chưa gắn dự án'}
        </span>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/70"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          {timeAgo(f.updatedAt, en)}
        </span>
      </div>
    </>
  );

  /* ---------- Các khối trạng thái ---------- */

  const loadingBlock = (
    <div className="flex items-center gap-2.5 rounded-full px-5 py-3" style={glass}>
      <Loader2 size={15} className="animate-spin" style={{ color: COPPER }} />
      <span className="text-[13px] text-[var(--t3,var(--t4))]" style={{ fontFamily: SANS }}>
        {en ? 'Loading your projects…' : 'Đang tải dự án…'}
      </span>
    </div>
  );

  const errorBlock = (
    <div className="flex max-w-sm flex-col items-center gap-4 rounded-[var(--radius-xl)] px-7 py-7 text-center" style={glass}>
      <p className="text-[13px] leading-relaxed text-[var(--t4)]" style={{ fontFamily: SANS }}>
        {en
          ? 'Could not load your projects — check the connection and try again.'
          : 'Không tải được danh sách dự án — kiểm tra kết nối rồi thử lại.'}
      </p>
      <div className="flex items-center gap-2.5">
        <motion.button
          {...pressable}
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium text-[var(--t1)]"
          style={glass}
        >
          <RefreshCw size={13} />
          {en ? 'Retry' : 'Thử lại'}
        </motion.button>
        <motion.button
          {...pressable}
          type="button"
          onClick={onEnter}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold"
          style={{ background: COPPER, color: '#1c1409', fontFamily: SANS }}
        >
          {en ? 'Enter empty canvas' : 'Vào canvas trống'}
          <ArrowRight size={13} />
        </motion.button>
      </div>
    </div>
  );

  /* ---------- Gallery 3D (desktop, không reduce-motion) ---------- */

  const gallery = (
    <div className="relative w-full">
      <div className="grid place-items-center px-4" style={{ perspective: 1400 }}>
        <div className="relative grid place-items-center" style={{ transformStyle: 'preserve-3d' }}>
          {items.map((item, i) => {
            const off = i - active;
            const shown = Math.abs(off) <= 2;
            const pose = shown ? POSES[off] : hiddenPose(off < 0 ? -1 : 1);
            const isCenter = off === 0;
            const key = item.kind === 'flow' ? item.flow.id : '__new__';
            return (
              <motion.button
                key={key}
                type="button"
                disabled={busy}
                onClick={() => {
                  if (isCenter) void choose(item);
                  else setActive(i);
                }}
                aria-label={
                  item.kind === 'flow' ? item.flow.name : en ? 'New project' : 'Dự án mới'
                }
                className="col-start-1 row-start-1 cursor-pointer overflow-hidden text-left disabled:cursor-wait"
                style={{
                  width: 'clamp(240px, 46vw, 460px)',
                  aspectRatio: '4 / 3',
                  borderRadius: 'var(--radius-xl)',
                  border:
                    item.kind === 'new'
                      ? `1.5px dashed ${isCenter ? COPPER : 'rgba(127,127,127,0.4)'}`
                      : isCenter
                        ? `1px solid ${COPPER}66`
                        : '1px solid rgba(255,255,255,0.16)',
                  boxShadow: '0 30px 70px -24px rgba(0,0,0,0.6)',
                  zIndex: pose.zIndex,
                  background: item.kind === 'new' ? 'rgba(127,127,127,0.07)' : '#141210',
                  backdropFilter: item.kind === 'new' ? 'blur(var(--blur-strong)) saturate(160%)' : undefined,
                  pointerEvents: pose.opacity === 0 ? 'none' : 'auto',
                }}
                initial={false}
                animate={{
                  x: pose.x,
                  rotateY: pose.rotateY,
                  scale: pose.scale,
                  opacity: pose.opacity,
                  filter: pose.filter,
                }}
                transition={cardTransition}
              >
                {item.kind === 'flow' ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverFor(item.flow.id)}
                      alt=""
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                    {/* caption kính — rõ ở card trung tâm (gu TitleSequence) */}
                    <motion.div
                      className="absolute inset-x-0 bottom-0 px-4 pb-3.5 pt-8 sm:px-5 sm:pb-4"
                      style={captionGlass}
                      initial={false}
                      animate={{ opacity: isCenter ? 1 : 0 }}
                      transition={{ duration: reduce ? 0 : 0.45, ease: easeApple }}
                    >
                      {flowCaption(item.flow)}
                    </motion.div>
                  </>
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <div className="flex flex-col items-center gap-3">
                      <span
                        className="grid h-12 w-12 place-items-center rounded-full"
                        style={{
                          border: `1.5px dashed ${isCenter ? COPPER : 'rgba(127,127,127,0.5)'}`,
                          color: isCenter ? COPPER : 'var(--t4)',
                        }}
                      >
                        <Plus size={20} />
                      </span>
                      <span
                        className="text-[14px] font-semibold"
                        style={{ fontFamily: SANS, color: isCenter ? 'var(--t1)' : 'var(--t4)' }}
                      >
                        {en ? 'New project' : 'Dự án mới'}
                      </span>
                      <span className="max-w-[14rem] text-center text-[11px] leading-relaxed text-[var(--t4)]" style={{ fontFamily: SANS }}>
                        {en ? 'Start from an empty canvas' : 'Bắt đầu từ một canvas trống'}
                      </span>
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* nút kính ‹ › hai rìa */}
      <button
        type="button"
        aria-label={en ? 'Previous' : 'Thẻ trước'}
        onClick={() => step(-1)}
        disabled={active === 0 || busy}
        className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-[var(--t2,var(--t1))] transition-opacity disabled:opacity-30 sm:left-4"
        style={glass}
      >
        <ChevronLeft size={17} />
      </button>
      <button
        type="button"
        aria-label={en ? 'Next' : 'Thẻ kế'}
        onClick={() => step(1)}
        disabled={active === n - 1 || busy}
        className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-[var(--t2,var(--t1))] transition-opacity disabled:opacity-30 sm:right-4"
        style={glass}
      >
        <ChevronRight size={17} />
      </button>

      {/* dots kiểu visionOS — chấm active kéo dài */}
      <div className="mt-6 flex items-center justify-center gap-1.5" aria-hidden>
        {items.map((_, i) => (
          <span
            key={i}
            className="h-[5px] rounded-full transition-all duration-500"
            style={{
              width: i === active ? 22 : 5,
              background: i === active ? COPPER : 'rgba(127,127,127,0.35)',
            }}
          />
        ))}
      </div>

      <p className="mt-3 text-center text-[11px] text-[var(--t5,var(--t4))]" style={{ fontFamily: SANS }}>
        {en ? 'Click the focused card or press Enter to open · ← →' : 'Bấm thẻ đang chọn hoặc Enter để mở · ← →'}
      </p>
    </div>
  );

  /* ---------- Danh sách phẳng (mobile hẹp / reduce-motion) ---------- */

  const flatList = (
    <div className="max-h-[62vh] w-full max-w-md overflow-y-auto px-1 py-1">
      <div className="grid gap-3">
        {items.map((item) => {
          const key = item.kind === 'flow' ? item.flow.id : '__new__';
          return (
            <button
              key={key}
              type="button"
              disabled={busy}
              onClick={() => void choose(item)}
              className="flex w-full items-center gap-3.5 p-3 text-left transition-opacity disabled:cursor-wait disabled:opacity-60"
              style={{
                ...glass,
                borderRadius: 'var(--radius-xl)',
                border: item.kind === 'new' ? '1.5px dashed rgba(127,127,127,0.4)' : (glass.border as string),
              }}
            >
              {item.kind === 'flow' ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverFor(item.flow.id)}
                    alt=""
                    draggable={false}
                    className="h-14 w-[74px] shrink-0 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-[var(--t1)]" style={{ fontFamily: SANS }}>
                      {item.flow.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--t4)]" style={{ fontFamily: SANS }}>
                      {item.flow.project ? `${item.flow.project.name} · ` : ''}
                      {timeAgo(item.flow.updatedAt, en)}
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-[var(--t4)]" />
                </>
              ) : (
                <>
                  <span
                    className="grid h-14 w-[74px] shrink-0 place-items-center rounded-lg"
                    style={{ border: `1.5px dashed ${COPPER}`, color: COPPER }}
                  >
                    <Plus size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-[var(--t1)]" style={{ fontFamily: SANS }}>
                      {en ? 'New project' : 'Dự án mới'}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[var(--t4)]" style={{ fontFamily: SANS }}>
                      {en ? 'Start from an empty canvas' : 'Bắt đầu từ một canvas trống'}
                    </span>
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6"
      style={{ background: 'var(--bg)' }}
    >
      {/* đổi ngôn ngữ — góc phải trên (giữ ngữ nghĩa StageSelect cũ) */}
      <div className="absolute right-6 top-6 z-20">
        <LangToggle variant="ghost" />
      </div>

      {/* nền đêm ấm — quầng đồng tĩnh + vignette (đồng bộ StageSelect/TitleSequence) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full"
          style={{ background: `radial-gradient(circle, ${COPPER} 0%, transparent 64%)`, filter: 'blur(90px)' }}
          initial={{ opacity: 0.1 }}
          animate={reduce ? { opacity: 0.1 } : { opacity: [0.08, 0.13, 0.08], x: [0, 24, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(130% 100% at 50% 30%, transparent 45%, rgba(0,0,0,0.5) 100%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeApple }}
        className="relative z-10 flex w-full max-w-5xl flex-col items-center"
      >
        {/* pill kính chào user + tiêu đề (kiểu thanh kính TitleSequence) */}
        <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <div className="flex items-center gap-2 rounded-full px-4 py-1.5" style={glass}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: COPPER }} />
            <span
              className="text-[10px] uppercase text-[var(--t4)]"
              style={{ fontFamily: MONO, letterSpacing: '0.28em' }}
            >
              {firstName ? (en ? `Hi ${firstName}` : `Chào ${firstName}`) : 'InteriorFlow'}
            </span>
          </div>
          <h1
            className="mt-4 text-[26px] font-semibold leading-tight text-[var(--t1)] sm:text-[34px]"
            style={{ fontFamily: SANS, letterSpacing: '-0.028em' }}
          >
            {en ? 'Pick a project to begin' : 'Chọn dự án để bắt đầu'}
          </h1>
          <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-[var(--t4)]" style={{ fontFamily: SANS }}>
            {en
              ? 'Open a flow and land straight on the canvas — Concept · Render · Present live in the header.'
              : 'Mở một flow là vào thẳng canvas — Concept · Render · Present nằm sẵn trên thanh Header.'}
          </p>
        </div>

        {/* thân màn theo trạng thái */}
        {loadError ? (
          errorBlock
        ) : flows === null ? (
          loadingBlock
        ) : reduce ? (
          flatList
        ) : (
          <>
            {/* mobile hẹp: danh sách dọc cuộn được — không tràn ngang */}
            <div className="w-full sm:hidden">{flatList}</div>
            {/* desktop/tablet: gallery 3D visionOS */}
            <div className="hidden w-full sm:block">{gallery}</div>
          </>
        )}

        {/* lỗi mở flow — thông báo nhẹ + lối thoát */}
        {openError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: easeApple }}
            className="mt-5 flex flex-wrap items-center justify-center gap-3 rounded-full px-5 py-2.5"
            style={glass}
          >
            <span className="text-[12px] text-[var(--t4)]" style={{ fontFamily: SANS }}>
              {openError}
            </span>
            <button
              type="button"
              onClick={onEnter}
              className="text-[12px] font-semibold underline-offset-2 hover:underline"
              style={{ color: COPPER, fontFamily: SANS }}
            >
              {en ? 'Enter empty canvas' : 'Vào canvas trống'}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* overlay kính mờ khi đang mở/tạo flow */}
      {busy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: easeApple }}
          className="absolute inset-0 z-30 grid place-items-center"
          style={{
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <div className="flex items-center gap-2.5 rounded-full px-5 py-3" style={glass}>
            <Loader2 size={15} className="animate-spin" style={{ color: COPPER }} />
            <span className="text-[13px] text-[var(--t1)]" style={{ fontFamily: SANS }}>
              {en ? 'Opening project…' : 'Đang mở dự án…'}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
