'use client';

/**
 * app/files/_components/CollectionPlus.tsx — [marker: filesHaiTang] **TẦNG ②** của màn Files.
 *
 * 📐 **PORT TỪ BẢN VẼ ĐÃ DUYỆT** `docs/mocks/mock-files-hai-tang.html` (khối `.toolbar2` + `.grid8`
 * + `.col`): thanh lọc bọc khung `--r-3` nền `--panel` · lưới `minmax(240px,1fr)` gap 14 · thẻ có
 * *ô xem trước 4/3 → tên + số → **mã `COL-XXX-NNN` chữ monospace ngay dưới tên** → hàng chip* ·
 * chip là **viền + chấm**, không tô nền màu · **không nơi nào đọc `--accent`**.
 *
 * 🔎 **CHỖ TÔI LỆCH KHỎI BẢN VẼ — khai thẳng, kèm lý do:**
 *  ⓐ **Số mục (126 · 54 · 36…) và chip trạng thái (“Đủ định nghĩa”) của bản vẽ là SỐ CỦA MOCK.**
 *     Chưa gói nào có kho thật ⇒ ô số hiện `—` (*chưa biết*, khác hẳn `0` = *đã đọc, đúng là
 *     rỗng*) và chip nói **“chưa nối kho”**. Bịa số cho giống bản vẽ là phá luật cấm dữ liệu giả;
 *     bản vẽ quyết HÌNH, không quyết SỐ.
 *  ⓑ **Ba trục lọc Nguồn · Trạng thái · Cập nhật hiện MỜ KÈM LÝ DO.** Bản vẽ vẽ cả bốn trục bấm
 *     được vì nó có dữ liệu mock. Ở đây chưa có gì để lọc ⇒ bốn nút bấm-không-ra-gì là **nút giả**
 *     (§9 cấm). Lý do đi đường `aria-describedby`, KHÔNG đi `title` (bài học 16/08: `title` câm
 *     trên cảm ứng và trình đọc màn hình đọc không nhất quán).
 *  ⓒ **Cặp nút lưới ↔ danh sách** của bản vẽ chưa port: kiểu xem danh sách chưa dựng, bày nút ra
 *     là lời hứa suông.
 *  ⓓ **Ô xem trước**: bản vẽ dựng SVG tại chỗ (quả cầu vật liệu, ghế line-art…) và tự khai bản
 *     build sẽ thay bằng nội dung thật. Chưa có nội dung ⇒ ô trung tính mang biểu tượng loại,
 *     KHÔNG vẽ tay giả sản phẩm (Hoà bác đồ-vẽ-tay-làm-hình-sản-phẩm 20/08).
 *  ⓔ **Mã loại lấy theo BẢN VẼ** (`MAT · FUR · DET · PLC · DNA · LEA · PRE · PRO`), không theo
 *     chữ viết tắt tiếng Việt tôi đặt lúc đầu — bản vẽ đã quyết thì bản vẽ thắng.
 *
 * ⭐ Tầng này khác tầng ① ở **TRỤC**: tầng ① hỏi *"tôi có quyền gì ở đây"*, tầng ② hỏi *"tôi lấy
 * nguyên liệu loại nào"*. Vì thế nó có tiêu đề riêng và tự khai trục — không phải bộ lọc của trên.
 */
import { useId, useMemo, useState } from 'react';
import { Boxes, Sofa, Ruler, Trees, Fingerprint, GraduationCap, LayoutTemplate, ListChecks } from 'lucide-react';
import { useT } from '@/lib/i18n';
import {
  COLLECTION_GOI, TRUC_LOC, QUYEN_GOI, maCollection, tomTatCollection, soHoacGach,
  type GoiKey,
} from '../_lib/hai-tang';

/** Icon theo gói — *icon nén tin* đứng cạnh nhãn chữ, không bao giờ đứng một mình (NT-8). */
const GOI_ICON: Record<GoiKey, typeof Boxes> = {
  vatLieu: Boxes,
  furniture: Sofa,
  chiTiet: Ruler,
  cayNguoi: Trees,
  designDna: Fingerprint,
  hocTuDuAn: GraduationCap,
  mauTrinhBay: LayoutTemplate,
  cachLam: ListChecks,
};

/**
 * Số mục của từng gói. **Cố ý để rỗng**: chưa gói nào có kho thật đứng sau. Khi một gói nối kho
 * thì thay `null` bằng số ĐỌC ĐƯỢC — chỗ duy nhất phải sửa là đây.
 */
