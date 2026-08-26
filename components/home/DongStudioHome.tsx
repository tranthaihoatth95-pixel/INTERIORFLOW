'use client';

/**
 * components/home/DongStudioHome.tsx — [marker: DongStudio] HOME = **XƯỞNG CÁ NHÂN**, không phải
 * dashboard.
 *
 * ⛔ 20/08 — BỐ CỤC CŨ HẾT HIỆU LỰC. Bản trước là lưới BENTO 12 cột × 3 hàng (v3/v4, phiếu
 * `docs/phieu-giao/home-bento-v3.md` + `home-bento-v4.md`), ba nấc `mong`/`vua`/`bento`, mỗi ô
 * một widget chia nhau chiều cao. Hoà chốt 20/08: *"TRƯỢT nếu Home vẫn trông như dashboard
 * SaaS"* — **cấm lưới thẻ đều · cấm bức tường nút tính năng · cấm khung xương kiểu dashboard**.
 * Ba nhánh lưới đó đã GỠ. `widgets/bento-layout.ts` GIỮ NGUYÊN (256 ca test) vì bản XẾP DỌC
 * (màn hẹp) vẫn dùng nó cấp số ô.
 *
 * ⭐ BỐ CỤC ĐANG DÙNG — luật + test ở `./xuong-layout.ts`:
 *   · NỀN (`SystemWallpaper`) là MẶT PHẲNG CHÍNH, mang tính CẤU TRÚC. Lề ngoài nở theo bề ngang
 *     màn ⇒ màn càng rộng thì KHOẢNG ÂM càng lớn, không phải thẻ càng dãn.
 *   · ĐÚNG MỘT TIÊU ĐIỂM (trái, ~1,62 phần): dải "Việc đang dở" (nếu có) + ô Dự án — mà ô Dự án
 *     khi trống chính là **Ngày-Số-Không** ba cửa (`BatDauNgaySoKhong` bên trong `ProjectSelect`).
 *   · ĐÚNG MỘT CỤM PHỤ (phải, 1 phần): MỘT cột xếp theo ưu tiên, mỗi mục cao ĐÚNG NỘI DUNG và
 *     **cấm co** (`flex: 0 0 auto`); dài quá thì cột đó CUỘN, không nghiến mục nào.
 *   · A → B → C là **một không gian đang lớn lên**: tiêu điểm không đổi chỗ, dữ liệu cập bến vào
 *     đúng vùng đã có.
 *
 * `ProjectSelect` mount NGUYÊN VẸN trong tiêu điểm ở chế độ `bentoBox` (xem prop đó trong
 * ProjectSelect.tsx — lý do carousel 3D bị tắt: đơn vị `vw` gắn viewport, vỡ hình trong ô nhỏ).
 *
 * GU (`docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md`) — Swiss/editorial: hairline (ở
 * `WidgetCard`, không đổi), số ô mono nhỏ ("01 · Dự án"…), khoảng thở `--gap`, KHÔNG bo bubbly.
 *
 * MỘT INTERVAL TOÀN TRANG (ràng buộc ⑤ phiếu cũ, GIỮ) — `minuteTick`/`eightSecTick` cùng cấp bởi
 * MỘT `setInterval` 1s (chỉ setState khi mốc thật sự đổi). Ticker/pulse là CSS `@keyframes`
 * thuần, không đụng interval này.
 */

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, Pin, EyeOff } from 'lucide-react';
import { ProjectSelect } from '@/components/ProjectSelect';
import { useFlowStore } from '@/lib/store';
import { useLang, useT } from '@/lib/i18n';
import { buildGreeting } from '@/lib/home/greeting';
import { useDisplayName } from './useDisplayName';
import { cellIndexMap, type HomeCellFlags } from './widgets/bento-layout';
import { bocCucXuong, cotXuong, hangPhu, type MucPhu } from './xuong-layout';
// 23/08 (HOME-SPEC) — Home là BỀ MẶT CÓ TRẠNG THÁI. Luật ở `nam-trang-thai.ts` (thuần, test
// được); bày ra ở `BeMatHome.tsx`. Xem docstring hai tệp đó, không lặp lại ở đây.
import BeMatHome from './BeMatHome';
import type { MaWidget, TinHieu } from './nam-trang-thai';
import { docDaQuayLai, ghiDaRoiHome } from './da-quay-lai';
import { useHomeWidgetPrefs, applyWidgetPrefs } from '@/lib/home/widget-prefs';
import { docCheDo, laBonDai, nhipDai, type CheDoHome } from '@/lib/home/che-do-home';
import { shouldShowActivityGrid } from '@/lib/home/aggregate';
import { pickWeeklyItem, pickWeeklyImages, isSeedLibraryAsset } from '@/lib/home/weekly-picks';
// P-V 17/08 — VitalsPill dời lên AppChrome top bar (không import ở đây nữa).
import LightClock from './widgets/LightClock';
import LivingCanvas, { KeDuAn } from './LivingCanvas';
import WidgetCard from './widgets/WidgetCard';
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
import { buildResumeCard, daysAgoLabel, resumeHref } from './widgets/resume-card';
import { loadResume, type ResumeState } from '@/lib/resume';
import WeeklyMaterial, { type WeeklyMaterialItem } from './widgets/WeeklyMaterial';
import SystemWallpaper from '@/components/wallpaper/SystemWallpaper';
import { listGallery } from '@/lib/gallery';
import type { HomeSummary } from './widgets/types';

