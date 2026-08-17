'use client';

/**
 * components/collab/CuaSoThaoLuan.tsx — **CỬA SỔ THẢO LUẬN** (chặng 3D · mode Node).
 * Phiếu COLLAB-VO · 17/08.  Marker: [marker: cuaSoThaoLuan]
 *
 * ⭐ NÓ LÀ GÌ (Hoà chốt 16/08 + NC-COLLAB-CHANG-3D §Câu 1 hướng (b)):
 * một loại **cửa sổ công cụ** với `moiTruong: 'ban-bac'`, sống trên cùng `FlowCanvas` với các
 * cửa sổ SẢN XUẤT. Đầu ra thật là **một QUYẾT ĐỊNH** (nuôi Thẻ DNA), KHÔNG bắt buộc có cổng
 * ra tệp. Ba tab: Moodboard (khuôn 1 — `ConceptForm` sẵn) · Bảng So Cực (khuôn 2) · Câu Chuyện
 * 3 Hồi (khuôn 3).
 *
 * ⭐ VÌ SAO KHÔNG DỰNG CỬA SỔ THỨ HAI (Đ2 nhìn vào trong trước, `TRIET-LY-IF.md:72`):
 * khuôn `CuaSoCongCu` sẵn 3 nấc `thu/vua/toanMan`, 3 biến thể `noi/neo/toanMan`, pointer capture,
 * `NodeResizer`, bảng khoá không singleton (`useCuaSoCongCuUi`) — **đủ hết**. Tệp này chỉ dựng
 * RUỘT (3 tabs + nút Chưng cất ở `chanTrang`), khung vẫn là `CuaSoCongCu`.
 *
 * ⭐ ĐẦU RA THẢO LUẬN ≠ ĐẦU RA SẢN XUẤT — cửa sổ này KHÔNG có `<Handle>` cổng ra ở mặt tiền
 * canvas (do nơi mount quyết định, không phải tệp này). Khai `LoaiCuaSo = 'thao-luan'` đã có ở
 * `lib/nodes/cua-so-cong-cu.ts:187` — công thức *"cửa sổ ⇒ luôn có cổng ra"* SAI, khung chịu
 * được cả hai (`cua-so-cong-cu.test.ts:174-184` canh chính điều đó).
 *
 * ⭐ NÚT "CHƯNG CẤT → THẺ DNA" — đây là chỗ dễ nhất để lỡ vi phạm luật:
 *  · T5 (`TRIET-LY-IF.md:32`) *"CON NGƯỜI QUYẾT CUỐI"* — CẤM tự chạy chưng cất trên mỗi
 *    thao tác; chỉ khi Hoà bấm nút.
 *  · §9 *"cấm nút giả bấm không ra gì"* — khi COLLAB-LOI chưa xong (union `ProvenanceInput`
 *    mở cho `sticky|form|asset`), nút bắt buộc MỜ kèm `disabledReason` đọc được, KHÔNG ẩn.
 *  · `mergeDistilledIntoCard` (`lib/dna/distiller.ts:97`) đã canh sẵn: lớp `verified` không
 *    bị chưng cất lại ghi đè — luật 6 CLAUDE.md *"sửa tay không bị AI ghi đè"*. Nghĩa là
 *    người bấm N lần thì N lần đều an toàn.
 *
 * ⭐ CỜ MỞ CHƯNG CẤT — đọc từ `feature-flags.ts`, MỘT nguồn:
 *  · Hôm nay (17/08): `CHUNG_CAT_SAN_SANG = false` ⇒ nút mờ + lý do
 *    `LY_DO_MO_CHUNG_CAT.vi/en`.
 *  · LOI ship xong: flip cờ + nối `onChungCat` gọi hàm thật (VO không được ghi
 *    `lib/distill/**`, đó là biên phiếu).
 */