const DEM_MUC: Partial<Record<GoiKey, number | null>> = {};

/** Khuôn nút lọc `.filter` của bản vẽ: nhãn trục mờ + giá trị + mũi tên. */
const KHUON_LOC: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  minHeight: 'var(--tap)', padding: '0 10px',
  border: '1px solid var(--border)', borderRadius: 'var(--r-2)',
  background: 'var(--field)', color: 'var(--t2)',
  fontSize: 'var(--fs-ui)', fontFamily: 'inherit',
};

export function CollectionPlus() {
  const tr = useT();
  const [locLoai, setLocLoai] = useState<GoiKey | ''>('');
  const idLoai = useId();
  const idLyDo = useId();

  const tomTat = useMemo(() => tomTatCollection(DEM_MUC), []);
  const goiHien = useMemo(
    () => (locLoai ? COLLECTION_GOI.filter((g) => g.khoa === locLoai) : COLLECTION_GOI),
    [locLoai],
  );

  return (
    <section
      id="collection-plus"
      aria-labelledby="collection-plus-tieu-de"
      style={{ padding: '18px 16px 28px' }}
    >
      {/* `tabIndex={-1}` — tiêu đề là ĐÍCH của nút nhảy ở tầng ①. Thiếu nó thì bấm nhảy chỉ cuộn
          màn hình còn focus vẫn kẹt trên nút, Tab tiếp là quay lại đầu trang. */}
      <h2
        id="collection-plus-tieu-de"
        tabIndex={-1}
        className="if-tang-moc"
        style={{ margin: 0, fontSize: 'var(--fs-lg)', letterSpacing: '-.01em', color: 'var(--t1)' }}
      >
        <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, color: 'var(--t4)', letterSpacing: '.06em', textTransform: 'uppercase', marginRight: 8, verticalAlign: 2 }}>
          {tr('Tầng ②', 'Tier ②')}
        </span>
        Collection+
      </h2>
      {/* Câu tự khai TRỤC — thứ làm hai tầng đọc ra là hai tầng, không phải hai lát danh sách. */}
      <p style={{ margin: '4px 0 0', maxWidth: '88ch', fontSize: 'var(--fs-2xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
        {tr(
          'Gom theo LOẠI VẬT — kho nguồn chờ chưng cất sang Thư viện. Mã COL-<LOẠI>-NNN.',
          'Grouped by KIND OF THING — the source stock waiting to be distilled into the Library. Codes COL-<TYPE>-NNN.',
        )}
      </p>
      <p style={{ margin: '2px 0 0', fontSize: 'var(--fs-2xs)', color: 'var(--t2)' }}>{tr(tomTat.vi, tomTat.en)}</p>

      {/* ── THANH LỌC ── Loại chạy thật; ba trục còn lại mờ KÈM LÝ DO, không phải nút giả. */}
      <div
        role="group"
        aria-label={tr('Bộ lọc Collection+', 'Collection+ filters')}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '10px 12px', margin: '12px 0 14px',
          border: '1px solid var(--border)', borderRadius: 'var(--r-3)', background: 'var(--panel)',
        }}
      >
        <label htmlFor={idLoai} style={{ ...KHUON_LOC, cursor: 'pointer' }}>
          <span style={{ color: 'var(--t3)', fontSize: 'var(--fs-2xs)' }}>{tr('Loại', 'Type')}</span>
          {/* `<select>` thật: bàn phím, cảm ứng và trình đọc màn hình đều dùng được sẵn, không
              phải dựng lại một cái xổ giả bằng div. */}
          <select
            id={idLoai}
            value={locLoai}
            onChange={(e) => setLocLoai(e.target.value as GoiKey | '')}
            style={{ border: 0, background: 'none', color: 'inherit', font: 'inherit', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">{tr('Tất cả', 'All')}</option>
            {COLLECTION_GOI.map((g) => (
              <option key={g.khoa} value={g.khoa}>{tr(g.ten.vi, g.ten.en)}</option>
            ))}
          </select>
        </label>

        {TRUC_LOC.filter((t) => !t.locDuoc).map((t) => (
          <button
            key={t.khoa}
            type="button"
            /* `aria-disabled` chứ KHÔNG phải `disabled`: nút vẫn nhận Tab và focus nên người dùng
               bàn phím / trình đọc màn hình VẪN tới được lý do. `disabled` thì lý do không tồn tại
               với họ (đo thật 16/08). Không gắn `onClick` ⇒ bấm không làm gì. */
            aria-disabled
            aria-describedby={`${idLyDo}-${t.khoa}`}
            style={{ ...KHUON_LOC, opacity: 'var(--mo-vo-hieu)', cursor: 'default' }}
          >
            <span style={{ color: 'var(--t3)', fontSize: 'var(--fs-2xs)' }}>{tr(t.ten.vi, t.ten.en)}</span>
            {tr('Tất cả', 'All')}
            <span aria-hidden style={{ color: 'var(--t4)', fontSize: 10 }}>▾</span>
          </button>
        ))}
        {/* Lý do hiện thành CHỮ THẬT ngay cạnh, không giấu sau hover — bản thân nó cũng là câu trả
            lời cho "vì sao ba nút này mờ", nên người sáng mắt cũng cần đọc được. */}
        <span
          style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)', flexBasis: '100%' }}
        >
          {TRUC_LOC.filter((t) => !t.locDuoc).map((t) => (
            <span key={t.khoa} id={`${idLyDo}-${t.khoa}`} style={{ display: 'block' }}>
              {tr(t.ten.vi, t.ten.en)}: {tr(t.liDoMo!.vi, t.liDoMo!.en)}
            </span>
          ))}
        </span>
      </div>

      <div
        role="list"
        aria-label={tr('8 gói Collection+', 'Eight Collection+ packs')}
        style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
      >
        {goiHien.map((g) => {
          const Icon = GOI_ICON[g.khoa];
          const so = DEM_MUC[g.khoa] ?? null;
          return (
            <article
              key={g.khoa}
              role="listitem"
              style={{
                display: 'flex', flexDirection: 'column',
                border: '1px solid var(--border)', borderRadius: 'var(--r-3)',
                background: 'var(--card)', overflow: 'hidden',
              }}
            >
              <div
                aria-hidden
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  aspectRatio: '4 / 3', background: 'var(--field)',
                  borderBottom: '1px solid var(--vien-mo)', color: 'var(--t4)',
                }}
              >
                {/* soi-mien-tru: F-ICON-SIZE — glyph TRANG TRÍ lấp ô thẻ 16:9, không gắn hạng điều khiển */}
                <Icon size={34} strokeWidth={1.1} />
              </div>
              <div style={{ display: 'grid', gap: 5, padding: '10px 12px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--fs-ui)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)' }}>
                    {tr(g.ten.vi, g.ten.en)}
                  </span>
                  {/* Ô SỐ — `—` là *chưa biết*, không phải 0. Nhãn cho trình đọc nói rõ điều đó. */}
                  <span
                    style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}
                    aria-label={so === null
                      ? tr('chưa có số — gói chưa nối kho', 'no count yet — pack not connected to a store')
                      : tr(`${so} mục`, `${so} items`)}
                  >
                    {soHoacGach(so)}
                  </span>
                </div>
                <code style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  {maCollection(g.maLoai, 1)}
                </code>
                <p style={{ margin: 0, fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>{tr(g.moTa.vi, g.moTa.en)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                  {/* Chip khuôn bản vẽ: viền + chấm, KHÔNG tô nền màu. Chấm màu `--t3` (đằng nào
                      cũng có chữ đứng cạnh — màu không phải kênh duy nhất). */}
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '1px 8px',
                      fontSize: 'var(--fs-2xs)', color: 'var(--t2)', background: 'var(--field)',
                      border: '1px solid var(--border)', borderRadius: 'var(--r-full)',
                    }}
                  >
                    <span aria-hidden style={{ width: 6, height: 6, borderRadius: 'var(--r-full)', background: 'var(--t3)' }} />
                    {tr('chưa nối kho', 'not connected')}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Ba mức chia sẻ của một gói — khai bằng CHỮ ở chân tầng, vì chưa gói nào có mục để gắn
          quyền thật. Nói ra để người dùng biết trục quyền tồn tại, không giả vờ nó đang chạy. */}
      <p style={{ margin: '14px 0 0', fontSize: 'var(--fs-2xs)', color: 'var(--t4)' }}>
        {tr('Mức chia sẻ của một gói', 'Sharing levels of a pack')}:{' '}
        {QUYEN_GOI.map((q) => tr(q.ten.vi, q.ten.en)).join(' · ')} —{' '}
        {tr('gán được khi gói có mục đầu tiên.', 'assignable once a pack has its first item.')}
      </p>
    </section>
  );
}
