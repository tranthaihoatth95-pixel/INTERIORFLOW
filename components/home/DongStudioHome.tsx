'use client';

/**
 * components/home/DongStudioHome.tsx — [marker: DongStudio] Home "Dòng Studio" — BENTO v3, MỘT
 * MÀN (phiếu docs/phieu-giao/home-bento-v3.md; Hoà chốt 13/08: "cuộn 2 trang không ổn — tổng
 * quan chia lưới BENTO, mỗi thẻ thiết kế như MỘT WIDGET ĐỘNG, thêm cử chỉ tương tác").
 *
 * ĐẢO NGƯỢC v2: BỎ cuộn 2 trang (Trang 1 hero + Trang 2 lưới `md:grid-cols-2`) — v2 giữ NGUYÊN
 * nội dung/logic từng widget (chỉ port sang props mới khi cần), CHỈ đổi BỐ CỤC + THÊM ĐỘNG theo
 * phiếu ④. `ProjectSelect` (toggle carousel/grid, tìm kiếm, card dự án đợt 3, ngăn Nháp) mount
 * NGUYÊN VẸN trong ô A ở chế độ `bentoBox` (xem prop đó trong ProjectSelect.tsx — lý do carousel
 * 3D bị tắt trong ô A: đơn vị `vw` gắn viewport, vỡ hình khi nhét vào ô nhỏ).
 *
 * GU (chỉ đạo giữa phiên, `docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md`) — Swiss/editorial:
 * hairline (đã có ở `WidgetCard`, không đổi), số ô mono nhỏ ("01 · Dự án"…) qua prop `index` của
 * `WidgetCard`, khoảng thở `--gap`, KHÔNG bo bubbly/icon hoạt hình.
 *
 * MỘT INTERVAL TOÀN TRANG (ràng buộc ⑤ phiếu) — `minuteTick`/`eightSecTick` cùng cấp bởi MỘT
 * `setInterval` 1s (chỉ setState khi mốc thật sự đổi, tránh re-render vô ích mỗi giây). Ticker
 * (ô I) và pulse (ô C) là CSS `@keyframes` thuần — không đụng interval này (compositor, không
 * React state) — xem comment ở từng widget.
 *
 * "Widget trống tự ẩn, ô lân cận GIÃN chiếm chỗ" (④ mục giữ nguyên) — vì các ô nằm trên MỘT lưới
 * CSS Grid tường minh (không phải flow tự nhiên), lưới không tự "chảy" lấp lỗ như flexbox — các
 * biến `bArea/eArea/fAreaLeft/gArea/hArea/iArea` bên dưới tính lại `gridColumn/gridRow` CÓ ĐIỀU
 * KIỆN theo 6 cờ rỗng (C/D/E/G/H/I — chỉ ô A và ô B/F LUÔN có nội dung: dự án luôn có "+ Dự án
 * mới", chào luôn có, ghi chú luôn có ô gõ). Đây là quy tắc BOUNDED cho ĐÚNG 9 ô của phiếu này
 * (không phải thuật toán bento tổng quát — ghi rõ để phiên sau không tưởng nhầm là generic, xem
 * bảng đầy đủ ở báo cáo ⑦).
 */

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { ProjectSelect } from '@/components/ProjectSelect';
import { LangToggle } from '@/components/LangToggle';
import { useFlowStore } from '@/lib/store';
import { useLang, useT } from '@/lib/i18n';
import { buildGreeting } from '@/lib/home/greeting';
import { useDisplayName } from './useDisplayName';
import {
  bentoFillPercent,
  cellIndexMap,
  duAnTileRows,
  type HomeCellFlags,
  type HomeLayout,
} from './widgets/bento-layout';
import { shouldShowActivityGrid } from '@/lib/home/aggregate';
import { pickWeeklyItem, pickWeeklyImages, isSeedLibraryAsset } from '@/lib/home/weekly-picks';
// P-V 17/08 — VitalsPill dời lên AppChrome top bar (không import ở đây nữa).
import LightClock from './widgets/LightClock';
import TodayStrip, { todayHasSignal } from './widgets/TodayStrip';
import StageChart, { stageChartHasSignal } from './widgets/StageChart';
import ContributionGrid from './widgets/ContributionGrid';
import QuickNotes from './widgets/QuickNotes';
import NewsFeed, { newsHasSignal } from './widgets/NewsFeed';
import UpcomingList, { upcomingHasSignal } from './widgets/UpcomingList';
import WeeklyImage, { type WeeklyImageItem } from './widgets/WeeklyImage';
// R5 (19/08) — widget "Việc đang dở" (P-N V2) trước nay MỒ CÔI (0 importer, chỉ được nhắc trong
// comment HomeScreen). Mount vào Home sống tại đây; dữ liệu đọc qua `loadResume` (widget không
// tự đụng localStorage — SSR-safe, đúng hợp đồng props của nó).
import ResumeWork, { resumeWorkHasSignal } from './widgets/ResumeWork';
import { buildResumeCard } from './widgets/resume-card';
import { loadResume, type ResumeState } from '@/lib/resume';
import WeeklyMaterial, { type WeeklyMaterialItem } from './widgets/WeeklyMaterial';
import SystemWallpaper from '@/components/wallpaper/SystemWallpaper';
import type { HomeSummary } from './widgets/types';