import { useId, useState, type ReactNode } from 'react';
import { Sparkles, MessageSquare, Layers, BookOpen } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { RADIUS } from '@/lib/geometry';
import CuaSoCongCu, { type BienTheCuaSo } from '@/components/render-studio/CuaSoCongCu';
import { ConceptForm } from '@/components/form/ConceptForm';
import { BangSoCucForm, ketQuaBangSoCuc, type KetQuaSoCuc } from './BangSoCucForm';
import { BaHoiStorylineForm, BA_HOI_KHOI, ketQuaBaHoi, type Hoi, type KetQuaHoi } from './BaHoiStorylineForm';
import { CHUNG_CAT_SAN_SANG, LY_DO_MO_CHUNG_CAT } from './feature-flags';
import { taoNguonChungCat } from './tao-nguon-chung-cat';
import { distillDnaFromSources } from '@/lib/dna/distiller';
import type { DesignDnaLayers } from '@/lib/dna/types';
import type { CapCuaSo } from '@/lib/nodes/cua-so-cong-cu';

/**
 * Ba khuôn — id dùng cho tabs LẪN cho phần *"cửa sổ mở tab nào lần trước"* (nếu về sau lưu
 * theo máy). Đặt kèm nhãn + icon để tabs không cần bảng dịch riêng.
 */
export type TabKhuon = 'moodboard' | 'so-cuc' | 'ba-hoi';

const TABS: readonly {
  id: TabKhuon;
  ten: { vi: string; en: string };
  icon: ReactNode;
}[] = [
  { id: 'moodboard', ten: { vi: 'Moodboard', en: 'Moodboard' }, icon: <Layers size={14} aria-hidden /> },
  { id: 'so-cuc', ten: { vi: 'Bảng so cực', en: 'Poles Table' }, icon: <MessageSquare size={14} aria-hidden /> },
  { id: 'ba-hoi', ten: { vi: 'Câu chuyện 3 hồi', en: '3-Act Story' }, icon: <BookOpen size={14} aria-hidden /> },
];

/**
 * KẾT QUẢ ba khuôn — gom lại một chỗ để nơi mount đọc và (khi LOI ship) chuyển vào distiller.
 * Ba mảng chứ không hợp nhất: mỗi khuôn có hình dạng khác, ép chung là bịa cấu trúc.
 */
export interface KetQuaThaoLuan {
  /** Moodboard chạy `ConceptForm` — output ảnh + palette đã có luồng riêng qua `useLibrary`,
   *  không đi qua state ở đây. Cờ này chỉ để nơi mount biết *"tab moodboard đã được mở"*. */
  moodboardDaMo: boolean;
  soCuc: KetQuaSoCuc[];
  baHoi: KetQuaHoi[];
}

export interface CuaSoThaoLuanProps {
  /** Khoá cho bảng trạng thái `useCuaSoCongCuUi` — nên là `khoaCuaSoNode(id)` hoặc
   *  `khoaCuaSoThe('ban-bac')` tuỳ mặt tiền canvas hay nổi. */
  khoa: string;
  cap: CapCuaSo;
  bienThe: BienTheCuaSo;
  onCap: (cap: CapCuaSo) => void;
  onDong?: () => void;
  /** Tiêu đề tuỳ chọn (vd tên concept cụ thể); bỏ trống dùng tên môi trường "Bàn bạc". */
  tieuDe?: string;
  /** Tab mặc định — mặc định 'moodboard' (khuôn quen tay nhất). */
  tabMacDinh?: TabKhuon;
  /**
   * Gọi khi người bấm "Chưng cất → Thẻ DNA".
   *  · `ketQua` — kết quả thô của 3 khuôn (moodboard/so-cực/ba-hồi).
   *  · `layers` — kết quả đã chưng cất qua `distillDnaFromSources` (COLLAB-LOI mở cửa 17/08).
   *    Cửa sổ tự gọi distiller vì `taoNguonChungCat` là hàm thuần trong biên phiếu VO; mount
   *    site tiếp nhận `layers` để gọi `mergeDistilledIntoCard` vào Thẻ DNA của dự án — CHỈ
   *    mount site biết dự án nào đang mở nên bước merge KHÔNG làm ở đây.
   *
   * Nếu KHÔNG truyền `onChungCat` thì nút mờ (chưa gắn dây) — dù cờ đã bật.
   */
  onChungCat?: (ket_qua: KetQuaThaoLuan, layers: DesignDnaLayers) => void;
}

