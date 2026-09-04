'use client';

/**
 * components/home/DongStudioHome.tsx — [marker: DongStudio] HOME = **XƯỞNG CÁ NHÂN**, không phải
 * dashboard.
 *
 * ⛔ 20/08 — BỐ CỤC RỘNG CŨ HẾT HIỆU LỰC. Bản trước là lưới BENTO 12 cột × 3 hàng (v3/v4, phiếu
 * `docs/phieu-giao/home-bento-v3.md` + `home-bento-v4.md`) với ba nấc `mong`/`vua`/`bento`, mỗi
 * ô một widget chia nhau chiều cao. Chốt `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` §6:
 * *"ĐÚNG MỘT TIÊU ĐIỂM CHÍNH — thẻ Resume/việc đang làm dở — rồi tới một cụm phụ ở hạng dưới
 * hẳn"*, và *"Home KHÔNG được đọc ra như một dashboard SaaS, cũng không phải lưới bento 9 thẻ"*.
 * ⇒ Ba nhánh lưới rộng đã GỠ khỏi tệp này.
 *
 * ⚖️ `widgets/bento-layout.ts` **GIỮ NGUYÊN TỆP** (256 ca test) — nó KHÔNG chết: bản XẾP DỌC ở
 * khổ hẹp (`stackedList`, <1100px) vẫn gọi `cellIndexMap('stacked', …)` để cấp số ô. Thứ bị bỏ
 * là *quyền định nghĩa thứ bậc Home ở desktop*, không phải cả cỗ máy.
 *
 * ⭐ BỐ CỤC RỘNG ĐANG DÙNG — luật + test thuần ở `./xuong-layout.ts`:
 *   ① NỀN (`SystemWallpaper`) là MẶT PHẲNG CHÍNH — nội dung KHÔNG phủ kín màn. Lề ngoài nở theo
 *     bề ngang màn (`clamp`, không breakpoint px) ⇒ màn càng rộng thì KHOẢNG ÂM càng lớn, chứ
 *     không phải thẻ càng dãn (luật 16/08 "size to là BỔ SUNG CHI TIẾT, không phải kéo dãn").
 *   ② ĐÚNG MỘT TIÊU ĐIỂM (trái, ~1,62 phần): dải "Việc đang dở" (khi có) + ô Dự án — ô Dự án khi
 *     trống chính là màn bắt đầu của `ProjectSelect`. Không có vùng thứ hai ngang hạng với nó.
 *   ③ ĐÚNG MỘT CỤM PHỤ (phải, 1 phần — hẹp hơn hẳn): MỘT cột xếp theo THỨ TỰ ƯU TIÊN cố định,
 *     mỗi mục cao ĐÚNG NỘI DUNG và **cấm co** (`flex: 0 0 auto`); dài quá thì cột đó CUỘN, không
 *     nghiến mục nào về min-content.
 *   ④ A → B → C là **một không gian đang lớn lên**: tiêu điểm không đổi chỗ, dữ liệu cập bến vào
 *     đúng vùng đã có — không phải ba dashboard khác nhau.
 *
 * `ProjectSelect` mount NGUYÊN VẸN trong tiêu điểm ở chế độ `bentoBox` (xem prop đó trong
 * ProjectSelect.tsx — lý do carousel 3D bị tắt: đơn vị `vw` gắn viewport, vỡ hình trong ô nhỏ).
 *
 * GU (`docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md`) — Swiss/editorial: hairline (ở
 * `WidgetCard`, không đổi), số ô mono nhỏ ("01 · Dự án"…), khoảng thở `--gap`, KHÔNG bo bubbly.
 *
 * MỘT INTERVAL TOÀN TRANG (ràng buộc ⑤ phiếu cũ, GIỮ) — `minuteTick`/`eightSecTick` cùng cấp bởi
 * MỘT `setInterval` 1s (chỉ setState khi mốc thật sự đổi, tránh re-render vô ích mỗi giây).
 * Ticker/pulse là CSS `@keyframes` thuần, không đụng interval này.
 *
 * ⛔ KHÔNG đụng Vitals ở tệp này — `VitalsPill` đã dời lên `AppChrome` từ 17/08 và lane khác
 * đang dựng khẩu độ mép trên. Bố cục dưới đây chỉ CHỪA CHỖ bằng lề ngoài, không mount gì.
 */

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { ProjectSelect } from '@/components/ProjectSelect';
import { LangToggle } from '@/components/LangToggle';
import { useFlowStore } from '@/lib/store';
import { useLang, useT } from '@/lib/i18n';
import { buildGreeting } from '@/lib/home/greeting';
import { useDisplayName } from './useDisplayName';
import { cellIndexMap, type HomeCellFlags } from './widgets/bento-layout';
// 20/08 — bố cục RỘNG: một tiêu điểm + một cụm phụ. Thuần, không JSX/DOM nên test được; ba luật
// bố cục nằm trong docstring của tệp đó, đừng chép lại ở đây.
import { bocCucXuong, cotXuong, hangPhu, type MucPhu } from './xuong-layout';
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

  // ---------- 20/08 — SỐ Ô cho bản XẾP DỌC (hẹp) vẫn đi qua `bento-layout` (256 ca test) -------
  // Bản RỘNG đã đổi hẳn sang bố cục tiêu-điểm (`./xuong-layout.ts`) nên nó TỰ CẤP số ô. Ba nấc
  // `mong`/`vua`/`bento` cùng các biến `area`/`bentoFill` đi theo chúng đã gỡ khỏi tệp này —
  // `bento-layout.ts` giữ nguyên vì nhánh hẹp còn dùng.
  const cellFlags: HomeCellFlags = {
    homNay: hasC, anhTuan: hasD, bieuDo: hasE, mocToi: hasG, vatLieu: hasH, dongTin: hasI,
  };
  const cellIdx = cellIndexMap('stacked', cellFlags);

  const openTasksByProject = summary?.openTasksByProject;

  // v4 (13/08) — ô A tách thành JSX dùng chung; 20/08 còn HAI nơi gọi (tiêu điểm của
  // `xuongLayout` + `stackedList` khổ hẹp) sau khi ba nhánh lưới rộng bị gỡ. `boxShadow: var(--shadow-node)` thêm mới (lỗi #6, đồng bộ WidgetCard).
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

  // ---------- 20/08 — MỘT TIÊU ĐIỂM · MỘT CỤM PHỤ (thay HẲN lưới bento 12×3 ở khổ rộng) --------
  // Luật + test ở `./xuong-layout.ts`. Ở đây chỉ BÀY RA.
  //
  // "Studio đã có dự án chưa" — ba nguồn, chỉ cần MỘT nói có. `hasR` cũng tính: có việc đang dở
  // thì chắc chắn đã từng có dự án, và nguồn đó về SỚM hơn `/api/home/summary` (đọc localStorage)
  // nên tránh được nhịp nháy "chưa có dự án → có dự án" khi summary còn đang bay.
  const coDuAn =
    s.stageChart.reduce((acc, r) => acc + r.projects, 0) > 0 || s.recentProjects.length > 0 || hasR;
  const bc = bocCucXuong({
    coDuAn,
    coViecDo: hasR,
    duLieu: { homNay: hasC, mocToi: hasG, vatLieu: hasH, anhTuan: hasD, bieuDo: hasE, dongTin: hasI },
  });

  /** Một mục của cụm phụ. Số ô do `bocCucXuong` cấp — dãy liền mạch, không đứt khi mục tự ẩn. */
  function mucPhuNode(m: MucPhu): ReactNode {
    const so = bc.soO[m];
    switch (m) {
      case 'chao':
        return (
          <LightClock
            headline={greeting.headline}
            signal={greeting.signal}
            tick={minuteTick}
            index={so}
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
          />
        );
      case 'homNay':
        return <TodayStrip summary={s} index={so} currentUserId={currentUserId} />;
      case 'mocToi':
        return <UpcomingList summary={s} index={so} />;
      case 'ghiChu':
        return (
          <QuickNotes
            summary={s}
            armedNoteId={armedNoteId}
            onArmNote={setArmedNoteId}
            refreshKey={notesRefreshKey}
            index={so}
          />
        );
      case 'vatLieu':
        return <WeeklyMaterial item={weeklyMaterial} index={so} />;
      case 'anhTuan':
        return <WeeklyImage images={weeklyImages} eightSecTick={eightSecTick} index={so} />;
      case 'bieuDo':
        return <StageChart summary={s} index={so} />;
      case 'dongTin':
        return showActivityInI ? <ContributionGrid summary={s} index={so} /> : <NewsFeed summary={s} index={so} />;
    }
  }

  const xuongLayout = (
    // LUẬT ① NỀN LÀ MẶT PHẲNG CHÍNH: nội dung KHÔNG phủ kín màn. Lề ngoài do wrapper ở `return`
    // cấp (`clamp`, nở theo bề ngang); ở đây thêm TRẦN BỀ NGANG — trên màn rất rộng thì khoảng âm
    // LỚN LÊN chứ hai vùng không kéo dãn thêm.
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="grid w-full"
        style={{
          maxWidth: 'min(100%, 1360px)',
          // Cao ĐÚNG chỗ được cấp + hàng `minmax(0,1fr)`: đây là thứ cho phép cụm phụ CUỘN thay
          // vì tràn ra ngoài màn. (Đo 20/08: để `maxHeight` + hàng ẩn `auto` thì cột phụ cao
          // 1112px trong khung 818px — `overflow-y` không bao giờ ăn vì chính nó bị kéo dài ra.)
          height: '100%',
          gridTemplateRows: 'minmax(0, 1fr)',
          // LUẬT ②+③ — tỉ lệ hai vùng, KHÔNG BAO GIỜ 1:1 (1:1 chính là lưới đều bị cấm). Test
          // `xuong-layout.test.ts` ③ canh điều này cho 6 độ dày dữ liệu.
          gridTemplateColumns: cotXuong(bc.cumPhu.length),
          gap: 'calc(var(--gap) * 2)',
        }}
      >
        {/* ── LUẬT ② · TIÊU ĐIỂM ── cùng MỘT vùng ở CẢ BA trạng thái; ruột đổi, chỗ đứng không
            đổi. `auto` cho dải việc-dở = nó lấy đúng chiều cao của nó, phần còn lại về ô Dự án.
            Không có vùng thứ hai nào trên màn ngang hạng với vùng này. */}
        <div
          className="grid min-h-0"
          style={{ gridTemplateRows: bc.banViecDo ? 'auto minmax(0,1fr)' : 'minmax(0,1fr)', gap: 'var(--gap)' }}
        >
          {bc.banViecDo && resumeNode}
          <div className="min-h-0">{projectTile}</div>
        </div>

        {/* ── LUẬT ③ · CỤM PHỤ ── MỘT cột hẹp hơn hẳn, xếp theo ưu tiên cố định (`THU_TU_PHU`),
            mỗi mục cao ĐÚNG NỘI DUNG và CẤM CO (`hangPhu` → `flex: 0 0 auto`) ⇒ không mục nào bị
            kéo cho bằng mục nào. Chỗ dư ở đáy cột là NỀN, không phải ruột card rỗng. Dày quá thì
            CỘT NÀY cuộn — thà cuộn còn hơn nghiến một widget về min-content. */}
        <div className="flex min-h-0 flex-col overflow-y-auto" style={{ gap: 'var(--gap)' }}>
          {bc.cumPhu.map((m) => (
            <div key={m} style={hangPhu(m)}>
              {mucPhuNode(m)}
            </div>
          ))}
        </div>
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
      <div className="fixed right-5 top-5 z-50 flex items-center gap-2">
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

      {/* LỀ NGOÀI — LUẬT ① "nền là mặt phẳng chính" (chốt A2 16/08 *"thẻ kính KHÔNG phủ kín màn
          — chừa lề cho nền thở"*, siết lại 20/08). `p-5` (20px cứng) cũ chỉ đủ cho một lưới phủ
          gần kín màn; nay lề NỞ THEO BỀ NGANG màn nên màn càng rộng thì **khoảng âm càng lớn**,
          không phải thẻ càng dãn. `clamp` — không breakpoint px. Lề trên cũng là chỗ CHỪA SẴN
          cho khẩu độ Vitals mép trên (lane khác dựng; ở đây không mount gì). */}
      <div
        className={isWide ? 'relative z-10 h-full w-full' : 'relative z-10 w-full'}
        style={isWide ? { padding: 'clamp(20px, 2.6vw, 52px) clamp(20px, 3.2vw, 64px)' } : undefined}
      >
        {/* Khổ RỘNG: một tiêu điểm + một cụm phụ (`./xuong-layout.ts`). Khổ HẸP: bản xếp dọc sẵn
            có — nó vốn đã là MỘT cột, không phải tường widget, nên không thuộc thứ bị chốt bác. */}
        {isWide ? xuongLayout : stackedList}
      </div>
    </div>
  );
}
