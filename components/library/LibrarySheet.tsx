'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Search, X, ArrowUp, Plus, Box, Palette, Network, Images, LayoutTemplate,
  Compass, Star, TrendingUp, Folder, Check, Loader2, type LucideIcon,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useFlowStore } from '@/lib/store';
import { getLastUserId } from '@/lib/resume';
import type { StageKey } from '@/lib/library/types';
import { idfcKindOfThumb, IDFC_KIND_LABEL, THUMB_OF_IDFC_KIND, type ThumbKind } from '@/lib/library/thumb-kinds';
import { buildSpecRows, missingSpecCount, matchSpec, type SpecSource } from '@/lib/library/spec-panel';
import {
  BAYS,
  BAY_OF_SHELF,
  COMMON_SHELVES,
  DEFAULT_SHELF,
  LIBRARY_DATA_IS_MOCK,
  MATERIAL_GROUPS,
  MATERIAL_GROUP_SHELF,
  SCOPE_BADGE_TEXT,
  SCOPE_CHIPS,
  STAGE_SHELVES,
  builtinCount,
  itemsFor,
  type ScopeChip,
  type SheetItem,
} from '@/lib/library/shelves';
import { useLibraryDbItems } from '@/lib/library/db-items';
import { loadIdfcStore, hydrateIdfcStore, type StoredIdfc } from '@/lib/library/idfc-store';
import { getPbr } from '@/lib/materials/pbr-store';
import { exportIdfc, IDFC_KINDS, type IdfcKind } from '@/lib/cad/idfc';
import { resolveLibraryItem } from '@/lib/cad/library-item-resolve';
import { useLibrarySheetState } from '@/lib/library/use-library-sheet';
import { useLibraryLocalState } from '@/lib/library/local-state';
import { CLUSTER_SPECS } from '@/lib/cad/workstation-clusters';
import { RawStyle } from '@/components/filemanager/RawStyle';
import { ClusterPanel } from './ClusterPanel';
import { ItemThumb } from './ItemThumb';
import { MaterialFormModal } from '@/components/materials/MaterialFormModal';
import { Object3DToggle } from './Object3DToggle';
import { LIBRARY_SHEET_CSS } from './library-sheet-css';
import { LibraryToastHost, pushLibraryToast } from './LibraryToast';
import { PublishModal } from './PublishModal';
import { BulkIngestMode } from './BulkIngestMode';
import { BUOC_LABEL, nhanBuocMauDangCho, type BuocVatLieu } from './buoc-mau';
import { ColorLibraryScreen } from '@/components/colors/ColorLibraryScreen';
import PanelFlank from '@/components/ui/PanelFlank';
import { AssetWhereUsed } from './AssetWhereUsed';

// 03/08 CHỐT TÊN vòng cuối (docs/CHOT-TEN-CHANG-MODE-2026-08-03.md) — "Vẽ"/"Dựng ảnh" là tên
// round trước, nay đồng bộ theo bộ tên chính thức.
const STAGE_CAPTION: Record<StageKey, [string, string]> = {
  cad: ['Kệ chặng Thiết kế 2D', '2D Design stage shelf'],
  render: ['Kệ chặng Thiết kế 3D', '3D Design stage shelf'],
  present: ['Kệ chặng Trình chiếu', 'Presenting stage shelf'],
};

/** Sự kiện cho canvas/inspector (NGOÀI vùng code G4) tiêu thụ — xem docs/BAO-CAO-G4-LIB.md.
 * 🔴 05/08 (S3): `grep -rn "LIBRARY_INSTANTIATE_EVENT\|if:library-instantiate" app/ components/ lib/`
 * → CHỈ có chỗ PHÁT, **0 nơi NGHE**. Tức kéo-thả món từ kệ hiện chỉ hiện toast chứ chưa rơi
 * xuống bản vẽ thật. Kệ "Văn phòng · Cụm bàn" bên dưới KHÔNG đi đường này — nó gọi thẳng
 * `useCadStore.addEntities()`, nên thả là có hình ngay. Ghi lại để phiên nối canvas biết.
 * ✅ 06/08 (G-M3-14): ĐÃ NỐI. Chỗ nghe = `components/cad/LibraryDropBridge.tsx` (mount trong
 * `CadEditor`), đối chiếu món qua `lib/cad/library-item-resolve.ts` rồi ghi vào ĐÚNG đường
 * `addEntities()` nói trên. `LIBRARY_APPLY_EVENT` (áp preset/vật liệu lên vật đang chọn) thì
 * VẪN CÒN 0 nơi nghe — việc khác, chưa làm, đừng tưởng đã xong theo. */
export const LIBRARY_INSTANTIATE_EVENT = 'if:library-instantiate';
export const LIBRARY_APPLY_EVENT = 'if:library-apply';

/** id kệ cụm bàn — cục bộ, KHÔNG nằm trong `STAGE_SHELVES` (xem lý do ở chỗ render nút kệ). */
const CLUSTER_SHELF_ID = 'cad-clusters';

/** BA NẤC CỠ THẺ (`00-CHOT.md` "TẤM THƯ VIỆN: NỚI 960px + BA NẤC CỠ THẺ", chốt 07/08 chiều) —
 * D5 Render/Blender đều có núm chỉnh cỡ thẻ, không cố định một cỡ. NHỚ lựa chọn qua localStorage,
 * GLOBAL cho cả app (không theo từng kệ/chặng) — chốt chỉ nói "nhớ lựa chọn", không nói theo phạm
 * vi nào; một người dùng quen soi vân ở kệ vật liệu nhiều khả năng cũng muốn cỡ đó ở kệ khác. */
type LibCardSize = 'sm' | 'md' | 'lg';
const CARD_SIZE_KEY = 'if-library-card-size';
const CARD_SIZE_OPTIONS: { id: LibCardSize; label: [string, string] }[] = [
  { id: 'sm', label: ['Nhỏ', 'Small'] },
  { id: 'md', label: ['Vừa', 'Medium'] },
  { id: 'lg', label: ['Lớn', 'Large'] },
];

/** Cửa sổ xem 3D (Object3DWindow) cho asset "Ghế bar Lincoln 327" (proof CW 14/08,
 * `docs/phieu-giao/ghe-3d-window-app.md`) — hình học CHUẨN-NÉT (`chuanNet`, `.obj`+`.mtl`) ưu tiên
 * hơn GLB Trellis thô theo biên phiếu ("có bản chuẩn-nét thì dùng bản đó"). Nhận diện qua TÊN món
 * — kho `LibraryAsset` chưa có cờ "có model 3D xem được" riêng; khi có cấu kiện 3D thứ hai, đường
 * đúng là đọc tag `has3d:` từ `LibraryApiAsset` (`lib/library/db-items.ts`) thay vì so tên ở đây. */
const OBJECT_3D_MODELS: { match: RegExp; glbUrl: string; mtlUrl?: string }[] = [
  { match: /lincoln 327/i, glbUrl: '/library-assets/lincoln-327/lincoln-327-chuannet.obj', mtlUrl: '/library-assets/lincoln-327/lincoln-327-chuannet.mtl' },
];
function object3dModelFor(item: SheetItem): { glbUrl: string; mtlUrl?: string } | null {
  const hit = OBJECT_3D_MODELS.find((m) => m.match.test(item.name));
  return hit ? { glbUrl: hit.glbUrl, mtlUrl: hit.mtlUrl } : null;
}

const BAY_ICON: Record<string, LucideIcon> = {
  'cau-kien': Box,
  'vat-lieu': Palette,
  node: Network,
  anh: Images,
  mau: LayoutTemplate,
};

type DiscoverMode = 'browse' | 'featured' | 'trending';

/** w×d×h chỉ hiện ở nấc Lớn (chốt: "dân thiết kế cần con số này trước tiên"). KHÔNG bịa số — bỏ
 * hẳn kích thước còn thiếu thay vì hiện "—" (khác `.speccol` là bảng có nhãn cố định cho MỘT món
 * đang xem kỹ; đây là dòng phụ trên hàng chục thẻ cùng lúc, thiếu 1 trong 3 số vẫn còn 2 số đúng
 * đáng hiện hơn là một dòng toàn gạch ngang). Trả `null` khi cả 3 đều thiếu để không render dòng
 * rỗng vô nghĩa. */
function formatDims(w: number | null, d: number | null, h: number | null): string | null {
  if (w == null && d == null && h == null) return null;
  const part = (n: number | null) => (n == null ? '—' : String(Math.round(n)));
  return `${part(w)}×${part(d)}×${part(h)} mm`;
}