/** Pill kính nhỏ — cùng công thức nút đóng/mở của `VitalsPill.tsx` (button trạng thái đóng), tái
 * dùng cho nút "Chi tiết" (i) đứng cạnh nó trong cụm góc-phải-trên (④.4, xem cụm `fixed right-5
 * top-5` ở cuối component, ngay trước phần `return` render lưới). */
const CORNER_PILL: CSSProperties = {
  background: 'var(--nen-mo-header, var(--panel))',
  border: '1px solid var(--border)',
  backdropFilter: 'blur(var(--blur)) saturate(150%)',
  WebkitBackdropFilter: 'blur(var(--blur)) saturate(150%)',
  boxShadow: '0 10px 28px -14px rgba(0,0,0,0.4)',
};

/** Shape rỗng hợp lệ — QuickNotes render ngay cả trước khi `/api/home/summary` trả lời. */
const EMPTY_SUMMARY: HomeSummary = {
  greeting: { dueTodayCount: 0 },
  today: { tasksDoneToday: 0, online: [] },
  recentProjects: [],
  openTasksByProject: {},
  stageChart: [],
  activityDays: [],
  news: [],
  upcoming: [],
  ambientImage: null,
};

interface LibraryAssetLite {
  id: string;
  name: string;
  url: string;
  usage: string;
  category: string;
  tags: string;
}

function area(col: [number, number], row: [number, number]): CSSProperties {
  return { gridColumn: `${col[0]} / ${col[1]}`, gridRow: `${row[0]} / ${row[1]}` };
}

