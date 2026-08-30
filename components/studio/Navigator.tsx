'use client';

/**
 * components/studio/Navigator.tsx — ổ ② NAVIGATOR 214px (VIỆC 2, `docs/SPEC-HA-TANG-UI-IF.md`
 * Trụ 1 + `docs/SPEC-CAD-SHELL-V3.md` §2 luật 2/7). Thay `LeftRail` (rail icon dọc) làm khung
 * trái của `AppShell` — nội dung (danh sách Lớp/Node/Trang) do từng chặng truyền vào qua prop
 * `children`, khung CỐ ĐỊNH: đáy luôn 2 hàng giống hệt mọi chặng mọi mode (Trụ 1 luật B — "điểm
 * neo trí nhớ", chống bệnh Affinity "như đang dùng app khác").
 *
 * ⚠️ CHƯA có "Layer State" (đỉnh sidebar, SPEC-CAD-SHELL-V3 §2 luật 7 — snapshot bật/tắt lớp
 * theo bộ) — đó là TÍNH NĂNG MỚI (cần model lưu snapshot), không phải chỗ trống UI. Để trống,
 * không giả bằng nút chết. `topState` prop khai sẵn cho khi tính năng đó có.
 *
 * Thu gọn: nhớ lựa chọn tay qua localStorage (KHÔNG tự mở lại khi phóng cửa sổ — chỉ auto-thu
 * lúc hẹp, không bao giờ auto-mở, đúng luật 7 `SPEC-HA-TANG-UI-IF.md` §3 "nhớ lựa chọn tay,
 * không tự đảo ngược").
 */

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, Plus, Library } from 'lucide-react';
import { useT } from '@/lib/i18n';

/**
 * NAV-TI-LE-ICON 20/08 — 214 → **224**.
 * Hoà chốt tỉ lệ cột trái lúc đang sáng tác: rail việc **52-56** : thềm **220-248** ≈ **1 : 4-4,5**;
 * tổng phần trái thường trực **272-304px**, và ở 1440-1600 không quá ~20% bề rộng dùng được.
 * 214 nằm NGOÀI dải 220-248 (52 : 214 = 1 : 4,12 thì đúng tỉ lệ, nhưng bề rộng tuyệt đối thì hụt).
 * 224 cho: tổng trái 52 + 224 = **276** ∈ [272, 304] ✓ · tỉ lệ 1 : 4,31 ∈ [4, 4,5] ✓ ·
 * 276/1440 = **19,2%** ✓ · 276/1600 = **17,3%** ✓ (đo thật trên app, không ước — xem báo cáo).
 */
const DEFAULT_WIDTH = 224;
const COLLAPSE_BREAKPOINT = 1280;
const STORAGE_KEY = 'interiorflow.navigator.collapsed_v1';

interface Props {
  /** Nội dung danh sách chính (Lớp/Node/Trang tuỳ chặng) — cuộn riêng. */
  children: ReactNode;
  /** Đỉnh sidebar tuỳ chọn — CHƯA dùng ở VIỆC 2, khai sẵn cho Layer State sau này. */
  topState?: ReactNode;
  /** Nhãn nút "+ thêm" theo chặng (Lớp mới/Khối mới/Trang mới). */
  addLabel: string;
  onAdd?: () => void;
  onOpenLibrary: () => void;
  /** Nhãn hiện trên DẢI MỎNG khi thu gọn (CHINH-3, SPEC-PANEL-ROLLOUT-IDF §2f — "dải dọc mỏng
   * CÓ NHÃN", né lỗi SketchUp nút không nhãn). Thiếu → "Bảng". */
  collapsedLabel?: string;
  /** Điểm xuất phát khi CHƯA có lựa chọn lưu — bật cho môi trường đắm chìm (2D/3D). */
  defaultCollapsed?: boolean;
  /** Bề rộng ổ ② — mặc định 214 (Trụ 1). Hoà 04/08 (BÁC bản Render list-chữ, §0d "giữ cái đang
   * tốt"): chặng Render gắn NGUYÊN `NodeLibraryPanel` (card icon+mô tả+badge) cần THỞ hơn danh
   * sách chữ CAD/Present — 280px, số ghi ở nơi gọi (`AppShell.tsx`). */
  width?: number;
  /** Chặng Vẽ có type-anywhere nuốt chữ trần nên phím panel/Thư viện cần ⇧ (§4e — cùng luật đã
   * áp trong `AppShell.tsx` và `use-library-sheet.ts`). Bật cờ này để tooltip hiện ĐÚNG phím
   * người dùng phải bấm ở chặng đó: ⇧B/⇧L thay vì B/L. */
  shiftHotkeys?: boolean;
}