export default function CuaSoThaoLuan({
  khoa,
  cap,
  bienThe,
  onCap,
  onDong,
  tieuDe,
  tabMacDinh = 'moodboard',
  onChungCat,
}: CuaSoThaoLuanProps) {
  const tr = useT();

  const [tab, setTab] = useState<TabKhuon>(tabMacDinh);
  const [moodboardDaMo, setMoodboardDaMo] = useState(false);
  const [giaTriSoCuc, setGiaTriSoCuc] = useState<Record<string, number | null>>({});
  const [hoi, setHoi] = useState<Hoi[]>([...BA_HOI_KHOI]);

  // Đánh dấu "tab moodboard đã được mở" khi user click sang tab này lần đầu — để nơi mount
  // biết là có dữ liệu moodboard sống (ảnh vào thư viện qua ConceptForm), không phải tab rỗng.
  function chuyenTab(idMoi: TabKhuon) {
    if (idMoi === 'moodboard' && !moodboardDaMo) setMoodboardDaMo(true);
    setTab(idMoi);
  }

  const soCuc = ketQuaBangSoCuc(giaTriSoCuc);
  const baHoi = ketQuaBaHoi(hoi);
  const soHangSoCucDaBam = soCuc.filter((x) => x.giaTri !== null).length;
  const soHoiDaDien = baHoi.filter((x) => x.daDien).length;

  // TÍNH RA hai lý do độc lập: cờ chung + có/không có hàm gọi. Người đọc lý do là biết cái nào
  // đang chặn — không đè lý do lên nhau (đọc "chưa sẵn" xong không biết là chờ ai).
  const chungCatBiChan = !CHUNG_CAT_SAN_SANG || !onChungCat;
  const lyDoMoNut = !CHUNG_CAT_SAN_SANG
    ? tr(LY_DO_MO_CHUNG_CAT.vi, LY_DO_MO_CHUNG_CAT.en)
    : !onChungCat
      ? tr(
          'Chưa nối bộ thi hành — nơi mount phải truyền onChungCat.',
          'Not wired — the mount site must pass onChungCat.',
        )
      : '';

  // Ước lượng có gì để chưng cất — chỉ để hiện dòng gợi ý dưới nút. KHÔNG dùng làm điều kiện
  // disable (điều kiện thật là hai lý do trên); đây là *"máy đọc được gì"*.
  const coNguon =
    moodboardDaMo || soHangSoCucDaBam > 0 || soHoiDaDien > 0;

  const chanTrang = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        fontSize: 11,
        color: 'var(--t3)',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {coNguon
          ? tr(
              `Máy đọc được: ${moodboardDaMo ? '1 moodboard · ' : ''}${soHangSoCucDaBam} hàng so cực · ${soHoiDaDien}/3 hồi`,
              `Machine reads: ${moodboardDaMo ? '1 moodboard · ' : ''}${soHangSoCucDaBam} pole rows · ${soHoiDaDien}/3 acts`,
            )
          : tr(
              'Đầu ra là một quyết định, không phải tệp — bấm "Chưng cất" khi đủ chín.',
              'Output is a decision, not a file — press "Distill" when it feels ready.',
            )}
      </span>
      <NutChungCat
        biChan={chungCatBiChan}
        lyDo={lyDoMoNut}
        onBam={() => {
          if (chungCatBiChan) return;
          // Chuyển kết quả 3 khuôn thành ProvenanceInput[] rồi gọi distiller. Hàm thuần
          // `taoNguonChungCat` là cây cầu duy nhất — sửa hình dạng bên nào cũng phải sửa nó.
          const nguon = taoNguonChungCat({ moodboardDaMo, soCuc, baHoi });
          const layers = distillDnaFromSources(nguon);
          onChungCat?.({ moodboardDaMo, soCuc, baHoi }, layers);
        }}
      />
    </div>
  );

  return (
    <CuaSoCongCu
      khoa={khoa}
      moiTruong="ban-bac"
      tieuDe={tieuDe}
      cap={cap}
      bienThe={bienThe}
      onCap={onCap}
      onDong={onDong}
      chanTrang={chanTrang}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <ThanhTabs tab={tab} onDoi={chuyenTab} />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            background: 'var(--bg)',
          }}
        >
          {tab === 'moodboard' && <ConceptForm />}
          {tab === 'so-cuc' && <BangSoCucForm giaTri={giaTriSoCuc} onDoi={setGiaTriSoCuc} />}
          {tab === 'ba-hoi' && <BaHoiStorylineForm hoi={hoi} onDoi={setHoi} />}
        </div>
      </div>
    </CuaSoCongCu>
  );
}