export default function DongStudioHome({ onEnter }: { onEnter: () => void }) {
  const user = useFlowStore((s) => s.user);
  const openDashboardTab = useFlowStore((s) => s.openDashboardTab);
  const currentProjectId = useFlowStore((s) => s.currentProjectId);
  const currentUserId = user?.id ?? null;
  const en = useLang() === 'en';
  const tr = useT();
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAssetLite[] | null>(null);

  // ---------- ①.a dữ liệu tổng hợp (giữ nguyên nguồn v2) ----------
  useEffect(() => {
    let cancelled = false;
    fetch('/api/home/summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j) setSummary(j as HomeSummary);
      })
      .catch(() => {
        /* best-effort — bento vẫn chạy, ô A không phụ thuộc summary */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- ①.b kho vật liệu/ảnh — CHỈ ĐỌC /api/library (②.6 phiếu), cho ô D + ô H ----------
  useEffect(() => {
    let cancelled = false;
    fetch('/api/library')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !Array.isArray(j?.assets)) return;
        setLibraryAssets(
          j.assets.map((a: Record<string, unknown>) => ({
            id: String(a.id ?? ''),
            name: typeof a.name === 'string' ? a.name : '',
            url: typeof a.url === 'string' ? a.url : '',
            usage: typeof a.usage === 'string' ? a.usage : '',
            category: typeof a.category === 'string' ? a.category : '',
            tags: typeof a.tags === 'string' ? a.tags : '',
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setLibraryAssets([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- R5 (19/08) — "Việc đang dở": đọc resume MỘT lần trong effect (localStorage,
  // client-only) rồi đưa xuống widget qua props; đổi user thì đọc lại theo user đó. ----------
  const [resume, setResume] = useState<ResumeState | null>(null);
  useEffect(() => {
    setResume(currentUserId ? loadResume(currentUserId) : null);
  }, [currentUserId]);

  // ---------- ⑤ MỘT interval toàn trang — cấp nhịp phút (ô B) + nhịp 8s (ô D crossfade) ----------
  const [minuteTick, setMinuteTick] = useState(() => Math.floor(Date.now() / 60000));
  const [eightSecTick, setEightSecTick] = useState(() => Math.floor(Date.now() / 8000));
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const m = Math.floor(now / 60000);
      const e = Math.floor(now / 8000);
      setMinuteTick((prev) => (prev === m ? prev : m));
      setEightSecTick((prev) => (prev === e ? prev : e));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ---------- ③ giữ Tab → lớp dữ liệu bung trên TẤT CẢ card ô A cùng lúc ----------
  const [revealAll, setRevealAll] = useState(false);
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // Né ô nhập (luật keydown-ne-o-nhap): đang gõ thì Tab là chuyển focus, không bung lớp dữ liệu.
      const el = document.activeElement;
      if (el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      if (e.key === 'Tab') setRevealAll(true);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'Tab') setRevealAll(false);
    };
    const onBlur = () => setRevealAll(false); // đổi tab/app khi đang giữ Tab — không kẹt mở
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // ---------- ④.2 ô F kéo-thả note → ô A gán dự án (fallback click-chọn dùng chung state) ------
  const [armedNoteId, setArmedNoteId] = useState<string | null>(null);
  const [notesRefreshKey, setNotesRefreshKey] = useState(0);
  const handleNoteDrop = useCallback(async (noteId: string, projectId: string) => {
    setArmedNoteId(null);
    try {
      await fetch('/api/home/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId, projectId }),
      });
    } catch {
      /* best-effort — QuickNotes tải lại dù PATCH lỗi mạng, không kẹt state armed */
    } finally {
      setNotesRefreshKey((k) => k + 1);
    }
  }, []);

  // ---------- <1100px xếp lại, cuộn tự nhiên (mặc định desktop — sửa đúng lúc mount) ----------
  const [isWide, setIsWide] = useState(true);
  useEffect(() => {
    const check = () => setIsWide(window.innerWidth >= 1100);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // (`timeOfDayNow()` không còn gọi ở đây từ 16/08 — nền đã chuyển sang `SystemWallpaper`,
  //  nó tự đọc giờ và tự hẹn nhịp. Ô B `LightClock` vẫn đọc giờ riêng của nó như cũ.)
  // ---------- V1 (17/08, phiếu P-X ④.V1) — lời chào: tên tự đặt thắng tên tài khoản ----------
  // Ảnh chụp màn 17/08 ra "Chào hoa" (chữ thường + mất dấu). `buildGreeting` nay tự viết hoa chữ
  // đầu; phần DẤU thì chỉ người dùng gõ được nên có `displayName` (xem `useDisplayName.ts`).
  const { displayName, setDisplayName } = useDisplayName();
  const greeting = buildGreeting({
    name: user?.name ?? null,
    displayName,
    now: new Date(),
    en,
    dueTodayCount: summary?.greeting.dueTodayCount ?? 0,
  });

  // ---------- widget sáng tạo #2/#3 — chọn TẤT ĐỊNH/lọc từ /api/library (thuần, có test) ----------
  // v4 (13/08, phiếu home-bento-v4.md ④.1, lỗi #3 "ăn ảnh SEED Unsplash") — loại HẲN asset seed
  // minh hoạ (`scripts/seed-library-minh-hoa.ts`, tag `minh-hoa`) khỏi NGUỒN trước khi 2 widget
  // sáng tạo chọn — seed là dữ liệu MINH HOẠ kệ Thư viện, không phải "tuần này của studio", lên
  // Home là giả trân (đúng bẫy NC-HOME-DELIGHT). Lọc MỘT chỗ, cả 2 widget dùng chung `realAssets`.
  const realAssets = useMemo(() => (libraryAssets ?? []).filter((a) => !isSeedLibraryAsset(a.tags)), [libraryAssets]);
  const weeklyImages: WeeklyImageItem[] = useMemo(() => {
    if (!libraryAssets) return [];
    return pickWeeklyImages(realAssets, 'ref-render', 6).map((a) => ({ id: a.id, url: a.url, name: a.name }));
  }, [libraryAssets, realAssets]);
  const weeklyMaterial: WeeklyMaterialItem | null = useMemo(() => {
    if (!libraryAssets) return null;
    const pool = realAssets.filter((a) => a.usage === 'material');
    return pickWeeklyItem(pool, new Date());
  }, [libraryAssets, realAssets]);

  // ---------- ④ "widget trống tự ẩn, ô lân cận giãn" — cờ rỗng của 5 ô CÓ THỂ rỗng ----------
  const s = summary ?? EMPTY_SUMMARY;
  const hasD = weeklyImages.length > 0;
  const hasE = stageChartHasSignal(s);
  const hasG = upcomingHasSignal(s);
  const hasH = !!weeklyMaterial;
  // ô I: lưới tích luỹ THAY CHỖ bảng tin khi đủ dày (④ "đủ dày thì thay chỗ ô I" — chọn nhánh
  // này thay vì "thêm hàng" vì thêm hàng phá luật "một màn không cuộn" ở desktop, xem báo cáo ⑦).
  const showActivityInI = shouldShowActivityGrid(s.activityDays);
  const hasI = showActivityInI || newsHasSignal(s);
  const hasC = todayHasSignal(s, currentUserId);

  // ---------- v4 (phiếu home-bento-v4.md ④.2) — NẤC bố cục theo ĐỘ DÀY dữ liệu ----------
  // Đếm bao nhiêu trong 6 ô "có thể rỗng" (C/D/E/G/H/I) đang THẬT SỰ có dữ liệu. A (Dự án) · B
  // (Chào+ánh sáng) · F (Ghi chú) LUÔN sống nên không tính vào đây — chúng là 3 ô của nấc MỎNG.
  const optionalLiveCount = [hasC, hasD, hasE, hasG, hasH, hasI].filter(Boolean).length;
  // MỎNG (0 ô phụ sống, chỉ còn A/B/F) · VỪA (1-3 ô phụ, tổng 4-6 ô) · ĐẦY (4-6 ô phụ, tổng 7-9 ô)
  const tier: 'mong' | 'vua' | 'day' = optionalLiveCount === 0 ? 'mong' : optionalLiveCount <= 3 ? 'vua' : 'day';

  // ---------- V2 (17/08, phiếu P-X ④.V2) — SỐ Ô TỰ TÍNH, không còn gán cứng ----------
  // Trước đây `index="03"`/`"05"`/`"07"`… gán tại chỗ gọi trong khi widget render CÓ ĐIỀU KIỆN ⇒
  // ẩn cái nào là dãy đứt (ảnh 17/08: 01·02·04·05·06·08, và ô Lưới tích luỹ KHÔNG có số). Nay số
  // sinh từ THỨ TỰ Ô THẬT SỰ HIỆN RA của đúng bố cục đang dùng — luật + test ở
  // `./widgets/bento-layout.ts` (256 ca: 64 tổ hợp cờ × 4 bố cục).
  const layout: HomeLayout = !isWide ? 'stacked' : tier === 'mong' ? 'mong' : tier === 'vua' ? 'vua' : 'bento';
  const cellFlags: HomeCellFlags = {
    homNay: hasC, anhTuan: hasD, bieuDo: hasE, mocToi: hasG, vatLieu: hasH, dongTin: hasI,
  };
  const cellIdx = cellIndexMap(layout, cellFlags);

  // ---------- V3 (17/08, phiếu P-X ④.V3) — CỠ Ô THEO LƯỢNG TIN, không kéo dãn ----------
  // Ô "Dự án" cao 2/3 màn nhưng lưới tile chỉ cần 1 hàng khi studio còn ít dự án ⇒ nửa dưới trống
  // trơn (đúng chỗ Hoà chỉ). Lưới lùi về `bentoFillPercent(...)`% chiều cao và đứng giữa màn;
  // phần dư trả cho HÌNH NỀN (chốt A2 16/08 "chừa lề cho nền thở"), không nhồi vào ô.
  const projectCount = s.stageChart.reduce((acc, r) => acc + r.projects, 0);
  const bentoFill = bentoFillPercent(duAnTileRows(projectCount));

  const openTasksByProject = summary?.openTasksByProject;

  // ---- vùng trên-phải (B/C, row1) — C rỗng thì B (luôn có) giãn hết 5 cột ----
  const bArea = area(hasC ? [8, 11] : [8, 13], [1, 2]);
  // ---- vùng dưới-trái row3 (E/F/G dưới ô A) — F (luôn có) hấp thụ cột của E/G khi rỗng ----
  const eArea = area([1, 4], [3, 4]);
  const fAreaLeft: [number, number] = hasE && hasG ? [4, 6] : hasE ? [4, 8] : hasG ? [1, 6] : [1, 8];
  const gArea = area([6, 8], [3, 4]);
  // ---- vùng dưới-phải (D trên, H/I dưới, cols 8-12) — D rỗng thì H/I giãn LÊN chiếm cả 2 hàng.
  //      V3 (17/08): H và I KHÔNG còn đứng CẠNH nhau nữa mà XẾP CHỒNG trong MỘT ô —
  //      `gridTemplateRows: 'auto minmax(0,1fr)'`. `auto` là mấu chốt: ô "Vật liệu của tuần" chỉ
  //      có 1 quả cầu + 1 dòng tên (~97px) nhưng trước đây bị kéo cao bằng cả hàng (~279px) ⇒
  //      65% trống, đúng ô 08 Hoà chỉ. Nay nó lấy ĐÚNG chiều cao nội dung, phần dư về ô Bảng tin
  //      (danh sách — càng cao càng hiện được nhiều tin, không có chỗ chết). Chỉ còn H mà không
  //      có I thì `alignContent:'start'` để phần dư là NỀN, không phải ruột card rỗng.
  const rightRow: [number, number] = hasD ? [3, 4] : [2, 4];

  // v4 (13/08, phiếu home-bento-v4.md ④.2) — ô A tách thành JSX dùng chung CẢ 4 layout (ĐẦY ·
  // VỪA · MỎNG · stackedList mobile) — trước đây chép văn y nguyên 2 lần (bentoGrid + stackedList),
  // nay 4 lần nếu không tách. `boxShadow: var(--shadow-node)` thêm mới (lỗi #6, đồng bộ WidgetCard).
  //
  // P-DASHBOARD-DS (17/08) — chuyển vỏ từ `--card` đặc sang kính lỏng đồng bộ WidgetCard: class
  // `.nen-mo-card` (globals.css:431, backdrop-filter blur-strong + saturate 180%, Webkit prefix có
  // sẵn theo K3) + inline backdropFilter/WebkitBackdropFilter tường minh để `grep backdrop-filter`
  // bắt được (ticket ⑥b) và bảo hiểm khi class bị override. Border `--vien-mo` (hairline token
  // đảo cực theo theme) + `inset 0 1px 0 var(--vien-mo)` = MÉP BẮT SÁNG (ambient tint tầng ① ba
  // tầng ánh sáng 16/08, "kính nhận sáng"). KHÔNG hex/token mới.
  const projectTile: ReactNode = (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[var(--r-3)] nen-mo-card"
      style={{
        background: 'var(--nen-mo-card, var(--card))',
        border: '1px solid var(--vien-mo, var(--border))',
        backdropFilter: 'saturate(180%) blur(var(--blur-strong))',
        WebkitBackdropFilter: 'saturate(180%) blur(var(--blur-strong))',
        boxShadow: 'var(--shadow-node), inset 0 1px 0 var(--vien-mo)',
      }}
    >
      {/* ⑤ P-X — tiêu đề ô đổi `--t4`→`--t3` và số đổi `--t5`→`--t3`: đo được 3,44/3,26 và
          1,98/2,21 (dưới ngưỡng 4,5:1). `--t3` đạt 7,24 (tối) / 5,20 (sáng). Số phân biệt với
          nhãn bằng CÂN NẶNG chữ, không bằng màu — màu không được là kênh duy nhất. */}
      <div className="shrink-0 px-3.5 pb-1 pt-3 font-mono text-[length:var(--fs-2xs)] font-semibold uppercase tracking-wide text-[var(--t3)]">
        <span className="font-normal">{cellIdx.duAn}</span> {tr('Dự án', 'Projects')}
      </div>
      <div className="min-h-0 flex-1">
        <ProjectSelect
          onEnter={onEnter}
          hideHeroCopy
          hideVitalsBar
          bentoBox
          openTasksByProject={openTasksByProject}
          onNoteDrop={handleNoteDrop}
          armedNoteId={armedNoteId}
          revealAll={revealAll}
        />
      </div>
    </div>
  );

  // ---------- R5 (19/08) — Ô GHI CHÚ + "VIỆC ĐANG DỞ" xếp chồng ----------
  // ResumeWork mount theo đúng khuôn tiền lệ H/I (WeeklyMaterial `auto` chồng trên NewsFeed):
  // hàng `auto` cao đúng nội dung, phần dư về Ghi chú. KHÔNG đụng lưới 12 cột và KHÔNG sửa
  // `bento-layout.ts` (ngoài phạm vi phiếu — 256 ca test): widget này CỐ Ý không mang số ô
  // (`index` optional). Không có việc dở ⇒ `hasR=false` ⇒ ô Ghi chú y nguyên (widget thiếu
  // dữ liệu TỰ ẨN, luật 13/08 — `buildResumeCard` trả null là không mount gì).
  const hasR = resumeWorkHasSignal(
    buildResumeCard(resume, { recentProjects: s.recentProjects, currentProjectId }),
  );
  const quickNotesNode = (
    <QuickNotes
      summary={s}
      armedNoteId={armedNoteId}
      onArmNote={setArmedNoteId}
      refreshKey={notesRefreshKey}
      index={cellIdx.ghiChu}
    />
  );
  const resumeNode = (
    <ResumeWork
      resume={resume}
      recentProjects={s.recentProjects}
      currentProjectId={currentProjectId}
    />
  );
  // LANE C (20/08) — SÀN 96px CHO Ô GHI CHÚ + ngăn kẹp thì CUỘN, không nghiến.
  // Đo trên app thật (1280×720, bố cục `bento`): hàng chồng `auto minmax(0,1fr)` cho ResumeWork
  // lấy TRỌN chiều cao nội dung của nó (136px) trong một ô chỉ cao 156px ⇒ Ghi chú còn **12,3px**
  // trong khi ô nhập của nó cao 33px — ô nhập TRÀN RA NGOÀI card, danh sách ghi chú biến mất.
  // `minmax(0,1fr)` cho phép co về 0 nên không có sàn nào chặn. Sửa: hàng dưới có SÀN 96px (đủ
  // tiêu đề + ô nhập + 1 dòng ghi chú) và cả ngăn `overflow-y-auto` — quá chật thì người dùng
  // cuộn, KHÔNG có widget nào bị nghiến mất chức năng. (Bố cục `bento` còn được tách cạnh nhau,
  // xem `notesCols`/`resumeCols` bên dưới — ngăn chồng này là đường lùi cho vua/mỏng/xếp-dọc.)
  const notesStack: ReactNode = hasR ? (
    <div
      className="grid h-full min-h-0 overflow-y-auto"
      style={{ gridTemplateRows: 'auto minmax(96px,1fr)', gap: 'var(--gap)' }}
    >
      {resumeNode}
      <div className="min-h-0">{quickNotesNode}</div>
    </div>
  ) : (
    quickNotesNode
  );

  // ---------- LANE C (20/08) — hàng 3 bố cục `bento`: TÁCH CẠNH NHAU khi còn cột trống ----------
  // Ô Ghi chú đã hấp thụ cột của E/G khi chúng rỗng (`fAreaLeft`). Khi bề ngang ≥4 cột thì hai
  // widget đứng CẠNH nhau — mỗi cái lấy trọn 156px chiều cao — thay vì chia nhau chiều cao của
  // MỘT ô (chỗ đẻ ra lỗi nghiến ở trên). Còn 2 cột (E và G đều sống) thì không đủ chỗ tách ⇒ lùi
  // về ngăn chồng có sàn + cuộn. Ghi chú giữ phần RỘNG HƠN: nó có danh sách + ô nhập.
  const fSpan = fAreaLeft[1] - fAreaLeft[0];
  const splitRow3 = hasR && fSpan >= 4;
  const resumeSpan = Math.floor(fSpan / 2); // 4→2 · 5→2 · 7→3
  const notesCols: [number, number] = splitRow3 ? [fAreaLeft[0], fAreaLeft[1] - resumeSpan] : fAreaLeft;
  const resumeCols: [number, number] = [fAreaLeft[1] - resumeSpan, fAreaLeft[1]];

  const bentoGrid = (
    // V3 (17/08, P-X ④.V3) — lưới KHÔNG còn ép cao 100% màn. `bentoFill` co lưới lại khi ô Dự án
    // chỉ cần 1 hàng tile; wrapper `items-center` đặt lưới giữa màn, phần dư là HÌNH NỀN.
    <div className="flex h-full w-full items-center">
      <div
        className="grid w-full"
        style={{
          height: `${bentoFill}%`,
          gridTemplateColumns: 'repeat(12, minmax(0,1fr))',
          gridTemplateRows: 'repeat(3, minmax(0,1fr))',
          gap: 'var(--gap)',
        }}
      >
        {/* Ô 01 · DỰ ÁN — 7c × 2h, luôn hiện (never rỗng: "+ Dự án mới" luôn có trong ProjectSelect) */}
        <div style={area([1, 8], [1, 3])} className="flex h-full flex-col overflow-hidden">
          {projectTile}
        </div>

        {/* Ô CHÀO + ĐỒNG HỒ ÁNH SÁNG — luôn hiện; Hôm nay rỗng thì giãn hết 5 cột (`bArea`) */}
        <div style={bArea}>
          <LightClock
            headline={greeting.headline}
            signal={greeting.signal}
            tick={minuteTick}
            index={cellIdx.chao}
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
          />
        </div>

        {/* Ô HÔM NAY — tự ẩn */}
        {hasC && (
          <div style={area([11, 13], [1, 2])}>
            <TodayStrip summary={s} index={cellIdx.homNay} currentUserId={currentUserId} />
          </div>
        )}

        {/* Ô ẢNH ĐẸP TUẦN NÀY — tự ẩn; rỗng thì cụm Vật liệu/Bảng tin giãn LÊN cả 2 hàng (`rightRow`) */}
        {hasD && (
          <div style={area([8, 13], [2, 3])}>
            <WeeklyImage images={weeklyImages} eightSecTick={eightSecTick} index={cellIdx.anhTuan} />
          </div>
        )}

        {/* ---- Hàng 3 trái (dưới ô Dự án): BIỂU ĐỒ CHẶNG · GHI CHÚ · MỐC SẮP TỚI ---- */}
        {hasE && (
          <div style={eArea}>
            <StageChart summary={s} index={cellIdx.bieuDo} />
          </div>
        )}
        <div style={area(notesCols, [3, 4])} className="min-h-0">
          {splitRow3 ? quickNotesNode : notesStack}
        </div>
        {splitRow3 && (
          <div style={area(resumeCols, [3, 4])} className="min-h-0">
            {resumeNode}
          </div>
        )}
        {hasG && (
          <div style={gArea}>
            <UpcomingList summary={s} index={cellIdx.mocToi} />
          </div>
        )}

        {/* ---- Hàng 3 phải: VẬT LIỆU (cao đúng nội dung) XẾP CHỒNG trên BẢNG TIN / LƯỚI TÍCH LUỸ ---- */}
        {(hasH || hasI) && (
          <div
            style={{
              ...area([8, 13], rightRow),
              display: 'grid',
              gridTemplateRows: hasH && hasI ? 'auto minmax(0,1fr)' : hasH ? 'auto' : 'minmax(0,1fr)',
              gap: 'var(--gap)',
              alignContent: 'start',
            }}
          >
            {hasH && <WeeklyMaterial item={weeklyMaterial} index={cellIdx.vatLieu} />}
            {hasI && (
              <div className="min-h-0">
                {showActivityInI ? <ContributionGrid summary={s} index={cellIdx.dongTin} /> : <NewsFeed summary={s} index={cellIdx.dongTin} />}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // v4 (13/08, phiếu home-bento-v4.md ④.2, lỗi #1+#2) — NẤC VỪA (1-3 ô phụ sống, tổng 4-6 ô).
  // KHÔNG tái dùng thuật toán area-giãn của bentoGrid ở trên: thuật toán đó chỉ tránh lỗ trống
  // KHI ít nhất 1 trong {D,H,I} sống (đảm bảo được vì ĐẦY yêu cầu ≥4/6 ô phụ — tối đa 3 ô nằm
  // trong {C,E,G} nên luôn cần ít nhất 1 ô ở {D,H,I} mới đạt 4). Ở VỪA (≤3 ô phụ) điều đó KHÔNG
  // còn đúng — vd chỉ mỗi E sống thì {D,H,I} đều rỗng, cột phải (8-13, hàng 2-3) sẽ trống trơn
  // nếu dùng lại cách tính area cũ (chính là lỗi #1 "9 hộp rỗng ruột"/khoảng trắng đã bắt được).
  // Giải pháp ĐƠN GIẢN, KHÔNG cần bảng tổ hợp: hàng 1 cố định (A cao 2 phần · B), hàng dưới là
  // MỘT dải cột chia ĐỀU cho đúng số ô phụ sống + F (Ghi chú luôn sống) — số cột = số ô, không ô
  // nào có thể "rỗng" vì mảng chỉ chứa ô ĐÃ lọc `hasX`.
  const vuaExtras: { node: ReactNode }[] = [];
  if (hasC) vuaExtras.push({ node: <TodayStrip summary={s} index={cellIdx.homNay} currentUserId={currentUserId} /> });
  if (hasD) vuaExtras.push({ node: <WeeklyImage images={weeklyImages} eightSecTick={eightSecTick} index={cellIdx.anhTuan} /> });
  if (hasE) vuaExtras.push({ node: <StageChart summary={s} index={cellIdx.bieuDo} /> });
  if (hasG) vuaExtras.push({ node: <UpcomingList summary={s} index={cellIdx.mocToi} /> });
  if (hasH) vuaExtras.push({ node: <WeeklyMaterial item={weeklyMaterial} index={cellIdx.vatLieu} /> });
  if (hasI) {
    vuaExtras.push({
      node: showActivityInI ? <ContributionGrid summary={s} index={cellIdx.dongTin} /> : <NewsFeed summary={s} index={cellIdx.dongTin} />,
    });
  }
  const vuaBottomCount = 1 + vuaExtras.length; // + ô F (Ghi chú, luôn sống)

  const vuaGrid = (
    <div className="flex h-full w-full flex-col gap-[var(--gap)]">
      <div className="grid shrink-0" style={{ gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 'var(--gap)', height: '46%' }}>
        <div style={{ gridColumn: '1 / 8' }} className="min-h-0">
          {projectTile}
        </div>
        <div style={{ gridColumn: '8 / 13' }} className="min-h-0">
          <LightClock
            headline={greeting.headline}
            signal={greeting.signal}
            tick={minuteTick}
            index={cellIdx.chao}
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
          />
        </div>
      </div>
      <div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: `repeat(${vuaBottomCount}, minmax(0,1fr))`, gap: 'var(--gap)' }}>
        {notesStack}
        {vuaExtras.map((e, i) => (
          <div key={i} className="min-h-0">
            {e.node}
          </div>
        ))}
      </div>
    </div>
  );

  // v4 — NẤC MỎNG (0 ô phụ sống — đúng máy Hoà hôm nay: 1 dự án · 0 việc · 1 người). Phiếu ④.2
  // đòi hỏi ĐÂY LÀ NẤC ĐẸP NHẤT (dữ liệu máy Hoà đang mỏng): chỉ 3 ô THẬT SỰ có nội dung — Dự án
  // (lớn, 2 phần cao) + Chào/ánh-sáng gộp (cùng hàng) + Ghi chú (hàng dưới, cả chiều rộng) — thay
  // vì lưới 3 hàng cũ để lại 2 hàng-cột rỗng bên phải (chính là lỗi #1+#4 "khoảng trắng mênh mông").
  const mongGrid = (
    <div className="grid h-full w-full" style={{ gridTemplateRows: '2fr 1fr', gap: 'var(--gap)' }}>
      <div className="grid min-h-0" style={{ gridTemplateColumns: '7fr 5fr', gap: 'var(--gap)' }}>
        <div className="min-h-0">{projectTile}</div>
        <div className="min-h-0">
          <LightClock
            headline={greeting.headline}
            signal={greeting.signal}
            tick={minuteTick}
            index={cellIdx.chao}
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
          />
        </div>
      </div>
      <div className="min-h-0">
        {notesStack}
      </div>
    </div>
  );

  const stackedList = (
    <div className="flex w-full flex-col gap-[var(--gap)] px-3 pb-6 pt-3">
      <div className="h-[440px]">{projectTile}</div>
      <div className="h-[170px]">
        <LightClock
          headline={greeting.headline}
          signal={greeting.signal}
          tick={minuteTick}
          index={cellIdx.chao}
          displayName={displayName}
          onDisplayNameChange={setDisplayName}
        />
      </div>
      {hasC && (
        <div className="h-[150px]">
          <TodayStrip summary={s} index={cellIdx.homNay} currentUserId={currentUserId} />
        </div>
      )}
      {hasD && (
        <div className="h-[220px]">
          <WeeklyImage images={weeklyImages} eightSecTick={eightSecTick} index={cellIdx.anhTuan} />
        </div>
      )}
      {hasE && (
        <div className="h-[190px]">
          <StageChart summary={s} index={cellIdx.bieuDo} />
        </div>
      )}
      <div className="h-[220px]">
        {notesStack}
      </div>
      {hasG && (
        <div className="h-[200px]">
          <UpcomingList summary={s} index={cellIdx.mocToi} />
        </div>
      )}
      {/* V3 — ô Vật liệu ở bản xếp dọc vốn đã cao đúng nội dung (110px), giữ nguyên. */}
      {hasH && (
        <div className="h-[110px]">
          <WeeklyMaterial item={weeklyMaterial} index={cellIdx.vatLieu} />
        </div>
      )}
      {hasI && (
        <div className="h-[220px]">
          {showActivityInI ? <ContributionGrid summary={s} index={cellIdx.dongTin} /> : <NewsFeed summary={s} index={cellIdx.dongTin} />}
        </div>
      )}
    </div>
  );

  return (
    <div className={isWide ? 'relative h-[100dvh] w-full overflow-hidden' : 'relative min-h-[100dvh] w-full overflow-y-auto'} data-dong-studio="">
      {/* NỀN — phiếu P-O (16/08). Trước đây: `--bg` đặc + gradient `tod.gradient` phủ mờ 0.16.
          Nay là HÌNH NỀN HỆ THỐNG sinh bằng mã (`components/wallpaper/SystemWallpaper.tsx`):
          năm bộ, đổi ánh sáng theo giờ, chậm dần rồi DỪNG HẲN khi vào.
          ⚠️ Thi hành chốt A2 (16/08): nền để **NÉT**, KHÔNG bôi mờ — thứ làm chữ đọc được là
          thẻ đủ đặc, không phải nền mờ. Lớp `--bg` giữ lại làm đáy (nền hệ thống có thể bị
          tắt trong Cài đặt, lúc đó nó là nền trơn như trước). */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--bg)' }} aria-hidden />
      <SystemWallpaper />

      {/* v4 (13/08, phiếu home-bento-v4.md ④.4, lỗi #4 "VI/EN·(i) lơ lửng") — cụm góc-phải-trên
          DUY NHẤT của toàn trang Home: "Chi tiết" (dashboard tất cả dự án) + đổi ngôn ngữ +
          Vitals, đứng CÙNG một hàng cố định. Trước đây 2 nút đầu bị neo BÊN TRONG ô A nhỏ
          (`ProjectSelect` — `absolute right-6 top-6` tính theo góc của CHÍNH ô A, không phải góc
          màn) nên trông "lơ lửng" giữa card — nay cả cụm neo ĐÚNG MỘT LẦN ở góc màn thật, ô A
          không tự vẽ cụm này nữa (`bentoBox` gate trong ProjectSelect.tsx). */}
      {/* 20/08 (COHERENCE-SHELL) — HẠ CỤM XUỐNG DƯỚI HEADER. Trước đây `top-5` + `z-50` đặt cụm
          này ĐÈ LÊN thanh đầu 42px (đo trên app thật 1440×900: cụm chiếm y 20→56, x 1309→1420 —
          phủ đúng chỗ ô tìm dự án và Vitals đứng, `elementFromPoint(1386,20)` trả về cụm này chứ
          không phải nút Vitals ⇒ **bấm Vitals ở Trang chủ không ăn**). Lỗi có TRƯỚC phiếu này
          (VitalsPill dời lên header từ 17/08 đã nằm dưới cụm), chỉ lộ ra khi đo bằng thao tác
          thật. Sửa bằng cách cho cụm bắt đầu NGAY DƯỚI mép header thay vì nới z-index — nới
          z-index chỉ đổi ai thắng, hai thứ vẫn chồng nhau về mặt thị giác. */}
      <div className="fixed right-5 top-[50px] z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => openDashboardTab('board', null)}
          aria-label={en ? 'Details (all projects)' : 'Chi tiết (toàn bộ dự án)'}
          title={en ? 'Details (all projects)' : 'Chi tiết (toàn bộ dự án)'}
          className="grid h-9 w-9 place-items-center rounded-full text-[var(--t3)] transition-colors hover:text-[var(--t1)]"
          style={CORNER_PILL}
        >
          <Info size={15} aria-hidden="true" />
        </button>
        <LangToggle variant="ghost" />
        {/* P-V 17/08 (chốt 16/08 "Vitals ở Home = chấm cạnh ô tìm kiếm") — VitalsPill DỜI lên
            AppChrome top bar cạnh SearchProjectsInput, không còn nằm ở góc-phải-trên của Home. */}
      </div>

      {/* Lề ngoài 20px (p-5, trước là p-3) — chốt A2 16/08: *"thẻ kính KHÔNG phủ kín màn —
          chừa lề cho nền thở"*. Nền chỉ hiện ở lề + khe giữa thẻ; đó là chỗ nó sống. */}
      <div className={isWide ? 'relative z-10 h-full w-full p-5' : 'relative z-10 w-full'}>
        {isWide ? (tier === 'mong' ? mongGrid : tier === 'vua' ? vuaGrid : bentoGrid) : stackedList}
      </div>
    </div>
  );
}
