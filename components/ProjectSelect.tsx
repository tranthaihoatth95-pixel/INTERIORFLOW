'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePageVisible } from '@/lib/usePageVisible';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  ArrowRight,
  ImagePlus,
  Check,
  X,
  Upload,
  Search,
  Info,
  Link2,
  Send,
} from 'lucide-react';
import VitalsIcon from '@/components/studio/VitalsIcon';
import { VitalsBubble, VitalsTyping } from '@/components/studio/VitalsChatBubble';
import { easeApple, pressable, springStage } from '@/lib/motion';
import { useLang } from '@/lib/i18n';
import { useFlowStore } from '@/lib/store';
import { createFlow, openFlow, createProject, assignProject } from '@/lib/workspace';
import { applyCadHandoff } from '@/lib/cad/handoff';
import { LangToggle } from '@/components/LangToggle';
import { adaptiveTextStyle, useAdaptiveContrast } from '@/components/ui/AdaptiveContrast';
import type { ContrastPlan } from '@/lib/adaptive-contrast';

/**
 * Home/Gallery ↔ Larkbase (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md, M1) — BỔ SUNG dữ liệu vào
 * ĐÚNG VỊ TRÍ card đang có (§2.2(a)), KHÔNG vẽ lại layout. 3 điểm chạm mới trong file này:
 *   1. Pill "Cảnh báo" Larkbase cạnh tên dự án (nếu Project đã gán larkProjectCode + đã sync).
 *   2. Tooltip avatar owner nối thêm Chức danh/Phòng ban (đối chiếu LarkUserMap → LarkPersonRef).
 *   3. Nút "Chi tiết" (mỗi card + 1 nút cố định đầu trang) + "Đồng bộ tiến độ" — mở lại
 *      Dashboard.tsx overlay đã có sẵn, KHÔNG modal mới (openDashboardTab, lib/store.ts).
 * Toàn bộ BEST-EFFORT: fetch lỗi/Lark chưa cấu hình → im lặng bỏ qua, Gallery hiện y hệt hôm
 * nay (không có card cũ nào regression, đúng yêu cầu verify bắt buộc).
 */
interface LarkSummary {
  byCode: Map<string, string>; // larkProjectCode -> cảnh báo đại diện (worst-case, nguyên chuỗi Larkbase)
  personByAccount: Map<string, { fullName: string; title: string | null; department: string | null }>;
  mapByUser: Map<string, string>; // User.id -> larkAccount
  distinctCodes: { code: string; name: string }[];
}

function useLarkSummary(): LarkSummary | null {
  const [summary, setSummary] = useState<LarkSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/lark-tasks')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j) return;
        // import động tránh vòng phụ thuộc — worstWarningByCode thuần hàm, không I/O.
        import('@/lib/lark/task-utils').then(({ worstWarningByCode }) => {
          if (cancelled) return;
          const byCode = worstWarningByCode(
            (j.tasks ?? []).map((t: { larkProjectCode: string | null; status: string; warningLabel: string | null; daysLeft: number | null }) => t),
          );
          const personByAccount = new Map<string, { fullName: string; title: string | null; department: string | null }>();
          for (const p of j.persons ?? []) personByAccount.set(p.larkAccount, { fullName: p.fullName, title: p.title, department: p.department });
          const mapByUser = new Map<string, string>();
          for (const m of j.userMap ?? []) mapByUser.set(m.userId, m.larkAccount);
          setSummary({ byCode, personByAccount, mapByUser, distinctCodes: j.distinctCodes ?? [] });
        });
      })
      .catch(() => {
        /* best-effort — Lark chưa cấu hình/chưa sync/mạng lỗi → Gallery vẫn hiện bình thường */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return summary;
}

/**
 * ProjectSelect — MÀN CHỌN DỰ ÁN sau đăng nhập, THAY cho StageSelect cũ.
 *
 * Gu: tái dùng ngôn ngữ "spatial gallery" visionOS của TitleSequence (đã duyệt):
 * card kính trung tâm rõ nét, các card hai bên xếp lớp 3D (rotateY, mờ + tối dần
 * vào chiều sâu), caption kính dưới card, pill kính phía trên chào user.
 * KHÁC TitleSequence: đây là màn TƯƠNG TÁC — không tự trôi; điều hướng bằng
 * bấm card bên / phím ← → / nút kính ‹ ›; bấm card giữa (hoặc Enter) để VÀO.
 *
 * NÂNG CẤP CARD DỰ ÁN:
 *  1. Ảnh bìa chọn được — flow.coverUrl (từ thư viện /api/library hoặc 3 cover mặc
 *     định). Card focus có pill kính "Đổi bìa" → picker lưới thumbnail → PUT coverUrl
 *     (optimistic). Không có coverUrl → fallback hash-cover cũ.
 *  2. Dòng trạng thái ngắn — flow.status dưới tên; card focus bấm vào → input inline
 *     pill kính → PUT status. Trống → "· Chưa có ghi chú" mờ.
 *  3. Hàng memoji nhân sự — avatar tròn 28px chồng mép góc dưới card, mỗi thành viên
 *     team 1 ô (roster từ GET /api/flows → team). Online = màu đầy + chấm xanh; offline
 *     = grayscale + mờ. Tooltip tên.
 *
 * Data thật: GET /api/flows → { flows(+coverUrl,status), team }. Mỗi flow một card.
 * Card cuối = "+ Dự án mới" → createFlow rỗng → openFlow → onEnter.
 * Chọn flow → openFlow(id) (nạp graph vào store + currentFlowId) → onEnter().
 * Lỗi API → thông báo nhẹ + "Vào canvas trống" để user không bao giờ kẹt.
 *
 * Reduce Motion / mobile hẹp: bỏ gallery 3D, hiện danh sách card phẳng cuộn dọc
 * (cũng hiện status + avatars).
 */

const COPPER = '#c79a63';
const SANS = '-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue","Space Grotesk",system-ui,sans-serif';
const MONO = '"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace';

/** 3 cover mặc định — cũng dùng làm fallback hash-cover khi flow chưa có coverUrl. */
const COVERS = ['/covers/render_00.jpeg', '/covers/render_04.jpeg', '/covers/render_10.jpeg'];

function coverFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COVERS[h % COVERS.length];
}

/** Ảnh bìa thực tế của card: coverUrl chọn tay > fallback hash-cover. */
function coverOf(f: FlowRow): string {
  return f.coverUrl && f.coverUrl.length > 0 ? f.coverUrl : coverFor(f.id);
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

/* ---------- Memoji-slot avatar: gradient theo hash tên + chữ cái đầu ---------- */

function avatarGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 42) % 360;
  return `linear-gradient(135deg, hsl(${a} 58% 54%), hsl(${b} 62% 40%))`;
}

function initialOf(name: string): string {
  const t = (name ?? '').trim();
  return t ? t[0].toUpperCase() : '?';
}

/* ---------- Kiểu dữ liệu cục bộ (FlowMeta ở lib/workspace không có coverUrl/status) ---------- */