/**
 * Dải TABS — `role="tablist"` để trình đọc màn hình đọc đúng "3 tab, đang chọn cái nào".
 * Nhãn LUÔN có chữ cạnh icon — luật NT-10 (`hotkey-registry` §ô giải nghĩa): *"lệnh có minh
 * hoạ trước→sau; icon không đứng một mình"*.
 */
function ThanhTabs({ tab, onDoi }: { tab: TabKhuon; onDoi: (idMoi: TabKhuon) => void }) {
  const tr = useT();
  return (
    <div
      role="tablist"
      aria-label={tr('Khuôn khung tư duy', 'Framework templates')}
      style={{
        display: 'flex',
        gap: 4,
        padding: 6,
        borderBottom: '1px solid var(--vien-mo)',
        background: 'var(--panel)',
        flexShrink: 0,
      }}
    >
      {TABS.map((t) => {
        const chon = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={chon}
            aria-controls={`tab-panel-${t.id}`}
            onClick={() => onDoi(t.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: RADIUS.r1,
              border: '1px solid transparent',
              background: chon ? 'var(--accent-soft)' : 'transparent',
              color: chon ? 'var(--accent)' : 'var(--t3)',
              fontSize: 12,
              fontWeight: chon ? 600 : 500,
              cursor: 'pointer',
            }}
          >
            {t.icon}
            <span>{tr(t.ten.vi, t.ten.en)}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * NÚT CHƯNG CẤT — hai trạng thái:
 *  · sáng: bấm được, gọi `onBam`.
 *  · mờ: `aria-disabled=true` + `aria-describedby` trỏ tới phần tử ẩn mang lý do — không dùng
 *    `title` (câm trên cảm ứng, đọc không đều trên trình đọc màn hình, đúng bài học của
 *    `ToolbarChip` 16/08). Không dùng `disabled` HTML vì `disabled` bỏ nút khỏi tab-order ⇒
 *    người bàn phím không đọc được lý do; `aria-disabled` giữ focus + trình đọc màn hình đọc.
 */
function NutChungCat({ biChan, lyDo, onBam }: { biChan: boolean; lyDo: string; onBam: () => void }) {
  const tr = useT();
  // id ổn định qua React 18 useId cho phần tử ẩn — tránh xung đột khi có nhiều cửa sổ cùng lúc.
  // Ở đây dùng chuỗi ngẫu nhiên đơn giản (không cần ổn định giữa server/client vì component
  // 'use client'), nhưng phải ổn định trong một lần mount.
  const lyDoId = useId();
  return (
    <>
      <button
        type="button"
        onClick={onBam}
        aria-disabled={biChan}
        aria-describedby={biChan ? lyDoId : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: RADIUS.r2,
          border: '1px solid var(--accent-ring)',
          background: biChan ? 'var(--accent-soft)' : 'var(--accent)',
          color: biChan ? 'var(--t2)' : 'var(--on-accent)',
          fontSize: 12,
          fontWeight: 600,
          cursor: biChan ? 'not-allowed' : 'pointer',
          opacity: biChan ? 'var(--mo-vo-hieu)' : 1,
          flexShrink: 0,
        }}
      >
        <Sparkles size={13} aria-hidden />
        {tr('Chưng cất → Thẻ DNA', 'Distill → DNA Card')}
      </button>
      {biChan && (
        <span
          id={lyDoId}
          style={{
            // Bí danh visually-hidden — trình đọc màn hình đọc, mắt không thấy.
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {lyDo}
        </span>
      )}
    </>
  );
}