/** Pill kính nhỏ — cùng công thức nút đóng/mở của `VitalsPill.tsx` (button trạng thái đóng), tái
 * dùng cho nút "Chi tiết" (i) đứng cạnh nó trong cụm góc-phải-trên (④.4, xem cụm `fixed right-5
 * top-5` ở cuối component, ngay trước phần `return` render lưới). */
/** Nhãn song ngữ [vi, en] của từng mục cụm phụ — cho chip "Đã ẩn" + nhãn nút ẩn (LANE B,
 * `lib/home/widget-prefs.ts`). Chỉ các mục TUỲ CHỌN cần nhãn — `chao`/`ghiChu` không có nút ẩn. */
const MUC_PHU_LABEL: Record<MucPhu, [string, string]> = {
  chao: ['Chào', 'Greeting'],
  homNay: ['Hôm nay', 'Today'],
  mocToi: ['Sắp tới', 'Upcoming'],
  ghiChu: ['Ghi chú', 'Notes'],
  vatLieu: ['Vật liệu của tuần', "This week's material"],
  anhTuan: ['Ảnh đẹp tuần này', "This week's frame"],
  bieuDo: ['Biểu đồ chặng', 'Stage chart'],
  dongTin: ['Bảng tin studio', 'Studio feed'],
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
  // ---------- CẢM HỨNG — HỢP ĐỒNG NGUỒN ẢNH (Hoà chốt 22/08) ----------
  // 🔴 GỐC BỆNH ĐÃ BẮT ĐƯỢC TRÊN APP THẬT: nguồn cũ là `pickWeeklyImages(realAssets,'ref-render')`
  // — tức ĐẦU RA RENDER / tài sản tham chiếu của chính app. Trên máy thật nó chiếu ra **ảnh chụp
  // màn hình InteriorFlow** (thấy rõ canvas + node) dưới nhãn "Ảnh đẹp tuần này". Ảnh loại đó
  // KHÔNG có nguồn, KHÔNG có provenance ⇒ sai cả nghĩa lẫn luật.
  // (Trước đây `object-cover` cắt cụt nên không ai nhận ra; đổi sang `object-contain` cho đúng
  //  luật ảnh thì cái sai lộ nguyên hình — bằng chứng: sửa đúng một chỗ làm lộ chỗ sai kế tiếp.)
  //
  // HỢP ĐỒNG ĐÚNG: ảnh cảm hứng đến từ **Gallery** — thứ người dùng ĐÃ TỰ LƯU, mỗi tấm mang
  // danh tính `img_…` (`lib/img-id.ts`) độc lập URL/tên tệp ⇒ truy được nguồn.
  // KHÔNG có ảnh hợp lệ ⇒ `weeklyImages` rỗng ⇒ `hasD=false` ⇒ **dải TỰ ẨN**, tuyệt đối không
  // bịa một tấm cho đỡ trống. Đây là hành vi ĐÚNG, không phải thiếu sót.
  const [gallery, setGallery] = useState<WeeklyImageItem[]>([]);
  useEffect(() => {
    // localStorage ⇒ client-only, đọc trong effect để không vỡ SSR.
    setGallery(listGallery().map((g) => ({ id: g.id, url: g.url, name: g.name })));
  }, [currentUserId]);
  const weeklyImages: WeeklyImageItem[] = gallery;
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

  // ---------- 20/08 — SỐ Ô cho bản XẾP DỌC (hẹp) vẫn đi qua `bento-layout` (256 ca test) ----------
  // Bản RỘNG đã đổi hẳn sang bố cục tiêu-điểm (xem `./xuong-layout.ts`) nên nó tự cấp số ô.
  const cellFlags: HomeCellFlags = {
    homNay: hasC, anhTuan: hasD, bieuDo: hasE, mocToi: hasG, vatLieu: hasH, dongTin: hasI,
  };
  const cellIdx = cellIndexMap('stacked', cellFlags);

  const openTasksByProject = summary?.openTasksByProject;

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
      <div className="shrink-0 px-3.5 pb-1 pt-3 font-mono text-[length:var(--fs-2xs)] font-semibold tracking-[.01em] text-[var(--t3)]">
        {/* 22/08 — thôi đánh số ô (Hoà: "No numbered 01/02/03 sections"). `cellIndexMap` GIỮ
            NGUYÊN (nó vẫn là hàm thứ tự thuần đúng, có test riêng) — chỉ thôi HIỂN THỊ số. */}
        {tr('Dự án', 'Projects')}
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

  // ---------- 20/08 — MỘT TIÊU ĐIỂM · MỘT CỤM PHỤ (thay HẲN lưới bento 12×3) ----------
  // Luật + test ở `./xuong-layout.ts`. Ở đây chỉ BÀY RA: vùng tiêu điểm bên trái (dải "Việc đang
  // dở" mọc lên trên nó khi có), cụm phụ là MỘT cột hẹp hơn hẳn bên phải, mục cao ĐÚNG NỘI DUNG.
  // "Studio đã có dự án chưa" — ba nguồn, chỉ cần MỘT nói có. `hasR` cũng tính: có việc đang dở
  // thì chắc chắn đã từng có dự án, và nguồn đó về SỚM hơn `/api/home/summary` (đọc localStorage)
  // nên tránh được nhịp nháy "Ngày-Số-Không → có dự án" khi summary còn đang bay.
  const coDuAn =
    s.stageChart.reduce((acc, r) => acc + r.projects, 0) > 0 || s.recentProjects.length > 0 || hasR;
  const bc = bocCucXuong({
    coDuAn,
    coViecDo: hasR,
    duLieu: { homNay: hasC, mocToi: hasG, vatLieu: hasH, anhTuan: hasD, bieuDo: hasE, dongTin: hasI },
  });

  // ---------- CÁ NHÂN HOÁ cụm phụ (LANE B, `lib/home/widget-prefs.ts`) ----------
  // Ẩn/hiện + thứ tự là lựa chọn CỦA MÁY NÀY (localStorage per-user) áp LÊN TRÊN `bc.cumPhu` đã
  // lọc theo tín hiệu dữ liệu thật — mục hết dữ liệu vẫn biến mất bất kể prefs (đúng ràng buộc
  // `applyWidgetPrefs`: cá nhân hoá không được làm sống lại mục không có gì để bày).
  const widgetPrefs = useHomeWidgetPrefs(currentUserId);
  /* Chế độ Trang chủ — đọc SAU khi gắn kết (localStorage không có ở lượt dựng phía máy chủ, đọc
     thẳng lúc dựng là lệch SSR/CSR). Mặc định `calm` = bốn dải. */
  const [cheDo, setCheDo] = useState<CheDoHome>('calm');
  useEffect(() => { setCheDo(docCheDo()); }, []);

  /* ── 23/08 · NGỮ CẢNH cho năm trạng thái ─────────────────────────────────────────────────
     `gio` khởi tạo `null` (= CHƯA BIẾT) chứ không phải một giờ mặc định: đọc `new Date()` ngay
     lúc dựng thì máy chủ và trình duyệt có thể ra hai giờ khác nhau ⇒ lệch hydrate. Trong lúc
     chưa biết giờ, Home giữ nguyên bố cục Living Canvas (bản Hoà duyệt 22/08) — không màn
     trắng, không nháy sang một trạng thái đoán bừa.
     Cập nhật theo `minuteTick` (interval toàn trang sẵn có, luật ⑤) ⇒ qua 11h/18h là trạng
     thái tự đổi, KHÔNG cần tải lại trang và KHÔNG thêm interval thứ hai. */
  const [gio, setGio] = useState<number | null>(null);
  useEffect(() => { setGio(new Date().getHours()); }, [minuteTick]);

  const [daQuayLai, setDaQuayLai] = useState(false);
  useEffect(() => {
    setDaQuayLai(docDaQuayLai());
    // Rời Home (vào một workspace) ⇒ lượt quay về sau đó là D "giữa giờ", không phải C "mở đầu
    // ngày". Ghi lúc gỡ khỏi cây là chỗ duy nhất biết chắc người dùng đã đi.
    return () => ghiDaRoiHome();
  }, []);
  const cumPhuFinal = useMemo(
    () => applyWidgetPrefs(bc.cumPhu, widgetPrefs.prefs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bc.cumPhu.join(','), widgetPrefs.prefs],
  );
  // Số ô là ĐỊA CHỈ vị trí trên màn (docstring bento-layout.ts §V2) — sau khi người dùng sắp lại
  // thứ tự, số phải theo đúng vị trí MỚI, không giữ số cũ đi lạc chỗ.
  const soOFinal: Partial<Record<MucPhu | 'tieuDiem', string>> = { tieuDiem: '01' };
  cumPhuFinal.forEach((m, i) => {
    soOFinal[m] = String(i + 2).padStart(2, '0');
  });
  const hiddenList = widgetPrefs.prefs.hidden.filter((m) => bc.cumPhu.includes(m));

  /** Một mục của cụm phụ. Số ô do `bocCucXuong` cấp — dãy liền mạch, không đứt khi mục tự ẩn. */
  function mucPhuNode(m: MucPhu): ReactNode {
    const so = soOFinal[m];
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

  /* ── BỐ CỤC BỐN DẢI (§4) — KHÔNG KHÍ → TIẾP TỤC → KỆ DỰ ÁN → CẢM HỨNG ────────────────────
     Đây là THỨ TỰ ĐỌC chính tắc của Trang chủ, và nó là MẶC ĐỊNH.
     🔴 Vì sao đổi: bản cũ đặt KHÔNG KHÍ (lời chào + đồng hồ ánh sáng) vào CỘT PHỤ bên phải, còn
     khung hình đầu thì nhường cho lưới dự án + một cột widget. Mắt chạm dữ liệu trước, chạm nơi
     chốn sau ⇒ Trang chủ đọc ra bảng điều khiển. Bốn dải đảo lại đúng thứ tự đó.
     ⚖️ Widget cũ KHÔNG bị xoá — chúng sống ở chế độ `custom` (bố cục hai cột nguyên vẹn). Bỏ hẳn
     là phá chức năng đang chạy để chiều một bố cục; đây là đổi MẶC ĐỊNH, không phải cắt tính năng. */
  const nhip = nhipDai(cheDo);
  // ---------- BỐ CỤC CHÍNH TẮC — M2 · Living Canvas (Hoà duyệt 22/08) ----------
  // 🔴 Bản BỐN DẢI cũ ĐÃ BỊ ĐÁNH FAIL 22/08: đọc ra là *dashboard* — thẻ "VIỆC ĐANG DỞ" khổ đại,
  // kệ dự án `minHeight:360` nuốt trọn khung hình đầu, mục đánh số ①②③④ lộ ra như bảng điều khiển.
  // Nó được THAY, không được vá: đánh bóng CSS của một cấu trúc sai vẫn ra cấu trúc sai.
  // Bố cục mới sống ở `LivingCanvas.tsx` (nhịp kệ 64px · Tiếp tục MỘT dòng MỘT đích · tự ẩn khi
  // thiếu dữ liệu · KHÔNG hiện số đếm Project vì số thô đang lẫn rác `__nb:`/fixture).
  const bonDai = (
    <LivingCanvas
      ambient={
        <LightClock
          truong
          // ⛔ 22/08 — ánh sáng ngày là MÔI TRƯỜNG, không phải widget. Home tắt phần đồng hồ đo
          // (cung mặt trời · 05:00/20:00 · 5600K): người dùng phải CẢM được giờ, không phải ĐỌC
          // một thiết bị đo. Giờ vẫn tác động qua nền ambient (`SystemWallpaper`), không mất tin.
          khongDongHo
          headline={greeting.headline}
          signal={greeting.signal}
          tick={minuteTick}
          displayName={displayName}
          onDisplayNameChange={setDisplayName}
        />
      }
      // Dựng lại thẻ tại đây thay vì dùng `resumeNode` (widget khổ đại) — cùng MỘT nguồn dữ liệu
      // `buildResumeCard`, chỉ khác cách trình bày. Trả null ⇒ dải Tiếp tục không mount.
      resume={buildResumeCard(resume, { recentProjects: s.recentProjects, currentProjectId })}
      projects={s.recentProjects}
      inspiration={hasD ? <WeeklyImage images={weeklyImages} eightSecTick={eightSecTick} /> : null}
    />
  );

  /* ── BỀ MẶT NĂM TRẠNG THÁI (chốt Hoà 23/08) ───────────────────────────────────────────────
     Luật ở `nam-trang-thai.ts`; ở đây chỉ CẤP DỮ KIỆN THẬT và CẤP NỘI DUNG.
     ⛔ Mọi cờ dưới đây đều là tín hiệu dữ liệu đang chạy sẵn (`hasC`/`hasG`/…) — KHÔNG cờ nào
     được đặt `true` để màn đỡ trống. Thiếu dữ liệu thì mục biến mất, đó là câu trả lời đúng. */
  const theResume = buildResumeCard(resume, {
    recentProjects: s.recentProjects,
    currentProjectId,
  });

  const tinHieuHome: TinHieu = {
    coDuAn,
    coViecDo: hasR,
    // 🔴 CHƯA CÓ NGUỒN. Bản vẽ EXS-C có ô "Cần tôi xử" ("1 review chờ decision · 1 spec vật
    // liệu thiếu"), nhưng `/api/home/summary` KHÔNG mang trường nào phân biệt được *việc đang
    // chờ CHÍNH TÔI quyết* với *việc nói chung*. Lấy `dueTodayCount` thế vào là đổi nghĩa ô —
    // nó sẽ sáng gần như mọi lúc và hết là tín hiệu. Để `false` ⇒ ô không mọc ra.
    canToiXu: false,
    homNay: hasC,
    mocToi: hasG,
    bieuDo: hasE,
    dongTin: hasI,
    anhTuan: hasD,
    vatLieu: hasH,
    // 🔴 CHƯA CÓ NGUỒN. Home hôm nay không có đường nào lấy được "insight Vitals đáng giá" —
    // `grep` trong `components/home` + `lib/home` = 0. Đặt `false` là NÓI ĐÚNG SỰ THẬT, và nó
    // thi hành thẳng luật của bản chốt: *"không có gì đáng nói thì không tạo card"*. Khi có
    // nguồn thật thì đổi đúng dòng này, không phải dựng thêm ô.
    vitalsDangNoi: false,
  };

  const noiDungO: Partial<Record<MaWidget, ReactNode>> = {
    tiepTuc: hasR ? resumeNode : undefined,
    /* 🔴 23/08 (lỗi ⑧ *"cột Dự án không có thẻ trong khi mọi thứ quanh nó đều có"*) — `KeDuAn`
       tự vẽ tiêu đề + danh sách TRẦN, không đi qua `WidgetCard`. Đứng một mình trong `LivingCanvas`
       thì đúng; đứng cạnh các ô khác trong lưới thì nó là ô DUY NHẤT không theo luật vỏ chung ⇒
       mắt đọc ra một chỗ dựng hụt. Nay bọc `WidgetCard` như mọi ô, và tiêu đề do vỏ cấp — nên
       `KeDuAn` nhận `khongTieuDe` để không in "Dự án" HAI LẦN. */
    keDuAn: (
      <WidgetCard title={tr('Dự án', 'Projects')}>
        <KeDuAn projects={s.recentProjects} khongTieuDe />
      </WidgetCard>
    ),
    homNay: <TodayStrip summary={s} currentUserId={currentUserId} />,
    mocToi: <UpcomingList summary={s} />,
    ghiChu: (
      <QuickNotes
        summary={s}
        armedNoteId={armedNoteId}
        onArmNote={setArmedNoteId}
        refreshKey={notesRefreshKey}
      />
    ),
    /* 🔴 23/08 — `bieuDo` và `dongTin` KHÔNG còn nội dung ở Trang chủ. Hai mã này cũng đã rời
       kế hoạch bày (`nam-trang-thai.ts` D) — lý do đầy đủ ở đó. Tóm tắt: lưới tích luỹ là
       "thống kê phù phiếm" đã bị loại tường minh 02/08; biểu đồ chặng mở cổng bằng *số dự án*
       nên bày ra `3/0 · 0/0 · 0/0`. Bỏ nội dung Ở ĐÂY NỮA (chứ không chỉ bỏ khỏi kế hoạch) để
       không ai nối lại bằng cách thêm một dòng vào kế hoạch mà tưởng là vô hại.
       `StageChart` · `ContributionGrid` · `NewsFeed` GIỮ NGUYÊN — chúng vẫn sống ở bố cục
       `xuongLayout`; đây là quyết định của TRANG CHỦ, không phải xoá widget. */
    anhTuan: <WeeklyImage images={weeklyImages} eightSecTick={eightSecTick} />,
    vatLieu: <WeeklyMaterial item={weeklyMaterial} />,
    // `vitals` cố ý KHÔNG có nội dung — xem `vitalsDangNoi` ở trên.
  };

  /* Hero có đủ ruột để đứng khổ `2x2` không — xem `DuKienHome.heroDayRuot`.
     Thẻ Việc-đang-dở chỉ "đầy" khi nó có thứ để nói ngoài tên dự án: một mốc thời gian thật,
     hoặc nhiều hơn một dự án gần đây để xếp dưới. Không có ⇒ nó là ba dòng chữ, và ba dòng chữ
     KHÔNG được cấp một khung 2×2 để rồi kéo giãn vỏ trắng ra cho bằng khung. */
  const heroDayRuot =
    theResume !== null && theResume.projectName !== null && theResume.daysAgo !== null;

  const beMat = gio === null ? null : (
    <BeMatHome
      duKien={{ tinHieu: tinHieuHome, gio, daQuayLai, heroDayRuot }}
      ambient={
        <LightClock
          truong
          khongDongHo
          headline={greeting.headline}
          signal={greeting.signal}
          tick={minuteTick}
          displayName={displayName}
          onDisplayNameChange={setDisplayName}
        />
      }
      ngaySoKhong={projectTile}
      noiDung={noiDungO}
      vietDangDo={
        theResume
          ? {
              tenDuAn: theResume.projectName,
              nhanChang: null,
              nhanLuc: daysAgoLabel(theResume.daysAgo, en),
              href: resumeHref(theResume),
              // ⛔ Chưa có nguồn tín hiệu ("2 bình luận mới", "1 mục chờ duyệt") ⇒ mảng RỖNG.
              // Rỗng thật thì hàng đó không mọc ra — cấm bịa cho màn đỡ trống.
              tinHieu: [],
            }
          : null
      }
      // Chưa có đường chụp "khoảnh khắc đẹp" ⇒ cổng FAIL-CLOSED: không ảnh, rơi về nền môi
      // trường theo giờ. Xem docstring `BeMatHome.tsx`.
      anhPhien={null}
    />
  );

  const xuongLayout = (
    // NỀN LÀ MẶT PHẲNG CHÍNH (chốt 20/08): nội dung KHÔNG phủ kín màn. Lề ngoài rộng theo bề
    // ngang màn (`clamp` — không breakpoint px), nội dung đứng GIỮA theo chiều dọc, và chiều cao
    // là `min(nội dung, màn)` chứ không ép 100% ⇒ phần dư trả cho nền, không nhồi vào thẻ.
    // Trần bề ngang: trên màn rất rộng, khoảng âm LỚN LÊN thay vì thẻ kéo dãn ra (luật 16/08
    // "size to là BỔ SUNG CHI TIẾT, không phải kéo dãn").
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="grid w-full"
        style={{
          maxWidth: 'min(100%, 1360px)',
          // Cao ĐÚNG chỗ được cấp + hàng `minmax(0,1fr)`: đây là thứ cho phép cụm phụ CUỘN thay
          // vì tràn ra ngoài màn. (Đo 20/08: để `maxHeight` + hàng ẩn `auto` thì cột phụ cao
          // 1112px trong khung 818px — `overflow-y` không bao giờ ăn vì chính nó bị kéo dài ra.)
          // Khoảng âm theo chiều dọc nay nằm ở ĐÁY CỘT PHỤ (mục cao đúng nội dung + `start`)
          // và ở LỀ NGOÀI, không phải ở chỗ cả lưới co lại.
          height: '100%',
          gridTemplateRows: 'minmax(0, 1fr)',
          gridTemplateColumns: cotXuong(cumPhuFinal.length),
          gap: 'calc(var(--gap) * 2)',
        }}
      >
        {/* ── TIÊU ĐIỂM ── cùng MỘT vùng ở CẢ BA trạng thái; ruột đổi, chỗ đứng không đổi.
            `auto` cho dải việc-dở = nó lấy đúng chiều cao của nó, phần còn lại về ô Dự án. */}
        <div
          className="grid min-h-0"
          style={{ gridTemplateRows: bc.banViecDo ? 'auto minmax(0,1fr)' : 'minmax(0,1fr)', gap: 'var(--gap)' }}
        >
          {bc.banViecDo && resumeNode}
          <div className="min-h-0">{projectTile}</div>
        </div>

        {/* ── CỤM PHỤ ── một cột, xếp theo ưu tiên, mục cao ĐÚNG NỘI DUNG (`auto`). Ghi chú là
            mục DUY NHẤT co giãn (`1fr`) vì nó có danh sách + ô nhập; các mục khác không bị kéo
            dãn ⇒ chỗ dư ở đáy cột là NỀN, không phải ruột card rỗng. `alignContent:'start'`
            giữ cụm bám mép trên khi tổng nội dung thấp hơn cột. */}
        <div
          className="flex min-h-0 flex-col overflow-y-auto"
          style={{ gap: 'var(--gap)' }}
        >
          {/* Dải khôi phục mục đã ẨN — cá nhân hoá không cho ẩn vĩnh viễn không lối quay lại
              (luật §9 "MÁY MÌNH": người dùng vẫn phải kiểm soát được, không phải máy quyết
              hộ). Chỉ hiện khi có mục thật sự bị ẩn tay. */}
          {hiddenList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 px-0.5">
              <span className="text-[length:var(--fs-2xs)] text-[var(--t4)]">
                {tr('Đã ẩn:', 'Hidden:')}
              </span>
              {hiddenList.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => widgetPrefs.toggleHidden(m)}
                  className="rounded-[var(--r-1)] px-1.5 py-0.5 text-[length:var(--fs-2xs)] text-[var(--t3)] transition-colors hover:bg-[var(--hover)]"
                  style={{ background: 'var(--field)' }}
                  aria-label={tr(`Hiện lại ${MUC_PHU_LABEL[m][0]}`, `Show ${MUC_PHU_LABEL[m][1]} again`)}
                >
                  + {tr(...MUC_PHU_LABEL[m])}
                </button>
              ))}
            </div>
          )}
          {cumPhuFinal.map((m, i) => {
            const locked = widgetPrefs.LOCKED.includes(m);
            return (
              <div key={m} className="group/widget relative" style={hangPhu(m)}>
                {mucPhuNode(m)}
                {!locked && (
                  <div
                    className="absolute right-1.5 top-1.5 z-20 flex items-center gap-0.5 rounded-[var(--r-1)] p-0.5 opacity-0 shadow-sm transition-opacity focus-within:opacity-100 group-hover/widget:opacity-100"
                    style={{ background: 'var(--nen-mo-card, var(--card))' }}
                  >
                    <button
                      type="button"
                      onClick={() => widgetPrefs.move(m, -1, cumPhuFinal)}
                      disabled={i === 0}
                      aria-label={tr('Đưa lên trên', 'Move up')}
                      title={tr('Đưa lên trên', 'Move up')}
                      className="grid h-6 w-6 place-items-center rounded-[var(--r-1)] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)] disabled:opacity-30"
                    >
                      <ChevronUp size={14} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => widgetPrefs.move(m, 1, cumPhuFinal)}
                      disabled={i === cumPhuFinal.length - 1}
                      aria-label={tr('Đưa xuống dưới', 'Move down')}
                      title={tr('Đưa xuống dưới', 'Move down')}
                      className="grid h-6 w-6 place-items-center rounded-[var(--r-1)] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)] disabled:opacity-30"
                    >
                      <ChevronDown size={14} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => widgetPrefs.pinTop(m, cumPhuFinal)}
                      disabled={i === 0}
                      aria-label={tr('Ghim lên đầu', 'Pin to top')}
                      title={tr('Ghim lên đầu', 'Pin to top')}
                      className="grid h-6 w-6 place-items-center rounded-[var(--r-1)] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)] disabled:opacity-30"
                    >
                      <Pin size={14} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => widgetPrefs.toggleHidden(m)}
                      aria-label={tr(`Ẩn ${MUC_PHU_LABEL[m][0]}`, `Hide ${MUC_PHU_LABEL[m][1]}`)}
                      title={tr('Ẩn khỏi Home', 'Hide from Home')}
                      className="grid h-6 w-6 place-items-center rounded-[var(--r-1)] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
                    >
                      <EyeOff size={14} aria-hidden />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
      {/* 20/08 (COHERENCE-SHELL) — HẠ CỤM XUỐNG DƯỚI HEADER. Trước đây `top-5` + `z-50` đặt cụm
          này ĐÈ LÊN thanh đầu 42px (đo trên app thật 1440×900: cụm chiếm y 20→56, x 1309→1420 —
          phủ đúng chỗ ô tìm dự án và Vitals đứng, `elementFromPoint(1386,20)` trả về cụm này chứ
          không phải nút Vitals ⇒ **bấm Vitals ở Trang chủ không ăn**). Lỗi có TRƯỚC phiếu này
          (VitalsPill dời lên header từ 17/08 đã nằm dưới cụm), chỉ lộ ra khi đo bằng thao tác
          thật. Sửa bằng cách cho cụm bắt đầu NGAY DƯỚI mép header thay vì nới z-index — nới
          z-index chỉ đổi ai thắng, hai thứ vẫn chồng nhau về mặt thị giác. */}
      {/* 21/08 (Hoà chốt "Home header gần như trống") — CỤM GÓC-PHẢI ĐÃ GỠ HẲN. Hai nút từng
          đứng đây về đúng chủ, thay vì nằm rải thành đảo riêng trên Home:
            · VI/EN và Giới thiệu → menu Hồ sơ (avatar góc phải header), cạnh Giao diện/Cài đặt.
              Một mô hình sở hữu: Hoạt động = việc đang chạy · Vitals = việc đáng chú ý bây giờ ·
              Hồ sơ = tôi + tuỳ chọn + cài đặt.
            · Bảng Nhóm & hoạt động KHÔNG mất đường vào — `openDashboardTab('board', …)` còn 4 nơi
              gọi ở `ProjectSelect.tsx`, gồm cả biến thể không kèm dự án. Đã kiểm TRƯỚC khi gỡ.
          Vitals đã dời lên header từ 17/08, nên sau lượt này góc phải Home trống thật. */}

      {/* Lề ngoài 20px (p-5, trước là p-3) — chốt A2 16/08: *"thẻ kính KHÔNG phủ kín màn —
          chừa lề cho nền thở"*. Nền chỉ hiện ở lề + khe giữa thẻ; đó là chỗ nó sống. */}
      {/* LỀ NGOÀI — NỀN LÀ MẶT PHẲNG CHÍNH (chốt 20/08). `p-5` (20px) cũ chỉ đủ cho một lưới
          phủ gần kín màn; nay lề nở theo bề ngang màn nên màn càng rộng thì **khoảng âm càng
          lớn**, không phải thẻ càng dãn ra. `clamp` — không breakpoint px. */}
      <div
        className={isWide ? 'relative z-10 h-full w-full' : 'relative z-10 w-full'}
        style={isWide ? { padding: 'clamp(20px, 2.6vw, 52px) clamp(20px, 3.2vw, 64px)' } : undefined}
      >
        {/* Bốn dải là MẶC ĐỊNH ở màn rộng (§4). `custom` giữ nguyên bố cục hai cột cũ.
            Màn hẹp vẫn dùng bản xếp dọc sẵn có — nó vốn đã là một cột, không phải tường widget. */}
        {/* 23/08 — bề mặt NĂM TRẠNG THÁI là mặc định ở màn rộng. `beMat === null` chỉ xảy ra ở
            lượt dựng đầu (chưa biết giờ, xem `gio`) ⇒ rơi về Living Canvas, không màn trắng.
            `custom` vẫn giữ NGUYÊN VẸN bố cục hai cột cũ cho ai đã quen — đây là đổi MẶC ĐỊNH,
            không phải cắt tính năng. */}
        {isWide ? (laBonDai(cheDo) ? (beMat ?? bonDai) : xuongLayout) : stackedList}
      </div>
    </div>
  );
}