type TeamMember = { id: string; name: string; online: boolean };
type FlowRow = {
  id: string;
  name: string;
  /** owner của flow — nguồn DUY NHẤT về "thành viên" đang có trong schema (không có bảng membership). */
  userId?: string;
  version: number;
  updatedAt: string;
  shareToken: string | null;
  project: { id: string; name: string; larkProjectCode?: string | null } | null;
  coverUrl?: string;
  status?: string;
};

/** GET /api/flows — bản giàu hơn fetchFlows() workspace (kèm coverUrl/status + team roster). */
async function loadProjectCards(): Promise<{ flows: FlowRow[]; team: TeamMember[] }> {
  const res = await fetch('/api/flows');
  if (!res.ok) throw new Error('Không tải được danh sách flow.');
  const j = await res.json().catch(() => ({}));
  const flows: FlowRow[] = Array.isArray(j?.flows) ? j.flows : [];
  const team: TeamMember[] = Array.isArray(j?.team)
    ? j.team
        .filter((m: unknown): m is TeamMember => !!m && typeof (m as TeamMember).id === 'string')
        .map((m: TeamMember) => ({ id: m.id, name: m.name ?? '', online: !!m.online }))
    : [];
  return { flows, team };
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

/**
 * Caption kính đè lên ảnh bìa — 19/07 (login-contrast) chuyển sang TƯƠNG PHẢN THÍCH ỨNG:
 * đo độ sáng + độ rối của DẢI ĐÁY ảnh bìa (lib/adaptive-contrast.ts) rồi mới quyết định
 * chữ kem hay chữ mực và sương đậm bao nhiêu. Ảnh bìa không còn "luôn tối" như giả định cũ
 * (user đổi bìa được, upload được), nên bảng cứng dưới đây chỉ còn là nền chất liệu.
 */
const captionGlassBase: React.CSSProperties = {
  backdropFilter: 'blur(14px) saturate(160%)',
  WebkitBackdropFilter: 'blur(14px) saturate(160%)',
  maskImage: 'linear-gradient(180deg, transparent 0%, black 26%)',
  WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 26%)',
};

/** Dải đáy ảnh bìa — đúng chỗ caption nằm. */
const CAPTION_REGION = { x: 0, y: 0.6, w: 1, h: 0.4 };

/**
 * Vỏ caption của một card — hook đo tương phản phải nằm trong component RIÊNG vì các card
 * được render trong vòng lặp (không gọi hook trong map được).
 */
function AdaptiveCaption({
  src,
  isCenter,
  reduce,
  render,
}: {
  src: string;
  isCenter: boolean;
  reduce: boolean;
  render: (plan: ContrastPlan) => React.ReactNode;
}) {
  const plan = useAdaptiveContrast({ src, region: CAPTION_REGION, shape: 'bottom', baseAlpha: 0.3 });
  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 px-4 pb-3.5 pt-8 sm:px-5 sm:pb-4"
      // caption chỉ nhận tương tác ở card focus (tránh bấm nhầm nút ở card mờ)
      style={{
        ...captionGlassBase,
        background: plan.scrim,
        borderTop: `1px solid ${plan.tone === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(20,17,13,0.12)'}`,
        pointerEvents: isCenter ? 'auto' : 'none',
      }}
      initial={false}
      animate={{ opacity: isCenter ? 1 : 0 }}
      transition={{ duration: reduce ? 0 : 0.45, ease: easeApple }}
    >
      {render(plan)}
    </motion.div>
  );
}

/** Pill kính nhỏ tối trên ảnh (nút Đổi bìa / status). */
const darkPill: React.CSSProperties = {
  background: 'rgba(14,12,10,0.5)',
  backdropFilter: 'blur(10px) saturate(150%)',
  WebkitBackdropFilter: 'blur(10px) saturate(150%)',
  border: '1px solid rgba(255,255,255,0.16)',
};

type CardItem = { kind: 'flow'; flow: FlowRow } | { kind: 'new' };

/** Lượt chat "Trợ lý AI" — cùng shape với payload app/api/ai-assist-chat mong đợi. */
type ChatTurn = { role: 'user' | 'assistant'; content: string };