/**
 * THƯ VIỆN — CARD RỜI trượt lên từ đáy (detached sheet, Hoà chốt 05/08: "không dính bottom, raise
 * lên là card rời bo 4 góc"). Nền ĐẶC, không kính — xem `library-sheet-css.ts`.
 * Đây là **NƠI DUY NHẤT** của thư viện trong app
 * (Hoà chốt 03/08): không có trang `/library` riêng, không có panel thứ hai. Lý do: thư viện chỉ
 * có nghĩa khi KÉO được vào chỗ đang làm — sheet luôn có bàn làm việc thật nằm ngay dưới, còn
 * trang riêng thì không (nó đã phải chế ra "vùng thả mô phỏng", nay xoá hẳn).
 *
 * Port nguyên văn `docs/mocks/mock-if-3chang.html` (xem `library-sheet-css.ts`).
 *
 * Kệ TỰ LỌC theo chặng đang mở (contextual shelf) — chặng lấy từ state thật của app do nơi mount
 * truyền vào (`StageShell active`), KHÔNG đọc query param (`?stage=` đã bỏ 03/08: URL và tab đang
 * sáng có thể lệch nhau ⇒ trạng thái mâu thuẫn). Muốn xem toàn kho thì dùng chip "Tất cả".
 *
 * Ba động tác đúng `docs/SPEC-STAGE-LIBRARIES.md`:
 *  · KÉO–THẢ  = instantiate → 1 bản làm việc, sửa KHÔNG đụng bản gốc (template gốc read-only).
 *  · ÁP       = preset lên vật đang chọn (vật liệu · hatch · preset dựng ảnh).
 *  · PUBLISH  = bản của mình → template mới, PHẢI qua chủ studio duyệt (không tự lên kệ chung).
 *
 * Portal ra `body` — luật panel nổi (`docs/00-CHOT.md` K4: panel kính lồng trong chrome kính thì
 * backdrop blur của cha chặn blur của con).
 */