export function Navigator({ children, topState, addLabel, onAdd, onOpenLibrary, collapsedLabel, width: widthProp = DEFAULT_WIDTH, shiftHotkeys = false, defaultCollapsed = false }: Props) {
  // 22/08 (hotfix "stop mini-app UI") — MÔI TRƯỜNG ĐẮM CHÌM (2D · 3D) MẶC ĐỊNH THU BẢNG TRÁI.
  // Hoà: *"canvas dominates · layers only when opened"*. Bảng Lớp thường trực chính là thứ làm
  // chặng Vẽ đọc ra "một app CAD" thay vì một môi trường trong Workspace.
  // ⚠️ Chỉ đổi ĐIỂM XUẤT PHÁT, KHÔNG cướp quyền người dùng: `localStorage` vẫn thắng ngay ở
  // effect hydrate bên dưới ⇒ ai đã mở bảng thì lần sau vẫn thấy nó mở (luật "nhớ lựa chọn
  // trong bố cục Workspace"). Đây là lý do KHÔNG ép `setCollapsed(true)` mỗi lần mount.
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hydrated, setHydrated] = useState(false);
  const [peek, setPeek] = useState(false);
  const tr = useT();
  // Tooltip PHẢI ghi đúng phím của chặng đang mở (§0c mảng 1 "tooltip hiện phím"): chặng Vẽ
  // ⇧B/⇧L, chặng khác B/L.
  const kPanel = shiftHotkeys ? '⇧B' : 'B';
  const kLibrary = shiftHotkeys ? '⇧L' : 'L';

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Lựa chọn đã lưu THẮNG mặc định theo chặng — cả hai chiều ('1' thu, '0' mở).
    if (stored === '1') setCollapsed(true);
    else if (stored === '0') setCollapsed(false);
    else if (window.innerWidth < COLLAPSE_BREAKPOINT) setCollapsed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Auto-thu khi hẹp — KHÔNG BAO GIỜ tự mở lại (chỉ set true, không bao giờ set false ở đây).
    const onResize = () => {
      if (window.innerWidth < COLLAPSE_BREAKPOINT) setCollapsed(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  // CHINH-4 (SPEC-PANEL-ROLLOUT-IDF §4a) — phím B thu/mở Navigator từ AppShell. CustomEvent
  // (khuôn `if:library-open`) vì AppShell không giữ state collapsed (sống ở đây + localStorage).
  // detail.set: ép trạng thái (⌘\ cần deterministic), thiếu thì toggle.
  useEffect(() => {
    const onToggle = (e: Event) => {
      const set = (e as CustomEvent<{ set?: boolean }>).detail?.set;
      setCollapsed((c) => {
        const next = set ?? !c;
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
        return next;
      });
    };
    window.addEventListener('if:navigator-toggle', onToggle);
    return () => window.removeEventListener('if:navigator-toggle', onToggle);
  }, []);

  /**
   * NAV-TI-LE-ICON 20/08 — BẢNG LÀM VIỆC SÂU **NỞ RA THAY THẾ** thềm.
   * Panel ruột (vd `LayerPanel` lúc "Sửa nét") báo bề rộng nó cần; thềm đổi bề rộng TẠI CHỖ.
   * ⛔ TUYỆT ĐỐI KHÔNG dựng thêm một cột thứ ba thường trực cạnh thềm — đó là cách nhanh nhất
   * ăn hết bề rộng canvas: 52 + 224 + 320 = 596px, tức 41% màn 1440, gấp đôi trần ~20% Hoà chốt.
   * `null` = trả về mặc định. Không persist: đây là trạng thái của MỘT lượt sửa sâu, không phải
   * cách bày quen tay — nhớ nó qua phiên sẽ làm app mở ra rộng ngoác không rõ vì sao.
   */
  const [rongTheo, setRongTheo] = useState<number | null>(null);
  useEffect(() => {
    const onWidth = (e: Event) => {
      const w = (e as CustomEvent<{ width?: number | null }>).detail?.width;
      setRongTheo(typeof w === 'number' ? w : null);
    };
    window.addEventListener('if:navigator-width', onWidth);
    return () => window.removeEventListener('if:navigator-width', onWidth);
  }, []);

  // Bề rộng THAY THẾ, không cộng dồn: `rongTheo` ghi đè `widthProp`, không đứng cạnh nó.
  const width = rongTheo ?? widthProp;

  /* NAV-HAI-DAO 20/08 — Ổ CHÂN AVATAR + CÀI ĐẶT ĐÃ GỠ khỏi Navigator.
   * Trước đây chân panel này có avatar (mở `AccountMenu`: Hồ sơ · Credit · Cài đặt · Đăng xuất)
   * và một nút ⚙ đi thẳng `/settings`. Cả hai nằm ở CỘT TRÁI ⇒ đúng thứ Hoà nêu là tiêu chí
   * TRƯỢT (*"trượt nếu thanh trái còn chứa Hồ sơ/Credit/Cài đặt"*), và sau khi cụm phải-trên có
   * avatar thì đây thành BẢN THỨ HAI của cùng một cửa — lặp, không phải dự phòng.
   * ⇒ Cửa duy nhất nay là `components/studio/CumPhaiTren.tsx`. Không mất chức năng nào:
   * `AccountMenu` giữ nguyên, chỉ đổi chỗ neo. Đừng lắp lại ở đây.
   */

  if (collapsed) {
    // §2f SPEC-PANEL-ROLLOUT-IDF — thu về DẢI MỎNG, hover mới HÉ (overlay tạm, không đổi
    // layout — khác auto-hide bị cấm: dải là trạng thái NGƯỜI DÙNG chọn, hé chỉ để nhìn nhanh,
    // bấm chevron mới mở hẳn lại).
    //
    // 🔴 SỬA 30/08 — BỎ NHÃN CHỮ DỌC. Spec §2f gọi đây là "dải mỏng CÓ NHÃN"; Hoà đè chốt đó,
    // hai lần trong một ngày: "cái line gallery tôi kêu bỏ rồi mà" rồi "cái line panel có cách
    // thiết kế nào khôn hơn ko? đâu cần thiết nằm đó".
    // Nhãn cũ là <span writingMode:vertical-rl> in HOA — nó phạm ba thứ cùng lúc:
    //   ① thừa   — nút chevron ngay trên đã mang đúng cái tên đó trong `title`, kèm phím tắt
    //   ② V-1    — viết HOA chuỗi có dấu: "BẢNG" mất dấu, đúng luật chữ Việt cấm
    //   ③ V-6    — cỡ `--fs-2xs`, dưới sàn 12px của tiếng Việt có dấu
    // Chữ xoay 90° còn bắt người đọc nghiêng đầu, và trả giá bằng bề ngang trên MỌI màn dùng
    // AppShell. Tên màn nay sống ở `title` của nút (chuột rê ra là thấy) và ở `aria-label`
    // (trình đọc màn hình vẫn nghe đúng) — không mất đường nào, chỉ thôi chiếm chỗ.
    // ⚠️ Muốn dựng lại nhãn thì sửa `SPEC-PANEL-ROLLOUT-IDF` §2f trước, đừng lặng lẽ thêm vào.
    return (
      <div
        className="relative flex shrink-0 flex-col items-center border-r border-[var(--border)] bg-[var(--panel)] py-2"
        style={{ width: 36 }}
        onMouseEnter={() => setPeek(true)}
        onMouseLeave={() => setPeek(false)}
      >
        <button
          type="button"
          onClick={toggle}
          title={tr(`Mở lại ${collapsedLabel ?? 'bảng'} — ${kPanel}`, `Expand ${collapsedLabel ?? 'panel'} — ${kPanel}`)}
          aria-label={tr(`Mở lại ${collapsedLabel ?? 'bảng'}`, `Expand ${collapsedLabel ?? 'panel'}`)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] text-[var(--t3)] transition-colors duration-[var(--nhip-bam)] hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
        >
          <ChevronLeft size={16} className="rotate-180" />
        </button>
        {peek && (
          <div
            className="absolute left-full top-0 z-20 flex h-full min-h-0 flex-col border-r border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-pop)]"
            style={{ width }}
          >
            <div className="min-h-0 flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
              {children}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <aside
      className="flex min-h-0 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)]"
      style={{ width, visibility: hydrated ? 'visible' : 'hidden' }}
      data-tour="navigator"
    >
      {topState}
      <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
        {children}
      </div>

      {/* Đáy Navigator — 2 hàng CỐ ĐỊNH, y hệt mọi chặng mọi mode (Trụ 1 luật B). */}
      <div className="flex shrink-0 gap-0.5 border-t border-[var(--vien-mo)] p-1.5">
        <button
          type="button"
          onClick={onAdd}
          disabled={!onAdd}
          title={addLabel}
          className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-[11px] text-[var(--t3)] transition-colors duration-[var(--nhip-bam)] hover:bg-[var(--hover)] hover:text-[var(--t1)] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={onOpenLibrary}
          title={tr(`Thư viện — ${kLibrary}`, `Library — ${kLibrary}`)}
          className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-[11px] text-[var(--t3)] transition-colors duration-[var(--nhip-bam)] hover:bg-[var(--hover)] hover:text-[var(--t1)]"
        >
          <Library size={16} />
          {tr('Thư viện', 'Library')}
        </button>
        <button
          type="button"
          onClick={toggle}
          title={tr(`Thu gọn — ${kPanel}`, `Collapse — ${kPanel}`)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-[var(--t3)] transition-colors duration-[var(--nhip-bam)] hover:bg-[var(--hover)] hover:text-[var(--t1)]"
        >
          <ChevronLeft size={16} />
        </button>
      </div>
    </aside>
  );
}

export { DEFAULT_WIDTH as NAVIGATOR_WIDTH };