export function ProjectSelect({ onEnter }: { onEnter: () => void }) {
  const user = useFlowStore((s) => s.user);
  const openDashboardTab = useFlowStore((s) => s.openDashboardTab);
  const reduce = useReducedMotion();
  // Tab ẩn → dừng quầng sáng lặp vô hạn (xem lib/usePageVisible.ts).
  const visible = usePageVisible();
  const lang = useLang();
  const en = lang === 'en';

  /* ---------- Larkbase (M1) — best-effort, KHÔNG chặn/làm chậm Gallery ---------- */
  const larkSummary = useLarkSummary();
  const [larkConfigured, setLarkConfigured] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/integrations/lark/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setLarkConfigured(!!j?.configured))
      .catch(() => setLarkConfigured(false));
  }, []);

  const runLarkSync = useCallback(async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/lark-tasks/sync', { method: 'POST' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSyncMsg(typeof j?.error === 'string' ? j.error : (en ? 'Sync failed.' : 'Đồng bộ thất bại.'));
        return;
      }
      setSyncMsg(
        en
          ? `Synced ${j.taskCount ?? 0} tasks, ${j.personCount ?? 0} people.`
          : `Đã đồng bộ ${j.taskCount ?? 0} công việc, ${j.personCount ?? 0} nhân sự.`,
      );
    } catch {
      setSyncMsg(en ? 'Sync failed — check connection.' : 'Đồng bộ thất bại — kiểm tra kết nối.');
    } finally {
      setSyncing(false);
    }
  }, [en]);

  const [flows, setFlows] = useState<FlowRow[] | null>(null); // null = đang tải
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false); // đang mở/tạo flow
  const [openError, setOpenError] = useState<string | null>(null);

  // Đổi bìa
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [libThumbs, setLibThumbs] = useState<string[] | null>(null);
  // Upload bìa trực tiếp (J-4a)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Sửa status
  const [statusFor, setStatusFor] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState('');
  // Grid + tìm kiếm khi >8 dự án (J-4c)
  const [query, setQuery] = useState('');
  const [projFilter, setProjFilter] = useState<string>(''); // '' = tất cả, '__none__' = chưa gắn dự án
  // Liên kết Larkbase TUỲ CHỌN lúc "+ Dự án mới" (§2.4/§2.6 M1) — chọn TRƯỚC khi bấm tạo,
  // KHÔNG chèn dialog chắn luồng 1-click hiện có (mặc định '' = "Chưa liên kết", hành vi hôm
  // nay giữ nguyên y hệt nếu bỏ qua bước này).
  const [pendingLarkCode, setPendingLarkCode] = useState<string>('');

  /* ---------- Vitals AI (chat 1-người-với-AI, KHÁC "Chat nhóm" người-với-người) ----------
   * Spec Vitals AI: khung chat LUÔN HIỆN — 1 thanh nhập mảnh nền trong suốt đặt PHÍA TRÊN các
   * thẻ dự án (không phải nút nổi góc màn), placeholder động xoay vòng mô tả khả năng; panel
   * hội thoại chỉ bung ra sau tin nhắn đầu tiên (thu gọn được, lịch sử giữ trong state).
   * v1: KHÔNG lưu DB — lịch sử chỉ sống trong state này, mất khi reload (chấp nhận được,
   * đơn giản hoá). Mỗi lần gửi, POST kèm TOÀN BỘ lịch sử ngắn tới app/api/ai-assist-chat. */
  const [chatMessages, setChatMessages] = useState<ChatTurn[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<{ message: string; code?: string } | null>(null);
  const [chatCollapsed, setChatCollapsed] = useState(false); // thu gọn panel, giữ lịch sử
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Placeholder động xoay vòng — mô tả khả năng của Vitals khi ô nhập còn trống.
  const vitalsHints = useMemo(
    () =>
      en
        ? [
            'Ask Vitals — materials & interior style advice…',
            'How do Drafting CAD · Rendering · Presenting work?',
            'Quiet-luxury layout ideas for your space…',
          ]
        : [
            'Hỏi Vitals — tư vấn vật liệu, phong cách nội thất…',
            'Cách dùng Drafting CAD · Rendering · Presenting?',
            'Gợi ý bố cục quiet-luxury cho không gian của bạn…',
          ],
    [en],
  );
  const [hintIdx, setHintIdx] = useState(0);
  useEffect(() => {
    if (chatInput) return; // đang gõ thì đứng yên
    const t = setInterval(() => setHintIdx((i) => i + 1), 3600);
    return () => clearInterval(t);
  }, [chatInput]);

  const chatThreadShown = !chatCollapsed && (chatMessages.length > 0 || chatSending || !!chatError);

  useEffect(() => {
    if (!chatThreadShown) return;
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatThreadShown, chatMessages, chatSending]);

  // Esc → thu gọn overlay hội thoại (cùng bộ với bấm ra ngoài / nút X).
  useEffect(() => {
    if (!chatThreadShown) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setChatCollapsed(true);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [chatThreadShown]);

  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatSending) return;
    const next: ChatTurn[] = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(next);
    setChatInput('');
    setChatSending(true);
    setChatError(null);
    setChatCollapsed(false); // gửi tin mới → panel bung lại nếu đang thu gọn
    try {
      const res = await fetch('/api/ai-assist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setChatError({
          message:
            typeof j?.error === 'string'
              ? j.error
              : en
                ? 'Something went wrong — try again.'
                : 'Có lỗi xảy ra — thử lại.',
          code: typeof j?.code === 'string' ? j.code : undefined,
        });
        return;
      }
      setChatMessages((prev) => [...prev, { role: 'assistant', content: String(j?.reply ?? '').trim() }]);
    } catch {
      setChatError({
        message: en ? 'Connection failed — try again.' : 'Mất kết nối — thử lại.',
      });
    } finally {
      setChatSending(false);
    }
  }, [chatInput, chatSending, chatMessages, en]);

  const load = useCallback(() => {
    setLoadError(false);
    setFlows(null);
    loadProjectCards()
      .then((r) => {
        setFlows(r.flows);
        setTeam(r.team);
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

  /* ---------- J-4c: >8 dự án thì carousel hết vừa → grid + tìm kiếm/lọc; ≤8 giữ carousel ---------- */

  const manyMode = (flows?.length ?? 0) > 8;

  /* ---------- Ambient cover glow (tvOS-style) — nền trang "lan toả" theo ảnh bìa card đang focus ----------
   * Chỉ có ý nghĩa ở carousel 3D (desktop, ≤8 flow, không reduce-motion) — đây là NƠI DUY NHẤT có khái
   * niệm "1 card đang focus" (`active`). Grid tìm kiếm (manyMode) và danh sách phẳng (mobile/reduce) không
   * có khái niệm đó → không ép ambient vào, giữ nền tĩnh var(--bg) như cũ (đúng gợi ý trong brief).
   * Card "+ Dự án mới" không có ảnh bìa → GIỮ NGUYÊN ambient của flow gần nhất thay vì tắt đột ngột,
   * tránh nền chớp tắt khi user lướt hết carousel sang card cuối.
   */
  const [ambientSrc, setAmbientSrc] = useState<string | null>(null);
  useEffect(() => {
    const focused = items[active];
    if (focused && focused.kind === 'flow') setAmbientSrc(coverOf(focused.flow));
  }, [active, items]);
  const showAmbient = !loadError && flows !== null && !manyMode && !reduce;

  const projOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of flows ?? []) if (f.project) map.set(f.project.id, f.project.name);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [flows]);

  const filteredFlows = useMemo(() => {
    if (!flows) return [];
    const q = query.trim().toLowerCase();
    return flows.filter((f) => {
      if (projFilter === '__none__' && f.project) return false;
      if (projFilter && projFilter !== '__none__' && f.project?.id !== projFilter) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        (f.status ?? '').toLowerCase().includes(q) ||
        (f.project?.name ?? '').toLowerCase().includes(q)
      );
    });
  }, [flows, query, projFilter]);

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
        // Liên kết Larkbase TUỲ CHỌN (§2.4/§2.6) — chỉ chạy khi user đã CHỌN 1 mã trước khi
        // bấm tạo (pendingLarkCode !== ''); bỏ qua hoàn toàn (giữ hành vi hôm nay) nếu để trống.
        if (item.kind === 'new' && pendingLarkCode) {
          const codeInfo = larkSummary?.distinctCodes.find((c) => c.code === pendingLarkCode);
          const project = await createProject(codeInfo?.name ?? `Dự án ${pendingLarkCode}`, pendingLarkCode).catch(() => null);
          if (project?.id) await assignProject(id, project.id).catch(() => {});
          setPendingLarkCode('');
        }
        await openFlow(id); // nạp graph vào store + set currentFlowId
        applyCadHandoff(); // bản vẽ CAD chờ handoff (nếu có) — consume sau khi graph nạp
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
    [busy, en, onEnter, pendingLarkCode, larkSummary],
  );

  /* ---------- Đổi bìa: mở picker + PUT optimistic ---------- */

  const openPicker = useCallback(
    (id: string) => {
      setPickerFor(id);
      if (libThumbs === null) {
        fetch('/api/library')
          .then((r) => (r.ok ? r.json() : { assets: [] }))
          .then((j) => {
            const urls: string[] = Array.isArray(j?.assets)
              ? j.assets
                  .map((a: { url?: unknown }) => (typeof a?.url === 'string' ? a.url : null))
                  .filter((u: string | null): u is string => !!u)
                  .slice(0, 30)
              : [];
            setLibThumbs(urls);
          })
          .catch(() => setLibThumbs([]));
      }
    },
    [libThumbs],
  );

  const setCover = useCallback(async (id: string, url: string) => {
    setFlows((prev) => (prev ? prev.map((f) => (f.id === id ? { ...f, coverUrl: url } : f)) : prev));
    setPickerFor(null);
    try {
      await fetch(`/api/flows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverUrl: url }),
      });
    } catch {
      /* optimistic — im lặng nếu lỗi mạng, không crash màn */
    }
  }, []);

  /**
   * Upload ảnh bìa TRỰC TIẾP (J-4a): file → dataURL → POST /api/library (tái dùng đường
   * upload thư viện sẵn có, tags 'cover' để tìm lại được) → nhận url → set làm bìa luôn.
   */
  const uploadCover = useCallback(
    async (file: File) => {
      if (!pickerFor) return;
      if (!file.type.startsWith('image/')) {
        setUploadError(en ? 'Please pick an image file.' : 'Hãy chọn một file ảnh.');
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(en ? 'Image over 25MB.' : 'Ảnh quá 25MB.');
        return;
      }
      setUploading(true);
      setUploadError(null);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = () => reject(new Error('read'));
          r.readAsDataURL(file);
        });
        const res = await fetch('/api/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name || 'Ảnh bìa',
            category: 'Ref nội thất',
            tags: 'cover',
            dataUrl,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || typeof j?.url !== 'string') {
          throw new Error(typeof j?.error === 'string' ? j.error : 'upload');
        }
        setLibThumbs((prev) => (prev ? [j.url, ...prev] : [j.url])); // thấy ngay trong "Từ thư viện"
        await setCover(pickerFor, j.url); // đóng picker + PUT coverUrl (optimistic)
      } catch {
        setUploadError(en ? 'Upload failed — try again.' : 'Không tải được ảnh lên — thử lại.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // chọn lại cùng file vẫn ăn
      }
    },
    [pickerFor, en, setCover],
  );

  /* ---------- Status: mở input + PUT optimistic ---------- */

  const beginStatus = useCallback((f: FlowRow) => {
    setStatusFor(f.id);
    setStatusDraft(f.status ?? '');
  }, []);

  const saveStatus = useCallback(
    async (id: string) => {
      const value = statusDraft.trim().slice(0, 160);
      setFlows((prev) => (prev ? prev.map((f) => (f.id === id ? { ...f, status: value } : f)) : prev));
      setStatusFor(null);
      try {
        await fetch(`/api/flows/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: value }),
        });
      } catch {
        /* optimistic — im lặng */
      }
    },
    [statusDraft],
  );

  // Phím ← → điều hướng, Enter mở card đang focus. Khoá khi đang sửa status/mở picker.
  // Grid-mode (>8 dự án) không có carousel → nhường phím cho ô tìm kiếm.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy || n === 0 || statusFor || pickerFor || manyMode) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActive((a) => Math.min(n - 1, a + 1));
      } else if (e.key === 'Enter') {
        // Guard: card gallery KHÔNG dùng focus DOM thật (tabIndex=-1) — "đang chọn" là
        // state `active`, không phải document.activeElement. Nhưng các nút khác quanh
        // gallery (‹ ›, Đổi bìa, Thử lại, đổi ngôn ngữ...) LÀ <button> focus được thật —
        // Enter trên chúng đã có hành vi riêng (click nút đó) → KHÔNG được double-fire
        // choose() ở đây, kẻo mở nhầm dự án đang active cùng lúc. Chỉ cho global Enter
        // chạy khi focus không nằm trên 1 control tương tác khác.
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const isOtherControl =
          !!tag && ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
        // Guard bổ sung 21/07: khi input Vitals bị disabled (chatSending) focus rơi về body →
        // Enter kế tiếp lọt qua isOtherControl. Chặn nếu bất kỳ tổ tiên nào là khu chat Vitals.
        const inVitalsChat = !!target?.closest?.('[data-vitals-chat]');
        if (isOtherControl || inVitalsChat || target?.isContentEditable || e.defaultPrevented) return;
        e.preventDefault();
        void choose(items[active]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, n, active, items, choose, statusFor, pickerFor, manyMode]);

  const step = (dir: 1 | -1) => setActive((a) => Math.min(n - 1, Math.max(0, a + dir)));

  const firstName = user?.name?.split(' ').slice(-1)[0] ?? null;

  const cardTransition = reduce
    ? { duration: 0 }
    : {
        default: springStage,
        opacity: { duration: 0.55, ease: easeApple },
        filter: { duration: 0.55, ease: easeApple },
      };

  /* ---------- Icon thành viên trên card (dùng chung gallery + list phẳng + grid) ----------
   * Dữ liệu ĐANG CÓ: Flow chỉ có userId (owner) — KHÔNG có bảng membership per-flow.
   * → mỗi card hiện OWNER (map qua roster team để lấy online); thiếu dữ liệu roster
   * thì fallback user đang đăng nhập (flow trả về từ /api/flows luôn là của mình). */

  const membersOf = useCallback(
    (f: FlowRow): TeamMember[] => {
      const owner = f.userId ? team.find((m) => m.id === f.userId) : undefined;
      if (owner) return [owner];
      if (user) return [{ id: user.id, name: user.name, online: true }];
      return [];
    },
    [team, user],
  );

  /**
   * Tooltip avatar owner — nối thêm Chức danh/Phòng ban Larkbase nếu đối chiếu được qua
   * LarkUserMap (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §2.2(a) bullet 3). Không tìm được
   * (chưa sync/chưa gán ánh xạ) → giữ NGUYÊN tooltip cũ, không lỗi (best-effort đúng brief).
   */
  const larkTitleSuffix = useCallback(
    (userId: string): string => {
      if (!larkSummary) return '';
      const account = larkSummary.mapByUser.get(userId);
      if (!account) return '';
      const person = larkSummary.personByAccount.get(account);
      if (!person) return '';
      const bits = [person.title, person.department].filter(Boolean);
      return bits.length ? ` · ${bits.join(' · ')}` : '';
    },
    [larkSummary],
  );

  const avatarRow = (members: TeamMember[], opts?: { light?: boolean; ownerId?: string }) => {
    if (members.length === 0) return null;
    const ring = opts?.light ? 'rgba(0,0,0,0.12)' : 'rgba(20,18,16,0.9)';
    const ownerSuffix = en ? ' · owner' : ' · chủ dự án';
    return (
      <div className="flex items-center">
        {members.slice(0, 7).map((m, idx) => (
          <span
            key={m.id}
            title={`${m.name}${opts?.ownerId && m.id === opts.ownerId ? ownerSuffix : ''}${larkTitleSuffix(m.id)}`}
            className="relative grid shrink-0 place-items-center rounded-full"
            style={{
              width: 28,
              height: 28,
              marginLeft: idx === 0 ? 0 : -8,
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 600,
              color: '#fff',
              background: avatarGradient(m.name),
              border: `1.5px solid ${ring}`,
              filter: m.online ? undefined : 'grayscale(1)',
              opacity: m.online ? 1 : 0.55,
              zIndex: members.length - idx,
            }}
          >
            {initialOf(m.name)}
            {m.online && (
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                style={{ background: '#38d66b', border: `1.5px solid ${ring}` }}
              />
            )}
          </span>
        ))}
      </div>
    );
  };

  /* ---------- Caption card (gallery) — tên + status + Đổi bìa + memoji ---------- */

  const flowCaption = (f: FlowRow, isCenter: boolean, plan: ContrastPlan) => {
    const editing = statusFor === f.id;
    const strong = adaptiveTextStyle(plan);
    return (
      <>
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-[15px] font-semibold leading-tight sm:text-[17px]"
              style={{ fontFamily: SANS, ...strong }}
            >
              {f.name}
            </div>

            {/* dòng status — bấm để sửa (chỉ card focus) */}
            {editing ? (
              <div
                className="mt-1.5 flex items-center gap-1.5 rounded-full px-2 py-1"
                style={darkPill}
                onClick={(e) => e.stopPropagation()}
              >
                {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                <input
                  autoFocus
                  value={statusDraft}
                  maxLength={160}
                  onChange={(e) => setStatusDraft(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') void saveStatus(f.id);
                    else if (e.key === 'Escape') setStatusFor(null);
                  }}
                  placeholder={en ? 'Short status…' : 'Ghi chú ngắn…'}
                  className="w-full bg-transparent text-[12px] text-white placeholder:text-white/40 focus:outline-none"
                  style={{ fontFamily: SANS }}
                />
                <button
                  type="button"
                  aria-label={en ? 'Save' : 'Lưu'}
                  onClick={() => void saveStatus(f.id)}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-white/85 hover:text-white"
                >
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  aria-label={en ? 'Cancel' : 'Huỷ'}
                  onClick={() => setStatusFor(null)}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-white/60 hover:text-white/90"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!isCenter}
                onClick={(e) => {
                  e.stopPropagation();
                  beginStatus(f);
                }}
                className="mt-1 block max-w-full truncate text-left text-[12px] transition-colors disabled:cursor-default"
                style={{
                  fontFamily: SANS,
                  ...adaptiveTextStyle(plan, true),
                  opacity: f.status ? 1 : 0.62,
                }}
              >
                {f.status ? f.status : en ? '· No note yet' : '· Chưa có ghi chú'}
              </button>
            )}

            <div className="mt-1.5 flex items-center gap-2">
              <span
                className="truncate text-[11px]"
                style={{ fontFamily: SANS, ...adaptiveTextStyle(plan, true), opacity: 0.78 }}
              >
                {f.project ? f.project.name : en ? 'No project' : 'Chưa gắn dự án'}
              </span>
              {/* Pill "Cảnh báo" Larkbase — CHỈ hiện nếu Project đã gán larkProjectCode VÀ đã
                  đồng bộ có dữ liệu; hiện NGUYÊN chuỗi Larkbase đã tính sẵn, không tự suy diễn
                  (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §2.2(a)/§2.1). */}
              {f.project?.larkProjectCode && larkSummary?.byCode.get(f.project.larkProjectCode) && (
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px]"
                  style={{ ...adaptiveTextStyle(plan, true), background: 'rgba(240,96,32,0.16)', border: '1px solid rgba(240,96,32,0.32)' }}
                >
                  {larkSummary.byCode.get(f.project.larkProjectCode)}
                </span>
              )}
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.14em]"
                style={{
                  ...adaptiveTextStyle(plan, true),
                  background: plan.tone === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(20,17,13,0.08)',
                  border: `1px solid ${plan.tone === 'light' ? 'rgba(255,255,255,0.14)' : 'rgba(20,17,13,0.16)'}`,
                }}
              >
                {timeAgo(f.updatedAt, en)}
              </span>
            </div>
          </div>

          {/* nút Đổi bìa + Chi tiết — chỉ card focus */}
          {isCenter && (
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openPicker(f.id);
                }}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-white/90 hover:text-white"
                style={darkPill}
              >
                <ImagePlus size={13} />
                {en ? 'Cover' : 'Đổi bìa'}
              </button>
              {/* "Chi tiết" — mở panel Dashboard, lọc sẵn theo project của card này (§2.2(b)) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openDashboardTab('board', f.project?.id ?? null);
                }}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-white/90 hover:text-white"
                style={darkPill}
              >
                <Info size={13} />
                {en ? 'Details' : 'Chi tiết'}
              </button>
            </div>
          )}
        </div>

        {/* icon thành viên (owner từ dữ liệu đang có) — góc dưới card */}
        <div className="mt-2.5">{avatarRow(membersOf(f), { ownerId: f.userId })}</div>
      </>
    );
  };

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
    // data-tour: neo highlight cho SmartTour (B-5) — đổi/xoá thì tour tự fallback card giữa màn
    <div className="relative w-full" data-tour="project-gallery">
      <div className="grid place-items-center px-4" style={{ perspective: 1400 }}>
        <div className="relative grid place-items-center" style={{ transformStyle: 'preserve-3d' }}>
          {items.map((item, i) => {
            const off = i - active;
            const shown = Math.abs(off) <= 2;
            const pose = shown ? POSES[off] : hiddenPose(off < 0 ? -1 : 1);
            const isCenter = off === 0;
            const key = item.kind === 'flow' ? item.flow.id : '__new__';
            return (
              <motion.div
                key={key}
                role="button"
                // roving tabindex: chỉ card ĐANG ACTIVE (giữa) tới được bằng Tab — các card
                // khác giữ -1. Khi `active` đổi (mũi tên/click), card mới trở thành tabIndex=0
                // nên người dùng chỉ biết Tab (không biết ← →) vẫn vào được gallery.
                tabIndex={isCenter ? 0 : -1}
                aria-label={item.kind === 'flow' ? item.flow.name : en ? 'New project' : 'Dự án mới'}
                onClick={() => {
                  if (busy) return;
                  // Card giữa → mở luôn (giữ nguyên). Card "+ Dự án mới" → tạo+mở ngay dù đang ở
                  // rìa (KHÔNG bắt bấm lần 1 để focus rồi lần 2 mới vào — đó là lỗi "bấm 2 lần").
                  // Card dự án ở rìa vẫn chỉ FOCUS (giữ luồng duyệt gallery + đúng gợi ý dưới màn).
                  if (isCenter || item.kind === 'new') void choose(item);
                  else setActive(i);
                }}
                className="col-start-1 row-start-1 cursor-pointer overflow-hidden text-left"
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
                      src={coverOf(item.flow)}
                      alt=""
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                    {/* caption kính — rõ ở card trung tâm (gu TitleSequence).
                        Tông chữ/sương do AdaptiveCaption đo từ chính ảnh bìa card này. */}
                    <AdaptiveCaption
                      src={coverOf(item.flow)}
                      isCenter={isCenter}
                      reduce={!!reduce}
                      render={(plan) => flowCaption(item.flow, isCenter, plan)}
                    />
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
                      {/* Liên kết Larkbase TUỲ CHỌN (§2.4/§2.6 M1) — chỉ hiện khi có mã đã
                          sync + card đang focus; chọn xong bấm card như bình thường để tạo.
                          stopPropagation để không kích hoạt choose() khi thao tác dropdown. */}
                      {isCenter && !!larkSummary?.distinctCodes.length && (
                        <div onClick={(e) => e.stopPropagation()} className="mt-1">
                          <select
                            value={pendingLarkCode}
                            onChange={(e) => setPendingLarkCode(e.target.value)}
                            className="cursor-pointer appearance-none rounded-full border border-[rgba(127,127,127,0.35)] bg-transparent px-2.5 py-1 text-[10px]"
                            style={{ fontFamily: SANS, color: pendingLarkCode ? COPPER : 'var(--t4)' }}
                            title={en ? 'Optionally link a Larkbase project code' : 'Tuỳ chọn liên kết mã dự án Larkbase'}
                          >
                            <option value="">{en ? 'Link Larkbase (optional)' : 'Liên kết Larkbase (tuỳ chọn)'}</option>
                            {larkSummary.distinctCodes.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} · {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
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
            className="h-[5px] rounded-full transition-[width,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
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
    <div className="max-h-[62vh] w-full max-w-md overflow-y-auto px-1 py-1" data-tour="project-gallery">
      <div className="grid gap-3">
        {items.map((item) => {
          const key = item.kind === 'flow' ? item.flow.id : '__new__';
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              aria-disabled={busy}
              onClick={() => {
                if (!busy) void choose(item);
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !busy) {
                  e.preventDefault();
                  void choose(item);
                }
              }}
              className="flex w-full cursor-pointer items-center gap-3.5 p-3 text-left transition-opacity"
              style={{
                ...glass,
                borderRadius: 'var(--radius-xl)',
                border: item.kind === 'new' ? '1.5px dashed rgba(127,127,127,0.4)' : (glass.border as string),
                opacity: busy ? 0.6 : 1,
              }}
            >
              {item.kind === 'flow' ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverOf(item.flow)}
                    alt=""
                    draggable={false}
                    className="h-14 w-[74px] shrink-0 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-[var(--t1)]" style={{ fontFamily: SANS }}>
                      {item.flow.name}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11px]"
                      style={{
                        fontFamily: SANS,
                        color: item.flow.status ? 'var(--t3,var(--t4))' : 'var(--t5,var(--t4))',
                      }}
                    >
                      {item.flow.status ? item.flow.status : en ? '· No note yet' : '· Chưa có ghi chú'}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--t4)]" style={{ fontFamily: SANS }}>
                      {item.flow.project ? `${item.flow.project.name} · ` : ''}
                      {timeAgo(item.flow.updatedAt, en)}
                    </span>
                    {membersOf(item.flow).length > 0 && (
                      <span className="mt-1.5 block">
                        {avatarRow(membersOf(item.flow), { light: true, ownerId: item.flow.userId })}
                      </span>
                    )}
                  </span>
                  <ArrowRight size={15} className="shrink-0 self-center text-[var(--t4)]" />
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
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ---------- Grid + tìm kiếm/lọc (J-4c — khi >8 dự án, mọi khổ màn hình) ---------- */

  const searchGrid = flows && (
    <div className="w-full" data-tour="project-gallery">
      {/* thanh tìm kiếm + lọc theo dự án */}
      <div className="mb-5 flex flex-wrap items-center justify-center gap-2.5">
        <div className="flex items-center gap-2 rounded-full px-3.5 py-2" style={glass}>
          <Search size={14} className="shrink-0 text-[var(--t4)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={en ? 'Search name, note, project…' : 'Tìm tên, ghi chú, dự án…'}
            className="w-48 bg-transparent text-[13px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none sm:w-56"
            style={{ fontFamily: SANS }}
          />
          {query && (
            <button
              type="button"
              aria-label={en ? 'Clear search' : 'Xoá tìm kiếm'}
              onClick={() => setQuery('')}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[var(--t4)] hover:text-[var(--t1)]"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <select
          value={projFilter}
          onChange={(e) => setProjFilter(e.target.value)}
          aria-label={en ? 'Filter by project' : 'Lọc theo dự án'}
          className="cursor-pointer appearance-none rounded-full px-3.5 py-2 text-[12px] text-[var(--t1)] focus:outline-none"
          style={{ ...glass, fontFamily: SANS }}
        >
          <option value="">{en ? 'All projects' : 'Tất cả dự án'}</option>
          <option value="__none__">{en ? 'No project' : 'Chưa gắn dự án'}</option>
          {projOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-[var(--t4)]" style={{ fontFamily: MONO }}>
          {filteredFlows.length}/{flows.length}
        </span>
      </div>

      <div className="grid max-h-[56vh] grid-cols-2 gap-4 overflow-y-auto px-1 pb-2 sm:grid-cols-3 lg:grid-cols-4">
        {/* tile "+ Dự án mới" luôn đứng đầu — không lệ thuộc filter */}
        <div
          role="button"
          tabIndex={0}
          aria-disabled={busy}
          onClick={() => {
            if (!busy) void choose({ kind: 'new' });
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !busy) {
              e.preventDefault();
              void choose({ kind: 'new' });
            }
          }}
          className="grid cursor-pointer place-items-center"
          style={{
            aspectRatio: '4 / 4.1',
            borderRadius: 'var(--radius-xl)',
            border: `1.5px dashed ${COPPER}88`,
            background: 'rgba(127,127,127,0.06)',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <div className="flex flex-col items-center gap-2 px-3 text-center">
            <span
              className="grid h-10 w-10 place-items-center rounded-full"
              style={{ border: `1.5px dashed ${COPPER}`, color: COPPER }}
            >
              <Plus size={17} />
            </span>
            <span className="text-[13px] font-semibold text-[var(--t1)]" style={{ fontFamily: SANS }}>
              {en ? 'New project' : 'Dự án mới'}
            </span>
          </div>
        </div>

        {filteredFlows.map((f) => {
          const editing = statusFor === f.id;
          return (
            <div
              key={f.id}
              role="button"
              tabIndex={0}
              aria-disabled={busy}
              aria-label={f.name}
              onClick={() => {
                if (!busy) void choose({ kind: 'flow', flow: f });
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !busy && !editing) {
                  e.preventDefault();
                  void choose({ kind: 'flow', flow: f });
                }
              }}
              className="group cursor-pointer overflow-hidden text-left"
              style={{
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(127,127,127,0.25)',
                background: '#141210',
                boxShadow: '0 18px 44px -20px rgba(0,0,0,0.55)',
                opacity: busy ? 0.6 : 1,
              }}
            >
              <div className="relative" style={{ aspectRatio: '4 / 3' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverOf(f)} alt="" draggable={false} className="h-full w-full object-cover" />
                {/* Đổi bìa + Chi tiết — hiện khi hover card (desktop) / luôn chạm được trên touch */}
                <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label={en ? 'Change cover' : 'Đổi bìa'}
                    onClick={(e) => {
                      e.stopPropagation();
                      openPicker(f.id);
                    }}
                    className="grid h-7 w-7 place-items-center rounded-full text-white/90 hover:text-white"
                    style={darkPill}
                  >
                    <ImagePlus size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label={en ? 'Details' : 'Chi tiết'}
                    onClick={(e) => {
                      e.stopPropagation();
                      openDashboardTab('board', f.project?.id ?? null);
                    }}
                    className="grid h-7 w-7 place-items-center rounded-full text-white/90 hover:text-white"
                    style={darkPill}
                  >
                    <Info size={13} />
                  </button>
                </div>
              </div>
              <div className="px-3 pb-2.5 pt-2">
                <div className="truncate text-[13px] font-semibold text-white" style={{ fontFamily: SANS }}>
                  {f.name}
                </div>
                {editing ? (
                  <div
                    className="mt-1 flex items-center gap-1.5 rounded-full px-2 py-1"
                    style={darkPill}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                    <input
                      autoFocus
                      value={statusDraft}
                      maxLength={160}
                      onChange={(e) => setStatusDraft(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') void saveStatus(f.id);
                        else if (e.key === 'Escape') setStatusFor(null);
                      }}
                      placeholder={en ? 'Short status…' : 'Ghi chú ngắn…'}
                      className="w-full bg-transparent text-[11px] text-white placeholder:text-white/40 focus:outline-none"
                      style={{ fontFamily: SANS }}
                    />
                    <button
                      type="button"
                      aria-label={en ? 'Save' : 'Lưu'}
                      onClick={() => void saveStatus(f.id)}
                      className="grid h-5 w-5 shrink-0 place-items-center text-white/85 hover:text-white"
                    >
                      <Check size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      beginStatus(f);
                    }}
                    className="mt-0.5 block max-w-full truncate text-left text-[11px]"
                    style={{
                      fontFamily: SANS,
                      color: f.status ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {f.status ? f.status : en ? '· No note yet' : '· Chưa có ghi chú'}
                  </button>
                )}
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[10px] text-white/50" style={{ fontFamily: SANS }}>
                    {f.project ? f.project.name : timeAgo(f.updatedAt, en)}
                  </span>
                  {avatarRow(membersOf(f), { ownerId: f.userId })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFlows.length === 0 && (
        <p className="mt-4 text-center text-[12px] text-[var(--t4)]" style={{ fontFamily: SANS }}>
          {en ? 'No project matches the search.' : 'Không có dự án nào khớp tìm kiếm.'}
        </p>
      )}
    </div>
  );

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6"
      style={{ background: 'var(--bg)' }}
    >
      {/* Ambient cover glow — LỚP DƯỚI CÙNG (z thấp nhất), đặt TRƯỚC quầng đồng để không đè lên nó.
          Ảnh bìa card đang focus, blur rất mạnh + tối đi, crossfade mượt khi đổi card (gu tvOS). */}
      {showAmbient && ambientSrc && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={ambientSrc}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: easeApple }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ambientSrc}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
                style={{
                  transform: 'scale(1.2)',
                  filter: 'blur(80px) saturate(120%) brightness(0.5)',
                }}
              />
              {/* phủ tối thêm — giữ đúng gu quiet-luxury tối, không chói, không giảm tương phản chữ
                  (chữ/card nằm ở lớp z cao hơn nhiều, không đứng trên lớp này). */}
              <div className="absolute inset-0" style={{ background: 'rgba(8,7,5,0.55)' }} />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

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
          animate={reduce || !visible ? { opacity: 0.1 } : { opacity: [0.08, 0.13, 0.08], x: [0, 24, 0] }}
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

          {/* "Chi tiết" (toàn bộ, không lọc) + "Đồng bộ tiến độ" — 2 điểm neo cố định đầu
              Gallery (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §2.2(b)/§2.5). Nút Đồng bộ
              disabled + tooltip rõ khi Lark chưa cấu hình (health-check qua registry, KHÔNG
              throw lỗi khó hiểu — đúng pattern các integration khác đã có). */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => openDashboardTab('board', null)}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium text-[var(--t2)] transition-colors hover:text-[var(--t1)]"
              style={glass}
            >
              <Info size={13} />
              {en ? 'Details' : 'Chi tiết'}
            </button>
            <button
              type="button"
              onClick={runLarkSync}
              disabled={syncing || larkConfigured === false}
              title={
                larkConfigured === false
                  ? en
                    ? 'Lark not configured — LARK_APP_ID/LARK_APP_SECRET/LARK_BASE_APP_TOKEN missing. See docs/INTEGRATIONS.md.'
                    : 'Chưa cấu hình Lark — thiếu LARK_APP_ID/LARK_APP_SECRET/LARK_BASE_APP_TOKEN. Xem docs/INTEGRATIONS.md.'
                  : undefined
              }
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium text-[var(--t2)] transition-colors hover:text-[var(--t1)] disabled:cursor-not-allowed disabled:opacity-45"
              style={glass}
            >
              {syncing ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
              {en ? 'Sync progress' : 'Đồng bộ tiến độ'}
            </button>
          </div>
          {syncMsg && (
            <p className="mt-2 text-[11px] text-[var(--t4)]" style={{ fontFamily: SANS }}>
              {syncMsg}
            </p>
          )}
        </div>

        {/* ---------- Vitals AI — thanh chat LUÔN HIỆN phía trên thẻ dự án ----------
            KHÁC "Chat nhóm" (Header, người-với-người). Nền trong suốt (chỉ hairline + blur),
            placeholder xoay vòng mô tả khả năng. Vùng tin nhắn khi nở ra là OVERLAY kính lỏng
            (.lq-card) ĐÈ LÊN card — KHÔNG chèn vào flow đẩy card xuống (spec bổ sung). */}
        <div className="relative mb-7 w-full max-w-xl" data-vitals-chat="">
          <div
            className="flex items-center gap-2.5 rounded-full py-2 pl-4 pr-2"
            style={{
              background: 'transparent',
              border: '1px solid rgba(127,127,127,0.32)',
              backdropFilter: 'blur(var(--blur-strong)) saturate(150%)',
              WebkitBackdropFilter: 'blur(var(--blur-strong)) saturate(150%)',
            }}
          >
            <VitalsIcon size={15} className="shrink-0" style={{ color: COPPER }} />
            <span
              className="shrink-0 text-[9px] uppercase text-[var(--t4)]"
              style={{ fontFamily: MONO, letterSpacing: '0.22em' }}
            >
              Vitals AI
            </span>
            <div className="relative min-w-0 flex-1">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  // stopPropagation: KHÔNG cho ← → / Enter lọt xuống listener điều hướng
                  // gallery toàn cục (đúng pattern input status đã có).
                  // stopImmediatePropagation trên nativeEvent: chặn LUÔN native
                  // window.addEventListener('keydown') — React synthetic stopPropagation
                  // KHÔNG chặn được window listener (React 17+ delegate ở root, không phải window).
                  // Nếu không có, Enter → sendChat + choose(items[active]) cùng lúc → "vào chặng
                  // trước khi Vitals trả lời".
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void sendChat();
                  }
                }}
                disabled={chatSending}
                aria-label="Vitals AI"
                placeholder=""
                className="w-full bg-transparent text-[13px] text-[var(--t1)] focus:outline-none disabled:opacity-60"
                style={{ fontFamily: SANS }}
              />
              {/* placeholder động xoay vòng — chỉ hiện khi ô trống */}
              {chatInput === '' && (
                <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden" aria-hidden>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={hintIdx % vitalsHints.length}
                      initial={{ opacity: 0, y: reduce ? 0 : 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduce ? 0 : -7 }}
                      transition={{ duration: reduce ? 0 : 0.35, ease: easeApple }}
                      className="truncate text-[13px] text-[var(--t4)]"
                      style={{ fontFamily: SANS }}
                    >
                      {vitalsHints[hintIdx % vitalsHints.length]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label={en ? 'Send to Vitals' : 'Gửi cho Vitals'}
              onClick={() => void sendChat()}
              disabled={chatSending || !chatInput.trim()}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#1c1409] transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
              style={{ background: COPPER }}
            >
              {chatSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>

          {/* panel hội thoại — chỉ bung sau tin nhắn đầu tiên; thu gọn giữ lịch sử.
              OVERLAY tuyệt đối neo dưới thanh nhập, ĐÈ LÊN card (không reflow layout khi
              mở/đóng). Kính lỏng .lq-card (globals.css, đợt login-glass) + backdrop mờ nhẹ
              phía sau để card lu mờ dịu, bấm ra ngoài / X / Esc để thu gọn.
              z: backdrop z-20 < panel z-30 < Dashboard overlay z-50 (Chi tiết mở thì
              Dashboard tự phủ lên — không tranh chấp). */}
          <AnimatePresence initial={false}>
            {chatThreadShown && (
              <motion.div
                key="vitals-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.3, ease: easeApple }}
                className="fixed inset-0 z-20"
                style={{ background: 'rgba(10,8,6,0.2)' }}
                onClick={() => setChatCollapsed(true)}
                aria-hidden
              />
            )}
            {chatThreadShown && (
              <motion.div
                key="vitals-thread"
                initial={{ opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: reduce ? 0 : 6, scale: reduce ? 1 : 0.99 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: easeApple }}
                className="absolute left-0 right-0 top-full z-30 mt-3"
              >
                <div className="lq-card overflow-hidden rounded-[var(--radius-xl)]">
                  <div className="flex items-center justify-between border-b border-[rgba(127,127,127,0.2)] px-4 py-2">
                    <span
                      className="text-[9px] uppercase text-[var(--t4)]"
                      style={{ fontFamily: MONO, letterSpacing: '0.22em' }}
                    >
                      {en ? 'Vitals · conversation' : 'Vitals · hội thoại'}
                    </span>
                    <button
                      type="button"
                      aria-label={en ? 'Collapse' : 'Thu gọn'}
                      onClick={() => setChatCollapsed(true)}
                      className="grid h-6 w-6 place-items-center rounded-full text-[var(--t4)] hover:text-[var(--t1)]"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div ref={chatScrollRef} className="max-h-[34vh] space-y-2.5 overflow-y-auto px-3.5 py-3.5">
                    {chatMessages.map((m, i) => (
                      <VitalsBubble key={i} role={m.role}>
                        {m.content}
                      </VitalsBubble>
                    ))}
                    {chatSending && (
                      <VitalsTyping label={en ? 'Vitals is replying…' : 'Vitals đang trả lời…'} />
                    )}
                    {chatError && (
                      <div
                        className="rounded-xl px-3 py-2.5 text-left text-[11.5px] leading-relaxed text-[var(--t1)]"
                        style={{ background: 'rgba(200,64,40,0.12)', border: '1px solid rgba(200,64,40,0.3)', fontFamily: SANS }}
                      >
                        {chatError.code === 'NO_TEXT_PROVIDER'
                          ? (en ? 'AI not configured yet — ' : 'AI chưa được cấu hình — ') + chatError.message
                          : chatError.code === 'NVIDIA_FREE_EXHAUSTED'
                            ? (en ? 'Free AI quota used up — ' : 'AI tạm hết lượt miễn phí — ') + chatError.message
                            : chatError.message}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* thân màn theo trạng thái */}
        {loadError ? (
          errorBlock
        ) : flows === null ? (
          loadingBlock
        ) : manyMode ? (
          // >8 dự án: carousel hết vừa → grid + tìm kiếm/lọc (mọi khổ màn, kể cả reduce-motion)
          searchGrid
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

      {/* ---------- Picker Đổi bìa ---------- */}
      <AnimatePresence>
        {pickerFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: easeApple }}
            className="absolute inset-0 z-40 grid place-items-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={() => setPickerFor(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              transition={springStage}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-xl)]"
              style={{ ...glass, background: 'rgba(20,18,16,0.72)' }}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                <span className="text-[14px] font-semibold text-[var(--t1)]" style={{ fontFamily: SANS }}>
                  {en ? 'Choose a cover' : 'Chọn ảnh bìa'}
                </span>
                <button
                  type="button"
                  aria-label={en ? 'Close' : 'Đóng'}
                  onClick={() => setPickerFor(null)}
                  className="grid h-8 w-8 place-items-center rounded-full text-[var(--t3,var(--t4))] hover:text-[var(--t1)]"
                  style={glass}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-4">
                {/* Upload trực tiếp (J-4a) — nút to đầu picker, không bắt đi đường thư viện */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadCover(f);
                  }}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-1 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium text-[var(--t1)] transition-opacity disabled:opacity-60"
                  style={{ ...glass, border: `1.5px dashed ${COPPER}88` }}
                >
                  {uploading ? (
                    <Loader2 size={15} className="animate-spin" style={{ color: COPPER }} />
                  ) : (
                    <Upload size={15} style={{ color: COPPER }} />
                  )}
                  {uploading
                    ? en
                      ? 'Uploading…'
                      : 'Đang tải lên…'
                    : en
                      ? 'Upload an image from this device'
                      : 'Tải ảnh từ máy lên làm bìa'}
                </button>
                {uploadError && (
                  <p className="mb-1 text-[11px]" style={{ fontFamily: SANS, color: '#e5806b' }}>
                    {uploadError}
                  </p>
                )}

                <p className="mb-2 mt-3 text-[10px] uppercase tracking-[0.16em] text-[var(--t4)]" style={{ fontFamily: MONO }}>
                  {en ? 'Defaults' : 'Mặc định'}
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {COVERS.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => void setCover(pickerFor, url)}
                      className="overflow-hidden rounded-lg border border-white/12 transition-transform hover:scale-[1.03]"
                      style={{ aspectRatio: '4 / 3' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
                    </button>
                  ))}
                </div>

                <p className="mb-2 mt-4 text-[10px] uppercase tracking-[0.16em] text-[var(--t4)]" style={{ fontFamily: MONO }}>
                  {en ? 'From library' : 'Từ thư viện'}
                </p>
                {libThumbs === null ? (
                  <div className="flex items-center gap-2 py-3 text-[12px] text-[var(--t4)]" style={{ fontFamily: SANS }}>
                    <Loader2 size={14} className="animate-spin" style={{ color: COPPER }} />
                    {en ? 'Loading library…' : 'Đang tải thư viện…'}
                  </div>
                ) : libThumbs.length === 0 ? (
                  <p className="py-3 text-[12px] text-[var(--t4)]" style={{ fontFamily: SANS }}>
                    {en ? 'No images in the library yet.' : 'Thư viện chưa có ảnh nào.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {libThumbs.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => void setCover(pickerFor, url)}
                        className="overflow-hidden rounded-lg border border-white/12 transition-transform hover:scale-[1.05]"
                        style={{ aspectRatio: '1 / 1' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" draggable={false} loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