export function LibrarySheet({ stage = 'render' }: { stage?: StageKey }) {
  const tr = useT();
  const router = useRouter();
  // CHINH-4: truyền stage để hook xử va phím L theo chặng (§4e — CAD: ⇧L, chặng khác: L trần).
  const { open, setOpen, shelfId: requestedShelf, stageOverride } = useLibrarySheetState(stage);
  const { state, addPublishDraft, linkSpec, unlinkSpec } = useLibraryLocalState();

  const activeStage: StageKey = stageOverride ?? stage;
  const [shelfId, setShelfId] = useState<string>(DEFAULT_SHELF[activeStage]);
  const [chip, setChip] = useState<ScopeChip>('all');
  /** Nhóm vật liệu con đang lọc (`docs/mocks/Thư viện.dc.html` khối "NHÓM VẬT LIỆU").
   *  null = không lọc; bấm lại nhóm đang chọn thì bỏ lọc (không cần thêm nút "Tất cả"). */
  const [matGroup, setMatGroup] = useState<ThumbKind | null>(null);
  /** VIỆC .idfc v3 (08/08) — ngăn lọc theo `IdfcKind` TRONG kệ "Cấu kiện (.idfc)"
   * (`common-idfc` gom MỌI loại .idfc đã nhập vào một kệ, xem `idfcItems`) — cùng cơ chế
   * `matGroup` ở trên (chọn lại = bỏ lọc), khác Ở CHỖ trục lọc là `IdfcKind` (12 loại thật của
   * file), không phải `ThumbKind` (hình thức ô xem trước). */
  const [idfcKindFilter, setIdfcKindFilter] = useState<IdfcKind | null>(null);
  /** [marker: mauLaMotBuoc] BƯỚC trong kệ vật liệu (Hoà chốt 16/08: *"màu là 1 BƯỚC chọn vật
   *  liệu"*). Đây KHÔNG phải kệ thứ hai và KHÔNG phải bộ lọc — nó đổi cả vùng nội dung, vì chọn
   *  theo màu là một CÁCH TÌM khác hẳn duyệt theo kệ. Chỉ sống trong kệ vật liệu; rời kệ là về
   *  `duyet` (xem effect dưới) — giữ lại sẽ thành trạng thái ma ở kệ không liên quan. */
  const [buoc, setBuoc] = useState<BuocVatLieu>('duyet');
  /** Món ĐANG CHỌN — mở cột thông số ④ (`docs/mocks/Thư viện.dc.html`, khối CotThongSo). */
  const [picked, setPicked] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [discoverMode, setDiscoverMode] = useState<DiscoverMode>('browse');
  const [publishOpen, setPublishOpen] = useState(false);
  /** `/library/ingest` gộp thành 1 CHẾ ĐỘ của sheet (SPEC-NAVIGATION-MODEL §1) — không trang riêng. */
  const [mode, setMode] = useState<'browse' | 'ingest'>('browse');
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  /* BA NẤC CỠ THẺ — đọc localStorage bằng LAZY INITIALIZER (chạy đúng 1 lần lúc khởi tạo state),
   * KHÔNG dùng effect-đọc riêng như bản đầu. Bản effect-đọc từng có RACE THẬT (bắt được lúc verify
   * browser 07/08 tối): mount lại (đổi route CAD↔3D) → effect-đọc lấy 'lg' từ localStorage rồi
   * `setCardSize('lg')`, nhưng effect-ghi (deps=[cardSize]) chạy CÙNG lượt commit đó với closure
   * `cardSize` còn là 'md' (giá trị khởi tạo, state 'lg' mới chỉ được LỊCH, chưa áp) → ghi ĐÈ 'md'
   * lên đúng lúc vừa đọc được 'lg', xoá mất lựa chọn vừa lưu. Lazy initializer đọc localStorage
   * NGAY trong render đầu tiên (trước khi effect nào chạy) nên không còn hai nguồn ghi tranh nhau.
   * `typeof window` guard vì đây là Client Component vẫn SSR ở server (không phải `dynamic(...,
   * {ssr:false})`) — nhưng component chỉ thật sự HIỂN THỊ sau `mounted` (return null trước đó) nên
   * lệch giá trị đọc được giữa server/client không gây hydration mismatch (output cả hai đều null). */
  const [cardSize, setCardSize] = useState<LibCardSize>(() => {
    if (typeof window === 'undefined') return 'md';
    try {
      const saved = window.localStorage.getItem(CARD_SIZE_KEY);
      if (saved === 'sm' || saved === 'md' || saved === 'lg') return saved;
    } catch {
      // Sandbox/incognito chặn localStorage — im lặng giữ mặc định 'md', không phải lỗi cần báo.
    }
    return 'md';
  });
  useEffect(() => {
    try {
      localStorage.setItem(CARD_SIZE_KEY, cardSize);
    } catch {
      // đã ghi lý do ở lazy initializer, không lặp lại
    }
  }, [cardSize]);

  useEffect(() => setMounted(true), []);

  // Sheet là modal: không để thanh mode phía dưới còn lộ như một nút bấm được nhưng thực ra bị
  // scrim chặn. Nó từng tạo cảm giác công tắc 3D bị lỗi. Đóng sheet thì trả chrome về ngay.
  useEffect(() => {
    document.body.dataset.ifLibraryOpen = open ? 'true' : 'false';
    return () => { delete document.body.dataset.ifLibraryOpen; };
  }, [open]);

  /* ───── Kéo vạch xuống để đóng (card rời, 05/08) ─────
   * Trước đây `.grab` chỉ là vạch TRANG TRÍ — nhìn như kéo được nhưng không có handler nào, đúng
   * kiểu "nút giả" §9 cấm. Nay nó kéo thật: theo ngón tay, thả quá ngưỡng thì đóng, chưa tới thì
   * bật về. Vùng chạm 44px khai ở CSS (§0c mảng 3). Nút ✕ trong header là đường TƯƠNG ĐƯƠNG —
   * kéo không bao giờ là đường duy nhất (G8/K5).
   * Chỉ đụng `transform` (không `opacity`) để không tạo backdrop-root — xem G1 ở library-sheet-css. */
  const dragRef = useRef<{ id: number; startY: number; dy: number } | null>(null);
  const CLOSE_AFTER_PX = 96;

  const onGrabDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!open) return;
    dragRef.current = { id: e.pointerId, startY: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };

  const onGrabMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId || !sheetRef.current) return;
    // Chỉ cho kéo XUỐNG (âm = kéo lên, kẹp về 0) — sheet không cao thêm được.
    d.dy = Math.max(0, e.clientY - d.startY);
    sheetRef.current.style.transform = `translate(-50%, ${d.dy}px) scale(1)`;
  };

  const onGrabUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    if (sheetRef.current) {
      // Trả về CSS: mở thì bật lại vị trí mở, đóng thì CSS tự trượt xuống bằng transition sẵn có.
      sheetRef.current.style.transform = '';
      sheetRef.current.style.transition = '';
    }
    if (d.dy > CLOSE_AFTER_PX) setOpen(false);
  };

  // Đổi chặng → về kệ mặc định của chặng đó (mock: mỗi chặng có 1 `.shrow.on` riêng).
  useEffect(() => {
    setShelfId(DEFAULT_SHELF[activeStage]);
  }, [activeStage]);

  // Mở thẳng vào 1 kệ (ô Vật liệu trong Inspector gọi openLibrarySheet({shelfId:'render-mat'})).
  useEffect(() => {
    if (requestedShelf) setShelfId(requestedShelf);
  }, [requestedShelf]);

  // Đổi kệ → bỏ lọc nhóm vật liệu (nhóm chỉ có nghĩa trong kệ vật liệu; giữ lại sẽ thành bộ
  // lọc vô hình làm lưới trống mà không thấy lý do). Cùng lý do cho ngăn theo IdfcKind.
  useEffect(() => {
    setMatGroup(null);
    setIdfcKindFilter(null);
  }, [shelfId]);

  /* [marker: mauLaMotBuoc] Rời kệ vật liệu → về bước Duyệt. CHỈ reset khi đã sang kệ khác — nếu
     reset vô điều kiện thì cú "vào thẳng bước Màu" ngay dưới sẽ bị chính effect này xoá trong cùng
     lượt commit (đặt shelfId = kệ vật liệu ⇒ effect [shelfId] chạy ⇒ buoc về 'duyet'). */
  useEffect(() => {
    if (shelfId !== MATERIAL_GROUP_SHELF) setBuoc('duyet');
  }, [shelfId]);

  /* [marker: mauLaMotBuoc] Đến từ deep-link `/colors` (route cũ nay chỉ dẫn đường, xem
     `app/colors/page.tsx`): mở thẳng kệ Vật liệu, dừng ở bước "Chọn theo màu". Đặt SAU effect
     `activeStage` ở trên — effect chạy theo thứ tự khai báo, nên kệ mặc định của chặng được ghi
     trước rồi mới bị đè bằng ý định cụ thể của người dùng. */
  useEffect(() => {
    if (!open) return;
    if (nhanBuocMauDangCho()) {
      setShelfId(MATERIAL_GROUP_SHELF);
      setBuoc('mau');
    }
  }, [open]);

  /* VIỆC 1 M-IDFC — kệ "Cấu kiện (.idfc)" đọc KHO THẬT (idfc-store, localStorage), không phải
   * mock ITEMS_BY_SHELF. Nạp lại mỗi lần mở sheet (BulkIngestMode vừa nhập xong → đóng mode →
   * thấy ngay). SheetItem dựng từ meta của file: kind 'block' (ô xem trước vẽ ký hiệu), scope
   * 'studio' (kho localStorage là tầng studio — xem idfc-store.ts). */
  const [idfcItems, setIdfcItems] = useState<StoredIdfc[]>([]);
  useEffect(() => {
    // W0.3: kho `.idfc` nay ở IndexedDB — chờ hydrate xong mới đọc để không hiện bản cầu cũ.
    if (open) void hydrateIdfcStore().then(() => setIdfcItems(loadIdfcStore()));
  }, [open, mode]);
  /* 12/08 (`library-data-that`) — kệ đọc kho THẬT `LibraryAsset` qua `/api/library`
   * (lib/library/db-items.ts), trộn với món built-in trong `itemsFor`. */
  const { dbItems, dbLoaded, refreshDb } = useLibraryDbItems(open);
  const items = useMemo(() => {
    if (shelfId === 'common-idfc') {
      const q = query.trim().toLowerCase();
      return idfcItems
        .filter((s) => !idfcKindFilter || s.meta.kind === idfcKindFilter)
        .map((s): SheetItem => ({
          id: `idfc:${s.meta.code}`, shelfId: 'common-idfc', name: s.meta.name, code: s.meta.code,
          kind: THUMB_OF_IDFC_KIND[s.meta.kind], scope: s.meta.scope ?? 'studio', mechanic: 'keo',
        }))
        .filter((i) => (chip === 'all' || chip === 'studio') && (!q || i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)));
    }
    return itemsFor(activeStage, shelfId, chip, query, matGroup, dbItems);
  }, [activeStage, shelfId, chip, query, matGroup, idfcItems, idfcKindFilter, dbItems]);
  /** Số đếm THẬT trên cột kệ = built-in + món DB của kệ đó (thay `count` mock cũ luôn null). */
  const shelfCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of dbItems) m.set(it.shelfId, (m.get(it.shelfId) ?? 0) + 1);
    return (id: string) => builtinCount(id) + (m.get(id) ?? 0);
  }, [dbItems]);
  const stageShelves = STAGE_SHELVES[activeStage];
  /* Món đang chọn phải LUÔN nằm trong danh sách đang hiện — đổi kệ/lọc mà giữ lại thì cột thông
     số tả một món không còn trên lưới, người dùng không đối chiếu được. Không cần effect riêng:
     lấy từ chính `items` là tự đúng. */
  const pickedItem = useMemo(() => items.find((i) => i.id === picked) ?? null, [items, picked]);

  /* Cột thông số ④ — chốt 07/08 "trượt vào từ phải, 180–220ms, không giật/bật cụp". `.specwrap`
   * (library-sheet-css.ts) animate WIDTH nên PHẢI còn nằm trong DOM suốt lúc đóng, không thể gỡ
   * ngay khi `pickedItem` về null (React tháo DOM tức thì = mất hẳn khung hình đóng = đúng thứ
   * Hoà gọi là "bật cụp"). `displayItem` giữ nội dung cũ sống thêm đúng một nhịp transition, gỡ
   * hẳn khi `onTransitionEnd` báo widthđã về 0 — không hẹn giờ tay (setTimeout dễ lệch với
   * `transition-duration:.1s` của `prefers-reduced-motion`). */
  const [displayItem, setDisplayItem] = useState<SheetItem | null>(null);
  useEffect(() => {
    if (pickedItem) setDisplayItem(pickedItem);
  }, [pickedItem]);
  const specOpen = !!pickedItem;

  /* G-A-01 (VIỆC 3, 07/08) — trước đây `buildSpecRows(displayItem)` gọi KHÔNG kèm `spec`, nên
   * Hãng/Đơn vị/Giá LUÔN hiện "chưa có nguồn" dù `ProductSpec` khớp mã đã có sẵn trong DB (kiểm
   * bằng `grep -n "buildSpecRows(displayItem)"` trước khi sửa: 1 tham số, xem lịch sử dòng này).
   * Tải MỘT LẦN khi sheet mở lần đầu (không tải lại mỗi lần đổi món chọn) — cùng khuôn
   * `MaterialsScreen.tsx` `fetch('/api/specs')`, không route riêng.
   * `w`/`d`/`hUp` thêm vào (VIỆC 2, chốt 07/08 chiều) cho dòng kích thước ở nấc thẻ LỚN — API
   * `GET /api/specs` (`lib/server/specs.ts` `specToDto`) đã trả sẵn 3 trường này, chỉ chưa được
   * bắt ở đây; không cần sửa route hay `lib/`. */
  const [specs, setSpecs] = useState<{ id: string; name: string; sku: string | null; brand: string | null; unit: string | null; priceVnd: number | null; w: number | null; d: number | null; hUp: number | null }[] | null>(null);
  useEffect(() => {
    if (!open || specs !== null) return;
    let cancelled = false;
    fetch('/api/specs')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.specs)) setSpecs(data.specs);
      })
      .catch(() => {
        if (!cancelled) setSpecs([]); // lỗi mạng = coi như chưa có nguồn, KHÔNG chặn mở panel
      });
    return () => {
      cancelled = true;
    };
  }, [open, specs]);

  /* 08/08 — mock màn 01 muốn CTA "Thêm vật liệu mới" mở panel TẠO TAY theo template (form 1 món),
     KHÁC với "Nạp hàng loạt" (thả nhiều file — vẫn giữ nguyên làm tab riêng, không xoá, đúng
     nguyên tắc không xoá đường đã có). Đây là 2 nhu cầu thật khác nhau (tay-nhập-1-món vs
     thả-nhiều-file), không phải trùng "một cỗ máy hai cửa" — MaterialFormModal (components/
     materials/, tái dùng nguyên, không viết form thứ hai) đã tồn tại đúng cho ca này.
     POST tạo mới KHÔNG cần quyền admin (chỉ PATCH/DELETE sửa-xoá món có sẵn mới cần —
     app/api/specs/[id]/route.ts requireAdmin) — đã kiểm trước khi nối, an toàn cho mọi user. */
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  /* R? (20/08) — "Dùng ảnh này cho dự án" (phiếu Reference/Library UI, phần đầu Golden Journey
   * Hoà chốt: asset X dùng Project A → reuse Project B → where-used thấy cả A/B). Gọi
   * `POST /api/project-asset-usage` (route do worker khác dựng song song, KHÔNG đụng ở đây —
   * chỉ fetch theo contract đã thống nhất). CHỈ hiện khi:
   *  · đang mở MỘT dự án thật (`currentProjectId`, đọc REACTIVE qua hook — `activeProjectRouteId()`
   *    là hàm thuần đọc `getState()` một lần, KHÔNG re-render khi store đổi trong lúc sheet mở).
   *  · món đang xem là `LibraryAsset` THẬT trong DB (`SheetItem.id` tiền tố `db:` —
   *    `lib/library/db-items.ts:87`; món built-in/mock KHÔNG có hàng `LibraryAsset` để trỏ tới).
   * MVP: `usage` cố định `'ref-render'` (giá trị hợp lệ trong `LIBRARY_USAGES`,
   * `lib/server/library-save.ts:17`) — CHƯA có picker chọn usage, xem báo cáo phiên. */
  const projectId = useFlowStore((s) => s.currentProjectId);
  const [attachedUsage, setAttachedUsage] = useState<Record<string, true>>({});
  const [attachBusyId, setAttachBusyId] = useState<string | null>(null);
  const [whereUsedRefresh, setWhereUsedRefresh] = useState(0);

  const dbAssetIdOf = (item: SheetItem | null): string | null =>
    item && item.id.startsWith('db:') ? item.id.slice(3) : null;

  const attachToProject = async (item: SheetItem) => {
    const assetId = dbAssetIdOf(item);
    if (!assetId || !projectId) return;
    setAttachBusyId(assetId);
    try {
      const addedBy = useFlowStore.getState().user?.id ?? getLastUserId() ?? '';
      const r = await fetch('/api/project-asset-usage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId, assetId, usage: 'ref-render', addedBy }),
      });
      if (r.status === 409) {
        // Đã gắn rồi (cùng project+asset+usage) — KHÔNG phải lỗi, chỉ nói nhẹ (§9: không báo đỏ
        // cho việc người dùng bấm lại một thao tác đã thành công trước đó).
        setAttachedUsage((prev) => ({ ...prev, [assetId]: true }));
        pushLibraryToast(tr(`"${item.name}" đã gắn vào dự án này rồi`, `"${item.name}" is already linked to this project`));
        return;
      }
      if (!r.ok) {
        pushLibraryToast(tr(`Không gắn được "${item.name}" — thử lại sau`, `Couldn't link "${item.name}" — try again`));
        return;
      }
      setAttachedUsage((prev) => ({ ...prev, [assetId]: true }));
      setWhereUsedRefresh((n) => n + 1);
      pushLibraryToast(tr(`Đã dùng "${item.name}" cho dự án này`, `"${item.name}" is now used in this project`));
    } catch {
      pushLibraryToast(tr(`Không gắn được "${item.name}" — kiểm tra mạng`, `Couldn't link "${item.name}" — check your connection`));
    } finally {
      setAttachBusyId(null);
    }
  };

  /** Cấu kiện .idfc đang xem (nếu món chọn thuộc kệ common-idfc) — nguồn commerce/pbr THẬT từ file. */
  const displayIdfc = useMemo(
    () => (displayItem?.shelfId === 'common-idfc' ? idfcItems.find((s) => `idfc:${s.meta.code}` === displayItem.id) ?? null : null),
    [displayItem, idfcItems],
  );

  /** VIỆC 4 (G-A-01 mở rộng, 08/08) — gán TAY thắng khớp mã tự động khi người dùng đã chọn (họ
   * chọn có chủ đích, không để máy tự đoán lại đè lên); `.idfc` file-embedded vẫn đứng trên cùng
   * (dữ liệu đi THEO FILE, không phải lựa chọn cục bộ của người xem). */
  const linkedSpecId = displayItem ? state.specLinks[displayItem.id] : undefined;
  const linkedSpec = linkedSpecId ? specs?.find((s) => s.id === linkedSpecId) : undefined;

  const displaySpecSource: SpecSource | undefined = useMemo(() => {
    // .idfc mang sẵn mặt thương mại — ưu tiên nó (giá đi THEO FILE giữa các dự án, G-M16-03);
    // thiếu thì rơi về khớp sku trong DB như cũ.
    if (displayIdfc?.commerce) {
      const c = displayIdfc.commerce;
      return { supplier: c.brand ?? c.vendor ?? null, unit: c.unit ?? null, priceVnd: c.priceVnd ?? null };
    }
    if (linkedSpec) return { supplier: linkedSpec.brand, unit: linkedSpec.unit, priceVnd: linkedSpec.priceVnd };
    if (!displayItem || !specs?.length) return undefined;
    const hit = matchSpec(displayItem.code, specs);
    if (!hit) return undefined;
    return { supplier: hit.brand, unit: hit.unit, priceVnd: hit.priceVnd };
  }, [displayItem, displayIdfc, specs, linkedSpec]);

  const displaySpecRows = useMemo(() => {
    if (!displayItem) return [];
    /* VIỆC 4 M-IDFC (G-M17-01 vòng 2) — nối tham số `surface` mà spec-panel.ts khai sẵn từ đầu
     * nhưng 0 nơi truyền (M-VAT-LIEU-2-OUT bảng VIỆC 4): Độ nhám/Độ bóng đọc từ NGUỒN THẬT theo
     * bảng nguồn-của-trường — MaterialPbr (kho pbr-store theo matId=code), .idfc nhúng pbr thì
     * pbr nhúng thắng. Độ bóng CHỈ hiện khi có clearcoat thật (không suy 1−nhám — hai đại lượng
     * vật lý khác nhau, bịa là sai kiểu N4). */
    // v2: pbr nằm trong RUỘT theo loại — material mang thẳng, component mang qua geom3d.
    const idfcPbr = displayIdfc?.body.type === 'material'
      ? displayIdfc.body.pbr
      : displayIdfc?.body.type === 'component'
        ? (displayIdfc.body.geom3d?.pbr ?? (displayIdfc.body.geom3d?.matId ? getPbr(displayIdfc.body.geom3d.matId) : null))
        : null;
    const pbrHit = idfcPbr ?? getPbr(displayItem.code);
    const surface = pbrHit
      ? { roughness: pbrHit.roughness ?? null, gloss: pbrHit.clearcoat ? pbrHit.clearcoat.value : null }
      : undefined;
    return buildSpecRows(displayItem, displaySpecSource, surface);
  }, [displayItem, displayIdfc, displaySpecSource]);
  /** Nhãn kệ đang mở — dùng cho dòng đếm ở chân sheet ("N mục trong kệ …", mock thanh trạng thái). */
  const activeShelf = [...stageShelves, ...COMMON_SHELVES].find((s) => s.id === shelfId);
  const spotlightItem = items[0] ?? null;
  const discoverItems = useMemo(() => {
    if (discoverMode === 'trending') return items.filter((item) => item.recent).concat(items.filter((item) => !item.recent));
    if (discoverMode === 'featured') return items.slice(0, 4);
    return items;
  }, [discoverMode, items]);

  /**
   * 06/08 (G-M3-14) — SỬA LỜI BÁO NÓI DỐI. Trước: phát sự kiện xong là toast "Đã tạo bản làm
   * việc…" VÔ ĐIỀU KIỆN, trong khi **0 nơi nghe** ⇒ bản vẽ trống trơn mà app khẳng định đã xong.
   * Nay: `detail.claimed` do nơi NGHE bật lên (đồng bộ ngay trong listener — `dispatchEvent`
   * chạy đồng bộ nên đọc được ngay dòng sau). Có người nhận ⇒ ĐỂ HỌ báo kết quả thật (thả được
   * mấy nét / chưa có hình cho món này — xem `components/cad/LibraryDropBridge.tsx`). Không ai
   * nhận ⇒ nói thẳng là màn đang mở chưa đón được, kèm việc làm tiếp.
   */
  const instantiate = (item: SheetItem) => {
    /* R1 (19/08): specId đi kèm sự kiện thả — entity rơi xuống bản vẽ mang đúng FK mềm
     * `ProductSpec.id` để BOQ hết `missing-specId-item` cho món có mã. Ưu tiên ĐÚNG như cột
     * thông số ④: gán tay (`specLinks` — chỉ nhận khi spec còn tồn tại trong kho) thắng khớp mã
     * tự động (`matchSpec`, CÙNG hàm — không đẻ đường so khớp thứ hai). Không có ⇒ để trống,
     * KHÔNG bịa. */
    const linked = state.specLinks[item.id];
    const linkedOk = linked && specs?.some((s) => s.id === linked) ? linked : undefined;
    const specId = linkedOk ?? (specs?.length ? matchSpec(item.code, specs)?.id : undefined);
    const detail: SheetItem & { claimed?: boolean; specId?: string } = { ...item, specId, claimed: false };
    window.dispatchEvent(new CustomEvent(LIBRARY_INSTANTIATE_EVENT, { detail }));
    if (detail.claimed) return;
    pushLibraryToast(
      tr(
        `Chưa thả "${item.name}" xuống được — màn đang mở không có bản vẽ. Mở chặng Thiết kế 2D rồi thả lại.`,
        `Can't place "${item.name}" here — this screen has no drawing. Open the 2D Design stage and try again.`,
      ),
    );
  };

  const applyPreset = (item: SheetItem) => {
    window.dispatchEvent(new CustomEvent(LIBRARY_APPLY_EVENT, { detail: item }));
    pushLibraryToast(tr(`Đã áp "${item.name}" lên vật đang chọn`, `Applied "${item.name}" to the current selection`));
  };

  const use = (item: SheetItem) => (item.mechanic === 'ap' ? applyPreset(item) : instantiate(item));

  if (!mounted) return null;

  return createPortal(
    <div className="if-lib-root" data-card-size={cardSize}>
      <RawStyle css={LIBRARY_SHEET_CSS} />

      <button
        type="button"
        className="scrim"
        data-open={open}
        aria-label={tr('Đóng Thư viện', 'Close library')}
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />

      <div
        className="lib nen-mo-sheet"
        data-open={open}
        role="dialog"
        aria-modal={open}
        aria-label={tr('Thư viện', 'Library')}
        aria-hidden={!open}
        ref={sheetRef}
        // Sheet luôn nằm trong DOM (để có hiệu ứng trượt); khi đóng phải khoá hẳn tiêu điểm bàn
        // phím, nếu không Tab vẫn chui vào sheet vô hình — lỗi a11y thật, không phải lý thuyết.
        {...(!open ? { inert: '' as unknown as boolean } : {})}
      >
        <div
          className="grab"
          aria-hidden
          onPointerDown={onGrabDown}
          onPointerMove={onGrabMove}
          onPointerUp={onGrabUp}
          onPointerCancel={onGrabUp}
        >
          <i />
        </div>

        <div className="libh">
          <h3>{tr('Thư viện', 'Library')}</h3>
          {/* VIỆC 7b (07/08) — `ITEMS_BY_SHELF`/`count` là dữ liệu mẫu (lib/library/shelves.ts
             chưa nối `/api/library` thật). Trước đây giao diện bày y như hàng thật (số đếm
             1449/46/12…, mã món) — không cách nào người dùng phân biệt. Nhãn này là chỗ DUY NHẤT
             cần gỡ khi nối kho thật (đi cùng `LIBRARY_DATA_IS_MOCK`). */}
          {LIBRARY_DATA_IS_MOCK && (
            <span className="mocktag" title={tr('Chưa nối kho thật — số đếm và món trên kệ là dữ liệu mẫu để dựng giao diện.', 'Not linked to the real catalog yet — shelf counts and items are sample data.')}>
              {tr('Dữ liệu mẫu', 'Sample data')}
            </span>
          )}
          {mode === 'browse' && (
            <span className="srch">
              <Search size={13} strokeWidth={1.75} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr('Tìm trong kho…', 'Search the store…')}
                aria-label={tr('Tìm trong kho', 'Search the store')}
              />
            </span>
          )}
          <span className="modeseg" role="group" aria-label={tr('Chế độ', 'Mode')}>
            <button type="button" className={mode === 'browse' ? 'on' : ''} aria-pressed={mode === 'browse'} onClick={() => setMode('browse')}>
              {tr('Duyệt kho', 'Browse')}
            </button>
            <button type="button" className={mode === 'ingest' ? 'on' : ''} aria-pressed={mode === 'ingest'} onClick={() => setMode('ingest')}>
              {tr('Nạp hàng loạt', 'Bulk add')}
            </button>
          </span>
          <button type="button" className="cx" onClick={() => setOpen(false)} aria-label={tr('Đóng', 'Close')}>
            <X size={15} strokeWidth={1.75} />
          </button>
        </div>

        {mode === 'ingest' ? (
          <BulkIngestMode onDone={() => { setMode('browse'); refreshDb(); }} />
        ) : (
        <div className="libbody">
          {/* p3 07/08 — tay cầm thu/mở dùng chung (PanelFlank), Hoà chốt nhân bản mẫu chặng
              Trình chiếu cho toàn hệ. Kệ 214px là panel TO NHẤT chưa thu được (đo 0/7 file). */}
          <PanelFlank side="left" storageKey="library.shelf" label={tr('kệ thư viện', 'library shelves')}>
          <div className="shelf">
            {/* VIỆC 2 M-IDFC (07/08, Hoà chốt "gộp về MỘT tấm, chia kệ theo loại") — cột kệ nhóm
               theo 4 NGĂN Cấu kiện · Vật liệu · Node · Ảnh tham chiếu (+ ngăn tạm "Mẫu & hồ sơ"
               cho kệ template chưa được chốt xếp đâu — xem BAYS, lib/library/shelves.ts). Kệ vẫn
               TỰ LỌC THEO CHẶNG như cũ: danh sách đưa vào ngăn = kệ chặng đang mở ∪ kệ chung —
               đổi chặng thì món trong ngăn đổi theo, ngăn là tầng NHÓM chứ không phải tầng dữ liệu.
               Kệ "Văn phòng · Cụm bàn" (S3) giữ nguyên tính chất sinh-lúc-chạy, chỉ xếp vào ngăn
               Cấu kiện qua BAY_OF_SHELF['cad-clusters'] — không nhét vào shelves.ts (lý do cũ:
               cụm sinh theo tham số, không có SheetItem tĩnh nào mô tả đúng). */}
            {BAYS.map((bay) => {
              const inBay = [...stageShelves, ...COMMON_SHELVES].filter((s) => BAY_OF_SHELF[s.id] === bay.id);
              const clusterHere = bay.id === 'cau-kien' && activeStage === 'cad';
              if (!inBay.length && !clusterHere) return null;
              return (
                <div key={bay.id}>
                  <div className="shcap">
                    {(() => { const Icon = BAY_ICON[bay.id] ?? Folder; return <Icon size={12} strokeWidth={1.8} aria-hidden />; })()}
                    {tr(bay.label[0], bay.label[1])}
                  </div>
                  {inBay.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      className={s.id === shelfId ? 'shrow on' : 'shrow'}
                      aria-current={s.id === shelfId}
                      onClick={() => setShelfId(s.id)}
                    >
                      {(() => { const Icon = BAY_ICON[bay.id] ?? Folder; return <Icon className="shelficon" size={15} strokeWidth={1.65} aria-hidden />; })()}
                      {tr(s.label[0], s.label[1])}
                      <span className="c">{s.id === 'common-idfc' ? idfcItems.length : shelfCount(s.id)}</span>
                    </button>
                  ))}
                  {/* [marker: thuVienChiaKe] GALLERY LÀ **MẶT TUYỂN CHỌN CỦA KỆ ẢNH**, không phải
                      kệ thứ sáu (`docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §4, và §1: Gallery ⛔ không
                      lên rail). Trước 17/08 nó chỉ tới được qua route `/library/gallery` đứng rời,
                      nên quan hệ "nó là một mặt của kệ này" không nhìn thấy ở đâu cả.
                      Cố ý KHÔNG dựng thành `.shrow` và KHÔNG có số đếm: `.shrow` nghĩa là *một kệ
                      chọn được*, đeo lên đây là biến nó thành đúng cái kệ riêng mà chốt vừa gỡ.
                      Đây là một LỐI RA — chữ nhạt, có mũi tên, nằm dưới danh sách kệ của ngăn. */}
                  {bay.id === 'anh' && (
                    <button
                      type="button"
                      onClick={() => { setOpen(false); router.push('/library/gallery'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                        minHeight: 'var(--tap)', padding: '0 8px', cursor: 'pointer',
                        border: 'none', background: 'transparent', textAlign: 'left',
                        fontSize: 'var(--fs-2xs)', color: 'var(--t3)',
                      }}
                    >
                      <Images size={13} strokeWidth={1.65} aria-hidden />
                      {tr('Gallery — bản tuyển chọn', 'Gallery — the curated view')}
                      <ArrowUp size={12} strokeWidth={1.9} aria-hidden style={{ marginLeft: 'auto', transform: 'rotate(45deg)' }} />
                    </button>
                  )}
                  {clusterHere && (
                    <button
                      type="button"
                      className={shelfId === CLUSTER_SHELF_ID ? 'shrow on' : 'shrow'}
                      aria-current={shelfId === CLUSTER_SHELF_ID}
                      onClick={() => setShelfId(CLUSTER_SHELF_ID)}
                    >
                      <Box className="shelficon" size={15} strokeWidth={1.65} aria-hidden />
                      {tr('Văn phòng · Cụm bàn', 'Office · Desk clusters')}
                      <span className="c">{CLUSTER_SPECS.length}</span>
                    </button>
                  )}
                </div>
              );
            })}

            {/* NGĂN THEO LOẠI (.idfc v3, 08/08) — chỉ hiện ở kệ "Cấu kiện (.idfc)" (`common-idfc`
               gom MỌI IdfcKind vào một kệ, khác kệ vật liệu chỉ có 6 loại vật liệu). Cùng cơ chế
               bấm-lại-để-bỏ-lọc như NHÓM VẬT LIỆU ngay dưới — dùng chung class `.subrow`, không
               dựng CSS thứ hai. */}
            {shelfId === 'common-idfc' && (
              <>
                <div className="shcap">{tr('Ngăn theo loại', 'By kind')}</div>
                {IDFC_KINDS.map((k) => (
                  <button
                    type="button"
                    key={k}
                    className={idfcKindFilter === k ? 'subrow on' : 'subrow'}
                    aria-pressed={idfcKindFilter === k}
                    onClick={() => setIdfcKindFilter((cur) => (cur === k ? null : k))}
                  >
                    {tr(IDFC_KIND_LABEL[k][0], IDFC_KIND_LABEL[k][1])}
                  </button>
                ))}
              </>
            )}

            {/* NHÓM VẬT LIỆU (mock màn 01) — chỉ hiện ở kệ vật liệu, lọc THẬT theo `kind` của món. */}
            {shelfId === MATERIAL_GROUP_SHELF && (
              <>
                <div className="shcap">{tr('Nhóm vật liệu', 'Material groups')}</div>
                {MATERIAL_GROUPS.map((g) => (
                  <button
                    type="button"
                    key={g.kind}
                    className={matGroup === g.kind ? 'subrow on' : 'subrow'}
                    aria-pressed={matGroup === g.kind}
                    onClick={() => setMatGroup((cur) => (cur === g.kind ? null : g.kind))}
                  >
                    {tr(g.label[0], g.label[1])}
                  </button>
                ))}
              </>
            )}

            {/* CTA đáy cột kệ (mock màn 01: nút accent "Thêm vật liệu mới") — mở form TẠO TAY 1
                món (MaterialFormModal), đúng ý mock. "Nạp hàng loạt" giữ nguyên làm tab riêng
                (không xoá đường đã có) cho ca thả nhiều file. Chỉ hiện ở kệ vật liệu. */}
            {shelfId === MATERIAL_GROUP_SHELF && (
              <div className="shelfcta">
                <button type="button" className="create-quiet" onClick={() => setShowAddMaterial(true)} title={tr('Thêm vật liệu mới', 'Add new material')} aria-label={tr('Thêm vật liệu mới', 'Add new material')}>
                  <Plus size={16} strokeWidth={1.8} />
                </button>
              </div>
            )}
          </div>
          </PanelFlank>

          <div className="libmain">
            {/* [marker: mauLaMotBuoc] DẢI HAI BƯỚC — chỉ hiện ở kệ Vật liệu.
                Vì sao nó ở ĐÂY chứ không nằm trong cột kệ bên trái: cột kệ là *chọn kho nào*, đứng
                cạnh "Nhóm vật liệu" thì mắt đọc màu thành một BỘ LỌC nữa. Đặt trên thân, nó đọc
                đúng nghĩa *cùng một việc — chọn vật liệu — làm theo hai đường*. Không token màu
                mới: bước đang mở nhận diện bằng chữ đậm + dải mực đáy (hình dạng, không phải màu). */}
            {shelfId === MATERIAL_GROUP_SHELF && (
              <div
                role="tablist"
                aria-label={tr('Bước chọn vật liệu', 'Material selection step')}
                style={{ display: 'flex', gap: 4, padding: '8px 12px 0', borderBottom: '1px solid var(--vien-mo)' }}
              >
                {(['duyet', 'mau'] as BuocVatLieu[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    role="tab"
                    aria-selected={buoc === b}
                    onClick={() => setBuoc(b)}
                    style={{
                      minHeight: 'var(--tap)', padding: '0 10px 6px', cursor: 'pointer',
                      border: 'none', background: 'transparent', fontSize: 'var(--fs-ui)',
                      borderBottom: buoc === b ? '2px solid var(--t1)' : '2px solid transparent',
                      color: buoc === b ? 'var(--t1)' : 'var(--t3)',
                      fontWeight: buoc === b ? 'var(--fw-semi)' : 'var(--fw-normal)',
                    }}
                  >
                    {b === 'mau' ? <Palette size={13} strokeWidth={1.8} aria-hidden style={{ marginRight: 5, verticalAlign: -2 }} /> : null}
                    {tr(BUOC_LABEL[b].vi, BUOC_LABEL[b].en)}
                  </button>
                ))}
              </div>
            )}
            {shelfId === MATERIAL_GROUP_SHELF && buoc === 'mau' ? (
              /* Màn Bảng màu cũ (`/colors`) render NGUYÊN VẸN ở đây — không chép lại, không dựng
                 bản thứ hai. Route `/colors` giữ nguyên nhưng chỉ còn dẫn vào đúng bước này. */
              <div style={{ minHeight: 0, flex: 1, overflowY: 'auto' }}>
                <ColorLibraryScreen />
              </div>
            ) : shelfId === CLUSTER_SHELF_ID ? (
              /* Cụm bàn — panel riêng: có núm chỉnh + XEM TRƯỚC bắt buộc trước khi thả, nên không
                 dùng lưới thẻ `.it` (thẻ chỉ hợp với món tĩnh bấm-là-dùng). Thả xong đóng sheet để
                 KTS thấy ngay cụm vừa rơi xuống bản vẽ. */
              <ClusterPanel onInserted={() => setOpen(false)} />
            ) : (
            <>
            <div className="discoverbar" role="tablist" aria-label={tr('Khám phá thư viện', 'Library discovery')}>
              <button type="button" role="tab" aria-selected={discoverMode === 'browse'} className={discoverMode === 'browse' ? 'on' : ''} onClick={() => setDiscoverMode('browse')}>
                <Folder size={14} strokeWidth={1.75} />{tr('Tất cả', 'All')}
              </button>
              <button type="button" role="tab" aria-selected={discoverMode === 'featured'} className={discoverMode === 'featured' ? 'on' : ''} onClick={() => setDiscoverMode('featured')}>
                <Star size={14} strokeWidth={1.75} />{tr('Nổi bật', 'Featured')}
              </button>
              <button type="button" role="tab" aria-selected={discoverMode === 'trending'} className={discoverMode === 'trending' ? 'on' : ''} onClick={() => setDiscoverMode('trending')}>
                {/* R9a (19/08) nhãn-nói-thật: trước là "Top tuần này" — code không có logic tuần
                    (chỉ xếp món `recent` lên đầu, cờ này kho built-in chưa set). Nhãn nói đúng
                    hành vi thật; có lịch sử dùng thật thì mới được gọi lại là "Top tuần". */}
                <TrendingUp size={14} strokeWidth={1.75} />{tr('Gần đây trước', 'Recent first')}
              </button>
            </div>
            {spotlightItem && discoverMode !== 'browse' && (
              <button type="button" className="library-spotlight" onClick={() => setPicked(spotlightItem.id)}>
                <ItemThumb item={spotlightItem} />
                <span className="spotlight-copy">
                  {/* R9a (19/08) nhãn-nói-thật: trước là "Chọn cho dự án này" — spotlight chỉ là
                      items[0] (dòng 414), không có logic ngữ cảnh dự án nào. Khi nào có máy chọn
                      theo Thẻ DNA/ProjectProfile thật thì mới được hứa "cho dự án này". */}
                  <span className="spotlight-kicker"><Compass size={13} strokeWidth={1.75} />{tr('Mục đầu kệ', 'First on the shelf')}</span>
                  <strong>{spotlightItem.name}</strong>
                  <small>{tr('Xem thông số, kéo vào bàn làm việc hoặc áp cho lựa chọn hiện tại.', 'Review specs, drag to the workspace, or apply to the current selection.')}</small>
                </span>
                <span className="spotlight-open" aria-hidden>↗</span>
              </button>
            )}
            <div className="chips" role="group" aria-label={tr('Lọc theo phạm vi', 'Filter by scope')}>
              {SCOPE_CHIPS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={c.id === chip ? 'chip on' : 'chip'}
                  aria-pressed={c.id === chip}
                  onClick={() => setChip(c.id)}
                >
                  {tr(c.label[0], c.label[1])}
                </button>
              ))}
            </div>

            {/* BA NẤC CỠ THẺ (chốt 07/08 chiều) — hàng riêng, dồn phải, KHÔNG chung `.chips`
                (xem lý do ở docblock `.densitybar` trong library-sheet-css.ts). Ẩn ở kệ cụm bàn
                (nhánh ClusterPanel phía trên, không render tới đây) vì kệ đó không dùng lưới `.it`. */}
            <div className="densitybar">
              <span className="sizeseg" role="group" aria-label={tr('Cỡ thẻ', 'Card size')}>
                {CARD_SIZE_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    className={cardSize === opt.id ? 'on' : ''}
                    aria-pressed={cardSize === opt.id}
                    onClick={() => setCardSize(opt.id)}
                  >
                    {tr(opt.label[0], opt.label[1])}
                  </button>
                ))}
              </span>
            </div>

            <div className="grid">
              {discoverItems.length === 0 && (
                /* 12/08 — kệ RỖNG THẬT (kho chưa có món, không phải do lọc) thì nói rõ + đưa
                   đường nhập ngay tại chỗ, không để màn trắng câm (X2/§9). Còn đang lọc/tìm thì
                   giữ câu "không khớp bộ lọc" như cũ. */
                query.trim() || chip !== 'all' || matGroup || idfcKindFilter ? (
                  <p className="empty">{tr('Không có món nào khớp bộ lọc.', 'Nothing matches this filter.')}</p>
                ) : (
                  <div className="empty" style={{ display: 'grid', gap: 10, justifyItems: 'start' }}>
                    <span>
                      {!dbLoaded
                        ? tr('Đang đọc kho…', 'Loading the store…')
                        : tr(
                            'Kệ này chưa có món nào trong kho. Nhập ảnh/tài sản của studio để lấp kệ.',
                            'This shelf has nothing in the store yet. Import your studio assets to fill it.',
                          )}
                    </span>
                    {dbLoaded && (
                      <button type="button" className="pub" onClick={() => setMode('ingest')}>
                        <Plus size={13} strokeWidth={2} />
                        {tr('Nhập vào kho', 'Import to store')}
                      </button>
                    )}
                  </div>
                )
              )}
              {discoverItems.map((it) => {
                /* w×d×h chỉ tính khi nấc LỚN đang bật (tránh dò khớp mã vô ích ở nấc khác) —
                   xem `formatDims()` cho luật "không bịa số". */
                const dims = cardSize === 'lg' && specs?.length ? matchSpec(it.code, specs) : undefined;
                const dimsLabel = dims ? formatDims(dims.w, dims.d, dims.hUp) : null;
                /* VIỆC 7 (phần còn thiếu, 08/08) — dấu hiệu cấu kiện CÓ THAM SỐ (co giãn được,
                   `BlockDef.variants`, xem `SHAPE-SCHEMA.md` B2.5) khác HÌNH CỨNG. Cùng gate
                   nấc LỚN như dims phía trên — tránh gọi `resolveLibraryItem` cho mọi thẻ ở mọi
                   nấc (dò khớp tên là việc không rẻ, chạy hàng chục thẻ mỗi lần đổi bộ lọc). Chỉ
                   kho ① (`BLOCKS`, giữ danh tính) mới có field `variants` — kho ②(.dxf) không có
                   khái niệm biến thể nên không tính, KHÔNG đoán bừa "có tham số" cho nó. */
                const paramHit = cardSize === 'lg' ? resolveLibraryItem({ name: it.name, code: it.code, kind: it.kind }, null) : null;
                const hasVariants = paramHit?.via === 'blockdef' && !!paramHit.def.variants?.length;
                return (
                /* Bấm = CHỌN (mở cột thông số ④), KHÔNG dùng luôn như trước. Mock đặt hành động
                   vào cột thông số ("Dùng cho vật đang chọn"), và đó cũng là hành vi đúng: trước
                   đây bấm nhầm một thẻ là ÁP THẲNG vật liệu lên vật đang chọn, không kịp xem
                   mã/giá, không hoàn tác được trong tấm. Bấm lại thẻ đang chọn = bỏ chọn (đóng
                   cột), khỏi cần nút đóng. Kéo–thả giữ nguyên; bấm đúp = dùng ngay (lối tắt cho
                   người đã quen). */
                <button
                  type="button"
                  key={it.id}
                  className={it.id === picked ? 'it on' : 'it'}
                  draggable
                  title={tr('Bấm để xem thông số · bấm đúp để dùng', 'Click for specs · double-click to use')}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-if-library-item', it.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onDragEnd={(e) => {
                    // Thả ra ngoài sheet = dùng món (canvas thật nối sau — xem báo cáo).
                    if (e.dataTransfer.dropEffect !== 'none') instantiate(it);
                  }}
                  onClick={() => setPicked((cur) => (cur === it.id ? null : it.id))}
                  onDoubleClick={() => use(it)}
                  aria-pressed={picked === it.id}
                >
                  {/* Ô xem trước theo BẬC THANG ảnh-thật → quả-cầu → vân-procedural (xem
                      `ItemThumb.tsx`); badge phạm vi đè lên trên, không đổi. */}
                  <ItemThumb item={it}>
                    <span className={it.scope === 'studio' ? 'badge st' : 'badge'}>{SCOPE_BADGE_TEXT[it.scope]}</span>
                    {hasVariants && (
                      <span className="badge param" title={tr('Có biến thể kích thước — co giãn được', 'Has size variants — resizable')}>
                        {tr('Tham số', 'Param')}
                      </span>
                    )}
                    {(() => {
                      const model3d = object3dModelFor(it);
                      return model3d ? (
                        <Object3DToggle
                          title={it.name}
                          subtitle={tr('Hình học chuẩn-nét · mesh AI-sinh', 'Cleaned-up geometry · AI-generated mesh')}
                          glbUrl={model3d.glbUrl}
                          mtlUrl={model3d.mtlUrl}
                        />
                      ) : null;
                    })()}
                  </ItemThumb>
                  <span className="mt">
                    <span className="a" style={{ display: 'block' }}>{it.name}</span>
                    <span className="b" style={{ display: 'block' }}>{it.code}</span>
                    {dimsLabel && <span className="dim" style={{ display: 'block' }}>{dimsLabel}</span>}
                  </span>
                </button>
                );
              })}
            </div>

            <div className="libft">
              <span>{tr('Bấm để xem thông số · kéo thẳng vào bàn làm việc để dùng', 'Click for specs · drag onto the workspace to use')}</span>
              {/* "N mục trong kệ …" — mock đặt câu này ở thanh trạng thái ⑥ của khung app; app
                  thật chưa nối được Thư viện vào StatusBar (xem báo cáo), nên để ở chân sheet,
                  cùng dòng chữ, cùng nghĩa. Đếm SỐ THẬT sau lọc, không phải `count` mock của kệ. */}
              {activeShelf && (
                <span className="cnt">
                  {tr(
                    `${items.length} mục trong kệ ${activeShelf.label[0]}`,
                    `${items.length} items in ${activeShelf.label[1]}`,
                  )}
                </span>
              )}
              {state.pending.length > 0 && (
                <span title={state.pending.map((p) => p.name).join(', ')}>
                  {tr(`${state.pending.length} chờ duyệt`, `${state.pending.length} awaiting approval`)}
                </span>
              )}
              <button type="button" className="pub" onClick={() => setPublishOpen(true)}>
                <ArrowUp size={13} strokeWidth={2} />
                {tr('Đưa lên kệ', 'Publish to shelf')}
              </button>
            </div>
            </>
            )}
          </div>

          {/* ④ CỘT THÔNG SỐ — port `docs/mocks/Thư viện.dc.html` khối CotThongSo (06/08 nội hoá).
              Wrapper `.specwrap` LUÔN trong DOM khi `displayItem` còn nội dung (kể cả đang đóng) —
              xem docblock ".specwrap" trong `library-sheet-css.ts` cho lý do trượt-vào-từ-phải. */}
          {displayItem && (
            <div
              className="specwrap"
              data-open={specOpen}
              onTransitionEnd={(e) => {
                if (e.propertyName === 'width' && !specOpen) setDisplayItem(null);
              }}
            >
              <div className="speccol">
                <div className="sphead">
                  <div className="spprev">
                    <ItemThumb item={displayItem} />
                  </div>
                  <div className="spname">
                    <b title={displayItem.name}>{displayItem.name}</b>
                    <span className={displayItem.scope === 'studio' ? 'badge st' : 'badge'}>
                      {SCOPE_BADGE_TEXT[displayItem.scope]}
                    </span>
                  </div>
                </div>

                <div className="spsec">
                  <div className="spcap">{tr('Thông số', 'Specs')}</div>
                  {displaySpecRows.map((r) => (
                    <div key={r.label[0]}>
                      <div className="sprow">
                        <span className="k">{tr(r.label[0], r.label[1])}</span>
                        <span className={r.value === null ? 'v none' : 'v num'}>{r.value ?? '—'}</span>
                      </div>
                      {typeof r.bar === 'number' && (
                        <div className="spbar">
                          <i style={{ width: `${Math.round(Math.min(1, Math.max(0, r.bar)) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* R? (20/08) — where-used, chỉ có nghĩa cho món DB thật (`db:` prefix). Hiện
                    NGOÀI điều kiện đang mở dự án — "asset này dùng ở đâu" là câu hỏi hữu ích
                    kể cả lúc đang duyệt kho không gắn dự án nào. */}
                {dbAssetIdOf(displayItem) && (
                  <div className="spsec">
                    <div className="spcap">{tr('Đang dùng ở dự án', 'Used in projects')}</div>
                    <AssetWhereUsed assetId={dbAssetIdOf(displayItem)!} refreshKey={whereUsedRefresh} />
                  </div>
                )}

                {/* §9: ô trống phải KÈM LÝ DO, không giấu đi cho gọn mắt. */}
                {missingSpecCount(displaySpecRows) > 0 && (
                  <div className="spwhy">
                    {tr(
                      'Ô “—” là chưa nối kho: hãng · đơn vị · giá nằm ở Kho vật liệu (khớp theo mã); độ nhám · độ bóng nằm ở vật liệu PBR. Chưa món nào trên kệ mẫu khớp mã trong kho.',
                      'Each “—” means not linked yet: brand · unit · price live in the Materials warehouse (matched by code); roughness · gloss live in the PBR material. No demo shelf item matches a code in the warehouse yet.',
                    )}
                  </div>
                )}

                {/* VIỆC 4 (G-A-01 mở rộng, 08/08) — mã trên kệ và mã kho lệch nhau thì KHÔNG bắt
                   người dùng chờ ai đó sửa dữ liệu; cho họ tự chỉ đúng món trong kho ngay tại đây.
                   Cục bộ (localStorage qua `linkSpec`/`unlinkSpec`, KHÔNG ghi `ProductSpec.sku` —
                   PATCH đó cần quyền admin, xem `local-state.ts`). KS3: chọn rõ ràng, không tự
                   đoán. KS4: "Bỏ gán" đưa về đúng trạng thái tự khớp theo mã như trước. */}
                {!displayIdfc?.commerce && !!specs?.length && (
                  <div className="splink">
                    {linkedSpec ? (
                      <>
                        <span>{tr('Đã gán tay: ', 'Manually linked: ')}<b>{linkedSpec.name}</b></span>
                        <button type="button" className="ghost" onClick={() => unlinkSpec(displayItem.id)}>
                          {tr('Bỏ gán', 'Unlink')}
                        </button>
                      </>
                    ) : (
                      <>
                        <label htmlFor="lib-spec-link-select">
                          {tr('Máy chưa khớp được mã? Gán tay:', "Code didn't auto-match? Link it:")}
                        </label>
                        <select
                          id="lib-spec-link-select"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) linkSpec(displayItem.id, e.target.value);
                          }}
                        >
                          <option value="" disabled>{tr('Chọn trong kho vật liệu…', 'Pick from the warehouse…')}</option>
                          {specs.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}{s.sku ? ` · ${s.sku}` : ''}</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                )}

                <div className="spact">
                  <button type="button" className="primary" onClick={() => use(displayItem)}>
                    {displayItem.mechanic === 'ap'
                      ? tr('Dùng cho vật đang chọn', 'Apply to selection')
                      : tr('Kéo ra bàn làm việc', 'Drag onto the workspace')}
                  </button>
                  <button type="button" className="ghost" onClick={() => instantiate(displayItem)}>
                    {tr('Sửa bản sao', 'Edit a copy')}
                  </button>
                  {/* R? (20/08) — nút "Dùng cho dự án này" — CHỈ hiện khi có `projectId` context
                      THẬT (đang mở một dự án, không phải màn duyệt kho rời) VÀ món là `LibraryAsset`
                      thật trong DB. `disabled` khi đã gắn — không cho bấm lại vô ích, nhưng vẫn để
                      NGƯỜI THẤY trạng thái (không ẩn nút, §9). */}
                  {(() => {
                    const assetId = dbAssetIdOf(displayItem);
                    if (!assetId || !projectId) return null;
                    const attached = attachedUsage[assetId];
                    const busy = attachBusyId === assetId;
                    return (
                      <button
                        type="button"
                        className="ghost"
                        disabled={attached || busy}
                        onClick={() => attachToProject(displayItem)}
                      >
                        {busy ? (
                          <Loader2 size={13} strokeWidth={2} className="animate-spin" style={{ marginRight: 5, verticalAlign: -2 }} />
                        ) : attached ? (
                          <Check size={13} strokeWidth={2.2} style={{ marginRight: 5, verticalAlign: -2, color: 'var(--success)' }} />
                        ) : null}
                        {attached ? tr('Đã dùng ✓', 'Already used ✓') : tr('Dùng cho dự án này', 'Use for this project')}
                      </button>
                    );
                  })()}
                  {/* VIỆC 1 M-IDFC — XUẤT cấu kiện thành file .idfc gói đủ 3 mặt (G-M16-03):
                     ① geom2d từ BlockDef thật (resolveLibraryItem — chỉ hiện nút khi resolve được,
                     không hứa suông) · ② geom3d = PBR của matId=code nếu kho có · ③ commerce từ
                     spec khớp sku. Tải xuống như file thường — mở lại bằng "Nạp hàng loạt". */}
                  {(() => {
                    const resolved = resolveLibraryItem({ name: displayItem.name, code: displayItem.code, kind: displayItem.kind }, null, specs ?? undefined);
                    if (resolved?.via !== 'blockdef') return null;
                    return (
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          const def = resolved.def;
                          const pbrHit = getPbr(displayItem.code);
                          const specHit = specs?.length ? matchSpec(displayItem.code, specs) : null;
                          const json = exportIdfc({
                            // v2: kind lên meta (trục ①, suy từ ThumbKind qua bảng ánh xạ), ruột component.
                            meta: { name: displayItem.name, code: displayItem.code, kind: idfcKindOfThumb(displayItem.kind), scope: displayItem.scope, sourceLibraryId: displayItem.id },
                            body: {
                              type: 'component',
                              geom2d: { group: def.group, w: def.w, h: def.h, prims: def.prims, variants: def.variants, anchors: def.anchors, clearance: def.clearance },
                              geom3d: pbrHit ? { matId: displayItem.code, pbr: pbrHit } : undefined,
                            },
                            commerce: specHit
                              ? { brand: specHit.brand ?? undefined, sku: specHit.sku ?? undefined, unit: specHit.unit ?? undefined, priceVnd: specHit.priceVnd ?? undefined }
                              : undefined,
                          });
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
                          a.download = `${displayItem.code}.idfc`;
                          a.click();
                          URL.revokeObjectURL(a.href);
                          pushLibraryToast(tr(`Đã xuất ${displayItem.code}.idfc`, `Exported ${displayItem.code}.idfc`));
                        }}
                      >
                        {tr('Xuất .idfc', 'Export .idfc')}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      <PublishModal
        open={publishOpen}
        defaultStage={activeStage}
        onClose={() => setPublishOpen(false)}
        onSubmit={(draft) => {
          addPublishDraft(draft);
          setPublishOpen(false);
          pushLibraryToast(tr(`Đã gửi "${draft.name}" — chờ chủ studio duyệt`, `Sent "${draft.name}" — awaiting studio owner approval`));
        }}
      />

      {showAddMaterial && (
        <MaterialFormModal
          editing={null}
          onClose={() => setShowAddMaterial(false)}
          onSaved={() => {
            setShowAddMaterial(false);
            setSpecs(null); // ép effect ở trên fetch lại — món mới hiện ngay trên kệ
          }}
        />
      )}

      <LibraryToastHost />
    </div>,
    document.body,
  );
}
